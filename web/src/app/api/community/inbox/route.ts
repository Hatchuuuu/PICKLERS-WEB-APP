import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getCache, setCache, generateCacheKey } from "@/lib/cacheUtils";

/**
 * GET /api/community/inbox — list all conversations, sorted by most recent message
 *
 * Uses the optimized get_inbox RPC with fallback to query aggregation.
 */
export async function GET(_req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = user.id;

  // Create a normalized cache key based on user ID
  const cacheKey = generateCacheKey('community-inbox', myId);

  // 1. Check HEURISTIC CACHE FIRST (medium TTL: 2 minutes for inbox data)
  const cachedHeuristic = await getCache<any>(cacheKey);
  if (cachedHeuristic !== null) {
    const list = Array.isArray(cachedHeuristic) ? cachedHeuristic : cachedHeuristic.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // 2. Try to get from API cache (shorter TTL: 30 seconds)
  const cachedAPI = await getCache<any>(`${cacheKey}:api`);
  if (cachedAPI !== null) {
    const list = Array.isArray(cachedAPI) ? cachedAPI : cachedAPI.data || [];
    return NextResponse.json(list, { status: 200 });
  }

  // If not in cache, proceed with the original logic
  // 1. Try optimized database RPC
  const { data: rpcData, error: rpcError } = await supabase.rpc("get_inbox", {
    p_user_id: myId,
  });

  if (!rpcError && Array.isArray(rpcData)) {
    // Store in heuristic cache (TTL: 2 minutes = 120 seconds)
    await setCache(cacheKey, rpcData, 120);

    // Store in API cache (TTL: 30 seconds = 30 seconds)
    await setCache(`${cacheKey}:api`, rpcData, 30);

    return NextResponse.json(rpcData);
  }

  // 2. Fallback in case RPC is not yet applied
  const { data: sentMessages } = await supabase
    .from("direct_messages")
    .select("receiver_id, content, created_at")
    .eq("sender_id", myId)
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: receivedMessages } = await supabase
    .from("direct_messages")
    .select("sender_id, content, created_at, read")
    .eq("receiver_id", myId)
    .order("created_at", { ascending: false })
    .limit(200);

  const convMap = new Map<string, { user_id: string; last_message: string; last_at: string; unread_count: number }>();

  for (const msg of (sentMessages ?? [])) {
    const partnerId = msg.receiver_id;
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { user_id: partnerId, last_message: msg.content, last_at: msg.created_at, unread_count: 0 });
    } else {
      const existing = convMap.get(partnerId)!;
      if (new Date(msg.created_at) > new Date(existing.last_at)) {
        existing.last_message = msg.content;
        existing.last_at = msg.created_at;
      }
    }
  }

  for (const msg of (receivedMessages ?? [])) {
    const partnerId = msg.sender_id;
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { user_id: partnerId, last_message: msg.content, last_at: msg.created_at, unread_count: msg.read ? 0 : 1 });
    } else {
      const existing = convMap.get(partnerId)!;
      if (new Date(msg.created_at) > new Date(existing.last_at)) {
        existing.last_message = msg.content;
        existing.last_at = msg.created_at;
      }
      if (!msg.read) {
        existing.unread_count += 1;
      }
    }
  }

  const partnerIds = [...convMap.keys()];
  const nameMap: Record<string, { name: string; level: string; online: boolean; avatar_url: string | null }> = {};
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, level, online, avatar_url")
      .in("id", partnerIds);
    (profiles ?? []).forEach((p: { id: string; name: string; level: string | null; online: boolean | null; avatar_url: string | null }) => {
      nameMap[p.id] = { name: p.name, level: p.level ?? "2.5", online: p.online ?? false, avatar_url: p.avatar_url ?? null };
    });
  }

  const conversations = [...convMap.values()]
    .map((c) => ({
      ...c,
      name: nameMap[c.user_id]?.name ?? "Unknown Player",
      level: nameMap[c.user_id]?.level ?? "2.5",
      online: nameMap[c.user_id]?.online ?? false,
      avatar_url: nameMap[c.user_id]?.avatar_url ?? null,
    }))
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

  // Store in heuristic cache (TTL: 2 minutes = 120 seconds)
  await setCache(cacheKey, conversations, 120);

  // Store in API cache (TTL: 30 seconds = 30 seconds)
  await setCache(`${cacheKey}:api`, conversations, 30);

  return NextResponse.json(conversations);
}
