import { useState } from "react"
import { CheckCircle2, Printer, ShieldCheck, Calendar, Clock, User, Award } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ServiceCompletedReceiptProps {
  receipt: {
    booking_id?: string
    tour_name: string
    host_name?: string
    traveler_name?: string
    date?: string
    time?: string
    guests?: number
    amount?: number
    currency?: string
    completed_at?: string
  }
}

export function ServiceCompletedReceiptCard({ receipt }: ServiceCompletedReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false)

  const handlePrint = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 150)
  }

  const invoiceNo = `AG-INV-${(receipt.booking_id || "TOUR").slice(0, 8).toUpperCase()}`
  const formattedDate = receipt.date
    ? new Date(receipt.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    : "Completed"

  return (
    <div className="flex justify-center my-4 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-md rounded-2xl border-2 border-emerald-500/30 bg-card overflow-hidden shadow-xl">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500/15 via-emerald-500/10 to-transparent border-b border-emerald-500/20">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="size-4" />
            <span>Service Done · Official Invoice</span>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground font-semibold px-2 py-0.5 rounded-md bg-muted border border-border">
            {invoiceNo}
          </span>
        </div>

        {/* Receipt Content */}
        <div className="p-4 space-y-3.5 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Experience</span>
            <h4 className="font-extrabold text-foreground text-sm leading-snug mt-0.5">
              {receipt.tour_name}
            </h4>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-xl border border-border/60">
            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <User className="size-2.5 text-primary" />
                <span>Traveler</span>
              </span>
              <p className="font-semibold text-foreground truncate">{receipt.traveler_name || "Guest"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Award className="size-2.5 text-primary" />
                <span>Host</span>
              </span>
              <p className="font-semibold text-foreground truncate">{receipt.host_name || "Certified Host"}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Calendar className="size-2.5 text-primary" />
                <span>Date</span>
              </span>
              <p className="font-semibold text-foreground truncate">{formattedDate}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="size-2.5 text-primary" />
                <span>Status</span>
              </span>
              <p className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="size-3" />
                <span>Paid & Verified</span>
              </p>
            </div>

            <div className="col-span-2 pt-2 border-t border-border flex items-center justify-between font-bold text-foreground">
              <span>Total Amount Paid</span>
              <span className="text-emerald-600 dark:text-emerald-400 text-sm font-black">
                {receipt.currency || "KES"} {(receipt.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Thank You Note */}
          <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-center">
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              🙏 Thank you for choosing Ausaguide! We hope you enjoyed your virtual experience.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 h-9 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 font-bold text-xs gap-1.5 cursor-pointer shadow-xs"
            >
              <Printer className="size-3.5" />
              <span>Print / Download PDF</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceCompletedReceiptCard
