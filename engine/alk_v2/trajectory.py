"""L4 — trajectory: trend, uncertainty, support, movement evidence, rapid, forecast.

The layer boundary this module exists to protect is one-way. `S_supported` may
be derived from `S_observed`; **nothing in Layer 2 may be derived from
`S_supported`** (`ALK-CONSUMPTION-ESTIMATE-001`, `ALK-FORECAST-SLOPE-001`).
`supported_slope` is three lines and lives in its own function for exactly that
reason: the prohibition is easier to see than to remember.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from . import kernel
from .constants import (
    ALK_SLOPE_SUPPORT_K,
    MAD_SCALE,
    MIN_ORDINARY_CLUSTERS,
    MIN_ORDINARY_SPAN_DAYS,
    RAPID_MIN_ELAPSED_HOURS,
    RAPID_THRESHOLD,
    SIGMA_ALK_BASE,
)
from .kernel import elapsed_days, median, sign, theil_sen, theil_sen_intercept
from .observation import ANOMALOUS, Episode

THEIL_SEN = "THEIL_SEN"
TWO_POINT = "TWO_POINT"

# MovementEvidence — closed vocabulary
INSUFFICIENT = "INSUFFICIENT"
PROVISIONAL = "PROVISIONAL"
SUFFICIENT = "SUFFICIENT"
HIGH_CONFIDENCE = "HIGH_CONFIDENCE"
CONFOUNDED = "CONFOUNDED"
EVIDENCE_ANOMALOUS = "ANOMALOUS"
UNCERTAINTY_LIMITED = "UNCERTAINTY_LIMITED"

# Trajectory — closed vocabulary
RISING = "RISING"
FALLING = "FALLING"
STABLE = "STABLE"
UNCERTAIN = "UNCERTAIN"


@dataclass
class Observed:
    """Layer 2. The robust central estimate, never uncertainty-shrunk."""

    estimator: str
    slope: float
    intercept: float
    residuals: List[float]
    pairwise_slopes: List[float]
    times_days: List[float]
    values_dkh: List[float]
    mad_dkh: float
    sigma_resid: float
    sigma_point: float
    t_bar: float
    sxx: float
    sigma_s: float
    n: int
    span_days: float
    codes: List[str] = field(default_factory=list)


def trend(eps: List[Episode]) -> Optional[Observed]:
    """Theil-Sen slope, intercept and residuals over the independent episodes.

    The local time origin is `t = 0` at the first included episode (`A8`), which
    keeps `Sxx` and the intercept in the units the goldens state them in.
    Ordinary least squares may be computed as a diagnostic but is never the
    control slope (`ALK-009`), so it is not computed here at all.

    Returns `None` where fewer than two episodes exist; `n = 2` produces the
    two-point estimator, which only a rapid or explicitly permitted path may use.
    """
    ordered = sorted(eps, key=lambda e: e.at.epoch_seconds)
    if len(ordered) < 2:
        return None
    origin = ordered[0].at
    times = [elapsed_days(origin, e.at) for e in ordered]
    values = [e.value_dkh for e in ordered]
    points = list(zip(times, values))
    span = times[-1] - times[0]

    if len(ordered) == 2:
        slope = (values[1] - values[0]) / (times[1] - times[0])
        pairwise = [slope]
        intercept = values[0] - slope * times[0]
        residuals = [0.0, 0.0]
        estimator = TWO_POINT
    else:
        slope, pairwise = theil_sen(points)
        intercept = theil_sen_intercept(points, slope)
        residuals = [a - (slope * t + intercept) for t, a in points]
        estimator = THEIL_SEN

    return Observed(
        estimator=estimator,
        slope=slope,
        intercept=intercept,
        residuals=residuals,
        pairwise_slopes=pairwise,
        mad_dkh=0.0,
        times_days=times,
        values_dkh=values,
        sigma_resid=0.0,
        sigma_point=0.0,
        t_bar=0.0,
        sxx=0.0,
        sigma_s=0.0,
        n=len(ordered),
        span_days=span,
    )


def uncertainty(obs: Observed, eps: List[Episode]) -> Observed:
    """`ALK-SLOPE-UNCERTAINTY-001`. Fills `sigma_*`, `t_bar` and `Sxx` in place.

    Three or more episodes:

        sigma_resid = 1.4826 * median(|r_i|)
        sigma_point = max(0.10, sigma_resid)          <- the Alk analytical floor
        Sxx         = sum (t_i - t_bar)^2             [day^2]
        sigma_S     = sigma_point / sqrt(Sxx)

    Exactly two: `sqrt(sigma_1^2 + sigma_2^2) / delta_t`, an engineering
    controller-uncertainty proxy and **not** a Theil-Sen sampling standard error.

    All residuals zero is the interesting case rather than a degenerate one:
    `sigma_resid = 0`, the 0.10 floor governs, and perfectly linear data still
    produces non-trivial uncertainty. That is what makes `WG-ALK-001` and
    `WG-ALK-062` non-trivial.

    Pairwise-slope MAD is diagnostic and is deliberately **not** combined into
    `sigma_S` (Part II §19.5). `Sxx` is the form `WG-ALK-062` distinguishes from
    the forbidden endpoint-only one.
    """
    ordered = sorted(eps, key=lambda e: e.at.epoch_seconds)
    if obs.n == 2:
        s1 = ordered[0].sigma_dkh
        s2 = ordered[1].sigma_dkh
        delta_t = obs.times_days[1] - obs.times_days[0]
        obs.sigma_resid = 0.0
        obs.sigma_point = SIGMA_ALK_BASE
        obs.t_bar, obs.sxx = kernel.sxx(obs.times_days)
        obs.sigma_s = math.sqrt(s1 * s1 + s2 * s2) / delta_t
        obs.codes.append("UNCERTAINTY_TWO_POINT_BASIS")
        return obs

    obs.mad_dkh = median([abs(r) for r in obs.residuals])
    obs.sigma_resid = MAD_SCALE * obs.mad_dkh
    obs.sigma_point = max(SIGMA_ALK_BASE, obs.sigma_resid)
    obs.t_bar, obs.sxx = kernel.sxx(obs.times_days)
    if obs.sxx <= 0:
        obs.sigma_s = float("inf")
        obs.codes.append("UNCERTAINTY_SXX_NOT_POSITIVE")
        return obs
    obs.sigma_s = obs.sigma_point / math.sqrt(obs.sxx)
    if obs.sigma_resid < SIGMA_ALK_BASE:
        obs.codes.append("UNCERTAINTY_FLOOR_APPLIED")
    else:
        obs.codes.append("UNCERTAINTY_RESIDUAL_DOMINATES")
    obs.codes.append("UNCERTAINTY_PAIRWISE_MAD_DIAGNOSTIC_ONLY")
    return obs


@dataclass
class Supported:
    """Layer 3. Consumed by the maintenance sizing and by nothing else."""

    slope: float
    support_k: float
    subtraction: float
    limited_by_uncertainty: bool


def supported_slope(observed_slope: float, sigma_s: float) -> Supported:
    """`sign(S) * max(0, |S| - 1.28 sigma_S)` — `ALK-SUPPORTED-SLOPE-001`.

    Deliberately biased toward zero. It sizes the maintenance recommendation and
    nothing else: never substituted into `C = P·D - S`, never used for a
    boundary forecast, never used as a position, and never multiplied by a
    confidence label (`X-INV-010`).

    `S_supported = 0` is a valid, meaningful result and not a failure.
    """
    subtraction = ALK_SLOPE_SUPPORT_K * sigma_s
    magnitude = max(0.0, abs(observed_slope) - subtraction)
    slope = sign(observed_slope) * magnitude
    return Supported(
        slope=slope,
        support_k=ALK_SLOPE_SUPPORT_K,
        subtraction=subtraction,
        limited_by_uncertainty=(magnitude == 0.0 and observed_slope != 0.0),
    )


@dataclass
class Evidence:
    movement: str
    trajectory: str
    codes: List[str] = field(default_factory=list)
    #: Payload for the insufficiency codes, so the refusal names what is short.
    have_clusters: int = 0
    have_span_days: float = 0.0


def movement_evidence(
    n: int,
    span_days: float,
    hard_confounders: List[str],
    latest_anomalous: bool,
    historical_anomalous: bool,
    observed_slope: Optional[float],
    supported: Optional[Supported],
    rapid_confirmed: bool,
) -> Evidence:
    """`ALK-MOVEMENT-001` / `ALK-STABLE-001`, in the order `A11` states.

    The order is normative, not stylistic. Step 3 must never resolve to
    `STABLE` -- *"do not call the tank stable merely because movement cannot yet
    be established"* -- and step 7's exact-zero condition is normative too:
    `ALK-012`'s illustrative examples are wrong and must not be used to justify
    a tolerance band (`OI-STABLE-001`).
    """
    ev = Evidence(movement=INSUFFICIENT, trajectory=UNCERTAIN)
    ev.have_clusters = n
    ev.have_span_days = span_days

    if hard_confounders:
        ev.movement, ev.trajectory = CONFOUNDED, UNCERTAIN
        ev.codes.append("EVIDENCE_CONFOUNDED_HARD")
        return ev
    if latest_anomalous or historical_anomalous:
        # An unresolved anomaly blocks ordinary inference rather than letting the
        # engine choose between two slopes. The two codes stay distinct because
        # the latest anomaly and a historical one are different facts, and
        # `OI-ANOMCLUSTER-001` is open on exactly what a *historical* anomalous
        # cluster contributes. Folding them together would hide the open item.
        ev.movement, ev.trajectory = EVIDENCE_ANOMALOUS, UNCERTAIN
        ev.codes.append(
            "EVIDENCE_ANOMALOUS_LATEST_CLUSTER"
            if latest_anomalous
            else "EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER"
        )
        return ev
    if n < MIN_ORDINARY_CLUSTERS or span_days < MIN_ORDINARY_SPAN_DAYS:
        if rapid_confirmed:
            ev.movement = PROVISIONAL
            ev.trajectory = (
                FALLING
                if (observed_slope or 0.0) < 0
                else RISING
                if (observed_slope or 0.0) > 0
                else UNCERTAIN
            )
            ev.codes.append("EVIDENCE_PROVISIONAL_TWO_POINT")
            return ev
        ev.movement, ev.trajectory = INSUFFICIENT, UNCERTAIN
        if n < MIN_ORDINARY_CLUSTERS:
            ev.codes.append("EVIDENCE_INSUFFICIENT_CLUSTERS")
        if span_days < MIN_ORDINARY_SPAN_DAYS:
            ev.codes.append("EVIDENCE_INSUFFICIENT_SPAN")
        return ev

    assert supported is not None and observed_slope is not None
    ev.movement = SUFFICIENT
    ev.codes.append("EVIDENCE_SUFFICIENT")
    if supported.slope < 0:
        ev.trajectory = FALLING
        ev.codes.append("TRAJECTORY_FALLING")
    elif supported.slope > 0:
        ev.trajectory = RISING
        ev.codes.append("TRAJECTORY_RISING")
    elif observed_slope != 0:
        ev.trajectory = FALLING if observed_slope < 0 else RISING
        ev.movement = UNCERTAINTY_LIMITED
        ev.codes.append("TRAJECTORY_UNCERTAINTY_LIMITED")
    else:
        ev.trajectory = STABLE
        ev.codes.append("TRAJECTORY_STABLE")
    return ev


@dataclass
class Rapid:
    confirmed: bool
    basis: str = "LATEST_INDEPENDENT_PAIR"
    pair_slope: Optional[float] = None
    pair_span_days: Optional[float] = None
    failed_conditions: List[str] = field(default_factory=list)


def rapid(all_eps: List[Episode], known_events_explain: bool) -> Rapid:
    """`ALK-RAPID-001`, on the latest independent pair (`ALK-RAPID-BASIS-001`).

    The basis is the latest episode and the most recent **candidate** at least
    24 h before it -- not only accepted episodes, because `ALK-008` grants a
    non-accepted episode the right to contribute to the rapid rule.

    `S_pair` is the rapid **test statistic**. It is never written to
    `S_observed`, never to the consumption input, and never to the forecast
    slope: `rapidConfirmed` changes pathway, cadence and cap eligibility only.

    One of `ALK-013`'s two disjuncts is not implemented, and deliberately.
    *"latest episode is internally consistent (spread <= 0.20) OR has been
    repeated/confirmed"*: under owner decision 28 every repeat inside 30 minutes
    is already **in** the episode, so "has been repeated/confirmed" no longer
    names a distinct state and its meaning is unstated. That is
    `OI-RAPIDCONFIRMDISJUNCT-001`, recorded open by `A12` and not decided here.
    This implementation requires the first disjunct, which is the conservative
    reading: it can only ever withhold a rapid confirmation, never invent one.
    """
    ordered = sorted(all_eps, key=lambda e: e.at.epoch_seconds)
    r = Rapid(confirmed=False)
    if len(ordered) < 2:
        r.failed_conditions.append("fewer than two independent testing episodes")
        return r
    latest = ordered[-1]
    spacing = RAPID_MIN_ELAPSED_HOURS / 24.0
    prior = None
    for e in reversed(ordered[:-1]):
        if elapsed_days(e.at, latest.at) >= spacing:
            prior = e
            break
    if prior is None:
        r.failed_conditions.append("no candidate episode at least 24 h before the latest")
        return r
    span = elapsed_days(prior.at, latest.at)
    r.pair_span_days = span
    r.pair_slope = (latest.value_dkh - prior.value_dkh) / span
    if abs(r.pair_slope) < RAPID_THRESHOLD:
        r.failed_conditions.append("pair slope below the 0.30 dKH/day threshold")
        return r
    if latest.status == ANOMALOUS:
        r.failed_conditions.append("latest episode is not internally consistent")
        return r
    if known_events_explain:
        r.failed_conditions.append("a known event already explains the movement")
        return r
    r.confirmed = True
    return r


# ---------------------------------------------------------------------------
# Forecast — A45
# ---------------------------------------------------------------------------

NOT_APPLICABLE = "NOT_APPLICABLE"


def forecast(a_now: Optional[float], observed_slope: Optional[float], cfg) -> Dict[str, Any]:
    """`ALK-FORECAST-SLOPE-001`. Uses `S_observed`, never `S_supported`.

    Support-shrinkage is biased toward zero for dosing conservatism and would
    make a dangerous trajectory look slower (`AUDIT-007`); `AD-RET-003` forbids
    the supported-slope forecast explicitly, at the value it would produce.

    The irrelevant direction is `NOT_APPLICABLE`, never a negative duration.
    """
    out = {
        "tRangeLowDays": NOT_APPLICABLE,
        "tRangeHighDays": NOT_APPLICABLE,
        "tOuterLowDays": NOT_APPLICABLE,
        "tOuterHighDays": NOT_APPLICABLE,
    }
    if a_now is None or observed_slope is None or observed_slope == 0.0:
        return out
    range_min = cfg.num("targetRangeMinDkh")
    range_max = cfg.num("targetRangeMaxDkh")
    outer_min = cfg.num("outerMinDkh")
    outer_max = cfg.num("outerMaxDkh")

    if observed_slope < 0:
        if range_min is not None:
            out["tRangeLowDays"] = (
                0.0 if a_now <= range_min else (a_now - range_min) / abs(observed_slope)
            )
        if outer_min is not None:
            out["tOuterLowDays"] = (
                0.0 if a_now <= outer_min else (a_now - outer_min) / abs(observed_slope)
            )
    else:
        if range_max is not None:
            out["tRangeHighDays"] = (
                0.0 if a_now >= range_max else (range_max - a_now) / observed_slope
            )
        if outer_max is not None:
            out["tOuterHighDays"] = (
                0.0 if a_now >= outer_max else (outer_max - a_now) / observed_slope
            )
    return out
