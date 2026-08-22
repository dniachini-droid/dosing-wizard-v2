"""L1 — facts. The event ledger, totally ordered, and the configuration snapshot.

Nothing here interprets. It reads the events the caller supplied, gives them a
total order that does not depend on how they arrived, and resolves the
configuration version effective at `assessmentAsOf`.

The total order is the determinism contract's item 3 —
`(absoluteInstant, eventOrdinal, eventId)` — and `INV-A1` is its negative
control: reversing or rotating the input array must not change one byte of the
output.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import kernel
from .kernel import Instant, parse_instant

# Event kinds the executable fixture format declares (§4.1).
READING = "READING"
READING_SERIES = "READING_SERIES"
DOSE_STATE = "DOSE_STATE"
DOSE_CHANGE = "DOSE_CHANGE"
MANUAL_CORRECTION = "MANUAL_CORRECTION"
WATER_CHANGE = "WATER_CHANGE"
DELIVERY_ANOMALY = "DELIVERY_ANOMALY"
CONSUMPTION_CONTEXT_EVENT = "CONSUMPTION_CONTEXT_EVENT"

#: The four time provenances `SHARED-LEGACY-TIME-001` declares (canon Part II
#: §2.3A). The first two carry an `absoluteInstant`; the last two carry no
#: usable instant and, under owner decision 30, are **silently** ineligible for
#: elapsed-time inference. A value outside this set is not a provenance the
#: contract knows and is a validation refusal, not a fifth behaviour.
TIME_PROVENANCES = (
    "EXACT_ABSOLUTE",
    "RECONSTRUCTED_WITH_PROVENANCE",
    "LOCAL_TIME_ZONE_UNKNOWN",
    "DATE_ONLY",
)

#: The wire field a provenance with no usable instant carries its day in
#: (`ALK-V2-DATA-CONTRACT.md` §1 `ObservedTime`, owner decision 30). Reading a
#: day out of `measuredAt` instead is deliberately **not** offered: a record
#: with one of these provenances must not carry an `absoluteInstant` at all, and
#: taking a day from one would take the day whoever fabricated it chose.
_DAY_FIELD = {
    "DATE_ONLY": "calendarDate",
    "LOCAL_TIME_ZONE_UNKNOWN": "localDateTime",
}

_DAY = re.compile(r"^\d{4}-\d{2}-\d{2}$")


#: Which field carries each kind's own instant.
_TIME_FIELD = {
    READING: "measuredAt",
    READING_SERIES: "startAt",
    DOSE_STATE: "effectiveAt",
    DOSE_CHANGE: "effectiveAt",
    MANUAL_CORRECTION: "occurredAt",
    WATER_CHANGE: "occurredAt",
    DELIVERY_ANOMALY: "fromAt",
    CONSUMPTION_CONTEXT_EVENT: "occurredAt",
}


@dataclass
class Event:
    kind: str
    at: Optional[Instant]
    raw: Dict[str, Any]
    ordinal: int
    event_id: str = ""

    def get(self, key: str, default: Any = None) -> Any:
        return self.raw.get(key, default)


@dataclass
class Reading:
    """One raw test result. `rawValueDkh` is never overwritten (schema §10.1)."""

    reading_id: str
    at: Instant
    raw_value_dkh: float
    status: str = "VALID"
    ordinal: int = 0


@dataclass
class UntimedReading:
    """One raw test result whose record carries **no usable instant**.

    `DATE_ONLY` and `LOCAL_TIME_ZONE_UNKNOWN` (canon Part II §2.3A). It is a real
    measurement and is kept: it serves current position under §2.3A.2, and the
    application charts it and counts it in descriptive statistics. What it never
    does is take part in an inference that needs elapsed time -- and under owner
    decision 30 it never says so either, which is why this class carries no
    reason code, no capability state and no flag. The engine simply does not use
    it, and the silence is the point.

    It is a separate type from `Reading` rather than a `Reading` with an optional
    instant, so that no elapsed-time code path can be handed one by accident: the
    exclusion is enforced by the type, not by remembering to check a field.
    """

    reading_id: str
    #: `YYYY-MM-DD`, the day the record states, in the day's own terms. Never
    #: converted through a zone and never widened into an instant.
    day: str
    raw_value_dkh: float
    status: str = "VALID"
    ordinal: int = 0


@dataclass
class Ledger:
    events: List[Event] = field(default_factory=list)
    readings: List[Reading] = field(default_factory=list)
    #: Readings with no usable instant. Never merged into `readings`: every
    #: consumer of `readings` divides by an elapsed interval sooner or later.
    untimed: List[UntimedReading] = field(default_factory=list)
    #: What the ledger could not read, as `(reasonCode | None, payload | text)`.
    #: Nothing is dropped silently: `engine.assess` turns every entry into a
    #: visible reason code or a named line in the insufficiency umbrella.
    problems: List[Any] = field(default_factory=list)
    #: Named here rather than silently tolerated: an event whose `kind` this
    #: engine does not implement is a visible gap, not an event that did not
    #: happen.
    unhandled_kinds: List[str] = field(default_factory=list)

    def of_kind(self, kind: str) -> List[Event]:
        return [e for e in self.events if e.kind == kind]


def _sort_key(e: Event):
    """`(absoluteInstant, eventOrdinal, eventId)`.

    An event with no parseable instant sorts last rather than raising, so a
    malformed timestamp becomes a validation outcome downstream instead of
    deciding the whole assessment here.
    """
    return (
        e.at.epoch_seconds if e.at is not None else float("inf"),
        e.ordinal,
        e.event_id,
    )


def build(events: List[Dict[str, Any]]) -> Ledger:
    """Read the submitted array into a totally ordered ledger.

    `eventOrdinal` is the ledger's own monotonic insertion sequence, and the
    caller does not supply it. Taking it from the position in the submitted
    array would make the sort key depend on the array order it exists to defeat,
    so the ordinal is derived from the event's content: identical events sort
    identically however they arrived, and two genuinely distinct events at one
    instant keep a stable relative order that no reordering of the input can
    disturb.
    """
    led = Ledger()
    prepared: List[Event] = []
    for item in events or []:
        if not isinstance(item, dict):
            led.problems.append((None, "an event in the ledger is not an object and was not read"))
            continue
        kind = item.get("kind")
        if not isinstance(kind, str):
            led.problems.append((None, "an event in the ledger states no kind and was not read"))
            continue
        if kind not in _TIME_FIELD:
            led.unhandled_kinds.append(kind)
            continue
        provenance = item.get("timeProvenance", "EXACT_ABSOLUTE")
        if kind == READING and provenance not in kernel.EXACT_PROVENANCES:
            # Owner decision 30: a reading whose provenance carries no
            # `absoluteInstant` must not be read as though it had one. Any
            # `measuredAt` such a record carries is not the contract's and is
            # not consulted -- `_readings` takes its day from the field the
            # provenance declares, or refuses the record.
            at = None
        else:
            at = parse_instant(item.get(_TIME_FIELD[kind]), provenance)
        prepared.append(
            Event(
                kind=kind,
                at=at,
                raw=item,
                ordinal=_content_ordinal(item),
                event_id=str(item.get("eventId", "")),
            )
        )

    led.events = sorted(prepared, key=_sort_key)
    led.readings, led.untimed = _readings(led)
    return led


def _declared_day(e: Event, provenance: str) -> Optional[str]:
    """The calendar day a record with no usable instant states, or `None`.

    `None` means the record does not honour the shape its own `timeProvenance`
    declares, which *is* a malformed record and is reported as one. A record
    that does honour it is not malformed and reports nothing at all.
    """
    raw = e.get(_DAY_FIELD[provenance])
    if not isinstance(raw, str):
        return None
    day = raw[:10]
    return day if _DAY.match(day) else None


def _content_ordinal(item: Dict[str, Any]) -> int:
    """A stable per-event ordinal derived from the event's own content.

    Not `hash()`: Python randomises string hashing per process, and `INV-A1`'s
    generator runs the engine in a fresh process. A tie broken by a randomised
    hash is a tie broken differently every run.
    """
    import hashlib
    import json

    blob = json.dumps(item, sort_keys=True, separators=(",", ":"), default=str)
    return int(hashlib.sha256(blob.encode("utf-8")).hexdigest()[:12], 16)


def _readings(led: Ledger):
    """Every `READING` in the ledger, split by whether it carries a usable instant.

    `READING_SERIES` is **not** expanded. `OD-014` records that its expansion
    has no owner and that two implementations of it already exist; a third
    written from a one-line table row would make three owners of one inference,
    which `MASTER RULE 1` calls a defect rather than a coincidence. The engine
    therefore reports the series as unhandled and the assessment refuses on the
    evidence it does have, rather than guessing at a shape nobody owns.

    **The split is owner decision 30** (canon Part II §2.3A.1). A reading whose
    `timeProvenance` is `DATE_ONLY` or `LOCAL_TIME_ZONE_UNKNOWN` carries no
    `absoluteInstant` **by contract**. It is not malformed, it is not dropped,
    and it produces no reason code, no problem entry and no capability
    degradation: it goes to `untimed`, where position can reach it and no
    elapsed-time consumer can. The one thing that would be dishonest here is
    treating the contract being honoured as a validation failure, which is what
    this engine did before the amendment and is exactly the announcement the
    decision removes.
    """
    timed: List[Reading] = []
    untimed: List[UntimedReading] = []
    for e in led.events:
        if e.kind == READING_SERIES:
            led.unhandled_kinds.append(READING_SERIES)
            continue
        if e.kind != READING:
            continue

        provenance = str(e.get("timeProvenance", "EXACT_ABSOLUTE"))
        if provenance not in TIME_PROVENANCES:
            # Not one of the four the contract declares. A name nobody owns is
            # not a fifth behaviour to guess at.
            led.problems.append(
                ("VALIDATION_TIMESTAMP_INVALID",
                 {"enteredAt": provenance,
                  "readingId": e.event_id or "UNKNOWN"})
            )
            continue

        value = e.get("rawValueDkh")

        if provenance not in kernel.EXACT_PROVENANCES:
            day = _declared_day(e, provenance)
            if day is None:
                # The record claims a provenance and does not carry the field
                # that provenance declares. That is malformed, and unlike the
                # honoured case it is reported.
                led.problems.append(
                    ("VALIDATION_TIMESTAMP_INVALID",
                     {"enteredAt": e.get(_DAY_FIELD[provenance], "UNKNOWN"),
                      "readingId": e.event_id or "UNKNOWN"})
                )
                continue
            if not kernel.finite(value):
                led.problems.append(
                    ("VALIDATION_VALUE_NOT_FINITE",
                     {"enteredValue": value if value is not None else "UNKNOWN",
                      "readingId": e.event_id or f"R-{day}"})
                )
                continue
            untimed.append(
                UntimedReading(
                    reading_id=e.event_id or f"R-{day}",
                    day=day,
                    raw_value_dkh=float(value),
                    status=str(e.get("status", "VALID")),
                    ordinal=e.ordinal,
                )
            )
            continue

        if e.at is None:
            # A record that CLAIMS a usable instant and does not supply a
            # readable one. Nothing is dropped silently: the engine records what
            # it could not read so `engine.assess` can say so in a reason code.
            # A keeper who entered four readings must never be told "2 clusters,
            # need 3" with no account of where the other two went.
            led.problems.append(
                ("VALIDATION_TIMESTAMP_INVALID",
                 {"enteredAt": e.get(_TIME_FIELD[READING], "UNKNOWN"),
                  "readingId": e.event_id or "UNKNOWN"})
            )
            continue
        if not kernel.finite(value):
            led.problems.append(
                ("VALIDATION_VALUE_NOT_FINITE",
                 {"enteredValue": value if value is not None else "UNKNOWN",
                  "readingId": e.event_id or f"R-{e.at.text}"})
            )
            continue
        timed.append(
            Reading(
                reading_id=e.event_id or f"R-{e.at.text}",
                at=e.at,
                raw_value_dkh=float(value),
                status=str(e.get("status", "VALID")),
                ordinal=e.ordinal,
            )
        )
    return timed, untimed


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------


@dataclass
class Configuration:
    values: Dict[str, Any]
    version_id: str
    effective_from: Optional[Instant]
    resolved: bool = True
    #: Set when the assessment instant precedes every proven version
    #: (`WG-ALK-065`): the replay needs configuration older than anything the
    #: ledger can prove, and inventing one would date a rule to before it
    #: existed.
    historical_unavailable: bool = False

    def num(self, key: str, default: Optional[float] = None) -> Optional[float]:
        v = self.values.get(key, default)
        return float(v) if kernel.finite(v) else None

    def get(self, key: str, default: Any = None) -> Any:
        return self.values.get(key, default)


def resolve_configuration(
    history: List[Dict[str, Any]], as_of: Instant
) -> Configuration:
    """The configuration version effective at `assessmentAsOf` (canon §518).

    The harness sends the fixture's whole history and deliberately does not
    pre-select an entry, because choosing is the engine's rule to apply. Where
    an entry states no `effectiveFrom` it is treated as effective from the
    beginning of the ledger: a version with no start date is one nobody dated,
    and refusing on it would refuse on every fixture that states a single
    snapshot.
    """
    entries = [h for h in (history or []) if isinstance(h, dict)]
    if not entries:
        return Configuration({}, "UNKNOWN", None, resolved=False)

    dated = []
    undated = []
    for h in entries:
        eff = parse_instant(h.get("effectiveFrom"))
        (dated if eff is not None else undated).append((eff, h))

    if not dated:
        h = undated[-1][1]
        return Configuration(dict(h), str(h.get("configVersionId", "UNKNOWN")), None)

    dated.sort(key=lambda p: p[0].epoch_seconds)
    effective = [p for p in dated if p[0].epoch_seconds <= as_of.epoch_seconds]
    if not effective:
        eff, h = dated[0]
        return Configuration(
            dict(h),
            str(h.get("configVersionId", "UNKNOWN")),
            eff,
            historical_unavailable=True,
        )
    eff, h = effective[-1]
    return Configuration(dict(h), str(h.get("configVersionId", "UNKNOWN")), eff)
