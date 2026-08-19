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

## What exists now, and what does not

The **agent and routine** portion of the salvage work is complete and lives in
`docs/process/V1-AGENT-SALVAGE-AUDIT.md`. It inventories and dispositions all 28 V1 agent
definitions and all 19 V1 routines against a first-hand read of the V1 repository, and it
records where V1 chemistry sits without reproducing its values.

Still absent, deliberately: the V1 **application-code** salvage inventory, the V1
journeys and tests, and the unmigrated-V1-canon record. The final reviewed salvage report
for those is to be supplied separately, and inventing substitutes would fabricate salvage
findings. Phase 0 is therefore not complete.
