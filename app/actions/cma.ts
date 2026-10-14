"use server";

// CMA assistant actions. draftCma asks Claude for a valuation proposal and
// returns it WITHOUT writing anything. applyCma writes the figures Nelio has
// reviewed onto the seller. Both gate on the signed-in allowlisted user.
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sellers } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { getSeller, getComps } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { buildContext, parseDraft } from "@/lib/cma/context";
import { draftCmaFromContext, type DraftResult } from "@/lib/cma/draft";
import type { CmaDraft } from "@/lib/cma/types";

export async function draftCma(sellerId: string): Promise<DraftResult> {
  await requireUser();
  const seller = await getSeller(sellerId);
  if (!seller) return { ok: false, error: "Seller not found." };
  const comps = await getComps(sellerId);
  return draftCmaFromContext(buildContext(seller, comps));
}

export async function applyCma(
  sellerId: string,
  draft: CmaDraft,
): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  // Re-validate server-side; never trust the client-supplied draft blindly.
  const clean = parseDraft(draft);
  if (!clean) return { ok: false, error: "The valuation figures are not usable." };

  const seller = await getSeller(sellerId);
  if (!seller) return { ok: false, error: "Seller not found." };

  await db
    .update(sellers)
    .set({
      recommendedPrice: clean.recommendedPrice,
      valueLow: clean.valueLow,
      valueHigh: clean.valueHigh,
      // A CMA-derived figure IS a fresh desktop valuation done today. Stamp the
      // type and date to match, so the snapshot never mislabels a new AI figure
      // as an older in-person (PV) valuation Nelio did on a different date.
      valuationType: "DV",
      valuationDate: todayInJohannesburg(),
      updatedAt: new Date(),
    })
    .where(eq(sellers.id, sellerId));

  revalidatePath(`/sellers/${sellerId}`);
  revalidatePath(`/sellers/${sellerId}/cma`);
  revalidatePath(`/sellers/${sellerId}/snapshot`);
  return { ok: true };
}
