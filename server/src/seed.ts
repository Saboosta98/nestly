import type Database from 'better-sqlite3';
import { v4 as uuid } from 'uuid';

const DEFAULT_COLORS = [
  '#22b2a6',
  '#5b8def',
  '#9b7bff',
  '#e94591',
  '#3dd68c',
  '#f5b942',
];

/** Seed Giro + Tagesgeld and empty starter budgets when DB is fresh. */
export function seedIfEmpty(db: Database.Database): void {
  const accountCount = db.prepare('SELECT COUNT(*) AS c FROM accounts').get() as {
    c: number;
  };
  if (accountCount.c > 0) {
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const insertAccount = db.prepare(`
    INSERT INTO accounts (
      id, name, bank, account_type, current_balance_cents, balance_date, active
    ) VALUES (?, ?, ?, ?, ?, ?, 1)
  `);

  insertAccount.run('acc-giro', 'Girokonto', 'comdirect', 'checking', 0, today);
  insertAccount.run(
    'acc-tagesgeld',
    'Tagesgeldkonto',
    'comdirect',
    'savings',
    0,
    today,
  );

  const insertBudget = db.prepare(`
    INSERT INTO budgets (
      id, name, description, icon, color, target_amount_cents, archived, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 0, ?)
  `);

  const starters: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    target: number | null;
  }> = [
    {
      id: 'bud-urlaub',
      name: 'Urlaub',
      description: 'Sommerreise und Kurztrips',
      icon: '✈️',
      color: DEFAULT_COLORS[0],
      target: 400_000,
    },
    {
      id: 'bud-auto',
      name: 'Auto',
      description: 'Wartung, Reifen, Rücklage',
      icon: '🚗',
      color: DEFAULT_COLORS[1],
      target: 250_000,
    },
    {
      id: 'bud-versicherungen',
      name: 'Versicherungen',
      description: 'Jahresbeiträge und Policen',
      icon: '🛡️',
      color: DEFAULT_COLORS[2],
      target: 180_000,
    },
    {
      id: 'bud-weihnachten',
      name: 'Weihnachten',
      description: 'Geschenke und Feiertage',
      icon: '🎄',
      color: DEFAULT_COLORS[3],
      target: 80_000,
    },
    {
      id: 'bud-haus',
      name: 'Haus und Garten',
      description: 'Instandhaltung und Projekte',
      icon: '🏡',
      color: DEFAULT_COLORS[4],
      target: 300_000,
    },
    {
      id: 'bud-reparaturen',
      name: 'Reparaturen',
      description: 'Ungeplante Reparaturen',
      icon: '🔧',
      color: DEFAULT_COLORS[5],
      target: 150_000,
    },
    {
      id: 'bud-ruecklagen',
      name: 'Rücklagen',
      description: 'Allgemeiner Notgroschen',
      icon: '💰',
      color: DEFAULT_COLORS[0],
      target: 500_000,
    },
    {
      id: 'bud-geschenke',
      name: 'Geschenke',
      description: 'Geburtstage und Anlässe',
      icon: '🎁',
      color: DEFAULT_COLORS[3],
      target: 60_000,
    },
  ];

  for (const b of starters) {
    insertBudget.run(
      b.id,
      b.name,
      b.description,
      b.icon,
      b.color,
      b.target,
      now,
    );
  }

  const insertRule = db.prepare(`
    INSERT INTO assignment_rules (
      id, name, keywords_json, budget_id, priority, active, mark_as_internal_transfer
    ) VALUES (?, ?, ?, ?, ?, 1, ?)
  `);

  insertRule.run(
    uuid(),
    'Interne Umbuchung',
    JSON.stringify(['tagesgeld', 'uebertrag', 'übertrag', 'girokonto']),
    null,
    20,
    1,
  );
  insertRule.run(
    uuid(),
    'Zinsen → Rücklagen',
    JSON.stringify(['zinsabschluss', 'zinsgutschrift', 'zinsen']),
    'bud-ruecklagen',
    15,
    0,
  );
}
