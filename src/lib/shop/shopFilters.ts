import type { Collection, Product, ProductQueryParams } from '../data/types';
import { orderCanonicalCollections } from '../home/homeHelpers';

export type ShopSort = 'featured' | 'newest' | 'price-asc' | 'price-desc';
export type PriceRangeId = '' | 'under-25' | '25-50' | '50-100' | '100-plus';

export interface ShopFilterState {
  collection: string;
  formats: string[];
  priceRange: PriceRangeId;
  tags: string[];
  sort: ShopSort;
  q: string;
  page: number;
}

export interface PriceRangeOption {
  id: Exclude<PriceRangeId, ''>;
  label: string;
  priceMin?: number;
  priceMax?: number;
}

export const SHOP_PAGE_SIZE = 12;

export const SHOP_SORT_OPTIONS: ReadonlyArray<{ value: ShopSort; label: string }> = [
  { value: 'featured', label: 'Featured' },
  { value: 'newest', label: 'Newest' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

export const PRICE_RANGE_OPTIONS: readonly PriceRangeOption[] = [
  { id: 'under-25', label: 'Under $25', priceMax: 2499 },
  { id: '25-50', label: '$25 – $50', priceMin: 2500, priceMax: 5000 },
  { id: '50-100', label: '$50 – $100', priceMin: 5001, priceMax: 10000 },
  { id: '100-plus', label: '$100+', priceMin: 10001 },
];

export const DEFAULT_FORMAT_FACETS = ['XLSX', 'Google Sheets', 'Notion', 'PDF', 'Figma', 'Markdown', 'Obsidian'];

export const DEFAULT_TAG_FACETS = [
  'founders',
  'ecommerce',
  'creators',
  'worldbuilding',
  'design-systems',
  'operations',
  'finance',
  'writers',
];

const VALID_SORTS = new Set<string>(['featured', 'newest', 'price-asc', 'price-desc']);
const VALID_PRICE_RANGES = new Set<string>(['under-25', '25-50', '50-100', '100-plus']);

function splitCsvParam(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const clean = part.trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      out.push(clean);
    }
  }
  return out;
}

/**
 * Parses URL search parameters into a normalized ShopFilterState.
 * Supports multi-select formats & tags (comma-separated or repeated params) and safe defaults.
 */
export function parseShopFilters(params: URLSearchParams): ShopFilterState {
  const collection = (params.get('collection') ?? '').trim();

  const rawFormats = params.getAll('format').flatMap((v) => splitCsvParam(v));
  const formats = Array.from(new Map(rawFormats.map((f) => [f.toLowerCase(), f])).values());

  const rawTags = params.getAll('tag').flatMap((v) => splitCsvParam(v));
  const tags = Array.from(new Map(rawTags.map((t) => [t.toLowerCase(), t])).values());

  const rawPrice = (params.get('price') ?? '').trim();
  const priceRange: PriceRangeId = VALID_PRICE_RANGES.has(rawPrice)
    ? (rawPrice as PriceRangeId)
    : '';

  const rawSort = (params.get('sort') ?? '').trim();
  const sort: ShopSort = VALID_SORTS.has(rawSort) ? (rawSort as ShopSort) : 'featured';

  const q = (params.get('q') ?? '').trim();

  const parsedPage = Number.parseInt(params.get('page') ?? '1', 10);
  const page = Number.isFinite(parsedPage) && parsedPage >= 1 ? parsedPage : 1;

  return {
    collection,
    formats,
    priceRange,
    tags,
    sort,
    q,
    page,
  };
}

/**
 * Serializes ShopFilterState to compact, deterministic URLSearchParams (omitting defaults).
 */
export function serializeShopFilters(
  state: ShopFilterState,
  options: { omitCollection?: boolean } = {}
): URLSearchParams {
  const next = new URLSearchParams();
  if (!options.omitCollection && state.collection) {
    next.set('collection', state.collection);
  }
  if (state.formats.length > 0) {
    next.set('format', state.formats.join(','));
  }
  if (state.priceRange) {
    next.set('price', state.priceRange);
  }
  if (state.tags.length > 0) {
    next.set('tag', state.tags.join(','));
  }
  if (state.sort && state.sort !== 'featured') {
    next.set('sort', state.sort);
  }
  if (state.q.trim()) {
    next.set('q', state.q.trim());
  }
  if (state.page > 1) {
    next.set('page', String(state.page));
  }
  return next;
}

export function priceRangeToCents(
  range: PriceRangeId
): { priceMin?: number; priceMax?: number } {
  const match = PRICE_RANGE_OPTIONS.find((opt) => opt.id === range);
  if (!match) return {};
  return {
    priceMin: match.priceMin,
    priceMax: match.priceMax,
  };
}

export function toProductQueryParams(
  state: ShopFilterState,
  overrides: { collectionSlug?: string; collectionId?: string; pageSize?: number } = {}
): ProductQueryParams {
  const { priceMin, priceMax } = priceRangeToCents(state.priceRange);
  return {
    collection: overrides.collectionSlug ?? (state.collection || undefined),
    collectionId: overrides.collectionId,
    formats: state.formats.length > 0 ? state.formats : undefined,
    tags: state.tags.length > 0 ? state.tags : undefined,
    priceMin,
    priceMax,
    sort: state.sort,
    q: state.q || undefined,
    page: state.page,
    pageSize: overrides.pageSize ?? SHOP_PAGE_SIZE,
  };
}

export interface ActiveFilterChip {
  kind: 'collection' | 'format' | 'price' | 'tag' | 'q';
  value: string;
  label: string;
}

export function getActiveFilterChips(
  state: ShopFilterState,
  collections: readonly Collection[],
  options: { omitCollection?: boolean } = {}
): ActiveFilterChip[] {
  const chips: ActiveFilterChip[] = [];

  if (!options.omitCollection && state.collection) {
    const col = collections.find((c) => c.slug === state.collection);
    chips.push({
      kind: 'collection',
      value: state.collection,
      label: col ? col.name : state.collection,
    });
  }

  for (const fmt of state.formats) {
    chips.push({
      kind: 'format',
      value: fmt,
      label: fmt,
    });
  }

  if (state.priceRange) {
    const match = PRICE_RANGE_OPTIONS.find((p) => p.id === state.priceRange);
    if (match) {
      chips.push({
        kind: 'price',
        value: state.priceRange,
        label: match.label,
      });
    }
  }

  for (const tag of state.tags) {
    chips.push({
      kind: 'tag',
      value: tag,
      label: formatTagLabel(tag),
    });
  }

  if (state.q.trim()) {
    chips.push({
      kind: 'q',
      value: state.q.trim(),
      label: `“${state.q.trim()}”`,
    });
  }

  return chips;
}

export function removeFilterChip(
  state: ShopFilterState,
  chip: ActiveFilterChip
): ShopFilterState {
  switch (chip.kind) {
    case 'collection':
      return { ...state, collection: '', page: 1 };
    case 'format':
      return {
        ...state,
        formats: state.formats.filter((f) => f.toLowerCase() !== chip.value.toLowerCase()),
        page: 1,
      };
    case 'price':
      return { ...state, priceRange: '', page: 1 };
    case 'tag':
      return {
        ...state,
        tags: state.tags.filter((t) => t.toLowerCase() !== chip.value.toLowerCase()),
        page: 1,
      };
    case 'q':
      return { ...state, q: '', page: 1 };
  }
}

export function toggleArrayValue(list: readonly string[], value: string): string[] {
  const exists = list.some((item) => item.toLowerCase() === value.toLowerCase());
  if (exists) {
    return list.filter((item) => item.toLowerCase() !== value.toLowerCase());
  }
  return [...list, value];
}

export function countActiveFilters(
  state: ShopFilterState,
  options: { omitCollection?: boolean } = {}
): number {
  let count = 0;
  if (!options.omitCollection && state.collection) count += 1;
  count += state.formats.length;
  if (state.priceRange) count += 1;
  count += state.tags.length;
  if (state.q.trim()) count += 1;
  return count;
}

export function formatTagLabel(tag: string): string {
  return tag
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (ch) => ch.toUpperCase());
}

/**
 * Derives unique format and made-for tag facet options from published products.
 * Falls back to curated defaults only when no products have been loaded yet.
 */
export function extractFacetOptions(products: readonly Product[]): {
  formats: string[];
  tags: string[];
} {
  if (products.length === 0) {
    return {
      formats: DEFAULT_FORMAT_FACETS,
      tags: DEFAULT_TAG_FACETS,
    };
  }

  const formatMap = new Map<string, string>();
  const tagCounts = new Map<string, { label: string; count: number }>();

  for (const p of products) {
    for (const f of p.file_formats) {
      const clean = f.trim();
      if (clean && !formatMap.has(clean.toLowerCase())) {
        formatMap.set(clean.toLowerCase(), clean);
      }
    }
    for (const t of p.tags) {
      const clean = t.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      const existing = tagCounts.get(key);
      if (existing) existing.count += 1;
      else tagCounts.set(key, { label: clean, count: 1 });
    }
  }

  const formats = Array.from(formatMap.values()).slice(0, 12);
  const tags = Array.from(tagCounts.values())
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .map((entry) => entry.label)
    .slice(0, 12);

  return {
    formats: formats.length > 0 ? formats : DEFAULT_FORMAT_FACETS,
    tags: tags.length > 0 ? tags : DEFAULT_TAG_FACETS,
  };
}

/**
 * Determines whether a card at `index` should use the 2-column wide editorial span on >=1280px desktop.
 * Every 7th card (index 6, 13, ...) spans 2 columns ONLY when enough surrounding items exist
 * so the 4-column desktop grid maintains balanced editorial rhythm.
 */
export function shouldSpanWideDesktop(index: number, totalVisible: number): boolean {
  if (totalVisible < 8) return false;
  return (index + 1) % 7 === 0 && index < totalVisible - 1;
}

/**
 * Returns the previous and next canonical collections for a given collection slug (wrapping circularly).
 */
export function getAdjacentCollections(
  collections: readonly Collection[],
  currentSlug: string
): { prev: Collection | null; next: Collection | null } {
  const ordered = orderCanonicalCollections(collections);
  if (ordered.length <= 1) return { prev: null, next: null };
  const idx = ordered.findIndex((c) => c.slug === currentSlug);
  if (idx === -1) return { prev: null, next: null };
  const prev = ordered[(idx - 1 + ordered.length) % ordered.length] ?? null;
  const next = ordered[(idx + 1) % ordered.length] ?? null;
  return { prev, next };
}
