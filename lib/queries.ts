// Server-only data access. All reads go through here so routes stay thin and
// the allowlist check lives in one place per entry point.
import "server-only";
import { and, asc, desc, lte, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import {
  sellers,
  contactLogs,
  comparableSales,
  templates,
  appSettings,
  type Seller,
  type Template,
  type ContactLog,
  type ComparableSale,
} from "@/db/schema";

export async function getAllSellers(): Promise<Seller[]> {
  return db.select().from(sellers).orderBy(asc(sellers.name));
}

/** Sellers ordered by next follow-up (soonest first). Nulls sort last. */
export async function getSellersByDue(): Promise<Seller[]> {
  const rows = await db.select().from(sellers);
  return rows.sort((a, b) => {
    if (!a.nextFollowUpDate) return 1;
    if (!b.nextFollowUpDate) return -1;
    return a.nextFollowUpDate.localeCompare(b.nextFollowUpDate);
  });
}

/** Sellers due on or before `today` (overdue + due today), soonest first. */
export async function getDueSellers(today: string): Promise<Seller[]> {
  return db
    .select()
    .from(sellers)
    .where(and(isNotNull(sellers.nextFollowUpDate), lte(sellers.nextFollowUpDate, today)))
    .orderBy(asc(sellers.nextFollowUpDate));
}

export async function getSeller(id: string): Promise<Seller | undefined> {
  const rows = await db.select().from(sellers).where(eq(sellers.id, id)).limit(1);
  return rows[0];
}

export async function getContactLogs(sellerId: string): Promise<ContactLog[]> {
  return db
    .select()
    .from(contactLogs)
    .where(eq(contactLogs.sellerId, sellerId))
    .orderBy(desc(contactLogs.date), desc(contactLogs.createdAt));
}

export async function getComps(sellerId: string): Promise<ComparableSale[]> {
  return db
    .select()
    .from(comparableSales)
    .where(eq(comparableSales.sellerId, sellerId))
    .orderBy(desc(comparableSales.saleDate));
}

export async function getTemplates(): Promise<Template[]> {
  return db.select().from(templates).orderBy(asc(templates.name));
}

export interface SettingRow {
  key: string;
  value: unknown;
  confirmed: boolean;
  placeholder: boolean;
  label: string | null;
}

export async function getSettings(): Promise<Record<string, SettingRow>> {
  const rows = await db.select().from(appSettings);
  return Object.fromEntries(rows.map((r) => [r.key, r]));
}

export async function getSettingValue<T = unknown>(key: string): Promise<T | undefined> {
  const rows = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
  return rows[0]?.value as T | undefined;
}

export interface AgentDetails {
  name: string;
  role: string;
  phone: string;
  email: string;
  office: string;
  web: string;
}

export async function getAgent(): Promise<AgentDetails> {
  const v = await getSettingValue<AgentDetails>("agent");
  return (
    v ?? {
      name: "Nelio Mendes",
      role: "Property Practitioner",
      phone: "+27 82 868 3539",
      email: "nelio@quay1.co.za",
      office: "Quay 1 International Realty",
      web: "quay1.co.za",
    }
  );
}

/** Cadence overrides map {code: days} from settings, if present. */
export async function getCadenceOverrides(): Promise<Record<string, number> | undefined> {
  return getSettingValue<Record<string, number>>("code_cadences");
}
