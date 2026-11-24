import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Lock, XCircle } from 'lucide-react';
import { RequireAuth } from '../components/auth/RequireAuth';
import { Breadcrumb, Button, PriceTag, TagPill, Tile } from '../components/primitives';
import { useCart } from '../lib/cart/CartProvider';
import { getPublicConfig } from '../lib/config';
import { usePageMeta } from '../lib/seo/usePageMeta';

export function CartRedirectPage() {
  const navigate = useNavigate();
  const { setCartOpen } = useCart();

  usePageMeta({ title: 'Cart — Kinvai', noindex: true });

  useEffect(() => {
    setCartOpen(true);
    navigate('/shop', { replace: true });
  }, [navigate, setCartOpen]);

  return null;
}

export function CheckoutPage() {
  usePageMeta({
    title: 'Checkout — Kinvai',
    description: 'Secure server-verified checkout.',
    noindex: true,
  });

  const { items, subtotalCents, hasPreviewItems } = useCart();
  const { flags } = getPublicConfig();

  return (
    <RequireAuth
      fallbackPath="/checkout"
      eyebrow="Secure checkout"
      heading="Sign in to complete your order."
      description="Sign in with Google so your digital licences and lifetime downloads are linked straight to your Kinvai library."
    >
      <div className="kv-container py-8 md:py-12 flex flex-col gap-8 max-w-4xl">
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Checkout' }]} />

        <div className="flex flex-col gap-2">
          <TagPill>Secure checkout</TagPill>
          <h1 className="type-h1 font-semibold text-ink mt-1">Order summary</h1>
          <p className="text-sm text-ink-2">1 licence per product. Yours for life.</p>
        </div>

        {items.length === 0 ? (
          <Tile variant="white" radius="xl" padding="lg">
            <p className="type-h3 font-semibold text-ink">
              Nothing here yet. Start with a head start.
            </p>
            <div className="mt-6">
              <Button variant="primary" to="/shop">
                Continue browsing
              </Button>
            </div>
          </Tile>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <Tile variant="white" radius="xl" padding="lg" className="md:col-span-7 flex flex-col gap-4">
              <span className="type-label text-ink-2">Items ({items.length})</span>
              <ul className="divide-y divide-line">
                {items.map((item) => (
                  <li key={item.productId} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="font-medium text-ink truncate">{item.name}</p>
                      <p className="type-label text-ink-2 mt-0.5">{item.sku}</p>
                    </div>
                    <PriceTag cents={item.priceCents} />
                  </li>
                ))}
              </ul>
              <div className="pt-4 border-t border-dashed border-line-strong flex items-center justify-between">
                <span className="font-medium text-ink">Total (USD)</span>
                <PriceTag cents={subtotalCents} size="lg" />
              </div>
            </Tile>

            <Tile variant="stone" radius="xl" padding="lg" className="md:col-span-5 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-ink">
                <Lock size={18} strokeWidth={1.75} aria-hidden="true" />
                <span className="font-semibold">Payment providers</span>
              </div>
              <p className="text-sm text-ink-2 leading-relaxed">
                Prices are verified on the server before payment starts. Digital entitlements unlock
                automatically after provider confirmation.
              </p>
              <div className="flex flex-col gap-2 text-xs font-mono text-ink-2">
                <span>Razorpay: {flags.razorpay ? 'configured' : 'not configured yet'}</span>
                <span>PayPal: {flags.paypal ? 'configured' : 'not configured yet'}</span>
              </div>
              <Button
                variant="primary"
                fullWidth
                disabled={hasPreviewItems || (!flags.razorpay && !flags.paypal)}
              >
                {hasPreviewItems
                  ? 'Preview items disabled'
                  : !flags.razorpay && !flags.paypal
                    ? 'Payment providers pending'
                    : 'Continue to payment'}
              </Button>
            </Tile>
          </div>
        )}
      </div>
    </RequireAuth>
  );
}

export function CheckoutSuccessPage() {
  usePageMeta({ title: 'Order Confirmed — Kinvai', noindex: true });

  return (
    <div className="kv-container py-12 md:py-16 max-w-2xl">
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-success-bg text-success inline-flex items-center justify-center">
          <CheckCircle2 size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <TagPill tone="success">Order verified</TagPill>
        <h1 className="type-h2 font-semibold text-ink">Your files are ready.</h1>
        <p className="type-body text-ink-2">
          Your purchase has been recorded and your digital licences are now available in your
          account library.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button variant="primary" to="/account?tab=library">
            Open my library
          </Button>
          <Button variant="secondary" to="/shop">
            Continue browsing
          </Button>
        </div>
      </Tile>
    </div>
  );
}

export function CheckoutCancelledPage() {
  usePageMeta({ title: 'Checkout Cancelled — Kinvai', noindex: true });

  return (
    <div className="kv-container py-12 md:py-16 max-w-2xl">
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-stone text-ink inline-flex items-center justify-center">
          <XCircle size={24} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <TagPill>Payment cancelled</TagPill>
        <h1 className="type-h2 font-semibold text-ink">No charge was made.</h1>
        <p className="type-body text-ink-2">
          Your cart is still saved whenever you want to return. If something went wrong, write to{' '}
          <a href="mailto:heyarkvoid@gmail.com" className="text-brand-deep underline">
            heyarkvoid@gmail.com
          </a>
          .
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button variant="primary" to="/checkout">
            Return to checkout
          </Button>
          <Button variant="secondary" to="/shop">
            Continue browsing
          </Button>
        </div>
      </Tile>
    </div>
  );
}
