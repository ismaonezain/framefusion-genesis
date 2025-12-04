import { NextRequest, NextResponse } from 'next/server';
import { batchGetUsersWithCache } from '@/lib/user-cache';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || '';

/**
 * POST /api/users/sync
 * 
 * Sync user data from Neynar to Supabase cache
 * Accepts array of FIDs or fetches all users from NFT table
 * 
 * Body:
 * - fids?: number[] - Optional array of FIDs to sync
 * - forceRefresh?: boolean - Force refresh from Neynar even if cached
 */
export async function POST(request: NextRequest) {
  try {
    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: 'NEYNAR_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { fids = [], forceRefresh = false } = body;

    if (!Array.isArray(fids)) {
      return NextResponse.json(
        { error: 'fids must be an array' },
        { status: 400 }
      );
    }

    if (fids.length === 0) {
      return NextResponse.json(
        { error: 'No FIDs provided' },
        { status: 400 }
      );
    }

    console.log(`[User Sync] Syncing ${fids.length} users (forceRefresh: ${forceRefresh})`);

    // Fetch and cache users
    const users = await batchGetUsersWithCache(fids, NEYNAR_API_KEY, forceRefresh);

    console.log(`[User Sync] Successfully synced ${users.length} users`);

    return NextResponse.json({
      success: true,
      synced: users.length,
      users: users.map((user) => ({
        fid: user.fid,
        username: user.username,
        pfp_url: user.pfp_url,
        updated_at: user.updated_at,
      })),
    });
  } catch (error) {
    console.error('[User Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to sync users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/users/sync?fids=123,456,789
 * 
 * Get cached user data
 * Query params:
 * - fids: comma-separated list of FIDs
 */
export async function GET(request: NextRequest) {
  try {
    if (!NEYNAR_API_KEY) {
      return NextResponse.json(
        { error: 'NEYNAR_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const fidsParam = searchParams.get('fids');

    if (!fidsParam) {
      return NextResponse.json(
        { error: 'fids query parameter is required' },
        { status: 400 }
      );
    }

    const fids = fidsParam.split(',').map((fid) => parseInt(fid.trim())).filter((fid) => !isNaN(fid));

    if (fids.length === 0) {
      return NextResponse.json(
        { error: 'No valid FIDs provided' },
        { status: 400 }
      );
    }

    console.log(`[User Sync] Getting ${fids.length} cached users`);

    // Get users with cache (will fetch from Neynar if not cached)
    const users = await batchGetUsersWithCache(fids, NEYNAR_API_KEY, false);

    return NextResponse.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('[User Sync] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get users',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
