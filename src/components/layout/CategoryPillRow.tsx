import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../lib/cart/CartProvider';
import { SEED_COLLECTIONS } from '../../lib/data/seed';

/**
 * Pill category row shown below the floating desktop header on /shop and /collections routes.
 * Renders "All" + the 4 Kinvai collections, with the active chip filled in near-black ink.
 */
export function CategoryPillRow() {
  const { pathname } = useLocation();
  const { collections } = useCart();

  const shouldShow =
    pathname === '/shop' ||
    pathname === '/collections' ||
    pathname.startsWith('/collections/');

  const displayCollections = useMemo(
    () => (collections.length > 0 ? collections : SEED_COLLECTIONS).slice(0, 4),
    [collections]
  );

  if (!shouldShow) return null;

  const isAllActive = pathname === '/shop' || pathname === '/collections';

  return (
    <div className="hidden lg:block pt-2.5">
      <nav
        aria-label="Collection quick filter"
        className="flex items-center gap-2 overflow-x-auto kv-scroll-snap py-0.5"
      >
        <Link
          to="/shop"
          viewTransition
          aria-current={isAllActive ? 'page' : undefined}
          className={`inline-flex items-center h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors kv-press ${
            isAllActive
              ? 'bg-ink text-white border border-ink'
              : 'bg-surface text-ink-2 border border-line hover:text-ink hover:border-line-strong'
          }`}
        >
          All
        </Link>

        {displayCollections.map((col) => {
          const isActive = pathname === `/collections/${col.slug}`;
          return (
            <Link
              key={col.slug}
              to={`/collections/${col.slug}`}
              viewTransition
              aria-current={isActive ? 'page' : undefined}
              className={`inline-flex items-center h-9 px-4 rounded-full text-sm font-medium whitespace-nowrap transition-colors kv-press ${
                isActive
                  ? 'bg-ink text-white border border-ink'
                  : 'bg-surface text-ink-2 border border-line hover:text-ink hover:border-line-strong'
              }`}
            >
              {col.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
