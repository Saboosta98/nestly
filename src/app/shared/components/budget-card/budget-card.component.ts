import { Component, Input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { BudgetView } from '../../../core/models/budget.model';
import { Account } from '../../../core/models/account.model';
import { CentsCurrencyPipe } from '../../pipes/cents-currency.pipe';

@Component({
  selector: 'app-budget-card',
  standalone: true,
  imports: [CentsCurrencyPipe, DecimalPipe],
  templateUrl: './budget-card.component.html',
  styleUrl: './budget-card.component.scss',
})
export class BudgetCardComponent {
  @Input({ required: true }) budget!: BudgetView;
  @Input() accounts: Account[] = [];
  @Input() showAllocations = false;
  @Input() delay = 0;

  accountName(accountId: string): string {
    return this.accounts.find((a) => a.id === accountId)?.name ?? 'Konto';
  }
}
