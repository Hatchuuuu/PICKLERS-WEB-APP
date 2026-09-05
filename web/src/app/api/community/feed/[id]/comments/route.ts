import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

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

/** GET /api/community/feed/[id]/comments — paginated comments for a post */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "0");
  const limit = 20;

  // Create a normalized cache key based on post ID and pagination parameters
  const cacheKey = generateCacheKey('feed-post-comments', `${postId}-${page}-${limit}`);

  // 1. Check HEURISTIC CACHE FIRST (medium TTL: 5 minutes for comments - balances freshness with performance)
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

  // 2. Try to get from API cache (shorter TTL: 1 minute)
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
  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from("feed_posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    // Try to return cached data on error (fallback to stale cache) for post not found
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData !== null) {
      return NextResponse.json({
        data: cachedData.data,
        cacheInfo: {
          source: 'fallback',
          timestamp: cachedData.timestamp,
          error: 'Using cached data due to error'
        }
      }, { status: 200 });
    }

    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const offset = page * limit;

  const { data: comments, error } = await supabase
    .from("feed_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) {
    // Try to return cached data on error (fallback to stale cache)
    const cachedData = await getCache<any>(cacheKey);
    if (cachedData !== null) {
      return NextResponse.json({
        data: cachedData.data,
        cacheInfo: {
          source: 'fallback',
          timestamp: cachedData.timestamp,
          error: 'Using cached data due to error'
        }
      }, { status: 200 });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Enrich with author profiles
  const authorIds = [...new Set((comments ?? []).map((c: { author_id: string }) => c.author_id))];
  const profileMap: Record<string, { id: string; name: string; avatar_url: string | null }> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);
    (profiles ?? []).forEach((p: { id: string; name: string; avatar_url: string | null }) => { profileMap[p.id] = p; });
  }

  const enriched = (comments ?? []).map((c: { id: string; post_id: string; author_id: string; content: string; created_at: string }) => ({
    id: c.id,
    post_id: c.post_id,
    author_id: c.author_id,
    author_name: profileMap[c.author_id]?.name ?? "Unknown",
    author_avatar_url: profileMap[c.author_id]?.avatar_url ?? null,
    content: c.content,
    created_at: c.created_at,
    like_count: 0,
    i_liked: false,
  }));

  const responseData = {
    data: enriched,
    cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
  };

  // Store in heuristic cache (TTL: 5 minutes = 300 seconds)
  await setCache(cacheKey, responseData, 300);

  // Store in API cache (TTL: 1 minute = 60 seconds)
  await setCache(`${cacheKey}:api`, responseData, 60);

  return NextResponse.json(responseData);
}

/** POST /api/community/feed/[id]/comments — add a comment */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;

  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from("feed_posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Comment content required" }, { status: 400 });
  }

  const { data: comment, error } = await supabase
    .from("feed_comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with author info
  const { data: profile } = await supabase
    .from("player_profiles")
    .select("name, avatar_url")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    ...comment,
    author_name: profile?.name ?? "Unknown",
    author_avatar_url: profile?.avatar_url ?? null,
    like_count: 0,
    i_liked: false,
  }, { status: 201 });
}