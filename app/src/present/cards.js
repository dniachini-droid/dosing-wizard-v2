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
const maintenanceStatus = (r) => r?.doseRecommendation?.maintenanceActionStatus ?? null;
const outer = (r) => r?.safety?.outerBoundState ?? r?.outerBoundState ?? null;
const evidence = (r) => r?.movementEvidence ?? null;
const response = (r) => r?.responseAssessment ?? null;
const responseClass = (r) =>
  typeof response(r) === "object" && response(r) ? response(r).responseClass ?? null : null;
const supported = (r) => r?.supportedTrajectory ?? null;
const limitedByUncertainty = (r) =>
  typeof supported(r) === "object" && supported(r) ? !!supported(r).limitedByUncertainty : false;

/* WHY THE REFUSAL CARD KEYS ON THE STATUS AND NOT ON THE ACTION
   ------------------------------------------------------------
   A capability refusal and an ordinary hold arrive as the SAME action. Both
   are `HOLD_CURRENT_DOSE` (`dosing.py:472, 479, 590` set the status and leave
   the action alone), because holding the current rate is what the engine does
   in both cases — the difference is whether it could have said anything else.
   `maintenanceActionStatus` is the field that carries that difference, and
   `ALK-V2-DATA-CONTRACT.md:572` declares it for exactly this purpose:
   `WITHHELD_LIQUID_GUARD` "is distinct from `HELD`".

   So the refusal predicate reads the status. Keying it on the action cannot
   work, and an earlier version of this table that tried to do so matched
   nothing at all.

   The two withheld statuses are listed rather than matched by prefix. A
   status the contract adds later will therefore fall to `UNCLASSIFIED` and be
   SEEN, instead of being swept into this card by a pattern that happened to
   fit. That is the same reasoning as the closed vocabularies elsewhere. */
const WITHHELD_STATUSES = Object.freeze(["WITHHELD_CAPABILITY", "WITHHELD_LIQUID_GUARD"]);
const withheld = (r) => WITHHELD_STATUSES.includes(maintenanceStatus(r));

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
       answer is "tell me X", not "test again".

       Read the note above `WITHHELD_STATUSES` for why this is a test of the
       status. `REFUSE` is a capability outcome (`capability.py:24`) and is
       never a `RecommendationAction`. */
    when: (r) => !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") && withheld(r),
  },
  {
    id: "INSUFFICIENT",
    rank: 30,
    /* §7: shows what is missing, when the next useful test is, and what can
       still be concluded now. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      !withheld(r) &&
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
      !withheld(r) &&
      action(r) !== "INSUFFICIENT_DATA" &&
      responseClass(r) === "NOT_ATTRIBUTABLE_SMALL_SIGNAL",
  },
  {
    id: "UNCERTAINTY_LIMITED",
    rank: 50,
    /* `WG-ALK-002`: the full card shows BOTH observed and supported slope. */
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      !withheld(r) &&
      action(r) !== "INSUFFICIENT_DATA" &&
      responseClass(r) !== "NOT_ATTRIBUTABLE_SMALL_SIGNAL" &&
      (evidence(r) === "UNCERTAINTY_LIMITED" || limitedByUncertainty(r)),
  },
  {
    id: "DOSE_CHANGE",
    rank: 60,
    when: (r) =>
      !(outer(r) === "BREACHED_LOW" || outer(r) === "BREACHED_HIGH") &&
      !withheld(r) &&
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
      !withheld(r) &&
      action(r) === "HOLD_CURRENT_DOSE" &&
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

/* DOES THIS RESULT INSTRUCT A CHANGE?

   One owner, because two screens ask it and canon `MASTER RULE 1` says two
   implementations that agree today are a defect rather than a coincidence.

   `recommendedDoseMlPerDay` is PRESENT on results that recommend nothing at
   all: canon puts `D_current` there on the insufficient, confounded,
   anomalous, uncertainty-limited and stable branches (`dosing.py:386-388,
   393-395, 400-402, 436-438, 446-448`) so a card can say what it is holding
   against. Reading its presence as a command turned "not enough evidence to
   size a dose" into "set the maintenance dose to 12.1 mL/day", and a hold into
   "up 0.0 mL/day from 12.0".

   `SET_MAINTENANCE_DOSE` is the one action in the contract's vocabulary that
   means change it. */
export function instructsDoseChange(engineResult) {
  const d = engineResult?.doseRecommendation;
  return action(engineResult) === "SET_MAINTENANCE_DOSE" && isPresent(d?.recommendedDoseMlPerDay);
}

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
