import type { Product, Review } from '../data/types';

export type AccountTab = 'library' | 'saved' | 'orders' | 'profile';

export const ACCOUNT_TABS: readonly AccountTab[] = ['library', 'saved', 'orders', 'profile'];

/**
 * Parses ?tab= from URL search params, defaulting strictly to 'library'.
 */
export function parseAccountTab(
  searchParams: URLSearchParams | string | null | undefined
): AccountTab {
  if (!searchParams) return 'library';
  const raw =
    typeof searchParams === 'string'
      ? new URLSearchParams(searchParams).get('tab')
      : searchParams.get('tab');
  const normalized = (raw || '').trim().toLowerCase();
  if (
    normalized === 'library' ||
    normalized === 'saved' ||
    normalized === 'orders' ||
    normalized === 'profile'
  ) {
    return normalized;
  }
  return 'library';
}

export type OrderStatusKey =
  | 'paid'
  | 'pending'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded';

export type OrderBadgeTone = 'success' | 'warning' | 'error' | 'default';

export interface OrderStatusMeta {
  key: OrderStatusKey;
  label: string;
  tone: OrderBadgeTone;
}

/**
 * Maps raw order status strings from Supabase into canonical status labels & semantic tones.
 */
export function formatOrderStatus(rawStatus: string | null | undefined): OrderStatusMeta {
  const s = (rawStatus || 'pending').trim().toLowerCase().replace(/[\s-]+/g, '_');

  switch (s) {
    case 'paid':
    case 'completed':
    case 'succeeded':
      return { key: 'paid', label: 'Paid', tone: 'success' };
    case 'failed':
      return { key: 'failed', label: 'Failed', tone: 'error' };
    case 'cancelled':
    case 'canceled':
      return { key: 'cancelled', label: 'Cancelled', tone: 'default' };
    case 'refunded':
      return { key: 'refunded', label: 'Refunded', tone: 'error' };
    case 'partially_refunded':
    case 'partial_refund':
      return { key: 'partially_refunded', label: 'Partially refunded', tone: 'warning' };
    case 'pending':
    case 'created':
    case 'processing':
    default:
      return { key: 'pending', label: 'Pending', tone: 'warning' };
  }
}

/**
 * Returns calm, accurate refund access guidance.
 * - Full refund: notes that access was removed.
 * - Partial refund: explicitly avoids claiming all access was removed unless confirmed.
 */
export function getOrderRefundNotice(rawStatus: string | null | undefined): string | null {
  const { key } = formatOrderStatus(rawStatus);
  if (key === 'refunded') {
    return 'This order was refunded and download access for its items was removed.';
  }
  if (key === 'partially_refunded') {
    return 'A partial refund was issued for this order. Check your Library for currently active files.';
  }
  return null;
}

/**
 * Formats payment provider identifiers cleanly without inventing details.
 */
export function formatPaymentProvider(provider: string | null | undefined): string {
  if (!provider) return 'Payment provider';
  const clean = provider.trim().toLowerCase();
  if (clean === 'razorpay') return 'Razorpay';
  if (clean === 'paypal') return 'PayPal';
  if (clean === 'stripe') return 'Stripe';
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

/**
 * Formats order timestamps ("Jan 12, 2026") deterministically.
 */
export function formatOrderDate(isoDate: string | null | undefined): string {
  if (!isoDate) return 'Date unavailable';
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/**
 * Formats byte counts into crisp human-readable sizes (B, KB, MB, GB).
 */
export function formatFileSize(bytes: number | null | undefined): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0) {
    return 'Size unavailable';
  }
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb < 10 ? mb.toFixed(1) : mb.toFixed(0)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

export interface SafeProductFileMeta {
  id: string;
  product_id: string;
  file_name: string;
  mime_type: string | null;
  size_bytes: number | null;
  version: string | null;
}

export interface AccountLibraryItem {
  product: Product;
  orderId: string | null;
  files: SafeProductFileMeta[];
  userReview: Review | null;
}

export interface AccountOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price_cents: number;
}

export interface AccountOrder {
  id: string;
  order_number: string;
  created_at: string | null;
  total_cents: number;
  refunded_cents: number | null;
  currency: string;
  provider: string | null;
  status: string;
  items: AccountOrderItem[];
}

/**
 * Normalizes a raw Supabase `orders` row defensively so slight schema naming
 * differences (`provider` vs `payment_provider`, `order_number` vs `id`) never crash rendering.
 */
export function normalizeOrderRow(
  raw: Record<string, unknown>,
  items: AccountOrderItem[]
): AccountOrder | null {
  const id = typeof raw.id === 'string' && raw.id.trim() ? raw.id.trim() : null;
  if (!id) return null;

  const orderNumber =
    typeof raw.order_number === 'string' && raw.order_number.trim()
      ? raw.order_number.trim()
      : `KV-${id.slice(0, 6).toUpperCase()}`;

  const totalCentsRaw =
    typeof raw.total_cents === 'number'
      ? raw.total_cents
      : typeof raw.amount_cents === 'number'
        ? raw.amount_cents
        : 0;

  const refundedCents =
    typeof raw.refunded_cents === 'number' && Number.isFinite(raw.refunded_cents)
      ? raw.refunded_cents
      : null;

  const provider =
    typeof raw.provider === 'string' && raw.provider.trim()
      ? raw.provider.trim()
      : typeof raw.payment_provider === 'string' && raw.payment_provider.trim()
        ? raw.payment_provider.trim()
        : null;

  const currency =
    typeof raw.currency === 'string' && raw.currency.trim()
      ? raw.currency.trim().toUpperCase()
      : 'USD';

  const status = typeof raw.status === 'string' && raw.status.trim() ? raw.status.trim() : 'pending';
  const createdAt = typeof raw.created_at === 'string' ? raw.created_at : null;

  return {
    id,
    order_number: orderNumber,
    created_at: createdAt,
    total_cents: Math.max(0, Math.round(totalCentsRaw)),
    refunded_cents: refundedCents,
    currency,
    provider,
    status,
    items,
  };
}

/**
 * Normalizes a raw Supabase `order_items` row using snapshot name if present,
 * falling back to batched product name lookup by `product_id`.
 */
export function normalizeOrderItemRow(
  raw: Record<string, unknown>,
  productNameById?: ReadonlyMap<string, string>
): AccountOrderItem | null {
  const orderId =
    typeof raw.order_id === 'string' && raw.order_id.trim() ? raw.order_id.trim() : null;
  if (!orderId) return null;

  const productId =
    typeof raw.product_id === 'string' && raw.product_id.trim() ? raw.product_id.trim() : null;
  const id =
    typeof raw.id === 'string' && raw.id.trim()
      ? raw.id.trim()
      : `${orderId}-${productId ?? Math.random().toString(36).slice(2, 8)}`;

  const rawName =
    (typeof raw.product_name === 'string' && raw.product_name.trim()) ||
    (typeof raw.name === 'string' && raw.name.trim()) ||
    (typeof raw.title === 'string' && raw.title.trim()) ||
    (productId ? productNameById?.get(productId) : undefined) ||
    'Digital product';

  const rawPrice =
    typeof raw.price_cents === 'number'
      ? raw.price_cents
      : typeof raw.unit_price_cents === 'number'
        ? raw.unit_price_cents
        : typeof raw.amount_cents === 'number'
          ? raw.amount_cents
          : 0;

  return {
    id,
    order_id: orderId,
    product_id: productId,
    name: rawName,
    price_cents: Math.max(0, Math.round(rawPrice)),
  };
}

export type LibraryReviewBadgeState = 'write' | 'pending' | 'approved' | 'rejected';

export function resolveLibraryReviewState(review: Review | null | undefined): LibraryReviewBadgeState {
  if (!review) return 'write';
  if (review.status === 'approved') return 'approved';
  if (review.status === 'rejected') return 'rejected';
  return 'pending';
}

export interface ProfileValidationResult {
  valid: boolean;
  displayName: string | null;
  countryCode: string | null;
  fieldErrors: {
    displayName?: string;
    countryCode?: string;
  };
}

/**
 * Validates editable profile fields (`display_name` and `country_code` ONLY).
 */
export function validateProfileInput(input: {
  displayName: string;
  countryCode: string;
}): ProfileValidationResult {
  const fieldErrors: { displayName?: string; countryCode?: string } = {};
  const trimmedName = input.displayName.trim();
  const trimmedCountry = input.countryCode.trim().toUpperCase();

  if (trimmedName.length > 80) {
    fieldErrors.displayName = 'Display name must be 80 characters or fewer.';
  } else if (trimmedName.length === 1) {
    fieldErrors.displayName = 'Display name must be at least 2 characters, or leave blank.';
  }

  if (trimmedCountry.length > 0 && !/^[A-Z]{2}$/.test(trimmedCountry)) {
    fieldErrors.countryCode = 'Choose a valid country from the list.';
  }

  const valid = Object.keys(fieldErrors).length === 0;
  return {
    valid,
    displayName: trimmedName.length > 0 ? trimmedName : null,
    countryCode: trimmedCountry.length > 0 ? trimmedCountry : null,
    fieldErrors,
  };
}

export interface CountryOption {
  value: string;
  label: string;
}

export const COUNTRY_OPTIONS: readonly CountryOption[] = [
  { value: '', label: 'Not specified' },
  { value: 'AU', label: 'Australia' },
  { value: 'AT', label: 'Austria' },
  { value: 'BE', label: 'Belgium' },
  { value: 'BR', label: 'Brazil' },
  { value: 'CA', label: 'Canada' },
  { value: 'CH', label: 'Switzerland' },
  { value: 'DE', label: 'Germany' },
  { value: 'DK', label: 'Denmark' },
  { value: 'ES', label: 'Spain' },
  { value: 'FI', label: 'Finland' },
  { value: 'FR', label: 'France' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'HK', label: 'Hong Kong' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'IE', label: 'Ireland' },
  { value: 'IN', label: 'India' },
  { value: 'IT', label: 'Italy' },
  { value: 'JP', label: 'Japan' },
  { value: 'KR', label: 'South Korea' },
  { value: 'MX', label: 'Mexico' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'NL', label: 'Netherlands' },
  { value: 'NO', label: 'Norway' },
  { value: 'NZ', label: 'New Zealand' },
  { value: 'PH', label: 'Philippines' },
  { value: 'PL', label: 'Poland' },
  { value: 'PT', label: 'Portugal' },
  { value: 'SE', label: 'Sweden' },
  { value: 'SG', label: 'Singapore' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'AE', label: 'United Arab Emirates' },
  { value: 'US', label: 'United States' },
  { value: 'ZA', label: 'South Africa' },
];

/**
 * Builds the exact download API endpoint path for a product (and optional specific fileId).
 */
export function buildDownloadEndpoint(productId: string, fileId?: string): string {
  const base = `/api/download/${encodeURIComponent(productId)}`;
  if (fileId && fileId.trim()) {
    return `${base}?fileId=${encodeURIComponent(fileId.trim())}`;
  }
  return base;
}

export type ParsedDownloadOutcome =
  | { kind: 'redirect'; url: string; fileName?: string }
  | { kind: 'multiple'; files: SafeProductFileMeta[] }
  | { kind: 'error'; message: string };

/**
 * Parses the server response from GET /api/download/:productId safely without ever faking success.
 */
export function parseDownloadResponse(
  status: number,
  payload: unknown,
  fallbackProductId: string
): ParsedDownloadOutcome {
  const body =
    payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null;

  if (status < 200 || status >= 300) {
    if (status === 401) {
      return { kind: 'error', message: 'Please sign in again to download your files.' };
    }
    if (status === 403) {
      return {
        kind: 'error',
        message: 'Download access is not active for this account.',
      };
    }
    if (status === 404) {
      return {
        kind: 'error',
        message:
          typeof body?.error === 'string' && body.error.trim()
            ? body.error.trim()
            : 'Download files for this product are not available yet.',
      };
    }
    return {
      kind: 'error',
      message:
        typeof body?.error === 'string' && body.error.trim()
          ? body.error.trim()
          : "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
    };
  }

  if (body && typeof body.url === 'string' && body.url.trim().length > 0) {
    const fileObj =
      body.file && typeof body.file === 'object'
        ? (body.file as Record<string, unknown>)
        : null;
    const fileName =
      typeof fileObj?.file_name === 'string'
        ? fileObj.file_name
        : typeof body.fileName === 'string'
          ? body.fileName
          : undefined;
    return {
      kind: 'redirect',
      url: body.url.trim(),
      fileName,
    };
  }

  if (body && Array.isArray(body.files) && body.files.length > 0) {
    const files: SafeProductFileMeta[] = [];
    for (const row of body.files) {
      if (!row || typeof row !== 'object') continue;
      const r = row as Record<string, unknown>;
      if (typeof r.id !== 'string' || typeof r.file_name !== 'string') continue;
      files.push({
        id: r.id,
        product_id: typeof r.product_id === 'string' ? r.product_id : fallbackProductId,
        file_name: r.file_name,
        mime_type: typeof r.mime_type === 'string' ? r.mime_type : null,
        size_bytes: typeof r.size_bytes === 'number' ? r.size_bytes : null,
        version: typeof r.version === 'string' ? r.version : null,
      });
    }
    if (files.length > 0) {
      return { kind: 'multiple', files };
    }
  }

  return {
    kind: 'error',
    message: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
  };
}

/**
 * Maps OAuth callback query parameters (`error`, `error_code`, `error_description`) into
 * calm, user-friendly messaging without leaking raw provider or stack details.
 */
export function mapOAuthCallbackError(params: {
  error?: string | null;
  errorCode?: string | null;
  errorDescription?: string | null;
}): { title: string; body: string } | null {
  const err = (params.error || '').trim().toLowerCase();
  const code = (params.errorCode || '').trim().toLowerCase();
  const desc = (params.errorDescription || '').trim().toLowerCase();

  if (!err && !code && !desc) return null;

  if (err === 'access_denied' || desc.includes('cancel') || desc.includes('denied')) {
    return {
      title: 'Sign-in was cancelled.',
      body: 'No problem — nothing was changed on your account. You can try again whenever you are ready.',
    };
  }

  if (
    code.includes('expired') ||
    desc.includes('expired') ||
    desc.includes('pkce') ||
    desc.includes('code verifier')
  ) {
    return {
      title: 'That sign-in link expired.',
      body: 'For security, sign-in sessions expire quickly or must finish in the same browser tab. Start sign-in again to continue.',
    };
  }

  return {
    title: 'Sign-in could not complete.',
    body: "That didn't work. Try again, or write to heyarkvoid@gmail.com.",
  };
}
