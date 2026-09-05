import { NextRequest, NextResponse } from 'next/server';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { checkRateLimit } from '@/lib/rateLimit';
import { createDevServiceSupabase } from '../../_lib/createDevServiceSupabase';

export async function GET(request: NextRequest) {
  const rateLimitError = await checkRateLimit(request, 'dev-account-search', 10, 60);
  if (rateLimitError) return rateLimitError;

  // P2.1: this previously used the anon key directly, which meant RLS filtered
  // the search to just the current user — the "search any user" dev tool only
  // ever returned the dev's own row. Use the service-role client (which now
  // throws on missing key) so cross-account lookups actually work.
  const supabase = await createDevServiceSupabase();

  const devCheck = await requireDeveloper(supabase);
  if (devCheck instanceof NextResponse) return devCheck;

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json({ accounts: [] });
  }

  // Search by email, name, phone, or ID
  const { data: accounts, error } = await supabase
    .from('player_profiles')
    .select('id, name, role, is_admin, admin_role, dev_role, console_access, account_status, is_banned, created_at')
    .or(`name.ilike.%${query}%,id.eq.${query.length === 36 ? query : '00000000-0000-0000-0000-000000000000'}`)
    .limit(20);

  if (error) {
    console.error('Error searching accounts:', error);
    return NextResponse.json({ error: 'Failed to search accounts' }, { status: 500 });
  }

  // Format account results to clearly communicate account classification
  const formattedAccounts = (accounts || []).map((acc) => {
    const consoleAccess: string[] = Array.isArray(acc.console_access) ? acc.console_access : ['player'];
    const hasAdmin = consoleAccess.includes('admin') || Boolean(acc.is_admin) || acc.role === 'admin';
    const hasDev = consoleAccess.includes('dev') || acc.role === 'dev';

    let accountType = 'Normal';
    if (hasAdmin && hasDev) accountType = 'Admin + Developer';
    else if (hasDev) accountType = 'Developer';
    else if (hasAdmin) accountType = 'Admin';

    return {
      id: acc.id,
      name: acc.name || 'Unnamed Account',
      accountType,
      accountStatus: acc.is_banned ? 'suspended' : (acc.account_status || 'active'),
      consoleAccess,
      adminAccess: hasAdmin,
      developerAccess: hasDev,
      adminRole: acc.admin_role || (hasAdmin ? 'operations_admin' : null),
      devRole: acc.dev_role || (hasDev ? 'developer' : null),
      createdAt: acc.created_at,
    };
  });

  return NextResponse.json({ accounts: formattedAccounts });
}
