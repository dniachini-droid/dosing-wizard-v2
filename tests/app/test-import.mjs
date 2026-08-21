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

import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { KIND, toEngineEvents, PARAMETERS } from "../../app/src/store/ledger.js";
import { PROVENANCE } from "../../app/src/store/time.js";
import {
  ORIGIN,
  applyImport,
  checkCounts,
  describePlan,
  naturalKey,
  naturalKeyOfEvent,
  parseBackup,
  planImport,
  timeFor,
} from "../../app/src/store/import-v1.js";

const s = suite("importing V1 history");

/* A small export in the real file's shape. The owner's own file is 353
   readings; this is the same structure with enough of each kind to exercise
   every rule, so the checks stay readable and do not depend on a fixture
   nobody can see. `IMP-10` checks the shape of the real one. */
function backup(overrides = {}) {
  return {
    format: "dans-tank-backup",
    version: 1,
    createdAt: "2026-08-21T05:38:44.913Z",
    counts: { readings: 5, icps: 1, waterChanges: 1, doseChanges: 2, taskLog: 1, lighting: 1 },
    data: {
      readings: [
        { id: "a1", param: "alkalinity", value: 8.7, date: "2026-05-04", note: "" },
        { id: "a2", param: "alkalinity", value: 9.0, date: "2026-08-10", time: "18:00", note: "" },
        { id: "p1", param: "ph", value: 8.12, date: "2026-03-09", note: "" },
        { id: "k1", param: "potassium", value: 410, date: "2026-05-06", note: "" },
        { id: "a3", param: "alkalinity", value: 8.8, date: "2026-08-12", time: "09:24", note: "" },
      ],
      "dose-log": [
        { id: "d1", date: "2026-08-11", time: "09:00", ml: 10, element: "alkalinity", note: "" },
        { id: "d2", date: "2026-08-17", time: "10:17", ml: 8.8, element: "alkalinity", note: "" },
      ],
      "water-changes": [{ id: "wc-2026-08-03", date: "2026-08-03", litres: 10, note: "" }],
      "icp-tests": [{ id: "icp-1", date: "2026-07-26", lab: "Triton", ref: "B-1", elements: { calcium: 435 } }],
      "lighting-log": [{ id: "light-1", date: "2026-08-05", note: "UV 66%" }],
      "task-log": [{ id: "t1", taskId: "rem-alkalinity", date: "2026-08-20", auto: true }],
      reminders: [
        { id: "rem-alkalinity", label: "Test alkalinity", paramKey: "alkalinity", kind: "test", intervalDays: 2, startDate: "2026-08-10", enabled: true },
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
  eq(planned.readings.length, 5, "all five readings are planned");

  const events = await store.ledger.allEvents();
  const readings = events.filter((e) => e.kind === KIND.READING);
  eq(readings.length, 5, "and all five are written");

  const params = readings.map((r) => r.parameter).sort();
  deepEq(params, ["ALK", "ALK", "ALK", "K", "PH"], "including pH and potassium");

  /* Which the store has to be able to name, or they could not be stored
     truthfully at all. */
  for (const key of ["PH", "K"]) {
    ok(PARAMETERS.some((p) => p.key === key), `${key} is a parameter this store knows`);
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
  doc.counts.readings = 6;
  const planned = planImport(doc);
  eq(planned.readings.length, 5, "the five it can name are planned");
  eq(planned.problems.length, 1, "and the one it cannot is a reported problem");
  ok(/iodine/.test(planned.problems[0].why), "which names it");
});

/* -------------------------------------------------------------------------
   3. Nothing is invented — least of all delivery history.
   ---------------------------------------------------------------------- */

s.test("IMP-07", "the first dose is a standing dose and no history is invented before it", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const doses = (await store.ledger.allEvents()).filter(
    (e) => e.kind === KIND.DOSE_STATE || e.kind === KIND.DOSE_CHANGE
  );
  eq(doses.length, 2, "two dose records, exactly as many as the file holds");

  eq(doses[0].kind, KIND.DOSE_STATE, "the earliest is a statement of the standing dose");
  eq(doses[0].detail.doseMlPerDay, 10, "at the value recorded");
  eq(doses[0].time.localDate, "2026-08-11", "on its own date");
  eq(doses[1].kind, KIND.DOSE_CHANGE, "the second is a change");
  eq(doses[1].detail.fromMlPerDay, 10, "from the value the record actually establishes");
  eq(doses[1].detail.toMlPerDay, 8.8, "to the new one");

  /* And nothing before 11 August. The tank settings carry a current daily dose
     of 8.8; back-projecting it over the earlier six months would make the
     whole history look analysable and would be manufactured delivery data. */
  ok(!doses.some((d) => d.time.localDate < "2026-08-11"), "no dose event predates the first recorded one");
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
  eq(good.actual.readings, 5, "and the counts are read from the contents");

  const bad = backup();
  bad.counts.readings = 353;
  const checked = checkCounts(bad);
  eq(checked.disagreements.length, 1, "a file that does not match itself is caught");
  eq(checked.disagreements[0].key, "readings", "naming which count");
  eq(checked.disagreements[0].stated, 353, "what it claimed");
  eq(checked.disagreements[0].actual, 5, "and what it holds");
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
  eq((await store.tasks.tasks()).length, 1, "one reminder, not two");

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
  doc.counts.readings = 6;

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

  eq(d.total, 5, "five readings");
  eq(d.withTime, 2, "two with a time");
  eq(d.dateOnly, 3, "three without");
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

s.test("IMP-19", "reminders come across with the keeper's own intervals, not the old app's defaults", async () => {
  const store = createMemoryStore();
  await importInto(store, backup());
  const [task] = await store.tasks.tasks();
  eq(task.id, "rem-alkalinity", "his own reminder");
  eq(task.intervalDays, 2, "at the interval HE set, which is every two days");
  eq(task.parameter, "ALK", "against the parameter it tests");
  eq(task.startDate, "2026-08-10", "from the date he set it");

  const [done] = await store.tasks.completions();
  eq(done.taskId, "rem-alkalinity", "and its history comes with it");
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

export default s;
