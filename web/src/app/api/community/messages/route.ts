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

/**
 * GET /api/community/messages?with=<userId>&before=<timestamp>&limit=<n>
 * Paginated messages with cursor-based pagination
 */
export async function GET(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get("with");
  if (!withUserId) return NextResponse.json({ error: "Missing `with` param" }, { status: 400 });

  const myId = user.id;
  const limit = parseInt(req.nextUrl.searchParams.get("limit") ?? "50");
  const before = req.nextUrl.searchParams.get("before");

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mark unread messages from this partner as read
  await supabase
    .from("direct_messages")
    .update({ read: true })
    .eq("receiver_id", myId)
    .eq("sender_id", withUserId)
    .eq("read", false);

  // Return in chronological order (oldest first) for display
  return NextResponse.json((messages ?? []).reverse());
}

export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
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
