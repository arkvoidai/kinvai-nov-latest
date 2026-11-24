import test from 'node:test';
import assert from 'node:assert/strict';
import { validateNewsletterPayload } from './forms';

test('validateNewsletterPayload trims and lowercases valid email', () => {
  const res = validateNewsletterPayload({ email: '  Hello.Maker@Example.COM  ' });
  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.email, 'hello.maker@example.com');
    assert.equal(res.data.website, '');
  }
});

test('validateNewsletterPayload rejects invalid email strings', () => {
  assert.equal(validateNewsletterPayload({ email: 'not-an-email' }).success, false);
  assert.equal(validateNewsletterPayload({ email: '' }).success, false);
  assert.equal(validateNewsletterPayload({}).success, false);
});

test('validateNewsletterPayload parses optional honeypot field', () => {
  const res = validateNewsletterPayload({
    email: 'bot@example.com',
    website: 'https://spam.example',
  });
  assert.equal(res.success, true);
  if (res.success) {
    assert.equal(res.data.website, 'https://spam.example');
  }
});
