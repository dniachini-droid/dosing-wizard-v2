"""The shared kernel: time, statistics, and the three-state result type.

`ALK-V2-MODULE-DESIGN.md` §2 puts `kernel.time`, `kernel.stats` and
`kernel.result` below every other layer and gives them one property in common:
**they hold no chemistry.** `median` does not know what a dKH is, and that is
deliberate — Part II §65 forbids importing an alkalinity constant into a future
calcium calculation, and an estimator that never saw one cannot leak one.

Everything here is pure and total: same arguments, same result; no I/O, no clock,
no randomness, no mutable global state, and no exception used for control flow.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Sequence, Tuple

from .constants import SECONDS_PER_DAY

# ---------------------------------------------------------------------------
# Time
# ---------------------------------------------------------------------------

#: Time provenances from which an exact elapsed interval may be derived
#: (`ALK-V2-DATA-CONTRACT.md` §1, `SHARED-LEGACY-TIME-001`). The other two --
#: `LOCAL_TIME_ZONE_UNKNOWN` and `DATE_ONLY` -- serve position and history and
#: are excluded from trend arithmetic. There is no transformation that upgrades
#: a provenance, so this set is a fact about the reading, never a policy knob.
EXACT_PROVENANCES = ("EXACT_ABSOLUTE", "RECONSTRUCTED_WITH_PROVENANCE")


@dataclass(frozen=True)
class Instant:
    """An absolute instant, with the text it arrived as.

    The text is kept because `INV-A2` compares `assessmentAsOf` to the *supplied*
    `asOf` string: re-serialising `2026-09-05T09:00:00+10:00` as
    `2026-09-05T09:00:00+10:00` happens to round-trip, and re-serialising it as
    UTC does not. An engine that answers with its own preferred spelling of the
    same instant has changed the answer.
    """

    text: str
    when: datetime
    provenance: str = "EXACT_ABSOLUTE"

    @property
    def epoch_seconds(self) -> float:
        return self.when.timestamp()

    @property
    def exact(self) -> bool:
        return self.provenance in EXACT_PROVENANCES


def parse_instant(text: Any, provenance: str = "EXACT_ABSOLUTE") -> Optional[Instant]:
    """Parse an offset-aware ISO-8601 instant, or return `None`.

    Returns `None` rather than raising: a malformed timestamp is a validation
    outcome carrying a reason code, not a crash. A timestamp with no offset is
    rejected for the same reason `SHARED-LEGACY-TIME-001` forbids assigning the
    keeper's current timezone to an old local stamp -- the offset is not ours to
    supply.
    """
    if not isinstance(text, str) or not text:
        return None
    try:
        when = datetime.fromisoformat(text)
    except ValueError:
        return None
    if when.tzinfo is None:
        return None
    return Instant(text=text, when=when, provenance=provenance)


def elapsed_days(a: Instant, b: Instant) -> float:
    """`(b - a) / 86400`, in seconds. `A1`.

    Seconds are the only unit of subtraction. Calendar-day differencing, date
    labels and "days ago" rounding are forbidden inputs to any rate, because
    each of them silently quantises an interval the trend arithmetic divides by.
    """
    return (b.when - a.when).total_seconds() / SECONDS_PER_DAY


def plus_hours(a: Instant, hours: float) -> Instant:
    when = a.when + timedelta(seconds=hours * 3600.0)
    return Instant(text=iso(when), when=when, provenance=a.provenance)


def iso(when: datetime) -> str:
    """A stable, locale-free rendering of an instant.

    `isoformat()` on an offset-aware `datetime` reads no locale and no host
    timezone, which is what `INV-A2`'s timezone-shift arm checks.
    """
    return when.isoformat()


def utc(seconds: float) -> datetime:
    return datetime.fromtimestamp(seconds, tz=timezone.utc)


# ---------------------------------------------------------------------------
# Statistics -- no chemistry lives here
# ---------------------------------------------------------------------------


def median(values: Sequence[float]) -> float:
    """The standard arithmetic median (`OI-MEDIAN-001`).

    Even-length input averages the two central values. `OI-MEDIAN-001` settled
    this explicitly; a lower-of-two convention would move `AD-TRD-002`.
    """
    xs = sorted(values)
    n = len(xs)
    if n == 0:
        raise ValueError("median of an empty sequence")
    mid = n // 2
    if n % 2 == 1:
        return xs[mid]
    return (xs[mid - 1] + xs[mid]) / 2.0


def mad(values: Sequence[float]) -> float:
    """`median(|x_i - median(x)|)`."""
    if not values:
        raise ValueError("mad of an empty sequence")
    m = median(values)
    return median([abs(x - m) for x in values])


def theil_sen(points: Sequence[Tuple[float, float]]) -> Tuple[float, List[float]]:
    """Median of all pairwise slopes, and the pairwise slopes themselves.

    Zero-time pairs are never formed (Part II §19.6): a pair sharing a timestamp
    has no slope, and forming one would divide by zero or -- worse -- be guarded
    with an epsilon that quietly invents a very large slope.
    """
    slopes: List[float] = []
    n = len(points)
    for i in range(n):
        for j in range(i + 1, n):
            ti, ai = points[i]
            tj, aj = points[j]
            if tj == ti:
                continue
            slopes.append((aj - ai) / (tj - ti))
    if not slopes:
        raise ValueError("no pairwise slope could be formed")
    return median(slopes), slopes


def theil_sen_intercept(points: Sequence[Tuple[float, float]], slope: float) -> float:
    """`median(A_i - S t_i)`, the canonical intercept for a Theil-Sen fit."""
    return median([a - slope * t for t, a in points])


def sxx(times: Sequence[float]) -> Tuple[float, float]:
    """`(t_bar, sum (t_i - t_bar)^2)`."""
    t_bar = sum(times) / len(times)
    return t_bar, sum((t - t_bar) ** 2 for t in times)


# ---------------------------------------------------------------------------
# Exact-decimal threshold predicates
# ---------------------------------------------------------------------------


def dec(value: float) -> Decimal:
    """The exact decimal an entered or configured value was written as.

    `ALK-DECIMAL-THRESHOLD-001` (owner decision 18): where both operands of a
    canonical threshold predicate are exact decimals -- a stored measurement, a
    difference of stored measurements, a frozen decimal canon constant -- the
    comparison runs on the decimals, at the entered precision, with no
    pre-rounding and no epsilon. `Decimal(repr(x))` recovers the decimal the
    binary64 was parsed from, which is the value the keeper typed.

    In scope: `ALK-005`'s repeat spread, `ALK-004`'s range edges, `ALK-003A`'s
    outer bounds. Out of scope and unchanged: every predicate over a derived
    quantity -- slopes, sigmas, caps -- which stays binary64.
    """
    return Decimal(repr(float(value)))


# ---------------------------------------------------------------------------
# Computed<T>
# ---------------------------------------------------------------------------

RUN = "RUN"
NOT_RUN = "NOT_RUN"
WITHHELD = "WITHHELD"
NONE_VALUE = "NONE"


@dataclass
class Computed:
    """`Value(T) | NotRun(codes) | Withheld(codes)`.

    `ALK-V2-MODULE-DESIGN.md` §3: a three-state result makes "returned nothing
    without saying why" unrepresentable rather than merely forbidden.
    `INV-I4` and schema invariant 8 then hold, because there is no way to
    construct a refusal without the codes that explain it.
    """

    state: str
    value: Any = None
    codes: List[str] = field(default_factory=list)

    @staticmethod
    def of(value: Any) -> "Computed":
        return Computed(RUN, value)

    @staticmethod
    def not_run(*codes: str) -> "Computed":
        return Computed(NOT_RUN, None, list(codes))

    @staticmethod
    def withheld(*codes: str) -> "Computed":
        return Computed(WITHHELD, None, list(codes))

    @property
    def ran(self) -> bool:
        return self.state == RUN

    def rendered(self) -> Any:
        """The value, or the first-class marker that stands in its place."""
        return self.value if self.ran else self.state


# ---------------------------------------------------------------------------
# Numbers on the way out
# ---------------------------------------------------------------------------


def finite(x: Any) -> bool:
    return isinstance(x, (int, float)) and not isinstance(x, bool) and math.isfinite(x)


def clean(value: Any) -> Any:
    """Normalise `-0.0` to `0.0` on the way into the result.

    `WG-ALK-002` asserts `supportedSlopeDkhPerDay: 0.0` on a *falling* series,
    where `sign(S) * max(0, ...)` produces `-0.0`. The comparator's tolerance
    check passes either way, but the canonical JSON serialisation `INV-A1`
    compares is byte-level, and `-0.0` and `0.0` are different bytes. A sign on
    a zero is not a fact about the tank.
    """
    if isinstance(value, float) and value == 0.0:
        return 0.0
    if isinstance(value, dict):
        return {k: clean(v) for k, v in value.items()}
    if isinstance(value, list):
        return [clean(v) for v in value]
    return value


def sign(x: float) -> int:
    if x > 0:
        return 1
    if x < 0:
        return -1
    return 0


def as_dict(obj: Dict[str, Any]) -> Dict[str, Any]:
    """Drop keys whose value is `None`.

    `None` is not one of the contract's three states. A field that has nothing
    to say is either absent by design or carries `NOT_RUN` / `WITHHELD` /
    `NONE`; a `null` in the output would be a fourth state nobody declared.
    """
    return {k: v for k, v in obj.items() if v is not None}
