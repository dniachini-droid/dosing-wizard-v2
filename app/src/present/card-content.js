/* ============================================================================
   WHAT A PARAMETER CARD SAYS
   ----------------------------------------------------------------------------
   One owner for the four things a parameter card renders about a parameter:
   its position, its direction, the sentence on its status line, and the notice
   strip when there is one.

   The card itself renders these and decides none of them; this module reads
   them off the engine's result and decides none of them either. Every branch
   below is a test of a value the engine already produced, in the manner of
   `cards.js` — which is the same discipline, for the same reason.

   THE STATUS LINE, AND WHY IT IS NEVER BLANK

   The brief for this port sets the rule: "Position is always available from a
   single reading and is always shown. Trajectory is added once the engine can
   state one ... On a tank with too few readings it shows position alone. It is
   never blank and never leads with a refusal."

   That holds exactly as far as the engine reaches, which is alkalinity. For a
   parameter with no engine there is no position to show and none is invented,
   so the line says what IS true of those readings — they are kept and charted
   — rather than classifying them or apologising. That is a rendering of a fact
   about this build, not a claim about the tank.
   ========================================================================= */

import { selectCard, isPresent } from "./cards.js";
import { keeperPosition, positionTone, positionWord, knownPosition } from "./position.js";
import { sayAction, sayOuter, sayReason, saySeverity } from "./wording.js";
import { t } from "../strings.js";

/* Which trajectory values are a DIRECTION the card can draw an arrow for.
   `STABLE` is a trajectory and not a direction; `UNCERTAIN` and `NOT_RUN` are
   the engine declining to state one. */
const DIRECTIONS = new Set(["RISING", "FALLING"]);

export function cardDirection(engineResult) {
  const v = engineResult?.trajectory;
  return DIRECTIONS.has(v) ? v : null;
}

/* The sentence. Position first, trajectory appended once the engine states
   one. The two halves are joined by the strings file rather than here, so a
   language pass can change the join. */
const ENGINE_STATE_KEY = Object.freeze({
  NO_CONFIGURATION: "card.status.notSetUp",
  STORAGE_UNAVAILABLE: "card.status.storageUnavailable",
  ENGINE_UNAVAILABLE: "card.status.engineUnavailable",
  ENGINE_FAILED: "card.status.engineUnavailable",
});

export function cardStatusLine(engineResult, { assessed, assessmentState, hasReading = true }) {
  /* REEFKEEPER FINDING 19. Every card on a brand-new tank read "LOGGED · NOT
     ASSESSED" over a dash. Nothing had been logged. It is the first screen a
     keeper ever sees and it opens by describing something that did not
     happen. */
  if (!hasReading) return t("card.status.noReadings");
  if (!assessed) return t("card.status.notAssessed");
  /* Why there is no answer matters, and each reason says itself. "Awaiting a
     reading" is only true when the engine ran and had nothing to work from;
     saying it while the engine is still booting, or while it could not start
     at all, would be the app claiming to know something about the tank that
     nothing had looked at. */
  if (!engineResult) {
    if (assessmentState && ENGINE_STATE_KEY[assessmentState]) return t(ENGINE_STATE_KEY[assessmentState]);
    return t("card.status.engineStarting");
  }
  const position = engineResult?.position;
  if (!knownPosition(position)) return t("card.status.noPositionYet");
  const word = positionWord(position);
  const traj = engineResult?.trajectory;
  if (traj === "RISING" || traj === "FALLING" || traj === "STABLE") {
    return t("card.status.positionAndTrajectory", { position: word, trajectory: t(`trajectoryMid.${traj}`) });
  }
  return word;
}

/* THE NOTICE STRIP.

   The engine speaks here or the strip is absent. What it says is the highest
   reason code the engine emitted, worded by the strings file, with the tone
   taken from the severity the frozen catalogue stamped on that code.

   The order is the catalogue's severity, not a judgement made here: a refusal
   outranks a limit and a limit outranks information. Within a severity the
   engine's own emission order stands. */
const SEVERITY_ORDER = { REFUSAL: 0, GATING: 1, INFO: 2 };
const SEVERITY_TONE = { REFUSAL: "#C4285B", GATING: "#A2621B", INFO: "#45605F" };

export function cardNotice(engineResult) {
  /* ROUND THREE, ITEM 14 — THE STRIP CARRIED A RAW REASON CODE.

     It read `A RECORD CARRIES A TIME ...`, truncated, because the strip was
     built by ranking every reason code the engine emitted and rendering the
     top one's sentence. That is the engine talking about its own inputs, and
     the strip is not for that: it is for what the engine has to say about THE
     TANK, in the keeper's language.

     The specific code behind that message is gone — stage 1's `AI-014` fix
     stops the app sending a date-only reading in a shape the engine has to
     call malformed — but the rule stands whatever the engine emits next, and
     it is enforced here rather than by hoping no code is ever ugly again:
     REASON CODES DO NOT REACH THIS STRIP AT ALL. They live last, inside Show
     working on the Dosing tab, which is `17-DOSING-TAB-SPEC.md`'s rule for
     them — "never on the face of the screen, never in a notification strip".

     What is left is the two things the engine says about the tank that a
     keeper needs on a card: it wants the dose changed, or the tank is outside
     the safe outer bounds. Both are read from the engine's own structured
     output, not from a code, and both are already worded. Anything else and
     the strip is absent, which is the honest answer — a card with nothing
     urgent to say should say nothing. */
  if (!engineResult) return null;

  const dose = engineResult.doseRecommendation;
  /* THE SPELLING, AND THE PLACE IT IS READ FROM, BOTH MATTER.

     The first version of this read `engineResult.outerBoundState` and compared
     it against `BREACH_LOW`/`BREACH_HIGH`. The engine emits `BREACHED_LOW` and
     `BREACHED_HIGH` (`observation.py`, and the contract's `outerBoundState`),
     and it carries them on `safety`. So both halves were wrong and the branch
     was dead: the most severe thing this app can say was unreachable, and it
     was unreachable in a way that reads as working code.

     `cards.js` had it right all along, in one line, and it is that line —
     `r?.safety?.outerBoundState ?? r?.outerBoundState` — rather than a second
     opinion about where the engine puts its answer. */
  const outer = engineResult.safety?.outerBoundState ?? engineResult.outerBoundState ?? null;

  let id, title, severity;
  if (outer === "BREACHED_LOW" || outer === "BREACHED_HIGH") {
    id = `SAFETY:${outer}`;
    title = sayOuter(outer);
    severity = "REFUSAL";
  } else if (
    dose && dose.action === "SET_MAINTENANCE_DOSE"
    && isPresent(dose.recommendedDoseMlPerDay)
  ) {
    id = "DOSE:SET_MAINTENANCE_DOSE";
    title = sayAction(dose.action);
    severity = "GATING";
  } else {
    return null;
  }
  if (!title) return null;

  return {
    /* The identity the dismissal machinery keys on, and the signature that
       brings a dismissed notice back when the numbers change. Both are still
       the engine's — what changed is that they name the engine's ANSWER
       rather than one of the codes it emitted on the way to it. */
    id,
    title,
    text: title,
    detail: title,
    severity,
    severityWord: saySeverity(severity),
    payload: dose && isPresent(dose.recommendedDoseMlPerDay)
      ? { recommendedDoseMlPerDay: dose.recommendedDoseMlPerDay }
      : {},
    tone: SEVERITY_TONE[severity] || SEVERITY_TONE.INFO,
    /* Where tapping it should go, WHEN the engine's own output identifies a
       dose recommendation. The brief allows this link only if it can be made
       from what the engine emits, and this is the test of that: an action of
       `SET_MAINTENANCE_DOSE` with a dose present. Anything else has no
       destination and the strip is inert. */
    goDosing:
      engineResult?.doseRecommendation?.action === "SET_MAINTENANCE_DOSE" &&
      isPresent(engineResult?.doseRecommendation?.recommendedDoseMlPerDay),
  };
}

/* Everything a card needs, in one call, so no screen assembles it twice.

   ROUND THREE, ITEM 13. An unassessed parameter used to come out of here with
   `position: null`, which gave it the unknown tone — so its value, its range
   marker and its status line all rendered grey, and a perfectly good reading
   looked like a broken one.

   It now gets its position from the keeper's own range, which is not chemistry
   and has no engine to wait for: see `keeperPosition`. `latest` is the reading
   to place, and `range` is the keeper's two numbers; either being absent leaves
   the position null exactly as before, because "no range set" and "no reading"
   are both still genuinely unknown.

   ASSESSED PARAMETERS ARE UNTOUCHED. Alkalinity's position is the engine's and
   the branch below is the only reader of `keeperPosition` anywhere. What the
   unassessed ones still do not get is `card`, `direction` or `notice` — those
   are inferences with an owner, and they stay null. */
export function cardContent(def, engineResult, assessmentState = null, latest = null, range = null) {
  const assessed = !!def.assessed;
  const result = assessed ? engineResult : null;
  const position = assessed
    ? (result && knownPosition(result.position) ? result.position : null)
    : keeperPosition(latest && typeof latest.value === "number" ? latest.value : null, range);
  return {
    position,
    tone: positionTone(position),
    card: result ? selectCard(result) : null,
    direction: result ? cardDirection(result) : null,
    statusLine: cardStatusLine(result, { assessed, assessmentState, hasReading: !!latest }),
    notice: result ? cardNotice(result) : null,
  };
}
