import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import { ImportBatch, ImportPreview } from '../models/import.model';
import {
  DEMO_ACCOUNTS,
  DEMO_ALLOCATIONS,
  DEMO_BUDGETS,
  DEMO_RULES,
  DEMO_TRANSACTIONS,
} from '../services/demo-data';
import { HouseholdDataSource } from './data-source';

/**
 * In-memory data source for unit tests / optional demo mode.
 * Writes mutate local arrays for the session only.
 */
@Injectable({ providedIn: 'root' })
export class DemoDataSource extends HouseholdDataSource {
  private accounts = structuredClone(DEMO_ACCOUNTS);
  private budgets = structuredClone(DEMO_BUDGETS);
  private allocations = structuredClone(DEMO_ALLOCATIONS);
  private transactions = structuredClone(DEMO_TRANSACTIONS);
  private rules = structuredClone(DEMO_RULES);
  private imports: ImportBatch[] = [];

  getAccounts(): Observable<Account[]> {
    return of(structuredClone(this.accounts));
  }

  getBudgets(): Observable<Budget[]> {
    return of(structuredClone(this.budgets));
  }

  getAllocations(): Observable<BudgetAllocation[]> {
    return of(structuredClone(this.allocations));
  }

  getTransactions(): Observable<Transaction[]> {
    return of(structuredClone(this.transactions));
  }

  getRules(): Observable<AssignmentRule[]> {
    return of(structuredClone(this.rules));
  }

  getImports(): Observable<ImportBatch[]> {
    return of(structuredClone(this.imports));
  }

  createBudget(
    input: Omit<Budget, 'id' | 'createdAt' | 'archived'> & { archived?: boolean },
  ): Observable<Budget> {
    const budget: Budget = {
      id: `bud-${crypto.randomUUID()}`,
      name: input.name,
      description: input.description,
      icon: input.icon,
      color: input.color,
      targetAmountCents: input.targetAmountCents,
      archived: input.archived ?? false,
      createdAt: new Date().toISOString(),
    };
    this.budgets = [...this.budgets, budget];
    return of(structuredClone(budget));
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
    const idx = this.budgets.findIndex((b) => b.id === id);
    if (idx < 0) {
      return throwError(() => new Error('Budget nicht gefunden'));
    }
    this.budgets[idx] = { ...this.budgets[idx], ...patch };
    return of(structuredClone(this.budgets[idx]));
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
    const idx = this.accounts.findIndex((a) => a.id === id);
    if (idx < 0) {
      return throwError(() => new Error('Konto nicht gefunden'));
    }
    this.accounts[idx] = { ...this.accounts[idx], ...patch };
    return of(structuredClone(this.accounts[idx]));
  }

  createTransaction(
    input: Omit<Transaction, 'id' | 'createdAt'> & { id?: string },
  ): Observable<Transaction> {
    const tx: Transaction = {
      ...input,
      id: input.id ?? `tx-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    this.transactions = [tx, ...this.transactions];
    return of(structuredClone(tx));
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
    const idx = this.transactions.findIndex((t) => t.id === id);
    if (idx < 0) {
      return throwError(() => new Error('Buchung nicht gefunden'));
    }
    this.transactions[idx] = { ...this.transactions[idx], ...patch };
    return of(structuredClone(this.transactions[idx]));
  }

  upsertAllocation(input: {
    budgetId: string;
    accountId: string;
    amountCents: number;
  }): Observable<BudgetAllocation> {
    const idx = this.allocations.findIndex(
      (a) => a.budgetId === input.budgetId && a.accountId === input.accountId,
    );
    if (idx >= 0) {
      this.allocations[idx] = {
        ...this.allocations[idx],
        amountCents: input.amountCents,
        updatedAt: new Date().toISOString(),
      };
      return of(structuredClone(this.allocations[idx]));
    }
    const alloc: BudgetAllocation = {
      id: `alloc-${crypto.randomUUID()}`,
      budgetId: input.budgetId,
      accountId: input.accountId,
      amountCents: input.amountCents,
      updatedAt: new Date().toISOString(),
    };
    this.allocations = [...this.allocations, alloc];
    return of(structuredClone(alloc));
  }

  createAccountTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    date: string;
    description?: string;
    note?: string;
  }): Observable<Transaction[]> {
    const groupId = `xfer-${crypto.randomUUID()}`;
    const description = input.description ?? 'Interne Umbuchung';
    const outTx: Transaction = {
      id: `tx-${crypto.randomUUID()}`,
      accountId: input.fromAccountId,
      date: input.date,
      amountCents: -input.amountCents,
      type: 'internal_transfer',
      budgetId: null,
      description,
      bankDescription: description,
      note: input.note ?? '',
      importFingerprint: null,
      transferGroupId: groupId,
      createdAt: new Date().toISOString(),
    };
    const inTx: Transaction = {
      ...outTx,
      id: `tx-${crypto.randomUUID()}`,
      accountId: input.toAccountId,
      amountCents: input.amountCents,
    };
    this.transactions = [outTx, inTx, ...this.transactions];
    this.accounts = this.accounts.map((a) => {
      if (a.id === input.fromAccountId) {
        return {
          ...a,
          currentBalanceCents: a.currentBalanceCents - input.amountCents,
          balanceDate: input.date,
        };
      }
      if (a.id === input.toAccountId) {
        return {
          ...a,
          currentBalanceCents: a.currentBalanceCents + input.amountCents,
          balanceDate: input.date,
        };
      }
      return a;
    });
    return of(structuredClone([outTx, inTx]));
  }

  createBalanceCorrection(input: {
    accountId: string;
    newBalanceCents: number;
    date: string;
    note?: string;
  }): Observable<{ account: Account; transaction: Transaction | null }> {
    const account = this.accounts.find((a) => a.id === input.accountId);
    if (!account) {
      return throwError(() => new Error('Konto nicht gefunden'));
    }
    const delta = input.newBalanceCents - account.currentBalanceCents;
    let transaction: Transaction | null = null;
    if (delta !== 0) {
      transaction = {
        id: `tx-${crypto.randomUUID()}`,
        accountId: input.accountId,
        date: input.date,
        amountCents: delta,
        type: 'correction',
        budgetId: null,
        description: 'Saldenkorrektur',
        bankDescription: 'Manuelle Kontostand-Korrektur',
        note: input.note ?? '',
        importFingerprint: null,
        transferGroupId: null,
        createdAt: new Date().toISOString(),
      };
      this.transactions = [transaction, ...this.transactions];
    }
    const updated = {
      ...account,
      currentBalanceCents: input.newBalanceCents,
      balanceDate: input.date,
    };
    this.accounts = this.accounts.map((a) =>
      a.id === input.accountId ? updated : a,
    );
    return of({
      account: structuredClone(updated),
      transaction: transaction ? structuredClone(transaction) : null,
    });
  }

  previewImport(): Observable<ImportPreview> {
    return throwError(
      () =>
        new Error(
          'CSV-Import ist im Demo-Modus nicht verfügbar. Bitte API starten.',
        ),
    );
  }

  confirmImport(): Observable<ImportBatch> {
    return throwError(
      () =>
        new Error(
          'CSV-Import ist im Demo-Modus nicht verfügbar. Bitte API starten.',
        ),
    );
  }
}
