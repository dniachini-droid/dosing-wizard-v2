# Build-one mockups — what the screens could not express

Eleven places where drawing the interface and reading the specification disagreed.

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
