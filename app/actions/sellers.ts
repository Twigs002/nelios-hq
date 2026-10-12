"use server";

// Server actions - all mutations. Each re-checks the allowlist (defence in
// depth) and never logs seller names or phone numbers (POPIA).
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { sellers, contactLogs } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { toE164 } from "@/lib/format";
import { computeNextFollowUp, todayInJohannesburg } from "@/lib/followup";
import { getCadenceOverrides } from "@/lib/queries";
import type { CodeId } from "@/lib/codes";
import type { Temperature, Category, Status } from "@/lib/codes";

type Channel = "WhatsApp" | "Call" | "Email" | "In person";

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  const s = typeof v === "string" ? v.trim() : "";
  return s === "" ? null : s;
}
function num(fd: FormData, k: string): number | null {
  const s = str(fd, k);
  if (s == null) return null;
  const n = Number(s.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

export interface SaveResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/** Create a seller from the quick-add form. Computes the first follow-up. */
export async function createSeller(fd: FormData): Promise<SaveResult> {
  const user = await requireUser();

  const name = str(fd, "name");
  const rawCell = str(fd, "cell");
  const code = (str(fd, "code") ?? "hot") as CodeId;
  if (!name) return { ok: false, error: "Name is required." };
  if (!rawCell) return { ok: false, error: "Cell is required." };

  const cell = toE164(rawCell.startsWith("+") ? rawCell : "0" + rawCell.replace(/^0/, ""));
  // Nine digits after +27.
  if (!/^\+27\d{9}$/.test(cell)) {
    return { ok: false, error: "Enter nine digits after +27." };
  }

  const valuationDate = str(fd, "valuationDate");
  const overrides = await getCadenceOverrides();
  const base = valuationDate ?? todayInJohannesburg();
  const next = computeNextFollowUp(code, base, overrides);

  const [row] = await db
    .insert(sellers)
    .values({
      name,
      cell,
      email: str(fd, "email"),
      address: str(fd, "address") ?? "",
      suburb: str(fd, "suburb") ?? "",
      propertyType: str(fd, "propertyType"),
      beds: num(fd, "beds"),
      baths: str(fd, "baths"),
      erfSizeM2: num(fd, "erfSizeM2"),
      floorSizeM2: num(fd, "floorSizeM2"),
      parking: num(fd, "parking"),
      valuationType: (str(fd, "valuationType") as "PV" | "DV" | null) ?? "PV",
      valuationDate,
      valueLow: num(fd, "valueLow"),
      valueHigh: num(fd, "valueHigh"),
      recommendedPrice: num(fd, "recommendedPrice"),
      temperature: str(fd, "temperature") as Temperature | null,
      category: str(fd, "category") as Category | null,
      code,
      status: (str(fd, "status") as Status | null) ?? "Valuation only",
      nextFollowUpDate: next,
      notes: str(fd, "notes"),
      createdBy: user.email,
    })
    .returning({ id: sellers.id });

  revalidatePath("/board");
  revalidatePath("/today");
  return { ok: true, id: row.id };
}

/** Update core seller fields (from the edit form). */
export async function updateSeller(id: string, fd: FormData): Promise<SaveResult> {
  await requireUser();
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["name", "address", "suburb", "email", "propertyType", "notes"]) {
    if (fd.has(k)) patch[k === "propertyType" ? "propertyType" : k] = str(fd, k);
  }
  if (fd.has("cell")) {
    const raw = str(fd, "cell");
    if (raw) patch.cell = toE164(raw);
  }
  if (fd.has("recommendedPrice")) patch.recommendedPrice = num(fd, "recommendedPrice");
  if (fd.has("valueLow")) patch.valueLow = num(fd, "valueLow");
  if (fd.has("valueHigh")) patch.valueHigh = num(fd, "valueHigh");
  await db.update(sellers).set(patch).where(eq(sellers.id, id));
  revalidatePath(`/sellers/${id}`);
  revalidatePath("/board");
  return { ok: true, id };
}

/** Change the seller code and recompute the next follow-up from its cadence. */
export async function setSellerCode(id: string, code: CodeId): Promise<SaveResult> {
  await requireUser();
  const [row] = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  if (!row) return { ok: false, error: "Not found." };
  const overrides = await getCadenceOverrides();
  const base = row.lastContactDate ?? todayInJohannesburg();
  const next = computeNextFollowUp(code, base, overrides);
  await db
    .update(sellers)
    .set({ code, nextFollowUpDate: next, updatedAt: new Date() })
    .where(eq(sellers.id, id));
  revalidatePath(`/sellers/${id}`);
  revalidatePath("/board");
  revalidatePath("/today");
  return { ok: true, id };
}

/** Manual override of the next follow-up date. Honoured exactly as given. */
export async function rescheduleFollowUp(id: string, date: string): Promise<SaveResult> {
  await requireUser();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { ok: false, error: "Invalid date." };
  await db
    .update(sellers)
    .set({ nextFollowUpDate: date, updatedAt: new Date() })
    .where(eq(sellers.id, id));
  revalidatePath(`/sellers/${id}`);
  revalidatePath("/board");
  revalidatePath("/today");
  return { ok: true, id };
}

/**
 * Mark the current follow-up done: log the contact today and schedule the next
 * one from the code cadence (off weekends/holidays).
 */
export async function markFollowUpDone(
  id: string,
  opts?: { channel?: Channel; note?: string; templateUsed?: string },
): Promise<SaveResult> {
  await requireUser();
  const [row] = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  if (!row) return { ok: false, error: "Not found." };
  const today = todayInJohannesburg();
  const overrides = await getCadenceOverrides();
  const next = computeNextFollowUp(row.code, today, overrides);

  await db.insert(contactLogs).values({
    sellerId: id,
    date: today,
    channel: opts?.channel ?? "WhatsApp",
    note: opts?.note ?? null,
    templateUsed: opts?.templateUsed ?? null,
  });
  await db
    .update(sellers)
    .set({ lastContactDate: today, nextFollowUpDate: next, updatedAt: new Date() })
    .where(eq(sellers.id, id));

  revalidatePath(`/sellers/${id}`);
  revalidatePath("/board");
  revalidatePath("/today");
  return { ok: true, id };
}

/** Log a contact without changing the schedule (e.g. an ad-hoc note). */
export async function logContact(
  id: string,
  input: { date?: string; channel: Channel; note?: string; templateUsed?: string },
): Promise<SaveResult> {
  await requireUser();
  const today = todayInJohannesburg();
  const date = input.date ?? today;
  await db.insert(contactLogs).values({
    sellerId: id,
    date,
    channel: input.channel,
    note: input.note ?? null,
    templateUsed: input.templateUsed ?? null,
  });
  const [row] = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  if (row && (!row.lastContactDate || date > row.lastContactDate)) {
    await db.update(sellers).set({ lastContactDate: date }).where(eq(sellers.id, id));
  }
  revalidatePath(`/sellers/${id}`);
  return { ok: true, id };
}
