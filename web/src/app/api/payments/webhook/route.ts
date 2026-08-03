import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const payload = await req.text(); // Raw body required for signature validation
    const signatureHeader = req.headers.get('paymongo-signature');
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!secret) {
      console.error("PAYMONGO_WEBHOOK_SECRET is not configured");
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    if (!signatureHeader) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // 1. Verify PayMongo Signature
    // Format is like: t=1611111111,te=signature_string,li=another_signature
    const parts = signatureHeader.split(',');
    let timestamp = '';
    let testSignature = '';
    let liveSignature = '';

    for (const part of parts) {
      const [key, value] = part.split('=');
      if (key === 't') timestamp = value;
      if (key === 'te') testSignature = value;
      if (key === 'li') liveSignature = value;
    }

    // Determine which signature to check (live or test) based on the environment
    const signatureToCheck = process.env.NODE_ENV === 'production' && liveSignature ? liveSignature : (testSignature || liveSignature);

    if (!timestamp || !signatureToCheck) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
    }

    const signatureString = `${timestamp}.${payload}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signatureString).digest('hex');

    // Timing-safe signature comparison (Vuln 3 mitigation)
    const sigBuffer = Buffer.from(signatureToCheck);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      console.error("Webhook signature mismatch");
      return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventId = event.id || event.data?.id;

    // Idempotency check (Vuln 1 mitigation)
    if (eventId) {
      const { data: existing } = await supabaseAdmin
        .from('processed_webhooks')
        .select('event_id')
        .eq('event_id', eventId)
        .single();

      if (existing) {
        console.log(`Webhook event ${eventId} already processed.`);
        return NextResponse.json({ received: true, note: 'Duplicate event ignored' });
      }
    }

    // 2. Safely Process Payment
    if (event.data?.attributes?.type === 'checkout_session.payment.paid') {
      const checkoutSession = event.data.attributes.data.attributes;
      const metadata = checkoutSession.metadata;
      
      if (!metadata || !metadata.user_id) {
        console.error("No user_id found in metadata");
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
      }

      // Convert centavos back to standard currency amount
      const amountToAdd = Math.floor(checkoutSession.amount / 100);

      // Payment upper bounds checking (Vuln 4 mitigation: Max ₱1,000,000 per transaction)
      const MAX_PAYMENT_AMOUNT = 1000000;
      if (amountToAdd <= 0 || amountToAdd > MAX_PAYMENT_AMOUNT) {
        console.error(`Invalid payment amount: ${amountToAdd}`);
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      // 3. Update Supabase via Admin Client (bypassing RLS securely)
      const { error } = await supabaseAdmin.rpc('increment_wallet_balance', { 
         amount: amountToAdd,
         user_id: metadata.user_id
      });

      if (error) {
        console.error("Error updating wallet balance:", error);
        return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
      }

      // Mark webhook event as processed for idempotency
      if (eventId) {
        await supabaseAdmin.from('processed_webhooks').insert({ event_id: eventId });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
