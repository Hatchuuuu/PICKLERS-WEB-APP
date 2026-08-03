import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/libs/auth';
import { prisma } from '@/app/libs/prisma';

// GET /api/tournaments/[id] - Get a specific tournament
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an owner
    if (!session?.user || session.user.role !== 'OWNER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tournamentId = params.id;

    // Fetch tournament with related data
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        _count: {
          select: { teams: true },
        },
        teams: {
          include: {
            players: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  }
                }
              }
            }
          }
        },
        matches: true,
      }
    });

    if (!tournament) {
      return new NextResponse('Tournament not found', { status: 404 });
    }

    // Verify ownership
    if (tournament.ownerId !== session.user.id) {
      return new NextResponse('Forbidden: Not tournament owner', { status: 403 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('[TOURNAMENT_ID_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// PUT /api/tournaments/[id] - Update a tournament
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an owner
    if (!session?.user || session.user.role !== 'OWNER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tournamentId = params.id;
    const body = await request.json();

    const {
      name,
      description,
      startDate,
      endDate,
      location,
      registrationDeadline,
      maxTeams,
      entryFee,
      prizePool,
      game,
      format,
      rules,
      status
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Check if tournament exists and belongs to user
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return new NextResponse('Tournament not found', { status: 404 });
    }

    if (existingTournament.ownerId !== session.user.id) {
      return new NextResponse('Forbidden: Not tournament owner', { status: 403 });
    }

    // Update tournament
    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        location,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxTeams: maxTeams || 0,
        entryFee: entryFee || 0,
        prizePool: prizePool || 0,
        game,
        format,
        rules,
        status: status || 'UPCOMING',
        updatedAt: new Date()
      }
    });

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('[TOURNAMENT_ID_PUT]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// DELETE /api/tournaments/[id] - Delete a tournament
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an owner
    if (!session?.user || session.user.role !== 'OWNER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const tournamentId = params.id;

    // Check if tournament exists and belongs to user
    const existingTournament = await prisma.tournament.findUnique({
      where: { id: tournamentId }
    });

    if (!existingTournament) {
      return new NextResponse('Tournament not found', { status: 404 });
    }

    if (existingTournament.ownerId !== session.user.id) {
      return new NextResponse('Forbidden: Not tournament owner', { status: 403 });
    }

    // Delete tournament (this will cascade delete related records due to foreign key constraints)
    await prisma.tournament.delete({
      where: { id: tournamentId }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('[TOURNAMENT_ID_DELETE]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}