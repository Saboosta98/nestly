# Changelog

## 1.0.0 – Self-hosted Persistenz & comdirect-Import

- Express-API + SQLite (`DATA_DIR`) für Accounts, Budgets, Allocations, Transactions, Imports
- Angular `HttpDataSource` ersetzt Demo-Pfad als Default; Demo weiter per `--configuration=demo`
- Schreibende UI: Budgets anlegen/bearbeiten, Buchungen zuordnen, Umbuchungen, Saldenkorrektur
- comdirect-CSV-Import inkl. Deduplizierung, Giro↔Tagesgeld-Erkennung, Import-Historie
- Docker + Compose; optional `NESTLY_PASSWORD` für API-Schutz
- Server-Unit-Tests für CSV-Parser/Fingerprint/Transfer-Erkennung

## 0.1.0 – Phase 1 & 2

- Angular-19-Projekt mit Standalone Components, Routing und SCSS-Designsystem
- Domain-Modelle für Accounts, Budgets, Transactions, Allocations, Rules, Imports
- `HouseholdDataSource`-Abstraktion mit Demo-Implementierung
- Geschäftslogik: Budgetstände aus Buchungen, Unassigned-Berechnung, Abstimmung
- Dashboard, Konten-, Budget- und Buchungsseiten mit realistischen Demo-Daten
- PWA-Manifest und Mobile-First-Shell mit Bottom-Navigation
