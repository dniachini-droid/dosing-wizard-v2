# Application build — items recorded and left open

Findings from building the application that are **outside the scope of the
build task** and were therefore recorded rather than fixed, per the brief's
instruction: *"New findings outside this scope: RECORD AND LEAVE OPEN."*

Nothing here is resolved. Nothing here changes behaviour. Each states what was
found, what it blocks, and what would close it.

---

## AI-001 — "Why that day" needs a field the retest output does not carry

**Where.** `app/src/present/why-retest.js`, and the view it feeds.

**What.** `docs/implementation/app/TASKS-AND-SCHEDULING.md` gives worked copy
for the reasoning behind a suggested test:

> You changed the dose today. That should shift alkalinity by about 0.10 dKH a
> day. By Saturday it will have moved around 0.30 dKH — enough to tell apart
> from ordinary test variation.

The first sentence is renderable: the per-day figure is the engine's
`doseRecommendation.predictedPostSlopeDkhPerDay`.

The second is not. The accumulated movement by the suggested day, and the
threshold it is being compared against, are inside the retest scheduler. The
`EngineResult` carries `retest.tSignalDays`, `tSignalRawHours` and
`tSignalHours`; it carries neither the accumulated figure nor
`signalRequiredMovementDkh`.

**Why it was not worked out in the interface.** Multiplying a slope by a number
of days is a forecast. `DEC-003` and canon `X-INV-004` give the domain engine
one owner for that, and `MASTER RULE 1` calls a second implementation a defect
rather than a coincidence.

**What the build does instead.** The view states what the engine did supply —
the selected timing, its reason, the per-day figure, the candidate timings it
weighed and the ones it could not consider — and says in plain words that the
accumulated figure is not shown and why.

**What would close it.** One or two fields on the retest output. It is an
output change, not a behaviour change, and belongs to a governed reissue rather
than to this task.

---

## AI-002 — A suspect mark is recorded and does nothing

**Where.** `app/src/store/ledger.js` (`project`), and the mark sheet.

**What.** The keeper can mark a reading suspect. The mark is stored as an
append-only annotation and shown wherever the reading is shown. It does not
change what the engine is given: a suspect reading is still sent.

**Why.** What a suspect reading should do to an assessment is a chemistry
question — an eligibility rule — and the frozen canon has none. Filtering it in
the interface would be the interface deciding eligibility, which `X-INV-004`
forbids.

**What the build does instead.** Records the mark, shows it, and says plainly
on the sheet that this build does not act on it.

**What would close it.** A canon rule for analytical eligibility of a
keeper-flagged reading.

---

## AI-003 — No test cadence exists for any parameter but alkalinity

**Where.** `app/src/store/schedule.js`, and the empty Tasks screen on a fresh
install.

**What.** V1 seeded a test interval per parameter. Those are cadences, cadences
are chemistry, and the canon states exactly one — alkalinity's — and states it
as an engine OUTPUT (the retest scheduler's `recommendedAt`), not as a number
to seed a repeating task with.

**What the build does instead.** Ships no seeded schedule at all. A fresh
install's Tasks screen is empty and says why. A keeper who wants a nitrate test
every week creates that task and types "7", and seven is then their number.

**What would close it.** Either canon cadences for the other parameters, or an
owner decision that a shipped default schedule is a product convenience rather
than a chemistry assertion. Neither is this task's to make.

---

## AI-004 — Nothing in the contract orders the ranked list

**Where.** `app/src/present/attention.js`.

**What.** `mockups/CONTRACT-GAPS.md` gaps 2 and 17, unchanged. `EngineResult`
has no ordering field for anything user-facing, and a due water change and an
assessment item share no scale.

**What the build does instead.** Severity comes from the engine — every reason
code carries a catalogued severity, and the card class comes from reading
engine fields. The rank BETWEEN classes is a product ordering declared as data
in `ATTENTION_RANKS`, and Today says so in plain words rather than claiming an
authority the contract does not grant. Ties inside a class break on how overdue
something is, which is arithmetic over dates the keeper set.

**What would close it.** Gaps 2 and 17. Both stay open.

---

## AI-005 — The disabled Tools tab: a departure from the mockups

**Where.** `app/assets/shell.css`.

**What.** `mockups/app.css:848` sets `pointer-events: none` on the disabled
tab. In a static screen set that is right — there is nowhere to go. In a live
application it makes a visible tab that does nothing at all when tapped, and
the keeper cannot tell "coming later" from "broken".

**What the build does instead.** The tab stays pressable and opens a screen
that says Tools are not in this build and what is planned. Still disabled in
the sense that matters: there are no tools.

**Recorded as a disagreement with the mockups, resolved in the brief's
favour** ("Where the mockups and this brief disagree, follow this brief and
record the disagreement"): the brief says "Tools present but disabled", and
both readings satisfy it; this one does not leave a dead label.

---

## AI-006 — Two defects the build's own tests found, fixed here, worth naming

Neither is outside scope — both are in application code this task wrote — but
both are the kind that would have been invisible without a negative control, so
they are on the record.

**The event-id counter reset on a new millisecond.** `newEventId` kept a
counter that reset whenever the millisecond changed, so an out-of-order append
— which a correction routinely is, since it carries the correction's recorded
time while the events around it carry their own — collided with an earlier id.
Found by `TIME-03`. The counter is now monotonic. Negative control `AM-03`.

**A nudge persisted into every later occurrence.** V1's `adjustDays` stays on
the task, so a one-off "not this Tuesday" shifted every occurrence after it too
— the opposite of what V1's own comment claimed and of what
`TASKS-AND-SCHEDULING.md` requires. The build adds `adjustAnchor`: the nudge
applies only while the completion it was made against is still the latest one.
Found by `SCH-03`. Negative control `AM-23`.

**A payload value leaked contract vocabulary onto a real screen.** The payload
key was translated and the value printed verbatim, so
`CONFIRMED_PROGRAMMED_SCHEDULE` appeared on the assessment card. Found by the
browser smoke run. `sayPayloadValue` now withholds any value it has no wording
for. Negative control `AM-42`.

**The reason-code coverage check was only looking at three-segment codes.**
`STR-01` extracted codes with a `{2,}` repeat, so two-segment codes —
`TRAJECTORY_FALLING`, `UNCERTAINTY_LIMITED`, `MAINTENANCE_HOLD` — were never
checked. Found by mutation `AM-40` staying green. Widened, and ten missing
sentences were written as a result.

---

# Recorded in the first review pass (21 August 2026)

`test-engineer`, `normal-operation-reviewer` and `jake` reviewed the build.
Nineteen findings were classified BUG and most were fixed in the single pass
the brief allows. What follows is what was **not** fixed, and why each was left.

---

## AI-007 — A satisfied post-change retest candidate never retires (ENGINE)

**Where.** `engine/alk_v2/engine.py:1394-1398`.

**What.** The `POST_CHANGE_FIRST` retest candidate is submitted at
`max(0.0, 48 - elapsed_h)` for as long as the intervention sits inside the
14-day attribution horizon. Once 48 hours have passed this is pinned at `0.0`
and stays there, so `retest.py:255` returns `REPEAT_NOW` and the app tells the
keeper to test **now**, every day, for roughly twelve days after a dose change
— including on days they have just tested.

**Why it is left.** Two reasons, either sufficient. It is engine code, which
this build may not touch. And the rule it would need is not in canon:
`normal-operation-reviewer` looked for a statement about whether a satisfied
candidate retires and could not find one, and stopped rather than proposing a
rule. `jake` agreed and routed it out.

**What would close it.** An owner decision, then a governed canon reissue
stating whether a post-change candidate retires once satisfied, then the
engine change. Not an application fix at any point.

**What the app does meanwhile.** Nothing that compounds it. `AI-008`'s fix
means an accepted suggestion is applied once rather than on every launch, so
the keeper's own schedule is no longer dragged forward by this each time the
app is opened.

---

## AI-008 — The `DATE_ONLY` wire representation contradicts itself (CONTRACT)

> **RESOLVED by owner decision 30 (21 August 2026).** A reading with no usable instant is
> **not transmitted as an `Instant` at all**: `ALK-V2-DATA-CONTRACT.md` §1 now declares
> `ObservedTime`, of which `Instant` is the narrowing to the two provenances that carry an
> `absoluteInstant`. A `DATE_ONLY` reading carries `calendarDate`; a
> `LOCAL_TIME_ZONE_UNKNOWN` reading carries `localDateTime`; neither carries an
> `absoluteInstant`. Both contract statements now hold together, because the shape the
> record is sent in is the shape the contract declares for its provenance.
>
> The third bad option the analysis below did not have — say nothing, and let the engine
> report a validation failure — is also closed. The engine no longer treats a record
> honouring its own provenance as malformed. `VALIDATION_TIMESTAMP_INVALID` is **narrowed**
> to a record that claims a usable instant and does not supply a readable one, which is what
> it was always for.
>
> **What the keeper stops seeing.** The app's own honest *"kept in your history; it cannot
> be used for the trend"* no longer sits beside the engine's *"a record carries a time that
> could not be read"*, because the engine says nothing at all. Whether the app's own
> sentence should also go is an interface question and is not decided here; under decision
> 30 there is nothing left for it to contradict.
>
> **The application still sends the old shape.** This build was not permitted to touch the
> interface, so `store/import-v1.js` and `store/time.js` still emit a bare calendar day
> where the contract now asks for `calendarDate`. That is a one-field rename in the writer
> and is the whole of the remaining work; it is recorded below as `AI-014` rather than done
> here. Until it is done the engine treats those records as malformed for want of the
> declared field — the same visible outcome as before the amendment, from a different and
> now-fixable cause.
>
> Encoded in canon Part II §2.3A.1, §2.3A.2, `M-8`, `M-13`, `X-INV-007`;
> `ALK-V2-DATA-CONTRACT.md` §1 and `Reading.measuredAt`; `ALK-V2-ALGORITHM-CONTRACT.md`
> `A1`; `INV-H6`; fixtures `AD-TIME-001`, `AD-TIME-002`, `WG-ALK-066`, `INV-TIME-001`;
> mutations `E-28` … `E-31`.
>
> Everything below this box is the pre-decision analysis, preserved as the record of why the
> decision was needed.

**Where.** `docs/implementation/alk-v2/ALK-V2-DATA-CONTRACT.md:87` against §1's
`Reading.measuredAt`.

**What.** Line 87 says a `DATE_ONLY` reading is usable as the latest valid
current value. `measuredAt` is a required `Instant`, and
`kernel.parse_instant` (`kernel.py:74`) rejects any string without an offset —
correctly, because that is what a required `Instant` means. So the app has two
choices and both are wrong: send the date, and the engine records
`VALIDATION_TIMESTAMP_INVALID` and drops the reading; or fabricate an instant,
which §1 forbids "absolutely".

The build sends the date, which is why a keeper who logs a reading from memory
sees the app's own honest *"kept in your history; it cannot be used for the
trend"* alongside the engine's *"a record carries a time that could not be
read"*. Two accounts of one fact, and the second is untrue: the provenance was
declared, not malformed.

**What was fixed here.** Only the app's half that needed no ruling: the event
id now travels with every engine event, so a problem the engine reports names
the reading rather than calling it `UNKNOWN`.

**Why the rest is left.** Choosing a wire representation for a date-only
reading is a contract decision. Inventing one in the application would be the
app deciding chemistry-adjacent behaviour, and would put a second owner beside
the contract.

**What would close it.** An owner ruling on how a `DATE_ONLY` reading is
transmitted such that both contract statements can hold, then a reissue.

---

## AI-009 — Owner decisions surfaced by the review and not taken

Recorded, not resolved. `jake` identified each as product policy rather than a
defect, and `CLAUDE.md` requires these be surfaced rather than settled.

1. **Setup asks for solution strength directly.** `potency.py:90-124`
   (`ALK-014`) supports three routes to `selectedPotencyDkhPerMl`: a configured
   figure, a manufacturer figure, or derivation from chemical +
   `stockConcentrationGPerL` + `netVolumeL`. Setup offers only the first, so
   the keeper must evaluate it themselves — and every dose recommendation
   scales linearly in that number. Whether the other routes belong in setup is
   a scope decision. (The plain defect alongside it — the heading said "four
   facts" over five fields — **was** fixed.)

2. **`M-2` and `M-3` are named as fixes the app cannot accept.**
   `capability.py:81-91` reads `solutionContextId` and `deliveryContextId`;
   neither `config.js` nor `settings.js` has a field for either, yet "What
   would change this" prints them. Capturing them is a scope addition;
   filtering unfixable items out of that list is a presentation change. Both
   defensible; neither is the implementer's call.

3. **What a remembered "Replace" means when the engine re-suggests.** That the
   old behaviour compounded was mechanically wrong and is fixed. Whether a
   remembered preference should reapply to a *new* suggested date, or be
   treated as spent, `TASKS-AND-SCHEDULING.md` does not say.

4. **The four canon-conformant-but-questionable observations** from
   `normal-operation-reviewer`, restated here so they are not lost between "not
   a bug" and "not my job". Each is canon applied faithfully producing an
   outcome that may not be what the owner intended. None is a defect in this
   build and none is proposed as a change:
   - a weekly water change on the 77 L reference system makes it largely
     unanalysable (the 5% break fraction against 3 clusters over ≥4 days);
   - a single 0.2 dKH blip on three readings can size a dose reduction,
     because the residual MAD is zero so the σ floor governs;
   - the signal-accumulation retest can never be the selected candidate on a
     slow drift, because the 48 h routine cadence is always sooner;
   - the retest is measured from the assessment instant rather than from the
     last test, and canon does not state which.

   The reviewer's arithmetic behind the second was hand-traced without a shell
   and is not independently confirmed here.

---

## AI-010 — Coverage this build does not have, stated plainly

**The screen modules have not been audited against `DEC-003` / `X-INV-004`.**
Roughly 4,400 lines across twelve screen modules. `DEC-003` and canon
`X-INV-004` forbid any UI component computing chemistry, and no reviewer read
those lines against that rule: `test-engineer` read them only at store call
sites, `normal-operation-reviewer` traced specific sequences, and `jake` read
what its sort turned on. `tools/app/check-strings.py` covers strings, not
arithmetic. This is a stated gap in coverage rather than a finding, and it is
the largest one.

**The IndexedDB backend has no behavioural test.** `ASS-12` checks by source
shape that its read methods raise rather than reporting a failure as absence.
A source-shape check proves the throw is written, not that it fires. A real
test needs a browser.

**Replay determinism is not tested end to end.** `ASS-09` pins the reader that
canon §64's configuration condition turns on, and `replay()` now reports its
three conditions separately. But no test runs the engine twice and compares,
because the engine needs Pyodide and the suite runs in Node. What should exist:
store an assessment, replay it unchanged, then replay after a config append,
after a correction to an input event, and after a simulated version bump,
asserting each is reported as its own distinct cause.

**The worker boundary is unverified.** Nothing checks that an `EngineResult`
round-trips through the Pyodide worker losslessly, nor its timeout semantics.

**The capability labels are checked by eye.** `STR-06` proves every `M-1`..`M-13`
renders as words and is not the catch-all; it cannot prove a label names the
*right* capability, which is exactly the defect that was found (four of them
named a different capability's meaning). Verified against
`ALK-V2-DATA-CONTRACT.md:844-856` by reading, and re-verified after the fix.
There is no mutation for it, deliberately, because no test would catch one.

**A dose is matched to a recommendation with an exact-equality tolerance.**
`today.js` treats a recorded dose as answering a recommendation when it is
within `1e-9`. A keeper who sets 2.49 against a 2.5 recommendation keeps the
confirmation ask. Left open rather than fixed because choosing a tolerance is
choosing a number that governs behaviour, and this build does not originate
those.

---

## AI-011 — Test mode: what the review found and did not close

Recorded during the test-mode build (`test-engineer`, then `jake`). The defects
they found were fixed and are named in the commit; these are what was left.

**A configuration created inside test mode is dated by the app's own clock, and
whether that is right is a product question.** Setup stamped `effectiveFrom`
from the wall clock, so a configuration created while the assessment instant
sat in March was effective at the real instant it was typed — and canon §518
then resolved no version at all, so the engine refused every backdated
assessment with `M-12`. The feature did not work on its own primary path. It
now stamps from the application clock, which in normal operation is the same
value and in test mode is the instant the keeper is standing at.

What is NOT settled: whether a store that exists to be dated by hand should
also let its configuration be re-dated. The screen states the effective date
and offers to move the app's date forward when it sits behind it, which makes
the consequence visible and actionable, but a keeper who wants to look at a
window *earlier* than the facts must clear the test data and start again.
Canon §518 and `ALK-V2-DATA-CONTRACT.md:353` govern the semantics; `DEC-003`
governs provenance; neither settles what a deliberately-dated evaluation store
should do. Not taken here.

**The IndexedDB backend is still exercised only by the smoke aid.** `AI-010`
already records this for the store as a whole; test mode adds to it. That two
databases with different names are genuinely isolated, that `deleteDatabase`
succeeds against a memoised connection, and that `onblocked` behaves as assumed
are all evidenced by `tools/app/smoke.mjs` — a development aid, not a gate. The
committed checks prove the rules against `memoryBackend`, and the injectable
backend factory (`useBackendFactory`) is what lets them go through the
production routing rather than around it.

**`ledger.append` refuses an id collision where `assessments.js` retries.** A
keeper who sets the device clock backwards, reloads and seeds a second batch
can regenerate an id already in the store. The store declines with a visible
error rather than overwriting, so nothing is lost — but the two write paths
handle the same situation differently, and only one of them is a design. Not
introduced by test mode; test mode makes the trigger likelier by inviting date
experimentation.

**Bulk entry is O(n²) in transactions.** `ledger.append` reads every key to
derive the next ordinal, so a 400-line paste is 400 full key scans. Measured on
the memory backend at 6 ms; on IndexedDB it is unmeasured. Acceptable for the
fourteen-reading case the feature exists for, and named rather than assumed.

**Requirement 4's perceptual half is not machine-checkable.** That the marker is
rendered on every render including the crash render is pinned (`TM-24`). That it
is *unmistakable* is not, and no test was written that would pretend to be one.

---

## AI-012 — The import, the charts and the appearance: what the reviews left open

Recorded during the four-stage build on `claude/test-import-charts-styling-1czhoz`
(test mode, the V1 import, the ported chart, the appearance tokens). Reviewed by
`test-engineer`, `migration-auditor`, `normal-operation-reviewer` and `jake`.
Everything they found that was a defect is fixed and named in the commits; these
are the ones left open, and most of them are the owner's rather than mine.

### The canon conflict, recorded rather than argued away

**`SHARED-LEGACY-TIME-001` forbids "silently applying the keeper's current
timezone to old local timestamps". This build applies the device's offset to the
28 imported readings that carry a clock time.** That is an owner decision, taken
on 2026-08-21 in these words: the tank does not travel, so one offset applied to
every row leaves every elapsed interval between them exactly right, and elapsed
interval is the only thing the engine computes from these times; a one-hour
daylight-saving discrepancy twice a year is not distinguishable from measurement
uncertainty against intervals measured in days.

The reading that makes it lawful is that the word doing the work in the canon
rule is *silently*. This is not silent: the import screen states the offset
before anything is written, and every record it touches carries `assumed: true`,
`statedByKeeper: false` and the offset that was applied. A later reader can see
it was worked out, from what, and can disbelieve it.

That is a reading, not a licence, and it is recorded here as a conflict for the
owner to resolve properly at the next canon reissue. Three things follow from
it and are open:

- Whether `RECONSTRUCTED_WITH_PROVENANCE` should admit an assumption at all.
  Canon admits it when the offset is "independently proven **and** the
  reconstruction is recorded". An assumption is the second half without the
  first. `kernel.py:32` then lets those instants into exact-elapsed arithmetic
  in full.
- Whether a dose row built this way should report `effectiveAtConfidence: EXACT`.
  It does, and the reasoning is written into `IMP-28`: with one uniform offset
  the dose's position *relative* to the readings either side of it is exactly
  what the file recorded, and that relative position is what `M-5`'s
  straddling-interval test reads. What the assumption cannot fix is where the
  whole run sits on a world clock, and no engine rule depends on that.
- Whether the earlier design — asking the keeper and recording his answer as his
  statement — should return in some form. It was built and then removed on the
  owner's instruction. `jake`'s objection to it stands and is honoured either
  way: a default nobody typed must never be recorded as something the keeper
  said.

#### Assessed under owner decision 30 — the mechanism is KEPT, and the conflict stays open

Owner decision 30 asks whether this mechanism is still needed, on the reasoning that if
those readings are silently ineligible either way the assumption buys nothing. **It buys
something, and the premise does not reach it.**

The mechanism never touched the 325 date-only rows. `import-v1.js`'s `timeFor` has exactly
two branches: a row with no `time` field gets `dateOnly(row.date)` and gains nothing, in
every case and whatever else is going on; only a row that carries a local clock time is
given an offset. The device offset therefore applies to the 28 timed rows, and no others.

For those 28 the assumption is not the difference between an announcement and a silence.
It is the difference between **28 real observations and none**. One offset applied
uniformly leaves every elapsed interval *between* them exactly right, and elapsed interval
is the only thing the engine computes from these times. Remove the mechanism and those rows
become `LOCAL_TIME_ZONE_UNKNOWN`, silently ineligible, and the keeper loses trend evidence
he actually has — quietly, which is worse than losing it loudly.

So: **keep it.** What decision 30 does change is the mechanism's *standing*. Part of what
made it attractive was that the alternative was a wall of blocking notices; the amendment
removes that pressure entirely, so the mechanism now has to stand on its own merits, and it
does — on the 28 rows, for the reason above.

What decision 30 does **not** settle is the first bullet above: whether
`RECONSTRUCTED_WITH_PROVENANCE` may admit an assumption at all. That is a canon-authority
question about a *different* clause of `SHARED-LEGACY-TIME-001` — the one governing when a
reconstruction may participate — and decision 30 amends only the reporting of records that
lack a usable instant. It is untouched, and it **stays open** for the owner. Deciding it
here would be exactly the silent chemistry ruling `CLAUDE.md` forbids.

### Decisions for the owner, surfaced and not taken

- **A derived `fromMlPerDay`.** V1 records each dose change as one number — the
  new rate. This importer derives the "from" by reading the previous recorded
  change. It is now marked `fromMlPerDayDerived: true` so a reader can tell it
  from the value the file actually holds, but *whether a derived `from` is
  acceptable at all*, or whether the first change must stay open-ended, is the
  owner's.
- **A derived `changedFraction`.** The file records litres and no tank volume,
  so the fraction the engine reads is computed from the volume configured now —
  which may not be the volume the tank had in February. Marked
  `changedFractionDerived` with `changedFractionFromVolumeL`. Whether to derive
  a fraction at all, or to import the litres and let the engine have no readable
  water change, is the owner's.
- **Whether the V1-seeded rows are his.** 25 water changes, 2 ICP panels and the
  lighting note import flagged `V1_SEED_UNCONFIRMED`; the tank settings and
  custom ranges as `V1_CONFIGURATION_UNVERIFIED`. The file does not record which
  rows the keeper entered and which the old app defaulted. Surfaced on the
  import screen rather than decided. It is material: whether those 25 water
  changes are real drives the engine's segmentation.
- **Whether this import is owner-only.** `importv1.js` pre-fills the corrected
  potency `0.0693` — one keeper's number, on a shipped screen, and every dose
  recommendation scales linearly in it. Fine for him and wrong for anybody else.
  If the flow is his alone that should be said somewhere; if not, the default is
  a confident wrong number in a field nobody is prompted to check.
- **Which side of the dose-history boundary a reading dated exactly on it falls.**
  Currently `>=`. No fixture sits on the line and nothing states the rule.

### Observations, recorded because they are worth knowing

- **The potency figure may have been right and read in the wrong unit.** The
  export holds `dkhPerMlPer100L: 0.0533`, which converted for 77 L is 0.0692
  dKH/mL — within 0.1% of the owner's corrected 0.0693. Importing 0.0693 and
  recording 0.0533 as superseded is correct under either reading, and nothing is
  recomputed with either figure.
- **`rawValue` cannot be honest for an imported reading.** The event carries what
  the keeper typed, as a string, before normalisation. The V1 export stores
  numbers, so that string is gone; the importer writes the number's own string
  form. Nothing computes from `rawValue`, and only trailing zeros are lost.
- **`AI-008` is now load-bearing.** A `DATE_ONLY` record has no instant, and the
  wire form sends the bare calendar day. With 325 of them the engine reports each
  as a record whose time could not be read, beside the app's own honest "kept in
  your history". Two accounts of one fact. Closes only by a contract ruling.

### Found by review and NOT fixed here, because they are outside these four stages

- **An `INSUFFICIENT_DATA` answer renders as "not available".** `assessment.js`
  gates its "here is what I am holding at" branch on `HOLD_CURRENT_DOSE`, but the
  engine populates `recommendedDoseMlPerDay` with the standing dose on
  `INSUFFICIENT_DATA` too — `dosing.py` says in as many words that it does so
  "so a card can say what it is holding against". The card discards it. The day
  after the keeper changes his dose on the app's advice, it tells him it cannot
  state anything. Pre-existing; a rendering defect, not a chemistry one.
- **The chart's x axis is the reading's INDEX, not its date.** V1's, ported
  deliberately and unchanged. On an irregular series — after a holiday, or across
  six months of imported history — a nine-day gap draws the same width as a
  two-day one, so the visible slope can be several times the rate the card
  states. Changing it would be a reimplementation rather than a port, which the
  brief for this work forbade; it should be an explicit decision.
- **Which readings the engine used is decided twice.** `history.js` marks a point
  eligible from its time provenance. The engine also drops readings for the
  14-day lookback cap, for segment boundaries and for cluster selection, and the
  chart shows those as usable. `MASTER RULE 1` and `X-INV-004`: the engine is the
  one analytical owner and the chart should render its statement, not compute a
  weaker version of it.
- **A single touch on a chart prevents the page scrolling.** Inherited from V1's
  gesture code, which claims any one-finger touch as a pan.
- **A parameter with no readings can draw a NaN-geometry sparkline**, and a
  dead-flat logged-only series gets an axis expanded ±5% around it.

### Test-suite gaps named by review and not closed

`test-engineer` found 54 surviving mutations; the ones with real consequence
are closed and pinned (`TM-26`..`TM-28`, `IMP-41`..`IMP-43`, `CH-01`, `CH-07`,
`CH-14`, `TOK-12`, `TOK-16`). What is left is the tail:

- **23 checks have no negative control naming them.** The repository's own rule
  is that every check has one. Most are falsifiable; none is declared.
- `import-v1.js`: the litres guard, the ICP `lab` field, `ledgerDoses`'s
  latest-wins ordering, `validTime`'s truncation and the completion key are all
  removable without turning anything red.
- `seed.js`: a bare `water 5` line is not refused as a 500% change.
- `mode.js`: `normaliseDate` rolls an impossible date forward rather than
  refusing it.
- `daysBetween` uses `Math.round`, and no test straddles a daylight-saving day
  in a zone that has one. `TM-16`'s child-process idiom is the way to close it.
- **Determinism across the app and the engine is not tested end to end**, because
  the engine cannot run under `tests/app/`. That belongs in the conformance
  harness. The three conditions canon §64 names are individually pinned
  (`ASS-01`, `ASS-09`).

### One harness defect, found and fixed

`run-app-tests.mjs` did not copy `docs/` into a mutation tree, so `STR-06` was
red in every tree before any mutation was applied — which made `AM-60`, the one
control that names it, report CAUGHT on every run without `STR-06` ever having
detected anything. A control that cannot distinguish the mutation from its own
environment is not a control, and it made "0 missed" a claim the arm had not
earned. Fixed, and the arm now also warns when a mutation names a test no suite
defines.

---

# Recorded during the `SHARED-LEGACY-TIME-001` amendment (21 August 2026)

## AI-014 — The importer still writes the pre-amendment wire shape (INTERFACE)

**Where.** `app/src/store/ledger.js:462` — `toEngineEvents` writes
`measuredAt: at || e.time.localDate`, so a record with no instant is sent as a bare calendar
day **in the `measuredAt` field**. `store/time.js` `dateOnly()` is where the record itself
is built, and it is already correct in substance: it emits `timeProvenance: DATE_ONLY`,
`localDate`, and — in its own words — *"No absoluteInstant. Not null, not midnight, not
noon — absent."*

**What.** `AI-008` is resolved: `ALK-V2-DATA-CONTRACT.md` §1 now declares that a `DATE_ONLY`
record carries `calendarDate` and a `LOCAL_TIME_ZONE_UNKNOWN` record carries
`localDateTime`, and that neither carries an `absoluteInstant`. The application still writes
the shape it wrote before the amendment, so the engine — which now reads the declared field
or reports the record malformed — does not yet see those 325 readings as the honoured
records they are.

**Why it is left.** The amendment brief forbade touching the interface. The change is a
field rename in the writer and nothing more; no logic moves, and no reading gains a time.

**What would close it.** `toEngineEvents` stops putting a day in `measuredAt` and emits
`calendarDate` (or `localDateTime`) beside `timeProvenance` instead. The storage record does
not have to change at all — only the wire form the engine is handed. One commit, inside the
application's own review workflow.

## AI-015 — Two reason-code strings survive for codes that no longer exist (INTERFACE)

`app/src/strings.js:2205` and `:2207` hold wording for
`CAPABILITY_MEASUREMENT_TIME_IMPRECISE` and `CAPABILITY_ABSOLUTE_TIME_UNAVAILABLE`, both
retired by owner decision 30. They are unreachable — no engine may emit either — so nothing
renders them. They are left because the brief forbade touching the interface, and they are
named here because dead announcement wording sitting in the string table is precisely how an
announcement comes back: the next build has a sentence ready and only needs a code to hang
it on.
