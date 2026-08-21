/* Verifies the port manifest against the ported files, on a tree that has
   never seen the V1 repository. See `tools/port/manifest.mjs` for how.

       node tools/port/check-port-manifest.mjs                              */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, MANIFEST_PATH, REASONS, addsChemistry, readMap, sha256, parseHunks, reverseApply, v1BlobId } from "./manifest.mjs";

/* Read the manifest back into the shape it was generated from. Parsing the
   committed document rather than trusting a sidecar is deliberate: the
   document is what a person reads, so the document is what is checked. */
export function parseManifest(text) {
  const entries = [];
  let cur = null;
  const rows = text.split("\n");
  let inDiff = false;
  let diff = [];
  for (const line of rows) {
    const head = /^### `(.+)`$/.exec(line);
    if (head) {
      cur = { v2: head[1], fields: {}, reasons: [], diffs: [] };
      entries.push(cur);
      continue;
    }
    if (!cur) continue;
    const field = /^\| ([^|]+?) \| `?([^|`]+?)`? \|$/.exec(line);
    if (field && !inDiff) { cur.fields[field[1].trim()] = field[2].trim(); continue; }
    const reason = /^\d+\. \*\*(.+)\*\*$/.exec(line);
    if (reason && !inDiff) { cur.reasons.push(reason[1]); continue; }
    if (line === "```diff") { inDiff = true; diff = []; continue; }
    if (line === "```" && inDiff) { inDiff = false; cur.diffs.push(diff.join("\n")); continue; }
    if (inDiff) diff.push(line);
  }
  return entries;
}

const problems = [];
const manifestText = fs.readFileSync(MANIFEST_PATH, "utf8");
const entries = parseManifest(manifestText);
const map = readMap();

const byPath = new Map(entries.map((e) => [e.v2, e]));

/* Every file the port map claims must be in the manifest, and vice versa. A
   file quietly dropped from one of the two is the failure this arm catches. */
for (const f of map.files) {
  if (!byPath.has(f.v2)) problems.push(`${f.v2}: in the port map and not in the manifest`);
}
for (const e of entries) {
  if (!map.files.some((f) => f.v2 === e.v2)) problems.push(`${e.v2}: in the manifest and not in the port map`);
}

for (const e of entries) {
  const p = path.join(ROOT, e.v2);
  if (!fs.existsSync(p)) { problems.push(`${e.v2}: ported file is missing`); continue; }
  const ported = fs.readFileSync(p, "utf8");

  const recordedPorted = e.fields["Ported SHA-256"];
  if (sha256(ported) !== recordedPorted) {
    problems.push(`${e.v2}: the ported file has changed since the manifest was built (${sha256(ported)} against ${recordedPorted}) — rebuild it`);
    continue;
  }

  const recordedV1 = e.fields["V1 SHA-256"];
  const declared = Number(e.fields["Differences"]);
  if (e.diffs.length !== declared) problems.push(`${e.v2}: declares ${declared} difference(s) and carries ${e.diffs.length}`);
  if (e.reasons.length !== e.diffs.length) problems.push(`${e.v2}: ${e.diffs.length} difference(s), ${e.reasons.length} reason(s)`);

  for (const r of e.reasons) {
    const kind = r.split("—")[0].trim();
    if (!(kind in REASONS)) problems.push(`${e.v2}: "${kind}" is not a permitted reason`);
    if (kind === "defect fixed" && !r.includes("—")) problems.push(`${e.v2}: "defect fixed" must name the defect`);
  }

  /* A REASON IS A LABEL SOMEBODY TYPES. THIS IS THE ONE THING THAT READS THE
     HUNK.

     A review pointed out that reasons are counted, never inspected: a hunk
     that ADDS a threshold, labelled `chemistry removed`, passes. That cannot
     be closed in general — deciding whether a hunk is chemistry is the
     judgement the reviewer is there for — but its sharpest case can be. "No
     V1 chemistry crosses" is the brief's central rule, and every name it
     names is known. A hunk may not put one back, whatever it claims to be
     doing. */
  for (const d of e.diffs) {
    for (const name of addsChemistry(d)) {
      problems.push(`${e.v2}: a hunk ADDS V1 chemistry back — ${name}`);
    }
  }

  /* The arm that makes the rest of it true. */
  try {
    const hunks = e.diffs.flatMap((d) => parseHunks(d));
    const rebuilt = reverseApply(ported, hunks);
    if (sha256(rebuilt) !== recordedV1) {
      problems.push(`${e.v2}: reverse-applying the recorded differences does not reproduce V1's file (got ${sha256(rebuilt)}, expected ${recordedV1}) — the manifest does not account for every changed line`);
    }
  } catch (err) {
    problems.push(`${e.v2}: ${err.message}`);
  }
}

/* --- optional: check the recorded originals against V1 itself -------------
   Everything above runs on a tree that has never seen V1. This arm needs it,
   and closes the one thing the rest cannot: that the recorded original is the
   file V1 actually had. */
const v1Flag = process.argv.indexOf("--v1");
if (v1Flag >= 0) {
  const v1Repo = process.argv[v1Flag + 1];
  if (!v1Repo) {
    problems.push("--v1 needs a path to the V1 repository");
  } else {
    let head = null;
    try {
      head = execFileSync("git", ["-C", v1Repo, "rev-parse", map.v1Commit], { encoding: "utf8" }).trim();
    } catch (err) {
      problems.push(`the V1 repository at ${v1Repo} does not hold ${map.v1Commit}`);
    }
    if (head) {
      for (const f of map.files) {
        const e = byPath.get(f.v2);
        if (!e) continue;
        const recorded = e.fields["V1 blob"];
        if (!recorded) { problems.push(`${f.v2}: the manifest records no V1 blob id`); continue; }
        let actual = null;
        try { actual = v1BlobId(v1Repo, map.v1Commit, f.v1); }
        catch { problems.push(`${f.v2}: V1 has no ${f.v1} at ${map.v1Commit}`); continue; }
        if (actual !== recorded) {
          problems.push(`${f.v2}: the recorded original is not V1's — blob ${recorded} against ${actual}`);
        }
      }
      if (!problems.length) console.log(`Checked against V1 at ${map.v1Commit}: every recorded original is V1's.`);
    }
  }
}

if (problems.length) {
  console.error("PORT MANIFEST: RED\n");
  for (const p of problems) console.error("  " + p);
  console.error(`\n${problems.length} problem(s).`);
  process.exit(1);
}
console.log(`PORT MANIFEST: GREEN — ${entries.length} ported file(s) fully accounted for.`);
