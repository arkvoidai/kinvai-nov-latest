import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildPaymentAssuranceCopy,
  cycleIndex,
  extractUniqueFormats,
  filterLibraryProducts,
  orderCanonicalCollections,
  selectSpotlightProducts,
} from './homeHelpers';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '../data/seed';

test('extractUniqueFormats deduplicates case-insensitively and returns empty array when none exist', () => {
  assert.deepEqual(extractUniqueFormats([]), []);
  assert.deepEqual(extractUniqueFormats([{ file_formats: [] }]), []);
  assert.deepEqual(
    extractUniqueFormats([
      { file_formats: ['XLSX', 'Notion', 'PDF'] },
      { file_formats: ['pdf', 'Figma', '  ', 'SVG'] },
    ]),
    ['XLSX', 'Notion', 'PDF', 'Figma', 'SVG']
  );
});

test('buildPaymentAssuranceCopy exposes provider names only when enabled', () => {
  assert.equal(
    buildPaymentAssuranceCopy({ razorpay: true, paypal: true }),
    'Pay with card through Razorpay or PayPal, in USD.'
  );
  assert.equal(
    buildPaymentAssuranceCopy({ razorpay: true, paypal: false }),
    'Pay with card through Razorpay, in USD.'
  );
  assert.equal(
    buildPaymentAssuranceCopy({ razorpay: false, paypal: true }),
    'Pay securely through PayPal, in USD.'
  );
  assert.equal(
    buildPaymentAssuranceCopy({ razorpay: false, paypal: false }),
    'Pay securely online.'
  );
});

test('selectSpotlightProducts caps at 5 unique featured items ordered by featured_rank', () => {
  const featured = SEED_PRODUCTS.filter((p) => p.is_featured);
  const picked = selectSpotlightProducts(featured, SEED_PRODUCTS, 5);
  assert.equal(picked.length, 5);
  assert.equal(new Set(picked.map((p) => p.id)).size, 5);
  assert.equal(picked[0].featured_rank, 1);
});

test('filterLibraryProducts filters client-side by collection slug and caps at 8', () => {
  const all = filterLibraryProducts(SEED_PRODUCTS, 'all', SEED_COLLECTIONS, 8);
  assert.equal(all.length, 8);

  const world = filterLibraryProducts(SEED_PRODUCTS, 'build-the-world', SEED_COLLECTIONS, 8);
  assert.ok(world.length > 0 && world.length <= 8);
  assert.ok(world.every((p) => p.collection_id === 'col-build-the-world'));

  assert.deepEqual(filterLibraryProducts(SEED_PRODUCTS, 'unknown-slug', SEED_COLLECTIONS, 8), []);
});

test('orderCanonicalCollections preserves Run the Shop -> Make the Thing -> Build the World -> Ship the Interface', () => {
  const reversed = [...SEED_COLLECTIONS].reverse();
  const ordered = orderCanonicalCollections(reversed);
  assert.deepEqual(
    ordered.map((c) => c.slug),
    ['run-the-shop', 'make-the-thing', 'build-the-world', 'ship-the-interface']
  );
});

test('cycleIndex wraps forward and backward safely', () => {
  assert.equal(cycleIndex(0, -1, 5), 4);
  assert.equal(cycleIndex(4, 1, 5), 0);
  assert.equal(cycleIndex(2, 1, 5), 3);
  assert.equal(cycleIndex(0, 1, 0), 0);
});
