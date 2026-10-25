import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { Cookie, X, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

const CONSENT_KEY = "cookie_consent"

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Only show if not already accepted
    const accepted = localStorage.getItem(CONSENT_KEY) === "true" || localStorage.getItem("cookie-consent") === "accepted"
    if (!accepted) {
      // Show banner
      setVisible(true)
    }
  }, [])

  function handleAccept() {
    localStorage.setItem(CONSENT_KEY, "true")
    localStorage.setItem("cookie-consent", "accepted")
    window.dispatchEvent(new Event("cookies-accepted"))
    setVisible(false)
  }

  function handleDismiss() {
    setVisible(false)
  }

  if (!visible) return null

  return (
    <aside
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent banner"
      className="fixed bottom-0 left-0 right-0 z-[9999] animate-in slide-in-from-bottom-4 duration-500"
    >
      {/* Backdrop blur strip */}
      <div className="w-full bg-[#0c1a19]/95 backdrop-blur-xl border-t border-[#235E5D]/50 shadow-2xl shadow-black/60">
        <div className="max-w-5xl mx-auto px-4 py-4 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          {/* Icon + copy */}
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="shrink-0 flex size-9 items-center justify-center rounded-xl bg-[#0D6F73]/20 border border-[#0D6F73]/30 mt-0.5">
              <Cookie className="size-4 text-[#0D6F73]" aria-hidden="true" />
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              We use cookies. 🍪 Not the chocolate chip kind, but the ones that keep you logged in and help us improve the site. By continuing, you agree to our{" "}
              <Link
                to="/privacy"
                className="text-[#38b2ac] hover:text-[#0D6F73] underline underline-offset-2 font-semibold transition-colors"
              >
                Privacy Policy
              </Link>
              {" "}and{" "}
              <Link
                to="/terms"
                className="text-[#38b2ac] hover:text-[#0D6F73] underline underline-offset-2 font-semibold transition-colors"
              >
                Terms of Service
              </Link>
              .
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <Button
              id="cookie-banner-accept"
              type="button"
              size="sm"
              onClick={handleAccept}
              className="flex-1 sm:flex-none min-w-[100px] bg-gradient-to-r from-[#0D6F73] to-[#10b981] hover:from-[#0a585b] hover:to-[#059669] text-white font-semibold rounded-lg shadow-md shadow-[#0D6F73]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Accept
            </Button>
            <button
              id="cookie-banner-dismiss"
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss cookie banner"
              className="flex size-8 items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default CookieBanner
