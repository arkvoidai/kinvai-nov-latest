import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Heart, Home, Search, Store, User } from 'lucide-react';
import { useCart } from '../../lib/cart/CartProvider';

interface TabDef {
  id: 'home' | 'shop' | 'search' | 'saved' | 'account';
  label: string;
}

const TABS: TabDef[] = [
  { id: 'home', label: 'Home' },
  { id: 'shop', label: 'Shop' },
  { id: 'search', label: 'Search' },
  { id: 'saved', label: 'Saved' },
  { id: 'account', label: 'Account' },
];

/**
 * Mobile (<1024px) fixed bottom tab bar (64px + safe-area).
 * - Home, Shop, Search, Saved, Account with Lucide icons + visible 11px labels.
 * - Sliding active pill indicator (transform only).
 * - Hides on scroll down, returns on scroll up (8px threshold).
 * - Completely omitted on /products/:slug where the sticky buy bar replaces it.
 */
export function MobileBottomBar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const {
    savedIds,
    commandSearchOpen,
    setCommandSearchOpen,
    signInSheetOpen,
  } = useCart();

  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);

  // Never render on product detail pages — sticky buy bar replaces bottom navigation there
  const isProductDetail = pathname.startsWith('/products/') && pathname.length > '/products/'.length;

  useEffect(() => {
    setHidden(false);
    lastYRef.current = typeof window !== 'undefined' ? window.scrollY : 0;
  }, [pathname]);

  useEffect(() => {
    if (isProductDetail || typeof window === 'undefined') return;
    let rafId = 0;

    const onScroll = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        const y = window.scrollY;
        const delta = y - lastYRef.current;
        if (y <= 48) {
          setHidden(false);
          lastYRef.current = y;
          return;
        }
        if (Math.abs(delta) < 8) return;
        setHidden(delta > 0);
        lastYRef.current = y;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
    };
  }, [isProductDetail]);

  if (isProductDetail) {
    return null;
  }

  let activeIndex = 0;
  if (commandSearchOpen || pathname.startsWith('/search')) {
    activeIndex = 2;
  } else if (signInSheetOpen || pathname.startsWith('/account') || pathname.startsWith('/admin')) {
    activeIndex = 4;
  } else if (pathname.startsWith('/saved')) {
    activeIndex = 3;
  } else if (pathname.startsWith('/shop') || pathname.startsWith('/collections')) {
    activeIndex = 1;
  } else {
    activeIndex = 0;
  }

  const handleTabPress = (id: TabDef['id']) => {
    switch (id) {
      case 'home':
        navigate('/');
        break;
      case 'shop':
        navigate('/shop');
        break;
      case 'search':
        setCommandSearchOpen(true);
        break;
      case 'saved':
        navigate('/saved');
        break;
      case 'account':
        navigate('/account');
        break;
    }
  };

  return (
    <nav
      aria-label="Mobile bottom navigation"
      className={`lg:hidden fixed inset-x-0 bottom-0 z-[var(--z-header)] px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 pointer-events-none transition-transform duration-200 ease-out motion-reduce:transition-none ${
        hidden ? 'translate-y-[120%]' : 'translate-y-0'
      }`}
    >
      <div className="pointer-events-auto relative mx-auto max-w-[460px] h-16 rounded-full bg-surface/95 backdrop-blur-md border border-line shadow-[var(--shadow-float)] p-1.5 grid grid-cols-5 items-center">
        {/* Sliding active pill indicator (transform only) */}
        <div
          aria-hidden="true"
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/5)] rounded-full bg-ink transition-transform duration-250 ease-[cubic-bezier(0.2,0.7,0.2,1)] motion-reduce:transition-none pointer-events-none"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
        />

        {TABS.map((tab, idx) => {
          const isActive = idx === activeIndex;
          const iconClass = isActive ? 'text-white' : 'text-ink-2';
          const labelClass = isActive ? 'text-white' : 'text-ink-2';

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabPress(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className="relative z-10 flex flex-col items-center justify-center gap-1 h-full min-h-[48px] rounded-full cursor-pointer kv-press"
            >
              <span className="relative inline-flex items-center justify-center">
                {tab.id === 'home' && (
                  <Home size={20} strokeWidth={1.75} className={iconClass} aria-hidden="true" />
                )}
                {tab.id === 'shop' && (
                  <Store size={20} strokeWidth={1.75} className={iconClass} aria-hidden="true" />
                )}
                {tab.id === 'search' && (
                  <Search size={20} strokeWidth={1.75} className={iconClass} aria-hidden="true" />
                )}
                {tab.id === 'saved' && (
                  <Heart size={20} strokeWidth={1.75} className={iconClass} aria-hidden="true" />
                )}
                {tab.id === 'account' && (
                  <User size={20} strokeWidth={1.75} className={iconClass} aria-hidden="true" />
                )}
                {tab.id === 'saved' && savedIds.length > 0 && (
                  <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white font-mono text-[10px] font-medium leading-none inline-flex items-center justify-center tabular-nums"
                  >
                    {savedIds.length > 9 ? '9+' : savedIds.length}
                  </span>
                )}
              </span>
              <span className={`text-[11px] font-medium leading-none ${labelClass}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
