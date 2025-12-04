import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUsersFromCache } from '@/lib/user-cache';



/**
 * Get Top Streaks Leaderboard from Check-ins Table
 * 
 * This reads streak data directly from the `checkins` table. Streaks are
 * automatically updated when users check in (via /api/checkin), which reads
 * on-chain streak from TRIARewards contract.
 * 
 * Flow:
 * 1. User checks in → /api/checkin reads getUserStreak() from contract
 * 2. Streak saved to checkins table
 * 3. Leaderboard reads from checkins table (this endpoint)
 * 
 * Benefits:
 * - No manual sync needed
 * - Instant loading (database read)
 * - No rate limiting
 * - Auto-updated on every check-in
 */

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    console.log('[Leaderboard Streaks] Fetching top streaks from checkins table...');

    // ✅ Get latest check-in record for each FID with their current streak
    // We want the most recent check-in per user to get their latest streak
    const { data: allCheckIns, error: fetchError } = await supabase
      .from('checkins')
      .select('fid, streak, check_in_date')
      .order('check_in_date', { ascending: false });

    if (fetchError) {
      console.error('[Leaderboard Streaks] Error fetching check-ins:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch streak data' }, { status: 500 });
    }

    if (!allCheckIns || allCheckIns.length === 0) {
      console.log('[Leaderboard Streaks] No check-ins found yet.');
      return NextResponse.json({
        type: 'streak',
        leaderboard: [],
        source: 'checkins_table',
        message: 'No check-ins yet. Users need to check in first!',
      });
    }

    // ✅ Get latest streak for each unique FID
    const latestStreaksMap = new Map<number, { fid: number; streak: number }>();
    
    for (const checkIn of allCheckIns) {
      if (!latestStreaksMap.has(checkIn.fid)) {
        latestStreaksMap.set(checkIn.fid, {
          fid: checkIn.fid,
          streak: checkIn.streak || 0,
        });
      }
    }

    // ✅ Convert to array, filter streak > 0, and sort by highest streak
    const topStreaks = Array.from(latestStreaksMap.values())
      .filter(entry => entry.streak > 0)
      .sort((a, b) => b.streak - a.streak)
      .slice(0, limit);

    console.log(`[Leaderboard Streaks] Returning top ${topStreaks.length} streaks`);

    // ✅ Fetch user data from Supabase cache ONLY (no Neynar API calls)
    const fidsArray = topStreaks.map(entry => entry.fid);
    let usersData: Record<number, { username: string; pfp_url: string }> = {};

    console.log('[Leaderboard Streaks] FIDs to fetch:', fidsArray.join(','));

    if (fidsArray.length > 0) {
      try {
        console.log('[Leaderboard Streaks] Fetching user data from Supabase cache only...');
        
        // Use ONLY cached user data from Supabase (no Neynar API calls)
        const cachedUsers = await getUsersFromCache(fidsArray);
        
        console.log(`[Leaderboard Streaks] Got ${cachedUsers.length} users from cache`);

        // Map FID to user data
        for (const user of cachedUsers) {
          usersData[user.fid] = {
            username: user.username || `fid-${user.fid}`,
            pfp_url: user.pfp_url || '',
          };
        }
        
        console.log('[Leaderboard Streaks] usersData map:', usersData);
      } catch (error) {
        console.error('[Leaderboard Streaks] Error fetching user data from cache:', error);
        if (error instanceof Error) {
          console.error('[Leaderboard Streaks] Error details:', error.message, error.stack);
        }
      }
    } else {
      console.log('[Leaderboard Streaks] No FIDs to fetch');
    }

    return NextResponse.json({
      type: 'streak',
      leaderboard: topStreaks.map(entry => ({
        fid: entry.fid,
        streak: entry.streak,
        username: usersData[entry.fid]?.username || `fid-${entry.fid}`,
        pfp_url: usersData[entry.fid]?.pfp_url || '',
      })),
      source: 'checkins_table',
      totalUsers: latestStreaksMap.size,
    });
  } catch (error) {
    console.error('[Leaderboard Streaks] Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
