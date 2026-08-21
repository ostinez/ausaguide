import { useState, useEffect } from "react"
import {
  PhoneOff,
  Minimize2,
  Maximize2,
  ShieldCheck,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface DailyCallOverlayProps {
  isOpen: boolean
  roomUrl: string
  callerName?: string
  tourName?: string | null
  onEndCall: () => void
  isHost?: boolean
}

export function DailyCallOverlay({
  isOpen,
  roomUrl,
  callerName = "Live Video Meeting",
  tourName,
  onEndCall,
  isHost = false,
}: DailyCallOverlayProps) {
  const [isMinimized, setIsMinimized] = useState<boolean>(false)
  const [durationSeconds, setDurationSeconds] = useState<number>(0)

  useEffect(() => {
    if (!isOpen) {
      setDurationSeconds(0)
      setIsMinimized(false)
      return
    }

    const timer = setInterval(() => {
      setDurationSeconds((s) => s + 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen])

  if (!isOpen || !roomUrl) return null

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <div
      className={cn(
        "fixed z-50 transition-all duration-300 ease-out flex flex-col shadow-2xl overflow-hidden bg-black/95",
        isMinimized
          ? "bottom-4 right-4 w-80 h-56 rounded-2xl border-2 border-primary/40"
          : "inset-0 md:inset-4 md:rounded-3xl border border-border"
      )}
    >
      {/* ─── Top Control Header ─── */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-card/90 backdrop-blur-md border-b border-border/60 text-foreground shrink-0 select-none">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-xs sm:text-sm text-foreground truncate max-w-[150px] sm:max-w-xs">
                {tourName || callerName}
              </span>
              {isHost ? (
                <span className="text-[10px] bg-primary/10 text-primary font-semibold px-1.5 py-0.2 rounded-full border border-primary/20 shrink-0">
                  Host View
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Clock className="size-2.5 text-primary" />
                <span>{formatDuration(durationSeconds)}</span>
              </span>
              <span className="hidden sm:inline text-border">·</span>
              <span className="hidden sm:flex items-center gap-1 text-emerald-500 font-semibold">
                <ShieldCheck className="size-2.5" />
                Encrypted HD
              </span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized((v) => !v)}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            title={isMinimized ? "Expand video call" : "Minimize to Picture-in-Picture"}
          >
            {isMinimized ? <Maximize2 className="size-3.5" /> : <Minimize2 className="size-3.5" />}
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onEndCall}
            className="h-8 px-3 rounded-full font-bold text-xs gap-1.5 bg-rose-600 hover:bg-rose-700 text-white shadow-md cursor-pointer transition-transform active:scale-95"
            title="Leave and End Call"
          >
            <PhoneOff className="size-3.5" />
            <span>Leave Call</span>
          </Button>
        </div>
      </div>

      {/* ─── Embedded Video Call Area ─── */}
      <div className="relative flex-1 min-h-0 w-full bg-black">
        <iframe
          src={roomUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; ambient-light-sensor"
          className="w-full h-full border-0"
          title="Ausaguide Live Video Tour Room"
        />
      </div>
    </div>
  )
}

export default DailyCallOverlay
