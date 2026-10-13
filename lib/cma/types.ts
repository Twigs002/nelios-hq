// Shared CMA types. Pure (no server-only imports) so both the server action and
// the client component can import them.

export type Confidence = "low" | "medium" | "high";

/** What the AI returns. A proposal for Nelio to review, never auto-applied. */
export interface CmaDraft {
  recommendedPrice: number;
  valueLow: number;
  valueHigh: number;
  confidence: Confidence;
  confidenceReason: string;
  rationale: string;
  compNotes: { address: string; note: string }[];
}

/** The POPIA-minimised subject sent to the AI: a property, not a named person. */
export interface CmaSubject {
  suburb: string;
  street: string;
  propertyType: string | null;
  beds: number | null;
  baths: string | null;
  erfSizeM2: number | null;
  floorSizeM2: number | null;
  parking: number | null;
}

/** A comparable sale as sent to the AI. */
export interface CmaComp {
  address: string;
  saleDate: string | null;
  price: number | null;
  sizeM2: number | null;
  status: "Sold" | "Pending transfer";
}

export interface CmaContext {
  subject: CmaSubject;
  comps: CmaComp[];
}
