import { ShieldCheck, Lock } from "lucide-react"
import { arePaymentsEnabled } from "@/lib/payments-config"

interface IntaSendTrustBadgeProps {
  className?: string
  variant?: "compact" | "full"
}

export default function IntaSendTrustBadge({
  className = "",
  variant = "full",
}: IntaSendTrustBadgeProps) {
  if (!arePaymentsEnabled()) {
    return null
  }

  if (variant === "compact") {
    return (
      <div className={`text-center space-y-2 ${className}`}>
        <a
          href="https://intasend.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block transition-transform hover:scale-[1.02]"
          title="IntaSend Secure Payments (PCI-DSS Compliant)"
        >
          {/* Dark mode badge */}
          <img
            src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-dark.png"
            alt="IntaSend Secure Payments (PCI-DSS Compliant)"
            className="hidden dark:block w-full max-w-[280px] sm:max-w-[320px] mx-auto object-contain drop-shadow-sm"
            loading="lazy"
          />
          {/* Light mode badge */}
          <img
            src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-light.png"
            alt="IntaSend Secure Payments (PCI-DSS Compliant)"
            className="block dark:hidden w-full max-w-[280px] sm:max-w-[320px] mx-auto object-contain drop-shadow-sm"
            loading="lazy"
          />
        </a>
        <strong>
          <a
            href="https://intasend.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="block text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            Secured by IntaSend Payments
          </a>
        </strong>
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:p-5 text-center shadow-sm backdrop-blur-sm space-y-3 ${className}`}
    >
      <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-primary">
        <ShieldCheck className="size-4 text-primary" />
        <span>256-Bit SSL Encrypted & PCI-DSS Compliant</span>
      </div>

      <a
        href="https://intasend.com/security"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block transition-transform hover:scale-[1.01]"
        title="IntaSend Secure Payments (PCI-DSS Compliant)"
      >
        {/* Dark mode badge */}
        <img
          src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-dark.png"
          alt="IntaSend Secure Payments (PCI-DSS Compliant)"
          className="hidden dark:block w-full max-w-[320px] sm:max-w-[375px] mx-auto object-contain drop-shadow-md"
          loading="lazy"
        />
        {/* Light mode badge */}
        <img
          src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-light.png"
          alt="IntaSend Secure Payments (PCI-DSS Compliant)"
          className="block dark:hidden w-full max-w-[320px] sm:max-w-[375px] mx-auto object-contain drop-shadow-md"
          loading="lazy"
        />
      </a>

      <div>
        <strong>
          <a
            href="https://intasend.com/security"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <Lock className="size-3" />
            <span>Secured by IntaSend Payments</span>
          </a>
        </strong>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Official Payment Gateway for M-PESA & Card Transactions
        </p>
      </div>
    </div>
  )
}
