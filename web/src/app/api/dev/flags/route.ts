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
    const { data: flags, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ flags: flags || [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch feature flags";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase, 'feature_flags.manage');

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const { key, name, description, is_enabled, environment, rollout_percentage, targeting_rules, reason } = body;

    if (!key || !name) {
      return NextResponse.json({ error: "Flag key and name are required" }, { status: 400 });
    }

    if (!reason || !String(reason).trim()) {
      return NextResponse.json({ error: "A justification reason is required to create feature flags" }, { status: 400 });
    }

    const { data: newFlag, error } = await supabase
      .from("feature_flags")
      .insert([
        {
          key: String(key).trim().toLowerCase().replace(/\s+/g, "_"),
          name: String(name).trim(),
          description: description ? String(description).trim() : null,
          is_enabled: Boolean(is_enabled),
          environment: environment || "production",
          rollout_percentage: typeof rollout_percentage === "number" ? rollout_percentage : 100,
          targeting_rules: typeof targeting_rules === "object" && targeting_rules !== null ? targeting_rules : {},
          created_by: authResult.developerId,
          updated_by: authResult.developerId,
        },
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Record audit log
    await supabase.from("developer_audit_logs").insert([
      {
        developer_id: authResult.developerId,
        action: "CREATE_FEATURE_FLAG",
        category: "feature_flag",
        environment: environment || "production",
        target_type: "feature_flag",
        target_id: newFlag.id,
        details: { key, name, is_enabled, rollout_percentage, reason },
      },
    ]);

    return NextResponse.json({ success: true, flag: newFlag });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create feature flag";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
