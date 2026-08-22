"""Executable forms of the invariants, and an honest account of the rest.

The rule this module enforces on itself: **every invariant in
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
# `OWNED_BY_PACKAGE_GATE` used to sit here. It said that `INV-I8`, `INV-I9` and
# `INV-I10` were executed by the alk-v2 package's own validator and that
# implementing them here as well would give one rule two owners. The owner has
# since decided one gate: the validator is retired and its checks were absorbed
# into `package_checks.py`. All three are now delegated below, to the buckets
# that execute them, and none of them is unowned for a single commit --
# `docs/process/GATE-CHECK-INVENTORY.md` and `DECISIONS.md` `DEC-019` are the
# record.

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
    # ---- added by ALK_V2_FREEZE_5 -------------------------------------------
    # Sixteen invariants arrived with Freeze 5. The harness's completeness
    # assertion caught every one of them the moment the branch was rebased,
    # which is that assertion doing its job on a real change rather than on a
    # mutation. Each is accounted for below; none is executed yet.
    "INV-C12": NO_ENGINE_BEHAVIOUR,
    "INV-C13": NO_ENGINE_BEHAVIOUR,
    "INV-C14": NO_ENGINE_BEHAVIOUR,
    "INV-C15": NO_ENGINE_BEHAVIOUR,
    "INV-G10": NO_ENGINE_BEHAVIOUR,
    "INV-G11": NO_ENGINE_BEHAVIOUR,
    "INV-G12": NO_ENGINE_BEHAVIOUR,
    "INV-G13": NO_ENGINE_BEHAVIOUR,
    "INV-G14": NO_ENGINE_BEHAVIOUR,
    "INV-G15": NO_ENGINE_BEHAVIOUR,
    "INV-G16": NO_ENGINE_BEHAVIOUR,
    "INV-G17": NO_ENGINE_BEHAVIOUR,
}

#: Invariants this module executes, and the CHK-* checks that carry the
#: document-level part of an invariant whose full form needs source code.
EXECUTED_HERE = (
    "INV-A1",
    "INV-A2",
    "INV-A3",
    "INV-H6",
    "INV-I7",
    "INV-B7",
    "INV-I2",
    "INV-I3",
    "INV-I8",
    "INV-I9",
    "INV-I10",
)

DELEGATED_TO_CHECKS = {
    "INV-B7": "CHK-DIMENSION-SAFETY",
    "INV-I2": "CHK-RC-OWNER",
    "INV-I3": "CHK-RC-CLOSURE-DOC + CHK-RC-CLOSURE-ENGINE",
    # Absorbed from the retired freeze validator. Unlike the three above these
    # are executed in full, not in part: their subject is a document, and the
    # document is here.
    "INV-I8": "CHK-DECISION-COVERAGE",
    "INV-I9": "CHK-CANON-MANIFEST",
    "INV-I10": "CHK-FIXTURE-ARITHMETIC",
}

#: Delegated invariants whose executable form is complete, so the report must
#: not append the "the full invariant additionally requires scanning engine
#: source" caveat that applies to `INV-B7`, `INV-I2` and `INV-I3`.
FULLY_DELEGATED = ("INV-I8", "INV-I9", "INV-I10")


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
                    "asOf": f.resolved_as_of,
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


def _string_values(node: Any, path: str = "") -> List[Tuple[str, str]]:
    """Every string in the result, with the path it sits at."""
    out: List[Tuple[str, str]] = []
    if isinstance(node, dict):
        for k, v in node.items():
            out.extend(_string_values(v, f"{path}.{k}" if path else k))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            out.extend(_string_values(v, f"{path}[{i}]"))
    elif isinstance(node, str):
        out.append((path, node))
    return out


def _untimed_readings(inp: Dict[str, Any]) -> List[Dict[str, Any]]:
    """`READING` events that honour a provenance carrying no usable instant.

    The predicate is **carries one of the contract's declared day fields**, not
    *has no absolute-time field*. Those are different sets and the difference
    matters twice:

    * a record carrying `calendarDate` **and** a stray `measuredAt` is still a
      record with no usable instant -- `ledger.build` routes it by its
      provenance, not by which fields happen to be present -- and the weaker
      predicate did not see it;
    * a record carrying neither an instant nor a day is **malformed**, is
      correctly named by `VALIDATION_TIMESTAMP_INVALID`, and must not be a
      subject here or the check would forbid the naming the contract requires.

    `corpus._DECLARED_DAY_FIELDS` is the corpus's own statement of those fields,
    so nothing is transcribed.
    """
    return [
        e
        for e in (inp.get("events") or [])
        if isinstance(e, dict)
        and e.get("kind") == "READING"
        and any(k in e for k in corpus_mod._DECLARED_DAY_FIELDS)
    ]


#: Result fields whose value is the assessment instant the CALLER supplied, or
#: is derived from it. They are excluded from the day sweep by path: an untimed
#: reading dated on the assessment day would otherwise be "named" by a field
#: that names the caller's own argument and knows nothing about any reading.
_CALLER_INSTANT_PATHS = ("assessmentAsOf", "assessmentId", "auditTraceId")


def _inv_h6(engine: ea.Engine, c: corpus_mod.Corpus) -> InvariantOutcome:
    """A record with no usable instant never announces itself.

    `SHARED-LEGACY-TIME-001` Part II §2.3A.1 clause 1, owner decision 30. The
    keeper is not told which specific records were skipped or why, and is not
    told which were used either -- naming the eligible records names the rest by
    omission.

    Four checks, and **every subject is read out of the fixture's own input**.
    The check transcribes no provenance name, no field name and no reason code,
    so it keeps testing the right thing across a vocabulary change and cannot
    pass by looking only at what it already knows about.

    1. no provenance token the input carried is quoted back, in either direction;
    2. no untimed record's stated day appears in the result;
    3. no untimed record's event id appears in the result;
    4. **the capability set is byte-identical with and without those readings.**

    Check 4 is the one that makes the invariant match its own text. Clause 1
    names capability degradation explicitly, and the first three checks cannot
    see it: a restored `M-8` / `M-13` `DEGRADE` carrying no reason code changes
    no string in the result, so it passed all three. Rather than transcribe
    `M-8` and `M-13` -- which would be this harness naming a canon vocabulary it
    does not own -- the check submits the same ledger twice, once with the
    untimed readings removed, and requires `capabilities[]` to be unchanged.
    That is the property stated directly: **their presence changes nothing about
    what the engine says it could look at.**
    """
    violations: List[str] = []
    ran = 0
    subjects = 0
    uninformative = 0
    for fid, req in _executable_requests(c):
        untimed = _untimed_readings(req)
        if not untimed:
            continue
        subjects += 1
        reply = engine.assess(copy.deepcopy(req))
        if not reply.ok:
            violations.append(f"{fid}: engine produced no result ({reply.error})")
            continue
        ran += 1
        strings = [
            (path, value)
            for path, value in _string_values(reply.result)
            if path.split("[")[0] not in _CALLER_INSTANT_PATHS
        ]

        # 1 -- no provenance token the input carried is quoted back.
        provenances = {
            e["timeProvenance"]
            for e in (req.get("events") or [])
            if isinstance(e, dict) and isinstance(e.get("timeProvenance"), str)
        }
        for path, value in strings:
            for token in provenances:
                if token in value:
                    violations.append(
                        f"{fid}: the result quotes the time provenance `{token}` at "
                        f"`{path}`; §2.3A.1 clause 1 forbids reporting a record's "
                        f"provenance, in either direction"
                    )

        # 2 -- no untimed record's day, and 3 -- no untimed record's id.
        #
        # A day the ledger ALSO carries an instant on is skipped, and counted.
        # The test is a substring search, and on such a day it cannot tell the
        # untimed record's day from the timed record's own instant rendered into
        # a cluster id -- `CL-2026-09-01T08:00:00+10:00` contains `2026-09-01`
        # because the timed reading is on that day, not because anything was
        # announced. Skipping it silently would be the worse error: the count is
        # reported so the check never claims coverage it does not have, and
        # checks 3 and 4 remain fully informative on exactly those records.
        ledger_days = {
            str(e[k])[:10]
            for e in (req.get("events") or [])
            if isinstance(e, dict)
            for k in corpus_mod._ABSOLUTE_TIME_FIELDS
            if isinstance(e.get(k), str)
        }
        # The assessment instant's own day too. It is the CALLER's argument and
        # it is rendered legitimately all over the result -- window ends,
        # forecast horizons, retest times. An untimed record dated on the
        # assessment day would otherwise be reported as "named" by a field that
        # knows nothing about it. `AD-TIME-006` is that case.
        if isinstance(req.get("asOf"), str):
            ledger_days.add(req["asOf"][:10])
        for u in untimed:
            days = {
                str(v)[:10]
                for key, v in u.items()
                if key in corpus_mod._DECLARED_DAY_FIELDS and isinstance(v, str)
            }
            for day in days:
                if len(day) != 10 or day.count("-") != 2:
                    continue
                if day in ledger_days:
                    uninformative += 1
                    continue
                for path, value in strings:
                    if day in value:
                        violations.append(
                            f"{fid}: the result names {day} at `{path}`, the day of a "
                            f"record with no usable instant; the keeper is not told "
                            f"which records were skipped"
                        )
            eid = u.get("eventId")
            if isinstance(eid, str) and eid:
                for path, value in strings:
                    if eid in value:
                        violations.append(
                            f"{fid}: the result names the record `{eid}` at `{path}`, "
                            f"which carries no usable instant"
                        )

        # 4 -- the capability set does not move.
        without = copy.deepcopy(req)
        without["events"] = [e for e in (req.get("events") or []) if e not in untimed]
        other = engine.assess(without)
        if not other.ok:
            violations.append(
                f"{fid}: the engine produced no result for the same ledger with the "
                f"readings that carry no usable instant removed ({other.error}); the "
                f"capability comparison could not be made"
            )
        elif _canonical(other.result.get("capabilities")) != _canonical(
            reply.result.get("capabilities")
        ):
            violations.append(
                f"{fid}: the capability set changes when readings with no usable "
                f"instant are present; §2.3A.1 clause 1 forbids a capability "
                f"degradation, and a degradation carrying no reason code is still one"
            )

    if not subjects:
        # An empty subject set is a defect, not an abstention. `AD-TIME-001` and
        # `AD-TIME-002` are in the index and are pinned there; if neither reaches
        # this check, either they were removed or the predicate above stopped
        # matching them, and both are failures rather than reasons to say nothing.
        violations.append(
            "no executable fixture carries a READING declaring a provenance with no "
            "usable instant, so this invariant checked nothing; AD-TIME-001 and "
            "AD-TIME-002 exist to be its subjects"
        )

    return InvariantOutcome(
        inv_id="INV-H6",
        title="A record with no usable instant never announces itself",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{subjects} executable fixture(s) carry a READING declaring a provenance "
            f"with no usable instant; {ran} returned a result. Each result was swept "
            f"for a quoted time provenance, for such a record's stated day and for its "
            f"event id, and each ledger was resubmitted without those readings and the "
            f"capability set required to be byte-identical -- every subject read out of "
            f"the fixture's own input. {uninformative} day(s) were skipped by the day "
            f"sweep as uninformative, being days the ledger also carries an instant on; "
            f"checks 3 and 4 still cover those records"
        ),
        violations=violations,
    )


def _inv_i7(engine: ea.Engine, c: corpus_mod.Corpus) -> InvariantOutcome:
    """No retired reason code is emitted.

    Executable since an engine exists. The retired set is parsed from the
    catalogue's own "Retired by ..." tables at run time, so retiring a code adds
    it to this check and nothing has to be edited here.

    It sweeps the **whole** result rather than `reasonCodes[]` alone: a
    capability row's `capabilityReasonCode` is an emitted code too, and reading
    only the top-level array is how `CAPABILITY_MEASUREMENT_TIME_IMPRECISE`
    could have come back through `capabilities[]` unnoticed.
    """
    cat = rc_mod.load()
    retired = set(cat.retired) - set(cat.codes)
    violations: List[str] = []
    ran = 0
    for fid, req in _executable_requests(c):
        reply = engine.assess(copy.deepcopy(req))
        if not reply.ok:
            violations.append(f"{fid}: engine produced no result ({reply.error})")
            continue
        ran += 1
        for path, value in _string_values(reply.result):
            if value in retired:
                violations.append(
                    f"{fid}: the retired code `{value}` is emitted at `{path}`; "
                    f"a retired code has no reachable state and is outside the "
                    f"closed set"
                )
    return InvariantOutcome(
        inv_id="INV-I7",
        title="No retired reason code is emitted",
        status=FAIL if violations else (PASS if ran else NOT_EXECUTABLE),
        what_was_checked=(
            f"every string in {ran} engine result(s) compared against the "
            f"{len(retired)} codes the catalogue's retired tables list, parsed at "
            f"run time"
        ),
        violations=violations,
        not_executable_reason="" if ran else "no engine reply to sweep",
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
    for fn in (_inv_a1, _inv_a2, _inv_a3, _inv_h6, _inv_i7):
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
                        f"executed in full by {chk}"
                        if inv_id in FULLY_DELEGATED
                        else f"the part executable without implementation source, "
                        f"carried by {chk}"
                    ),
                    detail=(
                        ""
                        if inv_id in FULLY_DELEGATED
                        else "the full invariant additionally requires scanning "
                        "engine source, which does not exist yet"
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
