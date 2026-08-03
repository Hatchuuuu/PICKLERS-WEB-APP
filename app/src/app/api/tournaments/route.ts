import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/libs/auth';
import { prisma } from '@/app/libs/prisma';

// GET /api/tournaments - List all tournaments for the owner
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an owner
    if (!session?.user || session.user.role !== 'OWNER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      ownerId: session.user.id,
    };

    if (status) {
      where.status = status;
    }

    // Fetch tournaments
    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { teams: true },
          },
        },
      }),
      prisma.tournament.count({ where }),
    ]);

    return NextResponse.json({
      tournaments,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[TOURNAMENTS_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// POST /api/tournaments - Create a new tournament
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    // Check if user is authenticated and is an owner
    if (!session?.user || session.user.role !== 'OWNER') {
      return new NextResponse('Unauthorized', { status: 401 });
    }

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
      status = 'UPCOMING'
    } = body;

    // Validate required fields
    if (!name || !startDate || !endDate) {
      return new NextResponse('Missing required fields', { status: 400 });
    }

    // Create tournament
    const tournament = await prisma.tournament.create({
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
        status,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('[TOURNAMENTS_POST]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}