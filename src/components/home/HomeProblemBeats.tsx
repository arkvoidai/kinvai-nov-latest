import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import type { Collection, Product } from '../../lib/data/types';
import { KINVAI_EASE, SplitHeadline, TileIn, useReducedMotion } from '../../lib/motion';
import { CoverStack, TagPill } from '../primitives';

export interface HomeProblemBeatsProps {
  products: Product[];
  collectionsById: Map<string, Collection>;
}

interface ProblemBeat {
  num: string;
  label: string;
  title: string;
  sentence: string;
  statement: string;
  tintClass: string;
  to: string;
  cta: string;
}

const BEATS: ProblemBeat[] = [
  {
    num: '01',
    label: 'Repeat work',
    title: "You've built this spreadsheet before.",
    sentence:
      'Skip rebuilding formulas, tabs and validation rules that already exist in a clean, tested file.',
    statement: 'Stop spending week one rebuilding the same scaffolding for every new project.',
    tintClass: 'bg-peach',
    to: '/collections/run-the-shop',
    cta: 'Explore Run the Shop',
  },
  {
    num: '02',
    label: 'Momentum',
    title: 'The blank page is the expensive part.',
    sentence:
      'Structure takes hours nobody sees; start with the architecture finished so your energy goes into the work.',
    statement: 'The real cost is the friction before you make your first real decision.',
    tintClass: 'bg-butter',
    to: '/collections/make-the-thing',
    cta: 'Explore Make the Thing',
  },
  {
    num: '03',
    label: 'Ownership',
    title: 'Good systems are boring to build and brilliant to own.',
    sentence:
      'We spend the slow weeks on edge cases and layout clarity so you open a finished system on minute one.',
    statement: 'Buy a properly built system once, adapt it freely, and keep it for life.',
    tintClass: 'bg-lilac',
    to: '/collections/ship-the-interface',
    cta: 'Explore Ship the Interface',
  },
];

/**
 * Section 3 — The Problem, Three Beats:
 * - Desktop: sticky left column with statement swapping across 3 beats via IntersectionObserver
 *   (no scroll hijacking), right column with 3 tinted tiles + CoverStack.
 * - Mobile: stacked tinted tiles, each >= 280px tall with rich content and zero dead space.
 */
export function HomeProblemBeats({ products, collectionsById }: HomeProblemBeatsProps) {
  const [activeBeat, setActiveBeat] = useState(0);
  const tileRefs = useRef<Array<HTMLDivElement | null>>([]);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof IntersectionObserver === 'undefined') return;
    const elements = tileRefs.current.filter((el): el is HTMLDivElement => Boolean(el));
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the most visible intersecting tile
        let bestIdx = -1;
        let bestRatio = 0;
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= bestRatio) {
            const idxAttr = entry.target.getAttribute('data-beat-index');
            const parsed = idxAttr ? Number(idxAttr) : -1;
            if (parsed >= 0) {
              bestIdx = parsed;
              bestRatio = entry.intersectionRatio;
            }
          }
        }
        if (bestIdx >= 0) {
          setActiveBeat(bestIdx);
        }
      },
      {
        rootMargin: '-22% 0px -38% 0px',
        threshold: [0.2, 0.45, 0.7],
      }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const current = BEATS[activeBeat] ?? BEATS[0];

  return (
    <section aria-labelledby="home-problem-heading" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Desktop Sticky Left Column */}
      <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col gap-6">
        <div>
          <span className="type-label text-ink-2">Why Kinvai exists</span>
          <SplitHeadline
            as="h2"
            immediate={false}
            text="Start at step *two.*"
            className="type-h1 font-semibold text-ink mt-2"
          />
        </div>

        <div className="rounded-[28px] lg:rounded-[32px] bg-surface border border-line p-6 sm:p-8 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2">
              Beat {current.num} / 03
            </span>
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Problem beats">
              {BEATS.map((beat, idx) => (
                <button
                  key={beat.num}
                  type="button"
                  role="tab"
                  aria-selected={idx === activeBeat}
                  aria-label={`Beat ${beat.num}: ${beat.title}`}
                  onClick={() => {
                    setActiveBeat(idx);
                    tileRefs.current[idx]?.scrollIntoView({
                      behavior: reduced ? 'auto' : 'smooth',
                      block: 'center',
                    });
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    idx === activeBeat ? 'w-7 bg-ink' : 'w-2 bg-line-strong hover:bg-ink-2'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[112px] flex items-center">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={current.num}
                initial={reduced ? { opacity: 1 } : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? { opacity: 1 } : { opacity: 0, y: -8 }}
                transition={reduced ? { duration: 0.01 } : { duration: 0.24, ease: KINVAI_EASE }}
                className="text-xl sm:text-2xl font-medium tracking-tight text-ink leading-snug"
              >
                {current.statement}
              </motion.p>
            </AnimatePresence>
          </div>

          <Link
            to="/shop"
            viewTransition
            className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brand-deep transition-colors w-fit"
          >
            <span>Browse ready-made systems</span>
            <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Right Column: Three Tinted Tiles */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        {BEATS.map((beat, idx) => {
          const beatProducts = products.slice(idx * 2, idx * 2 + 3);
          const fallbackSlice = beatProducts.length > 0 ? beatProducts : products.slice(0, 3);

          return (
            <div
              key={beat.num}
              ref={(el) => {
                tileRefs.current[idx] = el;
              }}
              data-beat-index={idx}
            >
              <TileIn index={idx}>
                <Link
                  to={beat.to}
                  viewTransition
                  className={`group block rounded-[28px] lg:rounded-[32px] ${beat.tintClass} border border-ink/[0.07] p-6 sm:p-8 min-h-[280px] transition-[border-color] duration-200 hover:border-ink/25 kv-press`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center h-full">
                    <div className="sm:col-span-7 flex flex-col justify-between gap-5 h-full">
                      <div className="flex items-center gap-2.5">
                        <TagPill className="bg-surface/90">{beat.num}</TagPill>
                        <span className="type-label text-ink-2">{beat.label}</span>
                      </div>

                      <div>
                        <h3 className="type-h3 font-semibold text-ink leading-snug">
                          {beat.title}
                        </h3>
                        <p className="text-sm sm:text-[15px] text-ink-2 mt-2.5 leading-relaxed">
                          {beat.sentence}
                        </p>
                      </div>

                      <span className="inline-flex items-center gap-2 text-sm font-medium text-ink pt-1">
                        <span>{beat.cta}</span>
                        <span
                          aria-hidden="true"
                          className="w-8 h-8 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors"
                        >
                          <ArrowUpRight size={15} strokeWidth={1.75} className="kv-arrow-icon" />
                        </span>
                      </span>
                    </div>

                    <div className="sm:col-span-5 flex items-center justify-center">
                      {fallbackSlice.length > 0 ? (
                        <CoverStack
                          products={fallbackSlice}
                          collectionsById={collectionsById}
                          size="sm"
                          className="max-w-[180px] !py-1 !px-3"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="w-full max-w-[190px] aspect-[4/5] rounded-[20px] bg-surface/75 border border-ink/10 p-5 flex flex-col justify-between"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                              Kinvai
                            </span>
                            <span className="w-2 h-2 rounded-full bg-brand" />
                          </div>
                          <span className="font-mono text-5xl font-semibold text-ink/15 leading-none">
                            {beat.num}
                          </span>
                          <div className="border-t border-ink/12 pt-3">
                            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2 block">
                              {beat.label}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </TileIn>
            </div>
          );
        })}
      </div>
    </section>
  );
}
