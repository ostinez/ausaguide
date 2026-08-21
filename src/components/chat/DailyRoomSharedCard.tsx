import { useState } from "react"
import { Video, Copy, Check, ExternalLink, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface DailyRoomSharedCardProps {
  roomUrl: string
  sharedByName?: string
  createdAt?: string
  isMe?: boolean
  onJoinCall?: (url: string) => void
}

export default function DailyRoomSharedCard({
  roomUrl,
  sharedByName,
  createdAt,
  isMe,
  onJoinCall,
}: DailyRoomSharedCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl)
    setCopied(true)
    toast.success("Video call link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex justify-center my-3 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="w-full max-w-sm rounded-2xl border border-blue-500/30 bg-gradient-to-b from-blue-500/10 via-card to-card overflow-hidden shadow-lg shadow-blue-500/5">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-blue-500/15 border-b border-blue-500/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 ring-2 ring-blue-500/20 animate-pulse">
              <Video className="size-4 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  Live Video Room
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 text-[10px] font-bold">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  Ready
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isMe ? "You started a video call" : `${sharedByName || "Host"} invited you to a video call`}
                {createdAt && ` • ${new Date(createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3.5">
          <p className="text-xs text-foreground/90 leading-relaxed font-medium">
            Join the live face-to-face video room to discuss tour inclusions, custom stops, timing, and details.
          </p>

          <div className="flex items-center gap-2">
            {onJoinCall ? (
              <Button
                type="button"
                onClick={() => onJoinCall(roomUrl)}
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-600/20 transition-transform active:scale-98 cursor-pointer"
              >
                <Video className="size-4" />
                <span>Join Video Meeting</span>
                <Sparkles className="size-3.5 opacity-80 ml-auto" />
              </Button>
            ) : (
              <Button
                asChild
                className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs gap-2 shadow-md shadow-blue-600/20 transition-transform active:scale-98"
              >
                <a href={roomUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="size-4" />
                  <span>Join Video Meeting</span>
                  <ExternalLink className="size-3.5 opacity-70 ml-auto" />
                </a>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              className="size-10 rounded-xl border-blue-500/30 text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 shrink-0"
              title="Copy Room Link"
            >
              {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
            </Button>
          </div>

          <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/50">
            <span className="flex items-center gap-1">
              <Sparkles className="size-3 text-amber-500" /> HD Video & Audio
            </span>
            <span>No download needed</span>
          </div>
        </div>
      </div>
    </div>
  )
}
