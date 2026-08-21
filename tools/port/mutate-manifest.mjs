/* ============================================================================
   PROVING THE PORT MANIFEST'S CHECK CAN ACTUALLY FAIL
   ----------------------------------------------------------------------------
   V1's own verify gate learned three rules the hard way, and the third is the
   one this file exists for: **a check that cannot fail is worse than no
   check.** `tools/port/check-port-manifest.mjs` is the whole mechanism that
   makes the port manifest trustworthy, so it gets the same treatment every
   other check in this repository gets.

   Each mutation below is a real way a port could go wrong or a manifest could
   go stale. The tree is copied, the mutation applied to the copy, the checker
   run against it, and it MUST come back red. One that does not is reported and
   the run fails.

       node tools/port/mutate-manifest.mjs
   ========================================================================= */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));

const MUTATIONS = [
  {
    id: "PM-01",
    why: "a line is changed in a ported file and the manifest is not rebuilt — the exact failure this whole mechanism exists to catch",
    file: "app/src/components/ZoomableChart.jsx",
    find: "<RotateCcw size={12} /> Reset",
    replace: "<RotateCcw size={12} /> Reset view",
    expect: /has changed since the manifest was built/,
  },
  {
    id: "PM-02",
    why: "a difference is quietly dropped from the manifest, leaving a changed line unaccounted for",
    file: "docs/migration/PORT-MANIFEST.md",
    /* The first hunk of `dates.js`, removed. The file's declared count then
       disagrees with what it carries, and — the arm that really matters —
       reverse-applying what is left no longer reproduces V1's file. */
    find: '+import { now } from "../store/time.js";\n+\n',
    replace: "",
    expect: /reverse-applying|difference\(s\) and carries|does not match/,
  },
  {
    id: "PM-03",
    why: "a reason outside the five the brief permits is used, so a difference is explained by inventing a category",
    file: "docs/migration/PORT-MANIFEST.md",
    find: "2. **chemistry removed — `paramStatus`, V1's position classifier, deleted",
    replace: "2. **tidied up — `paramStatus`, V1's position classifier, deleted",
    expect: /not a permitted reason/,
  },
  {
    id: "PM-04",
    why: "a ported file is dropped from the manifest altogether",
    file: "tools/port/port-map.json",
    find: '"v2": "app/src/components/Dashboard.jsx",',
    replace: '"v2": "app/src/components/DashboardX.jsx",',
    expect: /in the manifest and not in the port map|in the port map and not in the manifest/,
  },
  {
    id: "PM-05",
    why: "the recorded V1 hash is edited to match a manifest that no longer reproduces V1's file",
    file: "docs/migration/PORT-MANIFEST.md",
    find: "| V1 SHA-256 |",
    replace: "| V1 SHA-256 xx |",
    expect: /reverse-applying|undefined/,
  },
  {
    id: "PM-06",
    why: "a line is added to a recorded hunk, so the manifest describes a file that is not the one on disk",
    file: "docs/migration/PORT-MANIFEST.md",
    find: "+export const PARAM_STYLE = {",
    replace: "+export const paramStatus = (def, v) => (v < def.min ? 'low' : 'ok');\n+export const PARAM_STYLE = {",
    /* NOT the chemistry arm. Editing a recorded hunk breaks the reverse-apply
       first, which is the stronger arm and the one that fires. The chemistry
       arm cannot be reached by a tree mutation at all — it would need the
       ported file and the manifest changed together and consistently — so it
       is proved directly instead, by `PORT-16` in `tests/app/test-port.mjs`
       against `addsChemistry`. */
    expect: /reverse-applying|does not match/,
  },
  {
    id: "PM-07",
    why: "the recorded original is not V1's — the hole the reverse-apply arm cannot see, because it only proves the manifest agrees with itself",
    file: "docs/migration/PORT-MANIFEST.md",
    find: "| V1 blob | `",
    replace: "| V1 blob | `0000000",
    v1: true,
    expect: /the recorded original is not V1's/,
  },
];

function copyTree(dest) {
  const skip = new Set([".git", "node_modules", "__pycache__", "dist", "vendor"]);
  const walk = (from, to) => {
    fs.mkdirSync(to, { recursive: true });
    for (const name of fs.readdirSync(from)) {
      if (skip.has(name)) continue;
      const a = path.join(from, name), b = path.join(to, name);
      const st = fs.lstatSync(a);
      if (st.isDirectory()) walk(a, b);
      else if (st.isFile()) fs.copyFileSync(a, b);
    }
  };
  walk(ROOT, dest);
}

const base = fs.mkdtempSync(path.join(os.tmpdir(), "port-mutate-"));
copyTree(base);

let missed = 0;
let skipped = 0;
const v1Flag = process.argv.indexOf("--v1");
const V1_REPO = v1Flag >= 0 ? process.argv[v1Flag + 1] : null;
console.log("PROVING THE PORT-MANIFEST CHECK CAN FAIL\n");

/* The unmutated copy must be green, or nothing below means anything. */
try {
  execFileSync("node", [path.join(base, "tools/port/check-port-manifest.mjs")], { encoding: "utf8", stdio: "pipe" });
  console.log("[BASELINE] green on an unmutated copy\n");
} catch (e) {
  console.error("[BASELINE] RED on an unmutated copy — every result below is meaningless");
  console.error((e.stdout || "") + (e.stderr || ""));
  process.exit(2);
}

for (const m of MUTATIONS) {
  const target = path.join(base, m.file);
  const original = fs.readFileSync(target, "utf8");
  if (!original.includes(m.find)) {
    console.log(`[BLOCKED] ${m.id}  its anchor text is no longer in ${m.file}`);
    console.log(`          ${m.why}`);
    console.log("          The mutation must be re-anchored, or what it guards has moved.\n");
    missed += 1;
    continue;
  }
  fs.writeFileSync(target, original.replace(m.find, m.replace));
  let output = "", red = false;
  /* Some arms only exist when V1 is present, and are skipped honestly rather
     than reported as caught when the checkout is not here. */
  const args = [path.join(base, "tools/port/check-port-manifest.mjs")];
  if (m.v1) {
    if (!V1_REPO) {
      fs.writeFileSync(target, original);
      console.log(`[SKIPPED] ${m.id}  needs a V1 checkout: pass --v1 <path>`);
      console.log(`          ${m.why}\n`);
      skipped += 1;
      continue;
    }
    args.push("--v1", V1_REPO);
  }
  try {
    execFileSync("node", args, { encoding: "utf8", stdio: "pipe" });
  } catch (e) {
    red = true;
    output = (e.stdout || "") + (e.stderr || "");
  }
  fs.writeFileSync(target, original);

  if (!red) {
    console.log(`[MISSED ] ${m.id}  ${m.why}`);
    console.log("          the check stayed green\n");
    missed += 1;
    continue;
  }
  if (m.expect && !m.expect.test(output)) {
    console.log(`[MISSED ] ${m.id}  ${m.why}`);
    console.log(`          it went red, but not for the stated reason (wanted ${m.expect})\n`);
    missed += 1;
    continue;
  }
  console.log(`[CAUGHT ] ${m.id}  ${m.why}`);
}

fs.rmSync(base, { recursive: true, force: true });

console.log("\n==========================================================================");
console.log(`mutations defined : ${MUTATIONS.length}`);
console.log(`mutations caught  : ${MUTATIONS.length - missed - skipped}`);
console.log(`mutations missed  : ${missed}`);
if (skipped) console.log(`mutations skipped : ${skipped}   (need a V1 checkout: --v1 <path>)`);
console.log(`\nRESULT: ${missed ? "RED" : "GREEN"}`);
console.log("==========================================================================");
process.exit(missed ? 1 : 0);
