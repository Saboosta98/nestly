import { Component, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiAuthService } from '../core/services/api-auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(ApiAuthService);

  readonly useDemo = environment.useDemo;
  authRequired = false;
  showAuth = false;
  password = '';
  authError = '';

  readonly navItems = [
    { path: '/', label: 'Home', icon: 'home', exact: true },
    { path: '/konten', label: 'Konten', icon: 'accounts', exact: false },
    { path: '/budgets', label: 'Budgets', icon: 'budgets', exact: false },
    { path: '/buchungen', label: 'Buchungen', icon: 'tx', exact: false },
    { path: '/import', label: 'Import', icon: 'import', exact: false },
  ];

  ngOnInit(): void {
    if (this.useDemo) {
      return;
    }
    this.http.get<{ authRequired: boolean }>(`${environment.apiBaseUrl}/health`).subscribe({
      next: (res) => {
        this.authRequired = Boolean(res.authRequired);
        if (this.authRequired && !this.auth.getPassword()) {
          this.showAuth = true;
        }
      },
      error: () => {
        /* API may be down during pure static serve */
      },
    });
  }

  savePassword(): void {
    this.authError = '';
    this.auth.setPassword(this.password.trim() || null);
    this.http
      .get<{ ok: boolean }>(`${environment.apiBaseUrl}/accounts`)
      .subscribe({
        next: () => {
          this.showAuth = false;
        },
        error: () => {
          this.authError = 'Kennwort ungültig.';
          this.auth.setPassword(null);
        },
      });
  }
}
