import { describe, it, expect } from "vitest";
import { demoDraft } from "@/lib/cma/demo";
import { parseDraft } from "@/lib/cma/context";
import type { CmaContext } from "@/lib/cma/types";

function ctx(overrides: Partial<CmaContext["subject"]>, comps: CmaContext["comps"]): CmaContext {
  return {
    subject: {
      suburb: "Mouille Point",
      street: "12 Marine Drive",
      propertyType: "Apartment",
      beds: 3,
      baths: "2",
      erfSizeM2: null,
      floorSizeM2: 180,
      parking: 2,
      ...overrides,
    },
    comps,
  };
}

describe("demoDraft", () => {
  const comps: CmaContext["comps"] = [
    { address: "8 Beach Road", saleDate: "2026-07-03", price: 7650000, sizeM2: 170, status: "Sold" },
    { address: "20 Marine Drive", saleDate: "2026-06-10", price: 8100000, sizeM2: 180, status: "Sold" },
    { address: "3 Ocean View", saleDate: "2026-05-22", price: 9000000, sizeM2: 200, status: "Sold" },
    { address: "5 Sea Point Ave", saleDate: "2026-08-01", price: 8800000, sizeM2: 190, status: "Sold" },
  ];

  it("returns a labelled sample draft", () => {
    const d = demoDraft(ctx({}, comps));
    expect(d).not.toBeNull();
    expect(d!.demo).toBe(true);
  });

  it("anchors to median R/m2 times floor size", () => {
    // R/m2: 45000, 45000, 45000, ~46315 -> median 45000; x180 = 8,100,000
    const d = demoDraft(ctx({ floorSizeM2: 180 }, comps))!;
    expect(d.valueLow).toBeLessThan(d.valueHigh);
    expect(d.recommendedPrice).toBeGreaterThanOrEqual(d.valueLow);
    expect(d.recommendedPrice).toBeLessThanOrEqual(d.valueHigh);
    // central ~8.1m; recommended rounds to nearest 50k and stays near it
    expect(d.recommendedPrice).toBeGreaterThan(7800000);
    expect(d.recommendedPrice).toBeLessThan(8400000);
  });

  it("passes its own output through parseDraft (same validator as apply)", () => {
    const d = demoDraft(ctx({}, comps))!;
    expect(parseDraft(d)).not.toBeNull();
  });

  it("is deterministic", () => {
    const a = demoDraft(ctx({}, comps))!;
    const b = demoDraft(ctx({}, comps))!;
    expect(a.recommendedPrice).toBe(b.recommendedPrice);
    expect(a.valueLow).toBe(b.valueLow);
  });

  it("rates >= 4 give medium confidence", () => {
    expect(demoDraft(ctx({}, comps))!.confidence).toBe("medium");
  });

  it("falls back to median price when sizes are missing", () => {
    const noSizes: CmaContext["comps"] = comps.map((c) => ({ ...c, sizeM2: null }));
    const d = demoDraft(ctx({ floorSizeM2: null, erfSizeM2: null }, noSizes))!;
    expect(d).not.toBeNull();
    // median of 7.65m, 8.1m, 9m, 8.8m -> (8.1+8.8)/2 = 8.45m
    expect(d.recommendedPrice).toBeGreaterThan(8000000);
    expect(d.confidence).toBe("low");
  });

  it("returns null with no comps", () => {
    expect(demoDraft(ctx({}, []))).toBeNull();
  });

  it("returns null when no comp has a price", () => {
    const noPrice: CmaContext["comps"] = [
      { address: "X", saleDate: null, price: null, sizeM2: 100, status: "Sold" },
    ];
    expect(demoDraft(ctx({}, noPrice))).toBeNull();
  });
});
