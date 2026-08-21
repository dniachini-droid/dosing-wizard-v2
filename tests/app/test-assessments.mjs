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
import { createMemoryStore, createStore } from "../../app/src/store/index.js";
import { runAssessment } from "../../app/src/assess.js";
import { ASSESSMENTS } from "../../app/src/store/db.js";
import { STRINGS } from "../../app/src/strings.js";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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

s.test("ASS-04", "an existing record is never overwritten — the new one takes its own id", async () => {
  /* The GUARANTEE is that a stored assessment is never rewritten. This test
     used to assert the MECHANISM — that a colliding id raises — and the
     mechanism has changed: `record()` now claims the next free id rather than
     assuming one, because assuming one lost an assessment whenever two writes
     began in the same second (`ASS-13`).

     So the new record must survive AND the old one must be untouched. The
     earlier version was satisfied by the new assessment being thrown away,
     which protected the old record by destroying the new one — a worse answer
     that read as a passing test. */
  const store = createMemoryStore();
  /* The planted record carries NO `asOf` field — a record from an older
     schema, or one written by something that did not fill it in. That is the
     case the id check exists for: the ordinal is counted from a FIELD, and the
     id is the KEY, so a record the count cannot see still occupies the key.
     Planting one that the count CAN see would let the count alone avoid the
     collision, and the test would pass without the check doing anything. */
  const planted = {
    assessmentId: "ASSESS-2026-08-20T07:40:00Z",
    engineResult: result(9.3),
    fingerprint: "planted",
  };
  await store.backend.put(ASSESSMENTS, planted.assessmentId, planted);

  const written = await store.assessments.record({
    engineResult: result(9.9),
    asOf: "2026-08-20T07:40:00Z",
    localDate: "2026-08-20",
    inputEventIds: [],
    describe: VERSIONS,
  });

  const kept = await store.backend.get(ASSESSMENTS, planted.assessmentId);
  eq(kept.fingerprint, "planted", "the existing record is untouched");
  ok(
    written.record.assessmentId !== planted.assessmentId,
    `the new one took its own id, not the planted one (${written.record.assessmentId})`
  );
  eq(written.stored, true, "and it really was stored, rather than quietly dropped");

  /* The backstop is still there: an id that cannot be made unique refuses
     rather than overwriting. */
  ok(
    /assessmentIdExhausted|assessmentExists/.test(
      Object.keys(STRINGS).filter((k) => k.startsWith("err.assessment")).join(" ")
    ),
    "the refusal is still spelled out, as the last resort it now is"
  );
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

/* -------------------------------------------------------------------------
   A FAILED READ IS NOT AN EMPTY TANK.
   ---------------------------------------------------------------------- */

s.test("ASS-08", "a storage failure stops the assessment — it never becomes an empty history", async () => {
  /* THE DEFECT. `idbBackend.all()` and `keys()` returned `[]` when the read
     failed, so a degraded IndexedDB looked exactly like a keeper who had never
     logged anything. `runAssessment` then asked the engine what it made of a
     tank with no history and STORED the answer: a stamped, permanent, false
     record. Both halves are tested here — that it stops, and that it stores
     nothing on the way. */
  let reads = 0;
  const failing = {
    async get() { reads += 1; throw new Error("the store did not answer"); },
    async put() { throw new Error("nothing may be written during a failed read"); },
    async del() { throw new Error("nothing may be deleted during a failed read"); },
    async keys() { reads += 1; throw new Error("the store did not answer"); },
    async all() { reads += 1; throw new Error("the store did not answer"); },
    async health() { return { ok: false, reason: "the store did not answer" }; },
  };
  const store = createStore(failing);

  const res = await runAssessment(store, "2026-08-20T09:00:00Z");
  eq(res.state, "STORAGE_UNAVAILABLE", "it says the storage failed");
  eq(res.record, null, "and stored nothing");
  eq(res.engineResult, null, "and asked the engine nothing");
  ok(reads > 0, "it did try to read");
  ok(
    res.state !== "ASSESSED" && res.state !== "NO_CONFIGURATION",
    "and it is not reported as an ordinary empty install"
  );
});

/* -------------------------------------------------------------------------
   Canon §64's THIRD condition.
   ---------------------------------------------------------------------- */

s.test("ASS-09", "a replay is offered the configuration the assessment named, not today's", async () => {
  /* §64 conditions deterministic replay on the same event ledger, the same
     CONFIGURATION VERSIONS and the same engine/canon version. `replay()`
     compared two of the three and re-read the CURRENT configuration, so
     changing a target range and replaying an old assessment reported "same
     engine, same canon, different answer" — blaming the engine for a settings
     change the keeper had made themselves.

     The engine cannot run in this suite, so what is pinned here is the reader
     the fix turns on. */
  const store = createMemoryStore();
  await store.config.append({ netVolumeL: 77, targetRangeMinDkh: 8.2, targetRangeMaxDkh: 8.8 }, "2026-01-01T00:00:00Z");
  await store.config.append({ netVolumeL: 77, targetRangeMinDkh: 7.8, targetRangeMaxDkh: 8.4 }, "2026-08-01T00:00:00Z");

  const now = await store.config.forEngine();
  eq(now.length, 2, "today the engine sees both versions");

  const then = await store.config.forEngineUpTo("CFG-V1");
  eq(then.length, 1, "a replay of a CFG-V1 assessment sees only what existed then");
  eq(then[0].targetRangeMinDkh, 8.2, "with the range that was actually in force");
  eq("schemaVersion" in then[0], false, "and the app's own bookkeeping still stripped");

  deepEq(
    (await store.config.forEngineUpTo("CFG-V2")).map((c) => c.configVersionId),
    ["CFG-V1", "CFG-V2"],
    "a later assessment sees the history up to its own version"
  );
  eq(
    await store.config.forEngineUpTo("CFG-V9"),
    null,
    "and a version this device does not hold is refused, not silently replaced by today's"
  );
});

s.test("ASS-10", "the same answer at a new instant is one assessment, not two", async () => {
  /* THE DEFECT. Dedup compared `fingerprint && asOf`, and both always
     differed: `asOf` is fresh on every run AND appears inside the engine
     result as `assessmentAsOf` and `retest.recommendedAt`. So every open of
     the app stored another assessment, and the keeper's history became a count
     of how many times they had looked at it. */
  const store = createMemoryStore();
  const answer = (asOf) => ({
    assessmentAsOf: asOf,
    doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "HELD", recommendedDoseMlPerDay: 12 },
    retest: { recommendedAt: "2026-08-22T09:00:00Z", selectedReasonCode: "RETEST_ROUTINE_CADENCE" },
  });

  const a = await store.assessments.record({
    engineResult: answer("2026-08-20T09:00:00Z"), asOf: "2026-08-20T09:00:00Z",
    localDate: "2026-08-20", inputEventIds: ["e1"], configVersionId: "CFG-V1", describe: {},
  });
  eq(a.stored, true, "the first one is stored");

  /* Open the app again a minute later. Same answer, new clock. */
  const b = await store.assessments.record({
    engineResult: answer("2026-08-20T09:01:00Z"), asOf: "2026-08-20T09:01:00Z",
    localDate: "2026-08-20", inputEventIds: ["e1"], configVersionId: "CFG-V1", describe: {},
  });
  eq(b.stored, false, "the same answer a minute later is not a second assessment");
  eq(b.record.assessmentId, a.record.assessmentId, "it is the same record");
  eq((await store.assessments.all()).length, 1, "one record, not two");

  /* A DIFFERENT answer still stores, or the fix would have silenced the log. */
  const changed = answer("2026-08-20T09:02:00Z");
  changed.doseRecommendation.recommendedDoseMlPerDay = 12.4;
  const c = await store.assessments.record({
    engineResult: changed, asOf: "2026-08-20T09:02:00Z",
    localDate: "2026-08-20", inputEventIds: ["e1", "e2"], configVersionId: "CFG-V1", describe: {},
  });
  eq(c.stored, true, "a different answer IS a new assessment");
  eq((await store.assessments.all()).length, 2, "and both are kept");

  /* The stored record still holds the engine's output verbatim. The
     normalisation is for comparing, and must never reach the record. */
  eq(a.record.engineResult.assessmentAsOf, "2026-08-20T09:00:00Z", "the result is stored as it arrived");
});

s.test("ASS-11", "the tenth record at one instant still sorts after the second", async () => {
  /* `latest()` reads the last of `all()`. The ids carry a counter, and the
     sort was over the id STRING, so `…#10` sorted before `…#2` and the tenth
     assessment at one instant stopped being the latest one. */
  const store = createMemoryStore();
  const asOf = "2026-08-20T09:00:00Z";
  for (let i = 0; i < 12; i += 1) {
    await store.assessments.record({
      /* A different answer each time, so dedup does not collapse them. */
      engineResult: { doseRecommendation: { recommendedDoseMlPerDay: 10 + i } },
      asOf, localDate: "2026-08-20", inputEventIds: [`e${i}`], configVersionId: "CFG-V1", describe: {},
    });
  }
  const list = await store.assessments.all();
  eq(list.length, 12, "all twelve are kept");
  deepEq(
    list.map((r) => r.asOfOrdinal),
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    "and they are in the order they were made"
  );
  const latest = await store.assessments.latest();
  eq(latest.asOfOrdinal, 11, "the latest really is the last one made");
  eq(latest.engineResult.doseRecommendation.recommendedDoseMlPerDay, 21, "with its answer");
});

s.test("ASS-12", "the IndexedDB backend raises on a failed read rather than returning empty", () => {
  /* WHAT THIS IS AND WHAT IT IS NOT.

     `ASS-08` proves the RULE: a backend that raises stops the assessment and
     stores nothing. It uses a hand-written failing backend, because there is
     no IndexedDB in Node — so it says nothing about whether the backend that
     actually runs on the phone raises at all. That backend had no test of any
     kind, and the defect lived precisely there: `get`, `keys` and `all`
     folded a failed read into `undefined` or `[]`.

     This is a source-shape check, and a source-shape check is weak: it proves
     the throw is written, not that it fires. It is here because the
     alternative is nothing, and because the same reasoning already guards
     `sw.js` in `SHELL-01` and the strings file in `check-strings.py`. A real
     test of this needs a browser, and that is recorded as an open item rather
     than pretended away. */
  const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
  const src = fs.readFileSync(path.join(ROOT, "app/src/store/db.js"), "utf8");

  const backend = src.slice(src.indexOf("export const idbBackend"), src.indexOf("export function memoryBackend"));
  ok(backend.length > 200, "the IndexedDB backend was found in the source");

  /* Every read method, by name, so a method added later is not silently
     exempt from the rule. */
  for (const method of ["get", "keys", "all"]) {
    const start = backend.indexOf(`async ${method}(store`);
    ok(start > 0, `${method} exists`);
    const body = backend.slice(start, backend.indexOf("\n  },", start));
    ok(
      /if \(!r\.ok\) throw/.test(body),
      `${method} raises when the read failed, rather than reporting it as absent: ${body.trim()}`
    );
    ok(
      !/r\.ok \? .* : (\[\]|undefined)/.test(body),
      `${method} does not fold a failure into an empty result`
    );
  }
});

s.test("ASS-13", "two assessments started at once both survive — neither overwrites the other", async () => {
  /* FOUND BY THE BROWSER SMOKE TEST, not by reasoning about the code.

     `record()` reads the stored list, picks the next free id, checks that id is
     free, and writes. Every step awaits, and an await is a yield — so two
     writes beginning inside the same second both cleared the "is this id
     free?" check before either wrote, chose the same id, and one silently
     replaced the other. The refusal that exists to make an assessment
     unrewritable was walked straight through by the ordinary case it was
     written for.

     A retry loop only narrows the window. The writes queue. */
  const store = createMemoryStore();
  const asOf = "2026-08-20T09:00:00Z";
  const one = (n) => ({
    engineResult: { doseRecommendation: { recommendedDoseMlPerDay: n } },
    asOf, localDate: "2026-08-20", inputEventIds: [`e${n}`], configVersionId: "CFG-V1", describe: {},
  });

  /* Started together, neither awaiting the other. */
  const results = await Promise.all([1, 2, 3, 4, 5].map((n) => store.assessments.record(one(n))));

  const ids = results.map((r) => r.record.assessmentId);
  eq(new Set(ids).size, 5, `five distinct ids, not five collisions: ${ids.join(", ")}`);
  eq((await store.assessments.all()).length, 5, "and all five are stored");
  deepEq(
    (await store.assessments.all()).map((r) => r.asOfOrdinal),
    [0, 1, 2, 3, 4],
    "with consecutive ordinals"
  );

  /* Dedup still works under the same conditions: the identical answer, five
     times at once, is one assessment. */
  const store2 = createMemoryStore();
  const same = await Promise.all([1, 2, 3, 4, 5].map(() => store2.assessments.record(one(9))));
  eq(same.filter((r) => r.stored).length, 1, "the same answer five times at once is stored once");
  eq((await store2.assessments.all()).length, 1, "one record");
});

export default s;
