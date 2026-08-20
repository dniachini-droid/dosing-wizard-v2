"""Repository locations. One copy, so a moved document breaks in one place."""

from __future__ import annotations

import os


def repo_root() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    # tools/conformance/harness -> tools/conformance -> tools -> <root>
    return os.path.abspath(os.path.join(here, "..", "..", ".."))


ROOT = repo_root()
ALK = os.path.join(ROOT, "docs", "implementation", "alk-v2")
FIXTURES = os.path.join(ALK, "fixtures")

REASON_CODES_MD = os.path.join(ALK, "ALK-V2-REASON-CODES.md")
DATA_CONTRACT_MD = os.path.join(ALK, "ALK-V2-DATA-CONTRACT.md")
INVARIANTS_MD = os.path.join(ALK, "ALK-V2-INVARIANTS.md")
IMPLEMENTATION_CONTRACT_MD = os.path.join(ALK, "ALK-V2-IMPLEMENTATION-CONTRACT.md")
TRACEABILITY_JSON = os.path.join(ALK, "traceability", "alk-v2-traceability.json")

FIXTURE_INDEX = os.path.join(FIXTURES, "index.json")
FIXTURE_SCHEMA = os.path.join(FIXTURES, "_schema.json")
CONFIG_DEFAULTS = os.path.join(FIXTURES, "config-defaults.json")


def rel(path: str) -> str:
    """Path relative to the repository root, for reporting."""
    return os.path.relpath(path, ROOT)
