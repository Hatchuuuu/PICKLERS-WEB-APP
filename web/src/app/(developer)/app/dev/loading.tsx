export default function DevLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
      {/* Dev Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-emerald-500/30" />
            <div className="h-7 w-52 rounded-xl bg-surface-interactive border border-border" />
          </div>
          <div className="h-4 w-80 rounded-lg bg-surface-interactive/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-xl bg-surface-interactive border border-border" />
          <div className="h-9 w-32 rounded-xl bg-surface-interactive border border-border" />
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3 font-mono"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-20 rounded bg-surface-interactive" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
            </div>
            <div className="h-8 w-28 rounded bg-surface-interactive" />
            <div className="h-3 w-36 rounded bg-surface-interactive/60" />
          </div>
        ))}
      </div>

      {/* Terminal / Telemetry Skeleton Box */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4 font-mono">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="h-5 w-40 rounded bg-surface-interactive" />
          <div className="h-5 w-24 rounded bg-surface-interactive/60" />
        </div>
        <div className="space-y-2.5 pt-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3 w-16 rounded bg-surface-interactive/50" />
              <div className="h-3 w-12 rounded bg-emerald-500/20" />
              <div className="h-3 flex-1 rounded bg-surface-interactive/40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
