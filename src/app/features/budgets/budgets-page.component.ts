import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FinanceService } from '../../core/services/finance.service';
import { BudgetCardComponent } from '../../shared/components/budget-card/budget-card.component';
import { CentsCurrencyPipe } from '../../shared/pipes/cents-currency.pipe';

@Component({
  selector: 'app-budgets-page',
  standalone: true,
  imports: [AsyncPipe, FormsModule, BudgetCardComponent, CentsCurrencyPipe],
  templateUrl: './budgets-page.component.html',
  styleUrl: './budgets-page.component.scss',
})
export class BudgetsPageComponent {
  private readonly finance = inject(FinanceService);
  readonly summary$ = this.finance.summary$;
  showAllocations = true;

  name = '';
  description = '';
  icon = '💰';
  color = '#22b2a6';
  targetEuro = '';
  message = '';
  error = '';
  editingId: string | null = null;
  editName = '';
  editDescription = '';
  editTargetEuro = '';

  createBudget(): void {
    this.error = '';
    this.message = '';
    if (!this.name.trim()) {
      this.error = 'Name ist erforderlich.';
      return;
    }
    const target =
      this.targetEuro.trim() === ''
        ? null
        : Math.round(Number(this.targetEuro.replace(',', '.')) * 100);
    this.finance
      .createBudget({
        name: this.name.trim(),
        description: this.description.trim(),
        icon: this.icon.trim() || '💰',
        color: this.color || '#22b2a6',
        targetAmountCents:
          target !== null && Number.isFinite(target) ? target : null,
      })
      .subscribe({
        next: () => {
          this.message = 'Budget angelegt.';
          this.name = '';
          this.description = '';
          this.targetEuro = '';
        },
        error: (err) => {
          this.error = err?.error?.error || err?.message || 'Anlegen fehlgeschlagen.';
        },
      });
  }

  startEdit(budget: {
    id: string;
    name: string;
    description: string;
    targetAmountCents: number | null;
  }): void {
    this.editingId = budget.id;
    this.editName = budget.name;
    this.editDescription = budget.description;
    this.editTargetEuro =
      budget.targetAmountCents == null
        ? ''
        : (budget.targetAmountCents / 100).toFixed(2).replace('.', ',');
  }

  saveEdit(): void {
    if (!this.editingId) {
      return;
    }
    const target =
      this.editTargetEuro.trim() === ''
        ? null
        : Math.round(Number(this.editTargetEuro.replace(',', '.')) * 100);
    this.finance
      .updateBudget(this.editingId, {
        name: this.editName.trim(),
        description: this.editDescription.trim(),
        targetAmountCents:
          target !== null && Number.isFinite(target) ? target : null,
      })
      .subscribe({
        next: () => {
          this.message = 'Budget aktualisiert.';
          this.editingId = null;
        },
        error: (err) => {
          this.error =
            err?.error?.error || err?.message || 'Speichern fehlgeschlagen.';
        },
      });
  }

  archiveBudget(id: string): void {
    this.finance.updateBudget(id, { archived: true }).subscribe({
      next: () => {
        this.message = 'Budget archiviert.';
      },
      error: (err) => {
        this.error =
          err?.error?.error || err?.message || 'Archivieren fehlgeschlagen.';
      },
    });
  }
}
