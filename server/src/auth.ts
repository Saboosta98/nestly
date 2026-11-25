import type { NextFunction, Request, Response } from 'express';
import { NESTLY_PASSWORD } from './config.js';
import { countUsers, resolveSession, type PublicUser } from './users.js';

export type AuthMode = 'open' | 'users' | 'shared_password';

declare global {
  namespace Express {
    interface Request {
      nestlyUser?: PublicUser;
      nestlyAuth?: 'session' | 'shared_password';
    }
  }
}

export function getAuthMode(): AuthMode {
  if (countUsers() > 0) {
    return 'users';
  }
  if (NESTLY_PASSWORD) {
    return 'shared_password';
  }
  return 'open';
}

export function authRequired(): boolean {
  // Always require auth for the SPA gate: either login, shared password, or first-run setup.
  return true;
}

export function setupRequired(): boolean {
  return countUsers() === 0 && !NESTLY_PASSWORD;
}

function extractBearer(req: Request): string {
  const header = req.header('authorization') ?? '';
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken =
    typeof req.query.token === 'string' ? req.query.token : undefined;
  return (bearer ?? queryToken ?? '').trim();
}

const PUBLIC_API_PATHS = new Set([
  '/api/health',
  '/api/auth/login',
  '/api/auth/setup',
]);

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }

  if (PUBLIC_API_PATHS.has(req.path)) {
    next();
    return;
  }

  const mode = getAuthMode();
  // Before first admin exists, block data APIs — only setup/login/health are public.
  if (mode === 'open') {
    res.status(401).json({
      error: 'Zugang noch nicht eingerichtet. Bitte zuerst den Admin anlegen.',
      code: 'setup_required',
    });
    return;
  }

  const token = extractBearer(req);
  if (!token) {
    res.status(401).json({
      error: 'Anmeldung erforderlich.',
      code: 'auth_required',
    });
    return;
  }

  if (mode === 'users') {
    const user = resolveSession(token);
    if (user) {
      req.nestlyUser = user;
      req.nestlyAuth = 'session';
      next();
      return;
    }
    // Legacy shared password still accepted if configured (migration window)
    if (NESTLY_PASSWORD && token === NESTLY_PASSWORD) {
      req.nestlyAuth = 'shared_password';
      next();
      return;
    }
    res.status(401).json({
      error: 'Sitzung ungültig oder abgelaufen. Bitte erneut anmelden.',
      code: 'invalid_session',
    });
    return;
  }

  // shared_password mode
  if (token === NESTLY_PASSWORD) {
    req.nestlyAuth = 'shared_password';
    next();
    return;
  }

  res.status(401).json({
    error: 'Nicht autorisiert. Bitte mit Benutzerkonto anmelden oder Kennwort prüfen.',
    code: 'unauthorized',
  });
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (req.nestlyUser?.role === 'admin') {
    next();
    return;
  }
  res.status(403).json({
    error: 'Nur Admins dürfen Haushaltsmitglieder verwalten.',
    code: 'forbidden',
  });
}
