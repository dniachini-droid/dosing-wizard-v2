"""L6 — intervention lifecycle, and the immutable prediction snapshot.

`A25`. An intervention is created **only** by a confirmed actual dose change. A
recommendation never creates one (Part I §31, Part II §27): the app recommends
and the keeper acts, and until the keeper says they acted there is nothing to
assess.

This module is the single owner of "what happened around a dose change" — the
pre window, the post window, the snapshot and the phase. Both the potency
learner (stage two) and the response classifier (stage three) read it. Building
one window rule per consumer would be two implementations of one inference,
which `MASTER RULE 1` calls a defect rather than a coincidence.

**The snapshot is a historical fact about what the app predicted.** It is stated
in terms of the state *immediately before the change* — the potency, confidence
and context in force then, and the pre-change observed slope — and never in
terms of current potency. A later recalibration changes current and future
calculations only; it never rewrites `expectedSlopeChange`. Storing
`historicalPredictionPotency != currentSelectedPotency` at the same time is
intentional and required (`WG-ALK-019`), and an intervention that later
contributes a potency observation must not have its own benchmark rewritten by
that observation — that is circular self-validation (`WG-ALK-020`).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import kernel, trajectory as traj
from .constants import ATTRIBUTION_HORIZON_DAYS, POSTCHANGE_FIRST_TEST_HOURS
from .kernel import Instant, elapsed_days
from .observation import Episode

# InterventionPhase
NOT_STARTED = "NOT_STARTED"
JUST_IMPLEMENTED = "JUST_IMPLEMENTED"
OBSERVING = "OBSERVING"
ASSESSMENT_DUE = "ASSESSMENT_DUE"
ASSESSED = "ASSESSED"
INTERRUPTED = "INTERRUPTED"
EXPIRED = "EXPIRED"

CALCULATION_VERSION = "ALK-PREDICTION-SNAPSHOT-001/1"


@dataclass
class Snapshot:
    """`InterventionPredictionSnapshot`, write-once.

    `available = False` is a first-class state, not a missing object: `M-7` makes
    a legacy intervention without one report
    `LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE` and refuse the causal response
    rather than reconstructing a prediction nobody made.
    """

    available: bool
    created_at: Optional[str] = None
    old_dose: Optional[float] = None
    new_dose: Optional[float] = None
    selected_potency_at_prediction: Optional[float] = None
    potency_context_id_at_prediction: Optional[str] = None
    potency_confidence_at_prediction: Optional[str] = None
    pre_change_observed_slope: Optional[float] = None
    pre_change_slope_uncertainty: Optional[float] = None
    expected_slope_change: Optional[float] = None
    predicted_post_slope: Optional[float] = None
    calculation_version: str = CALCULATION_VERSION
    unavailable_reason: Optional[str] = None

    def payload(self) -> Dict[str, Any]:
        if not self.available:
            return {
                "available": False,
                "unavailableReason": self.unavailable_reason or "NOT_RECORDED",
            }
        return {
            "available": True,
            "createdAt": self.created_at,
            "oldDoseMlPerDay": self.old_dose,
            "newDoseMlPerDay": self.new_dose,
            "selectedPotencyAtPrediction": self.selected_potency_at_prediction,
            "potencyContextIdAtPrediction": self.potency_context_id_at_prediction,
            "potencyConfidenceAtPrediction": self.potency_confidence_at_prediction,
            "preChangeObservedSlope": self.pre_change_observed_slope,
            "preChangeSlopeUncertainty": self.pre_change_slope_uncertainty,
            "expectedSlopeChange": self.expected_slope_change,
            "predictedPostSlope": self.predicted_post_slope,
            "calculationVersion": self.calculation_version,
        }


@dataclass
class Window:
    """One side of a dose change: the episodes and the trend fitted to them."""

    episodes: List[Episode]
    observed: Optional[traj.Observed] = None

    @property
    def n(self) -> int:
        return len(self.episodes)

    @property
    def span_days(self) -> float:
        return self.observed.span_days if self.observed is not None else 0.0

    @property
    def slope(self) -> Optional[float]:
        return self.observed.slope if self.observed is not None else None

    @property
    def sigma(self) -> Optional[float]:
        return self.observed.sigma_s if self.observed is not None else None


@dataclass
class Intervention:
    intervention_id: str
    at: Instant
    old_dose: Optional[float]
    new_dose: Optional[float]
    effective_at_confidence: str
    pre: Window
    post: Window
    snapshot: Snapshot
    phase: str
    #: A same-instant measurement that cannot be established as pre- or
    #: post-event. `AUDIT-028` forbids using it as the time-zero anchor.
    anchor_relation_ambiguous: bool = False
    interrupted_by: Optional[str] = None
    confounders: List[str] = field(default_factory=list)
    days_since_start: float = 0.0

    @property
    def delta_dose(self) -> Optional[float]:
        if self.old_dose is None or self.new_dose is None:
            return None
        return self.new_dose - self.old_dose


def _window(episodes: List[Episode]) -> Window:
    w = Window(episodes=episodes)
    obs = traj.trend(episodes)
    if obs is not None:
        obs = traj.uncertainty(obs, episodes)
    w.observed = obs
    return w


def build(
    led,
    episodes: List[Episode],
    as_of: Instant,
    potency_at: Any,
    confounders: List[str],
) -> List[Intervention]:
    """Every confirmed actual dose change in the ledger, with its two windows.

    `potency_at(instant)` returns `(potency, contextId, confidence)` as they
    stood at that instant. It is passed in rather than imported so that this
    module cannot reach into the potency learner and the dependency stays
    one-way: potency reads interventions, not the other way round.
    """
    changes = [e for e in led.of_kind("DOSE_CHANGE") if e.at is not None]
    if not changes:
        return []
    changes.sort(key=lambda e: e.at.epoch_seconds)

    out: List[Intervention] = []
    for index, e in enumerate(changes):
        at = e.at
        old = e.get("from")
        new = e.get("to")

        # The Day-0 anchor may start the first new-dose interval but is never a
        # post-change observation: reusing it in both slopes would correlate
        # their errors (`AUDIT-013`, Part II §31).
        pre_eps = [p for p in episodes if p.at.epoch_seconds < at.epoch_seconds]
        post_eps = [p for p in episodes if p.at.epoch_seconds > at.epoch_seconds]
        same_instant = [p for p in episodes if p.at.epoch_seconds == at.epoch_seconds]

        # A window is bounded by the neighbouring changes: a segment that
        # straddles a dose boundary is not a clean pre or post window.
        if index > 0:
            prev_at = changes[index - 1].at
            pre_eps = [p for p in pre_eps if p.at.epoch_seconds > prev_at.epoch_seconds]
        interrupted_by = None
        if index + 1 < len(changes):
            next_at = changes[index + 1].at
            post_eps = [p for p in post_eps if p.at.epoch_seconds < next_at.epoch_seconds]
            if next_at.epoch_seconds <= as_of.epoch_seconds:
                interrupted_by = changes[index + 1].event_id or f"IV-{next_at.text}"

        pre = _window(pre_eps)
        post = _window(post_eps)

        snapshot = _snapshot(e, at, old, new, pre, potency_at)
        days = elapsed_days(at, as_of)

        out.append(
            Intervention(
                intervention_id=e.event_id or f"IV-{at.text}",
                at=at,
                old_dose=old if kernel.finite(old) else None,
                new_dose=new if kernel.finite(new) else None,
                effective_at_confidence=str(e.get("effectiveAtConfidence", "EXACT")),
                pre=pre,
                post=post,
                snapshot=snapshot,
                phase=_phase(days, post, interrupted_by),
                anchor_relation_ambiguous=bool(same_instant),
                interrupted_by=interrupted_by,
                confounders=list(confounders),
                days_since_start=days,
            )
        )
    return out


def _snapshot(event, at, old, new, pre: Window, potency_at) -> Snapshot:
    """`A25` step 4, write-once, from the state immediately before the change.

    A snapshot carried on the event is used **verbatim** — it is the historical
    fact, and the engine's job is to read it, not to improve on it. Where the
    ledger carries none, the snapshot is reconstructed from the state at
    `actualStartTime`: the potency, context and confidence in force *then*, and
    the pre-change observed slope. That is not a recomputation against current
    potency, which is what immutability forbids; it is the same deterministic
    replay canon §64 requires of every other derived value.

    Where the pre-change state cannot be reconstructed either — no pre-change
    trend at all — there is nothing to have predicted, and the snapshot is
    unavailable. That is terminal for the intervention's causal attribution and
    is exactly the state a dose change recorded before any of this existed lands
    in.
    """
    stored = event.get("predictionSnapshot")
    if isinstance(stored, dict):
        return Snapshot(
            available=True,
            created_at=stored.get("createdAt", at.text),
            old_dose=stored.get("oldDoseMlPerDay", old),
            new_dose=stored.get("newDoseMlPerDay", new),
            selected_potency_at_prediction=stored.get("selectedPotencyAtPrediction"),
            potency_context_id_at_prediction=stored.get("potencyContextIdAtPrediction"),
            potency_confidence_at_prediction=stored.get("potencyConfidenceAtPrediction"),
            pre_change_observed_slope=stored.get("preChangeObservedSlope"),
            pre_change_slope_uncertainty=stored.get("preChangeSlopeUncertainty"),
            expected_slope_change=stored.get("expectedSlopeChange"),
            predicted_post_slope=stored.get("predictedPostSlope"),
            calculation_version=stored.get("calculationVersion", CALCULATION_VERSION),
        )
    if stored in ("UNAVAILABLE", "NOT_RECORDED"):
        return Snapshot(available=False, unavailable_reason="LEGACY_NOT_RECORDED")

    if pre.observed is None or old is None or new is None:
        return Snapshot(available=False, unavailable_reason="NO_PRE_CHANGE_STATE")

    potency, context_id, confidence = potency_at(at)
    if potency is None:
        return Snapshot(available=False, unavailable_reason="NO_POTENCY_AT_PREDICTION")

    expected = potency * (float(new) - float(old))
    return Snapshot(
        available=True,
        created_at=at.text,
        old_dose=float(old),
        new_dose=float(new),
        selected_potency_at_prediction=potency,
        potency_context_id_at_prediction=context_id,
        potency_confidence_at_prediction=confidence,
        pre_change_observed_slope=pre.observed.slope,
        pre_change_slope_uncertainty=pre.observed.sigma_s,
        expected_slope_change=expected,
        predicted_post_slope=pre.observed.slope + expected,
    )


def _phase(days_since_start: float, post: Window, interrupted_by: Optional[str]) -> str:
    """`InterventionPhase`. `INTERRUPTED` is never `FAILED` and never `EXPECTED`."""
    if interrupted_by:
        return INTERRUPTED
    if days_since_start > ATTRIBUTION_HORIZON_DAYS:
        return EXPIRED
    if days_since_start * 24.0 < POSTCHANGE_FIRST_TEST_HOURS:
        return JUST_IMPLEMENTED
    if post.n == 0:
        return ASSESSMENT_DUE
    return OBSERVING
