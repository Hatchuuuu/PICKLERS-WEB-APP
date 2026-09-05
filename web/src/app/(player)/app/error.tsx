"use client";

import { RouteErrorFallback } from "@/components/ui/RouteErrorFallback";

/**
 * Error boundary for the player dashboard route group
 * ((player)/app/*). A render error inside any player page is caught here
 * and the shared fallback is shown — the surrounding player layout
 * (sidebar, header, demo banner) stays mounted, so the user can navigate
 * elsewhere or retry without the whole app white-screening.
 */
export default function PlayerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteErrorFallback
      error={error}
      reset={reset}
      homeHref="/app"
      label="Player dashboard"
    />
  );
}
