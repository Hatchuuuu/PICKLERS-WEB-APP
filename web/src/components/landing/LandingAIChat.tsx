"use client";

import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { ArrowUp, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type ResponseSource = "api" | "cache" | "fallback";

/**
 * LandingAIChat — extracted from app/page.tsx as part of P2.3 (landing page
 * RSC split). Before: the entire landing page was a single client component
 * that pulled in react-markdown, remark-gfm, the AI submit handler, the
 * fallback generator, and all the response state. Every landing visitor
 * downloaded that bundle. After: this island is the only part of the page
 * that needs react-markdown and the AI logic; the rest of the page can be
 * server-rendered with no JS for these parts.
 */
function getPrendFallbackResponse(query: string): string {
  const q = query.toLowerCase().trim();

  if (["yow", "yo", "hi", "hello", "hey", "sup", "musta", "kamusta", "uy", "oi"].some(
    (w) => q === w || q.startsWith(w + " ") || q.startsWith(w + "!")
  )) {
    return "Hi, ma PREND! What is up! Ready to hit the kitchen line, or are you just here to ask me philosophical questions while avoiding your backhand drills? Let us play some pickleball!";
  }
  if (q.includes("book") || q.includes("reserve") || q.includes("court") || q.includes("rent")) {
    return "Hi, ma PREND! To book a court, simply head over to the Explore tab in your Player Dashboard, select your preferred facility, pick an available time slot and court, and confirm your payment via GCash, Maya, or Pickle Credits.";
  }
  if (q.includes("paddle") || q.includes("equipment") || q.includes("ball") || q.includes("gear")) {
    return "Hi, ma PREND! Yes, you can definitely bring your own USAPA-approved paddle and balls!";
  }
  if (q.includes("score") || q.includes("rule") || q.includes("kitchen") || q.includes("serve")) {
    return "Hi, ma PREND! Remember the golden rule: stay out of the Non-Volley Zone (the Kitchen) unless the ball bounces in it first!";
  }
  if (q.includes("wallet") || q.includes("pay") || q.includes("credit") || q.includes("gcash") || q.includes("maya")) {
    return "Hi, ma PREND! We support instant online payments through GCash, Maya, QR Ph, credit cards, and Pickle Credits.";
  }
  if (q.includes("tournament") || q.includes("compete") || q.includes("bracket") || q.includes("prize")) {
    return "Hi, ma PREND! You can register for official tournaments directly in the Tournaments tab!";
  }
  if (q.includes("cancel") || q.includes("refund")) {
    return "Hi, ma PREND! Cancellations made at least 24 hours prior to your scheduled booking start time receive a full 100% refund in Pickle Credits automatically.";
  }
  return "Hi, ma PREND! That is quite a question. While the universe contemplates that mystery, I can tell you that the answer usually involves hitting a crisp third-shot drop right into your opponent's kitchen. If you need help booking a court, checking tournament schedules, or managing your wallet, ask away!";
}

const SOURCE_BADGE: Record<ResponseSource | "error", { label: string; color: string; bg: string; dot: string }> = {
  cache: { label: "🚀 Cached", color: "text-emerald-500", bg: "bg-emerald-500/20", dot: "bg-emerald-500" },
  fallback: { label: "🔄 Fallback", color: "text-amber-500", bg: "bg-amber-500/20", dot: "bg-amber-500" },
  api: { label: "⚡ Live", color: "text-blue-500", bg: "bg-blue-500/20", dot: "bg-blue-500" },
  error: { label: "⚠️ Error", color: "text-red-500", bg: "bg-red-500/20", dot: "bg-red-500" },
};

export function LandingAIChat() {
  const [aiQuestion, setAiQuestion] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiResponseSource, setAiResponseSource] = useState<ResponseSource>("cache");
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleAiSubmit(e: FormEvent) {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);
    setIsError(false);
    setErrorMessage("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: aiQuestion }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      setAiResponse(data.reply);
      setAiResponseSource("api");
    } catch (error) {
      console.error(error);
      setIsError(true);
      setErrorMessage("Sorry, I'm having trouble connecting right now. Please try again later!");
      setAiResponse(getPrendFallbackResponse(aiQuestion));
      setAiResponseSource("fallback");
    } finally {
      setIsAiLoading(false);
    }
  }

  function handleClear() {
    setAiResponse(null);
    setAiResponseSource("cache");
    setIsError(false);
    setErrorMessage("");
  }

  const currentBadgeKey: ResponseSource | "error" = isError ? "error" : aiResponseSource;
  const currentBadge = SOURCE_BADGE[currentBadgeKey];

  return (
    <div className="mt-12 p-6 md:p-8 rounded-2xl relative overflow-hidden bg-surface-raised border border-border backdrop-blur-xl group">
      <div className="relative z-10 flex flex-col gap-5">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="w-12 md:w-20 h-12 md:h-20">
            <Image
              src="/prend-chatbot-logo.svg"
              alt="Prend Picklers Chatbot"
              width={1}
              height={1}
              layout="responsive"
              className="object-contain drop-shadow-md shrink-0"
            />
          </div>
          <div className="flex flex-col justify-center">
            <h3 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Ask Prend Anything
            </h3>
            <p className="text-[14px] md:text-[15px] text-foreground/60 mt-0.5 font-medium">
              Can't find your answer? Ask Prend, our smart assistant.
            </p>
          </div>
        </div>

        <div className="relative mt-2 flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            {aiResponse && (
              <div
                className="flex items-center gap-1 text-xs"
                role="status"
                aria-live="polite"
                aria-label={`Response source: ${aiResponseSource === "cache" ? "served from cache" : aiResponseSource === "fallback" ? "fallback answer" : "live AI response"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${currentBadge.dot}`}
                  aria-hidden="true"
                />
                <span className={currentBadge.color}>
                  <span aria-hidden="true">
                    {aiResponseSource === "cache"
                      ? "(Cached)"
                      : aiResponseSource === "fallback"
                      ? "(Fallback)"
                      : "(Live)"}
                  </span>
                  <span className="sr-only">
                    {aiResponseSource === "cache"
                      ? "Served from cache"
                      : aiResponseSource === "fallback"
                      ? "Fallback answer"
                      : "Live AI response"}
                  </span>
                </span>
              </div>
            )}
            {(aiResponse || isError) && (
              <button
                onClick={handleClear}
                className="text-xs hover:underline transition-colors"
                disabled={!aiResponse && !isError}
              >
                Clear Chat
              </button>
            )}
          </div>

          <form onSubmit={handleAiSubmit} className="relative w-full">
            <input
              type="text"
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              placeholder="e.g. Can I bring my own paddle?"
              className="w-full h-14 pl-5 pr-16 rounded-2xl bg-white/[0.03] dark:bg-white/[0.02] border border-black/10 dark:border-white/10 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)] text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-[#00a4d3]/40 focus:border-[#00a4d3] hover:bg-black/[0.06] dark:hover:bg-white/[0.04] transition-all duration-300 text-[15px]"
            />

            {isAiLoading && (
              <div className="absolute inset-0 flex items-center pointer-events-none opacity-70">
                <div className="w-full h-full rounded-2xl bg-white/[0.08] dark:bg-white/[0.03]">
                  <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isAiLoading || !aiQuestion.trim()}
              className="absolute right-2 top-2 bottom-2 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-[#4cbd96] to-[#00a4d3] text-white shadow-[0_4px_16px_rgba(0,164,211,0.25)] hover:shadow-[0_4px_24px_rgba(0,164,211,0.45)] hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-[0_4px_16px_rgba(0,164,211,0.2)] transition-all duration-300 active:scale-[0.95]"
            >
              {isAiLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              )}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {(aiResponse || isError) && !isAiLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              className={`mt-4 p-5 md:p-6 rounded-2xl border shadow-[0_10px_40px_-15px_rgba(0,164,211,0.15)] backdrop-blur-3xl relative overflow-hidden ${
                aiResponseSource === "cache"
                  ? "bg-emerald-50/50 border-emerald-500/30 dark:bg-emerald-950/20"
                  : aiResponseSource === "fallback"
                  ? "bg-amber-50/50 border-amber-500/30 dark:bg-amber-950/20"
                  : isError
                  ? "bg-red-500/10 border-red-500/20 text-red-500 dark:text-red-400"
                  : "bg-white/[0.03] dark:bg-[#00a4d3]/[0.03] border-black/10 dark:border-white/10"
              }`}
            >
              <div
                className={`absolute top-2 right-2 flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${currentBadge.bg} ${currentBadge.color}`}
                role="status"
                aria-live="polite"
                aria-label={`Response source: ${aiResponseSource === "cache" ? "served from cache" : aiResponseSource === "fallback" ? "fallback answer" : "live AI response"}${isError ? "; an error was also shown" : ""}`}
              >
                <span aria-hidden="true">{currentBadge.label}</span>
                <span className="sr-only">
                  {aiResponseSource === "cache"
                    ? "Served from cache"
                    : aiResponseSource === "fallback"
                    ? "Fallback answer"
                    : "Live AI response"}
                </span>
              </div>

              <div className="absolute top-0 right-0 w-64 h-64 bg-[#00a4d3]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4cbd96]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
              <div className="flex gap-4">
                <div className="w-7 h-7 mt-0">
                  <Image
                    src="/prend-chatbot-logo.svg"
                    alt="Prend Picklers Chatbot"
                    width={1}
                    height={1}
                    layout="responsive"
                    className="object-contain drop-shadow-[0_0_8px_rgba(76,189,150,0.4)] shrink-0"
                  />
                </div>
                <div className="text-[15px] md:text-[16px] leading-relaxed w-full overflow-hidden text-foreground/90 font-medium pr-4">
                  {isError && errorMessage ? (
                    <p className="whitespace-pre-line text-[15px] md:text-[16px] leading-relaxed">{errorMessage}</p>
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ node, ...props }) => <p className="mb-3 last:mb-0 text-foreground/90" {...props} />,
                        strong: ({ node, ...props }) => <strong className="font-semibold text-foreground" {...props} />,
                        ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1 text-foreground/90" {...props} />,
                        ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1 text-foreground/90" {...props} />,
                        li: ({ node, ...props }) => <li {...props} />,
                        a: ({ node, ...props }) => <a className="underline decoration-emerald-500/50 hover:decoration-emerald-500 text-emerald-600 dark:text-emerald-400 underline-offset-4" {...props} />,
                        table: ({ node, ...props }) => (
                          <div className="overflow-x-auto mb-3 last:mb-0 bg-black/5 dark:bg-white/5 rounded-xl border border-border">
                            <table className="w-full text-left border-collapse text-sm text-foreground/90" {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => <th className="border-b border-border py-2.5 px-3 font-semibold bg-black/5 dark:bg-white/5 text-foreground" {...props} />,
                        td: ({ node, ...props }) => <td className="border-b border-border py-2 px-3 last:border-0" {...props} />,
                        h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-4 mb-2 text-foreground" {...props} />,
                        h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-4 mb-2 text-foreground" {...props} />,
                        h3: ({ node, ...props }) => <h3 className="text-md font-bold mt-3 mb-2 text-foreground" {...props} />,
                        code: ({ node, ...props }) => <code className="bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-foreground" {...props} />,
                      }}
                    >
                      {aiResponse || ""}
                    </ReactMarkdown>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {isAiLoading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-5 md:p-6 rounded-2xl border shadow-[0_10px_40px_-15px_rgba(0,164,211,0.15)] backdrop-blur-3xl bg-white/[0.03] dark:bg-[#00a4d3]/[0.03] border-black/10 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00a4d3]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#4cbd96]/10 rounded-full blur-[80px] -z-10 pointer-events-none" />
                <div className="flex gap-4 animate-pulse relative z-10">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 shrink-0" />
                  <div className="w-full space-y-2.5 mt-1">
                    <div className="h-3 bg-emerald-500/20 rounded-full w-full" />
                    <div className="h-3 bg-emerald-500/20 rounded-full w-5/6" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
