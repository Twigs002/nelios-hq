// Seller codes - Nelio's calendar key. The CODE is the spine of the app and
// drives follow-up cadence. Marks (shape + colour) and cadences are ported
// verbatim from the design system's sample-data.js so every surface renders
// identical marks. Shape + always-shown label carry the meaning, never colour
// alone (DESIGN.md: "Status never relies on colour").

export const CODE_IDS = [
  "veryhot",
  "hot",
  "warm",
  "cold",
  "private",
  "lwc",
  "stock",
  "sellerlwc",
  "lwcseller",
  "jswc",
] as const;

export type CodeId = (typeof CODE_IDS)[number];

/** A seller-code mark as a plain style object (maps 1:1 to the design CSS). */
export interface CodeMark {
  borderRadius: string;
  background: string;
  transform: string;
  clipPath: string;
  boxShadow: string;
}

const mk = {
  circle: (c: string): CodeMark => ({
    borderRadius: "50%",
    background: c,
    transform: "none",
    clipPath: "none",
    boxShadow: "none",
  }),
  ringed: (c: string): CodeMark => ({
    borderRadius: "50%",
    background: c,
    transform: "none",
    clipPath: "none",
    boxShadow: `0 0 0 2px var(--surface), 0 0 0 3.5px ${c}`,
  }),
  square: (c: string): CodeMark => ({
    borderRadius: "2px",
    background: c,
    transform: "none",
    clipPath: "none",
    boxShadow: "none",
  }),
  diamond: (c: string): CodeMark => ({
    borderRadius: "1px",
    background: c,
    transform: "rotate(45deg) scale(0.8)",
    clipPath: "none",
    boxShadow: "none",
  }),
  triangle: (c: string): CodeMark => ({
    borderRadius: "0",
    background: c,
    transform: "none",
    clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
    boxShadow: "none",
  }),
  split: (a: string, b: string): CodeMark => ({
    borderRadius: "50%",
    background: `linear-gradient(90deg, ${a} 50%, ${b} 50%)`,
    transform: "none",
    clipPath: "none",
    boxShadow: "none",
  }),
  starred: (c: string, s: string): CodeMark => ({
    borderRadius: "2px",
    background: s,
    transform: "none",
    clipPath: "none",
    boxShadow: `inset 0 0 0 3px ${c}`,
  }),
};

export interface SellerCode {
  id: CodeId;
  label: string;
  short: string;
  cadence: string; // human label, e.g. "Monthly"
  days: number; // cadence interval in days - drives the follow-up engine
  note: string;
  mark: CodeMark;
}

export const CODES: SellerCode[] = [
  { id: "veryhot", label: "Very hot seller", short: "Very hot", cadence: "Weekly", days: 7, note: "Weekly check-in", mark: mk.ringed("var(--code-hot)") },
  { id: "hot", label: "Hot seller", short: "Hot", cadence: "Monthly", days: 30, note: "Monthly check-in", mark: mk.circle("var(--code-hot)") },
  { id: "warm", label: "Warm seller", short: "Warm", cadence: "Every 2 months", days: 60, note: "Check in every 2 months", mark: mk.circle("var(--code-warm)") },
  { id: "cold", label: "Cold seller", short: "Cold", cadence: "Every 6 months", days: 180, note: "Check in every 6 months", mark: mk.circle("var(--code-cold)") },
  { id: "private", label: "Private seller", short: "Private", cadence: "Every 2 weeks", days: 14, note: "Pitch to assist", mark: mk.square("var(--code-private)") },
  { id: "lwc", label: "Listed with competitor", short: "LWC", cadence: "Monthly", days: 30, note: "List date, mandate, can we list", mark: mk.square("var(--code-lwc)") },
  { id: "stock", label: "Stock opportunity (OM)", short: "Stock opp", cadence: "Monthly", days: 30, note: "Open mandate, try get listed", mark: mk.diamond("var(--code-stock)") },
  { id: "sellerlwc", label: "Seller → LWC", short: "Seller → LWC", cadence: "Monthly", days: 30, note: "We pitched, didn’t get", mark: mk.split("var(--code-hot)", "var(--code-lwc)") },
  { id: "lwcseller", label: "LWC → Seller", short: "LWC → Seller", cadence: "Monthly", days: 30, note: "Canvassed, seller open", mark: mk.starred("var(--code-lwc)", "var(--code-warm)") },
  { id: "jswc", label: "JSWC lead", short: "JSWC", cadence: "Weekly", days: 7, note: "Just-sold WhatsApp canvassing", mark: mk.triangle("var(--code-jswc)") },
];

export const CODE_BY_ID: Record<CodeId, SellerCode> = Object.fromEntries(
  CODES.map((c) => [c.id, c]),
) as Record<CodeId, SellerCode>;

export function getCode(id: string): SellerCode | undefined {
  return CODE_BY_ID[id as CodeId];
}

export const TEMPERATURES = ["hot", "warm", "cold"] as const;
export type Temperature = (typeof TEMPERATURES)[number];

export const CATEGORIES = ["valuation", "opportunity", "competitor", "private"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_LABEL: Record<Category, string> = {
  valuation: "Valuation follow-up",
  opportunity: "Opportunity",
  competitor: "Listed with competitor",
  private: "Private seller",
};

export const STATUSES = [
  "Valuation only",
  "Future seller",
  "Not interested",
  "Listed elsewhere",
  "Mandate signed",
] as const;
export type Status = (typeof STATUSES)[number];
