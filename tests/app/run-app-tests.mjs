/* ============================================================================
   THE APPLICATION-LAYER TEST RUN
   ----------------------------------------------------------------------------
       node tests/app/run-app-tests.mjs              # the tests
       node tests/app/run-app-tests.mjs --mutations  # and their negative controls

   No dependencies. Node and nothing else, matching the discipline the engine
   and the conformance harness already hold themselves to.

   THE MUTATION ARM
   ----------------

   `tools/conformance/run-mutations.py`'s pattern, applied here. Each mutation
   in `mutations.mjs` is copied over a throwaway tree, the suite is re-run
   against that tree, and the named tests MUST go red. A mutation that leaves
   every test green is reported as MISSED and the run fails — because it means
   the test it was written for is not actually checking what it claims to.
   ========================================================================= */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { MUTATIONS } from "./mutations.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(path.dirname(HERE));

/* THE PORT MANIFEST IS PART OF THIS RUN.

   It was not, and a review found the consequence: `check-port-manifest.mjs`
   was RED across two commits and nobody noticed, because it was an npm script
   nothing called and this repository has no CI. A gate that can sit red
   unnoticed is a gate in name.

   It runs here, first, because it is cheap and because a tree whose ported
   files no longer match their record is a tree whose test results are about
   something other than what the manifest describes. */
function portManifest() {
  try {
    const out = execFileSync("node", [path.join(ROOT, "tools/port/check-port-manifest.mjs")], {
      encoding: "utf8",
      stdio: "pipe",
    });
    return { ok: true, out };
  } catch (e) {
    return { ok: false, out: (e.stdout || "") + (e.stderr || "") };
  }
}

const SUITES = [
  "test-ledger.mjs",
  "test-assessments.mjs",
  "test-cards.mjs",
  "test-schedule.mjs",
  "test-suggestion.mjs",
  "test-testmode.mjs",
  "test-import.mjs",
  "test-strings.mjs",
  /* The V1 interface port's own suites. Each one pins a rule the port had to
     hold, and `mutations.mjs` carries a source change that must turn each of
     them red. */
  "test-port.mjs",
];

/* Run every suite from a given tree, and return {id -> error|null}. A fresh
   cache-busting query is appended so the mutated copies are not served from
   the module cache of an earlier run. */
async function runFrom(testsDir, stamp) {
  const results = new Map();
  for (const file of SUITES) {
    const url = pathToFileURL(path.join(testsDir, file)).href + `?v=${stamp}`;
    let suite;
    try {
      suite = (await import(url)).default;
    } catch (e) {
      /* A mutation can make a module unloadable. That is a red result for
         every test in the suite, not a crash of the run. */
      results.set(file, { loadError: e.message });
      continue;
    }
    for (const c of suite.cases) {
      try {
        await c.fn();
        results.set(c.id, null);
      } catch (e) {
        results.set(c.id, e);
      }
    }
  }
  return results;
}

function line(id, description, err) {
  const mark = err ? "FAIL" : "PASS";
  return `[${mark.padEnd(4)}] ${id.padEnd(9)} ${description}`;
}

async function main() {
  const wantMutations = process.argv.includes("--mutations");

  console.log("=".repeat(74));
  console.log("APPLICATION-LAYER TESTS");
  console.log("=".repeat(74));

  const manifest = portManifest();
  console.log("\nport manifest");
  console.log("  " + (manifest.ok ? "[PASS]" : "[FAIL]") + "   every ported line is accounted for");
  if (!manifest.ok) console.log("         " + manifest.out.trim().split("\n").join("\n         "));

  let failures = manifest.ok ? 0 : 1;
  const all = [];
  for (const file of SUITES) {
    const suite = (await import(pathToFileURL(path.join(HERE, file)).href)).default;
    console.log(`\n${suite.name}`);
    for (const c of suite.cases) {
      let err = null;
      try {
        await c.fn();
      } catch (e) {
        err = e;
      }
      all.push({ ...c, suite: suite.name });
      console.log("  " + line(c.id, c.description, err));
      if (err) {
        failures += 1;
        console.log("         " + String(err.message).split("\n").join("\n         "));
      }
    }
  }

  console.log("\n" + "=".repeat(74));
  console.log(`${all.length + 1} checks, ${failures} failure(s)`);

  if (!wantMutations) {
    console.log(failures ? "\nRESULT: RED" : "\nRESULT: GREEN");
    console.log("=".repeat(74));
    return failures ? 1 : 0;
  }

  /* ---------------------------------------------------------------------
     The negative controls.
     ------------------------------------------------------------------ */
  console.log("\n" + "=".repeat(74));
  console.log("NEGATIVE CONTROLS — each mutation must turn its named tests red");
  console.log("=".repeat(74));

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "dw2-mut-"));
  let missed = 0;
  let notApplied = 0;

  for (const [i, m] of MUTATIONS.entries()) {
    const tree = path.join(tmp, m.id);
    fs.cpSync(path.join(ROOT, "app"), path.join(tree, "app"), { recursive: true });
    fs.cpSync(HERE, path.join(tree, "tests", "app"), { recursive: true });
    /* The engine source and the reason-code catalogue are read by the strings
       test; they are not mutated, so they are linked rather than copied. */
    fs.cpSync(path.join(ROOT, "engine"), path.join(tree, "engine"), { recursive: true });
    /* AND `docs`, WITHOUT WHICH THE ARM LIES ABOUT ITSELF.

       `test-strings.mjs` reads the data contract out of `docs/` to build the
       closed vocabulary `STR-06` checks. It was not copied, so `STR-06` was RED
       in every mutation tree before any mutation was applied — which made
       `AM-60`, the one control that names it, report CAUGHT on every run
       without `STR-06` ever having detected anything. A negative control that
       cannot distinguish the mutation from its own environment is not a
       control, and it made "0 missed" a claim the arm had not earned.

       Found by an independent test review, which proved it with a no-op
       mutation: it reported CAUGHT before this line and SURVIVED after. */
    fs.cpSync(path.join(ROOT, "docs"), path.join(tree, "docs"), { recursive: true });
    /* AND `tools/port`, for the same reason and found the same way.

       `META-02` reads the port map and the V2-original list, and `PORT-16`
       imports the manifest module. Without this those two were RED in every
       mutation tree before any mutation was applied, so `AM-P35` and `AM-P36`
       would have reported CAUGHT whatever they did. Only `tools/port` is
       copied: nothing here mutates the conformance harness. */
    fs.cpSync(path.join(ROOT, "tools", "port"), path.join(tree, "tools", "port"), { recursive: true });

    const target = path.join(tree, m.file);
    const before = fs.readFileSync(target, "utf8");
    if (!before.includes(m.find)) {
      console.log(`\n[BLOCKED] ${m.id}  its anchor text is no longer in ${m.file}`);
      console.log(`          ${m.why}`);
      console.log("          The mutation must be re-anchored, or the check it guards has moved.");
      notApplied += 1;
      continue;
    }
    fs.writeFileSync(target, before.replace(m.find, m.replace));

    const results = await runFrom(path.join(tree, "tests", "app"), `${i}-${Date.now()}`);
    const stillGreen = m.breaks.filter((id) => {
      const r = results.get(id);
      /* A test id that did not run at all. If SOME suite failed to load the id
         may genuinely have been in it, so it counts as red; if every suite
         loaded, the id does not exist and naming it is a defect in the
         mutation, not a catch. Reported rather than silently counted, because
         the previous form let a mutation name a test that had been renamed and
         still read as caught. */
      if (r === undefined) {
        const anyLoadError = [...results.values()].some((v) => v && v.loadError);
        if (!anyLoadError) console.log(`\n[WARNING ] ${m.id} names ${id}, which no suite defines`);
        return !anyLoadError;
      }
      return r === null;
    });

    if (stillGreen.length) {
      console.log(`\n[MISSED ] ${m.id}  ${m.why}`);
      console.log(`          still green: ${stillGreen.join(", ")}`);
      missed += 1;
    } else {
      console.log(`[CAUGHT ] ${m.id.padEnd(6)} ${m.why}`);
      console.log(`          caught by: ${m.breaks.join(", ")}`);
    }
  }

  fs.rmSync(tmp, { recursive: true, force: true });

  console.log("\n" + "=".repeat(74));
  console.log("VERDICT");
  console.log("=".repeat(74));
  console.log(`checks            : ${all.length}`);
  console.log(`check failures    : ${failures}`);
  console.log(`mutations defined : ${MUTATIONS.length}`);
  console.log(`mutations caught  : ${MUTATIONS.length - missed - notApplied}`);
  console.log(`mutations missed  : ${missed}`);
  console.log(`mutations blocked : ${notApplied}`);
  const red = failures > 0 || missed > 0 || notApplied > 0;
  console.log(`\nRESULT: ${red ? "RED" : "GREEN"}`);
  console.log("=".repeat(74));
  return red ? 1 : 0;
}

process.exit(await main());
