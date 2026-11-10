import { Component, Input } from '@angular/core';
import { Account } from '../../../core/models/account.model';
import { CentsCurrencyPipe } from '../../pipes/cents-currency.pipe';
import { GermanDatePipe } from '../../pipes/german-date.pipe';

@Component({
  selector: 'app-account-card',
  standalone: true,
  imports: [CentsCurrencyPipe, GermanDatePipe],
  templateUrl: './account-card.component.html',
  styleUrl: './account-card.component.scss',
})
export class AccountCardComponent {
  @Input({ required: true }) account!: Account;
  @Input() accent: 'primary' | 'secondary' = 'primary';
  @Input() delay = 0;

  get typeLabel(): string {
    switch (this.account.accountType) {
      case 'checking':
        return 'Girokonto';
      case 'savings':
        return 'Tagesgeld';
      default:
        return 'Konto';
    }
  }
}
