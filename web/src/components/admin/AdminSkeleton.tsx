"use client";

import { cn } from "@/lib/utils";

// Skeleton for a single table row (n cells)
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="p-4">
          <div
            className={cn(
              "h-4 rounded-lg bg-surface-raised animate-pulse",
              i === 0 ? "w-3/4" : i === cols - 1 ? "w-1/3 ml-auto" : "w-1/2"
            )}
          />
        </td>
      ))}
    </tr>
  );
}

// Skeleton rows block for tables
export function SkeletonTableRows({
  rows = 5,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}

// Skeleton card for grid layouts (e.g. ApplicationCard)
export function SkeletonCard() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-surface-base/80 flex flex-col gap-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-surface-raised shrink-0" />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-4 w-2/3 rounded-lg bg-surface-raised" />
          <div className="h-3 w-1/2 rounded-lg bg-surface-raised" />
        </div>
        <div className="h-6 w-20 rounded-full bg-surface-raised shrink-0" />
      </div>
      <div className="flex flex-col gap-2 py-3 border-y border-border/40">
        <div className="h-3 w-full rounded-lg bg-surface-raised" />
        <div className="h-3 w-4/5 rounded-lg bg-surface-raised" />
      </div>
      <div className="flex justify-between">
        <div className="h-3 w-24 rounded-lg bg-surface-raised" />
        <div className="h-3 w-28 rounded-lg bg-surface-raised" />
      </div>
    </div>
  );
}

// Skeleton for a stat card
export function SkeletonStatCard() {
  return (
    <div className="p-5 rounded-2xl border border-border bg-surface-base/80 animate-pulse flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-lg bg-surface-raised" />
        <div className="w-9 h-9 rounded-xl bg-surface-raised" />
      </div>
      <div className="h-8 w-20 rounded-lg bg-surface-raised" />
      <div className="h-3 w-32 rounded-lg bg-surface-raised" />
    </div>
  );
}

// User row skeleton (with avatar)
export function SkeletonUserRow() {
  return (
    <tr>
      <td className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-surface-raised animate-pulse shrink-0" />
          <div className="flex flex-col gap-2">
            <div className="h-3.5 w-28 rounded-lg bg-surface-raised animate-pulse" />
            <div className="h-3 w-36 rounded-lg bg-surface-raised animate-pulse" />
          </div>
        </div>
      </td>
      <td className="p-4"><div className="h-6 w-16 rounded-full bg-surface-raised animate-pulse" /></td>
      <td className="p-4"><div className="h-6 w-14 rounded-full bg-surface-raised animate-pulse" /></td>
      <td className="p-4"><div className="h-3 w-20 rounded-lg bg-surface-raised animate-pulse" /></td>
      <td className="p-4 text-right">
        <div className="flex items-center justify-end gap-2">
          <div className="h-7 w-16 rounded-xl bg-surface-raised animate-pulse" />
          <div className="h-7 w-20 rounded-xl bg-surface-raised animate-pulse" />
        </div>
      </td>
    </tr>
  );
}
