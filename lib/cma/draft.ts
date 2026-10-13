// Server-only: the Claude call that drafts a CMA. Reads cma/methodology.md from
// disk as the system instruction, sends the POPIA-minimised context, and asks
// for a strict JSON result. Returns a reviewed-by-a-human proposal, never a
// published figure.
import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { contextToPrompt, parseDraft } from "./context";
import type { CmaContext, CmaDraft } from "./types";

export type DraftResult = { ok: true; draft: CmaDraft } | { ok: false; error: string };

// Strict JSON schema for the model's output. Only features the structured-output
// API supports: object, number, string, enum, array of objects.
const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    recommendedPrice: { type: "number" },
    valueLow: { type: "number" },
    valueHigh: { type: "number" },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    confidenceReason: { type: "string" },
    rationale: { type: "string" },
    compNotes: {
      type: "array",
      items: {
        type: "object",
        properties: { address: { type: "string" }, note: { type: "string" } },
        required: ["address", "note"],
        additionalProperties: false,
      },
    },
  },
  required: [
    "recommendedPrice",
    "valueLow",
    "valueHigh",
    "confidence",
    "confidenceReason",
    "rationale",
    "compNotes",
  ],
  additionalProperties: false,
};

function methodology(): string {
  return readFileSync(join(process.cwd(), "cma/methodology.md"), "utf8");
}

export async function draftCmaFromContext(ctx: CmaContext): Promise<DraftResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "AI drafting is not configured. Set ANTHROPIC_API_KEY to enable it.",
    };
  }
  if (ctx.comps.length === 0) {
    return {
      ok: false,
      error: "Add at least one comparable sale before drafting a CMA.",
    };
  }

  const client = new Anthropic({ apiKey });

  let res;
  try {
    res = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 6000,
      thinking: { type: "adaptive" },
      system: methodology(),
      messages: [
        {
          role: "user",
          content:
            "Draft a CMA for this subject property using the comparable sales below. " +
            "Return only the structured JSON.\n\n" +
            contextToPrompt(ctx),
        },
      ],
      output_config: { format: { type: "json_schema", schema: OUTPUT_SCHEMA } },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return { ok: false, error: "The AI request failed: " + msg };
  }

  if (res.stop_reason === "refusal") {
    return { ok: false, error: "The AI declined this request. Try again or draft manually." };
  }

  const text = res.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text;
  if (!text) {
    return { ok: false, error: "The AI returned no usable result. Try again." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "The AI result could not be read. Try again." };
  }

  const draft = parseDraft(parsed);
  if (!draft) {
    return { ok: false, error: "The AI result did not pass validation. Try again." };
  }
  return { ok: true, draft };
}
