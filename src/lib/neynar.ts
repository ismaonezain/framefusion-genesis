/**
 * Neynar API Configuration
 * 
 * Neynar manages notification tokens automatically via webhook.
 * No need to store tokens in database!
 */

export const NEYNAR_CONFIG = {
  clientId: '472176b5-5e8e-4ebe-8e80-ae505d7bf09d',
  webhookUrl: 'https://api.neynar.com/f/app/472176b5-5e8e-4ebe-8e80-ae505d7bf09d/event',
  apiBaseUrl: 'https://api.neynar.com/v2/farcaster',
};

export interface NeynarNotificationPayload {
  target_fids: number[];
  filters?: {
    exclude_fids?: number[];
    following_fid?: number;
    minimum_user_score?: number;
    near_location?: {
      latitude: number;
      longitude: number;
      radius?: number;
    };
  };
  notification: {
    title: string;
    body: string;
    target_url: string;
    uuid?: string; // Optional UUID for idempotency
  };
}

export interface NotificationDelivery {
  fid: number;
  status: 'delivered' | 'failed' | 'pending';
  error?: string;
}

export interface NeynarNotificationResponse {
  notification_deliveries: NotificationDelivery[];
}

export interface NotificationToken {
  object: 'notification_token';
  url: string;
  token: string;
  status: 'enabled' | 'disabled' | 'invalid';
  fid: number;
  created_at: string;
  updated_at: string;
}

export interface NotificationTokensResponse {
  notification_tokens: NotificationToken[];
  next: {
    cursor: string | null;
  };
  count: number;
  enabled_count: number;
}

/**
 * Get list of notification tokens for the mini app
 * Returns all users who have enabled notifications
 * 
 * @param apiKey - Neynar API key
 * @param limit - Number of results to fetch (1-100, default 20)
 * @param fids - Optional comma-separated list of FIDs to filter
 * @param cursor - Pagination cursor
 */
export async function getNotificationTokens(
  apiKey: string,
  limit: number = 100,
  fids?: string,
  cursor?: string
): Promise<NotificationTokensResponse> {
  console.log('[Neynar] Fetching notification tokens...');
  
  // Build query parameters
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  if (fids) params.append('fids', fids);
  if (cursor) params.append('cursor', cursor);
  
  const url = `${NEYNAR_CONFIG.apiBaseUrl}/frame/notification_tokens?${params.toString()}`;
  console.log('[Neynar] Request URL:', url);
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Neynar] Error fetching tokens:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || 'Failed to fetch notification tokens');
    } catch {
      throw new Error(`Neynar API error: ${response.status} - ${errorText}`);
    }
  }

  const result = await response.json();
  console.log('[Neynar] Tokens response:', JSON.stringify(result, null, 2));
  
  // Parse response according to documentation
  const notificationTokens: NotificationToken[] = result.notification_tokens || [];
  
  // Filter only enabled tokens
  const enabledTokens = notificationTokens.filter(
    (token: NotificationToken) => token.status === 'enabled'
  );
  
  return {
    notification_tokens: notificationTokens,
    next: result.next || { cursor: null },
    count: notificationTokens.length,
    enabled_count: enabledTokens.length,
  };
}

/**
 * Send notification via Neynar API for Mini Apps
 * 
 * REQUIREMENTS:
 * 1. Requires NEYNAR_API_KEY environment variable
 * 2. Pass empty array for target_fids to send to ALL enabled users
 * 3. Use filters.following_fid to target users who follow a specific account
 * 
 * Note: Mini App notifications do NOT require signer_uuid!
 */
export async function sendNeynarNotification(
  payload: NeynarNotificationPayload,
  apiKey: string
): Promise<NeynarNotificationResponse> {
  console.log('[Neynar] Sending notification with payload:', JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${NEYNAR_CONFIG.apiBaseUrl}/frame/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Neynar] Error response:', errorText);
    try {
      const error = JSON.parse(errorText);
      throw new Error(error.message || 'Failed to send notification via Neynar');
    } catch {
      throw new Error(`Neynar API error: ${response.status} - ${errorText}`);
    }
  }

  const result = await response.json();
  console.log('[Neynar] Success response:', JSON.stringify(result, null, 2));
  
  // Return actual Neynar API response structure
  return {
    notification_deliveries: result.notification_deliveries || []
  };
}

/**
 * User Data Interfaces
 */
export interface NeynarUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
  };
  power_badge: boolean;
}

export interface NeynarBulkUsersResponse {
  users: NeynarUser[];
}

export interface CachedUser {
  fid: number;
  username: string;
  display_name: string | null;
  pfp_url: string | null;
  bio: string | null;
  follower_count: number;
  following_count: number;
  verified: boolean;
  power_badge: boolean;
  cached_at: string;
  updated_at: string;
}

/**
 * Fetch user data from Neynar API (bulk endpoint)
 * Supports up to 100 FIDs at a time
 * 
 * @param fids - Array of FIDs to fetch
 * @param apiKey - Neynar API key
 */
export async function fetchUsersFromNeynar(
  fids: number[],
  apiKey: string
): Promise<NeynarUser[]> {
  if (fids.length === 0) return [];
  if (fids.length > 100) {
    throw new Error('Cannot fetch more than 100 users at once');
  }

  if (!apiKey) {
    throw new Error('Neynar API key is required but not provided');
  }

  const fidsParam = fids.join(',');
  const url = `${NEYNAR_CONFIG.apiBaseUrl}/user/bulk?fids=${fidsParam}`;
  
  console.log(`[Neynar] Fetching ${fids.length} users from Neynar...`);
  console.log(`[Neynar] API key available:`, apiKey ? `${apiKey.substring(0, 8)}...` : 'MISSING');

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Neynar] Error fetching users:', errorText);
    throw new Error(`Neynar API error: ${response.status} - ${errorText}`);
  }

  const result: NeynarBulkUsersResponse = await response.json();
  console.log(`[Neynar] Fetched ${result.users.length} users successfully`);
  
  return result.users;
}
