/* ============================================================================
   THE ENGINE, RUNNING ON THE PHONE
   ----------------------------------------------------------------------------
   This worker runs `engine/alk_v2` — the actual Alk V2 domain engine, the same
   files the conformance harness runs, unmodified and unread by anything here —
   inside CPython compiled to WebAssembly.

   Why it is not a JavaScript port
   -------------------------------

   Canon `MASTER RULE 1`: one owner for each inference; "two implementations
   that agree today are a defect, not a coincidence." A JavaScript rewrite of
   the engine would be a second owner of every threshold, rail and equation in
   the canon, and the gate would only ever be measuring one of them.

   So the application does not reimplement the engine. It carries it.

   What this file is allowed to do
   -------------------------------

   `ALK-V2-MODULE-DESIGN.md` §2 calls the impure boundary `alk.assess`: it
   loads through ports, calls the pure pipeline with an explicit `asOf`, and
   contains NO chemistry. This file is the transport underneath that boundary.
   It moves JSON in and JSON out. It reads no field of the result, applies no
   default, and never manufactures a value: if the engine refuses, the refusal
   travels intact to the surface that has to render it.

   The clock is not in here either. `asOf` arrives as an argument from the
   application (canon §64, `INV-A2`).
   ========================================================================= */

let pyodideReady = null;

/* The engine's own files, fetched from the same origin the app was served
   from. Listed rather than globbed so the service worker can precache exactly
   this set and the worker can fail loudly on a missing one. */
const ENGINE_MODULES = [
  "__init__.py",
  "adapter.py",
  "capability.py",
  "catalogue.py",
  "constants.py",
  "dosing.py",
  "engine.py",
  "intervention.py",
  "kernel.py",
  "ledger.py",
  "observation.py",
  "potency.py",
  "response.py",
  "retest.py",
  "trajectory.py",
];

/* `catalogue.py` reads the frozen reason-code catalogue from a repository-
   relative path, because the reason-code table has one owner and the domain
   must not carry a copy of it. That path is reproduced inside the virtual
   filesystem so the engine finds the document exactly where it expects, and
   the app never parses the catalogue itself. */
const CATALOGUE_PATH = "docs/implementation/alk-v2/ALK-V2-REASON-CODES.md";

const BASE = new URL("../../../", self.location.href); /* repository root */

/* The one line of Python this file contains. It is source code, not text a
   keeper reads, so it does not live in the strings file — and it is named here
   rather than written inline so the string check can see what it is. */
const ASSESS_EXPRESSION = "json.dumps(adapter.assess(json.loads(_request_json)), default=str)";

async function fetchText(path) {
  const res = await fetch(new URL(path, BASE), { cache: "force-cache" });
  if (!res.ok) throw new Error(`could not load ${path} (${res.status})`);
  return res.text();
}

async function boot() {
  /* `@vite-ignore` and nothing else. The runtime is fetched and hash-verified
     by `tools/app/vendor-runtime.py` and is deliberately NOT committed — the
     script is in the repository, the 12 MB artefact is not, so the two can
     never drift apart. A bundler asked to resolve it at build time therefore
     finds nothing and stops. This tells it to leave the import alone and let
     the browser resolve it at run time, which is what it always did.

     Nothing else in this file changed. The engine's own files and the frozen
     reason-code catalogue are still fetched from the repository root, and the
     build serves the repository root for exactly that reason — see
     `vite.config.js`. */
  const { loadPyodide } = await import(/* @vite-ignore */ "../../vendor/pyodide/pyodide.mjs");
  const py = await loadPyodide({
    indexURL: new URL("app/vendor/pyodide/", BASE).href,
    stdout: () => {},
    stderr: () => {},
  });

  const [modules, catalogue] = await Promise.all([
    Promise.all(ENGINE_MODULES.map((m) => fetchText(`engine/alk_v2/${m}`))),
    fetchText(CATALOGUE_PATH),
  ]);

  py.FS.mkdirTree("/engine/alk_v2");
  ENGINE_MODULES.forEach((name, i) => {
    py.FS.writeFile(`/engine/alk_v2/${name}`, modules[i]);
  });

  /* `catalogue.py` walks three directories up from its own file to find the
     repository root, so the document goes at /docs/... — the same shape the
     engine has on disk. Reproducing the layout rather than patching the engine
     is the point: the engine is not modified to run here. */
  py.FS.mkdirTree(`/${CATALOGUE_PATH.split("/").slice(0, -1).join("/")}`);
  py.FS.writeFile(`/${CATALOGUE_PATH}`, catalogue);

  py.runPython(`
import sys, json
sys.path.insert(0, "/engine")
from alk_v2 import adapter
`);
  return py;
}

function ready() {
  if (!pyodideReady) pyodideReady = boot();
  return pyodideReady;
}

self.onmessage = async (ev) => {
  const { id, op, request } = ev.data || {};
  try {
    const py = await ready();
    /* One JSON string across the boundary in each direction. Passing a proxied
       object would let a JavaScript value leak into the domain's arguments and
       back out again with a different type than the engine returned. */
    const payload = JSON.stringify(op === "describe" ? { op: "describe" } : request);
    py.globals.set("_request_json", payload);
    const out = py.runPython(ASSESS_EXPRESSION);
    self.postMessage({ id, ok: true, result: JSON.parse(out) });
  } catch (err) {
    /* A transport failure is reported as a transport failure. It is never
       dressed up as an engine refusal — those have reason codes and this does
       not. */
    self.postMessage({
      id,
      ok: false,
      error: (err && err.message) || String(err),
    });
  }
};
