import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'streak'; // 'streak' or 'claims'
    const limit = parseInt(searchParams.get('limit') || '10');

    if (type === 'streak') {
      // Get top streaks from ALL check-ins (not just today)
      // Show the latest streak for each FID
      const { data: allCheckIns, error } = await supabase
        .from('checkins')
        .select('fid, streak, check_in_date')
        .order('check_in_date', { ascending: false });

      if (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      // Get the latest streak for each unique FID
      const latestStreaks = new Map<number, { fid: number; streak: number }>();
      
      (allCheckIns || []).forEach((checkIn) => {
        if (!latestStreaks.has(checkIn.fid)) {
          latestStreaks.set(checkIn.fid, {
            fid: checkIn.fid,
            streak: checkIn.streak || 0,
          });
        }
      });

      // Convert to array and sort by streak (highest first)
      const topStreaks = Array.from(latestStreaks.values())
        .sort((a, b) => b.streak - a.streak)
        .slice(0, limit);

      return NextResponse.json({
        type: 'streak',
        leaderboard: topStreaks
      });
    } else {
      // Get top claimers by total claims
      const { data: topClaimers, error } = await supabase
        .from('claims')
        .select('fid, amount')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Leaderboard error:', error);
        return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 });
      }

      // Aggregate by FID
      const aggregated = (topClaimers || []).reduce((acc: Record<number, { fid: number; totalClaims: number; totalAmount: number }>, claim) => {
        if (!acc[claim.fid]) {
          acc[claim.fid] = { fid: claim.fid, totalClaims: 0, totalAmount: 0 };
        }
        acc[claim.fid].totalClaims += 1;
        acc[claim.fid].totalAmount += claim.amount || 0;
        return acc;
      }, {});

      const sorted = Object.values(aggregated)
        .sort((a, b) => b.totalAmount - a.totalAmount)
        .slice(0, limit);

      return NextResponse.json({
        type: 'claims',
        leaderboard: sorted
      });
    }
  } catch (error) {
    console.error('Leaderboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
