"""Document mutations — negative controls for the checks that read documents.

Every mutation in `mutations/__init__.py` is a hook on the echo oracle, so
none of them can reach a check whose subject is a *document* rather than an
engine reply. Three checks were therefore reporting PASS with nothing keeping
them honest:

    CHK-RC-CATALOGUE      the reason-code catalogue against its own summary
    CHK-TRACE-COVERAGE    every ACTIVE rule naming a covering fixture
    CHK-DIMENSION-SAFETY  one dimension per field name

and so was the harness's own completeness assertion, that the invariants it
executes plus the invariants it accounts for partition the document exactly.

`DEC-016`: "A change that adds a checker adds its negative control in the same
change." These are those controls.

Each one copies the alk-v2 package to a temporary tree, corrupts one document,
points the harness at the copy via `ALK_V2_PACKAGE_DIR`, and requires the named
check to fail. **The repository itself is never modified** -- the corruption
lives and dies inside `tempfile.mkdtemp()`.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass, field
from typing import Callable, List

HARNESS_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO_ROOT = os.path.dirname(os.path.dirname(HARNESS_DIR))
PACKAGE_DIR = os.path.join(REPO_ROOT, "docs", "implementation", "alk-v2")
CANON_DIR = os.path.join(REPO_ROOT, "docs", "canon")


@dataclass
class DocumentMutation:
    mid: str
    title: str
    sabotage: str
    guards: str
    #: The check id that must go red.
    expect_check: str
    #: A substring that must appear in that check's violation text.
    expect_mechanism: str
    #: `apply(package_dir, canon_dir)` -- both are throwaway copies.
    apply: Callable[[str, str], None] = field(repr=False, default=lambda _p, _c: None)
    #: BLOCKED entries state exactly what must become true to run them, and
    #: are never counted as caught. Same contract as the oracle mutation set.
    blocked: bool = False
    unblocks_when: str = ""


# ---------------------------------------------------------------------------
# the sabotages, each acting on a throwaway copy of the package
# ---------------------------------------------------------------------------


def _d1_duplicate_catalogue_row(pkg: str, canon: str) -> None:
    """Repeat one catalogue row, so the coverage summary no longer matches."""
    path = os.path.join(pkg, "ALK-V2-REASON-CODES.md")
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()
    for i, line in enumerate(lines):
        if line.startswith("| `TRAJECTORY_FALLING`"):
            lines.insert(i + 1, line)
            break
    else:  # pragma: no cover - the row exists; guard against a silent no-op
        raise RuntimeError("could not find a catalogue row to duplicate")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)


def _d2_uncovered_active_rule(pkg: str, canon: str) -> None:
    """Blank the covering fixture of an ACTIVE rule."""
    path = os.path.join(pkg, "traceability", "alk-v2-traceability.json")
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    for group in doc.get("groups") or []:
        for rule in group.get("rules") or []:
            if rule.get("id") == "CORE-CANON-COVERAGE-001":
                rule["fixtures"] = "-"
                break
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2)


def _d3_two_dimensions_on_one_field(pkg: str, canon: str) -> None:
    """Rename a dimensioned contract field to a forbidden bare name."""
    path = os.path.join(pkg, "ALK-V2-DATA-CONTRACT.md")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    text = text.replace(
        "  latestValidValueDkh       dKH", "  value                     dKH", 1
    )
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)


def _d4_unaccounted_invariant(pkg: str, canon: str) -> None:
    """Add a 61st invariant the harness has never heard of."""
    path = os.path.join(pkg, "ALK-V2-INVARIANTS.md")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    addition = (
        "### INV-A9 — An invariant the harness does not know about\n"
        "- **Canon:** none; this entry exists only inside a mutation.\n"
        "- **Assert:** nothing.\n"
        "- **Negative control:** none.\n\n"
    )
    text = text.replace("\n---\n\n## Group B", "\n" + addition + "---\n\n## Group B", 1)
    text = text.replace(
        "| A — Determinism and replay | 4 |", "| A — Determinism and replay | 5 |", 1
    )
    text = text.replace("| **Total** | **60** |", "| **Total** | **61** |", 1)
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)



# ---------------------------------------------------------------------------
# Controls for the checks absorbed from the retired freeze validator.
#
# `docs/process/GATE-CHECK-INVENTORY.md` is the inventory these came from. The
# validator demonstrated most of its checks by hand-applied mutations recorded
# in prose in the run records; a mutation you cannot re-run is a claim about
# the past, not a control on the present. These are the executable form.
#
# Two of them are the invariant document's OWN stated negative controls,
# ported verbatim: `INV-I8` says "delete the `forbidden` block from
# `AD-MNT-006`" and `INV-I10` says "change one `alkDkh` value without changing
# the expectations". Both are below, and both fire.
# ---------------------------------------------------------------------------


def _fixture_file(pkg: str, name: str):
    path = os.path.join(pkg, "fixtures", name)
    with open(path, encoding="utf-8") as fh:
        return path, json.load(fh)


def _write_json(path: str, doc) -> None:
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=2)


def _find_fixture(pkg: str, fid: str):
    """Return (path, document, body) for a fixture id, or raise."""
    for name in os.listdir(os.path.join(pkg, "fixtures")):
        if not name.endswith(".json") or name in ("index.json", "_schema.json",
                                                  "config-defaults.json"):
            continue
        path, doc = _fixture_file(pkg, name)
        for body in doc.get("fixtures") or []:
            if body.get("fixtureId") == fid:
                return path, doc, body
    raise RuntimeError("fixture %s not found in the copied package" % fid)


def _edit_text(path: str, old: str, new: str, count: int = 1) -> None:
    # `count=-1` means every occurrence. Note that `str.replace(a, b, 0)`
    # replaces NOTHING, so a mutation written with `count=0` meaning "all"
    # applies cleanly and changes not one character -- which reads as the
    # check failing to fire.
    """Replace `old` with `new`, failing loudly if it was not there.

    A mutation that silently does nothing is worse than no mutation: the run
    reports NOT CAUGHT and the reader blames the check.
    """
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    if old not in text:
        raise RuntimeError("mutation anchor not found in %s: %r" % (path, old[:70]))
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text.replace(old, new, count))


def _d5_unparseable_package_json(pkg: str, canon: str) -> None:
    """Truncate a baselines JSON file.

    Chosen deliberately: `baselines/` is on no other read path in the harness,
    so this isolates CHK-PKG-JSON. Before the absorption nothing in the
    conformance harness opened these files at all.
    """
    path = os.path.join(pkg, "baselines", "golden-baseline-65c6030.json")
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text[: len(text) // 2])


def _d6_unstamped_fixture_file(pkg: str, canon: str) -> None:
    """Strip the current freeze identifier from one fixture file."""
    path = os.path.join(pkg, "fixtures", "canon-named-goldens.json")
    _edit_text(path, "ALK_V2_FREEZE_5", "ALK_V2_FREEZE_UNSTATED", count=-1)


def _d7_rule_loses_its_mechanism(pkg: str, canon: str) -> None:
    """Reword a canon rule so it no longer states the mechanism that defines it.

    `ALK-RETEST-SCHEDULER-001` is identified by its signal-driven term. Rename
    the symbol and the rule still *exists*, is still in the manifest and is
    still inventoried -- it simply no longer says the thing that distinguishes
    it from what it replaced. That is the shape a reinterpretation actually
    takes.
    """
    _edit_text(
        os.path.join(canon, "REEF-CHEMISTRY-ENGINE-V2-CANON.md"),
        "T_{signal,days}",
        "T_{sig,days}",
        count=-1,
    )


def _d8_rule_dropped_from_manifest(pkg: str, canon: str) -> None:
    """Remove one Freeze-5 rule from the canon coverage manifest.

    This is `INV-I9`'s own stated negative control, ported: *"remove one
    Freeze-5 rule from the manifest; the check must fail."*
    """
    path = os.path.join(canon, "REEF-CHEMISTRY-ENGINE-V2-CANON.md")
    with open(path, encoding="utf-8") as fh:
        lines = fh.readlines()
    for i, line in enumerate(lines):
        if line.startswith("| `ALK-RECOMMEND-ONLY-001` |"):
            del lines[i]
            break
    else:
        raise RuntimeError("could not find the manifest row to delete")
    with open(path, "w", encoding="utf-8") as fh:
        fh.writelines(lines)


def _d9_rule_with_two_owners(pkg: str, canon: str) -> None:
    """Give one traceability rule two owners in a single cell."""
    path = os.path.join(pkg, "traceability", "alk-v2-traceability.json")
    with open(path, encoding="utf-8") as fh:
        doc = json.load(fh)
    for group in doc.get("groups") or []:
        for rule in group.get("rules") or []:
            if rule.get("id") == "ALK-RECOMMEND-ONLY-001":
                rule["owner"] = "SAFETY, OUTPUT"
                _write_json(path, doc)
                return
    raise RuntimeError("could not find a rule to give two owners")


def _d10_retired_code_live_in_canon(pkg: str, canon: str) -> None:
    """Name a retired reason code on an ordinary canon line.

    Not in a blockquote, not next to a supersession marker: a live
    instruction. A retired code that reads as live is an instruction to emit
    something no module owns.
    """
    path = os.path.join(canon, "REEF-CHEMISTRY-ENGINE-V2-CANON.md")
    _edit_text(
        path,
        "\n# CANON RULE COVERAGE MANIFEST",
        "\nThe engine emits SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE in this state.\n"
        "\n# CANON RULE COVERAGE MANIFEST",
    )


def _d11_decision_loses_its_negative_control(pkg: str, canon: str) -> None:
    """Delete the negative-control blocks pinning owner decision `F5-05`.

    `INV-I8`'s stated control is *"delete the `forbidden` block from
    `AD-MNT-006`; the check must fail."* That is ported here -- and it is also
    **stale**, which running it is how we found out. `F5-05` was covered by one
    fixture when the invariant was written and is covered by three now
    (`AD-MNT-006`, `AD-MNT-007`, `AD-MNT-008`), each carrying its own
    `forbidden` block, so removing one leaves the decision pinned by the other
    two and the check correctly stays green.

    The defect class is "an owner decision is left with no fixture asserting
    the rejected alternative", so the mutation removes the blocks from all
    three. `AD-MNT-006` is still the first of them, so the document's named
    fixture is genuinely exercised. The staleness of the document's wording is
    recorded as a finding, not fixed here: `ALK-V2-INVARIANTS.md` is package
    documentation and editing it was outside this task.
    """
    for fid in ("AD-MNT-006", "AD-MNT-007", "AD-MNT-008"):
        path, doc, body = _find_fixture(pkg, fid)
        body.pop("forbidden", None)
        body.pop("variant", None)
        _write_json(path, doc)


def _d12_resolution_box_removed(pkg: str, canon: str) -> None:
    """Un-mark one resolved open issue in the register."""
    _edit_text(
        os.path.join(pkg, "ALK-V2-OPEN-ISSUES.md"),
        "> **RESOLVED by `ALK_V2_FREEZE_5`",
        "> **Considered by `ALK_V2_FREEZE_5`",
    )


def _d14_fixture_input_moved(pkg: str, canon: str) -> None:
    """Change one `alkDkh` value without changing the expectations.

    `INV-I10`'s own stated negative control, ported verbatim. The fixture then
    states intermediates that do not follow from its own declared inputs,
    which is the whole defect class.

    The fixture is chosen by the same test the check itself applies -- a
    `timesDays`/`alkDkh` series of equal length whose expectations state at
    least one recomputable intermediate -- rather than by name, so the control
    keeps working when the corpus is edited. A control pinned to a fixture id
    that later stops being recomputable goes quietly green, which is exactly
    what `D-11` above turned out to have done.
    """
    _RECOMPUTED = (
        "observedSlopeDkhPerDay", "sigmaResidDkh", "sigmaPointDkh",
        "sxxDay2", "sigmaSDkhPerDay", "supportedSlopeDkhPerDay",
    )
    fixtures_dir = os.path.join(pkg, "fixtures")
    for name in sorted(os.listdir(fixtures_dir)):
        if not name.endswith(".json") or name in ("index.json", "_schema.json",
                                                  "config-defaults.json"):
            continue
        path, doc = _fixture_file(pkg, name)
        for body in doc.get("fixtures") or []:
            inp = body.get("input") or {}
            times = inp.get("timesDays") or inp.get("clusterTimesDays")
            vals = inp.get("alkDkh")
            if not (isinstance(times, list) and isinstance(vals, list)):
                continue
            if len(times) != len(vals) or len(vals) < 2:
                continue
            stated = {}
            stated.update(body.get("expectedIntermediateEvidence") or {})
            stated.update(body.get("expectedSupportedResult") or {})
            if not any(isinstance(stated.get(k), (int, float)) for k in _RECOMPUTED):
                continue
            vals[0] = round(float(vals[0]) + 0.37, 6)
            _write_json(path, doc)
            return
    raise RuntimeError("no series fixture with a recomputed intermediate was found")


def _d15_decision_fixture_contradicts_itself(pkg: str, canon: str) -> None:
    """Move a reading in `AD-EPI-005` without moving its stated episode value."""
    path, doc, body = _find_fixture(pkg, "AD-EPI-005")
    body["input"]["readings"][0]["alkDkh"] = round(
        float(body["input"]["readings"][0]["alkDkh"]) + 0.44, 6
    )
    _write_json(path, doc)


def _d16_canon_decision_sentence_deleted(pkg: str, canon: str) -> None:
    """Delete the sentence that carries owner decision 24 in the canon."""
    _edit_text(
        os.path.join(canon, "REEF-CHEMISTRY-ENGINE-V2-CANON.md"),
        "The engine **continues to advise**",
        "The engine acknowledges the reading",
        count=-1,
    )


def _d17_reversion_added_to_live_canon(pkg: str, canon: str) -> None:
    """Add a contradicting sentence rather than removing an asserted one.

    This is the mutation class that matters most, and the reason the absorbed
    scanners exist. Four owner decisions were once reverted in the canon
    exactly this way and a 192-check presence-only gate stayed green through
    all four: every asserted string was still there. Only absence can see a
    contradiction.
    """
    path = os.path.join(canon, "REEF-CHEMISTRY-ENGINE-V2-CANON.md")
    _edit_text(
        path,
        "\n# CANON RULE COVERAGE MANIFEST",
        "\nWhere the warning attaches, the ordinary maintenance recommendation\n"
        "recommendedDoseMlPerDay is WITHHELD and only the safety rate is stated.\n"
        "\n# CANON RULE COVERAGE MANIFEST",
    )


def _d18_episode_window_widened(pkg: str, canon: str) -> None:
    """Reinstate a 45-minute episode window in the algorithm contract's A3."""
    _edit_text(
        os.path.join(pkg, "ALK-V2-ALGORITHM-CONTRACT.md"),
        "30 minutes",
        "45 minutes",
        count=-1,
    )


def _d19_warning_moves_the_retest(pkg: str, canon: str) -> None:
    """Shorten the retest on the warned side of the advisory boundary only.

    The reverted behaviour decision 24 abolished, in its most plausible form:
    the answer is unchanged, but the warning quietly moves the schedule.
    """
    path, doc, body = _find_fixture(pkg, "AD-ESC-001")
    for case in body["expectedAction"]["cases"]:
        if case.get("advisoryConfidenceWarning") == "ATTACHED":
            for key in ("nextTestApproxHours", "warningRetestIntervalHours",
                        "schedulerRetestIntervalHours"):
                if key in case:
                    case[key] = 6
    _write_json(path, doc)


def _d20_retired_code_in_a_by_case_shape(pkg: str, canon: str) -> None:
    """Append a retired reason code to `expectedReasonCodesByCase`.

    The breaker's actual finding, made executable: this is the shape
    `CHK-RC-CLOSURE-DOC` could not see before the absorption, and two retired
    codes were appended to this very fixture while the gate stayed green.
    """
    path, doc, body = _find_fixture(pkg, "AD-ESC-001")

    def _plant(node) -> bool:
        if isinstance(node, dict):
            for k, v in node.items():
                if k == "expectedReasonCodesByCase" and isinstance(v, dict) and v:
                    first = sorted(v)[0]
                    v[first] = list(v[first] or []) + [
                        "SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE"
                    ]
                    return True
                if _plant(v):
                    return True
        elif isinstance(node, list):
            for v in node:
                if _plant(v):
                    return True
        return False

    if not _plant(body):
        raise RuntimeError("AD-ESC-001 carries no expectedReasonCodesByCase block")
    _write_json(path, doc)



def _d21_fixture_requires_what_it_forbids(pkg: str, canon: str) -> None:
    """Make a fixture require a code its own `forbidden` block bans.

    A separate defect class from D-20: the code is live and catalogued, so
    closure says nothing. The fixture simply cannot be satisfied -- clause 3 of
    the schema's acceptance rule contradicts clause 1 -- and an engine failing
    it would be failing the fixture, not the canon.
    """
    for name in sorted(os.listdir(os.path.join(pkg, "fixtures"))):
        if not name.endswith(".json") or name in ("index.json", "_schema.json",
                                                  "config-defaults.json"):
            continue
        path, doc = _fixture_file(pkg, name)
        for body in doc.get("fixtures") or []:
            banned = (body.get("forbidden") or {}).get("reasonCodes")
            required = body.get("expectedReasonCodes")
            if isinstance(banned, list) and banned and isinstance(required, list):
                required.append(banned[0])
                _write_json(path, doc)
                return
    raise RuntimeError("no fixture carries both forbidden.reasonCodes and expectedReasonCodes")


DOCUMENT_MUTATIONS: List[DocumentMutation] = [
    DocumentMutation(
        mid="D-1",
        title="Duplicate a row in the reason-code catalogue",
        sabotage="`TRAJECTORY_FALLING` is listed twice",
        guards=(
            "CHK-RC-CATALOGUE. The catalogue's coverage summary is the only "
            "cross-check the document carries against a row being lost or "
            "doubled in an edit, and nothing was keeping that check honest."
        ),
        expect_check="CHK-RC-CATALOGUE",
        expect_mechanism="listed twice",
        apply=_d1_duplicate_catalogue_row,
    ),
    DocumentMutation(
        mid="D-2",
        title="Leave an ACTIVE rule with no covering fixture",
        sabotage="`CORE-CANON-COVERAGE-001`'s fixtures cell is emptied",
        guards=(
            "CHK-TRACE-COVERAGE, i.e. conformance-gate item 7: every rule marked "
            "ACTIVE has at least one passing fixture."
        ),
        expect_check="CHK-TRACE-COVERAGE",
        expect_mechanism="ACTIVE but names no fixture",
        apply=_d2_uncovered_active_rule,
    ),
    DocumentMutation(
        mid="D-3",
        title="Give a data-contract field a forbidden bare name",
        sabotage="`latestValidValueDkh` is renamed to `value`",
        guards=(
            "CHK-DIMENSION-SAFETY / `INV-B7`. This is the check the harness's "
            "whole by-name resolution scheme rests on, and it had no control."
        ),
        expect_check="CHK-DIMENSION-SAFETY",
        expect_mechanism="bare name the contract forbids",
        apply=_d3_two_dimensions_on_one_field,
    ),
    DocumentMutation(
        mid="D-4",
        title="Add an invariant the harness neither runs nor accounts for",
        sabotage="a 61st invariant is inserted, with the coverage table adjusted to match",
        guards=(
            "the harness's own completeness assertion -- that executed plus "
            "accounted-for partitions the invariant document exactly. Without "
            "this, an invariant added and forgotten would silently count as "
            "covered, which is the failure the harness brief singles out."
        ),
        expect_check="corpus-problem",
        expect_mechanism="neither executes it nor states why",
        apply=_d4_unaccounted_invariant,
    ),
    # ---- controls for the absorbed checks ---------------------------------
    DocumentMutation(
        mid="D-5",
        title="Truncate a JSON file the package carries",
        sabotage="`baselines/golden-baseline-65c6030.json` is cut in half",
        guards=(
            "CHK-PKG-JSON. `baselines/` is on no other read path in this "
            "harness, so before the absorption a corrupt baseline was invisible "
            "to every gate."
        ),
        expect_check="CHK-PKG-JSON",
        expect_mechanism="all package JSON parses",
        apply=_d5_unparseable_package_json,
    ),
    DocumentMutation(
        mid="D-6",
        title="Leave a fixture file unstamped by the current freeze",
        sabotage="`ALK_V2_FREEZE_5` is replaced throughout `canon-named-goldens.json`",
        guards=(
            "CHK-FREEZE-STAMP. A fixture file that does not name the freeze it "
            "was written against cannot be told from one carried forward "
            "unchanged from a superseded freeze."
        ),
        expect_check="CHK-FREEZE-STAMP",
        expect_mechanism="stamps ALK_V2_FREEZE_5",
        apply=_d6_unstamped_fixture_file,
    ),
    DocumentMutation(
        mid="D-7",
        title="Reword a canon rule so it no longer states its mechanism",
        sabotage="`ALK-RETEST-SCHEDULER-001`'s signal term is renamed",
        guards=(
            "CHK-CANON-RULE-BODIES. The rule still exists, is still in the "
            "manifest and is still inventoried; it has simply stopped saying "
            "the thing that distinguishes it from the rule it replaced. That is "
            "the shape a silent reinterpretation actually takes."
        ),
        expect_check="CHK-CANON-RULE-BODIES",
        expect_mechanism="states its mechanism",
        apply=_d7_rule_loses_its_mechanism,
    ),
    DocumentMutation(
        mid="D-8",
        title="Remove a rule from the canon coverage manifest",
        sabotage="the `ALK-RECOMMEND-ONLY-001` manifest row is deleted",
        guards=(
            "CHK-CANON-MANIFEST, i.e. CORE-CANON-COVERAGE-001 item 3. This is "
            "`INV-I9`'s own stated negative control, ported."
        ),
        expect_check="CHK-CANON-MANIFEST",
        expect_mechanism="zero uncovered normative rule bodies",
        apply=_d8_rule_dropped_from_manifest,
    ),
    DocumentMutation(
        mid="D-9",
        title="Give one traceability rule two owners",
        sabotage="`ALK-RECOMMEND-ONLY-001`'s owner cell reads `SAFETY, OUTPUT`",
        guards=(
            "CHK-TRACE-INTEGRITY. Canon MASTER RULE 1 is one owner per "
            "inference; a rule with two owners is the defect that rule names."
        ),
        expect_check="CHK-TRACE-INTEGRITY",
        expect_mechanism="one owner per rule",
        apply=_d9_rule_with_two_owners,
    ),
    DocumentMutation(
        mid="D-10",
        title="Name a retired reason code on a live canon line",
        sabotage=(
            "`SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE` is stated as an instruction, "
            "outside any blockquote or supersession marker"
        ),
        guards=(
            "CHK-RC-RETIRED. A retired code reading as live is an instruction "
            "to emit something no module owns and the closed set does not hold."
        ),
        expect_check="CHK-RC-RETIRED",
        expect_mechanism="canon names no retired reason code",
        apply=_d10_retired_code_live_in_canon,
    ),
    DocumentMutation(
        mid="D-11",
        title="Delete a decision's only negative-control fixture block",
        sabotage=(
            "`AD-MNT-006`, `AD-MNT-007` and `AD-MNT-008` -- every fixture "
            "pinning owner decision F5-05 -- lose their `forbidden` and "
            "`variant` blocks"
        ),
        guards=(
            "CHK-DECISION-COVERAGE. A decision pinned only by fixtures that "
            "agree with it is pinned by nothing, because the rejected "
            "alternative would pass too. `INV-I8`'s stated control names "
            "`AD-MNT-006` alone; running it showed that form is STALE -- two "
            "further fixtures now cover F5-05 and each carries its own control, "
            "so removing one leaves the decision correctly pinned. Recorded as "
            "a finding, not fixed: the invariant document was out of scope here."
        ),
        expect_check="CHK-DECISION-COVERAGE",
        expect_mechanism="has a negative control",
        apply=_d11_decision_loses_its_negative_control,
    ),
    DocumentMutation(
        mid="D-12",
        title="Remove a resolution box from the open-issues register",
        sabotage="one `RESOLVED by ALK_V2_FREEZE_5` box is downgraded to `Considered by`",
        guards=(
            "CHK-OPEN-ISSUES. An item the canon treats as closed while the "
            "register still reads open is a decision with two answers."
        ),
        expect_check="CHK-OPEN-ISSUES",
        expect_mechanism="marked RESOLVED",
        apply=_d12_resolution_box_removed,
    ),
    DocumentMutation(
        mid="D-13",
        title="Introduce a constant that did not pre-exist at the base commit",
        sabotage="(not executable -- see below)",
        guards=(
            "CHK-CANON-CONSTANTS. Stated BLOCKED rather than faked: the check's "
            "subject is the canon as it stood at a pinned git commit, which no "
            "mutation of the working tree can reach. It carries an inline "
            "negative control instead -- a probe string the base canon does not "
            "contain, which must be reported absent -- proving the membership "
            "test can return false."
        ),
        expect_check="CHK-CANON-CONSTANTS",
        expect_mechanism="pre-exists in the BASE canon",
        blocked=True,
        unblocks_when=(
            "the check is widened from 'these named constants pre-existed' to "
            "'no numeric literal in the current canon is absent from the base "
            "canon'. That is a different and much stronger check, it would "
            "require a numeric-literal extractor over the canon, and writing it "
            "here would be inventing a check rather than absorbing one. Until "
            "then the inline probe in package_checks.py is the whole control. "
            "The limitation is not new and is already on the record: "
            "ALK-V2-OPEN-ISSUES.md carries it as 'The new-constant scan', "
            "which moved with the check under DEC-019."
        ),
    ),
    DocumentMutation(
        mid="D-14",
        title="Move a fixture input without moving its stated intermediates",
        sabotage="one `alkDkh` reading is shifted by 0.37 dKH",
        guards=(
            "CHK-FIXTURE-ARITHMETIC. This is `INV-I10`'s own stated negative "
            "control, ported verbatim. The fixture now states a slope that does "
            "not follow from the numbers it declares."
        ),
        expect_check="CHK-FIXTURE-ARITHMETIC",
        expect_mechanism="reproduces its stated intermediates",
        apply=_d14_fixture_input_moved,
    ),
    DocumentMutation(
        mid="D-15",
        title="Make a decision fixture contradict its own inputs",
        sabotage="`AD-EPI-005`'s first reading moves; its episode value does not",
        guards=(
            "CHK-DECISION-FIXTURES. The owner decisions are pinned by fixtures "
            "that must recompute, not by fixtures that are read back."
        ),
        expect_check="CHK-DECISION-FIXTURES",
        expect_mechanism="combines two readings five minutes apart",
        apply=_d15_decision_fixture_contradicts_itself,
    ),
    DocumentMutation(
        mid="D-16",
        title="Delete the canon sentence that carries an owner decision",
        sabotage="`The engine **continues to advise**` is reworded away",
        guards=(
            "CHK-CANON-DECISION-TEXT. The canon is the sole behavioural "
            "authority and an implementer reads it; a decision that survives "
            "only in the fixtures is a decision that will be implemented wrong."
        ),
        expect_check="CHK-CANON-DECISION-TEXT",
        expect_mechanism="continues to advise",
        apply=_d16_canon_decision_sentence_deleted,
    ),
    DocumentMutation(
        mid="D-17",
        title="Revert a decision by ADDING a contradicting sentence",
        sabotage=(
            "a live canon line states that the ordinary recommendation is "
            "WITHHELD where the advisory warning attaches"
        ),
        guards=(
            "CHK-LIVE-TEXT-ABSENCE. The single most important control here. "
            "Nothing asserted is removed, so every presence check still passes; "
            "only an absence scanner can see it. Four owner decisions were once "
            "reverted in canon exactly this way while a 192-check gate stayed "
            "green."
        ),
        expect_check="CHK-LIVE-TEXT-ABSENCE",
        expect_mechanism="advisory boundary withhold an output",
        apply=_d17_reversion_added_to_live_canon,
    ),
    DocumentMutation(
        mid="D-18",
        title="Widen the testing-episode window in the algorithm contract",
        sabotage="A3's `30 minutes` becomes `45 minutes`",
        guards=(
            "CHK-CONTRACT-STRUCTURE. Owner decision 28 kept the existing window "
            "deliberately; a contract that states a different figure from the "
            "canon is two answers to one question."
        ),
        expect_check="CHK-CONTRACT-STRUCTURE",
        expect_mechanism="keeps the existing 30-minute window",
        apply=_d18_episode_window_widened,
    ),
    DocumentMutation(
        mid="D-19",
        title="Let the advisory warning move the retest schedule",
        sabotage="every warned case of `AD-ESC-001` drops to a 6-hour retest",
        guards=(
            "CHK-BOUNDARY-INVARIANCE. Decision 24's headline property is that "
            "the answer does not change across the boundary. A within-case "
            "comparison cannot see this; the comparison has to cross the "
            "boundary."
        ),
        expect_check="CHK-BOUNDARY-INVARIANCE",
        expect_mechanism="does not move nextTestApproxHours across the boundary",
        apply=_d19_warning_moves_the_retest,
    ),
    DocumentMutation(
        mid="D-20",
        title="Require a retired reason code in a by-case shape",
        sabotage=(
            "`SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE` is appended to an "
            "`expectedReasonCodesByCase` entry of `AD-ESC-001`"
        ),
        guards=(
            "CHK-RC-CLOSURE-DOC, in the shapes it could not previously see. "
            "The breaker did exactly this -- two retired codes appended to this "
            "very fixture -- and the gate stayed green because the harvest read "
            "only the top-level array."
        ),
        expect_check="CHK-RC-CLOSURE-DOC",
        expect_mechanism="which is RETIRED",
        apply=_d20_retired_code_in_a_by_case_shape,
    ),
    DocumentMutation(
        mid="D-21",
        title="Make a fixture require a reason code it also forbids",
        sabotage="a fixture's own forbidden code is appended to its expectedReasonCodes",
        guards=(
            "CHK-RC-CLOSURE-DOC's self-contradiction clause, absorbed from the "
            "retired validator. The code is live and catalogued, so closure "
            "says nothing; the fixture is simply unsatisfiable, and an engine "
            "failing it would be failing the fixture rather than the canon."
        ),
        expect_check="CHK-RC-CLOSURE-DOC",
        expect_mechanism="both requires and forbids",
        apply=_d21_fixture_requires_what_it_forbids,
    ),
]


def run_one(m: DocumentMutation) -> dict:
    """Apply `m` to a throwaway copy and report what the harness said.

    Both the alk-v2 package **and** the canon are copied, because the checks
    absorbed from the retired freeze validator read the canon and several of
    the controls below corrupt it. `ALK_V2_PACKAGE_DIR` and `ALK_V2_CANON_DIR`
    point the harness at the copies. The repository itself is never modified --
    the corruption lives and dies inside `tempfile.mkdtemp()`.
    """
    if m.blocked:
        return {"blocked": True, "wentRed": False, "mechanismHit": False,
                "exitCode": 0, "evidence": m.unblocks_when}

    tmp = tempfile.mkdtemp(prefix=f"alkconf-{m.mid}-")
    try:
        pkg = os.path.join(tmp, "alk-v2")
        canon = os.path.join(tmp, "canon")
        shutil.copytree(PACKAGE_DIR, pkg)
        shutil.copytree(CANON_DIR, canon)
        m.apply(pkg, canon)

        env = dict(os.environ)
        env["ALK_V2_PACKAGE_DIR"] = pkg
        env["ALK_V2_CANON_DIR"] = canon
        env["PYTHONPATH"] = HARNESS_DIR + os.pathsep + env.get("PYTHONPATH", "")
        out = subprocess.run(
            [
                sys.executable,
                os.path.join(HARNESS_DIR, "run-conformance.py"),
                "--json",
                os.path.join(tmp, "report.json"),
                "--quiet",
            ],
            capture_output=True,
            text=True,
            env=env,
            cwd=REPO_ROOT,
        )
        try:
            with open(os.path.join(tmp, "report.json"), encoding="utf-8") as fh:
                report = json.load(fh)
        except OSError:
            # The harness died before writing a report. That is itself a
            # failure of the harness, not a caught mutation, and must not be
            # scored as one.
            return {
                "wentRed": False,
                "mechanismHit": False,
                "exitCode": out.returncode,
                "evidence": (out.stderr or out.stdout or "(no output)")[-300:],
            }

        if m.expect_check == "corpus-problem":
            texts = list(report.get("corpusProblems") or [])
            went_red = bool(texts)
        else:
            check = next(
                (c for c in report["checks"] if c["id"] == m.expect_check), None
            )
            texts = list(check["violations"]) if check else []
            went_red = bool(check and check["status"] == "FAIL")

        mechanism_hit = any(m.expect_mechanism in t for t in texts)
        return {
            "wentRed": went_red,
            "mechanismHit": mechanism_hit,
            "exitCode": out.returncode,
            "evidence": next(
                (t for t in texts if m.expect_mechanism in t),
                (texts[0] if texts else "(no violation text)"),
            ),
        }
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
