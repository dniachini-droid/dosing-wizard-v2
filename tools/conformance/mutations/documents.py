"""Document mutations — negative controls for the checks that read documents.

Every mutation in `mutations/__init__.py` is a hook on the echo oracle, so
none of them can reach a check whose subject is a *document* rather than an
engine reply. Three checks were therefore reporting PASS with nothing keeping
them honest:

    CHK-RC-CATALOGUE      the reason-code catalogue against its own summary
    CHK-TRACE-COVERAGE    every ACTIVE rule naming a covering fixture
    CHK-DIMENSION-SAFETY  one dimension per field name

and so was the harness's own completeness assertion, that the invariants it
executes plus the invariants it accounts for partition the document exactly.

`DEC-016`: "A change that adds a checker adds its negative control in the same
change." These are those controls.

Each one copies the alk-v2 package to a temporary tree, corrupts one document,
points the harness at the copy via `ALK_V2_PACKAGE_DIR`, and requires the named
check to fail. **The repository itself is never modified** -- the corruption
lives and dies inside `tempfile.mkdtemp()`.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from typing import Callable, List

HARNESS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(os.path.dirname(HARNESS_DIR))
PACKAGE_DIR = os.path.join(REPO_ROOT, "docs", "implementation", "alk-v2")


@dataclass
class DocumentMutation:
    mid: str
    title: str
    sabotage: str
    guards: str
    #: The check id that must go red.
    expect_check: str
    #: A substring that must appear in that check's violation text.
    expect_mechanism: str
    apply: Callable[[str], None] = field(repr=False, default=lambda _: None)


# ---------------------------------------------------------------------------
# the sabotages, each acting on a throwaway copy of the package
# ---------------------------------------------------------------------------


def _d1_duplicate_catalogue_row(pkg: str) -> None:
    """Repeat one catalogue row, so the coverage summary no longer matches."""
    path = os.path.join(pkg, "ALK-V2-REASON-CODES.md")
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()
    for i, line in enumerate(lines):
        if line.startswith("| `TRAJECTORY_FALLING`"):
            lines.insert(i + 1, line)
            break
    else:  # pragma: no cover - the row exists; guard against a silent no-op
        raise RuntimeError("could not find a catalogue row to duplicate")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)


def _d2_uncovered_active_rule(pkg: str) -> None:
    """Blank the covering fixture of an ACTIVE rule."""
    path = os.path.join(pkg, "traceability", "alk-v2-traceability.json")
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    for group in doc.get("groups") or []:
        for rule in group.get("rules") or []:
            if rule.get("id") == "CORE-CANON-COVERAGE-001":
                rule["fixtures"] = "-"
                break
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2)


def _d3_two_dimensions_on_one_field(pkg: str) -> None:
    """Rename a dimensioned contract field to a forbidden bare name."""
    path = os.path.join(pkg, "ALK-V2-DATA-CONTRACT.md")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    text = text.replace(
        "  latestValidValueDkh       dKH", "  value                     dKH", 1
    )
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def _d4_unaccounted_invariant(pkg: str) -> None:
    """Add a 61st invariant the harness has never heard of."""
    path = os.path.join(pkg, "ALK-V2-INVARIANTS.md")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    addition = (
        "### INV-A9 — An invariant the harness does not know about\n"
        "- **Canon:** none; this entry exists only inside a mutation.\n"
        "- **Assert:** nothing.\n"
        "- **Negative control:** none.\n\n"
    )
    text = text.replace("\n---\n\n## Group B", "\n" + addition + "---\n\n## Group B", 1)
    text = text.replace(
        "| A — Determinism and replay | 4 |", "| A — Determinism and replay | 5 |", 1
    )
    text = text.replace("| **Total** | **60** |", "| **Total** | **61** |", 1)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


DOCUMENT_MUTATIONS: List[DocumentMutation] = [
    DocumentMutation(
        mid="D-1",
        title="Duplicate a row in the reason-code catalogue",
        sabotage="`TRAJECTORY_FALLING` is listed twice",
        guards=(
            "CHK-RC-CATALOGUE. The catalogue's coverage summary is the only "
            "cross-check the document carries against a row being lost or "
            "doubled in an edit, and nothing was keeping that check honest."
        ),
        expect_check="CHK-RC-CATALOGUE",
        expect_mechanism="listed twice",
        apply=_d1_duplicate_catalogue_row,
    ),
    DocumentMutation(
        mid="D-2",
        title="Leave an ACTIVE rule with no covering fixture",
        sabotage="`CORE-CANON-COVERAGE-001`'s fixtures cell is emptied",
        guards=(
            "CHK-TRACE-COVERAGE, i.e. conformance-gate item 7: every rule marked "
            "ACTIVE has at least one passing fixture."
        ),
        expect_check="CHK-TRACE-COVERAGE",
        expect_mechanism="ACTIVE but names no fixture",
        apply=_d2_uncovered_active_rule,
    ),
    DocumentMutation(
        mid="D-3",
        title="Give a data-contract field a forbidden bare name",
        sabotage="`latestValidValueDkh` is renamed to `value`",
        guards=(
            "CHK-DIMENSION-SAFETY / `INV-B7`. This is the check the harness's "
            "whole by-name resolution scheme rests on, and it had no control."
        ),
        expect_check="CHK-DIMENSION-SAFETY",
        expect_mechanism="bare name the contract forbids",
        apply=_d3_two_dimensions_on_one_field,
    ),
    DocumentMutation(
        mid="D-4",
        title="Add an invariant the harness neither runs nor accounts for",
        sabotage="a 61st invariant is inserted, with the coverage table adjusted to match",
        guards=(
            "the harness's own completeness assertion -- that executed plus "
            "accounted-for partitions the invariant document exactly. Without "
            "this, an invariant added and forgotten would silently count as "
            "covered, which is the failure the harness brief singles out."
        ),
        expect_check="corpus-problem",
        expect_mechanism="neither executes it nor states why",
        apply=_d4_unaccounted_invariant,
    ),
]


def run_one(m: DocumentMutation) -> dict:
    """Apply `m` to a throwaway copy and report what the harness said."""
    tmp = tempfile.mkdtemp(prefix=f"alkconf-{m.mid}-")
    try:
        pkg = os.path.join(tmp, "alk-v2")
        shutil.copytree(PACKAGE_DIR, pkg)
        m.apply(pkg)

        env = dict(os.environ)
        env["ALK_V2_PACKAGE_DIR"] = pkg
        env["PYTHONPATH"] = HARNESS_DIR + os.pathsep + env.get("PYTHONPATH", "")
        out = subprocess.run(
            [
                sys.executable,
                os.path.join(HARNESS_DIR, "run-conformance.py"),
                "--json",
                os.path.join(tmp, "report.json"),
                "--quiet",
            ],
            capture_output=True,
            text=True,
            env=env,
            cwd=REPO_ROOT,
        )
        with open(os.path.join(tmp, "report.json"), encoding="utf-8") as fh:
            report = json.load(fh)

        if m.expect_check == "corpus-problem":
            texts = list(report.get("corpusProblems") or [])
            went_red = bool(texts)
        else:
            check = next(
                (c for c in report["checks"] if c["id"] == m.expect_check), None
            )
            texts = list(check["violations"]) if check else []
            went_red = bool(check and check["status"] == "FAIL")

        mechanism_hit = any(m.expect_mechanism in t for t in texts)
        return {
            "wentRed": went_red,
            "mechanismHit": mechanism_hit,
            "exitCode": out.returncode,
            "evidence": next(
                (t for t in texts if m.expect_mechanism in t),
                (texts[0] if texts else "(no violation text)"),
            ),
        }
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
