# comdirect CSV-Import

## Export in der comdirect-Banking-Oberfläche

1. Konto wählen (Giro oder Tagesgeld)
2. Umsatzliste als **CSV** exportieren
3. In Nestly unter **Import** Konto wählen, Datei hochladen, Vorschau prüfen, bestätigen

## Erwartetes Format

| Eigenschaft | Wert |
|-------------|------|
| Trenner | Semikolon `;` (Komma wird erkannt, falls keine Semikolons) |
| Encoding | UTF-8 (BOM erlaubt) |
| Dezimal | Komma, z. B. `-86,40` oder `1.234,56` |
| Datum | `TT.MM.JJJJ` |

### Typische Spalten

Erforderlich: **Buchungstag** (oder Buchungsdatum) und **Betrag** (oder „Umsatz in EUR“).

Weitere unterstützte Header (Aliases):

- Wertstellung / Wert
- Umsatzart / Vorgang
- Buchungstext / Verwendungszweck
- Währung / Waehrung
- Beleg / Belegnummer / Referenz / Primanoten-Nr (für stabile Deduplizierung)

Beispiel-Fixtures: `server/fixtures/comdirect-sample.csv`, `server/fixtures/comdirect-tagesgeld-sample.csv`.

## Deduplizierung

Fingerprint = SHA-256 über:

- Bankreferenz + Konto, falls Beleg/Referenz vorhanden, sonst
- Konto + Buchungstag + Betrag (Cent) + normalisierter Buchungstext

Bereits importierte Fingerprints werden übersprungen.

## Interne Umbuchungen Giro ↔ Tagesgeld

Wenn beim Import ein Gegenbetrag (± Betrag) auf dem anderen Konto innerhalb von **±3 Tagen** existiert, wird die neue Buchung als `internal_transfer` mit gemeinsamer `transferGroupId` markiert und die Gegenbuchung ggf. nachgezogen. Sonst: Einnahme/Ausgabe ohne Budget (manuell zuordnen).
