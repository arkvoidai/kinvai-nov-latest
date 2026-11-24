import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import type { Product, Review } from '../../lib/data/types';
import { SplitHeadline } from '../../lib/motion';
import { Carousel, TagPill } from '../primitives';

export interface HomeFeedbackSectionProps {
  reviews: Review[];
  productsById: Map<string, Product>;
}

/**
 * Section 11 — Feedback:
 * Testimonial carousel strictly backed by approved reviews from Supabase.
 * Renders NOTHING when there are no approved reviews (never fabricates testimonials).
 */
export function HomeFeedbackSection({ reviews, productsById }: HomeFeedbackSectionProps) {
  const approved = reviews.filter((r) => r.status === 'approved' && (r.body || r.title));
  if (approved.length === 0) return null;

  const slides = approved.map((review, idx) => {
    const product = productsById.get(review.product_id);
    const dateLabel = review.created_at
      ? new Date(review.created_at).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        })
      : null;

    return (
      <article
        key={review.id ?? `${review.user_id}-${review.product_id}-${idx}`}
        className="rounded-[28px] bg-surface border border-line p-6 sm:p-7 flex flex-col justify-between gap-5 h-full min-h-[240px]"
      >
        <div className="flex items-center justify-between gap-3">
          <div
            className="inline-flex items-center gap-1.5"
            aria-label={`Rated ${review.rating} out of 5`}
          >
            <span className="inline-flex items-center gap-0.5" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={15}
                  strokeWidth={1.75}
                  className={n <= review.rating ? 'text-ink fill-ink' : 'text-line-strong'}
                />
              ))}
            </span>
            <span className="font-mono text-xs font-medium text-ink tabular-nums">
              {review.rating}.0
            </span>
          </div>
          {dateLabel && (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-3">
              {dateLabel}
            </span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {review.title && (
            <h3 className="text-base font-semibold text-ink leading-snug">{review.title}</h3>
          )}
          {review.body && (
            <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed line-clamp-5">
              &ldquo;{review.body}&rdquo;
            </p>
          )}
        </div>

        <div className="pt-4 border-t border-line flex items-center justify-between gap-2">
          <TagPill>Verified buyer</TagPill>
          {product && (
            <Link
              to={`/products/${product.slug}`}
              viewTransition
              className="text-xs font-medium text-ink hover:text-brand-deep underline underline-offset-4 truncate max-w-[180px]"
            >
              {product.name}
            </Link>
          )}
        </div>
      </article>
    );
  });

  return (
    <section aria-labelledby="home-feedback-heading" className="flex flex-col gap-6">
      <div>
        <span className="type-label text-ink-2">Verified feedback</span>
        <SplitHeadline
          id="home-feedback-heading"
          as="h2"
          immediate={false}
          text="From people who *bought it.*"
          className="type-h2 font-semibold text-ink mt-1.5"
        />
      </div>

      <Carousel
        items={slides}
        ariaLabel="Verified buyer reviews"
        showSlidePill
        slidePillLabel="Next review"
        itemClassName="w-[88%] sm:w-[68%] md:w-[48%] lg:w-[32%]"
      />
    </section>
  );
}
