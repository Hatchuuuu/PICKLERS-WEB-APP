export default function OwnerLoading() {
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-8 w-56 rounded-xl bg-surface-interactive border border-border" />
          <div className="h-4 w-72 rounded-lg bg-surface-interactive/60" />
        </div>
        <div className="h-10 w-36 rounded-xl bg-emerald-500/20 border border-emerald-500/30" />
      </div>

      {/* Courts Status Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-border bg-card shadow-sm space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="h-5 w-28 rounded bg-surface-interactive" />
              <div className="h-6 w-20 rounded-full bg-surface-interactive" />
            </div>
            <div className="h-24 rounded-xl bg-surface-interactive/40" />
            <div className="flex items-center justify-between pt-2 border-t border-border/60">
              <div className="h-4 w-20 rounded bg-surface-interactive/60" />
              <div className="h-4 w-16 rounded bg-surface-interactive" />
            </div>
          </div>
        ))}
      </div>

      {/* Booking Requests Table Skeleton */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="h-5 w-44 rounded bg-surface-interactive" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-surface-interactive/50 border border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-interactive" />
                <div className="space-y-1.5">
                  <div className="h-4 w-32 rounded bg-surface-interactive" />
                  <div className="h-3 w-24 rounded bg-surface-interactive/60" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-8 w-20 rounded-lg bg-surface-interactive" />
                <div className="h-8 w-20 rounded-lg bg-emerald-500/20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
