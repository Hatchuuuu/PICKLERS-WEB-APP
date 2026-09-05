export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Loading page content">
      {/* Page header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl border border-border bg-surface-base/60">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded-lg" />
          <div className="h-4 w-72 bg-muted/70 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-muted rounded-xl" />
          <div className="h-9 w-24 bg-muted rounded-xl" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-5 rounded-2xl border border-border bg-surface-base/60 space-y-3">
            <div className="h-4 w-20 bg-muted rounded-md" />
            <div className="h-7 w-16 bg-muted rounded-lg" />
          </div>
        ))}
      </div>

      {/* Content area skeleton */}
      <div className="rounded-2xl border border-border bg-surface-base/60 overflow-hidden">
        <div className="p-4 border-b border-border flex gap-3">
          <div className="h-9 flex-1 max-w-xs bg-muted rounded-xl" />
          <div className="h-9 w-28 bg-muted rounded-xl" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <div className="w-10 h-10 rounded-xl bg-muted shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 bg-muted rounded-md" />
                <div className="h-3 w-1/2 bg-muted/70 rounded-md" />
              </div>
              <div className="h-6 w-16 bg-muted rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
