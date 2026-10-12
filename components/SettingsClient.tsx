"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/Switch";
import { setConfirmed } from "@/app/actions/settings";
import { runCalendarSync } from "@/app/actions/calendar";
import type { SyncResult } from "@/lib/google/calendar";

/** A "confirmed with Nelio" toggle for one settings group. */
export function ConfirmToggle({ settingKey, confirmed }: { settingKey: string; confirmed: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [on, setOn] = useState(confirmed);
  function toggle(next: boolean) {
    setOn(next);
    startTransition(async () => {
      await setConfirmed(settingKey, next);
      router.refresh();
    });
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-small text-ink-3">{on ? "Confirmed" : "Confirm"}</span>
      <Switch checked={on} onChange={toggle} disabled={pending} label={`Confirm ${settingKey}`} />
    </div>
  );
}

/** Calendar sync preview / run. Mode is driven by env (shown read-only). */
export function CalendarSync({ enabled, dryRun }: { enabled: boolean; dryRun: boolean }) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);

  function run() {
    startTransition(async () => {
      setResult(await runCalendarSync());
    });
  }

  const counts = (r: SyncResult) => {
    const c = { create: 0, update: 0, delete: 0, noop: 0 } as Record<string, number>;
    for (const p of r.plan) c[p.action]++;
    return c;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-small">
        <span className={`px-2 py-0.5 rounded-1 font-semibold ${enabled ? "bg-highlight-soft text-ink" : "bg-line text-ink-3"}`}>
          {enabled ? "Sync on" : "Sync off"}
        </span>
        <span className={`px-2 py-0.5 rounded-1 font-semibold ${dryRun ? "bg-accent-soft text-accent-text" : "bg-signal/10 text-signal"}`}>
          {dryRun ? "Dry run" : "Live writes"}
        </span>
      </div>
      <button
        onClick={run}
        disabled={pending}
        className="h-11 w-fit px-5 rounded-2 border border-line-strong text-ink font-semibold text-[14px] hover:bg-paper"
      >
        {pending ? "Checking…" : dryRun ? "Preview sync (dry run)" : "Sync now"}
      </button>

      {result && (
        <div className="rounded-3 border border-line bg-surface p-4 flex flex-col gap-2">
          {result.note && <span className="text-small text-ink-2">{result.note}</span>}
          <div className="flex gap-4 text-small tnum">
            {Object.entries(counts(result)).map(([k, v]) => (
              <span key={k} className="text-ink-2">
                {k}: <span className="font-semibold text-ink">{v}</span>
              </span>
            ))}
          </div>
          {!result.dryRun && <span className="text-small text-ink-2">Applied {result.applied} change(s).</span>}
          {result.errors.length > 0 && (
            <span className="text-small text-signal">{result.errors.length} error(s).</span>
          )}
          <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
            {result.plan
              .filter((p) => p.action !== "noop")
              .map((p) => (
                <span key={p.sellerId} className="text-small text-ink-2">
                  <span className="font-semibold text-ink">{p.action}</span> · {p.name}
                  {p.date ? ` · ${p.date}` : ""}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
