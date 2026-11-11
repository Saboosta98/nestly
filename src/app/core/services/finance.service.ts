import { Injectable, inject } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  shareReplay,
  switchMap,
  tap,
} from 'rxjs';
import { HouseholdDataSource } from '../repositories/data-source';
import { FinanceSummary } from '../models/finance-summary.model';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation, BudgetView } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import { ImportBatch, ImportPreview } from '../models/import.model';
import { buildFinanceSummary } from './finance-calculator';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly data = inject(HouseholdDataSource);
  private readonly refresh$ = new BehaviorSubject<number>(0);

  readonly summary$: Observable<FinanceSummary> = this.refresh$.pipe(
    switchMap(() =>
      combineLatest([
        this.data.getAccounts(),
        this.data.getBudgets(),
        this.data.getAllocations(),
        this.data.getTransactions(),
      ]),
    ),
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

  readonly rules$: Observable<AssignmentRule[]> = this.refresh$.pipe(
    switchMap(() => this.data.getRules()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly imports$: Observable<ImportBatch[]> = this.refresh$.pipe(
    switchMap(() => this.data.getImports()),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  readonly allTransactions$: Observable<Transaction[]> = this.refresh$.pipe(
    switchMap(() => this.data.getTransactions()),
    map((txs) =>
      [...txs].sort((a, b) => {
        if (a.date === b.date) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return b.date.localeCompare(a.date);
      }),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  reload(): void {
    this.refresh$.next(this.refresh$.value + 1);
  }

  createBudget(
    input: Omit<Budget, 'id' | 'createdAt' | 'archived'> & { archived?: boolean },
  ): Observable<Budget> {
    return this.data.createBudget(input).pipe(tap(() => this.reload()));
  }

  updateBudget(
    id: string,
    patch: Partial<
      Pick<
        Budget,
        | 'name'
        | 'description'
        | 'icon'
        | 'color'
        | 'targetAmountCents'
        | 'archived'
      >
    >,
  ): Observable<Budget> {
    return this.data.updateBudget(id, patch).pipe(tap(() => this.reload()));
  }

  assignTransactionToBudget(
    transactionId: string,
    budgetId: string | null,
  ): Observable<Transaction> {
    return this.data
      .updateTransaction(transactionId, { budgetId })
      .pipe(tap(() => this.reload()));
  }

  updateTransaction(
    id: string,
    patch: Partial<
      Pick<
        Transaction,
        | 'accountId'
        | 'date'
        | 'amountCents'
        | 'type'
        | 'budgetId'
        | 'description'
        | 'bankDescription'
        | 'note'
        | 'transferGroupId'
      >
    >,
  ): Observable<Transaction> {
    return this.data.updateTransaction(id, patch).pipe(tap(() => this.reload()));
  }

  createTransaction(
    input: Omit<Transaction, 'id' | 'createdAt'>,
  ): Observable<Transaction> {
    return this.data.createTransaction(input).pipe(tap(() => this.reload()));
  }

  createAccountTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    date: string;
    description?: string;
    note?: string;
  }): Observable<Transaction[]> {
    return this.data
      .createAccountTransfer(input)
      .pipe(tap(() => this.reload()));
  }

  createBalanceCorrection(input: {
    accountId: string;
    newBalanceCents: number;
    date: string;
    note?: string;
  }): Observable<{ account: Account; transaction: Transaction | null }> {
    return this.data
      .createBalanceCorrection(input)
      .pipe(tap(() => this.reload()));
  }

  upsertAllocation(input: {
    budgetId: string;
    accountId: string;
    amountCents: number;
  }): Observable<BudgetAllocation> {
    return this.data.upsertAllocation(input).pipe(tap(() => this.reload()));
  }

  previewImport(input: {
    accountId: string;
    file: File;
  }): Observable<ImportPreview> {
    return this.data.previewImport(input);
  }

  confirmImport(input: {
    accountId: string;
    file: File;
    newBalanceCents?: number | null;
    balanceDate?: string | null;
  }): Observable<ImportBatch> {
    return this.data.confirmImport(input).pipe(tap(() => this.reload()));
  }
}
