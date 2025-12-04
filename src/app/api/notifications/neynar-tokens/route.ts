import { NextResponse } from 'next/server';
import { getNotificationTokens } from '@/lib/neynar';

export async function GET(): Promise<NextResponse> {
  try {
    // Neynar API key
    const neynarApiKey = '';

    if (!neynarApiKey) {
      return NextResponse.json(
        { 
          error: 'Neynar API key not configured',
          count: 0,
          tokens: [],
        },
        { status: 500 }
      );
    }

    // Fetch notification tokens from Neynar (fetch max 100)
    const result = await getNotificationTokens(neynarApiKey, 100);

    return NextResponse.json({
      success: true,
      total_count: result.count,
      enabled_count: result.enabled_count,
      tokens: result.notification_tokens,
      has_more: result.next.cursor !== null,
    });
  } catch (error) {
    console.error('Error fetching notification tokens:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false,
        count: 0,
        tokens: [],
      },
      { status: 500 }
    );
  }
}
