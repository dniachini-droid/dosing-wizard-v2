# The conformance harness

What it is, how to run it, and — the part that matters most — **what it does not
cover**.

The harness is a **required check** (`DEC-016`). Nothing merges into the engine
or the alk-v2 package without it passing.

---

## Running it

```bash
python3 tools/conformance/run-conformance.py                       # no engine
python3 tools/conformance/run-conformance.py --engine './my-engine'
python3 tools/conformance/run-conformance.py --json report.json
python3 tools/conformance/run-mutations.py                         # negative controls
```

One command each, exit non-zero on any failure. No dependencies beyond the
Python 3 standard library.

## What it runs

| Stage | Subject | Needs an engine? |
|---|---|---|
| Mechanical document checks | the reason-code catalogue, the fixture index, the rule-traceability table, the data contract, and every field name the corpus asserts | no |
| Package checks (absorbed) | the canon, its rule coverage manifest, the open-issues register, the algorithm contract, and every owner decision recomputed from the fixtures' own declared inputs — 430 assertions in fifteen `CHK-*` buckets, absorbed from the retired `validate-freeze-5.py` under `DEC-019` | no |
| Fixture corpus | every fixture that carries a replayable event ledger and an `asOf` | yes |
| Engine-facing mechanical checks | output shape against `EngineResult`; emitted reason codes against the closed set, with their catalogued severity, owner and a non-empty payload; every withheld output — at any depth — named in the `affectedOutputs` of a `GATING` or `REFUSAL` code; engine and canon version declared and current | yes |
| Executable invariants | `INV-A1` replay determinism, `INV-A2` no clock read, `INV-A3` no iteration-order dependence | yes |
| Delegated invariants | `INV-B7`, `INV-I2`, `INV-I3` — the part executable without engine source; `INV-I8`, `INV-I9`, `INV-I10` — in full, absorbed from the retired validator | no |

For every fixture it reports the id, the expected value, the actual value and
pass/fail. For every invariant it reports the id, pass/fail, and what was
actually checked.

## It carries no answers of its own

Requirement, and a design constraint worth restating: **the harness transcribes
nothing.** Every expected value, every reason code, every field name, every
tolerance and every invariant is parsed at run time from:

- `docs/implementation/alk-v2/fixtures/*.json`
- `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`
- `docs/implementation/alk-v2/ALK-V2-DATA-CONTRACT.md`
- `docs/implementation/alk-v2/ALK-V2-INVARIANTS.md`
- `docs/implementation/alk-v2/traceability/alk-v2-traceability.json`
- `docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md`
- `docs/implementation/alk-v2/ALK-V2-ALGORITHM-CONTRACT.md`
- `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`

The canon is on that list only since the absorption. It is read, never written,
and never as a source of expectations for an engine: the package checks hold
the canon to its own manifest, to the fixtures and to the decisions it records,
which is a self-consistency question, not a chemistry one.

A copy of an expected value inside the harness would drift from canon and would
be a defect. `CLAUDE.md` puts it more strongly: outside `docs/research/` and
`docs/canon/`, no number governs behaviour.

The harness also holds the documents to themselves — it checks the reason-code
catalogue against its own coverage summary, and the fixture index against the
fixture bodies — so that a parse that silently lost half the corpus fails
loudly instead of reporting a small, clean pass.

## What it cannot cover — the important section

**Of 204 fixtures, 11 can be executed against an engine.**

(Counts here are as of `ALK_V2_FREEZE_5`. Every one of them is computed by the
harness at run time; none is transcribed. `ALK_V2_FREEZE_5` added 44 fixtures
and **none of them was executable**. The count moved from 6 to 11 when
`AD-RET-001`..`AD-RET-005` were converted to the event-ledger form defined in
`fixtures/EXECUTABLE-FIXTURE-FORMAT.md`.)

The documented interface is one pure function of
`(eventLedger, configurationHistory, asOf)` (`ALK-V2-IMPLEMENTATION-CONTRACT.md`
§4). A fixture is executable only when the harness can build that input from it
without inventing anything. The other 193 are listed individually in every run,
under the reason they cannot be run:

| Class | Count | Why |
|---|---|---|
| `EXECUTABLE` | 11 | carries an event ledger and an `asOf` |
| `NO_ASOF` | 6 | carries an event ledger but states no `asOf`; choosing one would be inventing an input |
| `ABSTRACT_INPUT` | 141 | `input` is a scenario description in an ad-hoc vocabulary (`sPreDkhPerDay`, `readings: 4`, `day0: {...}`), not an event ledger |
| `CROSS_REFERENCE` | 22 | no `input`; defers to another fixture via `equivalentTo` |
| `NO_INPUT` | 6 | no `input` and no cross-reference; nothing to submit |
| `PROPERTY_FIXTURE` | 18 | a property plus a generator, not a single input/output pair |

**The binding constraint is `asOf`, not the ad-hoc vocabulary.** The fixture
schema already states a complete time convention (`epochDay0`, `dayN =
epochDay0 + N × 24 h`), so `timesDays: [0, 2, 4]` resolves to absolute instants
mechanically. But of the 193 unexecutable fixtures, **one** now states an
assessment instant (`WG-ALK-049`, which states reading *days* with no reading
*values* and so is blocked twice over). Nothing else in the corpus states one.
That is `OD-008`, and it is the largest single blocker on the corpus becoming
machine-checkable. The full analysis, including the eleven distinct shapes the
corpus actually takes, is in
`docs/implementation/alk-v2/fixtures/EXECUTABLE-FIXTURE-FORMAT.md`.

Separately, **57 fixtures carry at least one expected value that is prose**
rather than a value an engine field can equal — `"known from the single valid
reading"`, `"0.064 < R_obs < 0.1439"`. Those entries are named individually and
excluded from comparison. Comparing them would require the harness to interpret
a sentence.

A single token is never treated as prose, whatever its case: `FALLING`,
`decrease`, `blocked` and `non-zero` are all compared. Only internal whitespace
or a trailing full stop makes a value a sentence. One predicate decides this,
with one owner — there were briefly two, disagreeing on 17 entries, so the
published count depended on which one you asked.

A fixture whose expectations are *all* non-comparable is reported
`NOT_COVERED / nothing to compare`, never `PASS`. It answered, and nothing was
verified; counting that as a pass is the precise failure this report exists to
prevent.

This is not a defect in the fixtures. They were written to pin canon behaviour
for a human reader, before any engine or interface existed. It is a precise
statement of how much of the corpus is machine-checkable **today**, and the
number is 11 of 204. Turning an `ABSTRACT_INPUT` fixture into an executable one
means writing its event ledger, which is fixture work governed by the canon —
not something the harness may do on the fixture's behalf.

**When that work happens is now decided.** `DEC-019`: an engine path is not
complete until its fixtures execute and its mutations turn them red. Conversion
rides along with implementation, one path at a time, which is why the report
below breaks coverage down per engine path rather than publishing one corpus
total. The unconverted fixtures are then exactly the ones whose engine paths do
not exist yet, and the backlog stops being a pile and becomes a map.

## Coverage per engine path

`11 of 204` is a true number that tells the owner nothing useful. It does not
say *which* behaviour is checkable, so it cannot show that a path which has been
built is covered, and it makes the remainder look like one undifferentiated
backlog.

So the run also reports, for each distinct area of engine behaviour, how many of
its fixtures execute and how many do not:

```
ENGINE PATH       EXEC / WORKED  COVERAGE              PROP
------------------------------------------------------------------------------
POTENCY              0 /     20  ....................     -
SEGMENTATION         1 /     35  #...................     -
MAINTENANCE          6 /     51  ##..................     -
RETEST               5 /     12  ########............     -
UNATTRIBUTED         0 /      7  ....................    18
```

**The paths are not invented here.** `traceability/alk-v2-traceability.json`
already assigns every rule exactly one `owner`, from a closed set of sixteen,
and `ALK-V2-MODULE-DESIGN.md` uses the same names. A fixture declares
`rulesExercised`; joining the two gives its paths. A hand-written
fixture-to-path table in the harness would be a second owner of a mapping the
traceability table already owns, which `MASTER RULE 1` calls a defect rather
than a coincidence.

Three things are deliberately not hidden:

- **Every unconverted fixture is still named individually** in `NOT COVERED`,
  which is rendered *before* this section so a reader meets the backlog before
  the summary of it. This view adds meaning; it removes nothing.
- **A fixture whose rules resolve to no owner is reported under
  `UNATTRIBUTED`**, with the reason, and no owner is guessed for it.
- **A property body is counted apart from worked examples** (the `PROP`
  column). `INV-REPLAY-001` is a different kind of check, not an unconverted
  worked example, and rolling it into a conversion backlog would overstate the
  work outstanding.

A fixture exercises several rules and so appears on every path those rules are
owned by, which means the columns sum to more than 204. That is deliberate:
this is coverage per path, not a partition of the corpus. The partition is
`NOT COVERED`.

The view is a **report, not a gate** — it does not fail the run. The one thing
it does assert is that no fixture is invisible to it, which is true by
construction today and is checked anyway, against the edit that later
introduces a filter.

**Of 76 invariants, 9 have an executable form** — three run against an engine,
three are carried in part by document-level checks, and three (`INV-I8`,
`INV-I9`, `INV-I10`) are carried in full by them, having arrived with the
absorption. The remaining 67 are listed with one
of three reasons: needs engine behaviour, needs implementation source to scan,
or has no executable form. The fourth reason used to be "already owned by the
alk-v2 package's own validator", which covered `INV-I8`, `INV-I9` and
`INV-I10`. That validator is retired (`DEC-019`) and all three are now executed
here in full, by `CHK-DECISION-COVERAGE`, `CHK-CANON-MANIFEST` and
`CHK-FIXTURE-ARITHMETIC`. The harness asserts that these two sets partition the
invariant document exactly, so an invariant added and forgotten becomes a
harness failure rather than silently counting as covered.

## With no engine

The run completes and reports. It does not crash.

- every executable fixture reports `FAIL` with `no engine present` — never
  `SKIP`, because an unrun fixture must not read as a passing one;
- the four engine-facing mechanical checks report `NOT_COVERED` with the reason;
- the document-level checks run normally and pass or fail on their own merits;
- the exit code is non-zero, because the corpus did not pass.

## Talking to an engine

A process boundary with a JSON line protocol, so the harness does not constrain
the language the engine is written in. Stack selection is an owner decision
recorded in `DECISIONS.md` and has not been taken; a harness that could only
load an engine written in its own language would take it by accident.

```
-> {"protocol": "alk-v2-conformance/1", "op": "assess", "requestId": "...",
    "asOf": "...", "events": [...], "configuration": {...},
    "configurationHistory": [...]}
<- {"ok": true,  "engineResult": { ... }}
<- {"ok": false, "error": "..."}
```

**No fixture id is sent.** The documented interface is a function of
`(eventLedger, configurationHistory, asOf)` and an id is none of those. An
earlier version did send one, which meant nothing in the harness could tell a
correct engine from a lookup table keyed on a corpus that is published in this
repository — and the engine is expected to be written against that corpus.
`requestId` is opaque. `op: "describe"` is called once per run and its
`engineVersion` / `canonVersion` are stamped into the report, because canon §64
makes the engine version part of what a replay holds constant and §47 requires
the replay to say which version produced it.

A hung engine fails the check rather than blocking it: the read has a 30-second
deadline, after which the engine is killed and the run reports it. A required
check that waits forever is a required check that gets waived.

Expected values are resolved against the engine result **by field name**, not by
a block-to-field mapping the harness invents. That is sound because
`ALK-VARIABLE-SEMANTICS-001` / `INV-B7` make a field name globally unambiguous.
Where a name does appear twice with different values, the harness reports it
rather than silently picking one — mutation `M-19` is the negative control for
exactly that.

## The mutation set

`tools/conformance/run-mutations.py`. Canon `CORE-CANON-COVERAGE-001` item 9: a
checker is not trusted as a gate until a deliberate mutation of the defect class
it targets has been shown to fail it.

Forty-seven named sabotages. Twenty-one (`M-1`..`M-21`) are applied to a
**reference oracle** that is emphatically not an engine, and twenty-six
(`D-1`..`D-26`) corrupt a throwaway copy of the alk-v2 documents **and of the
canon**, because a hook on an oracle can never reach a check whose subject is a
document. The repository is never modified by either arm.

Seventeen of the document mutations (`D-5`..`D-21`) arrived with the absorption
and there is one for each absorbed check. Five more (`D-22`..`D-26`) arrived
with the fix pass that independent review forced; `D-26` is the one to read
first, because it pins the rule that a check which did not run does not report
PASS. Two of them are the invariant
document's own stated negative controls, ported: `INV-I8`'s "delete the
`forbidden` block from `AD-MNT-006`" and `INV-I10`'s "change one `alkDkh` value
without changing the expectations". Running `INV-I8`'s showed it had gone
**stale** — `F5-05` is covered by three fixtures now and each carries its own
control, so removing one leaves the decision correctly pinned. `D-11` removes
all three and says so. That is what porting a control rather than copying its
prose is for.

The single most important of them is `D-17`, which reverts an owner decision by
**adding** a contradicting sentence to live canon rather than removing an
asserted one. Every presence check still passes under it. Only an absence
scanner sees it, and four owner decisions were once reverted exactly this way
while a 192-check gate stayed green.

`M-22` and `M-23` attack the retest scheduler specifically, and exist because
of `DEC-019` clause 3. When `AD-RET-001`..`AD-RET-005` were converted they
already went red under the generic controls — `M-17` (tolerance drift), `M-18`
(non-finite), `M-11` (forbidden value), `M-12` (dropped required code), `M-20`
(silent withhold). That is not enough to call a fixture proven. A numeric offset
applied to every float in the corpus demonstrates only that the comparator
subtracts; it says nothing about the rule the fixture exists to pin. `M-22`
drops the losing candidates from the scheduler's audit list and `M-23` applies
the signal candidate's floor to the outer-bound forecast candidate, which is
what `ALK_V2_FREEZE_5` F5-15 forbids.

**Two are blocked.** `M-8` (repeat-window clustering) cannot run: no executable
fixture contains two readings inside the 30-minute window, and supplying the
clustering behaviour in the oracle would mean implementing a canon rule.
`D-13` (a constant that did not pre-exist) cannot run either: its check's
subject is the canon as it stood at a pinned git commit, which no mutation of
the working tree can reach, so `CHK-CANON-CONSTANTS` carries an inline probe
instead. Both unblocking conditions are stated in full in the mutation set and
reprinted on every run. Neither is counted as caught.

A mutation counts as caught only when the subject it named goes red **and** the
failure text names the mechanism it claims to guard. Both halves matter: the
first version of this harness published `M-11` as demonstrating the
forbidden-value check while that check could not fire at all — the four fixtures
went red through the ordinary comparator instead. The mutation harness now
reports `NOT CAUGHT BY ITS NAMED MECHANISM` for exactly that shape.

The oracle: `tools/conformance/reference/echo_oracle.py` replays each
fixture's own declared expectations back as an `EngineResult` and computes no
chemistry whatsoever. A caught mutation proves the harness detects that defect
class. It proves nothing about any engine, because there is no engine.

A mutation counts as caught when it makes the harness fail subjects the
unmutated baseline passed. The comparison is a delta rather than an absolute
verdict, because the pre-existing document defects below keep the absolute
verdict red no matter what the oracle does.

## What the harness found on its first run

Three document defects, reported and left for the owner. The harness reports
them on every run, which is the most durable form of recording available.

0. **The reason-code coverage summary disagrees with its own tables.** It
   declares `CAPABILITY_` = 14 and `SAFETY_` = 18; the document holds 13 and 19
   distinct rows respectively, with no duplicates. Hand-verified. New at
   `ALK_V2_FREEZE_5`.

1. **`POSITION_NO_VALID_MEASUREMENT` is not in the closed catalogue.**
   `ALK-V2-ALGORITHM-CONTRACT.md` §`CORE-POSITION-001` requires the engine to
   emit it, and the rule-traceability table names it, but
   `ALK-V2-REASON-CODES.md` has no `POSITION_` group and no such row. An engine
   implementing the algorithm contract as written would emit an uncatalogued
   code, which conformance-gate item 4 makes a failure.

2. **Twenty-two reason codes have two owners.** The catalogue's rule 3 is "one
   owner per code; the owning module is the only module that may emit it". The
   traceability table's Reason-codes column means "codes the owning module may
   emit for this rule". Where the two disagree — `TRAJECTORY_UNCERTAINTY_LIMITED`
   owned by `TREND` but emitted by `SUPPORT`, and twenty-one more — the documents
   contradict each other. `INV-I2` is the invariant this violates.

3. **Twenty fixture ids are claimed as coverage but do not exist.** The
   traceability table names `VAL-001..008`, `CLU-001..005`, `TIME-001`,
   `INT-005`, `AUDIT-023`, `AUDIT-027`, `AUDIT-028`, `AD-DEL-002` and `ALK-021`
   as covering fixtures. None is in the corpus. Meanwhile
   `traceability/alk-v2-traceability.json` declares `rulesWithoutFixture: []`,
   i.e. complete coverage. Three further entries in that column are prose or
   span references rather than artefact ids.

4. **Eight fixtures assert an undimensioned twin of a dimensioned field name.**
   `WG-ALK-045` asserts `observedSlope`, `supportedSlope`,
   `continuousActionCandidate` and `recommendedDose` while other fixtures assert
   `observedSlopeDkhPerDay`, `supportedSlopeDkhPerDay`,
   `continuousActionCandidateMlPerDay` and `recommendedDoseMlPerDay`; `WG-ALK-015`,
   `WG-ALK-050`, `WG-ALK-058` and `ALK-G029` do the same for `maintenanceDose`,
   `selectedPotency`, `maintenanceEstimate` and `temporaryDose`. `INV-B7` requires
   one meaning per field name, and the harness's by-name resolution rests on it.

5. **Twenty-five rule ids are named by a fixture but are absent from the
   rule-traceability table.** Surfaced by the per-path coverage view, which
   cannot attribute an engine path to a rule the table does not carry. Most are
   canon section references rather than rule rows (`Part II §48`, named by five
   fixtures; `Part II §5.4`, by three), but some look like ordinary rule ids
   that are simply missing: **`ALK-062` is named by four fixtures**, including
   three of the five converted here, and `ALK-003A` by four. This is the mirror
   image of defect 3 above — that one is coverage claimed for fixtures that do
   not exist, this one is fixtures claiming rules that do not. Both are
   reported on every run. New at this work; recorded, not fixed.

None of these is fixed here. Fixing them means editing the alk-v2 package
documents, which this work was scoped out of.

## One gate

`ALK_V2_FREEZE_5` brought `docs/implementation/alk-v2/validate-freeze-5.py`, a
second package-scoped mechanical validator, and this document used to end this
section by saying the overlap between it and this harness was "not resolved
here, and it should be".

It is resolved. The owner decided one gate; `DEC-019` records it. The validator
is retired and deleted, and its unique coverage — 430 assertions — is in
`tools/conformance/harness/package_checks.py`. `docs/process/GATE-CHECK-INVENTORY.md`
is the inventory that was produced **before** anything moved, classifying every
one of the validator's 437 checks as duplicate, unique, or superseded, and
naming what each superseded check dropped.

Eight were not carried across. Five were duplicates of `CHK-INDEX-INTEGRITY`
and `CHK-RC-CATALOGUE`. Three were weaker than the harness's equivalent: one
read a declared total instead of deriving it, one excluded from resolution
exactly the ids that turn out to dangle, and one transcribed the literal `76`
into the gate — a number in a checker that canon owns, which is the thing
`CLAUDE.md` forbids.

`recompute-goldens.py` is untouched by that decision and is still in the
package. It is a recorder, not a gate: it exits 0 whatever it finds. Where this
harness recomputes arithmetic it does so as a gate, and the two answer
different questions.

Where a property is genuinely owned elsewhere the harness still declines to
duplicate it and says so. What it no longer does is leave the question standing.

## What the harness will not tell you

Stated because a gate's limits are part of the gate.

- **It cannot tell a correct engine from a very good guess** on a fixture whose
  expectations are all prose. Such a fixture is reported `NOT_COVERED /
  nothing to compare` rather than `PASS`, but that is the only protection.
- **A fixture may widen its own tolerance.** The fixture schema permits it, so
  the harness reports the widening on the fixture's line rather than forbidding
  it. Read those lines: the corpus and the engine will be edited in the same
  pull request.
- **Some goldens are written to fewer decimals than the tolerance demands** —
  `9.14609` compared at `1e-9`. A correct engine can fail those by rounding
  alone. The harness reports it per field; it does not widen the tolerance,
  which is the schema's and not the harness's.
- **`INV-A1` runs in-process only.** Its own generator asks for a fresh process
  and a varied host locale; the run says so in its own output rather than
  letting a `PASS` read as the whole invariant.
