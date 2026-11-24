import type { SVGProps } from 'react';

export interface LogoProps extends SVGProps<SVGSVGElement> {
  inverted?: boolean;
  height?: number;
}

/**
 * Kinvai wordmark: lowercase "kinvai" in Geist 600 with a persimmon (#FF5B1F) full stop.
 */
export function Logo({ inverted = false, height = 22, className = '', ...rest }: LogoProps) {
  const wordFill = inverted ? '#F4F2EE' : '#111111';
  const width = Math.round((height / 24) * 68);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 68 24"
      width={width}
      height={height}
      role="img"
      aria-label="Kinvai"
      className={`inline-block shrink-0 ${className}`}
      {...rest}
    >
      <text
        x="0"
        y="19"
        fill={wordFill}
        fontFamily="Geist, -apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="600"
        fontSize="22"
        letterSpacing="-0.04em"
      >
        kinvai
      </text>
      <circle cx="60.5" cy="17.2" r="2.35" fill="#FF5B1F" />
    </svg>
  );
}
