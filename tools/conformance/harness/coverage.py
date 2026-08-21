"""Conversion coverage per engine path.

`6 of 204` is a true number that tells the owner nothing useful. It does not
say *which* behaviour is checkable, so it cannot say whether a path that has
been built is covered, and it makes the 198 look like one undifferentiated
backlog when in fact most of them are attached to behaviour nobody has
implemented yet.

This module answers a better question: **for each distinct area of engine
behaviour, how many of its fixtures execute and how many do not?** So that when
a path is built, the report can show that path fully covered, and the
outstanding fixtures are visibly attached to paths that do not exist.

WHERE THE PATHS COME FROM
    Nowhere in this file. `traceability/alk-v2-traceability.json` already
    assigns every rule exactly one `owner`, from a closed set of sixteen, and
    `ALK-V2-MODULE-DESIGN.md` uses the same names for the modules that own each
    layer. A fixture declares `rulesExercised`; joining the two gives the
    fixture's engine paths.

    The harness transcribes nothing (`CONFORMANCE-HARNESS.md`), and a
    hand-written fixture-to-path table here would be a second owner of a
    mapping the traceability table already owns -- which `MASTER RULE 1` calls
    a defect rather than a coincidence.

WHAT IS DELIBERATELY NOT HIDDEN
    Three things, because the point of this report is to add meaning, not to
    replace the backlog with a summary:

    1. Every unconverted fixture is still named individually, by class, in the
       NOT COVERED section. This module adds a view; it removes none.
    2. A fixture whose rules do not resolve to an owner is reported under
       `UNATTRIBUTED`, with the reason. It is never silently dropped, and no
       owner is guessed for it.
    3. A `PROPERTY` body is counted apart from worked examples. It is a
       different kind of check, not an unconverted one, and rolling it into a
       conversion backlog would overstate the work outstanding.

NOT CONVERSION WORK
    For the same reason, a coverage alias (`CROSS_REFERENCE`) and a body that
    is not a fixture yet (`NO_INPUT`) are counted apart as `non_conversion`.
    `EXECUTABLE-FIXTURE-FORMAT.md` §7 says of an alias that it is "never
    executable and must never be counted as an unconverted fixture awaiting
    work", and §9 says the no-input bodies "are not fixtures yet".

    Counting them as outstanding conversion work put eleven of the seventeen
    paths in a state they could never leave: POTENCY, MAINTENANCE, RESPONSE,
    RETURN, TREND and six others carry an alias or a no-input body, so no
    amount of real conversion could ever have cleared them. They are still
    named individually in the NOT COVERED section -- they are moved out of the
    denominator, not out of the report.
"""

from __future__ import annotations

import collections
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Set

from . import corpus as corpus_mod

#: The bucket for a fixture whose `rulesExercised` resolves to no owner. Named
#: rather than dropped: a fixture invisible to the coverage view is exactly the
#: "0 of the things I know how to look at" failure the harness exists to avoid.
UNATTRIBUTED = "UNATTRIBUTED"

UNATTRIBUTED_REASON = (
    "the fixture's `rulesExercised` resolves to no owner in the traceability "
    "table -- either it is empty, or its rules are canon section references "
    "(`Part II §48`) rather than table rows. No owner is guessed."
)


@dataclass
class PathCoverage:
    path: str
    executable: List[str] = field(default_factory=list)
    not_executable: List[str] = field(default_factory=list)
    #: Property/simulation/structural/contract bodies, which are a different
    #: kind of check and are never "unconverted worked examples".
    properties: List[str] = field(default_factory=list)
    #: Coverage aliases (`CROSS_REFERENCE`) and bodies that are not fixtures yet
    #: (`NO_INPUT`). Neither is an unconverted worked example, and counting them
    #: as outstanding work made `complete` unreachable on most paths -- see
    #: `NOT CONVERSION WORK` in the module docstring.
    non_conversion: List[str] = field(default_factory=list)

    @property
    def total(self) -> int:
        return (
            len(self.executable)
            + len(self.not_executable)
            + len(self.properties)
            + len(self.non_conversion)
        )

    @property
    def convertible_total(self) -> int:
        """Worked-example fixtures only -- the population conversion applies to."""
        return len(self.executable) + len(self.not_executable)

    @property
    def converted(self) -> bool:
        """Every worked-example fixture on this path is classified EXECUTABLE.

        This is a statement about fixture *shape* and nothing more. It is not
        `complete`: it does not know whether those fixtures pass, and it cannot
        know whether a mutation turns them red. Kept separate from `complete`
        deliberately -- an earlier version of this module called this state
        "COMPLETE" while the same run reported every one of those fixtures
        failing, which is a label promising more than it checked.

        A path with no worked-example fixtures at all is not converted; it is
        empty, and `convertible_total` being zero is reported rather than
        rounded up to 100%.
        """
        return self.convertible_total > 0 and not self.not_executable

    def complete(self, passed: Set[str]) -> bool:
        """`converted`, and every one of those fixtures actually passed.

        `passed` is the set of fixture ids the run observed passing. With no
        engine it is empty, so no path reports complete -- which is the point.

        **This still checks only two of the standing rule's three clauses.**
        *An engine path is not complete until its fixtures execute and its
        mutations turn them red* -- and the mutation arm runs in a separate
        process (`run-mutations.py`) against a reference oracle, so this report
        cannot see it. The renderer says so rather than letting COMPLETE be
        read as the whole rule.
        """
        return self.converted and all(f in passed for f in self.executable)


@dataclass
class CoverageReport:
    paths: List[PathCoverage] = field(default_factory=list)
    #: Rule ids named by a fixture that the traceability table does not carry.
    unresolved_rules: Dict[str, int] = field(default_factory=dict)
    #: Self-consistency failures, surfaced as corpus problems by the runner.
    problems: List[str] = field(default_factory=list)

    def by_path(self, name: str) -> Optional[PathCoverage]:
        for p in self.paths:
            if p.path == name:
                return p
        return None

    @property
    def fixtures_seen(self) -> Set[str]:
        out: Set[str] = set()
        for p in self.paths:
            out |= (
                set(p.executable)
                | set(p.not_executable)
                | set(p.properties)
                | set(p.non_conversion)
            )
        return out


def _rule_owners(trace: Dict[str, Any]) -> Dict[str, str]:
    """rule id -> owning module, straight from the traceability table."""
    out: Dict[str, str] = {}
    for group in trace.get("groups") or []:
        for rule in group.get("rules") or []:
            rid, owner = rule.get("id"), rule.get("owner")
            if isinstance(rid, str) and isinstance(owner, str) and owner.strip():
                out[rid] = owner.strip()
    return out


def _is_property_body(f: corpus_mod.Fixture) -> bool:
    return f.klass == corpus_mod.PROPERTY_FIXTURE


#: Classes that are not worked examples awaiting conversion, and so belong in
#: neither side of the conversion ratio. See `NOT CONVERSION WORK` above.
_NON_CONVERSION_CLASSES = (corpus_mod.CROSS_REFERENCE, corpus_mod.NO_INPUT)


def _is_non_conversion_body(f: corpus_mod.Fixture) -> bool:
    return f.klass in _NON_CONVERSION_CLASSES


def build(c: corpus_mod.Corpus, trace: Dict[str, Any]) -> CoverageReport:
    owners = _rule_owners(trace)
    buckets: Dict[str, PathCoverage] = {}
    unresolved: collections.Counter = collections.Counter()

    def bucket(name: str) -> PathCoverage:
        if name not in buckets:
            buckets[name] = PathCoverage(path=name)
        return buckets[name]

    # Every owner in the table gets a row even if no fixture reaches it. A path
    # with zero fixtures is a real and reportable state -- it is the shape of
    # "nobody has written a check for this behaviour at all" -- and omitting
    # the row would make it invisible.
    for owner in sorted(set(owners.values())):
        bucket(owner)

    for f in c.fixtures:
        rules = [r for r in (f.body.get("rulesExercised") or []) if isinstance(r, str)]
        paths: Set[str] = set()
        for r in rules:
            if r in owners:
                paths.add(owners[r])
            else:
                unresolved[r] += 1
        if not paths:
            paths = {UNATTRIBUTED}
        for p in sorted(paths):
            b = bucket(p)
            if _is_property_body(f):
                b.properties.append(f.fixture_id)
            elif _is_non_conversion_body(f):
                b.non_conversion.append(f.fixture_id)
            elif f.klass == corpus_mod.EXECUTABLE:
                b.executable.append(f.fixture_id)
            else:
                b.not_executable.append(f.fixture_id)

    report = CoverageReport(unresolved_rules=dict(unresolved))

    ordered = sorted(
        buckets.values(),
        # Worst-covered first, so the report opens on what is missing; then by
        # size, so a large uncovered path outranks a small one.
        key=lambda p: (
            p.path == UNATTRIBUTED,
            len(p.executable) / p.convertible_total if p.convertible_total else 2.0,
            -p.convertible_total,
            p.path,
        ),
    )
    report.paths = ordered

    # Every fixture must land in some bucket, `UNATTRIBUTED` included. That is
    # true by construction today -- a fixture with no resolvable owner is
    # explicitly bucketed rather than skipped -- so this assertion cannot fire
    # as the code now stands. It is here as a guard against the edit that
    # introduces a filter: a fixture invisible to the coverage view is the
    # "0 of the things I know how to look at" failure, and the harness's rule
    # is that such a loss fails loudly rather than reporting a small clean
    # number. Surfaced as a corpus problem, which is red.
    missing = sorted({f.fixture_id for f in c.fixtures} - report.fixtures_seen)
    for fid in missing:
        report.problems.append(
            f"coverage: fixture `{fid}` appears on no engine path and not under "
            f"{UNATTRIBUTED}; it is invisible to the per-path coverage view"
        )
    return report
