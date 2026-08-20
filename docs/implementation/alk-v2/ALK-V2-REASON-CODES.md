# ALK V2 — REASON-CODE CATALOGUE

A reason code explains **why the deterministic engine produced this outcome**. It names
the rule and carries the numbers that triggered it, so a card, an audit trace and a
support conversation all reference the same fact.

## Rules for this catalogue

1. **Closed set.** An engine may emit only codes listed here. An unlisted code is a
   conformance failure.
2. **Explanatory, not evaluative.** Forbidden shapes: `LOW_CONFIDENCE`,
   `BE_CONSERVATIVE`, `LOOKS_STABLE`, `NOT_SURE`, `PROBABLY_FINE`. A code must name the
   evidence or the rule, not a mood.
3. **One owner per code.** The owning module is the only module that may emit it.
4. **Payload is mandatory.** Every code carries the exact fields listed. A code without
   its payload cannot be rendered honestly or audited.
5. **Severity** is `INFO` (explanatory), `GATING` (an output was held or deferred),
   `REFUSAL` (an output was withheld for a missing/unsupported input), or `SAFETY`.
6. **Codes are additive.** Several may be true at once; emit all of them in the owner
   order given in `A48`.
7. **No user-facing wording lives here.** Part IX owns wording. A code maps to card
   semantics in `ALK-V2-MODULE-DESIGN.md` §7.

Common payload fields, omitted from each row for brevity: `ruleId`, `assessmentId`,
`assessmentAsOf`, `segmentId` where a segment is involved.

---

## VALIDATION_ — owner: `VALIDATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `VALIDATION_VALUE_NOT_FINITE` | `REFUSAL` | Entry is not a finite number. | `enteredValue` |
| `VALIDATION_UNIT_UNSUPPORTED` | `REFUSAL` | Unit not supported for the parameter. | `enteredUnit`, `supportedUnits[]` |
| `VALIDATION_VALUE_NOT_PHYSICAL` | `REFUSAL` | Outside physical representability. Being outside the target or outer range is **not** this. | `valueDkh`, `representableRange` |
| `VALIDATION_TIMESTAMP_INVALID` | `REFUSAL` | Unparseable or implausibly future. | `enteredAt`, `asOf` |
| `VALIDATION_PARAMETER_MISMATCH` | `REFUSAL` | Entry parameter differs from context. | `entered`, `expected` |
| `VALIDATION_UNIT_CONVERTED` | `INFO` | meq/L converted at 2.8 dKH per meq/L. | `enteredValue`, `enteredUnit`, `canonicalValueDkh` |
| `VALIDATION_TARGET_RANGE_INVERTED` | `REFUSAL` | `min ≥ max`. | `min`, `max` |
| `VALIDATION_TARGET_OUTSIDE_OUTER_BOUNDS` | `REFUSAL` | Target range not inside the outer envelope. | `targetRange`, `outerBounds` |
| `VALIDATION_CROSS_METHOD_THRESHOLD_NOT_CANONISED` | `INFO` | Canonised `NOT_RUN`: no cross-method concordance threshold and no method-compatibility classification exists (owner decision 18). `ALK-005`'s 0.20 dKH is a same-method repeat threshold and is not applied across methods. | `methods[]`, `ruleId: ALK-REPEAT-SPREAD-DOMAIN-001` |
| `VALIDATION_OUTER_BOUNDS_INVERTED` | `REFUSAL` | `outerMin ≥ outerMax`. | `outerBounds` |
| `VALIDATION_NET_VOLUME_INVALID` | `REFUSAL` | Net volume ≤ 0. | `netVolumeL` |
| `VALIDATION_ACTUATOR_INCREMENT_INVALID` | `REFUSAL` | Increment ≤ 0. | `actuatorIncrementMlPerDay` |
| `VALIDATION_SUSPICION_DETECTION_NOT_RUN` | `INFO` | Automatic statistical suspicion detection is canonically `NOT_RUN`; alkalinity defines no threshold and Freeze 5 declined to invent one. Explicit marks, recorded faults and repeat-spread anomalies still run. | `ruleId: ALK-SUSPECT-DETECTION-001`, `operativeSources[]` |
| `VALIDATION_DEVICE_FAULT_RECORDED` | `GATING` | A recorded test/device fault marks the affected readings `SUSPECT`. | `readingIds[]`, `faultEventId` |
| `VALIDATION_READING_MARKED_INVALID` | `INFO` | User or a recorded fault marked the reading invalid. | `readingId`, `invalidReason` |
| `VALIDATION_READING_MARKED_SUSPECT` | `GATING` | Explicitly marked suspect; ordinary dose escalation withheld until resolved. | `readingId`, `markedBy` |

## TIME_ — owner: `VALIDATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `TIME_PROVENANCE_EXACT` | `INFO` | Event carries a proven absolute instant. | `readingId` |
| `TIME_PROVENANCE_RECONSTRUCTED` | `INFO` | Historical offset independently proven; reconstruction recorded. | `readingId`, `provenanceNote` |
| `TIME_PROVENANCE_LOCAL_ZONE_UNKNOWN` | `GATING` | Local `HH:MM` with no proven offset; excluded from exact-elapsed analysis. | `readingId` |
| `TIME_PROVENANCE_DATE_ONLY` | `GATING` | Date known, time unknown; excluded from trend, retained for history/position. | `readingId`, `date` |
| `TIME_EXACT_ELAPSED_UNAVAILABLE` | `REFUSAL` | An exact-elapsed calculation cannot run on these operands. | `fromReadingId`, `toReadingId`, `provenances[]` |
| `TIME_EVENT_ORDER_AMBIGUOUS` | `GATING` | Same-instant events whose physical order is not established. | `eventIds[]`, `instant` |

## CONFIG_ — owner: `VALIDATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `CONFIG_VERSION_RESOLVED` | `INFO` | Configuration version effective at `assessmentAsOf`. | `configVersionId`, `effectiveFrom` |
| `CONFIG_HISTORICAL_UNAVAILABLE` | `REFUSAL` | Replay needs configuration older than the first proven version. | `requestedAt`, `firstProvenEffectiveFrom` |
| `CONFIG_TARGET_RANGE_CHANGED` | `INFO` | Position reclassified by a target edit; consumption, potency and slope unchanged. | `oldRange`, `newRange` |
| `CONFIG_NET_VOLUME_CHANGED` | `INFO` | Net-volume change; new potency context. | `oldL`, `newL`, `newSolutionContextId` |

## CLUSTER_ — owner: `SEGMENTATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `CLUSTER_FORMED_EXPLICIT` | `INFO` | Grouped by explicit `repeatGroupId`. | `clusterId`, `readingIds[]` |
| `CLUSTER_FORMED_AUTOMATIC` | `INFO` | Grouped by the 30-minute window. | `clusterId`, `readingIds[]`, `windowMinutes: 30` |
| `CLUSTER_ANOMALOUS_SPREAD` | `GATING` | Repeat spread exceeds 0.20 dKH. | `clusterId`, `spreadDkh`, `limitDkh: 0.20`, `memberValues[]` |
| `CLUSTER_REPEAT_NOT_INDEPENDENT` | `INFO` | Repeats inside one cluster do not add independent observations. | `clusterId`, `memberCount` |
| `CLUSTER_SIGMA_FLOOR_APPLIED` | `INFO` | Cluster sigma fell back to the 0.10 dKH base. | `clusterId`, `sigmaClusterDkh` |

## SEGMENT_ — owner: `SEGMENTATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `SEGMENT_SELECTED` | `INFO` | The current-control segment chosen. | `segmentId`, `startAt`, `endAt`, `spanDays`, `lookbackCapDays: 14` |
| `SEGMENT_BOUNDARY_DOSE_CHANGE` | `INFO` | Segment ends at a maintenance dose change. | `doseStateId`, `effectiveAt` |
| `SEGMENT_BOUNDARY_POTENCY_CONTEXT` | `INFO` | Product, batch, concentration, pump or calibration change. | `eventId`, `contextKind` |
| `SEGMENT_BOUNDARY_DELIVERY_ANOMALY` | `INFO` | Pump failure, outage, missed or extra dose. | `anomalyId`, `anomalyType` |
| `SEGMENT_BOUNDARY_NET_VOLUME` | `INFO` | Net-volume change. | `configVersionId` |
| `SEGMENT_BOUNDARY_UNKNOWN_CORRECTION` | `INFO` | Major unmodelled correction. | `correctionId` |
| `SEGMENT_BOUNDARY_WATER_CHANGE_UNKNOWN` | `INFO` | Unknown-replacement water change with `f ≥ 0.05`. | `waterChangeId`, `changedFraction` |
| `SEGMENT_BOUNDARY_UNCERTAIN_DOSE_TIME` | `GATING` | Dose-change effective time uncertain; straddling window confounded. | `doseStateId`, `earliestAt`, `latestAt` |
| `SEGMENT_CONFOUNDED_UNKNOWN_CORRECTION` | `GATING` | Correction amount or time unknown; nothing invented. | `correctionId` |
| `SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME` | `GATING` | Interval could straddle an unknown dose boundary. | `doseStateId` |
| `SEGMENT_CONFOUNDED_SAFETY_RETURN` | `GATING` | Interval materially affected by a safety return. | `interventionId` |
| `SEGMENT_NORMALIZED_CORRECTION` | `INFO` | Known correction normalized from subsequent points. | `correctionId`, `appliedStepDkh`, `deliveredAt` |
| `SEGMENT_NORMALIZED_WATER_CHANGE` | `INFO` | Known material water-change step normalized. | `waterChangeId`, `appliedStepDkh` |
| `SEGMENT_WC_NEGLIGIBLE` | `INFO` | Predicted step below the 0.10 dKH floor; retained, not subtracted. | `waterChangeId`, `expectedStepDkh` |
| `SEGMENT_WC_MATERIAL_KNOWN_NORMALIZED` | `INFO` | Material known step normalized. | `waterChangeId`, `expectedStepDkh` |
| `SEGMENT_WC_UNKNOWN_SUBFLOOR` | `INFO` | Unknown replacement, `f < 0.05`; retained, no invented subtraction. | `waterChangeId`, `changedFraction`, `potentialStepDkh` |
| `SEGMENT_WC_UNKNOWN_BOUNDARY` | `GATING` | Unknown replacement, `f ≥ 0.05`; hard Alk boundary. | `waterChangeId`, `changedFraction`, `potentialStepDkh` |
| `SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE` | `GATING` | Replacement value present, but its confidence tier is not `MEASURED_SAME_BATCH`; normalization is refused and the unknown branch runs instead. | `waterChangeId`, `confidence`, `requiredConfidence: MEASURED_SAME_BATCH`, `ruleId: ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001` |
| `SEGMENT_NORMALIZATION_UNCERTAINTY_MODEL_UNAVAILABLE` | `INFO` | Normalization applied; its own uncertainty not propagated. | `eventIds[]`, `openIssue: OI-NORMUNCERT-001` |
| `SEGMENT_CHANGEPOINT_DETECTION_NOT_RUN` | `INFO` | No automatic change-point detection; explicit events only. | `openIssue: OI-CHANGEPOINT-001` |
| `SEGMENT_LOOKBACK_NOT_EXTENDED` | `INFO` | The 14-day cap was not extended despite sparse evidence. | `spanDays`, `capDays: 14` |

## DELIVERY_ — owner: `SEGMENTATION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `DELIVERY_BASIS_VERIFIED` | `INFO` | Individual deliveries directly available. | `intervalFromAt`, `intervalToAt` |
| `DELIVERY_BASIS_PROGRAMMED_SCHEDULE` | `INFO` | Confirmed programmed schedule used as a first-class basis. | `programmedDoseMlPerDay` |
| `DELIVERY_COMMAND_ONLY_UNCONFIRMED` | `GATING` | Nominal setting only; not treated as delivery history. | `doseStateId` |
| `DELIVERY_MIXED_INTEGRATION_NOT_RUN` | `GATING` | Mixed interval with no eligible basis; segmenting instead. | `intervalFromAt`, `intervalToAt` |
| `DELIVERY_ANOMALY_RECORDED` | `INFO` | Missed/extra dose, outage or failure inside the interval. | `anomalyId`, `anomalyType`, `fromAt`, `toAt` |

## EPISODE_ — owner: `SEGMENTATION`

Owner decisions 17 and 19. The testing episode is constructed once, upstream of every Alk
consumer; these codes explain what the episode was and why a consumer was withheld.

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `EPISODE_RESOLVED` | `INFO` | The testing episode produced one canonical value and time for every downstream consumer. | `episodeId`, `episodeValueDkh`, `episodeAt`, `readingCount`, `method`, `ruleId: ALK-EPISODE-RESOLUTION-001` |
| `EPISODE_MEASUREMENTS_POOLED` | `INFO` | Two or more same-method measurements or clusters belonged to one testing episode and were pooled under the existing representative-value rules. Replaces `CLUSTER_SAME_TIMESTAMP_COALESCED`; membership is the episode, not an identical timestamp. | `sourceClusterIds[]`, `representativeAt`, `pooledReadingCount`, `episodeValueDkh`, `episodeSpreadDkh`, `ruleId: ALK-TESTING-EPISODE-001` |
| `EPISODE_INCOMPATIBLE_METHODS_KEPT_DISTINCT` | `INFO` | Measurements from incompatible methods fell in one episode and were kept as distinct evidence rather than averaged. | `episodeId`, `readings[]`, `methods[]`, `ruleId: ALK-TESTING-EPISODE-001` |
| `EPISODE_CONTESTED_METHODS` | `GATING` | The episode holds incompatible-method measurements and no authoritative rule resolves which value governs. No episode value is emitted and the affected automatic inference is withheld. `ALK-005`'s 0.20 dKH is **not** applied across them. | `episodeId`, `readings[]`, `methods[]`, `crossMethodSpreadDkh`, `ruleId: ALK-EPISODE-RESOLUTION-001` |
| `EPISODE_POSITION_WITHHELD` | `GATING` | The latest episode is contested, so position and outer-bound classification are `NOT_RUN`. No measurement is chosen by ordering and no older episode is promoted. | `episodeId`, `candidateReadings[]`, `priorEpisodeAt`, `ruleId: ALK-EPISODE-SINGLE-OUTPUT-001` |

---

## EVIDENCE_ — owner: `SEGMENTATION` (counts) / `TREND` (states)

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `EVIDENCE_SUFFICIENT` | `INFO` | Ordinary minimum met: ≥3 independent clusters, ≥4-day span, no confounder, no unresolved anomaly. | `independentClusters`, `spanDays` |
| `EVIDENCE_INSUFFICIENT_CLUSTERS` | `GATING` | Fewer than 3 independent clusters in the 14-day window. | `have`, `need: 3`, `windowDays: 14`, `nextUsefulTestAt` |
| `EVIDENCE_INSUFFICIENT_SPAN` | `GATING` | Span under 4 days. | `haveDays`, `needDays: 4`, `nextUsefulTestAt` |
| `EVIDENCE_INSUFFICIENT_POSTCHANGE_SPAN` | `GATING` | Post-change regime has not yet reached the ordinary minimum. | `postClusters`, `postSpanDays`, `earliestSufficientAt` |
| `EVIDENCE_INDEPENDENT_SELECTION_APPLIED` | `INFO` | Forward-greedy chronological selection ran; at least one candidate cluster was not accepted as an ordinary trend observation. Its non-trend uses are unaffected. | `acceptedClusterIds[]`, `notAcceptedClusterIds[]`, `separationHours[]`, `ruleId: ALK-INDEPENDENT-SELECTION-001` |
| `EVIDENCE_CONFOUNDED_HARD` | `GATING` | A hard confounder prevents the inference. | `confounders[]` |
| `EVIDENCE_ANOMALOUS_LATEST_CLUSTER` | `GATING` | Latest cluster unresolved; ordinary dose action withheld. | `clusterId`, `spreadDkh` |
| `EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER` | `GATING` | A historical anomalous cluster is present; ordinary inference blocked rather than choosing between two slopes. | `clusterId`, `openIssue: OI-ANOMCLUSTER-001` |
| `EVIDENCE_PROVISIONAL_TWO_POINT` | `INFO` | Two-cluster basis; a signal, not an established trend. | `independentClusters: 2`, `spanDays` |

| `EVIDENCE_WITHHELD_CONTESTED_EPISODE` | `GATING` | An inference whose input set includes a contested episode is withheld rather than computed from one arbitrarily chosen measurement or from older evidence. | `inference`, `episodeId`, `ruleId: ALK-EPISODE-SINGLE-OUTPUT-001` |

---

## TRAJECTORY_ — owner: `TREND` / `SUPPORT`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `TRAJECTORY_FALLING` | `INFO` | `S_supported < 0`. | `observedSlope`, `supportedSlope`, `sigmaS` |
| `TRAJECTORY_RISING` | `INFO` | `S_supported > 0`. | `observedSlope`, `supportedSlope`, `sigmaS` |
| `TRAJECTORY_STABLE` | `INFO` | `S_supported = 0` **and** `S_observed = 0`, with ordinary sufficiency. | `observedSlope: 0`, `independentClusters`, `spanDays` |
| `TRAJECTORY_UNCERTAINTY_LIMITED` | `GATING` | Non-zero observed lean; supported slope shrinks to zero. Not `STABLE`. | `observedSlope`, `sigmaS`, `supportSubtraction`, `spanDays`, `independentClusters` |
| `TRAJECTORY_RAPID_CONFIRMED` | `SAFETY` | Confirmed rapid movement. | `pairSlopeDkhPerDay`, `thresholdDkhPerDay: 0.30`, `elapsedHours`, `rapidBasis` |
| `TRAJECTORY_RAPID_NOT_CONFIRMED` | `INFO` | Rapid conditions evaluated and not met. | `failedConditions[]` |
| `TRAJECTORY_ESTIMATOR_THEIL_SEN` | `INFO` | Multi-point robust slope used. | `n`, `pairwiseSlopeCount` |
| `TRAJECTORY_ESTIMATOR_TWO_POINT` | `INFO` | Two-point rate used under an explicitly permitted path. | `deltaDays` |

## UNCERTAINTY_ — owner: `UNCERTAINTY`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `UNCERTAINTY_FLOOR_APPLIED` | `INFO` | `sigma_resid < 0.10`; the Alk analytical floor governs `sigma_point`. | `sigmaResid`, `sigmaPoint: 0.10` |
| `UNCERTAINTY_RESIDUAL_DOMINATES` | `INFO` | Residual scatter exceeds the floor. | `sigmaResid`, `sigmaPoint` |
| `UNCERTAINTY_SXX_NOT_POSITIVE` | `REFUSAL` | `Sxx ≤ 0`; slope uncertainty not calculable. | `times[]`, `Sxx` |
| `UNCERTAINTY_TWO_POINT_BASIS` | `INFO` | Two-point sigma formula used. | `sigma1`, `sigma2`, `deltaDays`, `sigmaS` |
| `UNCERTAINTY_PAIRWISE_MAD_DIAGNOSTIC_ONLY` | `INFO` | Pairwise-slope MAD recorded; excluded from action sizing. | `pairwiseSlopeMad` |

## CONSUMPTION_ — owner: `CONSUMPTION`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `CONSUMPTION_ESTIMATED` | `INFO` | `C = P·D − S_observed` computed and physically interpretable. | `consumptionDkhPerDay`, `P`, `D`, `S_observed`, `deliveryBasis` |
| `CONSUMPTION_NOT_RUN_POTENCY_UNAVAILABLE` | `REFUSAL` | No valid selected potency. | `potencyState` |
| `CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE` | `REFUSAL` | Dose state unknown or missing for the interval. | `intervalFromAt`, `intervalToAt` |
| `CONSUMPTION_NOT_RUN_NET_VOLUME_UNAVAILABLE` | `REFUSAL` | Net volume required and absent. | — |
| `CONSUMPTION_NOT_RUN_HISTORICAL_CONTEXT_MISSING` | `REFUSAL` | Legacy records lack the dosing/intervention context this analysis requires. | `periodFrom`, `periodTo`, `ref: DATA-PROVENANCE.md §3` |
| `CONSUMPTION_NON_PHYSICAL_UNEXPLAINED_GAIN` | `SAFETY` | Mass balance says the tank gained alkalinity faster than the known dose supplied; no cause is asserted. | `consumptionDkhPerDay`, `P`, `D`, `S_observed`, `knownEventsInspected[]` |
| `CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED` | `GATING` | Negative but **not** materially negative: `C + 1.28·sigma_S >= 0`. UNCERTAIN / non-resolvable; HOLD; it cannot by itself reduce established maintenance. | `consumptionDkhPerDay`, `sigmaS`, `materialityMargin`, `ruleId: ALK-NEGATIVE-MATERIALITY-001` |
| `CONSUMPTION_MIXED_INTERVAL_INTEGRATED` | `INFO` | `D_eff` from an eligible integrated basis. | `integratedVolumeMl`, `elapsedDays`, `deliveryBasis` |

## POTENCY_ — owner: `POTENCY`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `POTENCY_SELECTED_THEORETICAL` | `INFO` | Selected potency is theoretical/configured. | `theoreticalDkhPerMl`, `chemical`, `concentrationGPerL`, `netVolumeL` |
| `POTENCY_SELECTED_LEARNED` | `INFO` | Selected potency is the learned pool median. | `learnedDkhPerMl`, `n`, `RDisp_P`, `confidence` |
| `POTENCY_THEORETICAL_INPUTS_UNAVAILABLE` | `REFUSAL` | Chemical, concentration or net volume missing. | `missingFields[]` |
| `POTENCY_REQUIRED` | `REFUSAL` | A dKH→mL conversion is unsupported without a valid potency. The required dKH movement may still be stated. | `requiredMovementDkh` |
| `POTENCY_LEARNING_CAPABILITY_GATED` | `INFO` | Empirical learning disabled pending its capture contract. | `missingCapabilities[]` |
| `POTENCY_SOLUTION_CONTEXT_UNAVAILABLE` | `GATING` | `M-2` missing; learner `NOT_RUN`. | — |
| `POTENCY_DELIVERY_CONTEXT_UNAVAILABLE` | `GATING` | `M-3` missing; learner `NOT_RUN`. | — |
| `POTENCY_PROGRAMMED_DOSE_STATE_UNCONFIRMED` | `GATING` | `M-9`: a pre/post programmed dose state is not confidently known. | `side` |
| `POTENCY_OBSERVATION_RECORDED` | `INFO` | An observation was computed and stored. | `observationId`, `P_i`, `deltaD`, `deltaS`, `snr`, `signalClass` |
| `POTENCY_SIGNAL_INELIGIBLE` | `INFO` | `SNR < 2.0`. | `snr`, `threshold: 2.0`, `minAttributableDeltaD` |
| `POTENCY_SIGNAL_DIAGNOSTIC_ONLY` | `INFO` | `2.0 ≤ SNR < 3.0`; stored, cannot move selected potency. | `snr` |
| `POTENCY_SIGNAL_CALIBRATION_ELIGIBLE` | `INFO` | `SNR ≥ 3.0`; enters the pool. | `snr` |
| `POTENCY_PLAUSIBILITY_HOLD` | `SAFETY` | Outside the 0.40–1.60 × expected envelope. | `P_i`, `P_expected`, `envelopeLow`, `envelopeHigh` |
| `POTENCY_REJECTED_NON_POSITIVE` | `INFO` | `P_i ≤ 0`. | `P_i` |
| `POTENCY_CONTEXT_DISCREPANCY` | `SAFETY` | Two most recent calibration-grade observations outside the envelope in the same direction. Verify Setup and delivery. | `observationIds[]`, `direction`, `P_expected` |
| `POTENCY_INELIGIBLE_CONTEXT_MISMATCH` | `INFO` | Solution or delivery context differs across the pre/post pair. | `preContextIds`, `postContextIds` |
| `POTENCY_INELIGIBLE_INTERRUPTED` | `INFO` | Source intervention was interrupted. | `interventionId` |
| `POTENCY_INELIGIBLE_CONSUMPTION_CONTEXT_CHANGE` | `INFO` | A recorded `CONSUMPTION_CONTEXT_CHANGE` falls inside the comparison. | `eventId`, `reasonCode` |
| `POTENCY_INELIGIBLE_SAFETY_RETURN_CONFOUND` | `INFO` | Response window overlaps a delivered safety return. | `interventionId` |
| `POTENCY_INELIGIBLE_CORRECTION_IN_WINDOW` | `INFO` | A deliberate correction shares the window; normalizable for trend, not calibration-clean. | `correctionId` |
| `POTENCY_INELIGIBLE_EVIDENCE_PER_SIDE` | `INFO` | A side has fewer than 3 genuine clusters or under a 4-day span. | `side`, `clusters`, `spanDays` |
| `POTENCY_CONFIDENCE_PROMOTED` | `INFO` | Confidence advanced. | `from`, `to`, `n`, `interventions`, `spanDays`, `RDisp_P` |
| `POTENCY_REASSESSING` | `SAFETY` | Two consecutive calibration-grade observations disagree by >15% in the same direction; prior selected potency retained. | `delta1`, `delta2`, `P_selected_old` |
| `POTENCY_CONFIDENCE_STATE_UNDETERMINED` | `GATING` | No ladder state's conditions are met. | `n`, `interventions`, `spanDays`, `RDisp_P`, `openIssue: OI-POTENCYSTATE-001` |
| `POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE` | `GATING` | `REASSESSING` detection `NOT_RUN`; the snapshot object is undefined. | `openIssue: OI-POTENCYSNAP-001` |
| `POTENCY_CONTEXT_CLOSED` | `INFO` | A new potency context opened; historical observations stay with the old one. | `oldContextId`, `newContextId`, `cause` |
| `POTENCY_REVISED_SINCE_PREDICTION` | `INFO` | Selected potency changed while a response window is open; the historical benchmark is unchanged. | `predictionPotency`, `currentPotency`, `interventionId` |
| `POTENCY_DISCREPANCY_BAND` | `INFO` | `M = P_learned / P_expected` band, wording only. | `M`, `band` |

## INTERVENTION_ — owner: `RESPONSE`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `INTERVENTION_CREATED` | `INFO` | A confirmed actual dose change created an intervention. | `interventionId`, `oldDose`, `newDose`, `actualStartTime`, `origin` |
| `INTERVENTION_ANCHOR_AMBIGUOUS` | `GATING` | A same-instant reading cannot be established as pre- or post-change. | `readingId`, `instant` |
| `INTERVENTION_INTERRUPTED` | `INFO` | A new change occurred before assessment. Not failed, not successful. | `interventionId`, `interruptedByInterventionId` |
| `INTERVENTION_INTERRUPTED_BY_SAFETY_RETURN` | `SAFETY` | A safety return began during an open attribution window. | `interventionId`, `safetyInterventionId` |
| `INTERVENTION_EXPIRED` | `INFO` | Calendar or evidence policy exceeded. | `interventionId`, `daysSinceStart` |
| `INTERVENTION_CONFLICTING_ACTIVE_STATES` | `REFUSAL` | Records imply two mutually exclusive current doses. Reconciliation required; nothing guessed. | `doseStateIds[]` |
| `INTERVENTION_EXTERNAL_CHANGE_KNOWN_TIME` | `INFO` | Late-entered external change with a known effective time; ledger amended, current analysis recomputed. | `doseStateId`, `effectiveAt` |
| `INTERVENTION_EXTERNAL_CHANGE_UNCERTAIN_TIME` | `GATING` | Late-entered change with an uncertain time; window confounded. | `doseStateId`, `earliestAt`, `latestAt` |
| `INTERVENTION_DOSE_HISTORY_CORRECTED` | `INFO` | Ledger corrected from the first defensible known time; dependent conclusions invalidated. | `doseStateId`, `invalidatedAssessmentIds[]` |
| `INTERVENTION_PREDICTION_SNAPSHOT_STORED` | `INFO` | Immutable prediction written. | `interventionId`, `expectedSlopeChange`, `predictedPostSlope`, `selectedPotencyAtPrediction` |
| `INTERVENTION_PREDICTION_SNAPSHOT_UNAVAILABLE` | `GATING` | Legacy intervention without a snapshot; causal response `NOT_RUN`. | `interventionId` |
| `INTERVENTION_PREDICTION_INPUT_LATER_CORRECTED` | `INFO` | A prediction input was later found wrong; the historical prediction is not rewritten. | `interventionId`, `field`, `oldValue`, `newValue` |

## RESPONSE_ — owner: `RESPONSE`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `RESPONSE_AWAITING_FORMAL_POST_SLOPE` | `INFO` | Day +2 state: one genuine post-change measurement; no formal class. | `interventionId`, `firstPostChangeIntervalSlope`, `predictedPostSlope` |
| `RESPONSE_PRECHANGE_EVIDENCE_INSUFFICIENT` | `GATING` | No ordinary sufficient pre-trend and no valid rapid basis. Terminal for this attribution. | `interventionId`, `preClusters`, `preSpanDays` |
| `RESPONSE_NOT_ATTRIBUTABLE_SMALL_SIGNAL` | `INFO` | `R_exp ≤ 1.28·sigma_pre`; the effect can never be isolated. Current-dose assessment continues. | `interventionId`, `R_exp`, `B_min`, `sigma_pre`, `deltaDose` |
| `RESPONSE_AWAITING_DETECTABILITY` | `INFO` | Attribution is possible but post precision is not yet sufficient. | `sigma_post`, `sigma_post_required`, `R_exp` |
| `RESPONSE_UNRESOLVED_EXPIRED` | `INFO` | Unresolved after the 14-day attribution horizon. | `interventionId`, `daysSinceStart: 14` |
| `RESPONSE_NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME` | `GATING` | The dose-change boundary time is unknown. | `doseStateId` |
| `RESPONSE_CONFOUNDED` | `GATING` | An unknown correction, water change or delivery event shares the window. | `confounders[]` |
| `RESPONSE_EXPECTED` | `INFO` | Detectably in the intended direction and compatible with the central prediction. | `R_obs`, `R_exp`, `B`, `S_pre`, `S_post`, `sigma_pre`, `sigma_post` |
| `RESPONSE_PARTIAL` | `INFO` | Detectable, in the intended direction, more than one band short. | same as above |
| `RESPONSE_NO_DETECTABLE_RESPONSE` | `INFO` | Shift not detectably different from zero and more than one band from prediction. | same as above |
| `RESPONSE_CONTRADICTORY` | `SAFETY` | Trajectory detectably shifted opposite the intended direction. No cause asserted. | same as above |
| `RESPONSE_OVER_RESPONSE` | `INFO` | Intended direction, exceeding prediction by more than one band. | same as above |
| `RESPONSE_INCONCLUSIVE` | `INFO` | Evidence cannot separate "as expected" from "no response". | same as above |
| `RESPONSE_PARTIAL_BAND_EMPTY` | `INFO` | `R_exp − B ≤ B`; no partial category can be separated. | `R_exp`, `B` |
| `RESPONSE_OVERSHOOT` | `SAFETY` | Latest measured level crossed the relevant target boundary in the undesired direction. Orthogonal to the response class. | `A_now`, `boundaryDkh`, `direction`, `interventionId` |
| `RESPONSE_OVERSHOOT_HORIZON_DERIVED` | `INFO` | The overshoot assessment horizon is derived, not stated by canon. | `openIssue: OI-OVERSHOOT-001` |
| `RESPONSE_MINIMUM_EXPOSURE_POLICY_UNAVAILABLE` | `INFO` | Exposure computed and stored; no Alk exposure gate exists. | `exposureFraction`, `openIssue: OI-EXPOSURE-001` |
| `RESPONSE_METRICS_DIAGNOSTIC_ONLY` | `INFO` | `E_response` / `R_response` recorded; they never classify. | `E_response`, `R_response` |

## MAINTENANCE_ — owner: `MAINTENANCE`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `MAINTENANCE_INCREASE_RECOMMENDED` | `INFO` | Supported deficit sized from `S_supported`. | `currentDose`, `recommendedDose`, `deltaDose`, `S_supported`, `P`, `predictedPostSlope` |
| `MAINTENANCE_DECREASE_RECOMMENDED` | `INFO` | Supported excess. | same as above |
| `MAINTENANCE_HOLD_STABLE` | `INFO` | Stable with adequate evidence; supply matches demand. | `S_observed: 0`, `S_supported: 0` |
| `MAINTENANCE_HOLD_UNCERTAINTY_LIMITED` | `GATING` | Non-zero lean, zero supported slope. | `S_observed`, `sigmaS`, `supportSubtraction` |
| `MAINTENANCE_HOLD_OUT_OF_RANGE_STABLE` | `INFO` | Out of range but stable; the level alone never changes maintenance. | `position`, `A_now`, `targetRange` |
| `MAINTENANCE_ACTUATOR_RESOLUTION` | `GATING` | Rounding returns the recommendation to the current dose. | `continuousCandidate`, `currentDose`, `increment` |
| `MAINTENANCE_STEP_CAP_ORDINARY` | `INFO` | 25% cap bound the change. | `uncappedDelta`, `cappedDelta`, `currentDose` |
| `MAINTENANCE_STEP_CAP_EXCEPTIONAL` | `SAFETY` | 50% cap unlocked by confirmed rapid movement plus outer-bound risk. | `uncappedDelta`, `cappedDelta`, `rapidBasis`, `outerBoundRisk`, `T_outerDays` |
| `MAINTENANCE_STEP_CAP_50_NOT_UNLOCKED` | `INFO` | Exceptional cap evaluated and refused. | `failedConditions[]` |
| `MAINTENANCE_BASELINE_ESTABLISHMENT` | `INFO` | `D_current < 4·R_pump`; the percentage cap is inactive. Not a rescue mode. | `currentDose`, `increment`, `threshold` |
| `MAINTENANCE_NON_NEGATIVE_CLAMP` | `INFO` | Candidate clamped to zero. | `uncappedCandidate` |
| `MAINTENANCE_INTERVENTION_LOCK` | `GATING` | An ordinary intervention is not yet assessable and the post-change regime is not independently sufficient. | `interventionId`, `phase`, `postClusters` |
| `MAINTENANCE_DEFERRED_BY_SAFETY_RETURN` | `SAFETY` | A safety return owns the intervention lock; the estimate is shown but not implemented. | `maintenanceEstimate`, `safetyInterventionId` |
| `MAINTENANCE_DEFERRED_BY_SAFETY_RAIL` | `SAFETY` | Combined intentional movement would exceed 0.50 dKH/day. Emitted alongside the above. | `safetyMovementDkh`, `maintenanceEffectDkh`, `railDkh: 0.50` |
| `MAINTENANCE_HOLD_TOWARD_RANGE` | `INFO` | Below range with a supported rise, or above range with a supported fall. Automatic maintenance does not oppose a supported trajectory already moving the level toward the preferred range. | `position`, `trajectory`, `S_observed`, `S_supported`, `maintenanceEstimate`, `forecastRangeEntryDays`, `ruleId: ALK-TOWARD-RANGE-HOLD-001` |
| `MAINTENANCE_NO_ACTION_FROM_BROKEN_MASS_BALANCE` | `SAFETY` | Negative or uninterpretable consumption cannot size a change; the accepted estimate is held. | `consumptionDkhPerDay`, `acceptedMaintenanceEstimate` |
| `MAINTENANCE_LIQUID_GUARD_EXCEEDED` | `REFUSAL` | A maintenance command would exceed the 2%/24 h liquid guard. The executable command is withheld and is **never** capped to the guard value, nor emitted equal to it. | `commandMl`, `guardMl`, `netVolumeL`, `checkedAt: CONTINUOUS \| POST_ROUNDING`, `ruleId: ALK-LIQUID-VOLUME-GUARD-001` |

## BRACKET_ — owner: `MAINTENANCE`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `BRACKET_CONSISTENT` | `INFO` | Historical dose-response agrees with the current recommendation. | `historicalDose`, `historicalOutcome`, `R_C` |
| `BRACKET_CONFLICT` | `INFO` | Historical bracket disagrees. Warns only; never vetoes. | `historicalDose`, `historicalOutcome`, `currentRecommendation`, `R_C` |
| `BRACKET_NOT_COMPARABLE` | `INFO` | `R_C > 0.25`, or consumption is zero/negative/uninterpretable. | `R_C`, `C_hist`, `C_estimate` |
| `BRACKET_NOT_RUN` | `INFO` | `M-10` provenance unavailable; core control continues. | — |

## RETURN_ — owner: `RETURN`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `RETURN_OFFER_AVAILABLE` | `INFO` | An opt-in return plan may be offered. | `aimPointLevelDkh`, `A_now`, `paces[]` |
| `RETURN_OFFER_NOT_ELIGIBLE_TRAJECTORY` | `INFO` | `returnPlanEligibleTrajectory` is false — evidence is `INSUFFICIENT`, or a supported non-zero trajectory is already moving the level. No offer. Maintenance is unaffected. | `movementEvidence`, `S_observed`, `S_supported`, `ruleId: ALK-RETURN-ELIGIBLE-TRAJECTORY-001` |
| `RETURN_PLAN_STARTED` | `INFO` | User opted in and implementation was logged. | `returnPlanId`, `S_plan`, `temporaryDose`, `predictedDurationDays`, `expiryAt` |
| `RETURN_PACE_LIMITED_BY_ZERO_DOSE` | `INFO` | Requested downward pace exceeds what zero dosing can achieve. | `requestedPace`, `achievablePace`, `C_estimate` |
| `RETURN_AIM_POINT_REACHED` | `INFO` | First measured reach or pass; temporary movement stops now. | `A_now`, `aimPointLevelDkh` |
| `RETURN_CONFIRMATION_PENDING` | `INFO` | Settlement confirmation outstanding; the temporary dose is not still running. | `arrivalZone` |
| `RETURN_ASSESSMENT_DUE` | `INFO` | Assessment point reached with no new test. Arrival must not be inferred. | `returnPlanId`, `dueAt` |
| `RETURN_EXPIRED_OVERRUN` | `GATING` | No valid assessment by `2·T_plan + 2` days. | `returnPlanId`, `expiryAt`, `T_plan` |
| `RETURN_STOP_PENDING_USER_ACTION` | `INFO` | Stopping is recommended; the app cannot assert the pump stopped. | `actualDoseState` |
| `RETURN_TERMINATED_BY_SAFETY_RETURN` | `SAFETY` | An in-flight plan met an outer-bound breach and is terminated, not suspended. Opposing intentional components are never layered. | `returnPlanId`, `safetyInterventionId`, `terminatedAt`, `ruleId: ALK-RETURN-TERMINATED-BY-SAFETY-001` |
| `RETURN_NO_AUTOMATIC_RESUME_AFTER_SAFETY` | `INFO` | A terminated plan cannot resume automatically. A new plan needs fresh eligibility and a fresh opt-in. | `terminatedReturnPlanId`, `safetyInterventionId` |
| `RETURN_INTENTIONAL_MOVEMENT_NOT_MAINTENANCE_MISMATCH` | `INFO` | The plan's intentional trajectory is not evidence that maintenance is wrong. | `returnPlanId`, `S_plan` |

## SAFETY_ — owner: `SAFETY`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `SAFETY_OUTER_BOUND_BREACHED_LOW` | `SAFETY` | `A_now < outerMin`. | `A_now`, `outerMin`, `safetyDestinationDkh` |
| `SAFETY_OUTER_BOUND_BREACHED_HIGH` | `SAFETY` | `A_now > outerMax`. | `A_now`, `outerMax`, `safetyDestinationDkh` |
| `SAFETY_RECOVERING_INSIDE_BOUND` | `SAFETY` | Back inside the raw bound but not yet at the buffered destination. | `A_now`, `safetyDestinationDkh` |
| `SAFETY_RETURN_ACTIVE` | `SAFETY` | Urgent temporary safety return in progress. | `interventionId`, `desiredMovementDkh`, `correctionVolumeMl?` |
| `SAFETY_RETURN_COMPLETE` | `INFO` | Buffered destination reached; ordinary sequencing resumes. | `A_now`, `safetyDestinationDkh` |
| `SAFETY_CORRECTION_ACTIONABLE_WITHOUT_INCREMENT` | `INFO` | One-off safety volume emitted although the maintenance increment is missing. | `correctionVolumeMl`, `P` |
| `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE` | `SAFETY` | Above `outerMax` with a `C_estimate` unusable for sizing on either side of the materiality boundary. The temporary safety rate is `max(0, D_established − R_down / P_selected)`. Not a maintenance estimate. | `A_now`, `outerMax`, `A_safe_high`, `rDownDkh`, `establishedDoseMlPerDay`, `P_selected`, `temporarySafetyRateAdvisoryMlPerDay`, `maintenanceEstimateStatus: UNRESOLVED`, `ruleId: ALK-HIGH-BREACH-SAFETY-SIZING-001` |
| `SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO` | `SAFETY` | The sized temporary safety rate reached the zero floor because the established contribution could not absorb `R_down`. Zero is a floor, never a classification's choice. | `rDownDkh`, `rDownAsDoseMlPerDay`, `establishedDoseMlPerDay`, `ruleId: ALK-HIGH-BREACH-SAFETY-SIZING-001` |
| `SAFETY_HIGH_BREACH_CONSUMPTION_INTERPRETABLE` | `SAFETY` | Above `outerMax` with `C_estimate >= 0`; the temporary safety **rate** is sized from consumption rather than from the established-dose contribution. | `consumptionDkhPerDay`, `R_down`, `S_safety` |
| `SAFETY_HIGH_BREACH_SLOWER_DECLINE` | `INFO` | Zero dosing cannot achieve the desired decline; the achievable rate is reported. | `desiredRate`, `achievableRate`, `C_estimate` |
| `SAFETY_RATE_RAIL_APPLIED` | `SAFETY` | 0.50 dKH/day physical-effect rail bound the change. | `uncappedEffect`, `railDkhPerDay: 0.50`, `cappedDeltaDose` |
| `SAFETY_COMPOSITE_RAIL_APPLIED` | `SAFETY` | Combined intentional movement clamped to the rail. | `components[]`, `combinedDkh` |
| `SAFETY_LIQUID_GUARD_APPLIED` | `SAFETY` | The 2%/24 h liquid guard lengthened or staged the execution. | `requestedMl`, `guardMl`, `stagedDays` |
| `SAFETY_LIQUID_GUARD_EXCEEDED` | `REFUSAL` | An engine-generated 24 h delivery exceeds the guard and no staging is available; the executable command is withheld, never capped to the guard. | `commandMl`, `guardMl`, `netVolumeL`, `checkedAfterRounding: true` |
| `SAFETY_MG_GATE_OVERRIDDEN` | `SAFETY` | Mg is alert-low; the Alk safety return proceeds and the Mg condition is surfaced. | `magnesiumGateState` |
| `SAFETY_MG_GATE_UNKNOWN` | `INFO` | `magnesiumGateState = UNKNOWN`; safety return proceeds, no low-Mg condition invented. | `magnesiumGateState: UNKNOWN` |
| `SAFETY_INTERVENTION_LOCK_HELD` | `SAFETY` | The safety return owns the lock on new Alk actuator changes. | `lockOwner` |
| `SAFETY_TEMP_RATE_ADVISORY_EMITTED` | `SAFETY` | The exact temporary high-breach safety rate is emitted as an **advisory** rate while the actuator increment is unavailable. The executable rounded pump command is separately `NOT_RUN`. | `temporarySafetyRateAdvisoryMlPerDay`, `S_safety`, `safetyDestinationDkh`, `pumpCommandState: NOT_RUN`, `ruleId: ALK-SAFETY-TEMP-RATE-RESOLUTION-001` |

## RETEST_ — owner: `RETEST`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `RETEST_REPEAT_NOW` | `SAFETY` | Immediate repeat outranks ordinary scheduling. | `cause` |
| `RETEST_SAFETY_RETURN_ACTIVE` | `SAFETY` | ~24 h safety cadence. | `anchorAt`, `recommendedAt` |
| `RETEST_HIGH_BREACH_FAILSAFE` | `SAFETY` | ~24 h following a high-breach temporary safety-rate recommendation, including the case where that rate floors at zero. | `recommendedAt` |
| `RETEST_EPISODE_CONTESTED` | `SAFETY` | The latest episode is contested; an immediate repeat is requested through the existing Part II §48 / `ALK-051` machinery. | `episodeId`, `methods[]`, `ruleId: ALK-EPISODE-RESOLUTION-001` |
| `RETEST_RAPID_MOVEMENT` | `SAFETY` | ~24 h following confirmed rapid movement. | `recommendedAt` |
| `RETEST_POST_CHANGE_FIRST` | `INFO` | ~48 h after the actual dose change. | `interventionId`, `recommendedAt` |
| `RETEST_POST_CHANGE_SECOND` | `INFO` | ~48 h after the first post-change test. | `interventionId`, `recommendedAt` |
| `RETEST_RETURN_PLAN_ASSESSMENT` | `INFO` | Plan assessment or expiry point. | `returnPlanId`, `recommendedAt` |
| `RETEST_ROUTINE_CADENCE` | `INFO` | 48-hour ordinary cadence. | `recommendedAt` |
| `RETEST_EVIDENCE_BUILDING` | `INFO` | Next test needed to reach the ordinary minimum. | `clustersNeeded`, `spanNeededDays`, `recommendedAt` |
| `RETEST_DETECTABILITY_POLICY_UNAVAILABLE` | `INFO` | `T_detect` candidate canonically `NOT_RUN`; Freeze 5 declined to invent `K_detect`. | `ruleId: ALK-RETEST-SCHEDULER-001` |
| `RETEST_SIGNAL_ACCUMULATION` | `INFO` | Confidence-building candidate selected: `T_signal = max(1 day, 0.10 / \|S_supported\|)`. The floor is part of this candidate's formula, not a separate clamp. | `sSupportedDkhPerDay`, `rawTSignalDays`, `tSignalDays`, `recommendedAt` |
| `RETEST_SIGNAL_ACCUMULATION_NOT_RUN` | `INFO` | `T_signal` candidate `NOT_RUN` because `S_supported = 0` or movement evidence is `INSUFFICIENT`. | `sSupportedDkhPerDay`, `movementEvidence` |
| `RETEST_FORECAST_BOUNDARY_RISK` | `SAFETY` | Testing scheduled before a projected outer-bound crossing, targeting the 24 h safety lead. `T_boundary <= 0` returns test-now semantics. Not submitted once the level is already breached. | `T_outerDays`, `T_boundaryDays`, `boundSide`, `recommendedAt` |
| `RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE` | `INFO` | The return-plan arrival-check candidate is canonically `NOT_RUN`; ordinary, rapid, safety and expiry candidates continue. | `returnPlanId`, `ruleId: ALK-RETEST-SCHEDULER-001` |
| `RETEST_SIGNAL_FLOOR_APPLIED` | `INFO` | The ordinary signal candidate's 24 h floor bound: `T_signal = max(1 day, 0.10 / |S_supported|)`. Applies to that candidate only; rapid, outer-bound, safety and repeat-now candidates are exempt. | `rawTSignalHours`, `flooredHours: 24`, `sSupportedDkhPerDay` |
| `RETEST_OBSERVATION_CEILING_APPLIED` | `INFO` | An ordinary observation candidate was clamped down to the ~Day-4 window. | `rawCandidateHours`, `ceilingHours: 96` |

## CAPABILITY_ — owner: `CAPABILITY`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `CAPABILITY_ACTUATOR_INCREMENT_REQUIRED` | `REFUSAL` | `M-1`: no final maintenance mL/day without the increment. Slopes and the continuous candidate are still emitted. No 0.1 default. | `continuousActionCandidate` |
| `CAPABILITY_SOLUTION_CONTEXT_MISSING` | `GATING` | `M-2`. | — |
| `CAPABILITY_DELIVERY_CONTEXT_MISSING` | `GATING` | `M-3`. | — |
| `CAPABILITY_REPLACEMENT_WATER_ALK_MISSING` | `INFO` | `M-4`: degrade to the deterministic unknown-WC branch. | `waterChangeId` |
| `CAPABILITY_DOSE_EFFECTIVE_TIME_UNCERTAIN` | `GATING` | `M-5`. | `doseStateId` |
| `CAPABILITY_DELIVERED_VOLUME_UNAVAILABLE` | `GATING` | `M-6`: mixed integration `NOT_RUN`; segmenting instead. | `intervalFromAt`, `intervalToAt` |
| `CAPABILITY_PREDICTION_SNAPSHOT_MISSING` | `GATING` | `M-7`. | `interventionId` |
| `CAPABILITY_MEASUREMENT_TIME_IMPRECISE` | `GATING` | `M-8`: degrade to position/history. | `readingId` |
| `CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED` | `GATING` | `M-9`. | `side` |
| `CAPABILITY_HISTORICAL_BRACKET_UNAVAILABLE` | `INFO` | `M-10`. | — |
| `CAPABILITY_MAGNESIUM_STATE_UNKNOWN` | `INFO` | `M-11`: Alk safety still runs; no low-Mg warning invented. | — |
| `CAPABILITY_HISTORICAL_CONFIGURATION_UNAVAILABLE` | `REFUSAL` | `M-12`: config-dependent replay before the first proven version. | `requestedAt` |
| `CAPABILITY_ABSOLUTE_TIME_UNAVAILABLE` | `GATING` | `M-13`. | `readingIds[]` |
| `CAPABILITY_POTENCY_LEARNER_GATED` | `INFO` | Empirical learning disabled by the capability gate. | `missingCapabilities[]` |

## OUTPUT_ — owner: `OUTPUT`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `OUTPUT_CONFIDENCE_UNSPECIFIED` | `INFO` | `recommendationConfidence = UNSPECIFIED` by frozen decision; no numeric classification exists and none may be invented. The evidence facts below are surfaced in its place. | `independentClusters`, `spanDays`, `sigmaS`, `supportRatio?`, `confounders[]`, `potencyConfidence`, `deliveryBasis`, `ruleId: ALK-CONFIDENCE-OUTPUT-001` |
| `OUTPUT_INSUFFICIENT_DATA_ACTIONABLE` | `GATING` | Insufficiency stated with what is missing and when the next useful test is. | `missing[]`, `nextUsefulTestAt`, `currentValueDkh` |
| `OUTPUT_HOLD_IS_A_RECOMMENDATION` | `INFO` | HOLD is a full recommendation, not a failure to answer. | `holdReasons[]` |

## AUDIT_ — owner: `AUDIT`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `AUDIT_TRACE_WRITTEN` | `INFO` | Trace persisted for this assessment. | `auditTraceId` |
| `AUDIT_HISTORICAL_ASSESSMENT_PRESERVED` | `INFO` | A backdated edit created a new assessment; the historical record is unchanged. | `newAssessmentId`, `preservedAssessmentIds[]` |
| `AUDIT_REPLAY_DETERMINISTIC` | `INFO` | Replay reproduced the stored result exactly. | `assessmentId`, `asOf` |

## PRESENTATION_ — owner: `PRESENTATION`

Emitted by the presentation adapter as *rendering* requirements. They never alter domain
output.

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `PRESENTATION_SMALL_SIGNAL_CARD_REQUIRED` | `INFO` | Full card must carry the mandatory small-signal attribution structure and must not lead with "not attributable". | `interventionId`, `branch: HOLD\|RESIDUAL_DEFICIT` |
| `PRESENTATION_NO_CAUSAL_WORKING_CLAIM` | `INFO` | Directional consistency may be described; "the dose change is working" is forbidden before a formal favourable class. | `responseAttribution` |
| `PRESENTATION_FORBIDDEN_WORD_STILL` | `INFO` | "Still falling" is forbidden where causal continuity was not established. | `responseAttribution` |
| `PRESENTATION_OUTER_BOUND_REGISTER` | `INFO` | Alert wording register; never the words "safe" or "unsafe". | `outerBoundState` |
| `PRESENTATION_INFORM_AND_PROCEED` | `INFO` | Name the unresolved issue, give the valid recommendation, no shaming, no lockout. | `unresolvedIssue` |

## MIGRATION_ — owner: `CAPABILITY`

| Code | Sev | Meaning | Payload |
|---|---|---|---|
| `MIGRATION_ALK_ONLY_RUNTIME` | `INFO` | Alk controller active; Ca/Mg measurement-only. | `enabledControllers[]` |
| `MIGRATION_CA_MG_INERT` | `INFO` | Ca/Mg readings stored as facts; no trend, evidence, advice, schedule or notification. | `parameter`, `readingId` |
| `MIGRATION_MG_GATE_ISOLATED` | `INFO` | `magnesiumGateState = UNKNOWN` regardless of the latest logged Mg value. | `latestMgValue?` |
| `MIGRATION_HISTORICAL_ANALYSIS_INELIGIBLE` | `REFUSAL` | Legacy records lack the dose/intervention context this analysis requires. | `analysis`, `periodFrom`, `periodTo` |

---

## Coverage summary

| Group | Codes |
|---|---|
| `VALIDATION_` | 16 |
| `TIME_` | 6 |
| `CONFIG_` | 4 |
| `CLUSTER_` | 5 |
| `EPISODE_` | 5 |
| `SEGMENT_` | 21 |
| `DELIVERY_` | 5 |
| `EVIDENCE_` | 10 |
| `TRAJECTORY_` | 8 |
| `UNCERTAINTY_` | 5 |
| `CONSUMPTION_` | 8 |
| `POTENCY_` | 28 |
| `INTERVENTION_` | 12 |
| `RESPONSE_` | 18 |
| `MAINTENANCE_` | 17 |
| `BRACKET_` | 4 |
| `RETURN_` | 12 |
| `SAFETY_` | 18 |
| `RETEST_` | 17 |
| `CAPABILITY_` | 14 |
| `OUTPUT_` | 3 |
| `AUDIT_` | 3 |
| `PRESENTATION_` | 5 |
| `MIGRATION_` | 4 |
| **Total** | **248** |

---

## Retired by `ALK_V2_FREEZE_5`

These codes existed only because a canon defect blocked an output. Freeze 5 determined the
behaviour, so the code has no reachable state and is removed from the closed set. History is
kept here rather than deleted; an engine that still emits a retired code is a conformance
failure.

| Retired code | Replaced by | Freeze-5 decision |
|---|---|---|
| `EVIDENCE_INDEPENDENT_SELECTION_UNDEFINED` | `EVIDENCE_INDEPENDENT_SELECTION_APPLIED` | F5-01 |
| `EVIDENCE_INDEPENDENT_SELECTION_TIE_UNRESOLVED` | F5-14 removed the tie by pooling rather than by choosing, emitting `CLUSTER_SAME_TIMESTAMP_COALESCED`, **itself retired by owner decision 17**; the live replacements are `EPISODE_MEASUREMENTS_POOLED` for a same-method episode and `EPISODE_CONTESTED_METHODS` where the episode cannot be resolved | F5-14, 17 |
| `VALIDATION_SUSPICION_THRESHOLD_UNAVAILABLE` | `VALIDATION_SUSPICION_DETECTION_NOT_RUN` (renamed: the state is decided, not unavailable) | F5-02 |
| `CONSUMPTION_NEGATIVE_MATERIALITY_UNDEFINED` | `CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED` | F5-03 |
| `SAFETY_HIGH_BREACH_MATERIALITY_UNDEFINED` | at Freeze 5: `SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE` (material branch), `SAFETY_HIGH_BREACH_CONSUMPTION_INTERPRETABLE` (`C >= 0`), `SAFETY_HIGH_BREACH_NO_PAUSE_UNCERTAINTY_LIMITED` (negative, not material). **Both of those first two replacements were themselves retired by owner decision 16**; the live replacements are `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE` on either negative branch and `SAFETY_HIGH_BREACH_CONSUMPTION_INTERPRETABLE` at `C >= 0` | F5-03, F5-13, 16 |
| `SAFETY_HIGH_BREACH_NARROW_BAND_UNDETERMINED` | F5-13 determined the band with `SAFETY_HIGH_BREACH_NO_PAUSE_UNCERTAINTY_LIMITED`, **itself retired by owner decision 16**; the live replacements are `CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED` for the classification and `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE` for the delivered rate | F5-13, 16 |
| `RETURN_ELIGIBILITY_STABILITY_DEFINITION_UNDEFINED` | `RETURN_OFFER_AVAILABLE` / `RETURN_OFFER_NOT_ELIGIBLE_TRAJECTORY` | F5-04 |
| `MAINTENANCE_MATRIX_CELL_UNDETERMINED` | `MAINTENANCE_HOLD_TOWARD_RANGE` | F5-05 |
| `MAINTENANCE_LIQUID_GUARD_SCOPE_UNDEFINED` | `MAINTENANCE_LIQUID_GUARD_EXCEEDED` | F5-06 |
| `SAFETY_LIQUID_GUARD_SCOPE_UNDEFINED` | `SAFETY_LIQUID_GUARD_EXCEEDED` | F5-06 |
| `RETURN_SUSPENDED_BY_SAFETY_RETURN` | `RETURN_TERMINATED_BY_SAFETY_RETURN` + `RETURN_NO_AUTOMATIC_RESUME_AFTER_SAFETY` | F5-08 |
| `RETEST_CONFIDENCE_BUILDING_POLICY_UNAVAILABLE` | `RETEST_SIGNAL_ACCUMULATION` / `RETEST_SIGNAL_ACCUMULATION_NOT_RUN` | F5-09 |
| `RETEST_BOUNDARY_MARGIN_UNAVAILABLE` | `RETEST_FORECAST_BOUNDARY_RISK` | F5-09 |
| `RETEST_OBSERVATION_FLOOR_APPLIED` | `RETEST_SIGNAL_FLOOR_APPLIED` — F5-15 puts a 24 h floor inside the signal candidate's own formula rather than clamping ordinary observation generally | F5-09, F5-15 |
| `RETEST_MINIMUM_INTERVAL_UNAVAILABLE` | `RETEST_SIGNAL_FLOOR_APPLIED`. `T_signal` was the only ordinary candidate that could fall below 24 h, so Part II §66's minimum useful interval is supplied where it was reachable | F5-15 |
| `SEGMENT_WC_CONFIDENCE_TIER_UNDEFINED` | `SEGMENT_WC_CONFIDENCE_TIER_NOT_NORMALIZABLE` | F5-10 |
| `SAFETY_ACTUATOR_INCREMENT_REQUIRED_SAFETY_RATE_UNDEFINED` | `SAFETY_TEMP_RATE_ADVISORY_EMITTED` + `CAPABILITY_ACTUATOR_INCREMENT_REQUIRED` | F5-11 |
| `OUTPUT_CONFIDENCE_DERIVATION_UNAVAILABLE` | `OUTPUT_CONFIDENCE_UNSPECIFIED` (renamed: `UNSPECIFIED` is the decided value). `ALK-071` names the new code. | F5-12 |

### Retired by owner decisions 16–19

| Retired code | Replaced by | Decision |
|---|---|---|
| `SAFETY_HIGH_BREACH_ZERO_DOSE_PAUSE` | `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE`, and `SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO` where the rate reaches zero — decision 16 makes zero a floor rather than a chosen pause | 16 |
| `SAFETY_HIGH_BREACH_NO_PAUSE_UNCERTAINTY_LIMITED` | `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE`; the maintenance-side classification is carried by `CONSUMPTION_NEGATIVE_UNCERTAINTY_LIMITED`, which is unchanged | 16 |
| `CLUSTER_SAME_TIMESTAMP_COALESCED` | `EPISODE_MEASUREMENTS_POOLED` — decision 17 makes membership the testing episode rather than an identical timestamp, and forbids pooling across incompatible methods | 17 |

`EVIDENCE_INDEPENDENT_SELECTION_TIE_UNRESOLVED` remains retired. Its Freeze-5 replacement
was `CLUSTER_SAME_TIMESTAMP_COALESCED`; that replacement is now
`EPISODE_MEASUREMENTS_POOLED` for a same-method episode and `EPISODE_CONTESTED_METHODS`
where the episode cannot be resolved.

Two `RETEST_` codes are **kept**, with their meaning changed from "policy absent" to
"canonically `NOT_RUN`": `RETEST_DETECTABILITY_POLICY_UNAVAILABLE` and
`RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE`.

A code listed here is retired **as an emitted code**. Where a Freeze-5 decision turned out
to leave a narrow question open, the replacement column names the code that now covers the
open part — a refusal under a precise name, not a reinstatement of the vague one.

---

## Appendix — canon enum values that share a reason-code prefix

A mechanical checker that scans for `PREFIX_`-shaped tokens will find these. They are
**canon vocabulary, not reason codes**, and must not be added to the catalogue or reported
as uncatalogued codes.

| Token | What it actually is | Canon source |
|---|---|---|
| `SAFETY_RETURN` | an `interventionType` value | `ALK-OUTER-BOUND-ACTION-001` |
| `SAFETY_RETURN_CORRECTION` | an event kind | `WG-ALK-059` |
| `SAFETY_RETURN_CONFOUND` | a potency ineligibility reason | `ALK-SAFETY-RETURN-INTEGRATION-001` §4 |
| `UNCERTAINTY_LIMITED` | a `movementEvidence` value | `ALK-MOVEMENT-001` |
| `CONSUMPTION_CONTEXT_CHANGE` | a confounder classification | `SHARED-CONSUMPTION-CONTEXT-001` |
| `CONSUMPTION_CONTEXT_EVENT` | an event type | `SHARED-CONSUMPTION-CONTEXT-001` |
| `DELIVERY_ANOMALY` | an event kind | Part I §9.6 |
| `CAPABILITY_GATED` | a `featureState` value | `ALK-POTENCY-CAPABILITY-GATE-001` |

A checker should therefore match reason codes by their table position (code + severity),
not by prefix alone. This collision is a property of the canon's naming, not a defect;
it is recorded so the same false positive is not investigated twice.
