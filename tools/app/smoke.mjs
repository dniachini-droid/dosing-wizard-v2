/* Drive the real application in a real browser.
 *
 * This is a development aid, not a committed gate: it needs Playwright and a
 * Chromium, which the repository does not depend on. `tests/app/` holds the
 * tests that run with nothing but Node.
 *
 *   NODE_PATH=/path/to/global/node_modules node tools/app/smoke.mjs
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

const TYPES = {
  ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json",
  ".wasm": "application/wasm", ".html": "text/html", ".css": "text/css",
  ".zip": "application/zip", ".md": "text/plain", ".py": "text/plain",
  ".svg": "image/svg+xml", ".png": "image/png", ".webmanifest": "application/manifest+json",
};

const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => {
    if (e) { res.writeHead(404); return res.end("not found"); }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(p)] || "application/octet-stream" });
    res.end(b);
  });
});

const PORT = 8242;
await new Promise((r) => server.listen(PORT, r));
const base = `http://localhost:${PORT}/app/index.html`;

const { chromium } = require("playwright");
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium-1194/chrome-linux/chrome" });
const ctx = await browser.newContext();
const page = await ctx.newPage();

const errors = [];
page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

const step = async (name, fn) => {
  process.stdout.write(`  ${name} … `);
  try { await fn(); console.log("ok"); }
  catch (e) { console.log("FAILED\n      " + e.message); errors.push(`${name}: ${e.message}`); }
};

console.log("\nFirst run, no data at all");
await page.goto(base);
await page.waitForSelector("h1");

await step("lands on setup", async () => {
  const t = await page.textContent("h1");
  if (!/Set up your tank/.test(t)) throw new Error(`title was “${t}”`);
});

await step("refuses to save an empty fact", async () => {
  await page.click("text=Save and start");
  const hint = await page.textContent(".card .hint:last-of-type, .card .hint");
  if (!/needed|guess/i.test(await page.innerText("#app"))) throw new Error("no refusal shown");
});

await step("accepts the tank facts", async () => {
  const inputs = await page.$$(".card .field .input");
  const vals = ["77", "8.6", "9.2", "0.0693", "0.1"];
  for (let i = 0; i < vals.length; i++) await inputs[i].fill(vals[i]);
  await page.click("text=Save and start");
  await page.waitForSelector("h1:has-text('Today')", { timeout: 20000 });
});

await step("says the engine is starting rather than showing a blank", async () => {
  const txt = await page.innerText("#app");
  if (!/Working it out|Not enough|Alkalinity/.test(txt)) throw new Error("no engine state rendered");
});

await step("five tabs, Tools disabled", async () => {
  const tabs = await page.$$eval("#tabbar .tab", (n) => n.map((x) => x.textContent.trim()));
  if (tabs.length !== 5) throw new Error(`saw ${tabs.length} tabs: ${tabs}`);
  const off = await page.$("#tabbar .tab.off");
  if (!off) throw new Error("Tools is not marked disabled");
});

console.log("\nThe first reading");
await step("Test Lab logs one, and the moment plays", async () => {
  await page.click("#tabbar .tab:has-text('Test Lab')");
  await page.waitForSelector("h1:has-text('Test Lab')");
  await page.click(".card .seg .opt:has-text('Now')");
  const row = await page.$(".labrow:has-text('Alkalinity')");
  await (await row.$(".labentry .input")).fill("8.70");
  await (await row.$(".labentry .btn")).click();
  await page.waitForSelector(".moment", { timeout: 10000 });
});

await step("moment shows the value and closes", async () => {
  const txt = await page.innerText(".moment");
  if (!/8\.7/.test(txt)) throw new Error("value not shown: " + txt.slice(0, 120));
  await page.click(".moment");
  await page.waitForSelector(".moment", { state: "detached", timeout: 8000 }).catch(async () => {
    await page.evaluate(() => document.querySelector(".moment")?.remove());
  });
});

await step("the reading survives a hard reload", async () => {
  await page.reload();
  await page.waitForSelector("h1", { timeout: 20000 });
  await page.click("#tabbar .tab:has-text('History')");
  await page.waitForSelector("h1:has-text('History')");
  const txt = await page.innerText("#app");
  if (!/8\.70/.test(txt)) throw new Error("the reading is gone after reload");
});

console.log("\nA full series and an assessment");
await step("logs a series and the engine answers", async () => {
  await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { exactInstant } = await import("/app/src/store/time.js");
    const { KIND } = await import("/app/src/store/ledger.js");
    const s = createStore();
    await s.ledger.append({
      kind: KIND.DOSE_STATE, time: exactInstant("2026-07-01", "09:00", 600), recordedAt: new Date().toISOString(),
      /* Stated, not defaulted. `makeEvent` refuses a dose event that does not
         say how sure it is of its effective time, so this seed says it the way
         the dose-state form does. */
      detail: { doseMlPerDay: 9.0, effectiveAtConfidence: "EXACT" },
    });
    const days = [["2026-08-12", 9.02], ["2026-08-14", 8.94], ["2026-08-16", 8.86], ["2026-08-18", 8.78]];
    for (const [d, v] of days) {
      await s.ledger.append({
        kind: KIND.READING, parameter: "ALK", rawValue: String(v), normalizedValue: v, unit: "dKH",
        time: exactInstant(d, "07:40", 600), recordedAt: new Date().toISOString(),
      });
    }
  });
  await page.reload();
  await page.waitForSelector("h1:has-text('Today')", { timeout: 30000 });
  await page.waitForFunction(() => /dKH/.test(document.querySelector("#app").innerText), { timeout: 180000 });
});

await step("renders a recommendation from the engine", async () => {
  const txt = await page.innerText("#app");
  if (!/mL\/day|Hold|Not enough/.test(txt)) throw new Error("no recommendation rendered");
});

await step("no reason-code identifier is visible", async () => {
  const txt = await page.evaluate(() => {
    const clone = document.querySelector("#app").cloneNode(true);
    clone.querySelectorAll(".devview").forEach((n) => n.remove());
    return clone.innerText;
  });
  const leaks = txt.match(/\b[A-Z][A-Z0-9]*(_[A-Z0-9]+){2,}\b/g);
  if (leaks) throw new Error("contract vocabulary on screen: " + [...new Set(leaks)].join(", "));
});

await step("the assessment was stored with version stamps", async () => {
  const rec = await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const s = createStore();
    const r = await s.assessments.latest();
    return r && { id: r.assessmentId, e: r.engineVersion, c: r.canonVersion, cfg: r.configVersionId, n: r.inputEventCount };
  });
  if (!rec) throw new Error("no assessment stored");
  for (const k of ["e", "c", "cfg"]) if (!rec[k]) throw new Error(`${k} stamp missing`);
});

console.log("\nDate-only, and the record it makes");
await step("a date-only reading stores no time", async () => {
  const t = await page.evaluate(async () => {
    const { dateOnly } = await import("/app/src/store/time.js");
    const d = dateOnly("2026-08-15");
    return { p: d.timeProvenance, hasInstant: "absoluteInstant" in d, frozen: Object.isFrozen(d) };
  });
  if (t.p !== "DATE_ONLY" || t.hasInstant || !t.frozen) throw new Error(JSON.stringify(t));
});

await step("Today names the date-only reading in plain words", async () => {
  await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { dateOnly } = await import("/app/src/store/time.js");
    const { KIND } = await import("/app/src/store/ledger.js");
    const s = createStore();
    await s.ledger.append({
      kind: KIND.READING, parameter: "ALK", rawValue: "8.90", normalizedValue: 8.9, unit: "dKH",
      time: dateOnly("2026-08-15"), recordedAt: new Date().toISOString(),
    });
  });
  await page.reload();
  await page.waitForSelector("h1:has-text('Today')", { timeout: 30000 });
  await page.waitForFunction(() => /date but no time|Needs you/.test(document.querySelector("#app").innerText), { timeout: 120000 });
  const txt = await page.innerText("#app");
  if (!/date but no time/.test(txt)) throw new Error("date-only reading not surfaced");
});

console.log("\nThe suggested test");
/* A SUGGESTED TEST ONLY EXISTS AFTER A DOSE CHANGE.

   `TASKS-AND-SCHEDULING.md:47` scopes it there, so these steps have to walk
   the path a keeper actually walks: record the change, reassess, and take the
   offer the engine then makes. This used to drive the sheet from a routine
   cadence tick, which is not an offer and never was — the app raised one on
   every assessment, and this smoke test agreed with it. */
await step("a dose change produces a post-change retest, which IS an offer", async () => {
  const made = await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { exactInstant, todayLocal, addDays } = await import("/app/src/store/time.js");
    const { KIND } = await import("/app/src/store/ledger.js");
    const { runAssessment, nowAsOf } = await import("/app/src/assess.js");
    const { suggestionFrom } = await import("/app/src/store/suggestion.js");
    const s = createStore();
    const changedOn = addDays(todayLocal(), -1);
    await s.ledger.append({
      kind: KIND.DOSE_CHANGE,
      time: exactInstant(changedOn, "09:00", new Date().getTimezoneOffset() * -1),
      recordedAt: new Date().toISOString(),
      detail: { fromMlPerDay: 9.0, toMlPerDay: 9.4, effectiveAtConfidence: "EXACT" },
    });
    const res = await runAssessment(s, nowAsOf());
    const sug = suggestionFrom(res.engineResult);
    return {
      state: res.state,
      code: res.engineResult?.retest?.selectedReasonCode ?? null,
      has: !!sug,
      date: sug?.date ?? null,
    };
  });
  if (made.state !== "ASSESSED") throw new Error("the assessment did not run: " + made.state);
  if (!made.has) {
    throw new Error(`no offer after a dose change; the retest said ${made.code}`);
  }
});

await step("the suggestion offers replace or add, and names no other date", async () => {
  const shown = await page.evaluate(async () => {
    const { suggestionFrom, resolve, PREFERENCE } = await import("/app/src/store/suggestion.js");
    const { createStore } = await import("/app/src/store/index.js");
    const s = createStore();
    const rec = await s.assessments.latest();
    const sug = suggestionFrom(rec.engineResult);
    const r = resolve({
      suggestion: sug, tasks: await s.tasks.tasks(), completions: await s.tasks.completions(),
      today: new Date().toISOString().slice(0, 10), preference: PREFERENCE.ASK,
      declined: [], extras: [], applied: [],
    });
    return { has: !!sug, state: r.state };
  });
  if (!shown.has) throw new Error("the engine produced no suggestion to offer");
  if (shown.state !== "ASK" && shown.state !== "ALREADY_SCHEDULED") {
    throw new Error("unexpected state " + shown.state);
  }
});

await step("a ROUTINE cadence is not offered as a suggested test", async () => {
  /* The other half of the same rule, and the one that was wrong: a routine
     tick must produce NO offer at all. */
  const none = await page.evaluate(async () => {
    const { suggestionFrom } = await import("/app/src/store/suggestion.js");
    return suggestionFrom({
      retest: { recommendedAt: "2026-09-01T09:00:00Z", selectedReasonCode: "RETEST_ROUTINE_CADENCE" },
    });
  });
  if (none !== null) throw new Error("a routine cadence was offered as a suggestion");
});

await step("the prompt renders with both options and the why link", async () => {
  await page.evaluate(async () => {
    const { openSuggestionSheet } = await import("/app/src/screens/tasks.js");
    const { suggestionFrom, resolve, PREFERENCE } = await import("/app/src/store/suggestion.js");
    const { createStore } = await import("/app/src/store/index.js");
    const s = createStore();
    const rec = await s.assessments.latest();
    const sug = suggestionFrom(rec.engineResult);
    const r = resolve({
      suggestion: sug, tasks: [], completions: [],
      today: new Date().toISOString().slice(0, 10), preference: PREFERENCE.ASK,
      declined: [], extras: [], applied: [],
    });
    if (!r.suggestion) throw new Error("no suggestion to render a prompt for");
    window.__ctx = { store: s, state: { assessment: { engineResult: rec.engineResult } }, refresh() {} };
    openSuggestionSheet(window.__ctx, r);
  });
  await page.waitForSelector(".sheetwrap", { timeout: 8000 });
  const txt = await page.innerText(".sheetwrap");
  for (const want of ["Replace my next scheduled test", "Add it as an extra test", "Remember this", "Why "]) {
    if (!txt.includes(want)) throw new Error(`the prompt is missing "${want}": ` + txt.slice(0, 250));
  }
  if (/recommended/i.test(txt) === false) throw new Error("replace is not marked recommended");
});

await step("the why sheet renders the engine's own reasoning and no invented figure", async () => {
  await page.click(".sheetwrap .backlink");
  await page.waitForTimeout(800);
  const txt = await page.evaluate(() => {
    const all = document.querySelectorAll(".sheetwrap");
    return all[all.length - 1].innerText;
  });
  if (!/What decided it/.test(txt)) throw new Error("no reasoning shown: " + txt.slice(0, 200));
  if (!/is not shown/.test(txt)) throw new Error("the missing accumulated figure is not declared");
  await page.evaluate(() => document.querySelectorAll(".sheetwrap").forEach((n) => n.remove()));
});

console.log("\nOffline");
await step("the service worker registered", async () => {
  const ok = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.getRegistration();
    return !!r;
  });
  if (!ok) throw new Error("no service worker");
});

await step("opens offline and the data is there", async () => {
  await page.waitForTimeout(3000);
  await ctx.setOffline(true);
  await page.goto(base).catch(() => {});
  await page.waitForSelector("h1", { timeout: 30000 });
  await page.click("#tabbar .tab:has-text('History')");
  await page.waitForSelector("h1:has-text('History')");
  const txt = await page.innerText("#app");
  if (!/8\.7|8\.9/.test(txt)) throw new Error("readings missing offline");
  await ctx.setOffline(false);
});

console.log("\nTabs all render");
for (const tab of ["Today", "Test Lab", "Tasks", "History", "Tools"]) {
  await step(`${tab} renders`, async () => {
    await page.click(`#tabbar .tab:has-text('${tab}')`);
    await page.waitForTimeout(600);
    const txt = await page.innerText("#app");
    if (/This screen stopped/.test(txt)) throw new Error("crashed: " + txt.slice(0, 300));
  });
}

await step("Settings renders", async () => {
  await page.click("#tabbar .tab:has-text('Today')");
  await page.waitForTimeout(400);
  await page.click(".gear");
  await page.waitForSelector("h1:has-text('Settings')");
  const txt = await page.innerText("#app");
  if (/This screen stopped/.test(txt)) throw new Error("crashed: " + txt.slice(0, 300));
});

/* --------------------------------------------------------------------------
   TEST MODE

   The part `tests/app/test-testmode.mjs` cannot reach from Node: two real
   IndexedDB databases in one origin, and the marker actually on screen.
   ----------------------------------------------------------------------- */

console.log("\nTest mode");

await step("turns on from Settings, with a date", async () => {
  await page.click("text=Set up test mode");
  await page.waitForSelector("h1:has-text('Test mode')");
  const [date, time] = await page.$$(".card .field .inline .input");
  await date.fill("2026-03-14");
  await time.fill("09:30");
  await page.click("text=Turn test mode on");
  await page.waitForTimeout(900);
});

await step("the marker is on screen and names the date", async () => {
  await page.waitForSelector("#modemarker .modemarker", { timeout: 8000 });
  const txt = await page.innerText("#modemarker");
  if (!/TEST MODE/.test(txt)) throw new Error("the marker does not say what it is: " + txt);
  if (!/Mar/.test(txt)) throw new Error("the marker does not name the date: " + txt);
});

await step("the marker survives moving between screens", async () => {
  /* The test store has no tank facts of its own, because nothing is copied
     across. Fill them in on its own setup screen, then walk the tabs. */
  await page.click("#tabbar .tab:has-text('Today')");
  await page.waitForTimeout(500);
  await page.click("text=Set the tank up").catch(() => {});
  await page.waitForSelector("h1:has-text('Set up your tank')", { timeout: 8000 });
  const inputs = await page.$$(".card .field .input");
  const vals = ["77", "8.6", "9.2", "0.0693", "0.1"];
  for (let i = 0; i < vals.length && i < inputs.length; i++) await inputs[i].fill(vals[i]);
  await page.click("text=Save and start").catch(() => {});
  await page.waitForTimeout(900);
  for (const tab of ["Today", "Test Lab", "Tasks", "History"]) {
    await page.click(`#tabbar .tab:has-text('${tab}')`);
    await page.waitForTimeout(400);
    const on = await page.$("#modemarker .modemarker");
    if (!on) throw new Error(`the marker is missing on ${tab}`);
  }
});

await step("the app's today is the chosen date", async () => {
  await page.click("#tabbar .tab:has-text('Today')");
  await page.waitForTimeout(500);
  const txt = await page.innerText(".stepper");
  if (!/Mar/.test(txt)) throw new Error("the day stepper is not on the chosen date: " + txt);
});

await step("a series goes in in one action", async () => {
  await page.click("#modemarker .modemarker");
  await page.waitForSelector("h1:has-text('Test mode')");
  await page.fill(
    ".input.series",
    ["2026-03-01 dose 9.0", "2026-03-08 07:40 alk 9.0", "2026-03-10 07:40 alk 8.9", "2026-03-12 alk 8.8"].join("\n")
  );
  await page.waitForTimeout(400);
  const preview = await page.innerText(".seedreport");
  if (!/4 records/.test(preview)) throw new Error("the preview did not count them: " + preview);
  if (!/2 of 4/.test(preview)) throw new Error("the preview did not count the date-only ones: " + preview);
  await page.click("text=Add these");
  await page.waitForTimeout(1200);
});

await step("stepping the date moves the app's today", async () => {
  await page.click("#tabbar .tab:has-text('Today')");
  await page.waitForTimeout(400);
  const before = await page.innerText(".stepper");
  await page.click("#modemarker .modemarker");
  await page.waitForSelector("h1:has-text('Test mode')");
  await page.click(".card.is-testmode .stepper .arrow:last-of-type");
  await page.waitForTimeout(900);
  await page.click("#tabbar .tab:has-text('Today')");
  await page.waitForTimeout(400);
  const after = await page.innerText(".stepper");
  if (before === after) throw new Error("the day did not move: " + after);
});

await step("the real tank's store is untouched by all of that", async () => {
  const counts = await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { createIdbBackend, DB_NAME, TEST_DB_NAME } = await import("/app/src/store/db.js");
    const real = createStore(createIdbBackend(DB_NAME));
    const test = createStore(createIdbBackend(TEST_DB_NAME));
    return {
      real: (await real.ledger.allEvents()).length,
      test: (await test.ledger.allEvents()).length,
      realValues: (await real.ledger.allEvents()).map((e) => e.normalizedValue),
    };
  });
  if (counts.test < 4) throw new Error(`the test store did not take the series: ${counts.test}`);
  if (counts.realValues.some((v) => v === 8.9 && counts.real > 8)) {
    throw new Error("a seeded value reached the real store");
  }
  if (counts.real === 0) throw new Error("the real store lost its own records");
});

await step("clearing the test data empties the test store only", async () => {
  await page.click("#modemarker .modemarker");
  await page.waitForSelector("h1:has-text('Test mode')");
  await page.click("text=Clear all test data");
  await page.waitForSelector(".sheetwrap");
  await page.click("text=Yes, clear it");
  await page.waitForTimeout(1500);
  const counts = await page.evaluate(async () => {
    const { createStore } = await import("/app/src/store/index.js");
    const { createIdbBackend, DB_NAME, TEST_DB_NAME } = await import("/app/src/store/db.js");
    return {
      real: (await createStore(createIdbBackend(DB_NAME)).ledger.allEvents()).length,
      test: (await createStore(createIdbBackend(TEST_DB_NAME)).ledger.allEvents()).length,
    };
  });
  if (counts.test !== 0) throw new Error(`the test store still holds ${counts.test}`);
  if (counts.real === 0) throw new Error("the reset reached the real store");
});

await step("turning it off restores the real tank and the real date", async () => {
  await page.click("#modemarker .modemarker").catch(() => {});
  await page.waitForSelector("h1:has-text('Test mode')");
  await page.click("text=Turn test mode off");
  await page.waitForTimeout(1200);
  const marker = await page.$("#modemarker .modemarker");
  if (marker) throw new Error("the marker is still on screen");
  await page.click("#tabbar .tab:has-text('History')");
  await page.waitForTimeout(600);
  const txt = await page.innerText("#app");
  if (!/8\.7|8\.9/.test(txt)) throw new Error("the real readings did not come back");
});

await browser.close();
server.close();

console.log("\n" + "=".repeat(60));
if (errors.length) {
  console.log("PROBLEMS:");
  [...new Set(errors)].forEach((e) => console.log("  - " + e));
  process.exit(1);
}
console.log("SMOKE: clean");
