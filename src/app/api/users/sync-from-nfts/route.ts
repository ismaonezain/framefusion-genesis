import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUsersFromCache, saveUsersToCache } from '@/lib/user-cache';
import { fetchUsersFromNeynar } from '@/lib/neynar';

// Neynar API key - hardcoded for simplicity
const NEYNAR_API_KEY = '';
const CACHE_EXPIRY_DAYS = 7;

/**
 * POST /api/users/sync-from-nfts
 * 
 * Sync user data from FIDs in the NFTs table
 * - Fetches all unique FIDs from nfts table
 * - Checks which ones are missing or stale in cache
 * - Fetches from Neynar and saves to cache
 * 
 * Body:
 * - forceRefresh?: boolean - Force refresh all users even if cached
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[Sync from NFTs] NEYNAR_API_KEY available?', !!NEYNAR_API_KEY);
    console.log('[Sync from NFTs] NEYNAR_API_KEY value:', NEYNAR_API_KEY ? `${NEYNAR_API_KEY.substring(0, 8)}...` : 'MISSING');
    
    if (!NEYNAR_API_KEY) {
      console.error('[Sync from NFTs] ❌ NEYNAR_API_KEY is not set in environment variables!');
      return NextResponse.json(
        { 
          error: 'NEYNAR_API_KEY is not configured', 
          message: 'Please set NEYNAR_API_KEY in your environment variables (Configure → Settings)'
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { forceRefresh = false } = body;

    console.log('[Sync from NFTs] Starting user sync...');

    // Step 1: Get all unique FIDs from nfts table (remove default 1000 limit)
    let allNfts: Array<{ fid: number | null }> = [];
    let hasMore = true;
    let offset = 0;
    const pageSize = 1000;

    // Fetch all NFTs in pages to bypass Supabase default limit
    while (hasMore) {
      const { data: nftsPage, error: nftsError } = await supabase
        .from('nfts')
        .select('fid')
        .not('fid', 'is', null)
        .range(offset, offset + pageSize - 1);

      if (nftsError) {
        console.error('[Sync from NFTs] Error fetching NFTs:', nftsError);
        return NextResponse.json(
          { error: 'Failed to fetch NFTs from database', details: nftsError.message },
          { status: 500 }
        );
      }

      if (!nftsPage || nftsPage.length === 0) {
        hasMore = false;
      } else {
        allNfts = allNfts.concat(nftsPage);
        console.log(`[Sync from NFTs] Fetched ${nftsPage.length} NFTs (total so far: ${allNfts.length})`);
        
        if (nftsPage.length < pageSize) {
          hasMore = false;
        } else {
          offset += pageSize;
        }
      }
    }

    const nfts = allNfts;
    const nftsError = null;

    if (nftsError) {
      console.error('[Sync from NFTs] Error fetching NFTs:', nftsError);
      return NextResponse.json(
        { error: 'Failed to fetch NFTs from database', details: nftsError.message },
        { status: 500 }
      );
    }

    if (!nfts || nfts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No NFTs found in database',
        total_fids: 0,
        synced: 0,
        skipped: 0,
      });
    }

    // Get unique FIDs
    const uniqueFids = Array.from(new Set(nfts.map((nft) => nft.fid).filter((fid): fid is number => fid !== null)));
    console.log(`[Sync from NFTs] Found ${uniqueFids.length} unique FIDs in nfts table`);

    // Step 2: Check which FIDs need refresh
    let fidsToSync = uniqueFids;

    if (!forceRefresh) {
      // Get cached users
      const cachedUsers = await getUsersFromCache(uniqueFids);
      
      // Filter out fresh cache (not stale)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() - CACHE_EXPIRY_DAYS);
      
      const freshFids = new Set(
        cachedUsers
          .filter((user) => {
            const updatedAt = new Date(user.updated_at);
            return updatedAt > expiryDate;
          })
          .map((user) => user.fid)
      );

      // Only sync FIDs that are missing or stale
      fidsToSync = uniqueFids.filter((fid) => !freshFids.has(fid));
      
      console.log(`[Sync from NFTs] ${freshFids.size} users already cached and fresh`);
      console.log(`[Sync from NFTs] ${fidsToSync.length} users need sync`);
    }

    if (fidsToSync.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All users are already cached and up to date',
        total_fids: uniqueFids.length,
        synced: 0,
        skipped: uniqueFids.length,
      });
    }

    // Step 3: Fetch from Neynar in batches (max 100 per request)
    const batches: number[][] = [];
    for (let i = 0; i < fidsToSync.length; i += 100) {
      batches.push(fidsToSync.slice(i, i + 100));
    }

    console.log(`[Sync from NFTs] Fetching ${fidsToSync.length} users in ${batches.length} batches`);

    let totalSynced = 0;
    const syncedUsers = [];

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`[Sync from NFTs] Processing batch ${i + 1}/${batches.length} (${batch.length} users)`);

      try {
        const neynarUsers = await fetchUsersFromNeynar(batch, NEYNAR_API_KEY);
        await saveUsersToCache(neynarUsers);
        
        totalSynced += neynarUsers.length;
        syncedUsers.push(...neynarUsers.map((user) => ({
          fid: user.fid,
          username: user.username,
          pfp_url: user.pfp_url,
        })));

        // Small delay between batches to avoid rate limits
        if (i < batches.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error) {
        console.error(`[Sync from NFTs] Error in batch ${i + 1}:`, error);
        // Continue with next batch even if one fails
      }
    }

    console.log(`[Sync from NFTs] ✅ Sync complete! ${totalSynced}/${fidsToSync.length} users synced (${batches.length} batches processed)`);
    console.log(`[Sync from NFTs] Total unique FIDs in database: ${uniqueFids.length}`);
    console.log(`[Sync from NFTs] Fresh cached users (skipped): ${uniqueFids.length - fidsToSync.length}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSynced} users from NFTs table (${batches.length} batches processed)`,
      total_fids: uniqueFids.length,
      synced: totalSynced,
      skipped: uniqueFids.length - fidsToSync.length,
      batches_processed: batches.length,
      batch_size: 100,
      users: syncedUsers.slice(0, 100), // Return first 100 users to avoid huge response
      total_synced_users: syncedUsers.length,
    });
  } catch (error) {
    console.error('[Sync from NFTs] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
