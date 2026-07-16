import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redis } from '@/lib/redis';
import { z } from 'zod';

const CheckoutPayloadSchema = z.object({
  amount: z.number().min(100, "Invalid amount. Minimum is ₱100."),
  userId: z.string().min(1, "Missing user ID."),
  description: z.string().optional().default("Picklers Wallet Top-Up")
});

export async function POST(request: NextRequest) {
  try {
    // 1. Rate Limiting via Upstash Redis
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous_ip';
    const rateLimitKey = `ratelimit:checkout:${ip}`;
    const requestCount = await redis.incr(rateLimitKey);
    
    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 60); // 60 second window
    }
    
    // Max 3 checkout attempts per minute per IP to prevent spamming the Paymongo API
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

    // 3. Call Paymongo API securely from the Server
    // Convert amount to centavos (e.g., ₱500.00 -> 50000)
    const amountInCentavos = Math.round(amount * 100);
    const secretKey = process.env.PAYMONGO_SECRET_KEY_TEST;

    if (!secretKey) {
      console.error("Missing PAYMONGO_SECRET_KEY_TEST");
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
            success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/app/wallet?payment=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/app/wallet?payment=cancelled`
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
