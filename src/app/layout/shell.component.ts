import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  readonly navItems = [
    { path: '/', label: 'Dashboard', icon: 'home', exact: true },
    { path: '/konten', label: 'Konten', icon: 'accounts', exact: false },
    { path: '/budgets', label: 'Budgets', icon: 'budgets', exact: false },
    { path: '/buchungen', label: 'Buchungen', icon: 'tx', exact: false },
  ];
}
