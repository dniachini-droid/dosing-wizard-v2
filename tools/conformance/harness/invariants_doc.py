"""Reader for `ALK-V2-INVARIANTS.md`.

Parses the 60 invariants into their stated parts (canon basis, generator,
assertion, negative control) so the harness can report, per invariant:

  * whether the harness has an executable form of it, and what it checked;
  * whether the document states a negative control for it.

The document's own header defines the format and says why the negative control
matters:

    "Canon `CORE-CANON-COVERAGE-001` item 9 requires a demonstrated negative
     control before a checker is trusted as a gate."

An invariant with no stated negative control is reported, not silently counted
as covered.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from . import paths

_GROUP = re.compile(r"^##\s+Group\s+([A-Z])\s+—\s+(.*)$")
_INV = re.compile(r"^###\s+(INV-[A-Z]\d+[A-Za-z0-9]*)\s+—\s+(.*)$")
_BULLET = re.compile(r"^-\s+\*\*([^:*]+):?\*\*:?\s*(.*)$")


@dataclass
class Invariant:
    inv_id: str
    title: str
    group: str
    group_title: str
    parts: Dict[str, str] = field(default_factory=dict)
    line: int = 0

    @property
    def canon(self) -> str:
        return self.parts.get("Canon", "")

    @property
    def generator(self) -> str:
        return self.parts.get("Generator", "")

    @property
    def assertion(self) -> str:
        return self.parts.get("Assert", "")

    @property
    def negative_control(self) -> Optional[str]:
        return self.parts.get("Negative control")

    @property
    def has_negative_control(self) -> bool:
        return bool(self.negative_control)


@dataclass
class InvariantDoc:
    invariants: List[Invariant] = field(default_factory=list)
    declared_group_totals: Dict[str, int] = field(default_factory=dict)
    declared_total: Optional[int] = None
    source: str = ""
    parse_problems: List[str] = field(default_factory=list)

    def by_id(self, inv_id: str) -> Optional[Invariant]:
        for i in self.invariants:
            if i.inv_id == inv_id:
                return i
        return None

    @property
    def ids(self) -> List[str]:
        return [i.inv_id for i in self.invariants]

    @property
    def without_negative_control(self) -> List[Invariant]:
        return [i for i in self.invariants if not i.has_negative_control]


def load(path: Optional[str] = None) -> InvariantDoc:
    path = path or paths.INVARIANTS_MD
    doc = InvariantDoc(source=paths.rel(path))
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    group = group_title = ""
    current: Optional[Invariant] = None
    part_key: Optional[str] = None
    in_coverage = False

    def flush() -> None:
        nonlocal current
        if current is not None:
            for k, v in list(current.parts.items()):
                current.parts[k] = " ".join(v.split())
            doc.invariants.append(current)
            current = None

    for n, raw in enumerate(lines, start=1):
        line = raw.rstrip("\n")

        m = _GROUP.match(line)
        if m:
            flush()
            group, group_title = m.group(1), m.group(2).strip()
            part_key = None
            continue

        if line.startswith("## Coverage"):
            flush()
            in_coverage = True
            part_key = None
            continue

        if in_coverage:
            m = re.match(r"^\|\s*([A-Z])\s*—\s*[^|]+\|\s*(\d+)\s*\|", line)
            if m:
                doc.declared_group_totals[m.group(1)] = int(m.group(2))
                continue
            m = re.match(r"^\|\s*\*\*Total\*\*\s*\|\s*\*\*(\d+)\*\*\s*\|", line)
            if m:
                doc.declared_total = int(m.group(1))
            continue

        m = _INV.match(line)
        if m:
            flush()
            inv_id = m.group(1)
            # **The group comes from the id, not from the position in the
            # document.** `ALK_V2_FREEZE_5` appended sixteen invariants after
            # the last `## Group` heading rather than filing each under its own
            # heading, so `INV-G10` sits physically under "Group I". Attributing
            # by position made the coverage cross-check report three false
            # mismatches. The id letter is what the coverage table counts.
            id_group = inv_id.split("-")[1][0]
            current = Invariant(
                inv_id=inv_id,
                title=m.group(2).strip(),
                group=id_group,
                group_title=group_title if id_group == group else "",
                line=n,
            )
            part_key = None
            continue

        if current is None:
            continue

        m = _BULLET.match(line)
        if m:
            part_key = m.group(1).strip()
            current.parts[part_key] = m.group(2).strip()
            continue

        if part_key and line.startswith("  ") and line.strip():
            current.parts[part_key] += " " + line.strip()
            continue

        if line.strip() in ("", "---"):
            part_key = None

    flush()

    counted: Dict[str, int] = {}
    for i in doc.invariants:
        counted[i.group] = counted.get(i.group, 0) + 1
    for grp, declared in sorted(doc.declared_group_totals.items()):
        if counted.get(grp, 0) != declared:
            doc.parse_problems.append(
                f"coverage table says group {grp} has {declared} invariants; "
                f"{counted.get(grp, 0)} parsed"
            )
    if doc.declared_total is None:
        # Skipping when the declaration is absent means deleting the `Total`
        # row deletes the check. The retired validator failed on that; nothing
        # here did, and the gate inventory recorded this check as superseding
        # the validator's when it did so only while the row exists.
        doc.parse_problems.append(
            f"{doc.source}: the coverage table declares no `Total` row, so the "
            f"{len(doc.invariants)} parsed invariant bodies have nothing to be "
            f"checked against"
        )
    elif doc.declared_total != len(doc.invariants):
        doc.parse_problems.append(
            f"coverage table total is {doc.declared_total}; "
            f"{len(doc.invariants)} invariants parsed"
        )
    seen: Dict[str, int] = {}
    for i in doc.invariants:
        if i.inv_id in seen:
            doc.parse_problems.append(
                f"{i.inv_id} appears twice (lines {seen[i.inv_id]} and {i.line})"
            )
        seen[i.inv_id] = i.line

    return doc
