import { useState } from "react"
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { JournalModal } from "./JournalModal"

interface JournalButtonProps {
  bookingId?: string | null
  tourId?: string | null
  tourTitle?: string
  hostName?: string
  currentUserId?: string | null
  variant?: "outline" | "ghost" | "default"
  className?: string
  showText?: boolean
}

export function JournalButton({
  bookingId,
  tourId,
  tourTitle,
  hostName,
  currentUserId,
  variant = "ghost",
  className = "",
  showText = true,
}: JournalButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button
        variant={variant}
        size={showText ? "sm" : "icon"}
        onClick={() => setIsOpen(true)}
        className={`rounded-full gap-1.5 font-semibold text-xs transition-colors min-h-[36px] ${
          variant === "ghost" ? "hover:bg-blue-500/10 hover:text-blue-400 text-muted-foreground" : ""
        } ${className}`}
        title="Save Travel Notes & Tips"
      >
        <BookOpen className="size-4 text-blue-400 shrink-0" />
        {showText && <span className="hidden md:inline">Save Notes</span>}
      </Button>

      <JournalModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        bookingId={bookingId}
        tourId={tourId}
        tourTitle={tourTitle}
        hostName={hostName}
        currentUserId={currentUserId}
      />
    </>
  )
}
