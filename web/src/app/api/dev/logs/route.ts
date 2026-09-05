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
  const level = searchParams.get("level");
  const queryStr = searchParams.get("query");
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

  try {
    let query = supabase
      .from("application_logs")
      .select("*")
      .order("timestamp", { ascending: false })
      .limit(limit);

    if (level && level !== "ALL") {
      query = query.eq("level", level);
    }

    if (queryStr) {
      query = query.or(`message.ilike.%${queryStr}%,service.ilike.%${queryStr}%,request_id.ilike.%${queryStr}%`);
    }

    const { data: logs, error } = await query;

    if (error) {
      // Fallback: If table is empty or error, also fetch recent developer audit logs formatted as application logs
      const { data: auditLogs } = await supabase
        .from("developer_audit_logs")
        .select("*, developer:player_profiles!developer_id(name)")
        .order("created_at", { ascending: false })
        .limit(20);

      const formatted = (auditLogs || []).map((a) => ({
        id: a.id,
        timestamp: a.created_at,
        level: "INFO",
        service: `dev:${a.category}`,
        message: `[${a.action}] ${a.details?.reason || JSON.stringify(a.details)}`,
        request_id: `req_${a.id.slice(0, 8)}`,
        trace_id: `tr_${a.id.slice(0, 8)}`,
        metadata: a.details,
      }));

      return NextResponse.json({ logs: formatted });
    }

    return NextResponse.json({ logs: logs || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch application logs";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
