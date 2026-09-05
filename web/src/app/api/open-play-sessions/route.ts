import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_MATCHES } from '@/lib/demoData';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const facility = searchParams.get('facility') ?? '';
    const level = searchParams.get('level') ?? 'All';

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('open-play-sessions', `${facility}-${level}`);

    // 1. Check HEURISTIC CACHE FIRST (medium TTL: 5 minutes for session data)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        success: true,
        data: cachedHeuristic.data,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      });
    }

    // 2. Try to get from API cache (shorter TTL: 1 minute)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        success: true,
        data: cachedAPI.data,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      });
    }

    // If not in cache, proceed with database query
    let query = supabase.from('matches').select('*').order('created_at', { ascending: false });

    if (level && level !== 'All') {
      query = query.eq('level', level);
    }
    if (facility) {
      query = query.ilike('facility', `%${facility}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      // Try to return cached data on error (fallback to stale cache)
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        });
      }

      return NextResponse.json({ success: true, data: DEMO_MATCHES, isFallback: true });
    }

    const responseData = {
      success: true,
      data,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 5 minutes = 300 seconds)
    await setCache(cacheKey, responseData, 300);

    // Store in API cache (TTL: 1 minute = 60 seconds)
    await setCache(`${cacheKey}:api`, responseData, 60);

    return NextResponse.json(responseData);
  } catch (error: any) {
    // Try to return cached data on error
    try {
      const { searchParams } = new URL(request.url);
      const facility = searchParams.get('facility') ?? '';
      const level = searchParams.get('level') ?? 'All';
      const cacheKey = generateCacheKey('open-play-sessions', `${facility}-${level}`);
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        });
      }
    } catch (cacheError) {
      console.error('[OPEN_PLAY_SESSIONS_ROUTE] Cache fallback error:', cacheError);
    }

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
