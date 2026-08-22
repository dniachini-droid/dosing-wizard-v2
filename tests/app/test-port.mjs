/* ============================================================================
   THE V1 INTERFACE PORT — THE RULES THAT MUST HOLD AFTERWARDS
   ----------------------------------------------------------------------------
   The brief that commissioned this port says why these exist:

     "Every other rule in this project carries a mechanical test that fails when
      the rule is broken; that instruction carried nothing, so the build wrote
      its own version of everything."

   Four rules, and each one has a negative control in `mutations.mjs`:

     PORT-01..04  no UI component computes chemistry
     PORT-05..07  every screen reads and writes through V2's storage
     PORT-08..09  stored assessments still carry version stamps
     PORT-10..12  a date-only reading never gains a time

   Every one of them is checkable without a browser, because the thing being
   checked is a property of the source and of the store, not of a rendered
   pixel.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok, throws } from "./harness.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));
const SRC = path.join(ROOT, "app/src");

const s = suite("port");

/* --- which files are "the interface" ------------------------------------
   Everything under `components/`, the shell, and the two V1 libraries that
   render. Deliberately NOT `present/`, which is where reading the engine's
   answer is supposed to happen, and NOT `store/`, which is the record. */
function uiFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const p = path.join(dir, name);
      const st = fs.statSync(p);
      if (st.isDirectory()) {
        if (["present", "store", "engine", "styles"].includes(name)) continue;
        walk(p);
        continue;
      }
      if (/\.(jsx?|mjs)$/.test(name) && name !== "strings.js") out.push(p);
    }
  };
  walk(SRC);
  return out;
}

const read = (p) => fs.readFileSync(p, "utf8");
const rel = (p) => path.relative(ROOT, p);

/* ==========================================================================
   1. NO UI COMPONENT COMPUTES CHEMISTRY
   ======================================================================== */

/* The V1 functions this port deleted. Every one of them decided what a reading
   MEANS inside a presentation component, which is what canon `X-INV-004` and
   `DEC-003` forbid. Named individually rather than matched by pattern, so a
   reintroduction has to be a deliberate act rather than a near miss. */
const V1_CHEMISTRY = Object.freeze([
  "paramStatus", "readingVerdict", "computeControl", "computeStability",
  "computeRates", "rateNarrative", "assessAlkalinity", "assessCalcium",
  "assessMagnesium", "doseStatus", "proposeCorrection", "buildFindings",
  "predictAfterChange", "computeElementConsumption", "icpRef", "ICP_GROUPS",
  "SAFE_BOUNDS", "SAFE_DAILY_RISE", "STABILITY_RULES", "STABILITY_COLOR",
  "CONSUMPTION_RULES", "buildOverview", "buildBriefing", "explainScore",
  "deriveTankState", "alkStamp", "findingsFor", "isCorrectionState",
]);

s.test("PORT-01", "no interface file names a V1 chemistry function", () => {
  const hits = [];
  for (const f of uiFiles()) {
    const text = read(f);
    for (const name of V1_CHEMISTRY) {
      /* A word boundary, so `paramStatus` matches and `paramStatuses` in prose
         does not. Comments are searched deliberately: a comment saying what
         was removed is fine, and it says the name inside backticks, so the
         pattern requires a call or an import rather than a mention. */
      const called = new RegExp(`(^|[^\\w.\`'"])${name}\\s*\\(`, "m");
      /* One line. This project's import lines carry no semicolons, so a
         `[^;]*` span reaches the whole file and matches the name in a comment
         four hundred lines down — which is exactly what it did the first time
         this test was run. */
      const imported = new RegExp(`^import[^\\n]*\\b${name}\\b[^\\n]*from`, "m");
      if (called.test(text) || imported.test(text)) hits.push(`${rel(f)}: ${name}`);
    }
  }
  eq(hits.join(" | "), "", "V1 chemistry named in an interface file");
});

/* The position vocabulary has ONE owner. Not "should have" — this is the test
   that makes it so. `app/src/present/position.js` maps the engine's position
   onto a colour and a word; anywhere else, the values simply do not appear. */
const POSITIONS = Object.freeze(["IN_RANGE", "BELOW_RANGE", "ABOVE_RANGE", "ALERT_LOW", "ALERT_HIGH"]);

/* Comments describing what was deleted are not the thing itself, and this file
   is full of them by design. Stripped before matching — including line
   comments, which the first version did not strip and which therefore made a
   comment quoting a contract value a build failure. */
function code(text) {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

s.test("PORT-02", "the engine's position vocabulary appears in no interface file", () => {
  /* A BARE TOKEN, not only a quoted one.

     The first version required `["'\`]VALUE["'\`]`, so
     `const TONES = { BELOW_RANGE: "#926A09" }` — the vocabulary as an unquoted
     object key — walked straight through, and so did
     `['BELOW','RANGE'].join('_')`. These are SCREAMING_SNAKE tokens that occur
     in no English sentence, so matching the bare word costs nothing and closes
     both. */
  const hits = [];
  for (const f of uiFiles()) {
    const text = code(read(f));
    for (const v of POSITIONS) {
      if (new RegExp(`\\b${v}\\b`).test(text)) hits.push(`${rel(f)}: ${v}`);
    }
  }
  eq(hits.join(" | "), "", "a position value outside app/src/present/");
});

/* The rest of the contract's decision vocabularies, by the same rule. A screen
   that tests one of these is a screen deciding what the engine's answer means. */
const CONTRACT_VALUES = Object.freeze([
  "SET_MAINTENANCE_DOSE", "HOLD_CURRENT_DOSE", "INSUFFICIENT_DATA",
  "WITHHELD_CAPABILITY", "WITHHELD_LIQUID_GUARD",
  "BREACHED_LOW", "BREACHED_HIGH", "WITHIN",
  "NOT_ATTRIBUTABLE_SMALL_SIGNAL", "UNCERTAINTY_LIMITED", "CONFOUNDED",
]);

s.test("PORT-03", "no interface file tests a contract decision value", () => {
  const hits = [];
  for (const f of uiFiles()) {
    const text = code(read(f));
    for (const v of CONTRACT_VALUES) {
      if (new RegExp(`\\b${v}\\b`).test(text)) hits.push(`${rel(f)}: ${v}`);
    }
  }
  eq(hits.join(" | "), "", "a contract decision value outside app/src/present/");
});

/* The last shape a classifier can take: comparing a reading to a bound. V1's
   `paramStatus` was exactly `value < def.min`, and it was four lines. */
/* What a bound is called, on any object. `def.min`, `range.max`, `r.lo`,
   `bounds.hi` — the classifier this port deleted was four lines and would come
   back under any of them. */
const BOUND = String.raw`\w+\.(min|max|lo|hi|Min|Max)\b`;

s.test("PORT-04", "no interface file compares a reading to a band edge", () => {
  /* THE SHAPE, NOT THE SPELLING.

     The first version matched `value`, `def.` and `d.` by name, so
     `const band = (v, r) => v < r.lo ? "low" : v > r.hi ? "high" : "ok"` —
     `paramStatus` with the names changed — walked through. What actually
     identifies the defect is a relational comparison with a BOUND on exactly
     one side: bound against bound is geometry (`recent.hi > recent.lo` scales
     a range bar and decides nothing), and bound against anything else is a
     classification. */
  const oneSided = new RegExp(
    `(?<!${BOUND}\\s*)\\b[\\w.]+\\s*[<>]=?\\s*${BOUND}` + `|` +
    `${BOUND}\\s*[<>]=?\\s*(?!\\s*${BOUND})[\\w.]+`
  );
  const bothBounds = new RegExp(`${BOUND}\\s*[<>]=?\\s*${BOUND}`);

  const hits = [];
  for (const f of uiFiles()) {
    code(read(f)).split("\n").forEach((line, i) => {
      if (!oneSided.test(line)) return;
      if (bothBounds.test(line)) return;   /* geometry: a range against itself */
      hits.push(`${rel(f)}:${i + 1}: ${line.trim().slice(0, 90)}`);
    });
  }
  eq(hits.join(" | "), "", "a reading compared to a band edge in an interface file");
});

/* ==========================================================================
   2. EVERY SCREEN READS AND WRITES V2's STORAGE
   ======================================================================== */

/* Every JavaScript file under `app/src`, whatever layer it is in. The storage
   rule is not an interface rule: `present/` reaching into `localStorage` is
   the same second record of the same tank, and the first version of this test
   could not see it because it reused the interface scope. */
function allSourceFiles() {
  const out = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const q = path.join(dir, name);
      if (fs.statSync(q).isDirectory()) { walk(q); continue; }
      if (/\.(jsx?|mjs)$/.test(name)) out.push(q);
    }
  };
  walk(SRC);
  return out;
}

s.test("PORT-05", "nothing outside the store touches browser storage directly", () => {
  const hits = [];
  for (const f of allSourceFiles()) {
    /* The store is the store. `db.js` is where IndexedDB is opened, and
       `mode.js` and `index.js` are its own. */
    if (/^app\/src\/store\//.test(rel(f))) continue;
    const text = code(read(f));
    for (const api of ["localStorage", "sessionStorage", "indexedDB", "openDatabase"]) {
      if (new RegExp(`\\b${api}\\b`).test(text)) hits.push(`${rel(f)}: ${api}`);
    }
  }
  eq(hits.join(" | "), "", "browser storage reached directly from outside the store");
});

/* Every write into the record goes through `app/src/lib/record.js`, so there
   is one place to read to check that a date-only record never acquires a time
   and one place a test has to cover. A component appending its own event would
   be a second author of the envelope. */
s.test("PORT-06", "no component appends to the ledger itself", () => {
  /* THE IDENTIFIERS, NOT THE CALL SPELLING.

     The first version matched five literal strings including `ledger.append`,
     so `const { append } = store.ledger; await append(ev)` was invisible. The
     writers are named functions with names nothing else in the interface uses,
     so the names are what is forbidden. `store.config.append` is the
     configuration history, which is not the ledger and is the shell's to
     write; it is excluded by requiring the ledger's own identifier. */
  const FORBIDDEN = ["makeEvent", "makeAnnotation", "backend"];
  const hits = [];
  for (const f of uiFiles()) {
    if (rel(f) === "app/src/lib/record.js") continue;
    const text = code(read(f));
    for (const name of FORBIDDEN) {
      if (new RegExp(`\\b${name}\\b`).test(text)) hits.push(`${rel(f)}: ${name}`);
    }
    /* `ledger` reached for anything but a read. The readers the shell
       legitimately calls are named; anything else through `.ledger` — a
       destructured `append`, an aliased handle — is a write route.

       Import lines are dropped first: `from "../store/ledger.js"` is how a
       module names the file, not how it writes to it. */
    const body = text.split("\n").filter((l) => !/^\s*import\b/.test(l)).join("\n");
    const READS = ["projection", "allEvents", "allAnnotations", "backend"];
    for (const m of body.matchAll(/\bledger\s*\.\s*(\w+)/g)) {
      if (!READS.includes(m[1])) hits.push(`${rel(f)}: ledger.${m[1]}`);
    }
    /* And destructuring it, which is the shape that has no dot at all. */
    for (const m of body.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*[^;\n]*\bledger\b/g)) {
      hits.push(`${rel(f)}: destructured ledger {${m[1].trim()}}`);
    }
  }
  eq(hits.join(" | "), "", "an interface file writing its own ledger event");
});

/* The shell reads the record through V2's store and through nothing else. */
s.test("PORT-07", "the shell builds every screen's data from V2's store", async () => {
  const App = read(path.join(SRC, "App.jsx"));
  for (const marker of [
    'from \'./store/index.js\'',
    'store.ledger.projection()',
    'store.config.current()',
    'store.tasks.tasks()',
    'store.tasks.completions()',
    'runAssessment(store,',
  ]) {
    ok(App.includes(marker), `the shell no longer does: ${marker}`);
  }
});

/* ==========================================================================
   3. STORED ASSESSMENTS STILL CARRY VERSION STAMPS
   ======================================================================== */

/* An engine stub. It returns exactly what it is told to and reads nothing, so
   the test is about the STAMPING and not about chemistry. */
function stubEngine({ engineVersion, canonVersion, result = {} }) {
  return {
    async describe() { return { engineVersion, canonVersion }; },
    async assess({ asOf }) {
      return {
        assessmentId: `ASSESS-${asOf}`,
        assessmentAsOf: asOf,
        parameter: "ALK",
        engineVersion,
        canonVersion,
        configVersionId: "CFG-V1",
        position: "NOT_RUN",
        reasonCodes: [],
        ...result,
      };
    },
  };
}

async function withEngine(engine, fn) {
  const assess = await import("../../app/src/assess.js");
  const was = { ...assess.ENGINE };
  Object.assign(assess.ENGINE, engine);
  try { return await fn(assess); } finally { Object.assign(assess.ENGINE, was); }
}

s.test("PORT-08", "a stored assessment carries the versions the ENGINE reported, not a copy of them", async () => {
  /* THIS TEST REPLACES ONE THAT COULD NOT FAIL FOR THE RIGHT REASON.

     The first version built an `engineResult` by hand, passed
     `describe: {engineVersion:"E1"}` straight into `store.assessments.record`,
     and asserted `"E1"` came back. It was a pass-through: it would have stayed
     green if `assess.js` had never called the engine at all, and a review
     showed a single hardcoded line in `assess.js` fabricating both stamps with
     the whole suite green.

     So this drives the real `runAssessment` against a stubbed transport that
     reports a SENTINEL, and then changes the sentinel. Canon §64 conditions
     replay on the same engine and canon version; if this can be faked, that
     condition is unenforceable and `replay`'s comparison silently always says
     "same". */
  const { createMemoryStore } = await import("../../app/src/store/index.js");

  for (const n of [7, 8]) {
    const store = createMemoryStore(`port-versions-${n}`);
    await store.config.append({ netVolumeL: 77 }, "2026-01-01T00:00:00+00:00");
    const engine = stubEngine({ engineVersion: `ENGINE-SENTINEL-${n}`, canonVersion: `CANON-SENTINEL-${n}` });

    const out = await withEngine(engine, (assess) =>
      assess.runAssessment(store, "2026-03-04T09:00:00+00:00"));

    eq(out.state, "ASSESSED", `run ${n}: the assessment completed`);
    eq(out.record.engineVersion, `ENGINE-SENTINEL-${n}`, `run ${n}: the ENGINE's version reached the stored record`);
    eq(out.record.canonVersion, `CANON-SENTINEL-${n}`, `run ${n}: and its canon version`);
    eq(out.record.asOf, "2026-03-04T09:00:00+00:00", `run ${n}: the assessment instant, verbatim`);
    eq(out.record.configVersionId, "CFG-V1", `run ${n}: and the configuration version it resolved`);
  }
});

s.test("PORT-09", "an engine that cannot start is reported as an engine failure, not an unreadable record", async () => {
  /* Found by review, and it is the worst sentence this app can produce.
     `describe()` used to sit inside the same `Promise.all` as the two storage
     reads, inside the try whose catch returns `STORAGE_UNAVAILABLE` — so a
     worker that could not boot came back telling the keeper his history was
     unreadable while it sat there intact. */
  const { createMemoryStore } = await import("../../app/src/store/index.js");
  const store = createMemoryStore("port-engine-down");
  await store.config.append({ netVolumeL: 77 }, "2026-01-01T00:00:00+00:00");

  const dead = {
    async describe() { throw new Error("the runtime is not vendored"); },
    async assess() { throw new Error("the runtime is not vendored"); },
  };
  const out = await withEngine(dead, (assess) =>
    assess.runAssessment(store, "2026-03-04T09:00:00+00:00").catch((e) => ({ state: "THREW", error: e.message })));

  eq(out.state, "ENGINE_UNAVAILABLE",
    "an engine that cannot start must report itself, not throw and not borrow the storage failure's label");
  eq(out.record, null, "and nothing is stored");

  /* And a storage failure still reports itself, so the two are not one state
     with two causes. */
  const broken = {
    ledger: { projection: async () => { throw new Error("indexeddb is gone"); } },
    config: { forEngine: async () => [] },
    assessments: {},
    tasks: {},
  };
  const storageOut = await withEngine(stubEngine({ engineVersion: "E1", canonVersion: "C1" }), (assess) =>
    assess.runAssessment(broken, "2026-03-04T09:00:00+00:00"));
  eq(storageOut.state, "STORAGE_UNAVAILABLE", "a record that cannot be read still says so");
});

s.test("PORT-15", "a replay names WHICH of canon 64's three conditions differs", async () => {
  /* `replay()` implements canon §64 and had no test that called it — not one.
     Its whole value is that a divergence names its own cause: an engine
     upgrade, a canon reissue and a settings change are three different
     explanations and the keeper is owed the right one. */
  const { createMemoryStore } = await import("../../app/src/store/index.js");
  const store = createMemoryStore("port-replay");
  await store.config.append({ netVolumeL: 77 }, "2026-01-01T00:00:00+00:00");

  const asOf = "2026-03-04T09:00:00+00:00";
  const first = stubEngine({ engineVersion: "E1", canonVersion: "C1" });
  const run = await withEngine(first, (a) => a.runAssessment(store, asOf));
  eq(run.state, "ASSESSED", "the assessment stored");

  /* Same everything: it agrees, and says so on all three conditions. */
  const same = await withEngine(first, (a) => a.replay(store, run.record.assessmentId));
  eq(same.state, "REPLAYED", "it replayed");
  eq(same.sameEngineVersion, true, "same engine");
  eq(same.sameCanonVersion, true, "same canon");
  eq(same.identical, true, "and the answer is the same answer");

  /* The engine moved. That is an upgrade, not a disagreement. */
  const newer = stubEngine({ engineVersion: "E2", canonVersion: "C1" });
  const upgraded = await withEngine(newer, (a) => a.replay(store, run.record.assessmentId));
  eq(upgraded.sameEngineVersion, false, "an engine upgrade is named as one");
  eq(upgraded.sameCanonVersion, true, "and is not blamed on the canon");

  /* The canon moved. */
  const reissued = stubEngine({ engineVersion: "E1", canonVersion: "C2" });
  const recanon = await withEngine(reissued, (a) => a.replay(store, run.record.assessmentId));
  eq(recanon.sameEngineVersion, true, "a canon reissue is not blamed on the engine");
  eq(recanon.sameCanonVersion, false, "and is named as one");

  /* A configuration version this device does not hold is its own answer, and
     is not "the engine now disagrees". */
  const orphan = await withEngine(first, async (a) => {
    const rec = await store.assessments.byId(run.record.assessmentId);
    await store.assessments.record({
      engineResult: { ...rec.engineResult, configVersionId: "CFG-V99" },
      auditTrace: null, asOf: "2026-03-05T09:00:00+00:00", localDate: "2026-03-05",
      inputEventIds: [], configVersionId: "CFG-V99",
      describe: { engineVersion: "E1", canonVersion: "C1" },
    });
    const all = await store.assessments.all();
    const missing = all.find((r) => r.configVersionId === "CFG-V99");
    return a.replay(store, missing.assessmentId);
  });
  eq(orphan.state, "CONFIGURATION_UNAVAILABLE",
    "a configuration this device does not hold is its own answer");
});

/* WHICH FORM COLLECTS A TIME, AND WHICH DOES NOT.

   Declared here rather than inferred, because the whole point is that a
   recorder's provenance must follow the form that feeds it. A recorder added
   without an entry here fails the test rather than being skipped — which is
   the arm that would have caught the defect this test was rewritten for. */
const RECORDERS = Object.freeze([
  { fn: "recordReading",        timed: true,  args: { param: "ALK", value: 8.6 } },
  { fn: "recordDoseChange",     timed: true,  args: { fromMlPerDay: 12, toMlPerDay: 12.5 } },
  { fn: "recordWaterChange",    timed: true,  args: { litres: 10, netVolumeL: 77 } },
  { fn: "recordOneOff",         timed: true,  args: { amountMl: 5 } },
  { fn: "recordLightingChange", timed: false, args: { note: "blues up 10%" } },
  { fn: "recordNote",           timed: false, args: { note: "four new frags in" } },
  { fn: "recordIcpPanel",       timed: false, args: { note: null, elements: { Iodine: 0.06 } } },
  /* `recordDoseState` has no date box and no time box: it records what the
     pump is running AT THE MOMENT THE KEEPER SAYS SO, so the instant is the
     present one and is genuinely known. `now: true` marks that third shape —
     neither "the form asked for a time" nor "the form asked for neither" — and
     the loop below still holds it to producing a real, exact instant. */
  { fn: "recordDoseState",      timed: true, now: true, args: { doseMlPerDay: 8.8 } },
  /* `correctReading` is the fourth shape: its form offers a time box only
     where the ORIGINAL had one, because correcting a value is not new
     information about when. It supersedes, so the loop gives it something to
     supersede. Covered in both directions by `COR-01` and `COR-02`; here it is
     held to the same rule as every other recorder. */
  { fn: "correctReading",       timed: true, supersedes: true, args: { param: "ALK", value: 8.9 } },
]);

s.test("PORT-10", "a form with no time box writes a record with no time, and cannot write one with a time", async () => {
  /* THIS TEST REPLACES ONE THAT MISSED THE DEFECT IT WAS NAMED FOR, AND THE
     REPLACEMENT IS THE POINT.

     The first version asserted two spellings over the SOURCE of
     `record.js`: that it never called `dateOnly`, and that it contained no
     `|| "12:00"`. Both passed while three recorders wrote
     `stamp(date, "12:00")` — a literal noon, `EXACT_ABSOLUTE`, on a form with
     no time box in it. Worse, the first assertion FORBADE the fix: writing
     `dateOnly(date)` turned the test red.

     A test that is green while the fabrication exists and red when it is
     removed is worse than no test. So this one runs the recorders and reads
     what they wrote. There is no spelling in it: `?? "12:00"`, a ternary, a
     helper three files away — all of them produce an `absoluteInstant` on a
     record that should have none, and all of them fail here. */
  const { createMemoryStore } = await import("../../app/src/store/index.js");
  const record = await import("../../app/src/lib/record.js");
  const { PROVENANCE } = await import("../../app/src/store/time.js");

  const store = createMemoryStore("port-test-provenance");
  const date = "2026-03-04";

  /* Every exported recorder is covered, found by reflection rather than by a
     list somebody has to remember to extend. */
  const exported = Object.keys(record).filter((k) => k.startsWith("record"));
  const declared = RECORDERS.map((r) => r.fn);
  for (const name of exported) {
    ok(declared.includes(name), `${name} is exported and this test does not say whether its form collects a time`);
  }

  for (const r of RECORDERS) {
    let args = r.now ? { ...r.args } : r.timed ? { ...r.args, date, time: "09:15" } : { ...r.args, date };
    if (r.supersedes) {
      const original = await record.recordReading(store, { param: "ALK", value: 8.6, date, time: "09:15" });
      args = { ...args, eventId: original.eventId };
    }
    const ev = await record[r.fn](store, args);

    if (r.timed) {
      eq(ev.time.timeProvenance, PROVENANCE.EXACT_ABSOLUTE, `${r.fn}: its form collects a time`);
      ok(ev.time.absoluteInstant, `${r.fn}: and the instant is on the record`);
      continue;
    }

    /* The three that matter. Not midnight, not midday — absent. */
    eq(ev.time.timeProvenance, PROVENANCE.DATE_ONLY,
      `${r.fn}: its form has no time box, so the record must not claim a time`);
    eq(ev.time.absoluteInstant, undefined, `${r.fn}: a date-only record carries no instant at all`);
    eq(ev.time.localTime, undefined, `${r.fn}: nor a wall-clock time`);
    eq(ev.time.localDate, date, `${r.fn}: the day it does know is kept`);
  }
});

s.test("PORT-11", "a record with no time is carried through to the screen with no time", async () => {
  /* Behavioural, for the same reason. The first version pinned the exact
     source line `time: e.time.localTime || null`, which a second reader
     elsewhere in the file — or a `??` — walks straight past. */
  const { readingsFrom } = await import("../../app/src/lib/adapt.js");
  const { KIND } = await import("../../app/src/store/ledger.js");
  const { dateOnly, exactInstant, PROVENANCE } = await import("../../app/src/store/time.js");

  const ev = (time) => ({
    event: { eventId: `E-${time.timeProvenance}`, kind: KIND.READING, parameter: "ALK",
             normalizedValue: 8.6, rawValue: 8.6, time },
    state: "CURRENT", notes: [],
  });

  const rows = readingsFrom([
    ev(dateOnly("2026-03-04")),
    ev(exactInstant("2026-03-05", "09:15", 600, "Australia/Sydney")),
  ]);

  eq(rows.length, 2, "both rows are carried — a record with no time is not dropped");

  const untimed = rows.find((r) => r.provenance === PROVENANCE.DATE_ONLY);
  ok(untimed, "the date-only reading arrives with its own provenance");
  eq(untimed.time, null, "and with no time — not midnight, not midday, null");
  eq(untimed.date, "2026-03-04", "and the day it does know");

  const timed = rows.find((r) => r.provenance === PROVENANCE.EXACT_ABSOLUTE);
  eq(timed.time, "09:15", "and a timed reading keeps the time it has");

  /* The property, stated over the whole projection rather than over the two
     rows above: a time on the way out implies a time on the way in. */
  for (const r of rows) {
    if (r.time !== null) ok(r.provenance !== PROVENANCE.DATE_ONLY, `${r.id}: a time appeared from nowhere`);
  }

  /* AND EVERY OTHER READER IN THE MODULE, not just the one named above.

     The first version of this test pinned one source line. A second exported
     reader doing `r.time || "12:00"` beside it was invisible — and a second
     reader is exactly how the defect this test guards would come back, because
     nobody deletes the line a test names. So every export that takes a
     projection is driven, found by reflection. */
  const adapt = await import("../../app/src/lib/adapt.js");
  const projection = [ev(dateOnly("2026-03-04"))];
  for (const [name, fn] of Object.entries(adapt)) {
    if (typeof fn !== "function") continue;
    let out;
    try { out = fn(projection); } catch { continue; }   /* not a projection reader */
    if (!Array.isArray(out) || !out.length) continue;
    for (const row of out) {
      if (row && typeof row === "object" && "time" in row && "provenance" in row) {
        eq(row.time, null, `${name}: gave a date-only record a time`);
      }
    }
  }
});

s.test("PORT-12", "a correction may not improve a record's time provenance", async () => {
  const { assertProvenanceNotImproved, dateOnly, exactInstant } = await import("../../app/src/store/time.js");
  const before = dateOnly("2026-03-04");
  const after = exactInstant("2026-03-04", "09:00", 600, "Australia/Sydney");
  await throws(
    () => assertProvenanceNotImproved(before, after),
    "",
    "a date-only record was allowed to acquire a time"
  );
  eq(before.absoluteInstant, undefined, "a date-only record carries no instant at all");
  eq(before.localTime, undefined, "a date-only record carries no wall-clock time at all");
});

/* ==========================================================================
   5. ONE OWNER FOR THE KEEPER'S OWN BAND
   --------------------------------------------------------------------------
   Four surfaces draw it — the range bar, the card sparkline, the detail
   sheet's chart and All graphs — and `app/src/store/config.js` says why there
   is one function: "two implementations of 'which range is his' is precisely
   the defect canon `MASTER RULE 1` calls a defect rather than a coincidence.
   Once they agreed by luck; the moment his own imported ranges arrived they
   would not have."

   This replaces the coverage `TOK-16` gave, in the suite the port deleted.
   ======================================================================== */

s.test("PORT-13", "which range is the keeper's has one owner, and nobody else chooses", async () => {
  /* TOK-16, restored in full rather than in part.

     The V1 interface port re-pointed TOK-16's two mutations here and rewrote
     the test smaller: it dropped the display-map case, the null-configuration
     case, and — the important one — the cross-file scan that made "one owner"
     true rather than merely claimed. A review pointed out that PORT-13 was
     asserting in its title something its body did not check, and that a second
     `myBand()` in a component was invisible to it.

     `app/src/store/config.js` says why the scan matters: "two implementations
     of 'which range is his' is precisely the defect canon `MASTER RULE 1`
     calls a defect rather than a coincidence. Once they agreed by luck; the
     moment his own imported ranges arrived they would not have." */
  const { keeperRange } = await import("../../app/src/store/config.js");
  const { parameterDef } = await import("../../app/src/store/ledger.js");

  const config = {
    targetRangeMinDkh: 8.2,
    targetRangeMaxDkh: 8.8,
    parameterRanges: { CA: { min: 400, max: 450 }, MG: { min: "x", max: 1400 } },
  };

  /* The REAL parameter definitions, not a literal standing in for one. A
     hand-written `{ key: "ALK", assessed: true }` passes even when
     `ledger.js` has stopped saying alkalinity is assessed, which would break
     every actual caller. */
  const alk = parameterDef("ALK");
  ok(alk && alk.assessed, "alkalinity is the assessed parameter, per the ledger itself");

  const range = keeperRange(alk, config);
  ok(range, "alkalinity has a range");
  eq(range.min, 8.2, "alkalinity's is the engine's own pair");
  eq(range.max, 8.8, "alkalinity's is the engine's own pair");

  eq(
    keeperRange(alk, { parameterRanges: { ALK: { min: 1, max: 2 } } }),
    null,
    "and it is not taken from the display map, even when one is there"
  );

  const ca = keeperRange(parameterDef("CA"), config);
  ok(ca, "calcium has a range");
  eq(ca.min, 400, "calcium's is his own");
  eq(ca.max, 450, "calcium's is his own");

  eq(keeperRange(parameterDef("MG"), config), null, "a half-written range is no range");
  eq(keeperRange(parameterDef("NO3"), config), null, "a parameter he set none for has none");
  eq(keeperRange(parameterDef("CA"), null), null, "and no configuration is no range");

  /* AND NOBODY ELSE DECIDES IT. This is the `MASTER RULE 1` half, and it is
     the reason the test exists. */
  const files = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const q = path.join(dir, name);
      if (fs.statSync(q).isDirectory()) { walk(q); continue; }
      if (/\.(jsx?|mjs)$/.test(name)) files.push(q);
    }
  };
  walk(SRC);
  const others = files
    .filter((f) => rel(f) !== "app/src/store/config.js")
    .filter((f) => /\bconfig\??\.(parameterRanges|targetRangeM(in|ax)Dkh)/.test(
      /* Comments describing the rule are not the rule. */
      read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")
    ))
    /* The shell writes the keeper's own numbers back when he edits a range,
       and states his alkalinity range in the sidebar. Writing and displaying
       what he typed is not choosing which range applies. Named explicitly so
       a THIRD file cannot join it silently. */
    .filter((f) => rel(f) !== "app/src/App.jsx");
  eq(others.length, 0,
    others.length ? `these choose a range themselves: ${others.map(rel).join(", ")}` : "nobody else chooses");
});

/* ==========================================================================
   6. NOTHING THE KEEPER READS IS THE CONTRACT'S SPELLING OF IT
   --------------------------------------------------------------------------
   The brief: "No reason-code identifiers, no canon variable names, and no raw
   precision in any visible string. A number known to two decimals does not
   render as `3.995138888888889`. A timestamp does not render as
   `2026-08-23T07:48:22+00:00`."

   Every one of the values below leaked onto the Dosing tab the first time the
   ported interface was driven against the real engine. They are here as
   themselves rather than as a description, so a regression is a failing test
   rather than something somebody has to read a screen to notice.
   ======================================================================== */

s.test("PORT-14", "an engine value with no wording never reaches the screen in the contract's spelling", async () => {
  const { sayPayloadValue } = await import("../../app/src/present/wording.js");

  /* Contract vocabulary. */
  eq(sayPayloadValue("EPISODE_RESOLVED"), null, "a reason code");
  eq(sayPayloadValue("SET_MAINTENANCE_DOSE"), null, "an action");

  /* Canon rule and issue identifiers. */
  for (const id of ["M-5", "M.2", "ALK-014", "X-INV-004", "WG-ALK-066", "OI-ANOMCLUSTER-001"]) {
    eq(sayPayloadValue(id), null, `a canon identifier: ${id}`);
  }

  /* Engine field names. */
  for (const f of ["maintenanceEstimateMlPerDay", "potencyConfidence", "observedTrajectory"]) {
    eq(sayPayloadValue(f), null, `an engine field name: ${f}`);
  }

  /* An instant is SHOWN, and not in the contract's spelling. */
  const when = sayPayloadValue("2026-08-23T07:48:22+00:00");
  ok(when && !/T\d{2}:\d{2}/.test(when), `an instant is rendered, not printed raw: ${when}`);

  /* And a payload key that carries engine output NAMES routes them through
     their own wording. Asserted POSITIVELY — that the sentence comes out —
     because "it did not print the identifier" is also true of returning
     nothing at all, and a mutation that stops the routing does exactly that.
     `affectedOutputs` is the engine's most common payload and dropping it
     silently is the failure this catches. */
  const outputs = sayPayloadValue(["consumption", "maintenanceEstimateMlPerDay"], "affectedOutputs");
  ok(outputs, "an output list renders at all");
  ok(!/maintenanceEstimateMlPerDay|consumption/.test(outputs),
    `an output list does not print its identifiers: ${outputs}`);
  ok(/,/.test(outputs), `both outputs are rendered, not one: ${outputs}`);
});

s.test("PORT-16", "a hunk may not put V1 chemistry back, whatever reason it carries", async () => {
  /* A REASON IS A LABEL SOMEBODY TYPES.

     A review pointed out that the port manifest counts reasons and never reads
     the hunk: a hunk that ADDS a threshold, labelled `chemistry removed`,
     passes every arm of the check. That cannot be closed in general — whether
     a hunk is chemistry is the judgement a reviewer is there for — but its
     sharpest case can be, because "no V1 chemistry crosses" is the brief's
     central rule and every name it names is known.

     Tested here rather than by mutating the tree, because editing a recorded
     hunk breaks the reverse-apply first: reaching this arm would need the
     ported file and the manifest changed together and consistently, which no
     find-and-replace can do. */
  const { addsChemistry } = await import("../../tools/port/manifest.mjs");

  eq(addsChemistry("+const PARAM_STYLE = {\n-const PARAM_DEFS = [").length, 0,
    "an ordinary hunk names no chemistry");

  ok(addsChemistry("+export const paramStatus = (def, v) => (v < def.min ? 'low' : 'ok');").includes("paramStatus"),
    "a hunk that defines V1's position classifier is flagged");
  ok(addsChemistry("+  const verdict = readingVerdict(def, result);").includes("readingVerdict"),
    "and one that calls its verdict engine");

  /* Removing it is the whole point of the port and must never be flagged. */
  eq(addsChemistry("-export function paramStatus(def, value) {").length, 0,
    "a hunk that DELETES the classifier is not a hunk that adds it");

  /* And this manifest is full of comments naming what was deleted. Naming is
     not doing. */
  eq(addsChemistry("+/* V1's `paramStatus` stood here: a position classifier. */").length, 0,
    "a comment naming what was removed is not a reintroduction");
  eq(addsChemistry("+   V1 called `readingVerdict(def, result)` on its first line").length, 0,
    "nor is prose inside a block comment");
});

/* ==========================================================================
   7. THE TWO META-CHECKS
   --------------------------------------------------------------------------
   Both exist because of something a review found that no test could have.
   ======================================================================== */

s.test("META-01", "every test in the application suite has at least one negative control", async () => {
  /* A REVIEW FOUND FOUR TESTS WITH NONE, AND A NOTE IN `mutations.mjs`
     ASSERTING THERE WERE NONE.

     `IMP-35`, `TM-12`, `TM-24` and `TM-25` were re-pointed at new assertions
     during the V1 interface port; their old mutations went with the code they
     mutated, and nothing noticed. `TM-25`'s case is the sharpest: its own
     comment records that the re-pointing caught a real defect, and no control
     was written for the fix.

     The runner already warns when a MUTATION names a test that does not exist.
     Nothing checked the other direction, which is the direction that matters:
     `MASTER RULE 5` is that a test nobody has seen fail is a test nobody has
     seen work.

     Read from the suite FILES rather than by importing them, because this file
     is one of them and importing it from inside itself is a cycle. */
  const { MUTATIONS } = await import("./mutations.mjs");
  const covered = new Set(MUTATIONS.flatMap((m) => m.breaks || []));

  /* THE EXEMPTIONS, NAMED, WITH THE REASON EACH IS ON THE LIST.

     Twenty-three of these pre-date the V1 interface port — verified against
     `origin/main`, where the same twenty-five come out of the same scan. They
     are on the list because this check found them, not because anybody decided
     they did not need controls; writing twenty-three negative controls is real
     work and it is not this port's. **They are a finding, recorded in
     `docs/migration/PORT-OMISSIONS.md` §11, not a standard.**

     A test added from now on has to earn its way onto this list in a review,
     which is the point: the list is visible and the count only goes down.

     The four the port itself broke — `IMP-35`, `TM-12`, `TM-24`, `TM-25` — are
     deliberately NOT here. They have controls again (`AM-P30`…`AM-P34`). */
  const EXEMPT = new Map([
    /* `META-01` and `META-02` were on this list until they had controls of
       their own (`AM-P36`, `AM-P35`), and the arm below removed them — which
       is the list working. */
    ["PORT-16", "reachable only by changing the manifest and a ported file together and consistently, which a find-and-replace mutation cannot do; PM-06 proves the arm in front of it"],

    /* Pre-existing on `origin/main`, in suite order. */
    ["LED-01", "pre-dates the port"], ["LED-04", "pre-dates the port"],
    ["ASS-05", "pre-dates the port"], ["ASS-06", "pre-dates the port"],
    ["CARD-04", "pre-dates the port"], ["CARD-07", "pre-dates the port"],
    ["SCH-03b", "pre-dates the port"], ["SCH-07", "pre-dates the port"],
    ["SCH-11", "pre-dates the port"], ["SCH-12", "pre-dates the port"],
    ["SUG-06", "pre-dates the port"], ["SUG-12", "pre-dates the port"],
    ["SUG-14", "pre-dates the port"],
    ["TM-13", "pre-dates the port"], ["TM-15", "pre-dates the port"],
    ["TM-18", "pre-dates the port"],
    ["IMP-12", "pre-dates the port"], ["IMP-16", "pre-dates the port"],
    ["IMP-18", "pre-dates the port"], ["IMP-26", "pre-dates the port"],
    ["IMP-27", "pre-dates the port"],
    ["STR-05", "pre-dates the port"], ["STR-09", "pre-dates the port"],
  ]);

  const runner = fs.readFileSync(path.join(HERE, "run-app-tests.mjs"), "utf8");
  const listed = [...runner.matchAll(/"(test-[\w-]+\.mjs)"/g)].map((m) => m[1]);
  ok(listed.length >= 8, `the runner lists its suites (${listed.length})`);

  const uncovered = [];
  for (const file of listed) {
    const text = fs.readFileSync(path.join(HERE, file), "utf8");
    for (const m of text.matchAll(/s\.test\(\s*"([^"]+)"/g)) {
      if (!covered.has(m[1]) && !EXEMPT.has(m[1])) uncovered.push(`${file}:${m[1]}`);
    }
  }
  eq(uncovered.join(", "), "", `these tests have no mutation that turns them red: ${uncovered.join(", ")}`);

  /* And the list only shrinks. An exemption for a test that has since acquired
     a control, or for a test that no longer exists, is removed rather than
     left to accumulate. */
  const stale = [...EXEMPT.keys()].filter((id) => covered.has(id));
  eq(stale.join(", "), "", `these are exempt and no longer need to be: ${stale.join(", ")}`);
});

s.test("META-02", "every file in the application is either ported from V1 or declared as V2's own", () => {
  /* THE PORT MANIFEST IS ONLY AS COMPLETE AS ITS MAP.

     `check-port-manifest.mjs` iterates `port-map.json` and proves each entry
     honest. Nothing bounded the map, so a file lifted from V1 and simply never
     entered was invisible — a review demonstrated it by copying V1's
     `WaterLog.jsx` into `app/src/components/` and watching the manifest stay
     green.

     This closes it from the other end: the two declarations together must
     account for the whole tree. A new file has to be claimed as one or the
     other, and claiming it as V2's own is a claim a reviewer can check against
     V1. */
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/port/port-map.json"), "utf8"));
  const own = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/port/v2-original.json"), "utf8"));
  const ported = new Set(map.files.map((f) => f.v2));
  const declared = new Set(own.files);

  for (const f of own.files) {
    ok(!ported.has(f), `${f} is declared both ported and V2's own`);
    ok(fs.existsSync(path.join(ROOT, f)), `${f} is declared V2's own and does not exist`);
  }

  const unaccounted = [];
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const q = path.join(dir, name);
      if (fs.statSync(q).isDirectory()) { walk(q); continue; }
      if (!/\.(jsx?|mjs|css)$/.test(name)) continue;
      const r = rel(q);
      if (!ported.has(r) && !declared.has(r)) unaccounted.push(r);
    }
  };
  walk(SRC);
  eq(unaccounted.join(", "), "",
    `these are in neither the port manifest nor the V2-original list: ${unaccounted.join(", ")}`);
});

s.test("PORT-17", "the standing dose is stamped at the APP's instant, so it survives into a backdated assessment", async () => {
  /* `PORT-10` holds `recordDoseState` to producing an `EXACT_ABSOLUTE` record
     with an instant on it. It does not hold it to producing the RIGHT one, and
     `ok(ev.time.absoluteInstant)` is true of any string.

     `store/time.js` owns what moment the app is being asked about, and test
     mode is exactly the case where that is not `new Date()`. Stamped from the
     wall clock, a standing dose recorded while the app's instant sits in March
     is effective in August; `happenedBy` filters it out of every assessment,
     and the engine reports it has no record of what is being dosed — which is
     the defect the field was added to fix, reappearing inside the test mode
     restored in the same round. Measured before the fix: zero events reaching
     the engine.

     `TM-23` cannot see this. It allow-lists `lib/record.js` wholesale as
     "every event's `recordedAt`", and `recordedAt` is the one read in that
     file which SHOULD be the wall clock. */
  const { createMemoryStore } = await import("../../app/src/store/index.js");
  const { recordDoseState } = await import("../../app/src/lib/record.js");
  const { setClock, nowIso } = await import("../../app/src/store/time.js");
  const { toEngineEvents } = await import("../../app/src/store/ledger.js");

  const SIMULATED = new Date("2026-03-04T06:30:00Z");
  try {
    setClock(() => SIMULATED);
    const store = createMemoryStore("port-dose-state");
    const ev = await recordDoseState(store, { doseMlPerDay: 8.8 });

    eq(ev.time.absoluteInstant.slice(0, 16), nowIso().slice(0, 16),
      "the instant is the app's own now, not the wall clock");
    eq(ev.effectiveTime.absoluteInstant, ev.time.absoluteInstant,
      "and the moment it takes effect is that same moment");
    eq(ev.detail.effectiveAtConfidence, "EXACT",
      "stated to the minute, because that is what the keeper knows");
    eq(ev.time.localDate, ev.time.absoluteInstant.slice(0, 10),
      "and the day on the record is the day of the instant, not a second opinion");

    /* The consequence, rather than the field. A dose the app cannot see is
       the whole of the defect. */
    const sent = toEngineEvents(await store.ledger.projection(), nowIso());
    eq(sent.length, 1, "and it reaches the engine at the instant the app is being asked about");

    /* `recordedAt` is the opposite rule and must stay the wall clock: it is
       when the app was TOLD, and the app genuinely was running then. */
    ok(ev.recordedAt > "2026-03-04T06:30:00Z" || ev.recordedAt.slice(0, 4) >= "2026",
      "and `recordedAt` is still the real instant the app was told");
  } finally {
    setClock(null);
  }
});

s.test("PORT-19", "the Python runtime's location is stated once, so a built worker and a dev worker cannot disagree about it", () => {
  /* THE DEFECT THIS PINS COULD NOT BE SEEN BY READING THE LINE.

     `worker.js` had a RELATIVE import for the runtime —
     `"../../vendor/pyodide/pyodide.mjs"` — beside an `indexURL` derived from
     `BASE`. Two spellings of one location, and they agree ONLY where the
     worker file sits three directories deep. In the dev server it does. In a
     BUILT app the worker chunk is emitted to `/assets/`, and then:

         import   ../../../vendor/pyodide/pyodide.mjs  ->  /vendor/pyodide/…
         indexURL new URL("app/vendor/pyodide/", BASE) ->  /app/vendor/pyodide/

     The import 404s, `boot()` rejects, and every assessment comes back a
     transport failure. THE ENGINE COULD NOT START IN PRODUCTION AT ALL — and
     nothing saw it: not the dev server, not the app suite, not a reader,
     because the line looked right and the line beside it was right.

     So the check is not "is the path correct" — a second correct spelling is
     the same defect waiting. It is that the location is stated ONCE and both
     uses derive from it, which is `MASTER RULE 1` applied to a URL.

     The end-to-end proof lives in `tools/app/check-runtime-path.mjs`, which
     serves a stub at the path a deployment uses and watches a real browser
     reach it. This is its cheap always-on half. */
  const src = fs.readFileSync(path.join(ROOT, "app/src/engine/worker.js"), "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "");

  /* No relative walk to the runtime, in either spelling. */
  ok(!/["'`][.][.]\/[^"'`]*vendor\/pyodide/.test(code),
    "the runtime is not reached by a relative path, which is what moved when the file did");

  /* One expression names it, and both uses take it from there. */
  const decl = code.match(/const RUNTIME = new URL\("app\/vendor\/pyodide\/", BASE\);/);
  ok(decl, "the runtime's location is declared once, from BASE");
  ok(/await import\([^)]*new URL\("pyodide\.mjs", RUNTIME\)/.test(code),
    "the module import derives from it");
  ok(/indexURL: RUNTIME\.href/.test(code),
    "and so does the indexURL — not a second spelling that happens to agree");

  /* And the property itself, as arithmetic rather than as a spelling: from
     EVERY location the worker is served from, the two must land together. */
  for (const where of [
    "https://example.test/app/src/engine/worker.js",  /* the dev server */
    "https://example.test/assets/worker-abc123.js",   /* a built bundle */
    "https://example.test/app/dist/assets/w.js",      /* served one level in */
  ]) {
    const base = new URL("../../../", where);
    const runtime = new URL("app/vendor/pyodide/", base);
    eq(new URL("pyodide.mjs", runtime).pathname, "/app/vendor/pyodide/pyodide.mjs",
      `the module resolves to the deployed path from ${where}`);
    eq(runtime.pathname, "/app/vendor/pyodide/",
      `and the indexURL agrees with it from ${where}`);
  }
});

export default s;
