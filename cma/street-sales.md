# Street sales (full title and mixed streets)

How Quay 1 values across a whole street, covering houses (full title) and the
flats in any sectional-title blocks on that street. This is the valuation
reference for the CMA assistant. It is distilled from the Quay 1 "Block and
Street Sales Report" method; the branded one-page report itself (template,
renderer, broker banner, page layout) is a separate Brand Studio deliverable
and is not part of Nelio's HQ.

Several points below are still **pending sign-off** with the team. They are the
current working approach, not settled rules; they are marked where they apply.

## The idea

A street report values every residential property on one street, or one stretch
of it. Two property types sit side by side: houses on full title, and flats in
the sectional-title blocks addressed on the street. They are valued separately.

## How CMA holds a street (why it matters for the comps)

- A street is **split by suburb**. The same street name can appear under several
  suburbs; pick the stretch that matches the subject.
- The **street inventory view** lists one row per erf with only that erf's most
  recent transfer. It is a cross-check, not a sales history.
- The **actual sales** come from the suburb sales lists (full title and
  sectional title, over the window), which carry the street address on every
  row.
- **Match on the address column only.** A scheme whose name contains the street
  name but sits on a different street must not be pulled in.

## Houses vs flats (never pooled)

Rand per square metre is not comparable across the two types, so they are never
combined into one median R/m2.

- **Flats:** R/m2 = price / the flat's section (floor) extent. Same rule as the
  block report; see `block-sales.md`.
- **Houses:** R/m2 = price / the erf (land) extent. CMA always has erf extent.
  Building floor size is shown where CMA has it and left blank where it does
  not. Never estimate a missing building size. _(Pending: erf vs building basis
  for the house rate; erf is the working default because it is always present.)_

## Which house sales count

- **Include:** residential houses (usage residential or two-dwelling
  residential), any house type (house, double-storey, semi, cluster). Include a
  row with a house type and a blank usage, and mention it.
- **Exclude:** open space, municipal, commercial usage, and any transfer marked
  estate, court order, CRT, CCT, donation, vesting, nil or no-price.
- **Vacant residential erfs** (land with a price): _(pending)_ flag and ask
  before including, because land prices drag the house median down.

## Medians and benchmarks

- Medians are computed per property type, from all sales of that type in the
  window, from unrounded values.
- Benchmark houses against the suburb's full-title average R/m2 (erf) where
  known, and flats against the sectional-title average. Never cross the two.
- Suburb averages are quoted as at the date they were pulled.

## Oddities to flag (never silently fix)

- An erf that sold twice in the window: use the later sale.
- A corner property or block CMA files under a side street: ask before adding.
- A house with a blank usage.
- A township label that differs from the suburb in the title.
- Plus all the shared flags in `block-sales.md` (pending transfers, first-of-
  month dates, prices far out of line, duplicates).

## Fewer than two sales

Fewer than two sales of a property type: show what there is; do not build a
median from a single sale. Fewer than two sales in total: stop and ask whether
to widen the window.

## Privacy

Never record owner names or ID numbers. See the POPIA note in `README.md`.

## Data source

Houses come from CMA Info, Sales and Transfers, "Sales" (Residential Full
Title) filtered to the street; flats from the sectional-title equivalent, with
the street inventory as a cross-check. That feed is not yet wired into the app;
see `data-sources.md`. Until it is, street comps are entered or pasted on the
CMA page like any other comparable.
