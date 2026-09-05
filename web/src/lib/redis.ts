import { Redis } from '@upstash/redis';

/**
 * A-003 FIX: The previous implementation used non-null assertions (!) on env vars.
 * If UPSTASH_REDIS_REST_URL is undefined at runtime, `new Redis()` throws immediately
 * on module import — crashing every API route that imports cacheUtils.ts.
 *
 * This factory returns null when credentials are absent so the server continues
 * to start without Redis. All cache calls in cacheUtils.ts guard for null.
 */
function createRedisClient(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(
        '[Redis] UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN is not configured. ' +
        'In-memory caching and rate limiting are disabled.'
      );
    }
    return null;
  }

  return new Redis({ url, token });
}

/**
 * Singleton Redis client. `null` when credentials are not configured.
 * Callers MUST guard: `if (!redis) return null;`
 */
export const redis: Redis | null = createRedisClient();

/** Convenience boolean for conditional Redis logic (rate limiter, etc.) */
export const isRedisAvailable: boolean = redis !== null;
