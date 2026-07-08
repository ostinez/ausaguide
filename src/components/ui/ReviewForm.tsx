import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Star, CheckCircle2, PenLine } from 'lucide-react';
import { createReview } from '@/lib/api/reviews';
import { fetchBookingById } from '@/lib/api/bookings';
import { fetchProfileByRole } from '@/lib/api/hosts';
import { sanitizeText } from '@/lib/validation';
import type { Booking } from '@/lib/types';
import { toast } from 'sonner';

interface ReviewFormProps {
  bookingId: string;
  /** Passing these avoids an extra fetchBookingById round-trip when the caller already has the data */
  tourId?: string;
  hostId?: string;
  travelerId?: string;
  triggerClassName?: string;
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  triggerSize?: 'default' | 'sm' | 'lg' | 'icon';
  /** Guard: form only renders when this equals 'completed' */
  bookingStatus?: string;
  onSuccess?: () => void;
}

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

function StarPicker({ rating, onChange }: { rating: number; onChange: (r: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || rating;

  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4 bg-gradient-to-b from-muted/40 to-muted/10 rounded-2xl border border-border/30">
      <span className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
        How was your experience?
      </span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(i)}
            className="group p-1 transition-transform active:scale-90"
            aria-label={`Rate ${i} star${i !== 1 ? 's' : ''}`}
          >
            <Star
              className={`size-9 transition-all duration-150 ${
                i <= active
                  ? 'fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.5)]'
                  : 'fill-muted text-muted-foreground/30 group-hover:text-muted-foreground/60'
              }`}
            />
          </button>
        ))}
      </div>
      <div className={`text-sm font-semibold transition-opacity duration-200 ${active ? 'opacity-100 text-amber-400' : 'opacity-0'}`}>
        {RATING_LABELS[active]}
      </div>
    </div>
  );
}

export default function ReviewForm({
  bookingId,
  bookingStatus,
  tourId: tourIdProp,
  hostId: hostIdProp,
  travelerId: travelerIdProp,
  triggerClassName,
  triggerVariant,
  triggerSize,
  onSuccess,
}: ReviewFormProps) {
  // ── Guard: only show for completed bookings ─────────────────────────────────────
  if (bookingStatus && bookingStatus !== 'completed') return null;

  const [open, setOpen] = useState(false);
  // Booking is only fetched if tourId/hostId were NOT passed as props
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Only fetch booking details when dialog opens AND props are missing
  useEffect(() => {
    if (open && !booking && (!tourIdProp || !hostIdProp)) {
      setLoading(true);
      fetchBookingById(bookingId)
        .then(setBooking)
        .catch((e) => console.error('Failed to load booking', e))
        .finally(() => setLoading(false));
    }
  }, [open, bookingId, booking, tourIdProp, hostIdProp]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setRating(0);
        setComment('');
        setSubmitted(false);
      }, 300);
    }
  }, [open]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      // Resolve IDs — prefer props, fall back to fetched booking
      const resolvedTourId = tourIdProp ?? booking?.tour_id;
      const resolvedHostId = hostIdProp ?? booking?.host_id;

      let resolvedTravelerId =
        travelerIdProp ||
        localStorage.getItem('user_id') ||
        booking?.guest_id ||
        '';

      if (!resolvedTravelerId) {
        const traveler = await fetchProfileByRole('traveler');
        resolvedTravelerId = traveler?.id || '';
      }

      if (!resolvedTourId || !resolvedHostId) {
        throw new Error('Missing tour or host information. Please try again.');
      }
      if (!resolvedTravelerId) {
        throw new Error('Unable to identify traveler profile.');
      }

      await createReview({
        booking_id: bookingId,
        user_id: resolvedTravelerId,
        host_id: resolvedHostId,
        tour_id: resolvedTourId,
        rating,
        comment: comment.trim() ? sanitizeText(comment) : null,
        status: 'visible',
      });

      setSubmitted(true);
      toast.success('Review submitted successfully!');
      onSuccess?.();
      setTimeout(() => setOpen(false), 1800);
    } catch (e) {
      console.error('Failed to submit review', e);
      const msg = e instanceof Error ? e.message : 'Failed to submit review. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant ?? 'outline'}
          size={triggerSize ?? 'sm'}
          className={
            triggerClassName ??
            'rounded-full border-teal/40 text-teal hover:bg-teal/10 hover:border-teal/70 transition-all'
          }
        >
          <PenLine className="mr-1.5 size-3.5" />
          Leave a Review
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px] border-border/60 bg-background/98 p-0 overflow-hidden backdrop-blur-xl">
        {/* Decorative gradient header strip */}
        <div className="h-1 w-full bg-gradient-to-r from-primary via-teal to-primary/50" />

        <div className="p-6">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold">
              {submitted ? 'Review Submitted!' : 'Share Your Experience'}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {submitted
                ? 'Thank you for your feedback. It helps other travellers.'
                : booking?.tour?.title
                ? `Your review of "${booking.tour.title}"`
                : 'Tell the community what you thought of the tour.'}
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex flex-col items-center gap-3 py-10">
              <Spinner className="size-7 text-teal" />
              <p className="text-xs text-muted-foreground">Loading booking…</p>
            </div>
          ) : submitted ? (
            /* ── Success state ── */
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex size-16 items-center justify-center rounded-full bg-teal/10 ring-4 ring-teal/20">
                <CheckCircle2 className="size-9 text-teal" />
              </div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`size-6 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/20 fill-muted'}`}
                  />
                ))}
              </div>
              <p className="text-center text-sm font-medium text-foreground">
                You rated this experience <span className="text-amber-400">{rating}/5</span>
              </p>
            </div>
          ) : (
            /* ── Form state ── */
            <div className="space-y-4">
              <StarPicker rating={rating} onChange={setRating} />

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">
                  Your comments <span className="text-muted-foreground/50">(optional)</span>
                </label>
                <Textarea
                  placeholder="What did you enjoy? What could be better?"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="resize-none border-border/60 bg-muted/20 text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-teal/50 focus-visible:border-teal/40"
                />
                <p className="text-right text-[10px] text-muted-foreground/50">{comment.length}/500</p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <DialogClose asChild>
                  <Button variant="ghost" size="sm" className="rounded-full" disabled={submitting}>
                    Cancel
                  </Button>
                </DialogClose>
                <Button
                  onClick={handleSubmit}
                  disabled={rating === 0 || submitting}
                  size="sm"
                  className="rounded-full bg-gradient-to-r from-primary to-teal text-white shadow-md hover:shadow-primary/30 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Spinner className="mr-2 size-3.5 text-white" /> Submitting…</>
                  ) : (
                    'Submit Review'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
