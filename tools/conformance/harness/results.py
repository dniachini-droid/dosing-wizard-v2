"""Result records shared by every stage of the harness."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

PASS = "PASS"
FAIL = "FAIL"
NOT_COVERED = "NOT_COVERED"
NOT_EXECUTABLE = "NOT_EXECUTABLE"
ENGINE_ABSENT = "ENGINE_ABSENT"


@dataclass
class FixtureOutcome:
    fixture_id: str
    source_file: str
    klass: str
    status: str
    expected: Any = None
    actual: Any = None
    detail: str = ""
    mismatches: List[str] = field(default_factory=list)
    skipped_prose: List[str] = field(default_factory=list)
    tolerance_unspecified: List[str] = field(default_factory=list)
    #: Things the harness could not evaluate, or evaluated under a caveat.
    #: Never a pass and never a failure -- a visible gap.
    notes: List[str] = field(default_factory=list)
    compared: int = 0

    @property
    def counts_as_failure(self) -> bool:
        return self.status == FAIL


@dataclass
class CheckOutcome:
    check_id: str
    title: str
    status: str
    what_was_checked: str
    detail: str = ""
    violations: List[str] = field(default_factory=list)
    subjects_examined: int = 0

    @property
    def counts_as_failure(self) -> bool:
        return self.status == FAIL


@dataclass
class InvariantOutcome:
    inv_id: str
    title: str
    status: str
    what_was_checked: str
    detail: str = ""
    violations: List[str] = field(default_factory=list)
    has_stated_negative_control: bool = False
    not_executable_reason: str = ""

    @property
    def counts_as_failure(self) -> bool:
        return self.status == FAIL


@dataclass
class RunReport:
    base_commit: str = ""
    engine_name: str = ""
    engine_present: bool = False
    engine_version: str = "(not declared)"
    canon_version: str = "(not declared)"
    fixtures: List[FixtureOutcome] = field(default_factory=list)
    checks: List[CheckOutcome] = field(default_factory=list)
    invariants: List[InvariantOutcome] = field(default_factory=list)
    corpus_problems: List[str] = field(default_factory=list)
    notes: List[str] = field(default_factory=list)
    meta: Dict[str, Any] = field(default_factory=dict)

    @property
    def failures(self) -> int:
        return (
            sum(1 for f in self.fixtures if f.counts_as_failure)
            + sum(1 for c in self.checks if c.counts_as_failure)
            + sum(1 for i in self.invariants if i.counts_as_failure)
        )

    @property
    def red(self) -> bool:
        return self.failures > 0 or bool(self.corpus_problems)

    def exit_code(self) -> int:
        return 1 if self.red else 0


def failing_subject_ids(report: "RunReport") -> set:
    """Every subject the run reported as failing, as a stable id.

    The mutation harness compares this set before and after a sabotage: a
    mutation is caught when it adds failures the baseline did not have.
    Measuring the delta rather than the absolute verdict matters because the
    repository has pre-existing document defects that keep the absolute
    verdict RED regardless of any mutation.
    """
    out = set()
    for f in report.fixtures:
        if f.counts_as_failure:
            out.add(f"fixture:{f.fixture_id}")
    for c in report.checks:
        if c.counts_as_failure:
            out.add(f"check:{c.check_id}")
    for i in report.invariants:
        if i.counts_as_failure:
            out.add(f"invariant:{i.inv_id}")
    return out
