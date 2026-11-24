import type { Collection, Product, ProductMedia } from '../data/types';

export type PurchaseState = 'preview' | 'owned' | 'in-cart' | 'not-owned';

export interface PurchaseStateInput {
  isPreviewData: boolean;
  isOwned: boolean;
  isInCart: boolean;
}

/**
 * Pure state machine resolving the product purchase UI state.
 */
export function resolvePurchaseState({
  isPreviewData,
  isOwned,
  isInCart,
}: PurchaseStateInput): PurchaseState {
  if (isOwned) return 'owned';
  if (isPreviewData) return 'preview';
  if (isInCart) return 'in-cart';
  return 'not-owned';
}

export type SecondaryTile =
  | {
      id: string;
      kind: 'media';
      media: ProductMedia;
      lightboxIndex: number;
    }
  | {
      id: string;
      kind: 'file-tree';
      rootLabel: string;
      entries: string[];
    }
  | {
      id: string;
      kind: 'formats';
      formats: string[];
    }
  | {
      id: string;
      kind: 'made-for';
      audienceLine: string;
      audienceCount: number;
    };

export type GallerySlide =
  | {
      id: string;
      kind: 'cover';
      label: string;
      alt: string;
      storagePath: string | null;
      lightboxIndex: number | null;
    }
  | {
      id: string;
      kind: 'media';
      label: string;
      alt: string;
      media: ProductMedia;
      lightboxIndex: number;
    }
  | {
      id: string;
      kind: 'peek-file-tree';
      label: string;
      rootLabel: string;
      entries: string[];
    }
  | {
      id: string;
      kind: 'peek-formats';
      label: string;
      formats: string[];
    }
  | {
      id: string;
      kind: 'peek-made-for';
      label: string;
      audienceLine: string;
      audienceCount: number;
    };

export interface LightboxImageItem {
  id: string;
  storagePath: string;
  alt: string;
  width: number | null;
  height: number | null;
}

/**
 * Collects real, openable lightbox images from cover_path + product_media.
 * Deduplicates by storage_path and never invents images.
 */
export function collectLightboxImages(
  product: Pick<Product, 'id' | 'name' | 'cover_path'>,
  media: readonly ProductMedia[]
): LightboxImageItem[] {
  const seen = new Set<string>();
  const items: LightboxImageItem[] = [];

  if (product.cover_path && product.cover_path.trim().length > 0) {
    const clean = product.cover_path.trim();
    seen.add(clean);
    const matchingCoverMedia = media.find((m) => m.storage_path.trim() === clean);
    items.push({
      id: matchingCoverMedia?.id ?? `cover-${product.id}`,
      storagePath: clean,
      alt: matchingCoverMedia?.alt || `${product.name} cover`,
      width: matchingCoverMedia?.width ?? 1200,
      height: matchingCoverMedia?.height ?? 1500,
    });
  }

  const ordered = [...media].sort((a, b) => a.sort_order - b.sort_order);
  for (const item of ordered) {
    const clean = item.storage_path.trim();
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    items.push({
      id: item.id,
      storagePath: clean,
      alt: item.alt || `${product.name} preview`,
      width: item.width,
      height: item.height,
    });
  }

  return items;
}

/**
 * Builds deterministic file-tree display entries strictly from real product includes[].
 */
export function buildFileTreeEntries(
  product: Pick<Product, 'sku' | 'slug' | 'includes'>
): { rootLabel: string; entries: string[] } {
  const slugBase = product.slug.trim() || product.sku.toLowerCase();
  const entries = product.includes
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return {
    rootLabel: `${slugBase}/`,
    entries,
  };
}

/**
 * Builds up to 3 secondary visual tiles beneath/beside the main hero cover.
 * Uses real `product_media` gallery/preview images first; fills remaining slots
 * exclusively from real product data (File-tree -> Formats -> Made-for) without inventing data.
 */
export function buildSecondaryTiles(
  product: Pick<Product, 'id' | 'sku' | 'slug' | 'name' | 'cover_path' | 'includes' | 'file_formats' | 'audience'>,
  media: readonly ProductMedia[]
): SecondaryTile[] {
  const lightboxImages = collectLightboxImages(product, media);
  const coverPath = product.cover_path?.trim() ?? '';

  const galleryMedia = [...media]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((m) => m.storage_path.trim() !== coverPath);

  const tiles: SecondaryTile[] = [];

  for (const item of galleryMedia.slice(0, 3)) {
    const idx = lightboxImages.findIndex((img) => img.storagePath === item.storage_path.trim());
    tiles.push({
      id: `media-${item.id}`,
      kind: 'media',
      media: item,
      lightboxIndex: idx >= 0 ? idx : 0,
    });
  }

  if (tiles.length < 3 && product.includes.length > 0) {
    const tree = buildFileTreeEntries(product);
    tiles.push({
      id: 'peek-file-tree',
      kind: 'file-tree',
      rootLabel: tree.rootLabel,
      entries: tree.entries,
    });
  }

  if (tiles.length < 3 && product.file_formats.length > 0) {
    tiles.push({
      id: 'peek-formats',
      kind: 'formats',
      formats: product.file_formats,
    });
  }

  if (tiles.length < 3 && product.audience.length > 0) {
    tiles.push({
      id: 'peek-made-for',
      kind: 'made-for',
      audienceLine: product.audience[0],
      audienceCount: product.audience.length,
    });
  }

  return tiles.slice(0, 3);
}

/**
 * Builds mobile swipeable slides (main cover first, then real media or data-backed peek slides).
 */
export function buildMobileGallerySlides(
  product: Pick<Product, 'id' | 'sku' | 'slug' | 'name' | 'cover_path' | 'includes' | 'file_formats' | 'audience'>,
  collection: Pick<Collection, 'name'> | null | undefined,
  media: readonly ProductMedia[]
): GallerySlide[] {
  const lightboxImages = collectLightboxImages(product, media);
  const coverLightboxIndex = product.cover_path
    ? lightboxImages.findIndex((i) => i.storagePath === product.cover_path?.trim())
    : -1;

  const slides: GallerySlide[] = [
    {
      id: `cover-${product.id}`,
      kind: 'cover',
      label: collection?.name || 'Cover',
      alt: product.name,
      storagePath: product.cover_path,
      lightboxIndex: coverLightboxIndex >= 0 ? coverLightboxIndex : null,
    },
  ];

  const secondary = buildSecondaryTiles(product, media);
  for (const tile of secondary) {
    if (tile.kind === 'media') {
      slides.push({
        id: tile.id,
        kind: 'media',
        label: tile.media.alt || 'Preview',
        alt: tile.media.alt || `${product.name} preview`,
        media: tile.media,
        lightboxIndex: tile.lightboxIndex,
      });
    } else if (tile.kind === 'file-tree') {
      slides.push({
        id: tile.id,
        kind: 'peek-file-tree',
        label: "What's inside",
        rootLabel: tile.rootLabel,
        entries: tile.entries,
      });
    } else if (tile.kind === 'formats') {
      slides.push({
        id: tile.id,
        kind: 'peek-formats',
        label: 'Formats',
        formats: tile.formats,
      });
    } else if (tile.kind === 'made-for') {
      slides.push({
        id: tile.id,
        kind: 'peek-made-for',
        label: 'Made for',
        audienceLine: tile.audienceLine,
        audienceCount: tile.audienceCount,
      });
    }
  }

  return slides;
}

/**
 * Ranks related products strictly from real candidates in the same collection
 * by shared tag overlap count, then featured rank. Never fabricates products.
 */
export function rankRelatedProducts(
  current: Pick<Product, 'id' | 'collection_id' | 'tags'>,
  candidates: readonly Product[],
  limit = 4
): Product[] {
  const currentTags = new Set(current.tags.map((t) => t.trim().toLowerCase()).filter(Boolean));

  const sameCollection = candidates.filter(
    (p) =>
      p.id !== current.id &&
      p.status === 'published' &&
      current.collection_id !== null &&
      p.collection_id === current.collection_id
  );

  const scored = sameCollection.map((product) => {
    const overlap = product.tags.reduce((count, tag) => {
      return count + (currentTags.has(tag.trim().toLowerCase()) ? 1 : 0);
    }, 0);
    return { product, overlap };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    const aFeat = a.product.is_featured ? 0 : 1;
    const bFeat = b.product.is_featured ? 0 : 1;
    if (aFeat !== bFeat) return aFeat - bFeat;
    const aRank = a.product.featured_rank ?? 999;
    const bRank = b.product.featured_rank ?? 999;
    if (aRank !== bRank) return aRank - bRank;
    return a.product.name.localeCompare(b.product.name);
  });

  return scored.slice(0, Math.max(0, limit)).map((item) => item.product);
}

/**
 * Formats ISO date string for product Details ("Jan 10, 2026") or returns null if invalid.
 */
export function formatLastUpdated(isoDate: string | null | undefined): string | null {
  if (!isoDate) return null;
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/**
 * Produces a valid, deterministic CSS view-transition-name for a product cover.
 */
export function getProductCoverTransitionName(slug: string): string {
  const clean = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `kv-cover-${clean || 'item'}`;
}

/**
 * Maps Supabase review insert errors (including RLS and unique-constraint errors)
 * into calm, readable copy without leaking database internals.
 */
export function mapReviewSubmitError(error?: { code?: string; message?: string } | null): string {
  if (!error) return "That didn't work. Try again, or write to heyarkvoid@gmail.com.";
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  if (code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
    return 'You have already submitted a review for this product.';
  }
  if (
    code === '42501' ||
    msg.includes('row-level security') ||
    msg.includes('permission denied') ||
    msg.includes('rls')
  ) {
    return 'Only verified buyers signed in with their purchasing account can post a review.';
  }
  if (code === '23514' || msg.includes('check constraint')) {
    return 'Please choose a rating between 1 and 5 stars and include a short note.';
  }
  return "That didn't work. Try again, or write to heyarkvoid@gmail.com.";
}
