# Dosing Wizard V2 — operating rules

This file holds only load-bearing rules. It is deliberately short and is not a
second copy of anything. Detail lives in the documents it points at.

## Read first

- `PRODUCT-VISION.md` — what the product is for.
- `ROADMAP.md` — the sequence, and what belongs to which phase.
- `PROJECT-STATE.md` — current phase, status, blockers.
- `DECISIONS.md` — append-only decision ledger. Consult before deciding
  anything; supersede rather than rewrite.

## Authority

- Frozen behavioural canon is `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`.
- Current freezes are `SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_5`.
- `docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` is preserved
  history. Its freeze identifiers `SHARED_V2_FREEZE_1` and `ALK_V2_FREEZE_3`
  are **stale**. Use it as process and implementation guidance only, and only
  where it is compatible with the canon. Do not edit it to update those
  identifiers — the discrepancy is recorded deliberately in `PROJECT-STATE.md`.
- Where anything conflicts with current frozen canon, the canon wins.
- **Canon owns chemistry behaviour.** Thresholds, band edges, rails, dosing
  equations, controller rules, evidence minima and retest timing are canon's
  and only canon's.
- **`DECISIONS.md` owns product and technical-architecture decisions**, matching
  the scope `DECISIONS.md:10` states for itself. It is **not** chemistry
  authority and must never be used as one: a chemistry rule recorded there would
  be a rule with no freeze, no coverage fixture and no governed reissue path. If
  a decision entry appears to set chemistry behaviour, the canon governs and the
  entry is wrong.
- Whether the ledger also covers *process* architecture is `OD-002`, still open.
  Until the owner answers it, do not assert either way.
- `PRODUCT-VISION.md` and `ROADMAP.md` own direction. `PROJECT-STATE.md` owns
  current state.
- A canon contradiction is reported as `CANON_DEFECT` and left for the owner.
  It is never resolved by reinterpretation.

## V1

The V1 repository (`tank-wizard`) is **reference and salvage material only**.
It is never modified, never a runtime dependency, and never authority.
"V1 did it this way" is not a justification. V1 methodology is useful; V1
outputs, approvals and statuses are not V2 expectations.

## Chemistry

**Adopted chemistry comes from the canon, and from nothing else.** Any
threshold, band edge, rate limit, tolerance, noise floor, cadence, evidence
minimum, dosing equation or safety rail that governs behaviour must be stated in
current frozen canon. It may not arrive by invention, by task instruction, by
`DECISIONS.md`, by an owner-decision entry, by `docs/research/`, or by V1. The
test is whether the canon states it, not who proposed it. If a rule is missing,
the work stops and the gap is reported.

**Sourced evidence under review is a different thing, and it has a home.**
Research toward a future canon reissue may quote real numbers from real sources
— that is how canon gets written. Such values live only under `docs/research/`,
carry their citation, are marked `NON-AUTHORITATIVE — UNDER REVIEW`, and are
never referenced by a runtime, controller, test expectation or recommendation.
They become behaviour only through a governed canon reissue.

The distinction is between a number that is **cited and quarantined** and a
number that is **adopted**. Outside `docs/research/` and `docs/canon/`, no
number governs behaviour. (Illustrative examples in `PRODUCT-VISION.md` are
prose, not authority, and nothing may cite them.)

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
  independently calculates slope, dose, response class or retest time.
- **Canon `MASTER RULE 1`** — one owner for each inference. Two implementations
  that agree today are a defect, not a coincidence.
- **`DEC-006`** — calculator arithmetic is separate from advisory logic.
- **Canon §64** — deterministic replay holds given the same event ledger, the
  same configuration versions **and the same engine/canon version**. Replays are
  stamped with the version that produced them (canon §47).
- **`DEC-009`** — AI, if ever built, sits above the deterministic system and is
  non-authoritative.
- **`DEC-015`** — known fact, supported inference, plausible context and
  unsupported speculation are distinguished and labelled.

## How work is done

- Application work runs: branch → build → **deterministic tests** → independent
  review → PR. `/implement` is the default workflow.
- Prefer a deterministic test, fixture or invariant over prose review. A rule
  that can be pinned by a failing test should be, and prose review is what is
  left over.
- Substantive implementation is not complete until it has had **independent
  review in a fresh context**, not a self-review. One reviewer by default;
  specialists only when materially relevant.
- Claude may create branches and pull requests. Claude **never merges** —
  merging requires explicit owner action. This holds however green the checks
  are.
- Genuine owner/product decisions are surfaced, not silently resolved. A task
  blocked on a clearly stated open decision is a successful outcome.

## Controls — what is a boundary and what is not

**GitHub branch protection and repository permissions are the only hard control
protecting `main`.** They are not configured yet (`OD-001`, open).

Everything in `.claude/settings.json`, in these documents and in the agent
definitions is **defence in depth and process discipline — not a security
boundary**. Specifically:

- Tool-name denies do remove an MCP tool from the surface, and are the strongest
  thing here. They do not constrain a shell.
- Path denies bind `Edit`, `Write` and `NotebookEdit` only. They do **not**
  bind `Bash`. Anything with a shell can write to a denied path.
- Command-string patterns match spellings, not intent. This repository no longer
  attempts to enumerate them; that approach was tried, was shown incomplete
  twice, and blocked legitimate work by accident.
- Any session holding `Bash` also holds `curl`, and therefore the whole GitHub
  API. No Claude-side rule changes that.

**Until GitHub protection is configured and verified, unattended autonomous
merge-capable work is prohibited.** Attended sessions may branch, commit, push
and open pull requests, and must stop before merge. See
`docs/process/AUTONOMY-AND-CONTROLS.md`.

## The workforce

Project agents live in `.claude/agents/`; workflows live in `.claude/skills/`.
Roles and limits are documented in `docs/process/AGENT-ROSTER.md`. Do not
restate agent instructions here.
