export type AccountType = 'checking' | 'savings' | 'other';

export interface Account {
  id: string;
  name: string;
  bank: string;
  accountType: AccountType;
  /** Actual bank balance in cents */
  currentBalanceCents: number;
  /** Date of last balance reconciliation (ISO yyyy-mm-dd) */
  balanceDate: string;
  active: boolean;
}
