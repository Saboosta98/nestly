import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiAuthService, type NestlyUser } from '../../core/services/api-auth.service';

@Component({
  selector: 'app-access-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './access-page.component.html',
  styleUrl: './access-page.component.scss',
})
export class AccessPageComponent implements OnInit {
  private readonly auth = inject(ApiAuthService);

  users: NestlyUser[] = [];
  loading = true;
  error = '';
  success = '';

  username = '';
  displayName = '';
  password = '';
  role: 'admin' | 'member' = 'member';
  saving = false;

  get currentUser(): NestlyUser | null {
    return this.auth.user;
  }

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    this.error = '';
    this.auth.listUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error =
          err?.error?.error ??
          'Mitglieder konnten nicht geladen werden. Nur Admins haben Zugriff.';
      },
    });
  }

  addMember(): void {
    this.error = '';
    this.success = '';
    this.saving = true;
    this.auth
      .createUser({
        username: this.username.trim(),
        displayName: this.displayName.trim() || this.username.trim(),
        password: this.password,
        role: this.role,
      })
      .subscribe({
        next: () => {
          this.saving = false;
          this.success = 'Person hinzugefügt.';
          this.username = '';
          this.displayName = '';
          this.password = '';
          this.role = 'member';
          this.reload();
        },
        error: (err) => {
          this.saving = false;
          this.error = err?.error?.error ?? 'Speichern fehlgeschlagen.';
        },
      });
  }

  remove(user: NestlyUser): void {
    if (!confirm(`„${user.displayName}“ wirklich entfernen?`)) {
      return;
    }
    this.error = '';
    this.success = '';
    this.auth.deleteUser(user.id).subscribe({
      next: () => {
        this.success = 'Person entfernt.';
        this.reload();
      },
      error: (err) => {
        this.error = err?.error?.error ?? 'Entfernen fehlgeschlagen.';
      },
    });
  }
}
