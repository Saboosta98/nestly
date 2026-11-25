import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ApiAuthService,
  type HealthAuth,
  type NestlyUser,
} from '../core/services/api-auth.service';
import { environment } from '../../environments/environment';

type GateMode = 'loading' | 'open' | 'login' | 'setup' | 'shared';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(ApiAuthService);

  readonly useDemo = environment.useDemo;
  gate: GateMode = this.useDemo ? 'open' : 'loading';
  health: HealthAuth | null = null;

  username = '';
  displayName = '';
  password = '';
  sharedPassword = '';
  authError = '';
  submitting = false;

  readonly navItems = [
    { path: '/', label: 'Home', icon: 'home', exact: true },
    { path: '/konten', label: 'Konten', icon: 'accounts', exact: false },
    { path: '/budgets', label: 'Budgets', icon: 'budgets', exact: false },
    { path: '/buchungen', label: 'Buchungen', icon: 'tx', exact: false },
    { path: '/import', label: 'Import', icon: 'import', exact: false },
  ];

  get user(): NestlyUser | null {
    return this.auth.user;
  }

  get showApp(): boolean {
    return this.gate === 'open';
  }

  get isAdmin(): boolean {
    return this.auth.isAdmin && this.user?.id !== 'shared';
  }

  ngOnInit(): void {
    if (this.useDemo) {
      return;
    }
    this.auth.loadHealth().subscribe((health) => {
      this.health = health;
      this.resolveGate(health);
    });
  }

  submitLogin(): void {
    this.authError = '';
    this.submitting = true;
    this.auth.login(this.username.trim(), this.password).subscribe({
      next: () => {
        this.submitting = false;
        this.password = '';
        this.gate = 'open';
      },
      error: (err) => {
        this.submitting = false;
        this.authError = err?.error?.error ?? 'Anmeldung fehlgeschlagen.';
      },
    });
  }

  submitSetup(): void {
    this.authError = '';
    this.submitting = true;
    this.auth
      .setup(
        this.username.trim(),
        this.displayName.trim() || this.username.trim(),
        this.password,
      )
      .subscribe({
        next: () => {
          this.submitting = false;
          this.password = '';
          this.gate = 'open';
        },
        error: (err) => {
          this.submitting = false;
          this.authError = err?.error?.error ?? 'Einrichtung fehlgeschlagen.';
        },
      });
  }

  submitShared(): void {
    this.authError = '';
    this.submitting = true;
    this.auth.setSharedPassword(this.sharedPassword.trim() || null);
    this.auth.refreshMe().subscribe({
      next: (user) => {
        this.submitting = false;
        if (user) {
          this.gate = 'open';
          this.sharedPassword = '';
        } else {
          this.authError = 'Kennwort ungültig.';
          this.auth.setSharedPassword(null);
        }
      },
      error: () => {
        this.submitting = false;
        this.authError = 'Kennwort ungültig.';
        this.auth.setSharedPassword(null);
      },
    });
  }

  logout(): void {
    this.auth.logout().subscribe({
      next: () => {
        this.username = '';
        this.password = '';
        this.sharedPassword = '';
        this.auth.loadHealth().subscribe((health) => {
          this.health = health;
          if (health.setupRequired) {
            this.gate = 'setup';
          } else if (health.authMode === 'shared_password') {
            this.gate = 'shared';
          } else if (health.authRequired) {
            this.gate = 'login';
          } else {
            this.gate = 'open';
          }
        });
      },
    });
  }

  private resolveGate(health: HealthAuth): void {
    if (health.setupRequired) {
      this.gate = 'setup';
      return;
    }
    if (!health.authRequired) {
      this.gate = 'open';
      return;
    }
    if (this.auth.getToken()) {
      this.auth.refreshMe().subscribe((user) => {
        if (user) {
          this.gate = 'open';
        } else {
          this.gate = health.authMode === 'shared_password' ? 'shared' : 'login';
        }
      });
      return;
    }
    this.gate = health.authMode === 'shared_password' ? 'shared' : 'login';
  }
}
