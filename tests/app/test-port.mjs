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

s.test("PORT-02", "the engine's position vocabulary appears in no interface file", () => {
  const hits = [];
  for (const f of uiFiles()) {
    const text = read(f);
    for (const v of POSITIONS) {
      if (new RegExp(`["'\`]${v}["'\`]`).test(text)) hits.push(`${rel(f)}: ${v}`);
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
    const text = read(f);
    for (const v of CONTRACT_VALUES) {
      if (new RegExp(`["'\`]${v}["'\`]`).test(text)) hits.push(`${rel(f)}: ${v}`);
    }
  }
  eq(hits.join(" | "), "", "a contract decision value outside app/src/present/");
});

/* The last shape a classifier can take: comparing a reading to a bound. V1's
   `paramStatus` was exactly `value < def.min`, and it was four lines. */
s.test("PORT-04", "no interface file compares a reading to a band edge", () => {
  const PATTERNS = [
    /\bvalue\s*[<>]=?\s*[\w.]*\b(min|max|Min|Max)\b/,
    /\b(def|d)\.(min|max)\s*[<>]=?\s*/,
    /[<>]=?\s*(def|d)\.(min|max)\b/,
  ];
  const hits = [];
  for (const f of uiFiles()) {
    const text = read(f);
    text.split("\n").forEach((line, i) => {
      /* A comment describing the deleted comparison is not the comparison. */
      const code = line.replace(/\/\*.*?\*\//g, "").replace(/^\s*\*.*$/, "").replace(/\/\/.*$/, "");
      for (const p of PATTERNS) {
        if (p.test(code)) hits.push(`${rel(f)}:${i + 1}: ${line.trim().slice(0, 80)}`);
      }
    });
  }
  eq(hits.join(" | "), "", "a reading compared to a band edge in an interface file");
});

/* ==========================================================================
   2. EVERY SCREEN READS AND WRITES V2's STORAGE
   ======================================================================== */

s.test("PORT-05", "no interface file touches browser storage directly", () => {
  const hits = [];
  for (const f of uiFiles()) {
    const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const api of ["localStorage", "sessionStorage", "indexedDB", "openDatabase"]) {
      if (new RegExp(`\\b${api}\\b`).test(text)) hits.push(`${rel(f)}: ${api}`);
    }
  }
  eq(hits.join(" | "), "", "browser storage reached directly from the interface");
});

/* Every write into the record goes through `app/src/lib/record.js`, so there
   is one place to read to check that a date-only record never acquires a time
   and one place a test has to cover. A component appending its own event would
   be a second author of the envelope. */
s.test("PORT-06", "no component appends to the ledger itself", () => {
  const hits = [];
  for (const f of uiFiles()) {
    if (rel(f) === "app/src/lib/record.js") continue;
    const text = read(f).replace(/\/\*[\s\S]*?\*\//g, "");
    for (const call of ["ledger.append", "ledger.annotate", "makeEvent(", "makeAnnotation(", "backend.put("]) {
      if (text.includes(call)) hits.push(`${rel(f)}: ${call}`);
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

s.test("PORT-08", "a stored assessment carries the versions that produced it", async () => {
  const { createMemoryStore } = await import("../../app/src/store/index.js");
  const store = createMemoryStore("port-test-versions");
  const engineResult = {
    assessmentId: "ASSESS-X",
    assessmentAsOf: "2026-08-21T08:00:00+10:00",
    configVersionId: "CFG-V1",
    engineVersion: "E1",
    canonVersion: "C1",
    position: "IN_RANGE",
    reasonCodes: [],
  };
  const { record } = await store.assessments.record({
    engineResult,
    auditTrace: null,
    asOf: "2026-08-21T08:00:00+10:00",
    localDate: "2026-08-21",
    inputEventIds: [],
    configVersionId: "CFG-V1",
    describe: { engineVersion: "E1", canonVersion: "C1" },
  });
  eq(record.engineVersion, "E1", "engineVersion on the stored record");
  eq(record.canonVersion, "C1", "canonVersion on the stored record");
  eq(record.configVersionId, "CFG-V1", "configVersionId on the stored record");
  eq(record.asOf, "2026-08-21T08:00:00+10:00", "the assessment instant on the stored record");
});

s.test("PORT-09", "the assessment path still asks the engine which versions it is", () => {
  const assess = read(path.join(SRC, "assess.js"));
  ok(assess.includes("describe()"), "assess.js no longer asks the engine to describe itself");
  ok(assess.includes("describe: versions"), "assess.js no longer stamps the stored record with them");
});

/* ==========================================================================
   4. A DATE-ONLY READING NEVER GAINS A TIME
   ======================================================================== */

s.test("PORT-10", "the write adapter never constructs a time-less record with a time", () => {
  const rec = read(path.join(SRC, "lib/record.js"));
  ok(!/dateOnly\s*\(/.test(rec), "the write adapter calls dateOnly — a live entry has a time box");
  /* And nothing in it invents one. A default time would look exactly like
     this, so this is the line the mutation attacks. */
  ok(!/\|\|\s*["']12:00["']/.test(rec.replace(/husbandryKind[\s\S]*?\n/g, "")),
    "the write adapter defaults a missing time");
});

s.test("PORT-11", "the read adapter carries an absent time through as absent", () => {
  const adapt = read(path.join(SRC, "lib/adapt.js"));
  ok(adapt.includes("time: e.time.localTime || null"),
    "adapt.js no longer passes a missing wall-clock time through as null");
  ok(!/localTime\s*\|\|\s*["'][0-9]/.test(adapt),
    "adapt.js substitutes a clock time for a record that has none");
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

s.test("PORT-13", "the keeper's own band has one owner, and a half-written one is not a band", async () => {
  const { keeperRange } = await import("../../app/src/store/config.js");

  const alk = { key: "ALK", assessed: true };
  const ca = { key: "CA", assessed: false };

  /* The assessed parameter's range is the two fields the engine reads. */
  const config = {
    targetRangeMinDkh: 8.2,
    targetRangeMaxDkh: 8.8,
    parameterRanges: { CA: { min: 400, max: 450 }, MG: { min: 1250 } },
  };
  deepEqRange(keeperRange(alk, config), { min: 8.2, max: 8.8 }, "alkalinity reads the engine's own fields");
  deepEqRange(keeperRange(ca, config), { min: 400, max: 450 }, "everything else reads parameterRanges");

  /* Absent is absent. This build ships no range it cannot source, so every
     consumer has to cope rather than substituting a default — a default here
     would be a band edge invented by the application. */
  eq(keeperRange({ key: "NO3", assessed: false }, config), null, "a parameter with no range has none");
  eq(keeperRange(alk, { parameterRanges: {} }), null, "alkalinity with no range set has none");

  /* A minimum with no maximum is not a range. Accepting it shades a band with
     no top edge. */
  eq(keeperRange({ key: "MG", assessed: false }, config), null, "a half-written range is not a range");

  function deepEqRange(actual, expected, what) {
    ok(actual, `${what}: nothing returned`);
    eq(actual.min, expected.min, `${what}: min`);
    eq(actual.max, expected.max, `${what}: max`);
  }
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

export default s;
