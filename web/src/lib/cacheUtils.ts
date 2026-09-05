import { redis } from '@/lib/redis';

/**
 * Normalize query parameters for consistent cache keys
 * Converts to lowercase, trims, removes extra whitespace, and removes punctuation
 */
export function normalizeQueryForCache(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\w\s]/g, ''); // Remove punctuation
}

/**
 * Generate a cache key from a prefix and normalized query
 */
export function generateCacheKey(prefix: string, query: string | number = ''): string {
  const normalized = normalizeQueryForCache(String(query ?? ''));
  return normalized ? `${prefix}:${normalized}` : prefix;
}

/**
 * Cache TTL configurations (in seconds)
 */
export const CACHE_TTL = {
  HEURISTIC: 60 * 60 * 24 * 30, // 30.000
  API: 60 * 60 * 4, // 4 hours
  NEGATIVE: 60 * 5, // 5 minutes
};

/**
 * Get data from cache
 * @param key Cache key
 * @returns Cached value or null if not found/error
 */
export async function getCache<T>(key: string): Promise<T | null> {
  if (!redis) return null; // A-003: Redis not configured — always a cache miss
  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      if (typeof cached === 'string') {
        try {
          return JSON.parse(cached) as T;
        } catch {
          return cached as unknown as T;
        }
      }
      return cached;
    }
    return null;
  } catch (error) {
    console.warn('[Cache] Error reading from cache:', error);
    return null;
  }
}

/**
 * Set data in cache with TTL
 * @param key Cache key
 * @param value Value to cache
 * @param ttl Time to live in seconds (optional)
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttl: number = CACHE_TTL.API
): Promise<void> {
  if (!redis) return; // A-003: Redis not configured — skip write silently
  try {
    await redis.set(key, JSON.stringify(value), { ex: ttl });
  } catch (error) {
    console.warn('[Cache] Error writing to cache:', error);
  }
}

/**
 * Delete data from cache
 * @param key Cache key
 */
export async function deleteCache(key: string): Promise<void> {
  if (!redis) return; // A-003: Redis not configured — nothing to delete
  try {
    await redis.del(key);
  } catch (error) {
    console.warn('[Cache] Error deleting from cache:', error);
  }
}