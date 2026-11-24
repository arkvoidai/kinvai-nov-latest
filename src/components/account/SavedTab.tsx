import { useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Heart } from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';
import { KINVAI_TWEEN, useReducedMotion } from '../../lib/motion';
import { ProductCard, ProductCardSkeleton } from '../layout/ProductCard';
import { Button, Tile } from '../primitives';

/**
 * Account Saved Tab:
 * Reuses shared <ProductCard> and existing CartProvider / wishlistStore (zero duplicated logic),
 * with optimistic unsave transitions respecting prefers-reduced-motion.
 */
export function SavedTab() {
  const { savedIds, catalogueProducts, collections, catalogueIsPreview, catalogueLoaded } =
    useCart();
  const reduced = useReducedMotion();

  const collectionById = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections]
  );

  const savedProducts = useMemo(() => {
    const byId = new Map(catalogueProducts.map((p) => [p.id, p]));
    return savedIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [savedIds, catalogueProducts]);

  if (!catalogueLoaded && savedIds.length > 0) {
    return (
      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {savedIds.slice(0, 6).map((id) => (
          <ProductCardSkeleton key={id} variant="standard" />
        ))}
      </div>
    );
  }

  if (savedProducts.length === 0) {
    return (
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-stone text-ink inline-flex items-center justify-center">
          <Heart size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="max-w-lg">
          <h2 className="type-h3 font-semibold text-ink">Nothing saved yet.</h2>
          <p className="text-sm sm:text-base text-ink-2 mt-2 leading-relaxed">
            Tap the heart on any product to build a shortlist synced to your account across devices.
          </p>
        </div>
        <Button variant="primary" size="lg" to="/shop">
          Explore the shop
        </Button>
      </Tile>
    );
  }

  return (
    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      <AnimatePresence mode="popLayout" initial={false}>
        {savedProducts.map((product) => (
          <motion.div
            key={product.id}
            layout={!reduced}
            initial={reduced ? { opacity: 1 } : { opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
            transition={reduced ? { duration: 0.01 } : KINVAI_TWEEN}
          >
            <ProductCard
              product={product}
              collection={product.collection_id ? collectionById.get(product.collection_id) : null}
              isPreviewData={catalogueIsPreview}
              variant="standard"
              enableViewTransition={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
