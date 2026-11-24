import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { accentToTileVariant } from '../../lib/data/format';
import { SEED_COLLECTIONS } from '../../lib/data/seed';
import type { Collection, Product } from '../../lib/data/types';
import { orderCanonicalCollections } from '../../lib/home/homeHelpers';
import { SplitHeadline, TileIn } from '../../lib/motion';
import { CoverStack, TagPill } from '../primitives';

export interface HomeCollectionsBentoProps {
  collections: Collection[];
  products: Product[];
}

const BENTO_BG: Record<string, string> = {
  'tint-peach': 'bg-peach',
  'tint-butter': 'bg-butter',
  'tint-lilac': 'bg-lilac',
  'tint-rose': 'bg-rose',
  stone: 'bg-stone',
};

const COLLECTION_HEADLINES: Record<string, string> = {
  'run-the-shop': 'Operate with calm spreadsheets & launch systems.',
  'make-the-thing': 'Pre-production blueprints for consistent output.',
  'build-the-world': 'Reference binders for deep fiction & campaigns.',
  'ship-the-interface': 'Clean interface kits built to ship fast.',
};

/**
 * Section 4 — Four ways to get a head start (Collections Bento):
 * - Desktop: 12-col asymmetric bento (Run the Shop 6x2 peach, Make the Thing 6 butter,
 *   Build the World 3 lilac, Ship the Interface 3 rose). Fine-pointer hover spreads CoverStack by 8px.
 * - Mobile: horizontal snap rail with 85% wide peeking cards + interactive pagination dots.
 */
export function HomeCollectionsBento({ collections, products }: HomeCollectionsBentoProps) {
  const railRef = useRef<HTMLDivElement>(null);
  const [mobileDot, setMobileDot] = useState(0);

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

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    let rafId = 0;

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const left = rail.scrollLeft;
        let closest = 0;
        let best = Number.POSITIVE_INFINITY;
        Array.from(rail.children).forEach((child, idx) => {
          const el = child as HTMLElement;
          const dist = Math.abs(el.offsetLeft - left);
          if (dist < best) {
            best = dist;
            closest = idx;
          }
        });
        setMobileDot(closest);
      });
    };

    rail.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      rail.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollMobileTo = (index: number) => {
    const rail = railRef.current;
    if (!rail) return;
    const child = rail.children[index] as HTMLElement | undefined;
    if (child) {
      rail.scrollTo({ left: child.offsetLeft, behavior: 'smooth' });
      setMobileDot(index);
    }
  };

  const renderTileInner = (col: Collection, idx: number, large: boolean, compact: boolean) => {
    const tint = accentToTileVariant(col.accent);
    const bgClass = BENTO_BG[tint] ?? 'bg-stone';
    const colProducts = productsByCollection.get(col.id) ?? [];
    const headline = COLLECTION_HEADLINES[col.slug] ?? col.name;
    const countText =
      colProducts.length > 0
        ? `${colProducts.length} ${colProducts.length === 1 ? 'system' : 'systems'}`
        : null;

    return (
      <Link
        to={`/collections/${col.slug}`}
        viewTransition
        className={`group/bento group/stack relative flex flex-col justify-between rounded-[28px] lg:rounded-[32px] ${bgClass} border border-ink/[0.07] hover:border-ink/25 transition-[border-color] duration-200 overflow-hidden h-full kv-press ${
          large ? 'p-6 sm:p-8 lg:p-9 min-h-[380px] lg:min-h-[560px]' : compact ? 'p-5 sm:p-6 min-h-[290px]' : 'p-6 sm:p-7 min-h-[290px]'
        }`}
      >
        {/* Top Row: TagPill + optional system count + Round Arrow */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex flex-wrap items-center gap-2">
            <TagPill className="bg-surface/95">{col.name}</TagPill>
            {countText && (
              <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
                {countText}
              </span>
            )}
          </div>
          <span
            aria-hidden="true"
            className="w-10 h-10 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0 group-hover/bento:bg-ink group-hover/bento:text-white transition-colors"
          >
            <ArrowUpRight size={18} strokeWidth={1.75} className="kv-arrow-icon" />
          </span>
        </div>

        {/* Middle/Bottom Content + CoverStack anchored lower-right */}
        <div
          className={`relative z-10 mt-5 flex flex-col justify-between gap-6 flex-1 ${
            !compact && !large ? 'sm:flex-row sm:items-end' : ''
          }`}
        >
          <div className={`flex flex-col gap-2.5 ${!compact && !large ? 'sm:max-w-[56%]' : 'max-w-[30ch]'}`}>
            <h3
              className={`font-semibold text-ink tracking-tight leading-snug ${
                large ? 'type-h2' : 'type-h3'
              }`}
            >
              {headline}
            </h3>
            {col.tagline && (
              <p className="text-sm text-ink-2 line-clamp-2 leading-relaxed">{col.tagline}</p>
            )}
          </div>

          {/* Lower-right CoverStack with fine-pointer hover 8px spread, or structured Swiss specimen */}
          {colProducts.length > 0 ? (
            <div
              className={`mt-auto self-end shrink-0 transition-transform duration-300 ease-out motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:group-hover/bento:-translate-y-2 ${
                large ? 'w-[220px] sm:w-[250px]' : compact ? 'w-[150px]' : 'w-[180px]'
              }`}
            >
              <CoverStack
                products={colProducts.slice(0, 3)}
                collection={col}
                size="sm"
                className="!py-1 !px-3"
              />
            </div>
          ) : large ? (
            <div className="mt-auto w-full rounded-[22px] bg-surface/80 border border-ink/[0.08] p-5 sm:p-6 flex flex-col justify-between gap-5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
                  Shelf 0{idx + 1} · {col.name}
                </span>
                <span className="w-2 h-2 rounded-full bg-brand shrink-0" aria-hidden="true" />
              </div>
              {col.story && (
                <p className="text-sm text-ink leading-relaxed max-w-[44ch]">{col.story}</p>
              )}
              <div className="pt-3 border-t border-ink/10 flex items-center justify-between gap-2 text-xs font-mono uppercase tracking-[0.06em] text-ink-2">
                <span>Instant download · 1 licence</span>
                <span className="text-ink font-semibold">0{idx + 1}</span>
              </div>
            </div>
          ) : (
            <div
              aria-hidden="true"
              className="mt-auto self-end flex items-end justify-end gap-2 pt-3"
            >
              <span className="font-mono text-5xl font-semibold text-ink/[0.15] leading-none select-none">
                0{idx + 1}
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-brand mb-1.5" />
            </div>
          )}
        </div>
      </Link>
    );
  };

  const gridClasses = [
    'lg:col-span-6 lg:row-span-2', // Run the Shop (peach, tall)
    'lg:col-span-6',               // Make the Thing (butter, wide)
    'lg:col-span-3',               // Build the World (lilac)
    'lg:col-span-3',               // Ship the Interface (rose)
  ];

  return (
    <section aria-labelledby="home-collections-heading" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="type-label text-ink-2">Collections</span>
          <SplitHeadline
            id="home-collections-heading"
            as="h2"
            immediate={false}
            text="Four ways to get a *head start.*"
            className="type-h2 font-semibold text-ink mt-1.5"
          />
        </div>
        <Link
          to="/collections"
          viewTransition
          className="group inline-flex items-center gap-2.5 pl-4 pr-1.5 py-1.5 min-h-[44px] rounded-full bg-surface border border-line hover:border-ink text-sm font-medium text-ink transition-colors kv-press"
        >
          <span>View all</span>
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-full bg-ink text-white inline-flex items-center justify-center"
          >
            <ArrowUpRight size={16} strokeWidth={1.75} className="kv-arrow-icon" />
          </span>
        </Link>
      </div>

      {/* Desktop Asymmetric 12-Col Bento */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-4">
        {ordered.map((col, idx) => (
          <TileIn key={col.slug} index={idx} className={gridClasses[idx] ?? 'lg:col-span-3'}>
            {renderTileInner(col, idx, idx === 0, idx >= 2)}
          </TileIn>
        ))}
      </div>

      {/* Mobile & Tablet Horizontal Snap Rail (85% wide peeking cards + dots) */}
      <div className="lg:hidden flex flex-col gap-4">
        <div
          ref={railRef}
          className="kv-scroll-snap flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6"
        >
          {ordered.map((col, idx) => (
            <div key={col.slug} className="w-[85%] sm:w-[62%] shrink-0 snap-start">
              {renderTileInner(col, idx, false, false)}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-2" role="tablist" aria-label="Collection slides">
          {ordered.map((col, idx) => (
            <button
              key={col.slug}
              type="button"
              role="tab"
              aria-selected={idx === mobileDot}
              aria-label={`Show ${col.name}`}
              onClick={() => scrollMobileTo(idx)}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === mobileDot ? 'w-7 bg-ink' : 'w-2 bg-line-strong hover:bg-ink-2'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
