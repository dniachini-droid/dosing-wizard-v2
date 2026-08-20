"""Alk V2 conformance harness.

Test equipment. It contains no chemistry: every expected value it compares
against is read at run time from the fixture corpus, the reason-code catalogue,
the data contract and the invariant document. Nothing in this package restates
a canon value, and a value copied here would be a defect (`CLAUDE.md`,
"Chemistry": *outside `docs/research/` and `docs/canon/`, no number governs
behaviour*).

Authority for what is checked:
  docs/implementation/alk-v2/ALK-V2-IMPLEMENTATION-CONTRACT.md §9 (conformance gate)
"""

REPO_RELATIVE_ALK = "docs/implementation/alk-v2"
