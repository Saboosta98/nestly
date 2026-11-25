import { v4 as uuid } from 'uuid';
import { getDb } from './db.js';
import { createSessionToken, hashPassword, hashToken, verifyPassword } from './password.js';

export type UserRole = 'admin' | 'member';

export interface PublicUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
  createdAt: string;
}

interface UserRow {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: string;
  created_at: string;
}

function toPublic(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    role: row.role === 'admin' ? 'admin' : 'member',
    createdAt: row.created_at,
  };
}

export function countUsers(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS c FROM users').get() as { c: number };
  return row.c;
}

export function listUsers(): PublicUser[] {
  const rows = getDb()
    .prepare(
      `SELECT id, username, display_name, password_hash, role, created_at
       FROM users ORDER BY created_at ASC`,
    )
    .all() as UserRow[];
  return rows.map(toPublic);
}

export function getUserById(id: string): PublicUser | null {
  const row = getDb()
    .prepare(
      `SELECT id, username, display_name, password_hash, role, created_at
       FROM users WHERE id = ?`,
    )
    .get(id) as UserRow | undefined;
  return row ? toPublic(row) : null;
}

export function createUser(input: {
  username: string;
  displayName: string;
  password: string;
  role: UserRole;
}): PublicUser {
  const username = input.username.trim().toLowerCase();
  const displayName = input.displayName.trim() || username;
  if (!username || username.length < 2) {
    throw Object.assign(new Error('Benutzername muss mindestens 2 Zeichen haben.'), {
      status: 400,
    });
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    throw Object.assign(
      new Error('Benutzername: nur Kleinbuchstaben, Zahlen, Punkt, Unterstrich, Bindestrich.'),
      { status: 400 },
    );
  }
  if (!input.password || input.password.length < 8) {
    throw Object.assign(new Error('Passwort muss mindestens 8 Zeichen haben.'), {
      status: 400,
    });
  }

  const existing = getDb()
    .prepare('SELECT id FROM users WHERE username = ?')
    .get(username) as { id: string } | undefined;
  if (existing) {
    throw Object.assign(new Error('Benutzername ist bereits vergeben.'), { status: 409 });
  }

  const id = uuid();
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO users (id, username, display_name, password_hash, role, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(id, username, displayName, hashPassword(input.password), input.role, now);

  return {
    id,
    username,
    displayName,
    role: input.role,
    createdAt: now,
  };
}

export function deleteUser(id: string, actingUserId: string): void {
  if (id === actingUserId) {
    throw Object.assign(new Error('Du kannst dich nicht selbst entfernen.'), { status: 400 });
  }
  const target = getUserById(id);
  if (!target) {
    throw Object.assign(new Error('Benutzer nicht gefunden.'), { status: 404 });
  }
  if (target.role === 'admin') {
    const admins = getDb()
      .prepare(`SELECT COUNT(*) AS c FROM users WHERE role = 'admin'`)
      .get() as { c: number };
    if (admins.c <= 1) {
      throw Object.assign(new Error('Der letzte Admin kann nicht entfernt werden.'), {
        status: 400,
      });
    }
  }
  const db = getDb();
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
  const result = db.prepare('DELETE FROM users WHERE id = ?').run(id);
  if (result.changes === 0) {
    throw Object.assign(new Error('Benutzer nicht gefunden.'), { status: 404 });
  }
}

export function authenticate(
  username: string,
  password: string,
): { user: PublicUser; token: string; expiresAt: string } | null {
  const row = getDb()
    .prepare(
      `SELECT id, username, display_name, password_hash, role, created_at
       FROM users WHERE username = ?`,
    )
    .get(username.trim().toLowerCase()) as UserRow | undefined;
  if (!row || !verifyPassword(password, row.password_hash)) {
    return null;
  }

  const { token, tokenHash } = createSessionToken();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
  getDb()
    .prepare(
      `INSERT INTO sessions (id, user_id, token_hash, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(uuid(), row.id, tokenHash, new Date().toISOString(), expiresAt);

  return { user: toPublic(row), token, expiresAt };
}

export function resolveSession(token: string): PublicUser | null {
  if (!token) {
    return null;
  }
  const tokenHash = hashToken(token);
  const row = getDb()
    .prepare(
      `SELECT u.id, u.username, u.display_name, u.password_hash, u.role, u.created_at,
              s.expires_at AS session_expires
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(tokenHash) as (UserRow & { session_expires: string }) | undefined;

  if (!row) {
    return null;
  }
  if (new Date(row.session_expires).getTime() < Date.now()) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  return toPublic(row);
}

export function revokeSession(token: string): void {
  if (!token) {
    return;
  }
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
}

export function purgeExpiredSessions(): void {
  getDb()
    .prepare('DELETE FROM sessions WHERE expires_at < ?')
    .run(new Date().toISOString());
}

/** Bootstrap first admin from env when the users table is empty. */
export function bootstrapAdminFromEnv(
  username: string | null,
  password: string | null,
): PublicUser | null {
  if (countUsers() > 0 || !username || !password) {
    return null;
  }
  return createUser({
    username,
    displayName: username,
    password,
    role: 'admin',
  });
}
