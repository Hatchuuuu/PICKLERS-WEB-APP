import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdmin } from '../_lib/requireAdmin';

export async function GET(_request: NextRequest) {
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

    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API/admin/promotions] GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data || [] }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/promotions] GET Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const body = await request.json();
    const {
      code,
      description,
      discount_type,
      discount_value,
      min_booking_amount,
      max_uses,
      applicable_to,
      starts_at,
      expires_at
    } = body;

    if (!code || !discount_type || !discount_value) {
      return NextResponse.json({ error: 'Missing required promo fields' }, { status: 400 });
    }

    const formattedCode = String(code).trim().toUpperCase();

    const { data: promoData, error: insertErr } = await supabase
      .from('promotions')
      .insert({
        code: formattedCode,
        description: description || null,
        discount_type,
        discount_value: parseFloat(discount_value),
        min_booking_amount: min_booking_amount ? parseFloat(min_booking_amount) : 0,
        max_uses: max_uses ? parseInt(max_uses, 10) : null,
        applicable_to: applicable_to || 'all',
        starts_at: starts_at || null,
        expires_at: expires_at || null,
        created_by: adminId,
        is_active: true
      })
      .select()
      .single();

    if (insertErr) {
      console.error('[API/admin/promotions] POST insert error:', insertErr);
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'CREATE_PROMO',
      target_type: 'promotion',
      target_id: promoData.id,
      metadata: {
        code: formattedCode,
        discount_type,
        discount_value
      },
      ip_address: ipAddress
    });

    return NextResponse.json({ success: true, data: promoData }, { status: 201 });
  } catch (err: any) {
    console.error('[API/admin/promotions] POST Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
