# ALK V2 — DOMAIN DATA CONTRACT

**Authority:** canon under `SHARED_V2_FREEZE_2` / `ALK_V2_FREEZE_5`.
**Form:** implementation-neutral. No language, framework, ORM or database is assumed.

---

## 0. Notation and universal rules

### Field annotations

| Marker | Meaning |
|---|---|
| `REQ` | Always present. Absence is a schema violation, not a missing-data state. |
| `REQ*` | Required when the stated condition holds; the condition is given per field. |
| `OPT` | May be absent. Absence carries meaning and must be representable. |
| `UNK-OK` | An explicit `UNKNOWN` value is allowed and is **distinct from absent**. |
| `IMMUT` | Write-once. Never updated after creation. Corrections are new records. |
| `DERIVED` | Never stored on a fact; recomputed from facts + config + `asOf`. |

### Three states that must never collapse

Canon `CORE-ADVISORY-RESPONSIBILITY-001` §6.1 requires these to be distinguishable
everywhere in the schema:

```text
ABSENT      the datum was never captured
UNKNOWN     the datum exists but its value is not established
KNOWN(v)    the datum is established
```

A three-state field must be representable as three states. Collapsing `UNKNOWN` into a
default value, or `ABSENT` into `UNKNOWN(false)`, is a defect. In particular
`implementationState` must never turn `UNKNOWN` into `IMPLEMENTED` or `NOT_IMPLEMENTED`.

### Dimension safety

`ALK-VARIABLE-SEMANTICS-001` and `X-INV-009`. One dimension per field, encoded in the
field name suffix:

```text
...Dkh          dKH                 a chemical level
...DkhPerDay    dKH/day             a trajectory or consumption rate
...DkhPerMl     dKH/mL              a potency
...MlPerDay     mL/day              a dose rate
...Ml           mL                  a one-off volume
...L            L                   a system volume
...Days         days                an elapsed duration
...At           absolute instant    a point in time
...Fraction     dimensionless 0..1
...GPerL        g/L                 a stock concentration
```

A field named `target`, `amount`, `value`, `dose` or `slope` without a dimension suffix
and a documented meaning is forbidden.

### Precision

All stored numerics are full precision. Display rounding never enters calculation
(Part II §2.3, `ALK-002`). Any rounded quantity is a separate `DERIVED` field whose name
says so (`recommendedDoseMlPerDay` is the rounded recommendation;
`continuousActionCandidateMlPerDay` is its unrounded input).

---

## 1. Time

### `Instant`

```text
Instant {
  absoluteInstant      REQ    offset-aware timestamp or UTC instant, second precision or finer
  displayTimeZoneId    OPT    IANA zone id, presentation only, never used in arithmetic
  timeProvenance       REQ    TimeProvenance
}
```

`SHARED-LEGACY-TIME-001`, `M-13`, Part II §2.1-2.3A.

### `TimeProvenance` — closed vocabulary

| Value | Meaning | Trend eligibility | Position eligibility |
|---|---|---|---|
| `EXACT_ABSOLUTE` | Captured with a proven absolute instant. Required for all new V2 events. | yes | yes |
| `RECONSTRUCTED_WITH_PROVENANCE` | Historical offset independently proven and the reconstruction recorded. | yes | yes |
| `LOCAL_TIME_ZONE_UNKNOWN` | Local `HH:MM` with no proven offset. | **no** — exact elapsed time not derivable across offset/DST ambiguity | yes, if latest valid |
| `DATE_ONLY` | Date known, time within the day unknown. | **no** | yes, if latest valid |

Forbidden, absolutely (`SHARED-LEGACY-TIME-001`, `DATA-PROVENANCE.md` §2): assigning
noon; assigning midnight; assigning the keeper's current timezone to an old local
timestamp; treating a local `HH:MM` as an absolute instant; inferring a time from testing
routine, file order or entry order.

A `DATE_ONLY` record **stays** `DATE_ONLY` through every layer, including export and
migration. There is no transformation that upgrades time provenance except an importer
that independently proves the historical offset and records the proof.

### Elapsed time

```text
elapsedDays(a, b) = (b.absoluteInstant - a.absoluteInstant) / 86400 seconds
```

Defined only when both operands are `EXACT_ABSOLUTE` or `RECONSTRUCTED_WITH_PROVENANCE`.
Otherwise the requesting analysis emits `NOT_RUN` with `TIME_EXACT_ELAPSED_UNAVAILABLE`.

### Event ordering

Total order for deterministic replay (Part II §2.4):

```text
1. absoluteInstant ascending
2. at equal instants, explicit prePostEventRelation:
     PRE_EVENT measurement  <  intervention/delivery  <  POST_EVENT measurement
3. otherwise eventOrdinal (monotonic insertion sequence), and set
   orderingAmbiguous = true
```

`orderingAmbiguous = true` at an intervention boundary forbids using the measurement as
the time-zero anchor (`AUDIT-028`) and degrades response confidence.

---

## 2. Measurement

### `Reading`

One raw test result. Never a cluster, never a derived value.

| Field | Unit | Req | Notes |
|---|---|---|---|
| `readingId` | — | `REQ` `IMMUT` | Stable identity. |
| `parameter` | — | `REQ` | `ALK` \| `CA` \| `MG`. Ca/Mg are inert facts in this runtime. |
| `measuredAt` | `Instant` | `REQ` | Biological sampling time. Drives all trend arithmetic (`M-8`). |
| `recordedAt` | `Instant` | `REQ` | When the app captured it. **Never** substituted for `measuredAt`. |
| `rawValueDkh` | dKH | `REQ` `IMMUT` | The value as entered. Never overwritten by a rounded, median, fitted or normalized value (Part II §3.1). |
| `canonicalUnit` | — | `REQ` | `dKH` for Alk. Entry in meq/L converts at `1 meq/L = 2.8 dKH` and stores both the original entry and the canonical value. |
| `enteredValue` / `enteredUnit` | — | `OPT` | Preserved exactly as typed, for audit. |
| `userEnteredPrecision` | — | `OPT` | Metadata only. **Never** automatically becomes uncertainty (Part II §3 comment). |
| `baseUncertaintyDkh` | dKH | `REQ` | `SIGMA_ALK_BASE = 0.10` for Alk (`ALK-004`). Working analytical floor, not a kit accuracy claim, not a position tolerance. |
| `source` | — | `REQ` | `MANUAL` \| `IMPORTED` \| `DEVICE`. |
| `repeatGroupId` | — | `OPT` | Explicit repeat/confirmation relationship. **Inoperative for alkalinity under owner decision 28**: proximity in time is the whole membership test, so an explicit relationship neither creates an episode nor overrides the 30-minute window (`ALK-TESTING-EPISODE-001`). The field is retained because Part II §5.2 is shared canon and is not edited here; that wording is recorded open as `OI-PII52EXPLICIT-001`. Nothing in the Alk engine may read it. |
| `prePostEventRelation` | — | `OPT` | `PRE_EVENT` \| `POST_EVENT`, relative to a named event. Absent means unknown, not "after". |
| `status` | — | `REQ` | `ReadingQuality`. |
| `invalidReason` | — | `REQ*` | Required when `status = INVALID`. |
| `notes` | — | `OPT` | |
| `createdAt` / `editedAt` | `Instant` | `REQ` / `OPT` | Edit audit. |
| `supersededByReadingId` | — | `OPT` | Only for `SUPERSEDED`. |

**Validation at ingestion** (Part II §3.3):

```text
finite numeric value
supported unit
physically representable range        (a value outside the target or outer range is
                                       NOT a validation failure — unusual biology is data)
valid timestamp
parameter identity matches the entry context
```

A value outside `OUTER_MIN..OUTER_MAX` is valid data and must be storable. Rejecting it
would destroy exactly the readings the safety layer exists for.

### `ReadingQuality` — closed vocabulary

| Value | Meaning | In history | In analysis |
|---|---|---|---|
| `VALID` | Usable unless an inference-specific rule excludes it. | yes | yes |
| `SUSPECT` | Plausible but inconsistent enough that confirmation is advisable. Does **not** auto-become `INVALID`. May block ordinary dose action until resolved. | yes | conditionally |
| `INVALID` | Known not to represent a usable measurement. Retained, excluded from analysis. | yes | no |
| `SUPERSEDED` | Explicitly replaced while retained for audit. A repeat that merely differs does **not** supersede — use a cluster. | yes | no |

`SUSPECT` is never derived from an automatic statistical test for alkalinity: that
detection is canonically `NOT_RUN` (`ALK-SUSPECT-DETECTION-001`, F5-02). It is set from
explicit user marking, a known device/test fault event, or an internally inconsistent
cluster.

### `MeasurementCluster` `DERIVED`

The pooled set of measurements **inside** one testing episode — not the episode itself, which
is the `TestingEpisode` record below. Prevents repeat testing from satisfying evidence counts
(Part II §5, §6; `ALK-005`).

| Field | Unit | Notes |
|---|---|---|
| `clusterId` | — | Deterministic from member reading ids. |
| `readingIds[]` | — | Members, in event order. |
| `representativeValueDkh` | dKH | `median(raw valid member values)` (Part II §5.4). |
| `representativeAt` | `Instant` | `median(member measuredAt)` (Part II §5.5). |
| `spreadDkh` | dKH | `max − min` over members. |
| `madDkh` | dKH | `median(|x_i − median(x)|)`. |
| `sigmaClusterDkh` | dKH | `max(SIGMA_ALK_BASE, 1.4826 · madDkh)`. **Never** divided by `√n` (Part II §5.6). |
| `clusterStatus` | — | `OK` \| `ANOMALOUS`. `ANOMALOUS` when `spreadDkh > 0.20` (`ALK-005`), compared as **exact decimals** (`ALK-DECIMAL-THRESHOLD-001`): an exact spread of `0.20` is `OK`. Applies to every repeat member, with **no method qualifier** (`ALK-REPEAT-SPREAD-DOMAIN-001`, owner decision 27). |
| `independent` | — | `true` when accepted by forward-greedy selection (`ALK-INDEPENDENT-SELECTION-001`). `false` does **not** mean excluded: the cluster still serves position, anomaly confirmation, `ALK-RAPID-BASIS-001` and time-resolved intervention calculation. |
| `coalescedFromClusterIds[]` | — | Set when this cluster was built by pooling measurements inside one testing episode (`ALK-TESTING-EPISODE-001`). The source clusters are retained for audit; the resolved episode value is what selection sees. |
| `episodeId` | — | The `TestingEpisode` this cluster belongs to (`ALK-TESTING-EPISODE-001`). A cluster is the pooled set **inside** an episode; it is not the episode. |

### `TestingEpisode`

One owner constructs the episode and every Alk consumer reads its output
(`ALK-EPISODE-SINGLE-OUTPUT-001`). It is a **distinct record**, not a field on
`MeasurementCluster`: the episode owns the count of what was combined and the cluster does
not.

| Field | Unit | Meaning |
|---|---|---|
| `episodeId` | — | Identity. Content-derived like every other id (`OI-DETERMINISM-001`). |
| `memberMeasurementIds[]` | — | Every measurement in the episode, `INVALID` members included and marked. Nothing is deleted, hidden or down-weighted. |
| `episodeStatus` | — | `RESOLVED` (`ALK-EPISODE-RESOLUTION-001`). The only value: every episode holding at least one valid measurement resolves. |
| `combinedMeasurementCount` | count | How many measurements were combined into this observation (`ALK-TESTING-EPISODE-001`, owner decision 28). `1` for a lone measurement. A **structured field** the interface renders plainly — "3 tests combined" — never engine-authored prose. |
| `episodeValueDkh` | dKH | The one canonical value every Alk consumer reads. |
| `episodeAt` | — | The one canonical episode time, under Part II §5.5. |
| `clusterIds[]` | — | The pooled set inside the episode. Exactly one. |
| `episodeSpreadDkh` | dKH | Spread of the pooled readings, under Part II §5.6. |
| `episodeClusterStatus` | — | `OK` \| `ANOMALOUS`, under `ALK-005`, over the pooled readings with **no method qualifier**. An anomalous episode is an ordinary anomalous cluster and takes Part II §48's path. |

**Superseded by owner decisions 27 and 28**, preserved here rather than deleted: this record
formerly carried `episodeMethods[]` — *"the distinct methods present after `INVALID`
exclusion. More than one, with no canon compatibility classification, is what makes an
episode contested"* — and `episodeStatus` took the value `CONTESTED_METHODS`, on which
`episodeValueDkh` and `episodeAt` were `NOT_RUN`. `Reading.methodId` is removed with them:
the application does not record, ask for, infer or store what produced a measurement.

`obs.episode` (`ALK-V2-MODULE-DESIGN.md`) is the single producer. `obs.cluster` builds the
pooled set **inside** an episode and has no independent grouping authority; the two are one
inference with one owner (`MASTER RULE 1`).

Automatic grouping requires: same parameter; member `measuredAt` within
`REPEAT_CLUSTER_WINDOW = 30 min`; no relevant intervention between them. Part II §5.3 also
lists "same or compatible method"; that condition is **inoperative for alkalinity** under
owner decision 27, and the shared wording is recorded as an open item rather than edited
here. The window is an internal data-model constant, **not** a Setup question and not a
chemistry threshold.

---

## 3. Dosing and delivery

### `MaintenanceDoseState`

The programmed maintenance rate in force from an instant. Every actual change creates a
new record; history is never overwritten (Part I §9.2).

| Field | Unit | Req | Notes |
|---|---|---|---|
| `doseStateId` | — | `REQ` `IMMUT` | |
| `parameter` | — | `REQ` | |
| `programmedDoseMlPerDay` | mL/day | `REQ` `UNK-OK` | The programmed rate. `UNKNOWN` is representable and is **not** zero. |
| `effectiveAt` | `Instant` | `REQ` | When the rate actually began. |
| `effectiveAtConfidence` | — | `REQ` | `EXACT` \| `UNCERTAIN`. `UNCERTAIN` confounds every straddling interval (`M-5`). |
| `effectiveAtEarliest` / `Latest` | `Instant` | `REQ*` | Required when `effectiveAtConfidence = UNCERTAIN`. Bounds the unknown boundary; a clean segment resumes only after `effectiveAtLatest`. |
| `recordedAt` | `Instant` | `REQ` | **Never** equated with `effectiveAt` for a late external entry (`M-5`). |
| `source` | — | `REQ` | `IN_APP` \| `EXTERNAL_USER_LOG` \| `IMPORTED_TELEMETRY`. |
| `origin` | — | `REQ` | `MANUAL` \| `RECOMMENDATION_ACCEPTED`. With `RECOMMENDATION_ACCEPTED`, also store `recommendedDoseMlPerDay` — the recommended and actual values are separate fields (Part II §38). "Accepted" means the **keeper** acted on the recommendation and told the app so; the app changes nothing itself (`ALK-RECOMMEND-ONLY-001`). |
| `solutionContextId` | — | `REQ` `UNK-OK` | `M-2`. |
| `deliveryContextId` | — | `REQ` `UNK-OK` | `M-3`. |
| `deliverySchedule` | — | `OPT` | e.g. hourly, N doses/day. Needed for exposure and mixed-interval integration (`ALK-035`). |
| `recommendationPrecisionMlPerDay` | mL/day | `OPT` | `M-1`. A **display convention**, not a device capability (`ALK-RECOMMEND-ONLY-001`, owner decision 23). Configured and > 0 ⇒ round to it. Configured and ≤ 0 ⇒ `REFUSE`, `VALIDATION_RECOMMENDATION_PRECISION_INVALID`. **Absent ⇒ state the full-precision recommendation; nothing is withheld and nothing is `NOT_RUN`.** **No hidden 0.1 default** in any state. |

### `EffectiveDoseInterval` `DERIVED`

The delivery basis attributable to a time interval. Distinguishes *what was commanded*
from *what is analytically usable* (`SHARED-DELIVERY-BASIS-001`, `M-6`).

| Field | Unit | Notes |
|---|---|---|
| `fromAt` / `toAt` | `Instant` | Interval bounds. |
| `deliveryBasis` | — | `VERIFIED_DELIVERY` \| `CONFIRMED_PROGRAMMED_SCHEDULE` \| `COMMAND_ONLY_UNCONFIRMED`. |
| `integratedVolumeMl` | mL | Only for the first two bases. |
| `effectiveDoseMlPerDay` | mL/day | `integratedVolumeMl / elapsedDays`. |
| `mixedInterval` | — | `true` when a dose change falls inside. |
| `integrationStatus` | — | `RUN` \| `NOT_RUN`. `NOT_RUN` when the interval is mixed and no eligible basis exists ⇒ segment at the dose boundary instead (`ALK-CONSUMPTION-ESTIMATE-001`). |

`COMMAND_ONLY_UNCONFIRMED` is never silently promoted. A configured 10 mL/day rate does
not mean 10 mL was delivered the instant the setting changed. Physical pump telemetry is
**optional**: a `CONFIRMED_PROGRAMMED_SCHEDULE` is a first-class analytical basis and is
sufficient for a clean constant-dose regime (`WG-ALK-047`).

### `ManualCorrection`

A one-off deliberate addition (`ALK-034`, `ALK-059`, `ALK-060`, Part I §9.3).

| Field | Unit | Req | Notes |
|---|---|---|---|
| `correctionId` | — | `REQ` `IMMUT` | |
| `deliveredAt` | `Instant` | `REQ` `UNK-OK` | `UNKNOWN` ⇒ interval `CONFOUNDED`, no invented effect (`WG-ALK-023`). |
| `intendedVolumeMl` | mL | `OPT` | |
| `actualVolumeMl` | mL | `REQ` `UNK-OK` | Actual delivered. Separate from intended. |
| `expectedContributionDkh` | dKH | `DERIVED` | `actualVolumeMl · P_selected`. Only when both are known. |
| `solutionContextId` | — | `REQ` `UNK-OK` | |
| `stagedSchedule[]` | — | `OPT` | `{atInstant, volumeMl}` per actual delivery. The V1 three-day linear profile is **removed** (`ALK-034`). |
| `correctionKind` | — | `REQ` | `USER_ONE_OFF` \| `RETURN_PLAN_EXECUTION` \| `SAFETY_RETURN_CORRECTION`. |

### `DeliveryAnomaly`

Equipment and delivery events that break or confound analysis (Part I §9.6, Part II §13).

| Field | Notes |
|---|---|
| `anomalyId` `IMMUT` | |
| `anomalyType` | `MISSED_DOSE` \| `EXTRA_DOSE` \| `PUMP_INTERRUPTION` \| `PUMP_FAILURE` \| `CALIBRATION` \| `REPLACEMENT` \| `CHANNEL_CHANGE` |
| `fromAt` / `toAt` `UNK-OK` | Bounded window; `UNKNOWN` bounds confound generously, never narrowly. |
| `quantifiedEffect` `OPT` | Only when actually known. Never estimated. |
| `createsPotencyContextBoundary` | `true` for `CALIBRATION`, `REPLACEMENT`, `CHANNEL_CHANGE` (`ALK-068`). |

### `WaterChange`

| Field | Unit | Req | Notes |
|---|---|---|---|
| `waterChangeId` | — | `REQ` `IMMUT` | |
| `occurredAt` | `Instant` | `REQ` | |
| `changedFraction` | 0..1 | `REQ` | `f` in `ΔA_WC = f (A_replacement − A_tank)`. |
| `volumeL` | L | `OPT` | |
| `replacementAlkalinityDkh` | dKH | `OPT` | Absent ⇒ unknown branch (`M-4`). |
| `replacementAlkalinityConfidence` | — | `REQ*` | Required when the value is present: `MEASURED_SAME_BATCH` \| `USER_CONFIGURED_SALT_PROFILE` \| `MANUFACTURER_NOMINAL`. **Only `MEASURED_SAME_BATCH` permits normalization** (`ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001`); every other value takes the unknown branch. |
| `materialityClass` | — | `DERIVED` | `NEGLIGIBLE` \| `MATERIAL_KNOWN` \| `MATERIAL_UNKNOWN` \| `NOT_APPLICABLE`. |
| `expectedStepDkh` | dKH | `DERIVED` | `f (A_replacement − A_tank)`, only in the known branch. |

### `ConsumptionContextEvent`

`SHARED-CONSUMPTION-CONTEXT-001`. A **recorded** confounder, never an inference.

```text
ConsumptionContextEvent {
  eventId              REQ IMMUT
  effectiveAt          REQ Instant
  affectedParameters[] REQ
  materiality          REQ   MATERIAL
  source               REQ   USER_CONFIRMED | SYSTEM_CONFIRMED
  reasonCode           REQ   CALCIFYING_BIOMASS_CHANGE | LIGHTING_REGIME_CHANGE
                             | FLOW_REGIME_CHANGE | TEMPERATURE_REGIME_CHANGE
                             | MAJOR_TISSUE_LOSS_OR_RECOVERY
                             | OTHER_CONFIRMED_CONSUMPTION_CONTEXT_CHANGE
  note                 OPT
}
```

The engine **must not** create this from an unexpected slope. Absence does not prove
demand was constant.

---

## 4. Configuration and potency

### `ConfigurationSnapshot`

`SHARED-CONFIG-VERSION-001`, `M-12`. Effective-dated; never backfilled.

| Field | Unit | Req | Notes |
|---|---|---|---|
| `configVersionId` | — | `REQ` `IMMUT` | |
| `recordedAt` | `Instant` | `REQ` | |
| `effectiveFrom` | `Instant` | `REQ` | Migration seeds the first V2 version effective **at migration**, never retroactively. |
| `changedFields[]` | — | `REQ` | |
| `source` | — | `REQ` | `USER` \| `MIGRATION` \| `SYSTEM`. |
| `netVolumeL` | L | `REQ` `UNK-OK` | |
| `targetRangeMinDkh` / `MaxDkh` | dKH | `REQ` | Validation: `min < max`; both within `[outerMin, outerMax]` (`ALK-003`). |
| `outerMinDkh` / `outerMaxDkh` | dKH | `REQ` | Defaults 7.0 / 11.0 (`ALK-OUTER-BOUNDS-001`). |
| `recommendationPrecisionMlPerDay` | mL/day | `REQ` `UNK-OK` | |
| `enabledParameters[]` | — | `REQ` | Alk-only runtime: Alk controller active; Ca/Mg measurement-only. |

There is **no** stored ideal-alkalinity point. `aimPointLevelDkh` is always
`DERIVED = (min + max)/2` (`ALK-003`, Part I §36.1).

A derived assessment resolves the configuration version effective at its `assessmentAsOf`.
A replay requiring configuration older than the first proven version emits
`NOT_RUN / HISTORICAL_CONFIGURATION_UNAVAILABLE` (`WG-ALK-065`).

### `ProductPotency`

| Field | Unit | Req | Notes |
|---|---|---|---|
| `solutionContextId` | — | `REQ` | Opens on any potency-defining change: product, recipe/concentration, batch, net volume (`M-2`, `ALK-067`). |
| `deliveryContextId` | — | `REQ` | Opens on any delivery-defining change: device/channel, calibration, tubing, method (`M-3`, `ALK-068`). |
| `chemical` | — | `REQ*` | `NA2CO3` \| `NAHCO3` \| `NAOH` \| `COMMERCIAL`. |
| `stockConcentrationGPerL` | g/L | `REQ*` | For the three chemicals. |
| `manufacturerPotencyDkhPerMl` | dKH/mL | `REQ*` | For `COMMERCIAL`, normalized to configured net volume. |
| `theoreticalPotencyDkhPerMl` | dKH/mL | `DERIVED` | `ALK-014`: `0.05284·C/V`, `0.03333·C/V`, `0.07000·C/V`. |
| `learnedPotencyDkhPerMl` | dKH/mL | `DERIVED` `UNK-OK` | Pool median (`ALK-POTENCY-POOL-001`). |
| `potencyConfidence` | — | `DERIVED` | `PotencyConfidence`. |
| `selectedPotencyDkhPerMl` | dKH/mL | `DERIVED` `UNK-OK` | The **single** value the dosing engine consumes (`ALK-015`). |
| `selectedPotencySource` | — | `DERIVED` | `THEORETICAL_OR_CONFIGURED` \| `LEARNED`. |

The dosing engine consumes `selectedPotencyDkhPerMl` and **never** maintains a second
private potency estimate (`ALK-015`, Part I §57 item 7).

`PotencyConfidence` closed vocabulary: `THEORETICAL_ONLY` \| `EXPLORATORY` \|
`PROVISIONAL` \| `CALIBRATED` \| `STRONGLY_CALIBRATED` \| `REASSESSING` \|
`INVALID_CONTEXT` \| `UNRESOLVED` (the last only under `OI-POTENCYSTATE-001`).

### `PotencyEvidence`

One potency observation (`ALK-016`, `ALK-017`, `ALK-018`).

| Field | Unit | Notes |
|---|---|---|
| `observationId` `IMMUT` | — | |
| `sourceInterventionId` | — | The dose change that produced it. |
| `solutionContextId` / `deliveryContextId` | — | Both must match the pool's context exactly. |
| `preSlopeDkhPerDay` / `postSlopeDkhPerDay` | dKH/day | Clean pre / post trends. |
| `sigmaPreDkhPerDay` / `sigmaPostDkhPerDay` | dKH/day | |
| `prePostDoseMlPerDay` | mL/day | Actual **programmed** states (`M-9`). |
| `deltaDoseMlPerDay` | mL/day | `D_post − D_pre`. |
| `deltaSlopeDkhPerDay` | dKH/day | `S_post − S_pre`. |
| `sigmaDeltaSlopeDkhPerDay` | dKH/day | `√(σ_pre² + σ_post²)`. |
| `snrPotency` | — | `|ΔS| / σ_ΔS`. |
| `signalClass` | — | `INELIGIBLE_SIGNAL` (<2.0) \| `DIAGNOSTIC_ONLY` (2.0–3.0) \| `CALIBRATION_ELIGIBLE` (≥3.0). |
| `observedPotencyDkhPerMl` | dKH/mL | `ΔS / ΔD`. |
| `theoreticalPotencyAtObservation` | dKH/mL | For the plausibility envelope. |
| `plausibilityStatus` | — | `IN_ENVELOPE` \| `PLAUSIBILITY_HOLD` \| `REJECTED_NON_POSITIVE`. |
| `eligibility` | — | `ELIGIBLE` \| `INELIGIBLE` + `ineligibilityReasons[]`. |
| `confounders[]` | — | Including `SAFETY_RETURN_CONFOUND`, `CONSUMPTION_CONTEXT_CHANGE`, `CORRECTION_IN_WINDOW`. |

Observations are retained forever, including ineligible and `PLAUSIBILITY_HOLD` ones, and
remain attached to their original context across context boundaries (`ALK-025`,
`WG-ALK-036`, `WG-ALK-037`).

---

## 5. Segments and trajectory

### `EvidenceSegment` `DERIVED`

Part II §12-16, `ALK-007`.

| Field | Unit | Notes |
|---|---|---|
| `segmentId` | — | Deterministic from bounds + parameter + inference type. |
| `inferenceType` | — | `TRAJECTORY` \| `CONSUMPTION` \| `INTERVENTION_RESPONSE` \| `POTENCY_LEARNING`. Eligibility is **per inference** (Part II §1.2). |
| `startAt` / `endAt` | `Instant` | |
| `spanDays` | days | Exact elapsed. |
| `doseContext` | — | The `doseStateId`(s) in force. |
| `potencyContext` | — | `solutionContextId` + `deliveryContextId`. |
| `clusterIds[]` | — | Candidate clusters. |
| `independentClusterIds[]` | — | Selected independent subset. |
| `excludedClusterIds[]` + `exclusionReasons[]` | — | Every exclusion is named. |
| `knownNormalizedEvents[]` | — | `{eventId, appliedStepDkh}` — fully auditable. |
| `hardConfounders[]` / `softConfounders[]` | — | |
| `eligibility` | — | Per-inference `ELIGIBLE` \| `INELIGIBLE` + reasons. |
| `lookbackCapDays` | days | 14 for Alk current control. **Never** extended because data is sparse. |

Boundary sources (Part II §13, `ALK-007`): maintenance dose change; product change;
solution batch/concentration change; pump/channel change; material calibration change;
pump failure/outage; unknown missed/extra dose; net-volume change; major unmodelled
correction; unknown water change with `f ≥ 0.05`; confirmed measurement-regime
discontinuity; uncertain dose-change effective time (straddling window).

Not every boundary breaks every inference. A known, normalized correction may remain in a
trend segment yet still disqualify potency learning (`AUDIT-018`, `WG-ALK-022`).

### `ObservedTrajectory` `DERIVED` — Layer 2

| Field | Unit | Notes |
|---|---|---|
| `estimator` | — | `THEIL_SEN` (n ≥ 3) \| `TWO_POINT` (n = 2, rapid/provisional only). |
| `observedSlopeDkhPerDay` | dKH/day | `S_observed`. The robust central estimate. |
| `interceptDkh` | dKH | `median(A_i − S t_i)`, local time origin at the first included cluster. |
| `residualsDkh[]` | dKH | `A_i − (S t_i + b)`. |
| `sigmaResidDkh` | dKH | `1.4826 · MAD(r)`. |
| `sigmaPointDkh` | dKH | `max(0.10, sigmaResidDkh)`. |
| `tBarDays` | days | |
| `sxxDay2` | day² | `Σ (t_i − t̄)²`. |
| `sigmaSDkhPerDay` | dKH/day | `sigmaPointDkh / √sxx`, or `√(σ₁²+σ₂²)/Δt` for two-point. |
| `independentClusters` | count | |
| `spanDays` | days | |
| `pairwiseSlopes[]` | dKH/day | Audit. |
| `pairwiseSlopeMadDkhPerDay` | dKH/day | **Diagnostic only.** Must not enter `sigma_S` (Part II §19.5). |
| `directionConsistency` | 0..1 | Diagnostic metadata, not a threshold. |
| `endpointMovementDkh` / `fittedMovementDkh` | dKH | |
| `evidenceState` | — | `MovementEvidence`. |
| `rapidConfirmed` | — | `ALK-RAPID-001` satisfied. |
| `warnings[]` / `exclusions[]` | — | |

### `SupportedTrajectory` `DERIVED` — Layer 3

| Field | Unit | Notes |
|---|---|---|
| `supportedSlopeDkhPerDay` | dKH/day | `sign(S) · max(0, |S| − 1.28 σ_S)`. |
| `supportK` | — | `1.28`, recorded so replay can prove which constant ran. |
| `supportSubtractionDkhPerDay` | dKH/day | `1.28 · σ_S`. |
| `limitedByUncertainty` | — | `true` when `S_supported = 0` and `S_observed ≠ 0`. |

**Hard rule.** `supportedSlopeDkhPerDay` is consumed by the maintenance recommendation sizing
and by nothing else. It may not appear in a consumption estimate
(`ALK-CONSUMPTION-ESTIMATE-001`), in a boundary forecast (`ALK-FORECAST-SLOPE-001`), in
a position statement, or in a response-classification benchmark.

### `MovementEvidence` — closed vocabulary

`INSUFFICIENT` \| `PROVISIONAL` \| `SUFFICIENT` \| `HIGH_CONFIDENCE` \| `CONFOUNDED` \|
`ANOMALOUS` \| `UNCERTAINTY_LIMITED`

The last is the Alk specialisation (`OI-EVIDENCEVOCAB-001`).

### `Trajectory` — closed vocabulary

`RISING` \| `FALLING` \| `STABLE` \| `UNCERTAIN`

`STABLE` requires ordinary sufficiency **and** `S_supported = 0` **and**
`S_observed = 0` exactly (`ALK-STABLE-001`; see `OI-STABLE-001`). Insufficient evidence
is `UNCERTAIN`, never `STABLE`.

### `Position` — closed vocabulary

`BELOW_RANGE` \| `IN_RANGE` \| `ABOVE_RANGE` \| `ALERT_LOW` \| `ALERT_HIGH` \| `UNKNOWN`

Derived from the **latest valid cluster representative value** only. A fitted, smoothed
or forecast value may never replace it (`CORE-POSITION-001`, `ALK-010`). Uncertainty does
not widen the range: 8.19 against a lower edge of 8.20 is below range (`ALK-004`).

---

## 6. Consumption and maintenance

### `ConsumptionEstimate` `DERIVED` — Layer 2

| Field | Unit | Notes |
|---|---|---|
| `consumptionDkhPerDay` | dKH/day | `C = P_selected · D_history − S_observed`. **Observed** slope, never supported (`ALK-CONSUMPTION-ESTIMATE-001`). `D_history`, never `D_current` (`ALK-DELIVERY-RATE-BASIS-001`, owner decision 20). |
| `doseHistoryMeanMlPerDay` | mL/day | `D_history` — the **time-weighted mean delivery rate actually delivered across the analysed interval**: `D_eff` for an integrable mixed interval, and the constant rate for a constant-dose segment, where it equals `D_current` numerically without being the same quantity. **Renamed from `doseBasisMlPerDay` by owner decision 20**, whose old name did not say which of the two delivery rates it carried. `NOT_RUN` where the interval is not integrable ⇒ consumption `UNRESOLVED`. |
| `deliveryBasis` | — | From `EffectiveDoseInterval`. |
| `selectedPotencyDkhPerMl` | dKH/mL | The `P` actually used. |
| `sourceSegmentId` | — | |
| `physicality` | — | `INTERPRETABLE` \| `UNCERTAIN_NON_RESOLVABLE` \| `NON_PHYSICAL_OR_UNEXPLAINED_GAIN`. |
| `materialityMarginDkhPerDay` | dKH/day | `DERIVED`. `ALK_SLOPE_SUPPORT_K · sigma_S`; the boundary is `C_estimate + margin < 0`. |
| `eligibility` | — | `RUN` \| `NOT_RUN` + reason. |
| `warnings[]` | — | |

`physicality` is fully determined by `ALK-NEGATIVE-MATERIALITY-001`:

```text
C_estimate >= 0                                    -> INTERPRETABLE
C_estimate <  0 and C_estimate + 1.28*sigma_S <  0 -> NON_PHYSICAL_OR_UNEXPLAINED_GAIN
C_estimate <  0 and C_estimate + 1.28*sigma_S >= 0 -> UNCERTAIN_NON_RESOLVABLE
```

`UNRESOLVED` and `UNCERTAIN_NEAR_ZERO` were the pre-Freeze-5 values and are **retired**;
`UNCERTAIN_NON_RESOLVABLE` is `ALK-031`'s own wording for the non-material branch. Both
negative branches HOLD maintenance and both are uninterpretable for the high-breach
fail-safe. A negative arithmetic result is **never** clamped to zero and then treated as a
real zero-consumption target (`ALK-031`).

### `DoseRecommendation` `DERIVED` — Layer 4

Seven distinct quantities that `ALK-VARIABLE-SEMANTICS-001` forbids collapsing:

| Field | Unit | Question it answers |
|---|---|---|
| `currentDoseMlPerDay` | mL/day | What is running now. |
| `maintenanceEstimateMlPerDay` | mL/day | `C/P` — the dose that would give zero slope if the observed estimate were exact. Audit/explanation. |
| `continuousActionCandidateMlPerDay` | mL/day | `D_current − S_supported/P`, before physical limits and rounding. |
| `recommendedDoseMlPerDay` | mL/day | The final feasible, rounded recommendation for a human being — never a command, because there is no execution path to the tank (`ALK-RECOMMEND-ONLY-001`, owner decision 23). `WITHHELD` where no feasible recommendation exists — a first-class value, never `null` and never omitted. Also `WITHHELD`, never `NOT_RUN` and never `0`, where `D_current` is unknown (owner decision 20). **It is NOT withheld at an advisory boundary**: under owner decision 24 the ordinary rules produce the ordinary figure at and beyond `AdvisoryCeiling` / `AdvisoryFloor`, and the boundary only attaches `advisoryConfidenceWarning`. |
| `deltaDoseMlPerDay` | mL/day | `recommended − current`. |
| `deltaEffectDkhPerDay` | dKH/day | `P · deltaDose` — the physical effect of the final command. |
| `predictedPostSlopeDkhPerDay` | dKH/day | `S_observed + P · deltaDose`. **Normally non-zero.** |

Plus:

| Field | Notes |
|---|---|
| `action` | `RecommendationAction`. |
| `constraintsApplied[]` | Ordered: `RATE_RAIL`, `STEP_CAP_25`, `STEP_CAP_50`, `BASELINE_ESTABLISHMENT`, `NON_NEGATIVE_CLAMP`, `ACTUATOR_ROUNDING`, `LIQUID_VOLUME_GUARD`. |
| `doseStepRegime` | `ORDINARY` \| `BASELINE_ESTABLISHMENT`. |
| `capApplied` | `NONE` \| `ORDINARY_25` \| `EXCEPTIONAL_50`. |
| `bracketStatus` | `NOT_RUN` \| `CONSISTENT` \| `CONFLICT` — advisory only (`OI-BRACKETEFFECT-001`). |
| `maintenanceActionStatus` | `ISSUED` \| `HELD` \| `DEFERRED_BY_SAFETY_RETURN` \| `WITHHELD_CAPABILITY` \| `WITHHELD_LIQUID_GUARD`. `WITHHELD_LIQUID_GUARD` is distinct from `HELD`: `ALK-LIQUID-VOLUME-GUARD-001` withholds a recommendation rather than affirming the current dose. |
| `reasonCodes[]` | |

`RecommendationAction` closed vocabulary: `NO_CHANGE` \| `HOLD_CURRENT_DOSE` \|
`SET_MAINTENANCE_DOSE` \| `TEST_AGAIN` \| `REPEAT_TEST_NOW` \| `OFFER_RETURN_PLAN` \|
`START_RETURN_PLAN` \| `CONTINUE_RETURN_PLAN` \| `STOP_RETURN_PLAN` \|
`RETURN_TO_MAINTENANCE` \| `SAFETY_RETURN` \| `PAUSE_DOSING` \| `VERIFY_DOSER` \|
`VERIFY_SOLUTION` \| `VERIFY_CONFIGURATION` \| `INSUFFICIENT_DATA`

`MaintenanceBalance` closed vocabulary: `DEFICIT` \| `MATCHED` \| `EXCESS` \|
`UNCERTAIN` \| `NO_SUPPORTED_MISMATCH`

---

## 7. Interventions

### `Intervention`

Created **only** by a confirmed actual dose change. A recommendation never creates one
(Part I §31, Part II §27).

| Field | Unit | Notes |
|---|---|---|
| `interventionId` `IMMUT` | — | |
| `interventionType` | — | `MAINTENANCE_DOSE_CHANGE` \| `LEVEL_CORRECTION` \| `RETURN_PLAN` \| `SAFETY_RETURN` \| `MANUAL_UNMODELLED_INTERVENTION`. |
| `recommendedByAssessmentId` | — | `OPT`. Absent for a purely manual change. |
| `oldDoseMlPerDay` / `newDoseMlPerDay` | mL/day | Actual states. |
| `actualStartTime` | `Instant` | With `effectiveAtConfidence`. |
| `baselineClusterId` | — | `OPT`. Absent, or present with `anchorRelationAmbiguous = true` (`AUDIT-028`). |
| `baselinePositionDkh` | dKH | |
| `preChangeTrend` | `ObservedTrajectory` | |
| `preChangeTrendEvidence` | — | |
| `phase` | — | `InterventionPhase`. |
| `responseAttribution` | — | `ResponseAttribution`. |
| `positionEvent` | — | `NONE` \| `OVERSHOOT` — **orthogonal** to response (Part I §7.6A). |
| `exposureFraction` | 0..1 | Stored for audit (`OI-EXPOSURE-001`). |
| `predictionSnapshot` | `InterventionPredictionSnapshot` | `IMMUT`. |

`InterventionPhase`: `NOT_STARTED` \| `JUST_IMPLEMENTED` \| `OBSERVING` \|
`ASSESSMENT_DUE` \| `ASSESSED` \| `INTERRUPTED` \| `EXPIRED`

`ResponseAttribution` — complete closed vocabulary, assembled from Part I §7.6 plus the
Part III specialisations:

| Value | Source | Terminal? |
|---|---|---|
| `NOT_YET_ASSESSABLE` | Part I §7.6 | no |
| `AWAITING_FORMAL_POST_SLOPE` | `ALK-POSTCHANGE-001` — Day +2 state | no |
| `AWAITING_DETECTABILITY` | `ALK-RESPONSE-DETECTABILITY-001` | no |
| `EXPECTED` | `ALK-RESPONSE-CLASSIFIER-001` | yes |
| `PARTIAL` | `ALK-RESPONSE-CLASSIFIER-001` | yes |
| `NO_DETECTABLE_RESPONSE` | `ALK-RESPONSE-CLASSIFIER-001` | yes |
| `CONTRADICTORY` | `ALK-RESPONSE-CLASSIFIER-001` | yes |
| `OVER_RESPONSE` | `ALK-RESPONSE-CLASSIFIER-001` | yes |
| `INCONCLUSIVE` | `ALK-RESPONSE-CLASSIFIER-001` | no (may resolve with more evidence) |
| `NOT_ATTRIBUTABLE_SMALL_SIGNAL` | `ALK-RESPONSE-ATTRIBUTION-001` | **yes, immediately** |
| `PRECHANGE_EVIDENCE_INSUFFICIENT` | `ALK-RESPONSE-PRE-EVIDENCE-001` | **yes** |
| `NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME` | `ALK-INTERVENTION-EXTERNAL-CHANGE-001` | yes for that window |
| `CONFOUNDED` | `WG-ALK-023`, `WG-ALK-012` | yes for that window |
| `INTERRUPTED` | Part II §36, `WG-ALK-021` | yes |
| `INTERRUPTED_BY_SAFETY_RETURN` | `ALK-SAFETY-RETURN-INTEGRATION-001` §2 | yes |
| `UNRESOLVED_EXPIRED` | `ALK-RESPONSE-DETECTABILITY-001` 14-day horizon | yes |
| `LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE` | `M-7` | yes |

`INTERRUPTED` is never `FAILED` and never `EXPECTED` (Part I §57 item 9).

### `InterventionPredictionSnapshot` `IMMUT`

`ALK-PREDICTION-SNAPSHOT-001`. A **historical fact about what the app predicted**.

```text
InterventionPredictionSnapshot {
  interventionId                  REQ
  createdAt                       REQ
  oldDoseMlPerDay                 REQ
  newDoseMlPerDay                 REQ
  selectedPotencyAtPrediction     REQ   dKH/mL
  potencyContextIdAtPrediction    REQ
  potencyConfidenceAtPrediction   REQ
  preChangeObservedSlope          REQ   dKH/day
  preChangeSlopeUncertainty       REQ   dKH/day
  expectedSlopeChange             REQ   dKH/day  = P_prediction (D_new - D_old)
  predictedPostSlope              REQ   dKH/day  = S_pre + expectedSlopeChange
  calculationVersion              REQ
}
```

**Never** recomputed. If potency is later recalibrated, the formal response classifier
still evaluates against `expectedSlopeChange` from this snapshot, while current
recommendations use current potency (`WG-ALK-019`, `WG-ALK-020`, `WG-ALK-038`). Storing
`historicalPredictionPotency ≠ currentSelectedPotency` simultaneously is intentional.

### `ResponseAssessment` `DERIVED`

| Field | Unit | Notes |
|---|---|---|
| `postSlopeDkhPerDay` / `sigmaPost` | dKH/day | Genuine post-change clusters only; the Day-0 anchor is excluded. |
| `preSlopeDkhPerDay` / `sigmaPre` | dKH/day | From the snapshot. |
| `expectedResponseDkhPerDay` | dKH/day | `R_exp = |ΔS_expected|` from the snapshot. |
| `directedObservedResponseDkhPerDay` | dKH/day | `R_obs = u · (S_post − S_pre)`, `u = sign(ΔS_expected)`. |
| `sigmaResponseDkhPerDay` | dKH/day | `√(σ_pre² + σ_post²)`. |
| `responseBandDkhPerDay` | dKH/day | `B = 1.28 σ_response`. |
| `minimumAttributionBandDkhPerDay` | dKH/day | `B_min = 1.28 σ_pre`. |
| `sigmaPostRequiredDkhPerDay` | dKH/day | `√((R_exp/1.28)² − σ_pre²)`. |
| `responseErrorDkhPerDay` / `responseRatio` | — | **Diagnostic only.** Must not form a second classifier (Part II §33). |
| `classification` | — | `ResponseAttribution`. |

---

## 8. Return plans and safety

### `ReturnPlan`

Opt-in deliberate level movement. Never silently embedded in maintenance
(`CORE-STABILISE-001`, Part I §36).

| Field | Unit | Notes |
|---|---|---|
| `returnPlanId` `IMMUT` | — | |
| `startingLevelDkh` | dKH | Measured level at plan start. |
| `aimPointLevelDkh` | dKH | `(RangeMin + RangeMax)/2`. **A level, never a dose.** |
| `plannedSlopeDkhPerDay` | dKH/day | `S_plan` — `+0.125` \| `+0.25` \| `+0.50` or the downward mirror (`ALK-055`). |
| `maintenanceReferenceMlPerDay` | mL/day | `D_maintenance,reference` — the current held maintenance dose. |
| `temporaryDoseMlPerDay` | mL/day | `D_maintenance,reference + S_plan/P`, clamped `≥ 0`. **A rate, never a level.** |
| `predictedDurationDays` | days | `|aimPoint − startingLevel| / |S_plan|`. |
| `expiryAt` | `Instant` | `actualStart + (2 · predictedDurationDays + 2) days` (`ALK-RETURN-EXPIRY-001`). |
| `arrivalZoneMinDkh` / `MaxDkh` | dKH | Centred on the midpoint, width `max(bandWidth/3, 2·0.10)`, clamped to band width (`ALK-057`). |
| `phase` | — | `ReturnPlanPhase`. |
| `actualImplementationState` | — | `NOT_IMPLEMENTED` \| `IMPLEMENTED` \| `UNKNOWN`. Separate from the recommendation. |
| `actualDoseMlPerDay` | mL/day | `UNK-OK`. `UNKNOWN_OR_LAST_LOGGED` when implementation is unverified. |
| `achievabilityNote` | — | Set when a downward pace exceeds `−C` at zero dose (`WG-ALK-035`). |

`ReturnPlanPhase`: `OFFERED` \| `ACTIVE` \| `ASSESSMENT_DUE` \| `CONFIRMATION_PENDING` \|
`COMPLETE` \| `EXPIRED_OVERRUN` \| `INTERRUPTED` \| `TERMINATED_BY_SAFETY_RETURN`

`TERMINATED_BY_SAFETY_RETURN` is a canon value (`ALK-RETURN-TERMINATED-BY-SAFETY-001`). It
is **terminal**: a plan in this phase never returns to `ACTIVE`, and a new plan needs fresh
`returnPlanEligibleTrajectory` eligibility plus a fresh opt-in. The proposed
`SUSPENDED_PENDING_SAFETY` value was **not** adopted and must not appear.

`returnPlanEligibleTrajectory` `DERIVED` `boolean` —
`ALK-RETURN-ELIGIBLE-TRAJECTORY-001`: ordinary minimum evidence satisfied **and**
`S_supported = 0`. It is not `ALK-STABLE-001`'s `STABLE`, and the two must not share a
field.

The temporary movement component stops on the **first** measured reach or pass of the aim
point. Confirmation is a separate later stage and never justifies keeping the temporary
dose running (`ALK-056`, `WG-ALK-015`, `AUDIT-021`).

### `SafetyState` `DERIVED`

| Field | Unit | Notes |
|---|---|---|
| `outerBoundState` | — | `WITHIN_BOUNDS` \| `BREACHED_LOW` \| `BREACHED_HIGH` \| `RECOVERING_INSIDE_BOUND`. |
| `safetyDestinationDkh` | dKH | `OuterMin + 0.20` or `OuterMax − 0.20`. **A level.** |
| `bSafetyDkh` | dKH | `0.20`, fixed. **Never** recomputed from the current kit, residual scatter or `sigma_point` (`ALK-SAFETY-BUFFER-001` Freeze-2 interpretation). |
| `desiredMovementDkh` | dKH | `min(A_safe,low − A_now, 0.50)` low; `min(A_now − A_safe,high, 0.50)` high. |
| `safetyCorrectionVolumeMl` | mL | `ΔA_safety / P_selected`. Low breach only. **A volume.** |
| `temporarySafetyRateContinuousMlPerDay` | mL/day | **An auditable intermediate, not an output.** High breach at any level above `outerMax`, with no upper limit (owner decision 24): from consumption where `C_estimate >= 0` (branch A), and from `D_current` where `C_estimate` is negative (branch B) or not computable at all (branch B′, `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`). **A rate**, at full precision, and an advisory target rather than something a device executes. `NOT_RUN` where the high-breach precondition refuses because `D_current` is unknown (owner decisions 20 and 25) — and then **not** `0`. **It is NOT `NOT_RUN` at an advisory boundary.** |
| `temporarySafetyRateRecommendationMlPerDay` | mL/day | **THE output** — the single recommended safety rate (`ALK-RECOMMEND-ONLY-001`, owner decision 23). Produced by `ALK-ROUNDING-001` where a display precision is configured, and stated at full precision where none is. It is `NOT_RUN` in exactly **one** state: the high-breach precondition refused because `D_current` is unknown (owner decisions 20 and 25), and then it is **never `0`**. It is **not** `NOT_RUN` for a missing precision, and **not** `NOT_RUN` at an advisory boundary. The field above is an intermediate beside it, not a second answer: **the two-output split of `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` is retired**. |
| `safetyDoseRecommendationMlPerDay` | mL/day | **Superseded by owner decision 16.** The high-breach delivered figure is now `temporarySafetyRateContinuousMlPerDay`, sized as `max(0, D_current − R_down / P_selected)` on branches B and B′ (`ALK-HIGH-BREACH-SAFETY-SIZING-001`; the sizing input was renamed from `D_established` by owner decision 20). Zero appears only when that expression floors. |
| `currentDoseMlPerDay` (safety context) | mL/day | `D_current` — the delivery rate **the doser is configured to be delivering at the time of the recommendation**, and the quantity the high-breach sizing reduces. **Renamed from `establishedDoseMlPerDay` by owner decision 20**; the old name was also used for the interval-mean rate. Unknown ⇒ the safety rate and the recommendation are both `NOT_RUN` and **neither is `0`** (`ALK-DELIVERY-RATE-BASIS-001`). |
| `advisoryCeilingDkh` | dKH | `outerMax + 1.0`. A boundary derived as an **offset** from the configured bound, not a pinned level (`ALK-ADVISORY-RANGE-BOUNDARY-001`, owner decision 21). |
| `advisoryFloorDkh` | dKH | `outerMin − 1.0`. Same construction, low side. |
| `advisoryConfidenceWarning` | — | `NONE` \| `ATTACHED`. **Two states only** (`ALK-ADVISORY-RANGE-BOUNDARY-001`, owner decision 29): present or absent. `NOT_RUN` is **retired** — where no reading resolves there is nothing to warn about and the field is absent, which is `NONE`, not a third value. `ATTACHED` where the resolved episode value is at or beyond either advisory boundary. **The ordinary recommendation is still produced, by the ordinary rules — it is not withheld and it is not zero** (`ALK-ADVISORY-RANGE-BOUNDARY-001`, owner decision 24, superseding decision 21's withholding). The warning may not alter the recommended rate, the trajectory, the consumption estimate or the retest schedule, and it renders the scheduler's retest interval rather than stating one of its own (owner decision 26). Does **not** change `outerBoundState`. |
| `rDownDkh` | dKH | `min(A_now − A_safe,high, 0.50)`. The requested downward effect, rail-bounded. |
| `safetyDoseReason` | — | e.g. `HIGH_BREACH_CONSUMPTION_NOT_USABLE_FOR_SIZING`. |
| `maintenanceEstimateStatus` | — | `RESOLVED` \| `UNRESOLVED`. A zero safety dose is **not** a new maintenance estimate. |
| `interventionLockOwner` | — | `NONE` \| `SAFETY_RETURN` \| `ORDINARY_INTERVENTION`. |
| `compositeMovementDkhPer24h` | dKH | Signed sum of all simultaneously recommended intentional components; `|·| ≤ 0.50`. |
| `magnesiumGateState` | — | `ALERT_LOW` \| `NOT_ALERT_LOW` \| `UNKNOWN`. **Always `UNKNOWN`** in the Alk-only runtime. |

A safety return completes only when the **buffered** destination is reached. Merely
crossing back over the raw outer bound leaves `RECOVERING_INSIDE_BOUND` with the safety
return still active (`WG-ALK-053`).

The intervention lock is a **recommendation** lock. It never asserts that the keeper's
pump cannot be changed (`ALK-SAFETY-RETURN-INTEGRATION-001` §10).

### `RetestDecision` `DERIVED`

```text
RetestDecision {
  selectedAction      REPEAT_NOW | TEST_AT | ROUTINE
  earliestUsefulAt    Instant
  recommendedAt       Instant
  latestSafeAt        Instant   OPT
  reasonCode          RetestReason      the selected candidate's code
  selectedReasonCode  RetestReason      the same code, under the name the frozen
                                        fixtures assert
  tiedReasonCodes[]   RetestReason[]    every OTHER candidate tying on the selected
                                        time; reason codes are additive, so a tie is
                                        recorded rather than broken (ALK-053A)
  selectedApproxHours hours             the selected candidate's interval from asOf
  observationCeilingHours   hours       the ~Day-4 ordinary observation ceiling in force
  observationFloorApplied   boolean     whether the signal candidate's own floor bound
  tSignalDays         days              raw T_signal, before its own floor and the ceiling
  tSignalRawHours     hours             the same quantity in hours
  tSignalHours        hours             the same quantity again, under the other name the
                                        frozen fixtures use for it
  tBoundaryDays       days              T_outer - 1.0, the forecast candidate's lead
  candidateTimes[]    { candidateClass, at, included|excluded, reason,
                        approxHours, rawHours, flooredHours, clampedHours, boundSide }
  candidatesNotRun[]  reason codes for canonically NOT_RUN candidate classes
                      (T_detect, return-plan arrival cadence)
  clampsApplied[]     RETEST_OBSERVATION_CEILING_APPLIED | RETEST_SIGNAL_FLOOR_APPLIED
  assumptions[]
}
```

One scheduler owns final next-test timing (`X-INV-004`). A notification surface may render
`recommendedAt`, `earliestUsefulAt`, `latestSafeAt` and `reasonCode` and must not compute
any of them.

#### What owner decision `DEC-022` added here, exhaustively

`OD-012` recorded that `AD-RET-001`…`AD-RET-005` assert a vocabulary this record did not
declare, so no contract-conformant engine could satisfy them. `DEC-022` closes it by
extending the record. **This is the complete list; nothing else was added.**

| Added | Where | Unit | What it is |
|---|---|---|---|
| `selectedApproxHours` | `RetestDecision` | hours | `recommendedAt − assessmentAsOf`. The same decision `recommendedAt` already states, as an interval. |
| `selectedReasonCode` | `RetestDecision` | — | Identical in value to `reasonCode`, under the fixtures' name. |
| `observationCeilingHours` | `RetestDecision` | hours | The ordinary-observation ceiling in force (96 h, `ALK-053`). |
| `observationFloorApplied` | `RetestDecision` | — | Whether the `SIGNAL_ACCUMULATION` candidate's own 24 h floor bound. |
| `approxHours` | `candidateTimes[]` | hours | That candidate's final interval, after its own formula's floor and after the ceiling. |
| `rawHours` | `candidateTimes[]` | hours | That candidate's interval before its own floor. |
| `flooredHours` | `candidateTimes[]` | hours | Its interval after the floor inside its own formula, before the ceiling. |
| `clampedHours` | `candidateTimes[]` | hours | Its interval after the ordinary-observation ceiling. |
| `boundSide` | `candidateTimes[]` | — | `OUTER_MIN` \| `OUTER_MAX`, for the forecast candidate. |
| `tSignalDays` | `RetestDecision` | days | Raw `T_signal = 0.10 / \|S_supported\|`, before its own floor and before the ceiling. |
| `tSignalRawHours` | `RetestDecision` | hours | The same quantity in hours. |
| `tSignalHours` | `RetestDecision` | hours | The same quantity again: `AD-RET-002` calls it `tSignalRawHours` and `AD-RET-003` calls it `tSignalHours`, both meaning raw. Both names are declared and carry one value, because the fixtures are frozen and an engine that emitted only one of them would fail the other. |
| `tBoundaryDays` | `RetestDecision` | days | `T_outer − 1.0`: the forecast candidate's 24 h safety lead, before it is converted to an instant. |

Two of these are **renames rather than additions**, and the reason is mechanical rather
than editorial. The harness resolves a fixture's expectation by field name across the whole
`EngineResult`, which `INV-B7` / `ALK-VARIABLE-SEMANTICS-001` justify by making one name
carry one meaning. Two names in this contract carried two:

- `action` named both `RetestDecision`'s scheduling action and `DoseRecommendation.action`,
  which is a `RecommendationAction` and normally differs. Any engine emitting both makes
  every fixture asserting `action` unresolvable. `RetestDecision`'s is now
  `selectedAction`, which is also the name the five fixtures use, so the disambiguation and
  the extension are the same edit.
- `reasonCode` named both the retest decision's selected code and `CapabilityState`'s.
  `WG-ALK-001` and `WG-ALK-006` assert the retest one under the bare name, so it stays;
  `CapabilityState`'s is renamed below.

`Hours` is deliberately **not** added to §0's dimension-suffix vocabulary. These fields are
the scheduler's own audit arithmetic over an elapsed duration whose canonical form stays
`...At`, and adding a tenth suffix would license hour-valued twins of every instant in the
contract.

### `CapabilityState` `DERIVED`

```text
CapabilityState {
  capabilityId            M-1 .. M-13
  present                 true | false
  outcome                 OK | DEGRADE | REFUSE | NOT_RUN
  affectedOutputs[]       the specific outputs withheld or degraded
  capabilityReasonCode    renamed from `reasonCode` by DEC-022; see RetestDecision above
}
```

Outcomes are canon-fixed (`ALK-CAPABILITY-CONTRACT-001`, Freeze-1 missing-data
disposition):

| Capability | Missing behaviour |
|---|---|
| `M-1` recommendation precision | `REFUSE` final maintenance mL/day **only where a CONFIGURED value is ≤ 0**. Where none is configured, state the full-precision recommendation and withhold nothing. **No exemption list, because there is no absent-value refusal to be exempt from** (owner decision 23). |
| `M-2` solution context | Core continues on theoretical potency; potency learner `NOT_RUN`. |
| `M-3` delivery context | Core continues on confirmed programmed dose; potency learner `NOT_RUN`. |
| `M-4` replacement-water Alk | `DEGRADE` to the deterministic unknown-WC branch. |
| `M-5` dose-change effective time | `DEGRADE`; response and potency across the boundary not assessable. |
| `M-6` delivered volume | `DEGRADE` to programmed schedule, else segment; mixed integration `NOT_RUN`. |
| `M-7` prediction snapshot | Legacy causal response `NOT_RUN`; **required** for new V2 interventions. |
| `M-8` precise measurement time | `DEGRADE` legacy to position/history; ambiguous trend evidence excluded. |
| `M-9` pre/post programmed dose state | Potency observation `NOT_RUN`. |
| `M-10` historical bracket evidence | Empirical bracket `NOT_RUN`; core continues. |
| `M-11` magnesium alert state | `DEGRADE` to `UNKNOWN`; Alk safety still runs; no low-Mg warning invented. |
| `M-12` effective-dated configuration | Historical config-dependent replay `NOT_RUN`; raw facts retained. |
| `M-13` absolute-time provenance | `DEGRADE`; exact elapsed-time analyses `NOT_RUN` where ambiguity matters. |

---

## 9. Result, reason codes and audit

### `EngineResult` — the single domain output

```text
EngineResult {
  assessmentId              IMMUT
  assessmentAsOf            Instant        explicit; never a clock read
  parameter                 ALK
  engineVersion             REQ
  canonVersion              REQ            "SHARED_V2_FREEZE_2 / ALK_V2_FREEZE_5"
  configVersionId           REQ            resolved at assessmentAsOf

  position                  Position
  latestValidClusterId      REQ
  latestValidValueDkh       dKH
  outerBoundState

  observedTrajectory        ObservedTrajectory | NOT_RUN
  supportedTrajectory       SupportedTrajectory | NOT_RUN
  trajectory                Trajectory
  movementEvidence          MovementEvidence

  consumption               ConsumptionEstimate | NOT_RUN
  maintenanceBalance        MaintenanceBalance
  potency                   ProductPotency projection
  doseRecommendation        DoseRecommendation | WITHHELD
  activeIntervention        Intervention | NONE
  responseAssessment        ResponseAssessment | NOT_RUN
  returnPlan                ReturnPlan | NONE
  safety                    SafetyState
  retest                    RetestDecision
  capabilities[]            CapabilityState
  forecast                  { tRangeLowDays, tRangeHighDays,
                              tOuterLowDays, tOuterHighDays }   each NOT_APPLICABLE-able
  recommendationConfidence  UNSPECIFIED            frozen value; ALK-CONFIDENCE-OUTPUT-001
  evidenceFacts             { independentClusters, spanDays, sigmaS,
                              supportRatio?, confounders[], potencyConfidence,
                              deliveryBasis }         surfaced in place of a label
  reasonCodes[]             ReasonCode
  auditTraceId              REQ
}
```

`NOT_RUN`, `WITHHELD` and `NONE` are first-class values. An absent field is a schema
violation; a withheld output is a designed state that carries its own reason code.

Forecast horizons are `NOT_APPLICABLE` for the irrelevant direction and **never** a
negative duration (`ALK-FORECAST-SLOPE-001`).

### `ReasonCode`

```text
ReasonCode {
  code       REQ   from the closed catalogue in ALK-V2-REASON-CODES.md
  owner      REQ   owning module
  severity   REQ   INFO | GATING | REFUSAL | SAFETY
  payload    REQ   the exact fields listed for that code in the catalogue
}
```

A reason code explains **why the deterministic engine produced this outcome**, referencing
the rule and the numbers that triggered it. Vague labels (`LOW_CONFIDENCE`,
`BE_CONSERVATIVE`, `LOOKS_STABLE`) are forbidden.

### `AuditTrace` `IMMUT`

Everything `ALK-069` and Part II §63 require, sufficient to reproduce the assessment.

```text
AuditTrace {
  auditTraceId, assessmentId, engineVersion, canonVersion, configVersionId, assessmentAsOf

  measurementSelection { candidateClusterIds[], includedClusterIds[],
                         excludedClusterIds[], exclusionReasons[],
                         normalizationsApplied[] }
  segment              { segmentId, bounds, boundaryCauses[], confounders[],
                         eligibilityPerInference }
  trend                { estimator, pairwiseSlopes[], slope, intercept, residuals[],
                         sigmaResid, sigmaPoint, tBar, sxx, sigmaS, movementSNR,
                         evidenceDecision }
  support              { supportK, supportSubtraction, supportedSlope }
  dose                 { currentDose, deliveryBasis, integratedVolume?, effectiveDose }
  potency              { theoretical, learned, selected, confidence, contextIds,
                         warnings[] }
  consumption          { estimate, physicality, inputs }
  recommendation       { maintenanceEstimate, continuousActionCandidate,
                         uncappedIdeal, constraintsApplied[], railEffect,
                         capEffect, bracketStatus, roundedFinal, predictedPostSlope }
  intervention         { preState, predictionSnapshot, exposure, postClusterIds[],
                         responseMetrics, classification }
  safety               { outerBoundState, destination, desiredMovement,
                         compositeMovement, lockOwner }
  retest               { candidateTimes[], selected, reasonSelected,
                         clampsApplied[], candidatesNotRun[] }
  reasonCodes[]
}
```

Replay contract: the same ledger + configuration history + `asOf` + engine/canon version
reproduces the trace exactly. Historical `EngineResult`s are never rewritten by later data
edits or configuration changes; a re-analysis is a **new** assessment with a new
`assessmentId` (`ALK-065`, `WG-ALK-029`, `WG-ALK-030`, Part I §46).

---

## 10. Cross-cutting schema invariants

1. `rawValueDkh` is never overwritten by any derived value.
2. `measuredAt` is never replaced by `recordedAt`, and `effectiveAt` is never replaced by
   `recordedAt`.
3. Time provenance never improves in place. A `DATE_ONLY` record is `DATE_ONLY` forever.
4. Missing dose history is representable as missing. There is no defaulting to
   "unchanged", and absence of a recorded dose change is not evidence that none occurred
   (`DATA-PROVENANCE.md` §3).
5. `UNKNOWN` never collapses to a value; `ABSENT` never collapses to `UNKNOWN`.
6. No field carries two dimensions under different states.
7. Every derived object names the segment, clusters and configuration version it used.
8. Every withheld output carries a reason code; no output is silently absent.
9. A recommendation record and an implementation record are separate objects with
   separate identities and separate timestamps.
10. Prediction snapshots are write-once.
