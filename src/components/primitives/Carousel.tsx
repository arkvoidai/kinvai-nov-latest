import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { IconButton } from './IconButton';

export interface CarouselProps {
  items: ReactNode[];
  ariaLabel: string;
  showSlidePill?: boolean;
  slidePillLabel?: string;
  itemClassName?: string;
  className?: string;
}

/**
 * CSS scroll-snap Carousel with prev/next buttons, progress dots,
 * keyboard arrow support, and optional Promax-style "slide pill" control.
 */
export function Carousel({
  items,
  ariaLabel,
  showSlidePill = false,
  slidePillLabel = 'Slide',
  itemClassName = 'w-[86%] sm:w-[68%] md:w-[48%] lg:w-[32%]',
  className = '',
}: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(items.length - 1, index));
      const track = trackRef.current;
      if (!track) return;
      const child = track.children[clamped] as HTMLElement | undefined;
      if (child) {
        track.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
        setActiveIndex(clamped);
      }
    },
    [items.length]
  );

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let rafId = 0;

    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const scrollLeft = track.scrollLeft;
        let closestIdx = 0;
        let closestDist = Number.POSITIVE_INFINITY;
        Array.from(track.children).forEach((child, idx) => {
          const el = child as HTMLElement;
          const dist = Math.abs(el.offsetLeft - scrollLeft);
          if (dist < closestDist) {
            closestDist = dist;
            closestIdx = idx;
          }
        });
        setActiveIndex(closestIdx);
      });
    };

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollToIndex(activeIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollToIndex(activeIndex - 1);
    }
  };

  if (items.length === 0) return null;

  const isFirst = activeIndex === 0;
  const isLast = activeIndex >= items.length - 1;

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4 rounded-[28px] ${className}`}
    >
      <div
        ref={trackRef}
        className="kv-scroll-snap flex gap-4 overflow-x-auto pb-2"
      >
        {items.map((node, idx) => (
          <div
            key={idx}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${idx + 1} of ${items.length}`}
            className={`shrink-0 snap-start ${itemClassName}`}
          >
            {node}
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2" role="tablist" aria-label="Carousel slides">
          {items.map((_, idx) => {
            const active = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={`Go to slide ${idx + 1}`}
                onClick={() => scrollToIndex(idx)}
                className={`h-2 rounded-full transition-all cursor-pointer ${
                  active ? 'w-7 bg-ink' : 'w-2 bg-line-strong hover:bg-ink-2'
                }`}
              />
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {showSlidePill ? (
            <button
              type="button"
              onClick={() => scrollToIndex(isLast ? 0 : activeIndex + 1)}
              className="inline-flex items-center gap-3 pl-4 pr-1.5 py-1.5 min-h-[44px] rounded-full bg-surface border border-line hover:border-line-strong kv-press cursor-pointer"
            >
              <span className="text-sm font-medium text-ink">
                {slidePillLabel}{' '}
                <span className="font-mono text-xs text-ink-2 tabular-nums">
                  {activeIndex + 1}/{items.length}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="w-8 h-8 rounded-full bg-ink text-white inline-flex items-center justify-center"
              >
                <ArrowRight size={16} strokeWidth={1.75} />
              </span>
            </button>
          ) : (
            <>
              <IconButton
                label="Previous slide"
                icon={<ArrowLeft size={18} strokeWidth={1.75} />}
                size="sm"
                disabled={isFirst}
                onClick={() => scrollToIndex(activeIndex - 1)}
              />
              <IconButton
                label="Next slide"
                icon={<ArrowRight size={18} strokeWidth={1.75} />}
                size="sm"
                disabled={isLast}
                onClick={() => scrollToIndex(activeIndex + 1)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
