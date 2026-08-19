# ALK V2 — IMPLEMENTATION CONTRACT

**Authority:** `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` under `SHARED_V2_FREEZE_2`
and `ALK_V2_FREEZE_4`.
**Status:** implementation specification. Non-authoritative over canon.
**Scope:** the alkalinity domain of the first V2 runtime — Alk advisory controller ACTIVE,
Calcium and Magnesium measurement-only and inert (`MIGRATION-ALK-ONLY-001`).

---

## 1. The five layers that must never be collapsed

Canon `CORE-SOURCE-001`, Part I §2, §3, §8, §50 and `DEC-003` require five distinct
kinds of statement. Every field, function and test in this package belongs to exactly
one of them.

```text
LAYER 1  RAW FACT
         What was actually recorded. Measurements, dose events, corrections,
         water changes, equipment events, configuration versions.
         Never derived. Never overwritten. Never rounded.

LAYER 2  OBSERVED TRAJECTORY
         What the tank is doing, as a robust central estimate.
         S_observed (Theil-Sen), sigma_S, C_estimate, forecasts.
         Uses the FULL observed slope. Never uncertainty-shrunk.

LAYER 3  SUPPORTED TRAJECTORY
         The part of the observed movement that is separated from uncertainty
         far enough to size an actuator change.
         S_supported. Deliberately biased toward zero.
         NEVER used for physical demand, risk forecast, or position.

LAYER 4  RECOMMENDED ACTION
         What the engine advises. Dose, correction, plan, hold, retest.
         A recommendation is not an implementation (`IX-004`).

LAYER 5  PRESENTATION
         Wording, cards, notices, ordering, emphasis.
         Renders layers 1-4. Computes nothing. Decides nothing.
```

Two boundary rules follow directly from canon and are non-negotiable:

- **Layer 2 → Layer 3 is one-way.** `S_supported` may be derived from `S_observed`; no
  quantity in Layer 2 may be derived from `S_supported` (`ALK-CONSUMPTION-ESTIMATE-001`,
  `ALK-FORECAST-SLOPE-001`).
- **Layer 5 → Layer 4 is impossible.** Presentation has no write path into the domain
  (`CORE-SOURCE-001`, `X-INV-004`).

### UI states are not domain states

V1's wizard-state vocabulary (`blocked`, `emergency`, `correcting-dose`, `fell-short`,
`overshot`, `idle`, …) is **not** reproduced anywhere in this package. Canon Part III's
V1 wizard-state mapping is a *projection table*: combinations of V2 primitives that a
presentation layer may render with V1-derived wording. No domain enum in
`ALK-V2-DATA-CONTRACT.md` carries a card name.

---

## 2. Frozen constants

Every numeric constant the Alk domain may use, with its canonical owner. **No other
numeric constant may be introduced by an implementation.** A number not in this table
and not derived from it by a canonical equation is a defect.

| Constant | Value | Unit | Canon owner |
|---|---|---|---|
| `SIGMA_ALK_BASE` | 0.10 | dKH | `ALK-004` |
| `ALK_SLOPE_SUPPORT_K` | 1.28 | — | `ALK-SUPPORTED-SLOPE-001` |
| `ALK_RESPONSE_K` | 1.28 | — | `ALK-RESPONSE-CLASSIFIER-001` |
| `MAD_SCALE` | 1.4826 | — | Part II §5.6, §19.4 |
| `REPEAT_CLUSTER_WINDOW` | 30 | minutes | `ALK-005` / Part II §5.3 |
| `REPEAT_SPREAD_LIMIT` | 0.20 | dKH | `ALK-005` |
| `ROUTINE_CADENCE` | 48 | hours | `ALK-006`, `ALK-050` |
| `MAX_CONTROL_LOOKBACK` | 14 | days | `ALK-007` |
| `MIN_INDEPENDENT_SPACING` | 24 | hours | `ALK-008` |
| `MIN_ORDINARY_CLUSTERS` | 3 | count | `ALK-MOVEMENT-001`, `ALK-MINIMUM-CADENCE-001` |
| `MIN_ORDINARY_SPAN` | 4 | days | `ALK-MOVEMENT-001`, `ALK-MINIMUM-CADENCE-001` |
| `RAPID_THRESHOLD` | 0.30 | dKH/day | `ALK-RAPID-001` |
| `RAPID_MIN_ELAPSED` | 24 | hours | `ALK-RAPID-001` |
| `RAPID_RETEST` | 24 | hours | `ALK-052` |
| `DEFAULT_TARGET_MIN` / `MAX` | 8.2 / 8.8 | dKH | `ALK-003` (suggestion, user-editable) |
| `OUTER_MIN` / `OUTER_MAX` | 7.0 / 11.0 | dKH | `ALK-OUTER-BOUNDS-001` (configurable default) |
| `B_SAFETY` | 0.20 | dKH | `ALK-SAFETY-BUFFER-001` (fixed; **not** recomputed) |
| `SAFETY_MAX_24H_MOVE` | 0.50 | dKH | `ALK-003A` low/high breach `min(..., 0.50)` |
| `SAFETY_RETEST` | 24 | hours | `ALK-SAFETY-RETURN-INTEGRATION-001` §9 |
| `ALK_RATE_RAIL` | 0.50 | dKH/day | `ALK-046`, `ALK-COMPOSITE-RAIL-001` |
| `ORDINARY_STEP_CAP` | 0.25 | fraction | `ALK-STEP-CAP-001` |
| `EXCEPTIONAL_STEP_CAP` | 0.50 | fraction | `ALK-STEP-CAP-001` |
| `STEP_CAP_MEANINGFUL_MULTIPLE` | 4 | × increment | `ALK-STEP-CAP-001` (`D_current ≥ 4 R_pump`) |
| `LIQUID_GUARD_FRACTION` | 0.02 | of net volume / 24 h | `ALK-LIQUID-VOLUME-GUARD-001` |
| `UNKNOWN_WC_ASSUMED_MISMATCH` | 2.0 | dKH | `ALK-WATERCHANGE-UNKNOWN-001` |
| `WC_UNKNOWN_BREAK_FRACTION` | 0.05 | fraction | `ALK-WATERCHANGE-UNKNOWN-001` (derived: 0.10 / 2.0) |
| `ALK_MATERIALITY_FLOOR` | 0.10 | dKH | `ALK-033` (= `SIGMA_ALK_BASE`) |
| `POSTCHANGE_FIRST_TEST` | 48 | hours | `ALK-POSTCHANGE-001`, `ALK-POSTCHANGE-RETEST-001` |
| `POSTCHANGE_SECOND_TEST` | 48 | hours after first | `ALK-POSTCHANGE-RETEST-001` |
| `ATTRIBUTION_HORIZON` | 14 | days | `ALK-RESPONSE-DETECTABILITY-001` |
| `POTENCY_SNR_DIAGNOSTIC` | 2.0 | — | `ALK-017` |
| `POTENCY_SNR_CALIBRATION` | 3.0 | — | `ALK-017` |
| `POTENCY_MIN_SIDE_CLUSTERS` | 3 | count | `ALK-017` |
| `POTENCY_MIN_SIDE_SPAN` | 4 | days | `ALK-017` |
| `POTENCY_ENVELOPE_LOW` / `HIGH` | 0.40 / 1.60 | × `P_expected` | `ALK-POTENCY-PLAUSIBILITY-001` |
| `POTENCY_CALIBRATED_N` / `SPAN` / `RDISP` | 3 / 7 days / 0.15 | — | `ALK-POTENCY-CONFIDENCE-001` |
| `POTENCY_STRONG_N` / `SPAN` / `RDISP` | 5 / 14 days / 0.10 | — | `ALK-POTENCY-CONFIDENCE-001` |
| `POTENCY_REASSESS_DELTA` | 0.15 | fraction | `ALK-POTENCY-CONFIDENCE-001` |
| `BRACKET_MAX_AGE` | 45 | days | `ALK-032` |
| `BRACKET_COMPARABILITY_RC` | 0.25 | fraction | `ALK-BRACKET-COMPARABILITY-001` |
| `RETURN_PACE_GENTLE/STEADY/QUICK` | 0.125 / 0.25 / 0.50 | dKH/day | `ALK-055` |
| `RETURN_EXPIRY` | `2·T_plan + 2` | days | `ALK-RETURN-EXPIRY-001` |
| `Na2CO3_FACTOR` | 0.05284 | dKH·L/(g·mL) | `ALK-014` |
| `NaHCO3_FACTOR` | 0.03333 | dKH·L/(g·mL) | `ALK-014` |
| `NaOH_FACTOR` | 0.07000 | dKH·L/(g·mL) | `ALK-014` |
| `MEQ_PER_L_TO_DKH` | 2.8 | dKH per meq/L | `ALK-002` |

### Constants the canon references but never assigns for alkalinity

These are **absent**, not zero and not inheritable. See `ALK-V2-OPEN-ISSUES.md`.

```text
K_detect                        Part II §52   -> OI-RETEST-001
RequiredMovement (T_signal)     Part II §53   -> OI-RETEST-001
boundarySafetyMargin            Part II §54   -> OI-RETEST-001
minimumUsefulInterval           Part II §66   -> OI-RETEST-001
maximumObservationInterval      Part II §66   -> OI-RETEST-001
minimumExposure (Alk)           Part II §30   -> OI-EXPOSURE-001
suspicious-reading threshold    Part II §47   -> OI-SUSPECT-001
replacement-water confidence tier required for normalization
                                Part II §45   -> OI-WATERCHANGE-001
consumption-uncertainty model (sigma_C)
                                ALK-031       -> OI-NEGCONS-001
recommendationConfidence derivation
                                ALK-071       -> OI-CONFIDENCE-001
```

An implementation **must not** supply any of these from a neighbouring parameter, from
V1, or from a plausible default (Part I §56, Part II §7.4, `CORE-INFORM-PROCEED-001`).

---

## 3. Frozen units

One dimension per field (`ALK-VARIABLE-SEMANTICS-001`, Part I §44, `X-INV-009`).

```text
alkalinity level        dKH
trajectory / slope      dKH/day
consumption             dKH/day
effective potency       dKH/mL
maintenance dose rate   mL/day
one-off correction      mL
system volume           L
elapsed time            seconds internally; days for all rate arithmetic
stock concentration     g/L
water-change fraction   dimensionless 0..1
```

`ΔDays = Δseconds / 86400` exactly (Part I §13, Part II §2.2). Calendar-day
subtraction, date-label counting and "days ago" rounding are forbidden as rate inputs.

A field named `target` is forbidden. Use `targetRangeMinDkh`, `targetRangeMaxDkh`,
`aimPointLevelDkh`, `recommendedDoseMlPerDay`, `plannedDoseMlPerDay`,
`safetyDestinationDkh` (Part I §44).

---

## 4. Canonical evaluation order

One assessment = one pure function of `(eventLedger, configurationHistory, asOf)`.
Stages run in this order. A later stage never rewrites an earlier stage's output.

```text
 0  RESOLVE CONFIGURATION      configuration version effective at asOf
                              -> SHARED-CONFIG-VERSION-001

 1  VALIDATE + NORMALISE       ingest validation, unit check, time provenance
                              -> Part II §2.3A, §3.3, SHARED-LEGACY-TIME-001

 2  CLUSTER                    repeat grouping, representative value/time,
                              internal spread, ANOMALOUS marking
                              -> ALK-005, Part II §5

 3  POSITION                   latest valid cluster value -> position class,
                              outer-bound state
                              -> CORE-POSITION-001, ALK-010, ALK-OUTER-BOUND-ACTION-001

 4  CAPABILITY GATE            evaluate M-1..M-13; compute DEGRADE/REFUSE/NOT_RUN set
                              -> ALK-CAPABILITY-CONTRACT-001

 5  SEGMENT                    build inference-specific analytical segments;
                              apply boundaries, confounders, known-input normalization
                              -> Part II §12-16, ALK-007, ALK-033, ALK-034

 6  INDEPENDENCE               select independent clusters (>= 24 h spacing)
                              -> ALK-008                     [see OI-INDEPENDENCE-001]

 7  TREND (observed)           Theil-Sen slope, intercept, residuals
                              -> ALK-009, Part II §19

 8  UNCERTAINTY                sigma_resid, sigma_point, Sxx, sigma_S
                              -> ALK-SLOPE-UNCERTAINTY-001

 9  SUPPORT                    S_supported = sign(S)·max(0, |S| - 1.28 sigma_S)
                              -> ALK-SUPPORTED-SLOPE-001

10  MOVEMENT EVIDENCE          ordinary sufficiency / rapid exception /
                              UNCERTAINTY_LIMITED / INSUFFICIENT
                              -> ALK-MOVEMENT-001, ALK-STABLE-001, ALK-RAPID-001

11  CONSUMPTION                C_estimate = P_selected·D - S_observed; physicality
                              -> ALK-CONSUMPTION-ESTIMATE-001, ALK-NEGATIVE-CONSUMPTION-001

12  POTENCY                    observation, plausibility, pooling, confidence,
                              selectedPotency     [CAPABILITY_GATED by default]
                              -> ALK-016..ALK-021, ALK-POTENCY-CAPABILITY-GATE-001

13  RESPONSE                   pre-evidence gate -> attribution gate -> detectability
                              gate -> six-way classifier; overshoot separately
                              -> ALK-RESPONSE-*

14  SAFETY                     outer-bound state -> SAFETY_RETURN; high-breach fail-safe;
                              intervention lock; composite rail allocation
                              -> ALK-OUTER-BOUND-ACTION-001, ALK-COMPOSITE-RAIL-001

15  MAINTENANCE PIPELINE       see §5 below
                              -> ALK-044, ALK-049

16  RETURN PLAN                offer / arithmetic / pace / arrival / completion / expiry
                              -> ALK-054..ALK-058

17  RETEST                     single scheduler; collect candidates; select
                              -> ALK-050..053, Part II §50-57

18  RESULT ASSEMBLY            EngineResult + reason codes + confidence label
                              -> ALK-069A, ALK-CONFIDENCE-OUTPUT-001

19  AUDIT                      AuditTrace persisted with every actionable assessment
                              -> ALK-069, Part II §63, §64
```

---

## 5. Maintenance recommendation pipeline

Canonical order from `ALK-049`, with the constraints listed in `ALK-044`. Steps marked
`[unplaced]` are constraints the canon requires but whose position `ALK-049` does not
state; see `ALK-V2-OPEN-ISSUES.md` → `OI-PIPELINE-001`.

```text
P0  evidence gate
      movementEvidence must be SUFFICIENT (ordinary) or a confirmed rapid basis.
      INSUFFICIENT           -> HOLD  EVIDENCE_INSUFFICIENT_*
      CONFOUNDED / ANOMALOUS -> HOLD  EVIDENCE_*
P1  uncertainty-limited gate
      S_supported == 0 and S_observed != 0
                             -> HOLD  TRAJECTORY_UNCERTAINTY_LIMITED
      S_supported == 0 and S_observed == 0
                             -> HOLD  TRAJECTORY_STABLE
P2  intervention lock
      SAFETY_RETURN active   -> DEFER MAINTENANCE_DEFERRED_BY_SAFETY_RETURN
      unassessable ordinary intervention and post-change regime not yet
      independently sufficient
                             -> HOLD  MAINTENANCE_INTERVENTION_LOCK
P3  potency validity / context
      P_selected missing or invalid
                             -> WITHHOLD mL; state dKH  POTENCY_REQUIRED
P4  continuous action candidate
      dD_supported = -S_supported / P_selected
      D_action_continuous = D_current + dD_supported
P5  physical rate rail (ALK-046)
      |P_selected · dD| <= 0.50 dKH/day  -> clamp; SAFETY_RATE_RAIL_APPLIED
P6  dose-step cap (ALK-STEP-CAP-001)
      if D_current >= 4·R_pump: |dD| <= cap · D_current, cap = 0.25 or 0.50
      else: BASELINE_ESTABLISHMENT, percentage cap inactive
P7  empirical bracket (ALK-032)  advisory only; never changes the number
P8  non-negative clamp          D >= 0
P9  [unplaced] gross liquid-volume guard (ALK-LIQUID-VOLUME-GUARD-001)  -> OI-LIQUIDGUARD-001
P10 [unplaced] composite rail allocation (ALK-COMPOSITE-RAIL-001)       -> OI-PIPELINE-001
P11 actuator rounding (ALK-ROUNDING-001)
      requires R_pump; missing -> REFUSE ACTUATOR_INCREMENT_REQUIRED (M-1)
      nearest -> tie toward D_current -> tie lower -> recheck hard constraints ->
      step toward D_current until feasible -> if back at D_current: HOLD
                                              MAINTENANCE_ACTUATOR_RESOLUTION
P12 recompute predicted post slope from the FINAL command (ALK-PREDICTED-POST-SLOPE-001)
      S_pred_post = S_observed + P_selected · (D_recommended - D_current)
P13 emit recommendation + reason codes + confidence label
```

**Never predict zero.** `S_pred_post` is computed from the actual final command, and is
normally non-zero because `S_supported` is deliberately conservative.

---

## 6. Alk-only V2 runtime posture

Per `MIGRATION-ALK-ONLY-001`, `MIGRATION-INERT-CA-MG-MEASUREMENTS-001`,
`MIGRATION-MG-GATE-ISOLATION-001` and `PROJECT-STATE.md`:

```text
alkalinity.controller            = ACTIVE
alkalinity.potencyLearning       = CAPABILITY_GATED   (default OFF)
calcium.controller               = NONE   (logging + history + chart only)
magnesium.controller             = NONE   (logging + history + chart only)
magnesiumGateState               = UNKNOWN            (always, unconditionally)
```

`magnesiumGateState = UNKNOWN` is a **constant** in this runtime. It is not derived from
any logged Mg value under any condition. Under `UNKNOWN`, `ALK-SAFETY-MG-OVERRIDE-001`
requires: allow `SAFETY_RETURN`, invent no low-Mg warning.

---

## 7. Determinism contract

Canon Part II §64, `ALK-G040`, `WG-ALK-040`.

1. Every domain function takes an explicit `asOf` instant. No function reads a clock.
2. No randomness, no unseeded sampling, no bootstrap.
3. No iteration-order dependence: sort by `(instant, eventOrdinal, eventId)` before any
   ordered computation.
4. No locale, timezone-of-the-viewer, or display-rounding dependence.
5. Full stored precision throughout; rounding happens only at the actuator step and at
   presentation (Part II §2.3, `ALK-002`).
6. Same ledger + same configuration versions + same `asOf` + same engine/canon version
   ⇒ byte-identical `EngineResult`.

Floating-point tolerance for fixture comparison: absolute `1e-9` on dKH and mL
quantities, `1e-12` on dimensionless ratios, exact equality on enums, reason codes and
counts. Actuator commands compare exactly after rounding.

---

## 8. Build sequence

The modules in `ALK-V2-MODULE-DESIGN.md` are buildable in this order; each step is
independently testable against the fixture corpus.

```text
 1  time + validation + measurement model            fixtures: VAL-*, TIME-*
 2  clustering                                       fixtures: CLU-*
 3  event ledger + configuration versioning          fixtures: CFG-*
 4  segmentation + normalization                     fixtures: SEG-*, WC-*, COR-*
 5  trend + uncertainty + support                    fixtures: TRD-*, WG-ALK-001..004, 062
 6  evidence + movement classification               fixtures: EVD-*, WG-ALK-049
 7  consumption                                      fixtures: CON-*, WG-ALK-013
 8  capability gate                                  fixtures: CAP-*, WG-ALK-045..048
 9  maintenance pipeline + rounding + rails          fixtures: MNT-*, WG-ALK-005, 006, 063
10  intervention + prediction snapshot               fixtures: INT-*, WG-ALK-016..021
11  response classifier                              fixtures: RSP-*, WG-ALK-007..010
12  safety return                                    fixtures: SAF-*, WG-ALK-041, 051..061
13  return plan                                      fixtures: RTN-*, WG-ALK-014, 015, 031..035
14  retest scheduler                                 fixtures: RET-*, WG-ALK-060
15  potency learner (gated)                          fixtures: POT-*, WG-ALK-024..027, 050
16  result assembly + reason codes + audit/replay    fixtures: INV-*, WG-ALK-040
```

Empirical potency learning (step 15) is `CAPABILITY_GATED` and must ship disabled until
every datum in `ALK-POTENCY-CAPABILITY-GATE-001` exists. The core controller must be
fully functional with `selectedPotency = theoretical/configured` while it is gated.

---

## 9. Conformance gate

Alk V2 is conformant only when all of the following hold. Compiling is not conformance
(canon handoff, "Implementation gate").

1. every fixture in `fixtures/` passes at the declared tolerance;
2. every invariant in `ALK-V2-INVARIANTS.md` passes as an executable property test;
3. `asOf` replay of any historical ledger is byte-deterministic;
4. no reason code is emitted that is not in `ALK-V2-REASON-CODES.md`;
5. no numeric constant exists in the domain that is not in §2 above;
6. no presentation module imports a domain calculation function;
7. every rule in `ALK-V2-RULE-TRACEABILITY.md` marked `ACTIVE` has at least one passing
   fixture;
8. every open issue in `ALK-V2-OPEN-ISSUES.md` is either closed by an owner decision or
   has its dependent output explicitly emitting `NOT_RUN` / `REFUSE` with the stated
   reason code — never a silently chosen default.

Condition 8 is the important one. **An unclosed open issue is implemented as a refusal,
not as a guess.**
