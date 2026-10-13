// Build the CMA context sent to the AI. POPIA: the seller's name, cell and
// email are deliberately dropped here. Only the property and the comparable
// sales are included, because that is all a valuation needs. Pure functions so
// this is unit-testable without a DB or network.

import type { Seller, ComparableSale } from "@/db/schema";
import type { CmaContext, CmaComp, CmaDraft } from "./types";

export function buildContext(seller: Seller, comps: ComparableSale[]): CmaContext {
  return {
    subject: {
      suburb: seller.suburb,
      street: seller.address,
      propertyType: seller.propertyType ?? null,
      beds: seller.beds ?? null,
      baths: seller.baths ?? null,
      erfSizeM2: seller.erfSizeM2 ?? null,
      floorSizeM2: seller.floorSizeM2 ?? null,
      parking: seller.parking ?? null,
    },
    comps: comps.map(
      (c): CmaComp => ({
        address: c.address,
        saleDate: c.saleDate ?? null,
        price: c.price ?? null,
        sizeM2: c.sizeM2 ?? null,
        status: c.status,
      }),
    ),
  };
}

/** The user-message payload: compact JSON the model reads alongside the method. */
export function contextToPrompt(ctx: CmaContext): string {
  return JSON.stringify(ctx, null, 2);
}

/**
 * Validate and normalise a raw object parsed from the model's JSON output.
 * Hand-rolled (the project has no Zod). Returns a clean CmaDraft or null if the
 * shape or the numbers are not usable.
 */
export function parseDraft(raw: unknown): CmaDraft | null {
  if (typeof raw !== "object" || raw === null) return null;
  const o = raw as Record<string, unknown>;

  const low = toMoney(o.valueLow);
  const high = toMoney(o.valueHigh);
  const rec = toMoney(o.recommendedPrice);
  if (low == null || high == null || rec == null) return null;
  // A band must be the right way round and the recommendation must sit inside
  // a sane envelope around it (allow a little negotiating headroom above high).
  if (high < low) return null;
  if (rec < low * 0.9 || rec > high * 1.1) return null;

  const confidence =
    o.confidence === "low" || o.confidence === "medium" || o.confidence === "high"
      ? o.confidence
      : "low";

  const rationale = typeof o.rationale === "string" ? o.rationale.trim() : "";
  if (!rationale) return null;

  const confidenceReason =
    typeof o.confidenceReason === "string" ? o.confidenceReason.trim() : "";

  const compNotes = Array.isArray(o.compNotes)
    ? o.compNotes
        .map((n) => {
          if (typeof n !== "object" || n === null) return null;
          const m = n as Record<string, unknown>;
          const address = typeof m.address === "string" ? m.address : "";
          const note = typeof m.note === "string" ? m.note : "";
          return address && note ? { address, note } : null;
        })
        .filter((n): n is { address: string; note: string } => n !== null)
    : [];

  return {
    recommendedPrice: rec,
    valueLow: low,
    valueHigh: high,
    confidence,
    confidenceReason,
    rationale,
    compNotes,
  };
}

function toMoney(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.replace(/[^\d.]/g, "")) : NaN;
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}
