import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { SplitHeadline, TileIn } from '../../lib/motion';

const STEPS = [
  {
    num: '1',
    title: 'Choose.',
    copy: 'Inspect every tab, format and requirement before anything goes in your cart.',
    to: '/shop',
    cta: 'Browse systems',
    tint: 'bg-surface border-line',
  },
  {
    num: '2',
    title: 'Pay once.',
    copy: 'One USD licence per product with verified checkout and no recurring subscription.',
    to: '/how-it-works',
    cta: 'How checkout works',
    tint: 'bg-stone border-ink/[0.06]',
  },
  {
    num: '3',
    title: 'Download forever.',
    copy: 'Your files unlock immediately and stay ready to re-download from your library.',
    to: '/account',
    cta: 'Open your library',
    tint: 'bg-butter border-ink/[0.07]',
  },
] as const;

/**
 * Section 9 — How it works:
 * Three large numerals ("1 Choose.", "2 Pay once.", "3 Download forever.") in a bento row
 * with a drawn-line SVG connecting them (stroke-dashoffset draw once; static for reduced motion).
 */
export function HomeHowItWorks() {
  const prefersReduced = useReducedMotion();

  return (
    <section aria-labelledby="home-how-it-works-heading" className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <span className="type-label text-ink-2">How it works</span>
          <SplitHeadline
            id="home-how-it-works-heading"
            as="h2"
            immediate={false}
            text="Three steps, *zero friction.*"
            className="type-h2 font-semibold text-ink mt-1.5"
          />
        </div>
        <Link
          to="/how-it-works"
          viewTransition
          className="inline-flex items-center gap-2 text-sm font-medium text-ink hover:text-brand-deep transition-colors min-h-[44px]"
        >
          <span>Full walkthrough</span>
          <ArrowUpRight size={16} strokeWidth={1.75} />
        </Link>
      </div>

      {/* Desktop drawn-line connector between the 3 step cards */}
      <div className="relative">
        <div
          aria-hidden="true"
          className="hidden lg:block pointer-events-none absolute top-[54px] left-[16%] right-[16%] h-6 z-0"
        >
          <svg
            viewBox="0 0 800 24"
            fill="none"
            preserveAspectRatio="none"
            className="w-full h-full overflow-visible"
          >
            {/* Subtle track */}
            <path
              d="M 0 12 C 140 12, 260 12, 400 12 C 540 12, 660 12, 800 12"
              stroke="var(--line-strong)"
              strokeWidth="1.5"
              strokeDasharray="4 6"
            />
            {/* Animated ink stroke drawing once on scroll */}
            <motion.path
              d="M 0 12 C 140 12, 260 12, 400 12 C 540 12, 660 12, 800 12"
              stroke="var(--ink)"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeDasharray="800"
              initial={{ strokeDashoffset: prefersReduced ? 0 : 800 }}
              whileInView={{ strokeDashoffset: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                duration: prefersReduced ? 0 : 0.9,
                ease: [0.2, 0.7, 0.2, 1],
              }}
            />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((step, idx) => (
            <TileIn key={step.num} index={idx}>
              <Link
                to={step.to}
                viewTransition
                className={`group flex flex-col justify-between gap-8 rounded-[28px] lg:rounded-[32px] border p-6 sm:p-8 h-full hover:border-ink/25 transition-[border-color] duration-200 kv-press ${step.tint}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-baseline gap-1 font-mono text-4xl sm:text-5xl font-semibold text-ink leading-none tabular-nums">
                    {step.num}
                    <span className="w-2 h-2 rounded-full bg-brand inline-block" aria-hidden="true" />
                  </span>
                  <span
                    aria-hidden="true"
                    className="w-10 h-10 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center group-hover:bg-ink group-hover:text-white transition-colors"
                  >
                    <ArrowUpRight size={18} strokeWidth={1.75} className="kv-arrow-icon" />
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="type-h2 font-semibold text-ink leading-tight">
                    <span className="sr-only">{step.num} </span>
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-[15px] text-ink-2 leading-relaxed">
                    {step.copy}
                  </p>
                </div>

                <div className="pt-4 border-t border-ink/10 flex items-center justify-between text-xs font-mono uppercase tracking-[0.06em] text-ink-2 group-hover:text-ink transition-colors">
                  <span>{step.cta}</span>
                  <span>0{idx + 1}</span>
                </div>
              </Link>
            </TileIn>
          ))}
        </div>
      </div>
    </section>
  );
}
