import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/session";
import { getSeller, getTemplates, getAgent } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { decorateSeller } from "@/lib/view";
import { MessagePicker } from "@/components/MessagePicker";

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const row = await getSeller(id);
  if (!row) notFound();
  const s = decorateSeller(row, todayInJohannesburg());
  const [templates, agent] = await Promise.all([getTemplates(), getAgent()]);

  return (
    <main>
      <div className="h-11 flex items-center px-3 text-[15px] font-semibold">
        <Link href={`/sellers/${id}`} className="flex items-center gap-1 text-accent-text px-2 h-11">
          <span className="text-[22px] leading-none -mt-0.5">‹</span>Seller
        </Link>
      </div>
      <MessagePicker
        seller={{
          id: s.id,
          name: s.name,
          first: s.first,
          address: s.address,
          suburb: s.suburb,
          valRange: s.valRange,
          phoneFmt: s.phoneFmt,
          cell: s.cell,
        }}
        templates={templates.map((t) => ({ id: t.id, name: t.name, body: t.body, whenHint: t.whenHint }))}
        agentName={agent.name}
      />
    </main>
  );
}
