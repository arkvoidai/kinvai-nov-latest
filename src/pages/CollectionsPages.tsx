import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react';
import { EmptyCatalogueBanner } from '../components/layout/EmptyCatalogueBanner';
import { ProductCard } from '../components/layout/ProductCard';
import {
  Breadcrumb,
  Button,
  CoverStack,
  Skeleton,
  TagPill,
} from '../components/primitives';
import { ShopErrorTile } from '../components/shop/ShopErrorTile';
import { ShopFilterBar } from '../components/shop/ShopFilterBar';
import { ShopProductGrid } from '../components/shop/ShopProductGrid';
import { useCart } from '../lib/cart/CartProvider';
import { accentToTileVariant } from '../lib/data/format';
import { getCollection, getCollections, getProducts } from '../lib/data/repository';
import { SEED_COLLECTIONS } from '../lib/data/seed';
import type { Collection, PaginatedProductsResult, Product } from '../lib/data/types';
import { orderCanonicalCollections } from '../lib/home/homeHelpers';
import { getProductOgImageUrl } from '../lib/media/imagePipeline';
import { SplitHeadline, TileIn } from '../lib/motion';
import { usePageMeta } from '../lib/seo/usePageMeta';
import {
  countActiveFilters,
  extractFacetOptions,
  getAdjacentCollections,
  parseShopFilters,
  priceRangeToCents,
  serializeShopFilters,
  SHOP_PAGE_SIZE,
  toProductQueryParams,
  type ShopFilterState,
} from '../lib/shop/shopFilters';

const TINT_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

const ROW_EDITORIAL_HEADLINES: Record<string, string> = {
  'run-the-shop': 'Operate with calm spreadsheets & launch systems.',
  'make-the-thing': 'Pre-production blueprints built for consistent output.',
  'build-the-world': 'Reference binders for deep fiction & campaigns.',
  'ship-the-interface': 'Clean interface kits designed to ship fast.',
};

/* ============================================================================
 * /collections — FOUR ALTERNATING EDITORIAL BENTO ROWS
 * ============================================================================ */
export function CollectionsPage() {
  usePageMeta({
    title: 'Collections — Kinvai',
    description:
      'Four focused collections of downloadable digital products — Run the Shop, Make the Thing, Build the World, and Ship the Interface.',
  });

  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>();
  const [retryToken, setRetryToken] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(undefined);

    Promise.all([getCollections(), getProducts({ pageSize: 48 })])
      .then(([colRes, prodRes]) => {
        if (!active) return;
        setCollections(colRes.data);
        setProducts(prodRes.items);
        if (colRes.error && colRes.data.length === 0) {
          setError(colRes.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Could not load collections.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retryToken]);

  const orderedCollections = useMemo(() => {
    const src = collections.length > 0 ? collections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [collections]);

  const productsByCollection = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.collection_id) continue;
      const list = map.get(p.collection_id) ?? [];
      list.push(p);
      map.set(p.collection_id, list);
    }
    return map;
  }, [products]);

  return (
    <div className="kv-container py-6 sm:py-8 lg:py-12 flex flex-col gap-10 lg:gap-14">
      {/* Editorial Header (Nest typography + whitespace) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
        <div className="lg:col-span-8 flex flex-col gap-3">
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
          <div className="pt-1">
            <TagPill>COLLECTIONS</TagPill>
          </div>
          <SplitHeadline
            as="h1"
            immediate
            text="Four ways to get a *head start.*"
            className="type-display font-semibold text-ink leading-[1.03]"
          />
        </div>
        <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-3">
          <p className="type-body text-ink-2 lg:text-right max-w-[38ch]">
            Every Kinvai product belongs to one of four focused disciplines. Step into a shelf to
            browse its systems, formats and starting points.
          </p>
          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums">
            04 Curated Shelves
          </span>
        </div>
      </section>

      {error && collections.length === 0 ? (
        <ShopErrorTile
          title="Could not load live collections."
          retrying={loading}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : loading ? (
        <div className="flex flex-col gap-6">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-[340px] w-full" rounded="lg" />
          ))}
        </div>
      ) : (
        /* Four Large Alternating Editorial Bento Rows (Promax + Converse asymmetric rhythms) */
        <div className="flex flex-col gap-6 lg:gap-8">
          {orderedCollections.map((col, idx) => {
            const tint = accentToTileVariant(col.accent);
            const bgClass = TINT_BG[tint] ?? 'bg-stone';
            const colProducts = productsByCollection.get(col.id) ?? [];
            const headline = ROW_EDITORIAL_HEADLINES[col.slug] ?? col.name;
            const countLabel =
              colProducts.length > 0
                ? `${colProducts.length} ${colProducts.length === 1 ? 'system' : 'systems'}`
                : 'Curated shelf';

            // Distinct asymmetric proportion per row so no two rows look like identical rectangles
            const reverseDesktop = idx % 2 === 1;
            const isFullBanner = idx === 3;
            const mediaCols = idx === 0 ? 'lg:col-span-7' : idx === 1 ? 'lg:col-span-7' : 'lg:col-span-6';
            const storyCols = idx === 0 ? 'lg:col-span-5' : idx === 1 ? 'lg:col-span-5' : 'lg:col-span-6';

            if (isFullBanner) {
              return (
                <TileIn key={col.slug} index={idx}>
                  <Link
                    to={`/collections/${col.slug}`}
                    viewTransition
                    className={`group group/stack block rounded-[28px] lg:rounded-[36px] ${bgClass} border border-ink/[0.08] hover:border-ink/25 p-6 sm:p-8 lg:p-12 transition-colors duration-200 kv-press`}
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                      <div className="lg:col-span-7 flex flex-col justify-between gap-5">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <TagPill className="bg-surface/95">0{idx + 1} · {col.name}</TagPill>
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 tabular-nums">
                              {countLabel}
                            </span>
                          </div>
                          <span
                            aria-hidden="true"
                            className="w-11 h-11 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors lg:hidden"
                          >
                            <ArrowUpRight size={19} strokeWidth={1.75} className="kv-arrow-icon" />
                          </span>
                        </div>

                        <h2 className="type-h1 font-semibold text-ink leading-[1.08] max-w-[18ch]">
                          {headline}
                        </h2>

                        {col.story && (
                          <p className="type-body text-ink-2 max-w-[50ch] leading-relaxed">
                            {col.story}
                          </p>
                        )}

                        <div className="pt-2 flex items-center gap-3">
                          <span className="inline-flex items-center gap-2.5 pl-5 pr-2 py-2 rounded-full bg-ink text-white text-sm font-medium">
                            <span>Open {col.name}</span>
                            <span
                              aria-hidden="true"
                              className="w-8 h-8 rounded-full bg-surface text-ink inline-flex items-center justify-center"
                            >
                              <ArrowUpRight size={16} strokeWidth={1.75} className="kv-arrow-icon" />
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-5 flex items-center justify-center">
                        {colProducts.length > 0 ? (
                          <CoverStack products={colProducts.slice(0, 3)} collection={col} size="sm" />
                        ) : (
                          <div className="w-full max-w-[340px] rounded-[24px] bg-surface/90 border border-ink/10 p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                                Shelf 0{idx + 1}
                              </span>
                              <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                            </div>
                            <p className="type-h3 font-semibold text-ink">{col.name}</p>
                            {col.tagline && <p className="text-sm text-ink-2">{col.tagline}</p>}
                            <div className="h-px bg-ink/12" />
                            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
                              Instant download · Yours for life
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                </TileIn>
              );
            }

            return (
              <TileIn key={col.slug} index={idx}>
                <Link
                  to={`/collections/${col.slug}`}
                  viewTransition
                  className="group group/stack grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch kv-press"
                >
                  {/* Collection-tinted Artwork & CoverStack Tile */}
                  <div
                    className={`${mediaCols} ${
                      reverseDesktop ? 'lg:order-2' : 'lg:order-1'
                    } rounded-[28px] lg:rounded-[36px] ${bgClass} border border-ink/[0.08] group-hover:border-ink/25 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 min-h-[320px] lg:min-h-[400px] transition-colors duration-200`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <TagPill className="bg-surface/95">
                        0{idx + 1} · {col.name}
                      </TagPill>
                      <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 tabular-nums">
                        {countLabel}
                      </span>
                    </div>

                    <div className="my-auto py-2">
                      {colProducts.length > 0 ? (
                        <CoverStack products={colProducts.slice(0, 3)} collection={col} size="sm" />
                      ) : (
                        <div className="max-w-[340px] mx-auto rounded-[24px] bg-surface/85 border border-ink/10 p-6 flex flex-col gap-4">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                              Collection 0{idx + 1}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                          </div>
                          <p className="type-h3 font-semibold text-ink">{col.name}</p>
                          {col.tagline && (
                            <p className="text-sm text-ink-2 leading-relaxed">{col.tagline}</p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.06em] text-ink-2">
                      <span>{col.tagline}</span>
                    </div>
                  </div>

                  {/* Editorial Story & Navigation Tile */}
                  <div
                    className={`${storyCols} ${
                      reverseDesktop ? 'lg:order-1' : 'lg:order-2'
                    } rounded-[28px] lg:rounded-[36px] bg-surface border border-line group-hover:border-ink/25 p-6 sm:p-8 lg:p-10 flex flex-col justify-between gap-6 transition-colors duration-200`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <span className="font-mono text-4xl sm:text-5xl font-semibold text-ink/15 leading-none tabular-nums">
                        0{idx + 1}
                      </span>
                      <span
                        aria-hidden="true"
                        className="w-11 h-11 rounded-full bg-page text-ink border border-line inline-flex items-center justify-center group-hover:bg-ink group-hover:text-white group-hover:border-ink transition-colors shrink-0"
                      >
                        <ArrowUpRight size={19} strokeWidth={1.75} className="kv-arrow-icon" />
                      </span>
                    </div>

                    <div className="flex flex-col gap-3">
                      <h2 className="type-h2 font-semibold text-ink leading-tight">
                        {headline}
                      </h2>
                      {col.story && (
                        <p className="type-body text-ink-2 leading-relaxed prose-measure">
                          {col.story}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-line flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold text-ink group-hover:text-brand-deep transition-colors">
                        Explore {col.name}
                      </span>
                      <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink-2 tabular-nums">
                        {countLabel}
                      </span>
                    </div>
                  </div>
                </Link>
              </TileIn>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ============================================================================
 * /collections/:slug — CURATED COLLECTION STOREFRONT DETAIL PAGE
 * ============================================================================ */
export function CollectionDetailPage() {
  const { slug = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { collections: globalCollections } = useCart();

  const filterState = useMemo(() => parseShopFilters(searchParams), [searchParams]);

  const [collection, setCollection] = useState<Collection | null>(null);
  const [collectionError, setCollectionError] = useState<string | undefined>();
  const [allCollectionProducts, setAllCollectionProducts] = useState<Product[]>([]);
  const [result, setResult] = useState<PaginatedProductsResult | null>(null);
  const [displayedItems, setDisplayedItems] = useState<Product[]>([]);
  const [loadedUpToPage, setLoadedUpToPage] = useState<number>(filterState.page);
  const [loadingCol, setLoadingCol] = useState(true);
  const [loadingGrid, setLoadingGrid] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  const orderedCollections = useMemo(() => {
    const src = globalCollections.length > 0 ? globalCollections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [globalCollections]);

  const collectionsById = useMemo(
    () => new Map(orderedCollections.map((c) => [c.id, c])),
    [orderedCollections]
  );

  // Load collection record + base collection products (for facets & "Start with" feature card)
  useEffect(() => {
    let active = true;
    setLoadingCol(true);
    setCollectionError(undefined);

    Promise.all([getCollection(slug), getProducts({ collection: slug, pageSize: 48 })])
      .then(([colRes, baseProdRes]) => {
        if (!active) return;
        const fallbackCanonical =
          !colRes.data && colRes.error
            ? SEED_COLLECTIONS.find((c) => c.slug === slug) ?? null
            : null;
        setCollection(colRes.data ?? fallbackCanonical);
        setCollectionError(colRes.error);
        setAllCollectionProducts(baseProdRes.items);
        setLoadingCol(false);
      })
      .catch((err) => {
        if (!active) return;
        setCollectionError(err instanceof Error ? err.message : 'Could not load collection.');
        setLoadingCol(false);
      });

    return () => {
      active = false;
    };
  }, [slug, retryToken]);

  // Scoped filtered & paginated product query
  useEffect(() => {
    let active = true;
    setLoadingGrid(true);

    const params = toProductQueryParams(filterState, {
      collectionSlug: slug,
      collectionId:
        collection && !collectionError ? collection.id : undefined,
      pageSize: SHOP_PAGE_SIZE,
    });

    getProducts(params)
      .then((res) => {
        if (!active) return;
        setResult(res);
        setDisplayedItems(res.items);
        setLoadedUpToPage(res.page);
        setLoadingGrid(false);
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
          error: err instanceof Error ? err.message : 'Could not load collection products.',
        });
        setDisplayedItems([]);
        setLoadingGrid(false);
      });

    return () => {
      active = false;
    };
  }, [slug, filterState, collection, collectionError, retryToken]);

  // First genuinely featured product from DB for the "Start with" feature card
  const startWithProduct = useMemo(() => {
    const featured = allCollectionProducts
      .filter((p) => p.is_featured)
      .sort((a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999))[0];
    return featured ?? allCollectionProducts[0] ?? null;
  }, [allCollectionProducts]);

  const firstProductCoverPath =
    startWithProduct?.cover_path ??
    allCollectionProducts.find((p) => Boolean(p.cover_path))?.cover_path ??
    null;

  usePageMeta({
    title: collection ? `${collection.name} — Kinvai` : 'Collection — Kinvai',
    description: collection?.tagline || 'Browse downloadable digital systems in this collection.',
    ogImage: getProductOgImageUrl(firstProductCoverPath),
  });

  const applyFilterState = useCallback(
    (next: ShopFilterState) => {
      const nextParams = serializeShopFilters(next, { omitCollection: true });
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
          collectionSlug: slug,
          collectionId: collection && !collectionError ? collection.id : undefined,
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
      const sp = serializeShopFilters(
        { ...filterState, page: pageNum },
        { omitCollection: true }
      );
      const qs = sp.toString();
      return qs ? `/collections/${slug}?${qs}` : `/collections/${slug}`;
    },
    [filterState, slug]
  );

  const estimateDraftCount = useCallback(
    (draft: ShopFilterState): number | null => {
      if (allCollectionProducts.length === 0) return null;
      const { priceMin, priceMax } = priceRangeToCents(draft.priceRange);
      return allCollectionProducts.filter((p) => {
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
    [allCollectionProducts]
  );

  const facets = useMemo(
    () => extractFacetOptions(allCollectionProducts),
    [allCollectionProducts]
  );

  const { prev: prevCol, next: nextCol } = useMemo(
    () => getAdjacentCollections(orderedCollections, slug),
    [orderedCollections, slug]
  );

  if (loadingCol) {
    return (
      <div className="kv-container py-8 sm:py-10 flex flex-col gap-8">
        <Skeleton className="h-[300px] w-full" rounded="lg" />
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-[380px] w-full" rounded="lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="kv-container py-16 text-center flex flex-col items-center gap-4">
        <TagPill>Not found</TagPill>
        <h1 className="type-h2 font-semibold text-ink">Collection not found.</h1>
        <p className="text-sm text-ink-2 max-w-[40ch]">
          That collection link does not match an active Kinvai shelf.
        </p>
        <div className="pt-2 flex flex-wrap gap-3">
          <Button variant="primary" to="/collections">
            Browse collections
          </Button>
          <Button variant="secondary" to="/shop">
            Open the shop
          </Button>
        </div>
      </div>
    );
  }

  const tint = accentToTileVariant(collection.accent);
  const headerBg = TINT_BG[tint] ?? 'bg-stone';
  const totalCount = result?.total ?? allCollectionProducts.length;
  const hasFilters = countActiveFilters(filterState, { omitCollection: true }) > 0;
  const filterKey = JSON.stringify({ ...filterState, slug });

  return (
    <div className="kv-container py-6 sm:py-8 lg:py-10 flex flex-col gap-8 lg:gap-10">
      <Breadcrumb
        items={[
          { label: 'Home', to: '/' },
          { label: 'Collections', to: '/collections' },
          { label: collection.name },
        ]}
      />

      {/* ==================== COLLECTION-TINTED EDITORIAL HEADER TILE ==================== */}
      <section
        aria-labelledby="collection-detail-heading"
        className={`rounded-[28px] lg:rounded-[36px] ${headerBg} border border-ink/[0.08] p-6 sm:p-8 lg:p-12 flex flex-col gap-8`}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          <div className="lg:col-span-7 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <TagPill className="bg-surface/95">Collection</TagPill>
              <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums">
                {loadingGrid
                  ? 'Checking shelf…'
                  : `${totalCount} ${totalCount === 1 ? 'system' : 'systems'}`}
              </span>
              {result?.isPreviewData && <TagPill tone="warning">Preview data</TagPill>}
            </div>

            <h1
              id="collection-detail-heading"
              className="type-display font-semibold text-ink leading-[1.03]"
            >
              {collection.name}
            </h1>

            {collection.tagline && (
              <p className="text-base sm:text-lg font-medium text-ink max-w-[46ch]">
                {collection.tagline}
              </p>
            )}
          </div>

          <div className="lg:col-span-5">
            {collection.story && (
              <p className="type-body text-ink-2 leading-relaxed prose-measure">
                {collection.story}
              </p>
            )}
          </div>
        </div>

        {/* "Start with" Feature Card sourced genuinely from the first featured DB product */}
        {startWithProduct && (
          <div className="pt-2">
            <ProductCard
              product={startWithProduct}
              collection={collection}
              isPreviewData={Boolean(result?.isPreviewData)}
              variant="feature"
              priority
            />
          </div>
        )}
      </section>

      {/* ==================== COLLECTION-SCOPED FILTERS ==================== */}
      <ShopFilterBar
        state={filterState}
        collections={orderedCollections}
        availableFormats={facets.formats}
        availableTags={facets.tags}
        totalCount={totalCount}
        loading={loadingGrid}
        omitCollection
        onChange={applyFilterState}
        onClearAll={handleClearAll}
        estimateCount={estimateDraftCount}
      />

      {/* ==================== COLLECTION PRODUCT GRID ==================== */}
      {result?.error ? (
        <ShopErrorTile
          retrying={loadingGrid}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : !loadingGrid && displayedItems.length === 0 ? (
        result?.source === 'empty' && !hasFilters ? (
          <EmptyCatalogueBanner />
        ) : (
          <div className="rounded-[28px] bg-surface border border-line p-8 sm:p-12 text-center flex flex-col items-center gap-4">
            <p className="type-h3 font-semibold text-ink">
              Nothing matched in {collection.name}.
            </p>
            <p className="text-sm text-ink-2 max-w-[42ch]">
              Clear your active filters to see everything in this collection, or browse the full shop.
            </p>
            <div className="pt-1 flex flex-wrap justify-center gap-3">
              <Button variant="primary" onClick={handleClearAll}>
                Clear filters
              </Button>
              <Button variant="secondary" to="/shop">
                Open the shop
              </Button>
            </div>
          </div>
        )
      ) : (
        <ShopProductGrid
          items={displayedItems}
          collectionsById={collectionsById}
          isPreviewData={Boolean(result?.isPreviewData)}
          loading={loadingGrid}
          loadingMore={loadingMore}
          gridKey={filterKey}
          page={filterState.page}
          totalPages={result?.totalPages ?? 1}
          total={totalCount}
          canLoadMore={loadedUpToPage < (result?.totalPages ?? 1)}
          onLoadMore={handleLoadMore}
          buildPageHref={buildPageHref}
          onPageSelect={(p) => applyFilterState({ ...filterState, page: p })}
          enableWideRhythm
        />
      )}

      {/* ==================== PREVIOUS / NEXT COLLECTION NAVIGATION ==================== */}
      {(prevCol || nextCol) && (
        <nav
          aria-label="Adjacent collections"
          className="pt-6 border-t border-line grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {prevCol ? (
            <Link
              to={`/collections/${prevCol.slug}`}
              viewTransition
              className={`group rounded-[24px] ${
                TINT_BG[accentToTileVariant(prevCol.accent)] ?? 'bg-stone'
              } border border-ink/[0.08] hover:border-ink/25 p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors kv-press`}
            >
              <span
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-white transition-colors"
              >
                <ArrowLeft size={17} strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1 text-right">
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
                  Previous collection
                </span>
                <span className="block text-base sm:text-lg font-semibold text-ink truncate mt-0.5">
                  {prevCol.name}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextCol && (
            <Link
              to={`/collections/${nextCol.slug}`}
              viewTransition
              className={`group rounded-[24px] ${
                TINT_BG[accentToTileVariant(nextCol.accent)] ?? 'bg-stone'
              } border border-ink/[0.08] hover:border-ink/25 p-5 sm:p-6 flex items-center justify-between gap-4 transition-colors kv-press`}
            >
              <div className="min-w-0 flex-1">
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
                  Next collection
                </span>
                <span className="block text-base sm:text-lg font-semibold text-ink truncate mt-0.5">
                  {nextCol.name}
                </span>
              </div>
              <span
                aria-hidden="true"
                className="w-10 h-10 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-white transition-colors"
              >
                <ArrowRight size={17} strokeWidth={1.75} />
              </span>
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
