/* DOES EVERY PATH THE BUILT SERVICE WORKER PRECACHES ACTUALLY EXIST?

       node tools/app/check-precache.mjs [deploy-dir]

   The end-to-end half of `PORT-25`, and it belongs in a tool for the same
   reason `check-runtime-path.mjs` does: it reads a BUILD ARTEFACT, and
   `app/dist/` is gitignored. A check in the always-on suite that silently
   passes when the artefact is absent — which is every fresh checkout — is a
   green tick for work it did not do, so the artefact half is here and the
   cheap source half stays in the suite.

   THE DEFECT IT EXISTS FOR. The precache list named `/app/manifest.webmanifest`,
   which is where the manifest lives in SOURCE. The build hashes it into
   `/assets/manifest-<hash>.webmanifest` and rewrites the `<link rel="manifest">`
   to match, so the hand-written entry named a URL the built app does not serve.
   It 404'd on every install and was skipped in silence, because the install step
   is deliberately tolerant of a miss. Two spellings of one path — `AI-018`'s
   defect, in a different file.

   WITH NO ARGUMENT it checks `app/dist` plus the repository root, which is what
   `vite.config.js` explains a deployment serves. WITH A DIRECTORY it checks that
   directory alone, which is what a deploy tree is: everything the app fetches,
   in one place. Run it against the tree you are about to zip. */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const arg = process.argv[2] || null;
const dist = arg ? path.resolve(arg) : path.join(ROOT, "app/dist");
/* A deploy tree answers for everything; a repository checkout answers for the
   engine's own files out of the repository, because that is where they are
   served from. */
const fallback = arg ? dist : ROOT;

const swPath = path.join(dist, "app/sw.js");
if (!fs.existsSync(swPath)) {
  console.error(`no built service worker at ${swPath} — run \`npm run build\` first`);
  process.exit(2);
}

const sw = fs.readFileSync(swPath, "utf8");
const problems = [];

if (/__PRECACHE__|__VERSION__/.test(sw)) {
  problems.push("the built worker still carries an unfilled placeholder");
}

const m = /const PRECACHE = (\[[\s\S]*?\n\]);/.exec(sw);
if (!m) {
  console.error("could not read PRECACHE out of the built service worker");
  process.exit(2);
}
const list = JSON.parse(m[1]);
if (list.length < 5) problems.push(`the precache list holds only ${list.length} entries`);

for (const url of list) {
  const rel = url.replace(/^\//, "");
  /* The shell answers for itself; a source copy of a file the build hashes is
     NOT proof of what is served, which is what let the stale entry through a
     first draft of this check. */
  const shell = rel.startsWith("app/") || rel.startsWith("assets/");
  const where = shell ? path.join(dist, rel) : path.join(fallback, rel);
  if (!fs.existsSync(where)) {
    problems.push(`${url} is precached and is not served (looked in ${shell ? "the build output" : "the repository"})`);
  }
}

/* The specific pairing that was wrong: the manifest the page LINKS must be the
   manifest that is CACHED. */
const htmlPath = path.join(dist, "app/index.html");
if (fs.existsSync(htmlPath)) {
  const link = /<link[^>]+rel="manifest"[^>]+href="([^"]+)"/.exec(fs.readFileSync(htmlPath, "utf8"));
  if (!link) problems.push("the built page links no manifest at all");
  else if (!list.includes(link[1])) problems.push(`the page links ${link[1]} and it is not precached`);
}

/* The runtime is deliberately NOT precached — 12 MB, fetched on first use — but
   a deploy tree that does not carry it cannot answer anything offline, so it is
   reported rather than assumed. */
if (arg) {
  for (const f of ["app/vendor/pyodide/pyodide.mjs", "app/vendor/pyodide/pyodide.asm.wasm",
                   "app/vendor/pyodide/python_stdlib.zip"]) {
    if (!fs.existsSync(path.join(dist, f))) problems.push(`${f} is missing — the engine cannot start offline`);
  }
}

console.log(`precache entries: ${list.length}`);
for (const p of problems) console.log(`  ${p}`);
console.log(problems.length
  ? `\nRESULT: RED — ${problems.length} problem(s)`
  : "\nRESULT: every precached path is served from where it is served from");
process.exit(problems.length ? 1 : 0);
