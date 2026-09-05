import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../_lib/createDevSupabase";
import { requireDeveloper } from "../_lib/requireDeveloper";

export async function GET(request: NextRequest) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  try {
    let query = supabase
      .from("webhook_events")
      .select("*")
      .order("created_at", { ascending: false });

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    const { data: webhooks, error } = await query;

    if (error) {
      return NextResponse.json({ webhooks: [] });
    }

    return NextResponse.json({ webhooks: webhooks || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch webhooks";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
