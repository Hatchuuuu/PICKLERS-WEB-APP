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

const tournamentSchema = z.object({
  name: z.string().min(1, "Tournament name is required").max(200, "Tournament name too long"),
  description: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
  endDate: z.string().datetime({ offset: true }).or(z.string()).optional(),
  location: z.string().optional(),
  registrationDeadline: z.string().datetime({ offset: true }).or(z.string()).optional().nullable(),
  maxTeams: z.number().int().min(0).optional(),
  entryFee: z.number().min(0).optional(),
  prizePool: z.number().min(0).optional(),
  game: z.string().optional(),
  format: z.string().optional(),
  rules: z.string().optional(),
  status: z.enum(['UPCOMING', 'ONGOING', 'COMPLETED', 'CANCELLED']).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tournamentId = params.id;

    const { data: tournament, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', tournamentId)
      .single();

    if (error) throw error;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error: any) {
    console.error('[TOURNAMENT_ID_GET]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tournament' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tournamentId = params.id;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is owner of the tournament
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('ownerId')
      .eq('id', tournamentId)
      .single();

    if (fetchError) throw fetchError;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    if (tournament.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const partial = tournamentSchema.partial().safeParse(body);
    if (!partial.success) {
      return NextResponse.json(
        { error: partial.error.issues[0].message },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (partial.data.name !== undefined) {
      updateData.name = partial.data.name.trim();
    }
    if (partial.data.description !== undefined) {
      updateData.description = partial.data.description === '' ? null : partial.data.description;
    }
    if (partial.data.startDate !== undefined) {
      updateData.startDate = new Date(partial.data.startDate);
    }
    if (partial.data.endDate !== undefined) {
      updateData.endDate = new Date(partial.data.endDate);
    }
    if (partial.data.location !== undefined) {
      updateData.location = partial.data.location;
    }
    if (partial.data.registrationDeadline !== undefined) {
      updateData.registrationDeadline = partial.data.registrationDeadline
        ? new Date(partial.data.registrationDeadline)
        : null;
    }
    if (partial.data.maxTeams !== undefined) {
      updateData.maxTeams = partial.data.maxTeams;
    }
    if (partial.data.entryFee !== undefined) {
      updateData.entryFee = partial.data.entryFee;
    }
    if (partial.data.prizePool !== undefined) {
      updateData.prizePool = partial.data.prizePool;
    }
    if (partial.data.game !== undefined) {
      updateData.game = partial.data.game;
    }
    if (partial.data.format !== undefined) {
      updateData.format = partial.data.format;
    }
    if (partial.data.rules !== undefined) {
      updateData.rules = partial.data.rules === '' ? null : partial.data.rules;
    }
    if (partial.data.status !== undefined) {
      updateData.status = partial.data.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update(updateData)
      .eq('id', tournamentId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('[TOURNAMENT_ID_PUT]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update tournament' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const tournamentId = params.id;
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user is owner of the tournament
    const { data: tournament, error: fetchError } = await supabase
      .from('tournaments')
      .select('ownerId')
      .eq('id', tournamentId)
      .single();

    if (fetchError) throw fetchError;
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }
    if (tournament.ownerId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete related records first (if any) - e.g., teams, matches, etc.
    // Assuming cascading deletes are set up in the database, but we can do explicit deletes if needed.
    // For now, we'll delete the tournament and rely on foreign key constraints.

    const { error } = await supabase
      .from('tournaments')
      .delete()
      .eq('id', tournamentId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[TOURNAMENT_ID_DELETE]', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete tournament' },
      { status: 500 }
    );
  }
}