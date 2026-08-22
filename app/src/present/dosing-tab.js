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
import { fmtMag, fmtQty } from "../lib/format.js";
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

/* --- the potency estimator, as a sentence ------------------------------- */

export function potencySentence(result) {
  const pot = result && result.potency;
  if (!pot || typeof pot !== "object") return null;
  const entered = num(pot.selectedPotencyDkhPerMl) ?? num(pot.theoreticalPotencyDkhPerMl);
  const enteredText = entered == null ? null : fmtQty(entered, "dkhPerMl");
  const learned = num(pot.learnedPotencyDkhPerMl);
  const periods = Array.isArray(pot.potencyObservations) ? pot.potencyObservations.length : 0;

  if (learned == null || entered == null || periods === 0) {
    /* `notYet` would be a lie of omission where learning is gated: it implies
       the check arrives with more data, and in this build it will not. */
    return pot.potencyLearningState === "CAPABILITY_GATED" || pot.potencyLearningState === "DISABLED"
      ? (enteredText ? t("dosing.potency.off", { entered: enteredText }) : null)
      : (enteredText ? t("dosing.potency.notYet", { entered: enteredText }) : null);
  }

  const pct = Math.abs((learned - entered) / entered) * 100;
  const args = {
    periods, learned: fmtQty(learned, "dkhPerMl"), entered: enteredText, pct: fmtQty(pct, "percent"),
  };
  /* The bands are the ENGINE's: `POTENCY_DISCREPANCY_BAND` states which band
     the ratio falls in, and this reads it rather than choosing edges of its
     own. Absent it, the sentence stays the neutral one. */
  const band = bandOf(result);
  if (band === "AGREES" || band === "WITHIN") return t("dosing.potency.agrees", args);
  if (band === "WIDE" || band === "SEVERE") return t("dosing.potency.differsALot", args);
  if (band === "MODERATE" || band === "NARROW") return t("dosing.potency.differsSome", args);
  return t("dosing.potency.agrees", args);
}

function bandOf(result) {
  const c = (result.reasonCodes || []).find((x) => x.code === "POTENCY_DISCREPANCY_BAND");
  return c && c.payload ? c.payload.band : null;
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
  if (whole > 14) return t("dosing.span.numeric", { n: Math.round(half) });
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

  /* 2 — the movement we can stand behind. */
  const sup = result.supportedTrajectory;
  if (slope != null && supported != null && sup && typeof sup === "object") {
    const margin = num(sup.supportSubtractionDkhPerDay);
    const lines = [];
    if (margin != null) {
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
  if (current != null && recommended != null && delta != null && supported != null && p != null) {
    const lines = [];
    /* The pump's step is the KEEPER's fact and lives in his configuration,
       not in the engine's answer — the engine consumes it and reports what it
       rounded to, never the step itself. Passed in rather than guessed. */
    const step = config ? num(config.recommendationPrecisionMlPerDay) : null;
    const rawDelta = raw != null && current != null ? raw - current : null;
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

  /* 4 — the readings used, in plain English, and the exclusions. */
  const facts = result.evidenceFacts;
  const seg = payload(result, "SEGMENT_SELECTED");
  if (facts && typeof facts === "object" && num(facts.independentClusters) != null) {
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
    if (lines.length) sections.push({ title: t("dosing.working.readings"), lines });
  }

  return sections;
}

/* --- when the app cannot state anything ---------------------------------
   Name the one or two things genuinely missing, and stop. More than two is not
   a wording problem, it is the setup screen. */

const MISSING_FOR = {
  CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED: "dosing.why.item.doseState",
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

   INFO codes do not appear AT ALL unless they carry a calculation the keeper
   would find useful. `jake` sorted the engine's own emitted set against that
   rule on the owner's real output, and `KEEPS_A_CALCULATION` is his answer:
   everything else is the engine narrating its own process. The most extreme
   case is `EPISODE_RESOLVED`, which arrived 28 times on one screen — "a
   testing sitting was identified from your readings · 1", twenty-eight times
   over — and whose whole content is already carried by the readings-used line.

   These sit LAST, inside the working. Never on the face of the screen and
   never in a notification strip. */
const KEEPS_A_CALCULATION = new Set([
  "CONSUMPTION_ESTIMATED",
  "TRAJECTORY_FALLING",
  "TRAJECTORY_RISING",
  "TRAJECTORY_STABLE",
  "UNCERTAINTY_FLOOR_APPLIED",
  "MAINTENANCE_INCREASE_RECOMMENDED",
  "MAINTENANCE_DECREASE_RECOMMENDED",
  "MAINTENANCE_HOLD",
  "MAINTENANCE_STEP_CAP_APPLIED",
  "MAINTENANCE_RATE_RAIL_APPLIED",
  "EVIDENCE_SUFFICIENT",
  "SEGMENT_SELECTED",
  "DELIVERY_BASIS_PROGRAMMED_SCHEDULE",
  "DELIVERY_BASIS_VERIFIED",
  "POTENCY_SELECTED_THEORETICAL",
  "POTENCY_SELECTED_LEARNED",
  "POTENCY_DISCREPANCY_BAND",
  "TRAJECTORY_ESTIMATOR_THEIL_SEN",
]);

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
    if (c.severity === "INFO" && !KEEPS_A_CALCULATION.has(c.code)) continue;
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
