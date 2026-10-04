import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Wrench, X } from "lucide-react"
import { arePaymentsEnabled } from "@/lib/payments-config"

const DISMISS_STORAGE_KEY = "ausaguide_payment_maintenance_dismissed"

export function NoticeBanner() {
  const [dismissed, setDismissed] = useState<boolean>(true) // start true to prevent flash
  const [mounted, setMounted] = useState<boolean>(false)

  useEffect(() => {
    setMounted(true)
    try {
      const isDismissed = localStorage.getItem(DISMISS_STORAGE_KEY) === "true"
      setDismissed(isDismissed)
    } catch (_) {
      setDismissed(false)
    }
  }, [])

  // If payments are enabled, or user dismissed, or before client mount, hide
  if (!mounted || dismissed || arePaymentsEnabled()) {
    return null
  }

  function handleDismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, "true")
    } catch (_) {
      // ignore storage quota errors in private browsing
    }
  }

  return (
    <aside
      role="region"
      aria-label="Payment Integration Update"
      className="relative z-40 w-full border-b border-[#F97316]/30 bg-gradient-to-r from-[#113B3A] via-[#0D6F73] to-[#113B3A] text-white shadow-md transition-all duration-300"
    >
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:gap-6 md:py-2.5">
        {/* Left: Icon, Headline & Body */}
        <div className="flex flex-1 items-start gap-3">
          <div
            className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#F97316]/20 border border-[#F97316]/40 text-[#F97316] shadow-sm"
            aria-hidden="true"
          >
            <Wrench className="size-4 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-[#F97316]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#F97316] border border-[#F97316]/30">
                Notice
              </span>
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                Payment Integration Update
              </h2>
            </div>
            <p className="text-xs text-white/90 leading-relaxed max-w-3xl">
              We're currently upgrading our payment system to serve you better. If you have an existing account, you'll be notified by email as soon as checkout is back online.
            </p>
          </div>
        </div>

        {/* Right: CTA Button & Dismiss X */}
        <div className="flex w-full items-center justify-between gap-2.5 sm:w-auto md:justify-end shrink-0">
          <Link
            to="/waitlist"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#F97316] hover:bg-[#EA580C] px-3.5 py-1.5 text-xs font-semibold text-white shadow hover:shadow-md active:scale-[0.98] transition-all"
          >
            <span>Join the Waitlist &rarr;</span>
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss payment notice"
            className="flex size-7 items-center justify-center rounded-md text-white/70 hover:bg-white/15 hover:text-white transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default NoticeBanner
