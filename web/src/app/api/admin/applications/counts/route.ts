import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../../_lib/requireAdmin';
import { createAdminSupabase } from '../../_lib/createAdminSupabase';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const { data, error } = await supabase
      .from('owner_applications')
      .select('status');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const counts: Record<string, number> = {
      pending: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      more_info_requested: 0,
      all: data?.length || 0,
    };

    (data || []).forEach((row: { status: string }) => {
      if (row.status && counts[row.status] !== undefined) {
        counts[row.status] += 1;
      }
    });

    return NextResponse.json({ counts }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
