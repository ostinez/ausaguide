import { useState } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import { Spinner } from "@/components/ui/spinner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { arePaymentsEnabled } from "@/lib/payments-config"
import {
  AlertCircle,
  Phone,
  ShieldCheck,
  ArrowRight,
  Smartphone,
  Calendar,
  Users,
  Wrench,
} from "lucide-react"

interface BookingSummary {
  tourTitle: string
  bookingDate: string
  guestCount: number
  totalPrice: number
  currency?: string
}

interface MPesaCheckoutProps {
  bookingId: string
  amount: number
  currency?: string
  email: string
  prefillPhone?: string
  bookingSummary?: BookingSummary
  onSuccess?: (paymentId: string) => void
  onError?: (err: string) => void
  className?: string
}

function formatKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254")) {
    const local = digits.slice(3, 12)
    if (local.length <= 3) return `+254 ${local}`
    if (local.length <= 6) return `+254 ${local.slice(0, 3)} ${local.slice(3)}`
    return `+254 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  if (digits.startsWith("0")) {
    const local = digits.slice(1, 10)
    if (local.length <= 3) return `0${local}`
    if (local.length <= 6) return `0${local.slice(0, 3)} ${local.slice(3)}`
    return `0${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`
  }
  return raw
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("254") && digits.length === 12) return digits
  if (digits.startsWith("0") && digits.length === 10) return "254" + digits.slice(1)
  if (digits.length === 9) return "254" + digits
  return digits
}

function isValidKenyanPhone(raw: string): boolean {
  const normalized = normalizePhone(raw)
  return /^2547\d{8}$/.test(normalized) || /^2541\d{8}$/.test(normalized)
}

export function MPesaCheckout({
  bookingId,
  amount,
  currency = "KES",
  prefillPhone = "",
  bookingSummary,
  onError,
  className = "",
}: MPesaCheckoutProps) {
  const [phone, setPhone] = useState(prefillPhone ? formatKenyanPhone(prefillPhone) : "")
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handlePhoneInput(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatKenyanPhone(e.target.value)
    setPhone(formatted)
    setPhoneError(null)
  }

  async function handlePay() {
    if (!isValidKenyanPhone(phone)) {
      setPhoneError("Please enter a valid Kenyan phone number (e.g. 0712 345 678).")
      return
    }

    setLoading(true)
    setErrorMessage(null)

    try {
      const { supabase } = await import("@/lib/supabase")
      const { data, error: fnError } = await supabase.functions.invoke("inta-pay-init", {
        body: {
          amount,
          currency,
          email: "guest@ausaguide.com",
          phone: normalizePhone(phone),
          api_ref: bookingId,
          booking_id: bookingId,
        },
      })

      if (fnError) {
        throw new Error(fnError.message || "Failed to initialize payment session.")
      }

      const paymentUrl = data?.checkout_url || data?.url
      if (!paymentUrl) {
        throw new Error("Payment checkout URL was not returned by the payment gateway.")
      }

      window.location.href = paymentUrl
    } catch (err: any) {
      console.error("[MPesaCheckout] Payment error:", err)
      const msg = err?.message || "Could not initiate payment. Please try again."
      setErrorMessage(msg)
      setLoading(false)
      onError?.(msg)
    }
  }

  const paymentsEnabled = arePaymentsEnabled()

  if (!paymentsEnabled) {
    return (
      <div
        className={cn(
          "relative mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl border border-[#F97316]/30 bg-card p-6 sm:p-8 text-center shadow-xl",
          className
        )}
      >
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
          <Wrench className="size-6" />
        </div>
        <div className="mt-4 space-y-2 max-w-md mx-auto">
          <h3 className="text-base font-bold text-foreground">Payment System Under Maintenance</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Checkout is temporarily unavailable while we upgrade our payment system. Join the waitlist and we'll notify you the moment we're back.
          </p>
        </div>
        <div className="mt-5 flex justify-center">
          <Button asChild className="h-11 px-6 font-semibold bg-[#F97316] hover:bg-[#EA580C] text-white shadow-md gap-2">
            <Link to="/waitlist">
              Join the Waitlist &rarr;
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[500px] overflow-hidden rounded-2xl border border-border bg-card shadow-xl",
        className
      )}
    >
      {/* Header */}
      <div className="relative border-b border-border/60 bg-muted/20 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-green-500/15 text-green-500">
              <Smartphone className="size-5" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide text-foreground">M-PESA & Card Checkout</p>
              <p className="text-[11px] text-muted-foreground">Powered by IntaSend</p>
            </div>
          </div>
          <div className="rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-right">
            <span className="text-[11px] font-medium uppercase tracking-wider text-primary/70">{currency}</span>
            <p className="text-base font-bold leading-none text-primary">{amount.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 space-y-5">
        {bookingSummary && (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Booking Summary</p>
            <div className="flex justify-between font-medium">
              <span>{bookingSummary.tourTitle}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Calendar className="size-3 text-primary" /> {bookingSummary.bookingDate}</span>
              <span className="flex items-center gap-1.5"><Users className="size-3 text-primary" /> {bookingSummary.guestCount} guest{bookingSummary.guestCount !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Phone input */}
        <div className="space-y-1.5">
          <Label htmlFor="mpesa-phone" className="text-sm text-foreground">
            M-PESA Phone Number
          </Label>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="mpesa-phone"
              type="tel"
              value={phone}
              onChange={handlePhoneInput}
              placeholder="0712 345 678"
              maxLength={16}
              className={cn(
                "h-11 rounded-xl pl-10 text-foreground focus-visible:ring-primary/50",
                phoneError && "border-destructive focus-visible:ring-destructive"
              )}
            />
          </div>
          {phoneError ? (
            <p className="flex items-center gap-1.5 text-[11px] text-destructive">
              <AlertCircle className="size-3" /> {phoneError}
            </p>
          ) : (
            <p className="text-[11px] text-muted-foreground">
              Enter phone number to receive instant M-PESA STK Push prompt.
            </p>
          )}
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Pay button */}
        <button
          onClick={handlePay}
          disabled={loading}
          className="group relative w-full overflow-hidden rounded-xl py-3.5 text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all duration-200 disabled:opacity-50"
        >
          <span className="flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Spinner className="size-4" /> Redirecting to Payment...
              </>
            ) : (
              <>
                Pay {currency} {amount.toLocaleString()} Now
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </span>
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" />
          <span>256-bit SSL · Powered by IntaSend</span>
        </div>
      </div>
    </div>
  )
}
