"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { CodeMark } from "@/components/CodeMark";
import { Tick } from "@/components/ui/Button";
import { CODES, type CodeId } from "@/lib/codes";
import {
  setSellerCode,
  rescheduleFollowUp,
  markFollowUpDone,
} from "@/app/actions/sellers";

/** Inline code changer. Changing the code recomputes the next follow-up. */
export function CodePicker({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  function pick(code: CodeId) {
    startTransition(async () => {
      await setSellerCode(id, code);
      setOpen(false);
      router.refresh();
    });
  }
  return (
    <>
      <button onClick={() => setOpen(true)} className="text-small font-semibold text-accent-text">
        Change
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Seller code">
        <div className="grid grid-cols-2 gap-1.5 pb-4">
          {CODES.map((c) => (
            <button
              key={c.id}
              onClick={() => pick(c.id)}
              disabled={pending}
              className={`h-11 flex items-center gap-2 px-2.5 bg-raised rounded-2 text-[13px] text-ink whitespace-nowrap overflow-hidden border ${
                c.id === current ? "border-ink font-bold" : "border-line-strong font-medium"
              }`}
            >
              <CodeMark mark={c.mark} size={9} />
              {c.short}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}

/** Manual follow-up date override (native date picker). */
export function RescheduleControl({ id, currentDate }: { id: string; currentDate: string | null }) {
  const router = useRouter();
  const ref = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  function open() {
    const el = ref.current;
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  }
  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const date = e.target.value;
    if (!date) return;
    startTransition(async () => {
      await rescheduleFollowUp(id, date);
      router.refresh();
    });
  }
  return (
    <div className="relative">
      <button
        onClick={open}
        disabled={pending}
        className="h-11 flex items-center px-3.5 border border-line-strong rounded-2 text-[14px] font-semibold hover:bg-paper"
      >
        Reschedule
      </button>
      <input
        ref={ref}
        type="date"
        defaultValue={currentDate ?? undefined}
        onChange={onChange}
        className="absolute left-0 bottom-0 w-px h-px opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}

/** Bottom action bar: WhatsApp / Call / Done. */
export function SellerActionBar({ id, tel }: { id: string; tel: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  function markDone() {
    startTransition(async () => {
      await markFollowUpDone(id);
      setDone(true);
      router.refresh();
    });
  }
  return (
    <div
      className="fixed md:static left-0 right-0 bottom-0 bg-surface border-t border-line md:border-0 px-4 md:px-0 pt-3 md:pt-6 grid grid-cols-[1fr_72px_72px] gap-2 z-30"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <Link
        href={`/sellers/${id}/message`}
        className="h-12 rounded-2 bg-accent text-accent-ink font-semibold text-[15px] flex items-center justify-center hover:bg-accent-hover"
      >
        WhatsApp
      </Link>
      <a
        href={tel}
        className="h-12 rounded-2 border border-line-strong text-ink font-semibold text-[14px] flex items-center justify-center hover:bg-paper"
      >
        Call
      </a>
      <button
        onClick={markDone}
        disabled={pending || done}
        className={`h-12 rounded-2 font-semibold text-[14px] flex items-center justify-center gap-2 ${
          done ? "bg-ink text-paper" : "border border-line-strong text-ink hover:bg-paper"
        }`}
      >
        {done ? <Tick /> : null}
        Done
      </button>
    </div>
  );
}
