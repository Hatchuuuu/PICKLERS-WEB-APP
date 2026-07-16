import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    // Attempt to get the user's IP address from headers
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'anonymous_ip';
    
    // Create a unique rate limit key for auth attempts
    const rateLimitKey = `ratelimit:auth:${ip}`;
    
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
    // If Redis fails for any reason, fail open to prevent locking out real users due to infrastructure issues
    console.error('Rate Limiter Redis Error:', error);
    return NextResponse.json({ success: true, warning: 'Rate limit bypass due to error' }, { status: 200 });
  }
}
