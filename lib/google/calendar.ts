// Google Calendar sync for follow-ups. One all-day event per seller whose
// next follow-up is set, coloured by category. Everything is gated by two env
// switches and defaults to doing nothing:
//   SYNC_CALENDAR = "true"   -> sync is enabled at all
//   CALENDAR_DRY_RUN = "true" (default) -> only PLAN, never write
// calendar.events scope only. Uses fetch (no googleapis dependency).
import "server-only";
import { and, eq, isNotNull } from "drizzle-orm";
import { db } from "@/db";
import { sellers, calendarEvents, googleAccounts } from "@/db/schema";
import { getSettingValue } from "@/lib/queries";
import { getCode } from "@/lib/codes";

const CAL_BASE = "https://www.googleapis.com/calendar/v3";

export function syncEnabled(): boolean {
  return process.env.SYNC_CALENDAR === "true";
}
export function dryRunOnly(): boolean {
  // Dry-run unless explicitly turned off. Fail safe.
  return process.env.CALENDAR_DRY_RUN !== "false";
}
function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "primary";
}

/** Fresh access token for the calendar-owning Google account (refresh grant). */
async function getAccessToken(): Promise<string | null> {
  const rows = await db
    .select()
    .from(googleAccounts)
    .where(isNotNull(googleAccounts.refreshToken));
  const acct = rows[0];
  if (!acct?.refreshToken) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? "",
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? "",
      refresh_token: acct.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { access_token?: string };
  return json.access_token ?? null;
}

async function categoryColours(): Promise<Record<string, string>> {
  return (await getSettingValue<Record<string, string>>("calendar_colours")) ?? {};
}

export type PlanAction = "create" | "update" | "delete" | "noop";
export interface PlanItem {
  sellerId: string;
  name: string;
  action: PlanAction;
  date: string | null;
  colorId?: string;
}

/** Build the list of changes without touching the calendar. */
export async function planSync(): Promise<PlanItem[]> {
  const colours = await categoryColours();
  const all = await db.select().from(sellers);
  const mappings = await db.select().from(calendarEvents);
  const mapBySeller = new Map(mappings.map((m) => [m.sellerId, m]));
  const plan: PlanItem[] = [];

  for (const s of all) {
    const existing = mapBySeller.get(s.id);
    const colorId = s.category ? colours[s.category] : undefined;
    if (!s.nextFollowUpDate) {
      if (existing) plan.push({ sellerId: s.id, name: s.name, action: "delete", date: null });
      continue;
    }
    if (!existing) {
      plan.push({ sellerId: s.id, name: s.name, action: "create", date: s.nextFollowUpDate, colorId });
    } else if (existing.syncedDate !== s.nextFollowUpDate || existing.syncedColor !== (colorId ?? null)) {
      plan.push({ sellerId: s.id, name: s.name, action: "update", date: s.nextFollowUpDate, colorId });
    } else {
      plan.push({ sellerId: s.id, name: s.name, action: "noop", date: s.nextFollowUpDate, colorId });
    }
  }
  return plan;
}

function nextDay(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  dt.setUTCDate(dt.getUTCDate() + 1);
  return dt.toISOString().slice(0, 10);
}

function eventBody(s: typeof sellers.$inferSelect, colorId?: string) {
  const code = getCode(s.code);
  return {
    summary: `Follow up: ${s.name}${code ? ` (${code.short})` : ""}`,
    description: `${s.address}, ${s.suburb}\nNelio's HQ follow-up`,
    start: { date: s.nextFollowUpDate! },
    end: { date: nextDay(s.nextFollowUpDate!) },
    ...(colorId ? { colorId } : {}),
    transparency: "transparent",
  };
}

export interface SyncResult {
  enabled: boolean;
  dryRun: boolean;
  plan: PlanItem[];
  applied: number;
  errors: string[];
  note?: string;
}

/**
 * Run the sync. In dry-run (default) it only returns the plan. Live mode
 * requires SYNC_CALENDAR=true AND CALENDAR_DRY_RUN=false.
 */
export async function runSync(): Promise<SyncResult> {
  const plan = await planSync();
  const changes = plan.filter((p) => p.action !== "noop");
  const dryRun = dryRunOnly() || !syncEnabled();

  if (dryRun) {
    return {
      enabled: syncEnabled(),
      dryRun: true,
      plan,
      applied: 0,
      errors: [],
      note: !syncEnabled()
        ? "SYNC_CALENDAR is off. This is a preview only."
        : "CALENDAR_DRY_RUN is on. This is a preview only.",
    };
  }

  const token = await getAccessToken();
  if (!token) {
    return { enabled: true, dryRun: false, plan, applied: 0, errors: ["No Google account/refresh token available."] };
  }

  const cal = calendarId();
  const auth = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  let applied = 0;
  const errors: string[] = [];

  for (const item of changes) {
    try {
      if (item.action === "create") {
        const [s] = await db.select().from(sellers).where(eq(sellers.id, item.sellerId)).limit(1);
        if (!s) continue;
        const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(cal)}/events`, {
          method: "POST",
          headers: auth,
          body: JSON.stringify(eventBody(s, item.colorId)),
        });
        if (!res.ok) throw new Error(`create ${res.status}`);
        const ev = (await res.json()) as { id: string };
        await db.insert(calendarEvents).values({
          sellerId: s.id,
          eventId: ev.id,
          calendarId: cal,
          syncedDate: s.nextFollowUpDate,
          syncedColor: item.colorId ?? null,
          updatedAt: new Date(),
        });
        applied++;
      } else if (item.action === "update") {
        const [s] = await db.select().from(sellers).where(eq(sellers.id, item.sellerId)).limit(1);
        const [m] = await db.select().from(calendarEvents).where(eq(calendarEvents.sellerId, item.sellerId)).limit(1);
        if (!s || !m) continue;
        const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(m.calendarId)}/events/${m.eventId}`, {
          method: "PATCH",
          headers: auth,
          body: JSON.stringify(eventBody(s, item.colorId)),
        });
        if (!res.ok) throw new Error(`update ${res.status}`);
        await db
          .update(calendarEvents)
          .set({ syncedDate: s.nextFollowUpDate, syncedColor: item.colorId ?? null, updatedAt: new Date() })
          .where(eq(calendarEvents.sellerId, s.id));
        applied++;
      } else if (item.action === "delete") {
        const [m] = await db.select().from(calendarEvents).where(eq(calendarEvents.sellerId, item.sellerId)).limit(1);
        if (!m) continue;
        const res = await fetch(`${CAL_BASE}/calendars/${encodeURIComponent(m.calendarId)}/events/${m.eventId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok && res.status !== 410 && res.status !== 404) throw new Error(`delete ${res.status}`);
        await db.delete(calendarEvents).where(and(eq(calendarEvents.sellerId, item.sellerId)));
        applied++;
      }
    } catch (e) {
      errors.push(`${item.action} failed for a seller`);
    }
  }

  return { enabled: true, dryRun: false, plan, applied, errors };
}
