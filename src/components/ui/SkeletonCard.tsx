/**
 * Skeleton components – shimmer placeholders while data loads.
 * All use the global `shimmer` @keyframes from index.css.
 *
 * Exports:
 *  - SkeletonCard          → single tour card
 *  - SkeletonTourGrid      → responsive grid of tour cards
 *  - SkeletonPostCard      → community feed post
 *  - SkeletonTourDetail    → tour detail page hero + info
 *  - SkeletonStatCard      → admin overview stat card
 *  - SkeletonStatGrid      → row of stat cards
 *  - SkeletonTableRow      → admin table row
 *  - SkeletonTable         → full admin table with header
 */

// ── Shared shimmer overlay (uses global CSS `shimmer` keyframe) ─────────────
const ShimmerOverlay = () => (
  <div
    aria-hidden="true"
    className="absolute inset-0 z-10 pointer-events-none skeleton-shimmer"
  />
)

// ── Tour Card ────────────────────────────────────────────────────────────────
export function SkeletonCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5"
      style={{ background: "rgba(255,255,255,0.03)" }}
      aria-hidden="true"
    >
      <ShimmerOverlay />
      {/* Image placeholder */}
      <div className="h-52 w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="h-4 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="h-3 rounded-full w-1/2" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full" style={{ background: "rgba(127,90,240,0.12)" }} />
          <div className="h-5 w-12 rounded-full" style={{ background: "rgba(44,182,125,0.10)" }} />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-4 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-8 w-24 rounded-full" style={{ background: "rgba(127,90,240,0.15)" }} />
        </div>
      </div>
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

// ── Feed Post Card ───────────────────────────────────────────────────────────
export function SkeletonPostCard() {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-white/5 p-4 space-y-4"
      style={{ background: "rgba(255,255,255,0.03)" }}
      aria-hidden="true"
    >
      <ShimmerOverlay />
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full shrink-0" style={{ background: "rgba(255,255,255,0.08)" }} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-full w-2/5" style={{ background: "rgba(255,255,255,0.08)" }} />
          <div className="h-3 rounded-full w-1/4" style={{ background: "rgba(255,255,255,0.05)" }} />
        </div>
        {/* Follow button placeholder */}
        <div className="h-7 w-20 rounded-full" style={{ background: "rgba(127,90,240,0.15)" }} />
      </div>
      {/* Post text */}
      <div className="space-y-2">
        <div className="h-3 rounded-full w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-3 rounded-full w-5/6" style={{ background: "rgba(255,255,255,0.05)" }} />
        <div className="h-3 rounded-full w-3/4" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>
      {/* Image area */}
      <div className="h-52 rounded-xl w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
      {/* Action bar */}
      <div className="flex items-center gap-4 pt-1">
        <div className="h-4 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
        <div className="h-4 w-12 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      </div>
    </div>
  )
}

// ── Tour Detail Page ─────────────────────────────────────────────────────────
export function SkeletonTourDetail() {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      {/* Hero image */}
      <div className="relative h-72 md:h-96 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="absolute inset-0 skeleton-shimmer" />
        {/* Back button placeholder */}
        <div className="absolute top-6 left-6 h-9 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
        {/* Title block */}
        <div className="absolute bottom-7 left-6 space-y-3 w-2/3">
          <div className="h-4 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
          <div className="h-8 w-64 rounded-full" style={{ background: "rgba(255,255,255,0.12)" }} />
          <div className="flex gap-4">
            <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="h-3 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-6 w-48 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
              <div className="space-y-2">
                {[100, 90, 95, 80, 85].map((w, i) => (
                  <div key={i} className="h-3 rounded-full" style={{ background: "rgba(255,255,255,0.05)", width: `${w}%` }} />
                ))}
              </div>
            </div>
            {/* Gallery placeholders */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="relative aspect-video rounded-xl overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <div className="absolute inset-0 skeleton-shimmer" />
                </div>
              ))}
            </div>
          </div>
          {/* Right column – booking panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 p-5 space-y-4 h-80" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="absolute inset-0 skeleton-shimmer" />
            <div className="h-6 w-32 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
            <div className="h-4 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
            <div className="h-10 w-full rounded-xl" style={{ background: "rgba(127,90,240,0.12)" }} />
            <div className="h-12 w-full rounded-full" style={{ background: "rgba(127,90,240,0.20)" }} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin Stat Card ──────────────────────────────────────────────────────────
export function SkeletonStatCard() {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/5 p-5 space-y-3"
      style={{ background: "rgba(255,255,255,0.03)" }}
      aria-hidden="true"
    >
      <ShimmerOverlay />
      <div className="flex items-center justify-between">
        <div className="h-3 w-24 rounded-full" style={{ background: "rgba(255,255,255,0.07)" }} />
        <div className="size-6 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
      <div className="h-8 w-16 rounded-full" style={{ background: "rgba(255,255,255,0.10)" }} />
      <div className="h-2.5 w-20 rounded-full" style={{ background: "rgba(255,255,255,0.05)" }} />
    </div>
  )
}

export function SkeletonStatGrid({ count = 5 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  )
}

// ── Admin Table Row ──────────────────────────────────────────────────────────
export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  const widths = ["w-1/4", "w-1/3", "w-1/5", "w-1/6", "w-1/4"]
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 rounded-full ${widths[i % widths.length]}`}
          style={{ background: "rgba(255,255,255,0.06)", flex: 1 }}
        />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/5"
      style={{ background: "rgba(255,255,255,0.02)" }}
      aria-hidden="true"
    >
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3 border-b border-white/10">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded-full"
            style={{ background: "rgba(255,255,255,0.10)", flex: 1, maxWidth: i === 0 ? "30%" : undefined }}
          />
        ))}
      </div>
      {/* Body rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonTableRow key={i} cols={cols} />
      ))}
    </div>
  )
}
