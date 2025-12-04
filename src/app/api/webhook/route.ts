import { NextRequest, NextResponse } from 'next/server';
import { parseWebhookEvent, verifyAppKeyWithNeynar } from '@farcaster/miniapp-node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = '';
const supabaseServiceKey = '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Set Neynar API key for webhook verification
const neynarApiKey = process.env.NEXT_PUBLIC_NEYNAR_API_KEY;
if (neynarApiKey) {
  process.env.NEYNAR_API_KEY = neynarApiKey;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check if Supabase is configured
  if (!supabase) {
    console.log('Supabase not configured, webhook will not save data');
  }

  try {
    // Get raw body
    const body = await request.text();
    let eventData: Record<string, unknown>;

    try {
      eventData = JSON.parse(body);
    } catch (e) {
      console.error('Invalid JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Handle notification status check (special case - no signature required)
    if (eventData.notificationDetails && 
        (eventData.notificationDetails as { token?: string }).token === 'check' &&
        (eventData.notificationDetails as { url?: string }).url) {
      const fid = parseInt((eventData.notificationDetails as { url: string }).url);
      
      if (!supabase) {
        return NextResponse.json({ exists: false }, { status: 200 });
      }
      
      try {
        const { data, error } = await supabase
          .from('notification_tokens')
          .select('*')
          .eq('fid', fid)
          .eq('enabled', true)
          .limit(1);
        
        const exists = data && data.length > 0;
        return NextResponse.json({ exists }, { status: 200 });
      } catch (error) {
        console.error('Error checking notification status:', error);
        return NextResponse.json({ exists: false }, { status: 200 });
      }
    }

    // Verify webhook signature
    let verifiedData: {
      event: string;
      notificationDetails?: {
        url: string;
        token: string;
      };
    };

    try {
      verifiedData = await parseWebhookEvent(eventData, verifyAppKeyWithNeynar) as typeof verifiedData;
    } catch (e: unknown) {
      console.error('Webhook verification failed:', e);
      return NextResponse.json({ error: 'Verification failed' }, { status: 401 });
    }

    // Extract FID from verified data (signature contains FID)
    const signature = eventData.signature as Record<string, unknown>;
    const signerFid = signature.fid as number;

    if (!signerFid) {
      console.error('No FID in signature');
      return NextResponse.json({ error: 'No FID in signature' }, { status: 400 });
    }

    // Log webhook event to database (if Supabase is configured)
    if (supabase) {
      await supabase.from('webhook_events').insert({
        fid: signerFid,
        event_type: verifiedData.event,
        payload: eventData,
        processed: false
      });
    }

    // Handle different event types
    switch (verifiedData.event) {
      case 'miniapp_added':
        console.log(`Mini app added by FID ${signerFid}`);
        
        // If notification details are provided, save token
        if (verifiedData.notificationDetails) {
          await saveNotificationToken(
            signerFid,
            verifiedData.notificationDetails.token,
            verifiedData.notificationDetails.url
          );
        }
        break;

      case 'notifications_enabled':
        console.log(`Notifications enabled by FID ${signerFid}`);
        
        // Save new notification token
        if (verifiedData.notificationDetails) {
          await saveNotificationToken(
            signerFid,
            verifiedData.notificationDetails.token,
            verifiedData.notificationDetails.url
          );
        }
        break;

      case 'notifications_disabled':
        console.log(`Notifications disabled by FID ${signerFid}`);
        
        // Disable all tokens for this user
        await disableNotificationTokens(signerFid);
        break;

      case 'miniapp_removed':
        console.log(`Mini app removed by FID ${signerFid}`);
        
        // Disable all tokens for this user
        await disableNotificationTokens(signerFid);
        break;

      default:
        console.log(`Unknown event type: ${verifiedData.event}`);
    }

    // Mark event as processed (if Supabase is configured)
    if (supabase) {
      await supabase
        .from('webhook_events')
        .update({ processed: true })
        .eq('fid', signerFid)
        .eq('event_type', verifiedData.event)
        .order('received_at', { ascending: false })
        .limit(1);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to save notification token
async function saveNotificationToken(
  fid: number,
  token: string,
  url: string
): Promise<void> {
  if (!supabase) {
    console.log('Supabase not configured, cannot save notification token');
    return;
  }

  try {
    // Check if token already exists
    const { data: existing } = await supabase
      .from('notification_tokens')
      .select('*')
      .eq('token', token)
      .single();

    if (existing) {
      // Update existing token
      await supabase
        .from('notification_tokens')
        .update({
          enabled: true,
          url: url,
          updated_at: new Date().toISOString()
        })
        .eq('token', token);
    } else {
      // Insert new token
      await supabase.from('notification_tokens').insert({
        fid: fid,
        token: token,
        url: url,
        enabled: true
      });
    }

    console.log(`Saved notification token for FID ${fid}`);
  } catch (error) {
    console.error('Error saving notification token:', error);
  }
}

// Helper function to disable notification tokens
async function disableNotificationTokens(fid: number): Promise<void> {
  if (!supabase) {
    console.log('Supabase not configured, cannot disable notification tokens');
    return;
  }

  try {
    await supabase
      .from('notification_tokens')
      .update({ enabled: false })
      .eq('fid', fid);

    console.log(`Disabled notification tokens for FID ${fid}`);
  } catch (error) {
    console.error('Error disabling notification tokens:', error);
  }
}
