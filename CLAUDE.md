# Dosing Wizard V2 — operating rules

This file holds only load-bearing rules. It is deliberately short and is not a
second copy of anything. Detail lives in the documents it points at.

## Read first

- `PRODUCT-VISION.md` — what the product is for.
- `ROADMAP.md` — the sequence, and what belongs to which phase.
- `PROJECT-STATE.md` — current phase, status, blockers. Update it when the
  active phase, next major step or blockers materially change.
- `DECISIONS.md` — append-only decision ledger. Consult before deciding
  anything; supersede rather than rewrite.

## Authority

- Frozen behavioural canon is `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`.
- Current freezes are `SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_4`.
- `docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` is preserved
  history. Its freeze identifiers `SHARED_V2_FREEZE_1` and `ALK_V2_FREEZE_3`
  are **stale**. Use the handoff as process and implementation guidance only,
  and only where it is compatible with the canon. Do not edit it to update
  those identifiers — the discrepancy is recorded deliberately in
  `PROJECT-STATE.md`.
- Where anything conflicts with current frozen canon, the canon wins.
- Canon owns chemistry. `DECISIONS.md` owns product and architecture.
  Neither is amended as a side effect of implementation or review work.
- A canon contradiction is reported as `CANON_DEFECT` and left for the owner.
  It is never resolved by reinterpretation.

## V1

The V1 repository (`tank-wizard`) is **reference and salvage material only**.
It is never modified, never a runtime dependency, and never authority.
"V1 did it this way" is not a justification. V1 methodology is useful; V1
outputs, approvals and statuses are not V2 expectations.

## Chemistry

Chemistry comes from the canon. Any threshold, band edge, rate limit,
tolerance, noise floor, cadence, evidence minimum or safety rail the canon does
not state must not enter the repository — whether it was invented for
convenience, supplied in a task instruction, carried from V1, or offered as a
"provisional" or "reasonable interpretation" of a rule the canon does not make.
The test is whether the canon states it, not who proposed it. If a rule is
missing, the work stops and the gap is reported.

Future parameter domains (Ca, Mg, PO4, NO3 and others) require independent
scientific revalidation. They are not cloned from alkalinity.

## Separation of concerns

Each rule below is owned elsewhere. This section is a pointer, not a second
copy: where the wording here and the owner's wording differ, the owner governs.

- **`DEC-003`** — raw observations, evidence, supported trajectory, action and
  UI remain separate concerns; no UI component may recompute chemistry; every
  recommendation must be reproducible by replaying its inputs.
- **Canon `X-INV-004` (One analytical owner)** — the domain engine owns
  chemistry; presentation renders structured output; no UI component
  independently calculates slope, dose, response class or retest time; one
  retest scheduler owns chemistry timing.
- **Canon `MASTER RULE 1`** — one owner for each inference. Two implementations
  that agree today are a defect, not a coincidence.
- **`DEC-006`** — calculator arithmetic is separate from advisory logic; a
  calculator result never silently becomes a recommendation.
- **Canon §64** — deterministic replay holds given the same event ledger, the
  same configuration versions **and the same engine/canon version**. Replays are
  stamped with the version that produced them; determinism is not a promise that
  a governed canon reissue leaves outputs unchanged.
- **`DEC-009`** — AI, if ever built, sits above the deterministic system and is
  non-authoritative. It may explain a state; it may never replace or override
  one.
- **`DEC-015`** — known fact, supported inference, plausible context and
  unsupported speculation are distinguished and labelled. Unsupported causal
  speculation is prohibited.

## How work is done

- Application work runs: branch → independent review → PR.
- Substantive implementation is not complete until it has had **independent
  review in a fresh context**, not a self-review.
- Claude may create pull requests. Claude **never merges** — merging requires
  explicit owner approval. This holds however green the checks are.
- Genuine owner/product decisions are surfaced, not silently resolved. A task
  blocked on a clearly stated open decision is a successful outcome.

## The workforce

Project agents live in `.claude/agents/`; reusable workflows live in
`.claude/skills/`. Their roles, authority and limits are documented in
`docs/process/AGENT-ROSTER.md`. Rules for unattended work are in
`docs/process/OVERNIGHT-AUTONOMY.md`. Do not restate agent instructions here.
