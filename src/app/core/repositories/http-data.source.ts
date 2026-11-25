import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import { ImportBatch, ImportPreview } from '../models/import.model';
import { HouseholdDataSource } from './data-source';

@Injectable({ providedIn: 'root' })
export class HttpDataSource extends HouseholdDataSource {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getAccounts(): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.base}/accounts`);
  }

  getBudgets(): Observable<Budget[]> {
    return this.http.get<Budget[]>(`${this.base}/budgets`);
  }

  getAllocations(): Observable<BudgetAllocation[]> {
    return this.http.get<BudgetAllocation[]>(`${this.base}/allocations`);
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/transactions`);
  }

  getRules(): Observable<AssignmentRule[]> {
    return this.http.get<AssignmentRule[]>(`${this.base}/rules`);
  }

  getImports(): Observable<ImportBatch[]> {
    return this.http.get<ImportBatch[]>(`${this.base}/imports`);
  }

  createBudget(
    input: Omit<Budget, 'id' | 'createdAt' | 'archived'> & { archived?: boolean },
  ): Observable<Budget> {
    return this.http.post<Budget>(`${this.base}/budgets`, input);
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
    return this.http.patch<Budget>(`${this.base}/budgets/${id}`, patch);
  }

  updateAccount(
    id: string,
    patch: Partial<
      Pick<
        Account,
        | 'name'
        | 'currentBalanceCents'
        | 'balanceDate'
        | 'active'
        | 'bank'
        | 'accountType'
      >
    >,
  ): Observable<Account> {
    return this.http.patch<Account>(`${this.base}/accounts/${id}`, patch);
  }

  createTransaction(
    input: Omit<Transaction, 'id' | 'createdAt'> & { id?: string },
  ): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/transactions`, input);
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
    return this.http.patch<Transaction>(
      `${this.base}/transactions/${id}`,
      patch,
    );
  }

  upsertAllocation(input: {
    budgetId: string;
    accountId: string;
    amountCents: number;
  }): Observable<BudgetAllocation> {
    return this.http.put<BudgetAllocation>(`${this.base}/allocations`, input);
  }

  createAccountTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    date: string;
    description?: string;
    note?: string;
  }): Observable<Transaction[]> {
    return this.http.post<Transaction[]>(`${this.base}/transfers`, input);
  }

  createBalanceCorrection(input: {
    accountId: string;
    newBalanceCents: number;
    date: string;
    note?: string;
  }): Observable<{ account: Account; transaction: Transaction | null }> {
    return this.http.post<{ account: Account; transaction: Transaction | null }>(
      `${this.base}/accounts/${input.accountId}/balance-correction`,
      {
        newBalanceCents: input.newBalanceCents,
        date: input.date,
        note: input.note,
      },
    );
  }

  previewImport(input: {
    accountId: string;
    file: File;
  }): Observable<ImportPreview> {
    const form = new FormData();
    form.append('accountId', input.accountId);
    form.append('file', input.file, input.file.name);
    return this.http.post<ImportPreview>(`${this.base}/imports/preview`, form);
  }

  confirmImport(input: {
    accountId: string;
    file: File;
    newBalanceCents?: number | null;
    balanceDate?: string | null;
  }): Observable<ImportBatch> {
    const form = new FormData();
    form.append('accountId', input.accountId);
    form.append('file', input.file, input.file.name);
    if (
      input.newBalanceCents !== undefined &&
      input.newBalanceCents !== null &&
      Number.isFinite(input.newBalanceCents)
    ) {
      form.append('newBalanceCents', String(input.newBalanceCents));
    }
    if (input.balanceDate) {
      form.append('balanceDate', input.balanceDate);
    }
    return this.http.post<ImportBatch>(`${this.base}/imports/confirm`, form);
  }
}
