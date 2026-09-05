import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../_lib/rateLimit';
import { sendAdminEmail } from '../../_lib/sendAdminEmail';

interface BulkApplicationAction {
  id: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_bulk_applications', 10, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase, 'applications.approve');
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const body = await request.json();
    const { applications } = body as { applications: BulkApplicationAction[] };

    if (!Array.isArray(applications) || applications.length === 0) {
      return NextResponse.json({ error: 'Array of applications with action is required' }, { status: 400 });
    }

    if (applications.length > 50) {
      return NextResponse.json({ error: 'Bulk action maximum batch size is 50 applications' }, { status: 400 });
    }

    const results: Array<{ id: string; success: boolean; error?: string }> = [];
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    for (const item of applications) {
      try {
        const { data: appData, error: fetchErr } = await supabase
          .from('owner_applications')
          .select('*')
          .eq('id', item.id)
          .single();

        if (fetchErr || !appData) {
          results.push({ id: item.id, success: false, error: 'Application not found' });
          continue;
        }

        const newStatus = item.action === 'approve' ? 'approved' : 'rejected';

        const updatePayload: Record<string, unknown> = {
          status: newStatus,
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        };

        if (item.action === 'reject' && item.reason) {
          updatePayload.rejection_reason = item.reason;
        }

        const { error: updateErr } = await supabase
          .from('owner_applications')
          .update(updatePayload)
          .eq('id', item.id);

        if (updateErr) {
          results.push({ id: item.id, success: false, error: updateErr.message });
          continue;
        }

        // If approved, upgrade role
        if (item.action === 'approve' && appData.user_id) {
          await supabase
            .from('player_profiles')
            .update({
              role: 'owner',
              verification_status: 'verified',
              facility_setup_complete: true,
            })
            .eq('id', appData.user_id);
        }

        // Write audit log
        await supabase.from('admin_audit_logs').insert({
          admin_id: adminId,
          action: item.action === 'approve' ? 'BULK_APPROVE_OWNER_APPLICATION' : 'BULK_REJECT_OWNER_APPLICATION',
          target_type: 'owner_application',
          target_id: item.id,
          metadata: {
            facility_name: appData.facility_name,
            contact_email: appData.contact_email,
            reason: item.reason || null,
          },
          ip_address: ipAddress,
        });

        // Send email asynchronously
        const subject = item.action === 'approve'
          ? 'Picklers Partner Application Approved! 🏓'
          : 'Update regarding your Picklers Partner Application';
        const emailBody = item.action === 'approve'
          ? `Great news! Your partner application for "${appData.facility_name}" has been approved.`
          : `Thank you for applying to list "${appData.facility_name}". After review, we are unable to approve it at this time: ${item.reason || 'Documentation unverified.'}`;

        sendAdminEmail(appData.contact_email, subject, emailBody).catch(() => {});

        results.push({ id: item.id, success: true });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Execution failed';
        results.push({ id: item.id, success: false, error: msg });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return NextResponse.json({
      success: true,
      processed: results.length,
      successCount,
      failureCount: results.length - successCount,
      results,
    });
  } catch (err: unknown) {
    console.error('[API/admin/applications/bulk] Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
