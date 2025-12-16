import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentWeekNumber } from '@/lib/battle-system';

export async function GET(request: NextRequest) {
  try {
    const currentWeek = getCurrentWeekNumber();

    // Get current week's raffle pool
    let { data: pool, error: poolError } = await supabase
      .from('raffle_pool')
      .select('*')
      .eq('week_number', currentWeek)
      .single();

    if (poolError && poolError.code === 'PGRST116') {
      // Create pool if doesn't exist
      const { data: newPool, error: createError } = await supabase
        .from('raffle_pool')
        .insert({
          week_number: currentWeek,
          total_pool: 0,
          total_tickets: 0,
          unique_participants: 0,
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { success: false, error: 'Failed to create raffle pool' },
          { status: 500 }
        );
      }
      pool = newPool;
    } else if (poolError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch raffle pool', details: poolError.message },
        { status: 500 }
      );
    }

    // Get ticket stats
    const { data: ticketStats, error: statsError } = await supabase
      .from('raffle_tickets')
      .select('fid, tickets_count')
      .eq('week_number', currentWeek);

    if (statsError) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch ticket stats' },
        { status: 500 }
      );
    }

    const totalTickets = (ticketStats || []).reduce((sum: number, t: any) => sum + t.tickets_count, 0);
    const uniqueParticipants = new Set((ticketStats || []).map((t: any) => t.fid)).size;

    // Update pool with correct stats
    await supabase
      .from('raffle_pool')
      .update({
        total_tickets: totalTickets,
        unique_participants: uniqueParticipants,
      })
      .eq('week_number', currentWeek);

    // Calculate next draw time (next Monday 00:01 UTC)
    const now = new Date();
    const nextMonday = new Date(now);
    nextMonday.setUTCHours(0, 1, 0, 0);
    const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
    nextMonday.setUTCDate(now.getUTCDate() + daysUntilMonday);

    return NextResponse.json({
      success: true,
      currentWeek,
      prizePool: pool.total_pool,
      totalTickets,
      uniqueParticipants,
      isDrawn: pool.is_drawn,
      nextDrawAt: nextMonday.toISOString(),
      prizePerWinner: pool.total_pool / 10, // Flat 10% to each of 10 winners
    });
  } catch (error) {
    console.error('Get current raffle error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
