"use client";

// Comparable-sales editor for the snapshot page: a list of existing comps with
// per-row delete, an inline add-row form, and a paste-CSV import. Styled with
// the same token utilities as the quick-add sheet; nothing global is touched.
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComp, deleteComp, importCompsCsv } from "@/app/actions/comps";
import { rand, formatDateShort } from "@/lib/format";

export interface CompRow {
  id: string;
  address: string;
  saleDate: string | null;
  price: number | null;
  sizeM2: number | null;
  status: "Sold" | "Pending transfer";
}

const inputCls =
  "h-11 w-full px-3.5 bg-raised border border-line-strong rounded-2 text-[16px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] placeholder:text-ink-3";

export function CompsEditor({ sellerId, comps }: { sellerId: string; comps: CompRow[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [importResult, setImportResult] = useState<{ added: number; skipped: number } | null>(null);

  function add() {
    const form = formRef.current;
    if (!form) return;
    setError(null);
    const fd = new FormData(form);
    startTransition(async () => {
      const r = await addComp(sellerId, fd);
      if (r.ok) {
        form.reset();
        router.refresh();
      } else {
        setError(r.error ?? "Could not add.");
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteComp(id, sellerId);
      router.refresh();
    });
  }

  function doImport() {
    if (!csv.trim()) return;
    setImportResult(null);
    startTransition(async () => {
      const r = await importCompsCsv(sellerId, csv);
      setImportResult(r);
      if (r.added > 0) {
        setCsv("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="label">Comparable sales</span>

      {/* Existing comps */}
      {comps.length > 0 && (
        <div className="flex flex-col divide-y divide-line border border-line rounded-3 bg-surface">
          {comps.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink truncate">
                  {c.address.split(",")[0]}
                </div>
                <div className="text-[12px] text-ink-3 tnum">
                  {c.saleDate ? formatDateShort(c.saleDate) : "No date"}
                  {c.price != null ? ` · ${rand(c.price)}` : ""}
                  {c.sizeM2 != null ? ` · ${c.sizeM2} m²` : ""}
                  {c.status === "Pending transfer" ? " · Pending" : ""}
                </div>
              </div>
              <button
                type="button"
                aria-label="Delete comparable"
                onClick={() => remove(c.id)}
                disabled={pending}
                className="shrink-0 w-8 h-8 grid place-items-center rounded-full text-ink-3 hover:text-signal hover:bg-paper text-[18px] leading-none disabled:opacity-40"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add row */}
      <form
        ref={formRef}
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
        className="flex flex-col gap-2 border border-line rounded-3 bg-surface p-4"
      >
        <input name="address" required className={inputCls} placeholder="Street address" />
        <div className="grid grid-cols-3 gap-2">
          <input name="saleDate" type="date" className={inputCls} aria-label="Sold date" />
          <input name="price" inputMode="numeric" className={inputCls} placeholder="Price" />
          <input name="sizeM2" inputMode="numeric" className={inputCls} placeholder="Size m²" />
        </div>
        {error && <span className="text-small text-signal">{error}</span>}
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-2 bg-ink text-paper font-semibold text-[14px] hover:opacity-90 disabled:opacity-40"
        >
          Add comparable
        </button>
      </form>

      {/* CSV import */}
      <div className="flex flex-col gap-2 border border-line rounded-3 bg-surface p-4">
        <span className="text-small text-ink-2">
          Paste from a spreadsheet. Columns: address, sold date, price, size.
        </span>
        <textarea
          value={csv}
          onChange={(e) => setCsv(e.target.value)}
          rows={4}
          className="w-full px-3.5 py-2.5 bg-raised border border-line-strong rounded-2 text-[16px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] placeholder:text-ink-3 resize-y"
          placeholder={"12 Marine Drive, 2026-08-14, 8900000, 180\n8 Beach Road, 3 Jul 2026, 7650000, 165"}
        />
        {importResult && (
          <span className="text-small text-ink-2">
            Added {importResult.added}
            {importResult.skipped > 0 ? ` · skipped ${importResult.skipped}` : ""}.
          </span>
        )}
        <button
          type="button"
          onClick={doImport}
          disabled={pending || !csv.trim()}
          className="h-11 rounded-2 border border-line-strong bg-transparent text-ink font-semibold text-[14px] hover:bg-paper disabled:opacity-40"
        >
          Import CSV
        </button>
      </div>
    </div>
  );
}
