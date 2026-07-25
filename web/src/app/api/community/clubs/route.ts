import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

/** GET /api/community/clubs — list all clubs with current user membership status */
export async function GET(_req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*, club_members(user_id, status)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userId = session?.user?.id;

  const adminIds = [...new Set((clubs ?? []).map((c: any) => c.admin_id).filter(Boolean))];
  let adminNameMap: Record<string, string> = {};
  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name")
      .in("id", adminIds);
    (profiles ?? []).forEach((p: any) => { adminNameMap[p.id] = p.name; });
  }

  const enriched = (clubs ?? []).map((club: any) => {
    const myMembership = (club.club_members ?? []).find((m: any) => m.user_id === userId);
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      banner_url: club.banner_url,
      admin_id: club.admin_id,
      admin_name: adminNameMap[club.admin_id] ?? "Unknown",
      member_count: club.member_count,
      my_status: myMembership ? myMembership.status : "none",
      created_at: club.created_at,
    };
  });

  return NextResponse.json(enriched);
}

/** POST /api/community/clubs — create a new club */
export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({ name: name.trim(), description: description?.trim() ?? null, admin_id: session.user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("club_members").insert({
    club_id: club.id,
    user_id: session.user.id,
    status: "admin",
  });

  return NextResponse.json(club, { status: 201 });
}
