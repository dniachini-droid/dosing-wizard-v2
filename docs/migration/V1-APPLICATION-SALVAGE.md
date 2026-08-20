# V1 Application Salvage — surfaces, interactions, features and tooling

Complete inventory and disposition of the V1 (`dniachini-droid/tank-wizard`)
**application** estate: every screen, flow, animation, reusable component, named visual
idea and reusable piece of tooling, with a disposition and a one-line reason.

This is the companion to `docs/process/V1-AGENT-SALVAGE-AUDIT.md`, which covered the V1
agent and routine estate. Between them the two documents complete the V1 salvage
inventory that `ROADMAP.md` Phase 0 requires.

---

## Provenance

| | |
|---|---|
| V1 repository | `dniachini-droid/tank-wizard` |
| V1 commit read | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 branch | `claude/v1-salvage-reconnaissance-6rgcl1` (identical to `main` at that commit) |
| V2 base | `7aaadef02e15cf39d80e602fa5c0fa228d6eec09` |
| Access | read-only. No V1 file was modified. |

**Where the source material actually is, stated plainly.** The V1 salvage reconnaissance
produced a full report. That report was **never committed to the V1 repository** — the
reconnaissance brief (`docs/v2/CLAUDE-CODE-V1-SALVAGE-INVENTORY-BRIEF-UPDATED.md`,
present at `9276a2c`) forbade changing files, so the report was delivered as a document
rather than a commit. Branch `claude/v1-salvage-reconnaissance-6rgcl1` therefore contains
the brief and not the findings.

This document is written from the reconnaissance report together with a first-hand read
of the V1 tree at `9276a2c`. Where a claim below is checkable in V1 source it was checked
against V1 source, not taken from the report.

---

## What this document is for

`PROJECT-STATE.md` recorded the V1 application salvage inventory as *deliberately
uncreated*, pending a report held outside the repository. That gap has a measured cost:
the build-one screen set (PR #6) was designed without it and omits substantial V1
surfaces the owner considers essential. **Section 12 lists exactly what.**

Someone designing a V2 screen set should be able to read this document and know what
existed, what worked, what was tangled, and what to leave behind.

---

## A deliberate omission — the contamination rule

**This document does not reproduce V1 numeric chemistry values**, following the
precedent set by `docs/process/V1-AGENT-SALVAGE-AUDIT.md`.

Where a V1 screen displayed or computed a chemistry figure, this document names **what
kind** of figure it was and **where in V1 it lives**. It does not copy the value. A
number sitting in a V2 repository acquires unearned authority regardless of the caption
above it.

Chemistry authority is `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` and nothing else.
Nothing in this document may be cited to justify a threshold, band edge, rail, cadence,
evidence minimum or dosing equation.

V1 figures that must be recorded so their *existence* is not lost are in
`docs/migration/UNMIGRATED-V1-CANON.md`, marked as what V1 decided and classified
`REVALIDATE_SCIENTIFICALLY`.

---

## Disposition vocabulary

Two vocabularies are used, because the reconnaissance used two and collapsing them loses
information. The first applies to code and tooling; the second to visual and interaction
work.

### Code and tooling

| Disposition | Meaning |
|---|---|
| `PORT_AS_IS` | Copy into V2 unchanged. Reserved for self-contained code with no V1 domain coupling. |
| `PORT_WITH_CLEANUP` | Copy, with V1-specific references, imports and assumptions removed. |
| `REBUILD_THE_IDEA` | The responsibility is worth having; the artefact is rewritten for V2. |
| `REFERENCE_ONLY` | Do not bring across. Worth consulting at the relevant stage. |
| `LEAVE_BEHIND` | Not reusable, and nothing distinctive is lost. |

### Visual and interaction work

| Disposition | Meaning |
|---|---|
| `VISUAL_IDEA_WORTH_REUSING` | The interaction or presentation idea should survive; the implementation need not. |
| `GENERIC_COMPONENT_SAFE_TO_PORT` | Self-contained presentation code with no chemistry coupling. |
| `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER` | The component computes chemistry, a verdict, a retest date or recommendation state. Rebuild against V2 structured output. |
| `LEAVE_BEHIND` | Not worth carrying. |

**A note on why so little is `PORT_AS_IS`.** V1's surfaces are mostly entangled with V1's
chemistry. Sixteen position classifiers and four dose engines were spread across
components, and canon `X-INV-004` (one analytical owner) plus `DEC-003` forbid a V2 UI
component recomputing chemistry. Almost every analytical surface is therefore
`TANGLED_..._REBUILD_LATER` — the **idea** crosses over, the code does not.

---

## 1. Navigation and application shell

V1 shipped six tabs (`src/lib/constants.js`, `NAV`): Dashboard, Test Lab, Dosing,
Insights, Tasks, Setup.

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| Six-tab structure | `src/lib/constants.js` | `REFERENCE_ONLY` | V2's first runtime is alkalinity-only with Ca/Mg measurement-only (canon `X-002`); the tab set will differ. Useful as evidence of what a working reef app needed. |
| Per-tab error boundary | `src/components/ErrorBoundary.jsx` (`TabErrorBoundary`) | `PORT_WITH_CLEANUP` | "A crash in one tab used to render nothing at all: a blank page with no clue what happened." It catches, names the fault, and leaves navigation working. |
| Launch animation | `src/components/LaunchAnimation.jsx` (327 lines) | `LEAVE_BEHIND` | A reef scene that plays once per session. 327 lines of bundle for no product function. |

---

## 2. Tasks, reminders and the maintenance calendar

**This is the strongest generic asset in the V1 application and the largest omission from
PR #6.** It has no chemistry coupling at all.

### 2.1 The scheduling model — `src/lib/reminders.js`

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **Completion-anchored scheduling** | `reminders.js` | `PORT_WITH_CLEANUP` | A reminder is due a fixed interval after it was last **completed**, not after it was last **due** — "so being behind never compounds into a backlog that can't be cleared." Generic, correct, with the reasoning in the file. |
| **Auto-completion — logging the test *is* the completion** | `reminders.js:126` (`autoCompletions`) | `PORT_AS_IS` (concept) | "There is no separate tick to remember, because the act of recording the reading is the completion." Removes an entire class of friction. Verified live: all 13 task-log entries in the owner's export carry `auto: true`. |
| **`adjustDays` — a nudge moves only the next occurrence** | `reminders.js:66` | `PORT_WITH_CLEANUP` | "So a nudge never permanently skews the rhythm." The one after it is still scheduled from the actual completion. |
| **`dueOverride` / `dueReason` — the protocol pin** | `reminders.js:63` | `REBUILD_THE_IDEA` | After a dose change the next test is pinned to a specific day and cleared when the test is logged. **The idea is right and V2 needs it — but in V2 the retest date is the engine's**, owned by the Retest Scheduler in canon Part II and the Alk retest rules. Do not port the wiring; consume the engine's output. |
| **One model for tests and husbandry** | `REMINDER_SEED`, `src/components/Tasks.jsx:52` | `PORT_WITH_CLEANUP` | Water change, media replacement, ICP sample, custom chores and per-parameter tests are all reminders, so they share scheduling, snoozing, calendar and history. Chosen explicitly "rather than a second parallel system". |
| **`projectOccurrences` — forward projection to a horizon** | `reminders.js:82` | `PORT_AS_IS` | Pure, guarded, projection-only: completing early or late reschedules everything after it. |
| **`computeReminders` — overdue / due-today / upcoming / later / recent** | `reminders.js:96` | `PORT_WITH_CLEANUP` | Sound bucket vocabulary; "most recent completion per reminder only — a new completion replaces the previous one rather than stacking up." |
| **`intervalLabel`** | `reminders.js:40` | `PORT_AS_IS` | "42 days reads better as 6 weeks." |

**A V2 caution on this section.** V1's reminder intervals are per-parameter test cadences.
Those cadences are chemistry and are canon's. Port the *scheduling machinery*; take the
*intervals* from canon.

### 2.2 The calendar and task surfaces

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **Month calendar with per-day indicators** | `src/lib/backup.jsx:629` (`CompletionCalendar`) | `REBUILD_THE_IDEA` | Monday-start month grid; each day carries **completed** items and **scheduled** items separately; a month header counting "N completed · M scheduled"; previous/next month; tap a day for its detail. Water-change volume is folded into the completion row so the detail reads "Water change · 10L" rather than just naming the task. "So the month reads as a plan and not only a record." |
| **Calendar modal** | `backup.jsx:806` (`CalendarModal`) | `REBUILD_THE_IDEA` | The calendar reachable from elsewhere, not only from its own tab. |
| **Shared reschedule sheet** | `backup.jsx:498` (`ReminderSheet`) | `VISUAL_IDEA_WORTH_REUSING` | **One sheet, shared by the calendar and the reminder list**, "so a task can be moved from wherever you happen to be looking at it." Set due date, set interval, complete, skip. |
| **Reminder row** | `backup.jsx:434` (`ReminderRow`) | `GENERIC_COMPONENT_SAFE_TO_PORT` | Label, state, next-due phrasing, complete and reschedule affordances. |
| **Tasks screen** | `src/components/Tasks.jsx` (206 lines) | `REBUILD_THE_IDEA` | Grouped as "Test schedule" and "Husbandry & maintenance" (`REMINDER_GROUPS`), custom task creation with a days/weeks unit switch, water-change logging with a dilution preview, calendar underneath. |
| **Task completion moment** | `src/components/TaskCompletion.jsx` (`TaskDonePopup`) | `VISUAL_IDEA_WORTH_REUSING` | Shows the run of past completions **and the actual intervals between them, which are often not the interval that was set — "worth showing without comment."** Exemplary restraint: it shows the fact and offers no judgement. |
| **Today panel** | `src/components/TodayPanel.jsx` (`TodayPanel`, `TodayRow`) | `REBUILD_THE_IDEA` | Shows only what is overdue or due now, and **disappears entirely when there is nothing to do, so its presence alone means something needs attention.** |
| **Inline log from a due reminder** | `TodayPanel.jsx:20` (`TodayRow`) | `PORT_AS_IS` (concept) | A due test row takes the reading **in the row**: "going to another tab to type one number was the most repeated friction in the app." The single best interaction decision in V1. |
| **Reminders panel with window control** | `TodayPanel.jsx:162` (`RemindersPanel`) | `GENERIC_COMPONENT_SAFE_TO_PORT` | Horizon selector over the overdue/due/upcoming buckets. |
| **Nudge button** | `TodayPanel.jsx:150` | `GENERIC_COMPONENT_SAFE_TO_PORT` | The `adjustDays` affordance. |
| **Snooze sheet** | `TodayPanel.jsx:450` (`SnoozeSheet`) | `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER` | Takes a chemistry claim and a parameter; hiding semantics are canon Part IX's in V2. |

**The open question V1 never answered, carried forward.** V1 decided Tasks was the *home*
for app-level notices and never decided the *design*: how a notice becomes a task, whether
it can be completed or only resolved by fixing the underlying thing, and how app-generated
entries sit beside the keeper's own reminders in one list. Recorded in
`docs/migration/V1-OPEN-OWNER-QUESTIONS.md`.

---

## 3. Measurement entry

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **Test Lab — every parameter on one screen** | `src/components/AllParametersSheet.jsx:17` (`TestLab`) | `PORT_WITH_CLEANUP` | "The old form had a dropdown, so recording six tests meant six round trips through a select." Every parameter is listed as a row: type the value, press Log, move on. One date for the sitting, since a testing session happens at one sitting. **A checklist, not a form.** |
| **Quick log from the parameter view** | `src/components/LogReadingSheet.jsx:14` (`QuickLog`) | `PORT_WITH_CLEANUP` | Log a reading while looking at that parameter's trend. Collapsed by default "so it never competes with the chart for attention". |
| **Inline log from a due reminder** | `TodayPanel.jsx:20` | `PORT_AS_IS` (concept) | See §2.2. Listed twice deliberately — it is both a task interaction and an entry route. |
| **Dose change entry with editable date *and time*** | `src/components/DoseChangeSheet.jsx` | `PORT_WITH_CLEANUP` | "Setting 10.3 mL at 9am and testing the next morning gives the tank a full day, while setting it at 9pm gives it twelve hours, and the engine measures from that moment." This is precisely canon `M-5` (dose-change effective time / late entry). The UX already exists and is correct. |
| **Time-of-day capture on readings** | `AllParametersSheet.jsx`, `LogReadingSheet.jsx` | `REBUILD_THE_IDEA` | V1 made time **optional** and defaulted absent times to midday for charting. **V2 forbids that** — see `docs/migration/V1-DATA-PROVENANCE.md`. V2 must capture time precision explicitly and carry it. |
| **ICP panel entry** | `src/components/IcpPanel.jsx` | `REBUILD_THE_IDEA` | Multi-element entry with a name-completion list, photo capture and compression, date and note. |
| **Reading confirmation / `readingVerdict`** | `src/components/ReadingConfirmation.jsx` (630 lines) | `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER` | `readingVerdict` is a chemistry classifier living in a UI component — the exact single-source violation `X-INV-004` forbids. It also carries V1's only ammonia branch, written before V1's ammonia canon existed and never reconciled with it. **Keep the moment; rebuild the reasoning.** |

---

## 4. The moments — animations and arrival experiences

V1 invested deliberately in the instant *after* an action. These are the parts a screen
set built from a data contract alone will not produce, and PR #6 has none of them.

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **The reading-arrival moment** | `ReadingConfirmation.jsx` (`LogResultPopup`, `SplashBurst`) + `src/components/ReadingContext.jsx` | `VISUAL_IDEA_WORTH_REUSING` | The new value is drawn onto its own recent history, so "a number alone doesn't say whether 9.3 is the highest in a fortnight or the middle of a steady run." The value counts up as the line draws to it. Tone is deliberately calm: "a reading outside its band gets a calm, useful line rather than an alarm, and one inside gets acknowledgement rather than confetti." |
| **One progress value drives chart, dot and counter** | `ReadingContext.jsx:26` (`readingGeometry`) | `GENERIC_COMPONENT_SAFE_TO_PORT` | Pure geometry, no chemistry. Written after a real defect: "three separate animations — a CSS dash, an SVG motion path and a JS timer — could never stay in step, which is why the dot ran ahead of its own line." |
| **The dose-expectation moment** | `src/components/DoseExpectation.jsx:17` (`DoseChangePopup`) | `VISUAL_IDEA_WORTH_REUSING` | "A dose change is a prediction as much as an action: it says the tank should move a certain way over a certain time. Stating that up front means the next test either confirms it or doesn't, rather than being read from scratch." Auto-dismiss with a hold-to-keep-open. **In V2 the prediction is the engine's immutable snapshot (canon `M-7`, `ALK-PREDICTION-SNAPSHOT-001`) — the moment renders it, never computes it.** |
| **The ICP arrival moment** | `src/components/IcpConfirmation.jsx` (`IcpResultPopup`) | `VISUAL_IDEA_WORTH_REUSING` | "A lab panel is the most information-dense thing entered into the app, and it arrived silently. This gives it a moment: the elements count in, the ones outside reference are named, and anything that moved since the last panel is shown with its direction." |
| **The task-completion moment** | `TaskCompletion.jsx` | `VISUAL_IDEA_WORTH_REUSING` | See §2.2. |
| **Toast** | `ReadingConfirmation.jsx:613` | `GENERIC_COMPONENT_SAFE_TO_PORT` | Plain, self-contained. |
| **Splash burst / launch animation** | `ReadingConfirmation.jsx:416`, `LaunchAnimation.jsx` | `LEAVE_BEHIND` | Decoration without function. The *arrival moment* above is the part worth keeping; the confetti is not. |

**Why these matter to V2 and not only to V1.** Canon Part IX governs what a card may
*claim*. It does not govern the experience of the claim arriving. That is presentation,
it is unowned, and V1 did it well.

---

## 5. Charts and history

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **`niceAxis`** | `src/components/ZoomableChart.jsx:16` | `PORT_AS_IS` | Axis-domain snapping to 1/2/5/10 steps, tick decimals derived from the step, no negative axis for a concentration, and **data values explicitly not snapped**. Every branch has its defect written beside it: `8.591999999999999` on the axis; a `-0.10` gridline on an all-zero trace element; a reading of 9.3 displayed as 9.5 because it was snapped to the nearest gridline. Solved problem, zero domain coupling. |
| **`ZoomableLineChart`** | `ZoomableChart.jsx` | `GENERIC_COMPONENT_SAFE_TO_PORT` | Pan/zoom over a line with reference bands and a reset. **One V1 defect to fix on the way across:** it never received or displayed a unit or a parameter name at any call site. |
| **`MicroSpark`** | `DoseExpectation.jsx:197` | `GENERIC_COMPONENT_SAFE_TO_PORT` | Inline sparkline for a tile. |
| **Event markers on the trend** | `Dashboard.jsx`, `WaterLog.jsx` (`chartEvents`) | `REBUILD_THE_IDEA` | Dose changes and water changes marked on the chart. In V2 the immutable event ledger (canon §9) is the natural source. |
| **All-graphs modal** | `AllParametersSheet.jsx:222` (`AllGraphsModal`) | `VISUAL_IDEA_WORTH_REUSING` | Every parameter's chart on one scrollable surface. |
| **Parameter history modal** | `Dashboard.jsx:198` (`ParamHistoryModal`) | `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER` | It takes findings, dose log, water changes and a dose, and renders a verdict. It was the origin of V1's rising-versus-falling contradiction: a card saying "alkalinity is rising" above a panel showing a negative weekly rate. |
| **Selectable-window steadiness panel** | V1 canon `wizard-states.md` §25.2; `Dashboard.jsx` | `REBUILD_THE_IDEA` | The panel grades **the window the keeper selected, and names it** — which stops a surface silently grading a different window from the engine. |
| **Recharts as the charting dependency** | `package.json` | `REFERENCE_ONLY` | Three runtime dependencies total, but the main bundle measured 288.5 kB gzip against a 180 kB budget, and Recharts is the bulk. V2 should choose deliberately rather than inherit. Architecture decision, not a salvage item. |

---

## 6. Setup and configuration

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **"Setup asks for facts, not judgements"** | V1 canon `wizard-states.md` §21 | `PORT_AS_IS` (as a principle) | Facts are what only the user knows and the app cannot default — net volume, solution strengths, which parameters are dosed. Judgements are opinions about how the app should behave — band widths, tolerances, cadences, notification thresholds — and the app has better answers than a new user. **"If a default is not good enough to ship unattended, the defect is in the default, not in the absence of a question."** |
| **The recorded rejection of a tolerance setting** | `wizard-states.md` §21 | `PORT_AS_IS` (as a recorded rejection) | Rejected on two independent grounds, the second being that one setting reaching into three separate arrival points creates "one input with three arrival points and no single owner" — the same shape as the defects that took two days to remove. Directly supports canon `MASTER RULE 1` and `X-INV-004`. |
| **Solution-strength provenance** | V1 backlog TW-061 (unbuilt) | `PORT_WITH_CLEANUP` | Mark whether a strength was typed by the user or written by an old default, and ask them to confirm the ones that were not. Serves canon `M-2` directly. |
| **Brand picker** | V1 backlog TW-062 (unbuilt) | `REBUILD_THE_IDEA` | Choose a product; it populates the strengths. Good idea; commits V2 to maintaining a product table. |
| **`Setup.jsx`** | `src/components/Setup.jsx` (931 lines) | `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER` | It imports the magnesium gate, a correction calculator, kit-noise figures and a settle-window function. V1's Setup contained a **fourth** correction calculator. |
| **The correction calculator's product conversions** | `src/lib/analytics/correction.js` (`CORRECTIONS`) | `REFERENCE_ONLY` | Dry-salt mass conversions per product. **Chemistry — figures are not reproduced here.** Canon `ALK-014` owns theoretical potency for the liquid path; the dry-salt conversions have no V2 owner. Recorded in `UNMIGRATED-V1-CANON.md`. |

---

## 7. Storage, durability, export and import

The cleanest layer in V1, and the least coupled to anything.

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **`idb.js`** | `src/lib/idb.js` | `PORT_AS_IS` | One database, one connection, one version constant, one `STORES` list, `onupgradeneeded` creating only what is missing, **and a written version history**. The reasoning is in the file: a second module opening the same database at its own version fails with `VersionError`, the photo store degrades, and photos fall back to inline localStorage permanently — "a quota regression caused by a change that never touched photos." |
| **`storage.js`** | `src/lib/storage.js` | `PORT_WITH_CLEANUP` | `loadKey`/`saveKey` over a host bridge with a localStorage fallback, quota-error detection, toast and error handlers. Carries a full post-mortem of a shim that silently halved the effective quota by writing every value twice. |
| **`photo-store.js`** | `src/lib/photo-store.js` | `PORT_WITH_CLEANUP` | Binary storage split **underneath** the key-value contract, so callers never know. Backup file format unchanged, no migration required. Measured rather than estimated: a capped JPEG expands to ~293k base64 characters, and twelve panels take ~3.5 M of a ~5 M quota (`scripts/measure-photo-footprint.mjs`). |
| **`install-witness.js`** | `src/lib/install-witness.js` | `PORT_WITH_CLEANUP` | Two independent wipe detectors — a witness record in IndexedDB, and the *shape* of a wipe (orphaned binaries, storage estimate) — **and an explicit statement of what neither survives**: "On a full clear this module returns `fresh` or `suspect` and the app says nothing it cannot support. That is the honest limit and it is not papered over." |
| **`auto-backup.js`** | `src/lib/auto-backup.js` | `PORT_WITH_CLEANUP` | Three durability tiers, each with its limits stated: a **snapshot ring** that is "an UNDO HISTORY, not a backup — it lives in the same origin as the data it copies and dies with it", and refuses a collapsed snapshot over a populated one; a File System Access handle that is **Chromium-only, therefore no iOS**; and a share sheet that is not automatic and cannot distinguish dismissal from success. Re-verify browser support at V2 build time. |
| **Backup / restore / merge** | `src/lib/backup.jsx` (`buildBackup`, `inspectBackup`, `restoreBackup`, `planMerge`, `rangeConflicts`, `NATURAL_KEYS`) | `REBUILD_THE_IDEA` | The merge model is right — **natural keys, never ids, because ids do not survive a round trip** (verified: zero id overlap between two consecutive exports). **But V1's restore silently overwrote target ranges and dropped same-day rows while reporting that nothing was lost** (V1 backlog TW-033, never fixed). Rebuild with that defect as the first test. |
| **CSV export** | `src/lib/export-csv.js` | `PORT_WITH_CLEANUP` | Note its own comment: one-off corrections were absent from the export entirely, "which made the export unable to answer the one question it exists for." |
| **Image compression** | `src/lib/image-compression.js` | `PORT_AS_IS` | Shrinks until the encoded result fits a byte budget rather than trusting one quality setting. |
| **Local-calendar date helpers** | `src/lib/dates.js` | `PORT_WITH_CLEANUP` | Written after a real bug: `toISOString()` returns UTC, so at 9am in Sydney the app believed "today" was yesterday and a reminder due today read as "in 1 day". **V2 must add absolute-instant handling alongside** — canon §2.2/§2.3A. |
| **Schema-version contract** | V1 canon `wizard-states.md` §18 | `PORT_AS_IS` | Every schema change requires a forward migration **plus a test that migrates a fixture from every previous version**; never destructively rewrite in place; on migration failure enter read-only and surface an export button — "it must never start empty and silent." **Written in V1 and never implemented** — the fixture directory does not exist. V2 should implement it on day one. |

---

## 8. Accessibility and the platform floor

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **The accessibility floor** | V1 canon `wizard-states.md` §18 | `PORT_AS_IS` | Touch targets ≥44 px; text contrast ≥4.5:1; every interactive element keyboard-reachable and labelled; numeric inputs carry the right `inputmode` — **"this app is used one-handed, wet-handed, standing at a tank."** The last clause is the requirement that generates all the others. |
| **Measured contrast work** | `src/lib/constants.js` | `PORT_WITH_CLEANUP` | An amber used as a tone became text in two surfaces at 2.69:1 — "a warning nobody can comfortably read is worse than no warning". Hues preserved, only lightness moved. Re-measure against V2's palette. |
| **Offline contract** | `wizard-states.md` §18 | `PORT_AS_IS` | Fully functional with no network on first paint after install; a service worker must never serve a half-updated asset set; a log entry created offline must survive a hard reload. |
| **Non-goals** | `wizard-states.md` §18 | `REFERENCE_ONLY` | V1: no accounts, no sync, no telemetry, no analytics, no ads, no cloud dependency. **V2's `PRODUCT-VISION.md` deliberately diverges** — accounts, sync and payments are planned. Recorded so the divergence is visible rather than accidental. |
| **`useEscape`** | `backup.jsx:484` | `PORT_AS_IS` | Correct modal dismissal in two lines. |

---

## 9. Reusable presentation primitives

All `GENERIC_COMPONENT_SAFE_TO_PORT`: `Btn`, `Field`, `SectionTitle`, `inputCls`
(`DoseExpectation.jsx`); `Card`, `DeleteButton` with confirmation (`ErrorBoundary.jsx`);
`StatusPill`, `ParamGauge` (`backup.jsx`); `InfoBlock`, `Stat` (`Insights.jsx`); `Toast`
(`ReadingConfirmation.jsx`).

**One caveat, and it is a V2 instruction rather than a V1 criticism.** They are scattered
across four files whose names describe something else entirely — a component's home file
says nothing about what it is. V2 should have a real primitives module.

Design tokens: `src/styles/base.css` and `src/styles/aurelia-skin.css` (510 lines
together) are `VISUAL_IDEA_WORTH_REUSING`. PR #6's `tokens.css` already establishes a
better-disciplined equivalent; V1's is worth reading for the palette reasoning only.

---

## 10. Surfaces that compute chemistry — rebuild, do not port

Every item here is `TANGLED_WITH_V1_DOMAIN_LOGIC_REBUILD_LATER`. Each computes a verdict,
a classification, a retest date, a dose figure or a recommendation state inside a
presentation component, which canon `X-INV-004` and `DEC-003` forbid in V2.

| Surface | V1 location |
|---|---|
| Dashboard and parameter tiles | `src/components/Dashboard.jsx` (696 lines) |
| Parameter history modal | `Dashboard.jsx:198` |
| Stability strip, briefing feed, score breakdown, overview card | `src/components/TodayPanel.jsx` |
| Dosing wizard, element cards, correction panel | `src/components/DosingWizard.jsx` (290 lines) |
| Alk assessment block | `src/components/ErrorBoundary.jsx:103` |
| Reading confirmation verdict | `src/components/ReadingConfirmation.jsx` |
| Insights | `src/components/Insights.jsx` (1,114 lines; imports fourteen analytics modules) |
| Setup's correction calculator and magnesium gate | `src/components/Setup.jsx` |
| Parameter card, finding list, parameter gauge | `DoseExpectation.jsx`, `backup.jsx` |

**What to salvage from them anyway.** Their *layouts* and *information hierarchy* are
evidence about what a reef keeper needs on screen. Read them for that. Do not read them
for what a number means.

### Explicitly `LEAVE_BEHIND`

The health score (nineteen constants collapsing to one number that a keeper could not
check against anything on screen) and its breakdown panel; `paramContext`; the dead
paragraph generator in `narrative-engine.js`; `buildHeadline`, the hand-composed
tank-level one-liner; the six invented headline categories in `reading-meaning.js`;
`original-artifact.html`, the 17,000-line single-file ancestor.

---

## 11. Reusable tooling

From the reconnaissance report's tooling sections. V1's **expected outputs** are never V2
expectations; the **scenario shapes and harness design** are the salvageable part.

| Item | V1 location | Disposition | Reason |
|---|---|---|---|
| **The input-sweep grid** | `tests/legacy-port/golden.js` | `REFERENCE_ONLY` | A pinned combinatorial grid over band offset, slope, reading count, dose-change present/absent and correction present/absent, generating 5,940 cases across three parameters. **The grid design and its tuning rationale are the asset** — the file records two occasions where a coarse grid made a threshold change invisible, and the axes were widened to straddle boundaries deliberately. V2 already has its own fixture estate under `docs/implementation/alk-v2/fixtures/`; this is a source of *scenario shapes*, not of expectations. |
| **Its two reproducibility fixes** | `golden.js` | `PORT_AS_IS` (as practice) | "Now" pinned to midday, because a run straddling 20:00 disagreed with itself; and absolute dates in generated text rewritten relative to today, because 29 of 5,940 rows changed overnight and failed the gate "on a tree nobody touched". Canon §64 requires deterministic replay; these are the two traps. |
| **The 5,940 recorded outputs** | `tests/legacy-port/golden.json`, `legacy/tests/golden.json` (5.1 MB each) | `REFERENCE_ONLY` | What V1 said, including wording V1's own canon later banned. Useful as a **wording**-regression corpus and as a difference-classification exercise, never as expectation. |
| **Its two structural blindnesses** | V1 backlog TW-063, TW-047 | `LEAVE_BEHIND` (as a warning) | The sweep fed each engine only its own parameter's readings, so it was blind to every cross-parameter rule; and its two-correction axis moved zero rows, so nothing gated on multiple corrections was visible. **V2's fixture design must not inherit either.** |
| **The long-run tank simulator** | `tests/legacy-port/sim/longrun.js` | `REBUILD_THE_IDEA` | A keeper-and-tank model: compounding demand, kit noise, per-parameter cadences, salt mix, consumption floored at zero, kit changes, neglect spells, water changes, dry-salt corrections. Canon §51.3 mandates long simulations; this is a reference implementation of the loop. |
| **The multi-year scenario matrix** | `tests/legacy-port/sim/years.js` | `REBUILD_THE_IDEA` | Growth rates × water-change regimes over three simulated years, multi-seed. It found two faults nothing else did. It also records where the app stopped being able to keep up and says so rather than lowering the bar — the register V2 wants. |
| **Deterministic RNG** | `tests/legacy-port/sim/rng.js` (11 lines) | `PORT_AS_IS` | mulberry32, replacing an LCG that "returned 299,999 of one element and 1 of another when picking from three, which quietly narrowed every sweep that used it." |
| **The verify gate** | `scripts/verify/run.mjs` | `PORT_WITH_CLEANUP` | Cheapest-first ordering, explicit blocking-versus-advisory, and three rules learned the hard way: every non-zero exit must reach the exit code; a piped checker's exit code must survive the pipe; **a check that cannot fail is worse than no check.** V2's PR gate (`.claude/skills/pr-gate/`) and PR #7's harness are the V2 home for this; the three rules are worth stating there. |
| **Mutation testing of the checkers** | `scripts/verify/mutate.mjs` | `PORT_AS_IS` (as practice) | Proves a checker can actually fail. PR #7 builds a mutation set on the same principle. |
| **Static checkers** | `scripts/verify/*.mjs` (17 files) | `REFERENCE_ONLY` | Generic JS/JSX/React analysis, several overlapping what a real linter and typechecker do — V1 never had either (its own backlog TW-024). V2 should choose tooling, not inherit checkers. |
| **Wording checker** | `scripts/verify/wordingcheck.mjs` | `REBUILD_THE_IDEA` | It covered one field of one loop in one function and checked for a claim without checking for its supporting figure — its own canon's first failure mode, unchecked. V1 canon `wizard-states.md` §23 specifies the seven checks it should have been; that specification is in `UNMIGRATED-V1-CANON.md`. |
| **Backlog-file checker** | `scripts/backlog.mjs` | `REFERENCE_ONLY` | Validates one-file-per-item structure, stdout-only "so there is no file to commit by accident". |
| **Canon-derived classification suites** | `src/test/spec/classification/` (9 files) | `REFERENCE_ONLY` | **Built from V1 canon alone, with every vector quoted and cited to its section**, and explicitly not taken from the app's behaviour: "the sixteen classifiers this function replaces are the reasoning being replaced, so a test that agreed with them would be inheriting it." That discipline is exactly V2's. The *method* is the salvage; every vector would need re-citing to V2 canon. |
| **Cross-surface parity tests** | `tests/parity/` (12 files) | `REFERENCE_ONLY` | Identical inputs driven through more than one real surface, compared on **returned values at stored precision, never rendered strings**. This is canon `X-INV-004` made testable. |
| **Defect regressions** | `src/test/defects/` (28 files) | `REFERENCE_ONLY` | One file per real defect, each narrating the defect and citing its spec anchor. The failure catalogue in executable form. |
| **The replay harness** | `.agent/real-history-replay.md` §10 | `REBUILD_THE_IDEA` | Replays a real export through the engine one reading at a time, diffing every step, with a clock fake and its proof. Canon §64 makes replay first-class. **Read `docs/migration/V1-DATA-PROVENANCE.md` before reusing its conclusions**: the run had no dose history for 334 of its 336 steps. |

---

## 12. What PR #6's eleven screens are missing

Measured against this inventory. PR #6 (`claude/build-one-mockups-65ojkb`, head
`112bd0ef3709bef4e4f192832e759bedc910640e`) contains eleven screens: `01-setup`,
`02-today` in five variants (a–e), `03-assessment-detail`, `04-log-entry`,
`05-entry-detail`, `06-history`, `07-settings`.

**This section is an inventory gap list, not a criticism of PR #6.** Those screens were
built from the data contract, the reason-code catalogue and canon Part IX, with this
document absent — its README says so explicitly. It also records twelve gaps of its own in
`mockups/CONTRACT-GAPS.md`, none of which duplicate what follows. **Nothing below is
resolved here.**

### 12.1 Missing entirely — no screen, no variant, no placeholder

**A. Tasks and the maintenance calendar.** The single largest omission. Absent:

- the reminder list, grouped into test schedule and husbandry;
- **completion-anchored scheduling** — due an interval after last *completed*, so being behind never compounds;
- **auto-completion** — logging a reading completes its test reminder, with no separate tick;
- the **month calendar** with per-day completed *and* scheduled indicators, a month header counting both, and a day detail;
- the **shared reschedule sheet**, reachable identically from the calendar and the list;
- **task completion showing actual versus set intervals**;
- custom task creation;
- husbandry logging (water change with volume, media replacement, ICP sample).

There is no Tasks screen and no calendar anywhere in the eleven. `07-settings.html` does
not cover it.

**B. The Test Lab checklist.** `04-log-entry.html` covers all nine event families as a
form — which is a genuine strength — but there is no **all-parameters-one-screen** entry
surface: the list of every parameter as a row, one date for the sitting, type-and-log down
the page. V1 built it because the dropdown-per-reading form was the friction that stopped
people logging. A nine-family event form is not a substitute for a test-session checklist.

**C. The inline log from a due reminder.** V1's most-used interaction: a due test is a row
that takes the reading in place. It depends on A existing.

**D. The reading-arrival moment.** No confirmation, no context sparkline, no arrival at
all. `05-entry-detail.html` is a record view — what an entry *is* — not what happens the
moment one is created.

**E. The dose-expectation moment.** `02-today-a-dose-change.html` recommends a change and
asks "Did you make the change?" — but there is no moment that **states the prediction** at
the time the change is recorded. In V2 that prediction is a real, immutable engine
artefact (canon `M-7`, `ALK-PREDICTION-SNAPSHOT-001`); PR #6 has the object and no surface
for it. This is the strongest case in the list, because the data already exists.

**F. The ICP panel flow.** No entry surface, no arrival moment, no reference-band display,
no photo capture. PR #6's own Gap 1 notes that `Reading.parameter` is a closed vocabulary
that cannot hold the extra parameters; ICP is a further and separate gap, since it is a
multi-element lab panel rather than a reading.

### 12.2 Present but thinner than V1

| Area | PR #6 | V1 had, additionally |
|---|---|---|
| History (`06-history.html`) | One chart per parameter, events marked, exclusions marked | Pan/zoom with reset; an all-graphs modal; tap-through from a chart point to its entry (PR #6 records this as its own Gap 7); a selectable window that the panel then *names* |
| Settings (`07-settings.html`) | Versioned settings with change history; read-only solution/potency panel | Solution-strength **provenance** — typed by the user or inherited from a default, with confirmation of the latter (canon `M-2`); export and backup controls; the hidden-notice list |
| Setup (`01-setup.html`) | Four steps, each naming what it refuses if skipped | The explicit facts-versus-judgements test as a stated design rule, and a recorded rejection of the tolerance-setting shape |
| Log entry (`04-log-entry.html`) | Nine event families, time precision on every form | Dose-change entry with editable effective date **and time**, presented as the thing the engine measures from |

### 12.3 Structural observations

- **Durability has no surface.** Backup, restore, snapshot ring, share sheet, wipe detection and the "it must never start empty and silent" migration-failure state are absent. V1's hardest-won engineering has no representation.
- **Offline and install state have no surface**, though the offline contract is inherited.
- **No error-boundary state.** V1 shipped a per-tab boundary after a crash rendered a blank page with working navigation nowhere.
- **The five Today variants cover engine states, not tank-keeping states.** They are five shapes of *recommendation*. Nothing covers "nothing is due, nothing is wrong, here is your month" — which is most days.

### 12.4 What this section is not

It does not say PR #6 should have built these. Six build-one screens plus five Today
variants is a coherent scope, and the missing areas are mostly outside the alkalinity
controller that build one is proving. **It says the screen set was chosen without an
inventory of what V1 had, and this is what that inventory contains.** Whether any of it
enters build one is an owner decision, recorded in
`docs/migration/V1-OPEN-OWNER-QUESTIONS.md` and not answered here.

---

## 13. Cross-references

- `docs/process/V1-AGENT-SALVAGE-AUDIT.md` — the agent and routine estate.
- `docs/migration/V1-DATA-PROVENANCE.md` — what the owner's historical records are, and what may be computed from them.
- `docs/migration/UNMIGRATED-V1-CANON.md` — V1 decisions with substantial reasoning and no V2 owner.
- `docs/migration/V1-OPEN-OWNER-QUESTIONS.md` — the questions this work surfaced and did not answer.
