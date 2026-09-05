import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '../_lib/requireAdmin';
import { createAdminSupabase } from '../_lib/createAdminSupabase';
import { getCache, setCache, generateCacheKey } from '@/lib/cacheUtils';

const DEFAULT_SETTINGS: Record<string, unknown> = {
  platform_fee_percent: 10,
  maintenance_mode: false,
  auto_verify_owners: false,
  max_booking_advance_days: 14,
  allow_demo_accounts: true,
};

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase);
    if (authCheck instanceof NextResponse) return authCheck;

    // Create a normalized cache key (no parameters for this endpoint)
    const cacheKey = generateCacheKey('admin-settings');

    // 1. Check HEURISTIC CACHE FIRST (longest TTL: 1 hour for settings - changes infrequently)
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
    const { data: rows, error } = await supabase.from('platform_settings').select('key, value');

    const settings = { ...DEFAULT_SETTINGS };

    if (!error && rows && rows.length > 0) {
      for (const row of rows) {
        settings[row.key] = row.value;
      }
    }

    const responseData = {
      data: settings,
      cacheInfo: { source: 'api', timestamp: new Date().toISOString() }
    };

    // Store in heuristic cache (TTL: 1 hour = 3600 seconds)
    await setCache(cacheKey, responseData, 3600);

    // Store in API cache (TTL: 10 minutes = 600 seconds)
    await setCache(`${cacheKey}:api`, responseData, 600);

    return NextResponse.json(responseData, { status: 200 });
  } catch (err: unknown) {
    // Try to return cached data on error (fallback to stale cache)
    try {
      const cacheKey = generateCacheKey('admin-settings');
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
    } catch (cacheError) {
      console.error('[API/admin/settings] Cache fallback error:', cacheError);
    }

    if (process.env.NODE_ENV === 'development') console.error('[API/admin/settings] GET Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createAdminSupabase();
    const authCheck = await requireAdmin(supabase, 'settings.manage');
    if (authCheck instanceof NextResponse) return authCheck;
    const { adminId } = authCheck;

    const body = await request.json();
    const allowedKeys = [
      'platform_fee_percent',
      'maintenance_mode',
      'auto_verify_owners',
      'max_booking_advance_days',
      'allow_demo_accounts',
    ];

    const updates: Record<string, unknown> = {};
    for (const key of allowedKeys) {
      if (Object.prototype.hasOwnProperty.call(body, key)) {
        updates[key] = body[key];
      }
    }

    if (updates.platform_fee_percent !== undefined) {
      const fee = Number(updates.platform_fee_percent);
      if (isNaN(fee) || fee < 0.5 || fee > 50) {
        return NextResponse.json({ error: 'platform_fee_percent must be a number between 0.5 and 50' }, { status: 400 });
      }
      updates.platform_fee_percent = fee;
    }

    if (updates.max_booking_advance_days !== undefined) {
      const days = Number(updates.max_booking_advance_days);
      if (isNaN(days) || days < 1 || days > 365) {
        return NextResponse.json({ error: 'max_booking_advance_days must be an integer between 1 and 365' }, { status: 400 });
      }
      updates.max_booking_advance_days = Math.floor(days);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid setting keys provided' }, { status: 400 });
    }

    // Persist each key in platform_settings
    const upsertPayload = Object.entries(updates).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
      updated_by: adminId,
      updated_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await supabase
      .from('platform_settings')
      .upsert(upsertPayload, { onConflict: 'key' });

    if (upsertErr) {
      if (process.env.NODE_ENV === 'development') console.error('[API/admin/settings] Upsert error:', upsertErr);
      return NextResponse.json({ error: upsertErr.message }, { status: 500 });
    }

    // Log to admin_audit_logs (P2-04 / Security audit)
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    await supabase.from('admin_audit_logs').insert({
      admin_id: adminId,
      action: 'UPDATE_PLATFORM_SETTINGS',
      target_type: 'platform_settings',
      target_id: adminId,
      metadata: { updates },
      ip_address: ipAddress,
    });

    return NextResponse.json({ success: true, data: updates }, { status: 200 });
  } catch (err: unknown) {
    if (process.env.NODE_ENV === 'development') console.error('[API/admin/settings] PATCH Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
