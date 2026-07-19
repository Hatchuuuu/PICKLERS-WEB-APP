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

export async function GET(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const withUserId = req.nextUrl.searchParams.get("with");
  if (!withUserId) return NextResponse.json({ error: "Missing `with` param" }, { status: 400 });

  const myId = session.user.id;

  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*")
    .or(`and(sender_id.eq.${myId},receiver_id.eq.${withUserId}),and(sender_id.eq.${withUserId},receiver_id.eq.${myId})`)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await supabase
    .from("direct_messages")
    .update({ read: true })
    .eq("receiver_id", myId)
    .eq("sender_id", withUserId)
    .eq("read", false);

  return NextResponse.json(messages ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await makeSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { receiver_id, content } = await req.json();
  if (!receiver_id || !content?.trim()) {
    return NextResponse.json({ error: "receiver_id and content required" }, { status: 400 });
  }

  const { data: msg, error } = await supabase
    .from("direct_messages")
    .insert({ sender_id: session.user.id, receiver_id, content: content.trim() })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(msg, { status: 201 });
}
