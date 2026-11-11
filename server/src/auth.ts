import type { NextFunction, Request, Response } from 'express';
import { NESTLY_PASSWORD } from './config.js';

export function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (!NESTLY_PASSWORD) {
    next();
    return;
  }

  // Only protect API. Static SPA assets stay public; UI prompts for password.
  if (!req.path.startsWith('/api')) {
    next();
    return;
  }

  if (req.path === '/api/health') {
    next();
    return;
  }

  const header = req.header('authorization') ?? '';
  const bearer = header.match(/^Bearer\s+(.+)$/i)?.[1];
  const queryToken =
    typeof req.query.token === 'string' ? req.query.token : undefined;
  const token = bearer ?? queryToken ?? '';

  if (token === NESTLY_PASSWORD) {
    next();
    return;
  }

  res.status(401).json({
    error: 'Nicht autorisiert. Bitte Kennwort setzen (NESTLY_PASSWORD).',
  });
}
