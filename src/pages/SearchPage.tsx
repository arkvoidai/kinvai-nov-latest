import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from '../components/layout/ProductCard';
import { Breadcrumb, Button, Chip, SearchPill, TagPill } from '../components/primitives';
import { ShopErrorTile } from '../components/shop/ShopErrorTile';
import { useCart } from '../lib/cart/CartProvider';
import { accentToTileVariant } from '../lib/data/format';
import { searchProducts } from '../lib/data/repository';
import { SEED_COLLECTIONS } from '../lib/data/seed';
import type { Collection, Product } from '../lib/data/types';
import { orderCanonicalCollections } from '../lib/home/homeHelpers';
import { SplitHeadline, TileIn } from '../lib/motion';
import { pushRecentSearch, SEARCH_SUGGESTIONS } from '../lib/search/searchHelpers';
import { usePageMeta } from '../lib/seo/usePageMeta';

const TINT_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

const EXTENDED_SUGGESTIONS = [
  ...SEARCH_SUGGESTIONS,
  'Launch',
  'XLSX',
  'Notion',
];

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const q = (searchParams.get('q') || '').trim();
  const [inputValue, setInputValue] = useState(q);

  const { collections: liveCollections, catalogueProducts } = useCart();

  const [results, setResults] = useState<Product[]>([]);
  const [isPreviewData, setIsPreviewData] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [retryToken, setRetryToken] = useState(0);

  usePageMeta({
    title: q ? `Search “${q}” — Kinvai` : 'Search — Kinvai',
    description: 'Search downloadable spreadsheets, playbooks, templates, worlds and interface kits.',
  });

  useEffect(() => {
    setInputValue(q);
  }, [q]);

  const orderedCollections: Collection[] = useMemo(() => {
    const src = liveCollections.length > 0 ? liveCollections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [liveCollections]);

  const collectionsById = useMemo(
    () => new Map(orderedCollections.map((c) => [c.id, c])),
    [orderedCollections]
  );

  // Abortable search via search_products RPC
  useEffect(() => {
    if (!q) {
      setResults([]);
      setError(undefined);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    pushRecentSearch(q);

    searchProducts(q, 24, controller.signal)
      .then((res) => {
        if (controller.signal.aborted) return;
        setResults(res.data);
        setIsPreviewData(res.isPreviewData);
        setError(res.error);
        setLoading(false);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setResults([]);
        setError(err instanceof Error ? err.message : 'Search failed.');
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
  }, [q, retryToken]);

  const runSearch = (nextQuery: string) => {
    const clean = nextQuery.trim();
    setInputValue(clean);
    if (clean) {
      setSearchParams({ q: clean }, { preventScrollReset: true });
    } else {
      setSearchParams({}, { preventScrollReset: true });
    }
  };

  // Matching collections for the active query
  const matchingCollections = useMemo(() => {
    if (!q) return [];
    const lower = q.toLowerCase();
    return orderedCollections.filter((c) =>
      `${c.name} ${c.tagline ?? ''} ${c.story ?? ''}`.toLowerCase().includes(lower)
    );
  }, [orderedCollections, q]);

  const suggestedProducts = useMemo(
    () => catalogueProducts.slice(0, 3),
    [catalogueProducts]
  );

  return (
    <div className="kv-container py-6 sm:py-8 lg:py-12 flex flex-col gap-8">
      {/* ==================== EDITORIAL SEARCH HEADER (Promax Search Bar DNA) ==================== */}
      <section className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-12 flex flex-col gap-5">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Search' }]} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <TagPill>SEARCH</TagPill>
            {isPreviewData && q && <TagPill tone="warning">Preview data</TagPill>}
          </div>

          {q && !loading && !error && (
            <span
              className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums"
              aria-live="polite"
            >
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </span>
          )}
        </div>

        <SplitHeadline
          as="h1"
          immediate
          text={q ? `Results for *“${q}”*` : 'Find a *system.*'}
          className="type-h1 font-semibold text-ink leading-[1.08]"
        />

        <div className="max-w-2xl">
          <SearchPill
            value={inputValue}
            onChange={setInputValue}
            onSubmit={runSearch}
            placeholder="Search spreadsheets, playbooks, worlds, Figma kits…"
          />
        </div>

        {/* Live Suggestion Chips that actually run searches */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="type-label text-ink-2 mr-1">Try:</span>
          {EXTENDED_SUGGESTIONS.map((term) => (
            <Chip
              key={term}
              active={q.toLowerCase() === term.toLowerCase()}
              onClick={() => runSearch(term)}
            >
              {term}
            </Chip>
          ))}
        </div>
      </section>

      {/* ==================== MATCHING COLLECTIONS STRIP ==================== */}
      {matchingCollections.length > 0 && (
        <section aria-label="Matching collections" className="flex flex-col gap-3">
          <span className="type-label text-ink-2">Matching collections</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {matchingCollections.map((col) => (
              <Link
                key={col.slug}
                to={`/collections/${col.slug}`}
                viewTransition
                className={`group rounded-[22px] ${
                  TINT_BG[accentToTileVariant(col.accent)] ?? 'bg-stone'
                } border border-ink/[0.08] hover:border-ink/25 p-4 flex items-center justify-between gap-3 transition-colors kv-press`}
              >
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-ink truncate">{col.name}</span>
                  {col.tagline && (
                    <span className="block text-xs text-ink-2 truncate mt-0.5">{col.tagline}</span>
                  )}
                </div>
                <span
                  aria-hidden="true"
                  className="w-8 h-8 rounded-full bg-surface text-ink inline-flex items-center justify-center shrink-0 group-hover:bg-ink group-hover:text-white transition-colors"
                >
                  <ArrowUpRight size={15} strokeWidth={1.75} className="kv-arrow-icon" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ==================== SEARCH RESULTS / STATES ==================== */}
      {error ? (
        <ShopErrorTile
          title="Search couldn't complete."
          retrying={loading}
          onRetry={() => setRetryToken((t) => t + 1)}
        />
      ) : loading ? (
        <>
          <div className="flex flex-col gap-3 md:hidden">
            {[1, 2, 3, 4].map((n) => (
              <ProductCardSkeleton key={n} variant="compact" />
            ))}
          </div>
          <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <ProductCardSkeleton key={n} variant="standard" />
            ))}
          </div>
        </>
      ) : !q ? (
        /* Initial discovery view when no query entered yet */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {orderedCollections.map((col, idx) => (
            <Link
              key={col.slug}
              to={`/collections/${col.slug}`}
              viewTransition
              className={`group rounded-[24px] ${
                TINT_BG[accentToTileVariant(col.accent)] ?? 'bg-stone'
              } border border-ink/[0.08] hover:border-ink/25 p-5 flex flex-col justify-between gap-5 transition-colors kv-press min-h-[168px]`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-2 tabular-nums">0{idx + 1}</span>
                <span
                  aria-hidden="true"
                  className="w-9 h-9 rounded-full bg-surface text-ink inline-flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors"
                >
                  <ArrowUpRight size={16} strokeWidth={1.75} className="kv-arrow-icon" />
                </span>
              </div>
              <div>
                <h2 className="text-base font-semibold text-ink">{col.name}</h2>
                {col.tagline && (
                  <p className="text-xs text-ink-2 mt-1 line-clamp-2">{col.tagline}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : results.length > 0 ? (
        <div className="flex flex-col gap-4">
          {/* Phones: Compact horizontal cards */}
          <div className="flex flex-col gap-3 md:hidden">
            {results.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                collection={prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null}
                isPreviewData={isPreviewData}
                variant="compact"
                highlightQuery={q}
              />
            ))}
          </div>

          {/* Tablet & Desktop: Standard editorial card grid */}
          <div className="hidden md:grid md:grid-cols-3 xl:grid-cols-4 gap-5">
            {results.map((prod, idx) => (
              <TileIn key={prod.id} index={idx}>
                <ProductCard
                  product={prod}
                  collection={
                    prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null
                  }
                  isPreviewData={isPreviewData}
                  variant="standard"
                  highlightQuery={q}
                />
              </TileIn>
            ))}
          </div>
        </div>
      ) : (
        /* Empty search results state */
        <div className="flex flex-col gap-8">
          <div className="rounded-[28px] bg-surface border border-line p-8 sm:p-12 flex flex-col items-start gap-4">
            <TagPill>No matches</TagPill>
            <h2 className="type-h2 font-semibold text-ink">
              Nothing matched. Try fewer words or browse a collection.
            </h2>
            <p className="text-sm text-ink-2 max-w-[46ch]">
              Try one of these searches directly, or step into a collection to explore every system.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {SEARCH_SUGGESTIONS.map((term) => (
                <Chip key={term} onClick={() => runSearch(term)}>
                  Search “{term}”
                </Chip>
              ))}
            </div>
            <div className="pt-2 flex flex-wrap gap-3">
              <Button variant="primary" to="/shop">
                Explore the shop
              </Button>
              <Button variant="secondary" onClick={() => runSearch('')}>
                Clear search
              </Button>
            </div>
          </div>

          {suggestedProducts.length > 0 && (
            <div className="flex flex-col gap-4">
              <span className="type-label text-ink-2">Popular starting points</span>
              <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 gap-4">
                {suggestedProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    collection={
                      prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null
                    }
                    isPreviewData={isPreviewData}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
