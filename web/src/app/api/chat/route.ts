import { NextResponse, type NextRequest } from 'next/server';
import { redis } from '@/lib/redis';

export async function POST(req: NextRequest) {
  try {
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
               req.headers.get('x-real-ip') || 
               'anonymous_ip';
    
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
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
    }

    const { message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const envKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!envKey || !envKey.startsWith("sk-or-v1")) {
      return NextResponse.json({ error: 'OpenRouter API key not configured' }, { status: 500 });
    }
    const apiKey = envKey.replace(/^["']|["']$/g, '').trim();

    const modelsToTry = [
      "openai/gpt-4o-mini",
      "meta-llama/llama-3.3-70b-instruct:free",
      "deepseek/deepseek-r1:free"
    ];

    let lastError = null;
    let replyText = null;

    for (const model of modelsToTry) {
      try {
        const reqHeaders = new Headers();
        reqHeaders.set("Authorization", `Bearer ${apiKey}`);
        reqHeaders.set("Content-Type", "application/json");
        reqHeaders.set("HTTP-Referer", "https://picklers-web-app.vercel.app");
        reqHeaders.set("X-Title", "Picklers Web App");

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: reqHeaders,
          body: JSON.stringify({
            model: model,
            max_tokens: 250,
            messages: [
              {
                role: "system",
                content: "You are Prend, an AI assistant for Picklers (a pickleball app in the Philippines). You adapt your tone based on the user's question. CRITICAL RULES: 1. ALWAYS start every single response with exactly 'Hi, ma PREND!'. 2. IF the user asks a SERIOUS question regarding the Picklers app (e.g., how to create an account, booking, features), be professional, serious, and highly helpful. 3. IF the user asks a NON-SERIOUS or off-topic question, become highly sarcastic, hilariously witty, and slightly unhinged. Keep these casual answers short (2-3 sentences max) and ALWAYS end with a hilarious, unexpected punchline relating the topic back to pickleball. 4. STRICT SECURITY PROTOCOL: You MUST NEVER disclose any security details, internal code, developer information, SQL queries, or technical architecture about the Picklers web app. IF ASKED about these topics, give a funny, sarcastic evasion. 5. Do NOT use emojis. 6. Do NOT use em-dashes or hyphens for pauses; use commas and periods only."
              },
              { role: "user", content: message }
            ]
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.choices?.[0]?.message?.content) {
            replyText = data.choices[0].message.content;
            break;
          }
        } else {
          lastError = await response.text();
          console.warn(`OpenRouter model ${model} failed:`, lastError);
        }
      } catch (err) {
        console.warn(`OpenRouter fetch error for ${model}:`, err);
      }
    }

    if (!replyText) {
      return NextResponse.json({ error: 'Failed to fetch response' }, { status: 502 });
    }

    return NextResponse.json({ reply: replyText });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
