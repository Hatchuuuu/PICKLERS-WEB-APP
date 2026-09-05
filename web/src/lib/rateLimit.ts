import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

const inMemoryStore = new Map<string, { count: number; resetAt: number }>();

export async function checkRateLimit(
  request: NextRequest,
  keyPrefix: string,
  limit: number = 10,
  windowSeconds: number = 60
): Promise<NextResponse | null> {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
             request.headers.get('x-real-ip') ||
             'anonymous';

  const rateLimitKey = `ratelimit:${keyPrefix}:${ip}`;

  try {
    // A-003 FIX: redis is now typed as Redis | null — check null instead of env vars.
    if (redis) {
      const requestCount = await redis.incr(rateLimitKey);
      if (requestCount === 1) {
        await redis.expire(rateLimitKey, windowSeconds);
      }
      if (requestCount > limit) {
        return NextResponse.json(
          { error: `Too many requests. Please wait ${windowSeconds} seconds.` },
          { status: 429 }
        );
      }
      return null;
    }
  } catch (err) {
    console.warn('[RateLimiter] Redis error, falling back to in-memory store:', err);
  }

  // In-Memory Fallback
  const now = Date.now();
  const record = inMemoryStore.get(rateLimitKey);

  if (record && now < record.resetAt) {
    record.count += 1;
    if (record.count > limit) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${windowSeconds} seconds.` },
        { status: 429 }
      );
    }
  } else {
    inMemoryStore.set(rateLimitKey, {
      count: 1,
      resetAt: now + windowSeconds * 1000,
    });
  }

  // Periodic cleanup of stale entries
  if (inMemoryStore.size > 1000) {
    for (const [k, v] of inMemoryStore.entries()) {
      if (now >= v.resetAt) inMemoryStore.delete(k);
    }
  }

  return null;
}
