// Local demo CMA. Runs on the public demo (DEMO_DB) so the flow works end to
// end with no API key and no cost. Deterministic: same comps give the same
// result every click. This is a simple median-R/m2 heuristic, clearly labelled
// as a sample, never the full AI model. Pure (no server-only / network) so it
// is unit-testable.

import { rand } from "@/lib/format";
import type { CmaContext, CmaDraft } from "./types";

function median(nums: number[]): number {
  const a = [...nums].sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  return a.length % 2 ? a[mid] : (a[mid - 1] + a[mid]) / 2;
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

/** Build a sample CMA from the comps, or null if there is nothing to go on. */
export function demoDraft(ctx: CmaContext): CmaDraft | null {
  const { subject, comps } = ctx;
  if (comps.length === 0) return null;

  // R/m2 from comps that have both a price and a size.
  const rates = comps
    .filter((c) => (c.price ?? 0) > 0 && (c.sizeM2 ?? 0) > 0)
    .map((c) => (c.price as number) / (c.sizeM2 as number));
  const prices = comps.filter((c) => (c.price ?? 0) > 0).map((c) => c.price as number);

  const size = subject.floorSizeM2 ?? subject.erfSizeM2 ?? null;

  let central: number | null = null;
  let rate: number | null = null;
  if (rates.length > 0 && size) {
    rate = median(rates);
    central = rate * size;
  } else if (prices.length > 0) {
    central = median(prices);
  }
  if (central == null || central <= 0) return null;

  const valueLow = Math.round(central * 0.94);
  const valueHigh = Math.round(central * 1.06);
  const recommendedPrice = roundTo(central, 50000);

  const n = comps.length;
  const soldN = comps.filter((c) => c.status === "Sold").length;
  const confidence = rates.length >= 4 ? "medium" : "low";

  const saleWord = n === 1 ? "sale" : "sales";
  const rateLine =
    rate != null && size
      ? ` The stronger comps sit around ${rand(rate)} per square metre, which applied to the ${size} m2 floor area points to roughly ${rand(central)}.`
      : ` With sizes missing, the estimate leans on the middle of the comparable prices, about ${rand(central)}.`;

  const rationale =
    `Sample estimate for the demo, built from the comparable sales on file, not the full AI model. ` +
    `Based on ${n} comparable ${saleWord} in ${subject.suburb}` +
    (soldN < n ? ` (${soldN} sold, the rest pending)` : "") +
    `.${rateLine} The band allows for differences in condition and finish. ` +
    `On a real deployment with an API key set, this is replaced by the full Claude draft.`;

  const confidenceReason = `${rates.length || prices.length} comparable ${(rates.length || prices.length) === 1 ? "sale" : "sales"} used. Sample heuristic, not the AI model.`;

  const compNotes = comps.slice(0, 5).map((c) => {
    const street = c.address.split(",")[0];
    if ((c.price ?? 0) > 0 && (c.sizeM2 ?? 0) > 0) {
      const r = (c.price as number) / (c.sizeM2 as number);
      return {
        address: street,
        note:
          `${rand(r)}/m2` +
          (c.status === "Pending transfer" ? ", pending so weighted lighter." : "."),
      };
    }
    return {
      address: street,
      note: (c.price ?? 0) > 0 ? `${rand(c.price as number)}, size unknown.` : "No price on file.",
    };
  });

  return {
    recommendedPrice,
    valueLow,
    valueHigh,
    confidence,
    confidenceReason,
    rationale,
    compNotes,
    demo: true,
  };
}
