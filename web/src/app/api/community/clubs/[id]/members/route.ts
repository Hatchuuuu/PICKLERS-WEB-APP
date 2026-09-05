import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clubId } = await params;

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

  const userIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  const nameMap: Record<string, { name: string; level: string; avatar_url: string | null }> = {};
  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, level, avatar_url")
      .in("id", userIds);
    (profiles ?? []).forEach((p: { id: string; name: string; level: string | null; avatar_url: string | null }) => { 
      nameMap[p.id] = { name: p.name, level: p.level ?? "2.5", avatar_url: p.avatar_url ?? null }; 
    });
  }

  const enriched = (members ?? []).map((m: { id: string; user_id: string; status: string; joined_at: string }) => ({
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
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: clubId } = await params;
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
