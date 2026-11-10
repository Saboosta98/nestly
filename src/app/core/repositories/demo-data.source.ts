import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';
import {
  DEMO_ACCOUNTS,
  DEMO_ALLOCATIONS,
  DEMO_BUDGETS,
  DEMO_RULES,
  DEMO_TRANSACTIONS,
} from '../services/demo-data';
import { HouseholdDataSource } from './data-source';

@Injectable({ providedIn: 'root' })
export class DemoDataSource extends HouseholdDataSource {
  getAccounts(): Observable<Account[]> {
    return of(structuredClone(DEMO_ACCOUNTS));
  }

  getBudgets(): Observable<Budget[]> {
    return of(structuredClone(DEMO_BUDGETS));
  }

  getAllocations(): Observable<BudgetAllocation[]> {
    return of(structuredClone(DEMO_ALLOCATIONS));
  }

  getTransactions(): Observable<Transaction[]> {
    return of(structuredClone(DEMO_TRANSACTIONS));
  }

  getRules(): Observable<AssignmentRule[]> {
    return of(structuredClone(DEMO_RULES));
  }
}
