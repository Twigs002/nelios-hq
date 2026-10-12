import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSeller, getContactLogs } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { formatDate, sqm } from "@/lib/format";
import { decorateSeller } from "@/lib/view";
import { CodeMark } from "@/components/CodeMark";
import { CodePicker, RescheduleControl, SellerActionBar } from "@/components/SellerClient";

export default async function SellerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;
  const row = await getSeller(id);
  if (!row) notFound();
  const today = todayInJohannesburg();
  const s = decorateSeller(row, today);
  const logs = await getContactLogs(id);

  const facts: { k: string; v: string }[] = [
    { k: "Type", v: row.propertyType ?? "-" },
    { k: "Bedrooms", v: row.beds != null ? String(row.beds) : "-" },
    { k: "Bathrooms", v: row.baths != null ? String(row.baths) : "-" },
    { k: "Erf", v: sqm(row.erfSizeM2) },
    { k: "Floor", v: sqm(row.floorSizeM2) },
    { k: "Parking", v: row.parking != null ? String(row.parking) : "-" },
  ];

  return (
    <main className="max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="h-11 flex items-center px-3 text-[15px] font-semibold">
        <Link href="/board" className="flex items-center gap-1 text-accent-text px-2 h-11">
          <span className="text-[22px] leading-none -mt-0.5">‹</span>Board
        </Link>
      </div>

      <div className="px-6 md:px-8 pb-[140px] md:pb-10 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 text-[13px] leading-[18px] font-medium text-ink-2">
            <span className="flex items-center gap-2">
              <CodeMark mark={s.mark} size={10} />
              <span className="font-semibold text-ink">{s.codeLabel}</span>
              <span className="text-ink-3">· {s.codeCadence}</span>
            </span>
            <CodePicker id={s.id} current={s.code} />
          </div>
          <h1 className="text-h1">{s.name}</h1>
          <span className="text-[15px] leading-[22px] text-ink-2">
            {s.place}
            <br />
            <span className="tnum">{s.phoneFmt}</span>
          </span>
        </div>

        {/* Valuation card */}
        {s.hasValuation && (
          <div className="bg-surface border border-line rounded-3 shadow-1 p-5 flex flex-col gap-1.5">
            <div className="flex justify-between label">
              <span>Valuation · {s.valType}</span>
              <span>{s.valDate}</span>
            </div>
            <span className="text-[40px] leading-[48px] font-medium tracking-[-0.025em] tnum">{s.valValue}</span>
            <span className="text-[14px] leading-5 text-ink-2 tnum">Range {s.valRange}</span>
            <Link
              href={`/sellers/${s.id}/snapshot`}
              className="mt-3 h-12 w-full rounded-2 bg-accent text-accent-ink font-semibold text-[15px] flex items-center justify-center hover:bg-accent-hover"
            >
              Create snapshot
            </Link>
          </div>
        )}

        {/* Next follow-up */}
        <div className="flex justify-between items-center pb-6 border-b border-line">
          <div className="flex flex-col gap-1">
            <span className="label">Next follow-up</span>
            <span className="text-[17px] leading-[22px] font-semibold">{s.nextDate}</span>
            <span className="text-label" style={{ color: s.dueColor }}>{s.dueLabel}</span>
          </div>
          <RescheduleControl id={s.id} currentDate={s.nextFollowUpDate} />
        </div>

        {/* Facts */}
        <div className="grid grid-cols-3 gap-4">
          {facts.map((f) => (
            <div key={f.k} className="flex flex-col gap-0.5">
              <span className="text-[10px] leading-[14px] font-bold tracking-[0.14em] uppercase text-ink-3">{f.k}</span>
              <span className="text-[15px] leading-5 font-medium tnum">{f.v}</span>
            </div>
          ))}
        </div>

        {/* Contact history */}
        <div className="flex flex-col gap-4 pt-6 border-t border-line">
          <span className="label">Contact history</span>
          {logs.length === 0 ? (
            <span className="text-body text-ink-3">No contact logged yet.</span>
          ) : (
            logs.map((e) => (
              <div key={e.id} className="grid grid-cols-[16px_1fr] gap-3">
                <span className="w-[7px] h-[7px] mt-1.5 border-[1.5px] border-ink-2" />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] leading-4 font-semibold text-ink-3">
                    {formatDate(e.date)} · {e.channel}
                  </span>
                  {e.note && <span className="text-[14px] leading-5 text-ink-2">{e.note}</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="md:px-8 md:max-w-2xl md:mx-auto">
        <SellerActionBar id={s.id} tel={`tel:${s.cell}`} />
      </div>
    </main>
  );
}
