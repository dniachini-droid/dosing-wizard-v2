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
import { PROVENANCE, dateOnly, exactInstant, localOffsetMinutes, localZone } from "../store/time.js";

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
  const instant = at || nowIsoExact();
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

/* Mark an event as one that should not have been recorded. The record is not
   deleted — the ledger is append-only and the fold is what decides state. */
export async function markInvalid(store, eventId, note = null) {
  return store.ledger.annotate({
    type: ANNOTATION.MARK_INVALID,
    targetEventId: eventId,
    recordedAt: nowIsoExact(),
    note,
  });
}
