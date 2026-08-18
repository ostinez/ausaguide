// ============================================================
// IntaSend PCI-DSS Verified Trust Badge
// ============================================================

export default function IntaSendTrustBadge({ className }: { className?: string }) {
  return (
    <div className={`text-center my-4 p-2 ${className || ""}`}>
      <a href="https://intasend.com/security" target="_blank" rel="noopener noreferrer">
        <img
          src="https://intasend-prod-static.s3.amazonaws.com/img/trust-badges/intasend-trust-badge-v-light.png"
          width="375"
          alt="IntaSend Secure Payments (PCI-DSS Compliant)"
          className="mx-auto max-w-[280px] w-full rounded-lg shadow-sm"
        />
      </a>
      <strong>
        <a
          href="https://intasend.com/security"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[#454545] dark:text-muted-foreground text-xs mt-2 no-underline hover:underline transition-all"
        >
          Secured by IntaSend Payments (PCI-DSS Compliant)
        </a>
      </strong>
    </div>
  )
}
