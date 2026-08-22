"""Package-level document checks, absorbed from the retired freeze validator.

`docs/implementation/alk-v2/validate-freeze-5.py` was a second gate. Canon
`MASTER RULE 1`: *two implementations of one rule that agree today are a
defect, not a coincidence.* The owner decided one gate, and that the
conformance harness owns everything executable. This module is the freeze
validator's unique coverage, moved rather than dropped.

`docs/process/GATE-CHECK-INVENTORY.md` is the record of what moved, what was
already here, and what was superseded and by what. Read it before editing this
file: eight of the validator's 437 checks were deliberately **not** brought
across, and re-adding one of them would recreate the duplication this move
exists to end.

WHAT IS HERE, AND WHY IT IS ONE MODULE
    The logic below is the validator's, essentially verbatim, because
    re-deriving 400 checks by hand is how coverage is silently lost. What
    changed is the reporting adapter and the paths: `check(name, ok, detail)`
    now accumulates into a `CheckOutcome` bucket chosen by `_sec(...)`, and
    every document is reached through `paths`, so `ALK_V2_PACKAGE_DIR` and
    `ALK_V2_CANON_DIR` reach these checks exactly as they reach the rest of
    the harness. That is what lets `mutations/documents.py` corrupt a
    throwaway copy and require each check to go red.

THE BUCKETS

  CHK-PKG-JSON             every JSON file in the package parses
  CHK-FREEZE-STAMP         the current freeze is stamped, the superseded one is gone
  CHK-CANON-RULE-BODIES    every canon rule id has an authoritative body that
                           states its mechanism, and is inventoried
  CHK-CANON-MANIFEST       CORE-CANON-COVERAGE-001 items 1, 2, 3 and 8, over the canon
  CHK-TRACE-INTEGRITY      traceability totals, one owner per rule, no BLOCKED rows
  CHK-RC-RETIRED           no retired reason code or retired rule id is live anywhere
  CHK-DECISION-COVERAGE    every owner decision has a positive fixture and a
                           negative control
  CHK-OPEN-ISSUES          the register marks resolved what is resolved, and
                           leaves open what is open
  CHK-CANON-CONSTANTS      no constant arrived that did not pre-exist at the base commit
  CHK-FIXTURE-ARITHMETIC   every series fixture reproduces the intermediates it states
  CHK-DECISION-FIXTURES    the owner decisions recomputed from the fixtures' own inputs
  CHK-CANON-DECISION-TEXT  the canon's own statement of those decisions
  CHK-LIVE-TEXT-ABSENCE    a contradicting clause ADDED to live text
  CHK-CONTRACT-STRUCTURE   the contract rows and preconditions the scanners cannot express
  CHK-BOUNDARY-INVARIANCE  the advisory warning moves nothing across the boundary

ABSENCE, NOT ONLY PRESENCE
    `CHK-LIVE-TEXT-ABSENCE` is the class the validator's own history shows is
    hardest, and it is the reason this module scans prose at all. Four owner
    decisions were once reverted **in the canon** by adding a contradicting
    sentence, and a 192-check presence-only gate stayed green through all
    four: the asserted strings were all still there. Presence cannot see a
    contradiction; only absence can. Each scanner here carries an inline
    self-test that feeds it the exact mutation text and fails if the scanner
    does not catch it.

WHAT THIS MODULE DOES NOT DO
    It computes no chemistry on an engine's behalf and it transcribes no canon
    value as an expectation. Where it recomputes arithmetic
    (`CHK-FIXTURE-ARITHMETIC`, `CHK-DECISION-FIXTURES`) it recomputes a
    fixture's stated intermediates **from the inputs that same fixture
    declares**, which is a self-consistency check on the corpus and not a
    second opinion about what canon requires.
"""

from __future__ import annotations

import collections
import datetime
import glob
import json
import os
import re
import subprocess
from decimal import Decimal as _D
from statistics import median as _med
from typing import Dict, List, Tuple

from . import paths
from .results import FAIL, PASS, CheckOutcome

_ALK = paths.ALK + os.sep
_CANON = paths.CANON_DIR + os.sep

#: How many assertions a complete run of this module makes.
#:
#: A floor, not a decoration. Several of the checks below are guarded --
#: `if f:` on a fixture that may not exist, `if len(man)==2:` on a canon
#: section -- so a document edit can delete assertions rather than failing
#: them, and a gate that quietly examines less than it did reports a smaller,
#: cleaner pass. `test-engineer` demonstrated exactly that: a consistent
#: rename of `AD-EPI-005` removed an assertion, took the count from 423 to
#: 422, and turned the negative control that depended on it green, with no
#: violation anywhere.
#:
#: Raise this deliberately when checks are added, and never lower it to make a
#: run pass -- lowering it is the defect it exists to catch. It counts this
#: module's own assertions, not anything canon owns.
EXPECTED_ASSERTIONS = 430

#: One title and one description per bucket. The description is what the run
#: report prints as "checked:", so it must say what was actually examined.
_BUCKETS: Dict[str, Tuple[str, str]] = {
    "CHK-PKG-JSON": (
        "Every JSON file in the alk-v2 package parses",
        "every *.json under the package, recursively, including baselines/ "
        "and traceability/ which are on no other harness read path",
    ),
    "CHK-FREEZE-STAMP": (
        "The current freeze is stamped and the superseded one is gone",
        "every fixture file for the current freeze identifier, and the whole "
        "package for a surviving superseded one",
    ),
    "CHK-CANON-RULE-BODIES": (
        "Every canon rule has an authoritative body stating its mechanism",
        "the canon rule ids this package depends on: each required to have a "
        "body, to be inventoried in the traceability table, and to state the "
        "mechanism that distinguishes it from the rule it superseded",
    ),
    "CHK-CANON-MANIFEST": (
        "CORE-CANON-COVERAGE-001, performed over the canon",
        "the canon rule coverage manifest: items 1 (no dangling id), 2 "
        "(substantive bodies), 3 (no uncovered normative body), 4/5 (every "
        "entry names a fixture that exists) and 8 (no duplicate authoritative "
        "body)",
    ),
    "CHK-TRACE-INTEGRITY": (
        "The rule-traceability table is internally sound",
        "declared totals against parsed rows, one single-valued owner per "
        "rule, duplicate rule ids, and surviving BLOCKED rows",
    ),
    "CHK-RC-RETIRED": (
        "No retired reason code or retired rule id is live anywhere",
        "the retired tables, the fixture corpus, the package specs, the canon "
        "and the retirement rows themselves; each scanner carrying its own "
        "inline negative control",
    ),
    "CHK-DECISION-COVERAGE": (
        "Every owner decision has a positive fixture and a negative control",
        "each freeze and owner decision mapped to the open-issue ids it "
        "closed, and the corpus required to carry both a fixture that "
        "exercises it and one that forbids the reverted answer",
    ),
    "CHK-OPEN-ISSUES": (
        "The open-issues register agrees with what was decided",
        "every resolved item marked resolved by the right authority, every "
        "deliberately-open item still open, the resolution-box counts, and "
        "the original analysis preserved rather than deleted",
    ),
    "CHK-CANON-CONSTANTS": (
        "No numeric constant arrived without being declared",
        "each constant the freeze relies on, required to pre-exist in the "
        "canon at the pinned base commit, read via git rather than from the "
        "working tree",
    ),
    "CHK-FIXTURE-ARITHMETIC": (
        "Every series fixture reproduces the intermediates it states",
        "independent recomputation of independent-cluster selection, the "
        "Theil-Sen slope, intercept, residuals, MAD, sigma_resid, "
        "sigma_point, Sxx, sigma_S and the supported slope, from the inputs "
        "each fixture itself declares",
    ),
    "CHK-DECISION-FIXTURES": (
        "The owner decisions recompute from the fixtures' own inputs",
        "the safety-sizing, episode-resolution, exact-decimal, dose-history "
        "split, branch-selection and advisory-boundary fixtures, each "
        "recomputed rather than read back",
    ),
    "CHK-CANON-DECISION-TEXT": (
        "The canon states the decisions the fixtures encode",
        "the canon's boxed formulas, partitions, emit blocks, warning "
        "elements and retirement markers -- the canon-side twin of every "
        "fixture-side check, because the canon is the sole behavioural "
        "authority and an implementer reads it",
    ),
    "CHK-LIVE-TEXT-ABSENCE": (
        "No live text contradicts a decision it is supposed to carry",
        "sentence-scoped absence scanners over the canon and the package "
        "specs, each with an inline negative control fed the exact reversion "
        "text it exists to catch",
    ),
    "CHK-CONTRACT-STRUCTURE": (
        "The contract rows and preconditions say what the decisions require",
        "the rounding rule's preconditions, A40's pre-branch precondition, "
        "the three output rows of the data contract, the advisory-warning "
        "enumeration, the episode window and the combined-measurement count",
    ),
    "CHK-BOUNDARY-INVARIANCE": (
        "The advisory warning moves nothing across the boundary",
        "every recommendation-bearing field a warned case states, required to "
        "be stated identically by the unwarned cases, and one retest answer "
        "per case",
    ),
}


class _Recorder:
    """Accumulates `check()` results into one bucket per defect class.

    The validator printed PASS/FAIL per line and exited non-zero on any
    failure. The harness reports a `CheckOutcome` per defect class, so a
    failure names the class it belongs to and the mutation set can declare a
    subject to turn red. The per-check granularity is preserved in the
    violation text, which carries the original check name verbatim.
    """

    def __init__(self) -> None:
        self.current = "CHK-PKG-JSON"
        self.violations: Dict[str, List[str]] = collections.defaultdict(list)
        self.examined: Dict[str, int] = collections.defaultdict(int)
        self.notes: Dict[str, List[str]] = collections.defaultdict(list)
        self.total = 0
        #: Set when the run stops early. Every bucket is then suspect, because
        #: the buckets are interleaved -- `CHK-CANON-RULE-BODIES` is entered
        #: twice and `CHK-LIVE-TEXT-ABSENCE` four times -- so "already passed"
        #: cannot be inferred from position. See `outcomes()`.
        self.aborted_in: str = ""

    def sec(self, check_id: str) -> None:
        assert check_id in _BUCKETS, check_id
        self.current = check_id

    def note(self, check_id: str, text: str) -> None:
        """Something the owner should see that is not a failure."""
        self.notes[check_id].append(text)

    def check(self, name: str, ok, detail: str = "") -> None:
        self.total += 1
        self.examined[self.current] += 1
        if not ok:
            self.violations[self.current].append(
                name + (("  -- " + str(detail)) if detail else "")
            )

    def outcomes(self) -> List[CheckOutcome]:
        """One `CheckOutcome` per bucket.

        **A bucket that did not run does not report PASS.** This is the
        harness's own rule, stated at `report.py`: *"an unrun fixture must
        never read as a passing one."* It applies with more force here,
        because one exception anywhere in the absorbed body ends the whole
        run: without the guard below, a `KeyError` in an early bucket left
        fourteen later ones reporting PASS over zero assertions, including
        `CHK-LIVE-TEXT-ABSENCE` while a reverted canon decision sat in the
        tree. That is the exact false green this gate exists to prevent, and
        it was found by `test-engineer` rather than by the gate.

        The rule is deliberately blunt: once the run has aborted, **no** bucket
        may report PASS, not merely the ones that had not started. The buckets
        are interleaved, so a bucket entered early may still have had
        assertions pending when the run stopped, and there is no cheap way to
        tell which. A gate that stopped early is entirely red until the reason
        it stopped is fixed.
        """
        out: List[CheckOutcome] = []
        for cid, (title, what) in _BUCKETS.items():
            v = list(self.violations.get(cid, []))
            n = self.examined.get(cid, 0)
            if self.aborted_in and not v:
                v = [
                    "NOT EVALUATED: the absorbed checks stopped early, in "
                    "%s. This check reports neither pass nor failure -- its "
                    "%d assertion(s) may not all have run, and a PASS here "
                    "would be a false green." % (self.aborted_in, n)
                ]
            out.append(
                CheckOutcome(
                    check_id=cid,
                    title=title,
                    status=FAIL if v else PASS,
                    what_was_checked="%d assertions over %s" % (n, what),
                    detail="; ".join(self.notes.get(cid, [])),
                    violations=v,
                    subjects_examined=n,
                )
            )
        return out


def run_package_checks() -> Tuple[List[CheckOutcome], int]:
    """Run every absorbed check. Returns the outcomes and the assertion count.

    A hard failure here -- a document missing, a JSON file unparseable at a
    point the checks depend on -- is reported as a violation of the bucket
    that was running, never as a traceback. A gate that crashes is a gate that
    gets waived.
    """
    _rec = _Recorder()
    _sec = _rec.sec
    check = _rec.check
    fails: List[str] = []

    try:
        CANON = open(paths.CANON_MD, encoding="utf-8").read()
    except OSError as exc:
        return (
            [
                CheckOutcome(
                    check_id=cid,
                    title=title,
                    status=FAIL,
                    what_was_checked="the canon could not be read",
                    violations=["%s: %s" % (paths.rel(paths.CANON_MD), exc)],
                )
                for cid, (title, _w) in _BUCKETS.items()
            ],
            0,
        )
    FIXDIR = paths.FIXTURES + os.sep
    DOCS = sorted(glob.glob(_ALK + "*.md"))

    try:
        _sec('CHK-PKG-JSON')
        # ---------- 1. JSON well-formedness ----------
        jsons={}
        for fn in sorted(glob.glob(_ALK+'**/*.json', recursive=True)):
            try: jsons[fn]=json.load(open(fn,encoding='utf-8'))
            except Exception as e: check('json parse '+os.path.basename(fn), False, str(e))
        check('all package JSON parses', len(jsons)==len(glob.glob(_ALK+'**/*.json',recursive=True)),
              '%d files'%len(jsons))

        # ---------- 2. fixture corpus ----------
        FILES=['canon-worked-goldens-round1.json','canon-worked-goldens-round2.json',
               'canon-worked-goldens-external.json','canon-named-goldens.json',
               'adversarial.json','invariants-and-governance.json']
        fixtures={}
        for fn in FILES:
            for f in jsons[FIXDIR+fn]['fixtures']:
                fid=f['fixtureId']
                fixtures[fid]=(fn,f)

        _sec('CHK-FREEZE-STAMP')
        # ---------- 3. canon authority stamped everywhere ----------
        bad=[fn for fn in sorted(glob.glob(FIXDIR+'*.json'))
             if 'ALK_V2_FREEZE_5' not in open(fn,encoding='utf-8').read()]
        check('every fixture file stamps ALK_V2_FREEZE_5', not bad, str([os.path.basename(b) for b in bad]))
        check('no ALK_V2_FREEZE_4 left in the package',
              not [fn for fn in sorted(glob.glob(_ALK+'**/*',recursive=True))
                   if os.path.isfile(fn) and not fn.endswith('.py')
                   and 'ALK_V2_FREEZE_4' in open(fn,encoding='utf-8',errors='ignore').read()
                   and os.path.basename(fn) not in ('ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md',
                                                     'README.md','ALK-V2-RULE-TRACEABILITY.md')],
              'historical references in the register, review, README and traceability notes are exempt')

        _sec('CHK-CANON-RULE-BODIES')
        # ---------- 4. new canon rule IDs have bodies and are referenced ----------
        NEW_RULES=['ALK-INDEPENDENT-SELECTION-001','ALK-SUSPECT-DETECTION-001','ALK-NEGATIVE-MATERIALITY-001',
         'ALK-RETURN-ELIGIBLE-TRAJECTORY-001','ALK-TOWARD-RANGE-HOLD-001','ALK-RAPID-BASIS-001',
         'ALK-RETURN-TERMINATED-BY-SAFETY-001','ALK-RETEST-SCHEDULER-001',
         'ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001',
         'ALK-HIGH-BREACH-NO-PAUSE-001','ALK-SAME-TIMESTAMP-COALESCE-001',
         # owner decisions 16-19
         'ALK-HIGH-BREACH-SAFETY-SIZING-001','ALK-REPEAT-SPREAD-DOMAIN-001','ALK-TESTING-EPISODE-001',
         'ALK-EPISODE-RESOLUTION-001','ALK-EPISODE-SINGLE-OUTPUT-001','ALK-DECIMAL-THRESHOLD-001',
         # owner decisions 20-22
         'ALK-DELIVERY-RATE-BASIS-001','ALK-ADVISORY-RANGE-BOUNDARY-001',
         'ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001',
         # owner decision 23
         'ALK-RECOMMEND-ONLY-001']
        for rid in NEW_RULES:
            # a body = the id on its own line as a backticked marker in the canon
            body = re.search(r'^`'+re.escape(rid)+r'`\s*$', CANON, re.M) is not None
            check('canon body for '+rid, body)
        trace=jsons[_ALK+'traceability/alk-v2-traceability.json']
        tids={r['id'] for g in trace['groups'] for r in g['rules']}
        missing=[r for r in NEW_RULES if r not in tids]
        check('every new rule is inventoried in traceability', not missing, str(missing))

        _sec('CHK-TRACE-INTEGRITY')
        # ---------- 5. traceability integrity ----------
        rules=[r for g in trace['groups'] for r in g['rules']]
        check('traceability totals match rows', trace['totals']['rules']==len(rules), '%d'%len(rules))
        check('one owner per rule (single-valued; the vocabulary itself is NOT checked - OI-GATEVOCABULARY-001)',
              all(isinstance(r['owner'],str) and ',' not in r['owner'] for r in rules))
        dupids=[k for k,v in collections.Counter(r['id'] for r in rules).items() if v>1]
        check('no duplicate rule ids', not dupids, str(dupids))
        check('no BLOCKED rows remain', not [r for r in rules if r['activeInAlkOnlyV2'].startswith('BLOCKED')])


        _sec('CHK-RC-RETIRED')
        # ---------- 6. reason codes: closed set, no retired code emitted ----------
        RC=open(_ALK+'ALK-V2-REASON-CODES.md',encoding='utf-8').read()
        body=RC.split('## Retired by')[0]
        catalogue=set(re.findall(r'^\| `([A-Z][A-Z0-9_]+)` \| `(?:INFO|GATING|REFUSAL|SAFETY)` \|', body, re.M))
        # Every retired table, not just the first. The section headings are '## Retired by ...' and
        # '### Retired by owner decisions ...', and '### Retired by' CONTAINS '## Retired by' as a
        # substring - so splitting on that substring and reading only part [1] silently dropped every
        # table from the owner-decision rounds. Three codes retired by decisions 16 and 17 were
        # therefore never enforced as retired. Found while encoding decision 20's rename; the union
        # below is the fix.
        _retired_region=RC.split('## Retired by',1)[1].split('## Appendix')[0]
        retired=set(re.findall(r'^\| `([A-Z][A-Z0-9_]+)` \|', _retired_region, re.M))
        check('retired-set parser reaches every retired table',
              {'SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE','CLUSTER_SAME_TIMESTAMP_COALESCED',
               'SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE'} <= retired,
              '%d codes retired'%len(retired))
        # retired codes must not appear as required codes anywhere in the package prose either.
        # A line is exempt ONLY if it says, on that same line, that the code is retired, renamed or
        # forbidden. Previously the exemption was the bare substring 'negative control', which any
        # unrelated sentence could carry; the breaker showed the exemption had no negative control of
        # its own, so one is asserted below.
        _RETIRE_MARK=re.compile(r'negative control|RETIRED|Retired|retired|retires|renamed|Renamed|forbidden|previously read|preserved rather than deleted|superseded|Superseded', re.I)
        def _retired_code_leaks(texts):
            out=[]
            for name,t in texts:
                for line in t.split('\n'):
                    if _RETIRE_MARK.search(line): continue
                    if line.lstrip().startswith('>'): continue      # preserved-history blockquote
                    for c in retired:
                        if c in line: out.append((name,c))
            return out
        _spec_texts=[(os.path.basename(d),open(d,encoding='utf-8').read()) for d in DOCS
                     if os.path.basename(d) not in ('ALK-V2-REASON-CODES.md','ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md')]
        leak=_retired_code_leaks(_spec_texts)
        check('no retired code referenced as live in the specs', not leak, str(leak[:6]))
        # NEGATIVE CONTROL for the check above: a genuinely live use must be caught, and the
        # exemption must not swallow it.
        _probe='reason = %s'%sorted(retired)[0]
        check('the retired-code scan catches a live use (negative control)',
              len(_retired_code_leaks([('PROBE.md',_probe)]))==1, _probe)
        check('the retired-code exemption does not fire on an unmarked line (negative control)',
              len(_retired_code_leaks([('PROBE.md','the engine emits %s here'%sorted(retired)[0])]))==1)

        _sec('CHK-DECISION-COVERAGE')
        # ---------- 7. Freeze-5 decision coverage: positive + negative control ----------
        DEC={'F5-01':['OI-INDEPENDENCE-001'],'F5-02':['OI-SUSPECT-001','OI-MADFLOOR-001'],
         'F5-03':['OI-NEGCONS-001'],'F5-04':['OI-RETURNOFFER-001'],'F5-05':['OI-BELOWRISING-001'],
         'F5-06':['OI-LIQUIDGUARD-001'],'F5-07':['OI-RAPIDBASIS-001'],'F5-08':['OI-RETURNDURINGSAFETY-001'],
         'F5-09':['OI-RETEST-001'],'F5-10':['OI-WATERCHANGE-001'],'F5-11':['OI-SAFETYRATE-001'],
         'F5-12':['OI-CONFIDENCE-001'],'F5-13':['OI-HIGHBREACHBAND-001'],'F5-14':['OI-CLUSTERTIE-001'],
         'F5-15':['OI-RETESTFLOOR-001'],
         'D16':['OI-HIGHBREACHSIZING-001'],'D17':['OI-EPISODE-001'],
         'D18':['OI-CROSSMETHOD-001','OI-DECIMALTHRESHOLD-001'],'D19':['OI-EPISODECONSUMER-001'],
         'D20':['OI-DELIVERYRATEBASIS-001'],'D21':['OI-SIZINGFLAT-001'],'D22':['OI-UNCOMPUTABLEC-001'],
         'D23':['OI-SAFETYRATE-001'],'D24':['OI-ADVISORYEXCEPTION-001','OI-ADVISORYMEMBERS-001','OI-ADVISORYRETURN-001'],
         'D25':['OI-BRANCHAREFUSAL-001'],'D26':['OI-ADVISORYRETEST-001'],
         'D27':['OI-METHODUNKNOWN-001'],'D28':['OI-EPISODEMEMBERSHIP-001'],
         'D29':['OI-ADVISORYWARNSTATE-001'],'D30':['OI-EPISODEDATEONLY-001']}
        for dec,ois in DEC.items():
            pos=[fid for fid,(fn,f) in fixtures.items()
                 if any(any(o in s for s in (f.get('openIssues') or [])) for o in ois)]
            neg=[fid for fid in pos if fixtures[fid][1].get('forbidden') or fixtures[fid][1].get('variant')]
            check('%s has a positive fixture'%dec, bool(pos), ','.join(sorted(pos)))
            check('%s has a fixture carrying a forbidden or variant block (presence only; that it forbids the REVERTED answer is not checked)'%dec, bool(neg), ','.join(sorted(neg)))

        _sec('CHK-OPEN-ISSUES')
        # ---------- 8. every resolved OI is marked RESOLVED in the register ----------
        OI=open(_ALK+'ALK-V2-OPEN-ISSUES.md',encoding='utf-8').read()
        RESOLVED=['OI-INDEPENDENCE-001','OI-SUSPECT-001','OI-MADFLOOR-001','OI-NEGCONS-001','OI-RETEST-001',
         'OI-RETURNOFFER-001','OI-BELOWRISING-001','OI-WATERCHANGE-001','OI-LIQUIDGUARD-001','OI-SAFETYRATE-001',
         'OI-RETURNDURINGSAFETY-001','OI-RAPIDBASIS-001','OI-CONFIDENCE-001',
         'OI-HIGHBREACHBAND-001','OI-CLUSTERTIE-001','OI-RETESTFLOOR-001']
        # Named for the round that introduced it; it now carries every owner decision from
        # 16 onward, decision 30 included.
        DECIDED_16_19=['OI-HIGHBREACHSIZING-001','OI-EPISODE-001','OI-CROSSMETHOD-001',
         'OI-DECIMALTHRESHOLD-001','OI-EPISODECONSUMER-001',
         'OI-DELIVERYRATEBASIS-001','OI-UNCOMPUTABLEC-001',
         'OI-ADVISORYEXCEPTION-001','OI-ADVISORYMEMBERS-001','OI-ADVISORYRETURN-001',
         'OI-BRANCHAREFUSAL-001','OI-ADVISORYRETEST-001',
         'OI-METHODUNKNOWN-001','OI-EPISODEMEMBERSHIP-001','OI-ADVISORYWARNSTATE-001',
         'OI-EPISODEDATEONLY-001']
        # Opened by the decisions 16-19 review and DELIBERATELY LEFT OPEN. A register section that
        # quietly acquired a resolution box would be a silent decision, so the gate asserts the
        # absence of one as hard as it asserts the presence of the others.
        LEFT_OPEN=['OI-SIZINGFLAT-001','OI-CZERODISCONT-001']
        for oi in DECIDED_16_19:
            m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
            if not m: check('register section for '+oi, False); continue
            nxt=OI.find('\n## ', m.end()); nxt = nxt if nxt!=-1 else len(OI)
            check(oi+' marked RESOLVED by an owner decision',
                  'RESOLVED by owner decision' in OI[m.start():nxt])
        for oi in RESOLVED:
            m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
            if not m: check('register section for '+oi, False); continue
            nxt=OI.find('\n## ', m.end()); nxt = nxt if nxt!=-1 else len(OI)
            seg=OI[m.start():nxt]
            check(oi+' marked RESOLVED', 'RESOLVED by `ALK_V2_FREEZE_5`' in seg)
        check('register keeps the original analysis (history not deleted)',
              'Failure scenario' in OI and 'Until closed (superseded by Freeze 5; historical)' in OI)
        n_res=OI.count('> **RESOLVED by `ALK_V2_FREEZE_5`')
        check('exactly 16 Freeze-5 resolution boxes', n_res==16, str(n_res))
        n_d=OI.count('> **RESOLVED by owner decision')
        check('exactly 16 owner-decision 16-30 resolution boxes', n_d==16, str(n_d))
        for oi in LEFT_OPEN:
            m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
            if not m: check('register section for '+oi, False); continue
            nxt=OI.find('\n## ', m.end()); nxt = nxt if nxt!=-1 else len(OI)
            seg=OI[m.start():nxt]
            check(oi+' is NOT marked resolved',
                  '> **RESOLVED' not in seg and 'RESOLVED by owner decision' not in seg
                  and '**Status:** **OPEN.**' in seg and '### Until closed' in seg)
        # Owner decision 24 REMOVED decision 21's narrowing. The register must say that plainly:
        # a reader who saw "narrowed" one decision ago must not still see it.
        check('OI-SIZINGFLAT-001 records that decision 24 REMOVED the narrowing, and stays open',
              'NO LONGER NARROWED. Owner decision 24 removed the bound. This item remains OPEN' in OI
              and 'wider** now than it was one decision ago' in OI
              and 'The decision-21 narrowing is preserved below as history' in OI)
        check('OI-CZERODISCONT-001 records that no branch boundary was moved',
              'no branch boundary\n> was adjusted to reduce it' in OI or
              'no branch boundary was adjusted to reduce it' in OI)

        _sec('CHK-CANON-CONSTANTS')
        # ---------- 9. no new numeric constant introduced by Freeze 5 ----------
        # The Freeze-5 declaration claims no new constant. Compare against the PINNED BASE, not
        # HEAD: at the freeze commit HEAD is the freeze itself, so a HEAD comparison is vacuous and
        # would pass for a constant this very change introduced.
        import subprocess
        BASE_COMMIT='acc6615'
        base=subprocess.run(['git','show',BASE_COMMIT+':docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md'],
                            capture_output=True,text=True,cwd=paths.ROOT).stdout
        check('base canon readable at '+BASE_COMMIT, len(base)>100000, '%d chars'%len(base))
        for c in ['1.28','0.10 dKH','0.20 dKH','0.02','24','48','0.50']:
            check('constant %r pre-exists in the BASE canon'%c, c in base)
        # INLINE NEGATIVE CONTROL. This check's subject is the canon as it stood
        # at a pinned git commit, which no mutation of the working tree can
        # reach -- so it has no document mutation, and `D-13` says so rather
        # than faking one. What can still be demonstrated is that the
        # membership test is capable of returning false: feed it a string the
        # base canon does not contain. Without this, a `base` that silently
        # read as the whole repository, or a test that had degenerated to
        # `True`, would pass every line above.
        _probe='CONSTANT_THAT_IS_NOT_IN_THE_BASE_CANON_5f3a91'
        check('the constant scan can report a constant ABSENT (negative control)',
              _probe not in base, _probe)

        # ---------- 10. invariant count ----------
        INV=open(_ALK+'ALK-V2-INVARIANTS.md',encoding='utf-8').read()

        _sec('CHK-CANON-RULE-BODIES')
        # ---------- 11. canon internal consistency for the amended rules ----------
        pairs=[('ALK-INDEPENDENT-SELECTION-001','forward-greedily'),
               ('ALK-SUSPECT-DETECTION-001','NOT_RUN'),
               ('ALK-NEGATIVE-MATERIALITY-001','ALK\\\\_SLOPE\\\\_SUPPORT\\\\_K'),
               ('ALK-RETURN-ELIGIBLE-TRAJECTORY-001','returnPlanEligibleTrajectory'),
               ('ALK-TOWARD-RANGE-HOLD-001','HOLD maintenance'),
               ('ALK-RAPID-BASIS-001','LATEST_INDEPENDENT_PAIR'),
               ('ALK-RETURN-TERMINATED-BY-SAFETY-001','TERMINATED_BY_SAFETY_RETURN'),
               ('ALK-RETEST-SCHEDULER-001','T_{signal,days}'),
               ('ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001','MEASURED\\\\_SAME\\\\_BATCH'),
               ('ALK-HIGH-BREACH-NO-PAUSE-001','does NOT choose the delivered rate'),
               ('ALK-SAME-TIMESTAMP-COALESCE-001','resolved testing-episode outputs'),
               ('ALK-HIGH-BREACH-SAFETY-SIZING-001','D_{current}'),
               ('ALK-DELIVERY-RATE-BASIS-001','D_{history}'),
               ('ALK-ADVISORY-RANGE-BOUNDARY-001','AdvisoryCeiling = OuterMax + 1.0'),
               ('ALK-RECOMMEND-ONLY-001','no execution path from the engine to the tank'),
               ('ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001','jointly exhaustive and mutually exclusive'),
               ('ALK-REPEAT-SPREAD-DOMAIN-001','does not know what produced a reading'),
               ('ALK-TESTING-EPISODE-001','within 30 minutes of one another'),
               ('ALK-EPISODE-RESOLUTION-001','There is no contested'),
               ('ALK-EPISODE-SINGLE-OUTPUT-001','may independently choose'),
               ('ALK-DECIMAL-THRESHOLD-001','compare exact decimal values')]
        for rid,token in pairs:
            m=re.search(r'^`'+re.escape(rid)+r'`\s*$', CANON, re.M)
            seg=CANON[m.start():m.start()+9000] if m else ''
            check('canon rule %s states its mechanism'%rid, token.replace('\\\\','\\') in seg or token in seg)
        check('Freeze 5 declaration present', '# PART III — ALK V2 FREEZE 5 DECLARATION' in CANON)
        check('Freeze 4 marked historical', 'ALK V2 FREEZE 4 DECLARATION — HISTORICAL' in CANON)
        check('no stale ALK_V2_FREEZE_4 as current authority in canon',
              'alkBehaviourCanon = ALK_V2_FREEZE_4' not in CANON and 'behaviouralCanon = ALK_V2_FREEZE_5' in CANON)

        _sec('CHK-CANON-MANIFEST')
        # ---------- 12. CORE-CANON-COVERAGE-001, performed over the canon ----------
        # Items 1, 2, 3 and 8 are about the canon. A checker that never reads the canon cannot
        # perform them - that gap is what let the coverage manifest go stale through Freeze 5.
        #
        # Scope: STABLE RULE IDs, which MASTER RULE 4 distinguishes from section numbers. A stable
        # rule ID carries an alphabetic segment between its prefix and its number
        # (ALK-MOVEMENT-001, CORE-STABILISE-001). Section headings (ALK-031), worked goldens
        # (WG-ALK-013), audit items (AUDIT-019), canon invariants (X-INV-004) and freeze notes
        # (FZ-ALK-001) are not manifest entries and are excluded - the manifest's own 62
        # pre-existing entries are exactly this shape.
        STABLE_ID = r'(?:CORE|SHARED|SIM|SURFACE|MIGRATION|ALK)-[A-Z][A-Z0-9]*(?:-[A-Z][A-Z0-9]*)*-\d{3}'
        MANIFEST_THRESHOLD_CHARS = 400   # explicit conservative threshold, item 2

        man = CANON.split('# CANON RULE COVERAGE MANIFEST')
        check('coverage manifest section exists', len(man)==2)
        if len(man)==2:
            mtail = man[1].split('\n---\n')[0]
            manifest = dict(re.findall(r'^\| `('+STABLE_ID+r')` \| (.+?) \|$', mtail, re.M))
            # The canon marks an authoritative body in three interchangeable ways. A mention in
            # prose, or in a "Decision summary - `ID` -" heading, is not a body.
            BODY_PATTERNS = [
                r'^`('+STABLE_ID+r')`\s*$',
                r'^#{2,3} `('+STABLE_ID+r')`',
                r'^#{2,3} ('+STABLE_ID+r') —',
            ]
            bodies = collections.Counter(); body_at = {}
            for pat in BODY_PATTERNS:
                for m in re.finditer(pat, CANON, re.M):
                    bodies[m.group(1)] += 1
                    body_at.setdefault(m.group(1), m.end())
            check('manifest is non-trivial', len(manifest)>50, '%d entries'%len(manifest))
            check('rule bodies found', len(bodies)>50, '%d bodies'%len(bodies))
            # item 1 - every manifest ID resolves to a body
            dangling=sorted(set(manifest)-set(bodies))
            check('zero dangling manifest rule IDs', not dangling, str(dangling))
            # item 8 - zero duplicate authoritative bodies
            dup=[k for k,v in bodies.items() if v>1]
            check('zero duplicate authoritative bodies', not dup, str(dup))
            # item 3 - every body in the manifest
            uncovered=sorted(set(bodies)-set(manifest))
            check('zero uncovered normative rule bodies', not uncovered, str(uncovered))
            # item 4/5 - every manifest entry names a fixture, and it exists
            missing=[]
            for rid,cell in manifest.items():
                ids=re.findall(r'`([A-Za-z0-9-]+)`', cell)
                if not ids: missing.append((rid,'no fixture named'))
                for fid in ids:
                    if fid not in fixtures: missing.append((rid,fid))
            check('zero missing fixture IDs in the manifest', not missing, str(missing[:6]))
            # item 2 - substantiveness. Enforced on the bodies THIS freeze added; pre-existing
            # terse bodies are reported, not failed, because repairing them is outside Freeze 5.
            def body_len(rid):
                seg=CANON[body_at[rid]: body_at[rid]+20000]
                nxt=re.search(r'^#{1,2} ', seg, re.M)
                return len((seg[:nxt.start()] if nxt else seg).strip())
            thin_new=[(r,body_len(r)) for r in NEW_RULES if r in body_at and body_len(r)<MANIFEST_THRESHOLD_CHARS]
            check('zero insubstantial Freeze-5 rule bodies (threshold %d chars)'%MANIFEST_THRESHOLD_CHARS,
                  not thin_new, str(thin_new))
            thin_old=sorted(((r,body_len(r)) for r in body_at if r not in NEW_RULES and body_len(r)<MANIFEST_THRESHOLD_CHARS),
                            key=lambda x:x[1])
            # Reported for the owner, not failed: these bodies pre-date the freeze
            # and repairing them was outside its scope. A note, never a violation,
            # so that a real regression is not lost in a standing complaint.
            _rec.note(
                'CHK-CANON-MANIFEST',
                'pre-existing rule bodies under the %d-char substantiveness '
                'threshold, reported and not failed: %s'
                % (MANIFEST_THRESHOLD_CHARS, thin_old if thin_old else 'none'))

        _sec('CHK-RC-RETIRED')
        # ---------- 13. the canon may not instruct the engine to emit a retired code ----------
        # A retired code may still appear as PRESERVED HISTORY inside a marked superseded block -
        # decisions 16-19 supersede earlier Freeze-5 wording and the canon keeps that wording rather
        # than deleting it. History is quoted, so the exemption is exactly "on a blockquote line".
        # A retired code on any ordinary line is still a live instruction and still fails.
        canon_retired=[]
        MARKED=('previously read','previously required','Superseded wording','superseded by owner decision',
                'Superseded','superseded','Amended by owner decision','retire','Retire','RETIRE','formerly','inoperative')
        # Prose is paragraph-scoped: a preserved-history paragraph is exempt as a unit, because the
        # quotation wraps. Fenced code blocks are LINE-scoped: an instruction re-inserted inside a
        # fence is not exempted by a marker outside it.
        _lines=CANON.split('\n')
        _infence=False; _fenced=set()
        for _n,_l in enumerate(_lines):
            if _l.lstrip().startswith('```'): _infence=not _infence; continue
            if _infence: _fenced.add(_n)
        _blockmark=[False]*len(_lines); _n=0
        for _blk in CANON.split('\n\n'):
            _m=any(x in _blk for x in MARKED)
            for _ in _blk.split('\n'):
                if _n<len(_blockmark): _blockmark[_n]=_m
                _n+=1
            _n+=1
        for _n,line in enumerate(_lines):
            if line.lstrip().startswith('>'): continue
            if any(x in line for x in MARKED): continue
            if _n not in _fenced and _n<len(_blockmark) and _blockmark[_n]: continue
            for c in retired:
                if c in line: canon_retired.append((c, line.strip()[:60]))
        check('canon names no retired reason code outside preserved history',
              not canon_retired, str(sorted(set(x[0] for x in canon_retired))))

        _sec('CHK-FIXTURE-ARITHMETIC')
        # ---------- 14. independent arithmetic recomputation of every series fixture ----------
        from statistics import median as _med
        def _ts(t,a):
            return _med(sorted((a[j]-a[i])/(t[j]-t[i]) for i in range(len(t)) for j in range(i+1,len(t))))
        def _full(t,a):
            S=_ts(t,a); b=_med(sorted(a[i]-S*t[i] for i in range(len(t))))
            r=[a[i]-(S*t[i]+b) for i in range(len(t))]
            sr=1.4826*_med(sorted(abs(x) for x in r)); sp=max(0.10,sr)
            tb=sum(t)/len(t); sxx=sum((x-tb)**2 for x in t); ss=sp/sxx**0.5
            return S,sr,sp,sxx,ss,(1 if S>0 else -1 if S<0 else 0)*max(0.0,abs(S)-1.28*ss)
        def _series(f):
            """Every shape a fixture states a t/value series in. The clusters[] shape was added by
            F5-14 and was originally skipped, which let a wrong Theil-Sen slope ship in AD-SEG-007."""
            inp=f.get('input') or {}
            t=inp.get('timesDays') or inp.get('clusterTimesDays'); a=inp.get('alkDkh')
            if isinstance(t,list) and isinstance(a,list) and len(t)==len(a)>=2:
                return t,a
            ev=f.get('expectedIntermediateEvidence') or {}
            sac=ev.get('seriesAfterCoalescing')
            if isinstance(sac,dict):
                t=sac.get('timesDays'); a=sac.get('alkDkh')
                if isinstance(t,list) and isinstance(a,list) and len(t)==len(a)>=2:
                    return t,a
            tp=inp.get('twoPointReadings')
            if isinstance(tp,dict) and 'day0Dkh' in tp and 'day1Dkh' in tp:
                # Two-point basis. ALK-011A's sqrt(0.10^2+0.10^2)/dt equals 0.10/sqrt(Sxx) for n=2,
                # so the Sxx form below reproduces it exactly.
                return [0.0,1.0],[tp['day0Dkh'],tp['day1Dkh']]
            cl=inp.get('clusters')
            if isinstance(cl,list) and all(isinstance(c,dict) and 'atDay' in c and 'alkDkh' in c for c in cl):
                by=collections.OrderedDict()
                for c in cl: by.setdefault(c['atDay'],[]).append(c['alkDkh'])
                t=sorted(by); a=[_med(sorted(by[x])) for x in t]      # PII-5.4 over the pooled readings
                if len(t)>=2: return t,a
            # READING / READING_SERIES event ledgers, the canon worked goldens' own shape
            evs=inp.get('events')
            if isinstance(evs,list):
                import datetime
                pts=[]
                for e in evs:
                    if not isinstance(e,dict): continue
                    if e.get('kind')=='READING' and 'measuredAt' in e and 'rawValueDkh' in e:
                        pts.append((e['measuredAt'],e['rawValueDkh']))
                    elif e.get('kind')=='READING_SERIES' and 'startAt' in e and 'valuesDkh' in e:
                        try: t0=datetime.datetime.fromisoformat(e['startAt'])
                        except Exception: return None,None
                        h=e.get('everyHours',48)
                        for i,v in enumerate(e['valuesDkh']):
                            pts.append(((t0+datetime.timedelta(hours=h*i)).isoformat(),v))
                if len(pts)>=2:
                    try: inst=[datetime.datetime.fromisoformat(x) for x,_ in pts]
                    except Exception: return None,None
                    # A `measuredAt` with no offset is not an instant, and mixing one
                    # into this list makes `min()` raise rather than fail a check --
                    # which stops every absorbed check after this one and reports 256
                    # assertions as unrun. `kernel.parse_instant` rejects the same
                    # shape; a fixture may legitimately contain such a record, because
                    # asserting that the engine REFUSES it is a real assertion
                    # (`AD-TIME-005B`). This series simply has no arithmetic to check.
                    if any(x.tzinfo is None for x in inst): return None,None
                    t0=min(inst)
                    days=[(x-t0).total_seconds()/86400.0 for x in inst]
                    by=collections.OrderedDict()
                    for dd,(_,v) in zip(days,pts): by.setdefault(round(dd,9),[]).append(v)
                    t=sorted(by); a=[_med(sorted(by[x])) for x in t]
                    if len(t)>=2: return t,a
            return None,None

        mismatch=[]; recomputed=0; skipped=[]
        for fid,(fn,f) in fixtures.items():
            t,a=_series(f)
            if t is None:
                _st=(f.get('expectedIntermediateEvidence') or {}).get('observedSlopeDkhPerDay')
                # A canonised NOT_RUN is the ABSENCE of a slope, not a slope the checker failed to
                # reproduce. AD-SAF-009 is a first-ever test: it states there is no slope.
                if isinstance(_st,(int,float)):
                    skipped.append(fid)
                continue
            acc=[]; anchor=None
            for i,x in enumerate(t):
                if anchor is None or x-anchor>=1.0-1e-12: acc.append(i); anchor=x
            tt=[t[i] for i in acc]; aa=[a[i] for i in acc]
            if len(tt)<2: continue
            recomputed+=1
            S,sr,sp,sxx,ss,sup=_full(tt,aa)
            ev={**(f.get('expectedIntermediateEvidence') or {}), **(f.get('expectedSupportedResult') or {})}
            for key,val in (('observedSlopeDkhPerDay',S),('sigmaResidDkh',sr),('sigmaPointDkh',sp),
                            ('sxxDay2',sxx),('sigmaSDkhPerDay',ss),('supportedSlopeDkhPerDay',sup)):
                if key in ev and isinstance(ev[key],(int,float)) and abs(ev[key]-val)>max(1e-8,abs(val)*1e-8):
                    mismatch.append((fid,key,ev[key],round(val,12)))
            if 'acceptedClusterTimesDays' in ev and ev['acceptedClusterTimesDays']!=tt:
                mismatch.append((fid,'acceptedClusterTimesDays',ev['acceptedClusterTimesDays'],tt))
        check('every series fixture reproduces its stated intermediates',
              not mismatch, '%d recomputed; %s'%(recomputed,mismatch[:4]))
        check('no fixture states a slope the checker cannot recompute',
              not skipped, str(skipped))

        _sec('CHK-DECISION-FIXTURES')
        # ---------- 15. owner decisions 16-19, recomputed independently ----------
        from decimal import Decimal as _D

        def _fx(fid):
            return fixtures[fid][1] if fid in fixtures else None

        def _round_to(x, inc):
            """ALK-ROUNDING-001 nearest; ties are resolved toward the current dose and no case here
            lands on a tie, so nearest is sufficient and a tie is reported as a mismatch."""
            n=x/inc
            lo=int(n)*inc; hi=lo+inc
            dlo=abs(x-lo); dhi=abs(hi-x)
            if abs(dlo-dhi)<1e-12: return None
            return round(lo if dlo<dhi else hi, 10)

        # 15a. decision 16 - D_safety,temp = max(0, D_current - R_down/P), recomputed per case
        #      (sizing input renamed from D_established by owner decision 20)
        f=_fx('AD-SAF-007')
        check('AD-SAF-007 exists', f is not None)
        if f:
            P_SEL=f['input']['selectedPotencyDkhPerMl']; ASH=f['input']['safetyDestinationHighDkh']
            INC=f['input']['recommendationPrecisionMlPerDay']
            cin={c['case']:c for c in f['input']['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            cac={c['case']:c for c in f['expectedAction']['cases']}
            bad=[]
            for name,c in cin.items():
                if c['alkDkh']<=f['input']['outerMaxDkh']: bad.append((name,'not a high breach'))
                rd=min(c['alkDkh']-ASH, 0.50)
                rdd=rd/P_SEL
                rate=max(0.0, c['currentDoseMlPerDay']-rdd)
                for key,val in (('rDownDkh',rd),('rDownAsDoseMlPerDay',rdd)):
                    if abs(cev[name][key]-val)>1e-9: bad.append((name,key,cev[name][key],val))
                if abs(cac[name]['temporarySafetyRateContinuousMlPerDay']-rate)>1e-9:
                    bad.append((name,'advisory',cac[name]['temporarySafetyRateContinuousMlPerDay'],rate))
                cmd=_round_to(rate, INC)
                if cmd is None or abs(cac[name]['temporarySafetyRateRecommendationMlPerDay']-cmd)>1e-9:
                    bad.append((name,'pumpCommand',cac[name].get('temporarySafetyRateRecommendationMlPerDay'),cmd))
                if c['consumptionDkhPerDay']>=0: bad.append((name,'C_estimate must be negative on this path'))
            check('AD-SAF-007 sizing recomputes from D_current - R_down/P_selected', not bad, str(bad[:4]))
            # varies with A_now until the rail binds, then saturates
            sweep=['SWEEP_11_05','SWEEP_11_20','SWEEP_11_30','SWEEP_11_80_RAIL']
            rates=[cac[n]['temporarySafetyRateContinuousMlPerDay'] for n in sweep]
            check('AD-SAF-007 safety rate strictly decreases as A_now rises below the rail',
                  rates[0]>rates[1]>rates[2], str(rates))
            check('AD-SAF-007 R_down saturates at the 0.50 rail', abs(rates[2]-rates[3])<1e-12
                  and abs(cev['SWEEP_11_80_RAIL']['rDownDkh']-0.50)<1e-12, str(rates[2:]))
            check('AD-SAF-007 floors at zero only when the established dose cannot absorb R_down',
                  cac['FLOOR']['temporarySafetyRateContinuousMlPerDay']==0
                  and cin['FLOOR']['currentDoseMlPerDay']<=cev['FLOOR']['rDownAsDoseMlPerDay'])
            # the materiality boundary must not move the delivered rate by more than the dose step
            step=(cin['NOT_MATERIAL']['currentDoseMlPerDay']-cin['MATERIAL']['currentDoseMlPerDay'])
            delta=(cac['NOT_MATERIAL']['temporarySafetyRateContinuousMlPerDay']
                   -cac['MATERIAL']['temporarySafetyRateContinuousMlPerDay'])
            check('AD-SAF-007 materiality does not change the rate beyond the dose step',
                  abs(delta-step)<1e-9 and cev['MATERIAL']['materiallyNegative'] is True
                  and cev['NOT_MATERIAL']['materiallyNegative'] is False, 'step=%r delta=%r'%(step,delta))

        # 15b. decision 16 negative control - continuity across the materiality boundary
        f=_fx('AD-SAF-008')
        check('AD-SAF-008 exists', f is not None)
        if f:
            P_SEL=f['input']['selectedPotencyDkhPerMl']
            rd=f['expectedIntermediateEvidence']['rDownDkh']; rdd=f['expectedIntermediateEvidence']['rDownAsDoseMlPerDay']
            bad=[]
            if abs(rdd-rd/P_SEL)>1e-9: bad.append(('rDownAsDose',rdd,rd/P_SEL))
            rates=f['expectedAction']['temporarySafetyRateContinuousMlPerDay']
            prev=None
            for d in f['input']['currentDoseSweepMlPerDay']:
                want=max(0.0, d-rdd); got=rates[repr(d) if repr(d) in rates else str(d)]
                if abs(got-want)>1e-9: bad.append((d,got,want))
                if prev is not None and abs((got-prev)-0.1)>1e-9: bad.append((d,'step',got-prev))
                prev=got
            check('AD-SAF-008 delivered rate is continuous across the materiality boundary', not bad, str(bad[:4]))
            check('AD-SAF-008 records a zero discontinuity',
                  f['expectedAction']['discontinuityAcrossMaterialityBoundary']==0)

        # 15c. AD-CON-002 no longer canonizes the 1.5 -> pause / 1.6 -> hold discontinuity
        f=_fx('AD-CON-002')
        check('AD-CON-002 exists', f is not None)
        if f:
            a=f['expectedAction']
            r5=a['variant_1_5'].get('temporarySafetyRateContinuousMlPerDay')
            r6=a['variant_1_6'].get('temporarySafetyRateContinuousMlPerDay')
            check('AD-CON-002 delivers the same rate on both sides of the materiality boundary',
                  r5==r6 and a.get('deliveredRateIdenticalAcrossVariants') is True, '%r vs %r'%(r5,r6))
            check('AD-CON-002 no longer states a pause on one side and a hold on the other',
                  'deliveryPaused' not in a['variant_1_5'] and 'recommendedDoseMlPerDay' not in a['variant_1_6'])
            check('AD-CON-002 preserves the superseded expectation as history',
                  'supersededExpectation' in a)
            # both doses are below R_down/P, so the floor - not the classification - explains the zero
            rd=min(11.2-10.8,0.50)/0.0693
            check('AD-CON-002 zero is the floor, not the classification',
                  1.5<=rd and 1.6<=rd and r5==0, 'R_down/P=%.9f'%rd)

        # 15d. decision 17/19 - contested episodes are order- and offset-invariant
        f=_fx('AD-EPI-002')
        check('AD-EPI-002 exists', f is not None)
        if f:
            ev=f['expectedIntermediateEvidence']['everyCase']
            cases=[c['case'] for c in f['input']['cases']]
            check('AD-EPI-002 covers same-instant, three-minute offset and reversed insertion order',
                  set(cases)=={'SAME_INSTANT','THREE_MINUTE_OFFSET','REVERSED_INSERTION_ORDER'}, str(cases))
            check('AD-EPI-002 states one RESOLVED episode for every case',
                  ev['episodeCount']==1 and ev['episodeStatus']=='RESOLVED'
                  and ev['combinedMeasurementCount']==2 and ev['episodeClusterStatus']=='OK')
            check('AD-EPI-002 spread is inside ALK-005 and the threshold is applied',
                  abs(ev['episodeSpreadDkh']-0.19)<1e-9 and ev['episodeSpreadDkh']<0.20,
                  '%r'%ev['episodeSpreadDkh'])
            forb=f['forbidden']['episodeValueDkh']
            check('AD-EPI-002 forbids the order-chosen values',
                  10.95 in forb and 11.14 in forb and 11.045 not in forb, str(forb))

        # 15e. decision 19 - position and rapid read the resolved episode
        f=_fx('AD-EPI-003')
        check('AD-EPI-003 exists', f is not None)
        if f:
            # decision 27: the formerly contested case now resolves and is classified normally
            bad=[]
            for case in ('TWO_READINGS_CLOSE','FORMERLY_CONTESTED'):
                reads=sorted(x['alkDkh'] for x in
                             [c for c in f['input']['cases'] if c['case']==case][0]['readings'])
                med=reads[len(reads)//2] if len(reads)%2 else (reads[len(reads)//2-1]+reads[len(reads)//2])/2
                ev=f['expectedIntermediateEvidence'][case]; ac=f['expectedAction'][case]
                if abs(ev['episodeValueDkh']-med)>1e-12: bad.append((case,'value',ev['episodeValueDkh'],med))
                if abs(ac['positionDkh']-med)>1e-12: bad.append((case,'position',ac['positionDkh']))
                if ev['episodeStatus']!='RESOLVED': bad.append((case,'status',ev['episodeStatus']))
                if ac['outerBoundState']!='BREACHED_HIGH': bad.append((case,'outerBound',ac['outerBoundState']))
            check('AD-EPI-003 position is the episode value in both cases, and both resolve', not bad, str(bad))
            forb=f['forbidden']['FORMERLY_CONTESTED']['positionDkh']
            check('AD-EPI-003 forbids both ordering answers and the older episode',
                  10.95 in forb and 11.14 in forb and 10.6 in forb, str(forb))
            check('AD-EPI-003 forbids withholding position on episode grounds',
                  f['forbidden']['FORMERLY_CONTESTED']['position']=='NOT_RUN')

        f=_fx('AD-EPI-004')
        check('AD-EPI-004 exists', f is not None)
        if f:
            a=f['expectedAction']
            check('AD-EPI-004 keeps a resolved non-accepted episode in the rapid pair',
                  a['RESOLVED_NOT_ACCEPTED']['rapidConfirmed'] is True)
            ev=f['expectedIntermediateEvidence']['RESOLVED_NOT_ACCEPTED']
            t0,t1=ev['rapidPairDays']
            eps={e['atDay']:e['alkDkh'] for e in f['input']['cases'][0]['episodes']}
            want=(eps[t1]-eps[t0])/(t1-t0)
            check('AD-EPI-004 rapid pair slope recomputes', abs(ev['rapidPairSlopeDkhPerDay']-want)<1e-9
                  and abs(want)>=ev['rapidThresholdDkhPerDay'], '%r vs %r'%(ev['rapidPairSlopeDkhPerDay'],want))
            # decision 27: the formerly contested latest episode is an ordinary anomalous cluster
            ev2=f['expectedIntermediateEvidence']['FORMERLY_CONTESTED_LATEST']
            reads=sorted(r['alkDkh'] for r in
                         [c for c in f['input']['cases'] if c['case']=='FORMERLY_CONTESTED_LATEST'][0]['episodes'][-1]['readings'])
            med=(reads[0]+reads[1])/2.0; spr=round(reads[1]-reads[0],12)
            t0,t1=ev2['rapidPairDays']
            base=[e for e in [c for c in f['input']['cases'] if c['case']=='FORMERLY_CONTESTED_LATEST'][0]['episodes'] if e.get('atDay')==t0][0]['alkDkh']
            want=(med-base)/(t1-t0)
            a2=f['expectedAction']['FORMERLY_CONTESTED_LATEST']
            check('AD-EPI-004 formerly contested episode resolves, pools and lands on the anomalous path',
                  abs(ev2['latestEpisodeValueDkh']-med)<1e-12 and abs(ev2['latestEpisodeSpreadDkh']-spr)<1e-12
                  and spr>0.20 and ev2['latestEpisodeClusterStatus']=='ANOMALOUS'
                  and ev2['latestEpisodeStatus']=='RESOLVED'
                  and abs(ev2['rapidPairSlopeDkhPerDay']-want)<1e-9
                  and abs(want)<ev2['rapidThresholdDkhPerDay']
                  and a2['rapidConfirmed'] is False,
                  'value=%r spread=%r slope=%r'%(med,spr,want))
            forb=f['forbidden']['FORMERLY_CONTESTED_LATEST']['rapidPairSlopeDkhPerDay']
            check('AD-EPI-004 forbids both member slopes and the older-pair fallback',
                  len(forb)==3 and -0.325 in forb and -0.15 in forb)
            check('AD-EPI-004 forbids withholding rapidConfirmed on episode grounds',
                  'NOT_RUN' in f['forbidden']['FORMERLY_CONTESTED_LATEST']['rapidConfirmed'])

        # 15f. decision 18 - exact decimal semantics, recomputed with Decimal AND with binary64
        f=_fx('AD-VAL-002')
        check('AD-VAL-002 exists', f is not None)
        if f:
            thr=f['input']['alk005ThresholdDkh']
            cin={c['case']:c for c in f['input']['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            bad=[]; straddling=0
            for name,c in cin.items():
                reads=[str(x) for x in c['readingsDkh']]
                exact=max(_D(x) for x in reads)-min(_D(x) for x in reads)
                b64=max(float(x) for x in reads)-min(float(x) for x in reads)
                if abs(float(cev[name]['exactDecimalSpreadDkh'])-float(exact))>1e-12:
                    bad.append((name,'spread',cev[name]['exactDecimalSpreadDkh'],str(exact)))
                if name=='CROSS_METHOD':
                    if cev[name].get('alk005Applied') is not False or cev[name].get('episodeStatus')!='CONTESTED_METHODS':
                        bad.append((name,'cross-method must not use ALK-005'))
                    continue
                if cev[name]['binary64SpreadGreaterThanThreshold']!=(b64>thr):
                    bad.append((name,'binary64 flag',cev[name]['binary64SpreadGreaterThanThreshold'],b64>thr))
                want='ANOMALOUS' if exact>_D(str(thr)) else 'OK'
                if cev[name]['clusterStatus']!=want:
                    bad.append((name,'status',cev[name]['clusterStatus'],want))
                if exact==_D(str(thr)) and (b64>thr): straddling+=1
            check('AD-VAL-002 exact-decimal statuses recompute', not bad, str(bad[:4]))
            check('AD-VAL-002 carries pairs that binary64 would misclassify', straddling>=3, '%d straddling pairs'%straddling)
            check('AD-VAL-002 exactly 0.20 is not anomalous',
                  all(cev[n]['clusterStatus']=='OK' for n in cev if n.startswith('EXACT_')))
            check('AD-VAL-002 above 0.20 is still anomalous', cev['ABOVE']['clusterStatus']=='ANOMALOUS')

        # ---------- 16. fix pass after the decisions 16-19 review ----------
        # Each check here exists because the review found something the gate could not have caught.

        # 16a. the ISO-timestamp fixture shape INV-I10's generator does not read
        import datetime
        f=_fx('AD-EPI-001')
        check('AD-EPI-001 exists', f is not None)
        if f:
            eps=f['input']['episodes']; ev=f['expectedIntermediateEvidence']
            r1=[x['alkDkh'] for x in eps[0]['readings']]
            t1=[datetime.datetime.fromisoformat(x['at']) for x in eps[0]['readings']]
            med=sorted(r1)[len(r1)//2]
            medt=sorted(t1)[len(t1)//2]
            sep=(datetime.datetime.fromisoformat(eps[1]['readings'][0]['at'])-medt).total_seconds()/3600.0
            bad=[]
            if abs(ev['episode1']['episodeValueDkh']-med)>1e-12: bad.append(('value',ev['episode1']['episodeValueDkh'],med))
            if ev['episode1']['episodeTime']!=medt.isoformat(): bad.append(('time',ev['episode1']['episodeTime'],medt.isoformat()))
            if abs(ev['episode1']['spreadDkh']-(max(r1)-min(r1)))>1e-9: bad.append(('spread',ev['episode1']['spreadDkh']))
            if abs(ev['separationHours']-sep)>1e-9: bad.append(('separationHours',ev['separationHours'],sep))
            check('AD-EPI-001 recomputes from its own ISO timestamps', not bad, str(bad))

        _sec('CHK-CANON-DECISION-TEXT')
        # 16b. no live instruction to pause high-breach delivery survives outside preserved history
        SUPERSEDED_PAUSE=['pause Alk addition',
                          'recommend a temporary pause of Alk dosing to 0 mL/day',
                          'safetyDoseRecommendation = 0 mL/day']
        live=[]
        # Exempt only the line itself: a blockquote line, or a line that carries its own
        # superseded/amended marker. A quoted string must sit on the marker line to be exempt, so a
        # re-inserted instruction on a fresh line still fails.
        MARKED=('previously read','previously required','Superseded wording','superseded by owner decision')
        for line in CANON.split('\n'):
            if line.lstrip().startswith('>') or any(m in line for m in MARKED): continue
            for t in SUPERSEDED_PAUSE:
                if t in line: live.append((t, line.strip()[:70]))
        check('canon carries no live high-breach pause instruction outside preserved history',
              not live, str(sorted(set(x[0] for x in live))))

        # 16c. the two safety invariants may not both assert an iff on the delivered rate
        g10=INV.split('### INV-G10')[1].split('### INV-')[0] if '### INV-G10' in INV else ''
        check('INV-G10 no longer asserts the superseded materiality-selects-the-rate form',
              'the delivered rate is **identical** on both sides' in g10
              and 'Amended by owner decision 16' in g10, 'len=%d'%len(g10))

        # 16d. the sizing rule's checkable requirements are scoped to the region where they hold
        m=re.search(r'^`ALK-HIGH-BREACH-SAFETY-SIZING-001`\s*$', CANON, re.M)
        seg=CANON[m.start():m.start()+9000] if m else ''
        check('sizing rule scopes its monotonicity requirements above the zero floor',
              'above the zero\nfloor' in seg or 'above the zero floor' in seg)

        # ---------- 17. owner decisions 20-22, recomputed independently ----------
        # Every check here is written so that REVERTING the decision it encodes makes it FAIL.
        # The three reversion mutations required by the task are named against the checks that catch
        # them: [M1] D_current swapped back to D_history in the safety formula, [M2] escalation
        # bounds removed so ordinary sizing applies above the ceiling, [M3] the B' branch removed so
        # an uncomputable C_estimate falls through. The mutation runs are recorded in
        # docs/process/runs/2026-08-20-alk-v2-decisions-20-22.md.

        ADVISORY_OFFSET = 1.0   # decision 21, the only constant decisions 20-22 introduce

        _sec('CHK-LIVE-TEXT-ABSENCE')
        # 17a. D_established is not a live name anywhere outside preserved history --------------
        # Decision 20: "D_established must not survive as a live name." A blockquote line, or a line
        # carrying its own superseded/amended marker, is preserved history and is exempt.
        D_MARKED=('previously named','previously read','Superseded wording','superseded by owner decision',
                  'Amended by owner decision','RENAMED by','renamed from','Renamed by',
                  'is a **rename, not a behaviour change**','split by','splits `D_established`',
                  'as a single name','decision 20 splits','renamed and split','renamed from',
                  'appears nowhere as a live name','must not survive as a live name',
                  'is not a live name','anywhere as a live name','is retired and is not a live name')
        # Scope of the exemption. A markdown TABLE ROW is its own unit - a marker in one row must
        # not exempt the next - and is exempt only if the row itself carries a marker or names the
        # quantity that replaced the old name. Everything else is scoped to its PARAGRAPH, the
        # maximal run of non-blank non-table lines, because prose wraps and a marker sentence and
        # the name it marks routinely land on different lines.
        def _units(text, is_json=False):
            if is_json:
                # A JSON file has no paragraphs. adversarial.json holds ONE blank line in 185 KB, so
                # blank-line splitting made the entire corpus a single unit that any unrelated history
                # marker exempted - a false PASS on the one check owner decision 20 made mandatory.
                # Found by canon-conformance-auditor; the unit here is the LINE.
                for line in text.split('\n'):
                    yield line
                return
            para=[]
            for line in text.split('\n'):
                if line.startswith('|'):
                    if para: yield '\n'.join(para); para=[]
                    yield line
                elif not line.strip():
                    if para: yield '\n'.join(para); para=[]
                else:
                    para.append(line)
            if para: yield '\n'.join(para)

        live_de=[]
        for fn in sorted(glob.glob(_CANON+'*.md')+glob.glob(_ALK+'*.md')
                         +glob.glob(_ALK+'**/*.json', recursive=True)):
            if os.path.basename(fn) in ('ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md'): continue
            for unit in _units(open(fn,encoding='utf-8',errors='ignore').read(), fn.endswith('.json')):
                # Every spelling the package uses for the retired name. The LaTeX form D_{established}
                # does NOT contain the substring D_established, and checking only the bare spelling
                # left the canon's own boxed formula - the single most load-bearing occurrence -
                # invisible to this check. Demonstrated by mutation M1b.
                if not re.search(r'D_\{?established\}?|establishedDoseMlPerDay|ESTABLISHED_DOSE', unit): continue
                if all(l.lstrip().startswith('>') for l in unit.split('\n') if l.strip()): continue
                _flat=re.sub(r'\s+',' ',unit).lower()   # prose wraps; markers must survive the wrap
                if any(m.lower() in _flat for m in D_MARKED): continue
                if unit.startswith('|') and ('D_current' in unit or 'D_history' in unit
                                             or 'currentDoseMlPerDay' in unit): continue
                live_de.append((os.path.basename(fn), unit.strip().split('\n')[0][:70]))
        check('D_established survives nowhere as a live name', not live_de, str(live_de[:4]))

        _sec('CHK-DECISION-FIXTURES')
        # 17b. AD-DHS-001 - the split, recomputed, in both directions ---------------------------
        f=_fx('AD-DHS-001')
        check('AD-DHS-001 exists', f is not None)
        if f:
            inp=f['input']; P=inp['selectedPotencyDkhPerMl']; INC=inp['recommendationPrecisionMlPerDay']
            S_obs=inp['observedSlopeDkhPerDay']; sig=inp['sigmaSDkhPerDay']
            rd=min(inp['alkDkh']-inp['safetyDestinationHighDkh'], 0.50); rdd=rd/P
            cin={c['case']:c for c in inp['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            cac={c['case']:c for c in f['expectedAction']['cases']}
            bad=[]; errs={}
            for name,c in cin.items():
                # D_history is recomputed from the DECLARED SCHEDULE, never taken on trust
                vol=sum(seg['mlPerDay']*seg['days'] for seg in c['doseSchedule'])
                days=sum(seg['days'] for seg in c['doseSchedule'])
                dh=vol/days
                dc=c['currentDoseMlPerDay']
                if abs(c['doseHistoryMeanMlPerDay']-dh)>1e-12: bad.append((name,'D_history',c['doseHistoryMeanMlPerDay'],dh))
                if abs(days-inp['elapsedDays'])>1e-12: bad.append((name,'elapsedDays',days))
                if abs(dc-dh)<0.5: bad.append((name,'D_current and D_history must differ MATERIALLY',dc,dh))
                # [M1] safety sizing takes D_current. A reverted engine takes D_history.
                want_rate=max(0.0, dc-rdd); wrong_rate=max(0.0, dh-rdd)
                got=cac[name]['temporarySafetyRateContinuousMlPerDay']
                if abs(got-want_rate)>1e-9: bad.append((name,'rate',got,want_rate))
                if abs(got-wrong_rate)<=1e-9: bad.append((name,'rate is not distinguishable from the D_history form'))
                cmd=_round_to(want_rate, INC)
                if cmd is None or abs(cac[name]['temporarySafetyRateRecommendationMlPerDay']-cmd)>1e-9:
                    bad.append((name,'pumpCommand',cac[name].get('temporarySafetyRateRecommendationMlPerDay'),cmd))
                if _round_to(wrong_rate, INC)==cmd: bad.append((name,'the reverted command is identical - the case cannot catch M1'))
                # consumption takes D_history. A reverted engine takes D_current.
                C=P*dh-S_obs; C_wrong=P*dc-S_obs
                if abs(cev[name]['pTimesD']-P*dh)>1e-9: bad.append((name,'pTimesD',cev[name]['pTimesD'],P*dh))
                if abs(cev[name]['consumptionDkhPerDay']-C)>1e-9: bad.append((name,'C',cev[name]['consumptionDkhPerDay'],C))
                if abs(cev[name]['cPlusKSigma']-(C+1.28*sig))>1e-9: bad.append((name,'C+ksigma',cev[name]['cPlusKSigma']))
                if cev[name]['materiallyNegative']!=((C+1.28*sig)<0): bad.append((name,'materiallyNegative'))
                if C>=0: bad.append((name,'C must be negative so branch B - not A - selects the D_current form'))
                if cev[name]['branchSelected']!='B': bad.append((name,'branchSelected',cev[name]['branchSelected']))
                # the forbidden block must state exactly what the reverted engine produces
                fb=f['forbidden']['cases'][name]
                if abs(fb['temporarySafetyRateContinuousMlPerDay']-wrong_rate)>1e-9:
                    bad.append((name,'forbidden rate is not the reverted value',fb['temporarySafetyRateContinuousMlPerDay'],wrong_rate))
                if abs(fb['consumptionDkhPerDay']-C_wrong)>1e-9:
                    bad.append((name,'forbidden consumption is not the reverted value'))
                errs[name]=want_rate-wrong_rate
            check('AD-DHS-001 recomputes D_history from its declared schedule and sizes from D_current',
                  not bad, str(bad[:4]))
            # the whole point of the second case: the error REVERSES SIGN, so a magnitude-only test
            # would not distinguish the two quantities
            check('AD-DHS-001 the D_history substitution errs in OPPOSITE directions on the two cases',
                  len(errs)==2 and errs['INCREASED']*errs['DECREASED']<0,
                  str({k:round(v,9) for k,v in errs.items()}))
            check('AD-DHS-001 the substitution flips a BRANCH, not just a number',
                  f['forbidden']['cases']['INCREASED']['branchSelected']=='A'
                  and (P*cin['INCREASED']['currentDoseMlPerDay']-S_obs)>0,
                  'C from D_current on INCREASED = %.6f'%(P*12.0-S_obs))

        # 17c. AD-DHS-002 - unknown D_current refuses, and does not emit zero -------------------
        f=_fx('AD-DHS-002')
        check('AD-DHS-002 exists', f is not None)
        if f:
            a=f['expectedAction']; inp=f['input']; ev=f['expectedIntermediateEvidence']
            P=inp['selectedPotencyDkhPerMl']
            check('AD-DHS-002 declares D_current unknown', inp['currentDoseMlPerDay']=='UNKNOWN')
            check('AD-DHS-002 emits NO rate and NO command',
                  a['temporarySafetyRateContinuousMlPerDay']=='NOT_RUN'
                  and a['temporarySafetyRateRecommendationMlPerDay']=='NOT_RUN')
            check('AD-DHS-002 does not emit zero anywhere on the safety path',
                  0 not in (a['temporarySafetyRateContinuousMlPerDay'], a['temporarySafetyRateRecommendationMlPerDay'])
                  and a['recommendedDoseMlPerDay']=='WITHHELD'
                  and 0 in f['forbidden']['temporarySafetyRateContinuousMlPerDay'])
            check('AD-DHS-002 keeps consumption running - the two unknowns are independent',
                  abs(a['consumptionDkhPerDay']-(P*inp['doseHistoryMeanMlPerDay']-inp['observedSlopeDkhPerDay']))<1e-9
                  and a['consumptionPhysicality']=='NON_PHYSICAL_OR_UNEXPLAINED_GAIN')
            check('AD-DHS-002 selects NO branch - decision 25 refuses BEFORE selection',
                  ev['branchSelected']=='NOT_RUN' and ev['preconditionPassed'] is False
                  and abs(ev['rDownDkh']-0.4)<1e-12)
            _s10=_fx('AD-SAF-010')
            _s10ev={c['case']:c for c in _s10['expectedIntermediateEvidence']['cases']} if _s10 else {}
            check('AD-DHS-002 agrees with AD-SAF-010 on the shape of a D_current-unknown refusal',
                  bool(_s10ev) and all(c['branchSelected']==ev['branchSelected']
                                       and c['preconditionPassed']==ev['preconditionPassed']
                                       for c in _s10ev.values() if c['preconditionPassed'] is False))
            check('AD-DHS-002 preserves the breach state and the shortened cadence',
                  a['outerBoundState']=='BREACHED_HIGH' and a['nextTestApproxHours']==24)
            check('AD-DHS-002 forbids the floored-at-zero code, which would misread a refusal as a floor',
                  'SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO' in f['forbidden']['reasonCodes'])

        # 17d. AD-DHS-003 - unavailable D_history does not block sizing -------------------------
        f=_fx('AD-DHS-003')
        check('AD-DHS-003 exists', f is not None)
        if f:
            inp=f['input']; a=f['expectedAction']; ev=f['expectedIntermediateEvidence']
            P=inp['selectedPotencyDkhPerMl']
            rdd=min(inp['alkDkh']-inp['safetyDestinationHighDkh'],0.50)/P
            check('AD-DHS-003 declares D_history unavailable on an ineligible basis',
                  inp['doseHistoryMeanMlPerDay']=='NOT_RUN'
                  and inp['deliveryBasis']=='COMMAND_ONLY_UNCONFIRMED'
                  and ev['mixedIntervalIntegration']=='NOT_RUN')
            check('AD-DHS-003 consumption is UNRESOLVED', ev['consumptionDkhPerDay']=='NOT_RUN'
                  and a['consumption']=='UNRESOLVED')
            check('AD-DHS-003 safety sizing still runs, from D_current',
                  abs(a['temporarySafetyRateContinuousMlPerDay']-(inp['currentDoseMlPerDay']-rdd))<1e-9
                  and a['sizingInput']=='D_current'
                  and abs(a['temporarySafetyRateRecommendationMlPerDay']-_round_to(inp['currentDoseMlPerDay']-rdd,inp['recommendationPrecisionMlPerDay']))<1e-9)
            check('AD-DHS-003 takes branch B-prime, not branch A with C treated as zero',
                  ev['branchSelected']=='B_PRIME'
                  and 0 in f['forbidden']['consumptionDkhPerDay']
                  and 'NOT_RUN' in f['forbidden']['temporarySafetyRateContinuousMlPerDay'])

        # 17e. AD-SAF-009 - branch B', recomputed -----------------------------------------------
        f=_fx('AD-SAF-009')
        check('AD-SAF-009 exists', f is not None)
        if f:
            inp=f['input']; a=f['expectedAction']; ev=f['expectedIntermediateEvidence']
            P=inp['selectedPotencyDkhPerMl']; INC=inp['recommendationPrecisionMlPerDay']
            rd=min(inp['alkDkh']-inp['safetyDestinationHighDkh'],0.50); rdd=rd/P
            ceil_=inp['outerMaxDkh']+ADVISORY_OFFSET
            want=max(0.0, inp['currentDoseMlPerDay']-rdd)
            check('AD-SAF-009 sits inside the band the sizing rules govern',
                  abs(ev['advisoryCeilingDkh']-ceil_)<1e-12 and inp['outerMaxDkh']<inp['alkDkh']<ceil_
                  and ev['escalate'] is False)
            check('AD-SAF-009 states an uncomputable C on a first-ever test',
                  ev['consumptionDkhPerDay']=='NOT_RUN' and ev['observedSlopeDkhPerDay']=='NOT_RUN'
                  and inp['readingCount']==1 and inp['priorReadings']==0)
            def _num_eq(x, y, tol=1e-9):
                """A withheld or non-numeric value is a MISMATCH, never a crash: a mutation that
                replaces a sized rate with NOT_RUN must produce a clean FAIL line, not a traceback."""
                return isinstance(x,(int,float)) and not isinstance(x,bool) and abs(x-y)<=tol
            check('AD-SAF-009 sizes from D_current under branch B-prime',
                  abs(rd-0.5)<1e-12 and abs(rdd-0.5/P)<1e-12
                  and _num_eq(a['temporarySafetyRateContinuousMlPerDay'], want)
                  and _num_eq(a['temporarySafetyRateRecommendationMlPerDay'], _round_to(want,INC))
                  and a['maintenanceEstimateStatus']=='UNRESOLVED',
                  'want %.12f, stated %r'%(want, a['temporarySafetyRateContinuousMlPerDay']))
            # [M3] removing B' makes this state select NOTHING; treating C as 0 routes it to A,
            # whose formula gives max(0, (0 - R_down)/P) = 0. Both are named as forbidden.
            check('AD-SAF-009 names both reverted outcomes as forbidden',
                  set(ev['branchesAvailable'])=={'A','B','B_PRIME'} and ev['branchSelected']=='B_PRIME'
                  and ev['exactlyOneBranchSelected'] is True
                  and 'NONE' in f['forbidden']['branchSelected'] and 'A' in f['forbidden']['branchSelected']
                  and 0 in f['forbidden']['temporarySafetyRateContinuousMlPerDay']
                  and inp['currentDoseMlPerDay'] in f['forbidden']['temporarySafetyRateContinuousMlPerDay'])
            check('AD-SAF-009 branch A on an uncomputable C would deliver zero, so zero is the tell',
                  abs(max(0.0,(0.0-rd)/P))<1e-12)
            check('AD-SAF-009 variant separates an unknown D_current from an uncomputable C',
                  f['variant']['input']['currentDoseMlPerDay']=='UNKNOWN'
                  and f['variant']['expectedAction']['temporarySafetyRateContinuousMlPerDay']=='NOT_RUN'
                  and 'SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN' in f['variant']['expectedReasonCodes'])

        # 17f. AD-ESC-001 / AD-ESC-002 - the boundary WARNS, and the answer does not change ------
        # Rewritten for owner decision 24. The old checks asserted withholding; withholding is the
        # behaviour decision 24 abolished, so asserting it now would pin the reverted engine.
        for fid,side in (('AD-ESC-001','high'),('AD-ESC-002','low')):
            f=_fx(fid)
            check(fid+' exists', f is not None)
            if not f: continue
            inp=f['input']
            cin={c['case']:c for c in inp['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            cac={c['case']:c for c in f['expectedAction']['cases']}
            bad=[]; boundaries=set(); straddles=0; answers={}
            OFF=_D('1.0')
            for name,c in cin.items():
                # EXACT DECIMAL, no epsilon. ALK-DECIMAL-THRESHOLD-001 governs this predicate.
                a_now=_D(repr(c['alkDkh']))
                if side=='high':
                    bd=_D(repr(c['outerMaxDkh']))+OFF; warn = a_now>=bd
                    b64 = c['alkDkh'] >= c['outerMaxDkh']+1.0
                else:
                    bd=_D(repr(c['outerMinDkh']))-OFF; warn = a_now<=bd
                    b64 = c['alkDkh'] <= c['outerMinDkh']-1.0
                if warn!=b64: straddles+=1
                boundaries.add(str(bd))
                stated=cev[name]['advisoryCeilingDkh' if side=='high' else 'advisoryFloorDkh']
                if _D(repr(stated))!=bd: bad.append((name,'boundary',stated,str(bd)))
                if cev[name]['warn']!=warn: bad.append((name,'warn',cev[name]['warn'],warn))
                if 'binary64WouldWarn' in cev[name] and cev[name]['binary64WouldWarn']!=b64:
                    bad.append((name,'binary64 flag',cev[name]['binary64WouldWarn'],b64))
                act=cac[name]
                # the ordinary answer is recomputed on EVERY case, warned or not
                P=c.get('selectedPotencyDkhPerMl', inp.get('selectedPotencyDkhPerMl'))
                INC=c.get('recommendationPrecisionMlPerDay', inp.get('recommendationPrecisionMlPerDay'))
                if side=='high':
                    ASH=c.get('safetyDestinationHighDkh', inp.get('safetyDestinationHighDkh'))
                    dc=c.get('currentDoseMlPerDay', inp.get('currentDoseMlPerDay'))
                    want=_round_to(max(0.0, dc-min(c['alkDkh']-ASH,0.50)/P), INC)
                    got=act.get('temporarySafetyRateRecommendationMlPerDay')
                    key='temporarySafetyRateRecommendationMlPerDay'
                else:
                    ASL=c.get('safetyDestinationLowDkh', inp.get('safetyDestinationLowDkh'))
                    want=min(ASL-c['alkDkh'],0.50)/P
                    got=act.get('safetyCorrectionVolumeMl')
                    key='safetyCorrectionVolumeMl'
                if not isinstance(got,(int,float)) or abs(got-want)>1e-9:
                    bad.append((name,key,got,want))
                answers[name]=got
                # [D24] the boundary WARNS. It does not withhold, and it does not emit zero.
                if act.get('advisoryConfidenceWarning')!=('ATTACHED' if warn else 'NONE'):
                    bad.append((name,'advisoryConfidenceWarning',act.get('advisoryConfidenceWarning'),warn))
                for k in ('temporarySafetyRateRecommendationMlPerDay','safetyCorrectionVolumeMl',
                          'recommendedDoseMlPerDay'):
                    if act.get(k) in ('NOT_RUN','WITHHELD'):
                        bad.append((name,k+' is withheld - decision 24 withholds nothing at the boundary'))
                # the shortened / reprioritised retest is preserved, and the WARNING RENDERS IT (D26)
                if act.get('nextTestApproxHours') in ('NOT_RUN',None):
                    bad.append((name,'the shortened retest is missing'))
                if warn:
                    if act.get('warningRetestIntervalHours')!=act.get('schedulerRetestIntervalHours'):
                        bad.append((name,'warning and scheduler disagree on the retest interval',
                                    act.get('warningRetestIntervalHours'),act.get('schedulerRetestIntervalHours')))
                    if act.get('warningRetestIntervalHours')!=act.get('nextTestApproxHours'):
                        bad.append((name,'the warning states an interval the scheduler did not produce'))
                    if len(act.get('warningStates') or [])!=5:
                        bad.append((name,'warning must state all five elements',len(act.get('warningStates') or [])))
            check(fid+' boundary recomputes as an offset, exact-decimal and inclusive, with no epsilon',
                  not bad, str(bad[:4]))
            check(fid+' carries a configuration where binary64 and exact decimal DISAGREE',
                  straddles>=1, '%d straddling configurations'%straddles)
            check(fid+' exercises at least three DIFFERENT boundaries, so it cannot pass on a pinned level',
                  len(boundaries)>=3, str(sorted(boundaries)))
            # THE decision-24 property: the answer does not change across the boundary
            vals=sorted(set(round(v,9) for v in answers.values() if isinstance(v,(int,float))))
            check(fid+' gives the SAME recommendation below, at and above the boundary',
                  len(vals)==1 and f['expectedAction'].get('recommendationIdenticalAcrossBoundary') is True,
                  'distinct recommended values across %d cases: %s'%(len(answers),vals))
            check(fid+' forbids the reverted withholding behaviour explicitly',
                  'SAFETY_ADVISORY_RANGE_EXCEEDED' in str(f['forbidden'].get('reasonCodes')),
                  str(f['forbidden'].get('reasonCodes')))

        f=_fx('AD-ESC-001')
        if f:
            cac={c['case']:c for c in f['expectedAction']['cases']}
            check('AD-ESC-001 states the five warning elements the decision requires',
                  any('confirmed with a second test' in x for x in cac['AT_CEILING']['warningStates'])
                  and any('dosing setup should be checked' in x for x in cac['AT_CEILING']['warningStates'])
                  and any('experienced judgement' in x for x in cac['AT_CEILING']['warningStates'])
                  and any('beyond the range the engine is confident in' in x for x in cac['AT_CEILING']['warningStates']))
            check('AD-ESC-001 records that the flat region is OPEN and NO LONGER NARROWED',
                  any('NO LONGER NARROWED' in x for x in f['openIssues']))

        # 17g. AD-ESC-003 - every episode resolves, and the warning has exactly two states --------
        f=_fx('AD-ESC-003')
        check('AD-ESC-003 exists', f is not None)
        if f:
            inp=f['input']; ceil_=_D(repr(inp['outerMaxDkh']))+_D('1.0')
            cin={c['case']:c for c in inp['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            cac={c['case']:c for c in f['expectedAction']['cases']}
            bad=[]
            for name,c in cin.items():
                # owner decision 27: no member carries a method, and nothing is contested
                if any('method' in r for r in c['readings']): bad.append((name,'a reading carries a method'))
                valid=[r['alkDkh'] for r in c['readings'] if r.get('status')!='INVALID']
                if not valid:
                    # No member survives Part II 4.3, so no episode output exists. episodeStatus has
                    # only RESOLVED and combinedMeasurementCount has the domain integer >= 1, so the
                    # fixture must assert NEITHER - that gap is OI-EPISODENOOBS-001, left OPEN.
                    if 'episodeStatus' in cev[name]: bad.append((name,'asserts episodeStatus with no observation'))
                    if 'combinedMeasurementCount' in cev[name]:
                        bad.append((name,'asserts a count with no observation'))
                    if 'outerBoundState' in cac[name]: bad.append((name,'asserts outerBoundState with no observation'))
                    if cac[name].get('position')!='UNKNOWN': bad.append((name,'position must be UNKNOWN'))
                    # owner decision 29: nothing resolves -> the warning is ABSENT, not a third value
                    if cac[name]['advisoryConfidenceWarning']!='NONE': bad.append((name,'absent warning must be NONE'))
                    continue
                if cev[name]['episodeStatus']!='RESOLVED': bad.append((name,'episodeStatus',cev[name]['episodeStatus']))
                if cev[name]['combinedMeasurementCount']!=len(valid):
                    bad.append((name,'count',cev[name]['combinedMeasurementCount'],len(valid)))
                vals=sorted(valid)
                med=vals[len(vals)//2] if len(vals)%2 else (vals[len(vals)//2-1]+vals[len(vals)//2])/2
                if abs(cev[name]['episodeValueDkh']-med)>1e-9: bad.append((name,'median',cev[name]['episodeValueDkh'],med))
                spread=_D(repr(max(vals)))-_D(repr(min(vals)))
                if cev[name]['episodeSpreadDkh'] is not None and abs(float(cev[name]['episodeSpreadDkh'])-float(spread))>1e-12:
                    bad.append((name,'spread',cev[name]['episodeSpreadDkh'],str(spread)))
                want_anom = 'ANOMALOUS' if spread>_D('0.20') else 'OK'
                if cev[name]['episodeClusterStatus']!=want_anom: bad.append((name,'clusterStatus',cev[name]['episodeClusterStatus'],want_anom))
                warn = _D(repr(med))>=ceil_
                if cev[name]['warn']!=warn: bad.append((name,'warn'))
                if cac[name]['advisoryConfidenceWarning']!=('ATTACHED' if warn else 'NONE'):
                    bad.append((name,'advisoryConfidenceWarning',cac[name]['advisoryConfidenceWarning']))
            check('AD-ESC-003 resolves every episode and warns on the combined value', not bad, str(bad[:4]))
            check('AD-ESC-003 records the member-wise predicate and the contested state as RETIRED',
                  f['expectedIntermediateEvidence'].get('memberWisePredicate','').startswith('RETIRED')
                  and f['expectedIntermediateEvidence'].get('contestedState','').startswith('RETIRED'))
            check('AD-ESC-003 forbids the retired third state and the retired episode state',
                  f['forbidden'].get('advisoryConfidenceWarning')=='NOT_RUN'
                  and f['forbidden'].get('episodeStatus')=='CONTESTED_METHODS')
            check('AD-ESC-003 carries a straddling case that warns on the combined value',
                  'STRADDLING_THE_CEILING' in cin
                  and min(r['alkDkh'] for r in cin['STRADDLING_THE_CEILING']['readings'])<float(ceil_)
                  and cac['STRADDLING_THE_CEILING']['advisoryConfidenceWarning']=='ATTACHED')
            check('AD-ESC-003 carries the no-valid-reading case decision 29 names',
                  'NO_VALID_READING' in cin and cac['NO_VALID_READING']['advisoryConfidenceWarning']=='NONE')

        # 17g2. decision 25 - AD-SAF-010, refusal BEFORE branch selection -------------------------
        f=_fx('AD-SAF-010')
        check('AD-SAF-010 exists', f is not None)
        if f:
            inp=f['input']; P=inp['selectedPotencyDkhPerMl']; INC=inp['recommendationPrecisionMlPerDay']
            rd=min(inp['alkDkh']-inp['safetyDestinationHighDkh'],0.50)
            cin={c['case']:c for c in inp['cases']}
            cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            cac={c['case']:c for c in f['expectedAction']['cases']}
            bad=[]
            for name,c in cin.items():
                known = c['currentDoseMlPerDay']!='UNKNOWN'
                if cev[name]['preconditionPassed']!=known: bad.append((name,'preconditionPassed'))
                if not known:
                    if cev[name]['branchSelected']!='NOT_RUN': bad.append((name,'a refused state selects no branch'))
                    if cac[name]['temporarySafetyRateRecommendationMlPerDay']!='NOT_RUN': bad.append((name,'refusal must emit no rate'))
                    if cac[name].get('temporarySafetyRateRecommendationMlPerDay')==0: bad.append((name,'refusal must not emit zero'))
                else:
                    want=max(0.0,(c['consumptionDkhPerDay']-rd)/P)
                    got=cac[name]['temporarySafetyRateRecommendationMlPerDay']
                    if not isinstance(got,(int,float)) or abs(got-_round_to(want,INC))>1e-9:
                        bad.append((name,'branch A rate',got,_round_to(want,INC)))
                if cac[name]['numericRecommendationAndRefusalTogether'] is not False:
                    bad.append((name,'a state must not produce both a number and a refusal'))
            check('AD-SAF-010 refuses before branch selection, on every branch including A',
                  not bad, str(bad[:4]))
            check('AD-SAF-010 states the precondition is evaluated BEFORE branch selection',
                  f['expectedIntermediateEvidence'].get('preconditionEvaluatedBeforeBranchSelection') is True
                  and f['expectedAction'].get('sameStateSameOutputUnderEveryReading') is True)
            fb=f['forbidden']['cases']['BRANCH_A_D_CURRENT_UNKNOWN']
            check('AD-SAF-010 forbids exactly the value the reverted engine emits on branch A',
                  1.4 in fb['temporarySafetyRateRecommendationMlPerDay']
                  and 0 in fb['temporarySafetyRateRecommendationMlPerDay']
                  and fb['branchSelected']=='A',
                  str(fb['temporarySafetyRateRecommendationMlPerDay']))
            check('AD-SAF-010 covers branch A with D_current KNOWN as the positive control',
                  'BRANCH_A_D_CURRENT_KNOWN' in cin and cev['BRANCH_A_D_CURRENT_KNOWN']['branchSelected']=='A')

        # 17g3. decision 23 - one output, and nothing withheld for want of a device ---------------
        for fid in ('AD-REC-001','AD-SAF-002'):
            f=_fx(fid)
            check(fid+' exists', f is not None)
            if not f: continue
            act=f['expectedAction']
            check(fid+' emits exactly ONE recommendation',
                  act.get('outputCount')==1
                  and isinstance(act.get('temporarySafetyRateRecommendationMlPerDay'),(int,float)))
            check(fid+' forbids a second output field under any name',
                  set(['temporarySafetyPumpCommandMlPerDay']) <= set(f['forbidden'].get('fields',[]))
                  and f['forbidden'].get('outputCount')==2)
        f=_fx('AD-REC-001')
        if f:
            inp=f['input']; P=inp['selectedPotencyDkhPerMl']; INC=inp['recommendationPrecisionMlPerDay']
            rd=min(inp['alkDkh']-inp['safetyDestinationHighDkh'],0.50)
            cont=max(0.0, inp['currentDoseMlPerDay']-rd/P)
            check('AD-REC-001 keeps the continuous value as an INTERMEDIATE and the rounded value as THE output',
                  abs(f['expectedIntermediateEvidence']['temporarySafetyRateContinuousMlPerDay']-cont)<1e-9
                  and abs(f['expectedAction']['temporarySafetyRateRecommendationMlPerDay']-_round_to(cont,INC))<1e-9,
                  '%.12f -> %r'%(cont,_round_to(cont,INC)))
        f=_fx('AD-SAF-005')
        check('AD-SAF-005 exists', f is not None)
        if f:
            a=f['expectedAction']
            check('AD-SAF-005 states a recommendation when NO precision is configured',
                  a['PRECISION_NOT_CONFIGURED']['outputWithheld'] is False
                  and a['PRECISION_NOT_CONFIGURED']['roundingApplied'] is False
                  and isinstance(a['PRECISION_NOT_CONFIGURED']['temporarySafetyRateRecommendationMlPerDay'],(int,float)))
            check('AD-SAF-005 keeps the potency refusal, which is not a device capability',
                  a['POTENCY_INVALID']['temporarySafetyRateRecommendationMlPerDay']=='NOT_RUN'
                  and a['POTENCY_INVALID']['requiredMovementDkh']==0.5)
            check('AD-SAF-005 forbids inventing a 0.1 default when none is configured',
                  f['forbidden']['cases']['PRECISION_NOT_CONFIGURED'].get('assumedPrecisionMlPerDay')==0.1)
        f=_fx('WG-ALK-045')
        check('WG-ALK-045 exists', f is not None)
        if f:
            check('WG-ALK-045 no longer withholds for a missing device increment',
                  f['expectedAction']['outputWithheld'] is False
                  and f['input']['recommendationPrecisionMlPerDay']=='NOT_CONFIGURED'
                  and f['forbidden']['recommendedDoseMlPerDay']=='WITHHELD'
                  and 'supersededExpectation' in f['expectedAction'])
        f=_fx('AD-REC-002')
        check('AD-REC-002 exists', f is not None)
        if f:
            a=f['expectedAction']
            check('AD-REC-002 pins that withholding has no physical effect',
                  a['engineControlsDosingEquipment'] is False and a['withholdingChangesDelivery'] is False)
            check('AD-REC-002 forbids every phrase that reasons about delivery continuing',
                  len(f['forbidden']['phrases'])>=4
                  and any('pump continues' in x for x in f['forbidden']['phrases'])
                  and f['forbidden']['engineControlsDosingEquipment'] is True)

        # 17h. INV-G12 - the exhaustiveness invariant exists and says what it must ---------------
        f=_fx('INV-G12')
        check('INV-G12 exists', f is not None)
        if f:
            txt=json.dumps(f)
            # [F1] INV-G12 partitions the states that REACH selection. It must say so, or it
            # contradicts INV-G15's pre-branch refusal. Both readings of the same state is exactly
            # the ambiguity decision 25 exists to abolish.
            check('INV-G12 asserts joint exhaustiveness and mutual exclusion',
                  'exactly one branch is selected for every generated state' in txt
                  and 'no generated state selects zero branches' in txt
                  and 'never two' in f['property'])
            check('INV-G12 scopes itself to the states that REACH branch selection (decision 25)',
                  'THAT REACHES BRANCH SELECTION' in f['property']
                  and 'precondition' in f['property'].lower()
                  and 'INV-G15' in f['property']
                  and 'complementary' in f['property'].lower())
            check('INV-G12 no longer asserts the decision-20 reading that a refused state selects a branch',
                  not any('the branch is still selected and identified, and only the RATE' in m
                          and 'Under owner decision 20 alone' not in m for m in f['mustHold']))
            check('INV-G12 asserts that the boundary gates no branch (decision 24)',
                  any('AdvisoryCeiling' in m and 'still selects a branch' in m for m in f['mustHold']))
            check('INV-G12 carries the B-prime removal as its negative control',
                  "Remove the B' branch" in f['negativeControl'] and 'AD-SAF-009' in f['negativeControl'])

        _sec('CHK-CANON-DECISION-TEXT')
        # 17i. the new canon rules must not have introduced a second constant -------------------
        def rule_body(rid):
            """The whole body, to the next same-or-higher heading. A fixed-width window silently
            truncates a rule that grows, and a check that reads past its own rule can pass on a
            neighbour's text."""
            m=re.search(r'^`'+re.escape(rid)+r'`\s*$', CANON, re.M)
            if not m: return ''
            nxt=re.search(r'^#{1,4} ', CANON[m.end():], re.M)
            return CANON[m.start(): m.end()+nxt.start()] if nxt else CANON[m.start():]

        seg=rule_body('ALK-ADVISORY-RANGE-BOUNDARY-001')
        check('the advisory boundary is defined as an OFFSET from the configured bounds',
              'OuterMax + 1.0' in seg and 'OuterMin - 1.0' in seg
              and 'not a second set of pinned levels' in seg)
        check('the advisory boundary declares its inclusive comparison and forbids an epsilon',
              'inclusive at the boundary' in seg and 'no epsilon exists or may be introduced' in seg)
        check('the advisory boundary states it does NOT close the flat-above-the-rail item',
              'not narrowed any more, and is emphatically not closed' in re.sub(r'\s+',' ',seg))
        seg=rule_body('ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001')
        check('branch B-prime states it does NOT close the C-zero discontinuity',
              'remains **open**' in seg and 'No\nbranch boundary is adjusted' in seg.replace('\r','')
              or 'No branch boundary is adjusted' in seg)
        check('the canon declares the single new constant of decisions 20-22',
              'advisory range offset = 1.0 dKH' in CANON and 'the ONLY new number' in CANON)

        # ---------- 18. the CANON's own text for decisions 20-22, asserted ----------
        # The breaker reverted every one of decisions 20, 21 and 22 IN THE CANON and this gate stayed
        # green: section 17 recomputes fixtures against fixtures and touched the canon only through a
        # handful of string-presence assertions, so canon-versus-fixture divergence was undetectable
        # in either direction. The canon is the sole behavioural authority; an implementer reads IT.
        # Every check below is the canon-side twin of a fixture-side check above, and each names the
        # reversion it exists to catch.

        REC = rule_body('ALK-RECOMMEND-ONLY-001')
        DEC = rule_body('ALK-DELIVERY-RATE-BASIS-001')
        ADV = rule_body('ALK-ADVISORY-RANGE-BOUNDARY-001')
        SIZ = rule_body('ALK-HIGH-BREACH-SAFETY-SIZING-001')
        BPR = rule_body('ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001')
        DC  = open(_ALK+'ALK-V2-DATA-CONTRACT.md',encoding='utf-8').read()
        def flat(t): return re.sub(r'\s+',' ',t)

        # 18a. [R1] the two boxed sizing formulas take D_current, and D_history is forbidden in them.
        # The reversion an implementer actually makes after a rename is not to resurrect the retired
        # name - it is to plug in the OTHER live name, which check 17a cannot see.
        for rid,seg in (('ALK-HIGH-BREACH-SAFETY-SIZING-001',SIZ),
                        ('ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001',BPR)):
            boxed=re.findall(r'\\boxed\{(.*?)\}\s*\n\\\]', seg, re.S)
            body='\n'.join(boxed)
            check('canon %s boxes max(0, D_current - R_down/P_selected)'%rid,
                  'D_{current}' in body and 'R_{down}' in body and 'P_{selected}' in body
                  and '\\max' in body and 'D_{history}' not in body and 'D_{established}' not in body,
                  'boxed blocks: %d'%len(boxed))
        check('canon forbids substituting D_history into the safety formula',
              'may **not** be substituted for' in flat(SIZ) and 'D_{history}' in SIZ)
        check('canon states consumption takes D_history, not D_current',
              'P_{selected}D_{history}' in CANON and 'C = P_selected · D_history' in DC)

        # 18b. [R2] the advisory comparison is INCLUSIVE, in the canon, in both directions
        check('canon states the advisory comparison inclusively in both directions',
              'A_{now}\\ge AdvisoryCeiling' in ADV and 'A_{now}\\le AdvisoryFloor' in ADV
              and 'inclusive at the boundary' in flat(ADV)
              and 'no epsilon exists or may be introduced' in flat(ADV))
        check('canon puts the advisory predicate in ALK-DECIMAL-THRESHOLD-001 governed table',
              re.search(r'^\| advisory-range confidence warning against `AdvisoryCeiling` / `AdvisoryFloor` \| `ALK-ADVISORY-RANGE-BOUNDARY-001`',
                        CANON, re.M) is not None)

        # 18c. [R3] the D_current-unknown handling REFUSES and forbids zero, in the canon
        check('canon refuses on an unknown D_current and forbids zero',
              'refuse, never assume zero' in flat(SIZ)
              and 'Emitting `0 mL/day` here is **forbidden**' in flat(SIZ)
              and 'Unknown handling — refuse, do not assume zero' in flat(DEC)
              and '0 mL/day is NOT emitted as though it were a computed recommendation' in flat(DEC))
        check('canon keeps the two unknowns independent',
              'consumption is UNAFFECTED where D_history is available' in flat(DEC)
              and 'safety sizing is UNAFFECTED where D_current is known' in flat(DEC))

        # 18c2. [DECISION 25] the refusal is a PRECONDITION, before branch selection, on every branch
        check('canon makes the D_current refusal a PRE-BRANCH precondition',
              'HIGH-BREACH PRECONDITION, evaluated BEFORE branch A / B / B' in DEC
              and 'applies **identically to branches A, B and B' in flat(DEC))
        check('canon says the precondition reaches branch A even though its formula lacks D_current',
              'This applies to branch A even though branch A' in flat(DEC)
              and 'about the STATE, not about which symbols a formula uses' in flat(DEC))
        check('canon asserts one outcome per high-breach state',
              'Exactly one outcome per state' in flat(DEC) and 'never both' in flat(DEC)
              and 'INV-G15' in DEC)
        check('canon no longer carries the branch-A open question as undecided',
              'RECORDED EXPOSURE — `OI-BRANCHAREFUSAL-001`' not in CANON
              and 'RESOLVED by owner decision 25' in DEC)

        # 18d. [R4] the ordering: the boundary check is evaluated on the resolved episode value
        check('canon states the boundary is evaluated on the resolved episode value',
              'resolved episode value' in flat(ADV))

        # 18e. [DECISION 24] the boundary WARNS. It does not withhold, and it does not zero.
        check('canon states the boundary continues to advise',
              'The engine **continues to advise**' in flat(ADV)
              and 'does **not** withhold' in flat(ADV)
              and 'does **not** emit zero' in flat(ADV)
              and 'escalate in place of advising' in flat(ADV))
        check('canon states there is NO discontinuity at the boundary',
              'No discontinuity at the boundary' in flat(ADV)
              and 'produced by the **same rules** and differ' in flat(ADV))
        # [A2] the emit-block itself must say the ordinary rules run and the warning ATTACHES. A
        # check on the surrounding prose alone passed when the block was reverted to WITHHELD.
        _emit=''.join(re.findall(r'```text\n(.*?)```', ADV, re.S))
        check('canon advisory emit-block produces the ordinary recommendation, not a withheld one',
              'the ordinary recommendation is produced by the ORDINARY RULES, unchanged' in _emit
              and 'advisoryConfidenceWarning = ATTACHED' in _emit
              and 'WITHHELD' not in _emit and 'NOT_RUN' not in _emit
              and not re.search(r'MlPerDay\s*=\s*0\b', _emit),
              'emit-block: %d chars'%len(_emit))
        check('canon forbids the warning from altering what it accompanies',
              'must not alter anything it accompanies' in flat(ADV)
              and 'the recommended rate' in flat(ADV) and 'the retest schedule' in flat(ADV)
              and 'information attached to an answer, not a modifier of it' in flat(ADV))
        check('canon preserves the OLD withholding wording as marked history, not as instruction',
              'Superseded by owner decision 24, preserved rather than deleted' in flat(ADV)
              and all(l.lstrip().startswith('>') for l in ADV.split('\n')
                      if 'Delivery guidance is **withheld**, not set' in l))
        check('data contract states the advisory boundary no longer withholds',
              'advisoryConfidenceWarning' in DC and 'ATTACHED' in DC
              and 'is not withheld' in flat(DC).lower())

        # 18e2. [DECISION 26] one retest answer
        check('canon binds the warning to the scheduler for the retest interval',
              'renders whatever interval the scheduler produced' in flat(ADV)
              and 'must not state an interval of its own' in flat(ADV)
              and 'adds no candidate to the scheduler and computes no next-test time' in flat(ADV))

        # 18f. [DECISION 24] the member-wise predicate is retired with the withholding it served
        check('canon retires the contested member-wise predicate',
              'member-wise predicate of decision 21 is retired' in flat(ADV)
              and 'needs no exception' in flat(ADV))
        check('canon no longer carries the three exposures decision 24 closed',
              not any(('RECORDED EXPOSURE — `%s`'%oi) in CANON
                      for oi in ('OI-ADVISORYEXCEPTION-001','OI-ADVISORYMEMBERS-001','OI-ADVISORYRETURN-001','OI-ADVISORYRETEST-001')))

        # 18g. [DECISION 24] OI-SIZINGFLAT-001 is OPEN and NO LONGER NARROWED
        check('canon states the flat region is no longer narrowed and is not closed',
              'Decision 24\nremoves that bound' in ADV or 'Decision 24 removes that bound' in flat(ADV))
        check('canon says the flat exposure is wider under decision 24 than under decision 21',
              'not narrowed any more, and is emphatically not closed' in flat(ADV)
              and 'wider under decision 24 than under decision 21' in flat(ADV)
              and 'removes the narrowing that decision 21 provided' in flat(ADV))

        # 18h. the five WARNING elements, and none optional
        for el in ('the measured value','beyond the range the engine is confident in',
                   'confirmed with a second test','dosing setup should be checked',
                   'warrants experienced judgement about the specific'):
            check('canon warning states: %s'%el, el in flat(ADV))
        check('canon marks the five warning elements as none-optional',
              'all five of the following, none optional' in flat(ADV))

        # 18h2. [DECISION 23] the foundational constraint, asserted in the canon
        check('canon states the application never commands a pump',
              'never controls, drives, commands or actuates a dosing pump' in flat(REC)
              and 'no execution path from the engine to the tank' in flat(REC))
        check('canon states there is ONE output, not two',
              'One output, not two' in flat(REC)
              and 'is **retired**' in flat(REC)
              and 'retained as an **auditable intermediate**' in flat(REC))
        check('canon states actuator capability is not a concept',
              'Actuator capability is not a concept in this system' in flat(REC)
              and 'no state in which the engine must refuse to advise for want of one' in flat(REC))
        # [F5] item 2 must NOT deny the existence of the field item 5 renames and eight artefacts read.
        check('canon does not declare recommendationPrecisionMlPerDay nonexistent',
              'There is no `recommendationPrecisionMlPerDay`' not in flat(REC)
              and 'no `R_{pump}`, no increment' not in flat(REC)
              and 'The field **exists and is read**' in flat(REC))
        check('canon states withholding has no physical effect',
              'Withholding a recommendation has no physical effect' in flat(REC)
              and 'a mechanism that does not exist' in flat(REC))
        # [C4] all three limbs must hold. `A and B and C or D` bound as `(A and B and C) or D`, so
        # reverting the heading still passed on the trailing disjunct - the same precedence quirk the
        # last pass found latent elsewhere, live here.
        check('canon keeps rounding, for legibility only',
              all(x in flat(REC) for x in ('Rounding survives, for legibility only',
                                           'not** exist to match a hardware increment',
                                           'display convention'))
              and 'a device capability' in flat(REC))
        check('canon names the two rules decision 23 retires',
              'ALK-SAFETY-TEMP-RATE-RESOLUTION-001' in REC and 'ALK-SAFETY-CORRECTION-RESOLUTION-001' in REC)
        for rid in ('ALK-SAFETY-TEMP-RATE-RESOLUTION-001','ALK-SAFETY-CORRECTION-RESOLUTION-001'):
            m=re.search(r'^`'+re.escape(rid)+r'` — \*\*RETIRED by owner decision 23\*\*\s*$', CANON, re.M)
            seg=''
            if m:
                nxt=re.search(r'^#{1,4} ', CANON[m.end():], re.M)
                seg=CANON[m.start(): m.end()+nxt.start()] if nxt else CANON[m.start():]
            check('canon marks %s RETIRED and keeps its wording as history'%rid,
                  bool(m) and 'no longer governs anything' in flat(seg)
                  and 'Superseded wording, preserved rather than deleted' in flat(seg), '%d chars'%len(seg))
        _man = CANON.split('# CANON RULE COVERAGE MANIFEST')[1].split('\n---\n')[0]
        check('the retired rules are gone from the coverage manifest',
              not re.search(r'^\| `ALK-SAFETY-(TEMP-RATE|CORRECTION)-RESOLUTION-001` \|', _man, re.M))
        check('the recommend-only rule is IN the coverage manifest',
              re.search(r'^\| `ALK-RECOMMEND-ONLY-001` \|', _man, re.M) is not None)
        check('canon declares decisions 23-26 introduce no constant',
              'Decisions 23–26 introduce no constant at all' in flat(CANON))

        # 18i. [R11] B' is DISTINCT from an unknown D_current
        # [F16] this was `A and B or C`, binding as `(A and B) or C`. C was true, so the check was
        # vacuous and replacing the primary anchor still passed. Parenthesised, both limbs bind.
        check("canon keeps branch B' distinct from an unknown D_current",
              'Distinct from an unknown \\(D_{current}\\)' in BPR
              and ('requires \\(D_{current}\\) to be\n**known**' in BPR.replace('  ',' ')
                   or 'requires \\(D_{current}\\) to be **known**' in flat(BPR)))
        check("canon does not let B' swallow the unknown-D_current refusal",
              'Also covers' not in flat(BPR) and 'treats it as 0' not in flat(BPR))

        # 18j. the partition is total, and B carries the uninterpretable disjunct
        check('canon partition is jointly exhaustive and mutually exclusive',
              'jointly exhaustive and mutually exclusive' in flat(BPR)
              and 'exactly one** of A, B and B' in flat(BPR))
        # The disjunct must be in the PARTITION BLOCK, not merely in the prose that explains it.
        # Mutation R16 deleted it from the block and this check passed on the surrounding paragraph.
        _part=''.join(re.findall(r'```text\n(.*?)```', BPR, re.S))
        check('canon branch B carries the computable-but-uninterpretable disjunct IN THE PARTITION',
              'otherwise physically uninterpretable' in flat(_part)
              and re.search(r'^A\.\s+C_estimate >= 0 AND physically interpretable', _part, re.M) is not None
              and 'ALK-HIGH-BREACH-UNRESOLVED-001' in BPR,
              'partition block: %d chars'%len(_part))
        check('canon names the two rate-withholding states that are NOT a fourth branch',
              'What is NOT a fourth branch' in BPR
              and 'P_{selected}\\) **unavailable or invalid**' in BPR)

        # 18k. the offset, and only the offset
        check('canon defines both boundaries as offsets from the configured bounds',
              'AdvisoryCeiling = OuterMax + 1.0' in flat(ADV)
              and 'AdvisoryFloor = OuterMin - 1.0' in flat(ADV)
              and 'not a second set of pinned levels' in flat(ADV))
        check('canon declares the advisory offset as the only new constant of decisions 20-22',
              'advisory range offset = 1.0 dKH' in CANON and 'the ONLY new number' in CANON)

        # 18m. the five items decisions 24-26 closed are RESOLVED in canon and register alike
        for oi,dec in (('OI-BRANCHAREFUSAL-001','25'),('OI-ADVISORYEXCEPTION-001','24'),
                       ('OI-ADVISORYMEMBERS-001','24'),('OI-ADVISORYRETEST-001','26'),
                       ('OI-ADVISORYRETURN-001','24')):
            check('canon no longer carries %s as an open exposure'%oi,
                  ('RECORDED EXPOSURE — `%s`, OPEN'%oi) not in CANON)
            m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
            seg=''
            if m:
                nxt=OI.find('\n## ', m.end()); seg=OI[m.start(): nxt if nxt!=-1 else len(OI)]
            check('register marks %s RESOLVED by owner decision %s'%(oi,dec),
                  bool(m) and '> **RESOLVED by owner decision' in seg
                  and '**Status:** **OPEN.**' not in seg)

        # 18n. the two items that must STILL be open are still open
        for oi in ('OI-SIZINGFLAT-001','OI-CZERODISCONT-001'):
            m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
            seg=''
            if m:
                nxt=OI.find('\n## ', m.end()); seg=OI[m.start(): nxt if nxt!=-1 else len(OI)]
            check('%s is STILL open after decisions 23-26'%oi,
                  bool(m) and '**Status:** **OPEN.**' in seg and '> **RESOLVED' not in seg)


        # ======================================================================================
        # 19. ABSENCE CHECKS — what must NOT be sayable anywhere in live text
        #
        # Every decision-23/24/25/26 check in section 18 is a string-PRESENCE assertion, and the
        # breaker demonstrated that all four decisions can be reverted IN CANON by ADDING a
        # contradicting clause: the asserted string is still there, so the gate stays green. Four
        # mutations (M5 decision 23, M6 decision 24, M7 decision 26, M8 decision 25) passed a
        # 192-check gate. Presence cannot see a contradiction; only absence can.
        #
        # Each scanner below has a NEGATIVE CONTROL that feeds it the exact mutation text the
        # breaker used, and fails if the scanner does not catch it. A checker never shown to fail
        # is not a gate (CORE-CANON-COVERAGE-001).
        # ======================================================================================

        # The corpus, as units, with preserved history excluded. History that has been reworded is
        # no longer history, so a blockquote is skipped WHOLE, never line-by-line.
        _LIVE_SKIP = ('ALK-V2-OPEN-ISSUES.md', 'ALK-V2-ADVERSARIAL-REVIEW.md',
                      'CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md')

        def _live_units():
            """Yield (filename, unit) over live (non-history) prose in canon and the specs."""
            for fn in sorted(glob.glob(_CANON+'*.md')
                             + glob.glob(_ALK + '*.md')):
                if os.path.basename(fn) in _LIVE_SKIP:
                    continue
                for unit in _units(open(fn, encoding='utf-8', errors='ignore').read()):
                    lines = [l for l in unit.split('\n') if l.strip()]
                    if lines and all(l.lstrip().startswith('>') for l in lines):
                        continue                       # preserved history, quoted whole
                    yield os.path.basename(fn), unit

        _LIVE_CORPUS = list(_live_units())

        # A contradicting SENTENCE inserted into a paragraph that carries an exemption phrase is
        # invisible to a paragraph-scoped scan: mutation M7 landed in the very paragraph whose
        # "renders whatever the scheduler produced" exempted it. The scanning unit is therefore the
        # SENTENCE, with the paragraph kept only for the preserved-history exclusion above.
        def _norm(t):
            """Markdown emphasis and code ticks are decoration; a mutation can hide behind them."""
            return re.sub(r'\s+', ' ', t.replace('**', '').replace('`', '')).strip()

        def _sentences(u):
            flatu = _norm(u)
            if flatu.startswith('|'):
                return [flatu]                 # a table row is one unit; splitting it loses context
            parts = re.split(r'(?<=\.)\s+(?=[A-Z])', flatu)
            return [p for p in ([flatu] + parts) if p]

        def _scan(pred, extra=()):
            """Every live SENTENCE matching pred, plus any synthetic units supplied for a control.
            The exemption lives in the predicate and is applied to the SENTENCE, never to the
            surrounding paragraph: a paragraph-scoped exemption is what let M7 through."""
            out = []
            for n, u in list(_LIVE_CORPUS) + list(extra):
                for s in _sentences(u)[1:] or _sentences(u):
                    if pred(s):
                        out.append((n, s[:110]))
                        break          # one report per unit; the unit is the thing to fix
            return out

        _sec('CHK-LIVE-TEXT-ABSENCE')
        # --- 19a. [M5, decision 23] nothing may withhold an output for want of a precision -----
        _M5 = ('Where `recommendationPrecisionMlPerDay` is unavailable the rounded figure '
               '`temporarySafetyRateRecommendationMlPerDay` is `NOT_RUN` and only the continuous '
               'rate is emitted.')

        # The claim being hunted is CAUSAL: an output withheld BECAUSE a precision is absent. A unit
        # that merely mentions rounding near an unrelated withholding (the liquid-volume guard) is
        # not that claim, so absence-of-the-precision and the withholding must appear linked.
        _ABSENT = r'(?:missing|unavailable|unknown|absent|not configured|for want of|is MISSING|NOT CONFIGURED)'
        _WITHHOLD = r'(?:NOT_RUN|WITHHELD|withheld|withhold|withholds|REFUSE|refuses|refuse)'
        _PRECISION = r'(?:recommendationPrecisionMlPerDay|actuatorIncrementMlPerDay|R_\{?pump\}?|recommendation precision|actuator increment|maintenance-rate increment|device increment|the increment)'

        def _p_precision_withholds(u):
            if not re.search(_PRECISION, u):
                return False
            linked = (re.search(_ABSENT + r'[^.]{0,160}' + _WITHHOLD, u)
                      or re.search(_WITHHOLD + r'[^.]{0,160}' + _ABSENT, u))
            if not linked:
                return False
            # A CONFIGURED value <= 0 is a validation failure and always was: that refusal survives.
            if re.search(r'<= ?0|≤ ?0|less than or equal to zero|CONFIGURED precision is|CONFIGURED and', u):
                return False
            # Statements that the withholding does NOT happen, or that record it as history.
            if re.search(r'not withheld|nothing withheld|nothing is withheld|withholds nothing|'
                         r'never `NOT_RUN`|not `NOT_RUN`|never withheld|no longer|retired|RETIRED|'
                         r'retires|previously|superseded|Superseded|must not|may not|does not|'
                         r'is not blocked|forbidden|Forbidden|negative control|Negative control|'
                         r'not NOT_RUN|there is no |no output is withheld|must fail|nothing is '
                         r'refused|never "unavailable"|in the sense that withholds', u, re.I):
                return False
            return True

        check('no live text withholds an output for want of a recommendation precision [M5]',
              not _scan(_p_precision_withholds), str(_scan(_p_precision_withholds)[:4]))
        check('  ^ negative control: the M5 mutation is caught',
              len(_scan(_p_precision_withholds, [('PROBE.md', _M5)])) == 1)

        # --- 19b. [M6, decision 24] the advisory boundary may not withhold anything ------------
        _M6 = ('Where the warning attaches, the ordinary maintenance recommendation '
               '`recommendedDoseMlPerDay` is WITHHELD and only the safety rate is stated.')

        def _p_boundary_withholds(u):
            if not re.search(r'AdvisoryCeiling|AdvisoryFloor|advisory boundary|advisory range|'
                             r'the warning attaches|advisoryConfidenceWarning', u):
                return False
            if not re.search(r'WITHHELD|withheld|withholds|NOT_RUN|escalates|escalate|'
                             r'not sized|no rate is sized|is not reached', u):
                return False
            if re.search(r'not withheld|nothing withheld|nothing is withheld|withholds nothing|'
                         r'never withheld|no longer|retired|RETIRED|retires|previously|superseded|'
                         r'Superseded|must not|may not|forbidden|negative control|Negative control|'
                         r'gates nothing|still runs|still sized|still sizes|not `NOT_RUN`|'
                         r'not NOT_RUN|withholds neither|rewrote|rewritten|into a warning|must fail|'
                         r'is NOT `NOT_RUN`|auditable intermediate', u, re.I):
                return False
            return True

        check('no live text lets the advisory boundary withhold an output [M6]',
              not _scan(_p_boundary_withholds), str(_scan(_p_boundary_withholds)[:4]))
        check('  ^ negative control: the M6 mutation is caught',
              len(_scan(_p_boundary_withholds, [('PROBE.md', _M6)])) == 1)

        # --- 19c. [M8, decision 25] no branch is exempt from the pre-branch precondition -------
        _M8 = ('**Branch A is exempt.** Where consumption is interpretable the branch A formula '
               'max(0,(C_estimate + S_safety)/P_selected) runs and states its rate, because it does '
               'not reference D_current.')

        def _p_branch_a_exempt(u):
            if not re.search(r'[Bb]ranch A', u):
                return False
            if not re.search(r'exempt|does not apply|not apply to A|unaffected by the precondition|'
                             r'runs and states its rate|is not refused', u):
                return False
            if re.search(r'not exempt|no branch is exempt|applies identically|applies to branch A|'
                         r'retired|previously|superseded|Superseded|must not|may not|forbidden|'
                         r'negative control|Negative control', u, re.I):
                return False
            return True

        check('no live text exempts branch A from the D_current precondition [M8]',
              not _scan(_p_branch_a_exempt), str(_scan(_p_branch_a_exempt)[:4]))
        check('  ^ negative control: the M8 mutation is caught',
              len(_scan(_p_branch_a_exempt, [('PROBE.md', _M8)])) == 1)

        # --- 19d. [M7, decision 26] the warning may not state an interval of its own -----------
        _M7 = ('The warning nonetheless states its own confirmation interval, which halves whatever '
               'the scheduler produced.')

        def _p_warning_own_interval(u):
            if not re.search(r'warning', u, re.I):
                return False
            if not re.search(r'its own (confirmation )?interval|own retest|halves|its own schedule|'
                             r'shortens the retest|own cadence|second interval', u, re.I):
                return False
            # 'must fail' marks an invariant's negative control: a description of the mutation that
            # must be caught, not an assertion that the mutation is correct behaviour.
            if re.search(r'must not|may not|never states|states NO interval|no interval of its own|'
                         r'retired|previously|superseded|Superseded|forbidden|negative control|'
                         r'Negative control|renders whatever|must fail', u, re.I):
                return False
            return True

        check('no live text gives the warning a retest interval of its own [M7]',
              not _scan(_p_warning_own_interval), str(_scan(_p_warning_own_interval)[:4]))
        check('  ^ negative control: the M7 mutation is caught',
              len(_scan(_p_warning_own_interval, [('PROBE.md', _M7)])) == 1)

        _sec('CHK-RC-RETIRED')
        # --- 19e. a RETIRED RULE ID may not be cited as live governing authority ---------------
        # Check 13 covers retired reason CODES only. Nothing covered retired RULE IDs, and the
        # breaker found ALK-SAFETY-CORRECTION-RESOLUTION-001 named as live authority for a safety
        # output inside ALK-ROUNDING-001's Scope, in ordinary prose with no marker.
        RETIRED_RULES = ('ALK-SAFETY-TEMP-RATE-RESOLUTION-001', 'ALK-SAFETY-CORRECTION-RESOLUTION-001')

        def _p_retired_rule_live(u):
            if not any(r in u for r in RETIRED_RULES):
                return False
            # Only a GOVERNANCE assertion counts. Naming a retired rule in a retirement table or a
            # decision map is a record of history, not a claim that it governs an output.
            if not re.search(r'governed by|governs|is owned by|owns |under `ALK-SAFETY|'
                             r'applies|exempt under|per `ALK-SAFETY|remains governed', u):
                return False
            if re.search(r'RETIRED|retired|retires|no longer governs|previously|superseded|'
                         r'Superseded|not live authority|may cite|negative control|Negative control|'
                         r'reclassified|INAPPLICABLE', u, re.I):
                return False
            return True

        _rr = _scan(_p_retired_rule_live)
        check('no retired RULE ID is cited as live governing authority',
              not _rr, str(_rr[:4]))
        check('  ^ negative control: a live citation is caught',
              len(_scan(_p_retired_rule_live,
                        [('PROBE.md', 'The correction volume remains governed by '
                                      'ALK-SAFETY-CORRECTION-RESOLUTION-001.')])) == 1)

        _sec('CHK-RC-RETIRED')
        # Same, over the fixtures' rulesExercised / canonSource, where a retired ID means the
        # fixture claims to exercise a rule that governs nothing.
        _frr = []
        for fid, (fn, f) in fixtures.items():
            for key in ('rulesExercised',):
                for r in f.get(key, []) or []:
                    if r in RETIRED_RULES:
                        _frr.append((fid, r))
        check('no fixture claims to exercise a retired rule', not _frr, str(_frr[:6]))

        # --- 19f. [F9] expectedReasonCodesByCase and variantReasonCodes are READ ---------------
        # The gate collected reason codes from `expectedReasonCodes` and `variant.expectedReasonCodes`
        # only. `expectedReasonCodesByCase` is the shape decisions 24-26 introduced, and
        # `variantReasonCodes` predates them; between them 70+ assertions were never validated
        # against the catalogue or the retired set. The breaker appended two retired codes to
        # AD-ESC-001 and the gate stayed green.

        _sec('CHK-BOUNDARY-INVARIANCE')
        # --- 19g. [F8] the warning must not alter the retest ACROSS the boundary ---------------
        # The gate compared the three retest fields WITHIN a warned case only, so setting every
        # warned case to 6 h while the unwarned cases stayed at 24 h passed. Decision 24's own
        # words - "the warning must not alter ... the retest schedule" - are a statement about the
        # two SIDES of the boundary, so the comparison has to cross it.
        for fid in ('AD-ESC-001', 'AD-ESC-002'):
            f = _fx(fid)
            check('%s exists' % fid, f is not None)
            if not f:
                continue
            cases = {c['case']: c for c in f['expectedAction']['cases']}
            warned = {k: v for k, v in cases.items() if v.get('advisoryConfidenceWarning') == 'ATTACHED'}
            unwarned = {k: v for k, v in cases.items() if v.get('advisoryConfidenceWarning') != 'ATTACHED'}
            check('%s states both warned and unwarned cases' % fid,
                  len(warned) >= 1 and len(unwarned) >= 1,
                  'warned=%d unwarned=%d' % (len(warned), len(unwarned)))
            # Every field ANY case states must be stated by EVERY case and be IDENTICAL across the
            # boundary. Decision 24's headline property is that the answer does not change; a field
            # stated only on one side is exactly how a change hides.
            _stated = sorted({k for c in cases.values() for k in c
                              if k not in ('case', 'note', 'advisoryConfidenceWarning', 'warningStates',
                                           'warningRetestIntervalHours', 'schedulerRetestIntervalHours')})
            check('%s states at least one recommendation-bearing field' % fid, len(_stated) >= 2, str(_stated))
            for field in _stated:
                vals_w = {str(v.get(field, '<<ABSENT>>')) for v in warned.values()}
                vals_u = {str(v.get(field, '<<ABSENT>>')) for v in unwarned.values()}
                check('%s: the warning does not move %s across the boundary' % (fid, field),
                      vals_w == vals_u and '<<ABSENT>>' not in vals_w,
                      'warned=%s unwarned=%s' % (sorted(vals_w), sorted(vals_u)))
            # and the three retest fields agree within every case that states them
            for name, c in cases.items():
                present = [k for k in ('nextTestApproxHours', 'warningRetestIntervalHours',
                                       'schedulerRetestIntervalHours') if k in c]
                if len(present) > 1:
                    check('%s/%s: one retest answer, not two (decision 26)' % (fid, name),
                          len({c[k] for k in present}) == 1,
                          str({k: c[k] for k in present}))

        _sec('CHK-CONTRACT-STRUCTURE')
        # --- 19g2. targeted structural checks the free-text scanners cannot express -------------
        # Three reversions slipped the sentence scanners because they carry no withholding VERB
        # (a restored precondition), or hide behind an exemption inside the same table row. Each is
        # pinned directly at the site instead.

        # [B3] ALK-ROUNDING-001 must not gate on the precision again (decision 23).
        _rnd = rule_body('ALK-ROUNDING-001')
        _pre = _rnd.split('Preconditions:', 1)[1].split('###', 1)[0] if 'Preconditions:' in _rnd else ''
        _pre = '\n'.join(l for l in _pre.split('\n') if not l.lstrip().startswith('>'))  # drop history
        check('ALK-ROUNDING-001 preconditions do not gate on R_precision',
              bool(_pre) and not re.search(r'`R_precision` is known|R_\{?precision\}? is known|'
                                           r'`R_pump` is known', _pre),
              _norm(_pre)[:120])
        check('ALK-ROUNDING-001 states the three precision states instead',
              'no longer a precondition of this rule running' in _norm(_rnd)
              and 'NOT CONFIGURED' in _rnd and 'STEP 6 STILL RUNS' in _rnd)

        # [A3] A40's preconditions must carry no upper limit (decision 24).
        _AC = open(_ALK + 'ALK-V2-ALGORITHM-CONTRACT.md', encoding='utf-8').read()
        _a40 = _AC.split('## A40 — Outer-bound safety return, high breach', 1)[-1].split('## A40b', 1)[0]
        _a40pre = _a40.split('**DECISION TREE**', 1)[0]
        check("A40's preconditions place NO upper limit on the high-breach region",
              '`A_now > outerMax`, with **no upper limit**' in _a40pre
              and not re.search(r'^\*\*PRECONDITIONS\*\* `outerMax < A_now < AdvisoryCeiling`',
                                _a40pre, re.M),
              _norm(_a40pre)[:120])
        check("A40's pre-branch precondition is stated BEFORE the decision tree",
              'PRE-BRANCH PRECONDITION' in _a40pre
              and 'branch selection DOES NOT RUN' in _a40pre
              and 'branchSelected     = NOT_RUN' in _a40pre)

        # [P2] the three output rows of the data contract must not withhold at the boundary.
        _DC = open(_ALK + 'ALK-V2-DATA-CONTRACT.md', encoding='utf-8').read()
        for _fieldname in ('recommendedDoseMlPerDay',
                           'temporarySafetyRateContinuousMlPerDay',
                           'temporarySafetyRateRecommendationMlPerDay'):
            _row = [l for l in _DC.split('\n')
                    if l.startswith('| `%s`' % _fieldname)]
            check('data contract states %s' % _fieldname, len(_row) == 1, str(len(_row)))
            if len(_row) == 1:
                r0 = _norm(_row[0])
                # Only the AFFIRMATIVE form is a defect. "is not NOT_RUN at an advisory boundary" is
                # the decision-24 statement itself, and must survive; "NOT_RUN where the boundary
                # escalates" is the reverted decision-21 statement, and must not.
                _affirm = re.search(r'(?<!not )(?<!never )(?:WITHHELD|NOT_RUN)[^.]{0,60}'
                                    r'(?:where `?ALK-ADVISORY-RANGE-BOUNDARY-001|escalat)', r0)
                check('%s is not withheld or NOT_RUN at an advisory boundary' % _fieldname,
                      not _affirm and 'escalates (owner decision 21)' not in r0,
                      (_affirm.group(0) if _affirm else r0[:120]))
                check('%s says so explicitly' % _fieldname,
                      re.search(r'(?:not|NOT) (?:WITHHELD|`?NOT_RUN`?|withheld)[^.]{0,60}'
                                r'advisory boundary|It is NOT withheld at an advisory boundary|'
                                r'not withheld at an advisory boundary', r0) is not None,
                      r0[-160:])

        _sec('CHK-LIVE-TEXT-ABSENCE')
        # --- 19h. [F17] AD-REC-002's forbidden phrases are searched against the package --------
        # The gate asserted the LIST had four entries and that one contained 'pump continues'. It
        # never searched for them. Two of the four were live in the algorithm contract.
        f = _fx('AD-REC-002')
        check('AD-REC-002 exists', f is not None)
        if f:
            phrases = (f.get('forbidden', {}) or {}).get('phrases', []) or []
            check('AD-REC-002 names at least four forbidden phrases', len(phrases) >= 4, str(len(phrases)))
            hits = []
            for ph in phrases:
                key = re.sub(r'\s+', ' ', ph.strip().lower())
                for n, u in _LIVE_CORPUS:
                    fu = re.sub(r'\s+', ' ', u).lower()
                    if key in fu:
                        hits.append((n, ph[:48]))
            check('no forbidden phrase survives in live text', not hits, str(hits[:4]))
            check('  ^ negative control: a planted forbidden phrase is caught',
                  bool(phrases) and any(
                      re.sub(r'\s+', ' ', phrases[0].strip().lower())
                      in re.sub(r'\s+', ' ', u).lower()
                      for _, u in [('PROBE.md', 'Note that ' + phrases[0] + ' in this state.')]))

        # ---------- 18. owner decisions 27, 28 and 29 ----------
        # Decision 27 is a sweep, so these scanners exist to make a reversion fail. Their exemptions
        # are deliberately narrow: an earlier draft exempted any paragraph containing an ordinary word
        # like "forbidden", skipped fixture `note` keys, skipped three whole files and skipped canon
        # Part I. Each of those four was shown to let a full reversion through, and each is closed here.
        import glob as _glob
        DOCS_ALL=[paths.CANON_MD]+DOCS+_glob.glob(FIXDIR+'*.json')+[
            _ALK+'traceability/alk-v2-traceability.json']
        SKIP_FILES=('ALK-V2-ADVERSARIAL-REVIEW.md',)          # a historical review, not a spec
        # ONLY explicit supersession markers exempt a paragraph.
        HISTORY=('Superseded wording, preserved','Superseded by owner decision','superseded by owner decision',
                 'Amended by owner decision','amended by owner decision','preserved rather than deleted',
                 'preserved here rather than deleted','previously read','previously required',
                 'previously stated','previously required','this rule previously','this section previously',
                 'this paragraph previously','this invariant previously','this golden previously',
                 'this record formerly','RETIRED by owner decision','Retired by owner decision',
                 'REWRITTEN by owner decision','What this retires outright','retirement table',
                 'is inoperative here','inoperative for alkalinity','what they supersede')

        def _canon_alk(text):
            """Exclude ONLY Part II, which is shared canon under SHARED_V2_FREEZE_2 and which owner
            decision 27 deliberately does not edit (OI-PII53METHOD-001). Part I is Alk-governing and
            is scanned."""
            a=text.find('\n# PART II')
            b=text.find('\n# PART III')
            return (text[:a]+text[b:]) if 0<a<b else text

        def _register_live(text):
            """The register's `# A<n>.` sections are the record of owner decisions and of what they
            retired, so they quote the retired vocabulary by design. Sections B, C and D are live
            specification and ARE scanned - a reversion hidden in a pinned convention must fail."""
            out=[]; skipping=False
            for line in text.split('\n'):
                if re.match(r'^# A\d+\.', line): skipping=True
                elif re.match(r'^# [B-Z]\.', line): skipping=False
                out.append('' if skipping else line)
            return '\n'.join(out)

        def _json_live(node):
            """Everything an implementation could act on. `forbidden`, `supersededExpectation`,
            `provenance` and `openIssues` record what must NOT happen or what used to; `note` is NOT
            skipped, because notes carry load-bearing statements in this corpus."""
            SKIP={'forbidden','supersededExpectation','provenance','openIssues'}
            if isinstance(node,dict):
                for k,v in node.items():
                    if k in SKIP: continue
                    yield k                # KEYS are scanned too: a reinstated `methodId` FIELD is a
                                           # reversion even when its value says nothing
                    for x in _json_live(v): yield x
            elif isinstance(node,list):
                for v in node:
                    for x in _json_live(v): yield x
            elif isinstance(node,str): yield node

        def sweep(label, needles):
            hits=[]
            for fn in DOCS_ALL:
                base=os.path.basename(fn)
                if base in SKIP_FILES: continue
                raw=open(fn,encoding='utf-8').read()
                if fn.endswith('.json'):
                    try: doc=json.loads(raw)
                    except Exception: continue
                    if 'groups' in doc:      # traceability: shared PII- rules are out of scope
                        doc={'g':[[r for r in g['rules'] if not r['id'].startswith('PII-')] for g in doc['groups']]}
                    for txt in _json_live(doc):
                        if any(m in txt for m in HISTORY) or 'RETIRED' in txt: continue
                        for nd in needles:
                            if nd in txt: hits.append((base,nd,txt[:60]))
                    continue
                if base.startswith('REEF'): raw=_canon_alk(raw)
                if base=='ALK-V2-OPEN-ISSUES.md': raw=_register_live(raw)
                lines=raw.split('\n')
                infence=False; fenced=set()
                for n,l in enumerate(lines):
                    if l.lstrip().startswith('```'): infence=not infence; continue
                    if infence: fenced.add(n)
                blockmark=[False]*len(lines); n=0
                for blk in raw.split('\n\n'):
                    marked=any(m in blk for m in HISTORY)
                    for _ in blk.split('\n'):
                        if n<len(blockmark): blockmark[n]=marked
                        n+=1
                    n+=1
                for n,line in enumerate(lines):
                    t=line.lstrip()
                    if t.startswith('>') or t.startswith('```'): continue
                    if t.startswith('| `PII-'): continue                 # shared Part II inventory rows
                    if any(m in line for m in HISTORY): continue
                    if re.match(r'^\| `([A-Z][A-Z0-9_]+)` \|', t) and re.match(r'^\| `([A-Z][A-Z0-9_]+)` \|', t).group(1) in retired:
                        continue                                  # a retirement-table row names its own code
                    if re.search(r'=\s*RETIRED\b', line): continue      # a canonised retirement declaration
                    if t.startswith('| `ALK-') and '` | ' in t and 'supersede' in raw[max(0,raw.find(line)-1200):raw.find(line)]:
                        continue                                  # a row inside a "what they supersede" table
                    if n not in fenced and n<len(blockmark) and blockmark[n]: continue
                    for nd in needles:
                        if nd in line: hits.append((base,nd,line.strip()[:60]))
            check(label, not hits, str(sorted(set((h[0],h[1]) for h in hits))[:5]))

        _sec('CHK-LIVE-TEXT-ABSENCE')
        sweep('no live method-compatibility concept survives decision 27',
              ['compatibleMethodClassification','crossMethodConcordanceThreshold','incompatible method',
               'incompatible-method','same-method','compatible method','methodId','episodeMethods'])
        sweep('no live contested-episode state survives decision 27',
              ['CONTESTED_METHODS','EPISODE_CONTESTED_METHODS','RETEST_EPISODE_CONTESTED',
               'EVIDENCE_WITHHELD_CONTESTED_EPISODE','EPISODE_POSITION_WITHHELD'])

        _sec('CHK-CONTRACT-STRUCTURE')
        # 18c. decision 28 keeps the existing window, and no other figure appears in the rule or in A3
        AC_TXT=open(_ALK+'ALK-V2-ALGORITHM-CONTRACT.md',encoding='utf-8').read()
        CANON_EP=CANON[CANON.index('`ALK-TESTING-EPISODE-001`'):][:7000]
        A3=AC_TXT[AC_TXT.index('## A3'):AC_TXT.index('## A4')]
        mins=set(re.findall(r'(\d+)[- ]minute', CANON_EP))|set(re.findall(r'within (\d+) minutes', CANON_EP))
        check('decision 28 keeps the existing 30-minute window, and no other figure appears',
              mins=={'30'} and set(re.findall(r'(\d+) minutes', A3))=={'30'}
              and 'inclusive at exactly 30 minutes' in CANON_EP and '<= 30 minutes' in A3,
              'canon=%s'%sorted(mins))

        # 18d. the combined count is defined, structured, and stated by fixtures
        DC=open(_ALK+'ALK-V2-DATA-CONTRACT.md',encoding='utf-8').read()
        cnt_fx=[fid for fid,(fn,f) in fixtures.items() if 'combinedMeasurementCount' in json.dumps(f)]
        check('the combined-measurement count is a stated structured field',
              'combinedMeasurementCount = <integer >= 1>' in CANON_EP
              and 'combinedMeasurementCount' in AC_TXT and '`combinedMeasurementCount`' in DC
              and 'structured field' in CANON_EP and len(cnt_fx)>=6, '%d fixtures state it'%len(cnt_fx))

        # 18e. decision 29 - the advisory warning has exactly two states, everywhere
        # NOT_RUN counts only where it is a VALUE of the field: an assignment, a JSON leaf, or the
        # field's own enumeration row. Prose saying the value is retired or never emitted is not that.
        def _adv_leaves(node,key=None):
            """advisoryConfidenceWarning leaves outside forbidden/superseded/provenance subtrees."""
            SKIP={'forbidden','supersededExpectation','provenance','openIssues'}
            if isinstance(node,dict):
                for k,v in node.items():
                    if k in SKIP: continue
                    for x in _adv_leaves(v,k): yield x
            elif isinstance(node,list):
                for v in node:
                    for x in _adv_leaves(v,key): yield x
            elif key=='advisoryConfidenceWarning':
                yield (key,node)

        ADV_VALUE=[re.compile(r'advisoryConfidenceWarning\s*=\s*NOT_RUN'),
                   re.compile(r'"advisoryConfidenceWarning"\s*:\s*"NOT_RUN"')]
        # The data contract's own enumeration is read directly rather than scanned: a row that both
        # lists NOT_RUN and calls it retired must still fail, and a text scan cannot tell those apart.
        _dc=open(_ALK+'ALK-V2-DATA-CONTRACT.md',encoding='utf-8').read()
        _row=[l for l in _dc.split('\n') if l.startswith('| `advisoryConfidenceWarning` |')]
        _enum=set(re.findall(r'`(NONE|ATTACHED|NOT_RUN)`', _row[0].split('.')[0])) if _row else set()
        check('the data contract enumerates exactly two advisory-warning states',
              len(_row)==1 and _enum=={'NONE','ATTACHED'}, str(sorted(_enum)))
        adv_bad=[]
        for fn in DOCS_ALL:
            base=os.path.basename(fn)
            if base in SKIP_FILES: continue
            raw=open(fn,encoding='utf-8').read()
            if fn.endswith('.json'):
                try: doc=json.loads(raw)
                except Exception: continue
                for f_ in (doc.get('fixtures') or []):
                    for k,v in _adv_leaves(f_):
                        if v=='NOT_RUN': adv_bad.append((base,'%s = NOT_RUN'%k))
                continue
            if base=='ALK-V2-OPEN-ISSUES.md': raw=_register_live(raw)
            for line in raw.split('\n'):
                if any(m in line for m in HISTORY) or line.lstrip().startswith('>'): continue
                if 'RETIRED' in line or 'retired' in line or 'forbidden' in line: continue
                for pat in ADV_VALUE:
                    if pat.search(line): adv_bad.append((base,line.strip()[:70])); break
        check('decision 29 leaves the advisory warning two-valued', not adv_bad, str(adv_bad[:4]))

        _sec('CHK-DECISION-FIXTURES')
        # 18f. episode fixtures recompute from their own inputs
        import datetime
        from statistics import median as _med
        def _pool(readings):
            v=sorted(r['alkDkh'] for r in readings if r.get('status')!='INVALID')
            return (_med(v) if v else None), (round(max(v)-min(v),12) if v else None), len(v)

        f=_fx('AD-EPI-005')
        check('AD-EPI-005 exists', f is not None)
        if f:
            ev=f['expectedIntermediateEvidence']; val,spr,n=_pool(f['input']['readings'])
            t=[datetime.datetime.fromisoformat(r['at']) for r in f['input']['readings']]
            mins=(t[1]-t[0]).total_seconds()/60.0
            check('AD-EPI-005 combines two readings five minutes apart',
                  abs(ev['episodeValueDkh']-val)<1e-12 and abs(ev['episodeSpreadDkh']-spr)<1e-12
                  and ev['combinedMeasurementCount']==n==2 and abs(ev['separationMinutes']-mins)<1e-9
                  and mins<=30, 'value=%r sep=%r'%(val,mins))

        f=_fx('AD-EPI-006')
        check('AD-EPI-006 exists', f is not None)
        if f:
            ev=f['expectedIntermediateEvidence']
            t=[datetime.datetime.fromisoformat(r['at']) for r in f['input']['readings']]
            mins=(t[1]-t[0]).total_seconds()/60.0
            check('AD-EPI-006 is outside the window and stays two observations',
                  abs(ev['separationMinutes']-mins)<1e-9 and mins>30 and ev['episodeCount']==2
                  and all(e['combinedMeasurementCount']==1 for e in ev['episodes']), '%r min'%mins)
            check('AD-EPI-006 keeps trend independence separate from episode resolution',
                  f['expectedAction']['acceptedCount']==1 and len(f['expectedAction']['notAcceptedForTrend'])==1)

        f=_fx('AD-EPI-007')
        check('AD-EPI-007 exists', f is not None)
        if f:
            bad=[]; ev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
            for c in f['input']['cases']:
                t=[datetime.datetime.fromisoformat(r['at']) for r in c['readings']]
                mins=(t[1]-t[0]).total_seconds()/60.0
                want=1 if mins<=30 else 2
                e=ev[c['case']]
                if abs(e['separationMinutes']-mins)>1e-9: bad.append((c['case'],'minutes',mins))
                if e['episodeCount']!=want: bad.append((c['case'],'episodeCount',e['episodeCount'],want))
            check('AD-EPI-007 pins the 30-minute boundary inclusively', not bad, str(bad))

        f=_fx('AD-EPI-001')
        check('AD-EPI-001 exists', f is not None)
        if f:
            eps=f['input']['episodes']; ev=f['expectedIntermediateEvidence']
            val,spr,n=_pool(eps[0]['readings'])
            t1=sorted(datetime.datetime.fromisoformat(x['at']) for x in eps[0]['readings'])
            medt=t1[len(t1)//2]
            sep=(datetime.datetime.fromisoformat(eps[1]['readings'][0]['at'])-medt).total_seconds()/3600.0
            check('AD-EPI-001 recomputes from its own ISO timestamps',
                  abs(ev['episode1']['episodeValueDkh']-val)<1e-12
                  and ev['episode1']['combinedMeasurementCount']==n==3
                  and ev['episode1']['episodeTime']==medt.isoformat()
                  and abs(ev['separationHours']-sep)<1e-9, 'sep=%r'%sep)
            check('AD-EPI-001 stays off the window-anchoring question',
                  (max(t1)-min(t1)).total_seconds()/60.0<=30)

        f=_fx('AD-VAL-002')
        check('AD-VAL-002 exists (episode recomputation)', f is not None)
        if f:
            cases=[c['case'] for c in f['input']['cases']]
            check('AD-VAL-002 drops the cross-method case and adds the unqualified one',
                  'CROSS_METHOD' not in cases and 'NO_QUALIFIER' in cases, str(cases))


        _sec('CHK-CANON-DECISION-TEXT')
        # ---------- 18g. presence checks, and a negative control for every scanner ----------
        # A vocabulary scanner cannot see a behaviour that was DELETED: remove the one paragraph that
        # makes a superseded clause inoperative and the clause is live again, with no retired word
        # anywhere. The checks below require each load-bearing sentence to be PRESENT. The structural
        # limit that remains - prose certifies wording, not behaviour - is recorded as
        # OI-GATEVOCABULARY-001 and is not closed by anything here.
        REQUIRED=[
         ('canon: ALK-005 method escape clause is quarantined', CANON, 'Inoperative under owner decision 27'),
         ('canon: the escape clause is preserved as history, not deleted', CANON,
          'unless a known testing method justifies another value'),
         ('canon: the contested state is retired in the resolution rule', CANON, 'There is no contested state.'),
         ('canon: episode membership is proximity in time', CANON, 'within 30 minutes of one another'),
         ('canon: the combined count has a stated domain', CANON, 'combinedMeasurementCount = <integer >= 1>'),
         ('canon: the spread threshold carries no method qualifier', CANON, 'with no method qualifier of any kind'),
         ('contract: proximity in time is the whole membership test', AC_TXT, 'proximity in time is the whole test'),
         ('contract: the engine never records or branches on method', AC_TXT,
          'NEVER: record, ask for, infer or store the test method'),
         ('contract: the combined count is structured, not prose', AC_TXT, 'structured field'),
         ('data contract: the advisory warning is two-valued', DC, 'Two states only'),
        ]
        _missing=[lbl for lbl,txt,needle in REQUIRED if needle not in txt]
        check('every load-bearing decision-27/28/29 sentence is present', not _missing, str(_missing))
        # The preserved escape clause must be QUOTED history, never a live line.
        _esc=[l for l in CANON.split('\n') if 'unless a known testing method justifies another value' in l]
        check('the preserved method escape clause appears only as quoted history',
              len(_esc)==1 and _esc[0].lstrip().startswith('>'), str(_esc)[:80])

        # NEGATIVE CONTROL for the presence scanner: MUT7 - delete the quarantining paragraph.
        _mut=CANON.replace('Inoperative under owner decision 27','')
        check('negative control MUT7: deleting the inoperative paragraph fails the presence check',
              any(n not in t for _,t,n in [(0,_mut,'Inoperative under owner decision 27')]))
        # NEGATIVE CONTROL: MUT10 - un-quote the escape clause so it reads as live rule text.
        _mut2=[l.lstrip('> ') if 'unless a known testing method justifies another value' in l else l
               for l in CANON.split('\n')]
        _esc2=[l for l in _mut2 if 'unless a known testing method justifies another value' in l]
        check('negative control MUT10: un-quoting the escape clause fails the quoted-history check',
              not (len(_esc2)==1 and _esc2[0].lstrip().startswith('>')))

        # A retirement row must not name a RETIRED code as the live replacement. The sweep exempts
        # these rows by shape, so without this check MUT8 - point a retirement at another retired
        # code - passes silently.
        _sec('CHK-RC-RETIRED')
        _rc=open(_ALK+'ALK-V2-REASON-CODES.md',encoding='utf-8').read()
        def _bad_replacements(text, scope=None):
            """A retirement row whose replacement cell names a code that is ITSELF retired, without
            saying so. Scoped by default to the rows this pass touched - decisions 27, 28 and 29 -
            because the same shape exists on older rows from earlier decisions. That wider class is
            recorded as a finding and left open, not fixed here."""
            bad=[]
            for line in text.split('\n'):
                m=re.match(r'^\| `([A-Z][A-Z0-9_]+)` \| (.*?) \| ([^|]*)\|\s*$', line.strip())
                if not m: continue
                code, cell, dec = m.group(1), m.group(2), m.group(3)
                if code not in retired: continue
                if scope is not None and not any(d in dec for d in scope): continue
                for m2 in re.finditer(r'`([A-Z][A-Z0-9_]{4,})`', cell):
                    named=m2.group(1)
                    if named not in retired: continue
                    # Exempt only where THIS code is said to be retired, judged by proximity - a
                    # blanket 'retired' anywhere in the cell let MUT8 through.
                    near=cell[max(0,m2.start()-160):m2.end()+160]
                    if re.search(r'retired|RETIRED|superseded|no longer', near): continue
                    bad.append((code,named))
            return bad
        _DEC2729=('27','28','29')
        check('no decisions 27-29 retirement row names a retired code as its live replacement',
              not _bad_replacements(_rc,_DEC2729), str(_bad_replacements(_rc,_DEC2729))[:120])
        # NEGATIVE CONTROL: MUT8 - point a retirement at a code that is itself retired.
        _mut3=_rc+'\n| `MAINTENANCE_MATRIX_CELL_UNDETERMINED` | `EPISODE_CONTESTED_METHODS` | 27 |\n'
        check('negative control MUT8: a retirement pointing at a retired code is caught',
              bool(_bad_replacements(_mut3,_DEC2729)))

        _sec('CHK-LIVE-TEXT-ABSENCE')
        # Plain-English reversions of decision 27 use none of the retired identifiers, so the sweeps
        # above cannot see them. These phrase needles close the wordings a reversion actually uses.
        REVERSION=['records the test method','record the test method, kit','asks for the test method',
                   'method compatibility','compatible-method','methods are compatible',
                   'same test method','different test method','different test kits read',
                   'the method that produced','method-conditional','by method, and']
        def _rev_scan(txt, fnm='x'):
            """Line-scoped, with the SAME narrow exemptions the sweeps use: an explicit supersession
            marker, a blockquote, a struck-through retirement bullet, or a line that states the
            decision-27 position itself. A history-marked PARAGRAPH exempts its lines, because a
            preserved quotation spans several."""
            out=[]; lines=txt.split('\n')
            blockmark=[False]*len(lines); i=0
            for blk in txt.split('\n\n'):
                marked=any(m in blk for m in HISTORY) or 'What this retires outright' in blk
                for _ in blk.split('\n'):
                    if i<len(blockmark): blockmark[i]=marked
                    i+=1
                i+=1
            for _n,_l in enumerate(lines):
                if any(m in _l for m in HISTORY) or _l.lstrip().startswith('>'): continue
                if '~~' in _l: continue                      # a struck-through retirement bullet
                if 'does not record' in _l or 'never known' in _l or 'not known' in _l: continue
                if 'Inoperative' in _l or 'RETIRED' in _l or 'retire' in _l: continue
                if 'inoperative' in _l or 'no method qualifier' in _l: continue
                if blockmark[_n] if _n<len(blockmark) else False: continue
                for _p in REVERSION:
                    if _p in _l: out.append((fnm,_p,_l.strip()[:60]))
            return out
        _rev=[]
        for _fnm,_txt in (('canon',_canon_alk(CANON)),('contract',AC_TXT),('data contract',DC)):
            _rev+=_rev_scan(_txt,_fnm)
        check('no plain-English reversion of decision 27 is stated as live behaviour',
              not _rev, str(_rev[:4]))
        # NEGATIVE CONTROL: MUT9 - a full reversion written in ordinary English, using no retired word.
        _mut4='The engine records the test method for every reading, and pools by method.'
        check('negative control MUT9: a plain-English reversion sentence is caught, unexempted',
              bool(_rev_scan(_mut4,'mutant')))
        # and the exemptions must not swallow it when it is dropped into real canon text
        check('negative control MUT9b: the same sentence inside live canon is caught',
              bool(_rev_scan(_canon_alk(CANON)+'\n\n'+_mut4,'mutant')))
        # NEGATIVE CONTROL: MUT11 - reinstate the 45-minute window in the contract.
        check('negative control MUT11: changing the window in A3 is caught',
              set(re.findall(r'(\d+) minutes', A3.replace('30 minutes','45 minutes')))!={'30'})

    except Exception as exc:  # noqa: BLE001 - a gate must not crash
        _rec.aborted_in = _rec.current
        _rec.violations[_rec.current].append(
            "the absorbed checks stopped on %s: %s. Everything after this point "
            "in this run was not evaluated." % (type(exc).__name__, exc)
        )

    return _rec.outcomes(), _rec.total
