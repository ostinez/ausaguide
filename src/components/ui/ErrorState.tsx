import { AlertCircle, RefreshCw, Mail, HelpCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface ErrorStateProps {
  title?: string
  message?: string
  bookingId?: string | null
  onRetry?: () => void
  onBack?: () => void
  showSupportButton?: boolean
  className?: string
  compact?: boolean
}

export function ErrorState({
  title = "Something went wrong",
  message = "An unexpected error occurred while processing your request. Please try again or contact our support team.",
  bookingId,
  onRetry,
  onBack,
  showSupportButton = true,
  className,
  compact = false,
}: ErrorStateProps) {
  const supportSubject = `Support Request: [${bookingId || "Booking"}]`
  const supportBody = `Hi Ausaguide Support Team,

I encountered an issue with my booking on Ausaguide:
- Booking Reference: ${bookingId || "N/A"}
- Description of issue: 

Thank you!`

  const supportMailto = `mailto:welcome@ausaguide.com?subject=${encodeURIComponent(
    supportSubject
  )}&body=${encodeURIComponent(supportBody)}`

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-foreground space-y-3",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <h4 className="font-semibold text-foreground">{title}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">{message}</p>
            {bookingId && (
              <p className="text-[11px] font-mono text-muted-foreground mt-1">
                Ref: <span className="text-foreground">{bookingId}</span>
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {onRetry && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="h-8 rounded-lg text-xs gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Try Again
            </Button>
          )}
          {showSupportButton && (
            <a href={supportMailto} className="inline-block">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
              >
                <Mail className="size-3.5" />
                Contact Support
              </Button>
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/70 bg-card/95 p-6 md:p-8 text-center shadow-lg backdrop-blur-sm max-w-lg mx-auto my-6",
        className
      )}
    >
      {/* Decorative background glow */}
      <div className="pointer-events-none absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-destructive/10 blur-3xl" />

      {/* Icon badge */}
      <div className="relative mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/15 ring-8 ring-destructive/5 text-destructive">
        <AlertCircle className="size-7" />
      </div>

      <h3 className="text-xl font-bold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
        {message}
      </p>

      {bookingId && (
        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/60 bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground font-mono">
          <HelpCircle className="size-3.5 text-primary" />
          <span>Booking ID: <strong className="text-foreground font-semibold">{bookingId}</strong></span>
        </div>
      )}

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        {onRetry && (
          <Button
            type="button"
            onClick={onRetry}
            className="rounded-full px-5 py-2 text-sm font-semibold shadow-sm gap-2"
          >
            <RefreshCw className="size-4" />
            Try Again
          </Button>
        )}

        {onBack && (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="rounded-full px-5 py-2 text-sm font-semibold gap-2"
          >
            <ArrowLeft className="size-4" />
            Go Back
          </Button>
        )}

        {showSupportButton && (
          <a
            href={supportMailto}
            className="inline-block"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              type="button"
              variant={onRetry ? "outline" : "default"}
              className="rounded-full px-5 py-2 text-sm font-semibold gap-2 border-primary/40 hover:bg-primary/10 text-primary"
            >
              <Mail className="size-4" />
              Contact Support
            </Button>
          </a>
        )}
      </div>

      <p className="mt-4 text-[11px] text-muted-foreground">
        Need urgent assistance? Email us anytime at{" "}
        <a
          href={supportMailto}
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
        >
          welcome@ausaguide.com
        </a>
      </p>
    </div>
  )
}

export default ErrorState
