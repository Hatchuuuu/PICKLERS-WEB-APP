export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message } = req.body;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://picklers-web-app.vercel.app", 
        "X-Title": "Picklers Web App" 
      },
      body: JSON.stringify({
        model: "openai/gpt-4o-mini",
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
      throw new Error("Failed to fetch from OpenRouter");
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    console.error("OpenRouter API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
