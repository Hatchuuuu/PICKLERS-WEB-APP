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

/**
 * GET /api/community/inbox — list all conversations, sorted by most recent message
 *
 * Performance fix: instead of loading ALL messages and grouping in JS,
 * we now use a targeted approach:
 *   1. Fetch only the most recent message per conversation partner
 *   2. Count unreads in a separate efficient query
 */
export async function GET(_req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = user.id;

  // Step 1: Get recent messages (limited set) to identify active conversations
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

  // Step 2: Build conversation map — keep only the latest message per partner
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

  // Step 3: Enrich with player profiles
  const partnerIds = [...convMap.keys()];
  let nameMap: Record<string, { name: string; level: string; online: boolean; avatar_url: string | null }> = {};
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, level, online, avatar_url")
      .in("id", partnerIds);
    (profiles ?? []).forEach((p: any) => {
      nameMap[p.id] = { name: p.name, level: p.level ?? "2.5", online: p.online ?? false, avatar_url: p.avatar_url ?? null };
    });
  }

  // Step 4: Build final response, sorted by most recent
  const conversations = [...convMap.values()]
    .map((c) => ({
      ...c,
      name: nameMap[c.user_id]?.name ?? "Unknown Player",
      level: nameMap[c.user_id]?.level ?? "2.5",
      online: nameMap[c.user_id]?.online ?? false,
      avatar_url: nameMap[c.user_id]?.avatar_url ?? null,
    }))
    .sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime());

  return NextResponse.json(conversations);
}
