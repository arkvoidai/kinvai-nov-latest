import { Star } from 'lucide-react';

export interface RatingStarsProps {
  rating?: number | null;
  count?: number | null;
  pill?: boolean;
  className?: string;
}

/**
 * Renders verified rating stars. Per Charter rule 6 & Task 3:
 * renders NOTHING (null) when no real rating data exists.
 */
export function RatingStars({ rating, count, pill = false, className = '' }: RatingStarsProps) {
  if (
    typeof rating !== 'number' ||
    typeof count !== 'number' ||
    !Number.isFinite(rating) ||
    count <= 0
  ) {
    return null;
  }

  const clamped = Math.max(0, Math.min(5, rating));
  const roundedStars = Math.round(clamped);

  return (
    <div
      className={`inline-flex items-center gap-1.5 ${
        pill ? 'rounded-full bg-surface border border-line px-3 py-1' : ''
      } ${className}`}
      aria-label={`Rated ${clamped.toFixed(1)} out of 5 based on ${count} ${
        count === 1 ? 'review' : 'reviews'
      }`}
    >
      <span className="inline-flex items-center gap-0.5" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            size={14}
            strokeWidth={1.75}
            className={n <= roundedStars ? 'fill-ink text-ink' : 'text-line-strong'}
          />
        ))}
      </span>
      <span className="font-mono text-xs font-medium text-ink tabular-nums">
        {clamped.toFixed(1)}
      </span>
      <span className="font-mono text-xs text-ink-2 tabular-nums">({count})</span>
    </div>
  );
}
