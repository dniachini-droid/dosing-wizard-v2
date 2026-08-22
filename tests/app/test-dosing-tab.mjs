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

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { suite, eq, ok } from "./harness.mjs";
import {
  boxes, correctionPanel, learnerLimits, potencyBox, potencyProvenance, reasonRows, recommendation,
  spanInWords, statusParts, whyPanel, working,
} from "../../app/src/present/dosing-tab.js";
import { has, t } from "../../app/src/strings.js";

const ROOT = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

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
  /* A dose is written 8.8 mL/day, not 8.80 — the owner's spelling, decided
     22 August. One decimal always survives; a reading still keeps two. */
  ok(/9\.0 mL\/day/.test(rec.head), `the headline states the dose: "${rec.head}"`);
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
  ok(/Hold at 8\.8 mL\/day/.test(held.head), `the hold names the dose: "${held.head}"`);
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

s.test("DOS-07", "no No-effect row reaches the screen, and no learner-only limit does either", () => {
  /* Finding 8, the owner's own reasoning: an INFO code "by definition changed
     nothing", so none of them appears. What a keeper wants from the ones that
     carried arithmetic is already in `working()`, as a sentence beside the
     figure it produced — DOS-09 pins that it is still there. */
  const rows = reasonRows(FALLING);
  const codes = rows.map((r) => r.code);
  for (const narration of [
    "SEGMENT_LOOKBACK_NOT_EXTENDED", "TRAJECTORY_RAPID_NOT_CONFIRMED",
    "CONFIG_VERSION_RESOLVED", "AUDIT_TRACE_WRITTEN", "SAFETY_MG_GATE_UNKNOWN",
  ]) {
    ok(!codes.includes(narration), `${narration} is the engine narrating itself and is dropped`);
  }
  /* The three the owner named by their wording, all INFO, all now gone. */
  for (const named of [
    "SEGMENT_SELECTED",                    /* "the stretch of history using this assessment" */
    "DELIVERY_BASIS_PROGRAMMED_SCHEDULE",  /* "your confirmed pump schedule was used" */
    "POTENCY_SELECTED_THEORETICAL",        /* "strength per millilitre comes from your recipe" */
  ]) {
    ok(!codes.includes(named), `${named} is a No-effect row and is not shown`);
  }
  ok(rows.every((r) => r.severity !== "INFO"), "no INFO row survives at all");
});

s.test("DOS-07b", "a limit on the potency learner is not shown as a limit on the dose", () => {
  /* Finding 7. All three were shown to the owner as "Limited this" on a screen
     that was correctly sizing his dose from the strength and dose he had
     entered. Each declares `potency.learnedPotencyDkhPerMl` as the only output
     it touches — they limit the learner and nothing else. */
  const result = {
    ...FALLING,
    reasonCodes: [
      { code: "CAPABILITY_SOLUTION_CONTEXT_MISSING", severity: "GATING", payload: {} },
      { code: "CAPABILITY_DELIVERY_CONTEXT_MISSING", severity: "GATING", payload: {} },
      { code: "CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED", severity: "GATING", payload: {} },
      { code: "POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE", severity: "GATING", payload: {} },
      { code: "OUTPUT_INSUFFICIENT_DATA_ACTIONABLE", severity: "GATING", payload: {} },
      { code: "TRAJECTORY_UNCERTAINTY_LIMITED", severity: "GATING", payload: {} },
    ],
  };
  const codes = reasonRows(result).map((r) => r.code);
  eq(codes.length, 1, `only the one genuine limit survives: ${codes.join(", ")}`);
  eq(codes[0], "TRAJECTORY_UNCERTAINTY_LIMITED", "and it is the one about the dose");

  /* Not discarded — moved. The estimator's own box states them beside the
     estimate they limit. */
  const limits = learnerLimits(result).map((r) => r.code);
  ok(limits.includes("CAPABILITY_DELIVERY_CONTEXT_MISSING"),
    "delivery context is stated by the potency box instead");
  ok(limits.includes("CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED"),
    "and so is the programmed dose state");
  ok(!limits.includes("TRAJECTORY_UNCERTAINTY_LIMITED"),
    "a real dose limit is not swallowed by the potency box");
});

s.test("DOS-07c", "what your pump is set to is never named as missing by the learner's own row", () => {
  /* The owner entered 8.8 mL/day and was told "what your pump is set to" was
     one of two things missing. `CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED`
     is `capability.py:149`, a hard-coded NOT_RUN emitted on every assessment. */
  const lines = whyPanel({
    reasonCodes: [
      { code: "CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED", severity: "GATING", payload: {} },
    ],
    retest: { recommendedAt: "2026-08-24T09:00:00+10:00" },
  });
  ok(!lines.join(" ").includes("what your pump is set to"),
    `the learner's row does not claim the pump dose is missing: "${lines.join(" ")}"`);

  /* The consumption owner's own refusal still does, because that one IS a
     statement that there is no dose history to work from. */
  const real = whyPanel({
    reasonCodes: [
      { code: "CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE", severity: "BLOCKING", payload: {} },
    ],
  });
  ok(real.join(" ").includes("what your pump is set to"),
    `a genuine absence is still named: "${real.join(" ")}"`);
});

s.test("DOS-08", "identical reason codes collapse to one row with a count", () => {
  /* Twenty-eight records of one fact is one fact, not twenty-eight rows.
     `EPISODE_RESOLVED` arrived 28 times on the owner's real screen. */
  const rows = reasonRows(FALLING);
  const episodes = rows.filter((r) => r.code === "EPISODE_RESOLVED");
  eq(episodes.length, 0, "and this one is pure process narration, so it is dropped entirely");

  /* The collapsing itself, on a code that IS kept — a GATING one, now that no
     INFO code reaches this list. */
  const twice = reasonRows({
    ...FALLING,
    reasonCodes: [
      { code: "TRAJECTORY_UNCERTAINTY_LIMITED", severity: "GATING", payload: { P: 1 } },
      { code: "TRAJECTORY_UNCERTAINTY_LIMITED", severity: "GATING", payload: { P: 1 } },
      { code: "TRAJECTORY_UNCERTAINTY_LIMITED", severity: "GATING", payload: { P: 1 } },
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
  ok(/8\.8 \+ 0\.2 = 9\.0/.test(text), "and the dose arithmetic is shown");
  ok(/approximately nine days/.test(text), "readings used, in plain English");
  ok(!/4\.99|\d\.\d{5,}/.test(text), "and no raw precision anywhere in it");
});

/* The estimator's own fixture. Synthetic, and it says so: two dose changes
   read, both eligible, the pool settled — the state the owner's tank reaches
   after he has changed his dose twice. The figures are the shape the engine
   produces, not measurements of anybody's tank. */
const withPotency = (over) => ({
  ...FALLING,
  potency: {
    selectedPotencyDkhPerMl: 0.0692,
    learnedPotencyDkhPerMl: 0.0740,
    potencyConfidence: "CALIBRATED",
    potencyLearningState: "CAPABILITY_GATED",
    potencyObservations: [
      { observationId: "POB-IV-2026-06-20T08:00:00+10:00", eligibility: "ELIGIBLE",
        observedPotencyDkhPerMl: 0.0738, deltaDoseMlPerDay: 1.5, deltaSlopeDkhPerDay: 0.1107 },
      { observationId: "POB-IV-2026-07-15T08:00:00+10:00", eligibility: "ELIGIBLE",
        observedPotencyDkhPerMl: 0.0742, deltaDoseMlPerDay: -1.3, deltaSlopeDkhPerDay: -0.0965 },
    ],
    ...(over.potency || {}),
  },
  reasonCodes: over.reasonCodes || [
    { code: "POTENCY_DISCREPANCY_BAND", severity: "INFO", payload: { band: "MEANINGFUL" } },
  ],
});

const RECIPE = Object.freeze({ recommendationPrecisionMlPerDay: 0.1, chemical: "NA2CO3", stockConcentrationGPerL: 101 });

s.test("DOS-10", "the estimator observes while gated, and never substitutes silently", () => {
  /* Finding 13. The gate is what makes "never substitutes silently" true: the
     learner observes and pools while gated, and `selectedPotency` stays the
     keeper's figure however good the pool. The box shows what it WOULD have
     concluded; only the keeper moves the number. */
  const box = potencyBox(withPotency({}), RECIPE);
  eq(box.entered, 0.0692, "the figure in use is the keeper's");
  eq(box.learned, 0.0740, "and the measured one is shown beside it");
  eq(box.eligible, 2, "built on the observations the engine called eligible");
  ok(box.offersChoice, "and because the engine is confident, the keeper is offered the choice");
  eq(box.state, "stronger", "with the recipe named, because the app holds one");
});

s.test("DOS-10b", "nothing to estimate from yet says so, and offers no choice", () => {
  const box = potencyBox(FALLING, RECIPE);
  eq(box.state, "notYet", "it is waiting");
  eq(box.learned, null, "with no measured figure to show");
  eq(box.offersChoice, false, "and nothing to decide");
  ok(/readings either side of a dose change/.test(t("dosing.potency.notYet", { entered: "0.0692" })),
    "and it says what it is waiting for, rather than 'not enough data'");
});

s.test("DOS-10c", "the choice is offered only where the ENGINE is confident, and only where they disagree", () => {
  /* Two thresholds this file must not own. "Confident enough to act on" is
     `ALK-POTENCY-CONFIDENCE-001`'s ladder — the states at which canon itself
     would move `selectedPotency`. "Do these agree" is `ALK-021`, emitted as
     `POTENCY_DISCREPANCY_BAND`. Neither is a percentage compared here. */
  for (const confidence of ["THEORETICAL_ONLY", "EXPLORATORY", "PROVISIONAL", "UNRESOLVED"]) {
    const box = potencyBox(withPotency({ potency: { potencyConfidence: confidence } }), RECIPE);
    eq(box.offersChoice, false, `${confidence} is below the bar canon sets, so no choice is offered`);
    eq(box.state, "notConfident", `${confidence} says so rather than going quiet`);
  }
  for (const confidence of ["CALIBRATED", "STRONGLY_CALIBRATED"]) {
    const box = potencyBox(withPotency({ potency: { potencyConfidence: confidence } }), RECIPE);
    ok(box.offersChoice, `${confidence} is the bar canon sets, so the choice is offered`);
  }

  /* Confident, and they agree. No choice, because there is nothing to choose. */
  const agreeing = potencyBox(withPotency({
    reasonCodes: [{ code: "POTENCY_DISCREPANCY_BAND", severity: "INFO", payload: { band: "BROADLY_CONSISTENT" } }],
  }), RECIPE);
  eq(agreeing.state, "agrees", "it says they agree closely");
  eq(agreeing.offersChoice, false, "and asks the keeper nothing");
});

s.test("DOS-10d", "it never claims a recipe the app does not hold", () => {
  /* A keeper who typed a dKH/mL figure straight in has no recipe for his
     solution to be stronger than. Same rule as
     `dosing.working.uses.potencyFrom`. */
  const stated = potencyBox(withPotency({}), { recommendationPrecisionMlPerDay: 0.1 });
  eq(stated.state, "strongerStated", "so the sentence compares against the figure he entered");
  ok(/than the figure you entered/.test(t("dosing.potency.strongerStated", { learned: "0.0740", entered: "0.0692" })),
    "and says exactly that");
  ok(/than the recipe suggests/.test(t("dosing.potency.stronger", { learned: "0.0740", entered: "0.0692" })),
    "while the recipe form is kept for where there is one");
});

s.test("DOS-10e", "provenance describes the figure the decision put in force, and no other", () => {
  /* "Provenance is shown wherever the figure appears — in Setup and on the
     Dosing tab." One reader, so the two surfaces cannot describe the same
     number differently.

     `inUse` is what the decision put in force: the measured figure if he took
     it, his own if he kept it. Owner decision 33's second requirement is that a
     figure measured from the tank must not be confused with one he entered, and
     without that field this function described whatever the configuration
     currently held — so a keeper who accepted 0.0707 and later typed 0.08 was
     told "0.08 dKH/mL — measured from your tank's response". */
  const accepted = potencyProvenance({
    selectedPotencyDkhPerMl: 0.0707,
    potencyDecision: { accepted: true, learned: 0.0707, inUse: 0.0707, on: "2026-08-22" },
  });
  eq(accepted.key, "dosing.potency.fromMeasured", "an accepted figure says it was measured");
  eq(accepted.value, 0.0707, "and names it");
  ok(/measured from your tank's response, accepted/.test(
    t(accepted.key, { value: "0.0707", date: "22 Aug" })), "in the owner's own words");

  const kept = potencyProvenance({
    selectedPotencyDkhPerMl: 0.0692,
    potencyDecision: { accepted: false, learned: 0.0740, inUse: 0.0692, on: "2026-08-22" },
  });
  eq(kept.key, "dosing.potency.fromKept", "a kept figure says it was kept, which is also a decision he made");

  /* THE ONE THAT WAS WRONG. He accepted a measured figure, then typed a
     different one. Nothing measured 0.08 and nothing may say so. */
  eq(potencyProvenance({
    selectedPotencyDkhPerMl: 0.08,
    potencyDecision: { accepted: true, learned: 0.0707, inUse: 0.0707, on: "2026-08-22" },
  }), null, "a figure typed after the decision inherits nothing from it");

  eq(potencyProvenance({
    selectedPotencyDkhPerMl: 0.075,
    potencyDecision: { accepted: false, learned: 0.0740, inUse: 0.0692, on: "2026-08-22" },
  }), null, "and neither does one typed after he chose to keep his own");

  eq(potencyProvenance({ selectedPotencyDkhPerMl: 0.0692 }), null,
    "and a keeper who has never been asked is told nothing, because there is nothing to tell");
});

s.test("DOS-10f", "it keeps watching after acceptance, and asks again if it learns something different", () => {
  /* "The estimator keeps watching after acceptance. If it later learns
     something different and is confident, it asks again." */
  const moved = potencyBox(withPotency({}), {
    ...RECIPE,
    potencyDecision: { accepted: true, learned: 0.0707, inUse: 0.0707, on: "2026-08-22" },
  });
  ok(moved.asksAgain, "the estimate has moved since he decided, so it asks again");
  ok(moved.offersChoice, "and offers the choice again");

  const unchanged = potencyBox(withPotency({}), {
    ...RECIPE,
    potencyDecision: { accepted: true, learned: 0.0740, inUse: 0.0740, on: "2026-08-22" },
  });
  eq(unchanged.asksAgain, false, "an estimate that has not moved does not ask him the same question twice");
});

s.test("DOS-10g", "the working shows the arithmetic behind the estimate, and every figure in it is the engine's", () => {
  const box = potencyBox(withPotency({}), RECIPE);
  const text = box.working.join(" ");
  ok(/0\.0738/.test(text), `each dose change it read: "${text.slice(0, 120)}"`);
  ok(/0\.0742/.test(text), "including the second one");
  ok(/0\.0740/.test(text), "and the pooled figure");
  ok(/0\.0692/.test(text), "against the one the keeper entered");
});

s.test("DOS-11", "every response the engine can reach has a keeper-facing state, and a word for it", () => {
  /* `CORRECTION_STATE` claims to place every member of `response.py`'s closed
     vocabulary, and the claim was true and unenforced. A classification that
     fell through returns null from `correctionPanel` and the panel renders
     NOTHING — the keeper who changed his dose is shown no panel at all, which
     looks identical to having no active intervention.

     Read out of the engine rather than restated here. A list copied into a test
     is a second owner of the vocabulary and agrees only until the engine adds
     a state — which is exactly the case this exists to catch. */
  const block = fs.readFileSync(path.join(ROOT, "engine/alk_v2/response.py"), "utf8")
    .split("# --- ResponseAttribution, the complete closed vocabulary")[1]
    .split("#: The six")[0];
  const vocabulary = [...block.matchAll(/^([A-Z_]+) = "\1"/gm)].map((m) => m[1]);
  ok(vocabulary.length >= 15, `the engine's closed vocabulary, read from the engine: ${vocabulary.length}`);

  const iv = {
    interventionId: "IV-1", actualStartTime: "2026-08-10T09:00:00+10:00",
    oldDoseMlPerDay: 8, newDoseMlPerDay: 10,
  };
  for (const classification of vocabulary) {
    const p = correctionPanel(
      { activeIntervention: iv, responseAssessment: { classification } },
      "2026-08-20T09:00:00+10:00"
    );
    ok(p, `${classification} renders a panel rather than nothing`);
    ok(has(`dosing.correction.${p.state}`), `${classification} -> ${p.state}, and that state has a sentence`);
  }

  /* And the reverse: the app names no state the engine cannot produce. A
     keeper-facing sentence for an unreachable classification is dead wording
     that reads as supported behaviour. */
  const src = fs.readFileSync(path.join(ROOT, "app/src/present/dosing-tab.js"), "utf8");
  const table = src.split("const CORRECTION_STATE = Object.freeze({")[1].split("});")[0];
  const claimed = [...table.matchAll(/^\s{2}([A-Z_]+):/gm)].map((m) => m[1]);
  eq(claimed.filter((k) => !vocabulary.includes(k)).join(", "), "",
    "the app names no response the engine cannot reach");
  eq(vocabulary.filter((k) => !claimed.includes(k)).join(", "), "",
    "and the engine reaches no response the app cannot say");
});

s.test("DOS-10h", "a band the engine did not emit is not a statement that the figures disagree", () => {
  /* `bandOf` returns null where no `POTENCY_DISCREPANCY_BAND` is in the result,
     and null used to fall straight through to the disagreement branch — so
     silence from `ALK-021`'s owner offered the keeper a dose change on the same
     screen as a confident, measured, stated disagreement.

     Owner decision 33 conditions the offer on the band SAYING they do not
     broadly agree. */
  const banded = (band) => potencyBox(withPotency({
    reasonCodes: band ? [{ code: "POTENCY_DISCREPANCY_BAND", severity: "INFO", payload: { band } }] : [],
  }), RECIPE);

  for (const band of ["MEANINGFUL", "LARGE"]) {
    ok(banded(band).offersChoice, `${band} is the engine saying they do not broadly agree`);
  }
  eq(banded("BROADLY_CONSISTENT").state, "agrees", "and this one is it saying they do");
  eq(banded("BROADLY_CONSISTENT").offersChoice, false, "so there is nothing to choose");

  const silent = banded(null);
  eq(silent.offersChoice, false, "silence is not disagreement, so no choice is offered");
  eq(silent.state, "notConfident", "and the estimate is still shown rather than hidden");
});

s.test("DOS-10i", "the confidence ladder is the engine's, in full, and REASSESSING never offers the choice", () => {
  /* The app compared against a hand-written pair of state names. Read the
     ladder out of `potency.py` instead, so a state the engine gains cannot
     quietly fall into the wrong half — and so `REASSESSING`, which means the
     learner is re-examining a figure it previously stood behind, is provably
     not a state in which the keeper is asked to re-size his dose. */
  const src = fs.readFileSync(path.join(ROOT, "engine/alk_v2/potency.py"), "utf8");
  const ladder = [...src.split("# PotencyConfidence — closed vocabulary")[1]
    .split("\n\n")[0].matchAll(/^([A-Z_]+) = "\1"/gm)].map((m) => m[1]);
  eq(ladder.length, 8, `the ladder the engine declares: ${ladder.join(", ")}`);

  const MOVES_THE_FIGURE = new Set(["CALIBRATED", "STRONGLY_CALIBRATED"]);
  for (const confidence of ladder) {
    const box = potencyBox(withPotency({ potency: { potencyConfidence: confidence } }), RECIPE);
    eq(box.offersChoice, MOVES_THE_FIGURE.has(confidence),
      `${confidence}: the choice is offered only where canon would itself move selectedPotency`);
  }
  ok(ladder.includes("REASSESSING"), "REASSESSING is in the ladder");
  eq(potencyBox(withPotency({ potency: { potencyConfidence: "REASSESSING" } }), RECIPE).offersChoice, false,
    "and a learner re-examining its own figure does not ask the keeper to act on it");
});

export default s;
