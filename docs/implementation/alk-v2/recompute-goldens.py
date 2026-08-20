#!/usr/bin/env python3
"""Independent recomputation of every fixture-stated derived value in the Alk V2 package.

Run:  python3 docs/implementation/alk-v2/recompute-goldens.py [--out PATH] [--label LABEL]

This is the **golden baseline** tool. It exists because Freeze 5 and owner decisions
16-19 repeatedly *asserted* that "no arithmetic moved" without ever demonstrating it. A
claim that a change is arithmetically inert is only checkable against a record of what
the arithmetic was.

What it does, for every fixture in the corpus:

  1. reads the fixture's DECLARED INPUTS in every shape the corpus uses -
     input.timesDays/alkDkh, input.clusterTimesDays/alkDkh, input.twoPointReadings,
     input.clusters[] (the F5-14 shape), input.events[] READING / READING_SERIES
     ledgers, and expectedIntermediateEvidence.seriesAfterCoalescing;
  2. recomputes the trend-statistics family from those inputs - independent-cluster
     selection, Theil-Sen slope, intercept, residuals, MAD, sigma_resid, sigma_point,
     t-bar, Sxx, sigma_S, the 1.28-sigma support subtraction and the supported slope;
  3. recomputes the scalar arithmetic the owner decisions introduced - R_down, the
     dose-equivalent of R_down, the temporary safety rate, the recommended rate, episode
     representative values, spreads, separations, the rapid-pair slope, exact-decimal
     spreads and mass-balance consumption;
  4. writes a machine-readable record of stated-versus-recomputed for every value it
     could reach, and names every fixture that states a derived value it could NOT
     reach.

It does not read the canon and it does not check policy. It answers exactly one
question: does the number the fixture states follow from the numbers the fixture
declares? Everything else is the validator's job.

Exit code is 0 whether or not discrepancies are found - this is a RECORDER, not a gate.
Discrepancies are reported to the owner as baseline findings.
"""
import json, glob, os, sys, collections, datetime, argparse, hashlib
import pathlib
from statistics import median as _med
from decimal import Decimal as _D

R = str(pathlib.Path(__file__).resolve().parents[2].parent) + '/'
FIXDIR = R + 'docs/implementation/alk-v2/fixtures/'
FILES = ['canon-worked-goldens-round1.json', 'canon-worked-goldens-round2.json',
         'canon-worked-goldens-external.json', 'canon-named-goldens.json',
         'adversarial.json', 'invariants-and-governance.json']

TOL = 1e-8          # relative/absolute tolerance for a stated value to count as reproduced
SIGMA_FLOOR = 0.10  # sigma_Alk_base, ALK-SLOPE-UNCERTAINTY-001 (pre-existing constant)
K = 1.28            # ALK_SLOPE_SUPPORT_K (pre-existing constant)
INDEP_H = 24.0      # ALK-008 independence spacing (pre-existing constant)


# ---------------------------------------------------------------- trend statistics
def theil_sen(t, a):
    return _med(sorted((a[j] - a[i]) / (t[j] - t[i])
                       for i in range(len(t)) for j in range(i + 1, len(t))))


def pairwise(t, a):
    return sorted((a[j] - a[i]) / (t[j] - t[i])
                  for i in range(len(t)) for j in range(i + 1, len(t)))


def trend_family(t, a):
    """Every trend intermediate the corpus states, from the accepted cluster series."""
    S = theil_sen(t, a)
    b = _med(sorted(a[i] - S * t[i] for i in range(len(t))))
    resid = [a[i] - (S * t[i] + b) for i in range(len(t))]
    mad = _med(sorted(abs(x) for x in resid))
    s_resid = 1.4826 * mad
    s_point = max(SIGMA_FLOOR, s_resid)
    tbar = sum(t) / len(t)
    sxx = sum((x - tbar) ** 2 for x in t)
    s_S = s_point / sxx ** 0.5
    sub = K * s_S
    supported = (1 if S > 0 else -1 if S < 0 else 0) * max(0.0, abs(S) - sub)
    return {
        'observedSlopeDkhPerDay': S,
        'theilSenSlopeDkhPerDay': S,
        'interceptDkh': b,
        'residualsDkh': resid,
        'madDkh': mad,
        'sigmaResidDkh': s_resid,
        'sigmaPointDkh': s_point,
        'tBarDays': tbar,
        'sxxDay2': sxx,
        'sigmaSDkhPerDay': s_S,
        'supportSubtractionDkhPerDay': sub,
        'supportedSlopeDkhPerDay': supported,
        'independentClusters': len(t),
        'spanDays': t[-1] - t[0],
        'timesDays': list(t),
        'acceptedClusterTimesDays': list(t),
        'pairwiseSlopes': pairwise(t, a),
        'pairwiseSlopesDkhPerDay': pairwise(t, a),
        'pairwiseSlopesSorted': pairwise(t, a),
        'latestIndependentPairSlopeDkhPerDay': (a[-1] - a[-2]) / (t[-1] - t[-2]),
    }


def select_independent(t, a):
    """ALK-INDEPENDENT-SELECTION-001: forward-greedy from the earliest cluster, accepting
    a cluster only when it is at least 24 h from the last ACCEPTED anchor."""
    acc, anchor = [], None
    for i, x in enumerate(t):
        if anchor is None or x - anchor >= (INDEP_H / 24.0) - 1e-12:
            acc.append(i)
            anchor = x
    return [t[i] for i in acc], [a[i] for i in acc], [t[i] for i in range(len(t)) if i not in acc]


# ---------------------------------------------------------------- series readers
def read_series(f):
    """Return (timesDays, alkDkh, shapeName) for every shape the corpus states a series in,
    or (None, None, None). The clusters[] shape was added by F5-14 and was originally
    skipped by the gate, which let a wrong Theil-Sen slope ship in AD-SEG-007."""
    inp = f.get('input') or {}
    a = inp.get('alkDkh')

    t = inp.get('timesDays')
    if isinstance(t, list) and isinstance(a, list) and len(t) == len(a) >= 2:
        return t, a, 'input.timesDays'

    t = inp.get('clusterTimesDays')
    if isinstance(t, list) and isinstance(a, list) and len(t) == len(a) >= 2:
        return t, a, 'input.clusterTimesDays'

    sac = (f.get('expectedIntermediateEvidence') or {}).get('seriesAfterCoalescing')
    if isinstance(sac, dict):
        t, a = sac.get('timesDays'), sac.get('alkDkh')
        if isinstance(t, list) and isinstance(a, list) and len(t) == len(a) >= 2:
            return t, a, 'evidence.seriesAfterCoalescing'

    tp = inp.get('twoPointReadings')
    if isinstance(tp, dict) and 'day0Dkh' in tp and 'day1Dkh' in tp:
        # ALK-011A's sqrt(0.10^2+0.10^2)/dt equals 0.10/sqrt(Sxx) for n=2, so the Sxx
        # form reproduces the two-point basis exactly.
        return [0.0, 1.0], [tp['day0Dkh'], tp['day1Dkh']], 'input.twoPointReadings'

    cl = inp.get('clusters')
    if isinstance(cl, list) and all(isinstance(c, dict) and 'atDay' in c and 'alkDkh' in c for c in cl):
        by = collections.OrderedDict()
        for c in cl:
            by.setdefault(c['atDay'], []).append(c['alkDkh'])
        t = sorted(by)
        a = [_med(sorted(by[x])) for x in t]     # PII-5.4 over the pooled readings
        if len(t) >= 2:
            return t, a, 'input.clusters'

    evs = inp.get('events')
    if isinstance(evs, list):
        pts = []
        for e in evs:
            if not isinstance(e, dict):
                continue
            if e.get('kind') == 'READING' and 'measuredAt' in e and 'rawValueDkh' in e:
                pts.append((e['measuredAt'], e['rawValueDkh']))
            elif e.get('kind') == 'READING_SERIES' and 'startAt' in e and 'valuesDkh' in e:
                try:
                    t0 = datetime.datetime.fromisoformat(e['startAt'])
                except Exception:
                    return None, None, None
                h = e.get('everyHours', 48)
                for i, v in enumerate(e['valuesDkh']):
                    pts.append(((t0 + datetime.timedelta(hours=h * i)).isoformat(), v))
        if len(pts) >= 2:
            try:
                inst = [datetime.datetime.fromisoformat(x) for x, _ in pts]
            except Exception:
                return None, None, None
            t0 = min(inst)
            days = [(x - t0).total_seconds() / 86400.0 for x in inst]
            by = collections.OrderedDict()
            for dd, (_, v) in zip(days, pts):
                by.setdefault(round(dd, 9), []).append(v)
            t = sorted(by)
            a = [_med(sorted(by[x])) for x in t]
            if len(t) >= 2:
                return t, a, 'input.events'

    return None, None, None


# ---------------------------------------------------------------- comparison
# Two spellings state the pairwise-slope multiset without asserting an order: AD-RAP-001
# lists it in pair-index order, AD-SEG-007 in ascending order. Only the `...Sorted`
# spelling asserts the ordering, so only it is compared order-sensitively.
UNORDERED_KEYS = {'pairwiseSlopes', 'pairwiseSlopesDkhPerDay', 'notAcceptedClusterTimesDays'}


def close(stated, got, key=None):
    if isinstance(stated, bool) or isinstance(got, bool):
        return stated is got
    if isinstance(stated, (int, float)) and isinstance(got, (int, float)):
        return abs(stated - got) <= max(TOL, abs(got) * TOL)
    if isinstance(stated, list) and isinstance(got, list):
        if len(stated) != len(got):
            return False
        if key in UNORDERED_KEYS:
            stated, got = sorted(stated), sorted(got)
        return all(close(x, y) for x, y in zip(stated, got))
    return stated == got


def rnd(x, n=12):
    if isinstance(x, float):
        return round(x, n)
    if isinstance(x, list):
        return [rnd(y, n) for y in x]
    return x


class Record:
    def __init__(self):
        self.values = collections.OrderedDict()   # "FIXTURE::path::key" -> recomputed
        self.stated = collections.OrderedDict()
        self.discrepancies = []
        self.unreadable = []
        self.fixtures_recomputed = set()
        self.values_recomputed = 0

    def note(self, fid, path, key, stated, got):
        ref = '%s::%s::%s' % (fid, path, key) if path else '%s::%s' % (fid, key)
        self.values[ref] = rnd(got)
        self.fixtures_recomputed.add(fid)
        self.values_recomputed += 1
        if stated is not None:
            self.stated[ref] = rnd(stated)
            if not close(stated, got, key):
                self.discrepancies.append({'ref': ref, 'fixtureId': fid,
                                           'key': key, 'stated': rnd(stated), 'recomputed': rnd(got)})


def round_to(x, inc):
    """ALK-ROUNDING-001 step 1-3: nearest representable setting; an exact midpoint is
    resolved toward the current dose. A tie is recorded as None so it is never silently
    resolved by this recorder."""
    n = x / inc
    lo = int(n) * inc
    hi = lo + inc
    dlo, dhi = abs(x - lo), abs(hi - x)
    if abs(dlo - dhi) < 1e-12:
        return None
    return round(lo if dlo < dhi else hi, 10)


# ---------------------------------------------------------------- main
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=None)
    ap.add_argument('--label', default='')
    ap.add_argument('--diff', default=None,
                    help='path to a baseline record; report every recomputed value that moved')
    args = ap.parse_args()

    fixtures = collections.OrderedDict()
    for fn in FILES:
        for f in json.load(open(FIXDIR + fn, encoding='utf-8'))['fixtures']:
            fixtures[f['fixtureId']] = (fn, f)

    rec = Record()

    # ---- 1. trend statistics, every readable shape -------------------------------
    for fid, (fn, f) in fixtures.items():
        t, a, shape = read_series(f)
        ev = {**(f.get('expectedIntermediateEvidence') or {}),
              **(f.get('expectedSupportedResult') or {})}
        if t is None:
            trend_keys = [k for k in ('observedSlopeDkhPerDay', 'supportedSlopeDkhPerDay',
                                      'sigmaSDkhPerDay', 'sxxDay2', 'sigmaPointDkh',
                                      'sigmaResidDkh', 'interceptDkh', 'madDkh')
                          if isinstance(ev.get(k), (int, float))]
            if trend_keys:
                rec.unreadable.append({'fixtureId': fid, 'file': fn,
                                       'statedKeys': trend_keys,
                                       'reason': 'no declared t/value series in any readable shape'})
            continue
        tt, aa, rejected = select_independent(t, a)
        if len(tt) < 2:
            continue
        got = trend_family(tt, aa)
        got['notAcceptedClusterTimesDays'] = rejected
        for key, val in got.items():
            if key in ev:
                rec.note(fid, shape, key, ev[key], val)
            elif key in ('observedSlopeDkhPerDay', 'sigmaSDkhPerDay', 'sxxDay2',
                         'sigmaPointDkh', 'supportedSlopeDkhPerDay', 'interceptDkh'):
                rec.note(fid, shape, key, None, val)     # recorded even when unstated

    # ---- 2. owner decision 16 sizing arithmetic ----------------------------------
    f = fixtures.get('AD-SAF-007', (None, None))[1]
    if f:
        P = f['input']['selectedPotencyDkhPerMl']
        ASH = f['input']['safetyDestinationHighDkh']
        INC = f['input']['recommendationPrecisionMlPerDay']
        cev = {c['case']: c for c in f['expectedIntermediateEvidence']['cases']}
        cac = {c['case']: c for c in f['expectedAction']['cases']}
        for name, c in ((c['case'], c) for c in f['input']['cases']):
            rd = min(c['alkDkh'] - ASH, 0.50)
            rdd = rd / P
            # the delivered-rate quantity is whatever the fixture declares as the doser's
            # configured rate; both spellings are read so the record survives the rename
            dose = c.get('currentDoseMlPerDay', c.get('establishedDoseMlPerDay'))
            rate = max(0.0, dose - rdd)
            rec.note('AD-SAF-007', name, 'rDownDkh', cev[name].get('rDownDkh'), rd)
            rec.note('AD-SAF-007', name, 'rDownAsDoseMlPerDay', cev[name].get('rDownAsDoseMlPerDay'), rdd)
            rec.note('AD-SAF-007', name, 'temporarySafetyRateContinuousMlPerDay',
                     cac[name].get('temporarySafetyRateContinuousMlPerDay'), rate)
            cmd = round_to(rate, INC)
            rec.note('AD-SAF-007', name, 'temporarySafetyRateRecommendationMlPerDay',
                     cac[name].get('temporarySafetyRateRecommendationMlPerDay'), cmd)

    f = fixtures.get('AD-SAF-008', (None, None))[1]
    if f:
        P = f['input']['selectedPotencyDkhPerMl']
        e = f['expectedIntermediateEvidence']
        rec.note('AD-SAF-008', '', 'rDownAsDoseMlPerDay', e.get('rDownAsDoseMlPerDay'), e['rDownDkh'] / P)
        rates = f['expectedAction']['temporarySafetyRateContinuousMlPerDay']
        sweep = f['input'].get('currentDoseSweepMlPerDay') or f['input'].get('establishedDoseSweepMlPerDay')
        for d in sweep:
            key = repr(d) if repr(d) in rates else str(d)
            rec.note('AD-SAF-008', key, 'temporarySafetyRateContinuousMlPerDay',
                     rates.get(key), max(0.0, d - e['rDownDkh'] / P))

    # ---- 3. owner decision 17/19 episode arithmetic ------------------------------
    f = fixtures.get('AD-EPI-001', (None, None))[1]
    if f:
        ev = f['expectedIntermediateEvidence']
        eps = f['input']['episodes']
        r1 = [x['alkDkh'] for x in eps[0]['readings']]
        t1 = [datetime.datetime.fromisoformat(x['at']) for x in eps[0]['readings']]
        med = sorted(r1)[len(r1) // 2]
        medt = sorted(t1)[len(t1) // 2]
        rec.note('AD-EPI-001', 'episode1', 'episodeValueDkh', ev['episode1'].get('episodeValueDkh'), med)
        rec.note('AD-EPI-001', 'episode1', 'spreadDkh', ev['episode1'].get('spreadDkh'), max(r1) - min(r1))
        sep = (datetime.datetime.fromisoformat(eps[1]['readings'][0]['at']) - medt).total_seconds() / 3600.0
        rec.note('AD-EPI-001', '', 'separationHours', ev.get('separationHours'), sep)

    f = fixtures.get('AD-EPI-002', (None, None))[1]
    if f:
        ev = f['expectedIntermediateEvidence']['everyCase']
        vals = [r['alkDkh'] for c in f['input']['cases'] for r in c['readings']]
        rec.note('AD-EPI-002', 'everyCase', 'crossMethodSpreadDkh',
                 ev.get('crossMethodSpreadDkh'), float(max(vals) - min(vals)))

    f = fixtures.get('AD-EPI-003', (None, None))[1]
    if f:
        reads = sorted(x['alkDkh'] for x in f['input']['cases'][0]['readings'])
        n = len(reads)
        med = reads[n // 2] if n % 2 else (reads[n // 2 - 1] + reads[n // 2]) / 2
        rec.note('AD-EPI-003', 'RESOLVED_LATEST', 'episodeValueDkh',
                 f['expectedIntermediateEvidence']['RESOLVED_LATEST'].get('episodeValueDkh'), med)
        rec.note('AD-EPI-003', 'RESOLVED_LATEST', 'positionDkh',
                 f['expectedAction']['RESOLVED_LATEST'].get('positionDkh'), med)

    f = fixtures.get('AD-EPI-004', (None, None))[1]
    if f:
        ev = f['expectedIntermediateEvidence']['RESOLVED_NOT_ACCEPTED']
        t0, t1 = ev['rapidPairDays']
        eps = {e['atDay']: e['alkDkh'] for e in f['input']['cases'][0]['episodes']}
        rec.note('AD-EPI-004', 'RESOLVED_NOT_ACCEPTED', 'rapidPairSlopeDkhPerDay',
                 ev.get('rapidPairSlopeDkhPerDay'), (eps[t1] - eps[t0]) / (t1 - t0))

    # ---- 4. owner decision 18 exact-decimal arithmetic ---------------------------
    f = fixtures.get('AD-VAL-002', (None, None))[1]
    if f:
        cev = {c['case']: c for c in f['expectedIntermediateEvidence']['cases']}
        for c in f['input']['cases']:
            reads = [str(x) for x in c['readingsDkh']]
            exact = max(_D(x) for x in reads) - min(_D(x) for x in reads)
            rec.note('AD-VAL-002', c['case'], 'exactDecimalSpreadDkh',
                     cev[c['case']].get('exactDecimalSpreadDkh'), float(exact))

    # ---- 5. mass balance and the materiality boundary, wherever inputs are declared
    # C_estimate = P_selected * D_history - S_observed  (ALK-CONSUMPTION-ESTIMATE-001).
    # D_history is read under every spelling the corpus uses for a declared delivery rate,
    # and S_observed is taken from the fixture's own evidence, its own input, or - where the
    # fixture declares `continuesFrom` - from the fixture it continues.
    def observed_slope(fid, f):
        ev = f.get('expectedIntermediateEvidence') or {}
        inp = f.get('input') or {}
        for src in (ev.get('observedSlopeDkhPerDay'), inp.get('observedSlopeDkhPerDay')):
            if isinstance(src, (int, float)):
                return src, fid
        cont = inp.get('continuesFrom')
        if cont and cont in fixtures and cont != fid:
            return observed_slope(cont, fixtures[cont][1])
        return None, None

    MASS_KEYS = ('pTimesD', 'consumptionDkhPerDay', 'materialityMarginDkhPerDay',
                 'cPlusKSigma', 'materiallyNegative')

    def mass_balance(fid, fn, path, stated, inp, S, sig):
        """Recompute the mass-balance family for one declared (dose, potency) context.

        A stated NOT_RUN is the canonised ABSENCE of a value, not a value the recompute
        failed to reach, so it is skipped rather than reported as unreadable."""
        wanted = [k for k in MASS_KEYS if k in stated and stated[k] != 'NOT_RUN']
        if not wanted:
            return
        def first(*keys):
            """`or`-chaining a lookup treats a legitimate 0 as absent. A D_history that
            integrates to EXACTLY ZERO - the doser off for the whole interval, which is
            precisely the state that accompanies a high breach after an overdose is stopped -
            would fall through to D_current and perform the substitution decision 20
            abolishes, inside the tool that exists to detect it."""
            for k in keys:
                v = inp.get(k)
                if isinstance(v, (int, float)) and not isinstance(v, bool):
                    return v
            return None
        P = first('selectedPotencyDkhPerMl', 'potencyDkhPerMl')
        D = first('doseHistoryMeanMlPerDay', 'doseBasisMlPerDay',
                  'currentDoseMlPerDay', 'establishedDoseMlPerDay')
        pd = first('potencyTimesDoseDkhPerDay')
        if pd is None and isinstance(P, (int, float)) and isinstance(D, (int, float)):
            pd = P * D
        if isinstance(pd, (int, float)) and isinstance(S, (int, float)):
            C = pd - S
        elif isinstance(inp.get('consumptionDkhPerDay'), (int, float)):
            # the fixture declares C_estimate directly as an input rather than a series
            C, pd = inp['consumptionDkhPerDay'], None
        else:
            rec.unreadable.append({'fixtureId': fid, 'file': fn, 'statedKeys': wanted,
                                   'reason': 'P_selected x D_history, or S_observed, is not declared numerically'})
            return
        if 'pTimesD' in stated and pd is None:
            rec.unreadable.append({'fixtureId': fid, 'file': fn, 'statedKeys': ['pTimesD'],
                                   'reason': 'no potency x delivery-rate context is declared'})
        elif 'pTimesD' in stated:
            rec.note(fid, path, 'pTimesD', stated['pTimesD'], pd)
        if 'consumptionDkhPerDay' in stated and pd is not None:
            rec.note(fid, path, 'consumptionDkhPerDay', stated['consumptionDkhPerDay'], C)
        if not isinstance(sig, (int, float)):
            left = [k for k in wanted if k in ('materialityMarginDkhPerDay', 'cPlusKSigma', 'materiallyNegative')]
            if left:
                rec.unreadable.append({'fixtureId': fid, 'file': fn, 'statedKeys': left,
                                       'reason': 'sigma_S is not declared numerically'})
            return
        if 'materialityMarginDkhPerDay' in stated:
            rec.note(fid, path, 'materialityMarginDkhPerDay', stated['materialityMarginDkhPerDay'], K * sig)
        if 'cPlusKSigma' in stated:
            rec.note(fid, path, 'cPlusKSigma', stated['cPlusKSigma'], C + K * sig)
        if 'materiallyNegative' in stated:
            rec.note(fid, path, 'materiallyNegative', stated['materiallyNegative'], (C + K * sig) < 0)

    for fid, (fn, f) in fixtures.items():
        inp = f.get('input') or {}
        ev = f.get('expectedIntermediateEvidence') or {}
        S, sfrom = observed_slope(fid, f)
        sig = inp.get('sigmaSDkhPerDay')
        if sig is None:
            sig = ev.get('sigmaSDkhPerDay')
        path = '' if sfrom == fid else 'S_observed from ' + str(sfrom)

        # top-level shape
        if 'materialityMarginDkhPerDay' in ev and isinstance(sig, (int, float)):
            rec.note(fid, path, 'materialityMarginDkhPerDay', ev['materialityMarginDkhPerDay'], K * sig)
        flat = {k: v for k, v in ev.items() if k in MASS_KEYS and k != 'materialityMarginDkhPerDay'}
        if flat:
            mass_balance(fid, fn, path, flat, inp, S, sig)

        # per-variant / per-case shapes: each states its own delivery-rate context
        sub_ev = {}
        for c in (ev.get('variants') or []):
            sub_ev[c.get('currentDoseMlPerDay', c.get('case'))] = (c, {**inp, **c})
        cin = {c['case']: c for c in (inp.get('cases') or []) if isinstance(c, dict) and 'case' in c}
        for c in (ev.get('cases') or []):
            if isinstance(c, dict) and c.get('case') in cin:
                sub_ev[c['case']] = (c, {**inp, **cin[c['case']]})
        for name, (stated, ctx) in sub_ev.items():
            mass_balance(fid, fn, str(name), stated, ctx, S, sig)

    # ---- 5b. decisions 21 and 22: boundaries, escalation and branch-B' sizing ----------
    # The escalation and B-prime fixtures state R_down, its dose equivalent, sized rates,
    # recommended rates, boundary levels and correction volumes, and the first version of this
    # recorder reached NONE of them - it hard-coded the fixtures it knew about, and reported
    # "0 unreadable" because `unreadable` was only appended for a KNOWN key whose inputs were
    # missing. A stated value in a shape the tool never looked for was invisible rather than
    # reported. Found by the breaker: a fixture stating a 99 mL/day INCREASE at 11.4 dKH
    # passed both tools with the record digest unchanged.
    ADVISORY_OFFSET = _D('1.0')      # decision 21, the only constant decisions 20-22 add

    def case_ctx(f, c):
        return {**(f.get('input') or {}), **c}

    # The list was fixed at five names, so AD-SAF-010 (decision 25) and AD-REC-001
    # (decision 23) - the two fixtures the decisions-23-26 round ADDED - contributed no
    # recorded values and were not reported as unreadable either. A 7.7 mL/day branch-A rate
    # and a 99.9 mL/day recommendation both passed the recorder in silence. Found by the
    # breaker; the coverage assertion at the end of this block is the structural fix.
    for fid in ('AD-ESC-001', 'AD-ESC-002', 'AD-ESC-003', 'AD-SAF-009', 'AD-DHS-003',
                'AD-SAF-010', 'AD-REC-001', 'AD-SAF-005', 'AD-DHS-002'):
        f = fixtures.get(fid, (None, None))[1]
        if not f:
            continue
        inp = f.get('input') or {}
        ev = f.get('expectedIntermediateEvidence') or {}
        act = f.get('expectedAction') or {}

        def _cases(d):
            """Cases come in two shapes in this corpus: a LIST of {case: ...} objects, and a
            MAP keyed by case name. Reading only the list shape silently skipped every
            map-shaped fixture."""
            if not isinstance(d, dict):
                return {}
            v = d.get('cases')
            if isinstance(v, list):
                return {c['case']: c for c in v if isinstance(c, dict) and 'case' in c}
            if isinstance(v, dict):
                return {k: c for k, c in v.items() if isinstance(c, dict)}
            named = {k: c for k, c in d.items()
                     if isinstance(c, dict) and k.isupper() and k not in ('NOTE',)}
            return named

        cin = _cases(inp)
        cev = _cases(ev)
        cac = _cases(act)
        names = sorted(set(cin) | set(cev) | set(cac)) or ['']
        for name in names:
            ctx = case_ctx(f, cin.get(name, {}))
            e = cev.get(name, ev if not name else {})
            a = cac.get(name, act if not name else {})
            P = ctx.get('selectedPotencyDkhPerMl')
            INC = ctx.get('recommendationPrecisionMlPerDay')

            # boundaries, in EXACT DECIMAL - ALK-DECIMAL-THRESHOLD-001 governs the predicate,
            # and computing it in binary64 here would make the recorder agree with a wrong engine
            if isinstance(ctx.get('outerMaxDkh'), (int, float)):
                rec.note(fid, name, 'advisoryCeilingDkh', e.get('advisoryCeilingDkh'),
                         float(_D(repr(ctx['outerMaxDkh'])) + ADVISORY_OFFSET))
            if isinstance(ctx.get('outerMinDkh'), (int, float)):
                rec.note(fid, name, 'advisoryFloorDkh', e.get('advisoryFloorDkh'),
                         float(_D(repr(ctx['outerMinDkh'])) - ADVISORY_OFFSET))

            # R_down, its dose equivalent, the sized rate and the recommended rate
            A = ctx.get('alkDkh')
            ASH = ctx.get('safetyDestinationHighDkh')
            if isinstance(A, (int, float)) and isinstance(ASH, (int, float)) and isinstance(P, (int, float)) \
                    and A > ctx.get('outerMaxDkh', float('inf')):
                rd = min(A - ASH, 0.50)
                rec.note(fid, name, 'rDownDkh', e.get('rDownDkh'), rd)
                rec.note(fid, name, 'rDownAsDoseMlPerDay', e.get('rDownAsDoseMlPerDay'), rd / P)
                dc = ctx.get('currentDoseMlPerDay')
                # WHICH BRANCH sizes the rate decides WHICH FORMULA the recorder must use.
                # Branch A sizes from consumption, max(0, (C_estimate + S_safety)/P) with
                # S_safety = -R_down; B and B' size from D_current. Recomputing the D_current
                # form on a branch-A state does not check the fixture, it contradicts it.
                C = ctx.get('consumptionDkhPerDay')
                phys = ctx.get('consumptionPhysicality')
                branch_a = (phys == 'INTERPRETABLE'
                            or (isinstance(C, (int, float)) and C >= 0 and phys is None))

                rate = None
                if branch_a and isinstance(C, (int, float)):
                    rate = max(0.0, (C - rd) / P)          # branch A
                elif isinstance(dc, (int, float)):
                    rate = max(0.0, dc - rd / P)           # branches B and B'

                # The CONTINUOUS value is an auditable intermediate and the ROUNDED value is
                # the single output (ALK-RECOMMEND-ONLY-001, owner decision 23). A fixture may
                # state either or both; record whichever it states, and never require the
                # intermediate as the price of recording the output.
                if rate is not None:
                    for src in (e, a):
                        if isinstance(src.get('temporarySafetyRateContinuousMlPerDay'), (int, float)):
                            rec.note(fid, name, 'temporarySafetyRateContinuousMlPerDay',
                                     src['temporarySafetyRateContinuousMlPerDay'], rate)
                            break
                    if isinstance(INC, (int, float)) and \
                            isinstance(a.get('temporarySafetyRateRecommendationMlPerDay'), (int, float)):
                        rec.note(fid, name, 'temporarySafetyRateRecommendationMlPerDay',
                                 a['temporarySafetyRateRecommendationMlPerDay'], round_to(rate, INC))
                    elif a.get('roundingApplied') is False and \
                            isinstance(a.get('temporarySafetyRateRecommendationMlPerDay'), (int, float)):
                        # no precision configured: the recommendation IS the continuous value
                        rec.note(fid, name, 'temporarySafetyRateRecommendationMlPerDay',
                                 a['temporarySafetyRateRecommendationMlPerDay'], rate)

            # the low-breach one-off correction volume, which decision 21's exception continues
            ASL = ctx.get('safetyDestinationLowDkh')
            if isinstance(A, (int, float)) and isinstance(ASL, (int, float)) and isinstance(P, (int, float)) \
                    and A < ctx.get('outerMinDkh', float('-inf')):
                dA = min(ASL - A, 0.50)
                rec.note(fid, name, 'desiredMovementDkh', e.get('desiredMovementDkh'), dA)
                for key in ('requiredVolumeMl', 'safetyCorrectionVolumeMl'):
                    stated = e.get(key) if key in e else a.get(key)
                    if stated is not None:
                        rec.note(fid, name, key, stated, dA / P)

    # ---- 5b. COVERAGE: every stated safety figure must have been REACHED ----------
    # "0 unreadable" previously meant "0 of the keys this tool happens to know about", not
    # "it reached everything". Any fixture that states a safety rate or correction volume
    # NUMERICALLY and contributed no recorded value is listed as unreadable by name, so the
    # report can never again imply coverage it does not have.
    _SAFETY_KEYS = ('temporarySafetyRateContinuousMlPerDay',
                    'temporarySafetyRateRecommendationMlPerDay',
                    'safetyCorrectionVolumeMl', 'requiredVolumeMl',
                    'rDownDkh', 'desiredMovementDkh')
    _reached = set(rec.fixtures_recomputed)

    def _states_a_number(o):
        if isinstance(o, dict):
            for k, v in o.items():
                if k in _SAFETY_KEYS and isinstance(v, (int, float)):
                    return True
                if _states_a_number(v):
                    return True
        elif isinstance(o, list):
            for v in o:
                if _states_a_number(v):
                    return True
        return False

    for fid, (fn, f) in sorted(fixtures.items()):
        if fid in _reached:
            continue
        if _states_a_number({'e': f.get('expectedIntermediateEvidence'),
                             'a': f.get('expectedAction')}):
            rec.unreadable.append({'fixtureId': fid, 'file': fn,
                                   'statedKeys': ['<safety figures>'],
                                   'reason': 'states a safety figure numerically but this '
                                             'recorder does not reach it'})

    # ---- 6. maintenance-controller arithmetic -----------------------------------
    # ALK-MAINTENANCE-SEMANTICS-001 / ALK-044 / ALK-PREDICTED-POST-SLOPE-001. Every one of
    # these is an exact identity in (D_current, P_selected, S_observed, S_supported), so a
    # fixture that states one and declares the inputs is checkable.
    CFG = json.load(open(FIXDIR + 'config-defaults.json', encoding='utf-8'))['configurations']['CANON_DEFAULT']

    def current_dose(f):
        for src in (f.get('config') or {}, f.get('input') or {}):
            if isinstance(src.get('currentDoseMlPerDay'), (int, float)):
                return src['currentDoseMlPerDay']
        last = None
        for e in ((f.get('input') or {}).get('events') or []):
            if isinstance(e, dict) and e.get('kind') == 'DOSE_STATE' \
                    and isinstance(e.get('programmedDoseMlPerDay'), (int, float)):
                last = e['programmedDoseMlPerDay']
        return last

    for fid, (fn, f) in fixtures.items():
        ev = f.get('expectedIntermediateEvidence') or {}
        sup_ev = f.get('expectedSupportedResult') or {}
        act = f.get('expectedAction') or {}
        if not isinstance(act, dict):
            continue
        wanted = [k for k in ('continuousActionCandidateMlPerDay', 'deltaDoseMlPerDay',
                              'deltaEffectDkhPerDay', 'predictedPostSlopeDkhPerDay',
                              'expected48hEffectDkh', 'maintenanceEstimateMlPerDay')
                  if isinstance(act.get(k), (int, float))]
        if not wanted:
            continue
        P = ((f.get('input') or {}).get('selectedPotencyDkhPerMl')
             or (f.get('config') or {}).get('selectedPotencyDkhPerMl') or CFG['selectedPotencyDkhPerMl'])
        D0 = current_dose(f)
        S_sup = sup_ev.get('supportedSlopeDkhPerDay')
        if S_sup is None:
            S_sup = ev.get('supportedSlopeDkhPerDay')
        S_obs, _ = observed_slope(fid, f)
        cont = (f.get('input') or {}).get('continuesFrom')
        if S_sup is None and cont in fixtures:
            g = fixtures[cont][1]
            S_sup = ((g.get('expectedSupportedResult') or {}).get('supportedSlopeDkhPerDay')
                     if (g.get('expectedSupportedResult') or {}).get('supportedSlopeDkhPerDay') is not None
                     else (g.get('expectedIntermediateEvidence') or {}).get('supportedSlopeDkhPerDay'))
        Dr = act.get('recommendedDoseMlPerDay')
        missing = [n for n, v in (('P_selected', P), ('D_current', D0)) if not isinstance(v, (int, float))]
        if missing:
            rec.unreadable.append({'fixtureId': fid, 'file': fn, 'statedKeys': wanted,
                                   'reason': 'controller inputs not declared: ' + ','.join(missing)})
            continue
        if 'maintenanceEstimateMlPerDay' in wanted:
            C = ev.get('consumptionDkhPerDay')
            if isinstance(C, (int, float)):
                rec.note(fid, '', 'maintenanceEstimateMlPerDay', act['maintenanceEstimateMlPerDay'], C / P)
            else:
                rec.unreadable.append({'fixtureId': fid, 'file': fn,
                                       'statedKeys': ['maintenanceEstimateMlPerDay'],
                                       'reason': 'C_estimate is not declared numerically'})
        if 'continuousActionCandidateMlPerDay' in wanted:
            if isinstance(S_sup, (int, float)):
                rec.note(fid, '', 'continuousActionCandidateMlPerDay',
                         act['continuousActionCandidateMlPerDay'], D0 - S_sup / P)
            else:
                rec.unreadable.append({'fixtureId': fid, 'file': fn,
                                       'statedKeys': ['continuousActionCandidateMlPerDay'],
                                       'reason': 'S_supported is not declared numerically'})
        if isinstance(Dr, (int, float)):
            dD = Dr - D0
            if 'deltaDoseMlPerDay' in wanted:
                rec.note(fid, '', 'deltaDoseMlPerDay', act['deltaDoseMlPerDay'], dD)
            if 'deltaEffectDkhPerDay' in wanted:
                rec.note(fid, '', 'deltaEffectDkhPerDay', act['deltaEffectDkhPerDay'], P * dD)
            if 'expected48hEffectDkh' in wanted:
                rec.note(fid, '', 'expected48hEffectDkh', act['expected48hEffectDkh'], P * dD * 2.0)
            if 'predictedPostSlopeDkhPerDay' in wanted:
                if isinstance(S_obs, (int, float)):
                    rec.note(fid, '', 'predictedPostSlopeDkhPerDay',
                             act['predictedPostSlopeDkhPerDay'], S_obs + P * dD)
                else:
                    rec.unreadable.append({'fixtureId': fid, 'file': fn,
                                           'statedKeys': ['predictedPostSlopeDkhPerDay'],
                                           'reason': 'S_observed is not declared numerically'})
        else:
            left = [k for k in wanted if k not in ('continuousActionCandidateMlPerDay',
                                                   'maintenanceEstimateMlPerDay')]
            if left:
                rec.unreadable.append({'fixtureId': fid, 'file': fn, 'statedKeys': left,
                                       'reason': 'recommendedDoseMlPerDay is not declared numerically'})

    # ---------------------------------------------------------------- report
    out = collections.OrderedDict()
    out['tool'] = 'recompute-goldens.py'
    out['label'] = args.label
    out['fixturesInCorpus'] = len(fixtures)
    out['fixturesRecomputed'] = len(rec.fixtures_recomputed)
    out['valuesRecomputed'] = rec.values_recomputed
    out['statedValuesCompared'] = len(rec.stated)
    out['discrepancies'] = rec.discrepancies
    out['unreadable'] = rec.unreadable
    out['values'] = rec.values
    body = json.dumps(out, indent=1, sort_keys=False)
    out['recordDigest'] = hashlib.sha256(
        json.dumps(rec.values, sort_keys=True).encode()).hexdigest()[:16]
    body = json.dumps(out, indent=1, sort_keys=False)

    print('fixtures in corpus            : %d' % len(fixtures))
    print('fixtures with a recomputation : %d' % len(rec.fixtures_recomputed))
    print('derived values recomputed     : %d' % rec.values_recomputed)
    print('stated values compared        : %d' % len(rec.stated))
    print('record digest                 : %s' % out['recordDigest'])
    print()
    print('DISCREPANCIES (stated != recomputed): %d' % len(rec.discrepancies))
    for d in rec.discrepancies:
        print('  %-56s stated=%-22r recomputed=%r' % (d['ref'], d['stated'], d['recomputed']))
    print()
    print('UNREADABLE (states a derived value the recompute cannot reach): %d' % len(rec.unreadable))
    for u in rec.unreadable:
        print('  %-16s %-34s %s' % (u['fixtureId'], ','.join(u['statedKeys']), u['reason']))

    if args.out:
        os.makedirs(os.path.dirname(args.out), exist_ok=True)
        open(args.out, 'w', encoding='utf-8').write(body + '\n')
        print('\nbaseline record written to %s' % args.out)

    if args.diff:
        base = json.load(open(args.diff, encoding='utf-8'))
        bvals, nvals = base['values'], rec.values
        moved, added, removed = [], [], []
        for k, v in nvals.items():
            if k not in bvals:
                added.append((k, v))
            elif not close(bvals[k], v, k.rsplit('::', 1)[-1]):
                moved.append((k, bvals[k], v))
        for k, v in bvals.items():
            if k not in nvals:
                removed.append((k, v))
        print()
        print('GOLDEN DIFF against %s (label %r, digest %s)'
              % (args.diff, base.get('label'), base.get('recordDigest')))
        print('  values in baseline : %d' % len(bvals))
        print('  values now         : %d' % len(nvals))
        print('  ARITHMETIC MOVED   : %d' % len(moved))
        for k, b, n in moved:
            print('    %-58s was=%-22r now=%r' % (k, b, n))
        print('  NEW (no baseline)  : %d' % len(added))
        for k, v in added:
            print('    %-58s %r' % (k, v))
        print('  GONE (renamed/removed): %d' % len(removed))
        for k, v in removed:
            print('    %-58s was=%r' % (k, v))
        if not moved and not removed:
            print('  => no golden that existed at baseline changed value.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
