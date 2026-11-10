import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs';
import { FinanceService } from '../../core/services/finance.service';
import { HouseholdDataSource } from '../../core/repositories/data-source';
import { TransactionListComponent } from '../../shared/components/transaction-list/transaction-list.component';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [AsyncPipe, TransactionListComponent],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss',
})
export class TransactionsPageComponent {
  private readonly finance = inject(FinanceService);
  private readonly data = inject(HouseholdDataSource);

  readonly summary$ = this.finance.summary$;
  readonly transactions$ = this.data.getTransactions().pipe(
    map((txs) =>
      [...txs].sort((a, b) => {
        if (a.date === b.date) {
          return b.createdAt.localeCompare(a.createdAt);
        }
        return b.date.localeCompare(a.date);
      }),
    ),
  );
}
