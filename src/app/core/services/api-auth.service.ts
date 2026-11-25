import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'nestly.token';
const USER_KEY = 'nestly.user';

export interface NestlyUser {
  id: string;
  username: string;
  displayName: string;
  role: 'admin' | 'member';
  createdAt: string;
}

export interface AuthSession {
  user: NestlyUser;
  token: string;
  expiresAt: string;
}

export interface HealthAuth {
  authRequired: boolean;
  setupRequired: boolean;
  authMode: 'open' | 'users' | 'shared_password';
}

@Injectable({ providedIn: 'root' })
export class ApiAuthService {
  private readonly http = inject(HttpClient);
  private readonly userSubject = new BehaviorSubject<NestlyUser | null>(
    this.readStoredUser(),
  );

  readonly user$ = this.userSubject.asObservable();

  get user(): NestlyUser | null {
    return this.userSubject.value;
  }

  get isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  getToken(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  /** @deprecated use getToken — kept for interceptor compatibility during migration */
  getPassword(): string | null {
    return this.getToken();
  }

  setSession(session: AuthSession | null): void {
    try {
      if (!session) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        this.userSubject.next(null);
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, session.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(session.user));
      this.userSubject.next(session.user);
    } catch {
      /* ignore storage failures */
    }
  }

  /** Legacy shared-password unlock (NESTLY_PASSWORD mode). */
  setSharedPassword(password: string | null): void {
    try {
      if (!password) {
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
        this.userSubject.next(null);
        return;
      }
      sessionStorage.setItem(TOKEN_KEY, password);
      const shared: NestlyUser = {
        id: 'shared',
        username: 'haushalt',
        displayName: 'Haushalt',
        role: 'admin',
        createdAt: '',
      };
      sessionStorage.setItem(USER_KEY, JSON.stringify(shared));
      this.userSubject.next(shared);
    } catch {
      /* ignore */
    }
  }

  authHeaders(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  loadHealth(): Observable<HealthAuth> {
    return this.http
      .get<HealthAuth>(`${environment.apiBaseUrl}/health`)
      .pipe(
        map((res) => ({
          authRequired: Boolean(res.authRequired),
          setupRequired: Boolean(res.setupRequired),
          authMode: res.authMode ?? (res.authRequired ? 'users' : 'open'),
        })),
        catchError(() =>
          of({
            authRequired: false,
            setupRequired: false,
            authMode: 'open' as const,
          }),
        ),
      );
  }

  login(username: string, password: string): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/auth/login`, {
        username,
        password,
      })
      .pipe(tap((session) => this.setSession(session)));
  }

  setup(
    username: string,
    displayName: string,
    password: string,
  ): Observable<AuthSession> {
    return this.http
      .post<AuthSession>(`${environment.apiBaseUrl}/auth/setup`, {
        username,
        displayName,
        password,
      })
      .pipe(tap((session) => this.setSession(session)));
  }

  refreshMe(): Observable<NestlyUser | null> {
    if (!this.getToken()) {
      this.userSubject.next(null);
      return of(null);
    }
    return this.http
      .get<{ user: NestlyUser }>(`${environment.apiBaseUrl}/auth/me`)
      .pipe(
        map((res) => res.user),
        tap((user) => {
          try {
            sessionStorage.setItem(USER_KEY, JSON.stringify(user));
          } catch {
            /* ignore */
          }
          this.userSubject.next(user);
        }),
        catchError(() => {
          this.setSession(null);
          return of(null);
        }),
      );
  }

  logout(): Observable<void> {
    const token = this.getToken();
    if (!token) {
      this.setSession(null);
      return of(undefined);
    }
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/logout`, {})
      .pipe(
        catchError(() => of(undefined)),
        tap(() => this.setSession(null)),
        map(() => undefined),
      );
  }

  listUsers(): Observable<NestlyUser[]> {
    return this.http.get<NestlyUser[]>(`${environment.apiBaseUrl}/users`);
  }

  createUser(input: {
    username: string;
    displayName: string;
    password: string;
    role: 'admin' | 'member';
  }): Observable<NestlyUser> {
    return this.http.post<NestlyUser>(`${environment.apiBaseUrl}/users`, input);
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/users/${id}`);
  }

  private readStoredUser(): NestlyUser | null {
    try {
      const raw = sessionStorage.getItem(USER_KEY);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw) as NestlyUser;
    } catch {
      return null;
    }
  }
}
