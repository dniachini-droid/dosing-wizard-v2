# ALK V2 — TEST MATRIX

Index and coverage analysis for the fixture corpus in `fixtures/`.

**196 fixtures across 6 files, plus 74 invariants in `ALK-V2-INVARIANTS.md`.**

`ALK_V2_FREEZE_5` added 17 fixtures and 4 invariants, and rewrote the expectations of the
15 fixtures that previously asserted a refusal for an issue the freeze decided. Three of
those fixtures and two of those invariants were added by the freeze's own independent
review, which found defects the first gate could not see.

Owner decisions 16–19 added 7 more fixtures (178 → 185) and 3 invariants (66 → 69). Owner
decisions 20–22 added 7 more (185 → 193) and 3 more (69 → 72). Owner decisions 23–26 added
3 more (193 → 196) and 2 more (72 → 74), and **rewrote** five existing fixtures whose
expectations those decisions superseded.

> The counts in this document were stale: they still read 178 and 66 after decisions 16–19
> added to both. They are regenerated from `fixtures/index.json` and
> `ALK-V2-INVARIANTS.md` here, and the conformance harness independently checks the fixture
> total against the bodies and the invariant total against the coverage table, so the
> staleness could not have reached the gate. (Those checks were `validate-freeze-5.py`'s
> when this was written; the validator is retired under `DEC-019` and the harness runs
> them now.)

---

## 1. Corpus layout

| File | Fixtures | Contents |
|---|---|---|
| `canon-worked-goldens-round1.json` | 20 | `WG-ALK-001` … `WG-ALK-020` — the canon's Round-1 worked numerical suite |
| `canon-worked-goldens-round2.json` | 20 | `WG-ALK-021` … `WG-ALK-040` — interruption, corrections, potency, edits, expiry, mirrors |
| `canon-worked-goldens-external.json` | 27 | `WG-ALK-041` … `WG-ALK-067` — external-review corrections, safety path, capability contract |
| `canon-named-goldens.json` | 43 | `ALK-G001` … `ALK-G040` including `G004A`, `G039A`, `G039B` |
| `adversarial.json` | 69 | `AD-*` — scenarios the brief requires that the canon states qualitatively or not at all, plus the `ALK_V2_FREEZE_5` positive and negative controls |
| `invariants-and-governance.json` | 17 | `INV-*` coverage fixtures, `X-MIG-001`, `X-GOV-001` … `X-GOV-004` |
| `index.json` | — | Generated index; ids, counts, provenance split, open-issue coverage |
| `config-defaults.json` | — | The canon's default worked-suite configuration plus once-derived constants |
| `_schema.json` | — | Fixture shape, tolerances, acceptance rule, time convention |

## 2. Provenance split

Every expectation is traceable to the canon. **No expectation is derived from V1 runtime
behaviour** (`DEC-013`, canon §52).

| Class | Count | Meaning |
|---|---|---|
| `CANON_VERBATIM` | 102 | Every asserted number or state appears in the canon |
| `CANON_DERIVED` | 65 | Numbers computed here by applying frozen canonical formulas to stated or constructed inputs |
| `CANON_QUALITATIVE` | 29 | The canon states states and prohibitions but no arithmetic |

The derived fixtures were produced by evaluating Theil–Sen, `ALK-SLOPE-UNCERTAINTY-001`,
`ALK-SUPPORTED-SLOPE-001`, `ALK-STEP-CAP-001`, `ALK-046`, `ALK-ROUNDING-001` and
`ALK-RESPONSE-CLASSIFIER-001` exactly as frozen. The same evaluation reproduces
`WG-ALK-001`, `-002`, `-003`, `-004`, `-005`, `-006`, `-007`, `-008`, `-009`, `-033`,
`-062` and `-063` to the canon's stated digits, which is the check that the derived
numbers are canon-faithful rather than merely plausible.

## 3. Required-scenario coverage

Every scenario named in the preparation brief, and where it lives.

| Required scenario | Fixture(s) |
|---|---|
| clean steady decline | `WG-ALK-001`, `ALK-G003` |
| clean flat Alk | `AD-TRD-001` |
| clean rise | `WG-ALK-033`, `ALK-G009` |
| noisy apparent decline that uncertainty reduces to zero | `AD-TRD-002` |
| noisy apparent rise that uncertainty reduces to zero | `AD-TRD-003` |
| perfect-line readings where the 0.10 dKH noise floor still applies | `WG-ALK-001`, `WG-ALK-062`, `AD-TRD-001` |
| single outlier | `AD-TRD-004` |
| multiple outliers | `AD-TRD-005` |
| irregular test intervals | `AD-TRD-006` |
| same-day tests | `AD-SEG-001` |
| insufficient elapsed time | `AD-SEG-002` |
| insufficient clusters | `WG-ALK-049`, `ALK-G001`, `ALK-G002` |
| dose change mid-window | `WG-ALK-016`, `AD-SEG-003` |
| manual correction mid-window | `WG-ALK-022`, `ALK-G019`, `ALK-G020` |
| water change mid-window | `WG-ALK-011`, `WG-ALK-012`, `ALK-G021`–`G023` |
| delivery failure | `AD-DEL-001`, `WG-ALK-047` |
| contaminated evidence | `WG-ALK-023`, `AD-POT-002` |
| missing dose context | `AD-CON-001` |
| date-only historical evidence | `AD-TIME-001`, `WG-ALK-066` |
| supported slope rounds to zero | `WG-ALK-002`, `AD-MNT-001` |
| maintenance dose correctly matches consumption | `AD-MNT-005`, `AD-TRD-001` |
| maintenance dose below supported consumption | `WG-ALK-001`, `AD-MNT-003` |
| maintenance dose above supported consumption | `WG-ALK-033` |
| materially negative consumption | `WG-ALK-013`, `ALK-G027` |
| unexplained high/rising Alk | `ALK-G028`, `WG-ALK-051` |
| preferred-band excursion without outer-bound risk | `AD-MNT-003`, `WG-ALK-042` |
| rapid confirmed movement with outer-bound risk | `WG-ALK-006`, `WG-ALK-043` |
| ordinary 25% cap | `AD-MNT-002` |
| exceptional 50% cap | `WG-ALK-006`, `WG-ALK-043` |
| 0.5 dKH/day rail binding | `WG-ALK-063`, `AD-MNT-004` |
| gross-liquid rail binding | `AD-SAF-003`, `WG-ALK-067` |
| Day-2 response too early for formal assessment | `ALK-G010` |
| Day-4 response matches predicted trajectory | `AD-RSP-001`, `WG-ALK-007`, `ALK-G011` |
| successful response, still falling but substantially flatter | `AD-RSP-003`, `WG-ALK-009` |
| post-change overshoot | `AD-RSP-002`, `ALK-G016` |
| post-change under-response | `WG-ALK-009` (PARTIAL), `ALK-G012` |
| potency-learning eligible window | `AD-POT-001`, `WG-ALK-024` |
| potency-learning contaminated window | `AD-POT-002`, `WG-ALK-022`, `WG-ALK-057`, `WG-ALK-064` |
| potency uncertainty | `WG-ALK-025`, `WG-ALK-027`, `WG-ALK-050` |
| return plan active | `WG-ALK-014`, `AD-RTN-002`, `ALK-G029` |
| return plan interrupted | `AD-RTN-001`, `WG-ALK-032` |
| return plan terminated by a safety return | `AD-RTN-004`, `AD-RTN-005` |
| safety fail-safe | `WG-ALK-051`, `AD-SAF-002`, `AD-SAF-005` |
| independent-cluster selection | `AD-SEG-001`, `AD-SEG-005` |
| suspicious-reading sources | `AD-VAL-001`, `ALK-G024`, `ALK-G025` |
| negative-consumption materiality boundary | `AD-CON-002`, `WG-ALK-013`, `ALK-G026` |
| toward-range hold | `AD-MNT-006`, `AD-MNT-007`, `AD-MNT-008` |
| water-change normalization confidence | `WG-ALK-011`, `AD-SEG-006` |
| liquid guard on maintenance | `AD-SAF-004`, `WG-ALK-067` |
| retest scheduler candidates and clamps | `AD-RET-001`–`004` |
| recommendation confidence | `AD-OUT-001` |
| Mg capability UNKNOWN | `AD-SAF-001`, `X-MIG-001` |
| Ca/Mg measurement-only capability gates | `AD-CAP-001`, `X-MIG-001` |

**All 45 required scenarios are covered, plus 11 added by `ALK_V2_FREEZE_5`.**

## 4. Coverage by rule owner

Derived from `rulesExercised` across the corpus and the `Fixtures` column of
`ALK-V2-RULE-TRACEABILITY.md`. Every one of the 271 inventoried rules names at least one
fixture — the condition `CORE-CANON-COVERAGE-001` imposes on the canon's own manifest,
applied here to this package.

| Owner | Rules | Representative fixtures |
|---|---|---|
| `VALIDATION` | 22 | `VAL-*`, `AD-POS-001`, `AD-TIME-001`, `WG-ALK-066`, `AD-VAL-001` |
| `SEGMENTATION` | 35 | `AD-SEG-001`–`004`, `WG-ALK-011`, `WG-ALK-012`, `WG-ALK-047`, `AD-SEG-005`, `AD-SEG-006` |
| `TREND` | 19 | `WG-ALK-001`, `AD-TRD-001`–`006`, `AD-RAP-001` |
| `UNCERTAINTY` | 11 | `WG-ALK-062` (mandatory), `AD-TRD-004`, `AD-TRD-005` |
| `SUPPORT` | 2 | `WG-ALK-001`, `WG-ALK-002`, `WG-ALK-062` |
| `CONSUMPTION` | 7 | `WG-ALK-013`, `AD-CON-001`, `AD-MNT-005`, `AD-CON-002` |
| `POTENCY` | 18 | `WG-ALK-024`–`027`, `WG-ALK-050`, `AD-POT-001`, `AD-POT-002` |
| `RESPONSE` | 27 | `WG-ALK-007`–`010`, `WG-ALK-021`, `AD-RSP-001`–`003` |
| `MAINTENANCE` | 27 | `WG-ALK-001`, `AD-MNT-001`–`007`, `AD-MNT-008` |
| `RETURN` | 12 | `WG-ALK-014`, `WG-ALK-015`, `WG-ALK-031`, `WG-ALK-035`, `AD-RTN-001`, `AD-RTN-002`, `AD-RTN-003`–`005` |
| `SAFETY` | 14 | `WG-ALK-041`, `WG-ALK-051`–`061`, `AD-SAF-001`–`003`, `AD-SAF-004`, `AD-SAF-005` |
| `RETEST` | 14 | `WG-ALK-060`, `AD-RET-001`, `AD-RET-002`–`004` |
| `CAPABILITY` | 20 | `WG-ALK-045`–`048`, `WG-ALK-054`, `WG-ALK-065`, `WG-ALK-066`, `AD-CAP-001` |
| `OUTPUT` | 20 | `INV-*`, `X-GOV-*`, `AD-OUT-001` |
| `AUDIT` | 12 | `ALK-G040`, `INV-REPLAY-001`, `WG-ALK-029`, `WG-ALK-030` |
| `PRESENTATION` | 11 | `INV-SURFACE-WORDING-001`, `ALK-G039A`, `ALK-G039B` |

## 5. Freeze-5 decision coverage

Every `ALK_V2_FREEZE_5` owner decision is pinned by at least one fixture asserting the
decided behaviour **and** at least one `forbidden` block naming the alternative the owner
rejected. `INV-I8` is the mechanical check that this holds.

| Decision | Positive control | Negative control |
|---|---|---|
| F5-01 independent-cluster selection | `AD-SEG-001` | `AD-SEG-005` (appended vs backdated-earlier), `AD-SEG-007` (identical timestamps ⇒ refusal); backward-greedy and keep-all asserted forbidden |
| F5-02 suspicious-reading basis | `AD-VAL-001`, `ALK-G024`, `ALK-G025` | `AD-VAL-001` statistically-unusual-only case; `AD-TRD-004` forbids a compensating term |
| F5-03 negative-consumption materiality | `WG-ALK-013`, `ALK-G026`, `WG-ALK-051` | `AD-CON-002` straddle: each variant forbids the other's classification **and** the other's high-breach action |
| F5-04 return-plan eligibility | `WG-ALK-014`, `WG-ALK-028`, `ALK-G006` | `AD-RTN-003`; `AD-MNT-008` |
| F5-05 toward-range hold | `AD-MNT-006`, `AD-MNT-007` | `AD-MNT-008`; the strict-stabilise-first doses 7.5 / 10.5 asserted forbidden |
| F5-06 liquid-volume guard | `AD-SAF-003`, `AD-SAF-004`, `WG-ALK-067` | `AD-SAF-004` (guard off the recommendation-precision grid, so a pre-rounding-only check genuinely fails it), `AD-SAF-006` (continuous candidate already over ⇒ withheld) |
| F5-07 rapid basis | `AD-RAP-001` | same fixture: both wrong readings forbidden |
| F5-08 return plan under safety | `AD-RTN-004` | `AD-RTN-005`; `SUSPENDED_PENDING_SAFETY` asserted forbidden |
| F5-09 retest scheduler | `AD-RET-001`, `AD-RET-003` | `AD-RET-002`, `AD-RET-004`, `AD-RET-005` (breached ⇒ the forecast candidate stands down) |
| F5-10 water-change confidence tier | `WG-ALK-011`, `ALK-G022` | `AD-SEG-006` — same arithmetic, lower tier, opposite outcome |
| F5-11 temporary safety rate | `AD-SAF-002` | `AD-SAF-005` three capability cases |
| F5-12 recommendation confidence | `AD-OUT-001` | same fixture: the three-valued label and any arithmetic path forbidden |
| F5-13 no pause on an uncertainty-limited negative | `AD-CON-002` variant 1.6, `WG-ALK-051` | `AD-CON-002` variant 1.5 — superseded for sizing by owner decision 16; both variants now receive the same delivered rate |
| F5-14 same-timestamp coalescing | `AD-SEG-007` | `AD-SEG-008` (a 0.30 dKH pool stays `ANOMALOUS`); both forbid order-dependent selection |
| F5-15 ordinary signal floor | `AD-RET-001` | `AD-RET-004` (the floor must not reach an outer-bound candidate) |
| **16** high-breach safety sizing | `AD-SAF-007` (`A_now` sweep, rail saturation, zero floor, materiality straddle), `WG-ALK-051` | `AD-SAF-008` (continuity across the materiality boundary), `AD-CON-002` (identical delivered rate on both sides) |
| **17** canonical testing episode | `AD-EPI-001`, `AD-SEG-007` | `AD-EPI-002` (three-minute offset, reversed insertion order), `AD-SEG-008` |
| **18** repeat-spread domain and exact decimals | `AD-VAL-002` | `AD-VAL-002` straddling pairs; `AD-EPI-002` |
| **19** one episode output per consumer | `AD-EPI-003`, `AD-EPI-004` | `AD-EPI-003` (both ordering answers and the older episode forbidden), `AD-EPI-004` (both member slopes and the older-pair fallback forbidden) |
| **27** the application does not know the test method | `AD-EPI-002` (formerly contested, now ordinary), `AD-VAL-002` `NO_QUALIFIER` | `AD-EPI-002`, `AD-EPI-003`, `AD-EPI-004` and `AD-VAL-002` all forbid the retired contested state and the retired reason codes |
| **28** repeats inside 30 minutes, count stated | `AD-EPI-005` (5 min, count 2), `AD-EPI-001` (3 within 30 min, count 3) | `AD-EPI-006` (45 min ⇒ two observations), `AD-EPI-007` (29 / 30 / 31 minutes) |
| **29** the advisory warning field has two states | `AD-ESC-001`, `AD-ESC-002` (`NONE` below, `ATTACHED` at and beyond) | `AD-ESC-003` — its three formerly contested cases now resolve into ordinary episodes and carry `ATTACHED`, because each combined observation is beyond the ceiling; the one case that carries `NONE` is `NO_VALID_READING`, where every measurement is `INVALID` so nothing resolves and there is nothing to warn about. `NOT_RUN` appears nowhere. Closes `OI-ADVISORYWARNSTATE-001` |
| **20** `D_current` / `D_history` split | `AD-DHS-001` (mixed-dose interval, both directions), `AD-DHS-003` (`D_history` unavailable, sizing still runs) | `AD-DHS-002` (`D_current` unknown ⇒ refusal; `0` and the `D_history` substitution both forbidden); `AD-DHS-001` `forbidden.cases` state exactly what a reverted engine produces, and the error reverses sign between the two cases |
| **21** advisory ceiling and floor | `AD-ESC-001` (ceiling: below / at / above, at two configured bound pairs), `AD-ESC-002` (floor, mirrored) | `AD-ESC-001` and `AD-ESC-002` forbid both the reverted sized rate and a `0` in place of the withheld one; `AD-ESC-003` forbids declaring any case contested at all — owner decision 27 retired that state — and carries a straddling case so all-beyond cannot be read as any-beyond |
| **22** uncomputable consumption, branch B′ | `AD-SAF-009` (first-ever test, `D_current` known), `AD-DHS-003` | `AD-SAF-009` forbids falling through with no branch, forbids routing to branch A (which would deliver `0`), and forbids refusing as though `D_current` were unknown; `INV-G12` asserts exactly one branch |
| **23** recommend-only; there is no actuator | `AD-REC-001` (one output where the canon emitted two), `AD-SAF-002`, `WG-ALK-045` (a formerly withheld state now recommends), `WG-ALK-061` | `AD-REC-002` (withholding has no physical effect — every "the pump keeps running" phrase forbidden); `AD-SAF-005` (the split must not reappear; no 0.1 default invented; the potency refusal survives because it is not a device capability) |
| **24** the boundary warns, it does not refuse | `AD-ESC-001` (ceiling: below / at / above, three bound pairs, a decimal straddle), `AD-ESC-002` (floor, mirrored) | both forbid the reverted withholding, a zero, and a changed rate at the boundary; `AD-ESC-003` forbids reinstating the member-wise predicate and carries the `WITH_INVALID_MEMBER` case in its place: under owner decision 27 there is no contested episode for a member-wise predicate to run over, so what the fixture exercises is an ordinary episode with one excluded member |
| **25** branch A refuses on an unknown `D_current` | `AD-SAF-010` `BRANCH_A_D_CURRENT_KNOWN` (the ordinary branch-A recommendation, 1.443001443 → 1.4) | `AD-SAF-010` `BRANCH_A_D_CURRENT_UNKNOWN` forbids exactly that 1.4, forbids `0`, and forbids selecting branch A at all; `INV-G15` forbids a state producing both a number and a refusal |
| **26** one retest answer | `AD-ESC-001`, `AD-ESC-002`, `AD-ESC-003`, each asserting `warningRetestIntervalHours == schedulerRetestIntervalHours` | the same fixtures forbid the warning stating an interval the scheduler did not produce |

## 5A. Still-open-issue coverage

Nine of the 27 remaining open issues are exercised by a fixture that asserts the **refusal**
rather than a guessed value. The three Freeze-5 review opened are closed by F5-13/14/15 and
now assert a determined outcome instead. These are the tests that fail if an implementer
silently picks a default.

| Open issue | Fixture(s) asserting the refusal |
|---|---|
| `OI-DAY4-001` | `ALK-G011`, `AD-SEG-003` |
| `OI-WG024-001` | `WG-ALK-024`, `AD-POT-001`, `ALK-G033` |
| `OI-ANOMCLUSTER-001` | `AD-SEG-004` |
| `OI-OVERSHOOT-001` | `ALK-G016` |
| `OI-FORECASTHORIZON-001` | `WG-ALK-042`, `WG-ALK-043` |
| `OI-DEFERREASON-001` | `WG-ALK-052` |
| `OI-ANCHOR-001` | `AD-SEG-003` |
| `OI-STABLE-001` | `AD-TRD-001`, `AD-RTN-003` |
| `OI-PIPELINE-001` | `WG-ALK-052`, `AD-SAF-004` |
| `OI-HIGHBREACHBAND-001` | `AD-CON-002` |
| `OI-CLUSTERTIE-001` | `AD-SEG-007` |
| `OI-RETESTFLOOR-001` | `AD-RET-001` |
| `OI-SIZINGFLAT-001` **(OPEN, and NO LONGER NARROWED)** | `AD-ESC-001` |
| `OI-CZERODISCONT-001` **(OPEN)** | — no fixture; the exposure is a discontinuity between two branch formulas, both of which are pinned on their own sides by `AD-SAF-007` and the `ALK-003A` interpretable-branch goldens |

All three of the Freeze-5-review items were closed by amendments F5-13, F5-14 and F5-15; the rows are kept so the fixture that pins each decision is findable from its issue id.

The last two rows are the items still **deliberately left open**. `OI-SIZINGFLAT-001`'s
fixture no longer asserts a bound on the exposure, because owner decision 24 removed the
bound: `AD-ESC-001` shows the recommended rate identical at 11.9, 12.0 and 12.1 dKH, which
is decision 24's point **and** is the flat response the item is about. Its `openIssues` entry
says so — open, and no longer narrowed.

The remaining open issues (`OI-EXPOSURE-001`, `OI-NORMUNCERT-001`, `OI-POTENCYSTATE-001`,
`OI-POTENCYSNAP-001`, `OI-PLANTARGETEDIT-001`, and the pinned conventions) are covered by
invariants rather than goldens, because they concern absent behaviour, structural
properties or states that are unreachable in the Alk-only runtime.

## 6. Boundary-straddling pairs

The canon's own review found that three evenly spaced readings made two different
uncertainty formulae coincide numerically, hiding a real divergence through two review
cycles (Shared Freeze 1, "Future parameter rule"). Wherever a threshold matters, the corpus
therefore carries a **pair** that straddles it.

| Boundary | Below / at | Above |
|---|---|---|
| response band `B` at Day +4 | `WG-ALK-007` (`R_obs` 0.100 < `B` 0.101193 → `INCONCLUSIVE`) | `AD-RSP-001` (`R_obs` 0.104 > `B` → `EXPECTED`) |
| evidence precision over time | `WG-ALK-007` (2 post points) | `WG-ALK-008` (3 post points, same central response → `EXPECTED`) |
| unknown water-change materiality | `WG-ALK-012` 4% (0.08 dKH, retain) | `WG-ALK-012` 5% (0.10 dKH, hard boundary) |
| outer-bound forecast horizon | `WG-ALK-042` (2.571 d > 2.0 → locked) | `WG-ALK-043` (1.8 d ≤ 2.0 → unlocked) |
| recommendation rounding at half an increment | `AD-MNT-001` (0.0451 mL/day → HOLD) | `AD-MNT-003` (0.0685 mL/day → act) |
| rounding tie direction | `WG-ALK-005` increase (10.25 → 10.2) | `WG-ALK-005` decrease (7.75 → 7.8) |
| rail after rounding | `WG-ALK-063` (16.4 → 0.5032, rejected) | `WG-ALK-063` (16.3 → 0.4964, accepted) |
| `sigma_point` floor vs residual scatter | `AD-TRD-002` (`sigma_resid` 0.068 → floor governs) | `AD-TRD-005` (`sigma_resid` 0.208 → residual governs) |
| uncertainty formula family | `WG-ALK-062` (`Sxx` form, 0.015811) | forbidden endpoint form (0.017678) |
| position at a range edge | `AD-POS-001` (8.19 below) | `AD-POS-001` (8.20 in range) |
| position at an outer bound | `AD-POS-001` (7.00 not breached) | `AD-POS-001` (6.999 breached) |
| step-cap meaningfulness | `WG-ALK-004` (`D=0 < 4R`, cap inactive) | `AD-MNT-002` (`D=9.0 ≥ 4R`, 25% binds) |
| potency SNR class | `WG-ALK-024` at minimum evidence (2.80 → diagnostic) | `AD-POT-001` (6.26 → calibration-eligible) |
| potency plausibility envelope | `WG-ALK-027` (1.587× → inside, hold) | `WG-ALK-050` (2.02× → outside, `PLAUSIBILITY_HOLD`) |
| safety-return completion | `WG-ALK-053` (7.05 → recovering) | `WG-ALK-053` (7.21 → complete) |
| negative-consumption materiality | `AD-CON-002` `D = 1.6` (`C + 1.28σ_S` = +0.006135 → uncertainty-limited) | `AD-CON-002` `D = 1.5` (−0.000795 → materially negative) |
| independence spacing at 24 h | `AD-SEG-001` (12 h → not accepted) | `WG-ALK-003` (48 h → accepted) |
| `T_signal` under vs over the routine cadence | `AD-RET-001` (22.913 h, selected unclamped) | `AD-RET-003` (80.685 h, loses to the 40 h boundary candidate) |
| `T_signal` against the observation ceiling | `AD-RET-002` (162.765 h → clamped to 96 h) | `AD-RET-001` (22.913 h, no floor applied) |
| forecast candidate, inside vs outside the bound | `AD-RET-003` (7.20 dKH, projected crossing ⇒ 40 h) | `AD-RET-005` (6.85 dKH, breached ⇒ candidate not submitted) |
| liquid guard on vs off the recommendation-precision grid | `AD-SAF-006` (guard 2000 = 40×50; caught pre-rounding) | `AD-SAF-004` (guard 1980; only the post-rounding recheck catches it) |
| negative consumption, high-breach action | `AD-CON-002` `D = 1.5` (material ⇒ 0 mL/day pause) | `AD-CON-002` `D = 1.6` (non-material ⇒ pause `NOT_RUN`) |
| forecast boundary safety lead | `AD-RET-003` (`T_boundary` +1.667 d → 40 h) | `AD-RET-004` (`T_boundary` −0.333 d → test now) |
| supported vs uncertainty-limited toward range | `AD-MNT-008` (`S_supported = 0` → not this rule) | `AD-MNT-006` (`S_supported = 0.104745` → toward-range hold) |
| water-change confidence tier | `AD-SEG-006` (`MANUFACTURER_NOMINAL` → boundary) | `WG-ALK-011` (`MEASURED_SAME_BATCH` → normalize) |
| liquid guard across recommendation rounding | `AD-SAF-004` (1978 compliant → rounds to 2000 → recheck → 1950 issued) | `AD-SAF-006` (2040 already over → withheld at step 8) |

## 7. Acceptance rule

From the canon's own Round-1 and Round-2 acceptance rules. A fixture fails if:

1. a numerical result differs beyond the declared tolerance;
2. **the wrong rule path produces the same final number** — the fixture asserts the
   intermediate evidence, not only the final dose, precisely so a coincidentally correct
   answer still fails;
3. a forbidden state, value or reason code is returned;
4. a required reason code is absent;
5. a presentation layer recomputes a different slope or dose from the domain result.

Round-2 additionally fails an implementation that: rewrites an intervention's expected
response after potency changes; invents an unlogged external dose change from chemistry
alone; guesses an unknown external-change timestamp; uses a normalized correction window as
automatic potency-calibration evidence; rewrites historical advice after backdated edits;
assumes an expired return-plan dose was actually stopped without confirmation; treats
upper-bound maintenance logic differently from the symmetric lower-bound rule without an
explicit safety exception; or carries learned potency across a material context boundary.

## 8. Tolerances

```text
dKH, dKH/day, mL, mL/day    absolute 1e-9
dimensionless ratios        absolute 1e-12
enums and reason codes      exact
recommendations           exact after rounding
```

Intermediate quantities in the corpus are given to ten significant figures where the
canon states fewer, so an implementation cannot pass by rounding early. Where the canon
itself states a rounded value ("`≈ 0.03536`"), the fixture carries the full-precision value
and notes the canon's rounding.

## 9. Time convention

```text
Day 0   = 2026-09-01T09:00:00+10:00
zone    = Australia/Brisbane (UTC+10, no DST)
Day N   = Day 0 + N × 24 h exactly
```

Brisbane is chosen deliberately: it has no daylight saving, so **no fixture's arithmetic
depends on a DST transition**. DST behaviour is tested separately and explicitly by
`INV-TIME-001` and `WG-ALK-066`, where ambiguity is the point rather than an accident.

## 10. Named unit-test slots that are not committed fixtures

`ALK-V2-ALGORITHM-CONTRACT.md` names test identifiers in its **TESTS** lines that do not
appear in `fixtures/` — `VAL-001`…`VAL-008`, `CLU-001`…`CLU-005`, `TIME-001`, `TIME-002`,
`SEG-001`…`SEG-010`, `TRD-001`, `TRD-002`, `EVD-002`, `INT-001`…`INT-005`,
`RET-001`…`RET-004`, `RSP-006`, `RSP-B01`, `RSP-B02`, `DEL-002`, `MNT-*`, `CON-*`,
`CAP-*`, `POT-*`, `SAF-*`, `RTN-*`, `WC-*`, `COR-*`, `CFG-*`.

`DEL-002` was previously written `AD-DEL-002`, which reads as a committed `AD-` fixture
and dangled — no such body exists. `ALK_V2_FREEZE_5`'s mechanical check found it and it
was renamed to the slot convention. `ALK-035` keeps `WG-ALK-047` and `AD-SEG-003` as its
committed coverage, so no rule lost a fixture.

These are **unit-test slots**, not golden fixtures. They name the small mechanical tests
each algorithm needs (does the validator reject a non-finite value; does a 10-minute repeat
group into one cluster) which are cheap to write against the implementation and carry no
chemistry expectation worth freezing as data. They are listed so the algorithm contract
reads as a complete test plan; every one of them is a behaviour the corpus also exercises
indirectly through a golden.

The distinction matters for the coverage gate: `CORE-CANON-COVERAGE-001`-style checking
runs against `fixtures/index.json`, and the traceability table's `Fixtures` column
references only committed fixture ids.

## 11. What the corpus does not yet contain

Recorded so their absence is a known choice, not an oversight.

- **Long-run simulations** (Part II §51.3, `X-GOV-004`). The generator is specified in
  `INV-NONADHERENCE-001` but no seeded run is committed, because the simulation harness is
  an implementation artifact and would need a language.
- **V1 → V2 comparison runs.** `DEC-013` makes V1 outputs non-authoritative, and V1 is a
  separate read-only repository. The divergence-classification vocabulary
  (`INTENDED_V2_CHANGE`, `V1_BUG_FIXED`, `V2_REGRESSION`, `IMPLEMENTATION_BUG`,
  `MISSING_CAPABILITY`, `NOT_COMPARABLE`) is preserved for when that harness exists.
- **Presentation snapshot strings.** `INV-SURFACE-WORDING-001` states the contract; exact
  production wording belongs to Part IX and to the eventual UI.
- **Fixtures for open issues that would require inventing the missing behaviour.** By
  design: those are the refusal fixtures in §5A.
- **A committed fixture runner.** Executing a fixture needs an engine, which does not exist
  yet. What *is* committed is `tools/conformance/run-conformance.py`, the structural gate over
  rule IDs, traceability, the fixture index, the reason-code closed set, invariant counts and
  canon consistency, plus independent recomputation of every series fixture. It checks that the
  corpus is coherent, not that an engine reproduces it — and it is ready to execute a fixture
  the moment an engine speaks the documented interface. Every one of its checks has a named
  negative control in `tools/conformance/run-mutations.py`. (This paragraph named
  `validate-freeze-5.py` and its 112 assertions when it was written; the validator is retired
  under `DEC-019` and its coverage moved — see `docs/process/GATE-CHECK-INVENTORY.md`.)
