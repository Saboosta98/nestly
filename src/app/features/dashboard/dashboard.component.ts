import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';
import { AccountCardComponent } from '../../shared/components/account-card/account-card.component';
import { BudgetCardComponent } from '../../shared/components/budget-card/budget-card.component';
import { StatChipComponent } from '../../shared/components/stat-chip/stat-chip.component';
import { ReconciliationBannerComponent } from '../../shared/components/reconciliation-banner/reconciliation-banner.component';
import { TransactionListComponent } from '../../shared/components/transaction-list/transaction-list.component';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    AsyncPipe,
    RouterLink,
    AccountCardComponent,
    BudgetCardComponent,
    StatChipComponent,
    ReconciliationBannerComponent,
    TransactionListComponent,
    CentsCurrencyPipe,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly finance = inject(FinanceService);
  readonly summary$ = this.finance.summary$;
  showAllocations = false;

  toggleAllocations(): void {
    this.showAllocations = !this.showAllocations;
  }
}
