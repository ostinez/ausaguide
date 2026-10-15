import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Sparkles, ArrowRight, X } from "lucide-react"

const STORAGE_KEY = "ausaguide_payments_banner_dismissed"

/**
 * Top-of-site announcement banner
 *
 * Minimalist, editorial notice featuring Ausaguide cream background (#F5F1EA),
 * deep teal accents (#0A5F5F), warm orange Lucide Sparkles (#E87A3D), and
 * a persistent dismiss action stored in localStorage.
 */
export function Banner() {
  const [isDismissed, setIsDismissed] = useState<boolean>(true) // start true to prevent flash
  const [isMounted, setIsMounted] = useState<boolean>(false)

  useEffect(() => {
    setIsMounted(true)
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      setIsDismissed(stored === "true")
    } catch {
      setIsDismissed(false)
    }
  }, [])

  // Do not render before mount, if dismissed, or if payments are actively enabled
  if (!isMounted || isDismissed || import.meta.env.VITE_PAYMENTS_ENABLED === "true") {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      localStorage.setItem(STORAGE_KEY, "true")
    } catch {
      // Ignore private browsing storage quota issues
    }
  }

  return (
    <aside
      role="region"
      aria-label="Payments Launch Announcement"
      className="relative z-40 w-full bg-[#F5F1EA] dark:bg-[#143F3E] border-b border-[#0A5F5F]/15 dark:border-[#235E5D] text-[#0A5F5F] dark:text-[#E6F4F1] transition-all"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3.5 py-2.5 sm:px-6 sm:py-2">
        {/* Left: Sparkles icon + Announcement message */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Sparkles className="size-4 shrink-0 text-[#E87A3D]" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-medium tracking-tight truncate sm:overflow-visible">
            <span>Payments launch soon — join the waitlist for early access</span>
          </p>
        </div>

        {/* Right: Join now text link with ArrowRight + Dismiss X */}
        <div className="flex shrink-0 items-center gap-3">
          <Link
            to="/waitlist"
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#0A5F5F] dark:text-[#B7E6E5] hover:text-[#E87A3D] dark:hover:text-[#E87A3D] underline-offset-4 hover:underline transition-colors"
          >
            <span>Join now</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss payment launch announcement"
            className="flex size-6 items-center justify-center rounded-md text-[#0A5F5F]/70 dark:text-[#B7E6E5]/70 hover:bg-[#0A5F5F]/10 dark:hover:bg-white/10 hover:text-[#0A5F5F] dark:hover:text-white transition-colors cursor-pointer"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default Banner
