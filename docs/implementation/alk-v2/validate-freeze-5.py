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
 'ALK-EPISODE-RESOLUTION-001','ALK-EPISODE-SINGLE-OUTPUT-001','ALK-DECIMAL-THRESHOLD-001']
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
retired=set(re.findall(r'^\| `([A-Z][A-Z0-9_]+)` \|', RC.split('## Retired by')[1].split('## Appendix')[0], re.M))
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
 'D18':['OI-CROSSMETHOD-001','OI-DECIMALTHRESHOLD-001'],'D19':['OI-EPISODECONSUMER-001']}
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
 'OI-DECIMALTHRESHOLD-001','OI-EPISODECONSUMER-001']
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
check('exactly 5 owner-decision 16-19 resolution boxes', n_d==5, str(n_d))

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
check('invariant bodies match the coverage total', n==69 and '| **Total** | **69** |' in INV, str(n))

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
       ('ALK-HIGH-BREACH-SAFETY-SIZING-001','D_{established}'),
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
        if (f.get('expectedIntermediateEvidence') or {}).get('observedSlopeDkhPerDay') is not None:
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

# 15a. decision 16 - D_safety,temp = max(0, D_established - R_down/P), recomputed per case
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
        rate=max(0.0, c['establishedDoseMlPerDay']-rdd)
        for key,val in (('rDownDkh',rd),('rDownAsDoseMlPerDay',rdd)):
            if abs(cev[name][key]-val)>1e-9: bad.append((name,key,cev[name][key],val))
        if abs(cac[name]['temporarySafetyRateAdvisoryMlPerDay']-rate)>1e-9:
            bad.append((name,'advisory',cac[name]['temporarySafetyRateAdvisoryMlPerDay'],rate))
        cmd=_round_to(rate, INC)
        if cmd is None or abs(cac[name]['temporarySafetyPumpCommandMlPerDay']-cmd)>1e-9:
            bad.append((name,'pumpCommand',cac[name].get('temporarySafetyPumpCommandMlPerDay'),cmd))
        if c['consumptionDkhPerDay']>=0: bad.append((name,'C_estimate must be negative on this path'))
    check('AD-SAF-007 sizing recomputes from D_established - R_down/P_selected', not bad, str(bad[:4]))
    # varies with A_now until the rail binds, then saturates
    sweep=['SWEEP_11_05','SWEEP_11_20','SWEEP_11_30','SWEEP_11_80_RAIL']
    rates=[cac[n]['temporarySafetyRateAdvisoryMlPerDay'] for n in sweep]
    check('AD-SAF-007 safety rate strictly decreases as A_now rises below the rail',
          rates[0]>rates[1]>rates[2], str(rates))
    check('AD-SAF-007 R_down saturates at the 0.50 rail', abs(rates[2]-rates[3])<1e-12
          and abs(cev['SWEEP_11_80_RAIL']['rDownDkh']-0.50)<1e-12, str(rates[2:]))
    check('AD-SAF-007 floors at zero only when the established dose cannot absorb R_down',
          cac['FLOOR']['temporarySafetyRateAdvisoryMlPerDay']==0
          and cin['FLOOR']['establishedDoseMlPerDay']<=cev['FLOOR']['rDownAsDoseMlPerDay'])
    # the materiality boundary must not move the delivered rate by more than the dose step
    step=(cin['NOT_MATERIAL']['establishedDoseMlPerDay']-cin['MATERIAL']['establishedDoseMlPerDay'])
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
    for d in f['input']['establishedDoseSweepMlPerDay']:
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

print()
print('%d checks failed' % len(fails))
if fails:
    for f in fails: print('  FAILED:', f)
sys.exit(1 if fails else 0)
