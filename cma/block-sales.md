# Sales in a block (sectional title)

How Quay 1 values a flat from the recent sales in its own building. This is the
valuation reference for the CMA assistant. It is distilled from the Quay 1
"Block Sales Report" method; the full branded one-page report (template,
renderer, broker banner, delivery) is a separate Brand Studio deliverable and
is not part of Nelio's HQ.

## The idea

For a sectional-title flat, the most reliable comparables are other recent
sales in the same scheme (the block). They share the building, the location,
the age and the body corporate, so differences come down mostly to floor, size
and condition. Same-building sales beat nearby-street sales as evidence.

## Which sales count

- **Residential only.** Flats and residential units. Exclude shops, offices,
  garages, store rooms, maid's rooms, common property and any
  business/commercial unit.
- **Arm's-length only.** Exclude transfers marked estate, donation, vesting,
  nil, or with no price, and any bulk transfer. They are not open-market sales.
- **Window.** Filter on sale date (not registration date). Default from
  1 January of last year to today. Widen only if there are too few sales, and
  state the window used.

## Rand per square metre

- R/m2 = price / the flat's registered section extent.
- If a unit was sold with a garage or store room on the same title deed, the
  combined R/m2 is misleading. Use the flat extent only and note it.
- Headline figures are medians over all qualifying sales in the window:
  number of sales, median price, median R/m2. Compute from unrounded values.

## Benchmark

Compare the block's median R/m2 to the suburb's average R/m2 where known, so a
seller can see whether their building runs above or below the area. Suburb
averages are quoted as at the date they were pulled; they are not re-pulled per
block.

## Oddities to flag (never silently fix)

- A price far above or below similar units in the block.
- A registered date years before the sale date (treat as Pending; weight
  lightly).
- A sale dated the first of a month (possible placeholder).
- A unit that appears twice.
- A unit sold with a garage or store room (state R/m2 is on the flat extent).

## Privacy

Never record owner names or ID numbers. A block sales view is about units and
prices, not people. See the POPIA note in `README.md`.

## Data source

The sales come from CMA Info (Sales and Transfers, "Sales in
Str/Scheme/Estate", sectional title). That feed is not yet wired into the app;
see `data-sources.md`. Until it is, same-building comps are entered or pasted on
the CMA page like any other comparable.
