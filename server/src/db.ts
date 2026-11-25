import fs from 'node:fs';
import Database from 'better-sqlite3';
import { DATA_DIR, DB_PATH } from './config.js';
import { seedIfEmpty } from './seed.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) {
    return db;
  }

  fs.mkdirSync(DATA_DIR, { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrate(db);
  seedIfEmpty(db);
  return db;
}

function migrate(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      bank TEXT NOT NULL,
      account_type TEXT NOT NULL,
      current_balance_cents INTEGER NOT NULL,
      balance_date TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      icon TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '#22b2a6',
      target_amount_cents INTEGER,
      archived INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS budget_allocations (
      id TEXT PRIMARY KEY,
      budget_id TEXT NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
      account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
      amount_cents INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(budget_id, account_id)
    );

    CREATE TABLE IF NOT EXISTS import_batches (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL REFERENCES accounts(id),
      filename TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      total_transactions INTEGER NOT NULL,
      new_transactions INTEGER NOT NULL,
      duplicate_transactions INTEGER NOT NULL,
      unassigned_transactions INTEGER NOT NULL,
      internal_transfer_pairs INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      account_id TEXT REFERENCES accounts(id),
      date TEXT NOT NULL,
      amount_cents INTEGER NOT NULL,
      type TEXT NOT NULL,
      budget_id TEXT REFERENCES budgets(id),
      description TEXT NOT NULL DEFAULT '',
      bank_description TEXT NOT NULL DEFAULT '',
      note TEXT NOT NULL DEFAULT '',
      import_fingerprint TEXT,
      transfer_group_id TEXT,
      import_batch_id TEXT REFERENCES import_batches(id),
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_tx_fingerprint
      ON transactions(import_fingerprint)
      WHERE import_fingerprint IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_tx_account_date ON transactions(account_id, date);
    CREATE INDEX IF NOT EXISTS idx_tx_budget ON transactions(budget_id);

    CREATE TABLE IF NOT EXISTS assignment_rules (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      keywords_json TEXT NOT NULL,
      budget_id TEXT REFERENCES budgets(id),
      priority INTEGER NOT NULL DEFAULT 0,
      active INTEGER NOT NULL DEFAULT 1,
      mark_as_internal_transfer INTEGER NOT NULL DEFAULT 0
    );
  `);
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
