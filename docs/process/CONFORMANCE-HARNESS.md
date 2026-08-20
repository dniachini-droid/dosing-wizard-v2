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
| Fixture corpus | every fixture that carries a replayable event ledger and an `asOf` | yes |
| Engine-facing mechanical checks | output shape against `EngineResult`; emitted reason codes against the closed set, with their catalogued severity, owner and a non-empty payload; every withheld output — at any depth — named in the `affectedOutputs` of a `GATING` or `REFUSAL` code; engine and canon version declared and current | yes |
| Executable invariants | `INV-A1` replay determinism, `INV-A2` no clock read, `INV-A3` no iteration-order dependence | yes |
| Delegated invariants | `INV-B7`, `INV-I2`, `INV-I3` — the part executable without engine source | no |

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

A copy of an expected value inside the harness would drift from canon and would
be a defect. `CLAUDE.md` puts it more strongly: outside `docs/research/` and
`docs/canon/`, no number governs behaviour.

The harness also holds the documents to themselves — it checks the reason-code
catalogue against its own coverage summary, and the fixture index against the
fixture bodies — so that a parse that silently lost half the corpus fails
loudly instead of reporting a small, clean pass.

## What it cannot cover — the important section

**Of 204 fixtures, 6 can be executed against an engine.**

(Counts here are as of `ALK_V2_FREEZE_5`. Every one of them is computed by the
harness at run time; none is transcribed. `ALK_V2_FREEZE_5` added 44 fixtures
and **none of them is executable**, so the executable count did not move.)

The documented interface is one pure function of
`(eventLedger, configurationHistory, asOf)` (`ALK-V2-IMPLEMENTATION-CONTRACT.md`
§4). A fixture is executable only when the harness can build that input from it
without inventing anything. The other 198 are listed individually in every run,
under the reason they cannot be run:

| Class | Count | Why |
|---|---|---|
| `EXECUTABLE` | 6 | carries an event ledger and an `asOf` |
| `NO_ASOF` | 6 | carries an event ledger but states no `asOf`; choosing one would be inventing an input |
| `ABSTRACT_INPUT` | 146 | `input` is a scenario description in an ad-hoc vocabulary (`sPreDkhPerDay`, `readings: 4`, `day0: {...}`), not an event ledger |
| `CROSS_REFERENCE` | 22 | no `input`; defers to another fixture via `equivalentTo` |
| `NO_INPUT` | 6 | no `input` and no cross-reference; nothing to submit |
| `PROPERTY_FIXTURE` | 18 | a property plus a generator, not a single input/output pair |

Separately, **59 fixtures carry at least one expected value that is prose**
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
number is 6 of 204. Turning an `ABSTRACT_INPUT` fixture into an executable one
means writing its event ledger, which is fixture work governed by the canon —
not something the harness may do on the fixture's behalf.

**Of 76 invariants, 6 have an executable form** — three run against an engine,
three are carried by document-level checks. The remaining 70 are listed with one
of four reasons: needs engine behaviour, needs implementation source to scan,
has no executable form, or is already owned by the alk-v2 package's own
validator (`validate-freeze-5.py`), where implementing it here as well would
give one rule two owners. The harness asserts that these two sets partition the
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

Twenty-five named sabotages. Twenty-one (`M-1`..`M-21`) are applied to a
**reference oracle** that is emphatically not an engine, and four (`D-1`..`D-4`)
corrupt a throwaway copy of the alk-v2 documents, because a hook on an oracle
can never reach a check whose subject is a document. The repository is never
modified by either arm.

**One is blocked.** `M-8` (repeat-window clustering) cannot run: no executable
fixture contains two readings inside the 30-minute window, and supplying the
clustering behaviour in the oracle would mean implementing a canon rule. Its
unblocking condition is stated in full in `mutations/__init__.py` and reprinted
on every run.

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

None of these is fixed here. Fixing them means editing the alk-v2 package
documents, which this work was scoped out of.

## Two gates now exist

`ALK_V2_FREEZE_5` brought `docs/implementation/alk-v2/validate-freeze-5.py`, a
package-scoped mechanical validator, and `recompute-goldens.py`. Their document
checks and this harness's document checks overlap.

That overlap is **not resolved here, and it should be**. Canon `MASTER RULE 1`:
two implementations of one rule that agree today are a defect, not a
coincidence. Where this harness can see that a property is already owned by the
package validator — `INV-I8`, `INV-I9`, `INV-I10` — it declines to implement it
and says so rather than quietly agreeing. Whether the two gates should merge,
and which owns what, is an open question for the owner.

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
