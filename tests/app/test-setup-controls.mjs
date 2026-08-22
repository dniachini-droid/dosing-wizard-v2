/* ============================================================================
   SETUP'S CONTROLS — OWNER FINDINGS 16, 17, 18 AND 24
   ----------------------------------------------------------------------------
   Four faults about what a control says by being the shape it is.

   A field that still looks like a field after you save it says nothing took. A
   box the width of the phone says "write me a sentence" to a keeper with three
   digits to type. Two number boxes for a range hide the thing actually worth
   judging, which is how WIDE he made it. And mg/L is not the word on any test
   kit, any bottle, or in any conversation between reefkeepers.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import { gradeWidth } from "../../app/src/present/range-grade.js";
import { PARAMETERS } from "../../app/src/store/ledger.js";

const s = suite("setup controls");
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

s.test("SC-01", "a saved group locks, and its Save becomes Edit", () => {
  /* FINDING 16. A message that fades is not an answer to "is this what the app
     is now using". The field itself has to change state. */
  const setup = code("app/src/components/Setup.jsx");
  /* Each lock is derived from two things: is every value in the group on
     record, and is the keeper editing it. A constant here would be a screen
     that has decided in advance never to lock, which is the defect. */
  for (const [locked, saved, editing] of [
    ["tankLocked", "tankSaved", "tankEditing"],
    ["strengthLocked", "strengthSaved", "strengthEditing"],
    ["stepLocked", "stepSaved", "stepEditing"],
  ]) {
    const decl = new RegExp(`const ${locked} = ([^;]+);`).exec(setup);
    ok(decl, `${locked} is declared`);
    /* THE OPERATOR, not just the two names. `test-engineer` showed that
       `tankSaved || !tankEditing` — which locks a field before anything has
       ever been saved — passed a check that only looked for both identifiers.
       Locked means BOTH: it is on record, and he is not editing it. */
    const rule = decl[1].replace(/\s+/g, " ").trim();
    eq(rule, `${saved} && !${editing}`,
      `${locked} is "on record AND not being edited": got "${rule}"`);
  }
  ok(/<LockedValue/.test(setup), "a saved value renders as text");
  ok(/<SaveOrEdit/.test(setup), "and one control is Save or Edit, never both");
  const lock = code("app/src/components/SetupLock.jsx");
  ok(/if \(locked\)/.test(lock), "the control picks one of the two");
});

s.test("SC-02", "locking is a state of the screen and writes nothing", () => {
  /* Pressing Edit must not touch the record. The record changes when the keeper
     saves and at no other moment. */
  const setup = code("app/src/components/Setup.jsx");
  for (const m of setup.matchAll(/onEdit=\{([^}]*)\}/g)) {
    ok(!/onSaveConfig|saveFacts|saveStrength|record/.test(m[1]),
      `Edit writes nothing: ${m[1]}`);
  }
  const lock = code("app/src/components/SetupLock.jsx");
  ok(!/onSaveConfig|store\./.test(lock), "and the control itself reaches no store");
});

s.test("SC-03", "the delivered dose is deliberately not locked", () => {
  /* It is the one field designed to be used again and again, and it already
     answers the question locking exists to answer — a toast, an entry in the
     history beneath it, and the dose-change moment. */
  const setup = code("app/src/components/Setup.jsx");
  const doseBlock = setup.slice(setup.indexOf("<DeliveredDoseField"), setup.indexOf("<DeliveredDoseField") + 200);
  ok(!/locked/.test(doseBlock), "no lock on the delivered dose");
});

s.test("SC-04", "a short number gets a short box", () => {
  /* FINDING 17, and the reviewer's rule: oversized is as much a finding as
     undersized. */
  const dose = code("app/src/components/DoseExpectation.jsx");
  ok(/shortInputCls/.test(dose), "there is a width for a short number");
  ok(/inputCls\.replace\("w-full", "w-24"\)/.test(dose),
    "and it REPLACES the full width rather than being added beside it");
  const setup = code("app/src/components/Setup.jsx");
  ok(/shortInputCls/.test(setup), "the volume and the pump step use it");
  /* Two width classes on one element is a coin toss — Tailwind emits both and
     the later one in the STYLESHEET wins, not the later one in the attribute. */
  ok(!/\$\{inputCls\} w-24/.test(setup), "and neither carries two widths at once");
});

s.test("SC-05", "the range bar grades its own width, at the owner's thresholds", () => {
  /* FINDING 18. The three widths are the OWNER'S, stated by him for alkalinity
     in dKH. Boundaries included: 0.5 is acceptable, not tight; 1.0 is
     acceptable, not loose. */
  eq(gradeWidth(0.49, true).key, "tight", "under a half");
  eq(gradeWidth(0.5, true).key, "fair", "exactly a half");
  eq(gradeWidth(1.0, true).key, "fair", "exactly one");
  eq(gradeWidth(1.01, true).key, "loose", "over one");
});

s.test("SC-06", "the bar refuses to grade a parameter the thresholds were not stated for", () => {
  /* They are not canon figures and do not transfer to calcium or magnesium.
     A grade nobody decided is worse than no grade. */
  eq(gradeWidth(0.4, false), null, "ungraded unless the caller says so");
  const slider = code("app/src/components/RangeSlider.jsx");
  ok(/graded = false/.test(slider), "and the default is not to grade");
  const rule = code("app/src/present/range-grade.js");
  ok(!/CA|MG|calcium|magnesium/i.test(rule), "and the rule names no parameter it was not stated for");
});

s.test("SC-07", "the handles cannot cross", () => {
  const slider = code("app/src/components/RangeSlider.jsx");
  ok(/Math\.min\(v, hi - step\)/.test(slider), "the low handle stops below the high one");
  ok(/Math\.max\(v, lo \+ step\)/.test(slider), "and the high one above the low");
});

s.test("SC-08", "reefkeeping units, on every parameter that has one", () => {
  /* FINDING 24. Chemically mg/L and ppm are the same quantity in seawater; one
     of them is the word on the test kit. */
  const unit = (k) => PARAMETERS.find((p) => p.key === k).unit;
  for (const k of ["CA", "MG", "NO3", "PO4", "K"]) eq(unit(k), "ppm", `${k} is ppm`);
  eq(unit("ALK"), "dKH", "alkalinity stays dKH");
  eq(unit("SAL"), "ppt", "salinity stays ppt");
  eq(unit("PH"), "", "pH has no unit at all");
});

s.test("SC-09", "no parameter is shown in mg/L anywhere", () => {
  for (const p of PARAMETERS) {
    ok(p.unit !== "mg/L" && p.unit !== "µg/L", `${p.key} is not ${p.unit}`);
  }
});

s.test("SC-10", "changing the unit changed no stored number", () => {
  /* A label, not a conversion. If this were a conversion the keeper's imported
     history would silently become a thousand times wrong. */
  const ledger = code("app/src/store/ledger.js");
  const from = ledger.indexOf("export const PARAMETERS");
  const table = ledger.slice(from, ledger.indexOf("]);", from));
  ok(!/\b(scale|factor|multiplier|convert)\b/i.test(table),
    "no parameter carries a scaling factor beside its unit");
  ok(!/\b1000\b/.test(table), "and no thousand anywhere near it");
  /* And the values themselves are untouched by any of it. */
  for (const p2 of PARAMETERS) {
    ok(!("scale" in p2) && !("factor" in p2), `${p2.key} carries no conversion`);
  }
});

export default s;
