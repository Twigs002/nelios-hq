import { describe, it, expect } from "vitest";
import {
  cadenceDays,
  toDateStr,
  addDays,
  dayOfWeek,
  isWeekend,
  isWorkingDay,
  nextWorkingDay,
  computeNextFollowUp,
  dueState,
  daysUntil,
  todayInJohannesburg,
} from "@/lib/followup";
import { isPublicHoliday } from "@/config/sa-holidays";
import { CODE_BY_ID } from "@/lib/codes";

describe("addDays", () => {
  it("adds days within a month", () => {
    expect(addDays("2026-10-12", 30)).toBe("2026-11-11");
  });

  it("handles month rollover", () => {
    expect(addDays("2026-10-25", 10)).toBe("2026-11-04");
  });

  it("handles year rollover", () => {
    expect(addDays("2026-12-28", 5)).toBe("2027-01-02");
  });

  it("handles negative n", () => {
    expect(addDays("2026-10-12", -5)).toBe("2026-10-07");
  });

  it("handles negative n across a month boundary", () => {
    expect(addDays("2026-10-02", -5)).toBe("2026-09-27");
  });

  it("handles n = 0 (no change)", () => {
    expect(addDays("2026-10-12", 0)).toBe("2026-10-12");
  });
});

describe("toDateStr", () => {
  it("slices a string to YYYY-MM-DD", () => {
    expect(toDateStr("2026-10-12T15:30:00Z")).toBe("2026-10-12");
  });

  it("formats a Date using its UTC civil parts", () => {
    expect(toDateStr(new Date(Date.UTC(2026, 9, 12, 12)))).toBe("2026-10-12");
  });
});

describe("dayOfWeek", () => {
  it("returns 0 for Sunday and 6 for Saturday", () => {
    expect(dayOfWeek("2026-10-10")).toBe(6); // Sat
    expect(dayOfWeek("2026-10-11")).toBe(0); // Sun
    expect(dayOfWeek("2026-10-12")).toBe(1); // Mon
  });
});

describe("isWeekend", () => {
  it("Saturday is a weekend", () => {
    expect(isWeekend("2026-10-10")).toBe(true);
  });

  it("Sunday is a weekend", () => {
    expect(isWeekend("2026-10-11")).toBe(true);
  });

  it("Monday is not a weekend", () => {
    expect(isWeekend("2026-10-12")).toBe(false);
  });
});

describe("isPublicHoliday", () => {
  it("Christmas Day is a holiday", () => {
    expect(isPublicHoliday("2026-12-25")).toBe(true);
  });

  it("the day before Christmas is not a holiday", () => {
    expect(isPublicHoliday("2026-12-24")).toBe(false);
  });

  it("Human Rights Day observed (2027-03-22) is a holiday", () => {
    expect(isPublicHoliday("2027-03-22")).toBe(true);
  });

  it("Women's Day observed Monday (2026-08-10) is a holiday", () => {
    expect(isPublicHoliday("2026-08-10")).toBe(true);
  });
});

describe("isWorkingDay", () => {
  it("is false on weekends", () => {
    expect(isWorkingDay("2026-10-10")).toBe(false);
  });

  it("is false on public holidays", () => {
    expect(isWorkingDay("2026-12-25")).toBe(false);
  });

  it("is true on an ordinary weekday", () => {
    expect(isWorkingDay("2026-10-12")).toBe(true);
  });
});

describe("nextWorkingDay", () => {
  it("rolls a plain Saturday forward to Monday", () => {
    expect(nextWorkingDay("2026-10-10")).toBe("2026-10-12");
  });

  it("leaves a working weekday unchanged", () => {
    expect(nextWorkingDay("2026-10-12")).toBe("2026-10-12");
  });

  it("rolls past the Women's Day Sat/Sun/observed-Monday cluster", () => {
    // 8 Sat, 9 Sun (holiday), 10 Mon (observed holiday), 11 Tue working.
    expect(nextWorkingDay("2026-08-08")).toBe("2026-08-11");
  });

  it("rolls past the Easter 2026 cluster", () => {
    // 3 Apr Good Friday, 4 Sat, 5 Sun, 6 Apr Family Day Mon, 7 Apr Tue working.
    expect(nextWorkingDay("2026-04-03")).toBe("2026-04-07");
  });
});

describe("cadenceDays", () => {
  it("returns the code default cadence", () => {
    expect(cadenceDays("veryhot")).toBe(7);
    expect(cadenceDays("hot")).toBe(30);
    expect(cadenceDays("warm")).toBe(60);
    expect(cadenceDays("cold")).toBe(180);
    expect(cadenceDays("private")).toBe(14);
    expect(cadenceDays("lwc")).toBe(30);
    expect(cadenceDays("stock")).toBe(30);
    expect(cadenceDays("sellerlwc")).toBe(30);
    expect(cadenceDays("lwcseller")).toBe(30);
    expect(cadenceDays("jswc")).toBe(7);
  });

  it("prefers a Settings override over the code default", () => {
    expect(cadenceDays("hot", { hot: 10 })).toBe(10);
  });

  it("falls back to the code default when no override exists for that code", () => {
    expect(cadenceDays("hot", { warm: 99 })).toBe(30);
  });
});

describe("computeNextFollowUp", () => {
  it("hot: 30 days from 2026-10-12 lands on a working Wednesday", () => {
    expect(computeNextFollowUp("hot", "2026-10-12")).toBe("2026-11-11");
  });

  it("veryhot: 7 days from 2026-10-12 lands on a working Monday", () => {
    expect(computeNextFollowUp("veryhot", "2026-10-12")).toBe("2026-10-19");
  });

  it("rolls off a weekend: veryhot from 2026-10-10 (Sat) skips Sat 17 Oct to Mon 19 Oct", () => {
    expect(computeNextFollowUp("veryhot", "2026-10-10")).toBe("2026-10-19");
  });

  it("respects a cadence override", () => {
    const overrides = { hot: 10 };
    const expected = nextWorkingDay(addDays("2026-10-12", 10));
    expect(computeNextFollowUp("hot", "2026-10-12", overrides)).toBe(expected);
    expect(computeNextFollowUp("hot", "2026-10-12", overrides)).toBe("2026-10-22");
  });
});

describe("daysUntil", () => {
  it("overdue is negative", () => {
    expect(daysUntil("2026-10-08", "2026-10-12")).toBe(-4);
  });

  it("due today is zero", () => {
    expect(daysUntil("2026-10-12", "2026-10-12")).toBe(0);
  });

  it("upcoming is positive", () => {
    expect(daysUntil("2026-10-15", "2026-10-12")).toBe(3);
  });
});

describe("dueState", () => {
  it("classifies an overdue date", () => {
    expect(dueState("2026-10-08", "2026-10-12")).toBe("overdue");
  });

  it("classifies today", () => {
    expect(dueState("2026-10-12", "2026-10-12")).toBe("today");
  });

  it("classifies an upcoming date", () => {
    expect(dueState("2026-10-15", "2026-10-12")).toBe("upcoming");
  });
});

describe("todayInJohannesburg", () => {
  it("formats a known instant as its SAST civil date", () => {
    // 2026-10-12T23:30:00Z is already 2026-10-13 01:30 SAST (UTC+2).
    expect(todayInJohannesburg(new Date("2026-10-12T23:30:00Z"))).toBe("2026-10-13");
  });

  it("stays on the same civil date just before SAST midnight rolls over", () => {
    // 2026-10-12T21:30:00Z is 2026-10-12 23:30 SAST.
    expect(todayInJohannesburg(new Date("2026-10-12T21:30:00Z"))).toBe("2026-10-12");
  });
});

describe("CODE_BY_ID sanity (cadence source of truth used above)", () => {
  it("matches the days documented in the task", () => {
    expect(CODE_BY_ID.veryhot.days).toBe(7);
    expect(CODE_BY_ID.jswc.days).toBe(7);
    expect(CODE_BY_ID.private.days).toBe(14);
    expect(CODE_BY_ID.hot.days).toBe(30);
    expect(CODE_BY_ID.warm.days).toBe(60);
    expect(CODE_BY_ID.cold.days).toBe(180);
  });
});
