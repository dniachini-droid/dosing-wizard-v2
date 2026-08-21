/* ============================================================================
   CARD SELECTION — A PREDICATE TABLE, NOT NESTED BRANCHING
   ----------------------------------------------------------------------------
   `ALK-V2-MODULE-DESIGN.md` §7 is explicit about this, and it is explicit
   because V1 failed here: a first-match wizard in which correction branches
   shadowed ordinary ones, so a card that should have shown never did and
   nobody could see why by reading the code.

   "A card is selected by matching a predicate over `EngineResult` fields, in an
   order that is itself data rather than nested branching, so that no card
   selection can shadow another."

   So the table below is data. Each row is:

     id       what to render
     rank     where it sits in the order — a number in the data, not a position
              in a chain of `if`s
     when     a predicate over EngineResult FIELDS ONLY

   Two properties are enforced by test rather than by care:

     1. TOTALITY.    Some row matches every result. There is no result that
                     falls through to a blank screen.
     2. DISJOINTNESS. At most one row matches any result. This is the property
                     V1 lacked. A second matching row is a FAILING TEST, not a
                     silently shadowed card — which means the shadowing defect
                     announces itself the moment it is written, instead of on a
                     tank six weeks later.

   Because of (2) the rank does not actually decide anything today; it is the
   declared order, and the test proves nothing is relying on it to break a tie.
   If a future row genuinely overlaps another, the test goes red and somebody
   has to decide, in the data, which one wins — which is the whole point.

   WHAT A PREDICATE MAY LOOK AT
   ----------------------------

   Fields of the engine result. That is all. No predicate here compares a value
   to a band edge, computes a difference, reads a clock or looks at the ledger.
   Every one is a test of a value the engine already decided.
   ========================================================================= */

/* Small readers, so a predicate says what it means and no predicate reaches
   into a nested shape twice. None of these decides anything: they are field
   access with a name. */
const action = (r) => r?.doseRecommendation?.action ?? null;
const outer = (r) => r?.safety?.outerBoundState ?? r?.outerBoundState ?? null;
const evidence = (r) => r?.movementEvidence ?? null;
const response = (r) => r?.responseAssessment ?? null;
const responseClass = (r) =>
  typeof response(r) === "object" && response(r) ? response(r).responseClass ?? null : null;
const supported = (r) => r?.supportedTrajectory ?? null;
const limitedByUncertainty = (r) =>
  typeof supported(r) === "object" && supported(r) ? !!supported(r).limitedByUncertainty : false;

/* A value the engine declined to produce. `NOT_RUN`, `WITHHELD` and `NONE` are
   real values in the contract, not absences — a screen that renders one as a
   blank has dropped most of what the engine said. This is the single place
   that recognises them, so every surface treats them alike. */
import { t } from "../strings.js";

export const ABSENT = Object.freeze(["NOT_RUN", "WITHHELD", "NONE", "UNKNOWN", "NOT_APPLICABLE"]);

export function isAbsent(v) {
  return typeof v === "string" && ABSENT.includes(v);
}

export function isPresent(v) {
  return v != null && !isAbsent(v);
}

/* --------------------------------------------------------------------------
   THE TABLE. Ordered data.
   ------------------------------------------------------------------------ */

export const CARD_TABLE = Object.freeze([
  {
    id: "SAFETY_RETURN",
    rank: 10,
    /* `ALK-V2-MODULE-DESIGN.md` §7: an alert is "a distinct register from an
       ordinary out-of-target offer". The engine classifies the breach; this
       row only reads the classification. */
    when: (r) => outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH",
  },
  {
    id: "CAPABILITY_REFUSAL",
    rank: 20,
    /* The engine has the evidence but cannot act, because something it needs
       to know is not recorded. Distinguished from INSUFFICIENT because the
       answer is "tell me X", not "test again". */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) === "REFUSE",
  },
  {
    id: "INSUFFICIENT",
    rank: 30,
    /* §7: shows what is missing, when the next useful test is, and what can
       still be concluded now. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) === "INSUFFICIENT_DATA",
  },
  {
    id: "NOT_ATTRIBUTABLE_SMALL_SIGNAL",
    rank: 40,
    /* §7 mandates the full card here, with the statistical limitation as a
       SECONDARY explanation and the operational conclusion as the headline
       (`ALK-CARD-ATTRIBUTION-001`). The row exists so that ordering is
       declared; the wording rule lives with the wording. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) !== "REFUSE" &&
      action(r) !== "INSUFFICIENT_DATA" &&
      responseClass(r) === "NOT_ATTRIBUTABLE_SMALL_SIGNAL",
  },
  {
    id: "UNCERTAINTY_LIMITED",
    rank: 50,
    /* `WG-ALK-002`: the full card shows BOTH observed and supported slope. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) !== "REFUSE" &&
      action(r) !== "INSUFFICIENT_DATA" &&
      responseClass(r) !== "NOT_ATTRIBUTABLE_SMALL_SIGNAL" &&
      (evidence(r) === "UNCERTAINTY_LIMITED" || limitedByUncertainty(r)),
  },
  {
    id: "DOSE_CHANGE",
    rank: 60,
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) === "SET_MAINTENANCE_DOSE" &&
      responseClass(r) !== "NOT_ATTRIBUTABLE_SMALL_SIGNAL" &&
      !(evidence(r) === "UNCERTAINTY_LIMITED" || limitedByUncertainty(r)),
  },
  {
    id: "HOLD",
    rank: 70,
    /* A hold is a recommendation, not the absence of one. The engine emits
       `OUTPUT_HOLD_IS_A_RECOMMENDATION` for exactly this reason, and the card
       is a full card, not a quieter one. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      action(r) === "HOLD" &&
      responseClass(r) !== "NOT_ATTRIBUTABLE_SMALL_SIGNAL" &&
      !(evidence(r) === "UNCERTAINTY_LIMITED" || limitedByUncertainty(r)),
  },
  {
    id: "UNCLASSIFIED",
    rank: 999,
    /* Totality. If the engine returns an action this table has no row for, the
       app says exactly that — naming the value it did not recognise — rather
       than rendering a blank card. A blank is the failure mode this project has
       ruled out repeatedly; an honest "this build does not have a card for
       this" is not.

       This row is the only one allowed to be a catch-all, and the disjointness
       test excludes it from the at-most-one check for that reason. */
    when: () => true,
    fallback: true,
  },
]);

/* Selection. Reads the table, in rank order, and returns the first match.
   Because the table is proved disjoint, "first" is a formality — but it is
   written as data-driven iteration rather than a branch chain so that adding a
   row cannot change the shape of the code. */
export function selectCard(engineResult) {
  const rows = [...CARD_TABLE].sort((a, b) => a.rank - b.rank);
  for (const row of rows) {
    if (row.when(engineResult)) return row.id;
  }
  /* Unreachable while the fallback row exists. Kept so that removing the
     fallback fails loudly instead of returning undefined. */
  throw new Error(t("err.noCardMatched"));
}

/* Every row that matches. Only the test uses this — it is how disjointness is
   checked, and exporting it is what makes the property checkable from outside
   rather than asserted in a comment. */
export function matchingCards(engineResult) {
  return CARD_TABLE.filter((row) => !row.fallback && row.when(engineResult)).map((r) => r.id);
}
