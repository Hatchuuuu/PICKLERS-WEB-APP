import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

async function signDocumentUrl(supabase: any, pathOrUrl: string | null): Promise<string | null> {
  if (!pathOrUrl) return null;
  try {
    if (pathOrUrl.includes('/storage/v1/object/public/owner-documents/')) {
      const storagePath = pathOrUrl.split('/storage/v1/object/public/owner-documents/')[1];
      if (storagePath) {
        const { data } = await supabase.storage.from('owner-documents').createSignedUrl(storagePath, 600);
        if (data?.signedUrl) return data.signedUrl;
      }
    } else if (!pathOrUrl.startsWith('http://') && !pathOrUrl.startsWith('https://')) {
      const { data } = await supabase.storage.from('owner-documents').createSignedUrl(pathOrUrl, 600);
      if (data?.signedUrl) return data.signedUrl;
    }
  } catch (e) {
    // Fallback on error
  }
  return pathOrUrl;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();

    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'all';
    const pageParam = searchParams.get('page') ?? '1';
    const limitParam = searchParams.get('limit') ?? '20';

    // Create a normalized cache key based on query parameters
    const cacheKey = generateCacheKey('admin-applications', `${status}-${pageParam}-${limitParam}`);

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour)
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

    // If not in cache, proceed with database queries
    let query = supabase
      .from('owner_applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const page = Math.max(1, parseInt(pageParam, 10));
    const limit = Math.max(1, Math.min(100, parseInt(limitParam, 10)));
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: apps, count, error } = await query;

    if (error) {
      console.error('[API/admin/applications] Error fetching applications:', error);

      // Try to return cached data on error (fallback to stale cache)
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

      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Batch fetch applicant profiles
    const userIds = Array.from(new Set((apps || []).map((a: { user_id?: string }) => a.user_id).filter(Boolean)));
    const profilesRes = userIds.length > 0
      ? await supabase.from('player_profiles').select('id, name, avatar_url').in('id', userIds)
      : { data: [] };
    const profileMap = new Map((profilesRes.data || []).map((p: { id: string }) => [p.id, p]));

    // Concurrency-limited URL signing
    const enrichedData = await Promise.all(
      (apps || []).map(async (a: any) => {
        const [govIdSigned, licenseSigned, proofSigned] = await Promise.all([
          signDocumentUrl(supabase, a.government_id_url),
          signDocumentUrl(supabase, a.business_license_url),
          signDocumentUrl(supabase, a.proof_of_ownership_url),
        ]);

        const profile = a.user_id ? profileMap.get(a.user_id) : null;

        return {
          ...a,
          government_id_url: govIdSigned,
          business_license_url: licenseSigned,
          proof_of_ownership_url: proofSigned,
          applicant: profile || { id: a.user_id, name: a.business_name || 'Applicant' },
        };
      })
    );

    const responseData = {
      data: enrichedData,
      total: count || enrichedData.length,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    console.error('[API/admin/applications] Internal Exception:', err);

    // Try to return cached data on error
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'all';
    const pageParam = searchParams.get('page') ?? '1';
    const limitParam = searchParams.get('limit') ?? '20';
    const cacheKey = generateCacheKey('admin-applications', `${status}-${pageParam}-${limitParam}`);

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

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
