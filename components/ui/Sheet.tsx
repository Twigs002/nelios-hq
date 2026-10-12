"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Bottom sheet: 16px top corners, grabber, title + Cancel, overlay. Opens in
// 220ms ease-out; overlay fades in 180ms. Close via Cancel, overlay or Escape.
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => setVisible(true));
      document.body.style.overflow = "hidden";
      return () => cancelAnimationFrame(t);
    }
    setVisible(false);
    document.body.style.overflow = "";
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        onClick={onClose}
        className="absolute inset-0 bg-overlay transition-opacity duration-[180ms]"
        style={{ opacity: visible ? 1 : 0 }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute left-0 right-0 bottom-0 bg-surface rounded-t-4 shadow-sheet flex flex-col max-h-[92dvh]"
        style={{
          transform: visible ? "translateY(0)" : "translateY(100%)",
          transition: "transform var(--dur-sheet) var(--ease)",
          paddingBottom: "max(24px, env(safe-area-inset-bottom))",
        }}
      >
        <div className="px-6 pt-2">
          <span className="block mx-auto w-9 h-1 rounded-full bg-line-strong" />
          <div className="flex justify-between items-baseline mt-4">
            <span className="text-h2">{title}</span>
            <button onClick={onClose} className="text-[15px] font-semibold text-ink-2 py-1">
              Cancel
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 pt-4">{children}</div>
        {footer && <div className="px-6 pt-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
