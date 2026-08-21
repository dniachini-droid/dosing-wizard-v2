"""Negative controls for the **engine**, not for the harness.

`DEC-020` clause 3: an engine path is not complete until a deliberate mutation
of a rule the path owns turns its fixtures red, and the failure text names the
mechanism the mutation claims to guard.

The mutations in `mutations/__init__.py` sabotage the echo oracle and prove what
the *harness* detects. These sabotage the engine and prove what the *fixtures*
detect — a different claim, and the one `DEC-020` is about.

**Each mutation attacks a rule the path owns.** Clause 3 explicitly refuses a
generic control: a numeric-drift or dropped-code sabotage turns almost any
fixture red and demonstrates only that the comparator subtracts. So every entry
below names the canon rule it breaks, and `expect_mechanism` names the field the
failure must appear at.

A patch names the **consuming** module, not `constants`. The engine imports its
constants by value at import time (`from .constants import ALK_RATE_RAIL`), so
rebinding `alk_v2.constants.ALK_RATE_RAIL` would change nothing and the control
would pass while checking nothing — which is the failure mode this file exists
to catch elsewhere.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Sequence, Tuple

from . import BLOCKED, EXECUTABLE, Mutation

ENGINE = "ENGINE"


# ---------------------------------------------------------------------------
# the sabotages
# ---------------------------------------------------------------------------


def _no_support_subtraction(observed_slope: float, sigma_s: float):
    """`S_supported = S_observed`: the 1.28·sigma_S subtraction never happens."""
    from alk_v2.trajectory import Supported
    from alk_v2.kernel import sign

    return Supported(
        slope=observed_slope,
        support_k=0.0,
        subtraction=0.0,
        limited_by_uncertainty=False,
    )


def _median_lower_of_two(values: Sequence[float]) -> float:
    """The even-count convention `OI-MEDIAN-001` rejected: take the lower."""
    xs = sorted(values)
    if not xs:
        raise ValueError("median of an empty sequence")
    return xs[(len(xs) - 1) // 2]


def _mean_not_median(points) -> Tuple[float, List[float]]:
    """Ordinary mean of the pairwise slopes instead of Theil-Sen's median."""
    slopes: List[float] = []
    n = len(points)
    for i in range(n):
        for j in range(i + 1, n):
            ti, ai = points[i]
            tj, aj = points[j]
            if tj == ti:
                continue
            slopes.append((aj - ai) / (tj - ti))
    return sum(slopes) / len(slopes), slopes


def _endpoint_sxx(times: Sequence[float]) -> Tuple[float, float]:
    """The endpoint-only form `WG-ALK-062` exists to forbid.

    `Sxx` becomes `(t_last - t_first)^2 / 2`, which reproduces the forbidden
    `sqrt(0.10^2 + 0.10^2)/delta_t` uncertainty rather than the sum-of-squares
    form `ALK-SLOPE-UNCERTAINTY-001` states.
    """
    t_bar = sum(times) / len(times)
    span = times[-1] - times[0]
    return t_bar, (span * span) / 2.0


def _calendar_elapsed(a, b) -> float:
    """Whole calendar days instead of exact seconds — forbidden by `A1`."""
    return float(round((b.when - a.when).total_seconds() / 86400.0))


def _consumption_from_supported(**kw):
    """`C = P·D − S_supported`, the substitution `ALK-CONSUMPTION-ESTIMATE-001` forbids.

    Implemented by re-deriving the supported slope here, because the real
    function is never handed one — which is the structural separation
    `traj.support` exists to enforce.
    """
    observed_slope = kw.get("observed_slope")
    sigma_s = kw.get("sigma_s")
    if observed_slope is None or sigma_s is None:
        return _ORIGINAL["consumption"](**kw)
    magnitude = max(0.0, abs(observed_slope) - 1.28 * sigma_s)
    sign = 1 if observed_slope > 0 else -1 if observed_slope < 0 else 0
    return _ORIGINAL["consumption"](**{**kw, "observed_slope": sign * magnitude})


def _round_down_not_nearest(value: float, step: float, toward: float) -> float:
    """Always take the lower increment instead of the nearer one."""
    from decimal import Decimal

    v = Decimal(repr(value))
    s = Decimal(repr(step))
    return float((v / s).to_integral_value(rounding="ROUND_FLOOR") * s)


def _forecast_from_supported(a_now, observed_slope, cfg):
    """Forecast the crossing from `S_supported`, which `ALK-011B` forbids.

    `AD-RET-003` states the exact value this produces in its own `forbidden`
    block — `tOuterLowDays: 6.723781604` — so the control lands on a number the
    fixture already names as wrong.
    """
    if a_now is None or observed_slope is None or observed_slope == 0.0:
        return _ORIGINAL["forecast"](a_now, observed_slope, cfg)
    magnitude = max(0.0, abs(observed_slope) - 1.28 * _SIGMA_S_HINT[0])
    supported = (1 if observed_slope > 0 else -1) * magnitude
    if supported == 0.0:
        return _ORIGINAL["forecast"](a_now, observed_slope, cfg)
    return _ORIGINAL["forecast"](a_now, supported, cfg)


#: The forecast sabotage needs sigma_S, which the real forecast never sees.
#: Captured by wrapping `uncertainty` so the mutation does not have to change
#: the engine's signature to make its point.
_SIGMA_S_HINT = [0.0]


def _capture_sigma(obs, eps):
    out = _ORIGINAL["uncertainty"](obs, eps)
    _SIGMA_S_HINT[0] = out.sigma_s
    return out


def _position_from_earliest(eps, cfg):
    """Position from the **earliest** episode, not the latest.

    `CORE-POSITION-001` / `ALK-010`: position is the latest valid cluster
    representative value. A fitted, smoothed, forecast or older value may never
    replace it.
    """
    if not eps:
        return _ORIGINAL["position"](eps, cfg)
    earliest = min(eps, key=lambda e: e.at.epoch_seconds)
    return _ORIGINAL["position"]([earliest], cfg)


def _no_forecast_candidate(**kwargs):
    """Never submit the outer-bound forecast candidate to the scheduler."""
    kwargs = dict(kwargs)
    kwargs["forecast"] = {
        "tRangeLowDays": "NOT_APPLICABLE",
        "tRangeHighDays": "NOT_APPLICABLE",
        "tOuterLowDays": "NOT_APPLICABLE",
        "tOuterHighDays": "NOT_APPLICABLE",
    }
    return _ORIGINAL["schedule"](**kwargs)


def _uncertainty_limited_is_stable(**kw):
    """Call the tank `STABLE` when the supported slope shrinks to zero.

    `ALK-STABLE-001` requires `S_supported = 0` **and** `S_observed = 0`
    exactly. `A11` step 3 adds: never resolve to `STABLE` merely because
    movement cannot be established. This is the widening `OI-STABLE-001` warns
    against, made executable.
    """
    ev = _ORIGINAL["movement_evidence"](**kw)
    if ev.movement == "UNCERTAINTY_LIMITED":
        ev.movement = "SUFFICIENT"
        ev.trajectory = "STABLE"
        ev.codes = ["EVIDENCE_SUFFICIENT", "TRAJECTORY_STABLE"]
    return ev


def _toward_range_gate_removed(**kwargs):
    """Size the ordinary action even when the level is moving back into range.

    `ALK-TOWARD-RANGE-HOLD-001` holds maintenance below range with a supported
    rise and above range with a supported fall. Removing it produces exactly the
    strict-stabilise-first dose `AD-MNT-006` and `AD-MNT-007` name as forbidden.
    """
    kwargs = dict(kwargs)
    kwargs["position"] = "IN_RANGE"
    return _ORIGINAL["recommend"](**kwargs)


#: Filled by `run-mutations.py` before any engine mutation runs, so a sabotage
#: can delegate to the real implementation.
_ORIGINAL: Dict[str, Any] = {}


def bind_originals(originals: Dict[str, Any]) -> None:
    _ORIGINAL.clear()
    _ORIGINAL.update(originals)


#: What each engine mutation needs the unmutated implementation of.
ORIGINAL_TARGETS = {
    "consumption": "alk_v2.dosing:consumption",
    "forecast": "alk_v2.trajectory:forecast",
    "uncertainty": "alk_v2.trajectory:uncertainty",
    "position": "alk_v2.observation:position",
    "schedule": "alk_v2.retest:schedule",
    "movement_evidence": "alk_v2.trajectory:movement_evidence",
    "recommend": "alk_v2.dosing:recommend",
}


ENGINE_MUTATIONS: List[Mutation] = [
    Mutation(
        mid="E-1",
        title="Drop the 1.28·sigma_S support subtraction",
        defect_class="Layer 3 / supported slope",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="S_supported is set equal to S_observed, so uncertainty never shrinks it",
        guards=(
            "ALK-SUPPORTED-SLOPE-001. The supported slope is deliberately biased "
            "toward zero; without the subtraction the engine sizes every dose off "
            "the full observed movement and the uncertainty-limited HOLD disappears."
        ),
        expect_red=["fixture:WG-ALK-002", "fixture:AD-TRD-002", "fixture:AD-TRD-003"],
        expect_mechanism="supportedSlopeDkhPerDay",
        hooks={"alk_v2.trajectory:supported_slope": _no_support_subtraction},
    ),
    Mutation(
        mid="E-2",
        title="Remove the 0.10 dKH analytical floor on sigma_point",
        defect_class="uncertainty",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="sigma_point becomes sigma_resid, so perfectly linear data reports zero uncertainty",
        guards=(
            "ALK-SLOPE-UNCERTAINTY-001's Alk analytical floor. It is what makes "
            "WG-ALK-001 and WG-ALK-062 produce non-trivial uncertainty from exactly "
            "linear readings; without it every clean series becomes fully supported."
        ),
        expect_red=["fixture:AD-TRD-002", "fixture:AD-TRD-003", "fixture:AD-TRD-006"],
        expect_mechanism="sigmaPointDkh",
        hooks={"alk_v2.trajectory:SIGMA_ALK_BASE": 0.0},
    ),
    Mutation(
        mid="E-3",
        title="Compute Sxx from the endpoints instead of the sum of squares",
        defect_class="uncertainty",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="Sxx becomes (t_last - t_first)^2 / 2",
        guards=(
            "ALK-SLOPE-UNCERTAINTY-001's Sxx form. WG-ALK-062 exists specifically "
            "so three-point arithmetic cannot hide a divergence between this and "
            "the endpoint-only form."
        ),
        expect_red=["fixture:AD-TRD-002", "fixture:AD-TRD-005", "fixture:AD-TRD-006"],
        expect_mechanism="sxxDay2",
        hooks={"alk_v2.kernel:sxx": _endpoint_sxx},
    ),
    Mutation(
        mid="E-4",
        title="Use the mean of the pairwise slopes rather than their median",
        defect_class="trend estimator",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="Theil-Sen's median is replaced by an arithmetic mean",
        guards=(
            "ALK-009. Ordinary least squares may be computed as a diagnostic and is "
            "never the control slope; a mean of pairwise slopes is the same defect "
            "in a different disguise, and a single outlier moves it."
        ),
        expect_red=["fixture:AD-TRD-002", "fixture:AD-TRD-005"],
        expect_mechanism="observedSlopeDkhPerDay",
        hooks={"alk_v2.trajectory:theil_sen": _mean_not_median},
    ),
    Mutation(
        mid="E-5",
        title="Take the lower of the two central values as the even-count median",
        defect_class="median convention",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="median() returns the lower order statistic instead of the mean of the two central ones",
        guards=(
            "OI-MEDIAN-001, the standard arithmetic median. AD-TRD-002 is written "
            "around this convention: the low-median implementation returns -0.0333 "
            "and a different recommendation, which the fixture names as forbidden."
        ),
        expect_red=["fixture:AD-TRD-002"],
        expect_mechanism="observedSlopeDkhPerDay",
        hooks={"alk_v2.kernel:median": _median_lower_of_two},
    ),
    Mutation(
        mid="E-6",
        title="Estimate consumption from the supported slope",
        defect_class="layer violation (Layer 3 into Layer 2)",
        status=BLOCKED,
        target=ENGINE,
        sabotage="C = P·D - S_supported instead of P·D - S_observed",
        guards=(
            "ALK-CONSUMPTION-ESTIMATE-001's explicit prohibition. Substituting the "
            "supported slope 'to be conservative' corrupts a physical mass balance "
            "with a controller bias."
        ),
        expect_red=["fixture:AD-MNT-006"],
        expect_mechanism="consumptionDkhPerDay",
        hooks={"alk_v2.dosing:consumption": _consumption_from_supported},
        unblocks_when=(
            "a PASSING fixture asserts a consumption estimate on a non-zero "
            "observed slope. It was written as EXECUTABLE and run: both fixtures "
            "that assert `consumptionDkhPerDay` today -- AD-TRD-001 and AD-MNT-005 "
            "-- are flat series where S_observed = S_supported = 0, so the "
            "substitution changes nothing and the control passed while checking "
            "nothing. That is exactly the outcome this harness treats as a miss "
            "rather than a pass, so it is recorded BLOCKED instead of quietly "
            "credited. AD-MNT-006 is the fixture: it asserts consumption 0.4737 on "
            "S_observed = +0.15, and it fails today only on `fullCardShows`, a "
            "Layer-5 presentation requirement asserted in a domain fixture "
            "(OD-017). Closing that turns this control green."
        ),
    ),
    Mutation(
        mid="E-7",
        title="Round the recommendation down instead of to the nearer increment",
        defect_class="recommendation rounding",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="ALK-ROUNDING-001 step 2 always takes the lower increment",
        guards=(
            "ALK-ROUNDING-001 steps 1-4. Rounding must have no systematic "
            "increase/decrease bias; a floor is exactly the bias WG-ALK-005 forbids."
        ),
        expect_red=["fixture:AD-TRD-006", "fixture:AD-MNT-003"],
        expect_mechanism="recommendedDoseMlPerDay",
        hooks={"alk_v2.dosing:_round_to": _round_down_not_nearest},
    ),
    Mutation(
        mid="E-8",
        title="Forecast the outer-bound crossing from the supported slope",
        defect_class="forecast slope",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="A45 uses S_supported instead of S_observed",
        guards=(
            "ALK-FORECAST-SLOPE-001 and ALK-011B. AD-RET-003 names the exact value "
            "this produces -- tOuterLowDays 6.723781604 -- in its own forbidden "
            "block, because it would schedule the test after the projected crossing."
        ),
        expect_red=["fixture:AD-RET-003"],
        expect_mechanism="tOuterLowDays",
        hooks={
            "alk_v2.trajectory:forecast": _forecast_from_supported,
            "alk_v2.trajectory:uncertainty": _capture_sigma,
        },
    ),
    Mutation(
        mid="E-9",
        title="Never submit the outer-bound forecast candidate",
        defect_class="retest scheduler / candidate set",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="the FORECAST_BOUNDARY_RISK candidate is withheld from the scheduler",
        guards=(
            "ALK-RETEST-SCHEDULER-001's forecast candidate. AD-RET-001 forbids "
            "dropping it on an unstated horizon and AD-RET-003 requires it to win "
            "at 40 h over the 48 h routine cadence."
        ),
        expect_red=["fixture:AD-RET-001", "fixture:AD-RET-003"],
        expect_mechanism="candidateTimes",
        hooks={"alk_v2.retest:schedule": _no_forecast_candidate},
    ),
    Mutation(
        mid="E-10",
        title="Remove the ordinary signal candidate's 24 h floor",
        defect_class="retest scheduler / clamps",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="T_signal is emitted raw, without max(1 day, .)",
        guards=(
            "ALK-RETEST-SCHEDULER-001's floor, inside the signal candidate's own "
            "formula (F5-15). AD-RET-001's raw T_signal is 22.913 h and the floor "
            "lifts it to 24; without it the scheduler asks for a test before the "
            "movement it is timing can accumulate."
        ),
        expect_red=["fixture:AD-RET-001"],
        expect_mechanism="flooredHours",
        hooks={"alk_v2.retest:RETEST_SIGNAL_FLOOR_HOURS": 0},
    ),
    Mutation(
        mid="E-11",
        title="Read position from the earliest episode rather than the latest",
        defect_class="position",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="A_now is taken from the first testing episode in the segment",
        guards=(
            "CORE-POSITION-001 / ALK-010: position is the latest resolved episode "
            "value, and no fitted, smoothed, forecast or older value may replace "
            "it. Every boundary forecast moves with it, which is where it shows."
        ),
        expect_red=["fixture:AD-RET-003"],
        expect_mechanism="tOuterLowDays",
        hooks={"alk_v2.observation:position": _position_from_earliest},
    ),
    Mutation(
        mid="E-12",
        title="Call an uncertainty-limited trajectory STABLE",
        defect_class="movement evidence",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="S_supported = 0 with S_observed != 0 resolves to STABLE / SUFFICIENT",
        guards=(
            "ALK-STABLE-001's exact-zero condition and A11 step 3's 'do not call "
            "the tank stable merely because movement cannot yet be established'. "
            "This is the tolerance band OI-STABLE-001 warns against."
        ),
        expect_red=["fixture:WG-ALK-002", "fixture:AD-TRD-002", "fixture:AD-TRD-003"],
        expect_mechanism="movementEvidence",
        hooks={"alk_v2.trajectory:movement_evidence": _uncertainty_limited_is_stable},
    ),
    Mutation(
        mid="E-13",
        title="Remove the position x trajectory hold",
        defect_class="maintenance gate",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="the toward-range gate is bypassed by reporting the position as IN_RANGE",
        guards=(
            "ALK-TOWARD-RANGE-HOLD-001 (F5-05). Without it the engine reduces the "
            "dose of a tank that is above range and already coming down -- the "
            "strict stabilise-first dose AD-MNT-007 names as forbidden."
        ),
        expect_red=["fixture:AD-MNT-007"],
        expect_mechanism="recommendedDoseMlPerDay",
        hooks={"alk_v2.dosing:recommend": _toward_range_gate_removed},
    ),
    Mutation(
        mid="E-14",
        title="Count elapsed time in whole calendar days",
        defect_class="time arithmetic",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="elapsedDays rounds to the nearest whole day",
        guards=(
            "A1 and Part II §2.2: seconds are the only unit of subtraction, and "
            "date-label counting is a forbidden input to any rate. AD-TRD-006's "
            "own forbidden note says Sxx must use exact elapsed days rather than "
            "evenly spaced index positions."
        ),
        expect_red=["fixture:AD-TRD-006"],
        expect_mechanism="sxxDay2",
        hooks={"alk_v2.trajectory:elapsed_days": _calendar_elapsed},
    ),
    Mutation(
        mid="E-15",
        title="Raise the ordinary evidence minimum to four independent episodes",
        defect_class="evidence sufficiency",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="ALK-MOVEMENT-001's minimum cluster count becomes 4",
        guards=(
            "ALK-MOVEMENT-001 / ALK-MINIMUM-CADENCE-001's ordinary minimum. Three "
            "independent episodes over four days is what makes a settled tank "
            "actionable at all; a fourth would make the ordinary path unreachable "
            "on the cadence the canon itself recommends."
        ),
        expect_red=["fixture:AD-RET-001", "fixture:AD-RET-003"],
        expect_mechanism="movementEvidence",
        hooks={"alk_v2.trajectory:MIN_ORDINARY_CLUSTERS": 4},
    ),
    Mutation(
        mid="E-16",
        title="Bind the dose-step cap far below 25%",
        defect_class="dose-step cap",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="the ordinary step cap fraction becomes 0.02",
        guards=(
            "ALK-STEP-CAP-001's ordinary cap. The cap is a ceiling on one step, "
            "and the fixtures pin both that it binds where it should and that it "
            "does not bind where it should not."
        ),
        expect_red=["fixture:AD-TRD-006"],
        expect_mechanism="recommendedDoseMlPerDay",
        hooks={"alk_v2.dosing:ORDINARY_STEP_CAP": 0.02},
    ),
    Mutation(
        mid="E-17",
        title="Bind the physical rate rail far below 0.50 dKH/day",
        defect_class="safety rail",
        status=EXECUTABLE,
        target=ENGINE,
        sabotage="ALK-046's rail becomes 0.01 dKH/day",
        guards=(
            "ALK-046. The rail is independently binding and is a ceiling rather "
            "than a target; a wrong value silently re-sizes every recommendation "
            "whose effect approaches it."
        ),
        expect_red=["fixture:AD-TRD-006"],
        expect_mechanism="recommendedDoseMlPerDay",
        hooks={"alk_v2.dosing:ALK_RATE_RAIL": 0.01},
    ),
    Mutation(
        mid="E-18",
        title="Select independent clusters backward-greedy from the latest",
        defect_class="independent selection",
        status=BLOCKED,
        target=ENGINE,
        sabotage="ALK-INDEPENDENT-SELECTION-001's forward-greedy walk runs from the newest cluster backwards",
        guards=(
            "ALK-INDEPENDENT-SELECTION-001 (F5-01). AD-SEG-001 states both "
            "forbidden selections and the different sigma_S each produces."
        ),
        unblocks_when=(
            "a converted fixture carries two candidate episodes less than 24 h "
            "apart. Every fixture converted so far is spaced at 24 h or more, so "
            "forward- and backward-greedy accept the same set and the sabotage has "
            "nothing to change. AD-SEG-001 and AD-SEG-005 are that fixture; both "
            "assert acceptedClusterTimesDays and notAcceptedSeparationHours, names "
            "the data contract does not declare (OD-017)."
        ),
    ),
    Mutation(
        mid="E-19",
        title="Widen the testing-episode window past 30 minutes",
        defect_class="episode membership",
        status=BLOCKED,
        target=ENGINE,
        sabotage="ALK-TESTING-EPISODE-001's 30-minute window becomes 12 hours",
        guards=(
            "ALK-TESTING-EPISODE-001 / ALK-005. Repeated testing must not buy "
            "evidence count, and the window is what stops it."
        ),
        unblocks_when=(
            "a converted fixture carries two readings inside one testing episode. "
            "AD-EPI-001, AD-EPI-005, AD-SEG-007 and AD-SEG-008 all do, and all "
            "assert episode field names the data contract does not declare "
            "(OD-017), so none is converted yet."
        ),
    ),
    Mutation(
        mid="E-20",
        title="Compare the outer bounds inclusively rather than strictly",
        defect_class="position boundary",
        status=BLOCKED,
        target=ENGINE,
        sabotage="A_now == outerMin reports BREACHED_LOW",
        guards=(
            "ALK-003A: exactly at an outer bound the level is not breached, and "
            "ALK-004: range edges are inclusive. AD-POS-001 states all eight "
            "boundary cases."
        ),
        unblocks_when=(
            "a converted fixture places a reading exactly on a range edge or an "
            "outer bound. AD-POS-001 is that fixture and is a CASE_SET: "
            "EXECUTABLE-FIXTURE-FORMAT.md §6 specifies the expansion but the "
            "harness does not perform it, and no case-set fixture executes yet."
        ),
    ),
    Mutation(
        mid="E-21",
        title="Promote a learned potency on a single observation",
        defect_class="potency confidence ladder",
        status=BLOCKED,
        target=ENGINE,
        sabotage="CALIBRATED's minimum drops from three calibration-eligible observations to one",
        guards=(
            "ALK-POTENCY-CONFIDENCE-001's ladder. One observation from one dose "
            "change is EXPLORATORY and must leave selectedPotency on the "
            "theoretical figure; promoting on it would let a single noisy "
            "interval rewrite every subsequent dose."
        ),
        expect_red=["fixture:WG-ALK-026"],
        expect_mechanism="potencyConfidence",
        hooks={"alk_v2.potency:POTENCY_CALIBRATED_N": 1},
        unblocks_when=(
            "one potency fixture becomes executable. Every fixture on the POTENCY "
            "path -- WG-ALK-024..027, WG-ALK-036..039, WG-ALK-050, WG-ALK-064, "
            "AD-POT-001, AD-POT-002 -- states a Layer-2 or Layer-3 output as its "
            "input (`sPreDkhPerDay`, `sigmaPostDkhPerDay`, a `preSide` with a "
            "slope and a sigma already computed). Converting one means choosing "
            "readings whose residual scatter reproduces the stated sigma, which "
            "EXECUTABLE-FIXTURE-FORMAT.md §5 rule 5 forbids because the fixture's "
            "expectation was computed from the abstract sigma and the converted "
            "fixture would assert something the original never did. That is "
            "OD-009: these fixtures need a unit-level entry point bound to a "
            "named module, not a whole-pipeline expectation."
        ),
    ),
    Mutation(
        mid="E-22",
        title="Admit a below-threshold potency signal to the pool",
        defect_class="potency signal classification",
        status=BLOCKED,
        target=ENGINE,
        sabotage="the calibration SNR threshold drops from 3.0 to 1.0",
        guards=(
            "ALK-017's signal classes. Below SNR 3.0 an observation is diagnostic "
            "at best; admitting it to the pool would calibrate the dose from a "
            "difference the evidence cannot separate from noise."
        ),
        expect_red=["fixture:WG-ALK-024"],
        expect_mechanism="signalClass",
        hooks={"alk_v2.potency:POTENCY_SNR_CALIBRATION": 1.0},
        unblocks_when="the same condition as E-21 — one executable POTENCY fixture (OD-009).",
    ),
    Mutation(
        mid="E-23",
        title="Let the capability gate promote a learned potency anyway",
        defect_class="capability gate",
        status=BLOCKED,
        target=ENGINE,
        sabotage="the gate is ignored and selectedPotency takes the pool median",
        guards=(
            "ALK-POTENCY-CAPABILITY-GATE-001. While gated, selectedPotency is the "
            "theoretical or configured value and the core controller is fully "
            "functional (WG-ALK-046). A gate that can be bypassed is a switch "
            "nobody documented."
        ),
        expect_red=["fixture:WG-ALK-046"],
        expect_mechanism="selectedPotencyDkhPerMl",
        hooks={},
        unblocks_when=(
            "WG-ALK-046 becomes executable. It is the fixture for exactly this "
            "claim -- configured potency, gated learner, controller fully "
            "functional -- and its input is a scenario description "
            "(`configuredPotency`, `measurements`, `programmedDose`) rather than "
            "an event ledger. Converting it is ordinary conversion work under "
            "§10 and is not blocked on an owner decision; it is blocked only on "
            "this run's budget, and it is the first potency fixture to convert."
        ),
    ),
]
