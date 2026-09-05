import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';
import { checkAdminRateLimit } from '../../_lib/rateLimit';

export async function GET(request: NextRequest) {
  try {
    const rateLimitError = checkAdminRateLimit(request, 'admin_users_export', 5, 60000);
    if (rateLimitError) return rateLimitError;

    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase, 'users.view');
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search')?.trim();

    let query = supabase
      .from('player_profiles')
      .select('id, name, email, phone, role, is_admin, admin_role, dev_role, account_status, is_banned, created_at')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (role && role !== 'all') {
      if (role === 'admin') {
        query = query.eq('is_admin', true);
      } else {
        query = query.eq('role', role);
      }
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('[API/admin/users/export] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Convert to CSV
    const headers = [
      'User ID',
      'Name',
      'Email',
      'Phone',
      'Role',
      'Admin Role',
      'Dev Role',
      'Is Admin',
      'Status',
      'Is Banned',
      'Created At',
    ];

    const escapeCsv = (str: unknown) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const csvRows = [headers.join(',')];

    for (const u of users || []) {
      csvRows.push([
        escapeCsv(u.id),
        escapeCsv(u.name),
        escapeCsv(u.email),
        escapeCsv(u.phone),
        escapeCsv(u.role),
        escapeCsv(u.admin_role),
        escapeCsv(u.dev_role),
        escapeCsv(u.is_admin ? 'Yes' : 'No'),
        escapeCsv(u.account_status || 'active'),
        escapeCsv(u.is_banned ? 'Yes' : 'No'),
        escapeCsv(u.created_at),
      ].join(','));
    }

    const csvContent = csvRows.join('\n');
    const filename = `picklers_users_export_${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (err: unknown) {
    console.error('[API/admin/users/export] Exception:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
