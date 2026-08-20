"""THE MUTATION SET — the harness's negative controls.

Canon `CORE-CANON-COVERAGE-001` item 9: *no checker is trusted as a gate until
a deliberate mutation of the defect class it targets has been shown to fail
it.* This module is that requirement applied to the conformance harness
itself.

Each entry is a named, deliberate sabotage of the echo oracle
(`reference/echo_oracle.py`), together with the subjects it is expected to turn
red. `run-mutations.py` applies each in turn and confirms the harness reports
failures it did **not** report on the unmutated baseline.

WHAT A CAUGHT MUTATION PROVES
    That the harness detects that defect class. Nothing more. In particular it
    proves nothing about any engine, because there is no engine yet.

WHAT `BLOCKED` MEANS
    The defect class needs behaviour the echo oracle does not and must not
    have -- writing it would be writing engine code, which this work is
    forbidden to do. Each blocked mutation states the exact condition under
    which it becomes executable.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Callable, Dict, List, Optional

EXECUTABLE = "EXECUTABLE"
BLOCKED = "BLOCKED"


@dataclass
class Mutation:
    mid: str
    title: str
    defect_class: str
    status: str
    #: What the sabotage does, in one sentence.
    sabotage: str
    #: Which harness claim this is the negative control for.
    guards: str
    #: Subject ids expected to go red, as "fixture:ID" / "check:ID" /
    #: "invariant:ID". **Enforced**: a mutation whose declared subjects do not
    #: go red is reported NOT CAUGHT even if something else did.
    expect_red: List[str] = field(default_factory=list)
    #: A substring that must appear in the *text* of at least one new failure.
    #: This is what makes a control prove the mechanism it names rather than
    #: any mechanism at all -- M-11 was credited for four red fixtures that
    #: went red through the ordinary comparator while the checker it claimed
    #: to guard never fired.
    expect_mechanism: str = ""
    hooks: Dict[str, Callable] = field(default_factory=dict)
    #: For BLOCKED entries: exactly what must be true for it to run.
    unblocks_when: str = ""


# ---------------------------------------------------------------------------
# helpers used by the sabotages
# ---------------------------------------------------------------------------

_DKH_SUFFIXES = ("Dkh", "DkhPerDay", "DkhPerMl")


def _programmed_dose(request: Dict[str, Any]) -> Optional[float]:
    """The earliest recorded programmed dose -- `D_history`."""
    doses = [
        e
        for e in (request.get("events") or [])
        if e.get("kind") == "DOSE_STATE" and "programmedDoseMlPerDay" in e
    ]
    if not doses:
        return None
    return doses[0]["programmedDoseMlPerDay"]


def _round_display(value: Any) -> Any:
    return round(value, 1) if isinstance(value, float) else value


# ---------------------------------------------------------------------------
# the sabotages
# ---------------------------------------------------------------------------


def _m1_insertion_order(sorted_events, events, request):
    return list(events)


def _m2_system_clock(as_of, request):
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


def _m3_observed_from_supported(payload, block, field, body, request):
    if block != "expectedIntermediateEvidence":
        return payload
    supported = (body.get("expectedSupportedResult") or {}).get(
        "supportedSlopeDkhPerDay"
    )
    if supported is None or "observedSlopeDkhPerDay" not in payload:
        return payload
    out = dict(payload)
    out["observedSlopeDkhPerDay"] = supported
    return out


def _m4_uncatalogued_code(codes, body, request):
    return list(codes) + ["TRAJECTORY_LOOKS_FINE"]


def _m5_round_before_classifying(payload, block, field, body, request):
    return {
        k: (_round_display(v) if any(k.endswith(s) for s in _DKH_SUFFIXES) else v)
        for k, v in payload.items()
    }


def _m5_round_latest(value, reading, request):
    return _round_display(value)


def _m6_history_for_current(payload, block, field, body, request):
    if "recommendedDoseMlPerDay" not in payload:
        return payload
    d_history = _programmed_dose(request)
    if d_history is None:
        return payload
    out = dict(payload)
    out["recommendedDoseMlPerDay"] = d_history
    return out


def _m7_skip_refusal(codes, body, request):
    return [c for c in codes if c != "OUTPUT_INSUFFICIENT_DATA_ACTIONABLE"]


def _m9_drop_advisory(codes, body, request):
    import os
    import sys

    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from harness import reason_codes as rc_mod

    cat = rc_mod.load()
    return [c for c in codes if cat.severity_of(c) == "INFO"]


_NO_ACTION = {"HOLD_CURRENT_DOSE", "HOLD", "NO_ACTION", "TEST_AGAIN"}


def _m10_recommend_anyway(payload, block, field, body, request):
    if payload.get("action") in _NO_ACTION:
        out = dict(payload)
        out["action"] = "SET_MAINTENANCE_DOSE"
        return out
    return payload


def _m11_forbidden_value(payload, block, field, body, request):
    """Return exactly what the fixture forbids, at its contract location."""
    forbidden = body.get("forbidden") or {}
    out = dict(payload)
    for key, value in forbidden.items():
        if key in ("note", "$comment", "cases", "wording", "reasonCodes"):
            continue
        out[key] = value
    return out


def _m12_drop_required_code(codes, body, request):
    return list(codes)[1:] if len(codes) > 1 else []


def _m13_missing_declared_field(result, body, request):
    out = dict(result)
    out.pop("recommendationConfidence", None)
    return out


def _m14_undeclared_field(result, body, request):
    out = dict(result)
    out["helpfulExtraSummary"] = "a field the data contract does not declare"
    return out


def _m15_wrong_severity(result, body, request):
    out = dict(result)
    codes = []
    for rc in out.get("reasonCodes") or []:
        rc = dict(rc)
        rc["severity"] = "INFO" if rc.get("severity") != "INFO" else "SAFETY"
        codes.append(rc)
    out["reasonCodes"] = codes
    return out


def _m16_wrong_owner(result, body, request):
    out = dict(result)
    codes = []
    for rc in out.get("reasonCodes") or []:
        rc = dict(rc)
        rc["owner"] = "PRESENTATION" if rc.get("owner") != "PRESENTATION" else "TREND"
        codes.append(rc)
    out["reasonCodes"] = codes
    return out


def _m17_just_outside_tolerance(payload, block, field, body, request):
    out = {}
    for k, v in payload.items():
        out[k] = v + 1e-6 if isinstance(v, float) else v
    return out


def _m18_not_finite(payload, block, field, body, request):
    out = dict(payload)
    for k, v in payload.items():
        if isinstance(v, float):
            out[k] = float("nan")
            break
    return out


def _m19_name_collision(result, body, request):
    """Put one field name in two places with two values (`INV-B7`)."""
    out = dict(result)
    obs = out.get("observedTrajectory")
    if isinstance(obs, dict) and "observedSlopeDkhPerDay" in obs:
        sup = out.get("supportedTrajectory")
        sup = dict(sup) if isinstance(sup, dict) else {}
        sup["observedSlopeDkhPerDay"] = obs["observedSlopeDkhPerDay"] + 1.0
        out["supportedTrajectory"] = sup
    return out


def _m21_stale_canon_version(result, body, request):
    """Answer as an engine built against a superseded freeze."""
    out = dict(result)
    out["canonVersion"] = "SHARED_V2_FREEZE_1 / ALK_V2_FREEZE_3"
    return out


def _m21_stale_describe(described, request):
    out = dict(described)
    out["canonVersion"] = "SHARED_V2_FREEZE_1 / ALK_V2_FREEZE_3"
    return out


def _m20_silent_withhold(result, body, request):
    """Withhold an output and emit no code at all."""
    out = dict(result)
    out["doseRecommendation"] = "WITHHELD"
    out["reasonCodes"] = []
    return out


# ---------------------------------------------------------------------------
# the registry
# ---------------------------------------------------------------------------

MUTATIONS: List[Mutation] = [
    Mutation(
        mid="M-1",
        title="Sort events by insertion order rather than by event time",
        defect_class="determinism / event ordering",
        status=EXECUTABLE,
        sabotage=(
            "the oracle consumes the event array as given instead of sorting by "
            "(absoluteInstant, eventOrdinal, eventId)"
        ),
        guards=(
            "INV-A1's claim that reordering the input event array cannot change the "
            "output. `ALK-V2-INVARIANTS.md` names this exact mutation as INV-A1's "
            "negative control."
        ),
        expect_red=["invariant:INV-A1"],
        expect_mechanism="reversing the input event array changed the output",
        hooks={"order_events": _m1_insertion_order},
    ),
    Mutation(
        mid="M-2",
        title="Default asOf to the system clock instead of the supplied value",
        defect_class="determinism / clock dependence",
        status=EXECUTABLE,
        sabotage="the oracle stamps assessmentAsOf with the wall clock",
        guards=(
            "INV-A2's claim that no function reads a clock, and INV-A1/INV-A3's claim "
            "that repeated runs are identical. Named as INV-A2's negative control."
        ),
        expect_red=["invariant:INV-A2", "invariant:INV-A1", "invariant:INV-A3"],
        expect_mechanism="assessmentAsOf",
        hooks={"as_of": _m2_system_clock},
    ),
    Mutation(
        mid="M-3",
        title="Derive an observed quantity from the supported slope",
        defect_class="layer violation (Layer 3 leaking into Layer 2)",
        status=EXECUTABLE,
        sabotage="observedSlopeDkhPerDay is emitted as the supported slope",
        guards=(
            "the fixture comparison's ability to tell the observed slope from the "
            "supported one. INV-B2 forbids this direction of derivation; the "
            "implementation contract calls Layer 2 -> Layer 3 one-way."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="observedSlopeDkhPerDay",
        hooks={"block": _m3_observed_from_supported},
    ),
    Mutation(
        mid="M-4",
        title="Emit a reason code not in the closed set",
        defect_class="output vocabulary",
        status=EXECUTABLE,
        sabotage="the oracle appends `TRAJECTORY_LOOKS_FINE`, an uncatalogued code",
        guards=(
            "conformance-gate item 4 and the harness's own CHK-RC-CLOSURE-ENGINE "
            "check. The code chosen is also one the catalogue's rule 2 forbids by "
            "shape -- evaluative, not explanatory."
        ),
        expect_red=["check:CHK-RC-CLOSURE-ENGINE", "invariant:INV-I3"],
        expect_mechanism="not in the closed set",
        hooks={"reason_codes": _m4_uncatalogued_code},
    ),
    Mutation(
        mid="M-5",
        title="Round a chemistry value before classifying it rather than after",
        defect_class="precision / display rounding entering calculation",
        status=EXECUTABLE,
        sabotage="every dKH-dimensioned value is rounded to one decimal before emission",
        guards=(
            "the fixture comparison at the declared tolerance. INV-A4 requires that "
            "display rounding never changes classification, trend or dose."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="differs by",
        hooks={"block": _m5_round_before_classifying, "latest_value": _m5_round_latest},
    ),
    Mutation(
        mid="M-6",
        title="Substitute D_history for D_current in safety sizing",
        defect_class="dose provenance",
        status=EXECUTABLE,
        sabotage=(
            "recommendedDoseMlPerDay is emitted as the earliest recorded programmed "
            "dose instead of the sized recommendation"
        ),
        guards=(
            "the fixture comparison on the final actuator command, which the fixture "
            "schema requires to match exactly after rounding."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="recommendedDoseMlPerDay",
        hooks={"block": _m6_history_for_current},
    ),
    Mutation(
        mid="M-7",
        title="Skip the refusal precondition when a required input is unknown",
        defect_class="silent degradation instead of refusal",
        status=EXECUTABLE,
        sabotage=(
            "the oracle withholds nine outputs as NOT_RUN but drops the GATING code "
            "that explains them"
        ),
        guards=(
            "CHK-WITHHELD-REASONED, i.e. INV-I4 and schema invariant 8: every "
            "withheld output carries a reason; no output is silently absent."
        ),
        expect_red=["check:CHK-WITHHELD-REASONED"],
        expect_mechanism="no emitted code has severity GATING or REFUSAL",
        hooks={"reason_codes": _m7_skip_refusal},
    ),
    Mutation(
        mid="M-8",
        title="Treat two readings inside the repeat window as separate observations",
        defect_class="evidence inflation",
        status=BLOCKED,
        sabotage=(
            "count raw readings instead of clusters, so repeats inflate "
            "independentClusters and shrink sigma_S"
        ),
        guards=(
            "INV-C1, whose stated negative control is exactly this and which names "
            "WG-ALK-049 as the fixture that must fail."
        ),
        unblocks_when=(
            "EITHER an engine exists that actually clusters, so the harness can apply "
            "INV-C1's own generator (append 1-10 readings within 30 minutes of an "
            "existing one and require independentClusters unchanged); OR at least one "
            "fixture carrying repeats inside the 30-minute window becomes executable. "
            "Today neither holds: WG-ALK-049 is the repeat-clustering fixture and it "
            "is in the ABSTRACT_INPUT class, and none of the six executable fixtures "
            "contains two readings less than 30 minutes apart. The echo oracle cannot "
            "supply the missing behaviour, because clustering to a 30-minute window "
            "is a canon rule (ALK-005 / REPEAT_CLUSTER_WINDOW) and implementing it "
            "here would be writing engine code."
        ),
    ),
    Mutation(
        mid="M-9",
        title="Ignore the advisory boundary so no warning is attached",
        defect_class="lost safety/gating signal",
        status=EXECUTABLE,
        sabotage="every emitted code whose severity is not INFO is dropped",
        guards=(
            "the fixture comparison's required-reason-code assertion and "
            "CHK-WITHHELD-REASONED. A SAFETY or GATING code is the only thing that "
            "carries a warning into the output."
        ),
        expect_red=[
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-006",
            "check:CHK-WITHHELD-REASONED",
        ],
        expect_mechanism="required reason code",
        hooks={"reason_codes": _m9_drop_advisory},
    ),
    Mutation(
        mid="M-10",
        title="Return a recommendation where canon requires none",
        defect_class="unsupported action",
        status=EXECUTABLE,
        sabotage="every HOLD / TEST_AGAIN action becomes SET_MAINTENANCE_DOSE",
        guards=(
            "the fixture comparison on `action`. WG-ALK-002 is the uncertainty-limited "
            "HOLD; turning it into a dose change is the defect this guards."
        ),
        expect_red=["fixture:WG-ALK-002"],
        expect_mechanism="action",
        hooks={"block": _m10_recommend_anyway},
    ),
    Mutation(
        mid="M-11",
        title="Return exactly the value the fixture forbids",
        defect_class="forbidden state returned",
        status=EXECUTABLE,
        sabotage="each fixture's `forbidden` entries are emitted as the actual values",
        guards=(
            "the fixture schema's acceptance rule, clause 3: a fixture fails if a "
            "forbidden state, value or reason code is returned. Without this control "
            "the `forbidden` blocks of 103 fixtures would be decoration."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
        ],
        expect_mechanism="forbidden value",
        hooks={"block": _m11_forbidden_value},
    ),
    Mutation(
        mid="M-12",
        title="Drop a required reason code",
        defect_class="missing explanation",
        status=EXECUTABLE,
        sabotage="the first required code of each fixture is not emitted",
        guards=(
            "the fixture schema's acceptance rule, clause 4: a fixture fails if a "
            "required reason code is absent."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="required reason code",
        hooks={"reason_codes": _m12_drop_required_code},
    ),
    Mutation(
        mid="M-13",
        title="Omit a field the data contract declares",
        defect_class="output shape",
        status=EXECUTABLE,
        sabotage="`recommendationConfidence` is removed from the result",
        guards=(
            "CHK-OUTPUT-SHAPE. The data contract states that an absent field is a "
            "schema violation, distinct from a withheld one."
        ),
        expect_red=["check:CHK-OUTPUT-SHAPE"],
        expect_mechanism="absent",
        hooks={"result": _m13_missing_declared_field},
    ),
    Mutation(
        mid="M-14",
        title="Add a field the data contract does not declare",
        defect_class="output shape",
        status=EXECUTABLE,
        sabotage="an undeclared `helpfulExtraSummary` field is added",
        guards=(
            "CHK-OUTPUT-SHAPE in the other direction. An undeclared field is an "
            "output with no owner, no dimension and no audit path."
        ),
        expect_red=["check:CHK-OUTPUT-SHAPE"],
        expect_mechanism="not declared by the data contract",
        hooks={"result": _m14_undeclared_field},
    ),
    Mutation(
        mid="M-15",
        title="Emit a catalogued code with the wrong severity",
        defect_class="output vocabulary",
        status=EXECUTABLE,
        sabotage="each emitted code's severity is flipped away from its catalogued value",
        guards=(
            "CHK-RC-CLOSURE-ENGINE's severity clause. A GATING code rendered as INFO "
            "loses the fact that an output was held."
        ),
        expect_red=["check:CHK-RC-CLOSURE-ENGINE"],
        expect_mechanism="severity",
        hooks={"result": _m15_wrong_severity},
    ),
    Mutation(
        mid="M-16",
        title="Emit a catalogued code from the wrong owning module",
        defect_class="rule ownership",
        status=EXECUTABLE,
        sabotage="each emitted code's owner is changed away from its catalogued owner",
        guards=(
            "CHK-RC-CLOSURE-ENGINE's owner clause, i.e. INV-I2's second clause and "
            "the catalogue's rule 3, one owner per code."
        ),
        expect_red=["check:CHK-RC-CLOSURE-ENGINE"],
        expect_mechanism="catalogue's single owner",
        hooks={"result": _m16_wrong_owner},
    ),
    Mutation(
        mid="M-17",
        title="Return a value just outside the declared tolerance",
        defect_class="numeric drift",
        status=EXECUTABLE,
        sabotage="every float is offset by 1e-6, three orders above the 1e-9 tolerance",
        guards=(
            "that the tolerance the harness applies is the one the fixture schema "
            "declares, and that it is not so loose as to admit drift."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="differs by",
        hooks={"block": _m17_just_outside_tolerance},
    ),
    Mutation(
        mid="M-18",
        title="Return a non-finite number",
        defect_class="numeric validity",
        status=EXECUTABLE,
        sabotage="one float per block is replaced with NaN",
        guards=(
            "that the comparator rejects NaN explicitly rather than letting an "
            "IEEE-754 comparison silently succeed or silently fail."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="not finite",
        hooks={"block": _m18_not_finite},
    ),
    Mutation(
        mid="M-19",
        title="Give one field name two meanings in one result",
        defect_class="dimension safety",
        status=EXECUTABLE,
        sabotage=(
            "`observedSlopeDkhPerDay` is emitted a second time, inside the supported "
            "trajectory, with a different value"
        ),
        guards=(
            "the by-name resolution the harness relies on. INV-B7 guarantees one "
            "meaning per field name; if the harness resolved a duplicated name "
            "silently it could compare against the wrong one."
        ),
        expect_red=[
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
            "fixture:WG-ALK-003",
            "fixture:WG-ALK-004",
            "fixture:WG-ALK-006",
            "fixture:WG-ALK-033",
        ],
        expect_mechanism="appears at",
        hooks={"result": _m19_name_collision},
    ),
    Mutation(
        mid="M-20",
        title="Withhold an output silently",
        defect_class="silent absence",
        status=EXECUTABLE,
        sabotage="doseRecommendation becomes WITHHELD and every reason code is dropped",
        guards=(
            "CHK-WITHHELD-REASONED and the fixture required-code assertion together. "
            "This is the harshest form of the defect M-7 tests gently."
        ),
        expect_red=[
            "check:CHK-WITHHELD-REASONED",
            "fixture:WG-ALK-001",
            "fixture:WG-ALK-002",
        ],
        expect_mechanism="GATING or REFUSAL",
        hooks={"result": _m20_silent_withhold},
    ),
]


MUTATIONS.append(
    Mutation(
        mid="M-21",
        title="Answer as an engine built against a superseded canon freeze",
        defect_class="stale authority",
        status=EXECUTABLE,
        sabotage=(
            "both the describe response and every result declare "
            "`SHARED_V2_FREEZE_1 / ALK_V2_FREEZE_3`, the historical pair"
        ),
        guards=(
            "CHK-ENGINE-VERSION, i.e. canon §64's third replay condition -- same "
            "ledger, same configuration versions *and the same engine/canon "
            "version*. The two stale identifiers are exactly the ones "
            "`AGENT-ROSTER.md` records as superseded."
        ),
        expect_red=["check:CHK-ENGINE-VERSION"],
        expect_mechanism="the corpus is written against",
        hooks={"result": _m21_stale_canon_version, "describe": _m21_stale_describe},
    )
)


def by_id(mid: str) -> Optional[Mutation]:
    for m in MUTATIONS:
        if m.mid == mid:
            return m
    return None
