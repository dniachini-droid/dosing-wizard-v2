"""The single retest scheduler — `A46`, `ALK-RETEST-SCHEDULER-001`.

**One scheduler owns final next-test timing** (`X-INV-004`). No card, notice or
notification computes a date; a presentation surface renders `recommendedAt`,
`earliestUsefulAt`, `latestSafeAt` and the reason code, and computes none of
them.

Every candidate is recorded, including the ones that lose and the ones that were
not submitted, so the choice is auditable. The two canonically `NOT_RUN` classes
— `T_detect` and the return-plan arrival cadence — are reported as decided
states, not as gaps.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .constants import (
    HOURS_PER_DAY,
    RAPID_RETEST_HOURS,
    RETEST_BOUNDARY_SAFETY_LEAD_DAYS,
    RETEST_OBSERVATION_CEILING_HOURS,
    RETEST_REQUIRED_MOVEMENT,
    RETEST_SIGNAL_FLOOR_HOURS,
    ROUTINE_CADENCE_HOURS,
    SAFETY_RETEST_HOURS,
)
from .kernel import Instant, plus_hours
from .observation import BREACHED_HIGH, BREACHED_LOW
from .trajectory import INSUFFICIENT, NOT_APPLICABLE

REPEAT_NOW = "REPEAT_NOW"
TEST_AT = "TEST_AT"
ROUTINE = "ROUTINE"

#: Candidate classes in the order `ALK-053A`'s own candidate-set table lists
#: them. Used **only** to pick which of several candidates tying on one instant
#: fills the single `reasonCode` field; every tied candidate's code is emitted
#: regardless, so nothing is lost by the choice and no candidate is suppressed.
#:
#: Canon says "no precedence between tied candidates is invented", and this is
#: not one: `RetestDecision` declares one `reasonCode` and a
#: `tiedReasonCodes[]` beside it, so *something* has to fill the singular field
#: deterministically. Taking the canon table's own order is the least invented
#: rule available. Which candidate should be named first at a tie is not stated
#: anywhere, and is recorded as `OD-016`.
CLASS_ORDER = (
    "REPEAT_NOW",
    "SAFETY_RETURN_ACTIVE",
    "HIGH_BREACH_FAILSAFE",
    "RAPID_MOVEMENT",
    "FORECAST_BOUNDARY_RISK",
    "POST_CHANGE_FIRST",
    "POST_CHANGE_SECOND",
    "SIGNAL_ACCUMULATION",
    "RETURN_PLAN_EXPIRY",
    "ROUTINE_CADENCE",
)

CLASS_CODE = {
    "REPEAT_NOW": "RETEST_REPEAT_NOW",
    "SAFETY_RETURN_ACTIVE": "RETEST_SAFETY_RETURN_ACTIVE",
    "HIGH_BREACH_FAILSAFE": "RETEST_HIGH_BREACH_FAILSAFE",
    "RAPID_MOVEMENT": "RETEST_RAPID_MOVEMENT",
    "FORECAST_BOUNDARY_RISK": "RETEST_FORECAST_BOUNDARY_RISK",
    "POST_CHANGE_FIRST": "RETEST_POST_CHANGE_FIRST",
    "POST_CHANGE_SECOND": "RETEST_POST_CHANGE_SECOND",
    "SIGNAL_ACCUMULATION": "RETEST_SIGNAL_ACCUMULATION",
    "RETURN_PLAN_EXPIRY": "RETEST_RETURN_PLAN_ASSESSMENT",
    "ROUTINE_CADENCE": "RETEST_ROUTINE_CADENCE",
}

#: Candidates exempt from the signal candidate's floor, and free to schedule
#: earlier or return test-now when already warranted.
FLOOR_EXEMPT = (
    "REPEAT_NOW",
    "RAPID_MOVEMENT",
    "SAFETY_RETURN_ACTIVE",
    "HIGH_BREACH_FAILSAFE",
    "FORECAST_BOUNDARY_RISK",
)

#: Ordinary observation candidates, subject to the ~Day-4 ceiling.
ORDINARY_OBSERVATION = ("SIGNAL_ACCUMULATION",)


@dataclass
class Candidate:
    candidate_class: str
    hours: Optional[float] = None
    included: bool = True
    reason: Optional[str] = None
    raw_hours: Optional[float] = None
    floored_hours: Optional[float] = None
    clamped_hours: Optional[float] = None
    bound_side: Optional[str] = None

    def payload(self, as_of: Instant) -> Dict[str, Any]:
        out: Dict[str, Any] = {"candidateClass": self.candidate_class,
                               "included": self.included}
        if self.hours is not None:
            out["at"] = plus_hours(as_of, max(0.0, self.hours)).text
            out["approxHours"] = self.hours
        if self.raw_hours is not None:
            out["rawHours"] = self.raw_hours
        if self.floored_hours is not None:
            out["flooredHours"] = self.floored_hours
        if self.clamped_hours is not None:
            out["clampedHours"] = self.clamped_hours
        if self.bound_side is not None:
            out["boundSide"] = self.bound_side
        if self.reason is not None:
            out["reason"] = self.reason
        return out


@dataclass
class Decision:
    selected_action: str
    selected_hours: float
    reason_code: str
    tied: List[str]
    candidates: List[Candidate]
    not_run: List[str]
    clamps: List[str]
    floor_applied: bool
    codes: List[str] = field(default_factory=list)
    #: The scheduler's own candidate arithmetic, declared by `DEC-022`. Raw
    #: values -- before the signal candidate's floor and before the ceiling --
    #: because that is what the frozen fixtures assert.
    t_signal_raw_hours: Optional[float] = None
    t_boundary_days: Optional[float] = None


def schedule(
    *,
    as_of: Instant,
    supported_slope: Optional[float],
    movement_evidence: str,
    rapid_confirmed: bool,
    outer_bound_state: Optional[str],
    forecast: Dict[str, Any],
    latest_episode_anomalous: bool,
    safety_return_active: bool,
    post_change_first_at_hours: Optional[float] = None,
    post_change_second_at_hours: Optional[float] = None,
) -> Decision:
    """Collect every candidate, clamp, then select the earliest applicable one."""
    candidates: List[Candidate] = []
    clamps: List[str] = []
    codes: List[str] = []
    floor_applied = False
    boundary_days: Optional[float] = None

    # --- immediate repeat -------------------------------------------------
    # `ALK-051`, driven by `ALK-SUSPECT-DETECTION-001`'s three operative
    # sources. Automatic statistical suspicion detection is canonically
    # `NOT_RUN` for alkalinity, so an anomalous latest episode is the only one
    # of the three this ledger can carry.
    if latest_episode_anomalous:
        candidates.append(Candidate("REPEAT_NOW", hours=0.0))

    # --- safety cadence ---------------------------------------------------
    if safety_return_active:
        candidates.append(Candidate("SAFETY_RETURN_ACTIVE", hours=float(SAFETY_RETEST_HOURS)))

    # --- rapid ------------------------------------------------------------
    if rapid_confirmed:
        candidates.append(Candidate("RAPID_MOVEMENT", hours=float(RAPID_RETEST_HOURS)))

    # --- post-change ------------------------------------------------------
    if post_change_first_at_hours is not None:
        candidates.append(
            Candidate("POST_CHANGE_FIRST", hours=float(post_change_first_at_hours))
        )
    if post_change_second_at_hours is not None:
        candidates.append(
            Candidate("POST_CHANGE_SECOND", hours=float(post_change_second_at_hours))
        )

    # --- forecast outer-bound risk ---------------------------------------
    # Runs only while the level is inside the bound. Once `ALK-003A` reports a
    # breach there is no crossing left to forecast, `ALK-062` clamps T_outer to
    # zero, and without this exclusion the scheduler would hold at REPEAT_NOW
    # for as long as the breach lasts and make the ~24 h safety cadence
    # unreachable in the state it was written for.
    if outer_bound_state in (BREACHED_LOW, BREACHED_HIGH):
        candidates.append(
            Candidate(
                "FORECAST_BOUNDARY_RISK",
                included=False,
                reason=(
                    "not submitted: the level is already "
                    f"{outer_bound_state}, so there is no projected crossing to forecast"
                ),
            )
        )
    else:
        low = forecast.get("tOuterLowDays")
        high = forecast.get("tOuterHighDays")
        t_outer, side = (
            (low, "OUTER_MIN")
            if isinstance(low, (int, float))
            else ((high, "OUTER_MAX") if isinstance(high, (int, float)) else (None, None))
        )
        if t_outer is not None:
            t_boundary_days = t_outer - RETEST_BOUNDARY_SAFETY_LEAD_DAYS
            boundary_days = t_boundary_days
            candidates.append(
                Candidate(
                    "FORECAST_BOUNDARY_RISK",
                    hours=t_boundary_days * HOURS_PER_DAY,
                    bound_side=side,
                )
            )

    # --- confidence-building ---------------------------------------------
    # `T_signal = max(1 day, 0.10 / |S_supported|)`. The 24 h floor is inside
    # this candidate's own formula and applies to no other candidate.
    if supported_slope in (None, 0.0) or movement_evidence == INSUFFICIENT:
        codes.append("RETEST_SIGNAL_ACCUMULATION_NOT_RUN")
        raw_hours = None
    else:
        raw_hours = (RETEST_REQUIRED_MOVEMENT / abs(supported_slope)) * HOURS_PER_DAY
        c = Candidate("SIGNAL_ACCUMULATION", raw_hours=raw_hours)
        hours = raw_hours
        if raw_hours < RETEST_SIGNAL_FLOOR_HOURS:
            hours = float(RETEST_SIGNAL_FLOOR_HOURS)
            c.floored_hours = hours
            floor_applied = True
            clamps.append("RETEST_SIGNAL_FLOOR_APPLIED")
            codes.append("RETEST_SIGNAL_FLOOR_APPLIED")
        if hours > RETEST_OBSERVATION_CEILING_HOURS:
            hours = float(RETEST_OBSERVATION_CEILING_HOURS)
            clamps.append("RETEST_OBSERVATION_CEILING_APPLIED")
            codes.append("RETEST_OBSERVATION_CEILING_APPLIED")
        if c.floored_hours is None:
            c.clamped_hours = hours
        c.hours = hours
        candidates.append(c)

    # --- routine cadence --------------------------------------------------
    candidates.append(Candidate("ROUTINE_CADENCE", hours=float(ROUTINE_CADENCE_HOURS)))

    # --- selection --------------------------------------------------------
    live = [c for c in candidates if c.included and c.hours is not None]
    live.sort(key=lambda c: (c.hours, CLASS_ORDER.index(c.candidate_class)))
    winner = live[0]
    tied = [
        CLASS_CODE[c.candidate_class]
        for c in live[1:]
        if c.hours == winner.hours
    ]
    action = REPEAT_NOW if winner.hours <= 0 else TEST_AT
    if action == TEST_AT and winner.candidate_class == "ROUTINE_CADENCE" and not tied:
        action = ROUTINE

    for c in live:
        if c.hours == winner.hours:
            codes.append(CLASS_CODE[c.candidate_class])

    return Decision(
        t_signal_raw_hours=raw_hours,
        t_boundary_days=boundary_days,
        selected_action=action,
        selected_hours=max(0.0, winner.hours),
        reason_code=CLASS_CODE[winner.candidate_class],
        tied=tied,
        candidates=candidates,
        not_run=[
            "RETEST_DETECTABILITY_POLICY_UNAVAILABLE",
            "RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE",
        ],
        clamps=clamps,
        floor_applied=floor_applied,
        codes=codes,
    )


def render(d: Decision, as_of: Instant) -> Dict[str, Any]:
    """`RetestDecision`, in the vocabulary `DEC-022` declares.

    `selectedAction` rather than `action`, and `selectedReasonCode` beside
    `reasonCode` with the same value: both are `DEC-022`'s doing, and the first
    of them also removes the name collision with `DoseRecommendation.action`.
    """
    recommended = plus_hours(as_of, d.selected_hours)
    return {
        "selectedAction": d.selected_action,
        "earliestUsefulAt": recommended.text,
        "recommendedAt": recommended.text,
        "reasonCode": d.reason_code,
        "selectedReasonCode": d.reason_code,
        "tiedReasonCodes": d.tied,
        "selectedApproxHours": d.selected_hours,
        "observationCeilingHours": float(RETEST_OBSERVATION_CEILING_HOURS),
        "observationFloorApplied": d.floor_applied,
        # `DEC-022`'s scheduler intermediates. Raw, and emitted under both names
        # the frozen fixtures use for the same quantity.
        "tSignalDays": (
            d.t_signal_raw_hours / HOURS_PER_DAY
            if d.t_signal_raw_hours is not None
            else "NOT_APPLICABLE"
        ),
        "tSignalRawHours": (
            d.t_signal_raw_hours if d.t_signal_raw_hours is not None else "NOT_APPLICABLE"
        ),
        "tSignalHours": (
            d.t_signal_raw_hours if d.t_signal_raw_hours is not None else "NOT_APPLICABLE"
        ),
        "tBoundaryDays": (
            d.t_boundary_days if d.t_boundary_days is not None else "NOT_APPLICABLE"
        ),
        "candidateTimes": [c.payload(as_of) for c in d.candidates],
        "candidatesNotRun": list(d.not_run),
        "clampsApplied": list(d.clamps),
        "assumptions": [],
    }
