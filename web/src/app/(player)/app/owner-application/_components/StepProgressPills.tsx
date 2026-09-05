"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * StepProgressPills — the three-pill step indicator at the top of the
 * owner application form. A pill is `active` while its step is current,
 * `passed` once the user has moved past it (and becomes clickable so
 * they can jump back), and otherwise `pending`.
 *
 * F-203c: extracted from page.tsx so the parent only has to pass
 * `current` and `onJumpTo`.
 */
const STEPS: ReadonlyArray<{ num: 1 | 2 | 3; label: string; icon: string }> = [
  { num: 1, label: "Facility Details", icon: "🎾" },
  { num: 2, label: "Contact Info", icon: "👤" },
  { num: 3, label: "Verification", icon: "📄" },
];

export function StepProgressPills({
  current,
  onJumpTo,
}: {
  current: 1 | 2 | 3;
  onJumpTo: (step: 1 | 2 | 3) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2 mb-8" role="tablist" aria-label="Application progress">
      {STEPS.map((s) => {
        const isActive = current === s.num;
        const isPassed = current > s.num;
        return (
          <div
            key={s.num}
            role="tab"
            aria-selected={isActive}
            aria-current={isActive ? "step" : undefined}
            tabIndex={isPassed ? 0 : -1}
            onClick={() => isPassed && onJumpTo(s.num)}
            onKeyDown={(e) => {
              if (isPassed && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onJumpTo(s.num);
              }
            }}
            className={cn(
              "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-extrabold transition-all select-none",
              isActive
                ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 shadow-[0_4px_16px_rgba(16,185,129,0.25)] cursor-default"
                : isPassed
                  ? "bg-surface-interactive border-border text-ink-secondary hover:border-emerald-500/30 cursor-pointer"
                  : "bg-surface-interactive/50 border-border text-muted-foreground cursor-default"
            )}
          >
            <span className="text-sm" aria-hidden="true">{s.icon}</span>
            <span className="hidden sm:inline">{s.label}</span>
            <span className="sm:hidden">Step {s.num}</span>
            {isPassed && (
              <Check className="w-3.5 h-3.5 ml-auto text-emerald-500 shrink-0" aria-hidden="true" />
            )}
          </div>
        );
      })}
    </div>
  );
}
