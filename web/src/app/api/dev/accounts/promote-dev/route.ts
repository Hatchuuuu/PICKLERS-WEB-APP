import { NextRequest, NextResponse } from 'next/server';
import { createDevSupabase } from '../../_lib/createDevSupabase';
import { createDevServiceSupabase } from '../../_lib/createDevServiceSupabase';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  const rateLimitError = await checkRateLimit(request, 'dev-account-promote-dev', 5, 60);
  if (rateLimitError) return rateLimitError;

  const sessionSupabase = await createDevSupabase();
  const devCheck = await requireDeveloper(sessionSupabase, 'accounts.manage');
  if (devCheck instanceof NextResponse) return devCheck;

  try {
    const body = await request.json();
    const { targetUserId, action, devRole = 'developer', reason } = body;

    if (!targetUserId || typeof targetUserId !== 'string') {
      return NextResponse.json({ error: 'Target user ID is required' }, { status: 400 });
    }

    if (action !== 'grant' && action !== 'revoke') {
      return NextResponse.json({ error: 'Action must be "grant" or "revoke"' }, { status: 400 });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
      return NextResponse.json({ error: 'A justification reason of at least 5 characters is required' }, { status: 400 });
    }

    // Self-modification protection check for revoking dev access
    if (targetUserId === devCheck.developerId && action === 'revoke') {
      return NextResponse.json({ error: 'Forbidden: Cannot revoke your own Developer Console access' }, { status: 403 });
    }

    const serviceSupabase = await createDevServiceSupabase();

    // Fetch target profile with service client
    const { data: targetProfile, error: fetchErr } = await serviceSupabase
      .from('player_profiles')
      .select('id, name, role, dev_role, console_access')
      .eq('id', targetUserId)
      .single();

    if (fetchErr || !targetProfile) {
      return NextResponse.json({ error: 'Target user not found' }, { status: 404 });
    }

    const currentConsoleAccess: string[] = Array.isArray(targetProfile.console_access) ? targetProfile.console_access : ['player'];
    let updatedConsoleAccess: string[];
    let newRole = targetProfile.role;
    let newDevRole = targetProfile.dev_role;

    if (action === 'grant') {
      updatedConsoleAccess = Array.from(new Set([...currentConsoleAccess, 'dev', 'player']));
      newRole = 'dev';
      newDevRole = devRole;
    } else {
      updatedConsoleAccess = currentConsoleAccess.filter((c) => c !== 'dev');
      if (!updatedConsoleAccess.includes('player')) updatedConsoleAccess.push('player');
      if (newRole === 'dev') newRole = 'player';
      newDevRole = null;
    }

    const { error: updateErr } = await serviceSupabase
      .from('player_profiles')
      .update({
        console_access: updatedConsoleAccess,
        role: newRole,
        dev_role: newDevRole,
      })
      .eq('id', targetUserId);

    if (updateErr) {
      console.error('Error updating dev console access:', updateErr);
      return NextResponse.json({ error: 'Failed to update account permissions' }, { status: 500 });
    }

    // Record developer audit log with service client
    await serviceSupabase.from('developer_audit_logs').insert({
      developer_id: devCheck.developerId,
      action: action === 'grant' ? 'grant_dev_access' : 'revoke_dev_access',
      category: 'access_control',
      environment: process.env.NODE_ENV || 'development',
      target_type: 'player_profile',
      target_id: targetUserId,
      details: {
        target_name: targetProfile.name,
        action,
        dev_role: newDevRole,
        previous_access: currentConsoleAccess,
        new_access: updatedConsoleAccess,
        reason: reason.trim(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Successfully ${action === 'grant' ? 'granted' : 'revoked'} Developer access for ${targetProfile.name}`,
      account: {
        id: targetUserId,
        role: newRole,
        devRole: newDevRole,
        consoleAccess: updatedConsoleAccess,
      },
    });
  } catch (err: unknown) {
    console.error('Unexpected error in promote-dev route:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
