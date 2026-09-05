import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../_lib/createDevSupabase";
import { requireDeveloper } from "../_lib/requireDeveloper";

export async function GET() {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { data: errors, error } = await supabase
      .from("developer_errors")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.warn("Could not load from developer_errors table:", error.message);
    }

    const incidents = (errors || []).map((err) => ({
      id: err.id,
      title: err.message || `${err.error_type} in ${err.component}`,
      service: err.component || "api",
      severity: err.severity || "error",
      status: err.status || "unresolved",
      occurrences: err.occurrence_count || 1,
      createdAt: err.created_at,
      lastSeenAt: err.last_seen_at,
      stackTrace: err.stack_trace,
    }));

    return NextResponse.json({ incidents });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch incidents";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase, "errors.view");

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { title, service = "api", severity = "error", description, stackTrace } = body;

    if (!title) {
      return NextResponse.json({ error: "Incident title is required" }, { status: 400 });
    }

    const { data: newIncident, error } = await supabase
      .from("developer_errors")
      .insert([
        {
          error_type: "MANUAL_INCIDENT",
          message: String(title).trim(),
          component: String(service).trim(),
          severity: ["info", "warn", "error", "fatal"].includes(severity) ? severity : "error",
          status: "unresolved",
          stack_trace: stackTrace ? String(stackTrace).trim() : (description ? String(description).trim() : null),
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Write audit log
    await supabase.from("developer_audit_logs").insert([
      {
        developer_id: authResult.developerId,
        action: "CREATE_INCIDENT_REPORT",
        category: "system_incident",
        environment: process.env.NODE_ENV || "production",
        target_type: "developer_errors",
        target_id: newIncident.id,
        details: { title, service, severity },
      },
    ]);

    return NextResponse.json({ success: true, incident: newIncident });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to record incident";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
