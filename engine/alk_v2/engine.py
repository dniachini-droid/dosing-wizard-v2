"""The pure pipeline: `assess(events, configurationHistory, asOf) -> EngineResult`.

One assessment is one pure function of three arguments. No I/O, no network, no
database, no clock, no framework, no globals. The only way a value enters is as
an argument and the only way one leaves is as a return value, which is what makes
canon §64's replay contract achievable: replay is calling this again.

Stages run in `ALK-V2-IMPLEMENTATION-CONTRACT.md` §4's order and a later stage
never rewrites an earlier stage's output.

**What this build covers, and what it does not.** Stage one is the normal path a
settled tank exercises: readings in, observed trajectory, uncertainty, supported
trajectory, consumption, maintenance dose, retest date, structured output.
Safety returns and outer-bound *handling*, correction and return plans, response
classification and the potency learner are not built here. Where the normal path
meets one of them the engine emits the unbuilt state with a reason code rather
than a plausible number: an unbuilt path is visibly unbuilt.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from . import capability as cap_mod
from . import dosing, kernel, ledger as ledger_mod, observation, retest as retest_mod
from . import intervention as iv_mod
from . import potency as potency_mod
from . import trajectory as traj
from .constants import (
    ADVISORY_OFFSET,
    B_SAFETY,
    HOURS_PER_DAY,
    POSTCHANGE_FIRST_TEST_HOURS,
    POSTCHANGE_SECOND_TEST_HOURS,
)
from .kernel import Computed, Instant, clean, elapsed_days, parse_instant

ENGINE_VERSION = "alk-v2-engine/0.1.0 (stage one — normal path)"
CANON_VERSION = "SHARED_V2_FREEZE_2 / ALK_V2_FREEZE_5"

NOT_RUN = "NOT_RUN"
WITHHELD = "WITHHELD"
NONE = "NONE"
UNKNOWN = "UNKNOWN"
UNSPECIFIED = "UNSPECIFIED"

#: Reason codes whose severity makes them eligible to explain a withheld output.
#: The engine does not know a code's severity -- the catalogue does, and the
#: adapter stamps it -- so this is the set the engine deliberately uses when it
#: has an output to explain.
_UMBRELLA = "OUTPUT_INSUFFICIENT_DATA_ACTIONABLE"


class Code:
    """A reason code with its payload. Owner and severity are stamped later.

    `ALK-V2-REASON-CODES.md` owns which module emits a code and how severe it
    is. The domain must not carry a second copy of that table -- `MASTER RULE 1`
    calls two implementations of one inference a defect -- so the domain decides
    *which* code and *what payload*, and the impure boundary annotates it from
    the catalogue it read at startup.
    """

    __slots__ = ("code", "payload")

    def __init__(self, code: str, **payload: Any):
        self.code = code
        self.payload = payload


def assess(
    events: List[Dict[str, Any]],
    configuration_history: List[Dict[str, Any]],
    as_of_text: str,
) -> Dict[str, Any]:
    """Produce one `EngineResult`.

    Returns a plain dictionary rather than a typed object because the documented
    interface is a JSON line protocol and every consumer -- harness, adapter,
    future presentation layer -- reads it as data.
    """
    codes: List[Code] = []
    withheld_outputs: List[str] = []

    as_of = parse_instant(as_of_text)
    if as_of is None:
        # Not a domain state: the third argument is malformed, so no assessment
        # instant exists and nothing downstream can be dated.
        raise ValueError(
            "asOf must be an offset-aware ISO-8601 instant; "
            "the engine never supplies one of its own"
        )

    # 0 — RESOLVE CONFIGURATION -------------------------------------------
    cfg = ledger_mod.resolve_configuration(configuration_history, as_of)
    if cfg.historical_unavailable:
        codes.append(
            Code(
                "CONFIG_HISTORICAL_UNAVAILABLE",
                requestedAt=as_of.text,
                firstProvenEffectiveFrom=(
                    cfg.effective_from.text if cfg.effective_from else UNKNOWN
                ),
            )
        )
    else:
        codes.append(
            Code(
                "CONFIG_VERSION_RESOLVED",
                configVersionId=cfg.version_id,
                effectiveFrom=cfg.effective_from.text if cfg.effective_from else UNKNOWN,
            )
        )

    # 1 — VALIDATE + NORMALISE, 2 — CLUSTER -------------------------------
    led = ledger_mod.build(events)
    eps, excluded = observation.episodes(led)

    if ledger_mod.READING_SERIES in led.unhandled_kinds:
        # `OD-014`: the expansion of `READING_SERIES` has no owner, two
        # implementations of it already exist in tooling, and the fixture format
        # says in terms *do not* resolve it by writing a fourth. So the engine
        # declines to read the shorthand rather than inventing a third owner of
        # one inference, and says so where a reader will see it.
        codes.append(
            Code(
                _UMBRELLA,
                missing=[
                    "READING_SERIES expansion has no owner (OD-014); this engine "
                    "does not expand the shorthand and the readings it carries are "
                    "not in the assessment"
                ],
                currentValueDkh=UNKNOWN,
                nextUsefulTestAt=as_of.text,
            )
        )

    for e in eps:
        codes.append(
            Code(
                "EPISODE_RESOLVED",
                episodeId=e.episode_id,
                episodeValueDkh=e.value_dkh,
                episodeAt=e.at.text,
                combinedMeasurementCount=e.combined_measurement_count,
                ruleId="ALK-EPISODE-RESOLUTION-001",
            )
        )
        if e.combined_measurement_count > 1:
            codes.append(
                Code(
                    "EPISODE_MEASUREMENTS_COMBINED",
                    episodeId=e.episode_id,
                    combinedMeasurementCount=e.combined_measurement_count,
                    memberMeasurementIds=[m.reading_id for m in e.members],
                    episodeValueDkh=e.value_dkh,
                    episodeSpreadDkh=e.spread_dkh,
                    ruleId="ALK-TESTING-EPISODE-001",
                )
            )
            codes.append(
                Code(
                    "CLUSTER_FORMED_AUTOMATIC",
                    clusterId=e.cluster_id,
                    readingIds=[m.reading_id for m in e.members],
                    windowMinutes=30,
                )
            )
            codes.append(
                Code(
                    "CLUSTER_REPEAT_NOT_INDEPENDENT",
                    clusterId=e.cluster_id,
                    memberCount=e.combined_measurement_count,
                )
            )
        if e.status == observation.ANOMALOUS:
            codes.append(
                Code(
                    "CLUSTER_ANOMALOUS_SPREAD",
                    clusterId=e.cluster_id,
                    spreadDkh=e.spread_dkh,
                    limitDkh=0.20,
                    memberValues=[m.raw_value_dkh for m in e.members],
                )
            )

    # 3 — POSITION ---------------------------------------------------------
    pos = observation.position(eps, cfg)

    # 6 — INDEPENDENCE ------------------------------------------------------
    accepted, not_accepted = observation.select_independent(eps)
    if not_accepted:
        codes.append(
            Code(
                "EVIDENCE_INDEPENDENT_SELECTION_APPLIED",
                acceptedClusterIds=[e.cluster_id for e in accepted],
                notAcceptedClusterIds=[e.cluster_id for e in not_accepted],
                separationHours=[
                    elapsed_days(a.at, b.at) * HOURS_PER_DAY
                    for a, b in zip(accepted, not_accepted)
                ],
                ruleId="ALK-INDEPENDENT-SELECTION-001",
            )
        )

    # 5 — SEGMENT (the boundary causes this build observes) ----------------
    hard_confounders = _hard_confounders(led, codes)

    # 7, 8, 9 — TREND, UNCERTAINTY, SUPPORT --------------------------------
    obs = traj.trend(accepted)
    if obs is not None:
        obs = traj.uncertainty(obs, accepted)
        for c in obs.codes:
            codes.append(Code(c, **_uncertainty_payload(c, obs)))
        codes.append(
            Code(
                "TRAJECTORY_ESTIMATOR_THEIL_SEN"
                if obs.estimator == traj.THEIL_SEN
                else "TRAJECTORY_ESTIMATOR_TWO_POINT",
                **(
                    {"n": obs.n, "pairwiseSlopeCount": len(obs.pairwise_slopes)}
                    if obs.estimator == traj.THEIL_SEN
                    else {"deltaDays": obs.times_days[-1] - obs.times_days[0]}
                ),
            )
        )
    sup = traj.supported_slope(obs.slope, obs.sigma_s) if obs is not None else None

    # 12 — RAPID -----------------------------------------------------------
    rapid = traj.rapid(eps, known_events_explain=bool(hard_confounders))
    if rapid.confirmed:
        codes.append(
            Code(
                "TRAJECTORY_RAPID_CONFIRMED",
                pairSlopeDkhPerDay=rapid.pair_slope,
                thresholdDkhPerDay=0.30,
                elapsedHours=(rapid.pair_span_days or 0.0) * HOURS_PER_DAY,
                rapidBasis=rapid.basis,
            )
        )
    elif rapid.failed_conditions:
        codes.append(
            Code("TRAJECTORY_RAPID_NOT_CONFIRMED", failedConditions=rapid.failed_conditions)
        )

    # 10 — MOVEMENT EVIDENCE ------------------------------------------------
    latest_anomalous = pos.episode is not None and pos.episode.status == observation.ANOMALOUS
    historical_anomalous = any(
        e.status == observation.ANOMALOUS and e is not pos.episode for e in accepted
    )
    ev = traj.movement_evidence(
        n=len(accepted),
        span_days=obs.span_days if obs is not None else 0.0,
        hard_confounders=hard_confounders,
        latest_anomalous=latest_anomalous,
        historical_anomalous=historical_anomalous,
        observed_slope=obs.slope if obs is not None else None,
        supported=sup,
        rapid_confirmed=rapid.confirmed,
    )
    for c in ev.codes:
        codes.append(Code(c, **_evidence_payload(c, ev, obs, sup, as_of)))

    # 4 — CAPABILITY GATE ---------------------------------------------------
    caps = cap_mod.evaluate(led, cfg, potency_learning_gated=True)
    for c in caps:
        if c.reason_code:
            # The affected outputs live on the `CapabilityState` itself, and are
            # deliberately not repeated in the code's payload. Most capability
            # codes are `INFO`, and `INV-I4` is satisfied only by a `GATING` or
            # `REFUSAL` code naming the field -- so a payload that *looks* like
            # an explanation without being one would let a withheld output slip
            # past the umbrella below and be reported by nobody.
            codes.append(Code(c.reason_code, capabilityId=c.capability_id))

    # 12 — POTENCY ----------------------------------------------------------
    # Stage two. The learner reads the interventions built from stage one's
    # episodes and produces an estimate; nothing here writes back into trend,
    # uncertainty, support or consumption.
    #
    # `potencyLearning` is `CAPABILITY_GATED` in this runtime by
    # `MIGRATION-ALK-ONLY-001` and ships disabled. The gate is read from
    # configuration rather than hard-coded, so opening it is a configuration
    # change and not an engine change -- but the default stays shut, and the
    # core controller is fully functional while it is (`WG-ALK-046`).
    gated = str(cfg.get("potencyLearning", "CAPABILITY_GATED")) != "ACTIVE"

    interventions = iv_mod.build(
        led,
        eps,
        as_of,
        potency_at=_potency_at(cfg),
        confounders=hard_confounders,
    )
    for iv in interventions:
        codes.append(
            Code(
                "INTERVENTION_CREATED",
                interventionId=iv.intervention_id,
                oldDose=iv.old_dose if iv.old_dose is not None else UNKNOWN,
                newDose=iv.new_dose if iv.new_dose is not None else UNKNOWN,
                actualStartTime=iv.at.text,
                origin="MANUAL",
            )
        )
        if iv.snapshot.available:
            codes.append(
                Code(
                    "INTERVENTION_PREDICTION_SNAPSHOT_STORED",
                    interventionId=iv.intervention_id,
                    expectedSlopeChange=iv.snapshot.expected_slope_change,
                    predictedPostSlope=iv.snapshot.predicted_post_slope,
                    selectedPotencyAtPrediction=iv.snapshot.selected_potency_at_prediction,
                )
            )
        else:
            codes.append(
                Code(
                    "INTERVENTION_PREDICTION_SNAPSHOT_UNAVAILABLE",
                    interventionId=iv.intervention_id,
                    affectedOutputs=["responseAssessment"],
                )
            )
            codes.append(
                Code(
                    "CAPABILITY_PREDICTION_SNAPSHOT_MISSING",
                    interventionId=iv.intervention_id,
                )
            )
        if iv.anchor_relation_ambiguous:
            codes.append(
                Code(
                    "INTERVENTION_ANCHOR_AMBIGUOUS",
                    readingId=UNKNOWN,
                    instant=iv.at.text,
                )
            )
        if iv.interrupted_by:
            codes.append(
                Code(
                    "INTERVENTION_INTERRUPTED",
                    interventionId=iv.intervention_id,
                    interruptedByInterventionId=iv.interrupted_by,
                )
            )
        if iv.phase == iv_mod.EXPIRED:
            codes.append(
                Code(
                    "INTERVENTION_EXPIRED",
                    interventionId=iv.intervention_id,
                    daysSinceStart=iv.days_since_start,
                )
            )

    pot = potency_mod.run(cfg, interventions, gated=gated)
    p_selected = pot.selected
    potency = pot.projection()
    for code, payload in pot.codes:
        codes.append(Code(code, **payload))
    if gated:
        codes.append(
            Code("POTENCY_LEARNING_CAPABILITY_GATED", missingCapabilities=["M-2", "M-3", "M-9"])
        )
        codes.append(
            Code("CAPABILITY_POTENCY_LEARNER_GATED", missingCapabilities=["M-2", "M-3", "M-9"])
        )
    if p_selected is not None:
        codes.append(
            Code(
                "POTENCY_SELECTED_LEARNED"
                if pot.source == potency_mod.LEARNED
                else "POTENCY_SELECTED_THEORETICAL",
                **(
                    {
                        "learnedDkhPerMl": p_selected,
                        "n": len(pot.observations),
                        "RDisp_P": pot.r_disp if pot.r_disp is not None else UNKNOWN,
                        "confidence": pot.confidence,
                    }
                    if pot.source == potency_mod.LEARNED
                    else {
                        "theoreticalDkhPerMl": p_selected,
                        "chemical": cfg.get("chemical", UNKNOWN),
                        "concentrationGPerL": cfg.get("stockConcentrationGPerL", UNKNOWN),
                        "netVolumeL": cfg.get("netVolumeL", UNKNOWN),
                    }
                ),
            )
        )
    if pot.learned is not None and pot.theoretical:
        codes.append(
            Code(
                "POTENCY_DISCREPANCY_BAND",
                M=pot.learned / pot.theoretical,
                band=_discrepancy_band(pot.learned / pot.theoretical),
            )
        )

    # 14 — DELIVERY BASIS ---------------------------------------------------
    segment_start = accepted[0].at if accepted else None
    delivery = dosing.delivery(led, segment_start, as_of)
    for c in delivery.codes:
        codes.append(Code(c, **_delivery_payload(c, delivery, segment_start, as_of)))

    # 11 — CONSUMPTION ------------------------------------------------------
    cons = dosing.consumption(
        p_selected=p_selected,
        d_history=delivery.d_history,
        observed_slope=obs.slope if obs is not None else None,
        sigma_s=obs.sigma_s if obs is not None else None,
        evidence=ev.movement,
    )
    for c in cons.codes:
        codes.append(Code(c, **_consumption_payload(c, cons, p_selected, delivery, obs)))

    # 15 — MAINTENANCE PIPELINE --------------------------------------------
    fc = traj.forecast(pos.a_now, obs.slope if obs is not None else None, cfg)
    outer_bound_risk = _outer_bound_risk(fc)
    rec = dosing.recommend(
        evidence=ev.movement,
        trajectory=ev.trajectory,
        position=pos.position,
        observed_slope=obs.slope if obs is not None else None,
        supported_slope=sup.slope if sup is not None else None,
        sigma_s=obs.sigma_s if obs is not None else None,
        consumption_estimate=cons,
        p_selected=p_selected,
        d_current=delivery.d_current,
        precision=cfg.num("recommendationPrecisionMlPerDay"),
        net_volume_l=cfg.num("netVolumeL"),
        rapid_confirmed=rapid.confirmed,
        outer_bound_risk=outer_bound_risk,
        outer_bound_breached=pos.outer_bound_state
        in (observation.BREACHED_LOW, observation.BREACHED_HIGH),
    )
    for c in rec.codes:
        codes.append(
            Code(c, **_maintenance_payload(
                c, rec, obs, sup, cons, cfg, pos.position, ev.trajectory))
        )
    codes.append(Code("OUTPUT_HOLD_IS_A_RECOMMENDATION", holdReasons=list(rec.codes)))

    # ALK-RETURN-ELIGIBLE-TRAJECTORY-001 — the offer's eligibility, which is a
    # trajectory fact rather than a plan. The plan itself is out of this build;
    # this predicate is not, because `ALK-049` P1 makes the offer an outcome of
    # the ordinary maintenance path and three fixtures assert it there.
    #
    # It is NOT `ALK-STABLE-001`'s `STABLE`, and the two must not share a field:
    # it asks "is there established evidence that no supported trajectory is
    # already carrying the level?", not "is the tank analytically flat?".
    return_plan_eligible = ev.movement in (traj.SUFFICIENT, traj.UNCERTAINTY_LIMITED) and (
        sup is not None and sup.slope == 0.0
    )
    return_plan_offer = "AVAILABLE" if return_plan_eligible else "NOT_ELIGIBLE"
    codes.append(
        Code(
            "RETURN_OFFER_AVAILABLE" if return_plan_eligible
            else "RETURN_OFFER_NOT_ELIGIBLE_TRAJECTORY",
            movementEvidence=ev.movement,
            S_observed=obs.slope if obs is not None else UNKNOWN,
            S_supported=sup.slope if sup is not None else UNKNOWN,
            ruleId="ALK-RETURN-ELIGIBLE-TRAJECTORY-001",
        )
    )

    # 14 — SAFETY (state only; the safety RETURN is out of this build) ------
    safety, safety_withheld = _safety(pos, cfg, codes, as_of)
    withheld_outputs.extend(safety_withheld)

    # 17 — RETEST -----------------------------------------------------------
    decision = retest_mod.schedule(
        as_of=as_of,
        supported_slope=sup.slope if sup is not None else None,
        movement_evidence=ev.movement,
        rapid_confirmed=rapid.confirmed,
        outer_bound_state=pos.outer_bound_state,
        forecast=fc,
        latest_episode_anomalous=latest_anomalous,
        safety_return_active=pos.outer_bound_state
        in (observation.BREACHED_LOW, observation.BREACHED_HIGH),
        post_change_first_at_hours=None,
        post_change_second_at_hours=None,
    )
    for c in decision.codes:
        codes.append(Code(c, **_retest_payload(c, decision, sup, ev, as_of)))
    for c in decision.not_run:
        codes.append(Code(c, ruleId="ALK-RETEST-SCHEDULER-001"))

    # 18 — RESULT ASSEMBLY --------------------------------------------------
    result = _assemble(
        as_of=as_of,
        cfg=cfg,
        led=led,
        eps=eps,
        accepted=accepted,
        pos=pos,
        obs=obs,
        sup=sup,
        ev=ev,
        rapid=rapid,
        cons=cons,
        rec=rec,
        potency=potency,
        caps=caps,
        forecast=fc,
        retest=retest_mod.render(decision, as_of),
        delivery=delivery,
        safety=safety,
        active_intervention=_active(interventions),
        return_plan_offer=return_plan_offer,
        return_plan_eligible=return_plan_eligible,
    )

    # Every field the engine left `NOT_RUN` or `WITHHELD` must be named by a
    # gating or refusal code (`INV-I4`, schema invariant 8). Nothing is silently
    # absent; a withheld output is a designed state that carries its reason.
    # Scanned over the assembled result *including* the reason-code array, because
    # a payload that quotes another field's `NOT_RUN` state is a withheld marker
    # too as far as `INV-I4`'s executable form is concerned, and naming it in the
    # umbrella is both cheap and true: it refers to the same output.
    result["reasonCodes"] = _ordered(codes)
    unexplained = _unexplained_withheld(result, codes, withheld_outputs)
    if unexplained:
        codes.append(
            Code(
                _UMBRELLA,
                missing=unexplained,
                nextUsefulTestAt=result["retest"]["recommendedAt"],
                currentValueDkh=pos.a_now if pos.a_now is not None else UNKNOWN,
            )
        )

    codes.append(
        Code(
            "OUTPUT_CONFIDENCE_UNSPECIFIED",
            ruleId="ALK-CONFIDENCE-OUTPUT-001",
            **result["evidenceFacts"],
        )
    )
    codes.append(Code("AUDIT_TRACE_WRITTEN", auditTraceId=result["auditTraceId"]))
    codes.append(
        Code("MIGRATION_ALK_ONLY_RUNTIME", enabledControllers=["ALK"])
    )
    codes.append(Code("MIGRATION_MG_GATE_ISOLATED", latestMgValue=UNKNOWN))
    codes.append(Code("SAFETY_MG_GATE_UNKNOWN", magnesiumGateState=UNKNOWN))

    result["reasonCodes"] = _ordered(codes)
    return clean(result)



def _potency_at(cfg):
    """`(potency, contextId, confidence)` as they stood at a given instant.

    The prediction snapshot needs the potency **in force at the dose change**,
    not the one in force now. In this build the learner is gated, so the figure
    at every instant is the configured one and the configuration history resolves
    it. When the gate opens, this is the one function that has to learn to walk
    the pool as it stood then -- which is why the intervention module takes it as
    an argument rather than importing the learner.
    """

    def at(_instant):
        return (
            cfg.num("selectedPotencyDkhPerMl"),
            cfg.get("solutionContextId", "UNKNOWN"),
            "THEORETICAL_ONLY",
        )

    return at


def _discrepancy_band(m: float) -> str:
    """`ALK-021`. Wording only, and no action anywhere follows from it."""
    if 0.85 <= m <= 1.15:
        return "BROADLY_CONSISTENT"
    if 0.70 <= m < 0.85 or 1.15 < m <= 1.30:
        return "MEANINGFUL"
    return "LARGE"


def _active(interventions) -> Any:
    """The intervention still open at `asOf`, or `NONE`.

    `NONE` is a first-class value: no intervention is a fact about the tank, not
    a missing field.
    """
    live = [
        iv
        for iv in interventions
        if iv.phase in (iv_mod.JUST_IMPLEMENTED, iv_mod.OBSERVING, iv_mod.ASSESSMENT_DUE)
    ]
    if not live:
        return NONE
    iv = live[-1]
    return {
        "interventionId": iv.intervention_id,
        "interventionType": "MAINTENANCE_DOSE_CHANGE",
        "oldDoseMlPerDay": iv.old_dose if iv.old_dose is not None else UNKNOWN,
        "newDoseMlPerDay": iv.new_dose if iv.new_dose is not None else UNKNOWN,
        "actualStartTime": iv.at.text,
        "phase": iv.phase,
        "anchorRelationAmbiguous": iv.anchor_relation_ambiguous,
        "exposureFraction": "NOT_RUN",
        "predictionSnapshot": iv.snapshot.payload(),
    }


# ---------------------------------------------------------------------------
# Reason-code ordering — A48 rule 5
# ---------------------------------------------------------------------------

_OWNER_ORDER = (
    "VALIDATION_", "TIME_", "CONFIG_", "CLUSTER_", "EPISODE_", "SEGMENT_",
    "DELIVERY_", "EVIDENCE_", "TRAJECTORY_", "UNCERTAINTY_", "CONSUMPTION_",
    "POTENCY_", "INTERVENTION_", "RESPONSE_", "MAINTENANCE_", "BRACKET_",
    "RETURN_", "SAFETY_", "RETEST_", "CAPABILITY_", "OUTPUT_", "AUDIT_",
    "PRESENTATION_", "MIGRATION_",
)


def _ordered(codes: List[Code]) -> List[Dict[str, Any]]:
    """Owner order, then first-emitted order, and no code twice.

    Deterministic by construction: the sort is stable and the tie-break is the
    emission index, so two runs over the same ledger produce the same array in
    the same order -- which `INV-A1` compares byte for byte.
    """
    def rank(c: Code) -> int:
        for i, prefix in enumerate(_OWNER_ORDER):
            if c.code.startswith(prefix):
                return i
        return len(_OWNER_ORDER)

    # Codes are additive and several may be true at once, but one code may only
    # appear once in the array. Where the same code was raised twice its
    # payloads are **merged** rather than the second being dropped: the umbrella
    # insufficiency code is raised once per withheld output, and keeping only
    # the first would leave the others unnamed and `INV-I4` violated by an edit
    # that looked like tidying.
    merged: Dict[str, Code] = {}
    order: List[str] = []
    for c in codes:
        if c.code not in merged:
            merged[c.code] = Code(c.code, **dict(c.payload))
            order.append(c.code)
            continue
        target = merged[c.code].payload
        for key, value in c.payload.items():
            if isinstance(value, list) and isinstance(target.get(key), list):
                for item in value:
                    if item not in target[key]:
                        target[key].append(item)
            elif key not in target:
                target[key] = value
    unique = [merged[k] for k in order]
    indexed = list(enumerate(unique))
    indexed.sort(key=lambda p: (rank(p[1]), p[0]))
    return [{"code": c.code, "payload": dict(c.payload)} for _, c in indexed]


# ---------------------------------------------------------------------------
# Payload builders. Each names the numbers the catalogue says the code carries.
# ---------------------------------------------------------------------------


def _uncertainty_payload(code: str, obs) -> Dict[str, Any]:
    if code == "UNCERTAINTY_FLOOR_APPLIED":
        return {"sigmaResid": obs.sigma_resid, "sigmaPoint": obs.sigma_point}
    if code == "UNCERTAINTY_RESIDUAL_DOMINATES":
        return {"sigmaResid": obs.sigma_resid, "sigmaPoint": obs.sigma_point}
    if code == "UNCERTAINTY_SXX_NOT_POSITIVE":
        return {"times": obs.times_days, "Sxx": obs.sxx}
    if code == "UNCERTAINTY_TWO_POINT_BASIS":
        return {
            "deltaDays": obs.times_days[-1] - obs.times_days[0],
            "sigmaS": obs.sigma_s,
        }
    return {"sigmaS": obs.sigma_s}


def _evidence_payload(code: str, ev, obs, sup, as_of) -> Dict[str, Any]:
    base = {
        "independentClusters": ev.have_clusters,
        "spanDays": ev.have_span_days,
    }
    if code == "EVIDENCE_INSUFFICIENT_CLUSTERS":
        return {"have": ev.have_clusters, "need": 3, "windowDays": 14,
                "nextUsefulTestAt": as_of.text}
    if code == "EVIDENCE_INSUFFICIENT_SPAN":
        return {"haveDays": ev.have_span_days, "needDays": 4,
                "nextUsefulTestAt": as_of.text}
    if code in ("TRAJECTORY_FALLING", "TRAJECTORY_RISING"):
        return {
            "observedSlope": obs.slope,
            "supportedSlope": sup.slope,
            "sigmaS": obs.sigma_s,
        }
    if code == "TRAJECTORY_STABLE":
        return {"observedSlope": 0, **base}
    if code == "TRAJECTORY_UNCERTAINTY_LIMITED":
        return {
            "observedSlope": obs.slope,
            "sigmaS": obs.sigma_s,
            "supportSubtraction": sup.subtraction,
            **base,
        }
    if code == "EVIDENCE_CONFOUNDED_HARD":
        return {"confounders": ["a hard confounder is present in the selected segment"]}
    if code in (
        "EVIDENCE_ANOMALOUS_LATEST_CLUSTER",
        "EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER",
    ):
        return {
            "clusterId": UNKNOWN,
            "spreadDkh": UNKNOWN,
            "openIssue": "OI-ANOMCLUSTER-001",
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    return base


def _delivery_payload(code: str, delivery, segment_start, as_of) -> Dict[str, Any]:
    if code == "DELIVERY_BASIS_PROGRAMMED_SCHEDULE":
        return {"programmedDoseMlPerDay": delivery.d_current}
    if code == "DELIVERY_BASIS_VERIFIED":
        return {
            "intervalFromAt": segment_start.text if segment_start else UNKNOWN,
            "intervalToAt": as_of.text,
        }
    return {
        "intervalFromAt": segment_start.text if segment_start else UNKNOWN,
        "intervalToAt": as_of.text,
        "affectedOutputs": ["consumption"],
    }


def _consumption_payload(code, cons, p_selected, delivery, obs) -> Dict[str, Any]:
    if code.startswith("CONSUMPTION_NOT_RUN"):
        return {"affectedOutputs": ["consumption", "maintenanceEstimateMlPerDay"],
                "potencyState": "THEORETICAL_ONLY" if p_selected else UNKNOWN}
    payload = {
        "consumptionDkhPerDay": cons.consumption_dkh_per_day,
        "P": p_selected,
        "D": delivery.d_history,
        "S_observed": obs.slope if obs is not None else UNKNOWN,
        "deliveryBasis": delivery.basis or UNKNOWN,
    }
    if code == "CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED":
        payload["sigmaS"] = obs.sigma_s if obs is not None else UNKNOWN
        payload["materialityMargin"] = cons.materiality_margin
        payload["ruleId"] = "ALK-NEGATIVE-MATERIALITY-001"
        payload["affectedOutputs"] = ["maintenanceEstimateMlPerDay"]
    if code == "CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN":
        payload["knownEventsInspected"] = []
    return payload


def _maintenance_payload(code, rec, obs, sup, cons, cfg, position, trajectory) -> Dict[str, Any]:
    common = {
        "currentDose": rec.current_dose,
        "recommendedDose": rec.recommended_dose.rendered(),
        "deltaDose": rec.delta_dose,
        "S_supported": sup.slope if sup is not None else UNKNOWN,
        "P": cfg.num("selectedPotencyDkhPerMl"),
        "predictedPostSlope": rec.predicted_post_slope,
    }
    if code in ("MAINTENANCE_INCREASE_RECOMMENDED", "MAINTENANCE_DECREASE_RECOMMENDED"):
        return common
    if code == "MAINTENANCE_HOLD_UNCERTAINTY_LIMITED":
        return {
            "S_observed": obs.slope if obs is not None else UNKNOWN,
            "sigmaS": obs.sigma_s if obs is not None else UNKNOWN,
            "supportSubtraction": sup.subtraction if sup is not None else UNKNOWN,
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    if code == "MAINTENANCE_HOLD_STABLE":
        return {"S_observed": 0, "S_supported": 0}
    if code == "MAINTENANCE_HOLD_TOWARD_RANGE":
        return {
            "position": position,
            "trajectory": trajectory,
            "S_observed": obs.slope if obs is not None else UNKNOWN,
            "S_supported": sup.slope if sup is not None else UNKNOWN,
            "maintenanceEstimate": rec.maintenance_estimate.rendered(),
            "forecastRangeEntryDays": UNKNOWN,
            "ruleId": "ALK-TOWARD-RANGE-HOLD-001",
        }
    if code == "MAINTENANCE_STEP_CAP_ORDINARY":
        return {
            "uncappedDelta": rec.raw_supported_delta_dose_ml_per_day,
            "cappedDelta": rec.delta_dose,
            "currentDose": rec.current_dose,
        }
    if code == "MAINTENANCE_STEP_CAP_EXCEPTIONAL":
        return {
            "uncappedDelta": rec.raw_supported_delta_dose_ml_per_day,
            "cappedDelta": rec.delta_dose,
            "rapidBasis": "LATEST_INDEPENDENT_PAIR",
            "outerBoundRisk": True,
            "T_outerDays": UNKNOWN,
        }
    if code == "MAINTENANCE_STEP_CAP_50_NOT_UNLOCKED":
        return {"failedConditions": list(rec.fifty_percent_cap_failed_conditions)}
    if code == "MAINTENANCE_BASELINE_ESTABLISHMENT":
        return {
            "currentDose": rec.current_dose,
            "recommendationPrecisionMlPerDay": cfg.num("recommendationPrecisionMlPerDay"),
            "threshold": (cfg.num("recommendationPrecisionMlPerDay") or 0.0) * 4,
        }
    if code == "MAINTENANCE_ROUNDS_TO_CURRENT_DOSE":
        return {
            "continuousCandidate": rec.continuous_candidate.rendered(),
            "currentDose": rec.current_dose,
            "recommendationPrecisionMlPerDay": cfg.num("recommendationPrecisionMlPerDay"),
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    if code == "MAINTENANCE_NON_NEGATIVE_CLAMP":
        return {"uncappedCandidate": rec.continuous_candidate.rendered()}
    if code == "MAINTENANCE_NO_ACTION_FROM_BROKEN_MASS_BALANCE":
        return {
            "consumptionDkhPerDay": cons.consumption_dkh_per_day,
            "acceptedMaintenanceEstimate": rec.maintenance_estimate.rendered(),
        }
    if code == "MAINTENANCE_LIQUID_GUARD_EXCEEDED":
        volume = cfg.num("netVolumeL")
        return {
            "recommendedMl": rec.continuous_candidate.rendered(),
            "guardMl": (volume or 0.0) * 20.0,
            "netVolumeL": volume,
            "checkedAt": "CONTINUOUS",
            "ruleId": "ALK-LIQUID-VOLUME-GUARD-001",
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    if code == "SAFETY_RATE_RAIL_APPLIED":
        return {
            "uncappedEffect": (cfg.num("selectedPotencyDkhPerMl") or 0.0)
            * (rec.raw_supported_delta_dose_ml_per_day or 0.0),
            "railDkhPerDay": 0.50,
            "cappedDeltaDose": rec.delta_dose,
        }
    if code == "POTENCY_REQUIRED":
        return {
            "requiredMovementDkh": abs(sup.slope) if sup is not None else UNKNOWN,
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    if code == "VALIDATION_RECOMMENDATION_PRECISION_INVALID":
        return {
            "recommendationPrecisionMlPerDay": cfg.get("recommendationPrecisionMlPerDay"),
            "affectedOutputs": ["doseRecommendation.recommendedDoseMlPerDay"],
        }
    return common


def _retest_payload(code, decision, sup, ev, as_of) -> Dict[str, Any]:
    at = kernel.plus_hours(as_of, decision.selected_hours).text
    if code == "RETEST_SIGNAL_ACCUMULATION":
        raw = next(
            (c.raw_hours for c in decision.candidates
             if c.candidate_class == "SIGNAL_ACCUMULATION"),
            None,
        )
        return {
            "sSupportedDkhPerDay": sup.slope if sup is not None else UNKNOWN,
            "rawTSignalDays": (raw / HOURS_PER_DAY) if raw is not None else UNKNOWN,
            "tSignalDays": decision.selected_hours / HOURS_PER_DAY,
            "recommendedAt": at,
        }
    if code == "RETEST_SIGNAL_ACCUMULATION_NOT_RUN":
        return {
            "sSupportedDkhPerDay": sup.slope if sup is not None else UNKNOWN,
            "movementEvidence": ev.movement,
        }
    if code == "RETEST_SIGNAL_FLOOR_APPLIED":
        raw = next(
            (c.raw_hours for c in decision.candidates
             if c.candidate_class == "SIGNAL_ACCUMULATION"),
            None,
        )
        return {
            "rawTSignalHours": raw if raw is not None else UNKNOWN,
            "flooredHours": 24,
            "sSupportedDkhPerDay": sup.slope if sup is not None else UNKNOWN,
        }
    if code == "RETEST_OBSERVATION_CEILING_APPLIED":
        raw = next(
            (c.raw_hours for c in decision.candidates
             if c.candidate_class == "SIGNAL_ACCUMULATION"),
            None,
        )
        return {"rawCandidateHours": raw if raw is not None else UNKNOWN,
                "ceilingHours": 96}
    if code == "RETEST_FORECAST_BOUNDARY_RISK":
        cand = next(
            (c for c in decision.candidates
             if c.candidate_class == "FORECAST_BOUNDARY_RISK"),
            None,
        )
        hours = cand.hours if cand is not None and cand.hours is not None else None
        return {
            "T_outerDays": ((hours / HOURS_PER_DAY) + 1.0) if hours is not None else UNKNOWN,
            "T_boundaryDays": (hours / HOURS_PER_DAY) if hours is not None else UNKNOWN,
            "boundSide": cand.bound_side if cand is not None else UNKNOWN,
            "recommendedAt": at,
        }
    if code == "RETEST_REPEAT_NOW":
        return {"cause": "the latest testing episode is internally inconsistent"}
    return {"recommendedAt": at}


# ---------------------------------------------------------------------------
# Segment confounders this build observes
# ---------------------------------------------------------------------------


def _hard_confounders(led, codes: List[Code]) -> List[str]:
    """Boundary and confounder causes the ledger states outright.

    Only the ones the ledger *states* -- an unknown correction, an uncertain
    dose-change effective time, an unknown-replacement water change at or above
    the derived 5% break, a recorded delivery anomaly. The engine never creates
    a confounder from an unexpected slope; `SHARED-CONSUMPTION-CONTEXT-001` makes
    a consumption-context event a recorded fact and never an inference.
    """
    found: List[str] = []
    for e in led.of_kind("MANUAL_CORRECTION"):
        if e.get("actualVolumeMl") in (None, "UNKNOWN") or e.at is None:
            found.append("UNKNOWN_CORRECTION")
            codes.append(
                Code("SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION",
                     correctionId=e.event_id or UNKNOWN,
                     affectedOutputs=["observedTrajectory", "consumption"])
            )
    for e in led.of_kind("DOSE_CHANGE") + led.of_kind("DOSE_STATE"):
        if e.get("effectiveAtConfidence") == "UNCERTAIN":
            found.append("UNCERTAIN_DOSE_TIME")
            codes.append(
                Code("SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME",
                     doseStateId=e.event_id or UNKNOWN,
                     affectedOutputs=["observedTrajectory", "consumption"])
            )
    for e in led.of_kind("WATER_CHANGE"):
        fraction = e.get("changedFraction")
        known = e.get("replacementAlkalinityDkh") is not None and (
            e.get("replacementAlkalinityConfidence") == "MEASURED_SAME_BATCH"
        )
        if not known and kernel.finite(fraction) and float(fraction) >= 0.05:
            found.append("UNKNOWN_WATER_CHANGE")
            codes.append(
                Code("SEGMENT_WC_UNKNOWN_BOUNDARY",
                     waterChangeId=e.event_id or UNKNOWN,
                     changedFraction=fraction,
                     potentialStepDkh=float(fraction) * 2.0,
                     affectedOutputs=["observedTrajectory"])
            )
    for e in led.of_kind("DELIVERY_ANOMALY"):
        found.append("DELIVERY_ANOMALY")
        codes.append(
            Code("SEGMENT_BOUNDARY_DELIVERY_ANOMALY",
                 anomalyId=e.event_id or UNKNOWN,
                 anomalyType=e.get("anomalyType", UNKNOWN))
        )
        codes.append(
            Code("DELIVERY_ANOMALY_RECORDED",
                 anomalyId=e.event_id or UNKNOWN,
                 anomalyType=e.get("anomalyType", UNKNOWN),
                 fromAt=e.get("fromAt", UNKNOWN),
                 toAt=e.get("toAt", UNKNOWN))
        )
    for e in led.of_kind("CONSUMPTION_CONTEXT_EVENT"):
        found.append("CONSUMPTION_CONTEXT_CHANGE")
    return found


def _outer_bound_risk(fc: Dict[str, Any]) -> bool:
    """`A18`'s second condition: a crossing forecast at or before 48 h.

    A **fixed** ordinary comparison horizon, not the scheduler's selected next
    test (`OI-FORECASTHORIZON-001`).
    """
    for key in ("tOuterLowDays", "tOuterHighDays"):
        v = fc.get(key)
        if isinstance(v, (int, float)) and v <= 2.0:
            return True
    return False


# ---------------------------------------------------------------------------
# Safety — state only in this build
# ---------------------------------------------------------------------------


def _safety(pos, cfg, codes: List[Code], as_of) -> Any:
    """The safety **state**, which position classification already determines.

    What is built: the outer-bound state, the buffered safety destination, the
    advisory boundaries and the Mg gate — all of them read off `A_now` and the
    configuration.

    What is **not** built, and is therefore visibly not built: the safety
    return's sizing (`ALK-OUTER-BOUND-ACTION-001`, `A39`/`A40`), the composite
    rail allocation and the intervention lock's interaction with an active
    return. On a breach those outputs are emitted `NOT_RUN` and named, rather
    than given a plausible number.
    """
    outer_min = cfg.num("outerMinDkh")
    outer_max = cfg.num("outerMaxDkh")
    state: Dict[str, Any] = {
        "outerBoundState": pos.outer_bound_state
        if pos.outer_bound_state is not None
        else NOT_RUN,
        "bSafetyDkh": B_SAFETY,
        "magnesiumGateState": UNKNOWN,
        "interventionLockOwner": NONE,
        "maintenanceEstimateStatus": "RESOLVED",
        "advisoryConfidenceWarning": NONE,
    }
    if outer_min is not None:
        state["advisoryFloorDkh"] = outer_min - ADVISORY_OFFSET
    if outer_max is not None:
        state["advisoryCeilingDkh"] = outer_max + ADVISORY_OFFSET

    withheld: List[str] = []
    if pos.outer_bound_state is None:
        # `OI-EPISODENOOBS-001`: canon does not say what `outerBoundState` takes
        # when no episode resolves, and its closed vocabulary has no member for
        # "nothing to classify". `NOT_RUN` names the refusal instead of
        # inventing a fourteenth value.
        withheld.append("outerBoundState")
        codes.append(
            Code(_UMBRELLA,
                 missing=["outerBoundState — no testing episode resolved "
                          "(OI-EPISODENOOBS-001; canon states no value for this state)"],
                 currentValueDkh=UNKNOWN,
                 nextUsefulTestAt=as_of.text,
                 affectedOutputs=["outerBoundState", "safety.outerBoundState"]))

    if pos.outer_bound_state == observation.BREACHED_LOW:
        state["safetyDestinationDkh"] = (outer_min or 0.0) + B_SAFETY
        codes.append(
            Code("SAFETY_OUTER_BOUND_BREACHED_LOW",
                 A_now=pos.a_now, outerMin=outer_min,
                 safetyDestinationDkh=state["safetyDestinationDkh"]))
    elif pos.outer_bound_state == observation.BREACHED_HIGH:
        state["safetyDestinationDkh"] = (outer_max or 0.0) - B_SAFETY
        codes.append(
            Code("SAFETY_OUTER_BOUND_BREACHED_HIGH",
                 A_now=pos.a_now, outerMax=outer_max,
                 safetyDestinationDkh=state["safetyDestinationDkh"]))

    if pos.outer_bound_state in (observation.BREACHED_LOW, observation.BREACHED_HIGH):
        state["temporarySafetyRateRecommendationMlPerDay"] = NOT_RUN
        state["safetyCorrectionVolumeMl"] = NOT_RUN
        withheld.extend(
            ["temporarySafetyRateRecommendationMlPerDay", "safetyCorrectionVolumeMl"]
        )
        codes.append(
            Code(
                _UMBRELLA,
                missing=[
                    "ALK-OUTER-BOUND-ACTION-001 safety-return sizing is not "
                    "implemented in this build; the outer-bound STATE is classified "
                    "and reported, the sized response is not"
                ],
                currentValueDkh=pos.a_now if pos.a_now is not None else UNKNOWN,
                nextUsefulTestAt=as_of.text,
                affectedOutputs=[
                    "temporarySafetyRateRecommendationMlPerDay",
                    "safetyCorrectionVolumeMl",
                ],
            )
        )

    # Advisory boundary — a warning, and only a warning. It may not alter the
    # recommended rate, the trajectory, the consumption estimate or the retest
    # schedule, and it renders the scheduler's interval rather than stating one
    # of its own (owner decisions 24 and 26).
    if pos.a_now is not None:
        floor_v = state.get("advisoryFloorDkh")
        ceil_v = state.get("advisoryCeilingDkh")
        beyond = (floor_v is not None and pos.a_now <= floor_v) or (
            ceil_v is not None and pos.a_now >= ceil_v
        )
        if beyond:
            state["advisoryConfidenceWarning"] = "ATTACHED"
    return state, withheld


# ---------------------------------------------------------------------------
# Assembly
# ---------------------------------------------------------------------------


def _assemble(**kw) -> Dict[str, Any]:
    as_of: Instant = kw["as_of"]
    cfg = kw["cfg"]
    pos = kw["pos"]
    obs = kw["obs"]
    sup = kw["sup"]
    ev = kw["ev"]
    rec: dosing.Recommendation = kw["rec"]
    cons: dosing.Consumption = kw["cons"]
    accepted = kw["accepted"]

    observed = (
        {
            "estimator": obs.estimator,
            "observedSlopeDkhPerDay": obs.slope,
            "interceptDkh": obs.intercept,
            "residualsDkh": obs.residuals,
            "madDkh": obs.mad_dkh,
            "pairwiseSlopesSorted": sorted(obs.pairwise_slopes),
            "sigmaResidDkh": obs.sigma_resid,
            "sigmaPointDkh": obs.sigma_point,
            "tBarDays": obs.t_bar,
            "sxxDay2": obs.sxx,
            "sigmaSDkhPerDay": obs.sigma_s,
            "independentClusters": obs.n,
            "spanDays": obs.span_days,
            "timesDays": obs.times_days,
            "pairwiseSlopesDkhPerDay": obs.pairwise_slopes,
            "endpointMovementDkh": obs.values_dkh[-1] - obs.values_dkh[0],
            "fittedMovementDkh": obs.slope * obs.span_days,
            "evidenceState": ev.movement,
            "rapidConfirmed": kw["rapid"].confirmed,
        }
        if obs is not None
        else NOT_RUN
    )
    supported = (
        {
            "supportedSlopeDkhPerDay": sup.slope,
            "supportK": sup.support_k,
            "supportSubtractionDkhPerDay": sup.subtraction,
            "limitedByUncertainty": sup.limited_by_uncertainty,
        }
        if sup is not None
        else NOT_RUN
    )
    consumption = (
        {
            "consumptionDkhPerDay": cons.consumption_dkh_per_day,
            "doseHistoryMeanMlPerDay": kw["delivery"].d_history,
            "deliveryBasis": kw["delivery"].basis or UNKNOWN,
            "selectedPotencyDkhPerMl": kw["potency"]["selectedPotencyDkhPerMl"],
            "physicality": cons.physicality,
            "materialityMarginDkhPerDay": cons.materiality_margin,
            "eligibility": "RUN",
        }
        if cons.computed.ran
        else NOT_RUN
    )

    recommendation = {
        "action": rec.action,
        "currentDoseMlPerDay": rec.current_dose if rec.current_dose is not None else UNKNOWN,
        "maintenanceEstimateMlPerDay": rec.maintenance_estimate.rendered(),
        "continuousActionCandidateMlPerDay": rec.continuous_candidate.rendered(),
        "recommendedDoseMlPerDay": rec.recommended_dose.rendered(),
        "deltaDoseMlPerDay": rec.delta_dose if rec.delta_dose is not None else NOT_RUN,
        "deltaEffectDkhPerDay": rec.delta_effect if rec.delta_effect is not None else NOT_RUN,
        "predictedPostSlopeDkhPerDay": (
            rec.predicted_post_slope if rec.predicted_post_slope is not None else NOT_RUN
        ),
        "constraintsApplied": rec.constraints,
        "doseStepRegime": rec.step_regime or NOT_RUN,
        "capApplied": rec.cap_applied,
        "bracketStatus": NOT_RUN,
        "maintenanceActionStatus": rec.status,
    }
    recommendation["towardRangeHoldApplied"] = rec.toward_range_hold_applied
    recommendation["fiftyPercentCapUnlocked"] = rec.fifty_percent_cap_unlocked
    recommendation["returnPlanOffer"] = kw["return_plan_offer"]
    recommendation["returnPlanEligibleTrajectory"] = kw["return_plan_eligible"]
    for name, value in (
        ("ordinaryCapMlPerDay", rec.ordinary_cap_ml_per_day),
        ("exceptionalCapMlPerDay", rec.exceptional_cap_ml_per_day),
        ("rawSupportedDeltaDoseMlPerDay", rec.raw_supported_delta_dose_ml_per_day),
        ("railAsDoseDeltaMlPerDay", rec.rail_as_dose_delta_ml_per_day),
        ("bindingConstraint", rec.binding_constraint),
    ):
        if value is not None:
            recommendation[name] = value

    evidence_facts = {
        "independentClusters": len(accepted),
        "spanDays": obs.span_days if obs is not None else 0.0,
        "sigmaS": obs.sigma_s if obs is not None else NOT_RUN,
        "confounders": [],
        "potencyConfidence": kw["potency"]["potencyConfidence"],
        "deliveryBasis": kw["delivery"].basis or UNKNOWN,
    }
    if obs is not None and obs.slope != 0:
        evidence_facts["supportRatio"] = abs(sup.slope) / abs(obs.slope)

    return {
        "assessmentId": f"ASSESS-{as_of.text}",
        # The supplied instant, verbatim. Never a clock read, and never
        # re-spelled: `INV-A2` compares this to the string it was given.
        "assessmentAsOf": as_of.text,
        "parameter": "ALK",
        "engineVersion": ENGINE_VERSION,
        "canonVersion": CANON_VERSION,
        "configVersionId": cfg.version_id,
        "position": pos.position,
        "latestValidClusterId": (
            pos.episode.cluster_id if pos.episode is not None else NOT_RUN
        ),
        "latestValidValueDkh": pos.a_now if pos.a_now is not None else NOT_RUN,
        "outerBoundState": (
            pos.outer_bound_state if pos.outer_bound_state is not None else NOT_RUN
        ),
        "observedTrajectory": observed,
        "supportedTrajectory": supported,
        "trajectory": ev.trajectory,
        "movementEvidence": ev.movement,
        "consumption": consumption,
        "maintenanceBalance": rec.balance,
        "potency": kw["potency"],
        "doseRecommendation": recommendation,
        "activeIntervention": kw["active_intervention"],
        "responseAssessment": NOT_RUN,
        "returnPlan": NONE,
        "safety": kw["safety"] if "safety" in kw else {},
        "retest": kw["retest"],
        "capabilities": [c.payload() for c in kw["caps"]],
        "forecast": kw["forecast"],
        "recommendationConfidence": UNSPECIFIED,
        "evidenceFacts": evidence_facts,
        "reasonCodes": [],
        "auditTraceId": f"TRACE-{as_of.text}",
    }


_MARKERS = (NOT_RUN, WITHHELD, "UNRESOLVED")


def _unexplained_withheld(
    result: Dict[str, Any], codes: List[Code], already: List[str]
) -> List[str]:
    """Withheld fields no emitted code names, so the umbrella can name them."""
    named = set(already)
    for c in codes:
        for key in ("affectedOutputs", "missing"):
            v = c.payload.get(key)
            if isinstance(v, list):
                for item in v:
                    if isinstance(item, str):
                        named.add(item)
                        named.add(item.rsplit(".", 1)[-1])

    out: List[str] = []

    def walk(node: Any, path: str) -> None:
        if isinstance(node, dict):
            for k, v in node.items():
                p = f"{path}.{k}" if path else k
                if isinstance(v, str) and v in _MARKERS:
                    if p not in named and k not in named:
                        out.append(p)
                else:
                    walk(v, p)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]")

    walk(result, "")
    return sorted(set(out))
