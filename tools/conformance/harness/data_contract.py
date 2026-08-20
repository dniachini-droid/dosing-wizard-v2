"""Reader for `ALK-V2-DATA-CONTRACT.md`.

Two things are extracted, both by parsing rather than by transcription:

1. The `EngineResult` field set and the `ReasonCode` field set, from the
   fenced `text` blocks under their headings. These drive the output-shape
   check: `EngineResult` states that "an absent field is a schema violation",
   so a missing field is a failure and an undeclared field is a failure.

2. The dimension-suffix vocabulary from §0 "Dimension safety", and the list of
   bare names the contract forbids. These drive the dimension-safety check,
   which is the executable part of `INV-B7` / `INV-ALK-VARIABLES-001`.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set

from . import paths

_HEADING = re.compile(r"^###\s+`?([A-Za-z]+)`?")
_FENCE = re.compile(r"^```")


@dataclass
class Contract:
    engine_result_fields: List[str] = field(default_factory=list)
    reason_code_fields: List[str] = field(default_factory=list)
    audit_trace_fields: List[str] = field(default_factory=list)
    #: Fields whose contract line opens a sub-object. §0 forbids a bare name
    #: only "without a dimension suffix **and a documented meaning**"; a named
    #: sub-trace such as `AuditTrace.dose { currentDose, ... }` carries its
    #: documented meaning in the block that follows, so it is not a bare
    #: dimensionless numeric and the rule does not reach it.
    container_fields: Set[str] = field(default_factory=set)
    dimension_suffixes: List[str] = field(default_factory=list)
    forbidden_bare_names: Set[str] = field(default_factory=set)
    schema_invariants: List[str] = field(default_factory=list)
    source: str = ""
    parse_problems: List[str] = field(default_factory=list)


def _block_after_heading(lines: List[str], wanted: str) -> Optional[List[str]]:
    """First fenced block following the `### <wanted>` heading."""
    i = 0
    while i < len(lines):
        m = _HEADING.match(lines[i].rstrip("\n"))
        if m and m.group(1) == wanted:
            j = i + 1
            while j < len(lines) and not _FENCE.match(lines[j]):
                if _HEADING.match(lines[j].rstrip("\n")):
                    return None
                j += 1
            if j >= len(lines):
                return None
            k = j + 1
            out: List[str] = []
            while k < len(lines) and not _FENCE.match(lines[k]):
                out.append(lines[k].rstrip("\n"))
                k += 1
            return out
        i += 1
    return None


def _container_names(block: List[str]) -> Set[str]:
    """Depth-1 field names whose own line opens a sub-object."""
    out: Set[str] = set()
    depth = 0
    for raw in block:
        line = raw.rstrip()
        if not line.strip():
            continue
        opens, closes = line.count("{"), line.count("}")
        if depth == 0:
            depth += opens - closes
            continue
        stripped = line.strip()
        if depth == 1 and opens and not stripped.startswith("}"):
            m = re.match(r"^([A-Za-z][A-Za-z0-9_]*)\b", stripped)
            if m:
                out.add(m.group(1))
        depth += opens - closes
    return out


def _field_names(block: List[str]) -> List[str]:
    """Field names from a `Name { field  ANNOTATION ... }` text block.

    A field is the first token on a line inside the braces, at one indent
    level. Nested braces (the `forecast { ... }` sub-object) contribute their
    parent name only, because the contract treats them as one field.
    """
    names: List[str] = []
    depth = 0
    for raw in block:
        line = raw.rstrip()
        if not line.strip():
            continue
        opens = line.count("{")
        closes = line.count("}")
        if depth == 0:
            depth += opens - closes
            continue
        stripped = line.strip()
        if stripped.startswith("}"):
            depth += opens - closes
            continue
        if depth == 1:
            # A depth-1 line is either "name  ANNOTATION comment" or a bare
            # comma-separated run of names (the AuditTrace header line).
            parts = [p.strip() for p in stripped.split(",")]
            if len(parts) > 1 and all(
                re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", p) for p in parts
            ):
                names.extend(parts)
            else:
                m = re.match(r"^([A-Za-z][A-Za-z0-9_]*)\b", stripped)
                if m:
                    names.append(m.group(1))
        depth += opens - closes
    # preserve order, drop duplicates
    seen: Set[str] = set()
    ordered = []
    for n in names:
        if n not in seen:
            seen.add(n)
            ordered.append(n)
    return ordered


def load(path: Optional[str] = None) -> Contract:
    path = path or paths.DATA_CONTRACT_MD
    c = Contract(source=paths.rel(path))
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()

    for heading, target in (
        ("EngineResult", "engine_result_fields"),
        ("ReasonCode", "reason_code_fields"),
        ("AuditTrace", "audit_trace_fields"),
    ):
        block = _block_after_heading(lines, heading)
        if block is None:
            c.parse_problems.append(
                f"{c.source}: no fenced block found under `### {heading}`"
            )
            continue
        setattr(c, target, _field_names(block))
        c.container_fields |= _container_names(block)

    text = "".join(lines)

    dim_block = re.search(
        r"### Dimension safety.*?```text\n(.*?)```", text, re.S
    )
    if dim_block:
        for line in dim_block.group(1).splitlines():
            m = re.match(r"^\s*\.\.\.([A-Za-z]+)\s", line)
            if m:
                c.dimension_suffixes.append(m.group(1))
    else:
        c.parse_problems.append(f"{c.source}: dimension-suffix block not found")

    forbid = re.search(
        r"A field named ((?:`[a-zA-Z]+`(?:,| or |,? )?)+) without a dimension suffix",
        text,
    )
    if forbid:
        c.forbidden_bare_names = set(re.findall(r"`([a-zA-Z]+)`", forbid.group(1)))
    else:
        c.parse_problems.append(
            f"{c.source}: forbidden bare field-name sentence not found in §0"
        )

    cross = re.search(r"## 10\. Cross-cutting schema invariants\n(.*?)(?=\n## |\Z)", text, re.S)
    if cross:
        for m in re.finditer(r"^\d+\.\s+(.*?)(?=^\d+\.\s|\Z)", cross.group(1), re.S | re.M):
            c.schema_invariants.append(" ".join(m.group(1).split()))
    else:
        c.parse_problems.append(f"{c.source}: §10 cross-cutting schema invariants not found")

    return c


def dimension_of(field_name: str, suffixes: List[str]) -> List[str]:
    """Every dimension suffix the field name ends with.

    More than one means the name is ambiguous, which `INV-B7` forbids.
    Longest-match first, so `...DkhPerDay` is not also counted as `...Dkh`.
    """
    hits = [s for s in suffixes if field_name.endswith(s)]
    if not hits:
        return []
    longest = max(len(h) for h in hits)
    return [h for h in hits if len(h) == longest]
