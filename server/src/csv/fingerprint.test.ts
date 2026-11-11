import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildImportFingerprint,
  normalizeBookingText,
} from './fingerprint.js';

describe('fingerprint', () => {
  it('normalizes booking text', () => {
    assert.equal(normalizeBookingText('  REWE   Markt  '), 'rewe markt');
  });

  it('is stable for same row data', () => {
    const a = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -8640,
      bookingText: 'Kartenzahlung REWE',
    });
    const b = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -8640,
      bookingText: '  Kartenzahlung   REWE ',
    });
    assert.equal(a, b);
  });

  it('differs when amount differs', () => {
    const a = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -8640,
      bookingText: 'REWE',
    });
    const b = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -8650,
      bookingText: 'REWE',
    });
    assert.notEqual(a, b);
  });

  it('prefers bank reference when present', () => {
    const withRef = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -100,
      bookingText: 'ignored',
      bankReference: 'ABC-123',
    });
    const otherText = buildImportFingerprint({
      accountId: 'acc-giro',
      bookingDate: '2026-11-02',
      amountCents: -100,
      bookingText: 'completely different',
      bankReference: 'ABC-123',
    });
    assert.equal(withRef, otherText);
  });
});
