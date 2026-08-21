/* ============================================================================
   ASSESSMENTS ARE STORED RECORDS, NOT A LIVE VIEW
   ----------------------------------------------------------------------------
   An assessment the keeper acted on is a historical fact. If it is recomputed
   every time the screen is drawn, then editing a reading from three weeks ago
   silently rewrites what the app said three weeks ago, and the history stops
   being true. Canon §47 stamps a replay with the version that produced it, and
   §64 makes replay conditional on the same ledger, the same configuration
   versions and the same engine version — none of which can be recovered after
   the fact from a live view.

   So every actionable assessment is written down, once, with:

     - the engine result verbatim, exactly as it came back;
     - the audit trace;
     - the version stamps: engine, canon, configuration, and `asOf`;
     - the identity of every event that was in its input.

   And it is never rewritten. A re-analysis is a NEW assessment with a NEW id.
   The old one still says what it said.

   This is in the first commit of the application deliberately. Retrofitting it
   means a persistence rewrite plus a history that is already untrue for every
   record written before the rewrite.
   ========================================================================= */

import { ASSESSMENTS } from "./db.js";

import { t } from "../strings.js";

export const ASSESSMENT_SCHEMA_VERSION = 1;

/* Which results are worth writing down. Not every draw of the screen is an
   assessment: opening Today twice in a minute is one assessment looked at
   twice, not two. A result is stored when it is the first for its input set,
   or when the engine's answer differs from the last stored one.

   The comparison is over the engine's own output, not over a summary of it —
   comparing summaries would let a change the summary drops go unrecorded. */
export function createAssessmentStore(backend) {
  async function all() {
    const list = await backend.all(ASSESSMENTS);
    return list.sort((a, b) => (a.assessmentId < b.assessmentId ? -1 : 1));
  }

  async function latest() {
    const list = await all();
    return list.length ? list[list.length - 1] : null;
  }

  async function forDay(localDate) {
    const list = await all();
    return list.filter((r) => r.localDate === localDate);
  }

  async function byId(id) {
    return backend.get(ASSESSMENTS, id);
  }

  /* The write. Nothing here reads a field of `engineResult` for meaning — the
     result is stored as it arrived. The only inspection is the equality test
     that decides whether this is a new answer, and that compares the whole
     object. */
  async function record({ engineResult, auditTrace = null, asOf, localDate, inputEventIds, configVersionId, describe }) {
    const list = await all();
    const previous = list.length ? list[list.length - 1] : null;

    const fingerprint = JSON.stringify(engineResult);
    if (previous && previous.fingerprint === fingerprint && previous.asOf === asOf) {
      return { stored: false, record: previous };
    }

    /* The id is unique per record, not per instant: two assessments can share
       an `asOf` when the ledger changed underneath them, and both must survive.
       A suffix counts them rather than one silently replacing the other. */
    const sameAsOf = list.filter((r) => r.asOf === asOf).length;
    const assessmentId = sameAsOf ? `ASSESS-${asOf}#${sameAsOf}` : `ASSESS-${asOf}`;

    const rec = Object.freeze({
      assessmentId,
      schemaVersion: ASSESSMENT_SCHEMA_VERSION,
      parameter: "ALK",
      asOf,
      localDate,
      /* Canon §47: the stamps. All four, from the engine itself where the
         engine owns them — the app holds no copy of a version string. */
      engineVersion: (describe && describe.engineVersion) || engineResult.engineVersion || null,
      canonVersion: (describe && describe.canonVersion) || engineResult.canonVersion || null,
      configVersionId: configVersionId || engineResult.configVersionId || null,
      /* Canon §64's replay condition names the ledger. Naming the events makes
         "replay this assessment" a thing that can actually be done, and makes
         a later edit visible as a difference rather than invisible. */
      inputEventIds: [...inputEventIds],
      inputEventCount: inputEventIds.length,
      recordedAt: nowInstant(),
      engineResult,
      auditTrace,
      fingerprint,
    });

    if (await backend.get(ASSESSMENTS, rec.assessmentId)) {
      /* Belt and braces: an id that already exists is never overwritten. If
         this ever fires it is a defect, and it fails loudly rather than
         destroying a record. */
      throw new Error(t("err.assessmentExists", { id: rec.assessmentId }));
    }
    await backend.put(ASSESSMENTS, rec.assessmentId, rec);
    return { stored: true, record: rec };
  }

  return { record, all, latest, forDay, byId };
}

/* The application may read a clock. The domain may not (`INV-A2`), and does
   not: `asOf` is passed in from here. */
function nowInstant() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}
