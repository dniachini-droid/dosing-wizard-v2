# Dosing Wizard — V2 Roadmap

## Status

This is the master product roadmap for Dosing Wizard V2.

It describes the route from the fresh repository created on 2026-08-19 to a validated public product.

Detailed chemistry rules belong in canon documents, not here.

Detailed architectural decisions belong in `DECISIONS.md`.

Current implementation status belongs in `PROJECT-STATE.md`.

---

## Destination

Dosing Wizard is intended to become a whole-tank reef-management platform combining:

1. deterministic reef chemistry engines;
2. a whole-tank reasoning/coordinator layer;
3. a comprehensive reef calculator platform;
4. logging, charts, tasks, reminders and tank-management workflows;
5. a paid installable web application / PWA;
6. offline-capable operation with durable user data;
7. accounts, subscription entitlement and cloud sync where appropriate;
8. an optional AI / "Ask My Tank" interface above the deterministic system;
9. possible native clients later if justified.

The first public release does not need every future feature.

The system should grow by adding independently validated modules to a stable shared foundation.

---

# Phase 0 — Preserve and found V2

## Goal

Create a clean V2 project without losing hard-won V1 knowledge.

## Work

- Freeze V1 as reference rather than continuing architectural development there.
- Create the fresh `dosing-wizard-v2` repository.
- Establish:
  - `PRODUCT-VISION.md`
  - `ROADMAP.md`
  - `PROJECT-STATE.md`
  - `DECISIONS.md`
- Preserve the frozen Shared V2 and Alk V2 canon.
- Preserve the Alk implementation handoff.
- Preserve the final V1 salvage inventory. **Done** — carried into V2 as
  `docs/process/V1-AGENT-SALVAGE-AUDIT.md` (agents and routines) and
  `docs/migration/V1-APPLICATION-SALVAGE.md` (screens, flows, components, tooling).
  Both were written from the V1 repository at commit `9276a2c`, read-only.
  The reconnaissance report itself was never committed to V1 — see
  `docs/migration/README.md`.
- Create:
  - V1 salvage disposition — **done**, as the disposition column of the two inventories above;
  - unmigrated V1 canon record — **done**, `docs/migration/UNMIGRATED-V1-CANON.md`;
  - historical-data provenance record — **done**, `docs/migration/DATA-PROVENANCE.md`
    (principles) and `docs/migration/V1-DATA-PROVENANCE.md` (dataset detail, with the
    owner's provenance correction applied).
- Preserve selected V1 journeys, failure cases, tests and design provenance as reference.
  **Partly done** — the application inventory dispositions V1's journeys, test estate and
  failure catalogue and cites them by location; no V1 file has been copied into
  `docs/v1-reference/`.
- Do not import V1 runtime chemistry architecture.
- Record unresolved V1 questions without forcing premature decisions. **Done** —
  `docs/migration/V1-OPEN-OWNER-QUESTIONS.md` records eleven, and answers none.

## Exit criteria

- New repository exists.
- Founding documents exist.
- Frozen canon is present and clearly authoritative.
- V1 material is clearly marked reference-only where appropriate.
- No application runtime has yet been built accidentally from V1 assumptions.

## Status

The salvage deliverables above are **complete**. Whether Phase 0 is closed also depends on
the remaining exit criteria and is `PROJECT-STATE.md`'s to record, not this document's.

**A gap this work measured, recorded here because it is a sequencing fact.** The build-one
screen set was designed before the application salvage inventory existed, and omits
substantial V1 surfaces — the tasks and maintenance calendar, the Test Lab checklist, the
reading-arrival moment, the dose-expectation moment and the ICP flow among them.
`docs/migration/V1-APPLICATION-SALVAGE.md` §12 lists them in full. **Nothing here decides
whether any of them enters build one.**

---

# Phase 1 — Technical architecture and shared foundation

## Goal

Choose and establish the technical architecture that can support the eventual product rather than merely the first prototype.

## Architecture research

Evaluate current primary documentation and suitable technologies for:

- installable PWA;
- iPhone Home Screen use;
- offline-first operation;
- local persistence;
- secure authentication;
- cloud database and sync;
- schema migrations;
- long-lived user data;
- multiple devices;
- multiple tanks;
- server-side API functions;
- subscriptions/payments;
- notifications;
- eventual AI API access;
- possible future native clients.

Do not select the stack merely because V1 used React/Vite/IndexedDB.

## Shared domain foundation

Implement:

- canonical data schema;
- immutable/event-oriented tank history where required;
- raw reading model;
- time and timezone model;
- provenance model;
- measurement validity;
- configuration versioning;
- intervention/event ledger;
- dose-event representation;
- capability/degradation states;
- audit history;
- deterministic replay;
- migrations;
- shared reason-code conventions;
- shared test infrastructure.

Historical date-only data must remain date-only.

Missing historical intervention or dose history must never be manufactured.

## Engineering foundation

Establish:

- type checking;
- linting;
- unit tests;
- deterministic goldens;
- invariant tests;
- adversarial tests;
- CI;
- migration tests;
- accessibility baseline;
- error handling;
- dependency/bundle monitoring where appropriate.

## Exit criteria

- Stack decision recorded.
- Core schema can represent V2 canon without lossy shortcuts.
- Deterministic replay exists.
- Migration/versioning strategy exists.
- Tests and CI work.
- No user-facing chemistry recommendation is yet allowed to bypass canonical domain state.

---

# Phase 2 — First complete domain: alkalinity

## Goal

Build the first production-quality deterministic chemistry engine and enough product workflow for real personal use.

## Domain

Implement frozen Alk V2 canon including:

- reading eligibility;
- independent clusters;
- observed trajectory;
- Theil–Sen slope;
- uncertainty;
- supported trajectory;
- effective dose intervals;
- delivery basis;
- consumption;
- maintenance-dose estimation;
- potency learning;
- intervention segmentation;
- post-change predictions;
- response classification;
- ordinary and rapid adjustment limits;
- outer-bound safety handling;
- correction/return-plan separation;
- retest scheduling;
- actuator rounding;
- capability degradation;
- reason codes;
- audit/replay.

Automatic maintenance must stabilise rather than intentionally move alkalinity toward a target.

## Measurement-only domains

Initially support calcium and magnesium as inert measurement domains:

- entry;
- timestamps;
- history;
- charts.

Do not enable their controllers, potency learning or recommendation logic until their own canons exist.

## Product workflow

Build:

- tank setup;
- chemistry entry;
- quick logging;
- testing-session entry;
- dose-change entry with exact date/time;
- Alk history/chart;
- event markers;
- recommendation card;
- explanation/evidence view;
- retest/task integration;
- basic current-tank dashboard.

## Personal validation

Use the owner's real tank.

At first V2 cutover, obtain a fresh current export/dataset from continuing V1 use.

Historical readings may be imported for display/reference subject to their provenance and evidence limitations.

## Exit criteria

- Alk canonical golden tests pass.
- Adversarial cases pass.
- Historical replay is deterministic.
- Owner can use V2 for actual Alk tracking.
- Ca/Mg remain safely inert rather than accidentally borrowing Alk logic.
- V2 can coexist with incomplete historical context without inventing evidence.

---

# Phase 3 — Core mineral chemistry: calcium and magnesium

## Goal

Design these domains from their own science rather than cloning Alk.

## Calcium

Research and canonise:

- meaningful measurement uncertainty;
- evidence requirements;
- consumption inference;
- response timing;
- maintenance behaviour;
- correction behaviour;
- safe physical movement;
- dosing-product conversion;
- potency/calibration where appropriate;
- interactions with alkalinity.

## Magnesium

Research and canonise:

- whether reading-driven maintenance tuning is scientifically useful;
- measurement uncertainty;
- correction behaviour;
- safe movement;
- maintenance-product models;
- relationship to Alk/Ca chemistry;
- any gating/advisory relationships.

Re-evaluate V1's 1,347-day maintenance-tuning argument scientifically.

## Cross-parameter mineral chemistry

Build only relationships justified by evidence.

Avoid turning plausible chemical relationships into unsupported causal diagnoses.

## Exit criteria

- Independent Ca canon frozen.
- Independent Mg canon frozen.
- Controllers implemented from those canons.
- Cross-parameter rules have explicit owners.
- Alk remains unchanged unless new evidence formally requires reopening it.

---

# Phase 4 — Nutrient domains

## Goal

Build phosphate and nitrate as nutrient-management engines suited to their actual chemistry.

## Phosphate

Re-research from primary science and authoritative reef practice:

- rock/substrate phosphate buffering;
- measurement uncertainty;
- meaningful evidence across time;
- low-phosphate risk;
- preferred/user ranges;
- intervention response;
- media/export events;
- lanthanum;
- GFO/adsorbers;
- feeding changes;
- water-change effects;
- appropriate retest timing.

Do not inherit V1's numerical phosphate rules without revalidation.

## Nitrate

Research independently:

- measurement uncertainty;
- useful temporal evidence;
- low/high risk;
- nutrient interventions;
- carbon dosing;
- supplementation;
- water-change effects;
- relationship to phosphate.

## Intervention awareness

The future app may reason about an intervention when it has recorded evidence that the keeper is actually using or considering it.

It must not invent unrecorded husbandry methods.

## Exit criteria

- PO4 canon frozen.
- NO3 canon frozen.
- Event-aware nutrient engines implemented.
- Nutrient recommendations coexist coherently rather than acting independently.

---

# Phase 5 — Wider chemistry and observation domains

## Goal

Expand coverage only where the product can add trustworthy value.

Candidate domains:

- salinity;
- ammonia;
- pH;
- potassium;
- ICP / trace elements;
- other measurements with a defensible product role.

Each domain must define what type of parameter it is.

Not every parameter requires:

- a trend;
- a controller;
- a target;
- a correction;
- a maintenance dose;
- the same evidence model.

Examples:

- ammonia may be event/alert oriented;
- pH may be observational/contextual rather than directly controlled;
- ICP may be event/correction/maintenance oriented.

## Exit criteria

- Each added parameter has an explicit reason for existing.
- No parameter is forced through a generic Alk-shaped state machine.

---

# Phase 6 — Whole-tank coordinator

## Goal

Turn multiple parameter engines and tank events into one coherent plan.

## Inputs

Potential coordinator inputs include:

- structured parameter-domain states;
- active interventions;
- dosing changes;
- water changes;
- feeding changes;
- nutrient media;
- equipment state/events;
- livestock context where relevant;
- maintenance events;
- configuration changes;
- measurement validity;
- upcoming retests.

## Coordinator responsibilities

Determine:

- action priority;
- conflicts;
- interventions already in flight;
- when to hold other variables steady;
- when one observation may provide context for another;
- appropriate retest ordering;
- one coherent tank-level action plan.

## Evidence language

The system must distinguish:

- known fact;
- supported inference;
- plausible but unproven context;
- unsupported speculation.

Unsupported causal storytelling is not allowed.

## Exit criteria

A user does not receive five independent parameter engines all demanding simultaneous changes.

The product can say, for example:

- change Alk maintenance;
- leave PO4 alone because an intervention is already being evaluated;
- do not alter other chemistry today;
- test Alk in two days;
- test PO4 later.

---

# Phase 7 — Comprehensive calculator platform

## Goal

Make Dosing Wizard a destination for reef calculations even when no advisory engine is needed.

## Calculator families

Build a catalogue covering common reef calculations such as:

- alkalinity correction;
- calcium correction;
- magnesium correction;
- Balling systems;
- two-part systems;
- three-part systems;
- trace-element corrections;
- stock-solution mixing;
- dry-salt solution preparation;
- dilution;
- concentration;
- salinity;
- water changes;
- nitrate supplementation;
- nutrient dosing;
- phosphate-removal treatments where appropriate;
- dosing-pump calibration;
- daily consumption to dose;
- potency/solution-strength back-calculation;
- tank volume;
- unit conversions;
- ICP corrections where justified.

## Product catalogue

Manufacturer-specific formulas become versioned first-class data.

Suggested metadata includes:

- brand;
- product;
- product version;
- parameter;
- concentration basis;
- formula;
- source;
- source date/version;
- units;
- constraints;
- warnings.

Research authoritative current manufacturer information at implementation time.

## Separation rule

Calculator arithmetic never silently becomes an advisory recommendation.

## Exit criteria

Calculators are independently testable, sourced and versioned.

---

# Phase 8 — Commercial product layer

## Goal

Turn the validated reef tool into a product people can reliably pay for and keep using.

## Accounts and identity

Implement as appropriate:

- user accounts;
- secure authentication;
- tank ownership;
- multiple tanks;
- account recovery;
- device migration.

## Data durability

Establish:

- local/offline copy;
- sync model;
- cloud persistence;
- conflict handling;
- export;
- backup;
- restore;
- schema migration;
- deletion policy.

Never silently lose user tank history.

## Paid access

Evaluate and implement:

- subscriptions;
- monthly/yearly plans if appropriate;
- payment provider;
- entitlement;
- billing/customer portal;
- usage limits if needed.

## PWA

Deliver:

- installable Home Screen experience;
- responsive/mobile-first design;
- offline core workflows;
- appropriate notification support;
- reliable update behaviour.

## Product quality

Include:

- onboarding;
- settings;
- accessibility;
- privacy controls;
- error recovery;
- support workflows;
- crash/operational diagnostics where appropriate and privacy-respecting.

## Exit criteria

A user can discover the product, subscribe, create a tank, install it, use it offline where supported, recover their account and trust their history to persist.

---

# Phase 9 — Optional AI / Ask My Tank

## Goal

Provide a natural-language interface to the deterministic system without handing chemistry authority to a language model.

## Architecture

Authoritative path:

Tank facts
→ deterministic engines
→ whole-tank coordinator
→ structured action plan
→ AI explanation

AI must not replace this with:

Tank facts
→ language model
→ invented dosing recommendation

## Candidate capabilities

- Ask My Tank;
- explain current recommendation;
- explain why no change is advised;
- summarize the week/month;
- compare interventions;
- natural-language logging with user confirmation;
- onboarding;
- educational explanation;
- calculator explanation;
- structured ICP assistance;
- surface relevant tank history.

## Safety boundary

If an engine returns:

- HOLD;
- NOT_RUN;
- insufficient evidence;
- unsupported;
- unsafe;
- capability unavailable;

the AI may explain that state.

It may not invent an alternative chemistry action.

## Technical requirements

AI API credentials remain server-side.

AI should receive compact structured domain context rather than unrestricted raw history by default.

Usage and cost controls must exist.

Core Dosing Wizard remains fully functional when AI is unavailable.

## Exit criteria

AI makes the deterministic product easier to understand and use without becoming a second ungoverned chemistry engine.

---

# Phase 10 — Real-world validation

## Goal

Prove that the product works outside test fixtures.

## Stages

1. Owner's tank.
2. Extended personal use.
3. Trusted expert reef keepers.
4. Local reef-store/expert testing.
5. Small closed beta.
6. Wider paid beta if justified.

## Validate

- recommendation correctness;
- refusal behaviour;
- intervention timing;
- usability;
- logging friction;
- missing event handling;
- bad-data handling;
- migrations;
- offline behaviour;
- sync;
- calculators;
- whole-tank plan coherence;
- AI boundaries if enabled.

Scientific rules should be reopened when evidence justifies reopening them, not merely because a tester prefers a different number.

---

# Phase 11 — Public launch

## Initial public target

Paid installable web application / PWA.

A native App Store release is optional and may follow once the product has proven demand and the additional platform work is justified.

## Launch readiness

Require:

- validated chemistry engines;
- tested calculations;
- robust migrations;
- reliable user-data durability;
- authentication security;
- billing reliability;
- privacy documentation;
- terms/policies as required;
- production monitoring;
- recovery procedures;
- support process;
- product documentation;
- launch/pricing strategy.

## Post-launch

Continue:

- scientific maintenance;
- manufacturer-product database updates;
- calculator expansion;
- domain expansion;
- whole-tank improvements;
- performance/reliability work;
- user research;
- optional native distribution.

---

# Sequencing rule

Do not build a later product layer to conceal an unfinished earlier scientific layer.

However, architecture should anticipate later requirements so that the early implementation does not make the intended public product unnecessarily difficult.

The roadmap may evolve.

Any material change to product direction or architecture should be recorded in `DECISIONS.md`, and the current next step should be reflected in `PROJECT-STATE.md`.
