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
/* An ISO instant, as a shape. Second or millisecond resolution, with an
   offset or a `Z`. */
const INSTANT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/* The engine's answer with the clock taken out of it.

   Used only to decide whether a result says something new. It reads no field
   for meaning, decides nothing about chemistry, and never reaches the stored
   record — which keeps the engine's output verbatim, as it must. */
export function answerFingerprint(engineResult) {
  const strip = (v) => {
    if (Array.isArray(v)) return v.map(strip);
    if (v && typeof v === "object") {
      const out = {};
      for (const k of Object.keys(v).sort()) out[k] = strip(v[k]);
      return out;
    }
    if (typeof v === "string" && INSTANT.test(v)) return "\u2014";
    return v;
  };
  return JSON.stringify(strip(engineResult));
}

export function createAssessmentStore(backend) {
  /* WRITES ARE SERIALISED, BECAUSE CHECKING THEN ACTING IS NOT ENOUGH.

     `record()` reads what is stored, picks the next free id, and writes. Every
     one of those steps awaits, and an await is a yield: two writes started
     inside the same second both got past the "does this id exist?" check
     before either wrote, chose the same id, and one silently replaced the
     other — the exact overwrite the guard below exists to prevent, walking
     straight through it.

     A retry loop cannot fix a check-then-act race; it only narrows the window.
     So writes queue. The queue is per store instance, which is the same scope
     as the backend it writes through. */
  let writeQueue = Promise.resolve();
  function serialised(fn) {
    const run = writeQueue.then(fn, fn);
    /* The queue must not inherit a rejection, or one failed write would
       reject every write after it. */
    writeQueue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  /* Ordered by WHEN, then by the counter — as numbers, not as text.

     This sorted the id strings, and the ids carry an unpadded suffix, so
     `…#10` sorted before `…#2` and `latest()` returned the wrong record once
     ten assessments shared an instant. The suffix is padded now, and the sort
     is on the two fields rather than on their concatenation, so neither
     depends on the other being right. */
  async function all() {
    const list = await backend.all(ASSESSMENTS);
    return list.sort((a, b) => {
      if (a.asOf !== b.asOf) return a.asOf < b.asOf ? -1 : 1;
      return (a.asOfOrdinal || 0) - (b.asOfOrdinal || 0);
    });
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
  async function record(args) {
    return serialised(() => recordNow(args));
  }

  async function recordNow({ engineResult, auditTrace = null, asOf, localDate, inputEventIds, configVersionId, describe }) {
    const list = await all();
    const previous = list.length ? list[list.length - 1] : null;

    const fingerprint = JSON.stringify(engineResult);

    /* IS THIS A NEW ANSWER, OR THE SAME ANSWER LOOKED AT AGAIN?

       The test used to be `fingerprint === previous.fingerprint && asOf ===
       previous.asOf`, and BOTH halves always differed. `asOf` is a fresh
       instant on every run, and it also appears INSIDE the engine result — as
       `assessmentAsOf`, as `retest.recommendedAt`, on every retest candidate.
       So every open of the app wrote a new stored assessment. The keeper's
       assessment history became a log of how often they opened the app, on a
       phone, without bound.

       The answer is what the engine concluded. Two results that differ only in
       the instants they were computed at are one answer, seen twice — which is
       what the comment at the head of this file always said and what the code
       did not do.

       Instants are removed by SHAPE, not by naming the fields that carry them,
       so a timestamp the contract adds tomorrow cannot quietly start splitting
       every assessment into two again. The stored record is untouched: this
       normalisation exists only to compare. */
    const answerprint = answerFingerprint(engineResult);
    if (previous && previous.answerprint === answerprint) {
      return { stored: false, record: previous };
    }

    /* The id is unique per record, not per instant: two assessments can share
       an `asOf` when the ledger changed underneath them, and both must survive.
       A suffix counts them rather than one silently replacing the other.

       The suffix is NOT padded, and that is deliberate. Padding would also
       make the ids sort correctly as text, which would be a second thing
       keeping the order right alongside `all()`'s comparator — and canon
       `MASTER RULE 1` is explicit that two implementations agreeing today is a
       defect rather than a coincidence. The ordinal is the field; `all()` is
       its only reader; the id is an identity and nothing sorts on it. */
    /* The ordinal is derived from what is already stored, so two assessments
       that start inside the same second — the app's own reassess and anything
       else that asks — can both read the same count and choose the same id.
       The `get` below refuses to overwrite, which is right; without this the
       loser of that race simply lost its assessment.

       So the id is claimed rather than assumed: take the next free ordinal,
       and if something took it in between, take the one after. Bounded,
       because an unbounded loop here would hang the app rather than fail it. */
    const idFor = (n) => (n ? `ASSESS-${asOf}#${n}` : `ASSESS-${asOf}`);
    let asOfOrdinal = list.filter((r) => r.asOf === asOf).length;
    for (let tries = 0; (await backend.get(ASSESSMENTS, idFor(asOfOrdinal))) != null; tries += 1) {
      if (tries >= 64) throw new Error(t("err.assessmentIdExhausted", { asOf }));
      asOfOrdinal += 1;
    }
    const assessmentId = idFor(asOfOrdinal);

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
      asOfOrdinal,
      engineResult,
      auditTrace,
      /* The verbatim result, and the comparison key. Both are kept: the first
         is the record, the second is only ever used to decide whether this was
         already said. */
      fingerprint,
      answerprint,
    });

    /* No second existence check here. The loop above already established that
       this id is free, and writes are serialised so nothing can have taken it
       in between. A duplicate check would be a second owner of "never
       overwrite an assessment" — and canon `MASTER RULE 1` is explicit that
       two implementations agreeing today is a defect, not a coincidence. It
       was also unreachable, which is how it came to be noticed: the mutation
       that deleted it changed no observable behaviour at all. */
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
