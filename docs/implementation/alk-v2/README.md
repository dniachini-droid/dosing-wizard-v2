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
ALK_V2_FREEZE_4
```

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
| `fixtures/*.json` | Machine-readable golden corpus — 160 fixtures plus schema, config defaults and index. |
| `traceability/alk-v2-traceability.json` | Machine-readable copy of the 261-rule traceability inventory. |

## At a glance

```text
261  normative canon rules inventoried, each with exactly one implementation owner
160  fixtures  (102 canon-verbatim, 33 canon-derived, 25 canon-qualitative)
235  reason codes across 23 owner groups
 60  machine-testable invariants
 40  open issues  (24 canon defects, 8 owner decisions, 13 pinned conventions, 3 no-problem)
  0  rules without a fixture
  0  rules with more than one owner
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
2. `ALK-V2-OPEN-ISSUES.md` — **read before writing code**; it lists what is not yet
   decidable and what must not be guessed.
3. `ALK-V2-DATA-CONTRACT.md`
4. `ALK-V2-ALGORITHM-CONTRACT.md`
5. `ALK-V2-REASON-CODES.md`
6. `ALK-V2-MODULE-DESIGN.md`
7. `ALK-V2-TEST-MATRIX.md` + `fixtures/`
8. `ALK-V2-INVARIANTS.md`
9. `ALK-V2-RULE-TRACEABILITY.md` — reference, consulted per rule
10. `ALK-V2-ADVERSARIAL-REVIEW.md`
