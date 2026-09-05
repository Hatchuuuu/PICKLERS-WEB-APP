import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCache, setCache, generateCacheKey } from "@/lib/cacheUtils";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q") ?? "";
  const idParam = req.nextUrl.searchParams.get("id");
  const myId = user.id;

  // Create a normalized cache key based on query parameters
  const cacheKey = generateCacheKey('community-players', `${q}-${idParam}-${myId}`);

  // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for recommendations, 10 min for search)
  const cachedHeuristic = await getCache<any>(cacheKey);
  if (cachedHeuristic !== null) {
    const list = Array.isArray(cachedHeuristic) ? cachedHeuristic : cachedHeuristic.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // 2. Try to get from API cache (shorter TTL: 10 minutes)
  const cachedAPI = await getCache<any>(`${cacheKey}:api`);
  if (cachedAPI !== null) {
    const list = Array.isArray(cachedAPI) ? cachedAPI : cachedAPI.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // If not in cache, proceed with the original logic
  let query = supabase.from("player_profiles").select("*");

  if (idParam) {
    query = query.eq("id", idParam);
  } else {
    query = query.neq("id", myId);
    if (q.trim()) {
      query = query.ilike("name", `%${q.trim()}%`).order("name").limit(50);
    } else {
      // If no search query, we fetch up to 100 profiles to score and return top 15
      query = query.limit(100);
    }
  }

  const { data: profiles, error } = await query;
  if (error) {
    // Try to return cached data on error (fallback to stale cache)
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData !== null) {
      const list = Array.isArray(cachedData) ? cachedData : cachedData.data || [];
      return NextResponse.json(list, { status: 200 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const profileIds = (profiles ?? []).map((p: any) => p.id);

  if (profileIds.length === 0) {
    await setCache(cacheKey, [], 30); // 30 seconds
    await setCache(`${cacheKey}:api`, [], 60); // 1 minute
    return NextResponse.json([], { status: 200 });
  }

  // --- Scoring / Enrichment Data ---

  // 1. My Data (for People You May Know scoring)
  let myLevel = "2.5";
  const myClubIds = new Set<string>();
  const myFollowedIds = new Set<string>();

  if (!q.trim() && !idParam) {
    const [myProfileRes, myClubsRes, myFollowsRes] = await Promise.all([
      supabase.from("player_profiles").select("level").eq("id", myId).single(),
      supabase.from("club_members").select("club_id").eq("user_id", myId),
      supabase.from("player_follows").select("following_id").eq("follower_id", myId),
    ]);

    if (myProfileRes.data) myLevel = myProfileRes.data.level;
    (myClubsRes.data ?? []).forEach(c => myClubIds.add(c.club_id));
    (myFollowsRes.data ?? []).forEach(l => myFollowedIds.add(l.following_id));
  }

  // 2. Their Data (Fetched in parallel via Promise.all)
  const likeCountMap: Record<string, number> = {};
  const iLikedSet = new Set<string>();
  const theirClubMemberships: Record<string, Set<string>> = {};
  const theirFollows: Record<string, Set<string>> = {};
  const theirRecentPosts: Record<string, number> = {};

  const isRecommendMode = !q.trim() && !idParam;
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const [followsReceivedRes, clubMembersRes, followsGivenRes, postsRes] = await Promise.all([
    supabase.from("player_follows").select("follower_id, following_id").in("following_id", profileIds),
    isRecommendMode ? supabase.from("club_members").select("user_id, club_id").in("user_id", profileIds) : Promise.resolve({ data: null }),
    isRecommendMode ? supabase.from("player_follows").select("follower_id, following_id").in("follower_id", profileIds) : Promise.resolve({ data: null }),
    isRecommendMode ? supabase.from("feed_posts").select("author_id").in("author_id", profileIds).gte("created_at", sevenDaysAgo.toISOString()) : Promise.resolve({ data: null }),
  ]);

  for (const row of (followsReceivedRes.data ?? [])) {
    likeCountMap[row.following_id] = (likeCountMap[row.following_id] ?? 0) + 1;
    if (row.follower_id === myId) iLikedSet.add(row.following_id);
  }

  if (isRecommendMode) {
    for (const row of (clubMembersRes.data ?? [])) {
      if (!theirClubMemberships[row.user_id]) theirClubMemberships[row.user_id] = new Set();
      theirClubMemberships[row.user_id].add(row.club_id);
    }
    for (const row of (followsGivenRes.data ?? [])) {
      if (!theirFollows[row.follower_id]) theirFollows[row.follower_id] = new Set();
      theirFollows[row.follower_id].add(row.following_id);
    }
    for (const row of (postsRes.data ?? [])) {
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
      follower_count: likeCountMap[p.id] ?? 0,
      /** @deprecated use follower_count — kept for backward compat */
      like_count: likeCountMap[p.id] ?? 0,
      i_follow: iLikedSet.has(p.id),
      /** @deprecated use i_follow — kept for backward compat */
      i_liked: iLikedSet.has(p.id),
      _score: score // internal use for sorting
    };
  });

  // If no search query, sort by score and limit to 15
  if (!q.trim() && !idParam) {
    // Filter out people I already follow for the "People You May Know" widget
    enriched = enriched.filter(p => !p.i_follow);
    enriched.sort((a, b) => b._score - a._score);
    enriched = enriched.slice(0, 15);
  }

  // Clean up internal _score
  const finalResult = enriched.map(({ _score, ...rest }) => rest);

  // Determine TTL based on query type
  let heuristicTTL = 3600; // 1 hour default
  let apiTTL = 600; // 10 minutes default

  if (!q.trim() && !idParam) {
    heuristicTTL = 3600; // 1 hour
    apiTTL = 1800; // 30 minutes
  } else if (q.trim()) {
    heuristicTTL = 300; // 5 minutes
    apiTTL = 600; // 10 minutes
  }

  // Store in heuristic cache
  await setCache(cacheKey, finalResult, heuristicTTL);

  // Store in API cache
  await setCache(`${cacheKey}:api`, finalResult, apiTTL);

  return NextResponse.json(finalResult, { status: 200 });
}
