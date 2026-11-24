import { useCallback, useEffect, useRef, type TouchEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { CollectionAccent } from '../../lib/data/types';
import { KINVAI_EASE, useReducedMotion } from '../../lib/motion';
import type { LightboxImageItem } from '../../lib/product/productHelpers';
import { ProductImage } from '../primitives';

export interface ProductLightboxProps {
  open: boolean;
  images: LightboxImageItem[];
  activeIndex: number;
  accent?: CollectionAccent | null;
  productName: string;
  onIndexChange: (nextIndex: number) => void;
  onClose: () => void;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible fullscreen gallery lightbox for product_media images.
 * Features: focus trap, Escape to close, ArrowLeft/ArrowRight navigation,
 * touch swipe support, 220ms crossfade, and focus restoration on close.
 */
export function ProductLightbox({
  open,
  images,
  activeIndex,
  accent,
  productName,
  onIndexChange,
  onClose,
}: ProductLightboxProps) {
  const reduced = useReducedMotion();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const count = images.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;
  const current = images[safeIndex];

  const goPrev = useCallback(() => {
    if (count <= 1) return;
    onIndexChange((safeIndex - 1 + count) % count);
  }, [count, onIndexChange, safeIndex]);

  const goNext = useCallback(() => {
    if (count <= 1) return;
    onIndexChange((safeIndex + 1) % count);
  }, [count, onIndexChange, safeIndex]);

  // Body scroll lock & focus management
  useEffect(() => {
    if (!open) return;
    prevFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const raf = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
      prevFocusRef.current?.focus?.();
    };
  }, [open]);

  // Keyboard navigation + Focus trap
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
        return;
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first || !dialogRef.current.contains(document.activeElement)) {
            e.preventDefault();
            last.focus();
          }
        } else if (document.activeElement === last || !dialogRef.current.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, goPrev, goNext]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartXRef.current = touch.clientX;
    touchStartYRef.current = touch.clientY;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartXRef.current;
    const dy = touch.clientY - touchStartYRef.current;
    touchStartXRef.current = null;
    touchStartYRef.current = null;

    if (Math.abs(dx) >= 44 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  if (!open || !current) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${productName} gallery viewer`}
      className="fixed inset-0 z-[100] bg-ink/92 backdrop-blur-sm flex flex-col justify-between p-4 sm:p-6 md:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar: counter & close */}
      <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between gap-4 text-ink-on-dark">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs uppercase tracking-[0.08em] px-3 py-1 rounded-full bg-white/10 text-ink-on-dark tabular-nums shrink-0">
            {String(safeIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
          </span>
          <p className="text-sm text-ink-on-dark-muted truncate">{current.alt}</p>
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          aria-label="Close gallery lightbox"
          className="w-11 h-11 rounded-full bg-surface text-ink inline-flex items-center justify-center hover:bg-stone transition-colors cursor-pointer kv-press shrink-0 focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
        >
          <X size={20} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>

      {/* Main stage */}
      <div className="relative flex-1 min-h-0 w-full max-w-[1160px] mx-auto my-4 flex items-center justify-center">
        {count > 1 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="hidden sm:inline-flex absolute left-0 z-10 w-12 h-12 rounded-full bg-surface text-ink items-center justify-center shadow-[var(--shadow-float)] hover:bg-stone transition-colors cursor-pointer kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            <ChevronLeft size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}

        <div className="w-full max-w-[720px] max-h-[72dvh] flex items-center justify-center px-0 sm:px-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.985 }}
              transition={{ duration: 0.22, ease: KINVAI_EASE }}
              className="w-full max-w-[540px] mx-auto"
            >
              <ProductImage
                base={current.storagePath}
                alt={current.alt}
                ratio="4/5"
                accent={accent}
                priority
                sizes="(max-width: 768px) 92vw, 540px"
                className="rounded-[24px] shadow-[0_24px_60px_rgba(0,0,0,0.45)] max-h-[70dvh]"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {count > 1 && (
          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="hidden sm:inline-flex absolute right-0 z-10 w-12 h-12 rounded-full bg-surface text-ink items-center justify-center shadow-[var(--shadow-float)] hover:bg-stone transition-colors cursor-pointer kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
          >
            <ChevronRight size={20} strokeWidth={1.75} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Bottom thumbnails & mobile prev/next */}
      {count > 1 && (
        <div className="w-full max-w-[760px] mx-auto flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous image"
            className="sm:hidden w-11 h-11 rounded-full bg-white/12 text-ink-on-dark inline-flex items-center justify-center cursor-pointer kv-press"
          >
            <ChevronLeft size={19} strokeWidth={1.75} aria-hidden="true" />
          </button>

          <div className="flex items-center gap-2 overflow-x-auto py-1">
            {images.map((img, idx) => {
              const active = idx === safeIndex;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => onIndexChange(idx)}
                  aria-label={`View image ${idx + 1}: ${img.alt}`}
                  aria-current={active ? 'true' : undefined}
                  className={`w-14 h-16 rounded-[12px] overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    active ? 'border-brand opacity-100 scale-105' : 'border-white/20 opacity-60 hover:opacity-90'
                  }`}
                >
                  <ProductImage
                    base={img.storagePath}
                    alt=""
                    ratio="4/5"
                    accent={accent}
                    sizes="64px"
                    className="w-full h-full rounded-none"
                  />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={goNext}
            aria-label="Next image"
            className="sm:hidden w-11 h-11 rounded-full bg-white/12 text-ink-on-dark inline-flex items-center justify-center cursor-pointer kv-press"
          >
            <ChevronRight size={19} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
