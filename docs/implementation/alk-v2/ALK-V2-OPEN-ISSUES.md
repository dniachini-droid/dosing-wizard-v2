# ALK V2 — OPEN ISSUES

**Read this before writing any code.**

Every item below is something an implementer would otherwise have to guess. Each is
classified using the four categories required by the preparation brief:

| Class | Meaning | Implementation instruction |
|---|---|---|
| `CANON_DEFECT` | The frozen canon is incomplete, self-contradictory, or ambiguous on a point that changes behaviour. | Do **not** invent behaviour. Emit the stated refusal/degradation. Escalate under the current freeze's reopening rule. |
| `OWNER_DECISION_REQUIRED` | A genuine product/chemistry judgement remains. | Stop. The owner decides. A proposal may be recorded but is not authority. |
| `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED` | The canon determines the answer, possibly only by combining rules or applying its own precedence machinery. | Implement the pinned reading. No owner input needed. |
| `NO_PROBLEM` | Investigated; no defect. Recorded so it is not re-investigated. | Proceed. |

An item may carry two classes when the defect is real *and* the decision is the owner's.

**Governing rule for every unresolved item:** canon `CORE-INFORM-PROCEED-001` and
`ALK-CAPABILITY-CONTRACT-001`. Withhold only the output that cannot be supported; keep
every unaffected conclusion. An unclosed issue ships as a `REFUSE` / `NOT_RUN` with an
explicit reason code — never as a silently chosen default.

## Status after `ALK_V2_FREEZE_5`

`ALK_V2_FREEZE_5` closed thirteen of these items — every blocking item, plus
`OI-RAPIDBASIS-001` and `OI-CONFIDENCE-001` — by writing twelve owner decisions into the
canon under the Freeze-4 reopening rule.

A closed item is marked with a **RESOLVED by `ALK_V2_FREEZE_5`** box naming the owner
decision and the canon rule that encodes it, followed by a **Freeze-5 resolution** section.
Everything after that is the original analysis, kept deliberately: it is the record of why
the decision was needed, and a reviewer must be able to check the decision against the
failure scenario that motivated it. **The pre-Freeze-5 "Until closed" behaviour in a
resolved item is superseded and must not be implemented.**

Items with no such box remain open, and their "Until closed" behaviour still governs.

| Freeze-5 decision | Closes | Canon rule |
|---|---|---|
| F5-01 | `OI-INDEPENDENCE-001` | `ALK-INDEPENDENT-SELECTION-001` |
| F5-02 | `OI-SUSPECT-001`, `OI-MADFLOOR-001` | `ALK-SUSPECT-DETECTION-001` |
| F5-03 | `OI-NEGCONS-001` | `ALK-NEGATIVE-MATERIALITY-001` |
| F5-04 | `OI-RETURNOFFER-001` | `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` |
| F5-05 | `OI-BELOWRISING-001` | `ALK-TOWARD-RANGE-HOLD-001` |
| F5-06 | `OI-LIQUIDGUARD-001` | `ALK-LIQUID-VOLUME-GUARD-001` (amended) |
| F5-07 | `OI-RAPIDBASIS-001` | `ALK-RAPID-BASIS-001` |
| F5-08 | `OI-RETURNDURINGSAFETY-001` | `ALK-RETURN-TERMINATED-BY-SAFETY-001` |
| F5-09 | `OI-RETEST-001` | `ALK-RETEST-SCHEDULER-001` |
| F5-10 | `OI-WATERCHANGE-001` | `ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001` |
| F5-11 | `OI-SAFETYRATE-001` | `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` |
| F5-12 | `OI-CONFIDENCE-001` | `ALK-CONFIDENCE-OUTPUT-001` (amended) |

`OI-MADFLOOR-001` is closed as an **accepted residual**: its dependency was decided by
declining to add a threshold, so the behaviour is unchanged and the exposure is now named
rather than open.

Twenty-seven items remain from the original register. Freeze-5 review opened three more —
`OI-HIGHBREACHBAND-001`, `OI-CLUSTERTIE-001` and `OI-RETESTFLOOR-001`, in section A2 — and
the owner then decided all three as amendments F5-13, F5-14 and F5-15. They are closed.

That the register grew and then closed is the intended shape. A review of a canon reissue
that found nothing new would mean the review was not adversarial; a review whose findings
were then absorbed by derivation rather than by decision would mean the governance was not
real.

**Nothing in Freeze 5 now withholds an output for want of an owner decision.**

Resolution of the twenty-seven remaining items belongs to a governed Alk Freeze 6 (or a
shared freeze where the defect is shared), per the Freeze-5 reopening rule.

---

# A. Formerly blocking — all closed by `ALK_V2_FREEZE_5`

Every item in this section blocked a dependent output under `ALK_V2_FREEZE_4`. None does
now. The section keeps its original ordering and content so the decisions can be read
against the analysis that produced them.

## OI-INDEPENDENCE-001 — Independent-cluster selection is not specified

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-008`; Part II §6; `ALK-MOVEMENT-001`
- **Owner module:** `SEGMENTATION`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-01.**
>
> Encoded as `ALK-INDEPENDENT-SELECTION-001` (canon, under `ALK-008`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

Forward-greedy chronological selection from the earliest eligible cluster. After accepting
a cluster, the next accepted cluster is the earliest one at least 24 h after the **last
accepted** cluster. Later data never retroactively alters an earlier acceptance. A rejected
candidate keeps every non-trend use `ALK-008` already grants it and is never marked
`SUSPECT` or `INVALID`.

The failure scenario above resolves to `{0.0, 2.0, 4.0}`, `Sxx = 8`,
`sigma_S = 0.035355339059`. Backward-greedy and keep-all-and-mark are now **forbidden**.

**Fixtures:** `AD-SEG-001` (positive), `AD-SEG-005` (negative control: a later cluster does
not change the earlier selection; the backward-greedy alternative is asserted forbidden).


`ALK-008` states that a cluster less than 24 hours after the previous independent cluster
"does not ordinarily count as a new full-strength maintenance-trend observation", and
lists what it *may* still do (position, anomaly confirmation, rapid rule, explicitly
time-resolved intervention calculation) — a list that excludes ordinary maintenance
trend. So such a cluster is excluded from the ordinary trend fit.

What the canon does not state is **which cluster is dropped**, and therefore what the
surviving set is.

**Failure scenario.** Clusters at t = 0.0, 0.5, 2.0, 4.0 days.

- Forward-greedy from the earliest: keep {0.0, 2.0, 4.0}. `Sxx = 8`, `sigma_S = 0.035355`.
- Backward-greedy from the latest: keep {0.5, 2.0, 4.0}, drop 0.0 (it is 0.5 d before 0.5).
  `t̄ = 2.1667`, `Sxx = 6.1667`, `sigma_S = 0.040269`.
- Keep-all-but-mark: `t̄ = 1.625`, `Sxx = 9.6875`, `sigma_S = 0.032129`.

*(Freeze-5 correction: the backward-greedy and keep-all figures originally recorded here
were `Sxx = 6.3889 / 10.25` and `sigma_S = 0.039556 / 0.031235`, which do not follow from
the stated cluster times. `AD-SEG-001` carries the correct values and is authoritative. The
argument the scenario makes — three defensible readings, three different `sigma_S` — is
unaffected.)*

Three defensible readings, three different `sigma_S`, therefore three different
`S_supported` and potentially three different recommended doses. This is not a rounding
difference; it changes the actuator command.

**What must not be done.** Do not pick a traversal direction because it is easier.

**Until closed (superseded by Freeze 5; historical).** Where any candidate cluster in the selected current-control segment
falls within 24 h of another candidate cluster, emit:

```text
movementEvidence          = INSUFFICIENT
reason                    = EVIDENCE_INDEPENDENT_SELECTION_UNDEFINED
automaticMaintenanceAction = WITHHELD
```

Position, history and safety logic are unaffected and continue normally.

**Proposal put to the owner (historical; the owner's actual decision is in the Freeze-5 resolution above).** Forward-greedy from the earliest eligible
cluster in the segment is the only order that is stable under the arrival of new data:
adding a newer reading never retroactively changes which older clusters were independent.
Backward-greedy makes the historical selection depend on the present, which conflicts
with deterministic replay expectations.

---

## OI-SUSPECT-001 — Alkalinity has no suspicious-reading threshold

- **Class:** `CANON_DEFECT`
- **Canon:** Part II §47, §48, §49 (explicitly defers the threshold: "The shared
  architecture does not set the final threshold"); `ALK-051`; `ALK-G024`; `ALK-G025`
- **Owner module:** `VALIDATION`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-02.**
>
> Encoded as `ALK-SUSPECT-DETECTION-001` (canon, `ALK-005A`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

No Alk-specific automatic statistical `SUSPECT` threshold is invented. Automatic
statistical suspect detection is **canonically `NOT_RUN`** until separately validated and
canonised — a decided state, not a gap. The canon-defined `SUSPECT` sources remain
operative and are the complete set: explicit user marking, a recorded test/device fault,
and the existing `ALK-005` repeat-test spread mechanism. An unusual reading may prompt
repeat testing **without being silently discarded**.

**Fixtures:** `AD-VAL-001` (all three operative sources, plus the negative control that a
statistically unusual reading alone produces nothing), `ALK-G024`, `ALK-G025`,
`AD-TRD-004`.


Part II §47 defines a candidate standardized residual
`Z_i = |r_i| / max(sigma_i, sigma_r, epsilon)` and states that a parameter canon "may use
a threshold such as a multiple of uncertainty". **Part III never supplies an alkalinity
threshold.** A full-text search of the canon finds no Alk `Z` threshold, no Alk
suspicious multiple, and no Alk jump-size rule.

Consequences:

- `MeasurementStatus = SUSPECT` cannot be derived automatically;
- `ALK-051` ("if newest Alk is suspicious … repeat now") has no trigger;
- `ALK-MOVEMENT-001`'s precondition "no unresolved latest anomaly" is trivially satisfied;
- `ALK-G024` / `ALK-G025` (suspicious latest result disproved / confirmed) cannot be
  driven from measurement data alone.

**Until closed (superseded by Freeze 5; historical).** Automatic suspicion detection is `NOT_RUN`:

```text
suspicionDetection = NOT_RUN
reason             = VALIDATION_SUSPICION_THRESHOLD_UNAVAILABLE
```

`SUSPECT` may still be set from sources the canon *does* define, and those paths remain
fully active:

1. explicit user marking (Part II §4.2, §4.3, §49);
2. an internally inconsistent repeat cluster — `max - min > 0.20 dKH` (`ALK-005`) —
   which yields cluster status `ANOMALOUS`;
3. a known test/device fault recorded as an event (Part II §49).

`ALK-G024` / `ALK-G025` are therefore implemented against explicit user-marked repeats,
which is how those fixtures are expressed in `fixtures/alk-named-goldens.json`.

**Do not** import a `Z` threshold from another parameter, from V1, or from statistical
convention (Part II §7.4, Part I §56).

---

## OI-MADFLOOR-001 — A single outlier can be invisible to `sigma_point`

- **Class:** `CANON_DEFECT` (rule interaction) — depends on `OI-SUSPECT-001`
- **Canon:** `ALK-SLOPE-UNCERTAINTY-001` step 3-4; Part II §19.4, §47
- **Owner module:** `UNCERTAINTY`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-02.**
>
> Encoded as no new rule — dependency decided.
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

The dependency `OI-SUSPECT-001` is closed by declining to add a threshold, so the intended
defence stays deferred. The interaction is unchanged and is now an **accepted, named
residual** rather than an open defect: a lone aberrant point that the residual MAD cannot
see does not raise `sigma_S`.

`ALK-SUSPECT-DETECTION-001` states explicitly that **no compensating uncertainty-inflation
term may be added**. The exposure is recorded in the Freeze 5 declaration's *Deliberately
left open* list and is a named future-canon item.

**Fixture:** `AD-TRD-004`, retitled as the accepted-residual record.


`sigma_resid = 1.4826 · MAD(r_i)` and `sigma_point = max(0.10, sigma_resid)`.

**Failure scenario (fixture `AD-TRD-004`).** Five clusters at t = 0, 2, 4, 6, 8 with
values 8.60, 8.50, **7.90**, 8.30, 8.20. The Theil-Sen slope is exactly −0.05 dKH/day
(correct and robust). Residuals are `[0, 0, −0.50, 0, 0]`. The **median** absolute
residual is `0`, so `sigma_resid = 0` and `sigma_point` falls back to the 0.10 floor.

A 0.50 dKH aberrant reading — five times the analytical floor — therefore raises the
controller's uncertainty by exactly nothing, and the engine sizes a dose with full
confidence from a series containing an obviously bad test.

This is a *correct* consequence of two individually correct frozen rules (MAD robustness
is intended; the floor is intended). The canon's own defence against it is Part II §47's
suspicious-reading layer — which alkalinity never parameterised (`OI-SUSPECT-001`).

**Until closed (superseded by Freeze 5; historical).** No change to `sigma_point`; the formula is frozen. Record the
interaction and close `OI-SUSPECT-001`, which restores the intended defence. Implementers
must not add a compensating uncertainty inflation term.

---

## OI-NEGCONS-001 — "Slight negative" and "materially negative" consumption have no boundary

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-031`; `ALK-NEGATIVE-CONSUMPTION-001`; `ALK-HIGH-BREACH-UNRESOLVED-001`
- **Owner module:** `CONSUMPTION`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-03.**
>
> Encoded as `ALK-NEGATIVE-MATERIALITY-001` (canon, in `ALK-031`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

Materially negative consumption is defined as

```text
C_estimate + ALK_SLOPE_SUPPORT_K * sigma_S < 0        (strict, K = 1.28)
```

Otherwise the negative estimate is uncertainty-limited/uninterpretable and cannot by itself
reduce established maintenance dosing. **No `sigma_P` and no `sigma_D` are introduced.**

Because the owner's decision labels the non-material branch uninterpretable too, a negative
`C_estimate` satisfies `ALK-HIGH-BREACH-UNRESOLVED-001`'s "physically uninterpretable"
condition on **both** branches. The high-breach zero-dose fail-safe is therefore no longer
gated: `C_estimate < 0` arms it, `C_estimate >= 0` takes the temporary-safety-rate path.

**Fixtures:** `WG-ALK-013` (material), `ALK-G026` (uncertainty-limited, now determinate),
`AD-CON-002` (boundary straddle above `OuterMax`: doses 1.5 and 1.6 mL/day sit either side
of the boundary and are asserted with each other's classification forbidden),
`WG-ALK-051` (fail-safe un-gated).


`ALK-031` splits negative inferred consumption into two branches:

- *slight negative within uncertainty* — "if zero consumption lies within the propagated
  uncertainty" → classify `UNCERTAIN / non-resolvable`, HOLD, retest;
- *materially negative* — "clearly beyond model uncertainty" → mark
  `NON_PHYSICAL_OR_UNEXPLAINED_GAIN`, hold, inspect events, request follow-up.

The test is "the propagated uncertainty" of `C_estimate = P_selected · D - S_observed`.
Propagation requires `sigma_P`, `sigma_D` and a coverage factor. **The canon defines
none of them for alkalinity.** `sigma_S` is defined; `sigma_P` and `sigma_D` are not, and
no `k` is given for the containment test.

**This is safety-critical, not cosmetic.** `ALK-HIGH-BREACH-UNRESOLVED-001` triggers on
"`C_estimate` is physically uninterpretable" and its response is to **recommend pausing
alkalinity dosing to 0 mL/day**. The boundary between the two `ALK-031` branches
therefore decides whether the engine recommends stopping alkalinity supply.

**Failure scenario.** `P = 0.0693`, `D = 9.0` ⇒ `P·D = 0.6237`. Observed
`S = +0.64 dKH/day` ⇒ `C = −0.0163 dKH/day`. With three clean clusters,
`sigma_S = 0.035355`; `1.28·sigma_S = 0.045255 > 0.0163`, so under a
`sigma_C ≈ sigma_S`, `k = 1.28` reading this is *slight*. Under a
`sigma_C ≈ sigma_S`, `k = 1.0` reading it is still slight. Under a
"materially negative means any negative outside `sigma_S`" reading it is slight. But
under `k = 0` (any negative is material) it is material — and the tank, if simultaneously
above `OuterMax`, is told to stop dosing. Different defensible readings, opposite safety
actions.

**Until closed (superseded by Freeze 5; historical).**

```text
consumptionPhysicality = UNRESOLVED
reason                 = CONSUMPTION_NEGATIVE_MATERIALITY_UNDEFINED
maintenanceAction      = HOLD              (identical under both branches)
highBreachZeroDosePause = NOT_RUN
reason                  = SAFETY_HIGH_BREACH_MATERIALITY_UNDEFINED
```

The maintenance consequence is identical on both branches (HOLD), so ordinary control is
unaffected. Only the high-breach zero-dose fail-safe is gated. `WG-ALK-013` and
`WG-ALK-051` both use magnitudes (`C = −0.20 dKH/day` against `P·D = 0.60`) that every
defensible reading classifies as material, so both canonical fixtures remain executable;
they are marked in the corpus as *not* discriminating the boundary.

**Proposal put to the owner (historical; the owner's actual decision is in the Freeze-5 resolution above).** Alkalinity already owns a controller
uncertainty constant and an uncertainty proxy. A boundary of the form
`C_estimate + ALK_SLOPE_SUPPORT_K · sigma_S < 0 ⇒ materially negative` reuses both, needs
no new constant, and treats `sigma_P` and `sigma_D` as zero — which is conservative in the
direction of calling a broken mass balance *slight* rather than *material*, i.e. it
delays the dosing pause rather than triggering it spuriously. The owner must decide
whether that direction of conservatism is the intended one.

---

## OI-RETEST-001 — Alkalinity never parameterises the shared retest scheduler

- **Class:** `CANON_DEFECT`
- **Canon:** Part II §51, §52, §53, §54, §66; `ALK-050`-`ALK-053`; `X-INV-004`
- **Owner module:** `RETEST`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-09.**
>
> Encoded as `ALK-RETEST-SCHEDULER-001` (canon, `ALK-053A`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

One authoritative Alk scheduler, parameterised:

```text
routine                 48 h                              ALK-050
repeat now              now                               ALK-051
rapid                   ~24 h, earlier on outer-bound risk ALK-052
post-change             ~48 h, then ~Day 4                ALK-053
safety return           ~24 h                             integration §9
high-breach fail-safe   ~24 h                             ALK-HIGH-BREACH-UNRESOLVED-001
confidence-building     T_signal = 0.10 / |S_supported|   F5-09
forecast boundary       T_boundary = T_outer - 1.0 day    F5-09
                        T_boundary <= 0 -> test now
expiry                  2*T_plan + 2                      ALK-RETURN-EXPIRY-001

ordinary observation clamped to [24 h, 96 h]              ALK-008 / ALK-053
selection = earliest applicable candidate
```

`T_detect` and the return-plan arrival cadence are **canonically `NOT_RUN`**: the owner
declined to invent `K_detect` or a distinct plan cadence merely to fill a generic slot.
No new constant was introduced — every operand above is already frozen canon.

**Fixtures:** `AD-RET-001` (`T_signal` clamped up to the floor and selected),
`AD-RET-002` (`T_signal` above the ceiling; routine cadence still earlier),
`AD-RET-003` (boundary lead selects 40 h; forecasting from `S_supported` is asserted
forbidden), `AD-RET-004` (crossing inside the lead ⇒ test now).


Part II §51 lists nine retest candidate classes. Part III supplies concrete values for
only some of them:

| Candidate | Alk value | Source |
|---|---|---|
| routine cadence | 48 h | `ALK-050` |
| suspicious reading | now | `ALK-051` (trigger blocked by `OI-SUSPECT-001`) |
| rapid movement | ~24 h | `ALK-052` |
| after maintenance change | ~48 h, then ~48 h | `ALK-POSTCHANGE-RETEST-001` |
| safety return active | ~24 h | `ALK-SAFETY-RETURN-INTEGRATION-001` §9 |
| high-breach fail-safe | ~24 h | `ALK-HIGH-BREACH-UNRESOLVED-001` |
| **intervention detectability** `T_detect` | **absent** — needs `K_detect` | Part II §52 |
| **confidence-building** `T_signal` | **absent** — needs `RequiredMovement` | Part II §53 |
| **forecast boundary crossing** | **absent** — needs `boundarySafetyMargin` | Part II §54 |
| **return-plan arrival check** | **absent** | `ALK-058` stores "expected next-test times"; no cadence given |
| **minimum useful interval** | **absent** | Part II §66 |
| **maximum observation interval** | **absent** | Part II §66 |

Part II §51 says the final recommendation is "the earliest relevant candidate that does
not violate a minimum useful interval" — and the minimum useful interval is one of the
absent values.

**Until closed (superseded by Freeze 5; historical).** The scheduler runs with the candidate set the canon *does* define, and
explicitly reports the ones it cannot compute:

```text
retestCandidatesNotRun = [
  RETEST_DETECTABILITY_POLICY_UNAVAILABLE,
  RETEST_CONFIDENCE_BUILDING_POLICY_UNAVAILABLE,
  RETEST_BOUNDARY_MARGIN_UNAVAILABLE,
  RETEST_RETURN_PLAN_CADENCE_UNAVAILABLE
]
minimumUsefulIntervalApplied = NOT_RUN
reason                       = RETEST_MINIMUM_INTERVAL_UNAVAILABLE
```

This is safe in the conservative direction: every absent candidate would only ever
*shorten* the interval (detectability, confidence building, boundary crossing) or
*lengthen* it against a floor (minimum useful interval). Omitting the shortening
candidates yields a later test, never an unsafe earlier one; omitting the floor can only
yield a test the keeper may take sooner than strictly useful, which costs a test strip,
not tank safety. The one substantive loss is that boundary-crossing risk does not
shorten testing — which must be stated on the card, because `ALK-006` lists outer-bound
excursions as a reason to test sooner.

`X-INV-004` ("one retest scheduler owns final next-test timing") remains satisfied: the
single scheduler owns the reduced candidate set. No card may add a candidate.

---

## OI-RETURNOFFER-001 — Return-plan eligibility has no deterministic precondition

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-STABLE-001`; `ALK-024`; `ALK-054`; `CORE-STABILISE-001`; `WG-ALK-014`;
  `WG-ALK-034`
- **Owner module:** `RETURN`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-04.**
>
> Encoded as `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` (canon, in `ALK-054`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

Reading (b), with an explicitly named predicate. `ALK-STABLE-001`'s analytical definition
is **unchanged**:

```text
returnPlanEligibleTrajectory
  = (ALK-011 ordinary minimum evidence satisfied) and (S_supported = 0)
  = trajectory in { STABLE, UNCERTAINTY_LIMITED }
```

A return plan may be offered when the observed slope is non-zero but uncertainty leaves no
supported movement. `movementEvidence = INSUFFICIENT` is not eligible. `WG-ALK-014` is
executable.

**Fixtures:** `WG-ALK-014`, `WG-ALK-028`, `ALK-G006`, `AD-MNT-008`,
`AD-RTN-003` (negative control: insufficient evidence and supported movement are both
ineligible; the `UNCERTAINTY_LIMITED` case is eligible while explicitly not `STABLE`).


`ALK-STABLE-001` defines `STABLE` with two exact conditions: `S_supported = 0` **and**
`S_observed = 0`. It explicitly rules out calling an uncertainty-limited lean stable.

`ALK-054` gates the return plan on "Alk is stable and out of range". `ALK-024` says
"If Alk is stable with adequate evidence: `S ≈ 0` … offer a return plan".

`WG-ALK-014` — a canonical fixture — specifies `observed slope = approximately 0`,
`supported slope = 0`, and requires `OFFER_RETURN_PLAN`. Under `ALK-STABLE-001`,
"approximately 0" observed with zero supported slope is **`UNCERTAINTY_LIMITED`, not
`STABLE`**.

So either:

- (a) return-plan eligibility requires exact `S_observed = 0`, in which case a real tank
  will essentially never be offered a return plan, because Theil-Sen over hobby data is
  almost never exactly zero (see `OI-STABLE-001`); or
- (b) return-plan eligibility requires only `S_supported = 0` with sufficient evidence,
  in which case `ALK-054`'s word "stable" does not mean `ALK-STABLE-001`'s `STABLE`.

`WG-ALK-014` points at (b). `ALK-STABLE-001` points at (a). Both are frozen.

**Failure scenario.** Tank at 7.80 dKH, three clean clusters at 7.81, 7.79, 7.80 over
four days. Theil-Sen slope is −0.0025 dKH/day (not zero). `S_supported = 0`. Under (a) no
return plan is ever offered and the keeper's tank sits below range indefinitely with the
engine reporting HOLD. Under (b) the return plan is offered as `WG-ALK-014` requires.

**Until closed (superseded by Freeze 5; historical).**

```text
returnPlanOffer = NOT_RUN
reason          = RETURN_ELIGIBILITY_STABILITY_DEFINITION_UNDEFINED
```

Automatic maintenance is unaffected — it is HOLD on both readings — so the controller
remains fully functional. Only the opt-in level-movement offer is withheld. This is the
conservative direction: `CORE-STABILISE-001` makes deliberate level movement opt-in and
non-urgent by design, and `ALK-OUTER-BOUND-ACTION-001` already owns every urgent
out-of-range case independently of the return plan.

**Proposal put to the owner (historical; the owner's actual decision is in the Freeze-5 resolution above).** Reading (b) with an explicit
`returnPlanEligibleTrajectory` predicate — `movementEvidence ∈ {SUFFICIENT,
UNCERTAINTY_LIMITED}` and `S_supported = 0` — matches `WG-ALK-014`, keeps
`ALK-STABLE-001` untouched as the narrower analytical claim, and requires only a new
named predicate rather than a changed threshold.

---

## OI-BELOWRISING-001 — Below-and-rising / above-and-falling actions are undetermined

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-029`; `ALK-030`; `ALK-070`; `CORE-STABILISE-001`
- **Owner module:** `MAINTENANCE`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-05.**
>
> Encoded as `ALK-TOWARD-RANGE-HOLD-001` (canon, `ALK-030A`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

The owner confirmed the matrix's asymmetry is deliberate:

```text
below preferred range + supported RISING   =>  HOLD maintenance
above preferred range + supported FALLING  =>  HOLD maintenance
```

Automatic maintenance must not oppose a supported trajectory already carrying alkalinity
toward the preferred range. Intentional level movement stays with the return-plan
mechanism. The rule requires a **supported** trajectory: an `UNCERTAINTY_LIMITED` lean is
held by `ALK-011`'s own branch and never reaches this gate.

**Fixtures:** `AD-MNT-006` (below + supported rising; the 7.5 mL/day strict-stabilise-first
dose is asserted forbidden), `AD-MNT-007` (mirror; 10.5 mL/day forbidden),
`AD-MNT-008` (negative control: `UNCERTAINTY_LIMITED` must not fire this rule).

Both `AD-MNT-006` and `AD-MNT-007` carried input series that produced `S_TS = ±0.075`
while their expectations stated `±0.15`. The inputs were corrected to `7.3, 7.6, 7.9` and
`9.7, 9.4, 9.1`, which reproduce the stated slopes exactly.


The `ALK-070` recommendation matrix names an action for seven of its nine
position × trajectory cells. Two cells name only a prohibition:

| Position | Trajectory | Matrix text |
|---|---|---|
| Below | Rising | "Do not increase merely because low; evaluate why it is rising / active plan" |
| Above | Falling | "Do not keep reducing merely because high; evaluate active plan/current maintenance" |

Compare the cells the matrix *does* determine: In-range + Rising → "Decrease maintenance
if supported"; Above + Rising → "Decrease toward consumption-matching maintenance".
The matrix therefore deliberately withholds the decrease instruction in the Below+Rising
cell, but does not say what replaces it.

`ALK-029` adds: "do not increase maintenance merely because the value is still low;
**determine whether the current dose exceeds estimated maintenance**; forecast range
entry; avoid stacking another upward action until the cause of the rise is
interpretable." It instructs the engine to *determine* an excess and then stops.

**Failure scenario.** Alk 7.90 dKH (below an 8.2-8.8 range), three clean clusters over
four days rising at `S_observed = +0.15`, `S_supported = +0.10475`, dose 9.0 mL/day, no
active plan, no correction, no water change, no safety breach.

- Reading 1 (strict stabilise-first): automatic maintenance targets `S = 0` in both
  directions symmetrically, so recommend `7.5 mL/day` — reduce the dose of a tank that is
  already below the keeper's target range and climbing back toward it.
- Reading 2 (matrix prohibition is an action prohibition): HOLD until the rise is
  interpretable or the tank enters range.

Both are defensible from the frozen text. They differ by a 1.5 mL/day actuator command in
a tank the keeper considers under-supplied.

The mirror case — Above + Falling with a supported falling slope and no active plan —
has the same structure: strict stabilise-first would *increase* the dose of a tank that
is above range and coming down.

**Until closed (superseded by Freeze 5; historical).**

```text
maintenanceAction = HOLD
reason            = MAINTENANCE_MATRIX_CELL_UNDETERMINED
```

with the full observed/supported slopes and the best-estimate maintenance demand shown
for explanation. HOLD is the conservative option: it is the only action both readings
permit, it cannot move the level in the direction the keeper does not want, and canon
Part I §30 makes HOLD a full recommendation rather than a failure to answer.

**Proposal put to the owner (historical; the owner's actual decision is in the Freeze-5 resolution above).** These two cells are exactly where
"stabilise first" and "do not act on an uninterpretable cause" collide. The matrix's
asymmetry looks deliberate rather than accidental — the two withheld cells are precisely
the two where the supported trajectory is carrying the level *toward* the target range,
so acting against it would use the maintenance controller to oppose a movement the
keeper wants. If that reading is correct, the rule is: **automatic maintenance does not
oppose a supported trajectory that is moving the level toward the target range while the
level is outside it**, and the cells resolve to HOLD. The owner must confirm, because the
opposite reading (symmetric stabilise-first) is equally consistent with
`CORE-STABILISE-001` read alone.

---

## OI-WATERCHANGE-001 — No confidence tier is required for water-change normalization

- **Class:** `CANON_DEFECT`
- **Canon:** Part II §45; `ALK-033`; `M-4`
- **Owner module:** `SEGMENTATION`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-10.**
>
> Encoded as `ALK-WATERCHANGE-NORMALIZATION-CONFIDENCE-001` (canon, in `ALK-033`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

Only `MEASURED_SAME_BATCH` qualifies for automatic water-change normalization.
`USER_CONFIGURED_SALT_PROFILE`, `MANUFACTURER_NOMINAL`, an unknown tier and any lower
confidence fall through to `ALK-WATERCHANGE-UNKNOWN-001`'s fully specified branch. This is
the stricter of the two readings and matches Part II §45's explicit warning.

**Fixtures:** `WG-ALK-011` and `ALK-G022`, now stating `MEASURED_SAME_BATCH`;
`AD-SEG-006` (negative control: the same arithmetic at `MANUFACTURER_NOMINAL` breaks the
segment instead of normalizing, and normalizing is asserted forbidden).


Part II §45 enumerates replacement-chemistry confidence tiers —
`MEASURED_SAME_BATCH`, `USER_CONFIGURED_SALT_PROFILE`, `MANUFACTURER_NOMINAL`,
`UNKNOWN` — and states: "Parameter canons may only allow mathematical normalization above
a required confidence tier. Do not turn an unverified salt label into a precise
correction merely because a formula exists."

`ALK-033` says normalization applies "if replacement Alk is known with adequate
confidence" and "if replacement alkalinity is measured/reliable". **Part III never says
which tiers qualify.**

**Failure scenario.** A 10% water change with `replacementAlkalinityDkh = 9.4` sourced
from `MANUFACTURER_NOMINAL` (a salt bag label). Tank 8.4 dKH ⇒ predicted step
`+0.10 dKH`, exactly at the materiality floor.

- If `MANUFACTURER_NOMINAL` qualifies: normalize −0.10 dKH from subsequent points and keep
  one continuous segment — exactly `WG-ALK-011`.
- If only `MEASURED_SAME_BATCH` qualifies: the value is not "known", so
  `ALK-WATERCHANGE-UNKNOWN-001` applies; `f = 0.10 ≥ 0.05` ⇒ **hard segment break**, and
  the trend restarts.

Segment break versus no segment break changes the cluster count, `Sxx`, `sigma_S` and
often the recommendation itself. `WG-ALK-011` does not state its confidence tier, so it
does not settle the question.

**Until closed (superseded by Freeze 5; historical).** Normalize only where the tier is unambiguously "measured/reliable" in
`ALK-033`'s own words — `MEASURED_SAME_BATCH`. For `USER_CONFIGURED_SALT_PROFILE` and
`MANUFACTURER_NOMINAL`:

```text
waterChangeEffect = NORMALIZATION_TIER_UNDEFINED
normalization     = NOT_RUN
reason            = SEGMENT_WC_CONFIDENCE_TIER_UNDEFINED
```

and fall through to `ALK-WATERCHANGE-UNKNOWN-001`'s deterministic branch (`f < 0.05`
retain without invented subtraction; `f ≥ 0.05` hard boundary). That is the branch the
canon already fully specifies, so no behaviour is invented; it is simply the stricter of
the two readings, matching Part II §45's explicit warning.

---

## OI-LIQUIDGUARD-001 — The liquid-volume guard's scope and pipeline position conflict

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-LIQUID-VOLUME-GUARD-001`; `ALK-060`; `ALK-049`; `WG-ALK-067`
- **Owner module:** `SAFETY`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-06.**
>
> Encoded as `ALK-LIQUID-VOLUME-GUARD-001` (canon, amended in `ALK-061`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

**Scope.** The guard applies to all engine-generated Alk delivery — maintenance,
return/correction/safety delivery, and their permitted combined 24-hour total. The rule
body and `WG-ALK-067`'s wording now agree.

**Enforcement.** Exceeding it **withholds the executable dosing command**. Capping to the
2% figure and presenting that as the recommendation is forbidden. A correction or
return-plan execution, whose duration the engine may choose, is still staged until every
single-day command satisfies the guard.

**Position.** A hard constraint, rechecked after actuator rounding/discretisation in
`ALK-ROUNDING-001` step 6 beside the rate rail. `ALK-049` now names both.

**Fixtures:** `WG-ALK-067`, `AD-SAF-003` (staging), `AD-SAF-004` (maintenance command;
rounding up crosses the guard and the recheck steps back toward `D_current`; the variant
where `D_current` itself exceeds the guard withholds rather than affirming it).


Two direct textual conflicts.

**Scope.** `ALK-LIQUID-VOLUME-GUARD-001` limits "Alk dosing-solution volume delivered
through a **deliberate correction/return-plan execution** in any rolling 24-hour period".
`WG-ALK-067` — a canonical fixture for the same rule — requires: "do not issue that
liquid volume as one 24-hour **maintenance/correction** command". Ordinary maintenance is
excluded by the rule body and included by its fixture.

**Position.** `ALK-049` gives the calculation order as nine numbered steps. The
liquid-volume guard is not among them, and `ALK-044`'s list of constraints the
Recommendation Engine must apply does not mention it either. Whether it binds before or
after actuator rounding is therefore unstated, and it matters: rounding up past the guard
would violate it, exactly as `WG-ALK-063` demonstrates for the rate rail.

**Reachability.** The guard binds only when the solution is extremely dilute. It binds
when `ΔA / P > 0.02 · 1000 · V_L`, i.e. when
`P < ΔA / (20 · V_L)` dKH/mL. For a 0.50 dKH movement in a 77 L system that is
`P < 0.000325 dKH/mL` — roughly 213× weaker than the canon's own 0.0693 dKH/mL reference
solution. It is nonetheless reachable, and `WG-ALK-067` constructs it deliberately.

**Until closed (superseded by Freeze 5; historical).** Apply the guard to `SAFETY_RETURN` correction volumes, one-off
corrections and return-plan temporary components — the scope the rule body states — and
for ordinary maintenance emit:

```text
liquidVolumeGuardOnMaintenance = NOT_RUN
reason                         = SAFETY_LIQUID_GUARD_SCOPE_UNDEFINED
```

whenever a maintenance command would exceed `0.02 · 1000 · V_L` mL/day, together with
`recommendedDose = WITHHELD`. Withholding rather than issuing is the conservative
direction: the disputed reading (`WG-ALK-067`) is the one that forbids the command, and
issuing a dose the canon's own fixture forbids is the worse error.

Position: evaluate the guard as a **hard constraint in the post-rounding recheck** of
`ALK-ROUNDING-001` step 6, alongside the rate rail. `ALK-ROUNDING-001` step 6 says
"recheck all hard constraints that can be affected by actuator discretisation", and the
guard is such a constraint. This placement is derived from `ALK-ROUNDING-001` itself
rather than invented.

---

## OI-SAFETYRATE-001 — The high-breach temporary safety *rate* is not exempted from M-1

- **Class:** `CANON_DEFECT`
- **Canon:** `M-1`; `ALK-SAFETY-CORRECTION-RESOLUTION-001`; `ALK-003A` high breach
- **Owner module:** `SAFETY` / `CAPABILITY`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-11.**
>
> Encoded as `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` (canon, in `ALK-003A`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

The `M-1` exemption is extended to the temporary high-breach safety rate. The exact
calculated rate is emitted as an **advisory** rate when the actuator increment is unknown.
Two outputs stay distinct:

```text
temporarySafetyRateAdvisoryMlPerDay = D_safety,temp    exact, full precision
temporarySafetyPumpCommandMlPerDay  = NOT_RUN          while the increment is absent
```

All other hard rails and guards remain applicable. Potency stays load-bearing: without a
valid `P_selected` neither figure is emitted and only the required dKH movement and
direction are stated.

**Fixtures:** `AD-SAF-002` (advisory 1.443001443 mL/day emitted, pump command `NOT_RUN`),
`AD-SAF-005` (negative control across three capability cases; merging the two fields or
inventing a 0.1 mL/day increment is asserted forbidden).


`M-1` refuses a final actionable **maintenance-rate recommendation in mL/day** when
`actuatorIncrementMlPerDay` is missing. `ALK-SAFETY-CORRECTION-RESOLUTION-001` carves out
a narrow exemption: "They do **not** block a one-off `SAFETY_RETURN` correction
**volume**", and states the exemption "applies to one-off Alk `SAFETY_RETURN` correction
volume; it does not exempt ordinary maintenance mL/day recommendations from M-1".

But the **high-breach interpretable-consumption** path of `ALK-003A` does not produce a
one-off volume. It produces

```text
D_safety,temp = max(0, (C_estimate + S_safety) / P_selected)     [mL/day]
```

— a temporary safety **rate**. It is neither "a one-off correction volume" (so the
exemption does not name it) nor "an ordinary maintenance mL/day recommendation" (so the
prohibition does not name it either).

**Failure scenario.** Alk 11.30 dKH (above `OuterMax` 11.0), `C_estimate = 0.60 dKH/day`
interpretable, `P = 0.0693`, `actuatorIncrementMlPerDay` missing.
`R_down = min(11.30 − 10.80, 0.50) = 0.50`, so
`D_safety,temp = (0.60 − 0.50)/0.0693 = 1.443 mL/day`. Does the engine emit 1.443 mL/day
(unroundable, so not implementable as stated), refuse it under `M-1`, or emit it
unrounded as an urgent safety instruction?

Note the adjacent case is already determined: when consumption is *uninterpretable*,
`ALK-HIGH-BREACH-UNRESOLVED-001` recommends exactly `0 mL/day`, which needs no increment
and is unaffected.

**Until closed (superseded by Freeze 5; historical).**

```text
highBreachTemporaryRate = WITHHELD
reason                  = CAPABILITY_ACTUATOR_INCREMENT_REQUIRED_SAFETY_RATE_UNDEFINED
safetyDirection         = REDUCE_ALK_DOSING          (stated, not quantified)
```

The keeper is told the direction and the target `S_safety`, and the mL/day figure is
withheld — the same shape as `CORE-INFORM-PROCEED-001` Case B. The urgent position
information, the `SAFETY_RETURN` state and the 24-hour retest are all still emitted.

---

## OI-RETURNDURINGSAFETY-001 — An in-flight return plan meeting an outer-bound breach

- **Class:** `CANON_DEFECT`
- **Canon:** `ALK-SAFETY-RETURN-INTEGRATION-001` §5; `ALK-COMPOSITE-RAIL-001`;
  `ALK-056`; `ALK-058`
- **Owner module:** `SAFETY` / `RETURN`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-08.**
>
> Encoded as `ALK-RETURN-TERMINATED-BY-SAFETY-001` (canon, `ALK-SAFETY-RETURN-INTEGRATION-001` §5).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

Entering `SAFETY_RETURN` **immediately terminates** any active return plan. It is not
suspended, and opposing intentional components are never layered. The proposed
`SUSPENDED_PENDING_SAFETY` phase value is **not** adopted; `TERMINATED_BY_SAFETY_RETURN`
replaces it.

A terminated plan cannot automatically resume. After safety resolution a new plan requires
fresh `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` eligibility and a fresh user opt-in. The plan
keeps its identity, stored destination, duration, expiry and history; termination is
recorded as an event.

**Fixtures:** `AD-RTN-004` (the failure scenario above; two simultaneous intentional
components and the `SUSPENDED_PENDING_SAFETY` phase are asserted forbidden),
`AD-RTN-005` (negative control: no automatic resume once the safety return completes).


`ALK-SAFETY-RETURN-INTEGRATION-001` §5 states that while `SAFETY_RETURN` is active "no
ordinary Alk return plan is **started**; no second Alk correction plan is **layered on
top** of it." It is silent on a return plan that was **already running** when the breach
occurred.

**Failure scenario.** A downward return plan is running (temporary dose reduced below
maintenance to bring Alk down from 9.6 toward the 8.5 aim point). Consumption rises and
Alk falls through `OuterMin = 7.0` to 6.85. Now:

- a low `SAFETY_RETURN` requires `+0.35 dKH` of movement toward 7.20;
- the active return plan is still commanding a *downward* temporary component.

Does the plan stop, pause, or continue? `ALK-056` stops a plan on aim-point crossing —
not reached. `ALK-058` expires a plan at `2·T_plan + 2` days — not reached. §5's
prohibition on "layering" implies the two must not run together, but no rule terminates
the plan, and `ALK-COMPOSITE-RAIL-001` would otherwise have to net two opposing
intentional components against one 0.50 dKH/day budget, which contradicts §5's
prohibition on layering.

The mirror (upward plan running, Alk breaches `OuterMax`) has the same shape and is the
case `AUDIT-020` gestures at without resolving for the outer-bound path.

**Until closed (superseded by Freeze 5; historical).**

```text
returnPlanPhase       = SUSPENDED_PENDING_SAFETY
recommendedTemporaryMovement = STOP_PENDING_USER_ACTION
reason                = RETURN_SUSPENDED_BY_SAFETY_RETURN
actualDose            = UNKNOWN_OR_LAST_LOGGED
```

`STOP_PENDING_USER_ACTION` and `UNKNOWN_OR_LAST_LOGGED` are the exact semantics
`ALK-RETURN-EXPIRY-001` and `WG-ALK-032` already define for stopping a temporary
component the app cannot physically control, so no new semantics are invented. The
`SAFETY_RETURN` then owns the single intentional movement component and the composite
rail has one term, satisfying §5's no-layering requirement.

`SUSPENDED_PENDING_SAFETY` is a **new phase value not present in the canon**. It exists
only to keep the plan's identity while it is not commanding movement, and it must be
confirmed or replaced by the owner. If the owner prefers termination, the plan should end
outright and a fresh opt-in is required after the safety return completes.

---

# A2. Opened by `ALK_V2_FREEZE_5` review, closed by `ALK_V2_FREEZE_5` amendments

Independent review of the first Freeze-5 encoding found three points where writing a
decision into the canon would have required a **second** decision the owner had not made.
Each was left undetermined rather than resolved by derivation, per the rule that a canon gap
is never filled by the run that found it.

**The owner then decided all three**, as amendments F5-13, F5-14 and F5-15. Every item in
this section is now closed, and the analysis below is preserved as the record of why each
decision was needed.

## OI-HIGHBREACHBAND-001 — the high-breach status of a negative but not materially negative consumption estimate

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-NEGATIVE-MATERIALITY-001`; `ALK-HIGH-BREACH-UNRESOLVED-001`; `ALK-031`
- **Owner module:** `SAFETY` / `CONSUMPTION`
- **Raised by:** `canon-conformance-auditor`, Freeze-5 review

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-13.**
>
> Encoded as `ALK-HIGH-BREACH-NO-PAUSE-001` (canon, in `ALK-031`).
>
> Everything below this box is the pre-amendment analysis, preserved as the record
> of why the decision was needed. Its "Until closed" behaviour is **superseded**.

### Freeze-5 resolution

Reading (a). Above the outer bound, a negative `C_estimate` that is **not** materially
negative does **not** cause a recommendation to pause established maintenance dosing to
0 mL/day. It is treated as uncertainty-limited/uninterpretable for maintenance purposes:

- **HOLD** the established maintenance dose;
- the **separate high-breach safety handling is preserved** — outer-bound state,
  `SAFETY_RETURN`, position and direction reporting, magnesium-gate surfacing;
- **retesting is shortened/reprioritised** as already defined; the ~24 h high-breach and
  safety-return candidates are untouched;
- **zero biological consumption is never inferred** from it. `maintenanceEstimateStatus`
  stays `UNRESOLVED`.

The materially-negative branch still arms `ALK-HIGH-BREACH-UNRESOLVED-001`'s zero-dose
pause, and `C_estimate >= 0` still takes the temporary-safety-rate path. The boundary
therefore does decide the fail-safe, which is what `OI-NEGCONS-001` said it should.

**Fixture:** `AD-CON-002`, whose two variants sit one actuator increment apart and now
differ in whether delivery is paused.


F5-03 defines materially negative consumption and states its consequence **for maintenance
sizing**: neither branch may reduce an established maintenance dose. It says the
non-material branch is "uncertainty-limited/uninterpretable".

`ALK-HIGH-BREACH-UNRESOLVED-001` asks a different question — whether `C_estimate` is
"physically uninterpretable" — and its answer decides whether the engine **recommends
pausing alkalinity dosing to 0 mL/day**.

Two readings survive:

- **(a) only the material branch is uninterpretable.** The boundary then does exactly the
  job `OI-NEGCONS-001` said it does: it decides the fail-safe. `ALK-031`'s own two branch
  headings — `UNCERTAIN / non-resolvable` versus `NON_PHYSICAL_OR_UNEXPLAINED_GAIN` —
  support this, and it is consistent with `ALK-NEGATIVE-MATERIALITY-001`'s stated
  conservatism, which justifies `sigma_P = sigma_D = 0` as *delaying* a pause.
- **(b) both negative branches are uninterpretable.** F5-03 does use the word for both. But
  then the boundary is irrelevant to the fail-safe, the pause fires across the whole
  negative range, and the conservatism argument that justifies the boundary contradicts the
  behaviour it produces.

**Failure scenario.** `A_now = 11.2 dKH` above `OuterMax = 11.0`; three clean clusters give
`sigma_S = 0.035355339`, so the band is `-0.045255 <= C_estimate < 0`. At `D = 1.6 mL/day`,
`C = -0.03912`, inside the band. Under (a) the engine reports the breach and holds. Under
(b) it recommends stopping alkalinity dosing entirely.

**Until closed (superseded by F5-13; historical).**

```text
highBreachZeroDosePause = NOT_RUN
reason                  = SAFETY_HIGH_BREACH_NARROW_BAND_UNDETERMINED
```

Outside the band the fail-safe is fully determined in both directions: materially negative
arms it, non-negative takes the temporary-safety-rate path. Maintenance is HOLD throughout.
Fixture: `AD-CON-002`.

---

## OI-CLUSTERTIE-001 — two candidate clusters sharing a representative timestamp

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-INDEPENDENT-SELECTION-001`; Part II §5.3; Part II §2.4
- **Owner module:** `SEGMENTATION`
- **Raised by:** `breaker`, Freeze-5 review

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-14.**
>
> Encoded as `ALK-SAME-TIMESTAMP-COALESCE-001` (canon, under `ALK-008`).
>
> Everything below this box is the pre-amendment analysis, preserved as the record
> of why the decision was needed. Its "Until closed" behaviour is **superseded**.

### Freeze-5 resolution

The tie is removed rather than broken. Clusters sharing an identical representative
timestamp **are not separate independent testing episodes** — one instant is one episode
however many methods were used.

Before forward-greedy selection runs, same-timestamp clusters are coalesced: their combined
underlying measurements are pooled and one cluster is rebuilt from the pool using the
existing canonical rules (Part II §5.4, §5.5, §5.6 and `ALK-005`). Selection then operates
over a unique-time sequence, so the ordering is total and no tie can arise.

Selection must **never** depend on arbitrary event order, ID order, insertion order,
database ordering or implementation sorting. That was the actual defect: the actuator
command was a property of how the rows happened to be stored.

Two consequences follow from the existing rules and are asserted:

- the coalesced value is the median of the **pooled raw readings**, not the mean of the two
  cluster medians;
- a pool spanning more than 0.20 dKH is `ANOMALOUS` under `ALK-005`. **Coalescing never
  launders an internally inconsistent set into a clean one.**

**Fixtures:** `AD-SEG-007` (positive), `AD-SEG-008` (negative control: a 0.30 dKH pool stays
`ANOMALOUS`).


F5-01 resolves which cluster survives when clusters are *close together*. It assumes
distinct representative timestamps and states no tie-break for identical ones.

The tie is reachable. Part II §5.3 groups readings automatically only within the same or a
compatible test method, so two incompatible methods run at one instant produce **two**
clusters with the same representative time. Part II §5.2's explicit grouping gives a second
route.

**Failure scenario.** `8.60` (Hanna) and `8.80` (Salifert) at Day 0 09:00, then `8.30` at
Day 2 and `8.00` at Day 4, `D_current = 9.0`, `P = 0.0693`.

| accepted | `S_TS` | `sigma_S` | `S_supported` | rounded command |
|---|---|---|---|---|
| `8.60, 8.30, 8.00` | −0.15 | 0.035355339 | −0.104745166 | **10.5 mL/day** |
| `8.80, 8.30, 8.00` | −0.20 | 0.035355339 | −0.154745166 | **11.2 mL/day** |

Both sit inside the 25% step cap and the 0.50 dKH/day rail, so nothing downstream
reconciles them. 0.7 mL/day of divergence from one identical ledger.

**Until closed (superseded by F5-14; historical).**

```text
independentSelection       = TIE_UNRESOLVED
movementEvidence           = INSUFFICIENT
automaticMaintenanceAction = WITHHELD
reason                     = EVIDENCE_INDEPENDENT_SELECTION_TIE_UNRESOLVED
```

with Part II §2.4 item 4's ambiguity marking. Position, safety, history and retest are
unaffected. Fixture: `AD-SEG-007`.

**Note for the owner.** Averaging the two into one cluster is *not* available as a quiet
default: Part II §5.3 kept them separate deliberately, because they are different methods.

---

## OI-RETESTFLOOR-001 — the retest scheduler has no minimum useful interval

- **Class:** `CANON_DEFECT` (minor) + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-RETEST-SCHEDULER-001`; Part II §66; `ALK-008`
- **Owner module:** `RETEST`
- **Raised by:** `canon-conformance-auditor` and `breaker`, Freeze-5 review

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-15.**
>
> Encoded as `ALK-RETEST-SCHEDULER-001` amended (canon, `ALK-053A`).
>
> Everything below this box is the pre-amendment analysis, preserved as the record
> of why the decision was needed. Its "Until closed" behaviour is **superseded**.

### Freeze-5 resolution

The ordinary signal candidate carries a 24-hour floor **inside its own formula**:

```text
T_signal_days = max(1 day, 0.10 dKH / |S_supported|)      S_supported != 0
```

The floor applies to that candidate and no other. The explicit rapid, outer-bound/forecast,
safety, high-breach and immediate-repeat candidates may schedule earlier than 24 hours, or
return `TEST_NOW` / earliest-practicable semantics, when already warranted.

Preserved unchanged: the ~48 h ordinary post-maintenance-change response test, the normal
formal follow-up around Day 4, the ~Day-4 ordinary observation ceiling, and one
authoritative scheduler choosing the earliest applicable candidate.

`T_signal` was the only ordinary candidate that could fall below 24 hours — routine cadence
is 48 h and both post-change candidates are ~48 h or later — so Part II §66's minimum useful
interval is supplied exactly where it was reachable.

**Fixture:** `AD-RET-001` (raw 22.913 h floored to 24 h and selected); `AD-RET-004` asserts
the exemption, where an outer-bound crossing inside the safety lead still returns test-now.


F5-09 supplies a ceiling (the ~Day-4 window) and forbids inventing constants to fill the
previously absent generic scheduler parameters. Part II §66's **minimum useful interval**
was one of them, so Freeze 5 does not supply it.

The consequence is real but small. Where `|S_supported| > 0.10 dKH/day`,
`T_signal = 0.10 / |S_supported|` is under 24 hours, and the scheduler recommends a test
that `ALK-008` will not accept as a new full-strength maintenance-trend observation. The
test still establishes position, still confirms or refutes an anomaly, and still feeds
`ALK-RAPID-BASIS-001`.

**Why `ALK-008`'s 24 h was not reused.** It is a *trend-independence* minimum, not a
*scheduling* minimum. Repurposing it would be a new mapping, and it would place the floor
exactly on the acceptance boundary with no tolerance — a keeper testing two minutes early
would produce nothing for the trend.

**Until closed (superseded by F5-15; historical).**

```text
minimumUsefulIntervalApplied = NOT_RUN
reason                       = RETEST_MINIMUM_INTERVAL_UNAVAILABLE
```

The candidate is emitted as computed. This costs test strips, not tank safety: the
scheduler errs early, never late. Fixture: `AD-RET-001`.


---

# B. Non-blocking canon defects

## OI-STABLE-001 — `ALK-012`'s illustrative examples contradict its normative condition

- **Class:** `CANON_DEFECT` (documentation; normative text is unambiguous)
- **Canon:** `ALK-STABLE-001`

`ALK-STABLE-001` requires, exactly, `S_supported = 0` **and** `S_observed = 0`. It then
offers examples "that may legitimately resolve to zero robust slope":

```text
8.50, 8.48, 8.52  ->  stable and in range
7.80, 7.82, 7.79  ->  stable and below range
9.20, 9.18, 9.21  ->  stable and above range
```

None of these has a zero Theil-Sen slope at the ordinary 48-hour cadence. For
`8.50, 8.48, 8.52` at t = 0, 2, 4 days the three pairwise slopes are
`−0.010, +0.005, +0.020` and the median is `+0.005 dKH/day`. The correct classification
under `ALK-STABLE-001` is `UNCERTAINTY_LIMITED` (leaning `RISING`), not `STABLE`. The same
holds for the other two examples.

**Resolution.** The boxed normative condition governs; the examples are illustrative prose
and are wrong. Implement the exact condition. Do **not** introduce a near-zero tolerance
band to make the examples true — that would be exactly the invented behaviour the brief
forbids, and it would silently re-create the fixed movement gate that `ALK-011`
deliberately removed.

**Consequence to record.** `STABLE` is a rare state on real data. Every out-of-range
resting tank will normally sit in `UNCERTAINTY_LIMITED` with `S_supported = 0`. This is
what made `OI-RETURNOFFER-001` load-bearing rather than academic.

**Freeze-5 note.** F5-04 explicitly declined to change `ALK-STABLE-001` and instead created
the separate `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` predicate, which covers exactly the
`UNCERTAINTY_LIMITED` case above. This item therefore stays **open** as a documentation
defect — the illustrative examples remain wrong — but it is no longer load-bearing for the
return-plan offer.

---

## OI-DAY4-001 — `ALK-037`'s Day-4 second adjustment conflicts with the evidence minimum

- **Class:** `CANON_DEFECT` (contradiction) — resolvable by the canon's own precedence
- **Canon:** `ALK-037`; `ALK-MOVEMENT-001`; `ALK-MINIMUM-CADENCE-001`; Part II §31;
  `ALK-017`; `WG-ALK-007`; `WG-ALK-008`
- **Owner module:** `MAINTENANCE`

`ALK-037` describes the second post-change test (commonly Day +4) as "the preferred point
to … **make a routine second maintenance adjustment if justified**".

At Day +4 the post-change regime contains exactly **two** genuine post-change clusters
(Day +2, Day +4) spanning **two** days. The Day-0 anchor is explicitly excluded from
post-change observations (Part II §31: "The baseline anchor is **not counted as a
post-change observation**"; `ALK-017` repeats this).

`ALK-MOVEMENT-001` and `ALK-MINIMUM-CADENCE-001` require **≥ 3 independent clusters** and
**≥ 4 days** of span before ordinary automatic maintenance advice. Two clusters over two
days does not meet either. Earliest post-change ordinary sufficiency is therefore
**Day +6** (clusters at +2, +4, +6 spanning 4 days).

`WG-ALK-007` and `WG-ALK-008` confirm this shape from the response side: at Day +4 the
canon uses a **two-point** post slope (`sigma_post = √(0.10² + 0.10²)/2 = 0.070711`) and
reaches `INCONCLUSIVE`; at Day +6 with three post points (`sigma_post = 0.035355`) it
reaches `EXPECTED`. The formal *response classifier* legitimately runs at Day +4 on a
two-point post slope; ordinary *maintenance action* does not.

**Resolution.** `ALK-MOVEMENT-001` and `ALK-MINIMUM-CADENCE-001` carry stable rule IDs and
an explicit owner acceptance. `ALK-037` carries no stable rule ID and Part I §0.2 requires
any deliberate exception to be "explicit, narrow, and identified by a stable rule ID".
The owner-lock summary for `ALK-POSTCHANGE-001` also weakens `ALK-037` to "a second
post-change test around Day 4 is normally preferred **before declaring** final maintenance
matching". Therefore:

```text
Day +4 : formal response classification MAY run (two-point post slope).
         Ordinary maintenance adjustment does NOT run; movementEvidence is
         INSUFFICIENT on the post-change segment.
         -> HOLD, reason EVIDENCE_INSUFFICIENT_POSTCHANGE_SPAN
Day +6 : ordinary maintenance adjustment may run.
```

Owner confirmation is recommended because the resolution makes `ALK-037`'s wording
misleading even though it does not change any frozen numeric rule.

---

## OI-EXPOSURE-001 — Alkalinity has no numeric minimum exposure

- **Class:** `CANON_DEFECT` (minor; effectively masked)
- **Canon:** Part II §30, §69; Part II §75 (defers "Alk ordinary minimum post-change
  exposure" to Part III); `ALK-035`; `ALK-POSTCHANGE-001`
- **Owner module:** `RESPONSE`

Part II §69's evaluation pseudocode gates on `policy.minimumExposure`, and Part II §75
explicitly defers the alkalinity value to Part III. Part III never supplies it.

In practice the gap is masked: `ALK-POSTCHANGE-001` places the first post-change test at
~48 h, and `ALK-008` excludes a cluster taken within 24 h of the previous independent one
from ordinary trend evidence. Both floors exceed the "~24 hours is approximately one
complete cycle" guidance in Part II §30, so no reachable ordinary path evaluates a
response with sub-cycle exposure.

**Until closed.** Compute and store `exposureFraction` for audit (it is a required
`Intervention` field), and gate on the two floors the canon does state rather than on an
invented `minimumExposure` constant:

```text
exposureFraction        = computed and stored
minimumExposureGate     = NOT_RUN
reason                  = RESPONSE_MINIMUM_EXPOSURE_POLICY_UNAVAILABLE
```

No behaviour changes on any reachable ordinary path. Record it so a future schedule
change (e.g. a non-daily dosing cycle) does not silently pass through an ungated exposure.

---

## OI-NORMUNCERT-001 — Normalization uncertainty is never propagated for alkalinity

- **Class:** `CANON_DEFECT` (minor)
- **Canon:** Part II §9.4; `ALK-033`; `ALK-034`
- **Owner module:** `SEGMENTATION` / `UNCERTAINTY`

Part II §9.4 says known-input normalization carries its own uncertainty (potency,
delivered volume, net volume) and "where material, propagate this into the analytical
point's effective uncertainty. Parameter canons define the practical implementation."
Part III defines no propagation for alkalinity.

**Failure scenario.** A known 20% water change with measured replacement Alk normalizes a
`−0.40 dKH` step out of subsequent points. If the replacement measurement itself carries
0.10 dKH uncertainty, the normalized points carry roughly
`√(0.10² + (0.20 · 0.10)²) = 0.102 dKH` — barely above the floor, so immaterial. But a
staged correction of five known additions each with potency uncertainty could accumulate
materially, and nothing in the canon says how.

**Until closed.** Do not propagate. `sigma_point` retains its canonical definition
(`max(0.10, sigma_resid)`) exactly as frozen; note in the audit trace that normalization
was applied and that its uncertainty was not propagated:

```text
normalizationUncertaintyPropagated = NOT_RUN
reason = SEGMENT_NORMALIZATION_UNCERTAINTY_MODEL_UNAVAILABLE
```

Adding a propagation term would change `sigma_S`, `S_supported` and the dose on fixtures
that the canon has already frozen numerically (`WG-ALK-011` normalizes and states no
uncertainty change), so propagating would break canonical goldens. Not propagating is the
canon-consistent choice; the defect is that the residual risk is undocumented.

---

## OI-CONFIDENCE-001 — `recommendationConfidence` has no deterministic derivation

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED` (non-behavioural)
- **Canon:** `ALK-071` / `ALK-CONFIDENCE-OUTPUT-001`; Part I §48; `X-INV-010`
- **Owner module:** `OUTPUT`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-12.**
>
> Encoded as `ALK-CONFIDENCE-OUTPUT-001` (canon, amended in `ALK-071`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

No numeric `LOW`/`MODERATE`/`HIGH` thresholds are invented. Until separately specified:

```text
recommendationConfidence = UNSPECIFIED
```

and the underlying evidence facts are surfaced in its place — `independentClusters`,
`spanDays`, `sigma_S`, `|S_supported| / |S_observed|`, confounders, potency confidence and
delivery basis. Confidence remains explanatory only and must never participate in dosing
arithmetic. The proposal recorded below was **not** adopted.

**Fixture:** `AD-OUT-001`, asserting the surfaced facts and forbidding any three-valued
label or arithmetic path.


`ALK-071` defines `LOW` / `MODERATE` / `HIGH` by example lists only ("two-point
provisional trend", "robust recent trend", "small `sigma_S` relative to observed slope"),
with no thresholds and no combination rule. Part I §48 lists candidate inputs, also
without a rule.

The safety consequence is nil by construction: `ALK-CONFIDENCE-OUTPUT-001` and
`X-INV-010` forbid confidence from participating in any calculation, and
`INV-ALK-CONFIDENCE-001` is the fixture that proves it. Confidence is a pure label.

**Until closed (superseded by Freeze 5; historical).**

```text
recommendationConfidence = UNSPECIFIED
reason                   = OUTPUT_CONFIDENCE_DERIVATION_UNAVAILABLE
```

and surface the underlying evidence facts (`independentClusters`, `spanDays`,
`sigma_S`, `|S_supported| / |S_observed|`, confounder list, potency confidence) which are
all individually determinate. A card can be honest and useful without the three-valued
label; it cannot be honest with a label whose derivation is invented.

**Proposal put to the owner (historical; the owner's actual decision is in the Freeze-5 resolution above).** Because `X-INV-010` guarantees the label
cannot leak into arithmetic, a purely descriptive deterministic mapping is safe to adopt,
e.g. `HIGH` when ordinary evidence is `SUFFICIENT`, no confounders, potency
`CALIBRATED` or better, and `|S_supported| ≥ 0.5 · |S_observed|`; `LOW` on a two-point
rapid basis, a soft confounder, a mixed-dose interval or `THEORETICAL_ONLY` potency;
`MODERATE` otherwise. This is a wording decision, not a chemistry decision, but it is
still the owner's.

---

## OI-POTENCYSTATE-001 — The potency-confidence state machine is not exhaustive and has no exit from `REASSESSING`

- **Class:** `CANON_DEFECT` (potency learning is `CAPABILITY_GATED`, so non-blocking now)
- **Canon:** `ALK-POTENCY-CONFIDENCE-001`
- **Owner module:** `POTENCY`

Two gaps.

**(a) Partition gap.** The states are defined by independent membership conditions rather
than as an ordered decision. `PROVISIONAL` requires ≥ 2 `CALIBRATION_ELIGIBLE`
observations *from at least 2 separate dose-change interventions*; `EXPLORATORY` requires
*fewer than 2* `CALIBRATION_ELIGIBLE` observations; `THEORETICAL_ONLY` requires *no*
observation with `SNR ≥ 2`. A state with 2 calibration-eligible observations arising from
a single intervention satisfies none of the three.

The gap is **latent**: `ALK-016` yields exactly one `P_i` per qualifying dose-change
intervention, so *n* observations imply *n* interventions and the "separate interventions"
clauses are never independently binding. The gap becomes reachable the moment a second
observation source is introduced. `CALIBRATED` and `STRONGLY_CALIBRATED` have the same
structure, with the additional conditions (`RDisp`, span) genuinely able to fail — a pool
of 3 eligible observations with `RDisp_P = 0.20` satisfies `CALIBRATED`'s count but not
its dispersion, and satisfies neither `PROVISIONAL`'s nor `EXPLORATORY`'s conditions as
literally written.

**(b) No exit from `REASSESSING`.** Entry is defined exactly (two consecutive
calibration-grade observations disagreeing by more than 15% in the same direction). While
`REASSESSING` the engine keeps the prior selected potency and collects evidence. A
confirmed context change leaves `REASSESSING` by creating a new context. **No rule
returns a context to `CALIBRATED`.** A context that enters `REASSESSING` and then produces
consistent evidence has no specified way out, and `CALIBRATED` explicitly requires
"state is not `REASSESSING`" — so the state is absorbing.

**Until closed.** Evaluate the states as an ordered ladder, highest first
(`STRONGLY_CALIBRATED` → `CALIBRATED` → `PROVISIONAL` → `EXPLORATORY` →
`THEORETICAL_ONLY`), and when no state's conditions are met emit:

```text
potencyConfidence = UNRESOLVED
selectedPotency   = theoretical/configured        (the safe default the canon names)
reason            = POTENCY_CONFIDENCE_STATE_UNDETERMINED
```

`REASSESSING` is treated as absorbing until an owner defines an exit; while absorbing,
`selectedPotency` holds at the prior value exactly as `ALK-POTENCY-CONFIDENCE-001`
requires, so no unsafe potency is ever adopted.

---

## OI-POTENCYSNAP-001 — "Last accepted calibration snapshot" is not a defined object

- **Class:** `CANON_DEFECT` (minor; gated with potency learning)
- **Canon:** `ALK-POTENCY-CONFIDENCE-001` (`REASSESSING`)
- **Owner module:** `POTENCY`

`REASSESSING` inspects "the two most recent new `CALIBRATION_ELIGIBLE` observations that
were not part of the **last accepted calibration snapshot**". No rule creates, names,
times or persists a calibration snapshot. Without it, "not part of" is not evaluable.

**Until closed.** `POTENCY_CALIBRATION_SNAPSHOT_UNAVAILABLE`; `REASSESSING` detection is
`NOT_RUN`. `selectedPotency` continues from the existing confidence state, which is the
canon's own conservative behaviour while `REASSESSING`.

**Proposal for the owner (not authority).** Persist a `PotencyCalibrationSnapshot`
whenever `selectedPotency` transitions to a learned value, recording the observation IDs
in the pool at that instant. That is the minimum object the rule presupposes.

---

## OI-WG024-001 — `WG-ALK-024` is not an independently checkable fixture

- **Class:** `CANON_DEFECT` (fixture underspecification)
- **Canon:** `WG-ALK-024`; `ALK-017`
- **Owner module:** `POTENCY`

`WG-ALK-024` gives `S_pre = −0.180`, `S_post = −0.040`, `D_pre = 8.0`, `D_post = 10.0`,
hence `ΔS = +0.140`, `ΔD = 2.0`, `P_i = 0.0700 dKH/mL`, and then asserts
`potencyObservationEligible = true` **conditional on** "all `ALK-017` eligibility rules
are satisfied". It does not state `sigma_pre` or `sigma_post`, so the assertion cannot be
checked from the fixture's own inputs.

At `ALK-017`'s *minimum* evidence per side (3 clusters, 4-day span, clean line), each side
has `sigma = 0.10/√8 = 0.035355`, so `sigma_ΔS = 0.05` and

```text
SNR_potency = 0.140 / 0.05 = 2.80    ->  DIAGNOSTIC_ONLY, not CALIBRATION_ELIGIBLE
```

The fixture's stated outcome is only reachable with *more* than minimum evidence.
Derived thresholds an implementer needs:

| Evidence per side | `sigma_side` | `sigma_ΔS` | min `|ΔS|` for `SNR ≥ 3` | min `|ΔD|` at `P = 0.0693` |
|---|---|---|---|---|
| 3 clusters / 4 d | 0.035355 | 0.050000 | 0.150000 | **2.1645 mL/day** |
| 3 pre / 5 post | 0.035355 / 0.015811 | 0.038730 | 0.116190 | 1.6766 mL/day |
| 5 clusters / 8 d | 0.015811 | 0.022361 | 0.067082 | 0.9680 mL/day |

**Until closed.** The corpus carries `WG-ALK-024` twice: once verbatim with
`eligibility: CONDITIONAL_NOT_CHECKABLE`, and once as a determined variant
(`AD-POT-001`) that states the per-side evidence explicitly so the SNR classification is
computable. The verbatim entry asserts only the arithmetic (`P_i = 0.0700`), which is
unconditional.

---

## OI-ANOMCLUSTER-001 — A historical internally inconsistent cluster has no defined treatment

- **Class:** `CANON_DEFECT` (minor)
- **Canon:** `ALK-005`; Part II §5.7, §48, §49
- **Owner module:** `CLUSTER` (within `SEGMENTATION`)

`ALK-005` and Part II §5.7 say a cluster whose repeat spread exceeds 0.20 dKH becomes
`ANOMALOUS`, all readings are preserved, no precise median conclusion is manufactured, and
another test is requested. Part II §48 defines what happens when the **latest** cluster is
anomalous (repeat now, withhold ordinary dose action).

Nothing defines what a **historical** anomalous cluster contributes. Part II §49 forbids
excluding a historical suspicious point without documented basis — and an internally
inconsistent repeat spread arguably *is* documented basis, or arguably is not.

**Failure scenario.** Clusters at Day 0 (repeats 8.60/8.85, spread 0.25 → `ANOMALOUS`),
Day 2 (8.40), Day 4 (8.20). If Day 0 participates with its median 8.725, `S_TS` differs
from the case where it is excluded — and excluding it leaves 2 clusters, below the
ordinary minimum, so the recommendation changes from an action to `INSUFFICIENT`.

**Until closed.** Retain the cluster (Part II §49's default is retention) but mark the
segment:

```text
segmentAnomaly = HISTORICAL_ANOMALOUS_CLUSTER_PRESENT
movementEvidence = ANOMALOUS
reason = EVIDENCE_ANOMALOUS_HISTORICAL_CLUSTER
```

`ANOMALOUS` ranks above `INSUFFICIENT` in Part II §24's ordering and blocks ordinary
inference, so the engine holds rather than choosing between two slopes. That is derived
from Part II §24 and §49 rather than invented.

---

## OI-OVERSHOOT-001 — Overshoot has no horizon and no return-plan boundary rule

- **Class:** `CANON_DEFECT` (minor)
- **Canon:** `ALK-043`; Part I §7.6A; Part II §34A
- **Owner module:** `RESPONSE`

`OVERSHOOT` means "the newest valid measured level has crossed the relevant target
boundary in the undesired direction **after an intervention**". Two things are unstated:

1. **Horizon.** How long after an intervention does `OVERSHOOT` remain assessable? Without
   a horizon, a tank that drifts above range six weeks after an upward dose change is
   still technically "after an intervention".
2. **Relevant boundary during a return plan.** A return plan's destination is the aim
   point (`ALK-056` stops movement on first reach/pass). Is overshoot then measured
   against the aim point, or against the far edge of the target range? `ALK-043`'s example
   uses the range edge for a maintenance intervention and says nothing about plans.

**Until closed.** Assess `OVERSHOOT` only while an intervention is in a non-terminal phase
(`JUST_IMPLEMENTED`, `OBSERVING`, `ASSESSMENT_DUE`) or within the
`ATTRIBUTION_HORIZON` of 14 days from `actualStartTime`, whichever ends later — both
bounds are canonical values used elsewhere for the same intervention. Measure against the
**target-range edge** on the side of the intervention's intended direction, which is
`ALK-043`'s only worked case. Emit

```text
overshootHorizonBasis = ATTRIBUTION_HORIZON_DERIVED
reason                = RESPONSE_OVERSHOOT_HORIZON_DERIVED
```

so the derivation is visible and correctable.

---

## OI-RAPIDBASIS-001 — Which slope is tested against the 0.30 dKH/day rapid threshold

- **Class:** `CANON_DEFECT` (minor) + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-RAPID-001`; `ALK-009`; `ALK-011A`
- **Owner module:** `TREND`

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-07.**
>
> Encoded as `ALK-RAPID-BASIS-001` (canon, in `ALK-013`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

`rapidConfirmed` is determined from the **latest independent pair** using the existing
0.30 dKH/day threshold. With three or more clusters, Theil–Sen remains the ordinary
trajectory and the dose-sizing basis. Rapid confirmation changes pathway, cadence and cap
eligibility; it never substitutes the latest-pair slope as the ordinary sizing slope, the
consumption input or the forecast slope.

**Fixture:** `AD-RAP-001`, with both wrong readings asserted forbidden — using −0.35 to
size, and testing the Theil–Sen −0.15 against the threshold.


`ALK-RAPID-001` requires `|S| ≥ 0.30 dKH/day` with "at least two independent testing
episodes; at least 24 hours elapsed between their representative times". When only two
clusters exist, `S` is unambiguously the two-point rate. When **three or more** clusters
exist, `S` could be the canonical Theil-Sen slope over the segment or the two-point rate
between the latest pair.

**Failure scenario.** Clusters at Day 0 = 8.60, Day 2 = 8.50, Day 3 = 8.15.
`S_TS = median(−0.05, −0.15, −0.35) = −0.15` (not rapid). The latest pair gives
`(8.15 − 8.50)/1 = −0.35` (rapid). Rapid confirmation controls a 24-hour retest and the
gateway to the exceptional 50% step cap, so the two readings differ materially.

**Until closed (superseded by Freeze 5; historical).** Evaluate the rapid condition on the **latest independent pair**, which
is what `ALK-RAPID-001`'s own wording describes ("two independent testing episodes … 24
hours elapsed between their representative times"), and record it explicitly:

```text
rapidBasis = LATEST_INDEPENDENT_PAIR
```

This does **not** change the sizing slope: `ALK-011A` selects the multi-point formula
whenever three or more eligible clusters exist, so `sigma_S` and `S_supported` remain
Theil-Sen based. Rapid confirmation only unlocks early action, a shorter retest and the
50%-cap gateway. Owner confirmation recommended.

---

## OI-PIPELINE-001 — `ALK-049` omits two constraints from its ordering

- **Class:** `CANON_DEFECT` (minor)
- **Canon:** `ALK-049`; `ALK-044`; `ALK-COMPOSITE-RAIL-001`;
  `ALK-LIQUID-VOLUME-GUARD-001`
- **Owner module:** `MAINTENANCE`

`ALK-049`'s nine-step calculation order and `ALK-044`'s constraint list together cover
evidence, uncertainty-limited hold, intervention lock, potency validity, physical rail,
step cap, empirical bracket, non-negative clamp and actuator rounding. Neither mentions
`ALK-COMPOSITE-RAIL-001` or `ALK-LIQUID-VOLUME-GUARD-001`.

The composite rail's placement is effectively moot: `ALK-SAFETY-RETURN-INTEGRATION-001`
§1 defers **any** new maintenance change unconditionally while `SAFETY_RETURN` is active,
and stable-out-of-range (return plan) is mutually exclusive with a supported non-zero
slope (maintenance change), so no two intentional Alk components are simultaneously
recommendable in the Alk-only runtime. The composite rail is a defensive invariant with
no reachable multi-term case; `WG-ALK-052` exercises it as an assertion that the
deferral happened, not as an arithmetic allocation.

The liquid guard's placement is handled under `OI-LIQUIDGUARD-001`.

**Resolution.** Implement `ALK-049` verbatim, add the composite rail as a post-assembly
assertion over all recommended intentional components (fail loudly if more than one is
simultaneously active), and place the liquid guard per `OI-LIQUIDGUARD-001`. Record both
as pipeline positions derived rather than stated.

**Freeze-5 note — partially closed.** F5-06 put the liquid guard into the canon's own
ordering: `ALK-ROUNDING-001` step 6 now names it beside the rate rail, and `ALK-049` names
both the guard recheck and the composite-rail assertion. The guard limb of this item is
**closed**. The composite rail's position remains a derived post-assembly assertion, and
F5-08 removed the one case that could have made it multi-term — an in-flight return plan
meeting a breach is now terminated rather than layered. This item stays open for the
composite rail only.

---

## OI-PLANTARGETEDIT-001 — A target-range edit during an active return plan

- **Class:** `CANON_DEFECT` (minor)
- **Canon:** `ALK-066`; `AUDIT-030`; Part I §9.4; `ALK-RETURN-EXPIRY-001`; `WG-ALK-028`
- **Owner module:** `RETURN`

`AUDIT-030` states that on a target-range change "position classification may change;
return-plan eligibility/**destination** may change". Part I §9.4 requires a return-plan
event to store its destination, predicted duration, arrival criteria and expiry, and
`ALK-RETURN-EXPIRY-001` computes `T_expiry = 2·T_plan + 2` from that stored duration.

Nothing says whether an **already running** plan retargets.

**Failure scenario.** A plan is running from 7.80 toward an 8.50 aim point at
+0.25 dKH/day, `T_plan = 2.8 d`, `T_expiry = 7.6 d`. On day 2 the keeper edits the target
range from 8.2–8.8 to 8.4–9.0, moving the aim point to 8.70.

- If the plan retargets: the destination becomes 8.70, `T_plan` becomes 3.6 d and
  `T_expiry` becomes 9.2 d — a stored, already-committed expiry silently moves.
- If it does not: the plan completes at 8.50, which is now below the new preferred range,
  and the keeper must opt into a second plan.

**Until closed.** Keep the plan's **stored** destination, duration and expiry. A target
edit reclassifies position and may change eligibility for a *new* offer; it does not
retarget a plan already in flight.

This reading follows from the canon's own structure — the destination is a stored field on
an immutable plan event, the expiry is derived from it, and `ALK-066` establishes that a
target edit alters classification rather than committed records — but `AUDIT-030`'s wording
is loose enough that owner confirmation is warranted.

---

## OI-MAINTDURINGPLAN-001 — Maintenance recommendations while an ordinary return plan runs

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-070` (final matrix row); Part II §40, §58, §59; `PI-35`
- **Owner module:** `MAINTENANCE`

A return plan deliberately creates a non-zero trajectory, so a naive maintenance
controller would see a supported non-zero slope and try to cancel the plan's own movement.
No single rule states "hold maintenance during a plan", so it is worth recording the
derivation.

Three rules compose to give it:

1. `ALK-070`'s final row — "Any position / Active unevaluable intervention → Hold current
   intervention unless override";
2. Part II §58 — "do not issue a second ordinary maintenance adjustment while the current
   intervention is `NOT_YET_ASSESSABLE`";
3. Part II §40 — "A return plan's intentional trajectory must not be misread as evidence
   that maintenance is wrong", and consumption estimation during a plan must account for
   the plan's known temporary input.

A return plan is an intervention (Part II §39) and is not assessable until it reaches its
aim point or expires. Therefore no new ordinary maintenance change is issued while it runs,
and consumption during the plan is computed with `D = D_temporary` so the plan's own input
is not attributed to biology.

No owner input is needed. Recorded because the composition is easy to miss.

---

## OI-DETERMINISM-001 — Identity generation and numeric representation

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part II §64; `ALK-065`; `ALK-G040`; `WG-ALK-029`
- **Owner module:** `AUDIT`

Two mechanical choices sit between "the engine is deterministic" and "replay is
byte-identical", and both would otherwise be judgement calls.

**Identity.** Part II §64 requires identical results on replay; `ALK-065` and
`WG-ALK-029` require a **new** `assessmentId` when data changes. A random or sequential id
satisfies the second and breaks the first. Both hold if identity is **derived from
content**:

```text
assessmentId = H(ledgerDigest, configVersionId, asOf, engineVersion, canonVersion)
auditTraceId = H(assessmentId, "audit")
```

Same inputs ⇒ same id; a backdated insertion changes `ledgerDigest` ⇒ a new id, exactly as
`WG-ALK-029` requires. Fact ids (`readingId`, `doseStateId`, …) are external inputs and are
never regenerated.

**Numeric representation.** Byte-identical replay requires a reproducible numeric model:
IEEE 754 binary64 throughout; no extended-precision intermediates; no
compiler-reordered or fused multiply-add in the chemistry path; a fixed summation order
(the canonical event order) for `Sxx` and every other accumulation. Comparisons against
frozen constants use the tolerances in `ALK-V2-IMPLEMENTATION-CONTRACT.md` §7; the
actuator command compares exactly.

No owner input is needed. Recorded because "deterministic" is not self-implementing.

---

# C. Already determined by the canon — pinned conventions

These need no owner input. They are recorded so that two implementers do not choose
differently, and so a reviewer can see the derivation.

## OI-MEDIAN-001 — Median and MAD for even sample counts

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part II §5.4, §5.6, §19.2, §19.3, §19.4; `ALK-POTENCY-POOL-001`

`median(·)` means the standard arithmetic median: sort ascending; for odd *n* the central
order statistic; for even *n* the arithmetic mean of the two central order statistics.
`MAD(x) = median(|x_i − median(x)|)` using the same definition at both levels.

This is the ordinary mathematical meaning of the operator the canon writes, and no canon
text proposes a low-median or high-median variant. It is pinned because it is
**numerically load-bearing**: fixture `AD-TRD-002` has four clusters and six pairwise
slopes sorted `[−0.070, −0.070, −0.033333, −0.015, −0.015, +0.040]`, so
`S_TS = (−0.033333 + −0.015)/2 = −0.0241667 dKH/day`. A low-median implementation would
return `−0.033333` and a different recommendation.

Applies identically to: cluster representative value, cluster representative timestamp,
Theil-Sen slope, Theil-Sen intercept, residual MAD, cluster-spread MAD, learned-potency
pool median, potency `MAD_P`.

## OI-EVIDENCEVOCAB-001 — `UNCERTAINTY_LIMITED` extends the shared evidence vocabulary

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part I §7.3; `ALK-MOVEMENT-001`; Part I §0.2

Part I §7.3's evidence vocabulary is `INSUFFICIENT | PROVISIONAL | SUFFICIENT |
HIGH_CONFIDENCE | CONFOUNDED | ANOMALOUS`. `ALK-MOVEMENT-001` emits
`movementEvidence: UNCERTAINTY_LIMITED`, which is not in that list. Part I §0.2 permits a
later Part to specialise the shared architecture. The Alk `movementEvidence` vocabulary is
therefore the shared set plus `UNCERTAINTY_LIMITED`, and the closed list is fixed in
`ALK-V2-DATA-CONTRACT.md`.

## OI-RAPIDEVIDENCE-001 — Evidence label on a rapid basis

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part II §22; `ALK-RAPID-001`

Part II §22: with two independent clusters "the evidence state is normally
`PROVISIONAL`". `ALK-RAPID-001` does not upgrade it — it grants early action, not
sufficiency. So a two-cluster rapid basis emits
`movementEvidence = PROVISIONAL` with `rapidConfirmed = true`, and the permission to act
comes from the rapid flag, never from the evidence state.

## OI-FORECASTHORIZON-001 — The 50%-unlock comparison horizon is a fixed 48 hours

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-FORECAST-SLOPE-001`; `ALK-STEP-CAP-001`; `WG-ALK-042`; `WG-ALK-043`

`ALK-FORECAST-SLOPE-001` compares `T_outerLow`/`T_outerHigh` against
`timeUntilNextOrdinaryTest`, "where the ordinary comparison horizon is normally 48 hours".
`WG-ALK-042` and `WG-ALK-043` both use exactly 2.0 days while rapid evidence is otherwise
valid — even though a confirmed rapid state schedules a ~24 h retest under `ALK-052`.

So the horizon is the **ordinary cadence constant (48 h)**, not the scheduler's selected
next-test time. Using the scheduler's output would make the cap depend on the retest
decision and would flip `WG-ALK-043` from unlocked to locked.

## OI-DEFERREASON-001 — Two deferral reason codes may both be true

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `WG-ALK-052` (`DEFERRED_BY_SAFETY_RAIL`); `WG-ALK-058`
  (`DEFERRED_BY_SAFETY_RETURN`)

Both fixtures describe "safety return active, maintenance change deferred" and each
requires a different reason code. The **action is identical** under both, so this is a
labelling question, not a behavioural one. Emit both when both conditions hold:
`MAINTENANCE_DEFERRED_BY_SAFETY_RETURN` always (the state), plus
`MAINTENANCE_DEFERRED_BY_SAFETY_RAIL` additionally when the two components' combined
24-hour effect would have exceeded `ALK_RATE_RAIL`. Both fixtures then pass and no
precedence is invented.

## OI-CONSUMPTIONLOOKBACK-001 — Consumption uses the current-control segment

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-CONSUMPTION-ESTIMATE-001`; `ALK-007`; Part II §15, §17

Part II §17 permits separate lookbacks per inference; Part II §75 lists "Alk consumption
lookback" as deferred to Part III; Part III supplies no second number.
`ALK-CONSUMPTION-ESTIMATE-001` computes `C = P_selected · D − S_observed` where `D` is
"the actual effective maintenance input for **the analysed interval**" and its output
includes "source segment" and "observed trend estimate" — i.e. it consumes the trend's
own segment. There is therefore one lookback (`ALK-007`, 14 days max) and one segment.

## OI-BRACKETEFFECT-001 — The empirical bracket never changes the dose

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-032`; `ALK-BRACKET-COMPARABILITY-001`; `ALK-072` item 11; `AUDIT-023`;
  `WG-ALK-054`

`ALK-032` enumerates the complete set of bracket effects: "An old bracket may: warn; lower
confidence; request verification." `ALK-072` removes "a historical bracket that silently
vetoes current supported demand" from V2. `AUDIT-023` requires that supported current
evidence may win. `WG-ALK-054` requires the core recommendation to continue when the
bracket is `NOT_RUN`.

Therefore the bracket emits reason codes and evidence only. It has **no write path** to
`recommendedDose`. `ALK-049` step 6 says "evaluate empirical bracket conflict" — evaluate,
not clamp.

## OI-CHANGEPOINT-001 — Automatic change-point detection is off

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part II §18

"The implementation should begin conservatively; sophisticated automated change-point
algorithms are optional, not required for V2 initial release." A regime boundary is
created only from an explicitly recorded/confirmed discontinuity, never inferred from the
data. Emit `SEGMENT_CHANGEPOINT_DETECTION_NOT_RUN` in the audit trace so its absence is
visible.

## OI-POSITIONCLUSTER-001 — Position uses the cluster representative value

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-010` ("latest valid measured **cluster** value"); Part I §3.1;
  Part II §5.4

`ALK-010` is the more specific rule and names the cluster. Position is the representative
(median) value of the latest valid cluster, not the last raw reading inside it.

## OI-ANCHOR-001 — The Day-0 anchor never counts as post-change evidence

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** Part II §31; `ALK-017`; Part II §72 property 4

The pre-change anchor may start the first new-dose interval and is never counted as a
post-change observation, for the response classifier, for potency learning, or for the
post-change current-control segment. Earliest post-change ordinary sufficiency is
therefore Day +6 under the 48-hour cadence. Feeds `OI-DAY4-001`.

## OI-BOUNDARIES-001 — Inclusive and exclusive comparison boundaries

- **Class:** `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED`
- **Canon:** `ALK-004`; `ALK-003A`; `ALK-033`; `ALK-STEP-CAP-001`;
  `ALK-RESPONSE-CLASSIFIER-001` (finding D-7); `ALK-RAPID-001`

| Comparison | Boundary | Canon basis |
|---|---|---|
| position in range | `RangeMin ≤ A ≤ RangeMax` | `ALK-004`: 8.19 vs edge 8.20 is *below* range |
| outer-bound breach | `A < OuterMin` / `A > OuterMax`, strict | `ALK-003A`: "At exactly an outer bound, the level is not `BREACHED`" |
| safety-return completion | `A ≥ A_safe,low` / `A ≤ A_safe,high` | `ALK-003A` Completion |
| repeat-cluster spread | anomalous when `max − min > 0.20` | `ALK-005` |
| water-change materiality | material when `|ΔA_WC| ≥ 0.10` | `ALK-033` |
| unknown water-change break | breaks when `f ≥ 0.05` | `ALK-WATERCHANGE-UNKNOWN-001` |
| independent spacing | independent when `Δt ≥ 24 h` | `ALK-008` excludes `< 24 h`; `ALK-RAPID-001` accepts "at least 24 hours" |
| rapid threshold | rapid when `|S| ≥ 0.30` | `ALK-RAPID-001` |
| step-cap meaningfulness | active when `D_current ≥ 4 R_pump` | `ALK-STEP-CAP-001` |
| potency SNR | `< 2.0` ineligible; `2.0 ≤ SNR < 3.0` diagnostic; `≥ 3.0` calibration | `ALK-017` |
| potency envelope | `0.40 P_expected ≤ P_i ≤ 1.60 P_expected` inclusive | `ALK-POTENCY-PLAUSIBILITY-001` |
| response `R_obs = −B` exactly | `NO_DETECTABLE_RESPONSE` | canon finding D-7 retained deliberately |
| response `R_obs = +B` exactly | `NO_DETECTABLE_RESPONSE` if `|B − R_exp| > B`, else `INCONCLUSIVE` | direct from the class conditions |

The two response-boundary rows are derived by evaluating the frozen class conditions at
the boundary; they are not new rules. Canon finding D-7 explicitly retains the
measure-zero convention rather than changing the inequalities.

## OI-CAMG-001 — Calcium and magnesium remain inert

- **Class:** `NO_PROBLEM`
- **Canon:** `MIGRATION-ALK-ONLY-001`; `MIGRATION-INERT-CA-MG-MEASUREMENTS-001`;
  `MIGRATION-MG-GATE-ISOLATION-001`; `X-MIG-001`; `PROJECT-STATE.md`

Fully determined. Ca/Mg are recorded facts with history and charts and nothing else.
`magnesiumGateState = UNKNOWN` unconditionally. `ALK-SAFETY-MG-OVERRIDE-001` already
defines Alk behaviour under `UNKNOWN`: allow the safety return, invent no warning. No
implementation decision remains.

## OI-HANDOFF-001 — Stale freeze identifiers in the implementation handoff

- **Class:** `NO_PROBLEM`
- **Canon:** `PROJECT-STATE.md` "Known documentation discrepancies" item 1

`docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` names `SHARED_V2_FREEZE_1` /
`ALK_V2_FREEZE_3`. The canon supersedes both. This package uses `SHARED_V2_FREEZE_2` /
`ALK_V2_FREEZE_4` and takes from the handoff only process guidance compatible with the
current canon. Both documents are byte-for-byte copies and neither has been edited.
Resolution belongs to a governed handoff reissue.

Two handoff instructions are additionally **not applicable** in this repository and were
not followed: "Stage 1 — inspect before editing" (there is no existing V2 application to
inspect) and the V1↔V2 comparison fixture runner (V1 is a separate read-only repository
and, per `DEC-013`, its outputs are not V2 expectations).

## OI-SEGMENTPICK-001 — A short current segment is not extended

- **Class:** `NO_PROBLEM`
- **Canon:** `ALK-007`; Part II §1.3, §17; `WG-ALK-049`

"The engine never stretches beyond 14 days solely because current evidence is sparse", and
the selected segment is the most recent eligible clean one. If it holds fewer than three
independent clusters or spans under four days, the result is `INSUFFICIENT` with an
actionable next-test message (`IX-005`). No fallback to an older segment exists.

---

# D. Summary

### Status at `ALK_V2_FREEZE_5`

| Status | Count | IDs |
|---|---|---|
| **OPENED by Freeze-5 review, CLOSED by F5-13/14/15** | 3 | OI-HIGHBREACHBAND-001, OI-CLUSTERTIE-001, OI-RETESTFLOOR-001 |
| **RESOLVED by Freeze 5** | 13 | OI-INDEPENDENCE-001, OI-SUSPECT-001, OI-MADFLOOR-001, OI-NEGCONS-001, OI-RETEST-001, OI-RETURNOFFER-001, OI-BELOWRISING-001, OI-WATERCHANGE-001, OI-LIQUIDGUARD-001, OI-SAFETYRATE-001, OI-RETURNDURINGSAFETY-001, OI-RAPIDBASIS-001, OI-CONFIDENCE-001 |
| `CANON_DEFECT` still open (all non-blocking) | 11 | OI-STABLE-001, OI-DAY4-001, OI-EXPOSURE-001, OI-NORMUNCERT-001, OI-POTENCYSTATE-001, OI-POTENCYSNAP-001, OI-WG024-001, OI-ANOMCLUSTER-001, OI-OVERSHOOT-001, OI-PIPELINE-001, OI-PLANTARGETEDIT-001 |
| `OWNER_DECISION_REQUIRED` still open | 0 | — |
| `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED` | 13 | OI-MEDIAN-001, OI-EVIDENCEVOCAB-001, OI-RAPIDEVIDENCE-001, OI-FORECASTHORIZON-001, OI-DEFERREASON-001, OI-CONSUMPTIONLOOKBACK-001, OI-BRACKETEFFECT-001, OI-CHANGEPOINT-001, OI-POSITIONCLUSTER-001, OI-ANCHOR-001, OI-BOUNDARIES-001, OI-MAINTDURINGPLAN-001, OI-DETERMINISM-001 |
| `NO_PROBLEM` | 3 | OI-CAMG-001, OI-HANDOFF-001, OI-SEGMENTPICK-001 |

43 distinct issue IDs (3 + 13 + 11 + 13 + 3). **Sixteen are resolved by Freeze 5** — the
thirteen its original decisions closed, plus the three its review opened and its amendments
F5-13, F5-14 and F5-15 then closed.

All eleven `OWNER_DECISION_REQUIRED` items across both rounds were decided by the owner.
None was resolved by derivation. **Nothing is blocking, and no output is withheld for want
of a decision.**

`OI-PIPELINE-001` remains open only for the composite rail's position; its liquid-guard
limb is closed by F5-06. `OI-STABLE-001` is confirmed rather than closed: F5-04 explicitly
left `ALK-STABLE-001` unchanged, so its illustrative examples are still wrong and its
normative text still governs.

### Class counts as originally recorded (historical)

| Class | Count |
|---|---|
| `CANON_DEFECT` (blocking) | 11 |
| `CANON_DEFECT` (non-blocking) | 13 |
| `OWNER_DECISION_REQUIRED` | 8 |
| `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED` | 13 |
| `NO_PROBLEM` | 3 |

**What is buildable.** Everything. After Freeze 5 and its three amendments, no open item
withholds a dependent output:
current position, outer-bound state, the whole `SAFETY_RETURN` path including the temporary
high-breach rate, clustering and independent selection, segmentation, Theil-Sen trend,
`sigma_S`, `S_supported`, consumption and its materiality classification, the ordinary
maintenance pipeline including rails, caps, the liquid guard and rounding, the recommendation
matrix, the return-plan offer and its termination by safety, the retest scheduler, the formal
response classifier, the prediction-snapshot machinery, the capability contract, audit and
replay.

The eleven remaining `CANON_DEFECT` items degrade a specific optional analysis or record a
documentation inconsistency; none withholds a controller output.
