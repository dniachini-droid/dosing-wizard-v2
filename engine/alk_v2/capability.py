"""The capability gate — `A47`, `ALK-CAPABILITY-CONTRACT-001`.

A deterministic rule is not implementation-ready unless every required datum has
a capture source, a stored representation and a defined missing-data behaviour.
**No implementation may silently manufacture a missing input.**

Three outcomes, and no fourth: `DEGRADE` continues on a named weaker but valid
path, `REFUSE` withholds the affected recommendation and names what is missing,
`NOT_RUN` disables the affected optional analysis while unrelated Alk control
continues. `CORE-INFORM-PROCEED-001` decides between them: withhold only the
affected output, and continue providing every unaffected conclusion.

`M-1` … `M-13` are evaluated before the recommendation pipeline and attached to
every `EngineResult`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

OK = "OK"
DEGRADE = "DEGRADE"
REFUSE = "REFUSE"
NOT_RUN = "NOT_RUN"


@dataclass
class Capability:
    capability_id: str
    present: bool
    outcome: str
    affected_outputs: List[str] = field(default_factory=list)
    reason_code: Optional[str] = None

    def payload(self) -> Dict[str, Any]:
        out: Dict[str, Any] = {
            "capabilityId": self.capability_id,
            "present": self.present,
            "outcome": self.outcome,
            "affectedOutputs": list(self.affected_outputs),
        }
        if self.reason_code:
            # `capabilityReasonCode`, not `reasonCode`: `DEC-022` renamed it
            # because `RetestDecision.reasonCode` carries a different value in
            # the same result, and `compare_by_name` resolves both by name.
            out["capabilityReasonCode"] = self.reason_code
        return out


def evaluate(led, cfg, potency_learning_gated: bool) -> List[Capability]:
    """Evaluate every capability this build can observe, and say so where it cannot.

    The list is complete over `M-1` … `M-13` because the contract says it is:
    an `EngineResult` carrying eleven of thirteen would be an output that failed
    to mention what it did not look at.
    """
    caps: List[Capability] = []

    # M-1 — recommendation precision. A *configured* value of <= 0 refuses;
    # absence withholds nothing and states the full-precision recommendation.
    # There is no hidden 0.1 default in any state (owner decision 23).
    precision = cfg.values.get("recommendationPrecisionMlPerDay")
    if precision is None:
        caps.append(Capability("M-1", False, OK))
    elif not isinstance(precision, (int, float)) or precision <= 0:
        caps.append(
            Capability(
                "M-1", True, REFUSE,
                ["doseRecommendation.recommendedDoseMlPerDay"],
                "VALIDATION_RECOMMENDATION_PRECISION_INVALID",
            )
        )
    else:
        caps.append(Capability("M-1", True, OK))

    # M-2 / M-3 — solution and delivery context. Core control continues on the
    # configured potency; only the learner stops. In this runtime the learner is
    # capability-gated anyway, so its `NOT_RUN` has two independent causes and
    # both are named rather than one masking the other.
    for cid, code in (
        ("M-2", "CAPABILITY_SOLUTION_CONTEXT_MISSING"),
        ("M-3", "CAPABILITY_DELIVERY_CONTEXT_MISSING"),
    ):
        key = "solutionContextId" if cid == "M-2" else "deliveryContextId"
        present = bool(cfg.values.get(key))
        caps.append(
            Capability(cid, present, OK if present else NOT_RUN,
                       [] if present else ["potency.learnedPotencyDkhPerMl"],
                       None if present else code)
        )

    # M-4 — replacement-water alkalinity, per water change present.
    wcs = led.of_kind("WATER_CHANGE")
    if not wcs:
        caps.append(Capability("M-4", False, OK))
    else:
        missing = [w for w in wcs if w.get("replacementAlkalinityDkh") is None]
        caps.append(
            Capability("M-4", not missing, OK if not missing else DEGRADE,
                       [] if not missing else ["consumption.consumptionDkhPerDay"],
                       None if not missing else "CAPABILITY_REPLACEMENT_WATER_ALK_MISSING")
        )

    # M-5 — dose-change effective time.
    uncertain = [
        e
        for e in led.of_kind("DOSE_CHANGE") + led.of_kind("DOSE_STATE")
        if e.get("effectiveAtConfidence") == "UNCERTAIN"
    ]
    caps.append(
        Capability("M-5", not uncertain, OK if not uncertain else DEGRADE,
                   [] if not uncertain else ["responseAssessment", "potency"],
                   None if not uncertain else "CAPABILITY_DOSE_EFFECTIVE_TIME_UNCERTAIN")
    )

    # M-6 — delivered volume. Its absence must not disable the controller: a
    # confirmed programmed schedule is a first-class basis (`WG-ALK-047`).
    caps.append(Capability("M-6", False, OK))

    # M-7 — prediction snapshot. Required for new V2 interventions; there is no
    # intervention on the normal path this build covers.
    caps.append(Capability("M-7", False, OK))

    # M-8 / M-13 — measurement time precision and absolute-time provenance.
    imprecise = [
        r for r in led.readings
        if not r.at.exact
    ]
    caps.append(
        Capability("M-8", not imprecise, OK if not imprecise else DEGRADE,
                   [] if not imprecise else ["observedTrajectory"],
                   None if not imprecise else "CAPABILITY_MEASUREMENT_TIME_IMPRECISE")
    )

    # M-9 — pre/post programmed dose state, for a potency observation.
    caps.append(Capability("M-9", False, NOT_RUN, ["potency.learnedPotencyDkhPerMl"],
                           "CAPABILITY_PROGRAMMED_DOSE_STATE_UNCONFIRMED"))

    # M-10 — historical bracket evidence. Advisory only; core control continues.
    caps.append(Capability("M-10", False, NOT_RUN, ["doseRecommendation.bracketStatus"],
                           "CAPABILITY_HISTORICAL_BRACKET_UNAVAILABLE"))

    # M-11 — magnesium alert state. Constant `UNKNOWN` in the Alk-only runtime,
    # never derived from any logged Mg value. Alk safety still runs and no
    # low-Mg warning is invented.
    caps.append(Capability("M-11", False, DEGRADE, ["safety.magnesiumGateState"],
                           "CAPABILITY_MAGNESIUM_STATE_UNKNOWN"))

    # M-12 — effective-dated configuration.
    if cfg.historical_unavailable:
        caps.append(Capability("M-12", False, REFUSE, ["configVersionId"],
                               "CAPABILITY_HISTORICAL_CONFIGURATION_UNAVAILABLE"))
    else:
        caps.append(Capability("M-12", cfg.resolved, OK if cfg.resolved else REFUSE,
                               [] if cfg.resolved else ["configVersionId"],
                               None if cfg.resolved else
                               "CAPABILITY_HISTORICAL_CONFIGURATION_UNAVAILABLE"))

    caps.append(
        Capability("M-13", not imprecise, OK if not imprecise else DEGRADE,
                   [] if not imprecise else ["observedTrajectory"],
                   None if not imprecise else "CAPABILITY_ABSOLUTE_TIME_UNAVAILABLE")
    )

    # The potency learner's own gate is deliberately **not** a fourteenth
    # capability row. `M-1` … `M-13` is the closed set the contract declares,
    # and inventing an id for it would put a name in `capabilityId` that no
    # document owns. The gate is reported as a reason code instead
    # (`CAPABILITY_POTENCY_LEARNER_GATED`), which is where the catalogue puts it.
    return caps
