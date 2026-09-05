export default function AdminLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-64 rounded-xl bg-surface-interactive border border-border" />
          <div className="h-4 w-96 rounded-lg bg-surface-interactive/60" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-28 rounded-xl bg-surface-interactive border border-border" />
          <div className="h-10 w-32 rounded-xl bg-emerald-500/20 border border-emerald-500/30" />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-surface-interactive" />
              <div className="w-8 h-8 rounded-xl bg-surface-interactive border border-border" />
            </div>
            <div className="h-7 w-32 rounded-lg bg-surface-interactive" />
            <div className="h-3 w-40 rounded bg-surface-interactive/60" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="h-6 w-48 rounded bg-surface-interactive" />
          <div className="h-64 rounded-xl bg-surface-interactive/40" />
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
          <div className="h-6 w-36 rounded bg-surface-interactive" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-surface-interactive/50 border border-border/50">
                <div className="w-10 h-10 rounded-full bg-surface-interactive" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 rounded bg-surface-interactive" />
                  <div className="h-3 w-1/2 rounded bg-surface-interactive/60" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
