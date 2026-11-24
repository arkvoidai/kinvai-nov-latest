import { useEffect, useRef, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { validateNextPath } from '../../lib/auth/authHelpers';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useCart } from '../../lib/cart/CartProvider';
import { Button, Skeleton, TagPill, Tile } from '../primitives';

export interface RequireAuthProps {
  children: ReactNode;
  fallbackPath?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  /** Optional content rendered below the sign-in prompt (e.g., mobile "More" links on /account) */
  unauthenticatedFooter?: ReactNode;
}

/**
 * Protected route guard for /account and /checkout:
 * 1. Waits until AuthProvider loading === false (never prematurely treats resolving session as signed-out).
 * 2. When unauthenticated, opens the existing SignInSheet once with validated same-origin `next` path
 *    so the user returns straight to their intended path after Google sign-in.
 * 3. Renders a calm fallback prompt if the user dismisses the sheet.
 */
export function RequireAuth({
  children,
  fallbackPath = '/account',
  eyebrow = 'Sign in required',
  heading = 'Sign in to continue.',
  description = 'Access your purchased downloads, saved shortlist, and order receipts across every device.',
  unauthenticatedFooter,
}: RequireAuthProps) {
  const { pathname, search } = useLocation();
  const { user, loading, configured } = useAuth();
  const { openSignInSheet } = useCart();

  const intendedPath = validateNextPath(`${pathname}${search}`, fallbackPath);
  const openedForPathRef = useRef<string | null>(null);
  const wasAuthenticatedRef = useRef(false);

  useEffect(() => {
    if (loading) return;
    if (user) {
      wasAuthenticatedRef.current = true;
      openedForPathRef.current = null;
      return;
    }
    // If the user explicitly signed out while on this route, keep the calm signed-out view
    // rather than immediately popping SignInSheet over their confirmation toast.
    if (wasAuthenticatedRef.current) {
      wasAuthenticatedRef.current = false;
      return;
    }
    if (openedForPathRef.current !== intendedPath) {
      openedForPathRef.current = intendedPath;
      openSignInSheet(intendedPath);
    }
  }, [loading, user, intendedPath, openSignInSheet]);

  if (loading) {
    return (
      <div
        className="kv-container py-8 md:py-12 max-w-[1280px] flex flex-col gap-6"
        aria-busy="true"
        aria-label="Restoring your session"
      >
        <Skeleton className="h-5 w-36" rounded="pill" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <Skeleton className="lg:col-span-8 h-44 w-full" rounded="xl" />
          <Skeleton className="lg:col-span-4 h-44 w-full" rounded="xl" />
        </div>
        <Skeleton className="h-12 w-80 max-w-full" rounded="pill" />
        <Skeleton className="h-64 w-full" rounded="xl" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="kv-container py-8 md:py-12 max-w-4xl flex flex-col gap-8">
        <Tile variant="white" radius="xl" padding="lg" className="max-w-xl flex flex-col gap-5">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-full bg-stone text-ink inline-flex items-center justify-center shrink-0">
              <Lock size={17} strokeWidth={1.75} aria-hidden="true" />
            </span>
            <TagPill>{eyebrow}</TagPill>
          </div>

          <div className="flex flex-col gap-2">
            <h1 className="type-h2 font-semibold text-ink">{heading}</h1>
            <p className="type-body text-ink-2">{description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="primary"
              size="lg"
              onClick={() => openSignInSheet(intendedPath)}
              disabled={!configured}
            >
              Sign in with Google
            </Button>
            <Button variant="secondary" size="lg" to="/shop">
              Continue browsing
            </Button>
          </div>

          {!configured && (
            <p className="text-xs text-ink-2">
              Google OAuth activates automatically once SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY
              are configured.
            </p>
          )}
        </Tile>

        {unauthenticatedFooter}
      </div>
    );
  }

  return <>{children}</>;
}
