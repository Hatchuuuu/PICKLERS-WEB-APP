import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

const RegisterSchema = z.object({
  tournamentId: z.string().min(1, "Tournament ID is required"),
  teamName: z.string().min(2, "Team name must be at least 2 characters").max(50, "Team name too long"),
  partnerName: z.string().optional(),
  playerLevel: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
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
      return NextResponse.json({ error: "Unauthorized: Please sign in to register." }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = RegisterSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json({ error: parseResult.error.issues[0].message }, { status: 400 });
    }

    const { tournamentId, teamName, partnerName, playerLevel, phone, email } = parseResult.data;

    // Check if tournament exists
    const { data: tournament, error: tErr } = await supabase
      .from('tournaments')
      .select('id, name, status, max_teams')
      .eq('id', tournamentId)
      .maybeSingle();

    if (tErr || !tournament) {
      return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    }

    // Check if already registered
    const { data: existingReg } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingReg) {
      return NextResponse.json({ error: "You are already registered for this tournament." }, { status: 409 });
    }

    // Insert registration
    const { data: registration, error: insertErr } = await supabase
      .from('tournament_registrations')
      .insert({
        tournament_id: tournamentId,
        user_id: user.id,
        team_name: teamName,
        partner_name: partnerName || null,
        player_level: playerLevel || '2.5',
        contact_phone: phone || user.phone || null,
        contact_email: email || user.email || null,
        status: 'confirmed'
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error("[Tournament Registration] Insert error:", insertErr);
      return NextResponse.json({ error: "Failed to register for tournament." }, { status: 500 });
    }

    // Send a confirmation notification
    try {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: "Tournament Registration Confirmed! 🏆",
        message: `You and ${teamName} are successfully registered for ${tournament.name}. Good luck on the court!`,
        read: false,
      });
    } catch (notifErr) {
      console.warn("[Tournament Registration] Notification warning:", notifErr);
    }

    return NextResponse.json({ success: true, registration }, { status: 200 });

  } catch (err: unknown) {
    console.error("[Tournament Registration] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
