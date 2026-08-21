import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Star, Sparkles, CheckCircle2, Heart } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

interface PostCallReviewModalProps {
  isOpen: boolean
  onClose: () => void
  hostName: string
  hostId: string
  tourName?: string | null
  tourId?: string | null
  bookingId?: string | null
  currentUserId: string
  onReviewSubmitted?: () => void
}

const RATING_LABELS = ["", "Needs Improvement", "Fair", "Good", "Great Experience", "Exceptional! 🌟"]

export function PostCallReviewModal({
  isOpen,
  onClose,
  hostName,
  hostId,
  tourName,
  tourId,
  bookingId,
  currentUserId,
  onReviewSubmitted,
}: PostCallReviewModalProps) {
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [comment, setComment] = useState<string>("")
  const [hadIssues, setHadIssues] = useState<boolean>(false)
  const [issueCategory, setIssueCategory] = useState<string>("audio_video")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [submitted, setSubmitted] = useState<boolean>(false)

  const activeRating = hoverRating || rating

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rating) {
      toast.error("Please select a star rating.")
      return
    }

    setIsSubmitting(true)
    try {
      // 1. If tourId is not provided, try to resolve one or a general host review
      let resolvedTourId = tourId
      let resolvedBookingId = bookingId

      if (!resolvedTourId && bookingId) {
        const { data: bData } = await supabase
          .from("bookings")
          .select("tour_id, id")
          .eq("id", bookingId)
          .maybeSingle()
        if (bData) {
          resolvedTourId = bData.tour_id
          resolvedBookingId = bData.id
        }
      }

      // If still no tourId, fetch host's first tour as fallback
      if (!resolvedTourId && hostId) {
        const { data: tData } = await supabase
          .from("tours")
          .select("id")
          .eq("host_id", hostId)
          .limit(1)
          .maybeSingle()
        if (tData) resolvedTourId = tData.id
      }

      if (resolvedTourId) {
        const { error } = await supabase.from("reviews").insert({
          user_id: currentUserId,
          host_id: hostId,
          tour_id: resolvedTourId,
          booking_id: resolvedBookingId || undefined,
          rating,
          comment: comment.trim() ? (hadIssues ? `[⚠️ Issue Reported: ${issueCategory}] ${comment.trim()}` : comment.trim()) : (hadIssues ? `[⚠️ Issue Reported: ${issueCategory}]` : null),
          status: hadIssues ? "hidden" : "visible",
        })

        if (error) {
          // If foreign key constraint on booking_id, retry without booking_id
          if (error.code === "23503" || error.message.includes("booking")) {
            await supabase.from("reviews").insert({
              user_id: currentUserId,
              host_id: hostId,
              tour_id: resolvedTourId,
              rating,
              comment: comment.trim() || null,
              status: hadIssues ? "hidden" : "visible",
            })
          }
        }
      }

      // If traveler reported issues, notify support/admin
      if (hadIssues && currentUserId) {
        try {
          await supabase.from("notifications").insert({
            user_id: currentUserId,
            title: "⚠️ Tour Issue Flagged for Review",
            message: `You reported an issue (${issueCategory}) for ${tourName || "your tour"}. Support will investigate before payment release.`,
            type: "dispute_reported",
            booking_id: resolvedBookingId || null,
            read: false,
          })
        } catch (_) {}
      }

      setSubmitted(true)
      toast.success(hadIssues ? "Feedback & issue logged. Support is reviewing." : "Thank you for reviewing your host!")
      if (onReviewSubmitted) onReviewSubmitted()
      setTimeout(() => {
        onClose()
        setSubmitted(false)
        setComment("")
        setHadIssues(false)
      }, 2000)
    } catch (err: any) {
      console.error("Failed to submit post-call review:", err)
      toast.error(err.message || "Failed to submit review. Thank you for your feedback!")
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[92vw] bg-card border-border rounded-3xl p-6 sm:p-8 text-foreground shadow-2xl animate-in zoom-in-95 duration-200">
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-3 animate-in fade-in">
            <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center ring-4 ring-emerald-500/10">
              <CheckCircle2 className="size-9" />
            </div>
            <h3 className="text-xl font-bold text-foreground">Review Submitted!</h3>
            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              Your feedback helps {hostName} and fellow travelers discover authentic Kenyan journeys.
            </p>
          </div>
        ) : (
          <>
            <DialogHeader className="text-center space-y-2 pb-2">
              <div className="size-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto mb-1">
                <Sparkles className="size-6 text-primary" />
              </div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                How was your call with {hostName.split(" ")[0]}?
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {tourName
                  ? `Leave a quick review for "${tourName}" to support local Kenyan creators.`
                  : `Your feedback helps verified hosts grow and rewards great hospitality.`}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 pt-1">
              {/* Star Rating Picker */}
              <div className="flex flex-col items-center gap-2 py-4 px-4 bg-muted/40 rounded-2xl border border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                  Select Rating
                </span>
                <div className="flex items-center gap-1.5 py-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(star)}
                      className="p-1 rounded-lg hover:scale-115 transition-transform active:scale-95 focus:outline-none cursor-pointer"
                      aria-label={`Rate ${star} star`}
                    >
                      <Star
                        className={`size-8 transition-colors duration-150 ${
                          star <= activeRating
                            ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]"
                            : "fill-muted text-muted-foreground/30 hover:text-muted-foreground/60"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-bold text-amber-500 h-4">
                  {RATING_LABELS[activeRating]}
                </p>
              </div>

              {/* Review Text */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Share your thoughts (Optional)</span>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {comment.length}/500
                  </span>
                </label>
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder={`Tell us what you liked most about ${hostName.split(" ")[0]}'s insights, recommendations, or virtual tour preview…`}
                  rows={3}
                  className="rounded-xl resize-none text-xs bg-muted/60 border-border placeholder:text-muted-foreground focus:ring-primary"
                />
              </div>

              {/* Issue / Complication Verification */}
              <div className="p-3 bg-muted/30 rounded-2xl border border-border/50 space-y-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={hadIssues}
                    onChange={(e) => setHadIssues(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary size-4"
                  />
                  <span>Did you experience any technical or tour issues?</span>
                </label>

                {hadIssues && (
                  <div className="pt-2 space-y-1.5 animate-in fade-in">
                    <label className="text-[11px] font-semibold text-muted-foreground">Select Issue Type:</label>
                    <select
                      value={issueCategory}
                      onChange={(e) => setIssueCategory(e.target.value)}
                      className="w-full h-8 text-xs rounded-lg bg-background border border-border px-2 text-foreground focus:ring-primary"
                    >
                      <option value="audio_video">Audio / Video connection issues</option>
                      <option value="host_no_show">Host was late or did not show up</option>
                      <option value="incomplete_itinerary">Tour was cut short / incomplete itinerary</option>
                      <option value="other">Other issue</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="flex-1 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground h-10"
                >
                  Maybe Later
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !rating}
                  className="flex-1 rounded-full bg-primary text-primary-foreground font-bold text-xs shadow-md hover:bg-primary/90 h-10 gap-1.5"
                >
                  <Heart className="size-3.5 fill-current" />
                  <span>{isSubmitting ? "Submitting…" : "Submit Review"}</span>
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

export default PostCallReviewModal
