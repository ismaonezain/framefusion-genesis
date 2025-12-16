/**
 * Verify and Sync Monsters with Blockchain
 * Cleans up orphaned database entries that don't exist on-chain
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';
import { FRAMESHADOWS_CONTRACT } from '@/lib/monster-contract';

const SUPABASE_URL = 'https://.supabase.co';
const SUPABASE_KEY = '..';

const publicClient = createPublicClient({
  chain: base,
  transport: http(),
});

export async function POST(request: NextRequest) {
  console.log('[Verify Blockchain] Starting verification...');

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get all monsters from database
    const { data: monsters, error: fetchError } = await supabase
      .from('monsters')
      .select('*')
      .order('token_id', { ascending: true });

    if (fetchError) {
      console.error('[Verify Blockchain] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch monsters from database' },
        { status: 500 }
      );
    }

    if (!monsters || monsters.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No monsters found in database',
        verified: 0,
        orphaned: 0,
        deleted: 0,
      });
    }

    console.log(`[Verify Blockchain] Found ${monsters.length} monsters in database`);

    const verified: string[] = [];
    const orphaned: string[] = [];
    const deleted: string[] = [];

    // Check each monster against blockchain
    for (const monster of monsters) {
      try {
        const tokenId = BigInt(monster.token_id);

        // Check if token exists on blockchain by checking owner
        let exists = false;
        try {
          const owner = await publicClient.readContract({
            address: FRAMESHADOWS_CONTRACT.address as `0x${string}`,
            abi: FRAMESHADOWS_CONTRACT.abi,
            functionName: 'ownerOf',
            args: [tokenId],
          }) as string;

          // If we got an owner address and it's not zero address, token exists
          exists = owner && owner !== '0x0000000000000000000000000000000000000000';
        } catch (ownerError) {
          // If ownerOf reverts, token doesn't exist
          exists = false;
        }

        if (exists) {
          // Token exists on blockchain - verified!
          verified.push(monster.token_id);
          console.log(`[Verify Blockchain] ✅ Token #${monster.token_id} verified on-chain`);

          // Update minted status if not already set
          if (!monster.minted) {
            await supabase
              .from('monsters')
              .update({ minted: true })
              .eq('id', monster.id);
          }
        } else {
          // Token does NOT exist on blockchain - orphaned data!
          orphaned.push(monster.token_id);
          console.log(`[Verify Blockchain] ❌ Token #${monster.token_id} NOT found on-chain - orphaned!`);

          // Delete orphaned entry
          const { error: deleteError } = await supabase
            .from('monsters')
            .delete()
            .eq('id', monster.id);

          if (deleteError) {
            console.error(`[Verify Blockchain] Failed to delete orphaned token #${monster.token_id}:`, deleteError);
          } else {
            deleted.push(monster.token_id);
            console.log(`[Verify Blockchain] 🗑️ Deleted orphaned token #${monster.token_id} from database`);
          }
        }
      } catch (error) {
        console.error(`[Verify Blockchain] Error checking token #${monster.token_id}:`, error);
        // Continue with next token
      }
    }

    const summary = {
      success: true,
      message: 'Blockchain verification complete',
      total: monsters.length,
      verified: verified.length,
      orphaned: orphaned.length,
      deleted: deleted.length,
      verifiedTokens: verified,
      orphanedTokens: orphaned,
      deletedTokens: deleted,
    };

    console.log('[Verify Blockchain] Summary:', summary);

    return NextResponse.json(summary);
  } catch (error: unknown) {
    console.error('[Verify Blockchain] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
