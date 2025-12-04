import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { supabase } from '@/lib/supabase';
import { NFT_CONTRACT_ADDRESS_V2, NFT_CONTRACT_ABI_V2 } from '@/lib/nft-contract-v2';

/**
 * Admin API to sync NFTs from V2 contract to database WITH STREAMING RESPONSE
 * 
 * This fixes the FUNCTION_INVOCATION_TIMEOUT error by using streaming response
 * to keep connection alive while processing 3000+ NFTs.
 * 
 * NEW: Streaming response - sends progress updates in real-time, no timeout!
 * 
 * Usage: POST /api/admin/sync-nfts?batchSize=100&startTokenId=0&batchDelayMs=3000
 * 
 * Query params:
 * - batchSize: Number of NFTs to process per batch (default: 100, max: 500)
 * - startTokenId: Starting token ID (default: 0 = auto-resume from last checkpoint)
 * - batchDelayMs: Delay between batches in milliseconds (default: 3000ms)
 * 
 * What it does:
 * 1. Streams progress updates to client (no timeout!)
 * 2. Auto-resumes from last synced token_id (saved in checkpoint)
 * 3. Processes NFTs sequentially by token_id with rate limit handling
 * 4. Saves checkpoint after every 10 tokens processed
 * 5. Returns final summary when complete or paused
 */

interface SyncProgress {
  type: 'progress' | 'complete' | 'error';
  message: string;
  data?: {
    totalFIDs?: number;
    processed?: number;
    updated?: number;
    skipped?: number;
    notMinted?: number;
    errors?: string[];
    usedCache?: boolean;
    currentFID?: number;
    percentage?: number;
  };
}

// Utility function to sleep/delay
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry logic for rate limiting
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 5,
  baseDelay: number = 2000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      const isRateLimit = error instanceof Error && 
        (error.message.includes('rate limit') || 
         error.message.includes('429') ||
         error.message.includes('Too Many Requests') ||
         error.message.includes('over rate limit'));
      
      if (isRateLimit && i < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`⏸️ Rate limited, retrying in ${delay}ms (attempt ${i + 1}/${maxRetries})`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}

// Load last synced token_id from checkpoint
async function loadLastSyncedTokenId(): Promise<number | null> {
  try {
    console.log('🔍 Checking for last synced token_id...');
    
    const { data, error } = await supabase
      .from('sync_checkpoints')
      .select('*')
      .eq('checkpoint_type', 'nft_sync_token_progress')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ Error loading last token_id:', error);
      return null;
    }
    
    if (!data) return null;
    
    const lastTokenId = (data.checkpoint_data as { lastTokenId: number }).lastTokenId;
    console.log(`✅ Last synced token_id: ${lastTokenId}`);
    return lastTokenId;
  } catch (error) {
    console.error('❌ Error loading last token_id:', error);
    return null;
  }
}

// Save last synced token_id to checkpoint
async function saveLastSyncedTokenId(tokenId: number): Promise<void> {
  try {
    await supabase
      .from('sync_checkpoints')
      .delete()
      .eq('checkpoint_type', 'nft_sync_token_progress');
    
    const { error } = await supabase
      .from('sync_checkpoints')
      .insert({
        checkpoint_type: 'nft_sync_token_progress',
        checkpoint_data: { lastTokenId: tokenId },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    
    if (error) {
      console.error('❌ Error saving last token_id:', error);
    }
  } catch (error) {
    console.error('❌ Error saving last token_id:', error);
  }
}

async function syncSingleToken(
  publicClient: ReturnType<typeof createPublicClient>,
  tokenId: number
): Promise<{ success: boolean; updated: boolean; notMinted?: boolean; error?: string }> {
  try {

    // Get FID for this token
    let fidNumber: number;
    try {
      const fid = await retryWithBackoff(async () => {
        return await publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS_V2,
          abi: NFT_CONTRACT_ABI_V2,
          functionName: 'tokenIdToFid',
          args: [BigInt(tokenId)],
        }) as bigint;
      });
      
      fidNumber = Number(fid);
      if (fidNumber === 0) {
        return { success: true, updated: false, notMinted: true };
      }
    } catch (error) {
      return { success: true, updated: false, notMinted: true };
    }

    const tokenIdNumber = tokenId;

    // Get owner address
    const owner = await retryWithBackoff(async () => {
      return await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS_V2,
        abi: NFT_CONTRACT_ABI_V2,
        functionName: 'ownerOf',
        args: [BigInt(tokenId)],
      }) as string;
    });

    // Get metadata from contract
    const metadata = await retryWithBackoff(async () => {
      return await publicClient.readContract({
        address: NFT_CONTRACT_ADDRESS_V2,
        abi: NFT_CONTRACT_ABI_V2,
        functionName: 'getMetadata',
        args: [BigInt(tokenId)],
      }) as {
        fid: bigint;
        characterClass: string;
        classDescription: string;
        gender: string;
        background: string;
        backgroundDescription: string;
        colorPalette: string;
        colorVibe: string;
        clothing: string;
        accessories: string;
        items: string;
        mintedAt: bigint;
      };
    });

    // Check if NFT exists in database
    const { data: existingNFT, error: fetchError } = await supabase
      .from('nfts')
      .select('*')
      .eq('fid', fidNumber)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      return { success: false, updated: false, error: `FID ${fidNumber}: ${fetchError.message}` };
    }

    const updateData = {
      contract_address: NFT_CONTRACT_ADDRESS_V2,
      token_id: tokenIdNumber.toString(),
      minted: true,
      owner_address: owner.toLowerCase(),
      character_class: metadata.characterClass || '',
      class_description: metadata.classDescription || '',
      gender: metadata.gender || '',
      background: metadata.background || '',
      background_description: metadata.backgroundDescription || '',
      color_palette: metadata.colorPalette || '',
      color_vibe: metadata.colorVibe || '',
      clothing: metadata.clothing || '',
      accessories: metadata.accessories || '',
      items: metadata.items || '',
      minted_at: new Date(Number(metadata.mintedAt) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (existingNFT) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('nfts')
        .update(updateData)
        .eq('id', existingNFT.id);

      if (updateError) {
        return { success: false, updated: false, error: `FID ${fidNumber}: ${updateError.message}` };
      }

      return { success: true, updated: true };
    } else {
      // Create new record
      const insertData = {
        fid: fidNumber,
        ...updateData,
        created_at: new Date().toISOString(),
      };
      
      const { error: insertError } = await supabase
        .from('nfts')
        .insert(insertData);
      
      if (insertError) {
        return { success: false, updated: false, error: `FID ${fidNumber}: ${insertError.message}` };
      }
      
      return { success: true, updated: true };
    }
  } catch (error) {
    return {
      success: false,
      updated: false,
      error: `FID ${fidNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const batchSize = Math.min(Number(searchParams.get('batchSize')) || 100, 500);
  const startTokenId = Number(searchParams.get('startTokenId')) || 0;
  const batchDelayMs = Number(searchParams.get('batchDelayMs')) || 3000;

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendProgress = (progress: SyncProgress): void => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(progress)}\n\n`));
      };

      try {
        // Create public client
        const publicClient = createPublicClient({
          chain: base,
          transport: http(),
        });

        // Get total supply
        sendProgress({
          type: 'progress',
          message: '📡 Reading total supply from blockchain...',
        });
        
        const totalSupply = await retryWithBackoff(async () => {
          return await publicClient.readContract({
            address: NFT_CONTRACT_ADDRESS_V2,
            abi: NFT_CONTRACT_ABI_V2,
            functionName: 'totalSupply',
          }) as bigint;
        });
        
        const totalSupplyNumber = Number(totalSupply);
        
        if (totalSupplyNumber === 0) {
          sendProgress({
            type: 'complete',
            message: 'No NFTs minted yet',
            data: {
              totalFIDs: 0,
              processed: 0,
              updated: 0,
              skipped: 0,
              notMinted: 0,
              errors: [],
            },
          });
          controller.close();
          return;
        }
        
        // Determine start token (auto-resume or manual)
        let currentStartToken = startTokenId;
        
        if (currentStartToken === 0) {
          // Auto-resume from last checkpoint
          const lastTokenId = await loadLastSyncedTokenId();
          currentStartToken = lastTokenId ? lastTokenId + 1 : 1;
          
          if (lastTokenId) {
            sendProgress({
              type: 'progress',
              message: `🔄 Auto-resuming from token #${currentStartToken} (last synced: #${lastTokenId})`,
              data: { currentFID: currentStartToken },
            });
          }
        } else {
          sendProgress({
            type: 'progress',
            message: `🚀 Starting from token #${currentStartToken}`,
            data: { currentFID: currentStartToken },
          });
        }
        
        sendProgress({
          type: 'progress',
          message: `📊 Total supply: ${totalSupplyNumber} NFTs. Processing tokens ${currentStartToken} to ${Math.min(currentStartToken + batchSize - 1, totalSupplyNumber)}...`,
          data: { totalFIDs: totalSupplyNumber },
        });

        // Process tokens in batch
        const endToken = Math.min(currentStartToken + batchSize, totalSupplyNumber + 1);
        
        if (currentStartToken > totalSupplyNumber) {
          sendProgress({
            type: 'complete',
            message: `✅ All tokens synced! (Total: ${totalSupplyNumber})`,
            data: {
              totalFIDs: totalSupplyNumber,
              processed: totalSupplyNumber,
              updated: 0,
              skipped: 0,
              notMinted: 0,
              errors: [],
            },
          });
          controller.close();
          return;
        }

        let updated = 0;
        let skipped = 0;
        let notMinted = 0;
        const errors: string[] = [];
        
        for (let tokenId = currentStartToken; tokenId < endToken; tokenId++) {
          const result = await syncSingleToken(publicClient, tokenId);
          
          if (result.success) {
            if (result.updated) {
              updated++;
            } else if (result.notMinted) {
              notMinted++;
            } else {
              skipped++;
            }
          } else if (result.error) {
            errors.push(result.error);
          }
          
          // Save checkpoint every 10 tokens
          if (tokenId % 10 === 0) {
            await saveLastSyncedTokenId(tokenId);
          }
          
          // Send progress every 5 tokens
          if ((tokenId - currentStartToken + 1) % 5 === 0 || tokenId === endToken - 1) {
            const percentage = Math.round((tokenId / totalSupplyNumber) * 100);
            sendProgress({
              type: 'progress',
              message: `⚙️ Token #${tokenId}/${totalSupplyNumber} (${percentage}%) - ${updated} updated, ${notMinted} not minted`,
              data: {
                totalFIDs: totalSupplyNumber,
                processed: tokenId,
                updated,
                skipped,
                notMinted,
                percentage,
                currentFID: tokenId,
              },
            });
          }
        }
        
        // Save final checkpoint
        await saveLastSyncedTokenId(endToken - 1);

        // Check if there are more tokens
        const hasMore = endToken <= totalSupplyNumber;
        
        // Add delay before next batch (rate limit protection)
        if (hasMore && batchDelayMs > 0) {
          sendProgress({
            type: 'progress',
            message: `⏸️ Batch complete. Waiting ${batchDelayMs/1000}s before next batch...`,
          });
          await sleep(batchDelayMs);
        }

        sendProgress({
          type: 'complete',
          message: hasMore
            ? `✅ Batch complete! ${updated} updated, ${notMinted} not minted. Resume from token #${endToken}.`
            : `🎉 All done! ${updated} updated, ${notMinted} not minted. All ${totalSupplyNumber} tokens synced!`,
          data: {
            totalFIDs: totalSupplyNumber,
            processed: endToken - 1,
            updated,
            skipped,
            notMinted,
            errors,
          },
        });

        controller.close();
      } catch (error) {
        sendProgress({
          type: 'error',
          message: `❌ Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
