import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createPublicClient, http, type Address } from 'viem';
import { base } from 'viem/chains';
import { REWARDS_CONTRACT_ADDRESS, TRIA_REWARDS_ABI } from '@/lib/tria-rewards-contract';

// ✅ Base RPC Client
const publicClient = createPublicClient({
  chain: base,
  transport: http('https://mainnet.base.org'),
});

export async function POST(req: Request) {
  try {
    const { fid } = await req.json();

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if already checked in today
    const { data: existingCheckIn } = await supabase
      .from('checkins')
      .select('*')
      .eq('fid', fid)
      .eq('check_in_date', today)
      .single();

    if (existingCheckIn) {
      return NextResponse.json({
        success: false,
        error: 'Already checked in today',
        checkedIn: true
      });
    }

    // ✅ Get user's wallet address from NFTs table to read on-chain streak
    const { data: nftData } = await supabase
      .from('nfts')
      .select('owner_address')
      .eq('fid', fid)
      .eq('minted', true)
      .single();

    let onChainStreak = 0;
    
    if (nftData && nftData.owner_address) {
      try {
        console.log(`[Check-in] Reading on-chain streak for FID ${fid}, address ${nftData.owner_address}`);
        
        // ✅ Read getUserStreak from TRIARewards contract
        const streak = await publicClient.readContract({
          address: REWARDS_CONTRACT_ADDRESS,
          abi: TRIA_REWARDS_ABI,
          functionName: 'getUserStreak',
          args: [nftData.owner_address as Address],
        });

        onChainStreak = Number(streak);
        console.log(`[Check-in] On-chain streak for FID ${fid}: ${onChainStreak}`);
      } catch (error) {
        console.warn(`[Check-in] Failed to read on-chain streak for FID ${fid}:`, error);
        // Continue with database-based streak calculation if contract read fails
      }
    }

    // Get yesterday's date to check for streak
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    // Check if user checked in yesterday
    const { data: yesterdayCheckIn } = await supabase
      .from('checkins')
      .select('streak')
      .eq('fid', fid)
      .eq('check_in_date', yesterdayStr)
      .single();

    // ✅ Use on-chain streak if available, otherwise calculate from database
    let newStreak = onChainStreak > 0 ? onChainStreak : 1;
    
    if (onChainStreak === 0 && yesterdayCheckIn) {
      // Fallback to database-based streak if on-chain streak is not available
      newStreak = (yesterdayCheckIn.streak || 0) + 1;
    }

    // Insert new check-in with on-chain streak data
    const { data, error } = await supabase
      .from('checkins')
      .insert([
        {
          fid,
          check_in_date: today,
          streak: newStreak
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
    }

    console.log(`[Check-in] ✅ FID ${fid} checked in successfully with streak ${newStreak}`);

    return NextResponse.json({
      success: true,
      checkedIn: true,
      streak: newStreak,
      onChainStreak: onChainStreak > 0 ? onChainStreak : null,
      checkIn: data
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // Check today's check-in
    const { data: todayCheckIn } = await supabase
      .from('checkins')
      .select('*')
      .eq('fid', fid)
      .eq('check_in_date', today)
      .single();

    // Get current streak (from today if exists, otherwise yesterday)
    let currentStreak = 0;
    if (todayCheckIn) {
      currentStreak = todayCheckIn.streak || 0;
    } else {
      // Check yesterday for streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const { data: yesterdayCheckIn } = await supabase
        .from('checkins')
        .select('streak')
        .eq('fid', fid)
        .eq('check_in_date', yesterdayStr)
        .single();
      
      if (yesterdayCheckIn) {
        currentStreak = yesterdayCheckIn.streak || 0;
      }
    }

    // Get total check-ins
    const { count: totalCheckIns } = await supabase
      .from('checkins')
      .select('*', { count: 'exact', head: true })
      .eq('fid', fid);

    return NextResponse.json({
      checkedIn: !!todayCheckIn,
      streak: currentStreak,
      totalCheckIns: totalCheckIns || 0
    });
  } catch (error) {
    console.error('Check-in status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
