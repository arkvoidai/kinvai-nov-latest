import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, Heart, Search, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useCart } from '../../lib/cart/CartProvider';
import { IconButton, Logo, Skeleton } from '../primitives';
import { CategoryPillRow } from './CategoryPillRow';
import { CollectionsMegaPanel } from './CollectionsMegaPanel';

/**
 * Global Header:
 * - Desktop (>=1024px): Floating 16px from top, max-w 1360px, separate 56px soft white pills
 *   (Promax DNA): [Logo] [Search pill with "/" hint + dark round search button]
 *   [Shop] [Collections + mega panel] [How it works] [Saved] [Cart] [Account pill].
 *   Compacts via transform scale(0.96) + shadow on scroll; hides on scroll down and returns
 *   on scroll up (8px threshold) without ever animating height.
 * - Mobile (<1024px): 56px bar with logo left, round search & cart buttons right.
 */
export function Header() {
  const { pathname, search } = useLocation();
  const { user, profile, loading: authLoading } = useAuth();
  const {
    items,
    savedIds,
    setCartOpen,
    setCommandSearchOpen,
    openSignInSheet,
  } = useCart();

  const [megaOpen, setMegaOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  const megaId = useId();
  const openTimerRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);
  const lastYRef = useRef(0);
  const headerRef = useRef<HTMLElement>(null);

  const clearMegaTimers = useCallback(() => {
    if (openTimerRef.current !== null) {
      window.clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleMegaOpen = useCallback(() => {
    clearMegaTimers();
    openTimerRef.current = window.setTimeout(() => {
      setMegaOpen(true);
    }, 80);
  }, [clearMegaTimers]);

  const scheduleMegaClose = useCallback(() => {
    clearMegaTimers();
    closeTimerRef.current = window.setTimeout(() => {
      setMegaOpen(false);
    }, 120);
  }, [clearMegaTimers]);

  const closeMegaImmediate = useCallback(
    (restoreFocus = false) => {
      clearMegaTimers();
      setMegaOpen(false);
      if (restoreFocus) {
        document.getElementById('kv-collections-trigger')?.focus();
      }
    },
    [clearMegaTimers]
  );

  // Close mega panel and reveal header on route changes
  useEffect(() => {
    setMegaOpen(false);
    setHidden(false);
    lastYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
  }, [pathname]);

  useEffect(() => () => clearMegaTimers(), [clearMegaTimers]);

  // Transform-only scroll compaction + 8px threshold hide-on-down / reveal-on-up
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let rafId = 0;

    const handleScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY;
        const delta = y - lastYRef.current;

        setScrolled(y > 24);

        if (y <= 64 || megaOpen) {
          setHidden(false);
          lastYRef.current = y;
          return;
        }

        // Keep header visible while keyboard focus is inside it
        if (headerRef.current && headerRef.current.contains(document.activeElement)) {
          setHidden(false);
          lastYRef.current = y;
          return;
        }

        if (Math.abs(delta) < 8) return;
        setHidden(delta > 0);
        lastYRef.current = y;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [megaOpen]);

  const firstName =
    profile?.display_name?.trim().split(/\s+/)[0] ||
    user?.email?.split('@')[0] ||
    'Account';

  const avatarInitial = firstName.charAt(0).toUpperCase();
  const isCollectionsRoute =
    pathname === '/collections' || pathname.startsWith('/collections/');

  const pillShadow = scrolled ? 'shadow-[var(--shadow-float)]' : '';

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-[var(--z-header)] pt-2.5 lg:pt-4 pb-2 transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${
        hidden ? '-translate-y-[125%]' : 'translate-y-0'
      }`}
    >
      {/* MOBILE TOP BAR (<1024px) — 56px */}
      <div className="lg:hidden kv-container">
        <div
          className={`flex items-center justify-between gap-3 h-14 px-2 rounded-full bg-surface/92 backdrop-blur-md border border-line transition-shadow duration-200 ${pillShadow}`}
        >
          <Link
            to="/"
            viewTransition
            aria-label="Kinvai home"
            className="inline-flex items-center h-11 px-3.5 rounded-full hover:bg-stone transition-colors shrink-0"
          >
            <Logo height={20} />
          </Link>

          <div className="flex items-center gap-1.5 shrink-0">
            <IconButton
              label="Search catalogue"
              icon={<Search size={20} strokeWidth={1.75} />}
              variant="stone"
              size="md"
              onClick={() => setCommandSearchOpen(true)}
            />
            <IconButton
              id="kv-mobile-cart-btn"
              label={items.length > 0 ? `Open cart (${items.length})` : 'Open cart'}
              icon={<ShoppingBag size={20} strokeWidth={1.75} />}
              variant="ink"
              size="md"
              badgeCount={items.length}
              onClick={() => setCartOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* DESKTOP FLOATING PILL BAR (>=1024px) — 56px pills, separate soft white pills */}
      <div className="hidden lg:block kv-container relative">
        <div
          className={`origin-top transition-transform duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none ${
            scrolled ? 'scale-[0.96]' : 'scale-100'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {/* 1. Logo Pill */}
            <Link
              to="/"
              viewTransition
              aria-label="Kinvai home"
              className={`inline-flex items-center justify-center h-14 px-5 rounded-full bg-surface/95 backdrop-blur-md border border-line hover:border-line-strong transition-colors shrink-0 kv-press ${pillShadow}`}
            >
              <Logo height={21} />
            </Link>

            {/* 2. Flexible Search Pill with "/" hint and dark round search button */}
            <button
              type="button"
              onClick={() => setCommandSearchOpen(true)}
              aria-label="Search spreadsheets, kits, worlds"
              className={`group flex-1 min-w-[200px] h-14 pl-5 pr-2 rounded-full bg-surface/95 backdrop-blur-md border border-line hover:border-line-strong transition-colors flex items-center justify-between gap-3 text-left cursor-pointer ${pillShadow}`}
            >
              <span className="text-sm text-ink-3 group-hover:text-ink-2 transition-colors truncate">
                Search spreadsheets, kits, worlds...
              </span>
              <span className="flex items-center gap-2 shrink-0">
                <kbd
                  aria-hidden="true"
                  className="hidden xl:inline-flex items-center justify-center min-w-[26px] h-6 px-1.5 rounded-full bg-page border border-line font-mono text-[11px] text-ink-2"
                >
                  /
                </kbd>
                <span
                  aria-hidden="true"
                  className="w-10 h-10 rounded-full bg-ink text-white inline-flex items-center justify-center group-hover:bg-ink-soft transition-colors"
                >
                  <Search size={18} strokeWidth={1.75} />
                </span>
              </span>
            </button>

            {/* 3. Navigation Pills: [Shop] [Collections] [How it works] */}
            <nav aria-label="Primary navigation" className="flex items-center gap-2 shrink-0">
              <NavLink
                to="/shop"
                viewTransition
                className={({ isActive }) =>
                  `inline-flex items-center justify-center h-14 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors kv-press ${pillShadow} ${
                    isActive
                      ? 'bg-ink text-white border border-ink'
                      : 'bg-surface/95 backdrop-blur-md text-ink border border-line hover:bg-stone hover:border-line-strong'
                  }`
                }
              >
                Shop
              </NavLink>

              <button
                id="kv-collections-trigger"
                type="button"
                aria-expanded={megaOpen}
                aria-controls={megaId}
                onMouseEnter={scheduleMegaOpen}
                onMouseLeave={scheduleMegaClose}
                onClick={() => {
                  clearMegaTimers();
                  setMegaOpen((prev) => !prev);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape' && megaOpen) {
                    e.preventDefault();
                    closeMegaImmediate(true);
                  }
                }}
                className={`inline-flex items-center justify-center gap-1.5 h-14 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors kv-press cursor-pointer ${pillShadow} ${
                  megaOpen || isCollectionsRoute
                    ? 'bg-ink text-white border border-ink'
                    : 'bg-surface/95 backdrop-blur-md text-ink border border-line hover:bg-stone hover:border-line-strong'
                }`}
              >
                <span>Collections</span>
                <ChevronDown
                  size={16}
                  strokeWidth={1.75}
                  aria-hidden="true"
                  className={`transition-transform duration-200 ${megaOpen ? 'rotate-180' : ''}`}
                />
              </button>

              <NavLink
                to="/how-it-works"
                viewTransition
                className={({ isActive }) =>
                  `inline-flex items-center justify-center h-14 px-5 rounded-full text-sm font-medium whitespace-nowrap transition-colors kv-press ${pillShadow} ${
                    isActive
                      ? 'bg-ink text-white border border-ink'
                      : 'bg-surface/95 backdrop-blur-md text-ink border border-line hover:bg-stone hover:border-line-strong'
                  }`
                }
              >
                How it works
              </NavLink>
            </nav>

            {/* 4. Saved & Cart Round Buttons with Count */}
            <div className="flex items-center gap-2 shrink-0">
              <IconButton
                label={savedIds.length > 0 ? `Saved items (${savedIds.length})` : 'Saved items'}
                icon={<Heart size={20} strokeWidth={1.75} />}
                badgeCount={savedIds.length}
                to="/saved"
                className={`!w-14 !h-14 bg-surface/95 backdrop-blur-md ${pillShadow}`}
              />

              <IconButton
                id="kv-header-cart-btn"
                label={items.length > 0 ? `Open cart (${items.length})` : 'Open cart'}
                icon={<ShoppingBag size={20} strokeWidth={1.75} />}
                badgeCount={items.length}
                onClick={() => setCartOpen(true)}
                className={`!w-14 !h-14 bg-surface/95 backdrop-blur-md ${pillShadow}`}
              />
            </div>

            {/* 5. Account Pill: fixed min-width slot prevents layout shift while auth resolves */}
            <div className="shrink-0 min-w-[118px] h-14 flex items-center justify-end">
              {authLoading ? (
                <Skeleton className="w-[118px] h-14" rounded="pill" />
              ) : user ? (
                <Link
                  to="/account"
                  viewTransition
                  className={`inline-flex items-center gap-2.5 h-14 pl-2.5 pr-4 rounded-full bg-surface/95 backdrop-blur-md border border-line hover:bg-stone hover:border-line-strong text-sm font-medium text-ink transition-colors max-w-[172px] kv-press ${pillShadow}`}
                >
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt=""
                      width={34}
                      height={34}
                      className="w-[34px] h-[34px] rounded-full object-cover border border-line shrink-0"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="w-[34px] h-[34px] rounded-full bg-ink text-white text-xs font-semibold inline-flex items-center justify-center shrink-0"
                    >
                      {avatarInitial}
                    </span>
                  )}
                  <span className="truncate">{firstName}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => openSignInSheet(`${pathname}${search}`)}
                  className={`inline-flex items-center justify-center gap-2 h-14 px-5 rounded-full bg-surface/95 backdrop-blur-md border border-line hover:bg-stone hover:border-line-strong text-sm font-medium text-ink transition-colors whitespace-nowrap kv-press cursor-pointer ${pillShadow}`}
                >
                  <User size={18} strokeWidth={1.75} className="shrink-0" aria-hidden="true" />
                  <span>Sign in</span>
                </button>
              )}
            </div>
          </div>

          {/* Pill Category Row below header on /shop and /collections routes */}
          <CategoryPillRow />
        </div>
      </div>

      {/* Desktop Collections Mega Panel */}
      <CollectionsMegaPanel
        open={megaOpen}
        onClose={closeMegaImmediate}
        onMouseEnter={clearMegaTimers}
        onMouseLeave={scheduleMegaClose}
        panelId={megaId}
      />
    </header>
  );
}
