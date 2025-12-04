import { NextRequest, NextResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://udungttagaihejqszcfk.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkdW5ndHRhZ2FpaGVqcXN6Y2ZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mzg2Nzg5MCwiZXhwIjoyMDc5NDQzODkwfQ.IRGW3VthNp6DXXt681jN9f6F2PC4_8Syzv_xKrUPPbA';

// Verify cron secret to prevent unauthorized access
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';
  
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authorization
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Supabase not configured', skipped: true },
        { status: 200 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active notification tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('notification_tokens')
      .select('fid, token, notification_url')
      .eq('is_active', true);

    if (tokensError) {
      console.error('Error fetching tokens:', tokensError);
      return NextResponse.json(
        { error: 'Failed to fetch notification tokens', details: tokensError.message },
        { status: 500 }
      );
    }

    if (!tokens || tokens.length === 0) {
      return NextResponse.json(
        { message: 'No active users to notify', sent: 0 },
        { status: 200 }
      );
    }

    // Generate notification ID with today's date for deduplication
    const today = new Date().toISOString().split('T')[0];
    const notificationId = `daily-reminder-${today}`;

    // Notification content
    const notification = {
      notificationId,
      title: 'Daily Check-in Available! 🔥',
      body: "Claim your 50k TRIA today! Don't break your streak",
      targetUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://framefusion.ohara.ai'}?tab=rewards`,
    };

    // Group tokens by notification URL (most should be the same)
    const tokensByUrl = tokens.reduce((acc: Record<string, string[]>, token) => {
      const url = token.notification_url;
      if (!acc[url]) {
        acc[url] = [];
      }
      acc[url].push(token.token);
      return acc;
    }, {});

    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRateLimited = 0;

    // Send notifications in batches (max 100 per request)
    for (const [url, tokenList] of Object.entries(tokensByUrl)) {
      // Split into batches of 100
      for (let i = 0; i < tokenList.length; i += 100) {
        const batch = tokenList.slice(i, i + 100);

        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...notification,
              tokens: batch,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            totalSuccess += result.successfulTokens?.length || 0;
            totalFailed += result.invalidTokens?.length || 0;
            totalRateLimited += result.rateLimitedTokens?.length || 0;

            // Mark invalid tokens as inactive
            if (result.invalidTokens && result.invalidTokens.length > 0) {
              await supabase
                .from('notification_tokens')
                .update({ is_active: false })
                .in('token', result.invalidTokens);
            }
          } else {
            console.error('Failed to send notification batch:', response.statusText);
            totalFailed += batch.length;
          }
        } catch (error) {
          console.error('Error sending notification batch:', error);
          totalFailed += batch.length;
        }
      }
    }

    // Log the notification send
    await supabase.from('notification_logs').insert({
      notification_id: notificationId,
      title: notification.title,
      body: notification.body,
      target_url: notification.targetUrl,
      total_sent: totalSuccess + totalFailed + totalRateLimited,
      successful: totalSuccess,
      failed: totalFailed,
      rate_limited: totalRateLimited,
      sent_by: 'automated',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Daily reminder sent',
      stats: {
        total: tokens.length,
        successful: totalSuccess,
        failed: totalFailed,
        rateLimited: totalRateLimited,
      },
    });
  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
