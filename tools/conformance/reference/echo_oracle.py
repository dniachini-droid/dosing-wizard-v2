"""THE ECHO ORACLE — a negative-control target. **NOT an engine.**

Read this before assuming anything about what it proves.

WHAT IT IS
    A conformant-by-construction stand-in. For each fixture it replays that
    fixture's own declared expectations back as an `EngineResult`, arranged
    into the fields the data contract declares. It therefore passes the
    conformance harness trivially.

WHAT IT IS NOT
    It is not an implementation of the Alk V2 engine and must never become
    one. It computes no slope, no dose, no classification, no retest time. It
    contains **no chemistry**: every number it emits was read out of a fixture
    file microseconds earlier. `CLAUDE.md` forbids adopted chemistry outside
    the canon, and this file adopts none.

WHY IT EXISTS
    Canon `CORE-CANON-COVERAGE-001` item 9: a checker is not trusted as a gate
    until a deliberate mutation of the defect class it targets has been shown
    to fail it. To *show* that, something must exist for the mutation to be
    applied to. The echo oracle is that something, and nothing more.

WHAT A GREEN MUTATION RUN THEREFORE PROVES
    That the harness detects the defect class. It proves nothing whatever
    about any engine's correctness, because there is no engine.

HOW IT FINDS ITS FIXTURE
    Not from the request. The harness deliberately does **not** send a fixture
    id, because the documented interface is a function of
    `(eventLedger, configurationHistory, asOf)` and an id is none of those --
    sending one would hand any engine the key to a published answer table and
    leave the harness unable to tell a correct engine from a lookup. The oracle
    therefore matches on the content of the ledger it was given, using its own
    canonical ordering so that a reordered ledger still finds the same fixture.
    That lookup is a property of *this* stand-in, not of the protocol.

THE THREE THINGS IT DOES COMPUTE, AND WHY
    A pure echo could not be sabotaged by `M-1` (event ordering) or `M-2`
    (clock reads), because a pure echo never looks at the ledger or the
    `asOf`. So the oracle genuinely derives three *structural* quantities from
    its input, none of which is a chemistry decision:

      assessmentAsOf        := the supplied `asOf`, verbatim
      latestValidValueDkh   := the `rawValueDkh` of the latest READING, where
                               "latest" means by absolute instant
      latestValidClusterId  := an id derived from that reading's instant

    Sorting readings by time is not a chemistry rule; it is the determinism
    contract (`ALK-V2-IMPLEMENTATION-CONTRACT.md` §7 item 3). That is exactly
    the property `M-1` sabotages and `INV-A1` catches.
"""

from __future__ import annotations

import copy
import json
import os
import sys
from datetime import datetime
from typing import Any, Callable, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from harness import corpus as corpus_mod  # noqa: E402
from harness import data_contract as dc_mod  # noqa: E402
from harness import reason_codes as rc_mod  # noqa: E402

#: Which declared `EngineResult` field carries which fixture expectation block.
#: This mapping lives in the *oracle*, not in the harness: a reference
#: implementation is allowed to know where its own outputs go, and the harness
#: deliberately resolves expectations by field name instead (see
#: `compare.compare_by_name`) so that it never depends on this table.
BLOCK_TO_FIELD = {
    "expectedIntermediateEvidence": "observedTrajectory",
    "expectedSupportedResult": "supportedTrajectory",
    "expectedAction": "doseRecommendation",
    "expectedRetest": "retest",
}

#: Field values for declared fields the fixtures say nothing about. `NOT_RUN`
#: is a first-class value in the data contract, not a placeholder.
_NOT_RUN = "NOT_RUN"

#: The declared fields this oracle computes rather than echoes, and which are
#: therefore withheld from the derived lift below. Each is the subject of at
#: least one negative control: lifting a fixture's own constant over the
#: computed value would disable that control silently. `M-26` is the control
#: for this exclusion itself.
_COMPUTED_FIELDS = frozenset(
    {
        "assessmentAsOf",
        "latestValidValueDkh",
        "latestValidClusterId",
        "recommendationConfidence",
    }
)


class _Cache:
    corpus: Optional[corpus_mod.Corpus] = None
    contract: Optional[dc_mod.Contract] = None
    catalogue: Optional[rc_mod.Catalogue] = None
    by_content: Optional[Dict[str, Any]] = None


def _load():
    if _Cache.corpus is None:
        _Cache.corpus = corpus_mod.load()
        _Cache.contract = dc_mod.load()
        _Cache.catalogue = rc_mod.load()
    if _Cache.by_content is None:
        _Cache.by_content = {}
        for f in _Cache.corpus.fixtures:
            inp = f.body.get("input") or {}
            if not isinstance(inp, dict):
                continue
            key = _content_key(inp.get("asOf"), inp.get("events") or [])
            _Cache.by_content.setdefault(key, f)
    return _Cache.corpus, _Cache.contract, _Cache.catalogue


def _content_key(as_of: Any, events: Any) -> str:
    """Order-independent identity of a submitted ledger."""
    items = sorted(
        json.dumps(e, sort_keys=True, separators=(",", ":"), default=str)
        for e in (events if isinstance(events, list) else [])
    )
    return json.dumps([as_of, items], separators=(",", ":"))


def _parse_instant(s: Any) -> Optional[datetime]:
    if not isinstance(s, str):
        return None
    try:
        return datetime.fromisoformat(s)
    except ValueError:
        return None


def _sort_key(event: Dict[str, Any], ordinal: int):
    """(absoluteInstant, eventOrdinal, eventId) -- the determinism contract."""
    instant = _parse_instant(event.get("measuredAt") or event.get("effectiveAt"))
    return (
        instant.timestamp() if instant else float("inf"),
        ordinal,
        str(event.get("eventId", "")),
    )


class EchoOracle:
    """Callable request -> EngineResult. Mutations are injected as hooks."""

    def __init__(self, hooks: Optional[Dict[str, Callable]] = None):
        self.hooks = hooks or {}

    # -- hook points -------------------------------------------------------
    def _hook(self, name: str, value: Any, **ctx: Any) -> Any:
        fn = self.hooks.get(name)
        return fn(value, **ctx) if fn else value

    # -- the oracle --------------------------------------------------------
    ENGINE_VERSION = "echo-oracle/0 (NOT AN ENGINE)"

    def __call__(self, request: Dict[str, Any]) -> Dict[str, Any]:
        c, contract, cat = _load()
        if request.get("op") == "describe":
            # Canon §47/§64: a replay is stamped with the version that produced
            # it. Even a stand-in must answer this, or the run cannot say what
            # produced its result.
            return self._hook(
                "describe",
                {
                    "engineVersion": self.ENGINE_VERSION,
                    "canonVersion": (c.index.get("canonAuthority") or ""),
                },
                request=request,
            )
        fixture = (_Cache.by_content or {}).get(
            _content_key(request.get("asOf"), request.get("events") or [])
        )
        body = copy.deepcopy(fixture.body) if fixture else {}
        label = fixture.fixture_id if fixture else "UNMATCHED"

        events: List[Dict[str, Any]] = list(request.get("events") or [])
        ordered = self._hook(
            "order_events",
            sorted((e for e in events), key=lambda e: _sort_key(e, events.index(e))),
            events=events,
            request=request,
        )

        as_of = self._hook("as_of", request.get("asOf"), request=request)

        readings = [e for e in ordered if e.get("kind") == "READING"]
        latest = readings[-1] if readings else None
        latest_value = latest.get("rawValueDkh") if latest else None
        latest_value = self._hook(
            "latest_value", latest_value, reading=latest, request=request
        )

        result: Dict[str, Any] = {}
        for field in contract.engine_result_fields:
            result[field] = _NOT_RUN

        result["assessmentId"] = f"ASSESS-{label}"
        result["assessmentAsOf"] = as_of
        result["parameter"] = "ALK"
        result["engineVersion"] = self.ENGINE_VERSION
        result["canonVersion"] = self._hook(
            "canon_version", c.index.get("canonAuthority") or "", request=request
        )
        result["configVersionId"] = (request.get("configuration") or {}).get(
            "configVersionId", _NOT_RUN
        )
        result["latestValidValueDkh"] = latest_value
        result["latestValidClusterId"] = (
            f"CL-{latest.get('measuredAt')}" if latest else _NOT_RUN
        )
        result["auditTraceId"] = f"TRACE-{label}"
        result["capabilities"] = []

        # A forecast placeholder is emitted only for horizons no fixture block
        # asserts. Emitting all four unconditionally would put the same field
        # name in two places with two values, which `INV-B7` forbids and which
        # the harness duly caught the first time this was written.
        asserted_names = {
            k
            for block in BLOCK_TO_FIELD
            if isinstance(body.get(block), dict)
            for k in body[block]
        }
        forecast = {
            name: "NOT_APPLICABLE"
            for name in (
                "tRangeLowDays",
                "tRangeHighDays",
                "tOuterLowDays",
                "tOuterHighDays",
            )
            if name not in asserted_names
        }
        result["forecast"] = forecast or _NOT_RUN

        for block, field in BLOCK_TO_FIELD.items():
            expected = body.get(block)
            if isinstance(expected, dict):
                payload = {
                    k: v for k, v in expected.items() if k not in ("note", "$comment")
                }
                result[field] = self._hook(
                    "block",
                    payload,
                    block=block,
                    field=field,
                    body=body,
                    request=request,
                )

        # Flat fields the contract declares in their own right and which a
        # fixture block also asserts by name. Every one of them must be lifted,
        # or the same name sits at two places with two values -- `NOT_RUN` at
        # the top level and the real value inside the echoed block -- which is
        # exactly what `INV-B7` forbids and what `compare_by_name` reports.
        #
        # This was a hand-written list of three names (`trajectory`,
        # `movementEvidence`, `position`) and so was correct only for the
        # fixtures that existed when it was written. `AD-RET-004` and
        # `AD-RET-005` assert `outerBoundState`, a fourth declared field, and
        # went red on the collision the moment they became executable. A list
        # that has to be extended every time a fixture is converted is a second
        # owner of the contract's field set; deriving it is the fix, not adding
        # a fourth entry.
        # Deriving the set opened a hazard the hand-written list could not have:
        # it names EVERY declared field, including the four this oracle actually
        # computes. Those four are the only thing the negative controls have to
        # bite on -- `M-1` shuffles the event order to move `latestValidValueDkh`
        # and `latestValidClusterId`, `M-2` moves `assessmentAsOf`, `M-5` rounds
        # before classifying. If a fixture asserted one of them in a block, the
        # lift would overwrite the computed value with the fixture's own
        # constant, the mutation would have nothing left to disturb, and the
        # control would pass while checking nothing.
        #
        # `AD-OUT-001` already asserts `recommendationConfidence` in a block and
        # is harmless only because that assignment happens to sit below the
        # lift. Safety by line ordering is not safety, so the exclusion is
        # explicit and `M-26` fails if it is removed.
        declared = set(contract.engine_result_fields) - _COMPUTED_FIELDS
        for name in sorted(asserted_names & declared):
            for block in BLOCK_TO_FIELD:
                src = body.get(block)
                if isinstance(src, dict) and name in src:
                    result[name] = src[name]
                    break

        codes = list(body.get("expectedReasonCodes") or [])

        # Every field the oracle left `NOT_RUN` must be explained, or `INV-I4`
        # and schema invariant 8 are violated -- "no output is silently
        # absent". The oracle has no computation behind those fields, which is
        # precisely an actionable insufficiency, so it emits the catalogued
        # GATING code for one and names the fields in the payload. This is a
        # structural obligation of the output contract, not a chemistry
        # decision, and the harness caught its absence the first time.
        withheld = sorted(k for k, v in result.items() if v == _NOT_RUN)
        if withheld and "OUTPUT_INSUFFICIENT_DATA_ACTIONABLE" not in codes:
            codes.append("OUTPUT_INSUFFICIENT_DATA_ACTIONABLE")

        codes = self._hook("reason_codes", codes, body=body, request=request)
        result["reasonCodes"] = [
            {
                "code": code,
                "owner": cat.owner_of(code) or "UNKNOWN",
                "severity": cat.severity_of(code) or "INFO",
                "payload": {"assessment": label, "affectedOutputs": withheld},
            }
            for code in codes
        ]

        result["recommendationConfidence"] = "UNSPECIFIED"
        return self._hook("result", result, body=body, request=request)


#: Default instance, for `--engine-callable reference.echo_oracle:assess`.
_default = EchoOracle()


def assess(request: Dict[str, Any]) -> Dict[str, Any]:
    return _default(request)
