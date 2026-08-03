import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
               request.headers.get('x-real-ip') || 
               'anonymous_ip';
    // Create a unique rate limit key for auth attempts
    const rateLimitKey = `ratelimit:auth:${ip}`;
    
    // If Redis is not configured (e.g. local dev), bypass rate limiting
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json({ success: true, bypassed: true }, { status: 200 });
    }
    
    // Increment the attempt count for this IP
    const requestCount = await redis.incr(rateLimitKey);
    
    // If this is the very first attempt, set the expiration to 60 seconds
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 60);
    }
    
    // If the IP exceeds 5 attempts within the 60 second window, block them
    if (requestCount > 5) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a moment before trying again.' },
        { status: 429 }
      );
    }
    
    // Otherwise, allow the request to proceed
    return NextResponse.json({ success: true, count: requestCount }, { status: 200 });
  } catch (error: unknown) {
    // Fail closed to prevent bypassing rate limit through malicious redis errors
    console.error('Rate Limiter Redis Error:', error);
    return NextResponse.json({ error: 'Too many attempts or service unavailable. Please wait.' }, { status: 429 });
  }
}
