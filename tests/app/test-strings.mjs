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
  /* REEFKEEPER FINDING 8. This used to require the sentence to send the keeper
     to "the developer view", and there is no developer view: no screen in the
     application renders one. The check was pinning the defect in place. What
     the sentence has to do is be honest about the gap without inventing a
     place to go and look. */
  ok(!/developer view|debug|console/i.test(said), "and it sends him to no screen the app does not have");
});

s.test("STR-11", "no message points the keeper at a screen the application does not have", () => {
  /* REEFKEEPER FINDING 8, generalised. He read "the full result is in the
     developer view at the foot of this screen", scrolled to the foot of the
     screen, and found the foot of the screen. Three further sentences named
     the same imaginary surface and were never rendered at all.

     A promise of a surface is checkable: the phrase names a screen, so some
     component has to render it. None did. */
  const strings = fs.readFileSync(path.join(ROOT, "app/src/strings.js"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "");
  const offenders = [...strings.matchAll(/^.*\b(developer view|debug (?:view|screen|panel))\b.*$/gim)]
    .map((m) => m[0].trim());
  eq(offenders.join("\n"), "", `these sentences name a screen that is not built:\n${offenders.join("\n")}`);
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

/* THE CLOSED VOCABULARIES, READ FROM THE CONTRACT RATHER THAN RETYPED.

   This test used to carry hand-written value lists, and they were wrong in the
   same way the code was wrong: `HOLD` where the contract says
   `HOLD_CURRENT_DOSE`, `REFUSE` which is not a `RecommendationAction` at all,
   and the reason-code spellings `PROVISIONAL_TWO_POINT` and `CONFOUNDED_HARD`
   in place of the `MovementEvidence` values `PROVISIONAL` and `CONFOUNDED`.
   A test written from the same misreading as the code confirms the misreading.

   So the values are parsed out of `ALK-V2-DATA-CONTRACT.md`, which is where
   they are declared. A value added to the contract now arrives here on its own
   and fails until somebody writes the sentence. */
function closedVocabulary(name) {
  const md = fs.readFileSync(
    path.join(ROOT, "docs/implementation/alk-v2/ALK-V2-DATA-CONTRACT.md"),
    "utf8"
  );
  /* Two spellings in the document: a `###` heading with the values beneath,
     and an inline "`X` closed vocabulary: ..." run-on. Both are matched, and
     finding neither is a failure rather than an empty list — an empty list
     would make this test pass by checking nothing. */
  const heading = new RegExp("### \`" + name + "\` — closed vocabulary\\s*\\n+([^#]+)");
  const inline = new RegExp("\`" + name + "\`[^\\n]*closed vocabulary[^:]*:([\\s\\S]*?)\\n\\n");
  const m = md.match(heading) || md.match(inline);
  ok(m != null, `the contract declares a closed vocabulary for ${name}`);
  const values = [...m[1].matchAll(/\`([A-Z][A-Z0-9_]*)\`/g)].map((x) => x[1]);
  ok(values.length > 1, `${name} has values: ${values.join(", ")}`);
  return values;
}

s.test("STR-06", "every engine enum the interface renders has a word for every value", () => {
  const cases = [
    [sayEvidence, closedVocabulary("MovementEvidence")],
    [sayTrajectory, closedVocabulary("Trajectory")],
    [sayPosition, closedVocabulary("Position")],
    [sayAction, closedVocabulary("RecommendationAction")],
    /* Not declared with the same phrase in the document, so these stay as
       lists — and they are the ones to move next if the contract grows a
       heading for them. */
    [sayOuter, ["WITHIN_BOUNDS", "BREACHED_LOW", "BREACHED_HIGH", "NOT_RUN", "UNKNOWN"]],
    [sayResponseClass, ["RESPONDING_AS_PREDICTED", "RESPONDING_MORE_THAN_PREDICTED", "RESPONDING_LESS_THAN_PREDICTED", "NO_DETECTABLE_RESPONSE", "NOT_ATTRIBUTABLE_SMALL_SIGNAL", "CONFOUNDED", "NOT_RUN", "NONE"]],
  ];
  for (const [fn, values] of cases) {
    for (const v of values) {
      const said = fn(v);
      ok(said.length > 0, `${v} says something`);
      ok(!CONTRACT_SHAPED.test(said), `${v} does not render as its own identifier: "${said}"`);
      ok(
        !/^\u27e8missing string/.test(said),
        `${v} has a sentence, rather than the missing-string marker: "${said}"`
      );
      /* The one that mattered: an engine value rendering as an ABSENCE. The
         keeper's best evidence state used to read "Not recorded". */
      ok(
        said !== t("absent.notRecorded"),
        `${v} is a value the engine stated, not an absence: "${said}"`
      );
    }
  }
  /* Every capability the contract names, not a sample of four. Three of these
     were labelled with a DIFFERENT capability's meaning, which the old
     four-item spot check could not see. */
  for (let i = 1; i <= 13; i += 1) {
    const id = `M-${i}`;
    const said = sayCapability(id);
    ok(!CONTRACT_SHAPED.test(said), `${id} renders as words`);
    ok(said !== t("capability.other"), `${id} has its own label rather than the catch-all`);
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

s.test("STR-10", "every parameter a string declares reaches the sentence it is declared for", () => {
  /* THE SAME CLASS OF DEFECT AS THE `fmtVal` ARGUMENT SWAP: a value handed to a
     formatter and dropped on the floor. There it printed the wrong argument;
     here it prints none — the caller computes a figure, passes it, and the
     sentence never mentions it.

     It found two. `dosing.potency.working.observation` declared a `date` and
     derived it by slicing the engine's observation id at fixed offsets, so the
     cost of the omission was a fragile derivation nobody could see was unused.
     `suggest.alreadyScheduled` declared a `day` and had done since the port.

     Every function-valued string is called with a distinct sentinel per
     parameter and every sentinel must appear in the output. A string that is
     genuinely better without a parameter should not DECLARE it — that is the
     whole rule, and the fix in both cases was to stop declaring it. */
  const missing = [];
  for (const key of keys()) {
    const value = STRINGS[key];
    if (typeof value !== "function") continue;

    /* The declared names, read off the destructuring in the source. A string
       taking a positional argument rather than an object is out of scope: this
       file's convention is an object, and `STR-08` guards the rest. */
    const declared = /^\(\s*\{([^}]*)\}/.exec(value.toString());
    if (!declared) continue;
    const names = declared[1]
      .split(",")
      .map((n) => n.split(/[:=]/)[0].trim())
      .filter((n) => /^[A-Za-z_$][\w$]*$/.test(n));
    if (!names.length) continue;

    const args = {};
    /* An array sentinel for a name a string joins rather than interpolates —
       `parts` and `list` are rendered by `Array.prototype.join`, and a string
       sentinel would render as its characters. The sentinel is still unique per
       name, so a dropped one is still visible. */
    names.forEach((n, i) => {
      const token = `SENTINEL${i}${n.toUpperCase()}`;
      args[n] = /^(parts|list|items|lines)$/.test(n) ? [token] : token;
    });

    let out;
    try { out = String(value(args)); }
    catch (e) { missing.push(`${key}: threw ${e && e.message}`); continue; }

    for (const [i, n] of names.entries()) {
      if (!out.includes(`SENTINEL${i}${n.toUpperCase()}`)) {
        missing.push(`${key}: declares \`${n}\` and never renders it`);
      }
    }
  }
  eq(missing.join(" | "), "", `every declared parameter reaches its sentence: ${missing.join(" | ")}`);
});

s.test("STR-09", "the file is the only place, and it holds a substantial number of them", () => {
  ok(keys().length > 500, `the strings file holds ${keys().length} entries`);
  /* Every key is either a string or a function of its values, and nothing else. */
  for (const k of keys()) {
    const v = STRINGS[k];
    ok(typeof v === "string" || typeof v === "function", `${k} is a string or a function`);
  }
});

s.test("STR-12", "a figure in a sentence carries its unit", () => {
  /* `jake` found `dosing.boxes.diff.matchingSubGap` rendering "0.070 apart"
     under a box headed "The difference", between two boxes reading "0.420
     dKH/day" and "0.350 dKH/day" — a bare number where its two siblings six
     lines above print the unit. That string exists BECAUSE of a
     figures-and-units contradiction; it shipped with the same one.

     `fmtQty` returns a bare number by design, so every sentence that
     interpolates one owns the unit. This checks the family where the mistake
     happened rather than the whole register: a scan of every string in the file
     would be a scan nobody could keep green. */
  for (const key of ["dosing.boxes.diff.short", "dosing.boxes.diff.excess",
                     "dosing.boxes.diff.matchingSubGap"]) {
    const said = t(key, { gap: "0.070" });
    ok(/dKH\/day/.test(said), `${key} says what the figure is measured in: "${said}"`);
  }
});

export default s;
