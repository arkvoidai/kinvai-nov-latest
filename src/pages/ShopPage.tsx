import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { EmptyCatalogueBanner } from '../components/layout/EmptyCatalogueBanner';
import { ProductCard } from '../components/layout/ProductCard';
import { Breadcrumb, Button, ProductCover, PriceTag, TagPill } from '../components/primitives';
import { ShopErrorTile } from '../components/shop/ShopErrorTile';
import { ShopFilterBar } from '../components/shop/ShopFilterBar';
import { ShopProductGrid } from '../components/shop/ShopProductGrid';
import { useCart } from '../lib/cart/CartProvider';
import { accentToTileVariant } from '../lib/data/format';
import { getProducts } from '../lib/data/repository';
import { SEED_COLLECTIONS } from '../lib/data/seed';
import type { Collection, PaginatedProductsResult, Product } from '../lib/data/types';
import { orderCanonicalCollections } from '../lib/home/homeHelpers';
import { SplitHeadline } from '../lib/motion';
import { usePageMeta } from '../lib/seo/usePageMeta';
import {
  countActiveFilters,
  extractFacetOptions,
  parseShopFilters,
  priceRangeToCents,
  serializeShopFilters,
  SHOP_PAGE_SIZE,
  toProductQueryParams,
  type ShopFilterState,
} from '../lib/shop/shopFilters';

const SPOTLIGHT_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-peach-muted',
};

export function ShopPage() {
  usePageMeta({
    title: 'Shop — Kinvai',
    description:
      'Everything, in one place. Browse downloadable spreadsheets, playbooks, templates, worlds and interface kits.',
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const { collections: liveCollections, catalogueProducts } = useCart();

  const filterState = useMemo(() => parseShopFilters(searchParams), [searchParams]);

  const orderedCollections: Collection[] = useMemo(() => {
    const src = liveCollections.length > 0 ? liveCollections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [liveCollections]);

  const collectionsById = useMemo(
    () => new Map(orderedCollections.map((c) => [c.id, c])),
    [orderedCollections]
  );

  const selectedCollectionObj = useMemo(
    () => orderedCollections.find((c) => c.slug === filterState.collection) ?? null,
    [orderedCollections, filterState.collection]
  );

  const [result, setResult] = useState<PaginatedProductsResult | null>(null);
  const [displayedItems, setDisplayedItems] = useState<Product[]>([]);
  const [loadedUpToPage, setLoadedUpToPage] = useState<number>(filterState.page);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const filterKey = useMemo(() => {
    const { page: _p, ...rest } = filterState;
    return JSON.stringify(rest);
  }, [filterState]);

  // Primary query (1 query for page + exact count when collectionId is known)
  useEffect(() => {
    let active = true;
    setLoading(true);

    const params = toProductQueryParams(filterState, {
      collectionId:
        liveCollections.length > 0 ? selectedCollectionObj?.id : undefined,
      pageSize: SHOP_PAGE_SIZE,
    });

    getProducts(params)
      .then((res) => {
        if (!active) return;
        setResult(res);
        setDisplayedItems(res.items);
        setLoadedUpToPage(res.page);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setResult({
          items: [],
          total: 0,
          page: filterState.page,
          pageSize: SHOP_PAGE_SIZE,
          totalPages: 1,
          source: 'empty',
          isPreviewData: false,
          error: err instanceof Error ? err.message : 'Could not load products.',
        });
        setDisplayedItems([]);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [
    filterState,
    liveCollections.length,
    selectedCollectionObj?.id,
    retryToken,
  ]);

  const applyFilterState = useCallback(
    (next: ShopFilterState) => {
      const nextParams = serializeShopFilters(next);
      setSearchParams(nextParams, { preventScrollReset: true });
    },
    [setSearchParams]
  );

  const handleClearAll = useCallback(() => {
    setSearchParams(new URLSearchParams(), { preventScrollReset: true });
  }, [setSearchParams]);

  const handleLoadMore = async () => {
    if (!result || loadedUpToPage >= result.totalPages || loadingMore) return;
    const nextPage = loadedUpToPage + 1;
    setLoadingMore(true);
    try {
      const params = toProductQueryParams(
        { ...filterState, page: nextPage },
        {
          collectionId:
            liveCollections.length > 0 ? selectedCollectionObj?.id : undefined,
          pageSize: SHOP_PAGE_SIZE,
        }
      );
      const nextRes = await getProducts(params);
      if (!nextRes.error) {
        setDisplayedItems((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          const merged = [...prev];
          for (const item of nextRes.items) {
            if (!seen.has(item.id)) {
              seen.add(item.id);
              merged.push(item);
            }
          }
          return merged;
        });
        setLoadedUpToPage(nextPage);
        setResult(nextRes);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const buildPageHref = useCallback(
    (pageNum: number) => {
      const sp = serializeShopFilters({ ...filterState, page: pageNum });
      const qs = sp.toString();
      return qs ? `/shop?${qs}` : '/shop';
    },
    [filterState]
  );

  const handlePageSelect = useCallback(
    (pageNum: number) => {
      applyFilterState({ ...filterState, page: pageNum });
    },
    [applyFilterState, filterState]
  );

  // Estimate live count in Mobile Sheet when catalogueProducts is populated
  const estimateDraftCount = useCallback(
    (draft: ShopFilterState): number | null => {
      if (catalogueProducts.length === 0) return null;
      const { priceMin, priceMax } = priceRangeToCents(draft.priceRange);
      const colObj = draft.collection
        ? orderedCollections.find((c) => c.slug === draft.collection)
        : null;

      return catalogueProducts.filter((p) => {
        if (draft.collection && colObj && p.collection_id !== colObj.id) return false;
        if (
          draft.formats.length > 0 &&
          !draft.formats.some((f) =>
            p.file_formats.some((pf) => pf.toLowerCase() === f.toLowerCase())
          )
        ) {
          return false;
        }
        if (
          draft.tags.length > 0 &&
          !draft.tags.some((t) =>
            p.tags.some((pt) => pt.toLowerCase() === t.toLowerCase())
          )
        ) {
          return false;
        }
        if (typeof priceMin === 'number' && p.price_cents < priceMin) return false;
        if (typeof priceMax === 'number' && p.price_cents > priceMax) return false;
        return true;
      }).length;
    },
    [catalogueProducts, orderedCollections]
  );

  const facets = useMemo(
    () => extractFacetOptions(catalogueProducts.length > 0 ? catalogueProducts : displayedItems),
    [catalogueProducts, displayedItems]
  );

  const activeFilterCount = countActiveFilters(filterState);
  const hasFilters = activeFilterCount > 0;
  const totalCount = result?.total ?? 0;

  // Featured spotlight for the Promax-inspired right-hand editorial entrance tile
  const spotlightProduct = useMemo(() => {
    const pool = catalogueProducts.length > 0 ? catalogueProducts : displayedItems;
    return (
      pool.find((p) => p.is_featured) ??
      pool[0] ??
      null
    );
  }, [catalogueProducts, displayedItems]);

  const spotlightCollection = spotlightProduct?.collection_id
    ? collectionsById.get(spotlightProduct.collection_id) ?? null
    : null;
  const spotlightTint = accentToTileVariant(spotlightCollection?.accent);
  const spotlightBg = SPOTLIGHT_BG[spotlightTint] ?? 'bg-peach-muted';

  // Three real product suggestions for empty filter state
  const emptySuggestions = useMemo(() => {
    return catalogueProducts.slice(0, 3);
  }, [catalogueProducts]);

  return (
    <div className="kv-container py-5 sm:py-8 lg:py-10 flex flex-col gap-7 sm:gap-9">
      {/* ==================== EDITORIAL SHOP ENTRANCE (Promax + Nest + Converse DNA) ==================== */}
      <section aria-labelledby="shop-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left 7 cols: White editorial entrance tile */}
        <div className="lg:col-span-7 rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-11 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-4">
            <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shop' }]} />

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <TagPill>THE SHOP</TagPill>
              {result?.isPreviewData && <TagPill tone="warning">Preview data</TagPill>}
            </div>

            <SplitHeadline
              id="shop-heading"
              as="h1"
              immediate
              text="Everything, *in one place.*"
              className="type-display font-semibold text-ink leading-[1.03]"
            />

            <p className="type-body text-ink-2 max-w-[46ch]">
              Spreadsheets, playbooks, worldbuilding binders and clean UI systems — each built
              properly once, priced in USD, and yours to re-download for life.
            </p>
          </div>

          <div className="pt-5 border-t border-line flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-brand shrink-0" aria-hidden="true" />
              <p className="font-mono text-xs uppercase tracking-[0.08em] text-ink tabular-nums">
                {loading
                  ? 'Updating catalogue…'
                  : `${totalCount} ${totalCount === 1 ? 'system' : 'systems'}${
                      hasFilters ? ' matching filters' : ' available'
                    }`}
              </p>
            </div>
            <Link
              to="/collections"
              viewTransition
              className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-brand-deep transition-colors"
            >
              <span>Browse by collection</span>
              <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
            </Link>
          </div>
        </div>

        {/* Right 5 cols: Asymmetric Promax spotlight / quick-shelf tile */}
        <div
          className={`lg:col-span-5 rounded-[28px] lg:rounded-[36px] border border-ink/[0.08] p-5 sm:p-6 flex flex-col justify-between gap-4 ${spotlightBg}`}
        >
          {spotlightProduct ? (
            <>
              <div className="flex items-center justify-between gap-2">
                <TagPill className="bg-surface/95">Editor&apos;s pick</TagPill>
                <PriceTag cents={spotlightProduct.price_cents} pill />
              </div>

              <Link
                to={`/products/${spotlightProduct.slug}`}
                viewTransition
                className="group rounded-[22px] bg-surface border border-ink/[0.08] p-4 flex items-center gap-4 hover:border-ink/25 transition-colors kv-press"
              >
                <div className="w-[100px] sm:w-[112px] shrink-0">
                  <ProductCover
                    product={spotlightProduct}
                    collection={spotlightCollection}
                    ratio="4/5"
                    size="sm"
                    priority
                    className="rounded-[14px]"
                  />
                </div>
                <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                  {spotlightCollection && (
                    <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
                      {spotlightCollection.name}
                    </span>
                  )}
                  <p className="text-base font-semibold text-ink line-clamp-2 group-hover:underline underline-offset-4">
                    {spotlightProduct.name}
                  </p>
                  {spotlightProduct.tagline && (
                    <p className="text-xs text-ink-2 line-clamp-2">
                      {spotlightProduct.tagline}
                    </p>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-full bg-ink text-white inline-flex items-center justify-center shrink-0"
                >
                  <ArrowUpRight size={16} strokeWidth={1.75} className="kv-arrow-icon" />
                </span>
              </Link>

              <div className="flex items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.06em] text-ink-2 px-1">
                <span>1 licence · Instant download</span>
                <span>{spotlightProduct.sku}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col justify-between gap-4 h-full">
              <div className="flex items-center justify-between gap-2">
                <TagPill className="bg-surface/95">Four shelves</TagPill>
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                  USD · Instant
                </span>
              </div>

              <div className="rounded-[22px] bg-surface border border-ink/[0.08] p-5 flex-1 flex flex-col justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-ink">Browse by discipline</p>
                  <p className="text-xs text-ink-2 mt-1 leading-relaxed">
                    Every downloadable system is grouped into one of four focused collections.
                  </p>
                </div>

                <div className="flex flex-col divide-y divide-line border-t border-line">
                  {orderedCollections.map((col, idx) => (
                    <Link
                      key={col.slug}
                      to={`/collections/${col.slug}`}
                      viewTransition
                      className="group py-2.5 flex items-center justify-between gap-3 text-ink hover:text-brand-deep transition-colors"
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
                      <ArrowUpRight size={15} strokeWidth={1.75} className="shrink-0 text-ink-2 group-hover:text-ink" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ==================== STICKY FILTER BAR (DESKTOP) & RAIL/SHEET (MOBILE) ==================== */}
      <ShopFilterBar
        state={filterState}
        collections={orderedCollections}
        availableFormats={facets.formats}
        availableTags={facets.tags}
        totalCount={totalCount}
        loading={loading}
        onChange={applyFilterState}
        onClearAll={handleClearAll}
        estimateCount={estimateDraftCount}
      />

      {/* ==================== RESULTS / ERROR / EMPTY STATES ==================== */}
      {result?.error ? (
        <ShopErrorTile
          retrying={loading}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : !loading && displayedItems.length === 0 ? (
        result?.source === 'empty' && !hasFilters ? (
          <EmptyCatalogueBanner />
        ) : (
          <div className="flex flex-col gap-8">
            <div className="rounded-[28px] bg-surface border border-line p-8 sm:p-12 text-center flex flex-col items-center gap-4">
              <TagPill>No matches</TagPill>
              <h2 className="type-h2 font-semibold text-ink max-w-[26ch]">
                Nothing matched. Try fewer words or browse a collection.
              </h2>
              <p className="text-sm text-ink-2 max-w-[44ch]">
                Remove a format or price filter, or reset to explore every published system.
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                <Button variant="primary" onClick={handleClearAll}>
                  Clear filters
                </Button>
                <Button variant="secondary" to="/collections">
                  Browse collections
                </Button>
              </div>
            </div>

            {emptySuggestions.length > 0 && (
              <div className="flex flex-col gap-4">
                <span className="type-label text-ink-2">Suggested systems</span>
                <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 gap-4">
                  {emptySuggestions.map((prod) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      collection={
                        prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null
                      }
                      isPreviewData={Boolean(result?.isPreviewData)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <ShopProductGrid
          items={displayedItems}
          collectionsById={collectionsById}
          isPreviewData={Boolean(result?.isPreviewData)}
          loading={loading}
          loadingMore={loadingMore}
          gridKey={`${filterKey}-p${filterState.page}`}
          page={filterState.page}
          totalPages={result?.totalPages ?? 1}
          total={totalCount}
          canLoadMore={loadedUpToPage < (result?.totalPages ?? 1)}
          onLoadMore={handleLoadMore}
          buildPageHref={buildPageHref}
          onPageSelect={handlePageSelect}
          enableWideRhythm
        />
      )}
    </div>
  );
}
