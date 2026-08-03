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

/** GET /api/community/feed/[id]/comments — paginated comments for a post */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = params.id;

  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from("feed_posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "0");
  const limit = 20;
  const offset = page * limit;

  const { data: comments, error } = await supabase
    .from("feed_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with author profiles
  const authorIds = [...new Set((comments ?? []).map((c: any) => c.author_id))];
  let profileMap: Record<string, any> = {};
  if (authorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, avatar_url")
      .in("id", authorIds);
    (profiles ?? []).forEach((p: any) => { profileMap[p.id] = p; });
  }

  const enriched = (comments ?? []).map((c: any) => ({
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

  return NextResponse.json(enriched);
}

/** POST /api/community/feed/[id]/comments — add a comment */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = params.id;

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