import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkNFTBalance } from '@/lib/tria-contract';
import type { Address } from 'viem';

const DAILY_CLAIM_LIMIT = 300;
const CLAIM_AMOUNT = 50000; // 50k TRIA per claim

export async function POST(req: Request) {
  try {
    const { fid, address } = await req.json();

    if (!fid || !address) {
      return NextResponse.json({ error: 'FID and address are required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    // 1. Check if user holds NFT
    const holdsNFT = await checkNFTBalance(address as Address);
    if (!holdsNFT) {
      return NextResponse.json({
        success: false,
        error: 'You must hold a FrameFusion Genesis NFT to claim'
      }, { status: 403 });
    }

    // 2. Check if user checked in today
    const { data: todayCheckIn } = await supabase
      .from('checkins')
      .select('*')
      .eq('fid', fid)
      .eq('check_in_date', today)
      .single();

    if (!todayCheckIn) {
      return NextResponse.json({
        success: false,
        error: 'You must check in today before claiming'
      }, { status: 403 });
    }

    // 3. Check if already claimed today
    const { data: existingClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('fid', fid)
      .eq('claim_date', today)
      .single();

    if (existingClaim) {
      return NextResponse.json({
        success: false,
        error: 'Already claimed today'
      }, { status: 403 });
    }

    // 4. Check daily claim limit
    const { count: todayClaimsCount } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('claim_date', today);

    if ((todayClaimsCount || 0) >= DAILY_CLAIM_LIMIT) {
      return NextResponse.json({
        success: false,
        error: 'Daily claim limit reached (300/300)'
      }, { status: 403 });
    }

    // 5. Record claim (without tx_hash initially, to be updated after transaction)
    const { data: claim, error } = await supabase
      .from('claims')
      .insert([
        {
          fid,
          address,
          claim_date: today,
          amount: CLAIM_AMOUNT,
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to record claim' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claim,
      amount: CLAIM_AMOUNT,
      message: `Successfully recorded claim for ${CLAIM_AMOUNT} TRIA`
    });
  } catch (error) {
    console.error('Claim error:', error);
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

    // Check if already claimed today
    const { data: todayClaim } = await supabase
      .from('claims')
      .select('*')
      .eq('fid', fid)
      .eq('claim_date', today)
      .single();

    // Get total claims for user
    const { count: totalClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('fid', fid);

    // Get today's total claims count
    const { count: todayTotalClaims } = await supabase
      .from('claims')
      .select('*', { count: 'exact', head: true })
      .eq('claim_date', today);

    return NextResponse.json({
      claimed: !!todayClaim,
      claim: todayClaim,
      totalClaims: totalClaims || 0,
      todayTotalClaims: todayTotalClaims || 0,
      slotsRemaining: DAILY_CLAIM_LIMIT - (todayTotalClaims || 0)
    });
  } catch (error) {
    console.error('Claim status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Update claim with transaction hash
export async function PATCH(req: Request) {
  try {
    const { fid, txHash, status } = await req.json();

    if (!fid || !txHash) {
      return NextResponse.json({ error: 'FID and txHash are required' }, { status: 400 });
    }

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('claims')
      .update({ 
        tx_hash: txHash,
        status: status || 'completed'
      })
      .eq('fid', fid)
      .eq('claim_date', today)
      .select()
      .single();

    if (error) {
      console.error('Update claim error:', error);
      return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      claim: data
    });
  } catch (error) {
    console.error('Update claim error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
