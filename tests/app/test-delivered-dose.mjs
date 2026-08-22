/* ============================================================================
   THE DELIVERED DOSE — ONE FIELD, ONE PATH, THREE WAYS IN
   ----------------------------------------------------------------------------
   Owner finding 19, and the owner's own framing of it.

   Setup carried three things for a single act: "what your pump is running now",
   a history, and a "record a dose change" form with FROM and TO. They wrote two
   different kinds of record and neither knew about the other, so the keeper
   typed 9.0, was told it was saved, and read "on record: 8.8 mL/day"
   underneath it. The history then listed 8.8 above 9.0 on a list headed newest
   first.

   The design, decided: one field. It is not a setup field — it is the dose the
   pump is delivering. Filled the first time it establishes the dose; filled
   again it records a change. The keeper never types either half of a change:
   the "to" is what he just typed and the "from" is what the record already
   holds. Three surfaces reach it and there is no second code path for any of
   them; what differs is one field saying where the figure came from.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import { DOSE_ORIGIN, originOf } from "../../app/src/present/dose-origin.js";

const s = suite("delivered dose");
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const code = (rel) => read(rel).replace(/\/\*[\s\S]*?\*\//g, "").replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

s.test("DD-01", "the FROM/TO form is gone from Setup entirely", () => {
  /* Not rearranged — gone. Asking the keeper to restate a figure the record
     already holds is asking him to get it wrong, and he did. */
  const setup = code("app/src/components/Setup.jsx");
  ok(!/From \(mL\/day\)/.test(setup), "no FROM field");
  ok(!/To \(mL\/day\)/.test(setup), "no TO field");
  ok(!/dcFrom|dcTo|submitDoseChange/.test(setup), "and none of its state survives");
});

s.test("DD-02", "Setup asks for the delivered dose once, through the shared field", () => {
  const setup = code("app/src/components/Setup.jsx");
  eq((setup.match(/<DeliveredDoseField/g) || []).length, 1, "one field on the screen");
  ok(/DoseHistory/.test(setup), "and the history beside it");
});

s.test("DD-03", "the Dosing tab uses the SAME field, not a second one", () => {
  /* Three ways in, one way through. A second implementation on the tab is how
     the two surfaces come to disagree about what the previous dose was. */
  const wiz = code("app/src/components/DosingWizard.jsx");
  ok(/DeliveredDoseField/.test(wiz), "the tab renders the shared field");
  ok(/onSetDeliveredDose/.test(wiz), "and writes through the shell's one path");
  ok(!/recordDoseChange|recordDoseState/.test(wiz), "and records nothing itself");
});

s.test("DD-04", "there is exactly one writer of a dose in the application", () => {
  const app = code("app/src/App.jsx");
  eq((app.match(/recordDoseChange\(/g) || []).length, 1, "one call that records a change");
  eq((app.match(/recordDoseState\(/g) || []).length, 1, "one that begins the record");
  /* Both inside the one path. */
  const fn = app.slice(app.indexOf("const setDeliveredDose"), app.indexOf("const addWaterChange"));
  ok(/recordDoseChange\(/.test(fn) && /recordDoseState\(/.test(fn),
    "and both are inside setDeliveredDose");
});

s.test("DD-05", "nothing on the dosing screens asks for the previous figure", () => {
  for (const rel of ["app/src/components/Setup.jsx", "app/src/components/DeliveredDose.jsx",
    "app/src/components/DosingWizard.jsx"]) {
    ok(!/fromMlPerDay/.test(code(rel)), `${rel} does not ask for a "from"`);
  }
});

s.test("DD-06", "where the figure came from is decided by the figure, not by the button", () => {
  /* A keeper who opens a recommendation, edits it and saves has adjusted a
     recommendation — on whichever surface he did it. */
  eq(originOf(9.0, 9.0), DOSE_ORIGIN.RECOMMENDATION, "saved as recommended");
  eq(originOf(9.0, 9.4), DOSE_ORIGIN.RECOMMENDATION_ADJUSTED, "recommended, then changed");
  eq(originOf(null, 9.4), DOSE_ORIGIN.KEEPER, "nothing recommended it");
});

s.test("DD-07", "a recommendation is not called adjusted because of a rounding tail", () => {
  /* The engine's figure carries more places than the screen shows. A keeper who
     accepted 9.00 exactly as offered must not be told he changed it. */
  eq(originOf(9.000000001, 9.0), DOSE_ORIGIN.RECOMMENDATION, "same figure at the shown precision");
});

s.test("DD-08", "the history is ordered by the ledger, never re-sorted by date", () => {
  /* FINDING 19's second half. Two changes made on one day compare equal on the
     date, so a date sort left them in storage order — oldest at the top of a
     list headed "newest first". */
  const setup = code("app/src/components/Setup.jsx");
  ok(!/\.sort\(\(a, b\) => \(a\.date/.test(setup), "Setup forms no second opinion about order");
  const app = code("app/src/App.jsx");
  ok(/doseChangesNewestFirst = useMemo\(\(\) => \[\.\.\.doseChanges\]\.reverse\(\)/.test(app),
    "the shell reverses the ledger's own order");
  ok(/doseChanges=\{doseChangesNewestFirst\}/.test(app), "and that is what Setup is given");
});

s.test("DD-09", "the first dose and every change after it are stamped the same way", () => {
  /* Stamping the first from the clock and the rest from the form put two
     precisions on one timeline: a standing dose carrying seconds sorted AFTER
     a change made a minute later, and the history read backwards. */
  const rec = code("app/src/lib/record.js");
  const fn = rec.slice(rec.indexOf("export async function recordDoseState"));
  ok(/date && atTime/.test(fn), "the keeper's own date and time are used where he gave them");
  ok(/stamp\(date, atTime\)/.test(fn), "through the same stamp a dose change takes");
  const app = code("app/src/App.jsx");
  ok(/recordDoseState\(store, \{ doseMlPerDay: toMlPerDay, date, atTime: time \}\)/.test(app),
    "and the one write path passes them");
});

s.test("DD-10", "no dose change can be edited", () => {
  /* Delete it and enter it again with the right date — the same rule readings
     have. An edit would rewrite a fact about a moment. */
  const setup = code("app/src/components/Setup.jsx");
  ok(!/onEditDose|editDoseChange/.test(setup), "no edit control");
  ok(/dose\.history\.noEdit/.test(setup), "and the screen says so");
});

s.test("DD-11", "the two explanatory notes are gone, and nothing here says \"the app\"", () => {
  /* Both said "the app", which the register forbids, and the first did not make
     sense as written. */
  const strings = read("app/src/strings.js");
  const block = strings.slice(strings.indexOf('"dose.delivered.head"'), strings.indexOf('"dose.change.close"'));
  ok(!/the app\b/i.test(block), `no observer in the delivered-dose wording: ${block.match(/the app[^"]*/i) || ""}`);
  const setup = code("app/src/components/Setup.jsx");
  ok(!/that way the app knows/i.test(setup), "the first note is gone");
  ok(!/the response is measured from the moment the change took effect, so a change made/i.test(setup),
    "and so is the second");
});

s.test("DD-12", "where the figure came from is history, and never reaches the engine", () => {
  /* It records the keeper's decision. An input the engine reads would make his
     choice of button change his chemistry. */
  const ledger = code("app/src/store/ledger.js");
  const build = ledger.slice(ledger.indexOf("export function toEngineEvents"));
  ok(!/origin/.test(build), "toEngineEvents names no origin");
  const rec = code("app/src/lib/record.js");
  ok(/origin,/.test(rec), "but the record keeps one");
});

export default s;
