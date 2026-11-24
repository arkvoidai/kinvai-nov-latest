import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Clock,
  FileText,
  FolderOpen,
  Search,
  X,
} from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';
import { searchProducts } from '../../lib/data/repository';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection, Product } from '../../lib/data/types';
import { KINVAI_EASE, useReducedMotion } from '../../lib/motion';
import {
  clearRecentSearches,
  filterSearchPages,
  highlightMatchSegments,
  pushRecentSearch,
  readRecentSearches,
  SEARCH_SUGGESTIONS,
} from '../../lib/search/searchHelpers';
import { IconButton, PriceTag, ProductCover, Spinner } from '../primitives';

interface NavigableItem {
  key: string;
  to: string;
  group: 'product' | 'collection' | 'page';
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const segments = highlightMatchSegments(text, query);
  return (
    <>
      {segments.map((seg, i) =>
        seg.match ? (
          <mark
            key={`${i}-${seg.text}`}
            className="bg-peach/80 text-ink rounded-[4px] px-0.5 font-semibold"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={`${i}-${seg.text}`}>{seg.text}</span>
        )
      )}
    </>
  );
}

/**
 * Global Command Search:
 * - Desktop (>=1024px): centred modal palette (Cmd/Ctrl+K or "/").
 * - Mobile (<1024px): full-height sheet.
 * - 120ms debounce with AbortController calling search_products RPC.
 * - Grouped results (Products, Collections, Pages), highlighted matches, keyboard nav,
 *   localStorage recent searches, 4 suggestion chips, aria-live result count, zero layout shift.
 */
export function CommandSearch() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const {
    commandSearchOpen,
    setCommandSearchOpen,
    collections,
    cartOpen,
    signInSheetOpen,
  } = useCart();

  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const listboxId = useId();
  const titleId = useId();

  // Global keyboard shortcuts: Cmd/Ctrl+K and "/"
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandSearchOpen(!commandSearchOpen);
        return;
      }

      if (
        e.key === '/' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !e.altKey &&
        !commandSearchOpen &&
        !cartOpen &&
        !signInSheetOpen
      ) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        const isEditable =
          tag === 'input' ||
          tag === 'textarea' ||
          tag === 'select' ||
          Boolean(target?.isContentEditable);
        if (!isEditable) {
          e.preventDefault();
          setCommandSearchOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [commandSearchOpen, setCommandSearchOpen, cartOpen, signInSheetOpen]);

  // Focus input, lock body scroll without layout shift, load recent searches on open
  useEffect(() => {
    if (!commandSearchOpen) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    setRecentSearches(readRecentSearches());
    setActiveIndex(-1);

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      previousFocusRef.current?.focus();
    };
  }, [commandSearchOpen]);

  // 120ms debounced, abortable search_products RPC
  useEffect(() => {
    if (!commandSearchOpen) return;
    const trimmed = query.trim();
    if (!trimmed) {
      setProducts([]);
      setLoading(false);
      setHasSearched(false);
      setActiveIndex(-1);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    const timer = window.setTimeout(() => {
      searchProducts(trimmed, 6, controller.signal)
        .then((res) => {
          if (controller.signal.aborted) return;
          setProducts(res.data);
          setLoading(false);
          setHasSearched(true);
          setActiveIndex(-1);
        })
        .catch(() => {
          if (controller.signal.aborted) return;
          setProducts([]);
          setLoading(false);
          setHasSearched(true);
        });
    }, 120);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, commandSearchOpen]);

  const effectiveCollections = useMemo<Collection[]>(
    () => (collections.length > 0 ? collections : SEED_COLLECTIONS),
    [collections]
  );

  const collectionsById = useMemo(
    () => new Map(effectiveCollections.map((c) => [c.id, c])),
    [effectiveCollections]
  );

  const matchedCollections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return effectiveCollections.filter((col) => {
      const hay = `${col.name} ${col.tagline ?? ''} ${col.story ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, effectiveCollections]);

  const matchedPages = useMemo(() => filterSearchPages(query), [query]);

  const flatItems = useMemo<NavigableItem[]>(() => {
    const list: NavigableItem[] = [];
    for (const p of products) {
      list.push({ key: `prod-${p.id}`, to: `/products/${p.slug}`, group: 'product' });
    }
    for (const c of matchedCollections) {
      list.push({ key: `col-${c.slug}`, to: `/collections/${c.slug}`, group: 'collection' });
    }
    for (const pg of matchedPages) {
      list.push({ key: pg.id, to: pg.to, group: 'page' });
    }
    return list;
  }, [products, matchedCollections, matchedPages]);

  const totalResults = flatItems.length;

  const closeSearch = useCallback(() => {
    setCommandSearchOpen(false);
  }, [setCommandSearchOpen]);

  const goToResult = useCallback(
    (to: string, saveTerm?: string) => {
      const term = (saveTerm ?? query).trim();
      if (term) {
        setRecentSearches(pushRecentSearch(term));
      }
      setCommandSearchOpen(false);
      navigate(to);
    },
    [navigate, query, setCommandSearchOpen]
  );

  const submitFullSearch = useCallback(
    (termRaw?: string) => {
      const term = (termRaw ?? query).trim();
      if (term) {
        setRecentSearches(pushRecentSearch(term));
        setCommandSearchOpen(false);
        navigate(`/search?q=${encodeURIComponent(term)}`);
      } else {
        setCommandSearchOpen(false);
        navigate('/search');
      }
    },
    [navigate, query, setCommandSearchOpen]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeSearch();
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (flatItems.length === 0) return;
      setActiveIndex((prev) => (prev <= 0 ? flatItems.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && flatItems[activeIndex]) {
        goToResult(flatItems[activeIndex].to);
      } else {
        submitFullSearch();
      }
    }
  };

  const runSuggestion = (chip: string) => {
    setQuery(chip);
    setRecentSearches(pushRecentSearch(chip));
    inputRef.current?.focus();
  };

  if (typeof document === 'undefined') return null;

  const trimmedQuery = query.trim();

  return createPortal(
    <AnimatePresence>
      {commandSearchOpen && (
        <div
          className="fixed inset-0 z-[var(--z-dialog)] flex items-stretch lg:items-start lg:justify-center lg:pt-[10vh] lg:px-4"
          role="presentation"
        >
          {/* Backdrop */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.18 }}
            onClick={closeSearch}
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          {/* Palette (Desktop) / Full-Height Sheet (Mobile) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onKeyDown={handleKeyDown}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.99 }}
            transition={reduced ? { duration: 0.01 } : { duration: 0.2, ease: KINVAI_EASE }}
            className="relative z-10 flex flex-col w-full h-dvh lg:h-auto lg:max-w-[660px] bg-surface text-ink lg:rounded-[28px] lg:border lg:border-line lg:shadow-[var(--shadow-float)] overflow-hidden"
          >
            <h2 id={titleId} className="sr-only">
              Search Kinvai catalogue
            </h2>

            {/* Search Input Header */}
            <div className="flex items-center gap-2.5 px-4 sm:px-5 h-[68px] border-b border-line focus-within:border-ink transition-colors shrink-0">
              <Search
                size={20}
                strokeWidth={1.75}
                className="text-ink-2 shrink-0"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                role="combobox"
                aria-expanded="true"
                aria-controls={listboxId}
                aria-autocomplete="list"
                aria-activedescendant={
                  activeIndex >= 0 && flatItems[activeIndex]
                    ? `kv-search-opt-${flatItems[activeIndex].key}`
                    : undefined
                }
                placeholder="Search spreadsheets, kits, worlds..."
                className="flex-1 min-w-0 bg-transparent text-base text-ink placeholder:text-ink-3 focus:outline-none focus-visible:outline-none"
              />
              {loading && <Spinner size="sm" label="Searching" />}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search query"
                  className="w-8 h-8 rounded-full inline-flex items-center justify-center text-ink-2 hover:text-ink hover:bg-stone transition-colors cursor-pointer"
                >
                  <X size={16} strokeWidth={1.75} aria-hidden="true" />
                </button>
              )}
              <IconButton
                label="Close search"
                icon={<X size={18} strokeWidth={1.75} />}
                variant="stone"
                size="sm"
                onClick={closeSearch}
              />
            </div>

            {/* Accessible Live Result Count */}
            <div className="sr-only" aria-live="polite" aria-atomic="true">
              {trimmedQuery
                ? loading
                  ? `Searching for ${trimmedQuery}`
                  : `${totalResults} ${totalResults === 1 ? 'result' : 'results'} for ${trimmedQuery}`
                : 'Type to search Kinvai systems, collections, and pages'}
            </div>

            {/* Fixed-height desktop scroll pane for zero layout shift */}
            <div
              id={listboxId}
              role="listbox"
              aria-label="Search results"
              className="flex-1 lg:flex-none lg:h-[400px] overflow-y-auto px-4 sm:px-5 py-4"
            >
              {!trimmedQuery ? (
                <div className="flex flex-col gap-6">
                  {/* Suggestion chips that execute real searches */}
                  <div>
                    <span className="type-label text-ink-2 block mb-3">Try searching for</span>
                    <div className="flex flex-wrap gap-2">
                      {SEARCH_SUGGESTIONS.map((chip) => (
                        <button
                          key={chip}
                          type="button"
                          onClick={() => runSuggestion(chip)}
                          className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-full bg-page border border-line hover:border-ink text-sm font-medium text-ink transition-colors kv-press cursor-pointer"
                        >
                          <Search size={14} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
                          <span>{chip}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Recent searches from localStorage */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="type-label text-ink-2">Recent searches</span>
                        <button
                          type="button"
                          onClick={() => {
                            clearRecentSearches();
                            setRecentSearches([]);
                          }}
                          className="text-xs font-medium text-ink-2 hover:text-ink underline underline-offset-4 cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        {recentSearches.map((term) => (
                          <button
                            key={term}
                            type="button"
                            onClick={() => runSuggestion(term)}
                            className="flex items-center justify-between gap-3 w-full min-h-[42px] px-3 rounded-[14px] text-left text-sm text-ink hover:bg-page transition-colors cursor-pointer"
                          >
                            <span className="inline-flex items-center gap-2.5 truncate">
                              <Clock size={16} strokeWidth={1.75} className="text-ink-3 shrink-0" aria-hidden="true" />
                              <span className="truncate">{term}</span>
                            </span>
                            <ArrowRight size={15} strokeWidth={1.75} className="text-ink-3 shrink-0" aria-hidden="true" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quick Collections Jump */}
                  <div>
                    <span className="type-label text-ink-2 block mb-2.5">Browse collections</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {effectiveCollections.slice(0, 4).map((col) => (
                        <button
                          key={col.slug}
                          type="button"
                          onClick={() => goToResult(`/collections/${col.slug}`, '')}
                          className="flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-[16px] bg-page hover:bg-stone text-left transition-colors kv-press cursor-pointer"
                        >
                          <div className="min-w-0">
                            <span className="block text-sm font-medium text-ink truncate">
                              {col.name}
                            </span>
                            {col.tagline && (
                              <span className="block text-xs text-ink-2 truncate mt-0.5">
                                {col.tagline}
                              </span>
                            )}
                          </div>
                          <ArrowRight size={15} strokeWidth={1.75} className="text-ink-2 shrink-0" aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : totalResults === 0 && hasSearched && !loading ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
                  <p className="text-base font-medium text-ink">
                    Nothing matched. Try fewer words or browse a collection.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {SEARCH_SUGGESTIONS.map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => runSuggestion(chip)}
                        className="inline-flex items-center h-9 px-3.5 rounded-full bg-page border border-line hover:border-ink text-xs font-medium text-ink transition-colors cursor-pointer"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  {/* Group 1: Products */}
                  {products.length > 0 && (
                    <div>
                      <span className="type-label text-ink-2 block mb-2 px-1">
                        Products ({products.length})
                      </span>
                      <div className="flex flex-col gap-1">
                        {products.map((prod) => {
                          const flatIdx = flatItems.findIndex((i) => i.key === `prod-${prod.id}`);
                          const active = flatIdx === activeIndex;
                          const col = prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null;
                          return (
                            <button
                              key={prod.id}
                              id={`kv-search-opt-prod-${prod.id}`}
                              role="option"
                              aria-selected={active}
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => goToResult(`/products/${prod.slug}`)}
                              className={`flex items-center gap-3.5 w-full p-2 rounded-[16px] text-left transition-colors cursor-pointer ${
                                active ? 'bg-stone' : 'hover:bg-page'
                              }`}
                            >
                              <div className="w-11 shrink-0">
                                <ProductCover
                                  product={prod}
                                  collection={col}
                                  ratio="4/5"
                                  size="sm"
                                  className="rounded-[10px]"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-ink truncate">
                                  <HighlightedText text={prod.name} query={trimmedQuery} />
                                </span>
                                {prod.tagline && (
                                  <span className="block text-xs text-ink-2 truncate mt-0.5">
                                    <HighlightedText text={prod.tagline} query={trimmedQuery} />
                                  </span>
                                )}
                              </div>
                              <PriceTag cents={prod.price_cents} size="sm" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 2: Collections */}
                  {matchedCollections.length > 0 && (
                    <div>
                      <span className="type-label text-ink-2 block mb-2 px-1">
                        Collections ({matchedCollections.length})
                      </span>
                      <div className="flex flex-col gap-1">
                        {matchedCollections.map((col) => {
                          const flatIdx = flatItems.findIndex((i) => i.key === `col-${col.slug}`);
                          const active = flatIdx === activeIndex;
                          return (
                            <button
                              key={col.slug}
                              id={`kv-search-opt-col-${col.slug}`}
                              role="option"
                              aria-selected={active}
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => goToResult(`/collections/${col.slug}`)}
                              className={`flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-[14px] text-left transition-colors cursor-pointer ${
                                active ? 'bg-stone' : 'hover:bg-page'
                              }`}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-full bg-page border border-line inline-flex items-center justify-center shrink-0">
                                  <FolderOpen size={17} strokeWidth={1.75} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-ink truncate">
                                    <HighlightedText text={col.name} query={trimmedQuery} />
                                  </span>
                                  {col.tagline && (
                                    <span className="block text-xs text-ink-2 truncate">
                                      <HighlightedText text={col.tagline} query={trimmedQuery} />
                                    </span>
                                  )}
                                </span>
                              </span>
                              <ArrowRight size={15} strokeWidth={1.75} className="text-ink-2 shrink-0" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Group 3: Pages */}
                  {matchedPages.length > 0 && (
                    <div>
                      <span className="type-label text-ink-2 block mb-2 px-1">
                        Pages ({matchedPages.length})
                      </span>
                      <div className="flex flex-col gap-1">
                        {matchedPages.map((pg) => {
                          const flatIdx = flatItems.findIndex((i) => i.key === pg.id);
                          const active = flatIdx === activeIndex;
                          return (
                            <button
                              key={pg.id}
                              id={`kv-search-opt-${pg.id}`}
                              role="option"
                              aria-selected={active}
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => goToResult(pg.to)}
                              className={`flex items-center justify-between gap-3 w-full px-3 py-2.5 rounded-[14px] text-left transition-colors cursor-pointer ${
                                active ? 'bg-stone' : 'hover:bg-page'
                              }`}
                            >
                              <span className="flex items-center gap-3 min-w-0">
                                <span className="w-9 h-9 rounded-full bg-page border border-line inline-flex items-center justify-center shrink-0">
                                  <FileText size={17} strokeWidth={1.75} aria-hidden="true" />
                                </span>
                                <span className="min-w-0">
                                  <span className="block text-sm font-medium text-ink truncate">
                                    <HighlightedText text={pg.title} query={trimmedQuery} />
                                  </span>
                                  <span className="block text-xs text-ink-2 truncate">
                                    <HighlightedText text={pg.description} query={trimmedQuery} />
                                  </span>
                                </span>
                              </span>
                              <ArrowRight size={15} strokeWidth={1.75} className="text-ink-2 shrink-0" aria-hidden="true" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer bar with Enter -> /search?q= action */}
            <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 border-t border-line bg-page-50 text-xs text-ink-2 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] lg:pb-3 shrink-0">
              <div className="hidden sm:flex items-center gap-3 font-mono text-[11px]">
                <span>↑↓ Navigate</span>
                <span>↵ Open</span>
                <span>Esc Close</span>
              </div>
              <button
                type="button"
                onClick={() => submitFullSearch()}
                className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-brand-deep transition-colors ml-auto cursor-pointer"
              >
                <span>
                  {trimmedQuery ? `View all results for "${trimmedQuery}"` : 'Open search page'}
                </span>
                <ArrowRight size={14} strokeWidth={1.75} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
