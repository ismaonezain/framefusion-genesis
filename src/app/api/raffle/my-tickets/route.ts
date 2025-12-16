import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentWeekNumber } from '@/lib/battle-system';

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

    const currentWeek = getCurrentWeekNumber();

    // Get user's tickets for current week
    const { data: tickets, error: ticketsError } = await supabase
      .from('raffle_tickets')
      .select('*')
      .eq('fid', parseInt(fid))
      .eq('week_number', currentWeek)
      .order('created_at', { ascending: false });

    if (ticketsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch tickets', details: ticketsError.message },
        { status: 500 }
      );
    }

    const totalTickets = (tickets || []).reduce((sum: number, t: any) => sum + t.tickets_count, 0);

    // Get total tickets in pool
    const { data: allTickets } = await supabase
      .from('raffle_tickets')
      .select('tickets_count')
      .eq('week_number', currentWeek);

    const totalPoolTickets = (allTickets || []).reduce((sum: number, t: any) => sum + t.tickets_count, 0);
    const winChance = totalPoolTickets > 0 ? (totalTickets / totalPoolTickets) * 100 : 0;

    return NextResponse.json({
      success: true,
      currentWeek,
      totalTickets,
      ticketEntries: tickets || [],
      totalPoolTickets,
      winChancePercent: winChance.toFixed(2),
    });
  } catch (error) {
    console.error('Get user tickets error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
