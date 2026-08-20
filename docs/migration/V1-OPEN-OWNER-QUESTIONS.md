# V1 Open Owner Questions

Questions V1 raised, worked up, and **never answered**. They arrive in V2 unowned.

**Nothing here is answered, and nothing here may be answered by an agent.** Each is a
product, chemistry or design judgement that belongs to the owner. A task that reaches one
of these and stops is behaving correctly.

This document is a record, not a plan. It carries no priority, no sequence and no
recommendation.

---

## Provenance

| | |
|---|---|
| V1 repository | `dniachini-droid/tank-wizard` |
| V1 commit read | `9276a2ca254e88d19e0f02dced42a1b896499780` |
| Primary V1 source | `.agent/needs-dan.md` item 15 (the live list at that commit), with the questions' full workups in `wizard-states.md` §25.6, `reef-chemistry.md` §30, and `.agent/stage-6a-gaps.md` |
| V2 base | `7aaadef02e15cf39d80e602fa5c0fa228d6eec09` |

---

## How this relates to V2's existing open-decision records

V2 already has two registers, and this is neither of them:

- **`docs/process/OPEN-OWNER-DECISIONS.md`** — open decisions about the V2 project and its process.
- **`docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md`** — open issues inside the frozen Alk domain, with interim refusal behaviour.

**This document is the third thing: questions inherited from V1 that no V2 register
contains.** None of them blocks the Alk domain. Several would need answering before the
surfaces they concern can be designed.

Where a question is genuinely chemistry, closing it means a **governed canon reissue**, not
an entry in a ledger. `CLAUDE.md` is explicit: `DECISIONS.md` is not chemistry authority.

---

## The eight live questions

### Q1 — What may a whole-tank summary claim when nothing is wrong?

**V1 reference:** `wizard-states.md` §25.1; `needs-dan.md` item 15.1 (V1's gap G-29).

V1 specified a three-slot tank headline where every slot drops when empty — so a quiet tank
produces a short line, **or none at all**. What it never decided is whether a quiet tank
may instead make a positive claim of the form "N of M in range", and if so what that claim
may count. The candidate wording was recorded when the health score was deleted and was
explicitly **not adopted**.

**Why it is not settled by anything else:** V1's own rule is that every clause of the
headline must be checkable against the tiles below it. A count claim is checkable; whether
it is *useful* or merely reassuring noise is the owner's judgement, and V1's ammonia
reasoning cuts the other way — a parameter that confirms it is fine every time is a line
the keeper stops reading.

**What it would change:** whether the most-read string in the product says anything on a
normal day.

---

### Q2 — Do the severity colours mean direction, or tier?

**V1 reference:** `wizard-states.md` §15 colour registry; `needs-dan.md` item 15.2.

V1 registered four severity colours and mapped them to **position tiers** — calm, raised,
alert, ungradeable. Elsewhere in the same app the same four colours meant **direction** —
one colour for below a minimum, another for above a maximum, regardless of severity.

**The same two colours therefore meant one thing on a verdict and another on a chip** —
which is the fault the registry exists to prevent, one level down from words.

V1 costed three options and adopted none: move the direction-keyed usage onto the tier
reading; keep direction there but stop using the registered severity colours for it; or
register a name for the distinction so both may coexist.

**Why it must not be answered in code:** V1 recorded that a direction-keyed mapping
**cannot escalate** — a lethal low and a mildly low render identically, which is the exact
failure the tier mapping was added to stop.

**What it would change:** every coloured element in the product.

---

### Q3 — Which evidence bar governs a movement claim where two could apply, and does claiming a change *worked* use the same bar as claiming it is being *contradicted*?

**V1 reference:** `reef-chemistry.md` §30, "What this section does not settle";
`needs-dan.md` item 15.3.

Two sub-questions, left open together and deliberately:

- V1 had **two** instruments for a movement claim — a run of consecutive readings in one direction clearing a noise floor, and a statistical gate over a fitted line. Where both could apply, V1 never decided which governs. It recorded why answering by implication was dangerous: "that is how a fifth engine gets built."
- V1's bar for claiming a dose change is being **contradicted** is deliberately lower than its bar for establishing movement from nothing, because "a dose change creates an expectation, so breaking it is informative immediately." Whether claiming a change **worked** uses that same lower bar, or stays a separate stability question, was never decided.

**V2 status:** the alkalinity family is answered by frozen canon. **For every other
parameter it is open**, and it is chemistry — so closing it means a canon reissue.

---

### Q4 — Should a per-user override exist on a cross-parameter safety threshold?

**V1 reference:** `reef-chemistry.md` §10; `needs-dan.md` item 15.4.

V1 shipped a **live per-user override** on the magnesium gate's alert threshold, with **no
configuration field and no canon entry**. It was reachable only by editing stored settings
directly, and it moved a threshold that withholds dosing advice.

V1 flagged it as needing "a second look" once a range change made the underlying floor
load-bearing on the shipped defaults rather than theoretical.

**Two questions, and V1 answered neither:** should a safety threshold be user-overridable
at all; and if not, what happens to a stored override on an existing user's data at
migration.

**Why it belongs here rather than being deleted quietly:** it is a chemistry threshold, so
its existence or removal is canon's, and its migration treatment is the owner's.

---

### Q5 — Is a gradual return to a range a *return plan* or a *correction*?

**V1 reference:** `reef-chemistry.md` §28; `wizard-states.md` §24.23, §25.6 item 7;
`needs-dan.md` item 15.5.

V1 registered a specific phrase for the opt-in mechanism that walks a level back into
range, and offered it only for a level that is **stable and out of range**. But one card —
the far-out case — used the registered return-plan phrase while describing a situation that
is usually **neither stable nor still**, and where V1's own rules say the instrument is a
correction.

**Either that card uses the wrong registered phrase, or the condition for offering a return
plan needs widening.** V1 recorded both readings and adopted neither.

**V2 status:** canon owns return plans and corrections for alkalinity as mechanisms. **The
question is a wording-and-eligibility question at the surface**, and Part IX does not
answer it.

---

### Q6 — What is a task?

**V1 reference:** `wizard-states.md` §25.6 item 8; `needs-dan.md` item 15.6.

V1 decided that Tasks was the **home** for app-level notices — things the app wants the
user to do about the *app*, as distinct from things the tank needs. It never decided the
**design**:

- how a notice becomes a task — does the app write one into the list, or is it rendered from the notice?
- can a task be **completed**, or only **resolved** by fixing the underlying thing?
- how do app-generated entries sit beside the keeper's own reminders in one list?

V1 recorded: "**Tasks is decided as the home, not as the design.** This is the whole
specification of a surface, and it is not written."

**Why this one matters now.** `docs/migration/V1-APPLICATION-SALVAGE.md` §12 records that
the entire tasks-and-calendar area is missing from the build-one screen set. If it is
brought in, **this question is in the way of designing it**, and it is unowned.

---

### Q7 — Is a classifier handed the raw series, or the series with known interventions removed?

**V1 reference:** `wizard-states.md` §25.6 item 9; `needs-dan.md` item 15.7;
`.agent/stage-6a-gaps.md` finding T-5.

V1's canon fitted trend, direction and consumption over a series with **logged corrections
subtracted**. But a classifier handed a bare list of readings has neither the corrections
nor the dose figures needed to subtract them, so V1's implementation fitted whatever it was
given and documented that the caller should pass the adjusted series.

V1 recorded the consequence precisely: wiring the classifier to raw readings makes its
movement claim **disagree with the engine's trend on any tank with a logged correction** —
"which is exactly the class of disagreement the position rule was written to end."

**V1 called it an interface question, not a chemistry one.** In V2 it is arguably answered
in principle by `X-INV-004` and `DEC-003` — one analytical owner, and no component
recomputing chemistry. **Recorded rather than assumed**, because V1's version of the
question was about which *series* crosses the boundary, not about who computes.

---

### Q8 — How often should salinity be tested?

**V1 reference:** `reef-chemistry.md` §4; `wizard-states.md` §25.6 item 10;
`needs-dan.md` item 15.8.

V1 gave salinity an analysis window, a rate threshold, an alert tier, a rate rail and an
out-of-band margin — **and left its test cadence blank.**

The blank is deliberate. V1's cadence column feeds an evidence rule about *dose changes*,
and salinity has no dose, so nothing was blocked. But the table has two columns and one of
salinity's was empty, and V1 refused to fill it: "a figure invented to fill a column is
exactly what an earlier per-kit table was."

**This is chemistry.** Closing it means a canon reissue, not a ledger entry.

---

## The two noted-not-decided items

V1 recorded these as **implementable as they stand** — its implementation had chosen a
reading — while noting that the choice was derived rather than decided. They are listed so
the derivation is not mistaken for a decision.

### N1 — Do span requirements written for a *rate* also reach a *movement* claim?

**V1 reference:** `.agent/stage-6a-gaps.md` finding Q-1.

V1 held two data-adequacy requirements — a minimum number of readings spanning a minimum
number of days, and a refusal to compute a rate from readings closer together than a
minimum interval. Both were written for **consumption rate**. Whether they also gate a
**movement** claim was never stated.

V1's own worked example happens to sit inside both requirements, "which is the reason to
ask" — the example cannot distinguish the readings.

### N2 — Does the reading taken *at* a recorded equipment change belong to the old series or the new?

**V1 reference:** `.agent/stage-6a-gaps.md` finding Q-3.

V1 treated it as the **fresh baseline** — the first reading of the new series — and recorded
that this was derived from a worked example rather than decided in terms.

**V2 relevance:** canon owns confirmed consumption-context changes and potency-context
events for alkalinity. Whether the boundary reading belongs to the segment before or after
is the same question in V2's vocabulary, and it is worth checking against the frozen rules
rather than assumed.

---

## One question this migration added

### Q9 — Are the historical water-change, ICP and lighting records the owner's own?

**Source:** `docs/migration/V1-DATA-PROVENANCE.md` §5.

The owner has confirmed that the **chemistry readings** are real measurements. That
correction has **not** been extended to three further datasets — 25 water-change records,
2 ICP panels and 1 lighting note — which the V1 salvage reconnaissance found byte-identical
to named V1 source constants.

**Two live readings, neither adopted:** either the owner entered these and the constants
were built from them (which is what V1's own note about the water-change seed suggests), or
they are app-generated defaults.

**One question closes all three.** Nothing downstream is blocked by it: the analytical paths
that would consume water-change events over that period are already unavailable for want of
dose history, and the migration baseline is a fresh export at cutover.

**Why it is recorded rather than resolved:** `docs/migration/DATA-PROVENANCE.md` §1
currently lists all three as owner-confirmed genuine, and the reconnaissance found
otherwise. **The two disagree, and this migration does not adjudicate between them.**

---

## Summary

| # | Question | Kind | Blocking? |
|---|---|---|---|
| Q1 | What a quiet tank's summary may claim | Product | No |
| Q2 | Severity colours — direction or tier | Design | No, but reaches every coloured element |
| Q3 | Which evidence bar governs; and does "worked" use the contradiction bar | **Chemistry** — canon reissue | Answered for Alk; open for every other parameter |
| Q4 | Per-user override on a cross-parameter safety threshold | **Chemistry** + migration | No |
| Q5 | Return plan or correction, at the far-out case | Product wording | No |
| Q6 | What a task is | Product | **Yes, for any tasks/calendar design** |
| Q7 | Raw series or intervention-adjusted series across the boundary | Interface | No |
| Q8 | Salinity test cadence | **Chemistry** — canon reissue | No |
| N1 | Do rate-span requirements reach a movement claim | **Chemistry** | No — a reading was derived |
| N2 | Which side of an equipment change the boundary reading belongs to | **Chemistry** | No — a reading was derived |
| Q9 | Provenance of water-change, ICP and lighting records | Data provenance | No |

**Eleven items. None answered here.**
