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
                # Catalogue rule 4: "Payload is mandatory. Every code carries the
                # exact fields listed. A code without its payload cannot be
                # rendered honestly or audited." This is `INV-I3`'s second
                # clause, which nothing enforced.
                payload = rc.get("payload")
                if not isinstance(payload, dict) or not payload:
                    violations.append(
                        f"{fixture_id}: `{code}` emitted with an empty payload; the "
                        f"catalogue makes the payload mandatory (rule 4)"
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


#: Top-level members of `EngineResult` that are not outputs, and whose interior
#: is therefore outside `INV-I4`'s sweep.
#:
#: * `capabilities[]` is the capability gate's own record, and
#:   `ALK-V2-DATA-CONTRACT.md` §`CapabilityState` declares
#:   `outcome: OK | DEGRADE | REFUSE | NOT_RUN` — so `NOT_RUN` there is a
#:   **member of a closed vocabulary**, not the withheld marker that happens to
#:   share its spelling. Reading it as withheld made this check demand that a
#:   capability's own decision be explained by a gating code, which in turn
#:   pushed engines into naming internal dotted paths on the keeper's card.
#: * `reasonCodes[]` payloads quote other fields' states. A quotation of a
#:   withheld output is not a second withheld output.
_NOT_OUTPUTS = ("capabilities", "reasonCodes")


def _withheld_fields(node: Any, path: str = "") -> List[str]:
    """Every field, at any depth, whose value is a withheld marker.

    An earlier version looked only at top-level keys, so an engine that
    withheld `doseRecommendation.recommendedDoseMlPerDay` was invisible to the
    check and the check reported PASS over zero subjects.
    """
    out: List[str] = []
    if isinstance(node, dict):
        for k, v in node.items():
            p = f"{path}.{k}" if path else k
            if not path and k in _NOT_OUTPUTS:
                continue
            if isinstance(v, str) and v in WITHHELD_MARKERS:
                out.append(p)
            else:
                out.extend(_withheld_fields(v, p))
    elif isinstance(node, list):
        for i, v in enumerate(node):
            out.extend(_withheld_fields(v, f"{path}[{i}]"))
    return out


def _named_outputs(rc: Any) -> List[str]:
    """Outputs a reason code claims to explain, from its payload."""
    if not isinstance(rc, dict):
        return []
    payload = rc.get("payload")
    if not isinstance(payload, dict):
        return []
    named: List[str] = []
    for key in ("affectedOutputs", "affected", "missing", "notRun"):
        value = payload.get(key)
        if isinstance(value, str):
            named.append(value)
        elif isinstance(value, list):
            named.extend(v for v in value if isinstance(v, str))
    return named


def check_withheld_carries_reason(
    replies: List[Tuple[str, Dict[str, Any]]], cat: rc_mod.Catalogue
) -> CheckOutcome:
    """`INV-I4` / schema invariant 8: no output is silently absent.

    The invariant is specific, and this check now enforces what it says rather
    than a weaker paraphrase of it:

        "for every field whose value is NOT_RUN, WITHHELD or UNRESOLVED, at
         least one reason code with severity GATING or REFUSAL **names it in
         affectedOutputs[]**."

    The earlier version asked only whether *some* `GATING`/`REFUSAL` code was
    present anywhere in the result. Under that rule an engine that legitimately
    marked one reading suspect satisfied the refusal guarantee for every other
    withheld output in the same assessment.
    """
    violations: List[str] = []
    examined = 0
    for fixture_id, result in replies:
        withheld = _withheld_fields(result)
        if not withheld:
            continue
        examined += len(withheld)

        explained: Set[str] = set()
        any_gating = False
        for rc in _emitted_codes(result):
            code = rc if isinstance(rc, str) else (
                rc.get("code") if isinstance(rc, dict) else None
            )
            sev = cat.severity_of(code) if isinstance(code, str) else None
            if sev not in ("GATING", "REFUSAL"):
                continue
            any_gating = True
            for name in _named_outputs(rc):
                explained.add(name)
                explained.add(name.rsplit(".", 1)[-1])

        if not any_gating:
            violations.append(
                f"{fixture_id}: {len(withheld)} field(s) withheld "
                f"({', '.join(sorted(withheld)[:4])}"
                f"{', ...' if len(withheld) > 4 else ''}), but no emitted code has "
                f"severity GATING or REFUSAL"
            )
            continue

        unexplained = [
            w for w in withheld if w not in explained and w.rsplit(".", 1)[-1] not in explained
        ]
        if unexplained:
            violations.append(
                f"{fixture_id}: withheld without being named by any GATING or "
                f"REFUSAL code's affectedOutputs: "
                f"{', '.join(sorted(unexplained)[:6])}"
                f"{', ...' if len(unexplained) > 6 else ''}"
            )

    if not replies:
        return CheckOutcome(
            check_id="CHK-WITHHELD-REASONED",
            title="Every withheld output is named by a gating or refusal reason",
            status=NOT_COVERED,
            what_was_checked="no engine reply was produced",
            detail="requires an engine and at least one executable fixture",
        )
    return CheckOutcome(
        check_id="CHK-WITHHELD-REASONED",
        title="Every withheld output is named by a gating or refusal reason",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{examined} withheld fields at any depth across {len(replies)} engine "
            f"replies, each required to be named in the affectedOutputs of a GATING "
            f"or REFUSAL code"
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
