import { Injectable } from '@angular/core';

const STORAGE_KEY = 'nestly.password';

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  getPassword(): string | null {
    try {
      return sessionStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  setPassword(password: string | null): void {
    try {
      if (!password) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        sessionStorage.setItem(STORAGE_KEY, password);
      }
    } catch {
      /* ignore */
    }
  }

  authHeaders(): Record<string, string> {
    const password = this.getPassword();
    return password ? { Authorization: `Bearer ${password}` } : {};
  }
}
