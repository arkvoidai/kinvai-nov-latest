import { useState, type FormEvent } from 'react';
import { CheckCircle2, Clock, MessageSquareText, Star } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { submitProductReview } from '../../lib/data/repository';
import type { RatingStats, Review } from '../../lib/data/types';
import { formatLastUpdated } from '../../lib/product/productHelpers';
import { Button, Input, RatingStars, TagPill } from '../primitives';

export interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  ratingStats: RatingStats | null;
  approvedReviews: Review[];
  initialUserReview: Review | null;
  owned: boolean;
  isPreviewData: boolean;
}

/**
 * Wink-inspired customer reviews layout:
 * - Shows rating summary ONLY when product_rating_stats.review_count > 0.
 * - Shows real approved reviews only (never fabricated).
 * - Calm empty tile when no reviews exist yet.
 * - Signed-in OWNERS see a "Write a review" form with rating, title, body,
 *   graceful RLS error handling, and "Awaiting approval" state on submit.
 */
export function ProductReviewsSection({
  productId,
  productName,
  ratingStats,
  approvedReviews,
  initialUserReview,
  owned,
  isPreviewData,
}: ProductReviewsSectionProps) {
  const { user } = useAuth();
  const [userReview, setUserReview] = useState<Review | null>(initialUserReview);
  const [rating, setRating] = useState<number>(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hasSummary = Boolean(ratingStats && ratingStats.review_count > 0);
  const hasApproved = approvedReviews.length > 0;
  const canWriteReview = Boolean(user && owned && !isPreviewData && !userReview);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !owned || isPreviewData || submitting) return;

    setSubmitError(null);
    setSubmitting(true);

    const res = await submitProductReview({
      userId: user.id,
      productId,
      rating,
      title,
      body,
    });

    setSubmitting(false);

    if (res.error || !res.review) {
      setSubmitError(res.error || "That didn't work. Try again, or write to heyarkvoid@gmail.com.");
      return;
    }

    setUserReview(res.review);
    setTitle('');
    setBody('');
  };

  return (
    <section
      aria-labelledby="product-reviews-heading"
      className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-10 flex flex-col gap-6"
    >
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-line">
        <div className="flex flex-col gap-2">
          <span className="type-label text-ink-2">Verified buyers</span>
          <h2 id="product-reviews-heading" className="type-h2 font-semibold text-ink">
            Reviews{hasSummary && ratingStats ? ` (${ratingStats.review_count})` : ''}
          </h2>
        </div>

        {hasSummary && ratingStats && (
          <div className="flex items-center gap-3">
            <RatingStars
              rating={ratingStats.avg_rating}
              count={ratingStats.review_count}
              pill
            />
          </div>
        )}
      </div>

      {/* Pending / submitted user review confirmation */}
      {userReview && (
        <div className="rounded-[22px] bg-page border border-line p-5 flex flex-col gap-2.5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              {userReview.status === 'approved' ? (
                <TagPill tone="success">Published</TagPill>
              ) : (
                <TagPill tone="warning">Awaiting approval</TagPill>
              )}
              <span className="font-mono text-xs text-ink-2 tabular-nums">
                {userReview.rating}.0 / 5
              </span>
            </div>
            {userReview.status !== 'approved' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-ink-2">
                <Clock size={14} strokeWidth={1.75} aria-hidden="true" />
                <span>Your review is saved and awaiting approval.</span>
              </span>
            )}
          </div>
          {userReview.title && (
            <p className="text-base font-semibold text-ink">{userReview.title}</p>
          )}
          {userReview.body && (
            <p className="text-sm text-ink-2 leading-relaxed prose-measure">{userReview.body}</p>
          )}
        </div>
      )}

      {/* Approved reviews list OR calm empty state */}
      {hasApproved ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {approvedReviews.map((review, idx) => {
            const dateStr = formatLastUpdated(review.created_at);
            return (
              <article
                key={review.id ?? `${review.user_id}-${idx}`}
                className="rounded-[22px] bg-page border border-line p-5 flex flex-col gap-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div
                    className="inline-flex items-center gap-0.5"
                    aria-label={`Rated ${review.rating} out of 5`}
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        strokeWidth={1.75}
                        className={n <= review.rating ? 'fill-ink text-ink' : 'text-line-strong'}
                        aria-hidden="true"
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.06em] text-success">
                      <CheckCircle2 size={12} strokeWidth={2} aria-hidden="true" />
                      Verified buyer
                    </span>
                    {dateStr && (
                      <span className="font-mono text-[11px] text-ink-2 tabular-nums">
                        {dateStr}
                      </span>
                    )}
                  </div>
                </div>

                {review.title && (
                  <h3 className="text-base font-semibold text-ink leading-snug">{review.title}</h3>
                )}
                {review.body && (
                  <p className="text-sm text-ink-2 leading-relaxed prose-measure">{review.body}</p>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] bg-page border border-line p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <span className="w-11 h-11 rounded-full bg-surface border border-line text-ink inline-flex items-center justify-center shrink-0">
            <MessageSquareText size={19} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-1">
            <p className="text-base font-medium text-ink">
              Reviews appear here after buyers have used this product.
            </p>
            <p className="text-sm text-ink-2">
              Only verified owners of {productName} can submit feedback.
            </p>
          </div>
        </div>
      )}

      {/* Owner review submission form */}
      {canWriteReview && (
        <form
          onSubmit={handleSubmit}
          className="rounded-[24px] bg-stone/70 border border-line p-5 sm:p-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-1">
            <span className="type-label text-ink-2">Owner feedback</span>
            <h3 className="type-h3 font-semibold text-ink">Write a review</h3>
          </div>

          <fieldset className="flex flex-col gap-2">
            <legend className="text-xs font-medium text-ink">Rating</legend>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((value) => {
                const selected = value <= rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`Rate ${value} out of 5`}
                    aria-pressed={value === rating}
                    className="w-11 h-11 rounded-full bg-surface border border-line hover:border-ink inline-flex items-center justify-center transition-colors cursor-pointer kv-press"
                  >
                    <Star
                      size={18}
                      strokeWidth={1.75}
                      className={selected ? 'fill-ink text-ink' : 'text-ink-3'}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
              <span className="ml-2 font-mono text-xs text-ink-2 tabular-nums">{rating} / 5</span>
            </div>
          </fieldset>

          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What stood out when you put it to work?"
            maxLength={120}
            required
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="kv-review-body" className="text-xs font-medium text-ink">
              Review
            </label>
            <textarea
              id="kv-review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={1600}
              required
              placeholder="Share how you used the files and what saved you time."
              className="w-full rounded-[20px] bg-surface border border-line hover:border-line-strong focus:border-ink px-4 py-3 text-base text-ink placeholder:text-ink-3 transition-colors outline-none resize-y"
            />
          </div>

          {submitError && (
            <p role="alert" className="text-sm text-error font-medium">
              {submitError}
            </p>
          )}

          <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
            <span className="text-xs text-ink-2">
              New reviews are checked before publishing and appear as Awaiting approval.
            </span>
            <Button type="submit" variant="primary" loading={submitting}>
              Submit review
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}
