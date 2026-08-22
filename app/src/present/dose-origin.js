/* ============================================================================
   WHERE A DOSE FIGURE CAME FROM
   ----------------------------------------------------------------------------
   Owner finding 19: each entry in the dose history states whether it was a
   recommendation, a recommendation the keeper adjusted, or his own change.

   It is here rather than in the field's own file for two reasons. It is a rule
   rather than markup — it decides something, and what it decides has to be
   testable by a runner that is Node and nothing else. And there are three
   surfaces that can set a dose, so the rule has one owner among them.
   ========================================================================= */

import { fmtQty } from "../lib/format.js";
import { t } from "../strings.js";

export const DOSE_ORIGIN = Object.freeze({
  /* Saved exactly as the engine recommended it. */
  RECOMMENDATION: "RECOMMENDATION",
  /* The engine recommended a figure and the keeper saved a different one. */
  RECOMMENDATION_ADJUSTED: "RECOMMENDATION_ADJUSTED",
  /* Typed with nothing recommending it — Setup, or "change the dose anyway". */
  KEEPER: "KEEPER",
});

/* Decided from what was on the screen and what was saved, not from which
   button was pressed: a keeper who opens a recommendation, edits the figure and
   saves has adjusted a recommendation, whichever surface he did it on. */
export function originOf(suggested, saved) {
  if (suggested == null) return DOSE_ORIGIN.KEEPER;
  /* Compared at the precision the figure is SHOWN in. The engine's dose carries
     more places than the screen does, and telling a keeper who accepted 9.00
     exactly as offered that he adjusted it would be false. */
  const same = fmtQty(suggested, "mlPerDay") === fmtQty(saved, "mlPerDay");
  return same ? DOSE_ORIGIN.RECOMMENDATION : DOSE_ORIGIN.RECOMMENDATION_ADJUSTED;
}

export function originSentence(origin) {
  if (origin === DOSE_ORIGIN.RECOMMENDATION) return t("dose.origin.recommendation");
  if (origin === DOSE_ORIGIN.RECOMMENDATION_ADJUSTED) return t("dose.origin.adjusted");
  return t("dose.origin.keeper");
}
