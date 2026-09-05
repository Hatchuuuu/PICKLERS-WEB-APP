import { NextResponse, type NextRequest } from 'next/server';

interface RateLimitStore {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitStore>();

export function checkAdminRateLimit(
  request: NextRequest,
  keyPrefix: string = 'admin_mutation',
  maxRequests: number = 30,
  windowMs: number = 60000
): NextResponse | null {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) ||
             request.headers.get('x-real-ip') ||
             '127.0.0.1';
             
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();

  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (record.count >= maxRequests) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    return NextResponse.json(
      { error: `Too Many Requests: Rate limit exceeded for administrative operations. Retry in ${retryAfter}s.` },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfter) },
      }
    );
  }

  record.count += 1;

  // Stale entry garbage collection if memory store grows large
  if (memoryStore.size > 1000) {
    for (const [k, v] of memoryStore.entries()) {
      if (now >= v.resetAt) memoryStore.delete(k);
    }
  }

  return null;
}
