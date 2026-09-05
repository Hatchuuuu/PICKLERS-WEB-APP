import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import crypto from 'crypto';

// F-578 cascade: webhook MUST use the admin client. Earlier the file
// silently fell back to anon when the service role key was unset, which
// meant the RPC and the processed_webhooks insert both ran with RLS — every
// payout failed in production. supabaseAdmin now panics if the env var is
// missing (see supabase-admin.ts).

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

    const signatureToCheck = process.env.NODE_ENV === 'production' && liveSignature ? liveSignature : (testSignature || liveSignature);

    if (!timestamp || !signatureToCheck) {
      return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
    }

    // Replay window: 5 minutes / 300 seconds
    const timestampNum = parseInt(timestamp, 10);
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (isNaN(timestampNum) || Math.abs(nowSeconds - timestampNum) > 300) {
      console.error("Webhook timestamp outside 5-minute replay window");
      return NextResponse.json({ error: 'Webhook timestamp expired or invalid' }, { status: 401 });
    }

    const signatureString = `${timestamp}.${payload}`;
    const expectedSignature = crypto.createHmac('sha256', secret).update(signatureString).digest('hex');

    const sigBuffer = Buffer.from(signatureToCheck);
    const expBuffer = Buffer.from(expectedSignature);

    if (sigBuffer.length !== expBuffer.length || !crypto.timingSafeEqual(sigBuffer, expBuffer)) {
      console.error("Webhook signature mismatch");
      return NextResponse.json({ error: 'Unauthorized request' }, { status: 401 });
    }

    const event = JSON.parse(payload);
    const eventId = event.id || event.data?.id;

    // Idempotency check — use maybeSingle() to avoid throwing on no rows.
    if (eventId) {
      const { data: existing } = await supabaseAdmin
        .from('processed_webhooks')
        .select('event_id')
        .eq('event_id', eventId)
        .maybeSingle();

      if (existing) {
        console.log(`Webhook event ${eventId} already processed.`);
        return NextResponse.json({ received: true, note: 'Duplicate event ignored' });
      }
    }

    // 2. Process payment events
    if (event.data?.attributes?.type === 'checkout_session.payment.paid') {
      const checkoutSession = event.data.attributes.data.attributes;
      const metadata = checkoutSession.metadata;

      if (!metadata || !metadata.user_id) {
        console.error("No user_id found in metadata");
        return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
      }

      // Convert centavos back to standard currency amount
      const amountToAdd = Math.floor(checkoutSession.amount / 100);

      // F-575: cap single top-up at ₱1,000,000
      const MAX_PAYMENT_AMOUNT = 1000000;
      if (amountToAdd <= 0 || amountToAdd > MAX_PAYMENT_AMOUNT) {
        console.error(`Invalid payment amount: ${amountToAdd}`);
        return NextResponse.json({ error: 'Invalid payment amount' }, { status: 400 });
      }

      // F-578: pre-claim the idempotency row BEFORE crediting the wallet.
      // If the wallet credit crashes, PayMongo will retry the webhook, and
      // the second attempt will see the pre-claimed row and refuse to
      // double-credit. If the credit succeeds we update the row with the
      // audit metadata at the end.
      //
      // Use the standard Postgres ON CONFLICT DO NOTHING via upsert with
      // ignoreDuplicates to keep this race-safe.
      if (eventId) {
        const { error: claimErr } = await supabaseAdmin
          .from('processed_webhooks')
          .upsert(
            { event_id: eventId, status: 'processing', claimed_at: new Date().toISOString() },
            { onConflict: 'event_id', ignoreDuplicates: true }
          );
        if (claimErr) {
          // If we can't even claim the row, fail closed and let PayMongo
          // retry. This is the safer side of the race.
          console.error('[webhook] failed to claim idempotency row:', claimErr);
          return NextResponse.json({ error: 'Idempotency claim failed' }, { status: 500 });
        }

        // Confirm the row is ours (not a racing duplicate).
        const { data: claimed } = await supabaseAdmin
          .from('processed_webhooks')
          .select('event_id, status')
          .eq('event_id', eventId)
          .maybeSingle();

        if (claimed?.status === 'completed') {
          // A different worker already finished this event.
          return NextResponse.json({ received: true, note: 'Already completed' });
        }
      }

      // 3. Credit the wallet via the admin RPC.
      const { error: walletErr } = await supabaseAdmin.rpc('increment_wallet_balance_admin', {
        amount: amountToAdd,
        user_id: metadata.user_id,
        p_label: `PayMongo Top-Up (₱${amountToAdd.toLocaleString()})`,
      });

      if (walletErr) {
        console.error('[webhook] wallet credit failed:', walletErr);
        // Surface a 4xx (not 5xx) so PayMongo does NOT retry indefinitely.
        // 5xx would cause a tight retry loop and potentially double-credit if
        // a future change moves the idempotency claim. 422 tells PayMongo the
        // payload is rejected.
        return NextResponse.json(
          { error: 'Wallet credit failed', detail: walletErr.message },
          { status: 422 }
        );
      }

      // Mark the event as fully processed.
      if (eventId) {
        await supabaseAdmin
          .from('processed_webhooks')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            amount: amountToAdd,
            user_id: metadata.user_id,
          })
          .eq('event_id', eventId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
