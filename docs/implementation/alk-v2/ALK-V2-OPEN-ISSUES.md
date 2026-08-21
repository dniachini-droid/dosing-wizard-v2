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

Review of the decisions 16–19 encoding then opened four more, in section A4. The owner
decided two of them as decisions 20 and 22. **Two remain open** —
`OI-SIZINGFLAT-001` and `OI-CZERODISCONT-001` — and are the first `CANON_DEFECT` +
`OWNER_DECISION_REQUIRED` items to be left open deliberately since Freeze 5 closed the
blocking register. Neither withholds an output: both name an exposure inside a path that
still runs, and both forbid the implementation from compensating for it.

Review of the **decisions 20–22 encoding** opened **five more**, in section A5, every one of
which can change a recommendation, a safety action or a retest output. **All five are
OPEN and none is decided.** Each states what the encoding does pending the owner's decision
and what an implementer must not do instead, and each is mirrored as a `RECORDED EXPOSURE`
block in the canon rule it affects. This is the register behaving as intended: a review of a
canon reissue that found nothing would mean the review was not adversarial.

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
difference; it changes the recommendation.

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

Both are defensible from the frozen text. They differ by a 1.5 mL/day recommendation in
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

**Enforcement.** Exceeding it **withholds the recommended rate**. Capping to the
2% figure and presenting that as the recommendation is forbidden. A correction or
return-plan execution, whose duration the engine may choose, is still staged until every
single-day command satisfies the guard.

**Position.** A hard constraint, rechecked after recommendation rounding/discretisation in
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
after recommendation rounding is therefore unstated, and it matters: rounding up past the guard
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
"recheck all hard constraints that can be affected by rounding to the recommendation precision", and the
guard is such a constraint. This placement is derived from `ALK-ROUNDING-001` itself
rather than invented.

---

## OI-SAFETYRATE-001 — The high-breach temporary safety *rate* is not exempted from M-1

- **Class:** `CANON_DEFECT`
- **Canon:** `M-1`; `ALK-SAFETY-CORRECTION-RESOLUTION-001`; `ALK-003A` high breach
- **Owner module:** `SAFETY` / `CAPABILITY`

> **RECLASSIFIED INAPPLICABLE by owner decision 23.**
>
> This item asked how a temporary high-breach safety **rate** should behave when the
> **actuator increment** was unknown. `ALK-RECOMMEND-ONLY-001` establishes that the
> application never commands a pump and has no connection to any doser, so there is no
> actuator increment and the question cannot arise.
>
> Freeze 5 answered it as F5-11 by writing `ALK-SAFETY-TEMP-RATE-RESOLUTION-001`, which
> split an exact advisory rate from an executable rounded command. **That rule is retired**,
> along with `ALK-SAFETY-CORRECTION-RESOLUTION-001`, which exempted a one-off correction
> volume from an `M-1` refusal that no longer exists. There is one recommended rate, always
> emitted when it is calculable, rounded for a human reader.
>
> This is not "resolved" — nothing decided the question. The question stopped existing.
> **Fixtures:** `AD-SAF-002`, `AD-SAF-005`, `AD-REC-001`, `WG-ALK-045`, `WG-ALK-061`.

> **RESOLVED by `ALK_V2_FREEZE_5` — owner decision F5-11.**
>
> Encoded as `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` (canon, in `ALK-003A`).
>
> Everything below this box is the pre-Freeze-5 analysis, preserved as the record of
> why the decision was needed. Its "Until closed" behaviour is **superseded** and must
> not be implemented.

### Freeze-5 resolution

The `M-1` exemption is extended to the temporary high-breach safety rate. The exact
calculated rate is emitted as an **advisory** rate when the recommendation precision is unknown.
Two outputs stay distinct:

```text
temporarySafetyRateContinuousMlPerDay = D_safety,temp    exact, full precision
temporarySafetyRateRecommendationMlPerDay  = NOT_RUN          while the increment is absent
```

All other hard rails and guards remain applicable. Potency stays load-bearing: without a
valid `P_selected` neither figure is emitted and only the required dKH movement and
direction are stated.

**Fixtures:** `AD-SAF-002` (advisory 1.443001443 mL/day emitted, recommendation `NOT_RUN`),
`AD-SAF-005` (negative control across three capability cases; merging the two fields or
inventing a 0.1 mL/day increment is asserted forbidden).


`M-1` refuses a final actionable **maintenance-rate recommendation in mL/day** when
`recommendationPrecisionMlPerDay` is missing. `ALK-SAFETY-CORRECTION-RESOLUTION-001` carves out
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
interpretable, `P = 0.0693`, `recommendationPrecisionMlPerDay` missing.
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

**Fixture:** `AD-CON-002`, whose two variants sit one recommendation precision apart and now
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
database ordering or implementation sorting. That was the actual defect: the recommendation
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

# A3. Opened by review of the F5-13/14/15 amendments, closed by owner decisions 16–19

Focused review of the three amendments reported **six findings** that could change an
recommendation, a safety action, evidence selection, outer-bound classification,
`rapidConfirmed` or a retest output. Per the task constraint they were reported and left for
the owner rather than resolved by the run that found them.

**The owner then decided them**, as decisions 16, 17, 18 and 19. Those decisions are part of
`ALK_V2_FREEZE_5` and **supersede the earlier Freeze-5 wording wherever they conflict**.
Every item in this section is closed. The finding text is preserved below each resolution as
the record of why the decision was needed.

| Finding | Register item | Decision |
|---|---|---|
| `F5-13-NO-SAFETY-RATE`, `F5-13-BAND-WIDTH` | `OI-HIGHBREACHSIZING-001` | 16 |
| `F5-14-EPSILON` | `OI-EPISODE-001` | 17 |
| `F5-14-ALK005-DOMAIN` | `OI-CROSSMETHOD-001` | 18 |
| `ALK-005-FP-BOUNDARY` | `OI-DECIMALTHRESHOLD-001` | 18 |
| `F5-14-POSITION-ORDER`, `F5-14-RAPID-SCOPE` | `OI-EPISODECONSUMER-001` | 19 |

## OI-HIGHBREACHSIZING-001 — no safety rate is produced on the middle high-breach branch

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-003A`; `ALK-HIGH-BREACH-UNRESOLVED-001`; `ALK-HIGH-BREACH-NO-PAUSE-001`; `ALK-NEGATIVE-MATERIALITY-001`
- **Owner module:** `SAFETY`
- **Raised by:** `canon-conformance-auditor` and `breaker`, F5-13/14/15 review

> **RESOLVED by owner decision 16.**
>
> Encoded as `ALK-HIGH-BREACH-SAFETY-SIZING-001` (canon, in `ALK-003A`).
> `ALK-HIGH-BREACH-UNRESOLVED-001`'s automatic zero-dose pause and
> `ALK-HIGH-BREACH-NO-PAUSE-001`'s HOLD of the established delivery rate are **superseded**
> for the sizing choice; both keep their classification and cadence content.
>
> Negative-consumption materiality owns the **maintenance model**, not high-breach safety
> sizing. Where `A_now > OuterMax` and `C_estimate < 0`, on either side of the boundary:
>
> ```text
> R_down        = min(A_now - A_safe,high, 0.50)
> D_safety,temp = max(0, D_established - R_down / P_selected)
> ```
>
> Zero is a **floor**, reached only when the established contribution cannot absorb
> `R_down`. The rate varies with `A_now` until the 0.50 dKH/day rail binds, and moves one
> recommendation precision per increment of established dose, so the discontinuity below is gone.
> `maintenanceEstimateStatus` stays `UNRESOLVED`. No ceiling is invented for the
> `1.28·sigma_S` band; decision 16 removes that band from sizing instead.
>
> **Amended by owner decision 20.** The sizing input above is `D_current`, not
> `D_established` — that name is split by `ALK-DELIVERY-RATE-BASIS-001` and is no longer
> live. Decision 16's wording is preserved above as the record of what was decided when.
> See `OI-DELIVERYRATEBASIS-001`. **Bounded by owner decision 21**: the sizing rule governs
> `OuterMax < A_now < AdvisoryCeiling`; beyond it the engine escalates and emits no rate.
> **Extended by owner decision 22**: a `C_estimate` that cannot be computed at all takes the
> same formula, as branch B′. See `OI-UNCOMPUTABLEC-001`.
>
> **Fixtures:** `AD-SAF-007` (sweep, rail saturation, zero floor, materiality straddle),
> `AD-SAF-008` (continuity negative control), `AD-CON-002` (amended), `WG-ALK-051` (amended).

### The finding, as reported

**`F5-13-NO-SAFETY-RATE`.** On the F5-13 middle branch — `A_now > OuterMax`,
`C_estimate < 0`, `C_estimate + 1.28·sigma_S >= 0` — no safety delivery figure was produced
at all. `ALK-003A`'s high-breach delivery path was conditioned on "If current consumption is
physically interpretable", and `D_safety,temp` took `C_estimate` as an input;
`ALK-HIGH-BREACH-NO-PAUSE-001` classified the branch as uninterpretable for maintenance and
routed only `C_estimate >= 0` to that path. `ALK-SAFETY-TEMP-RATE-RESOLUTION-001` scoped
itself to "the high-breach **interpretable-consumption path**", so it did not reach the
branch either. The net output above the outer bound was "keep dosing exactly as before,
retest in ~24 h".

Three properties followed:

- **non-monotone in the established dose.** `C = P·D − S_observed`, so a larger established
  dose gives a less negative estimate. On `AD-CON-002`'s numbers (`S_obs +0.15`,
  `P 0.0693`, `1.28·sigma_S 0.045255`): `D = 1.5` → `C = −0.04605`, `C + kσ = −0.000795`,
  materially negative → **pause to 0 mL/day**; `D = 1.6` → `C = −0.03912`,
  `C + kσ = +0.006135`, not material → **hold at 1.6 mL/day**. One recommendation precision more
  established dosing converted a full pause into a hold, in the same tank state;
- **no escalation with level.** Nothing on the branch was a function of `A_now`; the
  outputs at 11.2 dKH and 15.0 dKH were identical;
- it was the only branch above the outer bound with no delivery response at all.

**`F5-13-BAND-WIDTH`.** The no-pause band is `1.28·sigma_S` wide and the canon records that
it "widens without bound" with residual scatter. On a scattered series it was roughly 9.3×
wider than on a clean one, tolerating an unexplained gain of about 0.42 dKH/day above the
outer bound with no reduction in delivery. Decision 16 removes the band from sizing rather
than capping it, so the uncapped width no longer sizes a recommendation.

---

## OI-EPISODE-001 — episode membership keyed on exact timestamp equality

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-SAME-TIMESTAMP-COALESCE-001`; `ALK-005`; Part II §5.2, §5.3, §5.5
- **Owner module:** `SEGMENTATION`
- **Raised by:** `breaker`, F5-13/14/15 review

> **RESOLVED by owner decision 17.**
>
> Encoded as `ALK-TESTING-EPISODE-001` (canon, `ALK-005B`).
> `ALK-SAME-TIMESTAMP-COALESCE-001`'s exact-timestamp-only membership and its pooling of
> incompatible methods are **superseded**; it now states the selection-side consequence.
>
> A testing episode is the set of measurements intended to represent the same real-world
> sampling moment, grouped by explicit repeat/confirmation relationships where present and
> otherwise by the **existing** 30-minute `repeatClusterWindow`. No new time constant. The
> semantic concept is **same testing episode**, not exact timestamp equality. Same-method
> members pool under the existing representative-value rules; incompatible-method members
> are kept distinct and never averaged.
>
> **Fixtures:** `AD-EPI-001` (same-method repeats), `AD-EPI-002` (three-minute offset,
> reversed insertion order), `AD-SEG-007` and `AD-SEG-008` (amended to same-method pools).

### The finding, as reported

**`F5-14-EPSILON`.** Coalescing fired only on exact timestamp equality, and
`ClusterTime = median(timestamp of included readings)` moves whenever the underlying set
changes. Two methods run three minutes apart therefore produced two distinct representative
timestamps, coalescing did not fire, and forward-greedy selection accepted one and rejected
the other — so which reading governed became a property of a three-minute clerical
difference. On `AD-SEG-007`'s own data the two branches were exactly the values that
fixture marks forbidden: `10.5` and `11.0` mL/day. One extra repeat reading moving a
cluster median had the same effect. No tolerance, quantisation or epsilon was defined
anywhere in canon for that equality test.

---

## OI-CROSSMETHOD-001 — `ALK-005`'s 0.20 dKH applied to cross-method disagreement

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-005`; `ALK-SAME-TIMESTAMP-COALESCE-001`; Part II §5.3, §5.6
- **Owner module:** `SEGMENTATION`
- **Raised by:** `canon-conformance-auditor`, F5-13/14/15 review

> **RESOLVED by owner decision 18.**
>
> Encoded as `ALK-REPEAT-SPREAD-DOMAIN-001` (canon, in `ALK-005`).
>
> `ALK-005`'s 0.20 dKH applies to same-method repeats, and to methods **explicitly
> classified by canon as compatible**. It does not establish a cross-method disagreement
> threshold and may not be applied across incompatible methods. Two canonised `NOT_RUN`
> states are recorded rather than filled: `crossMethodConcordanceThreshold` and
> `compatibleMethodClassification`. Where incompatible methods coexist,
> `ALK-EPISODE-RESOLUTION-001` contests the episode instead of comparing values.
>
> **Fixtures:** `AD-VAL-002` (`CROSS_METHOD` case), `AD-EPI-002`.

### The finding, as reported

**`F5-14-ALK005-DOMAIN`.** `ALK-005`'s threshold is established over **repeats** — Part II
§5.3 groups automatically only within "same test method or compatible method", and Part II
§5.6 warns that "Repeats may share systematic error". Its stated justification is analytical
repeatability: "0.20 dKH is twice the shared Alk analytical uncertainty floor". F5-14
applied that same threshold to a pool combining two methods the fixture's own provenance
called incompatible. Cross-method disagreement includes inter-method bias, which same-method
repeatability does not measure, and the canon nowhere establishes 0.20 dKH as the correct
cross-method threshold. `ALK-005`'s escape clause — "unless a known testing method justifies
another value" — names neither a value nor a procedure.

---

## OI-DECIMALTHRESHOLD-001 — a canonical decimal threshold decided by binary64

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-005`; `OI-BOUNDARIES-001`; `OI-DETERMINISM-001`; `ALK-V2-IMPLEMENTATION-CONTRACT.md` §7
- **Owner module:** `VALIDATION`
- **Raised by:** `breaker`, F5-13/14/15 review

> **RESOLVED by owner decision 18.**
>
> Encoded as `ALK-DECIMAL-THRESHOLD-001` (canon, `ALK-005E`).
>
> Canonical Alk threshold predicates over stored decimal measurement quantities compare
> **exact decimal values**: entered/normalized precision is preserved, no pre-rounding is
> performed to make the comparison, and **no epsilon** is introduced. So an exact spread of
> 0.20 dKH gives `0.20 > 0.20 = false` and is not anomalous, while a spread genuinely above
> 0.20 dKH remains anomalous. Scope is `ALK-005`'s spread, `ALK-004`'s range edges and
> `ALK-003A`'s outer-bound and completion comparisons. Derived quantities — slopes, sigma,
> consumption, `T_signal` — remain binary64 under the determinism contract, unchanged. No
> threshold value and no comparison direction changes.
>
> **Fixture:** `AD-VAL-002`, carrying three pairs binary64 would misclassify and one it
> would not.

### The finding, as reported

**`ALK-005-FP-BOUNDARY`.** The comparison is a strict `>` against a decimal constant binary64
cannot represent exactly, applied to a difference of two inexact binary64 values, with no
rounding or tolerance specified. `8.80 − 8.60` evaluates to `0.20000000000000107 > 0.20` and
classified `ANOMALOUS`; other pairs with the same exact decimal difference compared `<= 0.20`
and classified `OK`. Of 600 decimal pairs whose exact difference is 0.20, 317 compared as
`> 0.20`. The result was deterministic and replay-stable — this was never a
non-determinism finding — but the classification at the boundary was a property of which
decimal values the test kit happened to report rather than of the disagreement, and
`ANOMALOUS` withholds automatic maintenance action, forces `REPEAT_NOW` and fails
`ALK-RAPID-001`'s internal-consistency requirement. No fixture existed at exactly 0.20;
`AD-SEG-007` had been moved to a 0.14 spread specifically to avoid the boundary.

---

## OI-EPISODECONSUMER-001 — position and rapid chose among raw measurements

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-010`; `CORE-POSITION-001`; `ALK-003A`; `ALK-RAPID-BASIS-001`; `ALK-SAME-TIMESTAMP-COALESCE-001`
- **Owner module:** `SEGMENTATION` / `SAFETY`
- **Raised by:** `canon-conformance-auditor` and `breaker`, F5-13/14/15 review

> **RESOLVED by owner decision 19.**
>
> Encoded as `ALK-EPISODE-RESOLUTION-001` (canon, `ALK-005C`) and
> `ALK-EPISODE-SINGLE-OUTPUT-001` (canon, `ALK-005D`); `ALK-010` and
> `ALK-RAPID-BASIS-001` amended to read the resolved episode.
>
> Episode construction and resolution run **before** downstream interpretation, and no
> dosing or safety consumer may independently choose among raw measurements in one episode.
> A resolved episode emits one canonical value and time for position, outer-bound
> classification, `SAFETY_RETURN` triggering, rapid basis, selection, trajectory,
> consumption, forecast and maintenance alike. A contested latest episode manufactures no
> value, is not resolved by sorting, is not replaced by an older episode, and withholds the
> affected inference with `REPEAT_NOW`. Episode resolution stays distinct from independent
> trend selection, and the 24-hour independence rule is unchanged.
>
> **Recorded exposure:** no rule governs outer-bound classification from a contested
> episode, so a contested episode straddling an outer bound withholds the classification
> and requests an immediate repeat. No worst-case-member rule is created.
>
> **Fixtures:** `AD-EPI-003` (position), `AD-EPI-004` (rapid).

### The findings, as reported

**`F5-14-POSITION-ORDER`.** `ALK-SAME-TIMESTAMP-COALESCE-001` scoped itself to selection —
"**Before** forward-greedy selection runs" — while `ALK-010` reads "the latest valid measured
cluster value" directly off the cluster set, and no rule said that set was the coalesced one.
With two clusters at the latest representative timestamp — `10.95` Hanna and `11.14`
Salifert against `OuterMax = 11.0` — the answer was `WITHIN_BOUNDS` or `BREACHED_HIGH`
depending on which row the store returned first, and the coalesced median `11.045` was a
third answer. `outerBoundState` gates the whole `SAFETY_RETURN` intervention, direction
reporting, the magnesium-gate card, the intervention lock, return-plan termination and the
~24 h cadence.

**`F5-14-RAPID-SCOPE`.** `ALK-RAPID-BASIS-001` drew its pair from "candidate clusters" and
the coalescing rule declared itself a pre-step to selection, so whether "candidate" meant
pre- or post-coalescing was unstated. Where the tie sat at the latest timestamp, the three
readings of `A_latest` gave `S_rapid` of −0.32, −0.14 and −0.23 dKH/day; the 0.30 dKH/day
threshold sits between them, so `rapidConfirmed` flipped. That flag gates the ~24 h rapid
cadence, the bypass of the 3-cluster / 4-day minimum, and eligibility for the 50% step cap
rather than 25%.

---

# A4. Opened by review of the decisions 16–19 encoding

Focused review of the decisions 16–19 encoding raised findings against the high-breach
safety path. Four of them are recorded here. **Two are resolved by owner decisions 20 and
22. Two remain open and are deliberately not closed** — decision 21 narrows one of them and
explicitly declines to close it.

> **Register provenance, stated plainly.** These four findings were raised as
> `D-ESTABLISHED-UNDEFINED`, `SIZING-FLAT-ABOVE-THE-RAIL`,
> `SIZING-NO-BRANCH-FOR-UNCOMPUTABLE-C` and `SIZING-C-ZERO-DISCONTINUITY`. They had **no
> entries in this register** before this pass — the finding IDs existed only in the review
> that raised them. The entries below were created here so the decisions have something to
> close and the two open items have somewhere to live. The finding text is reproduced from
> the finding as raised; where a detail was not in the finding, it is not invented.

| Finding as raised | Register item | Status |
|---|---|---|
| `D-ESTABLISHED-UNDEFINED` | `OI-DELIVERYRATEBASIS-001` | RESOLVED by owner decision 20 |
| `SIZING-NO-BRANCH-FOR-UNCOMPUTABLE-C` | `OI-UNCOMPUTABLEC-001` | RESOLVED by owner decision 22 |
| `SIZING-FLAT-ABOVE-THE-RAIL` | `OI-SIZINGFLAT-001` | **OPEN, and NO LONGER NARROWED** — decision 21 narrowed it, decision 24 removed that bound; the flat region runs upward without limit again |
| `SIZING-C-ZERO-DISCONTINUITY` | `OI-CZERODISCONT-001` | **OPEN** — not addressed |

## OI-DELIVERYRATEBASIS-001 — `D_established` names two different physical quantities

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-CONSUMPTION-ESTIMATE-001`; `ALK-022`; M-6
- **Owner module:** `CONSUMPTION`
- **Raised by:** review of the decisions 16–19 encoding, as `D-ESTABLISHED-UNDEFINED`

> **RESOLVED by owner decision 20.**
>
> Encoded as `ALK-DELIVERY-RATE-BASIS-001` (canon, in `ALK-022`). The name is split into two:
>
> ```text
> D_current  = the alkalinity delivery rate the doser is CONFIGURED to be delivering
>              at the time of the recommendation
> D_history  = the TIME-WEIGHTED MEAN alkalinity delivery rate actually delivered
>              across the trend interval under consideration
> ```
>
> `ALK-HIGH-BREACH-SAFETY-SIZING-001` is amended to
> `D_safety,temp = max(0, D_current - R_down / P_selected)`. Consumption estimation and
> every other interval-based calculation take `D_history`. `D_established` is not a live
> name anywhere: the reason code `SAFETY_HIGH_BREACH_RATE_FROM_ESTABLISHED_DOSE` and the
> payload field `establishedDoseMlPerDay` are retired and renamed to
> `SAFETY_HIGH_BREACH_RATE_FROM_CURRENT_DOSE` and `currentDoseMlPerDay`.
>
> **Unknown handling refuses; it does not assume zero.** `D_current` unknown ⇒ no temporary
> safety rate, no recommendation, and **not** `0 mL/day`; the measured state and the
> reason are surfaced and doser configuration is requested through the existing
> anomaly/confirmation machinery. `D_history` unavailable ⇒ consumption `UNRESOLVED` under
> the existing unresolved-consumption handling. The two are independent.
>
> **Fixtures:** `AD-DHS-001` (mixed-dose interval, increase and decrease), `AD-DHS-002`
> (negative control: `D_current` unknown ⇒ refusal, not zero), `AD-DHS-003` (`D_history`
> unavailable ⇒ consumption `UNRESOLVED`, sizing still runs). **Invariant:** `INV-G14`.
> `INV-G10` and `INV-G11` amended for the rename.

### The finding, as reported

**`D-ESTABLISHED-UNDEFINED`.** `ALK-HIGH-BREACH-SAFETY-SIZING-001` sized the temporary
safety rate from `D_established`, defined in the canon as "the established maintenance
delivery rate in mL/day — the rate actually being delivered, on the same dose-history basis
every other Alk calculation uses". That definition names two different physical quantities
in one sentence:

- **"the rate actually being delivered"** — the doser's configuration *now*, at the moment
  the recommendation is made;
- **"on the same dose-history basis every other Alk calculation uses"** — the interval
  quantity `ALK-CONSUMPTION-ESTIMATE-001` calls `D`, which for a mixed interval is
  `D_eff = IntegratedDoseVolume / ElapsedDays` over the *past* interval.

On a constant-dose clean segment the two are numerically equal, which is why the entire
fixture corpus passed under either reading and why nothing in the package could distinguish
them. On an interval whose dose changed they differ, and the recommendation differs with
them. On a 7-day interval running 8.0 mL/day for four days and 12.0 mL/day for three,
`D_current = 12.0` and `D_history = 68/7 ≈ 9.714`: with `R_down/P_selected = 5.772`, the
sized rate is either 6.228 or 3.942 mL/day — 6.2 or 3.9 at a 0.1 mL/day increment. Reverse
the schedule and the error reverses sign, so a test that checked only the magnitude of the
discrepancy would not have caught the substitution.

Nothing in the canon said which reading governed, and the two readings disagree about the
direction of the correction as well as its size.

---

## OI-UNCOMPUTABLEC-001 — no high-breach branch exists for a `C_estimate` that cannot be computed

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-003A`; `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-HIGH-BREACH-UNRESOLVED-001`
- **Owner module:** `SAFETY`
- **Raised by:** review of the decisions 16–19 encoding, as `SIZING-NO-BRANCH-FOR-UNCOMPUTABLE-C`

> **RESOLVED by owner decision 22.**
>
> Encoded as `ALK-HIGH-BREACH-UNCOMPUTABLE-CONSUMPTION-001` (canon, in `ALK-003A`). Where
> `OuterMax < A_now < AdvisoryCeiling` and `C_estimate` is not computable at all —
> insufficient history, a first-ever test, an unknown dose history — the state takes the
> **branch B pathway**:
>
> ```text
> D_safety,temp = max(0, D_current - R_down / P_selected)
> ```
>
> with `maintenanceEstimateStatus = UNRESOLVED` and the reason surfaced.
>
> **Rationale encoded:** sizing the temporary safety reduction requires knowing what is
> being *delivered*, not what is being *consumed*. Absence of a consumption estimate does
> not prevent a defensible downward safety action.
>
> **Distinct from `D_current` unknown**, which refuses under decision 20 and emits no rate.
>
> The three high-breach predicates — A (`C_estimate >= 0`), B (`C_estimate < 0`) and
> B′ (`C_estimate` not computable) — are **jointly exhaustive and mutually exclusive** over
> the state space below `AdvisoryCeiling`, and an invariant asserts that exactly one branch
> is selected for any such state.
>
> **Fixtures:** `AD-SAF-009` (first-ever test, high breach, `D_current` known),
> `AD-DHS-003` (`D_history` unavailable ⇒ the same branch), `INV-G12`
> (branch exhaustiveness). **Invariant:** `INV-G12`.

### The finding, as reported

**`SIZING-NO-BRANCH-FOR-UNCOMPUTABLE-C`.** After owner decision 16 the high-breach tree read:

```text
C_estimate >= 0   -> size from consumption
C_estimate <  0   -> size from the established-dose contribution
```

Both predicates presuppose that `C_estimate` **is a number**. A state in which it cannot be
computed at all matches neither. `C_estimate = P_selected · D − S_observed` requires a
potency, a delivery-rate basis and an observed slope; a first-ever test has no slope, a
tank with no dose history has no `D`, and an interval whose only delivery basis is
`COMMAND_ONLY_UNCONFIRMED` has no eligible `D_eff`. The canon's own failure state for those
inputs is `NOT_RUN`, not a value.

The consequence above the outer bound was the same one decision 16 had just abolished on the
middle branch: no delivery response at all. A tank measuring 11.5 dKH on its first-ever test
kept dosing at the configured rate, with a ~24 h retest and nothing else — and the engine
had every quantity it needed to size a reduction (`R_down` from the level, `P_selected`,
and the configured rate), lacking only the one quantity the reduction does not depend on.

---

## OI-SIZINGFLAT-001 — the sized safety rate stops responding to the level above the rail

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-046`; `ALK-ADVISORY-RANGE-BOUNDARY-001`
- **Owner module:** `SAFETY`
- **Raised by:** review of the decisions 16–19 encoding, as `SIZING-FLAT-ABOVE-THE-RAIL`
- **Status:** **OPEN.** Narrowed by owner decision 21. **Not closed.**

> **NO LONGER NARROWED. Owner decision 24 removed the bound. This item remains OPEN.**
>
> Owner decision 24 turns the advisory boundary from a refusal into a **warning**, so the
> ordinary rules now run at **every** level. The bound decision 21 placed on this exposure is
> gone: `R_down` saturates at the 0.50 dKH/day rail and the sized rate stops responding to
> `A_now` from `A_safe,high + 0.50 dKH` **upward without limit**, exactly as it did before
> decision 21. The reach of this finding is **wider** now than it was one decision ago.
> Nothing compensates for it and no branch boundary was moved. `AD-ESC-001` records it.
>
> The decision-21 narrowing is preserved below as history:
>
> `ALK-ADVISORY-RANGE-BOUNDARY-001` bounds the region in which the flat response is
> reachable: at or beyond `AdvisoryCeiling = OuterMax + 1.0 dKH` the engine emits no sized
> rate at all and escalates instead. The exposure is therefore confined to
> `OuterMax < A_now < AdvisoryCeiling` — for the owner's configured bounds, 11.0 to
> 12.0 dKH.
>
> **Inside that band the finding stands unchanged.** `R_down` still saturates at the
> 0.50 dKH/day rail, and the sized rate still stops responding to `A_now` above
> `A_safe,high + 0.50 = 11.30 dKH`. Nothing here closes it, and no branch boundary was
> moved to reduce it.

### The finding, as reported

**`SIZING-FLAT-ABOVE-THE-RAIL`.** `R_down = min(A_now − A_safe,high, 0.50)` saturates once
`A_now ≥ A_safe,high + 0.50`. With the owner's `A_safe,high = 10.80`, that is 11.30 dKH.
Above it, `D_safety,temp = max(0, D_current − R_down/P_selected)` is constant in `A_now`:
11.30 dKH and 15.00 dKH receive the identical delivered rate, the identical recommendation
and the identical ~24 h retest. The rule's own stated requirement — "the safety response
varies with `A_now` through `R_down`, monotonically, until the 0.50 dKH/day rail binds and
`R_down` saturates" — is satisfied by construction and describes the flatness rather than
excluding it.

The 0.50 dKH/day rail is a rate-of-change limit on how fast the engine will *move* the tank,
which is a defensible thing to cap. The finding is that it also caps how much information
about the level reaches the delivery decision, so the engine's response to a moderate breach
and to a severe one is indistinguishable.

### Until closed

`ALK-HIGH-BREACH-SAFETY-SIZING-001` governs unchanged inside the band. The flat response is
a **named, accepted exposure**, not a defect the implementation may compensate for: an
implementation must **not** invent an escalating `R_down`, a second rail, a severity
multiplier or a level-dependent term. Beyond `AdvisoryCeiling`,
`ALK-ADVISORY-RANGE-BOUNDARY-001` governs.

---

## OI-CZERODISCONT-001 — the sized rate is discontinuous where `C_estimate` crosses zero

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-003A` interpretable branch; `ALK-HIGH-BREACH-SAFETY-SIZING-001`
- **Owner module:** `SAFETY`
- **Raised by:** review of the decisions 16–19 encoding, as `SIZING-C-ZERO-DISCONTINUITY`
- **Status:** **OPEN.** Not addressed by decisions 20, 21 or 22.

> **NOT ADDRESSED. This item remains OPEN.**
>
> Owner decision 22 adds branch B′ for a `C_estimate` that cannot be computed. It explicitly
> does **not** address the discontinuity between branches A and B, and **no branch boundary
> was adjusted to reduce it**. Branch B′ inherits branch B's formula exactly, so it adds no
> new discontinuity of its own.

### The finding, as reported

**`SIZING-C-ZERO-DISCONTINUITY`.** The two high-breach sizing formulas are unrelated
functions that meet at `C_estimate = 0` only by coincidence:

```text
A  (C_estimate >= 0):  D_safety,temp = max(0, (C_estimate + S_safety) / P_selected)
B  (C_estimate <  0):  D_safety,temp = max(0,  D_current - R_down / P_selected)
```

At `C_estimate = 0` exactly, A gives `max(0, −R_down/P_selected) = 0`. B, evaluated at a
`C_estimate` infinitesimally below zero, gives `max(0, D_current − R_down/P_selected)`,
which is the configured rate less the same quantity — for `D_current = 9.0`,
`R_down = 0.50` and `P = 0.0693`, that is 1.785 mL/day. An arbitrarily small change in the
consumption estimate therefore moves the delivered rate between 0 and 1.785 mL/day, in the
same tank state.

This is structurally the same defect owner decision 16 removed at the materiality boundary,
displaced to the branch boundary above it. It is not reachable by the same mechanism —
`C_estimate` is a continuous physical estimate, not a classification — but the delivered
rate is still a step function of it.

### Until closed

Both formulas govern on their own sides of `C_estimate = 0`, exactly as written. An
implementation must **not** blend, interpolate, clamp or reorder them, and must not move the
branch boundary. The discontinuity is a named exposure.

---

# A5. Opened by review of the decisions 20–22 encoding — ALL OPEN

Focused `canon-conformance-auditor` and `breaker` review of the decisions 20–22 encoding
reported findings that **can change a recommendation, a safety action or a retest
output**. Under the task constraint they are reported and left for the owner rather than
resolved by the run that found them. Each is recorded here **and** as a `RECORDED EXPOSURE`
block in the canon rule it affects, so an implementer reaching the rule cannot miss it.

**None of these is decided. Each states what the encoding does in the meantime, and what an
implementer must not do instead.**

| Item | Question | Can change |
|---|---|---|
| `OI-BRANCHAREFUSAL-001` | does high-breach branch A refuse when `D_current` is unknown? | a recommendation |
| `OI-ADVISORYEXCEPTION-001` | is decision 21's exception list closed, and does the high-side safety return's rate continue beyond the ceiling? | a recommendation |
| `OI-ADVISORYMEMBERS-001` | is a `SUSPECT` member a member for "every member beyond the boundary"? | a safety action |
| `OI-ADVISORYRETEST-001` | is escalation a retest-scheduler candidate? | a retest output |
| `OI-ADVISORYRETURN-001` | an in-flight downward return plan terminated at the ceiling | a recommendation |

## OI-BRANCHAREFUSAL-001 — does branch A refuse when `D_current` is unknown?

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-DELIVERY-RATE-BASIS-001`; `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `ALK-003A` interpretable branch
- **Owner module:** `SAFETY`
- **Raised by:** `canon-conformance-auditor` and `breaker`, decisions 20–22 review
- **Status:** **RESOLVED.** Raised as OPEN; closed by the decision named in the box above.

> **RESOLVED by owner decision 25.**
>
> The refusal is now a **precondition evaluated before branch selection**, in
> `ALK-DELIVERY-RATE-BASIS-001`, and it applies **identically to branches A, B and B'**. The
> precondition is about the *state* — the delivered rate is not known — not about which
> symbols a particular branch's formula happens to use. Branch A refuses too.
>
> `INV-G15` asserts that no high-breach state produces both a numeric recommendation and a
> refusal, and that the same state cannot produce different outputs under different readings
> of the rules. **Fixture:** `AD-SAF-010` (branch A unknown ⇒ refusal; branch A known ⇒ the
> ordinary branch-A recommendation 1.443001443 → 1.4; branches B and B′ unknown ⇒ refusal).

**The question.** Owner decision 20 states the unknown handling as "if `D_current` is unknown
or not configured, no temporary safety rate is emitted", without naming a branch. The
high-breach tree has three branches, and **branch A's formula does not contain
`D_current`**:

```text
A   D_safety,temp = max(0, (C_estimate + S_safety) / P_selected)     <- no D_current
B   D_safety,temp = max(0, D_current - R_down / P_selected)
B'  D_safety,temp = max(0, D_current - R_down / P_selected)
```

`C_estimate` needs `D_history`, not `D_current`. So on branch A with `D_current` unknown and
`D_history` available, every input the safety rate needs is present.

**Why it matters, with numbers.** `A_now` 11.5 dKH, `OuterMax` 11.0, `A_safe,high` 10.8,
`P_selected` 0.0693, `C_estimate` +0.60 dKH/day, recommendation precision 0.1, `D_current`
unknown:

- read literally, decision 20 withholds: `temporarySafetyRateContinuousMlPerDay = NOT_RUN`;
- read against the formulas, branch A emits `max(0, (0.60 − 0.50)/0.0693) = 1.443 mL/day`,
  recommendation **1.4 mL/day**.

Withholding here is the outcome decision 22's own rationale rejects — "withholding a
reduction … would leave delivery running unchanged above the outer bound". Emitting here
contradicts four documents that state the refusal without a branch qualifier.

**Until closed.** Branch A with an unknown `D_current` is **`NOT_RUN`** — the conservative
reading of the decision as written — with the measured state, the reason and the required
dKH movement and direction surfaced under `CORE-INFORM-PROCEED-001`, so the keeper is not
left with silence. An implementer must **not** emit the branch-A rate instead. Note also
that `ALK-ROUNDING-001`'s tie-toward-current and step-toward-current steps have no operand
without `D_current`, so a branch-A rate could not be rounded to a recommendation in
that state even if it were emitted — which is itself a reason the owner may prefer the
withholding reading.

---

## OI-ADVISORYEXCEPTION-001 — is decision 21's exception list closed, and what continues above the ceiling?

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001`; `ALK-OUTER-BOUND-ACTION-001`; `ALK-SAFETY-RETURN-INTEGRATION-001`; `ALK-SAFETY-CORRECTION-RESOLUTION-001`
- **Owner module:** `SAFETY`
- **Raised by:** `canon-conformance-auditor` and `breaker`, decisions 20–22 review
- **Status:** **RESOLVED.** Raised as OPEN; closed by the decision named in the box above.

> **RESOLVED by owner decision 24.**
>
> **There is no exception list, because there is no withholding to except anything from.**
> The advisory boundary is now a **warning attached to an ordinary recommendation**. Both
> questions this item raised — whether the list was closed, and whether the high-side safety
> return's rate continued past the ceiling — cannot arise: the ordinary rules produce the
> recommendation at every level, on both sides.
>
> The consequence this item recorded — that at 12.0 dKH the engine commanded nothing while
> the pump continued at 9.0 mL/day — was **doubly wrong**. Decision 24 removes the
> withholding, and owner decision 23 establishes that the engine never commanded a pump in
> the first place, so "the pump continues" described a mechanism that does not exist.
> **Fixtures:** `AD-ESC-001`, `AD-ESC-002`, `AD-ESC-003`.

**The question, in two parts.**

1. **Closed or illustrative?** Decision 21 withholds delivery guidance "unless an
   already-authoritative safety rule explicitly governs the state". The canon encodes that
   as an enumeration. The stated principle — "the engine's own sized delivery guidance" —
   does not by itself separate the listed rules from the withheld one: the low-breach
   correction volume `V_safety = ΔA_safety / P_selected` is **also** sized by the engine,
   from the same rail-bounded `min(…, 0.50)` desired movement and the same `P_selected`. A
   reader cannot tell from the principle which side any unlisted rule falls on.
2. **Does the high-side safety return continue?** `ALK-003A` triggers a `SAFETY_RETURN` on
   **either** bound, and `ALK-SAFETY-RETURN-INTEGRATION-001` is an already-authoritative
   safety rule. On the high side that return's **only** delivery instrument is
   `D_safety,temp` — which this rule withholds. Read one way the return's output continues;
   read the other it does not.

**Why it matters, with numbers.** `AD-ESC-001`'s inputs (`P` 0.0693, `A_safe,high` 10.8,
`D_current` 9.0 mL/day, increment 0.1):

| `A_now` | escalates | engine's command | delivered |
|---|---|---|---|
| 11.9 | no | 1.8 mL/day | **1.8 mL/day** |
| 12.0 | yes | none | **9.0 mL/day** — the pump continues at its configured rate |
| 12.1 | yes | none | **9.0 mL/day** |

`outerBoundState` is `BREACHED_HIGH` at all three. **Withholding is not neutral at an
actuator**: the previously configured rate keeps running. Neither `ALK-046` /
`ALK-COMPOSITE-RAIL-001` nor `ALK-LIQUID-VOLUME-GUARD-001` constrains it, because the engine
generates no delivery for them to bind on. This is a faithful consequence of "withhold
rather than set"; it is recorded so it is **visible rather than discovered**.

**Until closed.** The enumeration is operative exactly as written: the low-breach one-off
correction **volume** continues at and beyond `AdvisoryFloor` (`AD-ESC-002`); the high-side
sized **rate** does not (`AD-ESC-001`). An implementer must **not** widen the enumeration,
and must not infer from it that any unlisted safety rule continues.

---

## OI-ADVISORYMEMBERS-001 — is a `SUSPECT` member a member for "every member beyond the boundary"?

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001`; `ALK-EPISODE-RESOLUTION-001`; `ALK-SUSPECT-DETECTION-001`
- **Owner module:** `SAFETY`
- **Raised by:** `breaker`, decisions 20–22 review
- **Status:** **RESOLVED.** Raised as OPEN; closed by the decision named in the box above.

> **RESOLVED by owner decision 24.**
>
> The member-wise predicate is **retired with the withholding it served**. It existed only to
> decide whether advice was withheld at the boundary; advice is not withheld, so a contested
> episode's member statuses no longer determine anything, and the `SUSPECT`-member question
> cannot arise. `ALK-EPISODE-SINGLE-OUTPUT-001` needs no exception and its consumer table
> reverts to the plain rule: a contested episode resolves no value, so there is nothing to
> recommend and nothing to warn about. **Fixture:** `AD-ESC-003`, including the
> `WITH_SUSPECT_MEMBER` case that this item raised.

**The question.** The contested carve-out is a universal predicate over "every member". It
is not defined against member **validity state**. `ALK-EPISODE-RESOLUTION-001` excludes
`INVALID` measurements and is **silent on `SUSPECT`**, which is a live state with three
canon-defined sources under `ALK-SUSPECT-DETECTION-001`.

**Failure scenario.** One episode, same instant, `OuterMax` 11.0 so `AdvisoryCeiling` 12.0,
incompatible methods so `CONTESTED_METHODS`:

```text
KIT_A  12.3
KIT_B  12.6
KIT_C  11.4   marked SUSPECT by the user
```

- SUSPECT counted as a member → not every member is beyond 12.0 → **no escalation**; the
  card at 12.3/12.6 dKH says only "contested, repeat now";
- SUSPECT excluded like INVALID → every remaining member is beyond → **escalate**.

Two different safety outputs from the same three readings.

**Until closed.** An implementer must **not** choose. Where any episode member's validity
state leaves the predicate undecidable, emit the ordinary contested behaviour —
`position`, `outerBoundState` and `rapidConfirmed` `NOT_RUN`, `REPEAT_NOW` — and surface
that the advisory-boundary test could not be evaluated. Do not exclude `SUSPECT` members by
analogy with `INVALID`, and do not escalate on a partial majority.

---

## OI-ADVISORYRETEST-001 — is escalation a retest-scheduler candidate?

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001`; `ALK-RETEST-SCHEDULER-001`; Part II §50; `X-INV-004`
- **Owner module:** `RETEST`
- **Raised by:** `breaker`, decisions 20–22 review
- **Status:** **RESOLVED.** Raised as OPEN; closed by the decision named in the box above.

> **RESOLVED by owner decision 26.**
>
> One retest answer. `ALK-RETEST-SCHEDULER-001` owns it; the warning **renders whatever the
> scheduler produced** and states no interval of its own. "Confirm with a second test" is a
> statement about confidence in the reading, not a schedule. The warning submits no candidate
> and computes no next-test time, so the card and the scheduler cannot disagree.
> **Fixtures:** `AD-ESC-001`, `AD-ESC-002`, `AD-ESC-003`, each asserting
> `warningRetestIntervalHours == schedulerRetestIntervalHours`.

**The question.** Decision 21 requires the escalation output to state "that the reading
should be **confirmed by a second test**", and separately to "preserve shortened/reprioritised
retesting". `ALK-RETEST-SCHEDULER-001` is the single authority on Alk retest timing, states
that "**no card, surface or other rule may compute a next-test time**", and enumerates the
rules that may submit a candidate. `ALK-ADVISORY-RANGE-BOUNDARY-001` is **not** among them.

**Failure scenario.** An escalated resolved episode at 12.0 dKH: the card says "confirm this
reading", and the scheduler's own answer is the ~24 h high-breach cadence it already owned.
The keeper is told to retest now and shown a next test tomorrow. By contrast a **contested**
episode at the same level gets `REPEAT_NOW` from `ALK-EPISODE-RESOLUTION-001`, which makes
the resolved case's 24 h look like an oversight rather than a decision.

**Until closed.** **No new scheduler candidate is created.** The scheduler's existing answer
stands and this rule may not compute a next-test time. An implementer must **not** add a
`REPEAT_NOW` candidate for escalation on the grounds that it "obviously" belongs — that is
the owner's call, and it changes a retest output.

---

## OI-ADVISORYRETURN-001 — an in-flight downward return plan terminated at the ceiling

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001`; `ALK-RETURN-TERMINATED-BY-SAFETY-001`; `ALK-SAFETY-RETURN-INTEGRATION-001`
- **Owner module:** `SAFETY`
- **Raised by:** `breaker`, decisions 20–22 review
- **Status:** **RESOLVED.** Raised as OPEN; closed by the decision named in the box above.

> **RESOLVED by owner decisions 23 and 24.**
>
> Two independent reasons, either sufficient. **Decision 24**: the boundary no longer
> withholds, so a terminated return plan is replaced by the ordinary sized recommendation at
> the ceiling exactly as it is anywhere else — the gap this item described does not exist.
> **Decision 23**: terminating a *recommendation* was never an instruction to a pump, so
> "stopping a reduction raises delivery" was reasoning about an execution path the
> application does not have. **Fixture:** `AD-REC-002`.

**The question.** Decision 21 does not address an intervention already in flight when the
level crosses the boundary, and `ALK-RETURN-TERMINATED-BY-SAFETY-001` is not amended by it.

**Failure scenario.**

1. Alk stable above the preferred range but inside `OuterMax`. A **downward** return plan is
   offered and accepted; its temporary component **reduces** delivery below `D_current`.
2. A doser fault drives the resolved episode value to 12.0 dKH with `OuterMax` 11.0.
3. `outerBoundState = BREACHED_HIGH` (preserved by decision 21) → `SAFETY_RETURN` triggers.
4. `ALK-RETURN-TERMINATED-BY-SAFETY-001` fires: the plan is `TERMINATED_BY_SAFETY_RETURN`
   and `recommendedTemporaryMovement = STOP_PENDING_USER_ACTION`. Stopping a temporary
   **reduction** returns delivery to the base rate — an **increase**.
5. `ALK-ADVISORY-RANGE-BOUNDARY-001` withholds the `D_safety,temp` that would otherwise have
   replaced it.

Net: at 12.0 dKH the only delivery-affecting instruction the engine issues is *stop
reducing*. Below the ceiling the state is safe, because the sized rate replaces the
terminated component; at and beyond it there is no replacement.

**Until closed.** The state is **named, not filled**. An implementer must **not** invent a
hold-the-reduction rule, must not suppress the termination, and must not resume the plan.
No fixture covers a return plan in flight across `AdvisoryCeiling`, and none is added here,
because any expectation it asserted would be the decision.

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
step cap, empirical bracket, non-negative clamp and recommendation rounding. Neither mentions
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
(the canonical event order) for `Sxx` and every other accumulation. The
recommendation compares exactly.

**Amended by owner decision 18.** The canonical threshold predicates named in
`ALK-DECIMAL-THRESHOLD-001` — `ALK-005`'s repeat spread, `ALK-004`'s range edges and
`ALK-003A`'s outer-bound and completion comparisons — are **exact decimal** comparisons over
stored decimal measurement quantities, with no pre-rounding and no epsilon. Binary64 governs
everything derived, as above. The tolerances in `ALK-V2-IMPLEMENTATION-CONTRACT.md` §7 are
fixture-comparison tolerances and do not apply to those predicates.

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
| repeat-cluster spread | anomalous when `max − min > 0.20`, compared as exact decimals, with no method qualifier | `ALK-005`; `ALK-DECIMAL-THRESHOLD-001`; `ALK-REPEAT-SPREAD-DOMAIN-001` (owner decision 27) |
| water-change materiality | material when `|ΔA_WC| ≥ 0.10` | `ALK-033` |
| unknown water-change break | breaks when `f ≥ 0.05` | `ALK-WATERCHANGE-UNKNOWN-001` |
| independent spacing | independent when `Δt ≥ 24 h` | `ALK-008` excludes `< 24 h`; `ALK-RAPID-001` accepts "at least 24 hours" |
| rapid threshold | rapid when `|S| ≥ 0.30` | `ALK-RAPID-001` |
| step-cap meaningfulness | active when `D_current ≥ 4 R_precision` | `ALK-STEP-CAP-001` |
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

# A7. Owner decisions 27 and 28 — the method sweep and the 30-minute window

## OI-METHODUNKNOWN-001 — the engine cannot distinguish one test method from another

- **Class:** `OWNER_DECISION_REQUIRED` (foundational constraint)
- **Canon:** `ALK-REPEAT-SPREAD-DOMAIN-001`; `ALK-TESTING-EPISODE-001`; `ALK-EPISODE-RESOLUTION-001`; `ALK-EPISODE-SINGLE-OUTPUT-001`; `ALK-ADVISORY-RANGE-BOUNDARY-001`; `ALK-005`
- **Owner module:** `SEGMENTATION`

> **RESOLVED by owner decision 27.**
>
> The application does not record, ask for, infer or store the test method, kit, device or
> instrument behind any reading, so it has no basis on which to call two readings compatible
> or incompatible. A reading is a reading. Retired entirely: method compatibility,
> incompatible methods, cross-method disagreement, the `CONTESTED_METHODS` episode state,
> `compatibleMethodClassification`, `crossMethodConcordanceThreshold`, `Reading.methodId`,
> `TestingEpisode.episodeMethods[]`, and six reason codes. Where canon withheld, refused or
> classified differently because an episode was contested, **ordinary logic applies
> instead**. `ALK-005`'s 0.20 dKH spread rule keeps its threshold, its strict `>`, its
> exact-decimal comparison and its boundary, and loses only the method qualifier; its
> *"unless a known testing method justifies another value"* clause can never fire and is
> marked inoperative.
>
> No guidance, warning or prompt about method differences is added anywhere.

### What this retires outright

| Concept | Why it is gone |
|---|---|
| a contested episode suppressing `position`, `outerBoundState`, `rapidConfirmed` and issuing `REPEAT_NOW` | there is no contested state; every episode resolves |
| the member-wise reading of an episode at the advisory boundary | already retired by decision 24; decision 27 removes the state it was scoped to |
| `ALK-005`'s method escape clause | a known testing method is never available |
| `ALK-RETEST-SCHEDULER-001`'s contested submitter | added for the contested `REPEAT_NOW`; withdrawn with it |

### What survives with independent substance

| Finding | What survives |
|---|---|
| Part II §5.3's *"no relevant intervention between them"* condition | untouched by decision 28 and **retained**; `OI-EPISODEINTERVENTION-001` |
| the 30-minute window's governance | it is now the whole membership test but is still described by Part II §5.3 as an implementation constant; `OI-EPISODEWINDOW-001` |
| window anchoring | pairwise versus from-first is untouched and now load-bearing; `OI-EPISODEANCHOR-001` |
| `SUSPECT` and `SUPERSEDED` members | `INVALID` is excluded by Part II §4.3; the other two are unstated; `OI-EPISODESUSPECT-001` |
| shared canon's method wording | `OI-PII53METHOD-001` |
| high-breach sizing findings | untouched: they are sizing, not episodes |

---

## OI-EPISODEMEMBERSHIP-001 — what makes two measurements repeats of one test

- **Class:** `OWNER_DECISION_REQUIRED`
- **Canon:** `ALK-TESTING-EPISODE-001`
- **Owner module:** `SEGMENTATION`

> **RESOLVED by owner decision 28.**
>
> Measurements of the same parameter within 30 minutes of one another are repeats of a
> single test and combine into one observation under the existing representative-value
> rules. More than 30 minutes apart, they are separate observations. Proximity in time is
> the whole test: no method qualifier, no explicit repeat-relationship requirement. The
> window is the existing 30 minutes, inclusive at exactly 30.
>
> The resolved observation carries `combinedMeasurementCount`, a structured field the
> interface renders plainly ("3 tests combined"). The engine emits the integer and does not
> author the sentence.
>
> This supersedes `ALK-TESTING-EPISODE-001`'s decision-17 membership conditions. It does
> **not** change the 24-hour trend-independence rule, and episode resolution stays distinct
> from trend independence.
>
> **Fixtures:** `AD-EPI-005` (5 minutes, count 2), `AD-EPI-001` (three inside 30 minutes,
> count 3), `AD-EPI-006` (45 minutes, two observations), `AD-EPI-007` (29 / 30 / 31 minutes).

---

## OI-EPISODEINTERVENTION-001 — does an intervention inside 30 minutes split an episode

- **Class:** `CANON_DEFECT` + `OWNER_DECISION_REQUIRED`
- **Status:** **OPEN.** Opened by owner decision 28.
- **Canon:** `ALK-TESTING-EPISODE-001`; Part II §5.3

Part II §5.3's automatic grouping requires *"no relevant intervention between them"*.
Decision 28 removes the method and explicit-relationship conditions and says *"no
exceptions"*, without naming the intervention condition either way. Canon and the algorithm
contract **retain** it, which is the status quo and the conservative reading.

**Failure scenario.** A dose change is logged at 09:05; readings at 09:00 and 09:12 sit
either side of it. Retaining the condition gives two observations, one before and one after
a known input. Dropping it merges a pre-change and a post-change reading into one value,
which is what segmentation exists to prevent. **Not decided here.**

---

## OI-EPISODEWINDOW-001 — the 30-minute window is not frozen as a chemistry constant

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Sharpened by owner decision 28.
- **Canon:** Part II §5.3; `ALK-005`; `ALK-TESTING-EPISODE-001`

Part II §5.3 calls the window *"an internal implementation constant/policy"*, a
*"recommended default … subject to implementation review"*, and *"not a chemistry
threshold"*. After decision 28 it is the whole membership test, and therefore decides
`position`, the outer-bound classification and `rapidConfirmed`. An implementation that
reviews it to 45 minutes — which §5.3 expressly permits — gets different answers.
`CLAUDE.md` requires any cadence that governs behaviour to be stated in frozen canon.
**Not decided here**; decision 28 kept the value, not the governance of it.

---

## OI-EPISODEANCHOR-001 — is the window measured pairwise or from the first measurement

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Sharpened by owner decision 28.
- **Canon:** Part II §5.3; `ALK-TESTING-EPISODE-001`

"Within 30 minutes of one another" and "timestamps within an internal
`repeatClusterWindow`" do not say whether the window is measured between consecutive
measurements or from the episode's first. For an episode of two they agree. For readings at
09:00, 09:25 and 09:50, chaining gives one episode spanning 50 minutes; anchoring gives two.
**Not decided here.** No fixture depends on it: `AD-EPI-001` keeps all three readings within
30 minutes of each other *and* of the first, and `AD-EPI-007`'s cases have two readings each.

---

## OI-EPISODESUSPECT-001 — does a `SUSPECT` or `SUPERSEDED` member pool

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Narrowed by owner decision 27, not closed.
- **Canon:** `ALK-EPISODE-RESOLUTION-001`; Part II §4.2, §4.3, §4.4

`ALK-EPISODE-RESOLUTION-001` excludes `INVALID` members under Part II §4.3 and names no
other status. `ReadingQuality` also has `SUSPECT` ("in analysis: conditionally") and
`SUPERSEDED` ("not in analysis"). Whether either participates in the pooled value and in
`combinedMeasurementCount` is unstated, and both change the episode value and the count.
`AD-ESC-003` deliberately uses an `INVALID` member rather than a `SUSPECT` one so that no
fixture depends on the answer. **Not decided here.**

---

## OI-ANOMLATESTSAFETY-001 — what the outer-bound safety path does beside an anomalous latest cluster

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Pre-existing; made reachable more often by owner decision 27.
- **Canon:** Part II §48; `ALK-OUTER-BOUND-ACTION-001`; `ALK-005`

Part II §48 withholds "ordinary dose escalation/reversal" while the latest cluster is
anomalous, "unless a parameter-specific safety override requires action". Whether
`ALK-003A`'s outer-bound path is such an override is not stated. Before decision 27, two
widely disagreeing readings became a contested episode and the question did not arise; now
they combine into one anomalous cluster and it does. `AD-ESC-003` and `AD-EPI-004` assert
`automaticMaintenanceAction = WITHHELD` and assert **nothing** about the safety rate.
**Not decided here.**

---

## OI-PII53METHOD-001 — shared canon still carries method-conditional grouping

- **Class:** `CANON_DEFECT` (shared)
- **Status:** **OPEN.** Opened by owner decision 27.
- **Canon:** Part II §5.3, under `SHARED_V2_FREEZE_2`

Part II §5.3 still reads *"same test method or compatible method"*. That is shared canon,
and owner decision 27 is an alkalinity decision recorded in the Alk parameter canon. For
alkalinity the condition is inoperative and the Alk rules govern; the shared wording is left
as it stands. A shared reissue should reconcile it — **not done here**, because editing
shared canon is outside this pass and would change a freeze this decision does not name.

---

# A6. Findings OUTSIDE owner decisions 23–26 — RECORDED, NOT DECIDED

The owner's brief for the decisions 23–26 round said, of anything the reviewers found that
the four decisions do not settle: **"RECORD AND LEAVE OPEN. Do not fix, do not decide, do not
expand scope."** This section is that record.

Each item below was raised by the `canon-conformance-auditor` or the `breaker` in review of
the decisions 23–26 encoding, was judged to be **outside** what decisions 23, 24, 25 and 26
decide, and was therefore **not** acted on in the fix pass. None is asserted to be harmless;
none is asserted to be a defect. They are stated so the owner can see them and choose.

**None of these withholds an output pending a decision.** Every path named below runs and
produces a value today.

## OI-DCURRENTZERO-001 — A doser configured to 0 mL/day is not distinguished from an unconfigured one

- **Class:** `OWNER_DECISION_REQUIRED`
- **Status:** **OPEN.**
- **Canon:** `ALK-DELIVERY-RATE-BASIS-001` high-breach precondition (owner decisions 20
  and 25); `ALK-HIGH-BREACH-SAFETY-SIZING-001`; `INV-G14`.
- **Raised by:** `breaker`, decisions 23–26 review, finding F14.

The precondition reads "`D_current` unknown **or not configured**". A keeper who has turned
their doser off has a doser that **is** configured, at a value of 0 mL/day. On that reading
the precondition passes, a branch is selected, and B or B′ gives
`max(0, 0 − R_down/P) = 0` with `SAFETY_HIGH_BREACH_RATE_FLOORED_AT_ZERO`. On the other
reading — "0 means nothing is set up" — the precondition refuses and the output is `NOT_RUN`
with `SAFETY_HIGH_BREACH_RATE_NOT_RUN_DOSE_UNKNOWN`.

The two outputs look near-identical on a card. They differ in the reason code and in whether
the engine is claiming to know the delivery rate.

`INV-G14` already pins the symmetric rule for the **other** quantity — "a `D_history` that
integrates to **exactly zero** … is a value, not an absence" — and nothing states it for
`D_current`. Corpus search: `currentDoseMlPerDay == 0` appears in exactly one fixture,
`WG-ALK-004`, a maintenance golden. **No high-breach fixture covers it.**

**Why it is not decided here.** Decisions 20 and 25 settle *where* the refusal is evaluated
and *which branches* it reaches. Neither says what counts as "configured". Answering it sets
behaviour, so it is the owner's.

## OI-ADVISORYWARNSTATE-001 — `advisoryConfidenceWarning`'s third value has no stated trigger set

> **RESOLVED by owner decision 29.**
>
> The field has exactly two states: `ATTACHED` (present) and `NONE` (absent). `NOT_RUN` is
> **removed**, not specified — the owner resolved the gap by deleting the value rather than
> giving it a trigger set. Where no reading resolves there is nothing to warn about and the
> field is absent, which is `NONE`.
>
> Owner decision 27 independently removes the contested episode, which
> `ALK-ADVISORY-RANGE-BOUNDARY-001` gave as the value's only documented trigger. The
> algorithm contract's `FAILURE STATE` — bounds unavailable — now says the *check* does not
> run, which is a statement about the check and not a third value of the field.
>
> Encoded in `ALK-ADVISORY-RANGE-BOUNDARY-001` (canon), `ALK-V2-DATA-CONTRACT.md`,
> `ALK-V2-ALGORITHM-CONTRACT.md` A40b, `INV-G14` and `AD-ESC-003`.
>
> Everything below this box is the pre-decision analysis, preserved as the record of why the
> decision was needed.

- **Class:** `CANON_DEFECT`
- **Status:** **RESOLVED by owner decision 29.**
- **Canon:** `ALK-ADVISORY-RANGE-BOUNDARY-001` (owner decision 24); data contract
  `advisoryConfidenceWarning`.
- **Raised by:** `canon-conformance-auditor`, decisions 23–26 review, finding F-18.

The field is `NONE | ATTACHED | NOT_RUN`. `ATTACHED` and `NONE` are fully specified by the
boundary predicate. `NOT_RUN` is documented only as "where no episode value resolves" —
which is the contested case — and the canon rule states the contested case in prose without
naming the token. Whether `NOT_RUN` covers any other state (bounds unavailable, so the
boundary is not computable) is stated in the algorithm contract's `FAILURE STATE` but not in
the canon rule that owns the field.

**Why it is not decided here.** It is a completeness gap in how decision 24 was written
down, not a question decision 24 answers, and filling it would state behaviour the canon
does not.

## Consequences of the decision-23 sweep in rules that pre-date it

Both of these were reached **because** decision 23 retired the actuator premise, and both
sit in rules that are pre-existing authority. The fix pass encoded what decision 23 itself
says and went no further.

- **`ALK-STEP-CAP-001`'s symbol.** Decision 23 renames \(R_{pump}\) to \(R_{precision}\).
  `ALK-STEP-CAP-001` uses the quantity in three live formulas, including
  \(0.25\,D_{current}\ge R_{precision}\) and \(D_{current}\ge 4R_{precision}\). The
  arithmetic and every threshold are **unchanged** — the fix pass verified this against the
  golden record — but whether a *display convention* is the right quantity for a
  **dose-step cap** is a question decision 23 does not ask. `breaker` F5. **Recorded.**
- **`ALK-ROUNDING-001` step 6 on the no-precision path.** The fix pass states, per decision
  23 item 5, that the hard-constraint recheck against `ALK-046` and
  `ALK-LIQUID-VOLUME-GUARD-001` still runs where no precision is configured. That much is
  decision 23's own words. What the *rest* of the rounding pipeline means with no increment
  — steps 1–4 and 7 have nothing to round to — is stated as "they do not apply", which is
  the only reading available, but the canon does not independently say so. `breaker` F13.
  **Recorded.**

## Pre-existing conditions, restated so they are not lost

None of these was introduced by decisions 20–22 or 23–26, and none is fixed here.

| Item | What it is | Where |
|---|---|---|
| Six recorder discrepancies | `continuousActionCandidateMlPerDay` on `WG-ALK-001/003/004/033` differs from the recomputation by ≤ 7.0e-5 mL/day, a rounding-order artefact; `AD-MNT-002/004` differ materially because the field name carries a **different quantity** in those two fixtures (a capped value, not the pre-cap candidate) | Step 0 baseline `golden-baseline-65c6030.json`, unchanged in every record since |
| `variantReasonCodes` | The shape is now read by the gate, but only two fixtures use it and neither round added one | `AD-SAF-007`, `AD-CON-002` |
| The new-constant scan | Gate check 9 is a fixed literal list of seven strings, not a delta against the frozen constant set; it cannot see a constant introduced under a name not on that list | `CHK-CANON-CONSTANTS` in `tools/conformance/harness/package_checks.py` — the check moved with the gate (`DEC-019`) and the limit moved with it; mutation `D-13` is recorded BLOCKED for exactly this reason |
| `ALK-SAFETY-RETURN-INTEGRATION-001` at the boundary | **No fixture anywhere states numbers** for an active return plan or a `SAFETY_RETURN` crossing the advisory boundary. `AD-REC-002` covers `IN_FLIGHT_RETURN_PLAN_TERMINATED` qualitatively only — no rate, no volume, no retest | coverage gap, `breaker` "not examined" |
| The intervention lock and `ALK-PREDICTION-SNAPSHOT-001` at the boundary | No fixture; unattacked | coverage gap |
| Time, timezone, DST, backdating, migration, schema versions | Out of scope for the four decisions, and entirely unattacked in this round | coverage gap |


---

# D. Summary

### Status at `ALK_V2_FREEZE_5`

| Status | Count | IDs |
|---|---|---|
| **OPENED by Freeze-5 review, CLOSED by F5-13/14/15** | 3 | OI-HIGHBREACHBAND-001, OI-CLUSTERTIE-001, OI-RETESTFLOOR-001 |
| **RESOLVED by owner decisions 16–19** | 5 | OI-HIGHBREACHSIZING-001, OI-EPISODE-001, OI-CROSSMETHOD-001, OI-DECIMALTHRESHOLD-001, OI-EPISODECONSUMER-001 |
| **OPENED by decisions 16–19 review, RESOLVED by owner decisions 20 and 22** | 2 | OI-DELIVERYRATEBASIS-001, OI-UNCOMPUTABLEC-001 |
| **OPENED by decisions 16–19 review, LEFT OPEN** | 2 | OI-SIZINGFLAT-001 (narrowed by decision 21, then NO LONGER NARROWED by decision 24, and not closed), OI-CZERODISCONT-001 (not addressed) |
| **OPENED by decisions 20–22 review, RESOLVED by owner decisions 24, 25 and 26** | 5 | OI-BRANCHAREFUSAL-001 (25), OI-ADVISORYEXCEPTION-001 (24), OI-ADVISORYMEMBERS-001 (24), OI-ADVISORYRETURN-001 (24), OI-ADVISORYRETEST-001 (26) |
| **OPENED by decisions 23–26 review, RECORDED AND LEFT OPEN — section A6, not decided** | 2 | OI-DCURRENTZERO-001, OI-ADVISORYWARNSTATE-001 |
| **RESOLVED by Freeze 5** | 13 | OI-INDEPENDENCE-001, OI-SUSPECT-001, OI-MADFLOOR-001, OI-NEGCONS-001, OI-RETEST-001, OI-RETURNOFFER-001, OI-BELOWRISING-001, OI-WATERCHANGE-001, OI-LIQUIDGUARD-001, OI-SAFETYRATE-001, OI-RETURNDURINGSAFETY-001, OI-RAPIDBASIS-001, OI-CONFIDENCE-001 |
| `CANON_DEFECT` still open (all non-blocking) | 11 | OI-STABLE-001, OI-DAY4-001, OI-EXPOSURE-001, OI-NORMUNCERT-001, OI-POTENCYSTATE-001, OI-POTENCYSNAP-001, OI-WG024-001, OI-ANOMCLUSTER-001, OI-OVERSHOOT-001, OI-PIPELINE-001, OI-PLANTARGETEDIT-001 |
| `OWNER_DECISION_REQUIRED` still open | 0 | — |
| `IMPLEMENTATION_DETAIL_ALREADY_DETERMINED` | 13 | OI-MEDIAN-001, OI-EVIDENCEVOCAB-001, OI-RAPIDEVIDENCE-001, OI-FORECASTHORIZON-001, OI-DEFERREASON-001, OI-CONSUMPTIONLOOKBACK-001, OI-BRACKETEFFECT-001, OI-CHANGEPOINT-001, OI-POSITIONCLUSTER-001, OI-ANCHOR-001, OI-BOUNDARIES-001, OI-MAINTDURINGPLAN-001, OI-DETERMINISM-001 |
| `NO_PROBLEM` | 3 | OI-CAMG-001, OI-HANDOFF-001, OI-SEGMENTPICK-001 |

54 distinct issue IDs (3 + 13 + 11 + 13 + 3 + 4 + 5 + 2). **Sixteen are resolved by Freeze 5** — the
thirteen its original decisions closed, plus the three its review opened and its amendments
F5-13, F5-14 and F5-15 then closed. Seven more are resolved by owner decisions 16–22.

Every `OWNER_DECISION_REQUIRED` item across the first three rounds was decided by the owner.
None was resolved by derivation. **Nothing is blocking, and no output is withheld for want
of a decision** — including the two items section A4 leaves open: `OI-SIZINGFLAT-001` and
`OI-CZERODISCONT-001` both name an exposure inside a path that runs and produces a value,
and both forbid the implementation from compensating.

**Section A5 briefly broke that**, and owner decisions 23–26 restored it.
`OI-BRANCHAREFUSAL-001` and `OI-ADVISORYMEMBERS-001` each withheld an output pending a
decision; both are now decided, and neither withholds. **Nothing in this package is blocking
again**, and the two items that remain open — `OI-SIZINGFLAT-001` and
`OI-CZERODISCONT-001` — name an exposure inside a path that runs and produces a value.

`OI-SIZINGFLAT-001` deserves a plain sentence, because owner decision 24 moved it in the
**unhelpful** direction. Decision 21 had bounded the flat region by refusing to advise above
`AdvisoryCeiling`. Decision 24 removes that refusal, so the ordinary rules run at every
level and the sized rate stops responding to the measured value from
`A_safe,high + 0.50 dKH` **upward without limit** — as it did before decision 21. The item is
**not narrowed any more and is not closed**, and this is stated wherever it is referenced.

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

---

# A8. Findings OUTSIDE owner decisions 27–29 — RECORDED, NOT DECIDED

Independent review of the decisions 27–29 encoding (`canon-conformance-auditor` and
`breaker`, fresh context, against the pushed tree) reported findings that are **not** inside
the three decisions. The owner's instruction for this pass was explicit: record them and
leave them open. **None is fixed, decided or narrowed below.** Encoding mistakes in the
three decisions themselves were corrected in the same pass and are not listed here.

Six items opened by the same review already have entries in section A7 and are not repeated:
`OI-EPISODEINTERVENTION-001`, `OI-EPISODEWINDOW-001`, `OI-EPISODEANCHOR-001`,
`OI-EPISODESUSPECT-001`, `OI-ANOMLATESTSAFETY-001` and `OI-PII53METHOD-001`.

---

## OI-EPISODENOOBS-001 — canon states no outcome for an episode whose every member is `INVALID`

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Opened by review of the decisions 27–29 encoding.
- **Canon:** `ALK-EPISODE-RESOLUTION-001`; `ALK-TESTING-EPISODE-001`; Part II §4.3

`ALK-EPISODE-RESOLUTION-001` resolves *"every episode holding at least one remaining
measurement"* after `INVALID` exclusion. It does not say what an episode holding **none** is.
Three fields have no member for the state: `episodeStatus` (`RESOLVED` is the only value),
`combinedMeasurementCount` (domain `integer >= 1`, so `0` is outside it) and
`outerBoundState` (`WITHIN_BOUNDS | BREACHED_LOW | BREACHED_HIGH | RECOVERING_INSIDE_BOUND`).

**Failure scenario.** A keeper marks their only reading `INVALID`. An implementer must
either invent a status, emit a count outside its stated domain, or emit an out-of-vocabulary
`outerBoundState` — three different engines, three different records.

`position` is **not** part of this gap: `UNKNOWN` with `POSITION_NO_VALID_MEASUREMENT` is
stated (`ALK-V2-ALGORITHM-CONTRACT.md` A13). `AD-ESC-003`'s `NO_VALID_READING` case asserts
`advisoryConfidenceWarning = NONE` and `position = UNKNOWN` and asserts **nothing** about the
other three. **Not decided here.**

---

## OI-EPISODEMEDIANDECIMAL-001 — the even-count episode median is an operand of safety predicates and is outside the exact-decimal rule's stated scope

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Opened by review of the decisions 27–29 encoding.
- **Canon:** `ALK-DECIMAL-THRESHOLD-001`; `OI-MEDIAN-001`; Part II §5.4; `ALK-003A`

`ALK-DECIMAL-THRESHOLD-001` fixes exact-decimal comparison for the canonical thresholds it
names. Owner decision 28 makes even-member episodes ordinary, and `OI-MEDIAN-001` makes an
even-count median the arithmetic mean of the two central readings — a value that is **not**
one of the stored readings and that binary64 need not represent exactly. That median is then
an operand of `A_now > OuterMax`, `A_now < OuterMin` and the safety-return completion test,
none of which `ALK-DECIMAL-THRESHOLD-001` names.

**Failure scenario.** Two readings whose exact-decimal mean lands exactly on a configured
outer bound: exact decimal says not breached (`ALK-003A`'s comparisons are strict), binary64
can say breached, and the two engines take opposite safety actions on the same input.

The reviewer also observed that the committed gate compares such medians with a `1e-12`
tolerance, on rules whose text says no epsilon. **Not decided here**, and no epsilon,
rounding rule or operand list is added by this pass.

---

## OI-EPISODEDISAGREE-001 — an episode reports the same value however far its members disagree

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Opened by review of the decisions 27–29 encoding.
- **Canon:** `ALK-TESTING-EPISODE-001`; `ALK-005`; Part II §5.4, §48

Two readings of 6.90 and 9.70 and two readings of 4.00 and 12.60 both resolve to 8.30, with
`combinedMeasurementCount = 2` in each case. `ALK-005` marks both `ANOMALOUS`, and Part II
§48's path is the same for both, so the resolved observation carries no signal about the
scale of the disagreement beyond the `ANOMALOUS` flag itself.

**Failure scenario.** A keeper whose kit failed badly and a keeper who mis-read a titration
by one drop receive the identical resolved observation. Whether the engine should distinguish
them, and how, is a product and chemistry question. **Not decided here**, and no
second threshold, tier or classification is added.

---

## OI-RAPIDCONFIRMDISJUNCT-001 — `ALK-013`'s "repeated/confirmed" disjunct no longer names a distinct state

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Opened by review of the decisions 27–29 encoding.
- **Canon:** `ALK-013`; `ALK-RAPID-001`; `ALK-TESTING-EPISODE-001`

`ALK-013` admits rapid confirmation when the latest cluster *"is internally consistent, or
the latest result has been repeated/confirmed"*. Under owner decision 28 every repeat within
30 minutes is already a member of the episode, so a repeat cannot exist outside the cluster
whose consistency the first disjunct tests. The second disjunct is therefore either vacuous
or refers to something canon does not define.

**Failure scenario.** An episode with spread `0.35` fails the first disjunct. An implementer
who reads the second as "a repeat exists" sets `rapidConfirmed = true` on an anomalous
episode; one who reads it as vacuous does not. `rapidConfirmed` opens the exceptional 50%
cap, so the two engines can differ by a factor on the recommended dose. **Not decided here.**

---

## OI-PII52EXPLICIT-001 — Part II §5.2's "explicit grouping wins" is live shared canon that alkalinity no longer honours

- **Class:** `CANON_DEFECT` (shared)
- **Status:** **OPEN.** Opened by owner decision 28; cited in canon before this section
  existed and now recorded here.
- **Canon:** Part II §5.2, under `SHARED_V2_FREEZE_2`; `ALK-TESTING-EPISODE-001`

Part II §5.2 states that explicit repeat grouping wins over automatic grouping, and the
measurement record carries `repeatGroupId`. Owner decision 28 makes proximity in time the
whole membership test for alkalinity, so for alkalinity the field decides nothing. The Alk
artefacts now mark it inoperative and forbid the engine reading it; the **shared** wording is
left as it stands, because editing shared canon is outside this pass. A shared reissue should
reconcile it. **Not done here.**

---

## OI-EPISODEDATEONLY-001 — a date-only measurement cannot be placed in a 30-minute window

> **RESOLVED by owner decision 30.**
>
> A measurement with no usable instant has no position inside the 30-minute window, so it
> **forms no episode and joins none**. It is excluded from episode construction, and the
> exclusion is **silent**: no reason code, no notice, no capability degradation, no payload.
>
> Of the three candidate answers the analysis below sets out — forms its own episode, joins
> the nearest, or is excluded — *joins the nearest* requires placing the measurement in time,
> which means assuming a time, which `SHARED-LEGACY-TIME-001`'s forbidden list rules out
> absolutely. *Forms its own episode* assumes no time, but an episode carries a
> representative timestamp that every downstream consumer reads, so a singleton with none
> would need either a fabricated timestamp or a special case in every consumer of
> `episodeAt` — the first is forbidden and the second gives one inference several owners,
> which `MASTER RULE 1` calls a defect. Exclusion is the answer that neither fabricates nor
> forks.
>
> The failure scenario below is answered directly: three date-only readings on one day form
> **no** episodes, contribute **nothing** to `ALK-008`'s independence count, and are kept in
> history, on the chart and in descriptive statistics. Where that leaves too few independent
> observations, `EVIDENCE_INSUFFICIENT_CLUSTERS` says so — and says only that.
>
> This is a deliberate **relaxation**: the rule was written to stop an engine treating a
> fabricated instant as a real one, and it did that by making the absence of an instant
> loud. The prohibition on fabrication is kept in full; the announcement is removed.
>
> Encoded in canon Part II §2.3A.1 and §2.3A.2, `M-8`, `M-13`, `X-INV-007`,
> `ALK-V2-DATA-CONTRACT.md` §1, `ALK-V2-ALGORITHM-CONTRACT.md` `A1`, `INV-H6` and
> `AD-TIME-001`. Seven reason codes are retired and `VALIDATION_TIMESTAMP_INVALID` is
> narrowed; see `ALK-V2-REASON-CODES.md` "Retired by owner decision 30".
>
> Everything below this box is the pre-decision analysis, preserved as the record of why the
> decision was needed.

- **Class:** `CANON_DEFECT`
- **Status:** **RESOLVED by owner decision 30.**
- **Canon:** `ALK-TESTING-EPISODE-001`; `SHARED-LEGACY-TIME-001`; Part II §3

Membership is decided entirely by elapsed time between measurements. A legacy or imported
measurement carrying a date but no time of day has no position inside a 30-minute window.
Whether such a measurement forms its own episode, joins the nearest, or is excluded from
episode construction is unstated.

**Failure scenario.** An import puts three date-only readings on one day. One engine makes
them one episode of three, another makes three observations, and `ALK-008`'s independence
count — and therefore whether a trend exists at all — differs. **Not decided here.**

---

## OI-EVENTNOINSTANT-001 — what a non-measurement event with no usable instant does is unstated

- **Class:** `CANON_DEFECT`
- **Status:** **OPEN.** Found while encoding owner decision 30 and deliberately left.
- **Canon:** `SHARED-LEGACY-TIME-001` Part II §2.3A / §2.3A.1; `M-5`; `M-13`

Owner decision 30 says what happens to a **measurement** that lacks a usable instant. It says
nothing about a dose change, a manual correction, a water change or a delivery anomaly that
lacks one — and `TimeProvenance` is declared on `Instant`, not on `Reading`, so the
vocabulary is available to every event kind.

**Failure scenario.** A V1 import carries a dose change with a date and no time. Under
decision 30's reading it is silently ineligible, so the engine sees no dose boundary at all
and fits one trend line across two dosing regimes — the exact confound `ALK-007` exists to
prevent. Under the opposite reading it is a hard confounder and every downstream inference
refuses. The two answers differ by a whole recommendation, and neither is stated.

**Why it is not decided here.** Decision 30's scope is measurements and their reporting. A
dose event with no usable time is a *confounding* question, not a reporting one:
`SEGMENT_CONFOUNDED_UNKNOWN_DOSE_TIME` and `CAPABILITY_DOSE_EFFECTIVE_TIME_UNCERTAIN` already
exist for a dose whose time is uncertain, and whether a dose whose time is *absent* is that
same state or a different one sets behaviour. That is the owner's.

**What the engine does meanwhile.** The decision-30 split in `ledger._readings` is scoped to
`READING` events and to nothing else. Every other kind is parsed exactly as it was before the
amendment: it needs a parseable offset-aware instant in its own time field, and without one
it sorts last and contributes nothing. That is the pre-existing behaviour, unchanged and not
endorsed.

---

## OI-FREEZEIDBEHAVIOUR-001 — behaviour changed repeatedly under one unchanged freeze identifier

- **Class:** `CANON_DEFECT` (process)
- **Status:** **OPEN.** Pre-existing pattern, reported again by review of the decisions 27–29
  encoding.
- **Canon:** `ALK_V2_FREEZE_5`; `MASTER RULE 4`; `CORE-CANON-COVERAGE-001`

Owner decisions 16 through 29 changed frozen alkalinity behaviour while the freeze
identifier stayed `ALK_V2_FREEZE_5`. Each decision is recorded, superseded wording is
preserved, and the supersession tables name what changed — but two artefacts that both say
"Freeze 5" can describe different behaviour, and a replay stamped `ALK_V2_FREEZE_5` does not
say which. Canon §47 and §64 make the engine/canon version part of deterministic replay.

Whether the identifier should have been reissued, and what it takes to reissue one, is
governance rather than chemistry. `CLAUDE.md` records the same discrepancy deliberately for
the handoff document's stale identifiers. **Not decided here**; the identifier is not
changed by this pass.

---

## OI-GATEVOCABULARY-001 — the freeze gate scans vocabulary and cannot check that a behaviour is absent

- **Class:** `CANON_DEFECT` (process)
- **Status:** **OPEN.** Opened by review of the decisions 27–29 encoding.
- **Artefact:** `tools/conformance/harness/package_checks.py` (the scanners moved here from the retired `validate-freeze-5.py` under `DEC-019`; the limit this item names moved with them and is not closed by the move)

The committed gate is a text scanner over canon and artefacts. It can check that a retired
word does not appear and that a required sentence does appear. It cannot check that an
engine does not branch on method, because there is no engine yet — the package is
specification only. The reviewer demonstrated that a plain-English reversion of owner
decision 27, written in wording the scanners do not match, passes the gate.

Sentence-level scanning, an absence check for every retired concept, exemptions restricted
to explicit supersession phrases, and a negative control for each scanner were added in this
pass and cut the demonstrated bypasses. **The structural limit is not closed**: a scanner
over prose certifies wording, not behaviour, and only executable conformance tests against a
built engine close it. **Not decided here**, and no claim in this package should be read as
saying the gate proves behaviour.

---

## OI-RETIREDCHAIN-001 — retirement rows from earlier decisions still name later-retired codes as live

- **Class:** `CANON_DEFECT` (documentation)
- **Status:** **OPEN.** Pre-existing; found while correcting the same defect inside decisions
  27–29.
- **Artefact:** `docs/implementation/alk-v2/ALK-V2-REASON-CODES.md`

A retirement row says which code replaced the retired one. Where that replacement was itself
retired by a later decision, the row still reads as an instruction to emit a retired code.
One instance inside decisions 27–29 was corrected in this pass:
`EVIDENCE_INDEPENDENT_SELECTION_TIE_UNRESOLVED` named `EPISODE_MEASUREMENTS_POOLED` and
`EPISODE_CONTESTED_METHODS`, both retired by decision 27, and now names
`EPISODE_MEASUREMENTS_COMBINED`.

At least one row from an earlier decision has the same shape:
`SAFETY_ACTUATOR_INCREMENT_REQUIRED_SAFETY_RATE_UNDEFINED` names
`SAFETY_TEMP_RATE_ADVISORY_EMITTED`, which owner decision 23 retired. The gate check added in
this pass is deliberately scoped to decisions 27–29 rows for that reason.

**Failure scenario.** An implementer following a retirement row emits a code the closed set
no longer contains, and `INV-I7` — which checks that retired codes are gone — fails against
their engine for a reason the specification told them to do. **Not decided or fixed here**;
correcting rows from decisions 16–26 is outside this pass.

---

## What section A8 changes

**Nothing.** Every item above is recorded, unfixed and undecided, exactly as the owner
instructed for this pass. None withholds an output: each names either an unstated state that
an implementer will meet (`OI-EPISODENOOBS-001`, `OI-EPISODEDATEONLY-001`), a comparison or
disjunct whose reading can change a safety action or a dose
(`OI-EPISODEMEDIANDECIMAL-001`, `OI-RAPIDCONFIRMDISJUNCT-001`), a product question
(`OI-EPISODEDISAGREE-001`), or a process limit (`OI-PII52EXPLICIT-001`,
`OI-FREEZEIDBEHAVIOUR-001`, `OI-GATEVOCABULARY-001`).

`OI-SIZINGFLAT-001` is **not** in this section and was **not** touched by this pass: the
owner ruled it an accepted edge case, and its statement and its reach stand as they were. One
stale traceability row that still described it as bounded by `AdvisoryCeiling` — wording
decision 21 introduced and decision 24 removed — was corrected to match canon, which
**widens** the recorded reach back to what canon states rather than narrowing it.
