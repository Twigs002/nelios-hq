"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sheet } from "@/components/ui/Sheet";
import { CodeMark } from "@/components/CodeMark";
import { CODES } from "@/lib/codes";
import { computeNextFollowUp, todayInJohannesburg } from "@/lib/followup";
import { formatDate } from "@/lib/format";
import { createSeller } from "@/app/actions/sellers";

export function QuickAddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("hot");
  const [valType, setValType] = useState<"PV" | "DV">("PV");

  const previewDate = formatDate(computeNextFollowUp(code as never, todayInJohannesburg()));
  const previewCadence = CODES.find((c) => c.id === code)?.cadence ?? "";

  function submit() {
    const form = formRef.current;
    if (!form) return;
    setError(null);
    const fd = new FormData(form);
    fd.set("code", code);
    fd.set("valuationType", valType);
    startTransition(async () => {
      const r = await createSeller(fd);
      if (r.ok && r.id) {
        onClose();
        router.push(`/sellers/${r.id}`);
        router.refresh();
      } else {
        setError(r.error ?? "Could not save.");
      }
    });
  }

  const labelCls = "label";
  const inputCls =
    "h-11 w-full px-3.5 bg-raised border border-line-strong rounded-2 text-[16px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] placeholder:text-ink-3";

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="New seller"
      footer={
        <div className="flex flex-col gap-2.5">
          {error && <span className="text-small text-signal">{error}</span>}
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="h-[52px] rounded-2 bg-accent text-accent-ink font-semibold text-[15px] hover:bg-accent-hover disabled:bg-line disabled:text-ink-3"
          >
            {pending ? "Saving…" : "Save seller"}
          </button>
          <span className="text-center text-small text-ink-3">
            Follow-up set for {previewDate} · {previewCadence}
          </span>
        </div>
      }
    >
      <form ref={formRef} className="flex flex-col gap-3.5" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Name</span>
          <input name="name" autoFocus required className={inputCls} placeholder="Full name" />
        </label>

        <div className="grid grid-cols-[1fr_96px] gap-2">
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className={labelCls}>Cell</span>
            <span className="h-11 flex items-center bg-raised border border-line-strong rounded-2 text-[16px] tnum focus-within:border-accent focus-within:shadow-[0_0_0_3px_var(--accent-soft)]">
              <span className="px-3 h-full flex items-center border-r border-line text-ink-2">+27</span>
              <input name="cell" inputMode="numeric" className="px-3 w-full bg-transparent outline-none" placeholder="82 123 4567" />
            </span>
          </label>
          <div className="flex flex-col gap-1.5">
            <span className={labelCls}>Type</span>
            <div className="h-11 grid grid-cols-2 border border-line-strong rounded-2 p-[3px] gap-[3px] bg-raised">
              {(["PV", "DV"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setValType(t)}
                  className={`grid place-items-center rounded-1 text-[13px] tracking-[0.06em] ${valType === t ? "bg-ink text-paper font-bold" : "text-ink-2 font-semibold"}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[1.6fr_1fr] gap-2">
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className={labelCls}>Address</span>
            <input name="address" className={inputCls} placeholder="Street address" />
          </label>
          <label className="flex flex-col gap-1.5 min-w-0">
            <span className={labelCls}>Suburb</span>
            <input name="suburb" className={inputCls} placeholder="Suburb" />
          </label>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={labelCls}>Code</span>
          <div className="grid grid-cols-2 gap-1.5">
            {CODES.map((c) => {
              const on = c.id === code;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCode(c.id)}
                  className={`h-10 flex items-center gap-2 px-2.5 bg-raised rounded-2 text-[13px] text-ink whitespace-nowrap overflow-hidden border ${on ? "border-ink font-bold" : "border-line-strong font-medium"}`}
                >
                  <CodeMark mark={c.mark} size={9} />
                  {c.short}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Sheet>
  );
}
