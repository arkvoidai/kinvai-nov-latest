import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, ReceiptText, ShieldCheck } from 'lucide-react';
import { AccountHeaderBento } from '../components/account/AccountHeaderBento';
import { AccountTabsNav } from '../components/account/AccountTabsNav';
import { LibraryTab } from '../components/account/LibraryTab';
import { OrdersTab } from '../components/account/OrdersTab';
import { ProfileTab } from '../components/account/ProfileTab';
import { SavedTab } from '../components/account/SavedTab';
import { RequireAuth } from '../components/auth/RequireAuth';
import { Breadcrumb, Button, IconButton, PriceTag, TagPill, Tile } from '../components/primitives';
import {
  formatOrderDate,
  formatOrderStatus,
  parseAccountTab,
  type AccountLibraryItem,
  type AccountOrder,
  type AccountTab,
} from '../lib/account/accountHelpers';
import { useAuth } from '../lib/auth/AuthProvider';
import { useCart } from '../lib/cart/CartProvider';
import { getAccountLibrary, getAccountOrders } from '../lib/data/repository';
import type { Collection, Review } from '../lib/data/types';
import { KINVAI_TWEEN, useReducedMotion } from '../lib/motion';
import { usePageMeta } from '../lib/seo/usePageMeta';

const MORE_LINKS = [
  { label: 'Collections', to: '/collections', note: 'Four ways to get a head start' },
  { label: 'How it works', to: '/how-it-works', note: 'Instant downloads & lifetime access' },
  { label: 'Support', to: '/support', note: 'Help with orders and files' },
  { label: 'Licence', to: '/licence', note: '1 licence per product. Yours for life.' },
  { label: 'Privacy', to: '/legal/privacy', note: 'How Kinvai handles your data' },
  { label: 'Terms', to: '/legal/terms', note: 'Storefront terms of service' },
  { label: 'Refunds', to: '/legal/refunds', note: 'Digital product refund policy' },
  { label: 'About', to: '/about', note: 'Arkvoid Inc. & Kinvai' },
];

function AccountMoreSection() {
  return (
    <section aria-labelledby="account-more-heading" className="pt-2">
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col gap-4">
        <div>
          <span className="type-label text-ink-2">More</span>
          <h2 id="account-more-heading" className="type-h3 font-semibold text-ink mt-1">
            Pages, policies &amp; help
          </h2>
        </div>
        <nav aria-label="More Kinvai links" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {MORE_LINKS.map((item) => (
            <Link
              key={`${item.label}-${item.to}`}
              to={item.to}
              viewTransition
              className="group flex items-center justify-between gap-3 min-h-[54px] px-4 py-3 rounded-[16px] bg-page hover:bg-stone transition-colors kv-press"
            >
              <div className="min-w-0">
                <span className="block text-sm font-medium text-ink">{item.label}</span>
                <span className="block text-xs text-ink-2 truncate">{item.note}</span>
              </div>
              <ArrowRight
                size={16}
                strokeWidth={1.75}
                className="text-ink-2 group-hover:text-ink shrink-0 transition-colors"
                aria-hidden="true"
              />
            </Link>
          ))}
        </nav>
      </Tile>
    </section>
  );
}

function LibrarySupportingRail({
  latestOrder,
  collections,
  onSelectTab,
}: {
  latestOrder: AccountOrder | null;
  collections: Collection[];
  onSelectTab: (tab: AccountTab) => void;
}) {
  const latestStatus = latestOrder ? formatOrderStatus(latestOrder.status) : null;

  return (
    <aside aria-label="Account shortcuts" className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
      {latestOrder && latestStatus ? (
        <Tile variant="white" radius="xl" padding="md" className="flex flex-col justify-between gap-4 kv-bento-tile">
          <div className="flex items-center justify-between gap-2">
            <TagPill>Latest order</TagPill>
            <ReceiptText size={16} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-ink">
                {latestOrder.order_number}
              </span>
              <TagPill tone={latestStatus.tone}>{latestStatus.label}</TagPill>
            </div>
            <p className="text-xs text-ink-2">{formatOrderDate(latestOrder.created_at)}</p>
            <div className="pt-1">
              <PriceTag cents={latestOrder.total_cents} size="md" />
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            fullWidth
            onClick={() => onSelectTab('orders')}
          >
            View all orders
          </Button>
        </Tile>
      ) : (
        <Tile variant="white" radius="xl" padding="md" className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2">
            <TagPill>Collections</TagPill>
            <IconButton
              label="Browse all collections"
              icon={<ArrowUpRight size={17} strokeWidth={1.75} className="kv-arrow-icon" />}
              variant="stone"
              size="sm"
              to="/collections"
              className="kv-arrow-trigger"
            />
          </div>
          <p className="text-xs text-ink-2 leading-relaxed">
            Jump straight into a curated system line.
          </p>
          <ul className="flex flex-col gap-1.5">
            {collections.slice(0, 4).map((col) => (
              <li key={col.id}>
                <Link
                  to={`/collections/${col.slug}`}
                  viewTransition
                  className="group flex items-center justify-between gap-2 min-h-[40px] px-3.5 py-2 rounded-[14px] bg-page hover:bg-stone text-sm font-medium text-ink transition-colors kv-press"
                >
                  <span className="truncate">{col.name}</span>
                  <ArrowRight
                    size={15}
                    strokeWidth={1.75}
                    className="text-ink-2 group-hover:text-ink shrink-0"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        </Tile>
      )}

      <Tile variant="stone" radius="xl" padding="md" className="flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-2">
          <TagPill className="bg-surface">Licence</TagPill>
          <ShieldCheck size={17} strokeWidth={1.75} className="text-ink-2" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-ink">Instant private downloads</h3>
          <p className="text-xs text-ink-2 leading-relaxed mt-1">
            Files sign freshly on each download and stay linked to your account for life.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-1 text-xs font-medium">
          <Link to="/how-it-works" viewTransition className="text-ink hover:text-brand-deep underline underline-offset-2">
            How it works
          </Link>
          <Link to="/support" viewTransition className="text-brand-deep underline underline-offset-2">
            Support
          </Link>
        </div>
      </Tile>
    </aside>
  );
}

function AuthenticatedAccountView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();
  const { savedIds, collections } = useCart();
  const reduced = useReducedMotion();

  const activeTab = parseAccountTab(searchParams);

  const [libraryItems, setLibraryItems] = useState<AccountLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  const [orders, setOrders] = useState<AccountOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const userId = user?.id ?? '';

  const loadLibrary = useCallback(async () => {
    if (!userId) return;
    setLibraryLoading(true);
    setLibraryError(null);
    const res = await getAccountLibrary(userId);
    setLibraryItems(res.items);
    setLibraryError(res.error ?? null);
    setLibraryLoading(false);
  }, [userId]);

  const loadOrders = useCallback(async () => {
    if (!userId) return;
    setOrdersLoading(true);
    setOrdersError(null);
    const res = await getAccountOrders(userId);
    setOrders(res.orders);
    setOrdersError(res.error ?? null);
    setOrdersLoading(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    void loadLibrary();
    void loadOrders();
  }, [userId, loadLibrary, loadOrders]);

  const handleSelectTab = useCallback(
    (nextTab: AccountTab) => {
      if (nextTab === activeTab) return;
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set('tab', nextTab);
      setSearchParams(nextParams, { preventScrollReset: true });
    },
    [activeTab, searchParams, setSearchParams]
  );

  const handleReviewSaved = useCallback((productId: string, savedReview: Review) => {
    setLibraryItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, userReview: savedReview } : item
      )
    );
  }, []);

  if (!user) return null;

  return (
    <div className="kv-container py-8 md:py-12 max-w-[1280px] flex flex-col gap-6 md:gap-8">
      <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Account' }]} />

      <AccountHeaderBento
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        ownedCount={libraryLoading ? null : libraryItems.length}
        savedCount={savedIds.length}
        onSelectTab={handleSelectTab}
        onSignOut={signOut}
      />

      <AccountTabsNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        counts={{
          library: libraryLoading ? null : libraryItems.length,
          saved: savedIds.length,
          orders: ordersLoading ? null : orders.length,
        }}
      />

      <section
        id={`kv-account-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`kv-account-tab-${activeTab}`}
        className="min-h-[260px]"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={reduced ? { duration: 0.01 } : { ...KINVAI_TWEEN, duration: 0.18 }}
          >
            {activeTab === 'library' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <Tile
                  variant="white"
                  radius="xl"
                  padding="lg"
                  className="lg:col-span-8 xl:col-span-9 flex flex-col gap-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="type-label text-ink-2">Library</span>
                      <h2 className="type-h3 font-semibold text-ink mt-1">
                        Your downloads
                      </h2>
                    </div>
                    {!libraryLoading && !libraryError && (
                      <span className="font-mono text-xs text-ink-2 tabular-nums">
                        {libraryItems.length} {libraryItems.length === 1 ? 'system' : 'systems'}
                      </span>
                    )}
                  </div>

                  <LibraryTab
                    userId={user.id}
                    items={libraryItems}
                    collections={collections}
                    loading={libraryLoading}
                    error={libraryError}
                    onRetry={loadLibrary}
                    onReviewSaved={handleReviewSaved}
                  />
                </Tile>

                <LibrarySupportingRail
                  latestOrder={orders[0] ?? null}
                  collections={collections}
                  onSelectTab={handleSelectTab}
                />
              </div>
            )}

            {activeTab === 'saved' && <SavedTab />}

            {activeTab === 'orders' && (
              <OrdersTab
                orders={orders}
                loading={ordersLoading}
                error={ordersError}
                onRetry={loadOrders}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                profile={profile}
                onProfileUpdated={refreshProfile}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      <AccountMoreSection />
    </div>
  );
}

export function AccountPage() {
  usePageMeta({
    title: 'Account — Kinvai',
    description: 'Manage your Kinvai library, saved items, orders and profile.',
    noindex: true,
  });

  return (
    <RequireAuth
      fallbackPath="/account"
      eyebrow="Persistent session"
      heading="Sign in to your library."
      description="Access your purchased downloads, saved shortlist, and order receipts across every device."
      unauthenticatedFooter={<AccountMoreSection />}
    >
      <AuthenticatedAccountView />
    </RequireAuth>
  );
}
