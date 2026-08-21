/* ============================================================================
   ONE STRINGS FILE, AND NOTHING LEAKING PAST IT
   ----------------------------------------------------------------------------
   `tools/app/check-strings.py` proves no prose literal exists outside
   `strings.js`. These checks prove the other half: that what IS in strings.js
   covers what the app needs, and that the two rules owner decision 9 states —
   no reason-code identifier and no canon variable name on screen — hold for
   every code and value the engine can actually produce.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import { STRINGS, t, has, keys } from "../../app/src/strings.js";
import {
  sayReason,
  saySeverity,
  sayPayloadValue,
  sayCapability,
  sayConstraint,
  sayOutput,
  sayPosition,
  sayTrajectory,
  sayEvidence,
  sayOuter,
  sayResponseClass,
  sayAction,
  sayAbsent,
  whyAbsent,
} from "../../app/src/present/wording.js";

const s = suite("strings");
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

/* Contract vocabulary: two or more underscore-joined capitalised parts. This is
   the shape owner decision 9 forbids on screen. */
const CONTRACT_SHAPED = /^[A-Z][A-Z0-9]*(_[A-Z0-9]+)+$/;

const DEVELOPER_FACING = new Set(["err.provenanceImproved", "err.unknownAnnotation", "err.unknownEventKind"]);

/* Names that share the reason codes' shape and are NOT reason codes. Each is
   listed with what it actually is, checked against
   `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`, so the exclusion is a
   statement rather than a convenience. */
const NOT_REASON_CODES = new Set([
  /* Event kinds — the contract's INPUT vocabulary, `ledger.js` `KIND`. */
  "CONSUMPTION_CONTEXT_EVENT",
  "DELIVERY_ANOMALY",
  "MANUAL_CORRECTION",
  "READING_SERIES",
  /* A `featureState` value, per the catalogue's own table at line 553. */
  "CAPABILITY_GATED",
]);

/* Every reason code the engine can emit, read from the engine's own source
   rather than from a list kept here. A copy would drift, and the point of the
   check is that it cannot. */
function engineReasonCodes() {
  const dir = path.join(ROOT, "engine", "alk_v2");
  const codes = new Set();
  for (const fn of fs.readdirSync(dir).filter((f) => f.endsWith(".py"))) {
    const src = fs.readFileSync(path.join(dir, fn), "utf8");
    /* `{1,}` and not `{2,}`. Two-segment codes are real — `TRAJECTORY_FALLING`,
       `UNCERTAINTY_LIMITED`, `MAINTENANCE_HOLD` — and an earlier version of
       this line required three segments, so every one of them went unchecked.
       The mutation arm found that: `AM-40` renamed a two-segment code's string
       and this check stayed green. */
    for (const m of src.matchAll(/"([A-Z][A-Z0-9]*(?:_[A-Z0-9]+){1,})"/g)) {
      const c = m[1];
      /* The catalogue's own prefixes. Anything else in this shape is a value,
         a state or a capability, not a reason code. */
      if (NOT_REASON_CODES.has(c)) continue;
      if (
        /^(CONFIG|VALIDATION|EPISODE|OBSERVATION|SEGMENT|DELIVERY|EVIDENCE|TRAJECTORY|UNCERTAINTY|CONSUMPTION|POTENCY|MAINTENANCE|RESPONSE|INTERVENTION|RETURN|SAFETY|RETEST|CAPABILITY|OUTPUT|AUDIT|MIGRATION)_/.test(
          c
        )
      ) {
        codes.add(c);
      }
    }
  }
  return [...codes].sort();
}

s.test("STR-01", "every reason code the engine can emit has a plain-English sentence", () => {
  const codes = engineReasonCodes();
  ok(codes.length > 100, `the engine's codes were found (${codes.length})`);

  const missing = codes.filter((c) => !has(`reason.${c}`));
  ok(
    missing.length === 0,
    `${missing.length} code(s) have no wording and would render the general fallback:\n    ` +
      missing.join("\n    ")
  );
});

s.test("STR-02", "no visible string contains contract vocabulary", () => {
  const leaks = [];
  for (const key of keys()) {
    const entry = STRINGS[key];
    /* A parameterised string is exercised with placeholder values, so a
       template that interpolates a contract value is caught too. */
    const text =
      typeof entry === "function"
        ? entry({
            n: 3, days: 4, date: "20 Aug", time: "07:40", dose: "9.3", value: "8.70",
            unit: "dKH", label: "Alkalinity", volume: 77, list: "a, b", parts: ["a", "b"],
            error: "something", minutes: 30, window: "60 days", from: "9.0", to: "9.3",
            slope: "-0.0194", direction: "Up", delta: "0.3", interval: "every week",
            actual: 3, set: 3, seconds: 12, effect: "0.0206", present: 1, named: 2,
            min: 8.6, max: 9.2, tests: 5, observed: "-0.04", subtracted: "0.02",
            fromDate: "12 Aug", toDate: "20 Aug", range: "", key: "ALK", kind: "READING",
            type: "MARK_SUSPECT", id: "CFG-V1", path: "x", status: 404, element: "Ca",
            text: "abc", before: "DATE_ONLY", after: "EXACT_ABSOLUTE", scheduled: 2, done: 1,
            total: 6, engine: "e", canon: "c", seconds2: 1,
          })
        : entry;

    /* Developer-facing invariant messages, which name the contract value that
       violated the invariant on purpose. These reach a keeper only through the
       crash screen's developer view, which is where owner decision 9 permits
       contract vocabulary. Listed one by one rather than exempted by prefix,
       so a new `err.*` string that leaks onto a real screen still fails. */
    if (DEVELOPER_FACING.has(key)) continue;

    for (const m of String(text).matchAll(/\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)+\b/g)) {
      leaks.push(`${key}: ${m[0]}`);
    }
  }
  ok(leaks.length === 0, `contract vocabulary in visible strings:\n    ${leaks.join("\n    ")}`);
});

s.test("STR-03", "a payload value that has no wording is withheld rather than printed raw", () => {
  /* This is the leak that reached a real screen during the build: the payload
     key was translated and the value was printed verbatim, so
     CONFIRMED_PROGRAMMED_SCHEDULE appeared on the assessment card. */
  eq(sayPayloadValue("CONFIRMED_PROGRAMMED_SCHEDULE"), "a confirmed pump schedule", "a value with wording");
  eq(sayPayloadValue("SOME_STATE_THE_CONTRACT_ADDED"), null, "a value without wording is not printed");
  eq(sayPayloadValue(42), "42", "a number is printed");
  eq(sayPayloadValue(true), "true", "a boolean is printed");
  eq(sayPayloadValue("2026-08-20"), "2026-08-20", "a date is printed");
  eq(sayPayloadValue(null), null, "nothing is printed for nothing");
  eq(sayPayloadValue(["NOT_RUN", "NONE"]), "not worked out, none", "a list of known values");
  eq(sayPayloadValue(["NOT_RUN", "MYSTERY_STATE_HERE"]), null, "a list with an unknown value is withheld whole");
});

s.test("STR-04", "an unknown reason code falls back honestly, without naming itself", () => {
  const said = sayReason("SOME_CODE_ADDED_TOMORROW");
  ok(said.length > 0, "something is said");
  ok(!CONTRACT_SHAPED.test(said), "and it is not the identifier");
  ok(!said.includes("SOME_CODE"), "the identifier does not appear inside it either");
  ok(/developer view/i.test(said), "and it says where the identifier can be found");
});

s.test("STR-05", "every declined state renders as words, with a reason", () => {
  for (const v of ["NOT_RUN", "WITHHELD", "NONE", "UNKNOWN", "NOT_APPLICABLE"]) {
    const word = sayAbsent(v);
    const why = whyAbsent(v);
    ok(word.length > 0 && !CONTRACT_SHAPED.test(word), `${v} renders as words`);
    ok(why.length > 0 && !CONTRACT_SHAPED.test(why), `${v} carries a reason`);
  }
  /* And a state nobody wrote a word for still says something rather than
     showing a blank. */
  ok(sayAbsent("SOMETHING_NEW").length > 0, "an unknown declined state still says something");
});

s.test("STR-06", "every engine enum the interface renders has a word for every value", () => {
  const cases = [
    [sayPosition, ["IN_RANGE", "BELOW_RANGE", "ABOVE_RANGE", "UNKNOWN", "NOT_RUN"]],
    [sayTrajectory, ["RISING", "FALLING", "STABLE", "UNCERTAIN", "NOT_RUN"]],
    [sayEvidence, ["SUFFICIENT", "INSUFFICIENT", "PROVISIONAL_TWO_POINT", "CONFOUNDED_HARD", "ANOMALOUS", "UNCERTAINTY_LIMITED", "NOT_RUN"]],
    [sayOuter, ["WITHIN_BOUNDS", "BREACHED_LOW", "BREACHED_HIGH", "NOT_RUN", "UNKNOWN"]],
    [sayResponseClass, ["RESPONDING_AS_PREDICTED", "RESPONDING_MORE_THAN_PREDICTED", "RESPONDING_LESS_THAN_PREDICTED", "NO_DETECTABLE_RESPONSE", "NOT_ATTRIBUTABLE_SMALL_SIGNAL", "CONFOUNDED", "NOT_RUN", "NONE"]],
    [sayAction, ["SET_MAINTENANCE_DOSE", "HOLD", "INSUFFICIENT_DATA", "REFUSE", "NOT_RUN"]],
  ];
  for (const [fn, values] of cases) {
    for (const v of values) {
      const said = fn(v);
      ok(said.length > 0, `${v} says something`);
      ok(!CONTRACT_SHAPED.test(said), `${v} does not render as its own identifier: "${said}"`);
    }
  }
  for (const id of ["M-1", "M-5", "M-11", "M-13"]) {
    ok(!CONTRACT_SHAPED.test(sayCapability(id)), `${id} renders as words`);
  }
  for (const c of ["ACTUATOR_ROUNDING", "RATE_RAIL", "LIQUID_GUARD"]) {
    ok(!CONTRACT_SHAPED.test(sayConstraint(c)), `${c} renders as words`);
  }
  for (const o of ["consumption", "potency.learnedPotencyDkhPerMl"]) {
    ok(sayOutput(o).length > 0, `${o} renders as words`);
  }
  for (const sev of ["GATING", "REFUSAL", "INFO"]) {
    ok(!CONTRACT_SHAPED.test(saySeverity(sev)), `${sev} renders as words`);
  }
});

s.test("STR-07", "a missing key is a visible defect, not a blank", () => {
  const said = t("this.key.does.not.exist");
  ok(said.length > 0, "something is rendered");
  ok(said.includes("this.key.does.not.exist"), "and it names the key so the defect is findable");
  eq(has("this.key.does.not.exist"), false, "and `has` agrees it is absent");
});

s.test("STR-08", "a parameterised string keeps the value inside the sentence, not appended to it", () => {
  /* The point of a function-valued string: word order and where the number
     sits are editable in one place. A string that were merely concatenated at
     the call site would have the value only ever at the end. */
  const said = t("assessment.reco.dose", { direction: "Increase", dose: "9.3" });
  ok(said.startsWith("Increase"), "the direction leads");
  ok(said.includes("9.3"), "the value is inside");
  ok(!said.endsWith("9.3"), "and is not merely stuck on the end");
  ok(said.includes("mL/day"), "with its unit after it");

  const days = t("today.task.overdue", { days: 1, last: "Last done 15 Aug." });
  ok(days.includes("1 day overdue"), `singular: "${days}"`);
  const plural = t("today.task.overdue", { days: 3, last: "" });
  ok(plural.includes("3 days overdue"), `plural: "${plural}"`);
});

s.test("STR-09", "the file is the only place, and it holds a substantial number of them", () => {
  ok(keys().length > 500, `the strings file holds ${keys().length} entries`);
  /* Every key is either a string or a function of its values, and nothing else. */
  for (const k of keys()) {
    const v = STRINGS[k];
    ok(typeof v === "string" || typeof v === "function", `${k} is a string or a function`);
  }
});

export default s;
