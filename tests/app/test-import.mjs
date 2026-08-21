/* ============================================================================
   IMPORTING THE KEEPER'S V1 HISTORY
   ----------------------------------------------------------------------------
   One rule dominates every check here, and it is the only one in the whole
   application that cannot be undone: TIME PROVENANCE NEVER IMPROVES. A
   fabricated timestamp is indistinguishable from a real one the moment it is
   stored, and the reading then enters trend arithmetic it should never have
   been eligible for. There is no later fix, because there is nothing left to
   tell the two apart.

   So: date-only stays date-only; a local clock reading with no timezone stays
   a local clock reading with no timezone; and nothing anywhere in the import
   produces an absolute instant.

   The rest follows from the same discipline. Nothing is keyed on a V1 id,
   because V1's ids do not survive an export. Nothing is written twice, because
   the keeper who runs the import again must not end up with a second copy of
   his own history. And the counts are checked against the file, because a file
   that disagrees with itself is not the file it says it is.

   Each check is named in `mutations.mjs`, which states the source change that
   must turn it red.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { KIND, toEngineEvents, PARAMETERS } from "../../app/src/store/ledger.js";
import { PROVENANCE } from "../../app/src/store/time.js";
import { PARAMETERS as ALL_PARAMETERS } from "../../app/src/store/ledger.js";
import { reconstructedInstant, resolveLocalInZone } from "../../app/src/store/time.js";
import {
  ORIGIN,
  applyImport,
  effectiveConfidence,
  checkCounts,
  describePlan,
  naturalKey,
  naturalKeyOfEvent,
  parseBackup,
  planImport,
  timeFor,
} from "../../app/src/store/import-v1.js";

const s = suite("importing V1 history");

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

/* A small export in the real file's shape. The owner's own file is 353
   readings; this is the same structure with enough of each kind to exercise
   every rule, so the checks stay readable and do not depend on a fixture
   nobody can see. `IMP-10` checks the shape of the real one. */
/* SHAPED LIKE THE REAL FILE, CARRYING NONE OF THE KEEPER'S DATA.

   The first version of this fixture listed its dose rows oldest-first. The
   keeper's own export lists them NEWEST-FIRST, and that one difference was
   exactly where the suite was blind: removing the sort that puts them back in
   order left every check green while inverting his dose history — the earliest
   dose recorded as a change away from a value that, in event time, had not yet
   been set.

   So the shape is copied and the data is not: dose rows in reverse
   chronological order, every one of the eight parameter names the export uses,
   integer and float values, each reminder kind, a counts block. */
function backup(overrides = {}) {
  return {
    format: "dans-tank-backup",
    version: 1,
    createdAt: "2026-08-21T05:38:44.913Z",
    counts: { readings: 10, icps: 1, waterChanges: 1, doseChanges: 3, taskLog: 1, lighting: 1 },
    data: {
      readings: [
        { id: "a1", param: "alkalinity", value: 8.7, date: "2026-05-04", note: "" },
        { id: "a2", param: "alkalinity", value: 9.0, date: "2026-08-10", time: "18:00", note: "" },
        { id: "p1", param: "ph", value: 8.12, date: "2026-03-09", note: "" },
        { id: "k1", param: "potassium", value: 410, date: "2026-05-06", note: "" },
        { id: "a3", param: "alkalinity", value: 8.8, date: "2026-08-12", time: "09:24", note: "" },
        /* The three parameter names the earlier fixture never exercised.
           Losing any one of them turns a fifth of the keeper's real history
           into problems and refuses the whole import. */
        { id: "n1", param: "nitrate", value: 11.3, date: "2026-08-04", note: "" },
        { id: "f1", param: "phosphate", value: 0.12, date: "2026-08-04", note: "" },
        { id: "s1", param: "salinity", value: 34.6, date: "2026-08-10", time: "18:00", note: "" },
        /* An integer-valued reading, as the export stores them. */
        { id: "c1", param: "calcium", value: 430, date: "2026-08-04", note: "" },
        { id: "m1", param: "magnesium", value: 1520, date: "2026-08-04", note: "" },
      ],
      /* NEWEST FIRST, as the real export writes it. */
      "dose-log": [
        { id: "d3", date: "2026-08-17", time: "11:58", ml: 14, element: "calcium", note: "" },
        { id: "d2", date: "2026-08-17", time: "10:17", ml: 8.8, element: "alkalinity", note: "" },
        { id: "d1", date: "2026-08-11", time: "09:00", ml: 10, element: "alkalinity", note: "" },
      ],
      "water-changes": [{ id: "wc-2026-08-03", date: "2026-08-03", litres: 10, note: "" }],
      "icp-tests": [{ id: "icp-1", date: "2026-07-26", lab: "Triton", ref: "B-1", elements: { calcium: 435 } }],
      "lighting-log": [{ id: "light-1", date: "2026-08-05", note: "UV 66%" }],
      "task-log": [{ id: "t1", taskId: "rem-alkalinity", date: "2026-08-20", auto: true }],
      reminders: [
        { id: "rem-alkalinity", label: "Test alkalinity", paramKey: "alkalinity", kind: "test", intervalDays: 2, startDate: "2026-08-10", enabled: true },
        { id: "waterchange", label: "Water change", paramKey: null, kind: "water", intervalDays: 7, startDate: "2026-08-10", enabled: true, needsVolume: true },
        { id: "carbon", label: "Replace carbon", paramKey: null, kind: "task", intervalDays: 28, startDate: "2026-08-10", enabled: true },
      ],
      "custom-ranges": {
        alkalinity: { min: 8.6, max: 9.2 },
        calcium: { min: 400, max: 450 },
        magnesium: { min: 1400, max: 1500 },
      },
      "tank-settings": { volumeL: 77, dailyDoseMl: 8.8, dkhPerMlPer100L: 0.0533 },
      "findings-dismissed": { "finding|ionic": { at: "2026-08-19" } },
      ...overrides,
    },
  };
}

async function importInto(store, doc, opts = {}) {
  const planned = planImport(doc, {
    existing: await store.ledger.projection(),
    existingCompletions: await store.tasks.completions(),
    config: await store.config.current(),
    reconstruction: opts.reconstruction || null,
  });
  const written = await applyImport(store, planned, {
    asOf: "2026-08-21T10:00:00Z",
    correctedPotencyDkhPerMl: 0.0693,
    ...opts,
  });
  return { planned, written };
}

/* -------------------------------------------------------------------------
   1. Provenance never improves. The rule with no second chance.
   ---------------------------------------------------------------------- */

s.test("IMP-01", "a reading with no time in the file gets a record with no time in it", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const events = await store.ledger.allEvents();

  const dateOnly = events.find((e) => e.kind === KIND.READING && e.time.localDate === "2026-05-04");
  eq(dateOnly.time.timeProvenance, PROVENANCE.DATE_ONLY, "it is date-only");
  eq("absoluteInstant" in dateOnly.time, false, "with no instant on it at all — not null, absent");
  eq("localTime" in dateOnly.time, false, "and no time of day either");
});

s.test("IMP-02", "a reading with a time keeps the time and does not gain a timezone", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const events = await store.ledger.allEvents();

  const timed = events.find((e) => e.kind === KIND.READING && e.time.localDate === "2026-08-10");
  eq(timed.time.timeProvenance, PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN, "the clock reading is kept for what it is");
  eq(timed.time.localTime, "18:00", "at the time the file gave");
  eq("absoluteInstant" in timed.time, false, "and it is NOT turned into an absolute instant");
  eq("offsetMinutes" in timed.time, false, "no offset was supplied on its behalf");
  eq("displayTimeZoneId" in timed.time, false, "and no timezone was assumed for it");
});

s.test("IMP-03", "NOTHING the import writes carries an absolute instant", async () => {
  /* The blanket form of IMP-01 and IMP-02, over every record of every kind.
     Written as a sweep rather than as three separate checks because the
     failure this guards against is a NEW kind of record acquiring one — a
     water change, an ICP panel, a dose — and a per-kind check would not cover
     the kind nobody thought of. */
  const store = createMemoryStore();
  await importInto(store, backup());
  const events = await store.ledger.allEvents();
  ok(events.length >= 9, `there is something to check: ${events.length}`);

  const withInstant = events.filter((e) => e.time.absoluteInstant || (e.effectiveTime && e.effectiveTime.absoluteInstant));
  eq(
    withInstant.length,
    0,
    withInstant.length
      ? `these gained an instant nobody recorded: ${withInstant.map((e) => `${e.kind} ${e.time.localDate}`).join(", ")}`
      : "no imported record carries an instant"
  );

  /* And every one of them declares which of the two it is. A record with no
     provenance at all is worse than a wrong one: nothing downstream can even
     ask. */
  for (const e of events) {
    ok(
      e.time.timeProvenance === PROVENANCE.DATE_ONLY ||
        e.time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN,
      `${e.kind} on ${e.time.localDate} declares a legacy provenance, not ${e.time.timeProvenance}`
    );
    /* A date-only record has NO time of day on it. Checking only for an
       absolute instant is not enough: `00:00` stored as a local clock reading
       is still a time nobody recorded, still indistinguishable from a real one
       afterwards, and still the thing the contract forbids. */
    if (e.time.timeProvenance === PROVENANCE.DATE_ONLY) {
      eq(e.time.localTime, undefined, `${e.kind} on ${e.time.localDate} has no time of day at all`);
    } else {
      ok(e.time.localTime, `${e.kind} on ${e.time.localDate} kept the time the file gave it`);
    }
  }

  /* And the arithmetic: exactly as many records carry a time as there are rows
     in the file with one. Not one more. */
  const doc = backup();
  const rowsWithTime =
    doc.data.readings.filter((r) => r.time).length + doc.data["dose-log"].filter((r) => r.time).length;
  const recordsWithTime = events.filter((e) => e.time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN).length;
  eq(recordsWithTime, rowsWithTime, "no record gained a time the file did not give it");
});

s.test("IMP-04", "the two constructors are the only way a time is built", () => {
  /* `timeFor` is the one place. A row with a time and a row without take
     different branches and neither can produce the other's answer. */
  const withoutTime = timeFor({ date: "2026-05-04", time: null });
  eq(withoutTime.timeProvenance, PROVENANCE.DATE_ONLY, "no time in, no time out");
  eq(withoutTime.absoluteInstant, undefined, "and no instant");

  const withTime = timeFor({ date: "2026-08-10", time: "18:00" });
  eq(withTime.timeProvenance, PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN, "a time in, a local time out");
  eq(withTime.absoluteInstant, undefined, "and still no instant");

  /* Frozen, so a later line cannot add the instant the constructor refused to
     invent. */
  ok(Object.isFrozen(withoutTime), "the date-only record is frozen");
  ok(Object.isFrozen(withTime), "and so is the local one");
});

/* -------------------------------------------------------------------------
   2. Every reading comes across, as the measurement it is.
   ---------------------------------------------------------------------- */

s.test("IMP-05", "every reading imports, including parameters this build does not assess", async () => {
  const store = createMemoryStore();
  const { planned } = await importInto(store, backup());
  eq(planned.readings.length, 10, "all ten readings are planned");

  const events = await store.ledger.allEvents();
  const readings = events.filter((e) => e.kind === KIND.READING);
  eq(readings.length, 10, "and all ten are written");

  /* EVERY parameter name the export uses. Deleting one from the map turns a
     whole parameter's history into problems and refuses the entire import — on
     the keeper's real file, dropping `phosphate` alone would refuse 353
     readings because 104 of them could not be named. */
  const params = [...new Set(readings.map((r) => r.parameter))].sort();
  deepEq(params, ["ALK", "CA", "K", "MG", "NO3", "PH", "PO4", "SAL"], "all eight, each with a place to go");
  for (const key of params) {
    const def = PARAMETERS.find((p) => p.key === key);
    ok(def, `${key} is a parameter this store knows`);
    ok(typeof def.unit === "string", `${key} has a unit, even if it is empty`);
  }

  /* The value as the keeper's own file wrote it, never re-rendered from the
     number. */
  const ph = readings.find((r) => r.parameter === "PH");
  eq(ph.rawValue, "8.12", "the raw value is what the file said");
  eq(ph.normalizedValue, 8.12, "beside the number");
  eq(ph.detail.origin, ORIGIN.KEEPER, "and it is marked as the keeper's own record");
});

s.test("IMP-06", "a reading of something the store cannot name is reported, not dropped", () => {
  const doc = backup();
  doc.data.readings.push({ id: "x", param: "iodine", value: 0.06, date: "2026-06-01" });
  doc.counts.readings = 11;
  const planned = planImport(doc);
  eq(planned.readings.length, 10, "the ten it can name are planned");
  eq(planned.problems.length, 1, "and the one it cannot is a reported problem");
  ok(/iodine/.test(planned.problems[0].why), "which names it");
});

/* -------------------------------------------------------------------------
   3. Nothing is invented — least of all delivery history.
   ---------------------------------------------------------------------- */

s.test("IMP-07", "dose rows are read in the order they HAPPENED, not the order the file lists them", async () => {
  /* The keeper's export lists its dose log newest-first. Read in file order,
     the LAST dose becomes the standing dose and the FIRST becomes a change
     away from a value that, in event time, had not yet been established — his
     dose history inverted, and manufactured delivery data, which
     `DATA-PROVENANCE.md` §3 forbids by name.

     The fixture is in that order deliberately. */
  const doc = backup();
  deepEq(
    doc.data["dose-log"].map((r) => r.date),
    ["2026-08-17", "2026-08-17", "2026-08-11"],
    "the fixture lists its doses newest-first, as the real export does"
  );

  const store = createMemoryStore();
  await importInto(store, doc);
  const alk = (await store.ledger.allEvents())
    .filter((e) => (e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE) && e.parameter === "ALK")
    .sort((a, b) => (a.time.localDate < b.time.localDate ? -1 : 1));
  eq(alk.length, 2, "two alkalinity dose records, exactly as many as the file holds");

  eq(alk[0].time.localDate, "2026-08-11", "the EARLIEST is the one dated first");
  eq(alk[0].kind, KIND.DOSE_STATE, "and it is the statement of the standing dose");
  eq(alk[0].detail.doseMlPerDay, 10, "at the value recorded");
  eq(alk[1].time.localDate, "2026-08-17", "the later one comes second");
  eq(alk[1].kind, KIND.DOSE_CHANGE, "and it is the change");
  eq(alk[1].detail.fromMlPerDay, 10, "from the value the record actually establishes");
  eq(alk[1].detail.toMlPerDay, 8.8, "to the new one");

  /* And the boundary the report and the History chart both draw follows the
     same ordering. */
  eq(describePlan(planImport(doc)).doseHistoryFrom, "2026-08-11", "the boundary is the EARLIEST dose");

  /* Nothing before 11 August. The tank settings carry a current daily dose of
     8.8; back-projecting it over the earlier six months would make the whole
     history look analysable and would be manufactured delivery data. */
  const all = (await store.ledger.allEvents()).filter(
    (e) => e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE
  );
  ok(!all.some((d) => d.time.localDate < "2026-08-10"), "no dose event predates the earliest recorded one");
});

s.test("IMP-08", "a calcium dose is stored as history and never reaches the alkalinity engine", async () => {
  /* The engine's dose vocabulary carries no parameter, because it assesses
     alkalinity and has none for anything else. Handed a calcium dose unmarked,
     it would read 14 mL/day of calcium solution as the alkalinity dose and
     attribute the tank's alkalinity movement to a delivery that never touched
     it. */
  const doc = backup();
  doc.data["dose-log"].push({ id: "d3", date: "2026-08-17", time: "11:58", ml: 14, element: "calcium" });
  doc.counts.doseChanges = 3;

  const store = createMemoryStore();
  await importInto(store, doc);
  const events = await store.ledger.allEvents();

  const ca = events.find((e) => e.parameter === "CA" && (e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE));
  ok(ca, "the calcium dose is in the record");
  eq(ca.detail.doseMlPerDay, 14, "at its own value");

  const sent = toEngineEvents(await store.ledger.projection()).filter((e) => e.kind.startsWith("DOSE"));
  eq(sent.length, 2, "only the two alkalinity dose events are sent to the engine");
  ok(
    !sent.some((e) => e.programmedDoseMlPerDay === 14 || e.to === 14),
    "the calcium figure is not among them"
  );
});

s.test("IMP-09", "settings come across as current configuration, with no backdating", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const history = await store.config.history();
  eq(history.length, 1, "one configuration version");

  const cfg = history[0];
  eq(cfg.effectiveFrom, "2026-08-21T10:00:00Z", "effective as of the import, not as of the oldest reading");
  eq(cfg.netVolumeL, 77, "the tank volume");
  eq(cfg.targetRangeMinDkh, 8.6, "and the keeper's alkalinity range");
  eq(cfg.targetRangeMaxDkh, 9.2, "both ends of it");

  /* The correction the owner stated, and what it replaced. */
  eq(cfg.selectedPotencyDkhPerMl, 0.0693, "the corrected solution strength is what gets stored");
  eq(cfg.importedFrom.supersededDkhPerMlPer100L, 0.0533, "and the figure it replaced is recorded beside it");

  /* The other parameters' ranges are the keeper's own and are display only:
     they are kept in the configuration so they are effective-dated like
     everything else, and stripped before the engine sees them, because the
     engine has no input named by any of them. */
  eq(cfg.parameterRanges.CA.min, 400, "his calcium range is kept");
  eq(cfg.parameterRanges.MG.max, 1500, "and his magnesium one");
  ok(!("ALK" in cfg.parameterRanges), "alkalinity's is not duplicated — it is a field the engine reads");

  const forEngine = await store.config.forEngine();
  eq("parameterRanges" in forEngine[0], false, "the display ranges never reach the engine");
  eq("importedFrom" in forEngine[0], false, "and neither does the import's own provenance record");
  eq(forEngine[0].targetRangeMinDkh, 8.6, "what the engine does read is still there");
});

/* -------------------------------------------------------------------------
   4. The file is checked against itself.
   ---------------------------------------------------------------------- */

s.test("IMP-10", "the export's own counts are checked against what is in it", () => {
  const good = checkCounts(backup());
  deepEq(good.disagreements, [], "a file that matches itself passes");
  eq(good.actual.readings, 10, "and the counts are read from the contents");

  const bad = backup();
  bad.counts.readings = 353;
  const checked = checkCounts(bad);
  eq(checked.disagreements.length, 1, "a file that does not match itself is caught");
  eq(checked.disagreements[0].key, "readings", "naming which count");
  eq(checked.disagreements[0].stated, 353, "what it claimed");
  eq(checked.disagreements[0].actual, 10, "and what it holds");
});

s.test("IMP-11", "a file that is not this format is refused before anything is read", () => {
  eq(parseBackup("not json at all").ok, false, "a file that is not JSON");
  eq(parseBackup(JSON.stringify({ format: "something-else", version: 1, data: {} })).ok, false, "a different format");
  eq(parseBackup(JSON.stringify({ format: "dans-tank-backup", version: 2, data: {} })).ok, false, "a later version");
  eq(parseBackup(JSON.stringify({ format: "dans-tank-backup", version: 1 })).ok, false, "a file with no records");
  eq(parseBackup(JSON.stringify(backup())).ok, true, "and the real shape is accepted");
});

/* -------------------------------------------------------------------------
   5. Running it twice changes nothing.
   ---------------------------------------------------------------------- */

s.test("IMP-12", "importing the same file twice adds nothing the second time", async () => {
  const store = createMemoryStore();
  const first = await importInto(store, backup());
  const after = (await store.ledger.allEvents()).length;
  ok(after > 0, "the first run wrote something");

  const second = await importInto(store, backup());
  eq(second.written.readings, 0, "no readings the second time");
  eq(second.written.doses, 0, "no doses");
  eq(second.written.waterChanges, 0, "no water changes");
  eq(second.written.icps, 0, "no ICP panels");
  eq(second.written.lighting, 0, "no lighting notes");
  eq(second.planned.skipped.readings, first.written.readings, "every reading is reported as already held");

  eq((await store.ledger.allEvents()).length, after, "and the record is exactly the size it was");

  /* Completions and reminders are keyed by the task store itself, so a second
     run rewrites the same rows rather than adding new ones. */
  eq((await store.tasks.completions()).length, 1, "one completion, not two");
  eq((await store.tasks.tasks()).length, 3, "three reminders, not six");

  /* A third run, because "idempotent" means every run and not just the
     second. */
  await importInto(store, backup());
  eq((await store.ledger.allEvents()).length, after, "still exactly the same size");
});

s.test("IMP-13", "records are matched on what they say, never on the file's own ids", async () => {
  /* V1's ids do not survive an export/restore round trip: two consecutive
     exports of the same data share none. An importer that keyed on them would
     duplicate the keeper's entire history every time he re-exported. */
  const store = createMemoryStore();
  await importInto(store, backup());
  const before = (await store.ledger.allEvents()).length;

  const reExported = backup();
  for (const r of reExported.data.readings) r.id = "different-" + r.id;
  for (const r of reExported.data["dose-log"]) r.id = "different-" + r.id;
  for (const r of reExported.data["water-changes"]) r.id = "different-" + r.id;

  const { written } = await importInto(store, reExported);
  eq(written.readings, 0, "the same readings under new ids are recognised");
  eq(written.doses, 0, "and so are the doses");
  eq(written.waterChanges, 0, "and the water changes");
  eq((await store.ledger.allEvents()).length, before, "nothing was duplicated");
});

s.test("IMP-14", "two genuinely identical readings on one day both import, and both dedupe", async () => {
  /* A repeat test is a real thing, so the key is counted as a multiset rather
     than tested for membership. Set membership would silently drop the second
     of two repeats — a reading lost from the keeper's own record, with nothing
     saying so. */
  const doc = backup();
  doc.data.readings.push({ id: "a3", param: "alkalinity", value: 8.7, date: "2026-05-04", note: "" });
  doc.counts.readings = 11;

  const store = createMemoryStore();
  await importInto(store, doc);
  const same = (await store.ledger.allEvents()).filter(
    (e) => e.kind === KIND.READING && e.parameter === "ALK" && e.time.localDate === "2026-05-04"
  );
  eq(same.length, 2, "both repeats are in the record");

  const { written } = await importInto(store, doc);
  eq(written.readings, 0, "and a second run adds neither");

  /* THE CASE THAT SEPARATES A MULTISET FROM A SET.

     The ledger already holds ONE of the two repeats, and the file holds two.
     Counting membership would see the key as present and add nothing, losing
     the keeper's second reading with nothing saying so. Counting the multiset
     adds exactly the one that is missing. */
  const fresh = createMemoryStore();
  const one = backup();
  await importInto(fresh, one);
  eq(
    (await fresh.ledger.allEvents()).filter(
      (e) => e.kind === KIND.READING && e.parameter === "ALK" && e.time.localDate === "2026-05-04"
    ).length,
    1,
    "the record starts with one of them"
  );

  const two = await importInto(fresh, doc);
  eq(two.written.readings, 1, "the file's second copy is recognised as one the record does not hold");
  eq(
    (await fresh.ledger.allEvents()).filter(
      (e) => e.kind === KIND.READING && e.parameter === "ALK" && e.time.localDate === "2026-05-04"
    ).length,
    2,
    "and the record now holds both"
  );
});

s.test("IMP-15", "the natural key is what the row says, and nothing else", () => {
  const a = naturalKey(KIND.READING, "ALK", "2026-05-04", "", 8.7);
  const b = naturalKey(KIND.READING, "ALK", "2026-05-04", "", 8.7);
  eq(a, b, "the same row gives the same key");
  ok(a !== naturalKey(KIND.READING, "ALK", "2026-05-04", "18:00", 8.7), "a time is part of it");
  ok(a !== naturalKey(KIND.READING, "CA", "2026-05-04", "", 8.7), "so is the parameter");
  ok(a !== naturalKey(KIND.READING, "ALK", "2026-05-05", "", 8.7), "so is the date");
  ok(a !== naturalKey(KIND.READING, "ALK", "2026-05-04", "", 8.8), "so is the value");

  /* And it round-trips from a stored event, which is what makes the dedup
     work against records the app itself wrote. */
  const event = {
    kind: KIND.READING,
    parameter: "ALK",
    normalizedValue: 8.7,
    time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: "2026-05-04" },
  };
  eq(naturalKeyOfEvent(event), a, "a stored event gives the key its row would have");
});

/* -------------------------------------------------------------------------
   6. What the import SAYS about what it did.
   ---------------------------------------------------------------------- */

s.test("IMP-16", "the report counts what is date-only and where dose history begins", () => {
  const planned = planImport(backup());
  const d = describePlan(planned);

  eq(d.total, 10, "ten readings");
  eq(d.withTime, 3, "three with a time");
  eq(d.dateOnly, 7, "seven without");
  eq(d.exactElapsedAvailable, 0, "and none at all with a provable instant");

  eq(d.doseHistoryFrom, "2026-08-11", "dose history begins at the first recorded dose");
  eq(d.alkBeforeBoundary, 2, "two alkalinity readings before it");
  eq(d.alkAfterBoundary, 1, "and one from then on");

  const alk = d.parameters.find((p) => p.parameter === "ALK");
  eq(alk.total, 3, "the per-parameter counts are there too");
  eq(alk.from, "2026-05-04", "with the span each covers");
  eq(alk.to, "2026-08-12", "both ends of it");
});

s.test("IMP-17", "records the salvage inventory questions are flagged, not quietly treated as the keeper's", async () => {
  /* `V1-DATA-PROVENANCE.md` §5 records a disagreement it does not settle: the
     water changes, ICP panels and lighting note were found byte-identical to
     named V1 source constants, and the owner's confirmation of his readings
     has not been extended to them. Both readings are live. The import does not
     settle it either — it marks them and surfaces the question. */
  const store = createMemoryStore();
  await importInto(store, backup());
  const events = await store.ledger.allEvents();

  for (const kind of [KIND.WATER_CHANGE, KIND.ICP_PANEL, KIND.HUSBANDRY]) {
    const e = events.find((x) => x.kind === kind);
    ok(e, `the ${kind} record is in the ledger`);
    eq(e.detail.origin, ORIGIN.UNCONFIRMED, `and it is flagged as unconfirmed rather than asserted as his`);
  }

  /* While the readings are not in doubt and are not flagged. */
  const reading = events.find((e) => e.kind === KIND.READING);
  eq(reading.detail.origin, ORIGIN.KEEPER, "the readings are his, and say so");
});

s.test("IMP-18", "hide-state for the old app's notices is not imported", async () => {
  const store = createMemoryStore();
  const { planned } = await importInto(store, backup());
  eq(planned.notImported.dismissedFindings, 1, "the report says how many were left behind");

  const events = await store.ledger.allEvents();
  ok(
    !events.some((e) => JSON.stringify(e).includes("finding|")),
    "and none of it reached the record"
  );
});

s.test("IMP-19", "reminders come across with the file's intervals, and are not claimed as the keeper's", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const tasks = await store.tasks.tasks();
  eq(tasks.length, 3, "every reminder in the file");

  const alk = tasks.find((x) => x.id === "rem-alkalinity");
  eq(alk.intervalDays, 2, "at the interval the FILE carries, which for alkalinity is every two days");
  eq(alk.parameter, "ALK", "against the parameter it tests");
  eq(alk.startDate, "2026-08-10", "from the date it carries");

  /* Each reminder KIND, because a water change that does not ask for a volume
     writes no water-change event, and the engine's segmentation needs one. */
  const water = tasks.find((x) => x.id === "waterchange");
  eq(water.needsVolume, true, "a water-change reminder still asks for its volume");
  eq(water.kind, "HUSBANDRY", "and is husbandry, not a test");
  eq(tasks.find((x) => x.id === "carbon").kind, "HUSBANDRY", "and so is a media change");

  /* AND NOT ATTRIBUTED TO HIM.

     `V1-DATA-PROVENANCE.md` §2.4 records that one interval was edited and the
     rest are the old app's shipped defaults — and the export does not say
     which is which. Marking all of them as his choices would be the app
     asserting something it cannot know. */
  for (const task of tasks) {
    eq(task.origin, ORIGIN.CONFIGURATION, `${task.id} is marked as unverified configuration`);
    ok(task.origin !== ORIGIN.KEEPER, `${task.id} is not claimed as the keeper's own choice`);
  }

  const [done] = await store.tasks.completions();
  eq(done.taskId, "rem-alkalinity", "and the completion history comes with it");
  eq(done.date, "2026-08-20", "on the day it was done");
});

/* -------------------------------------------------------------------------
   7. The imported ledger, as the engine will see it.
   ---------------------------------------------------------------------- */

s.test("IMP-20", "every imported reading is offered to the engine with its true provenance", async () => {
  /* Not filtered. The engine owns eligibility and says with a reason code what
     it could not use; an app that dropped the ineligible ones would make the
     record on screen disagree with the record the engine was given, and the
     keeper would be told a reading was excluded by something that never saw
     it. */
  const store = createMemoryStore();
  await importInto(store, backup());
  const sent = toEngineEvents(await store.ledger.projection());

  const readings = sent.filter((e) => e.kind === "READING");
  eq(readings.length, 3, "all three alkalinity readings are sent");
  ok(
    readings.some((r) => r.timeProvenance === PROVENANCE.DATE_ONLY),
    "the date-only one is sent, with its provenance"
  );
  ok(
    readings.some((r) => r.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN),
    "and so is the local-time one, with its own"
  );
  /* Its `measuredAt` is the calendar day, because there is no instant to send
     and inventing one is the whole thing this module refuses to do. */
  for (const r of readings) {
    ok(!/[+Z]/.test(String(r.measuredAt)), `no offset was invented for ${r.measuredAt}`);
  }
});

s.test("IMP-21", "the report the keeper reads counts exactly what the import writes", async () => {
  /* The report is the whole point of the screen: he reads it and then decides.
     A report that counts one thing while the write does another is worse than
     no report, because he agreed to something that did not happen.

     `IMP-16` checks the report against the FILE; this checks it against the
     RECORD afterwards, which is a different question and the one that catches
     a change made on the way in. */
  const store = createMemoryStore();
  const { planned, written } = await importInto(store, backup());
  const described = describePlan(planned);
  const events = await store.ledger.allEvents();

  eq(written.readings, described.total, "as many readings written as the report promised");

  const stored = events.filter((e) => e.kind === KIND.READING);
  eq(
    stored.filter((e) => e.time.timeProvenance === PROVENANCE.DATE_ONLY).length,
    described.dateOnly,
    "and exactly as many of them are date-only as it said"
  );
  eq(
    stored.filter((e) => e.time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN).length,
    described.withTime,
    "and exactly as many carry a time"
  );
  eq(
    stored.filter((e) => e.time.absoluteInstant).length,
    described.exactElapsedAvailable,
    "and the report's count of provable instants is the record's, which is none"
  );
});

/* -------------------------------------------------------------------------
   8. Reconstruction — the ONE governed way provenance may improve.
   ---------------------------------------------------------------------- */

const SYDNEY = { zoneId: "Australia/Sydney", basis: "KEEPER_STATEMENT", statedAt: "2026-08-21T10:00:00Z" };

s.test("IMP-22", "a stated timezone reconstructs a timed reading, and records that it did", async () => {
  /* Canon `SHARED-LEGACY-TIME-001`: `RECONSTRUCTED_WITH_PROVENANCE` may
     participate normally "only when the historical timezone/offset is
     independently proven AND the reconstruction is recorded". Both halves, or
     neither. */
  const store = createMemoryStore();
  await importInto(store, backup(), { reconstruction: SYDNEY });
  const timed = (await store.ledger.allEvents()).find(
    (e) => e.kind === KIND.READING && e.time.localDate === "2026-08-10" && e.parameter === "ALK"
  );

  eq(timed.time.timeProvenance, PROVENANCE.RECONSTRUCTED_WITH_PROVENANCE, "the provenance is the reconstructed one");
  eq(timed.time.localTime, "18:00", "the clock reading is untouched");
  eq(timed.time.absoluteInstant, "2026-08-10T18:00:00+10:00", "and it now names an instant, with its offset");
  eq(timed.time.offsetMinutes, 600, "the offset in force in that zone on that date");

  /* The proof, on the record. A record carrying the stronger provenance and
     not the reason for it is what the canon's condition exists to prevent. */
  ok(timed.time.reconstruction, "the reconstruction is recorded on the record");
  eq(timed.time.reconstruction.zoneId, "Australia/Sydney", "naming the zone");
  eq(timed.time.reconstruction.basis, "KEEPER_STATEMENT", "naming where the zone came from");
  eq(timed.time.reconstruction.statedAt, SYDNEY.statedAt, "and when it was stated");
});

s.test("IMP-23", "a date-only reading gains NOTHING from a reconstruction", async () => {
  /* The whole point. 325 of the keeper's 353 readings have no time of day, and
     a stated timezone gives them none: there is no clock reading to
     reconstruct, and supplying one would be the fabrication this module exists
     to refuse. */
  const store = createMemoryStore();
  await importInto(store, backup(), { reconstruction: SYDNEY });
  const events = await store.ledger.allEvents();

  const dateOnly = events.filter((e) => e.time.timeProvenance === PROVENANCE.DATE_ONLY);
  ok(dateOnly.length >= 7, `there are date-only records to check: ${dateOnly.length}`);
  for (const e of dateOnly) {
    eq(e.time.absoluteInstant, undefined, `${e.kind} on ${e.time.localDate} still has no instant`);
    eq(e.time.localTime, undefined, "and no time of day");
    eq(e.time.reconstruction, undefined, "and nothing was reconstructed for it");
    deepEq(Object.keys(e.time), ["timeProvenance", "localDate"], "the record has exactly two fields");
  }

  /* And the count is the same as it was without a zone: reconstruction moves
     records between the OTHER two provenances and never out of date-only. */
  const without = createMemoryStore();
  await importInto(without, backup());
  const beforeCount = (await without.ledger.allEvents()).filter(
    (e) => e.time.timeProvenance === PROVENANCE.DATE_ONLY
  ).length;
  eq(dateOnly.length, beforeCount, "a stated zone changes how many records are date-only by nothing at all");
});

s.test("IMP-24", "the offset is resolved per record, across a daylight-saving change", async () => {
  /* Sydney is +11:00 until early April and +10:00 until October, and the
     keeper's history spans February to August. One offset applied to the whole
     run would be wrong for roughly half of it. */
  const feb = reconstructedInstant("2026-02-13", "09:00", "Australia/Sydney", SYDNEY);
  const aug = reconstructedInstant("2026-08-10", "18:00", "Australia/Sydney", SYDNEY);
  eq(feb.offsetMinutes, 660, "February is on summer time");
  eq(aug.offsetMinutes, 600, "August is not");
  eq(feb.absoluteInstant, "2026-02-13T09:00:00+11:00", "and each carries its own offset");
  eq(aug.absoluteInstant, "2026-08-10T18:00:00+10:00", "its own, not the other's");

  /* Either side of the change itself. */
  eq(reconstructedInstant("2026-04-04", "09:00", "Australia/Sydney", SYDNEY).offsetMinutes, 660, "the day before");
  eq(reconstructedInstant("2026-04-06", "09:00", "Australia/Sydney", SYDNEY).offsetMinutes, 600, "the day after");
});

s.test("IMP-25", "an hour that daylight saving skipped or repeated is NOT reconstructed", async () => {
  /* An hour the clocks skipped never happened; an hour they repeated happened
     twice. Neither has one answer, and picking one would be the fabrication
     with extra steps. The record stays as it arrived. */
  eq(resolveLocalInZone("2026-10-04", "02:30", "Australia/Sydney"), null, "an hour that never happened");
  eq(resolveLocalInZone("2026-04-05", "02:30", "Australia/Sydney"), null, "an hour that happened twice");
  eq(reconstructedInstant("2026-10-04", "02:30", "Australia/Sydney", SYDNEY), null, "neither is reconstructed");

  /* And an ordinary hour on the same days is. */
  ok(resolveLocalInZone("2026-04-05", "01:30", "Australia/Sydney"), "an unambiguous hour still resolves");

  /* Through the importer: such a row keeps the weaker provenance rather than
     falling through to something stronger. */
  const doc = backup();
  doc.data.readings.push({ id: "amb", param: "alkalinity", value: 9.1, date: "2026-04-05", time: "02:30" });
  doc.counts.readings = 11;
  const store = createMemoryStore();
  await importInto(store, doc, { reconstruction: SYDNEY });
  const row = (await store.ledger.allEvents()).find((e) => e.time.localDate === "2026-04-05");
  eq(row.time.timeProvenance, PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN, "it keeps the provenance it arrived with");
  eq(row.time.absoluteInstant, undefined, "and gains no instant");
  eq(row.time.localTime, "02:30", "while keeping the clock reading it does have");

  /* And the report counts it as one it could not resolve, so the keeper learns
     that before the import runs rather than after. */
  const described = describePlan(planImport(doc, { reconstruction: SYDNEY }), SYDNEY);
  eq(described.unreconstructable, 1, "the report says one could not be resolved");
});

s.test("IMP-26", "the stronger provenance cannot be built without its proof", async () => {
  await throws(
    () => reconstructedInstant("2026-08-10", "18:00", "Australia/Sydney", null),
    "reconstructed",
    "a reconstruction with no record of itself is refused"
  );
  await throws(
    () => reconstructedInstant("2026-08-10", "18:00", "Australia/Sydney", { basis: "X" }),
    "reconstructed",
    "and so is one with no statement date"
  );
  await throws(
    () => reconstructedInstant("2026-08-10", "18:00", "", SYDNEY),
    "timezone",
    "and one with no zone"
  );
});

s.test("IMP-27", "with no timezone stated, nothing is reconstructed at all", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const events = await store.ledger.allEvents();
  eq(events.filter((e) => e.time.absoluteInstant).length, 0, "no record carries an instant");
  ok(
    events.some((e) => e.time.timeProvenance === PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN),
    "the timed ones keep their clock readings, as the weaker provenance"
  );
  eq(describePlan(planImport(backup())).exactElapsedAvailable, 0, "and the report says none is provable");
});

s.test("IMP-28", "a dose says how sure it is of when it took effect, and never asserts more", async () => {
  /* `ALK-V2-DATA-CONTRACT.md:250` makes this required, and an `EXACT` the
     record does not support suppresses `M-5`'s straddling-interval
     confounding — the engine then attributes a response it should have
     refused. Derived from the record, three ways, each true of the row. */
  const exact = effectiveConfidence(
    { date: "2026-08-17", time: "10:17" },
    reconstructedInstant("2026-08-17", "10:17", "Australia/Sydney", SYDNEY)
  );
  eq(exact.level, "EXACT", "a resolved instant is exact");

  const local = effectiveConfidence({ date: "2026-08-17", time: "10:17" }, { localDate: "2026-08-17" });
  eq(local.level, "UNCERTAIN", "a clock reading with no proven offset is not");
  ok(local.bounds.effectiveAtEarliest < local.bounds.effectiveAtLatest, "and it is bounded");
  ok(
    Date.parse(local.bounds.effectiveAtEarliest) <= Date.parse("2026-08-17T10:17:00Z") &&
      Date.parse(local.bounds.effectiveAtLatest) >= Date.parse("2026-08-17T10:17:00Z"),
    "by bounds that contain every offset the world has"
  );

  const dayOnly = effectiveConfidence({ date: "2026-08-17", time: null }, { localDate: "2026-08-17" });
  eq(dayOnly.level, "UNCERTAIN", "a row with no time at all is uncertain too");
  ok(
    Date.parse(dayOnly.bounds.effectiveAtLatest) - Date.parse(dayOnly.bounds.effectiveAtEarliest) >
      Date.parse(local.bounds.effectiveAtLatest) - Date.parse(local.bounds.effectiveAtEarliest),
    "and bounded more widely, because less is known"
  );

  /* Through the importer, on a file with no zone: the dose rows carry clock
     readings and no proven offset, so they are uncertain and say so. */
  const store = createMemoryStore();
  await importInto(store, backup());
  for (const e of (await store.ledger.allEvents()).filter((x) => x.kind.startsWith("DOSE"))) {
    eq(e.detail.effectiveAtConfidence, "UNCERTAIN", `${e.time.localDate} does not claim to be exact`);
    ok(e.detail.effectiveAtEarliest && e.detail.effectiveAtLatest, "and carries the bounds that requires");
  }

  /* And with the zone stated, the same rows become exact — because now they
     genuinely are. */
  const zoned = createMemoryStore();
  await importInto(zoned, backup(), { reconstruction: SYDNEY });
  for (const e of (await zoned.ledger.allEvents()).filter((x) => x.kind.startsWith("DOSE"))) {
    eq(e.detail.effectiveAtConfidence, "EXACT", `${e.time.localDate} is exact once the offset is known`);
  }
});

/* -------------------------------------------------------------------------
   9. What review found: rows that lie, records that come back, and identity.
   ---------------------------------------------------------------------- */

s.test("IMP-29", "a row whose date or time is not one is refused, and nothing is imported", async () => {
  /* A date the keeper never recorded is the same defect as a TIME he never
     recorded, reached through the other field, and it was unguarded: a row
     with no date stored the string "undefined" as its calendar day, which
     sorts ahead of every real date and lands at the head of his history. */
  for (const bad of [
    { id: "x", param: "alkalinity", value: 8.7 },
    { id: "x", param: "alkalinity", value: 8.7, date: "banana" },
    { id: "x", param: "alkalinity", value: 8.7, date: "2026-13-45" },
    { id: "x", param: "alkalinity", value: 8.7, date: "2026-02-30" },
    { id: "x", param: "alkalinity", value: 8.7, date: 20260504 },
  ]) {
    const doc = backup();
    doc.data.readings.push(bad);
    doc.counts.readings = 11;
    const planned = planImport(doc);
    ok(planned.problems.length >= 1, `"${bad.date}" is reported as a problem`);
    ok(
      !planned.readings.some((r) => !/^\d{4}-\d{2}-\d{2}$/.test(r.date)),
      `and no planned row carries "${bad.date}" as a date`
    );
  }

  /* And a time field that is not a time. `if (row.time)` is a truthiness test,
     so `time: "banana"` used to climb the provenance ladder and produce a
     record claiming the time of day was known. */
  for (const bad of ["banana", "25:99", "0", "9:5"]) {
    const doc = backup();
    doc.data.readings.push({ id: "x", param: "alkalinity", value: 8.7, date: "2026-05-05", time: bad });
    doc.counts.readings = 11;
    const planned = planImport(doc);
    ok(planned.problems.length >= 1, `a time of "${bad}" is reported`);
    ok(!planned.readings.some((r) => r.date === "2026-05-05"), "and the row is not planned");
  }

  /* Nothing reaches the ledger while a problem stands. */
  const store = createMemoryStore();
  const doc = backup();
  doc.data.readings.push({ id: "x", param: "alkalinity", value: 8.7, date: "banana" });
  doc.counts.readings = 11;
  const planned = planImport(doc);
  ok(planned.problems.length > 0, "the batch has a problem");
  eq((await store.ledger.allEvents()).length, 0, "and planning wrote nothing");
});

s.test("IMP-30", "a record the keeper corrected or disowned does not come back on a re-import", async () => {
  /* Superseded and invalid records were skipped when counting what the ledger
     already holds, so a second import re-wrote as a fresh CURRENT record every
     reading he had corrected or explicitly marked invalid. A correction would
     return beside its own correction — one real measurement as two live
     observations, inflating the cluster count that is an evidence minimum. */
  const store = createMemoryStore();
  await importInto(store, backup());
  const before = (await store.ledger.allEvents()).length;

  const original = (await store.ledger.allEvents()).find(
    (e) => e.kind === KIND.READING && e.time.localDate === "2026-05-04"
  );
  await store.ledger.append({
    kind: KIND.READING,
    parameter: "ALK",
    rawValue: "8.9",
    normalizedValue: 8.9,
    unit: "dKH",
    time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: "2026-05-04" },
    recordedAt: "2026-08-22T09:00:00Z",
    supersedes: original.eventId,
  });

  const { written } = await importInto(store, backup());
  eq(written.readings, 0, "the corrected reading is not re-imported");

  const live = (await store.ledger.projection()).filter(
    (r) => r.state === "CURRENT" && r.event.kind === KIND.READING && r.event.time.localDate === "2026-05-04"
  );
  eq(live.length, 1, "and there is one live reading for that day, not two");
  eq((await store.ledger.allEvents()).length, before + 1, "the correction is the only thing that was added");
});

s.test("IMP-31", "a record keys the same way however it was written", async () => {
  /* The keeper runs both apps until cutover, so a dose change or a water
     change can reach this store twice: once typed into a form here, once
     through an import of the file he exported there. The app's own dose forms
     set no parameter; the importer sets "ALK". Keyed differently, the two
     spellings of one fact were two records — a delivery event that never
     happened. */
  const store = createMemoryStore();
  await store.config.append({ netVolumeL: 77 }, "2026-01-01T00:00:00Z");

  await store.ledger.append({
    kind: KIND.DOSE_STATE,
    time: { timeProvenance: PROVENANCE.LOCAL_TIME_ZONE_UNKNOWN, localDate: "2026-08-11", localTime: "09:00" },
    recordedAt: "2026-08-11T09:00:00Z",
    detail: { doseMlPerDay: 10, effectiveAtConfidence: "EXACT" },
  });
  await store.ledger.append({
    kind: KIND.WATER_CHANGE,
    time: { timeProvenance: PROVENANCE.DATE_ONLY, localDate: "2026-08-03" },
    recordedAt: "2026-08-03T09:00:00Z",
    detail: { changedFraction: 10 / 77 },
  });

  const { written } = await importInto(store, backup());
  eq(written.doses, 2, "only the two doses the ledger did not already hold");
  eq(written.waterChanges, 0, "and the water change it did hold is recognised");

  const doses = (await store.ledger.allEvents()).filter((e) => e.kind.startsWith("DOSE"));
  eq(doses.filter((e) => e.time.localDate === "2026-08-11").length, 1, "the 11 August dose is in the record once");
});

s.test("IMP-32", "a second import continues the dose record rather than restarting it", async () => {
  /* The documented cutover path: `DATA-PROVENANCE.md` says a fresh export at
     cutover becomes the baseline, so the keeper re-exports. A later dose row
     arriving in a second import found no running value and was written as a
     second STANDING dose — losing what it changed from. */
  const store = createMemoryStore();
  await importInto(store, backup());

  const later = backup();
  later.data["dose-log"].unshift({ id: "d4", date: "2026-09-01", time: "09:00", ml: 12, element: "alkalinity" });
  later.counts.doseChanges = 4;
  await importInto(store, later);

  const sept = (await store.ledger.allEvents()).find((e) => e.time.localDate === "2026-09-01");
  eq(sept.kind, KIND.DOSE_CHANGE, "the new dose is a change, not a second standing dose");
  eq(sept.detail.fromMlPerDay, 8.8, "from the value the record already established");
  eq(sept.detail.toMlPerDay, 12, "to the new one");
});

s.test("IMP-33", "the configuration refuses a value it was not given", async () => {
  /* `Number("")` is 0 and `Number.isFinite(0)` is true, so a blank solution
     strength stored zero AND marked it as configured — in the one field every
     dose recommendation scales linearly in. */
  const blank = createMemoryStore();
  await importInto(blank, backup(), { correctedPotencyDkhPerMl: null });
  const cfg = await blank.config.current();
  eq("selectedPotencyDkhPerMl" in cfg, false, "an unstated strength is absent, not zero");

  /* A tank volume the export does not carry is absent too. NaN passed
     `missingFacts()`'s `== null` test as though it had been supplied, so the
     app believed it knew the tank's size. */
  const noVolume = backup();
  delete noVolume.data["tank-settings"].volumeL;
  const store = createMemoryStore();
  await importInto(store, noVolume);
  const c2 = await store.config.current();
  ok(!("netVolumeL" in c2) || Number.isFinite(c2.netVolumeL), "the volume is absent rather than NaN");
  ok((await store.config.missingFacts()).includes("netVolumeL"), "and the app knows it still needs it");

  /* And what the keeper already configured survives. The pump's step is a
     keeper fact with no default and the export has no field for it. */
  const existing = createMemoryStore();
  await existing.config.append(
    { netVolumeL: 50, recommendationPrecisionMlPerDay: 0.1, selectedPotencyDkhPerMl: 0.05 },
    "2026-01-01T00:00:00Z"
  );
  await importInto(existing, backup());
  const after = await existing.config.current();
  eq(after.recommendationPrecisionMlPerDay, 0.1, "the pump step is carried forward");
  eq(after.netVolumeL, 77, "and the volume the export does carry replaces the old one");
});

s.test("IMP-34", "a file that cannot be checked against itself is refused", async () => {
  /* `checkCounts` only compared the counts a file happened to state, so an
     export with its counts block removed imported as though it were whole —
     and a truncated file looks exactly like a complete one. */
  const noCounts = backup();
  delete noCounts.counts;
  const checked = checkCounts(noCounts);
  ok(checked.disagreements.length > 0, "a file that states no counts is reported");
  ok(checked.disagreements.every((d) => d.unstated), "as unstated rather than as a mismatch");

  const partial = backup();
  delete partial.counts.readings;
  ok(
    checkCounts(partial).disagreements.some((d) => d.key === "readings" && d.unstated),
    "and so is one that omits a single count"
  );

  /* A section that is not a list is a reported problem, not a crash — it used
     to throw out of the report and leave the screen on "Reading…". */
  const notAList = backup();
  notAList.data.readings = { nope: true };
  const planned = planImport(notAList);
  ok(planned.problems.length > 0, "a section that is not a list is reported");
  eq(planned.readings.length, 0, "and nothing is planned from it");
});

s.test("IMP-35", "one owner for the boundary, and no route to a stronger provenance", () => {
  /* `MASTER RULE 1`. History had its own copy of "where dose history begins",
     and the two had already diverged on which events count. */
  const history = fs.readFileSync(path.join(ROOT, "app/src/screens/history.js"), "utf8");
  ok(
    /import \{ firstDoseDate \} from "\.\.\/store\/import-v1\.js";/.test(history),
    "History asks the one function"
  );
  ok(!/function firstDoseDate/.test(history), "and does not carry a second copy of the rule");

  /* And the correction sheet offers no provenance stronger than the record
     already has — for EVERY provenance, not only date-only. Offered "Exact" on
     an imported reading, it would have applied today's device offset to last
     August's clock reading. */
  const detail = fs.readFileSync(path.join(ROOT, "app/src/screens/entrydetail.js"), "utf8");
  ok(
    /tc\.removeOptionsAbove\(e\.time\.timeProvenance\);/.test(detail),
    "the correction sheet ceilings on the record's own provenance"
  );
  ok(
    !/if \(e\.time\.timeProvenance === PROVENANCE\.DATE_ONLY\) \{\s*\n\s*\/\* Matched/.test(detail),
    "and not on date-only alone"
  );
});

s.test("IMP-36", "what the engine reads survives the import", async () => {
  const store = createMemoryStore();
  await store.config.append({ netVolumeL: 77 }, "2026-01-01T00:00:00Z");
  await importInto(store, backup());
  const sent = toEngineEvents(await store.ledger.projection());

  /* A water change reaches the engine as a fraction of the system, and every
     one of them must carry it — it is the engine's only input for the event. */
  const water = sent.filter((e) => e.kind === "WATER_CHANGE");
  ok(water.length >= 1, "the water change is sent");
  for (const w of water) {
    ok(Number.isFinite(w.changedFraction), `a water change carries its fraction: ${w.changedFraction}`);
  }

  /* And an ICP panel keeps its results. Keyed on date and element count alone,
     two different panels on one date collapsed into one record. */
  const icp = (await store.ledger.allEvents()).find((e) => e.kind === KIND.ICP_PANEL);
  ok(Object.keys(icp.detail.elements).length > 0, "an ICP panel keeps its results");

  const two = backup();
  two.data["icp-tests"].push({ id: "icp-2", date: "2026-07-26", lab: "ATI", ref: "B-2", elements: { calcium: 440 } });
  two.counts.icps = 2;
  const both = createMemoryStore();
  await importInto(both, two);
  eq(
    (await both.ledger.allEvents()).filter((e) => e.kind === KIND.ICP_PANEL).length,
    2,
    "two panels on one date are two records"
  );

  /* A panel is identified by the LAB's own reference, not by how many results
     it happens to carry. Keyed on the count, the same panel re-exported with
     one more element reported looks like a different panel and imports again. */
  const richer = backup();
  richer.data["icp-tests"] = [
    { id: "icp-1", date: "2026-07-26", lab: "Triton", ref: "B-1", elements: { calcium: 435, magnesium: 1407 } },
  ];
  const again = await importInto(both, richer);
  eq(again.written.icps, 0, "the same panel with an extra result is still the same panel");

  /* And a panel with no results at all is a reported problem, not an empty
     record standing in for one. */
  const empty = backup();
  empty.data["icp-tests"] = [{ id: "icp-e", date: "2026-07-27", lab: "Triton", ref: "B-9", elements: {} }];
  ok(planImport(empty).problems.length > 0, "an ICP panel with no results is reported");
});

export default s;
