import { ShieldCheck, Lock } from "lucide-react"
import { arePaymentsEnabled } from "@/lib/payments-config"

export default function IntaSendTrustBadge({ className }: { className?: string }) {
  if (!arePaymentsEnabled()) {
    return null
  }

  return (
    <div className={`text-center my-3 p-3 rounded-xl border border-primary/20 bg-primary/5 ${className || ""}`}>
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
        <ShieldCheck className="size-4" />
        <span>256-Bit SSL Encrypted Payment</span>
      </div>
      <p className="text-[11px] text-muted-foreground mt-1 flex items-center justify-center gap-1">
        <Lock className="size-3" />
        <span>PCI-DSS Compliant & Protected Checkout</span>
      </p>
    </div>
  )
}
