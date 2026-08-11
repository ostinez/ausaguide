import * as React from "react"
import { cn } from "@/lib/utils"

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-[#1e1e24] relative overflow-hidden", className)}
      {...props}
    >
      <ShimmerOverlay />
    </div>
  )
}

// ── Shared shimmer overlay (uses custom CSS `skeleton-shimmer-custom` keyframe) ─
export function ShimmerOverlay() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-10 pointer-events-none skeleton-shimmer-custom"
    />
  )
}

// ── Generic Skeleton Primitives ──────────────────────────────────────────────

export function SkeletonText({ lines = 1, className }: { lines?: number; className?: string }) {
  const widths = ["w-full", "w-[92%]", "w-[96%]", "w-[85%]", "w-[90%]"]
  return (
    <div className={cn("space-y-2.5", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3 rounded-md bg-[#1e1e24] relative overflow-hidden",
            widths[i % widths.length]
          )}
        >
          <ShimmerOverlay />
        </div>
      ))}
    </div>
  )
}

export function SkeletonImage({ className }: { className?: string }) {
  return (
    <div className={cn("h-[150px] sm:h-[200px] w-full rounded-xl bg-[#1e1e24] relative overflow-hidden", className)}>
      <ShimmerOverlay />
    </div>
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-white/5 bg-[#16161A]/40 p-4 space-y-4 shadow-xl", className)}>
      <ShimmerOverlay />
      <SkeletonImage className="h-[150px] sm:h-[180px]" />
      <div className="space-y-3">
        <SkeletonText lines={1} className="w-3/4" />
        <SkeletonText lines={2} className="w-full" />
        <div className="flex gap-2 pt-1">
          <div className="h-5 w-16 rounded-full bg-[#1e1e24]/80" />
          <div className="h-5 w-12 rounded-full bg-[#1e1e24]/80" />
        </div>
        <div className="flex items-center justify-between pt-2">
          <div className="h-5 w-20 rounded-md bg-[#1e1e24]/80" />
          <div className="h-8 w-24 rounded-full bg-primary/20" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonGrid({
  columns = 3,
  count = 6,
  mobileCount = 2,
  className,
}: {
  columns?: number
  count?: number
  mobileCount?: number
  className?: string
}) {
  const colClass = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-5",
    6: "grid-cols-2 lg:grid-cols-6",
  }[columns] || "grid-cols-2 md:grid-cols-3"

  return (
    <div className={cn("grid gap-4 sm:gap-6", colClass, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          className={cn(i >= mobileCount ? "hidden sm:block" : "block")}
        />
      ))}
    </div>
  )
}

// ── Specific Page-Themed Skeletons ───────────────────────────────────────────

export function SkeletonTourGrid({ count = 6, mobileCount = 2 }: { count?: number; mobileCount?: number }) {
  return <SkeletonGrid columns={3} count={count} mobileCount={mobileCount} />
}

export function SkeletonPostCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-2xl border border-white/5 p-4 space-y-4 bg-[#16161A]/40 shadow-xl", className)}
      aria-hidden="true"
    >
      <ShimmerOverlay />
      {/* Author row */}
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-full shrink-0 bg-[#1e1e24]" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-full w-2/5 bg-[#1e1e24]" />
          <div className="h-3 rounded-full w-1/4 bg-[#1e1e24]" />
        </div>
        <div className="h-7 w-20 rounded-full bg-primary/20" />
      </div>
      {/* Post text */}
      <SkeletonText lines={3} />
      {/* Image area */}
      <SkeletonImage className="h-[150px] sm:h-[200px] rounded-xl" />
      {/* Action bar */}
      <div className="flex items-center gap-4 pt-1">
        <div className="h-4 w-12 rounded-full bg-[#1e1e24]" />
        <div className="h-4 w-12 rounded-full bg-[#1e1e24]" />
        <div className="h-4 w-12 rounded-full bg-[#1e1e24]" />
      </div>
    </div>
  )
}

export function SkeletonTourDetail() {
  return (
    <div className="min-h-screen bg-background" aria-hidden="true">
      {/* Hero image */}
      <div className="relative h-[180px] sm:h-[300px] md:h-[400px] overflow-hidden bg-[#1e1e24]">
        <ShimmerOverlay />
        <div className="absolute top-6 left-6 h-9 w-20 rounded-full bg-white/10" />
        <div className="absolute bottom-7 left-6 space-y-3 w-2/3">
          <div className="h-4 w-32 rounded-full bg-white/10" />
          <div className="h-8 w-64 rounded-full bg-white/15" />
          <div className="flex gap-4">
            <div className="h-3 w-20 rounded-full bg-white/10" />
            <div className="h-3 w-20 rounded-full bg-white/10" />
            <div className="h-3 w-20 rounded-full bg-white/10" />
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
          {/* Left column */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-6 w-48 rounded-full bg-[#1e1e24]" />
              <SkeletonText lines={5} />
            </div>
            {/* Gallery placeholders */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonImage key={i} className="aspect-video h-auto rounded-xl" />
              ))}
            </div>
          </div>
          {/* Right column – booking panel */}
          <div className="relative overflow-hidden rounded-2xl border border-white/5 p-5 space-y-4 h-80 bg-[#16161A]/40 shadow-xl">
            <ShimmerOverlay />
            <div className="h-6 w-32 rounded-full bg-[#1e1e24]" />
            <div className="h-4 w-24 rounded-full bg-[#1e1e24]" />
            <div className="h-10 w-full rounded-xl bg-primary/10" />
            <div className="h-12 w-full rounded-full bg-primary/20" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonStatCard({ className }: { className?: string }) {
  return (
    <div
      className={cn("relative overflow-hidden rounded-xl border border-white/5 p-5 space-y-3 bg-[#16161A]/40 shadow-xl", className)}
      aria-hidden="true"
    >
      <ShimmerOverlay />
      <div className="flex items-center justify-between">
        <div className="h-3.5 w-24 rounded-full bg-[#1e1e24]" />
        <div className="size-6 rounded-full bg-[#1e1e24]" />
      </div>
      <div className="h-8 w-16 rounded-full bg-[#1e1e24]" />
      <div className="h-2.5 w-20 rounded-full bg-[#1e1e24]/60" />
    </div>
  )
}

export function SkeletonStatGrid({ count = 5 }: { count?: number }) {
  const colClass = count === 5 
    ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-5" 
    : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
  return (
    <div className={cn("grid gap-4", colClass)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard 
          key={i} 
          className={cn(count === 5 && i >= 4 ? "col-span-2 md:col-span-1" : "")} 
        />
      ))}
    </div>
  )
}

export function SkeletonTableRow({ cols = 4 }: { cols?: number }) {
  const widths = ["w-1/4", "w-1/3", "w-1/5", "w-1/6", "w-1/4"]
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/5" aria-hidden="true">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "h-3.5 rounded-full bg-[#1e1e24]", 
            widths[i % widths.length],
            i >= 2 ? "hidden sm:block" : ""
          )}
          style={{ flex: 1 }}
        />
      ))}
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-white/5 bg-[#16161A]/40 shadow-xl"
      aria-hidden="true"
    >
      <ShimmerOverlay />
      {/* Header row */}
      <div className="flex items-center gap-4 px-4 py-3.5 border-b border-white/10 bg-[#1e1e24]/20">
        {Array.from({ length: cols }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-3 rounded-full bg-[#1e1e24]",
              i >= 2 ? "hidden sm:block" : ""
            )}
            style={{ flex: 1, maxWidth: i === 0 ? "30%" : undefined }}
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


export function SkeletonJournalCard({ className }: { className?: string }) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-amber-500/10 bg-[#1d1b18]/30 p-5 space-y-3", className)} aria-hidden="true">
      <ShimmerOverlay />
      <div className="h-3 w-24 rounded-full bg-amber-500/20" />
      <div className="h-5 w-1/2 rounded-full bg-amber-500/10" />
      <div className="h-3.5 w-full rounded-full bg-[#1e1e24]" />
      <div className="h-3.5 w-5/6 rounded-full bg-[#1e1e24]" />
      <div className="h-2.5 w-20 rounded-full bg-[#1e1e24]/60" />
    </div>
  )
}

export function SkeletonDashboard({ role: _role = "traveler" }: { role?: string }) {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          {/* Stats row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard className="hidden sm:block" />
            <SkeletonStatCard className="hidden sm:block" />
          </div>
          {/* Charts/Lists skeleton */}
          <div className="space-y-4">
            <div className="h-6 w-36 rounded-full bg-[#1e1e24]" />
            <SkeletonTable rows={3} cols={4} />
          </div>
        </div>
        <div className="space-y-8">
          <div className="h-80 rounded-2xl bg-[#1e1e24]/10 border border-white/5 p-5 space-y-4 relative overflow-hidden">
            <ShimmerOverlay />
            <div className="h-5 w-28 rounded-full bg-[#1e1e24]" />
            <div className="h-10 w-full rounded-md bg-[#1e1e24]/80" />
            <div className="h-10 w-full rounded-md bg-[#1e1e24]/80" />
            <div className="h-10 w-full rounded-md bg-[#1e1e24]/80" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-20 relative animate-in fade-in duration-300" aria-hidden="true">
      <div className="mx-auto max-w-5xl px-4 space-y-8">
        <div className="h-8 w-36 rounded-full bg-[#1e1e24]" />
        
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          {/* Left Column: avatar and profile summary card */}
          <div className="space-y-6">
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#16161A]/40 p-5 space-y-4 shadow-xl">
              <ShimmerOverlay />
              <div className="mx-auto size-24 rounded-full bg-[#1e1e24]" />
              <div className="h-5 w-3/4 mx-auto rounded-full bg-[#1e1e24]" />
              <div className="h-3 w-1/2 mx-auto rounded-full bg-[#1e1e24]/60" />
              <div className="h-3.5 w-full rounded-full bg-[#1e1e24]/80" />
              <div className="h-3.5 w-5/6 rounded-full bg-[#1e1e24]/80" />
            </div>
          </div>
          
          {/* Right Column: user description tabs */}
          <div className="space-y-6">
            <div className="h-10 w-64 rounded-full bg-[#1e1e24]" />
            <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-[#16161A]/40 p-6 space-y-4 shadow-xl">
              <ShimmerOverlay />
              <div className="h-4 w-40 bg-[#1e1e24] rounded-full" />
              <SkeletonText lines={4} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
