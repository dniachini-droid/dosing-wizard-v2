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
import { fmtWithUnit } from "../../app/src/lib/format.js";
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

s.test("SC-11", "the handle with room to move is the one the thumb lands on", () => {
  /* REEFKEEPER FINDING 12. One step apart, the two 26px thumbs sit on top of
     one another and the one later in the document takes the touch. Dragged up
     against the ceiling together, the high handle can go no further right, the
     low one blocks it going left, and the low one is underneath: the bar is
     stuck, and leaving the screen is the only way out.

     The rule cannot be a constant — a constant is a bar that is stuck at one
     end or the other. It has to depend on where the pair sits in the travel. */
  const slider = code("app/src/components/RangeSlider.jsx");
  const decl = /const loOnTop = ([^;]+);/.exec(slider);
  ok(decl, "which handle is on top is decided");
  const rule = decl[1].replace(/\s+/g, " ").trim();
  eq(rule, "lo > floor + span / 2",
    `on top past the middle of the travel, where the left of the bar is its room: got "${rule}"`);
  /* And both inputs actually carry it, in opposite directions. A z-index on one
     of them only is the same bug with an extra line. */
  ok(/zIndex: loOnTop \? 3 : 2/.test(slider), "the low handle rises past the middle");
  ok(/zIndex: loOnTop \? 2 : 3/.test(slider), "and the high one falls at the same moment");
});

s.test("SC-12", "a figure and its unit are not run together", () => {
  /* REEFKEEPER FINDING 22. `9.10dKH`. `0.20dKH spread`. `usually
     8.90–9.20dKH`. The same application writes `9.10 dKH` correctly in more
     than a dozen sentences in `strings.js`, so the decision had been taken —
     it lived in the sentences and the markup never learned it.

     It has one owner now, and the owner handles the case hand-written spacing
     gets wrong: pH has no unit, and a trailing space pushes a centred figure
     off centre. */
  eq(fmtWithUnit({ decimals: 2, unit: "dKH" }, 9.1), "9.10 dKH", "a space, always");
  eq(fmtWithUnit({ decimals: 0, unit: "ppm" }, 430), "430 ppm", "for every unit");
  eq(fmtWithUnit({ decimals: 2, unit: "" }, 8.2), "8.20", "and nothing trailing where there is no unit");
  eq(fmtWithUnit({ decimals: 2, unit: "dKH" }, null), "\u2014", "and no unit on an em dash");

  /* And no surface may spell it out for itself again. */
  for (const rel of ["app/src/components/Dashboard.jsx",
                     "app/src/components/AllParametersSheet.jsx",
                     "app/src/components/ReadingConfirmation.jsx"]) {
    const src = code(rel);
    /* BOTH SPELLINGS. The first version of this check looked only for the JSX
       one and went green while three template literals on the same screens —
       `target range 8.60–9.20dKH`, `0.30dKH spread` — still ran them together.
       A screenshot found them; the check had not. */
    const run = [
      ...src.matchAll(/\}\{(?:def|p)\.unit\}/g),
      ...src.matchAll(/\}\$\{(?:def|p)\.unit\}/g),
    ].map((m) => m[0]);
    eq(run.join(", "), "", `${rel} runs a figure into its unit`);
  }
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
