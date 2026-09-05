import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

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
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  description: z.string().optional(),
  banner_url: z.string().url().optional(),
});

// GET /api/clubs - list clubs where user is admin or member
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a normalized cache key based on user ID
    const cacheKey = generateCacheKey('user-clubs', user.id);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for club data)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        data: cachedHeuristic.data,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      }, { status: 200 });
    }

    // 2. Try to get from API cache (shorter TTL: 10 minutes)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        data: cachedAPI.data,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      }, { status: 200 });
    }

    // If not in cache, proceed with database query
    const { data, error } = await supabase
      .from('clubs')
      .select('*')
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const responseData = {
      data: data,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData);
  } catch (error: any) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const cacheKey = generateCacheKey('user-clubs', user.id);
        const cachedData = await getCache<any>(cacheKey);
        if (cachedData !== null) {
          return NextResponse.json({
            data: cachedData.data,
            cacheInfo: {
              source: 'fallback',
              timestamp: cachedData.timestamp,
              error: 'Using cached data due to error'
            }
          }, { status: 200 });
        }
      }
    } catch (cacheError) {
      console.error('[CLUBS_ROUTE] Cache fallback error:', cacheError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch clubs' },
      { status: 500 }
    );
  }
}

// POST /api/clubs - create a new club (user becomes admin)
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = clubSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, description, banner_url } = parsed.data;

    const { data, error } = await supabase
      .from('clubs')
      .insert({
        name,
        description: description ?? null,
        banner_url: banner_url ?? null,
        admin_id: user.id,
        member_count: 1,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase
      .from('club_members')
      .insert({
        club_id: data.id,
        user_id: user.id,
        status: 'member',
      });

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create club' },
      { status: 500 }
    );
  }
}