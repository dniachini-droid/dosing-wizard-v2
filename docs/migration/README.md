# Migration

Migration documents own the transition from V1 to V2 — what was learned, what carries
over, what does not, and what constrains the eventual cutover.

## What migration documents own

- **salvage findings** — what V1 contains that is worth preserving, and in what form;
- **V1 → V2 disposition** — for each salvaged item, whether it is kept, adapted,
  deferred or discarded, with the reason;
- **historical data provenance** — what the owner's historical records genuinely are,
  how precise they are, and what context is missing;
- **unmigrated V1 knowledge** — material deliberately not carried forward, recorded so
  that its absence is a known choice rather than an accidental loss;
- **migration constraints** — the rules any eventual data migration must respect.

## What migration documents do not own

Migration documents **do not own live chemistry rules.**

Behavioural authority lives in `docs/canon/`. A migration document may record that
historical data is ineligible for a given analysis, and it may record why a V1 rule was
not carried forward — but it may not define, amend or reinterpret how a V2 engine
behaves. Where a migration document appears to state a chemistry rule, the canon governs
and the migration document is wrong.

## Current contents

- `DATA-PROVENANCE.md` — provenance and analytical eligibility of the owner's historical
  records.

The final reviewed V1 salvage report is to be supplied separately. Until it arrives, the
salvage inventory, salvage disposition and unmigrated-canon records are deliberately
absent rather than reconstructed from memory.
