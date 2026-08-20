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
  after actuator rounding.
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
- **Negative control:** default `actuatorIncrementMlPerDay` to 0.1; `WG-ALK-045` must fail.

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

---

## Coverage

| Group | Invariants |
|---|---|
| A — Determinism and replay | 4 |
| B — Layer separation | 7 |
| C — Evidence integrity | 11 |
| D — Consumption and maintenance | 6 |
| E — Interventions and response | 8 |
| F — Potency | 4 |
| G — Safety | 9 |
| H — History and provenance | 5 |
| I — Ownership and output contract | 8 |
| **Total** | **62** |

`INV-I7` and `INV-I8` were added by `ALK_V2_FREEZE_5`: one mechanical check that the
retired reason codes are gone, one that every owner decision is pinned in both directions.

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
