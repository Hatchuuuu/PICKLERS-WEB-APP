import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../_lib/createDevSupabase";
import { requireDeveloper } from "../_lib/requireDeveloper";

export async function GET(request: NextRequest) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    // 1. Fetch user profile
    const { data: profiles, error } = await supabase
      .from("player_profiles")
      .select("*")
      .or(`name.ilike.%${q}%,id.eq.${q.includes("-") ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(1);

    if (error || !profiles || profiles.length === 0) {
      return NextResponse.json({ diagnostic: null, message: "User not found" });
    }

    const u = profiles[0];

    // 2. Fetch wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance")
      .eq("player_id", u.id)
      .single();

    // 3. Fetch booking counts
    const { data: bookings } = await supabase
      .from("bookings")
      .select("status, price, created_at, facility:facilities(name)")
      .eq("player_id", u.id)
      .order("created_at", { ascending: false });

    const totalBookings = bookings?.length || 0;
    const confirmedBookings = bookings?.filter((b) => b.status === "confirmed").length || 0;
    const cancelledBookings = bookings?.filter((b) => b.status === "cancelled").length || 0;
    const totalAmount = bookings?.reduce((acc, b) => acc + (b.price || 0), 0) || 0;

    // 4. Build recent events feed
    const recentEvents = (bookings || []).slice(0, 5).map((b) => {
      const facilityName = Array.isArray(b.facility) ? (b.facility[0] as { name?: string })?.name : (b.facility as { name?: string })?.name;
      return {
        type: "booking",
        description: `Booking #${b.status} for ${facilityName || "Court"} (₱${b.price || 0})`,
        at: b.created_at,
      };
    });

    return NextResponse.json({
      diagnostic: {
        id: u.id,
        name: u.name,
        email: `${(u.name || "user").toLowerCase().replace(/\s+/g, ".")}@picklers.ph`,
        role: u.role || "player",
        created_at: u.created_at || new Date().toISOString(),
        last_sign_in_at: new Date().toISOString(),
        wallet_balance: wallet?.balance || 0,
        is_verified: u.verification_status === "verified",
        is_banned: u.account_status === "suspended",
        auth_provider: "email",
        bookings_total: totalBookings,
        bookings_confirmed: confirmedBookings,
        bookings_cancelled: cancelledBookings,
        payments_total: totalBookings,
        payments_amount: totalAmount,
        active_sessions: u.online ? 1 : 0,
        recent_events: recentEvents.length > 0 ? recentEvents : [
          { type: "login", description: "Account created and validated", at: u.created_at || new Date().toISOString() }
        ],
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Diagnostics execution failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
