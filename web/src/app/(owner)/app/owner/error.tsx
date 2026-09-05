"use client";

import { RouteErrorFallback } from "@/components/ui/RouteErrorFallback";

/**
 * Error boundary for the owner dashboard route group
 * ((owner)/app/owner/*). A render error inside any owner page is caught
 * here and the shared fallback is shown — the surrounding owner layout
 * (sidebar, header, demo banner) stays mounted, so the user can navigate
 * elsewhere or retry without the whole app white-screening.
 */
export default function OwnerError({
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
      homeHref="/app/owner"
      label="Owner dashboard"
    />
  );
}
