export default function Loading() {
  return (
    <div className="space-y-6 animate-pulse font-mono" aria-busy="true" aria-label="Loading page content">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl">
        <div className="space-y-2">
          <div className="h-5 w-52 bg-slate-800 rounded-md" />
          <div className="h-3.5 w-72 bg-slate-800/70 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-slate-800 rounded-xl" />
        </div>
      </div>

      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 space-y-3"
          >
            <div className="h-3.5 w-20 bg-slate-800 rounded-md" />
            <div className="h-7 w-12 bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Table / list skeleton */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex gap-3">
          <div className="h-9 flex-1 max-w-sm bg-slate-800 rounded-xl" />
          <div className="h-9 w-28 bg-slate-800 rounded-xl" />
        </div>
        <div className="divide-y divide-slate-800/60">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-3.5">
              <div className="w-8 h-8 rounded-lg bg-slate-800 shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-1/3 bg-slate-800 rounded-md" />
                <div className="h-3 w-1/2 bg-slate-800/70 rounded-md" />
              </div>
              <div className="h-5 w-14 bg-slate-800 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
