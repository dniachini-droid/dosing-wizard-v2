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
