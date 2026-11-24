import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, Star } from 'lucide-react';
import { upsertProductReview } from '../../lib/data/repository';
import type { Product, Review } from '../../lib/data/types';
import { Button, Input, Sheet, TagPill, useToast } from '../primitives';

export interface LibraryReviewSheetProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  product: Product | null;
  existingReview: Review | null;
  onReviewSaved: (productId: string, review: Review) => void;
}

/**
 * Review Sheet opened directly from owned Library cards:
 * - Rating (1–5), Title, Body.
 * - Inserts new review or updates existing review (resetting status to 'pending' -> Awaiting approval).
 * - Handles Supabase RLS & ownership rejections calmly.
 */
export function LibraryReviewSheet({
  open,
  onClose,
  userId,
  product,
  existingReview,
  onReviewSaved,
}: LibraryReviewSheetProps) {
  const { toast } = useToast();
  const isEditing = Boolean(existingReview);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setRating(existingReview?.rating ?? 5);
    setTitle(existingReview?.title ?? '');
    setBody(existingReview?.body ?? '');
    setErrorMessage(null);
    setSubmitting(false);
  }, [open, existingReview, product?.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setErrorMessage(null);

    if (!title.trim() || !body.trim()) {
      setErrorMessage('Add both a short title and your notes before submitting.');
      return;
    }

    setSubmitting(true);
    const res = await upsertProductReview({
      userId,
      productId: product.id,
      rating,
      title,
      body,
      existingReviewId: existingReview?.id ?? null,
      isEdit: isEditing,
    });
    setSubmitting(false);

    if (res.error || !res.review) {
      setErrorMessage(
        res.error || "That didn't work. Try again, or write to heyarkvoid@gmail.com."
      );
      return;
    }

    onReviewSaved(product.id, res.review);
    toast({
      title: isEditing ? 'Review updated' : 'Review submitted',
      description: 'Awaiting approval before appearing on the product page.',
      tone: 'success',
    });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit your review' : 'Write a review'}
      description={product?.name}
      widthClass="md:max-w-[500px]"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        {isEditing && (
          <div className="rounded-[18px] bg-page border border-line px-4 py-3 flex items-center justify-between gap-3">
            <span className="text-xs text-ink-2 leading-relaxed">
              Saving edits returns your review to moderation before republishing.
            </span>
            <TagPill tone="warning" className="shrink-0">
              Awaiting approval
            </TagPill>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Rating</span>
          <div
            role="radiogroup"
            aria-label="Rating out of 5 stars"
            className="flex items-center gap-1.5"
          >
            {[1, 2, 3, 4, 5].map((n) => {
              const active = n <= rating;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} ${n === 1 ? 'star' : 'stars'}`}
                  onClick={() => setRating(n)}
                  className={`w-11 h-11 rounded-full border inline-flex items-center justify-center transition-colors cursor-pointer kv-press ${
                    active
                      ? 'bg-ink border-ink text-white'
                      : 'bg-surface border-line text-ink-2 hover:border-line-strong'
                  }`}
                >
                  <Star
                    size={18}
                    strokeWidth={1.75}
                    className={active ? 'fill-white text-white' : ''}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
            <span className="font-mono text-xs text-ink-2 ml-2 tabular-nums">
              {rating} / 5
            </span>
          </div>
        </div>

        <Input
          label="Headline"
          placeholder="Short summary of how you used it"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="kv-library-review-body" className="text-sm font-medium text-ink">
            Your review
          </label>
          <textarea
            id="kv-library-review-body"
            rows={5}
            maxLength={1600}
            required
            placeholder="What saved you the most time, or what would you tell another buyer?"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-[20px] bg-surface border border-line hover:border-line-strong focus:border-ink px-4 py-3 text-base text-ink placeholder:text-ink-3 outline-none transition-colors resize-y"
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-[16px] bg-error-bg text-error px-3.5 py-2.5 text-xs leading-relaxed"
          >
            <AlertCircle size={15} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={submitting}
            className="flex-1 min-w-0"
          >
            {isEditing ? 'Save review' : 'Submit review'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            disabled={submitting}
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Sheet>
  );
}
