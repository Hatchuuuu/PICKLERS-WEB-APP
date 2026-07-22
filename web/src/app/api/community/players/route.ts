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
  const idParam = req.nextUrl.searchParams.get("id");
  const myId = session.user.id;

  let query = supabase.from("player_profiles").select("*").neq("id", myId);

  if (idParam) {
    query = query.eq("id", idParam);
  } else if (q.trim()) {
    query = query.ilike("name", `%${q.trim()}%`).order("name").limit(50);
  } else {
    // If no search query, we fetch up to 100 profiles to score and return top 15
    query = query.limit(100);
  }

  const { data: profiles, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((p: any) => p.id);
  
  if (profileIds.length === 0) return NextResponse.json([]);

  // --- Scoring / Enrichment Data ---
  
  // 1. My Data (for People You May Know scoring)
  let myLevel = "2.5";
  const myClubIds = new Set<string>();
  const myFollowedIds = new Set<string>();

  if (!q.trim() && !idParam) {
    const { data: myProfile } = await supabase.from("player_profiles").select("level").eq("id", myId).single();
    if (myProfile) myLevel = myProfile.level;

    const { data: myClubs } = await supabase.from("club_members").select("club_id").eq("user_id", myId);
    (myClubs ?? []).forEach(c => myClubIds.add(c.club_id));

    const { data: myLikes } = await supabase.from("player_likes").select("liked_id").eq("liker_id", myId);
    (myLikes ?? []).forEach(l => myFollowedIds.add(l.liked_id));
  }

  // 2. Their Data
  const likeCountMap: Record<string, number> = {};
  const iLikedSet = new Set<string>();
  const theirClubMemberships: Record<string, Set<string>> = {};
  const theirFollows: Record<string, Set<string>> = {};
  const theirRecentPosts: Record<string, number> = {}; // count of posts in last 7 days

  // Get Likes (who liked them, and did I like them?)
  const { data: likesReceivedData } = await supabase
    .from("player_likes")
    .select("liker_id, liked_id")
    .in("liked_id", profileIds);

  for (const row of (likesReceivedData ?? [])) {
    likeCountMap[row.liked_id] = (likeCountMap[row.liked_id] ?? 0) + 1;
    if (row.liker_id === myId) iLikedSet.add(row.liked_id);
  }

  // If we are doing recommendations, we need more data for scoring
  if (!q.trim() && !idParam) {
    // Their club memberships
    const { data: clubMembersData } = await supabase
      .from("club_members")
      .select("user_id, club_id")
      .in("user_id", profileIds);
    for (const row of (clubMembersData ?? [])) {
      if (!theirClubMemberships[row.user_id]) theirClubMemberships[row.user_id] = new Set();
      theirClubMemberships[row.user_id].add(row.club_id);
    }

    // Who they follow
    const { data: likesGivenData } = await supabase
      .from("player_likes")
      .select("liker_id, liked_id")
      .in("liker_id", profileIds);
    for (const row of (likesGivenData ?? [])) {
      if (!theirFollows[row.liker_id]) theirFollows[row.liker_id] = new Set();
      theirFollows[row.liker_id].add(row.liked_id);
    }

    // Recent activity (posts in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: postsData } = await supabase
      .from("feed_posts")
      .select("author_id")
      .in("author_id", profileIds)
      .gte("created_at", sevenDaysAgo.toISOString());
    for (const row of (postsData ?? [])) {
      theirRecentPosts[row.author_id] = (theirRecentPosts[row.author_id] ?? 0) + 1;
    }
  }

  // --- Map & Score ---
  
  let enriched = (profiles ?? []).map((p: any) => {
    let score = 0;
    
    if (!q.trim() && !idParam) {
      // (same_level × 3)
      if (p.level === myLevel) score += 3;

      // (shared_clubs × 5)
      const theirClubs = theirClubMemberships[p.id] ?? new Set();
      let sharedClubs = 0;
      theirClubs.forEach(cid => { if (myClubIds.has(cid)) sharedClubs++; });
      score += sharedClubs * 5;

      // (mutual_follows × 2)
      // "Mutual follows": how many people do they follow that I ALSO follow
      const theyFollow = theirFollows[p.id] ?? new Set();
      let sharedFollows = 0;
      theyFollow.forEach(fid => { if (myFollowedIds.has(fid)) sharedFollows++; });
      score += sharedFollows * 2;

      // (recent_activity × 1)
      const postsCount = theirRecentPosts[p.id] ?? 0;
      score += (postsCount > 0 ? 1 : 0); // Cap at +1 for activity, or postsCount * 1 depending on spec. Let's do postsCount * 1.
    }

    return {
      id: p.id,
      name: p.name,
      avatar_url: p.avatar_url,
      level: p.level ?? "2.5",
      gold: p.gold_medals ?? 0,
      silver: p.silver_medals ?? 0,
      bronze: p.bronze_medals ?? 0,
      online: p.online ?? false,
      like_count: likeCountMap[p.id] ?? 0,
      i_liked: iLikedSet.has(p.id),
      _score: score // internal use for sorting
    };
  });

  // If no search query, sort by score and limit to 15
  if (!q.trim() && !idParam) {
    // Filter out people I already follow for the "People You May Know" widget?
    // Usually PYMK filters out existing friends.
    enriched = enriched.filter(p => !p.i_liked);
    enriched.sort((a, b) => b._score - a._score);
    enriched = enriched.slice(0, 15);
  }

  // Clean up internal _score
  const finalResult = enriched.map(({ _score, ...rest }) => rest);

  return NextResponse.json(finalResult);
}
