/* ============================================================================
   V2's RECORD, IN THE SHAPE V1's INTERFACE READS
   ----------------------------------------------------------------------------
   This module is the whole of the rewiring, in one place.

   V1's screens read a flat array of `{ param, value, date, time }` out of
   `localStorage`. V2 keeps an append-only event ledger, folds it into a
   projection, and stores assessments with version stamps beside it. Both are
   true records of the same tank; they are written down differently.

   Rather than edit that difference into thirty components — which is where a
   port turns into a rewrite — the difference is resolved once, here, and every
   ported screen reads the result.

   WHAT THIS FILE IS NOT ALLOWED TO DO
   -----------------------------------

   It is a projection, not an opinion. It renames fields, orders rows and drops
   records the ledger itself has already marked as not-what-happened. It does
   not classify, compare against a range, compute a rate, decide eligibility or
   fill in a missing value. There is no threshold in this file and there must
   never be one: canon `X-INV-004` gives the engine one analytical owner, and a
   convenient little comparison here would be a second.

   THE ONE THING IT DELIBERATELY DOES NOT SAY
   ------------------------------------------

   A reading with no time is carried through as an ordinary row and charted as
   an ordinary point. Whether the engine can use it for a trend is the engine's
   business, and the interface does not draw that distinction per point. The
   keeper has 325 such readings; each one announcing itself would be 325
   notices about a decision he has already made.
   ========================================================================= */

import { PARAMETERS } from "../store/ledger.js";
import { keeperRange } from "../store/config.js";
import { KIND } from "../store/ledger.js";
import { PARAM_STYLE } from "./constants.js";
import { t, has } from "../strings.js";

/* Records the ledger's own fold says are not what happened. `SUSPECT` is NOT
   here: the keeper flagging a reading is not a statement that it did not
   occur, the engine still receives it, and a screen that hid it would be
   showing him a different history from the one being assessed. */
const NOT_WHAT_HAPPENED = new Set(["SUPERSEDED", "INVALID"]);

/* The step an input should move by, derived from where the parameter is
   rounded for display rather than invented. `decimals: 2` gives `0.01`. V1
   carried a hand-written `step` per parameter next to its target range; the
   range was chemistry and went, and the step turned out to be derivable. */
export function stepFor(def) {
  return def.decimals > 0 ? Number((10 ** -def.decimals).toFixed(def.decimals)) : 1;
}

/* Every parameter, in the shape V1's components destructure — `key`, `label`,
   `unit`, `step`, `color`, and `min`/`max` for the band drawn behind a trace.

   `min` and `max` are the KEEPER's own numbers, read through `keeperRange`,
   which `app/src/store/config.js` documents as governing nothing: they are
   drawn on his charts and stated in his history, and no engine reads one. They
   are frequently ABSENT, because this build ships no range it cannot source,
   and every consumer has to cope with that rather than substituting a default.
   A default here would be a band edge invented by the interface. */
export function paramDefsFrom(config) {
  return PARAMETERS.map((p) => {
    const style = PARAM_STYLE[p.key] || {};
    const range = keeperRange(p, config);
    return {
      key: p.key,
      label: t(`parameter.${p.key}`),
      labelMid: has(`parameterMid.${p.key}`) ? t(`parameterMid.${p.key}`) : t(`parameter.${p.key}`),
      unit: p.unit,
      decimals: p.decimals,
      step: stepFor(p),
      color: style.color || "#45605F",
      assessed: p.assessed,
      min: range ? range.min : null,
      max: range ? range.max : null,
      hasRange: !!range,
    };
  });
}

/* Readings, oldest first, in V1's row shape.

   `date` is the calendar day the reading belongs to — `localDate`, always
   present, whatever the provenance. `time` is the wall-clock time where one
   was recorded and `null` where none was, and nothing here manufactures one:
   `dateOnly` records have no time field at all, and that is the point of them. */
export function readingsFrom(projection) {
  const out = [];
  for (const row of projection) {
    const e = row.event;
    if (e.kind !== KIND.READING) continue;
    if (NOT_WHAT_HAPPENED.has(row.state)) continue;
    if (typeof e.normalizedValue !== "number" || !Number.isFinite(e.normalizedValue)) continue;
    out.push({
      id: e.eventId,
      param: e.parameter,
      value: e.normalizedValue,
      raw: e.rawValue,
      date: e.time.localDate,
      time: e.time.localTime || null,
      provenance: e.time.timeProvenance,
      state: row.state,
      notes: row.notes,
    });
  }
  return out;
}

/* The latest reading per parameter. `readingsFrom` is already in the ledger's
   own total order (`INV-A1`), so "latest" is the last one rather than a second
   opinion about which reading is most recent. */
export function latestByParamFrom(rows, defs) {
  const out = {};
  for (const def of defs) out[def.key] = null;
  for (const r of rows) if (r.param in out) out[r.param] = r;
  return out;
}

/* What gets marked on a chart. Dose changes carry the parameter they belong to
   so a calcium doser change does not clutter the alkalinity trace; water
   changes and lighting changes carry none, because they touch everything.

   `icon` and `color` are V1's chart-marker vocabulary, kept so the ported
   chart draws what it drew. The labels are looked up rather than written
   here. */
export function chartEventsFrom(projection) {
  const out = [];
  for (const row of projection) {
    const e = row.event;
    if (NOT_WHAT_HAPPENED.has(row.state)) continue;
    const date = e.time.localDate;
    if (!date) continue;
    if (e.kind === KIND.DOSE_CHANGE) {
      out.push({ date, kind: "Dose", icon: "▼", color: "#0B7C86", param: e.parameter || "ALK" });
    } else if (e.kind === KIND.WATER_CHANGE) {
      out.push({ date, kind: "Water", icon: "◆", color: "#1D6FA5", param: null });
    } else if (e.kind === KIND.HUSBANDRY && e.detail && e.detail.husbandryKind === "LIGHTING") {
      out.push({ date, kind: "Lighting", icon: "✦", color: "#A2621B", param: null });
    } else if (e.kind === KIND.ICP_PANEL) {
      out.push({ date, kind: "ICP", icon: "●", color: "#7B4FCB", param: null });
    }
  }
  return out;
}

/* Rows for one parameter, oldest first — the input every chart on every screen
   takes. Written once because four surfaces draw the same trace and two
   implementations of "this parameter's readings, in order" is the shape canon
   `MASTER RULE 1` calls a defect rather than a coincidence. */
export function rowsFor(rows, key) {
  return rows.filter((r) => r.param === key);
}

/* Chart points. Where a day carries more than one reading the label includes
   the time, so two points on one day are distinguishable instead of both
   reading "10 Aug". V1 did this and it is worth keeping. */
export function chartDataFrom(rows, fmtShort) {
  const perDay = {};
  for (const r of rows) perDay[r.date] = (perDay[r.date] || 0) + 1;
  return rows.map((r) => ({
    label: perDay[r.date] > 1 && r.time ? `${fmtShort(r.date)} ${r.time}` : fmtShort(r.date),
    value: r.value,
    date: r.date,
    time: r.time,
    id: r.id,
  }));
}

/* Does this parameter's history contain readings the engine cannot use for a
   trend? Answered once, for ONE note beneath a chart — never per point.

   It reads `timeProvenance`, which the record carries and the engine set the
   meaning of; it does not decide eligibility, it reports what the record says
   about itself. */
export function untimedCount(rows) {
  return rows.filter((r) => !r.time).length;
}
