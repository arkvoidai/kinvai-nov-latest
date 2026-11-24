import { useId, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';

export interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label'> {
  label: string;
  /** Optional concise desktop tooltip text; defaults to label */
  tooltip?: string;
  icon: ReactNode;
  variant?: 'surface' | 'ink' | 'ghost' | 'stone';
  size?: 'sm' | 'md' | 'lg';
  badgeCount?: number;
  to?: string;
  tooltipSide?: 'top' | 'bottom';
}

const VARIANT_MAP = {
  surface: 'bg-surface text-ink border border-line hover:bg-stone hover:border-line-strong',
  ink: 'bg-ink text-white border border-ink hover:bg-ink-soft',
  ghost: 'bg-transparent text-ink border border-transparent hover:bg-stone',
  stone: 'bg-stone text-ink border border-transparent hover:bg-stone-hover',
};

const SIZE_MAP = {
  sm: 'w-10 h-10 min-w-[40px] min-h-[40px]',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
  lg: 'w-12 h-12 min-w-[48px] min-h-[48px]',
};

/**
 * Icon-only button enforcing Charter rule 7(a):
 * mandatory aria-label + visible desktop tooltip on hover/focus.
 */
export function IconButton({
  label,
  tooltip,
  icon,
  variant = 'surface',
  size = 'md',
  badgeCount,
  to,
  tooltipSide = 'bottom',
  className = '',
  disabled = false,
  type = 'button',
  ...rest
}: IconButtonProps) {
  const tooltipId = useId();
  const baseClass = `relative inline-flex items-center justify-center rounded-full shrink-0 kv-press cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed ${VARIANT_MAP[variant]} ${SIZE_MAP[size]} ${className}`;

  const tooltipPos =
    tooltipSide === 'top'
      ? 'bottom-full mb-2 right-0'
      : 'top-full mt-2 right-0';

  const inner = (
    <>
      <span aria-hidden="true" className="inline-flex items-center justify-center">
        {icon}
      </span>
      {typeof badgeCount === 'number' && badgeCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-brand text-white font-mono text-[11px] font-medium leading-none inline-flex items-center justify-center tabular-nums"
        >
          {badgeCount > 99 ? '99+' : badgeCount}
        </span>
      )}
    </>
  );

  return (
    <span className="relative inline-flex group/tooltip shrink-0">
      {to && !disabled ? (
        <Link
          to={to}
          viewTransition
          aria-label={label}
          aria-describedby={tooltipId}
          className={baseClass}
        >
          {inner}
        </Link>
      ) : (
        <button
          type={type}
          aria-label={label}
          aria-describedby={tooltipId}
          disabled={disabled}
          className={baseClass}
          {...rest}
        >
          {inner}
        </button>
      )}
      <span
        id={tooltipId}
        role="tooltip"
        className={`hidden md:block invisible pointer-events-none absolute ${tooltipPos} z-[var(--z-tooltip)] px-2.5 py-1 rounded-full bg-ink text-page text-xs font-medium whitespace-nowrap opacity-0 translate-y-0.5 transition-[opacity,transform,visibility] duration-150 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-hover/tooltip:translate-y-0 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 group-focus-within/tooltip:translate-y-0`}
      >
        {tooltip ?? label}
      </span>
    </span>
  );
}
