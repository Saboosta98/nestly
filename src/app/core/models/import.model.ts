export interface ImportBatch {
  id: string;
  accountId: string;
  filename: string;
  importedAt: string;
  totalTransactions: number;
  newTransactions: number;
  duplicateTransactions: number;
  unassignedTransactions: number;
  internalTransferPairs?: number;
}

export interface ImportPreviewRow {
  bookingDate: string;
  valueDate: string;
  bookingType: string;
  bookingText: string;
  amountCents: number;
  currency: string;
  bankReference: string | null;
  fingerprint: string;
  isDuplicate: boolean;
  suggestedType: string;
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
