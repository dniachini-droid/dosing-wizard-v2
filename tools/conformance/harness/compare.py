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
    precision_below_tolerance: List[str] = field(default_factory=list)
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


def is_prose(value: Any) -> bool:
    """A string that is a sentence rather than a value an engine field can equal.

    **One predicate, one owner.** There were briefly two — this one and a
    narrower copy in `corpus._unreadable_expectations` — and they disagreed on
    17 corpus entries, so the published count of non-comparable expectations
    depended on which one you asked. `corpus` now calls this.

    The rule is deliberately conservative: a single token with no whitespace is
    a value, whatever its case. `SET_MAINTENANCE_DOSE`, `FALLING`, `decrease`,
    `blocked` and `non-zero` are all compared; only something with internal
    whitespace or a trailing full stop is treated as a sentence. The earlier
    version required an upper-case single token and so discarded 14 lower-case
    enum values as if they were prose.
    """
    if not isinstance(value, str):
        return False
    s = value.strip()
    if not s:
        return False
    return " " in s or "\t" in s or s.endswith(".")


#: Kept as a private alias so existing call sites read unchanged.
_is_prose = is_prose


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


#: List element keys that identify an element independently of its position.
#: Each entry needs a source that *states* the order is not significant -- this
#: is not a place to record a preference.
#:
#: `candidateClass`: canon, of the retest scheduler's audit record -- "Reason
#: codes are additive, so no precedence between tied candidates is invented and
#: **the audit record does not depend on evaluation order**". The data contract
#: declares the element as `candidateTimes[] { candidateClass, at,
#: included|excluded, reason }`, and the class is what names the candidate.
#:
#: Comparing such a list positionally makes a correct engine fail for emitting
#: its candidates in a defensible order -- sorted by time, by class, by
#: evaluation sequence -- none of which canon fixes. The likely repair for that
#: false failure is reordering the engine to match a fixture, which is fitting
#: the engine to an accident of how the fixture was written.
_IDENTITY_KEYS = ("candidateClass",)


def _identity_key(exp: List[Any], act: List[Any]) -> Optional[str]:
    """The key identifying these elements, or None to compare positionally.

    Requires every element on both sides to be a dict carrying the key, and the
    keys to be unique within each list. Anything less and the list is compared
    by position, which is the right default: for most lists -- a time series,
    an ordered sequence of clamps -- order *is* the meaning.
    """
    for key in _IDENTITY_KEYS:
        if not exp or not act:
            continue
        if not all(isinstance(e, dict) and key in e for e in exp):
            continue
        if not all(isinstance(a, dict) and key in a for a in act):
            continue
        exp_keys = [e[key] for e in exp]
        act_keys = [a[key] for a in act]
        if len(set(exp_keys)) != len(exp_keys) or len(set(act_keys)) != len(act_keys):
            continue
        return key
    return None


def _compare_list_by_identity(
    exp: List[Any],
    act: List[Any],
    tol: Dict[str, Any],
    path: str,
    r: ComparisonResult,
    name: str,
    key: str,
) -> None:
    """Match elements by their identity key, then compare each pair.

    The element path is reported as `[candidateClass=SIGNAL_ACCUMULATION]`
    rather than `[1]`, so a failure names the candidate that is wrong instead of
    a position whose meaning depends on an order nothing fixes.
    """
    by_key = {a[key]: a for a in act}
    for e in exp:
        ident = e[key]
        where = f"{path}[{key}={ident}]"
        if ident not in by_key:
            r.mismatches.append(
                Mismatch(where, e, "<absent>", f"no element with {key} = {ident!r}")
            )
            continue
        _compare_value(e, by_key[ident], tol, where, r, name)


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
        identity = _identity_key(exp, act)
        if identity is not None:
            _compare_list_by_identity(exp, act, tol, path, r, name, identity)
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
        step = _last_digit_step(exp)
        if step is not None and step > t:
            # The golden is written to fewer decimals than the tolerance
            # demands, so a correct engine can differ from it by more than the
            # tolerance simply because the fixture rounded. Reported, never
            # silently widened: the tolerance is the schema's and the value is
            # canon's, and neither is the harness's to adjust.
            r.precision_below_tolerance.append(
                f"{path}: golden {exp!r} is written to a last place of {step:g}, "
                f"coarser than the {t:g} tolerance applied to it; a correct engine "
                f"can fail this comparison by rounding alone"
            )
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


def _last_digit_step(value: float) -> Optional[float]:
    """The size of one unit in the last written decimal place of `value`.

    `10.5` -> 0.1, `9.14609` -> 1e-5. `None` when the literal is long enough
    that its written precision is not the limiting factor.
    """
    text = repr(float(value))
    if "e" in text or "E" in text:
        return None
    if "." not in text:
        return None
    decimals = len(text.split(".", 1)[1].rstrip("0"))
    if decimals == 0 or decimals >= 15:
        return None
    # Only a value written to three or more decimals is plausibly a *truncated*
    # computed quantity. One or two decimals is an exact intended value -- an
    # actuator command like 10.5 mL/day, which the fixture schema says to
    # "compare exactly after rounding", or a reading like 8.6 dKH. Flagging
    # those would bury the real signal in noise and train the reader to skip
    # the notes.
    if decimals < 3:
        return None
    return 10.0 ** (-decimals)


def widened_tolerances(
    schema: Dict[str, Any], fixture_override: Optional[Dict[str, Any]]
) -> List[str]:
    """Fixture-level tolerance overrides that make the gate looser.

    The fixture schema permits an override ("overrides the default tolerance if
    the fixture needs one"), so widening is a supported path and the harness
    does not forbid it. It must not be *invisible*, though: the corpus and the
    engine will be edited in the same pull request, by the same author, under
    pressure to turn a red green.
    """
    out: List[str] = []
    if not fixture_override:
        return out
    defaults = schema.get("defaultTolerance") or {}
    for key, value in fixture_override.items():
        if not isinstance(value, (int, float)):
            continue
        base = defaults.get(key)
        if isinstance(base, (int, float)) and value > base:
            out.append(
                f"tolerance.{key} is widened by this fixture from the schema default "
                f"{base:g} to {value:g} ({value / base:.3g}x looser)"
            )
    return out


def forbidden_epsilon(schema: Dict[str, Any]) -> float:
    """Equality epsilon for a forbidden numeric value.

    Read from the schema's own tolerance table rather than written here. The
    same constant living in two places is what `MASTER RULE 1` calls a defect
    rather than a coincidence.
    """
    table = schema.get("defaultTolerance") or {}
    value = table.get("dimensionless")
    if isinstance(value, (int, float)):
        return float(value)
    numeric = [v for v in table.values() if isinstance(v, (int, float))]
    return float(min(numeric)) if numeric else 0.0
