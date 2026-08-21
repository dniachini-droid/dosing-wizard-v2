"""Every numeric constant the Alk domain may use, and nothing else.

`ALK-V2-IMPLEMENTATION-CONTRACT.md` §2: *"No other numeric constant may be
introduced by an implementation. A number not in this table and not derived from
it by a canonical equation is a defect."* Conformance-gate item 5 is the same
sentence as a check.

So this module is the single place a magic number is allowed to appear, each one
carrying the canon rule that owns it. Nothing else in `alk_v2` writes a bare
chemistry number; where you see one it is a structural constant (a count, an
index, `0`, `1`, `2`) or a bug.

The values are transcribed from the implementation contract's table, which
transcribes them from the canon. That is one transcription more than ideal, and
`CHK-CANON-CONSTANTS` in the conformance harness is what holds it honest: it
reads each constant out of the canon at the pinned base commit and fails if it
was not already there.
"""

from __future__ import annotations

# -- uncertainty and support ------------------------------------------------
SIGMA_ALK_BASE = 0.10  # dKH          ALK-004
ALK_SLOPE_SUPPORT_K = 1.28  # —       ALK-SUPPORTED-SLOPE-001
ALK_RESPONSE_K = 1.28  # —            ALK-RESPONSE-CLASSIFIER-001
MAD_SCALE = 1.4826  # —               Part II §5.6, §19.4

# -- measurement grouping ---------------------------------------------------
REPEAT_CLUSTER_WINDOW_MINUTES = 30  # ALK-005 / Part II §5.3
REPEAT_SPREAD_LIMIT = 0.20  # dKH     ALK-005

# -- evidence ---------------------------------------------------------------
ROUTINE_CADENCE_HOURS = 48  # h       ALK-006, ALK-050
MAX_CONTROL_LOOKBACK_DAYS = 14  # d   ALK-007
MIN_INDEPENDENT_SPACING_HOURS = 24  # ALK-008
MIN_ORDINARY_CLUSTERS = 3  # count    ALK-MOVEMENT-001, ALK-MINIMUM-CADENCE-001
MIN_ORDINARY_SPAN_DAYS = 4  # days    ALK-MOVEMENT-001, ALK-MINIMUM-CADENCE-001

# -- rapid ------------------------------------------------------------------
RAPID_THRESHOLD = 0.30  # dKH/day     ALK-RAPID-001
RAPID_MIN_ELAPSED_HOURS = 24  # h     ALK-RAPID-001
RAPID_RETEST_HOURS = 24  # h          ALK-052

# -- ranges and bounds ------------------------------------------------------
DEFAULT_TARGET_MIN = 8.2  # dKH       ALK-003 (suggestion, user-editable)
DEFAULT_TARGET_MAX = 8.8  # dKH       ALK-003
OUTER_MIN = 7.0  # dKH                ALK-OUTER-BOUNDS-001 (configurable default)
OUTER_MAX = 11.0  # dKH               ALK-OUTER-BOUNDS-001
B_SAFETY = 0.20  # dKH                ALK-SAFETY-BUFFER-001 (fixed)
SAFETY_MAX_24H_MOVE = 0.50  # dKH     ALK-003A
SAFETY_RETEST_HOURS = 24  # h         ALK-SAFETY-RETURN-INTEGRATION-001 §9
ADVISORY_OFFSET = 1.0  # dKH          ALK-ADVISORY-RANGE-BOUNDARY-001

# -- rails and caps ---------------------------------------------------------
ALK_RATE_RAIL = 0.50  # dKH/day       ALK-046, ALK-COMPOSITE-RAIL-001
ORDINARY_STEP_CAP = 0.25  # fraction  ALK-STEP-CAP-001
EXCEPTIONAL_STEP_CAP = 0.50  # frac   ALK-STEP-CAP-001
STEP_CAP_MEANINGFUL_MULTIPLE = 4  # × ALK-STEP-CAP-001
LIQUID_GUARD_FRACTION = 0.02  # /24 h ALK-LIQUID-VOLUME-GUARD-001
MILLILITRES_PER_LITRE = 1000  # mL/L  unit conversion, not a chemistry constant

# -- water change -----------------------------------------------------------
UNKNOWN_WC_ASSUMED_MISMATCH = 2.0  # dKH   ALK-WATERCHANGE-UNKNOWN-001
WC_UNKNOWN_BREAK_FRACTION = 0.05  # frac   derived: 0.10 / 2.0
ALK_MATERIALITY_FLOOR = 0.10  # dKH       ALK-033 (= SIGMA_ALK_BASE)

# -- intervention and response ---------------------------------------------
POSTCHANGE_FIRST_TEST_HOURS = 48  # h  ALK-POSTCHANGE-001, ALK-POSTCHANGE-RETEST-001
POSTCHANGE_SECOND_TEST_HOURS = 48  # h after the first
ATTRIBUTION_HORIZON_DAYS = 14  # d     ALK-RESPONSE-DETECTABILITY-001

# -- potency ----------------------------------------------------------------
POTENCY_SNR_DIAGNOSTIC = 2.0  # —      ALK-017
POTENCY_SNR_CALIBRATION = 3.0  # —     ALK-017
POTENCY_MIN_SIDE_CLUSTERS = 3  # count ALK-017
POTENCY_MIN_SIDE_SPAN_DAYS = 4  # d    ALK-017
POTENCY_ENVELOPE_LOW = 0.40  # ×       ALK-POTENCY-PLAUSIBILITY-001
POTENCY_ENVELOPE_HIGH = 1.60  # ×      ALK-POTENCY-PLAUSIBILITY-001
POTENCY_CALIBRATED_N = 3  # count      ALK-POTENCY-CONFIDENCE-001
POTENCY_CALIBRATED_SPAN_DAYS = 7  # d  ALK-POTENCY-CONFIDENCE-001
POTENCY_CALIBRATED_RDISP = 0.15  # —   ALK-POTENCY-CONFIDENCE-001
POTENCY_STRONG_N = 5  # count          ALK-POTENCY-CONFIDENCE-001
POTENCY_STRONG_SPAN_DAYS = 14  # d     ALK-POTENCY-CONFIDENCE-001
POTENCY_STRONG_RDISP = 0.10  # —       ALK-POTENCY-CONFIDENCE-001
POTENCY_REASSESS_DELTA = 0.15  # frac  ALK-POTENCY-CONFIDENCE-001

# -- brackets and plans -----------------------------------------------------
BRACKET_MAX_AGE_DAYS = 45  # d         ALK-032
BRACKET_COMPARABILITY_RC = 0.25  # —   ALK-BRACKET-COMPARABILITY-001
RETURN_PACE_GENTLE = 0.125  # dKH/day  ALK-055
RETURN_PACE_STEADY = 0.25  # dKH/day   ALK-055
RETURN_PACE_QUICK = 0.50  # dKH/day    ALK-055

# -- chemistry --------------------------------------------------------------
NA2CO3_FACTOR = 0.05284  # dKH·L/(g·mL)  ALK-014
NAHCO3_FACTOR = 0.03333  # dKH·L/(g·mL)  ALK-014
NAOH_FACTOR = 0.07000  # dKH·L/(g·mL)   ALK-014
MEQ_PER_L_TO_DKH = 2.8  # dKH per meq/L  ALK-002

# -- retest scheduler -------------------------------------------------------
#: Part II §53's `RequiredMovement` for the signal candidate. `ALK_V2_FREEZE_5`
#: supplied it from an existing constant rather than inventing one: it *is*
#: `SIGMA_ALK_BASE`. Aliased rather than re-typed so the identity is visible.
RETEST_REQUIRED_MOVEMENT = SIGMA_ALK_BASE  # dKH
RETEST_SIGNAL_FLOOR_HOURS = 24  # h    ALK-008, inside T_signal's own formula
RETEST_OBSERVATION_CEILING_HOURS = 96  # h  ALK-053 Day-4 window
RETEST_BOUNDARY_SAFETY_LEAD_DAYS = 1.0  # d  Part II §54, from ALK-052's cadence

# -- unit conversion (structural, not chemistry) ----------------------------
SECONDS_PER_DAY = 86400
HOURS_PER_DAY = 24
