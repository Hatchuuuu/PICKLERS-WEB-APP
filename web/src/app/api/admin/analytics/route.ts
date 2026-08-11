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

    // 1. Total users
    const { count: totalUsers } = await supabase
      .from('player_profiles')
      .select('*', { count: 'exact', head: true });

    // 2. Total owners
    const { count: totalOwners } = await supabase
      .from('player_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'owner');

    // 3. Pending applications
    const { count: pendingApps } = await supabase
      .from('owner_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // 4. Active facilities
    const { count: activeFacilities } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true });

    // 5. Active promos
    const { count: activePromos } = await supabase
      .from('promotions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // 6. Bookings metrics (safely query bookings/court_bookings)
    let totalRevenue = 0;
    let bookingsToday = 0;
    let bookingsThisMonth = 0;

    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      // Attempt to query bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('total_price, created_at');

      if (bookingsData && Array.isArray(bookingsData)) {
        totalRevenue = bookingsData.reduce((acc, b) => acc + (Number(b.total_price) || 0), 0);
        bookingsToday = bookingsData.filter(b => new Date(b.created_at) >= todayStart).length;
        bookingsThisMonth = bookingsData.filter(b => new Date(b.created_at) >= monthStart).length;
      }
    } catch {
      // Table might not exist yet, default to 0
    }

    const stats = {
      total_users: totalUsers || 0,
      total_owners: totalOwners || 0,
      active_facilities: activeFacilities || 0,
      pending_applications: pendingApps || 0,
      total_revenue: totalRevenue,
      bookings_today: bookingsToday,
      bookings_this_month: bookingsThisMonth,
      active_promos: activePromos || 0
    };

    return NextResponse.json({ data: stats }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/analytics] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
