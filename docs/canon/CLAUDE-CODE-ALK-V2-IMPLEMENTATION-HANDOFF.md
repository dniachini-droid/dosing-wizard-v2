# CLAUDE CODE — ALK V2 IMPLEMENTATION HANDOFF

## Authority

The sole behavioural authority is:

`REEF-CHEMISTRY-ENGINE-V2-CANON.md`

Current freezes:

```text
SHARED_V2_FREEZE_1
ALK_V2_FREEZE_3
```

Do not change canon behaviour during implementation.

If code cannot implement a rule as written, stop that branch and report:
- exact canon rule ID;
- exact missing schema/input/architectural conflict;
- whether it is CANON_DEFECT, APP_SCHEMA_REQUIRED, OPTIONAL_CAPABILITY_GATED, or IMPLEMENTATION_DEFECT.

Do not silently simplify the rule.

## First-runtime scope

This implementation is intentionally **Alkalinity-only for advisory logic**.

```text
Alk V2 controller = ACTIVE

Calcium measurement entry/history/chart = ON
Calcium controller/evidence/advice/notifications = OFF

Magnesium measurement entry/history/chart = ON
Magnesium controller/evidence/advice/notifications = OFF
magnesiumGateState = UNKNOWN always during this phase
```

Ca/Mg readings are inert recorded facts only. Do not derive trends, evidence, consumption, potency, cards, scheduler entries, notifications, or cross-parameter gate states from them.

Retain old Ca/Mg code only as reference if useful. Do not run it, wrap it in V2 surfaces, or preserve its broken notification system.

## Stage 1 — inspect before editing

Before implementation, inspect the existing repository and produce a short implementation plan.

Identify:
- current measurement/history storage;
- current dosing records;
- current wizard/domain logic;
- notification scheduler;
- card/surface components;
- existing tests;
- current persistence/migrations;
- places where V1 chemistry is mixed into UI.

Map each reusable piece to the frozen V2 modules.

Do not implement until this inspection is complete.

## Required V2 modules

Prefer distinct modules/services for:

1. measurement + repeat clustering;
2. event ledger;
3. segmentation;
4. robust evidence / Theil–Sen;
5. uncertainty and supported slope;
6. intervention lifecycle + immutable prediction snapshots;
7. delivery basis / dose integration;
8. potency selection + capability gate;
9. Alk controller;
10. safety/return-plan logic;
11. one retest scheduler;
12. presentation adapter/cards;
13. notifications derived from scheduler output;
14. audit/replay;
15. golden/adversarial test harness.

No UI component may recompute chemistry.

## Important migration constraint

Do not rebuild V1's notification architecture.

V2 notification timing must derive from the canonical retest scheduler.

A notification surface may render:

```text
recommendedAt
earliestUsefulAt
latestSafeAt?
reasonCode
```

but must not independently calculate chemistry/retest dates.

## Required schema/capability work

Implement the canon-defined fields needed for core actionable Alk, including where applicable:
- precise `measuredAt`;
- `recordedAt`;
- measurement validity/status;
- dose-event `effectiveAt`;
- effective-time confidence;
- recommendation vs implementation truth;
- programmed dose state;
- delivery context;
- solution context;
- actuator increment for maintenance recommendations;
- configured/theoretical potency inputs;
- intervention prediction snapshots;
- correction/water-change events;
- engine/canon version for replay.

Do not invent missing capability defaults.

Empirical potency learning remains capability-gated until all required structures exist.

## Testing before UI trust

Implement executable tests from the frozen goldens.

Mandatory:
- all Alk goldens;
- five-reading `Sxx` golden;
- safety-return cases;
- unknown implementation;
- confirmed non-adherence;
- mixed interval `NOT_RUN`;
- programmed-schedule delivery basis;
- negative/nonphysical consumption;
- outer-bound cases;
- response classifier boundaries;
- interruption/confounding;
- rounding/caps/rail;
- deterministic replay.

Also build a fixture runner capable of feeding the same synthetic history to:
- V1 where meaningful;
- V2;
and comparing outputs.

Classify divergences as:
- INTENDED_V2_CHANGE;
- V1_BUG_FIXED;
- V2_REGRESSION;
- IMPLEMENTATION_BUG;
- MISSING_CAPABILITY;
- NOT_COMPARABLE.

Do not force V2 to match V1 when the canon intentionally differs.

## Implementation gate

Do not claim V2 Alk is production-conformant merely because it compiles.

Before conformance:
1. frozen goldens pass;
2. property/invariant tests pass;
3. audit/replay deterministic;
4. V1→V2 comparison reviewed;
5. notifications use scheduler truth;
6. no active Ca/Mg legacy controller remains in the first V2 runtime;
7. manual inspection confirms cards render domain output rather than calculate it.

## Deliverables

After repository inspection, return:
1. proposed file/module map;
2. schema/migration changes;
3. implementation sequence;
4. risks/canon capability gaps;
5. test plan.

Then implement in small reviewable stages.

