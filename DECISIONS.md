# Dosing Wizard V2 — Decision Ledger

This ledger is **append-only**.

Decisions are not deleted or rewritten. A decision that no longer holds is superseded by
a new entry whose ID is higher, and the old entry's status is changed to `SUPERSEDED`
with a pointer to its replacement. The historical text stays as written so that the
reasoning behind past choices remains inspectable.

Scope: product and architecture decisions. Chemistry behaviour is owned by the frozen
canon in `docs/canon/`, not by this ledger.

Status values: `ACTIVE`, `SUPERSEDED`, `WITHDRAWN`.

---

## DEC-001 — V2 is a fresh repository

- **ID:** DEC-001
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Dosing Wizard V2 is developed in a fresh repository. V1 is not a runtime dependency, and
there is no required V1/V2 compatibility mode.

**Rationale**

Continuing inside V1 would carry its architecture forward by default. A fresh repository
makes every inherited element an explicit, reviewable choice rather than an accident of
history. No compatibility contract is owed to V1, because V1 has a single user who
continues to run it independently.

**Consequences**

- V2 may define data shapes, naming and semantics without preserving V1's.
- Anything worth keeping from V1 must be deliberately salvaged and justified.
- No effort is spent on V1/V2 interoperability, dual-write or shared-schema work.
- V1 remains usable and untouched during V2 development.

---

## DEC-002 — V1 is reference/salvage material only

- **ID:** DEC-002
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

The V1 repository is read-only reference and salvage material. Knowledge is preserved
selectively; V1's analytical architecture is not inherited.

**Rationale**

V1 contains genuinely hard-won knowledge — failure cases, user journeys, decision
provenance, test methodology — that would be expensive to rediscover. It also contains
the overloaded chemistry architecture that motivated V2. Those two things must be
separated deliberately, because they live in the same repository.

**Consequences**

- V1 is never modified, and nothing is pushed to it.
- Salvaged material lands under `docs/v1-reference/` marked as non-authoritative.
- "V1 did it this way" is never sufficient justification for V2 behaviour.
- Each salvage candidate requires an explicit keep/adapt/discard disposition.

---

## DEC-003 — Deterministic engines are authoritative for chemistry

- **ID:** DEC-003
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Chemistry decisions are made by deterministic domain engines. Raw observations, evidence,
supported trajectory, action and UI remain separate concerns.

**Rationale**

Reproducibility, auditability and testability all depend on one authoritative,
deterministic path from facts to recommendation. Mixing observation, inference and
presentation is precisely what made V1's behaviour hard to test and hard to trust.

**Consequences**

- No UI component may recompute chemistry.
- Every recommendation must be reproducible by replaying its inputs.
- Uncertainty and missing evidence are first-class engine outputs, not UI copy.
- Engine outputs are structured data; presentation adapts, it does not decide.

---

## DEC-004 — Parameter engines are independently designed underneath

- **ID:** DEC-004
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Each parameter domain is designed on its own science beneath the shared foundation.
Future Ca, Mg, PO4, NO3 and other domains require independent scientific revalidation
rather than cloning the alkalinity engine.

**Rationale**

Alkalinity's evidence model, response timing and control behaviour reflect alkalinity's
chemistry. Other parameters differ in measurement uncertainty, buffering, response time
and whether continuous control is even meaningful. A generic Alk-shaped state machine
would manufacture false precision for parameters that do not behave like Alk.

**Consequences**

- Shared primitives are shared; domain semantics are not.
- Each new domain needs its own research pass and its own frozen canon before a
  controller exists.
- Some parameters may legitimately have no controller, no target or no trend.
- Domain rollout is slower, and each domain is defensible.

---

## DEC-005 — The product will eventually have a whole-tank coordinator

- **ID:** DEC-005
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

A whole-tank coordinator layer will combine domain states into one coherent action plan.
Individual parameter engines must not independently issue conflicting actions.

**Rationale**

A reef tank is one system. Independent engines each demanding a change on the same day
produces advice that is individually reasonable and collectively unsafe or unusable. The
coordinator must also decide what to hold steady while an intervention is in flight.

**Consequences**

- Domain engines expose structured state and candidate actions rather than final user
  instructions.
- Action priority, conflict resolution and retest ordering are coordinator concerns.
- Architecture must anticipate this layer even while only Alk is active.
- The coordinator must distinguish known fact, supported inference, plausible context and
  unsupported speculation.

---

## DEC-006 — Comprehensive reef calculators are a first-class product pillar

- **ID:** DEC-006
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

A comprehensive reef calculator library is a first-class product pillar. Calculator
arithmetic remains separate from advisory decisions. Manufacturer and product formulas
must be sourced and versioned.

**Rationale**

Calculators deliver standalone value and are useful even when no advisory engine applies.
They are also a different kind of claim: "how much does X raise Y" is arithmetic, while
"should this tank be raised now" is a judgement requiring evidence. Manufacturer formulas
change between product versions, so an unsourced constant is a latent defect.

**Consequences**

- Calculator results never silently become recommendations.
- Product formulas carry brand, product, version, source and source date as data.
- Calculators are independently testable against their sources.
- Formula updates are data changes, not code archaeology.

---

## DEC-007 — First intended public distribution is a paid installable PWA/web application

- **ID:** DEC-007
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

The first intended public distribution is a paid installable PWA/web application. Native
App Store distribution may follow later but is not required for first launch.

**Rationale**

A web-delivered installable app reaches mobile and desktop from one codebase, ships
updates without store review, and avoids native platform overhead before demand is
proven. Home Screen installation covers the primary at-the-aquarium use case.

**Consequences**

- Architecture research targets installability, offline core workflows, mobile-first use
  and web payment/entitlement.
- Platform capabilities unavailable to web apps must not become load-bearing.
- Native clients remain a later option that architecture should not preclude.

---

## DEC-008 — V1's "no accounts / no sync / no cloud dependency" policy is superseded

- **ID:** DEC-008
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

V1's policy of no accounts, no sync and no cloud dependency does not carry into V2.
Offline capability remains important, but V2 must be capable of supporting secure
accounts, durable cloud data and multi-device use if selected by later architecture work.

**Rationale**

That policy suited a single-user local tool. A paid public product must survive a lost
phone, a cleared browser and a second device, and paid entitlement requires identity.
Offline operation and durable cloud data are complementary, not alternatives.

**Consequences**

- Persistence design must not assume a single device or a single browser profile.
- Authentication, sync, conflict handling, backup/restore and deletion policy become real
  design problems to be settled during architecture research.
- Core workflows must still function offline.
- This decision permits, but does not by itself select, any particular cloud technology.

---

## DEC-009 — AI is optional, not a committed product requirement

- **ID:** DEC-009
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

AI is optional. If built, it exists only above the deterministic system. It may explain,
summarize, query and assist with confirmed structured information. It may not invent or
override chemistry recommendations, including `HOLD`, `NOT_RUN`, insufficient evidence or
refusals. The core product must be complete and useful without AI.

**Rationale**

The product's value is that its advice is reproducible and inspectable. A language model
permitted to generate chemistry advice would reintroduce exactly the ungoverned
plausibility the deterministic engines exist to eliminate. Explanation of a computed
state is a different and much safer job than producing the state.

**Consequences**

- The authoritative path is facts → engines → coordinator → action plan → optional AI
  explanation.
- A refusal or hold may be explained, never replaced with an alternative action.
- AI receives compact structured domain context rather than unrestricted raw history by
  default; credentials stay server-side.
- Every core workflow must degrade cleanly when AI is unavailable.

---

## DEC-010 — Historical owner data is preserved truthfully

- **ID:** DEC-010
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Historical chemistry readings, water changes, ICP panels and lighting records are
owner-confirmed genuine records and are preserved as such.

Older Alk/Ca/Mg maintenance-dose and dose-change history is materially incomplete.
Therefore old Alk/Ca/Mg readings may be used for history, display and reference, but not
for analyses requiring the missing dosing/intervention context — including consumption
inference, potency learning, dose-response reconstruction and historical controller
replay.

Missing times, timezones, dose history and intervention history are never manufactured.

**Rationale**

The measurements are real and worth keeping. What is missing is the surrounding
intervention context that turns a measurement series into evidence about consumption or
potency. Filling that gap by inference would produce confident conclusions built on
reconstructed facts, which is worse than having no conclusion.

**Consequences**

- Measurement truth and analytical eligibility are tracked separately.
- Records carry explicit time precision; date-only stays date-only.
- Engines must refuse analyses whose required context is absent, rather than degrade
  silently.
- Charts and history may show more data than the engines are permitted to reason over,
  and the product must be able to explain that difference.
- See `docs/migration/DATA-PROVENANCE.md` for the detailed record.

---

## DEC-011 — V2 real-use cutover uses a fresh dataset

- **ID:** DEC-011
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

The owner continues to use V1. When V2 is ready for real use, a fresh current
export/dataset will be obtained and that becomes the live migration baseline.

**Rationale**

V1 remains the owner's working system, so any dataset captured now is stale by the time
V2 is usable. Taking the baseline at cutover avoids reconciling a divergence that would
grow for the entire development period.

**Consequences**

- No dataset captured before cutover is treated as the migration baseline.
- Migration tooling must be written against the export format, not a one-off snapshot.
- The cutover point is an explicit event with its own verification.
- V1 keeps running, unmodified, until cutover.

---

## DEC-012 — V1 browser-storage implementation is not automatically V2 architecture

- **ID:** DEC-012
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

V1's browser-storage implementation is not carried forward by default. Lessons are
preserved; persistence and sync implementation is reassessed after public-PWA
architecture research.

**Rationale**

V1's storage choice followed from a local-only, single-device, no-accounts policy that
DEC-008 supersedes. Reusing it by momentum would embed retired constraints into the
public product's foundation.

**Consequences**

- Persistence is an open question until Phase 1 research concludes.
- Local-first behaviour, durability and sync are evaluated together, not separately.
- Familiarity with V1's storage layer is not an argument in that evaluation.

---

## DEC-013 — V1 test methodology is valuable; V1 outputs are not V2 authority

- **ID:** DEC-013
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

V1's test *methodology* is valuable and is rebuilt around V2 concepts —
threshold-straddling, adversarial, deterministic-replay and long-run testing. V1's
*outputs* are not V2 expectations.

**Rationale**

The methodology encodes real knowledge about where these engines break. The recorded
outputs, by contrast, include behaviour the canon intentionally changes and bugs V2 is
meant to fix, so treating them as expectations would re-enshrine both.

**Consequences**

- V2 goldens are derived from the frozen canon, not copied from V1 runs.
- Where V1 and V2 are compared, divergence is classified (intended change, V1 bug fixed,
  V2 regression, implementation bug, missing capability, not comparable) rather than
  auto-resolved toward V1.
- A V1/V2 difference is never by itself evidence of a V2 defect.

---

## DEC-014 — Unresolved V1 decisions are preserved rather than forced now

- **ID:** DEC-014
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Open questions inherited from V1 are recorded and left open. They are resolved only when
an authoritative V2 domain or surface owner exists.

**Rationale**

Deciding an open scientific or product question early, to make the ledger look complete,
produces an answer with no owner and no evidence behind it. Recording the question keeps
it findable at the moment someone is qualified to close it.

**Consequences**

- Unresolved items are documented with their context, not silently dropped.
- A question is closed by the domain or surface owner, with rationale, as a new decision.
- The absence of a decision is an acceptable, visible state.

---

## DEC-015 — Unsupported causal speculation is prohibited

- **ID:** DEC-015
- **Date:** 2026-08-19
- **Status:** ACTIVE

**Decision**

Unsupported causal speculation is prohibited across the product. This applies both to
deterministic product surfaces and to any future AI assistant.

**Rationale**

Plausible causal stories are the most persuasive way for a chemistry tool to be
confidently wrong. A keeper acting on an invented explanation may make a real change to a
real tank. Saying "the evidence does not support a conclusion" is a legitimate and
valuable product output.

**Consequences**

- The system must distinguish known fact, supported inference, plausible context and
  unsupported speculation, and must label which it is offering.
- Correlation is not presented as cause without evidence that supports the claim.
- Refusal and "insufficient evidence" are designed states with designed presentation.
- This constraint binds the AI layer identically; explanation may not become invention.
