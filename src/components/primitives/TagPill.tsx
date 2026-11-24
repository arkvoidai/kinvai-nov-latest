import type { ReactNode } from 'react';

export interface TagPillProps {
  children: ReactNode;
  inverted?: boolean;
  tone?: 'default' | 'brand' | 'success' | 'warning' | 'error';
  className?: string;
}

const TONE_CLASSES: Record<NonNullable<TagPillProps['tone']>, string> = {
  default: 'border-ink/20 text-ink bg-transparent',
  brand: 'border-brand-deep/40 text-brand-deep bg-brand-soft/45',
  success: 'border-success/35 text-success bg-success-bg/70',
  warning: 'border-warning/45 text-ink bg-warning-bg',
  error: 'border-error/40 text-error bg-error-bg',
};

/**
 * Outlined 11px mono-uppercase tag pill as specified in Charter section 4 & 5 (Promax tiles).
 */
export function TagPill({
  children,
  inverted = false,
  tone = 'default',
  className = '',
}: TagPillProps) {
  const toneClass = inverted
    ? 'border-white/25 text-ink-on-dark bg-transparent'
    : TONE_CLASSES[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 type-label whitespace-nowrap shrink-0 ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}
