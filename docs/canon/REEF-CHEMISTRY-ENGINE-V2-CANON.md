# Tank Chat — REEF CHEMISTRY ENGINE V2 — MASTER CANON

**Status:** Authoritative V2 working canon  
**Authority:** This is the single behavioural source of truth for Reef Chemistry Engine V2.  
**Owner decision locked:** Automatic maintenance advice stabilises first. Deliberate level movement is a separate opt-in return plan.  
**Implementation rule:** Claude / Claude Code implements from this document. Supporting notes, V1 canon, decision logs, simulations and old code are evidence and history, not competing authorities.

---

# MASTER RULE 1 — ONE CANON

There is one live V2 canon.

This document may be long. That is intentional.

The problem V2 is solving is not merely incorrect arithmetic. V1 accumulated correct ideas across multiple documents, amendments, exceptions, UI specifications and implementation notes. That made it possible for two individually reasonable rules to answer the same question differently.

V2 therefore uses:

- **one master canon** for current behaviour;
- stable rule identifiers for important invariants;
- one owner for each inference;
- a V1→V2 coverage ledger;
- separate historical reasoning only when needed, never as a second source of truth.

Temporary drafting files may exist while a section is being worked on, but once accepted their content is folded into this master document and the temporary file ceases to be authoritative.

---

# MASTER RULE 2 — HOW V1 IS USED

V1 is not discarded.

V1 contains substantial good design work, real failure cases and tested behavioural knowledge. V2 must take the best of it deliberately.

For every substantive V1 rule, V2 assigns exactly one disposition:

- **KEEP** — the V1 rule is sound and survives materially unchanged.
- **KEEP BUT RESTRUCTURE** — the underlying idea survives but moves into a cleaner architecture.
- **REPLACE** — V2 adopts a materially better rule.
- **REMOVE** — the V1 behaviour is intentionally deleted.
- **REVALIDATE SCIENTIFICALLY** — V1 may be right, but the scientific premise must be checked before V2 adopts it.
- **OPEN DECISION** — a real product/design choice remains for the owner.

No substantive V1 behaviour may simply vanish because a new document forgot to mention it.

---

# MASTER RULE 3 — CURRENT RULES, NOT AMENDMENT ARCHAEOLOGY

The live canon describes the rule that applies now.

Do not write the V2 rule as:

> rule A applies, except amendment B, as modified by section C.

Instead write the final rule once.

Why the decision was made belongs in a decision/migration record or a short rationale immediately beneath the rule where it materially improves implementation safety.

This is a deliberate correction to V1's amendment-heavy structure.

---

# MASTER RULE 4 — STABLE RULE IDS

Important rules should receive stable semantic identifiers as the canon matures.

Examples:

- `CORE-POSITION-001`
- `CORE-STABILISE-001`
- `SHARED-DELIVERY-BASIS-001`
- `SHARED-SLOPE-UNCERTAINTY-001`
- `ALK-MOVEMENT-001`
- `ALK-PREDICTION-SNAPSHOT-001`
- `ALK-RAPID-001`

Section numbering is for navigation. Rule IDs are for behavioural cross-reference.

---

# MASTER RULE 5 — CANON / TEST / CODE TRIAD

A behavioural change is complete only when all three agree:

1. canon;
2. automated tests / simulations;
3. implementation.

A rule in canon without a test is specified but not enforced.
A behaviour in code without canon is implementation drift.
A golden test that preserves obsolete V1 behaviour does not outrank V2 canon.

## Mechanical freeze-integrity requirement

`CORE-CANON-COVERAGE-001`

Before any future shared or parameter freeze is declared:

1. every stable rule ID referenced anywhere in the active canon must resolve to exactly one active normative rule body;
2. a rule-ID marker alone is not a body: the mechanical checker must verify that the owning rule section contains a non-trivial amount of substantive normative text, using an explicit conservative threshold recorded by the checker;
3. every active normative rule body must appear in the canonical rule-coverage manifest;
4. every manifest entry must point to at least one named coverage fixture;
5. every named coverage fixture must itself exist;
6. numerical/controller behaviour should be covered by a golden scenario;
7. structural, ownership, migration, wording or governance rules may be covered by an invariant fixture where an arithmetic golden would be artificial;
8. the mechanical checker must return zero dangling rule IDs, zero duplicate authoritative bodies, zero insubstantial rule bodies, zero uncovered normative rule bodies and zero missing fixture IDs;
9. before a checker revision is trusted as a freeze gate, at least one deliberate negative-control mutation representing the defect class it is intended to catch must be shown to fail.

This is a structural verification gate. It does not prove that the rule is scientifically correct or that a named fixture semantically exercises the right rule. Those remain review/conformance responsibilities. It prevents a rule from being treated as frozen merely because an ID marker or fixture name exists somewhere in the document.

---


# MASTER RULE 6 — ADVISORY RESPONSIBILITY, NON-ADHERENCE & ENGINE-ORIGINATED RISK

`CORE-ADVISORY-RESPONSIBILITY-001`

The Reef Chemistry Engine is an **advisor for an engaged keeper**.

It recommends. The keeper implements.

The app:
- cannot see the aquarium;
- cannot guarantee that a recommendation was followed;
- cannot assume that a recommendation was followed merely because it was shown;
- does not directly control dosing unless a future explicitly integrated control surface proves otherwise.

The engine is responsible for the **correctness, internal coherence and safety of its recommendations given the information available to it**.

It is **not** responsible for preventing every adverse outcome caused solely by repeated non-implementation of clear prior recommendations.

This distinction governs future canon design.

## 6.1 Three situations that must never be collapsed

### A. Confirmed non-adherence

```text
priorRecommendation = known
implementationState = CONFIRMED_NOT_IMPLEMENTED
```

The keeper did not carry out prior guidance.

This does **not** by itself invalidate the current assessment.

Required behaviour:

```text
INFORM_AND_PROCEED
```

The engine:
- reassesses from the tank facts now available;
- names the unresolved prior issue where it materially affects outcome or confidence;
- gives the best currently supported recommendation;
- does not punish, lock out or withhold help merely because previous advice was ignored.

Example:

```text
Alk is below the outer operating range.
A safety return is recommended now.
Magnesium remains low, so Alk may be harder to hold until Mg is corrected.
```

The unresolved Mg problem is named; valid Alk safety advice is not withheld solely because the keeper did not fix Mg first.

### B. Implementation unknown

```text
priorRecommendation = known
implementationState = UNKNOWN
```

This is **not** non-adherence.

The engine does not know what actually happened.

Unknown implementation changes the evidence regime and retains every applicable guard.

Required behaviour may include:
- confounding an interval;
- splitting a segment;
- withholding causal attribution;
- disabling potency learning;
- asking for implementation history;
- using last confirmed state or `UNKNOWN`;
- refusing an affected calculation when the missing implementation fact is load-bearing.

The engine must never turn:

```text
UNKNOWN
```

into:

```text
NOT_IMPLEMENTED
```

or:

```text
IMPLEMENTED
```

without evidence.

Protecting the engine from pretending it knows history is **engine correctness**, not protection against keeper inattention.

### C. Engine-originated risk

Examples:
- wrong or unknown solution potency;
- mistyped or dimensionally invalid concentration;
- incompatible units;
- impossible/non-physical mass balance;
- missing actuator resolution required for a final dose — **RETIRED as a risk category by owner decision 23**: the application never commands a pump, so this state cannot arise; where a *configured display precision* is absent the full-precision recommendation is stated and nothing is refused;
- corrupted or ambiguous dose-change time;
- missing provenance needed for empirical calibration;
- contradictory evidence that makes the recommendation unsupported.

These remain subject to all applicable:
- capability refusals;
- plausibility envelopes;
- non-physical-state holds;
- potency gates;
- uncertainty rules;
- safety rails;
- validation requirements.

The engine must remain **more conservative about being confidently wrong than about a keeper declining correct advice**.

---

## 6.2 Inform-and-proceed test

`CORE-INFORM-PROCEED-001`

When an unresolved issue coexists with a possible recommendation, ask:

> Does the unresolved issue make the recommendation itself mathematically, evidentially or physically unsupported?

### If NO

```text
INFORM_AND_PROCEED
```

- give the valid recommendation;
- name the unresolved issue;
- explain the consequence it may have;
- do not withhold merely because success may be less reliable.

Example:

```text
low Mg + low Alk outer-bound breach
```

Low Mg may make Alk harder to hold, but it does not prevent calculating a valid bounded Alk safety return.

### If YES

```text
WITHHOLD_AFFECTED_OUTPUT
```

- withhold only the recommendation/calculation that cannot be supported;
- state exactly what is missing or contradictory;
- continue providing every unaffected conclusion.

Example:

```text
required Alk correction = known in dKH
solution potency = unknown
```

The engine may state the required dKH movement but must refuse to invent the mL dose because the conversion is unsupported.

The decision boundary is therefore:

> **Withhold when the unresolved issue invalidates the recommendation, not merely when it may make the recommendation less likely to work.**

---

## 6.3 Repeated ignored guidance is not a default source of new controller complexity

`CORE-NONADHERENCE-COMPLEXITY-001`

Do not add specialised runtime branches whose only purpose is to rescue a keeper from consequences that require repeated confirmed non-implementation of clear prior recommendations.

When reviewing a proposed rule, ask:

> Does the failing scenario require the keeper to have ignored two or more explicit, actionable recommendations before the special rule becomes necessary?

If YES:
- flag the proposal as `NONADHERENCE_RESCUE_COMPLEXITY`;
- question whether the new rule earns its state-machine, test and implementation cost;
- default toward **not** adding the special rescue behaviour unless it prevents an independent engine-originated failure.

This is a design-review heuristic, **not a runtime threshold**.

It does not mean:
- stop advising after two ignored recommendations;
- ignore extreme measurements;
- permit arithmetic to become unbounded;
- allow invalid states;
- suppress current safety recommendations.

At every new valid measurement, the engine still assesses the tank as it now exists.

---

## 6.4 Simulated non-adherent keepers are test instruments, not product personas

`SIM-NONADHERENCE-001`

Adversarial simulations may deliberately model unrealistic keeper behaviour, including:
- repeated ignored recommendations;
- very sparse testing;
- dose settings left unchanged while chemistry deteriorates;
- late/manual changes;
- intentionally hostile sequences designed to expose oscillation or state corruption.

These simulations remain valuable.

Their purpose is to test whether the engine:
- stays deterministic;
- remains dimensionally valid;
- avoids runaway/oscillatory controller behaviour caused by its own logic;
- respects rails and hard guards;
- preserves recommendation-versus-implementation truth;
- continues producing the best supported current advice;
- does not corrupt evidence, intervention or potency state.

Passing such simulations means:

> **the engine remains mathematically coherent under hostile inputs and non-adherence.**

It does **not** mean:

> **the product must rescue every biological consequence of repeated ignored advice.**

A simulated keeper who ignores every recommendation may be used as a **controller stress harness**.

That simulated keeper is not, by itself, a product persona that justifies additional rescue states.

---

## 6.5 Complexity must target the right risk

When deciding whether a proposed safeguard is worth adding, classify the risk first:

```text
KEEPER_NONADHERENCE
IMPLEMENTATION_UNCERTAINTY
ENGINE_ORIGINATED_ERROR
TRUE_PHYSICAL_SAFETY_CONSTRAINT
```

Default priorities:

```text
ENGINE_ORIGINATED_ERROR         → defend aggressively
IMPLEMENTATION_UNCERTAINTY      → preserve uncertainty and guard inference
TRUE_PHYSICAL_SAFETY_CONSTRAINT → enforce explicit safety rule
KEEPER_NONADHERENCE             → inform and continue advising; avoid rescue complexity
```

This principle applies across:
- alkalinity;
- calcium;
- magnesium;
- coupled three-part logic;
- nutrients;
- trace dosing;
- salinity;
- ammonia;
- future chemistry controllers.

---

# PART I — CORE ARCHITECTURE

# 0. Authority and implementation rules

## 0.1 V2 source of truth

Where V1 code or V1 canon conflicts with this document, V1 is historical reference material only.

V1 remains valuable for:
- discovered edge cases;
- historical scenarios;
- UI acceptance examples;
- regression comparison;
- failure modes;
- reasons earlier decisions were made.

V1 does not automatically determine V2 behaviour.

## 0.2 Parameter-specific canons sit below this document

This architecture is shared. Parameter-specific rules belong in later Parts of this same master canon:
- alkalinity;
- calcium;
- magnesium;
- three-part / ionic coupling;
- trace elements and ICP;
- nutrients;
- salinity;
- ammonia;
- surfaces, messaging and notices;
- simulation and golden scenarios.

A later Part may specialise this architecture but may not silently contradict an earlier shared rule. Any deliberate exception must be explicit, narrow, and identified by a stable rule ID.

## 0.3 Canon, tests and implementation move together

Any behavioural change requires:
1. canon change;
2. tests demonstrating the new behaviour;
3. implementation change.

A behaviour that exists only in code is not automatically canonical.
A rule that exists only in canon is not automatically enforced.

## 0.4 Live canon does not contain amendment archaeology

V2 canon describes what the system does now.

Historical reasoning, rejected alternatives and superseded decisions belong in a decision log and the V1→V2 coverage ledger.

## 0.5 Claude / Claude Code must challenge this specification where appropriate

When reviewing:
- do not agree merely because the specification says something;
- identify dimensional errors;
- identify circular inference;
- identify unreachable states;
- identify duplicated logic;
- identify safety conflicts;
- identify scientifically questionable assumptions;
- identify rules that cannot be deterministically tested.

Do not silently replace canon. Report a challenge first.

---

# 1. System objective

The Reef Chemistry Engine is a **state-aware advisory system** for interpreting reef-aquarium chemistry measurements and, where applicable, recommending controlled dosing actions.

It is not:
- an auto-dosing controller;
- a PID controller;
- a single-reading calculator;
- a collection of independent UI calculators;
- a system that must always produce an action.

The engine should prefer:
- correct uncertainty over false precision;
- interpretable evidence over repeated micro-adjustments;
- stable, explainable interventions over oscillating advice;
- explicit refusal over invented assumptions.

It must be deterministic, intervention-aware, time-aware, uncertainty-aware, unit-safe, auditable, independently testable and parameter-aware.

---

# 2. Four kinds of truth

## 2.1 Recorded facts

Things the app actually knows:
- measurements;
- actual dose changes;
- actual manual corrections;
- water changes;
- pump failures/calibrations;
- solution-batch changes;
- configured net volume.

Recorded facts preserve timestamps and historical values.

## 2.2 Configuration

Tank facts and user preferences used to interpret events:
- net volume;
- product/recipe;
- pump/channel;
- pump resolution;
- target range;
- enabled parameters;
- test method where relevant.

Configuration is versioned. A current change must not silently rewrite historical interpretation.

### 2.2A Effective-dated configuration

`SHARED-CONFIG-VERSION-001`

Every V2 configuration version that can affect a derived assessment stores at minimum:

```text
configVersionId
recordedAt
effectiveFrom
changedFields
source
```

A derived assessment resolves the configuration version that was effective at its explicit `assessmentAsOf`.

A current configuration value must never be backfilled into an earlier historical period merely because the older app did not version that field.

For migration from an unversioned legacy app:

- the legacy current settings may become the **first V2 configuration version**;
- its `effectiveFrom` is the confirmed V2 migration/activation time unless an earlier effective time is independently proven;
- pre-V2 raw facts remain preserved;
- a historical replay/recommendation that requires a configuration value for a time before the first proven configuration version is:

```text
NOT_RUN
reason = HISTORICAL_CONFIGURATION_UNAVAILABLE
```

- config-independent historical facts/analyses may still be shown or computed when their own requirements are satisfied.

Do not manufacture historical target ranges, net volume, potency, recommendation precision or other configuration merely to make replay complete.

## 2.3 Derived estimates

Examples:
- slope;
- trend confidence;
- consumption;
- maintenance requirement;
- effective potency;
- forecast.

Derived estimates retain their inputs, exclusions, method/version and confidence.

## 2.4 Recommendations

Examples:
- hold;
- retest;
- increase/decrease maintenance;
- offer a return plan;
- verify delivery.

A recommendation is not an implemented action. Only a confirmed actual action changes the event timeline.

---

# 3. Position and history answer different questions

## 3.1 Position comes from the latest valid measurement

If the latest valid alkalinity reading is 8.50 dKH, current measured alkalinity is 8.50 dKH.

A regression, fitted value, smoothed value or forecast must never replace the latest actual measurement when answering:

> Where is the tank now?

## 3.2 History answers behavioural questions

History may answer:
- direction;
- rate;
- consistency;
- consumption;
- response to intervention;
- potency evidence;
- forecast.

Therefore:

**latest valid measurement → position**

**historical evidence → behaviour**

These axes may legitimately disagree.

---

# 4. Fundamental dosing model

For a dosed parameter during an analytically usable interval:

\[
S = P D - C
\]

Where:
- \(S\) = observed parameter trajectory per unit time;
- \(P\) = effective delivered potency per programmed mL;
- \(D\) = delivered maintenance dose per unit time;
- \(C\) = biological/system consumption per unit time.

For alkalinity:
- \(S\): dKH/day
- \(P\): dKH/mL
- \(D\): mL/day
- \(C\): dKH/day

Therefore:

\[
C = P D - S
\]

\[
D_{maintenance} = rac{C}{P}
\]

Equivalent:

\[
D_{maintenance} = D_{current} - rac{S}{P}
\]

These equations are foundational.

The difficult part is establishing whether \(S\), \(P\) and \(D\) are valid, contemporaneous and sufficiently supported to use together.

---

# 5. Maintenance and deliberate level movement are separate

## 5.1 Automatic maintenance advice only stabilises

Automatic maintenance advice targets:

\[
S_{desired}=0
\]

Its purpose is to match consumption.

It does not intentionally drive the level toward the middle of the range.

## 5.2 Two independent questions

The engine always separates:
1. Is daily supply matching biological consumption?
2. Is the measured level where the keeper wants it?

Example:
Target 8.2–8.8 dKH.
Readings 7.80, 7.81, 7.79.

The tank is below range but stable. Maintenance may already be correct.

## 5.3 Stabilise first

If a level is moving unintentionally:
1. estimate maintenance requirement;
2. recommend only the amount needed to match consumption;
3. observe the response;
4. confirm stability;
5. only then offer deliberate movement toward the range.

## 5.4 Return plan is opt-in

Once stable and outside range, the engine may offer a separate **return plan**.

The user must opt in.

The return plan must never be silently embedded in the maintenance recommendation.

## 5.5 Safety exceptions must be explicit

Any exception allowing deliberate movement before ordinary stabilisation must be defined in the parameter-specific canon. Generic code may not invent one.

---

# 6. Domain state is multidimensional

V2 does not begin by selecting one UI-oriented wizard state from an ordered branch list.

It first describes reality on independent axes. Presentation is derived afterwards.

---

# 7. Core state dimensions

## 7.1 Position
For ordinary ranged parameters:
- BELOW_RANGE
- IN_RANGE
- ABOVE_RANGE
- ALERT_LOW
- ALERT_HIGH
- UNKNOWN

Parameters that do not scientifically fit ranges may define another vocabulary, e.g. ammonia UNDETECTABLE / DETECTABLE.

## 7.2 Trajectory
- RISING
- STABLE
- FALLING
- UNCERTAIN

Optional:
- RAPID_RISE
- RAPID_FALL

## 7.3 Evidence
- INSUFFICIENT
- PROVISIONAL
- SUFFICIENT
- HIGH_CONFIDENCE
- CONFOUNDED
- ANOMALOUS

Evidence may differ by question. Position can be known while trend is insufficient.

## 7.4 Intervention type
- NONE
- MAINTENANCE_DOSE_CHANGE
- LEVEL_CORRECTION
- RETURN_PLAN
- MANUAL_UNMODELLED_INTERVENTION

## 7.5 Intervention phase
- NOT_STARTED
- JUST_IMPLEMENTED
- OBSERVING
- ASSESSMENT_DUE
- ASSESSED
- INTERRUPTED
- EXPIRED

## 7.6 Intervention response attribution
- NOT_YET_ASSESSABLE
- EXPECTED
- PARTIAL
- NO_DETECTABLE_RESPONSE
- CONTRADICTORY
- OVER_RESPONSE
- INCONCLUSIVE

These describe the observed trajectory response relative to the intervention expectation.

## 7.6A Post-intervention position event
- NONE
- OVERSHOOT

`OVERSHOOT` is **orthogonal** to response attribution.

A response may simultaneously be:

```text
interventionResponse = EXPECTED
positionEvent = OVERSHOOT
```

because the intervention can produce the expected trajectory change while the current measured level crosses a target boundary.

Do not add `OVERSHOOT` back into the response-class enum.

## 7.7 Maintenance balance
- DEFICIT
- MATCHED
- EXCESS
- UNCERTAIN

## 7.8 Potency state
- THEORETICAL_ONLY
- EXPLORATORY
- PROVISIONAL
- CALIBRATED
- STRONGLY_CALIBRATED
- REASSESSING
- INVALID_CONTEXT

---

# 8. Presentation is derived from domain state

Example domain result:
- position = BELOW_RANGE
- trajectory = FALLING
- evidence = SUFFICIENT
- interventionType = MAINTENANCE_DOSE_CHANGE
- interventionPhase = OBSERVING
- interventionResponse = PARTIAL
- maintenanceBalance = DEFICIT

A UI layer may render:

> The change helped but hasn't gone far enough.

The sentence is not the domain state.

UI branch ordering must not define chemistry behaviour.

---

# 9. Immutable chronological event ledger

## 9.1 Measurement event

Minimum fields:
- eventId;
- parameter;
- timestamp;
- raw value;
- canonical unit;
- test method if known;
- effective uncertainty;
- repeat/confirmation group;
- validity flags;
- notes;
- edit audit.

## 9.2 Maintenance dose event

Minimum fields:
- eventId;
- parameter;
- effectiveFrom;
- programmedDosePerDay;
- productId;
- solutionBatchId;
- pump/channel;
- delivery schedule;
- theoretical potency;
- potency context.

Every actual dose change creates a new event. Never overwrite dose history.

## 9.3 Manual correction event
Store:
- parameter;
- product/batch;
- intended and actual amount;
- timestamp/schedule;
- potency context;
- expected contribution.

## 9.4 Return-plan event
Store:
- parameter;
- starting measured level;
- destination;
- maintenance dose at start;
- temporary schedule;
- intended direction;
- predicted duration;
- arrival criteria;
- expiry;
- return policy.

## 9.5 Water-change event
Store:
- timestamp;
- volume/fraction;
- replacement chemistry where known;
- confidence in replacement chemistry.

## 9.6 Equipment/delivery events
Examples:
- missed dose;
- extra dose;
- pump interruption;
- pump failure;
- calibration;
- replacement;
- channel/line change.

## 9.7 Potency-context events
Examples:
- new batch;
- recipe/concentration change;
- product change;
- net-volume change;
- material delivery-configuration change.

---

# 10. Delivery basis: confirmed programmed schedule is first-class

`SHARED-DELIVERY-BASIS-001`

The shared engine distinguishes:

```text
VERIFIED_DELIVERY
CONFIRMED_PROGRAMMED_SCHEDULE
COMMAND_ONLY_UNCONFIRMED
```

### VERIFIED_DELIVERY

Use when actual individual delivery events are directly available from:
- trustworthy telemetry;
- explicit confirmed manual-delivery records;
- another verified source.

This is useful but **not universally required**.

### CONFIRMED_PROGRAMMED_SCHEDULE

A programmed dosing schedule is a **first-class analytical basis** when:
- the programmed rate/schedule is known;
- its effective start/stop time is known with sufficient confidence;
- no missed-dose/outage event is known;
- delivery context is stable.

For empirical potency, stable systematic pump bias may be absorbed into effective potency expressed as effect per **programmed mL** within that delivery context.

Physical pump telemetry is therefore optional rather than a prerequisite for ordinary control or potency learning.

### COMMAND_ONLY_UNCONFIRMED

A nominal setting with unknown implementation/execution is not treated as confirmed delivery history.

Do not silently convert it into either:
- `VERIFIED_DELIVERY`; or
- `CONFIRMED_PROGRAMMED_SCHEDULE`.

### Integrated intervals

Where exact mixed-interval integration is scientifically allowed, integrated volume may come from:
- verified delivery; or
- a reconstructable confirmed programmed schedule.

If neither exists:

```text
mixedIntervalIntegration = NOT_RUN
```

and the parameter canon must segment/confound the affected interval rather than inventing delivered volume.

This matters near:
- dose changes;
- partial days;
- missed doses;
- outages;
- corrections;
- return plans.

A configured 10 mL/day rate does not mean 10 mL was instantly delivered when the setting changed.

---

# 11. Clean analytical segments

## 11.1 Segment is a first-class object

A segment should retain:
- parameter;
- start/end;
- dose context;
- potency context;
- included measurement clusters;
- interventions;
- hard/soft confounders;
- eligibility for trend;
- eligibility for consumption;
- eligibility for potency learning.

## 11.2 Dose/context boundaries matter

9 mL/day → clean segment A  
dose change → boundary  
10 mL/day → clean segment B

Ordinary control logic must not fit one simple slope across both and combine it with only the newest dose.

## 11.3 Mixed intervals

Integrated modelling may use either eligible basis from `SHARED-DELIVERY-BASIS-001`:
- `VERIFIED_DELIVERY`; or
- `CONFIRMED_PROGRAMMED_SCHEDULE` when the schedule and effective timing are reconstructable.

If neither basis exists:

```text
mixedIntervalIntegration = NOT_RUN
```

and the parameter policy must segment/confound rather than guess.

A mixed interval is not automatically eligible for clean constant-dose trend, intervention-response or potency-learning calculations.

## 11.4 Confounder treatment is parameter-specific

Shared mechanisms:
- exclude/break;
- mathematically normalize;
- down-weight;
- ignore when immaterial.

The parameter canon owns the choice.

---

# 12. Known corrections/external inputs

The V1 principle is retained:

> Known external additions must not be mistaken for biological consumption changes.

V2 uses actual delivery history.

Do not impose a universal fictional three-day linear correction profile.

Immediate correction → record immediate input.  
Staged correction → record the real staged schedule.

Unknown/partially known corrections may confound a segment.

---

# 13. Exact time

All rates use exact elapsed time:

\[
\Delta Days = rac{\Delta Hours}{24}
\]

Never infer elapsed time from date labels alone.

---

# 14. Measurement clusters

Repeat tests close together for confirmation are one evidence cluster, not several independent time points.

A cluster can produce a representative value such as the median while preserving raw tests.

A repeat cluster must not falsely satisfy an independent-reading requirement.

---

# 15. Outliers

## 15.1 Suspicious is not invalid

An unexpected result becomes SUSPECT, not silently deleted.

## 15.2 Repeat outcomes
A repeat may:
1. confirm the shift;
2. disprove the original reading;
3. remain inconclusive.

## 15.3 Real regime shifts must survive
8.5, 8.5, 7.8, repeat 7.82 = genuine shift, not an outlier merely because history disagrees.

## 15.4 Preserve raw history
Excluded measurements retain:
- raw value;
- exclusion status;
- reason;
- confirmation relationship.

---

# 16. Trend estimation

## 16.1 Two usable independent points

\[
S=rac{A_2-A_1}{\Delta t}
\]

## 16.2 Multi-point trend

Default V2 estimator once sufficient points exist:

**Theil–Sen regression.**

Rationale:
- robust to a single abnormal hobby test;
- auditable;
- appropriate for sparse data;
- does not require normally distributed residuals.

Ordinary least squares may be diagnostic but is not automatically the control slope.

## 16.3 Trend output
Return:
- slope;
- direction;
- elapsed span;
- independent cluster count;
- uncertainty/confidence;
- residual diagnostics;
- estimator;
- exclusions;
- segment id.

---

# 17. One Evidence Engine

The shared Evidence Engine answers separate questions:
- Is trajectory established?
- Is consumption estimable?
- Is an intervention assessable?
- Is a suspicious measurement confirmed?
- Is an intervention eligible for potency learning?
- Is another intervention justified?

Different questions may have different thresholds, but evidence rules have one explicit owner.

---

# 18. Evidence is not only a reading count

Evidence may depend on:
- independent cluster count;
- elapsed time;
- signal magnitude;
- uncertainty;
- consistency;
- intervention timing;
- confounders;
- parameter biology;
- expected response.

“Three readings” is not universally synonymous with “enough evidence”.

---

# 19. Signal relative to uncertainty

V2 must distinguish mathematical movement from detectable movement.

Conceptually:

\[
SNR=rac{Signal}{Uncertainty}
\]

Exact formulas/thresholds are inference- and parameter-specific.

A non-zero slope is not automatically actionable.

---

# 20. Consumption is a relatively fast-moving latent variable

Consumption may genuinely change with:
- coral growth;
- calcifying biomass;
- light;
- temperature;
- nutrients;
- pH/carbonate conditions;
- biological events.

Recent clean evidence should dominate current estimates.

Old demand must not indefinitely anchor current recommendations.

The engine must allow change points/new consumption regimes.

---

# 21. Potency is a relatively slow-moving system variable

Effective delivered potency may change with:
- new batch;
- recipe error;
- concentration change;
- pump calibration;
- under-delivery;
- line loss;
- precipitation;
- volume assumption;
- delivery configuration.

Core firewall:

**No dose change + changed tank slope → primarily consumption evidence.**

**Controlled dose change + changed slope → may provide potency evidence.**

---

# 22. Theoretical potency

Each dosing context starts from theoretical potency calculated from:
- known chemistry/recipe; or
- manufacturer potency;
- effective volume where required.

Exact formulas belong to parameter canons.

Theoretical potency remains selected until sufficient empirical evidence supports a learned value.

---

# 23. Effective potency learning

For nearby clean dose states:

\[
S_1=P D_1-C
\]

\[
S_2=P D_2-C
\]

Assuming approximately stable consumption across the local comparison:

\[
P_i=rac{S_2-S_1}{D_2-D_1}
\]

This produces one potency observation.

Learning is passive; do not deliberately perturb a stable reef solely for calibration.

A candidate observation may require:
- clean pre/post segments;
- known doses;
- known context;
- enough independent measurements;
- enough elapsed time;
- enough signal;
- no hard confounder;
- no interrupted intervention.

Store:
- pre/post dose;
- delta dose;
- pre/post slopes;
- slope confidence;
- calculated potency;
- theoretical potency;
- ratio;
- durations;
- measurement counts;
- signal quality;
- confounders;
- inclusion/exclusion reason.

Exact qualification thresholds belong to the parameter canon.

---

# 24. Learned potency is effective delivered potency

Tank response does not isolate reservoir chemistry.

Conceptually:

\[
P_{observed}=P_{chemical}	imes PumpFactor	imes VolumeFactor	imes DeliveryFactor
\]

User-facing language may say:
- effective potency;
- effective delivery;
- effective delivery is approximately X% of expected.

It must not claim a reservoir concentration is definitively wrong unless concentration itself was independently known.

---

# 25. Potency contexts

Potency evidence belongs to a context including:
- tank/system;
- parameter;
- product;
- solution batch;
- pump/channel;
- effective volume;
- delivery configuration.

Context changes may start a new context or reduce confidence.

Historical observations are retained.

---

# 26. Potency confidence and selected potency

Supported states:
- THEORETICAL_ONLY
- EXPLORATORY
- PROVISIONAL
- CALIBRATED
- STRONGLY_CALIBRATED
- REASSESSING

Before calibration:

\[
P_{selected}=P_{theoretical}
\]

After sufficient calibration:

\[
P_{selected}=P_{learned}
\]

Large discrepancies must not silently create large dosing changes.

The Potency Engine outputs:
- theoreticalPotency;
- learnedPotency;
- confidence;
- warnings;
- selectedPotency.

The dosing engine consumes `selectedPotency` and must not independently re-learn potency.

---

# 27. Consumption and maintenance

Where evidence is valid:

\[
C=P_{selected}D-S
\]

\[
D_{maintenance}=rac{C}{P_{selected}}
\]

The estimate inherits uncertainty from:
- trend;
- dose history;
- potency;
- confounders.

A mathematical estimate may exist while recommendation confidence remains too low to act.

---

# 28. Negative / impossible inferred consumption

A negative biological-consumption result indicates the simple maintenance model does not fully explain the interval.

The engine must separate:
- arithmetic result;
- physical interpretability;
- recommendation eligibility.

It must not guess a cause unless that cause is explicitly recorded.

The V1 principle is retained: an impossible mass-balance inference must not automatically drive a large dose change.

Exact Alk/Ca/Mg handling belongs in those parameter canons.

---

# 29. Recommendation gating

A calculated maintenance dose is not automatically a recommendation.

The Recommendation Engine considers:
- data quality;
- trajectory evidence;
- intervention state;
- intervention phase;
- response;
- potency confidence;
- target position;
- safety limits;
- empirical sanity checks;
- forecast;
- whether the previous intervention has been adequately assessed.

---

# 30. HOLD is a full recommendation

HOLD is appropriate when:
- evidence is insufficient;
- an intervention is still being observed;
- response is improving but not fully assessable;
- movement is below actionable signal;
- an outlier is unresolved;
- rapid manual changes make inference unreliable;
- maintenance already matches consumption;
- no safe new action is justified.

The engine must not force an action merely to provide an answer.

---

# 31. Intervention records

Every actual dose change creates an intervention containing:
- parameter;
- type;
- old dose;
- new dose;
- actual start time;
- originating recommendation id if applicable;
- reason;
- baseline measurements;
- pre-change slope;
- selected potency;
- predicted response;
- expected evidence/retest timing.

Recommendation alone does not start an intervention.

---

# 32. Expected response

For a maintenance-dose change, assuming approximately unchanged consumption:

\[
S_{pred,new}=S_{pre}+P_{selected}(D_{new}-D_{old})
\]

This creates an explicit expectation against which post-change evidence can be judged.

---

# 33. Interrupted intervention

If another dose change occurs before the previous intervention can be assessed:
- previous phase → INTERRUPTED;
- do not label success;
- do not label failure;
- retain duration and measurements;
- start a new intervention for the latest actual dose;
- restart ordinary clean post-change evidence requirements.

Interrupted interventions are normally ineligible for strong potency calibration.

---

# 34. Post-intervention response

Possible formal response-attribution classes:
- EXPECTED
- PARTIAL
- NO_DETECTABLE_RESPONSE
- CONTRADICTORY
- OVER_RESPONSE
- INCONCLUSIVE

`OVERSHOOT` is not a response-attribution class. It is the orthogonal post-intervention position event defined in Part I §7.6A.

Examples:

PARTIAL:
- before −0.25 dKH/day;
- after increase −0.07 dKH/day.

This usually supports HOLD while additional evidence accumulates rather than immediate re-adjustment.

NO_DETECTABLE_RESPONSE:
- expected change should have been detectable;
- enough time has passed;
- no meaningful response appeared.

CONTRADICTORY:
- response remains materially opposite to the intended direction/expectation.

OVER_RESPONSE:
- magnitude exceeds expected response materially.

Position-event assessment is separate:
- `OVERSHOOT` means the actual current level crossed the relevant target boundary in the wrong direction;
- it may coexist with any compatible response-attribution class.

Exact response bands and overshoot thresholds belong to parameter canons.

---

# 35. Anti-chatter

V2 must resist increase/decrease oscillation caused by:
- test noise;
- marginal slopes;
- incomplete post-change evidence;
- repeated small adjustments.

Require stronger justification before reversing a recent ordinary dosing decision unless safety requires action.

This is not a high-frequency control system.

---

# 36. Return plans

A return plan intentionally moves a stable out-of-range level.

Store:
- parameter;
- starting measured level;
- target range;
- destination;
- maintenance estimate;
- temporary schedule;
- expected direction;
- allowed rate;
- predicted duration;
- retest schedule;
- arrival criteria;
- expiry;
- return-to-maintenance behaviour.

## 36.1 Destination
Where no explicit preferred value exists:

\[
AimPoint=rac{RangeMin+RangeMax}{2}
\]

Do not add a separate user-set ideal point without demonstrated need.

## 36.2 Opt-in
Offering a return plan does not alter maintenance until the user accepts/implements it.

## 36.3 No ambiguous combined dose
Maintenance and deliberate movement remain separately represented.

---

# 37. Forecasting

Short-term linear forecast may be used for safety and retest timing:

\[
A(t)=A_{now}+St
\]

For \(S>0\):

\[
T_{upper}=rac{Upper-A_{now}}{S}
\]

For \(S<0\):

\[
T_{lower}=rac{A_{now}-Lower}{|S|}
\]

Forecasts are estimates, not guarantees.

Horizon limits are parameter-specific.

---

# 38. Dynamic Retest Scheduler

Retesting is an engine output.

The scheduler asks:

> When will another measurement become useful or necessary?

Inputs may include:
- expected intervention signal;
- test uncertainty;
- slope magnitude;
- current position;
- boundary proximity;
- forecasted crossing;
- intervention phase;
- unresolved outlier;
- parameter biology;
- routine cadence.

The next recommended test is normally the earliest applicable:
- safety/risk requirement;
- intervention assessment requirement;
- confidence-building requirement;
- forecast-boundary requirement;
- routine cadence.

Suspicious measurements may trigger an immediate repeat.

---

# 39. Water changes

V2 rejects both blanket rules:
- every water change breaks every trend;
- every water change remains in every trend.

Water changes are parameter-specific disturbances.

Possible treatments:

## 39.1 Negligible expected effect
If expected parameter shift is below meaningful measurement resolution, the event may remain in the ordinary window.

## 39.2 Material effect, chemistry known reliably
The parameter module may mathematically normalize it.

## 39.3 Material effect, chemistry unknown/unreliable
Confound or break the clean segment.

Exact thresholds/formulas belong to parameter canons.

---

# 40. Empirical bracketing

Retain V1's empirical bracket as a secondary sanity mechanism:
- recent dose where level fell;
- recent dose where level rose.

Role:
- sanity envelope;
- conflict detector;
- historical empirical evidence.

It is not the primary potency learner.

A model/bracket conflict must not be silently hidden. Preserve it in confidence/audit logic.

---

# 41. Safety uses physical effect where possible

Avoid treating raw mL as universally meaningful.

Prefer:

\[
EffectChange=|\Delta D|	imes P_{selected}
\]

Safety may also use:
- percentage dose change;
- pump resolution;
- product-specific volume practicality;
- parameter rate rail.

Use the strictest applicable constraint.

Raw mL remains relevant where physically appropriate, but 2 mL is not inherently the same intervention on every tank/product.

---

# 42. Cross-parameter reasoning

Cross-parameter chemistry is primarily a plausibility/advisory layer unless a later parameter-specific Part of this master canon explicitly grants stronger authority.

It may:
- detect implausible inferred consumption;
- surface relationships;
- cross-check demand.

It must not automatically invalidate a directly supported independent parameter trend.

Explicit V1 correction:

**Stable alkalinity does not prove falling calcium cannot reflect calcification.**

Alkalinity replacement may be correct while calcium replacement is insufficient.

---

# 43. One engine, parameter-specific science

One Reef Chemistry Engine does not mean one algorithm.

Examples:
- alkalinity: frequent intervention-aware dosing control;
- calcium: slower evidence;
- magnesium: potentially much stronger evidence requirements;
- phosphate: persistence/count behaviour, not Alk-style dosing;
- ammonia: detectability;
- trace: ICP/correction-based logic.

Shared:
- event ledger;
- evidence architecture;
- auditability;
- source-of-truth rule;
- presentation contract.

---

# 44. Unit safety

Every field has one dimension.

Examples:
- ParameterLevel → dKH or ppm
- DailyDose → mL/day
- Potency → dKH/mL or ppm/mL
- Consumption → dKH/day or ppm/day
- Trajectory → dKH/day or ppm/day
- Volume → L
- Time → hours/days

Never store a level and a dose in the same field depending on state.

Use separate typed fields such as:
- aimPointLevel;
- recommendedDosePerDay;
- plannedDosePerDay.

---

# 45. Single-source rule

The Reef Chemistry Engine owns:
- position;
- trajectory;
- evidence;
- consumption;
- selected potency;
- maintenance requirement;
- intervention response;
- recommendation;
- next-test timing.

Dashboard, wizard, confirmation, history, Insights and notices may render/projection-format these outputs but must not independently recompute them.

A second chemistry implementation is a defect even if it matches today.

---

# 46. History truthfulness

History records what was known/recommended at the time.

Changing current:
- target range;
- product;
- potency calibration;
- algorithm version;

must not silently rewrite historical recommendations.

A modern retrospective re-analysis, if ever shown, must be separate from “what the app said then”.

---

# 47. Audit record

Every actionable assessment should retain:
- engine version;
- canon version;
- parameter;
- latest measurement;
- available clusters;
- used clusters;
- excluded clusters;
- exclusion reasons;
- segment;
- position;
- trend estimator;
- slope;
- trend confidence;
- current delivered dose;
- intervention state;
- theoretical potency;
- learned potency;
- selected potency;
- potency confidence;
- consumption estimate;
- maintenance estimate;
- uncapped ideal recommendation;
- constraints applied;
- final recommendation;
- expected post-change slope;
- short-term forecast;
- next-test recommendation;
- recommendation confidence;
- explanation inputs.

---

# 48. Recommendation confidence

Supported:
- LOW
- MODERATE
- HIGH

Inputs may include:
- trend evidence;
- signal/noise;
- dose-history certainty;
- intervention completeness;
- potency confidence;
- confounders;
- recent-consumption agreement;
- empirical-bracket consistency.

A high-confidence recommendation must not be built from low-confidence upstream evidence.

---

# 49. Recommendation vocabulary

Architecture-level outputs may include:
- NO_CHANGE
- HOLD_CURRENT_DOSE
- TEST_AGAIN
- REPEAT_TEST_NOW
- INCREASE_MAINTENANCE_DOSE
- DECREASE_MAINTENANCE_DOSE
- OFFER_RETURN_PLAN
- START_RETURN_PLAN
- CONTINUE_RETURN_PLAN
- STOP_RETURN_PLAN
- RETURN_TO_MAINTENANCE
- VERIFY_DOSER
- VERIFY_SOLUTION
- VERIFY_CONFIGURATION
- INSUFFICIENT_DATA

Parameter canons may specialise this set.

---

# 50. Calculation and presentation are separate

Example structured output:

```text
position: BELOW_RANGE
trajectory: FALLING
trajectorySlope: -0.12 dKH/day
evidence: SUFFICIENT
maintenanceBalance: DEFICIT
currentDose: 9.0 mL/day
maintenanceEstimate: 10.7 mL/day
intervention: NONE
recommendation: INCREASE_MAINTENANCE_DOSE
recommendationConfidence: HIGH
nextTest: 48 hours
```

The message layer may explain this.

It must not recompute 10.7 mL/day.

---

# 51. Testing strategy

## 51.1 Mathematical unit tests
Examples:
- potency formulas;
- exact-time slope;
- robust slope;
- consumption;
- maintenance;
- forecast;
- safety conversions;
- parameter-specific water-change normalization where adopted.

## 51.2 State/scenario tests
Given an explicit event history, assert:
- state dimensions;
- recommendation;
- confidence;
- next-test class;
- potency-evidence eligibility.

## 51.3 Long simulations

Conceptual model:

\[
A_{new}=A_{old}+(PD-C)\Delta t+KnownExternalInputs+MeasurementNoise
\]

Vary:
- true potency;
- consumption;
- consumption shifts;
- dose history;
- corrections;
- return plans;
- missed doses;
- pump failures;
- water changes;
- measurement noise;
- cadence;
- target changes;
- batches.

Tests evaluate decision quality, not merely formula execution.

---

# 52. V1 golden tests

Retain the V1 golden corpus as legacy comparison.

It answers:

> Where does V2 intentionally differ from V1?

It does not answer:

> V2 is wrong because it differs from V1.

Every mismatch should be classified:
- intended improvement;
- accepted design change;
- likely regression;
- unresolved;
- obsolete V1 behaviour.

Never blindly update a fingerprint without inspecting changed cases.

---

# 53. Mandatory V1→V2 coverage ledger

Before V2 is complete, every substantive V1 concept is assigned:
- KEEP
- KEEP BUT RESTRUCTURE
- REPLACE
- REMOVE
- REVALIDATE SCIENTIFICALLY
- OPEN DECISION

Initial mapping:

| V1 concept | V2 disposition |
|---|---|
| Current position = latest valid reading | KEEP |
| History determines trend, not position | KEEP |
| Maintenance vs level correction | KEEP / strengthen |
| Stabilise first | KEEP — locked |
| Return plan opt-in | KEEP |
| One engine, surfaces render | KEEP |
| Recommendation ≠ implementation | KEEP |
| Historical dose events | KEEP / strengthen |
| Expected response after dose change | KEEP / strengthen |
| 17-state first-match domain model | REPLACE |
| Overloaded state names | REPLACE |
| Overloaded level/dose target field | REPLACE |
| Reference UI cards | KEEP as presentation acceptance fixtures |
| Fixed 14-day Alk window as universal current-control window | REPLACE with segment/evidence model |
| Unspecified ordinary slope fitting | KEEP concept / REPLACE estimator |
| Linear three-day correction subtraction | REPLACE with actual delivery history |
| Raw-mL staging thresholds | REPLACE with effect/confidence safety |
| Historical dose bracketing | KEEP BUT RESTRUCTURE |
| Strength learned vaguely from history | REPLACE with formal potency learner |
| Water changes always stay in trend | REVALIDATE / hybrid materiality rule |
| Magnesium maintenance never tuned | REVALIDATE |
| Hard Mg gate withholding Alk/Ca increases | REVALIDATE |
| Stable Alk means falling Ca is not calcification | REPLACE |
| Negative-consumption protection | KEEP principle / REWRITE mechanism |
| Post-change contradiction scenarios | KEEP / formalise through response axis |
| One live dose expectation | KEEP / formalise as intervention |
| Cross-surface parity | KEEP |
| History stores what was said then | KEEP |
| Setup facts-vs-judgements philosophy | KEEP pending UI canon |
| Nutrients need parameter-specific logic | KEEP |
| Ammonia does not fit ranged trend model | KEEP |
| Health score deletion | KEEP in presentation canon |
| No surface-local chemistry reasoning | KEEP |

The ledger must be completed against all substantive V1 sections before V2 migration is declared complete.

---

# 54. Migration architecture

Do not mutate V1 until it becomes V2.

Preferred structure:

```text
Existing application
│
├── V1 chemistry engine        [frozen reference]
├── V2 chemistry engine        [new implementation]
├── V1/V2 comparison harness
└── existing UI
      └── adapter to selected engine
```

Run both against the same historical/synthetic datasets during development.

Inspect and classify differences.

Switch production to V2 only after V2 passes its own canonical simulations and the migration review is complete.

---

# 55. V2 master-canon hierarchy

V2 is maintained as one authoritative document with Parts:

```text
PART I   — Core architecture
PART II  — Shared measurement, evidence, segmentation & intervention
PART III — Alkalinity engine
PART IV  — Calcium engine
PART V   — Magnesium engine
PART VI  — Three-part / ionic coupling
PART VII — Trace elements & ICP
PART VIII— Nutrients, salinity & ammonia
PART IX  — Surfaces, messaging & notices
PART X   — Simulation, golden scenarios & migration
```

Temporary drafting files may be used during development, but accepted content is folded back into this master canon and the temporary file ceases to be authoritative.

Cross-cutting behaviour is defined once at the highest appropriate Part.


# 56. Explicitly deferred numerical policies

This shared architecture intentionally leaves **parameter-specific numerical policy** to the owning parameter Part.

## Closed for frozen Alk

The following are no longer open for alkalinity because Part III has frozen them:
- Alk base analytical uncertainty: 0.10 dKH;
- Alk ordinary supported-slope controller constant and uncertainty rule;
- Alk rapid-change threshold: 0.30 dKH/day;
- Alk correction/return rails;
- Alk potency promotion thresholds;
- Alk water-change materiality handling;
- Alk target/outer-bound defaults;
- Alk dose-step caps;
- Alk intervention-response timing and classification;
- Alk independent-cluster selection (`ALK-INDEPENDENT-SELECTION-001`, Freeze 5);
- Alk suspicious-reading detection basis (`ALK-SUSPECT-DETECTION-001`, Freeze 5);
- Alk negative-consumption materiality boundary (`ALK-NEGATIVE-MATERIALITY-001`, Freeze 5);
- Alk retest-scheduler parameterisation (`ALK-RETEST-SCHEDULER-001`, Freeze 5);
- Alk water-change normalization confidence tier
  (`ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001`, Freeze 5).

These values do not become shared defaults for other parameters. In particular, a Freeze-5
determination that reuses an existing Alk constant is an alkalinity decision only, and is
not evidence that another parameter may reuse the same number.

## Still deferred to later parameter Parts

Examples include:
- Ca/Mg base analytical uncertainty and evidence windows;
- Ca/Mg signal/action thresholds;
- whether Mg maintenance is practically learnable;
- final non-safety Mg coupling/gate behaviour;
- trace-element rules;
- nutrient persistence/count thresholds;
- parameter-specific notice wording not already governed by Part IX.

These are not omissions.

Claude Code must not invent them from V1 or borrow Alk values unless the relevant later Part explicitly adopts them.

---

# 57. Non-negotiable invariants

1. Latest valid measurement is never replaced by a fitted value for current position.
2. Recommendation is never treated as implemented without an actual event.
3. Ordinary control trend never silently crosses a dose/potency-context boundary.
4. A repeat-test cluster never counts as multiple independent time points.
5. A suspect measurement is never silently deleted.
6. A confirmed regime shift is not removed merely because it disagrees with history.
7. The dosing engine consumes one selected potency and does not independently recalibrate it.
8. A changed tank slope at unchanged dose does not by itself change potency.
9. An interrupted intervention is not labelled failed solely because it was interrupted.
10. A return plan never silently contaminates maintenance dose.
11. Automatic maintenance advice targets stability, not target acquisition.
12. Surfaces never recompute chemistry verdicts.
13. A field never stores different physical dimensions by state.
14. Historical recommendations remain what was actually recommended then.
15. HOLD remains possible whenever evidence is insufficient or an intervention is still interpretable.
16. Safety constraints cannot be bypassed by presentation code.
17. V1 behaviour is never copied solely because a golden test exists.
18. Every substantive V1 rule is accounted for in the coverage ledger before migration completion.

---

# 58. Definition of architecture completion

This architecture phase is complete only when:
- shared primitives are defined;
- later Parts can reference them without redefining them;
- V1→V2 ledger covers all major V1 concepts;
- core domain state does not depend on UI branch order;
- fields are dimension-safe;
- intervention history is first-class;
- potency learning has one owner;
- evidence has one owner;
- retest scheduling has one owner;
- current position and historical trajectory are separate;
- maintenance and deliberate movement are separate;
- simulation can exercise the architecture.

---

# 59. Next Part to complete

The next section to be added to this same master canon is:

**PART III — Alkalinity Engine**

Before Part III is written, Part II is the authoritative shared analytical foundation. Part III must plug alkalinity-specific values into it rather than creating a second evidence or intervention model.


# 60. Locked owner decision — stabilise first

**DECIDED: automatic dosing advice stabilises first.**

For a moving out-of-range dosed parameter:
- estimate the maintenance dose that should match consumption;
- recommend that maintenance change only;
- observe and confirm the response;
- do not add a hidden correction component.

Once the level is stable and remains outside the target range:
- the engine may offer a separate opt-in return plan.

This is symmetrical for high and low levels unless a parameter-specific safety exception is explicitly defined.

This is a V2 architectural invariant.


---

# PART II — SHARED MEASUREMENT, EVIDENCE, SEGMENTATION & INTERVENTION

The rules in this Part are shared analytical machinery. Parameter-specific sections later in this master canon plug their own biological and safety thresholds into this machinery rather than creating parallel evidence engines.

# 0. Purpose

This canon defines, in implementation-level detail:

- how measurements enter the engine;
- how repeats are grouped;
- how time is represented;
- how measurement uncertainty is represented;
- how suspicious readings are handled;
- how analytical segments are constructed;
- how known external inputs are normalized;
- how robust trends are estimated;
- how evidence is graded;
- how dose changes become interventions;
- how post-change response is evaluated;
- how interrupted interventions are handled;
- how water changes are classified;
- how retest timing is calculated;
- what must be stored for audit;
- what later parameter-specific Parts must supply.

The objective is to ensure that every future parameter engine uses the same analytical grammar.

A parameter may have different thresholds.

It may not silently invent a second evidence engine.

---

# 1. Governing principles

## 1.1 Position, trajectory, consumption and potency are separate inferences

The engine must not treat one as a substitute for another.

- Latest valid measurement answers **position**.
- Historical measurements answer **trajectory**.
- Dose history plus trajectory may answer **consumption**.
- Controlled dose-response history may answer **effective potency**.

## 1.2 Evidence is question-specific

The same dataset may be:

- sufficient to say where alkalinity is;
- sufficient to say it is falling;
- insufficient to calculate consumption;
- ineligible for potency learning.

The engine must preserve those distinctions.

## 1.3 No hidden data stretching

If the required evidence is not present inside the permitted lookback/segment:

**refuse or remain provisional.**

Do not silently reach farther back until a number can be produced.

## 1.4 Exact event timing is authoritative

Use exact timestamps and actual event order.

Calendar labels are presentation only.

## 1.5 Known interventions are not noise

A logged correction, dose change, water change, or pump outage is part of the physical history.

The engine must either:

- model it;
- normalize it;
- mark it as a confounder;

but never simply pretend it did not occur.

## 1.6 Missing information is different from conflicting information

Missing:
- no dose history;
- no net volume;
- no potency;
- too few measurements.

Conflicting:
- measurement appears inconsistent with adjacent data;
- model predicts one response and tank shows another;
- two systems disagree.

The engine must distinguish them because the next action differs.

---

# 2. Canonical time representation

## 2.1 Store timestamps in an unambiguous absolute representation

Internally use an offset-aware timestamp or UTC instant.

Retain local timezone metadata where needed for display.

## 2.2 All elapsed-time calculations use seconds/hours

For two timestamps:

\[
\Delta t_{days} = \frac{t_2-t_1}{86400\ seconds}
\]

No rate calculation may use:

- number of date labels crossed;
- rounded “days ago”;
- calendar-day subtraction without time.

## 2.3 Display rounding must never enter calculations

If a reading is stored as 8.849 dKH and displayed as 8.8:

- position;
- trend;
- consumption;
- intervention response;

must use 8.849.

## 2.3A Legacy timestamps without a proven absolute instant

`SHARED-LEGACY-TIME-001`

New V2 events must satisfy §2.1 and store an unambiguous absolute instant.

Legacy imports may not.

Classify legacy time provenance explicitly:

```text
EXACT_ABSOLUTE
RECONSTRUCTED_WITH_PROVENANCE
LOCAL_TIME_ZONE_UNKNOWN
DATE_ONLY
```

Rules:

- `EXACT_ABSOLUTE` may participate normally.
- `RECONSTRUCTED_WITH_PROVENANCE` may participate normally only when the historical timezone/offset is independently proven and the reconstruction is recorded.
- `LOCAL_TIME_ZONE_UNKNOWN` remains visible in history and may support event order where that order is independently unambiguous, but it is **not** eligible for calculations requiring exact elapsed seconds across an offset/DST ambiguity.
- `DATE_ONLY` remains visible and may support current position if otherwise valid, but it is not an exact trend point where assumed time-of-day could change slope, clustering or intervention attribution.

Forbidden:

- silently assigning noon;
- silently applying the keeper's current timezone to old local timestamps;
- silently treating a local `HH:MM` as an absolute instant.

Missing behaviour for exact-time-dependent analysis:

```text
DEGRADE
timeCapability = IMPRECISE_OR_ABSOLUTE_TIME_UNKNOWN
exactElapsedTimeAnalysis = NOT_RUN
```

A new clean V2 regime may begin once precise absolute timestamps are available.

## 2.4 Event ordering at identical timestamps

Where events share a timestamp, ordering must be explicit.

Recommended precedence for deterministic replay:

1. measurement representing water **before** an intervention, if explicitly marked pre-event;
2. delivery/intervention event;
3. measurement representing water **after** an intervention, if explicitly marked post-event;
4. otherwise preserve insertion/order metadata and mark ambiguity if physical ordering is unknown.

A parameter-specific inference must not assume whether a measurement occurred before or after a same-time intervention if the record does not establish it.

---

# 3. Measurement event model

Each raw measurement event should contain at least:

```text
measurementId
parameter
timestamp
rawValue
canonicalUnit
methodId?                  // optional
userEnteredPrecision?      // optional metadata, not automatically uncertainty
baseUncertainty
source                     // manual, imported, device, etc.
repeatGroupId?             // explicit repeat relationship
prePostEventRelation?      // optional pre/post relationship
status                     // VALID, SUSPECT, INVALID, SUPERSEDED
invalidReason?
notes?
createdAt
editedAt?
```

## 3.1 `rawValue` is preserved

Never overwrite the original measurement with:

- rounded display value;
- cluster median;
- fitted value;
- corrected value.

Those are derived values.

## 3.2 `baseUncertainty`

`baseUncertainty` is the engine's working estimate of measurement uncertainty in the parameter's native unit.

It is **not** necessarily equal to:

- display resolution;
- manufacturer's stated accuracy;
- standard deviation.

Parameter canons define how this value is chosen.

## 3.3 User entry validation

At ingestion, validate:

- numeric finite value;
- supported unit;
- physically representable range;
- timestamp validity;
- parameter identity.

A value being outside a recommended or safety range is **not** a validation failure.

Unusual biology is still data.

---

# 4. Measurement validity states

## 4.1 VALID

Usable unless another inference-specific rule excludes it.

## 4.2 SUSPECT

Plausible but inconsistent enough with recent evidence that confirmation is advisable.

A SUSPECT reading:
- remains visible;
- remains in history;
- does not automatically become INVALID;
- may block ordinary dose action until resolved where the parameter canon requires.

## 4.3 INVALID

Known not to represent a usable measurement.

Examples may include:
- user explicitly marks test as invalid;
- impossible parse/unit error;
- known contaminated test;
- known device malfunction tied to the reading.

INVALID readings are retained historically but excluded from analysis.

## 4.4 SUPERSEDED

Used only where product behaviour explicitly replaces an earlier record while retaining it for audit.

A repeat test should normally **not** supersede the first reading merely because it differs.

The relationship should be represented through a measurement cluster.

---

# 5. Measurement clusters

## 5.1 Purpose

Multiple tests performed close together to confirm one measurement represent one **testing episode**, not multiple independent observations through time.

A cluster prevents repeated testing from falsely satisfying evidence-count rules.

## 5.2 Explicit grouping wins

If the user marks a test as a repeat/confirmation of another reading, use that relationship.

## 5.3 Automatic grouping

Where no explicit relationship exists, the implementation may automatically group readings if all of the following hold:

- same parameter;
- same test method or compatible method;
- timestamps within an internal `repeatClusterWindow`;
- no relevant intervention between them.

The exact `repeatClusterWindow` is an internal implementation constant/policy, not a user Setup judgement.

Recommended default for manual hobby tests: **30 minutes**, subject to implementation review.

This is not a chemistry threshold. It is a data-model convenience.

## 5.4 Cluster representative value

Default:

\[
ClusterValue = median(raw\ valid\ cluster\ readings)
\]

Median is preferred because one visibly bad repeat should not pull the representative value strongly.

## 5.5 Cluster timestamp

Default:

\[
ClusterTime = median(timestamp\ of\ included\ readings)
\]

If all readings are effectively simultaneous, exact choice has negligible analytical effect.

## 5.6 Cluster internal spread

For cluster values \(x_i\):

\[
MAD = median(|x_i-median(x)|)
\]

\[
\sigma_{cluster,robust} = 1.4826 \times MAD
\]

Cluster effective uncertainty should be at least the parameter's base measurement uncertainty.

Recommended architecture:

\[
\sigma_{cluster}
=
max(
\sigma_{base},
\sigma_{cluster,robust}
)
\]

Do not automatically divide uncertainty by \(\sqrt{n}\) merely because the same hobby test was repeated several times. Repeats may share systematic error.

## 5.7 Internally inconsistent cluster

If repeat spread materially exceeds the parameter's allowed repeat spread:

- cluster status becomes ANOMALOUS;
- preserve all readings;
- do not manufacture a precise median conclusion;
- request another test according to the parameter policy.

Exact spread thresholds belong to the parameter canon.

---

# 6. Independent observations

Evidence counts **independent clusters**, not raw readings.

Two clusters are independent only if:
- they represent distinct testing episodes;
- enough relevant time has elapsed for the inference being attempted;
- no rule says they are correlated/repeated observations.

The exact minimum spacing is inference- and parameter-specific.

Example:
- three Alk measurements ten minutes apart = one cluster;
- three Alk clusters over several days may support movement.

---

# 7. Uncertainty model

## 7.1 Every cluster carries uncertainty

Every analytical point must expose:

```text
value
timestamp
sigma
sourceClusterIds
```

## 7.2 Uncertainty has a lower bound

The engine must not claim precision finer than the parameter's configured analytical uncertainty.

## 7.3 Uncertainty is not position tolerance

A reading does not become “in range” because uncertainty overlaps the range.

Position uses the measured value.

Uncertainty affects:
- whether movement is established;
- how confident a trend is;
- whether an intervention response is detectable;
- how aggressively the app may act.

## 7.4 Parameter-specific base uncertainty

Each parameter canon must define:
- default working uncertainty;
- whether test method can modify it;
- whether device-specific uncertainty is supported.

The shared engine must not borrow another parameter's uncertainty.

If a parameter canon does not define a valid base analytical uncertainty:

```text
uncertaintyCapability = MISSING
```

Then:
- current measured position may still be shown;
- raw history may still be stored;
- uncertainty-dependent trend/action calculations do **not** run;
- the engine must not borrow Alk's value or invent a generic fallback.

Required affected-output state:

```text
REFUSE
reason = PARAMETER_BASE_UNCERTAINTY_REQUIRED
```

This refusal applies only to outputs whose calculation requires the missing uncertainty.

---

# 8. Normalized analytical series

A raw measurement series and an analytical series are different things.

The engine may create a **normalized series** for a specific inference by removing known discrete external contributions.

Examples:
- known one-off correction;
- known water-change step where mathematically normalized.

The raw values remain untouched.

A normalized point must retain:
- raw cluster value;
- total normalization applied;
- source events producing normalization;
- normalized value.

---

# 9. Known discrete-input normalization

## 9.1 Principle

If a known external event creates an immediate/defined step in the measured parameter, the step may be removed from subsequent analytical values so that trend estimation reflects the tank's underlying ongoing behaviour.

## 9.2 Example: immediate correction

Suppose an Alk correction is expected to add \(+0.30\) dKH at time \(t_c\).

For trend analysis of underlying movement:

\[
A_{norm}(t)=
A_{raw}(t)-0.30
\quad
for\ t \ge t_c
\]

provided the parameter-specific model allows the correction to be treated as a known immediate contribution.

## 9.3 Staged correction

If correction additions occur at \(t_1,t_2,\ldots\):

\[
A_{norm}(t)
=
A_{raw}(t)
-
\sum_{j:t_j \le t}
\Delta A_j
\]

Do not replace this with an arbitrary linear three-day rule.

## 9.4 Normalization uncertainty

Known-input normalization itself may have uncertainty from:
- potency uncertainty;
- delivered-volume uncertainty;
- net-volume uncertainty.

Where material, propagate this into the analytical point's effective uncertainty.

Parameter canons define the practical implementation.

---

# 10. Ongoing maintenance delivery is not a discrete normalization step

Maintenance dosing is a rate/input over time.

For a clean constant-dose segment, it is handled through:

\[
S=PD-C
\]

For exact mixed-dose mass-balance calculations, delivered volume can be integrated over the interval.

Do not subtract the entire maintenance dose as a step from each measurement.

---

# 11. Exact delivered maintenance input

For interval \([t_1,t_2]\):

\[
D_{eff}
=
\frac{DeliveredVolume(t_1,t_2)}
{\Delta t_{days}}
\]

Then average interval consumption can be expressed as:

\[
C_{avg}
=
P D_{eff}
-
\frac{A_2-A_1}{\Delta t_{days}}
\]

This formula may support advanced interval consumption even when the programmed daily dose changed inside the interval, **if actual delivered volume is known**.

However:

- the interval is still mixed-dose;
- it does not automatically qualify as a clean intervention-response segment;
- it does not automatically qualify for potency learning.

---

# 12. Segment model

The engine should construct inference-specific analytical segments rather than relying on one universal fixed lookback window.

Each segment should contain:

```text
segmentId
parameter
start
end
doseContext
potencyContext
measurementClusters[]
knownNormalizedEvents[]
hardConfounders[]
softConfounders[]
eligibility:
    trend
    consumption
    interventionResponse
    potencyLearning
```

---

# 13. Segment boundaries

A potential boundary exists at:

- maintenance dose change;
- product change;
- solution-batch change;
- solution concentration/recipe change;
- pump/channel change;
- material pump calibration change;
- pump failure/outage;
- unknown missed/extra dose;
- net-volume change;
- major unmodelled correction;
- parameter-specific hard confounder;
- confirmed measurement-regime discontinuity.

Not every event must break every inference.

Eligibility is inference-specific.

---

# 14. Clean trend segment

A clean trend segment requires:

- compatible measurement method/context;
- no unresolved hard confounder in the interval;
- no unmodelled step effect;
- parameter policy permits all included events;
- enough independent clusters for the requested estimate.

A known correction may remain if normalized correctly.

A dose change normally creates a boundary for **post-change trajectory assessment**.

---

# 15. Clean consumption segment

A consumption segment additionally requires:

- selected potency available;
- delivered maintenance input known with adequate confidence;
- no unaccounted exogenous parameter addition/removal;
- sufficient trend evidence for the parameter.

A mixed-dose interval may support interval consumption if exact delivery is known, but should carry lower/explicit confidence unless the parameter canon states otherwise.

---

# 16. Clean potency-learning comparison

Potency learning is stricter.

A pre/post pair should normally require:

- same potency context;
- same tank volume context;
- same pump/channel configuration except the intended dose rate;
- clean pre-change trend;
- clean post-change trend;
- known old/new dose;
- enough signal from \(\Delta D\);
- no interrupted intervention;
- no material hard confounder;
- no clear evidence consumption changed materially across the comparison.

Exact qualification rules belong to the dosed parameter's canon.

## 16A. Confirmed consumption-context change

`SHARED-CONSUMPTION-CONTEXT-001`

`CONSUMPTION_CONTEXT_CHANGE` is a **recorded confounder classification**, not a guess that biological demand must have changed.

It exists only when a retained event explicitly states that a material demand context changed for the relevant parameter.

Canonical event shape:

```text
ConsumptionContextEvent {
    eventId
    effectiveAt
    affectedParameters[]
    materiality = MATERIAL
    source = USER_CONFIRMED | SYSTEM_CONFIRMED
    reasonCode
    note?
}
```

Examples of reasons the product may allow a keeper/system to record include:

```text
CALCIFYING_BIOMASS_CHANGE
LIGHTING_REGIME_CHANGE
FLOW_REGIME_CHANGE
TEMPERATURE_REGIME_CHANGE
MAJOR_TISSUE_LOSS_OR_RECOVERY
OTHER_CONFIRMED_CONSUMPTION_CONTEXT_CHANGE
```

The shared engine must not infer this classification merely because a slope changed unexpectedly.

For a potency-learning pre/post comparison:

- if a confirmed `CONSUMPTION_CONTEXT_CHANGE` falls after the start of the pre window and before the end of the post window, that potency candidate is ineligible;
- if a new complete pre/post comparison is established entirely after the event in one stable context, eligibility may be reassessed normally;
- absence of a logged context-change event does **not** prove biological demand was constant; potency remains an inference and still requires the parameter-specific evidence burden.

Missing/unavailable consumption-context logging does not block core Alk control. It is one reason empirical potency learning remains capability-gated until its capture contract is implemented.

---

# 17. Lookback policies

A parameter canon may provide separate maximum lookbacks for:

- current trajectory;
- consumption;
- potency comparison;
- historical consistency display.

These do not need to be identical.

The engine must not silently extend a lookback because evidence is sparse.

If a current segment contains too little data:
- return insufficient/provisional;
- recommend the next useful test.

---

# 18. Change points / confirmed discontinuities

A confirmed abrupt shift in measurements may indicate a new observational regime.

A single surprising reading does not create a new regime.

A regime boundary may be created when:
- an anomalous reading is independently confirmed;
- the change is materially larger than measurement uncertainty;
- no known normalization explains it.

A change point can shorten the relevant current-trend segment even when no dose event occurred.

This allows the engine to respond to real biological/system changes without dragging an old stable regime indefinitely into the estimate.

The implementation should begin conservatively; sophisticated automated change-point algorithms are optional, not required for V2 initial release.

---

# 19. Robust trend estimation

## 19.1 Two independent clusters

With exactly two eligible clusters:

\[
S=
\frac{A_2-A_1}{t_2-t_1}
\]

This is a two-point rate, not a robust regression.

Its evidence confidence is inherently limited.

## 19.2 Three or more independent clusters

Use **Theil–Sen** as the default robust slope estimator.

For every pair \(i<j\):

\[
s_{ij}
=
\frac{A_j-A_i}{t_j-t_i}
\]

Then:

\[
S_{TS}=median(s_{ij})
\]

## 19.3 Theil–Sen intercept

A deterministic robust intercept can be calculated as:

\[
b=median(A_i-S_{TS}t_i)
\]

Predicted value:

\[
\hat A(t)=S_{TS}t+b
\]

Use a local numerical time origin to avoid large timestamp magnitudes.

Example:
- first included cluster = \(t=0\) days.

## 19.4 Residuals

\[
r_i=A_i-\hat A(t_i)
\]

Robust residual scale:

\[
\sigma_r=1.4826 \times MAD(r_i)
\]

## 19.5 Canonical shared slope uncertainty

`SHARED-SLOPE-UNCERTAINTY-001`

For three or more eligible independent clusters, the shared controller uses the parameter's base analytical uncertainty together with robust residual scatter.

Let:

\[
\sigma_{base}
\]

be the parameter-specific working analytical uncertainty supplied by that parameter canon.

From the Theil–Sen line, calculate residual scale:

\[
\sigma_r
=
1.4826 \times MAD(r_i)
\]

Then define the effective point uncertainty:

\[
\boxed{
\sigma_{point}
=
\max(
\sigma_{base},
\sigma_r
)
}
\]

Let:

\[
\bar t
=
\frac{1}{n}\sum_i t_i
\]

and:

\[
\boxed{
S_{xx}
=
\sum_i (t_i-\bar t)^2
}
\]

Then the canonical controller slope uncertainty is:

\[
\boxed{
\sigma_S
=
\frac{\sigma_{point}}{\sqrt{S_{xx}}}
}
\]

provided:

\[
S_{xx}>0
\]

This is an **engineering controller-uncertainty proxy**, not a claim that the Theil–Sen estimator has the classical OLS sampling distribution.

Its deliberate properties are:
- longer time leverage lowers uncertainty;
- additional clean independent observations lower uncertainty;
- residual scatter can raise uncertainty above the analytical floor;
- the parameter's analytical floor prevents perfectly aligned hobby measurements from creating false precision.

### Exactly two independent clusters

For a two-cluster provisional/rapid calculation, where parameter policy permits it:

\[
\boxed{
\sigma_S
=
\frac{
\sqrt{
\sigma_1^2+\sigma_2^2
}
}{
\Delta t_{days}
}
}
\]

A two-point slope does not automatically become ordinary sufficient evidence.

### Pairwise slope MAD is diagnostic only

For pairwise slopes \(s_{ij}\), the engine may calculate:

\[
\sigma_s^{MAD}
=
1.4826 \times MAD(s_{ij})
\]

as **diagnostic metadata**.

It is not part of the canonical action uncertainty and must not be combined through:

```text
max(pairwiseSlopeMAD, measurementSlopeUncertainty)
```

to size supported movement.

Reason:
short-interval pairwise slopes can become highly dispersed from ordinary measurement noise and would let adjacent noisy pairs dominate the controller even when the full multi-point trend is coherent.

Parameter canons may define a stricter uncertainty model only by explicitly owning and testing that refinement. They must not silently replace this shared default.

## 19.6 Degenerate cases

If:

\[
S_{xx}\le0
\]

the multi-point slope uncertainty is not calculable.

If duplicate timestamps remain after clustering:
- do not form zero-time pairwise slopes;
- do not silently keep duplicate-time clusters as independent time leverage;
- remove/merge them according to the clustering/event-ordering rules.

If that leaves fewer than the parameter's minimum eligible independent clusters:

```text
trendEvidence = INSUFFICIENT
```

Do not compute a normal sufficient trend from the remaining fragments merely because some nonzero-time pairs still exist.

If all residuals are zero:
- \(\sigma_r=0\);
- retain the parameter's \(\sigma_{base}\) through the `max()` floor.


---

# 20. Trend output contract

Return a structured result:

```text
TrendEstimate {
    estimator
    slope
    slopeUncertainty
    direction
    startTime
    endTime
    spanDays
    independentClusters
    pairwiseSlopeCount
    normalized
    residualScale
    totalObservedMovement
    signalToNoise
    evidenceState
    exclusions[]
    warnings[]
}
```

No UI surface recalculates these fields.

---

# 21. Observed movement metrics

The Evidence Engine may use several distinct quantities.

## 21.1 Endpoint movement

\[
\Delta A_{endpoint}=A_{last}-A_{first}
\]

## 21.2 Fitted movement across span

\[
\Delta A_{fit}=S \times T
\]

## 21.3 Direction consistency

Possible deterministic metric:

\[
Consistency
=
\frac{
\#\ pairwise\ slopes\ with\ same\ sign\ as\ fitted\ slope
}{
\#\ nonzero\ pairwise\ slopes
}
\]

This is not itself the decision threshold.

It is evidence metadata.

## 21.4 Movement SNR

A generic endpoint form:

\[
SNR_{movement}
=
\frac{|\Delta A_{fit}|}
{\sqrt{\sigma_{first}^2+\sigma_{last}^2}}
\]

A parameter canon may choose another conservative uncertainty denominator.

---

# 22. Movement claim from no prior intervention expectation

The shared architecture requires:

- at least **three independent clusters** before a normal movement claim can be SUFFICIENT;
- minimum elapsed span supplied by the parameter policy;
- movement large enough relative to parameter uncertainty/noise;
- no unresolved hard confounder.

With two independent clusters:
- a rate may be calculated;
- the evidence state is normally PROVISIONAL;
- the engine should describe it as a difference/signal, not a fully established persistent trend, unless a parameter-specific rapid/safety override applies.

This retains the useful V1 principle:

> one reading is a position, two is a signal, three can establish movement.

The exact required signal threshold belongs to the parameter canon.

---

# 23. Rapid/safety override

A parameter canon may define a confirmed rapid-change condition that allows action before ordinary evidence requirements.

A rapid override must specify:

- minimum independent measurements;
- minimum elapsed time;
- magnitude/rate threshold;
- confirmation requirements;
- safety action allowed;
- retest timing.

The shared engine must not invent a generic rapid threshold.

---

# 24. Evidence state calculation

Evidence must be rule-based and explainable, not a mysterious blended score.

Recommended ordering for a requested inference:

1. **CONFOUNDED**  
   A hard confounder prevents the requested inference.

2. **ANOMALOUS**  
   An unresolved suspicious measurement prevents ordinary inference.

3. **INSUFFICIENT**  
   Minimum independent count/span/exposure is not met.

4. **PROVISIONAL**  
   Minimum arithmetic estimate exists, but signal/confidence is not strong enough for ordinary action.

5. **SUFFICIENT**  
   Parameter-specific count/span/signal requirements are met.

6. **HIGH_CONFIDENCE**  
   Stronger evidence requirements are met with no material warnings.

The requested inference matters.

A dataset can be SUFFICIENT for trend and only PROVISIONAL for potency learning.

---

# 25. Evidence diagnostics

Every EvidenceAssessment should contain:

```text
EvidenceAssessment {
    inferenceType
    state
    independentClusters
    span
    minimumClustersRequired
    minimumSpanRequired
    observedSignal
    requiredSignal
    signalToNoise
    directionConsistency
    hardConfounders[]
    softConfounders[]
    unresolvedAnomalies[]
    exposureFraction?
    reasons[]
}
```

This makes “why the app is waiting” mechanically explainable.

---

# 26. Soft confounders

A soft confounder does not automatically invalidate inference.

Examples may include:
- meaningful lighting change;
- livestock addition/removal;
- major feeding change;
- temperature regime change;
- major nutrient shift.

The parameter canon defines relevance.

Possible effects:
- lower evidence confidence;
- exclude from potency learning;
- shorten recency window;
- require another measurement.

Do not create a giant universal list and apply it identically to every parameter.

---

# 27. Dose-change intervention creation

An intervention begins only when an actual dose change is confirmed.

Store:

```text
Intervention {
    interventionId
    parameter
    type = MAINTENANCE_DOSE_CHANGE
    recommendedByAssessmentId?
    oldDosePerDay
    newDosePerDay
    actualStartTime
    baselineClusterId?
    baselinePosition
    preChangeTrend
    preChangeTrendEvidence
    selectedPotency
    expectedSlopeChange
    predictedPostSlope
    phase
    response
    latestAssessmentId?
}
```

A recommendation alone does not create this record.

---

# 28. Baseline for an intervention

The intervention baseline should contain:

- latest valid pre-change measurement cluster;
- pre-change trend estimate;
- dose state actually in force;
- selected potency and confidence;
- relevant target range;
- relevant configuration version.

If there is no adequate pre-change trend:
- intervention can still be tracked;
- response comparison is weaker;
- potency learning may be impossible.

---

# 29. Expected dose response

For a maintenance change:

\[
\Delta S_{expected}
=
P_{selected}(D_{new}-D_{old})
\]

\[
S_{predicted,new}
=
S_{pre}
+
\Delta S_{expected}
\]

Store both.

If potency confidence is limited, expected response uncertainty must reflect that.

---

# 30. Exposure after a dose change

A post-change measurement is not automatically evidence about the new dose merely because its timestamp is later.

The engine should calculate an **exposure fraction**.

Conceptually:

\[
ExposureFraction
=
\frac{
incremental\ new-dose\ volume\ actually\ delivered
}{
incremental\ volume\ expected\ over\ one\ complete\ dosing\ cycle
}
\]

For a continuously/evenly dosed daily schedule:
- ~24 hours is approximately one complete cycle.

For another schedule:
- use that schedule's actual cycle.

A parameter canon sets the minimum exposure required for:
- provisional evaluation;
- sufficient evaluation;
- potency learning.

This is about obtaining interpretable evidence, not a claim that the chemistry itself waits 24 hours to exist.

---

# 31. Post-change analytical segment

Post-change trajectory used to evaluate the intervention must represent time during which the new dose was actually in force.

A measurement taken immediately before the dose change may be used as the **time-zero baseline anchor** for the first post-change interval, provided:

- its relationship to the change is explicit;
- the dose change followed it closely enough that the interval from that measurement to the next one is materially a new-dose interval;
- actual delivered dose during the interval is known well enough for the inference.

The baseline anchor is **not counted as a post-change observation**. It is the starting condition against which post-change movement is measured.

Do not mix older pre-change measurements into the post-change slope as though they experienced the new dose.

The pre-change trend and post-change response remain separate estimates linked by the intervention record.

---

# 32. “Too soon to tell”

An intervention is NOT_YET_ASSESSABLE when any required condition is unmet, for example:

- insufficient exposure to the new dose;
- fewer than the required post-change independent clusters;
- insufficient elapsed span;
- expected response is not yet detectable above uncertainty;
- unresolved anomaly.

The engine should return the exact reason(s).

No dose re-adjustment should be made merely because the level has not yet reached stability.

---

# 33. Response metrics

When pre and post slopes are available:

\[
\Delta S_{observed}
=
S_{post}-S_{pre}
\]

\[
\Delta S_{expected}
=
P_{selected}(D_{new}-D_{old})
\]

Response error:

\[
E_{response}
=
\Delta S_{observed}
-
\Delta S_{expected}
\]

Response ratio, where expected response is materially nonzero:

\[
R_{response}
=
\frac{\Delta S_{observed}}
{\Delta S_{expected}}
\]

`E_response` and `R_response` are **diagnostic metrics only**.

They must not become a second response classifier.

In particular:
- do not classify EXPECTED/PARTIAL/OVER_RESPONSE from fixed response-ratio bands;
- do not use the ratio when \(\Delta S_{expected}\) is near zero;
- formal intervention-response classification is owned by the parameter canon's uncertainty-aware response-band rule.

A later parameter author may expose these diagnostics for explanation/audit, but may not use them to create a competing response engine beside the canonical parameter classifier.

The parameter canon defines:
- what counts as detectable;
- acceptable expected-response band;
- partial-response region;
- over-response region.

---

# 34. Post-change response classes

## 34.1 EXPECTED

Observed response is consistent with predicted response within the parameter's uncertainty/tolerance.

## 34.2 PARTIAL

Response moved materially in the intended direction but is smaller than expected or still leaves a meaningful maintenance imbalance.

A PARTIAL response does not automatically justify immediate another change.

The intervention phase/evidence must determine whether more observation is needed.

## 34.3 NO_DETECTABLE_RESPONSE

The dose change should have created a detectable response by now, but:

\[
|\Delta S_{observed}|
\]

remains within the parameter's no-response threshold.

This requires enough exposure/time and cannot be declared immediately.

## 34.4 CONTRADICTORY

The observed response is materially opposite to the expected change.

Example:
- dose increased;
- sufficiently supported post-change trajectory worsened in the opposite direction.

Contradictory response does not by itself prove:
- pump failure;
- wrong concentration;
- changed consumption;
- bad test.

It flags the mismatch.

## 34.5 OVER_RESPONSE

The response is in the intended direction but materially stronger than expected.

## 34.6 INCONCLUSIVE

Enough post-change measurements exist to attempt evaluation, but they do not support any stronger response classification.

---

# 34A. Post-intervention position event

`OVERSHOOT` is position-based and is **not** a response-attribution class.

The newest valid measured level has crossed the relevant target boundary in the undesired direction after an intervention.

A response can be stronger than expected without yet overshooting.

A tank can overshoot even if the slope response estimate is uncertain.

This section implements the orthogonal position-event dimension defined in Part I §7.6A.

---

# 35. Intervention phase transitions

Recommended generic transitions:

```text
actual change confirmed
    -> JUST_IMPLEMENTED

minimum exposure begins accumulating
    -> OBSERVING

evidence/retest threshold reached
    -> ASSESSMENT_DUE

assessment performed
    -> ASSESSED

new intervention before assessment completes
    -> INTERRUPTED

calendar/evidence policy exceeded without required follow-up
    -> EXPIRED
```

Parameter canons define timing.

---

# 36. Interrupted interventions

If another maintenance dose change occurs before the current one is sufficiently assessed:

- mark current intervention INTERRUPTED;
- preserve all measurements and delivered-dose history;
- do not call it failed;
- do not call it successful;
- do not use it as strong potency evidence;
- start a new intervention from the actual latest dose.

If the intermediate dose operated long enough to support an interval consumption estimate, that estimate may still exist with appropriate confidence.

---

# 37. Multiple rapid changes

When several user changes occur in a short period:

- preserve every actual dose event;
- each unevaluable intervention becomes INTERRUPTED;
- confidence in immediate recommendation should fall;
- prefer holding the latest actual dose long enough to obtain a clean segment unless safety rules override.

The engine must not pretend the dose history was a single jump from the first to the last value.

---

# 38. Manual changes outside the wizard

A dose change entered manually is analytically identical to a dose change accepted from a recommendation once it actually occurs.

The engine should record:
- recommended dose, if one existed;
- actual entered dose;
- source = MANUAL or RECOMMENDATION_ACCEPTED.

Subsequent inference uses actual delivered dose.

Do not assume the user followed the recommendation.

---

# 39. Corrections and return plans as interventions

A correction or return plan also has:

- actual start;
- actual delivered schedule;
- expected effect;
- current phase;
- response;
- expiry;
- completion condition.

They are not merely notes attached to measurements.

The parameter canon defines their specific arrival/termination rules.

---

# 40. Maintenance intervention vs return-plan intervention

These must remain distinct.

### Maintenance change
Objective:

\[
S \rightarrow 0
\]

### Return plan
Objective:
intentionally create a controlled nonzero trajectory toward the target-range destination.

A return plan's intentional trajectory must not be misread as evidence that maintenance is wrong.

Consumption estimation during a return plan must account for the plan's known temporary input.

---

# 41. Potency-learning eligibility after an intervention

A maintenance dose intervention may become a potency observation only after:

- pre/post trajectories are sufficiently supported;
- response signal is large enough;
- intervention was not interrupted;
- same potency context;
- no material hard confounder;
- no evidence of major consumption regime change.

Do not make potency learning automatic for every dose change.

The dosed parameter canon sets exact eligibility thresholds.

---

# 42. Consumption-regime change vs potency discrepancy

When observed post-change response differs from expectation, the engine should not immediately choose a cause.

It should retain competing interpretations.

Examples:
- consumption changed;
- potency differs from expected;
- delivery failed;
- measurement anomaly.

Only controlled repeated evidence should update potency.

This preserves the architecture firewall:

**Consumption can change quickly. Potency normally should not.**

---

# 43. Water-change event model

A water change can alter a parameter by mixing.

For fraction \(f\):

\[
A_{after}
=
(1-f)A_{tank}
+
fA_{replacement}
\]

Expected step:

\[
\Delta A_{WC}
=
f(A_{replacement}-A_{tank})
\]

This formula is valid only where:
- the parameter mixes approximately linearly in the represented unit;
- replacement chemistry is known;
- parameter-specific canon allows this approximation.

---

# 44. Water-change materiality classification

Every parameter module must be able to return one of:

- NEGLIGIBLE
- MATERIAL_KNOWN
- MATERIAL_UNKNOWN
- NOT_APPLICABLE

## 44.1 NEGLIGIBLE

Expected shift is below the parameter's materiality threshold.

The event may remain in ordinary trend without special correction.

## 44.2 MATERIAL_KNOWN

Expected shift is meaningful and replacement chemistry is sufficiently trustworthy.

The engine may normalize the step for trend/consumption inference.

## 44.3 MATERIAL_UNKNOWN

The event could materially shift the parameter, but its chemistry/effect is not known well enough to normalize.

Break/confound the affected analytical segment.

## 44.4 NOT_APPLICABLE

Parameter-specific reasons make the generic model inappropriate.

---

# 45. Water-change data confidence

Replacement chemistry may be:

- MEASURED_SAME_BATCH;
- USER_CONFIGURED_SALT_PROFILE;
- MANUFACTURER_NOMINAL;
- UNKNOWN.

Parameter canons may only allow mathematical normalization above a required confidence tier.

Do not turn an unverified salt label into a precise correction merely because a formula exists.

---

# 46. Water-change normalization

Where permitted:

For every post-change analytical point used across the event:

\[
A_{norm}(t)
=
A_{raw}(t)
-
\Delta A_{WC}
\]

This treats the water change as a known step while preserving subsequent biological trend.

If multiple known steps occur:

\[
A_{norm}(t)
=
A_{raw}(t)
-
\sum_{events\le t}\Delta A_{event}
\]

All normalizations remain visible in audit data.

---

# 47. Suspicious-reading detection

Suspicion should be conservative.

Potential inputs:
- robust-trend residual;
- jump size relative to measurement uncertainty;
- divergence from recent cluster distribution;
- impossible/implausible rate if taken literally;
- device/test metadata.

A suggested generic standardized residual:

\[
Z_i
=
\frac{|r_i|}
{max(\sigma_i,\sigma_r,\epsilon)}
\]

A parameter canon may use a threshold such as a multiple of uncertainty.

The shared architecture does not set the final threshold.

---

# 48. Latest suspicious reading behaviour

If the newest measurement is suspicious and the result would materially change dosing advice:

Default shared behaviour:

- mark latest cluster SUSPECT/ANOMALOUS;
- do not silently exclude it and act on older data as though it did not exist;
- recommend a repeat test now;
- withhold ordinary dose escalation/reversal until resolved unless a parameter-specific safety override requires action.

This is a core safety behaviour.

---

# 49. Historical suspicious reading behaviour

A historical suspicious point may be excluded from a trend only if there is a documented basis, such as:

- repeat/confirmation disproved it;
- user marked it invalid;
- known test/device fault.

Do not automatically trim “statistical outliers” from aquarium history merely because a robust model dislikes them.

Theil–Sen already reduces their leverage.

---

# 50. Retest Scheduler — purpose

The Retest Scheduler determines:

> What is the earliest useful or necessary next measurement?

It must not be a collection of message-specific hardcoded dates.

It receives structured engine state and parameter policy.

---

# 51. Retest candidate times

The scheduler may calculate candidates for:

1. routine cadence;
2. intervention minimum exposure;
3. intervention detectability;
4. confidence-building;
5. forecasted target-boundary crossing;
6. safety-boundary risk;
7. unresolved anomaly;
8. correction/return-plan arrival check;
9. expiry/overrun.

Final recommendation is normally the earliest relevant candidate that does not violate a minimum useful interval.

---

# 52. Detectability time after a dose change

Expected slope change:

\[
|\Delta S_{expected}|
=
|P_{selected}(D_{new}-D_{old})|
\]

A generic time needed for the expected intervention effect to accumulate beyond uncertainty:

\[
T_{detect}
=
\frac{
K_{detect}\sigma_{effect}
}{
|\Delta S_{expected}|
}
\]

Where:
- \(\sigma_{effect}\) is the parameter's effective measurement uncertainty for the comparison;
- \(K_{detect}\) is supplied by the parameter policy.

This is not automatically the next test time.

The scheduler also applies:
- minimum post-change exposure;
- minimum independent-observation spacing;
- risk/boundary timing;
- maximum desired wait.

If expected slope change is near zero, `T_detect` is not useful and the parameter policy must use its normal intervention-observation interval.

---

# 53. Confidence-building time

If trend evidence is insufficient but there is a current provisional slope \(S\), a generic signal accumulation estimate may be:

\[
T_{signal}
=
\frac{
RequiredMovement
}{
|S|
}
\]

where `RequiredMovement` is parameter-specific and related to uncertainty/noise.

Clamp according to:
- minimum useful interval;
- maximum permitted wait;
- routine cadence.

Do not recommend an absurdly long wait when the parameter's normal cadence should trigger first.

---

# 54. Boundary-crossing time

For current measured value \(A\) and supported slope \(S\):

If rising:

\[
T_{upper}
=
\frac{Upper-A}{S}
\]

If falling:

\[
T_{lower}
=
\frac{A-Lower}{|S|}
\]

If crossing time is positive and within the allowed forecast horizon:

Schedule testing **before** the predicted crossing using a parameter-specific safety margin.

Forecast timing must not override immediate safety rules.

---

# 55. Immediate repeat

`REPEAT_TEST_NOW` outranks normal retest scheduling when:

- newest reading is suspicious;
- a result would trigger a large intervention but is unconfirmed;
- parameter-specific emergency policy requires confirmation and time allows.

A repeat belongs to the same measurement cluster unless enough time/intervention separates it.

---

# 56. Routine cadence

Routine cadence is a parameter policy.

The Retest Scheduler returns routine cadence only when:
- no active intervention;
- no anomaly;
- no meaningful current risk;
- evidence is already sufficient for the current steady-state conclusion.

A parameter being stable should not automatically mean all testing can stop.

---

# 57. Retest output contract

```text
RetestRecommendation {
    action              // REPEAT_NOW, TEST_AT, ROUTINE
    earliestUsefulAt
    recommendedAt
    latestSafeAt?
    reasonCode
    candidateTimes[]
    assumptions[]
}
```

User-facing copy comes later from the presentation canon.

---

# 58. Recommendation lock during ordinary intervention observation

During a normal maintenance-dose intervention:

Default shared principle:

- do not issue a second ordinary maintenance adjustment while the current intervention is NOT_YET_ASSESSABLE;
- HOLD and schedule the next test.

Override only through parameter-specific:
- rapid-change rule;
- safety-bound excursion;
- obvious dosing failure;
- confirmed severe contradictory response.

This is the anti-chatter intervention lock.

---

# 59. Response improving but not settled

If post-change evidence shows meaningful improvement in the intended direction but is not yet enough to establish the final steady slope:

- interventionResponse = PARTIAL or EXPECTED;
- ordinary recommendation = HOLD;
- continue evidence collection.

Do not immediately “finish the calculation” by changing the dose again solely because the current level remains outside range.

This is especially important under the locked stabilise-first rule.

---

# 60. Reassessment after sufficient post-change evidence

Once intervention evidence is sufficient:

- estimate current post-change trajectory;
- calculate current consumption using selected potency;
- calculate maintenance requirement;
- classify response;
- decide whether another maintenance adjustment is justified.

The new recommendation is based on the **post-change segment**, not the old segment plus the new dose.

---

# 61. Position during intervention

Current measured position always comes from the latest valid measurement, even while an intervention is running.

Examples:
- dose change still settling, latest Alk above range;
- return plan running, latest value in range;
- correction overshot.

The intervention state never overrides measured position.

---

# 62. Target entry while still moving

If a deliberate level-moving intervention reaches the target range while trajectory remains intentionally/non-intentionally moving:

The parameter canon must define:
- whether the plan stops;
- whether it reduces;
- whether maintenance resumes;
- when confirmation occurs.

The shared engine must be able to represent:
- IN_RANGE position;
- RISING/FALLING trajectory;
- active RETURN_PLAN/CORRECTION;
- not-yet-complete response.

Do not collapse “in range” into “finished”.

---

# 63. Audit model for analytical decisions

Every inference should retain enough information to reproduce it.

## 63.1 Measurement selection audit
Store:
- candidate clusters;
- included clusters;
- excluded clusters;
- exclusion reasons;
- normalization applied.

## 63.2 Trend audit
Store:
- estimator;
- pairwise slopes if practical or reproducible source;
- fitted slope;
- intercept;
- residuals;
- robust uncertainty;
- movement SNR;
- evidence decision.

## 63.3 Intervention audit
Store:
- pre-change state;
- expected response;
- delivered exposure;
- post-change clusters;
- response metrics;
- response classification.

## 63.4 Retest audit
Store:
- every candidate time;
- selected candidate;
- reason selected;
- clamps/margins applied.

---

# 64. Deterministic replay

Given:
- the same event ledger;
- the same configuration versions;
- the same engine/canon version;

the engine must produce the same analytical result.

Avoid:
- random unseeded bootstrap decisions;
- current-clock dependence without explicit `asOf`;
- UI-dependent rounding;
- iteration-order dependence.

Every analysis function should accept an explicit `asOf` timestamp.

---

# 65. Suggested shared interfaces

Illustrative, not language-specific:

```text
buildMeasurementClusters(events, policy, asOf)

classifyMeasurementAnomalies(clusters, context, policy)

buildAnalyticalSegments(
    parameter,
    clusters,
    doseEvents,
    correctionEvents,
    waterChanges,
    equipmentEvents,
    potencyContextEvents,
    policy,
    asOf
)

normalizeSegment(segment, selectedPotency, policy)

estimateTrend(segment, policy)

assessEvidence(inferenceType, estimate, segment, policy)

calculateDeliveredDose(interval, doseSchedule)

buildIntervention(actualDoseChange, preState, policy)

evaluateIntervention(intervention, postSegment, selectedPotency, policy)

classifyWaterChange(event, parameterContext, policy)

scheduleNextTest(engineState, policy, asOf)
```

Parameter policy must be injected explicitly.

Do not import global alkalinity constants into a calcium calculation.

---

# 66. Parameter policy contract

Every parameter module should provide a policy object/schema conceptually containing:

```text
MeasurementPolicy
    baseUncertainty
    repeatSpreadThreshold
    minimumIndependentSpacing

TrendPolicy
    maxLookback
    minimumClustersForMovement
    minimumSpanForMovement
    movementSignalThreshold
    rapidChangeRules

ConsumptionPolicy
    maxLookback
    minimumEvidence
    mixedDoseAllowed?

InterventionPolicy
    minimumExposure
    minimumPostClusters
    minimumPostSpan
    responseThresholds
    ordinaryLockRules

PotencyLearningPolicy
    preWindow
    postWindow
    minimumClustersEachSide
    minimumSignal
    confidencePromotionRules

WaterChangePolicy
    materialityThreshold
    normalizationConfidenceRequired
    largeUnknownChangeRule

RetestPolicy
    routineCadence
    minimumUsefulInterval
    maximumObservationInterval
    boundarySafetyMargin
    detectabilityFactor

SafetyPolicy
    safeBounds
    rateRails
    doseStepLimits
    overrideRules
```

The exact implementation may use separate structures.

The architectural requirement is explicit ownership.

---

# 67. Shared pseudocode — new measurement

```text
onNewMeasurement(parameter, measurement, asOf):

    validateAndStoreRawMeasurement()

    clusters =
        buildMeasurementClusters(parameterHistory)

    anomalyAssessment =
        classifyMeasurementAnomalies(clusters)

    currentPosition =
        classifyLatestValidMeasuredPosition()

    if latestClusterRequiresImmediateRepeat:
        return engineState(
            position=currentPosition,
            evidence=ANOMALOUS,
            recommendation=REPEAT_TEST_NOW,
            nextTest=NOW
        )

    segments =
        buildAnalyticalSegments(...)

    currentTrendSegment =
        selectCurrentTrendSegment(segments)

    normalizedTrendSegment =
        normalizeKnownInputs(currentTrendSegment)

    trend =
        estimateTrend(normalizedTrendSegment)

    trendEvidence =
        assessEvidence(TRAJECTORY, trend, normalizedTrendSegment)

    activeIntervention =
        getActiveIntervention(parameter)

    if activeIntervention exists:
        interventionAssessment =
            evaluateIntervention(
                activeIntervention,
                segments,
                trend,
                trendEvidence
            )

    consumptionAssessment =
        estimateConsumptionIfEligible(...)

    potencyAssessment =
        updatePotencyLearningIfEligible(...)

    recommendation =
        parameterRecommendationEngine(
            position,
            trend,
            evidence,
            interventionAssessment,
            consumptionAssessment,
            potencyAssessment
        )

    nextTest =
        scheduleNextTest(...)

    writeAuditRecord()

    return structuredEngineState
```

---

# 68. Shared pseudocode — actual dose change

```text
onActualDoseChange(parameter, oldDose, newDose, timestamp):

    closeOrInterruptExistingMaintenanceIntervention()

    storeDoseStateEvent(
        effectiveFrom=timestamp,
        dose=newDose
    )

    preState =
        latestEngineAssessmentBefore(timestamp)

    expectedSlopeChange =
        selectedPotency * (newDose - oldDose)

    createIntervention(
        type=MAINTENANCE_DOSE_CHANGE,
        oldDose=oldDose,
        newDose=newDose,
        baseline=preState,
        expectedSlopeChange=expectedSlopeChange,
        predictedPostSlope=
            preState.trendSlope + expectedSlopeChange,
        phase=JUST_IMPLEMENTED
    )

    scheduleNextTestFromIntervention()
```

---

# 69. Shared pseudocode — intervention evaluation

```text
evaluateIntervention(intervention, asOf):

    exposure =
        calculateExposureSinceChange()

    postClusters =
        independentClustersAfterChange()

    if exposure < policy.minimumExposure:
        return NOT_YET_ASSESSABLE

    if count(postClusters) < policy.minimumPostClusters:
        return NOT_YET_ASSESSABLE

    postSegment =
        buildPostChangeSegment()

    postTrend =
        estimateTrend(postSegment)

    evidence =
        assessEvidence(INTERVENTION_RESPONSE, postTrend, postSegment)

    if evidence insufficient:
        return INCONCLUSIVE / NOT_YET_ASSESSABLE

    observedDeltaSlope =
        postTrend.slope - intervention.preChangeTrend.slope

    expectedDeltaSlope =
        intervention.expectedSlopeChange

    classifyResponse(
        observedDeltaSlope,
        expectedDeltaSlope,
        uncertainty,
        latestMeasuredPosition,
        policy
    )
```

---

# 70. Failure handling

## 70.1 Missing dose history

Position/trend may still be assessed.

Consumption and maintenance dose may refuse.

## 70.2 Missing potency

Position/trend may still be assessed.

Consumption and dose calculations requiring potency refuse.

## 70.3 Missing net volume

Any calculation whose potency depends on volume or whose correction volume requires it refuses.

Do not suppress position/trend.

## 70.4 Corrupt event ordering

Refuse affected inference and name the timeline ambiguity.

## 70.5 Conflicting active interventions

If records imply two mutually exclusive maintenance doses are simultaneously current:
- mark dosing state invalid;
- do not guess;
- request reconciliation.

---

# 71. Edge cases that must be tested

At minimum:

1. One measurement only.
2. Two independent measurements.
3. Three clean monotonic measurements.
4. Three readings with one extreme middle value.
5. Suspicious latest reading, repeat confirms.
6. Suspicious latest reading, repeat disproves.
7. Repeat cluster with wide internal spread.
8. Dose change between two measurements.
9. Hourly dosing changed halfway through a day.
10. Missed dose inside interval.
11. Dose increased twice before first change assessed.
12. Dose decreased after increase before assessment.
13. Known immediate correction.
14. Known staged correction.
15. Unknown correction.
16. Small water change with negligible predicted effect.
17. Material water change with measured replacement chemistry.
18. Material water change with unknown chemistry.
19. New solution batch.
20. Pump recalibration.
21. Confirmed abrupt biological regime shift.
22. Stable current position with old noisy history.
23. In-range but rapidly moving toward boundary.
24. Post-change partial response.
25. Post-change no detectable response.
26. Post-change contradictory response.
27. Post-change over-response.
28. Actual overshoot.
29. Return plan enters range but still moving.
30. Interrupted return plan.
31. Backdated measurement inserted.
32. Measurement edited.
33. Target range changed after historical recommendation.
34. Two tests same timestamp around an intervention with unknown ordering.
35. Long gap in testing.
36. Very small dose change whose expected signal is below detectability.
37. Potency-learning candidate with inadequate dose delta.
38. Potency-learning candidate with soft confounder.
39. Potency-learning candidate across batch change — reject.
40. Exact deterministic replay.

---

# 72. Property/invariant tests

The following should be property-tested:

1. Adding repeat tests inside one cluster does not increase independent observation count.
2. Display rounding never changes classification/trend.
3. Moving a dose-change timestamp changes only analyses that physically cross it.
4. Older pre-change measurements never appear in a post-change clean response segment; only an explicitly linked time-zero baseline anchor may begin the first new-dose interval.
5. An interrupted intervention never becomes EXPECTED/FAILED merely from interruption.
6. A known correction normalized into trend does not disappear from raw history.
7. An unresolved latest anomaly cannot be silently excluded to produce an ordinary dose change.
8. Theil–Sen slope is invariant to input ordering after sorting by timestamp.
9. No zero-time pairwise slope is computed.
10. Water-change normalization is exactly auditable from stored inputs.
11. A configuration change now does not alter a historical recommendation record.
12. `asOf` replay of old history is deterministic.
13. Potency learning never crosses a potency-context boundary.
14. A recommendation alone never creates delivered-dose exposure.
15. Return-plan intentional movement is not automatically treated as maintenance mismatch.

---

# 73. V1 rules explicitly carried forward here

The following V1 concepts are retained in this shared analytical layer:

- exact historical dose changes matter;
- recommendation and actual action are distinct;
- position is the latest reading;
- repeated/odd readings should be confirmed rather than blindly acted on;
- dose changes need an observation period;
- a second dose change interrupts interpretation of the first;
- a known correction must not masquerade as changed biological consumption;
- the app may need to say “not enough data”;
- historical recommendations must remain historically truthful;
- surfaces may not generate competing analysis.

They are restructured under explicit primitives rather than preserved through V1's existing branch order.

---

# 74. V1 rules replaced or materially changed here

## 74.1 Fixed universal current-analysis window

Replaced by:
- inference-specific clean segments;
- parameter-specific maximum lookbacks;
- no silent extension.

## 74.2 Unspecified fitted slope

Replaced by:
- explicit two-point fallback;
- Theil–Sen for multi-point trend;
- robust residual/uncertainty metadata.

## 74.3 Linear three-day correction subtraction

Replaced by:
- actual correction delivery schedule;
- known-input normalization.

## 74.4 Raw reading count

Replaced by:
- independent measurement clusters;
- exact time;
- signal/evidence requirements.

## 74.5 “Recent dose change” as a loose message precondition

Replaced by:
- explicit intervention record;
- phase;
- exposure;
- response evidence.

## 74.6 Blanket water-change treatment

Replaced by:
- parameter-specific materiality classification;
- normalize known material effects;
- confound unknown material effects;
- ignore genuinely negligible effects.

---

# 75. Decisions deliberately deferred to the alkalinity canon

This shared file does **not** decide:

- Alk working uncertainty/noise floor;
- Alk minimum independent spacing;
- Alk minimum movement span;
- Alk movement SNR threshold;
- Alk rapid-change threshold;
- Alk ordinary minimum post-change exposure;
- Alk minimum post-change cluster count;
- Alk intervention response tolerances;
- Alk routine retest cadence;
- Alk maximum trend lookback;
- Alk consumption lookback;
- Alk water-change materiality threshold;
- Alk dose-step safety caps;
- Alk correction/return-plan rate rail;
- Alk potency-learning promotion thresholds;
- Alk suspicious-reading threshold for §47;
- Alk replacement-water confidence tier for §45;
- Alk parameterisation of the §51–§54 scheduler candidates and the §66 policy fields.

Those belong in PART III — Alkalinity Engine of this master canon.

Alk Freeze 5 supplies the §45, §47 and §51–§54/§66 answers, including two it answers as a
canonised `NOT_RUN` — the §47 automatic suspicion threshold and the §52 `K_detect`. A
`NOT_RUN` supplied by a parameter canon is an answer under this section, not a continuing
deferral.

The shared engine supplies the machinery; the Alk canon supplies the numbers.

---

# 76. Decisions deliberately deferred to calcium/magnesium canons

Likewise, this file does not assume Ca or Mg should inherit Alk's:

- cadence;
- windows;
- uncertainty;
- evidence count;
- response timing;
- learnability;
- potency-confidence thresholds.

Ca and Mg must deliberately define their own policies.

---

# 77. Definition of completion for this shared canon

Implementation of this shared layer is acceptable only when:

- measurements and clusters are distinct concepts;
- exact timestamps drive all rates;
- trend segmentation respects intervention/context boundaries;
- Theil–Sen is implemented and tested;
- unresolved anomalies are first-class;
- known correction inputs can be normalized from actual delivery history;
- water changes have materiality classification hooks;
- interventions are first-class records;
- exposure is calculated;
- post-change response is structured;
- interruption is explicit;
- Retest Scheduler is one shared service;
- all major decisions are auditable;
- parameter-specific thresholds are injected rather than imported implicitly;
- V1 cards can be generated later from structured state without becoming the domain model.

---

# 78. Current next step

Master Rules 1–6 and Parts I–II are now frozen as:

```text
SHARED_V2_FREEZE_1
```

Alkalinity is frozen as:

```text
ALK_V2_FREEZE_3
```

The next step is **implementation**, not additional parameter specification.

Implementation order:

1. build the frozen shared V2 domain layer;
2. build Alk V2 as the first complete consumer;
3. build the V2 retest / messaging / notification projection from structured V2 state;
4. run golden, adversarial and V1→V2 comparison suites;
5. establish implementation conformance;
6. only then design Calcium V2;
7. then Magnesium V2.

Calcium and Magnesium must not be finalised merely to make the first V2 runtime appear feature-complete.

# 79. Implementation warning

Claude Code must not reconstruct V1's 17-state wizard inside this shared layer.

This file defines **measurement/evidence/intervention primitives**.

The later presentation layer may map combinations of these primitives to familiar V1 card wording where that wording remains useful.

The analytical core must remain independent of those cards.

---

# 80. Summary invariant

The shared analytical engine must always be able to answer:

1. **What was actually measured?**
2. **Which measurements are independent?**
3. **What happened between them?**
4. **Which data belong to the same interpretable regime?**
5. **How strongly does the evidence support movement?**
6. **What did the tank receive during that time?**
7. **Is a current intervention old enough and well-observed enough to judge?**
8. **Did the response match expectation?**
9. **Is another action justified, or should the system hold?**
10. **When is the next measurement actually useful?**

If any of these questions is answered by UI branch order or by a second calculator outside the Reef Chemistry Engine, the V2 architecture has been violated.


---


# SHARED-ARCHITECTURE AUDIT DISPOSITION — 2026-08-19

External recommendation: **B — READY AFTER NARROW FIXES.**

Disposition:

| Finding | Disposition |
|---|---|
| F-1 incompatible/missing slope uncertainty owner | **AGREE / FIXED / IMPACTS_FROZEN_ALK** — shared `Sxx` rule + explicit `ALK-011A/B` + five-reading golden; Alk reissued as Freeze 3 |
| F-2 OVERSHOOT inside response enum | **AGREE / FIXED** — orthogonal position event |
| F-3 response-ratio primitive may invite second classifier | **AGREE / FIXED** — diagnostic only; parameter band classifier owns response |
| F-4 telemetry/programmed-dose framing | **AGREE / FIXED** — confirmed programmed schedule first-class; telemetry optional |
| F-5 pairwise-slope MAD may dominate | **AGREE / FIXED** — diagnostic only, removed from action uncertainty |
| F-6 duplicate timestamp degeneracy | **AGREE / FIXED** — insufficient if usable evidence falls below minimum |
| F-7 stale deferred Alk policies | **AGREE / FIXED** — closed Alk values separated from still-deferred future parameters |
| F-8 missing owner if base uncertainty absent | **AGREE / FIXED** — refuse only uncertainty-dependent outputs; never borrow another parameter value |

External narrow recheck result: **READY — freeze shared V2 architecture and proceed to Alk implementation.**

All ten recheck items PASS. The only residue identified was the placement of `OVERSHOOT` inside the Part II §34 response-class numbering; that cosmetic residue is now removed without changing behaviour.

**Historical shared architecture status at that review: FROZEN — `SHARED_V2_FREEZE_1` — 2026-08-19. Current authority is `SHARED_V2_FREEZE_2`.**

---


# SHARED V2 ARCHITECTURE FREEZE DECLARATION

**Freeze identifier:** `SHARED_V2_FREEZE_1`  
**Frozen:** 2026-08-19  
**Scope:** Master Rules 1–6 + Parts I–II shared primitives, evidence model, event semantics, intervention machinery, delivery basis, scheduler ownership, audit/replay and shared capability behaviour.

### External recheck

Result:

```text
READY — freeze shared V2 architecture and proceed to Alk implementation.
```

All ten narrow-recheck checks PASS.

### Freeze status

```text
sharedArchitectureCanon = FROZEN
alkBehaviourCanon = ALK_V2_FREEZE_3  # historical state at Shared Freeze 1
implementationConformance = NOT_YET_PROVEN
productionMigration = NOT_YET_PERFORMED
```

### Reopening rule

Do not silently alter shared semantics after this marker.

A future shared behavioural change requires:
1. affected shared rule ID(s);
2. a concrete failure scenario;
3. classification as shared-canon defect, parameter-canon defect, implementation defect or deliberate product change;
4. impact analysis for every frozen parameter canon;
5. affected golden updates;
6. a new shared freeze identifier.

If a shared change alters Alk behaviour, it must also be marked:

```text
IMPACTS_FROZEN_ALK
```

and Alk must be reissued under the next freeze identifier.

### Future parameter rule

Every future parameter controller, including Calcium and Magnesium, must include **at least one golden scenario with more independent readings than its minimum evidence count**.

Reason:
three evenly spaced Alk readings made the old endpoint uncertainty formula numerically coincide with the `Sxx` formula, hiding a real architectural divergence through two review cycles.

---

# SHARED V2 ARCHITECTURE FREEZE 2 DECLARATION

**Freeze identifier:** `SHARED_V2_FREEZE_2`  
**Status:** FROZEN — 2026-08-19  
**Supersedes:** `SHARED_V2_FREEZE_1`

### Reason

Repository-informed implementation planning exposed shared completeness/capability gaps that were not visible during document-only review.

Freeze 2 adds:

- `CORE-CANON-COVERAGE-001` mechanical reference/coverage integrity, including a substantive-body check and demonstrated negative control;
- `SHARED-CONFIG-VERSION-001` effective-dated configuration semantics;
- `SHARED-LEGACY-TIME-001` deterministic legacy-time degradation;
- `SHARED-CONSUMPTION-CONTEXT-001` definition of the potency-learning confounder;
- removal of dangling example rule IDs from Master Rule 4;
- named invariant/golden coverage required by the mechanical freeze gate.

These changes are marked:

```text
IMPACTS_FROZEN_ALK
```

because Alk consumes the shared configuration/time/evidence semantics. Part III is therefore reissued as `ALK_V2_FREEZE_4`.

### Freeze status

```text
sharedArchitectureCanon = SHARED_V2_FREEZE_2
alkBehaviourCanon = ALK_V2_FREEZE_5   # Alk reissued by Freeze 5; shared architecture unchanged
implementationConformance = NOT_YET_PROVEN
productionMigration = NOT_YET_PERFORMED
```

`SHARED_V2_FREEZE_2` is **not** superseded by Alk Freeze 5. Freeze 5 parameterises shared
rules that Part II deliberately deferred to a parameter canon (Part II §45, §47, §51–§54,
§66) and changes no shared rule body.

### Reopening rule

A future shared behavioural or load-bearing completeness change requires:
1. exact affected shared rule IDs;
2. concrete failure scenario;
3. impact analysis for every frozen parameter;
4. coverage fixture updates;
5. a new shared freeze identifier;
6. a corresponding parameter reissue wherever `IMPACTS_FROZEN_<PARAMETER>` applies.

---

# PART III — ALKALINITY ENGINE

**Status:** **FROZEN — ALK V2 FREEZE 5 — 2026-08-19.**  
Freeze 1 was superseded after external adversarial review. Freeze 2 incorporated the capability contract, outer-bound safety path, advisory-responsibility integration, and final focused-review closures. Freeze 3 added the explicit `ALK-011A/ALK-011B` uncertainty rules and aligned the shared evidence engine to the same `Sxx` formula family. Freeze 4 closed implementation-discovered canon-completeness/capability gaps without changing the intended stabilise-first controller policy. Freeze 5 closes the eleven implementation-preparation blocking items, and two non-blocking items, with twelve explicit owner decisions; it determines behaviour that was previously undetermined and does not redesign the controller.


### Freeze 3 reason

`IMPACTS_FROZEN_ALK`

The shared-architecture audit identified that Freeze 2 referenced `ALK-011A` / `ALK-011B` without containing their rule bodies, while Part II carried a different shared slope-uncertainty formula.

Freeze 3:
- writes the missing Alk rules explicitly;
- preserves the `Sxx` uncertainty calculation already used by the Alk worked examples;
- aligns Part II to the same formula family;
- adds a five-reading golden that distinguishes the formulae.

This is a **canon-completeness/shared-architecture correction**, not a new Alk controller policy.

All other Freeze-2 behavioural decisions remain unchanged.


**Freeze rule:** Part III behavioural semantics are frozen. Any subsequent behavioural change requires:
1. the affected rule ID(s);
2. a concrete failure scenario;
3. classification as shared-architecture defect, Alk canon defect, implementation defect, or deliberate product change;
4. affected golden-test updates;
5. a new Alk freeze identifier (Freeze 4 or later).

Implementation/code conformance remains a separate gate.  
**Parent rules:** Parts I–II.  
**Scope:** Three-part / independent alkalinity supplementation using a known liquid alkalinity solution delivered manually or by dosing pump. It does not define kalkwasser, calcium-reactor or combined two-part control.

The purpose of this Part is to plug alkalinity-specific chemistry and policy into the shared V2 machinery.

Any future unresolved owner decision must be marked explicitly before implementation. No initial Alk owner decision remains open in this Part.

---

## ALK-001 — What the Alk engine is trying to control

The alkalinity engine has three distinct jobs:

1. determine where alkalinity is now;
2. determine whether maintenance supply matches ongoing alkalinity consumption;
3. where the keeper chooses, execute a separate controlled return of a stable out-of-range level toward the target range.

The automatic maintenance controller targets:

\[
S_{desired}=0
\]

where \(S\) is alkalinity trajectory in dKH/day.

It does **not** automatically target the midpoint of the user's range.

This is `CORE-STABILISE-001`.

### The application recommends. It does not act.

`ALK-RECOMMEND-ONLY-001`

**Owner decision 23. Foundational, and it supersedes any canon wording that assumes
otherwise.**

The application **never controls, drives, commands or actuates a dosing pump**. It has no
connection to any doser. It produces a **recommended dosing rate for a human being**, who
decides whether to act on it and, if so, changes their own equipment themselves. **There is
no execution path from the engine to the tank.**

Everything below follows from that one fact.

**1. One output, not two.** The distinction between an "exact advisory rate" that the
keeper may act on and an "executable command" that a pump would execute is **retired**,
because the second half of it never existed. Where this canon previously emitted two
**separately labelled outputs** — one exact and actionable, one rounded and executable, the
second sometimes `NOT_RUN` while the first was stated — it emits **one recommended rate**,
rounded for human legibility. The full-precision value is retained as an **auditable
intermediate**, not as a second output, exactly as ordinary maintenance already does
(`continuousActionCandidateMlPerDay` beside `recommendedDoseMlPerDay`). Retaining an
intermediate is not the retired split: the split was two *answers*, and there is now one.

**2. Actuator capability is not a concept in this system.** Every rule, predicate, reason
code and status whose only purpose was to **withhold** an output because a *device*
increment was unknown or unavailable is **retired**. There is no actuator, no device
increment, and no state in which the engine must refuse to advise for want of one.

This retires a **capability concept**, not a **number**. The rounding increment itself
survives, reclassified — see item 5. The symbol \(R_{pump}\) is renamed
\(R_{precision}\) wherever it appears, because it never described a pump; the quantity, its
value and every threshold expressed in it (`ALK-STEP-CAP-001`'s
\(0.25\,D_{current}\ge R_{precision}\) and \(D_{current}\ge 4R_{precision}\), and
`ALK-ROUNDING-001`'s rounding step) are **arithmetically unchanged**.

**3. No actuator-capability status.** `CAPABILITY_ACTUATOR_INCREMENT_REQUIRED` is retired.
The remaining `CAPABILITY_` states — missing potency, missing solution or delivery context,
imprecise measurement time, unavailable historical configuration and the rest — have
substance independent of any actuator and are unaffected.

**4. Withholding a recommendation has no physical effect.** Any rule, invariant or recorded
exposure that reasoned about *delivery continuing*, *delivery rising*, *a pump running on*
or *an in-flight rate persisting* when an output is withheld was reasoning about a mechanism
that does not exist. Withholding a recommendation means the keeper is told the engine cannot
advise, and the keeper's dosing continues to be whatever the keeper set it to — which the
engine neither changes nor fails to change. Such reasoning is corrected throughout to be
about **advice only**.

**5. Rounding survives, for legibility only.** `ALK-ROUNDING-001` continues to round a
recommended number, because a human reads it. It does **not** exist to match a hardware
increment. Its increment is renamed `recommendationPrecisionMlPerDay`: a **display
convention**, not a device capability. The field **exists and is read** — item 2 retires the
capability that made it load-bearing, not the field. It is never "unavailable" in the sense
that withholds an output. Precisely:

```text
recommendationPrecisionMlPerDay CONFIGURED and > 0
    -> ALK-ROUNDING-001 rounds to it, exactly as before

recommendationPrecisionMlPerDay CONFIGURED and <= 0
    -> VALIDATION_RECOMMENDATION_PRECISION_INVALID; this is a bad configured value,
       which is a validation failure and always was

recommendationPrecisionMlPerDay NOT CONFIGURED AT ALL
    -> the engine states the FULL-PRECISION recommendation and withholds nothing
    -> NO reason code is emitted for this: it is an ordinary answer, not an exception
    -> ALK-ROUNDING-001's step-6 hard-constraint recheck STILL RUNS
    -> NOT a capability refusal, NOT NOT_RUN, NOT WITHHELD
    -> no default increment is assumed, invented or borrowed
```

**6. Vocabulary.** The phrases "actuator command", "executable command", "pump command" and
"nearest pump setting" are **not live vocabulary** in this canon. The output is a
**recommendation** or a **recommended rate**. Where those phrases appear inside a passage
marked as preserved history, they are quoted history and are **left exactly as they were
written** — history that has been reworded is no longer history.

**What this rule does not change.** Every chemistry conclusion, threshold, rail, guard,
uncertainty treatment, evidence rule and retest rule is untouched. Decision 23 changes what
the engine is understood to be *doing with* its numbers, not what the numbers are.

**Retired by this decision** — each preserved as marked history in place rather than
deleted:

| Retired | Why |
|---|---|
| `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` | its entire premise was the split between an exact advisory rate and an executable rounded command under an unavailable device increment |
| `ALK-SAFETY-CORRECTION-RESOLUTION-001` | an `M-1` exemption for a one-off volume when the maintenance increment is missing; there is no increment to be missing |
| `M-1`'s `actuatorIncrementMlPerDay` limb — the field, its `REFUSE` behaviour and `ACTUATOR_INCREMENT_REQUIRED` | there is no actuator increment to require; the remainder of `ALK-CAPABILITY-CONTRACT-001` is unaffected |

---

## ALK-002 — Units

Canonical units:

- alkalinity level: **dKH**
- trajectory: **dKH/day**
- consumption: **dKH/day**
- effective potency: **dKH/mL**
- maintenance dose: **mL/day**
- correction / plan amount: **mL**, or **mL/day** when represented as a temporary daily rate
- system volume: **L**
- elapsed time: **hours / days**

Conversions:

\[
1\ meq/L = 2.8\ dKH
\]

\[
1\ dKH \approx 0.35714\ meq/L
\]

Calculations use full stored precision.

Display rounding never enters control arithmetic.

---

## ALK-003 — Target range and outer operating bounds

### User target range

The keeper defines a minimum and maximum target range.

There is no separately stored ideal alkalinity point.

Where a single destination is needed for a deliberate return plan:

\[
AimPoint=\frac{RangeMin+RangeMax}{2}
\]

### V1 default target range retained

The V1 setup suggestion of:

**8.2–8.8 dKH**

is retained as a starting suggestion, not a universal biological optimum.

The user may choose another range inside the outer operating bounds.

### Outer operating bounds

`ALK-OUTER-BOUNDS-001`

V1's **7–11 dKH** internal operating envelope is retained as the V2 default Alk outer operating envelope.

It remains reviewable in a future canon version, but it is **not unresolved in this Part**.

It is used as a higher-severity internal boundary, not as the app declaring that every value inside is “safe” for every coral or every nutrient regime.

The app should not use the words *safe* or *unsafe* in ordinary user-facing copy.

**V1 disposition:** KEEP concept and values, but keep the wording modest.

Source basis reviewed during V2 drafting:
- Randy Holmes-Farley's long-standing reef-aquarium guidance places ordinary reef alkalinity around 7–11 dKH and explicitly notes that different reef systems may legitimately choose different values inside that range.
- Manufacturer guidance differs in preferred operating target, reinforcing that V2 should not impose one universal target.

---


## ALK-003A — Outer-bound safety action

`ALK-OUTER-BOUND-ACTION-001`

The outer operating envelope is not merely a display severity.

It creates the one explicit Alk exception to ordinary **stabilise first** sequencing.

### Position

For configured/default outer bounds:

```text
OuterMin = 7.0 dKH
OuterMax = 11.0 dKH
```

If \(A_{now}<OuterMin\):

```text
position = ALERT_LOW
outerBoundState = BREACHED_LOW
```

If \(A_{now}>OuterMax\):

```text
position = ALERT_HIGH
outerBoundState = BREACHED_HIGH
```

At exactly an outer bound, the level is not `BREACHED`, but proximity may shorten retesting through the forecast/scheduler.

### Maintenance remains a separate question

An outer-bound breach does **not** permit the engine to invent a new permanent maintenance dose.

The engine may continue to calculate permanent maintenance from eligible evidence, but the safety-return layer owns the immediate level-protection action.

### Safety buffer

`ALK-SAFETY-BUFFER-001`

A safety return must not terminate exactly at the outer boundary.

Define:

\[
\boxed{
B_{safety}
=
2\sigma_{Alk,base}
}
\]

With the canonical Alk uncertainty floor:

\[
B_{safety}=0.20\ dKH
\]

### Freeze-2 interpretation of the safety buffer

`B_safety` is a **derived fixed controller constant** in Alk V2 Freeze 3.

It is derived from:

```text
2 × canonical Alk base uncertainty floor
= 2 × 0.10 dKH
= 0.20 dKH
```

It is **not** recalculated from:
- the current test kit;
- per-reading precision;
- residual scatter;
- the current trend's `sigma_point`;
- or a keeper-specific measurement uncertainty.

A future behavioural change that makes the safety buffer adaptive would require a new Alk freeze identifier and corresponding golden updates.

Safety destinations are:

\[
\boxed{
A_{safe,low}
=
OuterMin+B_{safety}
}
\]

\[
\boxed{
A_{safe,high}
=
OuterMax-B_{safety}
}
\]

For the default 7.0–11.0 dKH envelope:

```text
low safety destination = 7.20 dKH
high safety destination = 10.80 dKH
```

This buffer is analytical, not a new preferred target range.

It exists to prevent immediate re-triggering from ordinary measurement noise or an uncorrected underlying drift.

### Safety-return exception

When the latest valid Alk is beyond an outer bound, a temporary safety-return action is recommended immediately.

```text
interventionType = SAFETY_RETURN
priority = URGENT
```

The safety destination is the appropriate buffered destination above.

#### Low breach

For \(A_{now}<OuterMin\), desired movement for the next 24 hours is:

\[
\Delta A_{safety}
=
\min(
A_{safe,low}-A_{now},
0.50
)
\]

One-off correction volume:

\[
\boxed{
V_{safety}
=
\frac{
\Delta A_{safety}
}{
P_{selected}
}
}
\]

subject to:
- valid potency;
- composite Alk rail under `ALK-COMPOSITE-RAIL-001`;
- liquid-volume guard;
- the safety-correction resolution rule below;
- `ALK-SAFETY-MG-OVERRIDE-001` for magnesium alert-low; any other cross-parameter constraint only when explicitly defined by its owning canon;
- user confirmation / actual implementation logging.

Example:

\[
A_{now}=6.8,\quad A_{safe,low}=7.2
\]

\[
\Delta A_{safety}=0.40\ dKH
\]

The app recommends a temporary safety correction toward 7.20 dKH rather than terminating at 7.00.

Permanent maintenance remains a separate inference.


### One-off safety-correction resolution

`ALK-SAFETY-CORRECTION-RESOLUTION-001` — **RETIRED by owner decision 23**

**This rule no longer governs anything, and it is not live authority for any output.** It
was an `M-1` exemption: it let a one-off `SAFETY_RETURN` correction volume be emitted even
though the maintenance **actuator increment** (`actuatorIncrementMlPerDay`) was missing.
`ALK-RECOMMEND-ONLY-001` retires actuator capability as a concept, so there is no device
increment to be missing and nothing to exempt the correction from. **No rule may cite this
ID as governing authority.**

**What survives, and where it now lives.** The one-off low-breach correction volume itself
is calculated by `ALK-OUTER-BOUND-ACTION-001`, which is unchanged:

\[
V_{safety}
=
\frac{\Delta A_{safety}}{P_{selected}}
\]

The **potency requirement remains load-bearing** and is not retired: if `P_selected` is
unavailable or invalid, the engine may state the required dKH movement but must withhold the
mL correction under `CORE-INFORM-PROCEED-001`.

> **Superseded wording, preserved rather than deleted.** This rule previously read: the M-1
> field `actuatorIncrementMlPerDay` and its `REFUSE / ACTUATOR_INCREMENT_REQUIRED`
> behaviour apply to final actionable maintenance-rate recommendations in mL/day and do
> **not** block a one-off `SAFETY_RETURN` correction volume; where the increment was
> missing the engine still emitted the volume with
> `safetyCorrectionStatus = ACTIONABLE` and
> `maintenanceRateRoundingPrecision = MAY_REMAIN_MISSING`, and "the app must not withhold
> the urgent safety correction merely to collect a maintenance-rate increment field". The
> exemption was declared narrow: the one-off correction volume, and the temporary
> high-breach safety rate under `ALK-SAFETY-TEMP-RATE-RESOLUTION-001`, but not ordinary
> maintenance mL/day recommendations.

#### Temporary high-breach safety rate

`ALK-SAFETY-TEMP-RATE-RESOLUTION-001` — **RETIRED by owner decision 23**

**This rule no longer governs anything, and it is not live authority for any output.** Its
entire premise was the separation of an exact advisory rate from an **executable rounded
command** while an **actuator increment** was unavailable. `ALK-RECOMMEND-ONLY-001`
establishes that the application never commands a pump, so there is no executable command to
separate the advisory rate from, and no device increment to be missing. **No rule may cite
this ID as governing authority.**

**What survives, and where it now lives.** The high-breach paths produce
\(D_{safety,temp}\), a temporary safety **rate** in mL/day — from consumption where
\(C_{estimate}\) is usable (`ALK-003A` branch A), and from \(D_{current}\) where it is
not (`ALK-HIGH-BREACH-SAFETY-SIZING-001` branch B, owner decision 16;
`ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001` branch B′, owner decision 22). That rate is
now a **single recommended figure**:

```text
temporarySafetyRateContinuousMlPerDay      = D_safety,temp     # auditable intermediate
temporarySafetyRateRecommendationMlPerDay  = ALK-ROUNDING-001 of the above   # THE output
```

Two requirements this rule carried are **not** retired and are restated here because they
have nothing to do with device capability:

- the **potency requirement remains load-bearing**: if `P_selected` is unavailable or
  invalid, \(D_{safety,temp}\) is not calculable and the engine states the required dKH
  movement and direction only, under `CORE-INFORM-PROCEED-001`;
- all hard rails and guards remain applicable — the 0.50 dKH/day rail (`ALK-046`),
  `ALK-COMPOSITE-RAIL-001`, `ALK-LIQUID-VOLUME-GUARD-001` and the non-negative clamp
  already inside \(D_{safety,temp}\).

> **Superseded wording, preserved rather than deleted.** This rule previously read:
>
> > The exemption is extended to cover it. When `actuatorIncrementMlPerDay` is unavailable,
> > the **exact calculated temporary safety rate may be emitted as an advisory rate**. Two
> > outputs are kept **distinct and separately labelled**, and must never be merged:
> > `temporarySafetyRateContinuousMlPerDay = D_safety,temp` (exact, full precision);
> > `temporarySafetyRateExecutableMlPerDay = NOT_RUN` (while the increment is absent);
> > `reason = CAPABILITY_ACTUATOR_INCREMENT_REQUIRED`. Once the increment becomes
> > available, the executable command is produced by `ALK-ROUNDING-001` from the same
> > advisory rate.
>
> `OI-SAFETYRATE-001`, which Freeze 5 closed as F5-11 by writing this rule, is
> **reclassified INAPPLICABLE** by decision 23: the question it asked — whether a safety
> rate may be emitted when the recommendation precision is unknown — cannot arise.


#### High breach — interpretable consumption

For \(A_{now}>OuterMax\), the app cannot deliver a negative chemical correction.

This branch applies where \(C_{estimate}\ge0\) and current consumption is physically
interpretable. Where \(C_{estimate}<0\), the estimate is not usable for sizing and
`ALK-HIGH-BREACH-SAFETY-SIZING-001` below owns the temporary rate instead (**owner
decision 16**). Define:

\[
R_{down}
=
\min(
A_{now}-A_{safe,high},
0.50
)
\]

\[
S_{safety}=-R_{down}
\]

Then:

\[
\boxed{
D_{safety,temp}
=
\max
\left(
0,
\frac{
C_{estimate}+S_{safety}
}{
P_{selected}
}
\right)
}
\]

because:

\[
S=PD-C
\]

If zero dosing cannot achieve the desired decline, report the slower physically achievable decline rather than inventing negative dosing.

#### High breach — consumption not usable for sizing

`ALK-HIGH-BREACH-UNRESOLVED-001`

**Amended by owner decision 16.** This rule's *automatic zero-dose pause* is superseded by
`ALK-HIGH-BREACH-SAFETY-SIZING-001` below. What it says about the maintenance model, the
temporary correction component and the retest cadence is unchanged and still governs. The
superseded wording is preserved here so the change is visible rather than silently
rewritten:

> - **recommend a temporary pause of Alk dosing to 0 mL/day pending the next valid Alk assessment;**
>
> ```text
> safetyDoseRecommendation = 0 mL/day
> safetyDoseReason = HIGH_BREACH_CONSUMPTION_UNINTERPRETABLE
> ```

Zero delivery is no longer *chosen* because the estimate is uninterpretable. It is now
reached only where the sizing rule below floors at zero.

If:

\[
A_{now}>OuterMax
\]

and \(C_{estimate}\) is not usable for safety-dose sizing — it is negative, on either side
of `ALK-NEGATIVE-MATERIALITY-001`'s boundary, or otherwise physically uninterpretable:

- stop any separately temporary upward correction/return component;
- size the temporary safety rate under `ALK-HIGH-BREACH-SAFETY-SIZING-001` below;
- do **not** label that rate as a newly inferred permanent maintenance requirement;
- preserve the established maintenance estimate/history separately;
- set:

```text
safetyDoseReason = HIGH_BREACH_CONSUMPTION_NOT_USABLE_FOR_SIZING
maintenanceEstimateStatus = UNRESOLVED
```

- retest Alk approximately 24 hours later, or sooner if a rapid/suspicious-reading rule requires it.

Reason:

> when the level is already above the outer bound and mass-balance arithmetic cannot support a maintenance estimate, continuing to supply alkalinity at the established rate is not the conservative default. The conservative default is to reduce delivery by the amount the level is asking for, which is what the sizing rule below does.

The temporary safety rate is a fail-safe response to an invalid model, not an inferred
claim about biological consumption in either direction.

If the app cannot directly control the pump, it says the temporary rate **is recommended**
and does not mark it as actually implemented until implementation is confirmed.

#### Advisory range boundary — escalate rather than calculate

`ALK-ADVISORY-RANGE-BOUNDARY-001`

**Owner decision 24. This rule is now a WARNING, not a refusal.** It supersedes owner
decision 21's withholding behaviour entirely; that wording is preserved as marked history at
the end of this rule.

The boundary itself is unchanged, and is still an **offset from the already-configured
bounds**, so no free-standing numeric level is introduced — only the offset:

\[
\boxed{
AdvisoryCeiling = OuterMax + 1.0\ \text{dKH}
\qquad
AdvisoryFloor = OuterMin - 1.0\ \text{dKH}
}
\]

For the owner's configured bounds (`OuterMin` 7.0, `OuterMax` 11.0) this places the ceiling
at **12.0 dKH** and the floor at **6.0 dKH**. The boundary moves with the configuration; it
is not a second set of pinned levels.

**Trigger.** The warning attaches when the resolved episode value is

- at or beyond \(AdvisoryCeiling\) — that is, \(A_{now}\ge AdvisoryCeiling\); or
- at or beyond \(AdvisoryFloor\) on the low side — that is, \(A_{now}\le AdvisoryFloor\).

Both comparisons are **inclusive at the boundary**: exactly 12.0 dKH warns, and exactly
6.0 dKH warns. `ALK-DECIMAL-THRESHOLD-001`'s exact decimal comparison governs the test, so
no epsilon exists or may be introduced.

**What happens at and beyond the boundary.**

```text
the ordinary recommendation is produced by the ORDINARY RULES, unchanged
    + advisoryConfidenceWarning = ATTACHED
    + reason = SAFETY_ADVISORY_CONFIDENCE_WARNING
```

**The field has exactly two states (owner decision 29).** The warning is present or it is
absent; there is no third value:

```text
advisoryConfidenceWarning = ATTACHED   # present: the resolved value is at or beyond a boundary
advisoryConfidenceWarning = NONE       # absent:  it is not
```

Where **no reading resolves at all** — no valid measurement exists, so there is no
observation and no recommendation — there is nothing to warn about, and the field is
**absent**, which is `NONE`. It is not a third state, and it is not `NOT_RUN`: a field that
is absent because there is nothing to describe is simply absent.

**Superseded, preserved:** the field was previously `NONE | ATTACHED | NOT_RUN`, with
`NOT_RUN` documented only as "where no episode value resolves". `OI-ADVISORYWARNSTATE-001`
recorded that its trigger set was never stated in the rule that owns the field. Owner
decision 29 removes the value rather than specifying it, and owner decision 27 removes the
contested case that was its only documented trigger.

The engine **continues to advise**. It does **not** withhold, does **not** emit zero, and
does **not** escalate in place of advising. Whatever the ordinary rules would have
recommended one increment below the boundary, they recommend at it and above it, by the same
arithmetic.

**The warning is an additional structured output beside the recommendation.** It states
**all five of the following, none optional**:

- the measured value;
- that the reading is **beyond the range the engine is confident in**;
- that the reading should be **confirmed with a second test**;
- that the **dosing setup should be checked** for fault or overdose;
- that correction at this level **warrants experienced judgement about the specific
  system**.

**The warning must not alter anything it accompanies.** It may not change:

```text
the recommended rate            the trajectory
the consumption estimate        the retest schedule
```

nor the outer-bound classification, the evidence state, or any rail or guard. It is
information attached to an answer, not a modifier of it.

**No discontinuity at the boundary.** The recommendation immediately below the boundary and
the recommendation at or immediately above it are produced by the **same rules** and differ
only by the presence of the warning. This is the property that decision 24 exists to
establish, and it is asserted as an invariant rather than left to inspection.

**Retest — one answer, not two.** `ALK-RETEST-SCHEDULER-001` is the single authority on Alk
retest timing (`X-INV-004`, Part II §50). Under **owner decision 26** the warning **renders
whatever interval the scheduler produced** and **must not state an interval of its own**.
"Confirm with a second test" is a statement about confidence in the reading, not a schedule.
The warning adds no candidate to the scheduler and computes no next-test time; where the
scheduler's answer is the ~24 h high-breach cadence, the warning says ~24 h, and where a
repeat rule already produced `REPEAT_NOW`, the warning says now.

**Episodes.** The warning attaches to the resolved episode value like any other consumer of
it, and under **owner decision 27** every episode resolves: the application does not know
what produced a reading, so two readings inside one episode cannot contest each other. Two
readings 12 minutes apart at 10.4 and 12.9 dKH are one observation of 11.65 dKH with a
0.20-exceeding spread — an ordinary `ANOMALOUS` cluster on Part II §48's path — and the
warning attaches or does not attach according to where 11.65 falls, like any other value.

**The member-wise predicate of decision 21 is retired with the withholding it served**:
because advice is no longer withheld at the boundary, an episode's member statuses do not
determine whether advice is withheld, and `ALK-EPISODE-SINGLE-OUTPUT-001` needs no
exception.

**Superseded, preserved:** this paragraph previously read *"Where the episode is contested
and no value resolves, there is no value to warn about and no recommendation to attach a
warning to; `ALK-EPISODE-RESOLUTION-001`'s contested handling governs unchanged —
`position`, `outerBoundState` and `rapidConfirmed` `NOT_RUN`, and `REPEAT_NOW`."* Owner
decision 27 retires the contested state, so that branch is unreachable.

**Scope, stated so it is not over-read.** Decision 21 narrowed the open finding that safety
sizing is flat above the rail by bounding the region the sizing rule governed. **Decision 24
removes that bound**: the ordinary rules now run at every level, so `R_{down}` saturates at
the 0.50 dKH/day rail and the sized rate stops responding to \(A_{now}\) from
\(A_{safe,high}+0.50\) **upward without limit**, exactly as it did before decision 21.
`OI-SIZINGFLAT-001` is therefore **not narrowed any more, and is emphatically not closed**.
Its reach is wider under decision 24 than under decision 21: this rule **narrows nothing** and
**resolves nothing** — it removes the narrowing that decision 21 provided. Nothing here
compensates for it, and no branch boundary is moved.

> **Superseded by owner decision 24, preserved rather than deleted.** Under owner decision
> 21 this rule read, in place of everything above from "What happens at and beyond the
> boundary" onward:
>
> > When the trigger holds: `recommendedDoseMlPerDay = WITHHELD`,
> > `temporarySafetyRateContinuousMlPerDay = NOT_RUN`,
> > `temporarySafetyRateRecommendationMlPerDay = NOT_RUN`,
> > `maintenanceEstimateStatus = UNRESOLVED`, `reason = SAFETY_ADVISORY_CONFIDENCE_WARNING`.
> > **No dose recommendation, no temporary safety rate, no recommendation — and not
> > zero.** Delivery guidance is **withheld**, not set. The single exception is an
> > **already-authoritative safety rule that explicitly governs the state**. An escalation
> > output states the measured value, that it is outside the range the engine will advise
> > on, and the three further elements above. A contested episode did not bypass the check:
> > if **every** member was at or beyond the boundary, escalation applied.
>
> Three recorded exposures existed only because advice was withheld, and are resolved by
> decision 24 rather than answered: `OI-ADVISORYEXCEPTION-001` (there is no exception list,
> because there is no withholding to except anything from), `OI-ADVISORYRETURN-001` (an
> in-flight return plan terminated at the boundary is now replaced by the ordinary sized
> recommendation, as it is anywhere else), and `OI-ADVISORYMEMBERS-001` (a contested
> episode's member statuses no longer determine whether advice is withheld).
> `OI-ADVISORYRETEST-001` is resolved by owner decision 26 above.

#### High breach — safety-dose sizing when consumption is unusable

`ALK-HIGH-BREACH-SAFETY-SIZING-001`

**Owner decision 16.** Negative-consumption materiality owns interpretation of the
**maintenance model**. It does **not** own high-breach temporary safety-dose sizing and may
not choose the delivered safety rate. This supersedes, for that choice only:

- `ALK-HIGH-BREACH-UNRESOLVED-001`'s automatic pause to 0 mL/day; and
- `ALK-HIGH-BREACH-NO-PAUSE-001`'s HOLD of the established delivery rate.

Where \(A_{now}>OuterMax\) and \(C_{estimate}<0\), the estimate is unusable for sizing on
**either** side of the materiality boundary. The desired downward safety effect is the one
this section already defines:

\[
\boxed{
R_{down}
=
\min(
A_{now}-A_{safe,high},
0.50
)
}
\]

and the temporary safety rate is derived from the **controllable configured-delivery
contribution** instead of from \(C_{estimate}\):

\[
\boxed{
D_{safety,temp}
=
\max
\left(
0,
D_{current}
-
\frac{R_{down}}{P_{selected}}
\right)
}
\]

**Amended by owner decision 20.** This formula previously named \(D_{established}\) — a
single name that was also being used for the interval-mean delivery rate that consumption
estimation needs. `ALK-DELIVERY-RATE-BASIS-001` splits it, and high-breach safety sizing
takes \(D_{current}\): the alkalinity delivery rate the doser is **configured to be
delivering at the time of the recommendation**. Superseded wording, preserved rather than
rewritten away:

> \[
> D_{safety,temp} = \max\left(0, D_{established} - \frac{R_{down}}{P_{selected}}\right)
> \]
>
> where \(D_{established}\) is the established maintenance delivery rate in mL/day — the
> rate actually being delivered, on the same dose-history basis every other Alk calculation
> uses.

\(P_{selected}\) is the selected potency in dKH/mL. Sizing a temporary reduction asks what
is being **delivered now**, not what was delivered on average across a past interval, so
\(D_{history}\) is the wrong input here and may **not** be substituted for
\(D_{current}\). Where the doser has been on one constant rate for the whole interval the
two are numerically equal; that coincidence is not a licence to interchange them.

**\(D_{current}\) unknown — refuse, never assume zero.** **Amended by owner decision 25:**
this is no longer a clause of this rule at all. It is a **precondition evaluated before
branch selection**, in `ALK-DELIVERY-RATE-BASIS-001`, and it applies identically to branches
A, B and B'. It is restated here for the reader of this rule and is not a second owner of the
inference. If \(D_{current}\) is unknown or not configured, **no temporary safety
recommendation is produced on any branch**:

```text
temporarySafetyRateContinuousMlPerDay = NOT_RUN
temporarySafetyRateRecommendationMlPerDay  = NOT_RUN
maintenanceEstimateStatus           = UNRESOLVED
reason = SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN
```

The engine surfaces the measured state and the reason, and requests doser configuration
through the **existing** anomaly/confirmation machinery (`CORE-INFORM-PROCEED-001`,
`ALK-CAPABILITY-CONTRACT-001`) — no new prompt mechanism is introduced. The outer-bound
state, `SAFETY_RETURN` and the shortened retest cadence continue unchanged.

Emitting `0 mL/day` here is **forbidden**. Zero is a computed floor reached only through the
\(\max(0,\cdot)\) above with a known \(D_{current}\); presenting it as a recommendation when
the delivered rate is unknown would state a computed answer the engine does not have.

This is a **temporary high-breach safety delivery rate**, not a newly inferred maintenance
requirement:

```text
maintenanceEstimateStatus = UNRESOLVED
reason                    = SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE
```

**Zero is a floor, not a decision.** Delivery reaches 0 mL/day only where the configured
contribution cannot absorb the requested \(R_{down}\):

\[
D_{current}\le\frac{R_{down}}{P_{selected}}
\]

```text
reason = SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO
```

Negative-consumption materiality never selects zero versus a held rate. It classifies the
maintenance model and its evidence, and nothing else here.

**What this rule requires, stated so it is checkable.** All three hold **above the zero
floor** — that is, where \(D_{current}>R_{down}/P_{selected}\). At or below the floor the
rate is 0 and varies with nothing, which is the floor's purpose and not a violation:

- the safety response **varies with \(A_{now}\)** through \(R_{down}\), monotonically,
  until the 0.50 dKH/day rail binds and \(R_{down}\) saturates;
- the safety response varies **continuously with \(D_{current}\)**: one recommendation
  precision step more configured dose gives exactly one step more safety rate. The
  1.5 mL/day → pause versus 1.6 mL/day → hold discontinuity that
  `ALK-HIGH-BREACH-NO-PAUSE-001` previously produced is removed and must not reappear;
- the materiality classification may change the recorded classification, the wording and
  the maintenance evidence state on either side of the boundary. It may **not** change
  \(D_{safety,temp}\) — at, above or below the floor.

Two clusters of readings fall at the floor rather than above it: with \(P=0.0693\),
\(R_{down}/P_{selected}\) is 3.6–7.2 mL/day, so a configured dose below that delivers
zero. `AD-CON-002` is such a case and is not a counter-example to the bullets above.

**Where this rule sits in the sequence, as amended by owner decision 24.** This rule governs
the **whole** high-breach region \(A_{now} > OuterMax\), with **no upper limit**.
`ALK-ADVISORY-RANGE-BOUNDARY-001` no longer gates it: under owner decision 24 that rule is a
warning, not a refusal, so at and beyond \(AdvisoryCeiling\) this rule **still sizes the
rate, by the same arithmetic**, and the warning attaches beside the answer. There is no
level above which sizing stops.

> **Superseded wording, preserved rather than deleted.** Under owner decision 21 this
> paragraph read: "The escalation check of `ALK-ADVISORY-RANGE-BOUNDARY-001` is evaluated
> **before** this rule. At or beyond `AdvisoryCeiling` no rate is sized here at all. This
> rule governs the band \(OuterMax < A_{now} < AdvisoryCeiling\)." Owner decision 24
> removed that bound.

**Everything else is preserved and still applies:**

- potency validity — if \(P_{selected}\) is unavailable or invalid, \(D_{safety,temp}\) is
  not calculable, and the engine states the required dKH movement and direction only under
  `CORE-INFORM-PROCEED-001`;
- recommendation rounding for legibility (`ALK-ROUNDING-001`). The
  advisory-versus-executable separation that `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` used to
  impose here is **retired by owner decision 23**: there is one recommended rate;
- the composite 0.50 dKH/day rail (`ALK-046`, `ALK-COMPOSITE-RAIL-001`);
- the liquid-volume guard (`ALK-LIQUID-VOLUME-GUARD-001`);
- recommendation rounding (`ALK-ROUNDING-001`), including its step-6 hard-constraint recheck;
- `SAFETY_RETURN` integration, the intervention lock and
  `ALK-RETURN-TERMINATED-BY-SAFETY-001`;
- the magnesium-gate surfacing of `ALK-SAFETY-MG-OVERRIDE-001`;
- shortened/reprioritised high-breach retesting.

No new constant is introduced. \(R_{down}\), the 0.50 rail, \(P_{selected}\) and the
configured delivery rate are all already frozen.

#### High breach — consumption not computable at all

`ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`

**Owner decision 22, as amended by owner decision 24.** Where \(A_{now} > OuterMax\) — at
any level above the outer bound, with **no upper limit**, because owner decision 24 made the
advisory boundary a warning rather than a refusal — and \(C_{estimate}\)
is **not computable at all** — insufficient history, a first-ever test, an unknown dose
history, or any other state in which the mass balance cannot be evaluated rather than
evaluating to a number — the state takes the **branch B pathway**:

\[
\boxed{
D_{safety,temp}
=
\max
\left(
0,
D_{current}
-
\frac{R_{down}}{P_{selected}}
\right)
}
\]

with

```text
maintenanceEstimateStatus = UNRESOLVED
reason = SAFETY_HIGH_BREACH_CONSUMPTION_NOT_COMPUTABLE
       + SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE
```

and the reason the estimate could not be computed surfaced with it.

**Rationale, encoded because it is the point of the branch.** Sizing the temporary safety
reduction requires knowing **what is being delivered**, not what is being consumed. The
absence of a consumption estimate does not prevent a defensible downward safety action: the
engine still knows the level is above the outer bound, still knows how far down it wants to
move (\(R_{down}\)), and still knows the configured delivery rate it can reduce. Withholding
a reduction for want of a consumption number would leave delivery running unchanged above
the outer bound, which is the outcome decision 16 already rejected.

**Distinct from an unknown \(D_{current}\).** This branch requires \(D_{current}\) to be
**known**. Where \(D_{current}\) itself is unknown, `ALK-HIGH-BREACH-SAFETY-SIZING-001`
**refuses** under owner decision 20 and emits no rate — not this branch, and not zero. The
two states are not interchangeable: one is missing the consumption estimate, the other is
missing the quantity the formula reduces.

**The three high-breach predicates are jointly exhaustive and mutually exclusive** over the
state space \(A_{now} > OuterMax\) — the **whole** region, with no upper limit, since owner
decision 24 removed the `AdvisoryCeiling` bound decision 21 had imposed on it:

```text
A.   C_estimate >= 0 AND physically interpretable
       -> sized from consumption            (ALK-003A interpretable branch)
B.   C_estimate negative, either side of the materiality boundary,
     OR computable but otherwise physically uninterpretable
       -> sized from D_current              (ALK-HIGH-BREACH-SAFETY-SIZING-001)
B'.  C_estimate not computable at all
       -> sized from D_current              (this rule)
```

Every high-breach state that **reaches** branch selection selects **exactly one** of A, B
and B'. There is no fourth branch. A state reaches branch selection at any level above
\(OuterMax\), with no upper limit (owner decision 24), **provided the high-breach
precondition of `ALK-DELIVERY-RATE-BASIS-001` passes**.

**Why B carries the uninterpretable disjunct.** Branch A's precondition in `ALK-003A` is
`C_estimate >= 0` **and** physically interpretable, so a computable, non-negative estimate
that is nonetheless not physically interpretable satisfies neither A nor "negative". That
state is not hypothetical — `ALK-HIGH-BREACH-UNRESOLVED-001` already enumerates
\(C_{estimate}\) as unusable when it is "negative, on either side of
`ALK-NEGATIVE-MATERIALITY-001`'s boundary, **or otherwise physically uninterpretable**", and
routes it to `ALK-HIGH-BREACH-SAFETY-SIZING-001`. B is therefore written to match that
existing routing rather than to a narrower `C_estimate < 0`. No new decision is taken here:
the disjunct is read off the rule that already owns the routing.

**What is NOT a fourth branch, as amended by owner decision 25.** Two states produce no
rate, and neither creates a fourth branch — but they are **not** the same shape as each
other, and the difference is load-bearing:

- \(D_{current}\) **unknown or not configured** — the high-breach **precondition** of
  `ALK-DELIVERY-RATE-BASIS-001` refuses, and it is evaluated **before** branch selection.
  Selection therefore does not run and **no branch is selected**:
  `branchSelected = NOT_RUN`, `preconditionPassed = false`. This is not a fourth branch
  because it is not a branch at all — it is the gate in front of the branch tree;
- \(P_{selected}\) **unavailable or invalid** — the precondition passes, a branch **is**
  selected, and `ALK-HIGH-BREACH-SAFETY-SIZING-001`'s preserved potency clause then
  governs: \(D_{safety,temp}\) is not calculable and the engine states the required dKH
  movement and direction only, under `CORE-INFORM-PROCEED-001`. This state also makes
  \(C_{estimate}\) uncomputable, so the branch it selects is B'.

So exactly one of these three shapes holds for every high-breach state: the precondition
refuses and no branch is selected; or a branch is selected and states a rate; or a branch is
selected and the potency clause withholds the mL figure. `INV-G12` and `INV-G15` assert this
together, and they must not be read as disagreeing: `INV-G12` partitions the states that
**reach** selection, `INV-G15` governs the gate in front of it.

> **Superseded wording, preserved rather than deleted.** Under owner decision 20 alone this
> passage read: "\(D_{current}\) **unknown** — `ALK-DELIVERY-RATE-BASIS-001` refuses. The
> branch is still selected and identified; only the rate is `NOT_RUN`." Owner decision 25
> moved the refusal ahead of branch selection, so no branch is selected.

**Not addressed here.** The discontinuity in sized rate as \(C_{estimate}\) crosses zero
between branches A and B remains **open** and is deliberately not closed by this rule. No
branch boundary is adjusted to reduce it.

### Composite movement constraint

All simultaneously recommended calculable Alk movement components are subject to `ALK-COMPOSITE-RAIL-001`.

Where a safety return and a new maintenance adjustment would together exceed the rail:
- allocate the permitted movement to the safety return first;
- defer or reduce the new maintenance adjustment;
- do not exceed the rail by treating the two recommendations as independent.

### Completion

A low safety return completes only when:

\[
A_{now}\ge A_{safe,low}
\]

A high safety return completes only when:

\[
A_{now}\le A_{safe,high}
\]

A reading merely crossing back over 7.0 or 11.0 does **not** by itself complete the safety intervention.

While the value is back inside the outer envelope but has not yet reached the buffered safety destination:

```text
outerBoundState = RECOVERING_INSIDE_BOUND
interventionType = SAFETY_RETURN
```

Once the buffered destination is reached:
- end `SAFETY_RETURN`;
- resume ordinary maintenance/stability sequencing;
- any further movement toward the preferred target range uses normal opt-in return-plan rules.

### Safety-return integration with intervention machinery

`ALK-SAFETY-RETURN-INTEGRATION-001`

`SAFETY_RETURN` is a first-class Alk intervention. It must not be treated as an informal side action.

#### 1. Maintenance calculation versus maintenance implementation

While `SAFETY_RETURN` is active:

- the engine may continue to calculate the current permanent-maintenance estimate from otherwise eligible evidence;
- the engine may display that estimate separately for explanation;
- **a new maintenance-dose change is not implemented while the safety return is active**;
- if a new maintenance change would otherwise be recommended, set:

```text
maintenanceActionStatus = DEFERRED_BY_SAFETY_RETURN
```

Reason:

> the immediate safety intervention must not be mixed with a second new Alk dose-change recommendation whose causal effect would then be inseparable.

This does not erase the maintenance inference. It defers its implementation until the safety intervention has ended and a new eligible maintenance assessment exists.

#### 2. Existing maintenance-response attribution window

If a `SAFETY_RETURN` begins while a prior maintenance-dose intervention is still awaiting or undergoing formal response attribution:

```text
priorResponseAttribution = INTERRUPTED_BY_SAFETY_RETURN
```

The prior intervention:
- keeps its immutable historical prediction snapshot;
- remains in history as the intervention that actually occurred;
- is no longer eligible for a clean six-way causal response classification across the safety-return period;
- does not have its old prediction rewritten.

After the safety return ends, current maintenance analysis restarts from a new clean regime once ordinary evidence requirements are met.

#### 3. Analytical segmentation

A delivered/implemented Alk `SAFETY_RETURN` is treated as a **known Alk correction input** for analytical normalization/segmentation.

If the actual delivered correction amount and time are known:
- record the correction event;
- normalize its known effect under the correction rules where valid;
- start/maintain segment boundaries exactly as required by the event-ledger rules.

If the actual safety-return delivery is unknown or uncertain:
- do not invent the correction effect;
- treat the affected interval as confounded;
- exclude it from causal response attribution and potency learning.

#### 4. Potency learning

Any interval materially affected by a `SAFETY_RETURN` is:

```text
potencyLearningEligible = false
reason = SAFETY_RETURN_CONFOUND
```

for any maintenance-dose intervention whose response window overlaps the safety correction.

A safety return itself is **not** used as a potency-learning calibration intervention.

Reason:

> its purpose is urgent level protection, not clean system identification.

#### 5. Intervention lock

`SAFETY_RETURN` owns the Alk intervention lock for **new Alk dose-change recommendations** while active.

That means:
- no new maintenance-dose change is implemented;
- no ordinary Alk return plan is started;
- no second Alk correction plan is layered on top of it.

##### Existing return plan entering `SAFETY_RETURN`

`ALK-RETURN-TERMINATED-BY-SAFETY-001`

The clause above forbids *starting* a plan and forbids *layering* a second one. This clause
states what happens to an ordinary Alk return plan that was **already running** when the
outer-bound breach occurred.

Entering `SAFETY_RETURN` **immediately terminates** it:

```text
returnPlanPhase              = TERMINATED_BY_SAFETY_RETURN
recommendedTemporaryMovement = STOP_PENDING_USER_ACTION
actualDose                   = last confirmed/logged value, or UNKNOWN
reason                       = RETURN_TERMINATED_BY_SAFETY_RETURN
```

The plan is **not suspended, paused or held pending**, and **opposing intentional
components are never layered**. After termination the `SAFETY_RETURN` owns the single
intentional movement component, so `ALK-COMPOSITE-RAIL-001` has one term and this clause's
no-layering requirement is satisfied by construction rather than by netting two opposing
budgets against one 0.50 dKH/day rail.

A terminated plan **cannot automatically resume**. When the safety return completes under
`ALK-003A`, ordinary sequencing resumes at HOLD. A new return plan requires both:

- fresh eligibility under `ALK-RETURN-ELIGIBLE-TRAJECTORY-001`, evaluated on post-safety
  evidence; and
- a fresh explicit user opt-in (Part I §36.2).

The terminated plan keeps its identity, its stored destination, predicted duration and
expiry, and its place in history. Termination is recorded as an event. It does not rewrite
the plan, and it does not erase what was recommended at the time.

`STOP_PENDING_USER_ACTION` and the `actualDose` semantics are exactly those
`ALK-RETURN-EXPIRY-001` and `WG-ALK-032` already define: the app recommends stopping the
temporary component and must not record it as actually stopped unless implementation is
confirmed.

This terminates the *intentional level-movement* component only. It does not alter the
accepted permanent-maintenance estimate, which continues under clause 1.

The engine may still:
- observe;
- recalculate current position;
- recalculate a provisional maintenance estimate;
- shorten retesting;
- stop/modify the safety return when new safety evidence requires it.

#### 6. Cross-parameter magnesium gate — explicit owner decision

`ALK-SAFETY-MG-OVERRIDE-001`

**Owner decision: OPTION B — Alk outer-bound safety overrides the ordinary magnesium alert-low correction hold.**

If magnesium is below its configured alert-low threshold:

- ordinary Alk correction/return-plan behaviour continues to respect the magnesium hold defined by the coupled-chemistry rules;
- ordinary calcium correction behaviour continues to respect that same magnesium hold;
- **an Alk `SAFETY_RETURN` triggered by an actual outer-bound breach is not withheld solely because magnesium is alert-low.**

The Alk safety return remains subject to:
- Alk potency validity;
- the composite 0.50 dKH/day Alk rail;
- liquid-volume guard;
- rounding for legibility;
- actual implementation logging;
- all non-magnesium safety constraints.

The same user-facing safety card must also surface the magnesium condition.

Required semantic wording:

> **Alkalinity is below the outer operating range. A safety return toward the buffered Alk safety destination is recommended now. Magnesium is low, so alkalinity may be harder to hold until magnesium is corrected.**

Mirror the wording appropriately for a high Alk safety breach if low magnesium is also present.

The magnesium warning:
- informs;
- does not silently block the Alk safety action;
- does not imply the Alk correction is guaranteed to hold;
- does not remove the need to correct magnesium.

#### 7. Calcium and other coupled actions during Alk safety return

The Alk safety exception does **not** automatically unlock simultaneous calcium or magnesium correction actions.

Those parameters remain governed by their own controller/coupling rules.

This prevents one Alk emergency rule from silently becoming a general cross-parameter emergency override.

#### 8. Magnesium-state interface

Part III does not own the derivation of magnesium alert state.

It consumes only the cross-parameter interface:

```text
magnesiumGateState =
    ALERT_LOW
  | NOT_ALERT_LOW
  | UNKNOWN
```

The magnesium/coupling canon owns how that state is calculated, including threshold, freshness and measurement validity.

For Alk safety behaviour:

```text
ALERT_LOW     → allow SAFETY_RETURN + show low-Mg warning
NOT_ALERT_LOW → allow SAFETY_RETURN without low-Mg warning
UNKNOWN       → allow SAFETY_RETURN; do not invent a low-Mg condition
```

Therefore magnesium data is **not a required input for the Alk safety action itself**.

#### 9. Retest scheduler integration

`SAFETY_RETURN` submits a safety candidate to the single canonical retest scheduler.

Default candidate:

```text
reason = SAFETY_RETURN_ACTIVE
candidateInterval ≈ 24 hours
```

Timing anchor:
- if the safety action was confirmed implemented → approximately 24 hours from implementation;
- if it was recommended but not confirmed implemented → approximately 24 hours from the qualifying breach assessment.

The canonical scheduler may choose an **earlier** test when:
- rapid movement;
- suspicious-reading verification;
- forecast outer-bound worsening;
- another higher-priority evidence/safety rule;

requires it.

Cards must render the scheduler output and must not invent a separate safety cadence.

#### 10. Intervention lock is a recommendation lock, not fictional pump control

The intervention lock prevents the **engine from recommending/starting** a second Alk dose-change intervention.

It does not assert that the keeper physically cannot change a pump or manually add Alk.

If the keeper makes an external Alk dose/correction change while `SAFETY_RETURN` is active:
- record it under the external-change/event-ledger rules;
- preserve recommendation-versus-implementation truth;
- re-evaluate segmentation/confounding from the actual event;
- do not pretend the safety plan proceeded unchanged if the actual intervention changed.


**V1 disposition:** KEEP the distinct urgency of the old very-low/emergency card, but restructure it as an explicit temporary safety-return layer rather than a hidden permanent maintenance change.

---

## ALK-004 — Measurement uncertainty

V1's single alkalinity noise figure is retained in a cleaner role:

\[
\sigma_{Alk,base}=0.10\ dKH
\]

This is the **working analytical uncertainty floor** used by the engine.

It is not a claim that every test kit has exactly ±0.10 dKH accuracy.

It is not a tolerance applied to current position.

A reading of 8.19 against a lower range edge of 8.20 is measured below range at stored precision.

Uncertainty affects confidence in movement and response, not where the latest measurement sits.

**V1 disposition:** KEEP BUT RESTRUCTURE.

---

## ALK-005 — Repeat-test cluster policy

Alkalinity repeats made as part of one testing episode form one measurement cluster under Part II.

Default automatic repeat window:

**30 minutes**

unless an explicit repeat relationship exists.

Cluster representative:

\[
A_{cluster}=median(A_i)
\]

A repeat cluster counts as one independent alkalinity observation.

If repeats disagree materially beyond the Alk repeat-spread rule, the cluster is anomalous and should not be used to manufacture false confidence.

### Canonical V2 repeat-spread rule

A cluster should be considered internally inconsistent when:

\[
max(A_i)-min(A_i) > 0.20\ dKH
\]

> **Superseded by owner decision 27, preserved rather than deleted.** The formula above
> carried one trailing qualifier:
> *"unless a known testing method justifies another value."*

**Inoperative under owner decision 27**, and preserved in the quotation above rather than
deleted: the application does not record, ask for, infer or store the test method that
produced a reading, so "a known testing method" is never available and the clause can never
fire. The 0.20 dKH threshold applies to every repeat cluster, with **no exception route** —
the comparison above is the whole rule, and it has no trailing clause.

Reason:
0.20 dKH is twice the shared Alk analytical uncertainty floor and is large enough that choosing one of the repeats could materially change a dose calculation.

This threshold is an engineering judgement, not a biological safety limit.

### Domain of the repeat-spread threshold

`ALK-REPEAT-SPREAD-DOMAIN-001`

**Owner decision 27 supersedes owner decision 18 here.** The `0.20 dKH` threshold above is
a **repeat** threshold, and it applies to repeat measurements **as such**,
with no method qualifier of any kind.

**The application does not know what produced a reading.** It does not record, ask for,
infer or store the test method, kit, device or instrument behind any measurement, so it has
no basis on which to say that two readings came from one kit or from two different ones. A
reading is a reading.

Everything decision 18 settled about this threshold stands unchanged: the value is
`0.20 dKH`, the comparison is strictly greater-than, and it is performed on exact decimals
under `ALK-DECIMAL-THRESHOLD-001`. Only the domain qualifier is removed, and with it the two
deferred placeholders — they are **retired**, not still pending:

```text
crossMethodConcordanceThreshold  = RETIRED   # decision 27; there is no cross-method case
compatibleMethodClassification   = RETIRED   # decision 27; method is never known
```

There is nothing left to canonise later. A future freeze that wanted method-aware behaviour
would first have to decide that the application records the method at all, which is the
constraint decision 27 sets.

**Superseded wording, preserved:** decision 18 confined the threshold to *"the **same** test
method; or methods **explicitly classified by canon as compatible**"*, declined to establish
a cross-method disagreement threshold, and left `crossMethodConcordanceThreshold = NOT_RUN`
and `compatibleMethodClassification = NOT_RUN` as canonised deferrals with
`VALIDATION_CROSS_METHOD_THRESHOLD_NOT_CANONISED` as their reason code. None of that is
reachable: it presumed the engine could tell one method from another.

**No guidance, warning or prompt about method differences is added anywhere.** That a
0.20 dKH disagreement between two kits may be the kits rather than the tank is the keeper's
knowledge, not the engine's, and the engine does not comment on it.

---

## ALK-005B — Canonical Alk testing episode

`ALK-TESTING-EPISODE-001`

**Owner decision 28 supersedes owner decision 17 here.** An Alk **testing episode** is the
set of Alk measurements of the same parameter taken **within 30 minutes of one another**.

**Proximity in time is the whole test.** There is no method qualifier and no explicit
repeat-relationship requirement:

```text
within 30 minutes of one another  ->  repeats of a single test, one observation
more than 30 minutes apart        ->  separate observations
```

The 30-minute window is the one `ALK-005` and Part II §5.3 already use. **No new time
constant is introduced**, and the window is unchanged in value. The comparison is
**inclusive at exactly 30 minutes**, which is what `ALK-V2-ALGORITHM-CONTRACT.md` A3 has
specified as `<= 30 minutes` since the package was written; decision 28 changes the window's
role, not its value or its inclusivity.

Part II §5.3's remaining grouping condition — **no relevant intervention between them** — is
**untouched** by this decision and continues to apply: a dose change, correction, water
change or delivery anomaly between two measurements separates them however close together
they are. Decision 28 removes the method and explicit-relationship conditions and says
nothing about that one. Whether "no exceptions" was meant to reach it as well is recorded as
open (`OI-EPISODEINTERVENTION-001`) rather than decided here.

Two further questions this rule does **not** answer, both recorded open rather than settled:
whether the window is measured pairwise between consecutive measurements or from the first
measurement of an episode (`OI-EPISODEANCHOR-001`), and what happens to a measurement with
**no time of day at all** — a date-only legacy reading, which a purely temporal membership
test cannot place (`OI-EPISODEDATEONLY-001`). Part II §5.2's *"explicit grouping wins"* is
shared canon and is not edited here; its interaction with a time-only membership test is
`OI-PII52EXPLICIT-001`.

Measurements inside one episode are **combined into one observation** using the existing
canonical representative-value rules — Part II §5.4 representative value, §5.5
representative timestamp, §5.6 internal spread, and `ALK-005`'s spread rule. That single
observation is what **every** downstream consumer sees
(`ALK-EPISODE-SINGLE-OUTPUT-001`).

### The combined count is part of the output

The resolved observation states how many measurements were combined:

```text
combinedMeasurementCount = <integer >= 1>
reason                   = EPISODE_MEASUREMENTS_COMBINED    # when the count is > 1
```

This is a **structured field, not prose**. The interface renders it plainly — "3 tests
combined" — and the engine does not author that sentence. A single measurement is an
episode of one and carries `combinedMeasurementCount = 1`.

Measurements more than 30 minutes apart are **separate observations** and enter ordinary
trend logic as such. Whether two separate observations are far enough apart to count as
distinct longitudinal points is a different question entirely, owned by `ALK-008`'s
24-hour independence rule, which decision 28 leaves **unchanged**. Episode resolution asks
*can these measurements give one defensible observation*; trend independence asks *does this
observation count as a separate point in time*. The two must stay distinct.

Episode construction runs on **measurements**, before anything downstream consumes them. It
never deletes, hides, invalidates or down-weights a measurement.

**Superseded wording, preserved:** decision 17 made membership *"explicit repeat/confirmation
relationships where present (Part II §5.2); otherwise the existing canonical 30-minute
repeatClusterWindow"*, and then split the members of an episode by method — same-method
measurements pooled, *"incompatible-method measurements must not be averaged, pooled or
coalesced into one numerical value"* and *"remain distinct evidence within the same
episode"*, with an episode that could not produce one defensible value declared
**contested**. Reason codes `EPISODE_MEASUREMENTS_POOLED` and
`EPISODE_INCOMPATIBLE_METHODS_KEPT_DISTINCT` carried those states. Owner decision 27 removes
the method distinction the split depended on, and decision 28 removes the explicit-
relationship condition; the 30-minute window is the part that survives.

---

## ALK-005C — Episode resolution

`ALK-EPISODE-RESOLUTION-001`

**Owner decision 27 supersedes owner decisions 17 and 18 here.**
**There is no contested state.**
An episode cannot be contested on method grounds, because method is not known
(`ALK-REPEAT-SPREAD-DOMAIN-001`).

After the existing validity and status rules have been applied — `INVALID` measurements are
excluded from analysis under Part II §4.3, and are excluded here too — every episode holding
at least one remaining measurement is:

```text
episodeStatus            = RESOLVED
reason                   = EPISODE_RESOLVED
combinedMeasurementCount = <count of the measurements combined>
```

The episode emits one canonical value and time under Part II §5.4 and §5.5, with spread and
status under Part II §5.6 and `ALK-005`. **Ordinary logic applies throughout.** Two states
that decision 27 does **not** disturb:

- a resolved episode may still be `ANOMALOUS` on its own spread — a spread above 0.20 dKH
  takes Part II §48's path exactly as it always has. Two readings 0.30 dKH apart inside one
  episode are an anomalous cluster, which is an ordinary, already-frozen outcome, and not a
  contested episode;
- an episode whose every measurement is `INVALID` holds nothing to analyse and produces no
  observation. That follows from Part II §4.3 and needs no episode-specific rule.

Nothing is discarded, marked invalid or hidden, and no value is ever chosen by event order,
ID order, insertion order, database order or arbitrary sorting. Those prohibitions are
unchanged and remain load-bearing: they now bind the *pooling* of an episode's measurements
rather than a choice between them.

**Superseded wording, preserved:** decisions 17 and 18 declared
`episodeStatus = CONTESTED_METHODS` where an episode's remaining measurements were not all
same-method, and on that state required *"do not average the incompatible-method
measurements into one episode value"*, *"do not apply `ALK-005`'s 0.20 dKH threshold across
them"*, *"withhold the affected automatic inference"*, `retest = REPEAT_NOW` with
`RETEST_EPISODE_CONTESTED`, and *"do not silently fall back to an older Alk episode"* —
adding that *"resolution is by confirmation, not by arithmetic"*. The whole branch is
retired: it existed only to handle a distinction the engine cannot make.

---

## ALK-005D — One episode output for every Alk consumer

`ALK-EPISODE-SINGLE-OUTPUT-001`

**Owner decision 19.** Testing-episode construction and resolution occur **before**
downstream Alk interpretation. **No dosing or safety consumer may independently choose
among raw Alk measurements belonging to the same testing episode.**

Every one of the following consumes the same resolved canonical episode representation, and
none of them re-derives it:

| Consumer | Rule |
|---|---|
| current position | `ALK-010` / `CORE-POSITION-001` |
| preferred-range and outer-bound classification | `ALK-004`, `ALK-003A` |
| `SAFETY_RETURN` triggering | `ALK-OUTER-BOUND-ACTION-001` |
| rapid detection basis | `ALK-RAPID-BASIS-001` |
| independent-cluster / trend selection | `ALK-INDEPENDENT-SELECTION-001` |
| ordinary trajectory | `ALK-MOVEMENT-001`, `ALK-SUPPORTED-SLOPE-001` |
| consumption estimation | `ALK-CONSUMPTION-ESTIMATE-001` |
| forecast | `ALK-FORECAST-SLOPE-001`, `ALK-062` |
| maintenance-dose calculation | `ALK-049` pipeline |
| advisory-range confidence warning | `ALK-ADVISORY-RANGE-BOUNDARY-001` (added by owner decision 21; rewritten as a warning by owner decision 24) |

This is `MASTER RULE 1` and `X-INV-004` applied to the episode: one owner constructs the
episode, and everything downstream reads its output.

**Amended by owner decision 24 — the exception is RETIRED and there is now no exception at
all.** `ALK-ADVISORY-RANGE-BOUNDARY-001` consumes the resolved episode value like every
other consumer above, and does **nothing else**. Decision 21 had given it one named
exception — a universal predicate over the members of a contested episode — because it
needed to decide whether to **withhold advice**. Decision 24 stopped it withholding advice,
so the question the predicate answered no longer arises and the predicate is retired with
it. **This rule therefore has no exceptions, named or otherwise.**

**Superseded, preserved:** the paragraph above continued *"Where the episode is contested
and no value resolves, there is no value to warn about and no recommendation for a warning
to attach to; the ordinary contested handling governs unchanged, with `position`,
`outerBoundState` and `rapidConfirmed` `NOT_RUN` and `REPEAT_NOW`."* Owner decision 27
retires the contested state, so that branch is unreachable.

> **Superseded by owner decision 24, preserved rather than deleted.** Under owner decision
> 21 this passage read: "**Amended by owner decision 21 — one named exception, and only
> one.** `ALK-ADVISORY-RANGE-BOUNDARY-001` consumes the resolved episode value like every
> other consumer above. Where the episode is **contested** and no value resolves, it
> additionally evaluates a **universal predicate over the members** — whether *every* member
> is at or beyond the advisory boundary. That is admissible under the headline prohibition
> because it **selects no measurement**: it produces no level, promotes no member to
> `position`, and answers only a yes/no about the whole set. Where the members straddle the
> boundary the predicate is false and nothing further happens. No other consumer gains this
> exception, and `position`, `outerBoundState` and `rapidConfirmed` remain `NOT_RUN` on a
> contested episode whether or not escalation applies."

Every episode emits one canonical episode value and time for downstream use, together with
its `combinedMeasurementCount`. **Ordinary logic applies to it** — position, outer-bound
classification, `SAFETY_RETURN` triggering, rapid detection, selection, trajectory,
consumption, forecast and maintenance all read that one observation and proceed exactly as
they would for any single reading.

**Superseded wording, preserved:** decision 19 carried a second branch, *"For a CONTESTED or
otherwise unresolved latest episode"*, which set `position = NOT_RUN`,
`outerBoundState = NOT_RUN`, `reason = EPISODE_POSITION_WITHHELD` and `retest = REPEAT_NOW`,
withheld the affected inference, and recorded as a deliberate exposure that *"no
`SAFETY_RETURN` is triggered from that episode until it resolves"*. Owner decision 27
retires the contested state, so that branch, its withheld outputs and its recorded exposure
all go with it. An episode straddling an outer bound is now simply an episode whose combined
observation is on one side of the bound, classified in the ordinary way.

### Episode resolution is not independent-trend selection

The two are distinct and must stay distinct:

- **episode resolution** decides what one sampling moment measured;
- **independent selection** (`ALK-INDEPENDENT-SELECTION-001`) decides which resolved
  episodes are far enough apart to count as separate maintenance-trend observations.

A resolved episode that is **too close in time** to count as a full-strength ordinary
maintenance-trend observation may still contribute to rapid detection exactly where
`ALK-008` and `ALK-RAPID-001` already permit it. **The existing 24-hour independent-spacing
rule is unchanged.**

---

## ALK-005E — Exact decimal semantics for canonical thresholds

`ALK-DECIMAL-THRESHOLD-001`

**Owner decision 18.** A canonical Alk threshold predicate must not be decided by binary
floating-point representation error.

For user-entered decimal chemistry quantities:

- **preserve the entered/normalized decimal precision** through storage and comparison;
- **compare exact decimal values** for canonical threshold predicates;
- **do not pre-round** the chemistry reading merely to perform the comparison;
- **do not let binary64 representation error decide which side of a canonical decimal
  threshold applies**;
- **no epsilon.** An arbitrary tolerance would be a new constant and is forbidden here.

**Scope — where both operands are exact decimals.** An operand qualifies when it is:

- a **stored** decimal measurement value, at its entered precision;
- a **unit-normalized** measurement value — the `ALK-002` meq/L conversion at
  2.8 dKH per meq/L, which is an exact decimal multiplication. "Normalized" here means unit
  conversion and nothing else; analytical normalization (water change, correction) produces
  a derived quantity and is out of scope with the rest of them;
- a **difference** of such values;
- a **configured** decimal chemistry bound — the preferred-range edges and the outer bounds,
  which are user-entered decimal quantities in exactly the sense owner decision 18 names;
- a **frozen decimal canon constant**, and an exact-decimal **sum** of the above, such as
  \(A_{safe,low}=OuterMin+B_{safety}\).

The predicates this governs are:

| Predicate | Rule |
|---|---|
| repeat-cluster spread `max(A_i) − min(A_i) > 0.20` | `ALK-005` |
| position against the preferred range edges | `ALK-004` |
| outer-bound breach against `OuterMin` / `OuterMax` | `ALK-003A` |
| safety-return completion against `A_safe,low` / `A_safe,high` | `ALK-003A` |
| advisory-range confidence warning against `AdvisoryCeiling` / `AdvisoryFloor` | `ALK-ADVISORY-RANGE-BOUNDARY-001` (added by owner decision 21; the predicate is unchanged by owner decision 24, only what it triggers) |

**Amended by owner decision 21.** The advisory-boundary row is the fifth predicate. Its
operands already qualify under the scope list above — a configured decimal bound plus a
frozen decimal constant, combined by an exact-decimal sum, exactly as
\(A_{safe,low}=OuterMin+B_{safety}\) does — so decision 21 extends this rule's *table*
and not its *operand classes*. The row is added because the table is a closed enumeration:
a predicate that is not in it is not governed, and `ALK-ADVISORY-RANGE-BOUNDARY-001` claims
that it is.

The extension is not decorative. With `OuterMin = 8.2` the exact floor is
`8.2 − 1.0 = 7.2`; in binary64 it is `7.199999999999999`, so a resolved episode value of
exactly `7.2 dKH` **warns** under exact decimal and does **not** warn under binary64 — a
safety-relevant output decided by representation error, on a one-decimal configuration a
keeper could plausibly set. The same class exists on the high side at two-decimal bounds.
Under owner decision 24 what the predicate decides is whether the confidence warning
attaches, not whether advice is withheld; the predicate, its operands and its inclusivity
are unchanged.

Worked consequence, which is the reason this rule exists:

```text
exact decimal spread 0.20 dKH:   0.20 > 0.20  ->  false  ->  NOT anomalous
exact decimal spread 0.21 dKH:   0.21 > 0.20  ->  true   ->  ANOMALOUS
```

Under binary64 the same comparison on `8.80 − 8.60` yields `0.20000000000000107 > 0.20`,
which is `true`. That outcome is a property of the decimal literals, not of the
measurement, and it is now excluded. **No threshold value and no comparison direction is
changed by this rule** — `ALK-005` remains strictly greater-than, and every boundary in
`OI-BOUNDARIES-001` keeps the inclusivity it already had.

**Out of scope, and unchanged:** predicates over quantities produced by division or a
robust estimator — \(S_{observed}\), \(S_{TS}\), \(\sigma_{resid}\), \(\sigma_S\),
\(S_{supported}\), \(C_{estimate}\), \(T_{signal}\), potency SNR, and the rate and
percentage caps computed from them. Those remain IEEE 754 binary64 under the existing
determinism contract, evaluated in the canonical fixed order. This rule does not extend to
them and does not change them.

---

## ALK-005A — Suspicious-reading detection basis

`ALK-SUSPECT-DETECTION-001`

Part II §47 defines a candidate standardized residual and states that a parameter canon
*may* use a threshold such as a multiple of uncertainty. **Alkalinity does not define
one, and Freeze 5 deliberately does not invent one.**

```text
automaticStatisticalSuspicionDetection = NOT_RUN
reason                                 = VALIDATION_SUSPICION_DETECTION_NOT_RUN
```

Automatic statistical suspect detection remains `NOT_RUN` until it is separately validated
and canonised in a later freeze. A `Z` threshold, a jump-size rule or a suspicious multiple
must not be imported from another parameter, from V1, or from statistical convention
(Part II §7.4, Part I §56).

This is a canonised state, not an undefined one. The `SUSPECT` sources the canon **does**
define remain fully operative. They include:

1. **explicit user marking** — Part II §4.2, §4.3, §49;
2. **a recorded test/device fault**, carried as an event — Part II §49;
3. **the existing repeat-test spread mechanism** — a repeat cluster whose internal spread
   exceeds `ALK-005`'s 0.20 dKH becomes `ANOMALOUS`, and Part II §48 owns the behaviour
   when that cluster is the latest one.

Consequences that follow, and must be implemented:

- `ALK-051` ("if the newest Alk is suspicious and materially affects advice, repeat now")
  is driven from those three sources rather than from a statistical test. It is not dead;
- **an unusual reading may prompt repeat testing without being silently discarded.**
  Nothing in this rule permits dropping, down-weighting, hiding or excluding a reading
  because it looks unlikely. Part II §49's prohibition on excluding a historical point
  without documented basis is unaffected;
- `ALK-MOVEMENT-001`'s "no unresolved latest anomaly" precondition is evaluated against the
  canon-defined `SUSPECT` and anomaly sources, never against a statistical test;
- `ALK-G024` and `ALK-G025` are driven from an explicit mark or an anomalous repeat
  cluster;
- `ALK-SLOPE-UNCERTAINTY-001` is unchanged. A lone aberrant point that the residual MAD
  cannot see does not raise \(\sigma_S\), and **no compensating uncertainty-inflation term
  may be added**. That residual exposure is accepted deliberately by this freeze; it is the
  reason automatic detection is a named future-canon item rather than a silent gap.

**V1 disposition:** REPLACE V1's implicit outlier handling with an explicit, named,
deliberately-deferred detection state.

---

## ALK-006 — Routine testing cadence

V1's normal alkalinity testing cadence is retained:

**every 48 hours** while the Alk controller is actively establishing or monitoring maintenance balance.

This is the default analytical cadence, not a prohibition on testing sooner.

Testing sooner is appropriate for:
- suspicious readings;
- rapid change;
- active return/correction plan near its destination;
- outer-bound excursions;
- explicit troubleshooting.

A test taken sooner may be useful for position even when it is too early to support ordinary consumption inference.

**V1 disposition:** KEEP, with the distinction between position and inference made explicit.

---

## ALK-007 — Current-control lookback

V1 used a 14-day alkalinity analysis window.

V2 retains **14 days as the maximum ordinary current-control lookback**, but changes what the number means.

The engine uses:

> the most recent eligible clean alkalinity segment, capped at 14 days.

It does not blindly fit every reading from the previous 14 days.

A segment may be shorter because of:
- dose change;
- potency-context change;
- material unnormalised water change;
- pump failure;
- unmodelled correction;
- confirmed measurement regime shift;
- another hard confounder.

The engine never stretches beyond 14 days solely because current evidence is sparse.

This keeps V1's ability to detect slow persistent drift without forcing pre-intervention history into a current estimate.

**V1 disposition:** KEEP BUT RESTRUCTURE.

---

## ALK-007A — Minimum cadence for ordinary automatic maintenance advice

`ALK-MINIMUM-CADENCE-001`

V2 intentionally does **not** stretch the ordinary Alk control window beyond 14 days merely to accommodate sparse testing.

Ordinary automatic maintenance advice requires:
- at least 3 valid independent Alk clusters;
- a clean selected segment spanning at least 4 days;
- current-control lookback no longer than 14 days.

Practical implication:

> To receive ordinary automatic maintenance-dose advice, Alk must be tested at least roughly weekly, and more often while dosing is actively changing.

A keeper testing every 10 days will ordinarily remain `INSUFFICIENT`.

Required card meaning:

```text
Not enough recent alkalinity tests for a maintenance adjustment.
Add a third valid test within the current 14-day window.
```

The app should provide the next useful testing deadline rather than indefinite generic insufficiency.

V2 does not stretch the 14-day window or promote a two-point ordinary slope into an automatic maintenance recommendation.

`ALK-RAPID-001` remains the separate two-point early-action exception.

**Owner decision:** ACCEPTED.

---

## ALK-008 — Normal independent spacing

For ordinary maintenance-trend evidence, alkalinity clusters should normally be separated by approximately the routine cadence.

A cluster less than **24 hours** after the previous independent cluster does not ordinarily count as a new full-strength maintenance-trend observation.

It may still:
- establish current position;
- confirm an anomaly;
- contribute to a rapid-change rule;
- contribute to an explicitly time-resolved intervention calculation.

For ordinary evidence, **48 hours is the preferred minimum separation for an individual independent pair/interval**.

It is **not** the sufficiency threshold for an automatic maintenance trend.

`ALK-MOVEMENT-001` separately requires:
- at least 3 independent eligible clusters; and
- at least 4 days elapsed span.

Therefore a 48-hour pair may produce provisional interval/slope information but does not by itself authorize ordinary automatic maintenance action.

Under 48 hours is normally too weak for ordinary maintenance inference, but it is not analytically nonexistent.

### Independent-cluster selection

`ALK-INDEPENDENT-SELECTION-001`

`ALK-008` above states which spacing is too close. This rule states **which cluster
survives**, so the surviving set — and therefore \(Sxx\), \(\sigma_S\), \(S_{supported}\)
and the recommended recommendation — is deterministic rather than an implementation
choice.

Within the selected analytical segment, order candidate clusters by representative
timestamp ascending and select **forward-greedily from the earliest eligible cluster**:

1. accept the earliest eligible candidate cluster in the segment;
2. walk forward in time. Accept the next candidate whose representative time is at least
   **24 hours** after the representative time of the **last accepted** cluster;
3. a candidate closer than 24 hours to the last accepted cluster is **not accepted** as an
   ordinary maintenance-trend observation, and does **not** become the comparison anchor
   for the following candidate;
4. repeat to the end of the segment.

A candidate that is not accepted retains every non-trend use `ALK-008` already grants it:
current position, anomaly confirmation, the rapid-change rule, and explicitly time-resolved
intervention calculation. It is never deleted, hidden, marked invalid or treated as
suspect.

**Stability, stated exactly.** A cluster **appended after the latest accepted cluster**
never changes which earlier clusters were accepted. Backward-greedy selection — or any
selection whose result depends on the newest reading — is forbidden: it makes historical
evidence a function of the present and breaks the deterministic-replay expectation of
Part II §64.

The guarantee does **not** extend to a cluster backdated to *before* the current earliest
candidate. Selection then re-runs from the new earliest cluster and may accept a different
set, because the anchor chain starts earlier. That is correct and required: `ALK-065` and
`WG-ALK-029` state that a backdated valid measurement changes the **present** analysis, and
`ALK-V2` recomputes from the ledger rather than caching a verdict. What such an entry must
never do is alter a **historical assessment record**, which stays immutable under
`ALK-065`. Implementations must not present the appended-data guarantee as covering
backdated entries.

### Selection runs over resolved testing episodes

`ALK-SAME-TIMESTAMP-COALESCE-001`

**Amended by owner decisions 17 and 19.** This rule originally keyed on **exact timestamp
equality** and pooled the underlying measurements of any clusters sharing a representative
time, including measurements from incompatible methods. Both of those are superseded:

- membership is now the **testing episode** of `ALK-TESTING-EPISODE-001` — measurements of
  the same parameter **within 30 minutes of one another**, and nothing else — not exact
  timestamp equality. A three-minute offset no longer reopens the problem this rule was
  written to close. **Superseded, preserved:** under decisions 17 and 19 this bullet read
  *"explicit repeat relationships, otherwise the existing 30-minute window"*; owner decision
  28 makes proximity in time the whole membership test, so the explicit-relationship half is
  retired;
- **pooling is no longer keyed on the cluster's method.** Owner decision 27 retires the
  method distinction entirely: the application does not know what produced a reading, so
  every measurement inside an episode pools, and `ALK-005`'s 0.20 dKH threshold applies to
  the pooled readings without qualification. Decision 17's intermediate position is
  **superseded by owner decision 27**: it pooled by method and contested the episode
  otherwise, and neither half survives.

The superseded mechanics are preserved here rather than deleted:

> **Before** forward-greedy selection runs, coalesce same-timestamp clusters: group
> candidate clusters by identical representative timestamp; where a group holds more than
> one cluster, pool their combined underlying measurements and build a single cluster from
> that pool… `reason = CLUSTER_SAME_TIMESTAMP_COALESCED`

What this rule now states is the **selection-side consequence**, and it is unchanged in
substance:

1. independent-cluster selection operates over **resolved testing-episode outputs**, one
   value and one time per episode (`ALK-EPISODE-SINGLE-OUTPUT-001`);
2. every episode supplies exactly one candidate, so the count of candidates is a property
   of the measurement times and of nothing else;
3. selection must therefore **never depend on arbitrary event order, ID order, insertion
   order, database ordering or implementation sorting.** Any of those would make the
   recommendation a property of how the rows happened to be stored.

Pooling within an episode is retained exactly as it was: the episode value is the median of
the **pooled raw readings**, not the mean of two cluster medians; the spread is measured over
the pooled readings, so `ALK-005` applies and a pool spanning more than 0.20 dKH becomes
`ANOMALOUS` and takes Part II §48's path. **Pooling never launders an internally inconsistent
set into a clean one.**

```text
reason = EPISODE_MEASUREMENTS_COMBINED
```

Selection then proceeds over one candidate per episode, so the ordering in step 1 of the
forward-greedy algorithm is total and the tie cannot arise.

Worked instance. Candidate clusters at t = 0.0, 0.5, 2.0, 4.0 days:

```text
accept 0.0
0.5 - 0.0 = 0.5 d   < 24 h    -> not accepted, anchor stays 0.0
2.0 - 0.0 = 2.0 d  >= 24 h    -> accept, anchor becomes 2.0
4.0 - 2.0 = 2.0 d  >= 24 h    -> accept

selected = { 0.0, 2.0, 4.0 }
t_bar    = 2.0 days
Sxx      = 8.0 day^2
sigma_S  = 0.10 / sqrt(8) = 0.035355339059 dKH/day
```

Adding a later candidate at t = 4.5 leaves `{ 0.0, 2.0, 4.0 }` unchanged and rejects 4.5.

The 24-hour comparison is **inclusive at exactly 24 hours**, matching `ALK-008` — which
excludes only separations *less than* 24 hours — and `ALK-RAPID-001`, which accepts "at
least 24 hours".

---

## ALK-009 — Trend estimator

### Two eligible clusters

\[
S=
\frac{A_2-A_1}{\Delta t_{days}}
\]

This produces a provisional two-point slope.

### Three or more eligible clusters

Use Part II's Theil–Sen estimator:

\[
S_{TS}=median\left(
\frac{A_j-A_i}{t_j-t_i}
\right)
\]

for all eligible \(i<j\).

This is the default control slope.

Ordinary least-squares may be retained diagnostically but does not replace the canonical control slope.

**V1 disposition:** REPLACE unspecified/ordinary fit with a robust explicit estimator.

---

## ALK-010 — Position

`CORE-POSITION-001` applies without exception:

Current alkalinity position is the latest valid measured cluster value.

A fitted alkalinity value may not overrule it.

This retains one of the strongest corrections made late in V1.

### Position reads the resolved episode

**Owner decision 19, amended by owner decision 27.** "The latest valid measured cluster
value" is the value of the **latest testing episode** — the one observation its measurements
combine to under `ALK-TESTING-EPISODE-001`. Position is a consumer of episode resolution,
not an independent chooser among the measurements inside one episode, and it is never taken
from whichever measurement sorts first or last.

Every episode resolves, so position is always available where a valid measurement exists.

**Superseded wording, preserved:** decision 19 added a branch for a `CONTESTED_METHODS`
latest episode setting `position = NOT_RUN`, `outerBoundState = NOT_RUN`,
`reason = EPISODE_POSITION_WITHHELD` and `retest = REPEAT_NOW`, with the previous episode not
promoted in its place. Owner decision 27 retires the contested state, so the branch is
unreachable and is removed.

**V1 disposition:** KEEP.

---

## ALK-011 — Ordinary movement evidence

`ALK-MOVEMENT-001`

V2 has **one ordinary Alk movement authority**.

The V1 combination of:
- fixed 0.10 dKH/day movement threshold;
- separate direction-count/endpoint-persistence rule;

is replaced by the uncertainty-supported slope model in ALK-011A/ALK-011B.

This avoids maintaining two evidence engines that can disagree.

### Minimum ordinary evidence

An ordinary sufficient Alk trend requires:

- at least **3 independent eligible clusters**;
- elapsed span at least **4 days**;
- no unresolved latest anomaly;
- no hard confounder in the selected segment;
- canonical Theil–Sen slope and \(\sigma_S\) available.

The normal 48-hour cadence therefore commonly reaches first ordinary trend sufficiency at:

Day 0 → Day 2 → Day 4.

### Ordinary trajectory classification

After ALK-011B calculates \(S_{supported}\):

If:

\[
\boxed{
S_{supported}<0
}
\]

then:

```text
trajectory: FALLING
movementEvidence: SUFFICIENT
```

If:

\[
\boxed{
S_{supported}>0
}
\]

then:

```text
trajectory: RISING
movementEvidence: SUFFICIENT
```

If:

\[
S_{supported}=0
\]

but:

\[
S_{observed}\neq0
\]

then:

```text
trajectory: sign(S_observed)
movementEvidence: UNCERTAINTY_LIMITED
recommendation: HOLD_CURRENT_DOSE
```

The app may describe the data as **leaning** in that direction, but it does not size a maintenance change.

If:

\[
S_{supported}=0
\]

and:

\[
S_{observed}=0
\]

with the ordinary evidence minimum satisfied:

```text
trajectory: STABLE
movementEvidence: SUFFICIENT
```

### Insufficient evidence

If the ordinary minimum evidence above is not met:

```text
movementEvidence: INSUFFICIENT
```

Do not call the tank stable merely because movement cannot yet be established.

### Why the old fixed movement gate is removed

The uncertainty model already gives the desired behaviour:

- sparse/noisy evidence → \(\sigma_S\) large → supported slope shrinks toward zero;
- longer clean evidence → \(\sigma_S\) falls → a persistent slow trend becomes supportable;
- tiny supported corrections may still round to HOLD at the configured recommendation precision;
- no separate percentage or endpoint threshold is needed to suppress noise.

This lets the Alk noise floor participate quantitatively rather than acting as a second binary gate.

### Rapid exception

`ALK-RAPID-001` remains separate because it solves a different problem:

> whether a large confirmed one-day change may justify action before the ordinary 3-cluster / 4-day evidence minimum.

**V1 disposition:** REPLACE the old rate/persistence movement gate with one uncertainty-supported movement rule; KEEP the rapid early-action concept separately.

---


## ALK-011A — Canonical Alk slope uncertainty

`ALK-SLOPE-UNCERTAINTY-001`

For an ordinary Alk trend with three or more eligible independent clusters:

1. calculate the canonical Theil–Sen observed slope:

\[
S_{observed}=S_{TS}
\]

2. calculate the Theil–Sen intercept and residuals under Part II;

3. calculate robust residual scale:

\[
\sigma_{resid}
=
1.4826 \times MAD(r_i)
\]

4. apply the frozen Alk analytical floor:

\[
\boxed{
\sigma_{point}
=
\max(
0.10\ dKH,
\sigma_{resid}
)
}
\]

5. calculate time leverage:

\[
\bar t
=
\frac{1}{n}\sum_i t_i
\]

\[
\boxed{
S_{xx}
=
\sum_i(t_i-\bar t)^2
}
\]

6. if \(S_{xx}>0\), calculate:

\[
\boxed{
\sigma_S
=
\frac{\sigma_{point}}{\sqrt{S_{xx}}}
}
\]

Units:

```text
sigma_point = dKH
Sxx = day²
sigma_S = dKH/day
```

If \(S_{xx}\le0\), ordinary trend uncertainty is not calculable and the requested trend inference is `INSUFFICIENT`.

### Two-point rapid/provisional Alk basis

Where `ALK-RAPID-001` or another explicitly permitted two-point analysis applies:

\[
\boxed{
\sigma_S
=
\frac{
\sqrt{\sigma_1^2+\sigma_2^2}
}{
\Delta t_{days}
}
}
\]

This does not upgrade the two-point trend into ordinary sufficient evidence.

### Interpretation

This is the Alk controller's deterministic engineering uncertainty proxy.

It is deliberately the same formula family as `SHARED-SLOPE-UNCERTAINTY-001`.

Pairwise slope MAD may be retained as diagnostic metadata but does not enlarge or shrink `sigma_S` for Alk action sizing.

---

## ALK-011B — Supported Alk slope

`ALK-SUPPORTED-SLOPE-001`

Frozen controller constant:

\[
\boxed{
ALK\_SLOPE\_SUPPORT\_K=1.28
}
\]

Let:
- \(S_{observed}\) = canonical Theil–Sen slope;
- \(\sigma_S\) = `ALK-SLOPE-UNCERTAINTY-001`.

Define supported magnitude:

\[
M_{supported}
=
\max(
0,
|S_{observed}|-1.28\sigma_S
)
\]

Then:

\[
\boxed{
S_{supported}
=
sign(S_{observed})M_{supported}
}
\]

Equivalent directional form:

For a falling observed slope:

\[
S_{supported}
=
\min(
0,
S_{observed}+1.28\sigma_S
)
\]

For a rising observed slope:

\[
S_{supported}
=
\max(
0,
S_{observed}-1.28\sigma_S
)
\]

If:

\[
S_{supported}=0
\]

while:

\[
S_{observed}\ne0
\]

the result is `UNCERTAINTY_LIMITED`, not `STABLE`.

`S_supported` is the recommendation/action-sizing slope.

It must not replace:
- \(S_{observed}\) for best-estimate consumption;
- \(S_{observed}\) for sufficiently established short-horizon risk forecasting;
- the actual measured value for current position.

Confidence labels are outputs only and never multiply `S_supported`.

---

## ALK-012 — Stable

`ALK-STABLE-001`

`STABLE` is a positive analytical conclusion, not the absence of enough evidence.

Ordinary Alk stability requires:
- the ALK-011 ordinary minimum evidence;
- \(S_{supported}=0\);
- \(S_{observed}=0\).

Therefore:

- insufficient readings → `INSUFFICIENT`, not STABLE;
- non-zero observed lean with zero supported slope → `UNCERTAINTY_LIMITED`, not STABLE;
- non-zero supported slope → RISING/FALLING, not STABLE.

Stable does not mean:
- every raw reading is identical;
- Alk is in the target range.

Theil–Sen may equal zero across a small oscillating series even when individual values differ.

Examples that may legitimately resolve to zero robust slope:

- 8.50, 8.48, 8.52 → stable and in range;
- 7.80, 7.82, 7.79 → stable and below range;
- 9.20, 9.18, 9.21 → stable and above range.

Stable out-of-range cases are why maintenance balance and target position remain separate.

---

## ALK-013 — Rapid-change override

`ALK-RAPID-001`

The V1 concept that a large one-day alkalinity movement may justify action before the ordinary three-reading evidence bar is retained.

Canonical V2 rapid threshold:

\[
|S| \ge 0.30\ dKH/day
\]

Requirements:

- at least two independent testing episodes;
- at least **24 hours** elapsed between their representative times;
- latest measurement cluster is internally consistent, or the latest result has been repeated/confirmed;
- no known correction or other event already explains the movement;
- the direction is relevant to a maintenance or safety decision.

### Rapid basis

`ALK-RAPID-BASIS-001`

The slope tested against the 0.30 dKH/day threshold is the **latest independent pair**:

\[
\boxed{
S_{rapid}
=
\frac{A_{latest}-A_{previous\ independent}}{\Delta t_{days}}
}
\]

where \(A_{latest}\) is the **latest candidate cluster in the segment** and
\(A_{previous\ independent}\) is the most recent candidate cluster whose representative time
is at least 24 hours before it. This is exactly what this rule's own requirements describe
— "two independent testing episodes; at least 24 hours elapsed between their representative
times" — stated explicitly so it is not re-derived differently by two implementations.

The pair is drawn from **resolved testing-episode outputs** — candidate episodes, whether
or not they were accepted under `ALK-INDEPENDENT-SELECTION-001` (**owner decision 19**).
Every episode resolves (**owner decision 27**), so every candidate episode supplies exactly
one value and the individual measurements inside an episode are never compared against the
0.30 dKH/day threshold on their own.

**Superseded wording, preserved:** decision 19 added a branch for a `CONTESTED_METHODS`
episode, which emitted no value and supplied no member of the pair; where the *latest*
candidate episode was contested the determination was withheld —
`rapidConfirmed = NOT_RUN`, `reason = EVIDENCE_WITHHELD_CONTESTED_EPISODE` — rather than
recomputed from an older pair. Owner decision 27 retires the contested state, so that branch
is unreachable and is removed.

What the pair is *not* restricted to is the **accepted** set: it is drawn from candidate episodes, not only from
those accepted under `ALK-INDEPENDENT-SELECTION-001`. `ALK-008` grants a cluster that is not accepted for
ordinary trend the right to "contribute to a rapid-change rule", and that grant is
unchanged. Restricting the pair to accepted clusters would revoke it and would exclude the
newest reading from rapid detection in exactly the case that matters: candidates at
t = 0.0, 1.5, 2.0 d accept {0.0, 1.5} and reject 2.0, yet 2.0 against 0.0 is a 2-day
interval that satisfies every condition this rule states. The rapid pair there is
(0.0, 2.0).

Record the basis:

```text
rapidBasis = LATEST_INDEPENDENT_PAIR
```

With **three or more** accepted clusters the ordinary trajectory and the **dose-sizing
slope remain Theil–Sen based**. `ALK-011A` selects the multi-point formula whenever three
or more eligible clusters exist, so \(S_{observed}\), \(\sigma_S\) and \(S_{supported}\)
are unchanged by a rapid confirmation.

`rapidConfirmed` therefore changes **pathway, cadence and cap eligibility only**. It does
**not** substitute the latest-pair rate for \(S_{observed}\) as the ordinary sizing slope,
for consumption estimation (`ALK-CONSUMPTION-ESTIMATE-001`), or for the forecast slope
(`ALK-FORECAST-SLOPE-001`).

When only two independent clusters exist, the latest independent pair *is* the whole
series, `ALK-011A`'s two-point branch supplies \(\sigma_S\), and the evidence state remains
`PROVISIONAL` (Part II §22). Permission to act comes from the rapid flag, never from the
evidence state.

A confirmed rapid change may:
- bypass the ordinary 3-cluster / 4-day movement requirement;
- shorten retest interval;
- allow an earlier maintenance recommendation.

It does **not** bypass:
- potency validity;
- known dose-history requirements;
- physical rate rails;
- non-negative dose;
- outer safety logic.

**V1 disposition:** KEEP and formalise.

---

## ALK-014 — Theoretical alkalinity potency

For product-agnostic V2, theoretical potency is derived from actual chemistry where known.

Let:
- \(C\) = stock concentration in g/L;
- \(V\) = net system volume in L.

### Sodium carbonate — Na₂CO₃

\[
P_{expected}
=
\frac{0.05284 C}{V}
\]

in dKH raised by 1 mL of stock.

### Sodium bicarbonate — NaHCO₃

\[
P_{expected}
=
\frac{0.03333 C}{V}
\]

### Sodium hydroxide — NaOH

\[
P_{expected}
=
\frac{0.07000 C}{V}
\]

For commercial products, use manufacturer potency normalized to the configured net volume.

### Example — the current Tank Chat reference solution

For a 101 g/L sodium-carbonate stock and 77 L net volume:

\[
P_{expected}
\approx
\frac{0.05284\times101}{77}
\approx
0.0693\ dKH/mL
\]

The app itself remains tank-agnostic; this is a validation example, not a shipped default.

---

## ALK-015 — Selected potency

The Alk dosing engine receives exactly one:

`selectedPotency`.

Before empirical calibration:

\[
P_{selected}=P_{theoretical}
\]

After the Potency Engine reaches the required confidence:

\[
P_{selected}=P_{learned}
\]

The Alk recommendation engine must not maintain a second private potency estimate.

---

## ALK-016 — Potency observation

For a qualifying controlled maintenance-dose change:

\[
P_i=
\frac{S_{post}-S_{pre}}
{D_{post}-D_{pre}}
\]

where:
- \(S_{pre}\) is the clean pre-change Alk slope;
- \(S_{post}\) is the clean post-change Alk slope;
- \(D_{pre}\) and \(D_{post}\) are actual delivered maintenance-rate states.

The comparison assumes biological demand is approximately stable across the local comparison.

Therefore every potency observation is an inference with confidence, not a direct assay of the bottle.

---

## ALK-017 — Alk potency-learning qualification

A candidate Alk potency observation requires:

1. same tank volume context;
2. same product;
3. same solution batch/concentration context;
4. same pump/channel/delivery configuration except intended rate;
5. clean pre-change trend;
6. clean post-change response trend;
7. intervention not interrupted;
8. no hard confounder, including any event explicitly classified by the shared Evidence Engine as `CONSUMPTION_CONTEXT_CHANGE`;
9. dose delta large enough to create measurable signal.

### Minimum evidence per side

**Pre side:**
- at least 3 independent eligible clusters;
- span at least 4 days;
- canonical pre-change slope uncertainty available.

**Post side:**
- at least 3 genuine post-change eligible clusters;
- span at least 4 days from first to last genuine post-change cluster;
- canonical post-change slope uncertainty available.

The Day-0 pre-change anchor is not counted as a post-change potency observation.

This is deliberately stricter than ordinary intervention response assessment.

### Exact potency signal requirement

Define observed slope response:

\[
\Delta S_{potency}
=
S_{post}-S_{pre}
\]

For non-overlapping pre/post slope windows:

\[
\sigma_{\Delta S}
=
\sqrt{
\sigma_{pre}^{2}
+
\sigma_{post}^{2}
}
\]

Then:

\[
\boxed{
SNR_{potency}
=
\frac{
|\Delta S_{potency}|
}{
\sigma_{\Delta S}
}
}
\]

provided \(\sigma_{\Delta S}>0\).

Signal classes:

```text
SNR < 2.0       → INELIGIBLE_SIGNAL
2.0 ≤ SNR < 3.0 → DIAGNOSTIC_ONLY
SNR ≥ 3.0       → CALIBRATION_ELIGIBLE
```

Only `CALIBRATION_ELIGIBLE` observations enter the learned-potency pool.

A numerical \(P_i\) may still be stored diagnostically when \(2.0\le SNR<3.0\), but it cannot move selected potency.

This prevents weak observations from accumulating into false calibration confidence.

---

## ALK-018 — Potency observation plausibility

`ALK-POTENCY-PLAUSIBILITY-001`

Reject a potency observation from calibration use if:

\[
P_i\le0
\]

For positive observations define the plausibility envelope:

\[
\boxed{
0.40P_{expected}
\le P_i \le
1.60P_{expected}
}
\]

An observation inside the envelope may proceed to ALK-017 signal qualification.

An observation outside the envelope is stored as:

```text
potencyObservationStatus: PLAUSIBILITY_HOLD
```

and does **not** enter the current learned-potency pool.

### Repeated outside-envelope observations

If the **two most recent** otherwise calibration-grade observations are both outside the envelope in the same direction:

```text
potencyContextState: POTENCY_CONTEXT_DISCREPANCY
```

Required response:
- preserve the observations;
- verify configured product/recipe/concentration;
- verify net tank volume;
- verify dosing-pump calibration/delivery context;
- do not silently recalibrate the existing potency context from those observations.

If verification reveals that Setup or delivery context was wrong:
- close/supersede the old potency context;
- create the corrected/new potency context;
- calculate a new theoretical/configured potency;
- subsequent observations qualify against that new context.

If verification confirms the configured context is correct but the discrepancy persists, the canon must be explicitly revised before automatic dosing adopts a potency outside the 0.40–1.60 envelope.

The envelope is therefore a deterministic model-sanity guard, not proof that outside values are chemically impossible.

**Owner decision:** CONFIRMED. A genuinely mislabelled, wrongly configured, or >60%-discrepant product is not silently learned by the existing context. It must trigger Setup/delivery verification and, where appropriate, creation of a corrected potency context.

---

## ALK-019 — Pooling Alk potency observations

`ALK-POTENCY-POOL-001`

Only observations classified `CALIBRATION_ELIGIBLE` under ALK-017 and belonging to the exact same potency context enter one pool.

For \(n\) eligible observations:

\[
\boxed{
P_{learned}
=
median(P_1,\dots,P_n)
}
\]

No quality adjective, recency judgement, or hidden weight enters this calculation.

Observation quality is handled **before pooling** by deterministic eligibility.

### Robust relative dispersion

Let:

\[
MAD_P
=
median(
|P_i-P_{learned}|
)
\]

Define:

\[
\boxed{
RDisp_P
=
\frac{
1.4826\,MAD_P
}{
P_{learned}
}
}
\]

for \(P_{learned}>0\).

`RDisp_P` is the canonical relative potency dispersion used for confidence promotion.

---

## ALK-020 — Potency confidence

`ALK-POTENCY-CONFIDENCE-001`

Confidence is deterministic within one exact potency context.

### THEORETICAL_ONLY

No empirical potency observation with:

\[
SNR_{potency}\ge2
\]

Current selected potency remains theoretical/configured.

### EXPLORATORY

At least 1 diagnostic or calibration-eligible empirical observation exists, but fewer than 2 calibration-eligible observations exist.

Empirical potency may be displayed diagnostically.

It does not replace selected theoretical potency.

### PROVISIONAL

At least:
- 2 `CALIBRATION_ELIGIBLE` observations;
- from at least 2 separate dose-change interventions.

Theoretical/configured potency remains selected.

### CALIBRATED

All:
- at least 3 `CALIBRATION_ELIGIBLE` observations;
- observations arise from at least 2 separate dose-change interventions;
- elapsed time from earliest to latest qualifying observation is at least 7 days;
- \(RDisp_P\le0.15\);
- exact potency context remains unchanged;
- state is not `REASSESSING`.

Then:

\[
P_{selected}=P_{learned}
\]

for current/future calculations.

### STRONGLY_CALIBRATED

All:
- at least 5 `CALIBRATION_ELIGIBLE` observations;
- observations arise from at least 3 separate dose-change interventions;
- at least 2 distinct absolute dose-change magnitudes are represented, differing by at least one configured pump increment;
- elapsed time from earliest to latest qualifying observation is at least 14 days;
- \(RDisp_P\le0.10\);
- exact potency context remains unchanged;
- state is not `REASSESSING`.

### REASSESSING

After CALIBRATED or STRONGLY_CALIBRATED potency exists, inspect the **two most recent** new `CALIBRATION_ELIGIBLE` observations that were not part of the last accepted calibration snapshot.

Let the currently selected learned potency be \(P_{selected,old}\).

For each new observation define:

\[
\delta_i
=
\frac{
P_i-P_{selected,old}
}{
P_{selected,old}
}
\]

Enter `REASSESSING` when both observations satisfy either:

\[
\delta_1>0.15
\quad\land\quad
\delta_2>0.15
\]

or:

\[
\delta_1<-0.15
\quad\land\quad
\delta_2<-0.15
\]

That is: two consecutive calibration-grade observations disagree by more than 15% in the same direction.

While `REASSESSING`:
- do not silently overwrite historical intervention predictions;
- keep the prior selected potency for automatic dosing unless another explicit verification/safety rule blocks dosing;
- surface the potency discrepancy;
- collect additional clean calibration evidence or verify Setup/delivery context.

A confirmed context change creates a new potency context instead of remaining `REASSESSING`.

---

## ALK-021 — Potency discrepancy wording/action bands

Define:

\[
M=\frac{P_{learned}}{P_{expected}}
\]

Canonical discrepancy bands:

- 0.85–1.15: broadly consistent with expectation;
- 0.70–0.85 or 1.15–1.30: meaningful discrepancy;
- <0.70 or >1.30: large discrepancy requiring verification before a silent control-model switch.

Even after calibration, the app reports **effective delivered potency**, not definitive reservoir concentration.

**V1 disposition:** REPLACE vague strength-from-history logic with a formal learner.

---

## ALK-022 — Current consumption best estimate

`ALK-CONSUMPTION-ESTIMATE-001`

Physical consumption inference uses the canonical **observed** slope, not the uncertainty-shrunk supported slope.

When eligible:

\[
\boxed{
C_{estimate}
=
P_{selected}D_{history}
-
S_{observed}
}
\]

where \(D_{history}\) is the actual effective maintenance input for the analysed interval,
as defined by `ALK-DELIVERY-RATE-BASIS-001` below.

**Amended by owner decision 20.** This equation previously wrote the quantity as a bare
\(D\), described as "the actual effective maintenance input for the analysed interval", and
elsewhere the same interval quantity was called \(D_{established}\) — the same name the
high-breach sizing rule used for the *configured* rate. The two are now separate names.
Consumption estimation is an **interval-based** calculation and takes \(D_{history}\).

For a constant-dose clean segment the interval mean is the constant itself:

\[
D_{history}=D_{current}
\]

This is a **numerical coincidence on that segment**, not an identity. It does not license
substituting one for the other anywhere else.

For an exact mixed-dose interval where the policy allows interval consumption, apply **M-6 — Delivered volume versus programmed schedule**.

The effective interval rate is:

\[
D_{history}=D_{eff}
=
\frac{IntegratedDoseVolume}{ElapsedDays}
\]

where `IntegratedDoseVolume` must come from one of the M-6 eligible bases:

```text
VERIFIED_DELIVERY
```

or:

```text
CONFIRMED_PROGRAMMED_SCHEDULE
```

when the programmed schedule and effective implementation time are sufficiently known to reconstruct the integrated programmed volume.

If neither basis is available:

```text
mixedIntervalIntegration = NOT_RUN
```

and the engine segments at the dose boundary instead of inventing `D_eff`.

Therefore `D_eff` does **not** imply that physical pump telemetry is mandatory, and it does not silently treat a nominal command as verified delivery.

This is the engine's central best estimate of actual Alk demand under the simple mass-balance model.

It is **not** itself the dose recommendation.

Output includes:
- \(C_{estimate}\);
- consumption uncertainty/confidence;
- source segment;
- selected potency;
- observed trend estimate;
- dose basis;
- warnings.

Negative-consumption validity checks use \(C_{estimate}\).

Do not substitute \(S_{supported}\) into the physical mass-balance equation merely to make the estimate more conservative.

### Delivery-rate basis — two distinct quantities

`ALK-DELIVERY-RATE-BASIS-001`

**Owner decision 20.** The single name \(D_{established}\) was being used for two different
physical quantities: the rate the doser is *set to now*, and the mean rate actually
*delivered across a past interval*. Those are different numbers whenever the dose changed
inside the interval, and each is the correct input for a different calculation. The name is
split. It must not survive as a live name anywhere.

\[
\boxed{
\begin{aligned}
D_{current}\;&:\;\text{the alkalinity delivery rate the doser is \textbf{configured to be}}\\
             &\quad\ \text{delivering \textbf{at the time of the recommendation}, mL/day}\\[4pt]
D_{history}\;&:\;\text{the \textbf{time-weighted mean} alkalinity delivery rate actually}\\
             &\quad\ \text{delivered \textbf{across the trend interval} under consideration, mL/day}
\end{aligned}
}
\]

**Which calculation takes which.**

| Calculation | Quantity | Why |
|---|---|---|
| High-breach temporary safety-dose sizing (`ALK-HIGH-BREACH-SAFETY-SIZING-001`, `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001`) | \(D_{current}\) | the reduction is applied to what the pump is set to now |
| Consumption estimation (`ALK-CONSUMPTION-ESTIMATE-001`) | \(D_{history}\) | mass balance over an interval must account for what was actually delivered over it |
| Every other **interval-based** calculation | \(D_{history}\) | same reason |
| Maintenance sizing, step cap, rounding, tie-toward-current (`ALK-044`, `ALK-STEP-CAP-001`, `ALK-ROUNDING-001`, `ALK-049`) | \(D_{current}\) | these already used \(D_{current}\) under that name and are unchanged |

\(D_{history}\) is exactly the interval quantity M-6 already governs: \(D_{eff}\) on an
integrable mixed interval, and the constant rate on a constant-dose clean segment. Its
eligible bases, its `NOT_RUN` behaviour and its segmentation fallback are unchanged. On a
constant-dose clean segment \(D_{history}=D_{current}\) **numerically**; that coincidence is
not licence to interchange the names.

**Unknown handling — refuse, do not assume zero.**

**Amended by owner decision 25 — the high-breach refusal is a PRECONDITION, evaluated
BEFORE branch selection.** Decision 20 established the refusal but attached it to the sizing
formula, and branch A's formula does not reference \(D_{current}\), so the refusal had no
branch to attach to and two readings of the same state disagreed. It is now evaluated once,
ahead of the branch tree, and applies **identically to branches A, B and B'**:

```text
HIGH-BREACH PRECONDITION, evaluated BEFORE branch A / B / B' selection:

    D_current unknown or not configured
        -> NO temporary safety recommendation is produced, on ANY branch
        -> temporarySafetyRateContinuousMlPerDay     = NOT_RUN
           temporarySafetyRateRecommendationMlPerDay = NOT_RUN
        -> the measured state and the reason are surfaced
        -> doser configuration is requested through the EXISTING confirmation machinery
           (CORE-INFORM-PROCEED-001, ALK-CAPABILITY-CONTRACT-001)
        -> reason = SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN
        -> 0 mL/day is NOT emitted as though it were a computed recommendation
        -> the branch is NOT selected, because selection does not run

    This applies to branch A even though branch A's own formula
    max(0, (C_estimate + S_safety) / P_selected) does not contain D_current.
    The precondition is about the STATE, not about which symbols a formula uses.
```

**Exactly one outcome per state.** A high-breach state produces **either** a numeric
temporary safety recommendation **or** this refusal — never both, and never a different
answer under a different reading of the rules. `INV-G15` asserts it.

Everything else about the two unknowns is unchanged:

```text
D_current unknown, elsewhere:
    ordinary maintenance sizing, capping and rounding (ALK-044, ALK-STEP-CAP-001,
      ALK-ROUNDING-001, ALK-049) take D_current directly:
      recommendedDoseMlPerDay = WITHHELD
    consumption is UNAFFECTED where D_history is available

D_history unavailable:
    consumption estimation is UNRESOLVED under the existing unresolved-consumption
      handling (ALK-HIGH-BREACH-UNRESOLVED-001, ALK-NEGATIVE-CONSUMPTION-001)
    reason = CONSUMPTION_NOT_RUN_DOSE_HISTORY_UNAVAILABLE
    position, trend and outer-bound state are unaffected (Part II §70.1-70.3)
    safety sizing is UNAFFECTED where D_current is known
```

> **RESOLVED by owner decision 25.** This was `OI-BRANCHAREFUSAL-001`. The question was
> whether high-breach branch A refuses when \(D_{current}\) is unknown, given that branch A's
> formula \(\max(0,(C_{estimate}+S_{safety})/P_{selected})\) does not reference
> \(D_{current}\) at all. Decision 20 stated the refusal without naming a branch, so the same
> state — \(A_{now}\) 11.5, \(C_{estimate}\) +0.60, \(P\) 0.0693 — yielded **1.44 mL/day**
> under one reading and a refusal under the other.
>
> The refusal is now a **precondition evaluated before branch selection**, above, and it
> applies identically to A, B and B'. The precondition is about the state, not about which
> symbols a formula happens to use. `INV-G15` asserts that no high-breach state produces both
> a numeric recommendation and a refusal, and that the same state cannot produce different
> outputs under different readings.

The two unknowns are **independent**. \(D_{history}\) unavailable does not prevent safety
sizing when \(D_{current}\) is known; \(D_{current}\) unknown does not prevent consumption
estimation when \(D_{history}\) is available.

**No new constant, no new threshold.** This rule renames and separates quantities the canon
already carried. It introduces no number.

---

## ALK-023 — Best-estimate maintenance requirement versus the recommended dose

`ALK-MAINTENANCE-SEMANTICS-001`

When \(C_{estimate}\) is physically interpretable, the central best estimate of maintenance demand is:

\[
\boxed{
D_{maintenance,estimate}
=
\frac{C_{estimate}}{P_{selected}}
}
\]

For a constant current dose this is equivalently:

\[
D_{maintenance,estimate}
=
D_{current}
-
\frac{S_{observed}}{P_{selected}}
\]

This answers:

> If the observed slope estimate were exactly correct, what maintenance dose would produce approximately zero slope?

It is **not yet the recommended dose**.

The conservative recommendation candidate is instead:

\[
\boxed{
D_{action,continuous}
=
D_{current}
-
\frac{S_{supported}}{P_{selected}}
}
\]

before caps, rails, bracketing checks and pump rounding.

Therefore V2 may legitimately report:

```text
bestEstimateMaintenanceDose: 11.2 mL/day
recommendedDose: 10.5 mL/day
```

when uncertainty support deliberately makes the first recommended step more conservative.

The two values must never share one field named `maintenanceDose`.

Preferred structured fields:

```text
maintenanceEstimate
continuousActionCandidate
recommendedDose
```

---

## ALK-024 — Stable below or above range

If Alk is stable with adequate evidence:

\[
S\approx0
\]

then:

\[
D_{maintenance,estimate}\approx D_{current}
\]

Therefore, **while the latest value remains inside the outer operating envelope**:

- stable below preferred range → HOLD maintenance;
- stable above preferred range → HOLD maintenance;
- offer a return plan only under the applicable return-plan rules.

If the latest value breaches an outer operating bound, `ALK-OUTER-BOUND-ACTION-001` owns the immediate safety action.

That safety layer may temporarily alter delivered dosing/correction behaviour without redefining the accepted permanent maintenance estimate.

Do not permanently raise or lower maintenance merely because the absolute Alk level is outside the user's chosen preferred range.

This is one of the most important retained V1 principles.

---

## ALK-025 — Below range and falling

If:
- latest Alk is below range;
- falling movement is sufficiently established;
- no active intervention lock prevents action;
- consumption is interpretable;

then current maintenance supply is below demand.

Best-estimate demand uses:

\[
D_{maintenance,estimate}
=
D_{current}
-
\frac{S_{observed}}{P_{selected}}
\]

The recommendation candidate uses:

\[
D_{action,continuous}
=
D_{current}
-
\frac{S_{supported}}{P_{selected}}
\]

with both slopes negative in an actionable falling regime, so both quantities lie above current dose, while the supported-slope action is normally the more conservative first step.

Automatic recommendation addresses the **maintenance deficit only**.

It does not silently add a return-to-range component.

---

## ALK-026 — In range and falling

If Alk is in range but sufficiently falling:

- maintenance may still be deficient;
- calculate the maintenance dose from the supported slope;
- forecast whether the lower boundary is likely to be crossed;
- retest timing may shorten.

Do not wait for Alk to become out of range if the maintenance imbalance is already supported.

---

## ALK-027 — Above range and rising

Mirror of ALK-025 where ordinary consumption remains interpretable.

Best-estimate demand:

\[
D_{maintenance,estimate}
=
D_{current}
-
\frac{S_{observed}}{P_{selected}}
\]

Conservative recommendation candidate:

\[
D_{action,continuous}
=
D_{current}
-
\frac{S_{supported}}{P_{selected}}
\]

with the applicable slopes positive, so the recommendation candidate lies below current dose.

The recommendation seeks stability, not a deliberate fall back into range.

Once `returnPlanEligibleTrajectory` holds above range, a downward return plan may be
offered (`ALK-RETURN-ELIGIBLE-TRAJECTORY-001`).

The special case where inferred consumption becomes negative is handled separately.

---

## ALK-028 — In range and rising

If a meaningful rise is established:
- calculate a lower maintenance requirement;
- forecast upper-edge crossing;
- recommend a maintenance reduction if evidence supports it.

Do not call a rising level “fine” merely because the latest reading has not yet crossed the upper edge.

---

## ALK-029 — Below range and already rising

### No active deliberate plan

If below range and rising with no known deliberate level-movement intervention:

- where the rise is a **supported** trajectory, HOLD maintenance under
  `ALK-TOWARD-RANGE-HOLD-001`;
- do not increase maintenance merely because the value is still low;
- determine whether the current dose exceeds estimated maintenance;
- forecast range entry;
- avoid stacking another upward action until the cause of the rise is interpretable.

### Active return/correction plan

Evaluate the plan against its intended trajectory.

The plan owns the rise; ordinary maintenance logic must not treat intentional upward movement as a maintenance excess without accounting for the planned input.

---

## ALK-030 — Above range and already falling

Mirror of ALK-029.

Where the fall is a **supported** trajectory and no deliberate level-movement intervention
is active, HOLD maintenance under `ALK-TOWARD-RANGE-HOLD-001`.

Do not keep lowering maintenance merely because Alk remains high if the level is already moving down under a known plan or recent adjustment.

Forecast arrival and preserve separation between:
- maintenance;
- deliberate downward movement.

---

## ALK-030A — Automatic maintenance does not oppose a supported trajectory toward range

`ALK-TOWARD-RANGE-HOLD-001`

This rule determines the two `ALK-070` cells that previously named only a prohibition.

\[
\boxed{
\begin{aligned}
&\text{below range}\ \wedge\ \text{supported } RISING\ \wedge\ \neg\text{activePlan} &&\Rightarrow\ \text{HOLD maintenance}\\
&\text{above range}\ \wedge\ \text{supported } FALLING\ \wedge\ \neg\text{activePlan} &&\Rightarrow\ \text{HOLD maintenance}
\end{aligned}
}
\]

`activePlan` means a known deliberate level-movement intervention, exactly as in `ALK-029`
and `ALK-030`. Where one is active, those rules' own active-plan branches govern and this
rule does not apply.

"Supported" means the `ALK-MOVEMENT-001` trajectory: \(S_{supported}\neq0\) with the
ordinary minimum evidence satisfied. An observed lean that uncertainty has already reduced
to zero is `UNCERTAINTY_LIMITED`, is **not** a supported trajectory, and is held by
`ALK-011`'s own uncertainty-limited branch rather than by this rule.

**Automatic maintenance must not oppose a supported trajectory that is already carrying
alkalinity toward the preferred range.** It does not decrease the dose of a tank that is
below range and supported-rising, and it does not increase the dose of a tank that is above
range and supported-falling.

`ALK-029`'s remaining instructions still run and are still reported: determine whether the
current dose exceeds the estimated maintenance requirement, forecast range entry, and show
both. They explain the HOLD; they do not size an action here.

Intentional level movement remains owned by the separate return-plan mechanism
(`ALK-054`, `ALK-RETURN-ELIGIBLE-TRAJECTORY-001`) and by nothing else. A tank with a
supported non-zero trajectory is **not** return-plan eligible, so these two cells offer no
plan either: they hold, explain and re-test.

What this rule does **not** suspend:

- `ALK-OUTER-BOUND-ACTION-001`. An outer-bound breach owns its own action regardless of the
  direction of travel;
- `ALK-RAPID-001` and the retest scheduler. Movement toward range may still be rapid and
  may still shorten testing;
- the active return/correction plan branches of `ALK-029` and `ALK-030`, which continue to
  evaluate the plan against its intended trajectory;
- the in-range rows of `ALK-070`. Once the level is inside the preferred range, a supported
  trajectory is acted on normally.

Reason:

> using the maintenance controller to fight a movement the keeper wants is the one action
> both readings of the old matrix cells forbade, and `CORE-STABILISE-001`'s symmetry
> argument does not reach a case where the level is outside the range the keeper chose.

---

## ALK-031 — Negative inferred consumption

The V1 safety principle is retained:

> A negative inferred biological alkalinity consumption must not be used to size an ordinary maintenance-dose change.

If:

\[
C_{estimate}
=
P_{selected}D
-
S_{observed}
<0
\]

the simple model says the tank is gaining alkalinity faster than the known maintenance dose supplies.

Possible physical explanations exist, but the app does not choose one without evidence.

### Materiality boundary

`ALK-NEGATIVE-MATERIALITY-001`

The two branches below are separated by one deterministic test. Let \(\sigma_S\) be
`ALK-SLOPE-UNCERTAINTY-001` and let `ALK_SLOPE_SUPPORT_K = 1.28` be the frozen controller
constant of `ALK-SUPPORTED-SLOPE-001`.

Negative inferred consumption is **materially negative** when, and only when:

\[
\boxed{
C_{estimate}
+
ALK\_SLOPE\_SUPPORT\_K\cdot\sigma_S
<
0
}
\]

Otherwise the negative estimate is **uncertainty-limited/uninterpretable**. It is not a
supported claim that the tank is gaining alkalinity, and it **cannot by itself reduce an
established maintenance dose**.

The test reuses the two quantities alkalinity already owns. **No \(\sigma_P\) and no
\(\sigma_D\) are introduced, and none may be.** Treating potency and delivered-dose
uncertainty as zero is conservative in the direction of calling a broken mass balance
*slight* rather than *material* — it delays a dosing pause rather than triggering one
spuriously. That direction is the intended one.

The comparison is **strict**. At exactly \(C_{estimate}+1.28\sigma_S=0\) the result is
**not** materially negative.

Both branches are uninterpretable for the purpose of **sizing maintenance**, so the
maintenance action is identical — HOLD — on either side of the boundary. What the boundary
decides is the recorded classification, the wording and the follow-up.

### Scope of this boundary

This rule determines the **maintenance** consequence, which is the consequence Freeze 5
states: on either branch the estimate cannot by itself reduce an established maintenance
dose, and the action is HOLD.

`ALK-HIGH-BREACH-UNRESOLVED-001` asks a different question — whether \(C_{estimate}\) is
usable for high-breach safety-dose sizing — and `ALK-HIGH-BREACH-NO-PAUSE-001` below
answers it. Owner decision 16 then removes the *sizing* choice from this boundary
altogether: on either negative branch the delivered temporary safety rate is
`ALK-HIGH-BREACH-SAFETY-SIZING-001`'s, and this boundary decides classification, wording
and the maintenance evidence state only.

### High breach and a negative estimate

`ALK-HIGH-BREACH-NO-PAUSE-001`

Above the outer bound, with \(C_{estimate}<0\):

```text
materially negative   -> NON_PHYSICAL_OR_UNEXPLAINED_GAIN     (classification)
negative, NOT materially negative
                      -> UNCERTAIN_NON_RESOLVABLE             (classification)

both negative branches
                      -> C_estimate is NOT usable for safety-dose sizing
                      -> delivered temporary safety rate =
                         ALK-HIGH-BREACH-SAFETY-SIZING-001    (owner decision 16)
                      -> maintenanceEstimateStatus = UNRESOLVED
                      -> the classification does NOT choose the delivered rate

C_estimate >= 0       -> interpretable
                      -> High breach - interpretable consumption; D_safety,temp
```

**Superseded by owner decision 16**, and preserved here rather than deleted — this rule
previously routed the two negative branches to two different *delivered* outcomes:

> ```text
> materially negative        -> temporary pause of Alk delivery to 0 mL/day
> negative, NOT materially   -> HOLD the established maintenance dose
>                            -> reason = SAFETY_HIGH_BREACH_NO_PAUSE_UNCERTAINTY_LIMITED
> ```

Neither branch chooses a delivered rate any longer.

On the middle branch the estimate is **uncertainty-limited/uninterpretable for maintenance
purposes**. It is not evidence that the tank needs no alkalinity, and it is not by itself a
reason to stop supplying it. Specifically, and all four hold together:

- the **maintenance estimate** is not sized from the negative arithmetic in either
  direction (`ALK-NEGATIVE-CONSUMPTION-001`), and `maintenanceEstimateStatus` stays
  `UNRESOLVED`. **Superseded by owner decision 16:** this bullet previously required
  holding the established dose as the *delivered* response. The delivered high-breach rate
  is now `ALK-HIGH-BREACH-SAFETY-SIZING-001`'s, on both negative branches alike;
- the **separate high-breach safety handling is preserved**: the outer-bound state, the
  `SAFETY_RETURN` intervention, `ALK-003A`'s position and direction reporting and the
  magnesium-gate surfacing all continue exactly as they would otherwise;
- **retesting is shortened/reprioritised** as already defined — the ~24 h high-breach and
  safety-return candidates of `ALK-RETEST-SCHEDULER-001` are unaffected by this rule;
- **do not infer zero biological consumption** from an uncertainty-limited negative
  estimate. `maintenanceEstimateStatus` stays `UNRESOLVED`; a held dose is not a claim that
  the held value is the demand.

Reason: pausing delivery to zero is a fail-safe against a *demonstrably* broken mass
balance. An estimate that is merely negative inside its own uncertainty has not
demonstrated one, and this rule's \(\sigma_P=\sigma_D=0\) choice is justified above as
*delaying* a pause rather than triggering one spuriously. Arming the pause across the whole
negative range would contradict the conservatism that justifies the boundary.

The middle band's width is \(1.28\sigma_S\), so it scales with \(\sigma_S\) and has **no
fixed size**. For three clusters on a clean line over four days it is
\(-0.045255 \le C_{estimate} < 0\) dKH/day; with a longer span it narrows, and with
residual scatter above the 0.10 floor it widens without bound.

**Owner decision 16 removes that width from safety sizing, and deliberately invents no
ceiling for it.** The band still scales with \(\sigma_S\) and still has no fixed size, but
it no longer controls the delivered high-breach rate: that comes from \(R_{down}\) and the
established dose, both of which are bounded. What the band still decides is the recorded
maintenance classification, the wording and the maintenance evidence state — none of which
sizes a recommendation.

### Slight negative within uncertainty

If the estimate is **not** materially negative under `ALK-NEGATIVE-MATERIALITY-001`:
- classify consumption as UNCERTAIN / non-resolvable;
- HOLD;
- retest according to evidence needs.

### Materially negative

If the estimate **is** materially negative under `ALK-NEGATIVE-MATERIALITY-001`:
- mark `NON_PHYSICAL_OR_UNEXPLAINED_GAIN`;
- do not use the negative maintenance estimate;
- do not silently clamp it to zero and then treat zero as a real maintenance target;
- HOLD ordinary consumption-derived action;
- inspect logged corrections and known events;
- if no known event explains it, request follow-up evidence.

A logged known correction may explain the result and suppress anomaly wording while the underlying arithmetic remains auditable.

### High/rising does not create a dose estimate

`ALK-NEGATIVE-CONSUMPTION-001`

If consumption is materially negative/uninterpretable, **do not change the established maintenance dose from that arithmetic**, even if the latest Alk is high and rising.

A high/rising position changes:
- urgency;
- retest timing;
- need to verify delivery/history;

not the validity of the broken consumption estimate.

If an explicitly temporary return-plan/correction component is active, that temporary movement component may be stopped under its own plan rules. That is not the same as changing established maintenance from negative-consumption arithmetic.

Default response to materially unexplained negative consumption:
- HOLD the **accepted permanent-maintenance estimate**;
- stop/withhold any unjustified temporary upward movement;
- review logged corrections, water changes, delivery events and context changes;
- retest sooner when position/direction creates risk;
- preserve the unexplained mass-balance state until clean evidence resolves it.

### Explicit outer-bound exception

If the latest Alk is **above `OuterMax`** — at any level, with no upper limit — `ALK-HIGH-BREACH-SAFETY-SIZING-001` sizes a temporary reduction of recommended Alk delivery, which floors at 0 mL/day where the configured contribution cannot absorb \(R_{down}\). At or beyond `AdvisoryCeiling` the rate is **still sized, by the same arithmetic**; under owner decision 24 `ALK-ADVISORY-RANGE-BOUNDARY-001` attaches a confidence warning beside that answer and withholds nothing.

**Amended by owner decision 21**, preserved for history — this sentence previously read
"If the latest Alk is **above `OuterMax`**", with no upper bound on the region the sizing
rule governs. Decision 21 bounds it at `AdvisoryCeiling`.

That is a safety fail-safe, not a new maintenance estimate.

Therefore these two statements are simultaneously true:

```text
acceptedPermanentMaintenanceEstimate = preserved / unresolved
temporarySafetyDoseRecommendation = max(0, D_current - R_down / P_selected)
```

**Superseded by owner decision 16**, preserved for history — this section previously read
`temporarySafetyDoseRecommendation = 0 mL/day`, chosen by the materiality classification
rather than sized.

**Amended by owner decision 20**, preserved for history. Superseded wording: the sized form
above previously read `max(0, D_established - R_down / P_selected)`. That name covered two
different quantities and is split by `ALK-DELIVERY-RATE-BASIS-001`; safety sizing takes
`D_current` and interval calculations take `D_history`.

This deliberately removes V1's ordinary exception that allowed position/trajectory to size a permanent maintenance reduction when the mass-balance model itself was non-physical, while preserving the separate outer-bound fail-safe.

---

## ALK-032 — Empirical dose bracket

V1's empirical bracketing idea is retained as a **sanity and conflict detector**, not as an unquestionable hard clamp.

Eligible historical observations may identify:

- doses under which Alk fell;
- doses under which Alk rose.

The true current maintenance requirement may plausibly lie between recent comparable observations.

### Canonical memory horizon

Retain V1's:

**45-day maximum age**

subject to:
- same potency context;
- no obvious demand regime mismatch;
- no incompatible intervention history.

### Historical-demand comparability

`ALK-BRACKET-COMPARABILITY-001`

Retain V1's 25% idea as an exact secondary comparability diagnostic.

A historical dose-response observation may narrow the current empirical bracket only when both:
- current \(C_{estimate}>0\) and is sufficiently interpretable;
- historical \(C_{hist}>0\) and was derived from eligible comparable evidence.

Define:

\[
R_C
=
\frac{
|C_{hist}-C_{estimate}|
}{
C_{estimate}
}
\]

If:

\[
\boxed{
R_C\le0.25
}
\]

the historical observation may contribute to bracket narrowing.

If:

\[
R_C>0.25
\]

it may remain visible as historical context but must not narrow the current bracket.

If current consumption is zero, negative, or physically uninterpretable, **do not use this ratio** and do not narrow the bracket from historical consumption comparability.

This diagnostic remains secondary and cannot silently veto a well-supported current requirement.

### V2 change

An old bracket may:
- warn;
- lower confidence;
- request verification.

It should not silently veto a well-supported higher current requirement in a growing tank.

**V1 disposition:** KEEP BUT RESTRUCTURE.

---

## ALK-033 — Water changes

V2 replaces V1's blanket “water changes always stay in the trend” rule.

For an alkalinity water change:

\[
\Delta A_{WC}
=
f(A_{replacement}-A_{tank})
\]

where \(f\) is changed fraction.

### If replacement alkalinity is measured/reliable

`ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001`

Part II §45 enumerates the replacement-chemistry confidence tiers and requires a parameter
canon to state which of them may drive mathematical normalization. Alkalinity states it
here.

**Only `MEASURED_SAME_BATCH` qualifies for automatic water-change normalization.**

\[
\boxed{
normalizationPermitted
\iff
replacementAlkalinityConfidence = MEASURED\_SAME\_BATCH
}
\]

`USER_CONFIGURED_SALT_PROFILE`, `MANUFACTURER_NOMINAL`, an unknown tier and any lower
confidence do **not** qualify. They are treated as unknown replacement alkalinity and fall
through to `ALK-WATERCHANGE-UNKNOWN-001` and the segmentation handling below —
`f < 0.05` retains the event inside the segment without an invented subtraction,
`f ≥ 0.05` is a hard Alk segment boundary. That branch is fully specified already, so no
behaviour is invented by the fall-through.

This is Part II §45's own warning applied: an unverified salt label must not become a
precise correction merely because a formula exists.

Where the tier does qualify, and the expected step is material, normalize the known step in
the analytical series. `WG-ALK-011` and `ALK-G022` are therefore executable only under
`MEASURED_SAME_BATCH`, and are read that way.

### If replacement alkalinity is unknown

`ALK-WATERCHANGE-UNKNOWN-001`

V2 intentionally replaces V1's blanket rule that water changes simply remain in the Alk trend.

For unknown replacement-water Alk, define a fixed-but-reviewable engineering uncertainty envelope:

\[
\boxed{
ALK\_UNKNOWN\_WC\_ASSUMED\_MISMATCH
=
2.0\ dKH
}
\]

This is not a claim that every salt mix differs by 2.0 dKH.

It is the conservative unknown-input envelope used to decide whether an unmeasured water change could equal/exceed the Alk analytical materiality floor.

Potential unknown step magnitude:

\[
\Delta A_{unknown,max}
=
f\times2.0
\]

The Alk materiality floor is:

\[
0.10\ dKH
\]

Therefore:

\[
f\times2.0\ge0.10
\]

at:

\[
\boxed{
f\ge0.05
}
\]

So:

### Unknown replacement Alk and water change <5%

The event may remain inside the Alk segment.

Record:

```text
waterChangeEffect: UNKNOWN_SUBFLOOR_ASSUMPTION
```

Do not subtract an invented value.

### Unknown replacement Alk and water change ≥5%

The event is a **hard Alk segment boundary**.

- do not estimate/subtract an unknown contribution;
- end the pre-change Alk analytical segment at the water-change event;
- start a new clean segment afterward;
- any maintenance-intervention response spanning the event becomes confounded unless another explicit rule resolves it;
- the interval is ineligible for potency learning.

This is not a back-door subtraction rule.

It is segmentation because a potentially material external Alk input is unknown.

### If expected effect is genuinely negligible

The event may remain inside the segment under the rules above.

### Known replacement-water materiality criterion

A known/estimated water-change shift is considered analytically material when:

\[
|\Delta A_{WC}|
\ge 0.10\ dKH
\]

the Alk working uncertainty floor.

If replacement Alk is known with adequate confidence:
- calculate the mixing step;
- normalize a material known step;
- leave a sub-floor known step unnormalized;
- preserve the raw measurement/event either way.

### Consequence for ordinary weekly water changes

Breaking an Alk segment at a weekly water change is acceptable because the normal Alk cadence is ~48 hours, allowing multiple post-change measurements before the next weekly change.

This parameter-specific conclusion must **not** automatically be copied to calcium or magnesium.

**V1 disposition:** REPLACE blanket rule with materiality-aware Alk rule.

---

## ALK-034 — Known corrections

Known alkalinity additions are modeled from actual delivery events.

Immediate addition:

\[
A_{norm}(t)
=
A_{raw}(t)-\Delta A
\]

for analytical points after the addition.

Staged additions:

\[
A_{norm}(t)
=
A_{raw}(t)
-
\sum_{j:t_j\le t}\Delta A_j
\]

The V1 three-day linear assumption is removed.

**V1 disposition:** REPLACE.

---

## ALK-035 — Actual hourly dosing and dose changes

If alkalinity is dosed hourly, a maintenance setting changed at 14:30 has not delivered a full day's difference by 15:00.

The engine should use the actual dosing schedule where available.

For ordinary display the app may still describe the setting as mL/day.

For analytical exposure, use actual scheduled/confirmed delivery.

This is particularly important for:
- first 24 hours after change;
- missed doses;
- interrupted pump operation;
- potency learning.

---

## ALK-036 — First post-change check

`ALK-POSTCHANGE-001`

The time-zero baseline may be the Alk measurement immediately preceding the actual dose change.

The first ordinary post-change test occurs:

**approximately 48 hours after the actual dose change.**

It creates the first new-dose interval, but there is still only **one genuine post-change measurement**.

Therefore the Day-2 check does **not** run the formal causal response classifier.

For an intervention that is not already terminally `NOT_ATTRIBUTABLE_SMALL_SIGNAL`, the ordinary attribution state at this stage is:

```text
responseAttribution: AWAITING_FORMAL_POST_SLOPE
```

### What Day 2 does assess

The Day-2 check evaluates:

- latest measured Alk position;
- whether the latest measurement is suspicious and should be repeated;
- actual delivered dose/exposure where known;
- rapid Alk movement under `ALK-RAPID-001`;
- actual or forecast outer-bound risk;
- directly evidenced pump/delivery failure;
- interruption/confounding events;
- whether the attribution model was already known at intervention creation to be underpowered.

It may trigger earlier action only through one of those explicit rules.

### What Day 2 does not claim

From chemistry alone, one genuine post-change measurement must not be formally labelled:

- EXPECTED;
- PARTIAL;
- NO_DETECTABLE_RESPONSE;
- CONTRADICTORY;
- OVER_RESPONSE.

Those classes require the non-overlapping pre/post slope comparison in `ALK-RESPONSE-CLASSIFIER-001`.

### The predicted trajectory is still useful

The full card may show:

```text
predictedPostSlope
firstPostChangeIntervalSlope
```

as explanatory context.

Example:
- pre-change observed slope = −0.20 dKH/day;
- the implemented dose change predicted approximately zero post-change slope;
- the first 48-hour interval is approximately flat.

The app may explain that the first check is **consistent with the intended direction**, but the formal response remains `AWAITING_FORMAL_POST_SLOPE`.

It must not call flat movement “no response” merely because alkalinity did not rise.

### Ordinary action

If no rapid/safety/delivery override applies:

```text
recommendation: HOLD_CURRENT_DOSE
nextTest: approximately Day +4
```

One post-change observation does not prove the new dose is maintenance-matched and does not normally justify stacking another maintenance change.

---

## ALK-037 — Second post-change test

With:
- explicit time-zero baseline;
- first post-change cluster;
- second post-change cluster;

the engine can estimate a genuinely post-change multi-point trajectory.

This is the preferred point for:
- confirming the new maintenance dose;
- recalculating residual maintenance mismatch;
- deciding whether a second ordinary dose change is needed;
- considering potency-learning eligibility.

Under the ordinary cadence this commonly occurs around **Day 4** after the dose change.

This second post-change test is the preferred point to:
- declare the new dose approximately maintenance-matched;
- calculate a residual supported maintenance mismatch;
- make a routine second maintenance adjustment if justified;
- begin qualifying the intervention for potency learning.

The system may act earlier only through explicit contradiction, rapid-change, safety, or delivery-failure rules.

---

## ALK-038 — Expected response

For an Alk maintenance change:

\[
\Delta S_{expected}
=
P_{selected}(D_{new}-D_{old})
\]

\[
S_{pred,new}
=
S_{pre}
+
\Delta S_{expected}
\]

Store the expected slope at the moment the intervention starts.

Example:

Pre-change slope:
\[
-0.20\ dKH/day
\]

Potency:
\[
0.06\ dKH/mL
\]

Dose:
9 → 11 mL/day

Expected slope change:
\[
0.06\times2=+0.12
\]

Predicted new slope:
\[
-0.20+0.12=-0.08\ dKH/day
\]

If the tank later measures around −0.08/day, the dose change did what the model predicted even though Alk is still declining.

The correct early interpretation is **partial/expected response**, not “the change failed because Alk is still falling.”

---

## ALK-039 — No response

A dose change may be classified `NO_DETECTABLE_RESPONSE` only when:

- a formal post-change slope exists under `ALK-RESPONSE-CLASSIFIER-001`;
- enough new-dose exposure has occurred;
- the expected response is attributable under the response-detectability rules;
- the measured trajectory shift remains inside the formal response band around no change while lying outside the response band around the expected response.

A Day +2 baseline-to-first-reading interval is not sufficient for this classification.

This state is evidence about the mismatch.

It does not itself prove:
- low potency;
- pump failure;
- increased consumption.

After enough evidence, the engine may:
- recommend another maintenance adjustment;
- flag potency/delivery verification;
- make the intervention eligible/ineligible for potency analysis as appropriate.

---

## ALK-040 — Contradictory response

A response is contradictory when the dose change created a clear expectation and subsequent Alk movement is materially opposite to it.

Examples:
- dose increased, but supported decline worsens;
- dose decreased, but supported rise accelerates.

The app reports the contradiction.

It does not claim a cause.

A severe contradictory response may justify earlier retesting and delivery verification.

---

## ALK-041 — Partial response

Example:

Pre:
\[
-0.25\ dKH/day
\]

After increase:
\[
-0.07\ dKH/day
\]

The fall has slowed substantially.

If evidence is still developing:
- HOLD;
- test again;
- do not immediately add another increase.

Once post-change evidence is sufficient, any residual supported slope may justify a further maintenance recalculation.

---

## ALK-042 — Over-response

A response may be `OVER_RESPONSE` when it is in the intended direction but materially stronger than expected after accounting for uncertainty.

This lowers confidence in at least one model input:
- potency;
- consumption stability;
- dose delivery;
- measurement.

Do not automatically reverse the entire prior dose change.

Use the current post-change state.

---

## ALK-043 — Overshoot

Overshoot is measured from the **latest actual Alk reading**, not the regression.

Example:
range 8.2–8.8;
after an upward intervention latest measurement = 8.95.

That is an overshoot even if the fitted line is 8.78.

The response engine should:
- stop any deliberate upward movement;
- return toward maintenance logic;
- reassess current trajectory;
- shorten retest timing.

Do not simply “undo the previous change” because the previous intervention may have contained a valid maintenance correction plus an excessive temporary component.

---

## ALK-044 — Maintenance recommendation calculation

Raw mathematical maintenance change:

\[
\Delta D_{supported}
=
-\frac{S_{supported}}{P_{selected}}
\]

The observed slope \(S\) remains visible and auditable.

The maintenance recommendation is sized from \(S_{supported}\), not directly from the full observed slope.

Then:

\[
D_{ideal}
=
D_{current}+\Delta D_{supported}
\]

The Recommendation Engine must then apply:
- evidence gate;
- uncertainty-limited HOLD when \(S_{supported}=0\);
- intervention lock;
- potency validity/context rules;
- safety rail;
- dose-step limit;
- empirical bracket warning/conflict logic;
- non-negative-dose limit;
- pump rounding.

### Important V2 change

The old 12% “dose-gap trigger” is **not retained as a separate gate**.

If the Alk trend is sufficiently established to justify action, the size of the maintenance mismatch already follows from the supported slope and potency.

A second percentage gate can make the app knowingly leave a supported slow decline untreated.

Anti-chatter instead comes from:
- evidence threshold;
- intervention lock;
- uncertainty;
- minimum effective/pump-resolvable change;
- dose-step safety.

**V1 disposition:** REPLACE the 12% trigger.

---

## ALK-045 — Minimum useful dose change

`ALK-MINIMUM-ACTION-001`

Once alkalinity movement has already satisfied the evidence rules and \(S_{supported}\neq0\), V2 must **not add a second detectability gate that can permanently suppress a real slow drift**.

The minimum recommendable change is:

\[
|\Delta D_{recommended}|
\ge recommendationPrecisionMlPerDay
\]

after all continuous safety constraints are applied.

After rounding, recalculate:

\[
\Delta S_{rounded}
=
P_{selected}
(
D_{rounded}-D_{current}
)
\]

If rounding returns the recommendation to the current dose, HOLD because the recommendation cannot represent the supported correction.

If the rounded change is non-zero but its expected response is too small to distinguish in one ordinary 48-hour interval:
- the change may still be recommended;
- post-change response remains NOT_YET_ASSESSABLE until enough signal/time accumulates;
- the Retest Scheduler continues collecting Alk at the normal cadence;
- do not call the absence of a detectable 48-hour response `NO_DETECTABLE_RESPONSE`.

Reason:

A separate “must be detectable within the next test” gate would negate the supported-slope design. A long clean series can support a small real drift even when the resulting recommended change cannot be verified from one two-day interval.

---

## ALK-046 — Alkalinity rate rail

V1's conservative rate rail is retained:

\[
\boxed{
0.50\ dKH/day
}
\]

The rail governs deliberate Alk movement.

For an ordinary maintenance adjustment, the relevant level-effect contribution is:

\[
\Delta A_{maintenance,24h}
=
P_{selected}\Delta D_{maintenance}
\]

The rail is a ceiling, not a target.

### Composite rail

`ALK-COMPOSITE-RAIL-001`

The rail applies to the **combined signed level-effect of all simultaneously recommended, calculable Alk movement components over the same 24-hour horizon**.

For example:

\[
\Delta A_{combined,24h}
=
\Delta A_{safety}
+
P_{selected}\Delta D_{maintenance}
+
\sum \Delta A_{other,planned}
\]

and:

\[
\boxed{
|\Delta A_{combined,24h}|
\le
0.50\ dKH
}
\]

for simultaneously planned/calculable intentional movement.

If a `SAFETY_RETURN` and a new maintenance adjustment point in the same direction and their combined effect would exceed 0.50 dKH/day:

1. safety-return movement receives priority;
2. the new maintenance adjustment is **deferred**, not partially applied;
3. the engine records the deferred maintenance recommendation reason:

```text
DEFERRED_BY_SAFETY_RAIL
```

Example:

```text
safety return = +0.50 dKH/24h
maintenance change effect = +0.104 dKH/24h
```

Required combined recommendation:

```text
safety return = +0.50 dKH/24h
new maintenance change = deferred
combined intentional movement = +0.50 dKH/24h
```

Do not issue +0.604 dKH/day as two independently legal recommendations.

### High-breach unresolved fail-safe

The temporary high-breach safety rate under `ALK-HIGH-BREACH-SAFETY-SIZING-001` — including the case where it floors at 0 mL/day — is not a modeled trajectory target, because \(C_{estimate}\) is not usable and the rate is derived from the configured-delivery contribution (\(D_{current}\)) rather than from a consumption model.

Do not manufacture a predicted movement solely to force that fail-safe through the ordinary rail calculation.

Instead:
- deliver the temporary safety rate `ALK-HIGH-BREACH-SAFETY-SIZING-001` sizes, which floors
  at 0 mL/day rather than being chosen as a pause (**amended by owner decision 16**;
  this bullet previously read *"pause Alk addition"*);
- retest on the safety cadence;
- re-enter calculable rail logic once consumption/trajectory becomes interpretable.

\(R_{down}\) is rail-bounded by construction, so the **continuous** rate cannot breach
`ALK-046`. The **discretised** command can: rounding down by up to half an increment
increases the delivered reduction, so `ALK-ROUNDING-001`'s step-6 hard-constraint recheck
remains load-bearing on this path and is not waived by this clause.

**V1 disposition:** KEEP, strengthened to apply across simultaneously active recommendation components.

---

## ALK-047 — Ordinary dose-step cap

`ALK-STEP-CAP-001`

V1 used a 25% maximum ordinary dose change.

V2 retains for ordinary established maintenance dosing:

\[
\frac{|\Delta D|}{D_{current}}
\le 25\%
\]

provided the percentage cap is larger than one recommendation-precision step.

Let:

\[
R_{pump}=recommendationPrecisionMlPerDay
\]

The ordinary 25% percentage cap is meaningful only when:

\[
0.25D_{current}\ge R_{pump}
\]

equivalently:

\[
\boxed{
D_{current}\ge4R_{pump}
}
\]

### Baseline-establishment regime

If:

\[
D_{current}<4R_{pump}
\]

including:

\[
D_{current}=0
\]

the percentage cap is **inactive** because it would permit less than one representable recommendation step and could trap the controller at zero/tiny dosing forever.

In this regime:

- calculate the supported maintenance requirement normally;
- apply the Alk physical-effect rail;
- apply non-negative-dose limits;
- apply any potency/configuration/evidence refusals;
- round under `ALK-ROUNDING-001`;
- do not manufacture a percentage limit from a zero or sub-resolution denominator.

This is called:

```text
doseStepRegime: BASELINE_ESTABLISHMENT
```

It is not a “rescue” mode and does not weaken evidence requirements.

It only removes a mathematically meaningless percentage cap.

Once:

\[
D_{current}\ge4R_{pump}
\]

the ordinary 25% cap becomes active automatically.

This is a deterministic consequence of the 25% cap and the configured recommendation precision, not a separately chosen tank-size threshold.

### Narrow rapid/outer-bound relaxation

Ordinary maintenance adjustments remain capped at **25%** of current dose.

The percentage cap may relax up to **50%** only when all of the following are true:

1. `ALK-RAPID-001` is confirmed;
2. and either:
   - the latest valid measurement is already beyond the outer operating bound; or
   - the sufficiently established **observed** trajectory forecasts crossing the outer operating bound before the next ordinary 48-hour test;
3. the underlying measurement/dose/potency evidence is otherwise valid;
4. the 0.50 dKH/day physical-effect rail still permits the change;
5. next Alk testing is shortened to approximately 24 hours.

Being merely outside the user's preferred target range does **not** unlock the 50% cap.

The outer operating bound and the target range remain different concepts.

---

## ALK-048 — Staging the calculated maintenance change

V1 staged different fractions of the raw gap based largely on the raw number of mL.

That does not scale cleanly across:
- tank volume;
- product strength;
- learned potency.

V2 therefore rejects raw-mL magnitude bands as the primary staging mechanism.

### V2 rule — no percentage staging layer

`ALK-STAGING-001`

V2 does not apply a second arbitrary staging percentage to the calculated Alk maintenance gap.

The conservative adjustment already occurs mathematically through ALK-011B:

\[
S \rightarrow S_{supported}
\rightarrow
\Delta D_{supported}
\]

Therefore:
- no 100/90/70/55% raw-mL bands;
- no HIGH=100% / MODERATE=75% coefficient;
- no user-adjustable confidence damping.

After uncertainty support is applied, the recommendation proceeds through physical safety caps, empirical sanity checks and recommendation rounding.

Confidence remains an output/description of the evidence, not a coefficient that manufactures the dose number.

---

## ALK-048B — Recommendation rounding

`ALK-ROUNDING-001`

This rule owns final recommendation rounding for **maintenance mL/day recommendations**.

Inputs:

```text
D_current
D_continuous_feasible
R_precision = recommendationPrecisionMlPerDay
```

Preconditions:

- the continuous candidate has already passed the applicable evidence, physical-rail, step-cap, empirical-bracket and non-negative-dose rules.

**Amended by owner decision 23 — `R_precision` is no longer a precondition of this rule
running.** It was one while a missing increment meant a pump could not be commanded. Under
`ALK-RECOMMEND-ONLY-001` there is no pump, so a missing increment means only that there is
no display convention to round to. This rule therefore always runs, in three states:

```text
R_precision CONFIGURED and > 0   -> steps 1-8 below, unchanged
R_precision CONFIGURED and <= 0  -> VALIDATION_RECOMMENDATION_PRECISION_INVALID (a bad
                                    configured value; a validation failure, as before)
R_precision NOT CONFIGURED       -> steps 1-4 and 7-8 do not apply, because there is
                                    nothing to round to. The recommendation IS the
                                    continuous candidate, stated at full precision.
                                    STEP 6 STILL RUNS: the hard-constraint recheck against
                                    ALK-046 and ALK-LIQUID-VOLUME-GUARD-001 is not a
                                    rounding artefact and is never skipped. No default
                                    increment is assumed.
```

> **Superseded wording, preserved rather than deleted.** This precondition previously read
> "`R_pump` is known and greater than zero", `R_pump` being the actuator increment
> `actuatorIncrementMlPerDay`. Owner decision 23 retired the actuator premise; the symbol is
> renamed \(R_{precision}\) and the precondition is replaced by the three-state table above.

### Canonical rounding

1. Find the two adjacent representable recommendation values around `D_continuous_feasible`.
2. Choose the representable setting with the smallest absolute distance from `D_continuous_feasible`.
3. If the continuous candidate is an exact midpoint, choose the tied setting **closer to `D_current`**.
4. If a tie still remains, choose the **lower** representable setting.
5. Recalculate the actual dose delta and physical Alk effect from the rounded command.
6. Recheck all hard constraints that can be affected by rounding to the recommendation precision. These
   include the physical rate rail (`ALK-046`) and the liquid-volume guard
   (`ALK-LIQUID-VOLUME-GUARD-001`).
7. If the rounded command violates a hard constraint only because rounding moved the command farther from `D_current`, move by recommendation precisions **toward `D_current`** until the command is feasible.
8. If no changed representable command remains feasible and the result returns to the current command:

```text
recommendation = HOLD
reason = MAINTENANCE_ROUNDS_TO_CURRENT_DOSE
```

Do not force a one-increment change merely to avoid HOLD.

### Scope

**Amended by owner decision 23.** Rounding to a configured display precision applies to
every final recommended mL/day figure the engine states — ordinary maintenance and the
temporary high-breach safety rate alike. There is no longer a class of output that is
exempt, because there is no longer a refusal to be exempt from: nothing is withheld for want
of an increment anywhere, so a one-off urgent `SAFETY_RETURN` correction volume needs no
exemption and is simply stated, rounded where a precision is configured and at full
precision where none is.

> **Superseded wording, preserved rather than deleted.** This section previously read: "M-1's
> actuator increment requirement applies to final actionable **maintenance mL/day**. A
> one-off urgent `SAFETY_RETURN` correction volume remains governed by
> `ALK-SAFETY-CORRECTION-RESOLUTION-001` and is not blocked merely because a
> maintenance-rate increment is unknown." Both
> `ALK-SAFETY-CORRECTION-RESOLUTION-001` and M-1's increment limb are retired by owner
> decision 23 and neither is live authority for anything.

---

## ALK-048A — Predicted post-change slope uses the actual recommended dose

`ALK-PREDICTED-POST-SLOPE-001`

Because V2 sizes from \(S_{supported}\), an ordinary first adjustment may intentionally leave a residual predicted slope.

For the final recommended dose after all caps and rounding:

\[
\Delta D_{final}
=
D_{recommended}-D_{current}
\]

\[
\boxed{
S_{pred,post}
=
S_{observed}
+
P_{selected}\Delta D_{final}
}
\]

Do **not** assume that an uncertainty-aware maintenance adjustment predicts \(S_{pred,post}=0\).

Example:

Observed slope:

\[
-0.150\ dKH/day
\]

Supported slope:

\[
-0.105\ dKH/day
\]

A rounded dose change that adds approximately \(+0.104\ dKH/day\) of Alk supply predicts:

\[
S_{pred,post}
\approx
-0.046\ dKH/day
\]

If the next interval is close to −0.046 dKH/day, the intervention behaved as predicted even though alkalinity is still falling.

The controller's long-run objective remains zero slope. Uncertainty-aware action can reach that objective iteratively rather than pretending the entire observed slope is certain on the first adjustment.

---

## ALK-049 — Rounding order

V2 calculation order:

1. validate evidence;
2. calculate the supported-slope continuous action candidate;
3. **no confidence staging layer — see ALK-048**;
4. apply physical rate rail;
5. apply dose-step cap;
6. evaluate empirical bracket conflict;
7. clamp to non-negative dose;
8. apply `ALK-LIQUID-VOLUME-GUARD-001` to the continuous candidate. If the candidate
   exceeds \(V_{alk,max,24h}\), **withhold the recommendation** and stop: the rounding
   step below is not entered, and the guard value itself is never emitted as the
   recommendation;
9. apply recommendation rounding under `ALK-ROUNDING-001`, whose step 6 rechecks the physical
   rate rail and `ALK-LIQUID-VOLUME-GUARD-001` against the discretised command;
10. recalculate expected physical response from the rounded dose;
11. assert `ALK-COMPOSITE-RAIL-001` over all simultaneously recommended intentional
   movement components;
12. produce recommendation.

Step 8 is a hard constraint with a stated consequent, not a note. Step 9's recheck catches
only the case where rounding alone crossed the guard; without step 8 a candidate that
already exceeded the guard would reach `ALK-ROUNDING-001` step 7, whose "only because
rounding moved the command" precondition is false, and no rule would refuse it.

This replaces V1's “round first among the constraints” rule.

Reason:
constraints should operate on the continuous physical estimate; pump rounding is a property of the recommendation and should be applied to the final feasible command.

---

## ALK-050 — Retest scheduler: steady state

Default:

**48 hours**

for ordinary active Alk maintenance monitoring.

A longer quiet-monitoring interval may be considered later at the product/surface layer, but the chemistry engine's working cadence remains 48 hours unless another state requires sooner.

---

## ALK-051 — Retest scheduler: suspicious reading

If newest Alk is suspicious and materially affects advice:

**repeat now.**

The repeat belongs to the same test cluster.

No ordinary dose change from the suspect value unless a defined emergency rule says otherwise.

---

## ALK-052 — Retest scheduler: rapid movement

For `ALK-RAPID-001`:

typically:

**~24 hours**

or sooner if the latest value is near an outer bound and the parameter-specific safety logic requires it.

The exact timestamp should still be produced through Part II's scheduler rather than hardcoded into message text.

---

## ALK-053 — Retest scheduler: after maintenance change

`ALK-POSTCHANGE-RETEST-001`

Default:
- first ordinary post-change test at approximately **48 hours**;
- second ordinary post-change test approximately **48 hours later** when the first result does not justify earlier action.

Internally, exposure and detectability are still calculated.

They may shorten or modify the schedule when:
- rapid change;
- outer-bound risk;
- suspicious measurement;
- clear contradiction;
- expected response should have been detectable much earlier;
- another explicit safety rule applies.

The scheduler should preserve the understandable ~48-hour human rhythm rather than presenting spurious precision such as “test in 31 hours” under ordinary conditions.

---

## ALK-053A — Canonical Alk retest scheduler

`ALK-RETEST-SCHEDULER-001`

There is **one** Alk retest scheduler. `ALK-050`, `ALK-051`, `ALK-052`, `ALK-053`,
`ALK-HIGH-BREACH-UNRESOLVED-001`, `ALK-RETURN-EXPIRY-001`,
`ALK-SAFETY-RETURN-INTEGRATION-001` §9 submit candidates to it. `ALK-EPISODE-RESOLUTION-001`
was briefly a submitter, for the contested-episode `REPEAT_NOW` that owner decision 27
retires; it no longer submits anything. No card, surface or other
rule may compute a next-test time (`X-INV-004`, Part II §50). This rule states the
alkalinity parameterisation of Part II §51–§54 and §66, so the single scheduler is
deterministic.

### Candidate set

| Part II candidate class | Alk parameterisation | Source |
|---|---|---|
| routine cadence | 48 h | `ALK-050` |
| immediate repeat | now | `ALK-051`, driven by `ALK-SUSPECT-DETECTION-001`'s three sources |
| rapid movement | ~24 h, or earlier where outer-bound risk requires it | `ALK-052` |
| after a maintenance change | first useful response test ~48 h; normally a second around Day 4 | `ALK-053`, `ALK-POSTCHANGE-RETEST-001` |
| safety return active | ~24 h | `ALK-SAFETY-RETURN-INTEGRATION-001` §9 |
| high-breach fail-safe | ~24 h | `ALK-HIGH-BREACH-UNRESOLVED-001` |
| confidence-building | \(T_{signal}\), below | this rule |
| forecast boundary crossing | 24 h safety lead, below | this rule |
| intervention detectability | **NOT_RUN** — no `K_detect` | this rule |
| return-plan arrival check | **NOT_RUN** — no distinct cadence | this rule |
| expiry / overrun | \(T_{expiry}=2T_{plan}+2\) days | `ALK-RETURN-EXPIRY-001` |

### Confidence-building time

Part II §53's `RequiredMovement` for alkalinity is the **existing 0.10 dKH analytical
floor** (`ALK-004`, `ALK-SLOPE-UNCERTAINTY-001`), and the slope is the supported slope:

\[
\boxed{
T_{signal,days}
=
\max\left(
1\ \text{day},\;
\frac{0.10}{|S_{supported}|}
\right)
\qquad
S_{supported}\neq0
}
\]

The 24-hour floor is part of this candidate's formula. **It applies only to the ordinary
signal candidate.** It never delays a candidate that is already warranted on other grounds:
the explicit rapid (`ALK-052`), outer-bound/forecast and safety candidates may schedule
earlier than 24 hours, and `REPEAT_NOW` / earliest-practicable semantics are unaffected.

If \(S_{supported}=0\), or movement evidence is `INSUFFICIENT` so no supported slope
exists, the candidate is `NOT_RUN`: there is no supported movement whose accumulation could
be timed. It is therefore `NOT_RUN` on a post-change regime that has not yet reached
ordinary sufficiency, where `ALK-053` owns the timing instead.

No new constant is introduced. Both operands are already frozen canon.

### Forecast outer-bound risk

Where `ALK-062`'s outer-operating-bound forecast produces a projected crossing time
\(T_{outer}\) in days from the assessment instant, testing must be scheduled **before**
that crossing. Part II §54's parameter-specific safety margin for alkalinity is the
**24-hour safety lead** alkalinity already uses for rapid and safety cadence (`ALK-052`,
`ALK-SAFETY-RETURN-INTEGRATION-001` §9):

\[
\boxed{
T_{boundary,days}
=
T_{outer}-1.0
}
\]

The forecast uses \(S_{observed}\), not \(S_{supported}\) — `ALK-011B` and audit finding
R3 forbid sizing risk from the uncertainty-shrunk action slope.

If \(T_{boundary}\le0\) — the projected crossing is already inside the safety lead — the
candidate is test-now / earliest-practicable:

```text
action     = REPEAT_NOW
reasonCode = RETEST_FORECAST_BOUNDARY_RISK
```

This candidate is exempt from the \(T_{signal}\) floor.

**This candidate runs only while the level is inside the bound.** It forecasts a crossing;
once `ALK-003A` reports `BREACHED_LOW` or `BREACHED_HIGH` there is no crossing left to
forecast, `ALK-OUTER-BOUND-ACTION-001` owns the response, and the `SAFETY_RETURN` and
high-breach candidates own the cadence:

```text
outerBoundState in { BREACHED_LOW, BREACHED_HIGH }  -> FORECAST_BOUNDARY_RISK not submitted
```

Without that condition `ALK-062`'s clamp of \(T_{outer}\) to zero on a breached level
would hold the scheduler at `REPEAT_NOW` indefinitely and make the ~24 h safety cadence
this canon states unreachable in exactly the state it was written for.

Forecast timing never overrides an immediate safety rule (Part II §54).

### Bounds on ordinary observation

- **Ceiling.** An ordinary observation candidate is clamped to the existing ~Day-4 window:
  **no ordinary observation candidate exceeds 96 hours.** The chemistry layer defines no
  longer quiet-monitoring interval (`ALK-050`). This is Part II §66's "maximum observation
  interval" for alkalinity, and it reuses an interval the canon already states.

- **Floor, on the ordinary signal candidate only.** \(T_{signal}\) carries a 24-hour floor
  inside its own formula above.

  This is **not** Part II §66's "minimum useful interval", and must not be implemented as
  one. §51 gives that term scheduler-wide force — "the earliest relevant candidate that does
  not violate a minimum useful interval" — and no such scheduler-wide clamp is introduced
  here. The floor is a property of one candidate's formula. In practice no other ordinary
  candidate reaches below 24 hours anyway, since routine cadence is 48 h and both
  post-change candidates are ~48 h or later.

```text
|S_supported| > 0.10 dKH/day  ->  raw T_signal < 24 h  ->  floored to 24 h
                                  reason = RETEST_SIGNAL_FLOOR_APPLIED
```

  The floor is **not** a general scheduling minimum and must not be applied as one. The
  rapid, outer-bound/forecast, safety, high-breach and immediate-repeat candidates are
  explicitly exempt and may schedule earlier when already warranted.

### Selection

The single scheduler returns the **earliest applicable candidate** after the clamp above.
`REPEAT_NOW` outranks ordinary scheduling (Part II §55). The output is
Part II §57's `RetestRecommendation`, carrying every evaluated candidate and every
`NOT_RUN` candidate class so the choice is auditable. Cards render that output and must not
invent a separate cadence (`ALK-052`, `ALK-SAFETY-RETURN-INTEGRATION-001` §9).

Freeze 5's candidates can land on the same instant as an existing one — \(T_{signal}\) at
24.0 h against `ALK-052`'s rapid candidate, or at 48.0 h against `ALK-050`'s routine
cadence. **Where candidates tie on time, the recommended time is that time and every tied
candidate's reason code is emitted**, all of them recorded in `candidateTimes[]`. Reason
codes are additive, so no precedence between tied candidates is invented and the audit
record does not depend on evaluation order.

Under ordinary conditions the scheduler preserves the understandable ~48-hour human rhythm
rather than presenting spurious precision; that presentation rule (`ALK-053`) applies to
rendering and never to the stored timestamp.

### Deliberately not parameterised

\(T_{detect}\) (Part II §52) requires `K_detect`, and the return-plan arrival check
requires a distinct cadence. Freeze 5 supplies neither, and forbids inventing an Alk
constant merely to fill a generic scheduler slot. Both candidate classes are therefore
**canonically `NOT_RUN`** — a decided state, not a gap:

```text
retestCandidatesNotRun = [
  RETEST_DETECTABILITY_POLICY_UNAVAILABLE,
  RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE
]
```

Their absence can only lengthen an interval that the routine, post-change, rapid, safety,
high-breach, confidence-building, forecast-boundary and expiry candidates already bound, so
no unsafe later test results from it. While a return plan is active, the ordinary
observation, rapid, safety and expiry candidates continue to apply normally.

---

## ALK-054 — Return plan arithmetic

### Return-plan trajectory eligibility

`ALK-RETURN-ELIGIBLE-TRAJECTORY-001`

`ALK-STABLE-001` is **unchanged**. `STABLE` remains the narrow analytical claim
\(S_{supported}=0\) **and** \(S_{observed}=0\). Nothing here widens it, adds a near-zero
tolerance band, or reintroduces the fixed movement gate `ALK-011` removed.

Return-plan eligibility is a **separate, explicitly named predicate**, because it answers a
different question: not "is this tank analytically flat?" but "is there established
evidence that no supported trajectory is already carrying the level?"

\[
\boxed{
returnPlanEligibleTrajectory
=
\big(\text{ALK-011 ordinary minimum evidence satisfied}\big)
\ \wedge\
\big(S_{supported}=0\big)
}
\]

Equivalently, in the `ALK-MOVEMENT-001` vocabulary:

```text
movementEvidence in { SUFFICIENT, UNCERTAINTY_LIMITED }  and  S_supported = 0
```

which is exactly `trajectory in { STABLE, UNCERTAINTY_LIMITED }`.

A return plan may therefore be offered when the **observed slope is non-zero but
uncertainty leaves no supported movement**. That is the reachable case on real hobby data,
where a Theil–Sen slope over a resting tank is almost never exactly zero.

`movementEvidence = INSUFFICIENT` is **not** eligible: an offer requires established
evidence that nothing is already moving, not an absence of evidence. A supported non-zero
trajectory is not eligible either.

Every canon site that gates a **return-plan offer** on the word "stable" means
`returnPlanEligibleTrajectory`, not `ALK-STABLE-001`'s `STABLE`. Those sites are `ALK-024`,
`ALK-027`, this rule, and the `Below | Stable` and `Above | Stable` cells of `ALK-070`.
Where `ALK-STABLE-001` says `STABLE`, it means `STABLE`. The two are deliberately different
and must not be collapsed. `WG-ALK-014` is executable under this predicate.

`ALK-070`'s `Any | Uncertain` row holds maintenance and gathers evidence; it does **not**
suppress the offer. `UNCERTAINTY_LIMITED` with the ordinary evidence minimum satisfied is
eligible, and it is the ordinary state of a resting out-of-range tank, so the offer is
reachable there and must not be withheld by reading that row as covering it.

The offer remains opt-in (`CORE-STABILISE-001`, Part I §36.2), remains outside automatic
maintenance, and does not change the maintenance recommendation, which is HOLD on both
eligible trajectories.

### Arithmetic

Once `returnPlanEligibleTrajectory` holds, Alk is out of range and the keeper opts into a
return plan:

Choose destination:

\[
A_T=AimPoint
\]

Choose an allowed desired trajectory \(S_{plan}\), constrained by the Alk rail.

Temporary dose:

\[
D_{temporary}
=
D_{maintenance,reference}
+
\frac{S_{plan}}{P_{selected}}
\]

where \(D_{maintenance,reference}\) is the established/current maintenance reference accepted for the stable regime. For an ordinary stable out-of-range offer this will normally be the current held maintenance dose, not an uncertainty-shrunk level-moving guess.

### Upward return

\[
S_{plan}>0
\]

Temporary dose is above maintenance.

### Downward return

\[
S_{plan}<0
\]

Temporary dose is below maintenance.

Clamp:

\[
D_{temporary}\ge0
\]

If the desired downward rate would require negative dose, the fastest achievable decline from dosing alone is approximately:

\[
S_{min}\approx-C
\]

at zero Alk maintenance dose.

The app should report the honest longer duration rather than imply the requested rate can be achieved.

---

## ALK-055 — Return-plan pace

V1 offered three upward correction paces:

- Gentle: 0.125 dKH/day
- Steady: 0.25 dKH/day
- Quick: 0.50 dKH/day

These correspond to:
- 25%;
- 50%;
- 100%;

of the 0.5 dKH/day rail.

V2 retains these as **optional return-plan pace choices**, because they are presented after the keeper has chosen to move the level and do not alter the automatic maintenance model.

Going downward, the actual achievable pace is additionally limited by biological consumption and non-negative dose.

**V1 disposition:** KEEP BUT REFRAME as return-plan execution choices.

---

## ALK-056 — Return-plan completion

The temporary level-moving dose must stop before it carries Alk through the destination unnecessarily.

### Immediate stop/transition trigger

If the latest valid measurement:
- reaches the aim point; or
- passes the aim point;

stop the temporary movement component and return toward the current maintenance estimate.

One measured crossing is enough to stop intentional movement.

### Confirmation

A subsequent reading confirms whether maintenance now holds the level.

The two-reading confirmation is therefore a **confirmation of settlement**, not permission to keep an elevated/depressed temporary dose running after the aim point has already been reached.

This preserves the useful V1 distinction between `passed` and `arrived` while making the control intent explicit.

---

## ALK-057 — Return-plan arrival zone

V1's arrival-zone concept is retained for confirmation language.

\[
zoneWidth
=
max(
bandWidth/3,\;
2\sigma_{Alk}
)
\]

clamped to the total band width.

Zone is centred on the midpoint.

For 8.2–8.8 dKH:
- band width = 0.6;
- middle third = 0.2;
- \(2\sigma=0.2\);

therefore confirmation zone = approximately:

**8.4–8.6 dKH**

Two readings in the arrival zone may support a strong “settled at destination” conclusion.

But ALK-056 stops intentional movement on the first reach/pass of the aim point.

---

## ALK-058 — Return-plan expiry

`ALK-RETURN-EXPIRY-001`

A return plan must store:
- predicted duration;
- expected next-test times;
- expiry timestamp;
- actual implementation state separately from recommendation state.

Let:

\[
T_{plan}
=
predictedDurationDays
\]

The canonical ordinary Alk return-plan expiry horizon is:

\[
\boxed{
T_{expiry}
=
2T_{plan}+2\ days
}
\]

measured from the actual implemented start time of the temporary movement component.

If no valid assessment has completed the plan by \(T_{expiry}\):

```text
returnPlanPhase: EXPIRED_OVERRUN
recommendedTemporaryMovement: STOP
assessment: TEST_NOW
```

If the app does not directly control or verify the dosing device, it must **not** set the actual dose state to stopped merely because it recommended stopping.

Actual dose remains:
- last confirmed/logged value; or
- UNKNOWN where implementation cannot be established.

This preserves recommendation ≠ implementation.

---

## ALK-059 — Corrections as an execution mechanism

V2 distinguishes:

**user goal:** return plan  
**execution:** temporary maintenance-rate offset and/or explicitly logged correction doses.

A one-off correction may still exist as a tool.

It must:
- be opted into;
- use known potency and net volume;
- respect the Alk rate rail;
- be logged as actual delivered input;
- be excluded/normalized appropriately in maintenance inference.

The user-facing controller should not make “correction” and “return plan” compete as two unrelated answers to the same out-of-range state.

---

## ALK-060 — One-off correction formula

For desired immediate/staged change \(\Delta A\):

\[
Dose_{mL}
=
\frac{\Delta A}{P_{selected}}
\]

where `P_selected` already represents dKH per mL in the configured tank volume.

Equivalent product-normalized implementations may use concentration × volume directly.

Rules:
- calculate at full precision;
- apply rate rail;
- apply `ALK-LIQUID-VOLUME-GUARD-001`;
- round the recommended volume last;
- log actual amount delivered;
- retest according to plan.

---

## ALK-061 — Liquid-volume sanity guard

`ALK-LIQUID-VOLUME-GUARD-001`

V1's useful gross-volume safeguard is retained in a scale-aware form.

Let:

\[
V_{system,mL}=1000V_{system,L}
\]

Maximum Alk dosing-solution volume delivered, through **any engine-generated Alk delivery**, in any rolling 24-hour period:

\[
\boxed{
V_{alk,max,24h}
=
0.02V_{system,mL}
}
\]

That is **2% of configured net system water volume per 24 hours**.

This is a fixed-but-reviewable engineering/practical guard, not a biological alkalinity rail.

### Scope

The guard applies to **all engine-generated Alk delivery**:

- ordinary maintenance delivery (mL/day);
- deliberate return-plan and one-off correction execution;
- `SAFETY_RETURN` correction volume and temporary safety delivery;
- the **permitted combined total** of any of the above that the engine recommends for the
  same rolling 24-hour period.

There is **no maintenance exemption**. `WG-ALK-067`'s "maintenance/correction" wording and
this rule body now agree.

### Enforcement

If a recommended 24-hour delivery would exceed \(V_{alk,max,24h}\):

- **withhold the recommended rate**;
- **do not** cap the command to the guard value and present the capped figure as the
  recommendation. A 2%-of-volume figure is the edge of a safety guard, not a result the
  engine derived, and issuing it would be indistinguishable from a real recommendation;
- keep every unaffected output under `CORE-INFORM-PROCEED-001` — position, outer-bound
  state, trend, evidence, consumption, the calculated requirement at full precision, and
  the retest decision;
- where the delivery is a **correction or return-plan execution**, whose duration the
  engine may choose, lengthen/stage the execution until both the liquid-volume guard and
  the 0.50 dKH/day Alk rail are satisfied, and report the longer duration. It is the
  offending single-day command that is withheld, not the plan.

```text
liquidVolumeGuardExceeded = true
recommendedDoseMlPerDay   = WITHHELD
reason                    = SAFETY_LIQUID_GUARD_EXCEEDED
```

### Pipeline position

The guard is a **hard constraint**. It is evaluated on the continuous candidate and then
**rechecked after recommendation rounding/discretisation**, in `ALK-ROUNDING-001` step 6,
alongside the physical rate rail — because rounding away from the current command can move
a command across the guard exactly as `WG-ALK-063` demonstrates for the rail.

The guard binds at **both** positions, and the pre-rounding evaluation is not advisory:

1. **On the continuous candidate**, before rounding. A continuous candidate that exceeds
   the guard is withheld under Enforcement above. `ALK-ROUNDING-001` is not entered, and its
   step 7 — which fires only where rounding *alone* caused the violation — is not reached.
2. **On the rounded command**, in `ALK-ROUNDING-001` step 6. Where a compliant continuous
   candidate rounds to a command that exceeds the guard, step 7 applies as written: step
   toward the current command by recommendation precisions until feasible. If no changed
   representable command is feasible, the outcome is the withheld state above.

**Neither position may emit the guard value itself as the recommendation**, whether reached
by capping or by stepping. A command numerically equal to \(V_{alk,max,24h}\) is
indistinguishable from a capped one, so it is withheld.

This rule constrains **engine-generated** delivery. A keeper's pre-existing dose above the
guard is not an engine-generated command; the engine reports the exceedance and withholds
any new command that would also exceed it, and this rule does not say what else follows.


For a 77 L validation example:

\[
0.02(77,000)=1,540\ mL/day
\]

which closely reproduces V1's approximate 1.5 L/day gross-volume sanity scale while remaining tank-size aware.

The **0.50 dKH/day Alk rail remains independently binding**.

A stronger solution may reduce liquid volume but does not make faster Alk movement biologically safer.

---

## ALK-062 — Forecasting

`ALK-FORECAST-SLOPE-001`

Forecast and dose sizing answer different questions.

- **Dose sizing** uses \(S_{supported}\).
- **Short-horizon boundary forecasting** uses the canonical **observed** slope \(S_{observed}\) once the trajectory itself has sufficient/rapid evidence.

Do not forecast risk from \(S_{supported}\), because support-shrinkage is deliberately biased toward zero for dosing conservatism.

For a sufficiently established observed slope:

\[
A(t)=A_{now}+S_{observed}t
\]

### Preferred-range forecast

If falling and currently above `RangeMin`:

\[
T_{rangeLow}
=
\frac{A_{now}-RangeMin}{|S_{observed}|}
\]

If already at/below `RangeMin`, set \(T_{rangeLow}=0\).

If rising and currently below `RangeMax`:

\[
T_{rangeHigh}
=
\frac{RangeMax-A_{now}}{S_{observed}}
\]

If already at/above `RangeMax`, set \(T_{rangeHigh}=0\).

### Outer-operating-bound forecast

This is the forecast used by the exceptional 50% cap rule.

If \(S_{observed}<0\):

\[
\boxed{
T_{outerLow}
=
\begin{cases}
0,&A_{now}\le OuterMin\\
\dfrac{A_{now}-OuterMin}{|S_{observed}|},&A_{now}>OuterMin
\end{cases}
}
\]

If \(S_{observed}>0\):

\[
\boxed{
T_{outerHigh}
=
\begin{cases}
0,&A_{now}\ge OuterMax\\
\dfrac{OuterMax-A_{now}}{S_{observed}},&A_{now}<OuterMax
\end{cases}
}
\]

For the irrelevant direction, the crossing time is `NOT_APPLICABLE`, never a negative duration.

`ALK-STEP-CAP-001` uses the forecast limb only when:

```text
falling → T_outerLow <= timeUntilNextOrdinaryTest
rising  → T_outerHigh <= timeUntilNextOrdinaryTest
```

where the ordinary comparison horizon is normally 48 hours.

Preferred-range forecasts explain target-band crossing and may affect retesting.

Outer-bound forecasts determine outer-bound risk and the 50% cap relaxation.

Do not use long-horizon linear forecast as a biological demand prediction.

---

## ALK-063 — Dose change plus target entry

A maintenance-dose change can succeed at stabilising consumption while the absolute Alk value remains outside range.

That outcome is not failure.

Example:
- Alk 7.8 falling;
- maintenance raised;
- Alk stabilises at 8.0;
- range 8.2–8.8.

Result:
- maintenance intervention worked;
- level is stable below range;
- maintenance dose holds;
- return plan may now be offered.

This preserves V1's valuable `worked but settled out of range` concept without making it a chemistry state name.

---

## ALK-064 — Dose change carries level into range while still moving

Example:
- Alk 8.0 falling;
- maintenance dose increased;
- subsequent readings 8.2 → 8.4;
- current level is in range but still rising.

The engine does not declare full maintenance success merely because position is in range.

It evaluates:
- post-change slope;
- whether the rise is the expected response to fixing a deficit;
- whether the calculated maintenance estimate remains above/below the current dose;
- forecasted upper-edge risk.

Automatic advice still seeks zero slope.

---

## ALK-065 — Backdated/edited data

If a historical Alk measurement is inserted, edited or invalidated:

- rebuild affected derived analyses from the appropriate point forward;
- do not rewrite the historical record of what recommendation the user saw at the time;
- current V2 analysis may differ retrospectively and is stored as a new analysis.

---

## ALK-066 — Target-range change

Changing the user's target range:

- immediately reclassifies current position for new analysis;
- does not alter measured values;
- does not alter historical consumption;
- does not alter potency;
- does not rewrite prior recommendations.

A target-range change alone is not evidence that maintenance demand changed.

---

## ALK-067 — Solution-batch / concentration change

A new Alk solution batch or concentration:
- creates a new potency context;
- preserves historical potency observations under the old context;
- starts from new theoretical potency;
- does not silently carry the old learned value as equally valid.

Old effective-delivery ratio may be retained only as weak prior/contextual information where justified.

---

## ALK-068 — Pump calibration / delivery change

A meaningful pump/channel calibration or delivery-line change creates a potency-context boundary because tank response measures effective delivery, not bottle chemistry alone.

Potency learning before and after the change must not be pooled indiscriminately.

---

## ALK-069 — Audit requirements

Every Alk recommendation stores:

- latest valid measured Alk;
- target range;
- outer-bound state;
- clusters available/used;
- excluded clusters and reasons;
- clean segment;
- normalizations;
- Theil–Sen slope;
- slope uncertainty;
- movement evidence limb;
- current dose;
- actual delivered-dose basis;
- theoretical potency;
- learned potency;
- selected potency;
- potency confidence;
- inferred consumption;
- physical-validity flag;
- ideal maintenance dose;
- any staging;
- rail effect;
- percentage cap effect;
- bracket conflict;
- rounded final dose;
- expected post-change slope;
- current intervention;
- intervention response;
- forecast;
- retest recommendation;
- recommendation confidence.

---

## ALK-069A — Canonical Alk slope/demand/dose variable semantics

`ALK-VARIABLE-SEMANTICS-001`

These fields answer different questions and must not be collapsed:

| Field | Meaning | Primary use |
|---|---|---|
| `observedSlope` \(S_{observed}\) | Robust central estimate of what Alk is doing | Physical demand estimate, risk forecast, explanation |
| `slopeUncertainty` \(\sigma_S\) | Deterministic controller uncertainty around observed slope | Supported-slope calculation |
| `supportedSlope` \(S_{supported}\) | Portion of observed slope sufficiently separated from uncertainty for action sizing | Maintenance recommendation sizing |
| `consumptionEstimate` \(C_{estimate}\) | Best-estimate biological/system Alk demand from mass balance | Diagnostics, best-estimate maintenance, plausibility |
| `maintenanceEstimate` | Dose predicted to give zero slope if the observed estimate were exact | Audit/explanation |
| `continuousActionCandidate` | Dose derived from supported slope before physical limits and rounding | Recommendation pipeline |
| `recommendedDose` | Final feasible rounded dose | User action |
| `predictedPostSlope` | Expected slope after the actual final recommended dose | Intervention response benchmark |

No implementation may use one generic field named `slope`, `consumption`, or `maintenanceDose` where the distinction above changes behaviour.

---

## ALK-070 — Core recommendation matrix

Assuming evidence is sufficient and no intervention lock/confounder overrides:

| Position | Trajectory | Automatic maintenance logic |
|---|---|---|
| Below | Falling | Increase toward consumption-matching maintenance |
| Below | Stable | Hold maintenance; offer return plan where `returnPlanEligibleTrajectory` holds (`ALK-RETURN-ELIGIBLE-TRAJECTORY-001`) |
| Below | Rising | Hold maintenance (`ALK-TOWARD-RANGE-HOLD-001`) where the rise is supported; do not increase merely because low; evaluate why it is rising / active plan |
| In range | Falling | Increase maintenance if supported; forecast lower edge |
| In range | Stable | Hold |
| In range | Rising | Decrease maintenance if supported; forecast upper edge |
| Above | Falling | Hold maintenance (`ALK-TOWARD-RANGE-HOLD-001`) where the fall is supported; do not keep reducing merely because high; evaluate active plan/current maintenance |
| Above | Stable | Hold maintenance; offer return plan where `returnPlanEligibleTrajectory` holds (`ALK-RETURN-ELIGIBLE-TRAJECTORY-001`) |
| Above | Rising | Decrease toward consumption-matching maintenance if consumption is interpretable |
| Any | Uncertain | Hold / gather evidence. `UNCERTAINTY_LIMITED` with the ordinary evidence minimum met is return-plan eligible and the offer is not suppressed here |
| Any | Rapid confirmed | Apply rapid/safety rule |
| Any | Active unevaluable intervention | Hold current intervention unless override |

This matrix is a domain rule.

Presentation card names are derived later.

---

## ALK-071 — Recommendation confidence

`ALK-CONFIDENCE-OUTPUT-001`

Confidence is an **output describing the evidence**, not a multiplier used to create the dose number.

### Frozen output

Freeze 5 does **not** define numeric `LOW` / `MODERATE` / `HIGH` classification thresholds,
and forbids inventing them.

```text
recommendationConfidence = UNSPECIFIED
reason                   = OUTPUT_CONFIDENCE_UNSPECIFIED
```

Until a classification is separately specified and canonised, `UNSPECIFIED` is the emitted
value. In its place the engine **surfaces the underlying evidence facts**, each of which is
individually determinate:

```text
independentClusters
spanDays
sigma_S
|S_supported| / |S_observed|          (undefined and omitted when S_observed = 0)
confounders[]
potencyConfidence
deliveryBasis
```

A card can be honest and useful from those facts. It cannot be honest with a three-valued
label whose derivation was invented.

Confidence remains **explanatory only** and **must never participate in dosing arithmetic**
— `ALK-CONFIDENCE-OUTPUT-001` and `X-INV-010` are unchanged, and `INV-ALK-CONFIDENCE-001`
remains the fixture that proves it. `UNSPECIFIED` does not weaken that prohibition; it
removes the only value that could have tempted a multiplier.

The three descriptions below are retained as **non-normative** illustration of what a
future classification would be describing. They are not emitted, not computed, and nothing
may branch on them.

Dose sizing comes from:

\[
S_{observed}
\rightarrow
\sigma_S
\rightarrow
S_{supported}
\rightarrow
\Delta D_{supported}
\]

followed by safety constraints and rounding.

### LOW
Examples:
- two-point provisional trend;
- weak potency context;
- mixed-dose interval;
- soft confounder;
- residual disagreement.

Usually corresponds to HOLD because the evidence or supported slope does not justify ordinary action.

### MODERATE
Normal sufficient evidence with some remaining uncertainty.

The dose number is **not** multiplied by an arbitrary percentage. Its conservatism is already expressed through \(S_{supported}\).

### HIGH
Examples:
- robust recent trend;
- sufficient span;
- consistent direction;
- no confounders;
- strong selected-potency evidence;
- clean dose history;
- small \(\sigma_S\) relative to observed slope.

Again, HIGH does not unlock a hidden coefficient. It describes why the resulting supported slope is close to the observed slope and why the recommendation is well supported.

---

## ALK-072 — V1 behaviours explicitly removed from Alk V2

The following do not survive as active Alk-control rules:

1. simple “average the last three days” control;
2. fitting across dose-change boundaries as if dose were constant;
3. treating every recent reading as independent;
4. using UI branch order as the chemistry state;
5. using a fitted value instead of the latest measurement for current position;
6. the separate fixed 0.10 dKH/day + endpoint-persistence ordinary movement gate; V2 uses the uncertainty-supported slope instead;
7. a separate 12% dose-gap trigger after movement is already established;
8. raw-mL staging bands as a scale-independent control rule;
9. arbitrary three-day linear correction subtraction;
10. a second drift/dose calculator outside the canonical engine;
11. a historical bracket that silently vetoes current supported demand;
12. treating target acquisition as a hidden component of automatic maintenance advice.

---

## ALK-073 — V1 behaviours explicitly retained

1. stabilise before deliberate target acquisition;
2. maintenance and correction/level movement are different jobs;
3. current position is the last valid reading;
4. stable out-of-range level can mean maintenance is correct;
5. one-day large Alk changes may justify faster response;
6. ordinary Alk testing is about every 48 hours;
7. 14 days remains the maximum ordinary current-control horizon;
8. known corrections must not masquerade as biological demand;
9. a second dose change interrupts interpretation of the first;
10. empirical dose-response history is valuable;
11. negative-consumption arithmetic must not blindly size a dose;
12. 0.5 dKH/day remains the deliberate movement rail;
13. 25% ordinary dose-step cap is retained; narrow rapid/outer-bound cases may relax it to 50% under `ALK-STEP-CAP-001`;
14. return plans use the band midpoint as destination;
15. one crossing of the destination stops deliberate movement; further testing confirms settlement;
16. historical recommendations remain historically truthful.

---

# PART III — LOCKED OWNER DECISIONS

The four initial Alk decision gates are resolved.

## Decision summary — `ALK-POSTCHANGE-001` — two-stage response assessment

- first ordinary post-change check at ~48 h;
- Day 2 shows position, exposure and the first interval relative to the predicted trajectory, but does not run the formal causal response classifier;
- usually HOLD unless an explicit rapid/safety/delivery rule applies;
- the second post-change test around Day 4 creates the first ordinary non-overlapping post-change slope and is the preferred point for formal response classification and maintenance reassessment.

## Decision summary — `ALK-SLOPE-SUPPORT-001` — uncertainty-aware dose sizing

- canonical observed slope remains Theil–Sen for 3+ eligible points;
- control slope uncertainty is deterministic under ALK-011A;
- `ALK_SLOPE_SUPPORT_K = 1.28`;
- maintenance change is calculated from \(S_{supported}\);
- no arbitrary confidence multiplier or raw-mL staging percentage.

## Decision summary — `ALK-STEP-CAP-001` — 25% ordinary / 50% narrow rapid-boundary exception

- ordinary cap = 25%;
- up to 50% only for confirmed rapid change plus actual/forecast outer-operating-bound risk;
- 0.50 dKH/day physical rail remains binding;
- earlier retest required.

## Decision summary — `ALK-NEGATIVE-CONSUMPTION-001` — broken mass balance cannot size maintenance

- materially negative/uninterpretable consumption does not produce a maintenance-dose change;
- HOLD established maintenance;
- high/rising changes urgency and retest timing, not the validity of the broken estimate;
- stop an explicitly temporary movement component under its own plan rules where appropriate;
- do not guess the cause.


# PART III — Decisions already made without owner intervention

The following changes are technical clean-ups rather than meaningful product-preference choices and are therefore incorporated into the draft:

1. Theil–Sen replaces unspecified ordinary regression for 3+ Alk points.
2. Repeat measurements are clusters, not independent evidence.
3. Exact timestamps replace date-count arithmetic.
4. A time-zero pre-change Alk reading may anchor the first post-change interval but does not count as a post-change observation.
5. Actual delivered corrections replace the fictional 3-day linear subtraction.
6. A material unknown Alk water-change effect breaks/confounds the Alk segment rather than always remaining in the fit.
7. Current position remains the latest valid measurement.
8. The 12% dose-gap trigger is removed because supported slope already defines the maintenance mismatch.
9. Raw-mL staging bands and arbitrary confidence percentages are removed; uncertainty-aware supported slope does the damping mathematically.
10. `ALK_SLOPE_SUPPORT_K = 1.28` is a fixed-but-reviewable engineering constant, not a user setting.
11. Historical bracketing becomes a sanity/conflict layer rather than an unquestionable veto.
12. Potency is a separate learner with explicit context and confidence.
13. A negative consumption number is never silently turned into a real zero-maintenance estimate.
14. Return-plan intentional movement and maintenance inference remain separate.
15. Pump rounding happens after the continuous feasible recommendation is calculated, followed by recalculation of expected physical effect.

---

# PART III — Required golden scenarios

The final Alk implementation must include at least the following named scenarios.

### ALK-G001 — first reading
One valid reading.
Position known.
No trend.
No consumption.
No dose change.

### ALK-G002 — two ordinary readings
Two readings 48 h apart with small decline.
Provisional signal only.
No ordinary dose change unless rapid threshold reached.

### ALK-G003 — three-reading supported decline
Three independent clusters over four days.
Non-zero supported falling slope.
Calculate best-estimate demand and supported maintenance action.

### ALK-G004 — slow fortnight drain
Observed rate is small, but a long clean window reduces slope uncertainty enough that supported slope becomes non-zero.
Must be classified FALLING and must not be called stable.

### ALK-G004A — uncertainty-limited lean
Observed slope is non-zero but \(S_{supported}=0\).
Trajectory remains rising/falling, recommendation HOLD, reason UNCERTAINTY_LIMITED.
Full card shows observed and supported slope.

### ALK-G005 — rapid one-day fall
Confirmed ≥0.30 dKH/day over ≥24 h.
Rapid override available.

### ALK-G006 — stable below range
Maintenance holds.
Do not increase maintenance.
Offer return plan.

### ALK-G007 — stable above range
Maintenance holds.
Do not decrease maintenance solely from level.
Offer downward return plan.

### ALK-G008 — in range falling
Supported maintenance deficit despite current position being in range.
Recommend maintenance increase.

### ALK-G009 — in range rising
Supported maintenance excess.
Recommend maintenance decrease.

### ALK-G010 — dose change, Day-2 predicted-flat early check
Pre-change Alk is falling.
Dose increase predicts approximately zero post-change slope.
First 48-hour interval is approximately flat.
Do not classify formal EXPECTED or NO_DETECTABLE_RESPONSE from one genuine post-change measurement.
Show the interval as consistent with the intended direction, set `AWAITING_FORMAL_POST_SLOPE`, HOLD, and test again around Day +4 unless a safety override applies.

### ALK-G011 — dose change, Day 4 stable
Two post-change measurements establish near-zero slope.
Mark maintenance intervention successful.

### ALK-G012 — partial response
Fall slows materially but persists.
Hold if evidence still developing; recalculate once sufficient.

### ALK-G013 — no detectable response
Expected response should have been visible.
Classify no-response without guessing cause.

### ALK-G014 — contradictory response
Increase followed by materially worse supported fall.
Flag contradiction and shorten retest / verify delivery.

### ALK-G015 — over-response
Rise stronger than expected.
Do not simply reverse the previous change.

### ALK-G016 — overshoot
Latest actual reading crosses upper target boundary.
Stop intentional upward movement.

### ALK-G017 — interrupted change
9 → 10 mL/day, then 10 → 11 before first is assessable.
First = interrupted, not failed.

### ALK-G018 — three rapid manual changes
Preserve all events.
Hold latest if safe until clean evidence develops.

### ALK-G019 — immediate known correction
Normalize actual correction contribution in underlying trend.

### ALK-G020 — staged correction
Normalize actual individual delivery schedule, not a three-day assumption.

### ALK-G021 — routine known water change negligible
Predicted Alk step <0.10 dKH.
Segment may remain.

### ALK-G022 — material known water change
Normalize measured/credible Alk step.

### ALK-G023 — material unknown water change
Break/confound Alk consumption segment.

### ALK-G024 — suspicious latest result disproved
Repeat returns to expected series.
Retain original raw value but exclude it with reason.

### ALK-G025 — suspicious latest result confirmed
Repeat confirms new level.
Treat as real shift.

### ALK-G026 — negative consumption small/uncertain
Hold.
Do not derive dose reduction.

### ALK-G027 — negative consumption materially unexplained
Hold ordinary consumption logic and flag model mismatch.

### ALK-G028 — negative consumption, above range and rising
Mass balance is materially negative/uninterpretable.
Hold established maintenance, increase urgency/retest, do not invent a protective maintenance reduction.

### ALK-G029 — stable low, upward return plan
Temporary dose = maintenance + deliberate movement component.

### ALK-G030 — downward return limited by consumption
Requested decline faster than zero-dose biology can achieve.
Report longer duration.

### ALK-G031 — first aim-point crossing
Stop temporary movement on first reach/pass.
Do not wait for second confirmation while continuing the temporary dose.

### ALK-G032 — second arrival confirmation
Maintenance holds in arrival zone.
Plan confirmed complete.

### ALK-G033 — potency observation clean
Controlled dose delta with adequate pre/post slopes yields valid \(P_i\).

### ALK-G034 — potency observation too small
Dose delta signal below threshold.
No potency learning.

### ALK-G035 — potency across batch change
Reject pooling.

### ALK-G036 — three consistent potency observations
Promote according to ALK-020 if all criteria met.

### ALK-G037 — potency large discrepancy
Do not silently switch on one extreme observation.

### ALK-G038 — old bracket conflicts with growing demand
Bracket warns but does not silently veto supported current increase.

### ALK-G039 — target range changed
Current position reclassifies.
Consumption/potency unchanged.
History unchanged.


### ALK-G039A — intervention too small to attribute, current dose holds
Expected intervention response is ≤ \(1.28\sigma_{pre}\).
Classify prior intervention `NOT_ATTRIBUTABLE_SMALL_SIGNAL`.
New clean post-change evidence gives non-zero observed lean but zero supported slope.
Recommendation HOLD.
Full card explains both the small-signal attribution limit and the current-dose conclusion.

### ALK-G039B — intervention too small to attribute, current dose still deficient
Expected intervention response is ≤ \(1.28\sigma_{pre}\).
Prior intervention remains `NOT_ATTRIBUTABLE_SMALL_SIGNAL`.
New clean post-change evidence produces non-zero supported falling slope.
Recommendation is calculated from the current supported slope.
Do not keep waiting for attribution of the prior intervention.

### ALK-G040 — deterministic replay
Same event ledger + config + asOf returns same result.

---


# PART III — ADVERSARIAL AUDIT ROUND 1

**Status:** Completed against Parts I–III as currently written.  
**Inputs:** synthetic fully specified histories + V1 reef-chemistry behaviour + V1 wizard/surface behaviour.  
**Excluded by owner decision:** personal tank-history replay, because historical dose/intervention records are incomplete and therefore cannot honestly test the controller.

The purpose of this audit is not to prove the canon correct.

It is to find interactions where individually sensible rules produce an unintended combined result.

---

## AUDIT-001 — Supported-slope sizing predicts a residual slope

### History

Day 0: 8.60 dKH  
Day 2: 8.30 dKH  
Day 4: 8.00 dKH

Current dose:

\[
D=9.0\ mL/day
\]

Selected potency:

\[
P=0.0693\ dKH/mL
\]

### Observed trend

Theil–Sen:

\[
S_{observed}=-0.150\ dKH/day
\]

For times 0, 2, 4:

\[
S_{xx}=8
\]

With the 0.10 dKH point uncertainty floor:

\[
\sigma_S=
\frac{0.10}{\sqrt8}
=
0.03536\ dKH/day
\]

Supported slope:

\[
S_{supported}
=
-0.150
+
1.28(0.03536)
=
-0.10475\ dKH/day
\]

Supported dose increment:

\[
\Delta D
=
\frac{0.10475}{0.0693}
=
1.51\ mL/day
\]

Rounded to 0.1 mL/day:

\[
D_{recommended}=10.5\ mL/day
\]

Actual added supply from the rounded change:

\[
0.0693\times1.5
=
0.10395\ dKH/day
\]

Therefore predicted post-change slope is:

\[
S_{pred,post}
=
-0.150+0.10395
=
-0.04605\ dKH/day
\]

### Finding

The intervention should **not** be judged against zero at the first response test.

The correct comparison is against approximately −0.046 dKH/day.

This finding produced `ALK-PREDICTED-POST-SLOPE-001`.

---

## AUDIT-002 — Flat after the above change is not “no response”

Using AUDIT-001:

Predicted post slope:

\[
-0.046\ dKH/day
\]

Suppose the first 48-hour interval is approximately flat:

\[
S_{post}\approx0
\]

The observed response is **stronger than the central prediction**, but it is directionally favourable and may remain well inside response uncertainty.

It must not be labelled `NO_DETECTABLE_RESPONSE`.

### Finding

“No response” means failure to produce the expected **change in trajectory**, not failure to make the absolute Alk number rise.

This validates the revised A2 rule.

---

## AUDIT-003 — Persistent slow drift exposes a second-gate bug

### History

Eight clean Alk clusters every two days across 14 days:

\[
S_{observed}=-0.020\ dKH/day
\]

With the 0.10 dKH point floor and the longer time leverage:

\[
\sigma_S\approx0.00772\ dKH/day
\]

Supported slope:

\[
S_{supported}
=
-0.020+1.28(0.00772)
\approx
-0.0101\ dKH/day
\]

At:

\[
P=0.0693\ dKH/mL
\]

supported adjustment:

\[
\Delta D
\approx
0.146\ mL/day
\]

A 0.1 mL/day pump could represent a 0.1 mL/day increase.

Its immediate 48-hour effect would be small:

\[
0.1\times0.0693\times2
=
0.0139\ dKH
\]

which is far below one 0.10 dKH point-uncertainty floor.

### Old combined-rule failure

If ALK-045 required every recommendation to become detectable inside the very next 48-hour interval, the app would HOLD.

Fourteen days later it could calculate the same persistent drift and HOLD again.

The supported slow-drift pathway would become functionally unreachable for small real demand mismatches.

### Resolution

Remove the second detectability gate.

Once a slow drift has earned action:
- a non-zero adjustment at the recommendation precision is allowed;
- response may require multiple tests to assess.

This produced `ALK-MINIMUM-ACTION-001`.

---

## AUDIT-004 — Uncertainty-limited movement remains directional

### History

Day 0: 8.50  
Day 2: 8.42  
Day 4: 8.34

Observed slope:

\[
S=-0.040\ dKH/day
\]

\[
\sigma_S=0.03536
\]

\[
|S_{supported}|
=
\max(0,0.040-1.28(0.03536))
=
0
\]

### Required result

```text
observedTrajectory: FALLING
observedSlope: -0.040 dKH/day
supportedSlope: 0.000 dKH/day
recommendation: HOLD
reason: UNCERTAINTY_LIMITED
```

Not:

```text
trajectory: STABLE
```

The full Alk card must show both observed and supported slope.

---

## AUDIT-005 — More time makes the same small slope actionable

Suppose the true observed slope remains:

\[
-0.020\ dKH/day
\]

Across a short four-day segment, that movement may remain uncertainty-limited.

Across a clean fourteen-day segment, time leverage lowers \(\sigma_S\), causing a non-zero supported slope.

### Finding

The controller naturally becomes more willing to act on a persistent weak trend without introducing a separate “slow trend multiplier”.

This is intended behaviour.

---

## AUDIT-006 — Ordinary 25% cap can leave a predicted residual

Suppose:

\[
S_{observed}=-0.300\ dKH/day
\]

and a clean three-point trend gives approximately:

\[
S_{supported}=-0.255\ dKH/day
\]

At:

\[
P=0.0693
\]

the supported raw increase is roughly:

\[
3.68\ mL/day
\]

From 9.0 mL/day:

\[
25\% = 2.25\ mL/day
\]

Ordinary recommendation is capped near:

\[
11.25\ mL/day
\]

before pump rounding.

Physical supply increase:

\[
2.25\times0.0693
=
0.156\ dKH/day
\]

Predicted post slope remains approximately:

\[
-0.144\ dKH/day
\]

### Finding

A capped intervention is not expected to stabilise fully on the first step.

Post-change response must compare with the **capped predicted slope**, not with zero or the uncapped ideal.

---

## AUDIT-007 — 50% relaxation must use risk forecast, not action-shrunk slope

Supported slope is intentionally pulled toward zero.

If boundary-risk forecasting used \(S_{supported}\), it could make a dangerous trajectory appear slower than the actual robust observation.

### Resolution

- dose sizing → \(S_{supported}\);
- sufficiently established safety/boundary forecast → \(S_{observed}\).

This produced `ALK-FORECAST-SLOPE-001`.

---

## AUDIT-008 — Slight target-range excursion does not unlock 50%

Example:

Target range:
8.2–8.8 dKH.

Current:
8.81 dKH.

Even if moving meaningfully, being 0.01 dKH above the preferred range does not itself unlock the exceptional 50% step.

The exception requires:
- confirmed rapid movement;
- plus actual or forecast outer operating-bound risk.

### Finding

Target band and outer operating bounds remain independent.

This validates C2.

---

## AUDIT-009 — Outer-bound rapid case

Example:

Current:

\[
7.20\ dKH
\]

Observed confirmed 24-hour slope:

\[
-0.50\ dKH/day
\]

Outer lower bound:

\[
7.00
\]

Observed crossing time:

\[
T=
\frac{7.20-7.00}{0.50}
=
0.4\ day
\]

The rapid/outer-bound exception is eligible.

The ordinary 25% cap may relax to at most 50%, but:
- physical 0.50 dKH/day rail still wins;
- actual rounded command defines the predicted post slope;
- retest is shortened.

---

## AUDIT-010 — Zero / near-zero current dose exposes a cap-definition gap

The percentage cap is well-defined at ordinary established doses.

At:

\[
D_{current}=0
\]

25% of current dose is zero.

A strict percentage rule would make it impossible to start maintenance dosing at all.

At a tiny non-zero dose, e.g.:

\[
D=0.1\ mL/day
\]

25% may be below pump resolution and can similarly trap the controller.

### Finding

Part III still needs an explicit **baseline/startup rule** for:
- current dose = zero;
- current dose so small that the percentage cap is smaller than one recommendation-precision step.

This is a genuine remaining policy gap, not solved by C2.

**Status:** RESOLVED by `ALK-STEP-CAP-001`.

---

## AUDIT-011 — Pump rounding can erase a supported correction

If:

\[
\Delta D_{continuous}=0.04\ mL/day
\]

and pump resolution is:

\[
0.10\ mL/day
\]

rounding may return the same current dose.

Required result:
- HOLD;
- reason = MAINTENANCE_ROUNDS_TO_CURRENT_DOSE;
- continue evidence collection.

Do not force a 0.1 mL step merely to avoid returning HOLD unless the rounding policy explicitly selects directional ceiling rather than nearest resolution.

### Finding

The final Alk canon must pin the **rounding direction policy**:
- nearest;
- toward zero;
- or directional-away-from-zero.

**Status:** RESOLVED by `ALK-ROUNDING-001`.

---

## AUDIT-012 — Two-point rapid override has larger slope uncertainty

24-hour readings:

7.50 → 7.20 dKH

Observed:

\[
S=-0.300\ dKH/day
\]

Two-point slope uncertainty:

\[
\sigma_S
=
\frac{\sqrt{0.10^2+0.10^2}}{1}
=
0.1414\ dKH/day
\]

Supported:

\[
S_{supported}
=
-0.300+1.28(0.1414)
\approx
-0.119\ dKH/day
\]

### Finding

Rapid override permits earlier action, but uncertainty-aware sizing remains conservative.

“Rapid” does not mean “act on the entire raw one-day slope.”

This is intended.

---

## AUDIT-013 — Formal response needs explicit uncertainty and non-overlapping windows

The initial draft attempted to compare the pre-change slope with the first post-change interval.

That would reuse the Day-0 baseline across the two estimates and make their errors correlated.

### Resolution

Formal causal response classification now:
- uses non-overlapping pre/post slope windows;
- normally begins when a genuine post-change slope exists, commonly Day +2 → Day +4;
- uses:

\[
\sigma_{response}
=
\sqrt{
\sigma_{pre}^{2}
+
\sigma_{post}^{2}
}
\]

with:

\[
ALK\_RESPONSE\_K=1.28
\]

and the exact response classes in `ALK-RESPONSE-CLASSIFIER-001`.

Day +2 remains an early position/safety/first-interval check and does not receive the formal six-way classifier.

**Status:** RESOLVED.

---

## AUDIT-014 — “No detectable response” must require expected detectability

If a tiny valid maintenance adjustment is expected to change slope by only:

\[
0.007\ dKH/day
\]

it may take many days before the effect is distinguishable.

A 48-hour test showing no visible change is not `NO_DETECTABLE_RESPONSE`.

Required:
- continue OBSERVING;
- accumulate evidence.

This is now protected by ALK-045.

---

## AUDIT-015 — Known material water change can be normalized

Suppose:
- tank Alk immediately before WC = 8.4 dKH;
- replacement water = 9.4 dKH;
- water change fraction = 10%.

Expected step:

\[
\Delta A_{WC}
=
0.10(9.4-8.4)
=
+0.10\ dKH
\]

This meets the current Alk materiality threshold.

If replacement chemistry is trusted:
- normalize the +0.10 step for underlying trend;
- retain the raw reading;
- retain the water-change event.

This is coherent.

---

## AUDIT-016 — Unknown water change lacks a fully deterministic materiality rule

If replacement Alk is unknown, the canon currently says to be conservative where a plausible mismatch could create ≥0.10 dKH effect.

But “plausible mismatch” is not yet a deterministic input.

### Finding

Part III needs one exact rule, e.g.:
- unknown WC ≥ fixed fraction breaks the Alk segment;
- or require replacement Alk for any WC above a smaller threshold;
- or use a bounded configured replacement-water uncertainty.

Without this, implementation can diverge.

**Status:** RESOLVED by `ALK-WATERCHANGE-UNKNOWN-001`.

---

## AUDIT-017 — Water change plus dose change

If a material unknown water change occurs during the post-dose response interval:
- post-change response becomes CONFOUNDED;
- do not call the dose change failed;
- do not use the interval for potency learning.

If the WC effect is known and normalized:
- trend response may remain usable;
- potency learning should still be conservative because the comparison now contains an additional modelled event.

### Finding

Trend eligibility and potency-learning eligibility remain correctly separate.

---

## AUDIT-018 — Correction during post-dose assessment

A known correction delivered after a maintenance change can be normalized from trend.

However, the interval should normally be **ineligible for potency learning**, because two controlled inputs changed simultaneously.

The maintenance intervention may still be assessed if normalization uncertainty remains acceptable.

### Finding

“Can normalize for trend” does not mean “clean enough for potency calibration.”

This distinction must remain explicit.

---

## AUDIT-019 — Negative consumption high and rising

Known maintenance supply:

\[
0.60\ dKH/day
\]

Observed rise:

\[
+0.80\ dKH/day
\]

Arithmetic:

\[
C=0.60-0.80=-0.20
\]

Required:
- mass balance = materially unexplained/non-physical;
- established maintenance = HOLD;
- high/rising status shortens retest / increases verification urgency;
- do not create a protective maintenance reduction from the broken arithmetic.

This validates D1.

---

## AUDIT-020 — Temporary upward return component during unexplained rise

Different case from AUDIT-019:

- established maintenance is known;
- temporary return-plan component is active;
- Alk is now unexpectedly high/rising.

The temporary movement component may be stopped because the plan's movement objective no longer justifies continued upward input.

Established maintenance itself is not recalculated from negative consumption.

### Finding

D1 does not require continuing an obviously inappropriate temporary correction.

---

## AUDIT-021 — Return plan reaches midpoint once

Target:
8.2–8.8 dKH.

Aim:
8.5 dKH.

Upward return plan latest actual measurement:
8.52 dKH.

Required:
- stop temporary upward component now;
- resume established/current maintenance estimate;
- schedule confirmation;
- do not continue temporary dose waiting for a second 8.4–8.6 reading.

This preserves the V1 `passed` insight.

---

## AUDIT-022 — Downward return plan cannot outrun consumption

If maintenance demand is:

\[
0.30\ dKH/day
\]

then with Alk maintenance dose reduced to zero, the fastest dosing-only decline is approximately:

\[
-0.30\ dKH/day
\]

A requested −0.50 dKH/day decline is not physically achievable by dosing reduction alone.

Required:
- zero is the lower dose floor;
- report the slower achievable plan;
- never recommend negative dosing.

---

## AUDIT-023 — Old empirical bracket vs increased current demand

Historical:
- 9 mL/day once held Alk;
- 10 mL/day once caused a rise.

Current high-quality recent data now supports:
- ~11 mL/day maintenance.

If biological demand has increased, the old bracket must not silently clamp the new result to ≤10.

Required:
- bracket conflict warning;
- evaluate comparability / demand regime;
- supported current evidence may win.

This validates the V2 restructuring of bracketing.

---

## AUDIT-024 — Potency candidate across a solution-batch change

Pre trend belongs to Batch A.
Post trend belongs to Batch B.

Even if arithmetic gives a clean:

\[
P_i
\]

the candidate is invalid for one-context potency learning.

Required:
- preserve the observation diagnostically;
- do not pool it into learned potency.

---

## AUDIT-025 — Consumption changes across a dose intervention

A coral-growth/demand regime changes materially during the pre/post comparison.

Observed dose response therefore does not isolate potency.

Required:
- response can still describe what happened;
- potency candidate excluded/down-weighted according to evidence;
- do not force the discrepancy into learned potency.

This is why potency is slow-moving and consumption is allowed to change.

---

## AUDIT-026 — Dose change interrupted before assessment

9 → 10 mL/day.

Before sufficient response evidence:
10 → 11 mL/day.

Required:
- first intervention = INTERRUPTED;
- not failed;
- not successful;
- not strong potency evidence;
- new intervention starts from actual 10 → 11 transition and current baseline data.

This reproduces one of V1's hard-won behaviours without branch-order dependence.

---

## AUDIT-027 — Target entry is not stability

Alk starts below range and falling.

Maintenance change produces:
8.10 → 8.25 → 8.40 while still rising.

Latest position is now IN_RANGE.

Required:
- do not declare maintenance settled solely from target entry;
- evaluate post-change slope;
- forecast upper edge;
- automatic objective remains zero slope.

---

## AUDIT-028 — Same-time measurement and dose change with unknown order

If an 08:00 Alk reading and 08:00 dose change exist but the record cannot determine whether the sample was taken before or after the change:

Required:
- do not automatically use that reading as the time-zero pre-change anchor;
- intervention baseline relation = ambiguous;
- response confidence/evidence degrades or requests clarification/new test.

Deterministic replay must preserve the ambiguity.

---

## AUDIT-029 — Backdated reading changes current analysis but not historical advice

A valid old measurement is inserted later.

Required:
- current/recomputed analytical trend can change;
- historical recommendation shown to the user at the time remains the historical recommendation;
- new retrospective analysis has a new assessment id/version.

This preserves V1 history truthfulness.

---

## AUDIT-030 — Target-range change must not alter consumption

Changing target:
8.2–8.8 → 8.4–9.0.

Same measurements, dose and potency.

Required:
- position classification may change;
- return-plan eligibility/destination may change;
- consumption, potency and observed slope do not change.

---

# PART III — ADVERSARIAL AUDIT FINDINGS

Round 1 discovered four material specification gaps plus three resolved interactions.

## Resolved interaction R1 — predicted response must use final recommendation

Canonical:
`ALK-PREDICTED-POST-SLOPE-001`.

Use observed pre-change slope + actual physical effect of the **final capped/rounded dose change**.

## Resolved interaction R2 — slow-drift action cannot require one-test detectability

Canonical:
`ALK-MINIMUM-ACTION-001`.

Detectability controls response assessment, not whether an already-supported slow correction may be issued.

## Resolved interaction R3 — safety forecast does not use uncertainty-shrunk action slope

Canonical:
`ALK-FORECAST-SLOPE-001`.

Use established observed slope for short-horizon risk forecast; supported slope only sizes maintenance action.

## Resolved gap O1 — zero / near-zero current maintenance dose

Resolved by `ALK-STEP-CAP-001`.

When:

\[
D_{current}<4\times recommendationPrecisionMlPerDay
\]

the 25% cap is smaller than one recommendation-precision step and is disabled.

Evidence and physical-effect rails remain active.

## Resolved gap O2 — recommendation rounding direction

Resolved by `ALK-ROUNDING-001`.

- nearest pump increment;
- exact ties toward current dose;
- post-rounding hard-constraint recheck;
- if the rounded recommendation returns to the current dose → HOLD / MAINTENANCE_ROUNDS_TO_CURRENT_DOSE.

## Resolved gap O3 — exact intervention response band

Resolved by:
- `ALK-RESPONSE-CLASSIFIER-001`;
- `ALK-RESPONSE-ATTRIBUTION-001`;
- `ALK-RESPONSE-DETECTABILITY-001`.

Formal response uses non-overlapping slope windows and exact sigma-based classes.

## Resolved gap O4 — unknown-water-change threshold

Resolved by `ALK-WATERCHANGE-UNKNOWN-001`.

Unknown replacement Alk uses:
- fixed assumed mismatch envelope = 2.0 dKH;
- <5% WC may remain in segment without invented subtraction;
- ≥5% WC breaks the Alk segment.

The ledger explicitly records this as an intentional V2 replacement of V1's blanket “leave water changes in trend” rule.

---

# PART III — V1 WIZARD / CARD COVERAGE AUDIT — ALK

This section audits the **wizard/surface canon in addition to reef-chemistry.md**.

The purpose is to preserve hard-won V1 user behaviour even where V2 replaces the domain-state architecture.

## V1 reference-card mapping

| V1 card | V1 meaning | V2 mapping / disposition |
|---|---|---|
| 24.1 | In range, maintenance holding | IN_RANGE + observed stable + no active intervention → HOLD. KEEP. |
| 24.2 | In range but falling; maintenance change suggested | IN_RANGE + FALLING + nonzero supported slope → increase from supported slope. KEEP / restructure. |
| 24.3 | Stable below range; dose matches | BELOW_RANGE + STABLE + maintenance matched → HOLD + OFFER_RETURN_PLAN. KEEP. |
| 24.4 | Too soon after dose change | Active maintenance intervention + OBSERVING / not assessable → HOLD. KEEP, but first 48 h now has explicit response semantics. |
| 24.5 | Insufficient readings but position known | Position from latest measurement + trajectory evidence insufficient → TEST_AGAIN. KEEP. |
| 24.6 | Change working | After formal post-change slope exists: active intervention + EXPECTED/PARTIAL favourable response → HOLD while evidence develops. KEEP / formalise. |
| 24.7 | Still falling despite raise | Must compare with predicted post slope: may be EXPECTED residual, PARTIAL, NO_RESPONSE or CONTRADICTORY. REPLACE single V1 interpretation. |
| 24.8 | No response after change | `NO_DETECTABLE_RESPONSE` only once expected effect should be detectable. KEEP / formalise. |
| 24.9 | Very low / correction card | `ALK-OUTER-BOUND-ACTION-001`: outer-bound breach triggers urgent temporary safety return to the buffered safety destination inside the outer envelope while permanent maintenance remains separately derived. KEEP urgency / restructure mechanism. |
| 24.10 | Correction running | Active RETURN_PLAN / correction execution. KEEP / restructure. |
| 24.11 | Correction stalled | Active return/correction + NO_RESPONSE/CONTRADICTORY or expiry logic. KEEP / formalise. |
| 24.12 | Blocked setup/potency | Configuration/potency refusal with position still reported. KEEP. |
| 24.13 | Reached aim once, needs confirm | Stop temporary movement on first reach/pass; confirmation pending. KEEP / clarify. |
| 24.14 | Correction finished, maintenance restored | Return plan complete + maintenance resumed/confirmed. KEEP. |
| 24.15 | Correction due | Intervention phase ASSESSMENT_DUE. KEEP. |
| 24.16 | Correction overrun | Intervention EXPIRED/OVERRUN. KEEP. |
| 24.17 | Recovering without recent change | Out-of-range position + trajectory toward range + no intervention. KEEP as presentation projection, not domain state. |
| 24.18 | Worsening without recent change | Out-of-range + trajectory away + supported maintenance mismatch. KEEP as presentation projection. |
| 24.19 | Fell short | Assessed intervention + residual supported mismatch. KEEP / formalise. |
| 24.20 | Overshot | Latest measured position crossed relevant boundary after intervention. KEEP. |
| 24.21 | One reading after change insufficient | KEEP / strengthen: Day +2 is an early position/safety/first-interval check with `AWAITING_FORMAL_POST_SLOPE`; formal response waits for a non-overlapping post-change slope, ordinarily at Day +4. |
| 24.22 | Still rising after dose cut | Compare with predicted trajectory; may be expected residual, partial, no response or contradiction. REPLACE single V1 interpretation. |
| 24.23 | Far out; gradual correction plan | Stable out-of-range → opt-in return plan with duration/pace. KEEP / align terminology. |
| 24.24 | Negative consumption hold | Hold maintenance; no speculative cause; repeated mismatch escalates verification/urgency. KEEP / strengthen. |
| 24.25 | Staged plan due test | RETURN_PLAN + ASSESSMENT_DUE. KEEP. |
| 24.26 | Multiple post-change readings inconclusive | Intervention response INCONCLUSIVE / uncertainty limited. KEEP. |
| 24.27 | Change worked but stable outside range | Maintenance intervention successful + stable out of range → HOLD + OFFER_RETURN_PLAN. KEEP. |

## V1 wizard-state mapping

V1's state labels are not recreated as one domain enum.

Their useful behaviour maps to combinations of V2 primitives:

| V1 state/branch family | V2 representation |
|---|---|
| blocked | configuration/evidence refusal + position retained |
| emergency | `ALK-OUTER-BOUND-ACTION-001`: explicit ALERT_LOW/ALERT_HIGH safety-return pathway |
| correction-stalled | RETURN_PLAN/CORRECTION + NO_RESPONSE/CONTRADICTORY/EXPIRED |
| correction-due | intervention phase ASSESSMENT_DUE |
| correction-done | return-plan stop/confirmation/completion |
| correcting-dose | active deliberate movement intervention |
| correcting logged one-off | known correction event + normalized analytical series |
| settling staged plan | active return plan + OBSERVING |
| due staged plan | return plan + ASSESSMENT_DUE |
| worked steady in range | maintenance intervention EXPECTED + observed stable + IN_RANGE |
| worked steady out | maintenance intervention EXPECTED + observed stable + OUT_OF_RANGE + offer return |
| fell-short | intervention assessed + residual supported mismatch |
| overshot | latest actual position crossed target boundary after intervention |
| settling plain dose | maintenance intervention + OBSERVING |
| suggested different dose | no intervention + supported maintenance mismatch + recommendation |
| suggested correction | stable out-of-range + return-plan offer |
| recovering | trajectory toward range without current deliberate intervention |
| worsening | trajectory away from range without current deliberate intervention |
| off-target | position outside range; maintenance and return-plan axes determine action |
| idle / dose-right-level-off | stable out-of-range maintenance match |
| idle / nothing | stable/in-range or no actionable conclusion |

### V1 branch-order defects intentionally removed

V2 does not rely on:
- first matching `worked` before `fell-short`;
- correction branches shadowing ordinary branches;
- active plan fixtures to make states reachable;
- duplicate state names with different physical meaning.

Equivalent presentation may still be produced, but only **after** domain state is derived.

---

# PART III — V1 ALK COVERAGE STATUS

The Alk audit now explicitly covers both major V1 behavioural sources:

### `reef-chemistry.md`
Covered themes:
- maintenance/consumption math;
- correction vs maintenance;
- ranges;
- rail;
- cadence/window;
- noise;
- settle/evidence;
- dose sizing;
- corrections;
- movement/stability;
- refusals;
- testing;
- negative consumption;
- position;
- return plans;
- coupling touchpoints;
- bracketing.

### Wizard / surfaces / app-contract canon
Covered themes:
- wizard state families;
- post-change states;
- correction states;
- 27 reference cards;
- single-source surface rule;
- recommendation vs implementation;
- history truthfulness;
- parity;
- wording-relevant domain distinctions.

### Part III freeze status

Completed for **Alk V2 Freeze 1**:
- written V1 Alk chemistry behaviours mapped;
- V1 wizard/state/card behaviours mapped;
- O1–O4 resolved;
- ordinary movement unified under the supported-slope evidence model;
- exact response-classification formulas locked;
- Day-2 early check separated from formal Day-4+ response attribution;
- immutable intervention prediction snapshots locked;
- external/unlogged dose-change handling locked;
- potency learning made deterministic;
- Worked Numerical Golden Suite Round 1 completed;
- Worked Numerical Golden Suite Round 2 completed;
- duplicate rule-ID lint passed;
- unresolved-placeholder lint passed;
- response-class overlap check passed;
- final cross-rule contradiction audit passed.

Not claimed by this behavioural freeze:
- a line-by-line diff against the live app repository;
- verification that current production code already implements V2;
- migration execution.

Those are implementation-phase tasks. They do not alter the authority of the frozen behavioural specification.

Personal tank history is intentionally excluded from this coverage phase by owner decision because it lacks sufficient historical dose/intervention records for honest controller replay.



## ALK-RESPONSE-PRE-EVIDENCE-001 — Pre-change evidence required for causal attribution

Formal intervention-response attribution requires an interpretable pre-change slope.

Eligible pre-change bases are:

### Ordinary basis

The pre-change trend satisfies `ALK-MOVEMENT-001`.

### Rapid basis

The intervention followed a valid `ALK-RAPID-001` decision.

A two-point rapid pre-slope may be used with:

\[
\sigma_{pre}
=
\frac{\sqrt{\sigma_1^2+\sigma_2^2}}{\Delta t_{days}}
\]

provided the rapid readings satisfy the rapid rule, timestamps are sufficiently precise, and no hard confounder exists.

### Otherwise

If dose changes after a two-point/non-rapid or otherwise insufficient pre-history:

```text
responseAttribution = PRECHANGE_EVIDENCE_INSUFFICIENT
```

The engine does **not** attempt causal classification for that intervention.

This is terminal for attribution of that specific change but does not block current position or future maintenance analysis once the new-dose regime accumulates sufficient evidence.

---

## ALK-RESPONSE-CLASSIFIER-001 — Formal maintenance-intervention response

Formal response classification answers:

> Did this dose change alter the alkalinity trajectory in the way predicted?

It is separate from:
- current position;
- current maintenance balance;
- overshoot;
- return-plan completion.

### Formal evidence uses non-overlapping slope windows

To avoid correlated uncertainty from reusing the Day-0 anchor in both slopes:

- the formal **pre-change slope** uses eligible clean pre-change measurements up to the intervention boundary;
- the formal **post-change slope** uses only genuine post-change measurements and does **not** reuse the Day-0 pre-change anchor.

Under the normal 48-hour cadence, the first ordinary formal post slope commonly becomes available from:

Day +2 → Day +4.

The Day +2 test remains an early position/safety checkpoint and may expose:
- rapid change;
- outer-bound risk;
- obvious delivery failure;
- another explicit safety condition.

It does not receive a pseudo-precise six-way formal response classification from overlapping data.

### Definitions

Let:

\[
\Delta S_{expected}
=
P_{selected}
(
D_{new}-D_{old}
)
\]

Let:

\[
u=
sign(\Delta S_{expected})
\]

For a non-zero maintenance intervention:

\[
R_{exp}
=
|\Delta S_{expected}|
\]

Observed trajectory shift:

\[
\Delta S_{observed}
=
S_{post}-S_{pre}
\]

Transform the observed shift into the intended intervention direction:

\[
\boxed{
R_{obs}
=
u\Delta S_{observed}
}
\]

Therefore:
- \(R_{obs}>0\): response moved in the intended direction;
- \(R_{obs}<0\): response moved opposite the intended direction.

Controller constant:

\[
\boxed{
ALK\_RESPONSE\_K=1.28
}
\]

This is a fixed-but-reviewable engineering constant, not chemistry and not a user setting.

For non-overlapping pre/post slope estimates:

\[
\sigma_{response}
=
\sqrt{
\sigma_{pre}^{2}
+
\sigma_{post}^{2}
}
\]

Response band:

\[
\boxed{
B=
1.28\sigma_{response}
}
\]

### Eligibility before classification

Apply:
1. `ALK-RESPONSE-PRE-EVIDENCE-001`;
2. `ALK-RESPONSE-ATTRIBUTION-001`;
3. `ALK-RESPONSE-DETECTABILITY-001`;

before the formal class boundaries.

If:
- the intervention is intrinsically too small to attribute → `NOT_ATTRIBUTABLE_SMALL_SIGNAL`;
- attribution is theoretically possible but current post evidence has not reached the required precision → `AWAITING_DETECTABILITY`;
- intervention is interrupted/confounded/expired → use that intervention state.

Only an eligible attributable response proceeds to the classifier below.

### Mutually deterministic response classes

#### CONTRADICTORY

\[
\boxed{
R_{obs}<-B
}
\]

The trajectory has detectably shifted opposite the intended intervention direction.

#### OVER_RESPONSE

\[
\boxed{
R_{obs}>R_{exp}+B
}
\]

There is a detectable intended-direction response exceeding the expected response by more than one response band.

#### PARTIAL

\[
\boxed{
R_{obs}>B
\quad\land\quad
R_{obs}<R_{exp}-B
}
\]

There is a detectable intended-direction response, but it falls more than one response band short of prediction.

If:

\[
R_{exp}-B\le B
\]

the PARTIAL interval is empty. The engine does not invent a partial category where the evidence cannot separate it.

#### EXPECTED

\[
\boxed{
R_{obs}>B
\quad\land\quad
|R_{obs}-R_{exp}|\le B
}
\]

The response is detectably in the intended direction and statistically compatible with the central prediction.

#### NO_DETECTABLE_RESPONSE

\[
\boxed{
|R_{obs}|\le B
\quad\land\quad
|R_{obs}-R_{exp}|>B
}
\]

The observed trajectory shift is not detectably different from zero and is also more than one response band away from the predicted response.

This category is impossible until the intervention itself is sufficiently detectable.

#### INCONCLUSIVE

All remaining eligible cases.

A particularly important INCONCLUSIVE overlap occurs when the observed response is:
- not detectably different from zero;
- but also not detectably different from the expected response.

The app must not choose “EXPECTED” or “NO RESPONSE” when the evidence genuinely cannot distinguish them.

### Orthogonal overshoot

`OVERSHOOT` is **not** one of these response classes.

A tank may simultaneously be:

```text
responseAttribution: EXPECTED
positionEvent: OVERSHOOT
```

The first statement says the trajectory responded as predicted.

The second says the measured level crossed a relevant position boundary.

They answer different questions.

### Current-dose decisions do not wait indefinitely for attribution

Once the post-change regime independently has enough evidence to estimate current supported slope, current maintenance logic may:
- HOLD;
- increase;
- decrease;

from the current regime even if the old intervention remains:
- AWAITING_DETECTABILITY;
- INCONCLUSIVE;
- NOT_ATTRIBUTABLE_SMALL_SIGNAL.

If a new maintenance action is implemented, the previous intervention closes as interrupted/unresolved as appropriate and the new intervention begins.

---

## ALK-RESPONSE-ATTRIBUTION-001 — Attribution may be impossible even when current maintenance is assessable

The engine separates two questions:

1. **Intervention attribution:** can the change in trajectory be confidently attributed to this specific dose change?
2. **Current maintenance balance:** does the tank on the current dose now show a supported maintenance mismatch?

Failure to answer question 1 does **not** block question 2.

Let:

\[
R_{exp}=|\Delta S_{expected}|
\]

and let the fixed pre-change slope uncertainty be:

\[
\sigma_{pre}
\]

Using:

\[
ALK\_RESPONSE\_K=1.28
\]

the smallest attribution band achievable even with arbitrarily precise future post-change evidence is:

\[
\boxed{
B_{minimum}=1.28\sigma_{pre}
}
\]

If:

\[
R_{exp}\le B_{minimum}
\]

then the intervention is classified:

```text
responseAttribution: NOT_ATTRIBUTABLE_SMALL_SIGNAL
```

Meaning:

> The expected effect of this individual dose change is too small, relative to uncertainty in the pre-change trajectory, to isolate confidently.

This is a terminal attribution conclusion for that intervention. The engine does not continue indefinitely trying to prove an effect it cannot statistically isolate.

### Current-dose assessment continues independently

Once the post-change regime has sufficient clean evidence, the engine still calculates:

- observed post-change slope;
- supported post-change slope;
- current maintenance balance;
- current recommendation.

Examples:

```text
responseAttribution: NOT_ATTRIBUTABLE_SMALL_SIGNAL
currentObservedSlope: -0.02 dKH/day
currentSupportedSlope: 0.00 dKH/day
currentMaintenanceBalance: NO_SUPPORTED_MISMATCH
recommendation: HOLD_CURRENT_DOSE
```

or:

```text
responseAttribution: NOT_ATTRIBUTABLE_SMALL_SIGNAL
currentObservedSlope: -0.08 dKH/day
currentSupportedSlope: -0.05 dKH/day
currentMaintenanceBalance: DEFICIT
recommendation: INCREASE_MAINTENANCE
```

The app must never remain stuck merely because the previous intervention cannot be causally isolated.

---

## ALK-RESPONSE-DETECTABILITY-001 — Awaiting response detectability

If:

\[
R_{exp}>1.28\sigma_{pre}
\]

then attribution is theoretically possible.

Required post-change slope uncertainty:

\[
\boxed{
\sigma_{post,required}
=
\sqrt{
\left(
\frac{R_{exp}}{1.28}
\right)^2
-
\sigma_{pre}^2
}
}
\]

While:

\[
\sigma_{post}>\sigma_{post,required}
\]

the response state is:

```text
responseAttribution: AWAITING_DETECTABILITY
```

This is not failure and not `NO_DETECTABLE_RESPONSE`.

The engine continues ordinary post-change testing until:
- the required attribution precision is reached;
- a safety/rapid/contradictory condition overrides;
- the intervention becomes confounded/interrupted;
- or the attribution horizon expires.

### Maximum attribution horizon

An intervention is not attributed indefinitely.

Maximum ordinary Alk attribution horizon:

\[
\boxed{14\ days}
\]

If attribution remains unresolved after 14 days:

```text
responseAttribution: UNRESOLVED_EXPIRED
```

The old intervention is closed for causal attribution.

Current maintenance balance continues to be assessed from the newest clean regime.

---

## ALK-CARD-ATTRIBUTION-001 — Small-signal attribution card is mandatory

The internal reason code may be:

```text
NOT_ATTRIBUTABLE_SMALL_SIGNAL
```

but **user-facing copy must not lead with "not attributable" or imply that the app failed**.

The card must lead with the answerable operational question:

> What is alkalinity doing on the current dose, and does that dose currently look right?

### Required card structure

The full Alk card must show:

1. current Alk value;
2. current observed post-change slope;
3. current supported post-change slope;
4. current maintenance conclusion;
5. a secondary explanation that the previous dose change was too small to isolate independently;
6. next test timing.

### Hold example

Semantic form:

> **Hold the current dose**
>
> The current readings do not support another maintenance change. The previous dose change was too small to isolate confidently from the uncertainty in the earlier alkalinity trend.
>
> Observed trend: −0.02 dKH/day  
> Supported trend: 0.00 dKH/day  
> Next test: in 2 days

### Residual-deficit example

Semantic form:

> **Alkalinity is falling on the current dose**
>
> The previous dose change was too small to measure independently, but the newer readings now show a supported maintenance deficit. The next recommendation is based on the current trend, not on trying to judge the old intervention.
>
> Observed trend: −0.08 dKH/day  
> Supported trend: −0.05 dKH/day

Exact production wording belongs to Part IX, but this semantic content is mandatory and must ship with the state.

### Surface rule

This attribution explanation is mandatory on the **full Alk card** whenever the reason code is `NOT_ATTRIBUTABLE_SMALL_SIGNAL`.

Collapsed summaries and short reading receipts may remain concise, but they must not contradict the full-card conclusion.



# PART III — WORKED NUMERICAL GOLDEN SUITE — ROUND 1

**Status:** Canonical worked examples for implementation and regression tests.  
**Purpose:** Every scenario below must produce the stated arithmetic and state outcome from the same event history and configuration.  
**Default example configuration unless overridden:**

```text
selectedPotency = 0.0693 dKH/mL
Alk point uncertainty floor = 0.10 dKH
ALK_SLOPE_SUPPORT_K = 1.28
ALK_RESPONSE_K = 1.28
pumpResolution = 0.10 mL/day
ordinary dose-step cap = 25%
rapid/outer-bound maximum cap = 50%
Alk physical-effect rail = 0.50 dKH/day
ordinary Alk test cadence = 48 h
target range = 8.2–8.8 dKH
outer operating range = 7.0–11.0 dKH
```

Values shown below are rounded for explanation only. Implementations calculate at full precision.

---

## WG-ALK-001 — Supported fall produces a deliberately residual predicted fall

### Inputs

```text
Day 0   Alk 8.60   dose 9.0 mL/day
Day 2   Alk 8.30   dose 9.0
Day 4   Alk 8.00   dose 9.0
```

The three points are exactly linear:

\[
S_{observed}=-0.1500\ dKH/day
\]

Times are 0, 2, 4 days.

\[
\bar t=2
\]

\[
S_{xx}
=
(0-2)^2+(2-2)^2+(4-2)^2
=
8
\]

Residual scatter is zero, but the 0.10 dKH floor remains:

\[
\sigma_{point}=0.10
\]

\[
\sigma_S
=
\frac{0.10}{\sqrt8}
=
0.03536\ dKH/day
\]

Supported slope:

\[
S_{supported}
=
-0.1500
+
1.28(0.03536)
=
-0.10475\ dKH/day
\]

Supported dose increment:

\[
\Delta D
=
-\frac{S_{supported}}{P}
=
\frac{0.10475}{0.0693}
=
1.5115\ mL/day
\]

Continuous target:

\[
D_f
=
9.0+1.5115
=
10.5115\ mL/day
\]

25% cap:

\[
0.25(9.0)=2.25\ mL/day
\]

so the 1.5115 mL/day change is allowed.

Nearest 0.10 mL/day:

\[
D_{recommended}=10.5\ mL/day
\]

Actual rounded supply change:

\[
\Delta S_{rounded}
=
0.0693(10.5-9.0)
=
+0.10395\ dKH/day
\]

Predicted post-change slope:

\[
S_{pred,post}
=
-0.1500+0.10395
=
-0.04605\ dKH/day
\]

### Required outcome

```text
observedSlope = -0.1500
supportedSlope = -0.10475
recommendation = SET_MAINTENANCE_DOSE
recommendedDose = 10.5 mL/day
predictedPostSlope = -0.04605 dKH/day
```

The app must **not** predict zero.

---

## WG-ALK-002 — Observed fall but uncertainty-limited HOLD

### Inputs

```text
Day 0   8.50 dKH
Day 2   8.42
Day 4   8.34
dose    9.0 mL/day
```

Observed slope:

\[
S=-0.0400\ dKH/day
\]

Using the same three-point timing:

\[
\sigma_S=0.03536
\]

Support subtraction:

\[
1.28\sigma_S
=
0.04525
\]

Therefore:

\[
|S_{supported}|
=
\max(0,0.0400-0.04525)
=
0
\]

### Required outcome

```text
observedTrajectory = FALLING
observedSlope = -0.0400
supportedSlope = 0.0000
recommendation = HOLD_CURRENT_DOSE
reason = UNCERTAINTY_LIMITED
```

Forbidden result:

```text
trajectory = STABLE
```

The full Alk card shows observed and supported slopes.

---

## WG-ALK-003 — Slow persistent drift becomes actionable with time

### Inputs

Eight clean measurements every two days from Day 0 through Day 14 with an exact:

\[
S_{observed}=-0.0200\ dKH/day
\]

For times:

\[
0,2,4,6,8,10,12,14
\]

the point floor remains 0.10 dKH and:

\[
\sigma_S
\approx0.007715\ dKH/day
\]

Supported slope:

\[
S_{supported}
=
-0.0200+1.28(0.007715)
=
-0.010125\ dKH/day
\]

Dose increment:

\[
\Delta D
=
\frac{0.010125}{0.0693}
=
0.1461\ mL/day
\]

From 9.0 mL/day:

\[
D_f=9.1461
\]

Nearest recommendation precision step:

\[
D_{recommended}=9.1\ mL/day
\]

The 0.1 mL/day change produces only:

\[
0.1(0.0693)(2)
=
0.01386\ dKH
\]

over the next 48 hours.

That is smaller than the point uncertainty floor.

### Required outcome

The app **still recommends 9.1 mL/day**.

It must not add a second “must be visible in 48 h” gate.

Post-change attribution waits until enough signal accumulates.

---

## WG-ALK-004 — Baseline establishment from zero dose

### Inputs

```text
Day 0   8.70 dKH
Day 2   8.30
Day 4   7.90
current dose = 0.0 mL/day
pump resolution = 0.10 mL/day
```

Observed slope:

\[
S=-0.2000
\]

Three-point uncertainty:

\[
\sigma_S=0.03536
\]

Supported slope:

\[
S_{supported}
=
-0.2000+1.28(0.03536)
=
-0.15475
\]

Since:

\[
D_{current}=0<4(0.10)=0.40
\]

use:

```text
doseStepRegime = BASELINE_ESTABLISHMENT
```

The 25% cap is inactive.

Supported initial dose:

\[
D_f
=
\frac{0.15475}{0.0693}
=
2.2330\ mL/day
\]

Nearest recommendation precision step:

\[
D_{recommended}=2.2
\]

Physical input effect:

\[
2.2(0.0693)
=
0.15246\ dKH/day
\]

which is below the 0.50 dKH/day rail.

Predicted post slope:

\[
-0.2000+0.15246
=
-0.04754
\]

### Required outcome

```text
recommendedDose = 2.2 mL/day
```

Forbidden result:

```text
recommendedDose = 0
```

from applying 25% to zero.

---

## WG-ALK-005 — Exact rounding tie goes toward current dose

### Increase example

```text
currentDose = 9.0
continuousFeasibleDose = 10.25
pumpResolution = 0.10
```

Adjacent pump points:

\[
10.2,\quad10.3
\]

Both are 0.05 from the continuous target.

Distances from current dose:

\[
|10.2-9.0|=1.2
\]

\[
|10.3-9.0|=1.3
\]

Choose:

\[
\boxed{10.2}
\]

### Decrease mirror

```text
currentDose = 9.0
continuousFeasibleDose = 7.75
```

Tie candidates:

\[
7.7,\quad7.8
\]

Choose:

\[
\boxed{7.8}
\]

because it is closer to current dose.

Rounding therefore has no systematic increase/decrease bias.

---

## WG-ALK-006 — Rapid outer-bound risk unlocks 50% cap but not unlimited action

### Inputs

Current Alk:

\[
7.20\ dKH
\]

Confirmed one-day observed fall:

\[
S_{observed}=-0.800\ dKH/day
\]

Current dose:

\[
9.0\ mL/day
\]

Two-point slope uncertainty over one day:

\[
\sigma_S
=
\sqrt{0.10^2+0.10^2}
=
0.14142
\]

Supported slope:

\[
S_{supported}
=
-0.800+1.28(0.14142)
=
-0.61898
\]

Raw supported dose increase:

\[
\Delta D
=
\frac{0.61898}{0.0693}
=
8.9319\ mL/day
\]

Ordinary 25% cap:

\[
2.25\ mL/day
\]

Exceptional 50% cap:

\[
4.50\ mL/day
\]

Physical rail expressed as mL/day change:

\[
\frac{0.50}{0.0693}
=
7.2150\ mL/day
\]

Observed outer-bound crossing time:

\[
\frac{7.20-7.00}{0.800}
=
0.25\ day
\]

Rapid + outer-bound-risk exception is eligible.

The strictest relevant action constraint is therefore the 50% cap:

\[
\Delta D=4.50
\]

\[
D_{recommended}=13.5
\]

Actual added supply:

\[
4.50(0.0693)
=
0.31185
\]

Predicted post slope:

\[
-0.800+0.31185
=
-0.48815
\]

### Required outcome

```text
recommendedDose = 13.5 mL/day
predictedPostSlope = -0.48815 dKH/day
nextTest ≈ 24 h
```

The app does not pretend the capped intervention will fully stabilise the tank.

---

## WG-ALK-007 — Day +4 can be formally INCONCLUSIVE even when central response looks correct

Use WG-ALK-001.

Pre slope:

\[
S_{pre}=-0.150
\]

Pre uncertainty:

\[
\sigma_{pre}=0.03536
\]

Dose change:

\[
9.0\rightarrow10.5
\]

Expected slope shift:

\[
R_{exp}
=
0.0693(1.5)
=
0.10395
\]

Suppose genuine post-change tests are:

```text
Day +2
Day +4
```

and their two-point post slope is:

\[
S_{post}=-0.050
\]

Observed response magnitude in the intended direction:

\[
R_{obs}
=
-0.050-(-0.150)
=
0.100
\]

Two-point post uncertainty across two days:

\[
\sigma_{post}
=
\frac{\sqrt{0.10^2+0.10^2}}{2}
=
0.07071
\]

Response uncertainty:

\[
\sigma_{response}
=
\sqrt{0.03536^2+0.07071^2}
=
0.07906
\]

Response band:

\[
B
=
1.28(0.07906)
=
0.10119
\]

The central response is close to prediction, but:

\[
R_{obs}=0.100<B=0.10119
\]

so it is not detectably separated from zero.

It is also inside the expected-response band.

### Required outcome

```text
responseAttribution = INCONCLUSIVE
```

Not `EXPECTED`.

The current post-change maintenance regime may still be assessed independently when its own evidence is sufficient.

---

## WG-ALK-008 — Same central response becomes EXPECTED after more post-change evidence

Continue WG-ALK-007 with a Day +6 test such that the clean Day +2/+4/+6 Theil–Sen slope remains:

\[
S_{post}=-0.050
\]

For three equally spaced post points:

\[
\sigma_{post}=0.03536
\]

Then:

\[
\sigma_{response}
=
\sqrt{0.03536^2+0.03536^2}
=
0.05000
\]

\[
B
=
1.28(0.05000)
=
0.06400
\]

Observed response:

\[
R_{obs}=0.100
\]

Expected response:

\[
R_{exp}=0.10395
\]

Now:

\[
R_{obs}>B
\]

and:

\[
|0.100-0.10395|
=
0.00395
<
0.064
\]

### Required outcome

```text
responseAttribution = EXPECTED
```

No change in central biological response was required; the evidence simply became precise enough to support the classification.

---

## WG-ALK-009 — Exact response classes share one deterministic band

Assume a clean intervention with:

\[
S_{pre}=-0.250\ dKH/day
\]

\[
\Delta D=+3.0\ mL/day
\]

\[
R_{exp}
=
3.0(0.0693)
=
0.2079\ dKH/day
\]

Assume:

\[
\sigma_{pre}
=
\sigma_{post}
=
0.03536
\]

Then:

\[
\sigma_{response}=0.05000
\]

\[
B=1.28(0.05000)=0.06400
\]

### EXPECTED

If:

\[
S_{post}=-0.040
\]

then:

\[
R_{obs}=0.210
\]

and:

```text
EXPECTED
```

### PARTIAL

If:

\[
S_{post}=-0.150
\]

then:

\[
R_{obs}=0.100
\]

Since:

\[
0.064<R_{obs}<0.2079-0.064=0.1439
\]

result:

```text
PARTIAL
```

### NO_DETECTABLE_RESPONSE

If:

\[
S_{post}=-0.250
\]

then:

\[
R_{obs}=0
\]

and it is more than one response band from prediction:

```text
NO_DETECTABLE_RESPONSE
```

### CONTRADICTORY

If:

\[
S_{post}=-0.350
\]

then:

\[
R_{obs}=-0.100<-0.064
\]

result:

```text
CONTRADICTORY
```

### OVER_RESPONSE

If:

\[
S_{post}=+0.050
\]

then:

\[
R_{obs}=0.300
\]

and:

\[
0.300>0.2079+0.064=0.2719
\]

result:

```text
OVER_RESPONSE
```

---

## WG-ALK-010 — Small intervention is known in advance to be non-attributable

Pre-change uncertainty:

\[
\sigma_{pre}=0.03536
\]

Best possible future response band:

\[
B_{minimum}
=
1.28(0.03536)
=
0.04525
\]

Dose change:

\[
+0.30\ mL/day
\]

Expected response:

\[
R_{exp}
=
0.30(0.0693)
=
0.02079
\]

Since:

\[
0.02079<0.04525
\]

the intervention can never be isolated from the pre-change trajectory with this attribution model.

### Required outcome immediately

```text
responseAttribution = NOT_ATTRIBUTABLE_SMALL_SIGNAL
```

Do not spend repeated test cycles trying to prove the individual effect.

### Current-dose branch A

If later current-regime evidence gives:

```text
observedSlope = -0.02
supportedSlope = 0
```

then:

```text
recommendation = HOLD_CURRENT_DOSE
```

User-facing headline:

> Hold the current dose

### Current-dose branch B

If later current-regime evidence gives:

```text
observedSlope = -0.08
supportedSlope = -0.05
```

then calculate the next maintenance recommendation from the **current supported slope**.

User-facing headline:

> Alkalinity is falling on the current dose

The word **“still” is forbidden** here because attribution of continuity to the previous intervention has not been established.

---

## WG-ALK-011 — Known material water change is normalized

Immediately before water change:

\[
A_{tank}=8.40
\]

Replacement:

\[
A_{replacement}=9.40
\]

Changed fraction:

\[
f=0.10
\]

Expected Alk step:

\[
\Delta A
=
0.10(9.40-8.40)
=
+0.10\ dKH
\]

This meets the Alk materiality floor.

### Required outcome

```text
waterChangeEffect = MATERIAL_KNOWN
normalization = -0.10 dKH from subsequent analytical points
raw measurements preserved = true
event preserved = true
```

The engine does not pretend the +0.10 dKH external input was biological change.

---

## WG-ALK-012 — Unknown 4% versus 5% water change

Unknown replacement-water Alk uses:

\[
ALK\_UNKNOWN\_WC\_ASSUMED\_MISMATCH=2.0\ dKH
\]

### 4% water change

\[
0.04(2.0)=0.08\ dKH
\]

below the 0.10 dKH floor.

Required:

```text
segmentBreak = false
waterChangeEffect = UNKNOWN_SUBFLOOR_ASSUMPTION
inventedSubtraction = false
```

### 5% water change

\[
0.05(2.0)=0.10\ dKH
\]

meets the materiality floor.

Required:

```text
segmentBreak = true
inventedSubtraction = false
```

If it occurs inside a maintenance-response comparison:

```text
responseAttribution = CONFOUNDED
potencyLearningEligible = false
```

---

## WG-ALK-013 — Negative consumption does not create a dose reduction

Known current maintenance supply:

\[
PD=0.60\ dKH/day
\]

Observed rise:

\[
S=+0.80\ dKH/day
\]

Mass-balance estimate:

\[
C=PD-S
=
0.60-0.80
=
-0.20\ dKH/day
\]

### Required outcome

```text
consumption = NON_PHYSICAL_OR_UNEXPLAINED_GAIN
maintenanceRecommendation = HOLD_CURRENT_DOSE
```

If Alk is high/rising:
- shorten retest;
- verify events/delivery;
- do not calculate a protective dose reduction from −0.20.

If a separate temporary upward return-plan component is active, that temporary component may stop under its own rules.

---

## WG-ALK-014 — Stable below range offers return plan without changing maintenance

Inputs:

```text
target = 8.2–8.8
latest Alk = 7.80
observed slope = approximately 0
supported slope = 0
current maintenance = 9.0 mL/day
```

### Automatic maintenance result

```text
recommendation = HOLD_CURRENT_DOSE
```

No automatic increase merely because 7.80 is below range.

### Optional return plan

Aim point:

\[
A_T
=
\frac{8.2+8.8}{2}
=
8.50
\]

If user selects STEADY:

\[
S_{plan}=+0.25\ dKH/day
\]

Temporary dose:

\[
D_{temporary}
=
9.0+\frac{0.25}{0.0693}
=
12.6075\ mL/day
\]

Nearest recommendation precision step:

\[
12.6\ mL/day
\]

Approximate level distance:

\[
8.50-7.80
=
0.70\ dKH
\]

Idealized duration at 0.25/day:

\[
0.70/0.25
=
2.8\ days
\]

This is a **user-opted deliberate movement plan**, not an automatic maintenance recommendation.

---

## WG-ALK-015 — First aim-point crossing stops temporary movement

Continue WG-ALK-014.

Latest valid measurement:

\[
8.52\ dKH
\]

Aim:

\[
8.50
\]

### Required outcome immediately

```text
temporaryMovementComponent = STOP
maintenanceDose = RESTORE_CURRENT_MAINTENANCE_ESTIMATE
returnPlanPhase = CONFIRMATION_PENDING
```

Do not keep the 12.6 mL/day temporary return dose running while waiting for a second reading in the arrival zone.

---

# WORKED GOLDEN ROUND-1 ACCEPTANCE RULE

Claude Code must implement each worked scenario as an executable fixture.

A fixture fails if:
- the numerical result differs beyond declared floating-point tolerance;
- the wrong rule path produces the same final number;
- a forbidden state/card is returned;
- the UI recomputes a different slope/dose from the domain result.

Round 2 should add:
- interrupted interventions;
- correction during response;
- potency-calibration fixtures;
- dose changed outside the app, with known and uncertain effective times;
- potency/solution-strength revision while a response window is open;
- changed target range;
- edited/backdated measurement;
- exact return-plan overrun;
- outer-upper-bound mirror cases;
- downward maintenance adjustments;
- pump calibration / solution-batch context boundaries.

WG-ALK-016 through WG-ALK-020 begin that Round-2 set and are canonical.



## ALK-INTERVENTION-EXTERNAL-CHANGE-001 — Dose changes outside the app

The Alk engine must assume that the configured/logged maintenance dose is only trustworthy for response attribution when the intervention history is sufficiently complete.

A dose change may occur:
- in-app and logged at the time;
- outside the app but logged later with a known effective timestamp;
- outside the app and logged later with an uncertain timestamp;
- outside the app and never logged, then inferred from later user correction or delivery history.

### Known late-entered dose change

If the keeper later records:

```text
oldDose
newDose
actualEffectiveAt
```

with sufficient timestamp confidence, the event is inserted into the immutable event ledger.

Current analysis is recomputed from the affected point forward.

Historical recommendations shown to the user at the time are not rewritten.

Any analysis window that crossed the newly inserted dose boundary is re-segmented.

### Late-entered dose change with uncertain timestamp

If the user knows the dose changed but cannot identify a sufficiently precise effective time:

```text
eventType: MAINTENANCE_DOSE_CHANGE
timestampConfidence: UNCERTAIN
```

then any Alk interval that could straddle the unknown boundary is:

```text
segmentEligibility: CONFOUNDED
responseAttribution: NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME
potencyLearningEligible: false
```

The app must not guess whether a reading belongs to the old-dose or new-dose regime.

A new clean segment begins only after the latest possible boundary time is passed and new measurements accumulate.

### Unlogged change discovered indirectly

If a later user correction says the app's stored dose was wrong, or if verified pump history proves a different dose was active:

- correct the event ledger from the first defensible known time;
- mark earlier ambiguous periods as dosage-history uncertain;
- invalidate response/potency conclusions that depended on the incorrect dose state;
- do not silently preserve a prior response classification built on a false dose assumption.

### No evidence of an actual external change

The engine must not infer an unlogged dose change merely because Alk behaved unexpectedly.

Unexpected response remains:
- no response;
- contradictory;
- confounded;
- unexplained;

according to evidence.

Do not invent a dose event to make the mathematics fit.

---

## ALK-PREDICTION-SNAPSHOT-001 — Intervention prediction is immutable

Every maintenance-dose intervention stores the exact analytical snapshot used when the prediction was created.

Required snapshot fields include:

```text
interventionId
createdAt
oldDose
newDose
selectedPotencyAtPrediction
potencyContextIdAtPrediction
potencyConfidenceAtPrediction
preChangeObservedSlope
preChangeSlopeUncertainty
expectedSlopeChange
predictedPostSlope
calculationVersion
```

The expected response stored at intervention creation is:

\[
\Delta S_{expected,0}
=
P_{prediction}
(
D_{new}-D_{old}
)
\]

where:

\[
P_{prediction}
=
selectedPotencyAtPrediction
\]

and:

\[
S_{pred,post,0}
=
S_{pre,observed}
+
\Delta S_{expected,0}
\]

These values are **historical facts about what the app predicted at the time**.

They are immutable.

### Later potency recalibration

Suppose the Potency Engine later changes selected potency from:

\[
P_{old}
\]

to:

\[
P_{new}
\]

while the intervention response window is still open.

The formal response classifier continues evaluating the intervention against:

\[
\boxed{
\Delta S_{expected,0}
}
\]

not a retroactively recalculated prediction.

Reason:

Changing the benchmark after observing the response would move the goalposts and destroy auditability.

### Current recommendation uses current potency

A later potency update may affect:

- current consumption estimate;
- current supported maintenance requirement;
- future dose recommendations;
- future intervention predictions.

Therefore V2 may simultaneously store:

```text
historicalInterventionPredictionPotency = P_old
currentSelectedPotency = P_new
```

This is intentional.

### Potency disagreement during an open response window

If new calibration evidence materially disagrees with the prediction potency while the response is still open:

```text
interventionPotencyContext = HISTORICAL_SNAPSHOT
currentPotencyContext = UPDATED
responseInterpretationWarning = POTENCY_REVISED_SINCE_PREDICTION
```

The response classifier still answers:

> Did the tank respond as the app predicted when the change was made?

A separate current-state analysis answers:

> Given what we now know about potency, what dose appears appropriate now?

Do not combine those questions by rewriting the old expected response.

### Potency observation generated by the same intervention

The intervention may itself later contribute evidence to potency calibration only after its response becomes eligible under the potency rules.

That learned potency does not recursively rewrite the intervention's own original expected-response benchmark.

This prevents circular self-validation.

---

## WG-ALK-016 — Dose changed outside the app, logged later with known time

Initial stored history incorrectly says:

```text
Day 0 dose = 9.0 mL/day
Day 2 dose = 9.0
Day 4 dose = 9.0
```

At Day 5 the keeper records:

```text
actual change:
Day 1 12:00
9.0 → 10.0 mL/day
```

### Required recomputation

The original Day 0→Day 4 single-dose trend is no longer a valid constant-dose maintenance segment.

Required:

```text
event ledger amended = true
segment boundary = Day 1 12:00
old current-analysis result invalidated = true
historical recommendation shown at the time preserved = true
potency learning across Day 0→4 = false
```

The engine recomputes current analysis using only intervals that can be assigned to a dose regime honestly.

---

## WG-ALK-017 — Dose changed outside app, change time uncertain

At Day 5 the keeper says:

> I changed the Alk doser from 9 to 10 mL/day sometime between Day 1 and Day 3, but I don't remember exactly when.

Measurements exist on Day 0, Day 2, Day 4.

### Required outcome

The Day 0→4 sequence cannot support one clean maintenance slope or one clean intervention response.

Required:

```text
doseHistoryConfidence = UNCERTAIN
affectedWindow = CONFOUNDED
responseAttribution = NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME
potencyLearningEligible = false
```

Do not assign Day 2 to old or new dose by guess.

New clean evidence begins after the uncertain boundary is safely behind the analysis.

---

## WG-ALK-018 — Unexpected response does not invent an external dose change

Recorded dose remains 9.0 mL/day.

Alk response is unexpectedly strong.

There is:
- no user correction;
- no pump history proving a change;
- no logged external event.

### Required outcome

The engine may classify:
- over-response;
- contradictory model;
- unexplained gain;
- potency discrepancy;

as supported.

Forbidden:

```text
inferredDoseChange = true
```

solely to make the response fit.

---

## WG-ALK-019 — Potency changes mid-response; historical prediction does not move

At intervention creation:

```text
old dose = 9.0
new dose = 10.5
selected potency = 0.0693 dKH/mL
pre-change slope = -0.150 dKH/day
```

Original expected slope shift:

\[
\Delta S_{expected,0}
=
1.5(0.0693)
=
+0.10395
\]

Original predicted post slope:

\[
S_{pred,post,0}
=
-0.150+0.10395
=
-0.04605
\]

Before formal response classification, potency calibration updates current selected potency to:

\[
0.0800\ dKH/mL
\]

If recalculated retroactively, the intervention would now appear to have predicted:

\[
1.5(0.0800)=0.1200
\]

and:

\[
S_{pred,post,new}=-0.0300
\]

### Required outcome

Formal response classifier continues to use:

\[
\boxed{
\Delta S_{expected}=0.10395
}
\]

and:

\[
\boxed{
S_{pred,post}=-0.04605
}
\]

because those were the intervention's stored prediction.

Current maintenance analysis may use:

\[
P_{current}=0.0800
\]

for **new** calculations.

Required state:

```text
historicalPredictionPotency = 0.0693
currentSelectedPotency = 0.0800
responseInterpretationWarning = POTENCY_REVISED_SINCE_PREDICTION
historicalPredictionRewritten = false
```

---

## WG-ALK-020 — Intervention contributes to potency learning without circular rewrite

An intervention begins with:

\[
P_{prediction}=0.0693
\]

Later, clean pre/post evidence from that intervention qualifies as a potency observation and helps move learned potency to:

\[
0.0740
\]

### Required outcome

The intervention's own historical expected response remains based on:

\[
0.0693
\]

The new learned value:

\[
0.0740
\]

applies only to:
- current-state recalculation;
- subsequent recommendations;
- subsequent interventions.

Forbidden:

```text
recalculate old expected response with 0.0740
then use revised fit as proof that 0.0740 was correct
```

This prevents circular calibration.



# PART III — WORKED NUMERICAL GOLDEN SUITE — ROUND 2

**Status:** Canonical continuation of Round 1.  
**Purpose:** Stress intervention interruption, corrections, potency calibration, historical edits, return-plan expiry, downward actions, upper-bound symmetry, and potency-context changes.

Unless overridden, use the same default configuration as Worked Golden Round 1.

---

## WG-ALK-021 — Second maintenance change interrupts the first

### History

Pre-change clean evidence supports:

\[
S_{pre}=-0.150\ dKH/day
\]

At Day 0:

```text
9.0 → 10.0 mL/day
```

Before the first intervention becomes formally attributable, at Day +2:

```text
10.0 → 11.0 mL/day
```

### Required outcome

First intervention:

```text
phase = INTERRUPTED
responseAttribution = INTERRUPTED
potencyLearningEligible = false
```

It is not:
- EXPECTED;
- PARTIAL;
- NO_DETECTABLE_RESPONSE;
- FAILED.

Second intervention begins from the **actual 10.0 → 11.0 transition** and stores its own prediction snapshot.

Do not collapse the history into:

```text
9.0 → 11.0
```

as though the 10.0 mL/day exposure never occurred.

All delivered dose remains part of the event ledger.

---

## WG-ALK-022 — Correction during maintenance-response window

Maintenance intervention:

```text
Day 0: 9.0 → 10.5 mL/day
```

At Day +1, user delivers a known one-off Alk correction:

\[
+0.20\ dKH
\]

The correction amount and time are accurately logged.

### Trend analysis

The correction contribution is normalized from subsequent analytical points according to actual delivery.

Therefore the maintenance response may remain analytically interpretable **if** the correction timing and amount are sufficiently known.

### Potency learning

The interval contains two deliberate Alk inputs:
- maintenance-rate change;
- one-off correction.

Required:

```text
maintenanceResponseEligible = true_or_reduced_confidence
potencyLearningEligible = false
```

The exact maintenance-response eligibility depends on whether normalization uncertainty remains within the shared evidence rules.

Forbidden:

```text
potencyLearningEligible = true
```

merely because the correction could be mathematically subtracted.

Reason:

> A window can be good enough to estimate underlying trend yet still be too contaminated to isolate effective dosing potency.

---

## WG-ALK-023 — Unknown correction during response confounds attribution

Same maintenance intervention as WG-ALK-022.

At Day +3, user reports:

> I added some Alk manually yesterday but I don't know how much.

### Required outcome

```text
responseAttribution = CONFOUNDED
potencyLearningEligible = false
```

No invented correction amount is subtracted.

A new clean analytical regime begins after the uncertain external input.

Current position remains the latest valid measured Alk.

---

## WG-ALK-024 — Clean potency observation

Pre-change clean slope:

\[
S_{pre}=-0.180\ dKH/day
\]

Maintenance dose:

\[
D_{pre}=8.0\ mL/day
\]

After a controlled change:

\[
D_{post}=10.0\ mL/day
\]

Clean post-change slope:

\[
S_{post}=-0.040\ dKH/day
\]

Dose difference:

\[
\Delta D=2.0
\]

Observed slope response:

\[
\Delta S
=
-0.040-(-0.180)
=
+0.140\ dKH/day
\]

Potency observation:

\[
P_i
=
\frac{0.140}{2.0}
=
0.0700\ dKH/mL
\]

If all ALK-017 eligibility rules are satisfied:

```text
potencyObservation = 0.0700 dKH/mL
potencyObservationEligible = true
```

For a theoretical potency:

\[
0.0693
\]

the ratio is:

\[
0.0700/0.0693\approx1.010
\]

which lies well inside the ordinary plausibility envelope.

---

## WG-ALK-025 — Potency candidate rejected because dose delta is underpowered

Clean pre/post slopes exist, but the dose change is only:

\[
\Delta D=0.20\ mL/day
\]

At:

\[
P_{expected}=0.0693
\]

expected slope response is:

\[
0.01386\ dKH/day
\]

If the potency-response SNR criterion remains below the ALK-017 threshold:

```text
potencyObservationEligible = false
reason = INSUFFICIENT_POTENCY_SIGNAL
```

Even if the arithmetic quotient returns a numerical \(P_i\), it is not calibration evidence.

The value may be retained diagnostically but must not influence learned potency.

---

## WG-ALK-026 — Three valid potency observations promote calibration

Assume three eligible potency observations under one exact potency context:

\[
P_1=0.068
\]

\[
P_2=0.071
\]

\[
P_3=0.070
\]

They arise from:
- at least two separate qualifying interventions;
- at least seven days of evidence;
- acceptable robust dispersion;
- no unresolved context warning.

Weighted median:

\[
P_{learned}\approx0.070
\]

### Required outcome

If ALK-020 CALIBRATED criteria are met:

```text
potencyConfidence = CALIBRATED
selectedPotency = learnedPotency
```

The switch happens for **future/current calculations**.

It does not rewrite historical intervention predictions.

---

## WG-ALK-027 — One extreme potency observation does not silently recalibrate

Existing theoretical/current selected potency:

\[
0.0693
\]

One candidate returns:

\[
P_i=0.110
\]

Ratio:

\[
0.110/0.0693
\approx1.59
\]

This is near the upper observation plausibility boundary and represents a very large discrepancy.

### Required outcome

Because 0.110 remains just inside the 1.60× plausibility envelope, one otherwise eligible observation alone is:

```text
potencyConfidence = EXPLORATORY
selectedPotency = 0.0693
```

It may be displayed diagnostically but cannot replace selected potency.

Forbidden:

```text
selectedPotency = 0.110
```

from one intervention.

The app may request:
- pump verification;
- solution recipe verification;
- additional clean response evidence.

It does not declare bottle concentration wrong from one tank response.

---

## WG-ALK-028 — Target range changes while dose and trend remain unchanged

Before edit:

```text
target = 8.2–8.8
latest Alk = 8.30
observed slope = 0
supported slope = 0
dose = 9.0 mL/day
```

Current position:

```text
IN_RANGE
```

User changes target to:

```text
8.4–9.0
```

### Required outcome

New position:

```text
BELOW_RANGE
```

Unchanged:

```text
observedSlope
supportedSlope
consumption
selectedPotency
maintenanceDoseEstimate
historical recommendations
```

Automatic result:

```text
HOLD_CURRENT_DOSE
OFFER_RETURN_PLAN when evidence requirements are met
```

The target edit itself is not a biological demand event.

---

## WG-ALK-029 — Backdated valid measurement changes present analysis only

At Day 10, current analysis was built from measurements:

```text
Day 4
Day 6
Day 8
Day 10
```

Later the keeper inserts a valid missing Day-7 Alk result.

### Required outcome

The current analytical segment is recomputed with the newly available event.

If slope/support/recommendation changes, create a **new current assessment**.

Historical Day-8 recommendation shown at Day 8 remains unchanged in history.

Required:

```text
historicalAdviceRewritten = false
currentAnalysisRecomputed = true
newAssessmentId = true
```

---

## WG-ALK-030 — Backdated invalidation removes a formerly used outlier

A historical Alk result previously used in an analysis is later marked:

```text
status = INVALID
```

### Required outcome

Current/replay analysis excludes it.

The event remains in the audit history with invalidation metadata.

Previous historical recommendation remains the recommendation the app actually gave at that time.

Do not physically delete the raw measurement from the audit ledger.

---

## WG-ALK-031 — Return plan reaches assessment-due point with no test

Stable below-range Alk:

\[
7.80\ dKH
\]

Aim:

\[
8.50
\]

Chosen return-plan pace:

\[
+0.25\ dKH/day
\]

Predicted idealized duration:

\[
2.8\ days
\]

Suppose the plan requires an Alk assessment before/around expected arrival, but no new Alk test is entered.

### Required outcome

At the scheduled assessment time:

```text
returnPlanPhase = ASSESSMENT_DUE
```

The app must not infer that the level reached the aim point.

It must request an Alk test.

---

## WG-ALK-032 — Return plan overrun / expiry

Use WG-ALK-031.

Expected duration:

\[
T_{expected}=2.8\ days
\]

Working V1-derived overrun horizon:

\[
T_{expiry}
=
2T_{expected}+2
=
7.6\ days
\]

If no valid assessment has occurred by the expiry horizon:

```text
returnPlanPhase = EXPIRED_OVERRUN
```

### Required recommendation semantics

The app must say:
- the temporary return plan is overdue for assessment;
- do not assume the old temporary movement component remains appropriate;
- test Alk now;
- record the **actual current dose**.

If the app cannot directly control the dosing pump, it must **not pretend it stopped the user's pump**.

It records:

```text
recommendedTemporaryComponent = STOP_PENDING_USER_ACTION
actualDose = UNKNOWN_OR_LAST_LOGGED
```

until the user logs the real implementation.

This preserves recommendation ≠ implementation.

---

## WG-ALK-033 — Upper-bound mirror: in range and rising

Target:

\[
8.2-8.8
\]

Measurements:

```text
Day 0   8.30
Day 2   8.60
Day 4   8.90
```

Observed slope:

\[
+0.150\ dKH/day
\]

Three-point:

\[
\sigma_S=0.03536
\]

Supported slope:

\[
+0.10475
\]

Current dose:

\[
9.0
\]

Supported dose reduction:

\[
\Delta D
=
-\frac{0.10475}{0.0693}
=
-1.5115
\]

Continuous target:

\[
7.4885
\]

Nearest recommendation precision step:

\[
7.5\ mL/day
\]

25% maximum decrease from 9.0:

\[
2.25
\]

so the 1.5 mL reduction is allowed.

Actual physical response from rounded change:

\[
0.0693(-1.5)
=
-0.10395
\]

Predicted post slope:

\[
+0.150-0.10395
=
+0.04605
\]

### Required outcome

```text
latestPosition = ABOVE_RANGE
observedSlope = +0.150
supportedSlope = +0.10475
recommendedDose = 7.5 mL/day
predictedPostSlope = +0.04605
```

The maintenance reduction seeks zero slope, not a deliberate fall to the midpoint.

---

## WG-ALK-034 — Stable above range does not automatically cut maintenance

Target:

\[
8.2-8.8
\]

Latest Alk:

\[
9.20
\]

Observed/supported slope:

\[
0
\]

Current dose:

\[
9.0
\]

### Required outcome

```text
maintenanceRecommendation = HOLD_CURRENT_DOSE
position = ABOVE_RANGE
returnPlanOffer = AVAILABLE
```

No automatic maintenance reduction simply because the level is high.

This is the upper mirror of stable-below-range behaviour.

---

## WG-ALK-035 — Downward return plan is limited by zero-dose floor

Current maintenance demand:

\[
C=0.30\ dKH/day
\]

Current maintenance dose exactly matches demand.

Keeper selects desired downward return pace:

\[
S_{plan}=-0.50\ dKH/day
\]

Required temporary dose from ideal formula would be:

\[
D_{temporary}
=
D_{maintenance}
+
\frac{-0.50}{P}
\]

but this would require a negative dose if the tank can naturally fall only 0.30 dKH/day at zero Alk input.

### Required outcome

Clamp:

```text
temporaryDose = 0
```

Achievable approximate downward rate:

\[
-0.30\ dKH/day
\]

The app reports the longer achievable duration.

It does not imply −0.50/day is possible by “negative dosing”.

---

## WG-ALK-036 — Pump calibration changes potency context

Current potency context:

```text
solution batch = A
pump channel = Alk-1
pump calibration factor = old
```

User recalibrates the dosing pump and the delivered-volume relationship materially changes.

### Required outcome

Create:

```text
newPotencyContextId
```

Historical potency observations remain attached to the old context.

New current selected potency begins from the newly appropriate theoretical/delivery basis until sufficient empirical evidence exists.

Forbidden:

```text
pool old and new delivery contexts as identical
```

Historical intervention predictions remain immutable snapshots.

---

## WG-ALK-037 — Solution concentration/batch change resets empirical context

Old solution:

```text
Na2CO3 101 g/L
batch A
```

User mixes a new reservoir at:

```text
Na2CO3 80 g/L
batch B
```

### Required outcome

New theoretical potency is recalculated from the new recipe and system volume.

Create new potency context.

Do not carry the old learned dKH/mL value over as though reservoir strength were unchanged.

Historical observations remain available for audit.

The prior learned delivery ratio may be displayed as contextual history only where the potency policy explicitly allows it; it does not become the new selected potency by default.

---

## WG-ALK-038 — Solution strength corrected after a Setup-entry mistake

Intervention was originally predicted using Setup concentration:

\[
101\ g/L
\]

Later the user discovers the actual reservoir was:

\[
80\ g/L
\]

and corrects Setup.

### Historical intervention

Its prediction snapshot remains what the app actually predicted at the time from the then-known configuration.

Required:

```text
historicalPredictionRewritten = false
predictionInputWasWrong = true
```

### Current analysis

The corrected concentration creates/updates the current potency context.

Future calculations use the corrected theoretical potency unless learned/context rules provide a stronger valid current estimate.

### Historical response interpretation

The old intervention may carry:

```text
responseInterpretationWarning = PREDICTION_INPUT_LATER_CORRECTED
```

The app may retrospectively explain why prediction and response disagreed.

It must not rewrite the historical prediction and then claim the original app prediction was accurate.

---

## WG-ALK-039 — Correction plus potency update cannot make one window calibration-clean

Maintenance dose changes.

During its response window:
- a known one-off correction occurs;
- later potency is updated from other evidence.

Even if the correction is normalized perfectly and current potency is now stronger:

### Required outcome

The window is not automatically promoted to potency-calibration quality.

Potency learning requires its own clean eligibility rules.

Historical response still uses the stored prediction potency.

Current maintenance calculation uses current selected potency.

This fixture prevents “we can mathematically account for it” from becoming “therefore it is calibration-grade evidence.”

---

## WG-ALK-040 — Current maintenance can move on while old response remains unresolved

Old intervention:

```text
responseAttribution = AWAITING_DETECTABILITY
```

New clean post-change regime accumulates enough evidence to show:

\[
S_{supported}=-0.060\ dKH/day
\]

### Required outcome

The current controller may calculate a new maintenance increase from:

\[
-0.060
\]

If the user implements that new recommendation:
- prior intervention closes as unresolved/interrupted as appropriate;
- new intervention begins;
- old causal-attribution question does not block current control.

This is a core V2 behaviour.

---

# WORKED GOLDEN ROUND-2 ACCEPTANCE RULE

Round-2 fixtures must be executable and auditable.

The implementation fails if it:
- rewrites an intervention's expected response after potency changes;
- invents an unlogged external dose change from chemistry alone;
- guesses an unknown external-change timestamp;
- uses a normalized correction window as automatic potency-calibration evidence;
- rewrites historical advice after backdated data edits;
- assumes an expired return-plan dose was actually stopped without user/pump confirmation;
- treats upper-bound maintenance logic differently from the mathematically symmetric lower-bound rule without an explicit safety exception;
- carries learned potency unchanged across a material solution/delivery context boundary.



# PART III — FREEZE 1 INTERNAL AUDIT — SUPERSEDED

**Freeze date:** 2026-08-19  
**Result at the time:** PASS, subsequently **INVALIDATED by external adversarial review**. The findings D-1 through D-6, I-1/I-2, capability findings M-1 through M-9, and wording findings W-1 through W-3 supersede the original internal PASS.

## FZ-ALK-001 — One ordinary movement authority

PASS.

Ordinary Alk movement is owned by:
- Theil–Sen observed slope;
- deterministic slope uncertainty;
- `ALK_SLOPE_SUPPORT_K = 1.28`;
- supported slope.

The old V1 0.10 dKH/day + endpoint-persistence ordinary gate is not simultaneously active.

`ALK-RAPID-001` remains separate only for early two-point rapid action.

## FZ-ALK-002 — Observed / supported / action separation

PASS.

The canon now distinguishes:
- `observedSlope`;
- `supportedSlope`;
- `consumptionEstimate`;
- `maintenanceEstimate`;
- `continuousActionCandidate`;
- `recommendedDose`;
- `predictedPostSlope`.

Physical demand uses observed slope.

Recommendation sizing uses supported slope.

Risk forecast uses sufficiently established observed slope.

## FZ-ALK-003 — Day-2 / Day-4 response separation

PASS.

Day +2:
- position;
- safety;
- exposure;
- first-interval context;
- no formal six-way causal classifier.

Ordinary formal response attribution begins only when a non-overlapping genuine post-change slope exists, commonly Day +2 → Day +4.

## FZ-ALK-004 — Formal response classifier

PASS.

Exact response classes:
- EXPECTED;
- PARTIAL;
- NO_DETECTABLE_RESPONSE;
- CONTRADICTORY;
- OVER_RESPONSE;
- INCONCLUSIVE.

The classifier uses deterministic sigma-based boundaries.

Numerical partition checks found no overlapping class conditions.

Overshoot remains orthogonal to response attribution.

## FZ-ALK-005 — Small-signal attribution

PASS.

The engine can determine when an intervention is fundamentally too small to isolate from fixed pre-change slope uncertainty.

`NOT_ATTRIBUTABLE_SMALL_SIGNAL` does not block current-dose maintenance assessment.

Mandatory full-card semantics are specified.

## FZ-ALK-006 — Negative consumption

PASS.

Materially negative / physically uninterpretable consumption:
- cannot size a maintenance reduction;
- does not become zero consumption by clamp;
- increases retest/verification urgency where appropriate;
- does not prevent stopping a separately temporary movement component under its own rules.

## FZ-ALK-007 — Dose-history integrity

PASS.

Covered:
- in-app changes;
- known late-entered external changes;
- uncertain-time external changes;
- interrupted changes;
- no invented dose event from unexpected chemistry.

## FZ-ALK-008 — Potency-history integrity

PASS.

Each intervention stores an immutable potency/prediction snapshot.

Later potency recalibration:
- affects current/future calculations;
- does not rewrite historical expected response;
- cannot recursively validate the intervention that generated the calibration evidence.

## FZ-ALK-009 — Potency learner determinism

PASS.

Defined:
- exact pre/post evidence minimum;
- exact potency SNR;
- diagnostic vs calibration-grade signal;
- plausibility envelope;
- median learned potency;
- MAD-based relative dispersion;
- deterministic promotion states;
- deterministic reassessment trigger;
- context boundaries.

No hidden weighting judgement remains.

## FZ-ALK-010 — Water changes and corrections

PASS.

Known material water-change contribution:
- normalized.

Unknown replacement Alk:
- <5% water change remains without invented subtraction;
- ≥5% breaks the Alk analytical segment under the fixed unknown-mismatch envelope.

Known corrections:
- normalize actual delivery;
- may preserve trend eligibility;
- do not automatically become potency-calibration-clean.

## FZ-ALK-011 — Return plans

PASS.

Return plans:
- are opt-in;
- are separate from automatic maintenance;
- use midpoint destination;
- stop deliberate movement on first reach/pass;
- preserve confirmation as a separate stage;
- have exact expiry;
- distinguish recommended stop from actual pump implementation;
- respect Alk rate and liquid-volume guards.

## FZ-ALK-012 — Safety constraints

PASS.

Ordinary maintenance step:
- 25% where the percentage cap exceeds one recommendation-precision step.

Exceptional maintenance step:
- up to 50% only for confirmed rapid movement plus actual/forecast outer-bound risk.

Always independently subject to:
- 0.50 dKH/day physical-effect rail;
- non-negative dose;
- pump resolution/rounding;
- configured potency validity.

Zero/tiny dose uses deterministic baseline-establishment handling rather than `25% × 0`.

## FZ-ALK-013 — Rounding

PASS.

Nearest recommendation precision.

Exact ties toward current dose.

Post-rounding hard-constraint recheck.

No forced one-increment action when the rounded recommendation equals current dose.

## FZ-ALK-014 — Historical truthfulness

PASS.

Backdated edits may recompute current analysis.

They do not rewrite what the app actually recommended historically.

Prediction snapshots are immutable.

## FZ-ALK-015 — V1 surface behaviour preservation

PASS against the written V1 wizard/card canon available to this project.

All 27 Alk-relevant reference cards are mapped to V2 primitives or explicitly marked as intentional V2 behavioural improvements.

V1 branch-order dependence is not retained.

## FZ-ALK-016 — Golden coverage

PASS for canonical specification.

Worked Golden Round 1 and Round 2 cover:
- sparse evidence;
- uncertainty-limited movement;
- slow drift;
- zero-dose establishment;
- rounding;
- rapid outer-bound risk;
- Day +4 vs Day +6 response resolution;
- exact response classes;
- non-attributable small signals;
- water changes;
- negative consumption;
- stable-outside return plans;
- interrupted changes;
- corrections;
- potency learning;
- target edits;
- backdated data;
- expiry;
- upper/lower mirrors;
- delivery/potency context changes;
- external dose changes;
- mid-response potency revision.

## FZ-ALK-017 — Repository/code audit boundary

NOT CLAIMED by this freeze.

The live application repository is not part of the active artifact workspace used for this canon audit.

Therefore Freeze 1 means:

> The behavioural specification is frozen and ready for external review / implementation comparison.

It does **not** mean:
- current production code matches the canon;
- current V1 tests should all pass unchanged;
- migration has been implemented.

The implementation phase must diff code/tests against this frozen Part III and classify every divergence.

---

# PART III — FREEZE DECLARATION

**Alk V2 Freeze 1 is superseded. The current Part III authority is Alk V2 Freeze 4 (FROZEN — 2026-08-19).**

Any review finding that changes behaviour must:
1. identify the conflicting rule ID(s);
2. state the failure scenario;
3. state whether it is a canon defect, implementation defect, or deliberate product change;
4. update affected golden fixtures;
5. create the next freeze identifier.




# PART III — WORKED GOLDEN SUITE — EXTERNAL REVIEW CORRECTIONS

## WG-ALK-041 — Stable below outer bound triggers buffered safety return

Inputs:

```text
OuterMin = 7.0 dKH
sigma_Alk_base = 0.10 dKH
latest Alk = 6.80 dKH
ordinary trend = STABLE
maintenance dose = established and interpretable
selected potency = 0.0693 dKH/mL
```

Buffered safety destination:

\[
A_{safe,low}
=
7.0+2(0.10)
=
7.20\ dKH
\]

Safety correction magnitude:

\[
\Delta A_{safety}
=
\min(7.20-6.80,0.50)
=
0.40\ dKH
\]

Correction volume:

\[
V_{safety}
=
0.40/0.0693
\approx
5.772\ mL
\]

Required outcome:

```text
position = ALERT_LOW
outerBoundState = BREACHED_LOW
interventionType = SAFETY_RETURN
priority = URGENT
safetyDestination = 7.20 dKH
safetyCorrection ≈ 5.772 mL before rounding for legibility
acceptedPermanentMaintenance = HOLD established maintenance
```

Forbidden outcome:

```text
ordinary optional return-plan offer only
safety destination = exactly 7.0 dKH
```

---

## WG-ALK-042 — Preferred-range forecast is not outer-bound forecast

Inputs:

```text
RangeMin = 8.2
OuterMin = 7.0
A_now = 7.9 dKH
S_observed = -0.35 dKH/day
next ordinary test = 2.0 days
rapid evidence otherwise valid
```

Preferred lower range has already been crossed:

\[
T_{rangeLow}=0
\]

Outer-bound crossing time:

\[
T_{outerLow}
=
(7.9-7.0)/0.35
\approx
2.571\ days
\]

Since:

\[
2.571>2.0
\]

the forecast limb does **not** unlock the 50% cap.

Required:

```text
outerBoundForecastRiskBeforeNextTest = false
50PercentCapUnlockedByForecast = false
```

---

## WG-ALK-043 — Outer-bound forecast does unlock 50% cap when crossing precedes next test

Same configuration, but:

\[
S_{observed}=-0.50\ dKH/day
\]

Then:

\[
T_{outerLow}
=
(7.9-7.0)/0.50
=
1.8\ days
\]

Since:

\[
1.8\le2.0
\]

and `ALK-RAPID-001` plus all other eligibility conditions are satisfied:

```text
50PercentCapUnlockedByForecast = true
```

The 0.50 dKH/day physical-effect rail remains independently binding.

---

## WG-ALK-044 — Non-rapid two-point pre-history cannot support causal attribution

History:

```text
Day -2 Alk 8.50
Day  0 Alk 8.35
Day  0 user manually changes dose
```

The two-point decline is not a valid `ALK-RAPID-001` case and does not meet ordinary 3-cluster / 4-day sufficiency.

Required:

```text
responseAttribution = PRECHANGE_EVIDENCE_INSUFFICIENT
formalResponseClassifierRuns = false
```

Later post-change measurements may establish a new current maintenance trend independently.

---

## WG-ALK-045 — An absent recommendation precision states the full-precision figure

**REWRITTEN by owner decision 23.** The behaviour this golden pinned — refusing a final
mL/day recommendation because a device increment was unknown — is retired with the actuator
premise it rested on.

Inputs:
- sufficient supported falling Alk trend;
- valid configured potency;
- current dose known;
- `recommendationPrecisionMlPerDay = NOT CONFIGURED`.

Required:

```text
observedSlope             = calculated
supportedSlope            = calculated
continuousActionCandidate = calculated
recommendedDose           = the continuous candidate, at FULL PRECISION
roundingApplied           = false
outputWithheld            = false
reason                    = none for this - it is an ordinary answer, not an exception
```

Step 6 of `ALK-ROUNDING-001` — the hard-constraint recheck against `ALK-046` and
`ALK-LIQUID-VOLUME-GUARD-001` — **still runs**. It is not a rounding artefact.

The app **may** offer to capture a display precision, and must not make the recommendation
conditional on getting one. **No 0.1 mL/day assumption is allowed**, then or now.

A **configured** value of zero or less is a different state and still refuses:
`reason = VALIDATION_RECOMMENDATION_PRECISION_INVALID`.

> **Superseded by owner decision 23, preserved rather than deleted.** This golden previously
> read: "**WG-ALK-045 — Missing actuator increment refuses final actionable mL/day.**
> Inputs: sufficient supported falling Alk trend; valid configured potency; current dose
> known; `actuatorIncrementMlPerDay = MISSING`. Required: `observedSlope = calculated`,
> `supportedSlope = calculated`, `continuousActionCandidate = calculated`,
> `recommendedDose = WITHHELD`, `reason = ACTUATOR_INCREMENT_REQUIRED`. The app must ask for
> the implementable dosing increment. No 0.1 mL/day assumption is allowed."

---

## WG-ALK-046 — Potency learner capability-gated while core controller remains active

Inputs:
- valid configured/theoretical potency;
- current Alk measurements sufficient;
- current programmed dose known;
- `solutionContextId = MISSING`;
- `deliveryContextId = MISSING`.

Required:

```text
coreAlkController = ACTIVE
selectedPotencySource = THEORETICAL_OR_CONFIGURED
potencyLearning = NOT_RUN
reason includes POTENCY_CONTEXT_CAPABILITY_MISSING
```

The app must not assume the contexts are unchanged merely to generate an empirical potency value.

---

## WG-ALK-047 — No telemetry: constant-dose core still works, mixed exact integration does not

Inputs:

```text
confirmed programmed dose = 9.0 mL/day
delivery telemetry = unavailable
no known missed doses/outage
clean constant-dose segment = true
```

Required:

```text
deliveryBasis = CONFIRMED_PROGRAMMED_SCHEDULE
ordinary maintenance analysis = ELIGIBLE
```

Now add an internal dose change whose exact partial-day delivered volume cannot be reconstructed.

Required for the mixed interval:

```text
mixedIntervalIntegration = NOT_RUN
segmentAtDoseBoundary = true
```

Telemetry absence must not disable the entire Alk controller.

---

## WG-ALK-048 — Missing replacement-water Alk degrades rather than refuses

Water change:

```text
fraction = 0.10
replacementAlkalinityDkh = MISSING
```

Required:

```text
waterChangeEffect = UNKNOWN
segmentBreak = true
ordinary Alk engine = continues from new clean segment
```

No invented replacement-water value.

---

## WG-ALK-049 — Ten-day testing cadence remains insufficient by design

Measurements:

```text
Day 0
Day 10
Day 20
```

At Day 20, the 14-day current-control horizon contains only Day 10 and Day 20.

Required:

```text
movementEvidence = INSUFFICIENT
automaticMaintenanceAdjustment = WITHHELD
```

Required card meaning:

> Not enough recent alkalinity tests for a maintenance adjustment. Add a third valid test within the current 14-day window.

The engine does not extend the control window merely to make the trend computable.

---

## WG-ALK-050 — Extreme potency discrepancy triggers verification, not learning

Configured/theoretical potency:

\[
P_{expected}=0.0693
\]

Candidate empirical potency:

\[
P_i=0.140
\]

Upper plausibility bound:

\[
1.60P_{expected}
=
0.11088
\]

Since:

\[
0.140>0.11088
\]

Required:

```text
potencyObservationStatus = PLAUSIBILITY_HOLD
selectedPotency remains configured/current
```

Repeated calibration-grade observations outside the envelope in the same direction trigger:

```text
potencyContextState = POTENCY_CONTEXT_DISCREPANCY
```

not silent adoption of 0.140.

---


## WG-ALK-051 — High breach + unusable consumption sizes a temporary safety rate

**Amended by owner decision 16.** The inputs are unchanged; the potency already implied by
the default configuration is now stated because the sizing rule needs it.

Inputs:

```text
OuterMax = 11.0 dKH
A_safe,high = 10.80 dKH
latest Alk = 11.40 dKH
current Alk dose = 10.0 mL/day
P_selected = 0.0693 dKH/mL
consumptionEstimate = NEGATIVE, NOT USABLE FOR SIZING
no temporary upward correction active
```

Sizing under `ALK-HIGH-BREACH-SAFETY-SIZING-001`:

\[
R_{down}=\min(11.40-10.80,\ 0.50)=0.50\ dKH/day
\]

\[
\frac{R_{down}}{P_{selected}}=7.215007215007215\ mL/day
\]

\[
D_{safety,temp}=\max(0,\ 10.0-7.215007215007215)=2.784992784992785\ mL/day
\]

Required:

```text
outerBoundState = BREACHED_HIGH
interventionType = SAFETY_RETURN
temporarySafetyRateContinuousMlPerDay = 2.784992784992785
temporarySafetyRateRecommendationMlPerDay = 2.8      # ALK-ROUNDING-001, 0.1 mL/day increment
maintenanceEstimateStatus = UNRESOLVED
actualDoseState = unchanged until user/pump confirms implementation
nextTest ≈ 24 h
```

Forbidden:

```text
recommend continuing 10.0 mL/day merely because permanent maintenance cannot be recalculated
pause to 0 mL/day chosen by the materiality classification rather than reached by the sizing floor
```

**Superseded wording, preserved:** this golden previously required `safetyDoseRecommendation = 0 mL/day` on the materially-negative branch.

---

## WG-ALK-052 — Safety correction and maintenance change share one rail

Inputs:

```text
latest Alk = 6.40 dKH
OuterMin = 7.0
safety destination = 7.20
desired safety movement this 24 h = +0.50 dKH
supported maintenance change would add +0.104 dKH/day
```

Naive independent total:

\[
0.50+0.104=0.604\ dKH/day
\]

Required:

```text
safety movement = +0.50 dKH/24h
new maintenance adjustment = DEFERRED_BY_SAFETY_RAIL
combined intentional movement = +0.50 dKH/24h
```

Forbidden:

```text
+0.604 dKH/day combined recommendation
```

---

## WG-ALK-053 — Crossing the outer edge does not complete safety return

Inputs:

```text
OuterMin = 7.0
sigma_Alk_base = 0.10
low safety destination = 7.20
previous Alk = 6.80
new Alk = 7.05
```

Required:

```text
outerBoundState = RECOVERING_INSIDE_BOUND
SAFETY_RETURN remains active
completion = false
```

At a later valid reading:

```text
Alk = 7.21
```

Required:

```text
SAFETY_RETURN completes
ordinary maintenance/return-plan sequencing resumes
```

---

## WG-ALK-054 — Missing historical bracket evidence disables bracket only

Inputs:
- current Alk evidence is sufficient;
- current supported maintenance recommendation is calculable;
- historical V2 assessment/provenance store is unavailable.

Required:

```text
empiricalBracketStatus = UNAVAILABLE
historicalBracketCheck = NOT_RUN
coreMaintenanceRecommendation = continues
```

No historical bracket is reconstructed from incomplete snapshots.

---


## WG-ALK-055 — Low Alk outer-bound breach overrides Mg alert-low hold

Inputs:

```text
Alk = 6.80 dKH
OuterMin = 7.00 dKH
low safety destination = 7.20 dKH
Mg = below configured alert-low
Alk potency = valid
no other Alk safety blocker
```

Required:

```text
interventionType = SAFETY_RETURN
alkSafetyAction = ALLOWED
ordinaryMgGateBlocksSafetyReturn = false
```

Required card meaning:

> Alkalinity is below the outer operating range. A safety return toward 7.20 dKH is recommended now. Magnesium is low, so alkalinity may be harder to hold until magnesium is corrected.

Forbidden:

```text
withhold Alk safety return solely because Mg is alert-low
```

Ordinary non-safety Alk/Ca correction logic may still remain blocked by the Mg gate.

---

## WG-ALK-056 — Safety return interrupts an open maintenance-response attribution window

History:

```text
Day 0  maintenance dose changed
Day 2  first post-change Alk reading
Day 3  Alk breaches outer bound and SAFETY_RETURN begins
```

Required:

```text
priorResponseAttribution = INTERRUPTED_BY_SAFETY_RETURN
priorPredictionSnapshot = preserved
formalSixWayResponseAcrossSafetyWindow = false
```

After the safety return ends, current maintenance analysis must build a new clean regime rather than resume the old causal window.

---

## WG-ALK-057 — Safety return is a potency-learning confounder

Inputs:
- clean maintenance intervention would otherwise qualify for potency learning;
- its response window overlaps a delivered `SAFETY_RETURN`.

Required:

```text
potencyLearningEligible = false
reason = SAFETY_RETURN_CONFOUND
```

The safety return itself is not entered into the potency-learning pool.

---

## WG-ALK-058 — Safety return owns the Alk intervention lock

Inputs:

```text
SAFETY_RETURN = active
current maintenance estimate = calculable
new maintenance dose would ordinarily be recommended
```

Required:

```text
maintenanceEstimate = may be shown
maintenanceActionStatus = DEFERRED_BY_SAFETY_RETURN
newMaintenanceDoseImplementation = false
newOrdinaryReturnPlan = false
```

The engine waits for safety-return completion and a new eligible maintenance assessment.

---

## WG-ALK-059 — Known safety correction participates in segmentation

Inputs:
- safety correction actually delivered;
- amount and time known.

Required:

```text
eventType = SAFETY_RETURN_CORRECTION
correctionEffect = known
analyticalNormalization = allowed under correction rules
potencyLearningAcrossWindow = false
```

If amount/time are uncertain:

```text
interval = CONFOUNDED
inventedCorrectionEffect = forbidden
```


## WG-ALK-060 — Safety return uses the one retest scheduler

Inputs:

```text
SAFETY_RETURN = active
action implemented at Day 0 14:00
ordinary post-dose cadence candidate = 48 h
safety candidate = 24 h
no more urgent candidate
```

Required:

```text
selectedRetestReason = SAFETY_RETURN_ACTIVE
nextTest ≈ Day 1 14:00
```

If a rapid/suspicious-reading rule requires 12–18 h, the canonical scheduler selects that earlier candidate instead.

Forbidden:

```text
card independently hardcodes a conflicting safety retest time
```

---

## WG-ALK-061 — Missing maintenance recommendation precision does not block safety correction

Inputs:

```text
Alk = 6.80 dKH
low safety destination = 7.20 dKH
P_selected = 0.0693 dKH/mL
recommendationPrecisionMlPerDay = MISSING
```

Required dKH movement:

\[
\Delta A_{safety}=0.40\ dKH
\]

One-off safety volume:

\[
V_{safety}
=
0.40/0.0693
\approx
5.772\ mL
\]

Required:

```text
safetyCorrectionStatus = ACTIONABLE
safetyCorrectionVolume ≈ 5.772 mL before display formatting
maintenanceRateRoundingPrecision = MISSING
the retired ACTUATOR_INCREMENT_REQUIRED refusal did not block SAFETY_RETURN, and no longer exists at all (owner decision 23)
```

Forbidden:

```text
the app must not withhold an urgent safety correction solely because recommendationPrecisionMlPerDay is missing
```

If `P_selected` is invalid/unknown, the mL value is withheld and only the required dKH movement may be stated.

---


## WG-ALK-062 — Five-reading uncertainty exposes the Sxx rule

Inputs:

```text
timesDays = [0, 2, 4, 6, 8]
Alk dKH  = [8.80, 8.50, 8.20, 7.90, 7.60]
sigma_Alk_base = 0.10 dKH
P_selected = 0.0693 dKH/mL
D_current = 9.0 mL/day
recommendationPrecisionMlPerDay = 0.1 mL/day
```

Theil–Sen observed slope:

\[
S_{observed}=-0.15\ dKH/day
\]

The points lie on the robust line, so:

\[
\sigma_{resid}=0
\]

\[
\sigma_{point}=0.10\ dKH
\]

Mean time:

\[
\bar t=4
\]

Time leverage:

\[
S_{xx}
=
(0-4)^2+(2-4)^2+(4-4)^2+(6-4)^2+(8-4)^2
=
40\ day^2
\]

Therefore:

\[
\boxed{
\sigma_S
=
0.10/\sqrt{40}
\approx
0.015811\ dKH/day
}
\]

Supported slope:

\[
S_{supported}
=
-0.15+1.28(0.015811)
\approx
-0.129762\ dKH/day
\]

Continuous maintenance action:

\[
\Delta D
=
-\frac{S_{supported}}{P_{selected}}
=
\frac{0.129762}{0.0693}
\approx
1.8725\ mL/day
\]

\[
D_{continuous}
\approx
10.8725\ mL/day
\]

With 0.1 mL/day recommendation precision:

```text
recommendedDose = 10.9 mL/day
```

Required uncertainty:

```text
sigma_S ≈ 0.015811 dKH/day
```

Forbidden shared endpoint-only result:

```text
sigma_S ≈ sqrt(0.10² + 0.10²) / 8
        ≈ 0.017678 dKH/day
```

This golden exists specifically so three-point arithmetic cannot hide a divergence between the shared and Alk uncertainty formulae.

---


## WG-ALK-063 — Rounding cannot break a hard physical rail

Inputs:

```text
D_current = 9.0 mL/day
D_continuous_feasible = 16.352941 mL/day
recommendationPrecisionMlPerDay = 0.10 mL/day
P_selected = 0.0680 dKH/mL
physicalEffectRail = 0.50 dKH/day
```

Nearest ordinary rounding would select:

```text
16.4 mL/day
```

but:

\[
(16.4-9.0)(0.0680)=0.5032\ dKH/day
\]

which exceeds the rail.

`ALK-ROUNDING-001` therefore moves one recommendation-precision step toward the current dose:

```text
recommendedDose = 16.3 mL/day
```

and:

\[
(16.3-9.0)(0.0680)=0.4964\ dKH/day
\]

Required:
- final command = 16.3 mL/day;
- no rail violation after rounding;
- no arbitrary refusal while a feasible representable command exists.

---

## WG-ALK-064 — Confirmed consumption-context change blocks one potency comparison

Pre and post Alk slopes otherwise satisfy the potency-learning evidence burden.

A retained event occurs between the pre-window start and post-window end:

```text
classification = CONSUMPTION_CONTEXT_CHANGE
affectedParameters = [ALK]
materiality = MATERIAL
source = USER_CONFIRMED
reasonCode = LIGHTING_REGIME_CHANGE
```

Required:

```text
potencyObservationEligible = false
reason = CONSUMPTION_CONTEXT_CHANGE
```

Forbidden:
- inferring a potency value across the event;
- inferring the context-change classification merely from an unexpected slope without a retained event.

A later complete comparison entirely inside the new stable context may become eligible normally.

---

## WG-ALK-065 — Legacy target range is not backfilled into historical replay

Legacy history contains Alk measurements from July.

The first effective-dated V2 configuration is created on 2026-08-19 with:

```text
targetRange = 8.2–8.8 dKH
effectiveFrom = 2026-08-19T21:00:00+10:00
```

No earlier target-range version is proven.

Required for a July historical recommendation replay:

```text
historicalConfigDependentReplay = NOT_RUN
reason = HISTORICAL_CONFIGURATION_UNAVAILABLE
```

Required:
- July raw measurements remain visible;
- the August configuration is not silently treated as July configuration;
- new assessments from the effective date onward use the V2 config normally.

---

## WG-ALK-066 — Legacy local time without timezone does not become an absolute instant

Imported legacy reading:

```text
date = 2026-04-05
time = 02:30
timezone/offset = UNKNOWN
```

Required:

```text
timeProvenance = LOCAL_TIME_ZONE_UNKNOWN
exactElapsedTimeAnalysis = NOT_RUN
```

The reading may remain visible in history and may support current position if otherwise valid.

Forbidden:
- assigning the keeper's current timezone;
- assigning noon;
- using it as an exact elapsed-time trend point across a possible DST/offset ambiguity.

---

## WG-ALK-067 — Gross liquid-volume guard remains independent of Alk rate rail

Assume a very dilute maintenance solution where a candidate dose would satisfy the Alk 0.50 dKH/day rail but would deliver more than:

```text
2% of configured net system water volume in 24 h
```

Required:
- do not issue that liquid volume as one 24-hour maintenance/correction command;
- stage/lengthen as canon permits until both the Alk rail and liquid-volume guard are satisfied;
- do not treat satisfaction of the dKH/day rail as satisfying the liquid-volume guard.

---

# PART III — APP CAPABILITY & DEGRADATION CONTRACT

`ALK-CAPABILITY-CONTRACT-001`

A deterministic mathematical rule is not implementation-ready unless every required datum has:
- a capture source;
- a stored representation;
- a defined missing-data behaviour.

No implementation may silently manufacture a missing input.

## Capability outcomes

```text
DEGRADE
```
Continue with a named weaker but valid path.

```text
REFUSE
```
Withhold the affected recommendation and name the missing setup/data required.

```text
NOT_RUN
```
Disable the affected optional analysis/subsystem while unrelated Alk control continues.

---

## M-1 — Recommendation precision — **actuator limb RETIRED by owner decision 23**

### Canonical datum

```text
recommendationPrecisionMlPerDay
```

The granularity at which the keeper wants a recommendation **stated**. Under
`ALK-RECOMMEND-ONLY-001` this is a **display convention**, not a device capability: the
application never commands a pump, so nothing here describes what hardware can execute.

Examples:
- the keeper doses with a pump programmable in 0.1 mL/day steps and wants figures in those
  steps;
- the keeper doses by hand with a syringe and picks a practical granularity.

### Capture

An **optional** Alk dosing-setup field. It was a required one while it gated an output; it
no longer gates anything.

### Missing behaviour

```text
CONFIGURED and > 0   -> ALK-ROUNDING-001 rounds the recommendation to it
CONFIGURED and <= 0  -> REFUSE the final maintenance rate
                        reason = VALIDATION_RECOMMENDATION_PRECISION_INVALID
                        (a bad configured value: a validation failure, and always was)
NOT CONFIGURED       -> STATE THE FULL-PRECISION RECOMMENDATION. Nothing is withheld,
                        nothing is NOT_RUN, no reason code is emitted for it, and no
                        default increment is assumed.
```

No hidden 0.1 mL/day default, in any of the three states.

**There is no longer any refusal here for an ABSENT precision, and therefore no exception to
one.** `ALK-ROUNDING-001` states the same three-state behaviour and owns the rounding
itself; this datum's only job is to say what the field is.

> **Superseded wording, preserved rather than deleted.** This capability datum previously
> read, under the name `actuatorIncrementMlPerDay`:
>
> > The smallest maintenance-dose change the actuator can execute. Examples: dosing pump →
> > smallest programmable daily-rate increment; manual dosing → smallest practical daily-dose
> > increment the keeper chooses to use. **Capture:** new **required** Alk dosing-setup field
> > for final actionable maintenance recommendations. **Missing behaviour:** `REFUSE`,
> > `reason = ACTUATOR_INCREMENT_REQUIRED`. The engine may still calculate observed slope,
> > supported slope and the continuous action candidate, but "must not emit a final rounded\n> > actionable **maintenance mL/day** recommendation until the increment is known". No hidden
> > 0.1 mL/day default. **Explicit safety exception:** this refusal does not apply to the
> > one-off correction volume produced by `ALK-SAFETY-CORRECTION-RESOLUTION-001`; an urgent
> > `SAFETY_RETURN` may calculate and emit its one-off mL correction from valid potency even
> > when `actuatorIncrementMlPerDay` is missing.
>
> Owner decision 23 retired the actuator premise. `ACTUATOR_INCREMENT_REQUIRED` is retired,
> `ALK-SAFETY-CORRECTION-RESOLUTION-001` is retired, and with the refusal gone the exception
> has nothing to except. `VALIDATION_ACTUATOR_INCREMENT_INVALID` is renamed
> `VALIDATION_RECOMMENDATION_PRECISION_INVALID` and survives, because a configured value of
> zero or less is invalid whether or not a pump exists.

---

## M-2 — Solution concentration / potency context

### Canonical datum

```text
solutionContextId
```

Linked to:
- product/chemical;
- recipe/concentration;
- reservoir/batch context where tracked;
- configured net system volume relevant to theoretical potency.

A new context begins when a potency-defining input materially changes.

Literal commercial lot number is optional; context continuity is not.

### Missing behaviour

Core Alk control may continue using validated configured/theoretical potency if that potency is available.

Empirical potency learning:

```text
NOT_RUN
reason = POTENCY_SOLUTION_CONTEXT_UNAVAILABLE
```

No empirical observations are pooled across an unknown context.

---

## M-3 — Delivery / pump configuration context

### Canonical datum

```text
deliveryContextId
```

Represents the delivery configuration whose stability matters to effect per programmed mL.

Examples:
- dosing device/channel;
- calibration state/version where tracked;
- tubing/channel change;
- materially changed delivery method.

### Missing behaviour

Core Alk trend/maintenance logic may continue from a user-confirmed programmed dose.

Empirical potency learning:

```text
NOT_RUN
reason = POTENCY_DELIVERY_CONTEXT_UNAVAILABLE
```

The app does not need to know every mechanical detail; it must know whether the context relevant to programmed-mL delivery has changed.

---

## M-4 — Replacement-water alkalinity

### Canonical optional datum

```text
replacementAlkalinityDkh
replacementAlkalinityConfidence
```

stored on a water-change event where known.

### Missing behaviour

```text
DEGRADE
```

Use `ALK-WATERCHANGE-UNKNOWN-001` exactly:
- unknown WC <5% → retain without invented subtraction;
- unknown WC ≥5% → hard Alk segment boundary.

The engine does not refuse ordinary Alk use merely because replacement-water Alk is absent.

---

## M-5 — Dose-change effective time / late entry

### Canonical data

Every dose-change event stores:

```text
recordedAt
effectiveAt
effectiveAtConfidence
source = IN_APP | EXTERNAL_USER_LOG | IMPORTED_TELEMETRY
```

### Capture

For an in-app change:
- `recordedAt` is automatic;
- `effectiveAt` is the confirmed implementation time.

For an external change logged later:
- ask when the dose actually changed;
- allow exact or explicitly uncertain time.

### Missing behaviour

If effective time is uncertain:

```text
DEGRADE
responseAttribution = NOT_ASSESSABLE_UNKNOWN_CHANGE_TIME
potencyLearningEligible = false
```

Current position still works.

A new clean regime may begin after the uncertain boundary is safely behind the analysis.

No code may equate `recordedAt` with `effectiveAt` for a late external entry without confirmation.

---

## M-6 — Delivered volume versus programmed schedule

### Canonical clarification

**Pump telemetry is not required for core V2 or for empirical potency expressed per programmed mL.**

The fundamental learned potency basis is:

\[
P
=
\text{observed dKH effect per programmed mL}
\]

within one stable delivery context.

This intentionally absorbs stable systematic pump-delivery bias into effective potency.

### Delivery-basis hierarchy

```text
VERIFIED_DELIVERY
```
Telemetry or directly confirmed individual deliveries are available.

```text
CONFIRMED_PROGRAMMED_SCHEDULE
```
The programmed schedule is known to have been active and no missed-dose/outage event is known.

```text
COMMAND_ONLY_UNCONFIRMED
```
Only a nominal setting exists; implementation/execution is not confirmed.

### Missing behaviour

For a clean constant-dose regime, `CONFIRMED_PROGRAMMED_SCHEDULE` is sufficient for core maintenance analysis.

For mixed intervals requiring exact integrated volume:
- verified delivery → exact `D_eff` may run;
- fully specified programmed schedule plus known effective time → scheduled programmed volume may be integrated;
- otherwise:

```text
DEGRADE
mixedIntervalIntegration = NOT_RUN
```

and the engine segments at the dose boundary instead.

No telemetry assumption is invented.

---

## M-7 — Immutable intervention prediction snapshot

### Canonical datum

Persistent `InterventionPredictionSnapshot` under `ALK-PREDICTION-SNAPSHOT-001`.

### Capture

New V2 schema created when a maintenance intervention is implemented/logged.

### Missing behaviour

For legacy interventions without a stored or safely reconstructable snapshot:

```text
NOT_RUN
responseAttribution = LEGACY_PREDICTION_SNAPSHOT_UNAVAILABLE
```

The app may still analyse the current post-intervention regime.

For new V2 interventions, snapshot persistence is a required schema dependency.

---

## M-8 — Precise measurement time / repeat clusters

### Canonical data

Each new Alk measurement stores:

```text
measuredAt
recordedAt
```

`measuredAt` is the biological sampling time used for trend calculations.

Repeat clusters are derived deterministically from eligible measurements within the canonical repeat window.

### Missing behaviour

For a legacy reading with insufficient time precision:
- it may support current position if it is the latest valid reading;
- it remains visible in history;
- it is not treated as an exact independent trend point where timing ambiguity could change slope or cluster membership.

```text
DEGRADE
trendEligibility = TIME_IMPRECISE
```

New V2 measurement entry must capture `measuredAt` precisely enough for the engine.

---

## M-9 — Pre/post dose states for potency learning

### Canonical clarification

For empirical potency, the dose state is:

```text
confirmed programmed maintenance rate
```

not laboratory-measured physical pump output.

Therefore:

\[
P_i
=
\frac{
S_{post}-S_{pre}
}{
D_{post,programmed}-D_{pre,programmed}
}
\]

under one stable `deliveryContextId`.

This calibrates **effective effect per programmed mL**, including stable systematic delivery bias.

### Missing behaviour

If either programmed dose state is not confidently known/implemented:

```text
NOT_RUN
potencyObservationEligible = false
reason = PROGRAMMED_DOSE_STATE_UNCONFIRMED
```

No physical-output telemetry is required.

---


## M-10 — Historical empirical-bracket evidence

### Required by

`ALK-032` / `ALK-BRACKET-COMPARABILITY-001`.

### Canonical data

The bracket requires historical observations with retained provenance, including at least:

```text
historicalObservationId
effectiveDoseState
position/trajectory outcome
historicalConsumptionEstimate
consumptionEvidenceState
potencyContextId
deliveryContextId
segmentId
interventionCompatibility
assessmentAsOf
engineVersion
```

Part II's event ledger and audit-record rules provide the architectural basis, but they do not make the bracket executable unless these historical derived assessments/provenance are actually persisted or deterministically reconstructable.

### Missing behaviour

If eligible historical bracket evidence cannot be reconstructed with the required provenance:

```text
NOT_RUN
empiricalBracketStatus = UNAVAILABLE
reason = HISTORICAL_BRACKET_EVIDENCE_UNAVAILABLE
```

Consequences:
- core Alk maintenance control continues;
- no historical bracket warning/clamp is invented;
- current supported evidence remains authoritative under the ordinary rules.

The empirical bracket is a secondary sanity/conflict detector, not a prerequisite for core dosing control.



## M-11 — Magnesium alert-state interface for Alk safety messaging

### Required by

`ALK-SAFETY-MG-OVERRIDE-001`.

### Canonical datum

Optional cross-parameter state:

```text
magnesiumGateState =
    ALERT_LOW
  | NOT_ALERT_LOW
  | UNKNOWN
```

The magnesium/coupling engine owns its derivation.

### Missing behaviour

```text
DEGRADE
magnesiumGateState = UNKNOWN
```

Consequences:
- Alk outer-bound `SAFETY_RETURN` remains eligible;
- no low-magnesium warning is invented;
- ordinary future coupled-chemistry rules may impose their own requirements when they are evaluated.

Magnesium state is advisory/contextual for this Alk emergency override, not a prerequisite to calculate the Alk safety action.


## M-12 — Effective-dated configuration history

### Required by

Part I `SHARED-CONFIG-VERSION-001`, deterministic replay, historical assessment truthfulness, and any Alk assessment whose interpretation depends on target/configuration state.

### Canonical data

```text
configVersionId
recordedAt
effectiveFrom
changedFields
source
```

### Missing behaviour

For legacy history before the first proven effective-dated configuration version:

```text
NOT_RUN
historicalConfigDependentReplay = NOT_RUN
reason = HISTORICAL_CONFIGURATION_UNAVAILABLE
```

Consequences:

- preserve raw historical measurements/events;
- do not backfill today's target range, net volume, potency or recommendation precision into the old period;
- current V2 analysis from the first valid configuration version onward proceeds normally;
- config-independent historical analysis may still run if its own inputs are valid.

The current unversioned legacy settings may seed the first V2 config version **effective at migration**, not retroactively.

---

## M-13 — Absolute event time / timezone provenance

### Required by

Part II `SHARED-LEGACY-TIME-001` and every calculation using exact elapsed seconds, repeat clustering, event order near intervention boundaries, or exact retest timing.

### Canonical data for new V2 events

```text
absoluteInstant
displayTimeZoneId
timeProvenance = EXACT_ABSOLUTE
```

Equivalent offset-aware timestamp storage is acceptable.

### Missing behaviour

Legacy records without a proven absolute instant:

```text
DEGRADE
timeCapability = IMPRECISE_OR_ABSOLUTE_TIME_UNKNOWN
```

Then:

- history display remains available;
- current position may remain available if the latest reading is otherwise valid;
- exact elapsed-time trend/consumption/response calculations that could change under timezone/DST ambiguity are `NOT_RUN`;
- no noon or current-timezone backfill is invented.

If historical timezone/offset is independently proven, the importer may reconstruct an absolute instant and retain provenance:

```text
timeProvenance = RECONSTRUCTED_WITH_PROVENANCE
```

---


# POTENCY LEARNING — BUILDABILITY DECISION

`ALK-POTENCY-CAPABILITY-GATE-001`

### Direct answer

The potency-learning mathematics is buildable.

**The current app described by the Freeze-1 review does not yet have enough data structure to activate it safely.**

Therefore empirical Alk potency learning is:

```text
featureState = CAPABILITY_GATED
```

until the required capabilities exist:

- `solutionContextId`;
- `deliveryContextId`;
- trustworthy dose-change `effectiveAt`;
- precise enough `measuredAt`;
- confirmed programmed pre/post dose states;
- persistent potency/intervention records required by the learner.

### V2 core while gated

Use:
- validated theoretical/configured potency;
- current configured net volume;
- the ordinary supported-slope controller.

Do **not** silently assume unchanged potency/delivery context to make the learner run.

### Activation strategy

The learner may be enabled in the same product version if the schema/UI migration above is implemented and tested.

If those fields are not implemented in the first V2 code phase, empirical potency learning is deferred to a later activation such as **V2.1**, without blocking the core Alk V2 controller.

This is a capability deferral, not a retreat from the learner design.

---

# FREEZE-1 MISSING-DATA DISPOSITION SUMMARY

| Review item | Required behaviour when missing |
|---|---|
| M-1 recommendation precision | **REFUSE** only where a CONFIGURED value is ≤ 0; where none is configured, state the full-precision recommendation and withhold nothing (owner decision 23) |
| M-2 solution context | Core uses theoretical potency; potency learner **NOT_RUN** |
| M-3 delivery context | Core uses confirmed programmed dose; potency learner **NOT_RUN** |
| M-4 replacement-water Alk | **DEGRADE** to deterministic unknown-WC branch |
| M-5 effective dose-change time | **DEGRADE**; response/potency across boundary not assessable |
| M-6 delivered volume | **DEGRADE** to programmed schedule or segmentation; exact mixed integration **NOT_RUN** |
| M-7 prediction snapshot | Legacy causal response **NOT_RUN**; required for new V2 interventions |
| M-8 precise measurement time | **DEGRADE** legacy data to position/history; ambiguous trend evidence excluded |
| M-9 pre/post dose state | Potency observation **NOT_RUN** unless programmed states confirmed |
| M-10 historical bracket evidence | Empirical bracket **NOT_RUN**; core controller continues |
| M-11 magnesium alert state | **DEGRADE** to UNKNOWN; Alk safety still runs, no low-Mg warning invented |
| M-12 effective-dated configuration | Historical config-dependent replay **NOT_RUN** before first proven config version; raw facts retained |
| M-13 absolute-time/timezone provenance | **DEGRADE** legacy ambiguous time; exact elapsed-time analyses **NOT_RUN** where ambiguity matters |



# PART III — FREEZE 1 EXTERNAL REVIEW DISPOSITION

**Reviewer:** Claude  
**Review date:** 2026-08-19  
**Historical status:** Incorporated during the Freeze-2 candidate review cycle; superseded by current Alk V2 Freeze 3.

## Canon defects

| Finding | Disposition |
|---|---|
| D-1 safety path undefined | **AGREE / FIXED** — `ALK-OUTER-BOUND-ACTION-001` defines explicit urgent outer-bound safety return |
| D-2 50% unlock lacked outer-bound forecast | **AGREE / FIXED** — ALK-062 now defines `T_outerLow` / `T_outerHigh` and boundary-past behaviour |
| D-3 `ΔD_raw` undefined | **AGREE / FIXED** — corrected to `ΔD_supported` |
| D-4 ALK-049 still referenced confidence staging | **AGREE / FIXED** — rounding pipeline explicitly states no staging layer |
| D-5 ALK-039 allowed Day-2 no-response | **AGREE / FIXED** — formal post slope required |
| D-6 48-hour vs 4-day evidence ambiguity | **AGREE / FIXED** — 48 h is pair/interval spacing; ordinary automatic trend still needs ≥3 clusters over ≥4 days |
| D-7 exact `R_obs=-B` label | **NO CHANGE** — measure-zero convention retained to avoid creating a boundary overlap; `INCONCLUSIVE`/no-response semantics remain deterministic |

## Implementation concerns

| Finding | Disposition |
|---|---|
| I-1 Theil–Sen slope with engineering \(\sigma_S\) | **AGREE / CLARIFIED** — canon explicitly names it a controller uncertainty proxy, not a Theil–Sen sampling SE |
| I-2 two-point pre-slope attribution ambiguity | **AGREE / FIXED** — ordinary sufficient pre-trend or valid rapid basis required; otherwise `PRECHANGE_EVIDENCE_INSUFFICIENT` |

## Missing capabilities

M-1 through M-9 are resolved in `ALK-CAPABILITY-CONTRACT-001`.

No missing datum may be silently assumed.

The capability contract explicitly assigns each to:
- DEGRADE;
- REFUSE; or
- NOT_RUN.

## Wording

| Finding | Disposition |
|---|---|
| W-1 V1 seven wording rules absent | **AGREE / FIXED** — `SURFACE-WORDING-001` in Part IX |
| W-2 V2 says “working” later than V1 | **INTENTIONAL** — Day +2 may say early movement is consistent; causal “working” waits for formal evidence |
| W-3 “looks appropriate so far” hedge | **AGREE / FIXED** — hold branch headline is `Hold the current dose` |

## Owner/product decisions

| Finding | Decision |
|---|---|
| O-1 below/above outer bound | Explicit urgent `SAFETY_RETURN` to the buffered destination inside the outer envelope; permanent maintenance remains separate |
| O-2 testing less often than weekly | Accept limitation; do not stretch 14-day window; app tells keeper the third test required |
| O-3 >60% potency discrepancy | Keep plausibility guard; verify Setup/context instead of silently learning extreme discrepancy |

---

# FREEZE 2 CANDIDATE — BUILDABILITY STATEMENT

**Direct design answer:**

V2 is structurally and mathematically cleaner than V1 even though the specification is larger.

Freeze 1, however, was **not fully buildable against the existing app as described**, because it failed to distinguish domain rules from unavailable product inputs.

The Freeze-2 candidate cycle corrected that by making app capability part of the canon; those corrections are retained in current Alk V2 Freeze 3.

The intended implementation split is:

### Core Alk V2 — buildable after required schema/UI fields
Includes:
- measurement/evidence engine;
- observed/supported slopes;
- maintenance recommendations;
- intervention snapshots for new changes;
- corrections / water-change segmentation;
- outer-bound safety return;
- cards/wording contract.

### Empirical potency learning — capability-gated
The mathematics remains canonical, but automatic empirical learning must remain disabled until its context/timestamp/dose-state fields are implemented.

The first implementation phase may therefore ship using theoretical/configured potency without weakening the core controller.

This is preferable to either:
- silently assuming missing context; or
- blocking the entire V2 controller on an optional calibration layer.



## Freeze 2 Claude recheck — current disposition

The Freeze 2 recheck verified all Freeze 1 findings as fixed. fileciteturn14file0

New findings:

```text
N-1  high breach + uninterpretable consumption     FIXED
N-2  composite safety + maintenance rail           FIXED
N-3  completion exactly at outer edge              FIXED
N-4  safety-return intervention/cross-parameter integration
                                                    RESOLVED — OPTION B / FIXED
M-10 empirical historical bracket capability       FIXED / NOT_RUN fallback
```

**Historical note:** this candidate gate was subsequently passed; current Alk authority is Freeze 3.



## Freeze 2 owner decision — N-4 magnesium precedence

Rule reference: `ALK-SAFETY-MG-OVERRIDE-001`

**Decision:** OPTION B.

Rationale retained in canon:
- an actual Alk outer-bound breach remains actionable even when magnesium is alert-low;
- low Mg is surfaced as a reason the Alk result may be harder to hold, not as a reason to suppress the urgent Alk safety action;
- ordinary Alk/Ca correction rules may still retain the Mg gate;
- this exception belongs only to the Alk outer-bound `SAFETY_RETURN`.



# PART III — FREEZE 2 FINAL REVIEW CLOSURE

**External focused reviewer:** Claude  
**Date:** 2026-08-19  
**Result:** All ten focused safety-path checks PASS. fileciteturn21file0

Final minor findings closed before freeze:

```text
F-1  safety + maintenance composite rail wording
     CLOSED — safety case always defers maintenance; no unreachable partial-reduction branch

F-2  B_safety apparent adaptivity
     CLOSED — explicitly documented as fixed 0.20 dKH controller constant in Freeze 2

F-3  M-1 actuator-increment refusal versus SAFETY_RETURN
     CLOSED at Freeze 5 — M-1 applied to maintenance mL/day; the one-off safety correction
     was explicitly exempt. RECLASSIFIED INAPPLICABLE by owner decision 23: the refusal it
     needed an exemption from no longer exists

N-6  ALK-022 D_eff pointer to M-6
     CLOSED — inline M-6 delivery-basis semantics added
```

No substantive focused safety finding remains open.


# PART III — Implementation directive

**Status:** Alk V2 Freeze 4 is frozen. Do not treat empirical potency learning as available merely because its mathematics is specified.

Core Alk V2 may be implemented subject to:
- all Parts I–III invariants;
- all canonical golden scenarios;
- the Part III capability/degradation contract;
- the Part IX wording contract;
- V1→V2 comparison;
- no reintroduction of V1 raw-mL staging or confidence multipliers;
- no maintenance action from materially negative/uninterpretable consumption;
- no UI-local slope/dose calculation;
- no silent defaults for missing required capability fields.

### Required schema/UI dependencies for core actionable Alk control

At minimum:
- precise `measuredAt` for new V2 measurements;
- dose-event `recordedAt` / `effectiveAt` / confidence;
- `recommendationPrecisionMlPerDay`;
- configured/theoretical potency inputs;
- persistent intervention prediction snapshot for new V2 interventions.

### Empirical potency learner

Implement its schemas/tests if desired, but keep automatic empirical learning:

```text
CAPABILITY_GATED
```

until the data requirements in `ALK-POTENCY-CAPABILITY-GATE-001` are satisfied.

The core controller must remain functional using validated theoretical/configured potency while the learner is gated.

Any newly discovered substantive V1/V2 conflict must return to canon review rather than being chosen silently in code.


---


# PART III — ALK V2 FREEZE 3 DECLARATION — HISTORICAL

**Freeze identifier:** `ALK_V2_FREEZE_3`  
**Frozen:** 2026-08-19  
**Superseded by:** `ALK_V2_FREEZE_4`

Freeze 3 closed the shared `Sxx` uncertainty mismatch. Repository inspection later identified additional canon-completeness/capability gaps, requiring a governed reissue rather than an in-place patch.

---

# PART III — ALK V2 FREEZE 4 DECLARATION — HISTORICAL

**Freeze identifier:** `ALK_V2_FREEZE_4`  
**Status:** SUPERSEDED — 2026-08-19  
**Superseded by:** `ALK_V2_FREEZE_5`  
**Scope:** Part III behavioural canon and its explicitly referenced active shared/governing rules as incorporated at freeze time.

Freeze 4 remains the record of what was frozen at that point. Its closure items and policy
statement below are unchanged and are carried forward by Freeze 5.

### Freeze 4 closure items

Freeze 4 adds/clarifies:

1. explicit `ALK-ROUNDING-001` rule body, preserving the already-settled nearest/tie-toward-current policy and hard-constraint recheck;
2. explicit shared definition of `CONSUMPTION_CONTEXT_CHANGE` for potency-learning eligibility;
3. M-12 effective-dated configuration missing-data behaviour;
4. M-13 legacy absolute-time/timezone provenance missing-data behaviour;
5. mechanical canon reference/coverage integrity under `CORE-CANON-COVERAGE-001`;
6. new worked goldens/invariants for the implementation-discovered cases.

### Policy statement

This is a **canon-completeness/capability freeze**, not a redesign of the Alk controller.

The frozen owner decisions remain:
- stabilise first;
- current position from latest valid measurement;
- `ALK_SLOPE_SUPPORT_K = 1.28`;
- `sigma_Alk_base = 0.10 dKH`;
- ordinary 25% / exceptional 50% cap policy;
- 0.50 dKH/day rail;
- negative/uninterpretable consumption does not size ordinary maintenance;
- two-stage intervention assessment;
- magnesium safety interface remains `UNKNOWN` in the Alk-only migration phase.

### Freeze status at Freeze 4 (historical)

```text
behaviouralCanon = ALK_V2_FREEZE_4
sharedArchitectureCanon = SHARED_V2_FREEZE_2
implementationConformance = NOT_YET_PROVEN
productionMigration = NOT_YET_PERFORMED
empiricalPotencyLearning = CAPABILITY_GATED
```

### Reopening rule (as stated at Freeze 4)

Do not silently edit Alk behaviour after this marker.

Any future Alk behavioural or load-bearing completeness change requires:
- exact affected rule IDs;
- concrete failure scenario;
- canon vs implementation classification;
- affected coverage fixture updates;
- `IMPACTS_FROZEN_ALK` where caused by a shared change;
- Alk V2 Freeze 5 or later.

Freeze 5 was raised under exactly that rule and satisfies each of its requirements.

---

# PART III — ALK V2 FREEZE 5 DECLARATION

**Freeze identifier:** `ALK_V2_FREEZE_5`  
**Status:** FROZEN — 2026-08-19  
**Supersedes:** `ALK_V2_FREEZE_4`  
**Shared architecture:** `SHARED_V2_FREEZE_2`, unchanged  
**Scope:** bounded closure of the Alk implementation-preparation blocking register. Part III
behavioural canon and its explicitly referenced active shared/governing rules as
incorporated at freeze time.

### Reason

`docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md` classified 40 issues found while turning
Freeze 4 into an implementable specification. Eleven were **blocking**: the dependent output
could not be emitted at all, and the package shipped explicit refusals in their place. Eight
of the register's items were `OWNER_DECISION_REQUIRED` — a genuine product or chemistry
judgement, not a reading of the text.

The owner has decided them. Freeze 5 writes those decisions into the canon so the behaviour
has a freeze, a coverage fixture and a governed reissue path, which a decision recorded
anywhere else would not have.

This is a **determination freeze**: it fixes behaviour that was previously undetermined. It
does not redesign the Alk controller and changes no already-determined numeric rule.

### Owner decisions encoded

| Decision | Rule ID created or amended | Closes |
|---|---|---|
| F5-01 forward-greedy independent-cluster selection | `ALK-INDEPENDENT-SELECTION-001` (new, under `ALK-008`) | `OI-INDEPENDENCE-001` |
| F5-02 no automatic statistical suspect threshold | `ALK-SUSPECT-DETECTION-001` (new, `ALK-005A`) | `OI-SUSPECT-001`, `OI-MADFLOOR-001` |
| F5-03 materially-negative consumption boundary | `ALK-NEGATIVE-MATERIALITY-001` (new, in `ALK-031`) | `OI-NEGCONS-001` |
| F5-04 return-plan trajectory eligibility | `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` (new, in `ALK-054`) | `OI-RETURNOFFER-001` |
| F5-05 do not oppose a supported trajectory toward range | `ALK-TOWARD-RANGE-HOLD-001` (new, `ALK-030A`); `ALK-029`, `ALK-030`, `ALK-070` amended | `OI-BELOWRISING-001` |
| F5-06 liquid-volume guard scope, withholding and position | `ALK-LIQUID-VOLUME-GUARD-001` amended; `ALK-ROUNDING-001` step 6 and `ALK-049` amended | `OI-LIQUIDGUARD-001`, part of `OI-PIPELINE-001` |
| F5-07 rapid basis is the latest independent pair | `ALK-RAPID-BASIS-001` (new, in `ALK-013`) | `OI-RAPIDBASIS-001` |
| F5-08 safety return terminates an active return plan | `ALK-RETURN-TERMINATED-BY-SAFETY-001` (new, `ALK-SAFETY-RETURN-INTEGRATION-001` §5) | `OI-RETURNDURINGSAFETY-001` |
| F5-09 one authoritative Alk retest scheduler | `ALK-RETEST-SCHEDULER-001` (new, `ALK-053A`) | `OI-RETEST-001` |
| F5-10 only `MEASURED_SAME_BATCH` normalizes a water change | `ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001` (new, in `ALK-033`) | `OI-WATERCHANGE-001` |
| F5-11 temporary high-breach safety rate is advisory-emittable | `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` (new, in `ALK-003A`) | `OI-SAFETYRATE-001` |
| F5-12 `recommendationConfidence = UNSPECIFIED` | `ALK-CONFIDENCE-OUTPUT-001` amended (`ALK-071`) | `OI-CONFIDENCE-001` |
| F5-13 no zero-dose pause on an uncertainty-limited negative estimate | `ALK-HIGH-BREACH-NO-PAUSE-001` (new, in `ALK-031`) | `OI-HIGHBREACHBAND-001` |
| F5-14 coalesce same-timestamp clusters before selection | `ALK-SAME-TIMESTAMP-COALESCE-001` (new, under `ALK-008`) | `OI-CLUSTERTIE-001` |
| F5-15 24 h floor on the ordinary signal candidate | `ALK-RETEST-SCHEDULER-001` amended (`ALK-053A`) | `OI-RETESTFLOOR-001` |
| **16** high-breach safety sizing when consumption is unusable | `ALK-HIGH-BREACH-SAFETY-SIZING-001` (new, in `ALK-003A`); `ALK-HIGH-BREACH-UNRESOLVED-001`, `ALK-HIGH-BREACH-NO-PAUSE-001`, `ALK-SAFETY-TEMP-RATE-RESOLUTION-001`, `WG-ALK-051` amended | `OI-HIGHBREACHSIZING-001` |
| **17** one canonical Alk testing episode | `ALK-TESTING-EPISODE-001` (new, `ALK-005B`); `ALK-REPEAT-SPREAD-DOMAIN-001` (new, in `ALK-005`); `ALK-SAME-TIMESTAMP-COALESCE-001` amended | `OI-EPISODE-001` |
| **18** repeat-spread domain and exact decimal thresholds | `ALK-REPEAT-SPREAD-DOMAIN-001` (new, in `ALK-005`); `ALK-DECIMAL-THRESHOLD-001` (new, `ALK-005E`) | `OI-CROSSMETHOD-001`, `OI-DECIMALTHRESHOLD-001` |
| **19** one episode output for every Alk consumer | `ALK-EPISODE-RESOLUTION-001` (new, `ALK-005C`); `ALK-EPISODE-SINGLE-OUTPUT-001` (new, `ALK-005D`); `ALK-010` and `ALK-RAPID-BASIS-001` amended | `OI-EPISODECONSUMER-001` |
| **20** `D_established` renamed and split into two distinct quantities | `ALK-DELIVERY-RATE-BASIS-001` (new, in `ALK-022`); `ALK-HIGH-BREACH-SAFETY-SIZING-001`, `ALK-CONSUMPTION-ESTIMATE-001`, `ALK-031` amended | `OI-DELIVERYRATEBASIS-001`; **opens** `OI-BRANCHAREFUSAL-001` |
| **21** advisory ceiling and floor — escalate rather than calculate (**superseded by decision 24**) | `ALK-ADVISORY-RANGE-BOUNDARY-001` (new, in `ALK-003A`); `ALK-HIGH-BREACH-SAFETY-SIZING-001`, `ALK-OUTER-BOUND-ACTION-001`, `ALK-031`, `ALK-EPISODE-SINGLE-OUTPUT-001` (`ALK-005D`), `ALK-DECIMAL-THRESHOLD-001` (`ALK-005E`) amended | narrowed `OI-SIZINGFLAT-001` without closing it — **decision 24 removed that narrowing**; **opened** `OI-ADVISORYEXCEPTION-001`, `OI-ADVISORYMEMBERS-001`, `OI-ADVISORYRETEST-001`, `OI-ADVISORYRETURN-001`, **all four now RESOLVED by decisions 24 and 26** |
| **22** uncomputable consumption under high breach | `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001` (new, in `ALK-003A`) | `OI-UNCOMPUTABLEC-001` |
| **23** the application is recommend-only; there is no actuator | `ALK-RECOMMEND-ONLY-001` (new, in `ALK-001`); `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` and `ALK-SAFETY-CORRECTION-RESOLUTION-001` **RETIRED**; `ALK-ROUNDING-001`, `ALK-049`, `ALK-STEP-CAP-001`, `ALK-CAPABILITY-CONTRACT-001` (`M-1`), `ALK-LIQUID-VOLUME-GUARD-001`, `ALK-SAFETY-RETURN-INTEGRATION-001` amended | `OI-SAFETYRATE-001` reclassified **INAPPLICABLE** |
| **24** the advisory boundary is a warning, not a refusal | `ALK-ADVISORY-RANGE-BOUNDARY-001` rewritten; `ALK-EPISODE-SINGLE-OUTPUT-001`, `ALK-031`, `ALK-HIGH-BREACH-SAFETY-SIZING-001` amended | `OI-ADVISORYEXCEPTION-001`, `OI-ADVISORYRETURN-001`, `OI-ADVISORYMEMBERS-001`; `OI-SIZINGFLAT-001` **stays open and is no longer narrowed** |
| **25** branch A refuses on an unknown `D_current` | `ALK-DELIVERY-RATE-BASIS-001` amended (pre-branch precondition); `ALK-HIGH-BREACH-SAFETY-SIZING-001` amended | `OI-BRANCHAREFUSAL-001` |
| **26** one retest answer | `ALK-ADVISORY-RANGE-BOUNDARY-001` amended; `ALK-RETEST-SCHEDULER-001` confirmed sole authority | `OI-ADVISORYRETEST-001` |
| **27** the application does not know the test method | `ALK-REPEAT-SPREAD-DOMAIN-001` rewritten; `ALK-TESTING-EPISODE-001`, `ALK-EPISODE-RESOLUTION-001`, `ALK-EPISODE-SINGLE-OUTPUT-001`, `ALK-010`, `ALK-RAPID-BASIS-001`, `ALK-SAME-TIMESTAMP-COALESCE-001`, `ALK-RETEST-SCHEDULER-001`, `ALK-ADVISORY-RANGE-BOUNDARY-001` and `ALK-005`'s method escape clause amended | `OI-METHODUNKNOWN-001` |
| **28** repeats are measurements within 30 minutes, and the count is stated | `ALK-TESTING-EPISODE-001` rewritten | `OI-EPISODEMEMBERSHIP-001` |
| **29** the advisory warning field has two states | `ALK-ADVISORY-RANGE-BOUNDARY-001` amended | `OI-ADVISORYWARNSTATE-001` |

All eleven blocking items are closed, and so are the three items independent review of the
first encoding opened. Every withheld output they gated now has a determined value or a
**canonised** `NOT_RUN`.

### Decisions 16–19 — what they supersede

Independent review of the F5-13/14/15 amendments reported six findings that could change an
recommendation, a safety action, evidence selection, outer-bound classification,
`rapidConfirmed` or a retest output. They were reported rather than resolved. The owner then
decided them as decisions 16–19, which are part of `ALK_V2_FREEZE_5` and **supersede the
earlier Freeze-5 wording wherever they conflict**:

| Superseded | By | Effect |
|---|---|---|
| `ALK-HIGH-BREACH-UNRESOLVED-001`'s automatic pause to 0 mL/day | `ALK-HIGH-BREACH-SAFETY-SIZING-001` | zero is a floor reached by sizing, never a classification's choice |
| `ALK-HIGH-BREACH-NO-PAUSE-001`'s HOLD of the established delivery rate | `ALK-HIGH-BREACH-SAFETY-SIZING-001` | the delivered rate is sized from `R_down` and the established dose |
| `ALK-SAME-TIMESTAMP-COALESCE-001`'s exact-timestamp-only membership | `ALK-TESTING-EPISODE-001` | membership is the episode; a three-minute offset changes nothing |
| `ALK-SAME-TIMESTAMP-COALESCE-001`'s pooling of incompatible methods | `ALK-EPISODE-RESOLUTION-001` | *(as decided in 17–19; **further superseded by owner decision 27**, which retires method and the contested state — every measurement inside an episode now pools)* incompatible methods are contested, never averaged |
| `ALK-005`'s 0.20 dKH applied across methods | `ALK-REPEAT-SPREAD-DOMAIN-001` | *(as decided in 17–19; **further superseded by owner decision 27**, which retires the same-method/cross-method distinction — 0.20 dKH applies to every measurement in the episode without qualification)* 0.20 dKH is a same-method repeat threshold only |
| binary64 deciding a canonical decimal threshold | `ALK-DECIMAL-THRESHOLD-001` | exact decimal comparison; `0.20 > 0.20` is false |
| any consumer choosing among raw measurements in one episode | `ALK-EPISODE-SINGLE-OUTPUT-001` | position, rapid, selection and forecast all read one resolved value |

The findings closed are `F5-13-NO-SAFETY-RATE`, `F5-13-BAND-WIDTH` (as a sizing issue),
`F5-14-POSITION-ORDER`, `F5-14-RAPID-SCOPE`, `F5-14-EPSILON`, `ALK-005-FP-BOUNDARY` and
`F5-14-ALK005-DOMAIN`. Their register entries are section A3 of
`docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md`.

### Decisions 20–22 — what they supersede

Review of the decisions 16–19 encoding reported further findings against the high-breach
safety path. The owner decided three of them as decisions 20, 21 and 22, which are part of
`ALK_V2_FREEZE_5` and **supersede the earlier wording wherever they conflict**:

| Superseded | By | Effect |
|---|---|---|
| `D_established` as a single name for both the configured rate and the interval-mean delivered rate | `ALK-DELIVERY-RATE-BASIS-001` | two named quantities, `D_current` and `D_history`; `D_established` is not a live name |
| Superseded wording `D_safety,temp = max(0, D_established − R_down/P_selected)` | `ALK-HIGH-BREACH-SAFETY-SIZING-001` (amended) | the sizing input is `D_current`; `D_history` may not be substituted |
| an unknown delivered rate treated as sizable | `ALK-DELIVERY-RATE-BASIS-001` | unknown `D_current` **refuses**: no rate, no command, and **not** 0 mL/day |
| `C_estimate = P_selected · D − S_observed` with an unnamed interval `D` | `ALK-CONSUMPTION-ESTIMATE-001` (amended) | the interval quantity is `D_history`, named |
| the engine advising at any distance outside the outer envelope | `ALK-ADVISORY-RANGE-BOUNDARY-001` | at or beyond `OuterMax + 1.0 dKH` / `OuterMin − 1.0 dKH` the engine escalates and withholds delivery guidance |
| a high breach with a non-computable `C_estimate` falling through with no branch | `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001` | branch B′ sizes from `D_current`; the maintenance estimate stays `UNRESOLVED` |

Decision 21 introduces **one offset**, ±1.0 dKH from the already-configured outer bounds,
and no free-standing level. Decisions 20 and 22 introduce **no constant at all**.

`OI-SIZINGFLAT-001` (sizing flat above the rail) and `OI-CZERODISCONT-001` (the branch A/B
discontinuity at `C_estimate = 0`) are **deliberately left open**. Decision 21 narrows the
first by bounding the region it applies to; neither is closed, and no branch boundary was
moved to reduce the second.

### The three amendments

Review of the first Freeze-5 encoding found three points where writing a decision into the
canon required a **second** decision. Each was left undetermined with an explicit refusal
rather than resolved by derivation, and each was then decided by the owner as F5-13, F5-14
and F5-15. The register items they opened — `OI-HIGHBREACHBAND-001`, `OI-CLUSTERTIE-001`
and `OI-RETESTFLOOR-001` — are closed by those amendments.

Owner decision 27 retires the contested-episode state, so **no Alk output is withheld
anywhere in this freeze on the ground that an episode is contested.** Stated precisely, so
it is not over-read: the contested branch and its withheld `position`, `outerBoundState` and
`rapidConfirmed` are gone. Withholding on **other** grounds is untouched — in particular an
episode whose pooled spread exceeds `ALK-005`'s 0.20 dKH is `ANOMALOUS` and takes Part II
§48's path exactly as any anomalous cluster does, which is a shared-canon route that
decision 27 neither reaches nor changes. The paragraph below is the pre-decision-27
statement and is preserved for history.

Nothing in F5-01 … F5-15 withholds an output for want of an owner decision. Decisions 17–19
do withhold `position`, `outerBoundState` and `rapidConfirmed` on a contested episode — that
is the decided behaviour, and the items it depends on that remain open are named under
*Deliberately left open* below rather than implied.

### Constants

Freeze 5 introduces **no new numeric constant.** Every threshold it uses is already frozen:

```text
ALK_SLOPE_SUPPORT_K = 1.28          # F5-03 materiality boundary, F5-13 branch test
sigma_Alk_base      = 0.10 dKH      # F5-09 T_signal numerator
24 h independence   = ALK-008       # F5-01 selection, F5-07 rapid pair
24 h safety cadence = ALK-052       # F5-09 forecast safety lead, F5-15 signal floor
48 h routine        = ALK-050       # F5-09 routine candidate
~Day 4              = ALK-053       # F5-09 ordinary-observation ceiling
2% of net volume    = ALK-061       # F5-06 liquid guard
0.20 dKH spread     = ALK-005       # F5-02 operative SUSPECT source,
                                    # F5-14 spread of a coalesced pool
```

F5-14 introduces no constant at all: it pools measurements and re-applies Part II §5.4-§5.6
and `ALK-005` to the larger pool.

Decisions 16–19 introduce **no new numeric constant either**:

```text
0.50 dKH/day rail   = ALK-046       # decision 16, R_down saturation
A_safe,high         = ALK-003A      # decision 16, R_down
P_selected          = ALK-014/016   # decision 16, dose-equivalent of R_down
D_current           = doser configuration   # not a constant
                                            # renamed from D_established by decision 20
D_history           = interval-mean rate    # renamed from the bare D of ALK-022 by
                                            # decision 20; not a constant
30 min episode window = ALK-005 / Part II §5.3   # decision 17 membership
0.20 dKH spread     = ALK-005       # decision 18; decision 27 removes the domain qualifier
```

Decision 18 explicitly **forbids** an epsilon for the decimal comparison, and forbids a
cross-method concordance threshold; decision 16 explicitly **forbids** a new ceiling for the
\(1.28\sigma_S\) maintenance-classification band. Both absences are canonised as `NOT_RUN`
rather than filled.

**Decisions 20–22 introduce exactly one new constant, and it is an offset:**

```text
advisory range offset = 1.0 dKH     # decision 21, the ONLY new number
                                    # AdvisoryCeiling = OuterMax + 1.0 dKH
                                    # AdvisoryFloor   = OuterMin - 1.0 dKH
                                    # a boundary is an OFFSET from the configured
                                    # bounds, never a free-standing pinned level
D_current           = doser configuration          # decision 20, renamed, not a constant
D_history           = interval-mean delivery rate  # decision 20, renamed, not a constant
```

Decision 20 renames and separates quantities the canon already carried and introduces no
number. Decision 22 adds a branch over the state space and introduces no number: it reuses
\(R_{down}\), the 0.50 rail, \(P_{selected}\) and \(D_{current}\).

**Decisions 23–26 introduce no constant at all.**

```text
recommendationPrecisionMlPerDay = the RENAMED recommendationPrecisionMlPerDay, same value,
                                  now a display convention rather than a device
                                  capability (decision 23). Not a new constant.
advisory range offset = 1.0 dKH   unchanged by decision 24; only what happens at the
                                  boundary changes, from withholding to warning.
```

Decision 23 **removes** a configured quantity's meaning rather than adding one; decisions
24, 25 and 26 change where a rule is evaluated and what it emits, using only quantities the
canon already froze.

No epsilon exists for the advisory-boundary comparison. `ALK-DECIMAL-THRESHOLD-001`'s exact
decimal semantics govern it, and the comparison is inclusive at the boundary.

`sigma_P`, `sigma_D`, `K_detect`, a generic `RequiredMovement`, a `boundarySafetyMargin`
distinct from the 24 h lead, a `minimumExposure`, a scheduler minimum useful interval, an
Alk `Z` threshold and numeric confidence thresholds are all deliberately **not**
introduced.

### Carried forward unchanged

The frozen owner decisions of Freeze 4 all stand:
- stabilise first;
- current position from latest valid measurement;
- `ALK_SLOPE_SUPPORT_K = 1.28`;
- `sigma_Alk_base = 0.10 dKH`;
- ordinary 25% / exceptional 50% cap policy;
- 0.50 dKH/day rail;
- negative/uninterpretable consumption does not size ordinary maintenance;
- two-stage intervention assessment;
- magnesium safety interface remains `UNKNOWN` in the Alk-only migration phase.

`ALK-STABLE-001` is unchanged. `ALK-SLOPE-UNCERTAINTY-001` is unchanged. No canonical
worked golden's stated arithmetic is altered.

### Deliberately left open

Freeze 5 is bounded. These remain open and are **not** decided here:

- automatic statistical suspicion detection, and with it the lone-outlier exposure recorded
  as `OI-MADFLOOR-001` — the residual is accepted, named and un-compensated;
- `T_detect` and the return-plan arrival cadence — canonically `NOT_RUN`;
- numeric confidence classification;
- the potency-confidence state machine and its `REASSESSING` exit (`OI-POTENCYSTATE-001`,
  `OI-POTENCYSNAP-001`), which remain capability-gated;
- normalization uncertainty propagation (`OI-NORMUNCERT-001`);
- minimum post-change exposure (`OI-EXPOSURE-001`);
- `ALK-037`'s Day-4 wording (`OI-DAY4-001`) and `ALK-012`'s illustrative examples
  (`OI-STABLE-001`), both documentation defects whose normative text already governs;
- ~~**method compatibility classification** and **cross-method concordance**~~ — both were
  canonised `NOT_RUN` deferrals at decision 18 and are **retired** by owner decision 27, not
  still open: the application never knows the method, so neither has a question left to
  answer;
- **a ceiling for the \(1.28\sigma_S\) maintenance-classification band** — decision 16
  removes it from safety sizing and deliberately leaves its width uncapped;
- ~~**outer-bound classification from a contested episode**~~ — retired by owner decision 27
  with the contested state itself; an episode's combined observation is classified in the
  ordinary way;
- **Part II §5.3's method-conditional grouping wording**, which is shared canon under
  `SHARED_V2_FREEZE_2` and is inoperative for alkalinity but not yet edited there
  (`OI-PII53METHOD-001`);
- **whether Part II §5.3's "no relevant intervention between them" condition survives owner
  decision 28's "no exceptions"** (`OI-EPISODEINTERVENTION-001`). The condition is
  **retained** for now, which is the status quo and the conservative reading;
- **whether the 30-minute window is measured pairwise between consecutive measurements or
  from the first measurement of an episode** (`OI-EPISODEANCHOR-001`). For an episode of two
  the two readings agree; for three or more spanning more than 30 minutes end to end they do
  not. No fixture depends on it;
- **the governance of the 30-minute window itself** (`OI-EPISODEWINDOW-001`) — Part II §5.3
  calls it an implementation constant "subject to implementation review" and "not a
  chemistry threshold", and owner decision 28 makes it the whole membership test without
  freezing it as one;
- **safety sizing is flat above the rail** (`OI-SIZINGFLAT-001`) — once
  \(A_{now}-A_{safe,high}\ge0.50\), \(R_{down}\) saturates and \(D_{safety,temp}\) stops
  responding to the level. Decision 21 narrowed the exposure by bounding the region;
  **owner decision 24 removed that bound**, so the item is **no longer narrowed at all**
  and its reach is wider than it was under decision 21: the flatness now runs from
  \(A_{safe,high}+0.50\) **upward without limit**. It is emphatically not closed;
- **the five items opened by review of the decisions 20–22 encoding are all now RESOLVED**
  by owner decisions 24, 25 and 26, and their `RECORDED EXPOSURE` blocks have been replaced
  in place by `RESOLVED` blocks in the rules they affected: `OI-BRANCHAREFUSAL-001`
  (decision 25 — the refusal is a precondition evaluated before branch selection, applying
  identically to A, B and B′), `OI-ADVISORYEXCEPTION-001`, `OI-ADVISORYRETURN-001` and
  `OI-ADVISORYMEMBERS-001` (decision 24 — nothing is withheld at the boundary, so there is
  no exception list to close, no return plan to terminate and no member-wise predicate to
  interpret), and `OI-ADVISORYRETEST-001` (decision 26 — the scheduler is the single retest
  authority and the warning renders its answer). **None of the five is still open**, and
  this list is not authority for their status: the register in
  `docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md` is;
- **the sized-rate discontinuity at \(C_{estimate}=0\)** (`OI-CZERODISCONT-001`) — branch A
  sizes from consumption and branch B/B′ from \(D_{current}\), and the two need not meet at
  \(C_{estimate}=0\). Decision 22 adds the missing B′ branch and explicitly does **not**
  address this; no branch boundary was moved to reduce it.

### Freeze status

```text
behaviouralCanon = ALK_V2_FREEZE_5
sharedArchitectureCanon = SHARED_V2_FREEZE_2
implementationConformance = NOT_YET_PROVEN
productionMigration = NOT_YET_PERFORMED
empiricalPotencyLearning = CAPABILITY_GATED
```

### Reopening rule

Do not silently edit Alk behaviour after this marker.

Any future Alk behavioural or load-bearing completeness change requires:
- exact affected rule IDs;
- concrete failure scenario;
- canon vs implementation classification;
- affected coverage fixture updates;
- `IMPACTS_FROZEN_ALK` where caused by a shared change;
- Alk V2 Freeze 6 or later.

---


# PART IV — CALCIUM ENGINE

**Status:** Pending Alk V2 implementation/conformance.

Calcium will share the architecture but define its own uncertainty, cadence, evidence and response times. It must not inherit alkalinity timing merely because the code is reusable.

---

# PART V — MAGNESIUM ENGINE

**Status:** Pending Alk V2 implementation/conformance and Calcium V2 design.

The V1 rule that magnesium maintenance is never tuned from readings is explicitly **REVALIDATE SCIENTIFICALLY**, not automatically carried forward and not automatically deleted. V2 must decide whether hobby-scale magnesium consumption can be inferred reliably enough to support any maintenance adjustment and, if so, under what evidence burden.

---

# PART VI — THREE-PART / IONIC COUPLING

**Status:** Pending.

The chemically useful V1 idea that calcium and alkalinity consumption are related is retained as a plausibility/advisory layer. It must not be used to erase a directly supported independent calcium or alkalinity trend.

---

# PART VII — TRACE ELEMENTS & ICP

**Status:** Pending.

Trace-element logic will be event-, correction-, ICP- and maintenance-oriented rather than copied from the Alk controller.

---

# PART VIII — NUTRIENTS, SALINITY & AMMONIA

**Status:** Pending.

V1's key principle survives: one engine does **not** imply one algorithm.

- phosphate requires phosphate-specific persistence logic;
- nitrate may support directional behaviour differently from phosphate;
- salinity needs its own movement/materiality rules;
- ammonia does not naturally fit an ordinary target-range trend model.

---

# PART IX — SURFACES, MESSAGING & NOTICES

**Status:** Core wording contract locked; detailed surface layouts remain implementation work.

The strongest V1 presentation principles are retained architecturally:

- one engine owns the verdict;
- surfaces render rather than recompute;
- history records what the app said at the time;
- position is based on the latest valid measurement;
- recommendation is distinct from actual action.

The V1 reference cards remain acceptance fixtures, but they are mapped from V2 structured state rather than used as the chemistry state machine.

---

## IX-001 — Global V1 wording rules retained

`SURFACE-WORDING-001`

These rules apply to every generated chemistry card, notice, receipt and recommendation unless a parameter-specific rule is stricter.

1. **State the conclusion, then show its basis.**  
   Do not bury the recommendation behind a long preamble.

2. **Do not speak in the first person.**  
   The app reports the engine's conclusion rather than anthropomorphising itself.

3. **Mention dose only when dose is relevant to the current conclusion.**  
   Position-only or testing-only messages should not manufacture dosing language.

4. **Always include units with chemical values and rates.**  
   Examples: `8.4 dKH`, `−0.05 dKH/day`, `10.5 mL/day`.

5. **Do not speculate about causes the evidence does not establish.**  
   A contradictory response may trigger verification; it does not become “your pump failed” or “coral uptake increased” without evidence.

6. **A recent dose/intervention state takes presentation precedence over generic steady-state wording.**  
   Example: after a dose change, use `AWAITING_FORMAL_POST_SLOPE` rather than a generic steady-state headline that ignores the intervention context.

7. **Do not redundantly name the parameter in a headline unless the sentence needs it for clarity.**  
   The surrounding surface already identifies the parameter.

These are behavioural acceptance rules, not optional copy style.

---

## IX-002 — Evidence claims may not outrun the engine

A card may describe exactly what its evidence state supports.

At Day +2 after a maintenance change, when the first interval is directionally consistent:

```text
Early readings are moving in the expected direction.
Hold the current dose and test again in 2 days.
```

is permitted.

```text
The dose change is working.
```

is **not** permitted until formal response evidence supports a favourable classified response.

This is an intentional V2 change from V1's earlier Day-2 “working” wording.

The extra delay is deliberate: V1's wording was more encouraging but claimed causality before the non-overlapping response slope existed.

---

## IX-003 — Small-signal attribution wording

For `NOT_ATTRIBUTABLE_SMALL_SIGNAL`, do not headline the statistical limitation.

### Hold branch

Required semantic headline:

> **Hold the current dose**

Required body meaning:

> The current readings do not support another maintenance change. The previous dose change was too small to isolate confidently from the earlier alkalinity trend. Continue on the current dose and test again at the scheduled time.

Then show:
- current Alk;
- observed slope;
- supported slope;
- next test.

Do not use:

> “The current dose looks appropriate so far”

because the action conclusion is more precise and does not hedge beyond the engine state.

### Residual mismatch branch

Permitted semantic headline:

> **Alkalinity is falling on the current dose**

Do not say “still falling” when causal continuity through the previous intervention was not established.

---

## IX-004 — Recommendation is not implementation

If the app recommends:
- a maintenance dose;
- a temporary correction;
- stopping a return plan;

but cannot verify the user's pump/manual action, wording must say what is **recommended**, not what has physically occurred.

History stores:
- recommendation;
- user-confirmed implementation;
- actual/verified state where available;

as separate facts.

---

## IX-004A — Unresolved prior guidance does not become a punitive lockout

`SURFACE-INFORM-PROCEED-001`

When prior guidance is confirmed not implemented, current messaging follows `CORE-INFORM-PROCEED-001`.

The surface may say:
- what remains unresolved;
- how it may affect the expected outcome;
- what the keeper should do now.

It must not:
- shame the keeper;
- refuse valid current advice merely because prior advice was ignored;
- imply implementation occurred when it did not;
- collapse unknown implementation into confirmed non-adherence.

If the unresolved issue actually makes the current recommendation unsupported, the card names the missing requirement and withholds only the affected output.

---

## IX-005 — Insufficient-data wording must be actionable

Do not show `INSUFFICIENT` as a dead-end label.

If ordinary Alk maintenance advice requires another measurement, tell the keeper:
- what is missing;
- when the next useful test should be taken;
- what can still be concluded now.

Example:

```text
Not enough recent alkalinity tests for a maintenance adjustment.
Add a third valid test within the current 14-day window.
Current alkalinity: 8.3 dKH.
```

---

## IX-006 — Outer-bound wording

`ALERT_LOW` / `ALERT_HIGH` is not presented in the same register as an ordinary out-of-target return-plan offer.

Semantic requirement:

```text
Alkalinity is below/above the outer operating range.
A safety return toward the buffered safety destination is recommended now.
```

The card then shows:
- current value;
- buffered safety destination;
- temporary safety action;
- separate maintenance conclusion where available;
- next test timing.

Do not call values “safe” or “unsafe” unless a future canon explicitly authorizes those terms.

---

# PART X — SIMULATION, GOLDEN SCENARIOS & MIGRATION

**Status:** Active throughout V2 development.

## X-001 — Simulation responsibility boundary

All simulations and golden scenarios are interpreted under:
- `CORE-ADVISORY-RESPONSIBILITY-001`;
- `CORE-INFORM-PROCEED-001`;
- `CORE-NONADHERENCE-COMPLEXITY-001`;
- `SIM-NONADHERENCE-001`.

A hostile simulation may reveal:
- a genuine engine defect;
- an engine-originated unsafe recommendation;
- invalid state evolution;
- uncontrolled oscillation;
- missing guards;
- or merely the biological consequence of repeated keeper non-adherence.

These are not interchangeable.

Before adding a new rule because a simulation ends badly, classify the failure:

```text
ENGINE_FAILURE
or
NONADHERENCE_OUTCOME
```

A `NONADHERENCE_OUTCOME` does not justify extra controller complexity unless the simulation also exposes an independent engine failure.


V1's extensive failure cases and golden scenarios are retained as regression evidence.

The migration rule is:

> V2 differences from V1 must be classified, not blindly eliminated and not blindly accepted.

Each difference is labelled:
- intended improvement;
- accepted design change;
- likely regression;
- unresolved;
- obsolete V1 behaviour.

---



## X-002 — First V2 runtime is Alkalinity-only

`MIGRATION-ALK-ONLY-001`

The first V2 implementation/runtime intentionally activates **Alkalinity only as an advisory controller**.

During this implementation-validation phase:

```text
Alkalinity:
    controller = V2
    advisoryActive = true

Calcium:
    measurementLogging = ON
    historyChart = ON
    activeController = NONE
    V1Runtime = OFF
    evidenceInference = OFF
    notifications = OFF
    advisoryCards = OFF

Magnesium:
    measurementLogging = ON
    historyChart = ON
    activeController = NONE
    V1Runtime = OFF
    evidenceInference = OFF
    notifications = OFF
    advisoryCards = OFF
    magnesiumGateState = UNKNOWN
```

### Calcium and Magnesium — measurement-only mode

`MIGRATION-INERT-CA-MG-MEASUREMENTS-001`

Calcium and Magnesium remain available as **recorded-fact parameters only**.

The app may:
- accept a manually entered Ca or Mg value;
- timestamp it using the normal measurement fact model;
- preserve measurement validity/status metadata;
- display historical values;
- plot those values on a chart;
- export/replay the raw recorded facts.

The app must **not** derive from those readings during this phase:
- trend;
- slope;
- evidence state;
- uncertainty-supported movement;
- consumption;
- potency;
- maintenance recommendation;
- correction/return plan;
- intervention state;
- retest schedule;
- notification;
- advisory card/verdict;
- cross-parameter gate state.

The readings are facts only under the Part I four-truth model.

They are not inputs to an active Ca/Mg domain controller because no frozen Ca/Mg V2 controller exists yet.

### Magnesium gate isolation

`MIGRATION-MG-GATE-ISOLATION-001`

During the Alk-only V2 runtime:

```text
magnesiumGateState = UNKNOWN
```

**always**, regardless of the latest logged magnesium value.

A raw Mg reading must not be transformed directly into:

```text
ALERT_LOW
```

or:

```text
NOT_ALERT_LOW
```

until the future Magnesium/coupling canon explicitly defines:
- the alert threshold;
- valid measurement requirements;
- freshness;
- uncertainty/quality treatment;
- ownership of the derived gate state.

This prevents measurement logging from becoming an undeclared Magnesium controller by the back door.

Part III already defines the Alk behaviour for:

```text
magnesiumGateState = UNKNOWN
```

so Alk safety logic remains deterministic:
- the Alk safety return is not blocked;
- no low-Mg warning is invented.

### No active V1 Ca/Mg runtime

For the first V2 runtime:
- do not run V1 Ca/Mg advisory engines beside V2 Alk;
- do not render V1 Ca/Mg verdicts through V2 surfaces;
- do not send V1 Ca/Mg notifications;
- do not create compatibility logic merely to preserve temporary V1 advice;
- V1 Ca/Mg source/canon may remain in the repository as **reference material only**.

### Historical-data limitation

Future Ca/Mg controller design may use these measurements as historical facts for:
- observed range;
- variability;
- chronology;
- fixture generation;
- validation against real tank histories.

However, a historical measurement alone does **not** create historical dose context.

If historical Ca/Mg:
- programmed dose states;
- effective dose-change times;
- solution context;
- delivery context;
- corrections;

were not recorded, a future V2 controller must not retrospectively invent them.

Therefore old measurement-only history may be useful for position/history analysis while remaining ineligible for historical consumption or potency inference.

The product has no migration requirement to preserve active Ca/Mg advisory functionality during this internal development stage.

### Rationale

The purpose of the first V2 runtime is to prove:
- the shared domain architecture;
- Alk controller conformance;
- scheduler behaviour;
- messaging/notification timing;
- event/audit semantics;
- V1→V2 behavioural comparison.

Running legacy controllers at the same time adds migration complexity without helping validate those goals.

### Future activation

Calcium becomes active only after:
1. its V2 parameter canon is specified;
2. required goldens exist;
3. its canon is frozen;
4. implementation conforms.

Magnesium follows the same rule.

No future parameter may be labelled V2 merely because it is displayed inside a V2 shell.

---


## X-MIG-001 — Ca/Mg logging remains inert during Alk-only runtime

Inputs:

```text
runtime = ALK_V2_ONLY
logged Ca = 455 ppm at 2026-08-19T20:00
logged Mg = 1180 ppm at 2026-08-19T20:01
```

Required persisted facts:

```text
Ca measurement = STORED
Mg measurement = STORED
timestamps = STORED
history/chart eligibility = true
```

Required inactive outputs:

```text
Ca trend = NOT_RUN
Ca evidence = NOT_RUN
Ca maintenance = NOT_RUN
Ca notification = NONE

Mg trend = NOT_RUN
Mg evidence = NOT_RUN
Mg maintenance = NOT_RUN
Mg notification = NONE
magnesiumGateState = UNKNOWN
```

Forbidden:

```text
derive magnesiumGateState = ALERT_LOW from 1180 ppm
derive Ca/Mg trend from logged history
create Ca/Mg retest schedule
render Ca/Mg advisory verdict
```

The raw values remain available for future V2 design/testing without implying that historical dose context exists.

---

## X-INV-001 — Canon/reference integrity

Coverage ID: `INV-CANON-001`

Mechanical checker requirements:
- zero dangling stable rule references;
- every active normative stable rule body appears exactly once in the coverage manifest;
- every manifest rule has at least one existing fixture ID;
- every listed fixture ID exists.

---

## X-INV-002 — Advisory truth and non-adherence

Coverage ID: `INV-CORE-ADVISORY-001`

Required invariants:
- recommendation does not become implementation without an implementation event;
- confirmed non-adherence may be surfaced but does not create punitive lockout;
- unknown implementation remains unknown;
- engine-originated uncertainty/capability gaps still refuse/degrade as canon requires.

---

## X-INV-003 — Non-adherence rescue complexity

Coverage ID: `INV-NONADHERENCE-001`

A hostile simulation that requires the keeper to ignore multiple prior recommendations may be classified as `NONADHERENCE_OUTCOME`. The engine must still remain deterministic and internally safe, but passing the simulation does not require increasingly complex rescue branches solely to compensate for repeated ignored advice.

---

## X-INV-004 — One analytical owner

Coverage ID: `INV-CORE-OWNER-001`

Required:
- domain engine owns chemistry;
- presentation renders structured output;
- no UI component independently calculates slope, dose, response class or retest time;
- one retest scheduler owns chemistry timing.

---

## X-INV-005 — Surface wording contract

Coverage ID: `INV-SURFACE-WORDING-001`

Snapshot/contract tests must verify the Part IX wording rules, including conclusion before basis, no unsupported causal speculation, dose only when relevant, units present, recent-intervention precedence, no causal “working” claim before formal evidence, and non-adherence wording that informs without shaming or punitive lockout.

---

## X-INV-006 — Effective-dated configuration

Coverage ID: `INV-CONFIG-001`

Same raw pre-V2 history plus two different current target ranges must not rewrite the historical target configuration. Historical config-dependent replay before the first proven configuration version remains `NOT_RUN`.

---

## X-INV-007 — Legacy absolute-time provenance

Coverage ID: `INV-TIME-001`

Legacy date-only/local-time-without-zone records must never gain fabricated noon/current-zone instants. Exact elapsed-time calculations use only exact or provenance-backed reconstructed instants.

---

## X-INV-008 — No V1 staging/confidence multiplier

Coverage ID: `INV-ALK-STAGING-001`

Given the same supported slope and final physical constraints, changing a presentation confidence label must not change the numerical maintenance dose. No 100/90/70/55% raw-mL staging band may run.

---

## X-INV-009 — Variable semantics are dimension-safe

Coverage ID: `INV-ALK-VARIABLES-001`

Level targets, maintenance dose rates, temporary movement components, correction volumes and potency remain separate domain concepts. A field named `target` must not carry both chemical level and mL/day semantics.

---

## X-INV-010 — Confidence is output, not dose multiplier

Coverage ID: `INV-ALK-CONFIDENCE-001`

For identical evidence and supported slope, changing only a descriptive confidence label cannot alter the dose calculation.

---

# CANON RULE COVERAGE MANIFEST

`CORE-CANON-COVERAGE-001` requires every active normative stable rule body below to have at least one named fixture.

| Rule ID | Coverage fixture(s) |
|---|---|
| `CORE-CANON-COVERAGE-001` | `INV-CANON-001` |
| `CORE-ADVISORY-RESPONSIBILITY-001` | `INV-CORE-ADVISORY-001` |
| `CORE-INFORM-PROCEED-001` | `INV-CORE-ADVISORY-001` |
| `CORE-NONADHERENCE-COMPLEXITY-001` | `INV-NONADHERENCE-001` |
| `SIM-NONADHERENCE-001` | `INV-NONADHERENCE-001` |
| `CORE-STABILISE-001` | `WG-ALK-014`, `WG-ALK-034` |
| `CORE-POSITION-001` | `ALK-G024`, `ALK-G025`, `ALK-G039` |
| `CORE-SOURCE-001` | `INV-CORE-OWNER-001` |
| `SHARED-DELIVERY-BASIS-001` | `WG-ALK-047` |
| `SHARED-SLOPE-UNCERTAINTY-001` | `WG-ALK-062` |
| `SHARED-CONFIG-VERSION-001` | `WG-ALK-065`, `INV-CONFIG-001` |
| `SHARED-LEGACY-TIME-001` | `WG-ALK-066`, `INV-TIME-001` |
| `SHARED-CONSUMPTION-CONTEXT-001` | `WG-ALK-064` |
| `ALK-OUTER-BOUNDS-001` | `WG-ALK-041`, `WG-ALK-043` |
| `ALK-OUTER-BOUND-ACTION-001` | `WG-ALK-041`, `WG-ALK-051` |
| `ALK-SAFETY-BUFFER-001` | `WG-ALK-041`, `WG-ALK-053` |
| `ALK-RECOMMEND-ONLY-001` | `AD-REC-001`, `AD-REC-002` |
| `ALK-HIGH-BREACH-UNRESOLVED-001` | `WG-ALK-051`, `AD-SAF-007` |
| `ALK-SAFETY-RETURN-INTEGRATION-001` | `WG-ALK-052`, `WG-ALK-056`, `WG-ALK-058`, `WG-ALK-059`, `WG-ALK-060` |
| `ALK-SAFETY-MG-OVERRIDE-001` | `WG-ALK-055` |
| `ALK-MINIMUM-CADENCE-001` | `ALK-G002`, `ALK-G003`, `WG-ALK-049` |
| `ALK-MOVEMENT-001` | `ALK-G003`, `ALK-G004A` |
| `ALK-SLOPE-UNCERTAINTY-001` | `WG-ALK-062` |
| `ALK-SUPPORTED-SLOPE-001` | `ALK-G003`, `ALK-G004A`, `WG-ALK-062` |
| `ALK-STABLE-001` | `ALK-G006`, `ALK-G007` |
| `ALK-RAPID-001` | `ALK-G005`, `WG-ALK-043` |
| `ALK-POTENCY-PLAUSIBILITY-001` | `ALK-G037`, `WG-ALK-050` |
| `ALK-POTENCY-POOL-001` | `ALK-G035`, `ALK-G036` |
| `ALK-POTENCY-CONFIDENCE-001` | `ALK-G036`, `ALK-G037` |
| `ALK-CONSUMPTION-ESTIMATE-001` | `ALK-G003`, `ALK-G026`, `ALK-G027` |
| `ALK-MAINTENANCE-SEMANTICS-001` | `ALK-G006`, `ALK-G008`, `ALK-G009` |
| `ALK-NEGATIVE-CONSUMPTION-001` | `ALK-G026`, `ALK-G027`, `ALK-G028`, `WG-ALK-051` |
| `ALK-BRACKET-COMPARABILITY-001` | `ALK-G038`, `WG-ALK-054` |
| `ALK-WATERCHANGE-UNKNOWN-001` | `ALK-G021`, `ALK-G022`, `ALK-G023`, `WG-ALK-048` |
| `ALK-POSTCHANGE-001` | `ALK-G010`, `ALK-G011`, `WG-ALK-007`, `WG-ALK-008` |
| `ALK-MINIMUM-ACTION-001` | `ALK-G004A`, `WG-ALK-003` |
| `ALK-COMPOSITE-RAIL-001` | `WG-ALK-052` |
| `ALK-STEP-CAP-001` | `WG-ALK-004`, `WG-ALK-006`, `WG-ALK-043` |
| `ALK-ROUNDING-001` | `WG-ALK-005`, `WG-ALK-063` |
| `ALK-STAGING-001` | `INV-ALK-STAGING-001` |
| `ALK-PREDICTED-POST-SLOPE-001` | `ALK-G010`, `WG-ALK-001` |
| `ALK-POSTCHANGE-RETEST-001` | `ALK-G010`, `ALK-G011`, `WG-ALK-060` |
| `ALK-RETURN-EXPIRY-001` | `WG-ALK-031`, `WG-ALK-032` |
| `ALK-LIQUID-VOLUME-GUARD-001` | `WG-ALK-067`, `AD-SAF-003`, `AD-SAF-004` |
| `ALK-FORECAST-SLOPE-001` | `WG-ALK-042`, `WG-ALK-043` |
| `ALK-VARIABLE-SEMANTICS-001` | `INV-ALK-VARIABLES-001` |
| `ALK-CONFIDENCE-OUTPUT-001` | `INV-ALK-CONFIDENCE-001`, `AD-OUT-001` |
| `ALK-SLOPE-SUPPORT-001` | `WG-ALK-001`, `WG-ALK-002`, `WG-ALK-062` |
| `ALK-RESPONSE-PRE-EVIDENCE-001` | `WG-ALK-044` |
| `ALK-RESPONSE-CLASSIFIER-001` | `WG-ALK-007`, `WG-ALK-008`, `WG-ALK-009` |
| `ALK-RESPONSE-ATTRIBUTION-001` | `ALK-G010`, `WG-ALK-010`, `WG-ALK-021`, `WG-ALK-022`, `WG-ALK-023` |
| `ALK-RESPONSE-DETECTABILITY-001` | `WG-ALK-010` |
| `ALK-CARD-ATTRIBUTION-001` | `ALK-G039A`, `ALK-G039B`, `INV-SURFACE-WORDING-001` |
| `ALK-INTERVENTION-EXTERNAL-CHANGE-001` | `WG-ALK-016`, `WG-ALK-017`, `WG-ALK-018` |
| `ALK-PREDICTION-SNAPSHOT-001` | `WG-ALK-019`, `WG-ALK-029` |
| `ALK-CAPABILITY-CONTRACT-001` | `WG-ALK-045`, `WG-ALK-046`, `WG-ALK-047`, `WG-ALK-048`, `WG-ALK-054`, `WG-ALK-061`, `WG-ALK-065`, `WG-ALK-066` |
| `ALK-POTENCY-CAPABILITY-GATE-001` | `WG-ALK-046`, `WG-ALK-064` |
| `SURFACE-WORDING-001` | `INV-SURFACE-WORDING-001` |
| `SURFACE-INFORM-PROCEED-001` | `INV-CORE-ADVISORY-001`, `INV-SURFACE-WORDING-001` |
| `MIGRATION-ALK-ONLY-001` | `X-MIG-001` |
| `MIGRATION-INERT-CA-MG-MEASUREMENTS-001` | `X-MIG-001` |
| `MIGRATION-MG-GATE-ISOLATION-001` | `X-MIG-001` |
| `ALK-INDEPENDENT-SELECTION-001` | `AD-SEG-001`, `AD-SEG-005` |
| `ALK-SUSPECT-DETECTION-001` | `AD-VAL-001`, `AD-TRD-004`, `ALK-G024`, `ALK-G025` |
| `ALK-NEGATIVE-MATERIALITY-001` | `AD-CON-002`, `WG-ALK-013`, `ALK-G026` |
| `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` | `WG-ALK-014`, `AD-RTN-003`, `AD-MNT-008` |
| `ALK-TOWARD-RANGE-HOLD-001` | `AD-MNT-006`, `AD-MNT-007`, `AD-MNT-008` |
| `ALK-RAPID-BASIS-001` | `AD-RAP-001`, `AD-EPI-004` |
| `ALK-RETURN-TERMINATED-BY-SAFETY-001` | `AD-RTN-004`, `AD-RTN-005` |
| `ALK-RETEST-SCHEDULER-001` | `AD-RET-001`, `AD-RET-002`, `AD-RET-003`, `AD-RET-004`, `WG-ALK-060` |
| `ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001` | `WG-ALK-011`, `AD-SEG-006`, `ALK-G022` |
| `ALK-HIGH-BREACH-NO-PAUSE-001` | `AD-CON-002`, `AD-SAF-008` |
| `ALK-SAME-TIMESTAMP-COALESCE-001` | `AD-SEG-007`, `AD-SEG-008`, `AD-EPI-002` |
| `ALK-HIGH-BREACH-SAFETY-SIZING-001` | `AD-SAF-007`, `AD-SAF-008`, `AD-CON-002`, `WG-ALK-051` |
| `ALK-REPEAT-SPREAD-DOMAIN-001` | `AD-VAL-002`, `AD-EPI-002` |
| `ALK-TESTING-EPISODE-001` | `AD-EPI-001`, `AD-EPI-002` |
| `ALK-EPISODE-RESOLUTION-001` | `AD-EPI-002`, `AD-EPI-003` |
| `ALK-EPISODE-SINGLE-OUTPUT-001` | `AD-EPI-003`, `AD-EPI-004` |
| `ALK-DECIMAL-THRESHOLD-001` | `AD-VAL-002` |
| `ALK-DELIVERY-RATE-BASIS-001` | `AD-DHS-001`, `AD-DHS-002`, `AD-DHS-003` |
| `ALK-ADVISORY-RANGE-BOUNDARY-001` | `AD-ESC-001`, `AD-ESC-002`, `AD-ESC-003` |
| `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001` | `AD-SAF-009`, `INV-G12` |

---

## X-GOV-001 — Confirmed ignored recommendation: reassess and continue

History:

```text
Day 0:
  app recommends Alk retest in 48 h and maintenance increase
  keeper confirms maintenance increase NOT IMPLEMENTED

Day 4:
  new valid Alk reading entered
```

Required:

```text
priorImplementationState = CONFIRMED_NOT_IMPLEMENTED
currentAssessment = RUN
currentRecommendation = best supported recommendation from current facts
punitiveLockout = false
```

The card may name that the prior change was not made if relevant.

Forbidden:

```text
refuse current advice solely because the Day-0 recommendation was ignored
```

---

## X-GOV-002 — Unknown implementation retains evidence guards

History:

```text
Day 0:
  app recommends dose change
implementation confirmation = absent

Day 4:
  new Alk reading entered
```

Required:

```text
priorImplementationState = UNKNOWN
```

If the unknown implementation time/dose is load-bearing for attribution:

```text
causalResponseAttribution = WITHHELD_OR_CONFOUNDED
potencyLearning = NOT_RUN
```

Forbidden:

```text
assume dose was changed
assume dose was not changed
```

The current position may still be reported from the valid Day-4 reading.

---

## X-GOV-003 — Inform and proceed versus refuse

### Case A — unresolved issue affects reliability but not calculability

```text
Alk = below outer operating range
Mg = ALERT_LOW
Alk potency = valid
```

Required:

```text
Alk SAFETY_RETURN = recommended
Mg warning = shown
```

Do not withhold the valid Alk safety action solely because low Mg may make the result harder to hold.

### Case B — unresolved issue invalidates the conversion

```text
required Alk movement = +0.30 dKH
selected Alk potency = UNKNOWN
```

Required:

```text
requiredDkhMovement = may be shown
recommendedMlDose = WITHHELD
reason = POTENCY_REQUIRED
```

Forbidden:

```text
guess an mL dose
```

---

## X-GOV-004 — Repeated ignored guidance is a stress test, not a rescue-state requirement

Simulation:

```text
keeper repeatedly logs worsening Alk
keeper confirms multiple prior recommendations were not implemented
chemistry eventually reaches an extreme value
```

Required engine properties:

```text
deterministic = true
stateValid = true
railsPreserved = true
recommendationVsImplementationTruth = preserved
currentBestAdvice = still produced where supported
```

Review classification:

```text
if bad outcome is caused solely by repeated confirmed non-adherence:
    failureClass = NONADHERENCE_OUTCOME
```

A new rescue state is **not automatically required**.

If the same simulation reveals:
- runaway dose recommendation;
- unit/sign error;
- corrupted state;
- rail violation;
- unsupported confident recommendation;

then:

```text
failureClass includes ENGINE_FAILURE
```

and the engine defect must be fixed even though the simulated keeper was non-adherent.

---

# V1 → V2 COVERAGE LEDGER — MASTER WORKING SET

This ledger is mandatory and expands as the remaining V1 canon is audited.

| V1 concept | V2 disposition | Current V2 home |
|---|---|---|
| Current position = latest valid reading | KEEP | Part I |
| History determines behaviour, not current position | KEEP | Part I |
| Maintenance dose and level movement are distinct | KEEP / strengthen | Part I |
| Stabilise first | KEEP — LOCKED | Part I |
| Return plan is separate and opt-in | KEEP | Part I |
| One engine, surfaces render | KEEP | Part I |
| Recommendation ≠ implementation | KEEP / strengthen | Parts I–II |
| Historical dose events | KEEP / strengthen | Parts I–II |
| Exact actual intervention matters | KEEP / strengthen | Part II |
| Expected response after dose change | KEEP / formalise | Part II |
| Interrupting a dose change prevents clean judgement of the first | KEEP / formalise | Part II |
| Odd readings should be confirmed rather than blindly acted on | KEEP / strengthen | Part II |
| Known corrections should not masquerade as changed biological consumption | KEEP / strengthen | Part II |
| Historical truthfulness | KEEP | Part I |
| First-match 17-state wizard as chemistry model | REPLACE | Structured state dimensions in Part I |
| Overloaded state names | REPLACE | Part I |
| One `target` field carrying level or mL/day | REPLACE | Dimension-safe fields |
| V1 UI reference cards | KEEP as acceptance fixtures | Part IX |
| Fixed universal current-analysis window | REPLACE | Inference-specific clean segments |
| Ordinary slope fitting without robust estimator contract | REPLACE | Theil–Sen in Part II |
| Linear three-day correction subtraction | REPLACE | Actual delivery normalization |
| Raw reading count as evidence | REPLACE | Independent clusters + time + signal |
| “recent dose change” as loose UI concept | REPLACE | First-class intervention |
| Water changes always stay in trend / no subtraction | REPLACE for Alk | Known material Alk contribution is normalized; unknown ≥5% breaks segment; unknown <5% remains without invented subtraction |
| Historical dose bracketing | KEEP BUT RESTRUCTURE | Part I; exact parameter use pending |
| Strength inferred vaguely from history | REPLACE | Formal potency learner |
| Negative-consumption protection | KEEP principle / REWRITE | Part I + parameter-specific Parts |
| Post-change contradiction scenarios | KEEP / formalise | Part II response axis |
| One live dose expectation | KEEP / formalise | First-class intervention |
| Cross-surface parity | KEEP | Part I / Part IX |
| Setup facts-vs-judgements philosophy | KEEP pending presentation/setup review | Part IX |
| Nutrients require parameter-specific reasoning | KEEP | Part VIII |
| Ammonia does not fit ordinary ranged trend logic | KEEP | Part VIII |
| Health score deletion | KEEP pending surface canon | Part IX |
| No surface-local chemistry reasoning | KEEP | Part I |
| Magnesium maintenance never tuned | REVALIDATE SCIENTIFICALLY | Part V |
| Hard Mg gate withholding Alk/Ca increases | REVALIDATE SCIENTIFICALLY | Parts V–VI |
| Stable Alk means falling Ca cannot be calcification | REPLACE | Part VI |
| Fixed raw-mL staging bands | REPLACE | Supported-slope uncertainty sizing in Part III |
| Arbitrary confidence percentage as dose multiplier | REMOVE | Part III — confidence is output only |
| Alk slope-support controller constant | NEW V2 | `ALK_SLOPE_SUPPORT_K = 1.28`, fixed but reviewable |
| Safe/outer limits and target ranges | KEEP concept / revalidate values | Parameter Parts |
| Rate rails | KEEP concept / revalidate exact values | Parameter Parts |
| User range edges, not hidden ideal point | KEEP | Part I / parameter Parts |
| Midpoint as derived return destination | KEEP | Part I |
| Water-change mass balance formula | KEEP as available model | Part II |
| Robust audit trail / named exclusions | KEEP / strengthen | Parts I–II |
| Golden simulations should expose rule interactions | KEEP / strengthen | Part X |

---

# CURRENT OWNER-LOCKED DECISIONS

## `CORE-STABILISE-001` — Stabilise first

Automatic maintenance-dose advice only attempts to match consumption and stop unintended movement.

It does not silently add a component intended to move the current level toward the target range.

Once the level is stable and remains outside the target range, the app may offer a separate opt-in return plan.

This applies symmetrically to high and low levels unless a later parameter-specific safety rule explicitly defines an exception.

## `CORE-POSITION-001` — Latest valid measurement owns current position

A fitted value, smoothed value or forecast may not overrule the latest valid measured value when the app states where the tank is now.

## `CORE-SOURCE-001` — One analytical owner

No UI surface, findings layer, Insights block or second calculator may independently produce a competing chemistry/dosing verdict.


## `ALK-SLOPE-SUPPORT-001` — Uncertainty-aware Alk maintenance sizing

Alkalinity maintenance sizing uses a deterministic supported slope:

\[
|S_{supported}|=\max(0,|S|-1.28\sigma_S)
\]

with sign restored.

`ALK_SLOPE_SUPPORT_K = 1.28` is a fixed-but-reviewable engineering constant, never a Setup/user preference.

## Owner-lock summary — `ALK-POSTCHANGE-001` — Two-stage Alk intervention assessment

First ordinary Alk response test is ~48 hours after a maintenance change and is judged against the predicted post-change trajectory. A second post-change test around Day 4 is normally preferred before declaring final maintenance matching.

## Owner-lock summary — `ALK-NEGATIVE-CONSUMPTION-001` — Non-physical Alk mass balance does not size maintenance

Materially negative/uninterpretable Alk consumption cannot itself produce a maintenance-dose change. Position/risk may shorten retesting but does not validate a broken estimate.

---

# CURRENT OPEN DECISION POLICY

When a future V1/V2 conflict is substantive rather than merely structural:

1. state the problem in plain reefkeeping language;
2. show what V1 would do;
3. show what the proposed V2 rule would do;
4. explain the practical failure mode of each;
5. give a recommendation;
6. obtain owner decision where it is genuinely a product judgement;
7. write one final rule into this master canon.

Do not preserve both alternatives as active rules.

---

# MASTER IMPLEMENTATION DIRECTIVE TO CLAUDE / CLAUDE CODE

Treat this document as the sole behavioural authority for V2.

Before implementing a Part:

1. inspect relevant V1 code, V1 canon and tests;
2. populate/verify the V1→V2 ledger for that area;
3. identify any V1 behaviour not represented here;
4. classify it rather than silently copying or deleting it;
5. identify genuine conflicts for owner review;
6. write tests from V2;
7. implement behind those tests;
8. run V1/V2 comparison simulations;
9. classify behavioural differences;
10. only then wire the V2 result into production surfaces.

Do not reconstruct old behaviour merely because it already has code.

Do not invent a missing numerical threshold from neighbouring parameters.

Do not solve an unresolved owner decision by choosing whichever implementation is easier.

