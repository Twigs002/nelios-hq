// Morning digest cron. Vercel Cron hits this once a day (0 5 * * 1-5 UTC =
// 07:00 SAST weekdays; on Hobby it may fire anytime within the hour).
// Protected by CRON_SECRET. Skips SA public holidays. DIGEST_DRY_RUN defaults
// to true: it only logs the message and never posts to Slack.
import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { buildDigest } from "@/lib/digest";
import { todayInJohannesburg } from "@/lib/followup";
import { isPublicHoliday, holidayName } from "@/config/sa-holidays";

export const dynamic = "force-dynamic";

function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed if no secret configured
  const header = req.headers.get("authorization");
  if (!header) return false;
  return constantTimeEqual(header, `Bearer ${secret}`);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const today = todayInJohannesburg();

  if (isPublicHoliday(today)) {
    return Response.json({ skipped: "public holiday", holiday: holidayName(today), today });
  }

  const { text, counts } = await buildDigest(today);
  const dryRun = process.env.DIGEST_DRY_RUN !== "false";
  const webhook = process.env.SLACK_WEBHOOK_URL;

  if (dryRun || !webhook) {
    // Do not post. Never log or return the message body: it contains seller
    // names, and the app never logs names or phone numbers (POPIA). Counts only.
    // To eyeball the actual message, run the digest locally.
    console.log(
      `[digest dry-run] ${counts.dueToday} due today, ${counts.overdue} overdue (${today})`,
    );
    return Response.json({
      dryRun: true,
      reason: webhook ? "DIGEST_DRY_RUN" : "no webhook",
      counts,
      today,
    });
  }

  const res = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  return Response.json({ posted: res.ok, status: res.status, counts, today });
}
