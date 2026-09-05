import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../../_lib/createDevSupabase";
import { requireDeveloper } from "../../_lib/requireDeveloper";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const { data: updatedError, error } = await supabase
      .from("developer_errors")
      .update({
        status: status || "resolved",
        resolved_at: new Date().toISOString(),
        resolved_by: authResult.developerId,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record technical audit log
    await supabase.from("developer_audit_logs").insert([
      {
        developer_id: authResult.developerId,
        action: "RESOLVE_DEVELOPER_ERROR",
        category: "error_intelligence",
        environment: updatedError?.environment || "production",
        target_type: "developer_error",
        target_id: id,
        details: { error_type: updatedError?.error_type, status },
      },
    ]);

    return NextResponse.json({ success: true, error: updatedError });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to resolve error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
