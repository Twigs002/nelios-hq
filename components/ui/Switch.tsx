"use client";

// 48x28 pill track, round knob. On = accent (DESIGN.md).
export function Switch({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="relative w-12 h-7 rounded-full flex-none transition-colors duration-[150ms] disabled:opacity-60"
      style={{ background: checked ? "var(--accent)" : "var(--line-strong)" }}
    >
      <span
        className="absolute top-[3px] w-[22px] h-[22px] rounded-full transition-all duration-[150ms]"
        style={{
          left: checked ? "23px" : "3px",
          background: checked ? "var(--accent-ink)" : "var(--raised)",
        }}
      />
    </button>
  );
}
