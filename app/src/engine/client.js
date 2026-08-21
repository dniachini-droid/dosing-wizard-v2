/* ============================================================================
   THE APPLICATION'S SIDE OF THE ENGINE BOUNDARY
   ----------------------------------------------------------------------------
   `ALK-V2-MODULE-DESIGN.md` §2: `alk.assess` is the single entry point. It
   loads the ledger and configuration history through ports, calls the pure
   pipeline with an EXPLICIT `asOf`, persists the result — and contains no
   chemistry.

   This module is that entry point's transport half. It holds one worker, hands
   it `(events, configurationHistory, asOf)` and returns what came back. It
   reads no field of the result.

   The clock lives here and nowhere below it (`INV-A2`). The caller supplies
   `asOf`; this module never invents one.
   ========================================================================= */

import { t } from "../strings.js";

const STATE = { NOT_STARTED: "NOT_STARTED", STARTING: "STARTING", READY: "READY", FAILED: "FAILED" };

let worker = null;
let seq = 0;
const pending = new Map();
let state = STATE.NOT_STARTED;
let lastError = null;
const watchers = new Set();

function announce() {
  watchers.forEach((fn) => fn({ state, error: lastError }));
}

/* The engine's readiness is a rendered state, not a spinner that means nothing.
   A screen subscribes so it can say "still starting up" or "the engine could
   not start" in words, rather than showing an empty card. */
export function onEngineState(fn) {
  watchers.add(fn);
  fn({ state, error: lastError });
  return () => watchers.delete(fn);
}

export function engineState() {
  return { state, error: lastError };
}

export const ENGINE_STATE = STATE;

function ensureWorker() {
  if (worker) return worker;
  state = STATE.STARTING;
  announce();
  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" });
  worker.onmessage = (ev) => {
    const { id, ok, result, error } = ev.data || {};
    const slot = pending.get(id);
    if (!slot) return;
    pending.delete(id);
    if (ok) {
      if (state !== STATE.READY) {
        state = STATE.READY;
        lastError = null;
        announce();
      }
      slot.resolve(result);
    } else {
      state = STATE.FAILED;
      lastError = error;
      announce();
      slot.reject(new Error(error));
    }
  };
  worker.onerror = (e) => {
    state = STATE.FAILED;
    lastError = (e && e.message) || t("err.engineNoStart");
    announce();
    pending.forEach((slot) => slot.reject(new Error(lastError)));
    pending.clear();
  };
  return worker;
}

function call(op, request) {
  const w = ensureWorker();
  const id = ++seq;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    w.postMessage({ id, op, request });
  });
}

/* Canon §47/§64: a replay is stamped with the version that produced it. The
   application asks the engine what those versions are rather than holding its
   own copy, because a copy is a second owner and would drift. */
export function describe() {
  return call("describe", null);
}

/* The one call that matters. Three arguments, exactly as the module design
   declares them, and nothing else crosses. */
export function assess({ events, configurationHistory, asOf }) {
  if (!asOf) throw new Error(t("err.assessNeedsAsOf"));
  return call("assess", { events, configurationHistory, asOf });
}

/* Starting the runtime is a 12 MB decompress and takes a few seconds on a
   phone. Nothing else in the app needs it, so it is started when the app is
   idle rather than blocking first paint: logging a reading, browsing history
   and completing a task all work before the engine has finished booting. */
export function warmUp() {
  if (state === STATE.NOT_STARTED) describe().catch(() => {});
}
