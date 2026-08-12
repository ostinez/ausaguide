import { cn } from "@/lib/utils"

interface Step {
  label: string
}

interface CheckoutStepperProps {
  steps: Step[]
  current: number // 1-indexed
}

export function CheckoutStepper({ steps, current }: CheckoutStepperProps) {
  return (
    <div className="flex items-center gap-0 w-full mb-8">
      {steps.map((step, i) => {
        const idx = i + 1
        const done = idx < current
        const active = idx === current

        return (
          <div key={step.label} className="flex items-center flex-1 last:flex-none">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex items-center justify-center size-9 rounded-full border-2 text-sm font-bold transition-all duration-300",
                  done && "bg-primary border-primary text-white shadow-[0_0_12px_rgba(127,90,240,0.5)]",
                  active && "border-primary text-primary bg-primary/10 shadow-[0_0_16px_rgba(127,90,240,0.4)]",
                  !done && !active && "border-border text-muted-foreground bg-background"
                )}
              >
                {done ? (
                  <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={3}>
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <span>{idx}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[11px] font-semibold whitespace-nowrap transition-colors",
                  active && "text-primary",
                  done && "text-primary/70",
                  !done && !active && "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {i < steps.length - 1 && (
              <div className="flex-1 h-[2px] mx-2 mt-[-14px] rounded-full overflow-hidden bg-border">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    done ? "bg-primary w-full" : "w-0"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
