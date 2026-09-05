import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { checkRateLimit } from "@/lib/rateLimit";
import { z } from "zod";
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

/**
 * GET /api/community/messages?with=<userId>&before=<timestamp>&limit=<n>
 * Paginated messages with cursor-based pagination
 */
export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get("with");
  if (!withUserId) return NextResponse.json({ error: "Missing `with` param" }, { status: 400 });

  const myId = user.id;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
  const before = req.nextUrl.searchParams.get("before") ?? "";

  // Create a normalized cache key based on query parameters
  const cacheKey = generateCacheKey(
    'community-messages',
    `${myId}-${withUserId}-${before}-${limit}`
  );

  // 1. Check HEURISTIC CACHE FIRST (medium TTL: 2 minutes for messages - balances freshness with performance)
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

  // 2. Try to get from API cache (shorter TTL: 30 seconds)
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
  let query = supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${myId})`)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Cursor-based pagination: fetch messages older than `before`
  if (before) {
    query = query.lt("created_at", before);
  }

  const { data: messages, error } = await query;

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

  // Mark unread messages from this partner as read
  await supabase
    .from("direct_messages")
    .update({ read: true })
    .eq("receiver_id", myId)
    .eq("sender_id", withUserId)
    .eq("read", false);

  // Return in chronological order (oldest first) for display
  const responseData = {
    data: (messages ?? []).reverse(),
    cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
  };

  // Store in heuristic cache (TTL: 2 minutes = 120 seconds)
  await setCache(cacheKey, responseData, 120);

  // Store in API cache (TTL: 30 seconds = 30 seconds)
  await setCache(`${cacheKey}:api`, responseData, 30);

  return NextResponse.json(responseData);
}

export async function POST(req: NextRequest) {
  // Rate limit: max 30 messages per 60 seconds
  const rateLimitResponse = await checkRateLimit(req, "direct-message", 30, 60);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const schema = z.object({
    receiver_id: z.string().uuid(),
    content: z.string().min(1, "Message cannot be empty").max(2000, "Message too long")
  });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { receiver_id, content } = parsed.data;

  const { data: msg, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: user.id, receiver_id, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(msg, { status: 201 });
}
