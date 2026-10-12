import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/session";
import { getDueSellers } from "@/lib/queries";
import { todayInJohannesburg } from "@/lib/followup";
import { formatDayLabel } from "@/lib/format";
import { decorateSeller } from "@/lib/view";
import { CodeMark, DueMark } from "@/components/CodeMark";
import { RowActions } from "@/components/RowActions";

export default async function TodayPage() {
  await requireUser();
  const today = todayInJohannesburg();
  const due = (await getDueSellers(today)).map((s) => decorateSeller(s, today));
  const overdue = due.filter((s) => s.dueState === "overdue").length;
  const dueToday = due.filter((s) => s.dueState === "today").length;

  return (
    <main className="px-6 md:px-8 pt-6 md:pt-10 max-w-3xl">
      <div className="flex justify-between items-center gap-4 pb-2 md:hidden">
        <Image src="/brand/quay1-logo-blue.png" alt="Quay 1 International Realty" width={104} height={28} className="w-[104px] h-auto" priority />
        <span className="label whitespace-nowrap">{formatDayLabel(today)}</span>
      </div>
      <span className="label hidden md:block">{formatDayLabel(today)}</span>
      <h1 className="text-h1 mt-1">Good morning, Nelio.</h1>

      <div className="mt-6 pb-6 border-b border-line-strong flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <span className="text-[64px] leading-[56px] font-medium tracking-[-0.04em] tnum">{due.length}</span>
          <span className="text-[15px] leading-5 text-ink-2 whitespace-nowrap">follow-ups due</span>
        </div>
        <div className="flex flex-col gap-1.5 items-end text-[13px] leading-[18px] font-medium">
          <span className="flex items-center gap-2 text-signal">
            <span className="w-[7px] h-[7px] bg-signal" />
            {overdue} overdue
          </span>
          <span className="flex items-center gap-2 text-ink-2">
            <span className="w-[7px] h-[7px] bg-highlight" />
            {dueToday} due today
          </span>
        </div>
      </div>

      {due.length === 0 ? (
        <p className="mt-8 text-body text-ink-2">Nothing due today. You are all caught up.</p>
      ) : (
        <div>
          {due.map((s) => (
            <div key={s.id} className="py-5 border-b border-line flex flex-col gap-3">
              <div className="flex justify-between items-center gap-2">
                <span
                  className="flex items-center gap-2 text-label"
                  style={{ color: s.dueColor }}
                >
                  <DueMark bg={s.dueMarkBg} border={s.dueMarkBorder} />
                  <span
                    style={{
                      textDecorationLine: s.dueDeco,
                      textDecorationColor: "var(--highlight)",
                      textDecorationThickness: "2px",
                      textUnderlineOffset: "5px",
                    }}
                  >
                    {s.dueLabel}
                  </span>
                </span>
                <span className="text-[12px] leading-4 font-medium text-ink-3">{s.lastLabel}</span>
              </div>
              <Link href={`/sellers/${s.id}`} className="flex flex-col gap-0.5">
                <span className="text-[19px] leading-6 font-semibold tracking-[-0.005em] text-ink">{s.name}</span>
                <span className="text-[14px] leading-5 text-ink-2">{s.place}</span>
              </Link>
              <div className="flex gap-4 flex-wrap text-[13px] leading-[18px] font-medium text-ink-2">
                <span className="flex items-center gap-2">
                  <CodeMark mark={s.mark} size={10} />
                  <span className="font-semibold text-ink">{s.codeLabel}</span>
                  <span className="text-ink-3">· {s.codeCadence}</span>
                </span>
              </div>
              <RowActions id={s.id} first={s.first} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
