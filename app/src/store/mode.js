/* ============================================================================
   TEST MODE — CONTROLLING THE APP'S "NOW"
   ----------------------------------------------------------------------------
   The problem this exists for, stated plainly: the engine's interesting
   outputs — a dose recommendation, a hold that names what it is holding at, a
   response verdict, a confidence level, a refusal — each need several readings
   across several days. Testing every two days, seeing the engine's full range
   of behaviour would take a month of real elapsed time, and seeing one
   specific case would mean waiting for it to happen on a live tank.

   The keeper already tried the obvious workaround: entering readings dated in
   the future. Nothing happened, and the reason is the design. The engine is a
   pure function of `(events, configuration, asOf)`. `asOf` is an explicit
   input and the application has always handed it the current clock. Dating a
   reading forward changes the reading's timestamp; it does not move the moment
   the assessment is computed FOR.

   So this module does not simulate anything. It changes two things and nothing
   else:

     1. what `asOf` is — through `time.js`'s clock, the app's one owner of
        "now";
     2. which store the app reads and writes — through a second, wholly
        separate IndexedDB database.

   THE ENGINE IS CALLED THROUGH THE IDENTICAL CODE PATH
   ----------------------------------------------------

   There is no test branch in `assess.js`, in `engine/client.js`, in the worker
   or in the engine. `runAssessment(store, asOf)` is the only entry point in
   either mode, it takes the same two arguments in either mode, and neither
   argument is marked. Nothing downstream can tell which mode produced it,
   which is the property that makes the mode worth having: if test mode and
   normal operation could differ on the same inputs, watching test mode would
   tell the keeper nothing about their tank.

   WHAT IT IS NOT
   --------------

   Not a simulator. It generates no readings, models no tank and predicts
   nothing. The keeper states what the readings were and what the date is, and
   the app shows what the engine says about that.

   Not a way to alter real data. Real readings are not editable through it, and
   a test reading never becomes a real one — there is no code path that copies,
   merges or migrates between the two stores in either direction, and the two
   are different databases so there is no query that can see both.
   ========================================================================= */

import { createStore } from "./index.js";
import { createIdbBackend, idbBackend, DB_NAME, TEST_DB_NAME } from "./db.js";
import { addDays, isoLocalDate, setClock } from "./time.js";

export const MODE = Object.freeze({
  REAL: "REAL",
  TEST: "TEST",
});

/* WHERE THE MODE IS REMEMBERED, AND WHY IT IS NOT IN EITHER STORE.

   It cannot live in the test database — you would have to know the mode to
   know which database to open. It should not live in the real one, because the
   real store holds the keeper's tank and this is a fact about the app, not
   about the tank. `localStorage` is neither, which is exactly right: it is
   app chrome, it survives a reload, and it is untouched by either store's
   reset. */
const KEY_MODE = "dw2.mode";
const KEY_DATE = "dw2.testDate";
const KEY_TIME = "dw2.testTime";

/* The default time of day for a newly chosen test date. It is not a fabricated
   measurement time — nothing is stored against a reading — it is the hour the
   keeper is standing at the tank asking the app what it thinks, and they can
   change it. It has to be SOMETHING, and a mid-morning hour is the honest
   default for "when someone looks at their app". */
const DEFAULT_TEST_TIME = "09:00";

/* An injectable store for the mode flag, so this module is testable outside a
   browser and so a private window with no `localStorage` degrades to "off"
   rather than throwing on load. */
let slots = memorySlots();

function memorySlots() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => m.set(k, String(v)),
    del: (k) => m.delete(k),
  };
}

function browserSlots() {
  try {
    const ls = self.localStorage;
    /* Touched rather than trusted: Safari in a private window has historically
       exposed the object and thrown on write. */
    ls.setItem(KEY_MODE + ".probe", "1");
    ls.removeItem(KEY_MODE + ".probe");
    return {
      get: (k) => ls.getItem(k),
      set: (k, v) => ls.setItem(k, String(v)),
      del: (k) => ls.removeItem(k),
    };
  } catch {
    return null;
  }
}

/* Called once by the shell at startup, and by a test with its own slots. */
export function useSlots(custom) {
  slots = custom || browserSlots() || memorySlots();
  applyClock();
  return slots;
}

/* --- what mode we are in ------------------------------------------------- */

export function currentMode() {
  return slots.get(KEY_MODE) === MODE.TEST ? MODE.TEST : MODE.REAL;
}

export function isTestMode() {
  return currentMode() === MODE.TEST;
}

/* The chosen instant, as the keeper stated it: a local calendar date and a
   local time of day. Kept as two fields rather than one absolute instant
   because that is how the keeper thinks about it and because stepping a day is
   then calendar arithmetic rather than millisecond arithmetic — 86400000 is
   wrong twice a year in a timezone with daylight saving. */
export function testInstant() {
  return {
    date: normaliseDate(slots.get(KEY_DATE) || isoLocalDate(new Date())),
    time: slots.get(KEY_TIME) || DEFAULT_TEST_TIME,
  };
}

/* THE MARKER AND THE CLOCK MUST NAME THE SAME DAY.

   `localDateTime("2026-02-30", ...)` is a real `Date` — the 2nd of March —
   because `new Date(y, m, d)` rolls over. So a stored value of `2026-02-30`
   printed one day on the marker while the engine was asked about another. It
   cannot be typed into a date input, but it can arrive from a stale or
   hand-edited stored value, and a marker that names the wrong day is precisely
   the deception the marker exists to prevent.

   Normalised rather than refused, and normalised HERE, so there is one answer
   to "what day is it" — every reader goes through `testInstant()`. */
function normaliseDate(text) {
  const iso = String(text).slice(0, 10);
  const rolled = isoLocalDate(localDateTime(iso, "12:00"));
  return rolled;
}

/* --- the clock ----------------------------------------------------------- */

/* Install the clock for the mode we are in. This is the whole of the mechanism
   by which the chosen instant reaches the engine: `time.js` answers "now" with
   it, `assess.js`'s `nowAsOf()` reads `time.js`, and `runAssessment` passes
   what it is given straight through. */
export function applyClock() {
  if (!isTestMode()) {
    setClock(null);
    return;
  }
  const { date, time } = testInstant();
  setClock(() => localDateTime(date, time));
}

/* A local wall-clock date and time as a `Date`. Built from local components on
   purpose: `new Date("2026-03-14T09:00")` is parsed as local by every current
   engine but has been read as UTC by older ones, and the difference would move
   the keeper's chosen day. */
export function localDateTime(date, time) {
  const [y, mo, d] = String(date).slice(0, 10).split("-").map(Number);
  const [h, mi] = String(time || DEFAULT_TEST_TIME).split(":").map(Number);
  return new Date(y, (mo || 1) - 1, d || 1, h || 0, mi || 0, 0, 0);
}

/* --- changing it --------------------------------------------------------- */

export function enterTestMode({ date, time } = {}) {
  const at = testInstant();
  slots.set(KEY_DATE, date || at.date);
  slots.set(KEY_TIME, time || at.time);
  slots.set(KEY_MODE, MODE.TEST);
  applyClock();
  return testInstant();
}

/* Leaving test mode restores the wall clock and the real store, and does
   NOTHING else. It does not copy, merge, migrate or clear anything: the test
   data is still there next time, the real ledger has not been touched, and the
   two have not met. */
export function leaveTestMode() {
  slots.set(KEY_MODE, MODE.REAL);
  applyClock();
  return MODE.REAL;
}

export function setTestInstant({ date, time }) {
  const at = testInstant();
  if (date) slots.set(KEY_DATE, String(date).slice(0, 10));
  if (time) slots.set(KEY_TIME, String(time).slice(0, 5));
  if (!date && !time) return at;
  applyClock();
  return testInstant();
}

/* Forward and back by whole days. The time of day is kept, so stepping does
   not silently change how long the engine thinks has elapsed within a day. */
export function stepTestDays(n) {
  const at = testInstant();
  slots.set(KEY_DATE, addDays(at.date, n));
  applyClock();
  return testInstant();
}

/* --- which store ---------------------------------------------------------- */

/* Backends are built once and kept, because a backend memoises its connection
   and building a second one would open the same database twice. The real
   tank's is the one `db.js` already exports, so there is exactly one
   connection to it in the page however this module is used. */
let makeBackend = createIdbBackend;
const backends = new Map([[DB_NAME, idbBackend]]);

/* Injectable for the same reason the slots are: `tests/app/` runs in Node with
   no IndexedDB, and the alternative is a test that builds two stores by hand
   and so proves a property of its own fixtures rather than of this module. The
   routing below is what the shell actually calls, and it is what the tests
   call too. */
export function useBackendFactory(fn) {
  makeBackend = fn || createIdbBackend;
  backends.clear();
  if (makeBackend === createIdbBackend) backends.set(DB_NAME, idbBackend);
}

function backendFor(name) {
  if (!backends.has(name)) backends.set(name, makeBackend(name));
  return backends.get(name);
}

export function testBackend() {
  return backendFor(TEST_DB_NAME);
}

/* THE ONE PLACE THAT DECIDES WHICH DATABASE THE APP IS USING.

   One function, so there is one answer. A second place that worked it out
   would be a second owner of the real/test separation, and canon
   `MASTER RULE 1` is explicit that two implementations agreeing today is a
   defect rather than a coincidence — here the defect would be test readings in
   the keeper's own tank history. */
export function backendForMode(mode) {
  return backendFor(mode === MODE.TEST ? TEST_DB_NAME : DB_NAME);
}

/* The store for a mode. Two stores, two databases, no shared state: whichever
   this returns, the append-only ledger, the assessments, the tasks and the
   configuration behave identically, because it is the same code over a
   different backend. */
export function storeForMode(mode) {
  return createStore(backendForMode(mode));
}

/* Clear all test data. Destroys the test database and nothing else — the name
   is fixed at the backend's construction, so this cannot be aimed elsewhere by
   a mistake in a caller. The connection is dropped with it, so the next read
   opens a fresh, empty database.

   A FAILURE IS RETURNED, NOT SWALLOWED — and the memoised backend is kept when
   it fails. `destroy()` reports `ok: false` when another tab is holding the
   database open, and the previous version of this function threw that answer
   away and cleared the memo regardless. The keeper then saw a confirmed,
   apparently-successful clear over a database that still held the last run's
   readings, and the next series he seeded landed on top of them. Every caller
   must read this result. */
export async function resetTestData() {
  const b = testBackend();
  const r = await b.destroy();
  if (r && r.ok) backends.delete(TEST_DB_NAME);
  return r;
}

export { DB_NAME, TEST_DB_NAME };
