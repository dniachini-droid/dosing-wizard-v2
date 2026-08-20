# Alk V2 — Implementation Package

**Status:** implementation-specification only. No application code, no framework, no
database, no dependencies.

**Purpose:** turn the frozen alkalinity canon into a package from which the alkalinity
domain can be implemented once the technical architecture is selected, without the
implementing engineer re-interpreting chemistry.

---

## Authority

The sole behavioural authority is:

- `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`

operating under the current frozen identifiers:

```text
SHARED_V2_FREEZE_2
ALK_V2_FREEZE_5
```

`ALK_V2_FREEZE_5` closed the eleven blocking items of `ALK-V2-OPEN-ISSUES.md`, plus
`OI-RAPIDBASIS-001` and `OI-CONFIDENCE-001`, with twelve owner decisions written into the
canon. Its independent review then **opened three new items** where encoding a decision
would have required a second decision the owner had not made — `OI-HIGHBREACHBAND-001`,
`OI-CLUSTERTIE-001` and `OI-RETESTFLOOR-001` — and the owner decided all three as
amendments **F5-13, F5-14 and F5-15**. All sixteen are closed, and nothing in this package
withholds an output for want of a decision.

Owner decisions **16–19** then superseded parts of that first encoding; **20–22** superseded
parts of theirs; and **23–26** superseded parts of those. **Owner decision 23 is the one to
read first**: the application is **recommend-only**. It never controls, drives, commands or
actuates a dosing pump, has no connection to any doser, and produces a recommended rate for
a human being who decides whether to act on it. There is no execution path from the engine
to the tank. That retires the advisory-versus-executable split, actuator capability as a
concept, two rules and four reason codes, and it corrects every rule that reasoned about
delivery continuing when an output is withheld. Decision 24 turns the advisory boundary from
a refusal into a **warning** attached to an ordinary recommendation; decision 25 makes the
unknown-`D_current` refusal a precondition evaluated before branch selection; decision 26
gives the retest one answer. Decision 20 splits `D_established` into `D_current`
and `D_history`; decision 21 adds an advisory ceiling and floor beyond which the engine
escalates instead of advising; decision 22 adds the missing high-breach branch for a
consumption estimate that cannot be computed at all. **Two items are deliberately left
open** by that round — `OI-SIZINGFLAT-001` and `OI-CZERODISCONT-001`, section A4. Neither
withholds an output; both forbid the implementation from compensating.

Read the Freeze-5 declaration in the canon, then the *Status after `ALK_V2_FREEZE_5`* and
the *A2*, *A3* and *A4* sections of `ALK-V2-OPEN-ISSUES.md`, before anything else.

`docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` names the historical freezes
`SHARED_V2_FREEZE_1` / `ALK_V2_FREEZE_3`. Those identifiers are stale and carry no
authority here. The handoff's process guidance is used only where it is compatible with
the current canon; its freeze identifiers are ignored. See
`ALK-V2-OPEN-ISSUES.md` → `OI-HANDOFF-001`.

**Nothing in this package modifies, amends, or reinterprets the canon.** Where this
package and the canon appear to disagree, the canon governs and this package is wrong.

---

## What this package is

| Document | Contents |
|---|---|
| `ALK-V2-IMPLEMENTATION-CONTRACT.md` | Entry point. Layer separation, frozen constants, pipeline order, build sequence, conformance gate. |
| `ALK-V2-RULE-TRACEABILITY.md` | Every normative rule → owner, inputs, output, equation, reason codes, fixtures, boundaries, dependencies, Alk-only activity. |
| `ALK-V2-DATA-CONTRACT.md` | Implementation-neutral type contracts, field semantics, units, nullability, provenance, closed vocabularies. |
| `ALK-V2-ALGORITHM-CONTRACT.md` | Per-algorithm INPUTS / PRECONDITIONS / FORMULA / OUTPUT / REASON CODE / FAILURE STATE / TESTS. |
| `ALK-V2-REASON-CODES.md` | Canonical reason-code catalogue with audit payloads. |
| `ALK-V2-TEST-MATRIX.md` | Fixture corpus index, coverage matrix, acceptance rules. |
| `ALK-V2-INVARIANTS.md` | Machine-testable invariants. |
| `ALK-V2-MODULE-DESIGN.md` | Pure-domain module structure, dependency direction, purity classification. |
| `ALK-V2-ADVERSARIAL-REVIEW.md` | Three independent review passes (canon / breaker / implementer). |
| `ALK-V2-OPEN-ISSUES.md` | Classified defects, owner decisions required, pinned conventions. |
| `validate-freeze-5.py` | Mechanical gate: 427 PASS/FAIL lines over rule IDs, the canon coverage manifest, traceability, fixtures, reason codes, invariants, canon consistency, and independent arithmetic recomputation of every series fixture. Run `python3 docs/implementation/alk-v2/validate-freeze-5.py`. |
| `recompute-goldens.py` | **Recorder, not a gate.** Independently recomputes every fixture-stated derived value from its declared inputs and writes a machine-readable record, so "no arithmetic moved" is a checkable claim rather than an assertion. `--diff <record>` reports every golden that moved against a stored baseline. |
| `baselines/*.json` | Golden baseline records. `golden-baseline-65c6030.json` is the state before owner decisions 20-22; `golden-post-decisions-20-22.json` is the state after. |
| `fixtures/*.json` | Machine-readable golden corpus — 203 fixtures plus schema, config defaults and index. |
| `traceability/alk-v2-traceability.json` | Machine-readable copy of the 283-rule traceability inventory. |

## At a glance

```text
283  normative canon rules inventoried, each with exactly one implementation owner
203  fixtures  (102 canon-verbatim, 72 canon-derived, 29 canon-qualitative)
242  reason codes across 24 owner groups  (18 retired by Freeze 5, 3 by owner decisions
                  16-19, 1 by owner decision 20, 4 by owner decisions 23-24,
                  7 by owner decisions 27-28)
 76  machine-testable invariants
 59  open issues  (16 resolved by Freeze 5 and its amendments, 15 by owner decisions 16-29,
                  1 reclassified INAPPLICABLE by decision 23, 11 canon defects carried
                  forward, 13 pinned, 3 no-problem,
                  2 DELIBERATELY LEFT OPEN: OI-SIZINGFLAT-001, OI-CZERODISCONT-001,
                  6 opened by decisions 27-28 and left open: OI-EPISODEINTERVENTION-001,
                  OI-EPISODEWINDOW-001, OI-EPISODEANCHOR-001, OI-EPISODESUSPECT-001,
                  OI-ANOMLATESTSAFETY-001, OI-PII53METHOD-001)
  0  outputs withheld pending an owner decision
  0  rules without a fixture
  0  rules with more than one owner
348 -> 489  derived values recomputed from declared inputs; 0 moved across decisions 20-29
```

---

## What this package deliberately is not

- it does not choose a programming language, framework, runtime or database;
- it does not create `package.json` or any dependency manifest;
- it does not define UI;
- it does not implement anything;
- it does not resolve a genuine canon defect by inventing behaviour.

`DECISIONS.md` contains no language or stack decision at the time of writing, so every
contract here is expressed in language-neutral pseudo-types and JSON.

---

## Reading order

1. `ALK-V2-IMPLEMENTATION-CONTRACT.md`
2. `ALK-V2-OPEN-ISSUES.md` — **read before writing code**; it lists what `ALK_V2_FREEZE_5`
   decided, what is still not decidable, and what must not be guessed. A resolved item's
   pre-Freeze-5 "Until closed" behaviour is superseded and must not be implemented.
3. `ALK-V2-DATA-CONTRACT.md`
4. `ALK-V2-ALGORITHM-CONTRACT.md`
5. `ALK-V2-REASON-CODES.md`
6. `ALK-V2-MODULE-DESIGN.md`
7. `ALK-V2-TEST-MATRIX.md` + `fixtures/`
8. `ALK-V2-INVARIANTS.md`
9. `ALK-V2-RULE-TRACEABILITY.md` — reference, consulted per rule
10. `ALK-V2-ADVERSARIAL-REVIEW.md`
