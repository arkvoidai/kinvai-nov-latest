import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildCoverPrompt,
  DEFAULT_IMAGE_BRIEF,
  IMAGE_BRIEFS,
  accentToTintName,
} from '../data/imageBriefs';
import { SEED_COLLECTIONS, SEED_PRODUCTS } from '../data/seed';
import {
  buildProductMediaBasePath,
  computeTargetDimensions,
  getProductMediaSrcSet,
  getProductMediaVariantPath,
  getProductOgImageUrl,
  normalizeMediaBasePath,
} from './imagePipeline';

test('computeTargetDimensions scales 4:5 images down cleanly without distortion', () => {
  const dims = computeTargetDimensions(2400, 3000);
  assert.deepEqual(dims, [
    { variant: 480, width: 480, height: 600 },
    { variant: 960, width: 960, height: 1200 },
    { variant: 1600, width: 1600, height: 2000 },
  ]);
});

test('computeTargetDimensions never upscales small source images', () => {
  const dims = computeTargetDimensions(640, 800);
  assert.deepEqual(dims, [
    { variant: 480, width: 480, height: 600 },
    { variant: 960, width: 640, height: 800 },
    { variant: 1600, width: 640, height: 800 },
  ]);
});

test('storage path helpers follow products/{productId}/{mediaId}/{width}.webp layout', () => {
  const base = buildProductMediaBasePath('prod-123', 'media-abc');
  assert.equal(base, 'products/prod-123/media-abc');
  assert.equal(getProductMediaVariantPath(base, 480), 'products/prod-123/media-abc/480.webp');
  assert.equal(getProductMediaVariantPath(base, 960), 'products/prod-123/media-abc/960.webp');
  assert.equal(getProductMediaVariantPath(base, 1600), 'products/prod-123/media-abc/1600.webp');
  assert.equal(normalizeMediaBasePath('/products/prod-123/media-abc/960.webp'), base);
});

test('getProductMediaSrcSet and getProductOgImageUrl build 480/960/1600 Supabase public URLs', () => {
  const supabaseHost = 'https://example.supabase.co';
  const base = 'products/p1/m1';
  const result = getProductMediaSrcSet(base, supabaseHost);
  assert.ok(result);
  assert.equal(
    result.urls[480],
    'https://example.supabase.co/storage/v1/object/public/product-media/products/p1/m1/480.webp'
  );
  assert.equal(
    result.urls[960],
    'https://example.supabase.co/storage/v1/object/public/product-media/products/p1/m1/960.webp'
  );
  assert.equal(
    result.urls[1600],
    'https://example.supabase.co/storage/v1/object/public/product-media/products/p1/m1/1600.webp'
  );
  assert.equal(
    getProductOgImageUrl(base, supabaseHost),
    'https://example.supabase.co/storage/v1/object/public/product-media/products/p1/m1/1600.webp'
  );
});

test('IMAGE_BRIEFS provides bespoke visual briefs for all 20 seed products', () => {
  assert.equal(SEED_PRODUCTS.length, 20);
  for (const product of SEED_PRODUCTS) {
    const brief = IMAGE_BRIEFS[product.slug];
    assert.ok(brief && brief.length > 25, `Missing visual brief for ${product.slug}`);
  }
});

test('buildCoverPrompt respects image_prompt override, collection tint mapping, and text-free guardrails', () => {
  const sample = SEED_PRODUCTS[0];
  const col = SEED_COLLECTIONS[0]; // apricot -> peach
  assert.equal(accentToTintName('apricot'), 'peach');
  assert.equal(accentToTintName('cocoa'), 'stone');

  const defaultPrompt = buildCoverPrompt(sample, col);
  assert.ok(defaultPrompt.includes(IMAGE_BRIEFS[sample.slug]));
  assert.ok(defaultPrompt.includes('seamless flat matte peach backdrop'));
  assert.ok(defaultPrompt.includes('Portrait 4:5'));
  assert.ok(defaultPrompt.includes('STRICTLY: no text, no letters, no numbers'));

  const customProductPrompt = buildCoverPrompt(
    { ...sample, image_prompt: 'three matte ceramic spheres in soft daylight' },
    { accent: 'lilac' }
  );
  assert.ok(customProductPrompt.includes('three matte ceramic spheres in soft daylight'));
  assert.ok(customProductPrompt.includes('seamless flat matte lilac backdrop'));

  const unknownSlugPrompt = buildCoverPrompt(
    { slug: 'unknown-slug', name: 'New Kit', image_prompt: null },
    null
  );
  assert.ok(unknownSlugPrompt.includes(DEFAULT_IMAGE_BRIEF));
  assert.ok(unknownSlugPrompt.includes('seamless flat matte stone backdrop'));
});
