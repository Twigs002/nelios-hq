// Branded valuation snapshot - one-page PDF. We render the same Satori PNG and
// drop it full-bleed onto a single 1080×1350 page with pdf-lib, so the PDF is
// pixel-identical to the PNG a seller sees in the preview.
import type { NextRequest } from "next/server";
import { PDFDocument } from "pdf-lib";
import { requireUserOr401 } from "@/lib/session";
import { buildSnapshotData, renderSnapshotImage } from "@/lib/snapshot/render";

export const runtime = "nodejs";

/** Filename-safe slug from the suburb (first segment of the subtitle). */
function suburbSlug(subtitle: string): string {
  const suburb = subtitle.split(",")[0] ?? "snapshot";
  return (
    suburb
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "snapshot"
  );
}

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

  const png = new Uint8Array(await (await renderSnapshotImage(data)).arrayBuffer());

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([1080, 1350]);
  const image = await pdf.embedPng(png);
  page.drawImage(image, { x: 0, y: 0, width: 1080, height: 1350 });
  const bytes = await pdf.save();

  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="valuation-${suburbSlug(data.subtitle)}.pdf"`,
    },
  });
}
