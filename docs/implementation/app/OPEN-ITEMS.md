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
