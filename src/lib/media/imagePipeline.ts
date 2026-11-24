import { getSupabaseBrowserClient } from '../supabase/client';
import type { CollectionAccent } from '../data/types';

export const IMAGE_VARIANT_WIDTHS = [480, 960, 1600] as const;
export type ImageVariantWidth = (typeof IMAGE_VARIANT_WIDTHS)[number];

export const PRODUCT_MEDIA_BUCKET = 'product-media';
export const IMAGE_WEBP_QUALITY = 0.82;

export interface TargetDimension {
  variant: ImageVariantWidth;
  width: number;
  height: number;
}

export interface ProcessedImageVariant {
  variant: ImageVariantWidth;
  width: number;
  height: number;
  blob: Blob;
}

export interface ProcessedImageResult {
  width: number;
  height: number;
  blobs: Record<ImageVariantWidth, Blob>;
  variants: ProcessedImageVariant[];
}

export interface ProductMediaSrcSet {
  src: string;
  srcSet: string;
  urls: Record<ImageVariantWidth, string>;
}

/**
 * Pure dimension calculator for the 480 / 960 / 1600 responsive WebP pipeline.
 * Never upscales past the intrinsic width and strictly preserves aspect ratio.
 */
export function computeTargetDimensions(
  intrinsicWidth: number,
  intrinsicHeight: number,
  widths: readonly ImageVariantWidth[] = IMAGE_VARIANT_WIDTHS
): TargetDimension[] {
  if (!Number.isFinite(intrinsicWidth) || !Number.isFinite(intrinsicHeight) || intrinsicWidth <= 0 || intrinsicHeight <= 0) {
    throw new Error('Intrinsic image dimensions must be positive numbers.');
  }

  const safeW = Math.round(intrinsicWidth);
  const safeH = Math.round(intrinsicHeight);

  return widths.map((variant) => {
    const targetW = Math.min(variant, safeW);
    const targetH = Math.max(1, Math.round((targetW * safeH) / safeW));
    return {
      variant,
      width: targetW,
      height: targetH,
    };
  });
}

/**
 * Normalizes a product-media storage base path: "products/{productId}/{mediaId}".
 */
export function normalizeMediaBasePath(basePath: string): string {
  return basePath
    .trim()
    .replace(/^\/+/, '')
    .replace(/\/+$/, '')
    .replace(/\/(480|960|1600)\.webp$/i, '');
}

/**
 * Builds the canonical storage base path stored in product_media.storage_path & products.cover_path.
 */
export function buildProductMediaBasePath(productId: string, mediaId: string): string {
  const cleanProduct = productId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanMedia = mediaId.trim().replace(/[^a-zA-Z0-9_-]/g, '');
  if (!cleanProduct || !cleanMedia) {
    throw new Error('productId and mediaId are required to build a media storage path.');
  }
  return `products/${cleanProduct}/${cleanMedia}`;
}

/**
 * Returns the exact bucket object path for a given responsive width variant.
 */
export function getProductMediaVariantPath(basePath: string, width: ImageVariantWidth): string {
  const normalized = normalizeMediaBasePath(basePath);
  return `${normalized}/${width}.webp`;
}

function isDirectImageUri(value: string): boolean {
  return (
    value.startsWith('data:') ||
    value.startsWith('blob:') ||
    value.startsWith('http://') ||
    value.startsWith('https://')
  );
}

/**
 * Resolves the public URL for a single responsive variant via Supabase Storage
 * (`supabase.storage.from('product-media').getPublicUrl(...)`) or explicit base URL in SSR/tests.
 */
export function resolveProductMediaVariantUrl(
  basePath: string | null | undefined,
  width: ImageVariantWidth,
  supabaseUrlOverride?: string | null
): string | null {
  if (!basePath) return null;
  const trimmed = basePath.trim();
  if (!trimmed) return null;

  // Allow runtime data:/blob: URIs (used for local previews & Cover lab tests) or already-resolved URLs
  if (isDirectImageUri(trimmed)) {
    return trimmed;
  }

  const objectPath = getProductMediaVariantPath(trimmed, width);

  if (supabaseUrlOverride) {
    const cleanHost = supabaseUrlOverride.trim().replace(/\/+$/, '');
    if (!cleanHost) return null;
    return `${cleanHost}/storage/v1/object/public/${PRODUCT_MEDIA_BUCKET}/${objectPath}`;
  }

  const client = getSupabaseBrowserClient();
  if (!client) return null;
  const { data } = client.storage.from(PRODUCT_MEDIA_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl || null;
}

/**
 * Builds responsive srcSet + default src from a product-media base path.
 */
export function getProductMediaSrcSet(
  basePath: string | null | undefined,
  supabaseUrlOverride?: string | null
): ProductMediaSrcSet | null {
  if (!basePath) return null;
  const trimmed = basePath.trim();
  if (!trimmed) return null;

  if (isDirectImageUri(trimmed)) {
    return {
      src: trimmed,
      srcSet: `${trimmed} 480w, ${trimmed} 960w, ${trimmed} 1600w`,
      urls: {
        480: trimmed,
        960: trimmed,
        1600: trimmed,
      },
    };
  }

  const u480 = resolveProductMediaVariantUrl(trimmed, 480, supabaseUrlOverride);
  const u960 = resolveProductMediaVariantUrl(trimmed, 960, supabaseUrlOverride);
  const u1600 = resolveProductMediaVariantUrl(trimmed, 1600, supabaseUrlOverride);

  if (!u480 || !u960 || !u1600) return null;

  return {
    src: u960,
    srcSet: `${u480} 480w, ${u960} 960w, ${u1600} 1600w`,
    urls: {
      480: u480,
      960: u960,
      1600: u1600,
    },
  };
}

/**
 * Resolves the 1600.webp variant URL for OpenGraph / Twitter product and collection cards.
 */
export function getProductOgImageUrl(
  coverPath: string | null | undefined,
  supabaseUrlOverride?: string | null
): string | null {
  return resolveProductMediaVariantUrl(coverPath, 1600, supabaseUrlOverride);
}

interface LoadedBitmapSource {
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}

async function loadImageSource(input: File | Blob): Promise<LoadedBitmapSource> {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(input);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  const objectUrl = URL.createObjectURL(input);
  return new Promise<LoadedBitmapSource>((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not decode image file.'));
    };
    img.src = objectUrl;
  });
}

function canvasToWebpBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode WebP image on canvas.'));
          return;
        }
        resolve(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * Single client-side image pipeline used for every owner upload and every Gemini output.
 * Resizes on canvas to WebP at 480, 960, and 1600 widths (never upscaling; quality 0.82; aspect preserved).
 */
export async function processImage(input: File | Blob): Promise<ProcessedImageResult> {
  if (typeof document === 'undefined') {
    throw new Error('processImage must run in a browser environment with Canvas support.');
  }

  const loaded = await loadImageSource(input);
  try {
    const dimensions = computeTargetDimensions(loaded.width, loaded.height);
    const variants: ProcessedImageVariant[] = [];

    for (const dim of dimensions) {
      const canvas = document.createElement('canvas');
      canvas.width = dim.width;
      canvas.height = dim.height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not initialize 2D canvas context.');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(loaded.source, 0, 0, dim.width, dim.height);

      const blob = await canvasToWebpBlob(canvas, IMAGE_WEBP_QUALITY);
      variants.push({
        variant: dim.variant,
        width: dim.width,
        height: dim.height,
        blob,
      });
    }

    const blobs: Record<ImageVariantWidth, Blob> = {
      480: variants[0].blob,
      960: variants[1].blob,
      1600: variants[2].blob,
    };

    return {
      width: loaded.width,
      height: loaded.height,
      blobs,
      variants,
    };
  } finally {
    loaded.cleanup();
  }
}

const ACCENT_HEX: Record<CollectionAccent, { bg: string; mid: string; obj: string; shadow: string }> = {
  apricot: { bg: '#FFD9C4', mid: '#F4C3A7', obj: '#FFFFFF', shadow: 'rgba(17,17,17,0.12)' },
  butter: { bg: '#FFEFA8', mid: '#F2DE86', obj: '#FAF8F4', shadow: 'rgba(17,17,17,0.10)' },
  lilac: { bg: '#DDD3FF', mid: '#C5B6F7', obj: '#FFFFFF', shadow: 'rgba(17,17,17,0.11)' },
  rose: { bg: '#FFD3DE', mid: '#F2B8C8', obj: '#FFFFFF', shadow: 'rgba(17,17,17,0.11)' },
  cocoa: { bg: '#EDEAE5', mid: '#DBD6CE', obj: '#FFFFFF', shadow: 'rgba(17,17,17,0.10)' },
};

/**
 * Generates a deterministic runtime 4:5 data-URI still-life test image on Canvas (no external URLs)
 * for verifying <ProductImage> fade-in, responsive sizing, and zero layout shift in Cover lab.
 */
export function createRuntimeCoverTestDataUri(accent: CollectionAccent = 'apricot'): string {
  const palette = ACCENT_HEX[accent];

  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 1200;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Matte studio backdrop with subtle tonal falloff
      const bgGrad = ctx.createRadialGradient(340, 280, 40, 480, 620, 920);
      bgGrad.addColorStop(0, palette.bg);
      bgGrad.addColorStop(1, palette.mid);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 960, 1200);

      // Soft contact shadow ellipse
      ctx.save();
      ctx.fillStyle = palette.shadow;
      ctx.beginPath();
      ctx.ellipse(495, 860, 265, 58, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Object 1: matte porcelain plinth block (centred slightly low)
      ctx.fillStyle = palette.obj;
      ctx.beginPath();
      ctx.roundRect(270, 560, 420, 280, 28);
      ctx.fill();

      // Object 2: sculptural warm stone sphere resting above left
      const sphereGrad = ctx.createRadialGradient(390, 430, 18, 420, 470, 125);
      sphereGrad.addColorStop(0, '#FFFFFF');
      sphereGrad.addColorStop(1, '#E2DDD5');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(420, 470, 110, 0, Math.PI * 2);
      ctx.fill();

      // Object 3: persimmon architectural cylinder accent
      const accentGrad = ctx.createLinearGradient(545, 390, 655, 600);
      accentGrad.addColorStop(0, '#FF7642');
      accentGrad.addColorStop(1, '#E64B12');
      ctx.fillStyle = accentGrad;
      ctx.beginPath();
      ctx.roundRect(545, 415, 110, 200, 55);
      ctx.fill();

      return canvas.toDataURL('image/png');
    }
  }

  // Pure SVG data-URI fallback for environments without 2D canvas
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 1200" width="960" height="1200">` +
    `<rect width="960" height="1200" fill="${palette.bg}"/>` +
    `<ellipse cx="495" cy="860" rx="260" ry="54" fill="rgba(17,17,17,0.10)"/>` +
    `<rect x="270" y="560" width="420" height="280" rx="28" fill="${palette.obj}"/>` +
    `<circle cx="420" cy="470" r="110" fill="#ECE8E1"/>` +
    `<rect x="545" y="415" width="110" height="200" rx="55" fill="#FF5B1F"/>` +
    `</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
