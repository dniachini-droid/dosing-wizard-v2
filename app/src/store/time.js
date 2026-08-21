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

export function todayLocal(now) {
  return isoLocalDate(now instanceof Date ? now : new Date());
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
  return -(at instanceof Date ? at : new Date()).getTimezoneOffset();
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
