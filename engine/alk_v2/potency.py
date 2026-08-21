"""L5 — potency: theoretical, observation, plausibility, pool, confidence.

Stage two. `ALK-016` … `ALK-021`, `A34` … `A38`.

**It reads stage one's output and nothing else.** The learner takes the episodes
and the interventions built from them, fits the same trend and uncertainty
functions stage one uses to each side of a dose change, and produces a potency
estimate. Nothing here writes back into trend, uncertainty, support or
consumption, and nothing in those modules imports this one. That is what makes
this layer modifiable without touching stage one: if a potency figure looks
wrong, the trend that fed it is the same trend the stage-one fixtures already
pinned.

**Empirical learning is `CAPABILITY_GATED` and ships disabled**
(`ALK-POTENCY-CAPABILITY-GATE-001`). While gated, `selectedPotency` is the
theoretical or configured value and the core controller is fully functional
(`WG-ALK-046`). The gated behaviour is built as canon states it; the gate is not
opened here.

**Learning is passive.** Never perturb a stable reef to calibrate. The learner
observes dose changes the keeper made for their own reasons and takes what it
can from them.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import kernel
from .constants import (
    MIN_ORDINARY_CLUSTERS,
    MIN_ORDINARY_SPAN_DAYS,
    NA2CO3_FACTOR,
    NAHCO3_FACTOR,
    NAOH_FACTOR,
    POTENCY_CALIBRATED_N,
    POTENCY_CALIBRATED_RDISP,
    POTENCY_CALIBRATED_SPAN_DAYS,
    POTENCY_ENVELOPE_HIGH,
    POTENCY_ENVELOPE_LOW,
    POTENCY_MIN_SIDE_CLUSTERS,
    POTENCY_MIN_SIDE_SPAN_DAYS,
    POTENCY_REASSESS_DELTA,
    POTENCY_SNR_CALIBRATION,
    POTENCY_SNR_DIAGNOSTIC,
    POTENCY_STRONG_N,
    POTENCY_STRONG_RDISP,
    POTENCY_STRONG_SPAN_DAYS,
    MAD_SCALE,
)
from .kernel import elapsed_days, median

# PotencyConfidence — closed vocabulary
THEORETICAL_ONLY = "THEORETICAL_ONLY"
EXPLORATORY = "EXPLORATORY"
PROVISIONAL = "PROVISIONAL"
CALIBRATED = "CALIBRATED"
STRONGLY_CALIBRATED = "STRONGLY_CALIBRATED"
REASSESSING = "REASSESSING"
INVALID_CONTEXT = "INVALID_CONTEXT"
UNRESOLVED = "UNRESOLVED"

# signalClass
INELIGIBLE_SIGNAL = "INELIGIBLE_SIGNAL"
DIAGNOSTIC_ONLY = "DIAGNOSTIC_ONLY"
CALIBRATION_ELIGIBLE = "CALIBRATION_ELIGIBLE"

# plausibilityStatus
IN_ENVELOPE = "IN_ENVELOPE"
PLAUSIBILITY_HOLD = "PLAUSIBILITY_HOLD"
REJECTED_NON_POSITIVE = "REJECTED_NON_POSITIVE"

# selectedPotencySource
THEORETICAL_OR_CONFIGURED = "THEORETICAL_OR_CONFIGURED"
LEARNED = "LEARNED"

_CHEMICAL_FACTOR = {
    "NA2CO3": NA2CO3_FACTOR,
    "NAHCO3": NAHCO3_FACTOR,
    "NAOH": NAOH_FACTOR,
}


# ---------------------------------------------------------------------------
# A34 — theoretical potency
# ---------------------------------------------------------------------------


def theoretical(cfg) -> Any:
    """`P_expected = factor · C / V` — `ALK-014`.

    Returns `(value, codes)`. A configured `selectedPotencyDkhPerMl` is used as
    given: the canon's own worked example configures 0.0693 dKH/mL directly, and
    a configured figure is a statement about this keeper's solution rather than
    an approximation of one.

    `V` unknown ⇒ every volume-dependent calculation refuses (Part II §70.3).
    `C` unknown ⇒ `POTENCY_THEORETICAL_INPUTS_UNAVAILABLE`.
    """
    configured = cfg.num("selectedPotencyDkhPerMl")
    if configured is not None:
        return configured, []

    chemical = cfg.get("chemical")
    concentration = cfg.num("stockConcentrationGPerL")
    volume = cfg.num("netVolumeL")
    manufacturer = cfg.num("manufacturerPotencyDkhPerMl")

    if chemical == "COMMERCIAL" and manufacturer is not None:
        return manufacturer, []
    factor = _CHEMICAL_FACTOR.get(str(chemical).upper()) if chemical else None
    missing = [
        name
        for name, value in (
            ("chemical", factor),
            ("stockConcentrationGPerL", concentration),
            ("netVolumeL", volume),
        )
        if value is None
    ]
    if missing:
        return None, [("POTENCY_THEORETICAL_INPUTS_UNAVAILABLE", {"missingFields": missing})]
    return factor * concentration / volume, []


# ---------------------------------------------------------------------------
# A35 / A36 — one potency observation
# ---------------------------------------------------------------------------


@dataclass
class Observation:
    observation_id: str
    source_intervention_id: str
    at: str
    delta_dose: Optional[float] = None
    delta_slope: Optional[float] = None
    sigma_delta_slope: Optional[float] = None
    snr: Optional[float] = None
    signal_class: str = INELIGIBLE_SIGNAL
    observed_potency: Optional[float] = None
    theoretical_at_observation: Optional[float] = None
    plausibility: str = PLAUSIBILITY_HOLD
    eligibility: str = "INELIGIBLE"
    ineligibility_reasons: List[str] = field(default_factory=list)
    confounders: List[str] = field(default_factory=list)
    pre_slope: Optional[float] = None
    post_slope: Optional[float] = None
    sigma_pre: Optional[float] = None
    sigma_post: Optional[float] = None

    def payload(self) -> Dict[str, Any]:
        return {
            "observationId": self.observation_id,
            "sourceInterventionId": self.source_intervention_id,
            "preSlopeDkhPerDay": self.pre_slope,
            "postSlopeDkhPerDay": self.post_slope,
            "sigmaPreDkhPerDay": self.sigma_pre,
            "sigmaPostDkhPerDay": self.sigma_post,
            "deltaDoseMlPerDay": self.delta_dose,
            "deltaSlopeDkhPerDay": self.delta_slope,
            "sigmaDeltaSlopeDkhPerDay": self.sigma_delta_slope,
            "snrPotency": self.snr,
            "signalClass": self.signal_class,
            "observedPotencyDkhPerMl": self.observed_potency,
            "theoreticalPotencyAtObservation": self.theoretical_at_observation,
            "plausibilityStatus": self.plausibility,
            "eligibility": self.eligibility,
            "ineligibilityReasons": list(self.ineligibility_reasons),
            "confounders": list(self.confounders),
        }


def observe(intervention, p_expected: Optional[float]) -> Observation:
    """One potency observation from one dose change — `ALK-016`, `ALK-017`.

    All nine preconditions of `A35` must hold. The ones this ledger can carry are
    checked here and each failure is **named**; the context ones (same product,
    same batch, same channel) are enforced by the pool, which admits only
    observations sharing an exact solution and delivery context.

    An ineligible observation is **kept**, not discarded: `ALK-025` retains every
    observation forever, including ineligible and `PLAUSIBILITY_HOLD` ones, and
    keeps them attached to their original context across context boundaries.
    """
    o = Observation(
        observation_id=f"POB-{intervention.intervention_id}",
        source_intervention_id=intervention.intervention_id,
        at=intervention.at.text,
        theoretical_at_observation=p_expected,
        confounders=list(intervention.confounders),
    )
    o.delta_dose = intervention.delta_dose
    o.pre_slope = intervention.pre.slope
    o.post_slope = intervention.post.slope
    o.sigma_pre = intervention.pre.sigma
    o.sigma_post = intervention.post.sigma

    reasons: List[str] = []

    # 7 — the intervention must not have been interrupted.
    if intervention.interrupted_by:
        reasons.append("POTENCY_INELIGIBLE_INTERRUPTED")
    # 8 — no hard confounder anywhere between the pre window's start and the
    # post window's end. A recorded consumption-context change is one of them.
    for c in intervention.confounders:
        if c == "CONSUMPTION_CONTEXT_CHANGE":
            reasons.append("POTENCY_INELIGIBLE_CONSUMPTION_CONTEXT_CHANGE")
        elif c == "UNKNOWN_CORRECTION":
            reasons.append("POTENCY_INELIGIBLE_CORRECTION_IN_WINDOW")
    # 5, 6 — minimum evidence per side. The Day-0 anchor is not a post cluster,
    # which `intervention.build` has already excluded.
    for side, window in (("pre", intervention.pre), ("post", intervention.post)):
        if (
            window.n < POTENCY_MIN_SIDE_CLUSTERS
            or window.span_days < POTENCY_MIN_SIDE_SPAN_DAYS
            or window.sigma is None
        ):
            reasons.append("POTENCY_INELIGIBLE_EVIDENCE_PER_SIDE")
            break
    # M-9 — the pre/post programmed dose states must be confidently known.
    if o.delta_dose is None or o.delta_dose == 0.0:
        reasons.append("POTENCY_PROGRAMMED_DOSE_STATE_UNCONFIRMED")
    if intervention.effective_at_confidence != "EXACT":
        reasons.append("POTENCY_PROGRAMMED_DOSE_STATE_UNCONFIRMED")

    o.ineligibility_reasons = _unique(reasons)
    if o.ineligibility_reasons:
        return o

    o.delta_slope = o.post_slope - o.pre_slope
    o.sigma_delta_slope = ((o.sigma_pre ** 2) + (o.sigma_post ** 2)) ** 0.5
    if o.sigma_delta_slope <= 0:
        # `SNR_potency` requires a positive sigma. Without one there is no signal
        # to classify, and inventing a very large SNR from a zero denominator is
        # the opposite of what the rule is for.
        o.ineligibility_reasons = ["POTENCY_SIGNAL_INELIGIBLE"]
        return o

    o.snr = abs(o.delta_slope) / o.sigma_delta_slope
    o.observed_potency = o.delta_slope / o.delta_dose

    # A36 — plausibility comes before the signal class decides anything, because
    # an implausible value must not enter the pool however strong its signal.
    if o.observed_potency <= 0:
        o.plausibility = REJECTED_NON_POSITIVE
    elif p_expected is None:
        o.plausibility = PLAUSIBILITY_HOLD
    elif (
        POTENCY_ENVELOPE_LOW * p_expected
        <= o.observed_potency
        <= POTENCY_ENVELOPE_HIGH * p_expected
    ):
        o.plausibility = IN_ENVELOPE
    else:
        o.plausibility = PLAUSIBILITY_HOLD

    if o.snr < POTENCY_SNR_DIAGNOSTIC:
        o.signal_class = INELIGIBLE_SIGNAL
    elif o.snr < POTENCY_SNR_CALIBRATION:
        o.signal_class = DIAGNOSTIC_ONLY
    else:
        o.signal_class = CALIBRATION_ELIGIBLE

    o.eligibility = (
        "ELIGIBLE"
        if o.signal_class == CALIBRATION_ELIGIBLE and o.plausibility == IN_ENVELOPE
        else "INELIGIBLE"
    )
    return o


def _unique(items: List[str]) -> List[str]:
    seen, out = set(), []
    for i in items:
        if i not in seen:
            seen.add(i)
            out.append(i)
    return out


# ---------------------------------------------------------------------------
# A37 — pooling and dispersion
# ---------------------------------------------------------------------------


@dataclass
class Pool:
    members: List[Observation]
    learned: Optional[float] = None
    mad: Optional[float] = None
    r_disp: Optional[float] = None
    span_days: float = 0.0
    interventions: int = 0
    distinct_magnitudes: int = 0


def pool(observations: List[Observation]) -> Pool:
    """`P_learned = median(P_i)` over the eligible observations — `ALK-POTENCY-POOL-001`.

    **No quality adjective, recency weighting or hidden weight enters this
    calculation.** Quality was handled before pooling, by deterministic
    eligibility. A pool that down-weights an observation it already admitted is
    grading its own evidence twice.
    """
    members = [
        o
        for o in observations
        if o.signal_class == CALIBRATION_ELIGIBLE and o.plausibility == IN_ENVELOPE
    ]
    p = Pool(members=members)
    if not members:
        return p
    values = [o.observed_potency for o in members]
    p.learned = median(values)
    p.mad = median([abs(v - p.learned) for v in values])
    if p.learned > 0:
        p.r_disp = MAD_SCALE * p.mad / p.learned
    times = sorted(o.at for o in members)
    p.span_days = _span_days(times)
    p.interventions = len({o.source_intervention_id for o in members})
    p.distinct_magnitudes = len({round(abs(o.delta_dose), 12) for o in members})
    return p


def _span_days(iso_times: List[str]) -> float:
    from .kernel import parse_instant

    first, last = parse_instant(iso_times[0]), parse_instant(iso_times[-1])
    if first is None or last is None:
        return 0.0
    return elapsed_days(first, last)


# ---------------------------------------------------------------------------
# A38 — the confidence ladder
# ---------------------------------------------------------------------------


@dataclass
class Selection:
    confidence: str
    selected: Optional[float]
    source: str
    codes: List[Any] = field(default_factory=list)


def confidence_and_selection(
    observations: List[Observation],
    p: Pool,
    p_expected: Optional[float],
    increment: Optional[float],
) -> Selection:
    """The ladder, highest first — `ALK-POTENCY-CONFIDENCE-001`.

    Only `CALIBRATED` and `STRONGLY_CALIBRATED` move `selectedPotency` to the
    learned value, and only for current and future calculations. Every state
    below them keeps the theoretical or configured figure: the learner's job is
    to earn the right to replace it, not to assume it.

    **`REASSESSING` detection is `NOT_RUN`**, and that is a decided state rather
    than an omission. `ALK-POTENCY-CONFIDENCE-001` defines entry to `REASSESSING`
    against "the last accepted calibration snapshot", which
    `OI-POTENCYSNAP-001` records as an object canon never defines, and the exit
    criterion is not defined either, which `OI-POTENCYSTATE-001` records as
    making the state absorbing. Implementing entry without exit would build a
    state the engine can enter and never leave. The engine reports the refusal
    instead.
    """
    codes: List[Any] = []
    eligible = p.members
    diagnostic_or_better = [
        o for o in observations if o.snr is not None and o.snr >= POTENCY_SNR_DIAGNOSTIC
    ]

    codes.append(
        (
            "POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE",
            {"openIssue": "OI-POTENCYSNAP-001", "affectedOutputs": ["potencyConfidence"]},
        )
    )

    if (
        len(eligible) >= POTENCY_STRONG_N
        and p.interventions >= 3
        and _distinct_magnitudes(eligible, increment) >= 2
        and p.span_days >= POTENCY_STRONG_SPAN_DAYS
        and p.r_disp is not None
        and p.r_disp <= POTENCY_STRONG_RDISP
    ):
        return _promoted(STRONGLY_CALIBRATED, p, codes, LEARNED, p.learned)

    if (
        len(eligible) >= POTENCY_CALIBRATED_N
        and p.interventions >= 2
        and p.span_days >= POTENCY_CALIBRATED_SPAN_DAYS
        and p.r_disp is not None
        and p.r_disp <= POTENCY_CALIBRATED_RDISP
    ):
        return _promoted(CALIBRATED, p, codes, LEARNED, p.learned)

    if len(eligible) >= 2 and p.interventions >= 2:
        return _promoted(PROVISIONAL, p, codes, THEORETICAL_OR_CONFIGURED, p_expected)

    if diagnostic_or_better and len(eligible) < 2:
        return _promoted(EXPLORATORY, p, codes, THEORETICAL_OR_CONFIGURED, p_expected)

    if not diagnostic_or_better:
        return Selection(THEORETICAL_ONLY, p_expected, THEORETICAL_OR_CONFIGURED, codes)

    # `A38`'s own "none of the above". `OI-POTENCYSTATE-001` records that the
    # ladder's conditions do not partition every reachable combination; the
    # engine names the gap rather than rounding the state to a neighbour.
    codes.append(
        (
            "POTENCY_CONFIDENCE_STATE_UNDETERMINED",
            {
                "n": len(eligible),
                "interventions": p.interventions,
                "spanDays": p.span_days,
                "RDisp_P": p.r_disp,
                "openIssue": "OI-POTENCYSTATE-001",
                "affectedOutputs": ["potencyConfidence"],
            },
        )
    )
    return Selection(UNRESOLVED, p_expected, THEORETICAL_OR_CONFIGURED, codes)


def _distinct_magnitudes(members: List[Observation], increment: Optional[float]) -> int:
    """Distinct absolute dose-change magnitudes differing by at least one increment.

    Without a configured increment there is no unit in which "differing by at
    least one" can be evaluated, so the engine counts exact distinct magnitudes
    — the strictest available reading, which can only withhold a promotion.
    """
    magnitudes = sorted({abs(o.delta_dose) for o in members if o.delta_dose is not None})
    if not magnitudes:
        return 0
    if increment is None or increment <= 0:
        return len(magnitudes)
    distinct = [magnitudes[0]]
    for m in magnitudes[1:]:
        if m - distinct[-1] >= increment:
            distinct.append(m)
    return len(distinct)


def _promoted(state, p: Pool, codes, source, value) -> Selection:
    codes = list(codes)
    codes.append(
        (
            "POTENCY_CONFIDENCE_PROMOTED",
            {
                "from": THEORETICAL_ONLY,
                "to": state,
                "n": len(p.members),
                "interventions": p.interventions,
                "spanDays": p.span_days,
                "RDisp_P": p.r_disp,
            },
        )
    )
    return Selection(state, value, source, codes)


# ---------------------------------------------------------------------------
# The gate
# ---------------------------------------------------------------------------


@dataclass
class Result:
    """What the potency layer contributes to the `EngineResult`."""

    selected: Optional[float]
    source: str
    confidence: str
    learned: Optional[float]
    theoretical: Optional[float]
    r_disp: Optional[float]
    observations: List[Observation]
    gated: bool
    codes: List[Any] = field(default_factory=list)

    def projection(self) -> Dict[str, Any]:
        return {
            "selectedPotencyDkhPerMl": self.selected if self.selected is not None else "UNKNOWN",
            "selectedPotencySource": self.source,
            "theoreticalPotencyDkhPerMl": (
                self.theoretical if self.theoretical is not None else "UNKNOWN"
            ),
            "learnedPotencyDkhPerMl": self.learned if self.learned is not None else "UNKNOWN",
            "potencyConfidence": self.confidence,
            "rDispP": self.r_disp if self.r_disp is not None else "NOT_RUN",
            "potencyLearningState": "CAPABILITY_GATED" if self.gated else "ACTIVE",
            "potencyObservations": [o.payload() for o in self.observations],
        }


def run(cfg, interventions, gated: bool) -> Result:
    """The potency layer, gated or not.

    While gated the learner still **observes**: every dose change in the ledger
    produces an observation, with its SNR, its signal class and its
    plausibility, and every one of them is reported. What the gate withholds is
    the *promotion* — `selectedPotency` stays theoretical or configured whatever
    the pool says.

    That is deliberate, and it is the difference between a gate and a switch. A
    gate that also stopped observing would mean the day the owner opens it, the
    learner starts from nothing; a gate that observes means it starts from
    everything the ledger already holds, and the owner can see what it *would*
    have concluded before trusting it with a dose.
    """
    p_expected, codes = theoretical(cfg)
    observations = [observe(iv, p_expected) for iv in interventions]
    the_pool = pool(observations)
    selection = confidence_and_selection(
        observations,
        the_pool,
        p_expected,
        cfg.num("recommendationPrecisionMlPerDay"),
    )
    codes = list(codes) + list(selection.codes)

    for o in observations:
        if o.ineligibility_reasons:
            for reason in o.ineligibility_reasons:
                codes.append((reason, {"observationId": o.observation_id,
                                       "side": "pre/post"}))
            continue
        codes.append(
            (
                "POTENCY_OBSERVATION_RECORDED",
                {
                    "observationId": o.observation_id,
                    "P_i": o.observed_potency,
                    "deltaD": o.delta_dose,
                    "deltaS": o.delta_slope,
                    "snr": o.snr,
                    "signalClass": o.signal_class,
                },
            )
        )
        codes.append(
            (
                {
                    INELIGIBLE_SIGNAL: "POTENCY_SIGNAL_INELIGIBLE",
                    DIAGNOSTIC_ONLY: "POTENCY_SIGNAL_DIAGNOSTIC_ONLY",
                    CALIBRATION_ELIGIBLE: "POTENCY_SIGNAL_CALIBRATION_ELIGIBLE",
                }[o.signal_class],
                {"snr": o.snr, "threshold": POTENCY_SNR_DIAGNOSTIC,
                 "minAttributableDeltaD": o.delta_dose},
            )
        )
        if o.plausibility == PLAUSIBILITY_HOLD:
            codes.append(
                (
                    "POTENCY_PLAUSIBILITY_HOLD",
                    {
                        "P_i": o.observed_potency,
                        "P_expected": p_expected,
                        "envelopeLow": POTENCY_ENVELOPE_LOW,
                        "envelopeHigh": POTENCY_ENVELOPE_HIGH,
                    },
                )
            )
        elif o.plausibility == REJECTED_NON_POSITIVE:
            codes.append(("POTENCY_REJECTED_NON_POSITIVE", {"P_i": o.observed_potency}))

    codes.extend(_context_discrepancy(observations, p_expected))

    if gated:
        # The gate. `selectedPotency` never moves off the configured figure, and
        # the confidence the pool earned is reported beside it rather than acted
        # on -- so the owner can see what the learner would have done.
        return Result(
            selected=p_expected,
            source=THEORETICAL_OR_CONFIGURED,
            confidence=selection.confidence,
            learned=the_pool.learned,
            theoretical=p_expected,
            r_disp=the_pool.r_disp,
            observations=observations,
            gated=True,
            codes=codes,
        )

    return Result(
        selected=selection.selected,
        source=selection.source,
        confidence=selection.confidence,
        learned=the_pool.learned,
        theoretical=p_expected,
        r_disp=the_pool.r_disp,
        observations=observations,
        gated=False,
        codes=codes,
    )


def _context_discrepancy(observations: List[Observation], p_expected) -> List[Any]:
    """Two most recent calibration-grade observations outside the envelope, same side.

    `ALK-POTENCY-PLAUSIBILITY-001`. The engine surfaces it and asks for
    verification of the product, the recipe, the net volume and the pump
    calibration. It does **not** silently recalibrate the existing context, and
    it does not adopt a potency outside the envelope: the canon says that needs
    an explicit revision before automatic dosing may use it.
    """
    if p_expected is None:
        return []
    grade = [
        o
        for o in observations
        if o.signal_class == CALIBRATION_ELIGIBLE and o.plausibility == PLAUSIBILITY_HOLD
    ]
    if len(grade) < 2:
        return []
    last_two = sorted(grade, key=lambda o: o.at)[-2:]
    directions = {
        1 if o.observed_potency > POTENCY_ENVELOPE_HIGH * p_expected else -1
        for o in last_two
    }
    if len(directions) != 1:
        return []
    return [
        (
            "POTENCY_CONTEXT_DISCREPANCY",
            {
                "observationIds": [o.observation_id for o in last_two],
                "direction": "ABOVE" if directions == {1} else "BELOW",
                "P_expected": p_expected,
            },
        )
    ]
