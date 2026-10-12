"use server";

import { requireUser } from "@/lib/session";
import { runSync, type SyncResult } from "@/lib/google/calendar";

/** Preview (dry-run) or run the calendar sync, depending on env switches. */
export async function runCalendarSync(): Promise<SyncResult> {
  await requireUser();
  return runSync();
}
