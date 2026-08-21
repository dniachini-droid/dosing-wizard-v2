"""Rendering. The report says what ran, what did not, and why."""

from __future__ import annotations

import collections
import json
from typing import Any, Dict, List

from . import corpus as corpus_mod
from .results import (
    FAIL,
    NOT_COVERED,
    NOT_EXECUTABLE,
    PASS,
    RunReport,
)

RULE = "=" * 78
THIN = "-" * 78


def _pct(n: int, d: int) -> str:
    return f"{(100.0 * n / d):.0f}%" if d else "n/a"


def render_text(r: RunReport, verbose: bool = False) -> str:
    out: List[str] = []
    w = out.append

    w(RULE)
    w("ALK V2 CONFORMANCE HARNESS")
    w(RULE)
    w(f"base commit      : {r.base_commit}")
    w(f"engine           : {r.engine_name}")
    w(f"engine version   : {r.engine_version}")
    w(f"canon version    : {r.canon_version}")
    w(f"corpus           : {r.meta.get('corpusSource')}")
    w(
        f"corpus size      : {r.meta.get('fixtureCount')} fixtures "
        f"(index declares {r.meta.get('declaredFixtureCount')})"
    )
    w(f"reason-code set  : {r.meta.get('reasonCodeCount')} codes, closed")
    w(f"invariants       : {r.meta.get('invariantCount')} documented")
    w(
        f"package checks   : {r.package_assertions} assertions over the canon, the "
        f"register and the corpus"
    )
    w("")

    # ---- Mechanical checks -------------------------------------------------
    w(RULE)
    w("MECHANICAL CHECKS")
    w(RULE)
    for ch in r.checks:
        w(f"[{ch.status:<14}] {ch.check_id} — {ch.title}")
        w(f"                 checked: {ch.what_was_checked}")
        if ch.detail:
            w(f"                 note: {ch.detail}")
        for v in ch.violations:
            w(f"                 FAIL  {v}")
        w("")

    # ---- Fixtures ----------------------------------------------------------
    w(RULE)
    w("FIXTURES")
    w(RULE)
    executed = [f for f in r.fixtures if f.klass == corpus_mod.EXECUTABLE]
    passed = [f for f in executed if f.status == PASS]
    failed = [f for f in executed if f.status == FAIL]
    vacuous = [f for f in executed if f.status == NOT_COVERED]

    w(f"executable and run : {len(executed)}")
    w(f"  passed           : {len(passed)}")
    w(f"  failed           : {len(failed)}")
    w(f"  nothing to compare : {len(vacuous)}  (answered, but verified nothing)")
    w("")
    if executed:
        w(f"{'FIXTURE':<16}{'STATUS':<8}{'EXPECTED / ACTUAL':<0}")
        w(THIN)
    for f in executed:
        w(f"{f.fixture_id:<16}{f.status:<8}{f.detail}")
        if f.status == PASS:
            w(f"{'':<24}compared {f.compared} expectation(s)")
        for m in f.mismatches[: (None if verbose else 6)]:
            w(f"{'':<24}expected/actual: {m}")
        if not verbose and len(f.mismatches) > 6:
            w(f"{'':<24}... {len(f.mismatches) - 6} further mismatches")
        if f.skipped_prose:
            w(
                f"{'':<24}not comparable ({len(f.skipped_prose)}): "
                f"{'; '.join(f.skipped_prose[:3])}"
                + (" ..." if len(f.skipped_prose) > 3 else "")
            )
        if f.tolerance_unspecified:
            w(
                f"{'':<24}tolerance unspecified for: "
                f"{', '.join(f.tolerance_unspecified[:4])}"
            )
        for n in f.notes[: (None if verbose else 4)]:
            w(f"{'':<24}note: {n}")
        if not verbose and len(f.notes) > 4:
            w(f"{'':<24}note: ... {len(f.notes) - 4} further notes")
    w("")

    # ---- What was NOT covered ---------------------------------------------
    w(RULE)
    w("NOT COVERED — NAMED, NOT COUNTED")
    w(RULE)
    w("Every fixture the harness did not execute, by reason. These are not")
    w("passes and they are not failures; they are gaps, and they are listed in")
    w("full so that a coverage number cannot be read as more than it is.")
    w("")
    by_class = collections.defaultdict(list)
    for f in r.fixtures:
        if f.klass != corpus_mod.EXECUTABLE:
            by_class[f.klass].append(f)
    total_uncovered = 0
    for klass in corpus_mod.CLASS_ORDER:
        if klass == corpus_mod.EXECUTABLE or klass not in by_class:
            continue
        group = by_class[klass]
        total_uncovered += len(group)
        w(f"{klass}  ({len(group)} fixtures)")
        w(f"  why: {corpus_mod.CLASS_REASON[klass]}")
        ids = [f.fixture_id for f in group]
        line = "  "
        for fid in ids:
            if len(line) + len(fid) + 2 > 76:
                w(line)
                line = "  "
            line += fid + "  "
        if line.strip():
            w(line)
        w("")

    prose_fixtures = [f for f in r.fixtures if f.skipped_prose]
    w(f"EXPECTATIONS IN A SHAPE THE HARNESS CANNOT COMPARE  ({len(prose_fixtures)} fixtures)")
    w("  why: the expected value is prose, not a value an engine field can equal.")
    w("       Comparing it would require the harness to interpret a sentence.")
    for f in prose_fixtures[: (None if verbose else 12)]:
        w(f"  {f.fixture_id:<14} {len(f.skipped_prose):>2} entr(y/ies)")
        for p in f.skipped_prose[: (None if verbose else 2)]:
            w(f"                 {p}")
    if not verbose and len(prose_fixtures) > 12:
        w(f"  ... {len(prose_fixtures) - 12} further fixtures; run with --verbose")
    w("")

    w(f"TOTAL NOT EXECUTED: {total_uncovered} of {len(r.fixtures)} fixtures "
      f"({_pct(total_uncovered, len(r.fixtures))})")
    w(f"TOTAL EXECUTED    : {len(executed)} of {len(r.fixtures)} fixtures "
      f"({_pct(len(executed), len(r.fixtures))})")
    w("")

    # ---- Invariants --------------------------------------------------------
    w(RULE)
    w("INVARIANTS")
    w(RULE)
    inv_pass = [i for i in r.invariants if i.status == PASS]
    inv_fail = [i for i in r.invariants if i.status == FAIL]
    inv_none = [i for i in r.invariants if i.status == NOT_EXECUTABLE]
    w(f"documented        : {len(r.invariants)}")
    w(f"  executed, pass  : {len(inv_pass)}")
    w(f"  executed, fail  : {len(inv_fail)}")
    w(f"  no executable form today : {len(inv_none)}")
    no_nc = [i for i in r.invariants if not i.has_stated_negative_control]
    w(f"  with a stated negative control : {len(r.invariants) - len(no_nc)}")
    w(f"  WITHOUT a stated negative control : {len(no_nc)}")
    w("")
    for i in r.invariants:
        if i.status == NOT_EXECUTABLE:
            continue
        w(f"[{i.status:<14}] {i.inv_id} — {i.title}")
        w(f"                 checked: {i.what_was_checked}")
        if i.detail:
            w(f"                 note: {i.detail}")
        for v in i.violations[: (None if verbose else 8)]:
            w(f"                 FAIL  {v}")
        if not verbose and len(i.violations) > 8:
            w(f"                 ... {len(i.violations) - 8} more")
        w("")

    w("INVARIANTS WITH NO EXECUTABLE FORM TODAY — named, with the reason")
    w("")
    grouped = collections.defaultdict(list)
    for i in inv_none:
        grouped[i.not_executable_reason].append(i.inv_id)
    for reason, ids in grouped.items():
        w(f"  {len(ids)} invariant(s): {', '.join(ids)}")
        for chunk in _wrap(reason, 72):
            w(f"      {chunk}")
        w("")

    if no_nc:
        w("INVARIANTS WITH NO STATED NEGATIVE CONTROL")
        w("  Canon CORE-CANON-COVERAGE-001 item 9: a checker is not trusted as a")
        w("  gate until a deliberate mutation of its defect class has been shown")
        w("  to fail it. These invariants name no such mutation.")
        line = "  "
        for i in no_nc:
            if len(line) + len(i.inv_id) + 2 > 76:
                w(line)
                line = "  "
            line += i.inv_id + "  "
        if line.strip():
            w(line)
        w("")

    # ---- Corpus problems ---------------------------------------------------
    if r.corpus_problems:
        w(RULE)
        w("CORPUS / HARNESS-ACCOUNTING PROBLEMS")
        w(RULE)
        for p in r.corpus_problems:
            w(f"  ! {p}")
        w("")

    # ---- Verdict -----------------------------------------------------------
    w(RULE)
    w("VERDICT")
    w(RULE)
    if not r.engine_present:
        w("NO ENGINE SUPPLIED.")
        w("Every executable fixture is reported FAIL / ENGINE_ABSENT rather than")
        w("skipped, because an unrun fixture must never read as a passing one.")
        w("The document-level checks above ran normally and stand on their own.")
        w("")
    w(f"fixture failures   : {sum(1 for f in r.fixtures if f.status == FAIL)}")
    w(f"check failures     : {sum(1 for c in r.checks if c.status == FAIL)}")
    w(f"invariant failures : {sum(1 for i in r.invariants if i.status == FAIL)}")
    w(f"corpus problems    : {len(r.corpus_problems)}")
    w("")
    w(f"RESULT: {'RED' if r.red else 'GREEN'}   (exit {r.exit_code()})")
    w(RULE)
    return "\n".join(out)


def _wrap(text: str, width: int) -> List[str]:
    words = text.split()
    lines: List[str] = []
    cur = ""
    for word in words:
        if len(cur) + len(word) + 1 > width:
            lines.append(cur)
            cur = word
        else:
            cur = f"{cur} {word}".strip()
    if cur:
        lines.append(cur)
    return lines


def render_json(r: RunReport) -> str:
    return json.dumps(
        {
            "baseCommit": r.base_commit,
            "engine": r.engine_name,
            "enginePresent": r.engine_present,
            "engineVersion": r.engine_version,
            "canonVersion": r.canon_version,
            "meta": r.meta,
            "result": "RED" if r.red else "GREEN",
            "exitCode": r.exit_code(),
            "checks": [
                {
                    "id": c.check_id,
                    "title": c.title,
                    "status": c.status,
                    "checked": c.what_was_checked,
                    "violations": c.violations,
                    "subjectsExamined": c.subjects_examined,
                }
                for c in r.checks
            ],
            "fixtures": [
                {
                    "id": f.fixture_id,
                    "file": f.source_file,
                    "class": f.klass,
                    "status": f.status,
                    "expected": f.expected,
                    "actual": f.actual,
                    "detail": f.detail,
                    "mismatches": f.mismatches,
                    "notComparable": f.skipped_prose,
                    "toleranceUnspecified": f.tolerance_unspecified,
                    "notes": f.notes,
                    "compared": f.compared,
                }
                for f in r.fixtures
            ],
            "invariants": [
                {
                    "id": i.inv_id,
                    "title": i.title,
                    "status": i.status,
                    "checked": i.what_was_checked,
                    "violations": i.violations,
                    "hasStatedNegativeControl": i.has_stated_negative_control,
                    "notExecutableReason": i.not_executable_reason,
                }
                for i in r.invariants
            ],
            "corpusProblems": r.corpus_problems,
        },
        indent=2,
    )
