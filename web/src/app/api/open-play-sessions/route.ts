import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_MATCHES } from '@/lib/demoData';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility');
    const level = searchParams.get('level');

    let query = supabase.from('matches').select('*').order('created_at', { ascending: false });

    if (level && level !== 'All') {
      query = query.eq('level', level);
    }
    if (facility) {
      query = query.ilike('facility', `%${facility}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      return NextResponse.json({ success: true, data: DEMO_MATCHES, isFallback: true });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch open play sessions' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, date, time, location, price, level, max_participants, facility, court, created_by } = body;

    if (!title || !price || !date || !time) {
      return NextResponse.json(
        { success: false, error: 'Missing required session parameters (title, price, date, time)' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('matches')
      .insert([
        {
          title,
          type: type || 'Doubles Open Play',
          status: 'open',
          date,
          time,
          location: location || 'Taguig, Metro Manila',
          price: Number(price),
          level: level || 'All Levels',
          participants: 0,
          max_participants: Number(max_participants) || 4,
          facility: facility || 'BGC Pickleball Hub',
          court: court || 'Court 1',
          players: [],
          created_by
        }
      ])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to create open play session' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Session ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('matches').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Session cancelled successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to cancel open play session' },
      { status: 500 }
    );
  }
}
