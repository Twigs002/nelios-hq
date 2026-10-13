import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSeller, getComps } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { sqm } from "@/lib/format";
import { decorateSeller } from "@/lib/view";
import { CompsEditor, type CompRow } from "@/components/CompsEditor";
import { CmaAssistant } from "@/components/CmaAssistant";

export default async function CmaPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const row = await getSeller(id);
  if (!row) notFound();
  const s = decorateSeller(row, todayInJohannesburg());
  const comps = await getComps(id);
  const compRows: CompRow[] = comps.map((c) => ({
    id: c.id,
    address: c.address,
    saleDate: c.saleDate,
    price: c.price,
    sizeM2: c.sizeM2,
    status: c.status,
  }));

  const facts = [
    row.propertyType ?? null,
    row.beds != null ? `${row.beds} bed` : null,
    row.baths != null ? `${row.baths} bath` : null,
    row.floorSizeM2 != null ? sqm(row.floorSizeM2) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <main className="max-w-2xl mx-auto">
      <div className="h-11 flex items-center px-3 text-[15px] font-semibold">
        <Link href={`/sellers/${id}`} className="flex items-center gap-1 text-accent-text px-2 h-11">
          <span className="text-[22px] leading-none -mt-0.5">‹</span>Seller
        </Link>
      </div>

      <div className="px-6 md:px-8 pb-24 md:pb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <span className="label">Comparative market analysis</span>
          <h1 className="text-h1">{s.name}</h1>
          <span className="text-[15px] leading-[22px] text-ink-2">
            {s.place}
            {facts ? (
              <>
                <br />
                {facts}
              </>
            ) : null}
          </span>
        </div>

        {s.hasValuation && (
          <div className="bg-surface border border-line rounded-3 p-4 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="label">Current valuation</span>
              <span className="text-[17px] font-semibold tnum">{s.valValue}</span>
              <span className="text-[13px] text-ink-2 tnum">Range {s.valRange}</span>
            </div>
            <Link
              href={`/sellers/${id}/snapshot`}
              className="text-accent-text font-semibold text-[14px]"
            >
              Snapshot
            </Link>
          </div>
        )}

        <CompsEditor sellerId={id} comps={compRows} />

        <div className="pt-6 border-t border-line">
          <CmaAssistant
            sellerId={id}
            hasComps={compRows.length > 0}
            demo={process.env.DEMO_DB === "true"}
          />
        </div>
      </div>
    </main>
  );
}
