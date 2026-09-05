import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DEMO_NOTIFICATIONS } from '@/lib/demoData';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: true, data: DEMO_NOTIFICATIONS, isFallback: true });
    }

    // Create a normalized cache key based on user ID
    const cacheKey = generateCacheKey('notifications', userId);

    // 1. Check HEURISTIC CACHE FIRST (medium TTL: 2 minutes for notifications)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        success: true,
        data: cachedHeuristic.data,
        isFallback: false,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      });
    }

    // 2. Try to get from API cache (shorter TTL: 30 seconds)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        success: true,
        data: cachedAPI.data,
        isFallback: false,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      });
    }

    // If not in cache, proceed with database query
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error || !data || data.length === 0) {
      // Try to return cached data on error (fallback to stale cache)
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          success: true,
          data: cachedData.data,
          isFallback: true,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        });
      }

      return NextResponse.json({ success: true, data: DEMO_NOTIFICATIONS, isFallback: true });
    }

    const responseData = {
      success: true,
      data,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 2 minutes = 120 seconds)
    await setCache(cacheKey, responseData, 120);

    // Store in API cache (TTL: 30 seconds = 30 seconds)
    await setCache(`${cacheKey}:api`, responseData, 30);

    return NextResponse.json(responseData);
  } catch (error: any) {
    // Try to return cached data on error
    try {
      const { searchParams } = new URL(request.url);
      const userId = searchParams.get('userId');
      if (userId) {
        const cacheKey = generateCacheKey('notifications', userId);
        const cachedData = await getCache<any>(cacheKey);
        if (cachedData !== null) {
          return NextResponse.json({
            success: true,
            data: cachedData.data,
            isFallback: true,
            cacheInfo: {
              source: 'fallback',
              timestamp: cachedData.timestamp,
              error: 'Using cached data due to error'
            }
          });
        }
      }
    } catch (cacheError) {
      console.error('[NOTIFICATIONS_ROUTE] Cache fallback error:', cacheError);
    }

    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, markAll } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    if (user.id !== userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized: can only modify own notifications' }, { status: 403 });
    }

    if (markAll) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json({ success: true, message: 'Notifications marked as read' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
