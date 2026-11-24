import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { cartStore } from '../../lib/cart/cartStore';
import { useReducedMotion } from '../../lib/motion';

interface ActiveDot {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

/**
 * Plays a lightweight persimmon-dot flight animation (transform + opacity only)
 * from an "Add to cart" control to the active cart button. Skipped for reduced motion.
 */
export function CartFlightOverlay() {
  const reduced = useReducedMotion();
  const [dots, setDots] = useState<ActiveDot[]>([]);

  useEffect(() => {
    if (reduced) return;

    return cartStore.subscribeFlight((evt) => {
      if (typeof document === 'undefined') return;
      const desktopBtn = document.getElementById('kv-header-cart-btn');
      const mobileBtn = document.getElementById('kv-mobile-cart-btn');

      let targetRect: DOMRect | null = null;
      if (desktopBtn) {
        const r = desktopBtn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) targetRect = r;
      }
      if (!targetRect && mobileBtn) {
        const r = mobileBtn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) targetRect = r;
      }
      if (!targetRect) return;

      const dot: ActiveDot = {
        id: evt.id,
        startX: evt.startX,
        startY: evt.startY,
        endX: targetRect.left + targetRect.width / 2,
        endY: targetRect.top + targetRect.height / 2,
      };

      setDots((prev) => [...prev.slice(-3), dot]);

      window.setTimeout(() => {
        setDots((prev) => prev.filter((item) => item.id !== dot.id));
      }, 480);
    });
  }, [reduced]);

  if (reduced || dots.length === 0 || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-[var(--z-tooltip)]">
      {dots.map((dot) => (
        <motion.span
          key={dot.id}
          initial={{
            x: dot.startX - 5,
            y: dot.startY - 5,
            scale: 1.15,
            opacity: 1,
          }}
          animate={{
            x: dot.endX - 5,
            y: dot.endY - 5,
            scale: 0.65,
            opacity: 0.9,
          }}
          transition={{
            duration: 0.42,
            ease: [0.2, 0.7, 0.2, 1],
          }}
          className="fixed top-0 left-0 w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_0_3px_rgba(255,91,31,0.22)]"
        />
      ))}
    </div>,
    document.body
  );
}
