import { useState } from 'react';
import {
  AlertCircle,
  Check,
  Download,
  ExternalLink,
  Files,
  FolderOpen,
  MessageSquarePlus,
  Pencil,
  RefreshCw,
} from 'lucide-react';
import {
  buildDownloadEndpoint,
  parseDownloadResponse,
  resolveLibraryReviewState,
  type AccountLibraryItem,
  type SafeProductFileMeta,
} from '../../lib/account/accountHelpers';
import { useAuth } from '../../lib/auth/AuthProvider';
import { accentToTileVariant } from '../../lib/data/format';
import type { Collection, Product, Review } from '../../lib/data/types';
import {
  Button,
  ProductCover,
  Skeleton,
  TagPill,
  useToast,
} from '../primitives';
import { LibraryDownloadSheet, triggerSignedDownload } from './LibraryDownloadSheet';
import { LibraryReviewSheet } from './LibraryReviewSheet';

export interface LibraryTabProps {
  userId: string;
  items: AccountLibraryItem[];
  collections: Collection[];
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  onReviewSaved: (productId: string, review: Review) => void;
}

type CardDownloadState =
  | { status: 'idle' }
  | { status: 'preparing' }
  | { status: 'starting' }
  | { status: 'error'; message: string };

const TINT_FRAME_CLASSES: Record<string, string> = {
  'tint-peach': 'bg-peach-muted border-peach/80',
  'tint-butter': 'bg-butter-muted border-butter/90',
  'tint-lilac': 'bg-lilac-muted border-lilac/80',
  'tint-rose': 'bg-rose-muted border-rose/80',
  stone: 'bg-stone border-line',
};

export function LibraryTab({
  userId,
  items,
  collections,
  loading,
  error,
  onRetry,
  onReviewSaved,
}: LibraryTabProps) {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();

  const [downloadStates, setDownloadStates] = useState<Record<string, CardDownloadState>>({});
  const [multiFileSheet, setMultiFileSheet] = useState<{
    productId: string;
    productName: string;
    files: SafeProductFileMeta[];
  } | null>(null);
  const [reviewTarget, setReviewTarget] = useState<{
    product: Product;
    existingReview: Review | null;
  } | null>(null);

  const collectionById = new Map(collections.map((c) => [c.id, c]));

  const handleDownloadClick = async (entry: AccountLibraryItem) => {
    const productId = entry.product.id;

    // If multiple active files are already known from safe metadata, open file picker Sheet immediately
    if (entry.files.length > 1) {
      setMultiFileSheet({
        productId,
        productName: entry.product.name,
        files: entry.files,
      });
      return;
    }

    setDownloadStates((prev) => ({ ...prev, [productId]: { status: 'preparing' } }));

    try {
      const token = await getAccessToken();
      if (!token) {
        setDownloadStates((prev) => ({
          ...prev,
          [productId]: {
            status: 'error',
            message: 'Please sign in again to download your files.',
          },
        }));
        return;
      }

      const res = await fetch(buildDownloadEndpoint(productId), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      let payload: unknown = null;
      try {
        payload = await res.json();
      } catch {
        payload = null;
      }

      const parsed = parseDownloadResponse(res.status, payload, productId);

      if (parsed.kind === 'multiple') {
        setDownloadStates((prev) => ({ ...prev, [productId]: { status: 'idle' } }));
        setMultiFileSheet({
          productId,
          productName: entry.product.name,
          files: parsed.files,
        });
        return;
      }

      if (parsed.kind === 'redirect') {
        setDownloadStates((prev) => ({ ...prev, [productId]: { status: 'starting' } }));
        triggerSignedDownload(parsed.url, parsed.fileName);
        toast({
          title: 'Starting download',
          description: parsed.fileName || entry.product.name,
          tone: 'success',
        });
        window.setTimeout(() => {
          setDownloadStates((prev) =>
            prev[productId]?.status === 'starting'
              ? { ...prev, [productId]: { status: 'idle' } }
              : prev
          );
        }, 2500);
        return;
      }

      setDownloadStates((prev) => ({
        ...prev,
        [productId]: { status: 'error', message: parsed.message },
      }));
    } catch {
      setDownloadStates((prev) => ({
        ...prev,
        [productId]: {
          status: 'error',
          message: "Couldn't reach the download server. Check your connection and try again.",
        },
      }));
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4" aria-busy="true">
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className="rounded-[24px] bg-page/65 border border-line p-4 sm:p-5 flex flex-col sm:flex-row gap-4"
          >
            <Skeleton className="w-full sm:w-[136px] aspect-[4/5] shrink-0" rounded="lg" />
            <div className="flex-1 flex flex-col justify-between gap-3 py-1">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-24" rounded="pill" />
                <Skeleton className="h-6 w-4/5" rounded="sm" />
                <Skeleton className="h-4 w-1/2" rounded="sm" />
              </div>
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-11 flex-1" rounded="pill" />
                <Skeleton className="h-11 w-28" rounded="pill" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[24px] bg-page/70 border border-line p-6 sm:p-7 flex flex-col items-start gap-4">
        <div className="w-11 h-11 rounded-full bg-error-bg text-error inline-flex items-center justify-center">
          <AlertCircle size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div>
          <h3 className="type-h3 font-semibold text-ink">Couldn&apos;t load your library.</h3>
          <p className="text-sm text-ink-2 mt-1">{error}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={onRetry}
          icon={<RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[24px] bg-page/70 border border-line p-6 sm:p-8 flex flex-col items-start gap-5">
        <div className="w-12 h-12 rounded-full bg-surface border border-line text-ink inline-flex items-center justify-center">
          <FolderOpen size={22} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <div className="max-w-lg">
          <h3 className="type-h3 font-semibold text-ink">
            Your library is empty. Start with a head start.
          </h3>
          <p className="text-sm sm:text-base text-ink-2 mt-2 leading-relaxed">
            Every system you purchase appears here permanently with instant private downloads and
            version updates.
          </p>
        </div>
        <Button variant="primary" size="lg" to="/shop">
          Explore the shop
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {items.map((entry) => {
          const { product, files, userReview } = entry;
          const collection = product.collection_id
            ? collectionById.get(product.collection_id) ?? null
            : null;
          const tintKey = accentToTileVariant(collection?.accent);
          const tintFrame = TINT_FRAME_CLASSES[tintKey] ?? TINT_FRAME_CLASSES.stone;
          const dlState = downloadStates[product.id] ?? { status: 'idle' };
          const reviewState = resolveLibraryReviewState(userReview);

          const isPreparing = dlState.status === 'preparing';
          const isStarting = dlState.status === 'starting';
          const isError = dlState.status === 'error';
          const hasMultipleFiles = files.length > 1;

          return (
            <article
              key={product.id}
              data-testid={`library-card-${product.slug}`}
              className="rounded-[24px] bg-page/65 border border-line p-4 sm:p-5 flex flex-col justify-between gap-4 kv-bento-tile"
            >
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                {/* Tinted Cover */}
                <div
                  className={`w-full sm:w-[144px] shrink-0 rounded-[22px] border p-2.5 self-start ${tintFrame}`}
                >
                  <ProductCover
                    product={product}
                    collection={collection}
                    ratio="4/5"
                    size="sm"
                    className="rounded-[15px]"
                  />
                </div>

                {/* Metadata & Actions */}
                <div className="flex-1 min-w-0 flex flex-col justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {collection && (
                        <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-2">
                          {collection.name}
                        </span>
                      )}
                      {product.version && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-page border border-line font-mono text-[10px] text-ink-2">
                          {product.version}
                        </span>
                      )}
                      {hasMultipleFiles && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone font-mono text-[10px] text-ink-2 tabular-nums">
                          <Files size={11} strokeWidth={1.75} aria-hidden="true" />
                          {files.length} files
                        </span>
                      )}
                    </div>

                    <h2 className="type-h3 font-semibold text-ink leading-snug break-words">
                      {product.name}
                    </h2>

                    {product.file_formats.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5" aria-label="Included formats">
                        {product.file_formats.slice(0, 4).map((fmt) => (
                          <span
                            key={fmt}
                            className="inline-flex items-center px-2 py-0.5 rounded-full bg-page border border-line font-mono text-[10px] uppercase tracking-[0.06em] text-ink-2"
                          >
                            {fmt}
                          </span>
                        ))}
                        {product.file_formats.length > 4 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-stone font-mono text-[10px] text-ink-2">
                            +{product.file_formats.length - 4}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Primary Download + Secondary View Product */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="primary"
                      size="md"
                      loading={isPreparing}
                      disabled={isStarting}
                      onClick={() => handleDownloadClick(entry)}
                      icon={
                        isStarting ? (
                          <Check size={16} strokeWidth={2} aria-hidden="true" />
                        ) : isError ? (
                          <RefreshCw size={16} strokeWidth={1.75} aria-hidden="true" />
                        ) : (
                          <Download size={16} strokeWidth={1.75} aria-hidden="true" />
                        )
                      }
                      className="flex-1 min-w-[140px]"
                    >
                      {isPreparing
                        ? 'Preparing…'
                        : isStarting
                          ? 'Starting download'
                          : isError
                            ? 'Retry download'
                            : hasMultipleFiles
                              ? `Download (${files.length})`
                              : 'Download'}
                    </Button>

                    <Button
                      variant="secondary"
                      size="md"
                      to={`/products/${product.slug}`}
                      icon={<ExternalLink size={15} strokeWidth={1.75} aria-hidden="true" />}
                    >
                      View product
                    </Button>
                  </div>
                </div>
              </div>

              {isError && (
                <div
                  role="alert"
                  className="flex items-start justify-between gap-3 rounded-[16px] bg-error-bg text-error px-3.5 py-2.5 text-xs leading-relaxed"
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle size={15} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{dlState.message}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDownloadClick(entry)}
                    className="font-semibold underline underline-offset-2 shrink-0 cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Footer Review Row */}
              <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  {reviewState === 'pending' && (
                    <TagPill tone="warning">Awaiting approval</TagPill>
                  )}
                  {reviewState === 'approved' && userReview && (
                    <TagPill tone="success">
                      Reviewed · {userReview.rating}/5
                    </TagPill>
                  )}
                  {reviewState === 'write' && (
                    <span className="text-xs text-ink-2">
                      Used this system? Share a brief note for future buyers.
                    </span>
                  )}
                  {reviewState === 'rejected' && (
                    <span className="text-xs text-ink-2">
                      Your previous review was not published. You can update it anytime.
                    </span>
                  )}
                </div>

                <Button
                  variant="quiet"
                  size="sm"
                  onClick={() =>
                    setReviewTarget({
                      product,
                      existingReview: userReview,
                    })
                  }
                  icon={
                    reviewState === 'write' ? (
                      <MessageSquarePlus size={15} strokeWidth={1.75} aria-hidden="true" />
                    ) : (
                      <Pencil size={14} strokeWidth={1.75} aria-hidden="true" />
                    )
                  }
                >
                  {reviewState === 'write' ? 'Write a review' : 'Edit review'}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {/* Multi-file download Sheet */}
      <LibraryDownloadSheet
        open={Boolean(multiFileSheet)}
        onClose={() => setMultiFileSheet(null)}
        productId={multiFileSheet?.productId ?? ''}
        productName={multiFileSheet?.productName ?? ''}
        files={multiFileSheet?.files ?? []}
      />

      {/* Review Sheet */}
      <LibraryReviewSheet
        open={Boolean(reviewTarget)}
        onClose={() => setReviewTarget(null)}
        userId={userId}
        product={reviewTarget?.product ?? null}
        existingReview={reviewTarget?.existingReview ?? null}
        onReviewSaved={onReviewSaved}
      />
    </>
  );
}
