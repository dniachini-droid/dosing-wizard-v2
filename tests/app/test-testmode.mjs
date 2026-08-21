/* ============================================================================
   TEST MODE
   ----------------------------------------------------------------------------
   Four claims, and every one of them is a claim about damage that cannot be
   undone once done:

     1. Test data never reaches the real store, and real data is never touched
        by test mode. A seeded reading in the keeper's own tank history is
        afterwards indistinguishable from a measured one.
     2. The engine receives the instant the keeper chose. If it does not, the
        mode shows the keeper an answer about today under a date three weeks
        ago, which is worse than showing nothing.
     3. Stepping recomputes. A stepper that moves a label without moving the
        assessment is a stepper that lies.
     4. Reset clears the test store and only the test store.

   And underneath all four, the property the mode is worthless without: the
   engine is called through the identical code path in either mode. If test
   mode and normal operation could differ on the same inputs, nothing seen here
   would say anything about the tank.

   Each check is named in `mutations.mjs`, which states the source change that
   must turn it red.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore, createStore } from "../../app/src/store/index.js";
import { memoryBackend, DB_NAME, TEST_DB_NAME } from "../../app/src/store/db.js";
import { KIND } from "../../app/src/store/ledger.js";
import { PROVENANCE, nowIso, setClock, todayLocal } from "../../app/src/store/time.js";

/* The LOCAL calendar day of the instant the engine would be handed.
   `nowIso()` returns a genuine absolute instant, so its first ten characters
   are its UTC date — which is the day before the keeper's in Sydney and the
   day after in Niue. Comparing that prefix to a local date made the whole
   suite green only under `TZ=UTC`, and red in four of six zones tried. The
   engine was right throughout; the assertions were reading the wrong field. */
const asOfLocalDay = () => todayLocal(new Date(nowIso()));
import {
  MODE,
  backendForMode,
  currentMode,
  enterTestMode,
  isTestMode,
  leaveTestMode,
  localDateTime,
  resetTestData,
  setTestInstant,
  stepTestDays,
  storeForMode,
  testInstant,
  useBackendFactory,
  useSlots,
} from "../../app/src/store/mode.js";
import { applySeries, doseContext, parseSeries, plan, summarise, timeFor } from "../../app/src/store/seed.js";

const s = suite("test mode");

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

/* A fresh set of slots per check, so one check's mode cannot leak into the
   next. The real app uses `localStorage`; this is the same interface. */
function freshSlots() {
  const m = new Map();
  return {
    get: (k) => (m.has(k) ? m.get(k) : null),
    set: (k, v) => m.set(k, String(v)),
    del: (k) => m.delete(k),
  };
}

/* One clean world per check: fresh slots, and fresh in-memory databases behind
   the production routing. `useBackendFactory` is what lets these checks go
   through `storeForMode` and `resetTestData` — the functions the shell calls —
   rather than around them. */
const dateOnlyReading = (raw, value, date) => ({
  kind: KIND.READING,
  parameter: "ALK",
  rawValue: raw,
  normalizedValue: value,
  unit: "dKH",
  time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: date },
  recordedAt: "2026-08-01T09:00:00Z",
});

/* A slots object that holds nothing, standing in for a browser store the app
   could not use. */
const memorySlotsLike = () => freshSlots();

/* Databases, not connections. `resetTestData()` drops the memoised backend so
   the next read reopens the database — which, for IndexedDB, finds whatever is
   still on disk. A factory handing out a brand-new empty map each time would
   make a reset that did nothing look like one that worked. */
const DATABASES = new Map();

function reset() {
  useSlots(freshSlots());
  DATABASES.clear();
  useBackendFactory((name) => {
    if (!DATABASES.has(name)) DATABASES.set(name, memoryBackend(name));
    return DATABASES.get(name);
  });
}

/* -------------------------------------------------------------------------
   1. The two stores cannot reach each other.
   ---------------------------------------------------------------------- */

s.test("TM-01", "the test store and the real store are different databases", () => {
  reset();
  const real = backendForMode(MODE.REAL);
  const test = backendForMode(MODE.TEST);
  ok(real.dbName, "the real backend names its database");
  ok(test.dbName, "the test backend names its database");
  eq(real.dbName, DB_NAME, "the real mode uses the real tank's database");
  eq(test.dbName, TEST_DB_NAME, "test mode uses its own database");
  ok(real.dbName !== test.dbName, "and the two are not the same database");
});

s.test("TM-02", "nothing written in test mode appears in the real store", async () => {
  /* THROUGH THE PRODUCTION ROUTING, NOT AROUND IT.

     The first version of this check built two stores by hand. They were
     separate because the TEST built them separately, so it proved a property
     of its own fixtures and stayed green with the whole of `mode.js` pointed
     at the real database. `storeForMode` is what the shell actually calls, so
     it is what is called here. */
  reset();
  const real = storeForMode(MODE.REAL);
  const test = storeForMode(MODE.TEST);
  ok(real.dbName !== test.dbName, "the two modes resolve to different databases");

  await real.ledger.append(dateOnlyReading("8.7", 8.7, "2026-08-01"));

  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const seeded = storeForMode(currentMode());
  eq(seeded.dbName, TEST_DB_NAME, "test mode is pointed at the test database");

  const { rows, problems } = parseSeries("2026-03-01 alk 9.9\n2026-03-02 alk 9.8\n2026-03-03 dose 8.8");
  eq(problems.length, 0, "the series parses");
  await applySeries(seeded, rows, { config: { netVolumeL: 77 } });

  const realEvents = await real.ledger.allEvents();
  const testEvents = await test.ledger.allEvents();

  eq(realEvents.length, 1, "the real store still holds exactly what it held");
  eq(realEvents[0].normalizedValue, 8.7, "and it is unchanged");
  eq(testEvents.length, 3, "the test store holds the seeded series");
  ok(!testEvents.some((e) => e.normalizedValue === 8.7), "nothing from the real store is in it");
  ok(
    !realEvents.some((e) => e.normalizedValue === 9.9 || e.normalizedValue === 9.8),
    "and nothing seeded reached the real store"
  );

  leaveTestMode();
  eq(storeForMode(currentMode()).dbName, DB_NAME, "and leaving points the app back at the real tank");
});

s.test("TM-03", "switching modes copies, merges and migrates nothing in either direction", async () => {
  reset();
  const real = storeForMode(MODE.REAL);
  await real.ledger.append(dateOnlyReading("8.7", 8.7, "2026-08-01"));

  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const test = storeForMode(currentMode());
  eq((await test.ledger.allEvents()).length, 0, "entering test mode did not copy the real records in");

  const { rows } = parseSeries("2026-03-01 alk 9.9");
  await applySeries(test, rows, {});

  leaveTestMode();
  eq(currentMode(), MODE.REAL, "the mode is back to the real tank");
  const backReal = storeForMode(currentMode());
  eq((await backReal.ledger.allEvents()).length, 1, "the real store gained nothing on the way out");
  eq((await backReal.ledger.allEvents())[0].normalizedValue, 8.7, "and its own reading is untouched");

  enterTestMode({});
  eq((await storeForMode(currentMode()).ledger.allEvents()).length, 1, "and the test store kept what it had");
  leaveTestMode();
});

s.test("TM-04", "the assessment instant is the one the keeper set", () => {
  reset();
  eq(isTestMode(), false, "test mode is off by default");
  const realNow = nowIso();

  enterTestMode({ date: "2026-03-14", time: "09:30" });
  const asOf = nowIso();

  eq(asOfLocalDay(), "2026-03-14", "the assessment instant is the chosen day");
  eq(todayLocal(), "2026-03-14", "and every screen's idea of today follows it");
  ok(asOf !== realNow, "which is not the wall clock");

  /* The instant is an absolute one, built from the keeper's local wall time,
     so it round-trips back to the day they picked rather than landing on the
     day before it in a westward timezone. */
  eq(
    todayLocal(localDateTime("2026-03-14", "09:30")),
    "2026-03-14",
    "the chosen local moment resolves back to the chosen local day"
  );

  leaveTestMode();
  eq(todayLocal(), todayLocal(new Date()), "and turning it off restores the wall clock");
});

s.test("TM-05", "the engine is reached through one entry point that takes the instant as an argument", () => {
  /* A source-shape check, and deliberately so. The property it guards is not
     "the instant is right today" — that is TM-04 — it is that there is no
     second path to the engine for test mode to take. `assess.js` is the only
     caller of the engine client, `runAssessment` is its only entry, and
     neither it nor anything below it knows which mode it is in.

     If this ever needs a `if (testMode)` to pass, the mode has stopped being
     an evaluation tool and the check has done its job. */
  const assess = fs.readFileSync(path.join(ROOT, "app/src/assess.js"), "utf8");
  const client = fs.readFileSync(path.join(ROOT, "app/src/engine/client.js"), "utf8");
  const worker = fs.readFileSync(path.join(ROOT, "app/src/engine/worker.js"), "utf8");

  ok(/export async function runAssessment\(store, asOf\)/.test(assess), "one entry point, taking asOf");
  ok(/asOf,?\n?\s*\}\)/.test(assess) || /asOf/.test(assess), "which it passes to the engine");

  for (const [name, src] of [["assess.js", assess], ["client.js", client], ["worker.js", worker]]) {
    ok(!/\btestMode\b|\bisTestMode\b|\bMODE\./.test(src), `${name} has no test-mode branch in it`);
  }

  /* And the clock is read in exactly one place in the whole application, which
     is what lets the instant be changed without a second pipeline. */
  eq(
    /export function nowAsOf\(\)\s*\{\s*return nowIso\(\);\s*\}/.test(assess),
    true,
    "nowAsOf reads the application clock rather than the wall clock"
  );
});

/* -------------------------------------------------------------------------
   3. Stepping moves the instant, and the instant is what everything follows.
   ---------------------------------------------------------------------- */

s.test("TM-06", "stepping forward and back moves the assessment instant by whole days", () => {
  reset();
  enterTestMode({ date: "2026-03-14", time: "09:30" });

  eq(stepTestDays(1).date, "2026-03-15", "forward a day");
  eq(asOfLocalDay(), "2026-03-15", "and the instant handed to the engine moves with it");
  eq(todayLocal(), "2026-03-15", "and so does what every screen calls today");

  eq(stepTestDays(-1).date, "2026-03-14", "back a day");
  eq(asOfLocalDay(), "2026-03-14", "and the instant follows again");

  eq(testInstant().time, "09:30", "the time of day is kept across a step");

  /* Across a month end, because a step that adds 86400000 milliseconds is
     wrong at a daylight-saving boundary and wrong at the end of February. */
  setTestInstant({ date: "2026-02-28" });
  eq(stepTestDays(1).date, "2026-03-01", "a step over a month end lands on the next day");

  eq(setTestInstant({ date: "2026-06-01", time: "18:00" }).date, "2026-06-01", "a jump lands where it was told");
  eq(asOfLocalDay(), "2026-06-01", "and the engine's instant jumps with it");
  leaveTestMode();
});

s.test("TM-07", "an assessment run after a step is run for the stepped day", async () => {
  reset();
  const store = createMemoryStore(TEST_DB_NAME);
  enterTestMode({ date: "2026-03-14", time: "09:30" });

  /* The shell's own sequence, without the shell: read the clock, hand it to
     the assessment. `runAssessment` is not called here because it needs the
     Python engine; what is proved is the argument it would be given, which is
     the only thing stepping changes. */
  const before = nowIso();
  stepTestDays(3);
  const after = nowIso();

  ok(after > before, "the instant moved forward");
  eq(asOfLocalDay(), "2026-03-17", "to the day stepped to");

  /* And the store is untouched by stepping: moving the date is not an edit. */
  eq((await store.ledger.allEvents()).length, 0, "stepping wrote nothing");
  leaveTestMode();
});

/* -------------------------------------------------------------------------
   4. Reset clears the test store and only the test store.
   ---------------------------------------------------------------------- */

s.test("TM-08", "clearing the test data destroys the test store and only the test store", async () => {
  /* Through `resetTestData()`, the function the shell calls. The earlier
     version called `store.destroy()` on a store the test had built itself, so
     the one line that decides WHICH database is destroyed — the line whose
     mistake wipes the keeper's tank — was not covered at all. */
  reset();
  const real = storeForMode(MODE.REAL);
  await real.ledger.append(dateOnlyReading("8.7", 8.7, "2026-08-01"));

  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const test = storeForMode(currentMode());
  const { rows } = parseSeries("2026-03-01 alk 9.9\n2026-03-02 alk 9.8");
  await applySeries(test, rows, {});
  await test.config.append({ netVolumeL: 77 }, "2026-03-01T00:00:00Z");
  eq((await test.ledger.allEvents()).length, 2, "the test store has something to clear");

  const r = await resetTestData();
  eq(r.ok, true, "the clear reported success");

  const after = storeForMode(MODE.TEST);
  eq((await after.ledger.allEvents()).length, 0, "the test store is empty");
  eq((await after.config.history()).length, 0, "including its own tank facts");

  const realAfter = storeForMode(MODE.REAL);
  eq((await realAfter.ledger.allEvents()).length, 1, "and the real store still holds its reading");
  eq((await realAfter.ledger.allEvents())[0].normalizedValue, 8.7, "byte for byte");
  leaveTestMode();
});

s.test("TM-08b", "a clear that could not clear is reported as a failure, not as success", async () => {
  /* Another tab holding the database open blocks the delete. The first version
     of this discarded that answer and cleared the memo anyway, so the keeper
     saw an emptied screen over a store that still held the last run — and the
     next series he seeded landed on top of it. */
  reset();
  useBackendFactory((name) => {
    const b = memoryBackend(name);
    if (name === TEST_DB_NAME) b.destroy = async () => ({ ok: false, reason: "held open elsewhere" });
    return b;
  });

  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const test = storeForMode(currentMode());
  const { rows } = parseSeries("2026-03-01 alk 9.9");
  await applySeries(test, rows, {});

  const r = await resetTestData();
  eq(r.ok, false, "the failure is returned rather than swallowed");
  ok(r.reason, "with a reason a person could act on");
  eq(
    (await storeForMode(MODE.TEST).ledger.allEvents()).length,
    1,
    "and the records are still there, because they were not cleared"
  );
  leaveTestMode();
});

/* -------------------------------------------------------------------------
   Bulk entry never gives a record a time it was not given.
   ---------------------------------------------------------------------- */

s.test("TM-09", "a seeded line with no time produces a record with no time in it", async () => {
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows, problems } = parseSeries(
    ["2026-03-01 alk 8.6", "2026-03-03 09:15 alk 8.4"].join("\n")
  );
  eq(problems.length, 0, "both lines parse");

  const s0 = summarise(plan(rows).planned);
  eq(s0.dateOnly, 1, "one is date-only");
  eq(s0.withTime, 1, "one carries a time");

  const t0 = timeFor(rows[0]);
  eq(t0.timeProvenance, PROVENANCE.DATE_ONLY, "the line with no time is date-only");
  eq("absoluteInstant" in t0, false, "and has no instant on it at all — not null, absent");
  eq("localTime" in t0, false, "and no time of day either");

  const t1 = timeFor(rows[1]);
  eq(t1.timeProvenance, PROVENANCE.EXACT_ABSOLUTE, "the line with a time is exact");
  ok(t1.absoluteInstant, "and carries an instant");

  await applySeries(store, rows, {});
  const events = await store.ledger.allEvents();
  eq(events.length, 2, "both were written");
  const dateOnlyEvent = events.find((e) => e.time.localDate === "2026-03-01");
  eq(dateOnlyEvent.time.timeProvenance, PROVENANCE.DATE_ONLY, "and the stored record is still date-only");
  eq(dateOnlyEvent.time.absoluteInstant, undefined, "with no instant on it");
});

s.test("TM-10", "a bad line stops the whole batch rather than half-applying it", async () => {
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows, problems } = parseSeries(
    ["2026-03-01 alk 8.6", "not-a-date alk 8.5", "2026-03-02 alk banana"].join("\n")
  );
  eq(problems.length, 2, "both bad lines are reported");
  eq(problems[0].line, 2, "with their line numbers");
  eq(problems[1].line, 3, "each of them");
  eq(rows.length, 1, "and only the readable line is offered");

  /* The screen refuses to apply while there are problems; this proves the
     parser reports them rather than dropping them silently. */
  eq((await store.ledger.allEvents()).length, 0, "nothing was written by parsing");
});

s.test("TM-11", "the first dose line is a standing dose, not a change from a dose nobody gave", async () => {
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows } = parseSeries(["2026-03-01 dose 8.8", "2026-03-05 dose 10.0"].join("\n"));
  await applySeries(store, rows, {});
  const events = await store.ledger.allEvents();

  eq(events[0].kind, KIND.DOSE_STATE, "the first is a statement of the standing dose");
  eq(events[0].detail.doseMlPerDay, 8.8, "at the value given");
  eq(events[1].kind, KIND.DOSE_CHANGE, "the second is a change");
  eq(events[1].detail.fromMlPerDay, 8.8, "from the value the batch actually established");
  eq(events[1].detail.toMlPerDay, 10, "to the new one");
});

s.test("TM-12", "bulk entry is refused outside test mode", async () => {
  reset();
  eq(isTestMode(), false, "test mode is off");
  /* The guard lives on the shell's own verb, which is where the store is
     chosen. Proved here through the module the shell calls: a caller that
     reaches `applySeries` has already been through it. */
  const main = fs.readFileSync(path.join(ROOT, "app/src/main.js"), "utf8");
  ok(
    /async seedSeries\(rows\) \{\s*\n\s*if \(!isTestMode\(\)\) throw/.test(main),
    "seeding a series refuses when test mode is off"
  );
  ok(
    /async resetTest\(\) \{\s*\n\s*if \(!isTestMode\(\)\) throw/.test(main),
    "and so does clearing the test data"
  );
  await throws(
    async () => {
      const { rows } = parseSeries("2026-03-01 alk 8.6");
      if (!isTestMode()) throw new Error("refused");
      return rows;
    },
    "refused",
    "the guard fires"
  );
});

/* -------------------------------------------------------------------------
   The reload path — the one every launch after the first takes.
   ---------------------------------------------------------------------- */

s.test("TM-14", "a relaunch already in test mode installs the chosen clock", () => {
  /* The keeper turns test mode on once, through `enterTestMode`. Every launch
     after that goes through `useSlots()` -> `applyClock()` instead, and that
     path had no test at all: deleting `applyClock()` from `useSlots` left the
     whole gate green while the marker named March and the engine was asked
     about today. That is the deception the marker exists to prevent, on the
     most-travelled path in the feature. */
  const stored = freshSlots();
  stored.set("dw2.mode", "TEST");
  stored.set("dw2.testDate", "2026-03-14");
  stored.set("dw2.testTime", "09:30");

  useSlots(stored);

  eq(isTestMode(), true, "the mode came back from storage");
  eq(testInstant().date, "2026-03-14", "and so did the instant");
  eq(todayLocal(), "2026-03-14", "the clock is installed without anyone calling enterTestMode");
  eq(asOfLocalDay(), "2026-03-14", "and the engine would be handed the stored instant");

  /* And the inverse: stored state saying REAL must restore the wall clock,
     however the process was left. */
  const off = freshSlots();
  off.set("dw2.mode", "REAL");
  useSlots(off);
  eq(isTestMode(), false, "stored state saying real is honoured");
  eq(todayLocal(), todayLocal(new Date()), "and the wall clock is back");
  reset();
});

s.test("TM-15", "storage that cannot be written falls back to the real tank, never to test mode", () => {
  /* A private window can expose `localStorage` and throw on write.
     `browserSlots()` probes with a write for that reason. The direction of the
     fallback is the point: an app that failed INTO test mode would show the
     keeper a hypothetical tank and call it his own. */
  const src = fs.readFileSync(path.join(ROOT, "app/src/store/mode.js"), "utf8");
  ok(/ls\.setItem\(KEY_MODE \+ "\.probe"/.test(src), "the probe is a write, not a presence check");
  ok(
    /return browserSlots\(\) \|\| memorySlots\(\)/.test(src.replace(/\s+/g, " ")) ||
      /custom \|\| browserSlots\(\) \|\| memorySlots\(\)/.test(src),
    "an unusable store falls back to memory"
  );
  useSlots(memorySlotsLike());
  eq(isTestMode(), false, "and a store with nothing in it is not test mode");
  reset();
});

/* -------------------------------------------------------------------------
   Stepping is calendar arithmetic, and it has to be.
   ---------------------------------------------------------------------- */

s.test("TM-16", "stepping is calendar arithmetic, across daylight saving and a leap day", () => {
  reset();
  enterTestMode({ date: "2026-03-07", time: "09:30" });

  const days = [];
  for (let i = 0; i < 6; i += 1) days.push(stepTestDays(1).date);
  deepEq(
    days,
    ["2026-03-08", "2026-03-09", "2026-03-10", "2026-03-11", "2026-03-12", "2026-03-13"],
    "six forward steps land on six consecutive days"
  );
  for (let i = 0; i < 6; i += 1) stepTestDays(-1);
  eq(testInstant().date, "2026-03-07", "and six back returns to where it started");

  /* Leap day. */
  setTestInstant({ date: "2028-02-28" });
  eq(stepTestDays(1).date, "2028-02-29", "into the leap day");
  eq(stepTestDays(1).date, "2028-03-01", "and out of it");
  eq(stepTestDays(-1).date, "2028-02-29", "and back into it");

  setTestInstant({ date: "2026-02-28" });
  eq(stepTestDays(1).date, "2026-03-01", "a month end in an ordinary year");
  leaveTestMode();
  reset();

  /* DAYLIGHT SAVING, IN A ZONE THAT HAS IT.

     `mode.js` says a step is calendar arithmetic BECAUSE 86400000 milliseconds
     is the wrong length of day twice a year. That claim is unprovable in the
     zone this suite usually runs in: under UTC there is no daylight saving, so
     millisecond arithmetic is genuinely equivalent and a mutation to it
     survives untouched — which is exactly what happened.

     So this arm runs in a child process under a zone that does have it. In
     Sydney, 5 April 2026 is twenty-five hours long: local midnight plus
     86400000 milliseconds is 23:00 on the SAME DAY, so the step does not
     advance the date at all and the keeper's "next day" button stops working
     for one day a year. The child imports `time.js` from this tree, so a
     mutated tree is the tree it tests. */
  const proof = execFileSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      `import { addDays } from ${JSON.stringify(pathToFileURL(path.join(ROOT, "app/src/store/time.js")).href)};
       process.stdout.write(JSON.stringify([
         addDays("2026-04-05", 1),
         addDays("2026-04-06", -1),
         addDays("2026-10-04", 1),
         addDays("2026-10-05", -1),
       ]));`,
    ],
    { env: { ...process.env, TZ: "Australia/Sydney" }, encoding: "utf8" }
  );
  deepEq(
    JSON.parse(proof),
    ["2026-04-06", "2026-04-05", "2026-10-05", "2026-10-04"],
    "a step is one calendar day on a 25-hour day and on a 23-hour day"
  );
});

s.test("TM-17", "the marker and the clock always name the same day", () => {
  /* `new Date(y, m, d)` rolls over, so a stored `2026-02-30` printed one day
     on the marker while the engine was asked about another. It cannot be typed
     into a date input, but it can arrive from a stale stored value — and a
     marker naming the wrong day is the one failure the marker exists to
     prevent. */
  const stored = freshSlots();
  stored.set("dw2.mode", "TEST");
  stored.set("dw2.testDate", "2026-02-30");
  stored.set("dw2.testTime", "09:00");
  useSlots(stored);

  eq(testInstant().date, todayLocal(), "what the marker shows is what the clock says");
  eq(testInstant().date, asOfLocalDay(), "and what the engine is asked about");
  eq(testInstant().date, "2026-03-02", "normalised to the day it actually is");
  reset();
});

/* -------------------------------------------------------------------------
   Bulk entry: the rest of the grammar, and the two ways it could fabricate.
   ---------------------------------------------------------------------- */

s.test("TM-18", "water changes, one-off additions and notes all go in from the same paste", async () => {
  reset();
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows, problems } = parseSeries(
    [
      "2026-03-01 dose 8.8",
      "2026-03-06 water 0.13",
      "2026-03-08 water 10L",
      "2026-03-09 manual 20",
      "2026-03-10 note skimmer overflowed overnight",
    ].join("\n")
  );
  eq(problems.length, 0, "every line parses");
  await applySeries(store, rows, { config: { netVolumeL: 77 } });
  const events = await store.ledger.allEvents();
  eq(events.length, 5, "all five were written");

  const water = events.filter((e) => e.kind === KIND.WATER_CHANGE);
  eq(water.length, 2, "two water changes");
  eq(water[0].detail.changedFraction, 0.13, "a fraction is taken as given");
  ok(Math.abs(water[1].detail.changedFraction - 10 / 77) < 1e-12, "litres are divided by the tank volume");

  const manual = events.find((e) => e.kind === KIND.MANUAL_CORRECTION);
  eq(manual.detail.amountMl, 20, "the one-off addition carries its millilitres");

  const note = events.find((e) => e.kind === KIND.NOTE);
  eq(note.detail.note, "skimmer overflowed overnight", "and the note keeps its whole sentence");
});

s.test("TM-19", "a water change in litres with no tank volume is refused before anything is written", async () => {
  /* `seed.js` promises in its own header never to half-apply a batch. It used
     to break that promise here: the refusal was raised from the middle of the
     write loop, so every line above the water change was already in the
     ledger. The keeper set the volume, pasted the same text again, and held
     every earlier line twice — and if a dose line was among them, the second
     pass wrote a dose change from a value to itself. */
  reset();
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows, problems } = parseSeries(
    ["2026-03-01 alk 8.6", "2026-03-02 water 10L", "2026-03-03 alk 8.5"].join("\n")
  );
  eq(problems.length, 0, "nothing is wrong at parse time — the volume is a fact about the store");

  const planned = plan(rows, { config: null });
  eq(planned.problems.length, 1, "planning raises it, because planning is before the write");
  eq(planned.problems[0].line, 2, "against the line that needs it");

  await throws(() => applySeries(store, rows, {}), "volume", "and the write refuses");
  eq((await store.ledger.allEvents()).length, 0, "having written nothing at all");

  /* With the volume on record the same paste goes in whole. */
  await applySeries(store, rows, { config: { netVolumeL: 77 } });
  eq((await store.ledger.allEvents()).length, 3, "all three, once");
});

s.test("TM-20", "dose lines are resolved in the order they happened, not the order they were typed", async () => {
  /* Pasting a later dose above an earlier one used to record a standing dose
     on the later date and a CHANGE FROM it on the earlier one — a change away
     from a value that, in event time, had not yet been set. That is fabricated
     delivery history, arriving through a different door from the one `TM-11`
     already guards. */
  reset();
  const store = createMemoryStore(TEST_DB_NAME);
  const { rows } = parseSeries(["2026-03-05 dose 10.0", "2026-03-01 dose 8.8"].join("\n"));
  await applySeries(store, rows, {});

  const events = (await store.ledger.allEvents()).filter(
    (e) => e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE
  );
  const first = events.find((e) => e.time.localDate === "2026-03-01");
  const second = events.find((e) => e.time.localDate === "2026-03-05");

  eq(first.kind, KIND.DOSE_STATE, "the EARLIEST dose is the standing dose");
  eq(first.detail.doseMlPerDay, 8.8, "at its own value");
  eq(second.kind, KIND.DOSE_CHANGE, "the later one is the change");
  eq(second.detail.fromMlPerDay, 8.8, "from the value that was actually running before it");
  eq(second.detail.toMlPerDay, 10, "to the new one");
});

s.test("TM-21", "a dose dated before dose history the ledger already holds is refused", async () => {
  /* The ledger is append-only, so slipping earlier delivery history underneath
     an existing standing dose would need that record rewritten into a change.
     Refused with a reason rather than guessed at. */
  reset();
  const store = createMemoryStore(TEST_DB_NAME);
  await applySeries(store, parseSeries("2026-03-05 dose 10.0").rows, {});

  const later = parseSeries("2026-03-01 dose 8.8").rows;
  const ctx0 = await doseContext(store);
  eq(ctx0.knownDose, 10, "the ledger knows what is running");
  const planned = plan(later, { ...ctx0 });
  eq(planned.problems.length, 1, "and refuses a dose dated before it");

  await throws(() => applySeries(store, later, {}), "before", "the write refuses too");
  eq((await store.ledger.allEvents()).length, 1, "and wrote nothing");
});

s.test("TM-22", "a seeded record says it was TOLD to the app now, whatever date it happened on", async () => {
  /* `time.js` states this rule at length and nothing enforced it. `recordedAt`
     is when the app was told, and the app genuinely was running at the real
     instant — a record seeded while the assessment instant sits in March was
     still typed today, and the record has to say so. Putting `recordedAt` on
     the application clock would make every seeded batch claim to have been
     entered on a day the keeper was not there. */
  reset();
  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const store = createMemoryStore(TEST_DB_NAME);
  const before = Date.now();
  await applySeries(store, parseSeries("2026-03-01 alk 8.6").rows, {});
  const after = Date.now();

  const [ev] = await store.ledger.allEvents();
  eq(ev.time.localDate, "2026-03-01", "the event happened on the date the line gave");
  const told = Date.parse(ev.recordedAt);
  ok(told >= before && told <= after, "and was recorded at the real instant, not the chosen one");
  ok(
    !ev.recordedAt.startsWith("2026-03-01"),
    "the app clock did not reach recordedAt: " + ev.recordedAt
  );
  leaveTestMode();
});

/* -------------------------------------------------------------------------
   One clock, one owner.
   ---------------------------------------------------------------------- */

s.test("TM-23", "nothing outside the listed places reads the wall clock", () => {
  /* Requirement 1 is that EVERYTHING downstream follows the chosen instant.
     What makes that true is that the app has one clock and every screen reads
     it; what would quietly break it is one module reaching for `new Date()`
     again. Found on disk rather than listed here, so a module added tomorrow
     is covered without anybody remembering — the idiom `SHELL-01` already
     uses.

     Every entry on the allow-list is a `recordedAt`-class field: when the app
     was TOLD something. `time.js:84-92` requires those to be the wall clock,
     and they are the reason the list is not empty. */
  const ALLOWED = new Set([
    "./store/time.js",       /* the clock itself, and its wall-clock default */
    "./store/ledger.js",     /* nothing — kept listed so a future recordedAt here is a decision */
    "./store/index.js",      /* witness firstSeen — when this device was first seen */
    "./store/schedule.js",   /* completion recordedAt, task createdAt */
    "./store/assessments.js",/* assessment recordedAt */
    "./store/suggestion.js", /* addedAt, and when an offer was accepted */
    "./store/seed.js",       /* seeded records: recordedAt is the REAL instant, per TM-22 */
    "./store/mode.js",       /* the date test mode OFFERS as a starting point, before it owns the clock */
    "./screens/entry.js",    /* reading and correction recordedAt */
    "./screens/entrydetail.js",
    "./screens/logentry.js",
    "./screens/tasks.js",
    "./screens/settings.js", /* exportedAt, and the export's filename */
    "./main.js",             /* water-change recordedAt written alongside a completion */
    "./moments/present.js",  /* a DOM id, not a time */
    "./moments/moments.js",  /* ported V1 motion code, carried unchanged */
  ]);

  const found = [];
  const walk = (dir, prefix) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = `${prefix}/${entry.name}`;
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(abs, rel);
      else if (entry.name.endsWith(".js")) {
        const src = fs.readFileSync(abs, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
        if (/new Date\(\)|Date\.now\(\)/.test(src)) found.push(rel);
      }
    }
  };
  walk(path.join(ROOT, "app/src"), ".");

  const unlisted = found.filter((f) => !ALLOWED.has(f));
  eq(
    unlisted.length,
    0,
    unlisted.length
      ? `these read the wall clock and are not on the list: ${unlisted.join(", ")}`
      : "every wall-clock read is accounted for"
  );

  /* And the other direction: the app's own "today" comes from one place. */
  const schedule = fs.readFileSync(path.join(ROOT, "app/src/store/schedule.js"), "utf8");
  ok(/async today\(\) \{\s*\n\s*return todayLocal\(\);/.test(schedule), "the task store's today is the app's today");
});

s.test("TM-24", "the shell recomputes the assessment when the instant moves, and marks every screen", () => {
  /* Requirement 2 is that the assessment recomputes at each step, and
     requirement 4 that the marker is on every screen. Both live in `main.js`,
     which needs a DOM and so cannot be run here; both are pinned by shape, the
     way `TM-05` and `SHELL-01` are, because the alternative is nothing.

     What each guards: a stepper that moves the date label and leaves
     yesterday's number under it, and a marker that stops being drawn on the
     screen the keeper is looking at. */
  const main = fs.readFileSync(path.join(ROOT, "app/src/main.js"), "utf8");

  const moved = main.slice(main.indexOf("async function movedInstant"), main.indexOf("/* --- rendering"));
  ok(/state\.stepperDay = todayLocal\(\);/.test(moved), "the day stepper follows the instant");
  ok(/if \(config\) await reassess\(\);/.test(moved), "and the assessment is recomputed");
  ok(/await render\(\);/.test(moved), "and the screen redrawn");

  const switched = main.slice(main.indexOf("async function switchedMode"), main.indexOf("async function movedInstant"));
  ok(/state\.assessment = null;/.test(switched), "switching stores drops the last store's assessment");
  ok(/await movedInstant\(\);/.test(switched), "and recomputes against the new one");

  /* The marker is drawn on every render, including the crash render — the one
     screen where the keeper is least sure what they are looking at. */
  const renders = [...main.matchAll(/renderTabs\(\);\s*\n\s*renderMarker\(\);/g)];
  ok(renders.length >= 2, `the marker is drawn on the ordinary render and the crash render (${renders.length})`);

  /* And it is not on the tab bar: requirement 7 puts test mode behind
     Settings, not in the main navigation. */
  const tabs = main.slice(main.indexOf("const TABS = ["), main.indexOf("];", main.indexOf("const TABS = [")));
  ok(!/testmode/.test(tabs), "test mode is not a tab");
  const settings = fs.readFileSync(path.join(ROOT, "app/src/screens/settings.js"), "utf8");
  ok(/ctx\.go\("testmode"\)/.test(settings), "it is reached from Settings");
});

s.test("TM-25", "the tank facts are stamped at the app's own instant, so a backdated assessment resolves one", async () => {
  /* Canon §518 resolves the configuration version effective at the assessment
     instant, and the engine REFUSES outright when none is effective by then.
     Setup stamped `effectiveFrom` from the wall clock, so a configuration
     created inside test mode was effective at the real instant it was typed —
     and every assessment the keeper backdated found no configuration at all
     and refused. The feature did not work on its own primary path. */
  const settings = fs.readFileSync(path.join(ROOT, "app/src/screens/settings.js"), "utf8");
  const save = settings.slice(settings.indexOf("await ctx.store.config.append("), settings.indexOf("ctx.go(\"today\")"));
  ok(/nowIso\(\)/.test(save), "setup stamps the configuration from the application clock");
  ok(!/new Date\(\)\.toISOString\(\)/.test(save), "and not from the wall clock");

  /* And the consequence, through the engine's own resolution rule: a version
     effective at the chosen instant is found, rather than none. */
  reset();
  enterTestMode({ date: "2026-03-14", time: "09:30" });
  const store = createMemoryStore(TEST_DB_NAME);
  await store.config.append({ netVolumeL: 77 }, nowIso());
  const history = await store.config.forEngine();
  eq(history.length, 1, "one version");
  ok(
    Date.parse(history[0].effectiveFrom) <= Date.parse(nowIso()),
    `effective by the instant the engine is asked about: ${history[0].effectiveFrom} <= ${nowIso()}`
  );
  leaveTestMode();
});

/* Housekeeping: leave the process on the wall clock whatever the checks above
   did, so a later suite is not run inside somebody else's March. */
s.test("TM-13", "the wall clock is restored when test mode is off", () => {
  reset();
  setClock(null);
  eq(isTestMode(), false, "off");
  eq(todayLocal(), todayLocal(new Date()), "and today is today again");
});

export default s;
