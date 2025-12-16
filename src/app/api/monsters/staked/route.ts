import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // Get all staked monsters for user
    const { data: stakedMonsters, error: stakedError } = await supabase
      .from('staked_monsters')
      .select(`
        *,
        monsters:monster_id (*)
      `)
      .eq('owner_fid', parseInt(fid))
      .eq('is_active', true)
      .order('staked_at', { ascending: false });

    if (stakedError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch staked monsters', details: stakedError.message },
        { status: 500 }
      );
    }

    // Add unstake status to each monster
    const now = new Date();
    const monstersWithStatus = (stakedMonsters || []).map((staked: any) => ({
      ...staked,
      canUnstake: now >= new Date(staked.unstake_available_at),
      remainingLockHours: Math.max(
        0,
        Math.ceil((new Date(staked.unstake_available_at).getTime() - now.getTime()) / (1000 * 60 * 60))
      ),
    }));

    return NextResponse.json({
      success: true,
      stakedMonsters: monstersWithStatus,
      totalStaked: monstersWithStatus.length,
    });
  } catch (error) {
    console.error('Get staked monsters error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
