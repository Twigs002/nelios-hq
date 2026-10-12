// Follow-up engine. Pure, timezone-safe calendar-date math on "YYYY-MM-DD"
// strings. The seller CODE drives the cadence; a computed due date never lands
// on a weekend or a SA public holiday (it rolls forward to the next working
// day). Nelio can always override the date manually afterwards.

import { CODE_BY_ID, type CodeId } from "./codes";
import { isPublicHoliday } from "@/config/sa-holidays";
import { TIMEZONE } from "./format";

/** Cadence overrides come from Settings (app_settings). Falls back to the code default. */
export type CadenceMap = Partial<Record<CodeId, number>>;

/** Interval in days for a code, preferring a Settings override. */
export function cadenceDays(code: CodeId, overrides?: CadenceMap): number {
  return overrides?.[code] ?? CODE_BY_ID[code]?.days ?? 30;
}

/** Normalise any date-ish value to a "YYYY-MM-DD" civil-date string. */
export function toDateStr(input: Date | string): string {
  if (typeof input === "string") return input.slice(0, 10);
  const y = input.getUTCFullYear();
  const m = String(input.getUTCMonth() + 1).padStart(2, "0");
  const d = String(input.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Add n calendar days. Uses UTC noon so DST never shifts the day. */
export function addDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + n);
  return toDateStr(dt);
}

/** Day of week, 0 = Sunday .. 6 = Saturday. */
export function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay();
}

export function isWeekend(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr);
  return dow === 0 || dow === 6;
}

export function isWorkingDay(dateStr: string): boolean {
  return !isWeekend(dateStr) && !isPublicHoliday(dateStr);
}

/** Roll forward to the next working day if the date is a weekend or holiday. */
export function nextWorkingDay(dateStr: string): string {
  let d = dateStr.slice(0, 10);
  // Bounded loop: at most a week of weekend + clustered holidays.
  for (let i = 0; i < 31 && !isWorkingDay(d); i++) {
    d = addDays(d, 1);
  }
  return d;
}

/**
 * Compute the next follow-up date for a code, measured from `fromDate`
 * (usually today or the last-contact date), then nudged off weekends/holidays.
 */
export function computeNextFollowUp(
  code: CodeId,
  fromDate: Date | string,
  overrides?: CadenceMap,
): string {
  const base = addDays(toDateStr(fromDate), cadenceDays(code, overrides));
  return nextWorkingDay(base);
}

export type DueState = "overdue" | "today" | "upcoming";

/** Classify a due date relative to `today` (both civil dates). */
export function dueState(nextFollowUp: string, today: string): DueState {
  const n = nextFollowUp.slice(0, 10);
  const t = today.slice(0, 10);
  if (n < t) return "overdue";
  if (n === t) return "today";
  return "upcoming";
}

/** Whole-day difference next - today (negative = overdue). */
export function daysUntil(nextFollowUp: string, today: string): number {
  const a = Date.parse(nextFollowUp.slice(0, 10) + "T12:00:00Z");
  const b = Date.parse(today.slice(0, 10) + "T12:00:00Z");
  return Math.round((a - b) / 86400000);
}

/** Today's civil date in Africa/Johannesburg as "YYYY-MM-DD". */
export function todayInJohannesburg(now: Date = new Date()): string {
  // en-CA gives YYYY-MM-DD; timeZone pins it to SAST regardless of host TZ.
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(now);
}
