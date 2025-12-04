import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '';
const supabaseServiceKey = '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_KEY = 'rahasia123';

interface NotificationRequest {
  adminKey: string;
  fids?: number[]; // Optional: specific FIDs to notify
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  sendToAll?: boolean; // If true, send to all active users
}

interface SendNotificationPayload {
  notificationId: string;
  title: string;
  body: string;
  targetUrl: string;
  tokens: string[];
}

interface NotificationResponse {
  successfulTokens: string[];
  invalidTokens: string[];
  rateLimitedTokens: string[];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!supabase) {
    return NextResponse.json({ error: 'Notifications not configured' }, { status: 503 });
  }

  try {
    const data: NotificationRequest = await request.json();

    // Verify admin key
    if (data.adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    // Validate required fields
    if (!data.notificationId || !data.title || !data.body || !data.targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate length constraints
    if (data.notificationId.length > 128) {
      return NextResponse.json(
        { error: 'notificationId too long (max 128 chars)' },
        { status: 400 }
      );
    }
    if (data.title.length > 32) {
      return NextResponse.json(
        { error: 'title too long (max 32 chars)' },
        { status: 400 }
      );
    }
    if (data.body.length > 128) {
      return NextResponse.json(
        { error: 'body too long (max 128 chars)' },
        { status: 400 }
      );
    }
    if (data.targetUrl.length > 1024) {
      return NextResponse.json(
        { error: 'targetUrl too long (max 1024 chars)' },
        { status: 400 }
      );
    }

    // Get notification tokens
    let tokens: Array<{ fid: number; token: string; url: string }> = [];

    if (data.sendToAll) {
      // Get all active tokens
      const { data: allTokens, error } = await supabase
        .from('notification_tokens')
        .select('fid, token, url')
        .eq('enabled', true);

      if (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
          { error: 'Failed to fetch tokens' },
          { status: 500 }
        );
      }

      tokens = allTokens || [];
    } else if (data.fids && data.fids.length > 0) {
      // Get tokens for specific FIDs
      const { data: specificTokens, error } = await supabase
        .from('notification_tokens')
        .select('fid, token, url')
        .eq('enabled', true)
        .in('fid', data.fids);

      if (error) {
        console.error('Error fetching tokens:', error);
        return NextResponse.json(
          { error: 'Failed to fetch tokens' },
          { status: 500 }
        );
      }

      tokens = specificTokens || [];
    } else {
      return NextResponse.json(
        { error: 'Must specify fids or sendToAll' },
        { status: 400 }
      );
    }

    if (tokens.length === 0) {
      return NextResponse.json({
        message: 'No active notification tokens found',
        sent: 0,
        failed: 0,
        rateLimited: 0
      });
    }

    // Group tokens by URL (different Farcaster clients may use different URLs)
    const tokensByUrl: Record<string, Array<{ fid: number; token: string }>> = {};
    
    tokens.forEach((t) => {
      if (!tokensByUrl[t.url]) {
        tokensByUrl[t.url] = [];
      }
      tokensByUrl[t.url].push({ fid: t.fid, token: t.token });
    });

    // Send notifications in batches of 100
    let totalSuccess = 0;
    let totalFailed = 0;
    let totalRateLimited = 0;

    for (const [url, urlTokens] of Object.entries(tokensByUrl)) {
      // Process in batches of 100
      for (let i = 0; i < urlTokens.length; i += 100) {
        const batch = urlTokens.slice(i, i + 100);
        const batchTokens = batch.map((t) => t.token);

        try {
          const payload: SendNotificationPayload = {
            notificationId: data.notificationId,
            title: data.title,
            body: data.body,
            targetUrl: data.targetUrl,
            tokens: batchTokens
          };

          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            console.error(`Failed to send notification batch:`, response.status);
            totalFailed += batch.length;
            continue;
          }

          const result: NotificationResponse = await response.json();

          // Log results
          totalSuccess += result.successfulTokens.length;
          totalFailed += result.invalidTokens.length;
          totalRateLimited += result.rateLimitedTokens.length;

          // Update token usage timestamp for successful sends
          if (result.successfulTokens.length > 0) {
            await supabase
              .from('notification_tokens')
              .update({ last_used_at: new Date().toISOString() })
              .in('token', result.successfulTokens);
          }

          // Disable invalid tokens
          if (result.invalidTokens.length > 0) {
            await supabase
              .from('notification_tokens')
              .update({ enabled: false })
              .in('token', result.invalidTokens);
          }

          // Log each notification
          for (const tokenObj of batch) {
            const status = result.successfulTokens.includes(tokenObj.token)
              ? 'success'
              : result.invalidTokens.includes(tokenObj.token)
              ? 'failed'
              : result.rateLimitedTokens.includes(tokenObj.token)
              ? 'rate_limited'
              : 'unknown';

            await supabase.from('notification_logs').insert({
              notification_id: data.notificationId,
              fid: tokenObj.fid,
              title: data.title,
              body: data.body,
              target_url: data.targetUrl,
              status: status
            });
          }
        } catch (error) {
          console.error('Error sending notification batch:', error);
          totalFailed += batch.length;
        }
      }
    }

    return NextResponse.json({
      message: 'Notifications sent',
      sent: totalSuccess,
      failed: totalFailed,
      rateLimited: totalRateLimited,
      total: tokens.length
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for notification stats
export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!supabase) {
    return NextResponse.json({ error: 'Notifications not configured' }, { status: 503 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const adminKey = searchParams.get('adminKey');

    // Verify admin key
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    // Get active tokens count
    const { count: activeTokens } = await supabase
      .from('notification_tokens')
      .select('*', { count: 'exact', head: true })
      .eq('enabled', true);

    // Get recent notification logs
    const { data: recentLogs } = await supabase
      .from('notification_logs')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(10);

    // Get notification stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: stats } = await supabase
      .from('notification_logs')
      .select('status, sent_at')
      .gte('sent_at', sevenDaysAgo.toISOString());

    // Group stats by day and status
    const dailyStats: Record<string, Record<string, number>> = {};
    
    stats?.forEach((log) => {
      const date = new Date(log.sent_at).toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { success: 0, failed: 0, rate_limited: 0 };
      }
      dailyStats[date][log.status]++;
    });

    return NextResponse.json({
      activeTokens: activeTokens || 0,
      recentLogs: recentLogs || [],
      dailyStats: dailyStats
    });
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
