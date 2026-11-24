import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { accentToTileVariant } from '../../lib/data/format';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection, Product } from '../../lib/data/types';
import { orderCanonicalCollections } from '../../lib/home/homeHelpers';
import { CoverStack, TagPill } from '../primitives';

export interface HomeStartingPointProps {
  collections: Collection[];
  products: Product[];
}

const PREVIEW_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

const ROW_ONE_LINERS: Record<string, string> = {
  'run-the-shop': 'Operating models, pricing calculators and launch playbooks.',
  'make-the-thing': 'Briefs, shot sheets and production templates for creative output.',
  'build-the-world': 'Lore bibles, timelines and faction trackers for rich universes.',
  'ship-the-interface': 'Design tokens, layout kits and launch QA checklists.',
};

/**
 * Section 6 — "Find your starting point." (Nest rows-with-arrows beside a big tinted tile).
 * Hovering or focusing a row swaps the right-hand CoverStack preview with a 260ms crossfade.
 * Clicking a row navigates directly to /collections/:slug.
 */
export function HomeStartingPoint({ collections, products }: HomeStartingPointProps) {
  const prefersReduced = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);

  const ordered = useMemo(() => {
    const src = collections.length > 0 ? collections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src).slice(0, 4);
  }, [collections]);

  const productsByCollection = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.collection_id) continue;
      const arr = map.get(p.collection_id) ?? [];
      arr.push(p);
      map.set(p.collection_id, arr);
    }
    return map;
  }, [products]);

  const activeCollection = ordered[activeIndex] ?? ordered[0];
  if (!activeCollection) return null;

  const activeTint = accentToTileVariant(activeCollection.accent);
  const activeBg = PREVIEW_BG[activeTint] ?? 'bg-stone';
  const activeProducts = productsByCollection.get(activeCollection.id) ?? [];

  return (
    <section
      aria-labelledby="home-starting-point-heading"
      className="rounded-[28px] lg:rounded-[36px] bg-surface border border-line p-6 sm:p-8 lg:p-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        {/* Left: Heading + 4 interactive collection rows */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          <div>
            <span className="type-label text-ink-2">Browse by discipline</span>
            <h2
              id="home-starting-point-heading"
              className="type-h2 font-semibold text-ink mt-1.5"
            >
              Find your <span className="font-accent-serif font-normal text-brand-deep">starting point.</span>
            </h2>
            <p className="type-body text-ink-2 mt-2 max-w-[44ch]">
              Four focused shelves. Hover or select a discipline to preview its systems, then step straight inside.
            </p>
          </div>

          <div className="divide-y divide-line border-y border-line">
            {ordered.map((col, idx) => {
              const isActive = idx === activeIndex;
              const desc = col.tagline || ROW_ONE_LINERS[col.slug] || '';
              const colCount = productsByCollection.get(col.id)?.length ?? 0;

              return (
                <div
                  key={col.slug}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onFocus={() => setActiveIndex(idx)}
                  className="group relative"
                >
                  <Link
                    to={`/collections/${col.slug}`}
                    viewTransition
                    className={`flex items-center justify-between gap-4 py-4 sm:py-5 px-2 -mx-2 rounded-[16px] transition-colors min-h-[68px] ${
                      isActive ? 'bg-stone/70' : 'hover:bg-stone/40'
                    }`}
                  >
                    <div className="min-w-0 flex items-start gap-3.5">
                      <span
                        className={`font-mono text-xs pt-1 tabular-nums transition-colors ${
                          isActive ? 'text-brand-deep font-semibold' : 'text-ink-3'
                        }`}
                      >
                        0{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span className="text-base sm:text-lg font-semibold text-ink">
                            {col.name}
                          </span>
                          {colCount > 0 && (
                            <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
                              {colCount} {colCount === 1 ? 'file' : 'files'}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-ink-2 mt-0.5 line-clamp-1">{desc}</p>
                      </div>
                    </div>

                    <span
                      aria-hidden="true"
                      className={`w-10 h-10 rounded-full inline-flex items-center justify-center shrink-0 transition-colors ${
                        isActive
                          ? 'bg-ink text-white'
                          : 'bg-surface border border-line text-ink group-hover:bg-ink group-hover:text-white'
                      }`}
                    >
                      <ArrowRight size={17} strokeWidth={1.75} />
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Mobile quick preview switcher (since phones have no hover) */}
          <div className="flex lg:hidden items-center gap-2 overflow-x-auto pb-1">
            {ordered.map((col, idx) => (
              <button
                key={col.slug}
                type="button"
                onClick={() => setActiveIndex(idx)}
                className={`px-3.5 py-2 min-h-[40px] rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  idx === activeIndex
                    ? 'bg-ink text-white'
                    : 'bg-stone text-ink-2 hover:text-ink'
                }`}
              >
                Preview {col.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Single large tinted tile with 260ms crossfade */}
        <div className="lg:col-span-6">
          <Link
            to={`/collections/${activeCollection.slug}`}
            viewTransition
            className="block group focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-4 rounded-[28px] lg:rounded-[32px]"
          >
            <div
              className={`relative rounded-[28px] lg:rounded-[32px] ${activeBg} border border-ink/[0.08] p-6 sm:p-8 min-h-[360px] sm:min-h-[440px] lg:min-h-[480px] flex flex-col justify-between overflow-hidden transition-colors duration-250`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={activeCollection.slug}
                  initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
                  transition={{ duration: prefersReduced ? 0 : 0.26, ease: [0.2, 0.7, 0.2, 1] }}
                  className="flex flex-col justify-between flex-1 gap-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <TagPill className="bg-surface/95">{activeCollection.name}</TagPill>
                    <span className="inline-flex items-center gap-1.5 pl-3.5 pr-1.5 py-1 rounded-full bg-surface/95 border border-ink/10 text-xs font-medium text-ink">
                      <span>Explore</span>
                      <span
                        aria-hidden="true"
                        className="w-7 h-7 rounded-full bg-ink text-white inline-flex items-center justify-center"
                      >
                        <ArrowUpRight size={14} strokeWidth={1.75} className="kv-arrow-icon" />
                      </span>
                    </span>
                  </div>

                  {/* Center CoverStack or Swiss typographic composition */}
                  <div className="my-auto py-2">
                    {activeProducts.length > 0 ? (
                      <CoverStack
                        products={activeProducts.slice(0, 3)}
                        collection={activeCollection}
                        size="sm"
                      />
                    ) : (
                      <div className="max-w-[300px] mx-auto rounded-[24px] bg-surface/85 border border-ink/10 p-6 flex flex-col justify-between min-h-[240px]">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                            Shelf 0{activeIndex + 1}
                          </span>
                          <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
                        </div>
                        <div className="my-5">
                          <p className="type-h3 font-semibold text-ink leading-snug">
                            {activeCollection.name}
                          </p>
                          <p className="text-sm text-ink-2 mt-2 leading-relaxed">
                            {activeCollection.tagline || ROW_ONE_LINERS[activeCollection.slug]}
                          </p>
                        </div>
                        <div className="h-px bg-ink/15" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-ink-2 max-w-[42ch] leading-relaxed">
                    {activeCollection.story || ROW_ONE_LINERS[activeCollection.slug]}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
