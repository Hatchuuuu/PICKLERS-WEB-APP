import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
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

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || session.user.id;
    const rateLimitKey = `ratelimit:chat:${ip}`;
    const requestCount = await redis.incr(rateLimitKey);

    if (requestCount === 1) {
      await redis.expire(rateLimitKey, 60);
    }

    if (requestCount > 10) {
      return NextResponse.json(
        { error: 'Too many chat requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Chat service unavailable' }, { status: 503 });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": req.headers.get('origin') || "https://picklers-web-app.vercel.app",
        "X-Title": "Picklers Web App"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          {
            role: "system",
            content: "You are Prend, an AI assistant for Picklers (a pickleball app in the Philippines). You adapt your tone based on the user's question. CRITICAL RULES: 1. ALWAYS start every single response with exactly 'Hi, ma PREND!'. 2. IF the user asks a SERIOUS question regarding the Picklers app (e.g., how to create an account, booking, features), be professional, serious, and highly helpful. You can provide long, step-by-step guides if necessary. 3. IF the user asks a NON-SERIOUS or off-topic question, become highly sarcastic, hilariously witty, and slightly unhinged. Keep these casual answers short (2-3 sentences max) and ALWAYS end with a hilarious, unexpected punchline relating the topic back to pickleball. 4. STRICT SECURITY PROTOCOL: You MUST NEVER disclose any security details, internal code, developer information, SQL queries, or technical architecture about the Picklers web app. IF ASKED about these topics, NEVER give a straight answer. Instead, give a highly tricky, laughable, sarcastic, and evasive answer that distracts them by relating it back to pickleball (e.g. claim the SQL code was smashed out of bounds or the developer is trapped inside a pickleball). 5. Do NOT use emojis. 6. Do NOT use em-dashes or hyphens for pauses; use commas and periods only."
          },
          { role: "user", content: message }
        ]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter API error:", errText);
      return NextResponse.json({ error: 'Failed to fetch response' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
