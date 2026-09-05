import { NextResponse } from 'next/server';
import { requireDeveloper } from '../../_lib/requireDeveloper';
import { createDevSupabase } from '../../_lib/createDevSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

export async function GET() {
  try {
    const supabase = await createDevSupabase();
    const authResult = await requireDeveloper(supabase, 'threats.view');
    if (authResult instanceof NextResponse) return authResult;

    // Create a normalized cache key (no parameters for this endpoint)
    const cacheKey = generateCacheKey('dev-threats-stats');

    // 1. Check HEURISTIC CACHE FIRST (medium TTL: 2 minutes for threat stats - balances freshness with performance)
    const cachedHeuristic = await getCache<any>(cacheKey);
    if (cachedHeuristic !== null) {
      return NextResponse.json({
        stats: cachedHeuristic.data,
        cacheInfo: {
          source: 'heuristic',
          timestamp: cachedHeuristic.timestamp
        }
      }, { status: 200 });
    }

    // 2. Try to get from API cache (shorter TTL: 30 seconds)
    const cachedAPI = await getCache<any>(`${cacheKey}:api`);
    if (cachedAPI !== null) {
      return NextResponse.json({
        stats: cachedAPI.data,
        cacheInfo: {
          source: 'api',
          timestamp: cachedAPI.timestamp
        }
      }, { status: 200 });
    }

    // If not in cache, proceed with database queries
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const [
      eventsRes,
      activeThreatsRes,
      blockedIpsRes,
      criticalEventsRes,
    ] = await Promise.all([
      supabase
        .from('security_threat_events')
        .select('threat_type, severity, country_code, created_at')
        .gte('created_at', oneDayAgo),
      supabase
        .from('security_threat_events')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'detected'),
      supabase
        .from('blocked_ips')
        .select('id', { count: 'exact', head: true }),
      supabase
        .from('security_threat_events')
        .select('id', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .gte('created_at', oneDayAgo),
    ]);

    if (eventsRes.error && (eventsRes.error.code === 'PGRST204' || eventsRes.error.message?.includes('schema cache'))) {
      // Return cached data if available for schema cache errors
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          stats: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to schema cache error'
          }
        }, { status: 200 });
      }

      return NextResponse.json({
        stats: {
          defcon_level: 5,
          defcon_label: 'DEFCON 5 • NOMINAL',
          total_threats_24h: 0,
          active_threats: 0,
          blocked_ips_count: 0,
          top_attack_vector: 'none',
          top_vectors: [],
          timeline: [],
          recent_countries: [],
          pending_migration: true,
        },
      }, { status: 200 });
    }

    const events = eventsRes.data || [];
    const totalThreats24h = events.length;
    const activeThreats = activeThreatsRes.count || 0;
    const blockedIpsCount = blockedIpsRes.count || 0;
    const criticalCount = criticalEventsRes.count || 0;

    // Determine DEFCON / Threat Level:
    // DEFCON 1: > 5 Critical threats in 24h OR > 50 total active attacks
    // DEFCON 2: > 2 Critical threats OR > 25 attacks
    // DEFCON 3: > 10 attacks
    // DEFCON 4: > 0 attacks
    // DEFCON 5: 0 active attacks (Nominal)
    let defconLevel: 1 | 2 | 3 | 4 | 5 = 5;
    let defconLabel = 'DEFCON 5 • NOMINAL';

    if (criticalCount >= 5 || activeThreats >= 30) {
      defconLevel = 1;
      defconLabel = 'DEFCON 1 • CRITICAL ATTACK DETECTED';
    } else if (criticalCount >= 2 || activeThreats >= 15) {
      defconLevel = 2;
      defconLabel = 'DEFCON 2 • SEVERE INTRUSION ATTEMPTS';
    } else if (activeThreats >= 5 || totalThreats24h >= 20) {
      defconLevel = 3;
      defconLabel = 'DEFCON 3 • ELEVATED THREAT LEVEL';
    } else if (totalThreats24h > 0) {
      defconLevel = 4;
      defconLabel = 'DEFCON 4 • GUARDED SYSTEM STATE';
    }

    // Aggregate attack vector counts
    const vectorMap = new Map<string, number>();
    const countryMap = new Map<string, number>();

    events.forEach((ev: { threat_type?: string; country_code?: string }) => {
      const type = ev.threat_type || 'unknown';
      vectorMap.set(type, (vectorMap.get(type) || 0) + 1);

      const country = ev.country_code || 'UNKNOWN';
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });

    const topVectors = Array.from(vectorMap.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const topAttackVector = topVectors[0]?.type || 'none';

    const recentCountries = Array.from(countryMap.entries())
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Build 6-bucket hourly timeline
    const timeline: Array<{ hour: string; count: number; critical: number }> = [];
    const now = Date.now();
    for (let i = 5; i >= 0; i--) {
      const bucketStart = new Date(now - (i + 1) * 4 * 60 * 60 * 1000);
      const bucketEnd = new Date(now - i * 4 * 60 * 60 * 1000);

      const hourLabel = `${bucketStart.getHours()}:00`;
      const inBucket = events.filter((e: { created_at?: string }) => {
        if (!e.created_at) return false;
        const d = new Date(e.created_at);
        return d >= bucketStart && d < bucketEnd;
      });

      const critInBucket = inBucket.filter((e: { severity?: string }) => e.severity === 'critical').length;

      timeline.push({
        hour: hourLabel,
        count: inBucket.length,
        critical: critInBucket,
      });
    }

    const responseData = {
      stats: {
        defcon_level: defconLevel,
        defcon_label: defconLabel,
        total_threats_24h: totalThreats24h,
        active_threats: activeThreats,
        blocked_ips_count: blockedIpsCount,
        top_attack_vector: topAttackVector,
        top_vectors: topVectors,
        timeline,
        recent_countries: recentCountries,
      }
    };

    // Store in heuristic cache (TTL: 2 minutes = 120 seconds)
    await setCache(cacheKey, responseData, 120);

    // Store in API cache (TTL: 30 seconds = 30 seconds)
    await setCache(`${cacheKey}:api`, responseData, 30);

    return NextResponse.json({
      stats: responseData.stats,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    }, { status: 200 });
  } catch (err: unknown) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const cacheKey = generateCacheKey('dev-threats-stats');
      const cachedData = await getCache<any>(cacheKey);
      if (cachedData !== null) {
        return NextResponse.json({
          stats: cachedData.data,
          cacheInfo: {
            source: 'fallback',
            timestamp: cachedData.timestamp,
            error: 'Using cached data due to error'
          }
        }, { status: 200 });
      }
    } catch (cacheError) {
      console.error('[API/dev/threats/stats] Cache fallback error:', cacheError);
    }

    console.error('[API/dev/threats/stats] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
