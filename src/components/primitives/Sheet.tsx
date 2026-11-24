import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { X } from 'lucide-react';
import { KINVAI_SPRING, useReducedMotion } from '../../lib/motion';
import { IconButton } from './IconButton';

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClass?: string;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selectors = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ];
  return Array.from(container.querySelectorAll<HTMLElement>(selectors.join(',')));
}

/**
 * Responsive Sheet: bottom sheet with drag-to-dismiss on phones (<768px),
 * right side drawer on desktop (>=768px). Includes focus trap, Esc close, and zero-shift scroll lock.
 */
export function Sheet({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = 'md:max-w-[460px]',
}: SheetProps) {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Scroll lock without layout shift + Esc + focus trap
  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const focusTimer = window.setTimeout(() => {
      if (panelRef.current) {
        const focusables = getFocusableElements(panelRef.current);
        (focusables[0] ?? panelRef.current).focus();
      }
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab' && panelRef.current) {
        const focusables = getFocusableElements(panelRef.current);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      previousFocusRef.current?.focus();
    };
  }, [open, onClose]);

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 90 || info.velocity.y > 450) {
      onClose();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-[var(--z-sheet)] flex items-end md:items-stretch md:justify-end"
          role="presentation"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-ink/35 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            tabIndex={-1}
            drag={isMobile && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={isMobile ? handleDragEnd : undefined}
            initial={
              reduced
                ? { opacity: 0 }
                : isMobile
                  ? { y: '100%' }
                  : { x: '100%' }
            }
            animate={reduced ? { opacity: 1 } : { x: 0, y: 0 }}
            exit={
              reduced
                ? { opacity: 0 }
                : isMobile
                  ? { y: '100%' }
                  : { x: '100%' }
            }
            transition={reduced ? { duration: 0.01 } : KINVAI_SPRING}
            className={`relative z-10 flex flex-col w-full ${widthClass} max-h-[88dvh] md:max-h-none md:h-full bg-surface text-ink shadow-[var(--shadow-float)] rounded-t-[28px] md:rounded-t-none md:rounded-l-[28px] border-t md:border-t-0 md:border-l border-line focus:outline-none`}
          >
            {isMobile && (
              <div className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing" aria-hidden="true">
                <span className="w-10 h-1 rounded-full bg-line-strong" />
              </div>
            )}

            <div className="flex items-start justify-between gap-4 px-5 md:px-7 pt-4 md:pt-6 pb-4 border-b border-line">
              <div>
                <h2 id={titleId} className="type-h3 font-semibold text-ink">
                  {title}
                </h2>
                {description && (
                  <p id={descId} className="text-sm text-ink-2 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <IconButton
                label={`Close ${title}`}
                icon={<X size={20} strokeWidth={1.75} />}
                variant="stone"
                size="sm"
                onClick={onClose}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-5 md:px-7 py-5">{children}</div>

            {footer && (
              <div className="px-5 md:px-7 py-4 md:py-5 border-t border-line bg-page-50 rounded-b-none md:rounded-bl-[28px] pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
