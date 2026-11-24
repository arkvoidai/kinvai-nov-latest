import { test } from 'vitest';
import assert from 'node:assert/strict';
import {
  buildDownloadEndpoint,
  formatFileSize,
  formatOrderDate,
  formatOrderStatus,
  formatPaymentProvider,
  getOrderRefundNotice,
  mapOAuthCallbackError,
  normalizeOrderItemRow,
  normalizeOrderRow,
  parseAccountTab,
  parseDownloadResponse,
  resolveLibraryReviewState,
  validateProfileInput,
} from './accountHelpers';

test('parseAccountTab defaults to library and accepts valid tabs', () => {
  assert.equal(parseAccountTab(null), 'library');
  assert.equal(parseAccountTab(''), 'library');
  assert.equal(parseAccountTab('?tab=unknown'), 'library');
  assert.equal(parseAccountTab('?tab=library'), 'library');
  assert.equal(parseAccountTab('?tab=saved'), 'saved');
  assert.equal(parseAccountTab('?tab=orders'), 'orders');
  assert.equal(parseAccountTab('?tab=profile'), 'profile');
  assert.equal(parseAccountTab(new URLSearchParams('tab=ORDERS')), 'orders');
});

test('formatOrderStatus maps every order state cleanly', () => {
  assert.deepEqual(formatOrderStatus('paid'), { key: 'paid', label: 'Paid', tone: 'success' });
  assert.deepEqual(formatOrderStatus('pending'), { key: 'pending', label: 'Pending', tone: 'warning' });
  assert.deepEqual(formatOrderStatus('failed'), { key: 'failed', label: 'Failed', tone: 'error' });
  assert.deepEqual(formatOrderStatus('cancelled'), { key: 'cancelled', label: 'Cancelled', tone: 'default' });
  assert.deepEqual(formatOrderStatus('refunded'), { key: 'refunded', label: 'Refunded', tone: 'error' });
  assert.deepEqual(formatOrderStatus('partially_refunded'), {
    key: 'partially_refunded',
    label: 'Partially refunded',
    tone: 'warning',
  });
});

test('getOrderRefundNotice distinguishes full refund from partial refund accurately', () => {
  assert.equal(getOrderRefundNotice('paid'), null);
  assert.equal(getOrderRefundNotice('pending'), null);

  const fullRefund = getOrderRefundNotice('refunded');
  assert.ok(fullRefund && fullRefund.toLowerCase().includes('removed'));

  const partialRefund = getOrderRefundNotice('partially_refunded');
  assert.ok(partialRefund && !partialRefund.toLowerCase().includes('all access was removed'));
  assert.ok(partialRefund && partialRefund.toLowerCase().includes('library'));
});

test('formatFileSize formats bytes, KB, MB, and GB cleanly', () => {
  assert.equal(formatFileSize(null), 'Size unavailable');
  assert.equal(formatFileSize(512), '512 B');
  assert.equal(formatFileSize(2048), '2.0 KB');
  assert.equal(formatFileSize(250 * 1024), '250 KB');
  assert.equal(formatFileSize(4.5 * 1024 * 1024), '4.5 MB');
  assert.equal(formatFileSize(25 * 1024 * 1024), '25 MB');
  assert.equal(formatFileSize(1.25 * 1024 * 1024 * 1024), '1.25 GB');
});

test('formatOrderDate and formatPaymentProvider format deterministically', () => {
  assert.equal(formatOrderDate('2026-03-14T10:30:00Z'), 'Mar 14, 2026');
  assert.equal(formatOrderDate('invalid-date'), 'Date unavailable');
  assert.equal(formatPaymentProvider('razorpay'), 'Razorpay');
  assert.equal(formatPaymentProvider('paypal'), 'PayPal');
});

test('normalizeOrderRow and normalizeOrderItemRow handle schema variants cleanly', () => {
  const nameMap = new Map([['prod-1', 'Founder Finance Kit']]);
  const item = normalizeOrderItemRow(
    { id: 'oi-1', order_id: 'ord-1', product_id: 'prod-1', unit_price_cents: 4900 },
    nameMap
  );
  assert.deepEqual(item, {
    id: 'oi-1',
    order_id: 'ord-1',
    product_id: 'prod-1',
    name: 'Founder Finance Kit',
    price_cents: 4900,
  });

  const order = normalizeOrderRow(
    {
      id: 'ord-1',
      order_number: 'KV-882910',
      total_cents: 4900,
      currency: 'USD',
      payment_provider: 'paypal',
      status: 'paid',
      created_at: '2026-03-14T10:30:00Z',
    },
    item ? [item] : []
  );
  assert.equal(order?.order_number, 'KV-882910');
  assert.equal(order?.provider, 'paypal');
  assert.equal(order?.items.length, 1);
});

test('validateProfileInput enforces display_name and ISO-2 country_code rules', () => {
  const ok = validateProfileInput({ displayName: '  Manish Talukdar ', countryCode: 'in' });
  assert.equal(ok.valid, true);
  assert.equal(ok.displayName, 'Manish Talukdar');
  assert.equal(ok.countryCode, 'IN');

  const emptyAllowed = validateProfileInput({ displayName: '', countryCode: '' });
  assert.equal(emptyAllowed.valid, true);
  assert.equal(emptyAllowed.displayName, null);
  assert.equal(emptyAllowed.countryCode, null);

  const tooShort = validateProfileInput({ displayName: 'A', countryCode: 'US' });
  assert.equal(tooShort.valid, false);
  assert.ok(tooShort.fieldErrors.displayName);

  const badCountry = validateProfileInput({ displayName: 'Alex', countryCode: 'USA' });
  assert.equal(badCountry.valid, false);
  assert.ok(badCountry.fieldErrors.countryCode);
});

test('buildDownloadEndpoint and parseDownloadResponse never fake success', () => {
  assert.equal(buildDownloadEndpoint('prod-123'), '/api/download/prod-123');
  assert.equal(buildDownloadEndpoint('prod-123', 'file-9'), '/api/download/prod-123?fileId=file-9');

  const okSingle = parseDownloadResponse(
    200,
    { url: 'https://signed.example/file.zip', file: { file_name: 'kit.zip' } },
    'prod-123'
  );
  assert.deepEqual(okSingle, {
    kind: 'redirect',
    url: 'https://signed.example/file.zip',
    fileName: 'kit.zip',
  });

  const okMulti = parseDownloadResponse(
    200,
    {
      mode: 'multiple',
      files: [
        { id: 'f1', file_name: 'Model.xlsx', size_bytes: 120000 },
        { id: 'f2', file_name: 'Guide.pdf', size_bytes: 240000 },
      ],
    },
    'prod-123'
  );
  assert.equal(okMulti.kind, 'multiple');
  if (okMulti.kind === 'multiple') {
    assert.equal(okMulti.files.length, 2);
  }

  const err403 = parseDownloadResponse(403, { error: 'Forbidden' }, 'prod-123');
  assert.equal(err403.kind, 'error');

  const errEmpty200 = parseDownloadResponse(200, {}, 'prod-123');
  assert.equal(errEmpty200.kind, 'error');
});

test('resolveLibraryReviewState maps review states cleanly', () => {
  assert.equal(resolveLibraryReviewState(null), 'write');
  assert.equal(
    resolveLibraryReviewState({
      user_id: 'u1',
      product_id: 'p1',
      rating: 5,
      title: 'Great',
      body: 'Clean system',
      status: 'pending',
      created_at: null,
    }),
    'pending'
  );
  assert.equal(
    resolveLibraryReviewState({
      user_id: 'u1',
      product_id: 'p1',
      rating: 5,
      title: 'Great',
      body: 'Clean system',
      status: 'approved',
      created_at: null,
    }),
    'approved'
  );
});

test('mapOAuthCallbackError returns calm non-raw copy', () => {
  assert.equal(mapOAuthCallbackError({}), null);
  const denied = mapOAuthCallbackError({ error: 'access_denied' });
  assert.equal(denied?.title, 'Sign-in was cancelled.');
  const expired = mapOAuthCallbackError({ errorDescription: 'PKCE code verifier missing' });
  assert.equal(expired?.title, 'That sign-in link expired.');
  const generic = mapOAuthCallbackError({ error: 'server_error', errorDescription: 'pg_internal_500' });
  assert.ok(generic && !generic.body.includes('pg_internal'));
});
