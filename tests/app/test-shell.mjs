/* ============================================================================
   THE OFFLINE SHELL IS COMPLETE
   ----------------------------------------------------------------------------
   The product's claim is that it opens with no network at all — the fishroom
   with no signal. That claim is only as good as the precache list, and the
   precache list is hand-written.

   It was wrong. `strings.js`, which nearly every module imports, was missing
   from it, along with `store/suggestion.js` and `present/why-retest.js`. None
   of the three was in the runtime keep list either, so the service worker
   never cached them at all. Offline, the fetch handler returns a 503 with a
   `text/plain` body for a JavaScript module request, which fails module
   resolution — a blank app rather than a degraded one.

   It did not show up in testing because the browser's own HTTP cache serves
   the file for a while, so the failure appears at random, on a cold cache or
   after an eviction. That is worse to diagnose than a failure that always
   happens, not better.

   The install-time completeness check inside `sw.js` cannot catch this: it
   verifies that every file ON the list fetched, which says nothing about a
   file that is not on it.
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";

const s = suite("the offline shell");

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const SW = fs.readFileSync(path.join(ROOT, "app/sw.js"), "utf8");

/* Every `.js` under `app/src`, found on disk rather than listed here — so a
   module added tomorrow is covered without anybody remembering to add it. */
function modulesOnDisk(dir = path.join(ROOT, "app/src"), prefix = "./src") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) out.push(...modulesOnDisk(path.join(dir, entry.name), p));
    else if (entry.name.endsWith(".js")) out.push(p);
  }
  return out.sort();
}

s.test("SHELL-01", "every application module is precached — an offline open cannot 404", () => {
  const precached = new Set([...SW.matchAll(/"(\.\/src\/[^"]+\.js)"/g)].map((m) => m[1]));
  const onDisk = modulesOnDisk();

  ok(onDisk.length > 20, `there are modules to check: ${onDisk.length}`);

  const missing = onDisk.filter((f) => !precached.has(f));
  eq(
    missing.length,
    0,
    missing.length
      ? `these modules would 404 offline: ${missing.join(", ")}`
      : "every module on disk is on the precache list"
  );

  /* And the reverse, which is a different defect with the same cause: a listed
     file that no longer exists fails `cache.addAll`, and one unfetchable entry
     fails the WHOLE install — so the app has no service worker at all. */
  const stale = [...precached].filter((f) => !onDisk.includes(f));
  eq(
    stale.length,
    0,
    stale.length ? `these are listed but not on disk: ${stale.join(", ")}` : "nothing stale is listed"
  );
});

s.test("SHELL-02", "the non-module shell files exist too", () => {
  const listed = [...SW.matchAll(/"(\.\/[^"]+\.(?:html|css|svg|webmanifest))"/g)].map((m) => m[1]);
  ok(listed.length >= 6, `the shell lists its documents and styles: ${listed.length}`);
  for (const f of listed) {
    ok(
      fs.existsSync(path.join(ROOT, "app", f.slice(2))),
      `${f} exists, so the install will not fail on it`
    );
  }
});

export default s;
