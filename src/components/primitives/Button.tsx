import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Spinner } from './Spinner';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'icon-round' | 'arrow-round';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  to?: string;
  fullWidth?: boolean;
  icon?: ReactNode;
  inverted?: boolean;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 font-medium whitespace-nowrap shrink-0 select-none kv-press cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'rounded-full bg-ink text-white border border-ink hover:bg-ink-soft',
  secondary:
    'rounded-full bg-surface text-ink border border-line-strong hover:bg-stone hover:border-ink/25',
  quiet:
    'rounded-full bg-transparent text-ink border border-transparent hover:bg-stone',
  'icon-round':
    'rounded-full bg-surface text-ink border border-line hover:bg-stone hover:border-line-strong p-0',
  'arrow-round':
    'kv-arrow-trigger rounded-full bg-surface text-ink border border-line hover:bg-ink hover:text-white hover:border-ink p-0',
};

const INVERTED_VARIANT_CLASSES: Partial<Record<ButtonVariant, string>> = {
  primary: 'rounded-full bg-surface text-ink border border-surface hover:bg-page',
  secondary: 'rounded-full bg-transparent text-ink-on-dark border border-white/25 hover:bg-white/10',
  'arrow-round':
    'kv-arrow-trigger rounded-full bg-white/12 text-ink-on-dark border border-white/15 hover:bg-surface hover:text-ink p-0',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[40px] px-4 text-sm',
  md: 'min-h-[44px] px-5 text-[15px]',
  lg: 'min-h-[52px] px-7 text-base',
};

const ROUND_SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'w-10 h-10 min-w-[40px] min-h-[40px]',
  md: 'w-11 h-11 min-w-[44px] min-h-[44px]',
  lg: 'w-12 h-12 min-w-[48px] min-h-[48px]',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    to,
    fullWidth = false,
    icon,
    inverted = false,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const isRound = variant === 'icon-round' || variant === 'arrow-round';
  const variantClass =
    (inverted && INVERTED_VARIANT_CLASSES[variant]) || VARIANT_CLASSES[variant];
  const sizeClass = isRound ? ROUND_SIZE_CLASSES[size] : SIZE_CLASSES[size];
  const widthClass = fullWidth ? 'w-full' : '';
  const combined = `${BASE_CLASSES} ${variantClass} ${sizeClass} ${widthClass} ${className}`.trim();

  const content = loading ? (
    <>
      <Spinner size="sm" label="Loading" />
      {!isRound && children && <span>{children}</span>}
    </>
  ) : variant === 'arrow-round' ? (
    <ArrowUpRight className="kv-arrow-icon" size={20} strokeWidth={1.75} aria-hidden="true" />
  ) : (
    <>
      {icon}
      {children}
    </>
  );

  if (to && !disabled && !loading) {
    return (
      <Link
        to={to}
        viewTransition
        className={combined}
        aria-label={rest['aria-label']}
        title={rest.title}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={combined}
      {...rest}
    >
      {content}
    </button>
  );
});
