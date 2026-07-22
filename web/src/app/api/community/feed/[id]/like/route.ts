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
  { params }: { params: { id: string } }
) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const postId = params.id;
  const myId = session.user.id;

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
    const { data: post } = await supabase
      .from("feed_posts")
      .select("like_count")
      .eq("id", postId)
      .single();
    return NextResponse.json({ liked: false, like_count: post?.like_count ?? 0 });
  } else {
    // Like
    await supabase.from("feed_likes").insert({ post_id: postId, user_id: myId });
    const { data: post } = await supabase
      .from("feed_posts")
      .select("like_count")
      .eq("id", postId)
      .single();
    return NextResponse.json({ liked: true, like_count: post?.like_count ?? 0 });
  }
}
