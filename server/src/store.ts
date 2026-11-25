import { v4 as uuid } from 'uuid';
import { getDb } from './db.js';
import {
  mapAccount,
  mapAllocation,
  mapBudget,
  mapImportBatch,
  mapRule,
  mapTransaction,
} from './mappers.js';
import type {
  Account,
  AssignmentRule,
  Budget,
  BudgetAllocation,
  ImportBatch,
  ImportPreview,
  ParsedCsvRow,
  Transaction,
  TransactionType,
} from './types.js';
import { buildImportFingerprint } from './csv/fingerprint.js';
import { parseComdirectCsv } from './csv/parse-comdirect.js';
import {
  detectInternalTransfers,
  looksLikeInternalTransferText,
} from './csv/detect-transfers.js';

export function listAccounts(): Account[] {
  return getDb()
    .prepare('SELECT * FROM accounts ORDER BY name')
    .all()
    .map((r) => mapAccount(r as Record<string, unknown>));
}

export function updateAccount(
  id: string,
  patch: Partial<
    Pick<
      Account,
      'name' | 'currentBalanceCents' | 'balanceDate' | 'active' | 'bank' | 'accountType'
    >
  >,
): Account {
  const existing = getAccount(id);
  if (!existing) {
    throw notFound('Konto nicht gefunden');
  }
  const next: Account = {
    ...existing,
    ...patch,
    id: existing.id,
  };
  getDb()
    .prepare(
      `UPDATE accounts SET
        name = ?, bank = ?, account_type = ?,
        current_balance_cents = ?, balance_date = ?, active = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.bank,
      next.accountType,
      next.currentBalanceCents,
      next.balanceDate,
      next.active ? 1 : 0,
      id,
    );
  return getAccount(id)!;
}

export function getAccount(id: string): Account | null {
  const row = getDb().prepare('SELECT * FROM accounts WHERE id = ?').get(id);
  return row ? mapAccount(row as Record<string, unknown>) : null;
}

export function listBudgets(): Budget[] {
  return getDb()
    .prepare('SELECT * FROM budgets ORDER BY archived, name')
    .all()
    .map((r) => mapBudget(r as Record<string, unknown>));
}

export function createBudget(
  input: Omit<Budget, 'id' | 'createdAt' | 'archived'> & {
    archived?: boolean;
    id?: string;
  },
): Budget {
  const id = input.id ?? uuid();
  const createdAt = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO budgets (
        id, name, description, icon, color, target_amount_cents, archived, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.name,
      input.description ?? '',
      input.icon ?? '',
      input.color ?? '#22b2a6',
      input.targetAmountCents,
      input.archived ? 1 : 0,
      createdAt,
    );
  return getBudget(id)!;
}

export function updateBudget(
  id: string,
  patch: Partial<
    Pick<
      Budget,
      | 'name'
      | 'description'
      | 'icon'
      | 'color'
      | 'targetAmountCents'
      | 'archived'
    >
  >,
): Budget {
  const existing = getBudget(id);
  if (!existing) {
    throw notFound('Budget nicht gefunden');
  }
  const next = { ...existing, ...patch, id };
  getDb()
    .prepare(
      `UPDATE budgets SET
        name = ?, description = ?, icon = ?, color = ?,
        target_amount_cents = ?, archived = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.description,
      next.icon,
      next.color,
      next.targetAmountCents,
      next.archived ? 1 : 0,
      id,
    );
  return getBudget(id)!;
}

export function getBudget(id: string): Budget | null {
  const row = getDb().prepare('SELECT * FROM budgets WHERE id = ?').get(id);
  return row ? mapBudget(row as Record<string, unknown>) : null;
}

export function listAllocations(): BudgetAllocation[] {
  return getDb()
    .prepare('SELECT * FROM budget_allocations')
    .all()
    .map((r) => mapAllocation(r as Record<string, unknown>));
}

export function upsertAllocation(input: {
  id?: string;
  budgetId: string;
  accountId: string;
  amountCents: number;
}): BudgetAllocation {
  const existing = getDb()
    .prepare(
      'SELECT * FROM budget_allocations WHERE budget_id = ? AND account_id = ?',
    )
    .get(input.budgetId, input.accountId) as Record<string, unknown> | undefined;

  const updatedAt = new Date().toISOString();
  if (existing) {
    getDb()
      .prepare(
        'UPDATE budget_allocations SET amount_cents = ?, updated_at = ? WHERE id = ?',
      )
      .run(input.amountCents, updatedAt, existing.id);
    return mapAllocation({
      ...existing,
      amount_cents: input.amountCents,
      updated_at: updatedAt,
    });
  }

  const id = input.id ?? uuid();
  getDb()
    .prepare(
      `INSERT INTO budget_allocations (id, budget_id, account_id, amount_cents, updated_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(id, input.budgetId, input.accountId, input.amountCents, updatedAt);
  return getAllocation(id)!;
}

function getAllocation(id: string): BudgetAllocation | null {
  const row = getDb()
    .prepare('SELECT * FROM budget_allocations WHERE id = ?')
    .get(id);
  return row ? mapAllocation(row as Record<string, unknown>) : null;
}

export function deleteAllocation(id: string): void {
  getDb().prepare('DELETE FROM budget_allocations WHERE id = ?').run(id);
}

export function listTransactions(): Transaction[] {
  return getDb()
    .prepare('SELECT * FROM transactions ORDER BY date DESC, created_at DESC')
    .all()
    .map((r) => mapTransaction(r as Record<string, unknown>));
}

export function createTransaction(
  input: Omit<Transaction, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
): Transaction {
  const id = input.id ?? uuid();
  const createdAt = input.createdAt ?? new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO transactions (
        id, account_id, date, amount_cents, type, budget_id,
        description, bank_description, note, import_fingerprint,
        transfer_group_id, import_batch_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      id,
      input.accountId,
      input.date,
      input.amountCents,
      input.type,
      input.budgetId,
      input.description,
      input.bankDescription,
      input.note,
      input.importFingerprint,
      input.transferGroupId,
      input.importBatchId ?? null,
      createdAt,
    );
  return getTransaction(id)!;
}

export function updateTransaction(
  id: string,
  patch: Partial<
    Pick<
      Transaction,
      | 'accountId'
      | 'date'
      | 'amountCents'
      | 'type'
      | 'budgetId'
      | 'description'
      | 'bankDescription'
      | 'note'
      | 'transferGroupId'
    >
  >,
): Transaction {
  const existing = getTransaction(id);
  if (!existing) {
    throw notFound('Buchung nicht gefunden');
  }
  const next = { ...existing, ...patch, id };
  getDb()
    .prepare(
      `UPDATE transactions SET
        account_id = ?, date = ?, amount_cents = ?, type = ?, budget_id = ?,
        description = ?, bank_description = ?, note = ?, transfer_group_id = ?
       WHERE id = ?`,
    )
    .run(
      next.accountId,
      next.date,
      next.amountCents,
      next.type,
      next.budgetId,
      next.description,
      next.bankDescription,
      next.note,
      next.transferGroupId,
      id,
    );
  return getTransaction(id)!;
}

export function getTransaction(id: string): Transaction | null {
  const row = getDb().prepare('SELECT * FROM transactions WHERE id = ?').get(id);
  return row ? mapTransaction(row as Record<string, unknown>) : null;
}

export function deleteTransaction(id: string): void {
  getDb().prepare('DELETE FROM transactions WHERE id = ?').run(id);
}

/** Create paired internal transfer between two accounts. */
export function createAccountTransfer(input: {
  fromAccountId: string;
  toAccountId: string;
  amountCents: number;
  date: string;
  description?: string;
  note?: string;
}): Transaction[] {
  if (input.amountCents <= 0) {
    throw badRequest('Betrag muss positiv sein');
  }
  if (input.fromAccountId === input.toAccountId) {
    throw badRequest('Quell- und Zielkonto müssen verschieden sein');
  }
  const groupId = uuid();
  const description = input.description ?? 'Interne Umbuchung';
  const note = input.note ?? '';
  const outTx = createTransaction({
    accountId: input.fromAccountId,
    date: input.date,
    amountCents: -input.amountCents,
    type: 'internal_transfer',
    budgetId: null,
    description,
    bankDescription: description,
    note,
    importFingerprint: null,
    transferGroupId: groupId,
    importBatchId: null,
  });
  const inTx = createTransaction({
    accountId: input.toAccountId,
    date: input.date,
    amountCents: input.amountCents,
    type: 'internal_transfer',
    budgetId: null,
    description,
    bankDescription: description,
    note,
    importFingerprint: null,
    transferGroupId: groupId,
    importBatchId: null,
  });

  // Adjust account balances
  const from = getAccount(input.fromAccountId);
  const to = getAccount(input.toAccountId);
  if (from) {
    updateAccount(from.id, {
      currentBalanceCents: from.currentBalanceCents - input.amountCents,
      balanceDate: input.date,
    });
  }
  if (to) {
    updateAccount(to.id, {
      currentBalanceCents: to.currentBalanceCents + input.amountCents,
      balanceDate: input.date,
    });
  }

  return [outTx, inTx];
}

export function createBalanceCorrection(input: {
  accountId: string;
  newBalanceCents: number;
  date: string;
  note?: string;
}): { account: Account; transaction: Transaction | null } {
  const account = getAccount(input.accountId);
  if (!account) {
    throw notFound('Konto nicht gefunden');
  }
  const delta = input.newBalanceCents - account.currentBalanceCents;
  let tx: Transaction | null = null;
  if (delta !== 0) {
    tx = createTransaction({
      accountId: input.accountId,
      date: input.date,
      amountCents: delta,
      type: 'correction',
      budgetId: null,
      description: 'Saldenkorrektur',
      bankDescription: 'Manuelle Kontostand-Korrektur',
      note: input.note ?? '',
      importFingerprint: null,
      transferGroupId: null,
      importBatchId: null,
    });
  }
  const updated = updateAccount(input.accountId, {
    currentBalanceCents: input.newBalanceCents,
    balanceDate: input.date,
  });
  return { account: updated, transaction: tx };
}

export function listRules(): AssignmentRule[] {
  return getDb()
    .prepare('SELECT * FROM assignment_rules ORDER BY priority DESC')
    .all()
    .map((r) => mapRule(r as Record<string, unknown>));
}

export function listImports(): ImportBatch[] {
  return getDb()
    .prepare('SELECT * FROM import_batches ORDER BY imported_at DESC')
    .all()
    .map((r) => mapImportBatch(r as Record<string, unknown>));
}

function counterpartAccountId(accountId: string): string | null {
  if (accountId === 'acc-giro') {
    return 'acc-tagesgeld';
  }
  if (accountId === 'acc-tagesgeld') {
    return 'acc-giro';
  }
  const accounts = listAccounts().filter((a) => a.id !== accountId && a.active);
  return accounts[0]?.id ?? null;
}

export function previewImport(input: {
  accountId: string;
  filename: string;
  csvContent: string;
}): ImportPreview {
  const account = getAccount(input.accountId);
  if (!account) {
    throw notFound('Konto nicht gefunden');
  }

  const rows = parseComdirectCsv(input.csvContent);
  const existingFingerprints = new Set(
    listTransactions()
      .map((t) => t.importFingerprint)
      .filter((f): f is string => Boolean(f)),
  );

  const counterpartId = counterpartAccountId(input.accountId);
  const counterpartTxs = counterpartId
    ? listTransactions().filter((t) => t.accountId === counterpartId)
    : [];

  const transfers = counterpartId
    ? detectInternalTransfers({
        accountId: input.accountId,
        counterpartAccountId: counterpartId,
        rows,
        existingCounterpartTxs: counterpartTxs,
      })
    : [];

  const transferByRow = new Map(transfers.map((t) => [t.rowIndex, t]));

  const previewRows = rows.map((row, index) => {
    const fingerprint = buildImportFingerprint({
      accountId: input.accountId,
      bookingDate: row.bookingDate,
      amountCents: row.amountCents,
      bookingText: row.bookingText,
      bankReference: row.bankReference,
    });
    const isDuplicate = existingFingerprints.has(fingerprint);
    const transfer = transferByRow.get(index);
    let suggestedType: TransactionType =
      row.amountCents >= 0 ? 'income' : 'expense';
    let suggestedTransferGroupId: string | null = null;

    if (transfer) {
      suggestedType = 'internal_transfer';
      suggestedTransferGroupId = transfer.transferGroupId;
    } else if (
      looksLikeInternalTransferText(`${row.bookingType} ${row.bookingText}`)
    ) {
      // Text hint only — still import as cashflow unless counterpart matched
      suggestedType = row.amountCents >= 0 ? 'income' : 'expense';
    }

    const description =
      row.bookingText || row.bookingType || 'Importierte Buchung';

    return {
      ...row,
      fingerprint,
      isDuplicate,
      suggestedType,
      suggestedTransferGroupId,
      description,
    };
  });

  return {
    accountId: input.accountId,
    filename: input.filename,
    rows: previewRows,
    totalRows: previewRows.length,
    newCount: previewRows.filter((r) => !r.isDuplicate).length,
    duplicateCount: previewRows.filter((r) => r.isDuplicate).length,
    internalTransferCount: previewRows.filter(
      (r) => !r.isDuplicate && r.suggestedType === 'internal_transfer',
    ).length,
  };
}

export function confirmImport(input: {
  accountId: string;
  filename: string;
  csvContent: string;
  /** Optional balance after import (from bank statement) */
  newBalanceCents?: number | null;
  balanceDate?: string | null;
}): ImportBatch {
  const preview = previewImport(input);
  const batchId = uuid();
  const importedAt = new Date().toISOString();
  const db = getDb();

  const insertBatch = db.prepare(
    `INSERT INTO import_batches (
      id, account_id, filename, imported_at,
      total_transactions, new_transactions, duplicate_transactions,
      unassigned_transactions, internal_transfer_pairs
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const insertTx = db.prepare(
    `INSERT INTO transactions (
      id, account_id, date, amount_cents, type, budget_id,
      description, bank_description, note, import_fingerprint,
      transfer_group_id, import_batch_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const updateExistingTransfer = db.prepare(
    `UPDATE transactions SET type = 'internal_transfer', transfer_group_id = ?, budget_id = NULL
     WHERE id = ?`,
  );

  const counterpartId = counterpartAccountId(input.accountId);
  const counterpartTxs = counterpartId
    ? listTransactions().filter((t) => t.accountId === counterpartId)
    : [];
  const rows: ParsedCsvRow[] = preview.rows;
  const transfers = counterpartId
    ? detectInternalTransfers({
        accountId: input.accountId,
        counterpartAccountId: counterpartId,
        rows,
        existingCounterpartTxs: counterpartTxs,
      })
    : [];
  const transferByRow = new Map(transfers.map((t) => [t.rowIndex, t]));

  let newCount = 0;
  let unassigned = 0;
  let internalPairs = 0;

  const run = db.transaction(() => {
    // Insert batch first so transaction.import_batch_id FK succeeds.
    insertBatch.run(
      batchId,
      input.accountId,
      input.filename,
      importedAt,
      preview.totalRows,
      0,
      preview.duplicateCount,
      0,
      0,
    );

    for (let i = 0; i < preview.rows.length; i++) {
      const row = preview.rows[i];
      if (row.isDuplicate) {
        continue;
      }

      const transfer = transferByRow.get(i);
      const type = transfer
        ? 'internal_transfer'
        : row.amountCents >= 0
          ? 'income'
          : 'expense';
      const transferGroupId = transfer?.transferGroupId ?? null;

      insertTx.run(
        uuid(),
        input.accountId,
        row.bookingDate,
        row.amountCents,
        type,
        null,
        row.description,
        row.bookingText,
        '',
        row.fingerprint,
        transferGroupId,
        batchId,
        importedAt,
      );
      newCount++;
      if (type !== 'internal_transfer') {
        unassigned++;
      } else {
        internalPairs++;
        if (transfer?.matchedTransactionId) {
          updateExistingTransfer.run(
            transfer.transferGroupId,
            transfer.matchedTransactionId,
          );
        }
      }
    }

    db.prepare(
      `UPDATE import_batches SET
        new_transactions = ?,
        unassigned_transactions = ?,
        internal_transfer_pairs = ?
       WHERE id = ?`,
    ).run(newCount, unassigned, internalPairs, batchId);

    if (
      input.newBalanceCents !== undefined &&
      input.newBalanceCents !== null &&
      Number.isFinite(input.newBalanceCents)
    ) {
      const date =
        input.balanceDate ||
        preview.rows[0]?.bookingDate ||
        new Date().toISOString().slice(0, 10);
      db.prepare(
        `UPDATE accounts SET current_balance_cents = ?, balance_date = ? WHERE id = ?`,
      ).run(input.newBalanceCents, date, input.accountId);
    }
  });

  run();

  const batch = getDb()
    .prepare('SELECT * FROM import_batches WHERE id = ?')
    .get(batchId);
  return mapImportBatch(batch as Record<string, unknown>);
}

function notFound(message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = 404;
  return err;
}

function badRequest(message: string): Error & { status: number } {
  const err = new Error(message) as Error & { status: number };
  err.status = 400;
  return err;
}
