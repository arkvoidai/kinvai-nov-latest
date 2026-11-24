import { ArrowUpRight } from 'lucide-react';
import type { Collection, Product } from '../../lib/data/types';
import { selectSpotlightProducts } from '../../lib/home/homeHelpers';
import { SplitHeadline } from '../../lib/motion';
import { Button, CoverStack } from '../primitives';

export interface HomeClosingBannerProps {
  featured: Product[];
  allProducts: Product[];
  collectionsById: Map<string, Collection>;
}

/**
 * Section 13 — Closing Banner (Converse Closing Tile):
 * Inverted ink tile (36px desktop, 28px mobile) with overlay headline
 * "Your next project, *already started.*", a CoverStack, and "Open the shop" button.
 */
export function HomeClosingBanner({
  featured,
  allProducts,
  collectionsById,
}: HomeClosingBannerProps) {
  const stackItems = selectSpotlightProducts(featured, allProducts, 3);

  return (
    <section
      aria-labelledby="home-closing-heading"
      className="relative rounded-[28px] lg:rounded-[36px] bg-ink text-page overflow-hidden p-7 sm:p-10 lg:p-14"
    >
      {/* Subtle architectural concentric ring motif (Converse closing tile DNA, flat hairline only) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -bottom-24 w-[420px] h-[420px] rounded-full border border-white/[0.07]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-10 -bottom-10 w-[280px] h-[280px] rounded-full border border-white/[0.07]"
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
        <div className="lg:col-span-7 flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-white/65">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" aria-hidden="true" />
            Ready when you are
          </span>

          <SplitHeadline
            id="home-closing-heading"
            as="h2"
            immediate={false}
            text="Your next project, *already started.*"
            className="type-display font-semibold text-page leading-[1.03] max-w-[14ch]"
          />

          <p className="type-body text-white/70 max-w-[44ch]">
            Skip the blank file. Open a finished spreadsheet, playbook, world binder or interface
            kit and start at step two.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              inverted
              size="lg"
              to="/shop"
            >
              <span>Open the shop</span>
              <ArrowUpRight size={18} strokeWidth={1.75} className="kv-arrow-icon" aria-hidden="true" />
            </Button>
            <Button
              variant="secondary"
              inverted
              size="lg"
              to="/collections"
            >
              Browse collections
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5 flex items-center justify-center">
          {stackItems.length > 0 ? (
            <CoverStack
              products={stackItems}
              collectionsById={collectionsById}
              size="sm"
            />
          ) : (
            <div className="w-full max-w-[300px] rounded-[24px] bg-white/[0.06] border border-white/12 p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60">
                  Kinvai Library
                </span>
                <span className="w-2 h-2 rounded-full bg-brand" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[14px] bg-peach text-ink p-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">01</span>
                  <p className="text-xs font-semibold mt-1">Run the Shop</p>
                </div>
                <div className="rounded-[14px] bg-butter text-ink p-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">02</span>
                  <p className="text-xs font-semibold mt-1">Make the Thing</p>
                </div>
                <div className="rounded-[14px] bg-lilac text-ink p-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">03</span>
                  <p className="text-xs font-semibold mt-1">Build the World</p>
                </div>
                <div className="rounded-[14px] bg-rose text-ink p-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2">04</span>
                  <p className="text-xs font-semibold mt-1">Ship the Interface</p>
                </div>
              </div>
              <p className="text-xs text-white/65 leading-relaxed">
                1 licence per product. Instant download. Yours for life.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
