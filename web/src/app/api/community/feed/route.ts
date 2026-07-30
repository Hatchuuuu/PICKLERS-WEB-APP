import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

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

/** GET /api/community/feed — paginated feed of posts from people you follow + your own */
export async function GET(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = user.id;
  const cursor = req.nextUrl.searchParams.get("cursor");
  const limit = 20;

  // Fetch posts using the optimized RPC function
  const { data: posts, error } = await supabase.rpc("get_feed_posts", {
    viewer_id: myId,
    max_limit: limit,
    after_cursor: cursor || null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!posts || posts.length === 0) {
    return NextResponse.json([]);
  }

  // Enrich with author profiles
  const authorIds = [...new Set(posts.map((p: any) => p.author_id))];
  const { data: profiles } = await supabase
    .from("player_profiles")
    .select("id, name, avatar_url, level")
    .in("id", authorIds);

  const profileMap: Record<string, any> = {};
  (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });

  // Check which posts the current user has liked
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
  const commentAuthorIds = [...new Set((allComments ?? []).map((c: any) => c.author_id))];
  let commentProfileMap: Record<string, any> = {};
  if (commentAuthorIds.length > 0) {
    const { data: commentProfiles } = await supabase
      .from("player_profiles")
      .select("id, name, avatar_url")
      .in("id", commentAuthorIds);
    (commentProfiles ?? []).forEach((p: any) => { commentProfileMap[p.id] = p; });
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
    like_count: p.like_count,
    comment_count: p.comment_count,
    i_liked: likedSet.has(p.id),
    created_at: p.created_at,
    recent_comments: commentsByPost[p.id] ?? [],
  }));

  return NextResponse.json(enriched);
}

/** POST /api/community/feed — create a new post */
export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    content: z.string().max(3000, "Post too long").optional().nullable(),
    image_url: z.string().url().max(1000).optional().nullable()
  }).refine(data => data.content?.trim() || data.image_url, {
    message: "Post must have content or an image"
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { content, image_url } = parsed.data;

  const { data: post, error } = await supabase
    .from("feed_posts")
    .insert({
      author_id: user.id,
      content: content?.trim() || null,
      image_url: image_url || null,
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
