# PORT OMISSIONS — what V1 showed that this build does not, and why

Companion to `docs/migration/PORT-MANIFEST.md`. The manifest accounts for every
line that changed in a file that crossed. This accounts for everything that did
not cross at all.

**This document is a required deliverable of the V1 interface port and is
written for the owner to read**, not for a reviewer to tick. Every entry says
what V1 showed, why it is not here, and what would be needed to bring it back.

## How to read it

Entries fall into four kinds, and the kind is what decides whether anything can
be done about it.

| Kind | Meaning |
|---|---|
| `BRIEF` | The brief for this port removed it deliberately. Nothing is blocked; it is listed so the removal is visible rather than assumed. |
| `NO ENGINE` | V2's engine does not produce what the element displayed. Restoring it needs engine work, and the entry says what. |
| `CHEMISTRY` | V1 computed it inside a presentation component. Canon `X-INV-004` and `DEC-003` forbid that in V2; the *idea* may return, through the engine. |
| `NOT BUILT` | Nothing forbids it. It was out of scope for this port and is a straightforward piece of work. |

Where an entry draws a line that could reasonably be drawn elsewhere, it says
so, so the owner can move it.

---

## 1. The line this port drew, and where it could be drawn differently

Two decisions shaped more of this list than anything else. Both are judgement
calls made against the brief's own rule — *"No V1 chemistry crosses. Not a
classifier, not a verdict, not a threshold, not a calculation, not a message
about what a reading means"* — and either could be moved by a sentence from the
owner.

### 1.1 The status word is withheld for seven of the eight parameters

The brief specifies a status word centred on each card's range bar: `IN RANGE`,
`ABOVE RANGE`, `BELOW RANGE`. It also says position "is always available from a
single reading and is always shown."

For **alkalinity** it is: the engine emits `position`, and the card renders it.

For **calcium, magnesium, nitrate, phosphate, salinity, pH and potassium**
there is no engine, so there is no position. Producing the word would mean
comparing the reading to the keeper's own range in the interface, which is
V1's `paramStatus` — the classifier this port exists to delete — under a
different name. So the word is not shown, and those cards read
`LOGGED · NOT ASSESSED` instead.

**To change this** the owner has two routes. Either say that comparing a
reading to *his own display range* is presentation rather than chemistry, in
which case one function in `app/src/present/position.js` produces the word for
every parameter and nothing else changes; or wait for the calcium and magnesium
engines, which produce it properly for two more of the eight.

### 1.2 But the in-range **count** is shown

The parameter detail sheet counts how many readings in a period fell inside the
keeper's range, and shows a percentage. That is the same comparison, applied to
history rather than to the latest reading.

The distinction drawn here, stated so it can be argued with: **counting a
record against a preference the keeper typed is his own arithmetic handed back
to him; telling him his tank is out of range is a claim about the tank.**
`app/src/store/config.js` already sanctions the first — the keeper's ranges
"govern nothing: they are drawn on his charts and stated in his history".

If the owner disagrees, `app/src/present/spread.js` is the only place it
happens and the count comes out in one edit.

---

## 2. Dashboard

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **The tank assessment score** — one number from nineteen constants, with a breakdown panel | `BRIEF` | Removed by the brief. The salvage inventory had already put it under `LEAVE_BEHIND`: a keeper "could not check it against anything on screen" | Nothing; it is a deliberate deletion |
| **The "N things to look at" list** | `BRIEF` | Removed by the brief | — |
| **The headline sentence** — the hand-composed tank-level one-liner | `BRIEF` + `NO ENGINE` | Removed by the brief, which records it as "a real feature that needs engine support that does not exist" | A tank-level summary output in the contract. `EngineResult` has none, and it would have to span parameters that have no engine |
| **The out-of-range alert strip** | `CHEMISTRY` | It called `paramStatus` over every parameter | Follows §1.1 |
| **The trend arrow on a card** | `CHEMISTRY` | V1 drew it when the change from the previous reading cleared `def.step`. That step is a noise floor, and a noise floor is canon's | Alkalinity's arrow works today, from the engine's `trajectory`. The others need their engines |
| **`StabilityStrip`** — the band with the observed spread drawn over it | `CHEMISTRY` | It graded a spread as settled or travelling | The spread itself is on the detail sheet, ungraded. The grading needs an owner in canon |
| **`SnoozeSheet`** — the "you have put this off three times" conversation | `NO ENGINE` | It took a chemistry claim and decided how long to hide it. Canon Part IX owns hiding semantics | Notices can still be hidden and restored, from Setup. The conversation about repeated snoozing is not built |
| **A due bar with nothing scheduled** | — | V1's own behaviour, ported exactly: the bar renders only when there is something due or upcoming. On a tank with no tasks at all there is nothing to show | Add a task and it appears |

---

## 3. The parameter detail sheet

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **The weekly-drift row** | `BRIEF` | Removed by the brief: "it is a trend claim and the engine owns trends" | The engine's `supportedTrajectory` is on the Dosing tab |
| **`computeControl`'s verdict** — a headline, a graded consistency, a pattern classification ("climbing", "settling"), two paragraphs of narrative, and a proposed replacement target range | `CHEMISTRY` | Every one of those is a statement about what the readings mean, decided in the component | The figures underneath survive, ungraded: spread, percentiles, median, in-range count |
| **The consumption and dosing block** | `BRIEF` | Moved to Dosing, where V2's engine says it | It is there now, in more detail than V1 had |
| **Per-parameter window sets** — V1 chose 7/30/90/All for frequently-tested parameters and 30/90/180/All for the rest, keyed on `def.freqDays` | `CHEMISTRY` | `freqDays` is a test cadence | One window set is used for every parameter. A cadence per parameter would have to come from canon |
| **Correcting or deleting a reading** | `NOT BUILT` | V1's `WaterLog` carried the edit and delete affordances and did not cross; V2's `screens/entrydetail.js` went with the V2 interface. **There is no way to fix a mistyped reading in this build.** | A correction sheet that calls `store.ledger.append` with `supersedes`. The store's rule — a correction may not improve a record's time provenance — already holds and is tested (`PORT-12`, `IMP-35`); only the surface is missing. **This is the most useful thing on this list.** |

---

## 4. The charts

V1's `ZoomableChart.jsx` and `niceAxis` are ported verbatim apart from one
named defect fix. Two notes about what that means.

| Point | Kind | Note |
|---|---|---|
| **"Open circles at each reading and a filled circle at the latest"** | — | The brief describes this; V1's source does not do it. V1 renders through **recharts**, with `dot={visible.length < 50}` and an `activeDot` — the marker styling is recharts' default, not a bespoke drawing. Porting the code verbatim means porting what it actually draws. Changing it is a small edit to one line of `ZoomableChart.jsx`, and it would be a difference from V1 rather than a port |
| **The value-and-date box that moves to the tapped point** | — | This is recharts' `Tooltip`, ported with its styling. It follows the touched point because that is what recharts does |
| **Event markers** | — | Ported. Dose changes carry their parameter so a calcium doser change does not mark the alkalinity chart; water changes, lighting changes and ICP panels mark everything |
| **Eligibility is not drawn** | `BRIEF` | Readings with no time are ordinary points on an ordinary line. One note beneath the chart says how many there are, once. No per-point marker, as the brief requires |

---

## 5. The moments

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **The reading moment's verdict** | `CHEMISTRY` | `readingVerdict` was 390 lines of chemistry classifier inside a UI component, and carried V1's only ammonia branch, never reconciled with V1's own ammonia canon | The moment renders what the engine returned. Where the engine has not answered yet — it runs in a worker and takes a moment — it acknowledges the save and claims nothing |
| **The dose moment's prediction** — "expect around 8.6 dKH when you next test", and the retest date | `NO ENGINE` at that instant | In V2 the prediction is `InterventionPredictionSnapshot` (canon `M-7`, `ALK-PREDICTION-SNAPSHOT-001`) and it is written **onto the dose-change event** and read back by the engine. It does not exist at the moment the confirmation appears. The retest date is the engine's too | Either run an assessment before showing the moment and render its `retest` and `predictionSnapshot` — a real option, costing a few seconds of Pyodide — or show the moment and update it when the answer lands |
| **The task moment's streak** — "3 times now · you do this about every 6 days" | `BRIEF` | Removed by the brief: "liked, but the engine does not produce it. Record it for later; do not synthesise it in the interface." The completions and their dates are all in the store, so this is arithmetic that is *available* and was told not to be done | One `useMemo` over `state.completions`, if the owner changes his mind |
| **The ICP arrival moment** | `BRIEF` | The brief names three moments — a reading, a dose change, a task — and this is not one | `IcpConfirmation.jsx` exists in V1 and is a clean port when wanted |
| **`SplashBurst`, `LaunchAnimation`** | `BRIEF` | "No emojis. No green tick, no confetti, no stars." Both were `LEAVE_BEHIND` in the salvage inventory anyway | — |

---

## 6. Test

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **ICP reference bands** — every element graph shaded against a lab's published range, with a sentence explaining the band | `CHEMISTRY` | Twenty-odd band edges for twenty-odd elements. The canon states none of them | A canon reissue covering ICP elements, or a decision that a cited lab range is display-only. `docs/research/` is where the citation would live first |
| **`ICP_GROUPS`** — elements ordered "the ones you manage first, contaminants last" | `CHEMISTRY` | The ordering is a judgement about which elements matter | Elements are listed as entered |
| **ICP photo capture** | `BRIEF` | "No file upload for now." V1's image compression and photo store went with it | `src/lib/image-compression.js` and `photo-store.js` in V1 are `PORT_AS_IS` / `PORT_WITH_CLEANUP` when wanted |
| **`Past results` list** | `BRIEF` | "V1's `Past results` list is not carried — the graph covers it" | — |

---

## 7. Dosing

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **A calcium dose figure and a magnesium dose figure** | `NO ENGINE` | Canon `X-002` makes this build alkalinity-only. V1 had four dose engines; none crossed | Ca and Mg engines. Their boxes are present and visibly not ready, as the brief requires |
| **The correction panel** — start, track and finish a temporary correction at three paces | `NOT BUILT` + `CHEMISTRY` | V1 computed the offer itself, in `proposeCorrection`. The brief records the correction calculator "for later, not built now" | A correction offer in `EngineResult`. Nothing in the contract carries one today |
| **The potency estimator** | — | **Not an omission — the opposite.** It was built, capability-gated, and had no screen anywhere. It has one now, per parameter, and states plainly that the learned figure is not what the dose is worked out from | — |

---

## 8. Tasks

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **The water-change dilution preview** — "that replaced 13.0% of your water; here is roughly where your levels should sit now" | `CHEMISTRY` | `predictAfterChange` is a dilution model computed in the component. It says what a reading will be | The engine is given the changed fraction and owns what a water change does |
| **A one-off addition for calcium or magnesium** | `NO ENGINE` | The form records alkalinity's only, and says so. `toEngineEvents` (`app/src/store/ledger.js:498`) sends **every** `MANUAL_CORRECTION` without a parameter, so a calcium one-off would arrive as an alkalinity one and confound a segment nothing touched. Offering it would create a wrong record rather than an incomplete one | A parameter filter on that branch, matching the one `isAlkalinityDose` already applies to dose events. **Recorded and left open** — it is a storage change, outside this port's scope |
| **Seeded test schedules** | — | Not V1's omission and not this port's: `app/src/store/schedule.js` ships no seeded interval because a test cadence is chemistry. A new install's Tasks screen starts empty and says why | — |

---

## 9. Setup

| What V1 showed | Kind | Why it is not here | To restore |
|---|---|---|---|
| **The expandable card pattern itself** | — | **The brief asks for "V1's expandable card pattern, ported". It is not in V1's source.** `src/components/Setup.jsx` at `9276a2c` is a flat list of plain `Card`s with no icon square, no category label and no expansion; `original-artifact.html`, V1's single-file ancestor, does not have it either. Both were searched. `SetupSection` in `app/src/components/Setup.jsx` is therefore written to the brief's description in V1's visual language, and is **deliberately absent from the port manifest**, because there is no V1 original to diff it against and listing it as a port would be the claim this whole exercise exists to stop | Nothing to restore. Recorded so the owner knows which parts of Setup are a port and which are a build |
| **The correction calculator** | `BRIEF` | Recorded for later by the brief, not built. V1 had four implementations of it and one lived in Setup | — |
| **The opening animation** | `BRIEF` | Out by the brief; `LEAVE_BEHIND` in the salvage inventory — "327 lines of bundle for no product function" | — |
| **Solution-strength provenance** (canon `M-2`) — marking whether a strength was typed by the keeper or inherited from a default, and asking him to confirm the ones that were not | `NOT BUILT` | V1 never built it either (its backlog TW-061). The salvage inventory dispositions it `PORT_WITH_CLEANUP` and notes it "serves canon `M-2` directly" | A flag on the configuration record and a confirmation prompt |
| **Restoring a V2 export** | `NOT BUILT` | Setup exports everything this device holds — every event, every stored assessment with its version stamps, the whole configuration history. **It cannot read one back.** The V1 import can | A reader for the export format. It is the same shape going in as coming out |
| **Backup durability** — the snapshot ring, the File System Access handle, the share sheet, wipe detection | `NOT BUILT` | V1's hardest-won engineering. `app/src/store/index.js` still holds the install witness; nothing surfaces it | `auto-backup.js` and `install-witness.js` in V1 are `PORT_WITH_CLEANUP`. Re-verify browser support first — the file handle is Chromium-only, therefore no iOS |

---

## 10. Things that were V2's and lost their surface

These are not V1 omissions. They are V2 features whose screens were deleted
with the rest of the V2 interface and which the five-tab brief has no place
for. They are listed because losing them silently would be worse than losing
them.

| What | Kind | State | To restore |
|---|---|---|---|
| **Test mode** — setting the assessment instant by hand, stepping it, and the marker pinned above every screen | `NOT BUILT` | The mechanism is intact and untouched: `app/src/store/mode.js`, the clock in `app/src/store/time.js`, and `TM-01`…`TM-25` all still run. **There is no way into it.** `TM-24` asserts exactly this rather than passing quietly | A section in Setup, and the marker in the shell. The brief puts test mode behind Settings rather than in the navigation, which is where it was |
| **Bulk entry from a pasted series** (`store/seed.js`) | `NOT BUILT` | Same: the module survives, the surface does not. Its "refused outside test mode" guard has nothing left to guard, which `TM-12` now records | Reachable from the test-mode section above |
| **Assessment history and replay** (V2's `screens/assessment.js`) | `NOT BUILT` | `assess.js`'s `replay()` is untouched — it re-runs a stored assessment against the configuration it named and reports whether the engine still agrees, distinguishing an engine upgrade from a canon reissue from a settings change. Nothing calls it | A list of stored assessments and a replay button. The hard part is done |
| **The offline shell** — the service worker | `NOT BUILT` | `app/sw.js` precached a file list that no longer exists, and was deleted rather than left registering a stale cache. **The app is no longer installable or offline-capable.** | The build now produces a hashed bundle, so the precache list has to be generated from it rather than written by hand. `vite-plugin-pwa`, which V1 used, is the obvious route |
| **The wipe / install-witness notice** | `NOT BUILT` | `store.witness()` is intact and honest about its own limits. Nothing renders it | A banner in the shell, as V1 had |

---

## 10a. What an independent test review found, and what happened to it

`test-engineer` reviewed this port's tests and found four things worth the
owner's attention. Two were defects in the build and are fixed; two are gaps
recorded below rather than closed.

**Fixed — a fabricated time on three forms.** `recordNote`,
`recordLightingChange` and `recordIcpPanel` wrote `stamp(date, "12:00")`: a
literal noon, stamped `EXACT_ABSOLUTE`, on forms that have a date box and no
time box. `DATA-PROVENANCE.md` §61 forbids it by name — "no defaulting an
unknown time to midnight, midday, or any other placeholder that would later be
read as a real timestamp" — and the ledger is append-only, so every one of
those would have been permanent and indistinguishable from a real instant.

It was a **regression this port introduced**: on `main` those same records went
through a time control that could say `DATE_ONLY`. They do again.

Worse than the defect was the test. `PORT-10`, the test named for the rule,
was green while the fabrication existed and **red when it was removed** — it
asserted that `record.js` must not call `dateOnly`, which forbade the fix. It
has been replaced by one that drives every recorder and reads what it wrote, so
no spelling of a default can pass it.

**Fixed — version stamps could be fabricated with the suite green.** `PORT-08`
handed the stamps in and asserted they came out: a pass-through that would have
stayed green if `assess.js` had never called the engine. It now runs the real
`runAssessment` against a stubbed transport reporting a sentinel. And
`replay()` — the function that implements canon §64 — had **no test that
called it at all**; `PORT-15` now drives its three conditions separately, so an
engine upgrade, a canon reissue and an unavailable configuration each name
themselves.

**Fixed — the manifest could not be checked against V1.** It recorded a hash it
had written itself, so reverse-apply proved internal consistency and nothing
more. Every entry now also records **V1's own git blob id**, which anyone can
verify in one command without trusting this document, and
`check-port-manifest.mjs --v1 <path>` does it for all 25.

**Fixed — the map was unbounded.** A file lifted from V1 and simply not entered
in `port-map.json` was invisible; the review demonstrated it. `META-02` now
requires every file under `app/src` to be either ported or declared V2's own.

**Fixed — the manifest check could sit red unnoticed.** It was an npm script
nothing called, and it was red across two commits during this run. It is the
first check `run-app-tests.mjs` performs.

---

## 11. Open items this port raises and does not resolve

Recorded and left open, as the brief instructs for findings outside its scope.

1. **`SHARED-LEGACY-TIME-001` versus the brief's logging rule.** The brief is
   explicit: "If a reading has no time, it silently is not used for trend or
   dosing. No notice, no list item, no explanation, no card ... The owner has
   325 such readings and each one must not announce itself." That is what this
   build does. Where it sits against the canon rule as drafted is **an open
   canon item**, not resolved here. Live entry raises no conflict at all — a
   form with a time box in it produces `EXACT_ABSOLUTE` — so the question is
   only about how loudly the imported records describe themselves.

2. **`toEngineEvents` does not filter `MANUAL_CORRECTION` by parameter.**
   Described in §8. A storage-layer defect, found by the port and not fixed by
   it.

3. **The Vite build does not produce a deployable offline artefact.** Described
   in §10. `npm run build` succeeds and `npm run dev` runs the app against the
   real engine; the service worker and the Pyodide vendor step are not wired
   into the built output.

4. **`tools/app/check-strings.py` covers less than its title claims, and now
   says so.** It walks `.js` files only. Before the port that was the whole
   application; after it, `.jsx` is V1's interface, which carries its own
   chrome text inline — "Reset", "Pinch to zoom · drag to pan · double-tap to
   reset", "Mark done". Extracting all of that would have made every line of
   every ported file a difference with no permitted reason, which is the
   opposite of a port.

   The check was **green before this was noticed, for the wrong reason**: it
   never looked at a `.jsx` file. Its header and its output now state the scope
   explicitly, so a green result cannot be read as more than it is. What covers
   the interface instead is `PORT-01`…`PORT-04` in `tests/app/test-port.mjs`,
   which say the thing that matters — no screen composes a sentence about what
   a reading means, because no screen holds the vocabulary to. Rewriting the
   checker's stated rule to match its real one is left open.

5. **`assess.js` reports an engine that cannot start as an unreadable record.**
   Found by the port, and not fixed by it. `runAssessment` reads the ledger, the
   configuration history and `describe()` — which is a call into the engine
   worker — inside one `Promise.all`, inside the try whose catch returns
   `STORAGE_UNAVAILABLE`. Its own comment says a storage failure "is not an
   engine failure and it is not an empty tank", and that is exactly what
   happens: a worker that cannot boot comes back labelled as a record that
   cannot be read.

   The consequence is the worst sentence this app can produce — telling the
   keeper his history is unreadable when it is intact — so the interface does
   not repeat it: the shell prefers the engine client's own state, which is the
   authority on whether the engine started. **The mislabelling in `assess.js`
   is still there** and is a one-line fix (move `describe()` out of that try),
   left open because it is storage-boundary code rather than interface.

6. **Twenty-three tests have no negative control, and they pre-date this
   port.** `META-01` now fails when a test has no mutation that turns it red,
   and the day it was written it found twenty-five. Two were this port's and
   have controls; the other twenty-three are on `origin/main` too — verified by
   running the same scan there. They are on an explicit, named exemption list
   in `tests/app/test-port.mjs` with the reason "pre-dates the port", and the
   list can only shrink: an exemption for a test that has since acquired a
   control fails the check.

   Writing twenty-three negative controls is real work and it is not this
   port's. It is recorded here so the number is visible rather than absorbed.

7. **A hunk's reason is a label, and only its sharpest case is checked.** The
   manifest counts reasons and, until this pass, never read the hunk — so a
   hunk that ADDED a threshold under a `chemistry removed` label would pass.
   Whether a hunk is chemistry is the judgement a reviewer is there for and
   cannot be automated; what is now checked is that no hunk reintroduces any of
   the twenty-eight V1 chemistry functions this port deleted, whatever reason
   it carries (`PORT-16`).

8. **The static source checks are stronger than they were and are still
   static.** The review walked nine realistic evasions through the first
   versions of `PORT-01`…`PORT-07` — an unquoted object key, a computed lookup,
   a classifier under a new name, a destructured `append`. Each of those is now
   closed and each has a negative control (`AM-P22`…`AM-P26`). But `PORT-01`'s
   arm is still a blocklist of V1's own twenty-eight names, and a chemistry
   function invented from scratch under a new name in a component would pass
   it. `PORT-04`'s shape rule — a bound compared against something that is not
   a bound — is the arm that does not depend on a name, and it is the one to
   extend if this is ever tightened further.

9. **Two development aids were retired rather than repaired.**
   `tools/app/check-moment-timings.py` verified that V2's re-created moment
   timings still matched V1's; the moments are now V1's own files and the port
   manifest accounts for every line of them, which is strictly stronger.
   `tools/app/smoke.mjs` served the no-build application to Chromium; `npm run
   dev` does that properly. Neither was a committed gate. Both now say what
   replaced them rather than failing on a deleted file.

10. **`app/index.html` still advertises the app as installable.** It carries
    the manifest link and `apple-mobile-web-app-capable`, and there is no
    service worker behind them. Smaller than the offline-shell debt in §10 and
    part of the same fix.
