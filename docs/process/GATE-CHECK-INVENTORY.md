# Gate check inventory — the freeze validator against the conformance harness

Produced before a single check was moved, as Part 1 of folding
`validate-freeze-5.py` into `tools/conformance/`. Its purpose is narrow and
load-bearing: **retiring a gate before absorbing it silently drops coverage**,
and this document is the record that nothing was dropped without being named.

Base commit: `8bcd8730b978d148c4dba5ff71be928cafa69f41` (`main`, carrying PR #5
and PR #7).

Measured, not estimated. The counts come from running both gates at that commit
and instrumenting the freeze validator's `check()` to record which section every
call belongs to.

| Gate | Subjects | Result at base |
|---|---|---|
| `docs/implementation/alk-v2/validate-freeze-5.py` | 437 `check()` calls | 437 PASS, 0 FAIL, exit 0 |
| `tools/conformance/run-conformance.py` | 10 `CHK-*` checks, 204 fixtures, 76 invariants | 5 check failures, 6 fixture failures, 6 invariant failures, exit 1 |
| `tools/conformance/run-mutations.py` | 25 mutations | 24 caught, 1 blocked, GREEN |

---

## How to read the classification

`DUPLICATE` — both gates catch the same defect class. The harness keeps its
version; the freeze validator's copy is dropped.

`UNIQUE_TO_FREEZE` — only the freeze validator catches it. Must be absorbed.

`UNIQUE_TO_HARNESS` — only the harness catches it. Nothing to do.

`SUPERSEDED` — the freeze validator's version is *weaker* than the harness's
equivalent. The harness's is kept and what was dropped is stated.

---

## A. The overlap — DUPLICATE and SUPERSEDED

Eight of the freeze validator's 437 checks overlap the harness. Every one of
them is listed here with what the harness does instead.

| Freeze check | Defect class | Harness equivalent | Agree? | Neg. control | Class |
|---|---|---|---|---|---|
| `index fixture count matches bodies` | index totals diverge from the corpus | `CHK-INDEX-INTEGRITY` | harness catches strictly more | harness: none yet | DUPLICATE |
| `index ids resolve 1:1` | index names a fixture that has no body, or vice versa | `CHK-INDEX-INTEGRITY` | same defect; harness also checks per-file counts and id lists | harness: none yet | DUPLICATE |
| `index reports no duplicates` | two bodies share a fixture id | `CHK-INDEX-INTEGRITY` | same; harness also verifies the *declared* `duplicateFixtureIds` against the actual | harness: none yet | DUPLICATE |
| `index provenance split matches bodies` | `byProvenance` census drifts | `CHK-INDEX-INTEGRITY` | same | harness: none yet | DUPLICATE |
| `catalogue and retired sets are disjoint` | a code is both live and retired | `CHK-RC-CATALOGUE` (`rc.self_consistency`) | same | harness: `D-1` (adjacent mechanism) | DUPLICATE |
| `no rule without a fixture` | an ACTIVE rule has no covering fixture | `CHK-TRACE-COVERAGE` | **no** — the freeze version only reads `totals.rulesWithoutFixture` and trusts it; the harness walks every ACTIVE rule itself *and* flags the declaration as stale if it disagrees | harness: `D-2` | SUPERSEDED |
| `traceability fixture refs resolve (goldens)` | traceability claims coverage by a fixture that does not exist | `CHK-INDEX-INTEGRITY` | **no** — the freeze version excludes `INV-*`, `CLU-\d`, `VAL-\d`, `TIME-\d`, `INT-\d` and 13 further prefixes from resolution, so it passes over exactly the 20 dangling ids the harness reports | harness: none yet | SUPERSEDED |
| `invariant bodies match the coverage total` | the invariant document's coverage table drifts from its bodies | `invariants_doc.load()` self-consistency, surfaced as a corpus problem | **no** — the freeze version transcribes the literal `76` twice, so it must be hand-edited at every canon reissue and cannot detect a table that was edited *consistently but wrongly*; the harness compares the document only to itself | harness: `D-4` | SUPERSEDED |

**What is dropped by the three SUPERSEDED rows, explicitly:**

1. `no rule without a fixture` — dropped: the assertion that the *declared*
   `totals.rulesWithoutFixture` array is literally `[]`. Kept and stronger: the
   harness derives the answer and fails the declaration when it is stale.
2. `traceability fixture refs resolve (goldens)` — dropped: nothing. The freeze
   version's exclusion list is a strict subset of what the harness resolves.
3. `invariant bodies match the coverage total` — dropped: the pin on the literal
   number **76**. A future canon reissue that adds an invariant and updates the
   table consistently will pass the harness and would have failed the freeze
   validator. That is the intended behaviour: the count is canon's to set, and a
   transcribed number in a gate is the defect `CLAUDE.md` forbids.

---

## B. UNIQUE_TO_FREEZE — 429 checks that must be absorbed

Grouped by defect class. `n` is the number of `check()` calls in the class.

| # | Defect class | n | Freeze source | Why the harness cannot catch it today | Neg. control today |
|---|---|---|---|---|---|
| 1 | **Package JSON parses** — a JSON file in the package is malformed | 1 | §1 | the harness parses `fixtures/*.json` and the traceability JSON; `baselines/*.json` is on no harness read path | none |
| 2 | **Freeze stamping** — a fixture file does not stamp the current freeze, or a superseded freeze id survives in the package | 2 | §3 | the harness compares an *engine's* declared `canonVersion` to `index.canonAuthority`; it never reads the package documents for a freeze stamp | none |
| 3 | **Canon rule bodies** — a rule id in the coverage manifest has no authoritative body, is not inventoried in traceability, or no longer states its defining mechanism | 46 | §4, §11 | **the harness never reads the canon.** `CHK-INDEX-INTEGRITY` says so in its own docstring | none |
| 4 | **Canon coverage manifest** (`CORE-CANON-COVERAGE-001` items 1, 2, 3, 8) — dangling manifest ids, duplicate authoritative bodies, uncovered normative bodies, manifest entries naming a fixture that does not exist, insubstantial new bodies | 8 | §12 | the harness never reads the canon | none |
| 5 | **Traceability integrity** — declared totals vs rows, one owner *per rule*, duplicate rule ids, `BLOCKED` rows surviving, a new canon rule missing from the inventory | 5 | §5 | `CHK-RC-OWNER` is one owner per *reason code*; nothing checks one owner per *rule*, and nothing reads the traceability totals or activity column for these shapes | none |
| 6 | **Retired reason codes** — the retired-set parser reaching every retired table; a fixture emitting a retired code; a retired code cited as live in the specs or in the canon; a retired *rule id* cited as live governing authority; a fixture claiming to exercise a retired rule; a retirement row pointing at a code that is itself retired | 10 | §6, §13, §19e, §18g | the harness parses the retired tables but uses them only to decide whether a `forbidden` code assertion is vacuous. Nothing scans prose. Nothing looks at retired *rule ids* at all | inline ×4 |
| 7 | **Reason-code shapes the harness does not read** — `variant.expectedReasonCodes`, `expectedReasonCodesByCase`, `variantReasonCodes`; a fixture expecting a code it also forbids | 5 | §6, §19f | `corpus.Fixture.expected_reason_codes` reads only the top-level `expectedReasonCodes` array. 70+ assertions in these shapes are invisible to `CHK-RC-CLOSURE-DOC` | inline ×1 |
| 8 | **Decision coverage** — every owner decision `F5-01`..`F5-15` and `D16`..`D29` has a positive fixture *and* a fixture-level negative control | 58 | §7 | the harness has no notion of an owner decision, and `openIssueCoverage` is checked only for existence of the named ids | n/a (these *are* coverage assertions) |
| 9 | **Open-issues register** — a resolved item marked `RESOLVED` by the right authority, the two deliberately-open items still open, the resolution-box counts, the original analysis preserved, no exposure surviving in the canon that the register calls closed | 71 | §8, §18m, §18n | the harness never reads `ALK-V2-OPEN-ISSUES.md` | none |
| 10 | **Constants** — no numeric constant introduced by the freeze that did not pre-exist in the canon at the pinned base commit; the single declared new constant of decisions 20–22 | 10 | §9, §17i, §18k | the harness never reads the canon and has no git subject | none |
| 11 | **Fixture arithmetic** — every series fixture reproduces the Theil-Sen slope, intercept, residuals, MAD, σ_resid, σ_point, Sxx, σ_S and supported slope it states, from the inputs it declares; and no fixture states a slope the checker cannot reach | 2 | §14 | the harness deliberately computes no chemistry. `recompute-goldens.py` computes the same family but is a **recorder** — it exits 0 whatever it finds and is not a gate | none |
| 12 | **Decision fixture recomputation** — the per-decision arithmetic and structural assertions on `AD-SAF-007..010`, `AD-CON-002`, `AD-EPI-001..007`, `AD-VAL-002`, `AD-DHS-001..003`, `AD-ESC-001..003`, `AD-REC-001/002`, `WG-ALK-045`, `INV-G12` | 116 | §15a–§15f, §16, §17b–§17h, §18f | same: no chemistry in the harness, and these fixtures are all `ABSTRACT_INPUT` so the harness never executes them | none |
| 13 | **Canon decision text** — the canon's own statement of decisions 16–29: boxed formulas taking `D_current`, the inclusive advisory comparison, the pre-branch precondition, the emit block, the five warning elements, the retirement of two rules, the B′ partition | 62 | §16b–§16d, §18a–§18j | the harness never reads the canon | none |
| 14 | **Live-text absence scanners** — a contradicting clause *added* to live text: withholding for want of a precision `[M5]`, the advisory boundary withholding `[M6]`, branch A exempt from the precondition `[M8]`, the warning stating its own interval `[M7]`, `D_established` surviving as a live name, a forbidden phrase surviving, a plain-English reversion of decision 27, the method-compatibility and contested-episode sweeps | 14 | §17a, §19a–§19d, §19h, §18-sweeps | the harness has no prose scanner of any kind. This is the class the freeze validator's own history shows is hardest: four decisions were reverted in canon while a 192-check presence-only gate stayed green | inline ×9 |
| 15 | **Contract structure** — `ALK-ROUNDING-001` not gating on the precision, A40's preconditions carrying no upper limit and stating the pre-branch precondition first, the three output rows of the data contract not withholding at an advisory boundary, the advisory-warning enumeration being two-valued, the 30-minute window and the combined-count field | 18 | §19g2, §18c, §18d, §18e | the harness parses the data contract for *field names and dimensions* only; it never reads a row's meaning, and never opens the algorithm contract | none |
| 16 | **Boundary invariance** — the advisory warning does not move any recommendation-bearing field across the boundary, and one retest answer per case | 24 | §19g | the harness compares a fixture to an engine, not a fixture's cases to each other | none |

Total: 1+2+46+8+5+10+5+58+71+10+2+116+62+14+18+24 = **452 counted by class**, against
429 `check()` calls, because several classes above share `check()` calls that
were counted once (the `<FID> exists` guards and the per-section
`negative control` self-tests appear in two classes). The `check()` call is the
unit that must be accounted for; the reconciliation in Part 4 uses it.

---

## C. UNIQUE_TO_HARNESS — nothing to do

Listed for completeness, because "one gate" means the surviving gate must be
understood as a whole.

| Harness subject | Defect class | Neg. control |
|---|---|---|
| `CHK-RC-CATALOGUE` | the catalogue disagrees with its own coverage summary; duplicate rows; appendix collisions | `D-1` |
| `CHK-RC-OWNER` | one owning module per reason code (`INV-I2`) | none |
| `CHK-INDEX-INTEGRITY` | per-file counts and id lists, `openIssueCoverage` resolution, dangling and prose traceability refs | none |
| `CHK-TRACE-COVERAGE` | every ACTIVE rule names a fixture (gate item 7) | `D-2` |
| `CHK-DIMENSION-SAFETY` | one dimension per field name, over the contract **and** every name the corpus asserts (`INV-B7`) | `D-3` |
| `CHK-OUTPUT-SHAPE`, `CHK-RC-CLOSURE-ENGINE`, `CHK-WITHHELD-REASONED`, `CHK-ENGINE-VERSION` | engine-facing conformance | `M-4`, `M-11`, `M-19`, others |
| Fixture execution over the corpus | expected-vs-actual, forbidden values, tolerance widening, prose expectations named rather than silently passed | `M-1`..`M-21` |
| `INV-A1`, `INV-A2`, `INV-A3` | replay determinism, no clock read, no iteration-order dependence | `M-1`, `M-2` |
| The invariant partition assertion | an invariant added to the document and forgotten | `D-4` |

---

## D. Negative controls — the honest position before this work

The freeze validator carries **15 inline self-tests** that run on every
invocation and prove a scanner can fire (`the retired-code scan catches a live
use`, `the M5 mutation is caught`, `MUT9b: the same sentence inside live canon
is caught`, and eleven more). Those are real, executable negative controls and
they are ported.

Everything else in the freeze validator was demonstrated by **hand-applied
mutations recorded in prose** in `docs/process/runs/2026-08-20-alk-v2-freeze-5.md`
and the two decision run records — roughly 30 of them. Those are not
re-runnable. A mutation you cannot re-run is a claim about the past, not a
control on the present, and the run records themselves show why that matters:
`M1b` and `M3a` both initially passed a gate written to catch them, and were
only found because someone ran the mutation by hand that day.

Absorbing a check therefore means giving it an **executable** control in
`run-mutations.py`, not copying the prose.

## E. Nothing was found whose purpose could not be determined

Every `check()` call in `validate-freeze-5.py` resolved to a stated defect
class. The validator is unusually well commented — most checks carry a comment
naming the mutation or review finding that caused them to exist — and no check
required guessing. Had one, this document would stop here and the check would
not have been moved.
