import type { ParsedCsvRow } from '../types.js';

const HEADER_ALIASES: Record<string, keyof ParsedCsvRow | 'skip'> = {
  buchungstag: 'bookingDate',
  buchungsdatum: 'bookingDate',
  wertstellung: 'valueDate',
  wert: 'valueDate',
  umsatzart: 'bookingType',
  vorgang: 'bookingType',
  buchungstext: 'bookingText',
  verwendungszweck: 'bookingText',
  betrag: 'amountCents',
  'umsatz in eur': 'amountCents',
  währung: 'currency',
  waehrung: 'currency',
  referenz: 'bankReference',
  beleg: 'bankReference',
  belegnummer: 'bankReference',
  'primanoten-nr': 'bankReference',
  'primanoten nr': 'bankReference',
};

/**
 * Parse German comdirect CSV exports.
 * Typical: semicolon separator, decimal comma, optional BOM/quotes,
 * columns like Buchungstag;Wertstellung;Umsatzart;Buchungstext;Betrag;…
 */
export function parseComdirectCsv(content: string): ParsedCsvRow[] {
  const text = stripBom(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    throw new Error('CSV enthält keine Datenzeilen.');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCsvLine(lines[0], delimiter).map(normalizeHeader);
  const fieldMap = mapHeaders(headers);

  if (fieldMap.bookingDate === undefined || fieldMap.amountCents === undefined) {
    throw new Error(
      'CSV-Header unvollständig: Buchungstag und Betrag sind erforderlich.',
    );
  }

  const rows: ParsedCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i], delimiter);
    if (cols.every((c) => !c.trim())) {
      continue;
    }

    const bookingDateRaw = cols[fieldMap.bookingDate] ?? '';
    const amountRaw = cols[fieldMap.amountCents!] ?? '';
    if (!bookingDateRaw.trim() || !amountRaw.trim()) {
      continue;
    }

    const bookingDate = parseGermanDate(bookingDateRaw);
    const valueDate = parseGermanDate(
      cols[fieldMap.valueDate ?? fieldMap.bookingDate] ?? bookingDateRaw,
    );
    const bookingType = (cols[fieldMap.bookingType ?? -1] ?? '').trim();
    const bookingText = (cols[fieldMap.bookingText ?? -1] ?? '').trim();
    const amountCents = parseGermanAmount(amountRaw);
    const currency = (cols[fieldMap.currency ?? -1] ?? 'EUR').trim() || 'EUR';
    const bankReference =
      fieldMap.bankReference !== undefined
        ? (cols[fieldMap.bankReference] ?? '').trim() || null
        : null;

    rows.push({
      bookingDate,
      valueDate,
      bookingType,
      bookingText,
      amountCents,
      currency,
      bankReference,
      rawLine: lines[i],
    });
  }

  return rows;
}

export function parseGermanDate(value: string): string {
  const cleaned = value.trim().replace(/^"|"$/g, '');
  // dd.mm.yyyy
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(cleaned);
  if (m) {
    const dd = m[1].padStart(2, '0');
    const mm = m[2].padStart(2, '0');
    return `${m[3]}-${mm}-${dd}`;
  }
  // yyyy-mm-dd already
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  throw new Error(`Ungültiges Datum: ${value}`);
}

/** " -1.234,56 " / "86,40" / "86.40" → cents */
export function parseGermanAmount(value: string): number {
  let raw = value.trim().replace(/^"|"$/g, '').replace(/\s/g, '');
  if (!raw) {
    throw new Error('Leerer Betrag');
  }

  const negative =
    raw.startsWith('-') ||
    (raw.startsWith('(') && raw.endsWith(')')) ||
    raw.endsWith('-');
  raw = raw.replace(/^[-(]+|[)-]+$/g, '');

  // German: thousand '.' decimal ','
  if (raw.includes(',') && raw.includes('.')) {
    raw = raw.replace(/\./g, '').replace(',', '.');
  } else if (raw.includes(',')) {
    raw = raw.replace(',', '.');
  }

  const num = Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error(`Ungültiger Betrag: ${value}`);
  }
  const cents = Math.round(Math.abs(num) * 100);
  return negative ? -cents : cents;
}

function stripBom(content: string): string {
  return content.charCodeAt(0) === 0xfeff ? content.slice(1) : content;
}

function detectDelimiter(headerLine: string): string {
  const semis = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semis >= commas ? ';' : ',';
}

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === delimiter && !inQuotes) {
      result.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  result.push(current);
  return result.map((c) => c.trim());
}

function normalizeHeader(header: string): string {
  return header
    .replace(/^"|"$/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function mapHeaders(
  headers: string[],
): Partial<Record<keyof ParsedCsvRow, number>> {
  const map: Partial<Record<keyof ParsedCsvRow, number>> = {};
  headers.forEach((header, index) => {
    const alias = HEADER_ALIASES[header];
    if (!alias || alias === 'skip') {
      return;
    }
    if (map[alias] === undefined) {
      map[alias] = index;
    }
  });
  return map;
}
