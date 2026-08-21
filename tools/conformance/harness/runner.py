"""Runs the corpus against an engine and assembles the run report."""

from __future__ import annotations

import copy
import subprocess
from typing import Any, Dict, List, Optional, Tuple

from . import checks as checks_mod
from . import compare as compare_mod
from . import corpus as corpus_mod
from . import coverage as coverage_mod
from . import data_contract as dc_mod
from . import engine_adapter as ea
from . import engine_checks as ec_mod
from . import invariant_checks as ic_mod
from . import invariants_doc as idoc_mod
from . import package_checks as pkg_mod
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
    """Build the engine request.

    **The fixture id is deliberately not sent.** The documented interface is one
    pure function of `(eventLedger, configurationHistory, asOf)`
    (`ALK-V2-IMPLEMENTATION-CONTRACT.md` §4), and the fixture id is not one of
    those three. Putting it in the request would hand the engine the key to a
    published answer table, and nothing in the harness could then tell a correct
    engine from a lookup. `requestId` is an opaque correlation handle carrying
    no information about which fixture is being asked.
    """
    inp = f.body.get("input") or {}
    config = dict((c.config_defaults.get("configurations") or {}).get("CANON_DEFAULT") or {})
    config.update(f.body.get("config") or {})

    # `configurationHistory` is the second of the interface's three arguments,
    # and canon §518 requires the engine to resolve the version effective at
    # `assessmentAsOf` -- so a fixture whose subject is a configuration *change*
    # has to be able to state one. `EXECUTABLE-FIXTURE-FORMAT.md` §4.2 tells
    # authors to prefer it over the top-level `config` for exactly that case.
    #
    # This previously built `[config]` unconditionally and never read the
    # field. A fixture supplying a history would have run against a single
    # flattened snapshot, silently, and would most likely have passed -- then
    # stood as evidence that effective-dated configuration worked. Documenting
    # a preferred input that nothing reads is worse than not offering it.
    history = inp.get("configurationHistory")
    if isinstance(history, list) and history:
        # Each entry is merged onto CANON_DEFAULT the same way the top-level
        # `config` is, so a history entry states only what it changes.
        resolved = []
        for entry in history:
            merged = dict(
                (c.config_defaults.get("configurations") or {}).get("CANON_DEFAULT") or {}
            )
            if isinstance(entry, dict):
                merged.update(entry)
            resolved.append(merged)
        configuration_history = resolved
        # The configuration in force at `asOf` is the fixture's own last entry;
        # the harness does not re-derive it, because choosing which entry is
        # effective is engine behaviour and canon §518 owns the rule.
        config = dict(resolved[-1])
    else:
        configuration_history = [config]

    return {
        "op": "assess",
        "requestId": f"req-{abs(hash(f.fixture_id)) % 10**12:012d}",
        "asOf": inp.get("asOf"),
        "events": copy.deepcopy(inp.get("events") or []),
        "configuration": config,
        "configurationHistory": copy.deepcopy(configuration_history),
    }


#: Forbidden keys that are documentation rather than assertions.
_FORBIDDEN_PROSE_KEYS = ("note", "$comment", "cases", "wording")
_FORBIDDEN_CODE_KEYS = ("reasonCodes", "reasonCode", "codes")


def _check_forbidden(
    f: corpus_mod.Fixture,
    result: Dict[str, Any],
    cat: rc_mod.Catalogue,
    epsilon: float,
) -> Tuple[List[str], List[str]]:
    """A forbidden state, value or code must not appear.

    Fixture schema `acceptanceRule.aFixtureFailsIf` clause 3. Returns
    `(violations, unevaluable)`.

    Forbidden keys are resolved through the same flattened-name index the
    comparator uses. An earlier version looked only at top-level `EngineResult`
    keys, which meant 19 of the corpus's 21 substantive `forbidden` entries
    named nested fields (`action`, `recommendedDoseMlPerDay`,
    `predictedPostSlopeDkhPerDay`, ...) and were skipped **silently** — the
    check could not fire, and the mutation that was supposed to prove it fires
    was passing for an unrelated reason. Anything still unresolvable is now
    returned as an explicit gap rather than dropped.
    """
    violations: List[str] = []
    unevaluable: List[str] = []
    flat = compare_mod.flatten(result)

    for key, value in f.forbidden.items():
        if key in _FORBIDDEN_PROSE_KEYS:
            continue
        if key in _FORBIDDEN_CODE_KEYS:
            emitted = set()
            for rc in result.get("reasonCodes") or []:
                code = rc if isinstance(rc, str) else (
                    rc.get("code") if isinstance(rc, dict) else None
                )
                if isinstance(code, str):
                    emitted.add(code)
            for banned in value if isinstance(value, list) else [value]:
                if banned in emitted:
                    violations.append(
                        f"forbidden reason code `{banned}` was emitted"
                    )
            continue

        found = flat.get(key)
        if not found:
            unevaluable.append(
                f"forbidden.{key}: no field of that name in the engine result, so "
                f"the assertion could not be evaluated"
            )
            continue
        for path, actual in found:
            if isinstance(value, bool) or isinstance(actual, bool):
                hit = actual is value
            elif isinstance(value, (int, float)) and isinstance(actual, (int, float)):
                hit = abs(float(actual) - float(value)) <= epsilon
            else:
                hit = actual == value
            if hit:
                violations.append(
                    f"forbidden value {path} == {value!r} was returned"
                )
    return violations, unevaluable


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

    # The package-level checks absorbed from the retired freeze validator.
    # They read the canon, the open-issues register and the algorithm
    # contract, which nothing else in this harness opens, and they recompute
    # the corpus's stated intermediates from the corpus's own declared inputs.
    # `docs/process/GATE-CHECK-INVENTORY.md` records what moved and what did
    # not.
    pkg_checks, pkg_assertions = pkg_mod.run_package_checks()
    report.checks.extend(pkg_checks)
    report.package_assertions = pkg_assertions
    # A floor on how much of itself the gate examined. Several absorbed checks
    # are guarded on a fixture or a document section existing, so an edit can
    # delete assertions instead of failing them -- and a gate that quietly
    # examines less reports a smaller, cleaner pass. Reported here, with the
    # unaccounted-invariant assertion, because both answer the same question:
    # can this harness account for itself?
    if pkg_assertions < pkg_mod.EXPECTED_ASSERTIONS:
        report.corpus_problems.append(
            f"the package checks made {pkg_assertions} assertions; "
            f"{pkg_mod.EXPECTED_ASSERTIONS} were expected. "
            f"{pkg_mod.EXPECTED_ASSERTIONS - pkg_assertions} assertion(s) did "
            f"not run. A guarded check whose subject was renamed or removed "
            f"disappears rather than failing, so this is a coverage loss even "
            f"though nothing above went red."
        )

    schema_tolerance = c.schema
    replies: List[Tuple[str, Dict[str, Any]]] = []

    if only:
        # A mistyped --only used to produce a complete-looking report over zero
        # fixtures, with an empty NOT COVERED section and no warning. A filter
        # that selects nothing is an operator error, not a clean run.
        unknown = sorted(set(only) - {f.fixture_id for f in c.fixtures})
        for u in unknown:
            report.corpus_problems.append(
                f"--only names `{u}`, which is not a fixture in the corpus"
            )

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
        notes: List[str] = list(
            compare_mod.widened_tolerances(schema_tolerance, f.tolerance)
        )
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
            notes.extend(cr.precision_below_tolerance)
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

        forbidden_violations, forbidden_unevaluable = _check_forbidden(
            f, result, cat, compare_mod.forbidden_epsilon(schema_tolerance)
        )
        mismatches.extend(forbidden_violations)
        notes.extend(forbidden_unevaluable)

        if mismatches:
            status, detail = FAIL, ""
        elif compared == 0:
            # A fixture with nothing comparable is not a pass. Counting it as
            # one is the precise failure this harness exists to prevent: a
            # coverage number that means "0 of the things I know how to look
            # at".
            status = NOT_COVERED
            detail = (
                "the engine answered, but no expectation of this fixture was in a "
                "shape the harness could compare; nothing was verified"
            )
        else:
            status, detail = PASS, "every comparable expectation matched"

        report.fixtures.append(
            FixtureOutcome(
                fixture_id=f.fixture_id,
                source_file=f.source_file,
                klass=f.klass,
                status=status,
                expected=expected_summary or "<all expectations matched>",
                actual=actual_summary or "<all expectations matched>",
                detail=detail,
                mismatches=mismatches,
                skipped_prose=sorted(set(prose) | set(f.unreadable_expectations)),
                tolerance_unspecified=sorted(set(tol_unspec)),
                notes=sorted(set(notes)),
                open_questions=[
                    q
                    for q in ((f.body.get("conversion") or {}).get("questionsRaised") or [])
                    if isinstance(q, str)
                ],
                compared=compared,
            )
        )

    report.checks.extend(ec_mod.run_engine_checks(replies, contract, cat))

    described = engine.describe() if report.engine_present else {}
    report.checks.append(checks_mod.check_engine_version(described, replies, c))
    report.engine_version = str(described.get("engineVersion") or "(not declared)")
    report.canon_version = str(
        described.get("canonVersion")
        or next(
            (r.get("canonVersion") for _, r in replies if r.get("canonVersion")),
            "(not declared)",
        )
    )

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

    # Conversion coverage per engine path. Built from the traceability table's
    # own owner column, so the harness still transcribes no mapping of its own.
    trace_doc, trace_load_problems = checks_mod.load_traceability()
    report.corpus_problems.extend(trace_load_problems)
    report.coverage = coverage_mod.build(c, trace_doc)
    report.corpus_problems.extend(report.coverage.problems)

    report.meta = {
        "fixtureCount": len(c.fixtures),
        "declaredFixtureCount": c.declared_total,
        "reasonCodeCount": len(cat.closed_set),
        "invariantCount": len(inv_doc.invariants),
        "engineResultFields": len(contract.engine_result_fields),
        "corpusSource": paths.rel(paths.FIXTURES),
        "packageAssertions": pkg_assertions,
    }
    return report
