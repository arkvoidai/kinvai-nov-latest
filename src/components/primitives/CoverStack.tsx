import type { Collection, Product } from '../../lib/data/types';
import { ProductCover } from './ProductCover';
import type { CoverSize } from './CoverFallback';
import type { ProductImageRatio } from './ProductImage';

export interface CoverStackProps {
  products: Array<Pick<Product, 'id' | 'name' | 'sku' | 'file_formats' | 'cover_path' | 'collection_id'>>;
  collectionsById?: Map<string, Collection>;
  collection?: Pick<Collection, 'name' | 'accent'> | null;
  ratio?: ProductImageRatio;
  size?: CoverSize;
  className?: string;
}

/**
 * Fans up to 3 product covers with 4-degree rotations and soft overlap
 * using transform only (zero layout shift, reduced-motion safe).
 */
export function CoverStack({
  products,
  collectionsById,
  collection,
  ratio = '4/5',
  size = 'sm',
  className = '',
}: CoverStackProps) {
  const items = products.slice(0, 3);
  if (items.length === 0) return null;

  if (items.length === 1) {
    const prod = items[0];
    const col = collection ?? (prod.collection_id ? collectionsById?.get(prod.collection_id) ?? null : null);
    return (
      <div className={`relative mx-auto w-full max-w-[240px] ${className}`}>
        <ProductCover
          product={prod}
          collection={col}
          ratio={ratio}
          size={size}
          className="border border-ink/10 shadow-[var(--shadow-float)]"
        />
      </div>
    );
  }

  // Visual stacking order: back-left (-4deg), back-right (+4deg), front-center (0deg)
  const front = items[0];
  const left = items[1];
  const right = items[2];

  const resolveCollection = (prod: (typeof items)[number]) =>
    collection ?? (prod.collection_id ? collectionsById?.get(prod.collection_id) ?? null : null);

  return (
    <div
      className={`group/stack relative mx-auto w-full max-w-[320px] pt-3 pb-4 px-6 sm:px-8 ${className}`}
      aria-label={`Preview stack of ${items.length} covers`}
    >
      <div className="relative w-full aspect-[4/5] max-w-[200px] sm:max-w-[220px] mx-auto">
        {left && (
          <div
            className="absolute inset-0 origin-bottom-left -translate-x-5 sm:-translate-x-6 translate-y-1.5 -rotate-[4deg] scale-[0.94] transition-transform duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/stack:-translate-x-7 [@media(hover:hover)_and_(pointer:fine)]:group-hover/stack:-rotate-[6deg]"
            aria-hidden="true"
          >
            <ProductCover
              product={left}
              collection={resolveCollection(left)}
              ratio={ratio}
              size={size}
              className="border border-ink/12 shadow-[0_8px_24px_rgba(17,17,17,0.06)]"
            />
          </div>
        )}

        {right && (
          <div
            className="absolute inset-0 origin-bottom-right translate-x-5 sm:translate-x-6 translate-y-1.5 rotate-[4deg] scale-[0.94] transition-transform duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/stack:translate-x-7 [@media(hover:hover)_and_(pointer:fine)]:group-hover/stack:rotate-[6deg]"
            aria-hidden="true"
          >
            <ProductCover
              product={right}
              collection={resolveCollection(right)}
              ratio={ratio}
              size={size}
              className="border border-ink/12 shadow-[0_8px_24px_rgba(17,17,17,0.06)]"
            />
          </div>
        )}

        <div className="relative z-10 transition-transform duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/stack:-translate-y-1">
          <ProductCover
            product={front}
            collection={resolveCollection(front)}
            ratio={ratio}
            size={size}
            className="border border-ink/14 shadow-[0_12px_32px_rgba(17,17,17,0.09)]"
          />
        </div>
      </div>
    </div>
  );
}
