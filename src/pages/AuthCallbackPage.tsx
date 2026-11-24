import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button, Logo, Spinner, TagPill, Tile } from '../components/primitives';
import { mapOAuthCallbackError } from '../lib/account/accountHelpers';
import { validateNextPath } from '../lib/auth/authHelpers';
import { useAuth } from '../lib/auth/AuthProvider';
import { useCart } from '../lib/cart/CartProvider';
import { usePageMeta } from '../lib/seo/usePageMeta';
import { getSupabaseBrowserClient } from '../lib/supabase/client';

export function AuthCallbackPage() {
  usePageMeta({ title: 'Signing in — Kinvai', noindex: true });

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signInWithGoogle, configured } = useAuth();
  const { openSignInSheet } = useCart();

  const [errorState, setErrorState] = useState<{ title: string; body: string } | null>(null);
  const [retrying, setRetrying] = useState(false);

  const safeNext = useMemo(
    () => validateNextPath(searchParams.get('next'), '/account'),
    [searchParams]
  );

  useEffect(() => {
    let active = true;

    // Inspect both query string and URL hash for provider OAuth error parameters
    const hashParams = new URLSearchParams(
      location.hash.startsWith('#') ? location.hash.slice(1) : location.hash
    );

    const providerError = mapOAuthCallbackError({
      error: searchParams.get('error') || hashParams.get('error'),
      errorCode: searchParams.get('error_code') || hashParams.get('error_code'),
      errorDescription:
        searchParams.get('error_description') || hashParams.get('error_description'),
    });

    if (providerError) {
      setErrorState(providerError);
      return;
    }

    const client = getSupabaseBrowserClient();
    if (!client) {
      setErrorState({
        title: 'Sign-in is not configured yet.',
        body: 'Supabase authentication credentials are not connected in this environment.',
      });
      return;
    }

    const code = searchParams.get('code');

    const finishAuth = async () => {
      try {
        // First check if detectSessionInUrl already completed the PKCE exchange
        const existing = await client.auth.getSession();
        if (!active) return;

        if (existing.data.session) {
          navigate(safeNext, { replace: true });
          return;
        }

        if (code) {
          const { error } = await client.auth.exchangeCodeForSession(code);
          if (!active) return;
          if (error) {
            // Re-check session in case detectSessionInUrl already exchanged the PKCE code
            const afterRace = await client.auth.getSession();
            if (!active) return;
            if (afterRace.data.session) {
              navigate(safeNext, { replace: true });
              return;
            }
            const friendly = mapOAuthCallbackError({
              error: 'exchange_failed',
              errorDescription: error.message,
            });
            setErrorState(
              friendly ?? {
                title: 'Sign-in could not complete.',
                body: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
              }
            );
            return;
          }
          navigate(safeNext, { replace: true });
          return;
        }

        // No code and no active session -> show calm recovery state instead of looping
        setErrorState({
          title: 'We could not find an active sign-in session.',
          body: 'Start Google sign-in again to return to your account.',
        });
      } catch {
        if (!active) return;
        setErrorState({
          title: 'Sign-in could not complete.',
          body: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
        });
      }
    };

    void finishAuth();

    return () => {
      active = false;
    };
  }, [location.hash, navigate, safeNext, searchParams]);

  const handleRetry = async () => {
    if (!configured) {
      openSignInSheet(safeNext);
      return;
    }
    setRetrying(true);
    const res = await signInWithGoogle(safeNext);
    if (res.error) {
      setErrorState({
        title: 'Sign-in could not restart.',
        body: res.error,
      });
      setRetrying(false);
    }
  };

  return (
    <div className="kv-container py-14 md:py-20 max-w-xl">
      <Tile variant="white" radius="xl" padding="lg" className="flex flex-col items-start gap-5">
        <Logo height={22} />

        {errorState ? (
          <>
            <div className="w-11 h-11 rounded-full bg-error-bg text-error inline-flex items-center justify-center">
              <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
            </div>

            <div className="flex flex-col gap-2">
              <TagPill tone="error">Sign-in interrupted</TagPill>
              <h1 className="type-h2 font-semibold text-ink mt-1">{errorState.title}</h1>
              <p className="type-body text-ink-2">{errorState.body}</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                loading={retrying}
                onClick={handleRetry}
                icon={<RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />}
              >
                Try signing in again
              </Button>
              <Button variant="secondary" size="lg" to="/shop">
                Explore the shop
              </Button>
              <Button variant="quiet" size="md" to="/">
                Return home
              </Button>
            </div>

            <p className="text-xs text-ink-2 pt-2 border-t border-line w-full">
              Still stuck? Write to{' '}
              <a
                href="mailto:heyarkvoid@gmail.com"
                className="text-brand-deep underline underline-offset-2"
              >
                heyarkvoid@gmail.com
              </a>
              .
            </p>
          </>
        ) : (
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center gap-3">
              <Spinner label="Completing sign-in" />
              <h1 className="type-h3 font-semibold text-ink">Completing sign-in…</h1>
            </div>
            <p className="text-sm text-ink-2">
              Restoring your session and returning you to Kinvai.
            </p>
          </div>
        )}
      </Tile>
    </div>
  );
}
