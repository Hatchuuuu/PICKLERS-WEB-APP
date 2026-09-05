"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#0A1628] text-white font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="flex flex-col items-center text-center max-w-md">
            {/* Logo */}
            <div className="mb-8">
              <img
                src="/PICKLERS_OFFICIAL_LOGO.svg"
                alt="Picklers"
                className="h-14 w-auto"
              />
            </div>

            {/* Error indicator */}
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
              <svg
                className="h-8 w-8 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>

            {/* Copy */}
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              Something went wrong
            </h1>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              An unexpected error occurred. We&apos;ve logged it and will look
              into it right away.
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => reset()}
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold bg-emerald-500 text-white hover:bg-emerald-400 shadow-md transition-colors cursor-pointer"
              >
                Try again
              </button>
              <a
                href="/"
                className="inline-flex items-center justify-center h-11 px-6 rounded-xl text-sm font-semibold border border-border bg-surface-interactive text-foreground hover:bg-surface-interactive/80 transition-colors cursor-pointer"
              >
                Back to Home
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}