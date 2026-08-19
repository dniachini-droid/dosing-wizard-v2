# ALK V2 — TEST MATRIX

Index and coverage analysis for the fixture corpus in `fixtures/`.

**160 fixtures across 6 files, plus 60 invariants in `ALK-V2-INVARIANTS.md`.**

---

## 1. Corpus layout

| File | Fixtures | Contents |
|---|---|---|
| `canon-worked-goldens-round1.json` | 20 | `WG-ALK-001` … `WG-ALK-020` — the canon's Round-1 worked numerical suite |
| `canon-worked-goldens-round2.json` | 20 | `WG-ALK-021` … `WG-ALK-040` — interruption, corrections, potency, edits, expiry, mirrors |
| `canon-worked-goldens-external.json` | 27 | `WG-ALK-041` … `WG-ALK-067` — external-review corrections, safety path, capability contract |
| `canon-named-goldens.json` | 43 | `ALK-G001` … `ALK-G040` including `G004A`, `G039A`, `G039B` |
| `adversarial.json` | 34 | `AD-*` — scenarios the brief requires that the canon states qualitatively or not at all |
| `invariants-and-governance.json` | 16 | `INV-*` coverage fixtures, `X-MIG-001`, `X-GOV-001` … `X-GOV-004` |
| `index.json` | — | Generated index; ids, counts, provenance split, open-issue coverage |
| `config-defaults.json` | — | The canon's default worked-suite configuration plus once-derived constants |
| `_schema.json` | — | Fixture shape, tolerances, acceptance rule, time convention |

## 2. Provenance split

Every expectation is traceable to the canon. **No expectation is derived from V1 runtime
behaviour** (`DEC-013`, canon §52).

| Class | Count | Meaning |
|---|---|---|
| `CANON_VERBATIM` | 102 | Every asserted number or state appears in the canon |
| `CANON_DERIVED` | 33 | Numbers computed here by applying frozen canonical formulas to stated or constructed inputs |
| `CANON_QUALITATIVE` | 25 | The canon states states and prohibitions but no arithmetic |

The 33 derived fixtures were produced by evaluating Theil–Sen, `ALK-SLOPE-UNCERTAINTY-001`,
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
| safety fail-safe | `WG-ALK-051`, `AD-SAF-002` |
| Mg capability UNKNOWN | `AD-SAF-001`, `X-MIG-001` |
| Ca/Mg measurement-only capability gates | `AD-CAP-001`, `X-MIG-001` |

**All 45 required scenarios are covered.**

## 4. Coverage by rule owner

Derived from `rulesExercised` across the corpus and the `Fixtures` column of
`ALK-V2-RULE-TRACEABILITY.md`. Every one of the 261 inventoried rules names at least one
fixture — the condition `CORE-CANON-COVERAGE-001` imposes on the canon's own manifest,
applied here to this package.

| Owner | Rules | Representative fixtures |
|---|---|---|
| `VALIDATION` | 21 | `VAL-*`, `AD-POS-001`, `AD-TIME-001`, `WG-ALK-066` |
| `SEGMENTATION` | 33 | `AD-SEG-001`–`004`, `WG-ALK-011`, `WG-ALK-012`, `WG-ALK-047` |
| `TREND` | 18 | `WG-ALK-001`, `AD-TRD-001`–`006`, `AD-RAP-001` |
| `UNCERTAINTY` | 11 | `WG-ALK-062` (mandatory), `AD-TRD-004`, `AD-TRD-005` |
| `SUPPORT` | 2 | `WG-ALK-001`, `WG-ALK-002`, `WG-ALK-062` |
| `CONSUMPTION` | 6 | `WG-ALK-013`, `AD-CON-001`, `AD-MNT-005` |
| `POTENCY` | 18 | `WG-ALK-024`–`027`, `WG-ALK-050`, `AD-POT-001`, `AD-POT-002` |
| `RESPONSE` | 27 | `WG-ALK-007`–`010`, `WG-ALK-021`, `AD-RSP-001`–`003` |
| `MAINTENANCE` | 26 | `WG-ALK-001`, `AD-MNT-001`–`007` |
| `RETURN` | 11 | `WG-ALK-014`, `WG-ALK-015`, `WG-ALK-031`, `WG-ALK-035`, `AD-RTN-001`, `AD-RTN-002` |
| `SAFETY` | 12 | `WG-ALK-041`, `WG-ALK-051`–`061`, `AD-SAF-001`–`003` |
| `RETEST` | 13 | `WG-ALK-060`, `AD-RET-001` |
| `CAPABILITY` | 20 | `WG-ALK-045`–`048`, `WG-ALK-054`, `WG-ALK-065`, `WG-ALK-066`, `AD-CAP-001` |
| `OUTPUT` | 20 | `INV-*`, `X-GOV-*` |
| `AUDIT` | 12 | `ALK-G040`, `INV-REPLAY-001`, `WG-ALK-029`, `WG-ALK-030` |
| `PRESENTATION` | 11 | `INV-SURFACE-WORDING-001`, `ALK-G039A`, `ALK-G039B` |

## 5. Open-issue coverage

18 of the 33 open issues are exercised by a fixture that asserts the **refusal** rather
than a guessed value. These are the tests that fail if an implementer silently picks a
default.

| Open issue | Fixture(s) asserting the refusal |
|---|---|
| `OI-INDEPENDENCE-001` | `AD-SEG-001` |
| `OI-SUSPECT-001` | `ALK-G024`, `ALK-G025`, `AD-TRD-004` |
| `OI-MADFLOOR-001` | `AD-TRD-004` |
| `OI-NEGCONS-001` | `WG-ALK-013`, `WG-ALK-051`, `ALK-G026` |
| `OI-RETEST-001` | `AD-RET-001` |
| `OI-RETURNOFFER-001` | `WG-ALK-014`, `WG-ALK-028`, `ALK-G006` |
| `OI-BELOWRISING-001` | `AD-MNT-006`, `AD-MNT-007` |
| `OI-WATERCHANGE-001` | `WG-ALK-011`, `ALK-G022` |
| `OI-LIQUIDGUARD-001` | `WG-ALK-067`, `AD-SAF-003` |
| `OI-SAFETYRATE-001` | `AD-SAF-002` |
| `OI-DAY4-001` | `ALK-G011`, `AD-SEG-003` |
| `OI-WG024-001` | `WG-ALK-024`, `AD-POT-001`, `ALK-G033` |
| `OI-ANOMCLUSTER-001` | `AD-SEG-004` |
| `OI-OVERSHOOT-001` | `ALK-G016` |
| `OI-RAPIDBASIS-001` | `AD-RAP-001`, `AD-MNT-002` |
| `OI-FORECASTHORIZON-001` | `WG-ALK-042`, `WG-ALK-043` |
| `OI-DEFERREASON-001` | `WG-ALK-052` |
| `OI-ANCHOR-001` | `AD-SEG-003` |

The remaining open issues (`OI-STABLE-001`, `OI-EXPOSURE-001`, `OI-NORMUNCERT-001`,
`OI-CONFIDENCE-001`, `OI-POTENCYSTATE-001`, `OI-POTENCYSNAP-001`, `OI-PIPELINE-001`,
`OI-RETURNDURINGSAFETY-001`, and the pinned conventions) are covered by invariants rather
than goldens, because they concern absent behaviour, structural properties or states that
are unreachable in the Alk-only runtime.

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
| actuator rounding at half an increment | `AD-MNT-001` (0.0451 mL/day → HOLD) | `AD-MNT-003` (0.0685 mL/day → act) |
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
actuator commands           exact after rounding
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
`RET-001`…`RET-004`, `RSP-006`, `RSP-B01`, `RSP-B02`, `MNT-*`, `CON-*`, `CAP-*`, `POT-*`,
`SAF-*`, `RTN-*`, `WC-*`, `COR-*`, `CFG-*`.

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
  design: those are the refusal fixtures in §5.
