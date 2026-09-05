import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const CheckoutPayloadSchema = z.object({
  amount: z.number().min(100, "Invalid amount. Minimum is ₱100."),
  userId: z.string().min(1, "Missing user ID."),
  description: z.string().optional().default("Picklers Wallet Top-Up")
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Max 3 checkout attempts per minute per user to prevent spamming Paymongo
    let requestCount = 1;
    try {
      // A-003 FIX: redis is now typed as Redis | null
      if (redis) {
        const rateLimitKey = `ratelimit:checkout:${user.id}`;
        requestCount = await redis.incr(rateLimitKey);
        if (requestCount === 1) {
          await redis.expire(rateLimitKey, 60); // 60 second window
        }
      }
    } catch (redisError) {
      console.warn("[Checkout API] Redis rate limiter unavailable, proceeding safely:", redisError);
    }

    // Max 3 checkout attempts per minute per user to prevent spamming Paymongo
    if (requestCount > 3) {
      return NextResponse.json(
        { error: 'Too many checkout attempts. Please wait a moment.' },
        { status: 429 }
      );
    }

    // 2. Parse Request Body
    const body = await request.json();
    const parsedBody = CheckoutPayloadSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return NextResponse.json({ error: parsedBody.error.issues[0].message }, { status: 400 });
    }

    const { amount, userId, description } = parsedBody.data;

    if (userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized user ID." }, { status: 403 });
    }

    // 3. Call Paymongo API securely from the Server
    // Convert amount to centavos (e.g., ₱500.00 -> 50000)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      console.error("NEXT_PUBLIC_SITE_URL is missing.");
      return NextResponse.json({ error: "Server misconfigured." }, { status: 500 });
    }

    const amountInCentavos = Math.round(amount * 100);
    // A-009 FIX: Vercel sets NODE_ENV='production' on ALL deployments, including
    // preview branches. Checking NODE_ENV alone is therefore insufficient and would
    // cause live PayMongo charges on preview/staging builds.
    // We additionally gate on VERCEL_ENV === 'production' (only set on the actual
    // production deployment). For non-Vercel envs, NODE_ENV remains the decider.
    const isRealProduction =
      process.env.NODE_ENV === 'production' &&
      (process.env.VERCEL_ENV === 'production' || !process.env.VERCEL_ENV);

    const secretKey = isRealProduction
      ? process.env.PAYMONGO_LIVE_SECRET_KEY
      : process.env.PAYMONGO_TEST_SECRET_KEY;

    if (!secretKey) {
      const expectedVar = isRealProduction
        ? 'PAYMONGO_LIVE_SECRET_KEY'
        : 'PAYMONGO_TEST_SECRET_KEY';
      console.error(`Missing ${expectedVar}`);
      return NextResponse.json({ error: "Payment gateway misconfigured." }, { status: 500 });
    }

    const paymongoOptions = {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        authorization: `Basic ${Buffer.from(secretKey).toString('base64')}`
      },
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: [
              {
                currency: 'PHP',
                amount: amountInCentavos,
                description: description,
                name: 'Picklers Wallet Balance',
                quantity: 1
              }
            ],
            payment_method_types: ['gcash', 'paymaya', 'card'],
            send_email_receipt: true,
            show_description: true,
            show_line_items: true,
            description: description,
            metadata: {
              user_id: userId
            },
            success_url: `${siteUrl}/app/wallet?payment=success`,
            cancel_url: `${siteUrl}/app/wallet?payment=cancelled`
          }
        }
      })
    };

    const response = await fetch('https://api.paymongo.com/v1/checkout_sessions', paymongoOptions);
    const data = await response.json();

    if (!response.ok) {
      console.error("Paymongo Error:", data);
      return NextResponse.json({ error: "Failed to generate checkout session." }, { status: 500 });
    }

    // 4. Return the secure Checkout URL to the client
    const checkoutUrl = data.data.attributes.checkout_url;
    
    return NextResponse.json({ checkoutUrl }, { status: 200 });

  } catch (error: unknown) {
    console.error('Checkout API Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
