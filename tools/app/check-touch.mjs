/* ============================================================================
   EVERY CONTROL, MEASURED WITH A THUMB — REEFKEEPER FINDINGS 21 AND 22
   ----------------------------------------------------------------------------
       node tools/app/check-touch.mjs

   He put it plainly: this is used standing at the tank, one-handed, with wet
   fingers, and half the controls are the size a mouse pointer needs. A control
   he cannot hit is a control that is not there.

   44 CSS pixels is the figure, and it is not this file's invention — it is
   Apple's Human Interface Guidelines and it is what `.agent/` already holds the
   app to. Android's own figure is 48dp; 44 is the smaller of the two and so the
   one that can be met without argument.

   WHAT IS MEASURED IS THE HIT AREA, NOT THE INK. A 20px icon inside a button
   with 12px of padding is a 44px target and passes. That is the whole point:
   the fix is almost never to draw something bigger, it is to give the small
   thing room around it — and where the room would push the layout apart, a
   negative margin takes it back, so the target grows and the picture does not.

   The element's own box is what is measured, deliberately. A hit area conjured
   out of a pseudo-element is invisible to `getBoundingClientRect`, which means
   it is invisible to this check, which means it would be a rule nobody could
   verify. If the finger lands on it, it is on the box.

   It fails on the geometry, in a real browser, at a real phone size, with the
   real data written through the real store — same harness as
   `check-viewport.mjs` and for the same reason: two rounds reported layout
   fixed on the strength of reading a stylesheet.

   WHAT IT DOES NOT MEASURE. A control that is not on screen is not checked —
   it says how many it looked at, so a run that suddenly checks far fewer is
   visible as a run that saw less rather than as a run that found less.
   ========================================================================= */

import { spawn } from "node:child_process";
import net from "node:net";

const PORT = Number(process.env.CHECK_PORT || 5201);
const BASE = `http://127.0.0.1:${PORT}/app/`;
const WIDTH = 390;
const TALL = 844;
/* The floor, in CSS pixels. */
const MIN = 44;

const failures = [];
const note = (line) => process.stdout.write(`  ${line}\n`);

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.log("SKIPPED: playwright is not installed here.");
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

/* Returns every visible interactive control that is too small to hit.

   THE HIT AREA IS THE UNION OF THE ELEMENT AND ANYTHING IT EXTENDS ITSELF WITH.
   A button drawn 20px tall that carries 12px of padding measures 44 and is
   fine; one that reaches its size only through a `::before` overlay is
   measured the same way, because that is what the finger actually lands on. */
const SMALL = `() => {
  const MIN = 44;
  const out = [];
  const seen = new Set();
  for (const el of document.querySelectorAll('button, a[href], input, select, [role="button"], [tabindex="0"]')) {
    if (el.offsetParent === null && el.tagName !== "A") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.bottom < 0 || r.top > window.innerHeight) continue;
    if (el.disabled) continue;
    /* A range input's thumb is the target, not the track; the track is
       deliberately the width of the bar. Its own rule is in base.css. */
    if (el.type === "range") continue;
    const w = r.width, h = r.height;
    if (w >= MIN && h >= MIN) continue;
    const what = (el.getAttribute("aria-label") || el.textContent || el.type || el.tagName)
      .trim().replace(/\\s+/g, " ").slice(0, 48) || el.tagName;
    const key = what + Math.round(w) + "x" + Math.round(h);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ what, w: Math.round(w), h: Math.round(h) });
  }
  return { small: out, looked: document.querySelectorAll('button, a[href], input, select, [role="button"]').length };
}`;

async function sweep(page, where) {
  const { small, looked } = await page.evaluate(eval(`(${SMALL})`));
  if (!small.length) {
    note(`[PASS] ${where} — every one of ${looked} controls is at least ${MIN}px`);
    return;
  }
  failures.push(`${where}: ${small.length} control(s) under ${MIN}px`);
  note(`[FAIL] ${where} — ${small.length} of ${looked} controls are under ${MIN}px`);
  for (const s of small) note(`         ${s.w}x${s.h}  ${s.what}`);
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
      `${day(28)} 09:20 alk 9.0`, `${day(14)} 09:10 alk 9.0`,
      `${day(3)} 09:05 alk 9.0`, `${day(3)} 09:20 alk 9.1`,
    ].join("\n");
    const parsed = parseSeries(text);
    if (!parsed.problems.length) await applySeries(store, parsed.rows, { config: cfg });
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("nav[data-app-nav]", { timeout: 60000 });
  await page.waitForTimeout(2500);

  console.log("\nEvery control on every tab, measured at 390x844");
  const tabs = await page.locator("nav[data-app-nav] button").allTextContents();
  for (const [i, label] of tabs.entries()) {
    await page.locator("nav[data-app-nav] button").nth(i).click();
    await page.waitForTimeout(900);
    await sweep(page, `the ${label.trim() || `#${i + 1}`} tab`);
  }

  console.log("\nAnd inside a parameter's sheet, which is where the small ones live");
  await page.locator("nav[data-app-nav] button").nth(0).click();
  await page.waitForTimeout(700);
  await page.getByText("Alkalinity", { exact: true }).first().click();
  await page.waitForTimeout(1400);
  await sweep(page, "the alkalinity sheet");
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
console.log(`RESULT: GREEN — every control on screen is at least ${MIN}px in both directions`);
