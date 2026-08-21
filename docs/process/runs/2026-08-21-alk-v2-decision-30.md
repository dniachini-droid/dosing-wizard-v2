# 2026-08-21 — Owner decision 30: a reading with no usable time is silently ineligible

Run type: attended canon work. **Canon-changing.**

Branch: `claude/readings-no-usable-time-nduh0f` · Base commit for this pass: `a335abc`

---

## What actually changed, in plain language

The owner has 325 readings with a date and no time. `SHARED-LEGACY-TIME-001` treated a
reading like that as a **blocking condition that must be announced**, and every screen built
against the canon faithfully reproduced the announcement. In one evening the same fact
appeared in five places: a timezone question in the import flow, a five-way provenance
selector in the reading form, one attention item per affected reading, a
`Not eligible for the trend` chart legend with dotted markers, and a red BLOCKING panel
reading *"A record carries a time that could not be read."* Each was removed at the surface
and each came back in the next build, because the canon said to announce it.

Owner decision 30 changes the rule instead. **A reading that lacks a usable instant is
silently ineligible for anything that needs elapsed time.** The engine does not use it and
says nothing about having declined to. It is kept in history, charted as an ordinary point
on an ordinary line, counted in descriptive statistics, and may still be the current value.
Where excluding it leaves too little evidence, the existing insufficiency rules say so —
*not enough separate tests yet*, *the tests do not yet cover enough days* — and that is the
whole message. The keeper is not told which records were skipped or why.

**This is a deliberate relaxation and it is recorded as one.** §2.3A was written to stop an
engine treating a fabricated instant as a real one, and it did that by making the absence of
an instant loud. That was the right instrument against fabrication and the wrong one against
ordinary legacy history: a keeper importing years of dated records has done nothing wrong,
has nothing to fix, and cannot act on the announcement. The prohibition on fabricating a
time is what the rule is for, and it is kept in full and in every word. The announcement was
scaffolding around it and is gone.

**Nothing about what the engine computes changed.** Only which observations are eligible,
and what is said about the ones that are not.

---

## The sweep, not a patch

Seven reason codes are retired. Five were found by reading the catalogue for anything whose
purpose is to say a record's time could not be read; two more — `TIME_PROVENANCE_EXACT` and
`TIME_PROVENANCE_RECONSTRUCTED` — announce the *converse*, and are retired because a
per-record channel that names the eligible records names the ineligible ones by omission.
Retiring only the negative half would have left any surface able to reconstruct exactly the
list the owner asked never to be produced.

| Retired | Group | What it announced |
|---|---|---|
| `TIME_PROVENANCE_DATE_ONLY` | `TIME_` | date known, time unknown; excluded from trend |
| `TIME_PROVENANCE_LOCAL_ZONE_UNKNOWN` | `TIME_` | local `HH:MM` with no proven offset |
| `TIME_PROVENANCE_EXACT` | `TIME_` | the converse: this record does carry a proven instant |
| `TIME_PROVENANCE_RECONSTRUCTED` | `TIME_` | the converse: offset proven, reconstruction recorded |
| `TIME_EXACT_ELAPSED_UNAVAILABLE` | `TIME_` | an elapsed calculation refused on these operands |
| `CAPABILITY_MEASUREMENT_TIME_IMPRECISE` | `CAPABILITY_` | `M-8` degrading on measurement-time precision |
| `CAPABILITY_ABSOLUTE_TIME_UNAVAILABLE` | `CAPABILITY_` | `M-13` degrading on absolute-time provenance |

One code is **narrowed and kept**: `VALIDATION_TIMESTAMP_INVALID` no longer fires on a record
whose declared provenance carries no instant *by contract*. It keeps its whole substance for
a record that claims a usable instant and cannot supply a readable one.

`TIME_EVENT_ORDER_AMBIGUOUS` is untouched. It is about two events sharing an instant, which
is a different condition from a record having none.

`M-8` and `M-13` remain rows in the capability set — `M-1` … `M-13` is closed, and a result
carrying eleven of thirteen would be an output that failed to mention what it did not look
at. Their outcome is now `OK`, with no affected outputs and no reason code, in every state.

---

## `AI-008`, resolved

The contradiction: `ALK-V2-DATA-CONTRACT.md:87` said a `DATE_ONLY` reading is usable as the
latest valid current value, while `measuredAt` was a required `Instant` and
`kernel.parse_instant` rejects any string with no offset. A sender had two options and both
were wrong — transmit the bare date and be told the timestamp is invalid, or fabricate an
instant, which §1 forbids absolutely.

The contract now declares `ObservedTime`, of which `Instant` is the narrowing to the two
provenances that carry an `absoluteInstant`. A `DATE_ONLY` reading carries `calendarDate`; a
`LOCAL_TIME_ZONE_UNKNOWN` reading carries `localDateTime`; **neither carries an
`absoluteInstant`**. Both contract statements hold together, because the shape the record is
sent in is the shape the contract declares for its provenance. A receiver finding no
`absoluteInstant` on a `DATE_ONLY` record has found the contract being honoured, and emits
nothing.

Position then needs an ordering across records that do and do not carry instants. Canon
§2.3A.2 states it, and it is the one rule this amendment had to write that the owner did not
dictate: **by calendar day; within a day a record carrying a usable instant is later than one
carrying none; between two untimed records on one day, by `eventOrdinal`.** The middle clause
is not a claim about the tank — it is the refusal to make one. A record with no time cannot
be *shown* to be later, and position is never decided by an assumption. It is flagged here so
the owner can overrule it.

---

## The keeper-stated timezone: assessed, and KEPT

The brief asks whether the import's device-offset assumption is still needed, on the
reasoning that if those readings are silently ineligible either way the assumption buys
nothing.

**It buys something, and the premise does not reach it.** The mechanism never touched the 325
date-only rows. `import-v1.js` `timeFor()` has exactly two branches: a row with no `time`
field gets `dateOnly(row.date)` and gains nothing, always; only a row carrying a local clock
time is given an offset. That is the **28 timed rows**, and no others.

For those 28 the assumption is not the difference between an announcement and a silence. It
is the difference between 28 real observations and none. One offset applied uniformly leaves
every elapsed interval *between* them exactly right, and elapsed interval is the only thing
the engine computes from these times. Remove it and those rows become
`LOCAL_TIME_ZONE_UNKNOWN`, silently ineligible, and the keeper loses trend evidence he
actually has — quietly, which is worse than losing it loudly.

What decision 30 does change is the mechanism's **standing**. Part of what made it attractive
was that the alternative was a wall of blocking notices; the amendment removes that pressure,
so it now has to stand on its own merits, and it does.

What decision 30 does **not** settle is whether `RECONSTRUCTED_WITH_PROVENANCE` may admit an
assumption at all — canon admits it when the offset is "independently proven **and** the
reconstruction is recorded", and an assumption is the second half without the first. That is
a canon-authority question about a different clause of the same rule. It is untouched and
**stays open**.

---

## What the gate says

| | Baseline `a335abc` | After |
|---|---|---|
| fixture failures | 11 | 11 |
| check failures | 5 | 5 |
| invariant failures | 3 | 3 |
| corpus problems | 0 | 0 |
| mutations | 80 defined, 69 caught, 0 missed, 11 blocked — GREEN | 84 defined, 73 caught, 0 missed, 11 blocked — GREEN |
| application suite | 165 checks, 0 failures — GREEN | 165 checks, 0 failures — GREEN |

The absolute verdict is RED before and after, for the reasons `PROJECT-STATE.md` already
accounts for. **The failing set is identical to the baseline's minus one line**:
`CHK-RC-CATALOGUE`'s `CAPABILITY_` coverage count, which had to be restated anyway because
two of its rows were retired, and which is now true. The `SAFETY_` half of that same
pre-existing defect is untouched and still fails.

Two invariants moved from *not executable* to *executed and passing*: `INV-I7` (no retired
reason code is emitted, anywhere in a result) and the new `INV-H6` (a record with no usable
instant never announces itself). Both derive every subject at run time and transcribe
nothing.

Four new engine mutations, all caught, each via the mechanism it named:

| | Sabotage | Caught via |
|---|---|---|
| `E-28` | restore the `M-8` / `M-13` degradation | `CAPABILITY_MEASUREMENT_TIME_IMPRECISE` emitted |
| `E-29` | report an honoured record as an unreadable timestamp | `VALIDATION_TIMESTAMP_INVALID` emitted |
| `E-30` | drop untimed readings from position | `position` `BELOW_RANGE` → `UNKNOWN` |
| `E-31` | give a date-only record an instant at midnight | `movementEvidence` `INSUFFICIENT` → `SUFFICIENT` |

### One harness defect the new fixtures exposed, and fixed

The echo oracle's event sort key tie-broke on **the event's position in the submitted
array** (`events.index(e)`). That made the oracle's own output depend on the array order
`INV-A1` exists to defeat. It had never shown, because no fixture until now contained two
events the key could not separate: `_sort_key` returns `inf` for an event with no
`measuredAt` or `effectiveAt`, so `AD-TIME-002`'s four untimed readings all landed on one
rank and the tie-break decided which was "latest". Reversing the array changed
`latestValidValueDkh`, and `INV-A1` went red at the oracle's own baseline — which in turn
made `M-1`, the control that *names* `INV-A1`, report NOT CAUGHT, because a subject already
failing cannot be turned red by a mutation.

Fixed on both halves: the tie-break is now a content hash, the same answer
`ledger._content_ordinal` reaches in the engine and for the same reason; and an event with
no usable instant sorts by the day it states, at the **end** of that day, so an instant
anywhere in that day sorts before it (canon §2.3A.2 clause 2) and a day-only record never
overtakes an instant on the following day. `M-1` and `E-11` are caught again — `E-11`'s
sabotage needed the third argument added to `position`, and it passes `untimed` through
unchanged so that it stays a control for *one* defect rather than two.

Worth stating plainly: **the negative control that was supposed to guard this was itself
disabled by the defect.** That is not an argument against the control; it is the argument
for running the whole mutation set on every pass rather than the four entries a change
appears to touch.

`E-31` is the answer to *"can a reading gain a fabricated time?"* — it is the one prohibition
decision 30 explicitly does not relax, and it is now pinned by a control that turns the gate
red. Midnight rather than noon deliberately: the forbidden list names both, and a control
that tries only noon passes an engine that assigns midnight.

The application suite is unchanged and GREEN: 165 checks, 0 failures.

---

## Recorded and left open

1. **`OI-EVENTNOINSTANT-001` (new, canon).** Decision 30 says what happens to a
   *measurement* with no usable instant. It says nothing about a dose change, correction,
   water change or delivery anomaly with one — and the provenance vocabulary is available to
   every event kind. The two readings differ by a whole recommendation. The engine's split is
   scoped to `READING` and every other kind is parsed exactly as before, which is the
   pre-existing behaviour, unchanged and not endorsed.
2. **`SAFETY_` coverage-summary count** — declared 18, 19 rows parsed. Pre-existing,
   untouched, still red. Nothing in decision 30 gives anyone grounds to decide whether the
   missing row is a duplicate, a row that should not be there, or a mistyped count.
3. **`CHK-CONTRACT-STRUCTURE` anchors on the canon's *first* mention of a backticked rule
   id** and reads a fixed 7000-character window from it. Adding an earlier mention anywhere
   in the canon silently moves that window and produces a false failure — which is what
   happened here, and the amendment's wording was changed to work around it rather than the
   gate being loosened. A gate that can be broken by an unrelated cross-reference is worth
   fixing; it is not fixed here because doing so is a change to a check nobody asked for.
4. **`AI-014` (app).** The application still writes a bare calendar day into `measuredAt`
   (`store/ledger.js:462`) rather than the `calendarDate` the amended contract declares. A
   field rename in the writer; the storage record does not change. Left because the brief
   forbade touching the interface.
5. **`AI-015` (app).** `strings.js` retains wording for the two retired `CAPABILITY_` codes.
   Unreachable, so nothing renders it — and named because dead announcement wording sitting
   in the string table is exactly how an announcement comes back: the next build has a
   sentence ready and only needs a code to hang it on.
6. **Whether `RECONSTRUCTED_WITH_PROVENANCE` may admit an assumption** — see above. Open.
7. **62 invariants are still registered `NO_ENGINE_BEHAVIOUR`, whose stated reason is now
   false.** The text reads *"needs engine behaviour; no V2 engine exists
   (`PROJECT-STATE.md`)"*, and one does. `INV-I7` was moved out of that set here because it
   was directly in scope; the other 62 were not looked at, and each needs its own judgement
   about whether an executable form exists. `INV-H1` — *a historical date-only record never
   gains a fabricated time* — is one of them, and is named because it is the invariant a
   reader would expect to be the pin for this pass. It is not; `INV-H6` and `E-31` are, plus
   the type split in `ledger.py`. `INV-H1`'s own generator is an app-level import/export
   round trip rather than an engine property, so promoting it is not simply a matter of
   deleting its registration.
8. **`OI-FREEZEIDBEHAVIOUR-001`.** Decision 30 is the fifteenth behaviour change under an
   unchanged `ALK_V2_FREEZE_5`. Already open; noted again because this pass adds to it.
