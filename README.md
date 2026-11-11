# Nestly (Haushalt Budget)

Self-hosted Web-App für gemeinsame Haushaltsfinanzen: reale comdirect-Konten, virtuelle Budgets, CSV-Import.

## Konzept

- **Bankkonten** halten das tatsächliche Geld (Giro + Tagesgeld bei comdirect).
- **Budgets** sind virtuelle Töpfe ohne feste Kontobindung.
- Interne Umbuchungen zwischen Konten sind **keine** Einnahmen/Ausgaben.
- Abstimmung: `Gesamtguthaben = Summe Budgets + nicht zugeordnetes Guthaben`.
- Beträge intern als **Integer in Cent**.

## Stack

| Teil | Technik |
|------|---------|
| UI | Angular 19 SPA |
| API | Express + SQLite (`better-sqlite3`) |
| Deploy | Docker Compose hinter nginx/Caddy |

## Lokal entwickeln

```bash
npm install          # installiert auch server/
npm run start:api    # API http://127.0.0.1:4318
npm start            # Angular http://localhost:4317 (Proxy /api → 4318)
```

Oder parallel: `npm run dev`.

Optional nur Demo-Daten (ohne API):

```bash
npm run start:demo
```

Tests:

```bash
npm run test:server  # CSV-Parser, Dedup, Transfer-Erkennung
npm test             # Angular (Karma headless)
npm run build        # Produktionsbuild → dist/household-budget/browser
```

## Produktion mit Docker

```bash
# optional: echo 'NESTLY_PASSWORD=geheim' > .env
docker compose up -d --build
```

- App/API: `http://127.0.0.1:4318`
- Persistenz: Volume `nestly-data` → `/data/nestly.sqlite`
- Env: `DATA_DIR`, `NESTLY_PASSWORD` (optional), `PORT`, `STATIC_DIR`

Ohne Kennwort ist die API im LAN offen – hinter dem öffentlichen Proxy besser `NESTLY_PASSWORD` setzen.

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
src/app/          Angular UI + HttpDataSource
server/           Express API + SQLite + CSV-Logik
docs/             Architektur & CSV-Format
```

`FinanceService` orchestriert Daten + Berechnung. UI kennt keine Persistenzdetails.

## Seed

Frische DB enthält **Girokonto** und **Tagesgeldkonto** (Saldo 0) sowie leere Starter-Budgets. Kontostände per Saldenkorrektur oder optional beim CSV-Import setzen.
