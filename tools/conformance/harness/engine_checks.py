"""Mechanical checks that need engine output but no chemistry knowledge.

Both are conformance-gate conditions from
`ALK-V2-IMPLEMENTATION-CONTRACT.md` §9:

  item 4   "no reason code is emitted that is not in ALK-V2-REASON-CODES.md"
  the data contract   "an absent field is a schema violation; a withheld
                       output is a designed state that carries its own
                       reason code"

Neither knows what a correct dKH value is. They are shape and vocabulary
checks, and they are the two the harness can apply to *every* engine reply,
including replies to fixtures whose expected values it cannot compare.
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Set, Tuple

from . import data_contract as dc_mod
from . import reason_codes as rc_mod
from .results import FAIL, NOT_COVERED, PASS, CheckOutcome

WITHHELD_MARKERS = ("NOT_RUN", "WITHHELD", "UNRESOLVED")


def _emitted_codes(result: Dict[str, Any]) -> List[Any]:
    codes = result.get("reasonCodes")
    return codes if isinstance(codes, list) else []


def check_output_shape(
    replies: List[Tuple[str, Dict[str, Any]]], contract: dc_mod.Contract
) -> CheckOutcome:
    """Every reply carries exactly the declared `EngineResult` field set."""
    violations: List[str] = []
    declared = list(contract.engine_result_fields)
    declared_set = set(declared)
    rc_declared = set(contract.reason_code_fields)

    for fixture_id, result in replies:
        actual = set(result)
        for missing in sorted(declared_set - actual):
            violations.append(
                f"{fixture_id}: EngineResult.{missing} absent "
                f"(the contract states an absent field is a schema violation)"
            )
        for extra in sorted(actual - declared_set):
            violations.append(
                f"{fixture_id}: EngineResult.{extra} is not declared by the data contract"
            )
        for i, rc in enumerate(_emitted_codes(result)):
            if isinstance(rc, str):
                continue  # bare-code form; the closure check covers it
            if not isinstance(rc, dict):
                violations.append(
                    f"{fixture_id}: reasonCodes[{i}] is neither a code string nor a "
                    f"ReasonCode object"
                )
                continue
            for missing in sorted(rc_declared - set(rc)):
                violations.append(
                    f"{fixture_id}: reasonCodes[{i}] ({rc.get('code', '?')}) is missing "
                    f"the required field `{missing}`"
                )

    if not replies:
        return CheckOutcome(
            check_id="CHK-OUTPUT-SHAPE",
            title="Engine output conforms to the EngineResult data contract",
            status=NOT_COVERED,
            what_was_checked="no engine reply was produced, so no output shape existed to check",
            detail="requires an engine and at least one executable fixture",
        )

    return CheckOutcome(
        check_id="CHK-OUTPUT-SHAPE",
        title="Engine output conforms to the EngineResult data contract",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{len(replies)} engine replies against the {len(declared)} declared "
            f"EngineResult fields and the {len(rc_declared)} declared ReasonCode "
            f"fields in {contract.source}"
        ),
        violations=violations,
        subjects_examined=len(replies),
    )


def check_emitted_reason_codes(
    replies: List[Tuple[str, Dict[str, Any]]], cat: rc_mod.Catalogue
) -> CheckOutcome:
    """Conformance-gate item 4: the emitted set is inside the closed set."""
    violations: List[str] = []
    examined = 0
    for fixture_id, result in replies:
        for i, rc in enumerate(_emitted_codes(result)):
            code = rc if isinstance(rc, str) else (rc.get("code") if isinstance(rc, dict) else None)
            if not isinstance(code, str):
                violations.append(f"{fixture_id}: reasonCodes[{i}] has no code string")
                continue
            examined += 1
            if code not in cat.closed_set:
                note = ""
                if code in cat.non_codes:
                    note = (
                        f" -- the catalogue appendix records this token as "
                        f"{cat.non_codes[code]}, not a reason code"
                    )
                violations.append(
                    f"{fixture_id}: emitted `{code}`, which is not in the closed set{note}"
                )
                continue
            if isinstance(rc, dict):
                declared_sev = cat.severity_of(code)
                emitted_sev = rc.get("severity")
                if emitted_sev is not None and emitted_sev != declared_sev:
                    violations.append(
                        f"{fixture_id}: `{code}` emitted with severity "
                        f"`{emitted_sev}`; the catalogue declares `{declared_sev}`"
                    )
                declared_owner = cat.owner_of(code)
                emitted_owner = rc.get("owner")
                if emitted_owner is not None and emitted_owner != declared_owner:
                    violations.append(
                        f"{fixture_id}: `{code}` emitted by `{emitted_owner}`; the "
                        f"catalogue's single owner is `{declared_owner}`"
                    )

    if not replies:
        return CheckOutcome(
            check_id="CHK-RC-CLOSURE-ENGINE",
            title="Every emitted reason code is in the closed set",
            status=NOT_COVERED,
            what_was_checked="no engine reply was produced, so no code was emitted to check",
            detail="requires an engine and at least one executable fixture",
        )

    return CheckOutcome(
        check_id="CHK-RC-CLOSURE-ENGINE",
        title="Every emitted reason code is in the closed set",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{examined} codes emitted across {len(replies)} engine replies, each "
            f"required to be one of the {len(cat.closed_set)} catalogued codes with "
            f"its declared severity and owner"
        ),
        violations=violations,
        subjects_examined=examined,
    )


def check_withheld_carries_reason(
    replies: List[Tuple[str, Dict[str, Any]]], cat: rc_mod.Catalogue
) -> CheckOutcome:
    """`INV-I4` / schema invariant 8: no output is silently absent.

    Every top-level field whose value is `NOT_RUN`, `WITHHELD` or `UNRESOLVED`
    must be accompanied by at least one `GATING` or `REFUSAL` code.
    """
    violations: List[str] = []
    examined = 0
    for fixture_id, result in replies:
        withheld = [
            k for k, v in result.items() if isinstance(v, str) and v in WITHHELD_MARKERS
        ]
        if not withheld:
            continue
        examined += len(withheld)
        severities: Set[str] = set()
        for rc in _emitted_codes(result):
            code = rc if isinstance(rc, str) else (rc.get("code") if isinstance(rc, dict) else None)
            sev = cat.severity_of(code) if isinstance(code, str) else None
            if sev:
                severities.add(sev)
        if not ({"GATING", "REFUSAL"} & severities):
            violations.append(
                f"{fixture_id}: {', '.join(sorted(withheld))} withheld, but no emitted "
                f"code has severity GATING or REFUSAL"
            )

    if not replies:
        return CheckOutcome(
            check_id="CHK-WITHHELD-REASONED",
            title="Every withheld output carries a gating or refusal reason",
            status=NOT_COVERED,
            what_was_checked="no engine reply was produced",
            detail="requires an engine and at least one executable fixture",
        )
    return CheckOutcome(
        check_id="CHK-WITHHELD-REASONED",
        title="Every withheld output carries a gating or refusal reason",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{examined} withheld fields across {len(replies)} engine replies, each "
            f"required to be explained by a GATING or REFUSAL code"
        ),
        violations=violations,
        subjects_examined=examined,
    )


def run_engine_checks(
    replies: List[Tuple[str, Dict[str, Any]]],
    contract: dc_mod.Contract,
    cat: rc_mod.Catalogue,
) -> List[CheckOutcome]:
    return [
        check_output_shape(replies, contract),
        check_emitted_reason_codes(replies, cat),
        check_withheld_carries_reason(replies, cat),
    ]
