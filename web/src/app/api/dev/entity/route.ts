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
    // 1. Check user profiles
    const { data: users } = await supabase
      .from("player_profiles")
      .select("*, bookings:bookings!player_id(count), wallet:wallets(balance)")
      .or(`name.ilike.%${q}%,id.eq.${q.includes("-") ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(1);

    if (users && users.length > 0) {
      const u = users[0];
      return NextResponse.json({
        result: {
          type: "user",
          id: u.id,
          title: u.name || "User Profile",
          subtitle: `${u.role} · ${u.verification_status || "unverified"}`,
          fields: {
            id: u.id,
            name: u.name,
            role: u.role,
            level: u.level,
            online: u.online,
            verification_status: u.verification_status,
            gold_medals: u.gold_medals,
            silver_medals: u.silver_medals,
            bronze_medals: u.bronze_medals,
            is_admin: u.is_admin,
          },
          relations: [
            { label: "Bookings", count: u.bookings?.[0]?.count || 0, type: "booking" },
            { label: "Wallet Balance", count: u.wallet?.[0]?.balance || 0, type: "payment" },
          ],
        },
      });
    }

    // 2. Check bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select("*, player:player_profiles!player_id(name), facility:facilities!facility_id(name)")
      .or(`id.eq.${q.includes("-") ? q : "00000000-0000-0000-0000-000000000000"}`)
      .limit(1);

    if (bookings && bookings.length > 0) {
      const b = bookings[0];
      return NextResponse.json({
        result: {
          type: "booking",
          id: b.id,
          title: `Booking #${b.id.slice(0, 8)}`,
          subtitle: `${b.status} · ${b.facility?.name || "Facility"}`,
          fields: {
            id: b.id,
            status: b.status,
            price: b.price,
            date: b.date,
            time: b.time,
            court_number: b.court_number,
            player_id: b.player_id,
            facility_id: b.facility_id,
            created_at: b.created_at,
          },
          relations: [
            { label: "Player", count: 1, type: "user" },
            { label: "Facility", count: 1, type: "facility" },
          ],
        },
      });
    }

    // 3. Check facilities
    const { data: facilities } = await supabase
      .from("facilities")
      .select("*, bookings:bookings!facility_id(count)")
      .or(`name.ilike.%${q}%,location.ilike.%${q}%`)
      .limit(1);

    if (facilities && facilities.length > 0) {
      const f = facilities[0];
      return NextResponse.json({
        result: {
          type: "facility",
          id: f.id,
          title: f.name,
          subtitle: `${f.location || "Location"} · ${f.courts || 0} courts`,
          fields: {
            id: f.id,
            name: f.name,
            location: f.location,
            courts: f.courts,
            price_per_hour: f.price_per_hour,
            is_verified: f.is_verified,
            owner_id: f.owner_id,
          },
          relations: [
            { label: "Bookings", count: f.bookings?.[0]?.count || 0, type: "booking" },
            { label: "Owner", count: 1, type: "user" },
          ],
        },
      });
    }

    return NextResponse.json({ result: null, message: "No entity found" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Entity search error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
