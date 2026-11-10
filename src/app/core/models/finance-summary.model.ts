import { Account } from './account.model';
import { BudgetView } from './budget.model';
import { Transaction } from './transaction.model';

export interface FinanceSummary {
  accounts: Account[];
  totalBalanceCents: number;
  budgets: BudgetView[];
  activeBudgetCount: number;
  totalBudgetBalanceCents: number;
  unassignedBalanceCents: number;
  /** true when totalBalance === budgets + unassigned */
  isReconciled: boolean;
  reconciliationDeltaCents: number;
  reserveTrendCents: number;
  recentTransactions: Transaction[];
}
