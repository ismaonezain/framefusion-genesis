/**
 * User Cache Utilities
 * 
 * This module provides functions to cache Farcaster user data in Supabase
 * to reduce Neynar API calls and improve performance.
 */

import { supabase } from './supabase';
import { fetchUsersFromNeynar, type NeynarUser, type CachedUser } from './neynar';

const CACHE_EXPIRY_DAYS = 7; // Refresh cache after 7 days

/**
 * Get users from cache (Supabase)
 * Returns only users that exist in cache and are not stale
 * 
 * @param fids - Array of FIDs to fetch from cache
 * @returns Array of cached users
 */
export async function getUsersFromCache(fids: number[]): Promise<CachedUser[]> {
  if (fids.length === 0) return [];

  const { data, error } = await supabase
    .from('farcaster_users')
    .select('*')
    .in('fid', fids);

  if (error) {
    console.error('[Cache] Error fetching from cache:', error);
    return [];
  }

  return data || [];
}

/**
 * Save or update users in cache (Supabase)
 * Uses upsert to handle both insert and update
 * 
 * @param users - Array of Neynar users to cache
 */
export async function saveUsersToCache(users: NeynarUser[]): Promise<void> {
  if (users.length === 0) return;

  const cacheRecords = users.map((user: NeynarUser) => ({
    fid: user.fid,
    username: user.username,
    display_name: user.display_name || null,
    pfp_url: user.pfp_url || null,
    bio: user.profile?.bio?.text || null,
    follower_count: user.follower_count || 0,
    following_count: user.following_count || 0,
    verified: user.verifications?.length > 0 || false,
    power_badge: user.power_badge || false,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('farcaster_users')
    .upsert(cacheRecords, {
      onConflict: 'fid',
      ignoreDuplicates: false, // Update existing records
    });

  if (error) {
    console.error('[Cache] Error saving to cache:', error);
    throw error;
  }

  console.log(`[Cache] Saved ${users.length} users to cache`);
}

/**
 * Get users with smart caching
 * 1. Check cache first (Supabase)
 * 2. For missing or stale users, fetch from Neynar
 * 3. Save fetched users to cache
 * 4. Return combined results
 * 
 * @param fids - Array of FIDs to fetch
 * @param apiKey - Neynar API key (required for fetching missing users)
 * @param forceRefresh - Force refresh from Neynar even if cached (default: false)
 */
export async function getUsersWithCache(
  fids: number[],
  apiKey: string,
  forceRefresh: boolean = false
): Promise<CachedUser[]> {
  if (fids.length === 0) return [];

  console.log(`[Cache] Getting ${fids.length} users (forceRefresh: ${forceRefresh})`);

  let cachedUsers: CachedUser[] = [];
  let missingFids: number[] = fids;

  // Step 1: Try to get from cache if not forcing refresh
  if (!forceRefresh) {
    cachedUsers = await getUsersFromCache(fids);
    
    // Filter out stale cache (older than CACHE_EXPIRY_DAYS)
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() - CACHE_EXPIRY_DAYS);
    
    const freshUsers = cachedUsers.filter((user: CachedUser) => {
      const updatedAt = new Date(user.updated_at);
      return updatedAt > expiryDate;
    });

    const staleFids = cachedUsers
      .filter((user: CachedUser) => {
        const updatedAt = new Date(user.updated_at);
        return updatedAt <= expiryDate;
      })
      .map((user: CachedUser) => user.fid);

    // Find FIDs that are not in cache or are stale
    const cachedFids = new Set(freshUsers.map((user: CachedUser) => user.fid));
    missingFids = fids.filter((fid: number) => !cachedFids.has(fid));
    missingFids = [...missingFids, ...staleFids];

    cachedUsers = freshUsers;

    console.log(`[Cache] Found ${freshUsers.length} fresh users in cache, ${missingFids.length} need refresh`);
  }

  // Step 2: Fetch missing users from Neynar
  if (missingFids.length > 0) {
    try {
      const neynarUsers = await fetchUsersFromNeynar(missingFids, apiKey);
      
      // Step 3: Save to cache
      await saveUsersToCache(neynarUsers);
      
      // Convert Neynar users to CachedUser format
      const newCachedUsers: CachedUser[] = neynarUsers.map((user: NeynarUser) => ({
        fid: user.fid,
        username: user.username,
        display_name: user.display_name || null,
        pfp_url: user.pfp_url || null,
        bio: user.profile?.bio?.text || null,
        follower_count: user.follower_count || 0,
        following_count: user.following_count || 0,
        verified: user.verifications?.length > 0 || false,
        power_badge: user.power_badge || false,
        cached_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      cachedUsers = [...cachedUsers, ...newCachedUsers];
    } catch (error) {
      console.error('[Cache] Error fetching from Neynar:', error);
      // Return cached users even if Neynar fetch fails
    }
  }

  return cachedUsers;
}

/**
 * Batch get users with automatic chunking for large requests
 * Neynar API supports max 100 FIDs per request
 * 
 * @param fids - Array of FIDs (can be more than 100)
 * @param apiKey - Neynar API key
 * @param forceRefresh - Force refresh from Neynar
 */
export async function batchGetUsersWithCache(
  fids: number[],
  apiKey: string,
  forceRefresh: boolean = false
): Promise<CachedUser[]> {
  if (fids.length === 0) return [];

  // Remove duplicates
  const uniqueFids = Array.from(new Set(fids));

  // Chunk into batches of 100
  const chunks: number[][] = [];
  for (let i = 0; i < uniqueFids.length; i += 100) {
    chunks.push(uniqueFids.slice(i, i + 100));
  }

  console.log(`[Cache] Processing ${uniqueFids.length} unique FIDs in ${chunks.length} batches`);

  // Process all chunks in parallel
  const results = await Promise.all(
    chunks.map((chunk: number[]) => getUsersWithCache(chunk, apiKey, forceRefresh))
  );

  // Flatten results
  const allUsers = results.flat();

  console.log(`[Cache] Retrieved ${allUsers.length} users total`);

  return allUsers;
}
