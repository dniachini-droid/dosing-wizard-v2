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

import json

from dataclasses import replace

from typing import Any, Dict, List, Optional

from . import capability as cap_mod
from . import dosing, kernel, ledger as ledger_mod, observation, retest as retest_mod
from . import intervention as iv_mod
from . import potency as potency_mod
from . import response as response_mod
from . import trajectory as traj
from .constants import (
    ADVISORY_OFFSET,
    ALK_MATERIALITY_FLOOR,
    ATTRIBUTION_HORIZON_DAYS,
    B_SAFETY,
    HOURS_PER_DAY,
    MAX_CONTROL_LOOKBACK_DAYS,
    POSTCHANGE_FIRST_TEST_HOURS,
    POSTCHANGE_SECOND_TEST_HOURS,
    UNKNOWN_WC_ASSUMED_MISMATCH,
    WC_UNKNOWN_BREAK_FRACTION,
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

#: Codes whose payload accumulates across one assessment rather than describing
#: one entity. These, and only these, are merged into a single array entry by
#: `_ordered`; everything else repeats once per entity it describes.
#: Placeholder written by any code that carries `nextUsefulTestAt` before the
#: retest scheduler has run. `X-INV-004` and `A46` give the scheduler sole
#: ownership of next-test timing -- including against other parts of this
#: engine -- so the value is filled in from its decision and never from `asOf`.
#: Two answers to "when should I test again" in one result is the product
#: disagreeing with itself.
_SCHEDULER_FILLS = "__SCHEDULER__"

#: The gates whose failure withholds the trend, and with it every inference
#: that reads the trend. Each is `GATING` in the catalogue, so naming an output
#: here satisfies `INV-I4` from the code that actually knows the cause.
_EVIDENCE_GATES = frozenset({
    "EVIDENCE_INSUFFICIENT_CLUSTERS",
    "EVIDENCE_INSUFFICIENT_SPAN",
    "EVIDENCE_INSUFFICIENT_POSTCHANGE_SPAN",
    "EVIDENCE_ANOMALOUS_LATEST_CLUSTER",
    "EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER",
    "EVIDENCE_CONFOUNDED_HARD",
    "SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION",
    "SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME",
    "SEGMENT_WC_UNKNOWN_BOUNDARY",
})

_ACCUMULATING = frozenset({
    _UMBRELLA,
    "OUTPUT_HOLD_IS_A_RECOMMENDATION",
    "OUTPUT_CONFIDENCE_UNSPECIFIED",
})


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

    # Nothing the keeper entered disappears without a word. A reading the engine
    # could not parse is reported as the validation refusal it is, and an event
    # kind this build does not implement is named rather than dropped -- a
    # withheld conclusion is acceptable, a withheld conclusion whose cause is
    # invisible is not.
    unread: List[str] = []
    for entry in led.problems:
        code, detail = entry
        if code is None:
            unread.append(str(detail))
        else:
            codes.append(Code(code, asOf=as_of.text, **detail))
    for kind in sorted(set(led.unhandled_kinds)):
        if kind == ledger_mod.READING_SERIES:
            continue
        unread.append(
            f"an event of kind {kind} is in the ledger and this build does not "
            f"read it; nothing it records is in the assessment"
        )

    if ledger_mod.READING_SERIES in led.unhandled_kinds:
        # `OD-014`: the expansion of `READING_SERIES` has no owner, two
        # implementations of it already exist in tooling, and the fixture format
        # says in terms *do not* resolve it by writing a fourth. So the engine
        # declines to read the shorthand rather than inventing a third owner of
        # one inference, and says so where a reader will see it.
        unread.append(
            "READING_SERIES expansion has no owner (OD-014); this engine does "
            "not expand the shorthand and the readings it carries are not in "
            "the assessment"
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
    # `led.untimed` carries the readings with no usable instant. They reach
    # position (canon Part II §2.3A.2) and nothing else, and their presence is
    # never reported -- owner decision 30.
    pos = observation.position(eps, cfg, led.untimed)

    # 5 — SEGMENT -----------------------------------------------------------
    # `ALK-007` / Part II §13: a maintenance dose change is a hard boundary for
    # the TRAJECTORY and CONSUMPTION inferences. The current-control segment is
    # the most recent clean one, and it starts after the latest dose change at
    # or before `asOf` -- fitting one line across a dose change would average
    # the tank's behaviour under two different regimes and call the result its
    # trajectory. The 14-day cap applies on top, and is never extended because
    # evidence is sparse.
    segment_eps, segment_codes, segment_start = _segment(eps, led, as_of, codes)
    for code, payload in segment_codes:
        codes.append(Code(code, **payload))

    # 5b — NORMALISE KNOWN INPUTS ------------------------------------------
    # `ALK-033`: a measured-same-batch water change is a known step, and its
    # step is removed from the analytical series rather than being read as the
    # tank moving. Without this the keeper who took the trouble to measure their
    # new saltwater gets the *worse* answer -- their water change is reported as
    # a rising trend and their dose is cut on a tank whose consumption never
    # changed.
    segment_eps, normalized = _normalize_known_inputs(
        segment_eps, led, segment_start, as_of, codes
    )

    # 6 — INDEPENDENCE ------------------------------------------------------
    accepted, not_accepted = observation.select_independent(segment_eps)
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
    hard_confounders = _hard_confounders(led, codes, segment_start, as_of)

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
    rapid = traj.rapid(segment_eps, known_events_explain=bool(hard_confounders))
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
    # Every hold names its cause. Four branches of the pipeline (`INSUFFICIENT`,
    # `CONFOUNDED`, `EVIDENCE_ANOMALOUS`, unknown `D_current`) return a HOLD the
    # pipeline itself does not code, because the cause was established upstream
    # by the evidence gate. The causes exist in the array either way; what was
    # missing is putting them in the field the card reads, which rendered "HOLD
    # is a full recommendation, not a failure to answer" beside an empty list.
    hold_reasons = list(rec.codes)
    if rec.status in (dosing.HELD, dosing.WITHHELD_CAPABILITY):
        for c in codes:
            if c.code in _EVIDENCE_GATES and c.code not in hold_reasons:
                hold_reasons.append(c.code)
    codes.append(Code("OUTPUT_HOLD_IS_A_RECOMMENDATION", holdReasons=hold_reasons))

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

    # 13 — RESPONSE --------------------------------------------------------
    # Stage three. The classifier reads the immutable snapshot and the two
    # windows the intervention module built; it never recomputes the prediction
    # and never sees the current potency.
    #
    # The *latest* intervention is the one the result reports, because that is
    # the one a keeper is asking about. Every intervention is still assessed --
    # an earlier one that reached a terminal class stays terminal -- and the
    # audit list carries them all.
    assessments = [
        (iv, response_mod.assess(iv, pos.a_now, cfg)) for iv in interventions
    ]
    if assessments:
        _, latest_assessment = assessments[-1]
        response_payload = latest_assessment.payload()
        for code, payload in latest_assessment.codes:
            codes.append(Code(code, **payload))
    else:
        response_payload = NOT_RUN

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
        # `ALK-053` / `ALK-POSTCHANGE-RETEST-001`. After a confirmed dose change
        # the keeper is in a post-change regime, not on the routine cadence: the
        # first ordinary post-change test is ~48 h after the change and the
        # second ~48 h after that. Both are stated as hours **from `asOf`**, so
        # a candidate already in the past is submitted at zero rather than
        # negative, and the scheduler -- the single owner -- picks between them
        # and everything else. Leaving these unsubmitted told a keeper who had
        # just changed their dose that they were on the routine 48-hour cadence,
        # and left the audit list missing a candidate that applied.
        **_post_change_hours(interventions, as_of),
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
        active_intervention=_active(
            interventions,
            {iv.intervention_id: a.classification for iv, a in assessments},
        ),
        response=response_payload,
        return_plan_offer=return_plan_offer,
        return_plan_eligible=return_plan_eligible,
    )

    # One owner for next-test timing. Every code that carries `nextUsefulTestAt`
    # wrote a placeholder; the scheduler's decision fills all of them, so the
    # reason payloads and `retest.recommendedAt` cannot disagree.
    scheduled = result["retest"]["recommendedAt"]
    for c in codes:
        if c.payload.get("nextUsefulTestAt") == _SCHEDULER_FILLS:
            c.payload["nextUsefulTestAt"] = scheduled

    # The evidence gate is one cause with several consequences. Where it stopped
    # the consumption estimate, the code that stated the cause is the code that
    # names the withheld output -- rather than a second, differently-worded
    # refusal from the consumption owner saying something untrue about the dose
    # history.
    if cons.blocked_by_evidence:
        for c in codes:
            if c.code in _EVIDENCE_GATES:
                affected = c.payload.setdefault("affectedOutputs", [])
                for name in ("consumption", "consumptionDkhPerDay"):
                    if name not in affected:
                        affected.append(name)

    # Every field the engine left `NOT_RUN` or `WITHHELD` must be named by a
    # gating or refusal code (`INV-I4`, schema invariant 8). Nothing is silently
    # absent; a withheld output is a designed state that carries its reason.
    result["reasonCodes"] = _ordered(codes)
    unexplained = _unexplained_withheld(result, codes, withheld_outputs)
    if unexplained or unread:
        codes.append(
            Code(
                _UMBRELLA,
                missing=unread + unexplained,
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



def _segment(eps, led, as_of, codes: List[Code]):
    """The most recent clean current-control segment — `A5`, `ALK-007`.

    Boundaries this build observes: the latest maintenance dose change at or
    before `asOf`, and the 14-day lookback cap. Every other boundary source
    Part II §13 lists is reported as a confounder by `_hard_confounders` and
    holds the recommendation rather than silently trimming the window.

    **Never extend the cap because evidence is sparse** (Part II §1.3), and never
    fall back to an older segment: a sparse recent segment is the truth about a
    tank that has not been tested, and reaching further back to find three
    readings would answer a question about last fortnight with data from last
    month.
    """
    codes = []
    start = None
    pending = []

    changes = [
        e
        for e in led.of_kind("DOSE_CHANGE")
        if e.at is not None and e.at.epoch_seconds <= as_of.epoch_seconds
    ]
    if changes:
        boundary = max(changes, key=lambda e: e.at.epoch_seconds)
        start = boundary.at
        pending.append(
            (
                boundary.at,
                "SEGMENT_BOUNDARY_DOSE_CHANGE",
                {
                    "doseStateId": boundary.event_id or f"IV-{boundary.at.text}",
                    "effectiveAt": boundary.at.text,
                },
            )
        )

    # `A7` and `ALK-033` say *boundary*, not a state the tank never leaves: an
    # unknown correction, a recorded delivery anomaly and an unknown-replacement
    # water change at or above the 5% break each end the pre-event segment and
    # start a clean one after it. Treating them as permanent confounders instead
    # -- which this engine did until this pass -- meant one unmeasured water
    # change stopped the product answering for the rest of the tank's life.
    for e, code, payload in _boundary_events(led, as_of, eps, codes):
        pending.append((e.at, code, payload))
        if start is None or e.at.epoch_seconds > start.epoch_seconds:
            start = e.at

    cap = kernel.plus_hours(as_of, -MAX_CONTROL_LOOKBACK_DAYS * HOURS_PER_DAY)
    cap_binds = start is None or cap.epoch_seconds > start.epoch_seconds
    if cap_binds:
        start = cap
    inside = [e for e in eps if e.at.epoch_seconds > start.epoch_seconds]

    # Only the boundary that actually selected the start is reported as the
    # trim: naming the 14-day cap when a dose change did the trimming states
    # something untrue about why the keeper's history is shorter than they think.
    for at, code, payload in pending:
        if at.epoch_seconds == start.epoch_seconds:
            codes.append((code, payload))
    if cap_binds and len(inside) < len(eps):
        codes.append(
            (
                "SEGMENT_LOOKBACK_NOT_EXTENDED",
                {"spanDays": MAX_CONTROL_LOOKBACK_DAYS, "capDays": MAX_CONTROL_LOOKBACK_DAYS},
            )
        )
    codes.append(
        (
            "SEGMENT_SELECTED",
            {
                "segmentId": f"SEG-{start.text}",
                "startAt": start.text,
                "endAt": as_of.text,
                "spanDays": elapsed_days(start, as_of),
                "lookbackCapDays": MAX_CONTROL_LOOKBACK_DAYS,
            },
        )
    )
    return inside, codes, start


def _potency_at(cfg):
    """`(potency, contextId, confidence)` as they stood at a given instant.

    The prediction snapshot needs the potency **in force at the dose change**,
    not the one in force now. In this build the learner is gated, so the figure
    at every instant is the theoretical-or-configured one and the configuration
    history resolves it. When the gate opens, this is the one function that has
    to learn to walk the pool as it stood then -- which is why the intervention
    module takes it as an argument rather than importing the learner.

    IT ASKS `potency.theoretical`. IT DOES NOT READ A CONFIG FIELD ITSELF.

    It used to return `cfg.num("selectedPotencyDkhPerMl")` directly, which is a
    second implementation of "what is this solution's strength" -- and a weaker
    one, because `ALK-014`'s owner also derives the figure from `chemical` and
    `stockConcentrationGPerL` when no potency is configured.

    The consequence was not a wrong number. It was silence. A keeper who states
    his solution as grams per litre -- the form a keeper who mixes his own soda
    ash actually holds -- configures no `selectedPotencyDkhPerMl` at all, so this
    returned `None`, `_snapshot` returned `NO_POTENCY_AT_PREDICTION`, and every
    dose change he ever made came back
    `LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE`. The response classifier never ran.
    The six classes, the three gates and the whole "did that dose change work?"
    layer were unreachable for him, while the SAME configuration sized his doses
    correctly through `potency.theoretical` two modules away.

    `MASTER RULE 1`: one owner for each inference. Two implementations that agree
    today are a defect, not a coincidence -- and these two did not even agree
    today.

    No threshold, band edge, rail or equation changes here. Where a potency is
    configured, `theoretical` returns it unchanged and this function returns
    exactly what it returned before.
    """

    def at(_instant):
        value, _codes = potency_mod.theoretical(cfg)
        return (
            value,
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


def _active(interventions, attributions) -> Any:
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
    kw_attribution = attributions.get(iv.intervention_id, NOT_RUN)
    return {
        "interventionId": iv.intervention_id,
        "interventionType": "MAINTENANCE_DOSE_CHANGE",
        "oldDoseMlPerDay": iv.old_dose if iv.old_dose is not None else UNKNOWN,
        "newDoseMlPerDay": iv.new_dose if iv.new_dose is not None else UNKNOWN,
        "actualStartTime": iv.at.text,
        "phase": iv.phase,
        "responseAttribution": kw_attribution,
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

    # Codes are additive and several may be true at once. A code that describes
    # **one entity** -- an episode, an intervention, a water change -- repeats
    # once per entity, carrying that entity's own payload. Collapsing those to a
    # single entry kept the first episode's id, value and time and silently
    # dropped the other five, which contradicts the catalogue's own wording
    # ("every episode holding at least one valid measurement resolves") and
    # makes the audit record unable to support the replay `DEC-003` promises.
    #
    # The merge is kept for the handful of genuine **umbrella** codes, whose
    # payload is a list that accumulates across the assessment: those are raised
    # once per withheld output, and keeping only the first would leave the others
    # unnamed and `INV-I4` violated by an edit that looked like tidying.
    merged: Dict[str, Code] = {}
    out_codes: List[Code] = []
    seen: set = set()
    for c in codes:
        if c.code in _ACCUMULATING:
            if c.code not in merged:
                merged[c.code] = Code(c.code, **dict(c.payload))
                out_codes.append(merged[c.code])
                continue
            target = merged[c.code].payload
            for key, value in c.payload.items():
                if isinstance(value, list) and isinstance(target.get(key), list):
                    for item in value:
                        if item not in target[key]:
                            target[key].append(item)
                elif key not in target:
                    target[key] = value
            continue
        # Identical repeats of the same statement are still collapsed -- two
        # copies of one fact are noise, not two facts.
        fingerprint = (c.code, json.dumps(c.payload, sort_keys=True, default=str))
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        out_codes.append(c)
    indexed = list(enumerate(out_codes))
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
    if code == "UNCERTAINTY_PAIRWISE_MAD_DIAGNOSTIC_ONLY":
        # The catalogue declares `pairwiseSlopeMad`, and the card renders it
        # under the words "the pairs disagree a lot with each other". Publishing
        # `sigmaS` under that name is a different quantity with a different
        # magnitude beside prose describing the other one.
        return {"pairwiseSlopeMad": kernel.mad(obs.pairwise_slopes)}
    return {"sigmaS": obs.sigma_s}


def _evidence_payload(code: str, ev, obs, sup, as_of) -> Dict[str, Any]:
    base = {
        "independentClusters": ev.have_clusters,
        "spanDays": ev.have_span_days,
    }
    if code == "EVIDENCE_INSUFFICIENT_CLUSTERS":
        return {"have": ev.have_clusters, "need": 3, "windowDays": 14,
                "nextUsefulTestAt": _SCHEDULER_FILLS}
    if code == "EVIDENCE_INSUFFICIENT_SPAN":
        return {"haveDays": ev.have_span_days, "needDays": 4,
                "nextUsefulTestAt": _SCHEDULER_FILLS}
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


def _wc_step(e, eps):
    """`dA_WC = f * (A_replacement - A_tank)`, or `None` if not computable.

    `A_tank` is the last resolved episode at or before the event -- the only
    recorded fact available. Where the ledger holds no measurement before the
    water change there is nothing to compute the step against, and the engine
    does not interpolate one: an un-computable known step is handled as an
    unknown one, which is a branch canon fully specifies. Whether canon should
    instead name its own `A_tank` resolution is `OD-024`, recorded and left open.
    """
    fraction = e.get("changedFraction")
    replacement = e.get("replacementAlkalinityDkh")
    if not (kernel.finite(fraction) and kernel.finite(replacement)):
        return None
    before = [p for p in eps if p.at.epoch_seconds <= e.at.epoch_seconds]
    if not before:
        return None
    return float(fraction) * (float(replacement) - float(before[-1].value_dkh))


def _normalize_known_inputs(eps, led, start, as_of, codes: List[Code]):
    """`ALK-033` / Part II §9 and §46 — remove known discrete steps.

    A water change whose replacement alkalinity was measured from the same batch
    is a **known** step, not a boundary and not tank movement:

        A_norm(t) = A_raw(t) - sum of dA over the events at or before t

    Only a *material* step is normalized -- `|dA_WC| >= 0.10` dKH, the Alk
    working uncertainty floor. A sub-floor known step is left alone, because
    subtracting a quantity smaller than the analytical noise adds arithmetic
    without adding truth. Either way the raw measurement is preserved: this
    builds a normalized *series* for the trend inference and does not rewrite
    the episode record the position and the card read.
    """
    known = [
        e
        for e in led.of_kind("WATER_CHANGE")
        if e.at is not None
        and e.at.epoch_seconds > start.epoch_seconds
        and e.at.epoch_seconds <= as_of.epoch_seconds
        and _wc_replacement_known(e)
    ]
    if not known:
        return eps, False
    known.sort(key=lambda e: e.at.epoch_seconds)

    steps = []
    for e in known:
        delta = _wc_step(e, eps)
        if delta is None:
            # Not computable; `_boundary_events` has already handled it as the
            # unknown branch canon specifies.
            continue
        if abs(delta) < ALK_MATERIALITY_FLOOR:
            codes.append(
                Code("SEGMENT_WC_NEGLIGIBLE",
                     waterChangeId=e.event_id or UNKNOWN,
                     expectedStepDkh=clean(delta))
            )
            continue
        steps.append((e.at, delta, e.event_id or f"WC-{e.at.text}"))
        codes.append(
            Code("SEGMENT_WC_MATERIAL_KNOWN_NORMALIZED",
                 waterChangeId=e.event_id or UNKNOWN,
                 expectedStepDkh=clean(delta))
        )
        codes.append(
            Code("SEGMENT_NORMALIZED_WATER_CHANGE",
                 waterChangeId=e.event_id or UNKNOWN,
                 appliedStepDkh=clean(delta))
        )

    if not steps:
        return eps, False

    # Part II §9.4: the normalization carries its own uncertainty, and this
    # build does not propagate it. Said once, naming the events it applies to.
    codes.append(
        Code("SEGMENT_NORMALIZATION_UNCERTAINTY_MODEL_UNAVAILABLE",
             eventIds=[eid for _, _, eid in steps],
             openIssue="OI-NORMUNCERT-001")
    )

    out = []
    for p in eps:
        total = sum(d for at, d, _ in steps if at.epoch_seconds <= p.at.epoch_seconds)
        out.append(replace(p, value_dkh=clean(p.value_dkh - total)) if total else p)
    return out, True


def _wc_replacement_known(e) -> bool:
    """`ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001`.

    Only `MEASURED_SAME_BATCH` qualifies. Every other tier -- a configured salt
    profile, a manufacturer nominal figure, an absent tier -- is treated as
    unknown replacement alkalinity, because canon's own warning is that an
    unverified salt label must not become a precise correction merely because a
    formula exists.
    """
    return e.get("replacementAlkalinityDkh") is not None and (
        e.get("replacementAlkalinityConfidence") == "MEASURED_SAME_BATCH"
    )


def _boundary_events(led, as_of, eps, codes: List[Code]):
    """Events that **end** the analytical segment, in ledger order.

    `A7` / `ALK-033` / Part II §13. Each yields `(event, code, payload)`. An
    event after `asOf` is not read at all: a replay of an older assessment must
    not be moved by something that had not happened yet (canon §64).
    """
    out = []
    for e in led.of_kind("MANUAL_CORRECTION"):
        if e.at is None or e.at.epoch_seconds > as_of.epoch_seconds:
            continue
        if e.get("actualVolumeMl") in (None, "UNKNOWN"):
            out.append((e, "SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION", {
                "correctionId": e.event_id or UNKNOWN,
                "affectedOutputs": ["observedTrajectory", "consumption"],
            }))
    for e in led.of_kind("WATER_CHANGE"):
        if e.at is None or e.at.epoch_seconds > as_of.epoch_seconds:
            continue
        fraction = e.get("changedFraction")
        if _wc_replacement_known(e):
            if _wc_step(e, eps) is not None:
                continue
            # Measured same batch, but the step is not computable from what was
            # entered. Canon's own instruction is that a value that cannot drive
            # normalization is treated as unknown replacement alkalinity, which
            # is a fully specified branch; inventing a tank value is not.
        elif e.get("replacementAlkalinityDkh") is not None:
            codes.append(
                Code("SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE",
                     waterChangeId=e.event_id or UNKNOWN,
                     confidence=e.get("replacementAlkalinityConfidence", UNKNOWN),
                     requiredConfidence="MEASURED_SAME_BATCH",
                     ruleId="ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001")
            )
        if not kernel.finite(fraction):
            continue
        if float(fraction) >= WC_UNKNOWN_BREAK_FRACTION:
            out.append((e, "SEGMENT_WC_UNKNOWN_BOUNDARY", {
                "waterChangeId": e.event_id or UNKNOWN,
                "changedFraction": fraction,
                "potentialStepDkh": float(fraction) * UNKNOWN_WC_ASSUMED_MISMATCH,
                "affectedOutputs": ["observedTrajectory"],
            }))
        else:
            codes.append(
                Code("SEGMENT_WC_UNKNOWN_SUBFLOOR",
                     waterChangeId=e.event_id or UNKNOWN,
                     changedFraction=fraction,
                     potentialStepDkh=float(fraction) * UNKNOWN_WC_ASSUMED_MISMATCH)
            )
    for e in led.of_kind("DELIVERY_ANOMALY"):
        if e.at is None or e.at.epoch_seconds > as_of.epoch_seconds:
            continue
        out.append((e, "SEGMENT_BOUNDARY_DELIVERY_ANOMALY", {
            "anomalyId": e.event_id or UNKNOWN,
            "anomalyType": e.get("anomalyType", UNKNOWN),
        }))
    out.sort(key=lambda t: t[0].at.epoch_seconds)
    return out


def _hard_confounders(led, codes: List[Code], start, as_of) -> List[str]:
    """Confounder causes the ledger states outright **inside the segment**.

    Only the ones the ledger *states*, and only the ones that fall in
    `(start, asOf]`. Anything earlier is on the far side of a boundary and is
    not evidence about this segment; anything later has not happened yet. The
    engine never creates a confounder from an unexpected slope;
    `SHARED-CONSUMPTION-CONTEXT-001` makes a consumption-context event a
    recorded fact and never an inference.

    The boundary sources themselves are not listed here -- `_boundary_events`
    ends the segment at them, and after that cut none of them is inside it. A
    boundary that also confounded everything after it would be both, which is
    how one water change used to silence the engine permanently.
    """
    found: List[str] = []

    def inside(e) -> bool:
        return (
            e.at is not None
            and e.at.epoch_seconds > start.epoch_seconds
            and e.at.epoch_seconds <= as_of.epoch_seconds
        )

    for e in led.of_kind("DOSE_CHANGE") + led.of_kind("DOSE_STATE"):
        if inside(e) and e.get("effectiveAtConfidence") == "UNCERTAIN":
            found.append("UNCERTAIN_DOSE_TIME")
            codes.append(
                Code("SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME",
                     doseStateId=e.event_id or UNKNOWN,
                     affectedOutputs=["observedTrajectory", "consumption"])
            )
    for e in led.of_kind("DELIVERY_ANOMALY"):
        if e.at is not None and e.at.epoch_seconds <= as_of.epoch_seconds:
            # Recorded as a fact wherever it falls; it is the *boundary* that
            # scopes its analytical effect, not this record.
            codes.append(
                Code("DELIVERY_ANOMALY_RECORDED",
                     anomalyId=e.event_id or UNKNOWN,
                     anomalyType=e.get("anomalyType", UNKNOWN),
                     fromAt=e.get("fromAt", UNKNOWN),
                     toAt=e.get("toAt", UNKNOWN))
            )
    for e in led.of_kind("CONSUMPTION_CONTEXT_EVENT"):
        if inside(e):
            found.append("CONSUMPTION_CONTEXT_CHANGE")
    return found


def _post_change_hours(interventions, as_of) -> Dict[str, Optional[float]]:
    """The two `ALK-053` post-change candidates, in hours from `asOf`.

    Measured from the latest confirmed dose change at or before `asOf`, and only
    while that change is still inside the attribution horizon: a candidate for a
    change three months ago is not a post-change regime, it is history. A
    candidate whose moment has passed is submitted at `0.0` -- "as soon as you
    can" -- because a negative offset would put the scheduler's own answer
    before the instant it is answering at.
    """
    live = [
        iv for iv in interventions
        if iv.at.epoch_seconds <= as_of.epoch_seconds
        and iv.days_since_start <= ATTRIBUTION_HORIZON_DAYS
    ]
    if not live:
        return {"post_change_first_at_hours": None, "post_change_second_at_hours": None}
    latest = max(live, key=lambda iv: iv.at.epoch_seconds)
    elapsed_h = latest.days_since_start * HOURS_PER_DAY
    first = max(0.0, POSTCHANGE_FIRST_TEST_HOURS - elapsed_h)
    second = max(
        0.0,
        POSTCHANGE_FIRST_TEST_HOURS + POSTCHANGE_SECOND_TEST_HOURS - elapsed_h,
    )
    return {
        "post_change_first_at_hours": first,
        "post_change_second_at_hours": second,
    }


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
    # `ALK-DECIMAL-THRESHOLD-001`'s fifth row: the advisory boundary is a
    # canonical threshold over exact decimals. Constructed in binary64,
    # `8.2 - 1.0` is `7.199999999999999`, so a reading of exactly `7.2` -- the
    # keeper's own one-decimal figure, on a one-decimal configuration canon
    # itself calls plausible -- silently failed to raise the warning.
    if outer_min is not None:
        state["advisoryFloorDkh"] = float(
            kernel.dec(outer_min) - kernel.dec(ADVISORY_OFFSET)
        )
    if outer_max is not None:
        state["advisoryCeilingDkh"] = float(
            kernel.dec(outer_max) + kernel.dec(ADVISORY_OFFSET)
        )

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
                 nextUsefulTestAt=_SCHEDULER_FILLS,
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
                nextUsefulTestAt=_SCHEDULER_FILLS,
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
        a_now = kernel.dec(pos.a_now)
        beyond = (
            floor_v is not None
            and a_now <= kernel.dec(outer_min) - kernel.dec(ADVISORY_OFFSET)
        ) or (
            ceil_v is not None
            and a_now >= kernel.dec(outer_max) + kernel.dec(ADVISORY_OFFSET)
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
        # `NONE` where the current value came from a reading with no usable
        # instant: such a reading forms no episode, so there is no cluster id to
        # give, and that is a **value**, not a withholding (owner decision 30).
        # `NOT_RUN` is kept for the genuinely empty case -- no observation of
        # any kind resolved -- where the umbrella names it.
        "latestValidClusterId": (
            pos.episode.cluster_id
            if pos.episode is not None
            else (kernel.NONE_VALUE if pos.a_now is not None else NOT_RUN)
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
        "responseAssessment": kw["response"],
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
    """Withheld **outputs** no emitted code names, so the umbrella can name them.

    Two parts of the result are deliberately outside the sweep, because neither
    is an engine output:

    * `capabilities[]` is the capability gate's own record. `outcome: NOT_RUN`
      there is a *finding about a capability*, already named by its own `M-n`
      code — reading it as a withheld output made the umbrella fire on a tank
      with perfect evidence and put `capabilities[1].outcome` on the keeper's
      card as a thing that was missing.
    * `reasonCodes[]` payloads quote other fields' states. A quotation of a
      withheld output is not a second withheld output.
    """
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

    for key, value in result.items():
        if key in ("capabilities", "reasonCodes"):
            continue
        if isinstance(value, str) and value in _MARKERS:
            if key not in named:
                out.append(key)
        else:
            walk(value, key)
    return sorted(set(out))
