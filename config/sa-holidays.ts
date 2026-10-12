// South African public holidays for 2026 and 2027, as calendar-date strings
// "YYYY-MM-DD" (Africa/Johannesburg civil dates). Includes Easter-derived dates
// and the Public Holidays Act Sunday->Monday observed rule (a holiday that falls
// on a Sunday is observed the following Monday; Saturdays are not moved).
//
// Used by the follow-up engine (never land a due date on a holiday) and the
// morning digest (skip holidays). Extend this list as new years are confirmed.

export interface Holiday {
  date: string; // YYYY-MM-DD
  name: string;
}

export const SA_HOLIDAYS: Holiday[] = [
  // 2026
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-03-21", name: "Human Rights Day" },
  { date: "2026-04-03", name: "Good Friday" },
  { date: "2026-04-06", name: "Family Day" },
  { date: "2026-04-27", name: "Freedom Day" },
  { date: "2026-05-01", name: "Workers' Day" },
  { date: "2026-06-16", name: "Youth Day" },
  { date: "2026-08-09", name: "National Women's Day" },
  { date: "2026-08-10", name: "National Women's Day (observed)" },
  { date: "2026-09-24", name: "Heritage Day" },
  { date: "2026-12-16", name: "Day of Reconciliation" },
  { date: "2026-12-25", name: "Christmas Day" },
  { date: "2026-12-26", name: "Day of Goodwill" },
  // 2027
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-03-21", name: "Human Rights Day" },
  { date: "2027-03-22", name: "Human Rights Day (observed)" },
  { date: "2027-03-26", name: "Good Friday" },
  { date: "2027-03-29", name: "Family Day" },
  { date: "2027-04-27", name: "Freedom Day" },
  { date: "2027-05-01", name: "Workers' Day" },
  { date: "2027-06-16", name: "Youth Day" },
  { date: "2027-08-09", name: "National Women's Day" },
  { date: "2027-09-24", name: "Heritage Day" },
  { date: "2027-12-16", name: "Day of Reconciliation" },
  { date: "2027-12-25", name: "Christmas Day" },
  { date: "2027-12-26", name: "Day of Goodwill" },
  { date: "2027-12-27", name: "Day of Goodwill (observed)" },
];

export const SA_HOLIDAY_SET = new Set(SA_HOLIDAYS.map((h) => h.date));

/** True if the given "YYYY-MM-DD" date is a SA public holiday. */
export function isPublicHoliday(dateStr: string): boolean {
  return SA_HOLIDAY_SET.has(dateStr.slice(0, 10));
}

/** Name of the holiday on that date, or undefined. */
export function holidayName(dateStr: string): string | undefined {
  return SA_HOLIDAYS.find((h) => h.date === dateStr.slice(0, 10))?.name;
}
