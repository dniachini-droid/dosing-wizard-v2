# ALK V2 — ADVERSARIAL REVIEW

Three independent review passes over this package, each taking a different adversarial
stance. Findings are reported, not silently repaired; where a pass exposed a genuine canon
defect it was added to `ALK-V2-OPEN-ISSUES.md` rather than resolved by improvisation.

> **Read as of `ALK_V2_FREEZE_4`.** This document is the record of the review that produced
> the open-issue register. `ALK_V2_FREEZE_5` subsequently decided all eight of the owner
> judgements listed in §B/§C below, plus `OI-SUSPECT-001`, `OI-MADFLOOR-001`,
> `OI-RETEST-001`, `OI-WATERCHANGE-001` and `OI-SAFETYRATE-001`. The *findings* stand; the
> *interim behaviours* quoted throughout are superseded. See the closing section.

---

# Review A — Canon review

**Stance:** *Find any canon rule with no implementation owner, no fixture, or no
deterministic equation. Find rules this package quietly dropped.*

## A.1 Mechanical coverage — executed

| Check | Result |
|---|---|
| Stable rule IDs appearing anywhere in the canon | **62**, all inventoried |
| `ALK-nnn` section rules (`ALK-001` … `ALK-073`, incl. `003A`/`007A`/`011A`/`011B`/`048A`/`048B`/`069A`) | **80**, all inventoried |
| Capability items `M-1` … `M-13` | **13**, all inventoried |
| Canon invariants `X-INV-001` … `X-INV-010` | **10**, all inventoried |
| Governance scenarios `X-GOV-001` … `X-GOV-004` | **4**, all inventoried |
| Worked goldens `WG-ALK-001` … `WG-ALK-067` | **67**, all in the corpus |
| Named goldens `ALK-G001` … `ALK-G040` incl. `G004A`/`G039A`/`G039B` | **43**, all in the corpus |
| Rules with no named fixture | **0** |
| Rules with more than one owner | **0** |
| Duplicate rule IDs in the traceability inventory | **0** |
| Duplicate fixture IDs in the corpus | **0** |
| Reason codes emitted in fixtures but absent from the catalogue | **0** (after the enum-collision appendix) |

Total inventoried: **261 normative rules**, 160 fixtures, 60 invariants, 235 reason codes.

## A.2 Findings

**A-1 — Eight canon tokens share a reason-code prefix but are not reason codes.**
`SAFETY_RETURN`, `SAFETY_RETURN_CORRECTION`, `SAFETY_RETURN_CONFOUND`,
`UNCERTAINTY_LIMITED`, `CONSUMPTION_CONTEXT_CHANGE`, `CONSUMPTION_CONTEXT_EVENT`,
`DELIVERY_ANOMALY`, `CAPABILITY_GATED` are enum values and event kinds. A prefix-matching
checker reports them as uncatalogued codes. *Disposition:* documented in the reason-code
appendix; a checker must match by table position, not prefix. Not a canon defect.

**A-2 — Five rules initially had no fixture.** `PII-7.4`, `PII-9.4`, `PII-52`, `PII-53`,
`ALK-021`. All five are rules whose alkalinity behaviour is *absence* — a policy constant
the canon never supplies, or wording with no action. *Disposition:* `AD-RET-001` was added
to assert the reduced retest candidate set explicitly, and the other four were mapped to
existing fixtures. This is the class of rule most likely to be silently skipped by an
implementer, because "nothing happens" looks like "nothing to test".

**A-3 — Two rule families are numerically self-consistent but referentially incomplete.**
The retest scheduler (`PII-51`–`PII-57`) and the exposure gate (`PII-30`) are fully
specified as machinery and never parameterised for alkalinity. `OI-RETEST-001` and
`OI-EXPOSURE-001`.

**A-4 — One canon rule's illustrative examples contradict its own normative condition.**
`ALK-STABLE-001`. None of its three "stable" example series has a zero Theil–Sen slope at
the ordinary cadence: `8.50, 8.48, 8.52` over 0/2/4 days yields `+0.005 dKH/day`.
`OI-STABLE-001`.

**A-5 — One canonical golden is not independently checkable.** `WG-ALK-024` asserts
`potencyObservationEligible = true` conditional on `ALK-017`, without stating the per-side
sigmas that determine the SNR. At `ALK-017`'s minimum evidence its SNR is 2.80 —
`DIAGNOSTIC_ONLY`, not calibration-eligible. `OI-WG024-001`; `AD-POT-001` supplies a
determined variant.

**A-6 — Nothing was dropped.** Every V1 disposition in the canon's coverage ledger,
every `AUDIT-001` … `AUDIT-030` resolution, every `FZ-ALK-001` … `FZ-ALK-017` audit item
and every Freeze-1/2/3/4 closure item resolves to a rule in the inventory. The V1 wizard
card and state mappings are carried as a presentation projection table
(`ALK-V2-MODULE-DESIGN.md` §7), not as domain states.

---

# Review B — Breaker review

**Stance:** *Find input combinations, timing sequences and intervention orderings that
produce undefined or contradictory behaviour.*

## B.1 Executed probes

**B-1 — Response-class partition sweep.** `R_obs` swept over `[−5B, R_exp + 5B]` in
`B/200` steps for `R_exp/B ∈ {0.25, 0.5, 1, 1.5, 2, 3, 5, 10}`.
**Result: zero overlapping classifications** across all eight regimes. The five boxed
conditions plus `INCONCLUSIVE` form a genuine partition. The `PARTIAL` interval is empty
exactly when `R_exp − B ≤ B`, as the canon states.

**B-2 — Rounding / rail termination sweep.** `P ∈ {0.0002, 0.005, 0.02, 0.0693, 0.20}` ×
`increment ∈ {0.01, 0.1, 0.5, 1.0}` × `D_current ∈ {0, 0.3, 5, 9, 40, 200}`.
**Result: zero non-terminating step-toward-current loops; zero post-rounding rail
violations; zero negative commands.** `ALK-ROUNDING-001` step 7 always terminates because
each step strictly reduces `|D − D_current|` and `D = D_current` is trivially feasible.

**B-3 — Rapid override can never produce a zero supported slope.** On a two-point rapid
basis, `1.28·σ_S = 1.28·√(0.10² + 0.10²)/Δt = 0.18102/Δt`. `ALK-RAPID-001` requires
`Δt ≥ 1 day` and `|S| ≥ 0.30`, so `|S_supported| ≥ 0.30 − 0.18102 = 0.11898 dKH/day > 0`.
A confirmed rapid change therefore always yields an actionable supported slope — the two
rules cannot deadlock. With three or more clusters `σ_S` is smaller still. *Verified
property, not a defect.*

**B-4 — Liquid-volume guard reachability.** The guard binds only when
`P < ΔA / (20 · V_L)`. For a 0.50 dKH movement in a 77 L system that is
`P < 0.000325 dKH/mL`, about 213× weaker than the canon's reference solution. It is
reachable (`WG-ALK-067` constructs it) but only for extreme dilutions. Recorded so an
implementer does not conclude the guard is dead code and omit it.

**B-5 — MAD blindness to a lone outlier.** For five clusters with one aberrant reading,
the median absolute residual is exactly zero, so `sigma_resid = 0` and `sigma_point` falls
back to the 0.10 floor. A 0.50 dKH bad test — five times the analytical floor — raises the
controller's uncertainty by nothing. Both contributing rules are individually correct and
frozen; the canon's own defence is the suspicious-reading layer, which alkalinity never
parameterised. `OI-MADFLOOR-001` + `OI-SUSPECT-001`; fixture `AD-TRD-004`.

**B-6 — Independent-cluster selection changes the actuator command.** Clusters at
0.0 / 0.5 / 2.0 / 4.0 days give `sigma_S` of 0.035355, 0.040269 or 0.032129 depending on
which defensible traversal is used. Not a rounding difference — a different dose.
`OI-INDEPENDENCE-001`; fixture `AD-SEG-001`.

## B.2 Timing and intervention sequences probed

| Sequence | Result |
|---|---|
| dose change → second dose change before assessment | Determinate: `INTERRUPTED`, new snapshot, no collapse (`WG-ALK-021`) |
| dose change → safety breach during the response window | Determinate: `INTERRUPTED_BY_SAFETY_RETURN` (`WG-ALK-056`) |
| **active return plan → outer-bound breach** | **Undefined.** §5 forbids *starting* a plan during a safety return and is silent on one already running. `OI-RETURNDURINGSAFETY-001` |
| active return plan → supported non-zero slope | Determinate by composition of `ALK-070` final row + Part II §58 + §40 → HOLD. `OI-MAINTDURINGPLAN-001` |
| **active return plan → target-range edit** | **Undefined.** `AUDIT-030` says the destination *may* change; Part I §9.4 stores it on the plan event; a stored expiry would silently move. `OI-PLANTARGETEDIT-001` |
| measurement and dose change at the same instant, order unknown | Determinate: anchor not used, relation ambiguous (`AUDIT-028`) |
| known correction + unknown correction in one response window | Determinate: `CONFOUNDED` dominates; nothing invented (`WG-ALK-023`) |
| unknown-time external dose change straddling two readings | Determinate: whole window `CONFOUNDED`; new clean regime after `effectiveAtLatest` (`WG-ALK-017`) |
| water change ≥5% unknown inside a response window | Determinate: hard boundary + `CONFOUNDED` + potency ineligible (`WG-ALK-012`) |
| two mutually exclusive current dose states | Determinate: dosing state invalid, reconciliation requested, nothing guessed (Part II §70.5) |
| `S_observed = 0` with sufficient evidence **and** a hard confounder | Determinate: Part II §24 ordering puts `CONFOUNDED` above `SUFFICIENT`, so **not** `STABLE` |
| `D_current` unknown while a supported slope exists | Determinate: consumption and maintenance refuse; position and trend survive (Part II §70.1) |
| net volume unknown + one-off correction requested | Determinate: `P_theoretical` needs volume, so potency is unavailable and the mL value is withheld; the liquid guard is moot because no mL is emitted |
| high breach + interpretable consumption + missing increment | **Undefined.** The M-1 exemption names only the one-off *volume*, not the temporary *rate*. `OI-SAFETYRATE-001` |
| below range + supported rising + no plan | **Undefined.** `ALK-070` names only a prohibition. `OI-BELOWRISING-001` |
| above range + supported falling + no plan | **Undefined.** Mirror of the above. `OI-BELOWRISING-001` |
| negative consumption near zero + level above `OuterMax` | **Undefined boundary with a safety consequence:** decides whether dosing is paused to 0 mL/day. `OI-NEGCONS-001` |

## B.3 Assessment

Sixteen of the twenty sequences probed are fully determinate. The six that are not are all
recorded as open issues, and each has a fixture asserting the **refusal** rather than a
guessed value — so an implementation that quietly picks a default fails the corpus.

---

# Review C — Implementer review

**Stance:** *I receive this package tomorrow and the stack has just been chosen. Where
would I still have to make a judgement call?*

## C.1 Judgement calls that would have remained, and are now closed

Each of these was a real gap in the package on first pass. All are now determined, either
by the canon's own composition or by an explicitly recorded pinned convention.

| Would have been a judgement call | Closed by |
|---|---|
| Even-count median — low, high or interpolated? | `OI-MEDIAN-001`; `AD-TRD-002` makes the choice numerically load-bearing |
| Is `UNCERTAINTY_LIMITED` an evidence state or a separate flag? | `OI-EVIDENCEVOCAB-001`; closed vocabulary in the data contract |
| Does the 50%-cap forecast compare against the scheduler's next test or the cadence? | `OI-FORECASTHORIZON-001`; fixed 48 h, from `WG-ALK-043` |
| `DEFERRED_BY_SAFETY_RETURN` or `DEFERRED_BY_SAFETY_RAIL`? | `OI-DEFERREASON-001`; emit both, identical action |
| Does consumption have its own lookback? | `OI-CONSUMPTIONLOOKBACK-001`; one segment, one lookback |
| Can the empirical bracket change the dose? | `OI-BRACKETEFFECT-001`; advisory only, no write path |
| Should change-point detection be automatic? | `OI-CHANGEPOINT-001`; explicit events only |
| Position from the last raw reading or the cluster median? | `OI-POSITIONCLUSTER-001`; cluster representative |
| Is the Day-0 anchor a post-change observation? | `OI-ANCHOR-001`; never — earliest post-change sufficiency is Day +6 |
| Inclusive or exclusive at every threshold? | `OI-BOUNDARIES-001`; thirteen boundaries tabulated |
| Maintenance during an active plan? | `OI-MAINTDURINGPLAN-001`; HOLD, by composition |
| **How are `assessmentId` and `auditTraceId` generated without breaking byte-identical replay?** | `OI-DETERMINISM-001`; derived from content, so replay is stable *and* a backdated edit yields a new id |
| **What numeric model makes "byte-identical" achievable?** | `OI-DETERMINISM-001`; IEEE 754 binary64, fixed summation order, no FMA in the chemistry path |
| Where does the liquid guard sit relative to rounding? | Post-rounding hard-constraint recheck, derived from `ALK-ROUNDING-001` step 6 |
| What overshoot horizon applies? | Derived from the intervention phase plus the 14-day attribution horizon; flagged as derived |

The last two are derivations rather than statements, and both carry a reason code
(`SAFETY_LIQUID_GUARD_SCOPE_UNDEFINED`, `RESPONSE_OVERSHOOT_HORIZON_DERIVED`) so the
derivation is visible in the audit trace rather than buried in code.

## C.2 Chemistry and safety judgement calls that remain

**This is the honest bottom line of the exercise.** Eight decisions cannot be closed by
reading the canon more carefully, because the canon does not contain them. Each is
recorded with a concrete failure scenario, a stated interim refusal, and a proposal marked
explicitly as *not authority*.

| Remaining judgement | Why it is the owner's | Interim behaviour |
|---|---|---|
| `OI-INDEPENDENCE-001` — which cluster is dropped under 24 h spacing | Changes `sigma_S` and therefore the actuator command | `INSUFFICIENT` + refusal |
| `OI-NEGCONS-001` — the slight/material negative-consumption boundary | Decides whether the engine recommends **pausing alkalinity dosing** | HOLD (identical on both branches); the zero-dose fail-safe is gated |
| `OI-RETURNOFFER-001` — what "stable" means for a return-plan offer | Under one reading a below-range tank is never offered a plan at all | Offer `NOT_RUN`; maintenance unaffected |
| `OI-BELOWRISING-001` — the two withheld matrix cells | Decides whether maintenance opposes a trajectory carrying the level toward the target | HOLD |
| `OI-LIQUIDGUARD-001` — does the 2%/24 h guard bind ordinary maintenance? | Rule body and its own fixture disagree | Withhold the command |
| `OI-CONFIDENCE-001` — how `LOW`/`MODERATE`/`HIGH` is derived | A wording decision, but still the owner's | `UNSPECIFIED` + underlying facts surfaced |
| `OI-RAPIDBASIS-001` — which slope is tested against 0.30 dKH/day | Gates a 24 h retest and the 50%-cap pathway | Latest independent pair, flagged |
| `OI-RETURNDURINGSAFETY-001` — an in-flight plan meeting a breach | Requires a new phase value the canon does not define | Suspend, `STOP_PENDING_USER_ACTION` |

**Every one of these is a chemistry or safety judgement, and by the brief's own standard
each remaining one is a shortfall of the canon rather than of this preparation.** They are
surfaced rather than papered over, and the interim behaviour in each case is a refusal or a
hold that cannot move a real tank in a direction the owner has not chosen.

## C.3 What I would still need that is not a chemistry decision

- **The stack.** Language, persistence, UI framework — explicitly out of scope
  (`DECISIONS.md` records no selection; `ROADMAP.md` Phase 1 is unstarted).
- **A test runner and a property-test library.** The invariants specify generators and
  assertions but no harness.
- **Setup UI for the required capture fields** — `actuatorIncrementMlPerDay`, precise
  `measuredAt`, dose-event `effectiveAt` and its confidence, solution and delivery context
  ids. `ALK-V2-DATA-CONTRACT.md` gives the shapes; the capture flow is product design.
- **A canonical serialization** for the `ledgerDigest` used by `OI-DETERMINISM-001`.

None of these is a chemistry judgement, and none blocks starting.

## C.4 Would I be able to start tomorrow?

Yes, at build-sequence step 1. Steps 1 through 8 of
`ALK-V2-IMPLEMENTATION-CONTRACT.md` §8 — time, validation, clustering, ledger,
configuration, segmentation, trend, uncertainty, support, evidence, consumption,
capability — are fully determined apart from `OI-INDEPENDENCE-001`, which is
reached at step 2 and has an explicit refusal path. Steps 9 through 16 are likewise
determined apart from the eight items above, each of which has an explicit refusal path.

The package's own conformance gate item 8 makes this operational: **an unclosed open issue
is implemented as a refusal, not as a guess**, and `INV-I6` fails any implementation that
substitutes a default.

---

# Summary of what the three passes changed

| Pass | New findings added to `ALK-V2-OPEN-ISSUES.md` |
|---|---|
| A — Canon | `AD-RET-001` fixture added so `PII-52`/`PII-53` are asserted; reason-code enum-collision appendix added; fixture-less rule count driven to zero |
| B — Breaker | `OI-PLANTARGETEDIT-001`; `OI-RETURNDURINGSAFETY-001` confirmed by an independent route; B-3 verified as a non-defect |
| C — Implementer | `OI-DETERMINISM-001`; `OI-MAINTDURINGPLAN-001` |

Open issues grew from 33 to **40** during review. That is the intended direction: a review
that found nothing would have meant the review was not adversarial.

---

# Disposition at `ALK_V2_FREEZE_5`

Every judgement this review surfaced as the owner's has been decided. The interim
behaviours quoted above are **superseded** and must not be implemented.

| Review finding | Owner's decision | Encoded as |
|---|---|---|
| `OI-INDEPENDENCE-001` | forward-greedy from the earliest eligible cluster | `ALK-INDEPENDENT-SELECTION-001` |
| `OI-NEGCONS-001` | `C_estimate + 1.28·sigma_S < 0`; no `sigma_P`, no `sigma_D` | `ALK-NEGATIVE-MATERIALITY-001` |
| `OI-RETURNOFFER-001` | a separate, weaker eligibility predicate; `STABLE` unchanged | `ALK-RETURN-ELIGIBLE-TRAJECTORY-001` |
| `OI-BELOWRISING-001` | HOLD — maintenance does not oppose a supported trajectory toward range | `ALK-TOWARD-RANGE-HOLD-001` |
| `OI-LIQUIDGUARD-001` | yes, it binds maintenance; exceeding withholds the command; rechecked after rounding | `ALK-LIQUID-VOLUME-GUARD-001` (amended) |
| `OI-CONFIDENCE-001` | `UNSPECIFIED`; surface the evidence facts instead | `ALK-CONFIDENCE-OUTPUT-001` (amended) |
| `OI-RAPIDBASIS-001` | latest independent pair; sizing stays Theil–Sen | `ALK-RAPID-BASIS-001` |
| `OI-RETURNDURINGSAFETY-001` | **terminate**, not suspend; `SUSPENDED_PENDING_SAFETY` rejected | `ALK-RETURN-TERMINATED-BY-SAFETY-001` |

Two of the review's proposals were **not** adopted, which is the point of marking a
proposal as not authority:

- `OI-RETURNDURINGSAFETY-001` proposed suspension with a new `SUSPENDED_PENDING_SAFETY`
  phase. The owner chose termination with no automatic resume.
- `OI-CONFIDENCE-001` proposed a descriptive deterministic mapping to `LOW`/`MODERATE`/
  `HIGH`. The owner declined to classify at all in Freeze 5.

Review C.4's answer is now stronger than it was: build-sequence steps 1 through 16 are
fully determined, and `OI-INDEPENDENCE-001` no longer sits at step 2 with a refusal path.
