import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { NFT_CONTRACT_ABI_V2, NFT_CONTRACT_ADDRESS_V2 } from '@/lib/nft-contract-v2';

// Supabase client with service key for unrestricted access
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase environment variables not configured');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Viem client for reading V2 contract
const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

/**
 * POST /api/admin/populate-traits
 * Fetches metadata from V2 contract and populates traits in database
 * 
 * This is useful for NFTs that were minted before traits columns were added
 */
export async function POST() {
  try {
    const supabase = getSupabaseClient();

    // Find all minted NFTs that don't have traits populated
    const { data: nftsWithoutTraits, error: fetchError } = await supabase
      .from('nfts')
      .select('fid, token_id')
      .eq('minted', true)
      .is('character_class', null);

    if (fetchError) {
      console.error('[Populate Traits] Error fetching NFTs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch NFTs from database' },
        { status: 500 }
      );
    }

    if (!nftsWithoutTraits || nftsWithoutTraits.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All NFTs already have traits populated',
        updated: 0,
      });
    }

    console.log(`[Populate Traits] Found ${nftsWithoutTraits.length} NFTs without traits`);

    // Fetch metadata from V2 contract for each NFT
    const updates = [];

    for (const nft of nftsWithoutTraits) {
      try {
        // Read metadata from V2 contract
        const metadata = await publicClient.readContract({
          address: NFT_CONTRACT_ADDRESS_V2 as `0x${string}`,
          abi: NFT_CONTRACT_ABI_V2,
          functionName: 'getMetadataByFid',
          args: [BigInt(nft.fid)],
        });

        // Extract traits from contract metadata
        const traits = {
          fid: nft.fid,
          character_class: metadata.characterClass || null,
          gender: metadata.gender || null,
          background: metadata.background || null,
          color_palette: metadata.colorPalette || null,
          clothing: metadata.clothing || null,
          accessories: metadata.accessories || null,
        };

        updates.push(traits);
        console.log(`[Populate Traits] Fetched traits for FID ${nft.fid}:`, traits);
      } catch (error) {
        console.error(`[Populate Traits] Error fetching metadata for FID ${nft.fid}:`, error);
        // Continue with next NFT even if one fails
      }
    }

    // Batch update database
    if (updates.length > 0) {
      for (const update of updates) {
        const { error: updateError } = await supabase
          .from('nfts')
          .update({
            character_class: update.character_class,
            gender: update.gender,
            background: update.background,
            color_palette: update.color_palette,
            clothing: update.clothing,
            accessories: update.accessories,
          })
          .eq('fid', update.fid);

        if (updateError) {
          console.error(`[Populate Traits] Error updating FID ${update.fid}:`, updateError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully populated traits for ${updates.length} NFTs`,
      updated: updates.length,
      total: nftsWithoutTraits.length,
    });
  } catch (error) {
    console.error('[Populate Traits] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
