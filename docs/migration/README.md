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

- `DATA-PROVENANCE.md` — the **principles**: measurement truth, time precision,
  dose-context completeness and analytical eligibility as four independent properties,
  and the prohibitions that follow from them.
- `V1-DATA-PROVENANCE.md` — the **dataset-level detail** underneath those principles,
  per dataset, with the owner's provenance correction applied.
- `V1-APPLICATION-SALVAGE.md` — the V1 surface, interaction, feature and tooling
  inventory, with a disposition and reason for each item, and a section measuring the
  build-one screen set against it.
- `UNMIGRATED-V1-CANON.md` — V1 decisions carrying substantial reasoning that no V2
  document owns, recorded so `MASTER RULE 2` is satisfied.
- `V1-OPEN-OWNER-QUESTIONS.md` — questions V1 raised and never answered. Recorded, not
  answered.

## Where the salvage work came from

All four V1 documents were written from the V1 repository at commit
`9276a2ca254e88d19e0f02dced42a1b896499780`, read-only, together with the V1 salvage
reconnaissance report.

**That report was never committed to V1.** The branch named for it,
`claude/v1-salvage-reconnaissance-6rgcl1`, is identical to V1's `main` at that commit and
contains the reconnaissance *brief*, not its findings — the brief forbade changing files.
Every claim checkable in V1 source was therefore checked against V1 source.

The agent and routine portion of the salvage work is separate and lives in
`docs/process/V1-AGENT-SALVAGE-AUDIT.md`. Together the five documents complete the Phase 0
salvage deliverables.

## Two things to know before reading them

**The owner's historical readings are real measurements.** The reconnaissance report
concluded otherwise, inferring from a V1 source comment that most were fabricated seed
data. **That conclusion is withdrawn.** What is genuinely missing is narrower: the
accompanying dose history. `V1-DATA-PROVENANCE.md` §1 states the correction and lists every
conclusion it withdraws.

**One conflict between these documents is recorded and not resolved.** `DATA-PROVENANCE.md`
§1 lists water-change, ICP and lighting records as owner-confirmed genuine;
`V1-DATA-PROVENANCE.md` §5 records that the reconnaissance found all three byte-identical
to named V1 constants and that the owner's correction has not been extended to them.
Neither document is amended to agree with the other. It is question Q9 in
`V1-OPEN-OWNER-QUESTIONS.md`.

## Numeric chemistry

**No migration document reproduces V1 numeric chemistry values**, following the precedent
of `docs/process/V1-AGENT-SALVAGE-AUDIT.md`. Where a figure matters, its **kind** and its
**location in V1** are named so a reader can go and look. Chemistry authority is
`docs/canon/` and nothing else.
