import { NextRequest, NextResponse } from 'next/server';
import type { NeynarNotificationPayload } from '@/lib/neynar';
import { sendNeynarNotification, getNotificationTokens } from '@/lib/neynar';
import { randomUUID } from 'crypto';

const ADMIN_KEY = 'rahasia123';

interface RequestPayload {
  adminKey: string;
  title: string;
  body: string;
  targetUrl: string;
  sendToAll?: boolean;
  fids?: number[];
  filters?: {
    exclude_fids?: number[];
    following_fid?: number;
    minimum_user_score?: number;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data: RequestPayload = await request.json();

    // Verify admin key
    if (data.adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Invalid admin key' }, { status: 401 });
    }

    // Neynar API key (Mini App notifications don't need signer UUID)
    const neynarApiKey = '9D9BBADB-A243-409E-817B-3C35BCE0E937';

    // Validate required fields
    if (!data.title || !data.body || !data.targetUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, body, targetUrl' },
        { status: 400 }
      );
    }

    // Validate length constraints
    if (data.title.length > 32) {
      return NextResponse.json(
        { error: 'Title too long (max 32 chars)' },
        { status: 400 }
      );
    }
    if (data.body.length > 128) {
      return NextResponse.json(
        { error: 'Body too long (max 128 chars)' },
        { status: 400 }
      );
    }
    if (data.targetUrl.length > 1024) {
      return NextResponse.json(
        { error: 'Target URL too long (max 1024 chars)' },
        { status: 400 }
      );
    }

    // Get target FIDs
    // According to Neynar docs: Empty array = send to ALL enabled users
    let targetFids: number[] = [];

    if (data.sendToAll) {
      // Per Neynar docs: Pass empty array to send to all FIDs with notifications enabled
      console.log('[Neynar] Using empty target_fids array (sends to all enabled users)');
      targetFids = [];
      
      // Optional: Fetch tokens count for logging purposes only
      try {
        const tokensResponse = await getNotificationTokens(neynarApiKey, 100);
        const enabledCount = tokensResponse.notification_tokens.filter(
          (token) => token.status === 'enabled'
        ).length;
        console.log(`[Neynar] Found ${enabledCount} users with notifications enabled`);
        
        if (enabledCount === 0) {
          return NextResponse.json({
            success: false,
            message: 'No users have notifications enabled yet',
            sent: 0,
            failed: 0,
            total: 0,
          });
        }
      } catch (error) {
        console.warn('[Neynar] Could not fetch token count, continuing anyway:', error);
      }
    } else {
      targetFids = data.fids || [];
      
      if (targetFids.length === 0) {
        return NextResponse.json(
          { error: 'No target FIDs provided' },
          { status: 400 }
        );
      }
    }

    // Build Neynar payload with UUID for idempotency
    const notificationUuid = randomUUID();
    const payload: NeynarNotificationPayload = {
      target_fids: targetFids, // Empty array = send to all enabled users
      notification: {
        title: data.title,
        body: data.body,
        target_url: data.targetUrl,
        uuid: notificationUuid,
      },
    };

    const targetInfo = targetFids.length === 0 
      ? 'ALL enabled users' 
      : `${targetFids.length} specific users`;
    console.log(`[Neynar] Sending to ${targetInfo} with UUID: ${notificationUuid}`);
    console.log(`[Neynar] Payload:`, JSON.stringify(payload, null, 2));

    // Add filters if provided
    if (data.filters) {
      payload.filters = data.filters;
    }

    // Send notification via Neynar
    const result = await sendNeynarNotification(payload, neynarApiKey);

    // Count successful deliveries and log failures
    const deliveredCount = result.notification_deliveries.filter(
      (d) => d.status === 'delivered'
    ).length;
    const failedDeliveries = result.notification_deliveries.filter(
      (d) => d.status === 'failed'
    );
    const failedCount = failedDeliveries.length;

    // Log failed deliveries for debugging
    if (failedCount > 0) {
      console.error(`[Neynar] ${failedCount} notifications failed:`);
      console.error(`[Neynar] Common reasons:`);
      console.error(`  1. User disabled notifications after enabling`);
      console.error(`  2. Invalid notification token`);
      console.error(`  3. User's notification settings don't match filters`);
      console.error(`\n[Neynar] Failed deliveries:`);
      failedDeliveries.slice(0, 5).forEach((delivery) => {
        console.error(`  - FID ${delivery.fid}: ${delivery.error || 'Unknown error'}`);
      });
      if (failedCount > 5) {
        console.error(`  ... and ${failedCount - 5} more failures`);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully via Neynar',
      sent: deliveredCount,
      failed: failedCount,
      total: result.notification_deliveries.length,
      uuid: notificationUuid,
      deliveries: result.notification_deliveries,
      // Include error samples for debugging
      errorSamples: failedDeliveries.slice(0, 3).map((d) => ({
        fid: d.fid,
        error: d.error,
      })),
    });
  } catch (error) {
    console.error('Error sending Neynar notification:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
      },
      { status: 500 }
    );
  }
}

// GET endpoint for basic info
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    configured: true,
    message: 'Neynar notifications are configured and ready',
    clientId: '472176b5-5e8e-4ebe-8e80-ae505d7bf09d',
  });
}
