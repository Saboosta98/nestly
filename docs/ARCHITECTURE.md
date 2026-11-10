# Architekturentscheidungen

## Trennung der Schichten

1. **UI** (`features/`, `shared/`, `layout/`) – Präsentation, keine Persistenz
2. **Geschäftslogik** (`core/services/finance-calculator.ts`, `finance.service.ts`)
3. **Datenzugriff** (`core/repositories/`) – austauschbar über `HouseholdDataSource`

## Warum Abstract DataSource statt direkter Appwrite-Calls?

Phase 1–2 nutzen Demo-Daten lokal. Später wird `DemoDataSource` durch eine Appwrite-Implementierung ersetzt, ohne Dashboard oder Calculator anzufassen. Binding erfolgt in `app.config.ts`.

## Cent als Integer

Alle Geldbeträge sind `number` in Cent. Anzeige über `centsCurrency`-Pipe (`de-DE`). Vermeidet Floating-Point-Fehler bei Euro-Beträgen.

## Budgetstände vs. Allocations

- **Budgetstand** = Summe der zugeordneten Buchungen (`income`/`expense`/`budget_transfer`/`correction`)
- **Allocations** = physische Verteilung auf Konten, muss zum Budgetstand passen
- Allocations erzeugen **keine** zweite Buchungswahrheit

## Interne Umbuchungen

`type: internal_transfer` + gemeinsames `transferGroupId`. Zählen nicht als Haushalts-Cashflow und ändern keinen Budgetstand.
