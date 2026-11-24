import { useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';
import { accentToTileVariant } from '../../lib/data/format';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection } from '../../lib/data/types';
import { KINVAI_EASE, useReducedMotion } from '../../lib/motion';
import { CoverStack } from '../primitives';

export interface CollectionsMegaPanelProps {
  open: boolean;
  onClose: (restoreFocus?: boolean) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  panelId: string;
}

const TINT_BG_MAP: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

const TINT_BADGE_MAP: Record<string, string> = {
  'tint-peach': 'bg-peach-muted text-peach-deep',
  'tint-butter': 'bg-butter-muted text-butter-deep',
  'tint-lilac': 'bg-lilac-muted text-lilac-deep',
  'tint-rose': 'bg-rose-muted text-rose-deep',
  stone: 'bg-surface text-ink-2',
};

/**
 * Desktop hover/keyboard Collections mega panel.
 * Four flat-tinted tiles with CoverStack (first 3 products), tagline, count, and round arrow link.
 */
export function CollectionsMegaPanel({
  open,
  onClose,
  onMouseEnter,
  onMouseLeave,
  panelId,
}: CollectionsMegaPanelProps) {
  const { collections, catalogueProducts, catalogueLoaded } = useCart();
  const reduced = useReducedMotion();
  const panelRef = useRef<HTMLDivElement>(null);

  // Use live collections when available; fall back to canonical 4 collection navigation entries
  // (without fabricating any purchasable products) so links always stay intact.
  const displayCollections = useMemo<Collection[]>(() => {
    const source = collections.length > 0 ? collections : SEED_COLLECTIONS;
    return source.slice(0, 4);
  }, [collections]);

  const productsByCollection = useMemo(() => {
    const map = new Map<string, typeof catalogueProducts>();
    for (const prod of catalogueProducts) {
      if (!prod.collection_id) continue;
      const list = map.get(prod.collection_id) ?? [];
      list.push(prod);
      map.set(prod.collection_id, list);
    }
    return map;
  }, [catalogueProducts]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose(true);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        // Ignore clicks on the trigger itself (handled by Header)
        const trigger = document.getElementById('kv-collections-trigger');
        if (trigger && trigger.contains(e.target as Node)) return;
        onClose(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          id={panelId}
          role="region"
          aria-label="Browse collections"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          initial={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
          animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
          transition={
            reduced ? { duration: 0.01 } : { duration: 0.2, ease: KINVAI_EASE }
          }
          className="hidden lg:block absolute left-0 right-0 top-full pt-3 z-[var(--z-header)]"
        >
          <div className="kv-container">
            <div className="rounded-[32px] bg-surface border border-line shadow-[var(--shadow-float)] p-5">
              <div className="flex items-center justify-between gap-4 px-1 pb-4">
                <div>
                  <span className="type-label text-ink-2">Collections</span>
                  <p className="text-sm text-ink-2 mt-0.5">
                    Four ways to get a head start.
                  </p>
                </div>
                <Link
                  to="/collections"
                  viewTransition
                  onClick={() => onClose(false)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-ink hover:text-brand-deep transition-colors"
                >
                  <span>View all collections</span>
                  <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </Link>
              </div>

              <div className="grid grid-cols-4 gap-3.5">
                {displayCollections.map((col, idx) => {
                  const tintKey = accentToTileVariant(col.accent);
                  const bgClass = TINT_BG_MAP[tintKey] ?? 'bg-stone';
                  const badgeClass = TINT_BADGE_MAP[tintKey] ?? 'bg-surface text-ink-2';
                  const colProducts = productsByCollection.get(col.id) ?? [];
                  const countLabel =
                    colProducts.length > 0
                      ? `${colProducts.length} ${colProducts.length === 1 ? 'system' : 'systems'}`
                      : catalogueLoaded
                        ? 'Explore'
                        : 'Loading…';

                  return (
                    <Link
                      key={col.slug}
                      to={`/collections/${col.slug}`}
                      viewTransition
                      onClick={() => onClose(false)}
                      className={`group relative flex flex-col justify-between rounded-[24px] p-5 min-h-[268px] ${bgClass} border border-ink/[0.06] kv-press overflow-hidden`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full font-mono text-[11px] uppercase tracking-[0.06em] font-medium ${badgeClass}`}
                        >
                          {countLabel}
                        </span>
                        <span
                          aria-hidden="true"
                          className="w-9 h-9 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0"
                        >
                          <ArrowUpRight
                            size={17}
                            strokeWidth={1.75}
                            className="kv-arrow-icon"
                          />
                        </span>
                      </div>

                      {colProducts.length > 0 ? (
                        <div className="my-3">
                          <CoverStack
                            products={colProducts.slice(0, 3)}
                            collection={col}
                            size="sm"
                            className="max-w-[168px] !py-1 !px-3"
                          />
                        </div>
                      ) : (
                        <div
                          aria-hidden="true"
                          className="my-3 flex items-end justify-between border-t border-ink/10 pt-6"
                        >
                          <span className="font-mono text-4xl font-semibold text-ink/15 leading-none select-none">
                            0{idx + 1}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-brand" />
                        </div>
                      )}

                      <div className="mt-auto">
                        <h3 className="text-lg font-semibold tracking-tight text-ink leading-snug">
                          {col.name}
                        </h3>
                        {col.tagline && (
                          <p className="text-xs text-ink-2 mt-1 line-clamp-2 leading-relaxed">
                            {col.tagline}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
