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

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clubId = params.id;

  const { data: myMem } = await supabase
    .from("club_members")
    .select("status")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  const isAdmin = myMem?.status === "admin";

  const { data: members, error } = await supabase
    .from("club_members")
    .select("id, user_id, status, joined_at")
    .eq("club_id", clubId)
    .in("status", isAdmin ? ["pending", "member", "admin"] : ["member", "admin"])
    .order("joined_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const userIds = (members ?? []).map((m: any) => m.user_id);
  let nameMap: Record<string, { name: string; level: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, level, avatar_url")
      .in("id", userIds);
    (profiles ?? []).forEach((p: any) => { nameMap[p.id] = { name: p.name, level: p.level, avatar_url: p.avatar_url ?? null }; });
  }

  const enriched = (members ?? []).map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    name: nameMap[m.user_id]?.name ?? "Unknown",
    avatar_url: nameMap[m.user_id]?.avatar_url ?? null,
    level: nameMap[m.user_id]?.level ?? "2.5",
    status: m.status,
    joined_at: m.joined_at,
  }));

  return NextResponse.json(enriched);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const clubId = params.id;
  const { member_user_id, action } = await req.json();

  const { data: myMem } = await supabase
    .from("club_members")
    .select("status")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (myMem?.status !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === "accept") {
    const { error } = await supabase
      .from("club_members")
      .update({ status: "member" })
      .eq("club_id", clubId)
      .eq("user_id", member_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "member" });
  } else if (action === "reject") {
    const { error } = await supabase
      .from("club_members")
      .delete()
      .eq("club_id", clubId)
      .eq("user_id", member_user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ status: "removed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
