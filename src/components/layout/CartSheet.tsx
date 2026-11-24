import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useCart, type CartItem } from '../../lib/cart/CartProvider';
import {
  Button,
  IconButton,
  PriceTag,
  ProductCover,
  Sheet,
  TagPill,
  useToast,
} from '../primitives';

/**
 * Cart Drawer (440px desktop) / Bottom Sheet (max 88dvh on phones):
 * - One licence per product, NO quantity stepper ("1 licence. Yours for life.")
 * - Rows: tinted cover thumb, name, tagline, price, remove
 * - Footer: subtotal, dashed divider, trust line, full-width near-black Checkout pill, Continue browsing link
 * - Empty state: Copy Bible line + 3 real product suggestions
 */
export function CartSheet() {
  const navigate = useNavigate();
  const {
    items,
    cartOpen,
    setCartOpen,
    removeFromCart,
    addToCart,
    isOwnedProduct,
    subtotalCents,
    hasPreviewItems,
    collections,
    catalogueProducts,
    catalogueIsPreview,
  } = useCart();
  const { toast } = useToast();

  const collectionsById = useMemo(
    () => new Map(collections.map((c) => [c.id, c])),
    [collections]
  );

  // Up to 3 real product suggestions for empty cart state
  const emptySuggestions = useMemo(() => {
    if (catalogueProducts.length === 0) return [];
    const featured = catalogueProducts.filter((p) => p.is_featured && !isOwnedProduct(p.id));
    const pool = featured.length >= 3 ? featured : catalogueProducts.filter((p) => !isOwnedProduct(p.id));
    return pool.slice(0, 3);
  }, [catalogueProducts, isOwnedProduct]);

  const handleRemove = (item: CartItem) => {
    removeFromCart(item.productId);
    toast({
      title: `Removed ${item.name}`,
      undoLabel: item.product && !item.isPreviewData ? 'Undo' : undefined,
      onUndo:
        item.product && !item.isPreviewData
          ? () => {
              addToCart(item.product!, false);
            }
          : undefined,
    });
  };

  const handleCheckout = () => {
    if (hasPreviewItems || items.length === 0) return;
    setCartOpen(false);
    navigate('/checkout');
  };

  return (
    <Sheet
      open={cartOpen}
      onClose={() => setCartOpen(false)}
      title={items.length > 0 ? `Your cart (${items.length})` : 'Your cart'}
      description="1 licence. Yours for life."
      widthClass="md:max-w-[440px]"
      footer={
        items.length > 0 ? (
          <div className="flex flex-col gap-3.5">
            <div className="flex items-center justify-between text-sm text-ink-2">
              <span>Digital delivery</span>
              <span className="font-mono text-xs uppercase tracking-[0.06em] text-ink">
                Instant
              </span>
            </div>

            <div className="border-t border-dashed border-line-strong pt-3.5 flex items-center justify-between">
              <span className="text-sm font-medium text-ink">Subtotal (USD)</span>
              <PriceTag cents={subtotalCents} size="lg" />
            </div>

            <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
              Instant download · Yours for life · Secure checkout
            </p>

            {hasPreviewItems && (
              <p className="text-xs text-ink-2">
                Preview items cannot be purchased until live products are published.
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={hasPreviewItems}
              onClick={handleCheckout}
            >
              Checkout
            </Button>

            <Link
              to="/shop"
              viewTransition
              onClick={() => setCartOpen(false)}
              className="text-center text-sm font-medium text-ink-2 hover:text-ink underline underline-offset-4 py-1 transition-colors"
            >
              Continue browsing
            </Link>
          </div>
        ) : undefined
      }
    >
      {items.length === 0 ? (
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center text-center px-2 pt-4">
            <div className="w-14 h-14 rounded-full bg-stone flex items-center justify-center mb-4 text-ink">
              <ShoppingBag size={24} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <p className="text-lg font-semibold text-ink tracking-tight">
              Nothing here yet. Start with a head start.
            </p>
            <p className="text-sm text-ink-2 mt-1.5 max-w-[30ch]">
              Every Kinvai product is 1 licence, yours for life, ready to download immediately.
            </p>
            <div className="mt-5">
              <Button variant="primary" to="/shop" onClick={() => setCartOpen(false)}>
                Continue browsing
              </Button>
            </div>
          </div>

          {emptySuggestions.length > 0 && (
            <div className="pt-5 border-t border-line flex flex-col gap-3">
              <span className="type-label text-ink-2">Popular starting points</span>
              <ul className="flex flex-col gap-2.5">
                {emptySuggestions.map((prod) => {
                  const col = prod.collection_id ? collectionsById.get(prod.collection_id) ?? null : null;
                  return (
                    <li
                      key={prod.id}
                      className="flex items-center gap-3 p-2.5 rounded-[18px] bg-page border border-line"
                    >
                      <Link
                        to={`/products/${prod.slug}`}
                        viewTransition
                        onClick={() => setCartOpen(false)}
                        className="w-12 shrink-0 block"
                      >
                        <ProductCover
                          product={prod}
                          collection={col}
                          ratio="4/5"
                          size="sm"
                          className="rounded-[10px]"
                        />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          to={`/products/${prod.slug}`}
                          viewTransition
                          onClick={() => setCartOpen(false)}
                          className="block text-sm font-semibold text-ink truncate hover:underline underline-offset-4"
                        >
                          {prod.name}
                        </Link>
                        <div className="mt-0.5 flex items-center gap-2">
                          <PriceTag cents={prod.price_cents} size="sm" />
                          {catalogueIsPreview && <TagPill tone="warning">Preview</TagPill>}
                        </div>
                      </div>
                      {catalogueIsPreview ? (
                        <IconButton
                          label={`View ${prod.name}`}
                          icon={<ArrowRight size={17} strokeWidth={1.75} />}
                          variant="surface"
                          size="sm"
                          to={`/products/${prod.slug}`}
                          onClick={() => setCartOpen(false)}
                        />
                      ) : (
                        <IconButton
                          label={`Add ${prod.name} to cart`}
                          icon={<Plus size={17} strokeWidth={2} />}
                          variant="ink"
                          size="sm"
                          onClick={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            addToCart(prod, false, {
                              x: rect.left + rect.width / 2,
                              y: rect.top + rect.height / 2,
                            });
                            toast({
                              title: `Added ${prod.name}`,
                              description: '1 licence. Yours for life.',
                              tone: 'success',
                              undoLabel: 'Undo',
                              onUndo: () => removeFromCart(prod.id),
                            });
                          }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((item) => {
            const col = item.collectionId ? collectionsById.get(item.collectionId) ?? null : null;
            return (
              <li
                key={item.productId}
                className="py-4 first:pt-0 flex items-start gap-3.5"
              >
                {/* Tinted 4:5 Cover Thumb */}
                <Link
                  to={item.slug ? `/products/${item.slug}` : '/shop'}
                  viewTransition
                  onClick={() => setCartOpen(false)}
                  className="w-14 shrink-0 block"
                >
                  <ProductCover
                    product={{
                      name: item.name,
                      sku: item.sku || 'KV',
                      file_formats: item.fileFormats,
                      cover_path: item.coverPath,
                    }}
                    collection={col}
                    ratio="4/5"
                    size="sm"
                    className="rounded-[12px]"
                  />
                </Link>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      to={item.slug ? `/products/${item.slug}` : '/shop'}
                      viewTransition
                      onClick={() => setCartOpen(false)}
                      className="font-semibold text-sm text-ink hover:underline underline-offset-4 leading-snug line-clamp-2"
                    >
                      {item.name}
                    </Link>
                    <IconButton
                      label={`Remove ${item.name} from cart`}
                      icon={<Trash2 size={16} strokeWidth={1.75} />}
                      variant="ghost"
                      size="sm"
                      className="-mt-1.5 -mr-1.5"
                      onClick={() => handleRemove(item)}
                    />
                  </div>

                  {item.tagline && (
                    <p className="text-xs text-ink-2 line-clamp-1 mt-0.5">{item.tagline}</p>
                  )}

                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-ink-2">
                      1 licence · Lifetime
                    </span>
                    <div className="flex items-center gap-2">
                      {item.isPreviewData && <TagPill tone="warning">Preview</TagPill>}
                      <PriceTag cents={item.priceCents} size="sm" />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Sheet>
  );
}
