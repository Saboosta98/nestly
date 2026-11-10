import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { AccountCardComponent } from '../../shared/components/account-card/account-card.component';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [AsyncPipe, AccountCardComponent, CentsCurrencyPipe],
  templateUrl: './accounts-page.component.html',
  styleUrl: './accounts-page.component.scss',
})
export class AccountsPageComponent {
  readonly summary$ = inject(FinanceService).summary$;
}
