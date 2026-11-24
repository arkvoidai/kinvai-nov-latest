import { useEffect, useRef, useState } from 'react';
import { accentToBgClass } from '../../lib/data/format';
import type { CollectionAccent } from '../../lib/data/types';
import { getProductMediaSrcSet } from '../../lib/media/imagePipeline';

export type ProductImageRatio = '4/5' | '4/3' | '1/1' | '16/9';

const RATIO_CONFIG: Record<
  ProductImageRatio,
  { aspectClass: string; width: number; height: number }
> = {
  '4/5': { aspectClass: 'aspect-[4/5]', width: 960, height: 1200 },
  '4/3': { aspectClass: 'aspect-[4/3]', width: 960, height: 720 },
  '1/1': { aspectClass: 'aspect-square', width: 960, height: 960 },
  '16/9': { aspectClass: 'aspect-video', width: 1280, height: 720 },
};

export interface ProductImageProps {
  /** Base storage path ("products/{productId}/{mediaId}") or runtime data/blob URI */
  base: string;
  alt: string;
  ratio?: ProductImageRatio;
  sizes?: string;
  priority?: boolean;
  accent?: CollectionAccent | null;
  width?: number;
  height?: number;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Responsive product artwork component.
 * Builds a 480 / 960 / 1600 WebP srcSet from Supabase Storage `product-media`,
 * reserves exact aspect-ratio geometry (zero CLS), holds the flat collection tint
 * while loading, and fades in over 240ms.
 */
export function ProductImage({
  base,
  alt,
  ratio = '4/5',
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  accent = 'cocoa',
  width,
  height,
  className = '',
  onLoad,
  onError,
}: ProductImageProps) {
  const media = getProductMediaSrcSet(base);
  const ratioSpec = RATIO_CONFIG[ratio];
  const bgClass = accentToBgClass(accent);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Reset loaded state when source changes; mark loaded immediately if already decoded in cache
  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    } else {
      setLoaded(false);
    }
  }, [media?.src]);

  if (!media) {
    return (
      <div
        className={`relative w-full ${ratioSpec.aspectClass} ${bgClass} rounded-[22px] overflow-hidden ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={`relative w-full ${ratioSpec.aspectClass} ${bgClass} rounded-[22px] overflow-hidden ${className}`}
    >
      <img
        ref={imgRef}
        src={media.src}
        srcSet={media.srcSet}
        sizes={sizes}
        alt={alt}
        width={width ?? ratioSpec.width}
        height={height ?? ratioSpec.height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : undefined}
        decoding="async"
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoaded(true);
          onLoad?.();
        }}
        onError={() => {
          onError?.();
        }}
        className={`block w-full h-full object-cover transition-opacity duration-[240ms] ease-out ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
