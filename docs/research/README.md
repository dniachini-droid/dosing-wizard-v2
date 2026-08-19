# Research

Future chemistry domains are researched here **before** they are canonised.

Nothing in this folder is authoritative. A document here becomes binding only when its
conclusions are carried into a frozen canon document under `docs/canon/`.

## This is the only place a sourced chemistry value may be written

Adopted chemistry — anything that governs behaviour — comes from `docs/canon/` and from
nowhere else. But research toward a canon reissue has to be able to quote real numbers
from real sources, because that is how canon gets written. This folder is where that is
allowed, and the quarantine is by location.

Every document here must:

- carry the status line **`NON-AUTHORITATIVE — UNDER REVIEW`** at the top;
- cite the source of every value: publication or manufacturer, document, version or
  edition, and the date consulted;
- state explicitly that nothing in it may be used by a runtime, controller, engine, test
  expectation, recommendation or calculator constant.

Nothing here is referenced from `CLAUDE.md`, `DECISIONS.md`, an owner-decision entry, a
run record, an agent definition or a test. Copying a value out of this folder into any of
those is how evidence silently becomes authority, and it is the failure this separation
exists to prevent.

A value in this folder becomes behaviour only through a **governed canon reissue**: a new
freeze identifier superseding the old one, which is an owner act. Until that happens, a
number here is evidence under review and nothing more — however well sourced it is.

## What research must be based on

- current primary literature;
- authoritative manufacturer guidance for product-specific formulas and concentrations;
- established reef-keeping practice where it is documented and defensible.

Sources are cited with enough detail to be re-checked later: publication or manufacturer,
document, version or edition, and the date the source was consulted. Manufacturer
formulations change between product versions, so an uncited constant is a latent defect.

## V1's standing here

V1 provides source material and questions, not scientific authority.

A V1 threshold, classifier or numerical rule is a lead worth investigating and never a
finding in itself. "V1 used this number" does not establish that the number is correct,
and reproducing it without independent support would launder an unvalidated value into
V2 canon.

## Recording uncertainty

Uncertainty and disagreement are recorded, not hidden behind invented precision.

Where the literature disagrees, say so and record both positions. Where a value is
genuinely unknown, say it is unknown. Where a range is defensible but a single value is
not, record the range. Research that reports a clean number it cannot support is worse
than research that reports an honest gap, because the gap can be closed later while the
false number will be trusted.

A domain is ready for canonisation when its open questions are either answered with
support or explicitly recorded as unresolved with their consequences understood.
