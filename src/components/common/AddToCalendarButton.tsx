import { useState } from "react"
import { Calendar, ExternalLink, Download, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getGoogleCalendarUrl, downloadIcsFile, type CalendarEventDetails } from "@/lib/calendar"

interface AddToCalendarButtonProps {
  event: CalendarEventDetails
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AddToCalendarButton({
  event,
  variant = "outline",
  size = "sm",
  className = "",
}: AddToCalendarButtonProps) {
  const [open, setOpen] = useState(false)
  const [added, setAdded] = useState(false)

  const googleUrl = getGoogleCalendarUrl(event)

  const handleDownloadIcs = () => {
    downloadIcsFile(event, `${event.title.replace(/\s+/g, "-").toLowerCase()}.ics`)
    setAdded(true)
    setTimeout(() => setAdded(false), 2500)
    setOpen(false)
  }

  return (
    <div className="relative inline-block text-left">
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => setOpen(!open)}
        className={`gap-1.5 font-semibold cursor-pointer rounded-xl border-border text-foreground hover:bg-muted ${className}`}
      >
        {added ? (
          <>
            <Check className="size-3.5 text-emerald-500" />
            <span>Added!</span>
          </>
        ) : (
          <>
            <Calendar className="size-3.5 text-primary" />
            <span>Add to Calendar</span>
          </>
        )}
      </Button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 mt-1.5 w-52 rounded-xl bg-card border border-border shadow-xl z-50 p-1.5 space-y-1 text-xs animate-in fade-in zoom-in-95">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setAdded(true)
                setTimeout(() => setAdded(false), 2500)
                setOpen(false)
              }}
              className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">📅</span>
                <span>Google Calendar</span>
              </span>
              <ExternalLink className="size-3 text-muted-foreground" />
            </a>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted font-medium text-foreground transition-colors text-left cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span className="text-primary font-bold">🍏</span>
                <span>Apple / Phone / Outlook</span>
              </span>
              <Download className="size-3 text-muted-foreground" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

export default AddToCalendarButton
