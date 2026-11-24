import { Link } from 'react-router-dom';
import { Marquee } from '../../lib/motion';

export interface HomeFormatStripProps {
  formats: string[];
}

/**
 * Section 2 — Format Strip:
 * Slow CSS marquee of text-only format chips derived from published products' file_formats.
 * Completely hidden when there are no formats.
 */
export function HomeFormatStrip({ formats }: HomeFormatStripProps) {
  if (formats.length === 0) {
    return null;
  }

  // Ensure enough chips for seamless marquee track even with a handful of formats
  const repeated = formats.length < 8 ? [...formats, ...formats, ...formats] : formats;

  const nodes = repeated.map((fmt, idx) => (
    <Link
      key={`${fmt}-${idx}`}
      to={`/shop?q=${encodeURIComponent(fmt)}`}
      viewTransition
      className="inline-flex items-center gap-2.5 h-11 px-5 rounded-full bg-surface border border-line hover:border-ink text-sm font-medium text-ink whitespace-nowrap transition-colors kv-press"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" aria-hidden="true" />
      <span className="font-mono text-xs uppercase tracking-[0.08em]">{fmt}</span>
    </Link>
  ));

  return (
    <section
      aria-label="Included file formats"
      className="py-1 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between gap-4 px-1">
        <span className="type-label text-ink-2">Ready-to-open file formats</span>
        <Link
          to="/shop"
          viewTransition
          className="text-xs font-medium text-ink-2 hover:text-ink underline underline-offset-4 transition-colors"
        >
          Browse all formats
        </Link>
      </div>
      <Marquee items={nodes} durationSeconds={38} />
    </section>
  );
}
