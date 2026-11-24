import { useEffect, useState } from 'react';
import { AlertCircle, Check, Download, FileArchive, RefreshCw } from 'lucide-react';
import {
  buildDownloadEndpoint,
  formatFileSize,
  parseDownloadResponse,
  type SafeProductFileMeta,
} from '../../lib/account/accountHelpers';
import { useAuth } from '../../lib/auth/AuthProvider';
import { Button, Sheet, TagPill, useToast } from '../primitives';

export interface LibraryDownloadSheetProps {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  files: SafeProductFileMeta[];
}

type FileDownloadStatus =
  | { state: 'idle' }
  | { state: 'preparing' }
  | { state: 'starting' }
  | { state: 'error'; message: string };

/**
 * Triggers a browser file download without window.open or exposing raw storage buckets.
 */
export function triggerSignedDownload(url: string, fileName?: string): void {
  if (typeof document === 'undefined') return;
  let safeHref: string;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return;
    }
    safeHref = parsed.toString();
  } catch {
    return;
  }
  const link = document.createElement('a');
  link.href = safeHref;
  if (fileName) {
    link.download = fileName;
  }
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  window.setTimeout(() => {
    link.remove();
  }, 150);
}

/**
 * Multi-file download Sheet:
 * Lists every active downloadable file for an owned product (file name, formatted size,
 * optional version) with an independent server-authorized Download action per file.
 * Never displays private storage bucket paths.
 */
export function LibraryDownloadSheet({
  open,
  onClose,
  productId,
  productName,
  files,
}: LibraryDownloadSheetProps) {
  const { getAccessToken } = useAuth();
  const { toast } = useToast();
  const [statuses, setStatuses] = useState<Record<string, FileDownloadStatus>>({});

  useEffect(() => {
    if (!open) {
      setStatuses({});
    }
  }, [open]);

  const handleDownloadFile = async (file: SafeProductFileMeta) => {
    setStatuses((prev) => ({ ...prev, [file.id]: { state: 'preparing' } }));

    try {
      const token = await getAccessToken();
      if (!token) {
        setStatuses((prev) => ({
          ...prev,
          [file.id]: {
            state: 'error',
            message: 'Please sign in again to download this file.',
          },
        }));
        return;
      }

      const res = await fetch(buildDownloadEndpoint(productId, file.id), {
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
      if (parsed.kind === 'redirect') {
        setStatuses((prev) => ({ ...prev, [file.id]: { state: 'starting' } }));
        triggerSignedDownload(parsed.url, parsed.fileName || file.file_name);
        toast({
          title: 'Starting download',
          description: file.file_name,
          tone: 'success',
        });
        window.setTimeout(() => {
          setStatuses((prev) =>
            prev[file.id]?.state === 'starting' ? { ...prev, [file.id]: { state: 'idle' } } : prev
          );
        }, 2400);
        return;
      }

      const errorMsg =
        parsed.kind === 'error'
          ? parsed.message
          : "That didn't work. Try again, or write to heyarkvoid@gmail.com.";
      setStatuses((prev) => ({
        ...prev,
        [file.id]: { state: 'error', message: errorMsg },
      }));
    } catch {
      setStatuses((prev) => ({
        ...prev,
        [file.id]: {
          state: 'error',
          message: "Couldn't reach the download server. Check your connection and retry.",
        },
      }));
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={`Download files`}
      description={productName}
      widthClass="md:max-w-[500px]"
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-ink-2">
            Links are freshly signed and expire automatically for security.
          </p>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <span className="type-label text-ink-2">
            {files.length} {files.length === 1 ? 'file included' : 'files included'}
          </span>
          <TagPill>Private access</TagPill>
        </div>

        <ul className="flex flex-col gap-2.5" aria-label={`Files for ${productName}`}>
          {files.map((file) => {
            const status = statuses[file.id] ?? { state: 'idle' };
            const isPreparing = status.state === 'preparing';
            const isStarting = status.state === 'starting';
            const isError = status.state === 'error';

            return (
              <li
                key={file.id}
                className="rounded-[20px] bg-page border border-line p-4 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-[14px] bg-surface border border-line text-ink inline-flex items-center justify-center shrink-0 mt-0.5">
                      <FileArchive size={18} strokeWidth={1.75} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink break-words leading-snug">
                        {file.file_name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1 font-mono text-[11px] text-ink-2">
                        <span>{formatFileSize(file.size_bytes)}</span>
                        {file.version && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{file.version}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant={isError ? 'secondary' : 'primary'}
                    size="sm"
                    loading={isPreparing}
                    disabled={isStarting}
                    onClick={() => handleDownloadFile(file)}
                    aria-label={
                      isError
                        ? `Retry downloading ${file.file_name}`
                        : `Download ${file.file_name}`
                    }
                    icon={
                      isStarting ? (
                        <Check size={15} strokeWidth={2} aria-hidden="true" />
                      ) : isError ? (
                        <RefreshCw size={15} strokeWidth={1.75} aria-hidden="true" />
                      ) : (
                        <Download size={15} strokeWidth={1.75} aria-hidden="true" />
                      )
                    }
                    className="shrink-0"
                  >
                    {isPreparing
                      ? 'Preparing'
                      : isStarting
                        ? 'Starting'
                        : isError
                          ? 'Retry'
                          : 'Download'}
                  </Button>
                </div>

                {isError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-[14px] bg-error-bg text-error px-3 py-2 text-xs leading-relaxed"
                  >
                    <AlertCircle size={14} strokeWidth={1.75} className="shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{status.message}</span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </Sheet>
  );
}
