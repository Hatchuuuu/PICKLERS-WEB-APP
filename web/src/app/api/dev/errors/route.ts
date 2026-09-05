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
      .from("developer_errors")
      .select("*")
      .order("last_seen_at", { ascending: false });

    if (status) {
      query = query.eq("status", status);
    }

    const { data: errors, error } = await query;

    if (error) {
      // Return empty array if unseeded
      return NextResponse.json({ errors: [] });
    }

    return NextResponse.json({ errors: errors || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch developer errors";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
