# Run record — 2026-08-20 — conformance harness

## Base

- **Run base commit:** `acc66155f2e8bcaea6e74ddc3010db3fcf314d8d` (`origin/main`).
  Confirmed against the remote with `git fetch --all` before any conclusion was
  drawn. A previous session reached conclusions from a clone nine commits stale;
  that is why the confirmation is recorded here rather than assumed.
- Branch heads at that fetch:
  - `origin/main` `acc66155`
  - `origin/claude/dosing-wizard-review-agents-hpnc50` `48b4fade`
  - `origin/claude/freeze-5-alk-canon-k7yo2r` `86e79221` (not read into, not touched)
- **`docs/canon/` state:** unchanged by this run. Verified below.
- Branch: `claude/dosing-wizard-conformance-harness-4f5yvi`, cut fresh from
  `origin/main`.

## Task

Build the conformance harness (Part 1); build the mutation set (Part 2); write
negative controls for every invariant lacking one (Part 3); encode two owner
decisions and the associated wiring (Part 4).

### Admissibility

Admissible. Nothing here adopts chemistry. The harness reads every threshold,
tolerance, reason code and expected value from the existing documents at run
time and transcribes none of them, which is the strongest available form of
compliance with `CLAUDE.md`'s chemistry rule: there is no number in the harness
to be wrong.

Part 3 edits `ALK-V2-INVARIANTS.md`, which the task explicitly permits and
limits to additive changes.

Part 4 records `DEC-016`, `DEC-017` and `DEC-018`. All three were the owner's,
taken before the run.

## Plan, and what was out of scope

In scope: `tools/conformance/`, the invariant document's negative controls, the
two skills, the roster, `DECISIONS.md`, `OPEN-OWNER-DECISIONS.md`, and merging
the two review agents.

Declared out of scope, and held to:

- **no engine code.** None was written. The mutation target is a fixture-echoing
  oracle that computes no chemistry, and the one mutation that would have
  required real engine behaviour (`M-8`) is reported blocked rather than
  enabled by writing it;
- **no change to canon**, and no change to the alk-v2 package beyond the
  invariant document's negative controls;
- **no change to PR #5 or `claude/freeze-5-alk-canon-k7yo2r`.** Neither was
  read into the working tree or modified;
- **no merge.**

## What was implemented

### Part 1 — the harness

`tools/conformance/run-conformance.py`, one command, non-zero on any failure.
Readers for the fixture corpus, the reason-code catalogue, the data contract,
the invariant document and the rule-traceability table; a tolerance-aware
comparator driven by the fixture schema's own tolerance table; a JSON-line
process boundary so the engine's language stays an open owner decision; and a
report that names what it could not cover instead of counting it.

Design points worth recording because they were decisions:

- **Expected values are resolved by field name**, not by a block-to-field
  mapping the harness invents. Sound because `INV-B7` makes a field name
  globally unambiguous. Where a name resolves to two differing values the
  harness reports it rather than picking one — and it caught exactly that in the
  first draft of the reference oracle, which had emitted `tOuterLowDays` twice.
- **Fixture executability is classified pessimistically.** A fixture counts as
  executable only when the harness can build `(eventLedger, configurationHistory,
  asOf)` from it without inventing anything.
- **The harness asserts its own completeness.** Every invariant in the document
  is either executed or appears in a table of stated reasons; a mismatch is a
  harness failure. That is the antidote to a "0 unreadable" count that means "0
  of the things I know how to look at".

### Part 2 — the mutation set

`tools/conformance/run-mutations.py` and `tools/conformance/mutations/`. Twenty
named sabotages of `tools/conformance/reference/echo_oracle.py`, which the fix
pass grew to 25 across two arms — 21 oracle mutations and 4 document mutations.
A mutation counts as caught when it makes the harness fail subjects the
unmutated baseline passed **and** the failure text names the mechanism it
guards; the delta rather than the absolute verdict, because the pre-existing
document defects hold the absolute verdict red regardless.

### Part 3 — invariant negative controls

Thirty-four added, strictly additive: 91 insertions, 0 deletions. No assertion,
canon basis or generator was altered.

### Part 4 — wiring

`DEC-016` (harness is a required check), `DEC-017` (`jake` runs after the
reviewer sequence, not within it), `DEC-018` (`normal-operation-reviewer` is a
specialist trigger in `/implement` and `/pr-gate`). Skills and roster updated to
match; the two review agents merged in.

## Departures from plan

One, and it matters.

`jake` was first placed at the **end** of `/implement-chemistry`, after the fix
pass. That contradicted `.claude/agents/jake.md`, whose own description says
"before any fix work", and it made his sorting useless — it could not reach the
single fix pass it was meant to inform. He was moved to step 6, after both
reviewers and before the fix pass, which is the slot `adjudicator` already
occupies for the same reason. The owner's instruction ("after the reviewer
sequence, not within it") is satisfied either way; the definition and the
usefulness are only satisfied by the earlier slot.

## Findings

### Found by the harness, in the alk-v2 package — RECORDED, LEFT OPEN

None of these is fixed here: fixing them means editing alk-v2 package documents,
which this run was scoped out of. The harness reports all four on every run.

| # | Severity | Finding |
|---|---|---|
| 1 | `CORRECTNESS_GAP` | `POSITION_NO_VALID_MEASUREMENT` is required by `ALK-V2-ALGORITHM-CONTRACT.md` and named by the traceability table, but is not in the closed catalogue. An engine implementing `CORE-POSITION-001` as written would emit an uncatalogued code, failing conformance-gate item 4. |
| 2 | `CORRECTNESS_GAP` | Twenty-two reason codes have two owners between the catalogue's owner headings and the traceability table's owner column, e.g. `TRAJECTORY_UNCERTAINTY_LIMITED` (`TREND` vs `SUPPORT`). The catalogue's rule 3 and `INV-I2` both forbid it. |
| 3 | `CORRECTNESS_GAP` | Twenty fixture ids are claimed as coverage by the traceability table and do not exist (`VAL-001..008`, `CLU-001..005`, `TIME-001`, `INT-005`, `AUDIT-023`, `AUDIT-027`, `AUDIT-028`, `AD-DEL-002`, `ALK-021`), while `traceability/alk-v2-traceability.json` declares `rulesWithoutFixture: []`. Three further entries in that column are prose or span references. |
| 4 | `CORRECTNESS_GAP` | Eight fixtures assert an undimensioned twin of a dimensioned field name (`observedSlope` vs `observedSlopeDkhPerDay`, `maintenanceDose` vs `maintenanceDoseMlPerDay`, and six more). `INV-B7` requires one meaning per field name, and the harness's by-name resolution rests on it. Found only after the fix pass extended the check from 39 names to 446. |

### Found about the corpus itself — RECORDED, LEFT OPEN

**Six of 160 fixtures are executable against the documented engine interface.**
Not a defect in the fixtures, which were written to pin canon for a human reader
before any interface existed — but it is the single most consequential fact
about the state of this repository's test coverage, and it was not previously
visible. The full breakdown is in `docs/process/CONFORMANCE-HARNESS.md` and in
every harness run.

### Found in my own work, and fixed

- The reference oracle emitted `tOuterLowDays` in two places with two values.
  Caught by the harness's own name-collision detection. Fixed in the oracle.
- The oracle withheld nine outputs as `NOT_RUN` with no explaining code,
  violating `INV-I4`. Caught by `CHK-WITHHELD-REASONED`. Fixed in the oracle,
  and the defect is now `M-7`'s negative control.
- Two false positives of my own making: the traceability "Fixtures" column
  legitimately references invariant ids, and `AuditTrace.dose` is a documented
  sub-object rather than a bare dimensionless numeric. Both checks were
  corrected before any finding was reported.

### Owner decisions raised

- `OD-004` — should chemistry work also get an ordinary-use review? Raised
  because the owner's `jake` resolution does not carry across to
  `normal-operation-reviewer`, which is a reviewer.
- `OD-005` — should the harness be enforced by CI, and by what? Raised because
  `DEC-016` makes it required while nothing enforces it, and because a required
  check that cannot yet pass would block the merges that would fix it.

Both filed in `docs/process/OPEN-OWNER-DECISIONS.md`. `OD-006` and `OD-007` are
recorded closed there, pointing at `DEC-016` and `DEC-017`, so that a reader of
that queue finds them alongside `OD-001`.

## The fix pass — one, per `/implement`

`test-engineer` returned 16 findings, one a `BLOCKER`. `jake` sorted them: 14
`BUG`, 1 `EDGE CASE`, 1 `ALREADY COVERED`, and read the fix-pass question as
"which of these make a statement the repository publishes false". That reading
decided the pass.

### The BLOCKER, verified independently before acting

`runner._check_forbidden` resolved forbidden keys against **top-level**
`EngineResult` keys only. Of the corpus's 21 substantive `forbidden` entries, 19
name nested fields (`action`, `recommendedDoseMlPerDay`,
`predictedPostSlopeDkhPerDay`, ...), so the check could not fire for them — and
skipped silently. `M-11`, published as the negative control proving that check
fires, was being credited because four fixtures went red through the *ordinary
comparator*.

Confirmed by calling the function directly under the mutation, rather than
taking the report on trust:

```
WG-ALK-001     forbidden entries=['predictedPostSlopeDkhPerDay']  -> violations=[]
WG-ALK-002     forbidden entries=['trajectory']                   -> violations=[]
WG-ALK-003     forbidden entries=['action']                       -> violations=[]
WG-ALK-004     forbidden entries=['recommendedDoseMlPerDay']      -> violations=[]
```

A checker that cannot fire, published as demonstrated, is exactly what canon
`CORE-CANON-COVERAGE-001` item 9 and `DEC-016` forbid. Fixed by resolving
forbidden keys through the same flattened-name index the comparator uses, and by
recording every still-unresolvable forbidden assertion as a visible gap. After
the fix, `M-11` fires through the checker it names:

```
M-11  result: CAUGHT — 4 new failing subject(s)
      via   : forbidden value observedTrajectory.predictedPostSlopeDkhPerDay == 0 was returned
```

### The structural fix I had not seen at all

The protocol put `fixtureId` in every request. The documented interface is a
function of `(eventLedger, configurationHistory, asOf)`; an id is none of those,
and the corpus is published in this repository. Nothing in the harness could
have told a correct engine from a lookup table — against an engine an LLM is
expected to write against that corpus. Fixed structurally by removing the id
from what the engine sees, rather than by adding a mutation to detect the abuse.

### Everything else changed in the pass

- `expect_red` is now **enforced**, and each mutation additionally declares the
  `expect_mechanism` its failure text must contain. A sabotage that turns
  something else red now reports `NOT CAUGHT BY ITS NAMED MECHANISM`. This is
  the structural fix for the class the BLOCKER belonged to.
- **Four document mutations** (`D-1`..`D-4`) added: every prior mutation was a
  hook on the oracle, so the three document-reading checks — and the harness's
  own invariant-partition assertion — had no control. They corrupt a throwaway
  copy of the package; the repository is never touched.
- `CHK-WITHHELD-REASONED` now enforces `INV-I4` as written: withheld fields are
  found at any depth, and each must be named in a `GATING`/`REFUSAL` code's
  `affectedOutputs`. Previously any gating code anywhere satisfied it, and a
  nested withheld field was invisible.
- `CHK-RC-CLOSURE-ENGINE` now enforces the catalogue's rule 4 (mandatory
  payload), which is `INV-I3`'s second clause and was unenforced.
- New `CHK-ENGINE-VERSION`: canon §64's third replay condition and §47's stamp.
  `describe()` was dead code and the versions were never recorded. `M-21` is its
  control.
- `CHK-DIMENSION-SAFETY` extended from the 39 contract-declared names to the 446
  the corpus also asserts. It immediately found an eighth-order finding: 8
  fixtures assert undimensioned twins of dimensioned names.
- A fixture with **zero comparable expectations is `NOT_COVERED`, not `PASS`**.
- Fixture-level tolerance **widening** is reported per fixture; goldens written
  to fewer decimals than the tolerance demands are reported per field. Neither
  widens the gate — the tolerance is the schema's.
- One prose predicate with one owner (there were two, disagreeing on 17
  entries); the forbidden-value epsilon is read from the schema instead of
  hardcoded.
- `--only <typo>` is a corpus problem, not a clean zero-fixture report.
- `SubprocessEngine` reads with a 30-second deadline and kills a hung engine.
- `INV-A1` carries a partial-execution note naming what its own generator asks
  for and this run does not do.
- Seven invariant negative controls corrected: `INV-D4`, `INV-I5`, `INV-A3`,
  `INV-B6`, `INV-C2`, `INV-I3`, `INV-I4`. Four cited fixtures that do not assert
  the quantity, or claimed execution that had not happened. Two of `jake`'s
  sub-items I did **not** act on, on his advice and my own reading:
  `INV-A3`'s control is realisable across processes, and `INV-B6`'s assertion is
  a static scan — though I did drop the identity `1.00` from its multiplier set.
- `/pr-gate`'s rule was unsatisfiable — it required a green harness on a tree
  where the harness is red by design. Restated as a base-versus-head comparison,
  which is what `DEC-016` actually says.

### Recorded and left open, not fixed

- The `M-8` block, unchanged.
- `INV-I5`'s next-test-time clause has no fixture behind it; the invariant now
  says so instead of citing two that cannot detect it.
- The fourth document defect (undimensioned twins) — same scope bar as the other
  three.

## Reviewers

Per the task: `breaker` and `canon-conformance-auditor` were **not** run. This
is test equipment, not chemistry.

- **run:** `test-engineer`, once — would anything actually fail if this were
  wrong. It found 16, one a `BLOCKER`, and it found it by mutating a scratch
  copy of the repository rather than by reading. That is the review that earned
  its place here.
- **run:** `jake`, over `test-engineer`'s output. 14 `BUG`, 1 `EDGE CASE`,
  1 `ALREADY COVERED`; he also checked the one `EXPECTED_DEBT` citation I asked
  him to verify and found it right for three of its four items and wrong for the
  fourth (`M-8` was not named in `CONFORMANCE-HARNESS.md`, only in the run record
  and the mutation module). That is now fixed.
- **considered and not run:** `canon-conformance-auditor` and `breaker`
  (excluded by the task); `integrator` (the cross-document surface here is the
  skills-and-roster wiring, and `test-engineer`'s brief covered it);
  `normal-operation-reviewer` (no trend, dose, retest or user-visible output
  behaviour changes); `advisor` (the two decisions were the owner's already, and
  the two new questions were filed directly); `adjudicator` (one reviewer, no
  disagreement to resolve).

## Checks run, with real output

Three runs, verbatim output in the PR body and reproduced here in summary. Full
output was read, not summarised from a distance.

### Harness, no engine — `exit 1`

```
fixture failures   : 6
check failures     : 4
invariant failures : 6
corpus problems    : 0
RESULT: RED   (exit 1)
```

Behaves as designed with no engine: the run completes, every executable fixture
reports `FAIL / no engine present` rather than being skipped, the three
engine-facing checks report `NOT_COVERED` with the reason, and the document
checks run normally.

### Harness against the reference oracle — `exit 1`

```
fixture failures   : 0
check failures     : 4
invariant failures : 3
corpus problems    : 0
RESULT: RED   (exit 1)
```

All 6 executable fixtures pass; all four engine-facing mechanical checks pass;
`INV-A1`, `INV-A2`, `INV-A3` pass. The seven remaining failures are the four
pre-existing document defects and the three invariants that delegate to them.
This is the baseline the mutation harness measures against.

### Mutation harness — `exit 0`

```
mutations defined : 25
  caught (red)    : 24   M-1..M-7, M-9..M-21, D-1..D-4
  NOT caught      : 0
  blocked         : 1    M-8
RESULT: GREEN
```

Every caught mutation was verified to go red on the subject it declared **and**
with the failure text naming the mechanism it guards. That second condition is
new in the fix pass, and it is what turns "19 of 20 caught" from a count of
mutations into a count of demonstrated checkers.

`M-8` (repeat-window clustering) is blocked, with its unblocking condition
stated in full in `tools/conformance/mutations/__init__.py` and reprinted on
every run: it needs either an engine that clusters, or an executable fixture
containing two readings inside the 30-minute window. Neither exists, and
supplying the clustering behaviour in the oracle would be writing engine code.

### Canon unchanged

```
$ git diff acc66155 --stat -- docs/canon/
(no output)
```

## Outstanding, carried into the PR

- The four alk-v2 document defects above. Not fixed; out of scope.
- Six-of-160 fixture executability. Not a defect to fix; a fact to see.
- `M-8` blocked pending an engine, with its condition stated.
- `INV-I5`'s next-test-time clause has no fixture that can detect it. The
  invariant now says so rather than citing two that cannot.
- `OD-004` and `OD-005` open.

## What was deliberately not done

- No engine, and no engine-shaped code. The oracle is a negative-control target
  and says so in its own module docstring, repeatedly.
- No fix to any of the three document defects the harness found, and no edit to
  `ALK-V2-REASON-CODES.md`, the traceability table or the fixture corpus.
- No new fixture, and no rewriting of an `ABSTRACT_INPUT` fixture into an
  executable one. That is fixture work governed by canon.
- No CI configuration. `OD-005`.
- No merge.

---

## Rebase onto `ALK_V2_FREEZE_5` — appended after the fact

`main` moved while this branch was open: PR #5 merged, bringing `ALK_V2_FREEZE_5`
and 20 commits. Rebased `acc66155` → `7aaadef`.

### Conflicts

**One**, in `docs/implementation/alk-v2/ALK-V2-INVARIANTS.md`, at `INV-B5`.

- **`main` changed:** the `Assert`, adding that `recommendationConfidence` is
  always emitted as `UNSPECIFIED` under `ALK_V2_FREEZE_5` — an owner decision.
  It also added a negative control: *multiply the continuous candidate by a
  confidence-derived factor; `AD-OUT-001` and `INV-ALK-CONFIDENCE-001` must
  fail.*
- **This branch changed:** the negative control only — *multiply the continuous
  action candidate by a factor chosen from `recommendationConfidence`; the
  four-way sweep must then return four different values; `INV-ALK-CONFIDENCE-001`
  must fail.* The `Assert` was left at its base text.
- **Kept: `main`'s side entirely.** The two negative controls describe the *same*
  mutation, so this is a duplicate rather than a disagreement — and `main`'s is
  the better-sourced of the two, citing `AD-OUT-001`, a Freeze-5 fixture this
  branch had no knowledge of. The behaviour change in the `Assert` is `main`'s
  alone; this branch never touched it, so there was nothing to weigh against it.
  Editing a line the freeze had just written would have been the wrong move on
  a canon-adjacent document.
- **Lost:** the observable this branch's phrasing named ("four different
  values"). Judged not worth editing frozen text to reinstate.

No other file conflicted. Both sides' work survives: all 76 invariants carry a
negative control, `main`'s 16 new invariants and 6 amended ones are byte-intact,
and 33 of this branch's 34 negative controls are unchanged.

### What the rebase then required, and why

**The harness's own completeness assertion fired on all 16 new invariants** —
`INV-C12`..`C15`, `G10`..`G17`, `I7`..`I10` — the moment the rebase landed. That
is `D-4`'s mechanism working on a real change rather than on a mutation, and it
is the single best evidence in this branch that the assertion is worth having.
All 16 are now accounted for.

Three of them — `INV-I8`, `INV-I9`, `INV-I10` — are recorded under a new reason,
`OWNED_BY_PACKAGE_GATE`: they are document-level properties already executed by
`validate-freeze-5.py`, which arrived with Freeze 5. Implementing them here as
well would give one rule two owners, which `MASTER RULE 1` calls a defect rather
than a coincidence.

### Two defects in my own checkers, found by the rebase and fixed

- **Group attribution was positional.** Freeze 5 appended its 16 invariants after
  the last `## Group` heading rather than filing each under its own, so
  `INV-G10` sits physically under "Group I". The parser attributed by position
  and reported three false coverage-table mismatches. The id letter is
  authoritative; fixed.
- **A forbidden retired code was called vacuous.** Freeze 5 retires codes into
  "Retired by …" tables. Six fixtures forbid a retired code, which is exactly
  right — `INV-I7` asserts no retired code is emitted — and the checker reported
  all six as vacuous assertions. The parser now reads all the retired tables (35
  codes) and treats forbidding one as legitimate. Both were **my** defects, and
  both would have been published as findings against `main`'s package.

### One new finding in the package — RECORDED, LEFT OPEN

The reason-code coverage summary disagrees with its own tables: it declares
`CAPABILITY_` = 14 and `SAFETY_` = 18; the document holds 13 and 19 distinct
rows, no duplicates. Hand-verified before reporting, precisely because the two
defects above were mine rather than the package's.

### Results after the rebase

```
no engine        exit 1   6 fixtures FAIL/ENGINE_ABSENT, corpus problems 0
reference oracle exit 1   6/6 executable fixtures PASS, all 4 engine-facing
                          checks PASS, INV-A1/A2/A3 PASS
mutations        exit 0   25 defined, 24 caught, 0 missed, 1 blocked (M-8)
```

The corpus is now **204 fixtures** (was 160), **242 live reason codes** plus 35
retired (was 235), **76 invariants** (was 60). Freeze 5 added 44 fixtures and
**not one of them is executable**: the number stays 6. `canonVersion` reads
`SHARED_V2_FREEZE_2 / ALK_V2_FREEZE_5` with no harness change, which is what
"the harness transcribes nothing" was for.

### Also open

Two gates now exist. `validate-freeze-5.py` and this harness overlap on document
checks. Not resolved here; recorded in `CONFORMANCE-HARNESS.md`.

> **CLOSED, 2026-08-20, after this run.** The owner decided one gate (`DEC-019`).
> `validate-freeze-5.py` is retired and deleted; its 422 unique assertions were
> absorbed into `tools/conformance/harness/package_checks.py` first, and each
> arrived with a negative control demonstrated red. `INV-I8`, `INV-I9` and
> `INV-I10` — recorded above under `OWNED_BY_PACKAGE_GATE` — are now executed
> here in full. See `docs/process/runs/2026-08-20-gate-consolidation.md` and
> `docs/process/GATE-CHECK-INVENTORY.md`. This record is left as written; the
> note is the pointer, not a correction.
