"""L6 — the response classifier. "Did that dose change work?"

Stage three. `A27` … `A31`, `ALK-RESPONSE-CLASSIFIER-001` and the rules it
governs.

Answering this question is what distinguishes the application from a logbook,
and the whole of it rests on one thing: **the prediction the app made at the
moment of the change**. `alk_v2.intervention` owns that snapshot; this module
reads it and never recomputes it. A later potency recalibration changes current
and future calculations only — an intervention that goes on to contribute a
potency observation must not have its own benchmark rewritten by that
observation, because that is circular self-validation (`WG-ALK-020`).

**Three gates, then six classes.** The gates are not failures and are not
classes: each is its own state, and `A30`'s failure clause says so —
*any eligibility gate unmet ⇒ that gate's state, never a class.*

**Current-dose assessment continues regardless.** Once the post-change regime
has its own sufficient evidence the engine still computes the observed slope,
the supported slope, the balance and a recommendation, even while the old
intervention stays `NOT_ATTRIBUTABLE_SMALL_SIGNAL`, `AWAITING_DETECTABILITY` or
`INCONCLUSIVE`. The app must never be stuck because a past change cannot be
causally isolated.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .constants import (
    ALK_RESPONSE_K,
    ATTRIBUTION_HORIZON_DAYS,
    MIN_ORDINARY_CLUSTERS,
    MIN_ORDINARY_SPAN_DAYS,
)
from . import intervention as iv_mod

# --- ResponseAttribution, the complete closed vocabulary -------------------
# Eleven states reach the classifier's own layer; the rest are the gates and the
# lifecycle. Terminal and non-terminal are marked, because the difference is the
# whole point of a state like AWAITING_DETECTABILITY: it is neither a failure nor
# NO_DETECTABLE_RESPONSE, and it may still resolve.
NOT_YET_ASSESSABLE = "NOT_YET_ASSESSABLE"                      # non-terminal
AWAITING_FORMAL_POST_SLOPE = "AWAITING_FORMAL_POST_SLOPE"      # non-terminal
AWAITING_DETECTABILITY = "AWAITING_DETECTABILITY"              # non-terminal
INCONCLUSIVE = "INCONCLUSIVE"                                  # non-terminal
EXPECTED = "EXPECTED"                                          # terminal
PARTIAL = "PARTIAL"                                            # terminal
NO_DETECTABLE_RESPONSE = "NO_DETECTABLE_RESPONSE"              # terminal
CONTRADICTORY = "CONTRADICTORY"                                # terminal
OVER_RESPONSE = "OVER_RESPONSE"                                # terminal
NOT_ATTRIBUTABLE_SMALL_SIGNAL = "NOT_ATTRIBUTABLE_SMALL_SIGNAL"  # terminal, immediate
PRECHANGE_EVIDENCE_INSUFFICIENT = "PRECHANGE_EVIDENCE_INSUFFICIENT"  # terminal
NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME = "NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME"  # terminal
CONFOUNDED = "CONFOUNDED"                                      # terminal for the window
INTERRUPTED = "INTERRUPTED"                                    # terminal
INTERRUPTED_BY_SAFETY_RETURN = "INTERRUPTED_BY_SAFETY_RETURN"  # terminal
UNRESOLVED_EXPIRED = "UNRESOLVED_EXPIRED"                      # terminal
LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE = "LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE"  # terminal

#: The six deterministic classes `ALK-RESPONSE-CLASSIFIER-001` defines, and only
#: those. `OVERSHOOT` is **not** among them and must never be added back: it is a
#: position event, orthogonal to the response (Part I §7.6A).
SIX_CLASSES = (
    EXPECTED,
    PARTIAL,
    NO_DETECTABLE_RESPONSE,
    CONTRADICTORY,
    OVER_RESPONSE,
    INCONCLUSIVE,
)

TERMINAL = frozenset(
    {
        EXPECTED,
        PARTIAL,
        NO_DETECTABLE_RESPONSE,
        CONTRADICTORY,
        OVER_RESPONSE,
        NOT_ATTRIBUTABLE_SMALL_SIGNAL,
        PRECHANGE_EVIDENCE_INSUFFICIENT,
        NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME,
        CONFOUNDED,
        INTERRUPTED,
        INTERRUPTED_BY_SAFETY_RETURN,
        UNRESOLVED_EXPIRED,
        LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE,
    }
)

# positionEvent — orthogonal to everything above
NONE = "NONE"
OVERSHOOT = "OVERSHOOT"

NOT_RUN = "NOT_RUN"


@dataclass
class Assessment:
    classification: str
    terminal: bool
    codes: List[Any] = field(default_factory=list)
    metrics: Dict[str, Any] = field(default_factory=dict)
    position_event: str = NONE

    def payload(self) -> Dict[str, Any]:
        out = dict(self.metrics)
        out["classification"] = self.classification
        out["classificationIsTerminal"] = self.terminal
        out["positionEvent"] = self.position_event
        return out


def _state(classification: str, **metrics) -> Assessment:
    return Assessment(
        classification=classification,
        terminal=classification in TERMINAL,
        metrics=metrics,
    )


def assess(iv: iv_mod.Intervention, a_now: Optional[float], cfg) -> Assessment:
    """One intervention's response, or the gate state that stopped it.

    Evaluated in `A27` → `A28` → `A29` → `A30` order, and the order is normative:
    a small signal is terminal *immediately*, before any question about post
    evidence, because no amount of future post evidence can isolate an effect
    smaller than the pre-change band.
    """
    snap = iv.snapshot

    # --- lifecycle states that pre-empt the gates -------------------------
    if not snap.available:
        a = _state(
            LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE,
            interventionId=iv.intervention_id,
            unavailableReason=snap.unavailable_reason,
        )
        a.codes.append(
            (
                "INTERVENTION_PREDICTION_SNAPSHOT_UNAVAILABLE",
                {
                    "interventionId": iv.intervention_id,
                    "affectedOutputs": ["responseAssessment"],
                },
            )
        )
        return a

    if iv.effective_at_confidence != "EXACT":
        a = _state(
            NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME, interventionId=iv.intervention_id
        )
        a.codes.append(
            (
                "RESPONSE_NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME",
                {
                    "doseStateId": iv.intervention_id,
                    "affectedOutputs": ["responseAssessment"],
                },
            )
        )
        return a

    if iv.confounders:
        a = _state(CONFOUNDED, interventionId=iv.intervention_id)
        a.codes.append(
            (
                "RESPONSE_CONFOUNDED",
                {
                    "confounders": list(iv.confounders),
                    "affectedOutputs": ["responseAssessment"],
                },
            )
        )
        return a

    if iv.interrupted_by:
        # `INTERRUPTED` is never `FAILED` and never `EXPECTED` (Part I §57 item 9).
        # The exposure that actually happened stays in the ledger; what is lost is
        # the ability to attribute a response to *this* change.
        a = _state(
            INTERRUPTED,
            interventionId=iv.intervention_id,
            interruptedByInterventionId=iv.interrupted_by,
        )
        a.codes.append(
            (
                "INTERVENTION_INTERRUPTED",
                {
                    "interventionId": iv.intervention_id,
                    "interruptedByInterventionId": iv.interrupted_by,
                },
            )
        )
        return a

    sigma_pre = snap.pre_change_slope_uncertainty
    s_pre = snap.pre_change_observed_slope
    expected_change = snap.expected_slope_change

    # --- A27 — pre-change evidence gate -----------------------------------
    ordinary = (
        iv.pre.n >= MIN_ORDINARY_CLUSTERS
        and iv.pre.span_days >= MIN_ORDINARY_SPAN_DAYS
    )
    if not ordinary or sigma_pre is None or s_pre is None:
        # Terminal for *this intervention's attribution* only. It does not block
        # current position, current maintenance analysis, or a future
        # intervention.
        a = _state(
            PRECHANGE_EVIDENCE_INSUFFICIENT,
            interventionId=iv.intervention_id,
            preClusters=iv.pre.n,
            preSpanDays=iv.pre.span_days,
        )
        a.codes.append(
            (
                "RESPONSE_PRECHANGE_EVIDENCE_INSUFFICIENT",
                {
                    "interventionId": iv.intervention_id,
                    "preClusters": iv.pre.n,
                    "preSpanDays": iv.pre.span_days,
                    "affectedOutputs": ["responseAssessment"],
                },
            )
        )
        return a

    # --- A28 — attribution gate -------------------------------------------
    r_exp = abs(expected_change)
    b_min = ALK_RESPONSE_K * sigma_pre
    if r_exp <= b_min:
        # Terminal and immediate: the effect can never be isolated, however much
        # post evidence arrives. `ALK-MINIMUM-ACTION-001` still required the
        # change to be recommended, and this is not a statement that it was wrong.
        a = _state(
            NOT_ATTRIBUTABLE_SMALL_SIGNAL,
            interventionId=iv.intervention_id,
            expectedResponseDkhPerDay=r_exp,
            minimumAttributionBandDkhPerDay=b_min,
            sigmaPre=sigma_pre,
        )
        a.codes.append(
            (
                "RESPONSE_NOT_ATTRIBUTABLE_SMALL_SIGNAL",
                {
                    "interventionId": iv.intervention_id,
                    "R_exp": r_exp,
                    "B_min": b_min,
                    "sigma_pre": sigma_pre,
                    "deltaDose": iv.delta_dose,
                },
            )
        )
        return a

    # --- the Day +2 state --------------------------------------------------
    # One genuine post-change measurement is never enough to run the classifier.
    # Day +2 assesses position, suspicion, exposure, rapid movement, outer-bound
    # risk and interruption, and may show the predicted post slope alongside the
    # first post-change interval as context. It must not call an approximately
    # flat first interval "no response" merely because alkalinity did not rise
    # (`AUDIT-002`).
    if iv.post.n < 2 or iv.post.sigma is None:
        if iv.days_since_start > ATTRIBUTION_HORIZON_DAYS:
            return _expired(iv)
        first_interval = None
        if iv.post.n == 1 and s_pre is not None:
            first_interval = "NOT_RUN"
        a = _state(
            AWAITING_FORMAL_POST_SLOPE if iv.post.n >= 1 else NOT_YET_ASSESSABLE,
            interventionId=iv.intervention_id,
            postClusters=iv.post.n,
            predictedPostSlopeDkhPerDay=snap.predicted_post_slope,
        )
        if iv.post.n >= 1:
            a.codes.append(
                (
                    "RESPONSE_AWAITING_FORMAL_POST_SLOPE",
                    {
                        "interventionId": iv.intervention_id,
                        "firstPostChangeIntervalSlope": first_interval or "NOT_RUN",
                        "predictedPostSlope": snap.predicted_post_slope,
                    },
                )
            )
        return a

    sigma_post = iv.post.sigma
    s_post = iv.post.slope

    # --- A29 — detectability gate ------------------------------------------
    sigma_post_required = ((r_exp / ALK_RESPONSE_K) ** 2 - sigma_pre ** 2) ** 0.5
    if sigma_post > sigma_post_required:
        if iv.days_since_start > ATTRIBUTION_HORIZON_DAYS:
            return _expired(iv)
        a = _state(
            AWAITING_DETECTABILITY,
            interventionId=iv.intervention_id,
            sigmaPost=sigma_post,
            sigmaPostRequiredDkhPerDay=sigma_post_required,
            expectedResponseDkhPerDay=r_exp,
        )
        a.codes.append(
            (
                "RESPONSE_AWAITING_DETECTABILITY",
                {
                    "sigma_post": sigma_post,
                    "sigma_post_required": sigma_post_required,
                    "R_exp": r_exp,
                },
            )
        )
        return a

    if iv.days_since_start > ATTRIBUTION_HORIZON_DAYS:
        return _expired(iv)

    # --- A30 — the six-way classifier --------------------------------------
    u = 1.0 if expected_change > 0 else -1.0
    r_obs = u * (s_post - s_pre)
    sigma_response = (sigma_pre ** 2 + sigma_post ** 2) ** 0.5
    b = ALK_RESPONSE_K * sigma_response

    classification = classify(r_obs, r_exp, b)

    a = _state(
        classification,
        interventionId=iv.intervention_id,
        sPostDkhPerDay=s_post,
        sPreDkhPerDay=s_pre,
        sigmaPreDkhPerDay=sigma_pre,
        sigmaPostDkhPerDay=sigma_post,
        expectedResponseDkhPerDay=r_exp,
        directedObservedResponseDkhPerDay=r_obs,
        sigmaResponseDkhPerDay=sigma_response,
        responseBandDkhPerDay=b,
        minimumAttributionBandDkhPerDay=b_min,
        sigmaPostRequiredDkhPerDay=sigma_post_required,
        # Diagnostic only. Part II §33: these must never form a second
        # classifier, so they are emitted beside the class and never consulted
        # by it.
        responseErrorDkhPerDay=r_obs - r_exp,
        responseRatio=(r_obs / r_exp) if r_exp else "NOT_RUN",
    )
    a.codes.append(
        (
            f"RESPONSE_{classification}",
            {
                "S_pre": s_pre,
                "sigma_pre": sigma_pre,
                "S_post": s_post,
                "sigma_post": sigma_post,
                "R_exp": r_exp,
                "R_obs": r_obs,
                "B": b,
                "snapshotPotency": snap.selected_potency_at_prediction,
            },
        )
    )
    a.codes.append(
        (
            "RESPONSE_METRICS_DIAGNOSTIC_ONLY",
            {"E_response": r_obs - r_exp, "R_response": (r_obs / r_exp) if r_exp else 0},
        )
    )
    if r_exp - b <= b:
        # The PARTIAL interval is empty. The engine does not invent a category
        # the evidence cannot separate, and says which one it declined to invent.
        a.codes.append(("RESPONSE_PARTIAL_BAND_EMPTY", {"R_exp": r_exp, "B": b}))
    a.codes.append(
        (
            "RESPONSE_MINIMUM_EXPOSURE_POLICY_UNAVAILABLE",
            {"exposureFraction": "NOT_RUN", "openIssue": "OI-EXPOSURE-001"},
        )
    )
    a.position_event = overshoot(iv, a_now, cfg)
    if a.position_event == OVERSHOOT:
        a.codes.append(
            (
                "RESPONSE_OVERSHOOT",
                {
                    "A_now": a_now,
                    "boundaryDkh": (
                        cfg.num("targetRangeMaxDkh")
                        if (iv.delta_dose or 0) > 0
                        else cfg.num("targetRangeMinDkh")
                    ),
                    "direction": "UP" if (iv.delta_dose or 0) > 0 else "DOWN",
                    "interventionId": iv.intervention_id,
                },
            )
        )
        a.codes.append(
            (
                "RESPONSE_OVERSHOOT_HORIZON_DERIVED",
                {"openIssue": "OI-OVERSHOOT-001"},
            )
        )
    return a


def classify(r_obs: float, r_exp: float, b: float) -> str:
    """The six classes — `ALK-RESPONSE-CLASSIFIER-001`, provably exclusive.

        R_obs < -B                          -> CONTRADICTORY
        R_obs > R_exp + B                   -> OVER_RESPONSE
        R_obs > B  AND  R_obs < R_exp - B   -> PARTIAL
        R_obs > B  AND  |R_obs - R_exp| <= B-> EXPECTED
        |R_obs| <= B AND |R_obs - R_exp| > B-> NO_DETECTABLE_RESPONSE
        everything else                     -> INCONCLUSIVE

    The boundary conventions are derived by evaluating the frozen conditions **at**
    the boundary rather than by changing the inequalities — canon finding D-7
    deliberately keeps the measure-zero convention. So `R_obs = -B` exactly is
    `NO_DETECTABLE_RESPONSE` (it fails the strict `< -B` and satisfies
    `|R_obs| <= B`), and `R_obs = +B` exactly is `NO_DETECTABLE_RESPONSE` when
    `|B - R_exp| > B` and `INCONCLUSIVE` otherwise. Both fall out of the
    conditions as written; neither is a special case in this function, which is
    the point.

    Takes three numbers and nothing else. It cannot see the position, the
    potency or the recommendation, which is what makes `INV-E6` — overshoot
    orthogonality — structural rather than a rule somebody has to remember.
    """
    if r_obs < -b:
        return CONTRADICTORY
    if r_obs > r_exp + b:
        return OVER_RESPONSE
    if r_obs > b and r_obs < r_exp - b:
        return PARTIAL
    if r_obs > b and abs(r_obs - r_exp) <= b:
        return EXPECTED
    if abs(r_obs) <= b and abs(r_obs - r_exp) > b:
        return NO_DETECTABLE_RESPONSE
    return INCONCLUSIVE


def overshoot(iv: iv_mod.Intervention, a_now: Optional[float], cfg) -> str:
    """`A31` — a position event, orthogonal to the response class.

    Measured from the **latest actual reading**, never from the regression: a
    range of 8.2–8.8 with a latest measurement of 8.95 is an overshoot even if
    the fitted line sits at 8.78.

    `EXPECTED` with `OVERSHOOT` is a legal, meaningful combination — the change
    did what was predicted *and* carried the level past the boundary — which is
    why `OVERSHOOT` must never be folded back into the response enum.

    The assessment horizon is derived rather than stated by canon
    (`OI-OVERSHOOT-001`); the engine uses the phase plus the 14-day attribution
    horizon and emits the code that says the horizon was derived.
    """
    if a_now is None or iv.delta_dose is None:
        return NONE
    within_phase = iv.phase in (
        iv_mod.JUST_IMPLEMENTED,
        iv_mod.OBSERVING,
        iv_mod.ASSESSMENT_DUE,
    )
    if not (within_phase or iv.days_since_start <= ATTRIBUTION_HORIZON_DAYS):
        return NONE
    range_max = cfg.num("targetRangeMaxDkh")
    range_min = cfg.num("targetRangeMinDkh")
    if iv.delta_dose > 0 and range_max is not None and a_now > range_max:
        return OVERSHOOT
    if iv.delta_dose < 0 and range_min is not None and a_now < range_min:
        return OVERSHOOT
    return NONE


def _expired(iv: iv_mod.Intervention) -> Assessment:
    a = _state(
        UNRESOLVED_EXPIRED,
        interventionId=iv.intervention_id,
        daysSinceStart=iv.days_since_start,
    )
    a.codes.append(
        (
            "RESPONSE_UNRESOLVED_EXPIRED",
            {
                "interventionId": iv.intervention_id,
                "daysSinceStart": ATTRIBUTION_HORIZON_DAYS,
            },
        )
    )
    return a
