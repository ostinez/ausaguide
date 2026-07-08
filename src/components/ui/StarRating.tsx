import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number; // value between 0 and 5 (including halves)
  onChange?: (rating: number) => void;
  readOnly?: boolean;
  size?: number; // pixel size for the star icon
}

export function StarRating({ rating, onChange, readOnly = false, size = 20 }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const displayRating = hoverRating ?? rating;

  const handleClick = (value: number) => {
    if (readOnly || !onChange) return;
    onChange(value);
  };

  const stars = [];
  for (let i = 0; i < 5; i++) {
    const starValue = i + 1;
    const halfValue = i + 0.5;
    const isFull = displayRating >= starValue;
    const isHalf = displayRating >= halfValue && displayRating < starValue;
    const fill = isFull ? 'fill-current text-amber-400' : isHalf ? 'text-amber-200' : 'text-muted-foreground';
    stars.push(
      <button
        key={i}
        type="button"
        disabled={readOnly}
        onMouseEnter={() => setHoverRating(starValue)}
        onMouseLeave={() => setHoverRating(null)}
        onClick={() => handleClick(starValue)}
        className="p-0.5"
      >
        <Star className={`size-${size} ${fill}`} />
      </button>
    );
    // render half star overlay if needed (simple approach: use same icon with half opacity)
    if (!readOnly && !isFull) {
      stars.push(
        <button
          key={`half-${i}`}
          type="button"
          disabled={readOnly}
          onMouseEnter={() => setHoverRating(halfValue)}
          onMouseLeave={() => setHoverRating(null)}
          onClick={() => handleClick(halfValue)}
          className="-ml-4 p-0.5"
        >
          <Star className={`size-${size} ${isHalf ? 'fill-current text-amber-400' : 'text-muted-foreground'}`} />
        </button>
      );
    }
  }

  return <div className="flex items-center space-x-0.5">{stars}</div>;
}
