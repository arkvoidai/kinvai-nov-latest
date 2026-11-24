import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useReducedMotion } from '../../lib/motion';

/**
 * 2px persimmon reading-progress bar on long pages.
 * Uses GPU-composited scaleX transform only and hides on short pages.
 */
export function ScrollProgressBar() {
  const { pathname } = useLocation();
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(0);
  const [isLongPage, setIsLongPage] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let rafId = 0;

    const measure = () => {
      rafId = 0;
      const docEl = document.documentElement;
      const scrollHeight = docEl.scrollHeight;
      const clientHeight = window.innerHeight;
      const scrollable = scrollHeight - clientHeight;
      const longEnough = scrollHeight >= clientHeight * 1.35 && scrollable > 160;
      setIsLongPage(longEnough);
      if (!longEnough) {
        setProgress(0);
        return;
      }
      const ratio = Math.min(1, Math.max(0, window.scrollY / scrollable));
      setProgress(ratio);
    };

    const schedule = () => {
      if (rafId === 0) {
        rafId = window.requestAnimationFrame(measure);
      }
    };

    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });

    // Re-measure shortly after route changes as async content settles
    const settleTimer = window.setTimeout(measure, 350);

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.clearTimeout(settleTimer);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [pathname]);

  if (!isLongPage || progress <= 0.002) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 h-[2px] z-[var(--z-tooltip)] pointer-events-none bg-transparent"
    >
      <div
        className={`h-full w-full origin-left bg-brand ${
          reduced ? '' : 'transition-transform duration-75 ease-out'
        }`}
        style={{ transform: `scaleX(${progress.toFixed(4)})` }}
      />
    </div>
  );
}
