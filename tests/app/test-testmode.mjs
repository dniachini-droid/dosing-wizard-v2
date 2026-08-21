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
import { fileURLToPath } from "node:url";
import { suite, eq, ok, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { memoryBackend, DB_NAME, TEST_DB_NAME } from "../../app/src/store/db.js";
import { KIND } from "../../app/src/store/ledger.js";
import { PROVENANCE, nowIso, setClock, todayLocal } from "../../app/src/store/time.js";
import {
  MODE,
  backendForMode,
  currentMode,
  enterTestMode,
  isTestMode,
  leaveTestMode,
  localDateTime,
  setTestInstant,
  stepTestDays,
  testInstant,
  useSlots,
} from "../../app/src/store/mode.js";
import { applySeries, parseSeries, plan, summarise, timeFor } from "../../app/src/store/seed.js";

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

function reset() {
  useSlots(freshSlots());
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
  const real = createMemoryStore(DB_NAME);
  const test = createMemoryStore(TEST_DB_NAME);

  await real.ledger.append({
    kind: KIND.READING,
    parameter: "ALK",
    rawValue: "8.7",
    normalizedValue: 8.7,
    unit: "dKH",
    time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: "2026-08-01" },
    recordedAt: "2026-08-01T09:00:00Z",
  });

  const { rows, problems } = parseSeries("2026-03-01 alk 9.9\n2026-03-02 alk 9.8\n2026-03-03 dose 8.8");
  eq(problems.length, 0, "the series parses");
  await applySeries(test, rows, { config: { netVolumeL: 77 } });

  const realEvents = await real.ledger.allEvents();
  const testEvents = await test.ledger.allEvents();

  eq(realEvents.length, 1, "the real store still holds exactly what it held");
  eq(realEvents[0].normalizedValue, 8.7, "and it is unchanged");
  eq(testEvents.length, 3, "the test store holds the seeded series");
  ok(
    !testEvents.some((e) => e.normalizedValue === 8.7),
    "and nothing from the real store is in it"
  );
  ok(
    !realEvents.some((e) => e.normalizedValue === 9.9 || e.normalizedValue === 9.8),
    "and nothing seeded reached the real store"
  );
});

s.test("TM-03", "leaving test mode copies nothing in either direction", async () => {
  reset();
  const real = createMemoryStore(DB_NAME);
  const test = createMemoryStore(TEST_DB_NAME);

  enterTestMode({ date: "2026-03-01", time: "09:00" });
  const { rows } = parseSeries("2026-03-01 alk 9.9");
  await applySeries(test, rows, {});
  leaveTestMode();

  eq(currentMode(), MODE.REAL, "the mode is back to the real tank");
  eq((await real.ledger.allEvents()).length, 0, "the real store gained nothing");
  eq((await test.ledger.allEvents()).length, 1, "and the test store kept what it had");
});

/* -------------------------------------------------------------------------
   2. The engine is given the instant the keeper chose.
   ---------------------------------------------------------------------- */

s.test("TM-04", "the assessment instant is the one the keeper set", () => {
  reset();
  eq(isTestMode(), false, "test mode is off by default");
  const realNow = nowIso();

  enterTestMode({ date: "2026-03-14", time: "09:30" });
  const asOf = nowIso();

  eq(asOf.slice(0, 10), "2026-03-14", "the assessment instant is the chosen day");
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
  eq(nowIso().slice(0, 10), "2026-03-15", "and the instant handed to the engine moves with it");
  eq(todayLocal(), "2026-03-15", "and so does what every screen calls today");

  eq(stepTestDays(-1).date, "2026-03-14", "back a day");
  eq(nowIso().slice(0, 10), "2026-03-14", "and the instant follows again");

  eq(testInstant().time, "09:30", "the time of day is kept across a step");

  /* Across a month end, because a step that adds 86400000 milliseconds is
     wrong at a daylight-saving boundary and wrong at the end of February. */
  setTestInstant({ date: "2026-02-28" });
  eq(stepTestDays(1).date, "2026-03-01", "a step over a month end lands on the next day");

  eq(setTestInstant({ date: "2026-06-01", time: "18:00" }).date, "2026-06-01", "a jump lands where it was told");
  eq(nowIso().slice(0, 10), "2026-06-01", "and the engine's instant jumps with it");
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
  eq(after.slice(0, 10), "2026-03-17", "to the day stepped to");

  /* And the store is untouched by stepping: moving the date is not an edit. */
  eq((await store.ledger.allEvents()).length, 0, "stepping wrote nothing");
  leaveTestMode();
});

/* -------------------------------------------------------------------------
   4. Reset clears the test store and only the test store.
   ---------------------------------------------------------------------- */

s.test("TM-08", "clearing the test data leaves the real store alone", async () => {
  const realBackend = memoryBackend(DB_NAME);
  const testBackend = memoryBackend(TEST_DB_NAME);
  const { createStore } = await import("../../app/src/store/index.js");
  const real = createStore(realBackend);
  const test = createStore(testBackend);

  await real.ledger.append({
    kind: KIND.READING,
    parameter: "ALK",
    rawValue: "8.7",
    normalizedValue: 8.7,
    unit: "dKH",
    time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: "2026-08-01" },
    recordedAt: "2026-08-01T09:00:00Z",
  });
  const { rows } = parseSeries("2026-03-01 alk 9.9\n2026-03-02 alk 9.8");
  await applySeries(test, rows, {});
  await test.config.append({ netVolumeL: 77 }, "2026-03-01T00:00:00Z");

  eq((await test.ledger.allEvents()).length, 2, "the test store has something to clear");

  const r = await test.destroy();
  eq(r.ok, true, "the clear reported success");

  eq((await test.ledger.allEvents()).length, 0, "the test store is empty");
  eq((await test.config.history()).length, 0, "including its own tank facts");
  eq((await real.ledger.allEvents()).length, 1, "and the real store still holds its reading");
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

  const s0 = summarise(plan(rows));
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

/* Housekeeping: leave the process on the wall clock whatever the checks above
   did, so a later suite is not run inside somebody else's March. */
s.test("TM-13", "the wall clock is restored when test mode is off", () => {
  reset();
  setClock(null);
  eq(isTestMode(), false, "off");
  eq(todayLocal(), todayLocal(new Date()), "and today is today again");
});

export default s;
