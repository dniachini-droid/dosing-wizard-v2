/* Regenerates `docs/migration/PORT-MANIFEST.md` from the real diff between the
   V1 originals and the ported files. Needs a V1 checkout; `check` does not.

       node tools/port/build-manifest.mjs --v1 /path/to/tank-wizard          */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { ROOT, MANIFEST_PATH, REASONS, readMap, sha256, diffHunks, renderHunk, v1Source, v1BlobId } from "./manifest.mjs";

const args = process.argv.slice(2);
const v1Repo = args[args.indexOf("--v1") + 1];
if (!v1Repo || args.indexOf("--v1") < 0) {
  console.error("usage: node tools/port/build-manifest.mjs --v1 /path/to/tank-wizard");
  process.exit(2);
}

const map = readMap();
const head = execFileSync("git", ["-C", v1Repo, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
if (head !== map.v1Commit) {
  console.error(`the V1 checkout is at ${head}, and the port was taken from ${map.v1Commit}`);
  process.exit(2);
}

const out = [];
out.push("# PORT MANIFEST — every line of V1's interface that changed, and why");
out.push("");
out.push("**Generated. Do not hand-edit.** `node tools/port/build-manifest.mjs --v1 <path>`");
out.push("regenerates it from the real diff; `node tools/port/manifest.mjs check` verifies it");
out.push("on a tree that has never seen V1.");
out.push("");
out.push("## What this document is for");
out.push("");
out.push("The brief that commissioned this port says why:");
out.push("");
out.push("> Previous briefs said \"port from V1 source, do not reimplement.\" Nothing checked");
out.push("> it. Every other rule in this project carries a mechanical test that fails when the");
out.push("> rule is broken; that instruction carried nothing, so the build wrote its own");
out.push("> version of everything and the result was worse than the thing it replaced.");
out.push("");
out.push("So this one is checked. `tools/port/manifest.mjs check` reverse-applies every diff");
out.push("below to the ported file and hashes the result. If that hash is the recorded V1");
out.push("hash, the diff below is the **whole** difference — a changed line that is not");
out.push("recorded here would survive the reverse-apply and change the hash. A file with an");
out.push("unexplained difference cannot pass.");
out.push("");
out.push("`tools/port/mutate-manifest.mjs` proves each arm of that check can actually fail.");
out.push("");
out.push("## Checking the recorded original against V1 itself");
out.push("");
out.push("The check above proves the recorded diff is complete. It cannot prove the");
out.push("recorded ORIGINAL is V1's, because nothing in this repository knows what V1");
out.push("contained — the manifest would be self-certifying without the line below.");
out.push("");
out.push("Every entry records **V1's own git blob id**, which is git's content hash of");
out.push("that file at that commit. Anybody with the V1 repository can check any entry");
out.push("without trusting this document or whoever built it:");
out.push("");
out.push("```");
out.push("git -C /path/to/tank-wizard rev-parse \\");
out.push(`  ${map.v1Commit.slice(0, 7)}:src/components/Dashboard.jsx`);
out.push("```");
out.push("");
out.push("`node tools/port/check-port-manifest.mjs --v1 <path>` does it for all of them.");
out.push("");
out.push("## Provenance");
out.push("");
out.push("| | |");
out.push("|---|---|");
out.push(`| V1 repository | \`${map.v1Repository}\` |`);
out.push(`| V1 commit | \`${map.v1Commit}\` |`);
out.push(`| Files taken | ${map.files.length} |`);
out.push("");
out.push("## The permitted reasons");
out.push("");
out.push("A difference may carry one of these and nothing else.");
out.push("");
out.push("| Reason | Meaning |");
out.push("|---|---|");
for (const [k, v] of Object.entries(REASONS)) out.push(`| \`${k}\` | ${v} |`);
out.push("");

const counts = {};
for (const k of Object.keys(REASONS)) counts[k] = 0;
let verbatim = 0;

const bodies = [];
for (const entry of map.files) {
  const original = v1Source(v1Repo, map.v1Commit, entry.v1);
  const portedPath = path.join(ROOT, entry.v2);
  if (!fs.existsSync(portedPath)) {
    console.error(`missing ported file: ${entry.v2}`);
    process.exit(2);
  }
  const ported = fs.readFileSync(portedPath, "utf8");
  const hunks = diffHunks(original, ported);
  const reasons = entry.reasons || [];
  if (reasons.length !== hunks.length) {
    console.error(`${entry.v2}: ${hunks.length} hunk(s) in the real diff, ${reasons.length} reason(s) recorded`);
    console.error(hunks.map((h, i) => `  hunk ${i + 1}: @@ -${h.aStart + 1},${h.aLen} +${h.bStart + 1},${h.bLen} @@`).join("\n"));
    process.exit(2);
  }
  for (const r of reasons) {
    const kind = r.split("—")[0].trim();
    if (!(kind in REASONS)) {
      console.error(`${entry.v2}: "${kind}" is not a permitted reason`);
      process.exit(2);
    }
    counts[kind]++;
  }
  if (!hunks.length) verbatim++;

  bodies.push("---");
  bodies.push("");
  bodies.push(`### \`${entry.v2}\``);
  bodies.push("");
  bodies.push("| | |");
  bodies.push("|---|---|");
  bodies.push(`| V1 source | \`${entry.v1}\` |`);
  bodies.push(`| V1 commit | \`${map.v1Commit}\` |`);
  bodies.push(`| V1 SHA-256 | \`${sha256(original)}\` |`);
  bodies.push(`| V1 blob | \`${v1BlobId(v1Repo, map.v1Commit, entry.v1)}\` |`);
  bodies.push(`| Ported SHA-256 | \`${sha256(ported)}\` |`);
  bodies.push(`| Differences | ${hunks.length} |`);
  bodies.push("");
  if (!hunks.length) {
    bodies.push("Byte-identical to V1.");
    bodies.push("");
    continue;
  }
  hunks.forEach((h, i) => {
    bodies.push(`${i + 1}. **${reasons[i]}**`);
    bodies.push("");
    bodies.push("```diff");
    bodies.push(renderHunk(h));
    bodies.push("```");
    bodies.push("");
  });
}

out.push("## Summary");
out.push("");
out.push("| | |");
out.push("|---|---|");
out.push(`| Files taken from V1 | ${map.files.length} |`);
out.push(`| Taken byte-identical | ${verbatim} |`);
for (const [k, n] of Object.entries(counts)) out.push(`| Differences — \`${k}\` | ${n} |`);
out.push("");
out.push(...bodies);

fs.writeFileSync(MANIFEST_PATH, out.join("\n").replace(/\n+$/, "") + "\n");
console.log(`wrote ${path.relative(ROOT, MANIFEST_PATH)} — ${map.files.length} file(s), ${verbatim} byte-identical`);
