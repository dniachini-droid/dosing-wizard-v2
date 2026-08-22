"""L2 — observation shaping: testing episodes, their pooled clusters, independence, position.

One owner constructs the episode and every Alk consumer reads its output
(`ALK-EPISODE-SINGLE-OUTPUT-001`). `obs.cluster` has no independent grouping
authority: the pooled set lives *inside* an episode and never re-decides
membership.

Owner decisions 27 and 28 removed two conditions that used to appear here and
must not come back: there is **no method condition** (the application does not
record, ask for, infer or store what produced a measurement) and **no explicit
relationship requirement** (proximity in time is the whole membership test).
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

from . import kernel
from .constants import (
    MIN_INDEPENDENT_SPACING_HOURS,
    REPEAT_CLUSTER_WINDOW_MINUTES,
    REPEAT_SPREAD_LIMIT,
    SIGMA_ALK_BASE,
    MAD_SCALE,
)
from .kernel import Instant, dec, elapsed_days, median
from .ledger import Ledger, Reading

OK = "OK"
ANOMALOUS = "ANOMALOUS"


@dataclass
class Episode:
    """One testing episode: the observation every consumer reads."""

    episode_id: str
    members: List[Reading]
    value_dkh: float
    at: Instant
    spread_dkh: float
    mad_dkh: float
    sigma_dkh: float
    status: str
    combined_measurement_count: int
    cluster_id: str
    #: Set by independent selection. `False` does not mean excluded: the episode
    #: still serves position, anomaly confirmation, the rapid rule and any
    #: explicitly time-resolved intervention calculation (`ALK-008`).
    independent: bool = False


def episodes(led: Ledger) -> Tuple[List[Episode], List[Reading]]:
    """Group measurements into testing episodes and resolve each to one value.

    `ALK-TESTING-EPISODE-001` / `ALK-EPISODE-RESOLUTION-001`, with `A4` step 0's
    ordering. `INVALID` members are excluded from the pooled arithmetic (Part II
    §4.3) and retained in the record; an episode whose every measurement is
    `INVALID` yields no observation.

    The 30-minute window is applied **pairwise** — a reading joins the episode
    when it is within 30 minutes of the previous member. Whether the window
    chains like this or anchors on the episode's first measurement is
    `OI-EPISODEANCHOR-001`, which canon leaves open. `A3` writes the pairwise
    form and says in the same breath that writing it is not deciding it. This
    implementation follows the wording it was given and inherits the open item;
    it does not settle it, and no fixture in scope distinguishes the two.
    """
    usable = [r for r in led.readings if r.status in ("VALID", "SUSPECT")]
    excluded = [r for r in led.readings if r.status not in ("VALID", "SUSPECT")]
    if not usable:
        return [], excluded

    window_days = REPEAT_CLUSTER_WINDOW_MINUTES / (60.0 * 24.0)
    groups: List[List[Reading]] = [[usable[0]]]
    for prev, cur in zip(usable, usable[1:]):
        if elapsed_days(prev.at, cur.at) <= window_days:
            groups[-1].append(cur)
        else:
            groups.append([cur])

    out: List[Episode] = []
    for members in groups:
        values = [m.raw_value_dkh for m in members]
        spread = max(values) - min(values)
        # `ALK-005`'s limit is a canonical threshold predicate over exact
        # decimals (`ALK-DECIMAL-THRESHOLD-001`): an exact spread of 0.20 is
        # `OK`, and binary64 subtraction must not decide the side.
        exact_spread = max(dec(v) for v in values) - min(dec(v) for v in values)
        m_dkh = kernel.mad(values)
        at = _representative_at(members)
        eid = f"EP-{at.text}"
        out.append(
            Episode(
                episode_id=eid,
                members=members,
                value_dkh=median(values),
                at=at,
                spread_dkh=spread,
                mad_dkh=m_dkh,
                # Never divided by sqrt(n): repeats of one hobby test share
                # systematic error (Part II §5.6).
                sigma_dkh=max(SIGMA_ALK_BASE, MAD_SCALE * m_dkh),
                status=ANOMALOUS if exact_spread > dec(REPEAT_SPREAD_LIMIT) else OK,
                combined_measurement_count=len(members),
                cluster_id=f"CL-{at.text}",
            )
        )
    return out, excluded


def _representative_at(members: List[Reading]) -> Instant:
    """`median(member measuredAt)` (Part II §5.5).

    For an even count the median of two instants is their midpoint, which is the
    arithmetic median `OI-MEDIAN-001` names, applied to seconds.
    """
    if len(members) == 1:
        return members[0].at
    seconds = median([m.at.epoch_seconds for m in members])
    # Rendered in the offset the members arrived in, not in UTC. `Instant`'s own
    # docstring states the principle: an engine that answers with its own
    # preferred spelling of the same instant has changed the answer. A keeper in
    # +10:00 who repeat-tests at 08:00 must not see their episode stamped as the
    # previous day.
    when = kernel.utc(seconds).astimezone(members[0].at.when.tzinfo)
    return Instant(text=kernel.iso(when), when=when)


def select_independent(eps: List[Episode]) -> Tuple[List[Episode], List[Episode]]:
    """Forward-greedy chronological selection (`ALK-INDEPENDENT-SELECTION-001`).

    Three properties a naive implementation loses, all of them stated in `A4`:

    1. the anchor is the **last accepted** episode, never the last examined;
    2. appending an episode after the latest accepted one never changes an
       earlier acceptance;
    3. the >= 24 h comparison is **inclusive at exactly 24 h**.

    Property 2 is bounded to appended data. An episode backdated to before the
    current earliest candidate re-runs selection from the new earliest and may
    accept a different set -- required by `ALK-065` / `WG-ALK-029`, and the
    historical assessment record stays immutable regardless.
    """
    accepted: List[Episode] = []
    not_accepted: List[Episode] = []
    anchor: Optional[Episode] = None
    spacing_days = MIN_INDEPENDENT_SPACING_HOURS / 24.0
    for e in sorted(eps, key=lambda x: x.at.epoch_seconds):
        if anchor is None:
            accepted.append(e)
            anchor = e
        elif elapsed_days(anchor.at, e.at) >= spacing_days:
            accepted.append(e)
            anchor = e
        else:
            not_accepted.append(e)
    for e in accepted:
        e.independent = True
    return accepted, not_accepted


# ---------------------------------------------------------------------------
# Position -- A13
# ---------------------------------------------------------------------------

BELOW_RANGE = "BELOW_RANGE"
IN_RANGE = "IN_RANGE"
ABOVE_RANGE = "ABOVE_RANGE"
ALERT_LOW = "ALERT_LOW"
ALERT_HIGH = "ALERT_HIGH"
UNKNOWN = "UNKNOWN"

WITHIN_BOUNDS = "WITHIN_BOUNDS"
BREACHED_LOW = "BREACHED_LOW"
BREACHED_HIGH = "BREACHED_HIGH"


def _day_of(at: Instant) -> str:
    """The calendar day an instant states, **in the offset it arrived in**.

    Not converted to UTC and not converted to the host's zone: canon Part II
    §2.3A.2 orders by the day the record states, in the day's own terms. A
    keeper in +10:00 testing at 08:00 must not have their reading placed on the
    previous day because the process happens to run in UTC.
    """
    return at.text[:10]


@dataclass
class PositionState:
    position: str
    outer_bound_state: Optional[str]
    a_now: Optional[float]
    #: The episode the current value came from, or `None` when it came from a
    #: reading with no usable instant -- which forms no episode (owner decision
    #: 30). `None` here is not a withholding and carries no reason code.
    episode: Optional[Episode]
    #: `OI-EPISODENOOBS-001`: what `outerBoundState` takes when no episode
    #: resolves is not stated by canon and its closed vocabulary has no member
    #: for "nothing to classify". The engine emits `NOT_RUN` rather than
    #: inventing one, and says which open item it is refusing under.
    open_issue: Optional[str] = None


def position(eps: List[Episode], cfg, untimed=()) -> PositionState:
    """Latest current value against the range and the outer bounds.

    Position reads the episode's one canonical value, never a member of it and
    never a cluster chosen from inside it -- owner decision 19, carried forward
    by 27 and 28.

    **Owner decision 30 adds the readings that carry no usable instant.** Canon
    Part II §2.3A says such a reading "may support current position if otherwise
    valid" and §2.3A.2 says how to order it:

    1. by calendar day, ascending;
    2. within one day, a record carrying a usable instant is **later** than one
       carrying none -- not a claim about the tank but the refusal to make one,
       because the record without a time cannot be *shown* to be later and
       position is never decided by an assumption;
    3. between two untimed records on one day, by `eventOrdinal`.

    This ordering is never an elapsed-time operand. Nothing here reaches a
    slope, a consumption estimate, an episode-membership decision or a retest
    interval, and no output says which kind of record won.

    Comparisons at the **outer bounds are strict** (`ALK-003A`: exactly at a
    bound is not breached); **range edges are inclusive** (`ALK-004`: 8.19
    against a lower edge of 8.20 is below range). Both are exact-decimal
    predicates. Uncertainty does not widen the range.
    """
    #: `(day, tier, tiebreak)`. Tier 1 beats tier 0 inside one day, which is
    #: §2.3A.2 clause 2. The tiebreaks are never compared across tiers.
    candidates = [
        ((_day_of(e.at), 1, e.at.epoch_seconds), e.value_dkh, e) for e in eps
    ]
    candidates += [
        ((r.day, 0, float(r.ordinal)), r.raw_value_dkh, None)
        for r in untimed
        if r.status in ("VALID", "SUSPECT")
    ]
    if not candidates:
        return PositionState(UNKNOWN, None, None, None, open_issue="OI-EPISODENOOBS-001")
    _key, value, latest = max(candidates, key=lambda c: c[0])
    a = dec(value)
    outer_min = cfg.num("outerMinDkh")
    outer_max = cfg.num("outerMaxDkh")
    range_min = cfg.num("targetRangeMinDkh")
    range_max = cfg.num("targetRangeMaxDkh")

    if outer_min is not None and a < dec(outer_min):
        return PositionState(ALERT_LOW, BREACHED_LOW, value, latest)
    if outer_max is not None and a > dec(outer_max):
        return PositionState(ALERT_HIGH, BREACHED_HIGH, value, latest)
    if range_min is not None and a < dec(range_min):
        return PositionState(BELOW_RANGE, WITHIN_BOUNDS, value, latest)
    if range_max is not None and a > dec(range_max):
        return PositionState(ABOVE_RANGE, WITHIN_BOUNDS, value, latest)
    return PositionState(IN_RANGE, WITHIN_BOUNDS, value, latest)
