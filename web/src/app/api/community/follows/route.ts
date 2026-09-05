import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

/**
 * POST /api/community/follows
 * Toggle follow/unfollow for a player.
 * Body: { following_id: string }
 * Returns: { following: boolean, follower_count: number }
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const following_id = body.following_id ?? body.liked_id; // backward compat
  if (!following_id) return NextResponse.json({ error: "following_id required" }, { status: 400 });

  const myId = user.id;

  // Prevent self-follow
  if (following_id === myId) {
    return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
  }

  const { data: existing } = await supabase
    .from("player_follows")
    .select("id")
    .eq("follower_id", myId)
    .eq("following_id", following_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("player_follows").delete().eq("id", existing.id);
    const { count } = await supabase
      .from("player_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", following_id);
    return NextResponse.json({ following: false, follower_count: count ?? 0 });
  } else {
    await supabase.from("player_follows").insert({ follower_id: myId, following_id });
    const { count } = await supabase
      .from("player_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", following_id);
    return NextResponse.json({ following: true, follower_count: count ?? 0 });
  }
}
