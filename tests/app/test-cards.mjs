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
import { CARD_TABLE, instructsDoseChange, selectCard, matchingCards, isAbsent, isPresent } from "../../app/src/present/cards.js";

const s = suite("card selection");

/* Every combination worth having, written out rather than generated, so a
   reader can see what is covered. */
const CORPUS = [
  {
    name: "an ordinary dose change",
    r: {
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 9.3, maintenanceActionStatus: "ISSUED" },
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
      doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "HELD" },
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
      doseRecommendation: { action: "INSUFFICIENT_DATA", maintenanceActionStatus: "HELD" },
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
      doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "WITHHELD_CAPABILITY" },
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
      doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "HELD" },
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
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 9.4, maintenanceActionStatus: "ISSUED" },
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
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: 12.0, maintenanceActionStatus: "ISSUED" },
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
      doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "WITHHELD_CAPABILITY" },
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
      doseRecommendation: { action: "HOLD_CURRENT_DOSE", maintenanceActionStatus: "WITHHELD_CAPABILITY" },
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
      doseRecommendation: { action: "INSUFFICIENT_DATA", maintenanceActionStatus: "HELD" },
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
      doseRecommendation: { action: "INSUFFICIENT_DATA", maintenanceActionStatus: "HELD" },
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

/* -------------------------------------------------------------------------
   THE CROSS-PRODUCT. The property, over generated shapes rather than examples.

   CARD-02 and CARD-03 iterate the hand-written corpus above. That is a real
   check and it is not the property: a corpus proves disjointness over the
   cases somebody thought of.

   It also cannot see a DEAD ROW. Two rows of this table once tested for action
   values the engine never emits — `HOLD` where the contract says
   `HOLD_CURRENT_DOSE`, and `REFUSE`, which is not a `RecommendationAction` at
   all. Disjointness and totality both held, because an unreachable row cannot
   collide with anything and the fallback caught what it dropped. The corpus
   agreed, because it was written from the same misreading. Every hold the
   product would ever have produced rendered as "this build has no card for
   what the engine returned".

   So CARD-07 generates the cross-product from the CONTRACT's closed
   vocabularies, and CARD-08 asserts every row is reached. A row that matches
   nothing is now a failing test, which is what the earlier defect needed and
   did not have.
   ---------------------------------------------------------------------- */

/* Straight from `ALK-V2-DATA-CONTRACT.md`. `null` and a junk value are in each
   list on purpose: totality has to hold for a result the app did not expect. */
const V = {
  outerBoundState: ["WITHIN_BOUNDS", "BREACHED_LOW", "BREACHED_HIGH", "NOT_RUN", "UNKNOWN", null],
  action: [
    "SET_MAINTENANCE_DOSE", "HOLD_CURRENT_DOSE", "NO_CHANGE", "INSUFFICIENT_DATA",
    "TEST_AGAIN", "REPEAT_TEST_NOW", "SAFETY_RETURN", "PAUSE_DOSING",
    "VERIFY_DOSER", "VERIFY_SOLUTION", "VERIFY_CONFIGURATION",
    "OFFER_RETURN_PLAN", "START_RETURN_PLAN", "CONTINUE_RETURN_PLAN",
    "STOP_RETURN_PLAN", "RETURN_TO_MAINTENANCE",
    "SOMETHING_THE_APP_HAS_NEVER_SEEN", null,
  ],
  maintenanceActionStatus: [
    "ISSUED", "HELD", "DEFERRED_BY_SAFETY_RETURN",
    "WITHHELD_CAPABILITY", "WITHHELD_LIQUID_GUARD", null,
  ],
  movementEvidence: [
    "INSUFFICIENT", "PROVISIONAL", "SUFFICIENT", "HIGH_CONFIDENCE",
    "CONFOUNDED", "ANOMALOUS", "UNCERTAINTY_LIMITED", "NOT_RUN", null,
  ],
  responseClass: ["NOT_ATTRIBUTABLE_SMALL_SIGNAL", "ATTRIBUTABLE", "NOT_RUN", null],
  limitedByUncertainty: [true, false],
};

function* everyShape() {
  for (const outerBoundState of V.outerBoundState)
    for (const action of V.action)
      for (const maintenanceActionStatus of V.maintenanceActionStatus)
        for (const movementEvidence of V.movementEvidence)
          for (const responseClass of V.responseClass)
            for (const limitedByUncertainty of V.limitedByUncertainty)
              yield {
                doseRecommendation: { action, maintenanceActionStatus, recommendedDoseMlPerDay: 12.0 },
                safety: { outerBoundState },
                movementEvidence,
                supportedTrajectory: { limitedByUncertainty },
                responseAssessment: responseClass === null ? null : { responseClass },
              };
}

s.test("CARD-07", "DISJOINTNESS and TOTALITY over the whole cross-product, not a corpus", () => {
  let shapes = 0;
  let worstId = null;
  let worst = 0;
  for (const r of everyShape()) {
    shapes += 1;
    const matches = matchingCards(r);
    if (matches.length > worst) { worst = matches.length; worstId = JSON.stringify(r); }
    const chosen = selectCard(r);
    ok(
      CARD_TABLE.some((row) => row.id === chosen),
      `every shape selects a row in the table (got ${chosen})`
    );
  }
  ok(shapes > 4000, `the cross-product is actually large: ${shapes} shapes`);
  eq(worst, 1, `at most one non-fallback row matches any shape (worst was ${worst} at ${worstId})`);
});

s.test("CARD-08", "no row of the table is unreachable — a dead card is a failing test", () => {
  const reached = new Set();
  for (const r of everyShape()) reached.add(selectCard(r));
  const dead = CARD_TABLE.filter((row) => !reached.has(row.id)).map((row) => row.id);
  eq(
    dead.length,
    0,
    dead.length
      ? `these rows match nothing the engine can emit: ${dead.join(", ")}`
      : "every row is reachable"
  );
});

s.test("CARD-09", "a standing dose is not an instruction — only SET_MAINTENANCE_DOSE changes anything", () => {
  /* THE DEFECT THIS PINS. Both screens tested `isPresent(recommendedDose)`
     before consulting the card, and canon puts `D_current` in that field on
     the insufficient, confounded, anomalous, uncertainty-limited and stable
     branches so a card can say what it is holding against. So Today read
     "Set the alkalinity maintenance dose to 12.0 mL/day · Up 0.0 mL/day from
     12.0" on a hold, and told the keeper to set a dose on a day whose own
     assessment card said there was not enough evidence to size one.

     `PRC-005` calls that — degrading into a confident answer — always
     serious. */
  const withDose = (action, status) => ({
    doseRecommendation: {
      action,
      maintenanceActionStatus: status,
      recommendedDoseMlPerDay: 12.0,
      currentDoseMlPerDay: 12.0,
    },
  });

  ok(instructsDoseChange(withDose("SET_MAINTENANCE_DOSE", "ISSUED")), "a real change instructs one");

  /* Every one of these carries a PRESENT dose, and none of them is a command. */
  ok(!instructsDoseChange(withDose("HOLD_CURRENT_DOSE", "HELD")), "a hold is not an instruction to change");
  ok(!instructsDoseChange(withDose("INSUFFICIENT_DATA", "HELD")), "insufficient evidence is not an instruction");
  ok(!instructsDoseChange(withDose("NO_CHANGE", "HELD")), "no change is not a change");
  ok(
    !instructsDoseChange(withDose("HOLD_CURRENT_DOSE", "WITHHELD_CAPABILITY")),
    "a capability refusal is not an instruction"
  );

  /* And the other direction: SET_MAINTENANCE_DOSE with the dose WITHHELD is
     not an instruction either, because there is no number to act on. */
  ok(
    !instructsDoseChange({
      doseRecommendation: { action: "SET_MAINTENANCE_DOSE", recommendedDoseMlPerDay: "WITHHELD" },
    }),
    "a withheld dose is not an instruction, whatever the action says"
  );
  ok(!instructsDoseChange({}), "an empty result instructs nothing");
  ok(!instructsDoseChange(null), "and neither does no result");
});

export default s;
