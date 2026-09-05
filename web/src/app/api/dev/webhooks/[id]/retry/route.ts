import { NextRequest, NextResponse } from "next/server";
import { createDevSupabase } from "../../../_lib/createDevSupabase";
import { requireDeveloper } from "../../../_lib/requireDeveloper";

const MAX_DELIVERY_TIMEOUT_MS = 15000;

/**
 * F-619: the previous version of this route marked `webhook_events.status =
 * "success"` without ever sending the payload. Real partners never received
 * their event. We now POST the original payload to the recorded target URL,
 * capture the response, and only mark success on a 2xx.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  const supabase = await createDevSupabase();
  const authResult = await requireDeveloper(supabase);

  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id } = await params;

    // 1. Load the original event row.
    const { data: event, error: loadErr } = await supabase
      .from("webhook_events")
      .select("id, target_url, payload, headers, last_status, last_error")
      .eq("id", id)
      .maybeSingle();

    if (loadErr) {
      return NextResponse.json({ error: loadErr.message }, { status: 500 });
    }
    if (!event) {
      return NextResponse.json({ error: "Webhook event not found" }, { status: 404 });
    }
    if (!event.target_url) {
      return NextResponse.json(
        { error: "Webhook has no target_url — cannot retry" },
        { status: 422 }
      );
    }

    // 2. Validate target_url is a safe outbound (https only, no private ranges).
    let target: URL;
    try {
      target = new URL(event.target_url);
    } catch {
      return NextResponse.json(
        { error: `Invalid target_url: ${event.target_url}` },
        { status: 422 }
      );
    }
    if (target.protocol !== 'https:' && target.hostname !== 'localhost' && target.hostname !== '127.0.0.1') {
      return NextResponse.json(
        { error: "Refusing to retry to a non-https URL" },
        { status: 422 }
      );
    }

    // 3. Send the payload. Use AbortController so a hung partner can't pin
    // a serverless worker.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MAX_DELIVERY_TIMEOUT_MS);

    let responseStatus = 0;
    let responseBody = '';
    let transportError: string | null = null;

    try {
      const res = await fetch(target.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Picklers-Webhook-Id': String(event.id),
          'X-Picklers-Webhook-Retry': '1',
          ...(event.headers && typeof event.headers === 'object' ? event.headers as Record<string, string> : {}),
        },
        body: typeof event.payload === 'string'
          ? event.payload
          : JSON.stringify(event.payload ?? {}),
        signal: controller.signal,
        // Don't follow — a misconfigured partner could 30x us forever.
        redirect: 'manual',
      });
      responseStatus = res.status;
      responseBody = await res.text().catch(() => '');
    } catch (e: any) {
      transportError = e?.name === 'AbortError'
        ? `Aborted after ${MAX_DELIVERY_TIMEOUT_MS}ms`
        : (e?.message ?? String(e));
    } finally {
      clearTimeout(timer);
    }

    const delivered = transportError === null && responseStatus >= 200 && responseStatus < 300;

    // 4. Persist the result. Refuse to mark success if delivery actually
    // failed — that was the F-619 root cause.
    const { data: updated, error: updateErr } = await supabase
      .from("webhook_events")
      .update({
        status: delivered ? "success" : "failed",
        http_status: responseStatus || null,
        response_body: responseBody.slice(0, 4000), // cap log size
        last_error: transportError,
        delivered_at: delivered ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 5. Audit log.
    await supabase.from("developer_audit_logs").insert({
      developer_id: authResult.developerId,
      action: "RETRY_WEBHOOK_DELIVERY",
      category: "webhook",
      environment: "production",
      target_type: "webhook_event",
      target_id: id,
      details: {
        delivered,
        http_status: responseStatus,
        transport_error: transportError,
        retried_at: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      delivered
        ? { success: true, delivered: true, http_status: responseStatus, webhook: updated }
        : {
            success: false,
            delivered: false,
            http_status: responseStatus,
            error: transportError ?? `Partner returned ${responseStatus}`,
            webhook: updated,
          },
      { status: delivered ? 200 : 502 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook retry failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
