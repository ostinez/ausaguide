/**
 * SkeletonCard – shimmer placeholder for tour cards while data loads.
 * Uses a pure CSS shimmer animation with no external dependencies.
 */
export function SkeletonCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 bg-white/3"
      style={{ background: "rgba(255,255,255,0.03)" }}
      aria-hidden="true"
    >
      {/* Shimmer overlay */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
          animation: "shimmer 1.6s infinite",
          backgroundSize: "200% 100%",
        }}
      />

      {/* Image placeholder */}
      <div className="h-52 w-full bg-white/5 rounded-t-2xl" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <div className="h-4 bg-white/8 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
        {/* Subtitle */}
        <div className="h-3 bg-white/5 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
        {/* Tags */}
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full" style={{ background: "rgba(127,90,240,0.12)" }} />
          <div className="h-5 w-12 rounded-full" style={{ background: "rgba(44,182,125,0.10)" }} />
        </div>
        {/* Price row */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-8 w-24 rounded-full" style={{ background: "rgba(127,90,240,0.15)" }} />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

export function SkeletonTourGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
