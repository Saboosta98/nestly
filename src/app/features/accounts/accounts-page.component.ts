import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { AccountCardComponent } from '../../shared/components/account-card/account-card.component';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';
import { Account } from '../../core/models/account.model';

@Component({
  selector: 'app-accounts-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, AccountCardComponent, CentsCurrencyPipe],
  templateUrl: './accounts-page.component.html',
  styleUrl: './accounts-page.component.scss',
})
export class AccountsPageComponent {
  private readonly finance = inject(FinanceService);
  readonly summary$ = this.finance.summary$;

  transferFrom = 'acc-giro';
  transferTo = 'acc-tagesgeld';
  transferAmountEuro = '';
  transferDate = new Date().toISOString().slice(0, 10);
  transferNote = '';

  correctionAccountId = 'acc-giro';
  correctionEuro = '';
  correctionDate = new Date().toISOString().slice(0, 10);
  correctionNote = '';

  message = '';
  error = '';

  submitTransfer(accounts: Account[]): void {
    this.error = '';
    this.message = '';
    const amountCents = Math.round(
      Number(this.transferAmountEuro.replace(',', '.')) * 100,
    );
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      this.error = 'Bitte einen positiven Betrag eingeben.';
      return;
    }
    if (this.transferFrom === this.transferTo) {
      this.error = 'Quell- und Zielkonto müssen verschieden sein.';
      return;
    }
    if (!accounts.some((a) => a.id === this.transferFrom)) {
      this.error = 'Quellkonto ungültig.';
      return;
    }
    this.finance
      .createAccountTransfer({
        fromAccountId: this.transferFrom,
        toAccountId: this.transferTo,
        amountCents,
        date: this.transferDate,
        description: 'Interne Umbuchung',
        note: this.transferNote,
      })
      .subscribe({
        next: () => {
          this.message = 'Umbuchung gespeichert.';
          this.transferAmountEuro = '';
          this.transferNote = '';
        },
        error: (err) => {
          this.error = err?.error?.error || err?.message || 'Umbuchung fehlgeschlagen.';
        },
      });
  }

  submitCorrection(): void {
    this.error = '';
    this.message = '';
    const newBalanceCents = Math.round(
      Number(this.correctionEuro.replace(',', '.')) * 100,
    );
    if (!Number.isFinite(newBalanceCents)) {
      this.error = 'Bitte einen gültigen Kontostand eingeben.';
      return;
    }
    this.finance
      .createBalanceCorrection({
        accountId: this.correctionAccountId,
        newBalanceCents,
        date: this.correctionDate,
        note: this.correctionNote,
      })
      .subscribe({
        next: () => {
          this.message = 'Saldenkorrektur gespeichert.';
          this.correctionEuro = '';
          this.correctionNote = '';
        },
        error: (err) => {
          this.error =
            err?.error?.error || err?.message || 'Korrektur fehlgeschlagen.';
        },
      });
  }
}
