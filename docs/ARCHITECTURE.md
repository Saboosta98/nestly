# Architekturentscheidungen

## Trennung der Schichten

1. **UI** (`features/`, `shared/`, `layout/`) – Präsentation, keine Persistenz
2. **Geschäftslogik** (`core/services/finance-calculator.ts`, `finance.service.ts`)
3. **Datenzugriff** (`core/repositories/`) – austauschbar über `HouseholdDataSource`

## Persistenz (v1 self-hosted)

- **Node/Express API** unter `server/` mit **SQLite** (`better-sqlite3`)
- Datenverzeichnis: Env `DATA_DIR` (Datei `nestly.sqlite`)
- Angular spricht über `HttpDataSource` mit `/api/*`
- Optional: `DemoDataSource` via `ng serve --configuration=demo` (Tests / Offline)
- Die Abstract-DataSource bleibt die Nahtstelle für spätere Backends (z. B. Appwrite), Appwrite ist für v1 **nicht** erforderlich

Binding in `app.config.ts` anhand `environment.useDemo`.

## Cent als Integer

Alle Geldbeträge sind `number` in Cent. Anzeige über `centsCurrency`-Pipe (`de-DE`). Vermeidet Floating-Point-Fehler bei Euro-Beträgen.

## Budgetstände vs. Allocations

- **Budgetstand** = Summe der zugeordneten Buchungen (`income`/`expense`/`budget_transfer`/`correction`)
- **Allocations** = physische Verteilung auf Konten, muss zum Budgetstand passen
- Allocations erzeugen **keine** zweite Buchungswahrheit

## Interne Umbuchungen

`type: internal_transfer` + gemeinsames `transferGroupId`. Zählen nicht als Haushalts-Cashflow und ändern keinen Budgetstand.

## Deployment

Ein Container liefert API + Angular-Build (`STATIC_DIR`). Reverse-Proxy (nginx/Caddy) terminiert TLS für `nestly.inthecorner.de` und leitet auf den Container-Port weiter. Siehe README und `docs/` / Projekt-Deploy-Notiz.
