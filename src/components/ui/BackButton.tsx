import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"

interface BackButtonProps {
  /** Fallback route if there is no browser history to go back to */
  fallback?: string
  /** Optional label next to the arrow icon */
  label?: string
  className?: string
}

/**
 * BackButton — a consistent, accessible back-navigation button.
 *
 * Behaviour:
 *  - Calls `navigate(-1)` when browser history exists
 *  - Falls back to the `fallback` route (default: "/dashboard")
 *  - Minimum 44×44 px touch target for iOS/Android compliance
 */
export function BackButton({
  fallback = "/dashboard",
  label = "Back",
  className,
}: BackButtonProps) {
  const navigate = useNavigate()

  function handleBack() {
    // If there is meaningful history, go back; otherwise navigate to fallback
    if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate(fallback)
    }
  }

  return (
    <button
      onClick={handleBack}
      aria-label={label}
      className={cn(
        // Base layout
        "inline-flex items-center gap-2 rounded-xl px-3 py-2",
        // Minimum touch target (44px height guaranteed by py-2 + icon)
        "min-h-[44px]",
        // Colours — subtle but visible
        "text-sm font-medium text-white/60 hover:text-white",
        "bg-white/0 hover:bg-white/6 border border-transparent hover:border-white/10",
        // Transition
        "transition-all duration-200 active:scale-95",
        className
      )}
    >
      <ArrowLeft className="size-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
