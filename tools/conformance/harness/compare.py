"""Tolerance-aware comparison of an engine value against a fixture expectation.

Tolerances are read from `fixtures/_schema.json` -> `defaultTolerance`, and a
fixture may override them with its own `tolerance` block. Nothing is hardcoded
here: if the schema's tolerance table does not name a dimension, the harness
does **not** quietly pick one -- it records `TOLERANCE_UNSPECIFIED` against the
field so the gap is visible in the report, and compares at the strictest
tolerance the table offers so that the absence never makes a test easier.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# Which `defaultTolerance` key governs a field, by its dimension suffix
# (`ALK-V2-DATA-CONTRACT.md` §0 "Dimension safety"). Longest suffix wins.
SUFFIX_TO_TOLERANCE_KEY = {
    "DkhPerDay": "dkhPerDay",
    "DkhPerMl": "dimensionless",
    "MlPerDay": "mlPerDay",
    "Dkh": "dkh",
    "Ml": "ml",
    "Fraction": "dimensionless",
}


@dataclass
class Mismatch:
    path: str
    expected: Any
    actual: Any
    why: str


@dataclass
class ComparisonResult:
    mismatches: List[Mismatch] = field(default_factory=list)
    compared: int = 0
    skipped_prose: List[str] = field(default_factory=list)
    tolerance_unspecified: List[str] = field(default_factory=list)
    absent_from_engine: List[str] = field(default_factory=list)

    @property
    def ok(self) -> bool:
        return not self.mismatches


def _tolerance_for(field_name: str, table: Dict[str, Any]) -> Tuple[float, bool]:
    """(tolerance, was_specified) for a numeric field."""
    hits = [s for s in SUFFIX_TO_TOLERANCE_KEY if field_name.endswith(s)]
    if hits:
        suffix = max(hits, key=len)
        key = SUFFIX_TO_TOLERANCE_KEY[suffix]
        val = table.get(key)
        if isinstance(val, (int, float)):
            return float(val), True
    numeric = [v for v in table.values() if isinstance(v, (int, float))]
    strictest = min(numeric) if numeric else 0.0
    return float(strictest), False


def _is_prose(value: Any) -> bool:
    """A string that is a sentence rather than an enum value or an identifier."""
    if not isinstance(value, str):
        return False
    s = value.strip()
    if not s:
        return False
    if s.upper() == s and " " not in s:
        return False  # SET_MAINTENANCE_DOSE, FALLING, EXACT ...
    return " " in s or s.endswith(".") or any(c.islower() for c in s)


def compare_block(
    expected: Dict[str, Any],
    actual: Any,
    tolerance_table: Dict[str, Any],
    prefix: str,
) -> ComparisonResult:
    r = ComparisonResult()
    _compare_dict(expected, actual, tolerance_table, prefix, r)
    return r


def _compare_dict(
    expected: Dict[str, Any],
    actual: Any,
    tol: Dict[str, Any],
    prefix: str,
    r: ComparisonResult,
) -> None:
    if not isinstance(actual, dict):
        r.mismatches.append(
            Mismatch(prefix, "<object>", actual, "engine did not return an object here")
        )
        return
    for key, exp in expected.items():
        path = f"{prefix}.{key}"
        if key in ("note", "$comment", "derivation", "why"):
            continue
        if _is_prose(exp):
            r.skipped_prose.append(path)
            continue
        if key not in actual:
            r.absent_from_engine.append(path)
            r.mismatches.append(
                Mismatch(path, exp, "<absent>", "field absent from engine output")
            )
            continue
        _compare_value(exp, actual[key], tol, path, r, key)


def _compare_value(
    exp: Any, act: Any, tol: Dict[str, Any], path: str, r: ComparisonResult, name: str
) -> None:
    if isinstance(exp, dict):
        _compare_dict(exp, act, tol, path, r)
        return
    if isinstance(exp, list):
        r.compared += 1
        if not isinstance(act, list):
            r.mismatches.append(Mismatch(path, exp, act, "expected a list"))
            return
        if len(exp) != len(act):
            r.mismatches.append(
                Mismatch(path, exp, act, f"list length {len(act)} != {len(exp)}")
            )
            return
        for i, (e, a) in enumerate(zip(exp, act)):
            _compare_value(e, a, tol, f"{path}[{i}]", r, name)
        return

    r.compared += 1

    if isinstance(exp, bool) or isinstance(act, bool):
        if exp is not act:
            r.mismatches.append(Mismatch(path, exp, act, "boolean differs"))
        return
    if exp is None:
        if act is not None:
            r.mismatches.append(Mismatch(path, exp, act, "expected null"))
        return
    if isinstance(exp, str):
        if exp != act:
            r.mismatches.append(Mismatch(path, exp, act, "exact match required"))
        return
    if isinstance(exp, int):
        # A count or an integer-valued quantity. `enumsAndReasonCodes` and
        # counts compare exactly per the fixture schema's acceptance rule.
        if isinstance(act, float) and act.is_integer():
            act = int(act)
        if exp != act:
            r.mismatches.append(Mismatch(path, exp, act, "integer differs (exact)"))
        return
    if isinstance(exp, float):
        if not isinstance(act, (int, float)):
            r.mismatches.append(Mismatch(path, exp, act, "expected a number"))
            return
        t, specified = _tolerance_for(name, tol)
        if not specified:
            r.tolerance_unspecified.append(path)
        if math.isnan(act) or math.isinf(act):
            r.mismatches.append(Mismatch(path, exp, act, "not finite"))
            return
        if abs(float(act) - exp) > t:
            r.mismatches.append(
                Mismatch(path, exp, act, f"differs by {abs(float(act)-exp):.3e} > {t:g}")
            )
        return
    r.mismatches.append(Mismatch(path, exp, act, f"unhandled expected type {type(exp).__name__}"))


def flatten(result: Any, prefix: str = "") -> Dict[str, List[Tuple[str, Any]]]:
    """Index every field in the engine result by its bare name.

    The harness resolves a fixture's expected key by **name**, not by an
    invented block-to-field mapping. That is sound because the data contract
    makes a field name globally unambiguous: `ALK-VARIABLE-SEMANTICS-001` /
    `INV-B7` require exactly one dimension per field name and forbid a name
    carrying a state-dependent meaning. Where the same name does turn up twice
    with different values, that is itself reportable rather than silently
    resolved -- see `compare_by_name`.
    """
    out: Dict[str, List[Tuple[str, Any]]] = {}

    def walk(node: Any, path: str) -> None:
        if isinstance(node, dict):
            for k, v in node.items():
                p = f"{path}.{k}" if path else k
                out.setdefault(k, []).append((p, v))
                walk(v, p)
        elif isinstance(node, list):
            for i, v in enumerate(node):
                walk(v, f"{path}[{i}]")

    walk(result, prefix)
    return out


def compare_by_name(
    expected: Dict[str, Any],
    flat: Dict[str, List[Tuple[str, Any]]],
    tolerance_table: Dict[str, Any],
    prefix: str,
) -> ComparisonResult:
    r = ComparisonResult()
    for key, exp in expected.items():
        path = f"{prefix}.{key}"
        if key in ("note", "$comment", "derivation", "why"):
            continue
        if _is_prose(exp):
            r.skipped_prose.append(f"{path} = {exp!r}")
            continue
        found = flat.get(key)
        if not found:
            r.absent_from_engine.append(path)
            r.mismatches.append(
                Mismatch(path, exp, "<absent>", "no field of that name in the engine result")
            )
            continue
        distinct = {_freeze(v) for _, v in found}
        if len(distinct) > 1:
            r.mismatches.append(
                Mismatch(
                    path,
                    exp,
                    [v for _, v in found],
                    f"the name `{key}` appears at {len(found)} places with differing "
                    f"values ({', '.join(p for p, _ in found)}); INV-B7 requires one "
                    f"meaning per field name",
                )
            )
            continue
        actual = found[0][1]
        if isinstance(exp, dict) and isinstance(actual, dict):
            sub = compare_by_name(exp, flatten(actual, found[0][0]), tolerance_table, path)
            r.mismatches.extend(sub.mismatches)
            r.compared += sub.compared
            r.skipped_prose.extend(sub.skipped_prose)
            r.tolerance_unspecified.extend(sub.tolerance_unspecified)
            r.absent_from_engine.extend(sub.absent_from_engine)
            continue
        _compare_value(exp, actual, tolerance_table, path, r, key)
    return r


def _freeze(v: Any) -> Any:
    if isinstance(v, dict):
        return tuple(sorted((k, _freeze(x)) for k, x in v.items()))
    if isinstance(v, list):
        return tuple(_freeze(x) for x in v)
    return v


def effective_tolerance(schema: Dict[str, Any], fixture_override: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    table = dict(schema.get("defaultTolerance") or {})
    if fixture_override:
        table.update(
            {k: v for k, v in fixture_override.items() if isinstance(v, (int, float))}
        )
    return table
