import { describe, it, expect } from "vitest";
import { buildContext, parseDraft } from "@/lib/cma/context";
import type { Seller, ComparableSale } from "@/db/schema";

const seller = {
  id: "s1",
  name: "Jane Private",
  cell: "+27821234567",
  email: "jane@example.com",
  address: "12 Marine Drive",
  suburb: "Mouille Point",
  propertyType: "Apartment",
  beds: 3,
  baths: "2",
  erfSizeM2: null,
  floorSizeM2: 180,
  parking: 2,
} as unknown as Seller;

const comps = [
  {
    id: "c1",
    address: "8 Beach Road",
    saleDate: "2026-07-03",
    price: 7650000,
    sizeM2: 165,
    status: "Sold",
  },
  {
    id: "c2",
    address: "20 Marine Drive",
    saleDate: null,
    price: null,
    sizeM2: null,
    status: "Pending transfer",
  },
] as unknown as ComparableSale[];

describe("buildContext (POPIA minimisation)", () => {
  const ctx = buildContext(seller, comps);
  const json = JSON.stringify(ctx);

  it("drops the seller's name, cell and email", () => {
    expect(json).not.toContain("Jane Private");
    expect(json).not.toContain("+27821234567");
    expect(json).not.toContain("jane@example.com");
  });

  it("keeps the property facts needed to value it", () => {
    expect(ctx.subject.suburb).toBe("Mouille Point");
    expect(ctx.subject.street).toBe("12 Marine Drive");
    expect(ctx.subject.floorSizeM2).toBe(180);
    expect(ctx.subject.beds).toBe(3);
  });

  it("passes the comparables through", () => {
    expect(ctx.comps).toHaveLength(2);
    expect(ctx.comps[0].price).toBe(7650000);
    expect(ctx.comps[1].status).toBe("Pending transfer");
  });
});

describe("parseDraft (validation)", () => {
  const good = {
    recommendedPrice: 8500000,
    valueLow: 8000000,
    valueHigh: 9000000,
    confidence: "medium",
    confidenceReason: "Three recent same-suburb comps.",
    rationale: "Priced from R/m2 on the strongest comps.",
    compNotes: [{ address: "8 Beach Road", note: "Closest match on size." }],
  };

  it("accepts a well-formed draft", () => {
    const d = parseDraft(good);
    expect(d).not.toBeNull();
    expect(d!.recommendedPrice).toBe(8500000);
    expect(d!.confidence).toBe("medium");
    expect(d!.compNotes).toHaveLength(1);
  });

  it("rejects an inverted band", () => {
    expect(parseDraft({ ...good, valueLow: 9000000, valueHigh: 8000000 })).toBeNull();
  });

  it("rejects a recommendation far outside the band", () => {
    expect(parseDraft({ ...good, recommendedPrice: 20000000 })).toBeNull();
  });

  it("rejects missing or non-positive numbers", () => {
    expect(parseDraft({ ...good, recommendedPrice: 0 })).toBeNull();
    expect(parseDraft({ ...good, valueLow: "n/a" })).toBeNull();
  });

  it("rejects an empty rationale", () => {
    expect(parseDraft({ ...good, rationale: "   " })).toBeNull();
  });

  it("defaults an unknown confidence to low and tolerates missing comp notes", () => {
    const d = parseDraft({ ...good, confidence: "wild", compNotes: undefined });
    expect(d).not.toBeNull();
    expect(d!.confidence).toBe("low");
    expect(d!.compNotes).toEqual([]);
  });

  it("rejects non-object input", () => {
    expect(parseDraft(null)).toBeNull();
    expect(parseDraft("x")).toBeNull();
  });
});
