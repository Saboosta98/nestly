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
        title: 'Dashboard · Nestly',
      },
      {
        path: 'konten',
        loadComponent: () =>
          import('./features/accounts/accounts-page.component').then(
            (m) => m.AccountsPageComponent,
          ),
        title: 'Konten · Nestly',
      },
      {
        path: 'budgets',
        loadComponent: () =>
          import('./features/budgets/budgets-page.component').then(
            (m) => m.BudgetsPageComponent,
          ),
        title: 'Budgets · Nestly',
      },
      {
        path: 'buchungen',
        loadComponent: () =>
          import('./features/transactions/transactions-page.component').then(
            (m) => m.TransactionsPageComponent,
          ),
        title: 'Buchungen · Nestly',
      },
      {
        path: 'import',
        loadComponent: () =>
          import('./features/import/import-page.component').then(
            (m) => m.ImportPageComponent,
          ),
        title: 'CSV-Import · Nestly',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
