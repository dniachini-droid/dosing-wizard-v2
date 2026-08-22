# Open Owner Decisions

A queue of decisions that only the owner can take, raised by work that hit them.

**This file is not an authority.** Nothing here is decided, and nothing here may
be relied on by any implementation. A decision becomes authority only when the
owner records it in `DECISIONS.md` — or, for chemistry behaviour, only through a
governed canon reissue.

## Why it exists

Autonomous and assisted work regularly reaches a point where continuing requires
a choice nobody has made. The two bad outcomes are the work stopping and the
question evaporating, or the work continuing and the question being answered
quietly by whoever happened to be holding the keyboard.

This file is the third option: the question survives, findable, with enough
worked up around it that answering it is cheap.

## How entries are added

`advisor` works the decision up; the session that hit it files the entry.
Newest first.

```
## OD-nnn — <one-line question>

- **Raised:** <date> · **By:** <run / PR / session> · **Status:** OPEN
- **Blocks:** <what cannot proceed, or "nothing — recorded for later">

**The question, in plain language**

**Why it is undecided** — what the existing authorities do and do not say, quoted.

**Options** — two or three, each with what it commits to, what it forecloses,
what it costs, and how reversible it is.

> **No chemistry in this file.** Where the decision is about a chemistry value,
> state the options *qualitatively* — "more conservative than the canon's
> current rule", "matched to the kit's stated repeatability", "no rule at all
> for this parameter" — and never as numbers. Naming candidate thresholds here
> would put unowned chemistry into the repository in a file no chemistry review
> reads, which is precisely the V1 contamination route recorded in
> `V1-AGENT-SALVAGE-AUDIT.md`. A number in this register is a defect regardless
> of the caption above it. If the decision cannot be stated without numbers, it
> is not ready for this register: it needs a `research-sprint` first, and the
> numbers belong in that report and ultimately in a canon reissue.

**Which direction being wrong hurts more**

**What already covers this** — if anything.

**What must change alongside**

**Recommendation, and what would make it wrong** — or "no basis for a
recommendation; this needs the owner's judgement", which is a complete and
acceptable entry.
```

## How entries are closed

The owner decides. The decision is recorded in `DECISIONS.md` as a new entry.
The entry here is then marked:

```
- **Status:** CLOSED — see DEC-nnn (<date>)
```

Closed entries stay. The record of what was open, and for how long, is worth
more than a tidy file.

---

## Open

## OD-021 — Six worked goldens state a value rounded below the tolerance they are compared at

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `WG-ALK-001`, `WG-ALK-004`, `WG-ALK-006`, `WG-ALK-033`, `WG-ALK-062`,
  `AD-MNT-002`, `AD-MNT-004` passing against any correct engine

**The question, in plain language**

Several goldens state an intermediate to fewer digits than the tolerance the gate
compares it at, so a correct engine fails on the fixture's own rounding.

Two different causes, and they need different answers.

**Cause one — rounded before dividing.** The canon's own worked text for `WG-ALK-001`
rounds the supported slope for legibility and then divides the rounded value by the
potency. The fixture transcribed that intermediate as a full-precision expectation. An
engine that keeps full precision throughout — which `ALK-002` and the determinism
contract require — cannot reproduce it. Four goldens carry this.

**Cause two — truncated for legibility.** `WG-ALK-006` states the supported slope to
eight decimals and `WG-ALK-062` states the continuous dose to five. Both are correct to
the digits written and both differ from the exact value by more than the tolerance.

**Why it is only now visible**

`recompute-goldens.py` recorded every one of these in `baselines/`, four separate times,
as a discrepancy between the stated value and the recomputed one. It is a recorder rather
than a gate, so nothing acted on it. The first engine turns each into a red fixture.

**Options**

1. **Reissue the affected goldens** at full precision, through the governed path. Largest
   change; restores the fixtures as checks of the whole calculation.
2. **State a per-fixture tolerance** on each, matched to the digits actually written. Cheap
   and honest, but it weakens exactly the fields most worth pinning.
3. **Drop the affected assertions** and rely on the fields that survive. Loses coverage
   silently, which is the worst of the three.

**Which direction being wrong hurts more**

Leaving it open means seven fixtures stay red for a reason that is not the engine's, which
trains a reader to skim red. Fixing it the wrong way means an intermediate stops being
checked at all.

**Recommendation, and what would make it wrong**

Option 1 for cause one — the value is arithmetically wrong at the precision it claims, not
merely coarse. No recommendation on cause two; whether a golden should be written to full
precision or compared at the precision it states is the owner's call about what a golden
is for.

## OD-020 — Does `continuousActionCandidateMlPerDay` come before or after the rails and caps?

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `AD-MNT-002` and `AD-MNT-004` passing

**The question, in plain language**

`ALK-V2-DATA-CONTRACT.md` says the field is `D_current − S_supported/P`, "**before**
physical limits and rounding". Two fixtures state it **after** them: `AD-MNT-004` states
`47.215007215`, which is the rail-limited value, where the pre-limit candidate is
`48.931899913`; `AD-MNT-002` states `11.25`, which is the 25%-capped value, where the
pre-limit candidate is `11.954475700`.

`ALK-ROUNDING-001` names its own input `D_continuous_feasible` — *feasible*, that is,
after the constraints — which is a third reading again.

**Why it is undecided**

The contract states one thing in one sentence and the corpus states the other twice. Both
are frozen against different authorities: the contract is the alk-v2 package, the fixtures
are `ALK_V2_FREEZE_5`. `recompute-goldens.py` computed the pre-limit value and recorded
both as discrepancies, so the disagreement is on record but unowned.

**Options**

1. The field is pre-limit, as the contract says, and a **second** field carries the
   feasible candidate. Both fixtures then assert the second field's value under the
   first's name and need a governed reissue.
2. The field is post-constraint and pre-rounding, and the contract sentence is wrong.
   `ALK-ROUNDING-001`'s "feasible" wording supports this.

**Which direction being wrong hurts more**

Either way the recommendation is unchanged — this is an audit field. What is at stake is
whether a reader tracing a capped recommendation sees where the cap bit.

**Recommendation** — option 1, because the two quantities genuinely differ and
`ALK-VARIABLE-SEMANTICS-001` exists to stop one field carrying both. It would be wrong if
the owner reads `D_continuous_feasible` as the same field under another name.

## OD-019 — Two round-1 goldens state a retest answer the Freeze-5 scheduler contradicts

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `WG-ALK-001` and `WG-ALK-006` passing

**The question, in plain language**

`WG-ALK-001` expects the next test at 48 h under `RETEST_POST_CHANGE_FIRST`. Its ledger
contains no dose change — the change is being *recommended* — and `ALK-053`'s post-change
candidate is anchored on an **actual** change, which Part I §31 says only a confirmed
actual change creates. Meanwhile Freeze 5's confidence-building candidate computes
`T_signal = max(1 day, 0.10/0.104745) = 24 h` on the same inputs and is earlier, so the
scheduler selects it.

`WG-ALK-006` expects 24 h under `RETEST_RAPID_MOVEMENT`. Its own stated `tOuterLowDays` is
`0.25`, so Freeze 5's forecast-boundary candidate gives `T_boundary = −0.75 d` and returns
test-now, which outranks ordinary scheduling.

Both goldens predate the two candidates that now beat them.

**Why it is undecided**

Neither expectation is wrong about the tank. Both are answers the scheduler gave before
`ALK-RETEST-SCHEDULER-001` existed. Deciding whether a recommended-but-not-yet-implemented
change opens a post-change regime is a real chemistry question, and it is the one that
decides `WG-ALK-001`.

**What must change alongside** — whichever way it goes, `AD-RET-001` is the control: it is
the same shape as `WG-ALK-001` with the maintenance action held, and it selects the signal
candidate at 24 h.

**Recommendation** — none. This is a question about when a post-change regime begins, and
that is chemistry.

## OD-018 — The corpus asserts `approxHours` with two different meanings

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `WG-ALK-001` and `WG-ALK-006` passing, independently of `OD-019`

**The question, in plain language**

`WG-ALK-001` and `WG-ALK-006` assert `expectedRetest.approxHours` meaning *the selected
interval*. `AD-RET-001` and `AD-RET-003` assert `candidateTimes[].approxHours` meaning
*that candidate's* interval, and state several of them with different values in one
fixture.

The harness resolves an expectation by field name across the whole result, justified by
`INV-B7` making a name unambiguous. Here it is not: an engine emitting the per-candidate
values reports `approxHours` at three places with three values, and the older goldens'
assertion cannot resolve.

`DEC-022` gave the selected interval its own unambiguous name, `selectedApproxHours`, which
is what the five converted retest fixtures use. The two older goldens use the bare name.

**Why no session can settle it** — both sides are frozen `ALK_V2_FREEZE_5` content, and the
two meanings are genuinely different quantities.

**Options**

1. Reissue `WG-ALK-001` and `WG-ALK-006` to say `selectedApproxHours`. Smallest edit;
   needs the governed path because it edits frozen expectations.
2. Rename the per-candidate field. Larger, and it edits the five fixtures `DEC-022` was
   written for.

**Recommendation** — option 1. Two fixtures move rather than five, and the name that
survives is the one that says which interval it means.

## OD-017 — The corpus asserts a large vocabulary the data contract does not declare

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** conversion of roughly a dozen stage-one fixtures, and two engine mutations

**The question, in plain language**

`OD-012` found the retest path asserting ten names the contract did not declare, and
`DEC-022` closed it by extending the contract. `DEC-023` then applied the same answer
wherever three conditions hold. **What is left is the residue those conditions
deliberately exclude**, and it is not small: the corpus asserts about 553 distinct field
names and the contract declares about 40.

Four kinds, and they need different answers:

- **A quantity the engine has, under a second name.** `latestPosition` for `position`
  (`WG-ALK-033`); `positionDkh` for `latestValidValueDkh` (`AD-RET-005`);
  `continuousDoseMlPerDay` for `continuousActionCandidateMlPerDay` (`WG-ALK-062`);
  `pairwiseSlopes` for `pairwiseSlopesDkhPerDay` (`AD-RAP-001`); `roundedTo` for
  `recommendedDoseMlPerDay` (`AD-MNT-001`). Bridging these puts two names on one meaning,
  which `INV-B7` forbids — so `DEC-023` condition 3 stops at them.
- **A working step, not an output.** `acceptedClusterTimesDays`,
  `notAcceptedSeparationHours`, `coalescedValueDkh`, `pooledReadingsDkh`,
  `seriesAfterCoalescing`, `roundingTie`, `episode1`/`episode2` — the fixture's own
  arithmetic, written for a human reader. These are what `OD-009` calls for: a unit-level
  fixture bound to a named module, rather than a whole-pipeline expectation.
- **A presentation requirement in a domain fixture.** `AD-MNT-006`'s
  `fullCardShows: [observedSlope, supportedSlope, maintenanceEstimate, forecastRangeEntry]`
  is a Layer-5 statement. A domain engine cannot satisfy it and should not try:
  `X-INV-004` and `DEC-003` put wording and card composition outside the domain entirely.
- **A qualitative flag.** `automaticStatisticalSuspicionDetection`,
  `outlierExcludedFromTrend`, `medianConclusionManufactured`, `allRawReadingsPreserved` —
  assertions about what the engine did *not* do, with no natural field.

**What it costs today** — `AD-MNT-001`, `AD-MNT-002`, `AD-MNT-006`, `AD-RAP-001`,
`AD-SEG-001`, `AD-SEG-005`, `AD-SEG-007`, `AD-SEG-008`, `AD-EPI-001`, `AD-VAL-002`,
`WG-ALK-062` and `WG-ALK-063` are unconverted or red for this reason alone, and two engine
mutations (`E-6`, `E-18`, `E-19`) are blocked on them.

**Options**

1. **Extend the contract further**, accepting the duplicate names. Cheapest per fixture;
   every duplicate weakens the by-name resolution the harness depends on.
2. **Answer `OD-009`** — a unit-level fixture type bound to a named module. Fixes the
   second kind properly and much of the first.
3. **Reissue the fixtures** into the contract's vocabulary. Correct and expensive, and it
   edits frozen expectations.
4. **Leave them unconverted**, and accept that these paths are pinned by the fixtures that
   do convert.

**Recommendation** — option 2 for the working-step kind, option 3 for the duplicate-name
kind, and **nothing at all** for the presentation kind: `fullCardShows` should not be
asserted of a domain engine by any route, and a fixture that does is asserting the wrong
layer.

## OD-016 — Which tied retest candidate fills the single `reasonCode`?

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** nothing today. A determinism question with no fixture on it yet.

**The question, in plain language**

Canon is explicit that where retest candidates tie on time, every tied candidate's reason
code is emitted and **no precedence between them is invented**. `RetestDecision`
nevertheless declares one `reasonCode` — "the selected candidate's code" — and a
`tiedReasonCodes[]` beside it. Something has to fill the singular field.

Canon names two reachable ties: `T_signal` at 24.0 h against the rapid candidate, and at
48.0 h against the routine cadence.

**What the engine does today** — takes the tied candidate that comes first in `ALK-053A`'s
own candidate-set table, emits every tied code, and records all of them in
`candidateTimes[]`. Nothing is suppressed and the answer is deterministic, but the table
order is not stated as a precedence anywhere.

**Options** — name a precedence; or make `reasonCode` a list where a tie occurs; or state
that the singular field is presentation and the audit record is the array.

**Recommendation** — no recommendation. Which candidate a card should name first at a tie
is a presentation judgement the canon deliberately did not make.

## OD-015 — `AD-RET-004` asserts an `outerBoundState` value the vocabulary does not contain

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `AD-RET-004` passing. It is otherwise green.

**The question, in plain language**

`AD-RET-004` asserts `outerBoundState: "INSIDE_BOUND"`. The closed vocabulary is
`WITHIN_BOUNDS | BREACHED_LOW | BREACHED_HIGH | RECOVERING_INSIDE_BOUND`, and the token
`INSIDE_BOUND` appears exactly once in the whole repository: in that fixture. The canon
uses `RECOVERING_INSIDE_BOUND` and nothing else.

It is `OD-012`'s collision on a different field — except that `outerBoundState` is a
chemistry state vocabulary rather than an output name, so `DEC-023` condition 3 stops
short of it deliberately. Adding `INSIDE_BOUND` as a synonym for `WITHIN_BOUNDS` would put
two names on one state, which is what a closed vocabulary exists to prevent.

**Options** — reissue the fixture to say `WITHIN_BOUNDS`; or decide that `INSIDE_BOUND` is
the canonical spelling and reissue the contract and canon. The first is one word in one
fixture.

**Recommendation** — the first, through the governed path, unless the owner reads
`INSIDE_BOUND` as a distinct state nobody has defined.

## OD-022 — Two retest fixtures state a partial candidate list, which the comparator reads as complete

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `AD-RET-002` and `AD-RET-005` passing

**The question, in plain language**

`candidateTimes[]` is the scheduler's audit record of every candidate it evaluated. The
harness compares a list by length and then by element, so a fixture stating two entries
asserts that exactly two candidates were evaluated.

`AD-RET-002` states two — routine cadence and signal accumulation — on a tank that is
below range and rising with `outerMax` configured, so the forecast-boundary candidate
also applies. `AD-RET-001`, on the same rule and the same shape, **does** list it, at
472 h, and its `forbidden` block says in terms that the candidate "must appear in the audit
list rather than being dropped on an unstated horizon". The two fixtures cannot both be
satisfied.

`AD-RET-005` states two entries on a breached tank and omits both the routine cadence and
the signal candidate, neither of which the canon suspends on a breach.

The engine mutation set proves this mechanically rather than by argument: `E-9`, which
withholds the forecast candidate from the scheduler, turns `AD-RET-001` and `AD-RET-003`
red **and makes `AD-RET-002`'s failure disappear**.

**Options** — reissue the two fixtures with their full candidate lists; or state that
`candidateTimes[]` is asserted as a subset rather than a list, which would need a change to
the comparator and would weaken every list assertion in the corpus.

**Recommendation** — the first. A subset comparison would mean no fixture could ever assert
that a candidate was *not* evaluated, which is precisely what `AD-RET-005` is for.

## OD-023 — `AD-MNT-008` asserts a `trajectory` value outside the closed vocabulary

- **Raised:** 2026-08-21 · **By:** first-engine run · **Status:** OPEN
- **Blocks:** `AD-MNT-008` passing. It is otherwise green.

**The question, in plain language**

`AD-MNT-008` asserts both `trajectory: "UNCERTAINTY_LIMITED"` and
`movementEvidence: "UNCERTAINTY_LIMITED"`. `Trajectory`'s closed vocabulary is
`RISING | FALLING | STABLE | UNCERTAIN`; `UNCERTAINTY_LIMITED` belongs to
`MovementEvidence`.

`ALK-MOVEMENT-001` step 6 is explicit that where the supported slope shrinks to zero the
trajectory takes **the direction of the observed slope** and the evidence state carries
the uncertainty limitation. `WG-ALK-002` asserts exactly that pairing — `FALLING` with
`UNCERTAINTY_LIMITED` — on the same rule. The two fixtures contradict each other.

**Recommendation** — reissue `AD-MNT-008`'s `trajectory` to `RISING`, matching
`WG-ALK-002`'s shape and the rule's own wording. It would be wrong if the owner intends
the two fields to collapse, which `ALK-VARIABLE-SEMANTICS-001` would forbid anyway.


## OD-024 — What tank alkalinity does a water-change step subtract from?

- **Raised:** 2026-08-21 · **By:** first-engine review pass · **Status:** OPEN
- **Blocks:** nothing today. The engine implements `ALK-033` on the reading it took;
  this asks whether canon should state the reading rather than leave it to be taken.

**The question, in plain language**

`ALK-033` gives the known-input step as `dA_WC = f * (A_replacement - A_tank)`. It states
`f` and `A_replacement` — both are on the water-change event. It does not state
`A_tank`: the tank's alkalinity *at the moment of the change*, which is almost never a
moment anybody tested at.

The engine uses **the last resolved testing episode at or before the event**, which is
the only recorded fact available. The alternatives a reasonable implementer might have
picked instead are the fitted value of the trend at that instant, or the nearest episode
in either direction. On a tank falling 0.05 dKH/day and a change three days after the
last test, the three answers differ by about 0.15 dKH — larger than the 0.10 dKH
materiality floor the same rule uses to decide whether to normalize at all. So the
choice can flip a step from normalized to not.

Where no episode precedes the event the step is not computable at all, and the engine
falls through to `ALK-WATERCHANGE-UNKNOWN-001` rather than interpolating a tank value it
was never told.

**Recommendation** — state `A_tank` in canon as the last resolved episode at or before
the event, which is the only choice that reads a recorded fact rather than a derived
one, and matches `ALK-034`'s treatment of a known correction. It would be wrong if the
owner intends normalization to run against the trend's fitted value, which would make a
Layer-2 output an input to a Layer-1 normalization and cross a boundary `DEC-003` keeps
separate.


## OD-025 — The reason-code catalogue has no code for "not built in this release"

- **Raised:** 2026-08-21 · **By:** first-engine review pass · **Status:** OPEN
- **Blocks:** nothing failing. It makes the settled tank's card read worse than the
  engine's actual answer.

**The question, in plain language**

`INV-I4` requires every `NOT_RUN` / `WITHHELD` output to be named in the
`affectedOutputs` of a `GATING` or `REFUSAL` reason code. The only catalogued `GATING`
code that can name an arbitrary output is `OUTPUT_INSUFFICIENT_DATA_ACTIONABLE`, whose
declared meaning is *"insufficiency stated with what is missing"*.

But some outputs are not withheld for want of evidence — they are withheld because this
release does not build them: the safety return's sizing, the gated potency dispersion,
the empirical bracket. On a tank with four clean readings, a complete dosing record and
a confident recommendation, the engine must currently attach an **insufficiency** code to
say so, and the keeper reads "insufficient data" beside a recommendation the engine is
in fact sure of.

These are two different statements about the world and the catalogue has one code for
both. Scoping the sweep to actual outputs (this pass) took the list from eleven entries
to four; the remaining four are all declared debt and cannot be removed without either
a new code or a weaker invariant.

**Recommendation** — add an `INFO`-severity `OUTPUT_NOT_IMPLEMENTED_IN_RELEASE` to the
catalogue and let `INV-I4` accept it for outputs named as declared debt. It would be
wrong if the owner reads declared debt as a form of insufficiency, in which case the
right fix is to `OUTPUT_INSUFFICIENT_DATA_ACTIONABLE`'s **wording**, not a new code.
Either way this is a contract change and belongs to a governed reissue, not to an
implementation pass.


## OD-008 — What is the assessment instant of a worked golden?

- **Raised:** 2026-08-20 · **By:** executable-fixture-format run · **Status:** CLOSED — see `DEC-021` (2026-08-21)
- **Decided:** option 1. Where a fixture states no assessment instant, `asOf` is the
  instant of the last `READING` in its ledger; a fixture that states its own keeps it.
  The original analysis is preserved below as it was written.
- **Blocks:** roughly forty reading-series fixtures, all six `NO_ASOF` fixtures, and
  every case-set expansion. It is the single largest blocker on making the corpus
  machine-checkable.

**The question, in plain language**

The engine is one pure function of `(eventLedger, configurationHistory, asOf)`. A
fixture must therefore state three things. Almost all of them state two.

Of the 198 fixtures the harness cannot execute, **six state an assessment instant** —
`AD-RET-001`..`AD-RET-005` and `WG-ALK-049`. The rest describe a scenario and stop.
Canon Part III writes its inputs as "Day 0 / Day 2 / Day 4" and says nothing about when
the assessment happens.

Is there a rule for this — and if so, what is it?

**Why it is undecided** — what the existing authorities do and do not say

`ALK-V2-IMPLEMENTATION-CONTRACT.md` §4 requires an explicit `asOf` and §346 says "Every
domain function takes an explicit `asOf` instant. No function reads a clock." Neither
says how a *fixture author* chooses one. `ALK-V2-DATA-CONTRACT.md` mentions `asOf` only
as the instant configuration resolves at. Canon §518 says a derived assessment resolves
the configuration version effective at its `assessmentAsOf` — again, given one.

So the requirement is stated and the convention is not.

This matters because `asOf` is not a free parameter. Evidence windows, staleness, every
retest candidate and the resolved configuration version all move with it. The harness
already refuses to choose one, and classes six fixtures `NO_ASOF` for exactly this
reason: "choosing it is inventing an input."

**Evidence the owner may want**

All six currently-executable fixtures set `asOf` to their **last reading instant** — six
out of six, including `WG-ALK-006` (readings Day 0 and Day 1, `asOf` Day 1) and
`WG-ALK-003` (an eight-point series, `asOf` at the last point). That is a consistent
observed habit. It is **not** authority, and this run declined to adopt it: a convention
inferred from six examples and then applied to forty is exactly the silent
reinterpretation the canon forbids.

**Options**

1. **State the convention in canon** — a worked golden is assessed at the instant of its
   latest reading unless it says otherwise. Commits to the reading being the trigger for
   assessment. Cheap; unblocks the bulk of the corpus mechanically; reversible by a
   governed reissue. Forecloses nothing, because a fixture may still state its own.
2. **Require every fixture to state its own `asOf`.** Commits to nothing about
   semantics and is maximally explicit, but means editing roughly forty fixtures by
   hand, each edit being a small judgement about what that fixture meant.
3. **Leave it open and convert nothing further.** Costs nothing now; the corpus stays at
   its current executable count and per-path coverage stays near zero for every path but
   `RETEST`.

**Which direction being wrong hurts more**

Getting it wrong in the direction of option 1 means a set of fixtures assert behaviour at
an instant the canon did not intend — a wrong test that looks right, which is worse than
no test. Getting it wrong in the direction of option 3 means the engine gets built
against a corpus almost none of which can check it.

**What already covers this** — nothing. `DEC-016` makes the harness a required check but
says nothing about fixture inputs.

**What must change alongside**

`fixtures/EXECUTABLE-FIXTURE-FORMAT.md` §2 and §5, which currently forbid a conversion
from supplying an `asOf`, and `CONFORMANCE-HARNESS.md`'s `NO_ASOF` class.

**Recommendation, and what would make it wrong**

Option 1, as a canon reissue rather than a note. It matches what the corpus already
does everywhere it does anything, it is the cheapest thing that unblocks real work, and
a fixture that needs a different instant can still state one. It would be wrong if the
canon intends an assessment to be triggered by something other than a reading — a
scheduled evaluation, or a dose change — in which case the six-for-six pattern is an
artefact of which fixtures happened to be written first.

## OD-009 — Should the engine expose unit-level entry points for fixtures that state intermediate values?

- **Raised:** 2026-08-20 · **By:** executable-fixture-format run · **Status:** OPEN
- **Blocks:** 32 fixtures whose input is a Layer-2 or Layer-3 output rather than raw facts

**The question, in plain language**

Thirty-two fixtures state their input as quantities the engine would normally *compute*:
a pre-change slope, a post-change slope, a slope uncertainty, a consumption estimate.
`WG-ALK-009` supplies a pre-slope, a dose delta and two sigmas, and asserts which
response class results. `AD-POT-001` supplies both sides of a potency window with their
slopes and sigmas already computed.

The current interface is one whole-pipeline function, so the only way to submit these is
to construct a reading series whose fitted slope and residual scatter come out at exactly
the stated values. Should the engine instead expose the individual modules?

**Why it is undecided**

`ALK-V2-MODULE-DESIGN.md` already describes the modules and is emphatic that some of
them are deliberately narrow — of `iv.classify`: *"takes only three numbers. It cannot
see the position, the potency or the recommendation, which is what makes `INV-E6`
structural."* A fixture that feeds `iv.classify` three numbers is testing exactly the
right thing at the right level.

But `ALK-V2-IMPLEMENTATION-CONTRACT.md` §4 defines *one* assessment as *one* pure
function, and the conformance harness speaks only that protocol. Whether the module
boundary is also a *testing* boundary is not stated anywhere.

**Options**

1. **Extend the conformance protocol with a unit-level op** — submit named module inputs,
   get that module's output. Commits to the module boundary being public and stable.
   Makes 32 fixtures executable roughly as written, and keeps them testing one formula
   in isolation, which is their virtue.
2. **Reconstruct ledgers for them.** No interface change. But the fixture's expectation
   was computed *from the abstract sigma*, not from readings, so a reconstructed fixture
   asserts something the original did not — and the format's `assertionsUnchanged` claim
   would be false.
3. **Leave them unconverted, permanently, and say so.** They remain human-checkable
   worked reasoning that pins canon for a reader. Honest, and cheap, but 32 fixtures
   never become gates.

**Which direction being wrong hurts more**

Option 1 wrongly taken makes an internal boundary public and harder to change later.
Option 2 wrongly taken silently changes what 32 fixtures assert, which is worse: the
tests would pass while checking something else.

**Recommendation, and what would make it wrong**

Option 1, deferred until an engine exists — there is nothing to expose yet, and the
decision is cheap to take later and expensive to take blind. Explicitly **not** option 2.
It would be wrong if the module boundary turns out to be unstable in implementation, in
which case option 3 is the honest fallback.

## OD-010 — Should a fixture be able to assert the difference between two assessments?

- **Raised:** 2026-08-20 · **By:** executable-fixture-format run · **Status:** OPEN
- **Blocks:** 11 retro-edit / transition fixtures

**The question, in plain language**

Eleven fixtures are about what an *edit* does. `WG-ALK-028` is
`{before: {...}, edit: {targetRange: ...}}` and asserts that the position changes while
the trend does not. `WG-ALK-029` inserts a backdated reading and asserts the present
analysis moves but history does not. `WG-ALK-065` asserts a legacy config is not
backfilled.

Each is two assessments and a claim about the difference. Should the fixture format have
a two-call type with a `delta` expectation block?

**Why it is undecided**

The engine interface already supports this natively — same ledger, two configuration
versions, or two `asOf` values — so nothing in the architecture forbids it. But the
fixture format and the harness both assume one fixture is one call, and no authority
says otherwise.

**Options**

1. **Define a two-call fixture type** with `before`, `after` and `delta` blocks.
2. **Express each as two ordinary fixtures plus a prose note** tying them together. Loses
   the mechanical check on the difference, which is the whole assertion.
3. **Leave unconverted.**

**Recommendation, and what would make it wrong**

Option 1, but not yet: it was not defined in this run because no fixture in the corpus
could be converted to prove it (all eleven are also blocked on `OD-008`). Defining an
unproven format type invites it being wrong in a way nobody notices. It would be wrong
if `OD-008` is answered in a way that makes these fixtures convertible as ordinary pairs.

## OD-011 — Is a fixture's provenance note an input?

- **Raised:** 2026-08-20 · **By:** executable-fixture-format run · **Status:** OPEN
- **Blocks:** `AD-RET-001` fully; sets a precedent for the rest of the corpus

**The question, in plain language**

`AD-RET-001` states no `currentDoseMlPerDay`. Its provenance note says *"Same state as
AD-MNT-006"*, and `AD-MNT-006` states 9.0 mL/day.

Is that note an input the conversion may read, or documentation it may not?

**Why it is undecided**

The fixture schema calls `provenance.note` "for `CANON_DERIVED`: how the numbers were
obtained" — documentation about derivation, not a field the engine is given. The
comparator already treats `note` as documentation everywhere else and never compares it.
But the note plainly asserts a state identity, and a human reader would use it.

This run took the strict reading: the fixture was converted with **no `DOSE_STATE`
event**, and the gap is declared in its `conversion.questionsRaised`. If the `RETEST`
path turns out to need a programmed dose to reach these expectations, that is a real
finding about the fixture.

**Options**

1. **A note is never an input.** Fixtures that need a value must state it. `AD-RET-001`
   gets an explicit dose added by whoever owns it.
2. **A note may be read when it names another fixture by id and asserts state identity.**
   Narrow, but it is a rule about how to read prose, which is the class of rule that
   drifts.

**Recommendation, and what would make it wrong**

Option 1. It is the reading the rest of the corpus's machinery already takes, and the fix
is one field on one fixture. It would be wrong only if many fixtures turn out to depend
on this style of cross-reference, in which case the cost of option 1 is no longer one
field.

## OD-012 — Which vocabulary owns the retest decision: the data contract's, or the fixtures'?

- **Raised:** 2026-08-21 · **By:** executable-fixture-format run, test-engineer review · **Status:** CLOSED — see `DEC-022` (2026-08-21)
- **Decided:** option 1. The contract gains the vocabulary the five fixtures assert. The
  original analysis is preserved below as it was written; what was actually added is
  listed in `ALK-V2-DATA-CONTRACT.md` §8 `RetestDecision`.
- **Blocks:** whether `AD-RET-001..005` can pass against a real engine. Nothing today.

**The question, in plain language**

The five converted retest fixtures and the data contract describe the same decision in
two different vocabularies, and they do not overlap.

`ALK-V2-DATA-CONTRACT.md` §`RetestDecision` declares `action`, `earliestUsefulAt`,
`recommendedAt`, `latestSafeAt`, `reasonCode`, `tiedReasonCodes[]`, `candidateTimes[]
{candidateClass, at, included|excluded, reason}`, `candidatesNotRun[]`, `clampsApplied[]`
and `assumptions[]`.

The fixtures assert `selectedApproxHours`, `selectedReasonCode`, `selectedAction`,
`observationCeilingHours`, `observationFloorApplied`, and per-candidate `approxHours`,
`rawHours`, `flooredHours`, `clampedHours` and `boundSide`. **None of those names is in
the contract.** The contract states retest times as `Instant`; the fixtures state them in
hours.

**Why this is only now visible**

It was inert while the fixtures could not execute — an expectation nothing compares can
disagree with anything. Converting them made it binding: against an engine that
implements the contract as written, every one of those assertions resolves to *"no field
of that name in the engine result"*, and all five fixtures fail.

They pass today only because the echo oracle replays each fixture's own expectations
back, so the vocabulary never has to exist. An echo oracle is structurally incapable of
detecting this class of defect, which is worth stating plainly: this is the first
finding that shows what the oracle cannot do for us.

`Hours` is also not among the ten dimension suffixes the contract declares, so
`CHK-DIMENSION-SAFETY` cannot flag the units mismatch either.

**Why no session can settle it**

The fixture assertions are `ALK_V2_FREEZE_5` content. `EXECUTABLE-FIXTURE-FORMAT.md` §5
forbids a conversion from changing what a fixture asserts — *a conversion that changes
what a fixture asserts is not a conversion; it is a canon edit wearing a disguise*. So
the fixture side cannot move. The contract side is the alk-v2 implementation package,
which this work was scoped out of.

**Options**

1. **The contract gains the audit fields.** `RetestDecision` grows the per-candidate
   interval fields the fixtures assert. Largest change, and it makes the contract carry
   presentation-shaped values (hours) alongside instants.
2. **The fixtures are restated in the contract's names.** Requires a governed reissue,
   because it edits frozen expectations.
3. **A declared mapping.** A named, checked translation from the fixtures' vocabulary to
   the contract's, owned by one document. Adds a third artefact, and a mapping is exactly
   the kind of thing `MASTER RULE 1` warns about if it is ever implemented twice.

**Recommendation, and what would make it wrong**

No recommendation. Which vocabulary is right is a question about what the engine's output
should look like, and that is the owner's, not a reviewing session's. What this run can
say is that the disagreement is real, mechanical, and will surface as five red fixtures
on the first day of retest implementation — so it is better answered before that day
than during it.

**Until it is answered**

`PROJECT-STATE.md` and the format document both record that these five fixtures execute
and pass **against the echo oracle**, and that no contract-conformant engine can satisfy
them as written. The claim is not withdrawn; it is qualified.

## OD-013 — Should the prose census descend into nested values?

- **Raised:** 2026-08-21 · **By:** executable-fixture-format run, test-engineer review · **Status:** OPEN
- **Blocks:** nothing. A reporting-accuracy question.

**The question, in plain language**

The harness counts prose expectations two different ways and gets two different answers:
57 from the static census over the corpus, 58 from a run with an engine attached.

Neither is wrong. `corpus._unreadable_expectations` walks the top-level keys of each
expectation block; `compare_by_name` descends into lists and sub-objects when a fixture
actually executes, and finds prose the census cannot reach — currently
`AD-RET-005`'s `candidateTimes[…].reason`.

The consequence is that **the census undercounts every non-executable fixture**, and the
gap widens with each conversion, because nested prose becomes visible only when a fixture
runs.

**Options**

1. **Make the census recurse.** One number, and the published count stops moving when a
   fixture is converted. Cost: the census then walks arbitrary nested structure and has
   to decide what counts as an expectation, which is a judgement the top-level walk
   currently avoids.
2. **Publish neither, and report both from the run.** What this change did as an interim:
   `CONFORMANCE-HARNESS.md` now states both numbers and says which is which.

**Recommendation, and what would make it wrong**

Option 1, but it is not urgent. It would be wrong if descending turns out to require a
rule about which nested keys are assertions and which are documentation — that rule is
the same class as the prose predicate itself, which this repository has already had to
give a single owner once after two implementations disagreed on 17 entries.

## OD-014 — Who owns the expansion of `READING_SERIES`?

- **Raised:** 2026-08-21 · **By:** executable-fixture-format run, test-engineer review · **Status:** OPEN
- **Blocks:** nothing today; lands on the first day of engine work.

**The question, in plain language**

`READING_SERIES` is a shorthand event — `startAt`, `everyHours`, `count`,
`valuesDkh` — standing in for a regular run of readings. The harness passes it to the
engine verbatim, so **every engine must implement the expansion**, but the data contract
does not declare the event and no document states its semantics beyond "shorthand for a
regular series".

Two expanders already exist, for their own local purposes:
`docs/implementation/alk-v2/recompute-goldens.py` and
`tools/conformance/harness/package_checks.py`. Neither is authoritative for an engine.
The second belonged to `validate-freeze-5.py` until the gate consolidation (`DEC-019`)
retired that validator; the expander was absorbed along with its check, so the
duplication survived the consolidation rather than being closed by it.

**Why it matters sooner than it looks**

`WG-ALK-003` uses it, and `WG-ALK-003` is one of the fixtures that already execute. So
the first engine written against this corpus has to expand `READING_SERIES` on day one,
from a one-line table row — and will produce a third implementation of one inference.
`MASTER RULE 1` calls two implementations that agree today a defect rather than a
coincidence; three is worse.

**Options**

1. **The data contract declares it.** It becomes an ordinary declared input with one
   owner, and the existing two expanders become consumers of that declaration.
2. **The format document states the semantics fully**, and the contract references it.
3. **Retire the shorthand.** Expand `WG-ALK-003`'s series into ordinary `READING` events
   in the fixture itself. Removes the concept entirely; costs a longer fixture body, and
   is a fixture edit, so it needs whoever owns frozen fixture content.

**Recommendation, and what would make it wrong**

Option 1 or 3. Option 3 is tempting because the corpus uses the shorthand exactly once —
if that stays true, deleting the concept is cheaper than specifying it. It would be wrong
if conversion work turns out to need the shorthand often, which is plausible: several
`ABSTRACT_INPUT` fixtures describe regular series in prose (`readings: 4`, `every 48 h`),
and those are the ones a future conversion would most naturally express this way.

## OD-001 — Should `main` be branch-protected on GitHub?

- **Raised:** 2026-08-19 · **By:** workforce founding, adversarial review · **Status:** OPEN
- **Blocks:** **all unattended autonomous work.** It is the only hard guarantee behind "Claude never merges"

**The question, in plain language**

Should GitHub itself refuse a direct push to `main`, so that the rule "Claude
never merges" is enforced by the platform rather than by Claude following
instructions?

**Why it is undecided**

`CLAUDE.md` says "Claude **never merges** — merging requires explicit owner
action. This holds however green the checks are." Nothing enforces it.

This repository previously tried to enforce it with a list of denied command
spellings. Two rounds of adversarial review found working bypasses each time —
a fully-qualified refspec (`HEAD:refs/heads/main`), a force refspec (`+HEAD:…`),
`gh api --method PUT …/merge`, and then `gh api graphql` and plain `curl`, which
no `--method` pattern matches at all. The list also denied legitimate branches
whose names merely contained the substring "main", such as
`claude/domain-verifier-fix`. **That approach has been abandoned.** A pattern
list can be shown incomplete but never shown complete, and any session holding
`Bash` also holds `curl` and therefore the entire GitHub API. The reason is
structural — these rules match **command strings**, and there are more ways to
spell "push to main" than can be
enumerated.

The GitHub merge, approval and repository-write **tools** are separately denied
by name, which is a real control: a denied tool cannot be called. The shell
remains the gap.

`docs/process/V1-AGENT-SALVAGE-AUDIT.md` records that V1's setup guide called
branch protection "the most important step in the whole guide", and dispositions
that guide `REFERENCE_ONLY`. On this specific point that disposition looks wrong:
V1's one hard, non-prompt enforcement mechanism was left behind.

Nothing in this repository can settle this, because branch protection is
configured on GitHub by the repository owner.

**Options**

1. **Protect `main`: require a pull request, forbid direct pushes and
   force-pushes.** Commits to: every change reaching `main` through a PR,
   including the owner's own. Forecloses: quick direct fixes on `main`. Cost:
   a few minutes once. Reversible: immediately, in repository settings.
2. **Leave `main` unprotected and rely on the deny rules plus instruction.**
   Commits to: trusting a pattern list that has now been found incomplete twice.
   Forecloses: nothing. Cost: none today. Reversible: n/a.
3. **Protect `main` and additionally require the `pr-gate` classification to be
   recorded on the PR before merge.** Commits to: a process step on every
   change. Cost: more ceremony than a single-owner project may want.

**Which direction being wrong hurts more**

Badly asymmetric. Option 2 being wrong means unreviewed work lands on `main`
silently and the project's central safety claim was never true. Option 1 being
wrong costs the owner a few seconds of inconvenience on their own commits.

**What already covers this**

Nothing, in this repository, and it no longer pretends otherwise. Tool-name
denies remove the GitHub MCP merge and approval tools from the session surface,
which is real but covers only that surface. Everything else is process
discipline. Pending this decision, **unattended autonomous merge-capable work is
prohibited** and `/overnight-cycle` is withdrawn; attended sessions branch, push
and open PRs, and stop before merge.

**What must change alongside**

If `main` is protected **and that protection is verified** — the owner confirms
Claude's credential cannot merge a PR or dismiss a review — then
`docs/process/AUTONOMY-AND-CONTROLS.md` records it, the prohibition on unattended
work lifts, and `/overnight-cycle` may be reconsidered. All three steps, or none.

**Recommendation, and what would make it wrong**

Option 1. It is cheap, reversible, and it is the only control here that does not
depend on Claude behaving correctly. It would be wrong if the owner routinely
commits to `main` directly and finds a PR for every change intolerable — in
which case option 2 is a deliberate, informed acceptance of the risk rather than
an oversight, which is materially better than where things stand now.

---

## OD-002 — Does the decision ledger cover process and workforce architecture?

- **Raised:** 2026-08-19 · **By:** workforce founding, integration review · **Status:** OPEN
- **Blocks:** nothing; it affects where a future reader looks

**The question, in plain language**

The agent workforce embodies real architectural choices — reviewers are
read-only, the main session is the only writer, nine agents rather than
twenty-eight, no separate triage role. Should those be entries in
`DECISIONS.md`, or is that ledger only for the product and its technical
architecture?

**Why it is undecided**

`DECISIONS.md` states its scope as "product and architecture decisions", and
`CLAUDE.md` says `DECISIONS.md` owns product and architecture. `ROADMAP.md` says
any material change to product direction or architecture should be recorded
there. None of them says whether *process* architecture counts.

The choices are currently recorded with their rationale in
`docs/process/AGENT-ROSTER.md`, which is a reasonable home. But `CLAUDE.md`
tells every session to consult `DECISIONS.md` before deciding anything, and a
session that does so will not find them.

**Options**

1. **Ledger entries for the load-bearing process choices**, with
   `AGENT-ROSTER.md` keeping the detail. Commits to: one place to look.
   Cost: a handful of entries. Reversible: entries are superseded, not deleted.
2. **Keep process architecture in `docs/process/` only**, and add one line to
   `DECISIONS.md` scope saying so. Cost: almost none. Commits to: two places to
   look, clearly signposted.
3. **Leave it implicit.** Cost: none now; a future reader finds nothing and may
   reasonably conclude the choices were never deliberate.

**Which direction being wrong hurts more**

Mildly. The worst case is duplicated rationale that drifts — which is the defect
this workforce is built to catch, so it would be caught.

**What already covers this**

`docs/process/AGENT-ROSTER.md` covers the content. The question is only about
discoverability and ledger scope.

**What must change alongside**

Whichever option is chosen, `DECISIONS.md`'s scope line should state it
explicitly, because the ambiguity is what produced this entry.

**Recommendation, and what would make it wrong**

Option 2 — cheapest, and it keeps the ledger focused on decisions that bind the
product. It would be wrong if process choices turn out to get reopened and
relitigated as often as product ones, in which case they need the ledger's
supersession discipline and option 1 is right.

---

## OD-003 — Which reason codes apply when a canon rule cannot be implemented?

- **Raised:** 2026-08-19 · **By:** workforce founding, integration review · **Status:** OPEN
- **Blocks:** nothing until implementation begins; then it forks immediately

**The question, in plain language**

When a canon rule cannot be implemented as written, two documents in this
repository tell you to classify the problem, and they give different lists.

**Why it is undecided**

`docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` requires:
`CANON_DEFECT`, `APP_SCHEMA_REQUIRED`, `OPTIONAL_CAPABILITY_GATED`,
`IMPLEMENTATION_DEFECT`.

The V2 severity vocabulary offers: `BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`,
`EXPECTED_DEBT`, `OPTIONAL`, plus `BLOCKED_BY_OWNER_DECISION`.

`CLAUDE.md` keeps the handoff live as process guidance "where it is compatible
with the canon", and this is not incompatible — so both stand. The handoff's
middle two codes have no V2 equivalent, and they describe the two most likely
real outcomes once implementation starts: the rule needs a schema field that
does not exist yet, and the rule is gated on an optional capability. Under the
V2 set both collapse into `BLOCKED_BY_OWNER_DECISION` or `EXPECTED_DEBT`, losing
the distinction.

The handoff must not be edited, so this cannot be resolved by changing it.

**Options**

1. **Adopt the two missing codes into the V2 vocabulary** as sub-classifications
   of `EXPECTED_DEBT`. Commits to: a slightly larger vocabulary. Preserves a
   distinction that will matter in Phase 2.
2. **Map them explicitly** — record in `AGENT-ROSTER.md` that
   `APP_SCHEMA_REQUIRED` and `OPTIONAL_CAPABILITY_GATED` both surface as
   `EXPECTED_DEBT` with a stated sub-reason. Cost: one paragraph.
3. **Defer until implementation begins**, when the real frequency of each is
   visible.

**Which direction being wrong hurts more**

Low stakes now, and it is cheap to change later. The risk is only that two
vocabularies coexist unnoticed until someone files the same problem two ways.

**What already covers this**

Nothing. Both lists are live and neither references the other.

**What must change alongside**

`docs/process/AGENT-ROSTER.md`'s severity table, whichever option is chosen.

**Recommendation, and what would make it wrong**

Option 3, with option 2's one-paragraph mapping added now so the fork is
recorded rather than latent. It would be wrong if Phase 1 schema work starts
before this is revisited, in which case option 1 should be settled first.

---

## OD-004 — Should chemistry work also get an ordinary-use review?

- **Raised:** 2026-08-20 · **By:** conformance-harness run, Part 4 wiring · **Status:** OPEN
- **Blocks:** nothing — `/implement-chemistry` runs today exactly as written

> **Related, and decided: `DEC-027` (2026-08-22).** The owner has ruled on the
> *same shape of question* for a different agent. `unimpressed-reefkeeper` now
> runs in `/implement-chemistry` whenever the round changes anything he sees; its
> exemption is engine-only. The sequence was restated by owner decision rather
> than extended by a run — which is option 2's "honest form" below, taken.
>
> **This does not answer OD-004.** The two agents are not interchangeable:
> `normal-operation-reviewer` reasons from the specification against
> `PRODUCT-REVIEW-CRITERIA.md`; `unimpressed-reefkeeper` reads no document and
> drives the running app. A round can pass one and fail the other. What `DEC-027`
> does change is the cost of option 2: the "fixed sequence stops being fixed"
> objection is now weaker, because the precedent set is an owner restating it,
> not a run extending it.

**The question, in plain language**

`normal-operation-reviewer` asks whether the product gives a sensible answer on
an ordinary tank with ordinary readings. `/implement-chemistry` is the workflow
for the changes most likely to produce an unreasonable answer. Should that
workflow run it?

**Why it is undecided**

`/implement-chemistry` says "This sequence is fixed. Do not shorten it and do
not extend it." `AGENT-ROSTER.md`'s composition table, as merged from
`claude/dosing-wizard-review-agents-hpnc50`, described the chemistry round as
running `normal-operation-reviewer` and then `jake` inside that sequence. Both
could not be true.

The owner has resolved the `jake` half (`DEC-017`): he is not a reviewer, so a
step that runs strictly after the sequence does not extend it. That reasoning
does not carry across. `normal-operation-reviewer` *is* a reviewer, and adding
a reviewer is the thing the fixed sequence forbids.

So the wiring instruction was followed where it was given — `/implement` and
`/pr-gate` (`DEC-018`) — and the roster's chemistry row was corrected to match
what the skill actually runs. That leaves a real gap: the highest-consequence
workflow is the one that does not ask whether the answer is any good.

**Options**

1. **Leave it as it stands.** Chemistry work gets canon conformance and
   adversarial attack; ordinary-use review reaches it only when a session uses
   `/implement`. Commits to: the fixed sequence staying genuinely fixed. Costs:
   the gap above. Reversible: yes.
2. **Add it to `/implement-chemistry` as a fourth reviewer**, and change the
   skill's "do not extend it" sentence to name the new fixed sequence.
   Commits to: a longer mandatory round on every chemistry change. Forecloses:
   nothing. Cost: one more agent per chemistry run, and the precedent that the
   sequence can be extended when the extension seems worthwhile — which is how
   fixed sequences stop being fixed.
3. **Add it as a post-sequence step alongside `jake`**, on the same argument
   `DEC-017` uses. Commits to: a second exception to a rule that has now had
   one. Cheaper than option 2 and harder to justify, because unlike `jake` this
   agent produces findings rather than sorting them.

**Which direction being wrong hurts more**

Asymmetric toward option 1 being wrong, but not sharply. A chemistry change
that is canon-conformant, survives adversarial attack, and is still unusable in
practice is a real failure mode — it is the one `normal-operation-reviewer`
exists for. Against that, the sequence being extendable by anyone who thinks
the extension is worthwhile is the failure mode "fixed" was written to prevent.

**What already covers this**

Partly. `canon-conformance-auditor` catches behaviour that does not match
canon; `breaker` catches behaviour that fails under attack. Neither asks
whether canon-conformant behaviour is defensible to a keeper — the roster says
so explicitly under `normal-operation-reviewer`'s overlap prevention.

**What must change alongside**

Whichever option is chosen: `AGENT-ROSTER.md`'s composition table, which must
keep matching what the skills actually run. Under option 2 or 3, the skill's
own "do not extend it" sentence needs rewriting rather than quietly reading
around.

**Recommendation, and what would make it wrong**

Option 2, with the sequence re-stated rather than merely extended — if the
owner wants ordinary-use review on chemistry work, the honest form is a new
fixed sequence of four, not an exception. It would be wrong if chemistry
changes are rare enough, and `/implement` common enough, that the gap closes
itself in practice; option 1 is then the cheaper truth.

---

## OD-005 — Should the conformance harness be enforced by CI, and by what?

- **Raised:** 2026-08-20 · **By:** conformance-harness run · **Status:** OPEN
- **Blocks:** nothing — `DEC-016` makes the harness required as process discipline today

**The question, in plain language**

`DEC-016` makes the conformance harness a required check. Nothing on GitHub
enforces that. Should there be a workflow that runs it on every pull request,
and should the check be required to pass before merge?

**Why it is undecided**

`DEC-016` records the decision; it deliberately does not configure enforcement,
because enforcement is a repository setting the owner holds. This is the same
shape as `OD-001` and depends on it: a required status check is configured on
the branch protection rule that `OD-001` is about.

There is a second part that `OD-001` does not cover. The harness is **red
today** and will stay red until an engine exists and the three document defects
it reports are resolved. A required check that cannot pass blocks every merge,
including the merges that would fix it. So enforcement needs either a baseline
the check is measured against, or a start date, or a scope limited to changes
that touch the engine.

**Options**

1. **Add the workflow now, reporting only; make it required when it can pass.**
   Commits to: the output being visible on every PR from today. Cost: near
   zero. Reversible: yes.
2. **Add it and make it required immediately, with the current failures
   recorded as an accepted baseline** the check compares against. Commits to:
   maintaining a baseline file, which is a thing that goes stale. Catches
   regressions from today.
3. **Wait for `OD-001`.** Commits to nothing; the harness stays a command
   someone remembers to run.

**Which direction being wrong hurts more**

Mildly. The harness exists and runs from one command either way; this is about
whether anyone is reminded.

**What already covers this**

Nothing. There is no CI configuration in this repository at all.

**What must change alongside**

`docs/process/AUTONOMY-AND-CONTROLS.md`, which owns what is and is not a
control, and `DEC-016`'s consequences section, which currently says enforcement
is unconfigured.

**Recommendation, and what would make it wrong**

Option 1. It is cheap, it makes the harness's report visible on every change
without blocking anything, and it converts to option 2 by flipping one setting
once an engine exists. It would be wrong if the owner wants regression
protection from today, in which case option 2's baseline is the price of it.

## Closed

## OD-006 — Is the conformance harness a required check?

- **Raised:** 2026-08-20 · **Status:** CLOSED — see `DEC-016` (2026-08-20)

Decided by the owner before the work began, and recorded here so that a reader
of this queue finds it alongside `OD-001`, which it depends on for enforcement.

## OD-007 — Does `jake` run inside the reviewer sequence or after it?

- **Raised:** 2026-08-20 · **Status:** CLOSED — see `DEC-017` (2026-08-20)

Decided by the owner. `/implement-chemistry`'s fixed sequence and the roster's
composition table contradicted each other; the sequence stays fixed and `jake`
is a post-processing step over its output. The residue for
`normal-operation-reviewer` is `OD-004`, which is open.

