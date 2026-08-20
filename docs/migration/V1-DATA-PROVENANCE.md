# V1 Historical Data Provenance — dataset by dataset

What each dataset in the owner's V1 records genuinely is, what is known about it, what is
missing, how it may be imported truthfully, and what V2 may compute from it.

This is a migration document. **It does not define chemistry behaviour** —
`docs/canon/` does. Where this document and the canon appear to conflict, the canon
governs.

---

## Relationship to `DATA-PROVENANCE.md`

`docs/migration/DATA-PROVENANCE.md` already states the **principles**: the four
independent properties (measurement truth, time precision, dose-context completeness,
analytical eligibility), the prohibition on fabricating times, the prohibition on
reconstructing dose history, and the eligibility test.

**This document does not restate them and does not amend them.** It supplies the
**dataset-level detail** underneath them — what was actually found in the V1 records,
per dataset, with counts and file locations.

One conflict between the two is recorded in §5 and is **not resolved here**.

---

## Provenance of this document

| | |
|---|---|
| V1 repository | `dniachini-droid/tank-wizard` |
| V1 commit read | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| Datasets examined | `fixtures/real-tank/dans-tank-backup-2026-08-09.json`, `fixtures/real-tank/dans-tank-backup-2026-08-12.json` |
| Access | read-only |

**These fixtures are a stale snapshot and are not the migration baseline.** The owner is
still using V1. `DATA-PROVENANCE.md` records that a fresh export at V2 cutover becomes the
live baseline. The value of these two files is that they show the **shape** of the data
and the **kind** of gaps it carries; those properties will survive into the fresh export.

---

## 1. THE OWNER CORRECTION — read this before anything else

> **The historical chemistry readings are the owner's real tank measurements.**

They were taken from the owner's tank. They are **not** fabricated, invented, synthetic or
seed data.

### What was wrong, and where

Two documents state otherwise. Both are corrected here.

**1. The V1 source comment is wrong.** `src/lib/seed-data.js` in V1 today contains only a
comment describing the readings it used to hold as *"~325 invented readings"* merged into
the user's own records. **That description is incorrect.** The module held the owner's own
measurements. What was true about it is narrower and different: the rows shipped in source
code with **no marker recording where they came from**.

**2. The V1 salvage reconnaissance report's §6.1 is wrong, and its conclusion is
withdrawn.** That report verified, correctly, that 325 rows in the owner's export are
byte-identical to the rows in the deleted `HISTORICAL_DATA` module. It then inferred from
the V1 comment that the data was fabricated, and concluded the history was "96.7%
synthetic". **The mechanical finding stands; the inference drawn from it does not.**

The byte-match established that the export rows and the module rows are the **same data**.
It never established **where that data came from**. The owner states the source.

### What this withdraws

Every conclusion in the reconnaissance report that depends on the readings being
fabricated is **withdrawn**:

| Withdrawn conclusion | Replaced by |
|---|---|
| "The fixtures are not, in the main, real tank data" | They are the owner's real measurements. |
| "The 2026-08-09 export contains zero genuine readings" | It contains 325 genuine readings. |
| "A replay over 96.7% synthetic data" | A replay over genuine readings with no dose history for 334 of its 336 steps. |
| "The six-month history cannot be imported as measurement evidence under any circumstances" | It is imported as history. Its analytical limits come from missing dose context, not from doubt about the readings. |
| "Readings — seeded: ineligible, permanently" | `USER_HISTORICAL`. History-eligible; evidence-ineligible for the reason in §3. |
| "Quarantine them in a `v1-synthetic` store no analytical path can read" | **Do not quarantine them.** They are genuine. |

### What is genuinely missing — and it is narrower

**The owner did not record the alkalinity and calcium dose changes that accompanied these
readings.** So the readings are true measurements with **no delivery history attached**.

That is the whole of the limitation. It is not a doubt about the numbers.

### The consequence, stated once and applied throughout

- **The readings are eligible as HISTORY.** They may be imported, stored, charted and shown.
- **They are NOT eligible as evidence** for consumption estimation, potency learning,
  trend-based dose recommendation, or any simulation or replay that requires knowing what
  was being dosed at the time. **Not because they are untrue, but because the dose history
  that would make them interpretable does not exist.**
- **This is exactly the condition V2's eligibility and provenance marks exist to express.**
  Mark them as *measurements without delivery context*. Do not mark them synthetic.

---

## 2. Dataset inventory

Counts are from the `2026-08-12` export unless stated.

### 2.1 Chemistry readings — 336 rows

- **What it is:** eight parameters over 2026-02-13 → 2026-08-12. Distribution: phosphate 101, alkalinity 82, magnesium 41, nitrate 41, calcium 40, pH 16, potassium 13, salinity 2.
- **Genuine?** **Yes — `USER_HISTORICAL`.** Owner-confirmed real measurements (§1).
- **What is known:** parameter, value, calendar date, an optional note. Eleven rows (2026-08-10 → 2026-08-12) also carry a time of day.
- **What is missing:** a time of day on **325 of 336**; no timezone anywhere; no test-kit identity; no repeat grouping; no validity state; and **no Alk/Ca dose-change history across almost the whole span** (§3).
- **How to import truthfully:** import every row as a genuine measurement with an explicit time-precision mark — `date` for 325, `time` for 11. **Assign no time to a date-only row** — not midday, not a default, not one inferred from a neighbour or from entry order. Carry a period-level mark recording that dose coverage is absent.
- **V2 eligibility:** **history, charts, reference and context — yes.** Consumption inference, potency learning, dose-response reconstruction, trend-based dose recommendation and historical controller replay — **no**, per §3.

**A note on the V1 delivery mechanism, since it caused the error.** These rows reached the
app by being shipped inside a source module and merged into the user's records with no
provenance marker. V1 later deleted them on the belief they were invented, and pinned that
belief with a regression test (`src/test/defects/seed-data.test.js`). **The rule that test
protects is right** — no module may ship rows that land in a user's record unmarked. **Its
characterisation of this particular data was wrong.** V2 should carry the rule and drop
the characterisation. Every stored row records its origin.

### 2.2 Dose log — 2 rows

- **What it is:** two maintenance-dose changes, 2026-08-10 (calcium) and 2026-08-11 (alkalinity), each with a time, an amount, an element and a note.
- **Genuine?** Yes.
- **What is known:** effective date and time, amount, element.
- **What is missing:** **everything before 2026-08-09.** The settings block is an end state, not a history — the 09-Aug export carries different daily-dose figures for alkalinity and calcium from the 12-Aug export, so at least two values changed inside three days with nothing recording the change.
- **How to import truthfully:** import as two events. **Do not synthesise the prior history.** Do not back-project from current settings.
- **V2 eligibility:** eligible as events. They anchor no useful potency or consumption work on their own.

> **This dataset, not the readings, is what limits the import.** Every analytical exclusion
> in §1 traces to this row and to nothing else.

### 2.3 Task log — 13 rows

- **What it is:** reminder completions from 2026-08-10 → 2026-08-12, every one flagged `auto: true` — i.e. generated by logging a reading, per the auto-completion behaviour in `docs/migration/V1-APPLICATION-SALVAGE.md` §2.1.
- **Genuine?** Yes — they record real completions.
- **What is missing:** no time of day; no manual completions; nothing before 2026-08-10.
- **How to import truthfully:** import as dated husbandry history.
- **V2 eligibility:** history only. Not analytical evidence.

### 2.4 Reminders — 11 rows

- **What it is:** the eleven built-in reminders, **with owner edits on top** — one test interval changed from 3 days to 7, and one carrying a manual due-date override with its reason.
- **Genuine?** The edits are the owner's; the defaults are the app's.
- **How to import truthfully:** import the **edited configuration**, not the seed defaults. Take test cadences from canon, not from these rows.
- **V2 eligibility:** configuration, not evidence.

### 2.5 Tank settings — 8 fields

- **What it is:** net volume, three daily dose figures, three solution-strength figures, a default water-change volume.
- **Genuine?** Yes.
- **What is missing:** **effective dating.** Values differ between the two exports three days apart with no history recording the change. **Provenance** — V1's own backlog (TW-061) exists because nobody knows which strengths the owner typed and which are inherited defaults. And whether the recorded volume is gross or net is unrecorded.
- **How to import truthfully:** import as **current** configuration, stamped `asOf` the export date, with **no backdating**. This is canon `M-12` (effective-dated configuration) and `M-2` (solution concentration context).
- **V2 eligibility:** current configuration only. **Not** a historical configuration series.

### 2.6 Custom target ranges — 4 parameters

- **What it is:** owner-set ranges for magnesium, calcium, nitrate and phosphate.
- **Genuine?** Yes — the owner set them.
- **What is missing:** effective dating. One range differs between the two exports three days apart.
- **How to import truthfully:** import as **current** target ranges. Canon `WG-ALK-065` forbids backfilling a legacy target range into historical replay.
- **V2 eligibility:** current configuration only.
- **Figures not reproduced here.** They are the owner's settings, not canon, and V2's ranges come from canon and from the owner's fresh configuration.

### 2.7 Active dosing plans — 2 records

- **What it is:** one alkalinity plan and one calcium plan, each recording an applied dose, an applied-at timestamp, a planned dose, a stage counter and a next-test date.
- **Genuine?** Yes.
- **What is missing:** **no prediction snapshot** — V1 stored no immutable record of what it predicted at the time. Canon `M-7` and `ALK-PREDICTION-SNAPSHOT-001` require one in V2.
- **One trap, recorded because a V1 document got it wrong first.** The calcium plan's planned-dose field holds a **dose in mL/day**, not a level change. A V1 routine read it as a ppm target. Any importer must not repeat that.
- **How to import truthfully:** import as two interventions **without** a prediction snapshot, since none exists.
- **V2 eligibility:** history only.

### 2.8 Dismissed-notice state — 22 entries

- **What it is:** hide-state for V1 findings.
- **What is missing / wrong:** **two incompatible formats live in one key** — flat `signature: date` pairs, and object-form entries with a nested payload. A schema changed shape without a migration.
- **How to import truthfully:** **do not import.** These are hide-state for V1 findings V2 will not have.
- **V2 eligibility:** none. Worth preserving as evidence of an unmigrated schema change — the failure mode the schema-version contract in `V1-APPLICATION-SALVAGE.md` §7 exists to prevent.

### 2.9 Record identity — a design constraint, not a dataset

Reading ids **do not survive an export/restore round trip**: zero id overlap between the
two consecutive exports, while the rows themselves match. **Any V2 importer must key on
natural keys — parameter, date, value — never on ids.**

---

## 3. Why the readings cannot carry the analysis

Stated once, because it is the load-bearing consequence.

V2's mass balance requires the **delivered maintenance input** over the interval between
two measurements (canon Part II segmentation, and the Alk consumption and potency rules).
For almost the whole 2026-02 → 2026-08 span that input is unknown.

Therefore, over that period:

- **consumption inference** — refuses;
- **potency learning** — refuses;
- **dose-response reconstruction** — refuses;
- **trend-based dose recommendation** — refuses;
- **historical controller replay** — refuses;
- **any reconstruction of what V2 would have recommended at the time** — refuses.

They refuse because a required input is absent, which is the ordinary behaviour of a
system that will not launder a gap into a number. **They do not refuse because the
readings are doubted.**

Two temptations are specifically forbidden, because they are the two an importer will
reach for first:

1. **A default time**, so that rows sort and interval arithmetic runs. That is a
   manufactured timestamp.
2. **A dose back-projected from the end-state settings**, so that consumption "works".
   That is manufactured delivery history.

`DATA-PROVENANCE.md` §2 and §3 already prohibit both. This section records what makes them
tempting.

---

## 4. What the replay evidence actually shows

V1's real-history replay ran the owner's export through V1's derivation one reading at a
time — 336 steps, zero engine errors.

**Its engineering findings stand.** They are facts about V1's engine: it did not crash, it
changed its notices on 206 of 336 steps, and its notice churn was measurable.

**Its chemistry-significant observations must be read with one qualifier attached.** The
run had **no dose history for 334 of its 336 steps**. What it observed is how V1's engine
reasoned *with the intervention history absent* — which is a real and useful finding about
V1's behaviour under missing data. It is not a controller judged against complete evidence,
and it is not a statement about the tank.

That qualifier replaces the reconnaissance report's original one, which was that the data
was synthetic. It was not.

---

## 5. Recorded conflict — NOT RESOLVED HERE

**`docs/migration/DATA-PROVENANCE.md` §1 lists historical water-change records, ICP
records and lighting records as *owner-confirmed genuine*, alongside the chemistry
readings.**

**The V1 salvage reconnaissance found those three datasets byte-identical to named V1
source constants**, and the owner's correction — which covers the chemistry readings
explicitly — **has not been extended to them.**

What the reconnaissance found, recorded as it found it:

| Dataset | Rows | What the reconnaissance found |
|---|---|---|
| Water changes | 25 | Byte-identical to `WATER_CHANGE_SEED` in `src/lib/analytics/water-changes.js`: consecutive weekly dates, one uniform volume, ids of the form `wc-<date>`. V1's own replay note says the seed "was built from Dan's practice", and that a replay "cannot tell 'Dan entered this' from 'the app seeded this'." |
| ICP panels | 2 | Dates and ids match the removed `ICP_SEED` constant in `src/lib/analytics/icp-data.js`. |
| Lighting note | 1 | Id matches the seed shape. |

**Both readings of this are live and neither is adopted here.** Either the owner entered
these records and the constants were built from them — which is what the water-change
comment suggests — or they are app-generated defaults. The distinction matters for whether
they may be treated as real events.

**One question to the owner closes all three.** It is recorded in
`docs/migration/V1-OPEN-OWNER-QUESTIONS.md` and answered nowhere.

Until it is answered, the honest status is `PROVENANCE_UNCONFIRMED`. **This document does
not amend `DATA-PROVENANCE.md`**; it records that the two disagree.

**Nothing downstream is blocked by the disagreement.** Water-change events matter to
alkalinity segmentation (canon `ALK-033`), but that path is already unavailable over this
period for the reason in §3, and the migration baseline is a fresh export at cutover in any
case.

---

## 6. Summary table

| Dataset | Rows | Provenance | History-eligible | Evidence-eligible |
|---|---|---|---|---|
| Chemistry readings, timed | 11 | `USER_HISTORICAL` | Yes | No — no dose context |
| Chemistry readings, date-only | 325 | `USER_HISTORICAL` | Yes | No — no dose context, no time |
| Dose log | 2 | Genuine | Yes | As events only |
| Task log | 13 | Genuine | Yes | No |
| Reminders | 11 | Owner-edited configuration | n/a | Configuration only |
| Tank settings | 8 fields | Genuine, undated | n/a | Current configuration only |
| Custom target ranges | 4 | Genuine, undated | n/a | Current configuration only |
| Active dosing plans | 2 | Genuine, no prediction snapshot | Yes | No |
| Water changes | 25 | `PROVENANCE_UNCONFIRMED` (§5) | Open | Open |
| ICP panels | 2 | `PROVENANCE_UNCONFIRMED` (§5) | Open | Open |
| Lighting note | 1 | `PROVENANCE_UNCONFIRMED` (§5) | Open | Open |
| Dismissed-notice state | 22 | Genuine, two incompatible formats | No — do not import | No |
