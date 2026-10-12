import type { CodeMark as Mark } from "@/lib/codes";

/** The seller-code mark (shape + colour). Always rendered next to its label. */
export function CodeMark({ mark, size = 10 }: { mark: Mark; size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: "none",
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: mark.borderRadius,
        background: mark.background,
        transform: mark.transform,
        clipPath: mark.clipPath === "none" ? undefined : mark.clipPath,
        boxShadow: mark.boxShadow === "none" ? undefined : mark.boxShadow,
      }}
    />
  );
}

/**
 * The due-state square (overdue = filled red, today = filled yellow,
 * upcoming = outline). 7px by default per the design.
 */
export function DueMark({
  bg,
  border,
  size = 7,
}: {
  bg: string;
  border: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{
        flex: "none",
        display: "inline-block",
        width: size,
        height: size,
        background: bg,
        boxShadow: border === "transparent" ? undefined : `inset 0 0 0 1px ${border}`,
      }}
    />
  );
}
