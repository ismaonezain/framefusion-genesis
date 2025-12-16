import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const weekNumber = searchParams.get('week');

    let query = supabase
      .from('raffle_winners')
      .select('*')
      .order('drawn_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (weekNumber) {
      query = query.eq('week_number', parseInt(weekNumber));
    }

    const { data: winners, error: winnersError } = await query;

    if (winnersError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch winners', details: winnersError.message },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('raffle_winners')
      .select('*', { count: 'exact', head: true });

    if (weekNumber) {
      countQuery = countQuery.eq('week_number', parseInt(weekNumber));
    }

    const { count, error: countError } = await countQuery;

    return NextResponse.json({
      success: true,
      winners: winners || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Get raffle winners error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
