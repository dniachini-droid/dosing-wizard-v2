"""Reader for `ALK-V2-REASON-CODES.md`.

The catalogue is the authority for the closed set. This module transcribes
nothing: it parses the document at run time, so adding a code to the catalogue
adds it to the harness and removing one removes it.

The catalogue states its own parsing rule, and this module obeys it:

    "A checker should therefore match reason codes by their table position
     (code + severity), not by prefix alone."   -- Appendix

So a code is recognised only when it appears in the first column of a
`| Code | Sev | Meaning | Payload |` table that sits under an
`## PREFIX_ — owner: MODULE` heading. Tokens that merely *look* like reason
codes -- the canon enum values listed in the appendix -- are read separately
and are reported as known non-codes rather than as members of the set.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from . import paths

SEVERITIES = ("INFO", "GATING", "REFUSAL", "SAFETY")

_GROUP_HEADING = re.compile(r"^##\s+([A-Z][A-Z0-9]*_)\s+—\s+owner:\s+`([^`]+)`")
_APPENDIX_HEADING = re.compile(r"^##\s+Appendix")
_COVERAGE_HEADING = re.compile(r"^##\s+Coverage summary")
_TABLE_ROW = re.compile(r"^\|\s*`([A-Z][A-Z0-9_]*)`\s*\|\s*`?([A-Z]+)`?\s*\|(.*)\|\s*$")
_APPENDIX_ROW = re.compile(r"^\|\s*`([A-Z][A-Z0-9_]*)`\s*\|\s*([^|]+)\|")


@dataclass(frozen=True)
class ReasonCode:
    code: str
    severity: str
    owner: str
    group: str
    payload: str
    line: int


@dataclass
class Catalogue:
    codes: Dict[str, ReasonCode] = field(default_factory=dict)
    non_codes: Dict[str, str] = field(default_factory=dict)
    declared_group_totals: Dict[str, int] = field(default_factory=dict)
    declared_total: Optional[int] = None
    parse_problems: List[str] = field(default_factory=list)
    source: str = ""

    @property
    def closed_set(self):
        return frozenset(self.codes)

    def severity_of(self, code: str) -> Optional[str]:
        rc = self.codes.get(code)
        return rc.severity if rc else None

    def owner_of(self, code: str) -> Optional[str]:
        rc = self.codes.get(code)
        return rc.owner if rc else None


def load(path: Optional[str] = None) -> Catalogue:
    path = path or paths.REASON_CODES_MD
    cat = Catalogue(source=paths.rel(path))
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    group = None
    owner = None
    in_appendix = False
    in_coverage = False

    for n, raw in enumerate(lines, start=1):
        line = raw.rstrip("\n")

        if _APPENDIX_HEADING.match(line):
            in_appendix, in_coverage, group = True, False, None
            continue
        if _COVERAGE_HEADING.match(line):
            in_coverage, in_appendix, group = True, False, None
            continue

        m = _GROUP_HEADING.match(line)
        if m:
            group, owner = m.group(1), m.group(2)
            in_appendix = in_coverage = False
            continue

        if line.startswith("## "):
            # any other section ends the current group
            group = owner = None
            in_appendix = in_coverage = False
            continue

        if in_appendix:
            m = _APPENDIX_ROW.match(line)
            if m and m.group(1) not in ("Token",):
                cat.non_codes[m.group(1)] = m.group(2).strip()
            continue

        if in_coverage:
            m = re.match(r"^\|\s*`([A-Z][A-Z0-9]*_)`\s*\|\s*(\d+)\s*\|", line)
            if m:
                cat.declared_group_totals[m.group(1)] = int(m.group(2))
                continue
            m = re.match(r"^\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|", line)
            if m:
                cat.declared_total = int(m.group(1))
            continue

        if group is None:
            continue

        m = _TABLE_ROW.match(line)
        if not m:
            continue
        code, severity, rest = m.group(1), m.group(2), m.group(3)
        if severity not in SEVERITIES:
            cat.parse_problems.append(
                f"{cat.source}:{n}: `{code}` has severity `{severity}`, "
                f"which is not one of {', '.join(SEVERITIES)}"
            )
            continue
        if not code.startswith(group):
            cat.parse_problems.append(
                f"{cat.source}:{n}: `{code}` sits under group `{group}` but does "
                f"not carry its prefix"
            )
        payload = rest.rsplit("|", 1)[-1].strip() if "|" in rest else rest.strip()
        if code in cat.codes:
            cat.parse_problems.append(
                f"{cat.source}:{n}: `{code}` is listed twice "
                f"(first at line {cat.codes[code].line})"
            )
            continue
        cat.codes[code] = ReasonCode(
            code=code,
            severity=severity,
            owner=owner or "",
            group=group,
            payload=payload,
            line=n,
        )

    return cat


def self_consistency(cat: Catalogue) -> List[str]:
    """Does the catalogue agree with its own coverage summary?

    A mismatch is a defect in the catalogue, not in an engine, and is reported
    as such. It is checked because the summary is the only cross-check the
    document carries against a row being lost in an edit.
    """
    problems: List[str] = list(cat.parse_problems)
    counted: Dict[str, int] = {}
    for rc in cat.codes.values():
        counted[rc.group] = counted.get(rc.group, 0) + 1

    for grp, declared in sorted(cat.declared_group_totals.items()):
        actual = counted.get(grp, 0)
        if actual != declared:
            problems.append(
                f"coverage summary says `{grp}` has {declared} codes; "
                f"{actual} rows parsed"
            )
    for grp in sorted(set(counted) - set(cat.declared_group_totals)):
        problems.append(
            f"group `{grp}` has {counted[grp]} parsed rows but no coverage-summary line"
        )
    if cat.declared_total is not None and cat.declared_total != len(cat.codes):
        problems.append(
            f"coverage summary total is {cat.declared_total}; "
            f"{len(cat.codes)} codes parsed"
        )
    overlap = sorted(set(cat.non_codes) & set(cat.codes))
    for tok in overlap:
        problems.append(
            f"`{tok}` is listed in the appendix as canon vocabulary AND as a "
            f"catalogue code; the appendix says these must not collide"
        )
    return problems
