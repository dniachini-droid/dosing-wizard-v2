/* --- Local dates ---
 *
 * toISOString() returns UTC. At 9am in Sydney it is still the previous day in
 * UTC, so the app believed "today" was yesterday: a reminder due today read as
 * "in 1 day", and adding days to a date could land a day short. Every date in
 * this app is a calendar day in the user's own timezone, so they are formatted
 * and parsed locally throughout.
 */
import { now } from "../store/time.js";

export const isoLocal = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
export const parseLocal = (iso) => {
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
};
/* THE ONE CHANGE THIS FILE NEEDED.

   V1 read `new Date()` here. V2 has one clock — `app/src/store/time.js` — and
   test mode works by moving it; a screen that reached past it for the wall
   clock would show today's date inside a March the keeper had chosen. `TM-23`
   is the test that finds a module doing that. */
export const todayStr = () => isoLocal(now());
/* Shorthand for "n days from today", in local terms. */
export const addDaysFromToday = (n) => { const x = now(); x.setDate(x.getDate() + n); return isoLocal(x); };
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);
export const fmtDate = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
export const fmtShort = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-AU", { day: "numeric", month: "short" });

/* V1's `paramStatus` stood here: a position classifier — below the minimum is
   "low", above the maximum is "high" — living in a UI library and called from
   eight surfaces. It is deleted rather than ported. Canon `X-INV-004` gives
   the domain engine one analytical owner, and `DEC-003` forbids a UI component
   recomputing chemistry; a function that decides what a reading MEANS is
   exactly what neither permits.

   V2's alkalinity position comes from the engine, as `EngineResult.position`,
   and is rendered through `app/src/present/position.js`. For the parameters
   this build does not assess there is no position at all, and the interface
   says nothing rather than classifying them itself. That omission is recorded
   in `docs/migration/PORT-OMISSIONS.md`. */

export const STATUS_COLOR = { ok: "#0B7C86", low: "#926A09", high: "#C4285B", unknown: "#9FB0AE" };
