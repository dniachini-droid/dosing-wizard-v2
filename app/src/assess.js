/* ============================================================================
   alk.assess — THE SINGLE ENTRY POINT
   ----------------------------------------------------------------------------
   `ALK-V2-MODULE-DESIGN.md` §2: "Loads the ledger and configuration history
   through ports, calls the pure pipeline with an explicit `asOf`, persists the
   `EngineResult` and `AuditTrace`. **Contains no chemistry.**"

   That is the whole of this file's job, and the whole of its licence. Read it
   looking for a threshold, a comparison against a band edge, a date arithmetic
   that decides anything — there is none, and there must never be one.

   The clock is read HERE and passed down as an argument. `INV-A2` forbids the
   domain holding a clock; the application holds it, which is why `asOf` is an
   explicit parameter of every call below and never a default inside one.
   ========================================================================= */

import { assess as callEngine, describe } from "./engine/client.js";
import { happenedBy, toEngineEvents } from "./store/ledger.js";
import { nowIso } from "./store/time.js";

/* `asOf` is the assessment instant. The application supplies it; nothing below
   this line invents one.

   It reads the application's clock (`time.js`) rather than `new Date()`
   directly, and that one indirection is the whole of test mode's mechanism.
   When the keeper sets the assessment instant, this function returns it — and
   `runAssessment` below, the engine client, the worker and the engine itself
   are untouched, because they were already written to take the instant as an
   argument. There is no second pipeline to keep in step with this one. */
export function nowAsOf() {
  return nowIso();
}

/* Run one assessment and store it if it is a new answer.

   `store` is the wired store; `asOf` is required. The caller decides when an
   assessment happens — this function never decides for itself. */
export async function runAssessment(store, asOf) {
  /* READ THE RECORD FIRST, AND BELIEVE A FAILURE.

     If the ledger cannot be read, there is no assessment to make. The one
     thing that must not happen is the one that used to: a failed read
     returning an empty list, the engine being asked what it makes of a tank
     with no history, and the answer being STORED — a stamped, permanent,
     false entry in the keeper's own record.

     So a storage failure is its own state. It is not an engine failure and it
     is not an empty tank, and nothing below this point runs. */
  let projected, configurationHistory, versions;
  try {
    [projected, configurationHistory, versions] = await Promise.all([
      store.ledger.projection(),
      store.config.forEngine(),
      describe(),
    ]);
  } catch (e) {
    return {
      state: "STORAGE_UNAVAILABLE",
      engineResult: null,
      record: null,
      asOf,
      error: e && e.message,
    };
  }

  if (!configurationHistory.length) {
    /* No configuration means the engine has nothing to resolve against. This
       is not an engine refusal and must not be dressed as one: it is the app
       saying setup has not happened. It carries no reason code because it is
       not the engine's statement. */
    return {
      state: "NO_CONFIGURATION",
      engineResult: null,
      record: null,
      asOf,
    };
  }

  const events = toEngineEvents(projected, asOf);
  /* The events the engine was actually given, named as its inputs. It used to
     name every live row, which on a backdated assessment included records that
     had not happened yet — so a replay would report events "still present" that
     the original run never read. */
  const inputEventIds = projected
    .filter((r) => r.state !== "SUPERSEDED" && r.state !== "INVALID")
    .filter((r) => happenedBy(r.event.time, asOf))
    .map((r) => r.event.eventId);

  const engineResult = await callEngine({ events, configurationHistory, asOf });

  const { record } = await store.assessments.record({
    engineResult,
    auditTrace: engineResult.auditTrace || null,
    asOf,
    localDate: asOf.slice(0, 10),
    inputEventIds,
    configVersionId: engineResult.configVersionId,
    describe: versions,
  });

  return { state: "ASSESSED", engineResult, record, asOf };
}

/* Replay: run the engine again over the events a stored assessment names, and
   report whether it still says the same thing.

   Canon §64's replay condition is the same ledger, the same configuration
   versions AND the same engine version. So a mismatch is only meaningful when
   the versions match, and this reports the versions alongside the comparison
   rather than announcing a divergence that is really an upgrade. */
export async function replay(store, assessmentId) {
  const rec = await store.assessments.byId(assessmentId);
  if (!rec) return { state: "NOT_FOUND" };

  const [projected, versions, configThen] = await Promise.all([
    store.ledger.projection(),
    describe(),
    /* The configuration the assessment NAMED, not the one in force today.
       Canon §64's third condition. */
    store.config.forEngineUpTo(rec.configVersionId),
  ]);

  if (!configThen) {
    /* The assessment names a configuration version this device does not hold.
       That is a real answer — "this cannot be replayed here" — and it is not
       the same as "the engine now disagrees". Replaying against today's
       configuration instead would produce a difference and blame it on the
       engine. */
    return { state: "CONFIGURATION_UNAVAILABLE", record: rec, configVersionId: rec.configVersionId };
  }

  const keep = new Set(rec.inputEventIds);
  const kept = projected.filter((r) => keep.has(r.event.eventId));
  const events = toEngineEvents(kept, rec.asOf);
  const engineResult = await callEngine({
    events,
    configurationHistory: configThen,
    asOf: rec.asOf,
  });

  const sameEngineVersion = versions.engineVersion === rec.engineVersion;
  const sameCanonVersion = versions.canonVersion === rec.canonVersion;

  return {
    state: "REPLAYED",
    record: rec,
    engineResult,
    identical: JSON.stringify(engineResult) === rec.fingerprint,
    /* Reported as three separate conditions rather than one boolean, so a
       divergence names its own cause instead of being folded into "differs".
       An engine upgrade, a canon reissue and a settings change are three
       different explanations and the keeper is owed the right one. */
    sameEngineVersion,
    sameCanonVersion,
    sameVersions: sameEngineVersion && sameCanonVersion,
    replayedAgainstConfigVersionId: rec.configVersionId,
    versionsNow: versions,
    /* How many of the named input events are still findable.

       Counted over the SAME population that named them. `inputEventIds` is
       every live row of the ledger; `toEngineEvents` keeps only the six kinds
       the engine consumes. Comparing one against the other reported
       "still present < named" on a perfectly intact ledger the moment it held
       a note or a calcium reading — which the interface then showed the keeper
       as "your history has changed". It had not. */
    inputEventsStillPresent: kept.length,
    inputEventsNamed: rec.inputEventIds.length,
    /* Kept separately, because "how much of this reached the engine" is a real
       question and it is a different one. */
    engineEventsReplayed: events.length,
  };
}
