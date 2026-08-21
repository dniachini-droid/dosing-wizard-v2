"""Delivery basis, consumption, and the maintenance recommendation pipeline.

`A14`, `A15`, `A16`–`A23`, and `ALK-049`'s canonical order.

Seven dose/slope quantities are kept as seven named fields because
`ALK-VARIABLE-SEMANTICS-001` forbids collapsing them. `maintenanceEstimate` and
`continuousActionCandidate` may legitimately differ — 11.2 against 10.5 mL/day —
and a single field called `maintenanceDose` would make that difference
unsayable.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from . import kernel
from .constants import (
    ALK_RATE_RAIL,
    ALK_SLOPE_SUPPORT_K,
    EXCEPTIONAL_STEP_CAP,
    LIQUID_GUARD_FRACTION,
    MILLILITRES_PER_LITRE,
    ORDINARY_STEP_CAP,
    STEP_CAP_MEANINGFUL_MULTIPLE,
)
from .kernel import Computed, sign
from .observation import ABOVE_RANGE, BELOW_RANGE
from .trajectory import (
    CONFOUNDED,
    EVIDENCE_ANOMALOUS,
    FALLING,
    INSUFFICIENT,
    PROVISIONAL,
    RISING,
    STABLE,
    SUFFICIENT,
    UNCERTAINTY_LIMITED,
)

# Delivery bases
VERIFIED_DELIVERY = "VERIFIED_DELIVERY"
CONFIRMED_PROGRAMMED_SCHEDULE = "CONFIRMED_PROGRAMMED_SCHEDULE"
COMMAND_ONLY_UNCONFIRMED = "COMMAND_ONLY_UNCONFIRMED"

# ConsumptionEstimate.physicality
INTERPRETABLE = "INTERPRETABLE"
UNCERTAIN_NON_RESOLVABLE = "UNCERTAIN_NON_RESOLVABLE"
NON_PHYSICAL_OR_UNEXPLAINED_GAIN = "NON_PHYSICAL_OR_UNEXPLAINED_GAIN"

# RecommendationAction
NO_CHANGE = "NO_CHANGE"
HOLD_CURRENT_DOSE = "HOLD_CURRENT_DOSE"
SET_MAINTENANCE_DOSE = "SET_MAINTENANCE_DOSE"
INSUFFICIENT_DATA = "INSUFFICIENT_DATA"

# maintenanceActionStatus
ISSUED = "ISSUED"
HELD = "HELD"
WITHHELD_CAPABILITY = "WITHHELD_CAPABILITY"
WITHHELD_LIQUID_GUARD = "WITHHELD_LIQUID_GUARD"

# MaintenanceBalance
DEFICIT = "DEFICIT"
MATCHED = "MATCHED"
EXCESS = "EXCESS"
BALANCE_UNCERTAIN = "UNCERTAIN"
NO_SUPPORTED_MISMATCH = "NO_SUPPORTED_MISMATCH"

ORDINARY = "ORDINARY"
BASELINE_ESTABLISHMENT = "BASELINE_ESTABLISHMENT"


# ---------------------------------------------------------------------------
# A14 — delivery basis and effective dose
# ---------------------------------------------------------------------------


@dataclass
class Delivery:
    """`EffectiveDoseInterval`, for the analysed segment."""

    basis: Optional[str]
    d_current: Optional[float]
    d_history: Optional[float]
    mixed_interval: bool
    integration_status: str
    codes: List[str] = field(default_factory=list)


def delivery(led, segment_start, segment_end) -> Delivery:
    """The delivery basis and the two distinct dose rates over the segment.

    `D_current` is the rate the doser is configured to be delivering **now**.
    `D_history` is the time-weighted mean rate actually delivered **across the
    analysed interval**. Owner decision 20 renamed the second and separated them
    precisely because one name was doing both jobs; on a constant-dose segment
    they are numerically equal without being the same quantity, and substituting
    one for the other on a mixed interval mis-states consumption by the amount
    the dose moved.

    `COMMAND_ONLY_UNCONFIRMED` is never silently promoted
    (`SHARED-DELIVERY-BASIS-001`). Telemetry is optional: a confirmed programmed
    schedule is a first-class analytical basis (`WG-ALK-047`), so its absence
    must not disable the controller.
    """
    states = [e for e in led.of_kind("DOSE_STATE") if e.at is not None]
    changes = [e for e in led.of_kind("DOSE_CHANGE") if e.at is not None]
    anomalies = led.of_kind("DELIVERY_ANOMALY")

    if not states and not changes:
        return Delivery(None, None, None, False, "NOT_RUN",
                        ["CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE"])

    # The rate in force at the end of the segment.
    timeline: List[Tuple[float, float, str]] = []
    for e in states:
        rate = e.get("programmedDoseMlPerDay")
        if kernel.finite(rate):
            timeline.append((e.at.epoch_seconds, float(rate), str(e.get("deliveryBasis", ""))))
    for e in changes:
        rate = e.get("to")
        if kernel.finite(rate):
            timeline.append((e.at.epoch_seconds, float(rate), ""))
    if not timeline:
        return Delivery(None, None, None, False, "NOT_RUN",
                        ["CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE"])
    timeline.sort(key=lambda p: p[0])

    d_current = timeline[-1][1]
    declared = next((b for _, _, b in reversed(timeline) if b), "")
    basis = declared if declared in (VERIFIED_DELIVERY, CONFIRMED_PROGRAMMED_SCHEDULE) else None

    if anomalies:
        # A known outage means the programmed rate was not delivered across it.
        # Treating it as delivered is exactly what `AD-DEL-001` forbids.
        return Delivery(
            COMMAND_ONLY_UNCONFIRMED, d_current, None, False, "NOT_RUN",
            ["DELIVERY_ANOMALY_RECORDED", "DELIVERY_COMMAND_ONLY_UNCONFIRMED"],
        )

    if basis is None:
        # A programmed rate with a known effective start and no known outage is
        # a confirmed programmed schedule. `WG-ALK-047` makes that a first-class
        # basis rather than a degraded one.
        basis = CONFIRMED_PROGRAMMED_SCHEDULE

    inside = [p for p in timeline if segment_start is not None
              and p[0] > segment_start.epoch_seconds]
    if inside:
        # A dose change inside the analysed interval: the interval is mixed, and
        # the segment should have been cut at the boundary. Integration of a
        # mixed interval without an eligible basis is `NOT_RUN`, never a guess.
        return Delivery(basis, d_current, None, True, "NOT_RUN",
                        ["DELIVERY_MIXED_INTEGRATION_NOT_RUN"])

    code = (
        "DELIVERY_BASIS_VERIFIED"
        if basis == VERIFIED_DELIVERY
        else "DELIVERY_BASIS_PROGRAMMED_SCHEDULE"
    )
    return Delivery(basis, d_current, d_current, False, "RUN", [code])


# ---------------------------------------------------------------------------
# A15 — consumption
# ---------------------------------------------------------------------------


@dataclass
class Consumption:
    computed: Computed
    consumption_dkh_per_day: Optional[float] = None
    physicality: Optional[str] = None
    materiality_margin: Optional[float] = None
    codes: List[str] = field(default_factory=list)


def consumption(
    p_selected: Optional[float],
    d_history: Optional[float],
    observed_slope: Optional[float],
    sigma_s: Optional[float],
    evidence: str,
) -> Consumption:
    """`C = P_selected * D_history - S_observed` — `ALK-CONSUMPTION-ESTIMATE-001`.

    **`S_observed`, never `S_supported`.** Substituting the supported slope "to
    be conservative" would corrupt a physical mass balance with a controller
    bias, and is forbidden outright.

    The physicality partition is `ALK-NEGATIVE-MATERIALITY-001`, and the
    boundary is strict: at exactly `C + 1.28 sigma_S = 0` the result is **not**
    materially negative. `1.28` is `ALK_SLOPE_SUPPORT_K`; no `sigma_P` and no
    `sigma_D` exist or may be introduced.

    A negative `C` is never clamped to zero and then treated as a real
    zero-consumption target: both negative branches HOLD maintenance, and a held
    estimate is not a claim that biological consumption is zero.
    """
    c = Consumption(Computed.not_run())
    if p_selected is None:
        c.computed = Computed.not_run("CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE")
        c.codes = list(c.computed.codes)
        return c
    if d_history is None:
        c.computed = Computed.not_run("CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE")
        c.codes = list(c.computed.codes)
        return c
    if observed_slope is None or evidence in (INSUFFICIENT, CONFOUNDED, EVIDENCE_ANOMALOUS):
        c.computed = Computed.not_run("CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE")
        c.codes = list(c.computed.codes)
        return c

    estimate = p_selected * d_history - observed_slope
    margin = ALK_SLOPE_SUPPORT_K * (sigma_s or 0.0)
    c.consumption_dkh_per_day = estimate
    c.materiality_margin = margin
    if estimate >= 0:
        c.physicality = INTERPRETABLE
        c.codes.append("CONSUMPTION_ESTIMATED")
    elif estimate + margin < 0:
        c.physicality = NON_PHYSICAL_OR_UNEXPLAINED_GAIN
        c.codes.append("CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN")
    else:
        c.physicality = UNCERTAIN_NON_RESOLVABLE
        c.codes.append("CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED")
    c.computed = Computed.of(estimate)
    return c


# ---------------------------------------------------------------------------
# A16 – A23 — the maintenance pipeline
# ---------------------------------------------------------------------------


@dataclass
class Recommendation:
    action: str
    status: str
    current_dose: Optional[float] = None
    maintenance_estimate: Computed = field(default_factory=Computed.not_run)
    continuous_candidate: Computed = field(default_factory=Computed.not_run)
    recommended_dose: Computed = field(default_factory=Computed.withheld)
    delta_dose: Optional[float] = None
    delta_effect: Optional[float] = None
    predicted_post_slope: Optional[float] = None
    constraints: List[str] = field(default_factory=list)
    step_regime: Optional[str] = None
    cap_applied: str = "NONE"
    balance: str = BALANCE_UNCERTAIN
    codes: List[str] = field(default_factory=list)
    #: Populated only where the fixture corpus asserts them by name.
    ordinary_cap_ml_per_day: Optional[float] = None
    exceptional_cap_ml_per_day: Optional[float] = None
    raw_supported_delta_dose_ml_per_day: Optional[float] = None
    rail_as_dose_delta_ml_per_day: Optional[float] = None
    binding_constraint: Optional[str] = None


def _round_to(value: float, step: float, toward: float) -> float:
    """`ALK-ROUNDING-001` steps 1-4: nearest, tie toward `D_current`, then lower.

    Written on integers of `step` so that the tie test is exact. Deciding a tie
    with binary64 remainders makes `10.25 -> 10.2` depend on how `0.05` was
    represented, and `WG-ALK-005` pins both tie directions.
    """
    from decimal import Decimal

    v = Decimal(repr(value))
    s = Decimal(repr(step))
    lo = (v / s).to_integral_value(rounding="ROUND_FLOOR") * s
    hi = lo + s
    d_lo = v - lo
    d_hi = hi - v
    if d_lo < d_hi:
        return float(lo)
    if d_hi < d_lo:
        return float(hi)
    t = Decimal(repr(toward))
    if abs(lo - t) < abs(hi - t):
        return float(lo)
    if abs(hi - t) < abs(lo - t):
        return float(hi)
    return float(lo)


def recommend(
    *,
    evidence: str,
    trajectory: str,
    position: str,
    observed_slope: Optional[float],
    supported_slope: Optional[float],
    sigma_s: Optional[float],
    consumption_estimate: Consumption,
    p_selected: Optional[float],
    d_current: Optional[float],
    precision: Optional[float],
    net_volume_l: Optional[float],
    rapid_confirmed: bool,
    outer_bound_risk: bool,
    outer_bound_breached: bool,
) -> Recommendation:
    """`ALK-049`'s pipeline, P0 through P13, in order.

    A later stage never rewrites an earlier stage's output, and every HOLD is a
    full recommendation rather than a failure to answer
    (`OUTPUT_HOLD_IS_A_RECOMMENDATION`).

    Two paths in `ALK-049` are **out of scope for this build** and are not
    silently skipped: P2's safety-return lock and the return-plan offer belong to
    the safety and return-plan layers, which are unbuilt. Where the normal path
    would meet them, the engine emits the unbuilt state rather than a plausible
    number -- see `engine.py`.
    """
    r = Recommendation(action=INSUFFICIENT_DATA, status=HELD, current_dose=d_current)

    # P0 — evidence gate
    if evidence in (INSUFFICIENT,):
        r.action = INSUFFICIENT_DATA
        r.status = HELD
        r.balance = BALANCE_UNCERTAIN
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r
    if evidence == CONFOUNDED:
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r
    if evidence == EVIDENCE_ANOMALOUS:
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r

    assert supported_slope is not None and observed_slope is not None

    # P1 — uncertainty-limited gate
    if evidence == UNCERTAINTY_LIMITED:
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.balance = BALANCE_UNCERTAIN
        r.codes.append("MAINTENANCE_HOLD_UNCERTAINTY_LIMITED")
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r
    if supported_slope == 0.0 and observed_slope == 0.0:
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.balance = NO_SUPPORTED_MISMATCH
        r.codes.append("MAINTENANCE_HOLD_STABLE")
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r

    # P1b — position x trajectory gate (ALK-TOWARD-RANGE-HOLD-001).
    # The gate requires a *supported* trajectory. `UNCERTAINTY_LIMITED` never
    # reaches it: it was held above, by `ALK-011`.
    if (position == BELOW_RANGE and trajectory == RISING) or (
        position == ABOVE_RANGE and trajectory == FALLING
    ):
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.balance = BALANCE_UNCERTAIN
        r.codes.append("MAINTENANCE_HOLD_TOWARD_RANGE")
        r.recommended_dose = (
            Computed.of(d_current) if d_current is not None else Computed.withheld()
        )
        return r

    # P3 — potency validity. Without a potency there is no dKH -> mL conversion;
    # the required dKH movement may still be stated, so this withholds the
    # millilitres and nothing else.
    if p_selected is None or p_selected <= 0:
        r.action = HOLD_CURRENT_DOSE
        r.status = WITHHELD_CAPABILITY
        r.recommended_dose = Computed.withheld("POTENCY_REQUIRED")
        r.codes.append("POTENCY_REQUIRED")
        return r
    if d_current is None:
        # Owner decision 20: `WITHHELD`, never `NOT_RUN` and never `0`.
        r.action = HOLD_CURRENT_DOSE
        r.status = WITHHELD_CAPABILITY
        r.recommended_dose = Computed.withheld("CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE")
        return r

    # A16 — the two distinct quantities.
    if consumption_estimate.computed.ran and consumption_estimate.physicality == INTERPRETABLE:
        r.maintenance_estimate = Computed.of(
            consumption_estimate.consumption_dkh_per_day / p_selected
        )
    else:
        r.maintenance_estimate = Computed.not_run(
            *(consumption_estimate.codes or ["CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE"])
        )

    # P4 — continuous action candidate. Depends on `S_supported`, not on
    # `C_estimate`, so it still computes when the mass balance is broken.
    delta = -supported_slope / p_selected
    r.raw_supported_delta_dose_ml_per_day = delta
    candidate = d_current + delta
    r.continuous_candidate = Computed.of(candidate)

    # A negative or uninterpretable consumption cannot size a change.
    if (
        consumption_estimate.computed.ran
        and consumption_estimate.physicality != INTERPRETABLE
    ):
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.codes.append("MAINTENANCE_NO_ACTION_FROM_BROKEN_MASS_BALANCE")
        r.recommended_dose = Computed.of(d_current)
        r.balance = BALANCE_UNCERTAIN
        return r

    # P5 — physical rate rail (ALK-046). A ceiling, not a target, and
    # independently binding: a stronger solution reduces liquid volume but does
    # not make faster alkalinity movement safer.
    rail_delta = ALK_RATE_RAIL / p_selected
    r.rail_as_dose_delta_ml_per_day = rail_delta
    binding = None
    if abs(p_selected * delta) > ALK_RATE_RAIL:
        delta = sign(delta) * rail_delta
        r.constraints.append("RATE_RAIL")
        r.codes.append("SAFETY_RATE_RAIL_APPLIED")
        binding = "RATE_RAIL"

    # P6 — dose-step cap and baseline establishment (ALK-STEP-CAP-001).
    if precision is not None and d_current < STEP_CAP_MEANINGFUL_MULTIPLE * precision:
        # Not a rescue mode. Evidence, rail, clamp, potency and rounding all
        # remain active; only the percentage cap is inactive, because 25% of the
        # current dose is smaller than one recommendation-precision step.
        r.step_regime = BASELINE_ESTABLISHMENT
        r.constraints.append("BASELINE_ESTABLISHMENT")
        r.codes.append("MAINTENANCE_BASELINE_ESTABLISHMENT")
    else:
        r.step_regime = ORDINARY
        r.ordinary_cap_ml_per_day = ORDINARY_STEP_CAP * d_current
        r.exceptional_cap_ml_per_day = EXCEPTIONAL_STEP_CAP * d_current
        cap_fraction = ORDINARY_STEP_CAP
        # Being merely outside the preferred target range never unlocks 50%
        # (`AUDIT-008`): the target band and the outer operating bounds are
        # different concepts.
        if rapid_confirmed and (outer_bound_breached or outer_bound_risk):
            cap_fraction = EXCEPTIONAL_STEP_CAP
        cap = cap_fraction * d_current
        if abs(delta) > cap:
            delta = sign(delta) * cap
            if cap_fraction == EXCEPTIONAL_STEP_CAP:
                r.cap_applied = "EXCEPTIONAL_50"
                r.constraints.append("STEP_CAP_50")
                r.codes.append("MAINTENANCE_STEP_CAP_EXCEPTIONAL")
                binding = "EXCEPTIONAL_STEP_CAP_50"
            else:
                r.cap_applied = "ORDINARY_25"
                r.constraints.append("STEP_CAP_25")
                r.codes.append("MAINTENANCE_STEP_CAP_ORDINARY")
                binding = "ORDINARY_STEP_CAP_25"
        elif rapid_confirmed and cap_fraction == ORDINARY_STEP_CAP:
            r.codes.append("MAINTENANCE_STEP_CAP_50_NOT_UNLOCKED")
    r.binding_constraint = binding

    # P8 — non-negative clamp. Negative dosing is never recommended.
    feasible = d_current + delta
    if feasible < 0:
        feasible = 0.0
        r.constraints.append("NON_NEGATIVE_CLAMP")
        r.codes.append("MAINTENANCE_NON_NEGATIVE_CLAMP")

    # P9 — gross liquid-volume guard, on the continuous candidate.
    guard = (
        LIQUID_GUARD_FRACTION * MILLILITRES_PER_LITRE * net_volume_l
        if net_volume_l is not None
        else None
    )
    if guard is not None and feasible > guard:
        # Withheld, never capped to the guard value and never emitted equal to it.
        r.action = HOLD_CURRENT_DOSE
        r.status = WITHHELD_LIQUID_GUARD
        r.recommended_dose = Computed.withheld("MAINTENANCE_LIQUID_GUARD_EXCEEDED")
        r.codes.append("MAINTENANCE_LIQUID_GUARD_EXCEEDED")
        r.constraints.append("LIQUID_VOLUME_GUARD")
        return r

    # P11 — rounding for legibility. Three states, and only the middle refuses.
    if precision is None:
        final = feasible
    elif precision <= 0:
        r.action = HOLD_CURRENT_DOSE
        r.status = WITHHELD_CAPABILITY
        r.recommended_dose = Computed.withheld("VALIDATION_RECOMMENDATION_PRECISION_INVALID")
        r.codes.append("VALIDATION_RECOMMENDATION_PRECISION_INVALID")
        return r
    else:
        final = _round_to(feasible, precision, d_current)
        r.constraints.append("ACTUATOR_ROUNDING")
        # Step 6/7: recheck the hard constraints discretisation could have
        # broken, and step back toward `D_current` until feasible. Any violation
        # seen here was caused by rounding alone, which is step 7's precondition.
        while True:
            step_delta = final - d_current
            over_rail = abs(p_selected * step_delta) > ALK_RATE_RAIL
            over_guard = guard is not None and final > guard
            if not (over_rail or over_guard) or final == d_current:
                break
            final = _round_to(
                final - sign(step_delta) * precision, precision, d_current
            )

    final_delta = final - d_current
    if final_delta == 0.0:
        r.action = HOLD_CURRENT_DOSE
        r.status = HELD
        r.recommended_dose = Computed.of(d_current)
        r.delta_dose = 0.0
        r.delta_effect = 0.0
        # P12 still runs: the predicted post slope is computed from the actual
        # final command, which here is "no change".
        r.predicted_post_slope = observed_slope
        r.codes.append("MAINTENANCE_ROUNDS_TO_CURRENT_DOSE")
        r.balance = MATCHED
        return r

    r.action = SET_MAINTENANCE_DOSE
    r.status = ISSUED
    r.recommended_dose = Computed.of(final)
    r.delta_dose = final_delta
    r.delta_effect = p_selected * final_delta
    # P12 — from the FINAL command, never from the uncapped ideal, and never
    # assumed to be zero. A capped or uncertainty-limited first step is expected
    # to leave a residual slope.
    r.predicted_post_slope = observed_slope + r.delta_effect
    r.codes.append(
        "MAINTENANCE_INCREASE_RECOMMENDED"
        if final_delta > 0
        else "MAINTENANCE_DECREASE_RECOMMENDED"
    )
    r.balance = DEFICIT if final_delta > 0 else EXCESS
    return r
