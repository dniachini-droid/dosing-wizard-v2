"""Repository locations. One copy, so a moved document breaks in one place."""

from __future__ import annotations

import os


def repo_root() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    # tools/conformance/harness -> tools/conformance -> tools -> <root>
    return os.path.abspath(os.path.join(here, "..", "..", ".."))


ROOT = repo_root()

#: The alk-v2 package the harness reads. Overridable **only** so that the
#: mutation harness can point the whole harness at a deliberately corrupted
#: copy of the documents and confirm the document-level checks go red. Nothing
#: in a normal run sets it, and a run that does says so in its report.
ALK = os.environ.get("ALK_V2_PACKAGE_DIR") or os.path.join(
    ROOT, "docs", "implementation", "alk-v2"
)
FIXTURES = os.path.join(ALK, "fixtures")

#: The canon. Read only by `package_checks.py`, which absorbed the canon-facing
#: half of the retired `validate-freeze-5.py`. Overridable on the same terms as
#: `ALK_V2_PACKAGE_DIR` and for the same single reason: the mutation harness
#: corrupts a throwaway copy and requires the checks to go red. Nothing in a
#: normal run sets it.
CANON_DIR = os.environ.get("ALK_V2_CANON_DIR") or os.path.join(ROOT, "docs", "canon")
CANON_MD = os.path.join(CANON_DIR, "REEF-CHEMISTRY-ENGINE-V2-CANON.md")

REASON_CODES_MD = os.path.join(ALK, "ALK-V2-REASON-CODES.md")
DATA_CONTRACT_MD = os.path.join(ALK, "ALK-V2-DATA-CONTRACT.md")
INVARIANTS_MD = os.path.join(ALK, "ALK-V2-INVARIANTS.md")
IMPLEMENTATION_CONTRACT_MD = os.path.join(ALK, "ALK-V2-IMPLEMENTATION-CONTRACT.md")
TRACEABILITY_JSON = os.path.join(ALK, "traceability", "alk-v2-traceability.json")
ALGORITHM_CONTRACT_MD = os.path.join(ALK, "ALK-V2-ALGORITHM-CONTRACT.md")
OPEN_ISSUES_MD = os.path.join(ALK, "ALK-V2-OPEN-ISSUES.md")

FIXTURE_INDEX = os.path.join(FIXTURES, "index.json")
FIXTURE_SCHEMA = os.path.join(FIXTURES, "_schema.json")
CONFIG_DEFAULTS = os.path.join(FIXTURES, "config-defaults.json")


def rel(path: str) -> str:
    """Path relative to the repository root, for reporting."""
    return os.path.relpath(path, ROOT)
