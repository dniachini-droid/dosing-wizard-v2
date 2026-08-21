/* ============================================================================
   THE PORT MANIFEST — GENERATED FROM THE REAL DIFF, AND CHECKED WITHOUT V1
   ----------------------------------------------------------------------------
   Why this file exists is written in the brief that commissioned it:

     "Previous briefs said 'port from V1 source, do not reimplement.' Nothing
      checked it. Every other rule in this project carries a mechanical test
      that fails when the rule is broken; that instruction carried nothing, so
      the build wrote its own version of everything."

   So the instruction now carries one. For every file taken from V1 the
   manifest records:

     - the V1 path and the V1 commit it was read at;
     - the SHA-256 of the V1 original;
     - the SHA-256 of the ported file as it stands in this repository;
     - the COMPLETE unified diff between them, with a reason on every hunk.

   THE CHECK, AND WHY IT DOES NOT NEED V1
   --------------------------------------

   `check` reverse-applies the recorded diff to the ported file and hashes the
   result. If that hash equals the recorded V1 hash then the recorded diff is
   the whole truth about the difference: a line changed and not recorded would
   survive the reverse-apply and change the hash. This is what makes the
   manifest impossible to leave stale, and it runs on a tree that has never
   seen the V1 repository.

   A check that cannot fail is worse than no check (V1's own verify gate, three
   rules learned the hard way). `tools/port/mutate-manifest.mjs` proves each arm
   of this one can fail.

       node tools/port/manifest.mjs check
       node tools/port/manifest.mjs build --v1 /path/to/tank-wizard
   ========================================================================= */

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.dirname(path.dirname(HERE));
export const MAP_PATH = path.join(ROOT, "tools/port/port-map.json");
export const MANIFEST_PATH = path.join(ROOT, "docs/migration/PORT-MANIFEST.md");

/* The only reasons a ported line may differ from V1's. The brief fixes this
   list; it is not open for extension by whoever is porting. */
export const REASONS = Object.freeze({
  "chemistry removed": "A V1 classifier, verdict, threshold, dose figure or message about what a reading means, deleted on the way across.",
  "data source rewired": "V1's storage call replaced by V2's ledger, assessment store, task store or configuration store.",
  "wording replaced with engine output": "A sentence V1 composed itself, replaced by what V2's engine emitted or by V2's strings file.",
  "defect fixed": "A named V1 defect, corrected on the way across. The name is required.",
  "styling token substituted": "A V1 colour, class or spacing literal replaced by V2's equivalent token.",
});

export function sha256(text) {
  return crypto.createHash("sha256").update(text, "utf8").digest("hex");
}

export function readMap() {
  return JSON.parse(fs.readFileSync(MAP_PATH, "utf8"));
}

/* --- a minimal unified diff, and its exact inverse -----------------------
   Written here rather than shelled out to `diff` so that `check` depends on
   nothing but Node, exactly as the application test harness does. */

function lines(text) {
  const l = text.split("\n");
  if (l.length && l[l.length - 1] === "") l.pop();
  return l;
}

/* Longest common subsequence over lines. The files are a few hundred lines
   each, so the quadratic table is the right trade for exactness. */
function lcs(a, b) {
  const n = a.length, m = b.length;
  const dp = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { ops.push(["=", a[i]]); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { ops.push(["-", a[i]]); i++; }
    else { ops.push(["+", b[j]]); j++; }
  }
  while (i < n) ops.push(["-", a[i++]]);
  while (j < m) ops.push(["+", b[j++]]);
  return ops;
}

const CONTEXT = 3;

/* Hunks in unified format, from V1 original (a) to ported file (b). */
export function diffHunks(aText, bText) {
  const a = lines(aText), b = lines(bText);
  const ops = lcs(a, b);
  const changed = ops.map((o) => o[0] !== "=");
  const hunks = [];
  let k = 0;
  let aPos = 0, bPos = 0;
  const posA = [], posB = [];
  for (const [kind] of ops) {
    posA.push(aPos); posB.push(bPos);
    if (kind !== "+") aPos++;
    if (kind !== "-") bPos++;
  }
  while (k < ops.length) {
    if (!changed[k]) { k++; continue; }
    let start = k;
    while (start > 0 && !changed[start - 1] && k - start < CONTEXT) start--;
    let end = k;
    /* Extend while another change is within twice the context, so two nearby
       edits read as one hunk rather than two overlapping ones. */
    while (end < ops.length) {
      let next = end + 1;
      while (next < ops.length && !changed[next]) next++;
      if (next < ops.length && next - end <= CONTEXT * 2) { end = next; continue; }
      break;
    }
    let stop = end;
    let ctx = 0;
    while (stop + 1 < ops.length && !changed[stop + 1] && ctx < CONTEXT) { stop++; ctx++; }
    const body = ops.slice(start, stop + 1);
    const aStart = posA[start], bStart = posB[start];
    let aLen = 0, bLen = 0;
    for (const [kind] of body) { if (kind !== "+") aLen++; if (kind !== "-") bLen++; }
    hunks.push({ aStart, aLen, bStart, bLen, body });
    k = stop + 1;
  }
  return hunks;
}

export function renderHunk(h) {
  const head = `@@ -${h.aLen ? h.aStart + 1 : 0},${h.aLen} +${h.bLen ? h.bStart + 1 : 0},${h.bLen} @@`;
  const body = h.body.map(([kind, text]) => (kind === "=" ? " " : kind) + text);
  return [head, ...body].join("\n");
}

const HUNK_HEAD = /^@@ -(\d+),(\d+) \+(\d+),(\d+) @@$/;

export function parseHunks(text) {
  const out = [];
  let cur = null;
  for (const line of text.split("\n")) {
    const m = HUNK_HEAD.exec(line);
    if (m) {
      cur = { aStart: +m[1] ? +m[1] - 1 : 0, aLen: +m[2], bStart: +m[3] ? +m[3] - 1 : 0, bLen: +m[4], body: [] };
      out.push(cur);
      continue;
    }
    if (!cur) continue;
    const kind = line[0];
    if (kind !== " " && kind !== "+" && kind !== "-") continue;
    cur.body.push([kind === " " ? "=" : kind, line.slice(1)]);
  }
  return out;
}

/* The inverse of the diff: given the ported file and the recorded hunks,
   reconstruct what V1 had. Every context and every `+` line must match the
   ported file exactly, so a manifest describing a file that has since moved on
   fails here rather than passing quietly. */
export function reverseApply(bText, hunks) {
  const b = lines(bText);
  const out = [];
  let cursor = 0;
  for (const h of hunks) {
    if (h.bStart < cursor) throw new Error(`hunk at +${h.bStart + 1} overlaps the previous one`);
    for (; cursor < h.bStart; cursor++) out.push(b[cursor]);
    for (const [kind, text] of h.body) {
      if (kind === "+") {
        if (b[cursor] !== text) {
          throw new Error(`ported file does not match the manifest at line ${cursor + 1}:\n  manifest: ${JSON.stringify(text)}\n  file:     ${JSON.stringify(b[cursor])}`);
        }
        cursor++;
      } else if (kind === "-") {
        out.push(text);
      } else {
        if (b[cursor] !== text) {
          throw new Error(`context does not match the ported file at line ${cursor + 1}:\n  manifest: ${JSON.stringify(text)}\n  file:     ${JSON.stringify(b[cursor])}`);
        }
        out.push(text);
        cursor++;
      }
    }
  }
  for (; cursor < b.length; cursor++) out.push(b[cursor]);
  return out.join("\n") + "\n";
}

export function v1Source(v1Repo, commit, filePath) {
  return execFileSync("git", ["-C", v1Repo, "show", `${commit}:${filePath}`], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/* GIT'S OWN NAME FOR THE FILE'S CONTENT, AT THAT COMMIT.

   A review pointed out that the manifest is self-certifying: `build` writes
   both the V1 hash and the diff from whatever it was pointed at, and `check`
   only proves those two agree with each other. Reverse-apply establishes
   internal consistency, not that the "V1 original" is V1's.

   That cannot be closed offline — nothing in this repository can know what V1
   contained — but it can be made checkable by anybody in one command, without
   trusting this manifest or the person who built it:

       git -C /path/to/tank-wizard rev-parse 9276a2c:src/components/Dashboard.jsx

   The blob id is git's content hash. If it matches the line in the manifest,
   the recorded original IS the file V1 had at that commit. */
export function v1BlobId(v1Repo, commit, filePath) {
  return execFileSync("git", ["-C", v1Repo, "rev-parse", `${commit}:${filePath}`], {
    encoding: "utf8",
  }).trim();
}

/* The V1 chemistry this port deleted. A hunk may not ADD any of it back,
   whatever reason it carries — which is the arm that stops a reason from being
   a label somebody types rather than a description of what the hunk did. */
/* Does this hunk put any of it back? Reads the `+` lines only, with comments
   dropped — a comment saying what was deleted names it by design, and this
   file's whole point is that the manifest is full of those. */
export function addsChemistry(diffText) {
  const added = String(diffText).split("\n")
    .filter((l) => l.startsWith("+"))
    .join("\n")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\+\s*\*.*$/gm, "");
  return V1_CHEMISTRY.filter((name) =>
    new RegExp(`(^|[^\\w.\`'"])${name}\\s*[(=]`, "m").test(added));
}

export const V1_CHEMISTRY = Object.freeze([
  "paramStatus", "readingVerdict", "computeControl", "computeStability",
  "computeRates", "rateNarrative", "assessAlkalinity", "assessCalcium",
  "assessMagnesium", "doseStatus", "proposeCorrection", "buildFindings",
  "predictAfterChange", "computeElementConsumption", "icpRef", "ICP_GROUPS",
  "SAFE_BOUNDS", "SAFE_DAILY_RISE", "STABILITY_RULES", "STABILITY_COLOR",
  "CONSUMPTION_RULES", "buildOverview", "buildBriefing", "explainScore",
  "deriveTankState", "alkStamp", "findingsFor", "isCorrectionState",
]);
