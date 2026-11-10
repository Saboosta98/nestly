export interface ImportBatch {
  id: string;
  accountId: string;
  filename: string;
  importedAt: string;
  totalTransactions: number;
  newTransactions: number;
  duplicateTransactions: number;
  unassignedTransactions: number;
}
