# ALK V2 — ALGORITHMIC CONTRACT

Each algorithm is specified as **INPUTS / PRECONDITIONS / FORMULA or DECISION TREE /
OUTPUT / REASON CODE / FAILURE STATE / TESTS**. No prose-only judgement remains inside an
algorithm; where the canon leaves a judgement, the algorithm emits a refusal and points
at the open issue.

Notation: `⌊·⌋` floor, `[a, b]` inclusive, `(a, b)` exclusive. All medians are the
standard arithmetic median (`OI-MEDIAN-001`).

---

# GROUP 1 — TIME AND VALIDATION

## A1 — Elapsed time

**INPUTS** two `Instant`s `a`, `b`.

**PRECONDITIONS** both `timeProvenance ∈ {EXACT_ABSOLUTE, RECONSTRUCTED_WITH_PROVENANCE}`.

**FORMULA**

```text
elapsedDays(a,b) = (b.absoluteInstant - a.absoluteInstant) / 86400
```

Seconds are the only unit of subtraction. Date-label counting, "days ago" rounding and
calendar-day subtraction are forbidden inputs to any rate.

**OUTPUT** `days: real`.

**REASON CODE** none on success.

**FAILURE STATE** either operand is `LOCAL_TIME_ZONE_UNKNOWN` or `DATE_ONLY` ⇒
`NOT_RUN`, `TIME_EXACT_ELAPSED_UNAVAILABLE`. The requesting analysis degrades per `M-13`;
position and history are unaffected.

**TESTS** `TIME-001` DST-crossing pair with proven offsets; `TIME-002` `DATE_ONLY` pair
refuses; `WG-ALK-066`.

## A2 — Ingest validation

**INPUTS** raw entry `{value, unit, measuredAt, parameter, method?}`.

**PRECONDITIONS** none.

**DECISION TREE**

```text
value not finite                      -> REJECT  VALIDATION_VALUE_NOT_FINITE
unit unsupported                      -> REJECT  VALIDATION_UNIT_UNSUPPORTED
unit = meq/L                          -> convert: dKH = meq/L * 2.8 ; keep enteredValue
value outside physical representation -> REJECT  VALIDATION_VALUE_NOT_PHYSICAL
timestamp invalid / in the future beyond tolerance
                                      -> REJECT  VALIDATION_TIMESTAMP_INVALID
parameter mismatch                    -> REJECT  VALIDATION_PARAMETER_MISMATCH
otherwise                             -> ACCEPT
```

**A value outside the target range or outside the outer operating bounds is NOT a
validation failure** (Part II §3.3). Unusual biology is data, and rejecting it would
destroy exactly the readings the safety layer exists for.

Configuration validation, applied when a `ConfigurationSnapshot` is written:

```text
targetRangeMinDkh >= targetRangeMaxDkh          -> REJECT VALIDATION_TARGET_RANGE_INVERTED
targetRange not inside [outerMin, outerMax]     -> REJECT VALIDATION_TARGET_OUTSIDE_OUTER_BOUNDS
outerMinDkh >= outerMaxDkh                      -> REJECT VALIDATION_OUTER_BOUNDS_INVERTED
netVolumeL <= 0                                 -> REJECT VALIDATION_NET_VOLUME_INVALID
recommendationPrecisionMlPerDay <= 0                  -> REJECT VALIDATION_RECOMMENDATION_PRECISION_INVALID
```

**OUTPUT** accepted `Reading`, or a rejection with a reason code.

**FAILURE STATE** rejection is a user-facing validation error, not a domain state.

**TESTS** `VAL-001`…`VAL-008`.

---

# GROUP 2 — CLUSTERING AND SEGMENTATION

## A3 — Measurement clustering

**INPUTS** readings for one parameter, sorted by `(measuredAt, eventOrdinal)`; intervention
and delivery events; `asOf`.

**PRECONDITIONS** readings validated.

**DECISION TREE**

```text
1. Explicit grouping wins: readings sharing repeatGroupId form one cluster.
2. Otherwise group consecutive readings r_i, r_{i+1} when ALL hold:
     same parameter
     same or compatible methodId
     elapsedDays(r_i.measuredAt, r_{i+1}.measuredAt) <= 30 minutes
     no intervention, correction, water change or delivery anomaly between them
3. Cluster fields:
     representativeValueDkh = median(rawValueDkh of VALID members)
     representativeAt       = median(measuredAt of members)
     spreadDkh              = max - min over VALID members
     madDkh                 = median(|x_i - median(x)|)
     sigmaClusterDkh        = max(0.10, 1.4826 * madDkh)
4. clusterStatus = ANOMALOUS  when spreadDkh > 0.20 dKH   [ALK-005]
                 = OK         otherwise
```

`sigmaClusterDkh` is **never** divided by `√n`. Repeats of the same hobby test share
systematic error (Part II §5.6).

**OUTPUT** `MeasurementCluster[]`.

**REASON CODE** `CLUSTER_ANOMALOUS_SPREAD` with `{clusterId, spreadDkh, limitDkh: 0.20,
memberValues[]}`.

**FAILURE STATE** all members `INVALID` ⇒ cluster is not formed; readings remain in
history.

**TESTS** `CLU-001` three readings 10 min apart form one cluster; `CLU-002` repeats do not
increase independent count; `CLU-003` spread 0.25 ⇒ `ANOMALOUS`; `CLU-004` intervention
between readings prevents grouping; `CLU-005` explicit `repeatGroupId` overrides the
window.

## A4 — Independent-cluster selection

**INPUTS** `Measurement[]` within the selected segment (step 0 runs on measurements, and
emits `TestingEpisode[]`; `MeasurementCluster` is the same-method pool inside a resolved
episode).

**PRECONDITIONS** segment bounds known.

**ALGORITHM** — step 0 first: testing episodes are constructed and resolved *before* any of
the selection below runs (**owner decisions 17 and 19**; this supersedes the exact-timestamp
coalescing step Freeze 5 first specified here).

```text
STEP 0, before selection      [ALK-TESTING-EPISODE-001, ALK-EPISODE-RESOLUTION-001]
    group measurements into TESTING EPISODES:
        explicit repeat/confirmation relationship (PII-5.2) where present
        otherwise the EXISTING 30-minute repeatClusterWindow (PII-5.3, ALK-005)
        membership is the EPISODE, not an identical timestamp - a three-minute
        offset does not create two episodes

    exclude INVALID measurements (PII-4.3), then per episode:
        all remaining members same-method (or canon-classified compatible):
            pool the COMBINED underlying measurements
            rebuild ONE value from the pool using the existing rules:
                PII-5.4 representative value   = median(pooled raw readings)
                PII-5.5 representative timestamp
                PII-5.6 internal spread, and ALK-005
            episodeStatus = RESOLVED
            EPISODE_MEASUREMENTS_POOLED (+ EPISODE_RESOLVED)
        otherwise:
            episodeStatus = CONTESTED_METHODS
            no episode value is emitted; members are preserved and kept distinct
            ALK-005's 0.20 dKH is NOT applied across incompatible methods
            EPISODE_CONTESTED_METHODS + EPISODE_INCOMPATIBLE_METHODS_KEPT_DISTINCT
            RETEST_EPISODE_CONTESTED -> REPEAT_NOW  (ALK-051, PII-48)

    selection then runs over ONE CANDIDATE PER EPISODE, so ordering is total

    compatibleMethodClassification = NOT_RUN   [ALK-REPEAT-SPREAD-DOMAIN-001]
    crossMethodConcordanceThreshold = NOT_RUN  - no canon rule classifies any two
        distinct Alk methods as compatible, and no cross-method threshold exists

    NEVER: choose between contested members by event order, ID order, insertion order,
    database ordering or implementation sorting - that makes the recommendation a
    property of how the rows were stored.
    NEVER: average incompatible-method measurements, or average two cluster medians -
    a same-method episode value is the median of the POOLED raw readings.
    NEVER: let pooling hide an inconsistency - a SAME-METHOD pool spanning > 0.20 dKH is
    ANOMALOUS under ALK-005 and takes PII-48's path.
    NEVER: fall back to an older episode because the latest one is contested.
```

Then forward-greedy chronological selection (`ALK-INDEPENDENT-SELECTION-001`) over the
resulting one-per-episode sequence (`ALK-SAME-TIMESTAMP-COALESCE-001`, amended).

```text
candidates = resolved episode outputs in the selected segment, ascending by representativeAt
             (unique times by construction after step 0; a CONTESTED episode supplies
              no candidate and withholds the affected inference instead)
accepted   = []
anchor     = null

for c in candidates:
    if anchor is null:
        accepted.append(c); anchor = c                              # earliest eligible
    elif hours(c.representativeAt - anchor.representativeAt) >= 24:
        accepted.append(c); anchor = c                              # inclusive at 24 h
    else:
        notAccepted.append(c)                                       # anchor UNCHANGED

return accepted
```

Three properties this shape guarantees, each of which a naive implementation loses:

```text
1. the anchor is the LAST ACCEPTED cluster, never the last candidate examined
2. appending a cluster AFTER the latest accepted one never changes an earlier acceptance
3. the >= 24 h comparison is inclusive at exactly 24 h           [ALK-008, ALK-RAPID-001]
```

Property 2 is bounded to appended data. A cluster backdated to before the current earliest
candidate re-runs selection from the new earliest and may accept a different set. That is
required by `ALK-065` / `WG-ALK-029` — a backdated valid measurement changes the present
analysis — and the historical assessment record stays immutable regardless.


A cluster that is not accepted is **not excluded, invalidated or hidden**. It MAY still:

```text
  - establish current position                                    [ALK-010]
  - confirm an anomaly                                            [ALK-005, PII-48]
  - contribute to ALK-RAPID-001 as the latest independent pair    [ALK-RAPID-BASIS-001]
  - contribute to an explicitly time-resolved intervention calculation
```

**OUTPUT** `independentClusterIds[]`, `notAcceptedClusterIds[]`.

**REASON CODE** `EVIDENCE_INDEPENDENT_SELECTION_APPLIED` with
`{acceptedClusterIds[], notAcceptedClusterIds[], separationHours[]}` whenever at least one
candidate was not accepted.

**FAILURE STATE** none from selection itself. If the accepted set then falls below
`ALK-MOVEMENT-001`'s minimum, the ordinary `EVIDENCE_INSUFFICIENT_CLUSTERS` /
`EVIDENCE_INSUFFICIENT_SPAN` path runs — the same path as any sparse series.

**FORBIDDEN** backward-greedy selection; keep-all-and-mark; re-anchoring on a rejected
cluster; any selection whose result depends on the newest reading.

**TESTS** `AD-SEG-001` (same-day tests, forward-greedy result); `AD-SEG-005` (appended
cluster does not change selection; backdated-earlier case asserted separately);
`AD-SEG-007` (two same-method clusters at one sampling moment ⇒ pooled, not chosen between);
`AD-SEG-008` (a same-method pool spanning > 0.20 dKH stays `ANOMALOUS`);
`AD-EPI-001` (same-method repeats are one episode and one independent observation);
`AD-EPI-002` (incompatible methods ⇒ `CONTESTED_METHODS`; identical output under a
three-minute offset and under reversed insertion order);
`EVD-002` all spacings ≥ 24 h proceeds normally.

## A5 — Segment construction

**INPUTS** clusters, dose states, corrections, water changes, delivery anomalies, potency
context events, consumption-context events, configuration versions, `inferenceType`,
`asOf`.

**PRECONDITIONS** event ledger totally ordered (§`A1` ordering rules).

**DECISION TREE**

```text
Candidate boundaries, in event order:                    [Part II §13, ALK-007]
  maintenance dose change (effectiveAt)
  dose change with effectiveAtConfidence = UNCERTAIN
        -> boundary window [effectiveAtEarliest, effectiveAtLatest]; every interval
           straddling the window is CONFOUNDED                       [WG-ALK-017]
  product change / solution batch / concentration change
  pump or channel change / material calibration change
  pump failure, outage, unknown missed or extra dose
  net-volume change
  major unmodelled correction (deliveredAt or amount UNKNOWN)
  unknown-replacement water change with changedFraction >= 0.05      [ALK-WATERCHANGE-UNKNOWN-001]
  confirmed measurement-regime discontinuity (explicit only)         [OI-CHANGEPOINT-001]

Selection for inferenceType = TRAJECTORY / CONSUMPTION:
  take the MOST RECENT eligible clean segment
  cap its start at asOf - 14 days                                    [ALK-007]
  NEVER extend beyond 14 days because evidence is sparse             [Part II §1.3]
  NEVER fall back to an older segment

Selection for INTERVENTION_RESPONSE:
  post-change segment starts at the intervention's actualStartTime
  contains ONLY genuine post-change clusters
  the Day-0 anchor is an anchor, never a member                      [Part II §31]

Selection for POTENCY_LEARNING:
  pre window and post window are separate segments, both clean,
  both within one solutionContextId + deliveryContextId              [ALK-017]
```

Eligibility is computed **per inference**. A known normalized correction may leave a
segment trend-eligible while making it potency-ineligible (`AUDIT-018`, `WG-ALK-022`).

**OUTPUT** `EvidenceSegment` with per-inference eligibility and named boundary causes.

**REASON CODE** `SEGMENT_BOUNDARY_*` family (see catalogue); `SEGMENT_CONFOUNDED_*`.

**FAILURE STATE** selected segment has `< 3` independent clusters or `spanDays < 4` ⇒
`movementEvidence = INSUFFICIENT`, `EVIDENCE_INSUFFICIENT_CLUSTERS` /
`EVIDENCE_INSUFFICIENT_SPAN`, with an actionable next-test statement (`IX-005`).

**TESTS** `SEG-001`…`SEG-010`; `WG-ALK-016`, `WG-ALK-017`, `WG-ALK-047`, `WG-ALK-049`.

## A6 — Known-input normalization

**INPUTS** segment, known corrections with known amount and time, known material water
changes, `P_selected`.

**PRECONDITIONS** every normalized event has a known effect and a known instant.

**FORMULA**

```text
A_norm(t) = A_raw(t) - SUM over events e with e.at <= t of  deltaA_e     [Part II §9.3]

correction:     deltaA_e = actualVolumeMl * P_selected
water change:   deltaA_e = changedFraction * (replacementAlkalinityDkh - A_tank_before)
```

Raw values are untouched. Each normalized point stores
`{rawClusterValue, totalNormalizationApplied, sourceEventIds[], normalizedValue}`.

The V1 three-day linear correction profile is **removed** (`ALK-034`). A staged correction
normalizes its **actual** delivery schedule.

Normalization uncertainty is **not** propagated — see `OI-NORMUNCERT-001`;
`sigmaPointDkh` retains its canonical definition.

**OUTPUT** normalized analytical series.

**REASON CODE** `SEGMENT_NORMALIZED_CORRECTION`, `SEGMENT_NORMALIZED_WATER_CHANGE`, each
with `{eventId, appliedStepDkh}`; plus
`SEGMENT_NORMALIZATION_UNCERTAINTY_MODEL_UNAVAILABLE` (informational).

**FAILURE STATE** amount or time unknown ⇒ no normalization; interval `CONFOUNDED`;
`SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION`. **No invented amount, ever** (`WG-ALK-023`).

**TESTS** `ALK-G019`, `ALK-G020`, `WG-ALK-011`, `WG-ALK-022`, `WG-ALK-023`.

## A7 — Water-change classification

**INPUTS** `WaterChange`, tank Alk immediately before, `P_selected` not required.

**DECISION TREE**

```text
replacementAlkalinityDkh KNOWN and confidence = MEASURED_SAME_BATCH:
    deltaA_WC = f * (A_replacement - A_tank)
    |deltaA_WC| >= 0.10  -> MATERIAL_KNOWN   -> normalize (A6)
    |deltaA_WC| <  0.10  -> NEGLIGIBLE       -> retain in segment, no subtraction

replacementAlkalinityDkh KNOWN, confidence != MEASURED_SAME_BATCH
  (USER_CONFIGURED_SALT_PROFILE, MANUFACTURER_NOMINAL, unknown tier, or lower):
    NOT NORMALIZABLE          [ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001]
    -> fall through to the unknown branch below, using that branch in full
    -> reason SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE
    -> the stated replacement value is retained for audit and is NOT subtracted

replacementAlkalinityDkh UNKNOWN or ABSENT:                       [ALK-WATERCHANGE-UNKNOWN-001]
    potential unknown step = f * 2.0 dKH
    f <  0.05 -> UNKNOWN_SUBFLOOR_ASSUMPTION
                 retain in segment; segmentBreak = false; NO invented subtraction
    f >= 0.05 -> MATERIAL_UNKNOWN
                 HARD Alk segment boundary; segmentBreak = true
                 any straddling maintenance response -> CONFOUNDED
                 potencyLearningEligible = false
```

`0.05` is derived, not chosen: `f · 2.0 ≥ 0.10` ⇔ `f ≥ 0.05`.

**OUTPUT** `materialityClass`, `expectedStepDkh?`, `segmentBreak`.

**REASON CODE** `SEGMENT_WC_NEGLIGIBLE`, `SEGMENT_WC_MATERIAL_KNOWN_NORMALIZED`,
`SEGMENT_WC_UNKNOWN_SUBFLOOR`, `SEGMENT_WC_UNKNOWN_BOUNDARY`,
`SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE`.

**FAILURE STATE** none — every branch is defined; the tier question degrades rather than
refusing (`M-4`, `WG-ALK-048`).

**TESTS** `WG-ALK-011` (`MEASURED_SAME_BATCH`, normalized), `WG-ALK-012` (4% vs 5%),
`WG-ALK-048`, `ALK-G021`-`G023`, `AD-WC-001`, `AD-SEG-006` (`MANUFACTURER_NOMINAL` at the
same numbers falls through to a hard boundary — the negative control for the tier gate).

---

# GROUP 3 — TRAJECTORY

## A8 — Theil–Sen trend

**INPUTS** independent clusters `(t_i, A_i)` from the normalized series; local time origin
`t = 0` at the first included cluster.

**PRECONDITIONS** `n ≥ 3`; no two clusters share a timestamp (Part II §19.6).

**FORMULA**

```text
pairwise:  s_ij = (A_j - A_i) / (t_j - t_i)   for all i < j with t_j != t_i
slope:     S_observed = median(s_ij)
intercept: b = median(A_i - S_observed * t_i)
predicted: Â(t) = S_observed * t + b
residuals: r_i = A_i - Â(t_i)
```

Ordinary least squares may be computed as a diagnostic but is **never** the control slope
(`ALK-009`).

Zero-time pairwise slopes are never formed. Duplicate-time clusters are merged or removed
by the clustering/ordering rules; if that leaves `n < 3`, `movementEvidence =
INSUFFICIENT` (Part II §19.6).

**OUTPUT** `{S_observed, b, r[], pairwiseSlopes[]}`.

**FAILURE STATE** `n < 3` ⇒ two-point path (`A9`) if `n = 2` and a rapid or explicitly
permitted two-point analysis applies; otherwise `INSUFFICIENT`.

**TESTS** `TRD-001` ordering invariance; `TRD-002` no zero-time pair;
`AD-TRD-002` even-count median; `AD-TRD-004` single outlier does not move the slope;
`WG-ALK-001`, `WG-ALK-062`.

## A9 — Slope uncertainty — `ALK-SLOPE-UNCERTAINTY-001`

**INPUTS** residuals `r[]`, times `t[]`, `SIGMA_ALK_BASE = 0.10`.

**FORMULA — three or more clusters**

```text
sigma_resid = 1.4826 * median(|r_i|)
sigma_point = max(0.10, sigma_resid)                 <- the Alk analytical floor
t_bar       = (1/n) * SUM t_i
Sxx         = SUM (t_i - t_bar)^2                    [day^2]
sigma_S     = sigma_point / sqrt(Sxx)                [dKH/day]   requires Sxx > 0
```

**FORMULA — exactly two clusters** (rapid or explicitly permitted two-point analysis only)

```text
sigma_S = sqrt(sigma_1^2 + sigma_2^2) / delta_t_days
```

This is an **engineering controller-uncertainty proxy**, not a Theil–Sen sampling
standard error. Pairwise-slope MAD may be stored as diagnostic metadata and must **not**
be combined into `sigma_S` (Part II §19.5).

If all residuals are zero, `sigma_resid = 0` and the 0.10 floor governs — this is
deliberate and is what makes `WG-ALK-001` and `WG-ALK-062` produce non-trivial
uncertainty from perfectly linear data.

**OUTPUT** `{sigma_resid, sigma_point, t_bar, Sxx, sigma_S}`.

**REASON CODE** `UNCERTAINTY_FLOOR_APPLIED` when `sigma_resid < 0.10`;
`UNCERTAINTY_RESIDUAL_DOMINATES` when `sigma_resid > 0.10`.

**FAILURE STATE** `Sxx ≤ 0` ⇒ `movementEvidence = INSUFFICIENT`,
`UNCERTAINTY_SXX_NOT_POSITIVE`.

**TESTS** `WG-ALK-062` is mandatory — it is the golden that distinguishes the `Sxx` form
from an endpoint-only form (`0.015811` vs the forbidden `0.017678`).
`AD-TRD-005` exercises `sigma_resid > 0.10`. `AD-TRD-004` records the accepted residual
exposure of `OI-MADFLOOR-001`: `ALK-SUSPECT-DETECTION-001` leaves automatic detection
`NOT_RUN`, and **no compensating uncertainty-inflation term may be added**.

## A10 — Supported slope — `ALK-SUPPORTED-SLOPE-001`

**INPUTS** `S_observed`, `sigma_S`, `ALK_SLOPE_SUPPORT_K = 1.28`.

**FORMULA**

```text
M_supported = max(0, |S_observed| - 1.28 * sigma_S)
S_supported = sign(S_observed) * M_supported
```

Equivalently: falling ⇒ `S_supported = min(0, S_observed + 1.28 σ_S)`;
rising ⇒ `S_supported = max(0, S_observed − 1.28 σ_S)`.

**OUTPUT** `{S_supported, supportSubtraction = 1.28 σ_S, limitedByUncertainty}`.

**REASON CODE** `TRAJECTORY_UNCERTAINTY_LIMITED` when `S_supported = 0` and
`S_observed ≠ 0`, payload `{S_observed, sigma_S, supportSubtraction, spanDays,
independentClusters}`.

**FAILURE STATE** none; `S_supported = 0` is a valid, meaningful result.

**Prohibitions.** `S_supported` sizes the maintenance recommendation and nothing else. It is
never substituted into `C = P·D − S`, never used for a boundary forecast, never used as a
position, and is **never** multiplied by a confidence label (`X-INV-010`).

**TESTS** `WG-ALK-001`, `WG-ALK-002`, `WG-ALK-003`, `AUDIT-004`, `INV-ALK-CONFIDENCE-001`.

## A11 — Movement evidence and trajectory — `ALK-MOVEMENT-001`, `ALK-STABLE-001`

**INPUTS** independent clusters, span, confounders, latest-cluster anomaly state,
`S_observed`, `S_supported`, `rapidConfirmed`.

**DECISION TREE — evaluated in this order**

```text
1  hard confounder in the selected segment          -> CONFOUNDED
2  unresolved latest anomaly                        -> ANOMALOUS
3  independentClusters < 3  OR  spanDays < 4:
       rapidConfirmed = true -> PROVISIONAL + rapid early-action permission
       otherwise             -> INSUFFICIENT
4  S_supported < 0                                  -> FALLING,   SUFFICIENT
5  S_supported > 0                                  -> RISING,    SUFFICIENT
6  S_supported = 0 and S_observed != 0              -> sign(S_observed) direction,
                                                       UNCERTAINTY_LIMITED, HOLD
7  S_supported = 0 and S_observed = 0               -> STABLE,    SUFFICIENT
```

Step 3 must never resolve to `STABLE`: "Do not call the tank stable merely because
movement cannot yet be established."

Step 7's exact-zero condition is normative; `ALK-012`'s illustrative examples are wrong
and must not be used to justify a tolerance band (`OI-STABLE-001`).

**OUTPUT** `{trajectory, movementEvidence}`.

**REASON CODE** `EVIDENCE_INSUFFICIENT_CLUSTERS` `{have, need: 3, windowDays: 14}`;
`EVIDENCE_INSUFFICIENT_SPAN` `{haveDays, needDays: 4}`;
`EVIDENCE_CONFOUNDED_*`; `EVIDENCE_ANOMALOUS_*`; `TRAJECTORY_UNCERTAINTY_LIMITED`;
`TRAJECTORY_STABLE`.

**FAILURE STATE** `INSUFFICIENT` must carry the actionable next-test deadline, not a
dead-end label (`IX-005`).

**TESTS** `ALK-G003`, `ALK-G004`, `ALK-G004A`, `WG-ALK-002`, `WG-ALK-049`,
`AD-TRD-001` (flat ⇒ `STABLE`), `AD-TRD-003`.

## A12 — Rapid override — `ALK-RAPID-001`

**INPUTS** the latest cluster in the segment and the most recent **candidate** cluster at
least 24 h before it — not only accepted clusters, because `ALK-008` grants a non-accepted
cluster the right to contribute to the rapid rule. Plus known events in the interval.

**DECISION TREE**

```text
ALL must hold:
  at least two independent testing episodes
  elapsedDays between their representative times >= 1.0 (24 h)
  |S_pair| >= 0.30 dKH/day                          [basis: latest independent pair,
                                                     ALK-RAPID-BASIS-001]
  latest cluster is internally consistent (spread <= 0.20) OR has been repeated/confirmed
  no known correction, water change or delivery event already explains the movement
  the direction is relevant to a maintenance or safety decision
```

A confirmed rapid change **may**: bypass the ordinary 3-cluster / 4-day minimum; shorten
retest to ~24 h; allow an earlier maintenance recommendation; open the gateway to the
exceptional 50% cap when outer-bound risk also holds.

It **does not** bypass: potency validity; dose-history requirements; the 0.50 dKH/day
rail; the non-negative dose floor; outer safety logic; the composite rail.

Sizing slope selection is unchanged (`ALK-RAPID-BASIS-001`): `ALK-011A` uses the
multi-point formula whenever `n ≥ 3` eligible clusters exist; the two-point formula only
when `n = 2`. `S_pair` is the rapid **test** statistic and is never written to
`S_observed`, to the consumption input, or to the forecast slope.

`rapidConfirmed` changes pathway, cadence and cap eligibility only.

**OUTPUT** `{rapidConfirmed, rapidBasis: LATEST_INDEPENDENT_PAIR, pairSlope, pairSpanDays}`.

**REASON CODE** `TRAJECTORY_RAPID_CONFIRMED` `{pairSlope, thresholdDkhPerDay: 0.30,
elapsedHours}`.

**FAILURE STATE** not confirmed ⇒ ordinary path only.

**TESTS** `ALK-G005`, `WG-ALK-006`, `WG-ALK-043`, `AUDIT-012`, `AD-RAP-001`
(the discriminator: Theil–Sen −0.15 is not rapid, the latest pair −0.35 is, and sizing
stays Theil–Sen).

## A13 — Position and outer-bound state

**INPUTS** latest valid cluster representative value, target range, outer bounds.

**FORMULA**

```text
A_now = latest VALID cluster representativeValueDkh          [CORE-POSITION-001, ALK-010]

A_now <  outerMin           -> ALERT_LOW,    outerBoundState = BREACHED_LOW
A_now >  outerMax           -> ALERT_HIGH,   outerBoundState = BREACHED_HIGH
A_now <  targetRangeMin     -> BELOW_RANGE
A_now >  targetRangeMax     -> ABOVE_RANGE
otherwise                   -> IN_RANGE
```

Comparisons at outer bounds are **strict**: exactly at a bound is not breached
(`ALK-003A`). Range edges are **inclusive**: 8.19 against an edge of 8.20 is below range
(`ALK-004`).

A fitted, smoothed or forecast value may never replace `A_now`. Uncertainty does not widen
the range (Part II §7.3).

While a safety return is active and `A_now` has re-entered the envelope but not reached
the buffered destination: `outerBoundState = RECOVERING_INSIDE_BOUND`.

**OUTPUT** `{position, outerBoundState, A_now, latestValidClusterId}`.

**FAILURE STATE** no valid cluster ⇒ `position = UNKNOWN`, `POSITION_NO_VALID_MEASUREMENT`.

**TESTS** `ALK-G001`, `WG-ALK-028`, `WG-ALK-053`, `AD-POS-001` (edge equality).

---

# GROUP 4 — CONSUMPTION AND MAINTENANCE

## A14 — Delivery basis and effective dose

**INPUTS** interval bounds, dose states, delivery anomalies, telemetry if any.

**DECISION TREE**

```text
individual deliveries directly available          -> VERIFIED_DELIVERY
programmed rate and effective start known AND
  no known missed-dose/outage AND stable context  -> CONFIRMED_PROGRAMMED_SCHEDULE
only a nominal setting, execution unconfirmed     -> COMMAND_ONLY_UNCONFIRMED

interval is constant-dose:
    D = programmedDoseMlPerDay of the single state in force
    eligible on VERIFIED_DELIVERY or CONFIRMED_PROGRAMMED_SCHEDULE

interval is mixed-dose:
    VERIFIED_DELIVERY                       -> D_eff = integratedVolumeMl / elapsedDays
    CONFIRMED_PROGRAMMED_SCHEDULE with a fully reconstructable schedule and a
      sufficiently known effective time     -> integrate the programmed volume
    otherwise                               -> mixedIntervalIntegration = NOT_RUN
                                               and SEGMENT at the dose boundary
```

`COMMAND_ONLY_UNCONFIRMED` is never silently promoted to either eligible basis
(`SHARED-DELIVERY-BASIS-001`). Telemetry is optional; its absence must not disable the
controller (`WG-ALK-047`).

**OUTPUT** `EffectiveDoseInterval`.

**REASON CODE** `DELIVERY_BASIS_PROGRAMMED_SCHEDULE`, `DELIVERY_BASIS_VERIFIED`,
`DELIVERY_COMMAND_ONLY_UNCONFIRMED`, `DELIVERY_MIXED_INTEGRATION_NOT_RUN`.

**FAILURE STATE** `NOT_RUN` ⇒ segmentation instead of an invented `D_eff`.

**TESTS** `WG-ALK-047`, `AD-DEL-001` (missed dose), `DEL-002` (partial-day change, unit-test slot).

## A15 — Consumption estimate — `ALK-CONSUMPTION-ESTIMATE-001`

**INPUTS** `P_selected`, `D_history` from `A14`, `S_observed` from `A8`.

**PRECONDITIONS** segment eligible for `CONSUMPTION`; `P_selected` valid; delivery basis
eligible; trend evidence sufficient for the parameter.

**FORMULA**

```text
C_estimate = P_selected * D_history - S_observed      [dKH/day]
```

`D_history` is the **time-weighted mean delivery rate actually delivered across the analysed
interval** (`ALK-DELIVERY-RATE-BASIS-001`, owner decision 20) — `D_eff` on an integrable
mixed interval, the constant rate on a constant-dose clean segment. It is **not**
`D_current`, the rate the doser is configured to be delivering now, even though the two are
numerically equal on a constant-dose segment. Substituting `D_current` for `D_history` on a
mixed interval silently mis-states consumption by the amount the dose moved.

`D_history` unavailable -> `CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE`, consumption
`UNRESOLVED` under the existing unresolved-consumption handling. Safety sizing is unaffected
and still runs when `D_current` is known.

**`S_observed`, never `S_supported`.** Substituting the supported slope "to be
conservative" is explicitly forbidden — it would corrupt a physical mass balance with a
controller bias.

**PHYSICALITY DECISION TREE**

```text
C_estimate >= 0                       -> INTERPRETABLE
C_estimate <  0:                                       [ALK-NEGATIVE-MATERIALITY-001]

    materiallyNegative  <=>  C_estimate + 1.28 * sigma_S < 0      # strict
      1.28 is ALK_SLOPE_SUPPORT_K; sigma_S is ALK-SLOPE-UNCERTAINTY-001
      NO sigma_P and NO sigma_D exist or may be introduced

    materiallyNegative:
        -> physicality = NON_PHYSICAL_OR_UNEXPLAINED_GAIN
        -> maintenanceAction = HOLD
        -> CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN
    otherwise:
        -> physicality = UNCERTAIN_NON_RESOLVABLE
        -> maintenanceAction = HOLD
        -> CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED

    high-breach consequence above OuterMax:        [ALK-HIGH-BREACH-SAFETY-SIZING-001]
        BOTH negative branches    -> C_estimate is NOT usable for safety-dose sizing
                                     D_safety_temp = max(0, D_current
                                                            - R_down / P_selected)
                                     outer-bound state, SAFETY_RETURN and the ~24 h
                                       cadence all continue unchanged
                                     maintenanceEstimateStatus = UNRESOLVED
                                     SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE
        the materiality classification does NOT choose the delivered rate
          (owner decision 16; supersedes the F5-13 split of 0 mL/day versus HOLD)
    the MAINTENANCE ESTIMATE is HOLD on both branches either way; a held estimate is NOT
    a claim that biological consumption is zero
```

At exactly `C_estimate + 1.28 * sigma_S = 0` the result is **not** materially negative.

Under **no** branch may a negative `C_estimate`:

- size a maintenance change (`ALK-NEGATIVE-CONSUMPTION-001`);
- be clamped to zero and then treated as a real zero-consumption target;
- create a "protective" maintenance reduction because the level is high and rising.

A high/rising position changes urgency, retest timing and verification prompts — not the
validity of the broken estimate.

**OUTPUT** `ConsumptionEstimate`.

**REASON CODE** `CONSUMPTION_ESTIMATED`, `CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN`,
`CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED`, `CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE`,
`CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE`.

**FAILURE STATE** missing potency, missing dose history or missing net volume ⇒
`NOT_RUN`; position and trend are unaffected (Part II §70.1-70.3).

**TESTS** `WG-ALK-013` (material), `ALK-G026` (uncertainty-limited), `ALK-G027`, `ALK-G028`,
`AUDIT-019`, `AD-CON-001` (missing dose context per `DATA-PROVENANCE.md`),
`AD-CON-002` (boundary straddle: one recommendation precision flips the classification).

## A16 — Maintenance semantics — `ALK-MAINTENANCE-SEMANTICS-001`

**INPUTS** `C_estimate`, `P_selected`, `D_current`, `S_observed`, `S_supported`.

**FORMULA**

```text
maintenanceEstimate          = C_estimate / P_selected
                             = D_current - S_observed / P_selected   (constant-dose form)

continuousActionCandidate    = D_current - S_supported / P_selected
```

These are **different fields** and may legitimately differ (e.g. 11.2 vs 10.5 mL/day).
They must never share one field named `maintenanceDose`.

**POSITION × TRAJECTORY GATE** — `ALK-070`, `ALK-TOWARD-RANGE-HOLD-001`

Evaluated on the `continuousActionCandidate` before any rail, cap or rounding:

```text
position = BELOW_RANGE and trajectory = RISING     and S_supported != 0
    and no active deliberate level-movement plan
        -> action = HOLD_CURRENT_DOSE
           MAINTENANCE_HOLD_TOWARD_RANGE

position = ABOVE_RANGE and trajectory = FALLING    and S_supported != 0
    and no active deliberate level-movement plan
        -> action = HOLD_CURRENT_DOSE
           MAINTENANCE_HOLD_TOWARD_RANGE

every other position x trajectory cell            -> ALK-070 as written
```

The gate requires a **supported** trajectory. `UNCERTAINTY_LIMITED` is not one: it is held
by `MAINTENANCE_HOLD_UNCERTAINTY_LIMITED` under `ALK-011` and never reaches this gate.
Once the level is inside the preferred range the in-range rows resume unchanged, and an
outer-bound breach is owned by `ALK-OUTER-BOUND-ACTION-001` regardless of direction.

The card still shows `maintenanceEstimate`, `S_observed`, `S_supported` and the forecast
range-entry time — they explain the HOLD; they do not size an action.

**OUTPUT** both quantities.

**FAILURE STATE** `C_estimate` not `INTERPRETABLE` ⇒ `maintenanceEstimate = NOT_RUN`;
`continuousActionCandidate` still computes from `S_supported` when movement evidence is
sufficient, because it does not depend on `C_estimate`.

**TESTS** `WG-ALK-001`, `ALK-G008`, `ALK-G009`, `AD-MNT-006` (below + supported rising),
`AD-MNT-007` (above + supported falling), `AD-MNT-008` (below + uncertainty-limited lean —
the gate must **not** fire).

## A17 — Physical rate rail — `ALK-046`

**INPUTS** `ΔD` candidate, `P_selected`.

**FORMULA**

```text
|P_selected * deltaD| <= 0.50 dKH/day
if exceeded: deltaD = sign(deltaD) * (0.50 / P_selected)
```

The rail is a ceiling, not a target. It is independently binding — a stronger solution may
reduce liquid volume but does not make faster alkalinity movement safer.

**REASON CODE** `SAFETY_RATE_RAIL_APPLIED` `{uncappedEffectDkhPerDay, railDkhPerDay: 0.50,
cappedDeltaDoseMlPerDay}`.

**TESTS** `WG-ALK-063`, `AD-MNT-004`.

## A18/A19 — Dose-step cap and baseline establishment — `ALK-STEP-CAP-001`

**INPUTS** `D_current`, `R_precision = recommendationPrecisionMlPerDay`, `rapidConfirmed`,
outer-bound state, outer-bound forecast.

**DECISION TREE**

```text
if D_current < 4 * R_precision  (including D_current = 0):
        doseStepRegime = BASELINE_ESTABLISHMENT
        percentage cap INACTIVE                       [not a rescue mode]
        evidence, rail, non-negative clamp, potency and rounding all remain active
else:
        doseStepRegime = ORDINARY
        cap = 0.25
        cap = 0.50 only if ALL:
            1. ALK-RAPID-001 confirmed
            2. AND ( A_now beyond an outer operating bound
                     OR outer-bound crossing forecast from S_observed occurs
                        at or before 48 h )                [OI-FORECASTHORIZON-001]
            3. underlying measurement / dose / potency evidence otherwise valid
            4. the 0.50 dKH/day rail still permits the change
            5. next Alk test is shortened to ~24 h
        |deltaD| <= cap * D_current
```

Being merely outside the **preferred target range** never unlocks 50% (`AUDIT-008`). The
target band and the outer operating bounds are different concepts.

The `4 R_precision` threshold is a deterministic consequence of the 25% cap and recommendation
resolution — `0.25 · D_current ≥ R_precision` — not a chosen tank-size threshold.

**REASON CODE** `MAINTENANCE_STEP_CAP_ORDINARY`, `MAINTENANCE_STEP_CAP_EXCEPTIONAL`,
`MAINTENANCE_BASELINE_ESTABLISHMENT`, `MAINTENANCE_STEP_CAP_50_NOT_UNLOCKED`.

**TESTS** `WG-ALK-004` (zero dose), `WG-ALK-006` (50% binds), `WG-ALK-042` /
`WG-ALK-043` (forecast limb), `AUDIT-008`, `AUDIT-010`, `AD-MNT-002` (25% binds and lands
on an exact rounding tie).

## A20 — Non-negative clamp

```text
D_candidate = max(0, D_candidate)
```

Negative dosing is never recommended (`AUDIT-022`, `WG-ALK-035`). Reason code
`MAINTENANCE_NON_NEGATIVE_CLAMP`.

## A21 — Recommendation rounding — `ALK-ROUNDING-001`

**INPUTS** `D_continuous_feasible`, `D_current`, `R_precision`.

**PRECONDITIONS** `R_precision` known and `> 0`; the continuous candidate has already passed
evidence, rail, step cap, bracket and non-negative rules.

**DECISION TREE**

```text
1. lo = floor(D_cont / R_precision) * R_precision ;  hi = lo + R_precision
2. choose the nearer of lo, hi to D_cont
3. exact midpoint -> choose the tied setting closer to D_current
4. still tied     -> choose the lower setting
5. recompute deltaD = D_rounded - D_current and effect = P_selected * deltaD
6. recheck every hard constraint affected by discretisation:
       rate rail, step cap, non-negative, liquid-volume guard
                                            [ALK-LIQUID-VOLUME-GUARD-001, ALK-049]
   the guard was already applied to the CONTINUOUS candidate at ALK-049 step 8, so any
   guard violation seen here was caused by discretisation alone, which is exactly
   step 7's precondition
7. if a hard constraint is violated only because rounding moved the command further
   from D_current, step by R_precision TOWARD D_current until feasible
8. if the feasible command equals D_current:
       recommendation = HOLD
       reason         = MAINTENANCE_ROUNDS_TO_CURRENT_DOSE
```

Never force a one-increment change merely to avoid returning `HOLD`.

**OUTPUT** `recommendedDoseMlPerDay`.

**FAILURE STATE** `R_precision` unknown ⇒ `REFUSE` the final maintenance rate,
`VALIDATION_RECOMMENDATION_PRECISION_INVALID` where a CONFIGURED precision is <= 0. Where no precision is configured at all the full-precision recommendation is stated and nothing is withheld (`ALK-RECOMMEND-ONLY-001`, owner decision 23). Observed slope, supported
slope and the continuous candidate are still emitted. **No hidden 0.1 mL/day default.**
The one-off `SAFETY_RETURN` correction volume is exempt (`A39`), and the temporary
high-breach safety **rate** is emitted as an advisory rate with its recommendation separately
`NOT_RUN` (`A40`, `ALK-SAFETY-TEMP-RATE-RESOLUTION-001`).

**TESTS** `WG-ALK-005` (both tie directions: `10.25 → 10.2`, `7.75 → 7.8`),
`WG-ALK-063` (rail recheck: `16.4 → 16.3`), `WG-ALK-045`, `AD-MNT-001` /
`AD-MNT-003` (the 0.045 → HOLD vs 0.0685 → act boundary).

## A22 — Minimum useful dose change — `ALK-MINIMUM-ACTION-001`

**INPUTS** rounded command, `D_current`, `R_precision`, `P_selected`.

**RULE**

```text
after all continuous constraints:  |deltaD_recommended| >= R_precision
after rounding: if D_rounded == D_current -> HOLD, MAINTENANCE_ROUNDS_TO_CURRENT_DOSE

If the rounded change is non-zero but its expected 48 h effect is too small to
distinguish:
    the change IS STILL RECOMMENDED
    post-change response remains NOT_YET_ASSESSABLE until signal accumulates
    the scheduler continues the ordinary cadence
    the absence of a detectable 48 h response is NOT NO_DETECTABLE_RESPONSE
```

There is **no second "must be visible in the next test" gate**. Adding one would make the
supported slow-drift pathway unreachable (`AUDIT-003`).

**TESTS** `WG-ALK-003` (0.1 mL/day recommended although its 48 h effect is 0.01386 dKH),
`AUDIT-014`, `AD-MNT-001`.

## A23 — Predicted post-change slope — `ALK-PREDICTED-POST-SLOPE-001`

```text
deltaD_final     = D_recommended - D_current
S_pred_post      = S_observed + P_selected * deltaD_final
```

Computed from the **final capped and rounded command**, never from the uncapped ideal and
never assumed to be zero. A capped or uncertainty-limited first step is *expected* to
leave a residual slope, and the response classifier must be benchmarked against that
residual (`AUDIT-001`, `AUDIT-006`).

**TESTS** `WG-ALK-001` (`−0.04605`), `WG-ALK-006` (`−0.48815`), `WG-ALK-033`
(`+0.04605`), `AD-MNT-002` (`−0.14754`).

## A24 — Empirical bracket — `ALK-032`, `ALK-BRACKET-COMPARABILITY-001`

**INPUTS** historical assessments with full `M-10` provenance, current `C_estimate`.

**PRECONDITIONS** historical observations `≤ 45 days` old; same potency context; no
incompatible intervention history.

**FORMULA**

```text
eligible only when  C_estimate > 0  AND  C_hist > 0  AND both are interpretable

R_C = |C_hist - C_estimate| / C_estimate

R_C <= 0.25 -> the historical observation MAY narrow the bracket
R_C >  0.25 -> visible as historical context only; MUST NOT narrow the bracket

C_estimate zero, negative or uninterpretable -> DO NOT use this ratio at all
```

**Effect on the recommendation: none.** The bracket may only warn, lower the confidence
label, or request verification. It has no write path to `recommendedDoseMlPerDay`
(`OI-BRACKETEFFECT-001`, `ALK-072` item 11, `AUDIT-023`).

**REASON CODE** `BRACKET_CONSISTENT`, `BRACKET_CONFLICT` `{historicalDose, historicalOutcome,
currentRecommendation, R_C}`, `BRACKET_NOT_COMPARABLE`, `BRACKET_NOT_RUN`.

**FAILURE STATE** `M-10` provenance unavailable ⇒ `NOT_RUN`,
`empiricalBracketStatus = UNAVAILABLE`; core control continues (`WG-ALK-054`). No bracket
is reconstructed from incomplete snapshots.

**TESTS** `ALK-G038`, `AUDIT-023`, `WG-ALK-054`.

---

# GROUP 5 — INTERVENTION AND RESPONSE

## A25 — Intervention creation and the immutable prediction snapshot

**INPUTS** a **confirmed actual** dose change; the engine state immediately before it.

**PRECONDITIONS** an actual event exists. A recommendation alone never creates an
intervention (Part I §31, Part II §27).

**DECISION TREE**

```text
1. close or interrupt any existing maintenance intervention (A32)
2. store the new MaintenanceDoseState (effectiveAt, confidence, source, origin)
3. capture the baseline:
       latest valid pre-change cluster (or NONE)
       pre-change trend + its evidence state
       dose state actually in force
       selectedPotency + confidence + context ids
       target range + configVersionId
   if a same-instant measurement cannot be established as pre- or post-event:
       anchorRelationAmbiguous = true ; the reading is NOT used as the time-zero anchor
4. write the InterventionPredictionSnapshot, WRITE-ONCE:
       expectedSlopeChange = P_prediction * (D_new - D_old)
       predictedPostSlope  = S_pre_observed + expectedSlopeChange
5. phase = JUST_IMPLEMENTED
6. submit a retest candidate (A46)
```

**OUTPUT** `Intervention` + `InterventionPredictionSnapshot`.

**REASON CODE** `INTERVENTION_CREATED`, `INTERVENTION_ANCHOR_AMBIGUOUS`.

**FAILURE STATE** no adequate pre-change trend ⇒ the intervention is still tracked, but
`responseAttribution = PRECHANGE_EVIDENCE_INSUFFICIENT` (`A27`) and potency learning is
impossible. Missing snapshot on a legacy intervention ⇒
`LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE` (`M-7`); for new V2 interventions the snapshot is
a required schema dependency.

**Immutability.** A later potency recalibration changes current and future calculations
only. It never rewrites `expectedSlopeChange`. Storing
`historicalPredictionPotency ≠ currentSelectedPotency` simultaneously is intentional and
required (`WG-ALK-019`). An intervention that later contributes a potency observation must
not have its own benchmark rewritten by that observation — that would be circular
self-validation (`WG-ALK-020`).

**TESTS** `WG-ALK-019`, `WG-ALK-020`, `WG-ALK-038`, `AUDIT-028`, `INT-001`…`INT-004`.

## A26 — Exposure

**INPUTS** intervention start, delivery schedule, delivered/programmed volume, `asOf`.

**FORMULA**

```text
exposureFraction = incremental new-dose volume actually delivered
                 / incremental volume expected over one complete dosing cycle
                   (~24 h for an evenly dosed daily schedule)
```

**OUTPUT** `exposureFraction`, stored on the intervention for audit.

**FAILURE STATE** the alkalinity `minimumExposure` gate is `NOT_RUN`
(`RESPONSE_MINIMUM_EXPOSURE_POLICY_UNAVAILABLE`, `OI-EXPOSURE-001`). The two floors the
canon *does* state — first post-change test at ~48 h (`ALK-POSTCHANGE-001`) and the 24-h
independence rule (`ALK-008`) — both exceed one dosing cycle, so no reachable ordinary
path evaluates a response with sub-cycle exposure.

**TESTS** `INT-005`.

## A27 — Pre-change evidence gate — `ALK-RESPONSE-PRE-EVIDENCE-001`

**DECISION TREE**

```text
pre-change trend satisfies ALK-MOVEMENT-001                     -> ORDINARY BASIS
                                                                   sigma_pre from A9 (n>=3)
intervention followed a valid ALK-RAPID-001 decision, timestamps
  precise, no hard confounder                                   -> RAPID BASIS
                                                                   sigma_pre = sqrt(s1^2+s2^2)/dt
otherwise                                                       -> responseAttribution =
                                                                   PRECHANGE_EVIDENCE_INSUFFICIENT
                                                                   formalResponseClassifierRuns = false
```

`PRECHANGE_EVIDENCE_INSUFFICIENT` is **terminal for that intervention's attribution**. It
does not block current position, current maintenance analysis, or a future intervention.

**TESTS** `WG-ALK-044` (two-point non-rapid pre-history), `ALK-G010`.

## A28 — Attribution gate — `ALK-RESPONSE-ATTRIBUTION-001`

**FORMULA**

```text
R_exp   = |expectedSlopeChange|           from the immutable snapshot
B_min   = 1.28 * sigma_pre                smallest achievable band, even with perfect
                                          future post evidence

R_exp <= B_min  ->  responseAttribution = NOT_ATTRIBUTABLE_SMALL_SIGNAL   [TERMINAL, immediate]
```

Derived thresholds an implementer will need — the minimum attributable dose change at
`P = 0.0693 dKH/mL`:

| Pre-change evidence | `sigma_pre` | `B_min` | min attributable `|ΔD|` |
|---|---|---|---|
| 3 clusters at 0, 2, 4 d | 0.035355 | 0.045255 | **0.6530 mL/day** |
| 5 clusters at 0…8 d | 0.015811 | 0.020239 | 0.2920 mL/day |
| 8 clusters at 0…14 d | 0.007715 | 0.009875 | 0.1425 mL/day |

Consequence to expect: the slow-drift correction of `WG-ALK-003` (`+0.1 mL/day` after
eight clusters) is `0.1 < 0.1425` ⇒ **immediately and permanently non-attributable**. That
is intended behaviour, not a bug: `ALK-MINIMUM-ACTION-001` still requires the change to be
recommended, and `ALK-CARD-ATTRIBUTION-001` governs how it is explained.

**Current-dose assessment continues independently.** Once the post-change regime has its
own sufficient evidence, the engine still computes observed slope, supported slope,
maintenance balance and a recommendation — even while the old intervention stays
`NOT_ATTRIBUTABLE_SMALL_SIGNAL`, `AWAITING_DETECTABILITY` or `INCONCLUSIVE`. The app must
never be stuck because a past change cannot be causally isolated.

**REASON CODE** `RESPONSE_NOT_ATTRIBUTABLE_SMALL_SIGNAL` `{R_exp, B_min, sigma_pre,
deltaDose}`.

**TESTS** `WG-ALK-010`, `WG-ALK-040`, `ALK-G039A`, `ALK-G039B`.

## A29 — Detectability gate — `ALK-RESPONSE-DETECTABILITY-001`

**FORMULA**

```text
if R_exp > B_min:
    sigma_post_required = sqrt( (R_exp / 1.28)^2 - sigma_pre^2 )

    while sigma_post > sigma_post_required:
        responseAttribution = AWAITING_DETECTABILITY

maximum attribution horizon = 14 days from actualStartTime
    unresolved after that  ->  responseAttribution = UNRESOLVED_EXPIRED
```

`AWAITING_DETECTABILITY` is neither failure nor `NO_DETECTABLE_RESPONSE`.

Worked check: `ΔD = 1.5 mL/day`, `P = 0.0693` ⇒ `R_exp = 0.10395`;
`sigma_pre = 0.035355` ⇒ `sigma_post_required = 0.073111`. At Day +4 a two-point post
slope gives `sigma_post = 0.070711 < 0.073111`, so detectability **is** reached and the
classifier runs — which is exactly why `WG-ALK-007` produces `INCONCLUSIVE` rather than
`AWAITING_DETECTABILITY`.

**REASON CODE** `RESPONSE_AWAITING_DETECTABILITY` `{sigma_post, sigma_post_required,
R_exp}`; `RESPONSE_UNRESOLVED_EXPIRED` `{daysSinceStart}`.

**TESTS** `WG-ALK-007`, `WG-ALK-040`, `RSP-006`.

## A30 — Formal response classifier — `ALK-RESPONSE-CLASSIFIER-001`

**INPUTS** snapshot (`S_pre`, `sigma_pre`, `expectedSlopeChange`), post-change slope
`S_post` and `sigma_post` computed from **genuine post-change clusters only**.

**PRECONDITIONS** `A27` passed; `A28` did not return `NOT_ATTRIBUTABLE_SMALL_SIGNAL`;
`A29` reached detectability; the intervention is not interrupted, confounded or expired.

**FORMULA**

```text
u              = sign(expectedSlopeChange)
R_exp          = |expectedSlopeChange|
R_obs          = u * (S_post - S_pre)
sigma_response = sqrt(sigma_pre^2 + sigma_post^2)
B              = 1.28 * sigma_response
```

**DECISION TREE — the six classes are provably mutually exclusive**

```text
R_obs < -B                                              -> CONTRADICTORY
R_obs > R_exp + B                                       -> OVER_RESPONSE
R_obs > B  AND  R_obs < R_exp - B                       -> PARTIAL
R_obs > B  AND  |R_obs - R_exp| <= B                    -> EXPECTED
|R_obs| <= B  AND  |R_obs - R_exp| > B                  -> NO_DETECTABLE_RESPONSE
everything else                                         -> INCONCLUSIVE
```

If `R_exp − B ≤ B` the `PARTIAL` interval is empty; the engine does not invent a partial
category the evidence cannot separate.

Boundary conventions, derived by evaluating the frozen conditions at the boundary (canon
finding D-7 deliberately retains the measure-zero convention rather than changing the
inequalities):

```text
R_obs = -B exactly  ->  NO_DETECTABLE_RESPONSE
R_obs = +B exactly  ->  NO_DETECTABLE_RESPONSE if |B - R_exp| > B, else INCONCLUSIVE
```

**Non-overlapping windows are mandatory.** The Day-0 anchor may start the first new-dose
interval but is never a post-change observation. Reusing it in both slopes would correlate
their errors (`AUDIT-013`).

**Day +2 never runs this classifier.** With one genuine post-change measurement the state
is `AWAITING_FORMAL_POST_SLOPE`. Day +2 assesses position, suspicion, exposure, rapid
movement, outer-bound risk, directly evidenced delivery failure, and interruption — and
may show `predictedPostSlope` alongside `firstPostChangeIntervalSlope` as explanatory
context. It must not call an approximately flat first interval "no response" merely
because alkalinity did not rise (`AUDIT-002`).

`E_response` and `R_response` (error and ratio) are **diagnostic only** and must never form
a second classifier (Part II §33).

**REASON CODE** `RESPONSE_<CLASS>` with payload `{S_pre, sigma_pre, S_post, sigma_post,
R_exp, R_obs, B, snapshotPotency}`.

**FAILURE STATE** any eligibility gate unmet ⇒ that gate's state, never a class.

**TESTS** `WG-ALK-007` (`INCONCLUSIVE`), `WG-ALK-008` (`EXPECTED` on more evidence),
`WG-ALK-009` (all five discriminating cases on one shared band), `AD-RSP-001`
(Day +4 `EXPECTED`, the narrow complement of `WG-ALK-007`), `RSP-B01`/`RSP-B02`
(boundary conventions).

## A31 — Overshoot — `ALK-043`, Part II §34A

**FORMULA**

```text
Assess only while the intervention phase is JUST_IMPLEMENTED, OBSERVING or
ASSESSMENT_DUE, or within 14 days of actualStartTime (whichever ends later).
                                                       [horizon derived, OI-OVERSHOOT-001]

upward intervention:   A_now > targetRangeMax  -> OVERSHOOT
downward intervention: A_now < targetRangeMin  -> OVERSHOOT
```

Measured from the **latest actual reading**, never from the regression: range 8.2-8.8 with
a latest measurement of 8.95 is an overshoot even if the fitted line is 8.78.

`OVERSHOOT` is **orthogonal** to response attribution. `responseAttribution = EXPECTED`
with `positionEvent = OVERSHOOT` is a legal, meaningful combination. `OVERSHOOT` must never
be added back into the response enum (Part I §7.6A).

On overshoot: stop any deliberate upward movement, return to maintenance logic, reassess
trajectory, shorten retest. Do **not** simply undo the previous change — it may have
contained a valid maintenance correction plus an excessive temporary component.

**TESTS** `ALK-G016`, `AD-RSP-002`.

## A32 — Intervention lifecycle and interruption

**PHASE TRANSITIONS** (Part II §35)

```text
actual change confirmed                         -> JUST_IMPLEMENTED
minimum exposure accumulating                   -> OBSERVING
evidence/retest threshold reached               -> ASSESSMENT_DUE
assessment performed                            -> ASSESSED
new maintenance change before assessment        -> INTERRUPTED
calendar/evidence policy exceeded               -> EXPIRED
SAFETY_RETURN begins during an open window      -> phase preserved;
                                                   responseAttribution =
                                                   INTERRUPTED_BY_SAFETY_RETURN
```

**Interruption rules** (Part II §36, `WG-ALK-021`)

```text
preserve every actual dose event and all delivered-dose history
do NOT call it failed; do NOT call it successful
potencyLearningEligible = false
start a NEW intervention from the ACTUAL latest transition,
   with its own prediction snapshot
NEVER collapse 9.0 -> 10.0 -> 11.0 into a single 9.0 -> 11.0 event
```

The prior intervention keeps its immutable snapshot and stays in history as the
intervention that actually occurred.

**Multiple rapid changes** (Part II §37): every event is preserved, each unevaluable
intervention becomes `INTERRUPTED`, immediate-recommendation confidence falls, and the
engine prefers holding the latest actual dose long enough to obtain a clean segment unless
a safety rule overrides.

**Conflicting active interventions** (Part II §70.5): if records imply two mutually
exclusive maintenance doses are simultaneously current ⇒ mark the dosing state invalid,
do not guess, request reconciliation. Reason `INTERVENTION_CONFLICTING_ACTIVE_STATES`.

**TESTS** `WG-ALK-021`, `WG-ALK-056`, `ALK-G017`, `ALK-G018`, `AUDIT-026`.

## A33 — Dose changes made outside the app — `ALK-INTERVENTION-EXTERNAL-CHANGE-001`

**DECISION TREE**

```text
late entry, effectiveAt known with sufficient confidence:
    insert into the ledger; re-segment every window that crossed the new boundary;
    recompute CURRENT analysis from that point forward;
    historical recommendations shown at the time are NOT rewritten;
    potency learning across the affected window = false

late entry, effectiveAt UNCERTAIN:
    doseHistoryConfidence  = UNCERTAIN
    affectedWindow         = CONFOUNDED
    responseAttribution    = NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME
    potencyLearningEligible = false
    a new clean segment begins only after effectiveAtLatest is safely behind the analysis
    NEVER assign a reading to the old or new dose regime by guess

unlogged change discovered indirectly (user correction or verified pump history):
    correct the ledger from the first defensible known time
    mark earlier ambiguous periods dosage-history uncertain
    invalidate response/potency conclusions that depended on the wrong dose state
    do NOT silently keep a response classification built on a false dose assumption

no evidence of an actual external change:
    FORBIDDEN: inferredDoseChange = true
    unexpected chemistry stays no-response / contradictory / confounded / unexplained
```

The engine must never invent a dose event to make the mathematics fit (`WG-ALK-018`).

**TESTS** `WG-ALK-016`, `WG-ALK-017`, `WG-ALK-018`.

---

# GROUP 6 — POTENCY  *(CAPABILITY_GATED — default OFF)*

`ALK-POTENCY-CAPABILITY-GATE-001`: empirical learning stays disabled until
`solutionContextId`, `deliveryContextId`, trustworthy dose-change `effectiveAt`,
sufficiently precise `measuredAt`, confirmed programmed pre/post dose states and the
persistent potency/intervention records all exist. While gated,
`selectedPotency = theoretical/configured` and the core controller is fully functional
(`WG-ALK-046`).

## A34 — Theoretical potency — `ALK-014`

```text
Na2CO3 :  P_expected = 0.05284 * C / V
NaHCO3 :  P_expected = 0.03333 * C / V
NaOH   :  P_expected = 0.07000 * C / V

C = stock concentration [g/L],  V = configured net system volume [L],  P [dKH/mL]

commercial product: manufacturer potency normalized to the configured net volume
```

Validation example (not a shipped default): `C = 101 g/L`, `V = 77 L` ⇒
`P_expected ≈ 0.0693 dKH/mL`.

**FAILURE STATE** `V` unknown ⇒ any calculation depending on volume refuses
(Part II §70.3). `C` unknown ⇒ `POTENCY_THEORETICAL_INPUTS_UNAVAILABLE`.

## A35 — Potency observation — `ALK-016`, `ALK-017`

**PRECONDITIONS — all nine must hold**

```text
1 same tank volume context          2 same product
3 same solution batch/concentration 4 same pump/channel/delivery config except rate
5 clean pre-change trend            6 clean post-change response trend
7 intervention NOT interrupted      8 no hard confounder, including a recorded
                                      CONSUMPTION_CONTEXT_CHANGE between pre-window
                                      start and post-window end
9 dose delta large enough for measurable signal (see below)

Minimum evidence per side:
  pre  : >= 3 independent eligible clusters, span >= 4 days, sigma_pre available
  post : >= 3 GENUINE post-change eligible clusters, span >= 4 days, sigma_post available
         (the Day-0 anchor is NOT one of them)
```

**FORMULA**

```text
P_i          = (S_post - S_pre) / (D_post - D_pre)          [dKH/mL]
             using ACTUAL PROGRAMMED dose states            [M-9]

deltaS       = S_post - S_pre
sigma_deltaS = sqrt(sigma_pre^2 + sigma_post^2)             non-overlapping windows
SNR_potency  = |deltaS| / sigma_deltaS                      requires sigma_deltaS > 0

SNR < 2.0        -> INELIGIBLE_SIGNAL
2.0 <= SNR < 3.0 -> DIAGNOSTIC_ONLY     stored, cannot move selectedPotency
SNR >= 3.0       -> CALIBRATION_ELIGIBLE
```

Derived minimum dose deltas for calibration eligibility at `P = 0.0693 dKH/mL`:

| Evidence per side | `sigma_ΔS` | min `|ΔS|` | min `|ΔD|` |
|---|---|---|---|
| 3 clusters / 4 d both sides | 0.050000 | 0.150000 | **2.1645 mL/day** |
| 3 pre / 5 post | 0.038730 | 0.116190 | 1.6766 mL/day |
| 5 clusters / 8 d both sides | 0.022361 | 0.067082 | 0.9680 mL/day |

This is why `WG-ALK-024` (`ΔD = 2.0`, `ΔS = 0.140`) yields `SNR = 2.80` —
`DIAGNOSTIC_ONLY` — at *minimum* per-side evidence, and reaches
`CALIBRATION_ELIGIBLE` only with more (`OI-WG024-001`).

Learning is **passive**. Never perturb a stable reef to calibrate.

**REASON CODE** `POTENCY_OBSERVATION_RECORDED`, `POTENCY_SIGNAL_INELIGIBLE`,
`POTENCY_SIGNAL_DIAGNOSTIC_ONLY`, `POTENCY_SIGNAL_CALIBRATION_ELIGIBLE`,
`POTENCY_INELIGIBLE_CONTEXT_MISMATCH`, `POTENCY_INELIGIBLE_INTERRUPTED`,
`POTENCY_INELIGIBLE_CONSUMPTION_CONTEXT_CHANGE`, `POTENCY_INELIGIBLE_SAFETY_RETURN_CONFOUND`,
`POTENCY_INELIGIBLE_CORRECTION_IN_WINDOW`.

**TESTS** `WG-ALK-024`, `WG-ALK-025`, `WG-ALK-064`, `AD-POT-001`.

## A36 — Plausibility envelope — `ALK-POTENCY-PLAUSIBILITY-001`

```text
P_i <= 0                                          -> REJECTED_NON_POSITIVE
0.40 * P_expected <= P_i <= 1.60 * P_expected     -> IN_ENVELOPE  (proceed to A35 signal)
otherwise                                         -> PLAUSIBILITY_HOLD
                                                     stored, excluded from the pool

two most recent otherwise calibration-grade observations both outside the envelope
in the SAME direction  ->  potencyContextState = POTENCY_CONTEXT_DISCREPANCY
    preserve the observations
    prompt verification of product/recipe/concentration, net volume, pump calibration
    do NOT silently recalibrate the existing context
    if verification shows Setup/delivery was wrong:
        close/supersede the old potency context; create the corrected context;
        recompute theoretical potency; later observations qualify against the new context
    if verification confirms the context is correct and the discrepancy persists:
        the canon must be explicitly revised before automatic dosing adopts a potency
        outside 0.40-1.60
```

**TESTS** `WG-ALK-050` (`P_i = 0.140` vs upper bound `0.11088`), `WG-ALK-027`
(`1.59×` — just inside), `ALK-G037`.

## A37 — Pooling and dispersion — `ALK-POTENCY-POOL-001`

```text
pool = observations with signalClass = CALIBRATION_ELIGIBLE
       AND plausibilityStatus = IN_ENVELOPE
       AND belonging to the EXACT same solutionContextId + deliveryContextId

P_learned = median(P_1 .. P_n)

MAD_P   = median(|P_i - P_learned|)
RDisp_P = 1.4826 * MAD_P / P_learned          for P_learned > 0
```

No quality adjective, recency weighting or hidden weight enters this calculation. Quality
is handled **before** pooling by deterministic eligibility.

**TESTS** `WG-ALK-026`, `ALK-G035`, `ALK-G036`.

## A38 — Potency confidence ladder — `ALK-POTENCY-CONFIDENCE-001`

Evaluated as an ordered ladder, highest first.

```text
STRONGLY_CALIBRATED : >= 5 calibration-eligible observations
                      from >= 3 separate dose-change interventions
                      >= 2 distinct absolute dose-change magnitudes differing by
                           at least one configured pump increment
                      span(earliest..latest) >= 14 days
                      RDisp_P <= 0.10
                      context unchanged; state not REASSESSING

CALIBRATED          : >= 3 calibration-eligible observations
                      from >= 2 separate dose-change interventions
                      span >= 7 days
                      RDisp_P <= 0.15
                      context unchanged; state not REASSESSING
                      => selectedPotency = P_learned  (current/future only)

PROVISIONAL         : >= 2 calibration-eligible observations
                      from >= 2 separate dose-change interventions
                      => selectedPotency remains theoretical/configured

EXPLORATORY         : >= 1 diagnostic or calibration-eligible observation
                      AND < 2 calibration-eligible observations
                      => selectedPotency remains theoretical/configured

THEORETICAL_ONLY    : no observation with SNR_potency >= 2

none of the above   -> UNRESOLVED, selectedPotency = theoretical/configured
                       POTENCY_CONFIDENCE_STATE_UNDETERMINED        [OI-POTENCYSTATE-001]
```

**REASSESSING**

```text
after CALIBRATED or STRONGLY_CALIBRATED, inspect the two most recent new
calibration-eligible observations not in the last accepted calibration snapshot:

delta_i = (P_i - P_selected_old) / P_selected_old

enter REASSESSING when  (delta_1 > 0.15 AND delta_2 > 0.15)
                    or  (delta_1 < -0.15 AND delta_2 < -0.15)

while REASSESSING:
    do NOT overwrite historical intervention predictions
    KEEP the prior selected potency for automatic dosing
    surface the discrepancy; collect more clean evidence or verify Setup/delivery
    a CONFIRMED context change creates a NEW context instead of remaining REASSESSING

exit criterion: NOT DEFINED BY CANON -> the state is absorbing   [OI-POTENCYSTATE-001]
"last accepted calibration snapshot" is not a defined stored object
                                                                  [OI-POTENCYSNAP-001]
    -> REASSESSING detection = NOT_RUN until an owner defines it
```

**Discrepancy bands** (`ALK-021`, wording only, no action):
`M = P_learned / P_expected`; `0.85-1.15` broadly consistent; `0.70-0.85` or `1.15-1.30`
meaningful; `<0.70` or `>1.30` large, requiring verification before a silent control-model
switch. Even after calibration the app reports **effective delivered potency**, never a
definitive reservoir concentration (`ALK-024` Part I).

**Context boundaries** (`ALK-067`, `ALK-068`, `WG-ALK-036`, `WG-ALK-037`): a new solution
batch, concentration, product, net volume, pump/channel or material calibration change
creates a new potency context. Historical observations stay with the old context. The old
learned value does not carry over as equally valid.

**TESTS** `WG-ALK-026`, `WG-ALK-027`, `WG-ALK-036`, `WG-ALK-037`, `WG-ALK-039`,
`ALK-G036`.

---

# GROUP 7 — SAFETY

## A39 — Outer-bound safety return, low breach — `ALK-OUTER-BOUND-ACTION-001`

**PRECONDITIONS** `A_now < outerMin` from the latest valid cluster.

**PRECEDING CHECK** — `ALK-ADVISORY-RANGE-BOUNDARY-001` (owner decision 21, `A40b`) is
evaluated on the resolved episode value **before** this step. At or beyond
`AdvisoryFloor = outerMin − 1.0 dKH` the engine's own sized delivery guidance in mL/day is
withheld — `recommendedDoseMlPerDay = WITHHELD`, `temporarySafetyRateContinuousMlPerDay` and
`temporarySafetyRateRecommendationMlPerDay` `NOT_RUN`, and **not zero**. The one-off correction
**volume** `V_safety` below is named in decision 21's exception list and **continues** to be
emitted, together with `outerBoundState = BREACHED_LOW` and the shortened retest. Whether
that exception list is closed is `OI-ADVISORYEXCEPTION-001`, OPEN.

**FORMULA**

```text
B_safety      = 0.20 dKH                       FIXED constant, never recomputed
A_safe_low    = outerMin + B_safety            = 7.20 for outerMin 7.0
deltaA_safety = min(A_safe_low - A_now, 0.50)
V_safety      = deltaA_safety / P_selected     [mL]
```

Subject to: valid potency; the composite rail; the liquid-volume guard; the
safety-correction resolution rule; `ALK-SAFETY-MG-OVERRIDE-001`; user confirmation and
actual implementation logging.

**`B_safety` is a derived fixed controller constant** (`2 × 0.10`). It is **not**
recalculated from the current test kit, per-reading precision, residual scatter, the
current trend's `sigma_point`, or a keeper-specific uncertainty. Making it adaptive would
require a new Alk freeze.

**Actuator-increment exemption** — `ALK-SAFETY-CORRECTION-RESOLUTION-001`:

```text
M-1's REFUSE / ACTUATOR_INCREMENT_REQUIRED applies to final actionable MAINTENANCE
mL/day. It does NOT block the one-off SAFETY_RETURN correction VOLUME.

recommendationPrecisionMlPerDay missing:
    safetyCorrectionStatus            = ACTIONABLE
    maintenanceRateRoundingPrecision = MAY_REMAIN_MISSING
    retain full-precision V_safety internally
    do not invent a pour increment
```

The **potency requirement remains load-bearing**: if `P_selected` is unavailable or
invalid, state the required dKH movement and withhold the mL figure
(`CORE-INFORM-PROCEED-001` Case B).

**Magnesium** — `ALK-SAFETY-MG-OVERRIDE-001`, owner decision Option B:

```text
ALERT_LOW      -> allow SAFETY_RETURN, and surface the low-Mg condition on the same card
NOT_ALERT_LOW  -> allow SAFETY_RETURN, no Mg warning
UNKNOWN        -> allow SAFETY_RETURN, invent no low-Mg condition   [always, this runtime]
```

Magnesium data is **not a required input** for the Alk safety action. Ordinary
non-safety Alk/Ca correction logic may still respect the Mg gate; this exception belongs
only to the Alk outer-bound safety return.

**TESTS** `WG-ALK-041`, `WG-ALK-055`, `WG-ALK-061`, `X-GOV-003`, `AD-ESC-002` (the advisory
floor: inside acts, at and beyond escalates while `V_safety` continues).

## A40 — Outer-bound safety return, high breach

**PRECONDITIONS** `outerMax < A_now < AdvisoryCeiling`. At or beyond `AdvisoryCeiling` this
whole step is not reached — see `A40b`.

**DECISION TREE**

```text
consumption INTERPRETABLE  (C_estimate >= 0):
    R_down        = min(A_now - A_safe_high, 0.50)
    S_safety      = -R_down
    D_safety_temp = max(0, (C_estimate + S_safety) / P_selected)      [mL/day]
    if zero dosing cannot achieve the desired decline, report the slower
    physically achievable decline; NEVER invent negative dosing

    recommendationPrecisionMlPerDay missing:      [ALK-SAFETY-TEMP-RATE-RESOLUTION-001]
        temporarySafetyRateContinuousMlPerDay     = D_safety_temp   # auditable intermediate
        temporarySafetyRateRecommendationMlPerDay = ALK-ROUNDING-001 of the above
                                                                    # THE single output
        safetyDirection                           = REDUCE_ALK_DOSING
        ONE output, not two (ALK-RECOMMEND-ONLY-001, owner decision 23). There is no
          pump command, no actuator increment, and nothing is withheld for want of one.
          Where no recommendation precision is configured the full-precision figure is
          stated; rounding is for a human reader, not for hardware.
        rails and guards still apply: ALK-046, ALK-COMPOSITE-RAIL-001,
          ALK-LIQUID-VOLUME-GUARD-001, and the max(0, .) already inside D_safety_temp
        P_selected invalid -> no mL/day figure; state the required dKH movement only

consumption NEGATIVE - EITHER side of the materiality boundary,      [branch B]
  OR computable but otherwise physically uninterpretable:
                                              [ALK-HIGH-BREACH-SAFETY-SIZING-001]
    the uninterpretable disjunct is ALK-HIGH-BREACH-UNRESOLVED-001's own wording -
      "negative, on either side of the boundary, OR otherwise physically
      uninterpretable" - and it is carried here so branch A's "and physically
      interpretable" conjunct cannot leave a state matching no branch
    C_estimate is NOT usable for safety-dose sizing
    R_down        = min(A_now - A_safe_high, 0.50)
    D_safety_temp = max(0, D_current - R_down / P_selected)           [mL/day]
    stop any separately temporary upward correction/return component
    safetyDoseReason          = HIGH_BREACH_CONSUMPTION_NOT_USABLE_FOR_SIZING
    maintenanceEstimateStatus = UNRESOLVED
    SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE
    D_current <= R_down / P_selected -> the rate FLOORS at 0 mL/day
        SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO
    do NOT label the rate a newly inferred permanent maintenance requirement
    preserve the established maintenance estimate/history separately
    retest ~24 h, or sooner if a rapid/suspicious rule requires it

    the advisory/executable separation, the rails, the guard and the rounding are
    exactly those of the interpretable branch above

    REQUIRED, and checkable ABOVE THE ZERO FLOOR (D_current > R_down/P_selected):
        the rate DECREASES as A_now rises, until R_down saturates at the 0.50 rail
        the rate moves ONE recommendation precision per increment of D_current,
          including across the materiality boundary
        AT OR BELOW the floor the rate is 0 and varies with nothing - that is the floor
    REQUIRED EVERYWHERE:
        the materiality classification changes wording and evidence state only

consumption NOT COMPUTABLE AT ALL:                                   [branch B']
                              [ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001]
    insufficient history, first-ever test, unknown dose history - the mass balance
      cannot be EVALUATED, as distinct from evaluating to a number
    D_safety_temp = max(0, D_current - R_down / P_selected)           [mL/day]
    maintenanceEstimateStatus = UNRESOLVED, with the reason surfaced
    SAFETY_HIGH_BREACH_CONSUMPTION_NOT_COMPUTABLE
      + SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE
    everything else - rails, guard, rounding, advisory/executable separation,
      SAFETY_RETURN integration, ~24 h cadence - exactly as branch B

D_current UNKNOWN or NOT CONFIGURED:  [ALK-DELIVERY-RATE-BASIS-001, decision 20]
    B and B' cannot evaluate max(0, D_current - R_down / P_selected):
        temporarySafetyRateContinuousMlPerDay = NOT_RUN
        temporarySafetyRateRecommendationMlPerDay  = NOT_RUN
        NOT 0 mL/day - zero is a computed floor, never a stand-in for an unknown input
    A does not take D_current at all - see the RECORDED EXPOSURE below; pending the
        owner's decision A is ALSO NOT_RUN, with the required dKH movement and
        direction stated under CORE-INFORM-PROCEED-001
    ordinary maintenance sizing/capping/rounding take D_current directly:
        recommendedDoseMlPerDay = WITHHELD
    surface the measured state and the reason; request doser configuration through
      the EXISTING anomaly/confirmation machinery
    SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN
    outer-bound state, SAFETY_RETURN and the shortened cadence continue unchanged
    consumption is UNAFFECTED where D_history is available

P_selected UNAVAILABLE or INVALID - on ANY branch:
    D_safety_temp is not calculable; state the required dKH movement and direction
      only, under CORE-INFORM-PROCEED-001. This is the PRE-EXISTING potency clause of
      ALK-HIGH-BREACH-SAFETY-SIZING-001, not a fourth branch. Note it also makes
      C_estimate uncomputable, so the branch selected is B'.
```

**RECORDED EXPOSURE — `OI-BRANCHAREFUSAL-001`, OPEN.** Branch A's formula
`max(0, (C_estimate + S_safety) / P_selected)` does **not** take `D_current`. With
`D_current` unknown and `D_history` available, every input branch A needs is present.
Owner decision 20 states the refusal without naming a branch; read literally it withholds a
computable safety reduction above the outer bound, read against the formulas it does not
reach A. On `A_now` 11.5, `C_estimate` +0.60, `P` 0.0693 the two readings give
**1.44 mL/day** and **`NOT_RUN`**. That is an recommendation and it is the owner's to
settle; pending that, A is `NOT_RUN` and the state is surfaced rather than silently sized.

**Branch selection is total and disjoint.** Over `outerMax < A_now < AdvisoryCeiling`,
exactly one of A (`C_estimate >= 0` **and** physically interpretable), B (`C_estimate < 0`
**or** computable-but-uninterpretable) and B′ (`C_estimate` not computable at all) is
selected for every state. There is no fourth branch and no state that selects none.
An unknown `D_current` and an invalid `P_selected` withhold the *rate* without changing the
*branch*. `INV-G12` asserts it.

`C_estimate >= 0` is `INTERPRETABLE` and sizes from consumption. Any negative
`C_estimate` — on either side of `ALK-NEGATIVE-MATERIALITY-001`'s boundary — is unusable for
sizing and takes the `D_current` form instead (**owner decision 16**, input renamed by
**decision 20**). Both branches leave the **maintenance estimate** `UNRESOLVED`, and neither
infers zero biological consumption.

**PRECEDING CHECK** — `ALK-ADVISORY-RANGE-BOUNDARY-001` (owner decision 21) is evaluated on
the resolved episode value **before** this whole tree. At or beyond
`AdvisoryCeiling = outerMax + 1.0 dKH` (or at or beyond `AdvisoryFloor = outerMin − 1.0 dKH`
on the low side) none of A, B, B′ runs: no dose recommendation, no temporary safety rate, no
recommendation, and **not zero**. See `A40b`.

**Superseded, preserved:** this section previously split the two negative branches, arming a
0 mL/day pause on the materially-negative side and holding the established dose on the
other. That split produced a one-increment discontinuity and produced no safety rate at all
on the middle branch.

The temporary safety rate is a fail-safe response to an invalid model, not a claim about
biological consumption. It is **not** pushed through the ordinary rail calculation, because
there is no modelled trajectory to rail (`ALK-046` high-breach clause). \(R_{down}\) is
rail-bounded, so the **continuous** rate cannot breach `ALK-046`; the **discretised** command
can, because rounding down increases the delivered reduction, so `ALK-ROUNDING-001`'s step-6
recheck stays load-bearing here. If the app cannot control the pump it says the rate is *recommended* and does
not mark it as implemented until implementation is confirmed.

**TESTS** `WG-ALK-051` (materially negative ⇒ sized, not paused), `AD-SAF-002` (advisory
rate emitted, recommendation `NOT_RUN`), `AD-SAF-005` (negative control: the two fields must
not be merged and no increment is invented), `AD-SAF-007` (`A_now` sweep, rail saturation,
zero floor, materiality straddle), `AD-SAF-008` (negative control: continuity across the
materiality boundary), `AD-CON-002` (both variants receive the same delivered rate),
`AD-SAF-009` (branch B′: first-ever test, `C_estimate` not computable, `D_current` known),
`AD-DHS-001` (`D_current` versus `D_history` on a mixed-dose interval, both directions),
`AD-DHS-002` (negative control: `D_current` unknown ⇒ refusal, no rate, **not** zero),
`AD-DHS-003` (`D_history` unavailable ⇒ consumption `UNRESOLVED`, sizing still available),
`INV-G12` (branch exhaustiveness).

## A40b — Advisory range boundary — `ALK-ADVISORY-RANGE-BOUNDARY-001`

**Owner decision 21.** Evaluated on the **resolved episode value**, after
`ALK-EPISODE-RESOLUTION-001` and **before** `A40`'s high-breach tree and before `A39`'s low
breach.

**INPUTS** resolved episode value `A_now`, `outerMin`, `outerMax`.

```text
AdvisoryCeiling = outerMax + 1.0        [dKH]     # the only new constant; an OFFSET
AdvisoryFloor   = outerMin - 1.0        [dKH]     # from the CONFIGURED bounds

escalate  <=>  A_now >= AdvisoryCeiling  OR  A_now <= AdvisoryFloor
               inclusive at the boundary; exact decimal comparison
               (ALK-DECIMAL-THRESHOLD-001). NO epsilon exists or may be added.

escalate:
    recommendedDoseMlPerDay             = WITHHELD   # the data contract's own token
    temporarySafetyRateContinuousMlPerDay = NOT_RUN
    temporarySafetyRateRecommendationMlPerDay  = NOT_RUN
    maintenanceEstimateStatus           = UNRESOLVED
    SAFETY_ADVISORY_CONFIDENCE_WARNING
    NOT zero - withheld, not set. Zero is a delivery instruction.

    escalation message states: the measured value; that it is outside the range the
      engine will advise on; that the reading should be confirmed by a second test;
      that the doser should be checked for fault or overdose; that correction at this
      level requires experienced judgement about the specific system

    PRESERVED, and REQUIRED - escalation does not suppress any of them:
               outerBoundState (BREACHED_HIGH / BREACHED_LOW - NOT reclassified);
               the shortened / reprioritised retest the scheduler already owned
                 (~24 h high-breach cadence, or REPEAT_NOW where a repeat rule
                  already requires one) - still EMITTED, never NOT_RUN;
               every raw measurement and audit record;
               ALK-RETURN-TERMINATED-BY-SAFETY-001 and the intervention lock

    EXCEPTION: an already-authoritative safety rule that explicitly governs the state
      continues to govern - ALK-SAFETY-CORRECTION-RESOLUTION-001's one-off correction
      volume, ALK-SAFETY-RETURN-INTEGRATION-001, the composite rail, the liquid guard,
      ALK-SAFETY-MG-OVERRIDE-001. This rule withholds the engine's OWN sized delivery
      guidance and nothing else.

CONTESTED EPISODE:
    every member at or beyond the boundary -> ESCALATE
      (the disagreement is about which extreme is right, not about whether the state
       is beyond what the engine will advise on)
    members STRADDLE the boundary -> no value resolves; ALK-EPISODE-RESOLUTION-001's
      CONTESTED_METHODS / REPEAT_NOW behaviour governs unchanged
```

**SCOPE** This narrows but does **not** resolve `OI-SIZINGFLAT-001`. Between `outerMax` and
`AdvisoryCeiling`, `R_down` still saturates at the 0.50 dKH/day rail and the sized rate stops
responding to `A_now`. `R_down` saturates at `A_now >= A_safe,high + 0.50`, i.e. at
`outerMax + 0.30` for the owner's bounds, so **0.70 of the 1.0 dKH advisory band is flat**.
That item stays open.

**RECORDED EXPOSURES, all OPEN and none decided here** — each is also a `RECORDED EXPOSURE`
block in the canon rule and a register entry:

```text
OI-ADVISORYEXCEPTION-001  is the exception list closed or illustrative, and does the
                          high-side SAFETY_RETURN's temporary rate continue at or
                          beyond AdvisoryCeiling?  Encoded as written: it does not.
OI-ADVISORYMEMBERS-001    is a SUSPECT member a member for "every member beyond"?
                          Encoded as: do not choose - emit contested + REPEAT_NOW.
OI-ADVISORYRETEST-001     is escalation a retest-scheduler candidate?  Encoded as:
                          no new candidate; the scheduler's existing answer stands.
OI-ADVISORYRETURN-001     an in-flight DOWNWARD return plan terminated at the ceiling
                          stops a reduction and so raises delivery, with no sized
                          replacement.  Encoded as: named, not filled.
```

**Consequence of "withhold rather than set", stated as a number.** On `AD-ESC-001`'s inputs
(`P` 0.0693, `A_safe,high` 10.8, `D_current` 9.0, increment 0.1): 11.9 dKH commands
**1.8 mL/day**; 12.0 dKH commands nothing, so the pump continues at **9.0 mL/day**.
`outerBoundState` is `BREACHED_HIGH` at both. Neither `ALK-046` nor
`ALK-LIQUID-VOLUME-GUARD-001` constrains the continuing rate, because the engine generates
no delivery for them to bind on.

**OUTPUT** `AdvisoryRangeEscalation`.

**REASON CODE** `SAFETY_ADVISORY_CONFIDENCE_WARNING`.

**FAILURE STATE** `outerMin` / `outerMax` unavailable ⇒ the boundary is not computable and
this check is `NOT_RUN`; the outer-bound machinery is already unavailable in that state.

**TESTS** `AD-ESC-001` (ceiling: immediately below ⇒ ordinary sizing, exactly at ⇒
escalation, immediately above ⇒ escalation; two configured bound pairs; a decimal-straddling
pair), `AD-ESC-002` (the same against the floor, plus the `OuterMin = 8.2` / `A_now = 7.2`
case where binary64 and exact decimal disagree), `AD-ESC-003` (contested episode, all
members beyond ⇒ escalation, not withheld-as-contested; straddling ⇒ `NOT_RUN`).

## A41 — Safety-return completion and integration

```text
low  completes only when  A_now >= A_safe_low   (7.20)
high completes only when  A_now <= A_safe_high  (10.80)

crossing back over the RAW bound (7.0 / 11.0) does NOT complete the return:
    outerBoundState = RECOVERING_INSIDE_BOUND ; SAFETY_RETURN stays active

on completion: end SAFETY_RETURN; resume ordinary maintenance/stability sequencing;
               further movement toward the preferred range uses opt-in return-plan rules
```

**Integration** — `ALK-SAFETY-RETURN-INTEGRATION-001`:

```text
1 maintenance may still be CALCULATED and displayed, but a new maintenance-dose change
  is NOT implemented while the safety return is active
      maintenanceActionStatus = DEFERRED_BY_SAFETY_RETURN
2 a prior maintenance intervention awaiting attribution ->
      priorResponseAttribution = INTERRUPTED_BY_SAFETY_RETURN
      its snapshot is preserved; its prediction is not rewritten;
      after the safety return ends, a NEW clean regime is built
3 a delivered safety return is a KNOWN Alk correction input for segmentation:
      amount and time known   -> record, normalize under the correction rules
      amount or time unknown  -> CONFOUNDED; invent nothing
4 any interval materially affected -> potencyLearningEligible = false,
      reason SAFETY_RETURN_CONFOUND; the safety return is never a calibration intervention
5 SAFETY_RETURN owns the Alk intervention lock for NEW dose-change recommendations:
      no new maintenance-dose change implemented
      no ordinary return plan started
      no second Alk correction layered on top
   the engine may still observe, recompute position, recompute a provisional maintenance
   estimate, shorten retesting, and stop/modify the safety return on new evidence
5b an ALREADY RUNNING ordinary return plan is TERMINATED, not suspended:
                                       [ALK-RETURN-TERMINATED-BY-SAFETY-001]
      returnPlanPhase              = TERMINATED_BY_SAFETY_RETURN
      recommendedTemporaryMovement = STOP_PENDING_USER_ACTION
      actualDose                   = last confirmed/logged value, or UNKNOWN
      RETURN_TERMINATED_BY_SAFETY_RETURN
   the SAFETY_RETURN then owns the SINGLE intentional movement component, so
   ALK-COMPOSITE-RAIL-001 has one term; opposing components are never layered
   the terminated plan keeps its id, destination, duration, expiry and history;
   termination is an EVENT, not a rewrite
   it CANNOT resume automatically. After safety completion, ordinary sequencing
   resumes at HOLD; a new plan needs fresh ALK-RETURN-ELIGIBLE-TRAJECTORY-001
   eligibility AND a fresh opt-in
      RETURN_NO_AUTOMATIC_RESUME_AFTER_SAFETY
10 the lock is a RECOMMENDATION lock. It never asserts the keeper cannot change a pump.
   An external change during a safety return is recorded, re-segmented and re-evaluated.
```

**TESTS** `WG-ALK-053`, `WG-ALK-056`, `WG-ALK-057`, `WG-ALK-058`, `WG-ALK-059`,
`WG-ALK-060`, `AD-RTN-004` (in-flight plan terminated by a breach),
`AD-RTN-005` (negative control: no automatic resume after safety completion).

## A42 — Composite rail — `ALK-COMPOSITE-RAIL-001`

```text
deltaA_combined_24h = deltaA_safety
                    + P_selected * deltaD_maintenance
                    + SUM deltaA_other_planned

|deltaA_combined_24h| <= 0.50 dKH

allocation when components point the same way and would exceed the rail:
    1 safety-return movement receives priority
    2 the new maintenance adjustment is DEFERRED, not partially applied
    3 record DEFERRED_BY_SAFETY_RAIL
```

Never issue `+0.604 dKH/day` as two independently legal recommendations.

In the Alk-only runtime this rail has **no reachable multi-term case**: integration rule
§1 defers any new maintenance change unconditionally while a safety return is active,
clause 5b terminates any in-flight return plan on entry to `SAFETY_RETURN` rather than
layering an opposing component, and a return-plan offer requires `S_supported = 0`, which
is mutually exclusive with a supported non-zero slope. Implement it as a post-assembly assertion that fails loudly if more than one
intentional component is simultaneously recommended (`OI-PIPELINE-001`).

When both deferral conditions hold, emit **both** reason codes — the action is identical
and both statements are true (`OI-DEFERREASON-001`).

**TESTS** `WG-ALK-052`, `WG-ALK-058`.

## A43 — Gross liquid-volume guard — `ALK-LIQUID-VOLUME-GUARD-001`

```text
V_system_mL   = 1000 * netVolumeL
V_alk_max_24h = 0.02 * V_system_mL          2% of net system water per 24 h

SCOPE: ALL engine-generated Alk delivery                [ALK-LIQUID-VOLUME-GUARD-001]
  - ordinary maintenance mL/day
  - return-plan and one-off correction execution
  - SAFETY_RETURN correction volume and temporary safety delivery
  - the permitted COMBINED total for the same rolling 24 h

if a recommended 24 h delivery would exceed V_alk_max_24h:
    recommendedDoseMlPerDay  = WITHHELD
    NEVER cap the command to V_alk_max_24h and present that as the recommendation
    keep every unaffected output              [CORE-INFORM-PROCEED-001]
    if it is a correction / return-plan execution (duration is the engine's to choose):
        lengthen/stage until BOTH the guard and the 0.50 dKH/day rail hold
        report the longer duration; only the offending single-day command is withheld

POSITION: hard constraint, binding at BOTH positions:
  1 continuous candidate, ALK-049 step 8. Exceeds -> WITHHELD, stop.
    ALK-ROUNDING-001 is NOT entered, so its step 7 "violates only because rounding
    moved the command" precondition is never reached with a false premise.
  2 rounded command, ALK-ROUNDING-001 step 6. A compliant continuous candidate that
    rounds ABOVE the guard -> step 7 steps toward D_current until feasible;
    if nothing feasible remains -> WITHHELD.

NEVER emit a command numerically equal to V_alk_max_24h, at either position, whether
reached by capping or by stepping: it is indistinguishable from a capped command.

The guard constrains ENGINE-GENERATED delivery. A keeper's pre-existing dose above the
guard is not an engine-generated command; report the exceedance and withhold any new
command that would also exceed it.
```

The 0.50 dKH/day rail remains **independently** binding. A stronger solution reduces
liquid volume but does not make faster alkalinity movement safer.

Reachability: the guard binds only when `P < ΔA / (20 · V_L)` dKH/mL. For a 0.50 dKH
movement in a 77 L system that is `P < 0.000325 dKH/mL` — about 213× weaker than the
canon's 0.0693 dKH/mL reference solution.

**REASON CODE** `SAFETY_LIQUID_GUARD_APPLIED` when staging resolves it;
`SAFETY_LIQUID_GUARD_EXCEEDED` / `MAINTENANCE_LIQUID_GUARD_EXCEEDED` when the recommended
command is withheld.

**TESTS** `WG-ALK-067`, `AD-SAF-003` (staging), `AD-SAF-004` (a compliant continuous
candidate rounds above the guard; the post-rounding recheck steps back — this is the case a
pre-rounding-only check cannot catch), `AD-SAF-006` (continuous candidate already over the
guard ⇒ withheld at step 8, never issued at the guard value).

---

# GROUP 8 — RETURN PLANS

## A44 — Return plan

**OFFER** — `ALK-024`, `ALK-054`, `CORE-STABILISE-001`

```text
required, both:                       [ALK-RETURN-ELIGIBLE-TRAJECTORY-001]
    position != IN_RANGE
    returnPlanEligibleTrajectory:
        ALK-011 ordinary minimum evidence satisfied
          i.e. movementEvidence in { SUFFICIENT, UNCERTAINTY_LIMITED }
        AND S_supported = 0
          i.e. trajectory in { STABLE, UNCERTAINTY_LIMITED }

eligible      -> RETURN_OFFER_AVAILABLE (opt-in; the keeper decides)
not eligible  -> RETURN_OFFER_NOT_ELIGIBLE_TRAJECTORY
                 movementEvidence = INSUFFICIENT      -> no established evidence
                 S_supported != 0                     -> something is already moving

ALK-STABLE-001 is UNCHANGED and is NOT this predicate: STABLE still requires
S_supported = 0 AND S_observed = 0. A non-zero observed lean with zero supported
slope is UNCERTAINTY_LIMITED, is NOT STABLE, and IS return-plan eligible.
```

Automatic maintenance is unaffected — HOLD on both eligible trajectories.

**ARITHMETIC** — `ALK-054`, `ALK-055`

```text
A_T          = aimPoint = (rangeMin + rangeMax) / 2                 [a LEVEL]
S_plan       = +/- 0.125 | 0.25 | 0.50 dKH/day     (Gentle | Steady | Quick)
                = 25% | 50% | 100% of the 0.50 rail
D_temporary  = D_maintenance_reference + S_plan / P_selected        [a RATE]
D_temporary  = max(0, D_temporary)

D_maintenance_reference = the current held maintenance dose for an ordinary stable
                          out-of-range offer, NOT an uncertainty-shrunk guess

downward, when the requested rate exceeds what zero dosing can achieve:
    fastest achievable decline ~= -C_estimate at zero Alk dose
    clamp D_temporary to 0; report the honest longer duration
    NEVER imply negative dosing is possible
```

Worked values at `D_ref = 9.0`, `P = 0.0693`: Gentle `10.803752 → 10.8`;
Steady `12.607504 → 12.6`; Quick `16.215007 → 16.2` (effect `0.49896 ≤ 0.50` ✓).

**ARRIVAL AND COMPLETION** — `ALK-056`, `ALK-057`

```text
zoneWidth = max(bandWidth / 3, 2 * 0.10)   clamped to bandWidth
zone centred on the midpoint
for 8.2-8.8: max(0.2, 0.2) = 0.2  ->  arrival zone 8.4-8.6

STOP the temporary movement component on the FIRST measured reach or pass of the
aim point. Confirmation is a separate later stage and NEVER justifies keeping the
temporary dose running.
```

**EXPIRY** — `ALK-RETURN-EXPIRY-001`

```text
T_plan   = predictedDurationDays
T_expiry = 2 * T_plan + 2 days, from the ACTUAL implemented start

no valid assessment by T_expiry:
    returnPlanPhase              = EXPIRED_OVERRUN
    recommendedTemporaryMovement = STOP_PENDING_USER_ACTION
    assessment                   = TEST_NOW
    actualDose                   = last confirmed/logged value, or UNKNOWN

If the app cannot control or verify the device it must NOT set the actual dose state to
stopped merely because it recommended stopping.
```

At the scheduled assessment point with no new test: `ASSESSMENT_DUE`; the app must request
a test and must **not** infer that the aim point was reached (`WG-ALK-031`).

**MAINTENANCE SEPARATION** — a return plan's intentional trajectory must never be read as
evidence that maintenance is wrong, and consumption estimation during a plan must account
for the plan's known temporary input (Part II §40).

**TESTS** `WG-ALK-014` (approximately-zero observed, zero supported ⇒ offer),
`WG-ALK-015`, `WG-ALK-028`, `WG-ALK-031`, `WG-ALK-032`, `WG-ALK-035`, `ALK-G006`,
`ALK-G029`-`G032`, `AUDIT-021`, `AUDIT-022`, `AD-RTN-003` (negative control: insufficient
evidence and supported movement are both ineligible),
`AD-RTN-004`/`AD-RTN-005` (termination by safety return; no automatic resume).

---

# GROUP 9 — FORECAST, RETEST, CAPABILITY, OUTPUT, AUDIT

## A45 — Forecasting — `ALK-FORECAST-SLOPE-001`

**Uses `S_observed`, never `S_supported`**, and only once the trajectory itself has
sufficient or valid rapid evidence. Support-shrinkage is deliberately biased toward zero
for dosing conservatism and would make a dangerous trajectory look slower (`AUDIT-007`).

```text
A(t) = A_now + S_observed * t

Preferred-range forecast:
  falling, A_now > rangeMin -> T_rangeLow  = (A_now - rangeMin) / |S_observed|
  at/below rangeMin         -> T_rangeLow  = 0
  rising,  A_now < rangeMax -> T_rangeHigh = (rangeMax - A_now) / S_observed
  at/above rangeMax         -> T_rangeHigh = 0

Outer-operating-bound forecast (the limb the 50% cap uses):
  S_observed < 0 -> T_outerLow  = 0 if A_now <= outerMin
                                  else (A_now - outerMin) / |S_observed|
  S_observed > 0 -> T_outerHigh = 0 if A_now >= outerMax
                                  else (outerMax - A_now) / S_observed

irrelevant direction -> NOT_APPLICABLE, never a negative duration
```

The 50%-cap forecast limb fires only when `T_outer ≤ 48 h` — a **fixed** ordinary
comparison horizon, not the scheduler's selected next test (`OI-FORECASTHORIZON-001`).

Do not use a long-horizon linear forecast as a biological demand prediction.

**TESTS** `WG-ALK-042` (2.571 d > 2.0 ⇒ not unlocked), `WG-ALK-043` (1.8 d ≤ 2.0 ⇒
unlocked).

## A46 — Retest scheduler

**One scheduler owns final next-test timing** (`X-INV-004`). No card, notice or
notification computes a date.

**CANDIDATES** — `ALK-RETEST-SCHEDULER-001`

```text
REPEAT_NOW                latest cluster SUSPECT/ANOMALOUS from one of the three
                          operative sources and materially affects advice; or a result
                          would trigger a large intervention but is unconfirmed
                                                      [ALK-051, ALK-SUSPECT-DETECTION-001]
SAFETY_RETURN_ACTIVE      ~24 h; anchored to confirmed implementation if known,
                          otherwise to the qualifying breach assessment
HIGH_BREACH_FAILSAFE      ~24 h
RAPID_MOVEMENT            ~24 h
FORECAST_BOUNDARY_RISK    T_boundary = T_outer - 1.0 days      (24 h safety lead)
                          T_outer from ALK-062 using S_observed, NEVER S_supported
                          T_boundary <= 0 -> REPEAT_NOW semantics
                          NOT SUBMITTED once outerBoundState is BREACHED_LOW/HIGH:
                          there is no crossing left to forecast, ALK-062 clamps T_outer
                          to 0, and without this exclusion the scheduler would hold at
                          REPEAT_NOW forever and make the ~24 h safety cadence
                          unreachable in the state it was written for
POST_CHANGE_FIRST         ~48 h after the actual dose change
POST_CHANGE_SECOND        ~48 h after the first  (~Day 4)
SIGNAL_ACCUMULATION       T_signal = max(1 day, 0.10 / |S_supported|)   days
                          the 24 h floor is INSIDE this candidate's formula and applies
                          to NO other candidate
                          NOT_RUN when S_supported = 0 or evidence is INSUFFICIENT,
                          which includes a post-change regime that has not yet reached
                          ordinary sufficiency
RETURN_PLAN_EXPIRY        the plan's stored expiry, T_expiry = 2*T_plan + 2
ROUTINE_CADENCE           48 h
```

**CANDIDATES canonically `NOT_RUN`** — Freeze 5 declined to invent the constants:
`T_detect` (`K_detect` absent) and the return-plan **arrival cadence**. Both are reported
in `candidatesNotRun[]` with `RETEST_DETECTABILITY_POLICY_UNAVAILABLE` and
`RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE`. This is a decided state, not a gap.

**CLAMPS**

```text
ceiling  96 h   ordinary observation candidates    RETEST_OBSERVATION_CEILING_APPLIED
                the existing ~Day-4 window

floor    24 h   the SIGNAL_ACCUMULATION candidate ONLY, inside its own formula
                RETEST_SIGNAL_FLOOR_APPLIED
                |S_supported| > 0.10 dKH/day -> raw T_signal < 24 h -> floored

EXEMPT from the floor, and may schedule earlier or return TEST_NOW when warranted:
    REPEAT_NOW, RAPID_MOVEMENT, SAFETY_RETURN_ACTIVE, HIGH_BREACH_FAILSAFE,
    FORECAST_BOUNDARY_RISK
PRESERVED unchanged: POST_CHANGE_FIRST ~48 h, POST_CHANGE_SECOND ~Day 4,
    ROUTINE_CADENCE 48 h, the ~Day-4 ordinary ceiling, and one authoritative
    scheduler choosing the earliest applicable candidate.
```

**SELECTION**

```text
selected = earliest applicable candidate, after the clamp
REPEAT_NOW outranks ordinary scheduling                              [PII-55]
TIES: where candidates share the earliest time, emit EVERY tied candidate's reason code
      and record all of them in candidateTimes[]. Reason codes are additive, so no
      precedence is invented and the audit record does not depend on evaluation order.
      Reachable: T_signal at 24.0 h vs RAPID_MOVEMENT, or at 48.0 h vs ROUTINE_CADENCE.
preserve the understandable ~48 h human rhythm in RENDERING; the stored timestamp
is exact
```

**OUTPUT** `RetestDecision` with every candidate, its computed time, the selection reason,
and the not-run list.

**TESTS** `WG-ALK-060`, `WG-ALK-001` (post-change first, 48 h), `WG-ALK-006` (rapid, 24 h),
`ALK-G010`, `ALK-G011`, `AD-RET-001` (raw `T_signal` 22.913 h floored to 24 h and selected),
`AD-RET-002` (`T_signal` above the ceiling; routine cadence still earlier),
`AD-RET-003` (forecast boundary lead selects 40 h),
`AD-RET-004` (crossing inside the lead ⇒ test now),
`AD-RET-005` (already breached ⇒ the forecast candidate is not submitted and the ~24 h
safety cadence governs).

## A47 — Capability gate — `ALK-CAPABILITY-CONTRACT-001`

**RULE** a deterministic mathematical rule is not implementation-ready unless every
required datum has a capture source, a stored representation and a defined missing-data
behaviour. **No implementation may silently manufacture a missing input.**

```text
DEGRADE   continue on a named weaker but valid path
REFUSE    withhold the affected recommendation and name what is missing
NOT_RUN   disable the affected optional analysis while unrelated Alk control continues
```

Evaluate `M-1` … `M-13` before the recommendation pipeline and attach the resulting
`CapabilityState[]` to every `EngineResult`. The full mapping is in
`ALK-V2-DATA-CONTRACT.md` §8.

**Withhold only the affected output.** `CORE-INFORM-PROCEED-001`: if the unresolved issue
makes the recommendation mathematically, evidentially or physically unsupported, withhold
that output and continue providing every unaffected conclusion. If it merely makes success
less likely, inform and proceed.

**TESTS** `WG-ALK-045`, `WG-ALK-046`, `WG-ALK-047`, `WG-ALK-048`, `WG-ALK-054`,
`WG-ALK-061`, `WG-ALK-065`, `WG-ALK-066`, `X-GOV-003`.

## A48 — Result assembly

**INPUTS** every stage output.

**RULES**

```text
1 emit EVERY field; NOT_RUN / WITHHELD / NONE are values, not omissions
2 every withheld or degraded output carries at least one reason code
3 recommendationConfidence = UNSPECIFIED by frozen decision      [ALK-CONFIDENCE-OUTPUT-001]
  no numeric LOW/MODERATE/HIGH classification exists and none may be invented
  the evidence facts are surfaced in its place: independentClusters, spanDays,
  sigma_S, |S_supported|/|S_observed| (omitted when S_observed = 0), confounders[],
  potencyConfidence, deliveryBasis
  it can never participate in arithmetic                       [X-INV-010]
  OUTPUT_CONFIDENCE_UNSPECIFIED
4 the seven dose/slope quantities are separate named fields    [ALK-VARIABLE-SEMANTICS-001]
5 reason codes are emitted in owner order:
      VALIDATION_, TIME_, CONFIG_, CLUSTER_, SEGMENT_, DELIVERY_, EVIDENCE_,
      TRAJECTORY_, UNCERTAINTY_, CONSUMPTION_, POTENCY_, INTERVENTION_, RESPONSE_,
      MAINTENANCE_, BRACKET_, RETURN_, SAFETY_, RETEST_, CAPABILITY_, OUTPUT_,
      AUDIT_, PRESENTATION_, MIGRATION_
6 no reason code outside the closed catalogue may be emitted
```

## A49 — Audit and deterministic replay

```text
every analysis function takes an explicit asOf; none reads a clock
no randomness, no unseeded sampling, no bootstrap
sort by (absoluteInstant, eventOrdinal, eventId) before any ordered computation
full stored precision; rounding only at the recommendation step and at presentation
write an AuditTrace with every actionable assessment

historical assessments are NEVER rewritten:
    a backdated insertion, edit or invalidation recomputes CURRENT analysis and
    creates a NEW assessmentId; the historical record of what the app said stays
    a configuration change now does not alter a historical recommendation record
```

Replay contract: same ledger + configuration history + `asOf` + engine/canon version ⇒
byte-identical result and trace.

**TESTS** `ALK-G040`, `WG-ALK-029`, `WG-ALK-030`, `WG-ALK-065`, `INV-REPLAY-001`.
