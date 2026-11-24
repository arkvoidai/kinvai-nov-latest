import { RotateCw } from 'lucide-react';
import { Button, TagPill, Tile } from '../primitives';

export interface ShopErrorTileProps {
  onRetry: () => void;
  title?: string;
  description?: string;
  retrying?: boolean;
}

/**
 * Designed Porcelain & Pop error tile for catalogue, collection, and search query failures.
 * Never swallows errors into a fake empty state; always gives the user a working Retry button.
 */
export function ShopErrorTile({
  onRetry,
  title = "That didn't work.",
  description = 'We could not load products right now. Try again, or write to',
  retrying = false,
}: ShopErrorTileProps) {
  return (
    <Tile
      variant="white"
      radius="xl"
      padding="lg"
      className="max-w-2xl mx-auto border-line-strong text-left"
      role="alert"
    >
      <div className="flex items-center gap-2">
        <TagPill tone="warning">Connection error</TagPill>
      </div>
      <h2 className="type-h2 font-semibold text-ink mt-4">{title}</h2>
      <p className="type-body text-ink-2 mt-2 prose-measure">
        {description}{' '}
        <a
          href="mailto:heyarkvoid@gmail.com"
          className="text-brand-deep underline underline-offset-2 font-medium"
        >
          heyarkvoid@gmail.com
        </a>
        .
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="primary"
          size="md"
          loading={retrying}
          onClick={onRetry}
          icon={<RotateCw size={16} strokeWidth={1.75} aria-hidden="true" />}
        >
          Retry
        </Button>
        <Button variant="secondary" size="md" to="/collections">
          Browse collections
        </Button>
      </div>
    </Tile>
  );
}
