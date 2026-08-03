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

const clubSchema = z.object({
  name: z.string().min(1, "Club name is required").max(200, "Club name too long"),
  description: z.string().optional(),
  banner_url: z.string().url().optional().or(z.literal("")).optional(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const clubId = params.id;

    const { data: club, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', clubId)
      .single();

    if (error) throw error;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }

    // Optionally include member count? already have column
    return NextResponse.json(club);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch club' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const clubId = params.id;
    const { data: { user } } = await await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is admin of the club
    const { data: club, error: fetchError } = await supabase
      .from('clubs')
      .select('admin_id')
      .eq('id', clubId)
      .single();

    if (fetchError) throw fetchError;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    if (club.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const partial = clubSchema.partial().safeParse(body);
    if (!partial.success) {
      return NextResponse.json(
        { error: partial.error.issues[0].message },
        { status: 400 }
      );
    }

    const payload = partial.data;
    const updateData: { name?: string; description?: string | null; banner_url?: string | null } = {};
    if (payload.name !== undefined) {
      if (typeof payload.name !== 'string' || payload.name.trim() === '') {
        return NextResponse.json({ error: 'Name must be non-empty string' }, { status: 400 });
      }
      if (payload.name.length > 200) {
        return NextResponse.json({ error: 'Name too long' }, { status: 400 });
      }
      updateData.name = payload.name.trim();
    }
    if (payload.description !== undefined) {
      updateData.description = payload.description === '' ? null : payload.description;
    }
    if (payload.banner_url !== undefined) {
      if (payload.banner_url === '') {
        updateData.banner_url = null;
      } else {
        // basic URL validation
        try {
          new URL(payload.banner_url);
          updateData.banner_url = payload.banner_url;
        } catch {
          return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('clubs')
      .update(updateData)
      .eq('id', clubId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update club' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const clubId = params.id;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin
    const { data: club, error: fetchError } = await supabase
      .from('clubs')
      .select('admin_id')
      .eq('id', clubId)
      .single();

    if (fetchError) throw fetchError;
    if (!club) {
      return NextResponse.json({ error: 'Club not found' }, { status: 404 });
    }
    if (club.admin_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('clubs')
      .delete()
      .eq('id', clubId);

    if (error) throw error;

    // Also delete club_members (cascade should handle, but explicit)
    await supabase.from('club_members').delete().eq('club_id', clubId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete club' },
      { status: 500 }
    );
  }
}