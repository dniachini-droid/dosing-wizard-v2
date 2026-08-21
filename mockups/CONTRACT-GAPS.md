# Mockups — what the screens could not express

Twenty-three places where drawing the interface and reading the specification
disagreed. Gaps 1–12 came from PR #6's eleven screens. Gaps 13–23 were added when the
V1 application salvage inventory was carried across and the screen set grew to
thirty-one; none of the first twelve is resolved by that work.

**Nothing here is decided.** None of these is resolved anywhere in the mockups; where a
screen had to render something it renders the honest version and says what is missing.
Several are presentation-layer questions the owner can simply answer. A few are not, and
those are marked, because a chemistry rule can only arrive through a governed canon
reissue and never through an interface decision.

Each gap is also flagged in a dashed box on the screen where it shows up.

Authorities referred to below:

- `docs/implementation/alk-v2/ALK-V2-DATA-CONTRACT.md`
- `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`
- `docs/implementation/alk-v2/ALK-V2-MODULE-DESIGN.md` §7
- `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` Part IX, `X-INV-004`

---

## Gap 1 — Nitrate, phosphate and salinity have nowhere to live

**Where it shows.** Today (all five variants), History.

**What the screen needed.** Five inert parameter tiles and five history charts: calcium,
magnesium, nitrate, phosphate, salinity.

**What the contract provides.** `Reading.parameter` is a closed vocabulary of exactly
`ALK | CA | MG` (data contract §2). Canon `MIGRATION-INERT-CA-MG-MEASUREMENTS-001` names
calcium and magnesium and nothing else. `MIGRATION_CA_MG_INERT` is the only reason code
for an inert measurement, and its payload takes a `parameter`.

**What breaks.** Three of the five tiles are drawn from data the contract cannot hold.
There is no canonical unit for them, no validation rule, no reason code, and no statement
that they are inert.

**What would close it.** An owner decision on whether build one logs these three at all.
If it does, the parameter vocabulary and the inert-measurement rule both need extending —
which is a canon change, not an interface one. Note that this is *storage and display of
a recorded fact*, not a controller: extending the vocabulary does not imply any nitrate or
phosphate chemistry, and must not be read as licence to invent any.

---

## Gap 2 — Nothing orders the attention list

**Where it shows.** Today, all five variants, top card.

**What the screen needed.** A short list at the top of Today, most important first.

**What the contract provides.** `EngineResult` has no ordering field for anything
user-facing. The reason-code catalogue orders codes by owning module (`A48`), which is an
emission order for audit, not a priority for a keeper. Module design §7 says a card is
selected by matching a predicate over `EngineResult` fields "in an order that is itself
data" — but that data does not exist anywhere in the package.

**What breaks.** Presentation cannot invent the ordering: canon `X-INV-004` and
`CORE-SOURCE-001` forbid a surface deciding anything. So the list has no owner. The
mockups render rank numbers and a caption claiming the engine supplied them. That caption
is currently false.

**What would close it.** Either an explicit ordered output on `EngineResult`, or an
owner decision that ordering is a presentation concern after all — which would be a
narrowing of `X-INV-004` and should be recorded as such rather than assumed.

---

## Gap 3 — There is no object for a pending implementation confirmation

**Where it shows.** Today variant A, the "Did you make the change?" card.

**What the screen needed.** A recommendation the app has issued and is waiting to hear
about, with four answers: yes with a time, yes with an uncertain window, no, and not yet
answered.

**What the contract provides.** Canon §6.1 and `X-GOV-001` / `X-GOV-002` define
`priorImplementationState` as `CONFIRMED_NOT_IMPLEMENTED | UNKNOWN | implemented` and are
emphatic that `UNKNOWN` must never collapse either way. Data contract §10.9 requires "a
recommendation record and an implementation record are separate objects with separate
identities and separate timestamps". `ReturnPlan.actualImplementationState` exists.

**What breaks.** Only one of those two objects is actually specified. There is no
`RecommendationRecord` entity, no field on `EngineResult` saying a confirmation is
outstanding, and no reason code for the outstanding state. `IX-004A` governs the *wording*
of unresolved guidance but presumes something already tracks it.

**What would close it.** A recommendation record with an identity, and either a field on
`EngineResult` or a code in the catalogue for "a prior recommendation is awaiting
confirmation". Nothing about the chemistry changes.

---

## Gap 4 — No one owns the plain-English sentence under a reason code

**Where it shows.** Every notice on every screen.

**What the contract provides.** Reason-code catalogue rule 7: "No user-facing wording
lives here. Part IX owns wording." Part IX locks a core wording contract — no first
person, units always present, never claim a change is working before a favourable class,
never say "safe" or "unsafe", state the conclusion then its basis — and supplies actual
text for a handful of states (`IX-003`, `IX-005`, `IX-006`). It supplies nothing for the
other two hundred and twenty-odd codes, and its own status line says "detailed surface
layouts remain implementation work".

**What breaks.** Every plain-English line in these mockups was written here. They follow
the Part IX rules, and several of them are load-bearing — the difference between
"uncertainty limited" and "stable" is a sentence, and a wrong sentence there is a wrong
statement about the tank.

**What would close it.** Either a wording table alongside the catalogue, or an explicit
owner decision that wording is drafted per-surface and reviewed against Part IX rather
than specified centrally. The second is cheaper and is probably right; it should still be
a decision rather than a default.

---

## Gap 5 — Consumption has no way to refuse for want of evidence

**Where it shows.** Today variant C.

**What the screen needed.** With two readings three days apart, either a consumption
figure marked provisional, or a refusal with a reason.

**What the contract provides.** `ConsumptionEstimate.eligibility` is `RUN | NOT_RUN +
reason`, and every withheld output must carry a reason code (data contract §10.8). The
four available codes are `CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE`,
`_DOSE_HISTORY_UNAVAILABLE`, `_NET_VOLUME_UNAVAILABLE` and
`_HISTORICAL_CONTEXT_MISSING`. None of them is about evidence sufficiency.

**What breaks.** Whether the mass balance may be computed from a two-reading provisional
trend is not stated anywhere, and there is no code for refusing it on those grounds. So
the screen can neither show the figure with authority nor withhold it with a reason. It
currently shows nothing, which violates "no output is silently absent".

**Note.** This one is chemistry. Whether a provisional trend is an acceptable input to the
mass balance is a judgement about the estimate's validity, not about the interface, and it
belongs in a canon reissue. It must not be settled by a screen.

---

## Gap 6 — Nothing says which severity leads, or which codes reach the card

**Where it shows.** The notice list on every screen; called out on the assessment detail.

**What the contract provides.** Codes are additive and are emitted "in the owner order
given in `A48`" — module by module. Severity is `INFO | GATING | REFUSAL | SAFETY`.

**What breaks.** Two decisions have no owner. First, the display order: the mockups sort
safety, then refusal, then gating, then info, which is a presentation choice made here.
Second, the subset: the Today card shows sixteen of twenty-five codes and the detail
screen shows all twenty-five. Which nine were dropped is also a choice made here. Both are
arguably presentation, and both currently sit in the same forbidden territory as gap 2 —
if a surface must not decide, it must not decide these either.

**What would close it.** An owner decision that display ordering and promotion are
presentation concerns, recorded as such. Or an ordering rule alongside the catalogue.

---

## Gap 7 — A grouped repeat has no entry to open

**Where it shows.** History, the 18 August point; entry detail.

**What the screen needed.** Tapping any point on a chart opens that entry.

**What the contract provides.** `MeasurementCluster` is `DERIVED` with a deterministic
`clusterId`, a representative value, a representative time and a spread. Its members are
`Reading`s and have their own identities. Screen 5 is an *entry* detail.

**What breaks.** The chart draws the cluster — one point, with the spread as a whisker.
Tapping it has nowhere to go: there is no entry behind a derived object, and picking one
of its members arbitrarily would misrepresent which reading the analysis used.

**What would close it.** Purely presentation: a cluster detail view listing its members,
each linking to its own entry. Worth deciding rather than improvising, because the
"one testing episode is one observation" idea is exactly what the screen has to teach.

---

## Gap 8 — Only readings can be corrected

**Where it shows.** Log entry, entry detail.

**What the contract provides.** `Reading` has `status` (`VALID | SUSPECT | INVALID |
SUPERSEDED`), `invalidReason`, `supersededByReadingId` and an `editedAt` audit.
`MaintenanceDoseState` has `INTERVENTION_DOSE_HISTORY_CORRECTED`, which covers correcting
dose history. `WaterChange`, `ManualCorrection`, `DeliveryAnomaly` and
`ConsumptionContextEvent` have `IMMUT` identities and no status, no supersede link and no
correction path at all.

**What breaks.** A mistyped water-change fraction, or a delivery problem logged against
the wrong day, cannot be fixed. The only routes are rewriting history, which the whole
ledger design forbids, or leaving the error in place, which corrupts every assessment that
touches it.

**What would close it.** A generic supersede-and-retain shape for every event family, on
the pattern readings already use. Not a chemistry change; it is a schema gap.

---

## Gap 9 — Nothing says what resolves a suspect reading

**Where it shows.** Log entry, entry detail.

**What the contract provides.** `SUSPECT` means "plausible but inconsistent enough that
confirmation is advisable", it "does not auto-become `INVALID`", and it "may block
ordinary dose action until resolved". `VALIDATION_READING_MARKED_SUSPECT` is `GATING`
with payload `readingId, markedBy`. `OI-SUSPECT-001` is open, and it covers *detection* —
that alkalinity has no threshold for automatically suspecting a reading.

**What breaks.** The word "resolved" is never defined. Nothing says whether a confirming
repeat clears it, whether the keeper clears it by hand, whether it expires, or which
screen does any of that. The mockup states plainly that there is no defined route out,
which is honest but is not a usable interface.

**What would close it.** Resolution is arguably process rather than chemistry, but it
gates a dose action, so it needs an owner answer at minimum and probably a canon
statement. The mockups do not assume one.

---

## Gap 10 — No staleness rule for a logged-only value

**Where it shows.** Today tiles, History.

**What the contract provides.** `MIGRATION_CA_MG_INERT` says the inert parameters get
"no trend, evidence, advice, schedule or notification". A date is a recorded fact and
showing it is clearly fine.

**What breaks.** A magnesium value from six days ago and one from six months ago look
identical on a tile. Greying an old one, or saying "6 months ago" more loudly, is a
judgement about whether a value is still worth looking at — and a judgement about a
parameter is close enough to advice that the interface should not make it unasked.

**What would close it.** An owner decision on whether age may be emphasised for an inert
parameter, and if so on what basis. The mockups show the date plainly and emphasise
nothing.

---

## Gap 11 — There is no reason code for an outer-bounds change

**Where it shows.** Settings, change history.

**What the contract provides.** `CONFIG_TARGET_RANGE_CHANGED` (INFO, payload `oldRange`,
`newRange`) and `CONFIG_NET_VOLUME_CHANGED` (INFO). `ConfigurationSnapshot` carries
`outerMinDkh` / `outerMaxDkh` and a `changedFields[]` list, so the *change* is recorded.

**What breaks.** Editing the outer bounds moves the safety destinations and can turn a
breach into a non-breach, or the reverse — the largest behavioural effect any single
setting has. The assessment that follows such an edit has no code with which to explain
why its safety verdict changed. `CONFIG_VERSION_RESOLVED` names the version but not what
moved.

**What would close it.** A `CONFIG_OUTER_BOUNDS_CHANGED` code with the old and new bounds
in its payload, by the same logic that gave the target range one. The catalogue is closed,
so this is a catalogue amendment rather than an interface decision.

---

## Gap 12 — "Not sure" has nowhere to go on a dose change's origin

**Where it shows.** Log entry, the dose-change form: "Was this the change the app
recommended?" with three answers — yes, no it was my own, and not sure.

**What the contract provides.** `MaintenanceDoseState.origin` is `REQ` with a closed
vocabulary of exactly two values, `MANUAL | RECOMMENDATION_ACCEPTED` (data contract §3).
It carries no `UNK-OK` marker, so unlike `programmedDoseMlPerDay`, `solutionContextId`,
`deliveryContextId` and `actuatorIncrementMlPerDay` on the same record, it has no way to
express "not established".

**What breaks.** A keeper who changed the dose weeks ago and genuinely cannot remember
whether they were following the app has to be recorded as one or the other. That is
exactly the collapse §0 forbids — "`UNKNOWN` never collapses to a value" — and it is not
harmless: `origin = RECOMMENDATION_ACCEPTED` also obliges the record to carry
`recommendedDoseMlPerDay`, so guessing wrong invents a second fact as well.

**What would close it.** Marking `origin` `UNK-OK`, on the pattern the same record already
uses for four other fields. A schema gap, not a chemistry one.

**Note.** This is distinct from gap 3. Gap 3 is that there is no object representing a
recommendation awaiting confirmation. This one is that even when the keeper answers, one
of the three honest answers cannot be stored.

---

# Gaps 13–23 — added by the V1 surface rebuild

Everything from here down was found while drawing the surfaces
`docs/migration/V1-APPLICATION-SALVAGE.md` §12 lists as missing. The same rule holds:
**nothing here is decided**, and where a screen had to render something it renders the
honest version and says what is absent.

Two further authorities are referred to below:

- `docs/migration/V1-APPLICATION-SALVAGE.md` §2, §12
- `docs/migration/V1-OPEN-OWNER-QUESTIONS.md`

---

## Gap 13 — An ICP panel is not a reading, and there is no object for one

**Where it shows.** ICP panel entry, ICP arrival.

**What the contract provides.** A `Reading` holds one parameter from a closed vocabulary.
An ICP panel is thirty-odd elements measured by a third party, arriving as one document
on one date, most of them parameters the vocabulary does not contain at all.

**What breaks.** There is nowhere to put the panel, nowhere to put the lab's identity,
and no way to express that thirty-four values share one date and one source. Splitting it
into thirty-four readings would also assert that a lab figure and a test-kit figure are
the same kind of measurement, which is the claim the screens are careful not to make.

**What would close it.** A distinct panel record with its own elements, its own reference
ranges attributed to the lab, and no path into the parameter engines. A schema question.

**Note.** Related to but separate from gap 1. Gap 1 is that four *dosed or measured*
parameters have no home. This is that a *lab panel* is a different shape of thing from a
reading, whatever the vocabulary contains.

---

## Gap 14 — Nothing owns a task, a schedule or a completion

**Where it shows.** Tasks, the calendar, the day view, the reschedule sheet, custom
tasks, and every inline log on Today.

**What the contract provides.** Nothing. The data contract has readings, events,
assessments and settings. It has no reminder, no interval, no completion and no schedule.

**What breaks.** Every one of these screens is drawn against an object that does not
exist. Completion-anchored scheduling, auto-completion, skip-versus-done and the whole
calendar rest on it.

**What would close it.** A task record with an interval, a completion log keyed to it,
and a projection rule. V1's `reminders.js` is a working reference implementation with the
reasoning written into it, and none of it is chemistry. Its **intervals** are a separate
matter — see gap 16.

---

## Gap 15 — The engine's suggested test and the keeper's scheduled test have no defined relationship

**Where it shows.** The suggested-test screen, the Tasks tab, the calendar day.

**What the contract provides.** The retest scheduler produces a recommendation with an
action, an earliest useful time and a recommended time. It says nothing about a schedule
the keeper set for themselves, because as far as canon is concerned there isn't one.

**What breaks.** Owner decision 7 says accepting a suggestion "may move their own
scheduled test". Nothing states whether the two are one thing or two, what accepting
does to the keeper's interval, or what happens if they decline and then test anyway. The
screen offers three answers — accept, keep both, decline — precisely because the question
has no owner.

**Note.** This is not a chemistry gap. *When* a retest is useful is canon's and is
answered. Whether a keeper's own rhythm exists alongside it is a product question.

---

## Gap 16 — Who owns a test cadence when the keeper has set one

**Where it shows.** Tasks, the test schedule list; the calendar day's "recurring
schedules" panel.

**What the contract provides.** Retest timing has one owner and it is the engine
(canon Part II). A keeper-set "test alkalinity every two days" is a second source for the
same thing.

**What breaks.** The screens show both, and label the keeper's as theirs and the
engine's as a suggestion, which is the most honest rendering available — but it does not
resolve which governs when they disagree. **The intervals shown on those screens are
sample data and are not adopted from anywhere.** A V1 cadence is not carried across.

**What would close it.** A statement of whether a keeper-set test rhythm is permitted at
all for a parameter the engine schedules, and if so what it means. Partly product,
partly canon: if the answer touches how often alkalinity is tested, it is canon's.

---

## Gap 17 — Nothing orders the ranked list, and now it holds three kinds of thing

**Where it shows.** Today, all six state variants.

**What the contract provides.** Still nothing — this is gap 2, unresolved.

**What is new.** Owner decision 2 puts due tests, due tasks and the assessment into *one*
list ordered by what matters most. Gap 2 was that nothing orders assessment items. This
adds that nothing can order an assessment item *against* a due water change, because the
two come from different places and share no scale.

**Note.** Recorded as a distinct gap rather than folded into gap 2, because closing gap 2
would not close this.

---

## Gap 18 — A completion has no defined relationship to the reading that caused it

**Where it shows.** Test Lab, Today's inline logs, the calendar day, the shared edit sheet.

**What the contract provides.** Nothing, because tasks do not exist (gap 14).

**What breaks.** Auto-completion — logging a reading *is* the completion of its test — is
the single best interaction V1 had, and it creates a link with consequences. Correcting
the reading, marking it invalid, or detaching it from the day all have to do something to
the completion, and the reschedule that followed it. The edit sheet warns about this in
plain English and cannot say what actually happens.

---

## Gap 19 — There is no record of a durability state to render

**Where it shows.** Your data; offline and installed.

**What the contract provides.** Nothing. Backup tier availability, the wipe-detector
verdicts, storage headroom, install state and update-waiting are all real states with real
consequences, and none of them is in any contract.

**What breaks.** Every figure on those two screens is invented. The *shapes* are taken
from V1, whose modules state their own limits honestly; the values have no source.

**Note.** V1's own honest limit is carried across as prose: on a full clear, both wipe
detectors go too, and the app can then tell neither that data was lost nor that it is
fine. That is a property worth keeping and it needs somewhere to be recorded.

---

## Gap 20 — A chart point has no identity to tap through to

**Where it shows.** History, every graph.

**What the contract provides.** This is PR #6's gap 7, restated because the screens now
*offer* the interaction rather than noting its absence.

**What is new.** Owner decision 8's boundary marker needs the same thing from the other
direction: the marker sits at the point where dose history begins, and nothing in the
contract identifies that instant. The screens place it from sample data.

---

## Gap 21 — Nothing says which readings fall inside the excluded period

**Where it shows.** History, the whole record.

**What the contract provides.** Analytical eligibility is a property of a reading in the
data contract. Owner decision 8 makes the exclusion a property of the **period** instead:
one marker, no per-reading dimming, no per-reading mark.

**What breaks.** The two do not describe the same thing. A reading can be ineligible for
its own reasons — no time recorded, marked invalid — and separately fall in a period with
no dose history. The screens render both, and there is nothing that says a period-level
exclusion exists or where it starts and ends.

**Note.** `docs/migration/V1-DATA-PROVENANCE.md` establishes that the owner's imported
readings are real measurements and that what is missing is the dose history beside them.
That is the evidence for the decision; it is not a contract for rendering it.

---

## Gap 22 — The prediction object has no retest date and no destination in it

**Where it shows.** The dose-expectation moment.

**What the contract provides.** An immutable prediction snapshot taken at the moment of a
dose change (canon M-7).

**What breaks.** The moment states four things: the expected value, the daily movement,
when to test again, and what the dose is heading for. The first two are the prediction's.
The third comes from the retest scheduler, which runs separately and can change its mind
afterwards — so a snapshot that is supposed to be unrevisable is rendered beside a figure
that is not. The fourth has no source at all.

**What would close it.** Either stamping the retest time into the snapshot, or the screen
saying plainly that one of those four figures is live and three are frozen. The screens
currently do neither, because either would be a decision.

---

## Gap 23 — No one owns the plain-English sentence, and now every screen needs one

**Where it shows.** Everywhere.

**What the contract provides.** This is gap 4 — the reason-code catalogue names codes and
payload fields and no sentence — and it is unresolved.

**What is new.** Owner decision 9 makes it structural rather than cosmetic. Every reason
code, every payload field name, every state name and every canon marker now needs a
plain-English rendering, and this set wrote all of them. **They are drafts written for the
mockups and they are not authority.** `check-plain-english.py` enforces that none of the
identifiers is visible; it cannot check that a replacement sentence is faithful to the
code it replaced.

**What would close it.** An owner for the user-facing wording, with the same discipline
the codes have: one sentence per code, versioned with it, checked against it.

---

## Gap 24 — A reef keeper's parameter list is longer than the contract's

**Where it shows.** `08-test-lab.html`, which sets out to be *every parameter on one screen*
for a testing session.

**What the contract provides.** `Reading.parameter` is a closed vocabulary. Gap 1 already
records that calcium, magnesium, nitrate, phosphate and salinity have nowhere to live. This
is the further problem: **pH, temperature and specific gravity are not on that list either**,
and a keeper testing at the tank does not sort their results by which ones the engine has an
opinion about.

The Test Lab originally carried a pH row. It was removed, because a screen that offers to
record something the app cannot hold is a promise the app breaks on the next screen.

**What would close it.** A decision on whether the app records parameters it will never
analyse. The recording and the analysing are separate questions, and only the second one is
answered.

---

## Gap 25 — Nothing distinguishes a state the engine cannot reach from one it will not answer

**Where it shows.** `02-today-d-refusal.html`, and the whole of this rebuild's dealings with
retired codes.

**What is new.** The refusal screen in PR #6 was built on `CAPABILITY_ACTUATOR_INCREMENT_REQUIRED`.
Owner decision 23 retired it and replaced it with **nothing at all** — the state cannot arise,
because the application never commands a pump. The screen was rebuilt on a refusal that is
live (a missing solution strength, which genuinely blocks the dKH→mL conversion).

**The gap the episode exposes** is that a screen set has no way to tell, from the catalogue
alone, that a code it renders has stopped being reachable. A retired code and a live one look
identical in a payload table. The mistake was invisible for a whole PR and was found by
reading, not by any check.

**What would close it.** A machine-readable list of live codes that a screen set can be
checked against, in the way `check-plain-english.py` checks visible strings. The catalogue's
retired tables are prose, and prose is what got missed.

---

## Gap 26 — The severity words are contract values that happen to be English

**Where it shows.** Every notice list.

**What is new.** Owner decision 9 bans reason-code identifiers from visible strings. The four
severity values are `REFUSAL`, `SAFETY`, `GATING`, `INFO`. Three of them are ordinary English
words and are rendered verbatim; only `GATING` needed translating, and became *Limiting*.

That is defensible and it is also unexamined: the set is one decision away from either
translating all four or admitting that three are the user-facing words. It currently does
neither deliberately.

**What would close it.** A decision on whether the severity vocabulary is contract-internal
or user-facing. This is small, and it is exactly the kind of thing that is settled cheaply now
and expensively later.
