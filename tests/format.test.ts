import { describe, it, expect } from "vitest";
import { rand, valueRange, toE164, formatPhone, formatDate, formatDateShort, firstName, sqm } from "@/lib/format";

const NB = " ";

describe("rand", () => {
  it("formats with non-breaking spaces as thousands separators", () => {
    expect(rand(5200000)).toBe("R" + NB + "5" + NB + "200" + NB + "000");
  });

  it("matches the literal expected string", () => {
    expect(rand(5200000)).toBe(`R${NB}5${NB}200${NB}000`);
  });

  it("rounds non-integer input", () => {
    expect(rand(1999.6)).toBe(`R${NB}2${NB}000`);
  });

  it("handles small values with no thousands separator", () => {
    expect(rand(500)).toBe(`R${NB}500`);
  });
});

describe("valueRange", () => {
  it("joins two rand() values with a hyphen, not an en dash", () => {
    expect(valueRange(100, 200)).toBe(rand(100) + " - " + rand(200));
    expect(valueRange(100, 200)).not.toContain("–"); // en dash
    expect(valueRange(100, 200)).toContain(" - ");
  });
});

describe("toE164", () => {
  it("converts a leading-zero SA number", () => {
    expect(toE164("0824551290")).toBe("+27824551290");
  });

  it("is idempotent on an already-E.164 number", () => {
    expect(toE164("+27824551290")).toBe("+27824551290");
  });
});

describe("formatPhone", () => {
  it("formats an E.164 number for display", () => {
    expect(formatPhone("+27824551290")).toBe("+27 82 455 1290");
  });

  it("formats a leading-zero number for display", () => {
    expect(formatPhone("0824551290")).toBe("+27 82 455 1290");
  });
});

describe("formatDate / formatDateShort", () => {
  it("formats the full date with non-breaking spaces", () => {
    expect(formatDate("2026-10-12")).toBe(`12${NB}Oct${NB}2026`);
  });

  it("formats the short date with non-breaking space", () => {
    expect(formatDateShort("2026-10-15")).toBe(`15${NB}Oct`);
  });
});

describe("firstName", () => {
  it("takes the first word of a full name", () => {
    expect(firstName("Jane Smith")).toBe("Jane");
  });

  it("trims leading whitespace", () => {
    expect(firstName("  Bob van der Merwe")).toBe("Bob");
  });
});

describe("sqm", () => {
  it("formats a number with the m² unit and nbsp", () => {
    expect(sqm(220)).toBe(`220${NB}m²`);
  });

  it("returns a dash for null/undefined", () => {
    expect(sqm(null)).toBe("-");
    expect(sqm(undefined)).toBe("-");
  });
});
