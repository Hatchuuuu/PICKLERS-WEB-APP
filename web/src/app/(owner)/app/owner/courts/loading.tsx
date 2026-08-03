export default function OwnerCourtsLoading() {
  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="relative h-[68px] mb-4 -mt-[1px]">
        <div className="absolute left-0 top-0">
          <div className="h-8 w-56 rounded-lg bg-white/5 animate-pulse mb-1.5" />
          <div className="h-4 w-72 rounded bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Court card skeleton list */}
      <div className="space-y-3 mt-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-white/5 bg-surface-raised p-5"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-5 w-36 rounded bg-white/5 animate-pulse" />
                <div className="h-4 w-24 rounded bg-white/5 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-20 rounded-lg bg-white/5 animate-pulse" />
                <div className="h-8 w-8 rounded-lg bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}