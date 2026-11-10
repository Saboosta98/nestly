import { Component, Input } from '@angular/core';
import { Transaction, TransactionType } from '../../../core/models/transaction.model';
import { Account } from '../../../core/models/account.model';
import { Budget } from '../../../core/models/budget.model';
import { CentsCurrencyPipe } from '../../pipes/cents-currency.pipe';
import { GermanDatePipe } from '../../pipes/german-date.pipe';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CentsCurrencyPipe, GermanDatePipe],
  templateUrl: './transaction-list.component.html',
  styleUrl: './transaction-list.component.scss',
})
export class TransactionListComponent {
  @Input({ required: true }) transactions!: Transaction[];
  @Input() accounts: Account[] = [];
  @Input() budgets: Budget[] = [];

  accountName(id: string | null): string {
    if (!id) {
      return '–';
    }
    return this.accounts.find((a) => a.id === id)?.name ?? 'Konto';
  }

  budgetName(id: string | null): string {
    if (!id) {
      return 'Nicht zugeordnet';
    }
    return this.budgets.find((b) => b.id === id)?.name ?? 'Budget';
  }

  typeLabel(type: TransactionType): string {
    switch (type) {
      case 'income':
        return 'Einnahme';
      case 'expense':
        return 'Ausgabe';
      case 'internal_transfer':
        return 'Umbuchung';
      case 'budget_transfer':
        return 'Budgettransfer';
      case 'correction':
        return 'Korrektur';
      default:
        return type;
    }
  }

  amountClass(tx: Transaction): string {
    if (tx.type === 'internal_transfer' || tx.type === 'budget_transfer') {
      return 'is-neutral';
    }
    return tx.amountCents >= 0 ? 'is-income' : 'is-expense';
  }
}
