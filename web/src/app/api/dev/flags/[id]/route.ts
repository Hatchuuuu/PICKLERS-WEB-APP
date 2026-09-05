import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../../_lib/createDevSupabase";
import { requireDeveloper } from "../../_lib/requireDeveloper";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase, 'feature_flags.manage');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const { is_enabled, rollout_percentage, targeting_rules, reason } = body;

    if (!reason || !String(reason).trim()) {
      return NextResponse.json(
        { error: "A justification reason is strictly required for modifying feature flags" },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = {
      updated_by: authResult.developerId,
      updated_at: new Date().toISOString(),
    };

    if (typeof is_enabled === "boolean") {
      updates.is_enabled = is_enabled;
    }
    if (typeof rollout_percentage === "number") {
      updates.rollout_percentage = Math.max(0, Math.min(100, rollout_percentage));
    }
    if (targeting_rules !== undefined) {
      updates.targeting_rules = typeof targeting_rules === "object" ? targeting_rules : {};
    }

    const { data: updatedFlag, error } = await supabase
      .from("feature_flags")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record audit log entry
    await supabase.from("developer_audit_logs").insert([
      {
        developer_id: authResult.developerId,
        action: "UPDATE_FEATURE_FLAG",
        category: "feature_flag",
        environment: updatedFlag.environment || "production",
        target_type: "feature_flag",
        target_id: id,
        details: {
          flag_key: updatedFlag.key,
          is_enabled: updatedFlag.is_enabled,
          rollout_percentage: updatedFlag.rollout_percentage,
          reason: String(reason).trim(),
        },
      },
    ]);

    return NextResponse.json({ success: true, flag: updatedFlag });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update feature flag";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase, 'feature_flags.manage');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    const { data: flagToDelete } = await supabase
      .from("feature_flags")
      .select("key, environment")
      .eq("id", id)
      .single();

    const { error } = await supabase
      .from("feature_flags")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabase.from("developer_audit_logs").insert([
      {
        developer_id: authResult.developerId,
        action: "DELETE_FEATURE_FLAG",
        category: "feature_flag",
        environment: flagToDelete?.environment || "production",
        target_type: "feature_flag",
        target_id: id,
        details: { flag_key: flagToDelete?.key },
      },
    ]);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete feature flag";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
