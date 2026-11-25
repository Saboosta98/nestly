export type AccountType = 'checking' | 'savings' | 'other';

export type TransactionType =
  | 'income'
  | 'expense'
  | 'internal_transfer'
  | 'budget_transfer'
  | 'correction';

export interface Account {
  id: string;
  name: string;
  bank: string;
  accountType: AccountType;
  currentBalanceCents: number;
  balanceDate: string;
  active: boolean;
}

export interface Budget {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  targetAmountCents: number | null;
  archived: boolean;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  budgetId: string;
  accountId: string;
  amountCents: number;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  accountId: string | null;
  date: string;
  amountCents: number;
  type: TransactionType;
  budgetId: string | null;
  description: string;
  bankDescription: string;
  note: string;
  importFingerprint: string | null;
  transferGroupId: string | null;
  importBatchId: string | null;
  createdAt: string;
}

export interface AssignmentRule {
  id: string;
  name: string;
  keywords: string[];
  budgetId: string | null;
  priority: number;
  active: boolean;
  markAsInternalTransfer: boolean;
}

export interface ImportBatch {
  id: string;
  accountId: string;
  filename: string;
  importedAt: string;
  totalTransactions: number;
  newTransactions: number;
  duplicateTransactions: number;
  unassignedTransactions: number;
  internalTransferPairs: number;
}

export interface ParsedCsvRow {
  bookingDate: string;
  valueDate: string;
  bookingType: string;
  bookingText: string;
  amountCents: number;
  currency: string;
  bankReference: string | null;
  rawLine: string;
}

export interface ImportPreviewRow extends ParsedCsvRow {
  fingerprint: string;
  isDuplicate: boolean;
  suggestedType: TransactionType;
  suggestedTransferGroupId: string | null;
  description: string;
}

export interface ImportPreview {
  accountId: string;
  filename: string;
  rows: ImportPreviewRow[];
  totalRows: number;
  newCount: number;
  duplicateCount: number;
  internalTransferCount: number;
}
