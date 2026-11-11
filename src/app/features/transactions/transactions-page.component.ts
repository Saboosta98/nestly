import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FinanceService } from '../../core/services/finance.service';
import { TransactionListComponent } from '../../shared/components/transaction-list/transaction-list.component';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-transactions-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, RouterLink, TransactionListComponent],
  templateUrl: './transactions-page.component.html',
  styleUrl: './transactions-page.component.scss',
})
export class TransactionsPageComponent {
  private readonly finance = inject(FinanceService);

  readonly summary$ = this.finance.summary$;
  readonly transactions$ = this.finance.allTransactions$;

  filter: 'all' | 'unassigned' = 'all';
  message = '';
  error = '';

  // Manual booking form
  accountId = 'acc-giro';
  date = new Date().toISOString().slice(0, 10);
  amountEuro = '';
  description = '';
  budgetId = '';
  type: 'income' | 'expense' = 'expense';

  filtered(txs: Transaction[]): Transaction[] {
    if (this.filter === 'unassigned') {
      return txs.filter(
        (t) =>
          !t.budgetId &&
          (t.type === 'income' || t.type === 'expense' || t.type === 'correction'),
      );
    }
    return txs;
  }

  onAssign(event: { transactionId: string; budgetId: string | null }): void {
    this.error = '';
    this.message = '';
    this.finance
      .assignTransactionToBudget(event.transactionId, event.budgetId)
      .subscribe({
        next: () => {
          this.message = 'Budgetzuordnung gespeichert.';
        },
        error: (err) => {
          this.error =
            err?.error?.error || err?.message || 'Zuordnung fehlgeschlagen.';
        },
      });
  }

  createBooking(): void {
    this.error = '';
    this.message = '';
    const raw = Number(this.amountEuro.replace(',', '.'));
    if (!Number.isFinite(raw) || raw === 0) {
      this.error = 'Bitte einen Betrag ungleich null eingeben.';
      return;
    }
    if (!this.description.trim()) {
      this.error = 'Beschreibung fehlt.';
      return;
    }
    const amountCents =
      this.type === 'expense'
        ? -Math.abs(Math.round(raw * 100))
        : Math.abs(Math.round(raw * 100));

    this.finance
      .createTransaction({
        accountId: this.accountId,
        date: this.date,
        amountCents,
        type: this.type,
        budgetId: this.budgetId || null,
        description: this.description.trim(),
        bankDescription: '',
        note: '',
        importFingerprint: null,
        transferGroupId: null,
      })
      .subscribe({
        next: () => {
          this.message = 'Buchung angelegt.';
          this.amountEuro = '';
          this.description = '';
          this.budgetId = '';
        },
        error: (err) => {
          this.error =
            err?.error?.error || err?.message || 'Anlegen fehlgeschlagen.';
        },
      });
  }
}
