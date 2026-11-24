import type { ButtonHTMLAttributes, ReactNode } from 'react';

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
  icon?: ReactNode;
}

/**
 * Interactive filter chip: active = --ink with white text; inactive = white/stone hairline pill.
 */
export function Chip({
  active = false,
  count,
  icon,
  children,
  className = '',
  type = 'button',
  ...rest
}: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={`inline-flex items-center justify-center gap-2 min-h-[40px] md:min-h-[38px] px-4 rounded-full text-sm font-medium whitespace-nowrap shrink-0 border kv-press cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-surface text-ink border-line hover:bg-stone hover:border-line-strong'
      } ${className}`}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {typeof count === 'number' && (
        <span
          className={`font-mono text-[11px] tabular-nums ${
            active ? 'text-white/75' : 'text-ink-2'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
