import { Component, Input } from '@angular/core';
import { CentsCurrencyPipe } from '../../pipes/cents-currency.pipe';

@Component({
  selector: 'app-reconciliation-banner',
  standalone: true,
  imports: [CentsCurrencyPipe],
  templateUrl: './reconciliation-banner.component.html',
  styleUrl: './reconciliation-banner.component.scss',
})
export class ReconciliationBannerComponent {
  @Input({ required: true }) totalBalanceCents!: number;
  @Input({ required: true }) totalBudgetBalanceCents!: number;
  @Input({ required: true }) unassignedBalanceCents!: number;
  @Input({ required: true }) isReconciled!: boolean;
  @Input() reconciliationDeltaCents = 0;
}
