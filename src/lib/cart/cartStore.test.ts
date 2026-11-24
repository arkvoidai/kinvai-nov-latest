import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  addProductIdUnique,
  CART_SCHEMA_VERSION,
  parsePersistedCart,
  removeProductId,
  serializePersistedCart,
} from './cartStore';
import { mergeWishlistIds } from '../wishlist/wishlistStore';
import { filterSearchPages, highlightMatchSegments } from '../search/searchHelpers';
import { buildOAuthRedirectUrl, validateNextPath } from '../auth/authHelpers';

test('serializePersistedCart stores versioned product IDs only', () => {
  const raw = serializePersistedCart(['prod-1', 'prod-2', 'prod-1', '  ']);
  const parsed = JSON.parse(raw) as { version: number; productIds: string[] };
  assert.equal(parsed.version, CART_SCHEMA_VERSION);
  assert.deepEqual(parsed.productIds, ['prod-1', 'prod-2']);
});

test('parsePersistedCart reads v2 and migrates legacy v1 cart payloads', () => {
  const v2 = parsePersistedCart(JSON.stringify({ version: 2, productIds: ['a', 'b', 'a'] }));
  assert.deepEqual(v2, ['a', 'b']);

  const v1 = parsePersistedCart(
    JSON.stringify([
      { productId: 'prod-1', name: 'Old', priceCents: 1900 },
      { productId: 'prod-2', name: 'Old 2', priceCents: 2900 },
      { productId: 'prod-1', name: 'Duplicate', priceCents: 1900 },
    ])
  );
  assert.deepEqual(v1, ['prod-1', 'prod-2']);

  assert.deepEqual(parsePersistedCart('{invalid json'), []);
  assert.deepEqual(parsePersistedCart(null), []);
});

test('addProductIdUnique enforces one licence per product', () => {
  const first = addProductIdUnique([], 'prod-1');
  assert.equal(first.added, true);
  assert.deepEqual(first.next, ['prod-1']);

  const dup = addProductIdUnique(first.next, 'prod-1');
  assert.equal(dup.added, false);
  assert.deepEqual(dup.next, ['prod-1']);

  const removed = removeProductId(['prod-1', 'prod-2'], 'prod-1');
  assert.deepEqual(removed, ['prod-2']);
});

test('mergeWishlistIds combines guest and remote IDs and returns only missing delta', () => {
  const { merged, toInsert } = mergeWishlistIds(['p1', 'p2', 'p3'], ['p2', 'p4']);
  assert.deepEqual(merged, ['p2', 'p4', 'p1', 'p3']);
  assert.deepEqual(toInsert, ['p1', 'p3']);
});

test('highlightMatchSegments splits matched query tokens cleanly', () => {
  const segments = highlightMatchSegments('Marketplace Launch System', 'launch');
  assert.deepEqual(segments, [
    { text: 'Marketplace ', match: false },
    { text: 'Launch', match: true },
    { text: ' System', match: false },
  ]);

  const noQuery = highlightMatchSegments('Pricing Sheet', '   ');
  assert.deepEqual(noQuery, [{ text: 'Pricing Sheet', match: false }]);
});

test('filterSearchPages matches static Kinvai pages', () => {
  const matches = filterSearchPages('licence');
  assert.ok(matches.some((m) => m.to === '/licence'));
  assert.deepEqual(filterSearchPages(''), []);
});

test('validateNextPath enforces same-origin relative paths only', () => {
  assert.equal(validateNextPath('/shop?sort=price'), '/shop?sort=price');
  assert.equal(validateNextPath('/products/launch-system'), '/products/launch-system');
  assert.equal(validateNextPath('//evil.com/phish'), '/account');
  assert.equal(validateNextPath('https://evil.com'), '/account');
  assert.equal(validateNextPath('/\\evil.com'), '/account');
  assert.equal(validateNextPath('/auth/callback?code=123'), '/account');
  assert.equal(validateNextPath('javascript:alert(1)'), '/account');
});

test('buildOAuthRedirectUrl builds clean callback URL with encoded next path', () => {
  const prod = buildOAuthRedirectUrl(
    'https://kinvai.arkvoid.com',
    '/products/launch-system?ref=cart',
    'https://kinvai.arkvoid.com'
  );
  assert.equal(
    prod,
    'https://kinvai.arkvoid.com/auth/callback?next=%2Fproducts%2Flaunch-system%3Fref%3Dcart'
  );

  const preview = buildOAuthRedirectUrl(
    'https://kinvai.arkvoid.com',
    '//evil.com',
    'http://localhost:3000'
  );
  assert.equal(preview, 'http://localhost:3000/auth/callback?next=%2Faccount');
});
