import { useEffect, useState } from 'react';
import type { Collection, CollectionAccent, Product } from '../../lib/data/types';
import { getProductMediaSrcSet } from '../../lib/media/imagePipeline';
import { CoverFallback, type CoverSize } from './CoverFallback';
import { ProductImage, type ProductImageRatio } from './ProductImage';

export interface ProductCoverProps {
  product: Pick<Product, 'name' | 'sku' | 'file_formats' | 'cover_path'>;
  collection?: Pick<Collection, 'name' | 'accent'> | null;
  accent?: CollectionAccent | null;
  ratio?: ProductImageRatio;
  size?: CoverSize;
  sizes?: string;
  priority?: boolean;
  overlaySafe?: boolean;
  className?: string;
}

/**
 * Unified product cover renderer:
 * Displays <ProductImage> whenever a resolved cover_path exists, and gracefully
 * falls back to the Swiss-poster <CoverFallback> otherwise (or on image load error).
 */
export function ProductCover({
  product,
  collection,
  accent,
  ratio = '4/5',
  size = 'md',
  sizes,
  priority = false,
  overlaySafe = false,
  className = '',
}: ProductCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [product.cover_path]);

  const resolvedAccent = accent ?? collection?.accent ?? 'cocoa';
  const hasResolvableImage =
    !imageFailed && Boolean(product.cover_path && getProductMediaSrcSet(product.cover_path));

  if (hasResolvableImage && product.cover_path) {
    return (
      <ProductImage
        base={product.cover_path}
        alt={product.name}
        ratio={ratio}
        sizes={sizes}
        priority={priority}
        accent={resolvedAccent}
        className={className}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <CoverFallback
      product={product}
      collection={collection}
      accent={resolvedAccent}
      ratio={ratio}
      size={size}
      overlaySafe={overlaySafe}
      className={className}
    />
  );
}
