"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logContact } from "@/app/actions/sellers";

export interface PickerTemplate {
  id: string;
  name: string;
  body: string;
  whenHint: string | null;
}

export interface PickerSeller {
  id: string;
  name: string;
  first: string;
  address: string;
  suburb: string;
  valRange: string;
  phoneFmt: string;
  cell: string;
}

const MAX = 1000;

function fill(body: string, s: PickerSeller, agentName: string): string {
  return body
    .replaceAll("{first_name}", s.first)
    .replaceAll("{address}", s.address)
    .replaceAll("{suburb}", s.suburb)
    .replaceAll("{value_range}", s.valRange)
    .replaceAll("{agent_name}", agentName);
}

export function MessagePicker({
  seller,
  templates,
  agentName,
}: {
  seller: PickerSeller;
  templates: PickerTemplate[];
  agentName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState(templates[0]?.id ?? "");
  const [text, setText] = useState(templates[0] ? fill(templates[0].body, seller, agentName) : "");
  const [copied, setCopied] = useState(false);

  function choose(t: PickerTemplate) {
    setSelected(t.id);
    setText(fill(t.body, seller, agentName));
  }

  function openWhatsApp() {
    const name = templates.find((t) => t.id === selected)?.name;
    const href = `https://wa.me/${seller.cell.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
    // Open immediately (same user gesture) so the browser does not block it.
    window.open(href, "_blank", "noopener,noreferrer");
    startTransition(async () => {
      await logContact(seller.id, { channel: "WhatsApp", templateUsed: name });
      router.refresh();
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-6 md:px-8 pb-10 flex flex-col gap-4">
      <div className="flex justify-between items-start pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-h2">Message {seller.first}</span>
          <span className="text-small text-ink-3 tnum">{seller.phoneFmt}</span>
        </div>
        <Link href={`/sellers/${seller.id}`} className="text-[15px] font-semibold text-ink-2 py-1">
          Cancel
        </Link>
      </div>

      <div className="flex flex-col">
        <span className="label pb-1.5">Template</span>
        {templates.map((t) => {
          const on = t.id === selected;
          return (
            <button
              key={t.id}
              onClick={() => choose(t)}
              className={`h-[52px] flex items-center gap-3 px-3 -mx-3 rounded-2 text-left ${on ? "bg-accent-soft" : "bg-transparent"}`}
            >
              <span
                className="w-[18px] h-[18px] rounded-full grid place-items-center flex-none border-[1.5px]"
                style={{ borderColor: on ? "var(--accent)" : "var(--line-strong)" }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: on ? "var(--accent)" : "transparent" }} />
              </span>
              <span className="flex flex-col min-w-0">
                <span className="text-[15px] leading-5 font-semibold">{t.name}</span>
                {t.whenHint && <span className="text-[12px] leading-4 text-ink-3">{t.whenHint}</span>}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between label">
          <span>Preview · tap to edit</span>
          <span className="tnum">{text.length} / {MAX}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, MAX))}
          rows={6}
          className="bg-raised border border-line-strong rounded-2 p-4 text-[15px] leading-[23px] text-ink outline-none focus:border-accent focus:shadow-[0_0_0_3px_var(--accent-soft)] resize-none"
        />
      </div>

      <div className="flex flex-col gap-1 mt-2">
        <button
          onClick={openWhatsApp}
          disabled={pending || !text.trim()}
          className="h-[52px] rounded-2 bg-accent text-accent-ink font-semibold text-[15px] hover:bg-accent-hover disabled:bg-line disabled:text-ink-3"
        >
          Open in WhatsApp
        </button>
        <button onClick={copy} className="h-11 grid place-items-center text-[14px] font-semibold text-ink-2">
          {copied ? "Copied" : "Copy text"}
        </button>
        <p className="text-center text-small text-ink-3 mt-1">
          Opens WhatsApp with the text ready. You send it yourself.
        </p>
      </div>
    </div>
  );
}
