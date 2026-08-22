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

/* `--reason` takes a value, so the value is not a target. Parsed here rather
   than by a `startsWith("--")` filter, which would have treated the reason text
   as a file to reseal. */
const argv = process.argv.slice(2);
const reasonAt = argv.indexOf("--reason");
/* `reasonAt + 1` is only a value index when the flag is actually present.
   Without the guard, an absent flag gives `reasonAt = -1` and the expression
   excludes index 0 — silently dropping the first file asked for. */
const reasonValueAt = reasonAt >= 0 ? reasonAt + 1 : -1;
const targets = argv.filter((a, i) => !a.startsWith("--") && i !== reasonValueAt);
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

/* A hunk's identity for reason-matching: the changed lines only. Context lines
   move when anything above them moves, so including them would make every hunk
   after an edit look new. */
function bodyKey(h) {
  if (!h || !h.body) return "";
  return h.body.filter(([kind]) => kind !== "=").map(([kind, text]) => kind + text).join("\n");
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

  /* MATCH REASONS TO HUNKS BY THE HUNK, NOT BY POSITION.

     An edit in the middle of a file splits one recorded difference into two and
     shifts every one after it, so pairing reason[i] with hunk[i] would silently
     re-label differences the port already justified. Each new hunk is matched
     against the recorded ones by its body; an unchanged difference keeps the
     reason it was given.

     A hunk that matches nothing recorded is NEW, and needs a reason a person
     wrote. `--reason` supplies one for this run; without it the tool refuses
     and names the shortfall rather than inventing a justification. */
  const recorded = new Map(oldHunks.map((h, i) => [bodyKey(h), reasons[i]]));
  /* A reworded comment inside an already-justified difference changes the
     hunk's body without changing what the difference IS, so body-matching alone
     would report it as new and demand a reason the manifest already carries.
     Where a hunk matches nothing by body, the recorded reasons not already
     claimed are offered in their original order — which is correct exactly
     while no hunk has been split, and a split shows up as a shortfall below. */
  const spare = reasons.filter((r) => true);
  const fresh = reasonAt >= 0 ? argv[reasonAt + 1] : null;
  const assigned = [];
  let unexplained = 0;
  for (const h of newHunks) {
    const known = recorded.get(bodyKey(h));
    if (known) {
      assigned.push(known);
      const at = spare.indexOf(known);
      if (at >= 0) spare.splice(at, 1);
      continue;
    }
    assigned.push(null);
  }
  for (let i = 0; i < assigned.length; i += 1) {
    if (assigned[i] !== null) continue;
    if (spare.length) { assigned[i] = spare.shift(); continue; }
    if (fresh) { assigned[i] = fresh; continue; }
    unexplained += 1;
  }
  if (unexplained) {
    problems.push(
      `${v2}: ${unexplained} difference(s) the manifest does not justify. ` +
      `Pass --reason "<one of the permitted reasons> — why", or write them in by hand. ` +
      `This tool does not invent a justification.`
    );
    continue;
  }
  const reasonFor = assigned;

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
    rebuilt.push(`${i + 1}. **${reasonFor[i]}**`, "", "```diff", renderHunk(h), "```", "");
  });

  rows = [...rows.slice(0, span[0]), ...rebuilt, ...rows.slice(span[1])];
  const carried = assigned.filter((r) => recorded.has(bodyKey(newHunks[assigned.indexOf(r)] || {}))).length;
  console.log(`resealed ${v2}: ${newHunks.length} difference(s), ${reasons.length} recorded reason(s) matched by hunk`);
}

if (problems.length) {
  for (const p of problems) console.error(`  ${p}`);
  process.exit(1);
}

fs.writeFileSync(MANIFEST_PATH, rows.join("\n"));
