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

    // Get or create balance record
    let { data: balance, error: balanceError } = await supabase
      .from('shadow_balances')
      .select('*')
      .eq('fid', parseInt(fid))
      .single();

    if (balanceError && balanceError.code === 'PGRST116') {
      // No balance found, create one
      const { data: newBalance, error: createError } = await supabase
        .from('shadow_balances')
        .insert({
          fid: parseInt(fid),
          balance: 0,
          total_earned: 0,
          total_spent: 0,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create balance', details: createError.message },
          { status: 500 }
        );
      }

      balance = newBalance;
    } else if (balanceError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch balance', details: balanceError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      balance: balance.balance,
      totalEarned: balance.total_earned,
      totalSpent: balance.total_spent,
      lastUpdated: balance.last_updated,
    });
  } catch (error) {
    console.error('Get SHADOW balance error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
