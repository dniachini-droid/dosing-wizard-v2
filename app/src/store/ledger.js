/* ============================================================================
   THE EVENT LEDGER — APPEND-ONLY
   ----------------------------------------------------------------------------
   Nothing in here is ever overwritten in place. A correction is a new event
   that points at the one it replaces; marking a reading suspect is a new
   annotation, not a flag written onto the reading. The original record is
   still there afterwards, byte for byte, and can still be read.

   That is not fastidiousness. Canon §64 makes replay a contract: the same
   ledger, the same configuration versions and the same engine version must
   give the same answer. An edit in place destroys the input a stored
   assessment was computed from, and the assessment then claims a working that
   can no longer be reproduced. `DEC-003` requires every recommendation to be
   reproducible by replaying its inputs.

   Two record types, in two stores.

     events       observations and states — what happened to the tank
     annotations  what the keeper later said ABOUT an event

   The current view is a fold of the second over the first. `project()` does
   that fold and is the only way anything reads a status; there is no `status`
   column anywhere, because a column can be written to.
   ========================================================================= */

import { EVENTS, ANNOTATIONS } from "./db.js";
import { PROVENANCE, assertProvenanceNotImproved, dayOf, hasExactInstant } from "./time.js";

import { t } from "../strings.js";

export const SCHEMA_VERSION = 1;

/* The event families. The first eight are the engine's — the names and
   required fields are `EXECUTABLE-FIXTURE-FORMAT.md` §4.1's, which in turn are
   the data contract's. The last three are the application's own and are never
   sent to the engine. */
export const KIND = Object.freeze({
  READING: "READING",
  DOSE_STATE: "DOSE_STATE",
  DOSE_CHANGE: "DOSE_CHANGE",
  WATER_CHANGE: "WATER_CHANGE",
  MANUAL_CORRECTION: "MANUAL_CORRECTION",
  DELIVERY_ANOMALY: "DELIVERY_ANOMALY",
  CONSUMPTION_CONTEXT_EVENT: "CONSUMPTION_CONTEXT_EVENT",
  ICP_PANEL: "ICP_PANEL",
  HUSBANDRY: "HUSBANDRY",
  NOTE: "NOTE",
});

export const ANNOTATION = Object.freeze({
  SUPERSEDES: "SUPERSEDES",
  MARK_SUSPECT: "MARK_SUSPECT",
  MARK_INVALID: "MARK_INVALID",
  WITHDRAW: "WITHDRAW",
});

export const SOURCE = Object.freeze({
  KEEPER_ENTRY: "KEEPER_ENTRY",
  KEEPER_CORRECTION: "KEEPER_CORRECTION",
  ENGINE_SUGGESTION_ACCEPTED: "ENGINE_SUGGESTION_ACCEPTED",
  SETUP: "SETUP",
});

/* Parameters. Alkalinity is assessed; the rest are logged with exactly the
   same envelope, the same time provenance and the same storage, and are simply
   not assessed. When their engines arrive they return results into the same
   slot with no schema migration, because nothing about their storage says
   "unassessed" — that is a fact about which engines exist, not about the data.

   Ranges are deliberately absent for every parameter here. A target range is a
   band edge, band edges are chemistry, and chemistry comes from the canon and
   from nothing else. Alkalinity's range is in the keeper's configuration
   because the canon's `targetRangeMinDkh`/`targetRangeMaxDkh` are configuration
   inputs to the engine. No other parameter has one, so no other parameter is
   drawn with one. */
export const PARAMETERS = Object.freeze([
  /* `label` is a lookup, not a literal: the name the keeper reads lives in the
     strings file like every other. `unit` is a symbol rather than prose and
     stays here, beside the decimals it belongs with. */
  { key: "ALK", unit: "dKH", decimals: 2, tone: "alk", assessed: true },
  { key: "CA", unit: "mg/L", decimals: 0, tone: "ca", assessed: false },
  { key: "MG", unit: "mg/L", decimals: 0, tone: "mg", assessed: false },
  { key: "NO3", unit: "mg/L", decimals: 2, tone: "no3", assessed: false },
  { key: "PO4", unit: "mg/L", decimals: 3, tone: "po4", assessed: false },
  { key: "SAL", unit: "ppt", decimals: 1, tone: "sal", assessed: false },
  /* pH and potassium exist here because the keeper's own history contains 17
     and 13 of them respectively, and the import's rule is that every reading
     comes across as the real measurement it is. A parameter this list does not
     name is a reading that cannot be stored truthfully at all.

     Adding one is not a chemistry decision and does not become one. This list
     carries no range, no threshold and no cadence for any parameter — the
     comment above says why — so a row here states only that the keeper
     measures the thing and how it is written down. pH has no unit because pH
     has no unit; `decimals` is where the display rounds, and display rounding
     never enters a calculation (`ALK-V2-DATA-CONTRACT.md` §0). */
  { key: "PH", unit: "", decimals: 2, tone: "ph", assessed: false },
  { key: "K", unit: "mg/L", decimals: 0, tone: "k", assessed: false },
]);

export function parameterDef(key) {
  const def = PARAMETERS.find((p) => p.key === key);
  return def ? { ...def, label: t(`parameter.${def.key}`) } : null;
}

/* Every parameter, with its label resolved. Screens use this rather than
   `PARAMETERS` so no screen ever holds a parameter name. */
export function parameterDefs() {
  return PARAMETERS.map((p) => ({ ...p, label: t(`parameter.${p.key}`) }));
}

/* --- identity ------------------------------------------------------------
   An event id must be unique, and must sort in creation order so `INV-A1`'s
   total order `(absoluteInstant, eventOrdinal, eventId)` is well defined even
   for two events recorded in the same millisecond. A counter inside the
   millisecond does that without a random source.

   The counter is MONOTONIC rather than merely per-millisecond, and the
   difference is not academic. A counter that resets whenever the millisecond
   changes collides the moment two events share a millisecond with a different
   one recorded between them — append at 09:00:00.000, then at 09:00:01.000,
   then at 09:00:00.000 again, and the third gets the first's id. That is not
   hypothetical: a correction carries the recorded time of the correction while
   the events around it carry their own, so the sequence is routinely
   out of order. The first version of this function had exactly that defect and
   a test found it.

   So the issued value never goes backwards. The id is an identity and a
   creation-order key; `recordedAt` is the field that carries when the app was
   told, and it is unaffected. */
let withinMs = 0;
let highestMs = 0;

export function newEventId(recordedAtMs) {
  if (recordedAtMs > highestMs) {
    highestMs = recordedAtMs;
    withinMs = 0;
  } else {
    withinMs += 1;
  }
  return `${String(highestMs).padStart(14, "0")}-${String(withinMs).padStart(4, "0")}`;
}

/* --- appending -----------------------------------------------------------

   `recordedAt` is when the app was told, and it is always exact — the app
   genuinely does know when it was running. `time` is when the thing HAPPENED,
   and it may be date-only. Conflating the two is how a date-only reading
   acquires a fabricated time, so they are two separate fields with two
   separate meanings and neither is ever derived from the other. */
export function makeEvent({
  kind,
  parameter = null,
  rawValue = null,
  normalizedValue = null,
  unit = null,
  time,
  recordedAt,
  effectiveTime = null,
  source = SOURCE.KEEPER_ENTRY,
  supersedes = null,
  ordinal,
  detail = {},
}) {
  if (!KIND[kind]) throw new Error(t("err.unknownEventKind", { kind }));
  if (!time || !time.timeProvenance) throw new Error(t("err.eventNeedsTime"));
  if (!recordedAt) throw new Error(t("err.eventNeedsRecordedAt"));

  /* A dose event must SAY how sure it is of when it took effect.

     `ALK-V2-DATA-CONTRACT.md:250` marks `effectiveAtConfidence` `REQ`, and it
     matters: `UNCERTAIN` confounds every straddling interval (`M-5`), which is
     the difference between a response the engine will attribute and one it
     will not. `toEngineEvents` used to supply `|| "EXACT"` for an absent
     value, which asserts certainty the keeper never expressed — the same class
     of defect as giving a date-only reading a midnight timestamp.

     The fix is not a better default. It is that there is no default: the
     caller states it, and an event that does not is refused here rather than
     silently improved on the way out. */
  if (kind === KIND.DOSE_STATE || kind === KIND.DOSE_CHANGE) {
    const c = detail.effectiveAtConfidence;
    if (c !== "EXACT" && c !== "UNCERTAIN") {
      throw new Error(t("err.doseNeedsConfidence", { kind }));
    }
    if (c === "UNCERTAIN" && !(detail.effectiveAtEarliest && detail.effectiveAtLatest)) {
      /* `REQ*` at contract line 251: UNCERTAIN without bounds gives the engine
         nothing to resume a clean segment after. */
      throw new Error(t("err.uncertainNeedsBounds"));
    }
  }

  const recordedMs = Date.parse(recordedAt);
  if (!Number.isFinite(recordedMs)) throw new Error(t("err.recordedAtNotInstant"));

  return Object.freeze({
    eventId: newEventId(recordedMs),
    schemaVersion: SCHEMA_VERSION,
    kind,
    parameter,
    /* Raw is what the keeper typed, kept as they typed it. Normalized is the
       number in the canonical unit. They are stored separately so a later unit
       change cannot silently reinterpret the original entry, and so "8.70" and
       "8.7" stay distinguishable as things a person wrote. */
    rawValue,
    normalizedValue,
    unit,
    time,
    recordedAt,
    /* Only where it genuinely differs — a dose change made at 9am and entered
       at 9pm. Absent, not equal-to-eventTime, when there is no difference. */
    effectiveTime,
    source,
    /* The event this one replaces. The replaced event is not touched. */
    supersedes,
    /* `INV-A1`'s middle sort key: append order, so two events at the same
       instant still have one total order and replay is deterministic. */
    eventOrdinal: ordinal,
    detail: Object.freeze({ ...detail }),
  });
}

export function makeAnnotation({ type, targetEventId, recordedAt, ordinal, note = null }) {
  if (!ANNOTATION[type]) throw new Error(t("err.unknownAnnotation", { type }));
  if (!targetEventId) throw new Error(t("err.annotationNeedsTarget"));
  return Object.freeze({
    annotationId: newEventId(Date.parse(recordedAt)),
    schemaVersion: SCHEMA_VERSION,
    type,
    targetEventId,
    recordedAt,
    annotationOrdinal: ordinal,
    note,
  });
}

/* --- the store ----------------------------------------------------------- */

export function createLedger(backend) {
  async function nextOrdinal(store, key) {
    const keys = await backend.keys(store);
    return keys.length;
  }

  async function append(spec) {
    const ordinal = await nextOrdinal(EVENTS);
    const ev = makeEvent({ ...spec, ordinal });

    if (ev.supersedes) {
      const prior = await backend.get(EVENTS, ev.supersedes);
      if (!prior) throw new Error(t("err.supersedeMissing"));
      /* THE rule. A correction may change a value, a note, anything the keeper
         actually knows better — but it may not turn a record whose time was
         never known into one that claims a time. */
      assertProvenanceNotImproved(prior.time, ev.time);
      if (await backend.get(EVENTS, ev.eventId)) {
        throw new Error(t("err.idCollision"));
      }
    }
    if (await backend.get(EVENTS, ev.eventId)) throw new Error(t("err.idCollision"));
    await backend.put(EVENTS, ev.eventId, ev);
    if (ev.supersedes) {
      /* The supersession is ALSO an annotation, so the fold sees it without
         having to scan every event for a back-pointer, and so the two ways of
         learning that an event was replaced can never disagree. */
      const aOrd = await nextOrdinal(ANNOTATIONS);
      const ann = makeAnnotation({
        type: ANNOTATION.SUPERSEDES,
        targetEventId: ev.supersedes,
        recordedAt: ev.recordedAt,
        ordinal: aOrd,
        note: ev.eventId,
      });
      await backend.put(ANNOTATIONS, ann.annotationId, ann);
    }
    return ev;
  }

  async function annotate(spec) {
    const ordinal = await nextOrdinal(ANNOTATIONS);
    const target = await backend.get(EVENTS, spec.targetEventId);
    if (!target) throw new Error(t("err.annotateMissing"));
    const ann = makeAnnotation({ ...spec, ordinal });
    await backend.put(ANNOTATIONS, ann.annotationId, ann);
    return ann;
  }

  async function allEvents() {
    return sortLedger(await backend.all(EVENTS));
  }

  async function allAnnotations() {
    const list = await backend.all(ANNOTATIONS);
    return list.sort((a, b) => a.annotationOrdinal - b.annotationOrdinal);
  }

  async function projection() {
    return project(await allEvents(), await allAnnotations());
  }

  return { append, annotate, allEvents, allAnnotations, projection, backend };
}

/* `INV-A1`: the total order is `(absoluteInstant, eventOrdinal, eventId)`. A
   date-only event has no absolute instant, so it orders by its calendar day at
   the start of the day FOR DISPLAY ONLY — never for elapsed time, which the
   engine refuses to compute for it. */
export function sortLedger(events) {
  const key = (e) => {
    if (e.time && e.time.absoluteInstant) return Date.parse(e.time.absoluteInstant);
    if (e.time && e.time.localDate) return Date.parse(e.time.localDate + "T00:00:00Z");
    return 0;
  };
  return [...events].sort(
    (a, b) =>
      key(a) - key(b) ||
      a.eventOrdinal - b.eventOrdinal ||
      (a.eventId < b.eventId ? -1 : a.eventId > b.eventId ? 1 : 0)
  );
}

/* The fold. Returns a view; the stored records are untouched and the view is
   rebuilt from them every time, so there is no second copy to fall out of step.

   `state` is derived, never stored:

     CURRENT     nothing later says otherwise
     SUPERSEDED  a later event replaced it — still in the record, still readable
     SUSPECT     the keeper flagged it; kept, and the engine still sees it
     INVALID     the keeper says it should not have been recorded

   SUSPECT and INVALID are the keeper's judgements about their own data. What
   they DO to an assessment is a chemistry question with no canon rule, so this
   build does not act on them: it records them, shows them, and says plainly
   that they are not yet used. Inventing an eligibility rule here would be
   inventing chemistry. Recorded as an open item. */
export function project(events, annotations) {
  const state = new Map();
  const notes = new Map();
  events.forEach((e) => state.set(e.eventId, "CURRENT"));

  for (const a of annotations) {
    if (!state.has(a.targetEventId)) continue;
    if (a.type === ANNOTATION.SUPERSEDES) state.set(a.targetEventId, "SUPERSEDED");
    else if (a.type === ANNOTATION.MARK_SUSPECT && state.get(a.targetEventId) === "CURRENT")
      state.set(a.targetEventId, "SUSPECT");
    else if (a.type === ANNOTATION.MARK_INVALID) state.set(a.targetEventId, "INVALID");
    else if (a.type === ANNOTATION.WITHDRAW && state.get(a.targetEventId) !== "SUPERSEDED")
      state.set(a.targetEventId, "CURRENT");
    if (a.note && a.type !== ANNOTATION.SUPERSEDES) {
      notes.set(a.targetEventId, (notes.get(a.targetEventId) || []).concat(a.note));
    }
  }

  return events.map((e) =>
    Object.freeze({
      event: e,
      state: state.get(e.eventId),
      notes: notes.get(e.eventId) || [],
      supersededBy:
        annotations.find(
          (a) => a.type === ANNOTATION.SUPERSEDES && a.targetEventId === e.eventId
        )?.note || null,
    })
  );
}

/* --- what the engine is given -------------------------------------------

   The engine's input vocabulary is the fixture format's, which is the data
   contract's. This maps the stored envelope onto it and does nothing else: no
   filtering by value, no defaulting, no reinterpretation. Superseded and
   invalid records are not sent because they are not what happened; suspect
   ones ARE sent, because "I am not sure about this reading" is not a statement
   that it did not happen, and the engine owns eligibility.

   A `DATE_ONLY` reading is sent WITH its provenance rather than dropped. The
   engine is the one allowed to decide it cannot enter a trend, and it says so
   with a reason code the interface then renders. Dropping it here would make
   the app silently disagree with the record it is showing. */
/* WHOSE DOSE IS THIS?

   The Alk engine's `DOSE_STATE` and `DOSE_CHANGE` carry no parameter, because
   the engine assesses alkalinity and has no vocabulary for anything else. That
   was harmless while every dose event in the app was an alkalinity one. It
   stopped being harmless the moment a real history arrived carrying calcium
   dose changes as well: handed over unmarked, 14 mL/day of calcium solution
   would be read as the alkalinity dose, and the engine would attribute the
   tank's alkalinity movement to a delivery that never touched it. Manufactured
   delivery history, which `DATA-PROVENANCE.md` §3 forbids by name.

   An event with no parameter is alkalinity's. That is what every dose event
   this app has ever written means — the dose forms set no parameter — so
   nothing about existing records changes, and a dose event that names a
   parameter is only sent when that parameter is the one being assessed. */
function isAlkalinityDose(e) {
  return e.parameter == null || e.parameter === "ALK";
}

/* WHICH TIME FIELD A RECORD IS ENTITLED TO PUT ITS TIME IN.

   `ALK-V2-DATA-CONTRACT.md` §1, as amended by owner decision 30: every event
   carries exactly one `ObservedTime`, and WHICH of its three time fields is
   present "is decided by `timeProvenance` and by nothing else".

     EXACT_ABSOLUTE / RECONSTRUCTED_WITH_PROVENANCE   absoluteInstant
     LOCAL_TIME_ZONE_UNKNOWN                          localDateTime
     DATE_ONLY                                        calendarDate

   The application used to put the calendar day in `measuredAt` — the instant
   field — for a record that has no instant. The engine reads the field the
   provenance declares (`ledger.py` `_DAY_FIELD`) and finds nothing there, so it
   reported the record MALFORMED: `VALIDATION_TIMESTAMP_INVALID`, once per
   reading. On the owner's imported history that is every one of his 325
   date-only readings refused, and the app then had to tell him a record
   "carries a time that could not be read" about a record whose provenance it
   had itself declared correctly. `AI-014`.

   Nothing is fabricated here and nothing is improved. The same day the record
   already holds is written into the field the contract names for it, and the
   provenance travels alongside so the receiver can tell which it is. */
function dayFields(time) {
  if (time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN) {
    return {
      localDateTime: time.localTime ? `${time.localDate}T${time.localTime}` : time.localDate,
    };
  }
  return { calendarDate: time.localDate };
}

/* HAD THIS HAPPENED YET?

   An event with an instant is compared as an instant. An event with only a
   calendar day is compared as a calendar day, against the day `asOf` falls on
   in its own offset — because a date-only record says nothing finer than the
   day, and treating it as midnight would be reading a time into a record that
   has none.

   The comparison is inclusive: a reading taken at the assessment instant, or on
   the day of it, had happened. */
export function happenedBy(time, asOf) {
  if (!asOf) return true;
  const at = time.absoluteInstant || null;
  if (at) {
    const a = Date.parse(at), b = Date.parse(asOf);
    return Number.isFinite(a) && Number.isFinite(b) ? a <= b : true;
  }
  return String(time.localDate || "") <= String(asOf).slice(0, 10);
}

/* THE LEDGER AS IT STOOD AT THE ASSESSMENT INSTANT.

   `asOf` is required for anything that will be shown as an answer. Without it
   the engine is handed the whole ledger, including records dated AFTER the
   instant it was asked about — and it does not filter readings itself
   (`observation.episodes` takes no horizon, and `observation.position` takes
   the maximum over everything it is given). The consequence was measured, not
   assumed: seeded with a fortnight of a falling tank and asked about the first
   day of it, the engine returned the FOURTEENTH day's reading as the latest
   value, with a slope and a dose recommendation computed over readings that had
   not been taken yet.

   That is wrong in normal operation — a reading the keeper dates a week ahead
   enters today's answer — and it is fatal in test mode, whose whole claim is
   that stepping to a date shows what the app would have said on that date. The
   claim is only true if the engine is handed the ledger that existed then.

   This is not a chemistry rule and it does not duplicate one. It is a statement
   about which records EXISTED, which is the store's own business; what may then
   be READ from them stays entirely the engine's, including its own `asOf`
   handling for dose changes and boundary events, which is untouched.

   Canon §64 makes replay a function of the event ledger, the configuration
   versions and the engine version. This is what makes "the event ledger" mean
   the same thing on a replay as it did on the day. */
export function toEngineEvents(projected, asOf = null) {
  const out = [];
  for (const row of projected) {
    if (row.state === "SUPERSEDED" || row.state === "INVALID") continue;
    if (!happenedBy(row.event.time, asOf)) continue;
    const e = row.event;
    const at = e.time.absoluteInstant || null;
    const eff = (e.effectiveTime && e.effectiveTime.absoluteInstant) || at;

    if (e.kind === KIND.READING && e.parameter === "ALK") {
      out.push({
        kind: "READING",
        /* The event id travels with the event. Without it the engine's own
           problem reports name the reading as `UNKNOWN` (`ledger.py:177`),
           which tells the keeper that ONE of their readings could not be used
           and not which one. */
        eventId: e.eventId,
        /* `measuredAt` is an `ObservedTime` under owner decision 30, not an
           `Instant`. A record with a usable instant carries one; a record
           without carries the day in the field its provenance declares, and
           carries no instant at all — "not null, not midnight, not noon —
           absent". */
        ...(at ? { measuredAt: at } : dayFields(e.time)),
        rawValueDkh: e.normalizedValue,
        timeProvenance: e.time.timeProvenance,
      });
    } else if (e.kind === KIND.DOSE_STATE && isAlkalinityDose(e)) {
      const ev = {
        kind: "DOSE_STATE",
        programmedDoseMlPerDay: e.detail.doseMlPerDay,
        effectiveAt: eff,
        effectiveAtConfidence: e.detail.effectiveAtConfidence,
      };
      /* `ALK-V2-DATA-CONTRACT.md` §3 makes the two bounds `REQ*` — required
         whenever `effectiveAtConfidence` is `UNCERTAIN`, because they are what
         `M-5` reads to decide when a clean segment resumes. `DOSE_CHANGE`
         below has always sent them; `DOSE_STATE` computed them at import,
         stored them, and then dropped them here. A required field the sender
         holds and does not send is the sender's defect. */
      if (ev.effectiveAtConfidence === "UNCERTAIN") {
        ev.effectiveAtEarliest = e.detail.effectiveAtEarliest;
        ev.effectiveAtLatest = e.detail.effectiveAtLatest;
      }
      out.push(ev);
    } else if (e.kind === KIND.DOSE_CHANGE && isAlkalinityDose(e)) {
      const ev = {
        kind: "DOSE_CHANGE",
        effectiveAt: eff,
        from: e.detail.fromMlPerDay,
        to: e.detail.toMlPerDay,
        effectiveAtConfidence: e.detail.effectiveAtConfidence,
      };
      if (ev.effectiveAtConfidence === "UNCERTAIN") {
        ev.effectiveAtEarliest = e.detail.effectiveAtEarliest;
        ev.effectiveAtLatest = e.detail.effectiveAtLatest;
      }
      out.push(ev);
    } else if (e.kind === KIND.WATER_CHANGE) {
      const ev = {
        kind: "WATER_CHANGE",
        occurredAt: at || e.time.localDate,
        changedFraction: e.detail.changedFraction,
      };
      if (e.detail.replacementAlkalinityDkh != null) {
        ev.replacementAlkalinityDkh = e.detail.replacementAlkalinityDkh;
        ev.replacementAlkalinityConfidence =
          e.detail.replacementAlkalinityConfidence || "MEASURED_SAME_BATCH";
      }
      out.push(ev);
    } else if (e.kind === KIND.MANUAL_CORRECTION && isAlkalinityDose(e)) {
      /* WHOSE CORRECTION IS THIS?

         The same question the dose branches above ask, and it was not being
         asked here. A `MANUAL_CORRECTION` carries `amountMl` and an expected
         contribution in dKH; a hand-dosed calcium correction handed over
         unmarked is read by the Alk engine as alkalinity going into the tank,
         and the engine then attributes movement to a delivery that never
         touched alkalinity. `DATA-PROVENANCE.md` §3 forbids exactly that
         manufactured delivery history.

         The rule is the one `isAlkalinityDose` already states: an event with
         no parameter is alkalinity's, because that is what every correction
         this app has ever written means. Nothing about existing records
         changes; what changes is that a calcium one can no longer arrive. */
      out.push({
        kind: "MANUAL_CORRECTION",
        occurredAt: at || e.time.localDate,
        ...(e.detail.amountMl != null ? { amountMl: e.detail.amountMl } : {}),
        ...(e.detail.expectedContributionDkh != null
          ? { expectedContributionDkh: e.detail.expectedContributionDkh }
          : {}),
      });
    } else if (e.kind === KIND.DELIVERY_ANOMALY) {
      out.push({
        kind: "DELIVERY_ANOMALY",
        anomalyType: e.detail.anomalyType,
        fromAt: e.detail.fromAt,
        toAt: e.detail.toAt,
        quantifiedEffect: e.detail.quantifiedEffect ?? null,
      });
    }
    /* ICP_PANEL, HUSBANDRY, NOTE and every non-ALK reading are the
       application's own record. The Alk engine has no input vocabulary for
       them, and inventing one would be inventing an input the contract does
       not declare. They are stored, charted and scheduled; they are not sent. */
  }
  return out;
}

export { PROVENANCE, dayOf, hasExactInstant };
