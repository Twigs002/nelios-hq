"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { SellerView } from "@/lib/view";
import { CodeMark, DueMark } from "@/components/CodeMark";
import { CODES } from "@/lib/codes";
import { markFollowUpDone } from "@/app/actions/sellers";

type DueKey = "overdue" | "today" | "upcoming";
const DUE_CHIPS: { key: DueKey; label: string }[] = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "upcoming", label: "Upcoming" },
];

export function Board({
  sellers,
  counts,
}: {
  sellers: SellerView[];
  counts: { total: number; overdue: number; today: number };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [due, setDue] = useState<Set<DueKey>>(new Set());
  const [codes, setCodes] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return sellers.filter((s) => {
      if (q && !(`${s.name} ${s.address} ${s.suburb}`.toLowerCase().includes(q))) return false;
      if (due.size && !(s.dueState !== "none" && due.has(s.dueState as DueKey))) return false;
      if (codes.size && !codes.has(s.code)) return false;
      return true;
    });
  }, [sellers, query, due, codes]);

  const hasFilters = query || due.size || codes.size;
  function clear() {
    setQuery("");
    setDue(new Set());
    setCodes(new Set());
  }
  function toggle<T>(set: Set<T>, v: T, setter: (s: Set<T>) => void) {
    const next = new Set(set);
    next.has(v) ? next.delete(v) : next.add(v);
    setter(next);
  }
  function done(id: string) {
    startTransition(async () => {
      await markFollowUpDone(id);
      router.refresh();
    });
  }

  const chip = (selected: boolean) =>
    `flex items-center gap-2 h-8 px-2.5 whitespace-nowrap rounded-2 text-[13px] border ${
      selected
        ? "border-highlight-edge bg-highlight-soft text-ink font-semibold"
        : "border-line-strong text-ink-2 font-medium"
    }`;

  return (
    <main className="px-6 md:px-8 pt-6 md:pt-10">
      <div className="flex justify-between items-end gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-h1 md:text-[32px] md:leading-[38px]">Valuations board</h1>
          <div className="flex gap-5 text-[13px] leading-[18px] font-medium text-ink-2 tnum">
            <span>{counts.total} sellers</span>
            <span className="flex items-center gap-2 text-signal">
              <span className="w-[7px] h-[7px] bg-signal" />
              {counts.overdue} overdue
            </span>
            <span className="flex items-center gap-2">
              <span className="w-[7px] h-[7px] bg-highlight" />
              {counts.today} due today
            </span>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mt-4 h-11 border border-line-strong rounded-2 bg-raised flex items-center gap-3 px-3.5 md:max-w-[420px]">
        <span className="w-[13px] h-[13px] border-[1.5px] border-ink-3 rounded-full flex-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, address, suburb"
          className="w-full bg-transparent outline-none text-[15px] placeholder:text-ink-3"
        />
      </div>

      {/* Filters */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
        {DUE_CHIPS.map((d) => (
          <button key={d.key} onClick={() => toggle(due, d.key, setDue)} className={chip(due.has(d.key))}>
            {d.label}
          </button>
        ))}
        <span className="w-px h-6 bg-line flex-none mx-1" />
        {CODES.map((c) => (
          <button key={c.id} onClick={() => toggle(codes, c.id, setCodes)} className={chip(codes.has(c.id))}>
            <CodeMark mark={c.mark} size={9} />
            {c.short}
          </button>
        ))}
      </div>

      <div className="mt-3 flex justify-between items-center">
        <span className="label">By next follow-up</span>
        {hasFilters && (
          <button onClick={clear} className="label text-accent-text">
            Clear
          </button>
        )}
      </div>

      {/* Mobile cards */}
      <div className="mt-3 flex flex-col gap-3 md:hidden">
        {filtered.map((s) => (
          <Link
            key={s.id}
            href={`/sellers/${s.id}`}
            className="bg-surface border border-line rounded-3 shadow-1 p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-start gap-3">
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-[17px] leading-[22px] font-semibold">{s.name}</span>
                <span className="text-[13px] leading-[18px] text-ink-2">{s.place}</span>
              </div>
            </div>
            <div className="flex justify-between items-end gap-3 pt-3 border-t border-line">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] leading-[14px] font-bold tracking-[0.14em] uppercase text-ink-3">
                  {s.valType} · {s.valDate}
                </span>
                <span className="text-[22px] leading-[26px] font-medium tracking-[-0.02em] tnum">{s.valValue}</span>
              </div>
              <div className="flex flex-col gap-1.5 items-end">
                <span className="flex items-center gap-1.5 text-[10px] leading-[14px] font-bold tracking-[0.12em] uppercase" style={{ color: s.dueColor }}>
                  <DueMark bg={s.dueMarkBg} border={s.dueMarkBorder} size={6} />
                  <span
                    style={{
                      textDecorationLine: s.dueDeco,
                      textDecorationColor: "var(--highlight)",
                      textDecorationThickness: "2px",
                      textUnderlineOffset: "4px",
                    }}
                  >
                    {s.dueShort}
                  </span>
                </span>
                <span className="flex items-center gap-[7px] text-[12px] leading-4 font-semibold text-ink-2 whitespace-nowrap">
                  <CodeMark mark={s.mark} size={9} />
                  {s.codeShort}
                </span>
              </div>
            </div>
          </Link>
        ))}
        {filtered.length === 0 && <p className="text-body text-ink-2 py-8">No sellers match.</p>}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block mt-4 bg-surface border border-line rounded-3 shadow-1 overflow-hidden">
        <div className="grid grid-cols-[1fr_1.25fr_188px_124px_64px_112px_152px] gap-x-3 items-center h-11 px-5 border-b border-line-strong label">
          <span>Seller</span>
          <span>Property</span>
          <span>Code</span>
          <span className="text-right">Valuation</span>
          <span>Last</span>
          <span className="text-ink">Next follow-up</span>
          <span />
        </div>
        {filtered.map((s) => (
          <div key={s.id} className="grid grid-cols-[1fr_1.25fr_188px_124px_64px_112px_152px] gap-x-3 items-center h-[68px] px-5 border-b border-line hover:bg-paper">
            <Link href={`/sellers/${s.id}`} className="flex flex-col min-w-0">
              <span className="text-[14px] leading-5 font-semibold truncate">{s.name}</span>
              <span className="text-[12px] leading-4 text-ink-3 tnum truncate">{s.phoneFmt}</span>
            </Link>
            <div className="flex flex-col min-w-0">
              <span className="text-[14px] leading-5 truncate">{s.address}</span>
              <span className="text-[12px] leading-4 text-ink-3">{s.suburb}</span>
            </div>
            <span className="flex items-center gap-2 min-w-0">
              <CodeMark mark={s.mark} size={10} />
              <span className="flex flex-col min-w-0">
                <span className="text-[13px] leading-[18px] font-semibold whitespace-nowrap">{s.codeShort}</span>
                <span className="text-[11px] leading-4 text-ink-3 whitespace-nowrap">{s.codeCadence}</span>
              </span>
            </span>
            <div className="flex flex-col items-end tnum">
              <span className="text-[15px] leading-5 font-semibold whitespace-nowrap">{s.valValue}</span>
              <span className="text-[11px] leading-4 text-ink-3 whitespace-nowrap">{s.valType} · {s.valDate}</span>
            </div>
            <span className="text-[13px] text-ink-2 tnum">{s.lastShort}</span>
            <span className="flex items-center gap-[7px] text-[11px] leading-4 font-bold tracking-[0.1em] uppercase whitespace-nowrap" style={{ color: s.dueColor }}>
              <DueMark bg={s.dueMarkBg} border={s.dueMarkBorder} />
              <span
                style={{
                  textDecorationLine: s.dueDeco,
                  textDecorationColor: "var(--highlight)",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "4px",
                }}
              >
                {s.dueShort}
              </span>
            </span>
            <div className="flex gap-1.5 justify-end">
              <Link
                href={`/sellers/${s.id}/message`}
                className="h-9 px-3.5 rounded-2 bg-accent text-accent-ink font-semibold text-[13px] flex items-center hover:bg-accent-hover"
              >
                WhatsApp
              </Link>
              <button
                onClick={() => done(s.id)}
                disabled={pending}
                className="h-9 px-3 rounded-2 border border-line-strong text-ink font-semibold text-[13px] hover:bg-paper"
              >
                Done
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-body text-ink-2 p-6">No sellers match.</p>}
      </div>
    </main>
  );
}
