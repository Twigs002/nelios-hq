// Pure CSV parser for pasted comparable sales. No server/db imports so it can
// be unit-tested in isolation (tests/comps-csv.test.ts). The server action
// importCompsCsv in app/actions/comps.ts wraps this and does the inserts.

export type CompStatus = "Sold" | "Pending transfer";

export interface ParsedComp {
  address: string;
  saleDate: string | null; // "YYYY-MM-DD" or null when absent
  price: number | null;
  sizeM2: number | null;
  status: CompStatus;
}

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Parse a single CSV line into fields, honouring double-quoted cells. */
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((c) => c.trim());
}

/** Digits only, as an int. Strips "R", spaces, "m²", commas. null if none. */
export function toInt(raw: string | undefined | null): number | null {
  if (!raw) return null;
  const digits = raw.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = parseInt(digits, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a date cell to "YYYY-MM-DD". Accepts YYYY-MM-DD / YYYY/MM/DD and
 * "DD Mon YYYY" (e.g. "12 Oct 2026", "3 October 2025"). Returns null when the
 * cell is empty, and `false` when it is present but unparseable (caller skips).
 */
function parseDate(raw: string | undefined): string | null | false {
  const s = (raw ?? "").trim();
  if (!s) return null;

  const iso = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const mm = Number(m);
    const dd = Number(d);
    if (mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31) {
      return `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
    return false;
  }

  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{4})$/);
  if (dmy) {
    const [, d, mon, y] = dmy;
    const mm = MONTHS[mon.slice(0, 3).toLowerCase()];
    const dd = Number(d);
    if (mm && dd >= 1 && dd <= 31) {
      return `${y}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
    }
    return false;
  }

  return false;
}

function status(raw: string | undefined): CompStatus {
  return /pending/i.test(raw ?? "") ? "Pending transfer" : "Sold";
}

interface ColMap {
  address: number;
  date: number;
  price: number;
  size: number;
  status: number;
}

/** Detect a header row and return a column map, or null if the first row is data. */
function detectHeader(cells: string[]): ColMap | null {
  const low = cells.map((c) => c.toLowerCase());
  const find = (re: RegExp) => low.findIndex((c) => re.test(c));
  const address = find(/address|street/);
  const date = find(/sold|date/);
  const price = find(/price|amount/);
  const size = find(/size|m2|m²|sqm/);
  const statusIdx = find(/status/);
  // A header needs an address column plus one more recognised column (date,
  // price, size OR status - a plain "Address,Status" header still counts).
  if (address === -1) return null;
  const hits = [date, price, size, statusIdx].filter((i) => i !== -1).length;
  if (hits === 0) return null;
  return { address, date, price, size, status: statusIdx };
}

/**
 * Parse pasted CSV text into comparable-sale rows. A row needs a non-empty
 * address to be kept; rows whose date cell is present but unparseable are
 * skipped. With no header, columns are positional: address, sold date, price,
 * size, status.
 */
export interface CsvResult {
  comps: ParsedComp[];
  skipped: number; // data rows that could not be parsed (header excluded)
}

export function parseCompsCsvResult(csv: string): CsvResult {
  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return { comps: [], skipped: 0 };

  const rows = lines.map(splitLine);
  const map = detectHeader(rows[0]);
  const dataRows = map ? rows.slice(1) : rows;
  const cols: ColMap = map ?? { address: 0, date: 1, price: 2, size: 3, status: 4 };

  const out: ParsedComp[] = [];
  for (const r of dataRows) {
    const address = (r[cols.address] ?? "").trim();
    if (!address) continue;
    const date = parseDate(r[cols.date]);
    if (date === false) continue; // present but unparseable
    out.push({
      address,
      saleDate: date,
      price: toInt(r[cols.price]),
      sizeM2: toInt(r[cols.size]),
      status: status(cols.status === -1 ? undefined : r[cols.status]),
    });
  }
  return { comps: out, skipped: dataRows.length - out.length };
}

export function parseCompsCsv(csv: string): ParsedComp[] {
  return parseCompsCsvResult(csv).comps;
}
