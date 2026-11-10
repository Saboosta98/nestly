import { Observable } from 'rxjs';
import { Account } from '../models/account.model';
import { Budget, BudgetAllocation } from '../models/budget.model';
import { Transaction } from '../models/transaction.model';
import { AssignmentRule } from '../models/rule.model';

/**
 * Abstract data source. Swap DemoDataSource for an Appwrite implementation later
 * without changing feature components or calculation services.
 */
export abstract class HouseholdDataSource {
  abstract getAccounts(): Observable<Account[]>;
  abstract getBudgets(): Observable<Budget[]>;
  abstract getAllocations(): Observable<BudgetAllocation[]>;
  abstract getTransactions(): Observable<Transaction[]>;
  abstract getRules(): Observable<AssignmentRule[]>;
}
