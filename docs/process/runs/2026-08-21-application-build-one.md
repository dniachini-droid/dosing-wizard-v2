# Run record — the first application build

**Date** 21 August 2026
**Branch** `claude/phone-application-build-l9knef`
**Base** `ad4bdd1927d726bd9c9687e46f12c2701905f525` (`main`, PR #12 merged)
**Reference read** `dniachini-droid/tank-wizard` at
`9276a2ca254e88d19e0f02dced42a1b896499780`, read-only

---

## What this run was for

Turn a working engine and a set of static mockups into an application the owner
can install on a phone and use on a real tank.

---

## The one architectural decision, and why it went that way

**The application runs the engine itself, not a copy of it.**

The engine is Python. The application is a web page. There are two ways to
reconcile that and only one of them is allowed here.

The disallowed one is a JavaScript rewrite. Canon `MASTER RULE 1`: one owner
for each inference, and "two implementations that agree today are a defect, not
a coincidence." A hand port of 5,715 lines of chemistry would be a second owner
of every threshold, rail and equation in the canon, and the day the two
disagreed there would be no way to say which was right. `X-INV-004` and
`DEC-003` say the same thing from the other direction.

So `app/src/engine/worker.js` loads `engine/alk_v2/*.py` — the same files the
conformance harness runs, byte for byte, unmodified — into CPython compiled to
WebAssembly, and speaks the same JSON the harness speaks. The engine was not
edited to run there: the reason-code catalogue is placed at the path
`catalogue.py` already looks for, rather than `catalogue.py` being changed.

**The cost, stated.** About 12 MB of runtime on first install, and a few
seconds to start it. It is fetched and hash-verified by
`tools/app/vendor-runtime.py` rather than committed, on the same principle as
`mockups/build-single-file.py`: the script is committed, the artefact is not,
so the two can never drift apart.

**The cost is not paid on first paint.** The service worker precaches the shell
and caches the runtime in the background. Logging a reading, completing a task
and reading history all work before the engine has finished starting; only the
assessment waits, and it says so in words rather than showing an empty card.

---

## What was verified, and how

| | |
|---|---|
| Application checks | **62**, 0 failures |
| Negative controls | **45** defined, **45** caught, 0 missed, 0 blocked |
| Strings check | GREEN — no prose literal outside `app/src/strings.js` |
| Conformance gate | **RED, byte-identical to the baseline**: 11 fixture, 5 check, 3 invariant failures — exactly the reds `PROJECT-STATE.md` accounts for |
| Engine mutation set | GREEN, unchanged |
| Engine source | untouched. `git status` shows no change under `engine/`, `docs/canon/`, `docs/implementation/alk-v2/` or `tools/conformance/` |
| Browser | the whole application driven end to end in Chromium: first run, setup refusal, first reading, the moment, hard reload, a full series, an engine answer, the date-only record, the suggested-test prompt, offline open, every tab |

---

## Defects this run's own tests found

Four, all in code this run wrote, all fixed, each with a negative control. They
are listed because each was invisible until something was written to catch it.

**The event-id counter reset on a new millisecond.** `newEventId` kept a
per-millisecond counter that reset whenever the millisecond changed, so an
out-of-order append collided with an earlier id — and a correction is routinely
out of order, since it carries the correction's recorded time while the events
around it carry their own. Found by `TIME-03` while it was checking something
else. The counter is now monotonic. Control `AM-03`.

**A nudge persisted into every later occurrence.** V1's `adjustDays` stays on
the task, so a one-off "not this Tuesday" shifted every occurrence after it too
— the opposite of what V1's own comment claimed and of what
`TASKS-AND-SCHEDULING.md` requires. `adjustAnchor` now records the completion
the nudge was made against, and the nudge lapses when a later completion
arrives. Found by `SCH-03`. Control `AM-23`.

**A payload value put contract vocabulary on a real screen.** The payload key
was translated and the value printed verbatim, so
`CONFIRMED_PROGRAMMED_SCHEDULE` appeared on the assessment card — a direct
breach of owner decision 9. Found by the browser run, not by a unit check.
`sayPayloadValue` now withholds any value it has no wording for, by shape
rather than by list. Control `AM-42`.

**The reason-code coverage check was only looking at three-segment codes.**
`STR-01` extracted codes with a `{2,}` repeat, so `TRAJECTORY_FALLING`,
`UNCERTAINTY_LIMITED` and every other two-segment code went unchecked. Found by
mutation `AM-40` staying green — the mutation arm doing exactly the job it
exists for. Widened; ten missing sentences were written as a result.

A fifth, in the platform rather than the domain: the service worker's precache
list included the directory URL `./`, which is not universally fetchable, so
one unfetchable entry failed the whole install and the app silently never
worked offline. The install now names the file that failed.

---

## Where the brief and the contract disagreed

**The ranked list's order.** The brief says the order comes from the engine. It
cannot come entirely from the engine: `mockups/CONTRACT-GAPS.md` gaps 2 and 17
record that `EngineResult` has no ordering field for anything user-facing, and
that a due water change and an assessment item share no scale.

What the build does: severity comes from the engine, the rank between classes
is a product ordering declared as data in `ATTENTION_RANKS`, and Today says
that in plain words rather than printing a caption claiming an authority the
contract does not grant. Gaps 2 and 17 stay open. Recorded as `AI-004`.

**The Tools tab.** The mockups make the disabled tab unclickable. In a live
application that is a visible tab that does nothing when tapped, with no way to
tell "coming later" from "broken". The build keeps it pressable and opens a
screen that says what it is. Recorded as `AI-005`.

Both resolved in the brief's favour, per its own instruction, and recorded.

---

## What was recorded and left open

`docs/implementation/app/OPEN-ITEMS.md`, six items. The one worth naming here:

**`AI-001` — "Why that day" needs a field the retest output does not carry.**
`TASKS-AND-SCHEDULING.md` gives worked copy that states how much alkalinity
will have moved by the suggested day. That figure is a forecast, and the
threshold it is compared against is inside the retest scheduler; neither is on
`EngineResult`. Working it out in the interface would be a second owner of a
number canon already owns. The view states what the engine did supply and says
plainly that the accumulated figure is not among it. Closing it is one or two
fields on the retest output — an output change, not a behaviour change.

---

## Reviews

`test-engineer`, then `normal-operation-reviewer`, then `jake` over both, per
the brief. Findings and the single fix pass are recorded below this line as
they land.

---

# Review pass and fixes (same day)

`test-engineer`, then `normal-operation-reviewer`, then `jake` over both — the
order the brief set. `breaker` was not run, as instructed. One fix pass.

## What the review found

`jake`: **19 BUG, 6 EDGE CASE, 0 ALREADY COVERED, 0 rejected as mistaken.** Its
note on the empty third column is the useful one: not a single finding ends in
"and therefore the engine declines". The engine declines correctly in several
of them. What failed in each case was the application's account of the
declining.

The four that mattered most, and they compounded:

**F-01 — every hold rendered as a broken build.** `cards.js` tested
`action === "HOLD"` and `action === "REFUSE"`. The contract's closed
`RecommendationAction` vocabulary (`ALK-V2-DATA-CONTRACT.md:577-582`) contains
neither: the engine emits `HOLD_CURRENT_DOSE`, and `REFUSE` is a *capability*
outcome, never an action. Both rows were unreachable, so every hold — a settled
tank, a confounded reading, an anomalous reading, a toward-range hold, an
uncertainty-limited hold — fell to the `UNCLASSIFIED` fallback and told the
keeper "this build has no card for what the engine returned. Do not act on this
card."

It was green in CI because `test-cards.mjs` encoded the same wrong vocabulary,
and disjointness and totality both held *trivially* — an unreachable row
collides with nothing, and the fallback caught what it dropped.

`jake` supplied the part that made the fix correct rather than cosmetic: a
capability refusal and an ordinary hold arrive as the *same* action, because
holding the current rate is what the engine does in both cases
(`dosing.py:472, 479, 590` set the status and leave the action alone). Keying
on the action cannot distinguish them at all. `maintenanceActionStatus` is the
field that carries the difference, and the contract declares it for exactly
that (`:572` — `WITHHELD_LIQUID_GUARD` "is distinct from `HELD`").

**F-02 — Today instructed a dose change on a hold and on insufficient data.**
`isPresent(recommendedDoseMlPerDay)` was tested before the card class, and canon
deliberately puts `D_current` in that field on the insufficient, confounded,
anomalous, uncertainty-limited and stable branches so a card can say what it is
holding against. So the row read "Set the alkalinity maintenance dose to 12.0
mL/day · Up 0.0 mL/day from 12.0" on a hold, and told the keeper to set a dose
on a day whose own card said there was not enough evidence to size one.
`PRC-005`'s second clause calls that always serious.

**F-03 — no way to say what your doser is set to.** `KIND.DOSE_STATE` existed
and was mapped for the engine, and no screen created one. Without a `DOSE_STATE`
or a `DOSE_CHANGE`, `delivery()` returns `NOT_RUN` and every dose recommendation
is withheld permanently. `dosing.py:150-154` names that exact ledger as "the
commonest first-run ledger there is". The only workaround was to invent a dose
change from a dose the keeper had never used.

**F-06 — the app wrote to the keeper's own schedule unbidden.** Three faults in
one module: any retest counted as a suggestion (so a routine cadence tick raised
one on every assessment); declining was keyed on an instant recomputed every run,
so "no thanks" was inert and the stored list grew without bound; and a remembered
"Replace" re-applied on *every* reassessment, adding its shift each time, so the
keeper's own alkalinity test was pushed forward on every launch and could never
come due. `TASKS-AND-SCHEDULING.md:107-110` lists that first under WHAT THIS
RULES OUT.

`jake` also mapped the interactions, which changed the order of work: F-02 was
*masked* while F-03 was unfixed (the dose was withheld, so `isPresent` was
false), and fixing F-03 would have made the `effectiveAtConfidence || "EXACT"`
default live. Those three went in together.

## What was fixed

Card vocabulary and the refusal predicate; the standing-dose-as-instruction
rule, extracted to `instructsDoseChange()` so both screens consume one owner;
the dose-state entry form; `effectiveAtConfidence` required at event creation
rather than defaulted; all three parts of the suggestion module; failed storage
reads raising instead of reading as an empty tank, and `runAssessment` refusing
to assess *or store* through one; replay comparing canon §64's third condition
and reporting its causes separately; `inputEventsNamed` counted over the same
population that names it; the offline precache; four capability labels that
named a different capability's meaning; three `MovementEvidence` values with no
wording; the "why that day" winner; the dose-expectation snapshot field names;
the never-expiring ask; every-open-writes-an-assessment; the stale assessment
time; the measured-replacement path offered from the water-change task; and the
eligibility rule that had two disagreeing owners.

## What running it found that reading it did not

The browser smoke run caught an **assessment-id collision under concurrent
writes**. `record()` read the stored list, picked the next free id, checked it
was free, and wrote — every step awaiting, and an await is a yield. Two writes
starting in the same second both cleared the check, chose the same id, and one
silently replaced the other, walking straight through the guard written to
prevent exactly that. A retry loop only narrows the window; writes are now
serialised. `ASS-13` pins it.

Fixing that exposed a second thing: the existing id check afterwards had become
unreachable, which is how it was noticed — the mutation that deleted it changed
no observable behaviour. It was a second owner of "never overwrite an
assessment" and is gone.

Two of the tests written in this pass were themselves defective and were caught
before they could pass for real work. `LED-08` called the async `throws` helper
with the wrong arity and without awaiting, so its assertions never ran — found
because its mutation stayed green. And the assessment-id fix was briefly
belt-and-braces (padding *and* a numeric sort), which `MASTER RULE 1` calls a
defect; the padding was removed and the sort left as the single owner.

## Mechanism fixes, not just symptom fixes

`jake` was explicit that fixing F-01 without replacing the corpus would leave
the mechanism that let it ship. So:

- `CARD-07` proves disjointness and totality over the full cross-product built
  from the contract's own vocabularies (~5,000 shapes), not a 13-case corpus.
- `CARD-08` fails if any row of the table is unreachable. Verified against the
  original defect: reverting the `HOLD` predicate turns it red.
- `STR-06` now *parses* the closed vocabularies out of
  `ALK-V2-DATA-CONTRACT.md` instead of retyping them. It immediately found a
  gap nobody had reported: `Position` includes `ALERT_LOW` and `ALERT_HIGH`,
  neither of which had wording, so a keeper in an alert state read "Not
  recorded" for where their alkalinity actually was.
- `SHELL-01` enumerates the modules on disk and fails if any is absent from the
  service worker's precache list.

## Verification

75 application checks, 0 failures. 61 mutations, 61 caught, 0 missed, 0 blocked.
Strings check green. Moment-timing check green. Browser smoke clean, and it now
walks the real post-change path rather than driving the suggestion sheet from a
routine cadence tick. Conformance gate byte-identical to the pinned baseline —
11 fixture / 5 check / 3 invariant failures. Engine mutation set GREEN.
`engine/`, `docs/canon/`, `docs/implementation/alk-v2/` and `tools/conformance/`
are byte-identical to `origin/main`.

## Left open

`AI-007` (engine, and canon-underdetermined), `AI-008` (contract contradiction),
`AI-009` (five owner decisions), `AI-010` (coverage this build does not have —
including that ~4,400 lines of screen code have never been read against
`DEC-003` / `X-INV-004`, which is the largest gap and is deliberately stated
rather than absorbed).
