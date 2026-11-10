import { Injectable, inject } from '@angular/core';
import { Observable, combineLatest, map, shareReplay } from 'rxjs';
import { HouseholdDataSource } from '../repositories/data-source';
import { FinanceSummary } from '../models/finance-summary.model';
import { Account } from '../models/account.model';
import { BudgetView } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import { buildFinanceSummary } from './finance-calculator';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly data = inject(HouseholdDataSource);

  readonly summary$: Observable<FinanceSummary> = combineLatest([
    this.data.getAccounts(),
    this.data.getBudgets(),
    this.data.getAllocations(),
    this.data.getTransactions(),
  ]).pipe(
    map(([accounts, budgets, allocations, transactions]) =>
      buildFinanceSummary(accounts, budgets, allocations, transactions),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly accounts$: Observable<Account[]> = this.summary$.pipe(
    map((s) => s.accounts),
  );

  readonly budgets$: Observable<BudgetView[]> = this.summary$.pipe(
    map((s) => s.budgets),
  );

  readonly recentTransactions$: Observable<Transaction[]> = this.summary$.pipe(
    map((s) => s.recentTransactions),
  );

  readonly rules$: Observable<AssignmentRule[]> = this.data.getRules();
}
