import type { HTMLAttributes, ReactNode } from 'react';

export type TileVariant =
  | 'white'
  | 'tint-peach'
  | 'tint-butter'
  | 'tint-lilac'
  | 'tint-rose'
  | 'stone'
  | 'ink'
  | 'image';

export interface TileProps extends HTMLAttributes<HTMLDivElement> {
  variant?: TileVariant;
  radius?: 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  elevated?: boolean;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<TileVariant, string> = {
  white: 'bg-surface text-ink border border-line',
  'tint-peach': 'bg-peach text-ink border border-ink/[0.06]',
  'tint-butter': 'bg-butter text-ink border border-ink/[0.06]',
  'tint-lilac': 'bg-lilac text-ink border border-ink/[0.06]',
  'tint-rose': 'bg-rose text-ink border border-ink/[0.06]',
  stone: 'bg-stone text-ink border border-line',
  ink: 'bg-ink text-ink-on-dark border border-ink',
  image: 'bg-stone text-ink border border-line overflow-hidden relative',
};

const RADIUS_CLASSES: Record<NonNullable<TileProps['radius']>, string> = {
  md: 'rounded-[20px]',
  lg: 'rounded-[28px]',
  xl: 'rounded-[36px]',
};

const PADDING_CLASSES: Record<NonNullable<TileProps['padding']>, string> = {
  none: 'p-0',
  sm: 'p-4 md:p-5',
  md: 'p-5 md:p-7',
  lg: 'p-6 md:p-9',
};

/**
 * Porcelain & Pop bento tile primitive: flat surfaces, hairline borders, 28-36px radii.
 */
export function Tile({
  variant = 'white',
  radius = 'lg',
  padding = 'md',
  elevated = false,
  className = '',
  children,
  ...rest
}: TileProps) {
  return (
    <div
      className={`${VARIANT_CLASSES[variant]} ${RADIUS_CLASSES[radius]} ${PADDING_CLASSES[padding]} ${
        elevated ? 'shadow-[var(--shadow-float)]' : ''
      } ${className}`.trim()}
      {...rest}
    >
      {children}
    </div>
  );
}
