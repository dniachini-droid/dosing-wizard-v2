"""Mechanical checks that need no engine behaviour.

These run in the same pass as the fixture corpus, per the harness requirement,
and they are the checks that are meaningful *today*, before an engine exists:
they hold the documents to each other.

  CHK-RC-CLOSURE-DOC   every reason code named anywhere in the fixture corpus
                       or the rule-traceability table is in the closed
                       catalogue set.
  CHK-RC-CATALOGUE     the catalogue agrees with its own coverage summary and
                       has no duplicate rows or appendix collisions.
  CHK-RC-OWNER         no reason code is claimed by two different owning
                       modules  (`INV-I2`, second clause).
  CHK-INDEX-INTEGRITY  every fixture id in the index resolves to exactly one
                       body, every body is listed, the declared totals are
                       true, and every fixture id referenced by the
                       traceability table exists  (`INV-CANON-001`,
                       `CORE-CANON-COVERAGE-001`).
  CHK-DIMENSION-SAFETY every numeric field named in the data contract carries
                       exactly one dimension suffix, and no forbidden bare
                       name is used  (`INV-B7` / `INV-ALK-VARIABLES-001`).
  CHK-TRACE-COVERAGE   every rule the traceability table marks `ACTIVE` names
                       at least one fixture, and that fixture exists.

Engine-dependent mechanical checks live in `engine_checks.py`.
"""

from __future__ import annotations

import json
import re
from typing import Any, Dict, Iterable, List, Optional, Set, Tuple

from . import corpus as corpus_mod
from . import data_contract as dc_mod
from . import paths
from . import reason_codes as rc_mod
from .results import FAIL, NOT_COVERED, PASS, CheckOutcome

_CODE_TOKEN = re.compile(r"\b([A-Z][A-Z0-9]*_[A-Z0-9_]+)\b")


def load_traceability() -> Tuple[Dict[str, Any], List[str]]:
    problems: List[str] = []
    try:
        with open(paths.TRACEABILITY_JSON, encoding="utf-8") as fh:
            return json.load(fh), problems
    except Exception as exc:  # noqa: BLE001
        problems.append(f"{paths.rel(paths.TRACEABILITY_JSON)}: {exc}")
        return {}, problems


def _trace_rules(trace: Dict[str, Any]) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for group in trace.get("groups") or []:
        for rule in group.get("rules") or []:
            out.append(rule)
    return out


def _split_list(cell: Any) -> List[str]:
    if not isinstance(cell, str):
        return []
    cell = cell.strip()
    if cell in ("", "-", "—"):
        return []
    out: List[str] = []
    for part in cell.split(","):
        p = part.strip().strip("`")
        # Trailing parenthetical gloss, e.g. "ALK-G027 (V1 card mapping)".
        p = re.sub(r"\s*\(.*?\)\s*$", "", p).strip()
        if not p:
            continue
        # Range notation: "WG-ALK-045..048", "CLU-001..005", "INV-C4..C9".
        # Expanded only when both ends share a stem; "INV-A1..INV-I6" spans two
        # stems and is left alone as a span reference rather than guessed at.
        if ".." in p:
            lhs, _, rhs = p.partition("..")
            ml = re.fullmatch(r"(.*?)(\d+)", lhs.strip())
            mr = re.fullmatch(r"(.*?)(\d+)", rhs.strip())
            if ml and mr and (not mr.group(1) or ml.group(1).endswith(mr.group(1))):
                stem, lo, hi = ml.group(1), ml.group(2), mr.group(2)
                width = len(lo)
                start, end = int(lo), int(hi)
                if 0 <= end - start < 200:
                    out.extend(f"{stem}{n:0{width}d}" for n in range(start, end + 1))
                    continue
        out.append(p)
    return out


def check_catalogue_self_consistency(cat: rc_mod.Catalogue) -> CheckOutcome:
    problems = rc_mod.self_consistency(cat)
    return CheckOutcome(
        check_id="CHK-RC-CATALOGUE",
        title="Reason-code catalogue is internally consistent",
        status=FAIL if problems else PASS,
        what_was_checked=(
            f"parsed {len(cat.codes)} code rows and {len(cat.non_codes)} appendix "
            f"non-code tokens from {cat.source}; compared against the document's own "
            f"coverage summary; checked for duplicate rows and appendix collisions"
        ),
        violations=problems,
        subjects_examined=len(cat.codes),
    )


def check_reason_code_closure_documents(
    c: corpus_mod.Corpus, cat: rc_mod.Catalogue, trace: Dict[str, Any]
) -> CheckOutcome:
    """Closed-set membership for every code the documents already name.

    This is the engine-free half of conformance-gate item 4. The engine-facing
    half is `engine_checks.check_emitted_reason_codes`.
    """
    violations: List[str] = []
    examined = 0

    for f in c.fixtures:
        for code in f.expected_reason_codes:
            examined += 1
            if code not in cat.closed_set:
                extra = (
                    " (listed in the catalogue appendix as canon vocabulary, not a "
                    "reason code)"
                    if code in cat.non_codes
                    else ""
                )
                violations.append(
                    f"{f.fixture_id} ({f.source_file}) requires `{code}`, which is not "
                    f"in the closed set{extra}"
                )
        forb = f.forbidden
        for key in ("reasonCodes", "reasonCode", "codes"):
            for code in forb.get(key) or []:
                if isinstance(code, str):
                    examined += 1
                    if code not in cat.closed_set and code not in cat.non_codes:
                        violations.append(
                            f"{f.fixture_id} forbids `{code}`, which is in neither the "
                            f"closed set nor the appendix; a forbidden code that does "
                            f"not exist cannot be emitted and the assertion is vacuous"
                        )

    for rule in _trace_rules(trace):
        for code in _split_list(rule.get("reasonCodes")):
            if code.endswith("*"):
                prefix = code[:-1]
                examined += 1
                if not any(k.startswith(prefix) for k in cat.closed_set):
                    violations.append(
                        f"traceability rule `{rule.get('id')}` names the code family "
                        f"`{code}`, which matches nothing in the closed set"
                    )
                continue
            examined += 1
            if code not in cat.closed_set:
                violations.append(
                    f"traceability rule `{rule.get('id')}` names `{code}`, which is not "
                    f"in the closed set"
                )

    return CheckOutcome(
        check_id="CHK-RC-CLOSURE-DOC",
        title="Every reason code named in the corpus or traceability table is catalogued",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{examined} code references drawn from {len(c.fixtures)} fixtures and "
            f"{len(_trace_rules(trace))} traceability rules, against the "
            f"{len(cat.closed_set)}-member closed set"
        ),
        violations=violations,
        subjects_examined=examined,
    )


def check_reason_code_owner_single(cat: rc_mod.Catalogue, trace: Dict[str, Any]) -> CheckOutcome:
    """`INV-I2`, second clause: no two modules emit the same reason code."""
    violations: List[str] = []
    claims: Dict[str, Set[str]] = {}
    for rule in _trace_rules(trace):
        owner = (rule.get("owner") or "").strip().strip("`")
        if not owner:
            continue
        for code in _split_list(rule.get("reasonCodes")):
            if code.endswith("*") or code not in cat.closed_set:
                continue
            claims.setdefault(code, set()).add(owner)

    for code, owners in sorted(claims.items()):
        catalogue_owner = cat.owner_of(code)
        if len(owners) > 1:
            violations.append(
                f"`{code}` is claimed by {len(owners)} owners in the traceability "
                f"table ({', '.join(sorted(owners))}); the catalogue assigns it to "
                f"`{catalogue_owner}`"
            )
        elif catalogue_owner and owners and catalogue_owner not in owners:
            violations.append(
                f"`{code}` is owned by `{catalogue_owner}` in the catalogue but is "
                f"emitted by `{sorted(owners)[0]}` in the traceability table"
            )

    return CheckOutcome(
        check_id="CHK-RC-OWNER",
        title="One owning module per reason code",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{len(claims)} catalogued codes cross-referenced between the catalogue's "
            f"owner headings and the traceability table's owner column"
        ),
        violations=violations,
        subjects_examined=len(claims),
    )


def check_index_integrity(
    c: corpus_mod.Corpus, trace: Dict[str, Any], invariant_ids: Optional[Iterable[str]] = None
) -> CheckOutcome:
    """`INV-CANON-001` / `CORE-CANON-COVERAGE-001` applied to this package.

    The invariant fixture is explicit about scope: *"The checker runs over
    ALK-V2-RULE-TRACEABILITY.md and fixtures/index.json, not over the canon
    (which must not be modified)."*
    """
    violations: List[str] = list(c.load_problems)
    bodies = [f.fixture_id for f in c.fixtures]
    body_set = set(bodies)

    dupes = sorted({fid for fid in bodies if bodies.count(fid) > 1})
    for fid in dupes:
        violations.append(f"fixture id `{fid}` has more than one body")

    index_ids: List[str] = list(c.index.get("fixtureIds") or [])
    index_set = set(index_ids)
    for fid in sorted(index_set - body_set):
        violations.append(f"index.json lists `{fid}`, which resolves to no fixture body")
    for fid in sorted(body_set - index_set):
        violations.append(f"fixture body `{fid}` exists but index.json does not list it")

    declared_dupes = c.index.get("duplicateFixtureIds")
    if declared_dupes is not None and sorted(declared_dupes) != dupes:
        violations.append(
            f"index.json declares duplicateFixtureIds={declared_dupes!r}; "
            f"actual duplicates are {dupes!r}"
        )

    for entry in c.index.get("files") or []:
        name = entry.get("file")
        declared = entry.get("count")
        listed = entry.get("fixtureIds") or []
        actual = [f.fixture_id for f in c.fixtures if f.source_file == name]
        if declared is not None and declared != len(actual):
            violations.append(
                f"index.json says {name} holds {declared} fixtures; {len(actual)} parsed"
            )
        if sorted(listed) != sorted(actual):
            missing = sorted(set(listed) - set(actual))
            extra = sorted(set(actual) - set(listed))
            if missing:
                violations.append(f"{name}: index lists but file lacks {missing}")
            if extra:
                violations.append(f"{name}: file holds but index omits {extra}")

    total = c.declared_total
    if total is not None and total != len(c.fixtures):
        violations.append(
            f"index.json totals.fixtures = {total}; {len(c.fixtures)} fixture bodies parsed"
        )

    prov_declared = c.index.get("byProvenance") or {}
    if prov_declared:
        actual_prov: Dict[str, int] = {}
        for f in c.fixtures:
            actual_prov[f.provenance_class] = actual_prov.get(f.provenance_class, 0) + 1
        if {k: v for k, v in sorted(prov_declared.items())} != {
            k: v for k, v in sorted(actual_prov.items())
        }:
            violations.append(
                f"index.json byProvenance = {dict(sorted(prov_declared.items()))}; "
                f"actual = {dict(sorted(actual_prov.items()))}"
            )

    # The traceability "Fixtures" column legitimately references invariants in
    # `ALK-V2-INVARIANTS.md` as well as fixture bodies (`INV-C3`, `INV-D2`,
    # `INV-B6` and others are invariant ids, not fixture ids). Both resolve.
    resolvable = set(body_set) | set(invariant_ids or ())
    dangling: Dict[str, Set[str]] = {}
    prose_refs: Set[str] = set()
    for rule in _trace_rules(trace):
        for fid in _split_list(rule.get("fixtures")):
            if not fid or fid in resolvable:
                continue
            if " " in fid or fid.islower() or ".." in fid:
                # "data contract", "module design section 6", "INV-A1..INV-I6":
                # a pointer at a document or a span, not a covering artefact id.
                prose_refs.add(f"`{fid}` (from {rule.get('id')})")
                continue
            dangling.setdefault(fid, set()).add(str(rule.get("id")))
    for fid in sorted(dangling):
        rules_naming = sorted(dangling[fid])
        violations.append(
            f"traceability claims coverage by `{fid}`, which is neither a fixture "
            f"body nor an invariant; named by "
            f"{', '.join(rules_naming[:4])}"
            + (f" and {len(rules_naming) - 4} more" if len(rules_naming) > 4 else "")
        )
    for p in sorted(prose_refs):
        violations.append(
            f"traceability's Fixtures column carries a prose or span reference "
            f"rather than a covering artefact id: {p}"
        )

    for oi, fids in (c.index.get("openIssueCoverage") or {}).items():
        for fid in fids:
            if fid not in body_set:
                violations.append(
                    f"index.json openIssueCoverage[{oi}] names `{fid}`, which does not exist"
                )

    return CheckOutcome(
        check_id="CHK-INDEX-INTEGRITY",
        title="Fixture index, fixture bodies and rule traceability agree",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{len(c.fixtures)} fixture bodies against {len(index_set)} index entries, "
            f"per-file counts and id lists, declared totals and provenance census, and "
            f"every fixture id referenced by {len(_trace_rules(trace))} traceability rules"
        ),
        violations=violations,
        subjects_examined=len(c.fixtures),
    )


def check_trace_coverage(c: corpus_mod.Corpus, trace: Dict[str, Any]) -> CheckOutcome:
    """Conformance-gate item 7: every `ACTIVE` rule has at least one fixture."""
    violations: List[str] = []
    rules = _trace_rules(trace)
    active = 0
    for rule in rules:
        activity = (rule.get("activeInAlkOnlyV2") or "").strip()
        if not activity.startswith("ACTIVE"):
            continue
        active += 1
        fids = _split_list(rule.get("fixtures"))
        if not fids:
            violations.append(
                f"rule `{rule.get('id')}` is ACTIVE but names no fixture"
            )

    declared_missing = ((trace.get("totals") or {}).get("rulesWithoutFixture"))
    if declared_missing is not None and declared_missing and not violations:
        violations.append(
            f"traceability declares rulesWithoutFixture={declared_missing!r} but every "
            f"ACTIVE rule names a fixture; the declaration is stale"
        )

    return CheckOutcome(
        check_id="CHK-TRACE-COVERAGE",
        title="Every ACTIVE canon rule names a covering fixture",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{active} of {len(rules)} traceability rules marked ACTIVE, each required "
            f"to name at least one fixture (conformance gate item 7)"
        ),
        violations=violations,
        subjects_examined=active,
    )


def check_dimension_safety(contract: dc_mod.Contract) -> CheckOutcome:
    """`INV-B7` / `INV-ALK-VARIABLES-001`, the part executable without code.

    The full invariant is about implementation fields. Until an engine exists
    the subject is the data contract itself: it declares the field names an
    engine must use, so a contract field with two dimensions, or a forbidden
    bare name, is the defect arriving one layer earlier.
    """
    violations: List[str] = list(contract.parse_problems)
    examined = 0
    all_fields = (
        [("EngineResult", f) for f in contract.engine_result_fields]
        + [("ReasonCode", f) for f in contract.reason_code_fields]
        + [("AuditTrace", f) for f in contract.audit_trace_fields]
    )
    for owner, name in all_fields:
        examined += 1
        if name in contract.forbidden_bare_names and name not in contract.container_fields:
            violations.append(
                f"{owner}.{name} uses a bare name the contract forbids "
                f"({', '.join(sorted(contract.forbidden_bare_names))})"
            )
        hits = [s for s in contract.dimension_suffixes if name.endswith(s)]
        if len(hits) > 1:
            longest = max(len(h) for h in hits)
            if sum(1 for h in hits if len(h) == longest) > 1:
                violations.append(
                    f"{owner}.{name} ends with more than one dimension suffix "
                    f"({', '.join(sorted(hits))}); one dimension per field"
                )
    return CheckOutcome(
        check_id="CHK-DIMENSION-SAFETY",
        title="Data-contract field names carry exactly one dimension",
        status=FAIL if violations else PASS,
        what_was_checked=(
            f"{examined} field names declared by EngineResult, ReasonCode and "
            f"AuditTrace against the {len(contract.dimension_suffixes)} dimension "
            f"suffixes and {len(contract.forbidden_bare_names)} forbidden bare names "
            f"in {contract.source} §0"
        ),
        violations=violations,
        subjects_examined=examined,
    )


def run_document_checks(
    c: corpus_mod.Corpus,
    cat: rc_mod.Catalogue,
    contract: dc_mod.Contract,
    invariant_ids: Optional[Iterable[str]] = None,
) -> Tuple[List[CheckOutcome], List[str]]:
    trace, problems = load_traceability()
    outcomes = [
        check_catalogue_self_consistency(cat),
        check_reason_code_closure_documents(c, cat, trace),
        check_reason_code_owner_single(cat, trace),
        check_index_integrity(c, trace, invariant_ids),
        check_trace_coverage(c, trace),
        check_dimension_safety(contract),
    ]
    return outcomes, problems
