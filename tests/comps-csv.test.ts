import { describe, it, expect } from "vitest";
import { parseCompsCsv } from "@/lib/snapshot/comps-csv";

describe("parseCompsCsv", () => {
  it("parses positional rows with no header", () => {
    const rows = parseCompsCsv("12 Marine Drive, 2026-08-14, 8900000, 180");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      address: "12 Marine Drive",
      saleDate: "2026-08-14",
      price: 8900000,
      sizeM2: 180,
      status: "Sold",
    });
  });

  it("detects and skips a header row, mapping by column name", () => {
    const csv = [
      "Address,Sold,Price,Size,Status",
      "8 Beach Road,3 Jul 2026,7650000,165,Pending transfer",
    ].join("\n");
    const rows = parseCompsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      address: "8 Beach Road",
      saleDate: "2026-07-03",
      price: 7650000,
      sizeM2: 165,
      status: "Pending transfer",
    });
  });

  it("handles quoted addresses containing commas", () => {
    const rows = parseCompsCsv('"5 Flat, Block B",2026-01-05,R 4 250 000,120');
    expect(rows).toHaveLength(1);
    expect(rows[0].address).toBe("5 Flat, Block B");
    expect(rows[0].price).toBe(4250000);
  });

  it("strips currency symbols, spaces and m² from numbers", () => {
    const rows = parseCompsCsv("3 Ocean View, 12 Oct 2026, R 5 200 000, 210 m²");
    expect(rows[0].price).toBe(5200000);
    expect(rows[0].sizeM2).toBe(210);
  });

  it("parses the DD Month YYYY long form", () => {
    const rows = parseCompsCsv("1 Long Street, 3 October 2025, 3000000, 100");
    expect(rows[0].saleDate).toBe("2025-10-03");
  });

  it("keeps a row with no date (null) but still an address", () => {
    const rows = parseCompsCsv("9 No Date Ave, , 2500000, 90");
    expect(rows).toHaveLength(1);
    expect(rows[0].saleDate).toBeNull();
  });

  it("skips a row whose date is present but unparseable", () => {
    const rows = parseCompsCsv("7 Bad Date, not-a-date, 1000000, 50");
    expect(rows).toHaveLength(0);
  });

  it("skips rows with no address", () => {
    const rows = parseCompsCsv(", 2026-08-14, 8900000, 180");
    expect(rows).toHaveLength(0);
  });

  it("returns null numbers when price/size are missing", () => {
    const rows = parseCompsCsv("4 Empty Nums, 2026-08-14, , ");
    expect(rows[0].price).toBeNull();
    expect(rows[0].sizeM2).toBeNull();
  });

  it("ignores blank lines and trims cells", () => {
    const csv = "\n  11 Spaced Rd , 2026-02-02 , 1200000 , 75 \n\n";
    const rows = parseCompsCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].address).toBe("11 Spaced Rd");
    expect(rows[0].sizeM2).toBe(75);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCompsCsv("")).toEqual([]);
    expect(parseCompsCsv("   \n  ")).toEqual([]);
  });
});
