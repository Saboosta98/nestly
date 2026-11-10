import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
        title: 'Dashboard · Haushalt Budget',
      },
      {
        path: 'konten',
        loadComponent: () =>
          import('./features/accounts/accounts-page.component').then(
            (m) => m.AccountsPageComponent,
          ),
        title: 'Konten · Haushalt Budget',
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets-page.component').then(
            (m) => m.BudgetsPageComponent,
          ),
        title: 'Budgets · Haushalt Budget',
      },
      {
        path: 'buchungen',
        loadComponent: () =>
          import('./features/transactions/transactions-page.component').then(
            (m) => m.TransactionsPageComponent,
          ),
        title: 'Buchungen · Haushalt Budget',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
