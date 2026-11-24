import { useMemo } from 'react';
import { Heart, Smartphone } from 'lucide-react';
import { ProductCard, ProductCardSkeleton } from '../components/layout/ProductCard';
import { Breadcrumb, Button, TagPill, Tile } from '../components/primitives';
import { useAuth } from '../lib/auth/AuthProvider';
import { useCart } from '../lib/cart/CartProvider';
import { SEED_COLLECTIONS } from '../lib/data/seed';
import { orderCanonicalCollections } from '../lib/home/homeHelpers';
import { SplitHeadline, TileIn } from '../lib/motion';
import { usePageMeta } from '../lib/seo/usePageMeta';

export function SavedPage() {
  usePageMeta({
    title: 'Saved — Kinvai',
    description: 'Your saved Kinvai digital products.',
    noindex: true,
  });

  const { user, loading: authLoading } = useAuth();
  const {
    savedIds,
    collections,
    catalogueProducts,
    catalogueIsPreview,
    catalogueLoaded,
    openSignInSheet,
  } = useCart();

  const orderedCollections = useMemo(() => {
    const src = collections.length > 0 ? collections : SEED_COLLECTIONS;
    return orderCanonicalCollections(src);
  }, [collections]);

  const collectionsById = useMemo(
    () => new Map(orderedCollections.map((c) => [c.id, c])),
    [orderedCollections]
  );

  const savedProducts = useMemo(
    () => catalogueProducts.filter((p) => savedIds.includes(p.id)),
    [catalogueProducts, savedIds]
  );

  const loading = !catalogueLoaded;

  return (
    <div className="kv-container py-6 sm:py-8 lg:py-12 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Saved' }]} />
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <TagPill>SAVED</TagPill>
              {catalogueIsPreview && savedProducts.length > 0 && (
                <TagPill tone="warning">Preview data</TagPill>
              )}
            </div>
            <SplitHeadline
              as="h1"
              immediate
              text="Saved *systems.*"
              className="type-h1 font-semibold text-ink mt-2"
            />
          </div>

          <span className="font-mono text-xs uppercase tracking-[0.08em] text-ink-2 tabular-nums">
            {savedIds.length} {savedIds.length === 1 ? 'item' : 'items'} saved
          </span>
        </div>
      </div>

      {/* Gentle Guest Banner */}
      {!authLoading && !user && (
        <Tile
          variant="tint-butter"
          radius="xl"
          padding="md"
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-ink/[0.08]"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <span
              aria-hidden="true"
              className="w-10 h-10 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0"
            >
              <Smartphone size={18} strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-sm sm:text-base font-semibold text-ink">
                Sign in to keep these on every device.
              </p>
              <p className="text-xs sm:text-sm text-ink-2 mt-0.5">
                Your shortlist stays in this browser for now and merges automatically when you sign in.
              </p>
            </div>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => openSignInSheet('/saved')}
            className="shrink-0 self-start sm:self-center"
          >
            Sign in with Google
          </Button>
        </Tile>
      )}

      {/* Saved Products Grid or Empty State */}
      {loading ? (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <ProductCardSkeleton key={n} variant="standard" />
          ))}
        </div>
      ) : savedProducts.length > 0 ? (
        <div className="grid grid-cols-1 min-[340px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {savedProducts.map((prod, idx) => (
            <TileIn key={prod.id} index={idx}>
              <ProductCard
                product={prod}
                collection={
                  prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null
                }
                isPreviewData={catalogueIsPreview}
              />
            </TileIn>
          ))}
        </div>
      ) : (
        <Tile
          variant="white"
          radius="xl"
          padding="lg"
          className="max-w-2xl flex flex-col items-start gap-4"
        >
          <span
            aria-hidden="true"
            className="w-11 h-11 rounded-full bg-peach text-ink inline-flex items-center justify-center"
          >
            <Heart size={19} strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="type-h3 font-semibold text-ink">Nothing saved yet.</h2>
            <p className="text-sm sm:text-base text-ink-2 mt-1.5 max-w-[44ch]">
              Tap the heart on any product card in the shop or collections to keep a shortlist for
              later.
            </p>
          </div>
          <div className="pt-1 flex flex-wrap gap-3">
            <Button variant="primary" to="/shop">
              Explore the shop
            </Button>
            <Button variant="secondary" to="/collections">
              Browse collections
            </Button>
          </div>
        </Tile>
      )}
    </div>
  );
}
