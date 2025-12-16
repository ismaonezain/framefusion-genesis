import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentWeekNumber } from '@/lib/battle-system';

/**
 * CRON Job: Weekly Raffle Draw (Run every Monday at 00:01 UTC)
 * Selects 10 random winners and distributes prizes (flat 10% each)
 */
export async function POST(request: NextRequest) {
  try {
    // Security: Check for cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const currentWeek = getCurrentWeekNumber();

    // Get current week's pool
    const { data: pool, error: poolError } = await supabase
      .from('raffle_pool')
      .select('*')
      .eq('week_number', currentWeek)
      .single();

    if (poolError || !pool) {
      return NextResponse.json(
        { success: false, error: 'Raffle pool not found' },
        { status: 404 }
      );
    }

    if (pool.is_drawn) {
      return NextResponse.json(
        { success: false, error: 'Raffle already drawn for this week' },
        { status: 400 }
      );
    }

    if (pool.total_pool <= 0) {
      return NextResponse.json(
        { success: false, error: 'No prize pool to distribute' },
        { status: 400 }
      );
    }

    // Get all tickets with user aggregation
    const { data: tickets, error: ticketsError } = await supabase
      .from('raffle_tickets')
      .select('fid, tickets_count')
      .eq('week_number', currentWeek);

    if (ticketsError || !tickets || tickets.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No tickets found' },
        { status: 404 }
      );
    }

    // Aggregate tickets per user
    const userTickets = tickets.reduce((acc: Record<number, number>, ticket: any) => {
      acc[ticket.fid] = (acc[ticket.fid] || 0) + ticket.tickets_count;
      return acc;
    }, {});

    // Create weighted pool (each ticket = 1 entry)
    const ticketPool: number[] = [];
    Object.entries(userTickets).forEach(([fid, count]) => {
      for (let i = 0; i < (count as number); i++) {
        ticketPool.push(parseInt(fid));
      }
    });

    if (ticketPool.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid tickets in pool' },
        { status: 400 }
      );
    }

    // Select 10 unique winners (or less if fewer participants)
    const winners: Set<number> = new Set();
    const maxWinners = Math.min(10, Object.keys(userTickets).length);
    
    while (winners.size < maxWinners && ticketPool.length > 0) {
      const randomIndex = Math.floor(Math.random() * ticketPool.length);
      const selectedFid = ticketPool[randomIndex];
      winners.add(selectedFid);
      
      // Remove all tickets for this user to prevent duplicate wins
      const userTicketCount = userTickets[selectedFid] as number;
      for (let i = 0; i < userTicketCount; i++) {
        const idx = ticketPool.indexOf(selectedFid);
        if (idx > -1) ticketPool.splice(idx, 1);
      }
    }

    // Calculate prize per winner (flat 10% each)
    const prizePerWinner = pool.total_pool / 10;

    // Record winners and distribute prizes
    const winnerArray = Array.from(winners);
    for (const fid of winnerArray) {
      // Record winner
      await supabase
        .from('raffle_winners')
        .insert({
          week_number: currentWeek,
          fid,
          prize_amount: prizePerWinner,
          user_ticket_count: userTickets[fid],
          total_pool_tickets: Object.values(userTickets).reduce((a: number, b: number) => a + b, 0) as number,
        });

      // Award prize
      await supabase.rpc('update_shadow_balance', {
        user_fid: fid,
        amount_change: prizePerWinner,
        tx_type: 'earn_raffle',
        tx_source: `Week ${currentWeek} raffle prize`,
      });
    }

    // Mark pool as drawn
    await supabase
      .from('raffle_pool')
      .update({
        is_drawn: true,
        drawn_at: new Date().toISOString(),
      })
      .eq('week_number', currentWeek);

    // Create new pool for next week
    const nextWeek = currentWeek + 1;
    await supabase
      .from('raffle_pool')
      .insert({
        week_number: nextWeek,
        total_pool: 0,
        total_tickets: 0,
        unique_participants: 0,
      })
      .onConflict('week_number')
      .ignoreDuplicates();

    return NextResponse.json({
      success: true,
      week: currentWeek,
      totalPrizePool: pool.total_pool,
      prizePerWinner,
      winnersCount: winnerArray.length,
      winners: winnerArray,
    });
  } catch (error) {
    console.error('Raffle draw error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
