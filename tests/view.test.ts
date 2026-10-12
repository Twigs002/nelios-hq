import { describe, it, expect } from "vitest";
import { decorateSeller } from "@/lib/view";
import { rand, formatDateShort } from "@/lib/format";
import type { Seller } from "@/db/schema";

const TODAY = "2026-10-12";

function baseSeller(overrides: Partial<Seller> = {}): Seller {
  return {
    id: "seller-1",
    name: "Jane Smith",
    cell: "+27824551290",
    email: null,
    address: "12 Oak Street",
    suburb: "Rondebosch",
    propertyType: "House",
    beds: 3,
    baths: "2",
    erfSizeM2: 600,
    floorSizeM2: 220,
    parking: 2,
    valuationType: "PV",
    valuationDate: "2026-09-01",
    valueLow: 8100000,
    valueHigh: 8900000,
    recommendedPrice: 8450000,
    temperature: "hot",
    category: "valuation",
    code: "veryhot",
    status: "Valuation only",
    nextFollowUpDate: "2026-10-12",
    lastContactDate: "2026-10-01",
    notes: null,
    createdBy: "nelio",
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    ...overrides,
  } as any;
}

describe("decorateSeller - due date", () => {
  it("due today", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: "2026-10-12" }), TODAY);
    expect(v.dueState).toBe("today");
    expect(v.dueLabel).toBe("Due today");
    expect(v.dueDeco).toBe("underline");
  });

  it("overdue by 4 days", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: "2026-10-08" }), TODAY);
    expect(v.dueState).toBe("overdue");
    expect(v.dueLabel).toBe("Overdue · 4 days");
    expect(v.dueDeco).toBe("none");
  });

  it("overdue by exactly 1 day uses the singular 'day'", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: "2026-10-11" }), TODAY);
    expect(v.dueState).toBe("overdue");
    expect(v.dueLabel).toBe("Overdue · 1 day");
  });

  it("tomorrow", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: "2026-10-13" }), TODAY);
    expect(v.dueState).toBe("upcoming");
    expect(v.dueLabel).toBe("Tomorrow");
  });

  it("in N days includes the short date with non-breaking space", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: "2026-10-15" }), TODAY);
    expect(v.dueState).toBe("upcoming");
    expect(v.dueLabel).toBe("In 3 days · " + formatDateShort("2026-10-15"));
    expect(v.dueLabel).toBe("In 3 days · 15 Oct");
  });

  it("no follow-up set", () => {
    const v = decorateSeller(baseSeller({ nextFollowUpDate: null }), TODAY);
    expect(v.dueState).toBe("none");
    expect(v.dueLabel).toBe("No follow-up set");
    expect(v.dueDeco).toBe("none");
    expect(v.nextFollowUpDate).toBeNull();
    expect(v.nextDate).toBe("-");
  });
});

describe("decorateSeller - valuation", () => {
  it("formats the recommended price via rand()", () => {
    const v = decorateSeller(baseSeller({ recommendedPrice: 8450000 }), TODAY);
    expect(v.valValue).toBe(rand(8450000));
    expect(v.hasValuation).toBe(true);
  });

  it("has no valuation when recommendedPrice is null", () => {
    const v = decorateSeller(baseSeller({ recommendedPrice: null }), TODAY);
    expect(v.hasValuation).toBe(false);
    expect(v.valValue).toBe("-");
  });

  it("formats the value range band", () => {
    const v = decorateSeller(baseSeller({ valueLow: 8100000, valueHigh: 8900000 }), TODAY);
    expect(v.valRange).toBe(rand(8100000) + " - " + rand(8900000));
  });

  it("maps valuation type to its long label", () => {
    const pv = decorateSeller(baseSeller({ valuationType: "PV" }), TODAY);
    expect(pv.valTypeLong).toBe("Property valuation");
    const dv = decorateSeller(baseSeller({ valuationType: "DV" }), TODAY);
    expect(dv.valTypeLong).toBe("Desktop valuation");
  });
});

describe("decorateSeller - code", () => {
  it("veryhot resolves label and mark colour", () => {
    const v = decorateSeller(baseSeller({ code: "veryhot" }), TODAY);
    expect(v.codeLabel).toBe("Very hot seller");
    expect(v.mark.boxShadow).toContain("var(--code-hot)");
  });

  it("falls back to the raw code when unknown", () => {
    const v = decorateSeller(baseSeller({ code: "not-a-real-code" as any }), TODAY);
    expect(v.codeLabel).toBe("not-a-real-code");
    expect(v.mark).toEqual({
      borderRadius: "50%",
      background: "var(--ink-3)",
      transform: "none",
      clipPath: "none",
      boxShadow: "none",
    });
  });
});

describe("decorateSeller - contact + misc fields", () => {
  it("formats the cell number for display", () => {
    const v = decorateSeller(baseSeller({ cell: "+27824551290" }), TODAY);
    expect(v.phoneFmt).toBe("+27 82 455 1290");
  });

  it("derives the first name", () => {
    const v = decorateSeller(baseSeller({ name: "Jane Smith" }), TODAY);
    expect(v.first).toBe("Jane");
  });

  it("builds the place string from address + suburb", () => {
    const v = decorateSeller(baseSeller({ address: "12 Oak Street", suburb: "Rondebosch" }), TODAY);
    expect(v.place).toBe("12 Oak Street, Rondebosch");
  });

  it("labels last contact when present", () => {
    const v = decorateSeller(baseSeller({ lastContactDate: "2026-10-01" }), TODAY);
    expect(v.lastLabel).toBe("Last contact " + formatDateShort("2026-10-01"));
  });

  it("labels no contact yet when absent", () => {
    const v = decorateSeller(baseSeller({ lastContactDate: null }), TODAY);
    expect(v.lastLabel).toBe("No contact yet");
    expect(v.lastShort).toBe("-");
  });
});
