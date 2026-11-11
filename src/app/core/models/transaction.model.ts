export type TransactionType =
  | 'income'
  | 'expense'
  | 'internal_transfer'
  | 'budget_transfer'
  | 'correction';

export interface Transaction {
  id: string;
  /** Primary account this booking belongs to */
  accountId: string | null;
  date: string;
  /** Signed amount in cents: income positive, expense negative */
  amountCents: number;
  type: TransactionType;
  budgetId: string | null;
  description: string;
  bankDescription: string;
  note: string;
  importFingerprint: string | null;
  /** Links paired legs of an internal account transfer */
  transferGroupId: string | null;
  /** Set when the booking came from a CSV import batch */
  importBatchId?: string | null;
  createdAt: string;
}
