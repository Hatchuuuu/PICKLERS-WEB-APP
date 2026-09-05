"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * RouteErrorFallback — shared error UI used by the per-route-group
 * `error.tsx` boundaries under (player)/app, (owner)/app/owner, and
 * (admin)/app/admin.
 *
 * Why a shared component:
 * - The three route groups all have their own layout (sidebar/header), and
 *   Next.js error boundaries do NOT replace the layout — they only wrap
 *   the page content. So we render this inside the existing dashboard
 *   chrome, not as a full-page takeover.
 * - Centralising the visual and behaviour means a single design change
 *   updates all three boundaries.
 *
 * Props:
 * - `error`:   the error thrown by the page. We log it to the console in
 *              dev so Vercel's runtime shows it; in prod we surface only
 *              the message (already user-safe, since we don't echo stack
 *              traces here).
 * - `reset`:   a function from Next.js to re-render the failed segment
 *              in place. We expose it on a primary "Try again" button.
 * - `homeHref`: where the secondary "Go to dashboard" button navigates.
 * - `label`:   small descriptive string for the secondary button (e.g.
 *              "Player dashboard").
 */
export function RouteErrorFallback({
  error,
  reset,
  homeHref,
  label,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  homeHref: string;
  label: string;
}) {
  const router = useRouter();

  useEffect(() => {
    // Surface the error in dev (and to Vercel/Sentry in prod via the
    // browser console + the digest if Next.js attached one). We do not
    // throw here — the boundary is already showing the fallback.
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.error("[RouteErrorFallback]", error);
    }
  }, [error]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-xl mx-auto"
    >
      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center bg-red-500/10 text-red-500 mb-6 border border-red-500/20">
        <AlertTriangle className="w-7 h-7 md:w-8 md:h-8" aria-hidden="true" />
      </div>

      <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground mb-2">
        Something went wrong
      </h2>

      <p className="text-[15px] md:text-base leading-relaxed text-muted-foreground mb-1 max-w-md">
        We hit an unexpected error rendering this page. Your data is safe —
        only this view needs a refresh.
      </p>

      {error?.digest && (
        <p className="text-xs text-muted-foreground/60 mt-1 font-mono">
          Reference: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-accent-primary text-white font-semibold text-sm hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_4px_16px_-4px_rgba(0,217,139,0.5)]"
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Try again
        </button>
        <button
          type="button"
          onClick={() => router.push(homeHref)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-surface-raised text-foreground font-semibold text-sm hover:bg-surface-interactive active:scale-[0.98] transition-all"
        >
          <Home className="w-4 h-4" aria-hidden="true" />
          {label}
        </button>
      </div>
    </div>
  );
}
