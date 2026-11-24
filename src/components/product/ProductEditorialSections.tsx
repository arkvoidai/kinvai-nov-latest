import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  Check,
  Download,
  FileCode2,
  FolderTree,
  Hash,
  KeyRound,
  Layers,
  Laptop,
  Scale,
} from 'lucide-react';
import { accentToBgClass } from '../../lib/data/format';
import type { Collection, Product, RatingStats, Review } from '../../lib/data/types';
import { Reveal, TileIn } from '../../lib/motion';
import {
  buildFileTreeEntries,
  formatLastUpdated,
  resolvePurchaseState,
} from '../../lib/product/productHelpers';
import { ProductCard } from '../layout/ProductCard';
import { Accordion, Button, PriceTag, TagPill } from '../primitives';
import { ProductReviewsSection } from './ProductReviewsSection';

export interface ProductEditorialSectionsProps {
  product: Product;
  collection: Collection | null;
  related: Product[];
  allCollections: Collection[];
  ratingStats: RatingStats | null;
  reviews: Review[];
  userReview: Review | null;
  isPreviewData: boolean;
  owned: boolean;
  inCart: boolean;
  onBuyNow: () => void;
  onGoToCheckout: () => void;
}

/**
 * All sections below the product purchase area.
 * Every consecutive section uses a distinct architectural composition
 * and renders strictly from real product database fields.
 */
export function ProductEditorialSections({
  product,
  collection,
  related,
  allCollections,
  ratingStats,
  reviews,
  userReview,
  isPreviewData,
  owned,
  inCart,
  onBuyNow,
  onGoToCheckout,
}: ProductEditorialSectionsProps) {
  const tintBg = accentToBgClass(collection?.accent ?? 'cocoa');
  const fileTree = buildFileTreeEntries(product);
  const lastUpdated = formatLastUpdated(product.published_at);
  const purchaseState = resolvePurchaseState({
    isPreviewData,
    isOwned: owned,
    isInCart: inCart,
  });

  const collectionsById = new Map(allCollections.map((c) => [c.id, c]));

  const detailRows: Array<{
    id: string;
    label: string;
    value: string;
    href?: string;
    Icon: typeof Hash;
  }> = [
    { id: 'sku', label: 'SKU', value: product.sku, Icon: Hash },
    ...(product.file_formats.length > 0
      ? [
          {
            id: 'formats',
            label: 'Formats',
            value: product.file_formats.join(', '),
            Icon: FileCode2,
          },
        ]
      : []),
    ...(product.version
      ? [{ id: 'version', label: 'Version', value: `v${product.version}`, Icon: Layers }]
      : []),
    ...(lastUpdated
      ? [{ id: 'updated', label: 'Last updated', value: lastUpdated, Icon: Calendar }]
      : []),
    ...(product.requirements
      ? [{ id: 'requirements', label: 'Requirements', value: product.requirements, Icon: Laptop }]
      : []),
    {
      id: 'licence',
      label: 'Licence',
      value: '1 personal or business licence · Read full terms',
      href: '/licence',
      Icon: Scale,
    },
  ];

  const deliveryItems = [
    {
      id: 'instant-unlock',
      title: 'Instant unlock after payment confirmation',
      content:
        'As soon as your payment provider confirms the transaction on the server, your order is recorded and a permanent entitlement is attached to your Kinvai account automatically.',
    },
    {
      id: 'download-account',
      title: 'Download directly from /account',
      content:
        'Open your library at /account anytime to fetch fresh, expiring signed download links for every file in this product. No third-party file portals or expiring email attachments.',
    },
    {
      id: 'redownload-anytime',
      title: 'Re-download any time, on any device',
      content:
        'Your licence never expires. Switch computers, start a fresh project, or pull an updated revision from your account library whenever you need it.',
    },
  ];

  return (
    <div className="flex flex-col gap-12 md:gap-20">
      {/* 1. WHAT'S INSIDE — 7/5 Split: 2-column checklist beside tinted file-tree tile */}
      {product.includes.length > 0 && (
        <Reveal>
          <section
            aria-labelledby="whats-inside-heading"
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
          >
            <div className="lg:col-span-7 rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-2">
                <span className="type-label text-ink-2">Package contents</span>
                <h2 id="whats-inside-heading" className="type-h2 font-semibold text-ink">
                  What&apos;s <span className="font-accent-serif font-normal">inside</span>
                </h2>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                {product.includes.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[15px] text-ink leading-snug">
                    <span className="w-6 h-6 rounded-full bg-stone text-ink inline-flex items-center justify-center shrink-0 mt-0.5">
                      <Check size={14} strokeWidth={2.25} aria-hidden="true" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div
              className={`lg:col-span-5 rounded-[28px] lg:rounded-[36px] ${tintBg} border border-ink/8 p-6 sm:p-8 flex flex-col justify-between gap-5`}
            >
              <div className="flex items-center justify-between gap-3">
                <TagPill className="bg-surface/95">File structure</TagPill>
                <span className="w-9 h-9 rounded-full bg-surface/95 border border-line text-ink inline-flex items-center justify-center shrink-0">
                  <FolderTree size={17} strokeWidth={1.75} aria-hidden="true" />
                </span>
              </div>

              <div className="rounded-[22px] bg-surface/92 border border-ink/10 p-5 font-mono text-xs leading-relaxed text-ink overflow-x-auto">
                <div className="font-semibold text-ink flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-brand shrink-0" aria-hidden="true" />
                  <span>{fileTree.rootLabel}</span>
                </div>
                <ul className="mt-3 flex flex-col gap-2 text-ink-2">
                  {fileTree.entries.map((entry, idx) => {
                    const isLast = idx === fileTree.entries.length - 1;
                    return (
                      <li key={entry} className="flex items-start gap-2">
                        <span aria-hidden="true" className="text-ink-3 shrink-0 select-none">
                          {isLast ? '└─' : '├─'}
                        </span>
                        <span className="text-ink break-words">{entry}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {product.file_formats.length > 0 && (
                <div className="flex items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.06em] text-ink/80">
                  <span>{product.includes.length} components</span>
                  <span>{product.file_formats.join(' · ')}</span>
                </div>
              )}
            </div>
          </section>
        </Reveal>
      )}

      {/* 2. MADE FOR — Stone-colored tile with architectural notched corner */}
      {product.audience.length > 0 && (
        <Reveal>
          <section
            aria-labelledby="made-for-heading"
            className="relative rounded-[28px] lg:rounded-[36px] bg-stone kv-notched-corner p-6 sm:p-8 lg:p-12 border border-line"
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
              <div className="lg:col-span-4 flex flex-col gap-2.5 pr-8">
                <span className="type-label text-ink-2">Built around real workflows</span>
                <h2 id="made-for-heading" className="type-h2 font-semibold text-ink">
                  Made <span className="font-accent-serif font-normal">for</span>
                </h2>
              </div>

              <ul className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {product.audience.map((persona, idx) => (
                  <li
                    key={persona}
                    className="rounded-[22px] bg-surface border border-line p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 tabular-nums">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                    </div>
                    <p className="text-base font-medium text-ink leading-snug">{persona}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </Reveal>
      )}

      {/* 3. YOUR FIRST HOUR — Numbered editorial steps (strictly omitted when empty) */}
      {product.first_hour.length > 0 && (
        <Reveal>
          <section aria-labelledby="first-hour-heading" className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="type-label text-ink-2">Start at step two</span>
                <h2 id="first-hour-heading" className="type-h2 font-semibold text-ink">
                  Your first <span className="font-accent-serif font-normal">hour</span>
                </h2>
              </div>
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums">
                {product.first_hour.length} concrete steps
              </span>
            </div>

            <ol className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {product.first_hour.map((step, idx) => (
                <TileIn key={step} index={idx} className="h-full">
                  <li className="h-full rounded-[28px] bg-surface border border-line p-6 sm:p-7 flex flex-col justify-between gap-5">
                    <div className="flex items-center justify-between pb-4 border-b border-line">
                      <span className="font-mono text-2xl font-medium text-ink tabular-nums tracking-[-0.03em]">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                        Step {idx + 1}
                      </span>
                    </div>
                    <p className="text-base text-ink leading-relaxed">{step}</p>
                  </li>
                </TileIn>
              ))}
            </ol>
          </section>
        </Reveal>
      )}

      {/* 4. DETAILS — Wink-inspired specification grid with round icon badges */}
      <Reveal>
        <section
          aria-labelledby="product-details-heading"
          className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-10 flex flex-col gap-6"
        >
          <div className="flex flex-col gap-1.5">
            <span className="type-label text-ink-2">Specifications</span>
            <h2 id="product-details-heading" className="type-h2 font-semibold text-ink">
              Details
            </h2>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {detailRows.map(({ id, label, value, href, Icon }) => (
              <div
                key={id}
                className="rounded-[22px] bg-page border border-line p-4 sm:p-5 flex items-start gap-3.5"
              >
                <span className="w-10 h-10 rounded-full bg-ink text-ink-on-dark inline-flex items-center justify-center shrink-0">
                  <Icon size={17} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex flex-col gap-1">
                  <dt className="type-label text-ink-2">{label}</dt>
                  <dd className="text-sm font-medium text-ink leading-snug break-words">
                    {href ? (
                      <Link
                        to={href}
                        viewTransition
                        className="text-brand-deep underline underline-offset-4 hover:opacity-80"
                      >
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              </div>
            ))}
          </dl>
        </section>
      </Reveal>

      {/* 5. REVIEWS */}
      <Reveal>
        <ProductReviewsSection
          productId={product.id}
          productName={product.name}
          ratingStats={ratingStats}
          approvedReviews={reviews}
          initialUserReview={userReview}
          owned={owned}
          isPreviewData={isPreviewData}
        />
      </Reveal>

      {/* 6. DELIVERY ACCORDION — Asymmetric 4/8 split */}
      <Reveal>
        <section
          aria-labelledby="delivery-heading"
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start rounded-[28px] lg:rounded-[36px] bg-stone/70 border border-line p-6 sm:p-8 lg:p-10"
        >
          <div className="lg:col-span-4 flex flex-col gap-3">
            <span className="w-11 h-11 rounded-full bg-surface border border-line text-ink inline-flex items-center justify-center">
              <KeyRound size={19} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <span className="type-label text-ink-2 mt-1">After checkout</span>
            <h2 id="delivery-heading" className="type-h2 font-semibold text-ink">
              How delivery <span className="font-accent-serif font-normal">works</span>
            </h2>
            <p className="text-sm text-ink-2 leading-relaxed">
              Every product is a downloadable digital archive tied directly to your Kinvai account.
            </p>
          </div>

          <div className="lg:col-span-8 rounded-[24px] bg-surface border border-line px-5 sm:px-7 py-2">
            <Accordion items={deliveryItems} defaultOpenIds={['instant-unlock']} />
          </div>
        </section>
      </Reveal>

      {/* 7. PAIRS WELL WITH — Horizontal rail on phones, 4-col grid on desktop */}
      {related.length > 0 && (
        <Reveal>
          <section aria-labelledby="pairs-well-heading" className="flex flex-col gap-6">
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <span className="type-label text-ink-2">From the shelf</span>
                <h2 id="pairs-well-heading" className="type-h2 font-semibold text-ink">
                  Pairs well <span className="font-accent-serif font-normal">with</span>
                </h2>
              </div>
              {collection && (
                <Button variant="secondary" size="sm" to={`/collections/${collection.slug}`}>
                  All {collection.name}
                </Button>
              )}
            </div>

            {/* Phone horizontal rail; desktop 4-column grid */}
            <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto md:overflow-visible kv-scroll-snap -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
              {related.map((rel) => {
                const relCol = rel.collection_id
                  ? collectionsById.get(rel.collection_id) ?? collection
                  : collection;
                return (
                  <div
                    key={rel.id}
                    className="w-[78vw] max-w-[290px] sm:w-[270px] md:w-auto md:max-w-none shrink-0 snap-start"
                  >
                    <ProductCard
                      product={rel}
                      collection={relCol}
                      isPreviewData={isPreviewData}
                      enableViewTransition={false}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </Reveal>
      )}

      {/* 8. FINAL CTA BAND — Inverted dark ink band */}
      <Reveal>
        <section
          aria-label="Final purchase call to action"
          className="rounded-[28px] lg:rounded-[36px] bg-ink text-ink-on-dark p-7 sm:p-10 lg:p-14 flex flex-col lg:flex-row lg:items-center justify-between gap-6"
        >
          <div className="flex flex-col gap-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand shrink-0" aria-hidden="true" />
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-on-dark-muted">
                {collection ? collection.name : 'Kinvai'} · {product.sku}
              </span>
            </div>
            <h2 className="type-h2 font-semibold text-ink-on-dark">
              Start at step two with {product.name}.
            </h2>
            <p className="type-body text-ink-on-dark-muted">
              1 licence per product. Instant download from your library, yours for life.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <PriceTag cents={product.price_cents} size="lg" inverted className="mr-2 text-[28px]" />

            {purchaseState === 'owned' ? (
              <Button
                variant="primary"
                inverted
                size="lg"
                to="/account"
                icon={<Download size={18} strokeWidth={1.75} aria-hidden="true" />}
              >
                Download from your library
              </Button>
            ) : purchaseState === 'in-cart' ? (
              <Button variant="primary" inverted size="lg" onClick={onGoToCheckout}>
                <span>Go to checkout</span>
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Button>
            ) : purchaseState === 'preview' ? (
              <Button variant="primary" inverted size="lg" disabled>
                Preview data
              </Button>
            ) : (
              <Button variant="primary" inverted size="lg" onClick={onBuyNow}>
                <span>Buy now</span>
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </Button>
            )}
          </div>
        </section>
      </Reveal>
    </div>
  );
}
