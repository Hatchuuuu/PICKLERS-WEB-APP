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

/** POST /api/community/feed/[id]/like — toggle like on a feed post */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: postId } = await params;
  const myId = user.id;

  // Check if post exists
  const { data: post, error: postError } = await supabase
    .from("feed_posts")
    .select("id")
    .eq("id", postId)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  // Check if already liked
  const { data: existing } = await supabase
    .from("feed_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", myId)
    .maybeSingle();

  if (existing) {
    // Unlike
    await supabase.from("feed_likes").delete().eq("id", existing.id);
    // Get updated count
    const { data: updatedPost, error: updateError } = await supabase
      .from("feed_posts")
      .select("like_count")
      .eq("id", postId)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ liked: false, like_count: updatedPost?.like_count ?? 0 });
  } else {
    // Like
    await supabase.from("feed_likes").insert({ post_id: postId, user_id: myId });
    // Get updated count
    const { data: updatedPost, error: updateError } = await supabase
      .from("feed_posts")
      .select("like_count")
      .eq("id", postId)
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ liked: true, like_count: updatedPost?.like_count ?? 0 });
  }
}