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

/** GET /api/community/clubs — list all clubs with current user membership status */
export async function GET(_req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  // Create a normalized cache key based on user ID (for personalized data like my_status)
  const cacheKey = generateCacheKey('community-clubs', userId);

  // 1. Check HEURISTIC CACHE FIRST (medium TTL: 5 minutes for club listings)
  const cachedHeuristic = await getCache<any>(cacheKey);
  if (cachedHeuristic !== null) {
    const list = Array.isArray(cachedHeuristic) ? cachedHeuristic : cachedHeuristic.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // 2. Try to get from API cache (shorter TTL: 1 minute)
  const cachedAPI = await getCache<any>(`${cacheKey}:api`);
  if (cachedAPI !== null) {
    const list = Array.isArray(cachedAPI) ? cachedAPI : cachedAPI.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // If not in cache, proceed with the original logic
  const { data: clubs, error } = await supabase
    .from("clubs")
    .select("*, club_members(user_id, status)")
    .order("created_at", { ascending: false });

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

  const adminIds = [...new Set((clubs ?? []).map((c: { admin_id?: string }) => c.admin_id).filter(Boolean))];
  const adminNameMap: Record<string, string> = {};
  if (adminIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name")
      .in("id", adminIds);
    (profiles ?? []).forEach((p: { id: string; name: string }) => { adminNameMap[p.id] = p.name; });
  }

  const enriched = (clubs ?? []).map((club: any) => {
    const myMembership = (club.club_members ?? []).find((m: any) => m.user_id === userId);
    return {
      id: club.id,
      name: club.name,
      description: club.description,
      banner_url: club.banner_url,
      admin_id: club.admin_id,
      admin_name: adminNameMap[club.admin_id] ?? "Unknown",
      member_count: club.member_count,
      my_status: myMembership ? myMembership.status : "none",
      created_at: club.created_at,
    };
  });

  // Store in heuristic cache (TTL: 5 minutes = 300 seconds)
  await setCache(cacheKey, enriched, 300);

  // Store in API cache (TTL: 1 minute = 60 seconds)
  await setCache(`${cacheKey}:api`, enriched, 60);

  return NextResponse.json(enriched);
}

/** POST /api/community/clubs — create a new club */
export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, description } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name is required" }, { status: 400 });

  const { data: club, error } = await supabase
    .from("clubs")
    .insert({ name: name.trim(), description: description?.trim() ?? null, admin_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase.from("club_members").insert({
    club_id: club.id,
    user_id: user.id,
    status: "admin",
  });

  return NextResponse.json(club, { status: 201 });
}
