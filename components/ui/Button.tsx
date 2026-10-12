import { forwardRef } from "react";
import Link from "next/link";

type Variant = "primary" | "secondary" | "text" | "done";

const base =
  "inline-flex items-center justify-center gap-2 rounded-2 font-semibold select-none " +
  "transition-colors duration-[180ms] ease-[cubic-bezier(.2,.8,.2,1)] disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary:
    "bg-accent text-accent-ink hover:bg-accent-hover disabled:bg-line disabled:text-ink-3",
  secondary:
    "border border-line-strong bg-transparent text-ink hover:bg-paper disabled:text-ink-3",
  text: "bg-transparent text-accent-text hover:text-accent-hover px-3",
  done: "bg-ink text-paper hover:opacity-90",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={`${base} h-11 px-5 text-[14px] ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
});

export function ButtonLink({
  variant = "primary",
  className = "",
  href,
  children,
}: {
  variant?: Variant;
  className?: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={`${base} h-11 px-5 text-[14px] ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

/** A tick glyph for the "Done" button. */
export function Tick() {
  return (
    <span
      aria-hidden="true"
      style={{
        width: 10,
        height: 6,
        borderLeft: "2px solid currentColor",
        borderBottom: "2px solid currentColor",
        transform: "rotate(-45deg) translateY(-2px)",
      }}
    />
  );
}
