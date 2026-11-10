import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-stat-chip',
  standalone: true,
  templateUrl: './stat-chip.component.html',
  styleUrl: './stat-chip.component.scss',
})
export class StatChipComponent {
  @Input({ required: true }) label!: string;
  @Input({ required: true }) value!: string;
  @Input() hint = '';
  @Input() tone: 'default' | 'primary' | 'secondary' | 'warning' = 'default';
  @Input() delay = 0;
}
