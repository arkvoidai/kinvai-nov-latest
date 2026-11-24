import { accentToBgClass } from '../../lib/data/format';
import type { Collection, CollectionAccent, Product } from '../../lib/data/types';
import type { ProductImageRatio } from './ProductImage';

export type CoverSize = 'sm' | 'md' | 'lg';

export interface CoverFallbackProps {
  product: Pick<Product, 'name' | 'sku' | 'file_formats'>;
  collection?: Pick<Collection, 'name' | 'accent'> | null;
  accent?: CollectionAccent | null;
  ratio?: ProductImageRatio;
  size?: CoverSize;
  /** Reserves breathing room in the top-right corner when overlaid by ProductCard controls */
  overlaySafe?: boolean;
  className?: string;
}

const RATIO_CLASS: Record<ProductImageRatio, string> = {
  '4/5': 'aspect-[4/5]',
  '4/3': 'aspect-[4/3]',
  '1/1': 'aspect-square',
  '16/9': 'aspect-video',
};

/**
 * Extracts a crisp graphic anchor from SKU digits (e.g. "KV-RTS-001" -> "01")
 * or falls back to the product's initial letter.
 */
function extractAnchorGlyph(sku: string, name: string): string {
  const match = sku.match(/(\d+)$/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (Number.isFinite(num)) {
      return num < 10 ? `0${num}` : String(num);
    }
  }
  const initial = name.trim().charAt(0).toUpperCase();
  return initial || 'K';
}

/**
 * Auto-fits Geist 600 poster headline so it always feels monumental yet stays <= 3 lines.
 */
function getTitleSizeClass(name: string, size: CoverSize): string {
  const len = name.trim().length;
  if (size === 'sm') {
    if (len <= 22) return 'text-[19px] sm:text-[21px] leading-[1.06]';
    if (len <= 32) return 'text-[17px] sm:text-[18px] leading-[1.08]';
    return 'text-[15px] sm:text-[16px] leading-[1.1]';
  }
  if (size === 'lg') {
    if (len <= 22) return 'text-[34px] sm:text-[42px] md:text-[48px] leading-[1.01]';
    if (len <= 32) return 'text-[28px] sm:text-[36px] md:text-[40px] leading-[1.04]';
    return 'text-[24px] sm:text-[30px] md:text-[34px] leading-[1.06]';
  }
  // md (standard card / cover lab)
  if (len <= 22) return 'text-[24px] sm:text-[28px] leading-[1.03]';
  if (len <= 32) return 'text-[21px] sm:text-[25px] leading-[1.05]';
  return 'text-[19px] sm:text-[22px] leading-[1.08]';
}

function getNumeralSizeClass(size: CoverSize): string {
  if (size === 'sm') return 'text-[96px] sm:text-[112px]';
  if (size === 'lg') return 'text-[200px] sm:text-[250px]';
  return 'text-[148px] sm:text-[176px]';
}

function getPaddingClass(size: CoverSize, overlaySafe: boolean): string {
  if (overlaySafe) {
    if (size === 'sm') return 'px-4 pb-4 pt-12';
    if (size === 'lg') return 'px-7 pb-7 pt-16 sm:px-9 sm:pb-9 sm:pt-[72px]';
    return 'px-5 pb-5 pt-[52px] sm:px-6 sm:pb-6 sm:pt-[56px]';
  }
  if (size === 'sm') return 'p-4';
  if (size === 'lg') return 'p-7 sm:p-9';
  return 'p-5 sm:p-6';
}

/**
 * Swiss-poster typographic fallback cover rendered at 4:5 inside flat collection tints.
 * Strict left alignment, generous negative space, Geist 600 headline (<= 3 lines),
 * thin ink rule, 11px mono uppercase SKU & collection label, format chips + persimmon dot,
 * and an oversized low-contrast numeral anchor. No icons, no decorative shapes.
 */
export function CoverFallback({
  product,
  collection,
  accent,
  ratio = '4/5',
  size = 'md',
  overlaySafe = false,
  className = '',
}: CoverFallbackProps) {
  const resolvedAccent: CollectionAccent = accent ?? collection?.accent ?? 'cocoa';
  const bgClass = accentToBgClass(resolvedAccent);
  const anchorGlyph = extractAnchorGlyph(product.sku, product.name);
  const titleSizeClass = getTitleSizeClass(product.name, size);
  const numeralSizeClass = getNumeralSizeClass(size);
  const paddingClass = getPaddingClass(size, overlaySafe);
  const formats = product.file_formats.slice(0, size === 'sm' ? 2 : 3);
  const collectionLabel = collection?.name;

  // Collection variants differ strictly through Swiss poster layout rhythm:
  // - apricot / cocoa: name upper-middle, numeral bottom-right
  // - butter: numeral top-right, name anchored bottom-left above chips
  // - lilac: name lower-middle, numeral bottom-left behind open upper field
  // - rose: rule right below header, name top-left with expansive lower field & bottom-right numeral
  const isBottomTitle = resolvedAccent === 'butter' || resolvedAccent === 'lilac';
  const numeralPosClass =
    resolvedAccent === 'butter'
      ? overlaySafe
        ? 'top-[24%] -right-2'
        : 'top-[14%] -right-2'
      : resolvedAccent === 'lilac'
        ? 'bottom-[13%] -left-2'
        : 'bottom-[11%] -right-2';

  return (
    <div
      className={`relative w-full ${RATIO_CLASS[ratio]} ${bgClass} rounded-[22px] overflow-hidden select-none flex flex-col justify-between text-left ${paddingClass} ${className}`}
      data-cover-fallback="true"
      data-cover-variant={resolvedAccent}
    >
      {/* Oversized faint numeral/initial graphic anchor in darker tonal tint */}
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute font-semibold tracking-[-0.06em] leading-none text-ink/[0.065] tabular-nums ${numeralSizeClass} ${numeralPosClass}`}
      >
        {anchorGlyph}
      </span>

      {/* Top metadata band — strictly left-aligned, cleared below card top overlay controls when overlaySafe */}
      <div className="relative z-10 flex flex-col items-start gap-1 pr-4">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/75 tabular-nums leading-none">
          {product.sku}
        </span>
        {collectionLabel && (
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-ink/55 leading-tight truncate max-w-full">
            {collectionLabel}
          </span>
        )}
      </div>

      {/* Main typographic zone */}
      {isBottomTitle ? (
        <div className="relative z-10 mt-auto mb-5 flex flex-col items-start gap-3.5">
          <div className="w-full h-px bg-ink/20" aria-hidden="true" />
          <p
            className={`font-semibold tracking-[-0.032em] text-ink line-clamp-3 text-balance max-w-[16ch] ${titleSizeClass}`}
          >
            {product.name}
          </p>
        </div>
      ) : resolvedAccent === 'rose' ? (
        <div className="relative z-10 mt-5 mb-auto flex flex-col items-start gap-4">
          <div className="w-full h-px bg-ink/20" aria-hidden="true" />
          <p
            className={`font-semibold tracking-[-0.032em] text-ink line-clamp-3 text-balance max-w-[16ch] ${titleSizeClass}`}
          >
            {product.name}
          </p>
        </div>
      ) : (
        <div className="relative z-10 my-auto py-4 flex flex-col items-start gap-4">
          <p
            className={`font-semibold tracking-[-0.032em] text-ink line-clamp-3 text-balance max-w-[16ch] ${titleSizeClass}`}
          >
            {product.name}
          </p>
          <div className="w-full h-px bg-ink/20" aria-hidden="true" />
        </div>
      )}

      {/* Bottom band: format chips left, persimmon dot right */}
      <div className="relative z-10 flex items-center justify-between gap-2 pt-2">
        <div className="flex flex-wrap items-center gap-1.5 min-w-0">
          {formats.length > 0 ? (
            formats.map((fmt) => (
              <span
                key={fmt}
                className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/80 border border-ink/18 bg-ink/[0.03] px-2 py-0.5 rounded-full leading-tight whitespace-nowrap"
              >
                {fmt}
              </span>
            ))
          ) : (
            <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink/75 border border-ink/18 px-2 py-0.5 rounded-full leading-tight">
              DIGITAL
            </span>
          )}
        </div>
        <span
          className={`${size === 'lg' ? 'w-3 h-3' : 'w-2.5 h-2.5'} rounded-full bg-brand shrink-0`}
          aria-hidden="true"
        />
      </div>
    </div>
  );
}
