import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
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
}

// GET /api/clubs/[id]/members - list members (only for members/admins)
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is a member of the club
    const { data: membership, error: memError } = await supabase
      .from('club_members')
      .select('status')
      .eq('club_id', clubId)
      .eq('user_id', user.id)
      .single();

    if (memError && memError.code !== 'PGRST116') throw memError;
    if (!membership) {
      return NextResponse.json({ error: 'Forbidden: not a member of this club' }, { status: 403 });
    }

    // Fetch members with profile info
    const { data, error } = await supabase
      .from('club_members')
      .select(`
        user_id,
        status,
        joined_at,
        player_profiles!inner (
          id,
          name,
          avatar_url,
          level
        )
      `)
      .eq('club_id', clubId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/clubs/[id]/members - add a member (invite) - only admin
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: clubId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('admin_id')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    if (club.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only club admin can add members' }, { status: 403 });
    }

    const body = await req.json();
    const { user_id } = z.object({ user_id: z.string().uuid() }).parse(body);

    // Check if target user exists
    const { data: profile, error: profileError } = await supabase
      .from('player_profiles')
      .select('id')
      .eq('id', user_id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') throw profileError;
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if already a member
    const { data: existing, error: existingError } = await supabase
      .from('club_members')
      .select('id')
      .eq('club_id', clubId)
      .eq('user_id', user_id)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
    }

    const { data, error } = await supabase
      .from('club_members')
      .insert({
        club_id: clubId,
        user_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    const { data: clubData } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();

    await supabase
      .from('clubs')
      .update({ member_count: (clubData?.member_count || 0) + 1 })
      .eq('id', clubId);

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to add member' },
      { status: 500 }
    );
  }
}

// PUT /api/clubs/[id]/members/[userId] - update member status (approve/change role)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id: clubId, userId: memberUserId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('admin_id')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    if (club.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only club admin can modify members' }, { status: 403 });
    }

    const body = await req.json();
    const { status } = z.object({ status: z.enum(['pending', 'member', 'admin']) }).parse(body);

    const { data, error } = await supabase
      .from('club_members')
      .update({ status })
      .eq('club_id', clubId)
      .eq('user_id', memberUserId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/clubs/[id]/members/[userId] - remove member
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; userId: string }> }) {
  try {
    const { id: clubId, userId: memberUserId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: club, error: clubError } = await supabase
      .from('clubs')
      .select('admin_id')
      .eq('id', clubId)
      .single();

    if (clubError) throw clubError;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    if (club.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: only club admin can remove members' }, { status: 403 });
    }

    const { error: delError } = await supabase
      .from('club_members')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', memberUserId);

    if (delError) throw delError;

    // Update member count
    const { data: clubData } = await supabase
      .from('clubs')
      .select('member_count')
      .eq('id', clubId)
      .single();

    if (clubData) {
      await supabase
        .from('clubs')
        .update({ member_count: Math.max(0, (clubData.member_count || 1) - 1) })
        .eq('id', clubId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to remove member' },
      { status: 500 }
    );
  }
}
