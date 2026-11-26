# Nestly (Haushalt Budget)

Self-hosted Web-App für gemeinsame Haushaltsfinanzen: reale comdirect-Konten, virtuelle Budgets, CSV-Import — geschützt durch Anmeldung.

## Konzept

- **Bankkonten** halten das tatsächliche Geld (Giro + Tagesgeld bei comdirect).
- **Budgets** sind virtuelle Töpfe ohne feste Kontobindung.
- Interne Umbuchungen zwischen Konten sind **keine** Einnahmen/Ausgaben.
- Abstimmung: `Gesamtguthaben = Summe Budgets + nicht zugeordnetes Guthaben`.
- Beträge intern als **Integer in Cent**.
- **Zugang:** nur angemeldete Haushaltsmitglieder (Benutzername + Passwort). Admins verwalten Personen unter **Zugang**.

## Stack

| Teil | Technik |
|------|---------|
| UI | Angular 19 SPA |
| API | Express + SQLite (`better-sqlite3`) |
| Auth | scrypt-Passwörter + Session-Token (Bearer) |
| Deploy | Docker Compose hinter nginx/Caddy |

## Lokal entwickeln

```bash
npm install          # installiert auch server/
npm run start:api    # API http://127.0.0.1:4318
npm start            # Angular http://localhost:4317 (Proxy /api → 4318)
```

Oder parallel: `npm run dev`.

Beim ersten Start ohne Benutzer: Setup-Screen in der UI **oder** Env setzen:

```bash
export NESTLY_ADMIN_USER=timo
export NESTLY_ADMIN_PASSWORD='dein-sicheres-passwort'
npm run start:api
```

Optional nur Demo-Daten (ohne API, ohne Auth):

```bash
npm run start:demo
```

Tests:

```bash
npm run test:server  # CSV + Passwort-Hashing
npm test             # Angular (Karma headless)
npm run build        # Produktionsbuild → dist/household-budget/browser
```

## Produktion mit Docker

```bash
cat > .env <<'EOF'
NESTLY_ADMIN_USER=timo
NESTLY_ADMIN_PASSWORD=dein-sicheres-passwort
EOF

docker compose up -d --build
```

- App/API: `http://127.0.0.1:4318`
- Persistenz: Volume `nestly-data` → `/data/nestly.sqlite`
- Env: `DATA_DIR`, `NESTLY_ADMIN_USER`, `NESTLY_ADMIN_PASSWORD`, optional `NESTLY_PASSWORD` (Legacy), `PORT`, `STATIC_DIR`

Die API ist ohne Anmeldung gesperrt. Beim ersten Start: Admin-Env setzen **oder** den Setup-Screen einmal durchlaufen. Weitere Personen danach in der App unter **Zugang**.

### Reverse-Proxy (nestly.inthecorner.de)

nginx:

```nginx
server {
  server_name nestly.inthecorner.de;
  # ssl … wie üblich

  location / {
    proxy_pass http://127.0.0.1:4318;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 10m;
  }
}
```

Caddy:

```caddy
nestly.inthecorner.de {
  reverse_proxy 127.0.0.1:4318
}
```

Der Node-Prozess liefert SPA + `/api` aus einem Port; SPA-Fallback ist eingebaut.

## CSV-Import (comdirect)

Siehe [docs/CSV-IMPORT.md](docs/CSV-IMPORT.md). Fixtures: `server/fixtures/`.

## Architektur

```
src/app/          Angular UI + HttpDataSource + Login/Zugang
server/           Express API + SQLite + Auth + CSV-Logik
docs/             Architektur & CSV-Format
```

`FinanceService` orchestriert Daten + Berechnung. UI kennt keine Persistenzdetails.

## Seed

Frische DB enthält **Girokonto** und **Tagesgeldkonto** (Saldo 0) sowie leere Starter-Budgets. Kontostände per Saldenkorrektur oder optional beim CSV-Import setzen.
