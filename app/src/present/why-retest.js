/* ============================================================================
   WHY THAT DAY
   ----------------------------------------------------------------------------
   The specification: "A link, not a paragraph in the prompt. The keeper is
   deciding a schedule, not evaluating an argument." And: "numbers carry the
   explanation, prose appears only where a number needs it."

   This module assembles the rows for that view. It reads the engine's retest
   output and its dose recommendation, and it computes NOTHING.

   A GAP, RECORDED RATHER THAN PAPERED OVER
   ----------------------------------------

   The specification's worked example reads:

     "You changed the dose today. That should shift alkalinity by about
      0.10 dKH a day. By Saturday it will have moved around 0.30 dKH — enough
      to tell apart from ordinary test variation."

   The first sentence is renderable: the per-day figure is the engine's
   `predictedPostSlopeDkhPerDay`.

   The second is not. "It will have moved around 0.30 dKH" is a forecast, and
   the movement threshold it is being compared against is the retest
   scheduler's `signalRequiredMovementDkh`. The engine emits neither on its
   result: `retest` carries `tSignalDays`, `tSignalRawHours` and `tSignalHours`,
   and the accumulated movement and the threshold stay inside the scheduler.

   Multiplying a slope by a number of days here would be this interface
   computing a forecast, which `DEC-003` and canon `X-INV-004` forbid — and
   would put a second owner on a number canon already owns.

   So this view states what the engine did supply and says plainly that the
   accumulated figure is not one of them. Recorded as an open item; closing it
   is one field on the retest output, not a change of behaviour.
   ========================================================================= */

import { isPresent } from "./cards.js";
import { num, signed, sayReason } from "./wording.js";
import { t } from "../strings.js";

/* One row: a label, a value, and — where the value is absent — why. Rendered
   by the screen; assembled here so the screen has no branching of its own. */
export function whyRetestRows(engineResult) {
  const rt = engineResult?.retest || {};
  const d = engineResult?.doseRecommendation || {};
  const rows = [];

  rows.push({ key: t("why.selected"), value: sayReason(rt.selectedReasonCode || rt.reasonCode) });

  if (isPresent(d.predictedPostSlopeDkhPerDay)) {
    rows.push({
      key: t("why.perDay"),
      value: t("why.perDayValue", { slope: signed(d.predictedPostSlopeDkhPerDay, 4) }),
    });
  }

  if (isPresent(rt.selectedApproxHours)) {
    rows.push({
      key: t("why.howLong"),
      value: t("why.howLongValue", { hours: num(rt.selectedApproxHours, 0) }),
    });
  }

  if (isPresent(rt.tSignalDays)) {
    rows.push({ key: t("why.movementTiming"), value: t("why.movementTimingValue", { days: num(rt.tSignalDays, 2) }) });
  }

  if (Array.isArray(rt.clampsApplied) && rt.clampsApplied.length) {
    rows.push({ key: t("why.limits"), value: rt.clampsApplied.map(sayReason).join(" ") });
  }

  return rows;
}

/* The other timings the scheduler weighed, and what each would have picked.
   This is the part that makes the answer checkable rather than assertable:
   the keeper can see that the chosen day won against named alternatives. */
export function whyRetestCandidates(engineResult) {
  const rt = engineResult?.retest || {};
  const selected = rt.selectedAction;
  return (Array.isArray(rt.candidateTimes) ? rt.candidateTimes : []).map((c) => ({
    id: c.candidateClass,
    label: t(`candidate.${c.candidateClass}`),
    selected: c.candidateClass === selected,
    included: c.included !== false,
    at: typeof c.at === "string" ? c.at : null,
    hours: isPresent(c.approxHours) ? num(c.approxHours, 0) : null,
    /* The engine's own words for why a candidate was not submitted. Rendered
       as a fact about the scheduler, not translated — it is already a
       sentence, and rewriting it here would be a second owner of it. */
    reason: typeof c.reason === "string" ? c.reason : null,
  }));
}

/* The timings that could not be considered at all, named rather than dropped. */
export function whyRetestNotRun(engineResult) {
  const rt = engineResult?.retest || {};
  return (Array.isArray(rt.candidatesNotRun) ? rt.candidatesNotRun : []).map((code) => sayReason(code));
}

/* What the engine did not supply, said out loud. See the header. */
export function whyRetestUnavailable() {
  return t("why.accumulatedUnavailable");
}
