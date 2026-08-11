import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdmin } from '../../_lib/requireAdmin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const promoId = params.id;
    const body = await request.json();

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
      .update(body)
      .eq('id', promoId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    const action = body.is_active === false ? 'DEACTIVATE_PROMO' : 'UPDATE_PROMO';
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
  } catch (err: any) {
    console.error('[API/admin/promotions/[id]] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
