import { formatPrice } from '../../lib/data/format';

export interface PriceTagProps {
  cents: number;
  size?: 'sm' | 'md' | 'lg';
  pill?: boolean;
  inverted?: boolean;
  className?: string;
}

const SIZE_MAP = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-xl md:text-2xl',
};

/**
 * USD integer-cents price display rendered strictly in tabular Geist Mono.
 */
export function PriceTag({
  cents,
  size = 'md',
  pill = false,
  inverted = false,
  className = '',
}: PriceTagProps) {
  const formatted = formatPrice(cents);

  if (pill) {
    return (
      <span
        className={`inline-flex items-center rounded-full px-3.5 py-1.5 font-mono font-medium tabular-nums whitespace-nowrap shrink-0 ${
          inverted ? 'bg-surface text-ink' : 'bg-ink text-white'
        } ${SIZE_MAP[size]} ${className}`}
      >
        {formatted}
      </span>
    );
  }

  return (
    <span
      className={`font-mono font-medium tabular-nums whitespace-nowrap ${
        inverted ? 'text-ink-on-dark' : 'text-ink'
      } ${SIZE_MAP[size]} ${className}`}
    >
      {formatted}
    </span>
  );
}
