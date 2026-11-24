import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion, type PanInfo } from 'motion/react';
import { ArrowUpRight, Download, ShieldCheck, X } from 'lucide-react';
import { isRunningInIframe } from '../../lib/auth/authHelpers';
import { useAuth } from '../../lib/auth/AuthProvider';
import { useCart } from '../../lib/cart/CartProvider';
import { KINVAI_SPRING, useReducedMotion } from '../../lib/motion';
import { Button, IconButton, Logo } from '../primitives';

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

/**
 * Sign-In Sheet:
 * - Modal on desktop (>=768px), bottom sheet with drag handle on phones (<768px).
 * - "Continue with Google" with redirectTo = siteUrl + /auth/callback?next=<current path>.
 * - Detects iframe context and displays "Open Kinvai in a new tab to sign in" with an external link.
 */
export function SignInSheet() {
  const { signInSheetOpen, closeSignInSheet, signInNextPath } = useCart();
  const { user, configured, signInWithGoogle } = useAuth();
  const reduced = useReducedMotion();

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const inIframe = isRunningInIframe();
  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://kinvai.arkvoid.com';

  useEffect(() => {
    if (user && signInSheetOpen) {
      closeSignInSheet();
    }
  }, [user, signInSheetOpen, closeSignInSheet]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!signInSheetOpen) {
      setErrorMessage(null);
      setSubmitting(false);
      return;
    }

    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    const timer = window.setTimeout(() => {
      panelRef.current?.focus();
    }, 20);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSignInSheet();
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
      previousFocusRef.current?.focus();
    };
  }, [signInSheetOpen, closeSignInSheet]);

  const handleContinueWithGoogle = async () => {
    setErrorMessage(null);
    setSubmitting(true);
    const res = await signInWithGoogle(signInNextPath);
    if (res.error) {
      setErrorMessage(res.error);
      setSubmitting(false);
    }
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 85 || info.velocity.y > 420) {
      closeSignInSheet();
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {signInSheetOpen && (
        <div
          className="fixed inset-0 z-[var(--z-dialog)] flex items-end md:items-center justify-center md:p-4"
          role="presentation"
        >
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.2 }}
            onClick={closeSignInSheet}
            className="fixed inset-0 bg-ink/40 backdrop-blur-[2px]"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            tabIndex={-1}
            drag={isMobile && !reduced ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.45 }}
            onDragEnd={isMobile ? handleDragEnd : undefined}
            initial={
              reduced
                ? { opacity: 0 }
                : isMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.96, y: 8 }
            }
            animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              reduced
                ? { opacity: 0 }
                : isMobile
                  ? { y: '100%' }
                  : { opacity: 0, scale: 0.96, y: 8 }
            }
            transition={reduced ? { duration: 0.01 } : KINVAI_SPRING}
            className="relative z-10 w-full md:max-w-[440px] bg-surface text-ink rounded-t-[28px] md:rounded-[28px] border-t md:border border-line shadow-[var(--shadow-float)] p-6 md:p-7 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] md:pb-7 focus:outline-none"
          >
            {isMobile && (
              <div
                className="flex justify-center -mt-2 mb-4 cursor-grab active:cursor-grabbing"
                aria-hidden="true"
              >
                <span className="w-10 h-1 rounded-full bg-line-strong" />
              </div>
            )}

            <div className="flex items-start justify-between gap-4">
              <Logo height={22} />
              <IconButton
                label="Close sign-in"
                icon={<X size={18} strokeWidth={1.75} />}
                variant="stone"
                size="sm"
                onClick={closeSignInSheet}
              />
            </div>

            <div className="mt-5">
              <h2 id={titleId} className="type-h3 font-semibold text-ink">
                Sign in to Kinvai
              </h2>
              <p id={descId} className="text-sm text-ink-2 mt-1.5 leading-relaxed">
                Your library and re-downloads, synced across every device.
              </p>
            </div>

            {inIframe && (
              <div className="mt-5 rounded-[18px] bg-butter-muted border border-butter p-4 flex flex-col gap-3">
                <p className="text-sm font-medium text-ink">
                  Open Kinvai in a new tab to sign in
                </p>
                <p className="text-xs text-ink-2 leading-relaxed">
                  Google sign-in cannot run inside an embedded frame. Open this page in its own tab
                  to continue securely.
                </p>
                <a
                  href={currentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full bg-ink text-white text-sm font-medium hover:bg-ink-soft transition-colors kv-press w-full"
                >
                  <span>Open Kinvai in a new tab</span>
                  <ArrowUpRight size={16} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                loading={submitting}
                disabled={!configured}
                onClick={handleContinueWithGoogle}
                icon={<GoogleMark />}
              >
                Continue with Google
              </Button>

              {!configured && (
                <p className="text-xs text-ink-2 text-center">
                  Google OAuth activates once Supabase keys are configured.
                </p>
              )}

              {errorMessage && (
                <p role="alert" className="text-xs text-error bg-error-bg rounded-[14px] px-3.5 py-2.5">
                  {errorMessage}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-line grid grid-cols-2 gap-3 text-xs text-ink-2">
              <div className="flex items-center gap-2">
                <Download size={15} strokeWidth={1.75} className="text-ink shrink-0" aria-hidden="true" />
                <span>Lifetime re-downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={15} strokeWidth={1.75} className="text-ink shrink-0" aria-hidden="true" />
                <span>Persistent session</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
