/* ============================================================================
   ASSESSMENTS ARE STORED RECORDS
   ----------------------------------------------------------------------------
   With version stamps, from the first commit. Never rewritten.

   The failure this guards against is quiet and permanent: recompute the
   assessment on every draw, and correcting a reading from three weeks ago
   silently rewrites what the app said three weeks ago. Nothing afterwards can
   recover what it actually said.
   ========================================================================= */

import { suite, eq, ok, deepEq, throws } from "./harness.mjs";
import { createMemoryStore } from "../../app/src/store/index.js";
import { ASSESSMENTS } from "../../app/src/store/db.js";

const s = suite("stored assessments");

const VERSIONS = {
  engineVersion: "alk-v2-engine/0.1.0 (stage one — normal path)",
  canonVersion: "SHARED_V2_FREEZE_2 / ALK_V2_FREEZE_5",
};

const result = (dose) => ({
  assessmentAsOf: "2026-08-20T07:40:00Z",
  parameter: "ALK",
  configVersionId: "CFG-V1",
  position: "IN_RANGE",
  doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: dose },
  reasonCodes: [{ code: "TRAJECTORY_FALLING", owner: "TREND", severity: "INFO", payload: {} }],
});

s.test("ASS-01", "every stored assessment carries all four version stamps and its input set", async () => {
  const store = createMemoryStore();
  const { stored, record } = await store.assessments.record({
    engineResult: result(9.3),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: ["e1", "e2", "e3"],
    configVersionId: "CFG-V1",
    describe: VERSIONS,
  });

  ok(stored, "it was stored");
  eq(record.engineVersion, VERSIONS.engineVersion, "the engine version stamp");
  eq(record.canonVersion, VERSIONS.canonVersion, "the canon version stamp");
  eq(record.configVersionId, "CFG-V1", "the configuration version stamp");
  eq(record.asOf, "2026-08-20T07:40:00Z", "the assessment instant");
  deepEq(record.inputEventIds, ["e1", "e2", "e3"], "the identity of every input event");
  eq(record.inputEventCount, 3, "the input count");
  ok(record.recordedAt, "when it was written down");
  eq(record.schemaVersion, 1, "the record's schema version");
});

s.test("ASS-02", "the engine result is stored verbatim, not summarised", async () => {
  const store = createMemoryStore();
  const engineResult = result(9.3);
  const { record } = await store.assessments.record({
    engineResult,
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: [],
    describe: VERSIONS,
  });
  deepEq(record.engineResult, engineResult, "the stored result");
  /* Including the reason codes, which a summary would be most tempted to drop. */
  eq(record.engineResult.reasonCodes.length, 1, "the reason codes survive");
  eq(record.engineResult.reasonCodes[0].code, "TRAJECTORY_FALLING", "and are unaltered");
});

s.test("ASS-03", "a re-analysis is a NEW record; the old one keeps saying what it said", async () => {
  const store = createMemoryStore();
  const first = await store.assessments.record({
    engineResult: result(9.3),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: ["e1"],
    describe: VERSIONS,
  });

  /* Same instant, different answer — the ledger changed underneath it. */
  const second = await store.assessments.record({
    engineResult: result(9.5),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: ["e1", "e2"],
    describe: VERSIONS,
  });

  ok(second.stored, "the second answer was stored");
  ok(second.record.assessmentId !== first.record.assessmentId, "under a new identity");

  const all = await store.assessments.all();
  eq(all.length, 2, "both records exist");
  eq(all[0].engineResult.doseRecommendation.recommendedDoseMlPerDay, 9.3, "the first still says 9.3");
  eq(all[1].engineResult.doseRecommendation.recommendedDoseMlPerDay, 9.5, "the second says 9.5");
});

s.test("ASS-04", "an id that already exists is never overwritten — it refuses", async () => {
  const store = createMemoryStore();
  const rec = {
    assessmentId: "ASSESS-2026-08-20T07:40:00Z",
    engineResult: result(9.3),
    fingerprint: "planted",
  };
  await store.backend.put(ASSESSMENTS, rec.assessmentId, rec);

  await throws(
    () =>
      store.assessments.record({
        engineResult: result(9.9),
        asOf: "2026-08-20T07:40:00Z",
        localDate: "2026-08-20",
        inputEventIds: [],
        describe: VERSIONS,
      }),
    "not rewritable",
    "writing over an existing assessment id"
  );

  const kept = await store.backend.get(ASSESSMENTS, rec.assessmentId);
  eq(kept.fingerprint, "planted", "the existing record is untouched");
});

s.test("ASS-05", "the same answer at the same instant is not written twice", async () => {
  const store = createMemoryStore();
  const spec = {
    engineResult: result(9.3),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: ["e1"],
    describe: VERSIONS,
  };
  const a = await store.assessments.record(spec);
  const b = await store.assessments.record(spec);
  ok(a.stored, "the first is stored");
  eq(b.stored, false, "the second is recognised as the same answer");
  eq((await store.assessments.all()).length, 1, "one record, not two");
});

s.test("ASS-06", "a stored record cannot be mutated in memory either", async () => {
  const store = createMemoryStore();
  const { record } = await store.assessments.record({
    engineResult: result(9.3),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: ["e1"],
    describe: VERSIONS,
  });
  ok(Object.isFrozen(record), "the returned record is frozen");
  try {
    record.canonVersion = "SOMETHING_ELSE";
  } catch {
    /* strict mode throws, sloppy mode ignores; either is fine */
  }
  eq(record.canonVersion, VERSIONS.canonVersion, "the canon stamp is unchanged");
});

s.test("ASS-07", "configuration is a history: a change appends and the old version stays", async () => {
  const store = createMemoryStore();
  const v1 = await store.config.append({ targetRangeMinDkh: 8.2, targetRangeMaxDkh: 8.8 }, "2026-07-01T00:00:00Z");
  const v2 = await store.config.append({ targetRangeMinDkh: 8.6, targetRangeMaxDkh: 9.2 }, "2026-08-01T00:00:00Z");

  eq(v1.configVersionId, "CFG-V1", "the first version's id");
  eq(v2.configVersionId, "CFG-V2", "the second version's id");

  const history = await store.config.history();
  eq(history.length, 2, "both versions are kept");
  eq(history[0].targetRangeMinDkh, 8.2, "the old range is still readable");

  /* An assessment stored against CFG-V1 can still name what it used. */
  const forEngine = await store.config.forEngine();
  eq(forEngine.length, 2, "the engine is handed the whole history");
  eq("schemaVersion" in forEngine[0], false, "with the app's own bookkeeping stripped");
});

export default s;
