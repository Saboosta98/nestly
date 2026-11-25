import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { optionalAuth } from './auth.js';
import { NESTLY_PASSWORD, STATIC_DIR } from './config.js';
import * as store from './store.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.use(optionalAuth);

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      authRequired: Boolean(NESTLY_PASSWORD),
      service: 'nestly',
    });
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
