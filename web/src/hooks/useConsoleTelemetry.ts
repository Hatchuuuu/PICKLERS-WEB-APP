/**
 * useConsoleTelemetry
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised hook that manages badge-count polling for both the Admin
 * Console (pending applications) and the Developer Console (unresolved errors).
 *
 * Usage:
 *   const { pendingCount, errorCount, decrementError, refetch } = useConsoleTelemetry();
 *
 * Key design decisions:
 * - isMounted ref prevents setState after unmount (memory-leak guard).
 * - Individual refetch functions are exposed so in-page actions (e.g. resolving
 *   an error, approving an application) can trigger an immediate badge refresh
 *   instead of waiting up to 60 s for the next poll tick.
 * - Returns null for each count while the initial fetch is in flight (callers
 *   can render a skeleton / omit the badge entirely until data lands).
 */
"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ConsoleTelemetry {
  /** Number of pending partner applications (null = loading) */
  pendingCount: number | null;
  /** Number of unresolved error events (null = loading) */
  errorCount: number | null;
  /** Immediately decrement errorCount by 1 (optimistic update on resolve) */
  decrementError: () => void;
  /** Immediately increment pendingCount by 1 (optimistic update) */
  incrementPending: () => void;
  /** Immediately decrement pendingCount by a given delta (after bulk action) */
  decrementPending: (delta?: number) => void;
  /** Trigger a manual refresh of all counts */
  refetch: () => void;
}

const ADMIN_POLL_MS = 30_000;
const DEV_POLL_MS = 60_000;

export function useConsoleTelemetry(): ConsoleTelemetry {
  const [pendingCount, setPendingCount] = useState<number | null>(null);
  const [errorCount, setErrorCount] = useState<number | null>(null);

  const isMounted = useRef(true);

  // ── Admin: pending applications count ─────────────────────────────────────
  const fetchPending = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      // Use the lightweight aggregated-counts endpoint (Phase 2 addition)
      const res = await fetch("/api/admin/applications/counts");
      if (res.ok && isMounted.current) {
        const json = await res.json();
        setPendingCount(json.pending ?? 0);
      }
    } catch {
      // Non-critical — badge silently stale is acceptable
    }
  }, []);

  // ── Dev: unresolved errors count ───────────────────────────────────────────
  const fetchErrors = useCallback(async () => {
    if (typeof document !== "undefined" && document.hidden) return;
    try {
      const res = await fetch("/api/dev/errors");
      // If unauthorised stop polling silently (dev console not accessible)
      if (res.status === 401 || res.status === 403) return;
      if (res.ok && isMounted.current) {
        const json = await res.json();
        const unresolved = (json.errors ?? []).filter(
          (e: { status?: string }) => e.status !== "resolved"
        ).length;
        setErrorCount(unresolved);
      }
    } catch {
      // Non-critical
    }
  }, []);

  // ── Combined refetch ───────────────────────────────────────────────────────
  const refetch = useCallback(() => {
    fetchPending();
    fetchErrors();
  }, [fetchPending, fetchErrors]);

  // ── Optimistic helpers ─────────────────────────────────────────────────────
  const decrementError = useCallback(
    () => setErrorCount((prev) => (prev !== null ? Math.max(0, prev - 1) : null)),
    []
  );

  const incrementPending = useCallback(
    () => setPendingCount((prev) => (prev !== null ? prev + 1 : null)),
    []
  );

  const decrementPending = useCallback(
    (delta = 1) =>
      setPendingCount((prev) => (prev !== null ? Math.max(0, prev - delta) : null)),
    []
  );

  // ── Polling lifecycle ──────────────────────────────────────────────────────
  useEffect(() => {
    isMounted.current = true;

    // Initial fetch
    fetchPending();
    fetchErrors();

    // Polling intervals
    const adminInterval = setInterval(fetchPending, ADMIN_POLL_MS);
    const devInterval = setInterval(fetchErrors, DEV_POLL_MS);

    // Refetch on tab focus (avoids stale counts after the user switches back)
    const onVisibilityChange = () => {
      if (!document.hidden) refetch();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isMounted.current = false;
      clearInterval(adminInterval);
      clearInterval(devInterval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [fetchPending, fetchErrors, refetch]);

  return {
    pendingCount,
    errorCount,
    decrementError,
    incrementPending,
    decrementPending,
    refetch,
  };
}
