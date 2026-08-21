/* ============================================================================
   NUMBERS ON SCREEN
   ----------------------------------------------------------------------------
   V1 had `fmtVal` and `fmtAmount` in `src/lib/analytics/time-in-range.js`,
   which is a module full of chemistry. The two functions were not: they round
   a number for display and nothing else. They are here, away from the
   analytics that did not come across.

   `ALK-V2-DATA-CONTRACT.md` §0: display rounding never enters a calculation.
   Nothing here is read back by anything.

   The brief for this port names two things this file exists to prevent:
   "A number known to two decimals does not render as `3.995138888888889`. A
   timestamp does not render as `2026-08-23T07:48:22+00:00`."
   ========================================================================= */

/* A reading, at the precision its parameter is recorded to. `decimals` comes
   from `PARAMETERS` in the ledger, where it sits beside the unit it belongs
   with — it is not a judgement made here. */
export function fmtVal(def, v) {
  if (v == null || typeof v !== "number" || !Number.isFinite(v)) return "—";
  return v.toFixed(def && Number.isFinite(def.decimals) ? def.decimals : 2);
}

/* A quantity with no parameter to take its precision from — millilitres, a
   difference, a litre count. Trailing zeros are trimmed, so 10.0 reads as 10
   and 10.25 keeps both places. */
export function fmtAmount(v, decimals = 2) {
  if (v == null || typeof v !== "number" || !Number.isFinite(v)) return "—";
  return String(Number(v.toFixed(decimals)));
}

/* A wall-clock time, as the keeper wrote it. Never derived from an instant,
   because a record with no time has none to derive. */
export function fmtTime(time) {
  return time ? String(time).slice(0, 5) : "";
}

/* A stored timestamp, rendered as something a person reads. The contract's
   instants carry an offset and a `.000Z` tail; neither belongs on screen. */
export function fmtInstant(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString("en-AU", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

/* A date with its weekday. V1's `fmtFriendly`, ported unchanged from
   `src/lib/analytics/water-changes.js:82` — where it lived for no reason
   connected to water changes. */
export const fmtFriendly = (iso) => {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};
