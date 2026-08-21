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
