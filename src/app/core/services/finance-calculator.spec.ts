import {
  buildBudgetViews,
  buildFinanceSummary,
  calculateBudgetBalance,
  calculateUnassignedBalance,
  isHouseholdCashflow,
  sumAccountBalances,
  validateAllocationsMatchBudget,
} from './finance-calculator';
import {
  DEMO_ACCOUNTS,
  DEMO_ALLOCATIONS,
  DEMO_BUDGETS,
  DEMO_TRANSACTIONS,
} from './demo-data';

describe('finance-calculator', () => {
  it('sums active account balances', () => {
    expect(sumAccountBalances(DEMO_ACCOUNTS)).toBe(1_520_000);
  });

  it('derives budget balance from assigned bookings only', () => {
    expect(calculateBudgetBalance('bud-urlaub', DEMO_TRANSACTIONS)).toBe(300_000);
    expect(calculateBudgetBalance('bud-versicherungen', DEMO_TRANSACTIONS)).toBe(120_000);
    expect(calculateBudgetBalance('bud-reparaturen', DEMO_TRANSACTIONS)).toBe(90_000);
  });

  it('ignores internal transfers for budget balances', () => {
    const withNoise = [
      ...DEMO_TRANSACTIONS,
      {
        id: 'noise',
        accountId: 'acc-giro',
        date: '2026-03-09',
        amountCents: -10_000,
        type: 'internal_transfer' as const,
        budgetId: 'bud-urlaub',
        description: 'should not count',
        bankDescription: '',
        note: '',
        importFingerprint: null,
        transferGroupId: 'x',
        createdAt: '2026-03-09T00:00:00.000Z',
      },
    ];
    expect(calculateBudgetBalance('bud-urlaub', withNoise)).toBe(300_000);
  });

  it('keeps reconciliation identity: accounts = budgets + unassigned', () => {
    const summary = buildFinanceSummary(
      DEMO_ACCOUNTS,
      DEMO_BUDGETS,
      DEMO_ALLOCATIONS,
      DEMO_TRANSACTIONS,
    );

    expect(summary.totalBalanceCents).toBe(1_520_000);
    expect(summary.totalBudgetBalanceCents).toBe(1_400_000);
    expect(summary.unassignedBalanceCents).toBe(120_000);
    expect(summary.isReconciled).toBeTrue();
    expect(
      summary.totalBudgetBalanceCents + summary.unassignedBalanceCents,
    ).toBe(summary.totalBalanceCents);
  });

  it('does not invent unassigned money into a budget', () => {
    const views = buildBudgetViews(DEMO_BUDGETS, DEMO_TRANSACTIONS, DEMO_ALLOCATIONS);
    const unassigned = calculateUnassignedBalance(1_520_000, views);
    expect(unassigned).toBe(120_000);
    expect(views.every((b) => b.balanceCents >= 0)).toBeTrue();
  });

  it('validates physical allocations against virtual budget balance', () => {
    const views = buildBudgetViews(DEMO_BUDGETS, DEMO_TRANSACTIONS, DEMO_ALLOCATIONS);
    const urlaub = views.find((b) => b.id === 'bud-urlaub')!;
    expect(validateAllocationsMatchBudget(urlaub)).toEqual({
      ok: true,
      deltaCents: 0,
    });
    expect(urlaub.allocations.map((a) => a.amountCents).reduce((a, b) => a + b, 0)).toBe(
      300_000,
    );
  });

  it('classifies household cashflow vs internal movement', () => {
    const income = DEMO_TRANSACTIONS.find((t) => t.type === 'income')!;
    const transfer = DEMO_TRANSACTIONS.find((t) => t.type === 'internal_transfer')!;
    expect(isHouseholdCashflow(income)).toBeTrue();
    expect(isHouseholdCashflow(transfer)).toBeFalse();
  });
});
