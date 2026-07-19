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

export async function GET(_req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const myId = session.user.id;

  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const convMap = new Map<string, any>();
  for (const msg of (messages ?? [])) {
    const partnerId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
    if (!convMap.has(partnerId)) {
      convMap.set(partnerId, { user_id: partnerId, last_message: msg.content, last_at: msg.created_at, unread_count: 0 });
    }
    if (msg.receiver_id === myId && !msg.read) {
      convMap.get(partnerId).unread_count += 1;
    }
  }

  const partnerIds = [...convMap.keys()];
  let nameMap: Record<string, { name: string; level: string; online: boolean }> = {};
  if (partnerIds.length > 0) {
    const { data: profiles } = await supabase
      .from("player_profiles")
      .select("id, name, level, online")
      .in("id", partnerIds);
    (profiles ?? []).forEach((p: any) => { nameMap[p.id] = { name: p.name, level: p.level ?? "2.5", online: p.online ?? false }; });
  }

  const conversations = [...convMap.values()].map((c) => ({
    ...c,
    name: nameMap[c.user_id]?.name ?? "Unknown Player",
    level: nameMap[c.user_id]?.level ?? "2.5",
    online: nameMap[c.user_id]?.online ?? false,
  }));

  return NextResponse.json(conversations);
}
