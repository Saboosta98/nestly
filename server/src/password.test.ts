import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createSessionToken,
  hashPassword,
  hashToken,
  verifyPassword,
} from './password.js';

test('hashPassword + verifyPassword roundtrip', () => {
  const stored = hashPassword('Geheim123!');
  assert.equal(verifyPassword('Geheim123!', stored), true);
  assert.equal(verifyPassword('falsch', stored), false);
});

test('different salts produce different hashes', () => {
  const a = hashPassword('same-password');
  const b = hashPassword('same-password');
  assert.notEqual(a, b);
  assert.equal(verifyPassword('same-password', a), true);
  assert.equal(verifyPassword('same-password', b), true);
});

test('session tokens are unique and hash stably', () => {
  const one = createSessionToken();
  const two = createSessionToken();
  assert.notEqual(one.token, two.token);
  assert.equal(hashToken(one.token), one.tokenHash);
  assert.notEqual(one.tokenHash, two.tokenHash);
});
