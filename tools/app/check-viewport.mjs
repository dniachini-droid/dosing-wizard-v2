/* ============================================================================
   THE BROWSER CHECK — OWNER FINDINGS 21, 7, 22 AND 6
   ----------------------------------------------------------------------------
       node tools/app/check-viewport.mjs

   Round three reported the tab bar fixed. Round four reported it fixed again,
   with a specific diagnosis. It was still broken, and both times it had been
   verified by reading the code and by tests that never opened a window.

   So this drives a real browser at a real phone viewport and looks. It starts
   the dev server itself, loads the app, changes the VISIBLE height the way a
   phone's toolbar does as you scroll, and after every change asks the only
   questions that matter:

     · is the bottom of the tab bar the bottom of the screen, or below it?
     · is the bottom of an open sheet above the tab bar, or behind it?
     · is a sheet's close control still on screen once its content has been
       scrolled to the end?

   It fails on the geometry, not on the stylesheet. A rule that produced the
   right numbers by some other route would pass, and a beautifully-worded rule
   that put the bar off the bottom would not.

   It needs Playwright and a Chromium. Where neither is installed it says so
   and exits 0 rather than failing — a machine without a browser has not
   discovered a defect, it has discovered that it has no browser. The
   application suite states the source-level half (`tests/app/test-layout.mjs`)
   and runs everywhere.
   ========================================================================= */

import { spawn } from "node:child_process";
import net from "node:net";

const PORT = Number(process.env.CHECK_PORT || 5199);
const BASE = `http://127.0.0.1:${PORT}/app/`;
/* Phone-sized. 390x844 is the shape most of the owner's reports come from. */
const WIDTH = 390;
const TALL = 844;
/* What the visible height falls to as the toolbar slides in. The exact figures
   do not matter; that the layout follows them does. */
const HEIGHTS = [TALL, 780, 712, 668, TALL];

const failures = [];
const note = (line) => process.stdout.write(`  ${line}\n`);
function check(condition, what) {
  if (condition) note(`[PASS] ${what}`);
  else { failures.push(what); note(`[FAIL] ${what}`); }
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIPPED: playwright is not installed here.");
  console.log("The source-level half of these checks is in tests/app/test-layout.mjs.");
  process.exit(0);
}

async function waitForPort(port, ms) {
  const until = Date.now() + ms;
  for (;;) {
    const open = await new Promise((resolve) => {
      const sock = net.connect({ port, host: "127.0.0.1" });
      sock.on("connect", () => { sock.destroy(); resolve(true); });
      sock.on("error", () => resolve(false));
    });
    if (open) return true;
    if (Date.now() > until) return false;
    await new Promise((r) => setTimeout(r, 200));
  }
}

const server = spawn("npx", ["vite", "--port", String(PORT), "--strictPort"], {
  stdio: "ignore", detached: true,
});
let browser;
try {
  if (!(await waitForPort(PORT, 60000))) throw new Error("the dev server did not start");

  browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: TALL }, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 120000 });
  await page.waitForSelector("nav[data-app-nav]", { timeout: 60000 });
  await page.waitForTimeout(1500);

  /* A tank to look at, written through the application's own store so this
     check exercises the real screens rather than an empty state. A sheet with
     nothing in it would not be tall enough to show the fault it is here for. */
  await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { applySeries, parseSeries } = await import("/app/src/store/seed.js");
    const store = createStore();
    const day = (back) => new Date(Date.now() - back * 86400000).toISOString().slice(0, 10);
    let cfg = await store.config.current();
    if (!cfg) {
      cfg = await store.config.append({
        netVolumeL: 77, targetRangeMinDkh: 8.6, targetRangeMaxDkh: 9.2,
        selectedPotencyDkhPerMl: 0.0693, potencyStatedAs: "DKH_PER_ML",
        potencyStatedValue: 0.0693, recommendationPrecisionMlPerDay: 0.1,
      }, new Date(Date.now() - 400 * 86400000).toISOString());
    }
    const text = [
      `${day(60)} dose 8.8`, `${day(49)} 09:05 alk 8.8`, `${day(42)} 09:15 alk 8.9`,
      `${day(28)} 09:20 alk 9.0`, `${day(14)} 09:10 alk 9.0`, `${day(3)} 09:05 alk 9.0`,
    ].join("\n");
    const parsed = parseSeries(text);
    if (!parsed.problems.length) await applySeries(store, parsed.rows, { config: cfg });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("nav[data-app-nav]", { timeout: 60000 });
  await page.waitForTimeout(2500);

  const navBox = () => page.locator("nav[data-app-nav]").first().boundingBox();

  /* --- FINDING 21: the bar, through the toolbar's whole travel ---------- */
  console.log("\nThe tab bar, as the toolbar comes and goes");
  for (const h of HEIGHTS) {
    await page.setViewportSize({ width: WIDTH, height: h });
    await page.waitForTimeout(350);
    const bar = await navBox();
    const bottom = Math.round(bar.y + bar.height);
    check(bottom === h, `at ${h}px the bar ends at the bottom of the screen (ends at ${bottom})`);
    check(Math.round(bar.y) >= 0, `and its top is on screen at ${h}px`);
  }

  /* --- FINDINGS 7 AND 22: a sheet's lower portion ----------------------- */
  console.log("\nA sheet, at the shortest viewport");
  await page.setViewportSize({ width: WIDTH, height: 668 });
  await page.waitForTimeout(400);
  await page.getByText("Alkalinity", { exact: true }).first().click();
  await page.waitForTimeout(1200);

  const panel = page.locator(".sheet-panel").first();
  check(await panel.count() > 0, "the sheet is bounded by the shared rule");
  if (await panel.count()) {
    const box = await panel.boundingBox();
    const bar = await navBox();
    check(Math.round(box.y + box.height) <= Math.round(bar.y),
      `the sheet ends above the bar (${Math.round(box.y + box.height)} vs ${Math.round(bar.y)})`);
    check(Math.round(box.y) >= 0, "and starts on screen");

    /* The bottom of the sheet must be REACHABLE, which is the thing the owner
       could not do. Scroll its content to the end and check the last control
       in it is on screen and is the thing under the finger. */
    await panel.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(500);
    const reach = await page.evaluate(() => {
      const el = document.querySelector(".sheet-panel");
      const controls = [...el.querySelectorAll("button, input, a")]
        .filter((c) => c.offsetParent !== null);
      const last = controls[controls.length - 1];
      if (!last) return { ok: false, why: "no control in the sheet" };
      const r = last.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        ok: r.bottom <= window.innerHeight && !!top && (top === last || last.contains(top) || top.contains(last)),
        why: `bottom ${Math.round(r.bottom)} of ${window.innerHeight}, under it: ${top ? top.tagName : "nothing"}`,
      };
    });
    check(reach.ok, `the last control in the sheet can be reached and tapped — ${reach.why}`);

    /* --- FINDING 6: the close control, after scrolling ------------------ */
    console.log("\nThe close control, after the sheet has been scrolled to its end");
    const closeSeen = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")]
        .find((b) => (b.getAttribute("aria-label") || "").startsWith("Close"));
      if (!btn) return { ok: false, why: "no close control" };
      const r = btn.getBoundingClientRect();
      const top = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
      return {
        ok: r.top >= 0 && r.bottom <= window.innerHeight
          && !!top && (top === btn || btn.contains(top)),
        why: `top ${Math.round(r.top)}, under it: ${top ? top.tagName : "nothing"}`,
      };
    });
    check(closeSeen.ok, `it is still on screen and still tappable — ${closeSeen.why}`);
  }
} catch (e) {
  failures.push(`the check itself failed: ${e && e.message}`);
  note(`[FAIL] ${e && e.message}`);
} finally {
  if (browser) await browser.close().catch(() => {});
  try { process.kill(-server.pid); } catch { /* already gone */ }
}

console.log("\n==========================================================");
if (failures.length) {
  console.log(`RESULT: RED — ${failures.length} failure(s)`);
  for (const f of failures) console.log(`  · ${f}`);
  process.exit(1);
}
console.log("RESULT: GREEN — the bar, the sheets and the close control all hold");
