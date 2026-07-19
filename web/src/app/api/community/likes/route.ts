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

export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { liked_id } = await req.json();
  if (!liked_id) return NextResponse.json({ error: "liked_id required" }, { status: 400 });

  const myId = session.user.id;

  const { data: existing } = await supabase
    .from("player_likes")
    .select("id")
    .eq("liker_id", myId)
    .eq("liked_id", liked_id)
    .maybeSingle();

  if (existing) {
    await supabase.from("player_likes").delete().eq("id", existing.id);
    const { count } = await supabase
      .from("player_likes")
      .select("*", { count: "exact", head: true })
      .eq("liked_id", liked_id);
    return NextResponse.json({ liked: false, like_count: count ?? 0 });
  } else {
    await supabase.from("player_likes").insert({ liker_id: myId, liked_id });
    const { count } = await supabase
      .from("player_likes")
      .select("*", { count: "exact", head: true })
      .eq("liked_id", liked_id);
    return NextResponse.json({ liked: true, like_count: count ?? 0 });
  }
}
