"use client";

// Share button for the valuation snapshot. Fetches the PNG as a blob and uses
// the Web Share API with a File (so it goes straight into WhatsApp/Mail from a
// phone). Falls back to opening the PNG in a new tab where sharing files is not
// supported (most desktops).
import { useState } from "react";

export function ShareSnapshot({ src, filename }: { src: string; filename: string }) {
  const [busy, setBusy] = useState(false);

  async function share() {
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
    };
    // No file-share support (most desktops): open the PNG directly. Done
    // synchronously so the click's user-activation is not lost to a fetch.
    if (!nav.share || !nav.canShare) {
      window.open(src, "_blank", "noopener");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/png" });
      if (nav.canShare({ files: [file] })) {
        await nav.share({ files: [file], title: "Valuation snapshot" });
      } else {
        window.open(src, "_blank", "noopener");
      }
    } catch {
      // User cancelled the share sheet, or the fetch failed - nothing to do.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      disabled={busy}
      className="h-12 w-full rounded-2 bg-accent text-accent-ink font-semibold text-[15px] flex items-center justify-center hover:bg-accent-hover disabled:opacity-40"
    >
      {busy ? "Preparing…" : "Share"}
    </button>
  );
}
