import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { accentToTileVariant } from '../../lib/data/format';
import type { Collection, Product } from '../../lib/data/types';
import { selectMosaicProducts } from '../../lib/home/homeHelpers';
import { SplitHeadline, TileIn } from '../../lib/motion';
import { PriceTag, ProductCover, TagPill } from '../primitives';

export interface HomeStartHereMosaicProps {
  featured: Product[];
  allProducts: Product[];
  collectionsById: Map<string, Collection>;
}

const MOSAIC_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

/**
 * Section 5 — "Start here." (Nest "Top Product" staggered asymmetric mosaic of 4 featured products).
 * Each tall tinted tile holds the cover filling the frame with a bottom overlay bar showing
 * price left + dark round arrow right -> /products/:slug.
 * Returns null cleanly when no published products exist (avoiding empty dead tiles or fake items).
 */
export function HomeStartHereMosaic({
  featured,
  allProducts,
  collectionsById,
}: HomeStartHereMosaicProps) {
  const items = selectMosaicProducts(featured, allProducts, 4);
  if (items.length === 0) return null;

  const renderMosaicTile = (
    product: Product,
    index: number,
    heightClass: string
  ) => {
    const col = product.collection_id
      ? collectionsById.get(product.collection_id) ?? null
      : null;
    const tint = accentToTileVariant(col?.accent);
    const bgClass = MOSAIC_BG[tint] ?? 'bg-stone';

    return (
      <TileIn key={product.id} index={index}>
        <Link
          to={`/products/${product.slug}`}
          viewTransition
          className={`group relative block rounded-[28px] lg:rounded-[32px] ${bgClass} border border-ink/[0.08] hover:border-ink/25 transition-[border-color] duration-200 overflow-hidden kv-press ${heightClass}`}
        >
          {/* Full-bleed cover */}
          <div className="w-full h-full">
            <ProductCover
              product={product}
              collection={col}
              ratio="4/5"
              size="md"
              overlaySafe
              className="!rounded-none w-full h-full"
            />
          </div>

          {/* Subtle top-left collection pill */}
          {col && (
            <div className="absolute top-3.5 left-3.5 z-10 pointer-events-none">
              <TagPill className="bg-surface/95">{col.name}</TagPill>
            </div>
          )}

          {/* Bottom floating overlay bar: price left + dark round arrow right */}
          <div className="absolute inset-x-3 bottom-3 z-10">
            <div className="flex items-center justify-between gap-2.5 pl-4 pr-1.5 py-1.5 rounded-full bg-surface/95 backdrop-blur-sm border border-ink/10 shadow-[0_8px_24px_rgba(17,17,17,0.08)]">
              <div className="min-w-0 flex items-center gap-2.5">
                <PriceTag
                  cents={product.price_cents}
                  className="text-sm sm:text-[15px] font-semibold text-ink shrink-0"
                />
                <span className="text-xs sm:text-sm text-ink-2 truncate hidden sm:inline">
                  {product.name}
                </span>
              </div>
              <span
                aria-hidden="true"
                className="w-9 h-9 rounded-full bg-ink text-white inline-flex items-center justify-center shrink-0 transition-transform duration-200 [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-x-0.5"
              >
                <ArrowRight size={16} strokeWidth={1.75} />
              </span>
            </div>
          </div>
        </Link>
      </TileIn>
    );
  };

  const [p1, p2, p3, p4] = items;

  return (
    <section aria-labelledby="home-start-here-heading" className="flex flex-col gap-6">
      {/* Mobile/Tablet Header (on desktop, sits integrated inside column 3 like Nest) */}
      <div className="flex lg:hidden items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="type-label text-ink-2">Featured</span>
          <SplitHeadline
            as="h2"
            immediate={false}
            text="Start *here.*"
            className="type-h2 font-semibold text-ink mt-1.5"
          />
          <p className="type-body text-ink-2 mt-1.5">Four places to begin.</p>
        </div>
        <Link
          to="/shop"
          viewTransition
          className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brand-deep transition-colors min-h-[44px]"
        >
          <span>Browse shop</span>
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </Link>
      </div>

      {/* Desktop Asymmetric 3-Column Staggered Mosaic (Nest pattern) */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4 items-start">
        {/* Column 1: offset lower, tall vertical tile */}
        <div className="col-span-4 mt-16 flex flex-col gap-4">
          {p1 && renderMosaicTile(p1, 0, 'aspect-[4/5]')}
        </div>

        {/* Column 2: two stacked vertical tiles */}
        <div className="col-span-4 flex flex-col gap-4">
          {p2 && renderMosaicTile(p2, 1, 'aspect-[4/5]')}
          {p3 && renderMosaicTile(p3, 2, 'aspect-[4/4.2]')}
        </div>

        {/* Column 3: editorial heading block above product 4 */}
        <div className="col-span-4 flex flex-col gap-6">
          <div className="pt-4 px-2 flex flex-col gap-3">
            <span className="type-label text-ink-2">Featured picks</span>
            <h2
              id="home-start-here-heading"
              className="type-h1 font-semibold text-ink tracking-tight leading-[1.08]"
            >
              Start <span className="font-accent-serif font-normal text-brand-deep">here.</span>
            </h2>
            <p className="type-body text-ink-2 max-w-[28ch]">
              Four places to begin. Open any system to inspect what is inside before you buy.
            </p>
            <div className="pt-1">
              <Link
                to="/shop"
                viewTransition
                className="group inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 min-h-[44px] rounded-full bg-surface border border-line hover:border-ink text-sm font-medium text-ink transition-colors kv-press"
              >
                <span>Open the shop</span>
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-ink text-white inline-flex items-center justify-center"
                >
                  <ArrowUpRight size={16} strokeWidth={1.75} className="kv-arrow-icon" />
                </span>
              </Link>
            </div>
          </div>

          {p4 && renderMosaicTile(p4, 3, 'aspect-[4/5]')}
        </div>
      </div>

      {/* Mobile/Tablet 2-Column Staggered Grid */}
      <div className="grid lg:hidden grid-cols-2 gap-3 sm:gap-4 items-start">
        <div className="flex flex-col gap-3 sm:gap-4">
          {p1 && renderMosaicTile(p1, 0, 'aspect-[4/5]')}
          {p3 && renderMosaicTile(p3, 2, 'aspect-[4/5]')}
        </div>
        <div className="flex flex-col gap-3 sm:gap-4 mt-6">
          {p2 && renderMosaicTile(p2, 1, 'aspect-[4/5]')}
          {p4 && renderMosaicTile(p4, 3, 'aspect-[4/5]')}
        </div>
      </div>
    </section>
  );
}
