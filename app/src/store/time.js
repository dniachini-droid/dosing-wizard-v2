/* ============================================================================
   TIME PROVENANCE
   ----------------------------------------------------------------------------
   The one interface defect that cannot be undone.

   If a picker defaults to "now" and the app silently saves a full timestamp
   onto a reading whose time the keeper never knew, the fabricated precision is
   afterwards indistinguishable from real precision. Every trend computed from
   it is then computed from a number nobody measured, and no later fix can tell
   the two apart. `ALK-V2-DATA-CONTRACT.md` §1 forbids assigning noon, assigning
   midnight, assigning the current timezone to an old local timestamp, and
   inferring a time from routine or entry order — "absolutely".

   So this module makes the defect unrepresentable rather than merely
   forbidden. There are exactly two constructors. Neither reads a clock.
   Neither has a default. A caller that does not know the time cannot obtain an
   instant from here by any spelling, because `dateOnly()` returns an object
   that has no instant in it at all.

   The vocabulary is the contract's, not this file's:

     EXACT_ABSOLUTE                 proven absolute instant
     RECONSTRUCTED_WITH_PROVENANCE  historical offset independently proven
     LOCAL_TIME_ZONE_UNKNOWN        local HH:MM, no proven offset
     DATE_ONLY                      date known, time within the day unknown

   This build writes only the first and the last. The middle two exist because
   the contract declares them and an importer would produce them; nothing here
   creates one, and nothing here upgrades one into another.
   ========================================================================= */

import { t } from "../strings.js";

export const PROVENANCE = Object.freeze({
  EXACT_ABSOLUTE: "EXACT_ABSOLUTE",
  RECONSTRUCTED_WITH_PROVENANCE: "RECONSTRUCTED_WITH_PROVENANCE",
  LOCAL_TIME_ZONE_UNKNOWN: "LOCAL_TIME_ZONE_UNKNOWN",
  DATE_ONLY: "DATE_ONLY",
});

/* Which provenances the engine may use for elapsed time. Stated here so the
   application can SAY what a record can and cannot be used for; the engine
   still decides, and this is never used to filter what is sent to it. */
export const TREND_ELIGIBLE = Object.freeze([
  PROVENANCE.EXACT_ABSOLUTE,
  PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE,
]);

/* --- local calendar days -------------------------------------------------
   Ported from V1 `src/lib/dates.js`, which was written after a real bug:
   `toISOString()` returns UTC, so at 9am in Sydney the app believed "today"
   was yesterday and a reminder due today read as "in 1 day". Every calendar
   day in this app is a day in the keeper's own timezone.

   V2 adds what V1 lacked: absolute instants alongside, and no silent bridge
   between the two. */

export function isoLocalDate(d) {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function parseLocalDate(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/* --- THE APPLICATION'S CLOCK — ONE OWNER --------------------------------
   Canon `INV-A2` forbids the DOMAIN holding a clock. The application holds
   one, and this is it: the single function that answers "what moment is the
   app being asked about". `assess.js` reads it and passes the answer down as
   `asOf`; nothing below the application layer ever calls it.

   It is replaceable because of test mode. The engine is a pure function of
   (events, configuration, asOf), and `asOf` is already an explicit input — so
   letting the keeper state the moment needs no second code path, no flag
   inside the engine and no alternative pipeline. It needs exactly this: one
   place that says what "now" is, and one caller allowed to change it.

   `MASTER RULE 1` is why it is one function rather than each screen reading
   `new Date()` for itself. Twenty readers of the wall clock are twenty places
   that would have to agree, and "they agree today" is not a design.

   WHAT THIS DELIBERATELY DOES NOT COVER
   -------------------------------------

   `recordedAt` — when the app was TOLD something — is not this clock and must
   not become it. The app genuinely was running at the real instant, and
   `ledger.js` says so in as many words: "`recordedAt` is when the app was
   told, and it is always exact." A seeded record entered while the assessment
   instant sits in March was still typed today, and the record says so. Every
   `recordedAt` in the app therefore reads `new Date()` directly, on purpose. */
let readClock = () => new Date();

/* Install a clock. `null` restores the wall clock. `store/mode.js` is the only
   caller; nothing else may set one, because two setters is two owners. */
export function setClock(fn) {
  readClock = typeof fn === "function" ? fn : () => new Date();
}

export function now() {
  const d = readClock();
  return d instanceof Date && Number.isFinite(d.getTime()) ? d : new Date();
}

/* The assessment instant, in the shape the engine's `asOf` takes. */
export function nowIso() {
  return now().toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function todayLocal(at) {
  return isoLocalDate(at instanceof Date ? at : now());
}

export function addDays(iso, n) {
  const d = parseLocalDate(iso);
  d.setDate(d.getDate() + n);
  return isoLocalDate(d);
}

export function daysBetween(a, b) {
  return Math.round((parseLocalDate(b) - parseLocalDate(a)) / 86400000);
}

/* --- the two constructors ------------------------------------------------ */

/* The keeper knows when this happened, to the minute.

   `localDate` and `localTime` are what they typed; `offsetMinutes` is the
   device's offset AT THAT MOMENT, which is what makes the instant provable
   rather than assumed. The stored instant carries the offset, so a later trip
   across a timezone cannot silently move it. */
export function exactInstant(localDate, localTime, offsetMinutes, zoneId) {
  if (!localDate || !localTime) {
    throw new Error(t("err.exactInstantNeedsBoth"));
  }
  const [y, mo, d] = localDate.split("-").map(Number);
  const [h, mi] = localTime.split(":").map(Number);
  const off = Number.isFinite(offsetMinutes)
    ? offsetMinutes
    : -new Date(y, mo - 1, d, h, mi).getTimezoneOffset();
  const utcMs = Date.UTC(y, mo - 1, d, h, mi) - off * 60000;
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const pad = (n) => String(n).padStart(2, "0");
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  const iso = new Date(utcMs).toISOString().replace(/\.\d{3}Z$/, "");

  return Object.freeze({
    timeProvenance: PROVENANCE.EXACT_ABSOLUTE,
    /* Written with the offset that was actually in force, not as UTC — the
       contract calls for an offset-aware timestamp. */
    absoluteInstant: shiftIso(iso, off) + offset,
    displayTimeZoneId: zoneId || localZone(),
    localDate,
    localTime,
    offsetMinutes: off,
  });
}

/* The keeper knows the day and does not know the time.

   There is deliberately no time field on the returned object. A caller that
   wants one cannot get it by omitting an argument, passing null, or reading a
   default — it is not there. That is the whole point of this function. */
export function dateOnly(localDate) {
  if (!localDate) throw new Error(t("err.dateOnlyNeedsDate"));
  return Object.freeze({
    timeProvenance: PROVENANCE.DATE_ONLY,
    localDate: String(localDate).slice(0, 10),
    /* No absoluteInstant. Not null, not midnight, not noon — absent. */
  });
}

/* The record carries a wall-clock time and no proof of what offset was in
   force. Historical data, and nothing else: this is the provenance an importer
   produces and a live entry never should.

   It is a THIRD constructor rather than a flag on `exactInstant`, because the
   difference between the two is the whole point. There is no `absoluteInstant`
   here and there is no branch that computes one. Applying the keeper's current
   timezone to an old local stamp is forbidden "absolutely" by
   `ALK-V2-DATA-CONTRACT.md` §1 and by canon `SHARED-LEGACY-TIME-001`, and the
   reason is that once applied it cannot be told from a real offset afterwards.
   The local time is kept because it is true and worth showing; it is not
   promoted into an instant, so nothing can compute an elapsed interval from
   it. */
export function localTimeZoneUnknown(localDate, localTime) {
  if (!localDate || !localTime) throw new Error(t("err.exactInstantNeedsBoth"));
  return Object.freeze({
    timeProvenance: PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN,
    localDate: String(localDate).slice(0, 10),
    localTime: String(localTime).slice(0, 5),
    /* No absoluteInstant, for the same reason `dateOnly` has none. */
  });
}

/* --- an assumed instant, and the assumption written down ------------------

   OWNER DECISION, 2026-08-21, overriding the earlier instruction to ask the
   keeper which timezone his old records were in.

   The tank does not travel. Every one of these readings was taken in front of
   the same tank, in whatever zone that tank stands in, so applying ONE offset
   to all of them leaves every elapsed interval between them exactly right —
   and elapsed interval is the only thing the engine computes from these times.
   Which offset it is affects where the whole run sits on the world clock, and
   nothing the engine does depends on that.

   So there is no question to ask, and there is no per-record daylight-saving
   resolution: a one-hour step twice a year is not distinguishable from
   measurement noise against intervals measured in days, and the owner has ruled
   it irrelevant. An hour daylight saving skipped or repeated is not refused
   either; it is read like every other hour.

   WHERE THIS SITS AGAINST CANON

   `SHARED-LEGACY-TIME-001` forbids "silently applying the keeper's current
   timezone to old local timestamps". The word doing the work is SILENTLY, and
   this is the opposite of silent: the assumption is stated on the import screen
   before anything is written, and it is recorded on every record it touched —
   `assumed: true`, the offset applied, and the fact that NOBODY STATED IT.
   Jake's objection to the earlier design stands and is honoured here: a default
   nobody typed must never be recorded as something the keeper said.

   That is a reading of the rule, not a licence, and the owner's decision
   conflicts with the rule as drafted. The conflict is recorded as an open canon
   item in `docs/implementation/app/OPEN-ITEMS.md` rather than argued away. */

export const ASSUMPTION = Object.freeze({
  /* The device's own offset, applied because nothing better exists and the tank
     does not move. Not a statement by anybody. */
  DEVICE_ZONE: "ASSUMED_DEVICE_ZONE",
});

/* An instant built from a local wall time and ONE assumed offset, carrying the
   assumption that produced it.

   `assumption.assumed` is always true and is written here rather than taken
   from the caller, so no caller can build one of these that reads as a fact. */
export function assumedLocalInstant(localDate, localTime, offsetMinutes, assumption) {
  if (!localDate || !localTime) throw new Error(t("err.exactInstantNeedsBoth"));
  if (!Number.isFinite(offsetMinutes)) throw new Error(t("err.assumedNeedsOffset"));
  if (!assumption || !assumption.basis || !assumption.appliedAt) {
    /* Half of what makes this legitimate is that the assumption travels with
       the record. A record carrying the improved provenance and no note of what
       was assumed is the thing the canon rule exists to prevent, so it cannot
       be built here. */
    throw new Error(t("err.assumptionNeedsRecord"));
  }

  const [y, mo, d] = String(localDate).slice(0, 10).split("-").map(Number);
  const [hh, mi] = String(localTime).slice(0, 5).split(":").map(Number);
  const off = offsetMinutes;
  const sign = off < 0 ? "-" : "+";
  const abs = Math.abs(off);
  const pad = (n) => String(n).padStart(2, "0");
  const offset = `${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  const local = new Date(Date.UTC(y, mo - 1, d, hh, mi)).toISOString().replace(/\.\d{3}Z$/, "");

  return Object.freeze({
    timeProvenance: PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE,
    absoluteInstant: local + offset,
    displayTimeZoneId: assumption.zoneId || localZone(),
    localDate: String(localDate).slice(0, 10),
    localTime: String(localTime).slice(0, 5),
    offsetMinutes: off,
    /* What was assumed, that it WAS assumed, and that no one stated it. */
    reconstruction: Object.freeze({
      ...assumption,
      assumed: true,
      statedByKeeper: false,
      offsetMinutes: off,
    }),
  });
}

function shiftIso(utcIso, offsetMinutes) {
  const ms = Date.parse(utcIso + "Z") + offsetMinutes * 60000;
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, "");
}

export function localZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export function localOffsetMinutes(at) {
  return -(at instanceof Date ? at : now()).getTimezoneOffset();
}

/* The calendar day a stored time falls on, for grouping in the app's own
   surfaces. Works for both provenances because both carry `localDate`, which
   is why `localDate` is stored rather than derived from the instant. */
export function dayOf(time) {
  return time && time.localDate ? time.localDate : null;
}

export function hasExactInstant(time) {
  return !!(time && TREND_ELIGIBLE.includes(time.timeProvenance) && time.absoluteInstant);
}

/* --- the rule that must never be broken ---------------------------------
   Time provenance never improves in place. There is no transformation that
   upgrades it except an importer that independently proves the historical
   offset and records the proof — and this build has no importer.

   This is asserted rather than commented, and the ledger calls it on every
   append that references an existing event. */
export function assertProvenanceNotImproved(before, after) {
  const rank = {
    [PROVENANCE.DATE_ONLY]: 0,
    [PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN]: 1,
    [PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE]: 2,
    [PROVENANCE.EXACT_ABSOLUTE]: 2,
  };
  const b = rank[before && before.timeProvenance];
  const a = rank[after && after.timeProvenance];
  if (b === undefined || a === undefined) {
    throw new Error(t("err.provenanceUndeclared"));
  }
  if (a > b) {
    throw new Error(
      t("err.provenanceImproved", { before: before.timeProvenance, after: after.timeProvenance })
    );
  }
}

/* What to say on screen about a record's time. Plain English — no vocabulary
   from the contract reaches a visible string. */
export function describeTime(time) {
  if (!time) return t("time.describe.none");
  if (time.timeProvenance === PROVENANCE.DATE_ONLY) return t("time.describe.dateOnly");
  if (time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN) return t("time.describe.local");
  if (time.timeProvenance === PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE) {
    return t("time.describe.reconstructed");
  }
  return t("time.describe.exact");
}
