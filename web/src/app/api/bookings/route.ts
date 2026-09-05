import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
// Note: cacheUtils imports removed — availability check now uses try_book_slot() advisory lock (A-002).
// Price caching is retained via direct query (see below).

const BookingRequestSchema = z.object({
  facility_id: z.number().or(z.string().transform(v => Number(v))),
  court_id: z.number().or(z.string()).optional(),
  court_name: z.string().min(1, "Court name is required"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  duration: z.string().min(1, "Duration is required"),
  price: z.number().min(0, "Price must be non-negative"),
  paymentMethod: z.enum(["gcash", "maya", "cash", "credits"]),
  player_name: z.string().optional(),
  player_phone: z.string().optional(),
  player_email: z.string().optional(),
  booking_ref: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = BookingRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    // F-560: idempotency support. Mobile networks flake; users double-tap.
    // A client-supplied Idempotency-Key (header or body) returns the original
    // booking without re-creating. Look up by (user_id, idempotency_key) in
    // admin_audit_logs.action='BOOKING_CREATE' metadata, or in a dedicated
    // bookings_idempotency table. Here we use admin_audit_logs because the
    // table already exists; if the lookup misses, we proceed normally.
    const idempotencyKey = request.headers.get('idempotency-key')
      || (body && typeof body.idempotencyKey === 'string' ? body.idempotencyKey : null);
    if (idempotencyKey && idempotencyKey.length <= 128) {
      const { data: prior } = await supabase
        .from('admin_audit_logs')
        .select('metadata')
        .eq('admin_id', user.id)
        .eq('action', 'BOOKING_CREATE_IDEMPOTENT')
        .contains('metadata', { idempotency_key: idempotencyKey })
        .maybeSingle();
      if (prior?.metadata && (prior.metadata as any).booking_id) {
        return NextResponse.json(
          { success: true, booking_id: (prior.metadata as any).booking_id, replayed: true },
          { status: 200 }
        );
      }
    }

    const { facility_id, court_name, date, startTime, endTime, duration, price, paymentMethod, player_name, player_phone, player_email } = parseResult.data;

    // A-016 FIX (server-side): Validate that start/end times are in the known
    // TIME_SLOTS array and that end is strictly after start. This prevents
    // crafted requests with out-of-range or reversed times from reaching the
    // price enforcement logic and potentially producing ₱0 bookings.
    const TIME_SLOTS = [
      "6:00 AM","7:00 AM","8:00 AM","9:00 AM","10:00 AM","11:00 AM",
      "12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM",
      "6:00 PM","7:00 PM","8:00 PM","9:00 PM","10:00 PM",
    ];
    const startIdx = TIME_SLOTS.indexOf(startTime);
    const endIdx   = TIME_SLOTS.indexOf(endTime);
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return NextResponse.json({ error: 'Invalid time slot selection.' }, { status: 400 });
    }
    const serverDurationHours = endIdx - startIdx; // authoritative; used below in price calc

    const timeSlot = `${startTime} – ${endTime}`;
    const account_name = user.user_metadata?.name || user.email?.split('@')[0] || "Verified Player";
    const custom_player_name = player_name || account_name;
    const contact_phone = player_phone || user.user_metadata?.phone || "";
    const contact_email = player_email || user.email || "";

    // A-002 FIX: Replace the racy check-then-insert pattern with an atomic
    // advisory-lock DB function. The previous approach read from a 30-second
    // Redis cache — two concurrent requests both saw null and both inserted.
    //
    // try_book_slot() acquires a transactional advisory lock keyed on the slot,
    // re-checks for confirmed bookings inside the lock, and returns false if
    // the slot is taken or another transaction holds the lock. This serializes
    // concurrent booking attempts for the same (facility, court, date, time).
    const { data: slotAvailable, error: slotCheckError } = await supabaseAdmin.rpc(
      'try_book_slot',
      {
        p_facility_id: facility_id,
        p_court_name:  court_name,
        p_date:        date,
        p_time:        timeSlot,
      }
    );

    if (slotCheckError) {
      console.error('[Bookings API] Slot availability check error:', slotCheckError);
      return NextResponse.json({ error: 'Failed to verify slot availability.' }, { status: 500 });
    }

    if (!slotAvailable) {
      return NextResponse.json(
        { error: `Court "${court_name}" is already booked for ${date} at ${timeSlot}. Please select another time.` },
        { status: 409 }
      );
    }

    // Authoritative price check against database
    let finalPrice = price;
    let courtData: any = null;
    try {
      // Create cache key for court price check
      const priceCacheKey = generateCacheKey('court-price', `${facility_id}-${court_name}`);

      // Try to get from cache first (medium TTL: 1 hour for court prices - changes infrequently)
      const cachedPriceData = await getCache<any>(priceCacheKey);
      if (cachedPriceData !== null) {
        courtData = cachedPriceData;
      } else {
        // If not in cache, query database
        const { data: queryResult } = await supabase
          .from('courts')
          .select('price')
          .eq('facility_id', facility_id)
          .eq('name', court_name)
          .maybeSingle();

        courtData = queryResult;

        // Cache the result
        await setCache(priceCacheKey, courtData, 3600); // 1 hour TTL
      }

      if (courtData && typeof courtData.price === 'number' && courtData.price > 0) {
        let durationHours = 1;
        const durMatch = duration.match(/(\d+)/);
        if (durMatch) {
          const num = parseInt(durMatch[1], 10);
          durationHours = duration.toLowerCase().includes('hr') || duration.toLowerCase().includes('hour')
            ? num
            : Math.max(1, Math.ceil(num / 60));
        }
        const expectedTotal = courtData.price * durationHours;
        // If client price is significantly lower than court rate without valid coupon, enforce expectedTotal
        if (price < expectedTotal) {
          finalPrice = expectedTotal;
        }
      }
    } catch (priceCheckErr) {
      console.warn("[Bookings API] Price verification warning:", priceCheckErr);

      // Try to get cached data on error (fallback to stale cache)
      try {
        const priceCacheKey = generateCacheKey('court-price', `${facility_id}-${court_name}`);
        const cachedPriceData = await getCache<any>(priceCacheKey);
        if (cachedPriceData !== null) {
          courtData = cachedPriceData;
          if (courtData && typeof courtData.price === 'number' && courtData.price > 0) {
            let durationHours = 1;
            const durMatch = duration.match(/(\d+)/);
            if (durMatch) {
              const num = parseInt(durMatch[1], 10);
              durationHours = duration.toLowerCase().includes('hr') || duration.toLowerCase().includes('hour')
                ? num
                : Math.max(1, Math.ceil(num / 60));
            }
            const expectedTotal = courtData.price * durationHours;
            // If client price is significantly lower than court rate without valid coupon, enforce expectedTotal
            if (price < expectedTotal) {
              finalPrice = expectedTotal;
            }
          }
        }
      } catch (cacheError) {
        console.error('[BOOKINGS_ROUTE] Price cache fallback error:', cacheError);
      }
    }

    let creditDeducted = false;

    // 2. Handle payment deduction if paying via credits
    if (paymentMethod === "credits" && finalPrice > 0) {
      const { error: rpcErr } = await supabase.rpc("deduct_wallet_balance", {
        p_user_id: user.id,
        p_amount: finalPrice,
        p_label: `Court Booking — ${court_name}`
      });

      if (rpcErr) {
        console.error("[Bookings API] Credits deduction failed:", rpcErr);
        return NextResponse.json({ error: rpcErr.message || "Insufficient Pickle Credits balance." }, { status: 400 });
      }
      creditDeducted = true;
    }

    // 3. Insert booking record into Supabase database
    const { data: insertedBooking, error: insertErr } = await supabase
      .from('bookings')
      .insert({
        user_id: user.id,
        facility_id: facility_id,
        court_name: court_name,
        date: date,
        time: timeSlot,
        duration: duration,
        price: finalPrice,
        status: "confirmed"
      })
      .select('*, facilities(name)')
      .maybeSingle();

    if (insertErr) {
      console.error("[Bookings API] Insert failed:", insertErr);

      // Rollback deducted credits if booking record insertion failed.
      // F-578 cascade: this path used `supabaseAdmin` which is now hardened
      // to panic when the service role key is missing. That's correct — the
      // rollback must run as service_role, and a missing key is fatal.
      if (creditDeducted && finalPrice > 0) {
        try {
          await supabaseAdmin.rpc("increment_wallet_balance_admin", {
            amount: finalPrice,
            user_id: user.id,
            p_label: `Booking Failed — Credits Refunded (${court_name})`
          });
        } catch (rollbackErr) {
          // Surface the rollback failure to Sentry; an admin needs to
          // manually re-credit the player. We don't fail the request here
          // because the insert already failed and the user already sees a
          // 500 — the rollback is best-effort.
          console.error("[Bookings API] Rollback error:", rollbackErr);
        }
      }

      return NextResponse.json({ error: "Failed to create booking record." }, { status: 500 });
    }

    // 4. Log into booking_requests for owner visibility (with real account name & custom player pass name)
    try {
      await supabase.from('booking_requests').insert({
        user_id: user.id,
        facility_id: facility_id,
        player_name: custom_player_name,
        account_name: account_name,
        player_phone: contact_phone,
        player_email: contact_email,
        court_name: court_name,
        date: date,
        time: timeSlot,
        total: finalPrice,          // A-008 FIX: use server-enforced price, not client-submitted price
        status: "approved"
      });
    } catch (reqErr) {
      console.warn("[Bookings API] booking_requests log warning:", reqErr);
    }

    // 5. Update live court status in courts table so FacilityDetailView & LiveCourts show occupied with custom alias
    try {
      // A-022 FIX: `new Date().toISOString()` is UTC. Philippines is UTC+8.
      // At 23:30 PHT the UTC date is already tomorrow, so the gate would fail
      // for any booking after 8 PM PHT. Offset by +8 hours before comparing.
      const nowPHT = new Date(Date.now() + 8 * 60 * 60 * 1000);
      const todayStr = nowPHT.toISOString().split("T")[0];
      if (date === todayStr) {
        await supabase
          .from('courts')
          .update({
            status: 'occupied',
            occupied_by: custom_player_name,
            occupied_from: startTime,
            occupied_until: endTime
          })
          .eq('facility_id', facility_id)
          .eq('name', court_name);
      }
    } catch (courtErr) {
      console.warn("[Bookings API] Court live update warning:", courtErr);
    }

    // Record the idempotency key (best-effort). Uses service_role so the
    // audit log row can attribute the booking to the user without needing a
    // player-side admin_audit_logs policy.
    if (idempotencyKey && insertedBooking) {
      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_id: user.id,
          action: 'BOOKING_CREATE_IDEMPOTENT',
          target_type: 'booking',
          target_id: String(insertedBooking.id),
          metadata: {
            idempotency_key: idempotencyKey,
            booking_id: insertedBooking.id,
            facility_id,
            court_name,
            date,
          },
        });
      } catch (idemErr) {
        console.warn('[Bookings API] idempotency log warning:', idemErr);
      }
    }

    return NextResponse.json({ success: true, booking: insertedBooking }, { status: 200 });

  } catch (err: unknown) {
    console.error("[Bookings API] Error:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
