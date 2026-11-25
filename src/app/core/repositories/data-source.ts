import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import { ImportBatch, ImportPreview } from '../models/import.model';

/**
 * Abstract data source. Swap DemoDataSource / HttpDataSource without changing
 * feature components or calculation services.
 */
export abstract class HouseholdDataSource {
  abstract getAccounts(): Observable<Account[]>;
  abstract getBudgets(): Observable<Budget[]>;
  abstract getAllocations(): Observable<BudgetAllocation[]>;
  abstract getTransactions(): Observable<Transaction[]>;
  abstract getRules(): Observable<AssignmentRule[]>;
  abstract getImports(): Observable<ImportBatch[]>;

  abstract createBudget(
    input: Omit<Budget, 'id' | 'createdAt' | 'archived'> & { archived?: boolean },
  ): Observable<Budget>;
  abstract updateBudget(
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
  ): Observable<Budget>;

  abstract updateAccount(
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
  ): Observable<Account>;

  abstract createTransaction(
    input: Omit<Transaction, 'id' | 'createdAt'> & { id?: string },
  ): Observable<Transaction>;
  abstract updateTransaction(
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
  ): Observable<Transaction>;

  abstract upsertAllocation(input: {
    budgetId: string;
    accountId: string;
    amountCents: number;
  }): Observable<BudgetAllocation>;

  abstract createAccountTransfer(input: {
    fromAccountId: string;
    toAccountId: string;
    amountCents: number;
    date: string;
    description?: string;
    note?: string;
  }): Observable<Transaction[]>;

  abstract createBalanceCorrection(input: {
    accountId: string;
    newBalanceCents: number;
    date: string;
    note?: string;
  }): Observable<{ account: Account; transaction: Transaction | null }>;

  abstract previewImport(input: {
    accountId: string;
    file: File;
  }): Observable<ImportPreview>;

  abstract confirmImport(input: {
    accountId: string;
    file: File;
    newBalanceCents?: number | null;
    balanceDate?: string | null;
  }): Observable<ImportBatch>;
}
