import type { CollectionAccent, Product } from './types';

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formats integer USD cents with Intl.NumberFormat en-US USD.
 * Whole dollar amounts render cleanly as "$49"; fractional cents as "$49.50".
 */
export function formatPrice(cents: number): string {
  const safeCents = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  const dollars = safeCents / 100;
  if (safeCents % 100 === 0) {
    return usdFormatter.format(dollars);
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}

export type TileTintVariant = 'tint-peach' | 'tint-butter' | 'tint-lilac' | 'tint-rose' | 'stone';

/**
 * Maps collections.accent directly to flat Porcelain & Pop tint tokens:
 * apricot=peach, butter=butter, lilac=lilac, rose=rose, cocoa=stone.
 */
export function accentToTileVariant(accent: CollectionAccent | null | undefined): TileTintVariant {
  switch (accent) {
    case 'apricot':
      return 'tint-peach';
    case 'butter':
      return 'tint-butter';
    case 'lilac':
      return 'tint-lilac';
    case 'rose':
      return 'tint-rose';
    case 'cocoa':
    default:
      return 'stone';
  }
}

export function accentToBgClass(accent: CollectionAccent | null | undefined): string {
  switch (accent) {
    case 'apricot':
      return 'bg-peach';
    case 'butter':
      return 'bg-butter';
    case 'lilac':
      return 'bg-lilac';
    case 'rose':
      return 'bg-rose';
    case 'cocoa':
    default:
      return 'bg-stone';
  }
}

/**
 * product.description may be null: always fall back to short_description.
 */
export function getProductDescription(product: Pick<Product, 'description' | 'short_description'>): string {
  return product.description?.trim() || product.short_description?.trim() || '';
}
