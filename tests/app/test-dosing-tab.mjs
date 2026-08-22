/* ============================================================================
   THE DOSING TAB
   ----------------------------------------------------------------------------
   `17-DOSING-TAB-SPEC.md`. What is checked here is what the spec is emphatic
   about and what the ported tab got wrong: a phrase that does not name its own
   subject, a raw decimal where a keeper reads days, a reason code on the face
   of the screen, and twenty-eight rows for one fact.

   Every check is behavioural — it drives `present/dosing-tab.js` with an
   engine result and reads what came out. Each is named in `mutations.mjs`,
   which states the source change that must turn it red.
   ========================================================================= */

import { suite, eq, ok } from "./harness.mjs";
import {
  boxes, potencySentence, reasonRows, recommendation, spanInWords, statusParts, working,
} from "../../app/src/present/dosing-tab.js";

const s = suite("the dosing tab");

/* A SYNTHETIC TANK, and it is important that it says so.

   This is NOT the owner's data. It is a fixture built to exercise the
   below-range / falling / increase-recommended path, run through the real
   engine so the figures in it are the engine's own — 0.639 dKH/day of
   consumption against 8.80 mL/day at 0.0692 dKH/mL is arithmetic the engine
   performed, not numbers typed here.

   The distinction matters and was got wrong once: the round-three report
   quoted this fixture's output as "what the Dosing tab says for the owner's
   tank". The engine was real; the tank was not. His range is 8.6-9.2 and this
   fixture's is 8.0-9.5, which is how it was caught. */
const FALLING = Object.freeze({
  position: "BELOW_RANGE",
  latestValidValueDkh: 7.11,
  trajectory: "FALLING",
  observedTrajectory: { estimator: "THEIL_SEN", observedSlopeDkhPerDay: -0.03 },
  supportedTrajectory: {
    supportedSlopeDkhPerDay: -0.015907663806382387,
    supportSubtractionDkhPerDay: 0.014092336193617416,
    limitedByUncertainty: false,
  },
  movementEvidence: "SUFFICIENT",
  evidenceFacts: { independentClusters: 10, spanDays: 9.0 },
  consumption: {
    consumptionDkhPerDay: 0.63896,
    doseHistoryMeanMlPerDay: 8.8,
    selectedPotencyDkhPerMl: 0.0692,
    materialityMarginDkhPerDay: 0.014092336193617416,
    eligibility: "RUN",
  },
  doseRecommendation: {
    action: "SET_MAINTENANCE_DOSE",
    currentDoseMlPerDay: 8.8,
    recommendedDoseMlPerDay: 9.0,
    deltaDoseMlPerDay: 0.2,
    deltaEffectDkhPerDay: 0.01384,
    predictedPostSlopeDkhPerDay: -0.01616,
    continuousActionCandidateMlPerDay: 9.029879534774313,
  },
  potency: {
    selectedPotencyDkhPerMl: 0.0692,
    learnedPotencyDkhPerMl: "UNKNOWN",
    potencyLearningState: "CAPABILITY_GATED",
    potencyObservations: [],
  },
  responseAssessment: "NOT_RUN",
  activeIntervention: "NONE",
  retest: { recommendedAt: "2026-08-24T09:00:00+00:00" },
  reasonCodes: [
    { code: "CONSUMPTION_ESTIMATED", severity: "INFO", payload: { P: 0.0692, D: 8.8 } },
    { code: "TRAJECTORY_FALLING", severity: "INFO", payload: { observedSlope: -0.03 } },
    { code: "UNCERTAINTY_FLOOR_APPLIED", severity: "INFO", payload: { sigmaResid: 0.0074, sigmaPoint: 0.1 } },
    { code: "SEGMENT_SELECTED", severity: "INFO", payload: { startAt: "2026-08-08T09:00:00+00:00", endAt: "2026-08-22T09:00:00Z" } },
    { code: "DELIVERY_BASIS_PROGRAMMED_SCHEDULE", severity: "INFO", payload: { programmedDoseMlPerDay: 8.8 } },
    { code: "POTENCY_SELECTED_THEORETICAL", severity: "INFO", payload: { theoreticalDkhPerMl: 0.0692 } },
    { code: "EVIDENCE_SUFFICIENT", severity: "INFO", payload: { independentClusters: 10, spanDays: 9.0 } },
    { code: "TRAJECTORY_ESTIMATOR_THEIL_SEN", severity: "INFO", payload: { n: 10 } },
    { code: "MAINTENANCE_INCREASE_RECOMMENDED", severity: "INFO", payload: { currentDose: 8.8 } },
    /* The process narration. None of these may reach the screen. */
    { code: "SEGMENT_LOOKBACK_NOT_EXTENDED", severity: "INFO", payload: { spanDays: 14 } },
    { code: "TRAJECTORY_RAPID_NOT_CONFIRMED", severity: "INFO", payload: {} },
    { code: "CONFIG_VERSION_RESOLVED", severity: "INFO", payload: { configVersionId: "CFG-V1" } },
    { code: "AUDIT_TRACE_WRITTEN", severity: "INFO", payload: {} },
    { code: "SAFETY_MG_GATE_UNKNOWN", severity: "INFO", payload: {} },
    /* One fact, arriving twenty-eight times. */
    ...Array.from({ length: 28 }, (_, i) => ({
      code: "EPISODE_RESOLVED", severity: "INFO", payload: { episodeId: `EP-${i}` },
    })),
    { code: "CAPABILITY_SOLUTION_CONTEXT_MISSING", severity: "GATING", payload: { capabilityId: "M-2" } },
  ],
});

const CONFIG = Object.freeze({ recommendationPrecisionMlPerDay: 0.1 });

s.test("DOS-01", "every phrase in the status line names its own subject", () => {
  /* The defect: four separate rows collapsed into one line read
     `9.00 dKH · in range · not clear yet` — and "not clear yet" says nothing
     about WHAT is not clear. The spec calls this out by name. */
  const parts = statusParts(FALLING);
  eq(parts.length, 3, "value, position and trend");
  eq(parts[0], "7.11 dKH", "the value carries its unit");
  ok(/range/.test(parts[1]), `the position names the range: "${parts[1]}"`);
  ok(/alkalinity/i.test(parts[2]), `the trend names what is moving: "${parts[2]}"`);

  /* And the one that used to read "not clear yet" on its own. */
  const vague = statusParts({ ...FALLING, trajectory: "UNCERTAIN", observedTrajectory: null });
  ok(/alkalinity/i.test(vague[2]),
    `an unknown trend still names its subject: "${vague[2]}"`);
});

s.test("DOS-02", "the status line never states safety", () => {
  /* Removed by the spec: redundant with position, and it rendered in red,
     which reads as an alarm for good news. */
  const line = statusParts({ ...FALLING, outerBoundState: "WITHIN_BOUNDS" }).join(" · ");
  ok(!/safe|bound|outer/i.test(line), `no safety wording in "${line}"`);
});

s.test("DOS-03", "the recommendation reads as sentences and names the dose in its headline", () => {
  const rec = recommendation(FALLING, 180);
  ok(/9\.00 mL\/day/.test(rec.head), `the headline states the dose: "${rec.head}"`);
  const body = rec.body.join("");
  /* V1's shape: what is happening, what the gap is, what the step does. */
  ok(/7\.11 dKH/.test(body), "the body states the reading");
  ok(/0\.639/.test(body), "and what the tank uses");
  ok(/0\.609/.test(body), "and what the dose supplies");
  ok(/\. [A-Z]/.test(body), "it is sentences, not labelled figures");
  /* No minus sign anywhere in prose — a slope is a magnitude and the
     direction is a word. */
  ok(!body.includes("-0."), `no minus signs in prose: "${body}"`);
  ok(!/−0\.0[0-9]+ dKH a day short/.test(body), "and none smuggled in as a unicode minus");
});

s.test("DOS-04", "a hold offers the keeper the chance to change the dose anyway", () => {
  /* V1's button, kept. A hold is advice and the keeper may disagree with it. */
  const held = recommendation({
    ...FALLING,
    doseRecommendation: { action: "HOLD_CURRENT_DOSE", currentDoseMlPerDay: 8.8 },
  }, 180);
  ok(/Hold at 8\.80 mL\/day/.test(held.head), `the hold names the dose: "${held.head}"`);
  eq(held.offerChangeAnyway, true, "and the button is offered");
  eq(recommendation(FALLING, 180).offerChangeAnyway, false, "but not where a change is recommended");
});

s.test("DOS-05", "the difference box names the gap rather than printing a bare number", () => {
  const short = boxes(FALLING)[2];
  ok(/short/.test(short.value), `a shortfall says so: "${short.value}"`);
  ok(/0\.030/.test(short.value), "and states the size of it");

  const excess = boxes({
    ...FALLING,
    consumption: { ...FALLING.consumption, consumptionDkhPerDay: 0.55 },
  })[2];
  ok(/excess/.test(excess.value), `a surplus says so: "${excess.value}"`);

  /* Matching is the ENGINE's margin, not a threshold this layer invents. */
  const matching = boxes({
    ...FALLING,
    consumption: { ...FALLING.consumption, consumptionDkhPerDay: 0.6089 },
  })[2];
  ok(/matching/.test(matching.value), `no readable difference says so: "${matching.value}"`);
});

s.test("DOS-06", "a span of days renders in plain English, never as a raw decimal", () => {
  /* The defect, verbatim from the round-three list: "4 over 4.99 days". */
  eq(spanInWords(4.99), "five days", "4.99 days rounds to the nearest half day, in words");
  eq(spanInWords(9.0), "nine days", "a whole span");
  eq(spanInWords(1), "one day", "one day is not 'one days'");
  eq(spanInWords(1.5), "a day and a half", "a half span");
  eq(spanInWords(0.0004976851851851852), "half a day", "and the raw precision defect itself");
  ok(!/\d/.test(spanInWords(3.5)), `no digits below fifteen days: "${spanInWords(3.5)}"`);

  /* Past fourteen it goes back to a numeral, and it must not round TWICE —
     to the nearest half day and then to the nearest whole. That turns 20.4
     days into 21, a 3% error introduced by the formatting itself, which is
     precisely what item 4 exists to stop. */
  eq(spanInWords(20.4), "20 days", "a long span rounds from the original, not from the half-rounded figure");
  eq(spanInWords(20.6), "21 days", "and still rounds up when it should");

  /* And a figure it cannot render is withheld rather than guessed at. */
  for (const bad of [null, undefined, NaN, -1, "5"]) {
    eq(spanInWords(bad), null, `${JSON.stringify(bad)} is not a span and produces nothing`);
  }
});

s.test("DOS-07", "an INFO code that carries no calculation never reaches the screen", () => {
  const rows = reasonRows(FALLING);
  const codes = rows.map((r) => r.code);
  for (const narration of [
    "SEGMENT_LOOKBACK_NOT_EXTENDED", "TRAJECTORY_RAPID_NOT_CONFIRMED",
    "CONFIG_VERSION_RESOLVED", "AUDIT_TRACE_WRITTEN", "SAFETY_MG_GATE_UNKNOWN",
  ]) {
    ok(!codes.includes(narration), `${narration} is the engine narrating itself and is dropped`);
  }
  /* And the ones that DO carry arithmetic a keeper can check are kept. */
  for (const keeps of ["CONSUMPTION_ESTIMATED", "UNCERTAINTY_FLOOR_APPLIED", "TRAJECTORY_FALLING"]) {
    ok(codes.includes(keeps), `${keeps} carries a calculation and is kept`);
  }
});

s.test("DOS-08", "identical reason codes collapse to one row with a count", () => {
  /* Twenty-eight records of one fact is one fact, not twenty-eight rows.
     `EPISODE_RESOLVED` arrived 28 times on the owner's real screen. */
  const rows = reasonRows(FALLING);
  const episodes = rows.filter((r) => r.code === "EPISODE_RESOLVED");
  eq(episodes.length, 0, "and this one is pure process narration, so it is dropped entirely");

  /* The collapsing itself, on a code that IS kept. */
  const twice = reasonRows({
    ...FALLING,
    reasonCodes: [
      { code: "CONSUMPTION_ESTIMATED", severity: "INFO", payload: { P: 1 } },
      { code: "CONSUMPTION_ESTIMATED", severity: "INFO", payload: { P: 1 } },
      { code: "CONSUMPTION_ESTIMATED", severity: "INFO", payload: { P: 1 } },
    ],
  });
  eq(twice.length, 1, "three of one code is one row");
  eq(twice[0].count, 3, "carrying the count");
});

s.test("DOS-09", "the working shows the arithmetic, and every figure in it is the engine's", () => {
  const sections = working(FALLING, CONFIG);
  const text = sections.flatMap((x) => x.lines).join(" ");
  ok(sections.length >= 3, `several sections: ${sections.map((x) => x.title).join(", ")}`);
  /* The sum a keeper can check: what went in, plus what was lost, is what the
     tank used. */
  ok(/0\.609 \+ 0\.030 = 0\.639/.test(text), `the consumption sum is shown: "${text.slice(0, 160)}"`);
  ok(/0\.030 − 0\.014 = 0\.016/.test(text), "the supported-movement subtraction is shown");
  ok(/8\.80 \+ 0\.20 = 9\.00/.test(text), "and the dose arithmetic is shown");
  ok(/approximately nine days/.test(text), "readings used, in plain English");
  ok(!/4\.99|\d\.\d{5,}/.test(text), "and no raw precision anywhere in it");
});

s.test("DOS-10", "the potency estimator is a sentence, and does not promise a check this build cannot run", () => {
  const gated = potencySentence(FALLING);
  ok(/0\.0692/.test(gated), `it names the figure in use: "${gated}"`);
  ok(/switched off by design/.test(gated),
    "and says the check is off rather than implying it arrives with more data");

  const learned = potencySentence({
    ...FALLING,
    potency: {
      selectedPotencyDkhPerMl: 0.0692,
      learnedPotencyDkhPerMl: 0.0707,
      potencyLearningState: "ACTIVE",
      potencyObservations: [{}, {}],
    },
    reasonCodes: [{ code: "POTENCY_DISCREPANCY_BAND", severity: "INFO", payload: { band: "AGREES" } }],
  });
  ok(/0\.0707/.test(learned) && /0\.0692/.test(learned), `both figures: "${learned}"`);
  ok(/two dosing periods/.test(learned) || /2 dosing periods/.test(learned),
    "and how many periods it is built on");
});

export default s;
