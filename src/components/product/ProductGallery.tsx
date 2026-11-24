import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Expand,
  FileCode2,
  FolderTree,
  Heart,
  Share2,
  Users,
} from 'lucide-react';
import { accentToBgClass } from '../../lib/data/format';
import type { Collection, Product, ProductMedia } from '../../lib/data/types';
import { KINVAI_EASE, useReducedMotion } from '../../lib/motion';
import {
  buildMobileGallerySlides,
  buildSecondaryTiles,
  collectLightboxImages,
  getProductCoverTransitionName,
  type SecondaryTile,
} from '../../lib/product/productHelpers';
import { IconButton, ProductCover, ProductImage, TagPill } from '../primitives';

export interface ProductGalleryProps {
  product: Product;
  collection: Collection | null;
  media: ProductMedia[];
  saved: boolean;
  isDesktop: boolean;
  onBack: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenLightbox: (index: number) => void;
}

/**
 * ProductGallery translates both visual references into Kinvai's design system:
 * - Desktop (>=1024px, Wink DNA): 36px collection-tinted hero tile with large ProductCover,
 *   collection TagPill top-left, floating Save + Share buttons top-right, and 3 integrated
 *   gallery tiles below (real product_media images, or data-backed File-tree / Formats / Made-for tiles).
 * - Phone (<1024px, Mobile Shop App DNA): Full-width tinted swipeable stage with floating
 *   round Back, Save, and Share buttons plus centered gallery dots.
 */
export function ProductGallery({
  product,
  collection,
  media,
  saved,
  isDesktop,
  onBack,
  onToggleSave,
  onShare,
  onOpenLightbox,
}: ProductGalleryProps) {
  const reduced = useReducedMotion();
  const tintBg = accentToBgClass(collection?.accent ?? 'cocoa');
  const transitionName = getProductCoverTransitionName(product.slug);

  const lightboxImages = useMemo(() => collectLightboxImages(product, media), [product, media]);
  const secondaryTiles = useMemo(() => buildSecondaryTiles(product, media), [product, media]);
  const mobileSlides = useMemo(
    () => buildMobileGallerySlides(product, collection, media),
    [product, collection, media]
  );

  // Desktop stage selection: null = primary ProductCover; string = selected ProductMedia id
  const [activeDesktopMediaId, setActiveDesktopMediaId] = useState<string | null>(null);
  const [mobileSlideIndex, setMobileSlideIndex] = useState(0);
  const mobileScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveDesktopMediaId(null);
    setMobileSlideIndex(0);
    if (mobileScrollerRef.current) {
      mobileScrollerRef.current.scrollTo({ left: 0, behavior: 'auto' });
    }
  }, [product.id]);

  const activeDesktopMedia = useMemo(
    () => media.find((m) => m.id === activeDesktopMediaId) ?? null,
    [media, activeDesktopMediaId]
  );

  const primaryLightboxIndex = useMemo(() => {
    if (activeDesktopMedia) {
      const idx = lightboxImages.findIndex(
        (img) => img.storagePath === activeDesktopMedia.storage_path.trim()
      );
      return idx >= 0 ? idx : 0;
    }
    if (product.cover_path) {
      const idx = lightboxImages.findIndex(
        (img) => img.storagePath === product.cover_path?.trim()
      );
      return idx >= 0 ? idx : 0;
    }
    return null;
  }, [activeDesktopMedia, lightboxImages, product.cover_path]);

  const handleMobileScroll = () => {
    const el = mobileScrollerRef.current;
    if (!el || el.clientWidth <= 0) return;
    const nextIdx = Math.round(el.scrollLeft / el.clientWidth);
    const clamped = Math.max(0, Math.min(mobileSlides.length - 1, nextIdx));
    if (clamped !== mobileSlideIndex) {
      setMobileSlideIndex(clamped);
    }
  };

  const scrollToMobileSlide = (idx: number) => {
    const el = mobileScrollerRef.current;
    if (!el) return;
    el.scrollTo({
      left: idx * el.clientWidth,
      behavior: reduced ? 'auto' : 'smooth',
    });
    setMobileSlideIndex(idx);
  };

  const renderPeekTile = (tile: SecondaryTile, compact = false) => {
    if (tile.kind === 'media') {
      const isSelected = activeDesktopMediaId === tile.media.id;
      return (
        <button
          key={tile.id}
          type="button"
          onClick={() => {
            if (isSelected) {
              onOpenLightbox(tile.lightboxIndex);
            } else {
              setActiveDesktopMediaId(tile.media.id);
            }
          }}
          aria-label={`Inspect ${tile.media.alt || product.name}`}
          className={`group relative w-full text-left rounded-[22px] overflow-hidden border transition-colors cursor-pointer kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2 ${
            isSelected ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-ink/40'
          }`}
        >
          <ProductImage
            base={tile.media.storage_path}
            alt={tile.media.alt || `${product.name} preview`}
            ratio="4/3"
            accent={collection?.accent}
            sizes="(max-width: 1024px) 33vw, 220px"
            className="rounded-none"
          />
          <span className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-surface/95 text-ink inline-flex items-center justify-center border border-line">
            <Expand size={14} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </button>
      );
    }

    if (tile.kind === 'file-tree') {
      return (
        <div
          key={tile.id}
          className={`rounded-[24px] bg-surface border border-line flex flex-col justify-between gap-3 ${
            compact ? 'p-5 h-full' : 'p-4'
          }`}
          data-peek-tile="file-tree"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="type-label text-ink-2">File tree</span>
            <span className="w-7 h-7 rounded-full bg-stone text-ink inline-flex items-center justify-center shrink-0">
              <FolderTree size={14} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </div>

          <div className="font-mono text-[11px] leading-relaxed text-ink overflow-hidden">
            <div className="text-ink font-medium truncate">{tile.rootLabel}</div>
            <ul className="mt-1.5 flex flex-col gap-1 text-ink-2">
              {tile.entries.slice(0, compact ? 4 : 3).map((entry, idx, arr) => {
                const isLast = idx === arr.length - 1 && tile.entries.length <= arr.length;
                return (
                  <li key={entry} className="flex items-start gap-1.5 min-w-0">
                    <span aria-hidden="true" className="text-ink-3 shrink-0 select-none">
                      {isLast ? '└─' : '├─'}
                    </span>
                    <span className="truncate">{entry}</span>
                  </li>
                );
              })}
              {tile.entries.length > (compact ? 4 : 3) && (
                <li className="text-ink-3 pl-4">
                  +{tile.entries.length - (compact ? 4 : 3)} more
                </li>
              )}
            </ul>
          </div>
        </div>
      );
    }

    if (tile.kind === 'formats') {
      return (
        <div
          key={tile.id}
          className={`rounded-[24px] bg-stone border border-line flex flex-col justify-between gap-3 ${
            compact ? 'p-5 h-full' : 'p-4'
          }`}
          data-peek-tile="formats"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="type-label text-ink-2">Formats</span>
            <span className="w-7 h-7 rounded-full bg-surface text-ink inline-flex items-center justify-center shrink-0 border border-line">
              <FileCode2 size={14} strokeWidth={1.75} aria-hidden="true" />
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {tile.formats.map((fmt) => (
              <span
                key={fmt}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-surface border border-line font-mono text-xs uppercase tracking-[0.06em] font-medium text-ink"
              >
                {fmt}
              </span>
            ))}
          </div>
        </div>
      );
    }

    // tile.kind === 'made-for'
    return (
      <div
        key={tile.id}
        className={`rounded-[24px] bg-surface border border-line flex flex-col justify-between gap-3 ${
          compact ? 'p-5 h-full' : 'p-4'
        }`}
        data-peek-tile="made-for"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="type-label text-ink-2">Made for</span>
          <span className="w-7 h-7 rounded-full bg-stone text-ink inline-flex items-center justify-center shrink-0">
            <Users size={14} strokeWidth={1.75} aria-hidden="true" />
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink leading-snug line-clamp-2">
            {tile.audienceLine}
          </p>
          {tile.audienceCount > 1 && (
            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
              +{tile.audienceCount - 1} more
            </span>
          )}
        </div>
      </div>
    );
  };

  /* -------------------- MOBILE EXPERIENCE (<1024px) — Mobile Shop App DNA -------------------- */
  if (!isDesktop) {
    return (
      <div className="flex flex-col gap-3" data-gallery-mode="mobile">
        <div className={`relative rounded-[28px] ${tintBg} overflow-hidden border border-ink/8`}>
          {/* Floating round Back (left), Save + Share (right) */}
          <div className="absolute top-3.5 left-3.5 right-3.5 z-20 flex items-center justify-between gap-2 pointer-events-none">
            <div className="pointer-events-auto">
              <IconButton
                label="Back to previous page"
                icon={<ArrowLeft size={19} strokeWidth={1.75} />}
                onClick={onBack}
                className="bg-surface/95 shadow-[var(--shadow-float)] border-line"
              />
            </div>

            <div className="pointer-events-auto flex items-center gap-2">
              <IconButton
                label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
                icon={
                  <Heart
                    size={19}
                    strokeWidth={1.75}
                    className={saved ? 'fill-brand text-brand' : ''}
                  />
                }
                onClick={onToggleSave}
                className="bg-surface/95 shadow-[var(--shadow-float)] border-line"
              />
              <IconButton
                label={`Share ${product.name}`}
                icon={<Share2 size={18} strokeWidth={1.75} />}
                onClick={onShare}
                className="bg-surface/95 shadow-[var(--shadow-float)] border-line"
              />
            </div>
          </div>

          {/* Swipeable horizontal snap rail */}
          <div
            ref={mobileScrollerRef}
            onScroll={handleMobileScroll}
            className="flex overflow-x-auto kv-scroll-snap"
            role="region"
            aria-roledescription="carousel"
            aria-label={`${product.name} gallery`}
          >
            {mobileSlides.map((slide) => (
              <div
                key={slide.id}
                className="w-full shrink-0 snap-center p-4 pt-16 pb-12 flex items-center justify-center"
              >
                {slide.kind === 'cover' && (
                  <div
                    className="w-full max-w-[340px] mx-auto relative"
                    style={{ viewTransitionName: transitionName }}
                  >
                    <ProductCover
                      product={product}
                      collection={collection}
                      ratio="4/5"
                      size="md"
                      priority
                      sizes="92vw"
                      className="rounded-[22px] shadow-[0_12px_32px_rgba(17,17,17,0.08)]"
                    />
                    {slide.lightboxIndex !== null && (
                      <button
                        type="button"
                        onClick={() => onOpenLightbox(slide.lightboxIndex!)}
                        aria-label={`Expand ${product.name} cover image`}
                        className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-surface/95 text-ink border border-line inline-flex items-center justify-center shadow-[var(--shadow-float)] cursor-pointer kv-press"
                      >
                        <Expand size={17} strokeWidth={1.75} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}

                {slide.kind === 'media' && (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(slide.lightboxIndex)}
                    aria-label={`Open ${slide.alt} in lightbox`}
                    className="w-full max-w-[340px] mx-auto relative rounded-[22px] overflow-hidden cursor-pointer kv-press"
                  >
                    <ProductImage
                      base={slide.media.storage_path}
                      alt={slide.alt}
                      ratio="4/5"
                      accent={collection?.accent}
                      sizes="92vw"
                      className="rounded-[22px]"
                    />
                    <span className="absolute bottom-3 right-3 w-11 h-11 rounded-full bg-surface/95 text-ink border border-line inline-flex items-center justify-center shadow-[var(--shadow-float)]">
                      <Expand size={17} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                  </button>
                )}

                {slide.kind === 'peek-file-tree' && (
                  <div className="w-full max-w-[340px] mx-auto aspect-[4/5]">
                    {renderPeekTile(
                      {
                        id: slide.id,
                        kind: 'file-tree',
                        rootLabel: slide.rootLabel,
                        entries: slide.entries,
                      },
                      true
                    )}
                  </div>
                )}

                {slide.kind === 'peek-formats' && (
                  <div className="w-full max-w-[340px] mx-auto aspect-[4/5]">
                    {renderPeekTile(
                      {
                        id: slide.id,
                        kind: 'formats',
                        formats: slide.formats,
                      },
                      true
                    )}
                  </div>
                )}

                {slide.kind === 'peek-made-for' && (
                  <div className="w-full max-w-[340px] mx-auto aspect-[4/5]">
                    {renderPeekTile(
                      {
                        id: slide.id,
                        kind: 'made-for',
                        audienceLine: slide.audienceLine,
                        audienceCount: slide.audienceCount,
                      },
                      true
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Centered gallery dots along bottom edge */}
          {mobileSlides.length > 1 && (
            <div className="absolute bottom-3.5 inset-x-0 z-20 flex items-center justify-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-surface/92 border border-line px-2.5 py-1.5 shadow-[var(--shadow-float)]">
                {mobileSlides.map((slide, idx) => {
                  const active = idx === mobileSlideIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => scrollToMobileSlide(idx)}
                      aria-label={`Go to slide ${idx + 1}: ${slide.label}`}
                      aria-current={active ? 'true' : undefined}
                      className={`h-2 rounded-full transition-all duration-200 cursor-pointer ${
                        active ? 'w-5 bg-ink' : 'w-2 bg-ink/25'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------- DESKTOP EXPERIENCE (>=1024px) — Wink Bento DNA -------------------- */
  return (
    <div className="flex flex-col gap-3.5" data-gallery-mode="desktop">
      {/* Main 36px tinted hero tile */}
      <div
        className={`relative rounded-[36px] ${tintBg} border border-ink/8 p-5 xl:p-6 flex flex-col items-center justify-center overflow-hidden min-h-[430px]`}
      >
        {/* Top-left collection TagPill + Top-right floating Save & Share round buttons */}
        <div className="absolute top-5 left-5 right-5 z-20 flex items-start justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2">
            {collection && <TagPill className="bg-surface/95">{collection.name}</TagPill>}
            {activeDesktopMedia && (
              <button
                type="button"
                onClick={() => setActiveDesktopMediaId(null)}
                className="rounded-full bg-surface/95 border border-line px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-ink hover:border-ink transition-colors cursor-pointer"
              >
                Back to cover
              </button>
            )}
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            <IconButton
              label={saved ? `Remove ${product.name} from saved` : `Save ${product.name}`}
              tooltip={saved ? 'Saved' : 'Save'}
              icon={
                <Heart
                  size={19}
                  strokeWidth={1.75}
                  className={saved ? 'fill-brand text-brand' : ''}
                />
              }
              onClick={onToggleSave}
              className="bg-surface/95 shadow-[var(--shadow-float)] border-line"
            />
            <IconButton
              label={`Share ${product.name}`}
              tooltip="Share"
              icon={<Share2 size={18} strokeWidth={1.75} />}
              onClick={onShare}
              className="bg-surface/95 shadow-[var(--shadow-float)] border-line"
            />
          </div>
        </div>

        {/* Centered large ProductCover or selected gallery image with 220ms crossfade */}
        <div className="w-full max-w-[356px] xl:max-w-[388px] pt-8 pb-1">
          <AnimatePresence mode="wait" initial={false}>
            {activeDesktopMedia ? (
              <motion.div
                key={activeDesktopMedia.id}
                initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.22, ease: KINVAI_EASE }}
                className="relative"
              >
                <button
                  type="button"
                  onClick={() => {
                    if (primaryLightboxIndex !== null) onOpenLightbox(primaryLightboxIndex);
                  }}
                  aria-label={`Open ${activeDesktopMedia.alt || product.name} in fullscreen lightbox`}
                  className="block w-full rounded-[24px] overflow-hidden cursor-zoom-in focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4"
                >
                  <ProductImage
                    base={activeDesktopMedia.storage_path}
                    alt={activeDesktopMedia.alt || `${product.name} preview`}
                    ratio="4/5"
                    accent={collection?.accent}
                    priority
                    sizes="(max-width: 1280px) 48vw, 460px"
                    className="rounded-[24px] shadow-[0_18px_48px_rgba(17,17,17,0.10)]"
                  />
                </button>
              </motion.div>
            ) : (
              <motion.div
                key={`cover-${product.id}`}
                initial={reduced ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.22, ease: KINVAI_EASE }}
                style={{ viewTransitionName: transitionName }}
                className="relative"
              >
                {primaryLightboxIndex !== null ? (
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(primaryLightboxIndex)}
                    aria-label={`Open ${product.name} cover in fullscreen lightbox`}
                    className="block w-full rounded-[24px] overflow-hidden cursor-zoom-in focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4"
                  >
                    <ProductCover
                      product={product}
                      collection={collection}
                      ratio="4/5"
                      size="lg"
                      priority
                      sizes="(max-width: 1280px) 48vw, 460px"
                      className="rounded-[24px] shadow-[0_18px_48px_rgba(17,17,17,0.10)]"
                    />
                  </button>
                ) : (
                  <ProductCover
                    product={product}
                    collection={collection}
                    ratio="4/5"
                    size="lg"
                    priority
                    sizes="(max-width: 1280px) 48vw, 460px"
                    className="rounded-[24px] shadow-[0_18px_48px_rgba(17,17,17,0.10)]"
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Lightbox trigger pill bottom-right when real media is available */}
        {primaryLightboxIndex !== null && (
          <button
            type="button"
            onClick={() => onOpenLightbox(primaryLightboxIndex)}
            aria-label={`View ${product.name} gallery fullscreen`}
            className="absolute bottom-5 right-5 z-20 inline-flex items-center gap-2 rounded-full bg-surface/95 border border-line px-3.5 py-2 text-xs font-medium text-ink shadow-[var(--shadow-float)] hover:border-ink transition-colors cursor-pointer kv-press"
          >
            <Expand size={15} strokeWidth={1.75} aria-hidden="true" />
            <span>
              Inspect{lightboxImages.length > 1 ? ` (${lightboxImages.length})` : ''}
            </span>
          </button>
        )}
      </div>

      {/* Three smaller Wink-inspired gallery / real-data peek tiles beneath main cover */}
      {secondaryTiles.length > 0 && (
        <div
          className={`grid gap-3.5 ${
            secondaryTiles.length === 1
              ? 'grid-cols-1'
              : secondaryTiles.length === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
          }`}
        >
          {secondaryTiles.map((tile) => renderPeekTile(tile, false))}
        </div>
      )}
    </div>
  );
}
