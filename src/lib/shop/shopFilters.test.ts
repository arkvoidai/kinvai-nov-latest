import assert from 'node:assert/strict';
import test from 'node:test';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '../data/seed';
import {
  countActiveFilters,
  extractFacetOptions,
  getActiveFilterChips,
  getAdjacentCollections,
  parseShopFilters,
  priceRangeToCents,
  removeFilterChip,
  serializeShopFilters,
  shouldSpanWideDesktop,
  toggleArrayValue,
} from './shopFilters';

test('parseShopFilters & serializeShopFilters round-trip URL parameters cleanly', () => {
  const initial = new URLSearchParams(
    'collection=run-the-shop&format=XLSX,PDF&price=25-50&tag=founders,finance&sort=price-asc&q=margin&page=2'
  );
  const parsed = parseShopFilters(initial);

  assert.equal(parsed.collection, 'run-the-shop');
  assert.deepEqual(parsed.formats, ['XLSX', 'PDF']);
  assert.equal(parsed.priceRange, '25-50');
  assert.deepEqual(parsed.tags, ['founders', 'finance']);
  assert.equal(parsed.sort, 'price-asc');
  assert.equal(parsed.q, 'margin');
  assert.equal(parsed.page, 2);

  const serialized = serializeShopFilters(parsed);
  assert.equal(serialized.get('collection'), 'run-the-shop');
  assert.equal(serialized.get('format'), 'XLSX,PDF');
  assert.equal(serialized.get('price'), '25-50');
  assert.equal(serialized.get('tag'), 'founders,finance');
  assert.equal(serialized.get('sort'), 'price-asc');
  assert.equal(serialized.get('q'), 'margin');
  assert.equal(serialized.get('page'), '2');
});

test('parseShopFilters sanitizes invalid sort, price, and page params', () => {
  const parsed = parseShopFilters(new URLSearchParams('sort=invalid&price=free&page=-4'));
  assert.equal(parsed.sort, 'featured');
  assert.equal(parsed.priceRange, '');
  assert.equal(parsed.page, 1);
  assert.equal(serializeShopFilters(parsed).toString(), '');
});

test('priceRangeToCents converts USD filter ranges to exact integer cents', () => {
  assert.deepEqual(priceRangeToCents('under-25'), { priceMin: undefined, priceMax: 2499 });
  assert.deepEqual(priceRangeToCents('25-50'), { priceMin: 2500, priceMax: 5000 });
  assert.deepEqual(priceRangeToCents('50-100'), { priceMin: 5001, priceMax: 10000 });
  assert.deepEqual(priceRangeToCents('100-plus'), { priceMin: 10001, priceMax: undefined });
  assert.deepEqual(priceRangeToCents(''), {});
});

test('getActiveFilterChips and removeFilterChip produce removable chips and reset page to 1', () => {
  const state = parseShopFilters(
    new URLSearchParams('collection=make-the-thing&format=Notion&price=50-100&tag=creators&page=3')
  );
  const chips = getActiveFilterChips(state, SEED_COLLECTIONS);
  assert.equal(chips.length, 4);
  assert.equal(countActiveFilters(state), 4);
  assert.equal(chips[0]?.label, 'Make the Thing');

  const afterRemove = removeFilterChip(state, chips[1]!);
  assert.deepEqual(afterRemove.formats, []);
  assert.equal(afterRemove.page, 1);
  assert.equal(countActiveFilters(afterRemove), 3);
});

test('toggleArrayValue toggles case-insensitively without mutating input', () => {
  const base = ['XLSX', 'PDF'];
  assert.deepEqual(toggleArrayValue(base, 'pdf'), ['XLSX']);
  assert.deepEqual(toggleArrayValue(base, 'Figma'), ['XLSX', 'PDF', 'Figma']);
  assert.deepEqual(base, ['XLSX', 'PDF']);
});

test('extractFacetOptions derives real unique formats and tags from products', () => {
  const facets = extractFacetOptions(SEED_PRODUCTS);
  assert.ok(facets.formats.length > 0);
  assert.ok(facets.tags.length > 0);
  assert.ok(facets.formats.includes('XLSX'));
});

test('shouldSpanWideDesktop spans every 7th card only when balanced on desktop', () => {
  assert.equal(shouldSpanWideDesktop(6, 7), false);
  assert.equal(shouldSpanWideDesktop(6, 12), true);
  assert.equal(shouldSpanWideDesktop(0, 12), false);
  assert.equal(shouldSpanWideDesktop(13, 14), false);
  assert.equal(shouldSpanWideDesktop(13, 16), true);
});

test('getAdjacentCollections returns canonical previous and next collections circularly', () => {
  const first = getAdjacentCollections(SEED_COLLECTIONS, 'run-the-shop');
  assert.equal(first.prev?.slug, 'ship-the-interface');
  assert.equal(first.next?.slug, 'make-the-thing');

  const middle = getAdjacentCollections(SEED_COLLECTIONS, 'build-the-world');
  assert.equal(middle.prev?.slug, 'make-the-thing');
  assert.equal(middle.next?.slug, 'ship-the-interface');
});
