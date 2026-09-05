import { NextRequest, NextResponse } from "next/server";
import { createAdminSupabase } from "../../_lib/createAdminSupabase";
import { requireAdmin } from "../../_lib/requireAdmin";
import { checkAdminRateLimit } from "../../_lib/rateLimit";

export async function GET(request: NextRequest) {
  const rateLimitResponse = checkAdminRateLimit(request, "admin_finance_export", 10, 60000);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createAdminSupabase();
  const authResult = await requireAdmin(supabase, "finance.manage");
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { data: bookings, error } = await supabase
      .from("bookings")
      .select(`
        id,
        created_at,
        total_amount,
        commission_fee,
        payout_amount,
        status,
        payment_method,
        facility_id,
        user_id,
        facilities (name),
        player_profiles!bookings_user_id_fkey (name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const headers = [
      "Transaction ID",
      "Date",
      "Facility Name",
      "Customer Name",
      "Customer Email",
      "Gross Amount (PHP)",
      "Commission Split 10% (PHP)",
      "Facility Payout 90% (PHP)",
      "Status",
      "Payment Method",
    ];

    const rows = (bookings || []).map((b: any) => {
      const facilityName = b.facilities?.name || "N/A";
      const customerName = b.player_profiles?.name || "N/A";
      const customerEmail = b.player_profiles?.email || "N/A";
      const gross = Number(b.total_amount || 0);
      const commission = Number(b.commission_fee || gross * 0.1);
      const payout = Number(b.payout_amount || gross * 0.9);

      return [
        `"${String(b.id).replace(/"/g, '""')}"`,
        `"${new Date(b.created_at).toISOString()}"`,
        `"${facilityName.replace(/"/g, '""')}"`,
        `"${customerName.replace(/"/g, '""')}"`,
        `"${customerEmail.replace(/"/g, '""')}"`,
        gross.toFixed(2),
        commission.toFixed(2),
        payout.toFixed(2),
        `"${String(b.status || "confirmed").toUpperCase()}"`,
        `"${String(b.payment_method || "GCash / Card")}"`,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const filename = `picklers-financial-ledger-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to export financial records";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
