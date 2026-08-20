#!/usr/bin/env python3
"""Mechanical validation of the Alk V2 package after ALK_V2_FREEZE_5.

Run from anywhere:  python3 docs/implementation/alk-v2/validate-freeze-5.py

Every check prints PASS/FAIL and the numbers it used. Exit 1 on any FAIL.

This checker was shown to FAIL on five deliberate mutations before it was
trusted as a gate; the mutations and their outputs are recorded in
docs/process/runs/2026-08-20-alk-v2-freeze-5.md. A checker never shown to
fail is not a gate (CORE-CANON-COVERAGE-001 item 9)."""
import json, re, glob, os, sys, collections

import pathlib
R=str(pathlib.Path(__file__).resolve().parents[2].parent)+'/'
CANON=open(R+'docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md',encoding='utf-8').read()
FIXDIR=R+'docs/implementation/alk-v2/fixtures/'
DOCS=glob.glob(R+'docs/implementation/alk-v2/*.md')
fails=[]
def check(name, ok, detail=''):
    print(('PASS  ' if ok else 'FAIL  ')+name+(('  — '+detail) if detail else ''))
    if not ok: fails.append(name)

# ---------- 1. JSON well-formedness ----------
jsons={}
for fn in glob.glob(R+'docs/implementation/alk-v2/**/*.json', recursive=True):
    try: jsons[fn]=json.load(open(fn,encoding='utf-8'))
    except Exception as e: check('json parse '+os.path.basename(fn), False, str(e))
check('all package JSON parses', len(jsons)==len(glob.glob(R+'docs/implementation/alk-v2/**/*.json',recursive=True)),
      '%d files'%len(jsons))

# ---------- 2. fixture corpus ----------
FILES=['canon-worked-goldens-round1.json','canon-worked-goldens-round2.json',
       'canon-worked-goldens-external.json','canon-named-goldens.json',
       'adversarial.json','invariants-and-governance.json']
fixtures={}
for fn in FILES:
    for f in jsons[FIXDIR+fn]['fixtures']:
        fid=f['fixtureId']
        if fid in fixtures: check('duplicate fixture id', False, fid)
        fixtures[fid]=(fn,f)
idx=jsons[FIXDIR+'index.json']
check('index fixture count matches bodies', idx['totals']['fixtures']==len(fixtures),
      'index=%d bodies=%d'%(idx['totals']['fixtures'],len(fixtures)))
check('index ids resolve 1:1', set(idx['fixtureIds'])==set(fixtures) and len(idx['fixtureIds'])==len(fixtures))
check('index reports no duplicates', idx['duplicateFixtureIds']==[])
prov=collections.Counter(f.get('provenance',{}).get('class') for _,f in fixtures.values())
check('index provenance split matches bodies', dict(prov)=={k:v for k,v in idx['byProvenance'].items()},
      str(dict(prov)))

# ---------- 3. canon authority stamped everywhere ----------
bad=[fn for fn in glob.glob(FIXDIR+'*.json')
     if 'ALK_V2_FREEZE_5' not in open(fn,encoding='utf-8').read()]
check('every fixture file stamps ALK_V2_FREEZE_5', not bad, str([os.path.basename(b) for b in bad]))
check('no ALK_V2_FREEZE_4 left in the package',
      not [fn for fn in glob.glob(R+'docs/implementation/alk-v2/**/*',recursive=True)
           if os.path.isfile(fn) and not fn.endswith('.py')
           and 'ALK_V2_FREEZE_4' in open(fn,encoding='utf-8',errors='ignore').read()
           and os.path.basename(fn) not in ('ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md',
                                             'README.md','ALK-V2-RULE-TRACEABILITY.md')],
      'historical references in the register, review, README and traceability notes are exempt')

# ---------- 4. new canon rule IDs have bodies and are referenced ----------
NEW_RULES=['ALK-INDEPENDENT-SELECTION-001','ALK-SUSPECT-DETECTION-001','ALK-NEGATIVE-MATERIALITY-001',
 'ALK-RETURN-ELIGIBLE-TRAJECTORY-001','ALK-TOWARD-RANGE-HOLD-001','ALK-RAPID-BASIS-001',
 'ALK-RETURN-TERMINATED-BY-SAFETY-001','ALK-RETEST-SCHEDULER-001',
 'ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001','ALK-SAFETY-TEMP-RATE-RESOLUTION-001',
 'ALK-HIGH-BREACH-NO-PAUSE-001','ALK-SAME-TIMESTAMP-COALESCE-001',
 # owner decisions 16-19
 'ALK-HIGH-BREACH-SAFETY-SIZING-001','ALK-REPEAT-SPREAD-DOMAIN-001','ALK-TESTING-EPISODE-001',
 'ALK-EPISODE-RESOLUTION-001','ALK-EPISODE-SINGLE-OUTPUT-001','ALK-DECIMAL-THRESHOLD-001',
 # owner decisions 20-22
 'ALK-DELIVERY-RATE-BASIS-001','ALK-ADVISORY-RANGE-BOUNDARY-001',
 'ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001']
for rid in NEW_RULES:
    # a body = the id on its own line as a backticked marker in the canon
    body = re.search(r'^`'+re.escape(rid)+r'`\s*$', CANON, re.M) is not None
    check('canon body for '+rid, body)
trace=jsons[R+'docs/implementation/alk-v2/traceability/alk-v2-traceability.json']
tids={r['id'] for g in trace['groups'] for r in g['rules']}
missing=[r for r in NEW_RULES if r not in tids]
check('every new rule is inventoried in traceability', not missing, str(missing))

# ---------- 5. traceability integrity ----------
rules=[r for g in trace['groups'] for r in g['rules']]
check('traceability totals match rows', trace['totals']['rules']==len(rules), '%d'%len(rules))
check('one owner per rule (single-valued, in vocabulary)',
      all(isinstance(r['owner'],str) and ',' not in r['owner'] for r in rules))
dupids=[k for k,v in collections.Counter(r['id'] for r in rules).items() if v>1]
check('no duplicate rule ids', not dupids, str(dupids))
check('no rule without a fixture', trace['totals']['rulesWithoutFixture']==[], str(trace['totals']['rulesWithoutFixture']))
check('no BLOCKED rows remain', not [r for r in rules if r['activeInAlkOnlyV2'].startswith('BLOCKED')])

# every fixture id named in traceability must exist
fixref=set()
for r in rules:
    for tok in re.findall(r'\b((?:WG-ALK|ALK-G|AD-[A-Z]+|INV-[A-Z0-9]+|X-[A-Z]+|CLU|VAL|SEG|TRD|EVD|INT|RET|RSP|MNT|CON|CAP|POT|SAF|RTN|WC|COR|CFG|TIME|POS)[-0-9A-Za-z]*)', r['fixtures']):
        fixref.add(tok)
committed={k for k in fixtures}
unknown=sorted(x for x in fixref if x not in committed and not re.match(r'^(CLU|VAL|SEG|TRD|EVD|INT|RET|RSP|MNT|CON|CAP|POT|SAF|RTN|WC|COR|CFG|TIME|POS)-\d', x) and not x.startswith('INV-') and 'module' not in x)
check('traceability fixture refs resolve (goldens)', not unknown, str(unknown[:10]))

# ---------- 6. reason codes: closed set, no retired code emitted ----------
RC=open(R+'docs/implementation/alk-v2/ALK-V2-REASON-CODES.md',encoding='utf-8').read()
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
check('catalogue and retired sets are disjoint', not (catalogue & retired), str(catalogue & retired))
emitted=collections.Counter()
for fid,(fn,f) in fixtures.items():
    for c in f.get('expectedReasonCodes',[]) or []: emitted[c]+=1
    for c in (f.get('variant',{}) or {}).get('expectedReasonCodes',[]) or []: emitted[c]+=1
unlisted=sorted(c for c in emitted if c not in catalogue)
check('every emitted reason code is catalogued', not unlisted, str(unlisted))
emitted_retired=sorted(c for c in emitted if c in retired)
check('no retired reason code is emitted by a fixture', not emitted_retired, str(emitted_retired))
# retired codes must not appear as required codes anywhere in the package prose either
leak=[]
for d in DOCS:
    if os.path.basename(d) in ('ALK-V2-REASON-CODES.md','ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md'): continue
    t=open(d,encoding='utf-8').read()
    for line in t.split('\n'):
        if 'Negative control' in line or 'negative control' in line: continue
        for c in retired:
            if c in line: leak.append((os.path.basename(d),c))
check('no retired code referenced as live in the specs', not leak, str(leak[:6]))

# ---------- 7. Freeze-5 decision coverage: positive + negative control ----------
DEC={'F5-01':['OI-INDEPENDENCE-001'],'F5-02':['OI-SUSPECT-001','OI-MADFLOOR-001'],
 'F5-03':['OI-NEGCONS-001'],'F5-04':['OI-RETURNOFFER-001'],'F5-05':['OI-BELOWRISING-001'],
 'F5-06':['OI-LIQUIDGUARD-001'],'F5-07':['OI-RAPIDBASIS-001'],'F5-08':['OI-RETURNDURINGSAFETY-001'],
 'F5-09':['OI-RETEST-001'],'F5-10':['OI-WATERCHANGE-001'],'F5-11':['OI-SAFETYRATE-001'],
 'F5-12':['OI-CONFIDENCE-001'],'F5-13':['OI-HIGHBREACHBAND-001'],'F5-14':['OI-CLUSTERTIE-001'],
 'F5-15':['OI-RETESTFLOOR-001'],
 'D16':['OI-HIGHBREACHSIZING-001'],'D17':['OI-EPISODE-001'],
 'D18':['OI-CROSSMETHOD-001','OI-DECIMALTHRESHOLD-001'],'D19':['OI-EPISODECONSUMER-001'],
 'D20':['OI-DELIVERYRATEBASIS-001'],'D21':['OI-SIZINGFLAT-001'],'D22':['OI-UNCOMPUTABLEC-001']}
for dec,ois in DEC.items():
    pos=[fid for fid,(fn,f) in fixtures.items()
         if any(any(o in s for s in (f.get('openIssues') or [])) for o in ois)]
    neg=[fid for fid in pos if fixtures[fid][1].get('forbidden') or fixtures[fid][1].get('variant')]
    check('%s has a positive fixture'%dec, bool(pos), ','.join(sorted(pos)))
    check('%s has a negative control'%dec, bool(neg), ','.join(sorted(neg)))

# ---------- 8. every resolved OI is marked RESOLVED in the register ----------
OI=open(R+'docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md',encoding='utf-8').read()
RESOLVED=['OI-INDEPENDENCE-001','OI-SUSPECT-001','OI-MADFLOOR-001','OI-NEGCONS-001','OI-RETEST-001',
 'OI-RETURNOFFER-001','OI-BELOWRISING-001','OI-WATERCHANGE-001','OI-LIQUIDGUARD-001','OI-SAFETYRATE-001',
 'OI-RETURNDURINGSAFETY-001','OI-RAPIDBASIS-001','OI-CONFIDENCE-001',
 'OI-HIGHBREACHBAND-001','OI-CLUSTERTIE-001','OI-RETESTFLOOR-001']
DECIDED_16_19=['OI-HIGHBREACHSIZING-001','OI-EPISODE-001','OI-CROSSMETHOD-001',
 'OI-DECIMALTHRESHOLD-001','OI-EPISODECONSUMER-001',
 'OI-DELIVERYRATEBASIS-001','OI-UNCOMPUTABLEC-001']
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
check('exactly 7 owner-decision 16-22 resolution boxes', n_d==7, str(n_d))
for oi in LEFT_OPEN:
    m=re.search(r'^## '+re.escape(oi)+r' — ', OI, re.M)
    if not m: check('register section for '+oi, False); continue
    nxt=OI.find('\n## ', m.end()); nxt = nxt if nxt!=-1 else len(OI)
    seg=OI[m.start():nxt]
    check(oi+' is NOT marked resolved',
          '> **RESOLVED' not in seg and 'RESOLVED by owner decision' not in seg
          and '**Status:** **OPEN.**' in seg and '### Until closed' in seg)
check('OI-SIZINGFLAT-001 is narrowed and says so, without closing',
      'NARROWED by owner decision 21 — this item remains OPEN' in OI)
check('OI-CZERODISCONT-001 records that no branch boundary was moved',
      'no branch boundary\n> was adjusted to reduce it' in OI or
      'no branch boundary was adjusted to reduce it' in OI)

# ---------- 9. no new numeric constant introduced by Freeze 5 ----------
# The Freeze-5 declaration claims no new constant. Compare against the PINNED BASE, not
# HEAD: at the freeze commit HEAD is the freeze itself, so a HEAD comparison is vacuous and
# would pass for a constant this very change introduced.
import subprocess
BASE_COMMIT='acc6615'
base=subprocess.run(['git','show',BASE_COMMIT+':docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md'],
                    capture_output=True,text=True,cwd=R).stdout
check('base canon readable at '+BASE_COMMIT, len(base)>100000, '%d chars'%len(base))
for c in ['1.28','0.10 dKH','0.20 dKH','0.02','24','48','0.50']:
    check('constant %r pre-exists in the BASE canon'%c, c in base)

# ---------- 10. invariant count ----------
INV=open(R+'docs/implementation/alk-v2/ALK-V2-INVARIANTS.md',encoding='utf-8').read()
n=len(re.findall(r'^### INV-', INV, re.M))
check('invariant bodies match the coverage total', n==72 and '| **Total** | **72** |' in INV, str(n))

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
       ('ALK-SAFETY-TEMP-RATE-RESOLUTION-001','temporarySafetyRateAdvisoryMlPerDay'),
       ('ALK-HIGH-BREACH-NO-PAUSE-001','does NOT choose the delivered rate'),
       ('ALK-SAME-TIMESTAMP-COALESCE-001','resolved testing-episode outputs'),
       ('ALK-HIGH-BREACH-SAFETY-SIZING-001','D_{current}'),
       ('ALK-DELIVERY-RATE-BASIS-001','D_{history}'),
       ('ALK-ADVISORY-RANGE-BOUNDARY-001','AdvisoryCeiling = OuterMax + 1.0'),
       ('ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001','jointly exhaustive and mutually exclusive'),
       ('ALK-REPEAT-SPREAD-DOMAIN-001','crossMethodConcordanceThreshold'),
       ('ALK-TESTING-EPISODE-001','SAME TESTING EPISODE'),
       ('ALK-EPISODE-RESOLUTION-001','CONTESTED_METHODS'),
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
    print('INFO  pre-existing rule bodies under the %d-char threshold: %s'
          % (MANIFEST_THRESHOLD_CHARS, thin_old if thin_old else 'none'))
    print('INFO  reported for the owner, not failed: repairing them is outside Freeze 5.')

# ---------- 13. the canon may not instruct the engine to emit a retired code ----------
# A retired code may still appear as PRESERVED HISTORY inside a marked superseded block -
# decisions 16-19 supersede earlier Freeze-5 wording and the canon keeps that wording rather
# than deleting it. History is quoted, so the exemption is exactly "on a blockquote line".
# A retired code on any ordinary line is still a live instruction and still fails.
canon_retired=[]
for line in CANON.split('\n'):
    if line.lstrip().startswith('>'): continue
    for c in retired:
        if c in line: canon_retired.append((c, line.strip()[:60]))
check('canon names no retired reason code outside preserved history',
      not canon_retired, str(sorted(set(x[0] for x in canon_retired))))

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
    INC=f['input']['actuatorIncrementMlPerDay']
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
        if abs(cac[name]['temporarySafetyRateAdvisoryMlPerDay']-rate)>1e-9:
            bad.append((name,'advisory',cac[name]['temporarySafetyRateAdvisoryMlPerDay'],rate))
        cmd=_round_to(rate, INC)
        if cmd is None or abs(cac[name]['temporarySafetyPumpCommandMlPerDay']-cmd)>1e-9:
            bad.append((name,'pumpCommand',cac[name].get('temporarySafetyPumpCommandMlPerDay'),cmd))
        if c['consumptionDkhPerDay']>=0: bad.append((name,'C_estimate must be negative on this path'))
    check('AD-SAF-007 sizing recomputes from D_current - R_down/P_selected', not bad, str(bad[:4]))
    # varies with A_now until the rail binds, then saturates
    sweep=['SWEEP_11_05','SWEEP_11_20','SWEEP_11_30','SWEEP_11_80_RAIL']
    rates=[cac[n]['temporarySafetyRateAdvisoryMlPerDay'] for n in sweep]
    check('AD-SAF-007 safety rate strictly decreases as A_now rises below the rail',
          rates[0]>rates[1]>rates[2], str(rates))
    check('AD-SAF-007 R_down saturates at the 0.50 rail', abs(rates[2]-rates[3])<1e-12
          and abs(cev['SWEEP_11_80_RAIL']['rDownDkh']-0.50)<1e-12, str(rates[2:]))
    check('AD-SAF-007 floors at zero only when the established dose cannot absorb R_down',
          cac['FLOOR']['temporarySafetyRateAdvisoryMlPerDay']==0
          and cin['FLOOR']['currentDoseMlPerDay']<=cev['FLOOR']['rDownAsDoseMlPerDay'])
    # the materiality boundary must not move the delivered rate by more than the dose step
    step=(cin['NOT_MATERIAL']['currentDoseMlPerDay']-cin['MATERIAL']['currentDoseMlPerDay'])
    delta=(cac['NOT_MATERIAL']['temporarySafetyRateAdvisoryMlPerDay']
           -cac['MATERIAL']['temporarySafetyRateAdvisoryMlPerDay'])
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
    rates=f['expectedAction']['temporarySafetyRateAdvisoryMlPerDay']
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
if f:
    a=f['expectedAction']
    r5=a['variant_1_5'].get('temporarySafetyRateAdvisoryMlPerDay')
    r6=a['variant_1_6'].get('temporarySafetyRateAdvisoryMlPerDay')
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
    check('AD-EPI-002 states one contested episode for every case',
          ev['episodeCount']==1 and ev['episodeStatus']=='CONTESTED_METHODS'
          and ev['episodeValueDkh']=='NOT_RUN' and ev['alk005Applied'] is False)
    vals=[r['alkDkh'] for c in f['input']['cases'] for r in c['readings']]
    spread=float(max(vals)-min(vals))
    check('AD-EPI-002 cross-method spread is below ALK-005 and contested anyway',
          abs(ev['crossMethodSpreadDkh']-0.19)<1e-9 and ev['crossMethodSpreadDkh']<0.20,
          '%r'%ev['crossMethodSpreadDkh'])
    forb=f['forbidden']['episodeValueDkh']
    check('AD-EPI-002 forbids the averaged and the order-chosen values',
          11.045 in forb and 10.95 in forb and 11.14 in forb, str(forb))

# 15e. decision 19 - position and rapid read the resolved episode
f=_fx('AD-EPI-003')
check('AD-EPI-003 exists', f is not None)
if f:
    c=f['expectedAction']['CONTESTED_LATEST']
    check('AD-EPI-003 withholds position and outer-bound state on a contested latest episode',
          c['position']=='NOT_RUN' and c['outerBoundState']=='NOT_RUN'
          and c['retest']=='REPEAT_NOW' and c['priorEpisodePromotedToPosition'] is False)
    r=f['expectedAction']['RESOLVED_LATEST']
    reads=[x['alkDkh'] for x in f['input']['cases'][0]['readings']]
    med=sorted(reads)[len(reads)//2] if len(reads)%2 else (sorted(reads)[len(reads)//2-1]+sorted(reads)[len(reads)//2])/2
    check('AD-EPI-003 resolved position is the episode representative value',
          abs(f['expectedIntermediateEvidence']['RESOLVED_LATEST']['episodeValueDkh']-med)<1e-9
          and abs(r['positionDkh']-med)<1e-9 and r['outerBoundState']=='BREACHED_HIGH', '%r'%med)
    forb=f['forbidden']['CONTESTED_LATEST']['positionDkh']
    check('AD-EPI-003 forbids both ordering answers and the older episode',
          10.95 in forb and 11.14 in forb and 10.6 in forb, str(forb))

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
    check('AD-EPI-004 withholds rapidConfirmed on a contested latest episode',
          a['CONTESTED_LATEST']['rapidConfirmed']=='NOT_RUN')
    forb=f['forbidden']['CONTESTED_LATEST']['rapidPairSlopeDkhPerDay']
    check('AD-EPI-004 forbids both member slopes and the older-pair fallback',
          len(forb)==3 and -0.325 in forb and -0.15 in forb)

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

# 17a. D_established is not a live name anywhere outside preserved history --------------
# Decision 20: "D_established must not survive as a live name." A blockquote line, or a line
# carrying its own superseded/amended marker, is preserved history and is exempt.
D_MARKED=('previously named','previously read','Superseded wording','superseded by owner decision',
          'Amended by owner decision','RENAMED by','renamed from','Renamed by',
          'is a **rename, not a behaviour change**','split by','splits `D_established`',
          'as a single name','decision 20 splits','renamed and split','renamed from',
          'appears nowhere as a live name','must not survive as a live name')
# Scope of the exemption. A markdown TABLE ROW is its own unit - a marker in one row must
# not exempt the next - and is exempt only if the row itself carries a marker or names the
# quantity that replaced the old name. Everything else is scoped to its PARAGRAPH, the
# maximal run of non-blank non-table lines, because prose wraps and a marker sentence and
# the name it marks routinely land on different lines.
def _units(text):
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
for fn in sorted(glob.glob(R+'docs/canon/*.md')+glob.glob(R+'docs/implementation/alk-v2/*.md')
                 +glob.glob(R+'docs/implementation/alk-v2/**/*.json', recursive=True)):
    if os.path.basename(fn) in ('ALK-V2-OPEN-ISSUES.md','ALK-V2-ADVERSARIAL-REVIEW.md'): continue
    for unit in _units(open(fn,encoding='utf-8',errors='ignore').read()):
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

# 17b. AD-DHS-001 - the split, recomputed, in both directions ---------------------------
f=_fx('AD-DHS-001')
check('AD-DHS-001 exists', f is not None)
if f:
    inp=f['input']; P=inp['selectedPotencyDkhPerMl']; INC=inp['actuatorIncrementMlPerDay']
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
        got=cac[name]['temporarySafetyRateAdvisoryMlPerDay']
        if abs(got-want_rate)>1e-9: bad.append((name,'rate',got,want_rate))
        if abs(got-wrong_rate)<=1e-9: bad.append((name,'rate is not distinguishable from the D_history form'))
        cmd=_round_to(want_rate, INC)
        if cmd is None or abs(cac[name]['temporarySafetyPumpCommandMlPerDay']-cmd)>1e-9:
            bad.append((name,'pumpCommand',cac[name].get('temporarySafetyPumpCommandMlPerDay'),cmd))
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
        if abs(fb['temporarySafetyRateAdvisoryMlPerDay']-wrong_rate)>1e-9:
            bad.append((name,'forbidden rate is not the reverted value',fb['temporarySafetyRateAdvisoryMlPerDay'],wrong_rate))
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
          a['temporarySafetyRateAdvisoryMlPerDay']=='NOT_RUN'
          and a['temporarySafetyPumpCommandMlPerDay']=='NOT_RUN')
    check('AD-DHS-002 does not emit zero anywhere on the safety path',
          0 not in (a['temporarySafetyRateAdvisoryMlPerDay'], a['temporarySafetyPumpCommandMlPerDay'])
          and a['recommendedDoseMlPerDay']=='WITHHELD'
          and 0 in f['forbidden']['temporarySafetyRateAdvisoryMlPerDay'])
    check('AD-DHS-002 keeps consumption running - the two unknowns are independent',
          abs(a['consumptionDkhPerDay']-(P*inp['doseHistoryMeanMlPerDay']-inp['observedSlopeDkhPerDay']))<1e-9
          and a['consumptionPhysicality']=='NON_PHYSICAL_OR_UNEXPLAINED_GAIN')
    check('AD-DHS-002 still selects a branch - the refusal is not a fourth branch',
          ev['branchSelected']=='B' and abs(ev['rDownDkh']-0.4)<1e-12)
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
          abs(a['temporarySafetyRateAdvisoryMlPerDay']-(inp['currentDoseMlPerDay']-rdd))<1e-9
          and a['sizingInput']=='D_current'
          and abs(a['temporarySafetyPumpCommandMlPerDay']-_round_to(inp['currentDoseMlPerDay']-rdd,inp['actuatorIncrementMlPerDay']))<1e-9)
    check('AD-DHS-003 takes branch B-prime, not branch A with C treated as zero',
          ev['branchSelected']=='B_PRIME'
          and 0 in f['forbidden']['consumptionDkhPerDay']
          and 'NOT_RUN' in f['forbidden']['temporarySafetyRateAdvisoryMlPerDay'])

# 17e. AD-SAF-009 - branch B', recomputed -----------------------------------------------
f=_fx('AD-SAF-009')
check('AD-SAF-009 exists', f is not None)
if f:
    inp=f['input']; a=f['expectedAction']; ev=f['expectedIntermediateEvidence']
    P=inp['selectedPotencyDkhPerMl']; INC=inp['actuatorIncrementMlPerDay']
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
          and _num_eq(a['temporarySafetyRateAdvisoryMlPerDay'], want)
          and _num_eq(a['temporarySafetyPumpCommandMlPerDay'], _round_to(want,INC))
          and a['maintenanceEstimateStatus']=='UNRESOLVED',
          'want %.12f, stated %r'%(want, a['temporarySafetyRateAdvisoryMlPerDay']))
    # [M3] removing B' makes this state select NOTHING; treating C as 0 routes it to A,
    # whose formula gives max(0, (0 - R_down)/P) = 0. Both are named as forbidden.
    check('AD-SAF-009 names both reverted outcomes as forbidden',
          set(ev['branchesAvailable'])=={'A','B','B_PRIME'} and ev['branchSelected']=='B_PRIME'
          and ev['exactlyOneBranchSelected'] is True
          and 'NONE' in f['forbidden']['branchSelected'] and 'A' in f['forbidden']['branchSelected']
          and 0 in f['forbidden']['temporarySafetyRateAdvisoryMlPerDay']
          and inp['currentDoseMlPerDay'] in f['forbidden']['temporarySafetyRateAdvisoryMlPerDay'])
    check('AD-SAF-009 branch A on an uncomputable C would deliver zero, so zero is the tell',
          abs(max(0.0,(0.0-rd)/P))<1e-12)
    check('AD-SAF-009 variant separates an unknown D_current from an uncomputable C',
          f['variant']['input']['currentDoseMlPerDay']=='UNKNOWN'
          and f['variant']['expectedAction']['temporarySafetyRateAdvisoryMlPerDay']=='NOT_RUN'
          and 'SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN' in f['variant']['expectedReasonCodes'])

# 17f. AD-ESC-001 / AD-ESC-002 - the boundary is an OFFSET, and is inclusive -------------
for fid,side in (('AD-ESC-001','high'),('AD-ESC-002','low')):
    f=_fx(fid)
    check(fid+' exists', f is not None)
    if not f: continue
    inp=f['input']; P=inp['selectedPotencyDkhPerMl']
    cin={c['case']:c for c in inp['cases']}
    cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
    cac={c['case']:c for c in f['expectedAction']['cases']}
    bad=[]; boundaries=set()
    for name,c in cin.items():
        if side=='high':
            b=c['outerMaxDkh']+ADVISORY_OFFSET; esc=c['alkDkh']>=b
        else:
            b=c['outerMinDkh']-ADVISORY_OFFSET; esc=c['alkDkh']<=b
        boundaries.add(round(b,9))
        if abs(cev[name][('advisoryCeilingDkh' if side=='high' else 'advisoryFloorDkh')]-b)>1e-12:
            bad.append((name,'boundary',b))
        if cev[name]['escalate']!=esc: bad.append((name,'escalate',cev[name]['escalate'],esc))
        act=cac[name]
        if esc:
            # [M2] a reverted engine emits an ordinary sized rate here; a badly-repaired one
            # emits 0. Both are forbidden, and NOT_RUN is asserted positively.
            if act.get('advisoryRangeEscalation')!='ESCALATED': bad.append((name,'not escalated'))
            for k in ('temporarySafetyRateAdvisoryMlPerDay','temporarySafetyPumpCommandMlPerDay',
                      'recommendedDoseMlPerDay'):
                if k in act and act[k]!='NOT_RUN': bad.append((name,k,act[k]))
                if act.get(k)==0: bad.append((name,k+' is zero - withheld means withheld'))
        else:
            if act.get('advisoryRangeEscalation')!='NONE': bad.append((name,'escalated inside the boundary'))
    check(fid+' boundary recomputes as an offset and the comparison is inclusive', not bad, str(bad[:4]))
    check(fid+' exercises at least two DIFFERENT boundaries, so it cannot pass on a pinned level',
          len(boundaries)>=2, str(sorted(boundaries)))
    check(fid+' preserves the breach classification and the shortened retest through escalation',
          all(cac[n].get('outerBoundState')==('BREACHED_HIGH' if side=='high' else 'BREACHED_LOW')
              for n in cac),
          str({n:cac[n].get('outerBoundState') for n in cac}))

f=_fx('AD-ESC-001')
if f:
    cac={c['case']:c for c in f['expectedAction']['cases']}
    cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
    inp=f['input']; P=inp['selectedPotencyDkhPerMl']
    rdd=0.5/P
    check('AD-ESC-001 immediately below the ceiling still sizes an ordinary rate',
          abs(cac['BELOW_CEILING']['temporarySafetyRateAdvisoryMlPerDay']
              -(inp['currentDoseMlPerDay']-rdd))<1e-9,
          '%r'%cac['BELOW_CEILING']['temporarySafetyRateAdvisoryMlPerDay'])
    check('AD-ESC-001 states the escalation message the decision requires',
          len(cac['AT_CEILING']['escalationMessageStates'])==5
          and any('confirmed by a second test' in x for x in cac['AT_CEILING']['escalationMessageStates'])
          and any('doser should be checked' in x for x in cac['AT_CEILING']['escalationMessageStates'])
          and any('experienced judgement' in x for x in cac['AT_CEILING']['escalationMessageStates']))
    check('AD-ESC-001 forbids exactly the reverted rate at and above the ceiling',
          (inp['currentDoseMlPerDay']-rdd) in f['forbidden']['cases']['AT_CEILING']['temporarySafetyRateAdvisoryMlPerDay']
          and 0 in f['forbidden']['cases']['AT_CEILING']['temporarySafetyRateAdvisoryMlPerDay'])
    check('AD-ESC-001 records that the flat-above-the-rail exposure is NARROWED, not closed',
          any('NARROWED but NOT closed' in x for x in f['openIssues']))

f=_fx('AD-ESC-002')
if f:
    cac={c['case']:c for c in f['expectedAction']['cases']}
    check("AD-ESC-002 keeps the already-authoritative low-breach correction volume through escalation",
          all(abs(cac[n]['safetyCorrectionVolumeMl']-0.5/f['input']['selectedPotencyDkhPerMl'])<1e-9
              for n in ('INSIDE_FLOOR','AT_FLOOR','BELOW_FLOOR')),
          'decision 21 exception: an already-authoritative safety rule that explicitly governs the state still governs')
    check('AD-ESC-002 withholds the engine mL/day guidance while that volume continues',
          cac['AT_FLOOR']['temporarySafetyRateAdvisoryMlPerDay']=='NOT_RUN'
          and cac['AT_FLOOR']['recommendedDoseMlPerDay']=='NOT_RUN')

# 17g. AD-ESC-003 - a contested episode does not bypass the boundary --------------------
f=_fx('AD-ESC-003')
check('AD-ESC-003 exists', f is not None)
if f:
    inp=f['input']; ceil_=inp['outerMaxDkh']+ADVISORY_OFFSET
    cin={c['case']:c for c in inp['cases']}
    cev={c['case']:c for c in f['expectedIntermediateEvidence']['cases']}
    cac={c['case']:c for c in f['expectedAction']['cases']}
    bad=[]
    for name,c in cin.items():
        vals=[r['alkDkh'] for r in c['readings']]
        allbeyond=all(v>=ceil_ for v in vals)
        if cev[name]['everyMemberBeyondBoundary']!=allbeyond: bad.append((name,'allBeyond',vals))
        if cev[name]['episodeStatus']!='CONTESTED_METHODS': bad.append((name,'must be contested'))
        if cev[name]['episodeValueDkh']!='NOT_RUN': bad.append((name,'contested episodes resolve no value'))
        want='ESCALATED' if allbeyond else 'NOT_RUN'
        if cac[name]['advisoryRangeEscalation']!=want: bad.append((name,'escalation',cac[name]['advisoryRangeEscalation'],want))
        if cac[name]['retest']!='REPEAT_NOW': bad.append((name,'REPEAT_NOW is preserved'))
        if cac[name]['position']!='NOT_RUN' or cac[name]['outerBoundState']!='NOT_RUN':
            bad.append((name,'escalation must not reclassify a contested episode'))
    check('AD-ESC-003 escalates an all-beyond contested episode and only that one', not bad, str(bad[:4]))
    check('AD-ESC-003 carries a straddling case, so all-beyond cannot be read as any-beyond',
          cev['STRADDLING']['everyMemberBeyondBoundary'] is False
          and any(v>=ceil_ for v in (r['alkDkh'] for r in cin['STRADDLING']['readings'])))
    fb=f['forbidden']['cases']['ALL_BEYOND']
    check('AD-ESC-003 forbids withheld-as-contested, and forbids manufacturing a member value',
          'NONE' in fb['advisoryRangeEscalation'] and 12.3 in fb['episodeValueDkh']
          and 12.45 in fb['episodeValueDkh'] and 0 in fb['temporarySafetyRateAdvisoryMlPerDay'])

# 17h. INV-G12 - the exhaustiveness invariant exists and says what it must ---------------
f=_fx('INV-G12')
check('INV-G12 exists', f is not None)
if f:
    txt=json.dumps(f)
    check('INV-G12 asserts joint exhaustiveness and mutual exclusion',
          'exactly one branch is selected for every generated state' in txt
          and 'no generated state selects zero branches' in txt
          and 'never two' in f['property'])
    check('INV-G12 carries the B-prime removal as its negative control',
          "Remove the B' branch" in f['negativeControl'] and 'AD-SAF-009' in f['negativeControl'])

# 17i. the new canon rules must not have introduced a second constant -------------------
m=re.search(r'^`ALK-ADVISORY-RANGE-BOUNDARY-001`\s*$', CANON, re.M)
seg=CANON[m.start():m.start()+9000] if m else ''
check('the advisory boundary is defined as an OFFSET from the configured bounds',
      'OuterMax + 1.0' in seg and 'OuterMin - 1.0' in seg
      and 'not a second set of pinned levels' in seg)
check('the advisory boundary declares its inclusive comparison and forbids an epsilon',
      'inclusive at the boundary' in seg and 'no epsilon exists or may be introduced' in seg)
check('the advisory boundary states it does NOT close the flat-above-the-rail item',
      'narrows but does not resolve' in seg)
m=re.search(r'^`ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`\s*$', CANON, re.M)
seg=CANON[m.start():m.start()+9000] if m else ''
check('branch B-prime states it does NOT close the C-zero discontinuity',
      'remains **open**' in seg and 'No\nbranch boundary is adjusted' in seg.replace('\r','')
      or 'No branch boundary is adjusted' in seg)
check('the canon declares the single new constant of decisions 20-22',
      'advisory range offset = 1.0 dKH' in CANON and 'the ONLY new number' in CANON)

print()
print('%d checks failed' % len(fails))
if fails:
    for f in fails: print('  FAILED:', f)
sys.exit(1 if fails else 0)
