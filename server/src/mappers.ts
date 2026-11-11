import type {
  Account,
  AssignmentRule,
  Budget,
  BudgetAllocation,
  ImportBatch,
  Transaction,
  TransactionType,
  AccountType,
} from './types.js';

type Row = Record<string, unknown>;

export function mapAccount(row: Row): Account {
  return {
    id: String(row.id),
    name: String(row.name),
    bank: String(row.bank),
    accountType: row.account_type as AccountType,
    currentBalanceCents: Number(row.current_balance_cents),
    balanceDate: String(row.balance_date),
    active: Boolean(row.active),
  };
}

export function mapBudget(row: Row): Budget {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description ?? ''),
    icon: String(row.icon ?? ''),
    color: String(row.color ?? '#22b2a6'),
    targetAmountCents:
      row.target_amount_cents === null || row.target_amount_cents === undefined
        ? null
        : Number(row.target_amount_cents),
    archived: Boolean(row.archived),
    createdAt: String(row.created_at),
  };
}

export function mapAllocation(row: Row): BudgetAllocation {
  return {
    id: String(row.id),
    budgetId: String(row.budget_id),
    accountId: String(row.account_id),
    amountCents: Number(row.amount_cents),
    updatedAt: String(row.updated_at),
  };
}

export function mapTransaction(row: Row): Transaction {
  return {
    id: String(row.id),
    accountId: row.account_id == null ? null : String(row.account_id),
    date: String(row.date),
    amountCents: Number(row.amount_cents),
    type: row.type as TransactionType,
    budgetId: row.budget_id == null ? null : String(row.budget_id),
    description: String(row.description ?? ''),
    bankDescription: String(row.bank_description ?? ''),
    note: String(row.note ?? ''),
    importFingerprint:
      row.import_fingerprint == null ? null : String(row.import_fingerprint),
    transferGroupId:
      row.transfer_group_id == null ? null : String(row.transfer_group_id),
    importBatchId:
      row.import_batch_id == null ? null : String(row.import_batch_id),
    createdAt: String(row.created_at),
  };
}

export function mapRule(row: Row): AssignmentRule {
  const keywords = JSON.parse(String(row.keywords_json || '[]')) as string[];
  return {
    id: String(row.id),
    name: String(row.name),
    keywords,
    budgetId: row.budget_id == null ? null : String(row.budget_id),
    priority: Number(row.priority),
    active: Boolean(row.active),
    markAsInternalTransfer: Boolean(row.mark_as_internal_transfer),
  };
}

export function mapImportBatch(row: Row): ImportBatch {
  return {
    id: String(row.id),
    accountId: String(row.account_id),
    filename: String(row.filename),
    importedAt: String(row.imported_at),
    totalTransactions: Number(row.total_transactions),
    newTransactions: Number(row.new_transactions),
    duplicateTransactions: Number(row.duplicate_transactions),
    unassignedTransactions: Number(row.unassigned_transactions),
    internalTransferPairs: Number(row.internal_transfer_pairs ?? 0),
  };
}
