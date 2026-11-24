import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Check, Lock } from 'lucide-react';
import { Logo, Spinner } from '../primitives';

const SHOP_LINKS = [
  { label: 'Explore the shop', to: '/shop' },
  { label: 'Search catalogue', to: '/search' },
  { label: 'Saved items', to: '/saved' },
  { label: 'Account & Library', to: '/account' },
];

const COLLECTION_LINKS = [
  { label: 'All collections', to: '/collections' },
  { label: 'Run the Shop', to: '/collections/run-the-shop' },
  { label: 'Make the Thing', to: '/collections/make-the-thing' },
  { label: 'Build the World', to: '/collections/build-the-world' },
  { label: 'Ship the Interface', to: '/collections/ship-the-interface' },
];

const SUPPORT_LINKS = [
  { label: 'How it works', to: '/how-it-works' },
  { label: 'Support & Contact', to: '/support' },
  { label: 'Licence', to: '/licence' },
  { label: 'About Kinvai', to: '/about' },
];

const LEGAL_LINKS = [
  { label: 'Privacy policy', to: '/legal/privacy' },
  { label: 'Terms of service', to: '/legal/terms' },
  { label: 'Refund policy', to: '/legal/refunds' },
];

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; message: string; duplicate?: boolean }
  | { status: 'error'; message: string };

/**
 * Inverted ink tile footer (36px radius, inset 12px-24px from page edges)
 * featuring a live newsletter form (POST /api/newsletter with honeypot),
 * 4 structured link columns, payments-and-security note, contact links,
 * copyright, and a huge cropped "kinvai." wordmark at the bottom.
 */
export function Footer() {
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formState, setFormState] = useState<FormState>({ status: 'idle' });

  const handleSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setFormState({ status: 'error', message: 'Enter an email address to subscribe.' });
      return;
    }

    setFormState({ status: 'submitting' });
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, website: honeypot }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        duplicate?: boolean;
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        setFormState({
          status: 'error',
          message: data.error || "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
        });
        return;
      }

      setEmail('');
      setFormState({
        status: 'success',
        duplicate: data.duplicate,
        message: data.message || "You're on the list. New releases only — no spam.",
      });
    } catch {
      setFormState({
        status: 'error',
        message: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
      });
    }
  };

  return (
    <div className="mt-16 md:mt-24 px-3 sm:px-5 lg:px-6 pb-[88px] lg:pb-6">
      <footer className="max-w-[1360px] mx-auto bg-ink text-ink-on-dark rounded-[36px] overflow-hidden relative">
        <div className="px-6 sm:px-10 lg:px-12 pt-12 sm:pt-16 pb-8 relative z-10">
          {/* Top Row: Brand + Newsletter */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12 border-b border-white/12">
            <div className="lg:col-span-5 flex flex-col gap-4">
              <Link to="/" viewTransition aria-label="Kinvai home" className="w-fit">
                <Logo inverted height={26} />
              </Link>
              <p className="text-base text-ink-on-dark-muted max-w-[40ch] leading-relaxed">
                Spreadsheets, playbooks, templates and worlds, built properly once, so your
                project starts at step two.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1 text-sm">
                <a
                  href="mailto:heyarkvoid@gmail.com"
                  className="text-ink-on-dark hover:text-peach transition-colors underline underline-offset-4"
                >
                  heyarkvoid@gmail.com
                </a>
                <span aria-hidden="true" className="text-white/25">
                  ·
                </span>
                <a
                  href="https://x.com/ArkvoidAI"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-ink-on-dark hover:text-peach transition-colors"
                >
                  <span>@ArkvoidAI</span>
                  <ArrowUpRight size={15} strokeWidth={1.75} aria-hidden="true" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 lg:pl-8 flex flex-col justify-between gap-4">
              <div>
                <span className="type-label text-ink-on-dark-muted">New releases</span>
                <h2 className="type-h3 font-semibold text-white mt-1.5">
                  Get a note when a new system ships.
                </h2>
                <p className="text-sm text-ink-on-dark-muted mt-1">
                  Occasional product drops and updates. Unsubscribe in one click.
                </p>
              </div>

              <form onSubmit={handleSubscribe} noValidate className="flex flex-col gap-2.5 max-w-[480px]">
                {/* Hidden honeypot field against bots */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="kv-newsletter-website">Website</label>
                  <input
                    id="kv-newsletter-website"
                    name="website"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <label htmlFor={emailId} className="sr-only">
                  Email address
                </label>
                <div className="flex items-center h-13 pl-5 pr-1.5 rounded-full bg-white/[0.07] border border-white/15 focus-within:border-white/45 transition-colors">
                  <input
                    id={emailId}
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (formState.status === 'error') setFormState({ status: 'idle' });
                    }}
                    placeholder="you@domain.com"
                    className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder:text-ink-on-dark-muted/75 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={formState.status === 'submitting'}
                    aria-label="Subscribe to Kinvai release notes"
                    className="w-10 h-10 rounded-full bg-page text-ink hover:bg-white transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50 kv-press"
                  >
                    {formState.status === 'submitting' ? (
                      <Spinner size="sm" label="Subscribing" />
                    ) : formState.status === 'success' ? (
                      <Check size={18} strokeWidth={2} aria-hidden="true" />
                    ) : (
                      <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
                    )}
                  </button>
                </div>

                {formState.status === 'success' && (
                  <p role="status" className="text-xs text-peach font-medium pl-2">
                    {formState.message}
                  </p>
                )}
                {formState.status === 'error' && (
                  <p role="alert" className="text-xs text-rose font-medium pl-2">
                    {formState.message}
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* 4 Link Columns */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 py-10">
            <div>
              <h3 className="type-label text-ink-on-dark-muted mb-4">Shop</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {SHOP_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      viewTransition
                      className="text-ink-on-dark/85 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="type-label text-ink-on-dark-muted mb-4">Collections</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {COLLECTION_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      viewTransition
                      className="text-ink-on-dark/85 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="type-label text-ink-on-dark-muted mb-4">Support</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {SUPPORT_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      viewTransition
                      className="text-ink-on-dark/85 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="type-label text-ink-on-dark-muted mb-4">Legal</h3>
              <ul className="flex flex-col gap-2.5 text-sm">
                {LEGAL_LINKS.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      viewTransition
                      className="text-ink-on-dark/85 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Payments-and-security note + Copyright */}
          <div className="pt-6 border-t border-white/12 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-ink-on-dark-muted">
            <p className="inline-flex items-center gap-2">
              <Lock size={14} strokeWidth={1.75} className="text-ink-on-dark shrink-0" aria-hidden="true" />
              <span>
                Prices in USD. Payments verified server-side via Razorpay &amp; PayPal. Private
                expiring downloads.
              </span>
            </p>
            <p className="shrink-0">© {new Date().getFullYear()} Arkvoid Inc.</p>
          </div>
        </div>

        {/* Oversized cropped "kinvai." wordmark motif along bottom edge */}
        <div
          aria-hidden="true"
          className="select-none pointer-events-none px-4 sm:px-8 -mb-[0.22em] overflow-hidden leading-[0.82]"
        >
          <span className="inline-flex items-baseline font-sans font-semibold tracking-[-0.055em] text-white/[0.08] text-[clamp(5.25rem,18vw,15.5rem)] whitespace-nowrap">
            <span>kinvai</span>
            <span className="inline-block w-[0.145em] h-[0.145em] rounded-full bg-brand/85 ml-[0.045em] shrink-0" />
          </span>
        </div>
      </footer>
    </div>
  );
}
