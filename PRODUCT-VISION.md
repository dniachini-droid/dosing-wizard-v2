# Dosing Wizard — Product Vision

## Purpose

Dosing Wizard is a reef-aquarium management platform designed to turn raw tank observations, chemistry measurements, dosing history, interventions and husbandry events into a coherent, auditable plan for managing the aquarium.

The product must not be a collection of disconnected calculators or generic AI advice. Its central value is a deterministic reef-management system whose recommendations can be reproduced, inspected and tested.

## Product pillars

### 1. Deterministic reef chemistry engines

Each supported parameter has its own scientifically appropriate domain engine.

The engines separate:

- raw observations;
- measurement validity and uncertainty;
- interventions and dose events;
- observed trajectory;
- supported trajectory;
- maintenance recommendations;
- intentional correction or return plans;
- safety constraints;
- retest scheduling.

Alkalinity is the first fully specified V2 controller.

Calcium, magnesium, phosphate, nitrate, salinity, ammonia, pH, trace elements and other future domains must be scientifically revalidated rather than copied from V1 or cloned from alkalinity.

### 2. Whole-tank coordinator

Individual parameter engines must not independently produce a pile of conflicting recommendations.

A higher-level coordinator will combine supported domain states, known tank events and intervention context into one coherent action plan.

It must distinguish:

- known relationships;
- supported tank-state conclusions;
- plausible context;
- unsupported speculation.

The coordinator must never manufacture causal explanations merely because they sound plausible.

### 3. Reef calculator platform

Dosing Wizard will include a comprehensive calculator library for common reef-keeping calculations.

This is expected to include:

- alkalinity corrections;
- calcium corrections;
- magnesium corrections;
- Balling / two-part / three-part systems;
- manufacturer-specific dosing products;
- Coral Essentials and other trace-element systems;
- stock-solution preparation;
- alkalinity, calcium and magnesium solution mixing;
- dilution and concentration calculations;
- salinity corrections;
- water-change calculations;
- nutrient dosing;
- nitrate supplementation;
- phosphate-removal treatment calculations where appropriate;
- dosing-pump calibration;
- consumption-to-dose conversion;
- solution-strength back-calculation;
- tank-volume and unit conversions;
- ICP correction calculations where scientifically justified.

Calculator arithmetic is separate from advisory logic.

A calculator may answer:

"How much Product X raises 100 L by 0.5 dKH?"

The advisory engine separately decides:

"Should this tank be raised by 0.5 dKH now?"

Brand and product formulas must be versioned and sourced from authoritative manufacturer information rather than guessed or copied from arbitrary web calculators.

### 4. Tank-management workflow

The product will support the practical work of maintaining a reef tank, including:

- chemistry logging;
- dose-change logging;
- intervention logging;
- water changes;
- husbandry events;
- history;
- charts;
- calendar;
- tasks and reminders;
- retest scheduling;
- ICP records;
- equipment and configuration;
- audit history;
- deterministic replay;
- backup and migration.

The app should minimise friction at the aquarium. Important UX principles include logging directly from due-test reminders and asking users for facts rather than asking them to make scientific judgements the product should own.

### 5. Paid installable web application

The intended first public distribution target is a paid installable web application / Progressive Web App.

The product name is:

Dosing Wizard

The repository name may contain "v2" for development-history clarity; the customer-facing product does not.

The public product should be designed for:

- mobile-first use;
- iPhone Home Screen installation;
- desktop/web use;
- offline-capable core workflows;
- secure user accounts;
- subscription/payment entitlement;
- cloud backup and sync where appropriate;
- multiple devices;
- multiple tanks where appropriate;
- schema migration and long-lived user data;
- future native clients if justified.

V1's former "no accounts, no sync, no cloud dependency" policy is historical context, not V2 product policy.

Offline functionality remains important, but it must coexist with a public-account and data-durability strategy.

### 6. Optional AI assistant

AI may be added as an interface layer above the deterministic system.

Potential features include:

- "Ask My Tank";
- explanation of deterministic recommendations;
- history summaries;
- natural-language queries;
- natural-language logging with confirmation;
- onboarding assistance;
- explanation of calculator results;
- structured ICP assistance;
- surfacing relevant tank history.

AI is not the authoritative chemistry engine.

It must not invent or override dosing advice when the deterministic engine says HOLD, NOT_RUN, insufficient evidence, unsafe, or otherwise refuses an action.

The authoritative path is:

Tank facts
→ deterministic domain engines
→ whole-tank coordinator
→ structured action plan
→ optional AI explanation

Not:

Tank facts
→ language model
→ invented dosing recommendation

The core product must remain useful if the AI service is unavailable.

## Scientific and engineering principles

Dosing Wizard should be:

- deterministic where chemistry decisions are made;
- auditable;
- reproducible;
- explicit about uncertainty;
- explicit about missing evidence;
- honest about capability limitations;
- resistant to unsupported causal storytelling;
- safe under incomplete or contradictory inputs;
- testable through golden, adversarial and long-run simulations;
- based on current science and authoritative product information;
- designed so that one rule has one authoritative owner.

When evidence cannot support an action, the system should refuse or hold rather than manufacture precision.

## V1 relationship

V1 is a reference and salvage source, not a runtime dependency and not the architecture for V2.

Preserve:

- hard-won reasoning;
- failure cases;
- user journeys;
- useful UX concepts;
- selected generic infrastructure ideas;
- test methodologies;
- decision provenance.

Do not inherit:

- V1's overloaded chemistry architecture;
- scattered classifiers;
- first-match wizard state machine;
- duplicate rule ownership;
- surface-specific chemistry;
- unsupported scientific thresholds;
- historical implementation quirks merely for backwards compatibility.

## Development strategy

Build in stages.

The first usable system will establish the shared V2 foundation and a complete alkalinity domain while calcium and magnesium may initially remain measurement-only.

Additional chemistry domains are added after independent scientific revalidation.

Whole-tank coordination, the calculator platform, commercial product infrastructure and AI are first-class roadmap workstreams, but they must be layered onto a correct deterministic foundation rather than used to conceal missing domain logic.

## Ultimate goal

Dosing Wizard should become a reef-management product that serious reef keepers trust because it does more than store numbers or generate plausible advice.

It should know what the evidence supports, know what it does not support, explain the difference, and turn the state of the entire aquarium into a coherent plan.
