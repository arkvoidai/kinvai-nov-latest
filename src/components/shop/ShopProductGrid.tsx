import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Collection, Product } from '../../lib/data/types';
import { KINVAI_EASE, TileIn, useReducedMotion } from '../../lib/motion';
import { shouldSpanWideDesktop } from '../../lib/shop/shopFilters';
import { ProductCard, ProductCardSkeleton } from '../layout/ProductCard';
import { Button } from '../primitives';

export interface ShopProductGridProps {
  items: Product[];
  collectionsById: Map<string, Collection>;
  isPreviewData: boolean;
  loading: boolean;
  loadingMore?: boolean;
  gridKey: string;
  page: number;
  totalPages: number;
  total: number;
  canLoadMore: boolean;
  onLoadMore: () => void;
  buildPageHref: (pageNum: number) => string;
  onPageSelect: (pageNum: number) => void;
  enableWideRhythm?: boolean;
}

/**
 * Shared responsive product grid with:
 * - 4 cols >=1280px, 3 cols >=1024px, 2 cols >=340px, 1 col only <340px
 * - 160ms opacity crossfade on filter/sort changes without layout jumps
 * - First 8 cards stagger reveal (TileIn)
 * - Every 7th card spans 2 columns on >=1280px desktop when visually balanced
 * - Load more + accessible numbered pagination links
 */
export function ShopProductGrid({
  items,
  collectionsById,
  isPreviewData,
  loading,
  loadingMore = false,
  gridKey,
  page,
  totalPages,
  total,
  canLoadMore,
  onLoadMore,
  buildPageHref,
  onPageSelect,
  enableWideRhythm = true,
}: ShopProductGridProps) {
  const reduced = useReducedMotion();

  if (loading && items.length === 0) {
    return (
      <div
        className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5"
        aria-busy="true"
        aria-label="Loading products"
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
          <ProductCardSkeleton key={n} variant="standard" />
        ))}
      </div>
    );
  }

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-10">
      <motion.div
        key={gridKey}
        initial={reduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: reduced ? 0.01 : 0.16, ease: KINVAI_EASE }}
        className={`grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-5 transition-opacity duration-150 ${
          loading ? 'opacity-60 pointer-events-none' : 'opacity-100'
        }`}
      >
        {items.map((prod, idx) => {
          const col = prod.collection_id
            ? collectionsById.get(prod.collection_id) ?? null
            : null;
          const isWide =
            enableWideRhythm && shouldSpanWideDesktop(idx, items.length);

          const card = (
            <ProductCard
              product={prod}
              collection={col}
              isPreviewData={isPreviewData}
              variant={isWide ? 'wide' : 'standard'}
              priority={idx < 4}
            />
          );

          if (idx < 8) {
            return (
              <TileIn
                key={prod.id}
                index={idx}
                className={isWide ? 'xl:col-span-2' : ''}
              >
                {card}
              </TileIn>
            );
          }

          return (
            <div key={prod.id} className={isWide ? 'xl:col-span-2' : ''}>
              {card}
            </div>
          );
        })}
      </motion.div>

      {/* Pagination Footer: Load more + Accessible page links */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums">
            Showing {items.length} of {total} {total === 1 ? 'system' : 'systems'}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {canLoadMore && (
              <Button
                variant="secondary"
                size="md"
                loading={loadingMore}
                onClick={onLoadMore}
              >
                Load more
              </Button>
            )}

            <nav aria-label="Pagination" className="inline-flex items-center gap-1.5">
              {page > 1 ? (
                <Link
                  to={buildPageHref(page - 1)}
                  preventScrollReset
                  onClick={(e) => {
                    e.preventDefault();
                    onPageSelect(page - 1);
                  }}
                  aria-label="Previous page"
                  className="w-10 h-10 rounded-full bg-surface border border-line hover:border-ink text-ink inline-flex items-center justify-center transition-colors kv-press"
                >
                  <ChevronLeft size={16} strokeWidth={1.75} />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="w-10 h-10 rounded-full bg-stone/60 border border-line text-ink-3 inline-flex items-center justify-center opacity-50"
                >
                  <ChevronLeft size={16} strokeWidth={1.75} />
                </span>
              )}

              {pageNumbers.map((num) => {
                const isCurrent = num === page;
                return (
                  <Link
                    key={num}
                    to={buildPageHref(num)}
                    preventScrollReset
                    aria-current={isCurrent ? 'page' : undefined}
                    onClick={(e) => {
                      e.preventDefault();
                      if (!isCurrent) onPageSelect(num);
                    }}
                    className={`min-w-[40px] h-10 px-3 rounded-full font-mono text-xs font-medium inline-flex items-center justify-center transition-colors kv-press tabular-nums ${
                      isCurrent
                        ? 'bg-ink text-white border border-ink'
                        : 'bg-surface text-ink border border-line hover:border-ink'
                    }`}
                  >
                    {num}
                  </Link>
                );
              })}

              {page < totalPages ? (
                <Link
                  to={buildPageHref(page + 1)}
                  preventScrollReset
                  onClick={(e) => {
                    e.preventDefault();
                    onPageSelect(page + 1);
                  }}
                  aria-label="Next page"
                  className="w-10 h-10 rounded-full bg-surface border border-line hover:border-ink text-ink inline-flex items-center justify-center transition-colors kv-press"
                >
                  <ChevronRight size={16} strokeWidth={1.75} />
                </Link>
              ) : (
                <span
                  aria-disabled="true"
                  className="w-10 h-10 rounded-full bg-stone/60 border border-line text-ink-3 inline-flex items-center justify-center opacity-50"
                >
                  <ChevronRight size={16} strokeWidth={1.75} />
                </span>
              )}
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
