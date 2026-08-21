/* ---------------------------------- the database ----------------------------------
 *
 * Ported from V1 `src/lib/idb.js`, which `docs/migration/V1-APPLICATION-SALVAGE.md`
 * §7 dispositions `PORT_AS_IS`: "One database, one connection, one version
 * constant, one `STORES` list, `onupgradeneeded` creating only what is missing,
 * and a written version history."
 *
 * The reasoning is V1's and is carried across with the code, because it is the
 * reason the shape is what it is: a second module opening the same database at
 * its own version fails with a `VersionError`, that module degrades, and its
 * data falls back somewhere worse permanently — a regression caused by a change
 * that never touched it.
 *
 * So: adding a store means adding its name to STORES and bumping DB_VERSION
 * once, here. `onupgradeneeded` creates only what is missing, so an existing
 * database keeps every store and every value it already had.
 *
 * Version history:
 *   1  events, annotations, assessments, tasks, completions, configurations,
 *      keyvalue, witness — the first application build
 *
 * What V2 adds that V1 did not have: the schema-version contract from V1 canon
 * `wizard-states.md` §18, which V1 wrote and never implemented. Every schema
 * change requires a forward migration and a test that migrates a fixture from
 * every previous version; on migration failure the app enters read-only and
 * surfaces an export button rather than starting empty and silent. `SCHEMA`
 * below is where that begins; `migrations.js` is where it continues.
 */

import { t } from "../strings.js";

export const DB_NAME = "dosing-wizard-v2";
export const DB_VERSION = 1;

export const EVENTS = "events";
export const ANNOTATIONS = "annotations";
export const ASSESSMENTS = "assessments";
export const TASKS = "tasks";
export const COMPLETIONS = "completions";
export const CONFIGURATIONS = "configurations";
export const KV = "keyvalue";
export const WITNESS = "witness";

const STORES = [
  EVENTS,
  ANNOTATIONS,
  ASSESSMENTS,
  TASKS,
  COMPLETIONS,
  CONFIGURATIONS,
  KV,
  WITNESS,
];

/* An open that neither succeeds nor fails is a real state, not a hypothetical:
   `onblocked` fires when another tab holds an older version of the database
   open, and until that tab goes away nothing else happens. Waiting forever
   would hang the load, so the open is raced against a clock and every caller
   falls back to whatever still works without it. */
const OPEN_TIMEOUT_MS = 4000;

let dbPromise = null;
let lastReason = null;

/* Why a connection is dropped rather than repaired: it is memoised, so a
   connection that has turned out to be unusable would otherwise be handed to
   every later caller. */
const onCloseListeners = new Set();
export function onDbClosed(fn) {
  onCloseListeners.add(fn);
}

export function closeDb() {
  const pending = dbPromise;
  dbPromise = null;
  lastReason = null;
  for (const fn of onCloseListeners) fn();
  if (pending) {
    pending.then(
      (db) => {
        try {
          if (db) db.close();
        } catch {
          /* already gone */
        }
      },
      () => {}
    );
  }
}

function openDb() {
  return new Promise((resolve) => {
    let idb;
    try {
      idb = self.indexedDB;
    } catch {
      idb = null;
    }
    if (!idb || typeof idb.open !== "function") {
      lastReason = t("err.dbNoIndexedDb");
      return resolve(null);
    }

    let settled = false;
    const done = (db, reason) => {
      if (settled) return;
      settled = true;
      if (reason) lastReason = reason;
      resolve(db);
    };
    const timer = setTimeout(() => done(null, t("err.dbTimeout")), OPEN_TIMEOUT_MS);
    const finish = (db, reason) => {
      clearTimeout(timer);
      done(db, reason);
    };

    let req;
    try {
      req = idb.open(DB_NAME, DB_VERSION);
    } catch (e) {
      /* Safari in a private window has historically thrown here rather than
         reporting an error on the request. */
      return finish(null, (e && e.message) || t("err.dbCouldNotOpen"));
    }
    if (!req || typeof req !== "object") return finish(null, t("err.dbCouldNotOpen"));

    req.onupgradeneeded = () => {
      try {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name);
        }
      } catch {
        /* reported by the failure that follows */
      }
    };
    req.onerror = () =>
      finish(null, (req.error && req.error.message) || t("err.dbCouldNotOpen"));
    req.onblocked = () => finish(null, t("err.dbBlocked"));
    req.onsuccess = () => {
      const db = req.result;
      if (!db || !db.objectStoreNames) return finish(null, t("err.dbMissingStores"));
      /* A connection that dies later — the database is deleted, or a newer
         version wants in — must not be handed out again. Both go through the
         same teardown as an explicit close, so there is one way to forget a
         connection rather than three that have to agree. */
      db.onclose = closeDb;
      db.onversionchange = closeDb;
      finish(db, null);
    };
  });
}

function db() {
  if (!dbPromise) dbPromise = openDb();
  return dbPromise;
}

/* One transaction, one result. `ok: false` always carries a `reason` a human
   could act on — the app says what happened rather than showing nothing. */
export function run(store, mode, fn) {
  return db().then(
    (conn) => {
      if (!conn) return { ok: false, value: undefined, reason: lastReason };
      if (!conn.objectStoreNames.contains(store)) {
        return { ok: false, value: undefined, reason: t("err.dbMissingStores") };
      }
      return new Promise((resolve) => {
        let tx;
        try {
          tx = conn.transaction(store, mode);
        } catch (e) {
          dbPromise = null;
          return resolve({
            ok: false,
            value: undefined,
            reason: (e && e.message) || t("err.dbUnusable"),
          });
        }
        let req;
        try {
          req = fn(tx.objectStore(store));
        } catch (e) {
          return resolve({
            ok: false,
            value: undefined,
            reason: (e && e.message) || t("err.notStored"),
          });
        }
        /* The request's own error is the useful one; the transaction's abort is
           the backstop for a quota refusal, which surfaces there instead. */
        req.onsuccess = () => resolve({ ok: true, value: req.result, reason: null });
        req.onerror = () =>
          resolve({
            ok: false,
            value: undefined,
            reason: (req.error && req.error.message) || t("err.notStored"),
          });
        tx.onabort = () =>
          resolve({
            ok: false,
            value: undefined,
            reason: (tx.error && tx.error.message) || t("err.noRoom"),
          });
      });
    },
    (e) => ({ ok: false, value: undefined, reason: (e && e.message) || t("err.dbUnusable") })
  );
}

/* ---------------------------------------------------------------------------
   The backend interface the rest of the store is written against.

   The store's rules — append-only, provenance never improving, an assessment
   never rewritten — are the part that must be tested exhaustively, and they do
   not depend on IndexedDB. So they are written against this six-method
   interface, IndexedDB is one implementation of it, and an in-memory map is
   another. The tests exercise the same rules the phone does.
   ------------------------------------------------------------------------ */

export const idbBackend = {
  async get(store, key) {
    const r = await run(store, "readonly", (s) => s.get(key));
    /* Same rule: `undefined` means "no such key", not "could not look". */
    if (!r.ok) throw new Error(r.reason || t("err.notRead"));
    return r.value;
  },
  async put(store, key, value) {
    const r = await run(store, "readwrite", (s) => s.put(value, key));
    if (!r.ok) throw new Error(r.reason || t("err.notStored"));
    return true;
  },
  async del(store, key) {
    const r = await run(store, "readwrite", (s) => s.delete(key));
    if (!r.ok) throw new Error(r.reason || t("err.notRemoved"));
    return true;
  },
  /* A FAILED READ IS NOT AN EMPTY TANK.

     These two used to return `[]` when the read failed, which made a degraded
     IndexedDB — storage pressure, an evicted origin, a corrupt store, an
     aborted transaction — indistinguishable from a keeper who has never
     logged anything. The consequence was not a blank screen: `projection()`
     returned nothing, `toEngineEvents` returned nothing, and `runAssessment`
     went on to call the engine and STORE a version-stamped assessment
     computed from no history at all. A permanent, false entry in the keeper's
     own record, written by the app, saying the engine had nothing to work
     from on a day when it had everything.

     `put` and `del` on this same object have always thrown. These now do too.
     An empty array from here means empty; a failure raises. */
  async keys(store) {
    const r = await run(store, "readonly", (s) => s.getAllKeys());
    if (!r.ok) throw new Error(r.reason || t("err.notRead"));
    return r.value || [];
  },
  async all(store) {
    const r = await run(store, "readonly", (s) => s.getAll());
    if (!r.ok) throw new Error(r.reason || t("err.notRead"));
    return r.value || [];
  },
  async health() {
    const conn = await db();
    return conn ? { ok: true, reason: null } : { ok: false, reason: lastReason };
  },
};

export function memoryBackend() {
  const m = new Map();
  const of = (store) => {
    if (!m.has(store)) m.set(store, new Map());
    return m.get(store);
  };
  /* Structured-clone semantics, approximated: IndexedDB stores a copy, so a
     caller mutating the object it handed over must not change what is stored.
     A memory backend that handed back the same reference would let a test pass
     that the phone would fail. */
  const copy = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));
  return {
    async get(store, key) {
      return copy(of(store).get(key));
    },
    async put(store, key, value) {
      of(store).set(key, copy(value));
      return true;
    },
    async del(store, key) {
      of(store).delete(key);
      return true;
    },
    async keys(store) {
      return [...of(store).keys()].sort();
    },
    async all(store) {
      return [...of(store).keys()].sort().map((k) => copy(of(store).get(k)));
    },
    async health() {
      return { ok: true, reason: null };
    },
  };
}
