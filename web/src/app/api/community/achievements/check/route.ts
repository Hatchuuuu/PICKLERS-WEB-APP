import { NextResponse } from "next/server";
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

export async function POST(request: Request) {
  try {
    const supabase = await makeSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { tournament_id, results } = body;
    // results should be [{ user_id: string, rank: 1 | 2 | 3 }, ...]

    if (!tournament_id || !Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Verify user owns the tournament
    const { data: tournament, error: tourneyError } = await supabase
      .from("tournaments")
      .select("name, owner_id")
      .eq("id", tournament_id)
      .single();

    if (tourneyError || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    if (tournament.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized: only the tournament owner can award medals' }, { status: 403 });
    }

    const awarded = [];

    for (const result of results) {
      if (!result.user_id || ![1, 2, 3].includes(result.rank)) continue;

      let medalCol: "gold_medals" | "silver_medals" | "bronze_medals" = "gold_medals";
      let medalName = "";
      if (result.rank === 1) { medalCol = "gold_medals"; medalName = "Gold"; }
      if (result.rank === 2) { medalCol = "silver_medals"; medalName = "Silver"; }
      if (result.rank === 3) { medalCol = "bronze_medals"; medalName = "Bronze"; }

      // Award medal via RPC or direct update
      // Direct update is easiest if we select first, but RPC is safer against race conditions.
      // Since we don't have an RPC, we'll do read then write.
      const { data: profile } = await supabase
        .from("player_profiles")
        .select(medalCol)
        .eq("id", result.user_id)
        .single();

      if (profile) {
        const currentCount = profile[medalCol as keyof typeof profile] || 0;
        await supabase
          .from("player_profiles")
          .update({ [medalCol]: Number(currentCount) + 1 })
          .eq("id", result.user_id);

        // Also get their name for the feed post
        const { data: userProfile } = await supabase
          .from("player_profiles")
          .select("name")
          .eq("id", result.user_id)
          .single();

        if (userProfile) {
          // Create feed post
          await supabase
            .from("feed_posts")
            .insert({
              author_id: result.user_id,
              content: `🏆 ${userProfile.name} won ${medalName} at ${tournament.name}!`,
            });
          
          awarded.push({ user_id: result.user_id, rank: result.rank });
        }
      }
    }

    return NextResponse.json({ success: true, awarded });
  } catch (error: any) {
    console.error("Achievements Check Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
