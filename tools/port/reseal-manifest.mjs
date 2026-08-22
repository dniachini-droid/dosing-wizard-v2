/* RESEAL A PORTED FILE'S MANIFEST ENTRY, WITHOUT THE V1 REPOSITORY.

       node tools/port/reseal-manifest.mjs app/src/components/Setup.jsx ...

   `build-manifest.mjs` needs V1 checked out beside this tree, which a later
   session working on V2 does not have. But V1's original file is recoverable
   from what is already committed here: reverse-applying the manifest's recorded
   hunks to the manifest's recorded ported file reproduces it exactly — that is
   the property `check-port-manifest.mjs` verifies on every run, so if it holds
   before an edit, the reconstruction is sound.

   So this tool:

     1. reads the ported file as it stood at the manifest's recorded SHA (from
        git, so an edited working tree cannot corrupt the reconstruction),
     2. reverse-applies the recorded hunks to recover V1's file,
     3. diffs V1 against the file as it stands NOW,
     4. rewrites the entry's `Ported SHA-256`, `Differences`, reasons and diff
        blocks.

   IT WILL NOT INVENT A REASON. Reasons are the port's own justification and the
   permitted set is fixed by the brief. Where the new diff has the same number of
   hunks as the old, the recorded reasons carry across unchanged and the tool
   says so. Where the count has changed it REFUSES and names the shortfall, so a
   person writes the missing reason rather than a script guessing one. */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, MANIFEST_PATH, diffHunks, parseHunks, renderHunk, reverseApply, sha256 } from "./manifest.mjs";

const targets = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (!targets.length) {
  console.error("usage: node tools/port/reseal-manifest.mjs <ported path> [...]");
  process.exit(2);
}

/* The manifest as committed, and the ported files as committed. Both are read
   from git rather than from disk: the working tree is exactly what has moved
   on, and reconstructing V1 from a file that has already changed would produce
   a "V1" that never existed. */
function atHead(p) {
  return execFileSync("git", ["show", `HEAD:${p}`], { encoding: "utf8", cwd: ROOT });
}

const liveText = fs.readFileSync(MANIFEST_PATH, "utf8");
const headText = atHead("docs/migration/PORT-MANIFEST.md");

/* One entry's span in the document, as line indices. Entries start at a `###`
   heading and run to the next one. */
function entrySpan(rows, v2) {
  const start = rows.findIndex((l) => l === `### \`${v2}\``);
  if (start < 0) return null;
  let end = rows.length;
  for (let i = start + 1; i < rows.length; i++) {
    if (/^### `/.test(rows[i]) || /^## /.test(rows[i])) { end = i; break; }
  }
  return [start, end];
}

function fieldsOf(block) {
  const out = {};
  for (const line of block) {
    const m = /^\| ([^|]+?) \| `?([^|`]+?)`? \|$/.exec(line);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

function reasonsOf(block) {
  const out = [];
  let inDiff = false;
  for (const line of block) {
    if (line === "```diff") { inDiff = true; continue; }
    if (line === "```" && inDiff) { inDiff = false; continue; }
    if (inDiff) continue;
    const m = /^\d+\. \*\*(.+)\*\*$/.exec(line);
    if (m) out.push(m[1]);
  }
  return out;
}

function diffsOf(block) {
  const out = [];
  let inDiff = false, cur = [];
  for (const line of block) {
    if (line === "```diff") { inDiff = true; cur = []; continue; }
    if (line === "```" && inDiff) { inDiff = false; out.push(cur.join("\n")); continue; }
    if (inDiff) cur.push(line);
  }
  return out;
}

let rows = liveText.split("\n");
const problems = [];

for (const v2 of targets) {
  const headRows = headText.split("\n");
  const headSpan = entrySpan(headRows, v2);
  if (!headSpan) { problems.push(`${v2}: no manifest entry at HEAD`); continue; }
  const headBlock = headRows.slice(headSpan[0], headSpan[1]);
  const fields = fieldsOf(headBlock);
  const reasons = reasonsOf(headBlock);
  const oldHunks = diffsOf(headBlock).flatMap((d) => parseHunks(d));

  const portedAtHead = atHead(v2);
  if (sha256(portedAtHead) !== fields["Ported SHA-256"]) {
    problems.push(`${v2}: HEAD's ported file does not match HEAD's manifest — reseal an already-broken entry by hand`);
    continue;
  }

  let v1Text;
  try {
    v1Text = reverseApply(portedAtHead, oldHunks);
  } catch (err) {
    problems.push(`${v2}: could not reconstruct V1 — ${err.message}`);
    continue;
  }
  if (sha256(v1Text) !== fields["V1 SHA-256"]) {
    problems.push(`${v2}: the reconstruction does not match the recorded V1 SHA-256`);
    continue;
  }

  const nowText = fs.readFileSync(path.join(ROOT, v2), "utf8");
  const newHunks = diffHunks(v1Text, nowText);

  if (newHunks.length !== reasons.length) {
    problems.push(
      `${v2}: ${newHunks.length} difference(s) now, ${reasons.length} recorded reason(s). ` +
      `Write the missing reason(s) into the manifest entry by hand — this tool does not invent one.`
    );
    continue;
  }

  /* Rebuild the entry, keeping the heading, the V1 fields and the reasons. */
  const span = entrySpan(rows, v2);
  if (!span) { problems.push(`${v2}: no entry in the working manifest`); continue; }

  const rebuilt = [
    `### \`${v2}\``,
    "",
    "| | |",
    "|---|---|",
    `| V1 source | \`${fields["V1 source"]}\` |`,
    `| V1 commit | \`${fields["V1 commit"]}\` |`,
    `| V1 SHA-256 | \`${fields["V1 SHA-256"]}\` |`,
    `| V1 blob | \`${fields["V1 blob"]}\` |`,
    `| Ported SHA-256 | \`${sha256(nowText)}\` |`,
    `| Differences | ${newHunks.length} |`,
    "",
  ];
  newHunks.forEach((h, i) => {
    rebuilt.push(`${i + 1}. **${reasons[i]}**`, "", "```diff", renderHunk(h), "```", "");
  });

  rows = [...rows.slice(0, span[0]), ...rebuilt, ...rows.slice(span[1])];
  console.log(`resealed ${v2}: ${newHunks.length} difference(s), ${reasons.length} reason(s) carried across`);
}

if (problems.length) {
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

fs.writeFileSync(MANIFEST_PATH, rows.join("\n"));
