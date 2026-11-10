import { Account } from '../models/account.model';
import { Budget, BudgetAllocation, BudgetView } from '../models/budget.model';
import { Transaction, TransactionType } from '../models/transaction.model';
import { FinanceSummary } from '../models/finance-summary.model';

/** Transaction types that affect virtual budget balances */
const BUDGET_AFFECTING_TYPES: ReadonlySet<TransactionType> = new Set([
  'income',
  'expense',
  'budget_transfer',
  'correction',
]);

export function sumAccountBalances(accounts: Account[]): number {
  return accounts.filter((a) => a.active).reduce((sum, a) => sum + a.currentBalanceCents, 0);
}

/**
 * Virtual budget balance is derived exclusively from assigned bookings.
 * Internal account transfers never change a budget.
 */
export function calculateBudgetBalance(
  budgetId: string,
  transactions: Transaction[],
): number {
  return transactions
    .filter(
      (tx) =>
        tx.budgetId === budgetId && BUDGET_AFFECTING_TYPES.has(tx.type),
    )
    .reduce((sum, tx) => sum + tx.amountCents, 0);
}

export function buildBudgetViews(
  budgets: Budget[],
  transactions: Transaction[],
  allocations: BudgetAllocation[],
): BudgetView[] {
  return budgets
    .filter((b) => !b.archived)
    .map((budget) => {
      const balanceCents = calculateBudgetBalance(budget.id, transactions);
      const progressPercent =
        budget.targetAmountCents && budget.targetAmountCents > 0
          ? Math.min(100, Math.round((balanceCents / budget.targetAmountCents) * 100))
          : null;

      return {
        ...budget,
        balanceCents,
        progressPercent,
        allocations: allocations.filter((a) => a.budgetId === budget.id),
      };
    })
    .sort((a, b) => b.balanceCents - a.balanceCents);
}

/**
 * Unassigned funds = actual total bank balance − sum of virtual budgets.
 * Never invents or assigns leftover money to a budget.
 */
export function calculateUnassignedBalance(
  totalBalanceCents: number,
  budgetViews: BudgetView[],
): number {
  const budgetSum = budgetViews.reduce((sum, b) => sum + b.balanceCents, 0);
  return totalBalanceCents - budgetSum;
}

export function isHouseholdCashflow(tx: Transaction): boolean {
  return tx.type === 'income' || tx.type === 'expense';
}

export function calculateReserveTrend(
  transactions: Transaction[],
  reserveBudgetId = 'bud-ruecklagen',
): number {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const cutoffIso = cutoff.toISOString().slice(0, 10);

  return transactions
    .filter(
      (tx) =>
        tx.budgetId === reserveBudgetId &&
        BUDGET_AFFECTING_TYPES.has(tx.type) &&
        tx.date >= cutoffIso,
    )
    .reduce((sum, tx) => sum + tx.amountCents, 0);
}

export function buildFinanceSummary(
  accounts: Account[],
  budgets: Budget[],
  allocations: BudgetAllocation[],
  transactions: Transaction[],
): FinanceSummary {
  const activeAccounts = accounts.filter((a) => a.active);
  const totalBalanceCents = sumAccountBalances(activeAccounts);
  const budgetViews = buildBudgetViews(budgets, transactions, allocations);
  const totalBudgetBalanceCents = budgetViews.reduce(
    (sum, b) => sum + b.balanceCents,
    0,
  );
  const unassignedBalanceCents = calculateUnassignedBalance(
    totalBalanceCents,
    budgetViews,
  );

  // With the formula above, reconciliation always holds by definition.
  // A non-zero delta would indicate inconsistent allocation metadata or
  // future manual overrides — keep the check explicit for the UI warning.
  const reconciliationDeltaCents =
    totalBalanceCents - (totalBudgetBalanceCents + unassignedBalanceCents);

  const recentTransactions = [...transactions]
    .sort((a, b) => {
      if (a.date === b.date) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      return b.date.localeCompare(a.date);
    })
    .slice(0, 8);

  return {
    accounts: activeAccounts,
    totalBalanceCents,
    budgets: budgetViews,
    activeBudgetCount: budgetViews.length,
    totalBudgetBalanceCents,
    unassignedBalanceCents,
    isReconciled: reconciliationDeltaCents === 0,
    reconciliationDeltaCents,
    reserveTrendCents: calculateReserveTrend(transactions),
    recentTransactions,
  };
}

export function validateAllocationsMatchBudget(
  budget: BudgetView,
): { ok: boolean; deltaCents: number } {
  const allocated = budget.allocations.reduce((sum, a) => sum + a.amountCents, 0);
  const deltaCents = budget.balanceCents - allocated;
  return { ok: deltaCents === 0, deltaCents };
}
