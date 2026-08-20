# Unmigrated V1 Canon

V1 decisions carrying substantial prior reasoning that **no V2 document owns**.

This document exists to satisfy canon `MASTER RULE 2`:

> No substantive V1 behaviour may simply vanish because a new document forgot to mention
> it.

It is a migration document. **It is not canon and it is not chemistry authority.**
`docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` is. Where this document and the canon
appear to conflict, the canon governs and this document is wrong.

---

## Provenance

| | |
|---|---|
| V1 repository | `dniachini-droid/tank-wizard` |
| V1 commit read | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| V1 canon documents | `docs/spec/reef-chemistry.md` (§1–§32), `docs/spec/wizard-states.md` (§0–§25) |
| Access | read-only |

Neither V1 canon document is copied into V2. Both remain readable in the V1 repository at
the pinned commit above. **Every entry below cites its section**, so the original reasoning
is one lookup away.

---

## THE CONTAMINATION RULE — how this document handles V1 figures

**This document does not reproduce V1 numeric chemistry values.**

It follows the precedent of `docs/process/V1-AGENT-SALVAGE-AUDIT.md`, which refused to
copy V1 figures into V2 on the grounds that "a number sitting in a V2 repository acquires
unearned authority no matter what caption sits above it."

For each entry this document records:

- **what V1 decided** — the shape of the rule, in words;
- **why** — the reasoning, which is the part actually at risk of being lost;
- **what is known to be wrong with it**;
- **its classification**;
- **which V2 part would own it**;
- **where the figure lives in V1**, by section, so a future reader can go and look.

**Why no figures are copied even though recording them was permitted.** The task
authorising this document allowed a figure to be recorded where one *must* be. None must
be: the V1 repository is preserved read-only at a pinned commit, every entry below carries
a precise citation, and the reasoning — not the number — is what a new document forgets.
Copying the numbers would buy nothing and would put unowned chemistry figures inside a V2
repository.

**Adopting any V1 figure into V2 requires a governed canon reissue.** Research toward one
lives under `docs/research/` with citations, marked `NON-AUTHORITATIVE — UNDER REVIEW`,
per `CLAUDE.md`. It never arrives by being quoted here.

---

## Classification vocabulary

| Classification | Meaning |
|---|---|
| `PORT_AS_IS` | The rule is parameter-agnostic and sound; V2 should adopt the same rule. Used only for structural and product rules, never for chemistry. |
| `PORT_WITH_CLEANUP` | The rule survives with V1-specific coupling removed. |
| `REBUILD_THE_IDEA` | The responsibility is worth having; V2 designs its own mechanism. |
| `REFERENCE_ONLY` | Consult when V2 reaches the relevant stage. |
| `REVALIDATE_SCIENTIFICALLY` | V1 may be right, but the scientific premise must be independently checked before V2 adopts anything. **The default for all non-Alk chemistry.** |
| `LEAVE_BEHIND` | Deliberately not carried forward. |

**The governing rule for this document: every non-Alk chemistry figure is
`REVALIDATE_SCIENTIFICALLY`.** No exceptions. Canon Parts IV–VIII say the same thing —
future parameter domains "are not cloned from alkalinity."

---

## Coverage status at a glance

| V1 area | V2 owner today | Status |
|---|---|---|
| Alkalinity | Canon Part III, `ALK_V2_FREEZE_5` | **Owned.** Not in this document except where V1 reasoning has no V2 home. |
| Calcium | Canon Part IV — a status stub | **Unowned** |
| Magnesium | Canon Part V — a status stub | **Unowned** |
| Three-part / ionic coupling | Canon Part VI — a status stub | **Unowned** |
| Trace elements / ICP | Canon Part VII — a status stub | **Unowned** |
| Nutrients, salinity, ammonia | Canon Part VIII — a status stub | **Unowned** |
| pH, potassium | none | **Unowned** |
| Notice lifecycle | none — Part IX holds wording only | **Unowned** |
| Wording rules | Canon Part IX `IX-001` holds the first of seven | **Partly owned** |
| Terminology and colour registries | none | **Unowned** |
| Summary and headline rules | none | **Unowned** |
| Band and steadiness vocabularies | Canon Part I §7 owns state dimensions, not presentation vocabulary | **Partly owned** |
| Setup philosophy | none | **Unowned** |
| The refusal list | none as a consolidated list | **Unowned** |

---

# PART A — CHEMISTRY FAMILIES

---

## A1 — Phosphate

**V1 source:** `docs/spec/reef-chemistry.md` §29 (§29.1–§29.8), ~365 lines.
Design input: `docs/journeys/journey-5-phosphate-nitrate.md`.

### What V1 decided

- **A different shape entirely, not different thresholds.** Phosphate is managed by export and by feeding, not by a dose that replaces consumption — so a maintenance dose, a dose gap, a rate rail and a settle window have nothing to attach to. V1 recorded that borrowing alkalinity's machinery "was never the thresholds. It was the whole shape."
- **Three band layers** — a hard outer pair, a suggested starting band, and the user's own — with figures in §29.2.
- **A much wider licence than alkalinity gets.** A keeper running phosphate several times the suggested band "is not making a mistake, and the app may not treat them as one, nudge them toward the suggestion, or grade them against it." V1's reason: alkalinity's range is bounded by described harm; phosphate within the ordinary hobby spread is a husbandry preference, and the app has no standing to have an opinion about it.
- **One fixed low warning**, firing regardless of the user's band, **not escalating** below its trigger, and firing at a zero reading. Figure in §29.4.
- **A count, not a slope** — a fixed number of the last N readings outside the band, **on the same side**. Owner's reasoning: phosphate oscillates, and "a line through bouncing numbers invents movement that was never there." Two above and one below is a tank bouncing, not a tank living high.
- **No direction language for phosphate anywhere**, at any evidence bar, however patient.
- **No dose, no correction, no return plan, and no suggested levers.** The levers rule reversed the journey document deliberately: the app "cannot see whether someone runs GFO, a refugium or carbon dosing, and suggesting levers they are not using is noise. Naming a lever a keeper already runs at full tilt is worse than saying nothing."
- **An absolute noise floor, not a proportional one.** V1 abolished percent-mode floors across the board after finding a proportional floor "was making the app more sensitive where it was already at the limit of measurement" — finer than any hobby kit resolves. Figures in §5.
- **A fixed warning may fire on an in-band reading without contradiction** — the band chip answers *where is this against the range you chose*, the warning answers *this figure is low whatever range you chose*. "What the app may never do is say both things in one sentence as though they were one judgement."

### Why it was introduced

V1 had been applying alkalinity's reasoning to phosphate and producing nonsense. A backlog
item removed the borrowed reasoning, which left phosphate saying *less* than it should
rather than saying wrong things. §29 is what replaced the silence.

### Known problems

- **Nothing implemented it.** §29's own enforcement note reads: "Nothing yet… No code implements any of the above and no test asserts it."
- The "clearly out low" tier is arithmetically unreachable at the suggested band. V1 accepted this and argued at length why it is not the same fault as an earlier defect of the same shape.
- Three V1 canon cross-references still described phosphate as having no rules.

### Classification

| Element | Classification |
|---|---|
| Every figure — bands, warning trigger, count parameters, floor, cadence, window, margin | `REVALIDATE_SCIENTIFICALLY` |
| The export-not-dose shape | `PORT_AS_IS` **as a principle** — canon Part VIII already keeps "one engine does not imply one algorithm" |
| The no-levers rule | `PORT_AS_IS` as a principle |
| "A fixed warning may fire in-band without contradiction" | `PORT_AS_IS` as a principle |
| The count mechanism | `REBUILD_THE_IDEA` + `REVALIDATE_SCIENTIFICALLY` |
| The wide-licence rule | `PORT_AS_IS` as a principle; the figures `REVALIDATE_SCIENTIFICALLY` |

**V2 owner:** **Part VIII — a status stub. Unowned.**

**Revalidation required:** yes, comprehensively. Priority items: the buffering asymmetry in
A2, the low-warning trigger, the "too low is worse than too high" claim, and whether a
same-side count is a defensible statistic on an oscillating series.

---

## A2 — Nitrate

**V1 source:** `docs/spec/reef-chemistry.md` §29.2, §29.4, §29.5, §29.7.

### What V1 decided

- **Nitrate gets both a count and a trend; phosphate gets only the count.**
- **The mechanistic reason for the asymmetry**, which is the single most load-bearing scientific claim in the whole nutrient section: phosphate binds to rock and sand and is strongly buffered; nitrate has no buffering mechanism at all. V1 cites Randy Holmes-Farley's illustration — dose both into a tank and nitrate rises essentially in full while phosphate rises by a small fraction.
- **A trend bar of a few consecutive readings in one direction clearing the noise floor** — explicitly **not** the statistical gate the dosed elements use.
- **Why the softer bar is not a slackening:** "The statistical gate exists to keep a regression from claiming a slope through scatter. Nitrate is not being fitted — it is being watched for a run, which is a claim about consecutive readings rather than about a line." Importing the gate "meant importing a test designed for a different question."
- **One fixed high warning, at a deliberately low register.** V1's reasoning: published evidence is that high nitrate "is untidy rather than poisonous", so "nothing here may reach the urgent tier." A previously suspended test expectation was restored **with its predicate changed**, because restoring it unaltered would have asserted the opposite of the decision.
- **No low warning of its own.** Near-zero nitrate reaches the keeper through findings that judge both nutrients together.
- **The two parameters never converge.** "The difference is the buffering, not the evidence."

### Known problems

- Unimplemented, like §29.
- V1's own §30 left open which evidence bar governs where both the run-of-consecutive-readings rule and the statistical gate could apply.
- The first pass of §29.5 recorded the bar as "the same evidence bar as the dosed elements" on the owner's own phrase; **that phrase was withdrawn as loose wording** the same day.

### Classification

| Element | Classification |
|---|---|
| Every figure — bands, warning trigger, trend bar size, floor, window | `REVALIDATE_SCIENTIFICALLY` |
| The buffering asymmetry | `REVALIDATE_SCIENTIFICALLY` — **check this first; everything else rests on it** |
| The instrument-choice argument (a significance test is the wrong tool for a run of consecutive readings) | `REBUILD_THE_IDEA` — a genuine and transferable insight |
| The low-register rule for the high warning | `REVALIDATE_SCIENTIFICALLY` |

**V2 owner:** **Part VIII — a status stub. Unowned.**

---

## A3 — Calcium

**V1 source:** `reef-chemistry.md` §2, §3, §4, §5, §11, §18, §27; `wizard-states.md` §22.
Practice source: `docs/journeys/journey-2-calcium.md` (seven narrated correction episodes).

### What V1 decided

Outer bounds, a suggested range, a rate rail, a test cadence and analysis window, a noise
floor, a movement threshold, an alert offset, an out-of-band margin and a steadiness
spread — **all figures, all in the sections cited above, none reproduced here.**

Two non-figure decisions carry reasoning worth keeping:

- **Calcium is deliberately more reluctant to act than alkalinity**, with a longer post-change wait. V1's reason: "calcium moves slowly and test uncertainty is a large fraction of a week's real movement." **Canon Part IV names exactly this risk** — calcium "must not inherit alkalinity timing merely because the code is reusable."
- **The steadiness spreads are "decided, not derived"** — explicitly not multiples of the noise floor and not fractions of the band, because deriving them would make a change in what a kit can see change what counts as steady.

**One correction V1 made to itself, worth recording.** V1's shipped calcium and magnesium
ranges once sat entirely above every published range, so a textbook tank read out of band
on both and the app offered to push magnesium to a level the same sources describe as
harmful. "The app was steering people away from correct values." The defaults were
corrected. **The lesson is about default-setting discipline, not about the figures.**

### Journey material

`journey-2-calcium.md` records seven real correction episodes and six habits V1 never fully
encoded: noise answered by a longer window rather than more readings; a large move skipping
the confirming test; tolerance shrinking near a band edge; direction read relative to the
preferred range; expectations stated before the reading arrives; the consumption method
chosen from the shape of the data. `REFERENCE_ONLY`, high value.

### Classification

Every figure: `REVALIDATE_SCIENTIFICALLY`.
The reluctance rationale: `REBUILD_THE_IDEA`.
"Decided, not derived": `PORT_AS_IS` as a principle.
The stable-Alk-means-falling-Ca-is-not-calcification rule: `LEAVE_BEHIND` — V1's own
disposition ledger already replaced it.

**V2 owner:** **Part IV — a status stub. Unowned.**

---

## A4 — Magnesium

**V1 source:** `reef-chemistry.md` §10, plus the shared sections in A3.
Practice source: `docs/journeys/journey-3-magnesium.md`.

### What V1 decided

**1. The maintenance dose is never tuned from readings — exempt, not delayed.**
V1's argument is arithmetic and checkable: a modest dose error takes **over a thousand
days** to produce a movement clearing magnesium's kit noise floor, so "any answer the app
produced would be invented." A V1 prototype independently measured the same figure at
1,347 days. **Canon Part V names this rule specifically** as "explicitly REVALIDATE
SCIENTIFICALLY, not automatically carried forward and not automatically deleted."

**2. Corrections are not exempt, and the distinction is the point.** A one-off dose of a
known quantity into a known volume is measurable within hours. An earlier V1 draft imposed
a long silence after a magnesium correction; that was withdrawn as confusing "the slow
dose-tuning signal with the fast correction-verification signal."

**3. The magnesium gate.** Below a threshold, calcium and alkalinity cannot be held and
precipitation becomes likely, so while magnesium is below its alert level the app withholds
every recommendation to raise alkalinity or calcium — **including a recommendation to raise
the daily dose**, not only a one-off correction. V1's reasoning for including the daily
dose: "a dose tuned against a level that cannot respond is chasing something that will not
move… it is acting on a number the tank is about to invalidate."

**4. The gate's four boundaries.** These are structural, mostly parameter-agnostic, and the
most carefully drawn part of §10:

- a dose **decrease** is never withheld — lowering a level cannot precipitate anything;
- magnesium's **own** correction is never gated — it is the thing the gate is asking for;
- magnesium that has **never been measured** does not close the gate — an unmeasured level is not below anything;
- the outer-bound **harm warning** is never suppressed — the gate withholds advice about a correction, never the fact that a level is outside what corals tolerate.

**5. The gate's cost, measured and accepted.** On a three-year simulation, holding the
alkalinity dose while magnesium sat under its alert level cost a substantial alkalinity
decline over six weeks before the outer-bound warning took over. V1 recorded this
"so that whoever finds the simulation result later knows it was seen and weighed, rather
than re-deriving the narrow reading and quietly restoring it."

**6. Magnesium does not precipitate with calcium or alkalinity.** The separation
requirement applies only between calcium and alkalinity. An earlier V1 draft was wrong
about this and was corrected by the owner.

**7. An alert-level floor that must not invert.** The derived alert level is floored at the
outer bound, because an act-now line sitting below the described-harm point is incoherent.
On V1's shipped defaults the floor was load-bearing rather than dead code.

### Known problems

- **A hidden per-user override** existed on the gate's threshold, with no Setup field and no canon entry — an undocumented per-user chemistry value. `LEAVE_BEHIND` as a mechanism; recorded here because it is the shape of defect V2's single-source rules exist to prevent.
- Journey 3 records that in balling practice magnesium's dose is copied from alkalinity's, that risk is asymmetric and the band arguably should not be symmetric, and that the response to a high level is to pause or cut hard rather than fine-tune. **The asymmetric-band idea has no V2 consideration at all.**
- A V1 backlog item to offer magnesium/alkalinity dose parity for balling systems was never built.

### Classification

Every figure: `REVALIDATE_SCIENTIFICALLY`.
The never-tuned rule: `REVALIDATE_SCIENTIFICALLY` — canon Part V says so explicitly.
The gate: `REVALIDATE_SCIENTIFICALLY`. Canon `M-11` already defines the magnesium
alert-state interface alkalinity safety messaging needs, and `WG-ALK-055` decides that an
alkalinity outer-bound breach **overrides** the magnesium hold — so a fragment of the gate
already has a V2 home, but the gate itself does not.
The four boundaries: `PORT_WITH_CLEANUP` — structural.
The measured cost: `REFERENCE_ONLY`.
The non-precipitation finding: `REVALIDATE_SCIENTIFICALLY`.

**V2 owner:** **Part V — a status stub. Unowned.**

---

## A5 — Salinity

**V1 source:** `reef-chemistry.md` §3, §4, §5, §11, §18, §27; `wizard-states.md` §22.

### What V1 decided

Outer bounds, a shipped range, a two-sided alert pair, a rate rail, a movement threshold, a
fast-movement threshold at twice the movement threshold, an analysis window, a noise floor,
an out-of-band margin and a steadiness spread. **Figures in the sections cited.**

**Salinity is graded because the app acts on it.** V1's stated reason for giving salinity a
window, rate thresholds and a margin — while withholding all three from potassium and pH —
is that salinity has an alert tier and a rate rail, "and a parameter the app will act on
ought to be one it can grade."

**One design rule worth extracting, parameter-agnostically.** V1 moved salinity's high
alert level because it had been set to the same value as the shipped range's upper edge.
The collision made an ordinary reading simultaneously *needs-attention* and *not out of
range* — "a state no card covers, reachable by typing the most ordinary number a keeper
with that range could type." **V1 fixed the level, not the boundary rule**, because
exempting one figure would have falsified the boundary rules' own "fixed, no exceptions"
claim.

### Known problems

- **Salinity's test cadence was never set.** V1 left the column blank deliberately rather than invent a figure. Still open.
- V1's backlog recorded "salinity is not assessed at all" and it remained true at the pinned commit. The owner's own export carries two salinity readings across six months.

### Classification

Every figure: `REVALIDATE_SCIENTIFICALLY`.
The graded-because-acted-on principle: `PORT_AS_IS` as a principle.
The alert-level/band-edge collision rule: `PORT_AS_IS` **as a general design rule** — it
generalises to every parameter and to V2's own band edges.

**V2 owner:** **Part VIII — a status stub. Unowned.**

---

## A6 — Ammonia

**V1 source:** `reef-chemistry.md` §32 (~165 lines); `wizard-states.md` §13, §18.

### What V1 decided

**1. Ammonia does not fit a ranged model at all.** Its target is a point, not a range, so
there is no midpoint to hang an alert offset from, no width to divide a distance by, no
lower half, nothing to drift toward, and an "in band" that would have to mean exactly one
value. V1 concluded that "six of the seven bands are unreachable and the seventh is a
category error", and **amended the general rule to say so rather than stretching it.**
Canon's own V1 disposition ledger already keeps this: "Ammonia does not fit ordinary ranged
trend logic."

**2. Two states and no gradation:** undetectable, and detectable.

**3. Silence when undetectable is the decision, not an omission.** V1's reasoning is a
product principle that generalises well past ammonia:

> "Almost every ammonia reading on an established tank is zero. A parameter that confirms
> it is fine every time it is tested is a line the keeper stops reading, and the moment
> that costs something is the one time it says the other thing. **Ammonia buys its alert by
> never spending it on reassurance.**"

Concretely: no verdict, no notice, no tile state, no summary entry, no headline clause. The
reading is still stored, charted and shown as a number.

**4. One reading is enough — the only parameter where a single reading justifies acting.**
V1's reasoning is a distinction worth keeping in general terms: evidence bars are bars on
claims about **movement**, and detectability is not a movement claim. "A rule requiring a
second detectable ammonia reading before saying anything would be an evidence bar on a
fact."

**5. What ammonia does not get, stated so nothing is inferred:** no trend, no steadiness
verdict, no dose, no analysis window, no return plan, no second severity tier. "The app
never says ammonia is falling."

**6. Naming the target is not a lever.** The app names the level and stops. It does not
guess at a cause — a cycle, a dead animal, a filter crash, an overfeed and a dosing
accident are all consistent with the same reading.

**7. The per-parameter off switch reaches it, deliberately.** "The keeper ran the test and
typed the number in. The app is choosing whether to comment on a figure already in front of
them, not withholding something they do not have."

### Known problems

Unimplemented, and **three live V1 behaviours contradicted it** at the pinned commit: a
two-tier finding split where the section allows one, an unreachable steadiness-rules entry,
and a reading-confirmation branch written before the section existed and never reconciled
with it.

### Classification

| Element | Classification |
|---|---|
| The structural non-fit with a ranged model | `PORT_AS_IS` as a principle |
| Silence-at-zero as an alert budget | `PORT_AS_IS` as a **product principle** |
| Evidence bars apply to claims, not to facts | `PORT_AS_IS` as a principle |
| Naming the target is not a lever | `PORT_AS_IS` as a wording principle |
| Per-parameter off covering alerts | `PORT_AS_IS` as a principle |
| The detectability threshold and everything numeric | `REVALIDATE_SCIENTIFICALLY` |

**V2 owner:** **Part VIII — a status stub. Unowned.**

---

## A7 — pH and potassium

**V1 source:** `reef-chemistry.md` §5, §18, §27, §31; `wizard-states.md` §22.

### What V1 decided

**pH and potassium are watched, not acted on.** V1 gave them **no alert tier, no analysis
window, no out-of-band margin and no steadiness verdict** — and recorded each absence as a
decision rather than a hole: "a tier that never justifies an action is a colour change
pretending to be information", and a window exists to grade movement the app would say
something about.

Both keep a shipped range and a noise floor. Figures in §5 and the parameter definitions.

**A "watched rather than acted on" tier of parameter is a coherent product concept that V2
has not defined.** Recorded as the transferable idea here.

**Two cross-parameter checks touching pH** survived V1's own deletion sweep and were
ratified at their existing values: a high-pH check, and a **CO₂ signature** — a low pH
alongside an in-range alkalinity. The CO₂ signature is a genuinely useful cross-parameter
idea. Figures in §31.

### Classification

Every figure: `REVALIDATE_SCIENTIFICALLY`.
The watched-not-acted-on tier: `REBUILD_THE_IDEA`.
The CO₂ signature: `REVALIDATE_SCIENTIFICALLY` — **and flagged, because it has no V2 owner
at all and is not obviously anyone's.**

**V2 owner:** **none.**

---

## A8 — Cross-parameter chemistry with no V2 owner

| V1 item | V1 source | Classification | Note |
|---|---|---|---|
| Three-part / ionic coupling ratio and its tolerance, and the calcium/alkalinity dosing-separation guard | `reef-chemistry.md` §20, §31 | `REVALIDATE_SCIENTIFICALLY` | Canon Part VI retains the *idea* as "a plausibility/advisory layer" that "must not be used to erase a directly supported independent calcium or alkalinity trend" — but Part VI is a stub. |
| Calcification mass model — alkalinity consumption converted to deposited carbonate | `src/lib/analytics/calcification.js` | `REVALIDATE_SCIENTIFICALLY` | Its **scope statement** is `PORT_AS_IS` as a register: the figure covers all carbonate laid down, including coralline algae, calcifying inverts and abiotic precipitation — "saying otherwise would overstate what the arithmetic supports." |
| Nutrient production as a mass balance over water changes | `src/lib/analytics/nutrients.js` | `REVALIDATE_SCIENTIFICALLY` | Same: the honest scope note — production **net of all other export**, not gross biological production — is the transferable part. |
| Dry-salt correction product conversions | `src/lib/analytics/correction.js` | `REVALIDATE_SCIENTIFICALLY` | Canon `ALK-014` owns theoretical potency for the liquid path. The dry-salt conversions have **no V2 owner**. |
| ICP reference ranges, grouped by what a keeper manages rather than alphabetically, with single setpoints expanded to a band **and marked as derived** so the app never implies the lab drew the boundary | `src/lib/analytics/icp-reference.js` | `REVALIDATE_SCIENTIFICALLY`; the **derived-marker honesty flag** is `PORT_AS_IS` | Canon Part VII is a stub. |
| ICP cross-calibration of hobby kits | `src/lib/analytics/icp-calibration.js` | `REVALIDATE_SCIENTIFICALLY` | V1's own rule constrains it: the app never tells a user their test kit is wrong. One parameter's calibration verdict was deleted outright; two kept the observation and lost the verdict. |
| The rate-of-change premise — that corals respond to how fast a parameter moves rather than its absolute value | `src/lib/stability-engine.js` | `REVALIDATE_SCIENTIFICALLY` | **Flagged: V1's supporting claim about published survival data is uncited.** This should be the first thing a domain verifier checks, because a great deal of V1 rests on it. |
| Diurnal alkalinity swing making readings comparable only at similar hours | `src/lib/analytics/time-of-day.js` | `REVALIDATE_SCIENTIFICALLY` | The **observation** is real and has no explicit V2 owner. V1's *handling* of it — defaulting an unknown time to midday — is `LEAVE_BEHIND`; canon §2.3A and `WG-ALK-066` forbid it and `V1-DATA-PROVENANCE.md` restates the prohibition. |

---

# PART B — PRODUCT AND SURFACE CANON

Nothing in Part B is chemistry. These are product decisions with substantial reasoning,
and most of them are parameter-agnostic — which is why several are `PORT_AS_IS` where no
chemistry entry is.

---

## B1 — The notice lifecycle

**V1 source:** `wizard-states.md` §20, and §25.1 for the surface it lives on.
Origin: `docs/journeys/journey-4-notifications.md`, which documented five concrete failures.

### What V1 decided

- **One live notice per parameter**, whose content is the engine's current verdict. Not one per surface, not one per rule that fired.
- **A new verdict supersedes the old notice rather than joining it.** Nothing accumulates and the hidden list stops growing.
- **Hiding is global**, because there is one notice rather than one per surface.
- **Every notice can be hidden. No exceptions**, including outer-bound excursions. The owner's reason: *"If someone wants to hide a notification, they can hide a notification. There might be a reason the app doesn't know about."* This **overruled two live behaviours** that made certain findings non-dismissible by rule.
- **Serious notices get a confirmation before hiding** — "a speed bump, not an exception. It does not create a class of notice that cannot be hidden."
- **A hidden notice resurfaces on the next reading that would trigger it.** "Hiding buys you until the next test, never indefinitely." No special case is needed: supersession already does the work.
- **Hide and off are two different controls and may never substitute for one another.** Hide is per notice and temporary. Off is per notice type, permanent, and set in configuration. V1 registered both words separately precisely so a surface could not offer one and deliver the other — "which on the temporary side means an app that has gone quiet about a tank getting worse."

### Known problems

- The mapping from "serious" onto a severity level was written by V1's canon rather than stated by the owner. V1 flagged it as "the one thing in §19–§20 the owner has not stated directly."
- Nothing asserted any of it in code.

### Classification

| Element | Classification |
|---|---|
| The lifecycle as a whole | `REBUILD_THE_IDEA` |
| Supersede-not-stack | `PORT_AS_IS` |
| Resurface-on-next-trigger | `PORT_AS_IS` |
| Everything is hideable, with a confirmation for serious ones | `PORT_AS_IS` |
| Hide and off as two never-substitutable controls | `PORT_AS_IS` |

**V2 owner:** **none.** Canon Part IX holds the wording contract. **No V2 rule states
supersession, hiding, resurfacing, or the hide/off split.** This is the largest unowned
product mechanism in the inventory.

---

## B2 — The seven wording rules

**V1 source:** `wizard-states.md` §23. Folded in from a three-part owner message
specification.

### What V1 decided

1. **State it, then show the basis.** One line saying what is happening, then the numbers it rests on. The reason is not readability: *"a claim you cannot check is a claim you have to trust."* V1 records that this rule is how a live contradiction was actually caught — a card asserting one direction above a panel showing the opposite rate, which had stood for weeks. **The visible basis is what surfaced it.**
2. **Never speak in the first person.** No "I", no "I'll know", no "I think". "You" is used for the user's own actions, which is a statement of fact rather than a conversation.
3. **Mention the dose only when it is relevant** — when it has just changed, when it is being recommended, or when it explains why no change is being recommended. The third case is the one easy to drop and must not be: without it, a card about an out-of-range level reads as the app failing to notice.
4. **Units always, in the parameter's own unit.** No exception for a second figure in the same sentence, a tab label or a chip.
5. **Never speculate about causes.** *"A plausible wrong cause is worse than no cause — it is the one kind of error a user will act on."* **Tested and confirmed with no exception:** the single place V1's canon had written an exception into itself was withdrawn, because a keeper told a configured value is probably wrong "will edit a figure that may well be right, and every dose the app computes afterwards is wrong with it." **Naming a cause the app has been *told* is not speculation** — the rule bans the guess, not the record.
6. **A recent change takes precedence in the wording.** Once a change is in play the useful question is no longer *where is it* but *did that work*.
7. **Headlines do not name the parameter — the badge carries it.** The test is whether the sentence stands on its own, not whether the parameter appears.

### The enforcement table V1 specified and never built

V1 wrote out exactly seven checks, one per rule, and noted which need engine output rather
than static analysis. **This is a ready-made specification for a V2 wording gate** and is
`PORT_WITH_CLEANUP`: every claim carries a supporting figure that names a number; no
first-person pronoun in any user-facing string; a dose figure only on the three permitted
card kinds; every numeric figure carries its unit; a banned-construction list; no
bare-position card while a recent change is inside its window; no headline naming a
parameter outside a registered set of complete-sentence forms.

### Known problems

- **Rule 6 has a precondition the V1 engine could not answer** — what counts as "recent", and whether the engine knew about a change made outside its own flow. A change made elsewhere fell through to a branch that produced exactly the card the rule forbids. **V2's first-class intervention model answers this properly.**
- **Nothing asserted §23.** V1's one wording checker covered a single field of a single loop in a single function, and checked for a claim without checking for its supporting figure — rule 1's own failure mode, unchecked.

### Classification

Rules 1–5 and 7: `PORT_AS_IS`.
Rule 6: `REBUILD_THE_IDEA` — the rule is right; V2's intervention model supplies the precondition.
The seven-check enforcement table: `PORT_WITH_CLEANUP`.

**V2 owner:** **partly.** Canon Part IX `IX-001` retains "global V1 wording rules" and
states the first one. **The remaining six, the enforcement table, and the
withdrawn-exception reasoning are not in V2.**

---

## B3 — The terminology registry and the colour registry

**V1 source:** `wizard-states.md` §15.

### What V1 decided

**One word per concept, everywhere. Any synonym is a finding.** A registry of about
twenty-three concept-to-word rows, each with its banned alternatives.

Three structural rules inside it are the transferable part:

- **The app never says "safe" or "unsafe" about any reading.** It reports position relative to the user's own ranges and nothing more. V1's outer-bound thresholds are an *internal* name, and the app does not say it out loud.
- **Canon's own vocabulary is not app copy.** Several words are reserved for canon's internal use and are never rendered — the internal name of a band, the engine name for the downward instrument, and one state id that is never displayed. "A file name is not a user-facing word."
- **A pair of near-opposites that shared one word until they were separated** — one meaning *inside the range and sliding toward an edge*, the other meaning *outside the range and moving about while it is there*. "Neither may be used for the other, and neither may be used loosely for movement in general."

**The colour registry is the same rule one level down.** A colour that means *something is
wrong* must not also be a parameter's identity. V1 found two parameter brand colours
byte-identical to severity colours — one rendering every chart line in the alarm colour at
every value, a perfect reading included. Replacements were chosen **measured rather than
eyeballed**, against a contrast floor and a perceptual-separation minimum.

Two further colour rules:

- **Four severity colours, not six.** V1 found six colours mapped to three tiers, four of them registered nowhere. "An unregistered colour is the same fault as an unregistered word — this registry exists because a colour means something to a user whether or not anyone wrote down what."
- **Tier colours come from position bands, not from a separate severity scale**, and a verdict never renders calmer than its own reading.

### Known problems

- One collision was left standing and recorded rather than fixed: one parameter's brand colour remained byte-identical to the "all good" severity colour.
- **An open owner decision was never answered:** the same four colours mean **direction** on one surface and **tier** on another. V1 costed three options and adopted none. Carried to `V1-OPEN-OWNER-QUESTIONS.md`.

### Classification

The **mechanism** — one word per concept, one colour per concept, a registry with banned
lists, any synonym is a finding: `PORT_AS_IS`.
The **rows**: `PORT_WITH_CLEANUP` — several V1 words attach to V1 concepts V2 replaces.
The measured-not-eyeballed colour discipline: `PORT_AS_IS`.

**V2 owner:** **none.** Canon `X-INV-005` requires a surface wording contract but
**registers no vocabulary**.

---

## B4 — The summary and headline rules

**V1 source:** `wizard-states.md` §25.1.

### What V1 decided

**1. The short form is generated, never written.** The summary line is the card's own
headline plus its first sentence — not a second wording that says the same thing. V1's
reason is the load-bearing one: *"it is the only arrangement in which two wordings cannot
drift apart, because there is only one wording."* A hand-written summary is "two strings
that agree today."

**2. The tank-level headline has three slots, in order, each dropped when empty:** the
worst thing now; anything else notable; anything in flight. **A dropped slot leaves nothing
behind** — no placeholder clause — "which is why a quiet tank produces a short line, or
none at all, rather than three clauses reporting that there is nothing to report."

**3. Naming:** up to three parameters named individually; beyond that, the worst two named
followed by a collective phrase. "Three is the point at which a list stops being readable
at a glance."

**4. "Worst" is a two-key sort:** alert tier first, then distance past the nearer edge **as
a fraction of the user's own range width**. The fraction is what makes parameters
comparable: a distance in one parameter's unit and a distance in another's are not two
sizes of the same thing, and a raw distance would sort the tank by which parameter happens
to be measured in the larger unit — so the parameter with the biggest numbers would lead
every headline it appeared in. Dividing by the keeper's own range width asks the only
question that means the same thing for all of them: *how far out is this, for this
parameter, on this tank.*

**5. A ranking key is not a margin.** V1's own rules forbid deriving a *margin* from a band
width. This key is explicitly not one: it gates no recommendation, suppresses none, relaxes
no constraint and changes no figure. It decides which of two parameters is named first.
**"An ordering governs wording and must never become a margin."**

**6. Ties break on a fixed parameter order**, not on display order — "a display arrangement
that may change for display reasons cannot be what makes a headline checkable."

**7. Both comparisons run at stored precision**, never at display precision.

**8. A literal in the summary's code path is a finding.**

### Why it exists

It replaced a deleted health score — "nineteen constants, one number, and no way for a
keeper to check it against anything on screen." **Every clause of the headline is checkable
against the tiles below it, which is the property the score never had.**

### Known problems

What a completely quiet tank's headline says was left open, along with whether an
"N of M in range" claim may appear at all. Carried to `V1-OPEN-OWNER-QUESTIONS.md`.

### Classification

`REBUILD_THE_IDEA`, and one of the strongest product ideas in V1.
"Generated, never written": `PORT_AS_IS` as a principle.
"An ordering governs wording and must never become a margin": `PORT_AS_IS` as a principle.

**V2 owner:** **none.** Canon Part IX has no tank-level summary rule.

**Direct relevance to build one:** PR #6's `mockups/CONTRACT-GAPS.md` Gap 2 records that
*nothing orders the attention list* on the Today screen, and that presentation cannot
invent the ordering because `X-INV-004` forbids it. **V1 had already specified exactly this
ordering, with its reasoning.** It is not authority — but it is prior art for the decision
Gap 2 is waiting on, and neither document knew about the other.

---

## B5 — The band and steadiness vocabularies

**V1 source:** `wizard-states.md` §13 (position bands) and §22 (steadiness verdicts).

### What V1 decided

**Two registered vocabularies that never substitute for one another.** One answers *where
is this reading*; the other answers *how steady has this been over the window*. A reading
can sit inside its range all month and still have bounced across it, and only the second
vocabulary can say so.

**No surface may invent a third.** A surface inventing a category outside either list is a
finding — this rule exists because V1 found six invented headline categories rendering
beside the official badge in the same modal.

**Boundary rules, fixed with no exceptions:**

- band edges are **inclusive of the band they bound**;
- where two rules claim one value, the alert tier is tested first, and the reading produces **one** notice, not two;
- comparisons happen at **stored precision**, never display precision;
- **classification never rounds; display rounds.**

**Refusal is per axis, not wholesale.** A single reading **states its position** — "the
position is the last reading, and one reading is one reading" — while the movement and
steadiness axes refuse and **name what is missing**, including when the next test is due.
V1 corrected an earlier reading of its own rule that would have withheld the position too.

**The steadiness figures are "decided, not derived"** — explicitly not multiples of the
noise floor and not fractions of the band, because deriving them either way would let an
unrelated change move what counts as steady. **Figures in §22.**

**Some parameters get no steadiness verdict at all, by decision** — "not a missing row, not
a refusal waiting on a figure. **They are not waiting on you.**" A surface must not grade
them against another parameter's spread, scale one from their band, or fall through to a
graded verdict.

### Classification

| Element | Classification |
|---|---|
| Two vocabularies, never substituting | `PORT_AS_IS` |
| No surface may invent a third | `PORT_AS_IS` |
| The four boundary rules | `PORT_AS_IS` |
| Refuse per axis, not wholesale; a single reading still states position | `PORT_AS_IS` |
| "Decided, not derived" | `PORT_AS_IS` as a principle |
| "No verdict at all, by decision, and not waiting on you" | `PORT_AS_IS` as a principle |
| The eight steadiness spread figures | `REVALIDATE_SCIENTIFICALLY` |
| The band set itself | `REBUILD_THE_IDEA` — V2's structured state dimensions replace a flat enum |

**V2 owner:** **partly.** Canon Part I §7 owns the **state dimensions**. **No V2 rule
registers a presentation vocabulary or its boundary arithmetic.**

---

## B6 — The setup philosophy

**V1 source:** `wizard-states.md` §21.

### What V1 decided

> **Setup asks for facts, not judgements.**

- **Facts** are properties of this tank and this shelf of bottles — only the user can supply them, and there is no default that is not a guess about someone else's tank. Net volume, solution strengths, which parameters are dosed.
- **Judgements** are opinions about how the app should behave — band widths, tolerances, cadences, notification thresholds. The app has better answers, from its own canon, than a new user does.
- **The test is not that a value is numeric or feels technical.** It is that **the app cannot obtain it and cannot default it.**
- **"The app must work well without being configured beyond the facts."** A user who supplies the facts and touches nothing else gets the app working **correctly — not degraded, not in a reduced mode.**
- **"If a default is not good enough to ship unattended, the defect is in the default, not in the absence of a question."**
- **A setting must earn its place by solving a problem someone actually hit.** The sequence is: the default is wrong for a real tank, that is observed, and the setting is added to fix it.

### The recorded rejection, kept deliberately

V1 recorded a rejected proposal so it would not be revisited: a Setup field asking the user
for the movement they tolerate per element. Rejected on **two independent grounds, either
sufficient**:

1. It demands a judgement up front — asking a new user to decide the app's sensitivity before they have seen it behave once.
2. **One setting reaching into three separate arrival points is the shape of the defects the project had just spent two days removing** — "one input with three arrival points and no single owner", with a user setting at the top of it "so that no two tanks failed the same way."

**Ground 2 is canon `MASTER RULE 1` and `X-INV-004` argued from the product side**, in the
owner's own terms, before either V2 rule existed.

**And the rejection is not a rejection of the concern:** "If a tank's real behaviour shows a
rail or a trigger is wrong, the fix is to change it in canon, for everyone, with the
reasoning written down — where it can be argued with and tested — not to expose it as a
dial."

### Classification

`PORT_AS_IS` as a principle. The recorded rejection: `PORT_AS_IS` as a recorded rejection.

**V2 owner:** **none.** Nothing in V2 states what configuration may ask for.

---

## B7 — The refusal list

**V1 source:** `reef-chemistry.md` §12 — twenty-one enumerated things the app will not do.

### What V1 decided

A **single consolidated list** of refusals, each pointing at the section that justifies it.
The entries fall into recognisable families: evidence minima; refusing to act inside a
settle window; refusing to derive a figure from a broken mass balance; refusing to name a
cause it cannot see; the magnesium gate; rate rails and step caps; refusing to dose without
a net volume; refusing a target range outside the outer bounds; refusing to stretch a
window to manufacture a figure; refusing to compute a rate from readings too close
together; refusing to treat a step across a recorded kit change as real; refusing to
substitute a default for a missing measurement without saying so; refusing to tell a user
their test kit is wrong; and **refusing to judge one parameter by another parameter's
thresholds, trend logic or evidence bar.**

### Why the list itself matters, separately from its entries

**A consolidated refusal list is an artefact V2 does not have.** V2's refusals exist — the
reason-code catalogue, the capability contract's missing-data behaviours, the Alk open
issues' interim refusals — but they are distributed across documents, and no single page
answers *what will this product decline to do, and why.*

The list is also a **design instrument**: writing refusals down in one place is how V1
noticed that two of its own sections disagreed about the same refusal.

### Known problems

Every **entry** is V1 chemistry and carries V1 figures by reference. **None may cross into
V2 as written.**

### Classification

The **existence and format of a consolidated refusal list**: `PORT_WITH_CLEANUP` — worth
having in V2, rebuilt entirely from V2 canon.
The **entries**: `REFERENCE_ONLY`. Each must be re-derived from V2 canon, never copied.
The final entry — never judge one parameter by another's thresholds, trend logic or
evidence bar: `PORT_AS_IS` as a principle, and it is canon Part VIII's own "one engine does
not imply one algorithm" stated from the refusal side.

**V2 owner:** **none as a consolidated list.**

---

## B8 — Two structural conventions worth stealing

Neither is chemistry. Both are about how a specification behaves.

### B8.1 — "Enforcement — the honest state"

**V1 source:** `reef-chemistry.md` §14 and `wizard-states.md` §10, applied per section
throughout both documents.

Most V1 canon sections end with a subsection stating **what actually asserts this rule in
code today** — frequently "nothing yet, and that is stated rather than implied."

V1 added the convention because "this document once claimed enforcement it did not have."

**This is the single best structural idea in V1's specification practice**, and it is
directly applicable to V2, where the canon is frozen and largely unimplemented. A reader can
see the gap between what is decided and what is enforced without going to look.

**Classification:** `PORT_AS_IS` as a **canon convention**. V2's implementation package
already achieves something similar through its traceability matrix and coverage fixtures;
the per-section statement is a cheaper and more visible form of the same honesty.

### B8.2 — "In plain terms"

**V1 source:** both canon documents, per section.

Most sections close with a plain-English restatement addressed to the owner, who is not a
programmer. It is not a summary of the rule — it is the rule said in the language the
owner would use, which is what makes a specification reviewable by the person whose domain
it encodes.

**Classification:** `PORT_AS_IS` as a **documentation convention**, and worth considering
for V2's canon reissues and implementation contracts.

---

# PART C — WHAT V2 ALREADY OWNS

Recorded so nothing here is mistaken for unowned.

Canon's own V1→V2 coverage ledger already dispositions roughly sixty V1 concepts, and the
Alk canon carries a full V1-card-to-rule mapping. **The alkalinity family and the shared
architecture are owned and are not in this document.** Examples of V1 concepts already
carried, with V2 as the authority: position from the latest valid measurement; history
answering behavioural questions rather than position; maintenance and deliberate level
movement as separate concerns; stabilise-first; the opt-in return plan; one engine with
surfaces rendering; recommendation distinct from implementation; historical truthfulness;
expected response after a dose change; and the principle that odd readings are confirmed
rather than acted on.

Several V1 mechanisms are explicitly **replaced** by canon and must not be reintroduced
from this document: the first-match wizard state machine; the fixed universal analysis
window; raw reading count as evidence; percentage staging; confidence as a dose multiplier;
and the blanket water-change treatment.

---

# PART D — INDEX OF UNOWNED ITEMS

Every item below has **no V2 owner** at `7aaadef`.

| # | Item | Section | Would-be V2 owner |
|---|---|---|---|
| 1 | Phosphate, in full | A1 | Part VIII (stub) |
| 2 | Nitrate, in full | A2 | Part VIII (stub) |
| 3 | Calcium, in full | A3 | Part IV (stub) |
| 4 | Magnesium, in full — including the never-tuned rule and the gate | A4 | Part V (stub) |
| 5 | Salinity, in full | A5 | Part VIII (stub) |
| 6 | Ammonia, in full | A6 | Part VIII (stub) |
| 7 | pH and potassium; the watched-not-acted-on tier; the CO₂ signature | A7 | none |
| 8 | Ionic coupling and the dosing-separation guard | A8 | Part VI (stub) |
| 9 | Calcification and nutrient-production models | A8 | none |
| 10 | Dry-salt correction conversions | A8 | none |
| 11 | ICP reference ranges and kit cross-calibration | A8 | Part VII (stub) |
| 12 | The rate-of-change premise — **uncited** | A8 | none |
| 13 | Diurnal swing and reading comparability | A8 | none |
| 14 | **The notice lifecycle** | B1 | none |
| 15 | Wording rules 2–7 and the seven-check enforcement table | B2 | Part IX holds rule 1 only |
| 16 | The terminology registry and the colour registry | B3 | none |
| 17 | **The summary and headline rules** — prior art for PR #6 Gap 2 | B4 | none |
| 18 | The presentation vocabularies and their boundary arithmetic | B5 | Part I owns state dimensions only |
| 19 | The setup philosophy and its recorded rejection | B6 | none |
| 20 | The consolidated refusal list | B7 | none |
| 21 | The two specification conventions | B8 | none |

**Nothing in this index is scheduled, assigned or resolved by this document.** It is a
record, which is what `MASTER RULE 2` requires.
