import { useState } from "react"
import { ShieldCheck, CreditCard, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { initializePaystackPayment } from "@/lib/paystack"

interface PaystackCheckoutProps {
  amount: number // In main currency units e.g. 100 KES/USD
  currency?: string
  email: string
  bookingId: string
  guestName?: string
  tourTitle?: string
  paystackPublicKey?: string
  onSuccess?: (reference: string) => void
  onCancel?: () => void
  onRedirectFallback?: (authorizationUrl: string) => void
  disabled?: boolean
  className?: string
}

export function PaystackCheckout({
  amount,
  currency = "KES",
  email,
  bookingId,
  guestName,
  tourTitle,
  paystackPublicKey,
  onSuccess,
  onCancel,
  onRedirectFallback: _onRedirectFallback,
  disabled = false,
  className = "",
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const publicKey = paystackPublicKey || import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"

  async function handlePayment() {
    if (!email) {
      setError("Email address is required for payment")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Amount in lowest subunit (e.g., cents/kobo = amount * 100)
      const amountSubunit = Math.round(amount * 100)
      const reference = `BK_${bookingId.slice(0, 8)}_${Date.now()}`

      const success = await initializePaystackPayment({
        key: publicKey,
        email,
        amount: amountSubunit,
        currency: currency.toUpperCase(),
        ref: reference,
        metadata: {
          booking_id: bookingId,
          guest_name: guestName,
          tour_title: tourTitle,
          custom_fields: [
            {
              display_name: "Booking Reference",
              variable_name: "booking_id",
              value: bookingId,
            },
          ],
        },
        callback: (response) => {
          setLoading(false)
          if (response.status === "success" || response.message === "Approved") {
            onSuccess?.(response.reference)
          } else {
            setError(`Payment status: ${response.message || response.status}`)
          }
        },
        onClose: () => {
          setLoading(false)
          onCancel?.()
        },
      })

      if (!success) {
        throw new Error("Unable to launch Paystack inline popup. Check your internet connection.")
      }
    } catch (err: any) {
      console.error("Paystack Checkout Error:", err)
      setError(err?.message || "Failed to initialize Paystack checkout")
      setLoading(false)
    }
  }

  return (
    <div className={`space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm ${className}`}>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="size-5 text-primary" />
          <h3 className="font-semibold text-foreground">Paystack Secure Checkout</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Lock className="size-3.5 text-emerald-500" />
          <span>256-Bit Encrypted</span>
        </div>
      </div>

      <div className="space-y-2 py-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Amount</span>
          <span className="font-bold text-foreground">
            {currency.toUpperCase()} {amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Payment Gateway</span>
          <span className="font-medium text-foreground">Paystack (Cards, Mobile Money, Bank Transfer)</span>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
          {error}
        </div>
      )}

      <Button
        onClick={handlePayment}
        disabled={disabled || loading}
        className="w-full gap-2 font-semibold shadow-md"
        size="lg"
      >
        {loading ? (
          <>
            <Spinner className="size-4" />
            Connecting to Paystack…
          </>
        ) : (
          <>
            <span>Pay {currency.toUpperCase()} {amount.toLocaleString()} with Paystack</span>
            <ArrowRight className="size-4" />
          </>
        )}
      </Button>

      <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-muted-foreground">
        <ShieldCheck className="size-3.5 text-emerald-500" />
        <span>Protected by Paystack Payment Gateway</span>
      </div>
    </div>
  )
}
