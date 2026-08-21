"""Reader for the frozen reason-code catalogue. **The impure boundary.**

`ALK-V2-REASON-CODES.md` is the single owner of which module emits a code and
how severe it is. Rule 3: *"One owner per code. The owning module is the only
module that may emit it."* Rule 5 fixes the severity.

The domain must not carry a copy of that table. Two implementations of one
inference is what `MASTER RULE 1` calls a defect rather than a coincidence, and
a hand-written copy of 242 rows would drift from the document the moment the
document was reissued. So the domain emits `{code, payload}` and this module —
which reads a file, and is therefore outside the domain by
`ALK-V2-MODULE-DESIGN.md` §1 — stamps `owner` and `severity` from the catalogue.

The conformance harness's `CHK-RC-CLOSURE-ENGINE` is the negative control: it
compares every emitted code's severity and owner against the same document and
fails on any disagreement.
"""

from __future__ import annotations

import os
import re
from typing import Dict, Optional, Tuple

#: Repository-relative path of the catalogue. The engine is a repository
#: artefact today; when it moves, this is the one line that moves with it.
_DEFAULT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "docs",
    "implementation",
    "alk-v2",
    "ALK-V2-REASON-CODES.md",
)

_OWNER_HEADING = re.compile(r"^##\s+`?([A-Z_]+_)`?\s+—\s+owner:\s+`([A-Z]+)`")
_ROW = re.compile(r"^\|\s*`([A-Z0-9_]+)`\s*\|\s*`([A-Z]+)`\s*\|")


class Catalogue:
    """`code -> (owner, severity)`, parsed once."""

    def __init__(self, rows: Dict[str, Tuple[str, str]]):
        self._rows = rows

    def owner_of(self, code: str) -> Optional[str]:
        row = self._rows.get(code)
        return row[0] if row else None

    def severity_of(self, code: str) -> Optional[str]:
        row = self._rows.get(code)
        return row[1] if row else None

    def __contains__(self, code: str) -> bool:
        return code in self._rows

    def __len__(self) -> int:
        return len(self._rows)


def load(path: Optional[str] = None) -> Catalogue:
    """Parse the catalogue. A missing file is an error, not a default.

    Falling back to a built-in table would be the drift this module exists to
    prevent, arriving as a convenience.
    """
    path = path or _DEFAULT
    rows: Dict[str, Tuple[str, str]] = {}
    owner = "UNKNOWN"
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            m = _OWNER_HEADING.match(line)
            if m:
                owner = m.group(2)
                continue
            m = _ROW.match(line)
            if m:
                rows.setdefault(m.group(1), (owner, m.group(2)))
    if not rows:
        raise ValueError(f"no reason-code rows parsed from {path}")
    return Catalogue(rows)
