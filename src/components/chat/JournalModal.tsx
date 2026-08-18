import { useState, useEffect } from "react"
import { BookOpen, X, Sparkles, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { 
  saveTravelJournal, 
  fetchJournalByBookingId 
} from "@/lib/api/travel-journal"

interface JournalModalProps {
  isOpen: boolean
  onClose: () => void
  bookingId?: string | null
  tourId?: string | null
  tourTitle?: string
  hostName?: string
  currentUserId?: string | null
}

export function JournalModal({
  isOpen,
  onClose,
  bookingId,
  tourId,
  tourTitle,
  hostName,
  currentUserId,
}: JournalModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tipsText, setTipsText] = useState("")
  const [existingJournalId, setExistingJournalId] = useState<string | undefined>(undefined)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return

    const defaultTitle = tourTitle 
      ? `Notes: ${tourTitle}` 
      : hostName 
      ? `Notes from call with ${hostName}` 
      : "Reconnaissance Travel Notes"

    setTitle(defaultTitle)
    setContent("")
    setTipsText("")
    setExistingJournalId(undefined)

    if (bookingId) {
      setLoading(true)
      fetchJournalByBookingId(bookingId)
        .then((j) => {
          if (j) {
            setExistingJournalId(j.id)
            setTitle(j.title)
            setContent(j.content || "")
            setTipsText((j.tips || []).join("\n"))
          }
        })
        .finally(() => setLoading(false))
    }
  }, [isOpen, bookingId, tourTitle, hostName])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error("Please provide a title for your travel notes.")
      return
    }

    setSaving(true)
    try {
      const tipsArray = tipsText
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)

      await saveTravelJournal({
        id: existingJournalId,
        user_id: currentUserId || undefined,
        booking_id: bookingId || null,
        tour_id: tourId || null,
        title: title.trim(),
        content: content.trim(),
        tips: tipsArray,
      })

      toast.success("Travel notes saved to your private journal!")
      onClose()
    } catch (err: any) {
      console.error("Failed to save journal:", err)
      toast.error(err.message || "Failed to save journal notes.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border/80 text-foreground p-6 sm:p-7 rounded-3xl shadow-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <div className="size-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <BookOpen className="size-4" />
              </div>
              <span>Travel Journal & Host Notes</span>
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Save key takeaways, safety advice, and insider recommendations from your host. Private to you.
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4 pt-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="journal-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Title
              </Label>
              <Input
                id="journal-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Nairobi Walk: Safety & Food Spots"
                className="bg-muted/50 border-border rounded-xl text-sm font-semibold"
                required
              />
            </div>

            {/* Notes content */}
            <div className="space-y-1.5">
              <Label htmlFor="journal-notes" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Notes & Observations
              </Label>
              <textarea
                id="journal-notes"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="What did you learn about this place? What should you remember before visiting?"
                className="w-full rounded-2xl border border-border bg-muted/50 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none leading-relaxed"
              />
            </div>

            {/* Host tips */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="journal-tips" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3 text-amber-400" />
                  Tips from Host (One tip per line)
                </Label>
              </div>
              <textarea
                id="journal-tips"
                value={tipsText}
                onChange={(e) => setTipsText(e.target.value)}
                rows={3}
                placeholder={"• Take Uber/Bolt instead of unmarked street cabs at night\n• Best local coffee spot is at Artisan Block B\n• Carry small KES notes for local craft vendors"}
                className="w-full rounded-2xl border border-border bg-muted/50 p-3 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none font-mono text-[12px] leading-relaxed"
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-3 border-t border-border/50">
              <Button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full font-bold gap-2 py-3 bg-gradient-to-r from-[#0D6F73] to-purple-600 hover:from-[#095255] hover:to-purple-700 text-white shadow-lg min-h-[44px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Saving Notes...</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="size-4" />
                    <span>{existingJournalId ? "Update Travel Notes" : "Save to Journal"}</span>
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={saving}
                className="rounded-full px-5 min-h-[44px]"
              >
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
