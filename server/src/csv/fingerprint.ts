import { createHash } from 'node:crypto';

/** Normalize bank text for stable fingerprints across CSV variants. */
export function normalizeBookingText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Dedup key: bank reference when present, otherwise
 * account + booking date + amount + normalized booking text.
 */
export function buildImportFingerprint(input: {
  accountId: string;
  bookingDate: string;
  amountCents: number;
  bookingText: string;
  bankReference?: string | null;
}): string {
  const ref = input.bankReference?.trim();
  const basis = ref
    ? `ref|${input.accountId}|${ref}`
    : [
        'row',
        input.accountId,
        input.bookingDate,
        String(input.amountCents),
        normalizeBookingText(input.bookingText),
      ].join('|');

  return createHash('sha256').update(basis).digest('hex');
}
