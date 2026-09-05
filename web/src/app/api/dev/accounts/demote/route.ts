import { NextRequest, NextResponse } from 'next/server';
import { createDevSupabase } from '../../_lib/createDevSupabase';
import { createDevServiceSupabase } from '../../_lib/createDevServiceSupabase';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const rateLimitError = await checkRateLimit(request, 'dev-account-demote', 5, 60);
  if (rateLimitError) return rateLimitError;

  const sessionSupabase = await createDevSupabase();
  const devCheck = await requireDeveloper(sessionSupabase, 'accounts.manage');
  if (devCheck instanceof NextResponse) return devCheck;

  try {
    const body = await request.json();
    const { targetUserId, reason } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: 'A justification reason of at least 5 characters is required' }, { status: 400 });
    }

    const serviceSupabase = await createDevServiceSupabase();

    // Fetch target user profile with service client
    const { data: targetProfile, error: fetchErr } = await serviceSupabase
      .from('player_profiles')
      .select('id, name, console_access, is_admin, admin_role')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    // Protection check: Cannot revoke access if user is the last remaining super_admin
    if (targetProfile.admin_role === 'super_admin') {
      const { count } = await serviceSupabase
        .from('player_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('admin_role', 'super_admin')
        .eq('is_admin', true);

      if (count && count <= 1) {
        return NextResponse.json({ error: 'Forbidden: Cannot revoke Admin access from the last remaining Super Admin' }, { status: 403 });
      }
    }

    const currentConsoleAccess: string[] = Array.isArray(targetProfile.console_access) ? targetProfile.console_access : ['player'];
    const updatedConsoleAccess = currentConsoleAccess.filter((c) => c !== 'admin');
    if (!updatedConsoleAccess.includes('player')) updatedConsoleAccess.push('player');

    // Update target profile with service client
    const { error: updateErr } = await serviceSupabase
      .from('player_profiles')
      .update({
        console_access: updatedConsoleAccess,
        admin_role: null,
        is_admin: false,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('Error revoking admin access:', updateErr);
      return NextResponse.json({ error: 'Failed to update account permissions' }, { status: 500 });
    }

    // Record developer audit log with service client
    await serviceSupabase.from('developer_audit_logs').insert({
      developer_id: devCheck.developerId,
      action: 'revoke_admin_access',
      category: 'access_control',
      environment: process.env.NODE_ENV || 'development',
      target_type: 'player_profile',
      target_id: targetUserId,
      details: {
        target_name: targetProfile.name,
        previous_role: targetProfile.admin_role,
        previous_access: currentConsoleAccess,
        new_access: updatedConsoleAccess,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully revoked Admin access from target account',
      account: {
        id: targetUserId,
        consoleAccess: updatedConsoleAccess,
      },
    });
  } catch (err: unknown) {
    console.error('Unexpected error in demote route:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
