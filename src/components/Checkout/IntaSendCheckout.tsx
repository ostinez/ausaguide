import { useState } from "react"
import { Link } from "react-router-dom"
import { ShieldCheck, Lock, ArrowRight, CheckCircle2, AlertCircle, CreditCard, Smartphone, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"
import { arePaymentsEnabled } from "@/lib/payments-config"

interface IntaSendCheckoutProps {
  amount: number
  currency?: string
  email: string
  phone: string
  firstName?: string
  lastName?: string
  bookingId: string
  onSuccess?: (invoiceId: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  className?: string
}

export function IntaSendCheckout({
  amount,
  currency = "KES",
  email,
  phone,
  firstName,
  lastName,
  bookingId,
  onError,
  disabled = false,
  className = "",
}: IntaSendCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)

  async function handlePayNow() {
    setLoading(true)
    setError(null)

    try {
      const { data, error: fnError } = await import("@/lib/supabase").then(({ supabase }) =>
        supabase.functions.invoke("inta-pay-init", {
          body: {
            amount,
            currency,
            email,
            phone: phone ? phone.trim().replace(/\D/g, "") : "",
            first_name: firstName || email.split("@")[0],
            last_name: lastName || "",
            api_ref: bookingId,
            booking_id: bookingId,
            bookingId: bookingId,
          },
        })
      )

      let checkoutUrl = data?.checkout_url || data?.url
      let detailedMsg: string | null = null

      if (fnError) {
        try {
          if ((fnError as any).context && typeof (fnError as any).context.json === "function") {
            const errJson = await (fnError as any).context.json()
            detailedMsg = errJson?.error || errJson?.message || (Array.isArray(errJson?.errors) ? errJson.errors[0]?.detail : null)
          }
        } catch (_) {}
        if (!detailedMsg) detailedMsg = fnError.message
      }

      // Fallback to /api/create-checkout
      if (!checkoutUrl) {
        try {
          const res = await fetch("/api/create-checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount,
              currency,
              email,
              phone,
              first_name: firstName || email.split("@")[0],
              last_name: lastName || "",
              api_ref: bookingId,
              booking_id: bookingId,
            }),
          })
          const vercelData = await res.json().catch(() => null)
          if (res.ok && (vercelData?.checkout_url || vercelData?.url)) {
            checkoutUrl = vercelData.checkout_url || vercelData.url
          } else if (vercelData?.error) {
            detailedMsg = vercelData.error
          }
        } catch (_) {}
      }

      if (!checkoutUrl) {
        throw new Error(detailedMsg || "Payment checkout URL was not returned by the payment gateway.")
      }

      setPaymentSuccess(true)
      window.location.href = checkoutUrl
    } catch (err: any) {
      console.error("[IntaSend Checkout Error]:", err)
      const errorMsg = err?.message || "Payment processing failed. Please try again."
      setError(errorMsg)
      onError?.(errorMsg)
      setLoading(false)
    }
  }

  const paymentsEnabled = arePaymentsEnabled()

  if (!paymentsEnabled) {
    return (
      <div className={cn("space-y-5 rounded-2xl border border-[#F97316]/30 bg-card p-6 sm:p-8 text-center shadow-sm", className)}>
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#F97316]/15 border border-[#F97316]/30 text-[#F97316]">
          <Wrench className="size-6" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <h3 className="text-base font-bold text-foreground">Payment System Under Maintenance</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Checkout is temporarily unavailable while we upgrade our payment system. Join the waitlist and we'll notify you the moment we're back.
          </p>
        </div>
        <div className="pt-2 flex justify-center">
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
    <div className={cn("space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Safe & Secure Checkout</h3>
            <p className="text-xs text-muted-foreground">M-PESA & Card Supported</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">Total Amount</span>
          <p className="text-lg font-bold text-foreground">{currency} {amount.toLocaleString()}</p>
        </div>
      </div>

      {/* Payment method icons */}
      <div className="flex items-center gap-3 rounded-xl bg-muted/30 px-4 py-3">
        <Smartphone className="size-5 text-green-500" />
        <span className="text-sm font-medium text-foreground">M-PESA Express</span>
        <div className="ml-auto flex items-center gap-2">
          <CreditCard className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Visa & Mastercard</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {paymentSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 p-3 text-xs text-green-500 font-medium">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Payment initialized! Redirecting to secure checkout...</span>
        </div>
      )}

      <Button
        type="button"
        onClick={handlePayNow}
        disabled={disabled || loading || paymentSuccess}
        className="w-full gap-2 font-medium h-12"
      >
        {loading ? (
          <>
            <Spinner className="size-4" />
            Redirecting to Checkout...
          </>
        ) : (
          <>
            <Lock className="size-4" />
            Pay Now ({currency} {amount.toLocaleString()})
            <ArrowRight className="size-4 ml-auto" />
          </>
        )}
      </Button>

      {/* IntaSend branding footer */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-primary" />
        <span>256-bit SSL · Powered by IntaSend</span>
      </div>
    </div>
  )
}
