import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../_lib/rateLimit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_promo_mutation', 30, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const promoId = resolvedParams.id;
    const body = await request.json();

    const allowedFields = [
      'code',
      'description',
      'discount_type',
      'discount_value',
      'min_booking_amount',
      'max_uses',
      'applicable_to',
      'starts_at',
      'expires_at',
      'is_active',
    ];

    const cleanPayload: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        cleanPayload[key] = body[key];
      }
    }

    if (Object.keys(cleanPayload).length === 0) {
      return NextResponse.json({ error: 'No valid update fields provided' }, { status: 400 });
    }

    const { data: currentPromo, error: fetchErr } = await supabase
      .from('promotions')
      .select('code, is_active')
      .eq('id', promoId)
      .single();

    if (fetchErr || !currentPromo) {
      return NextResponse.json({ error: 'Promotion not found' }, { status: 404 });
    }

    const { error: updateErr } = await supabase
      .from('promotions')
      .update(cleanPayload)
      .eq('id', promoId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const action =
      body.is_active === false
        ? 'DEACTIVATE_PROMO'
        : body.is_active === true
        ? 'ACTIVATE_PROMO'
        : 'UPDATE_PROMO';
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action,
      target_type: 'promotion',
      target_id: promoId,
      metadata: { code: currentPromo.code, updates: body },
      ip_address: ipAddress
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/promotions/[id]] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_promo_delete', 15, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const promoId = resolvedParams.id;

    const { data: currentPromo } = await supabase
      .from('promotions')
      .select('code')
      .eq('id', promoId)
      .single();

    const { error: deleteErr } = await supabase
      .from('promotions')
      .delete()
      .eq('id', promoId);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'DELETE_PROMO',
      target_type: 'promotion',
      target_id: promoId,
      metadata: { code: currentPromo?.code },
      ip_address: ipAddress
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/promotions/[id]] DELETE Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
