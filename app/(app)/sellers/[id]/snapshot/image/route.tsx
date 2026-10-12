// Branded valuation snapshot - 1080×1350 PNG. Rendered with Satori (next/og).
// Node runtime so the vendored woff files resolve via import.meta.url.
import type { NextRequest } from "next/server";
import { requireUserOr401 } from "@/lib/session";
import { buildSnapshotData, renderSnapshotImage } from "@/lib/snapshot/render";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireUserOr401();
  } catch (e) {
    if (e instanceof Response) return e;
    throw e;
  }

  const { id } = await params;
  const data = await buildSnapshotData(id);
  if (!data) return new Response("Not found", { status: 404 });

  return renderSnapshotImage(data);
}
