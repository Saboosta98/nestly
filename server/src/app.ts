import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import {
  authRequired,
  getAuthMode,
  requireAdmin,
  requireAuth,
  setupRequired,
} from './auth.js';
import { STATIC_DIR } from './config.js';
import * as store from './store.js';
import * as users from './users.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function extractBearer(req: Request): string {
  const header = req.header('authorization') ?? '';
  return header.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() ?? '';
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(requireAuth);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'nestly',
      authRequired: authRequired(),
      setupRequired: setupRequired(),
      authMode: getAuthMode(),
    });
  });

  app.post('/api/auth/setup', (req, res, next) => {
    try {
      if (!setupRequired()) {
        res.status(409).json({
          error: 'Setup ist nicht mehr möglich — Zugang ist bereits konfiguriert.',
        });
        return;
      }
      const body = req.body ?? {};
      const user = users.createUser({
        username: String(body.username ?? ''),
        displayName: String(body.displayName ?? body.username ?? ''),
        password: String(body.password ?? ''),
        role: 'admin',
      });
      const session = users.authenticate(user.username, String(body.password));
      if (!session) {
        res.status(500).json({ error: 'Setup fehlgeschlagen.' });
        return;
      }
      res.status(201).json({
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    try {
      if (users.countUsers() === 0) {
        res.status(400).json({
          error: 'Noch kein Benutzer angelegt. Bitte zuerst den Admin einrichten.',
          code: 'setup_required',
        });
        return;
      }
      const body = req.body ?? {};
      const session = users.authenticate(
        String(body.username ?? ''),
        String(body.password ?? ''),
      );
      if (!session) {
        res.status(401).json({ error: 'Benutzername oder Passwort ungültig.' });
        return;
      }
      res.json({
        user: session.user,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    users.revokeSession(extractBearer(req));
    res.status(204).end();
  });

  app.get('/api/auth/me', (req, res) => {
    if (req.nestlyUser) {
      res.json({ user: req.nestlyUser, auth: 'session' });
      return;
    }
    if (req.nestlyAuth === 'shared_password') {
      res.json({
        user: {
          id: 'shared',
          username: 'haushalt',
          displayName: 'Haushalt',
          role: 'admin',
          createdAt: '',
        },
        auth: 'shared_password',
      });
      return;
    }
    res.status(401).json({ error: 'Nicht angemeldet.' });
  });

  app.get('/api/users', requireAdmin, (_req, res) => {
    res.json(users.listUsers());
  });

  app.post('/api/users', requireAdmin, (req, res, next) => {
    try {
      const body = req.body ?? {};
      const role = body.role === 'admin' ? 'admin' : 'member';
      const user = users.createUser({
        username: String(body.username ?? ''),
        displayName: String(body.displayName ?? body.username ?? ''),
        password: String(body.password ?? ''),
        role,
      });
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/users/:id', requireAdmin, (req, res, next) => {
    try {
      const actingId = req.nestlyUser?.id;
      if (!actingId) {
        res.status(403).json({
          error: 'Mitgliederverwaltung braucht ein Benutzerkonto (kein Shared-Passwort).',
        });
        return;
      }
      users.deleteUser(req.params.id, actingId);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/accounts', (_req, res) => {
    res.json(store.listAccounts());
  });

  app.patch('/api/accounts/:id', (req, res, next) => {
    try {
      res.json(store.updateAccount(req.params.id, req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/accounts/:id/balance-correction', (req, res, next) => {
    try {
      const { newBalanceCents, date, note } = req.body ?? {};
      res.json(
        store.createBalanceCorrection({
          accountId: req.params.id,
          newBalanceCents: Number(newBalanceCents),
          date: String(date ?? new Date().toISOString().slice(0, 10)),
          note: note ? String(note) : undefined,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/budgets', (_req, res) => {
    res.json(store.listBudgets());
  });

  app.post('/api/budgets', (req, res, next) => {
    try {
      res.status(201).json(store.createBudget(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/budgets/:id', (req, res, next) => {
    try {
      res.json(store.updateBudget(req.params.id, req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/allocations', (_req, res) => {
    res.json(store.listAllocations());
  });

  app.put('/api/allocations', (req, res, next) => {
    try {
      res.json(store.upsertAllocation(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/allocations/:id', (req, res, next) => {
    try {
      store.deleteAllocation(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/transactions', (_req, res) => {
    res.json(store.listTransactions());
  });

  app.post('/api/transactions', (req, res, next) => {
    try {
      res.status(201).json(store.createTransaction(req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/transactions/:id', (req, res, next) => {
    try {
      res.json(store.updateTransaction(req.params.id, req.body ?? {}));
    } catch (err) {
      next(err);
    }
  });

  app.delete('/api/transactions/:id', (req, res, next) => {
    try {
      store.deleteTransaction(req.params.id);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/transfers', (req, res, next) => {
    try {
      const body = req.body ?? {};
      res.status(201).json(
        store.createAccountTransfer({
          fromAccountId: String(body.fromAccountId),
          toAccountId: String(body.toAccountId),
          amountCents: Number(body.amountCents),
          date: String(body.date),
          description: body.description ? String(body.description) : undefined,
          note: body.note ? String(body.note) : undefined,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/rules', (_req, res) => {
    res.json(store.listRules());
  });

  app.get('/api/imports', (_req, res) => {
    res.json(store.listImports());
  });

  app.post(
    '/api/imports/preview',
    upload.single('file'),
    (req, res, next) => {
      try {
        const accountId = String(req.body.accountId ?? '');
        const file = req.file;
        if (!accountId || !file) {
          res.status(400).json({ error: 'accountId und file sind erforderlich' });
          return;
        }
        const csvContent = file.buffer.toString('utf8');
        res.json(
          store.previewImport({
            accountId,
            filename: file.originalname || 'import.csv',
            csvContent,
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  app.post(
    '/api/imports/confirm',
    upload.single('file'),
    (req, res, next) => {
      try {
        const accountId = String(req.body.accountId ?? '');
        const file = req.file;
        if (!accountId || !file) {
          res.status(400).json({ error: 'accountId und file sind erforderlich' });
          return;
        }
        const csvContent = file.buffer.toString('utf8');
        const newBalanceRaw = req.body.newBalanceCents;
        const newBalanceCents =
          newBalanceRaw === undefined || newBalanceRaw === '' || newBalanceRaw === null
            ? null
            : Number(newBalanceRaw);
        res.status(201).json(
          store.confirmImport({
            accountId,
            filename: file.originalname || 'import.csv',
            csvContent,
            newBalanceCents,
            balanceDate: req.body.balanceDate
              ? String(req.body.balanceDate)
              : null,
          }),
        );
      } catch (err) {
        next(err);
      }
    },
  );

  // Also accept JSON body with csvContent for tests / tooling
  app.post('/api/imports/preview-json', (req, res, next) => {
    try {
      res.json(
        store.previewImport({
          accountId: String(req.body.accountId),
          filename: String(req.body.filename ?? 'import.csv'),
          csvContent: String(req.body.csvContent ?? ''),
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/imports/confirm-json', (req, res, next) => {
    try {
      res.status(201).json(
        store.confirmImport({
          accountId: String(req.body.accountId),
          filename: String(req.body.filename ?? 'import.csv'),
          csvContent: String(req.body.csvContent ?? ''),
          newBalanceCents:
            req.body.newBalanceCents === undefined || req.body.newBalanceCents === null
              ? null
              : Number(req.body.newBalanceCents),
          balanceDate: req.body.balanceDate ?? null,
        }),
      );
    } catch (err) {
      next(err);
    }
  });

  if (fs.existsSync(STATIC_DIR)) {
    app.use(express.static(STATIC_DIR, { index: false }));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) {
        next();
        return;
      }
      res.sendFile(path.join(STATIC_DIR, 'index.html'), (err) => {
        if (err) {
          next();
        }
      });
    });
  }

  app.use(
    (
      err: Error & { status?: number },
      _req: Request,
      res: Response,
      _next: NextFunction,
    ) => {
      const status = err.status ?? 500;
      res.status(status).json({
        error: err.message || 'Interner Serverfehler',
      });
    },
  );

  return app;
}
