# CMA data sources

Where the comparable sales come from.

## Today: manual and paste (live)

Nelio enters comparable sales on the CMA page, or pastes a block from a
spreadsheet (address, sold date, price, size). These feed the AI draft
directly. No external service is required, so this works in every environment,
including the public demo and local runs.

## Next: cmainfo.co.za (pending)

The intended live feed is cmainfo.co.za, which returns recent sold and
transferring sales for a suburb or street. For a flat, the key view is Sales
and Transfers, "Sales in Str/Scheme/Estate" (sectional title), which lists the
recent sales in one building (the block) - see `block-sales.md`. For a house or
a whole street, the actual sales come from the suburb sales lists (Sales tab,
Residential Full Title and Sectional Title), filtered to the street by address,
with the street inventory as a cross-check - see `street-sales.md`. Connecting
it would pre-fill the comparable-sales list so Nelio does not type them in.

Status: parked. The login flow is mapped but blocked on cmainfo's OTP / 2FA
step, which a headless job cannot clear on its own. Options to revisit later:

- A one-time manual OTP paired with a longer-lived session cookie, refreshed on
  a schedule.
- An app-password or API route from cmainfo if one exists.
- A human-in-the-loop step where Nelio approves the OTP once per run.

Until one of those lands, the manual and paste path above is the source of
truth, and the AI methodology in `methodology.md` is unchanged either way: it
always values from the comps actually present.

## Other possible sources

If Nelio has access: Lightstone or WinDeed give deeds-office-backed comps and
would be a stronger feed than screen-scraping. Property24 sold-price data is a
weaker fallback. Any of these would land in the same comparable-sales list; the
valuation method does not depend on which one fills it.
