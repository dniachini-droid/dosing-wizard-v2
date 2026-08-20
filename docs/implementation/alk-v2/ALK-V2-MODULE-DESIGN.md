# ALK V2 — MODULE DESIGN

A pure-domain structure that can be implemented independently of UI framework, database,
authentication, payments, AI and cloud provider.

**No programming language is chosen.** `DECISIONS.md` records no language or stack
decision at the time of writing (`DEC-012` leaves persistence open; Phase 1 of
`ROADMAP.md` is unstarted), so this design is expressed in language-neutral terms:
modules, inputs, outputs, dependency direction and purity.

---

## 1. Dependency law

```text
                        ┌──────────────────────────────┐
   ADAPTERS (impure)    │  persistence · clock · UI    │
                        │  notifications · export      │
                        └──────────────┬───────────────┘
                                       │  calls inward only
                                       ▼
                        ┌──────────────────────────────┐
   APPLICATION          │  L0  orchestration           │
   (impure boundary)    │      assessAlkalinity(...)    │
                        └──────────────┬───────────────┘
                                       │
                                       ▼
   DOMAIN (pure)        L1 … L8  (below).  No I/O. No clock. No globals.
```

**One law:** dependencies point inward and downward. A module may depend only on modules
in a strictly lower layer, plus the shared kernel. There is no upward or sideways
dependency anywhere in the domain, which makes circularity structurally impossible rather
than merely discouraged.

Concretely:

- nothing in L1–L8 imports anything from L0 or the adapters;
- nothing in L1–L8 reads a clock, a file, a database, an environment variable, a locale or
  a random source;
- the only way a value enters the domain is as a function argument;
- the only way a value leaves is as a return value.

---

## 2. Module map

### L0 — Application orchestration (impure boundary; thin)

| Module | Responsibility |
|---|---|
| `alk.assess` | The single entry point. Loads the ledger and configuration history through ports, calls the pure pipeline with an explicit `asOf`, persists the `EngineResult` and `AuditTrace`. **Contains no chemistry.** |
| `alk.ports` | Interface declarations only: `EventLedgerPort`, `ConfigurationPort`, `AssessmentStorePort`, `ClockPort`. Implemented by adapters; never by the domain. |

`ClockPort` exists so the *application* can obtain "now" and pass it in as `asOf`. No
domain module may hold a reference to it (`INV-A2`).

### Shared kernel (pure; depended on by every layer)

| Module | Responsibility | Purity |
|---|---|---|
| `kernel.units` | Dimensioned quantity types: `Dkh`, `DkhPerDay`, `DkhPerMl`, `MlPerDay`, `Ml`, `Litres`, `Days`, `Fraction`, `GPerL`. Arithmetic that preserves dimension. | pure total |
| `kernel.time` | `Instant`, `TimeProvenance`, `elapsedDays`, the total event ordering. | pure total |
| `kernel.stats` | `median`, `mad`, `theilSenSlope`, `theilSenIntercept`, `sxx`. Standard arithmetic median (`OI-MEDIAN-001`). | pure total |
| `kernel.result` | `Computed<T> = Value(T) \| NotRun(ReasonCode[]) \| Withheld(ReasonCode[])`. The type that makes a refusal impossible to forget. | pure total |
| `kernel.reasons` | The closed reason-code catalogue and its payload shapes. | pure total |

`kernel.stats` deliberately holds **no chemistry**: it does not know what a dKH is. That
keeps the estimator independently testable and prevents an alkalinity constant leaking
into a future calcium engine (Part II §65: "Do not import global alkalinity constants into
a calcium calculation").

### L1 — Facts

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `fact.validation` | `VALIDATION` | raw entry → `Reading` \| rejection | pure total |
| `fact.ledger` | `VALIDATION` | events → totally ordered immutable ledger | pure total |
| `fact.configuration` | `VALIDATION` | config history + `asOf` → `ConfigurationSnapshot` \| `NotRun` | pure total |

### L2 — Observation shaping

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `obs.cluster` | `SEGMENTATION` | readings + policy → `MeasurementCluster[]` | pure total |
| `obs.independence` | `SEGMENTATION` | clusters + policy → independent subset \| `NotRun` | pure total |
| `obs.position` | `VALIDATION` | latest valid cluster + config → `Position`, `outerBoundState` | pure total |

### L3 — Segmentation

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `seg.boundaries` | `SEGMENTATION` | ledger + inference type → boundary set | pure total |
| `seg.build` | `SEGMENTATION` | clusters + boundaries + `asOf` → `EvidenceSegment` | pure total |
| `seg.waterchange` | `SEGMENTATION` | water-change event + tank Alk → materiality class + step | pure total |
| `seg.normalize` | `SEGMENTATION` | segment + known inputs + `P_selected` → normalized series | pure total |
| `seg.delivery` | `SEGMENTATION` | interval + dose states + anomalies → `EffectiveDoseInterval` | pure total |

### L4 — Trajectory

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `traj.trend` | `TREND` | normalized independent clusters → `ObservedTrajectory` (slope, intercept, residuals) | pure total |
| `traj.uncertainty` | `UNCERTAINTY` | residuals + times + `sigma_base` → `sigma_resid`, `sigma_point`, `Sxx`, `sigma_S` | pure total |
| `traj.support` | `SUPPORT` | `S_observed` + `sigma_S` + `K` → `SupportedTrajectory` | pure total |
| `traj.evidence` | `TREND` | counts + span + confounders + slopes → `MovementEvidence`, `Trajectory` | pure total |
| `traj.rapid` | `TREND` | latest independent pair + events → `rapidConfirmed` | pure total |
| `traj.forecast` | `TREND` | `S_observed` + `A_now` + bounds → crossing times | pure total |

`traj.support` is a **three-line module** that exists as its own unit precisely because
`S_supported` must never be reachable from `traj.forecast` or `consumption.estimate`
(`INV-B2`). Physical separation makes the prohibition checkable by the dependency graph
rather than by review.

### L5 — Inference

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `infer.consumption` | `CONSUMPTION` | `P_selected`, `D`, `S_observed` → `ConsumptionEstimate` | pure total |
| `infer.potency.theoretical` | `POTENCY` | chemistry + volume → `P_theoretical` | pure total |
| `infer.potency.observation` | `POTENCY` | intervention + pre/post trends → `PotencyEvidence` | pure total |
| `infer.potency.pool` | `POTENCY` | eligible observations → `P_learned`, `RDisp_P` | pure total |
| `infer.potency.confidence` | `POTENCY` | pool + context → `PotencyConfidence`, `selectedPotency` | pure total |
| `infer.bracket` | `MAINTENANCE` | historical provenance + `C_estimate` → bracket status (advisory) | pure total |

`infer.potency.*` is the only writer of `selectedPotency`. Every consumer reads it
(`ALK-015`); no consumer recomputes it (`INV-F2`).

### L6 — Intervention and response

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `iv.lifecycle` | `RESPONSE` | dose events + `asOf` → `Intervention[]` with phases | pure total |
| `iv.snapshot` | `RESPONSE` | pre-state + dose change → `InterventionPredictionSnapshot` | pure total, write-once |
| `iv.exposure` | `RESPONSE` | schedule + interval → `exposureFraction` | pure total |
| `iv.gates` | `RESPONSE` | snapshot + pre/post sigmas → pre-evidence / attribution / detectability verdicts | pure total |
| `iv.classify` | `RESPONSE` | `R_obs`, `R_exp`, `B` → one of six classes | pure total |
| `iv.overshoot` | `RESPONSE` | latest value + range + intervention direction → `positionEvent` | pure total |

`iv.classify` takes only three numbers. It cannot see the position, the potency or the
recommendation, which is what makes `INV-E6` (overshoot orthogonality) structural.

### L7 — Decision

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `dec.safety` | `SAFETY` | position + outer bounds + consumption + potency → `SafetyState` | pure total |
| `dec.rails` | `SAFETY` | candidate movement components → rail-constrained components | pure total |
| `dec.maintenance` | `MAINTENANCE` | supported slope + potency + dose + constraints → `DoseRecommendation` | pure total |
| `dec.rounding` | `MAINTENANCE` | continuous candidate + current + increment + hard constraints → actuator command | pure total |
| `dec.returnplan` | `RETURN` | position + trajectory + opt-in + potency → `ReturnPlan` | pure total |
| `dec.retest` | `RETEST` | full engine state + `asOf` → `RetestDecision` | pure total |
| `dec.capability` | `CAPABILITY` | ledger + configuration → `CapabilityState[]` | pure total |

`dec.retest` is the **only** module that emits an instant into the future. `INV-I1` is
enforced by that fact plus the dependency law: nothing above L7 may compute a date.

### L8 — Assembly

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `out.assemble` | `OUTPUT` | every stage output → `EngineResult` | pure total |
| `out.audit` | `AUDIT` | every stage output → `AuditTrace` | pure total |
| `out.replay` | `AUDIT` | ledger + config + `asOf` → re-derived result for comparison | pure total |

### Presentation (outside the domain; read-only)

| Module | Owner | In → Out | Purity |
|---|---|---|---|
| `present.card` | `PRESENTATION` | `EngineResult` → card model | pure total |
| `present.wording` | `PRESENTATION` | card model + Part IX rules → strings | pure total |
| `present.notification` | `PRESENTATION` | `RetestDecision` → notification model | pure total |

Presentation is pure and testable, but it is **not** part of the domain and has no write
path into it. `present.notification` renders `recommendedAt`, `earliestUsefulAt`,
`latestSafeAt` and `reasonCode` and computes no chemistry or timing of its own.

---

## 3. Which modules must be pure deterministic functions

**All of L1 through L8, plus the shared kernel and the presentation modules.**

"Pure total" here means: same arguments ⇒ same result; no I/O; no clock; no randomness; no
mutable global state; no exceptions used for control flow (a refusal is a returned
`Computed.NotRun`/`Withheld`, not a thrown error); total over its declared input domain.

Only two things are impure, and both are outside the chemistry:

1. `alk.assess` — loads and persists through ports;
2. the adapters behind those ports.

This is what makes canon Part II §64 achievable: replay is simply calling the same pure
pipeline with the same arguments.

**Why `Computed<T>` rather than nullable returns.** `ALK-CAPABILITY-CONTRACT-001` requires
that no missing input is ever silently manufactured, and `INV-I4` requires every withheld
output to carry a reason. A three-state result type makes "returned nothing without saying
why" unrepresentable, rather than merely forbidden.

---

## 4. Rule owner → module map

The `owner` column of `ALK-V2-RULE-TRACEABILITY.md` maps one-to-one onto these modules,
so `INV-I2` (one authoritative owner per rule) is checkable mechanically.

| Owner | Modules |
|---|---|
| `VALIDATION` | `fact.validation`, `fact.ledger`, `fact.configuration`, `obs.position`, `kernel.time` |
| `SEGMENTATION` | `obs.cluster`, `obs.independence`, `seg.*` |
| `TREND` | `traj.trend`, `traj.evidence`, `traj.rapid`, `traj.forecast` |
| `UNCERTAINTY` | `traj.uncertainty` |
| `SUPPORT` | `traj.support` |
| `CONSUMPTION` | `infer.consumption` |
| `POTENCY` | `infer.potency.*` |
| `RESPONSE` | `iv.*` |
| `MAINTENANCE` | `dec.maintenance`, `dec.rounding`, `infer.bracket` |
| `RETURN` | `dec.returnplan` |
| `SAFETY` | `dec.safety`, `dec.rails` |
| `RETEST` | `dec.retest` |
| `CAPABILITY` | `dec.capability` |
| `OUTPUT` | `out.assemble`, `kernel.reasons` |
| `AUDIT` | `out.audit`, `out.replay` |
| `PRESENTATION` | `present.*` |

---

## 5. Prohibited edges

These are the specific dependencies that would violate a frozen rule. A dependency-graph
check should reject each by name.

| Forbidden edge | Rule it would break |
|---|---|
| `traj.forecast` → `traj.support` | `ALK-FORECAST-SLOPE-001`, `AUDIT-007` — risk must use `S_observed` |
| `infer.consumption` → `traj.support` | `ALK-CONSUMPTION-ESTIMATE-001` — mass balance must use `S_observed` |
| `dec.maintenance` → `infer.potency.observation` | `ALK-015` — the dosing engine reads one selected potency and never re-learns |
| `iv.classify` → `infer.potency.confidence` | `ALK-PREDICTION-SNAPSHOT-001` — the benchmark comes from the snapshot |
| `present.*` → any L4–L7 module | `CORE-SOURCE-001`, `X-INV-004` |
| any domain module → `alk.ports` or `ClockPort` | Part II §64 |
| `dec.retest` ← anything that also emits a date | `X-INV-004` — one scheduler |
| `obs.position` → `traj.trend` | `CORE-POSITION-001` — a fitted value never becomes position |
| `dec.maintenance` → `infer.bracket` as a **write** path | `ALK-072` item 11 — bracket is advisory only (read for reason codes is fine) |
| any Alk module → a Ca/Mg controller module | `MIGRATION-ALK-ONLY-001` (no Ca/Mg controller exists) |

---

## 6. Parameter policy injection

Canon Part II §65 and §66 require parameter policy to be **injected explicitly**, never
imported as a global. Every L2–L7 module takes an `AlkPolicy` argument carrying the frozen
constants from `ALK-V2-IMPLEMENTATION-CONTRACT.md` §2:

```text
AlkPolicy {
  measurement  { baseUncertaintyDkh, repeatClusterWindowMinutes, repeatSpreadLimitDkh,
                 minimumIndependentSpacingHours }
  trend        { maxLookbackDays, minimumClustersForMovement, minimumSpanDays,
                 slopeSupportK, rapidThresholdDkhPerDay, rapidMinElapsedHours }
  consumption  { — uses the trend segment; no independent lookback — }
  intervention { responseK, attributionHorizonDays,
                 postChangeFirstHours, postChangeSecondHours }
  potency      { minSideClusters, minSideSpanDays, snrDiagnostic, snrCalibration,
                 envelopeLow, envelopeHigh, calibratedN, calibratedSpanDays,
                 calibratedRDisp, strongN, strongSpanDays, strongRDisp, reassessDelta }
  waterChange  { materialityFloorDkh, unknownAssumedMismatchDkh, unknownBreakFraction,
                 normalizationConfidenceTier }   // MEASURED_SAME_BATCH  (F5-10)
  retest       { routineCadenceHours, rapidHours, safetyHours,
                 postChangeFirstHours, postChangeSecondHours,
                 signalRequiredMovementDkh,      // 0.10                 (F5-09)
                 boundarySafetyLeadDays,         // 1.0                  (F5-09)
                 observationFloorHours,          // 24                   (F5-09)
                 observationCeilingHours }       // 96                   (F5-09)
  safety       { outerMinDkh, outerMaxDkh, bSafetyDkh, maxSafetyMove24hDkh,
                 rateRailDkhPerDay, ordinaryStepCap, exceptionalStepCap,
                 stepCapMeaningfulMultiple, liquidGuardFraction }
  unavailable  { minimumExposure,               // OI-EXPOSURE-001, still absent
                 normalizationUncertaintyModel }// OI-NORMUNCERT-001, still absent
  notRun       { kDetect,                       // canonised NOT_RUN     (F5-09)
                 returnPlanArrivalCadence,      // canonised NOT_RUN     (F5-09)
                 suspicionThreshold,            // canonised NOT_RUN     (F5-02)
                 confidenceClassification }     // UNSPECIFIED           (F5-12)
}
```

Two blocks, and the distinction is load-bearing.

`unavailable` is a policy value the shared architecture references and the Alk canon still
never supplies. Representing them as explicitly absent — rather than omitting them — is
what lets `INV-I6` assert that the dependent output refused instead of defaulting.

`notRun` is a value `ALK_V2_FREEZE_5` **decided not to supply**. The engine emits the named
`NOT_RUN` state and its reason code. Reading a `notRun` field as though it were merely
missing, or supplying one from a neighbouring parameter, is a conformance failure — the
owner's decision is that the analysis does not run, not that it is pending.

The negative-consumption materiality boundary, the water-change normalization tier and the
four scheduler values above moved **out** of the absent set at Freeze 5. Each is derived
from a constant already in `policy`, so none of them is a new number.

---

## 7. Presentation contract

Presentation renders. It never decides.

**Input:** exactly one `EngineResult`. Nothing else. No ledger access, no configuration
access, no clock.

**Mapping.** V1's card catalogue is a *projection table*, not a state machine. A card is
selected by matching a predicate over `EngineResult` fields, in an order that is itself
data rather than nested branching, so that no card selection can shadow another the way
V1's first-match wizard did (`ALK-072` item 4, "V1 branch-order defects intentionally
removed").

**Mandatory card semantics** — these ship with the state, not with the copy:

| Domain state | Mandatory content |
|---|---|
| `NOT_ATTRIBUTABLE_SMALL_SIGNAL` | Full card shows: current Alk; current observed post-change slope; current supported post-change slope; current maintenance conclusion; a *secondary* explanation that the previous change was too small to isolate; next test timing. Headline is the operational conclusion, never the statistical limitation (`ALK-CARD-ATTRIBUTION-001`). |
| `UNCERTAINTY_LIMITED` | Full card shows **both** observed and supported slope (`WG-ALK-002`). |
| `INSUFFICIENT` | What is missing, when the next useful test is, and what can still be concluded now (`IX-005`). |
| `ALERT_LOW` / `ALERT_HIGH` | A distinct register from an ordinary out-of-target offer; shows current value, buffered safety destination, temporary safety action, separate maintenance conclusion, next test (`IX-006`). |
| any recommendation | Says what is **recommended**, never what has physically occurred (`IX-004`). |

**Wording prohibitions** carried as `PRESENTATION_*` reason codes:
no first person; no causal "working" claim before a formal favourable class; no "still
falling" where causal continuity was not established; no "safe"/"unsafe"; no unsupported
causal speculation; no shaming or lockout language for unresolved prior guidance; units
always present with chemical values and rates.

---

## 8. What this design does not commit to

- **Language.** No syntax appears above. `Computed<T>` is a shape, not a library.
- **Persistence.** The domain sees a ledger and a configuration history as arguments. Event
  sourcing, relational tables, a document store or a local-first log all satisfy it.
- **UI framework.** Presentation consumes a plain result object.
- **Sync, auth, payments, AI, cloud.** None appear in any domain signature. `DEC-009`'s
  requirement that AI sit strictly above the deterministic system is satisfied structurally:
  an AI layer would consume `EngineResult` exactly as presentation does, with the same
  absence of a write path.
- **Coordinator.** `DEC-005`'s future whole-tank coordinator consumes `EngineResult` and
  candidate actions. Nothing here forecloses it, and nothing here assumes it exists.
