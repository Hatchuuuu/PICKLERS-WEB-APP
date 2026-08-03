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

const announcementSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required"),
  is_active: z.boolean().default(true),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const facilityId = parseInt(params.id, 10);

    const { data, error, count } = await supabase
      .from('facility_announcements')
      .select('*', { count: 'exact' })
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      announcements: data,
      count: count ?? 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to fetch announcements' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const facilityId = parseInt(params.id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('owner_id')
      .eq('id', facilityId)
      .single();

    if (facilityError) throw facilityError;
    if (facility?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('facility_announcements')
      .insert({
        facility_id: facilityId,
        title: parsed.data.title,
        content: parsed.data.content,
        is_active: parsed.data.is_active,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create announcement' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const announcementId = parseInt(params.id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First fetch announcement to verify ownership via facility
    const { data: announcement, error: fetchError } = await supabase
      .from('facility_announcements')
      .select('facility_id')
      .eq('id', announcementId)
      .single();

    if (fetchError) throw fetchError;
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('owner_id')
      .eq('id', announcement.facility_id)
      .single();

    if (facilityError) throw facilityError;
    if (facility?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    // Allow partial updates (PATCH-like) but we only expect is_active toggle for now
    const updateData: { title?: string; content?: string; is_active?: boolean } = {};
    if (body.title !== undefined) {
      if (typeof body.title !== 'string' || body.title.trim() === '') {
        return NextResponse.json({ error: 'Title must be a non-empty string' }, { status: 400 });
      }
      if (body.title.length > 200) {
        return NextResponse.json({ error: 'Title too long' }, { status: 400 });
      }
      updateData.title = body.title.trim();
    }
    if (body.content !== undefined) {
      if (typeof body.content !== 'string' || body.content.trim() === '') {
        return NextResponse.json({ error: 'Content must be a non-empty string' }, { status: 400 });
      }
      updateData.content = body.content.trim();
    }
    if (body.is_active !== undefined) {
      if (typeof body.is_active !== 'boolean') {
        return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
      }
      updateData.is_active = body.is_active;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('facility_announcements')
      .update(updateData)
      .eq('id', announcementId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to update announcement' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient();
    const announcementId = parseInt(params.id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: announcement, error: fetchError } = await supabase
      .from('facility_announcements')
      .select('facility_id')
      .eq('id', announcementId)
      .single();

    if (fetchError) throw fetchError;
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('owner_id')
      .eq('id', announcement.facility_id)
      .single();

    if (facilityError) throw facilityError;
    if (facility?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error: deleteError } = await supabase
      .from('facility_announcements')
      .delete()
      .eq('id', announcementId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete announcement' },
      { status: 500 }
    );
  }
}