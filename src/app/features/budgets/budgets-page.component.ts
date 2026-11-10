import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FinanceService } from '../../core/services/finance.service';
import { BudgetCardComponent } from '../../shared/components/budget-card/budget-card.component';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [AsyncPipe, BudgetCardComponent, CentsCurrencyPipe],
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.scss',
})
export class BudgetsPageComponent {
  readonly summary$ = inject(FinanceService).summary$;
  showAllocations = true;
}
