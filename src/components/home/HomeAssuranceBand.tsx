import { Download, Infinity as InfinityIcon, ShieldCheck } from 'lucide-react';
import { getPublicConfig } from '../../lib/config';
import { buildPaymentAssuranceCopy } from '../../lib/home/homeHelpers';
import { Reveal } from '../../lib/motion';

/**
 * Section 7 — Assurance Band (Nest soft peach reassurance band).
 * Three columns with round white Lucide icon badges, title and one precise sentence each.
 * Checkout provider names appear ONLY when enabled in window.__KINVAI__.flags.
 */
export function HomeAssuranceBand() {
  const { flags } = getPublicConfig();
  const checkoutCopy = buildPaymentAssuranceCopy(flags);

  const items = [
    {
      icon: Download,
      title: 'Instant download',
      copy: 'Your files unlock the moment payment clears.',
    },
    {
      icon: InfinityIcon,
      title: 'Yours for life',
      copy: 'Re-download any time from your library.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure checkout',
      copy: checkoutCopy,
    },
  ];

  return (
    <Reveal>
      <section
        aria-label="Purchase assurances"
        className="rounded-[28px] lg:rounded-[36px] bg-peach border border-ink/[0.07] px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-12"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7 md:gap-8">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-row md:flex-col items-start md:items-center md:text-center gap-4"
              >
                <span
                  aria-hidden="true"
                  className="w-12 h-12 rounded-full bg-surface text-ink border border-ink/10 inline-flex items-center justify-center shrink-0 shadow-[0_6px_18px_rgba(17,17,17,0.05)]"
                >
                  <Icon size={20} strokeWidth={1.75} />
                </span>
                <div className="flex flex-col gap-1">
                  <h2 className="text-base sm:text-[17px] font-semibold text-ink">{item.title}</h2>
                  <p className="text-sm text-ink-2 leading-relaxed max-w-[30ch]">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </Reveal>
  );
}
