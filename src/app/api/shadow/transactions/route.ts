import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!fid) {
      return NextResponse.json(
        { success: false, error: 'Missing fid parameter' },
        { status: 400 }
      );
    }

    // Get transactions
    const { data: transactions, error: txError } = await supabase
      .from('shadow_transactions')
      .select('*')
      .eq('fid', parseInt(fid))
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (txError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transactions', details: txError.message },
        { status: 500 }
      );
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('shadow_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('fid', parseInt(fid));

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get SHADOW transactions error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
