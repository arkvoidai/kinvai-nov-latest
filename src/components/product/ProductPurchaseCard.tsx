import { type MouseEvent, type RefObject } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  Download,
  FolderCheck,
  Heart,
  Infinity as InfinityIcon,
  Plus,
  ShieldCheck,
} from 'lucide-react';
import { getProductDescription } from '../../lib/data/format';
import type { Collection, Product, RatingStats } from '../../lib/data/types';
import { useReducedMotion } from '../../lib/motion';
import { resolvePurchaseState } from '../../lib/product/productHelpers';
import { Accordion, Button, IconButton, PriceTag, RatingStars, TagPill } from '../primitives';

export interface ProductPurchaseCardProps {
  product: Product;
  collection: Collection | null;
  ratingStats: RatingStats | null;
  isPreviewData: boolean;
  owned: boolean;
  inCart: boolean;
  saved: boolean;
  justAdded: boolean;
  isDesktop: boolean;
  purchaseAnchorRef?: RefObject<HTMLDivElement | null>;
  onAddToCart: (e: MouseEvent<HTMLButtonElement>) => void;
  onBuyNow: () => void;
  onGoToCheckout: () => void;
  onOpenCart: () => void;
  onToggleSave: () => void;
}

/**
 * Animated 600ms drawn check SVG shown when "Add to cart" morphs to "Added".
 */
function DrawnCheckIcon() {
  const reduced = useReducedMotion();
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className="text-success shrink-0"
    >
      <motion.path
        d="M4.2 10.6L8.2 14.5L16 6.2"
        stroke="currentColor"
        strokeWidth="2.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0.4 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.48, ease: [0.2, 0.7, 0.2, 1] }}
      />
    </svg>
  );
}

const ASSURANCE_ROWS = [
  {
    id: 'instant',
    title: 'Instant download',
    detail: 'Files unlock in your account library right after confirmation.',
    Icon: Download,
  },
  {
    id: 'lifetime',
    title: 'Yours for life',
    detail: '1 licence per product. Re-download anytime without expiry.',
    Icon: InfinityIcon,
  },
  {
    id: 'secure',
    title: 'Secure checkout',
    detail: 'Server-verified USD totals and protected payment handoffs.',
    Icon: ShieldCheck,
  },
] as const;

/**
 * Sticky purchase module inspired by Wink (desktop) and Mobile Shop App (phone).
 * Handles all 4 states: not-owned, in-cart, owned, and preview (seed mode).
 */
export function ProductPurchaseCard({
  product,
  collection,
  ratingStats,
  isPreviewData,
  owned,
  inCart,
  saved,
  justAdded,
  isDesktop,
  purchaseAnchorRef,
  onAddToCart,
  onBuyNow,
  onGoToCheckout,
  onOpenCart,
  onToggleSave,
}: ProductPurchaseCardProps) {
  const purchaseState = resolvePurchaseState({
    isPreviewData,
    isOwned: owned,
    isInCart: inCart,
  });
  const description = getProductDescription(product);
  const showRating = Boolean(ratingStats && ratingStats.review_count > 0);

  return (
    <div className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-5 sm:p-7 xl:p-8 flex flex-col gap-5">
      {/* Top pill strip */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {collection && <TagPill>{collection.name}</TagPill>}
          {product.status === 'archived' && (
            <TagPill tone="warning">Archived · in your library</TagPill>
          )}
          {purchaseState === 'preview' && <TagPill tone="warning">Preview data</TagPill>}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 tabular-nums">
          {product.sku}
        </span>
      </div>

      {/* Title, tagline, conditional rating summary */}
      <div className="flex flex-col gap-2">
        <h1 className="type-h2 lg:text-[clamp(1.85rem,2.5vw,2.5rem)] lg:leading-[1.1] font-semibold text-ink tracking-[-0.028em]">
          {product.name}
        </h1>
        {product.tagline && (
          <p className="type-body text-ink-2 leading-relaxed">{product.tagline}</p>
        )}
        {showRating && ratingStats && (
          <div className="pt-1">
            <RatingStars
              rating={ratingStats.avg_rating}
              count={ratingStats.review_count}
              pill
            />
          </div>
        )}
      </div>

      {/* Large monospaced price */}
      <div className="flex items-baseline justify-between gap-3 pt-1 border-t border-line">
        <div className="flex items-baseline gap-2.5 pt-3">
          <PriceTag cents={product.price_cents} size="lg" className="text-[28px] sm:text-[32px]" />
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
            USD · 1 licence
          </span>
        </div>
        {product.version && (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 pt-3">
            v{product.version}
          </span>
        )}
      </div>

      {/* Format chips */}
      {product.file_formats.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="type-label text-ink-2">Included formats</span>
          <div className="flex flex-wrap gap-2">
            {product.file_formats.map((fmt) => (
              <span
                key={fmt}
                className="inline-flex items-center min-h-[34px] px-3.5 rounded-full bg-page border border-line font-mono text-xs uppercase tracking-[0.06em] font-medium text-ink"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Requirements line */}
      {product.requirements && (
        <p className="text-sm text-ink-2 leading-relaxed">
          <span className="font-medium text-ink">Requires: </span>
          {product.requirements}
        </p>
      )}

      {/* Purchase action cluster (observed on mobile to trigger MobileStickyBuyBar) */}
      <div ref={purchaseAnchorRef} className="flex flex-col gap-3 pt-1" data-purchase-state={purchaseState}>
        {purchaseState === 'owned' ? (
          <div className="flex flex-col gap-3">
            <div className="rounded-[24px] bg-success-bg border border-success/20 px-4 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-full bg-surface text-success inline-flex items-center justify-center shrink-0">
                <FolderCheck size={18} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Already in your library</p>
                <p className="text-xs text-ink-2">
                  Your licence is active. Re-download anytime from your account.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="lg"
              fullWidth
              to="/account"
              icon={<Download size={18} strokeWidth={1.75} aria-hidden="true" />}
            >
              Download from your library
            </Button>
          </div>
        ) : (
          <>
            {/* Row above dark price bar: Add to cart + round Heart */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                disabled={purchaseState === 'preview'}
                onClick={
                  purchaseState === 'in-cart' && !justAdded
                    ? onOpenCart
                    : onAddToCart
                }
                data-added={justAdded ? 'true' : 'false'}
                className={`flex-1 min-h-[48px] px-5 rounded-full border font-medium text-sm sm:text-[15px] inline-flex items-center justify-center gap-2 transition-colors duration-200 cursor-pointer kv-press disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                  justAdded
                    ? 'bg-success-bg border-success/35 text-ink'
                    : purchaseState === 'in-cart'
                      ? 'bg-stone border-ink/20 text-ink hover:border-ink'
                      : 'bg-surface border-line-strong text-ink hover:border-ink'
                }`}
              >
                {purchaseState === 'preview' ? (
                  <span>Preview data</span>
                ) : justAdded ? (
                  <>
                    <DrawnCheckIcon />
                    <span>Added</span>
                  </>
                ) : purchaseState === 'in-cart' ? (
                  <>
                    <Check size={17} strokeWidth={2.2} className="text-success shrink-0" aria-hidden="true" />
                    <span>In cart</span>
                  </>
                ) : (
                  <>
                    <Plus size={17} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                    <span>Add to cart</span>
                  </>
                )}
              </button>

              <IconButton
                label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                icon={
                  <Heart
                    size={19}
                    strokeWidth={1.75}
                    className={saved ? 'fill-brand text-brand' : ''}
                  />
                }
                size="lg"
                onClick={onToggleSave}
                className="shrink-0"
              />
            </div>

            {/* Wink-inspired Dark Ink Price Bar: Price left, white Buy now pill with arrow right */}
            <div className="rounded-[24px] bg-ink text-ink-on-dark p-3 pl-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-on-dark-muted leading-none">
                  {purchaseState === 'preview' ? 'Preview data' : '1 licence · lifetime'}
                </span>
                <PriceTag
                  cents={product.price_cents}
                  size="lg"
                  inverted
                  className="mt-1 block"
                />
              </div>

              {purchaseState === 'in-cart' ? (
                <button
                  type="button"
                  onClick={onGoToCheckout}
                  className="min-h-[46px] px-5 rounded-full bg-surface text-ink font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-page transition-colors cursor-pointer kv-press shrink-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                >
                  <span>Go to checkout</span>
                  <ArrowRight size={17} strokeWidth={1.85} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={purchaseState === 'preview'}
                  onClick={onBuyNow}
                  className="min-h-[46px] px-5 rounded-full bg-surface text-ink font-medium text-sm inline-flex items-center justify-center gap-2 hover:bg-page transition-colors cursor-pointer kv-press shrink-0 disabled:opacity-55 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                >
                  <span>{purchaseState === 'preview' ? 'Preview data' : 'Buy now'}</span>
                  <ArrowRight size={17} strokeWidth={1.85} aria-hidden="true" />
                </button>
              )}
            </div>

            {purchaseState === 'preview' && (
              <p className="text-xs text-ink-2 leading-relaxed">
                Preview data — checkout and downloads open once live products are published in
                Supabase.
              </p>
            )}
          </>
        )}
      </div>

      {/* Mobile compact description accordion (Mobile Shop App pattern) */}
      {!isDesktop && description && (
        <div className="pt-1">
          <Accordion
            defaultOpenIds={['about']}
            items={[
              {
                id: 'about',
                title: 'About this system',
                content: <p>{description}</p>,
              },
            ]}
          />
        </div>
      )}

      {/* Desktop overview prose */}
      {isDesktop && description && (
        <p className="text-[15px] text-ink-2 leading-relaxed pt-1 border-t border-line pt-4">
          {description}
        </p>
      )}

      {/* Three Wink-inspired Assurance rows with round icon badges */}
      <div className="pt-4 border-t border-line flex flex-col gap-3">
        {ASSURANCE_ROWS.map(({ id, title, detail, Icon }) => (
          <div key={id} className="flex items-start gap-3">
            <span className="w-9 h-9 rounded-full bg-ink text-ink-on-dark inline-flex items-center justify-center shrink-0 mt-0.5">
              <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink leading-snug">{title}</p>
              <p className="text-xs text-ink-2 leading-relaxed mt-0.5">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
