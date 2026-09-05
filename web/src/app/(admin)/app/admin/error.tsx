"use client";

import { RouteErrorFallback } from "@/components/ui/RouteErrorFallback";

/**
 * Error boundary for the admin console route group
 * ((admin)/app/admin/*). A render error inside any admin page is caught
 * here and the shared fallback is shown — the surrounding admin layout
 * (sidebar, command palette, header) stays mounted, so an admin can
 * navigate to another console or retry without losing the chrome.
 */
export default function AdminError({
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
      homeHref="/app/admin"
      label="Admin console"
    />
  );
}
