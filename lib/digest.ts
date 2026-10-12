// Morning digest: who is due today and who is overdue. Plain text for a Slack
// incoming webhook. Includes names (Nelio's own workspace) but never phone
// numbers (POPIA).
import "server-only";
import { getDueSellers } from "@/lib/queries";
import { daysUntil } from "@/lib/followup";
import { formatDayLabel } from "@/lib/format";
import { getCode } from "@/lib/codes";

export interface Digest {
  text: string;
  counts: { dueToday: number; overdue: number };
}

export async function buildDigest(today: string): Promise<Digest> {
  const due = await getDueSellers(today);
  const overdue = due
    .filter((s) => s.nextFollowUpDate && daysUntil(s.nextFollowUpDate, today) < 0)
    .sort((a, b) => (a.nextFollowUpDate ?? "").localeCompare(b.nextFollowUpDate ?? ""));
  const dueToday = due.filter((s) => s.nextFollowUpDate && daysUntil(s.nextFollowUpDate, today) === 0);

  const codeShort = (c: string) => getCode(c)?.short ?? c;
  const lines: string[] = [`*Nelio's HQ · ${formatDayLabel(today)}*`];

  lines.push("", `*Due today (${dueToday.length})*`);
  if (dueToday.length === 0) lines.push("_Nothing due today._");
  else for (const s of dueToday) lines.push(`• ${s.name} · ${codeShort(s.code)}`);

  lines.push("", `*Overdue (${overdue.length})*`);
  if (overdue.length === 0) lines.push("_None overdue._");
  else
    for (const s of overdue) {
      const n = -daysUntil(s.nextFollowUpDate!, today);
      lines.push(`• ${s.name} · ${n} ${n === 1 ? "day" : "days"} · ${codeShort(s.code)}`);
    }

  return { text: lines.join("\n"), counts: { dueToday: dueToday.length, overdue: overdue.length } };
}
