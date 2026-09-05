import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { z } from "zod";

const reportSchema = z.object({
  post_id: z.string().uuid().optional(),
  comment_id: z.string().uuid().optional(),
  reason: z.enum(["spam", "inappropriate", "harassment", "other"]),
  note: z.string().max(500).optional(),
}).refine(data => data.post_id || data.comment_id, {
  message: "Either post_id or comment_id must be provided",
});

/**
 * POST /api/community/report
 * Allows users to report a post or comment for moderation.
 */
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { post_id, comment_id, reason, note } = parsed.data;

    // Insert report record
    const { error: reportError } = await supabase
      .from("post_reports")
      .insert({
        reporter_id: user.id,
        post_id: post_id || null,
        comment_id: comment_id || null,
        reason,
        note: note || null,
      });

    if (reportError) {
      return NextResponse.json({ error: reportError.message }, { status: 500 });
    }

    // Flag the post if it was a post report
    if (post_id) {
      await supabase
        .from("feed_posts")
        .update({ is_flagged: true })
        .eq("id", post_id);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
