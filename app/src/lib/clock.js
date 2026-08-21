/* ============================================================================
   NOW, FOR A FORM THAT PRE-FILLS ITSELF
   ----------------------------------------------------------------------------
   V1 had `nowTime` in `src/lib/analytics/time-of-day.js` — a module of
   chemistry — and used it to pre-fill an entry form. That use is not
   chemistry, and it is the only one that came across.

   THIS IS NOT THE ASSESSMENT CLOCK, and it does not hold one. `INV-A2` puts
   the assessment instant in the application and requires it to travel as an
   explicit argument; `app/src/store/time.js` holds THE clock and
   `app/src/assess.js` reads it for the engine.

   What these two do is read that same clock, so that a form pre-fills the
   instant the app is actually running at. In test mode, where the keeper has
   set the assessment instant by hand, a form that pre-filled the wall clock
   would put today's date on a reading being entered into March. There is one
   clock, and `TM-23` is the test that says so.
   ========================================================================= */

import { isoLocalDate, now } from "../store/time.js";

/* The wall-clock time, to the minute, in the form an `<input type="time">`
   holds it. Seconds are dropped because the keeper is typing when he tested,
   not timing a race. */
export function nowTime() {
  const d = now();
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

export function nowDate() {
  return isoLocalDate(now());
}
