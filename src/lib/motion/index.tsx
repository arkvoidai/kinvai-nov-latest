import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import { motion, useInView, useReducedMotion as useMotionReducedMotion } from 'motion/react';
import { useLocation } from 'react-router-dom';

export const KINVAI_SPRING = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 36,
};

export const KINVAI_EASE = [0.2, 0.7, 0.2, 1] as const;

export const KINVAI_TWEEN = {
  duration: 0.34,
  ease: KINVAI_EASE,
};

export function useReducedMotion(): boolean {
  const prefersReduced = useMotionReducedMotion();
  return Boolean(prefersReduced);
}

function useFinePointer(): boolean {
  const [fine, setFine] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setFine(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return fine;
}

/**
 * Reveal: fade + 16px rise, reveals once on scroll.
 * Animates only transform and opacity. Respects prefers-reduced-motion.
 */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.36, delay: Math.min(delay, 0.4), ease: KINVAI_EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * TileIn: scale .98 -> 1 + fade, stagger capped at 8 items.
 */
export function TileIn({
  children,
  index = 0,
  className = '',
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const cappedIndex = Math.min(Math.max(0, index), 7);

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.34,
        delay: cappedIndex * 0.045,
        ease: KINVAI_EASE,
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * SplitHeadline: word mask reveal that keeps text readable immediately for SSR/LCP/no-JS.
 * Never starts invisible (opacity stays 1 on LCP); animates subtle transform rise per word.
 * Supports *italic* syntax for ONE Instrument Serif italic accent phrase.
 */
export function SplitHeadline({
  id,
  text,
  as = 'h1',
  className = '',
  immediate = true,
}: {
  id?: string;
  text: string;
  as?: 'h1' | 'h2' | 'h3';
  className?: string;
  immediate?: boolean;
}) {
  const reduced = useReducedMotion();
  const Tag = as;

  // Parse *italic* accent segment
  const segments = text.split(/(\*[^*]+\*)/g).filter(Boolean);
  let wordCounter = 0;

  return (
    <Tag id={id} className={className}>
      {segments.map((segment, segIdx) => {
        const isItalic = segment.startsWith('*') && segment.endsWith('*');
        const cleanText = isItalic ? segment.slice(1, -1) : segment;
        const words = cleanText.split(/(\s+)/);

        return (
          <span key={segIdx} className={isItalic ? 'font-accent-serif font-normal' : undefined}>
            {words.map((token, tokIdx) => {
              if (/^\s+$/.test(token)) {
                return <span key={tokIdx}>{token}</span>;
              }
              if (!token) return null;
              const idx = wordCounter++;
              const capped = Math.min(idx, 7);

              if (reduced) {
                return <span key={tokIdx}>{token}</span>;
              }

              return (
                <span key={tokIdx} className="inline-block overflow-hidden align-bottom pb-[0.06em] -mb-[0.06em]">
                  <motion.span
                    className="inline-block"
                    initial={immediate ? { y: '18%', opacity: 1 } : { y: '45%', opacity: 0.01 }}
                    whileInView={{ y: '0%', opacity: 1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.38,
                      delay: capped * 0.035,
                      ease: KINVAI_EASE,
                    }}
                  >
                    {token}
                  </motion.span>
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}

/**
 * Magnetic: pulls child gently toward cursor up to 6px on fine pointers only.
 */
export function Magnetic({
  children,
  strength = 6,
  className = '',
}: {
  children: ReactNode;
  strength?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const maxPull = Math.min(Math.max(strength, 0), 6);

  const enabled = fine && !reduced;

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const relX = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
    const relY = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
    setOffset({
      x: Math.max(-1, Math.min(1, relX)) * maxPull,
      y: Math.max(-1, Math.min(1, relY)) * maxPull,
    });
  };

  const handleMouseLeave = () => {
    if (!enabled) return;
    setOffset({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={enabled ? { x: offset.x, y: offset.y } : { x: 0, y: 0 }}
      transition={KINVAI_SPRING}
    >
      {children}
    </motion.div>
  );
}

/**
 * Tilt: subtle 4-degree 3D tilt on fine pointers only, throttled with requestAnimationFrame.
 */
export function Tilt({
  children,
  maxDegrees = 4,
  className = '',
}: {
  children: ReactNode;
  maxDegrees?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  const fine = useFinePointer();
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const enabled = fine && !reduced;
  const clampedMax = Math.min(Math.max(maxDegrees, 0), 4);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const clientX = e.clientX;
    const clientY = e.clientY;

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = (clientY - rect.top) / rect.height;
      const rotateY = (px - 0.5) * 2 * clampedMax;
      const rotateX = (0.5 - py) * 2 * clampedMax;
      el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
    });
  };

  const handleMouseLeave = () => {
    if (!enabled || !ref.current) return;
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    ref.current.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{
        transition: 'transform 220ms cubic-bezier(0.2, 0.7, 0.2, 1)',
        transformStyle: 'preserve-3d',
      }}
    >
      {children}
    </div>
  );
}

/**
 * CountUp: counts smoothly to target value once visible in viewport.
 */
export function CountUp({
  value,
  prefix = '',
  suffix = '',
  durationMs = 700,
  className = '',
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  durationMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.4 });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!isInView || reduced) {
      setDisplay(value);
      return;
    }

    let rafId = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(value * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isInView, reduced, value, durationMs]);

  return (
    <span ref={ref} className={`font-mono tabular-nums ${className}`}>
      {prefix}
      {display.toLocaleString('en-US')}
      {suffix}
    </span>
  );
}

/**
 * Marquee: pure CSS horizontal marquee that pauses on hover and prefers-reduced-motion.
 */
export function Marquee({
  items,
  durationSeconds = 32,
  className = '',
}: {
  items: ReactNode[];
  durationSeconds?: number;
  className?: string;
}) {
  const style = {
    '--marquee-duration': `${durationSeconds}s`,
  } as CSSProperties;

  return (
    <div className={`kv-marquee-root overflow-hidden w-full ${className}`} style={style}>
      <div className="kv-marquee-track gap-4">
        <div className="flex items-center gap-4 shrink-0 pr-4">{items}</div>
        <div className="flex items-center gap-4 shrink-0 pr-4" aria-hidden="true">
          {items}
        </div>
      </div>
    </div>
  );
}

/**
 * PageTransition: lightweight 160ms opacity fade fallback alongside React Router viewTransition links.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const location = useLocation();
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0.85 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16, ease: KINVAI_EASE }}
    >
      {children}
    </motion.div>
  );
}
