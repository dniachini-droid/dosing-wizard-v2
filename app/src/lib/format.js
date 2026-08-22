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

/* A SOLUTION STRENGTH, IN dKH PER MILLILITRE — ONE ARGUMENT, SO THERE IS
   NOTHING TO SWAP.

   This function exists because of a real defect, and its shape is the fix.
   Setup rendered the derived strength with `fmtVal(derived.value, 4)` —
   the VALUE where `fmtVal` takes a parameter DEFINITION, and the intended
   decimal count where it takes the value. `def.decimals` on a bare number is
   `undefined`, so the fallback of 2 applied and the function returned
   `(4).toFixed(2)`. The screen read `4.00 dKH/mL` for a 77 L tank, it read
   `4.00` whatever strength was entered, and it went on reading `4.00` after the
   keeper corrected the figure — because the number on screen was never derived
   from the strength at all. It was the decimal-places argument.

   Every other `fmtVal` call site in the app passes `(def, value)` correctly.
   Two did not, and nothing could tell: both orders are two numbers.

   So the potency is not formatted by a two-argument function any more. It takes
   the value and nothing else, and there is no second argument for a caller to
   put in the wrong place. `POTENCY_DECIMALS` is display precision and is read
   back by nothing (`ALK-V2-DATA-CONTRACT.md` §0).

   It is also the ONE place a strength is written for the screen — Setup and the
   Dosing tab both call it — so the two surfaces cannot disagree about how the
   keeper's own number looks. */
export const POTENCY_DECIMALS = 4;

export function fmtPotency(v) {
  if (v == null || typeof v !== "number" || !Number.isFinite(v)) return "—";
  return v.toFixed(POTENCY_DECIMALS);
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

/* ============================================================================
   ONE FUNCTION FOR EVERY NUMBER ON SCREEN
   ----------------------------------------------------------------------------
   Round three, item 4: `days covered 0.0004976851851851852`, `3.58 days`,
   `+0.0839`. Three different renderings of "a number", none of them the
   precision the quantity is actually known to, and all of them reaching a
   keeper.

   A number renders to the precision it is KNOWN to, and what it is known to
   follows from what KIND of quantity it is. So the precision lives here, once,
   against the kind — not at each of the forty call sites that print one.

   These are display conventions, not chemistry. `ALK-V2-DATA-CONTRACT.md` §0
   is explicit that display rounding never enters a calculation, and nothing
   here is read back by anything.

   `recommendationPrecisionMlPerDay` is a DIFFERENT thing and is not here: that
   is the keeper's pump step, it is the engine's input, and the engine rounds
   the recommendation to it. This function would render the result of that
   rounding; it never performs it. */
const PRECISION = Object.freeze({
  dkh: 2,          /* a reading: 9.00 dKH */
  mlPerDay: 2,     /* a dose: 8.8 mL/day — see TRIM_TRAILING below */
  dkhPerDay: 3,    /* a slope or a consumption: 0.030 dKH/day */
  dkhPerMl: 4,     /* a solution strength: 0.0692 dKH/mL */
  days: 1,         /* a span: 5.0 days — but prefer `spanInWords` in prose */
  percent: 0,      /* a discrepancy: 2% */
  count: 0,        /* readings, clusters, periods */
});

/* Quantities whose SECOND decimal is only ever shown when it says something.

   A dose is written 8.8 mL/day, not 8.80 — the owner's own spelling, and the
   one everybody uses for a doser. The place is kept where it carries a digit,
   so a pump set to 8.75 still reads 8.75; only a trailing zero goes.

   A reading is NOT in this set and must not be. `9.00 dKH` and `9.0 dKH` say
   different things about how the tank was measured, and alkalinity is written
   to two places everywhere in this app and in the canon.

   One decimal always survives. `9.0 mL/day` is a dose; `9 mL/day` reads like a
   count of bottles. */
const TRIM_TRAILING = new Set(["mlPerDay"]);

export function fmtQty(v, kind = "dkh") {
  if (v == null || typeof v !== "number" || !Number.isFinite(v)) return null;
  const dp = PRECISION[kind];
  const text = v.toFixed(dp === undefined ? 2 : dp);
  if (!TRIM_TRAILING.has(kind)) return text;
  /* Only a trailing zero, and never the last decimal place. */
  return text.replace(/(\.\d)0+$/, "$1");
}

/* The same, as a MAGNITUDE. `jake`'s rule for this tab: prose never prints a
   minus sign — a slope is a magnitude and the direction is a word. */
export function fmtMag(v, kind = "dkhPerDay") {
  return v == null || typeof v !== "number" || !Number.isFinite(v)
    ? null
    : fmtQty(Math.abs(v), kind);
}
