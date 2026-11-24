import { test } from 'vitest';
import assert from 'node:assert/strict';
import { MemoryRateLimiter } from './rateLimit';

test('MemoryRateLimiter allows requests up to maxRequests and blocks overflow', () => {
  const limiter = new MemoryRateLimiter({ windowMs: 1000, maxRequests: 3 });
  const t0 = 1_000_000;

  const r1 = limiter.check('client-1', t0);
  const r2 = limiter.check('client-1', t0 + 100);
  const r3 = limiter.check('client-1', t0 + 200);
  const r4 = limiter.check('client-1', t0 + 300);

  assert.equal(r1.allowed, true);
  assert.equal(r1.remaining, 2);
  assert.equal(r2.allowed, true);
  assert.equal(r2.remaining, 1);
  assert.equal(r3.allowed, true);
  assert.equal(r3.remaining, 0);
  assert.equal(r4.allowed, false);
  assert.equal(r4.remaining, 0);
});

test('MemoryRateLimiter resets bucket after window expires', () => {
  const limiter = new MemoryRateLimiter({ windowMs: 1000, maxRequests: 1 });
  const t0 = 2_000_000;

  assert.equal(limiter.check('client-a', t0).allowed, true);
  assert.equal(limiter.check('client-a', t0 + 500).allowed, false);
  assert.equal(limiter.check('client-a', t0 + 1000).allowed, true);
});

test('MemoryRateLimiter isolates keys independently', () => {
  const limiter = new MemoryRateLimiter({ windowMs: 5000, maxRequests: 1 });
  const t0 = 3_000_000;

  assert.equal(limiter.check('ip-1', t0).allowed, true);
  assert.equal(limiter.check('ip-1', t0 + 10).allowed, false);
  assert.equal(limiter.check('ip-2', t0 + 10).allowed, true);
});
