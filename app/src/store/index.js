/* ============================================================================
   The wired store
   ----------------------------------------------------------------------------
   One place that puts the ledger, the assessments, the tasks and the
   configuration together over one backend, so no screen ever reaches for a
   store directly and there is one place to swap IndexedDB for a memory map in
   a test.
   ========================================================================= */

import { idbBackend, memoryBackend, KV, WITNESS } from "./db.js";
import { createLedger } from "./ledger.js";
import { createAssessmentStore } from "./assessments.js";
import { createTaskStore } from "./schedule.js";
import { createConfigStore } from "./config.js";

export function createStore(backend) {
  const b = backend || idbBackend;
  return {
    backend: b,
    ledger: createLedger(b),
    assessments: createAssessmentStore(b),
    tasks: createTaskStore(b),
    config: createConfigStore(b),
    async kvGet(key) {
      return b.get(KV, key);
    },
    async kvSet(key, value) {
      return b.put(KV, key, value);
    },
    /* V1's `install-witness.js`, in the one form that is honest about its own
       limits. A witness record says "this device held data". Its absence after
       data existed means either a wipe or a first run, and this build does not
       claim to tell them apart — it says which of the two it can support.
       V1's own words: "On a full clear this module returns `fresh` or
       `suspect` and the app says nothing it cannot support. That is the honest
       limit and it is not papered over." */
    async witness() {
      const w = await b.get(WITNESS, "witness");
      const events = await b.keys("events");
      if (!w) {
        await b.put(WITNESS, "witness", { firstSeen: new Date().toISOString(), everHadData: events.length > 0 });
        return { state: events.length ? "SUSPECT" : "FRESH" };
      }
      if (w.everHadData && events.length === 0) return { state: "SUSPECT", since: w.firstSeen };
      if (events.length && !w.everHadData) {
        await b.put(WITNESS, "witness", { ...w, everHadData: true });
      }
      return { state: "KNOWN", since: w.firstSeen };
    },
    async health() {
      return b.health();
    },
  };
}

export function createMemoryStore() {
  return createStore(memoryBackend());
}
