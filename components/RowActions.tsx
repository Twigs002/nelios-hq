"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { markFollowUpDone } from "@/app/actions/sellers";
import { Tick } from "@/components/ui/Button";

// WhatsApp opens the template picker (which deep-links to wa.me); Done logs
// the contact today and schedules the next follow-up.
export function RowActions({ id, first }: { id: string; first: string }) {
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
    <div className="flex gap-2">
      <Link
        href={`/sellers/${id}/message`}
        className="flex-1 h-11 rounded-2 bg-accent text-accent-ink font-semibold text-[14px] flex items-center justify-center hover:bg-accent-hover"
      >
        WhatsApp {first}
      </Link>
      <button
        onClick={markDone}
        disabled={pending || done}
        className={`w-24 h-11 rounded-2 font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors duration-[180ms] ${
          done ? "bg-ink text-paper" : "border border-line-strong text-ink hover:bg-paper"
        }`}
      >
        {done ? <Tick /> : null}
        Done
      </button>
    </div>
  );
}

/** wa.me link for a stored E.164 cell (strip the +). */
export function waLink(cell: string): string {
  return "https://wa.me/" + cell.replace(/\D/g, "");
}
