import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { getCache, setCache, generateCacheKey } from "@/lib/cacheUtils";

/** GET /api/community/feed — paginated feed of posts with optional author or following filter */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = user.id;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? "";
  const authorId = req.nextUrl.searchParams.get("author_id") ?? "";
  const followingOnly = req.nextUrl.searchParams.get("filter") === "following";
  const limit = 20;

  // Create a normalized cache key based on query parameters
  const cacheKey = generateCacheKey(
    'community-feed',
    `${myId}-${cursor}-${authorId}-${followingOnly}-${limit}`
  );

  // 1. Check HEURISTIC CACHE FIRST (short TTL for feed: 30 seconds)
  const cachedHeuristic = await getCache<any>(cacheKey);
  if (cachedHeuristic !== null) {
    return NextResponse.json({
      data: cachedHeuristic.data,
      cacheInfo: {
        source: 'heuristic',
        timestamp: cachedHeuristic.timestamp
      }
    }, { status: 200 });
  }

  // 2. Try to get from API cache (medium TTL: 5 minutes)
  const cachedAPI = await getCache<any>(`${cacheKey}:api`);
  if (cachedAPI !== null) {
    return NextResponse.json({
      data: cachedAPI.data,
      cacheInfo: {
        source: 'api',
        timestamp: cachedAPI.timestamp
      }
    }, { status: 200 });
  }

  // If not in cache, proceed with the original logic
  let posts: any[] = [];

  if (authorId) {
    // Specific author's posts (e.g. My Profile / Player Profile)
    let query = supabase
      .from("feed_posts")
      .select("*")
      .eq("author_id", authorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    posts = data ?? [];
  } else if (followingOnly) {
    // Following-only feed
    const { data: follows } = await supabase
      .from("player_follows")
      .select("following_id")
      .eq("follower_id", myId);

    const followingIds = [myId, ...(follows ?? []).map((f) => f.following_id)];

    let query = supabase
      .from("feed_posts")
      .select("*")
      .in("author_id", followingIds)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    posts = data ?? [];
  } else {
    // Global feed using RPC or direct fallback
    const { data, error } = await supabase.rpc("get_feed_posts", {
      viewer_id: myId,
      max_limit: limit,
      after_cursor: cursor || null,
    });

    if (error) {
      // Direct query fallback
      let fallbackQuery = supabase
        .from("feed_posts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cursor) {
        fallbackQuery = fallbackQuery.lt("created_at", cursor);
      }
      const fallbackRes = await fallbackQuery;
      if (fallbackRes.error) return NextResponse.json({ error: fallbackRes.error.message }, { status: 500 });
      posts = fallbackRes.data ?? [];
    } else {
      posts = data ?? [];
    }
  }

  if (!posts || posts.length === 0) {
    // Return empty array with cache info indicating empty result
    const emptyResponse = {
      data: [],
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };
    // Cache empty results for a short time to prevent repeated empty queries
    await setCache(cacheKey, emptyResponse, 30); // 30 seconds
    await setCache(`${cacheKey}:api`, emptyResponse, 60); // 1 minute
    return NextResponse.json(emptyResponse, { status: 200 });
  }

  // Enrich with author profiles
  const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
  const { data: profiles } = await supabase
    .from("player_profiles")
    .select("id, name, avatar_url, level")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  // Check which posts current user has liked
  const postIds = posts.map((p: any) => p.id);
  const { data: myLikes } = await supabase
    .from("feed_likes")
    .select("post_id")
    .eq("user_id", myId)
    .in("post_id", postIds);

  const likedSet = new Set((myLikes ?? []).map((l: any) => l.post_id));

  // Fetch 2 most recent comments per post for preview
  const { data: allComments } = await supabase
    .from("feed_comments")
    .select("*")
    .in("post_id", postIds)
    .order("created_at", { ascending: false });

  // Get comment author profiles
  const commentAuthorIds = [...new Set((allComments ?? []).map((c: { author_id: string }) => c.author_id))];
  const commentProfileMap: Record<string, { id: string; name: string; avatar_url: string | null }> = {};
  if (commentAuthorIds.length > 0) {
    const { data: commentProfiles } = await supabase
      .from("player_profiles")
      .select("id, name, avatar_url")
      .in("id", commentAuthorIds);
    (commentProfiles ?? []).forEach((p: { id: string; name: string; avatar_url: string | null }) => { commentProfileMap[p.id] = p; });
  }

  // Group comments by post_id (max 2 per post)
  const commentsByPost: Record<string, any[]> = {};
  for (const c of (allComments ?? [])) {
    if (!commentsByPost[c.post_id]) commentsByPost[c.post_id] = [];
    if (commentsByPost[c.post_id].length < 2) {
      commentsByPost[c.post_id].push({
        id: c.id,
        post_id: c.post_id,
        author_id: c.author_id,
        author_name: commentProfileMap[c.author_id]?.name ?? "Unknown",
        author_avatar_url: commentProfileMap[c.author_id]?.avatar_url ?? null,
        content: c.content,
        created_at: c.created_at,
      });
    }
  }

  const enriched = posts.map((p: any) => ({
    id: p.id,
    author_id: p.author_id,
    author_name: profileMap[p.author_id]?.name ?? "Unknown",
    author_avatar_url: profileMap[p.author_id]?.avatar_url ?? null,
    author_level: profileMap[p.author_id]?.level ?? "2.5",
    content: p.content,
    image_url: p.image_url,
    post_type: p.post_type ?? "text",
    like_count: p.like_count,
    comment_count: p.comment_count,
    i_liked: likedSet.has(p.id),
    created_at: p.created_at,
    recent_comments: commentsByPost[p.id] ?? [],
  }));

  const responseData = {
    data: enriched,
    cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
  };

  // Store in heuristic cache (short TTL: 30 seconds)
  await setCache(cacheKey, responseData, 30);

  // Store in API cache (medium TTL: 5 minutes = 300 seconds)
  await setCache(`${cacheKey}:api`, responseData, 300);

  return NextResponse.json(responseData, { status: 200 });
}

/** POST /api/community/feed — create a new post */
export async function POST(req: NextRequest) {
  // Apply rate limit: max 10 posts per 60 seconds
  const rateLimitResponse = await checkRateLimit(req, "feed-post", 10, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    content: z.string().max(3000, "Post too long").optional().nullable(),
    image_url: z.string().url().max(1000).optional().nullable(),
    post_type: z.enum(["text", "match_result", "challenge", "highlight"]).optional().default("text"),
  }).refine(data => data.content?.trim() || data.image_url, {
    message: "Post must have content or an image"
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { content, image_url, post_type } = parsed.data;

  const { data: post, error } = await supabase
    .from("feed_posts")
    .insert({
      author_id: user.id,
      content: content?.trim() || null,
      image_url: image_url || null,
      post_type: post_type || "text",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with author info for immediate display
  const { data: profile } = await supabase
    .from("player_profiles")
    .select("name, avatar_url, level")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    ...post,
    author_name: profile?.name ?? "Unknown",
    author_avatar_url: profile?.avatar_url ?? null,
    author_level: profile?.level ?? "2.5",
    i_liked: false,
    recent_comments: [],
  }, { status: 201 });
}
