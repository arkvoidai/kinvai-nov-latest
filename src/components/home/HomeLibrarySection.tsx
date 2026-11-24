import { useMemo, useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection, Product } from '../../lib/data/types';
import {
  filterLibraryProducts,
  orderCanonicalCollections,
} from '../../lib/home/homeHelpers';
import { SplitHeadline, TileIn } from '../../lib/motion';
import { EmptyCatalogueBanner } from '../layout/EmptyCatalogueBanner';
import { ProductCard } from '../layout/ProductCard';
import { Button, Chip, Skeleton, TagPill } from '../primitives';

export interface HomeLibrarySectionProps {
  collections: Collection[];
  products: Product[];
  collectionsById: Map<string, Collection>;
  isPreviewData: boolean;
  loading: boolean;
}

/**
 * Section 8 — The Library (Catalogue Preview):
 * H2 "Pick a place to begin." + client-side filter pills (All + collections, zero reload)
 * above a grid of up to 8 ProductCards (4 cols desktop, 2 cols phones) + "See the whole shop".
 * When no products exist (and not loading), renders the single designed EmptyCatalogueBanner.
 */
export function HomeLibrarySection({
  collections,
  products,
  collectionsById,
  isPreviewData,
  loading,
}: HomeLibrarySectionProps) {
  const [activeSlug, setActiveSlug] = useState<string>('all');

  const orderedCollections = useMemo(() => {
    const src = collections.length > 0 ? collections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [collections]);

  const visibleProducts = useMemo(
    () => filterLibraryProducts(products, activeSlug, orderedCollections, 8),
    [products, activeSlug, orderedCollections]
  );

  return (
    <section aria-labelledby="home-library-heading" className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="type-label text-ink-2">The library</span>
            {isPreviewData && <TagPill tone="warning">Preview data</TagPill>}
          </div>
          <SplitHeadline
            id="home-library-heading"
            as="h2"
            immediate={false}
            text="Pick a place to *begin.*"
            className="type-h2 font-semibold text-ink mt-1.5"
          />
        </div>

        {/* Client-side filter pills (All + collections, no reload) */}
        <div
          role="tablist"
          aria-label="Filter library by collection"
          className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        >
          <Chip
            role="tab"
            aria-selected={activeSlug === 'all'}
            active={activeSlug === 'all'}
            onClick={() => setActiveSlug('all')}
            className="shrink-0"
          >
            All
          </Chip>
          {orderedCollections.map((col) => (
            <Chip
              key={col.slug}
              role="tab"
              aria-selected={activeSlug === col.slug}
              active={activeSlug === col.slug}
              onClick={() => setActiveSlug(col.slug)}
              className="shrink-0"
            >
              {col.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Product Grid or Designed Empty State */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <Skeleton key={n} className="h-[340px] sm:h-[400px] w-full" rounded="lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyCatalogueBanner />
      ) : visibleProducts.length === 0 ? (
        <div className="rounded-[28px] bg-surface border border-line p-8 sm:p-10 text-center flex flex-col items-center gap-4">
          <p className="type-h3 font-semibold text-ink">No systems in this collection yet.</p>
          <p className="text-sm text-ink-2 max-w-[40ch]">
            Switch back to All to browse every published system currently in the shop.
          </p>
          <Button variant="secondary" onClick={() => setActiveSlug('all')}>
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {visibleProducts.map((prod, idx) => (
              <TileIn key={prod.id} index={idx}>
                <ProductCard
                  product={prod}
                  collection={
                    prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null
                  }
                  isPreviewData={isPreviewData}
                />
              </TileIn>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <Button variant="primary" size="lg" to="/shop">
              <span>See the whole shop</span>
              <ArrowUpRight size={18} strokeWidth={1.75} className="kv-arrow-icon" aria-hidden="true" />
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
