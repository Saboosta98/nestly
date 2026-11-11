import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { ImportPreview } from '../../core/models/import.model';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';
import { GermanDatePipe } from '../../shared/pipes/german-date.pipe';

@Component({
  selector: 'app-import-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, CentsCurrencyPipe, GermanDatePipe],
  templateUrl: './import-page.component.html',
  styleUrl: './import-page.component.scss',
})
export class ImportPageComponent {
  private readonly finance = inject(FinanceService);

  readonly accounts$ = this.finance.accounts$;
  readonly imports$ = this.finance.imports$;

  accountId = 'acc-giro';
  file: File | null = null;
  preview: ImportPreview | null = null;
  balanceEuro = '';
  busy = false;
  error = '';
  success = '';

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
    this.preview = null;
    this.error = '';
    this.success = '';
  }

  previewImport(): void {
    if (!this.file || !this.accountId) {
      this.error = 'Bitte Konto und CSV-Datei wählen.';
      return;
    }
    this.busy = true;
    this.error = '';
    this.success = '';
    this.finance.previewImport({ accountId: this.accountId, file: this.file }).subscribe({
      next: (preview) => {
        this.preview = preview;
        this.busy = false;
      },
      error: (err) => {
        this.busy = false;
        this.error = err?.error?.error || err?.message || 'Vorschau fehlgeschlagen.';
      },
    });
  }

  confirmImport(): void {
    if (!this.file || !this.accountId || !this.preview) {
      return;
    }
    this.busy = true;
    this.error = '';
    const euros = this.balanceEuro.trim().replace(',', '.');
    const newBalanceCents =
      euros === '' ? null : Math.round(Number(euros) * 100);
    this.finance
      .confirmImport({
        accountId: this.accountId,
        file: this.file,
        newBalanceCents:
          newBalanceCents !== null && Number.isFinite(newBalanceCents)
            ? newBalanceCents
            : null,
        balanceDate: this.preview.rows[0]?.bookingDate ?? null,
      })
      .subscribe({
        next: (batch) => {
          this.busy = false;
          this.success = `Import abgeschlossen: ${batch.newTransactions} neu, ${batch.duplicateTransactions} Duplikate.`;
          this.preview = null;
          this.file = null;
          this.balanceEuro = '';
        },
        error: (err) => {
          this.busy = false;
          this.error = err?.error?.error || err?.message || 'Import fehlgeschlagen.';
        },
      });
  }
}
