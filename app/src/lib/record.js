/* ============================================================================
   EVERY WRITE INTO V2's LEDGER, IN ONE PLACE
   ----------------------------------------------------------------------------
   `adapt.js` is the read side of the rewiring; this is the write side. A
   ported screen calls a function here and never constructs an event itself.

   Two reasons, and the second is the one that matters.

   The first is ordinary: the ledger's envelope has required fields with exact
   meanings — `time` versus `recordedAt`, `effectiveTime`, `effectiveAtConfidence`
   — and thirteen screens each assembling one is thirteen chances to get it
   subtly wrong.

   The second is that some of those fields are LOAD-BEARING for the engine's
   honesty. `recordedAt` is when the app was told and is always exact.
   `time` is when the thing happened and may be date-only. Conflating them is
   how a date-only reading acquires a fabricated timestamp, which
   `DATA-PROVENANCE.md` forbids by name. Keeping the construction here means
   there is one place to read to check that it never happens, and one place a
   test has to cover.

   THE LOGGING RULE, AS THE BRIEF STATES IT

   "Value, date, time, save. Date and time pre-filled with now ... There is no
   time-provenance question."

   There is none because a live entry does not need one: the keeper gives a
   date and a time, the device supplies the offset that was actually in force,
   and `exactInstant` produces `EXACT_ABSOLUTE`. Provenance is a question only
   for records that arrive from somewhere else, which is the importer's
   business and not a form's.

   A reading logged in this app has a time because its form has a time box in
   it, so `recordReading` and `recordDoseChange` produce `EXACT_ABSOLUTE`. The
   lighting, note and ICP forms have no time box, so they produce `DATE_ONLY`
   and carry no instant at all — not midnight, not midday, absent.

   The keeper's 325 date-only readings come from the import, keep their
   provenance, and are never improved.
   ========================================================================= */

import { ANNOTATION, KIND, SOURCE } from "../store/ledger.js";
import { PROVENANCE, assignedDayInstant, dateOnly, exactInstant, localOffsetMinutes, localZone, nowIso } from "../store/time.js";

/* THE KEEPER GAVE A DATE AND A TIME. The device supplies the offset that was
   actually in force, so the instant is provable rather than assumed. */
function stamp(date, time) {
  return exactInstant(date, time, localOffsetMinutes(new Date()), localZone());
}

/* THE KEEPER GAVE A DATE AND THE FORM NEVER ASKED FOR A TIME.

   This is the branch that was missing, and its absence was a fabrication:
   three recorders below wrote `stamp(date, "12:00")`, which produces
   `EXACT_ABSOLUTE` and an `absoluteInstant` at noon on a record whose form has
   no time box in it at all. `DATA-PROVENANCE.md` §61 forbids exactly that —
   "no defaulting an unknown time to midnight, midday, or any other placeholder
   that would later be read as a real timestamp" — and `store/time.js` exists
   so that the defect is unrepresentable rather than merely forbidden.

   It was representable because this file reached past `dateOnly` and handed
   `exactInstant` a literal. The ledger is append-only, so every noon written
   that way would have been permanent and indistinguishable from a real one.

   Which of the two a recorder uses follows from its FORM: a form with a time
   box calls `stamp`, a form without one calls `undated`. There is no third
   option and no default. `PORT-10` drives every recorder and checks it. */
function undated(date) {
  return dateOnly(date);
}

/* A READING whose form had no time box — OWNER DECISION 31.

   A third constructor rather than a change to `undated`, and the split is the
   decision's own: it names READINGS. `undated` is still what a lighting note or
   a water change gets, because assigning nine in the morning to a dose change
   would turn `effectiveAtConfidence` from `UNCERTAIN` into `EXACT` and assert an
   hour nobody stated — see `store/import-v1.js` `timeFor` for why that one
   matters more than it looks.

   Which of the three a recorder uses still follows from its FORM and from what
   it is recording. There is still no default. `PORT-10` drives every recorder
   and checks it. */
function undatedReading(date) {
  return assignedDayInstant(date, localOffsetMinutes(new Date()), {
    appliedAt: nowIsoExact(),
    zoneId: localZone(),
  });
}

const nowIsoExact = () => new Date().toISOString();

/* A reading. Four elements went in; four elements come out. */
export async function recordReading(store, { param, value, date, time }) {
  if (!(typeof value === "number" && Number.isFinite(value))) {
    throw new Error("a reading needs a number");
  }
  return store.ledger.append({
    kind: KIND.READING,
    parameter: param,
    rawValue: value,
    normalizedValue: value,
    time: stamp(date, time),
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
  });
}

/* A dose change. `effectiveAtConfidence` is `EXACT` because the form asked for
   a date and a time and the keeper answered; `makeEvent` refuses an event that
   does not state it, and there is deliberately no default. */
export async function recordDoseChange(store, { parameter = null, fromMlPerDay, toMlPerDay, date, time }) {
  const at = stamp(date, time);
  return store.ledger.append({
    kind: KIND.DOSE_CHANGE,
    parameter,
    time: at,
    effectiveTime: at,
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: {
      fromMlPerDay,
      toMlPerDay,
      effectiveAtConfidence: "EXACT",
    },
  });
}

/* A water change. The engine's input is `changedFraction`, not litres, so the
   litres the keeper typed are divided by the net volume he set — arithmetic
   over two of his own numbers, done once, here. With no net volume recorded
   there is no fraction to state and the event carries none; the engine then
   says what it cannot conclude, which is the honest outcome. */
export async function recordWaterChange(store, { date, time, litres, netVolumeL }) {
  const at = stamp(date, time);
  const changedFraction =
    Number.isFinite(netVolumeL) && netVolumeL > 0 ? litres / netVolumeL : null;
  return store.ledger.append({
    kind: KIND.WATER_CHANGE,
    time: at,
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: { litres, changedFraction },
  });
}

/* A one-off addition by hand. Alkalinity's, in this build — see the note on
   the form in `Tasks.jsx` for why it is not offered for anything else. */
/* THE DOSE IN FORCE, AS THE KEEPER STATES IT IN SETUP.

   The application had no way to say this at all, and the consequence was the
   whole of round three's stage 1: with a V1 history whose dose rows carry a
   date and no time of day, EVERY dose event reached the engine with
   `effectiveAt: null` — the engine keeps only dose events it can place on a
   clock — so it reported "the app has no record of what was being dosed" while
   the same screen displayed the dose. Measured, not assumed.

   This is the input the engine was missing and the app genuinely lacked. It is
   not a workaround for the date-only dose rows: those stay unreadable and are
   recorded as an open contract gap. It is a keeper stating a present fact —
   "my doser is set to 8.80 mL/day" — at a moment that is genuinely known,
   which is the moment he says it. The instant is therefore real and
   `EXACT`; nothing is back-dated and nothing is inferred.

   `dosing.py` is explicit that this is a first-class shape rather than a
   degraded one: "A `DOSE_STATE` is a declaration of the standing rate; one of
   them inside the window says the interval is uniform", written for "the
   commonest first-run ledger there is (a few back-entered readings, then
   'here is what my doser is set to')." */
export async function recordDoseState(store, { parameter = "ALK", doseMlPerDay, at = null }) {
  if (!(typeof doseMlPerDay === "number" && Number.isFinite(doseMlPerDay))) {
    throw new Error("a standing dose needs a number");
  }
  /* THE APP'S CLOCK, NOT THE WALL CLOCK — AND THE DIFFERENCE IS NOT COSMETIC.

     `store/time.js` owns "what moment is the app being asked about", and test
     mode is exactly the case where that is not `new Date()`. Stamped from the
     wall clock, a standing dose recorded while the app's instant sits in March
     is effective in August; `happenedBy` then filters it out of every
     assessment, and the engine reports that it has no record of what is being
     dosed — the precise defect this field was added to fix, reappearing inside
     the test mode restored in the same round. Measured: zero events reaching
     the engine.

     `recordedAt` below stays the wall clock, and must: it is when the app was
     TOLD, the app genuinely was running at that instant, and `ledger.js` says
     so in as many words. `time` and `effectiveTime` are not `recordedAt`. */
  const instant = at || nowIso();
  const time = Object.freeze({
    timeProvenance: PROVENANCE.EXACT_ABSOLUTE,
    absoluteInstant: instant,
    localDate: instant.slice(0, 10),
    localTime: instant.slice(11, 16),
    displayTimeZoneId: localZone(),
  });
  return store.ledger.append({
    kind: KIND.DOSE_STATE,
    parameter,
    time,
    effectiveTime: time,
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: {
      doseMlPerDay,
      /* The keeper is stating what is running NOW. He knows that to the
         minute, so the record says so rather than hedging — and `M-5` is
         entitled to read it as a clean boundary. */
      effectiveAtConfidence: "EXACT",
      origin: "MANUAL",
    },
  });
}

export async function recordOneOff(store, { amountMl, date, time }) {
  const at = stamp(date, time);
  return store.ledger.append({
    kind: KIND.MANUAL_CORRECTION,
    parameter: "ALK",
    time: at,
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: { amountMl },
  });
}

/* A lighting change. `HUSBANDRY` with a kind on it, because the ledger's
   husbandry family is the application's own and the engine is never sent one. */
export async function recordLightingChange(store, { date, note }) {
  return store.ledger.append({
    kind: KIND.HUSBANDRY,
    /* Date only. The form asks for a date and nothing else, so the record says
       a date and nothing else. */
    time: undated(date),
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: { husbandryKind: "LIGHTING", note: note || null },
  });
}

/* Anything that changed what the tank uses — new corals, a loss. Kept with its
   date and shown against the history. Nothing reads it. */
export async function recordNote(store, { date, note }) {
  return store.ledger.append({
    kind: KIND.NOTE,
    /* Date only. The form asks for a date and nothing else, so the record says
       a date and nothing else. */
    time: undated(date),
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: { note },
  });
}

/* An ICP panel. A multi-element lab result, stored whole. The Alk engine has
   no input vocabulary for it and is never sent one. */
export async function recordIcpPanel(store, { date, note, elements }) {
  return store.ledger.append({
    kind: KIND.ICP_PANEL,
    /* Date only. The form asks for a date and nothing else, so the record says
       a date and nothing else. */
    time: undated(date),
    recordedAt: nowIsoExact(),
    source: SOURCE.KEEPER_ENTRY,
    detail: { note: note || null, elements },
  });
}

/* CORRECT A READING THAT WAS TYPED WRONG.

   `PORT-OMISSIONS.md` calls this "the most useful thing on this list" and the
   most serious loss in the port: type 89 instead of 8.9 and it was in the
   ledger permanently, skewing every chart and every assessment, with no
   surface anywhere in the build to fix it.

   The mechanism the canon already provides is supersession, and it is the
   whole of what happens here. The original is NOT overwritten and is NOT
   deleted: it stays in the ledger exactly as it was written, and a new reading
   is appended naming it. The projection then folds the old one to `SUPERSEDED`
   and the new one is what the app reads. Every assessment already stored still
   names the event it actually used, so what the app said last week remains
   true of the record it said it about.

   TIME PROVENANCE STILL MAY NOT IMPROVE. A correction to a date-only reading
   is itself date-only; the store refuses anything else (`assertProvenanceNotImproved`,
   `PORT-12`, `TIME-02`) and this function does not try. Correcting the VALUE
   is not new information about WHEN, and a form that offered a time box here
   would be offering to fabricate one. */
export async function correctReading(store, { eventId, param, value, date, time = null, note = null }) {
  if (!(typeof value === "number" && Number.isFinite(value))) {
    throw new Error("a reading needs a number");
  }
  /* OWNER FINDING 17: THE RECORD HOLDS THE CORRECTED VALUE. NO SUPERSEDE CHAIN.

     This used to append a new event carrying `supersedes: eventId`, leaving the
     original in the ledger folded to SUPERSEDED. The owner wants what every
     other app he uses does: he typed it wrong, he fixes it, and the record says
     what he meant. So the stored event is rewritten in place and nothing is
     appended.

     `param` is not written back. Correcting a value is not a statement that the
     reading was of a different parameter, and a form that let it change one
     would be offering to turn an alkalinity reading into a calcium one by
     editing a number. */
  return store.ledger.replace(eventId, {
    rawValue: String(value),
    normalizedValue: value,
    /* The form offers a time box only where the original had one, so this
       branches on what is being corrected rather than on what was typed. */
    time: time ? stamp(date, time) : undatedReading(date),
    source: SOURCE.KEEPER_CORRECTION,
    ...(note ? { detail: { note } } : {}),
  });
}

/* DELETE A RECORD. It is gone — owner decision 32.

   This replaced `markInvalid`, which annotated the record and erased nothing.
   There is no note to record because there is nothing left for a note to be
   about, and no annotation type to record it with: `MARK_INVALID` is gone from
   the vocabulary (`store/ledger.js`).

   Every assessment that read the record goes with it, which is the owner's own
   requirement — an assessment describing a past that no longer exists is a
   worse artefact than no assessment. `store/assessments.js` `forgetEvent` owns
   that half; this function calls it so that a caller cannot do one without the
   other. */
export async function deleteRecord(store, eventId) {
  const { removed, event } = await store.ledger.remove(eventId);
  if (!removed) return { removed: false };
  const assessments = await store.assessments.forgetEvent(eventId);
  return { removed: true, event, assessments };
}
