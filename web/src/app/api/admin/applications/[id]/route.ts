import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { requireAdmin } from '../../_lib/requireAdmin';
import { sendAdminEmail } from '../../_lib/sendAdminEmail';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const resolvedParams = await Promise.resolve(params);
    const applicationId = resolvedParams.id;

    const { data, error } = await supabase
      .from('owner_applications')
      .select(`
        *,
        applicant:player_profiles!user_id (
          id,
          name,
          avatar_url
        )
      `)
      .eq('id', applicationId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/applications/[id]] GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const applicationId = resolvedParams.id;
    const body = await request.json();
    const { action, rejection_reason, revision_request_note } = body;

    if (!['approve', 'reject', 'request_revision'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action parameter' }, { status: 400 });
    }

    // 1. Fetch current application record
    const { data: appData, error: fetchErr } = await supabase
      .from('owner_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchErr || !appData) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    let newStatus: string;
    let auditAction: string;

    if (action === 'approve') {
      newStatus = 'approved';
      auditAction = 'APPROVE_OWNER_APPLICATION';
    } else if (action === 'reject') {
      newStatus = 'rejected';
      auditAction = 'REJECT_OWNER_APPLICATION';
    } else {
      newStatus = 'more_info_requested';
      auditAction = 'REQUEST_REVISION';
    }

    // 2. Update owner_applications record
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    };
    if (rejection_reason) updatePayload.rejection_reason = rejection_reason;
    if (revision_request_note) updatePayload.revision_request_note = revision_request_note;

    const { error: updateErr } = await supabase
      .from('owner_applications')
      .update(updatePayload)
      .eq('id', applicationId);

    if (updateErr) {
      console.error('[API/admin/applications/[id]] Update error:', updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // 3. If approved, upgrade applicant role to 'owner' and verification_status to 'verified'
    if (action === 'approve') {
      const { error: roleErr } = await supabase
        .from('player_profiles')
        .update({
          role: 'owner',
          verification_status: 'verified',
          facility_setup_complete: true
        })
        .eq('id', appData.user_id);

      if (roleErr) {
        console.error('[API/admin/applications/[id]] Role upgrade error:', roleErr);
      }
    }

    // 4. Log to admin_audit_logs
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: auditAction,
      target_type: 'owner_application',
      target_id: applicationId,
      metadata: {
        facility_name: appData.facility_name,
        contact_email: appData.contact_email,
        rejection_reason: rejection_reason || null,
        revision_request_note: revision_request_note || null,
      },
      ip_address: ipAddress
    });

    // 5. Send notification email via Resend
    let subject = '';
    let emailBody = '';

    if (action === 'approve') {
      subject = 'Picklers Partner Application Approved! 🏓';
      emailBody = `Hi there,\n\nGreat news! Your partner application for "${appData.facility_name}" has been approved.\n\nYour Picklers account has been upgraded to Facility Owner. Log in to access your Owner Dashboard and set up your courts!\n\nBest regards,\nThe Picklers Team`;
    } else if (action === 'reject') {
      subject = 'Update regarding your Picklers Partner Application';
      emailBody = `Hi there,\n\nThank you for applying to list "${appData.facility_name}" on Picklers.\n\nAfter reviewing your application, we are unable to approve it at this time.\n\nReason: ${rejection_reason || 'Incomplete or unverified documentation.'}\n\nYou may re-apply with updated documents at any time.\n\nBest regards,\nThe Picklers Team`;
    } else {
      subject = 'Action Required: Picklers Partner Application Revision';
      emailBody = `Hi there,\n\nOur team is reviewing your application for "${appData.facility_name}", but we need additional information:\n\nNote: ${revision_request_note || 'Please provide updated documentation.'}\n\nPlease submit the requested information to proceed.\n\nBest regards,\nThe Picklers Team`;
    }

    await sendAdminEmail(appData.contact_email, subject, emailBody);

    return NextResponse.json({ success: true, status: newStatus }, { status: 200 });
  } catch (err: any) {
    console.error('[API/admin/applications/[id]] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
