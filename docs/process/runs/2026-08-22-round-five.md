# Round five — what was built, and what is left open

Branch `claude/round-5-instructions-95ii21`, based on round four's head
`2bc6df5`. Round four was an open pull request when this round started, so
branching off `main` as the brief said would have discarded it; `main` has since
merged it (PR #19) and this branch has merged `main` back in twice.

---

## The one rule for this round

> Nothing may be reported fixed on the basis of reading the code.

Every item below that is visible on a screen was reproduced in a real Chromium
at a 390×844 viewport before it was touched, and watched again afterwards.
`tools/app/check-viewport.mjs` is the check that stayed behind; it was watched
going RED with the defect reintroduced before it was kept.

---

## Two structural facts found on the first day

**The findings are not about `tank-wizard`.** The session was pointed at it and
nothing in it matches the report — no `PORT-13`, no deletion code, no Dosing tab
of the kind described. The app is `dosing-wizard-v2`.

**Round four was unmerged.** It was PR #19, open. "Work on a fresh branch off
main" taken literally would have re-broken everything round four fixed.

---

## Open, recorded rather than fixed

### The register sweep — the largest single thing left

`app/src/strings.js` holds roughly **180** sentences that name the software:
"the app", "the engine", "we". The owner's items 10 and 14 named specific ones
and those are fixed, along with every sentence on a surface this round touched.
The rest is a language pass in its own right — it is `jake`'s job across the
whole file, and doing it in a tail-end sweep would produce 180 sentences nobody
read carefully.

**What it needs:** one pass, one reviewer, one commit, with the register stated
once at the top and each sentence rewritten to say the same thing about the tank
rather than about the software.

### Item 1 — the deletion test's blind spot, half closed

The owner's concern was that the test proves a deleted reading is gone by asking
the store whether it is gone. `COR-03` already reads `store.backend`, one layer
below the store's own report, so it does not take the store's word for it.

**What is still missing:** it runs against the memory backend. The real one is
IndexedDB, and a backend that reports a delete correctly while IndexedDB does
not would still pass. The honest closure is a browser check that deletes a
reading, hard-reloads, and confirms it is still gone — which is also the
reefkeeper's own rule ("a thing is only gone when it is still gone after a
reload"). Not built.

### Target ranges for parameters other than alkalinity

Owner finding 18 asked for a two-handled bar and said, in the same breath, that
the three width thresholds are his, for alkalinity, in dKH, and do not transfer.
The bar is built and it refuses to grade any parameter it has not been told the
thresholds for. The other seven parameters still use the older editor in their
own sheet.

**This is an owner decision, not an omission:** generalising the thresholds
needs figures for calcium, magnesium and the nutrients that nobody has stated.

### Two things the owner should know were judgement calls

**The delivered dose is not locked** (finding 16 said locking applies to the
whole of Setup). It is the one field designed to be used repeatedly, and it
already answers the question locking exists to answer — a toast, an entry in the
history beneath it, and the dose-change moment. Say the word and it will lock
like the rest.

**"How close is close" is not stated** in the potency box's new sentence. The
owner's wording said the estimate was "close to" the figure entered. How close
is close enough is a threshold, thresholds about strength are the canon's, and
there is none — so both numbers are stated side by side and the keeper judges
the gap himself.

---

## Answered by measurement, where the brief demanded it

**Item 3 — the water-change markers are REAL.** Imported a V1 backup shaped like
the owner's and counted what the import wrote: 25 `WATER_CHANGE` events. They
are not invented and they are not another kind mislabelled. They came from his
own V1 backup, where V1 seeded them on first run — which is why he never logged
one.

Why they appeared nowhere else: the calendar folded a water change into a day
that already had a task completion on it, and did nothing where there was none.
None of his 25 has a matching completion, so every one was skipped, while the
charts read the ledger directly and drew all 25.

**Item 4 — the calendar was not the problem.** It walks back month by month and
holds the whole record; six months of it, measured. The reminders panel was what
he was reading: 14 days by default, nothing past 30.

**Item 26/28 — the assessment never stopped recomputing.** Canon groups
measurements taken within thirty minutes into one test and resolves it to the
median. The words came from that resolved observation and were right; the
numbers came from the ledger's last row and were a measurement. Two sources on
one card.

**Item 9 — the calendar's trash deleted a tick.** Not a reading. One surface
read ticks and noticed; five read readings and had nothing to notice.

---

## The unimpressed reefkeeper

He was run on this round's work before the pull request was opened, as the owner
asked, with the app running in a browser he could drive and a written summary of
what was in the tank's data. **Twenty-three findings.** What follows is all of
them, with what happened to each.

### Fixed

| # | What he found | What changed |
|---|---|---|
| 1 | Tapping any parameter card on a tank with no readings took the whole application down | **Mine**, introduced with the fix for finding 25: `latestShown` was lifted out of the guard that exists for the empty case. Put back, and `EP-13` now covers the empty branch |
| 2 | Set the tank up, save 77 L, import history — and the volume is gone, silently | The import wrote its planned volume unconditionally, and an absence written over a number is a deletion. An import may ADD what the record lacks; it may not remove what is there (`IMP-44`) |
| 3 | The parameter sheet's Latest/Min/Max/Median and its in-range count described raw measurements while the chart above them described tests | Both read the one resolved set now — the sheet describes the very array the chart is drawn from (`EP-14`) |
| 4 | The median of an even number of measurements was the lower of the two middle ones | It is their average. `middleValue` in `present/spread.js` |
| 5 | A negative solution strength was shown as an observation | Suppressed. A strength below zero is not a thing a bottle can have |
| 6 | Blockers the keeper could actually clear were listed among things he could not | `KEEPER_CAN_ACT` splits them |
| 7 | "The readings used" counted test runs and called them readings | It counts tests; it says tests, and says why the number can be smaller than his list |
| 8 | "The full result is in the developer view at the foot of this screen" — there is no developer view | Three further sentences named the same imaginary surface and were never rendered at all. `STR-11` refuses any sentence that names a screen the application does not have |
| 9 | Water changes showed `undefined` litres, and a task read `t-skimmer` | A key mismatch the round exposed by making water changes visible at all; and the raw task id where a name should be |
| 10 | The Test tab's own row printed the ledger's last measurement | `shownReading` asks the episode index what that reading resolved to. Same for the Dosing tab's "Measured … at 09:07" line, which took its instant from the ledger's last row while the figure above it came from the test (`EP-15`) |
| 11 | The confirmation popup's headline figure counted through readings from weeks ago for four and a half seconds | A line moving is a drawing; a number moving is a claim. The dot still travels (`VP-11`) |
| 12 | The two range handles could coincide and strand each other against the ceiling | The handle with room to move is the one on top (`SC-11`) |
| 13 | "Saved." over empty required fields | It refuses to say it |
| 14 | "dosing is matching consumption" beside two boxes plainly showing a difference | The engine's margin is still the verdict; where he can SEE the gap, the gap is named (`DOS-12`) |
| 16 | The tab went on offering a dose he had already set, so he set it again and the history recorded a change from 9.0 to 9.0 | `alreadyAtDose`, beside the rule that decides whether a saved dose was the recommendation (`DD-15`) |
| 17 | The baseline of his whole imported history was stamped today | The import seeded "what was running" from the LATEST row on record — a figure he had typed minutes earlier — so the oldest change in his history was a move away from a number that did not exist when it happened (`IMP-45`) |
| 19 | A card with no readings said nothing about having none | `card.status.noReadings` |
| 21 | Fifty-four controls under 44px across five surfaces, on an app used one-handed with wet fingers | Measured in a browser by `tools/app/check-touch.mjs`, fixed, and the floor set in the two places every screen is built from (`VP-10`) |
| 22 | `9.10dKH`, `0.30dKH spread`, `target range 8.60–9.20dKH` | The same app spells `9.10 dKH` correctly in a dozen sentences: the decision lived in the sentences and the markup never learned it. One owner now (`SC-12`) |

Two more, found in a screenshot rather than by him, while verifying his:

- the blocker's sentences were joined with nothing — "…can carry one.Nothing is
  wrong…";
- three template literals ran a figure into its unit through a spelling the
  first version of `SC-12` did not cover. The check was widened before the fix
  was kept.

### To the owner, not settled here

The brief named three kinds of finding that come to the owner rather than being
decided: anything touching chemistry or the canon, anything he flagged as "was
this decided?", and anything where he gave two options rather than one answer.
These are those.

**15 — no warning on a large jump.** He expected the app to say something when a
recommended dose moves a long way in one step. How far is a long way is a
threshold about alkalinity, thresholds about alkalinity are canon's, and there
is none. The engine already caps a step (`MAINTENANCE_STEP_CAP_APPLIED`) and the
app states when it has; what he is asking for is a second, larger figure that
nobody has stated.

**18 — no way to record a water change.** True: they arrive by import and are
drawn on the chart, and there is no form. Whether this build should grow one is
a scope decision, not a defect — and a water change entered by hand becomes an
input the engine reads through a segment boundary, so it is not a small form.

**23 — "Tight control" on a 0.10 dKH range.** The three width thresholds are the
owner's own, stated by him for alkalinity in dKH, and 0.10 falls in the tightest
band by his own rule. The reefkeeper's point is that a 0.10 range is one nobody
sets on purpose — it is what you get by dragging two handles together. That is a
FOURTH threshold ("below this, you have not set a range"), and it is his to
state.

**20 — the register.** He wrote out a table of wordings he would accept in place
of "the app", "the engine" and "we". It is the same sweep already recorded below
as the largest thing left open: roughly 180 sentences. His table is the missing
half of it — the register stated once — and it should govern that pass rather
than be spent in a tail-end sweep. **Not done. It is the next round's first
commit, and it now has a specification.**

---

## What `jake` found in this round's own wording

Nine sentences went to him — everything new or rewritten this round. He kept
three and rewrote six, and three of the rewrites were defects rather than taste:

**`dosing.boxes.diff.matchingSubGap` shipped with the bug it was written to
fix.** It rendered `0.070 apart` under a box headed "The difference", between
two boxes reading `0.420 dKH/day` and `0.350 dKH/day` — a bare number, where its
two siblings six lines above print the unit. That string exists because of a
figures-and-units contradiction. `STR-12` now checks the family it happened in.

**`reason.fallback` stopped naming a screen and went on naming the software.**
"The engine gave a reason this build has no plain-English wording for" — two
software references in eleven words, on the sentence whose whole defect was
talking about itself.

**`dosing.reco.fresh.body` had the register violation sitting beside the fix.**
"tell the app what your pump is set to" — the exact sentence shape the
reefkeeper quotes as a shipped failure. Changing "readings" to "tests" had read
straight past it.

He also found three things outside the nine he was given, each of which
cancelled a fix inside them:

- **The dashboard notice still counted raw measurements** while the Dosing tab
  counted tests — and the Dosing tab's own comment claimed to be the last
  surface that did. Latent, because only the headline renders there. Latent is
  not fixed.
- **`dosing.working.movement.drawnFrom` printed the test count and called them
  readings**, one paragraph above the sentence that had just been corrected to
  say tests. Same panel, same number, two nouns.
- **`group.median` was false half the time.** "The middle value is the one used,
  NOT THE AVERAGE" holds for three runs. On two there is no middle one, and
  `OI-MEDIAN-001` settles it: the two central values are averaged.
  `engine/alk_v2/kernel.py` says so in as many words. So on every duplicate the
  figure used IS the average and the tooltip explaining it denied it. `EP-16`
  reads the rule out of the engine rather than restating it.

He also noted that `.claude/agents/jake.md` defines a findings-triage agent and
**states no copy register at all**, while `app/src/lib/format.js` cites "jake's
rule for this tab" in a comment. The register he was reviewed against is the
reefkeeper's. **That file should say what jake is for** — recorded, not fixed.

---

## The conformance gate

**RED, unchanged.** Baseline taken before any work: 31 fixture failures, 5 check
failures, 8 invariant failures, reporting `NO ENGINE SUPPLIED` because it is run
without the `--engine` argument. This round changed none of those counts, and
none of this round's work touched the engine.

The application suite is the gate this round moved: **275 checks green, 304
mutations defined and every one caught.** Three browser checks stand behind the
things a source scan cannot see:

    node tools/app/check-viewport.mjs     the bar, the sheets, the close control
    node tools/app/check-touch.mjs        every control, measured against 44px
    node tools/app/check-offline.mjs      the shell, with the network off

### A hole in the harness, found by the arm itself

`AM-R55` named `IMP-40` and stayed green through a mutation that plainly broke
the check written for it. There were TWO tests called `IMP-40` — the one written
for the defect, and one about reminder counts written months earlier. The runner
keys results by identifier, so the second silently overwrote the first, and
every question asked about that name was answered about the wrong test.
`META-01` would have counted the id as covered, too.

`META-03` refuses duplicates now. Worth saying plainly: **the duplicate PASSED**.
Had the reminders test been the one failing, the volume test's green would have
hidden it.
