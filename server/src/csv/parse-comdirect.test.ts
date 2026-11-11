import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';
import {
  parseComdirectCsv,
  parseGermanAmount,
  parseGermanDate,
} from './parse-comdirect.js';
import { detectInternalTransfers } from './detect-transfers.js';
import { buildImportFingerprint } from './fingerprint.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixturePath = path.resolve(
  __dirname,
  '..',
  '..',
  'fixtures',
  'comdirect-sample.csv',
);

describe('parse-comdirect', () => {
  it('parses German dates and amounts', () => {
    assert.equal(parseGermanDate('08.11.2026'), '2026-11-08');
    assert.equal(parseGermanAmount('-86,40'), -8640);
    assert.equal(parseGermanAmount('1.234,56'), 123456);
    assert.equal(parseGermanAmount(' 50,00 '), 5000);
  });

  it('parses the sample fixture', () => {
    const csv = readFileSync(fixturePath, 'utf8');
    const rows = parseComdirectCsv(csv);
    assert.ok(rows.length >= 5);
    const rewe = rows.find((r) => r.bookingText.includes('REWE'));
    assert.ok(rewe);
    assert.equal(rewe!.amountCents, -8640);
    assert.equal(rewe!.bookingDate, '2026-11-02');
  });

  it('dedupes via fingerprint', () => {
    const csv = readFileSync(fixturePath, 'utf8');
    const rows = parseComdirectCsv(csv);
    const fps = rows.map((r) =>
      buildImportFingerprint({
        accountId: 'acc-giro',
        bookingDate: r.bookingDate,
        amountCents: r.amountCents,
        bookingText: r.bookingText,
        bankReference: r.bankReference,
      }),
    );
    assert.equal(new Set(fps).size, fps.length);
  });

  it('detects matching internal transfer against counterpart', () => {
    const rows = parseComdirectCsv(readFileSync(fixturePath, 'utf8'));
    const transferOut = rows.find((r) => r.amountCents === -50000);
    assert.ok(transferOut);

    const candidates = detectInternalTransfers({
      accountId: 'acc-giro',
      counterpartAccountId: 'acc-tagesgeld',
      rows: [transferOut!],
      existingCounterpartTxs: [
        {
          id: 'tx-existing',
          accountId: 'acc-tagesgeld',
          date: '2026-11-05',
          amountCents: 50000,
          type: 'income',
          budgetId: null,
          description: 'Gutschrift',
          bankDescription: 'GUTSCHRIFT VOM GIROKONTO',
          note: '',
          importFingerprint: null,
          transferGroupId: null,
          importBatchId: null,
          createdAt: '2026-11-05T12:00:00.000Z',
        },
      ],
    });

    assert.equal(candidates.length, 1);
    assert.equal(candidates[0].matchedTransactionId, 'tx-existing');
  });
});
