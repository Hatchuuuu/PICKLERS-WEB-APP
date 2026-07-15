import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract the raw body and signature
    const rawBody = await request.text();
    const signatureHeader = request.headers.get('paymongo-signature');
    const webhookSecret = process.env.PAYMONGO_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("CRITICAL: PAYMONGO_WEBHOOK_SECRET is missing. Webhook rejected.");
      return NextResponse.json({ error: "Unauthorized: Server misconfigured" }, { status: 401 });
    }

    if (!signatureHeader) {
      return NextResponse.json({ error: "Unauthorized: Missing signature" }, { status: 401 });
    }

    // 2. Verify Paymongo Signature
      // Paymongo signature format: t=<timestamp>,te=<test_signature>,li=<live_signature>
      const parts = signatureHeader.split(',');
      let timestamp = '';
      let signature = '';

      for (const part of parts) {
        const [key, value] = part.split('=');
        if (key === 't') timestamp = value;
        // In test mode, we might use 'te', in live mode 'li'
        if (key === 'te' || key === 'li') signature = value;
      }

      const signaturePayload = `${timestamp}.${rawBody}`;
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signaturePayload)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
      }
    }

    // 3. Parse the Event
    const event = JSON.parse(rawBody);

    // 4. Handle specific events
    if (event.data.type === 'checkout_session.payment.paid') {
      const checkoutSession = event.data.attributes.data;
      const amountPaid = checkoutSession.attributes.amount;
      const currency = checkoutSession.attributes.currency;
      
      // TODO: Connect to Supabase using a Service Role Key and update the user's wallet balance
      // Example:
      // const { error } = await supabaseAdmin.rpc('increment_wallet_balance', { amount: amountPaid / 100, user_id: '...' });
      
      console.log(`Payment successful! Amount: ${amountPaid / 100} ${currency}`);
    }

    // 5. Always return a 200 OK so Paymongo knows we received it
    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error: any) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
