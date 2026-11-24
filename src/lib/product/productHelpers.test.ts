import test from 'node:test';
import assert from 'node:assert/strict';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '../data/seed';
import type { ProductMedia } from '../data/types';
import { buildCanonicalHref } from '../seo/usePageMeta';
import {
  buildFileTreeEntries,
  buildMobileGallerySlides,
  buildSecondaryTiles,
  collectLightboxImages,
  formatLastUpdated,
  getProductCoverTransitionName,
  mapReviewSubmitError,
  rankRelatedProducts,
  resolvePurchaseState,
} from './productHelpers';

const sampleProduct = SEED_PRODUCTS[0];
const sampleCollection = SEED_COLLECTIONS[0];

test('resolvePurchaseState prioritizes owned, then preview, then in-cart, then not-owned', () => {
  assert.equal(
    resolvePurchaseState({ isPreviewData: true, isOwned: true, isInCart: false }),
    'owned'
  );
  assert.equal(
    resolvePurchaseState({ isPreviewData: true, isOwned: false, isInCart: true }),
    'preview'
  );
  assert.equal(
    resolvePurchaseState({ isPreviewData: false, isOwned: false, isInCart: true }),
    'in-cart'
  );
  assert.equal(
    resolvePurchaseState({ isPreviewData: false, isOwned: false, isInCart: false }),
    'not-owned'
  );
});

test('buildSecondaryTiles falls back strictly to File-tree, Formats, and Made-for when no product_media exists', () => {
  const tiles = buildSecondaryTiles(sampleProduct, []);
  assert.equal(tiles.length, 3);
  assert.equal(tiles[0].kind, 'file-tree');
  assert.equal(tiles[1].kind, 'formats');
  assert.equal(tiles[2].kind, 'made-for');
  if (tiles[0].kind === 'file-tree') {
    assert.deepEqual(tiles[0].entries, sampleProduct.includes);
  }
  if (tiles[2].kind === 'made-for') {
    assert.equal(tiles[2].audienceLine, sampleProduct.audience[0]);
  }
});

test('buildSecondaryTiles omits empty data sections without inventing entries', () => {
  const bare = {
    ...sampleProduct,
    includes: [],
    file_formats: ['PDF'],
    audience: [],
  };
  const tiles = buildSecondaryTiles(bare, []);
  assert.equal(tiles.length, 1);
  assert.equal(tiles[0].kind, 'formats');
});

test('buildSecondaryTiles and collectLightboxImages use real product_media first and deduplicate cover_path', () => {
  const productWithCover = {
    ...sampleProduct,
    cover_path: 'products/p1/cover',
  };
  const media: ProductMedia[] = [
    {
      id: 'm1',
      product_id: productWithCover.id,
      storage_path: 'products/p1/cover',
      kind: 'cover',
      alt: 'Cover image',
      width: 1200,
      height: 1500,
      sort_order: 0,
      source: 'gemini',
    },
    {
      id: 'm2',
      product_id: productWithCover.id,
      storage_path: 'products/p1/g1',
      kind: 'gallery',
      alt: 'Sheet view',
      width: 1600,
      height: 1200,
      sort_order: 1,
      source: 'upload',
    },
    {
      id: 'm3',
      product_id: productWithCover.id,
      storage_path: 'products/p1/g2',
      kind: 'preview',
      alt: 'Checklist view',
      width: 1600,
      height: 1200,
      sort_order: 2,
      source: 'upload',
    },
  ];

  const lightbox = collectLightboxImages(productWithCover, media);
  assert.equal(lightbox.length, 3);
  assert.equal(lightbox[0].storagePath, 'products/p1/cover');
  assert.equal(lightbox[1].storagePath, 'products/p1/g1');
  assert.equal(lightbox[2].storagePath, 'products/p1/g2');

  const tiles = buildSecondaryTiles(productWithCover, media);
  assert.equal(tiles.length, 3);
  assert.equal(tiles[0].kind, 'media');
  assert.equal(tiles[1].kind, 'media');
  assert.equal(tiles[2].kind, 'file-tree');
  if (tiles[0].kind === 'media') {
    assert.equal(tiles[0].lightboxIndex, 1);
  }

  const slides = buildMobileGallerySlides(productWithCover, sampleCollection, media);
  assert.equal(slides.length, 4);
  assert.equal(slides[0].kind, 'cover');
  assert.equal(slides[1].kind, 'media');
  assert.equal(slides[2].kind, 'media');
  assert.equal(slides[3].kind, 'peek-file-tree');
});

test('rankRelatedProducts prioritizes same-collection products by shared tag overlap and excludes self', () => {
  const related = rankRelatedProducts(sampleProduct, SEED_PRODUCTS, 4);
  assert.equal(related.length, 4);
  assert.ok(related.every((p) => p.id !== sampleProduct.id));
  assert.ok(related.every((p) => p.collection_id === sampleProduct.collection_id));

  // Verify tag-overlap ordering is non-increasing
  const currentTags = new Set(sampleProduct.tags.map((t) => t.toLowerCase()));
  const overlaps = related.map(
    (p) => p.tags.filter((t) => currentTags.has(t.toLowerCase())).length
  );
  for (let i = 1; i < overlaps.length; i += 1) {
    assert.ok(overlaps[i - 1] >= overlaps[i]);
  }
});

test('buildFileTreeEntries, formatLastUpdated, getProductCoverTransitionName, and buildCanonicalHref behave cleanly', () => {
  const tree = buildFileTreeEntries(sampleProduct);
  assert.equal(tree.rootLabel, 'marketplace-launch-system/');
  assert.equal(tree.entries.length, sampleProduct.includes.length);

  assert.equal(formatLastUpdated('2026-01-10T09:00:00Z'), 'Jan 10, 2026');
  assert.equal(formatLastUpdated(null), null);
  assert.equal(formatLastUpdated('not-a-date'), null);

  assert.equal(
    getProductCoverTransitionName('Marketplace Launch_System!'),
    'kv-cover-marketplace-launch-system'
  );

  assert.equal(
    buildCanonicalHref('https://kinvai.arkvoid.com/', '/products/marketplace-launch-system/'),
    'https://kinvai.arkvoid.com/products/marketplace-launch-system'
  );
  assert.equal(buildCanonicalHref('https://kinvai.arkvoid.com', '/'), 'https://kinvai.arkvoid.com/');
});

test('mapReviewSubmitError translates RLS and duplicate constraint errors gracefully', () => {
  assert.match(
    mapReviewSubmitError({ code: '42501', message: 'new row violates row-level security policy' }),
    /verified buyers/i
  );
  assert.match(
    mapReviewSubmitError({ code: '23505', message: 'duplicate key value' }),
    /already submitted/i
  );
  assert.match(mapReviewSubmitError(null), /heyarkvoid@gmail\.com/i);
});
