import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
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

export async function GET(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const facilityId = parseInt(resolvedParams.id, 10);

    // Optional pagination
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey(
      'facility-reviews',
      `${facilityId}-${page}-${limit}`
    );

    // 1. Check HEURISTIC CACHE FIRST (medium TTL: 10 minutes for reviews - balances freshness with performance)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        data: cachedHeuristic.data.reviews,
        pagination: cachedHeuristic.data.pagination,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      }, { status: 200 });
    }

    // 2. Try to get from API cache (shorter TTL: 1 minute)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        data: cachedAPI.data.reviews,
        pagination: cachedAPI.data.pagination,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      }, { status: 200 });
    }

    // If not in cache, proceed with database queries
    const { data, error, count } = await supabase
      .from('facility_reviews')
      .select('*', { count: 'exact' })
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    const responseData = {
      reviews: data,
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit)
      }
    };

    const finalResponse = {
      data: responseData.reviews,
      pagination: responseData.pagination,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 10 minutes = 600 seconds)
    await setCache(cacheKey, finalResponse, 600);

    // Store in API cache (TTL: 1 minute = 60 seconds)
    await setCache(`${cacheKey}:api`, finalResponse, 60);

    return NextResponse.json(finalResponse);
  } catch (error: any) {
    console.error('[FACILITY_ID_REVIEWS_GET] Exception:', error);

    // Try to return cached data on error (fallback to stale cache)
    try {
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);
      const resolvedParams = await params;
      const facilityId = parseInt(resolvedParams.id, 10);
      const cacheKey = generateCacheKey(
        'facility-reviews',
        `${facilityId}-${page}-${limit}`
      );

      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData.data.reviews,
          pagination: cachedData.data.pagination,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.data.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }
    } catch (cacheError) {
      console.error('[FACILITY_ID_REVIEWS_GET] Cache fallback error:', cacheError);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const facilityId = parseInt(resolvedParams.id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { rating, review_text } = await req.json();

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      );
    }

    // Get user's name for display
    const { data: profile } = await supabase
      .from('player_profiles')
      .select('name')
      .eq('id', user.id)
      .single();

    const { data, error } = await supabase
      .from('facility_reviews')
      .insert({
        facility_id: facilityId,
        user_id: user.id,
        user_name: profile?.name ?? 'Anonymous',
        rating,
        review_text: review_text || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to submit review' },
      { status: 500 }
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } | Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const resolvedParams = await params;
    const reviewId = parseInt(resolvedParams.id, 10);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First fetch the review to verify facility ownership
    const { data: review, error: fetchError } = await supabase
      .from('facility_reviews')
      .select('facility_id')
      .eq('id', reviewId)
      .single();

    if (fetchError) throw fetchError;
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    // Check if the user owns the facility
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('owner_id')
      .eq('id', review.facility_id)
      .single();

    if (facilityError) throw facilityError;
    if (facility?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete the review
    const { error: deleteError } = await supabase
      .from('facility_reviews')
      .delete()
      .eq('id', reviewId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to delete review' },
      { status: 500 }
    );
  }
}