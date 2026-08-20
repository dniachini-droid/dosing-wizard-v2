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
named sabotages of `tools/conformance/reference/echo_oracle.py`. A mutation
counts as caught when it makes the harness fail subjects the unmutated baseline
passed; the delta rather than the absolute verdict, because the pre-existing
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
which this run was scoped out of. The harness reports all three on every run.

| # | Severity | Finding |
|---|---|---|
| 1 | `CORRECTNESS_GAP` | `POSITION_NO_VALID_MEASUREMENT` is required by `ALK-V2-ALGORITHM-CONTRACT.md` and named by the traceability table, but is not in the closed catalogue. An engine implementing `CORE-POSITION-001` as written would emit an uncatalogued code, failing conformance-gate item 4. |
| 2 | `CORRECTNESS_GAP` | Twenty-two reason codes have two owners between the catalogue's owner headings and the traceability table's owner column, e.g. `TRAJECTORY_UNCERTAINTY_LIMITED` (`TREND` vs `SUPPORT`). The catalogue's rule 3 and `INV-I2` both forbid it. |
| 3 | `CORRECTNESS_GAP` | Twenty fixture ids are claimed as coverage by the traceability table and do not exist (`VAL-001..008`, `CLU-001..005`, `TIME-001`, `INT-005`, `AUDIT-023`, `AUDIT-027`, `AUDIT-028`, `AD-DEL-002`, `ALK-021`), while `traceability/alk-v2-traceability.json` declares `rulesWithoutFixture: []`. Three further entries in that column are prose or span references. |

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

## Reviewers

Per the task: `breaker` and `canon-conformance-auditor` were **not** run. This
is test equipment, not chemistry.

- **run:** `test-engineer`, once — would anything actually fail if this were
  wrong.
- **run:** `jake`, over `test-engineer`'s output.
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
check failures     : 3
invariant failures : 5
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
check failures     : 3
invariant failures : 2
corpus problems    : 0
RESULT: RED   (exit 1)
```

All 6 executable fixtures pass; all three engine-facing mechanical checks pass;
`INV-A1`, `INV-A2`, `INV-A3`, `INV-B7` pass. The five remaining failures are the
three pre-existing document defects and the two invariants that delegate to
them. This is the baseline the mutation harness measures against.

### Mutation harness — `exit 0`

```
mutations defined : 20
  caught (red)    : 19
  NOT caught      : 0
  blocked         : 1  M-8
RESULT: GREEN
```

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

- The three alk-v2 document defects above. Not fixed; out of scope.
- Six-of-160 fixture executability. Not a defect to fix; a fact to see.
- `M-8` blocked pending an engine.
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
