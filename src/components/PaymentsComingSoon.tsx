import { useNavigate } from "react-router-dom"
import { Clock, Sparkles, ArrowRight, ShieldCheck } from "lucide-react"

export interface PaymentsComingSoonProps {
  className?: string
}

/**
 * PaymentsComingSoon
 *
 * Professional, editorial notice informing travelers that payments are launching soon.
 * Designed using Ausaguide's signature brand: deep teal (#0A5F5F), warm orange (#E87A3D),
 * cream (#F5F1EA), and white.
 */
export function PaymentsComingSoon({ className = "" }: PaymentsComingSoonProps) {
  const navigate = useNavigate()

  const handleWaitlistClick = (e: React.MouseEvent) => {
    const waitlistElement = document.getElementById("waitlist")
    if (waitlistElement) {
      e.preventDefault()
      waitlistElement.scrollIntoView({ behavior: "smooth" })
    } else {
      navigate("/waitlist")
    }
  }

  return (
    <div
      className={`w-full max-w-[480px] mx-auto rounded-3xl bg-white dark:bg-[#184948] border border-[#E5DFD5] dark:border-[#235E5D] p-8 sm:p-10 shadow-[0_4px_24px_rgba(10,95,95,0.06)] text-center transition-all ${className}`}
    >
      {/* Lucide Clock icon inside soft circular background */}
      <div className="flex justify-center mb-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-[#0A5F5F]/10 dark:bg-[#0A5F5F]/25 border border-[#0A5F5F]/15 dark:border-[#235E5D]">
          <Clock className="size-6 text-[#0A5F5F] dark:text-[#B7E6E5]" />
        </div>
      </div>

      {/* Heading */}
      <h2 className="text-[24px] font-semibold tracking-tight text-[#0A5F5F] dark:text-white leading-tight mb-3">
        Payments Launch Soon
      </h2>

      {/* Body paragraph */}
      <p className="text-sm text-[#4A5568] dark:text-[#CBD5E1] leading-relaxed mb-4">
        We're finishing work on our payment system to make sure every booking and host payout is fast, secure, and reliable.
      </p>

      {/* Second line with Lucide Sparkles icon inline */}
      <p className="text-xs sm:text-sm text-[#4A5568] dark:text-[#CBD5E1] leading-relaxed flex items-center justify-center gap-1.5 mb-8">
        <Sparkles className="size-4 text-[#E87A3D] shrink-0" />
        <span>Join the waitlist for early access and priority booking when we go live in Nairobi.</span>
      </p>

      {/* Primary CTA button */}
      <div className="mb-5">
        <button
          type="button"
          onClick={handleWaitlistClick}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-[#E87A3D] hover:bg-[#d96c2e] active:scale-[0.98] px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
        >
          <span>Join the Waitlist</span>
          <ArrowRight className="size-4" />
        </button>
      </div>

      {/* Muted small line with Lucide ShieldCheck icon inline */}
      <p className="text-xs text-[#718096] dark:text-[#94A3B8] flex items-center justify-center gap-1.5">
        <ShieldCheck className="size-4 text-[#0A5F5F] dark:text-[#B7E6E5] shrink-0" />
        <span>Secure M-Pesa payouts. No booking fees until launch.</span>
      </p>
    </div>
  )
}

export default PaymentsComingSoon
