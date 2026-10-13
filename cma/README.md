# cma/

The CMA (Comparative Market Analysis) methodology folder. This is the
instruction set the AI assistant follows to draft a valuation for a seller.

- `methodology.md` - the operative file. It is read at runtime and sent to
  Claude as the system instruction for every CMA draft. Edit this to change how
  valuations are produced; no code change is needed.
- `data-sources.md` - where comparable sales come from now (manual / paste) and
  the planned live feed (cmainfo.co.za, currently blocked on OTP).

## How it runs

1. Nelio opens a seller's CMA page and enters or pastes comparable sales.
2. "Draft CMA with AI" sends the subject property facts and the comps to Claude
   (`claude-opus-4-8`), with `methodology.md` as the system instruction.
3. Claude returns a recommended price, a value band, a confidence level, and a
   plain-language rationale. Nothing is written yet.
4. Nelio reviews, then "Apply to valuation" writes the figures onto the seller,
   which unlocks the shareable snapshot. The AI never publishes on its own.

## Privacy (POPIA)

The seller's name, cell, and email are never sent to the AI. Only the property
(suburb, type, size, street) and the comparable sales are sent, because that is
all a valuation needs. See `lib/cma/context.ts` for exactly what is assembled.

## Configuration

Set `ANTHROPIC_API_KEY` in the environment to enable the feature. Without it,
the CMA page still shows the comps editor and explains that AI drafting is not
configured; nothing breaks.

## Demo mode

On the public demo (`DEMO_DB=true`), there is no API key, so the draft button
produces a local sample estimate instead of calling Claude: a median rand per
square metre from the comps, applied to the subject's floor size, with a band
around it. It is deterministic and clearly labelled "Sample" in the UI. See
`lib/cma/demo.ts`. Real deployments with a key always use the full AI method in
`methodology.md`.
