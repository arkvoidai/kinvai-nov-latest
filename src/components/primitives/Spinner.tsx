export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}

const DOT_SIZES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

/**
 * Persimmon dot-pulse loader using the Kinvai full-stop motif.
 */
export function Spinner({ size = 'md', label = 'Loading', className = '' }: SpinnerProps) {
  const dotSize = DOT_SIZES[size];
  return (
    <span
      role="status"
      aria-label={label}
      className={`inline-flex items-center gap-1.5 ${className}`}
    >
      <span
        className={`${dotSize} rounded-full bg-brand kv-dot-pulse`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`${dotSize} rounded-full bg-brand kv-dot-pulse`}
        style={{ animationDelay: '160ms' }}
      />
      <span
        className={`${dotSize} rounded-full bg-brand kv-dot-pulse`}
        style={{ animationDelay: '320ms' }}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
