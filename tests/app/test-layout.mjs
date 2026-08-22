/* ============================================================================
   THE SCREEN IS AS TALL AS THE SCREEN — OWNER FINDINGS 21, 7, 22 AND 6
   ----------------------------------------------------------------------------
   Four faults, reported separately, with one cause between them: every layout
   rule in the app measured itself in `vh`, and `vh` is not the height of the
   screen.

   `100vh` is the LARGE viewport — the page's height if the browser's toolbars
   were hidden. With the toolbar showing it is taller than what the keeper can
   see. `100dvh` tracks the toolbar but is not live: iOS does not reflow while
   the toolbar slides, so a shell measured in `dvh` is right before a gesture
   and right after it and wrong during it. That is why the bar "is sometimes
   correct" and why a scroll is the only thing that moves it.

   And a sheet at `85vh` is taller than 85% of the screen, so its lower portion
   is off the bottom with nothing to scroll to reach it. The tab bar was never
   drawn in front of the sheet — the sheet was taller than the screen. Findings
   7 and 22 are one rule, exactly as the owner said.

   These are the source-level halves. The behaviour itself is checked in a
   browser by `tools/app/check-viewport.mjs`, which drives a real Chromium at a
   phone viewport, changes the visible height the way a toolbar does, and
   watches the bar and the sheets. Neither half is sufficient alone: the scan
   cannot see a layout and the browser check cannot see a rule creeping back
   into a file it does not open.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import { APP_NAV_H, APP_VH, watchViewport } from "../../app/src/lib/viewport.js";

const s = suite("layout");
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const SHEETS = [
  "app/src/components/Dashboard.jsx",
  "app/src/components/AllParametersSheet.jsx",
  "app/src/components/CorrectReadingSheet.jsx",
  "app/src/lib/backup.jsx",
];

s.test("VP-01", "no sheet sizes itself in vh", () => {
  /* FINDINGS 7 AND 22. `max-h-[85vh]`, `[88vh]`, `[92vh]` — three spellings of
     one mistake, each of them taller than the screen on a phone. */
  for (const rel of SHEETS) {
    const code = read(rel).replace(/\/\*[\s\S]*?\*\//g, "");
    /* Every spelling of the same mistake, not only Tailwind's `max-h-[85vh]`:
       an inline `style={{ maxHeight: "85vh" }}` and a fixed `h-[85vh]` put the
       sheet off the bottom of the screen just as surely. */
    const found = [
      ...code.matchAll(/\bh-\[\d+(?:\.\d+)?vh\]/g),
      ...code.matchAll(/max-h-\[\d+(?:\.\d+)?vh\]/g),
      ...code.matchAll(/(?:max-?[Hh]eight|height)\s*:\s*["'`]?\s*\d+(?:\.\d+)?vh/g),
    ].map((m) => m[0]);
    eq(found.join(", "), "", `${rel} measures a sheet in vh`);
  }
});

s.test("VP-02", "every sheet is bounded by the one rule", () => {
  /* One class, one measurement. A sheet that opts out is a sheet that will be
     unreachable on somebody's phone. */
  for (const rel of SHEETS) {
    const code = read(rel);
    if (!/fixed inset-0/.test(code)) continue;
    ok(/sheet-panel/.test(code), `${rel} bounds its panel`);
    ok(/sheet-layer/.test(code), `${rel} bounds the layer the panel sits in`);
  }
});

s.test("VP-03", "the sheet rules are measured against the visible viewport and the bar", () => {
  const app = read("app/src/App.jsx");
  const panel = app.slice(app.indexOf(".sheet-panel"), app.indexOf(".sheet-layer"));
  ok(panel.includes("var(--app-vh"), "a sheet's height comes from the visible viewport");
  ok(panel.includes("var(--app-nav-h"), "and leaves the tab bar's row clear");
  const layer = app.slice(app.indexOf(".sheet-layer"));
  ok(layer.includes("var(--app-nav-h"), "and so does the layer it is centred in");
});

s.test("VP-04", "the shell keeps a fallback for every browser, most-preferred last", () => {
  /* Three declarations of one property. A browser with no `dvh` takes the
     first; one with `dvh` and no `visualViewport` takes the second; everything
     else takes the live measurement. Order is the whole mechanism, and getting
     it backwards is what round four's `min-h-screen` did. */
  const app = read("app/src/App.jsx");
  const rule = app.slice(app.indexOf(".app-shell {"), app.indexOf(".app-shell {") + 200);
  const heights = [...rule.matchAll(/height:\s*([^;]+);/g)].map((m) => m[1].trim());
  eq(heights.length, 3, `three declarations, got ${JSON.stringify(heights)}`);
  eq(heights[0], "100vh", "the oldest fallback first");
  eq(heights[1], "100dvh", "then the dynamic viewport");
  ok(heights[2].startsWith("var(--app-vh"), "and the live measurement last, so it wins");
  ok(/overflow:\s*hidden/.test(rule), "and the document itself never scrolls");
});

s.test("VP-05", "nothing sets a minimum height on the shell", () => {
  /* Round four's own finding, kept: a `min-height` is not a fallback for a
     `height`, it is a FLOOR, and it wins. `min-h-screen` forced the shell past
     the visible viewport and put the bar below the fold. */
  const app = read("app/src/App.jsx");
  const shell = app.slice(app.indexOf('className="bg-app text-ink font-body'), app.indexOf(".bg-app { background-color"));
  ok(!/min-h-screen/.test(shell), "the shell carries no min-height");
});

s.test("VP-06", "the watcher listens for the toolbar's travel, not only for a resize", () => {
  /* The load-bearing half. iOS reports the toolbar sliding as the visual
     viewport SCROLLING inside the layout viewport, not as a resize, so a
     listener on `resize` alone misses the entire gesture the owner described. */
  const code = read("app/src/lib/viewport.js").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(/addEventListener\("resize"/.test(code), "resize");
  ok(/addEventListener\("scroll"/.test(code), "and scroll");
  ok(/orientationchange/.test(code), "and a turn of the phone");
});

s.test("VP-07", "the watcher is harmless where there is no window, and undoes itself", () => {
  /* The app's own tests are Node and nothing else. A layout helper that threw
     here would take the suite with it. */
  const stop = watchViewport();
  eq(typeof stop, "function", "it hands back a way to stop");
  stop();
  eq(APP_VH, "--app-vh", "the property the stylesheet reads");
  eq(APP_NAV_H, "--app-nav-h", "and the bar's own");
});

s.test("VP-08", "the bar's height is measured, never written down", () => {
  /* A number typed into the stylesheet would be a second statement of the
     bar's height, and the day its padding changed the two would disagree —
     `MASTER RULE 1`'s shape, in a layout. It is also the only way to get zero
     on a screen wide enough that the bar is not rendered at all. */
  const code = read("app/src/lib/viewport.js").replace(/\/\*[\s\S]*?\*\//g, "");
  ok(/nav\[data-app-nav\]/.test(code), "the bar is found in the document");
  ok(/offsetHeight/.test(code), "and measured");
  const app = read("app/src/App.jsx");
  ok(/data-app-nav/.test(app), "and the bar carries the mark that finds it");
});

s.test("VP-09", "the close control on a sheet is pinned outside the scrolling content", () => {
  /* FINDING 6, reported twice. A control inside the box that scrolls goes with
     it. It sits against the sheet's positioned wrapper instead. */
  const close = read("app/src/components/SheetClose.jsx");
  ok(/absolute/.test(close), "the control is positioned against the sheet");
  const dash = read("app/src/components/Dashboard.jsx");
  const modal = dash.slice(dash.indexOf("export function ParamHistoryModal"));
  const wrapper = modal.indexOf("relative");
  const closeAt = modal.indexOf("<SheetClose");
  const scroller = modal.indexOf("sheet-panel");
  ok(wrapper >= 0 && closeAt > wrapper, "inside a positioned wrapper");
  ok(closeAt < scroller, "and outside the box that scrolls");
});

export default s;
