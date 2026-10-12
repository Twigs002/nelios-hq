// Formatting helpers - en-ZA, Africa/Johannesburg. Ported from the design's
// sample-data.js. Rand uses non-breaking spaces and is never abbreviated.
// Dates are treated as calendar dates (no timezone drift): a "YYYY-MM-DD"
// string or a Date is read by its civil parts.

const NB = " ";
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TIMEZONE = "Africa/Johannesburg";

/** Rand, en-ZA, non-breaking spaces: `R 5 200 000`. Never abbreviated. */
export function rand(n: number): string {
  return "R" + NB + String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, NB);
}

/** A value band, hyphen-separated (no en dash): `R 8 100 000 - R 8 900 000`. */
export function valueRange(low: number, high: number): string {
  return rand(low) + " - " + rand(high);
}

type DateInput = Date | string;

/** Civil (y, m, d) parts of a date-only value, timezone-free. */
function parts(input: DateInput): { y: number; m: number; d: number; dow: number } {
  if (typeof input === "string") {
    const [y, m, d] = input.slice(0, 10).split("-").map(Number);
    // Noon UTC avoids any DST/offset rollover when we only need the weekday.
    const dow = new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
    return { y, m, d, dow };
  }
  return { y: input.getFullYear(), m: input.getMonth() + 1, d: input.getDate(), dow: input.getDay() };
}

/** `12 Oct 2026`. */
export function formatDate(input: DateInput): string {
  const { y, m, d } = parts(input);
  return d + NB + MON[m - 1] + NB + y;
}

/** `12 Oct` - for dense rows. */
export function formatDateShort(input: DateInput): string {
  const { m, d } = parts(input);
  return d + NB + MON[m - 1];
}

/** `Monday, 12 Oct 2026`. */
export function formatDayLabel(input: DateInput): string {
  const { dow } = parts(input);
  return DAY[dow] + ", " + formatDate(input);
}

/** Store cell numbers as E.164 (+27…). Accepts 0XX…, 27XX…, +27XX…. */
export function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, "").replace(/^0/, "27");
  return "+" + digits;
}

/** Display a stored E.164 ZA number as `+27 82 123 4567`. */
export function formatPhone(raw: string): string {
  const s = raw.replace(/\D/g, "").replace(/^0/, "27");
  return "+" + s.slice(0, 2) + " " + s.slice(2, 4) + " " + s.slice(4, 7) + " " + s.slice(7);
}

/** First name from a full name, for "WhatsApp {first}". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

/** `m²` with a non-breaking space. */
export function sqm(n: number | null | undefined): string {
  return n == null ? "-" : n + NB + "m²";
}
