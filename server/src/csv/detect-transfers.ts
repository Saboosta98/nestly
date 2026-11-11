import { v4 as uuid } from 'uuid';
import type { ParsedCsvRow, Transaction } from '../types.js';

const DEFAULT_WINDOW_DAYS = 3;

export interface TransferCandidate {
  rowIndex: number;
  matchedTransactionId: string | null;
  matchedRowIndex: number | null;
  transferGroupId: string;
  confidence: 'high';
}

/**
 * Detect likely Giro↔Tagesgeld internal transfers:
 * opposite signed amounts, different accounts, within ±N days.
 * Prefers matching against existing DB txs, then within the same import batch
 * when both legs are present (rare for single-account import).
 */
export function detectInternalTransfers(input: {
  accountId: string;
  counterpartAccountId: string;
  rows: ParsedCsvRow[];
  existingCounterpartTxs: Transaction[];
  windowDays?: number;
}): TransferCandidate[] {
  const windowDays = input.windowDays ?? DEFAULT_WINDOW_DAYS;
  const usedExisting = new Set<string>();
  const usedRows = new Set<number>();
  const results: TransferCandidate[] = [];

  input.rows.forEach((row, rowIndex) => {
    if (usedRows.has(rowIndex)) {
      return;
    }

    const opposite = -row.amountCents;
    const existing = input.existingCounterpartTxs.find((tx) => {
      if (usedExisting.has(tx.id)) {
        return false;
      }
      if (tx.accountId !== input.counterpartAccountId) {
        return false;
      }
      if (tx.amountCents !== opposite) {
        return false;
      }
      if (tx.type === 'internal_transfer' && tx.transferGroupId) {
        // already paired — still allow linking new leg with same group
      }
      return withinDays(row.bookingDate, tx.date, windowDays);
    });

    if (existing) {
      usedExisting.add(existing.id);
      usedRows.add(rowIndex);
      results.push({
        rowIndex,
        matchedTransactionId: existing.id,
        matchedRowIndex: null,
        transferGroupId: existing.transferGroupId ?? uuid(),
        confidence: 'high',
      });
      return;
    }

    // Same-batch opposite (if user somehow imports both accounts together)
    const peerIndex = input.rows.findIndex((peer, peerIdx) => {
      if (peerIdx === rowIndex || usedRows.has(peerIdx)) {
        return false;
      }
      return (
        peer.amountCents === opposite &&
        withinDays(row.bookingDate, peer.bookingDate, windowDays)
      );
    });

    if (peerIndex >= 0) {
      usedRows.add(rowIndex);
      usedRows.add(peerIndex);
      const groupId = uuid();
      results.push({
        rowIndex,
        matchedTransactionId: null,
        matchedRowIndex: peerIndex,
        transferGroupId: groupId,
        confidence: 'high',
      });
      results.push({
        rowIndex: peerIndex,
        matchedTransactionId: null,
        matchedRowIndex: rowIndex,
        transferGroupId: groupId,
        confidence: 'high',
      });
    }
  });

  return results;
}

export function withinDays(a: string, b: string, windowDays: number): boolean {
  const da = Date.parse(`${a}T00:00:00Z`);
  const db = Date.parse(`${b}T00:00:00Z`);
  if (!Number.isFinite(da) || !Number.isFinite(db)) {
    return false;
  }
  const diff = Math.abs(da - db) / (24 * 60 * 60 * 1000);
  return diff <= windowDays;
}

export function looksLikeInternalTransferText(text: string): boolean {
  const t = text.toLowerCase();
  return (
    t.includes('tagesgeld') ||
    t.includes('girokonto') ||
    t.includes('uebertrag') ||
    t.includes('übertrag') ||
    t.includes('umbuchung')
  );
}
