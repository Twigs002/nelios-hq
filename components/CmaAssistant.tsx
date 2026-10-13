"use client";

// AI CMA assistant. "Draft" asks Claude for a valuation proposal; nothing is
// written. Nelio reviews the range, recommended price and rationale, then
// "Apply" writes the figures onto the seller and moves to the snapshot. The AI
// never publishes on its own. Styled with the same token utilities as the rest
// of the app; nothing global is touched.
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { draftCma, applyCma } from "@/app/actions/cma";
import { rand, valueRange } from "@/lib/format";
import type { CmaDraft, Confidence } from "@/lib/cma/types";

const CONF_LABEL: Record<Confidence, string> = {
  low: "Low confidence",
  medium: "Medium confidence",
  high: "High confidence",
};

export function CmaAssistant({
  sellerId,
  hasComps,
  demo = false,
}: {
  sellerId: string;
  hasComps: boolean;
  demo?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [applying, startApply] = useTransition();
  const [draft, setDraft] = useState<CmaDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  function run() {
    setError(null);
    startTransition(async () => {
      const r = await draftCma(sellerId);
      if (r.ok) setDraft(r.draft);
      else {
        setDraft(null);
        setError(r.error);
      }
    });
  }

  function apply() {
    if (!draft) return;
    setError(null);
    startApply(async () => {
      const r = await applyCma(sellerId, draft);
      if (r.ok) {
        router.push(`/sellers/${sellerId}/snapshot`);
        router.refresh();
      } else {
        setError(r.error ?? "Could not apply.");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="label">{demo ? "Draft (demo)" : "AI draft"}</span>
        <span className="text-small text-ink-2">
          {demo
            ? "This demo builds a sample estimate from the comparable sales above. The live tool uses Claude for a fuller draft. Nothing is published on its own."
            : "Drafts a valuation from the comparable sales above, for you to review. It never publishes on its own."}
        </span>
      </div>

      <button
        type="button"
        onClick={run}
        disabled={pending || !hasComps}
        className="h-11 rounded-2 bg-accent text-accent-ink font-semibold text-[14px] hover:bg-accent-hover disabled:opacity-40"
      >
        {pending
          ? "Drafting..."
          : draft
            ? "Draft again"
            : demo
              ? "Draft sample CMA"
              : "Draft CMA with AI"}
      </button>

      {!hasComps && (
        <span className="text-small text-ink-3">
          Add at least one comparable sale to enable AI drafting.
        </span>
      )}

      {error && <span className="text-small text-signal">{error}</span>}

      {draft && (
        <div className="flex flex-col gap-4 border border-line rounded-3 bg-surface p-5">
          <div className="flex items-baseline justify-between gap-2">
            <span className="label">Recommended asking</span>
            <span className="flex items-center gap-2">
              {draft.demo && (
                <span className="text-[10px] font-bold tracking-[0.1em] uppercase text-accent-text bg-accent-soft rounded-full px-2 py-0.5">
                  Sample
                </span>
              )}
              <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-ink-3">
                {CONF_LABEL[draft.confidence]}
              </span>
            </span>
          </div>
          <span className="text-[36px] leading-[42px] font-medium tracking-[-0.025em] tnum">
            {rand(draft.recommendedPrice)}
          </span>
          <span className="text-[14px] leading-5 text-ink-2 tnum">
            Range {valueRange(draft.valueLow, draft.valueHigh)}
          </span>

          {draft.confidenceReason && (
            <p className="text-[13px] leading-5 text-ink-3">{draft.confidenceReason}</p>
          )}

          <div className="flex flex-col gap-1 pt-1 border-t border-line">
            <span className="label">Rationale</span>
            <p className="text-[14px] leading-6 text-ink-2 whitespace-pre-line">{draft.rationale}</p>
          </div>

          {draft.compNotes.length > 0 && (
            <div className="flex flex-col gap-2 pt-1 border-t border-line">
              <span className="label">On the comparables</span>
              {draft.compNotes.map((n, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  <span className="text-[13px] font-semibold text-ink">
                    {n.address.split(",")[0]}
                  </span>
                  <span className="text-[13px] leading-5 text-ink-2">{n.note}</span>
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={apply}
            disabled={applying}
            className="mt-1 h-12 w-full rounded-2 bg-ink text-paper font-semibold text-[15px] hover:opacity-90 disabled:opacity-40"
          >
            {applying ? "Applying..." : "Apply to valuation"}
          </button>
          <span className="text-small text-ink-3">
            Applying writes these figures to the seller and opens the snapshot. You
            can still edit them there.
          </span>
        </div>
      )}
    </div>
  );
}
