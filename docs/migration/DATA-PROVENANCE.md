# Historical Data Provenance

This document records what the owner's historical Dosing Wizard records genuinely are,
how precise they are, what context is missing from them, and what may therefore be
computed from them.

It is a migration document. It does not define chemistry behaviour — `docs/canon/` does.
Where this document and the canon appear to conflict, the canon governs.

Four concepts are kept separate throughout, because collapsing them is how a genuine
measurement turns into a fabricated conclusion:

1. **measurement truth** — is the record real?
2. **time precision** — how exactly do we know when it happened?
3. **intervention/dose-context completeness** — do we know what was being done to the
   tank around it?
4. **analytical eligibility** — which analyses may consume it?

A record can be entirely truthful, imprecisely timed, missing its surrounding context,
and ineligible for a given analysis, all at once. These are independent properties.

---

## 1. Measurement truth

The following historical records are **owner-confirmed genuine**:

- historical chemistry readings;
- historical water-change records;
- historical ICP records;
- historical lighting records.

These are real observations of a real tank, made by the owner. They are not test
fixtures, not synthetic data and not estimates. They are preserved as recorded.

> **Three of those four rows are contested, and this document does not settle it.** The V1
> salvage reconnaissance found the historical **water-change, ICP and lighting** records
> byte-identical to named V1 source constants, and the owner's confirmation — which covers
> the **chemistry readings** explicitly — has not been extended to them. Both readings are
> live. See `V1-DATA-PROVENANCE.md` §5 and question Q9 in `V1-OPEN-OWNER-QUESTIONS.md`.
> **This note records the disagreement; it does not resolve it and it amends nothing above.**
> The chemistry readings are not in doubt.

Measurement truth is not conditional on anything below. A reading whose exact time is
unknown, or whose surrounding dosing context is missing, is still a genuine measurement
and is preserved as one.

Nothing in this document authorises altering, "cleaning" or reinterpreting a recorded
value. Values are preserved as the owner recorded them.

---

## 2. Time precision

**Most older readings are date-only.** The date is known; the time within that day is not.

**Missing times must never be fabricated.**

This means specifically:

- no defaulting an unknown time to midnight, midday, or any other placeholder that would
  later be read as a real timestamp;
- no inferring a time from a typical testing routine;
- no inferring a time from a record's file position or entry order;
- no assigning a timezone that was not recorded.

Time precision is carried explicitly with each record, so that a date-only record is
recognisable as date-only at every layer of the system. Date-only data stays date-only.

Consequences for analysis follow from this rather than from any separate rule: an
analysis whose correctness depends on intervals shorter than the recorded precision
cannot be run on records that lack that precision. It does not approximate.

**Amended by owner decision 30 — how that consequence is delivered.** The analysis is not
*refused*; the record is simply not one of its operands, and the engine says nothing about
having left it out. The keeper is not told which records were skipped or why. Where the
records that remain are too few, the ordinary insufficiency statements — not enough separate
tests yet, the tests do not yet cover enough days — are the whole of what is said. See canon
Part II §2.3A.1.

**The four prohibitions above are untouched by that amendment and remain absolute.** They are
what this section is for. Decision 30 relaxes what is *reported*; it relaxes nothing about
what may be *recorded*, and a date-only record still stays date-only at every layer,
including export and migration.

> **Superseded wording, preserved rather than deleted.** The consequence paragraph
> previously ended *"It refuses; it does not approximate."* The second half stands. The
> first half was the announcement, and it is what every screen built against this document
> faithfully reproduced.

---

## 3. Intervention and dose-context completeness

**Historical Alk/Ca/Mg maintenance-dose and dose-change coverage is materially incomplete
across much of the old period.**

For substantial stretches of history, the record does not establish what maintenance dose
was running, when it was changed, what corrections were administered, or what other
interventions were in progress between two readings.

**Missing dose history must never be reconstructed.** In particular:

- do not infer a past dose from observed chemistry movement;
- do not back-fill past dose settings from current settings;
- do not assume a dose was unchanged between two readings because no change was recorded;
- do not infer that an intervention did or did not occur from the shape of the data;
- do not manufacture intervention times, effective times or dose-change events.

Absence of a recorded dose change is **not** evidence that no dose change occurred. The
recording of dose changes was itself incomplete, so silence in the record carries no
information either way. Treating silence as "unchanged" would convert a gap into a
confident false premise, which is precisely the failure this section exists to prevent.

---

## 4. Analytical eligibility

Eligibility is decided per analysis, from what that analysis actually requires.

**Old Alk/Ca/Mg records remain available for:**

- history views;
- charts;
- reference and recollection;
- context displayed to the owner.

**Old Alk/Ca/Mg records are not controller evidence** for any analysis that requires the
missing dosing or intervention context. This includes:

- consumption inference;
- potency learning;
- dose-response reconstruction;
- historical controller replay.

The general test: if an analysis needs to know what was being done to the tank between
two readings, and that context is missing, the analysis is ineligible on those records.
It must decline, not degrade silently into an estimate.

This produces a deliberate and visible asymmetry — the product may **display** more
history than its engines are permitted to **reason over** — and the product must be able
to explain that difference to the owner rather than leaving it to look like a bug.

Eligibility is a property of the data, not a preference. It is not overridden because a
result would be convenient, because the chart "looks clear", or because a plausible
reconstruction is available.

---

## Current dataset status and cutover

The owner **is continuing to use V1**. V1 remains the live system and is not modified.

A **fresh dataset/export will be supplied at V2 real-use cutover**, and that export —
not any snapshot taken earlier — becomes the live migration baseline. Any dataset
captured before cutover is stale by definition and is used only for design and testing
work, never as the migration source of truth.

The provenance rules above apply to the fresh export exactly as they apply to any earlier
copy. A newer export does not repair the historical gaps it contains: records that were
date-only remain date-only, and periods lacking dose context still lack it.
