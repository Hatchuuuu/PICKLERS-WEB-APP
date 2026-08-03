export default function PlayerLoading() {
  return (
    <div className="p-4 max-w-6xl mx-auto w-full">
      {/* Header skeleton */}
      <div className="relative h-[68px] mb-4 -mt-[1px]">
        <div className="absolute left-0 top-0">
          <div className="h-8 w-48 rounded-lg bg-white/5 animate-pulse mb-1.5" />
          <div className="h-4 w-64 rounded bg-white/5 animate-pulse" />
        </div>
      </div>

      {/* Facility card skeleton grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/5 bg-surface-raised overflow-hidden"
          >
            <div className="aspect-[16/10] bg-white/5 animate-pulse" />
            <div className="p-4 space-y-3">
              <div className="h-5 w-3/4 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-white/5 animate-pulse" />
              <div className="flex gap-2">
                <div className="h-6 w-16 rounded-full bg-white/5 animate-pulse" />
                <div className="h-6 w-20 rounded-full bg-white/5 animate-pulse" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}