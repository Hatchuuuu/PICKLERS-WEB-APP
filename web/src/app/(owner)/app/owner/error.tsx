"use client";

import { useEffect } from "react";
import { motion } from "motion/react";
import { AlertTriangle, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OwnerErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Owner dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center text-center max-w-sm"
      >
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle
            className="w-7 h-7 text-red-400"
            strokeWidth={1.5}
          />
        </div>

        <h2
          className="text-xl font-bold tracking-tight mb-1.5"
          style={{ color: "var(--ink-primary)" }}
        >
          Couldn&apos;t load this page
        </h2>
        <p
          className="text-sm mb-8 leading-relaxed"
          style={{ color: "var(--ink-muted)" }}
        >
          Something went wrong while loading the owner dashboard. Please try
          again.
        </p>

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/app/owner"
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-semibold transition-colors border border-solid"
            style={{
              color: "var(--ink-primary)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Go back
          </Link>
        </div>
      </motion.div>
    </div>
  );
}