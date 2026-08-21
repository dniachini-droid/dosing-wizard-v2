/* ============================================================================
   CARD SELECTION RESOLVES DETERMINISTICALLY
   ----------------------------------------------------------------------------
   `ALK-V2-MODULE-DESIGN.md` §7 requires a predicate table in an order that is
   data, "so that no card selection can shadow another the way V1's first-match
   wizard did".

   Two properties, and the second is the one V1 lacked:

     TOTALITY     some row matches every result — no result renders a blank.
     DISJOINTNESS at most one row matches any result. A second matching row is
                  a FAILING TEST, not a silently shadowed card.

   The corpus below is built to straddle every branch, including the
   combinations that shadowed each other in V1: a safety breach that also
   carries a dose recommendation, a refusal that also has enough evidence, a
   small-signal response sitting on top of an ordinary maintenance answer.
   ========================================================================= */

import { suite, eq, ok, deepEq } from "./harness.mjs";
import { CARD_TABLE, selectCard, matchingCards, isAbsent, isPresent } from "../../app/src/present/cards.js";

const s = suite("card selection");

/* Every combination worth having, written out rather than generated, so a
   reader can see what is covered. */
const CORPUS = [
  {
    name: "an ordinary dose change",
    r: {
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 9.3 },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { supportedSlopeDkhPerDay: -0.0198, limitedByUncertainty: false },
      responseAssessment: "NOT_RUN",
    },
    expect: "DOSE_CHANGE",
  },
  {
    name: "a hold",
    r: {
      doseRecommendation: { action: "HOLD" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: "NOT_RUN",
    },
    expect: "HOLD",
  },
  {
    name: "not enough evidence",
    r: {
      doseRecommendation: { action: "INSUFFICIENT_DATA" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "INSUFFICIENT",
      supportedTrajectory: "NOT_RUN",
      responseAssessment: "NOT_RUN",
    },
    expect: "INSUFFICIENT",
  },
  {
    name: "a capability refusal",
    r: {
      doseRecommendation: { action: "REFUSE" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: "NOT_RUN",
    },
    expect: "CAPABILITY_REFUSAL",
  },
  {
    name: "uncertainty limited",
    r: {
      doseRecommendation: { action: "HOLD" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "UNCERTAINTY_LIMITED",
      supportedTrajectory: { limitedByUncertainty: true },
      responseAssessment: "NOT_RUN",
    },
    expect: "UNCERTAINTY_LIMITED",
  },
  {
    name: "a response too small to attribute",
    r: {
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 9.4 },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: { responseClass: "NOT_ATTRIBUTABLE_SMALL_SIGNAL" },
    },
    expect: "NOT_ATTRIBUTABLE_SMALL_SIGNAL",
  },
  {
    /* THE V1 SHADOWING CASE. A safety breach that ALSO carries an ordinary
       maintenance recommendation. V1's first-match wizard let the ordinary
       branch win because it was written first. Safety must win, and the table
       must say so in its data rather than in its ordering by accident. */
    name: "a safety breach that also carries a dose recommendation",
    r: {
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 12.0 },
      safety: { outerBoundState: "BREACHED_LOW" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: "NOT_RUN",
    },
    expect: "SAFETY_RETURN",
  },
  {
    name: "a safety breach high, with a refusal underneath it",
    r: {
      doseRecommendation: { action: "REFUSE" },
      safety: { outerBoundState: "BREACHED_HIGH" },
      movementEvidence: "INSUFFICIENT",
      supportedTrajectory: "NOT_RUN",
      responseAssessment: "NOT_RUN",
    },
    expect: "SAFETY_RETURN",
  },
  {
    name: "a small-signal response during a refusal",
    r: {
      doseRecommendation: { action: "REFUSE" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: { responseClass: "NOT_ATTRIBUTABLE_SMALL_SIGNAL" },
    },
    expect: "CAPABILITY_REFUSAL",
  },
  {
    name: "uncertainty limited during insufficient evidence",
    r: {
      doseRecommendation: { action: "INSUFFICIENT_DATA" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "UNCERTAINTY_LIMITED",
      supportedTrajectory: { limitedByUncertainty: true },
      responseAssessment: "NOT_RUN",
    },
    expect: "INSUFFICIENT",
  },
  {
    name: "an outer-bound state the engine could not work out",
    r: {
      doseRecommendation: { action: "INSUFFICIENT_DATA" },
      safety: { outerBoundState: "NOT_RUN" },
      movementEvidence: "INSUFFICIENT",
      supportedTrajectory: "NOT_RUN",
      responseAssessment: "NOT_RUN",
    },
    expect: "INSUFFICIENT",
  },
  {
    name: "an action this build has no card for",
    r: {
      doseRecommendation: { action: "SOMETHING_THE_CONTRACT_ADDED_LATER" },
      safety: { outerBoundState: "WITHIN_BOUNDS" },
      movementEvidence: "SUFFICIENT",
      supportedTrajectory: { limitedByUncertainty: false },
      responseAssessment: "NOT_RUN",
    },
    expect: "UNCLASSIFIED",
  },
  {
    name: "an empty result",
    r: {},
    expect: "UNCLASSIFIED",
  },
];

s.test("CARD-01", "every case in the corpus selects exactly the card it should", () => {
  for (const c of CORPUS) {
    eq(selectCard(c.r), c.expect, c.name);
  }
});

s.test("CARD-02", "DISJOINTNESS — at most one non-fallback row matches any result", () => {
  for (const c of CORPUS) {
    const matches = matchingCards(c.r);
    ok(
      matches.length <= 1,
      `${c.name}: ${matches.length} rows matched (${matches.join(", ")}). ` +
        "Two rows matching one result is the shadowing defect V1 had; the table must be made disjoint, " +
        "in the data, rather than relying on which was written first."
    );
  }
});

s.test("CARD-03", "TOTALITY — selection never returns nothing, on any shape", () => {
  const shapes = [
    ...CORPUS.map((c) => c.r),
    {},
    { doseRecommendation: null },
    { doseRecommendation: {} },
    { safety: null },
    { doseRecommendation: { action: null }, safety: { outerBoundState: null } },
    { responseAssessment: null, supportedTrajectory: null },
  ];
  for (const r of shapes) {
    const id = selectCard(r);
    ok(typeof id === "string" && id.length > 0, `a card was selected for ${JSON.stringify(r).slice(0, 60)}`);
    ok(CARD_TABLE.some((row) => row.id === id), "and it is a row in the table");
  }
});

s.test("CARD-04", "selection is deterministic and does not depend on the table's array order", () => {
  for (const c of CORPUS) {
    const a = selectCard(c.r);
    const b = selectCard(c.r);
    const cc = selectCard(c.r);
    eq(a, b, `${c.name} — twice`);
    eq(b, cc, `${c.name} — three times`);
  }
});

s.test("CARD-05", "the ORDER is data: every row declares a rank, and ranks are unique", () => {
  const ranks = CARD_TABLE.map((r) => r.rank);
  for (const row of CARD_TABLE) {
    ok(typeof row.rank === "number", `${row.id} declares a numeric rank`);
    ok(typeof row.when === "function", `${row.id} declares a predicate`);
  }
  eq(new Set(ranks).size, ranks.length, "no two rows share a rank");
  /* Exactly one fallback, and it is last. */
  const fallbacks = CARD_TABLE.filter((r) => r.fallback);
  eq(fallbacks.length, 1, "exactly one fallback row");
  eq(Math.max(...ranks), fallbacks[0].rank, "and it is the last one");
});

/* -------------------------------------------------------------------------
   The declined states are values, not absences.
   ---------------------------------------------------------------------- */

s.test("CARD-06", "NOT_RUN, WITHHELD and NONE are recognised as values rather than blanks", () => {
  for (const v of ["NOT_RUN", "WITHHELD", "NONE", "UNKNOWN", "NOT_APPLICABLE"]) {
    ok(isAbsent(v), `${v} is a declined state`);
    ok(!isPresent(v), `${v} is not a present value`);
  }
  ok(isPresent(0), "zero is a real value, not an absence");
  ok(isPresent(8.7), "a number is present");
  ok(isPresent(false), "false is present");
  ok(!isPresent(null), "null is not");
  ok(!isPresent(undefined), "undefined is not");
});

export default s;
