import type { MouseEvent } from 'react';
import { Link } from 'react-router-dom';
import { Check, FolderCheck, Heart, Plus } from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';
import { accentToTileVariant } from '../../lib/data/format';
import type { Collection, Product } from '../../lib/data/types';
import { getProductCoverTransitionName } from '../../lib/product/productHelpers';
import { highlightMatchSegments } from '../../lib/search/searchHelpers';
import { IconButton, PriceTag, ProductCover, Skeleton, TagPill, useToast } from '../primitives';

export type ProductCardVariant = 'standard' | 'wide' | 'compact' | 'feature';

export interface ProductCardProps {
  product: Product;
  collection?: Collection | null;
  isPreviewData?: boolean;
  variant?: ProductCardVariant;
  highlightQuery?: string;
  priority?: boolean;
  /** Enables CSS view-transition-name on the product cover (disable if the same product renders twice on one page) */
  enableViewTransition?: boolean;
  className?: string;
}

const TILE_TINT_CLASSES: Record<string, string> = {
  'tint-peach':
    'bg-peach-muted border-peach/80 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-peach',
  'tint-butter':
    'bg-butter-muted border-butter/90 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-butter',
  'tint-lilac':
    'bg-lilac-muted border-lilac/80 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-lilac',
  'tint-rose':
    'bg-rose-muted border-rose/80 [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-rose',
  stone:
    'bg-stone border-line [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:bg-stone-200/80',
};

function HighlightedText({ text, query }: { text: string; query?: string }) {
  if (!query || !query.trim()) return <>{text}</>;
  const segments = highlightMatchSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark
            key={i}
            className="bg-butter text-ink rounded-[4px] px-0.5 font-semibold"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </>
  );
}

/**
 * Shared Kinvai ProductCard across Shop, Collections, Search, Saved, and Related surfaces.
 * Supports `standard` (4:5), `wide` (16:10), `compact` (mobile search/cart/library), and `feature` (first 3 includes visible).
 * Whole card links to /products/:slug via stretched-link pattern while action buttons stay independent focusable controls.
 */
export function ProductCard({
  product,
  collection,
  isPreviewData = false,
  variant = 'standard',
  highlightQuery,
  priority = false,
  enableViewTransition = true,
  className = '',
}: ProductCardProps) {
  const {
    addToCart,
    removeFromCart,
    isInCart,
    isOwnedProduct,
    isSaved,
    toggleSaved,
    setCartOpen,
  } = useCart();
  const { toast } = useToast();

  const saved = isSaved(product.id);
  const inCart = isInCart(product.id);
  const owned = isOwnedProduct(product.id);
  const tileVariant = accentToTileVariant(collection?.accent);
  const tileClasses = TILE_TINT_CLASSES[tileVariant] ?? TILE_TINT_CLASSES.stone;

  const visibleFormats = product.file_formats.slice(0, 3);
  const extraFormatCount = Math.max(0, product.file_formats.length - 3);
  const featureIncludes = product.includes.slice(0, 3);
  const productHref = `/products/${product.slug}`;
  const coverTransitionStyle = enableViewTransition
    ? { viewTransitionName: getProductCoverTransitionName(product.slug) }
    : undefined;

  const handleSave = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const next = toggleSaved(product.id);
    toast({
      title: next ? `Saved ${product.name}` : 'Removed from saved',
      undoLabel: 'Undo',
      onUndo: () => toggleSaved(product.id),
    });
  };

  const handleAdd = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isPreviewData) {
      toast({
        title: 'Preview data only',
        description: 'Purchases open once live products are published in Supabase.',
      });
      return;
    }
    if (inCart) {
      setCartOpen(true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    addToCart(product, false, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    toast({
      title: `Added ${product.name}`,
      description: '1 licence. Yours for life.',
      tone: 'success',
      undoLabel: 'Undo',
      onUndo: () => removeFromCart(product.id),
    });
  };

  const renderActions = (compactMode = false) => (
    <div
      className={`relative z-10 flex items-center gap-2 ${
        compactMode ? 'flex-wrap' : 'w-full'
      }`}
    >
      {owned ? (
        <Link
          to="/account"
          viewTransition
          onClick={(e) => e.stopPropagation()}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-success-bg text-success border border-success/20 font-medium hover:opacity-90 transition-opacity kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
            compactMode
              ? 'min-h-[38px] px-3 text-xs'
              : 'min-h-[42px] px-3.5 text-xs sm:text-sm flex-1'
          }`}
        >
          <FolderCheck size={15} strokeWidth={1.75} aria-hidden="true" />
          <span className="truncate">In your library</span>
        </Link>
      ) : (
        <button
          type="button"
          disabled={isPreviewData}
          onClick={handleAdd}
          className={`inline-flex items-center justify-center gap-1.5 rounded-full bg-surface text-ink border border-line-strong hover:border-ink font-medium transition-colors kv-press cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
            compactMode
              ? 'min-h-[38px] px-3 text-xs'
              : 'min-h-[42px] px-3 sm:px-4 text-xs sm:text-sm flex-1'
          }`}
        >
          {inCart ? (
            <>
              <Check size={15} strokeWidth={2} className="text-success shrink-0" aria-hidden="true" />
              <span className="truncate">In cart</span>
            </>
          ) : (
            <>
              <Plus size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{isPreviewData ? 'Preview' : 'Add to cart'}</span>
            </>
          )}
        </button>
      )}

      <Link
        to={productHref}
        viewTransition
        onClick={(e) => e.stopPropagation()}
        className={`inline-flex items-center justify-center rounded-full bg-ink text-white border border-ink hover:bg-ink-soft font-medium transition-colors kv-press shrink-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
          compactMode
            ? 'min-h-[38px] px-3.5 text-xs'
            : 'min-h-[42px] px-4 sm:px-5 text-xs sm:text-sm'
        }`}
      >
        View
      </Link>
    </div>
  );

  const renderFormatChips = () => {
    if (visibleFormats.length === 0) return null;
    return (
      <div className="flex flex-wrap items-center gap-1" aria-label="Included file formats">
        {visibleFormats.map((fmt) => (
          <span
            key={fmt}
            className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface border border-line font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2"
          >
            {fmt}
          </span>
        ))}
        {extraFormatCount > 0 && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2 tabular-nums">
            +{extraFormatCount}
          </span>
        )}
      </div>
    );
  };

  /* -------------------- COMPACT VARIANT (mobile search, cart, library) -------------------- */
  if (variant === 'compact') {
    return (
      <article
        className={`group/card relative flex items-center gap-3.5 rounded-[22px] bg-surface border border-line hover:border-ink/25 p-3 transition-colors duration-200 kv-press ${className}`}
        data-variant="compact"
      >
        {/* Small collection-tinted 4:5 thumbnail */}
        <div
          className={`w-[78px] sm:w-[88px] shrink-0 rounded-[16px] border p-1.5 transition-colors duration-200 ${tileClasses}`}
        >
          <div
            className="transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-0.5"
            style={coverTransitionStyle}
          >
            <ProductCover
              product={product}
              collection={collection}
              ratio="4/5"
              size="sm"
              priority={priority}
              className="rounded-[12px]"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              {collection && (
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2 truncate">
                  {collection.name}
                </span>
              )}
              <h3 className="text-sm sm:text-[15px] font-semibold text-ink leading-snug line-clamp-2 mt-0.5">
                <Link
                  to={productHref}
                  viewTransition
                  className="inline relative after:content-[''] after:absolute after:inset-0 after:z-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-[4px]"
                >
                  <span className="relative inline">
                    <HighlightedText text={product.name} query={highlightQuery} />
                    <span
                      aria-hidden="true"
                      className="block h-[1.5px] bg-brand scale-x-0 origin-left transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-x-100"
                    />
                  </span>
                </Link>
              </h3>
            </div>

            <div className="relative z-10 shrink-0">
              <IconButton
                label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                icon={
                  <Heart
                    size={16}
                    strokeWidth={1.75}
                    className={saved ? 'fill-brand text-brand' : ''}
                  />
                }
                size="sm"
                onClick={handleSave}
              />
            </div>
          </div>

          {product.tagline && (
            <p className="text-xs text-ink-2 line-clamp-1">
              <HighlightedText text={product.tagline} query={highlightQuery} />
            </p>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <PriceTag cents={product.price_cents} size="sm" />
            {renderActions(true)}
          </div>
        </div>
      </article>
    );
  }

  /* -------------------- FEATURE VARIANT (Collection "Start with" + Hero Spotlight) -------------------- */
  if (variant === 'feature') {
    return (
      <article
        className={`group/card relative rounded-[28px] bg-surface border border-ink/10 hover:border-ink/25 p-4 sm:p-5 lg:p-6 transition-colors duration-200 kv-press shadow-[var(--shadow-float)] ${className}`}
        data-variant="feature"
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-7 items-center">
          {/* Left: Tinted 4:5 cover frame */}
          <div
            className={`md:col-span-5 relative rounded-[24px] border p-3 transition-colors duration-200 ${tileClasses}`}
          >
            <div
              className="transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-1"
              style={coverTransitionStyle}
            >
              <ProductCover
                product={product}
                collection={collection}
                ratio="4/5"
                size="md"
                overlaySafe
                priority={priority}
                className="rounded-[18px]"
              />
            </div>

            <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2 pointer-events-none">
              <div className="pointer-events-auto min-w-0 max-w-[calc(100%-48px)]">
                <TagPill className="bg-surface/95">
                  {isPreviewData ? 'Preview data' : 'Start with'}
                </TagPill>
              </div>
              <div className="pointer-events-auto relative z-10 shrink-0">
                <IconButton
                  label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                  icon={
                    <Heart
                      size={17}
                      strokeWidth={1.75}
                      className={saved ? 'fill-brand text-brand' : ''}
                    />
                  }
                  size="sm"
                  onClick={handleSave}
                  className="bg-surface/95"
                />
              </div>
            </div>
          </div>

          {/* Right: Editorial details + first 3 included items */}
          <div className="md:col-span-7 flex flex-col justify-between gap-4">
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                {collection && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                    {collection.name} · {product.sku}
                  </span>
                )}
                <PriceTag cents={product.price_cents} size="lg" />
              </div>

              <h3 className="type-h2 font-semibold text-ink leading-tight line-clamp-2">
                <Link
                  to={productHref}
                  viewTransition
                  className="inline relative after:content-[''] after:absolute after:inset-0 after:z-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-[4px]"
                >
                  <span className="relative inline-block">
                    <HighlightedText text={product.name} query={highlightQuery} />
                    <span
                      aria-hidden="true"
                      className="block h-[2px] bg-brand scale-x-0 origin-left transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-x-100 mt-0.5"
                    />
                  </span>
                </Link>
              </h3>

              {product.tagline && (
                <p className="text-sm sm:text-base text-ink-2 line-clamp-2 leading-relaxed">
                  <HighlightedText text={product.tagline} query={highlightQuery} />
                </p>
              )}

              {renderFormatChips()}
            </div>

            {featureIncludes.length > 0 && (
              <div className="rounded-[18px] bg-page border border-line p-3.5 sm:p-4">
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2 mb-2">
                  Included inside
                </span>
                <ul className="flex flex-col gap-1.5">
                  {featureIncludes.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-ink">
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0"
                      />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-1 max-w-md">{renderActions(false)}</div>
          </div>
        </div>
      </article>
    );
  }

  /* -------------------- WIDE VARIANT (16:10 editorial rhythm card — every 7th on desktop) -------------------- */
  if (variant === 'wide') {
    return (
      <article
        className={`group/card relative flex flex-col justify-between h-full gap-3.5 kv-press ${className}`}
        data-variant="wide"
      >
        {/* 16:10 collection-tinted tile with 12px inner padding */}
        <div
          className={`relative rounded-[28px] border p-3 transition-colors duration-200 overflow-hidden ${tileClasses}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center aspect-[16/10] sm:aspect-auto sm:min-h-[260px]">
            <div className="sm:col-span-6 h-full flex items-center justify-center">
              <div
                className="w-full max-w-[230px] transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-1"
                style={coverTransitionStyle}
              >
                <ProductCover
                  product={product}
                  collection={collection}
                  ratio="4/5"
                  size="md"
                  overlaySafe
                  priority={priority}
                  className="rounded-[20px] shadow-[0_10px_28px_rgba(17,17,17,0.08)]"
                />
              </div>
            </div>

            <div className="hidden sm:flex sm:col-span-6 flex-col justify-between h-full py-2 pr-2">
              <div className="flex items-center justify-between gap-2">
                {isPreviewData ? (
                  <TagPill tone="warning" className="bg-surface/95">
                    Preview
                  </TagPill>
                ) : collection ? (
                  <TagPill className="bg-surface/95">{collection.name}</TagPill>
                ) : (
                  <span />
                )}
                <div className="relative z-10">
                  <IconButton
                    label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                    icon={
                      <Heart
                        size={17}
                        strokeWidth={1.75}
                        className={saved ? 'fill-brand text-brand' : ''}
                      />
                    }
                    size="sm"
                    onClick={handleSave}
                    className="bg-surface/95"
                  />
                </div>
              </div>

              {featureIncludes.length > 0 && (
                <ul className="my-auto py-3 flex flex-col gap-1.5">
                  {featureIncludes.slice(0, 2).map((inc, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-ink-2">
                      <span
                        aria-hidden="true"
                        className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0"
                      />
                      <span className="line-clamp-1">{inc}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                {product.sku}
              </div>
            </div>
          </div>

          {/* Mobile overlay controls for wide variant */}
          <div className="sm:hidden absolute top-4 left-4 right-4 flex items-start justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto">
              {collection && <TagPill className="bg-surface/95">{collection.name}</TagPill>}
            </div>
            <div className="pointer-events-auto relative z-10">
              <IconButton
                label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                icon={
                  <Heart
                    size={17}
                    strokeWidth={1.75}
                    className={saved ? 'fill-brand text-brand' : ''}
                  />
                }
                size="sm"
                onClick={handleSave}
                className="bg-surface/95"
              />
            </div>
          </div>
        </div>

        {/* Info block below tile */}
        <div className="px-1 flex flex-col justify-between gap-3 flex-1">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <h3 className="text-base sm:text-lg font-semibold text-ink leading-snug line-clamp-2">
                <Link
                  to={productHref}
                  viewTransition
                  className="inline relative after:content-[''] after:absolute after:inset-0 after:z-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-[4px]"
                >
                  <span className="relative inline">
                    <HighlightedText text={product.name} query={highlightQuery} />
                    <span
                      aria-hidden="true"
                      className="block h-[2px] bg-brand scale-x-0 origin-left transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-x-100 mt-0.5"
                    />
                  </span>
                </Link>
              </h3>
              <PriceTag cents={product.price_cents} size="md" className="shrink-0 pt-0.5" />
            </div>

            {product.tagline && (
              <p className="text-xs sm:text-sm text-ink-2 line-clamp-1">
                <HighlightedText text={product.tagline} query={highlightQuery} />
              </p>
            )}

            <div className="pt-0.5">{renderFormatChips()}</div>
          </div>

          <div className="pt-1 sm:max-w-[300px]">{renderActions(false)}</div>
        </div>
      </article>
    );
  }

  /* -------------------- STANDARD VARIANT (28px tinted tile, 4:5 cover w/ 12px padding, below-tile meta) -------------------- */
  return (
    <article
      className={`group/card relative flex flex-col h-full justify-between gap-3 kv-press ${className}`}
      data-variant="standard"
      data-tint={tileVariant}
    >
      <div className="flex flex-col gap-3">
        {/* Collection-tinted tile: 28px radius, 12px inner padding around 4:5 ProductCover */}
        <div
          className={`relative rounded-[24px] sm:rounded-[28px] border p-3 transition-colors duration-200 ${tileClasses}`}
        >
          <div
            className="transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:-translate-y-1"
            style={coverTransitionStyle}
          >
            <ProductCover
              product={product}
              collection={collection}
              ratio="4/5"
              size="md"
              overlaySafe
              priority={priority}
              className="rounded-[16px] sm:rounded-[20px]"
            />
          </div>

          {/* Top-left TagPill + Top-right round Heart */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-1.5 pointer-events-none">
            <div className="pointer-events-auto min-w-0 max-w-[calc(100%-46px)]">
              {isPreviewData ? (
                <TagPill tone="warning" className="bg-surface/95 truncate max-w-full">
                  Preview
                </TagPill>
              ) : collection ? (
                <TagPill className="bg-surface/95 truncate max-w-full">
                  {collection.name}
                </TagPill>
              ) : null}
            </div>

            <div className="pointer-events-auto relative z-10 shrink-0">
              <IconButton
                label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                icon={
                  <Heart
                    size={17}
                    strokeWidth={1.75}
                    className={saved ? 'fill-brand text-brand' : ''}
                  />
                }
                size="sm"
                onClick={handleSave}
                className="bg-surface/95"
              />
            </div>
          </div>
        </div>

        {/* Below tile: Product name (2-line clamp, 600, persimmon hover underline), tagline (1-line), price, formats */}
        <div className="px-1 flex flex-col gap-1.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-[16px] font-semibold tracking-tight text-ink leading-snug line-clamp-2">
              <Link
                to={productHref}
                viewTransition
                className="inline relative after:content-[''] after:absolute after:inset-0 after:z-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 rounded-[4px]"
              >
                <span className="relative inline">
                  <HighlightedText text={product.name} query={highlightQuery} />
                  <span
                    aria-hidden="true"
                    className="block h-[2px] bg-brand scale-x-0 origin-left transition-transform duration-250 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/card:scale-x-100 mt-0.5"
                  />
                </span>
              </Link>
            </h3>
            <PriceTag cents={product.price_cents} size="sm" className="shrink-0 pt-0.5" />
          </div>

          {product.tagline && (
            <p className="text-xs sm:text-[13px] text-ink-2 line-clamp-1 leading-relaxed">
              <HighlightedText text={product.tagline} query={highlightQuery} />
            </p>
          )}

          <div className="pt-0.5">{renderFormatChips()}</div>
        </div>
      </div>

      {/* Bottom dual actions: Add to cart (white hairline pill) + View (ink pill) */}
      <div className="px-1 pt-1">{renderActions(false)}</div>
    </article>
  );
}

/**
 * Dimension-matched Skeleton for ProductCard across all 4 variants to prevent layout shift.
 */
export function ProductCardSkeleton({
  variant = 'standard',
  className = '',
}: {
  variant?: ProductCardVariant;
  className?: string;
}) {
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-3.5 rounded-[22px] bg-surface border border-line p-3 ${className}`}>
        <Skeleton className="w-[78px] sm:w-[88px] aspect-[4/5] shrink-0" rounded="md" />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-3 w-20" rounded="sm" />
          <Skeleton className="h-4 w-3/4" rounded="sm" />
          <Skeleton className="h-3 w-2/3" rounded="sm" />
          <div className="flex items-center justify-between pt-1">
            <Skeleton className="h-5 w-14" rounded="sm" />
            <Skeleton className="h-9 w-28" rounded="pill" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'feature') {
    return (
      <div className={`rounded-[28px] bg-surface border border-line p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center ${className}`}>
        <Skeleton className="md:col-span-5 aspect-[4/5] w-full" rounded="lg" />
        <div className="md:col-span-7 flex flex-col gap-3">
          <Skeleton className="h-4 w-32" rounded="sm" />
          <Skeleton className="h-8 w-3/4" rounded="md" />
          <Skeleton className="h-4 w-5/6" rounded="sm" />
          <Skeleton className="h-24 w-full mt-2" rounded="md" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-11 flex-1" rounded="pill" />
            <Skeleton className="h-11 w-24" rounded="pill" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="rounded-[24px] sm:rounded-[28px] bg-stone/70 border border-line p-3">
        <Skeleton className="w-full aspect-[4/5]" rounded="md" />
      </div>
      <div className="px-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-4 w-3/5" rounded="sm" />
          <Skeleton className="h-4 w-12" rounded="sm" />
        </div>
        <Skeleton className="h-3.5 w-4/5" rounded="sm" />
        <div className="flex gap-1.5 pt-0.5">
          <Skeleton className="h-5 w-12" rounded="pill" />
          <Skeleton className="h-5 w-14" rounded="pill" />
        </div>
      </div>
      <div className="px-1 pt-1 flex gap-2">
        <Skeleton className="h-[42px] flex-1" rounded="pill" />
        <Skeleton className="h-[42px] w-[72px]" rounded="pill" />
      </div>
    </div>
  );
}
