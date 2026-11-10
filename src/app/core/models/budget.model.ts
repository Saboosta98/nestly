export interface Budget {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  /** Optional savings target in cents */
  targetAmountCents: number | null;
  archived: boolean;
  createdAt: string;
}

export interface BudgetAllocation {
  id: string;
  budgetId: string;
  accountId: string;
  /** Physical share of this budget sitting on the account, in cents */
  amountCents: number;
  updatedAt: string;
}

export interface BudgetView extends Budget {
  /** Virtual balance derived from transactions */
  balanceCents: number;
  /** Progress toward target (0–100), null if no target */
  progressPercent: number | null;
  allocations: BudgetAllocation[];
}
