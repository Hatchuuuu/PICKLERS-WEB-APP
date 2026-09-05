import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../../_lib/requireAdmin';
import { createAdminSupabase } from '../../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../../_lib/rateLimit';

const REFUND_REASONS = new Set([
  'duplicate_charge',
  'fraud',
  'facility_closed',
  'user_request',
  'duplicate_booking',
  'admin_courtesy',
  'other',
]);

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_booking_refund', 10, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const bookingId = resolvedParams.id;
    const body = await request.json().catch(() => ({}));
    const { reason, refundAmount, idempotencyKey } = body;

    // F-560: validate reason against allowlist to prevent log injection /
    // audit-log garbage. The previous version took any string.
    if (reason !== undefined && typeof reason !== 'string') {
      return NextResponse.json({ error: 'reason must be a string' }, { status: 400 });
    }
    const normalizedReason = (reason || 'admin_courtesy').toLowerCase().trim();
    if (!REFUND_REASONS.has(normalizedReason)) {
      return NextResponse.json(
        { error: `Invalid reason. Allowed: ${Array.from(REFUND_REASONS).join(', ')}` },
        { status: 400 }
      );
    }

    // F-560: idempotency — a flaky network or a duplicate click should not
    // double-refund. Re-use the same admin_audit_logs row when the same
    // idempotency key arrives twice. This is the second P0 from the audit
    // that this route was missing.
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const { data: dup } = await supabase
        .from('admin_audit_logs')
        .select('id, metadata')
        .eq('admin_id', adminId)
        .eq('action', 'REFUND_BOOKING')
        .contains('metadata', { idempotency_key: idempotencyKey })
        .maybeSingle();
      if (dup) {
        return NextResponse.json({
          success: true,
          note: 'Idempotent replay — already processed',
          refundAmount: (dup.metadata as any)?.refund_amount ?? null,
        });
      }
    }

    const { data: currentBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }
    if (!currentBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (currentBooking.status === 'refunded') {
      return NextResponse.json({ error: 'Booking is already refunded' }, { status: 409 });
    }

    const bookingTotal = Number(currentBooking.total_price || currentBooking.price || 0);

    // F-560: refundAmount upper bound. The previous version trusted whatever
    // the admin sent. Cap to booking total (or a configurable grace percent
    // for admin courtesy refunds). Refuse negative or non-numeric.
    if (refundAmount !== undefined) {
      if (typeof refundAmount !== 'number' || !Number.isFinite(refundAmount) || refundAmount <= 0) {
        return NextResponse.json({ error: 'refundAmount must be a positive number' }, { status: 400 });
      }
      if (refundAmount > bookingTotal * 1.10) {
        return NextResponse.json(
          { error: `refundAmount ${refundAmount} exceeds booking total ${bookingTotal} (+10% grace)` },
          { status: 400 }
        );
      }
    }

    const calculatedRefund = typeof refundAmount === 'number' && refundAmount > 0
      ? refundAmount
      : bookingTotal;

    if (calculatedRefund <= 0) {
      return NextResponse.json({ error: 'Booking has no value to refund' }, { status: 400 });
    }

    const { error: updateErr } = await supabase
      .from('bookings')
      .update({
        status: 'refunded',
        refund_amount: calculatedRefund,
        refund_reason: normalizedReason,
        refunded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updateErr) {
      console.error('[API/admin/bookings/[id]/refund] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Credit the player's wallet so the refund actually lands. Without this
    // the booking row shows "refunded" but the player never sees the money.
    const { error: walletErr } = await supabase.rpc('increment_wallet_balance_admin', {
      amount: calculatedRefund,
      user_id: currentBooking.user_id,
      p_label: `Refund — Booking ${bookingId} (${normalizedReason})`,
    });
    if (walletErr) {
      // Best-effort: log but don't fail the API — the booking is already
      // marked refunded. The Sentry alert on this RPC failure is the safety net.
      console.error('[API/admin/bookings/[id]/refund] Wallet credit failed:', walletErr);
    }

    // Write audit log
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'REFUND_BOOKING',
      target_type: 'booking',
      target_id: String(bookingId),
      metadata: {
        reason: normalizedReason,
        refund_amount: calculatedRefund,
        player_id: currentBooking.user_id,
        facility_id: currentBooking.facility_id,
        idempotency_key: idempotencyKey || null,
        wallet_credit_error: walletErr?.message || null,
      },
      ip_address: ipAddress,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully refunded booking (₱${calculatedRefund.toLocaleString()})`,
      refundAmount: calculatedRefund,
      status: 'refunded',
    });
  } catch (err: unknown) {
    console.error('[API/admin/bookings/[id]/refund] Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
