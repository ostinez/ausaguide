import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ThumbsUp, Flag, ChevronDown, ChevronUp, Star, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardAction } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import {
  getVisibleReviewsByHost,
  getVisibleReviewsByTour,
  likeReview,
  complainReview,
} from '@/lib/api/reviews';
import type { Review } from '@/lib/api/reviews';
import ReviewForm from '@/components/ui/ReviewForm';

interface ReviewListProps {
  hostId?: string;
  tourId?: string;
  pageSize?: number;
  bookingId?: string;
  bookingStatus?: string;
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'fill-muted text-muted-foreground/40'
          }`}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-amber-400">{rating.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({
  review,
  onLike,
  onComplain,
}: {
  review: Review;
  onLike: (id: string) => void;
  onComplain: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = (review.comment ?? '').length > 160;
  const displayComment = expanded || !isLong
    ? (review.comment ?? '')
    : (review.comment ?? '').slice(0, 160) + '…';
  const name = review.traveler_name || 'Anonymous';
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="group relative flex items-start gap-4 rounded-2xl border border-border/50 bg-card/60 p-4 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-md hover:shadow-primary/5">
      {/* Left accent bar */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-full bg-gradient-to-b from-primary/60 to-teal/30 opacity-0 transition-opacity group-hover:opacity-100" />

      <Avatar className="size-10 shrink-0 ring-2 ring-border/50 ring-offset-1 ring-offset-background">
        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-teal/20 text-sm font-bold text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1 space-y-1.5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">{name}</span>
            <StarDisplay rating={review.rating} />
          </div>
          <span className="text-[10px] text-muted-foreground/70">
            {format(new Date(review.created_at), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Comment */}
        {review.comment && (
          <div className="space-y-1">
            <p className="text-sm leading-relaxed text-muted-foreground">{displayComment}</p>
            {isLong && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
              >
                {expanded ? (
                  <><ChevronUp className="size-3" /> Show less</>
                ) : (
                  <><ChevronDown className="size-3" /> Show more</>
                )}
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          <button
            onClick={() => onLike(review.id)}
            className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95"
          >
            <ThumbsUp className="size-3" />
            {review.likes ?? 0}
          </button>
          <button
            onClick={() => onComplain(review.id)}
            className="flex items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive active:scale-95"
          >
            <Flag className="size-3" />
            {review.complaints ?? 0}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ReviewList({ hostId, tourId, pageSize = 5, bookingId, bookingStatus }: ReviewListProps) {
  if (!hostId && !tourId) return null;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchReviews = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const result = hostId
        ? await getVisibleReviewsByHost(hostId, p, pageSize)
        : await getVisibleReviewsByTour(tourId!, p, pageSize);
      setReviews((prev) => (p === 1 ? result.reviews : [...prev, ...result.reviews]));
      setTotal(result.total ?? 0);
      setPage(p);
    } catch (e) {
      console.error('Failed to load reviews', e);
    } finally {
      setLoading(false);
    }
  }, [hostId, tourId, pageSize]);

  useEffect(() => {
    fetchReviews(1);
  }, [fetchReviews]);

  const handleLike = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, likes: (r.likes ?? 0) + 1 } : r)));
    likeReview(id).catch(() => {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, likes: (r.likes ?? 1) - 1 } : r)));
    });
  };

  const handleComplain = (id: string) => {
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, complaints: (r.complaints ?? 0) + 1 } : r)));
    complainReview(id).catch(() => {
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, complaints: (r.complaints ?? 1) - 1 } : r)));
    });
  };

  const canLoadMore = reviews.length < total;

  return (
    <Card className="mt-8 border-border/60 bg-gradient-to-b from-card to-card/60 shadow-lg">
      <CardHeader className="border-b border-border/30 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="size-4 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              Reviews
            </h2>
            <p className="text-xs text-muted-foreground">
              {total > 0 ? `${total} traveller review${total !== 1 ? 's' : ''}` : 'No reviews yet'}
            </p>
          </div>
        </div>
        {bookingId && (
          <CardAction>
            <ReviewForm bookingId={bookingId} bookingStatus={bookingStatus} onSuccess={() => fetchReviews(1)} />
          </CardAction>
        )}
      </CardHeader>

      <CardContent className="pt-4">
        {reviews.length === 0 && !loading && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-full bg-muted/40">
              <Star className="size-7 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">No reviews yet</p>
            <p className="text-xs text-muted-foreground/60">Be the first to share your experience</p>
          </div>
        )}

        <div className="space-y-3">
          {reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onLike={handleLike}
              onComplain={handleComplain}
            />
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-6">
            <Spinner className="size-6 text-primary" />
          </div>
        )}

        {canLoadMore && !loading && (
          <div className="flex justify-center pt-6">
            <Button
              variant="outline"
              onClick={() => fetchReviews(page + 1)}
              className="rounded-full border-primary/30 text-primary hover:bg-primary/10"
            >
              <ChevronDown className="mr-1.5 size-4" />
              Show more reviews
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
