// View-model decorator. Turns a raw Seller row into the display fields every
// screen needs, mirroring the design system's sample-data.js `decorate()`.
// Keeping this in one place guarantees Today, Board and Detail render identical
// marks, due labels and formatting.

import type { Seller } from "@/db/schema";
import { getCode, type CodeMark } from "./codes";
import {
  rand,
  valueRange,
  formatDate,
  formatDateShort,
  formatPhone,
  firstName,
} from "./format";
import { daysUntil, type DueState } from "./followup";

export interface SellerView {
  id: string;
  name: string;
  first: string;
  place: string;
  address: string;
  suburb: string;
  phoneFmt: string;
  cell: string;
  // Code
  code: string;
  codeLabel: string;
  codeShort: string;
  codeCadence: string;
  codeNote: string;
  mark: CodeMark;
  // Due
  dueState: DueState | "none";
  dueLabel: string;
  dueShort: string;
  dueColor: string;
  dueDeco: "underline" | "none";
  dueMarkBg: string;
  dueMarkBorder: string;
  nextFollowUpDate: string | null;
  nextDate: string;
  // Valuation
  hasValuation: boolean;
  valType: string;
  valTypeLong: string;
  valDate: string;
  valValue: string;
  valRange: string;
  recommendedPrice: number | null;
  // Contact
  lastShort: string;
  lastLabel: string;
  // Tags
  temperature: string | null;
  category: string | null;
  status: string;
}

export function decorateSeller(s: Seller, today: string): SellerView {
  const code = getCode(s.code);
  const next = s.nextFollowUpDate;
  const n = next ? daysUntil(next, today) : null;
  const state: DueState | "none" =
    n == null ? "none" : n < 0 ? "overdue" : n === 0 ? "today" : "upcoming";

  const dueLabel =
    n == null
      ? "No follow-up set"
      : state === "overdue"
        ? "Overdue · " + -n + (n === -1 ? " day" : " days")
        : state === "today"
          ? "Due today"
          : n === 1
            ? "Tomorrow"
            : "In " + n + " days · " + formatDateShort(next!);

  const dueShort =
    n == null
      ? "-"
      : state === "overdue"
        ? -n + "d overdue"
        : state === "today"
          ? "Today"
          : formatDateShort(next!);

  return {
    id: s.id,
    name: s.name,
    first: firstName(s.name),
    place: s.address + ", " + s.suburb,
    address: s.address,
    suburb: s.suburb,
    phoneFmt: formatPhone(s.cell),
    cell: s.cell,
    code: s.code,
    codeLabel: code?.label ?? s.code,
    codeShort: code?.short ?? s.code,
    codeCadence: code?.cadence ?? "",
    codeNote: code?.note ?? "",
    mark: code?.mark ?? {
      borderRadius: "50%",
      background: "var(--ink-3)",
      transform: "none",
      clipPath: "none",
      boxShadow: "none",
    },
    dueState: state,
    dueLabel,
    dueShort,
    dueColor:
      state === "overdue"
        ? "var(--signal)"
        : state === "today"
          ? "var(--ink)"
          : "var(--ink-3)",
    dueDeco: state === "today" ? "underline" : "none",
    dueMarkBg:
      state === "overdue"
        ? "var(--signal)"
        : state === "today"
          ? "var(--highlight)"
          : "transparent",
    dueMarkBorder: state === "upcoming" ? "var(--ink-3)" : "transparent",
    nextFollowUpDate: next ?? null,
    nextDate: next ? formatDate(next) : "-",
    hasValuation: s.recommendedPrice != null,
    valType: s.valuationType ?? "",
    valTypeLong: s.valuationType === "PV" ? "Property valuation" : s.valuationType === "DV" ? "Desktop valuation" : "",
    valDate: s.valuationDate ? formatDate(s.valuationDate) : "-",
    valValue: s.recommendedPrice != null ? rand(s.recommendedPrice) : "-",
    valRange:
      s.valueLow != null && s.valueHigh != null ? valueRange(s.valueLow, s.valueHigh) : "-",
    recommendedPrice: s.recommendedPrice ?? null,
    lastShort: s.lastContactDate ? formatDateShort(s.lastContactDate) : "-",
    lastLabel: s.lastContactDate ? "Last contact " + formatDateShort(s.lastContactDate) : "No contact yet",
    temperature: s.temperature,
    category: s.category,
    status: s.status,
  };
}
