import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy123');

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

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Only allow sending email to authenticated user's own email address
    if (user.email && to.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden: Recipient email must match account email' }, { status: 403 });
    }

    const data = await resend.emails.send({
      from: 'Picklers <noreply@picklers.com>',
      to: to,
      subject: subject,
      text: body,
    });

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: unknown) {
    console.error('Email API Error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
