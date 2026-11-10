# Haushalt Budget

Moderne Web-App zur Verwaltung gemeinsamer Haushaltsfinanzen mit realen Bankkonten und virtuellen Budgets.

## Konzept

- **Bankkonten** halten das tatsächliche Geld (Girokonto + Tagesgeldkonto bei comdirect).
- **Budgets** sind virtuelle Töpfe (Urlaub, Auto, Rücklagen, …) ohne feste Kontobindung.
- **BudgetAllocations** beschreiben optional, wie viel eines Budgets physisch auf welchem Konto liegt.
- Interne Umbuchungen zwischen Konten sind **keine** Einnahmen/Ausgaben.
- Abstimmung: `Gesamtguthaben = Summe Budgets + nicht zugeordnetes Guthaben`.

Geldbeträge werden intern ausschließlich als **Integer in Cent** gespeichert.

## Aktueller Stand (Phase 1–2)

- Angular 19, TypeScript, SCSS, Standalone Components, Routing
- Designsystem (Farben, Typografie, Motion)
- Dashboard mit Konten-, Budget- und Buchungsübersicht
- Funktionierende Berechnungen auf Demo-Daten
- Architektur vorbereitet für späteren Appwrite-Datenzugriff (`HouseholdDataSource`)
- PWA-Grundlage (Manifest, Icons, Mobile-First)

Noch nicht umgesetzt (geplante Phasen): Appwrite Auth/DB, CSV-Import comdirect, Docker/nginx-Produktion.

## Lokal starten

```bash
npm install
npm start
```

Die App läuft unter [http://localhost:4317](http://localhost:4317).

Weitere Skripte:

```bash
npm run build    # Produktionsbuild
npm test         # Unit-Tests (Karma/Jasmine)
```

## Architektur

```
src/app/
  core/
    models/           # Domain-Typen
    repositories/     # Abstract DataSource + Demo-Implementierung
    services/         # Geschäftslogik (FinanceCalculator, FinanceService)
  features/           # Seiten (Dashboard, Konten, Budgets, Buchungen)
  shared/             # UI-Bausteine & Pipes
  layout/             # App-Shell / Navigation
```

`FinanceService` orchestriert Daten + Berechnung. UI kennt keine Persistenzdetails. Später reicht ein Tausch von `DemoDataSource` → `AppwriteDataSource` in `app.config.ts`.

## Demo-Daten (Auszug)

| Konto           | Stand      |
|-----------------|------------|
| Girokonto       | 3.200,00 € |
| Tagesgeldkonto  | 12.000,00 € |
| **Gesamt**      | **15.200,00 €** |

Budgets summieren sich auf 14.000,00 € → nicht zugeordnet 1.200,00 €.

Beispiel Urlaub (3.000 €): 2.500 € auf Tagesgeld + 500 € auf Giro.

## Designentscheidungen

- Eigenständiges dunkles Finanz-UI mit Teal (`#22b2a6`) und Magenta (`#e94591`) auf `#0c1927`
- Schriften: **Sora** (Display) + **DM Sans** (Text)
- Mobile First mit iPhone-safe-area und Bottom-Navigation
- Keine zweite „Buchungswahrheit“: Budgetstände kommen nur aus Transaktionen

## Nächste Schritte

1. Phase 3: Schreibende Geschäftslogik (Anlegen, Umbuchen, Korrigieren)
2. Phase 4: Appwrite (Database, Auth, Permissions)
3. Phase 5: comdirect CSV-Import inkl. Duplikat- und Umbuchungserkennung
4. Phase 6–7: Tests ausbauen, Docker + nginx Deployment
