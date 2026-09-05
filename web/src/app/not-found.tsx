"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20
                      flex items-center justify-center mx-auto mb-6 text-emerald-500 dark:text-emerald-400"
        >
          <Search className="w-10 h-10" />
        </div>
        <h1
          className="text-3xl font-bold mb-2 text-foreground"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          404
        </h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          This court doesn&apos;t exist yet. The page you&apos;re looking for
          might have been moved or renamed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm
                     bg-emerald-500 text-white hover:bg-emerald-400 shadow-md
                     active:scale-[0.97] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}