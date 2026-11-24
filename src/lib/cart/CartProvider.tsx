import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '../auth/AuthProvider';
import {
  addWishlistItem,
  getCollections,
  getLibrary,
  getProducts,
  getWishlist,
  removeWishlistItem,
  upsertWishlistItems,
} from '../data/repository';
import type { Collection, Product } from '../data/types';
import { mergeWishlistIds, useWishlistIds, wishlistStore } from '../wishlist/wishlistStore';
import { cartStore, useCartProductIds } from './cartStore';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  tagline: string | null;
  sku: string;
  priceCents: number;
  collectionId: string | null;
  coverPath: string | null;
  fileFormats: string[];
  isPreviewData: boolean;
  product?: Product;
}

export interface CartFlightSource {
  x: number;
  y: number;
}

interface CartContextValue {
  /** Hydrated cart items resolved from product IDs stored in localStorage */
  items: CartItem[];
  /** Raw persisted product IDs (source of truth in localStorage v2) */
  cartProductIds: string[];
  savedIds: string[];
  ownedIds: string[];
  collections: Collection[];
  catalogueProducts: Product[];
  catalogueIsPreview: boolean;
  catalogueLoaded: boolean;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  commandSearchOpen: boolean;
  setCommandSearchOpen: (open: boolean) => void;
  signInSheetOpen: boolean;
  signInNextPath: string;
  openSignInSheet: (nextPath?: string) => void;
  closeSignInSheet: () => void;
  addToCart: (product: Product, isPreviewData: boolean, flightOrigin?: CartFlightSource) => boolean;
  buyNow: (product: Product, isPreviewData: boolean) => boolean;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  isOwnedProduct: (productId: string) => boolean;
  toggleSaved: (productId: string) => boolean;
  isSaved: (productId: string) => boolean;
  subtotalCents: number;
  hasPreviewItems: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const cartProductIds = useCartProductIds();
  const savedIds = useWishlistIds();

  const [ownedIds, setOwnedIds] = useState<string[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [catalogueProducts, setCatalogueProducts] = useState<Product[]>([]);
  const [catalogueIsPreview, setCatalogueIsPreview] = useState(false);
  const [catalogueLoaded, setCatalogueLoaded] = useState(false);

  // Runtime cache of products passed directly to addToCart (in case a product isn't in initial 48)
  const [productCache, setProductCache] = useState<Record<string, Product>>({});

  const [cartOpen, setCartOpen] = useState(false);
  const [commandSearchOpen, setCommandSearchOpen] = useState(false);
  const [signInSheetOpen, setSignInSheetOpen] = useState(false);
  const [signInNextPath, setSignInNextPath] = useState('/account');

  // Load shared catalogue snapshot once for header mega panel, cart hydration, and empty cart suggestions
  useEffect(() => {
    let active = true;
    Promise.all([getCollections(), getProducts({ pageSize: 48 })])
      .then(([colRes, prodRes]) => {
        if (!active) return;
        setCollections(colRes.data);
        setCatalogueProducts(prodRes.items);
        setCatalogueIsPreview(colRes.isPreviewData || prodRes.isPreviewData);
        setCatalogueLoaded(true);
      })
      .catch(() => {
        if (active) setCatalogueLoaded(true);
      });
    return () => {
      active = false;
    };
  }, []);

  // Load owned entitlements and merge guest wishlist when user signs in
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOwnedIds([]);
      return;
    }

    let active = true;

    Promise.all([getLibrary(user.id), getWishlist(user.id)])
      .then(async ([entitlements, remoteWishlist]) => {
        if (!active) return;
        const owned = entitlements.map((e) => e.product_id);
        setOwnedIds(owned);

        const remoteIds = remoteWishlist.map((w) => w.product_id);
        const guestIds = wishlistStore.getGuestLocalIds();
        const { merged, toInsert } = mergeWishlistIds(guestIds, remoteIds);

        wishlistStore.set(merged, false);

        if (toInsert.length > 0) {
          const ok = await upsertWishlistItems(user.id, toInsert);
          if (ok && active) {
            wishlistStore.clearGuestLocalIds();
          }
        }
      })
      .catch(() => {
        // Leave existing local state intact on transient read error
      });

    return () => {
      active = false;
    };
  }, [user, authLoading]);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of catalogueProducts) {
      map.set(p.id, p);
    }
    for (const p of Object.values(productCache)) {
      if (!map.has(p.id)) {
        map.set(p.id, p);
      }
    }
    return map;
  }, [catalogueProducts, productCache]);

  const items = useMemo<CartItem[]>(() => {
    const resolved: CartItem[] = [];
    for (const productId of cartProductIds) {
      const prod = productById.get(productId);
      if (prod) {
        resolved.push({
          productId: prod.id,
          slug: prod.slug,
          name: prod.name,
          tagline: prod.tagline,
          sku: prod.sku,
          priceCents: prod.price_cents,
          collectionId: prod.collection_id,
          coverPath: prod.cover_path,
          fileFormats: prod.file_formats,
          isPreviewData: catalogueIsPreview,
          product: prod,
        });
      } else if (!catalogueLoaded) {
        // Reserve stable slot while initial catalogue resolves
        resolved.push({
          productId,
          slug: '',
          name: 'Loading system…',
          tagline: null,
          sku: '',
          priceCents: 0,
          collectionId: null,
          coverPath: null,
          fileFormats: [],
          isPreviewData: false,
        });
      }
    }
    return resolved;
  }, [cartProductIds, productById, catalogueIsPreview, catalogueLoaded]);

  const openSignInSheet = useCallback((nextPath?: string) => {
    const fallback =
      typeof window !== 'undefined'
        ? `${window.location.pathname}${window.location.search}`
        : '/account';
    setSignInNextPath(nextPath || fallback);
    setSignInSheetOpen(true);
  }, []);

  const closeSignInSheet = useCallback(() => {
    setSignInSheetOpen(false);
  }, []);

  const isOwnedProduct = useCallback(
    (productId: string) => ownedIds.includes(productId),
    [ownedIds]
  );

  const addToCart = useCallback(
    (product: Product, isPreviewData: boolean, flightOrigin?: CartFlightSource): boolean => {
      if (isPreviewData) {
        // Charter 7(d): preview/seed data cannot be purchased
        return false;
      }
      if (ownedIds.includes(product.id)) {
        return false;
      }
      setProductCache((prev) => (prev[product.id] ? prev : { ...prev, [product.id]: product }));
      const added = cartStore.add(product.id);
      if (added && flightOrigin) {
        cartStore.triggerFlight(flightOrigin.x, flightOrigin.y);
      }
      return added;
    },
    [ownedIds]
  );

  const buyNow = useCallback(
    (product: Product, isPreviewData: boolean): boolean => {
      if (isPreviewData || ownedIds.includes(product.id)) {
        return false;
      }
      setProductCache((prev) => (prev[product.id] ? prev : { ...prev, [product.id]: product }));
      cartStore.replace([product.id]);
      return true;
    },
    [ownedIds]
  );

  const removeFromCart = useCallback((productId: string) => {
    cartStore.remove(productId);
  }, []);

  const clearCart = useCallback(() => {
    cartStore.clear();
  }, []);

  const isInCart = useCallback(
    (productId: string) => cartProductIds.includes(productId),
    [cartProductIds]
  );

  const toggleSaved = useCallback(
    (productId: string): boolean => {
      const isSignedIn = Boolean(user);
      const { nowSaved, previous } = wishlistStore.toggleOptimistic(productId, !isSignedIn);

      if (user) {
        const op = nowSaved
          ? addWishlistItem(user.id, productId)
          : removeWishlistItem(user.id, productId);

        void op.then((ok) => {
          if (!ok) {
            // Roll back optimistic state on remote failure
            wishlistStore.set(previous, false);
          }
        });
      }

      return nowSaved;
    },
    [user]
  );

  const isSaved = useCallback((productId: string) => savedIds.includes(productId), [savedIds]);

  const subtotalCents = useMemo(
    () => items.reduce((sum, item) => sum + item.priceCents, 0),
    [items]
  );

  const hasPreviewItems = useMemo(() => items.some((i) => i.isPreviewData), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      cartProductIds,
      savedIds,
      ownedIds,
      collections,
      catalogueProducts,
      catalogueIsPreview,
      catalogueLoaded,
      cartOpen,
      setCartOpen,
      commandSearchOpen,
      setCommandSearchOpen,
      signInSheetOpen,
      signInNextPath,
      openSignInSheet,
      closeSignInSheet,
      addToCart,
      buyNow,
      removeFromCart,
      clearCart,
      isInCart,
      isOwnedProduct,
      toggleSaved,
      isSaved,
      subtotalCents,
      hasPreviewItems,
    }),
    [
      items,
      cartProductIds,
      savedIds,
      ownedIds,
      collections,
      catalogueProducts,
      catalogueIsPreview,
      catalogueLoaded,
      cartOpen,
      commandSearchOpen,
      signInSheetOpen,
      signInNextPath,
      openSignInSheet,
      closeSignInSheet,
      addToCart,
      buyNow,
      removeFromCart,
      clearCart,
      isInCart,
      isOwnedProduct,
      toggleSaved,
      isSaved,
      subtotalCents,
      hasPreviewItems,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
