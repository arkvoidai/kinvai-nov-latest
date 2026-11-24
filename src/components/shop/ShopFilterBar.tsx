import { useEffect, useState } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import type { Collection } from '../../lib/data/types';
import {
  countActiveFilters,
  formatTagLabel,
  getActiveFilterChips,
  PRICE_RANGE_OPTIONS,
  removeFilterChip,
  SHOP_SORT_OPTIONS,
  toggleArrayValue,
  type ActiveFilterChip,
  type PriceRangeId,
  type ShopFilterState,
  type ShopSort,
} from '../../lib/shop/shopFilters';
import { Button, Chip, Select, Sheet } from '../primitives';

export interface ShopFilterBarProps {
  state: ShopFilterState;
  collections: Collection[];
  availableFormats: string[];
  availableTags: string[];
  totalCount: number;
  loading: boolean;
  omitCollection?: boolean;
  onChange: (next: ShopFilterState) => void;
  onClearAll: () => void;
  /** Optional function to compute live preview count inside mobile sheet before Apply */
  estimateCount?: (draft: ShopFilterState) => number | null;
}

/**
 * Shared Desktop sticky filter bar (Promax pill row + expandable filter tray + Sort select)
 * and Mobile horizontal collection rail + Filter & Sort bottom Sheet.
 */
export function ShopFilterBar({
  state,
  collections,
  availableFormats,
  availableTags,
  totalCount,
  loading,
  omitCollection = false,
  onChange,
  onClearAll,
  estimateCount,
}: ShopFilterBarProps) {
  const [desktopFiltersOpen, setDesktopFiltersOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileDraft, setMobileDraft] = useState<ShopFilterState>(state);

  useEffect(() => {
    if (mobileSheetOpen) {
      setMobileDraft(state);
    }
  }, [mobileSheetOpen, state]);

  const activeChips = getActiveFilterChips(state, collections, { omitCollection });
  const activeCount = countActiveFilters(state, { omitCollection });
  const drawerActiveCount =
    state.formats.length + state.tags.length + (state.priceRange ? 1 : 0);

  const handleRemoveChip = (chip: ActiveFilterChip) => {
    onChange(removeFilterChip(state, chip));
  };

  const applyMobileDraft = () => {
    onChange({ ...mobileDraft, page: 1 });
    setMobileSheetOpen(false);
  };

  const clearMobileDraft = () => {
    const cleared: ShopFilterState = {
      collection: omitCollection ? state.collection : '',
      formats: [],
      priceRange: '',
      tags: [],
      sort: 'featured',
      q: '',
      page: 1,
    };
    setMobileDraft(cleared);
    onClearAll();
    setMobileSheetOpen(false);
  };

  const estimatedDraftCount = estimateCount ? estimateCount(mobileDraft) : null;
  const applyLabel =
    estimatedDraftCount !== null
      ? `Show ${estimatedDraftCount} ${estimatedDraftCount === 1 ? 'product' : 'products'}`
      : loading
        ? 'Show products'
        : `Show ${totalCount} ${totalCount === 1 ? 'product' : 'products'}`;

  return (
    <>
      {/* ==================== DESKTOP STICKY FILTER BAR (>=1024px) ==================== */}
      <div className="hidden lg:flex flex-col gap-3 sticky top-4 z-20">
        <div className="rounded-[28px] bg-page/90 backdrop-blur-md border border-line shadow-[var(--shadow-float)] p-2.5 flex items-center justify-between gap-3">
          {/* Left: Collection pills (Promax category bar) or Filter label on collection detail */}
          <div className="flex items-center gap-2 overflow-x-auto min-w-0 py-0.5">
            <button
              type="button"
              onClick={() => setDesktopFiltersOpen((v) => !v)}
              aria-expanded={desktopFiltersOpen}
              className={`inline-flex items-center gap-2 h-11 px-4 rounded-full border text-sm font-medium transition-colors kv-press cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
                desktopFiltersOpen || drawerActiveCount > 0
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink border-line hover:border-ink/30'
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
              <span>Filters</span>
              {drawerActiveCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white font-mono text-[11px] tabular-nums">
                  {drawerActiveCount}
                </span>
              )}
            </button>

            {!omitCollection && (
              <>
                <span aria-hidden="true" className="h-5 w-px bg-line shrink-0 mx-0.5" />
                <Chip
                  active={!state.collection}
                  onClick={() => onChange({ ...state, collection: '', page: 1 })}
                  className="shrink-0"
                >
                  All
                </Chip>
                {collections.map((col) => (
                  <Chip
                    key={col.slug}
                    active={state.collection === col.slug}
                    onClick={() =>
                      onChange({
                        ...state,
                        collection: state.collection === col.slug ? '' : col.slug,
                        page: 1,
                      })
                    }
                    className="shrink-0"
                  >
                    {col.name}
                  </Chip>
                ))}
              </>
            )}

            {omitCollection && (
              <div className="flex items-center gap-1.5 pl-1">
                {availableFormats.slice(0, 5).map((fmt) => {
                  const selected = state.formats.some(
                    (f) => f.toLowerCase() === fmt.toLowerCase()
                  );
                  return (
                    <Chip
                      key={fmt}
                      active={selected}
                      onClick={() =>
                        onChange({
                          ...state,
                          formats: toggleArrayValue(state.formats, fmt),
                          page: 1,
                        })
                      }
                      className="shrink-0"
                    >
                      {fmt}
                    </Chip>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Sort select */}
          <div className="w-[210px] shrink-0">
            <Select
              aria-label="Sort products"
              value={state.sort}
              onChange={(e) =>
                onChange({ ...state, sort: e.target.value as ShopSort, page: 1 })
              }
              options={SHOP_SORT_OPTIONS.map((opt) => ({
                value: opt.value,
                label: `Sort: ${opt.label}`,
              }))}
            />
          </div>
        </div>

        {/* Expandable Desktop Filter Tray (Formats, USD Price Ranges, Made-for Tags) */}
        {desktopFiltersOpen && (
          <div className="rounded-[28px] bg-surface border border-line shadow-[var(--shadow-float)] p-6 grid grid-cols-12 gap-6">
            {/* Formats */}
            <div className="col-span-4 flex flex-col gap-3">
              <span className="type-label text-ink-2">Formats</span>
              <div className="flex flex-wrap gap-2">
                {availableFormats.map((fmt) => {
                  const selected = state.formats.some(
                    (f) => f.toLowerCase() === fmt.toLowerCase()
                  );
                  return (
                    <Chip
                      key={fmt}
                      active={selected}
                      onClick={() =>
                        onChange({
                          ...state,
                          formats: toggleArrayValue(state.formats, fmt),
                          page: 1,
                        })
                      }
                    >
                      {fmt}
                    </Chip>
                  );
                })}
              </div>
            </div>

            {/* USD Price Ranges */}
            <div className="col-span-4 flex flex-col gap-3 border-x border-line px-6">
              <span className="type-label text-ink-2">Price (USD)</span>
              <div className="flex flex-wrap gap-2">
                {PRICE_RANGE_OPTIONS.map((opt) => {
                  const selected = state.priceRange === opt.id;
                  return (
                    <Chip
                      key={opt.id}
                      active={selected}
                      onClick={() =>
                        onChange({
                          ...state,
                          priceRange: selected ? '' : opt.id,
                          page: 1,
                        })
                      }
                    >
                      {opt.label}
                    </Chip>
                  );
                })}
              </div>
            </div>

            {/* Made-for tags */}
            <div className="col-span-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="type-label text-ink-2">Made for</span>
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="text-xs font-medium text-brand-deep hover:underline cursor-pointer"
                  >
                    Clear all
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => {
                  const selected = state.tags.some(
                    (t) => t.toLowerCase() === tag.toLowerCase()
                  );
                  return (
                    <Chip
                      key={tag}
                      active={selected}
                      onClick={() =>
                        onChange({
                          ...state,
                          tags: toggleArrayValue(state.tags, tag),
                          page: 1,
                        })
                      }
                    >
                      {formatTagLabel(tag)}
                    </Chip>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================== MOBILE FILTER RAIL & CONTROLS (<1024px) ==================== */}
      <div className="flex lg:hidden flex-col gap-3">
        {!omitCollection && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6 kv-scroll-snap"
            aria-label="Filter by collection"
          >
            <Chip
              active={!state.collection}
              onClick={() => onChange({ ...state, collection: '', page: 1 })}
              className="shrink-0"
            >
              All
            </Chip>
            {collections.map((col) => (
              <Chip
                key={col.slug}
                active={state.collection === col.slug}
                onClick={() =>
                  onChange({
                    ...state,
                    collection: state.collection === col.slug ? '' : col.slug,
                    page: 1,
                  })
                }
                className="shrink-0"
              >
                {col.name}
              </Chip>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setMobileSheetOpen(true)}
            className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-surface border border-line-strong hover:border-ink text-sm font-medium text-ink transition-colors kv-press cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            <SlidersHorizontal size={16} strokeWidth={1.75} aria-hidden="true" />
            <span>Filter &amp; sort</span>
            {activeCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-ink text-white font-mono text-[11px] tabular-nums">
                {activeCount}
              </span>
            )}
          </button>

          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2 tabular-nums">
            {loading ? 'Loading…' : `${totalCount} ${totalCount === 1 ? 'system' : 'systems'}`}
          </span>
        </div>
      </div>

      {/* ==================== ACTIVE REMOVABLE FILTER CHIPS ==================== */}
      {activeChips.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2"
          aria-label="Active filters"
        >
          {activeChips.map((chip) => (
            <button
              key={`${chip.kind}-${chip.value}`}
              type="button"
              onClick={() => handleRemoveChip(chip)}
              className="inline-flex items-center gap-1.5 min-h-[36px] pl-3.5 pr-2.5 rounded-full bg-surface border border-ink/20 hover:border-ink text-xs font-medium text-ink transition-colors kv-press cursor-pointer focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
              aria-label={`Remove filter ${chip.label}`}
            >
              <span>{chip.label}</span>
              <X size={14} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
            </button>
          ))}
          <Button variant="quiet" size="sm" onClick={onClearAll}>
            Clear all
          </Button>
        </div>
      )}

      {/* ==================== MOBILE FILTER BOTTOM SHEET ==================== */}
      <Sheet
        open={mobileSheetOpen}
        onClose={() => setMobileSheetOpen(false)}
        title="Filter & sort"
        description="Narrow systems by format, price or discipline."
        footer={
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={clearMobileDraft}
              className="shrink-0"
            >
              Clear all
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={applyMobileDraft}
              className="flex-1 min-w-0"
            >
              {applyLabel}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6">
          {/* Sort */}
          <div className="flex flex-col gap-2.5">
            <span className="type-label text-ink-2">Sort by</span>
            <div className="flex flex-wrap gap-2">
              {SHOP_SORT_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  active={mobileDraft.sort === opt.value}
                  onClick={() => setMobileDraft((d) => ({ ...d, sort: opt.value }))}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>

          {/* Collections (on /shop) */}
          {!omitCollection && collections.length > 0 && (
            <div className="flex flex-col gap-2.5 pt-4 border-t border-line">
              <span className="type-label text-ink-2">Collection</span>
              <div className="flex flex-wrap gap-2">
                <Chip
                  active={!mobileDraft.collection}
                  onClick={() => setMobileDraft((d) => ({ ...d, collection: '' }))}
                >
                  All
                </Chip>
                {collections.map((col) => (
                  <Chip
                    key={col.slug}
                    active={mobileDraft.collection === col.slug}
                    onClick={() =>
                      setMobileDraft((d) => ({
                        ...d,
                        collection: d.collection === col.slug ? '' : col.slug,
                      }))
                    }
                  >
                    {col.name}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Formats */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-line">
            <span className="type-label text-ink-2">Formats</span>
            <div className="flex flex-wrap gap-2">
              {availableFormats.map((fmt) => {
                const selected = mobileDraft.formats.some(
                  (f) => f.toLowerCase() === fmt.toLowerCase()
                );
                return (
                  <Chip
                    key={fmt}
                    active={selected}
                    onClick={() =>
                      setMobileDraft((d) => ({
                        ...d,
                        formats: toggleArrayValue(d.formats, fmt),
                      }))
                    }
                  >
                    {fmt}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* USD Price Ranges */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-line">
            <span className="type-label text-ink-2">Price (USD)</span>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGE_OPTIONS.map((opt) => {
                const selected = mobileDraft.priceRange === opt.id;
                return (
                  <Chip
                    key={opt.id}
                    active={selected}
                    onClick={() =>
                      setMobileDraft((d) => ({
                        ...d,
                        priceRange: (selected ? '' : opt.id) as PriceRangeId,
                      }))
                    }
                  >
                    {opt.label}
                  </Chip>
                );
              })}
            </div>
          </div>

          {/* Made-for tags */}
          <div className="flex flex-col gap-2.5 pt-4 border-t border-line">
            <span className="type-label text-ink-2">Made for</span>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => {
                const selected = mobileDraft.tags.some(
                  (t) => t.toLowerCase() === tag.toLowerCase()
                );
                return (
                  <Chip
                    key={tag}
                    active={selected}
                    onClick={() =>
                      setMobileDraft((d) => ({
                        ...d,
                        tags: toggleArrayValue(d.tags, tag),
                      }))
                    }
                  >
                    {formatTagLabel(tag)}
                  </Chip>
                );
              })}
            </div>
          </div>
        </div>
      </Sheet>
    </>
  );
}
