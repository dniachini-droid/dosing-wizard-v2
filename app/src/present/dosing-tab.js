/* ============================================================================
   THE DOSING TAB, AS STRUCTURED CONTENT
   ----------------------------------------------------------------------------
   `17-DOSING-TAB-SPEC.md`, and `jake`'s wording for it.

   WHAT THIS MODULE IS ALLOWED TO DO. `DEC-003` and canon `X-INV-004` put every
   inference in the engine and leave presentation to render its structured
   output: "no UI component independently calculates slope, dose, response
   class or retest time." Nothing here does. Every figure below is a field the
   engine returned; what this module decides is which SENTENCE fits the answer
   the engine already gave, and which figures that sentence needs.

   It is here rather than in the component so there is ONE place that reads the
   engine's answer for this tab. Two components reading it and agreeing today
   is what `MASTER RULE 1` calls a defect rather than a coincidence.

   THE ONE PIECE OF ARITHMETIC, NAMED. `suppliedDkhPerDay` is `P × D` — the
   solution strength and the dose history mean, both of them fields the engine
   emitted in the same `consumption` block. The engine performs this product
   itself inside `ALK-013` and does not publish the result, and the spec puts
   it on the screen as "what your dose supplies". Restating two of the engine's
   own outputs in the engine's own equation is not a second owner of the rule:
   it decides nothing, no recommendation reads it, and changing it could not
   change what the app advises. It is recorded as an open item all the same —
   the engine should publish the figure so that presentation does not multiply.
   ========================================================================= */

import { fmtDate } from "../lib/dates.js";
import { fmtMag, fmtPotency, fmtQty } from "../lib/format.js";
import { t } from "../strings.js";

/* The engine's absence markers. A field carrying one of these is not a number
   and must never be rendered as one. */
const ABSENT = new Set(["UNKNOWN", "NOT_RUN", "WITHHELD", "NOT_ELIGIBLE", "NOT_APPLICABLE"]);
const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const present = (v) => v != null && !(typeof v === "string" && ABSENT.has(v));

/* --- the wide status box ------------------------------------------------
   `{value} · {position} · {trend}`. Every one of the three phrases names its
   own subject, so any two can be read alone — "not clear yet" standing alone
   is the defect this replaces. Safety says nothing here: it is redundant with
   position, and rendering it in red read as an alarm for good news. */

const POSITION_KEY = {
  BELOW_RANGE: "dosing.status.pos.below",
  IN_RANGE: "dosing.status.pos.in",
  ABOVE_RANGE: "dosing.status.pos.above",
};

export function statusParts(result) {
  if (!result) return null;
  const parts = [];
  const value = num(result.latestValidValueDkh);
  if (value != null) parts.push(t("dosing.status.value", { value: fmtQty(value, "dkh") }));
  parts.push(t(POSITION_KEY[result.position] || "dosing.status.pos.unknown"));
  parts.push(trendPhrase(result));
  return parts;
}

function trendPhrase(result) {
  const obs = result.observedTrajectory;
  const slope = obs && typeof obs === "object" ? num(obs.observedSlopeDkhPerDay) : null;
  const dir = result.trajectory;
  if (dir === "FALLING") {
    return slope == null
      ? t("dosing.status.trend.fallingPlain")
      : t("dosing.status.trend.falling", { slope: fmtMag(slope) });
  }
  if (dir === "RISING") {
    return slope == null
      ? t("dosing.status.trend.risingPlain")
      : t("dosing.status.trend.rising", { slope: fmtMag(slope) });
  }
  if (dir === "STABLE" || dir === "FLAT") return t("dosing.status.trend.flat");
  return t("dosing.status.trend.uncertain");
}

/* --- the recommendation, as prose --------------------------------------
   The headline is always the ACTION. Where a verdict on the last change
   exists it is the FIRST sentence of the body, under the headline and before
   the arithmetic — "did the last thing I did work?" is the question a keeper
   arrives with — but it never becomes its own headline. */

export function recommendation(result, readingCount = 0) {
  if (!result) return null;
  const dose = result.doseRecommendation || {};
  const cons = result.consumption;
  const action = dose.action;

  const current = num(dose.currentDoseMlPerDay);
  const recommended = num(dose.recommendedDoseMlPerDay);
  const delta = num(dose.deltaDoseMlPerDay);
  const body = [];

  const verdict = verdictSentence(result);
  if (verdict) body.push(verdict);

  if (action === "SET_MAINTENANCE_DOSE" && recommended != null && current != null && delta != null) {
    const up = delta > 0;
    const p = up ? "dosing.reco.increase" : "dosing.reco.decrease";
    const value = num(result.latestValidValueDkh);
    const slope = slopeOf(result);
    const supported = supportedOf(result);
    const c = consumptionOf(cons);
    const supplied = suppliedOf(cons);
    const postSlope = num(dose.predictedPostSlopeDkhPerDay);
    const effect = num(dose.deltaEffectDkhPerDay);

    if (value != null && slope != null) {
      const key = up ? `${p}.where`
        : result.position === "IN_RANGE" ? `${p}.whereIn` : `${p}.where`;
      body.push(t(key, { value: fmtQty(value, "dkh"), slope: fmtMag(slope) }));
    }
    if (c != null && supplied != null && current != null) {
      body.push(t(`${p}.gap`, {
        consumption: fmtQty(c, "dkhPerDay"),
        current: fmtQty(current, "mlPerDay"),
        supplied: fmtQty(supplied, "dkhPerDay"),
        gap: fmtMag(c - supplied),
      }));
    }
    if (effect != null) {
      body.push(t(`${p}.step`, { delta: fmtMag(delta, "mlPerDay"), effect: fmtMag(effect) }));
    }
    /* Not decoration: without it the screen shows a 0.030 shortfall and a step
       that closes half of it, and looks like an arithmetic error. */
    if (supported != null && slope != null && fmtMag(supported) !== fmtMag(slope)) {
      body.push(t(`${p}.sizedFrom`, { supported: fmtMag(supported), observed: fmtMag(slope) }));
    }
    if (postSlope != null) {
      body.push(fmtMag(postSlope) === fmtQty(0, "dkhPerDay")
        ? t(`${p}.afterLevel`)
        : t(`${p}.after`, { postSlope: fmtMag(postSlope) }));
    }
    return {
      head: t(`${p}.head`, { dose: fmtQty(recommended, "mlPerDay") }),
      /* The figure the keeper is being offered, so the tab can hand it to the
         delivered-dose field rather than making him retype it. Reading it out
         is not deciding anything — the engine chose it. */
      suggestedDose: recommended,
      body,
      canExplain: true,
      offerChangeAnyway: false,
    };
  }

  if (action === "HOLD_CURRENT_DOSE" && current != null) {
    body.push(holdReason(result));
    body.push(t("dosing.reco.hold.isARecommendation"));
    return {
      head: t("dosing.reco.hold.head", { dose: fmtQty(current, "mlPerDay") }),
      /* A hold recommends no change, so there is nothing to offer. "Change the
         dose anyway" opens the field empty of a suggestion, and whatever the
         keeper puts in it is his own change. */
      suggestedDose: null,
      body: body.filter(Boolean),
      canExplain: true,
      /* V1's, kept: a hold is advice, and the keeper may disagree with it. */
      offerChangeAnyway: true,
    };
  }

  /* Everything else is the fresh-install story: the engine has not withheld an
     answer it could have given, it has not been given enough to form one. */
  return {
    head: t("dosing.reco.fresh.head"),
    body: [
      ...body,
      readingCount > 0
        ? t("dosing.reco.fresh.body", { n: readingCount })
        : t("dosing.reco.fresh.bodyNone"),
      t("dosing.reco.fresh.nothingWrong"),
    ],
    canExplain: false,
    offerChangeAnyway: false,
  };
}

function holdReason(result) {
  const cons = result.consumption;
  const dose = result.doseRecommendation || {};
  const c = consumptionOf(cons);
  const supplied = suppliedOf(cons);
  const slope = slopeOf(result);
  const supported = supportedOf(result);

  if (dose.towardRangeHoldApplied) {
    const value = num(result.latestValidValueDkh);
    if (value != null) return t("dosing.reco.hold.towardRange", { value: fmtQty(value, "dkh") });
  }
  /* The engine says the supported movement was zeroed by uncertainty: the
     movement is real on the page and not real in the readings. */
  const sup = result.supportedTrajectory;
  if (sup && typeof sup === "object" && sup.limitedByUncertainty && slope != null) {
    return t("dosing.reco.hold.withinVariation", { slope: fmtMag(slope) });
  }
  if (c != null && supplied != null) {
    return t("dosing.reco.hold.matching", {
      consumption: fmtQty(c, "dkhPerDay"),
      supplied: fmtQty(supplied, "dkhPerDay"),
    });
  }
  if (slope != null) return t("dosing.reco.hold.withinVariation", { slope: fmtMag(slope) });
  if (supported != null) return t("dosing.reco.hold.withinVariation", { slope: fmtMag(supported) });
  return null;
}

/* The engine's response classification, surfaced. V1 did this; the ported tab
   showed it as a bare row labelled "Response to the last change" and, when the
   engine had not run it, as the words "not recorded". */
const VERDICT_KEY = {
  RESPONSE_AS_EXPECTED: "dosing.reco.verdict.worked",
  RESPONSE_CONFIRMED: "dosing.reco.verdict.worked",
  RESPONSE_PARTIAL: "dosing.reco.verdict.partly",
  RESPONSE_WEAKER_THAN_EXPECTED: "dosing.reco.verdict.partly",
  RESPONSE_NOT_AS_EXPECTED: "dosing.reco.verdict.didNot",
  RESPONSE_CONTRARY: "dosing.reco.verdict.didNot",
  RESPONSE_TOO_EARLY: "dosing.reco.verdict.tooEarly",
  RESPONSE_PENDING: "dosing.reco.verdict.tooEarly",
  RESPONSE_CONFOUNDED: "dosing.reco.verdict.confounded",
  RESPONSE_EXPIRED: "dosing.reco.verdict.expired",
};

export function verdictSentence(result) {
  const r = result && result.responseAssessment;
  if (!r || typeof r !== "object") return null;
  const key = VERDICT_KEY[r.responseClass];
  if (!key) return null;

  const date = r.interventionAt ? fmtDate(String(r.interventionAt).slice(0, 10)) : null;
  const from = num(r.fromMlPerDay);
  const to = num(r.toMlPerDay);
  const before = num(r.preChangeObservedSlopeDkhPerDay);
  const since = num(r.postChangeObservedSlopeDkhPerDay);
  const expected = num(r.predictedPostSlopeDkhPerDay);

  if (key === "dosing.reco.verdict.expired") return t(key);
  if (!date) return null;
  if (key === "dosing.reco.verdict.confounded") return t(key, { date });
  if (key === "dosing.reco.verdict.tooEarly") {
    if (from == null || to == null) return null;
    return t(key, { date, from: fmtQty(from, "mlPerDay"), to: fmtQty(to, "mlPerDay") });
  }
  if (key === "dosing.reco.verdict.didNot") {
    if (from == null || to == null || expected == null || since == null) return null;
    return t(key, {
      date, from: fmtQty(from, "mlPerDay"), to: fmtQty(to, "mlPerDay"),
      expected: fmtMag(expected), slopeSince: fmtMag(since),
    });
  }
  if (from == null || to == null || before == null || since == null) return null;
  const rising = before > 0;
  return t(rising && key === "dosing.reco.verdict.worked" ? "dosing.reco.verdict.workedRising" : key, {
    date, from: fmtQty(from, "mlPerDay"), to: fmtQty(to, "mlPerDay"),
    slopeBefore: fmtMag(before), slopeSince: fmtMag(since),
  });
}

/* --- the three boxes ---------------------------------------------------- */

export function boxes(result) {
  const cons = result && result.consumption;
  const c = consumptionOf(cons);
  const supplied = suppliedOf(cons);
  const dose = cons && typeof cons === "object" ? num(cons.doseHistoryMeanMlPerDay) : null;
  const potency = cons && typeof cons === "object" ? num(cons.selectedPotencyDkhPerMl) : null;

  const uses = {
    label: t("dosing.boxes.uses"),
    value: c == null ? null : fmtQty(c, "dkhPerDay"),
    sub: t("dosing.boxes.usesSub"),
  };
  const supplies = {
    label: t("dosing.boxes.supplies"),
    value: supplied == null ? null : fmtQty(supplied, "dkhPerDay"),
    sub: dose != null && potency != null
      ? t("dosing.boxes.suppliesSub", {
          dose: fmtQty(dose, "mlPerDay"), potency: fmtQty(potency, "dkhPerMl"),
        })
      : null,
  };

  let difference;
  if (c == null || supplied == null) {
    difference = { label: t("dosing.boxes.difference"), value: null, sub: null };
  } else {
    const gap = c - supplied;
    /* "Matching" is not this module's threshold to invent. The engine states
       the margin below which a difference is not one the readings can show
       (`materialityMarginDkhPerDay`), and that is the figure used. */
    const margin = num(cons.materialityMarginDkhPerDay);
    const matching = margin != null ? Math.abs(gap) <= margin : fmtMag(gap) === fmtQty(0, "dkhPerDay");
    difference = matching
      ? { label: t("dosing.boxes.difference"), value: t("dosing.boxes.diff.matching"),
          sub: t("dosing.boxes.diff.matchingSub"), prose: true }
      : gap > 0
        ? { label: t("dosing.boxes.difference"), value: t("dosing.boxes.diff.short", { gap: fmtMag(gap) }),
            sub: t("dosing.boxes.diff.shortSub"), prose: true }
        : { label: t("dosing.boxes.difference"), value: t("dosing.boxes.diff.excess", { gap: fmtMag(gap) }),
            sub: t("dosing.boxes.diff.excessSub"), prose: true };
  }
  return [uses, supplies, difference];
}

/* --- THE CORRECTION IN PROGRESS, RECOMPUTED ON EVERY READING -------------

   Finding 12. The panel said "the next useful test is 22 Aug" on the 22nd,
   after the keeper had tested and logged 9.0 dKH. It was not frozen — it
   recomputed every time — but the only thing it had to say was a date, and the
   engine's answer to "is it time to test?" is `asOf` itself once a test is due.
   So a panel that renders that date renders TODAY, every day, for as long as
   the test stays due, and the keeper reads a deadline he has already met.

   What the engine actually knows is the response classification, and it has
   known it all along. `ALK-RESPONSE-CLASSIFIER-001` gives six classes; three
   gates and a lifecycle sit in front of them, and `classificationIsTerminal`
   says which are final. `postClusters` counts the readings taken since the
   change. All of it is in `responseAssessment` and none of it reached the
   screen.

   THIS FUNCTION DECIDES NOTHING. It maps a state the engine produced onto a
   sentence, exactly as `recommendation()` above maps an action onto one. There
   is no threshold here, no count compared against a minimum and no opinion
   about whether enough readings have arrived — `AWAITING_FORMAL_POST_SLOPE` is
   the engine saying that, not this file working it out. Canon `X-INV-004`.

   WHY A DISMISSAL IS KEYED TO THE CONCLUSION AND NOT TO THE PANEL.

   When the change has worked, the keeper closes the panel and it goes to
   history. Finding 16 requires that closing to come UNDONE if the reading it
   rested on is deleted. That needs no tombstone and no record of the deletion:
   the dismissal signature carries the classification, so a panel dismissed at
   EXPECTED is dismissed at EXPECTED and nothing else. Delete the reading that
   made it EXPECTED, the engine reclassifies from what remains, the signature no
   longer matches, and the panel is back saying what it said before — which is
   precisely the owner's worked example. The same mechanism V1 used for a worse
   reading bringing a finding straight back. */

/* The states, grouped by what a keeper does about them. The vocabulary is
   `response.py`'s and is closed; every member of it is placed here, because a
   state that fell through to a default would be the screen inventing a meaning
   for something the engine said precisely. */
const CORRECTION_STATE = Object.freeze({
  /* Nothing has happened yet. */
  NOT_YET_ASSESSABLE: "waiting",
  /* Readings are arriving and the engine cannot yet call it. */
  AWAITING_FORMAL_POST_SLOPE: "tooEarly",
  AWAITING_DETECTABILITY: "tooEarly",
  INCONCLUSIVE: "tooEarly",
  /* It worked. */
  EXPECTED: "worked",
  /* It moved, and not by enough or by too much. */
  PARTIAL: "partial",
  OVER_RESPONSE: "overshot",
  NO_DETECTABLE_RESPONSE: "noMovement",
  CONTRADICTORY: "wrongWay",
  /* The engine can say nothing about this one, and says so rather than
     leaving the panel to imply it is still watching. */
  NOT_ATTRIBUTABLE_SMALL_SIGNAL: "cannotTell",
  PRECHANGE_EVIDENCE_INSUFFICIENT: "cannotTell",
  NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME: "cannotTell",
  CONFOUNDED: "cannotTell",
  INTERRUPTED: "cannotTell",
  INTERRUPTED_BY_SAFETY_RETURN: "cannotTell",
  UNRESOLVED_EXPIRED: "cannotTell",
  LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE: "cannotTell",
});

/* Is the engine asking for a test NOW, or on a date still ahead?

   `retest.recommendedAt` is submitted as hours from `asOf`, and a candidate
   already in the past is submitted at zero — so "due" and "due today" arrive as
   the same instant, and rendering it as a date is what produced the finding.
   Compared as instants, not as dates: a test due at 4pm is not due at 9am. */
function nextTestFrom(result, asOf) {
  const at = result.retest && result.retest.recommendedAt;
  if (!at || typeof at !== "string") return null;
  const due = Date.parse(at);
  const now = asOf ? Date.parse(asOf) : NaN;
  if (!Number.isFinite(due)) return null;
  if (Number.isFinite(now) && due <= now) return { now: true, at };
  return { now: false, at };
}

export function correctionPanel(result, asOf = null) {
  if (!result) return null;
  const iv = result.activeIntervention;
  if (!iv || typeof iv !== "object") return null;
  const at = iv.actualStartTime || iv.effectiveAt;
  if (!at) return null;

  const ra = result.responseAssessment;
  const classification = ra && typeof ra === "object" ? ra.classification : null;
  const state = CORRECTION_STATE[classification] || null;
  if (!state) return null;

  const from = num(iv.oldDoseMlPerDay ?? iv.fromMlPerDay);
  const to = num(iv.newDoseMlPerDay ?? iv.toMlPerDay);
  const posts = ra && typeof ra === "object" ? num(ra.postClusters) : null;
  const terminal = !!(ra && typeof ra === "object" && ra.classificationIsTerminal);
  const next = nextTestFrom(result, asOf);

  const dose = result.doseRecommendation || {};
  const recommended = num(dose.recommendedDoseMlPerDay);
  const current = num(dose.currentDoseMlPerDay);
  const offersNewDose =
    dose.action === "SET_MAINTENANCE_DOSE" && recommended != null && current != null
    && recommended !== current;

  return {
    state,
    classification,
    terminal,
    changedOn: String(at).slice(0, 10),
    from, to, posts,
    nextTest: next,
    /* A panel is closable once the engine has finished with it. While it is
       still watching there is nothing to put away. */
    canDismiss: terminal,
    /* What the dismissal is dismissing. Not the panel — the conclusion. */
    signature: `${iv.interventionId || at}|${classification}`,
    offersNewDose,
    recommendedDose: offersNewDose ? recommended : null,
  };
}

/* --- the potency estimator, as a sentence ------------------------------- */

/* THE POTENCY ESTIMATOR — OWNER-APPROVED DESIGN, FINDING 13.

   "Switch the estimator on. It observes and estimates continuously. It displays
   in its own box on the Dosing tab, in plain English, with Show working. Where
   its estimate disagrees with the entered strength and it is confident, it says
   so and offers two buttons. It never substitutes silently."

   WHAT "SWITCH IT ON" TURNED OUT TO MEAN, AND WHY NO ENGINE RULE MOVED.

   `potency.run(cfg, interventions, gated)` already observes while gated: every
   dose change in the ledger produces an observation with its SNR, its signal
   class and its plausibility, the pool is formed, the confidence ladder is
   climbed, and `learnedPotencyDkhPerMl` is reported. What the gate withholds is
   the PROMOTION — `selectedPotency` never moves off the keeper's figure however
   good the pool. The engine's own comment says why: "a gate that observes means
   the owner can see what it WOULD have concluded before trusting it with a
   dose."

   That is exactly what the owner asked for, so the gate stays shut. It IS the
   never-substitutes-silently rule, expressed in the one place that could break
   it. The estimator was not switched on by opening it; it was switched on by
   this box, which shows what the gated learner already computes.

   Acceptance is then the keeper typing the measured number, by button rather
   than by keyboard: it writes `selectedPotencyDkhPerMl` into a new
   configuration version, and the engine sizes the dose from a CONFIGURED figure
   as it always has. `selectedPotencySource` never becomes `LEARNED`, because
   the keeper's acceptance is what makes it his. This resolves what canon
   decision 12 left open — a learned strength may size a dose, but only when the
   keeper accepts it — without the engine gaining a path that could do it
   without him.

   NO THRESHOLD IN THIS FILE, AND THERE ARE TWO IT WOULD HAVE BEEN EASY TO ADD.

   "Confident enough to act on" is `ALK-POTENCY-CONFIDENCE-001`'s ladder, and
   only `CALIBRATED` and `STRONGLY_CALIBRATED` are the states at which canon
   itself would move `selectedPotency`. Offering the keeper the choice at any
   lower rung would be this file inventing a bar the canon already sets.

   "Do these two figures agree" is `ALK-021`, and the engine emits the band it
   falls in as `POTENCY_DISCREPANCY_BAND`. A percentage compared against a
   number chosen here would be a second implementation of it. */

const CONFIDENT_ENOUGH = new Set(["CALIBRATED", "STRONGLY_CALIBRATED"]);

function bandOf(result) {
  const c = (result.reasonCodes || []).find((x) => x.code === "POTENCY_DISCREPANCY_BAND");
  return c && c.payload ? c.payload.band : null;
}

/* Whether the app holds a RECIPE, which decides which of two sentences may be
   used. `POTENCY_SELECTED_THEORETICAL` carries `chemical` and
   `concentrationGPerL` as UNKNOWN when the keeper typed a dKH/mL figure
   straight in, and "stronger than the recipe suggests" would then name a recipe
   the app does not have. Same rule as `dosing.working.uses.potencyFrom`. */
function fromRecipe(config) {
  return !!(config && config.chemical != null && config.stockConcentrationGPerL != null);
}

/* WHERE THE FIGURE IN USE CAME FROM, wherever it is shown — Setup and this tab
   both read this, so the two surfaces cannot describe the same number
   differently. Returns null where the keeper has never been asked, which is
   most tanks: provenance is worth stating once there is more than one place the
   number could have come from. */
export function potencyProvenance(config) {
  if (!config || config.potencyDecision == null) return null;
  const d = config.potencyDecision;
  const value = num(config.selectedPotencyDkhPerMl);
  if (value == null || !d.on) return null;

  /* THE PROVENANCE DESCRIBES THE FIGURE THE DECISION PUT IN FORCE, AND ONLY
     THAT FIGURE.

     It used to describe whatever `selectedPotencyDkhPerMl` currently held. So a
     keeper who accepted a measured 0.0707 on 22 August and then typed 0.08 into
     Setup a week later was shown:

         "0.08 dKH/mL — measured from your tank's response, accepted 22 Aug"

     which is false about a number he typed himself. Owner decision 33's second
     requirement is exactly that this must not happen — a figure measured from
     the tank and accepted on a date must not be confused with one he entered —
     and this function was the thing breaking it.

     `inUse` is what the decision put in force: the measured figure if he took
     it, his own if he kept it. Where the configuration no longer holds that
     figure, the decision is not what the current number came from, so there is
     no provenance to state and the honest answer is none. He typed it; Setup
     already says so by being where he typed it. */
  const decided = num(d.inUse);
  if (decided == null || decided !== value) return null;

  return d.accepted
    ? { key: "dosing.potency.fromMeasured", value, date: d.on }
    : { key: "dosing.potency.fromKept", value, date: d.on };
}

export function potencyBox(result, config = null) {
  const pot = result && result.potency;
  if (!pot || typeof pot !== "object") return null;

  const entered = num(pot.selectedPotencyDkhPerMl) ?? num(pot.theoreticalPotencyDkhPerMl);
  if (entered == null) return null;
  const learned = num(pot.learnedPotencyDkhPerMl);
  const observations = Array.isArray(pot.potencyObservations) ? pot.potencyObservations : [];
  const eligible = observations.filter((o) => o.eligibility === "ELIGIBLE");

  const base = {
    entered,
    learned,
    observations: observations.length,
    eligible: eligible.length,
    confidence: pot.potencyConfidence || null,
    limits: learnerLimits(result),
    provenance: potencyProvenance(config),
    working: potencyWorking(result, config),
  };

  if (learned == null) {
    return { ...base, state: "notYet", offersChoice: false };
  }

  const band = bandOf(result);
  const confident = CONFIDENT_ENOUGH.has(pot.potencyConfidence);
  const agrees = band === "BROADLY_CONSISTENT";

  /* A BAND THE ENGINE DID NOT EMIT IS NOT A STATEMENT THAT THEY DISAGREE.

     `bandOf` returns null when no `POTENCY_DISCREPANCY_BAND` is in the result,
     and null was falling straight through to the disagreement branch — so
     silence from `ALK-021`'s owner offered the keeper a dose change, on
     exactly the same screen as a confident, measured, stated disagreement.

     Owner decision 33 conditions the offer on the band SAYING the two figures
     do not broadly agree. Where the engine says nothing, nothing is said, and
     the app shows the estimate without asking him to act on it. The engine
     emits the code whenever it holds both a learned and a theoretical figure
     (`engine.py:471`), so this is the state where it could not — and an
     estimate the engine would not characterise is not one to re-size a dose
     from. */
  if (agrees) return { ...base, state: "agrees", offersChoice: false };
  if (!band || !confident) return { ...base, state: "notConfident", offersChoice: false };

  /* It disagrees and the engine is confident. THE ONLY STATE THAT OFFERS THE
     CHOICE, and the keeper makes it. */
  const stronger = learned > entered;
  const recipe = fromRecipe(config);
  const decided = config && config.potencyDecision;
  return {
    ...base,
    state: stronger ? (recipe ? "stronger" : "strongerStated")
                    : (recipe ? "weaker" : "weakerStated"),
    offersChoice: true,
    /* He has decided before and the estimator has moved on since. It asks
       again rather than updating: the figure in use is his.

       COMPARED AT THE PRECISION HE WAS SHOWN, not at full float precision. A
       bare `!==` re-asks the same question on a difference of 1e-17, which is a
       figure that has not moved as far as the keeper is concerned and a
       notification he cannot act on. `POTENCY_DECIMALS` is display precision
       and is read back by nothing (`ALK-V2-DATA-CONTRACT.md` §0), so this
       invents no threshold: the test is whether the number on screen changed.

       Canon has `POTENCY_REASSESS_DELTA` for materially-different, but it
       belongs to `REASSESSING`, which the engine deliberately does not run
       (`OI-POTENCYSTATE-001` — the state has no defined exit). Borrowing it
       here would be the app running a rule the engine refuses to. Recorded as
       `AI-030`. */
    asksAgain: !!(decided && decided.learned != null
      && fmtPotency(decided.learned) !== fmtPotency(learned)),
  };
}

/* The working behind the estimate, and every figure in it is the engine's.
   Shown under the same "Show working" affordance the recommendation uses. */
function potencyWorking(result, config) {
  const pot = result && result.potency;
  if (!pot || typeof pot !== "object") return [];
  const lines = [];
  const observations = Array.isArray(pot.potencyObservations) ? pot.potencyObservations : [];
  for (const o of observations) {
    const p = num(o.observedPotencyDkhPerMl);
    const dd = num(o.deltaDoseMlPerDay);
    const ds = num(o.deltaSlopeDkhPerDay);
    if (p == null || dd == null || ds == null) continue;
    /* NO DATE. It was computed and thrown away — the string declared a `date`
       parameter and never rendered it — and the way it was computed was worse
       than the omission: `String(o.observationId).slice(-25, -15)`, positional
       magic over an id the engine builds as `POB-IV-<instant>`. It works only
       while `toEngineEvents` omits `eventId` on a `DOSE_CHANGE`, which the
       READING branch's own comment argues it should not; the day it carries
       one, the slice yields `POB-0000` and the line reads "Invalid Date".

       The engine states the observation's instant in `at`, but does not put it
       in the payload the app receives. So the line says what it can say from
       what it was given — how much the dose moved, how much the drift moved
       with it, and the strength that implies — and does not date it. Recorded
       as `AI-029`. */
    lines.push(t("dosing.potency.working.observation", {
      delta: fmtMag(dd, "mlPerDay"),
      slope: fmtMag(ds),
      potency: fmtPotency(p),
    }));
  }
  const learned = num(pot.learnedPotencyDkhPerMl);
  if (learned != null && lines.length > 1) {
    lines.push(t("dosing.potency.working.pooled", {
      n: lines.length, potency: fmtPotency(learned),
    }));
  }
  const entered = num(pot.selectedPotencyDkhPerMl) ?? num(pot.theoreticalPotencyDkhPerMl);
  if (learned != null && entered != null) {
    lines.push(t("dosing.potency.working.against", {
      learned: fmtPotency(learned), entered: fmtPotency(entered),
    }));
  }
  return lines;
}

/* --- shared readers ----------------------------------------------------- */

export function slopeOf(result) {
  const o = result && result.observedTrajectory;
  return o && typeof o === "object" ? num(o.observedSlopeDkhPerDay) : null;
}

export function supportedOf(result) {
  const s = result && result.supportedTrajectory;
  return s && typeof s === "object" ? num(s.supportedSlopeDkhPerDay) : null;
}

export function consumptionOf(cons) {
  return cons && typeof cons === "object" ? num(cons.consumptionDkhPerDay) : null;
}

/* `P × D`. See the header: two of the engine's own outputs, restated in the
   engine's own equation, deciding nothing. */
export function suppliedOf(cons) {
  if (!cons || typeof cons !== "object") return null;
  const p = num(cons.selectedPotencyDkhPerMl);
  const d = num(cons.doseHistoryMeanMlPerDay);
  return p == null || d == null ? null : p * d;
}

/* --- a span of days, in words ------------------------------------------
   "4 readings over approximately five days", never "4 over 4.99 days".
   Rounded to the nearest half day, which is the precision the figure is
   actually known to once it has been through cluster selection. */
const NUMBER_WORD = [
  "zero", "one", "two", "three", "four", "five", "six", "seven",
  "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
];

export function spanInWords(days) {
  const d = num(days);
  if (d == null || d < 0) return null;
  const half = Math.round(d * 2) / 2;
  if (half < 1) return t("dosing.span.halfDay");
  if (half === 1) return t("dosing.span.oneDay");
  if (half === 1.5) return t("dosing.span.oneAndHalf");
  const whole = Math.floor(half);
  /* Past fourteen the span goes back to a numeral, and it is rounded from the
     ORIGINAL rather than from `half`. Rounding twice — to the nearest half day
     and then to the nearest whole — turns 20.4 days into 21, which is a 3%
     error introduced by the formatting itself. Item 4's whole point is that a
     number renders to the precision it is known to. */
  if (whole > 14) return t("dosing.span.numeric", { n: Math.round(d) });
  return half === whole
    ? t("dosing.span.word", { word: NUMBER_WORD[whole] })
    : t("dosing.span.wordAndHalf", { word: NUMBER_WORD[whole] });
}

/* --- SHOW WORKING --------------------------------------------------------
   The rule, and it is the point of the product: when there is arithmetic, show
   the arithmetic and explain how the figure was derived. When there is not,
   name the one or two things genuinely missing. Nothing else.

   No process narration. No repeated codes. No internal states. */

function payload(result, code) {
  const c = (result.reasonCodes || []).find((x) => x.code === code);
  return c ? c.payload || {} : null;
}

export function working(result, config = null) {
  if (!result) return [];
  const sections = [];
  const first = readingsUsed(result);
  if (first) sections.push(first);
  const cons = result.consumption;
  const dose = result.doseRecommendation || {};
  const c = consumptionOf(cons);
  const supplied = suppliedOf(cons);
  const d = cons && typeof cons === "object" ? num(cons.doseHistoryMeanMlPerDay) : null;
  const p = cons && typeof cons === "object" ? num(cons.selectedPotencyDkhPerMl) : null;
  const slope = slopeOf(result);
  const supported = supportedOf(result);

  /* 1 — what the tank uses. `C = P·D − S`, said as a sum a keeper can check. */
  if (c != null && supplied != null && d != null && p != null && slope != null) {
    const args = {
      dose: fmtQty(d, "mlPerDay"), potency: fmtQty(p, "dkhPerMl"),
      supplied: fmtQty(supplied, "dkhPerDay"), slope: fmtMag(slope),
      consumption: fmtQty(c, "dkhPerDay"),
    };
    const lines = [
      slope < 0 ? t("dosing.working.uses.falling", args)
        : slope > 0 ? t("dosing.working.uses.rising", args)
        : t("dosing.working.uses.flat", args),
    ];
    if (payload(result, "DELIVERY_BASIS_PROGRAMMED_SCHEDULE")) {
      lines.push(t("dosing.working.uses.doseFrom", { dose: fmtQty(d, "mlPerDay") }));
    }
    if (payload(result, "POTENCY_SELECTED_THEORETICAL")) {
      lines.push(t("dosing.working.uses.potencyFrom", { potency: fmtQty(p, "dkhPerMl") }));
    }
    sections.push({ title: t("dosing.working.uses"), lines });
  }

  /* 2 — the movement we can stand behind.

     ARITHMETIC THAT CHANGES NOTHING IS NOT SHOWN (finding 14). On a holding
     tank this section read "drift 0.00, minus uncertainty, still 0.00" — three
     figures, one of them twice, saying that nothing happened. A subtraction is
     worth a keeper's attention when it MOVES the figure; when it does not, what
     he wants is the drift and what it was drawn from, which is the other half
     of the same finding: "0.00 dKH/day across your last three readings", never
     a bare number. */
  const sup = result.supportedTrajectory;
  if (slope != null && supported != null && sup && typeof sup === "object") {
    const margin = num(sup.supportSubtractionDkhPerDay);
    const lines = [];
    const facts0 = result.evidenceFacts;
    const n0 = facts0 && typeof facts0 === "object" ? num(facts0.independentClusters) : null;
    const span0 = facts0 && typeof facts0 === "object" ? spanInWords(facts0.spanDays) : null;
    /* Compared at the precision the keeper READS, not at full float precision:
       a subtraction that moves the figure by less than the screen can show has
       not moved it as far as he is concerned. */
    const movesTheFigure = margin != null && fmtMag(supported) !== fmtMag(slope);
    if (margin != null && movesTheFigure) {
      lines.push(t("dosing.working.movement.line", {
        observed: fmtMag(slope), margin: fmtMag(margin), supported: fmtMag(supported),
      }));
    } else if (n0 != null && n0 > 1 && span0) {
      lines.push(t("dosing.working.movement.drawnFrom", {
        observed: fmtMag(slope), n: n0, span: span0,
      }));
    } else if (margin != null) {
      lines.push(t("dosing.working.movement.line", {
        observed: fmtMag(slope), margin: fmtMag(margin), supported: fmtMag(supported),
      }));
    }
    if (payload(result, "TRAJECTORY_ESTIMATOR_THEIL_SEN")) {
      lines.push(t("dosing.working.movement.method"));
    }
    const floor = payload(result, "UNCERTAINTY_FLOOR_APPLIED");
    if (floor && num(floor.sigmaResid) != null && num(floor.sigmaPoint) != null) {
      lines.push(t("dosing.working.movement.floor", {
        scatter: fmtQty(floor.sigmaResid, "dkhPerDay"), floor: fmtQty(floor.sigmaPoint, "dkhPerDay"),
      }));
    }
    if (lines.length) sections.push({ title: t("dosing.working.movement"), lines });
  }

  /* 3 — the dose. */
  const current = num(dose.currentDoseMlPerDay);
  const recommended = num(dose.recommendedDoseMlPerDay);
  const delta = num(dose.deltaDoseMlPerDay);
  const raw = num(dose.continuousActionCandidateMlPerDay);
  const rawDeltaRaw = raw != null && current != null ? raw - current : null;
  /* THE DOSE SECTION IS NOT SHOWN WHEN THE DOSE HOLDS AND NOTHING ASKED IT TO
     MOVE (finding 14). "8.8 + 0.00 = 8.8 mL/day" is a sum whose answer is its
     own first term.

     The test is the RAW candidate, not the rounded one. A raw delta that exists
     and rounds away to nothing is a real explanation of why the dose is
     holding — the keeper's pump cannot make a step that small — and it stays.
     What goes is the case where there was nothing to do before rounding
     either. */
  const nothingAskedItToMove =
    delta === 0 && (rawDeltaRaw == null || fmtMag(rawDeltaRaw, "mlPerDay") === fmtQty(0, "mlPerDay"));
  if (current != null && recommended != null && delta != null && supported != null && p != null
      && !nothingAskedItToMove) {
    const lines = [];
    /* The pump's step is the KEEPER's fact and lives in his configuration,
       not in the engine's answer — the engine consumes it and reports what it
       rounded to, never the step itself. Passed in rather than guessed. */
    const step = config ? num(config.recommendationPrecisionMlPerDay) : null;
    const rawDelta = rawDeltaRaw;
    if (rawDelta != null && step != null) {
      lines.push(t(delta >= 0 ? "dosing.working.dose.line" : "dosing.working.dose.lineDown", {
        supported: fmtMag(supported), potency: fmtQty(p, "dkhPerMl"),
        rawDelta: fmtMag(rawDelta, "mlPerDay"), step: fmtQty(step, "mlPerDay"),
        delta: fmtMag(delta, "mlPerDay"), current: fmtQty(current, "mlPerDay"),
        dose: fmtQty(recommended, "mlPerDay"),
      }));
    }
    const post = num(dose.predictedPostSlopeDkhPerDay);
    if (post != null && slope != null) {
      lines.push(t("dosing.working.dose.after", {
        dose: fmtQty(recommended, "mlPerDay"), postSlope: fmtMag(post), observed: fmtMag(slope),
      }));
    }
    const cap = payload(result, "MAINTENANCE_STEP_CAP_APPLIED") || payload(result, "MAINTENANCE_RATE_RAIL_APPLIED");
    if (cap && num(cap.uncappedDelta) != null && current != null) {
      lines.push(t("dosing.working.dose.capped", {
        uncapped: fmtQty(current + cap.uncappedDelta, "mlPerDay"), dose: fmtQty(recommended, "mlPerDay"),
      }));
    }
    if (lines.length) sections.push({ title: t("dosing.working.dose"), lines });
  }

  return sections;
}

/* THE READINGS USED — FIRST, because it is the context for everything under it.

   Owner-confirmed (finding 15). It was the last section; a keeper reading
   downwards met the arithmetic before he met the readings the arithmetic was
   done on. */
function readingsUsed(result) {
  const facts = result.evidenceFacts;
  const seg = payload(result, "SEGMENT_SELECTED");
  if (!facts || typeof facts !== "object" || num(facts.independentClusters) == null) return null;
  const n = facts.independentClusters;
  const span = spanInWords(facts.spanDays);
  const lines = [];
  if (n === 1) {
    lines.push(t("dosing.working.readings.lineOne", {
      first: seg && seg.startAt ? fmtDate(String(seg.startAt).slice(0, 10)) : "",
    }));
  } else if (span && seg && seg.startAt && seg.endAt) {
    lines.push(t("dosing.working.readings.line", {
      n, span, first: fmtDate(String(seg.startAt).slice(0, 10)), last: fmtDate(String(seg.endAt).slice(0, 10)),
    }));
  }
  return lines.length ? { title: t("dosing.working.readings"), lines } : null;
}

/* --- when the app cannot state anything ---------------------------------
   Name the one or two things genuinely missing, and stop. More than two is not
   a wording problem, it is the setup screen. */

/* `CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED` IS NOT IN THIS TABLE, AND THE
   ABSENCE IS THE FIX.

   It used to map to "what your pump is set to", and the owner was told that was
   one of two things missing on a screen that was at that moment sizing his dose
   from the 8.8 mL/day he had entered. It reads `capability.py:149`, which is a
   hard-coded `NOT_RUN` emitted on EVERY assessment whatever the ledger holds,
   and whose declared `affectedOutputs` is `potency.learnedPotencyDkhPerMl` and
   nothing else. It is the potency learner's own row, `M-9`. It has never been a
   statement that the pump's dose is unknown, and presenting it as one told the
   keeper the app had not been told something he had plainly told it.

   `CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE` stays. That one IS the
   consumption owner saying it has no dose history to work from. */
const MISSING_FOR = {
  CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE: "dosing.why.item.doseState",
  CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE: "dosing.why.item.potency",
  POTENCY_REQUIRED: "dosing.why.item.potency",
  VALIDATION_NET_VOLUME_REQUIRED: "dosing.why.item.volume",
  VALIDATION_TARGET_RANGE_REQUIRED: "dosing.why.item.range",
  EVIDENCE_INSUFFICIENT_CLUSTERS: "dosing.why.item.readings",
  EVIDENCE_INSUFFICIENT_SPAN: "dosing.why.item.readings",
  CAPABILITY_DOSE_EFFECTIVE_TIME_UNCERTAIN: "dosing.why.item.doseTime",
};

export function whyPanel(result) {
  if (!result) return [];
  const items = [];
  for (const c of result.reasonCodes || []) {
    if (c.severity === "INFO") continue;
    const key = MISSING_FOR[c.code];
    if (key && !items.includes(key)) items.push(key);
  }
  if (!items.length) {
    const next = result.retest && result.retest.recommendedAt;
    if (next) return [t("dosing.why.oneMissing", { a: t("dosing.why.item.time", { date: fmtDate(String(next).slice(0, 10)) }) })];
    return [];
  }
  if (items.length === 1) return [t("dosing.why.oneMissing", { a: t(items[0]) })];
  if (items.length === 2) return [t("dosing.why.twoMissing", { a: t(items[0]), b: t(items[1]) })];
  return [t("dosing.why.manyMissing")];
}

/* --- the reason codes ---------------------------------------------------
   Grouped: identical codes collapse to one row with a count, because twenty
   records with an unreadable time is ONE fact and not twenty rows.

   TWO RULES, BOTH THE OWNER'S, AND BOTH SUBTRACTIVE.

   1. NO "No effect" ROW APPEARS AT ALL. Finding 8, in the owner's own words:
      "by definition they changed nothing." An INFO code is the engine
      narrating its own process. Where one carries arithmetic a keeper wants —
      the segment it chose, the delivery basis it used, where the strength came
      from — that arithmetic is already stated in `working()` above, in a
      sentence, next to the figure it produced. A second copy of it as a
      labelled code at the bottom of the sheet is the wall of rows this screen
      was rebuilt to remove.

      The previous rule kept a hand-picked set of INFO codes. It was the right
      instinct and the wrong cut: it re-stated in code form what the working
      already said in words, and the three the owner named — the segment, the
      pump schedule, the theoretical strength — were all in it.

   2. A CODE THAT LIMITS ONLY THE POTENCY LEARNER IS NOT A LIMIT ON THE DOSE.
      Finding 7. The owner was shown "Limited this · the app has not been told
      which solution and batch you are dosing", "· how the dose is delivered"
      and "· the dose currently set on the pump has not been confirmed" on a
      screen that was correctly sizing his dose from the strength and the dose
      he had entered. All three are the learner's rows — `M-2`, `M-3`, `M-9` —
      and every one declares `potency.learnedPotencyDkhPerMl` as the only output
      it touches. Delivery method in particular was removed from Setup in the
      previous round and went on being demanded here, which is what the finding
      means by "removed from Setup and not from the engine's expectations": the
      engine never expected it for the DOSE, and this list said it did.

      They are not discarded. The potency estimator has its own box on this tab
      and states its own limits there, beside the estimate they limit, where a
      keeper can act on them. `POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE` — "there
      is no rule yet for the record a strength calibration would be measured
      against" — is the same class and goes the same way.

   `OUTPUT_INSUFFICIENT_DATA_ACTIONABLE` is here for a third reason: "Even
   without enough for a dose decision, what is known is stated above" is a
   sentence about the layout of the screen. */

const LEARNER_ONLY = new Set([
  "CAPABILITY_SOLUTION_CONTEXT_MISSING",
  "CAPABILITY_DELIVERY_CONTEXT_MISSING",
  "CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED",
  "POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE",
  "POTENCY_CONFIDENCE_STATE_UNDETERMINED",
]);

const SAYS_NOTHING = new Set([
  "OUTPUT_INSUFFICIENT_DATA_ACTIONABLE",
]);

/* Read by the potency box, which shows what the learner could not do beside
   the estimate it could not make. Exported so there is ONE list and the two
   surfaces cannot drift apart. */
export function learnerLimits(result) {
  if (!result) return [];
  const seen = new Set();
  const out = [];
  for (const c of result.reasonCodes || []) {
    if (!LEARNER_ONLY.has(c.code) || seen.has(c.code)) continue;
    seen.add(c.code);
    out.push({ code: c.code, severity: c.severity, payload: c.payload || {}, count: 1 });
  }
  return out;
}

export const PILL = Object.freeze({
  INFO: "dosing.pill.info",
  GATING: "dosing.pill.limiting",
  LIMITING: "dosing.pill.limiting",
  REFUSAL: "dosing.pill.blocking",
  BLOCKING: "dosing.pill.blocking",
});

export function reasonRows(result) {
  if (!result) return [];
  const grouped = new Map();
  for (const c of result.reasonCodes || []) {
    if (c.severity === "INFO") continue;
    if (LEARNER_ONLY.has(c.code) || SAYS_NOTHING.has(c.code)) continue;
    const row = grouped.get(c.code);
    if (row) { row.count += 1; continue; }
    grouped.set(c.code, { code: c.code, severity: c.severity, payload: c.payload || {}, count: 1 });
  }
  const order = { REFUSAL: 0, BLOCKING: 0, GATING: 1, LIMITING: 1, INFO: 2 };
  return [...grouped.values()].sort(
    (a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  );
}

export { present, num };
