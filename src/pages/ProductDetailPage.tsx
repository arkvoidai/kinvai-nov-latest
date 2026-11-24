import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MobileStickyBuyBar } from '../components/product/MobileStickyBuyBar';
import { ProductEditorialSections } from '../components/product/ProductEditorialSections';
import { ProductGallery } from '../components/product/ProductGallery';
import { ProductLightbox } from '../components/product/ProductLightbox';
import { ProductPurchaseCard } from '../components/product/ProductPurchaseCard';
import { Breadcrumb, Button, Skeleton, TagPill, Tile, useToast } from '../components/primitives';
import { ShopErrorTile } from '../components/shop/ShopErrorTile';
import { useAuth } from '../lib/auth/AuthProvider';
import { useCart } from '../lib/cart/CartProvider';
import { getProductBySlug } from '../lib/data/repository';
import type { ProductDetail } from '../lib/data/types';
import { getProductOgImageUrl } from '../lib/media/imagePipeline';
import { collectLightboxImages } from '../lib/product/productHelpers';
import { usePageMeta } from '../lib/seo/usePageMeta';

function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return isDesktop;
}

export function ProductDetailPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const { user, profile, loading: authLoading } = useAuth();
  const {
    collections,
    addToCart,
    buyNow,
    removeFromCart,
    isInCart,
    isOwnedProduct,
    isSaved,
    toggleSaved,
    setCartOpen,
  } = useCart();
  const { toast } = useToast();

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [isPreviewData, setIsPreviewData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadNonce, setReloadNonce] = useState(0);

  // Add-to-cart 600ms drawn-check morph state
  const [justAdded, setJustAdded] = useState(false);
  const addedTimerRef = useRef<number | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Mobile sticky buy bar visibility (appears once primary purchase buttons leave viewport)
  const purchaseAnchorRef = useRef<HTMLDivElement | null>(null);
  const [stickyBarVisible, setStickyBarVisible] = useState(false);

  const isNotFound = !loading && !loadError && !detail;

  usePageMeta({
    title: isNotFound
      ? 'Product not found — Kinvai'
      : detail?.product.seo_title || (detail ? `${detail.product.name} — Kinvai` : 'Product — Kinvai'),
    description: isNotFound
      ? 'The requested Kinvai product could not be found.'
      : detail?.product.seo_description ||
        detail?.product.short_description ||
        'Downloadable digital system from Kinvai.',
    ogImage: detail ? getProductOgImageUrl(detail.product.cover_path) : null,
    noindex: isNotFound || detail?.product.status === 'archived',
    canonicalPath: detail ? `/products/${detail.product.slug}` : null,
  });

  useEffect(() => {
    if (authLoading) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    setLightboxOpen(false);
    setJustAdded(false);

    getProductBySlug(slug, {
      userId: user?.id ?? null,
      isAdmin: Boolean(profile?.is_admin),
    }).then((res) => {
      if (!active) return;
      if (res.error && !res.data) {
        setDetail(null);
        setLoadError(res.error);
      } else {
        setDetail(res.data);
        setIsPreviewData(res.isPreviewData);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [slug, user?.id, profile?.is_admin, authLoading, reloadNonce]);

  useEffect(() => {
    return () => {
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }
    };
  }, []);

  // Observe primary purchase actions on phones to slide up MobileStickyBuyBar when scrolled past
  useEffect(() => {
    if (isDesktop || loading || !detail) {
      setStickyBarVisible(false);
      return;
    }

    let rafId = 0;
    const evaluateVisibility = () => {
      rafId = 0;
      const node = purchaseAnchorRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      // Show sticky bar once the primary purchase controls scroll above the mobile top header
      setStickyBarVisible(rect.bottom <= 68);
    };

    const scheduleCheck = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(evaluateVisibility);
    };

    evaluateVisibility();

    const node = purchaseAnchorRef.current;
    const observer =
      node && typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(() => scheduleCheck(), { threshold: [0, 0.1, 1] })
        : null;

    if (observer && node) {
      observer.observe(node);
    }

    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      window.removeEventListener('scroll', scheduleCheck);
      window.removeEventListener('resize', scheduleCheck);
    };
  }, [isDesktop, loading, detail]);

  const lightboxImages = useMemo(() => {
    if (!detail) return [];
    return collectLightboxImages(detail.product, detail.media);
  }, [detail]);

  const handleBack = useCallback(() => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
    } else if (detail?.collection) {
      navigate(`/collections/${detail.collection.slug}`);
    } else {
      navigate('/shop');
    }
  }, [navigate, detail?.collection]);

  const handleShare = useCallback(async () => {
    if (!detail) return;
    const shareUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/products/${detail.product.slug}`
        : `/products/${detail.product.slug}`;

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: detail.product.name,
          text: detail.product.tagline ?? 'Downloadable digital system from Kinvai.',
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: 'Link copied',
          description: shareUrl,
          tone: 'success',
        });
        return;
      }
    } catch {
      // Fallback below
    }

    toast({
      title: 'Share this link',
      description: shareUrl,
    });
  }, [detail, toast]);

  const handleToggleSave = useCallback(() => {
    if (!detail) return;
    const next = toggleSaved(detail.product.id);
    toast({
      title: next ? `Saved ${detail.product.name}` : 'Removed from saved',
      undoLabel: 'Undo',
      onUndo: () => toggleSaved(detail.product.id),
    });
  }, [detail, toggleSaved, toast]);

  const handleAddToCart = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      if (!detail || isPreviewData) return;
      const prod = detail.product;
      if (isOwnedProduct(prod.id)) return;
      if (isInCart(prod.id)) {
        setCartOpen(true);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const added = addToCart(prod, false, {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });

      if (!added) {
        toast({
          title: "That didn't work.",
          description: 'Try again, or write to heyarkvoid@gmail.com.',
          tone: 'error',
        });
        return;
      }

      setJustAdded(true);
      if (addedTimerRef.current !== null) {
        window.clearTimeout(addedTimerRef.current);
      }

      addedTimerRef.current = window.setTimeout(() => {
        setJustAdded(false);
        if (isDesktop) {
          setCartOpen(true);
        }
      }, 600);

      toast({
        title: `Added ${prod.name}`,
        description: '1 licence. Yours for life.',
        tone: 'success',
        undoLabel: 'Undo',
        onUndo: () => removeFromCart(prod.id),
      });
    },
    [detail, isPreviewData, isOwnedProduct, isInCart, addToCart, isDesktop, setCartOpen, toast, removeFromCart]
  );

  const handleBuyNow = useCallback(() => {
    if (!detail || isPreviewData) return;
    const ok = buyNow(detail.product, false);
    if (!ok) {
      toast({
        title: "That didn't work.",
        description: 'Try again, or write to heyarkvoid@gmail.com.',
        tone: 'error',
      });
      return;
    }
    navigate('/checkout');
  }, [detail, isPreviewData, buyNow, navigate, toast]);

  const handleGoToCheckout = useCallback(() => {
    navigate('/checkout');
  }, [navigate]);

  const handleOpenLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  /* -------------------- LOADING SKELETON (Fixed geometry, zero layout shift) -------------------- */
  if (loading) {
    return (
      <div className="kv-container py-6 lg:py-10 flex flex-col gap-6">
        <Skeleton className="h-9 w-64 rounded-full hidden lg:block" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 flex flex-col gap-4">
            <Skeleton className="w-full aspect-[4/5] lg:aspect-auto lg:h-[580px] rounded-[28px] lg:rounded-[36px]" />
            <div className="hidden lg:grid grid-cols-3 gap-3.5">
              <Skeleton className="h-36 rounded-[24px]" />
              <Skeleton className="h-36 rounded-[24px]" />
              <Skeleton className="h-36 rounded-[24px]" />
            </div>
          </div>
          <Skeleton className="lg:col-span-5 h-[560px] rounded-[28px] lg:rounded-[36px]" />
        </div>
      </div>
    );
  }

  /* -------------------- LIVE QUERY ERROR WITH RETRY -------------------- */
  if (loadError) {
    return (
      <div className="kv-container py-12 md:py-16 max-w-3xl">
        <ShopErrorTile
          title="Could not load this product."
          onRetry={() => setReloadNonce((n) => n + 1)}
        />
      </div>
    );
  }

  /* -------------------- DESIGNED 404 FOR UNKNOWN SLUGS -------------------- */
  if (!detail) {
    return (
      <div className="kv-container py-14 md:py-24 max-w-2xl">
        <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-5">
          <TagPill>404 · Product not found</TagPill>
          <h1 className="type-h1 font-semibold text-ink">
            That system isn&apos;t on the <span className="font-accent-serif font-normal">shelf.</span>
          </h1>
          <p className="type-body text-ink-2 prose-measure">
            The product may have been archived or the link may be misspelled. Browse the full shop
            or check your account library if you purchased it earlier.
          </p>
          <div className="flex flex-wrap gap-2.5 pt-2">
            <Button variant="primary" to="/shop">
              Explore the shop
            </Button>
            <Button variant="secondary" to="/collections">
              Collections
            </Button>
            <Button variant="secondary" to="/account">
              Open my library
            </Button>
          </div>
        </Tile>
      </div>
    );
  }

  const { product, collection, media, related, ratingStats, reviews = [], userReview = null } =
    detail;
  const saved = isSaved(product.id);
  const inCart = isInCart(product.id);
  const owned = isOwnedProduct(product.id);

  return (
    <div className="kv-container pt-3 pb-28 lg:pt-8 lg:pb-20 flex flex-col gap-10 lg:gap-16">
      {/* Desktop Breadcrumb pill row: Home / Collection / Product */}
      <div className="hidden lg:flex items-center justify-between gap-4">
        <div className="inline-flex items-center rounded-full bg-surface border border-line px-4 py-2">
          <Breadcrumb
            items={[
              { label: 'Home', to: '/' },
              ...(collection
                ? [{ label: collection.name, to: `/collections/${collection.slug}` }]
                : [{ label: 'Shop', to: '/shop' }]),
              { label: product.name },
            ]}
          />
        </div>
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink-2">
          {product.sku}
        </span>
      </div>

      {/* Main 12-col Product Bento (Wink Desktop / Mobile Shop App Phone) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* LEFT — 7 COLUMNS */}
        <div className="lg:col-span-7">
          <ProductGallery
            product={product}
            collection={collection}
            media={media}
            saved={saved}
            isDesktop={isDesktop}
            onBack={handleBack}
            onToggleSave={handleToggleSave}
            onShare={handleShare}
            onOpenLightbox={handleOpenLightbox}
          />
        </div>

        {/* RIGHT — 5 COLUMNS (Sticky below floating desktop header) */}
        <div className="lg:col-span-5 lg:sticky lg:top-24">
          <ProductPurchaseCard
            product={product}
            collection={collection}
            ratingStats={ratingStats}
            isPreviewData={isPreviewData}
            owned={owned}
            inCart={inCart}
            saved={saved}
            justAdded={justAdded}
            isDesktop={isDesktop}
            purchaseAnchorRef={purchaseAnchorRef}
            onAddToCart={handleAddToCart}
            onBuyNow={handleBuyNow}
            onGoToCheckout={handleGoToCheckout}
            onOpenCart={() => setCartOpen(true)}
            onToggleSave={handleToggleSave}
          />
        </div>
      </div>

      {/* Distinct Editorial Sections Below Purchase Area */}
      <ProductEditorialSections
        product={product}
        collection={collection}
        related={related}
        allCollections={collections}
        ratingStats={ratingStats}
        reviews={reviews}
        userReview={userReview}
        isPreviewData={isPreviewData}
        owned={owned}
        inCart={inCart}
        onBuyNow={handleBuyNow}
        onGoToCheckout={handleGoToCheckout}
      />

      {/* Fullscreen Lightbox for available product_media images */}
      <ProductLightbox
        open={lightboxOpen}
        images={lightboxImages}
        activeIndex={lightboxIndex}
        accent={collection?.accent}
        productName={product.name}
        onIndexChange={setLightboxIndex}
        onClose={() => setLightboxOpen(false)}
      />

      {/* Sticky Mobile Purchase Bar (slides up once primary buttons leave viewport) */}
      <MobileStickyBuyBar
        visible={stickyBarVisible && !lightboxOpen}
        product={product}
        isPreviewData={isPreviewData}
        owned={owned}
        inCart={inCart}
        justAdded={justAdded}
        onAddToCart={handleAddToCart}
        onBuyNow={handleBuyNow}
        onGoToCheckout={handleGoToCheckout}
        onOpenCart={() => setCartOpen(true)}
      />
    </div>
  );
}
