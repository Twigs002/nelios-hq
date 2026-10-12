import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSeller, getComps } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { decorateSeller } from "@/lib/view";
import { CompsEditor } from "@/components/CompsEditor";
import { ShareSnapshot } from "@/components/ShareSnapshot";

export default async function SnapshotPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const row = await getSeller(id);
  if (!row) notFound();
  const s = decorateSeller(row, todayInJohannesburg());

  const back = (
    <div className="h-11 flex items-center px-3 text-[15px] font-semibold">
      <Link href={`/sellers/${id}`} className="flex items-center gap-1 text-accent-text px-2 h-11">
        <span className="text-[22px] leading-none -mt-0.5">‹</span>Seller
      </Link>
    </div>
  );

  // A snapshot only makes sense with a valuation on the seller.
  if (!s.hasValuation) {
    return (
      <main className="max-w-2xl mx-auto">
        {back}
        <div className="px-6 md:px-8 py-10 flex flex-col gap-3">
          <h1 className="text-h1">No valuation yet</h1>
          <p className="text-body text-ink-2">
            Add a recommended price and value range for {s.name} before creating a snapshot.
          </p>
          <Link href={`/sellers/${id}`} className="text-accent-text font-semibold">
            Back to seller
          </Link>
        </div>
      </main>
    );
  }

  const comps = await getComps(id);
  // Cache-bust the preview from the comps' CONTENT (not just the count), so a
  // delete-then-add that leaves the count unchanged still refreshes the image.
  const sig = comps.map((c) => `${c.id}${c.saleDate}${c.price}${c.sizeM2}${c.status}`).join("|");
  let v = comps.length;
  for (let i = 0; i < sig.length; i++) v = (v * 33 + sig.charCodeAt(i)) >>> 0;
  const imgSrc = `/sellers/${id}/snapshot/image?v=${v}`;
  const pngFilename = `valuation-${s.suburb.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "snapshot"}.png`;

  return (
    <main className="max-w-2xl mx-auto">
      {back}
      <div className="px-6 md:px-8 pb-16 flex flex-col gap-8">
        <div className="flex flex-col gap-1">
          <h1 className="text-h1">Valuation snapshot</h1>
          <span className="text-body text-ink-2">
            {s.address}, {s.suburb}
          </span>
        </div>

        <CompsEditor sellerId={id} comps={comps} />

        {/* Preview */}
        <div className="flex flex-col gap-3">
          <span className="label">Preview</span>
          <div className="w-full max-w-[360px] mx-auto border border-line rounded-3 overflow-hidden shadow-1 bg-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imgSrc}
              alt="Valuation snapshot preview"
              width={1080}
              height={1350}
              style={{ width: "100%", height: "auto", aspectRatio: "1080 / 1350", display: "block" }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2.5 max-w-[360px] mx-auto w-full">
          <ShareSnapshot src={imgSrc} filename={pngFilename} />
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={imgSrc}
              download={pngFilename}
              className="h-12 rounded-2 border border-line-strong bg-transparent text-ink font-semibold text-[14px] flex items-center justify-center hover:bg-paper"
            >
              Download PNG
            </a>
            <a
              href={`/sellers/${id}/snapshot/pdf`}
              className="h-12 rounded-2 border border-line-strong bg-transparent text-ink font-semibold text-[14px] flex items-center justify-center hover:bg-paper"
            >
              Download PDF
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
