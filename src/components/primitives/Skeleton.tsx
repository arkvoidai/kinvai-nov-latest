export interface SkeletonProps {
  className?: string;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'pill';
}

const ROUNDED_MAP = {
  sm: 'rounded-[14px]',
  md: 'rounded-[20px]',
  lg: 'rounded-[28px]',
  xl: 'rounded-[36px]',
  pill: 'rounded-full',
};

export function Skeleton({ className = 'h-4 w-full', rounded = 'sm' }: SkeletonProps) {
  return <div aria-hidden="true" className={`kv-skeleton ${ROUNDED_MAP[rounded]} ${className}`} />;
}
