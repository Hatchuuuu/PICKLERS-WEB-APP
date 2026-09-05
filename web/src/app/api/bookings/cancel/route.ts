import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const CancelBookingSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
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
    const parseResult = CancelBookingSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { bookingId } = parseResult.data;

    // Call cancel_booking_and_refund RPC function
    const { data: result, error: rpcErr } = await supabase.rpc("cancel_booking_and_refund", {
      p_booking_id: bookingId,
      p_user_id: user.id
    });

    if (rpcErr) {
      console.error("[Booking Cancel API] RPC error:", rpcErr);
      return NextResponse.json({ error: rpcErr.message || "Failed to cancel booking." }, { status: 400 });
    }

    return NextResponse.json({ success: true, result }, { status: 200 });

  } catch (err: unknown) {
    console.error("[Booking Cancel API] Exception:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
