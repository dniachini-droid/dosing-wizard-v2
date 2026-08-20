"""Runs the corpus against an engine and assembles the run report."""

from __future__ import annotations

import copy
import subprocess
from typing import Any, Dict, List, Optional, Tuple

from . import checks as checks_mod
from . import compare as compare_mod
from . import corpus as corpus_mod
from . import data_contract as dc_mod
from . import engine_adapter as ea
from . import engine_checks as ec_mod
from . import invariant_checks as ic_mod
from . import invariants_doc as idoc_mod
from . import paths
from . import reason_codes as rc_mod
from .results import (
    ENGINE_ABSENT,
    FAIL,
    NOT_COVERED,
    NOT_EXECUTABLE,
    PASS,
    FixtureOutcome,
    RunReport,
)


def _base_commit() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=paths.ROOT,
            capture_output=True,
            text=True,
            check=True,
        )
        return out.stdout.strip()
    except Exception:  # noqa: BLE001
        return "(not a git working tree)"


def _request_for(f: corpus_mod.Fixture, c: corpus_mod.Corpus) -> Dict[str, Any]:
    inp = f.body.get("input") or {}
    config = dict((c.config_defaults.get("configurations") or {}).get("CANON_DEFAULT") or {})
    config.update(f.body.get("config") or {})
    return {
        "op": "assess",
        "fixtureId": f.fixture_id,
        "asOf": inp.get("asOf"),
        "events": copy.deepcopy(inp.get("events") or []),
        "configuration": config,
        "configurationHistory": [config],
    }


def _check_forbidden(
    f: corpus_mod.Fixture, result: Dict[str, Any], cat: rc_mod.Catalogue
) -> List[str]:
    """A forbidden state, value or code must not appear (fixture schema
    `acceptanceRule.aFixtureFailsIf`)."""
    out: List[str] = []
    for key, value in f.forbidden.items():
        if key in ("note", "$comment", "cases", "wording"):
            continue
        if key in ("reasonCodes", "reasonCode", "codes"):
            emitted = set()
            for rc in result.get("reasonCodes") or []:
                code = rc if isinstance(rc, str) else (
                    rc.get("code") if isinstance(rc, dict) else None
                )
                if isinstance(code, str):
                    emitted.add(code)
            for banned in value if isinstance(value, list) else [value]:
                if banned in emitted:
                    out.append(f"forbidden reason code `{banned}` was emitted")
            continue
        if key not in result:
            continue
        actual = result[key]
        if isinstance(value, (int, float)) and isinstance(actual, (int, float)):
            if abs(float(actual) - float(value)) <= 1e-12:
                out.append(f"forbidden value {key} == {value} was returned")
        elif actual == value:
            out.append(f"forbidden value {key} == {value!r} was returned")
    return out


def run(
    engine: ea.Engine,
    only: Optional[List[str]] = None,
) -> RunReport:
    report = RunReport(base_commit=_base_commit(), engine_name=engine.name)
    report.engine_present = not isinstance(engine, ea.AbsentEngine)

    c = corpus_mod.load()
    cat = rc_mod.load()
    contract = dc_mod.load()
    inv_doc = idoc_mod.load()

    report.corpus_problems.extend(c.load_problems)
    report.corpus_problems.extend(inv_doc.parse_problems)
    report.corpus_problems.extend(contract.parse_problems)

    doc_checks, trace_problems = checks_mod.run_document_checks(
        c, cat, contract, inv_doc.ids
    )
    report.corpus_problems.extend(trace_problems)
    report.checks.extend(doc_checks)

    schema_tolerance = c.schema
    replies: List[Tuple[str, Dict[str, Any]]] = []

    for f in c.fixtures:
        if only and f.fixture_id not in only:
            continue
        if f.klass != corpus_mod.EXECUTABLE:
            report.fixtures.append(
                FixtureOutcome(
                    fixture_id=f.fixture_id,
                    source_file=f.source_file,
                    klass=f.klass,
                    status=NOT_EXECUTABLE,
                    detail=f.reason,
                    skipped_prose=f.unreadable_expectations,
                )
            )
            continue

        reply = engine.assess(_request_for(f, c))
        if not reply.ok:
            report.fixtures.append(
                FixtureOutcome(
                    fixture_id=f.fixture_id,
                    source_file=f.source_file,
                    klass=f.klass,
                    status=FAIL,
                    detail=(
                        "no engine present"
                        if reply.absent
                        else f"engine error: {reply.error}"
                    ),
                    expected="<fixture expectations>",
                    actual=ENGINE_ABSENT if reply.absent else reply.error,
                    skipped_prose=f.unreadable_expectations,
                )
            )
            continue

        result = reply.result or {}
        replies.append((f.fixture_id, result))
        tol = compare_mod.effective_tolerance(schema_tolerance, f.tolerance)

        mismatches: List[str] = []
        prose: List[str] = []
        tol_unspec: List[str] = []
        compared = 0
        expected_summary: Dict[str, Any] = {}
        actual_summary: Dict[str, Any] = {}

        flat = compare_mod.flatten(result)
        for block in corpus_mod.EXPECTATION_BLOCKS:
            exp = f.body.get(block)
            if not isinstance(exp, dict):
                continue
            cr = compare_mod.compare_by_name(exp, flat, tol, block)
            compared += cr.compared
            prose.extend(cr.skipped_prose)
            tol_unspec.extend(cr.tolerance_unspecified)
            for m in cr.mismatches:
                mismatches.append(
                    f"{m.path}: expected {m.expected!r}, got {m.actual!r} ({m.why})"
                )
                expected_summary[m.path] = m.expected
                actual_summary[m.path] = m.actual

        emitted = set()
        for rc in result.get("reasonCodes") or []:
            code = rc if isinstance(rc, str) else (
                rc.get("code") if isinstance(rc, dict) else None
            )
            if isinstance(code, str):
                emitted.add(code)
        for required in f.expected_reason_codes:
            compared += 1
            if required not in emitted:
                mismatches.append(f"required reason code `{required}` was not emitted")
                expected_summary["reasonCodes"] = f.expected_reason_codes
                actual_summary["reasonCodes"] = sorted(emitted)

        for v in _check_forbidden(f, result, cat):
            mismatches.append(v)

        report.fixtures.append(
            FixtureOutcome(
                fixture_id=f.fixture_id,
                source_file=f.source_file,
                klass=f.klass,
                status=FAIL if mismatches else PASS,
                expected=expected_summary or "<all expectations matched>",
                actual=actual_summary or "<all expectations matched>",
                detail="" if mismatches else "every comparable expectation matched",
                mismatches=mismatches,
                skipped_prose=sorted(set(prose) | set(f.unreadable_expectations)),
                tolerance_unspecified=sorted(set(tol_unspec)),
                compared=compared,
            )
        )

    report.checks.extend(ec_mod.run_engine_checks(replies, contract, cat))

    by_id = {ch.check_id: ch for ch in report.checks}
    delegated_status = {}
    for inv_id, chk_expr in ic_mod.DELEGATED_TO_CHECKS.items():
        statuses = [
            by_id[cid].status
            for cid in (p.strip() for p in chk_expr.split("+"))
            if cid in by_id
        ]
        if not statuses:
            delegated_status[inv_id] = NOT_EXECUTABLE
        elif FAIL in statuses:
            delegated_status[inv_id] = FAIL
        elif all(s == NOT_COVERED for s in statuses):
            delegated_status[inv_id] = NOT_EXECUTABLE
        else:
            delegated_status[inv_id] = PASS
    delegated_status["INV-B7"] = by_id["CHK-DIMENSION-SAFETY"].status

    inv_outcomes, inv_problems = ic_mod.run_invariants(
        engine, c, inv_doc, delegated_status
    )
    report.invariants.extend(inv_outcomes)
    report.corpus_problems.extend(inv_problems)

    report.meta = {
        "fixtureCount": len(c.fixtures),
        "declaredFixtureCount": c.declared_total,
        "reasonCodeCount": len(cat.closed_set),
        "invariantCount": len(inv_doc.invariants),
        "engineResultFields": len(contract.engine_result_fields),
        "corpusSource": paths.rel(paths.FIXTURES),
    }
    return report
