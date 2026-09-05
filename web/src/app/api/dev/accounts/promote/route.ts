import { NextRequest, NextResponse } from 'next/server';
import { createDevSupabase } from '../../_lib/createDevSupabase';
import { createDevServiceSupabase } from '../../_lib/createDevServiceSupabase';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { checkRateLimit } from '@/lib/rateLimit';

const ALLOWED_ADMIN_ROLES = [
  'super_admin',
  'platform_admin',
  'operations_admin',
  'finance_admin',
  'moderator',
  'content_manager',
  'analytics_viewer'
];

export async function POST(request: NextRequest) {
  const rateLimitError = await checkRateLimit(request, 'dev-account-promote', 5, 60);
  if (rateLimitError) return rateLimitError;

  const sessionSupabase = await createDevSupabase();
  const devCheck = await requireDeveloper(sessionSupabase, 'accounts.manage');
  if (devCheck instanceof NextResponse) return devCheck;

  try {
    const body = await request.json();
    const { targetUserId, adminRole, reason } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    if (!adminRole || !ALLOWED_ADMIN_ROLES.includes(adminRole)) {
      return NextResponse.json({ error: `Invalid admin role. Must be one of: ${ALLOWED_ADMIN_ROLES.join(', ')}` }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: 'A justification reason of at least 5 characters is required' }, { status: 400 });
    }

    // Self-promotion protection check
    if (targetUserId === devCheck.developerId) {
      return NextResponse.json({ error: 'Forbidden: Self-promotion is strictly prohibited' }, { status: 403 });
    }

    const serviceSupabase = await createDevServiceSupabase();

    // Fetch target user profile using service role
    const { data: targetProfile, error: fetchErr } = await serviceSupabase
      .from('player_profiles')
      .select('id, name, console_access, is_admin, admin_role, account_status')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const currentConsoleAccess: string[] = Array.isArray(targetProfile.console_access) ? targetProfile.console_access : ['player'];
    const updatedConsoleAccess = Array.from(new Set([...currentConsoleAccess, 'admin', 'player']));

    // Update target profile with service role client
    const { error: updateErr } = await serviceSupabase
      .from('player_profiles')
      .update({
        console_access: updatedConsoleAccess,
        admin_role: adminRole,
        is_admin: true,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('Error granting admin access:', updateErr);
      return NextResponse.json({ error: 'Failed to update account permissions' }, { status: 500 });
    }

    // Record developer audit log with service client
    await serviceSupabase.from('developer_audit_logs').insert({
      developer_id: devCheck.developerId,
      action: 'grant_admin_access',
      category: 'access_control',
      environment: process.env.NODE_ENV || 'development',
      target_type: 'player_profile',
      target_id: targetUserId,
      details: {
        target_name: targetProfile.name,
        assigned_role: adminRole,
        previous_access: currentConsoleAccess,
        new_access: updatedConsoleAccess,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully granted Admin access (${adminRole}) to target account`,
      account: {
        id: targetUserId,
        adminRole,
        consoleAccess: updatedConsoleAccess,
      },
    });
  } catch (err: unknown) {
    console.error('Unexpected error in promote route:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
