# The executable fixture format

How an Alk V2 fixture states an input a machine can submit and an expectation a
machine can compare — and, just as importantly, which fixtures **must not** be
forced into that shape.

Written against `SHARED_V2_FREEZE_2` / `ALK_V2_FREEZE_5`, at base commit
`e1e66d472994316aacdee5c7efb6c85402ddb592`.

This document defines a **form**. It defines no chemistry. Every threshold,
band edge, rail, equation, cadence and evidence minimum stays where it is, in
`docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`. A conversion that changes what
a fixture asserts is not a conversion; it is a canon edit wearing a disguise.

---

## 1. The problem this solves

Of 204 fixtures, 6 can be submitted to an engine. The corpus was written to pin
canon behaviour **for a human reader**, before any engine or interface existed,
so the other 198 describe their scenario in whatever vocabulary suited the
paragraph they came from — `sPreDkhPerDay`, `readings: 4`, `day0: {...}`,
`{before, edit}`.

They are not wrong. They hold real worked reasoning, and much of that reasoning
is the only place a rule's *intent* is written down. The problem is narrower
than "the fixtures are bad": they are **unsubmittable**, because the documented
engine interface is one pure function of

> `(eventLedger, configurationHistory, asOf)` — `ALK-V2-IMPLEMENTATION-CONTRACT.md` §4

and a scenario description is none of those three.

## 2. The binding constraint is `asOf`, not the vocabulary

The obvious obstacle turns out not to be one. `_schema.json` already states a
complete, mechanical time convention:

```json
"timeConvention": {
  "epochDay0": "2026-09-01T09:00:00+10:00",
  "zone": "Australia/Brisbane (UTC+10, no DST)",
  "dayN": "epochDay0 + N x 24 h exactly"
}
```

So `timesDays: [0, 2, 4]` resolves to three absolute instants by a documented
rule, not by a guess. Relative-time vocabulary is a presentation detail.

The real obstacle is the third argument. **Of the 198 non-executable fixtures,
six state an assessment instant.** `AD-RET-001`…`AD-RET-005` state
`asOfDay: 4`; `WG-ALK-049` states `asOfDay: 20`. Nothing else in the corpus
states one, anywhere in its body.

`asOf` is not a free parameter. Evidence windows, staleness, every retest
candidate and the resolved configuration version all move with it. Choosing one
decides what the fixture meant.

Neither `ALK-V2-IMPLEMENTATION-CONTRACT.md`, `ALK-V2-DATA-CONTRACT.md` nor
Part III of the canon states how to choose it — Part III writes its inputs as
"Day 0 / Day 2 / Day 4" and stops. So **this format requires an explicit
`asOf`, and a fixture that does not state one cannot be converted.** That is
recorded as an open owner question, not settled here (`OD-008`, below).

Worth the owner's attention when answering: all six currently-executable
fixtures set `asOf` to their **last reading instant**, six times out of six.
That is evidence, not authority. One sentence in canon would unblock roughly
forty fixtures.

## 3. Three document types, and one record that is not a fixture

One format cannot honestly serve every shape. Forcing
`INV-REPLAY-001` — *"shuffle the input event array order, vary host locale and
timezone, run twice in one process and once in a fresh process"* — into a single
input/output pair would destroy the only thing it checks. So there are three
types, and a fourth record that is deliberately not executable.

| Type | Serves | Executable? |
|---|---|---|
| `WORKED_EXAMPLE` | one scenario, one assessment, comparable expectations | yes — this is what the harness submits |
| `CASE_SET` | one spine, N independent sub-scenarios | yes, after mechanical expansion to N `WORKED_EXAMPLE`s |
| `PROPERTY` | a property plus a generator | yes, as a property test — never as a worked example |
| `COVERAGE_ALIAS` | a second rule attribution on a scenario another fixture already owns | **no, and correctly no** |

Which corpus shape uses which:

| Shape (see §9) | n | Type |
|---|---|---|
| Reading series | 40 | `WORKED_EXAMPLE` |
| Case table | 23 | `CASE_SET` |
| Parameter-only | 10 | `WORKED_EXAMPLE` (ledger may be empty of readings) |
| Continuation | 2 | `WORKED_EXAMPLE` (base ledger + appended events, inlined) |
| Property / governance body | 18 | `PROPERTY` — already conforming, no conversion needed |
| Scenario alias | 16 | `COVERAGE_ALIAS` |
| Case selector | 6 | absorbed into the `CASE_SET` it selects from |
| Precomputed intermediate | 32 | **none of these** — see §9 |
| Qualitative state | 26 | blocked — see §9 |
| Retro-edit / transition | 11 | blocked — see §9 |
| Prior engine state | 8 | blocked — see §9 |
| No input | 6 | not a fixture yet — see §9 |

---

## 4. `WORKED_EXAMPLE`

The whole fixture. Fields marked **REQ** are required for the harness to
classify it `EXECUTABLE`.

```jsonc
{
  "fixtureId": "AD-RET-003",                    // REQ  stable, unchanged by conversion
  "title": "one line",                          // REQ
  "documentType": "WORKED_EXAMPLE",             // REQ  see §3

  "provenance": {                               // REQ  where the reasoning came from
    "class": "CANON_VERBATIM | CANON_DERIVED | CANON_QUALITATIVE",
    "canonSource": ["rule or golden ids"],
    "note": "for CANON_DERIVED: how the numbers were obtained"
  },
  "rulesExercised": ["ALK-RETEST-SCHEDULER-001", "..."],   // REQ  drives per-path coverage

  "input": {                                    // REQ  exactly the engine's three arguments
    "asOf": "2026-09-05T09:00:00+10:00",        // REQ  absolute instant. Never derived by the harness.
    "events": [ /* see §4.1 */ ],               // REQ  chronological; each event has `kind`
    "configurationHistory": [ /* see §4.2 */ ]  // OPT  defaults to one CANON_DEFAULT snapshot
  },

  "config": { },                                // OPT  inline overrides of CANON_DEFAULT

  "sourceScenario": { },                        // REQ on conversion — §5. The prose survives here.
  "conversion": { },                            // REQ on conversion — §5

  "expectedIntermediateEvidence": { },          // Layer 2
  "expectedSupportedResult": { },               // Layer 3
  "expectedAction": { },                        // Layer 4
  "expectedRetest": { },                        // retest decision
  "expectedReasonCodes": ["..."],               // codes that MUST be present
  "forbidden": { },                             // states, values or codes that MUST NOT appear
  "tolerance": { },                             // OPT  overrides `_schema.json#/defaultTolerance`
  "openIssues": ["..."]
}
```

`documentType` is additive. A fixture that omits it is a `WORKED_EXAMPLE` if it
has `input.events` and `input.asOf`, which keeps every existing fixture valid.

### 4.1 Events

The event vocabulary is the corpus's own, already used by the six executable
fixtures. Each event is an object with a `kind`. Field meanings are the data
contract's (`ALK-V2-DATA-CONTRACT.md` §2 `Reading`, §3 `MaintenanceDoseState`
and following) — this format adds none.

| `kind` | Required fields | Notes |
|---|---|---|
| `READING` | `measuredAt`, `rawValueDkh` | `timeProvenance` defaults to `EXACT_ABSOLUTE` |
| `READING_SERIES` | `startAt`, `everyHours`, `count`, `valuesDkh` | shorthand for a regular series; `len(valuesDkh) == count`. **Expansion is unowned — see below.** |
| `DOSE_STATE` | `programmedDoseMlPerDay`, `effectiveAt` | `effectiveAtConfidence` defaults to `EXACT` |
| `DOSE_CHANGE` | `effectiveAt`, `from`, `to` | `effectiveAtConfidence` is `EXACT` or `UNCERTAIN`; when `UNCERTAIN`, `effectiveAtEarliest` / `effectiveAtLatest` are required |
| `MANUAL_CORRECTION` | `occurredAt` | plus `amountMl` / `expectedContributionDkh` when known |
| `WATER_CHANGE` | `occurredAt`, `changedFraction` | plus `replacementAlkalinityDkh`, `replacementAlkalinityConfidence` |
| `DELIVERY_ANOMALY` | `anomalyType`, `fromAt`, `toAt` | `quantifiedEffect` may be `null` |
| `CONSUMPTION_CONTEXT_EVENT` | `occurredAt`, `classification`, `materiality`, `source` | |

Events are written in chronological order for a human reader. The engine must
not depend on that order — `INV-A1` requires the sort key
`(absoluteInstant, eventOrdinal, eventId)`, and mutation `M-1` is its negative
control.

**`READING_SERIES` expansion has no owner, and that is a defect this format
inherits rather than one it introduces.** The harness passes the event to the
engine verbatim, so every engine must implement the shorthand — an input form
the data contract does not declare. Two expanders already exist and neither is
authoritative for engines: `recompute-goldens.py` and
`tools/conformance/harness/package_checks.py` each expand it for their own
purposes. (The second was `validate-freeze-5.py`'s until that gate was retired
under `DEC-019`; the expander moved with the check, so the duplication moved
rather than closing.) A third, written by the first engine author from a
one-line table row, would make three implementations of one inference, which
`MASTER RULE 1` calls a defect rather than a coincidence.

`WG-ALK-003` uses it and is among the fixtures that already execute, so this
lands on the first day of engine work. Recorded as `OD-014`; **do not** resolve
it by writing a fourth expander.

### 4.2 Configuration history

`ALK-V2-IMPLEMENTATION-CONTRACT.md` §4 makes configuration a *history*, and
canon §518 makes an assessment resolve the version effective at its
`assessmentAsOf`. So the format carries a list, not a snapshot:

```jsonc
"configurationHistory": [
  { "configVersionId": "CFG-V1",
    "effectiveFrom": "2026-08-19T21:00:00+10:00",
    "targetRangeMinDkh": 8.2 }
]
```

Each entry is a `CANON_DEFAULT` snapshot with the named fields overridden.
Omitting `configurationHistory` means "one version, `CANON_DEFAULT`, effective
from its own `effectiveFrom`" — which is what every fixture converted so far
needs, and what the harness already did implicitly.

Prefer `configurationHistory` over the older top-level `config` whenever the
fixture depends on a configuration *change*. `config` remains valid for a
single-version override and is merged over `CANON_DEFAULT`.

Each history entry is merged over `CANON_DEFAULT` the same way `config` is, so
an entry states only what it changes. The harness sends the list as the
interface's second argument and sets `configuration` to the fixture's **last**
entry; it does not re-derive which entry is effective at `asOf`, because canon
§518 makes that the engine's rule to apply and the harness computes no
chemistry.

(This field was documented and *preferred* for a while before the runner read
it — it built a single flattened snapshot regardless. A fixture whose whole
point was a configuration change would have run against one version, silently,
and most likely passed, then stood as evidence that effective-dated
configuration worked. If you find another input this format describes and
nothing consumes, treat it the same way: as a defect, not a to-do.)

### 4.3 Expectations: a named field and a comparable value

**One rule.** An expectation is a field whose *name* is the engine field being
compared and whose *value* is what that field must equal.

The harness resolves expectations **by field name** against the whole engine
result (`compare.compare_by_name`), which is sound because `INV-B7` /
`ALK-VARIABLE-SEMANTICS-001` make a field name globally unambiguous. So the
block a expectation sits in is documentation for the reader; the **name** is
what binds.

Consequences, all of them enforced by existing harness behaviour:

- `selectedApproxHours: 40.0` is an expectation. **It is also, as it happens, a
  field the data contract does not declare** — see the warning below before
  copying this shape.
- `reason: "span 3.0 d < 4 d"` is **not** — it is working, in a field named
  after a justification rather than a quantity. It compares against nothing.
- Four keys are read as documentation and never compared: `note`, `$comment`,
  `derivation`, `why`. **Working goes in `derivation`.**
- A value with internal whitespace or a trailing full stop is prose and is
  reported as non-comparable (`compare.is_prose`). A single token is a value
  whatever its case: `FALLING`, `decrease`, `blocked` and `non-zero` all
  compare.

> **A named field is not automatically a *declared* field.** Resolution by name
> checks that the engine emitted something called that. It does not check that
> the data contract says the engine ever should.
>
> The five converted retest fixtures assert `selectedApproxHours`,
> `selectedReasonCode`, `selectedAction`, `observationCeilingHours`,
> `observationFloorApplied` and the per-candidate `rawHours` / `flooredHours` /
> `clampedHours` / `approxHours` / `boundSide`. **None of these is in
> `ALK-V2-DATA-CONTRACT.md`'s `RetestDecision`**, which states the decision in
> instants (`recommendedAt`, `at`) rather than hours. Against a
> contract-conformant engine, every one of them resolves to *"no field of that
> name"* and all five fixtures fail.
>
> They pass today only because the echo oracle replays each fixture's own
> expectations back at it, so the vocabulary never has to exist. This is the
> clearest thing the oracle cannot do for us, and it is worth knowing before
> trusting a green run.
>
> The disagreement is `OD-012` and no session may settle it: the fixture side is
> frozen content this format forbids a conversion to touch, and the contract
> side is the alk-v2 package. **When converting, do not silently invent a
> vocabulary to bridge it** — assert what the fixture asserts, and if that name
> is undeclared, say so in `conversion.questionsRaised`.

**Demotion rule.** A conversion may move a prose expectation into `derivation`
**only when the whole of what the sentence asserts is already asserted by named
fields in the same fixture**, and the conversion must name those fields.
Otherwise the prose stays where it is, keeps being reported as non-comparable,
and the missing named field is recorded as a question. This is what stops "make
the prose count go down" from becoming its own goal.

**The claim, not just the number.** An earlier wording of this rule asked only
that *the value the sentence states* be asserted elsewhere, which is too weak: a
sentence like `"not binding: raw T_signal is 162.765 h"` makes two assertions —
a number and a relation — and a later session could satisfy the letter of the
rule by pointing at the number while the relation quietly stopped being checked
anywhere.

A relational half is carried in one of two ways, and the conversion must say
which:

- **asserted** — some named field takes a different value if the relation is
  false. Preferred, because it is falsifiable on its own.
- **entailed** — the relation follows from an asserted field together with the
  canon rule the fixture exercises, so no engine can assert that field and
  violate the relation. Acceptable, but only when the entailment is stated. It
  is not a licence to demote anything that merely *sounds* implied.

If a sentence's relational half is neither, that half is not demoted. Record it
as a question instead.

Both demotions in this repository were re-examined when this wording was
tightened, and each is one of the two cases:

| Fixture | Number | Relation | Carried how |
|---|---|---|---|
| `AD-RET-001` | 24 h floor → `candidateTimes[SIGNAL_ACCUMULATION].flooredHours` | "on the signal candidate **only**" | **asserted** — the other two candidates assert unfloored values (`48.0`, `472.0`). An engine applying the floor beyond the signal candidate produces `24.0` there and goes red. |
| `AD-RET-002` | raw `T_signal` → `candidateTimes[SIGNAL_ACCUMULATION].rawHours` | "**not binding**" | **entailed** — the floor is `max(1 day, ·)`, which cannot reduce a value already above 1 day. Given the asserted `162.76520721 h`, no engine can assert that raw value *and* have the floor bind. |

`AD-RET-001`'s number is additionally proven: `M-24` copies the candidate's own
`rawHours` over its `flooredHours` and turns the fixture red at exactly that
field. Trading a prose expectation for a comparable one is only a fair trade if
the comparable one is proven, which by this repository's standing rule means
shown red.

Worked instance, from `AD-RET-002`:

```jsonc
// before — reported as an expectation that cannot be compared
"expectedRetest": {
  "minimumUsefulIntervalApplied": "not binding: raw T_signal is 162.765 h"
}

// after — the value was already asserted, so the sentence is working
"expectedIntermediateEvidence": { "tSignalRawHours": 162.76520721 },   // unchanged, still checked
"expectedRetest": {
  "derivation": "minimum useful interval not binding: raw T_signal is 162.765 h, asserted as tSignalRawHours"
}
```

Nothing stopped being checked. `162.76520721` was, and remains, compared at the
schema's `1e-9`.

---

## 5. Provenance of the conversion itself

A converted fixture must be auditable *as a conversion*, separately from being
auditable as a fixture. Two blocks do that, and both are required on any
fixture this format converts.

```jsonc
"sourceScenario": {
  "$comment": "The pre-conversion input, verbatim. Superseded as the engine input by `input`; retained because it is the reasoning, and the reasoning is not reproducible from the ledger.",
  "timesDays": [0, 2, 4],
  "alkDkh": [7.5, 7.35, 7.2],
  "asOfDay": 4,
  "outerMinDkh": 7.0
},

"conversion": {
  "convertedUnder": "ALK_V2_FREEZE_5",
  "timeConvention": "_schema.json#/timeConvention",
  "assertionsUnchanged": true,
  "suppliedByConversion": [
    "DOSE_STATE.effectiveAt = 2026-08-20T09:00:00+10:00 — not stated by the source fixture. The corpus's existing anchor, used by all six previously executable fixtures. Any instant at or before Day 0 yields the same behaviour here because the fixture states no dose change."
  ],
  "prosePromoted": [],
  "questionsRaised": []
}
```

`suppliedByConversion` is the load-bearing field. **Every value present in
`input` that the source fixture did not state must be listed there, with the
reason it is not a decision about chemistry.** An empty list is a strong claim
and should be true when it is made.

`assertionsUnchanged: true` claims that **no comparable assertion differs from
the source fixture** — no compared `expected*` value, no `expectedReasonCodes`
entry, no `forbidden` entry. A conversion that needs to change one is not a
conversion.

The single permitted movement is a §4.3 prose demotion, and it is permitted
precisely because a prose expectation was never a comparable assertion: the
comparator reported it as non-comparable and checked nothing. Every demotion
must still be declared in `prosePromoted`, naming the field that already
carries the value — so `assertionsUnchanged: true` alongside a non-empty
`prosePromoted` is consistent, and the reader can verify it in one place rather
than by diffing.

This is mechanically checkable and should be checked: compare the four
expectation blocks, `expectedReasonCodes` and `forbidden` against the source
commit, and every difference must be a key named in `prosePromoted`.

### What a conversion may never supply

Absolute rules. If a conversion needs one of these, it stops and records a
question instead.

1. **`asOf`.** Not derivable (§2).
2. **Any reading value.** `WG-ALK-049` states `readingDays: [0, 10, 20]` with no
   values; inventing three readings invents the trend.
3. **Any threshold, band edge, rate limit, tolerance, noise floor, cadence,
   evidence minimum, dosing equation or safety rail.** These are canon's, per
   `CLAUDE.md`. If canon does not state it, work stops and the gap is reported.
4. **A dose, potency or volume the fixture does not state.** `AD-RET-001` states
   no `currentDoseMlPerDay`; its provenance note says "Same state as
   `AD-MNT-006`", which is a note, not an input. Importing 9.0 mL/day from a
   different fixture is a decision about what this fixture meant.
5. **A reading series chosen to reproduce a stated σ or slope.** See §9,
   precomputed intermediate.

---

## 6. `CASE_SET`

**Specified, not yet proven** — no case-table fixture states an `asOf`, so none
could be converted at the time of writing. The expansion rule is documented so
that a later session does not have to invent one.

A case set is one spine plus N independent sub-scenarios. It expands
mechanically to N `WORKED_EXAMPLE`s:

```jsonc
{
  "documentType": "CASE_SET",
  "fixtureId": "AD-EPI-007",
  "input": { "shared": { /* events, configurationHistory, asOf common to all cases */ } },
  "cases": [
    { "case": "UNDER",       "input": { /* overlay */ }, "expectedAction": { } },
    { "case": "EXACTLY_AT",  "input": { /* overlay */ }, "expectedAction": { } },
    { "case": "OVER",        "input": { /* overlay */ }, "expectedAction": { } }
  ]
}
```

Expansion, in order:

1. The expanded fixture id is `<fixtureId>#<case>` — `AD-EPI-007#EXACTLY_AT`.
2. `input` is `shared` with the case's overlay applied: `events` **replaces**
   if the case supplies one and is otherwise inherited; every scalar key is
   overridden key-by-key. Each case must end with an `asOf`.
3. `rulesExercised`, `provenance` and `forbidden` are inherited unless the case
   states its own.
4. Expectation blocks are inherited then overridden **block by block**, not
   key by key — a case that states `expectedAction` replaces the spine's whole
   `expectedAction`. Merging keys would let a case silently inherit an
   assertion it contradicts.

**A case selector resolves here, not into a separate fixture.** Six
cross-reference fixtures name one case of a multi-case fixture —
`ALK-G012 → "WG-ALK-009 case PARTIAL"`, `ALK-G023 → "WG-ALK-012 case 5%"`,
`ALK-G039B → "WG-ALK-010 branch B"`. When the referent becomes a `CASE_SET`,
the selector becomes a `COVERAGE_ALIAS` of the expanded case
(`WG-ALK-009#PARTIAL`). It must not become a second fixture over the same
input: `MASTER RULE 1` calls two owners of one inference a defect.

## 7. `PROPERTY`

**No conversion needed.** The 18 bodies in `invariants-and-governance.json`
already carry a `kind` and a `property`, and 12 of them carry a `generator`.
That is the correct form for what they check.

```jsonc
{
  "documentType": "PROPERTY",
  "fixtureId": "INV-REPLAY-001",
  "kind": "PROPERTY",
  "property": "Same event ledger + same configuration versions + same asOf + same engine/canon version produces a byte-identical EngineResult and AuditTrace.",
  "generator": "Shuffle the input event array order (preserving instants), vary host locale and timezone, run twice in one process and once in a fresh process."
}
```

The four `kind`s already present are not interchangeable and should stay
distinct: `PROPERTY` (12) runs a generator against an engine; `STRUCTURAL` (3)
is a static property over documents or source; `SIMULATION` (2) is a long-run
trajectory; `CONTRACT` (1) is a snapshot-wording test over presentation output.

A property fixture will never be a worked example, and the harness must not
report it as an unconverted one. It is a different kind of check, not a
backlog item.

## 8. `COVERAGE_ALIAS`

Sixteen fixtures state `equivalentTo` another fixture and assert nothing
comparable of their own — `ALK-G003 → WG-ALK-001` asserts only a `note`;
`ALK-G033 → WG-ALK-024` asserts nothing at all.

They are not redundant. They carry a **different `rulesExercised` list**:
`ALK-G003` names `ALK-MOVEMENT-001`, `ALK-SUPPORTED-SLOPE-001`,
`ALK-CONSUMPTION-ESTIMATE-001` and `ALK-MAINTENANCE-SEMANTICS-001`, none of
which `WG-ALK-001` names. An alias is **rule-coverage attribution on a shared
input**, and deleting it would silently drop that coverage.

```jsonc
{
  "documentType": "COVERAGE_ALIAS",
  "fixtureId": "ALK-G003",
  "aliasOf": "WG-ALK-001",
  "rulesExercised": ["ALK-MOVEMENT-001", "..."],
  "note": "Non-zero supported falling slope; best-estimate demand and supported maintenance action both calculated and separately named."
}
```

An alias is never executable and must never be counted as an unconverted
fixture awaiting work. Its coverage attaches to the fixture it aliases.

---

## 9. What resists conversion, and why

Stated plainly, because a format's limits are part of the format. None of these
is fixed by a better format; each needs a value only the owner or the canon can
supply.

### Reading series (40) — blocked on `asOf` alone
Vocabulary is mechanical (§2). 34 of the 40 state no assessment instant. Six do,
and five of those are convertible today. `WG-ALK-049` additionally states
reading *days* with no reading *values*.
**Question:** `OD-008`.

### Precomputed intermediate (32) — the wrong target, and forcing it would lie
The input *is* a Layer-2/3 output. `WG-ALK-009` supplies
`sPreDkhPerDay: -0.25` and `sigmaPreDkhPerDay: 0.035355339059327376`; `AD-POT-001`
supplies a `preSide` with a slope and a σ already computed.

To make σ emerge from a ledger you must choose readings whose residual scatter
produces exactly that σ. That is possible — but the fixture's expectation was
computed **from the abstract σ**, not from readings, so the converted fixture
would assert something the original never did, and `assertionsUnchanged` would
be false.

These fixtures pin one formula in isolation, and that is a virtue.
`ALK-V2-MODULE-DESIGN.md` L6 says of `iv.classify`: *"takes only three numbers.
It cannot see the position, the potency or the recommendation, which is what
makes `INV-E6` structural."* A fixture that feeds `iv.classify` three numbers is
testing exactly the right thing at exactly the right level.

What they need is a **unit-level fixture type** bound to a named module, which
the current single whole-pipeline interface does not expose.
**Question:** `OD-009`.

### Qualitative state (26) — some convertible, some are decisions
`recommendationPrecisionMlPerDay: "NOT_CONFIGURED"` is mechanically expressible
as a configuration with the field absent. `maintenance: "established and
interpretable"` (`WG-ALK-041`) names a state with no stated ledger that
produces it; constructing one decides what the fixture meant. These must be
triaged one at a time against canon, not swept.

### Retro-edit / transition (11) — not one engine call
`WG-ALK-028` is `{before: {...}, edit: {targetRange: [8.4, 9.0]}}`: two
assessments and an assertion about the difference. The engine interface supports
this natively — same ledger, two configuration versions, two `asOf`s — but the
fixture format needs a two-call type with a `delta` expectation block. Not
defined here, because nothing in the corpus could be converted to prove it.
**Question:** `OD-010`.

### Prior engine state (8) — reconstruction, and expensive
`AD-RTN-004` supplies an `activeReturnPlan` with
`temporaryDoseExactMlPerDay: 5.392496392`. In a real ledger that plan arises
from prior events. Reconstructing the ledger that produces that exact number is
derivation work, and getting it wrong changes the fixture silently.

### No input (6) — not fixtures yet
`ALK-G008`, `ALK-G011`, `ALK-G018`, `ALK-G019`, `ALK-G020`, `ALK-G028` state
expectations with no input and no reference. They are canon expectations
awaiting a scenario. Writing one is fixture authoring under canon, not
conversion.

---

## 10. The conversion recipe

For a reading-series fixture that states its `asOf`. Follow in order; stop at
any step that requires a value the fixture does not state.

1. **Check the `asOf`.** `input.asOf`, or `input.asOfDay` resolved through
   `_schema.json#/timeConvention`. Absent → stop, record against `OD-008`.
2. **Check every reading has a value.** Days without values → stop.
3. **Copy the whole original `input` to `sourceScenario`** and add the
   `$comment` from §5. Do this before editing anything.
4. **Resolve times.** `dayN` → `epochDay0 + N × 24 h`, `epochDay0 =
   2026-09-01T09:00:00+10:00`. Emit `+10:00` offsets; the zone has no DST by
   deliberate choice of the schema.
5. **Emit `READING` events**, one per (time, value) pair, chronological, with
   `timeProvenance: "EXACT_ABSOLUTE"`.
6. **Emit a `DOSE_STATE`** if and only if the fixture states a dose. Anchor
   `effectiveAt` at `2026-08-20T09:00:00+10:00` — the corpus's existing anchor —
   and list it in `suppliedByConversion`. No dose stated → emit no `DOSE_STATE`
   and record the gap; do not import one from a neighbouring fixture.
7. **Move configuration values into `config`.** Keys such as `outerMinDkh`,
   `targetRangeMinDkh`, `selectedPotencyDkhPerMl` and
   `recommendationPrecisionMlPerDay` are configuration, not events. Keep them
   even when they equal `CANON_DEFAULT`: the fixture stated them, and dropping
   them loses the statement that they matter here.
8. **Leave every expectation alone**, except a prose demotion that satisfies
   §4.3 — and then record it in `conversion.prosePromoted` naming the field
   that already carries the value.
9. **Fill `conversion`.** `suppliedByConversion` must list everything from
   steps 4–7 that the fixture did not state.
10. **Run the harness.** The fixture must move to `EXECUTABLE` and must appear
    in its engine path's coverage line.
11. **Prove it red.** A mutation of a rule the fixture exercises must make it
    fail, and the failure text must name the mechanism. A converted fixture
    that has never been shown to fail has not been proven
    (`CORE-CANON-COVERAGE-001` item 9).

## 11. Open questions this format raises

Recorded, not settled. See `docs/process/OPEN-OWNER-DECISIONS.md`.

| Id | Question | Blocks |
|---|---|---|
| `OD-008` | What is the assessment instant of a worked golden? | ~40 reading-series fixtures, all 6 `NO_ASOF` fixtures, every `CASE_SET` |
| `OD-009` | Should the engine expose unit-level entry points, so a fixture can test one module with the numbers canon states? | 32 precomputed-intermediate fixtures |
| `OD-010` | Should a fixture be able to assert the *difference* between two assessments? | 11 retro-edit fixtures |
| `OD-011` | `AD-RET-001` states no `currentDoseMlPerDay`; its provenance says "Same state as `AD-MNT-006`". Is that an input or a note? | 1 fixture, and the precedent |
