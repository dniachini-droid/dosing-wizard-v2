"""Reader and classifier for the fixture corpus.

This module answers the question the harness must never fudge: **which of the
160 fixtures can actually be executed against an engine, and what is every
other one?**

The classification is deliberately pessimistic. A fixture counts as
`EXECUTABLE` only when the harness can build the engine's documented input
from it without inventing anything:

    ALK-V2-IMPLEMENTATION-CONTRACT.md §4 --
    "One assessment = one pure function of
     (eventLedger, configurationHistory, asOf)."

So `EXECUTABLE` requires `input.events` (an event ledger) and `input.asOf`.
Everything else is named, with the reason, in one of these classes:

  NO_ASOF            has an event ledger but states no `asOf`; the engine's
                     third argument would have to be chosen by the harness,
                     and choosing it is inventing an input.
  ABSTRACT_INPUT     `input` is present but is a scenario description in an
                     ad-hoc vocabulary (`sPreDkhPerDay`, `readings: 4`,
                     `day0: {...}`), not an event ledger.
  CROSS_REFERENCE    no `input`; the fixture defers to another via
                     `equivalentTo`. Its assertions are prose about the
                     referenced case.
  NO_INPUT           no `input` and no `equivalentTo`. Nothing to run.
  PROPERTY_FIXTURE   an invariant/property body from
                     `invariants-and-governance.json`: a `property` plus a
                     `generator`, not a single input/output pair.

A count of "0 unreadable" that silently means "0 of the ones I know how to
look at" is the specific failure this classification exists to prevent, so
every class is reported with its full membership list. Every fixture body the
index enumerates receives exactly one class, and `CHK-INDEX-INTEGRITY` fails if
the index and the bodies disagree about what the corpus contains -- which is
what actually anchors the totals. The renderer sums the classes; it does not
independently verify them, and this docstring previously claimed it did.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from . import compare as compare_mod
from . import paths

EXECUTABLE = "EXECUTABLE"
NO_ASOF = "NO_ASOF"
ABSTRACT_INPUT = "ABSTRACT_INPUT"
CROSS_REFERENCE = "CROSS_REFERENCE"
NO_INPUT = "NO_INPUT"
PROPERTY_FIXTURE = "PROPERTY_FIXTURE"
UNPARSEABLE = "UNPARSEABLE"

CLASS_ORDER = (
    EXECUTABLE,
    NO_ASOF,
    ABSTRACT_INPUT,
    CROSS_REFERENCE,
    NO_INPUT,
    PROPERTY_FIXTURE,
    UNPARSEABLE,
)

CLASS_REASON = {
    EXECUTABLE: "carries an event ledger and an asOf; can be run against an engine",
    NO_ASOF: "carries an event ledger but no asOf; the harness will not choose one",
    ABSTRACT_INPUT: "input is a scenario description, not an event ledger",
    CROSS_REFERENCE: "no input of its own; defers to another fixture via equivalentTo",
    NO_INPUT: "no input and no cross-reference; nothing to submit to an engine",
    PROPERTY_FIXTURE: "a property plus a generator, not a single input/output pair",
    UNPARSEABLE: "the fixture file or body could not be read",
}

# The comparable expectation blocks, in the order the fixture schema lists them.
EXPECTATION_BLOCKS = (
    "expectedIntermediateEvidence",
    "expectedSupportedResult",
    "expectedAction",
    "expectedRetest",
)


@dataclass
class Fixture:
    fixture_id: str
    title: str
    source_file: str
    body: Dict[str, Any]
    klass: str
    reason: str
    unreadable_expectations: List[str] = field(default_factory=list)

    @property
    def provenance_class(self) -> str:
        return (self.body.get("provenance") or {}).get("class", "UNSTATED")

    @property
    def expected_reason_codes(self) -> List[str]:
        v = self.body.get("expectedReasonCodes") or []
        return [c for c in v if isinstance(c, str)]

    @property
    def all_expected_reason_codes(self) -> Dict[str, List[str]]:
        """Every shape in which this fixture requires a reason code.

        Absorbed from the retired freeze validator, which found this the hard
        way. The corpus states required codes in four shapes:

            expectedReasonCodes           a top-level array
            variant.expectedReasonCodes   the variant's own array
            expectedReasonCodesByCase     {case: [codes]}, introduced by the
                                          owner decisions 24-26 round
            variantReasonCodes            {variant: [codes]}, older

        Reading only the first left 70+ assertions unvalidated against the
        catalogue and the retired set, and the breaker demonstrated it by
        appending two retired codes to `AD-ESC-001` while the gate stayed
        green. The by-case shapes are nested at arbitrary depth, so the walk
        is recursive rather than a fixed list of keys.

        Returns `{site: [codes]}` so a violation can name where it came from.
        """
        found: Dict[str, List[str]] = {}

        def _walk(node: Any, path: str) -> None:
            if isinstance(node, dict):
                for k, v in node.items():
                    if k in ("expectedReasonCodes",) and isinstance(v, list):
                        found.setdefault(path + "." + k if path else k, []).extend(
                            c for c in v if isinstance(c, str)
                        )
                    elif k in ("expectedReasonCodesByCase", "variantReasonCodes") and (
                        isinstance(v, dict)
                    ):
                        for case, codes in v.items():
                            site = "%s.%s[%s]" % (path, k, case) if path else "%s[%s]" % (k, case)
                            found.setdefault(site, []).extend(
                                c for c in (codes or []) if isinstance(c, str)
                            )
                    else:
                        _walk(v, path + "." + str(k) if path else str(k))
            elif isinstance(node, list):
                for i, v in enumerate(node):
                    _walk(v, path)

        # `forbidden` states what must NOT be emitted, and `supersededExpectation`
        # is preserved history. Neither is a requirement, so neither is harvested
        # here; `forbidden` is read separately, and against a different rule.
        body = {
            k: v
            for k, v in self.body.items()
            if k not in ("forbidden", "supersededExpectation")
        }
        _walk(body, "")
        return {k: v for k, v in found.items() if v}

    @property
    def forbidden(self) -> Dict[str, Any]:
        v = self.body.get("forbidden")
        return v if isinstance(v, dict) else {}

    @property
    def tolerance(self) -> Optional[Dict[str, Any]]:
        v = self.body.get("tolerance")
        return v if isinstance(v, dict) else None


@dataclass
class Corpus:
    fixtures: List[Fixture] = field(default_factory=list)
    index: Dict[str, Any] = field(default_factory=dict)
    schema: Dict[str, Any] = field(default_factory=dict)
    config_defaults: Dict[str, Any] = field(default_factory=dict)
    load_problems: List[str] = field(default_factory=list)

    def by_id(self, fid: str) -> Optional[Fixture]:
        for f in self.fixtures:
            if f.fixture_id == fid:
                return f
        return None

    def of_class(self, klass: str) -> List[Fixture]:
        return [f for f in self.fixtures if f.klass == klass]

    @property
    def declared_total(self) -> Optional[int]:
        return (self.index.get("totals") or {}).get("fixtures")


def _looks_like_event_ledger(inp: Any) -> bool:
    if not isinstance(inp, dict):
        return False
    events = inp.get("events")
    if not isinstance(events, list) or not events:
        return False
    return all(isinstance(e, dict) and "kind" in e for e in events)


def _unreadable_expectations(body: Dict[str, Any]) -> List[str]:
    """Expectation entries whose value is prose rather than a comparable value.

    The fixture schema allows a `note`, which is documentation. Anything else
    whose value is a sentence -- `"known from the single valid reading"` --
    cannot be compared to an engine field, and saying so is the point.
    """
    out: List[str] = []
    for block in EXPECTATION_BLOCKS:
        v = body.get(block)
        if not isinstance(v, dict):
            if v is not None:
                out.append(f"{block}: not an object")
            continue
        for k, val in v.items():
            if k in ("note", "$comment", "derivation", "why"):
                continue
            if compare_mod.is_prose(val):
                out.append(f"{block}.{k} = {val!r}")
    return out


def _classify(body: Dict[str, Any], source_file: str) -> tuple:
    if source_file.endswith("invariants-and-governance.json") and "kind" in body:
        if body.get("kind") != "GOLDEN":
            return PROPERTY_FIXTURE, CLASS_REASON[PROPERTY_FIXTURE]
    inp = body.get("input")
    if inp is None:
        if body.get("equivalentTo"):
            return CROSS_REFERENCE, CLASS_REASON[CROSS_REFERENCE]
        return NO_INPUT, CLASS_REASON[NO_INPUT]
    if _looks_like_event_ledger(inp):
        if inp.get("asOf"):
            return EXECUTABLE, CLASS_REASON[EXECUTABLE]
        return NO_ASOF, CLASS_REASON[NO_ASOF]
    return ABSTRACT_INPUT, CLASS_REASON[ABSTRACT_INPUT]


def load(fixtures_dir: Optional[str] = None) -> Corpus:
    d = fixtures_dir or paths.FIXTURES
    c = Corpus()

    def _read(name: str) -> Dict[str, Any]:
        p = os.path.join(d, name)
        try:
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)
        except Exception as exc:  # noqa: BLE001 - reported, never raised
            c.load_problems.append(f"{paths.rel(p)}: {type(exc).__name__}: {exc}")
            return {}

    c.index = _read("index.json")
    c.schema = _read("_schema.json")
    c.config_defaults = _read("config-defaults.json")

    listed = c.index.get("files") or []
    if not listed:
        c.load_problems.append(
            f"{paths.rel(paths.FIXTURE_INDEX)}: no `files` array; corpus not enumerable"
        )

    for entry in listed:
        name = entry.get("file")
        if not name:
            c.load_problems.append("index.json: a `files` entry has no `file` key")
            continue
        p = os.path.join(d, name)
        try:
            with open(p, encoding="utf-8") as fh:
                doc = json.load(fh)
        except Exception as exc:  # noqa: BLE001
            c.load_problems.append(f"{paths.rel(p)}: {type(exc).__name__}: {exc}")
            for fid in entry.get("fixtureIds") or []:
                c.fixtures.append(
                    Fixture(fid, "", name, {}, UNPARSEABLE, f"file unreadable: {exc}")
                )
            continue

        bodies = doc.get("fixtures")
        if not isinstance(bodies, list):
            c.load_problems.append(f"{paths.rel(p)}: no `fixtures` array")
            continue

        for body in bodies:
            fid = body.get("fixtureId")
            if not fid:
                c.load_problems.append(f"{paths.rel(p)}: a fixture body has no fixtureId")
                continue
            klass, reason = _classify(body, name)
            c.fixtures.append(
                Fixture(
                    fixture_id=fid,
                    title=body.get("title", ""),
                    source_file=name,
                    body=body,
                    klass=klass,
                    reason=reason,
                    unreadable_expectations=_unreadable_expectations(body),
                )
            )

    # Files present on disk that the index does not list are invisible to every
    # consumer of the index, which is exactly the "0 of the things I know how
    # to look at" failure. Name them.
    named = {e.get("file") for e in listed}
    ignore = {"index.json", "_schema.json", "config-defaults.json"}
    try:
        on_disk = {n for n in os.listdir(d) if n.endswith(".json")} - ignore
    except OSError as exc:
        c.load_problems.append(f"{paths.rel(d)}: {exc}")
        on_disk = set()
    for extra in sorted(on_disk - named):
        c.load_problems.append(
            f"{extra} exists in fixtures/ but is not listed in index.json; "
            f"its fixtures are invisible to the corpus"
        )

    return c
