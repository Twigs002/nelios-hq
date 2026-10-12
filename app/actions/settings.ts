"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { appSettings, templates } from "@/db/schema";
import { requireUser } from "@/lib/session";

/** Toggle a setting's "confirmed with Nelio" flag. */
export async function setConfirmed(key: string, confirmed: boolean) {
  await requireUser();
  await db
    .update(appSettings)
    .set({ confirmed, placeholder: !confirmed, updatedAt: new Date() })
    .where(eq(appSettings.key, key));
  // The templates group flag also marks every template row confirmed.
  if (key === "templates") {
    await db.update(templates).set({ confirmed, updatedAt: new Date() });
  }
  revalidatePath("/settings");
  return { ok: true };
}
