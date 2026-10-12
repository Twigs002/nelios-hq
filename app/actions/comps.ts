"use server";

// Comparable-sales mutations for the valuation snapshot. Each re-checks the
// allowlist (defence in depth) and revalidates the snapshot page so its PNG
// preview refreshes.
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { comparableSales } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { parseCompsCsvResult, toInt, type CompStatus } from "@/lib/snapshot/comps-csv";

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}

/** True for a real calendar date in "YYYY-MM-DD" form (rejects e.g. 2026-02-30). */
function isRealIsoDate(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const [, y, mo, d] = m.map(Number);
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

/** Add one comparable sale from the inline form. */
export async function addComp(sellerId: string, fd: FormData): Promise<{ ok: boolean; error?: string }> {
  await requireUser();
  const address = str(fd, "address");
  if (!address) return { ok: false, error: "Address is required." };
  const saleDate = str(fd, "saleDate"); // the date input gives YYYY-MM-DD
  const status = (str(fd, "status") as CompStatus | null) ?? "Sold";

  await db.insert(comparableSales).values({
    sellerId,
    address,
    saleDate: saleDate && isRealIsoDate(saleDate) ? saleDate : null,
    price: toInt(str(fd, "price")),
    sizeM2: toInt(str(fd, "sizeM2")),
    status,
  });

  revalidatePath(`/sellers/${sellerId}/snapshot`);
  return { ok: true };
}

/** Delete one comparable sale (only if it belongs to the named seller). */
export async function deleteComp(id: string, sellerId: string): Promise<{ ok: boolean }> {
  await requireUser();
  await db
    .delete(comparableSales)
    .where(and(eq(comparableSales.id, id), eq(comparableSales.sellerId, sellerId)));
  revalidatePath(`/sellers/${sellerId}/snapshot`);
  return { ok: true };
}

/** Bulk-import comps from pasted CSV. Returns how many rows landed / were skipped. */
export async function importCompsCsv(
  sellerId: string,
  csv: string,
): Promise<{ added: number; skipped: number }> {
  await requireUser();
  const { comps, skipped } = parseCompsCsvResult(csv);

  if (comps.length > 0) {
    await db.insert(comparableSales).values(
      comps.map((p) => ({
        sellerId,
        address: p.address,
        saleDate: p.saleDate,
        price: p.price,
        sizeM2: p.sizeM2,
        status: p.status,
      })),
    );
    revalidatePath(`/sellers/${sellerId}/snapshot`);
  }

  return { added: comps.length, skipped };
}
