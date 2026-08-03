"use client";

import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div
          className="w-20 h-20 rounded-[24px] bg-emerald-500/10 border border-emerald-500/20
                      flex items-center justify-center mx-auto mb-6 text-emerald-400"
        >
          <Search className="w-10 h-10" />
        </div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          404
        </h1>
        <p className="text-ink-secondary mb-8 leading-relaxed">
          This court doesn&apos;t exist yet. The page you&apos;re looking for
          might have been moved or renamed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm
                     bg-accent-primary text-ink-inverse shadow-glow hover:brightness-110
                     active:scale-[0.97] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}