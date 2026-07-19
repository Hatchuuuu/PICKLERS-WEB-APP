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

export async function GET(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const myId = session.user.id;

  let query = supabase
    .from("player_profiles")
    .select("*")
    .neq("id", myId);

  if (q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`);
  }

  const { data: profiles, error } = await query.order("name").limit(50);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((p: any) => p.id);
  let likeCountMap: Record<string, number> = {};
  let iLikedSet = new Set<string>();

  if (profileIds.length > 0) {
    const { data: likesData } = await supabase
      .from("player_likes")
      .select("liker_id, liked_id")
      .in("liked_id", profileIds);

    for (const row of (likesData ?? [])) {
      likeCountMap[row.liked_id] = (likeCountMap[row.liked_id] ?? 0) + 1;
      if (row.liker_id === myId) iLikedSet.add(row.liked_id);
    }
  }

  const enriched = (profiles ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    level: p.level ?? "2.5",
    gold: p.gold_medals ?? 0,
    silver: p.silver_medals ?? 0,
    bronze: p.bronze_medals ?? 0,
    online: p.online ?? false,
    like_count: likeCountMap[p.id] ?? 0,
    i_liked: iLikedSet.has(p.id),
  }));

  return NextResponse.json(enriched);
}
