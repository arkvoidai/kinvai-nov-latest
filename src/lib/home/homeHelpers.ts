import type { KinvaiPublicFlags } from '../config';
import type { Collection, Product } from '../data/types';

export const CANONICAL_COLLECTION_SLUGS = [
  'run-the-shop',
  'make-the-thing',
  'build-the-world',
  'ship-the-interface',
] as const;

/**
 * Extracts unique non-empty file format labels from published products for the Format Strip.
 * Returns [] if no formats exist (caller hides the strip).
 */
export function extractUniqueFormats(products: readonly Pick<Product, 'file_formats'>[]): string[] {
  const seen = new Set<string>();
  const formats: string[] = [];

  for (const product of products) {
    for (const raw of product.file_formats ?? []) {
      const clean = raw.trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        formats.push(clean);
      }
    }
  }

  return formats;
}

/**
 * Builds the accurate checkout assurance sentence strictly reflecting enabled payment provider flags.
 * Shows a provider name ONLY when its public flag is enabled; otherwise falls back to "Pay securely online."
 */
export function buildPaymentAssuranceCopy(
  flags: Pick<KinvaiPublicFlags, 'razorpay' | 'paypal'>
): string {
  if (flags.razorpay && flags.paypal) {
    return 'Pay with card through Razorpay or PayPal, in USD.';
  }
  if (flags.razorpay) {
    return 'Pay with card through Razorpay, in USD.';
  }
  if (flags.paypal) {
    return 'Pay securely through PayPal, in USD.';
  }
  return 'Pay securely online.';
}

/**
 * Selects up to `max` spotlight products (default 5), prioritizing featured items by featured_rank.
 */
export function selectSpotlightProducts(
  featured: readonly Product[],
  allProducts: readonly Product[],
  max = 5
): Product[] {
  const seen = new Set<string>();
  const picked: Product[] = [];

  const sortedFeatured = [...featured].sort(
    (a, b) => (a.featured_rank ?? 999) - (b.featured_rank ?? 999)
  );

  for (const item of [...sortedFeatured, ...allProducts]) {
    if (picked.length >= max) break;
    if (!seen.has(item.id)) {
      seen.add(item.id);
      picked.push(item);
    }
  }

  return picked;
}

/**
 * Selects up to `count` products for the "Start here." staggered mosaic.
 */
export function selectMosaicProducts(
  featured: readonly Product[],
  allProducts: readonly Product[],
  count = 4
): Product[] {
  return selectSpotlightProducts(featured, allProducts, count);
}

/**
 * Filters catalogue preview products client-side by collection slug ('all' or slug), capped at `max`.
 */
export function filterLibraryProducts(
  products: readonly Product[],
  activeSlug: string,
  collections: readonly Collection[],
  max = 8
): Product[] {
  if (!activeSlug || activeSlug === 'all') {
    return products.slice(0, max);
  }
  const target = collections.find((c) => c.slug === activeSlug);
  if (!target) return [];
  return products.filter((p) => p.collection_id === target.id).slice(0, max);
}

/**
 * Orders collections in canonical homepage bento order (Run the Shop, Make the Thing,
 * Build the World, Ship the Interface), appending any additional collections by sort_order.
 */
export function orderCanonicalCollections(collections: readonly Collection[]): Collection[] {
  const rank = new Map<string, number>(
    CANONICAL_COLLECTION_SLUGS.map((slug, idx) => [slug, idx])
  );
  return [...collections].sort((a, b) => {
    const ra = rank.get(a.slug) ?? 100 + a.sort_order;
    const rb = rank.get(b.slug) ?? 100 + b.sort_order;
    return ra - rb;
  });
}

/**
 * Cycles an index safely within [0, length - 1].
 */
export function cycleIndex(current: number, delta: number, length: number): number {
  if (length <= 0) return 0;
  return ((current + delta) % length + length) % length;
}
