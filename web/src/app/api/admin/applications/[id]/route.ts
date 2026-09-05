import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { sendAdminEmail } from '../../_lib/sendAdminEmail';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const resolvedParams = await Promise.resolve(params);
    const applicationId = resolvedParams.id;

    // Create a normalized cache key based on application ID
    const cacheKey = generateCacheKey('admin-application', applicationId);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for applications - rarely change after submission)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        data: cachedHeuristic.data,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      }, { status: 200 });
    }

    // 2. Try to get from API cache (shorter TTL: 10 minutes)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        data: cachedAPI.data,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      }, { status: 200 });
    }

    // If not in cache, proceed with database query
    const { data: appData, error } = await supabase
      .from('owner_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (error || !appData) {
      // Try to return cached data on error (fallback to stale cache)
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }

      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    let applicantProfile = null;
    if (appData.user_id) {
      try {
        const { data: profile } = await supabase
          .from('player_profiles')
          .select('id, name, avatar_url')
          .eq('id', appData.user_id)
          .maybeSingle();

        applicantProfile = profile;
      } catch {
        // Fallback gracefully
      }
    }

    const enriched = {
      ...appData,
      applicant: applicantProfile || { id: appData.user_id, name: appData.business_name || 'Applicant' },
    };

    const responseData = {
      data: enriched,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: any) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const resolvedParams = await Promise.resolve(params);
      const applicationId = resolvedParams.id;
      const cacheKey = generateCacheKey('admin-application', applicationId);
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }
    } catch (cacheError) {
      console.error('[API/admin/applications/[id]] Cache fallback error:', cacheError);
    }

    console.error('[API/admin/applications/[id]] GET Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const resolvedParams = await Promise.resolve(params);
    const applicationId = resolvedParams.id;
    const body = await request.json();
    const { action, rejection_reason, revision_request_note, internal_notes } = body;

    if (!['approve', 'reject', 'request_revision', 'save_notes'].includes(action)) {
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

    // Direct note saving without status modification
    if (action === 'save_notes') {
      const { error: noteErr } = await supabase
        .from('owner_applications')
        .update({
          internal_notes: internal_notes || '',
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (noteErr) {
        return NextResponse.json({ error: noteErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Internal review notes saved' }, { status: 200 });
    }

    if (['approved', 'rejected'].includes(appData.status)) {
      return NextResponse.json({ error: `Conflict: Application has already been reviewed (${appData.status})` }, { status: 409 });
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

    // 2. Update owner_applications record with optimistic concurrency check
    const updatePayload: Record<string, unknown> = {
      status: newStatus,
      reviewed_by: adminId,
      reviewed_at: new Date().toISOString(),
    };
    if (rejection_reason) updatePayload.rejection_reason = rejection_reason;
    if (revision_request_note) updatePayload.revision_request_note = revision_request_note;
    if (internal_notes !== undefined) updatePayload.internal_notes = internal_notes;

    const { error: updateErr } = await supabase
      .from('owner_applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .eq('status', appData.status);

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
