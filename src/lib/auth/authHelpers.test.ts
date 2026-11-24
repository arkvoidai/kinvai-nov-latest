import { test } from 'vitest';
import assert from 'node:assert/strict';
import { buildOAuthRedirectUrl, validateNextPath } from './authHelpers';

test('validateNextPath accepts safe same-origin relative paths', () => {
  assert.equal(validateNextPath('/account'), '/account');
  assert.equal(validateNextPath('/account?tab=orders'), '/account?tab=orders');
  assert.equal(validateNextPath('/checkout'), '/checkout');
  assert.equal(validateNextPath('/products/founder-finance-kit#reviews'), '/products/founder-finance-kit#reviews');
});

test('validateNextPath rejects open redirect attempts and callback loops', () => {
  assert.equal(validateNextPath('https://evil.example/phish'), '/account');
  assert.equal(validateNextPath('http://evil.example'), '/account');
  assert.equal(validateNextPath('//evil.example/steal'), '/account');
  assert.equal(validateNextPath('/\\evil.example'), '/account');
  assert.equal(validateNextPath('/account\\@evil.example'), '/account');
  assert.equal(validateNextPath('javascript:alert(1)'), '/account');
  assert.equal(validateNextPath('/auth/callback?next=/account'), '/account');
  assert.equal(validateNextPath('/account\r\nLocation: https://evil.example'), '/account');
  assert.equal(validateNextPath(''), '/account');
  assert.equal(validateNextPath(null, '/checkout'), '/checkout');
});

test('buildOAuthRedirectUrl preserves runtime origin for preview/local and validates next', () => {
  assert.equal(
    buildOAuthRedirectUrl('https://kinvai.arkvoid.com', '/account?tab=orders', 'https://kinvai.arkvoid.com'),
    'https://kinvai.arkvoid.com/auth/callback?next=%2Faccount%3Ftab%3Dorders'
  );
  assert.equal(
    buildOAuthRedirectUrl('https://kinvai.arkvoid.com', '/checkout', 'http://localhost:3000'),
    'http://localhost:3000/auth/callback?next=%2Fcheckout'
  );
  assert.equal(
    buildOAuthRedirectUrl('https://kinvai.arkvoid.com', '//evil.example', 'https://kinvai.arkvoid.com'),
    'https://kinvai.arkvoid.com/auth/callback?next=%2Faccount'
  );
});
