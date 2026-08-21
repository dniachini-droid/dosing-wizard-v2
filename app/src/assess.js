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
import { toEngineEvents } from "./store/ledger.js";

/* `asOf` is the assessment instant. The application supplies it; nothing below
   this line invents one. */
export function nowAsOf() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

/* Run one assessment and store it if it is a new answer.

   `store` is the wired store; `asOf` is required. The caller decides when an
   assessment happens — this function never decides for itself. */
export async function runAssessment(store, asOf) {
  const [projected, configurationHistory, versions] = await Promise.all([
    store.ledger.projection(),
    store.config.forEngine(),
    describe(),
  ]);

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

  const events = toEngineEvents(projected);
  const inputEventIds = projected
    .filter((r) => r.state !== "SUPERSEDED" && r.state !== "INVALID")
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

  const [projected, configurationHistory, versions] = await Promise.all([
    store.ledger.projection(),
    store.config.forEngine(),
    describe(),
  ]);

  const keep = new Set(rec.inputEventIds);
  const events = toEngineEvents(projected.filter((r) => keep.has(r.event.eventId)));
  const engineResult = await callEngine({ events, configurationHistory, asOf: rec.asOf });

  const sameVersions =
    versions.engineVersion === rec.engineVersion && versions.canonVersion === rec.canonVersion;

  return {
    state: "REPLAYED",
    record: rec,
    engineResult,
    identical: JSON.stringify(engineResult) === rec.fingerprint,
    sameVersions,
    versionsNow: versions,
    /* How many of the named input events are still findable. An edit does not
       remove an event — nothing does — but a superseded one drops out of the
       current view, and that is exactly the case worth naming. */
    inputEventsStillPresent: events.length,
    inputEventsNamed: rec.inputEventIds.length,
  };
}
