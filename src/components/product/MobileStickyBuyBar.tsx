import { type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, Check, Download, Plus } from 'lucide-react';
import type { Product } from '../../lib/data/types';
import { KINVAI_SPRING, useReducedMotion } from '../../lib/motion';
import { resolvePurchaseState } from '../../lib/product/productHelpers';
import { Button, PriceTag } from '../primitives';

export interface MobileStickyBuyBarProps {
  visible: boolean;
  product: Product;
  isPreviewData: boolean;
  owned: boolean;
  inCart: boolean;
  justAdded: boolean;
  onAddToCart: (e: MouseEvent<HTMLButtonElement>) => void;
  onBuyNow: () => void;
  onGoToCheckout: () => void;
  onOpenCart: () => void;
}

/**
 * Sticky ink purchase bar for mobile (<1024px).
 * Appears with spring motion when the primary purchase buttons scroll out of the viewport,
 * sits cleanly above safe-area, replaces MobileBottomBar on /products/:slug,
 * and stays compact enough to fit cleanly at 320px without horizontal overflow.
 */
export function MobileStickyBuyBar({
  visible,
  product,
  isPreviewData,
  owned,
  inCart,
  justAdded,
  onAddToCart,
  onBuyNow,
  onGoToCheckout,
  onOpenCart,
}: MobileStickyBuyBarProps) {
  const reduced = useReducedMotion();
  const state = resolvePurchaseState({
    isPreviewData,
    isOwned: owned,
    isInCart: inCart,
  });

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="region"
          aria-label="Sticky purchase bar"
          data-sticky-buy-bar="visible"
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 76 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? { opacity: 0, y: 0 } : { opacity: 0, y: 76 }}
          transition={reduced ? { duration: 0.01 } : KINVAI_SPRING}
          className="lg:hidden fixed inset-x-0 bottom-0 z-[var(--z-header)] px-2.5 sm:px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 pointer-events-none"
        >
          <div className="pointer-events-auto mx-auto max-w-[540px] rounded-full bg-ink text-ink-on-dark shadow-[var(--shadow-float)] pl-4 pr-2 py-2 flex items-center justify-between gap-2 border border-white/10">
            <div className="min-w-0 shrink-0">
              <span className="block font-mono text-[10px] uppercase tracking-[0.06em] text-ink-on-dark-muted leading-none">
                {state === 'preview' ? 'Preview' : 'USD'}
              </span>
              <PriceTag
                cents={product.price_cents}
                size="md"
                inverted
                className="mt-0.5 block leading-none"
              />
            </div>

            {state === 'owned' ? (
              <Button
                variant="primary"
                inverted
                size="md"
                to="/account"
                icon={<Download size={16} strokeWidth={1.75} aria-hidden="true" />}
                className="min-h-[44px] px-4 text-xs sm:text-sm"
              >
                Download from your library
              </Button>
            ) : (
              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  type="button"
                  disabled={state === 'preview'}
                  onClick={state === 'in-cart' && !justAdded ? onOpenCart : onAddToCart}
                  className="min-h-[44px] px-3 sm:px-3.5 rounded-full bg-white/12 text-ink-on-dark border border-white/16 hover:bg-white/20 text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer kv-press disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                >
                  {state === 'preview' ? (
                    <span>Preview data</span>
                  ) : justAdded ? (
                    <>
                      <Check size={15} strokeWidth={2.2} className="text-emerald-300 shrink-0" aria-hidden="true" />
                      <span>Added</span>
                    </>
                  ) : state === 'in-cart' ? (
                    <>
                      <Check size={15} strokeWidth={2.2} className="text-emerald-300 shrink-0" aria-hidden="true" />
                      <span>In cart</span>
                    </>
                  ) : (
                    <>
                      <Plus size={15} strokeWidth={2} className="shrink-0" aria-hidden="true" />
                      <span>Add</span>
                    </>
                  )}
                </button>

                {state === 'in-cart' ? (
                  <button
                    type="button"
                    onClick={onGoToCheckout}
                    className="min-h-[44px] px-3.5 sm:px-4 rounded-full bg-surface text-ink hover:bg-page text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer kv-press focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                  >
                    <span>Checkout</span>
                    <ArrowRight size={15} strokeWidth={1.85} aria-hidden="true" />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={state === 'preview'}
                    onClick={onBuyNow}
                    className="min-h-[44px] px-3.5 sm:px-4 rounded-full bg-surface text-ink hover:bg-page text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer kv-press disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2"
                  >
                    <span>Buy now</span>
                    <ArrowRight size={15} strokeWidth={1.85} aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
