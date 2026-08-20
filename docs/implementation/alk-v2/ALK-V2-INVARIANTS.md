# ALK V2 — INVARIANTS

Machine-testable properties that must hold for **every** valid input, not merely for the
fixture corpus. Each is stated as a property with a generator, so it can be executed as a
property test rather than a single golden.

Format: **ID — statement / canon basis / generator / assertion / negative control**.
The negative control is the deliberate mutation that must make the test fail. Canon
`CORE-CANON-COVERAGE-001` item 9 requires a demonstrated negative control before a checker
is trusted as a gate; the same discipline is applied here.

Fixture bodies for the canon-named invariants are in
`fixtures/invariants-and-governance.json`.

---

## Group A — Determinism and replay

### INV-A1 — Same valid inputs and configuration produce identical output
- **Canon:** Part II §64; `ALK-G040`; `WG-ALK-040`.
- **Generator:** any ledger; shuffle the input event array preserving instants; vary host
  locale, host timezone and viewer display timezone; run twice in one process and once in
  a fresh process.
- **Assert:** `EngineResult` and `AuditTrace` are byte-identical across all runs.
- **Negative control:** sort events by insertion order instead of
  `(absoluteInstant, eventOrdinal, eventId)`; the test must fail.

### INV-A2 — No function reads a clock
- **Canon:** Part II §64 ("current-clock dependence without explicit `asOf`").
- **Generator:** static check plus a runtime harness that advances the system clock by
  30 days between two evaluations of the same `(ledger, config, asOf)`.
- **Assert:** identical output; no domain module references a now/current-time API.
- **Negative control:** default one `asOf` parameter to the system time.

### INV-A3 — No unseeded randomness or iteration-order dependence
- **Canon:** Part II §64.
- **Generator:** re-run with reversed map/set iteration where the platform permits.
- **Assert:** identical output.

### INV-A4 — Display rounding never changes classification, trend or dose
- **Canon:** Part II §2.3; `ALK-002`.
- **Generator:** store values at full precision (e.g. 8.849) and render at 1 d.p.
- **Assert:** position, trend, consumption and response identical whether or not a display
  formatter has run.
- **Negative control:** round `rawValueDkh` to the display precision at ingest.

---

## Group B — Layer separation

### INV-B1 — Automatic maintenance never intentionally moves the level
- **Canon:** `CORE-STABILISE-001`; `ALK-024`; Part I §5.1.
- **Generator:** every combination of `Position × Trajectory` with sufficient evidence and
  no active plan and no outer-bound breach.
- **Assert:** the recommended dose is a function of `(D_current, S_supported, P_selected)`
  and the constraint chain only. It is **independent of the distance from the target
  range**: holding those three fixed while varying the target range must not change
  `recommendedDoseMlPerDay`.
- **Negative control:** add any term proportional to `(aimPoint − A_now)` to the
  maintenance dose.

### INV-B2 — The supported slope never leaks into physical or risk quantities
- **Canon:** `ALK-CONSUMPTION-ESTIMATE-001`; `ALK-FORECAST-SLOPE-001`; `AUDIT-007`.
- **Generator:** any case where `S_supported ≠ S_observed`.
- **Assert:** `consumptionDkhPerDay` and every forecast crossing time are computed from
  `S_observed`; substituting `S_supported` changes them (proving they do not already
  use it).
- **Negative control:** compute `C = P·D − S_supported`; `WG-ALK-013` and `WG-ALK-042/043`
  must fail.

### INV-B3 — Position is never a fitted value
- **Canon:** `CORE-POSITION-001`; `ALK-010`; Part I §57 item 1.
- **Generator:** any series where the Theil–Sen fitted endpoint differs from the latest
  cluster value (e.g. `ALK-043`: latest 8.95, fitted 8.78).
- **Assert:** `position` and `overshoot` derive from the latest valid **cluster
  representative** value.
- **Negative control:** use `Â(t_last)`; `ALK-G016` must fail.

### INV-B4 — Presentation cannot alter a domain recommendation
- **Canon:** `CORE-SOURCE-001`; `X-INV-004`; Part I §45, §50.
- **Generator:** static dependency graph.
- **Assert:** no presentation module imports any function from `TREND`, `UNCERTAINTY`,
  `SUPPORT`, `CONSUMPTION`, `MAINTENANCE`, `RESPONSE`, `SAFETY`, `RETEST` or `POTENCY`.
  Presentation's only input is `EngineResult`, and it has no write path back.
- **Negative control:** recompute a slope inside a card module.

### INV-B5 — Confidence is a label with no arithmetic path
- **Canon:** `ALK-CONFIDENCE-OUTPUT-001`; `X-INV-010`; `INV-ALK-CONFIDENCE-001`; `AD-OUT-001`.
- **Generator:** fix all numeric inputs; vary `recommendationConfidence` over
  `{LOW, MODERATE, HIGH, UNSPECIFIED}`.
- **Assert:** `recommendedDoseMlPerDay` identical in all cases. The emitted value is always
  `UNSPECIFIED` (`ALK-CONFIDENCE-OUTPUT-001` as frozen by `ALK_V2_FREEZE_5`); the other
  three exist only as mutations for this test.
- **Negative control:** multiply the continuous candidate by a confidence-derived factor;
  `AD-OUT-001` and `INV-ALK-CONFIDENCE-001` must fail.

### INV-B6 — No staging or confidence multiplier exists
- **Canon:** `ALK-STAGING-001`; `X-INV-008`; `ALK-072` item 8.
- **Assert:** no constant in `{1.00, 0.90, 0.75, 0.70, 0.55}` appears as a multiplier
  anywhere in the maintenance pipeline; no raw-mL magnitude band exists.

### INV-B7 — Dimension safety
- **Canon:** `ALK-VARIABLE-SEMANTICS-001`; Part I §44; `X-INV-009`.
- **Assert:** every numeric field carries exactly one dimension across every state; the
  seven `ALK-069A` quantities exist as seven distinct named fields; no field named
  `target`, `slope`, `consumption` or `maintenanceDose` carries a state-dependent meaning.
- **Negative control:** merge `maintenanceEstimate` and `continuousActionCandidate`.

---

## Group C — Evidence integrity

### INV-C1 — Repeats never increase independent observation count
- **Canon:** Part II §5, §6, §72 item 1; `ALK-005`; Part I §57 item 4.
- **Generator:** take any passing series; append 1–10 additional readings within 30 minutes
  of an existing one.
- **Assert:** `independentClusters` is unchanged; `movementEvidence` never improves;
  `sigma_S` never falls as a result.
- **Negative control:** count raw readings instead of clusters; `WG-ALK-049` must fail.

### INV-C2 — Repeat uncertainty is never divided by √n
- **Canon:** Part II §5.6.
- **Assert:** `sigmaCluster ≥ SIGMA_ALK_BASE` for every cluster regardless of member count.

### INV-C3 — The lookback is never extended because evidence is sparse
- **Canon:** `ALK-007`; Part II §1.3, §17; `WG-ALK-049`.
- **Generator:** series whose third-newest cluster is 15–60 days old.
- **Assert:** result is `INSUFFICIENT`; the segment never starts earlier than
  `asOf − 14 days`; no older segment is substituted.
- **Negative control:** widen the window until three clusters are found.

### INV-C4 — Evidence never crosses an incompatible intervention boundary
- **Canon:** Part I §57 item 3; Part II §13, §14; `ALK-007`; `WG-ALK-016`.
- **Generator:** insert each boundary event type at a random instant inside an otherwise
  clean window.
- **Assert:** for every hard boundary, the current-control segment starts at or after it;
  no fitted slope spans two dose contexts.
- **Negative control:** ignore dose changes when building segments.

### INV-C5 — Moving a dose-change timestamp changes only analyses that physically cross it
- **Canon:** Part II §72 item 3.
- **Generator:** shift `effectiveAt` within a window containing no measurement.
- **Assert:** results identical; shifting it across a measurement changes the segment.

### INV-C6 — The pre-change anchor never becomes a post-change observation
- **Canon:** Part II §31, §72 item 4; `ALK-017`.
- **Assert:** for every intervention, `postClusterIds` excludes the anchor; the post-change
  cluster count never includes it; earliest post-change ordinary sufficiency is the third
  genuine post-change cluster.
- **Negative control:** include the anchor; `WG-ALK-007` and `WG-ALK-008` must fail.

### INV-C7 — No zero-time pairwise slope, and duplicate-time clusters never survive
- **Canon:** Part II §19.6, §72 item 9.
- **Assert:** every pairwise slope has `t_j > t_i`; if merging duplicates leaves fewer than
  three eligible clusters, the result is `INSUFFICIENT` rather than a fit over fragments.

### INV-C8 — An unresolved latest anomaly cannot be silently excluded to produce a dose change
- **Canon:** Part II §48, §72 item 7; `ALK-051`.
- **Generator:** mark the latest cluster `SUSPECT` or `ANOMALOUS`.
- **Assert:** ordinary dose escalation or reversal is withheld and a repeat is
  recommended; the cluster is not dropped from the series.

### INV-C9 — Theil–Sen is invariant to input ordering after sorting
- **Canon:** Part II §72 item 8.
- **Assert:** shuffling the input array does not change the slope, intercept, residuals or
  `sigma_S`.

### INV-C10 — `sigma_point` is never below the analytical floor
- **Canon:** `ALK-SLOPE-UNCERTAINTY-001`.
- **Assert:** `sigmaPointDkh ≥ 0.10` for every trend, including perfectly linear data.
- **Negative control:** drop the `max()`; `WG-ALK-001` and `WG-ALK-062` must fail.

### INV-C11 — Pairwise-slope MAD never enters action sizing
- **Canon:** Part II §19.5.
- **Assert:** `sigma_S` is a function of `(sigma_point, Sxx)` only; injecting a large
  pairwise MAD does not change `S_supported`.

---

## Group D — Consumption and maintenance

### INV-D1 — Unexplained negative consumption never creates an automatic maintenance reduction
- **Canon:** `ALK-NEGATIVE-CONSUMPTION-001`; `ALK-031`; `WG-ALK-013`; `AUDIT-019`.
- **Generator:** sweep `P·D` and `S_observed` so that `C < 0` across magnitudes, positions
  and trajectories, including above range and rising.
- **Assert:** `recommendedDoseMlPerDay == currentDoseMlPerDay` on every such case; the
  negative value never appears in any dose arithmetic; it is never clamped to zero and then
  used as a maintenance target. This holds on **both** branches of
  `ALK-NEGATIVE-MATERIALITY-001`, so the maintenance outcome does not vary across the
  materiality boundary.
- **Negative control:** clamp `C` to 0 and size a dose from it; `WG-ALK-013` and
  `ALK-G028` must fail.

### INV-D2 — A stable out-of-range level alone never changes maintenance
- **Canon:** `ALK-024`; `ALK-RETURN-ELIGIBLE-TRAJECTORY-001`; `WG-ALK-014`; `WG-ALK-034`;
  `ALK-073` item 4.
- **Generator:** stable series at levels spanning `outerMin … outerMax`.
- **Assert:** while inside the outer envelope, `recommendedDose == currentDose` for every
  level. Symmetric above and below.
- **Negative control:** add a level-proportional term; both fixtures must fail.

### INV-D3 — Upper and lower behaviour is symmetric absent an explicit safety exception
- **Canon:** `CORE-STABILISE-001`; Round-2 acceptance rule.
- **Generator:** for each fixture, construct the mirror by reflecting values about the
  target-range midpoint and negating slopes.
- **Assert:** the mirrored result equals the mirrored expectation, except where an
  explicit `ALK-` rule defines an asymmetry (`ALK-003A` high breach, which cannot deliver
  a negative correction, and `ALK-HIGH-BREACH-UNRESOLVED-001`).

### INV-D4 — Maintenance is sized from the supported slope, never the observed slope
- **Canon:** `ALK-044`; `ALK-MAINTENANCE-SEMANTICS-001`.
- **Assert:** `continuousActionCandidate = D_current − S_supported/P` exactly;
  `maintenanceEstimate = D_current − S_observed/P` exactly; the two are distinct fields.

### INV-D5 — The empirical bracket never changes the number
- **Canon:** `ALK-032`; `ALK-072` item 11; `AUDIT-023`; `WG-ALK-054`.
- **Generator:** vary the historical bracket across `{absent, consistent, conflicting}`.
- **Assert:** `recommendedDoseMlPerDay` identical in all three; only reason codes and the
  confidence label differ.

### INV-D6 — The dose is never negative after any constraint
- **Canon:** `ALK-049` step 7; `AUDIT-022`; `WG-ALK-035`.
- **Assert:** `recommendedDoseMlPerDay ≥ 0` and `temporaryDoseMlPerDay ≥ 0` on every path.

---

## Group E — Interventions and response

### INV-E1 — A recommendation never creates delivered-dose exposure
- **Canon:** Part I §2.4, §31; Part II §72 item 14; `IX-004`.
- **Generator:** issue a recommendation; add no implementation event; advance `asOf`.
- **Assert:** no `Intervention` exists; `exposureFraction` is undefined; the dose state is
  unchanged; `implementationState` remains `UNKNOWN` or `NOT_IMPLEMENTED`.

### INV-E2 — An interrupted intervention is never labelled succeeded or failed
- **Canon:** Part I §57 item 9; Part II §36; `WG-ALK-021`.
- **Assert:** `responseAttribution ∈ {INTERRUPTED, INTERRUPTED_BY_SAFETY_RETURN}` and never
  a six-way class, for any interruption sequence.

### INV-E3 — Dose history is never collapsed
- **Canon:** Part II §37; `WG-ALK-021`; Part I §9.2.
- **Generator:** N consecutive dose changes with N ∈ 2..6.
- **Assert:** the ledger contains N dose states; no state is merged; each intervention has
  its own prediction snapshot.

### INV-E4 — Prediction snapshots are immutable
- **Canon:** `ALK-PREDICTION-SNAPSHOT-001`; `WG-ALK-019`; `WG-ALK-020`; `WG-ALK-038`.
- **Generator:** after creating an intervention, change selected potency, correct a Setup
  input, and let the intervention itself contribute a potency observation.
- **Assert:** `expectedSlopeChange` and `predictedPostSlope` unchanged in every case; the
  formal classifier uses the snapshot value; current recommendations use current potency.
- **Negative control:** recompute the benchmark on potency change; `WG-ALK-019` must fail.

### INV-E5 — The response classes are mutually exclusive and exhaustive
- **Canon:** `ALK-RESPONSE-CLASSIFIER-001`; `FZ-ALK-004`.
- **Generator:** sweep `R_obs` over `[−5B, R_exp + 5B]` in fine steps for
  `R_exp/B ∈ {0.5, 1, 1.5, 2, 3, 5, 10}`.
- **Assert:** exactly one class matches every `R_obs`; `INCONCLUSIVE` covers the remainder;
  the `PARTIAL` interval is empty exactly when `R_exp − B ≤ B`.

### INV-E6 — `OVERSHOOT` is orthogonal to the response class
- **Canon:** Part I §7.6A; Part II §34A; `ALK-043`.
- **Assert:** `positionEvent` is computed without reading `responseAttribution` and vice
  versa; `(EXPECTED, OVERSHOOT)` is reachable and legal.
- **Negative control:** add `OVERSHOOT` to the response enum.

### INV-E7 — Attribution failure never blocks current control
- **Canon:** `ALK-RESPONSE-ATTRIBUTION-001`; `WG-ALK-040`; `ALK-G039B`.
- **Generator:** set `responseAttribution` to each of
  `{NOT_ATTRIBUTABLE_SMALL_SIGNAL, AWAITING_DETECTABILITY, INCONCLUSIVE, UNRESOLVED_EXPIRED,
  PRECHANGE_EVIDENCE_INSUFFICIENT}` while the post-change regime has sufficient evidence.
- **Assert:** a maintenance recommendation is still produced from the current supported
  slope in every case.

### INV-E8 — No dose event is ever inferred from chemistry
- **Canon:** `ALK-INTERVENTION-EXTERNAL-CHANGE-001`; `WG-ALK-018`.
- **Assert:** the count of `MaintenanceDoseState` records is a pure function of recorded
  events; no code path creates one from an unexplained response.

---

## Group F — Potency

### INV-F1 — Potency learning never crosses a context boundary
- **Canon:** Part II §72 item 13; `ALK-017`; `ALK-067`; `ALK-068`; `AUDIT-024`.
- **Generator:** insert a solution-batch, concentration, product, net-volume, pump-channel
  or calibration change between the pre and post windows.
- **Assert:** `potencyObservationEligible = false` in every case; observations remain
  attached to their original context.

### INV-F2 — The potency layer never silently replaces the biological consumption model
- **Canon:** Part I §21, §57 item 8; `ALK-015`.
- **Generator:** hold the dose constant and change the tank slope.
- **Assert:** learned potency is unchanged (the change is consumption evidence, not potency
  evidence); the dosing engine consumes exactly one `selectedPotency` and maintains no
  private estimate.
- **Negative control:** update potency from an unchanged-dose slope change.

### INV-F3 — A learned potency is never adopted below its confidence threshold
- **Canon:** `ALK-POTENCY-CONFIDENCE-001`; `WG-ALK-027`.
- **Assert:** `selectedPotencySource = LEARNED` only when confidence is `CALIBRATED` or
  `STRONGLY_CALIBRATED`; `PLAUSIBILITY_HOLD` and `DIAGNOSTIC_ONLY` observations never enter
  the pool.

### INV-F4 — Calibration is never circular
- **Canon:** `ALK-PREDICTION-SNAPSHOT-001`; `WG-ALK-020`.
- **Assert:** an intervention's own potency observation never re-derives that
  intervention's expected response.

---

## Group G — Safety

### INV-G1 — A preferred-band excursion alone never enables the exceptional 50% step
- **Canon:** `ALK-STEP-CAP-001`; `AUDIT-008`; `WG-ALK-042`.
- **Generator:** sweep the level across the whole target band and just outside it, with
  every trajectory magnitude below the rapid threshold.
- **Assert:** `capApplied ≠ EXCEPTIONAL_50` whenever `rapidConfirmed = false`, regardless
  of distance outside the preferred range.
- **Negative control:** unlock 50% on any out-of-range position.

### INV-G2 — The exceptional step never violates the physical-effect rail
- **Canon:** `ALK-046`; `WG-ALK-006`; `WG-ALK-063`.
- **Generator:** sweep `P_selected` and `D_current` so the 50% cap exceeds the rail.
- **Assert:** `|P_selected · (D_recommended − D_current)| ≤ 0.50` on every path, including
  after recommendation rounding.
- **Negative control:** omit the post-rounding recheck; `WG-ALK-063` must fail.

### INV-G3 — The composite rail is never exceeded by treating components independently
- **Canon:** `ALK-COMPOSITE-RAIL-001`; `WG-ALK-052`.
- **Assert:** the signed sum of all simultaneously recommended intentional 24-hour Alk
  movement components satisfies `|Σ| ≤ 0.50`. In the Alk-only runtime, additionally assert
  that at most one such component is ever simultaneously recommended (the safety return
  defers maintenance unconditionally, and a return-plan offer is mutually exclusive with a
  supported non-zero slope).

### INV-G4 — The safety buffer is a fixed constant
- **Canon:** `ALK-SAFETY-BUFFER-001` Freeze-2 interpretation.
- **Generator:** vary residual scatter, `sigma_point`, cluster spread and test method.
- **Assert:** `bSafetyDkh == 0.20` in every case.
- **Negative control:** derive it from the current `sigma_point`; `WG-ALK-041` and
  `WG-ALK-053` must fail.

### INV-G5 — Safety return completes only at the buffered destination
- **Canon:** `ALK-003A` Completion; `WG-ALK-053`.
- **Assert:** completion requires `A_now ≥ outerMin + 0.20` (low) or
  `A_now ≤ outerMax − 0.20` (high); crossing the raw bound yields
  `RECOVERING_INSIDE_BOUND` with the return still active.

### INV-G6 — An unavailable capability never emits an active controller recommendation
- **Canon:** `ALK-CAPABILITY-CONTRACT-001`; `CORE-INFORM-PROCEED-001`; `WG-ALK-045`.
- **Generator:** remove each of `M-1 … M-13` in turn, and every subset of size 2.
- **Assert:** the affected output is `REFUSE`, `DEGRADE` or `NOT_RUN` with its named reason
  code; **no default value is substituted**; every unaffected output still runs.
- **Negative control:** default `recommendationPrecisionMlPerDay` to 0.1; `WG-ALK-045` must fail.

### INV-G7 — The magnesium gate never blocks the Alk safety return
- **Canon:** `ALK-SAFETY-MG-OVERRIDE-001`; `WG-ALK-055`; `X-GOV-003`.
- **Generator:** `magnesiumGateState ∈ {ALERT_LOW, NOT_ALERT_LOW, UNKNOWN}`.
- **Assert:** the safety return is emitted in all three; a low-Mg warning appears only
  under `ALERT_LOW` and is never invented under `UNKNOWN`.

### INV-G8 — During the Alk-only runtime, `magnesiumGateState` is constant
- **Canon:** `MIGRATION-MG-GATE-ISOLATION-001`; `X-MIG-001`.
- **Generator:** log Mg values across the whole plausible range.
- **Assert:** `magnesiumGateState == UNKNOWN` unconditionally; no Ca/Mg trend, evidence,
  schedule, notification or verdict is produced.

### INV-G9 — A recommendation to stop is never recorded as an actual stop
- **Canon:** `IX-004`; `ALK-RETURN-EXPIRY-001`; `ALK-SAFETY-RETURN-INTEGRATION-001` §10;
  `WG-ALK-032`; `WG-ALK-051`.
- **Assert:** `actualDoseState` changes only on a recorded implementation event; a
  recommended stop or pause leaves it at the last confirmed value or `UNKNOWN`.

---

## Group H — History and provenance

### INV-H1 — A historical date-only record never gains a fabricated time
- **Canon:** `SHARED-LEGACY-TIME-001`; `X-INV-007`; `DATA-PROVENANCE.md` §2.
- **Generator:** import, render, export, re-import; vary host and viewer timezones.
- **Assert:** `timeProvenance` unchanged; no absolute instant is materialised; no analysis
  requiring exact elapsed time consumes it.
- **Negative control:** assign noon on import; `WG-ALK-066` must fail.

### INV-H2 — Missing dose history stays missing
- **Canon:** `DATA-PROVENANCE.md` §3; `DEC-010`; Part II §70.1.
- **Assert:** no code path infers a past dose from chemistry movement, back-fills a past
  dose from current settings, or treats an absent dose-change record as evidence that the
  dose was unchanged.

### INV-H3 — A configuration change now never alters a historical recommendation
- **Canon:** Part I §46; Part II §72 item 11; `X-INV-006`; `WG-ALK-028`; `WG-ALK-065`.
- **Generator:** replay a fixed ledger under two different current configurations.
- **Assert:** stored historical `EngineResult`s are byte-identical; a re-analysis produces
  a **new** `assessmentId`.

### INV-H4 — A backdated edit recomputes the present, never the past record
- **Canon:** `ALK-065`; `WG-ALK-029`; `WG-ALK-030`; `AUDIT-029`.
- **Assert:** inserting, editing or invalidating a historical reading creates a new current
  assessment and leaves every prior assessment record unchanged; raw measurements are never
  physically deleted.

### INV-H5 — Normalization is exactly auditable and raw values survive
- **Canon:** Part II §72 items 6 and 10; §8.
- **Assert:** for every normalized point,
  `rawClusterValue − Σ appliedSteps == normalizedValue` exactly, and every source event id
  is recorded.

---

## Group I — Ownership and output contract

### INV-I1 — One retest scheduler owns final next-test timing
- **Canon:** `X-INV-004`; Part II §50; `WG-ALK-060`.
- **Assert:** exactly one module produces `recommendedAt`; every candidate considered
  appears in `candidateTimes[]` with an included/excluded reason; no card, notice or
  notification module computes a date.
- **Negative control:** hardcode a 24-hour safety date in a card; `WG-ALK-060` must fail.

### INV-I2 — Every frozen rule has exactly one authoritative implementation owner
- **Canon:** `CORE-SOURCE-001`; `X-INV-004`; Part I §45; `CORE-CANON-COVERAGE-001`.
- **Assert:** the `owner` column of `ALK-V2-RULE-TRACEABILITY.md` is single-valued for
  every rule; no two modules emit the same reason code; no rule appears with two owners.
- **Negative control:** let two modules emit `TRAJECTORY_UNCERTAINTY_LIMITED`.

### INV-I3 — Only catalogued reason codes are emitted
- **Canon:** this package's output contract; Part I §47.
- **Assert:** every emitted code is in `ALK-V2-REASON-CODES.md` and carries its full
  declared payload.

### INV-I4 — Every withheld output carries a reason
- **Canon:** `ALK-CAPABILITY-CONTRACT-001`; `CORE-INFORM-PROCEED-001`; `IX-005`.
- **Assert:** for every field whose value is `NOT_RUN`, `WITHHELD` or `UNRESOLVED`, at least
  one reason code with severity `GATING` or `REFUSAL` names it in `affectedOutputs[]`.

### INV-I5 — `HOLD` is a complete recommendation
- **Canon:** Part I §30; `IX-005`.
- **Assert:** every `HOLD` result carries its hold reasons, the current position, the
  observed and supported slopes where computed, and a next-test time.

### INV-I6 — Open issues surface as refusals, never as defaults
- **Canon:** this package's conformance gate item 8; `CORE-INFORM-PROCEED-001`.
- **Generator:** construct the trigger condition for each still-open issue whose "Until
  closed" behaviour withholds or degrades an output — `OI-EXPOSURE-001`,
  `OI-NORMUNCERT-001`, `OI-ANOMCLUSTER-001`, `OI-POTENCYSTATE-001`, `OI-POTENCYSNAP-001`.
  The three items Freeze-5 review opened were closed by F5-13, F5-14 and F5-15 and are no
  longer in this set.
- **Assert:** the dependent output is `NOT_RUN` / `WITHHELD` with the stated reason code
  and open-issue id; no numeric default appears.
- **Negative control:** supply a `minimumExposure` value for `OI-EXPOSURE-001` and let the
  gate run; the exposure fixture must fail.
- **Freeze-5 note:** the thirteen issues `ALK_V2_FREEZE_5` closed are no longer in this
  generator's set. Their behaviour is now determined, and a `NOT_RUN` emitted for one of
  them is a conformance failure, not a refusal. The retired reason codes listed in
  `ALK-V2-REASON-CODES.md` are the mechanical check for that.

### INV-I7 — No retired reason code is emitted
- **Canon:** `ALK-V2-REASON-CODES.md` "Retired by `ALK_V2_FREEZE_5`"; rule 1 of that
  catalogue (closed set).
- **Generator:** every fixture in the corpus, plus the trigger conditions of all thirteen
  Freeze-5 decisions.
- **Assert:** no emitted code appears in the retired table.
- **Negative control:** emit `EVIDENCE_INDEPENDENT_SELECTION_UNDEFINED` from the `A4`
  selection path; the check must fail.

### INV-I8 — Every Freeze-5 decision is pinned by a positive and a negative fixture
- **Canon:** `CORE-CANON-COVERAGE-001`; the Freeze-5 declaration's decision table.
- **Generator:** for each of `F5-01` … `F5-12`, read the canon rule it created or amended.
- **Assert:** at least one fixture asserts the decided behaviour, and at least one fixture
  asserts a `forbidden` entry naming the alternative the owner rejected.
- **Negative control:** delete the `forbidden` block from `AD-MNT-006`; the check must fail.

### INV-G10 — The materiality boundary classifies; it never selects a delivered rate
- **Canon:** `ALK-HIGH-BREACH-NO-PAUSE-001`; `ALK-NEGATIVE-MATERIALITY-001`;
  `ALK-HIGH-BREACH-SAFETY-SIZING-001`.
- **Amended by owner decision 16.** This invariant previously asserted
  `safetyDoseRecommendationMlPerDay == 0` **iff** the estimate is materially negative, with
  the established dose held on the other side. That is the discontinuity decision 16
  abolished, and asserting it now contradicts `INV-G11`. The superseded assertion is
  recorded here rather than deleted.
- **Generator:** `A_now > outerMax`, sweeping `C_estimate` across the materiality boundary
  `C + 1.28·sigma_S = 0` from both sides, at several `sigma_S`, holding `A_now`,
  `D_current` and `P_selected` fixed.
- **Assert:** the delivered rate is **identical** on both sides of the boundary; the
  classification (`NON_PHYSICAL_OR_UNEXPLAINED_GAIN` versus `UNCERTAIN_NON_RESOLVABLE`), the
  wording and the reason codes differ; the outer-bound state and the ~24 h cadence are
  emitted on both sides; `maintenanceEstimateStatus` is `UNRESOLVED` on both sides.
- **Negative control:** let the classification choose the rate — pause on the material side,
  hold on the other; `AD-CON-002` and `AD-SAF-008` must fail.

### INV-C12 — Independent selection never depends on storage order
- **Canon:** `ALK-SAME-TIMESTAMP-COALESCE-001`; `ALK-INDEPENDENT-SELECTION-001`;
  Part II §64.
- **Generator:** any ledger containing two or more clusters that share a representative
  timestamp; permute their event order, ids and insertion order across runs.
- **Assert:** identical `acceptedClusterIds[]`, identical `sigma_S` and an identical
  recommendation across every permutation; the coalesced value is the median of the
  pooled raw readings; a pooled spread above 0.20 dKH is still `ANOMALOUS`.
- **Negative control:** select the first-inserted of the tied clusters; `AD-SEG-007` must
  fail, and `AD-SEG-008` must fail if coalescing suppresses `ALK-005`.

### INV-I9 — The canon's coverage manifest covers every stable rule body
- **Canon:** `CORE-CANON-COVERAGE-001` items 1–5 and 8.
- **Generator:** scan the canon for stable rule IDs in all three marker forms — a standalone
  backticked line, `## \`ID\` — Title`, and `## ID — Title` — and compare against the
  `CANON RULE COVERAGE MANIFEST`.
- **Assert:** zero dangling manifest IDs, zero duplicate authoritative bodies, zero
  uncovered bodies, zero missing fixture IDs. The substantiveness threshold (item 2) is
  recorded by the checker and enforced on rule bodies the current freeze added; bodies that
  predate it are reported rather than failed.
- **Negative control:** remove one Freeze-5 rule from the manifest; the check must fail.
- **Why it exists:** the Freeze-5 gate initially never read the canon, so the manifest went
  stale for ten new rules and nothing caught it.

### INV-I10 — Every fixture's stated intermediates recompute from its own inputs
- **Canon:** `_schema.json` `acceptanceRule` — "a numerical result differs beyond the
  declared tolerance", "the wrong rule path produces the same final number".
- **Generator:** every fixture carrying `timesDays` (or `clusterTimesDays`) and `alkDkh`.
  Apply forward-greedy selection, then Theil–Sen, the Theil–Sen intercept, residual MAD,
  `sigma_resid`, `sigma_point`, `Sxx`, `sigma_S` and `S_supported` independently.
- **Assert:** every stated intermediate matches to 1e-8 relative, and any stated accepted
  cluster set matches the selection.
- **Negative control:** change one `alkDkh` value without changing the expectations; the
  check must fail.
- **Why it exists:** two fixtures shipped with expectations their own inputs did not
  produce, and one canonical quantity was stated three different ways.

### INV-G11 — The high-breach safety rate is sized, never chosen
- **Canon:** `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-HIGH-BREACH-UNRESOLVED-001`;
  `ALK-HIGH-BREACH-NO-PAUSE-001` (owner decision 16).
- **Amended by owner decision 20.** The sizing input is `D_current`, not `D_established`.
  Superseded wording, recorded rather than deleted:
  superseded by owner decision 20 — `D_safety,temp == max(0, D_established − R_down / P_selected)`,
  with `D_established` described as the dose-history basis. Substituting `D_history` for
  `D_current` is now a **failure**, not a synonym.
- **Generator:** `outerMax < A_now < AdvisoryCeiling` with `C_estimate < 0`, sweeping
  `A_now` across the 0.50 dKH/day rail and `D_current` across the materiality boundary
  `C + 1.28·sigma_S = 0`, at several `sigma_S`. Include intervals whose dose changed
  mid-interval, so `D_current != D_history`.
- **Assert:** `D_safety,temp == max(0, D_current − R_down / P_selected)` exactly;
  zero occurs **iff** `D_current <= R_down / P_selected`. **Above that floor** the rate
  strictly decreases as `A_now` rises until `R_down` saturates at 0.50 and is constant
  after, and changes by exactly one recommendation precision per increment of `D_current`,
  including across the materiality boundary. At or below the floor the rate is 0 and varies
  with nothing, which is the floor and not a violation. `maintenanceEstimateStatus` stays
  `UNRESOLVED` on both branches. On a mixed-dose interval the rate is computed from
  `D_current`; a rate computed from `D_history` differs and must fail.
- **Negative control:** pause to 0 on the materially-negative branch and hold the
  configured dose on the other; `AD-SAF-007`, `AD-SAF-008` and `AD-CON-002` must fail.
  Separately, swap `D_history` for `D_current` in the formula; `AD-DHS-001` must fail.
- **Why it exists:** the superseded routing produced a 1.5 mL/day → pause versus
  1.6 mL/day → hold discontinuity, and produced no safety rate at all on the middle branch.

### INV-C13 — One episode output for every Alk consumer
- **Canon:** `ALK-TESTING-EPISODE-001`; `ALK-EPISODE-RESOLUTION-001`;
  `ALK-EPISODE-SINGLE-OUTPUT-001` (owner decisions 17, 19, 27 and 28).
- **Generator:** any ledger containing two or more measurements within 30 minutes of one
  another. Permute event order, ids and insertion order; jitter the timestamps inside the
  window.
- **Assert:** identical `episodeStatus`, episode value, `combinedMeasurementCount`,
  `position`, `outerBoundState`, `acceptedClusterIds[]`, `sigma_S`, `rapidConfirmed` and
  recommendation across every permutation and every jitter; every episode holding a valid
  measurement is `RESOLVED`; the episode value is the median of the pooled raw readings; no
  consumer reads an individual member; no output is withheld on episode grounds.
- **Negative control:** select the first-inserted member of an episode, or average two
  cluster medians rather than pooling; `AD-EPI-002`, `AD-EPI-003` and `AD-EPI-004` must
  fail. Move the two members three minutes apart and the outputs must not change.
- **Amended by owner decision 27:** this invariant previously asserted that an
  incompatible-method episode was `CONTESTED_METHODS`, emitted no value and drove
  `position = NOT_RUN`, `outerBoundState = NOT_RUN`, `rapidConfirmed = NOT_RUN` and
  `REPEAT_NOW`. The engine never knows the method, so that state is unreachable.
- **Why it exists:** exact-timestamp coalescing left position, rapid and a three-minute
  offset able to change an actuator command and an outer-bound classification by storage
  order.

### INV-C14 — Canonical decimal thresholds compare exactly
- **Canon:** `ALK-DECIMAL-THRESHOLD-001`; `ALK-005`; `ALK-004`; `ALK-003A`
  (owner decision 18).
- **Generator:** decimal reading pairs whose exact difference is 0.20 dKH, including pairs
  whose binary64 difference exceeds 0.20 (`8.60/8.80`, `7.30/7.50`, `9.10/9.30`) and pairs
  whose binary64 difference falls short (`10.55/10.75`); plus readings at each preferred-range
  and outer-bound edge.
- **Assert:** an exact spread of 0.20 dKH is `OK` in every case; an exact spread above
  0.20 dKH is `ANOMALOUS` in every case; no epsilon is used and no reading is pre-rounded to
  perform the comparison; **every** repeat pair reaches the threshold, with no method
  qualifier and no exemption route (owner decision 27 retires both).
- **Negative control:** compare in binary64; the three straddling pairs must fail.
- **Why it exists:** 317 of 600 tested decimal pairs whose exact difference is 0.20
  classified `ANOMALOUS` under binary64, which withholds a dose recommendation on an
  artefact of the literals.

### INV-G12 — Exactly one high-breach branch is selected, always
- **Canon:** `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`;
  `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-003A` interpretable branch (owner decision 22).
- **Scope, amended by owner decisions 24 and 25.** The region is `A_now > outerMax` with
  **no upper limit** (decision 24 removed the `AdvisoryCeiling` bound), and the invariant
  governs only the states that **reach** branch selection — that is, those whose pre-branch
  precondition passed. `INV-G15` governs the gate in front of it. **The two are
  complementary and must never be read as competing answers for the same state.**
- **Generator:** every state with `A_now > outerMax`, **including at and beyond
  `AdvisoryCeiling`**, crossed with
  `C_estimate ∈ {positive-and-interpretable, exactly zero, positive-but-NOT-physically-
  interpretable, negative-not-material, negative-material, NOT COMPUTABLE}`,
  `D_current ∈ {known above the floor, known at the floor, known below the floor, unknown}`
  and `P_selected ∈ {valid, invalid, unavailable, zero}`. States with `D_current` unknown
  are expected to be **refused by the precondition** and to select **no** branch; they are
  checked against `INV-G15`, not against the partition below.
- **Assert:** for every generated state **that reaches selection**, exactly one of A
  (`C_estimate >= 0` **and** physically interpretable), B (`C_estimate < 0` **or**
  computable-but-uninterpretable) and B′ (`C_estimate` not computable at all) is selected —
  never zero branches, never two. A computable, non-negative, **not physically
  interpretable** estimate selects **B**, per `ALK-HIGH-BREACH-UNRESOLVED-001`'s own
  routing; it must not fall through. Where `D_current` and `P_selected` are both usable, the
  selected branch produces a rate. **Every state at or beyond `AdvisoryCeiling` still selects
  a branch and still states a rate** — the boundary attaches a warning and gates nothing.

  The two "no rate" states are **not the same shape**:

  - `D_current` **unknown** — the precondition of `ALK-DELIVERY-RATE-BASIS-001` refuses
    **before** selection (owner decision 25), so `preconditionPassed` is `false` and
    `branchSelected` is `NOT_RUN`. This is not a fourth branch because it is not a branch:
    it is the gate in front of the tree, and it is `INV-G15`'s to assert.
  - `P_selected` **unavailable or invalid** — the precondition **passed**, a branch **is**
    selected (B′, since an invalid potency also makes `C_estimate` uncomputable), and
    `ALK-HIGH-BREACH-SAFETY-SIZING-001`'s preserved potency clause withholds the mL figure
    while stating the required dKH movement and direction.

  B and B′ produce the identical `max(0, D_current − R_down / P_selected)`;
  `maintenanceEstimateStatus` is `UNRESOLVED` on both.

  > **Superseded by owner decision 25, preserved rather than deleted.** This invariant
  > previously asserted: "Two states withhold the **rate** without changing the **branch**,
  > and neither is a fourth branch: `D_current` unknown (`ALK-DELIVERY-RATE-BASIS-001`) and
  > `P_selected` unavailable/invalid." Decision 25 moved the `D_current` refusal ahead of
  > branch selection, so it no longer selects a branch at all.
- **Negative control:** remove the B′ branch so a non-computable `C_estimate` falls through;
  `AD-SAF-009` must fail with zero branches selected. Separately, route a non-computable
  `C_estimate` to A by treating it as zero; `AD-SAF-009` must fail. Separately again, drop
  B's "or computable but otherwise physically uninterpretable" disjunct; the
  positive-but-uninterpretable generated state must fail with zero branches. Separately
  again, restore the decision-20 reading and let a `D_current`-unknown state select branch B
  while withholding only the rate; `AD-DHS-002` and `AD-SAF-010` must disagree with each
  other, which is the ambiguity decision 25 abolished.
- **Why it exists:** before decision 22 a high breach with no computable consumption
  estimate matched neither `C_estimate >= 0` nor `C_estimate < 0`, and produced no delivery
  response at all above the outer bound.

### INV-G13 — Beyond the advisory boundary the engine warns, and the answer does not change
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001` (owner decision 24, superseding decision 21);
  `ALK-DECIMAL-THRESHOLD-001`; `ALK-RETEST-SCHEDULER-001` (owner decision 26).
- **Superseded by owner decision 24.** This invariant previously asserted that at and beyond
  the boundary `recommendedDoseMlPerDay` was `WITHHELD` and both rate fields `NOT_RUN`. That
  is the behaviour decision 24 abolished; the superseded assertion is recorded here rather
  than deleted.
- **Generator:** sweep the resolved episode value through `boundary − 1 precision step`,
  exactly `boundary`, `boundary + 1 precision step`, and the three mirrored cases at the
  floor, at several configured `(outerMin, outerMax)` pairs so the boundary is exercised as
  an **offset** and not as a pinned level. Include configurations where binary64 and exact
  decimal disagree.
- **Assert (the point of decision 24):** the recommendation immediately below the boundary
  and the recommendation at and above it are **produced by the same rules and are the same
  number**. The only difference is `advisoryConfidenceWarning`, `NONE` below and `ATTACHED`
  at and beyond. Nothing is withheld, nothing is zero, no escalation replaces an answer.
- **Assert (the warning does not leak):** attaching the warning changes **none** of the
  recommended rate, the trajectory, the consumption estimate, the retest schedule, the
  outer-bound classification, the evidence state, or any rail or guard. Holding every input
  fixed and toggling only the warning must leave every other field byte-identical.
- **Assert (one retest answer, decision 26):** the interval the warning renders equals the
  interval `ALK-RETEST-SCHEDULER-001` produced, in every generated case. The warning submits
  no candidate and computes no next-test time.
- **Assert (exact decimal, no epsilon):** the boundary is computed and compared in exact
  decimal. `OuterMin = 8.2` with `A_now = 7.2` (exact floor `7.2`, binary64
  `7.199999999999999`) must warn.
- **Negative control:** revert the boundary to withholding; `AD-ESC-001` and `AD-ESC-002`
  must fail. Change the recommended rate at the boundary; `AD-ESC-001` must fail. Let the
  warning state its own interval; `AD-ESC-001` must fail. Compare in binary64;
  `AD-ESC-002`'s straddling case must fail.
- **Scope, asserted:** this invariant does **not** assert that the sized rate responds to
  `A_now`. It does not, at any level, and decision 24 **widened** that exposure by removing
  the ceiling that used to bound it. `OI-SIZINGFLAT-001` stays open.

### INV-G14 — `D_current` and `D_history` are never interchanged
- **Canon:** `ALK-DELIVERY-RATE-BASIS-001` (owner decision 20);
  `ALK-CONSUMPTION-ESTIMATE-001`; `ALK-HIGH-BREACH-SAFETY-SIZING-001`.
- **Generator:** intervals whose programmed dose changes mid-interval, in **both**
  directions (increase and decrease), so `D_current != D_history` and the sign of the
  difference varies; crossed with `{D_current known, D_current unknown}` ×
  `{D_history available, D_history unavailable}`.
- **Assert:** high-breach safety sizing uses `D_current` and consumption uses `D_history`,
  on every generated interval and in **both** directions of dose change — so an
  interchange is caught by a sign error, not only by a magnitude error. `D_current`
  unknown ⇒ no safety rate on branches B and B′, no recommendation, `recommendedDoseMlPerDay`
  `WITHHELD`, and **not** `0`, while consumption still runs if `D_history` is available.
  (Branch A too, since **owner decision 25** makes the refusal a precondition evaluated
  before branch selection — see `INV-G15`.) `D_history` unavailable ⇒ consumption `UNRESOLVED`, while
  safety sizing still runs if `D_current` is known. A `D_history` that integrates to
  **exactly zero** — the doser off for the whole interval — is a value, not an absence, and
  must not fall back to `D_current`. `D_established` appears nowhere as a live name.
- **Negative control:** swap `D_current` for `D_history` in the safety formula;
  `AD-DHS-001` must fail in **both** directions. Emit `0` when `D_current` is unknown;
  `AD-DHS-002` must fail. Withhold safety sizing because `D_history` is unavailable;
  `AD-DHS-003` must fail.
- **Why it exists:** one name carried two quantities. On a constant-dose segment they are
  numerically equal, so every existing fixture passed either way and the defect was
  invisible to the whole corpus.

### INV-G15 — A high-breach state gives one answer, not two
- **Canon:** `ALK-DELIVERY-RATE-BASIS-001` (owner decision 25);
  `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`.
- **Generator:** every high-breach state, crossed with `D_current ∈ {known, unknown}` and
  `C_estimate ∈ {positive-interpretable, zero, positive-uninterpretable, negative-material,
  negative-not-material, NOT COMPUTABLE}`, at several `P_selected` including invalid.
- **Assert:** no state produces **both** a numeric temporary safety recommendation **and** a
  refusal. Where `D_current` is unknown the precondition refuses **before branch selection**,
  so no branch is selected and no branch's formula runs — including branch A, whose formula
  does not reference `D_current` at all. Where `D_current` is known the precondition passes
  and exactly one branch produces exactly one recommendation.
- **Assert (no reading-dependence):** the same state cannot produce different outputs under
  different readings of the rules. Evaluate the state twice — once resolving the refusal
  before branch selection and once attempting to resolve it inside each branch's formula —
  and require the same answer. Under decision 25 the second evaluation is not a valid
  reading; the assertion exists because before it, it was.
- **Negative control:** remove the precondition and let branch A size from `C_estimate`;
  `AD-SAF-010`'s `BRANCH_A_D_CURRENT_UNKNOWN` case must fail with a numeric
  `1.443001443001443 → 1.4`. Emit both a number and a refusal; `AD-SAF-010` must fail.
- **Why it exists:** decision 20 attached the refusal to a formula. Branch A's formula
  `max(0, (C_estimate + S_safety) / P_selected)` contains no `D_current`, so one reading
  refused and another recommended 1.4 mL/day, on the same tank state.

### INV-G16 — There is no actuator, and no output is withheld for want of one
- **Canon:** `ALK-RECOMMEND-ONLY-001` (owner decision 23); `ALK-ROUNDING-001`.
- **Generator:** every state that previously depended on `actuatorIncrementMlPerDay`, crossed
  with `recommendationPrecisionMlPerDay ∈ {configured, not configured, invalid}`.
- **Assert:** the engine emits **exactly one** recommended rate wherever a rate is
  calculable — never a pair, under any names. No output is withheld, refused, gated or
  `NOT_RUN` because a device increment is unknown; where no precision is configured the
  full-precision recommendation is stated, and where one is configured the recommendation is
  rounded to it. No refusal, invariant or recorded exposure asserts that withholding an
  output causes delivery to continue, rise, run on or persist.
- **Assert (what still withholds, and why):** an invalid or unavailable `P_selected` still
  withholds the mL/day figure and states the dKH movement and direction; an unknown
  `D_current` still refuses under `INV-G15`; the liquid-volume guard still withholds a
  physically implausible volume. None of these is a device capability.
- **Negative control:** reinstate the advisory/executable split; `AD-REC-001`, `AD-SAF-002`
  and `AD-SAF-005` must fail. Withhold a recommendation because no precision is configured;
  `WG-ALK-045` and `AD-SAF-005` must fail. Assert that withholding keeps a pump running;
  `AD-REC-002` must fail.
- **Why it exists:** the package was written as though the engine drove a doser. It never
  did, and a whole layer of refusals, statuses and paired outputs existed to manage a
  connection that does not exist.

### INV-G17 — The advisory warning field has exactly two states
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001` (owner decisions 24 and 29).
- **Generator:** every reachable state of the advisory boundary — resolved values below, at
  and beyond each boundary; a resolved value with no boundary configured; an episode whose
  every measurement is `INVALID`, so no observation exists at all.
- **Assert:** `advisoryConfidenceWarning` takes only `ATTACHED` or `NONE`, in every state and
  every fixture. `NOT_RUN` never appears. Where nothing resolves, the field is `NONE` —
  absent because there is nothing to describe — and the absence of an observation is not
  represented as a third value of this field.
- **Negative control:** reinstate `NOT_RUN` anywhere — the data-contract enumeration, a
  fixture leaf, or the algorithm contract's failure state; `AD-ESC-003` must fail.
- **Why it exists:** `OI-ADVISORYWARNSTATE-001` recorded that the third value's trigger set
  was never stated in the rule that owns the field. Owner decision 29 removes the value
  rather than specifying it.

### INV-C15 — Repeats inside 30 minutes are one observation, and the count is stated
- **Canon:** `ALK-TESTING-EPISODE-001` (owner decision 28); `ALK-008` (unchanged).
- **Generator:** pairs and triples of measurements at separations sweeping 0 to 60 minutes,
  including 29, 30 and 31 minutes exactly; and pairs separated by hours and by days.
- **Assert:** separation `<= 30 min` gives one observation whose
  `combinedMeasurementCount` equals the number of measurements combined; separation
  `> 30 min` gives that many observations, each with `combinedMeasurementCount = 1`; the
  count is an integer field and never engine-authored prose; no explicit repeat relationship
  is required for combining and none prevents it; the 24-hour trend-independence rule is
  evaluated on the resulting observations and is unchanged by any of this.
- **Negative control:** change the window from 30 minutes; make the boundary exclusive at
  exactly 30; drop the count field; or require an explicit repeat relationship.
  `AD-EPI-005`, `AD-EPI-006` and `AD-EPI-007` must fail.
- **Why it exists:** decision 28 makes proximity in time the whole test, and the count is
  what lets a keeper see that three tests became one point.

---

## Coverage

| Group | Invariants |
|---|---|
| A — Determinism and replay | 4 |
| B — Layer separation | 7 |
| C — Evidence integrity | 15 |
| D — Consumption and maintenance | 6 |
| E — Interventions and response | 8 |
| F — Potency | 4 |
| G — Safety | 17 |
| H — History and provenance | 5 |
| I — Ownership and output contract | 10 |
| **Total** | **76** |

Six invariants were added by `ALK_V2_FREEZE_5`, its review and its amendments. `INV-I7`
checks that the retired reason codes are gone. `INV-I8` checks that every owner decision is
pinned in both directions. `INV-I9` and `INV-I10` exist because the first Freeze-5 gate
could not have caught the defects review found: it never read the canon, and it never
recomputed a fixture. `INV-G10` and `INV-C12` pin the two amendments whose failure mode is
a wrong recommendation or safety action — recommending a pause on an uncertainty-limited estimate,
and letting storage order decide which cluster counts.

`INV-C15` was added by owner decision 28, and `INV-C13` and `INV-C14` were amended by owner
decision 27 — the contested-episode assertions in `INV-C13` and the method qualifier in
`INV-C14` are both unreachable now that the engine never knows what produced a reading.
`INV-G17` was added by owner decision 29 and pins the advisory warning field to two states.
It is numbered `G17` and not `G14`: the decisions 27–29 encoding first gave it `INV-G14`,
which owner decision 20 had already taken, and a duplicated identifier is a `MASTER RULE 4`
defect — two invariants under one ID, one of them unreachable. The collision was found by
review and corrected in the same pass; `INV-G14` remains decision 20's.

Three more were added by owner decisions 16–19. `INV-G11` pins the high-breach safety rate
to its formula so no classification can choose it. `INV-C13` pins one episode output for
every consumer, under permuted order and jittered timestamps alike. `INV-C14` pins exact
decimal comparison for the canonical thresholds. All three exist because the finding they
close could change a recommendation, a safety action or an outer-bound classification.

Three more were added by owner decisions 20–22, all in group G because all three decide a
safety action. `INV-G12` asserts that the three high-breach predicates are jointly
exhaustive and mutually exclusive, so no state can fall through with no delivery response.
`INV-G13` pinned the advisory boundary as a refusal; **owner decision 24 rewrote it** and it
now pins the boundary as a warning that changes no answer — see the decisions 23–26 paragraph
below. `INV-G14` pins `D_current` and `D_history`
apart, and does it on mixed-dose intervals in both directions — on a constant-dose segment
the two are numerically equal, which is exactly why one name carrying both quantities went
unnoticed by every fixture in the corpus. `INV-G10` and `INV-G11` were amended for the
rename.

Three more were added by owner decisions 23–26, again all in group G. `INV-G15` asserts that
a high-breach state gives one answer and not two, which is what decision 25 fixed.
`INV-G16` asserts that there is no actuator: one recommendation, never a pair, and nothing
withheld for want of a device increment. `INV-G13` was rewritten rather than added —
decision 24 turned the advisory boundary from a refusal into a warning, so the invariant now
asserts that the answer **does not change** across the boundary, which is the opposite of
what it asserted before.

All twelve invariants named in the preparation brief are covered:

| Brief invariant | Here |
|---|---|
| same valid inputs + same config → identical output | INV-A1 |
| maintenance never intentionally moves the level | INV-B1 |
| unexplained negative consumption never reduces maintenance | INV-D1 |
| preferred-band excursion alone never enables 50% | INV-G1 |
| exceptional step never violates the physical rail | INV-G2 |
| date-only record never gains fabricated time | INV-H1 |
| evidence never crosses an incompatible intervention boundary | INV-C4 |
| potency layer never silently replaces consumption | INV-F2 |
| UI cannot alter the domain recommendation | INV-B4 |
| unavailable capability never emits an active recommendation | INV-G6 |
| one retest scheduler owns final timing | INV-I1 |
| one authoritative owner per frozen rule | INV-I2 |
