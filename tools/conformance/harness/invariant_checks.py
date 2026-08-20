"""Executable forms of the invariants, and an honest account of the rest.

The rule this module enforces on itself: **every one of the 60 invariants in
`ALK-V2-INVARIANTS.md` is either executed here or appears in
`NOT_EXECUTABLE_REASONS` with a stated reason.** The runner asserts that the
two sets partition the document exactly, so an invariant added to the document
and forgotten here becomes a harness failure rather than silently counting as
covered.

That assertion is the antidote to the failure the harness brief names: a
report of "0 unreadable" that means "0 of the things I know how to look at".
"""

from __future__ import annotations

import copy
import json
import os
import time
from typing import Any, Callable, Dict, List, Optional, Tuple

from . import corpus as corpus_mod
from . import data_contract as dc_mod
from . import engine_adapter as ea
from . import invariants_doc as idoc_mod
from . import reason_codes as rc_mod
from .results import FAIL, NOT_EXECUTABLE, PASS, InvariantOutcome

# ---------------------------------------------------------------------------
# Why each non-executed invariant is not executed.
#
# Three honest reasons, and no fourth:
#   NO_ENGINE_BEHAVIOUR  the property is about what an engine computes, and no
#                        engine exists. It becomes executable the moment one
#                        does; nothing else is needed.
#   NO_CODE_SUBJECT      the property is a static/structural check over source
#                        modules (import graphs, constants in a pipeline).
#                        There is no source to scan.
#   NO_EXECUTABLE_FORM   the property cannot be reduced to a machine check even
#                        with an engine, or its inputs are not derivable from
#                        anything in the repository.
# ---------------------------------------------------------------------------

NO_ENGINE_BEHAVIOUR = (
    "needs engine behaviour; no V2 engine exists (PROJECT-STATE.md). Becomes "
    "executable as a property test as soon as an engine implements the "
    "documented (eventLedger, configurationHistory, asOf) interface."
)
NO_CODE_SUBJECT = (
    "is a static check over implementation source (import graph, constants in a "
    "named pipeline, field declarations). No V2 source exists to scan; the "
    "document-level shadow of it that could be run today is reported as a "
    "CHK-* check instead."
)
NO_EXECUTABLE_FORM = (
    "has no executable form the harness can construct: the property is about "
    "wording, design-review judgement, or a quantity the canon deliberately "
    "leaves unassigned for alkalinity."
)

NOT_EXECUTABLE_REASONS: Dict[str, str] = {
    # Group A
    "INV-A4": NO_ENGINE_BEHAVIOUR,
    # Group B
    "INV-B1": NO_ENGINE_BEHAVIOUR,
    "INV-B2": NO_ENGINE_BEHAVIOUR,
    "INV-B3": NO_ENGINE_BEHAVIOUR,
    "INV-B4": NO_CODE_SUBJECT,
    "INV-B5": NO_ENGINE_BEHAVIOUR,
    "INV-B6": NO_CODE_SUBJECT,
    # Group C
    "INV-C1": NO_ENGINE_BEHAVIOUR,
    "INV-C2": NO_ENGINE_BEHAVIOUR,
    "INV-C3": NO_ENGINE_BEHAVIOUR,
    "INV-C4": NO_ENGINE_BEHAVIOUR,
    "INV-C5": NO_ENGINE_BEHAVIOUR,
    "INV-C6": NO_ENGINE_BEHAVIOUR,
    "INV-C7": NO_ENGINE_BEHAVIOUR,
    "INV-C8": NO_ENGINE_BEHAVIOUR,
    "INV-C9": NO_ENGINE_BEHAVIOUR,
    "INV-C10": NO_ENGINE_BEHAVIOUR,
    "INV-C11": NO_ENGINE_BEHAVIOUR,
    # Group D
    "INV-D1": NO_ENGINE_BEHAVIOUR,
    "INV-D2": NO_ENGINE_BEHAVIOUR,
    "INV-D3": NO_ENGINE_BEHAVIOUR,
    "INV-D4": NO_ENGINE_BEHAVIOUR,
    "INV-D5": NO_ENGINE_BEHAVIOUR,
    "INV-D6": NO_ENGINE_BEHAVIOUR,
    # Group E
    "INV-E1": NO_ENGINE_BEHAVIOUR,
    "INV-E2": NO_ENGINE_BEHAVIOUR,
    "INV-E3": NO_ENGINE_BEHAVIOUR,
    "INV-E4": NO_ENGINE_BEHAVIOUR,
    "INV-E5": NO_ENGINE_BEHAVIOUR,
    "INV-E6": NO_ENGINE_BEHAVIOUR,
    "INV-E7": NO_ENGINE_BEHAVIOUR,
    "INV-E8": NO_ENGINE_BEHAVIOUR,
    # Group F
    "INV-F1": NO_ENGINE_BEHAVIOUR,
    "INV-F2": NO_ENGINE_BEHAVIOUR,
    "INV-F3": NO_ENGINE_BEHAVIOUR,
    "INV-F4": NO_ENGINE_BEHAVIOUR,
    # Group G
    "INV-G1": NO_ENGINE_BEHAVIOUR,
    "INV-G2": NO_ENGINE_BEHAVIOUR,
    "INV-G3": NO_ENGINE_BEHAVIOUR,
    "INV-G4": NO_ENGINE_BEHAVIOUR,
    "INV-G5": NO_ENGINE_BEHAVIOUR,
    "INV-G6": NO_ENGINE_BEHAVIOUR,
    "INV-G7": NO_ENGINE_BEHAVIOUR,
    "INV-G8": NO_ENGINE_BEHAVIOUR,
    "INV-G9": NO_ENGINE_BEHAVIOUR,
    # Group H
    "INV-H1": NO_ENGINE_BEHAVIOUR,
    "INV-H2": NO_CODE_SUBJECT,
    "INV-H3": NO_ENGINE_BEHAVIOUR,
    "INV-H4": NO_ENGINE_BEHAVIOUR,
    "INV-H5": NO_ENGINE_BEHAVIOUR,
    # Group I
    "INV-I1": NO_CODE_SUBJECT,
    "INV-I4": NO_ENGINE_BEHAVIOUR,
    "INV-I5": NO_ENGINE_BEHAVIOUR,
    "INV-I6": NO_ENGINE_BEHAVIOUR,
}

#: Invariants this module executes, and the CHK-* checks that carry the
#: document-level part of an invariant whose full form needs source code.
EXECUTED_HERE = ("INV-A1", "INV-A2", "INV-A3", "INV-B7", "INV-I2", "INV-I3")

DELEGATED_TO_CHECKS = {
    "INV-B7": "CHK-DIMENSION-SAFETY",
    "INV-I2": "CHK-RC-OWNER",
    "INV-I3": "CHK-RC-CLOSURE-DOC + CHK-RC-CLOSURE-ENGINE",
}


def _canonical(obj: Any) -> str:
    """Stable serialisation, so "byte-identical" is a real comparison."""
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), default=str)


def _executable_requests(c: corpus_mod.Corpus) -> List[Tuple[str, Dict[str, Any]]]:
    out: List[Tuple[str, Dict[str, Any]]] = []
    config = (c.config_defaults.get("configurations") or {}).get("CANON_DEFAULT") or {}
    for f in c.of_class(corpus_mod.EXECUTABLE):
        inp = f.body.get("input") or {}
        cfg = dict(config)
        cfg.update(f.body.get("config") or {})
        out.append(
            (
                f.fixture_id,
                {
                    "op": "assess",
                    "requestId": f"req-{abs(hash(f.fixture_id)) % 10**12:012d}",
                    "asOf": inp.get("asOf"),
                    "events": copy.deepcopy(inp.get("events") or []),
                    "configuration": cfg,
                    "configurationHistory": [cfg],
                },
            )
        )
    return out


def _inv_a1(engine: ea.Engine, c: corpus_mod.Corpus) -> InvariantOutcome:
    """Same inputs, any event order, repeated runs -> identical output."""
    reqs = _executable_requests(c)
    violations: List[str] = []
    ran = 0
    for fid, req in reqs:
        base = engine.assess(copy.deepcopy(req))
        if not base.ok:
            violations.append(f"{fid}: engine produced no result ({base.error})")
            continue
        ran += 1
        first = _canonical(base.result)

        again = engine.assess(copy.deepcopy(req))
        if not again.ok or _canonical(again.result) != first:
            violations.append(f"{fid}: two identical requests produced different output")

        shuffled = copy.deepcopy(req)
        events = shuffled.get("events") or []
        if len(events) > 1:
            shuffled["events"] = list(reversed(events))
            rep = engine.assess(shuffled)
            if not rep.ok:
                violations.append(f"{fid}: reversed event order produced no result")
            elif _canonical(rep.result) != first:
                violations.append(
                    f"{fid}: reversing the input event array changed the output; "
                    f"the sort key must be (absoluteInstant, eventOrdinal, eventId)"
                )

            rotated = copy.deepcopy(req)
            rotated["events"] = events[1:] + events[:1]
            rot = engine.assess(rotated)
            if rot.ok and _canonical(rot.result) != first:
                violations.append(
                    f"{fid}: rotating the input event array changed the output"
                )
    return InvariantOutcome(
        inv_id="INV-A1",
        title="Same valid inputs and configuration produce identical output",
        status=FAIL if violations else (PASS if ran else NOT_EXECUTABLE),
        what_was_checked=(
            f"{len(reqs)} executable fixtures submitted, {ran} of which returned a "
            f"result; each submitted four times: twice unchanged, once with the event "
            f"array reversed and once rotated, requiring a byte-identical canonical "
            f"serialisation each time"
        ),
        violations=violations,
        detail=(
            "PARTIAL. The document's generator for this invariant also asks for a "
            "fresh process and a varied host locale; this run submits in-process "
            "only, so cross-process nondeterminism (a differing hash seed, for "
            "instance) would not be caught here. INV-A2 does vary the host timezone."
        ),
        not_executable_reason="" if ran else "no engine reply to compare",
    )


def _inv_a2(engine: ea.Engine, c: corpus_mod.Corpus) -> InvariantOutcome:
    """No function reads a clock: `assessmentAsOf` is the supplied instant."""
    reqs = _executable_requests(c)
    violations: List[str] = []
    ran = 0
    original_tz = os.environ.get("TZ")
    for fid, req in reqs:
        first = engine.assess(copy.deepcopy(req))
        if not first.ok:
            violations.append(f"{fid}: engine produced no result ({first.error})")
            continue
        ran += 1
        supplied = req.get("asOf")
        reported = first.result.get("assessmentAsOf")
        if reported != supplied:
            violations.append(
                f"{fid}: assessmentAsOf is {reported!r}; the supplied asOf was "
                f"{supplied!r}. The assessment instant must be the passed value, "
                f"never a clock read"
            )
        # Same request under a different host timezone must be identical.
        try:
            os.environ["TZ"] = "America/Los_Angeles"
            time.tzset()  # type: ignore[attr-defined]
            shifted = engine.assess(copy.deepcopy(req))
        finally:
            if original_tz is None:
                os.environ.pop("TZ", None)
            else:
                os.environ["TZ"] = original_tz
            try:
                time.tzset()  # type: ignore[attr-defined]
            except AttributeError:  # pragma: no cover - non-POSIX
                pass
        if shifted.ok and _canonical(shifted.result) != _canonical(first.result):
            violations.append(
                f"{fid}: output changed when the host timezone changed; the engine "
                f"depends on host time"
            )
    return InvariantOutcome(
        inv_id="INV-A2",
        title="No function reads a clock",
        status=FAIL if violations else (PASS if ran else NOT_EXECUTABLE),
        what_was_checked=(
            f"{len(reqs)} executable fixtures submitted, {ran} of which returned a "
            f"result; assessmentAsOf compared to the supplied asOf, and each request "
            f"re-run under a different host timezone requiring identical output"
        ),
        violations=violations,
        not_executable_reason="" if ran else "no engine reply to compare",
    )


def _inv_a3(engine: ea.Engine, c: corpus_mod.Corpus) -> InvariantOutcome:
    """No unseeded randomness or iteration-order dependence."""
    reqs = _executable_requests(c)
    violations: List[str] = []
    ran = 0
    for fid, req in reqs:
        first = engine.assess(copy.deepcopy(req))
        if not first.ok:
            violations.append(f"{fid}: engine produced no result ({first.error})")
            continue
        ran += 1
        baseline = _canonical(first.result)
        for attempt in range(2, 6):
            again = engine.assess(copy.deepcopy(req))
            if not again.ok:
                violations.append(f"{fid}: run {attempt} produced no result")
                break
            if _canonical(again.result) != baseline:
                violations.append(
                    f"{fid}: run {attempt} differs from run 1 with identical input; "
                    f"unseeded randomness or iteration-order dependence"
                )
                break
        # Re-key the configuration mapping in reverse insertion order. A
        # dict-ordering dependence shows up here and nowhere else.
        reordered = copy.deepcopy(req)
        cfg = reordered.get("configuration") or {}
        reordered["configuration"] = {k: cfg[k] for k in reversed(list(cfg))}
        rep = engine.assess(reordered)
        if rep.ok and _canonical(rep.result) != baseline:
            violations.append(
                f"{fid}: reversing configuration key order changed the output"
            )
    return InvariantOutcome(
        inv_id="INV-A3",
        title="No unseeded randomness or iteration-order dependence",
        status=FAIL if violations else (PASS if ran else NOT_EXECUTABLE),
        what_was_checked=(
            f"{len(reqs)} executable fixtures submitted, {ran} of which returned a "
            f"result; each run five times, plus one run with the configuration "
            f"mapping re-keyed in reverse order, all required identical"
        ),
        violations=violations,
        not_executable_reason="" if ran else "no engine reply to compare",
    )


def run_invariants(
    engine: ea.Engine,
    c: corpus_mod.Corpus,
    doc: idoc_mod.InvariantDoc,
    delegated_status: Dict[str, str],
) -> Tuple[List[InvariantOutcome], List[str]]:
    """Execute what can be executed and account for every remaining invariant."""
    outcomes: List[InvariantOutcome] = []
    problems: List[str] = []

    executed: Dict[str, InvariantOutcome] = {}
    for fn in (_inv_a1, _inv_a2, _inv_a3):
        o = fn(engine, c)
        executed[o.inv_id] = o

    for inv in doc.invariants:
        inv_id = inv.inv_id
        if inv_id in executed:
            o = executed[inv_id]
            o.title = inv.title
            o.has_stated_negative_control = inv.has_negative_control
            outcomes.append(o)
            continue
        if inv_id in DELEGATED_TO_CHECKS:
            chk = DELEGATED_TO_CHECKS[inv_id]
            status = delegated_status.get(inv_id, NOT_EXECUTABLE)
            outcomes.append(
                InvariantOutcome(
                    inv_id=inv_id,
                    title=inv.title,
                    status=status,
                    what_was_checked=(
                        f"the part executable without implementation source, carried by "
                        f"{chk}"
                    ),
                    detail=(
                        "the full invariant additionally requires scanning engine "
                        "source, which does not exist yet"
                    ),
                    has_stated_negative_control=inv.has_negative_control,
                )
            )
            continue
        reason = NOT_EXECUTABLE_REASONS.get(inv_id)
        if reason is None:
            problems.append(
                f"{inv_id} is in {doc.source} but the harness neither executes it nor "
                f"states why it cannot. An invariant that is neither run nor accounted "
                f"for is the exact gap this assertion exists to catch."
            )
            reason = "UNACCOUNTED FOR -- see harness failure above"
        outcomes.append(
            InvariantOutcome(
                inv_id=inv_id,
                title=inv.title,
                status=NOT_EXECUTABLE,
                what_was_checked="nothing was executed",
                not_executable_reason=reason,
                has_stated_negative_control=inv.has_negative_control,
            )
        )

    known = set(NOT_EXECUTABLE_REASONS) | set(EXECUTED_HERE)
    for stale in sorted(known - set(doc.ids)):
        problems.append(
            f"the harness accounts for `{stale}`, which no longer appears in "
            f"{doc.source}; the accounting is stale"
        )

    return outcomes, problems
