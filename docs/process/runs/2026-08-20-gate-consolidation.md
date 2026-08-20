# Run record — folding the freeze validator into the conformance harness

- **Date:** 2026-08-20
- **Branch:** `claude/fold-freeze-into-conformance-foedqv`
- **Base:** `main` at `8bcd8730b978d148c4dba5ff71be928cafa69f41` (PR #5 + PR #7)
- **Owner decision executed:** one gate. Recorded as `DEC-019`.
- **Scope:** no engine code, no screens, no mockups branch, no merge.

---

## Task

Two gates existed and checked overlapping things:

```
tools/conformance/run-conformance.py    the conformance harness
docs/implementation/alk-v2/validate-freeze-5.py    the Alk freeze validator
```

Canon `MASTER RULE 1`: two implementations that agree today are a defect,
because one will drift and nothing will notice. The harness's own rebase report
had flagged this and correctly declined to duplicate what it could see
overlapping — which was the right instinct and the wrong resting place, because
it left three invariants owned by a gate nothing else ran.

The owner decided: one gate. The harness owns everything executable. The
validator is retired — **but only after every check it performed that the
harness did not had been moved across and demonstrated to work.**

---

## Order of work, because the order is the point

Retiring before absorbing would silently drop canon coverage. Nothing was moved
until the inventory was complete and committed (`f2ec088`), and nothing was
deleted until every absorbed check had gone red under a mutation.

---

## Part 1 — inventory

`docs/process/GATE-CHECK-INVENTORY.md`, committed before a single check moved.

Measured, not estimated: the validator's `check()` was instrumented to record
the source line of every call, and the calls were grouped by the section they
belong to.

| | |
|---|---|
| Validator assertions at base | **437** (437 PASS, 0 FAIL, exit 0) |
| Harness checks at base | **10** `CHK-*`, 204 fixtures, 76 invariants |
| Harness verdict at base | 6 fixture / 5 check / 6 invariant failures, exit 1 |
| Mutation set at base | 25 defined, 24 caught, 1 blocked, GREEN |

Four-way classification:

| Class | Count |
|---|---|
| `DUPLICATE` | 5 |
| `SUPERSEDED` | 3 |
| `UNIQUE_TO_FREEZE` | 429 |
| `UNIQUE_TO_HARNESS` | the harness's own 10 checks, 3 executable invariants, and the whole fixture-execution arm |

Nothing in the validator resolved to an undeterminable purpose. It is unusually
well commented — most checks carry a note naming the mutation or review finding
that caused them to exist — so no check had to be guessed at. Had one, the work
would have stopped there rather than dropping it.

**The three SUPERSEDED checks, and exactly what each dropped:**

1. `no rule without a fixture` read the *declared* `totals.rulesWithoutFixture`
   and trusted it. `CHK-TRACE-COVERAGE` derives the answer and additionally
   fails the declaration when it is stale. Dropped: the assertion that the
   declared array is literally `[]`.
2. `traceability fixture refs resolve (goldens)` excluded `INV-*`, `CLU-\d`,
   `VAL-\d`, `TIME-\d`, `INT-\d` and thirteen further prefixes from resolution —
   which is precisely the set of ids that turn out to dangle.
   `CHK-INDEX-INTEGRITY` resolves all of them and reports 20 dangling ids and 3
   prose references. Dropped: nothing.
3. `invariant bodies match the coverage total` transcribed the literal `76`
   twice. The harness compares the invariant document only to itself. Dropped:
   the pin on the number 76 — which is canon's to set, and a transcribed number
   inside a gate is the thing `CLAUDE.md` forbids.

---

## Part 2 — absorption

`tools/conformance/harness/package_checks.py`. The logic is the validator's,
near verbatim; re-deriving 400 checks by hand is how coverage gets lost
quietly. What changed is the reporting adapter — `check(name, ok, detail)` now
accumulates into a `CheckOutcome` bucket — and the paths, which all go through
`harness/paths.py` so `ALK_V2_PACKAGE_DIR` and the new `ALK_V2_CANON_DIR` reach
these checks exactly as they reach the rest of the harness. That is what lets a
document mutation corrupt a throwaway copy and require the check to go red.

Fifteen buckets, 423 assertions:

| Check | Assertions | What it owns |
|---|---|---|
| `CHK-PKG-JSON` | 1 | every JSON in the package parses, `baselines/` included |
| `CHK-FREEZE-STAMP` | 2 | the current freeze is stamped, the superseded one is gone |
| `CHK-CANON-RULE-BODIES` | 46 | every canon rule has a body that states its mechanism |
| `CHK-CANON-MANIFEST` | 8 | `CORE-CANON-COVERAGE-001` items 1, 2, 3, 4/5 and 8 |
| `CHK-TRACE-INTEGRITY` | 4 | totals, one owner per rule, no duplicate ids, no `BLOCKED` rows |
| `CHK-RC-RETIRED` | 10 | no retired code or retired rule id is live anywhere |
| `CHK-DECISION-COVERAGE` | 58 | every owner decision has a positive fixture and a negative control |
| `CHK-OPEN-ISSUES` | 38 | the register agrees with what was decided |
| `CHK-CANON-CONSTANTS` | 9 | no constant arrived undeclared |
| `CHK-FIXTURE-ARITHMETIC` | 2 | every series fixture reproduces its stated intermediates |
| `CHK-DECISION-FIXTURES` | 113 | the owner decisions recomputed from the fixtures' own inputs |
| `CHK-CANON-DECISION-TEXT` | 73 | the canon's own statement of those decisions |
| `CHK-LIVE-TEXT-ABSENCE` | 19 | no live text contradicts a decision it carries |
| `CHK-CONTRACT-STRUCTURE` | 17 | contract rows and preconditions |
| `CHK-BOUNDARY-INVARIANCE` | 23 | the warning moves nothing across the boundary |

Seven further assertions went to `CHK-RC-CLOSURE-DOC` rather than into a new
bucket, because that is where they belong. That check now harvests **every**
shape in which the corpus requires a reason code — `variant.expectedReasonCodes`,
`expectedReasonCodesByCase` and `variantReasonCodes` as well as the top-level
array — taking it from 683 code references to 747, and it reports a retired code
distinctly from an uncatalogued one.

**One thing was deliberately narrowed during absorption.** Widening the
self-contradiction clause to the whole harvest reported `AD-SAF-009` as
requiring a code it forbids. It does not: its primary case forbids
`SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN` because an uncomputable
consumption must not be read as an unknown dose, while its `variant` sets
`currentDoseMlPerDay: "UNKNOWN"` and requires exactly that code. A `variant` is
a different state of the world, not a different expectation about the same one.
The validator scoped that clause to the primary case, and so does the harness.
The comment in `checks.py` says why, so it is not "fixed" later.

### Invariant ownership

`INV-I8`, `INV-I9` and `INV-I10` were accounted for under
`OWNED_BY_PACKAGE_GATE` — a reason that named a gate that no longer exists.
They are now delegated to `CHK-DECISION-COVERAGE`, `CHK-CANON-MANIFEST` and
`CHK-FIXTURE-ARITHMETIC` and executed **in full**, in the same commit that
absorbed them. No invariant was unowned for a single commit.

### Negative controls

Seventeen new document mutations, `D-5` … `D-21`, one per absorbed check.
Document mutations now copy a throwaway tree of the canon as well as the
package.

Two are the invariant document's own stated controls, ported rather than
paraphrased:

- `INV-I10`: *"change one `alkDkh` value without changing the expectations"* —
  ported, and it fires.
- `INV-I8`: *"delete the `forbidden` block from `AD-MNT-006`"* — ported, and it
  **did not fire**. `F5-05` was covered by one fixture when the invariant was
  written and is covered by three now, each carrying its own control, so
  removing one leaves the decision correctly pinned and the check correctly
  stays green. `D-11` removes all three, `AD-MNT-006` still among them. The
  staleness of the document's wording is a finding, left open below.

`D-17` is the one worth singling out. It reverts an owner decision by **adding**
a contradicting sentence to live canon rather than removing an asserted one.
Every presence check still passes under it. Only an absence scanner sees it, and
this is not hypothetical: four owner decisions were once reverted in canon
exactly this way while a 192-check presence-only gate stayed green.

Four controls initially reported NOT CAUGHT for a defect in the *mutations*,
not the checks: `str.replace(old, new, 0)` replaces nothing, and four sabotages
had been written with `count=0` meaning "all". A mutation that applies cleanly
and changes not one character reads exactly like a check that cannot fire. The
helper now refuses an anchor it cannot find, and says so in a comment.

---

## Part 3 — retirement

`docs/implementation/alk-v2/validate-freeze-5.py` deleted. Every reference
updated:

| Where | What changed |
|---|---|
| `DECISIONS.md` | `DEC-019` added — the owner decision, the sequence it required, and its consequences |
| `PROJECT-STATE.md` | "One executable gate exists, and only one", with why the harness is correctly red today |
| `docs/process/CONFORMANCE-HARNESS.md` | the "Two gates now exist / not resolved here" section replaced by "One gate"; canon added to the sources list; invariant and mutation counts corrected |
| `docs/implementation/alk-v2/README.md` | the validator row struck through and repointed at the harness |
| `ALK-V2-TEST-MATRIX.md` | two references repointed; the historical wording noted rather than silently rewritten |
| `ALK-V2-OPEN-ISSUES.md` | `OI-GATEVOCABULARY-001`'s **Artefact** repointed at `package_checks.py`; the "new-constant scan" finding repointed at `CHK-CANON-CONSTANTS` |
| `docs/process/runs/2026-08-20-conformance-harness.md` | a **CLOSED** note appended to its "Also open" item; the record itself left as written |
| `docs/process/GATE-CHECK-INVENTORY.md` | new — the Part 1 deliverable |

**The canon was not modified.** No canon file contains a reference to the
validator; `git diff --stat` for `docs/canon/` is empty.

**No CI references it.** There is no CI in this repository — a fact worth
stating, because "update CI" was in the task and the honest answer is that
there is nothing to update. `.claude/skills/` and `docs/process/AGENT-ROSTER.md`
already named only the conformance harness.

`recompute-goldens.py` is untouched. It is a recorder — exit 0 whatever it
finds — and was never a gate.

Run records other than the one annotation above are left as written. They are
accounts of what happened on a given day, and rewriting them would falsify
history; the repository's own convention is to preserve superseded wording and
mark it.

---

## Part 4 — verification

### 1. The three runs, actual results

**No engine** — `python3 tools/conformance/run-conformance.py`

```
corpus size      : 204 fixtures (index declares 204)
reason-code set  : 242 codes, closed
invariants       : 76 documented
package checks   : 423 assertions over the canon, the register and the corpus

fixture failures   : 6      (all ENGINE_ABSENT — correct with no engine)
check failures     : 5      (all pre-existing; the same 5 as at base)
invariant failures : 6
corpus problems    : 0

RESULT: RED   (exit 1)
```

The five failing checks are `CHK-RC-CATALOGUE`, `CHK-RC-CLOSURE-DOC`,
`CHK-RC-OWNER`, `CHK-INDEX-INTEGRITY` and `CHK-DIMENSION-SAFETY` — the
pre-existing document defects the harness has reported since it was built. **All
fifteen absorbed checks pass**, as they must: the validator reported 437 PASS at
this same commit.

**Reference oracle** — the echo oracle, which is emphatically not an engine

```
fixture failures   : 0
check failures     : 5
invariant failures : 3
corpus problems    : 0

RESULT: RED   (exit 1)
```

`CHK-OUTPUT-SHAPE`, `CHK-RC-CLOSURE-ENGINE`, `CHK-WITHHELD-REASONED`,
`CHK-ENGINE-VERSION`, `INV-A1`, `INV-A2` and `INV-A3` all pass against it. The
three failing invariants are `INV-B7`, `INV-I2` and `INV-I3`, delegated to
three of the five failing document checks. Red is the correct verdict and it is
red for the same reasons it was before this work.

**Mutation set** — `python3 tools/conformance/run-mutations.py`

```
mutations defined : 42
  caught (red)    : 40
  NOT caught      : 0
  blocked         : 2   M-8, D-13

RESULT: GREEN   (exit 0)
```

Was 25 defined / 24 caught / 1 blocked. `M-8` is unchanged and still blocked for
the reason it always was. `D-13` is newly blocked, and honestly so: its check's
subject is the canon as it stood at a pinned git commit, which no mutation of
the working tree can reach. It carries an inline probe instead — a string the
base canon does not contain, which must be reported absent, proving the
membership test can return false — and `D-13` states what would unblock it
rather than a control being faked.

### 2. Check accounting — 437 before, 423 + 7 after

Every assertion that existed in either gate before this work and does not exist
in the harness now, with where it went. This is a diff of assertion names, not
a summary.

| Assertion | Where it went |
|---|---|
| `index fixture count matches bodies` | DUPLICATE — `CHK-INDEX-INTEGRITY` |
| `index ids resolve 1:1` | DUPLICATE — `CHK-INDEX-INTEGRITY` |
| `index reports no duplicates` | DUPLICATE — `CHK-INDEX-INTEGRITY` |
| `index provenance split matches bodies` | DUPLICATE — `CHK-INDEX-INTEGRITY` |
| `catalogue and retired sets are disjoint` | DUPLICATE — `CHK-RC-CATALOGUE` (`rc.self_consistency`) |
| `no rule without a fixture` | SUPERSEDED by `CHK-TRACE-COVERAGE` |
| `traceability fixture refs resolve (goldens)` | SUPERSEDED by `CHK-INDEX-INTEGRITY` |
| `invariant bodies match the coverage total` | SUPERSEDED by the invariant document's own self-consistency check |
| `every emitted reason code is catalogued` | MOVED to `CHK-RC-CLOSURE-DOC`, widened to every shape |
| `no retired reason code is emitted by a fixture` | MOVED to `CHK-RC-CLOSURE-DOC` (control `D-20`) |
| `every by-case reason code is catalogued` | MOVED to `CHK-RC-CLOSURE-DOC` |
| `no by-case reason code is retired` | MOVED to `CHK-RC-CLOSURE-DOC` (control `D-20`) |
| `the by-case reason-code shapes are actually read by this gate` | MOVED to `CHK-RC-CLOSURE-DOC` as its `sites` count |
| `^ negative control: the by-case harvester sees a planted code` | MOVED to `CHK-RC-CLOSURE-DOC` as an inline probe |
| `no fixture expects a code it also forbids` | MOVED to `CHK-RC-CLOSURE-DOC` (control `D-21`) |

Fifteen assertions, all accounted for. `437 − 15 = 422`, plus **one new**
assertion — the inline negative control `CHK-CANON-CONSTANTS` needed in order to
be absorbable at all — gives the 423 the harness reports.

Nothing vanished. The diff was produced mechanically, by capturing every
assertion name the absorbed module runs and differencing it against the 437 the
validator emitted at the base commit.

### 3. Canon coverage, after

The validator's canon coverage is now the harness's. Run against
`docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`, the harness checks:

- **`CHK-CANON-MANIFEST`** — `CORE-CANON-COVERAGE-001` over the canon's own
  `CANON RULE COVERAGE MANIFEST`: every manifest id resolves to an
  authoritative body (item 1); no rule body has two authoritative bodies
  (item 8); no normative body is missing from the manifest (item 3); every
  manifest entry names a fixture that exists in the corpus (items 4/5); no rule
  body added by the current freeze is under the 400-character substantiveness
  threshold (item 2). Bodies that predate the freeze are **reported and not
  failed**, in the check's `detail` — four of them today.
- **`CHK-CANON-RULE-BODIES`** — 46 assertions: each rule id the package depends
  on has a body, is inventoried in traceability, and states the mechanism that
  distinguishes it from what it replaced; the freeze declaration is present; the
  superseded declaration is marked historical; no superseded freeze id survives
  as current authority.
- **`CHK-CANON-DECISION-TEXT`** — 73 assertions over the canon's own statement
  of owner decisions 16–29: the boxed sizing formulas and what may not be
  substituted into them, the inclusive advisory comparison in both directions,
  the pre-branch precondition and its reach into branch A, the emit block, the
  five warning elements and that none is optional, the branch partition's joint
  exhaustiveness, and the two rules retired with their wording preserved.
- **`CHK-LIVE-TEXT-ABSENCE`** — 19 assertions: sentence-scoped scanners over the
  canon and the package specs for a decision reverted by addition, each with an
  inline control fed the exact reversion text.
- **`CHK-RC-RETIRED`** — includes the canon: no retired reason code appears on a
  live canon line, and no retired rule id is cited as live governing authority.
- **`CHK-CANON-CONSTANTS`** — every constant the freeze relies on pre-existed in
  the canon at the pinned base commit, read through `git show` rather than from
  the working tree, so the comparison is not vacuous at the freeze commit.

`CHK-INDEX-INTEGRITY`'s docstring still says the harness does not read the
canon. That is now true of that one check and not of the harness; the sentence
was left alone because it is quoting the invariant fixture's own scope
statement.

---

## Recorded and left open

Neither is fixed here. Both are outside the scope this task set.

1. **`INV-I8`'s stated negative control is stale.**
   `ALK-V2-INVARIANTS.md` says *"delete the `forbidden` block from
   `AD-MNT-006`; the check must fail."* It does not fail: `F5-05` is covered by
   `AD-MNT-006`, `AD-MNT-007` and `AD-MNT-008` and each carries its own control.
   The invariant's stated control was written when one fixture covered it.
   `D-11` removes all three so the defect class is genuinely demonstrated, and
   says in its own text that the document's form is stale. Editing
   `ALK-V2-INVARIANTS.md` is package documentation work and was not in scope.
   The class question is worth the owner's attention: a stated control that
   names a specific fixture goes quietly stale every time coverage is added.

2. **`CHK-CANON-CONSTANTS` cannot see a constant introduced under a name not on
   its list.** Not new — `ALK-V2-OPEN-ISSUES.md` already carries it as "The
   new-constant scan" — but it now has a second consequence: the check cannot be
   given a document mutation, and `D-13` is `BLOCKED` because of it. Closing it
   means a numeric-literal extractor over the canon diffed against the base,
   which is a different and much stronger check. Writing it here would have been
   inventing a check rather than absorbing one.

---

## What was deliberately not done

- No engine code. No screens. The mockups branch untouched.
- The canon not modified beyond references to the retired tool — and in the
  event, not at all: it held no reference.
- `recompute-goldens.py` not retired, not promoted. It was not in scope and it
  is not a gate.
- No new checks beyond what absorption required. The single new assertion is
  `CHK-CANON-CONSTANTS`'s inline negative control, without which that check
  could not have been absorbed under the rule that an unfired checker is not a
  gate.
- The five pre-existing document defects not fixed. They are the alk-v2
  package's, they predate both gates, and the harness has always reported them.
- Not merged.

## Reviewers

`test-engineer` once, and `jake` over its output, as the task specified.
`breaker` and `canon-conformance-auditor` were **not** run, also as specified.
