import { useCallback, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  Download,
  Heart,
  Infinity as InfinityIcon,
  ShieldCheck,
  ShoppingBag,
} from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';
import { accentToTileVariant } from '../../lib/data/format';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection, Product } from '../../lib/data/types';
import { cycleIndex } from '../../lib/home/homeHelpers';
import { KINVAI_EASE, Tilt, useReducedMotion } from '../../lib/motion';
import { Button, IconButton, PriceTag, ProductCover, Skeleton, TagPill, useToast } from '../primitives';

export interface HomeHeroProps {
  spotlightProducts: Product[];
  collectionsById: Map<string, Collection>;
  collections: Collection[];
  isPreviewData: boolean;
  loading: boolean;
}

const SPOTLIGHT_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-peach-muted',
};

/**
 * Section 1 — Hero Bento (Promax + Nest DNA):
 * - LCP is immediate text (opacity: 1 from first paint).
 * - Desktop: 7-col white tile + 5-col collection-tinted Promax spotlight tile cycling up to 5 products.
 * - Mobile: headline, sub, two full-width stacked CTA buttons visible without scrolling at 390x740,
 *   followed by full-width spotlight tile and slide pill.
 */
export function HomeHero({
  spotlightProducts,
  collectionsById,
  collections,
  isPreviewData,
  loading,
}: HomeHeroProps) {
  const { addToCart, removeFromCart, isInCart, isOwnedProduct, isSaved, toggleSaved, setCartOpen } =
    useCart();
  const { toast } = useToast();
  const reduced = useReducedMotion();

  const [activeIdx, setActiveIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  const count = spotlightProducts.length;
  const safeIdx = count > 0 ? activeIdx % count : 0;
  const activeProduct = count > 0 ? spotlightProducts[safeIdx] : null;
  const activeCollection =
    activeProduct?.collection_id ? collectionsById.get(activeProduct.collection_id) ?? null : null;

  const tintKey = accentToTileVariant(activeCollection?.accent ?? 'apricot');
  const spotlightBg = SPOTLIGHT_BG[tintKey] ?? 'bg-peach';

  const stepSlide = useCallback(
    (delta: 1 | -1) => {
      if (count <= 1) return;
      setDirection(delta);
      setActiveIdx((prev) => cycleIndex(prev, delta, count));
    },
    [count]
  );

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || count <= 1) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const diff = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(diff) > 40) {
      stepSlide(diff < 0 ? 1 : -1);
    }
  };

  const handleSpotlightSave = (prod: Product) => {
    const next = toggleSaved(prod.id);
    toast({
      title: next ? `Saved ${prod.name}` : 'Removed from saved',
      undoLabel: 'Undo',
      onUndo: () => toggleSaved(prod.id),
    });
  };

  const handleSpotlightCart = (prod: Product, e: MouseEvent<HTMLButtonElement>) => {
    if (isPreviewData) {
      toast({
        title: 'Preview data only',
        description: 'Purchases open once live products are published in Supabase.',
      });
      return;
    }
    if (isOwnedProduct(prod.id)) {
      toast({
        title: 'Already in your library',
        description: 'Open Account to download your files anytime.',
      });
      return;
    }
    if (isInCart(prod.id)) {
      setCartOpen(true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    addToCart(prod, false, {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    toast({
      title: `Added ${prod.name}`,
      description: '1 licence. Yours for life.',
      tone: 'success',
      undoLabel: 'Undo',
      onUndo: () => removeFromCart(prod.id),
    });
  };

  const fallbackCollections = (collections.length > 0 ? collections : SEED_COLLECTIONS).slice(0, 4);

  return (
    <section
      aria-label="Kinvai introduction"
      className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
    >
      {/* Left 7-col White Tile (Immediate LCP, 36px desktop / 28px mobile) */}
      <div className="lg:col-span-7 rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-5 sm:p-8 lg:p-12 xl:p-[56px] flex flex-col justify-between gap-6 lg:gap-10">
        <div className="flex flex-col gap-3.5 sm:gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <TagPill>READY-MADE SYSTEMS</TagPill>
            {isPreviewData && <TagPill tone="warning">Preview data</TagPill>}
          </div>

          {/* LCP Headline: light 300 + semibold 600 + Instrument Serif italic persimmon + inline round-arrow link */}
          <h1 className="text-[2.25rem] sm:text-[3.25rem] lg:text-[4rem] xl:text-[4.65rem] leading-[1.03] tracking-[-0.035em] text-ink text-balance">
            <span className="font-light">The hard </span>
            <span className="font-semibold">first draft, </span>
            <span className="font-accent-serif font-normal text-brand">already done.</span>
            <Link
              to="/shop"
              viewTransition
              aria-label="Explore the shop"
              className="group/arrow inline-flex items-center justify-center align-middle ml-2.5 sm:ml-3.5 -mt-1 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-ink text-white hover:bg-ink-soft transition-colors kv-press"
            >
              <ArrowUpRight
                size={20}
                strokeWidth={1.75}
                className="kv-arrow-icon"
                aria-hidden="true"
              />
            </Link>
          </h1>

          <p className="text-[15px] sm:text-lg leading-[1.52] text-ink-2 max-w-[46ch]">
            Spreadsheets, playbooks, templates and worlds, built properly once, so your project
            starts at step two.
          </p>
        </div>

        <div className="flex flex-col gap-5 sm:gap-6">
          {/* Mobile: stacked full-width CTA buttons visible above fold at 390x740 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
            <Button
              variant="primary"
              size="lg"
              to="/shop"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[52px]"
            >
              Explore the shop
            </Button>
            <Button
              variant="secondary"
              size="lg"
              to="/how-it-works"
              className="w-full sm:w-auto min-h-[48px] sm:min-h-[52px]"
            >
              How it works
            </Button>
          </div>

          <div className="pt-4 sm:pt-5 border-t border-line flex flex-wrap items-center gap-x-5 gap-y-2 text-xs sm:text-sm text-ink-2">
            <span className="inline-flex items-center gap-1.5">
              <Download size={16} strokeWidth={1.75} className="text-ink shrink-0" aria-hidden="true" />
              <span>Instant download</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <InfinityIcon size={16} strokeWidth={1.75} className="text-ink shrink-0" aria-hidden="true" />
              <span>Yours for life</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck size={16} strokeWidth={1.75} className="text-ink shrink-0" aria-hidden="true" />
              <span>Secure checkout</span>
            </span>
          </div>
        </div>
      </div>

      {/* Right 5-col Promax Spotlight Tile */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`lg:col-span-5 rounded-[28px] lg:rounded-[36px] ${spotlightBg} border border-ink/[0.07] p-4 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-300`}
      >
        {loading ? (
          <div className="flex flex-col justify-between gap-4 h-full min-h-[440px]">
            <div className="flex justify-end">
              <Skeleton className="h-8 w-28" rounded="pill" />
            </div>
            <Skeleton className="flex-1 w-full rounded-[24px]" />
            <Skeleton className="h-14 w-full" rounded="pill" />
          </div>
        ) : activeProduct ? (
          <>
            {/* Top row: floating "Start here" chip */}
            <div className="flex items-center justify-between gap-2">
              <span className="type-label text-ink-2">
                {activeCollection?.name || 'Featured system'}
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-ink/10 font-mono text-[11px] uppercase tracking-[0.06em] font-medium text-ink shadow-[var(--shadow-float)]">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
                Start here
              </span>
            </div>

            {/* Inner Floating White Mini-Card (Promax Spotlight) */}
            <div className="relative overflow-hidden rounded-[26px] bg-surface border border-ink/[0.08] shadow-[var(--shadow-float)] p-4 sm:p-5 flex-1 flex flex-col justify-between">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeProduct.id}
                  initial={
                    reduced
                      ? { opacity: 1 }
                      : { opacity: 0, x: direction * 24 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    reduced
                      ? { opacity: 1 }
                      : { opacity: 0, x: direction * -24 }
                  }
                  transition={
                    reduced
                      ? { duration: 0.01 }
                      : { duration: 0.42, ease: KINVAI_EASE }
                  }
                  className="flex flex-col gap-4 h-full"
                >
                  {/* Mini-card header: Price + Product Name */}
                  <div className="flex items-start justify-between gap-3">
                    <Link
                      to={`/products/${activeProduct.slug}`}
                      viewTransition
                      className="min-w-0 flex-1 group"
                    >
                      <PriceTag cents={activeProduct.price_cents} size="lg" className="block" />
                      <span className="mt-1 block font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 truncate group-hover:text-ink transition-colors">
                        {activeProduct.name}
                      </span>
                    </Link>
                    <Link
                      to={`/products/${activeProduct.slug}`}
                      viewTransition
                      aria-label={`Open ${activeProduct.name}`}
                      className="w-9 h-9 rounded-full bg-page border border-line hover:bg-ink hover:text-white hover:border-ink text-ink inline-flex items-center justify-center shrink-0 transition-colors kv-press"
                    >
                      <ArrowUpRight size={17} strokeWidth={1.75} aria-hidden="true" />
                    </Link>
                  </div>

                  {/* Large Centered Product Cover with <=4deg Fine-Pointer Tilt */}
                  <div className="relative flex-1 flex items-center justify-center py-1">
                    <Tilt maxDegrees={4} className="w-full max-w-[230px] sm:max-w-[250px] mx-auto">
                      <Link
                        to={`/products/${activeProduct.slug}`}
                        viewTransition
                        className="block rounded-[18px] overflow-hidden"
                      >
                        <ProductCover
                          product={activeProduct}
                          collection={activeCollection}
                          ratio="4/5"
                          size="md"
                          priority
                          sizes="(max-width: 1024px) 70vw, 280px"
                        />
                      </Link>
                    </Tilt>

                    {/* Round Heart & Cart buttons bottom-right inside the card */}
                    <div className="absolute bottom-1 right-0 flex items-center gap-1.5">
                      <IconButton
                        label={
                          isSaved(activeProduct.id)
                            ? `Remove ${activeProduct.name} from saved`
                            : `Save ${activeProduct.name}`
                        }
                        icon={
                          <Heart
                            size={18}
                            strokeWidth={1.75}
                            className={
                              isSaved(activeProduct.id) ? 'fill-brand text-brand' : ''
                            }
                          />
                        }
                        size="md"
                        variant="surface"
                        onClick={() => handleSpotlightSave(activeProduct)}
                        className="shadow-[var(--shadow-float)]"
                      />
                      <IconButton
                        label={
                          isPreviewData
                            ? `Purchase disabled for preview item ${activeProduct.name}`
                            : isInCart(activeProduct.id)
                              ? `View ${activeProduct.name} in cart`
                              : `Add ${activeProduct.name} to cart`
                        }
                        icon={
                          isInCart(activeProduct.id) ? (
                            <Check size={18} strokeWidth={2} />
                          ) : (
                            <ShoppingBag size={18} strokeWidth={1.75} />
                          )
                        }
                        size="md"
                        variant="ink"
                        disabled={isPreviewData}
                        onClick={(e) => handleSpotlightCart(activeProduct, e)}
                        className="shadow-[var(--shadow-float)]"
                      />
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Bottom Promax Slide Pill */}
            <div
              role="group"
              aria-label="Spotlight product switcher"
              className="rounded-full bg-surface border border-ink/10 p-1.5 flex items-center justify-between gap-2 shadow-[var(--shadow-float)]"
            >
              <button
                type="button"
                onClick={() => stepSlide(-1)}
                disabled={count <= 1}
                aria-label="Previous featured product"
                className="w-11 h-11 rounded-full bg-page hover:bg-stone text-ink inline-flex items-center justify-center transition-colors kv-press cursor-pointer disabled:opacity-40"
              >
                <ArrowLeft size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>

              <div className="flex items-center gap-2 min-w-0 text-center">
                <span className="text-xs sm:text-sm font-medium text-ink truncate">
                  Slide left and right
                </span>
                <span className="font-mono text-[11px] text-ink-2 tabular-nums shrink-0">
                  {safeIdx + 1}/{count}
                </span>
              </div>

              <button
                type="button"
                onClick={() => stepSlide(1)}
                disabled={count <= 1}
                aria-label="Next featured product"
                className="w-11 h-11 rounded-full bg-ink hover:bg-ink-soft text-white inline-flex items-center justify-center transition-colors kv-press cursor-pointer disabled:opacity-40"
              >
                <ArrowRight size={18} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </>
        ) : (
          /* Designed live-empty spotlight state (zero dead space when allowSeedFallback=false) */
          <div className="flex flex-col justify-between gap-4 h-full">
            <div className="flex items-center justify-between gap-2">
              <span className="type-label text-ink-2">Four collections</span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-ink/10 font-mono text-[11px] uppercase tracking-[0.06em] font-medium text-ink">
                <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
                Start here
              </span>
            </div>

            <div className="rounded-[26px] bg-surface border border-ink/[0.08] p-5 flex-1 flex flex-col justify-between gap-4">
              <div>
                <p className="type-h3 font-semibold text-ink">
                  Four ways to begin.
                </p>
                <p className="text-sm text-ink-2 mt-1 leading-relaxed">
                  Published systems appear in this spotlight as soon as the shelf opens.
                </p>
              </div>

              <div className="flex flex-col divide-y divide-line border-t border-line">
                {fallbackCollections.map((col, idx) => (
                  <Link
                    key={col.slug}
                    to={`/collections/${col.slug}`}
                    viewTransition
                    className="group py-3 flex items-center justify-between gap-3 text-ink hover:text-brand-deep transition-colors"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className="font-mono text-[11px] text-ink-2 pt-0.5 tabular-nums">
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="block text-sm font-semibold truncate">{col.name}</span>
                        {col.tagline && (
                          <span className="block text-xs text-ink-2 truncate mt-0.5">
                            {col.tagline}
                          </span>
                        )}
                      </div>
                    </div>
                    <ArrowUpRight
                      size={16}
                      strokeWidth={1.75}
                      className="text-ink-2 group-hover:text-ink shrink-0"
                      aria-hidden="true"
                    />
                  </Link>
                ))}
              </div>
            </div>

            <Link
              to="/collections"
              viewTransition
              className="rounded-full bg-surface border border-ink/10 p-1.5 pl-5 flex items-center justify-between gap-2 hover:border-ink/25 transition-colors kv-press"
            >
              <span className="text-sm font-medium text-ink">Explore all collections</span>
              <span className="w-10 h-10 rounded-full bg-ink text-white inline-flex items-center justify-center shrink-0">
                <ArrowRight size={17} strokeWidth={1.75} aria-hidden="true" />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
