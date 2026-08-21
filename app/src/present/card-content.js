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
import { positionTone, positionWord, knownPosition } from "./position.js";
import { sayReason, saySeverity } from "./wording.js";
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

export function cardStatusLine(engineResult, { assessed, assessmentState }) {
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
  const codes = engineResult?.reasonCodes;
  if (!Array.isArray(codes) || !codes.length) return null;
  const ranked = codes
    .map((c, i) => ({ ...c, seq: i, order: SEVERITY_ORDER[c.severity] ?? 3 }))
    .sort((a, b) => a.order - b.order || a.seq - b.seq);
  const top = ranked[0];
  if (!top) return null;
  return {
    /* The identity the dismissal machinery keys on. Both halves are the
       engine's: the code it raised and the payload it attached. */
    id: top.code,
    title: sayReason(top.code),
    text: sayReason(top.code),
    detail: sayReason(top.code),
    severity: top.severity,
    severityWord: saySeverity(top.severity),
    payload: top.payload || {},
    tone: SEVERITY_TONE[top.severity] || SEVERITY_TONE.INFO,
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

/* Everything a card needs, in one call, so no screen assembles it twice. */
export function cardContent(def, engineResult, assessmentState = null) {
  const assessed = !!def.assessed;
  const result = assessed ? engineResult : null;
  const position = result && knownPosition(result.position) ? result.position : null;
  return {
    position,
    tone: positionTone(position),
    card: result ? selectCard(result) : null,
    direction: result ? cardDirection(result) : null,
    statusLine: cardStatusLine(result, { assessed, assessmentState }),
    notice: result ? cardNotice(result) : null,
  };
}
