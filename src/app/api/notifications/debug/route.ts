import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://udungttagaihejqszcfk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdW5ndHRhZ2FpaGVqcXN6Y2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2Nzg5MCwiZXhwIjoyMDc5NDQzODkwfQ.IRGW3VthNp6DXXt681jN9f6F2PC4_8Syzv_xKrUPPbA';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_KEY = 'rahasia123';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('adminKey');

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    const diagnostics: Record<string, unknown> = {
      supabaseUrl,
      timestamp: new Date().toISOString()
    };

    // Test 1: Check notification_tokens table
    try {
      const { data: tokens, error: tokensError, count } = await supabase
        .from('notification_tokens')
        .select('*', { count: 'exact' });

      diagnostics.notification_tokens = {
        exists: !tokensError,
        error: tokensError?.message,
        count: count,
        sample: tokens?.slice(0, 3) || []
      };
    } catch (error) {
      diagnostics.notification_tokens = {
        exists: false,
        error: String(error)
      };
    }

    // Test 2: Check webhook_events table
    try {
      const { data: events, error: eventsError, count } = await supabase
        .from('webhook_events')
        .select('*', { count: 'exact' })
        .limit(3);

      diagnostics.webhook_events = {
        exists: !eventsError,
        error: eventsError?.message,
        count: count,
        sample: events || []
      };
    } catch (error) {
      diagnostics.webhook_events = {
        exists: false,
        error: String(error)
      };
    }

    // Test 3: Check notification_logs table
    try {
      const { data: logs, error: logsError, count } = await supabase
        .from('notification_logs')
        .select('*', { count: 'exact' })
        .limit(3);

      diagnostics.notification_logs = {
        exists: !logsError,
        error: logsError?.message,
        count: count,
        sample: logs || []
      };
    } catch (error) {
      diagnostics.notification_logs = {
        exists: false,
        error: String(error)
      };
    }

    // Test 4: Count active tokens
    try {
      const { count: activeCount, error: activeError } = await supabase
        .from('notification_tokens')
        .select('*', { count: 'exact', head: true })
        .eq('enabled', true);

      diagnostics.active_tokens_count = {
        count: activeCount,
        error: activeError?.message
      };
    } catch (error) {
      diagnostics.active_tokens_count = {
        error: String(error)
      };
    }

    return NextResponse.json(diagnostics);
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
