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

---

## DEC-016 — The conformance harness is a required check

- **ID:** DEC-016
- **Date:** 2026-08-20
- **Status:** ACTIVE

**Decision**

The Alk V2 conformance harness (`tools/conformance/run-conformance.py`) is a **required
check**. No change to the engine, to the fixture corpus, to the invariant set, to the
reason-code catalogue or to the data contract merges unless the harness passes.

The mutation harness (`tools/conformance/run-mutations.py`) is required alongside it, and
for the same reason: a suite that has never been shown to fail is not a gate. A change
that adds a checker adds its negative control in the same change.

The harness is red today, and that is the correct reading of the repository's state:
there is no engine, so every executable fixture fails as `ENGINE_ABSENT`, and three
mechanical checks report pre-existing defects in the alk-v2 documents. "Required" means
the gate must pass before an engine change merges; it does not mean the repository is
green now.

**Rationale**

The repository held 160 fixtures and 60 invariants with no way to execute any of them.
Every claim about correctness was therefore a review opinion, and `CLAUDE.md` already
prefers a deterministic test to prose review. A gate that can be skipped is a gate that
will be skipped on the change that most needed it, which is why this is recorded as a
decision rather than left as a habit.

Canon `CORE-CANON-COVERAGE-001` item 9 already carries the governing principle for the
mutation half: no checker is trusted as a gate until a deliberate mutation of the defect
class it targets has been shown to fail it.

**Consequences**

- The harness runs on every change that touches the engine or the alk-v2 package, and its
  real output — not a summary of it — goes into the run record.
- **"Required" is a comparison, not an absolute.** The gate must run, its real
  output must be in the pull request, and no subject may fail at head that passed at
  the base commit. A subject failing at both is pre-existing and is named, not blocked
  on. The mutation harness has no such allowance: it compares against its own baseline
  internally and must be green. A rule no change could satisfy would be waived on the
  change that most needed it, which is this decision's own rationale.
- `/implement`, `/implement-chemistry` and `/pr-gate` all name it. A run that did not run
  it says so and says why.
- A new checker without a negative control is an incomplete change, and the control must
  be shown to fire **for the mechanism it names**. A sabotage that turns something else
  red is not a demonstration; the mutation harness enforces this and reports
  `NOT CAUGHT BY ITS NAMED MECHANISM` when it happens. This is not hypothetical — the
  first version of this harness published a control that passed for the wrong reason
  while the checker it claimed to guard could not fire at all.
- This decision does not by itself configure any CI enforcement. Enforcement on GitHub
  depends on branch protection, which is `OD-001` and still open. Until then this is
  process discipline like everything else in this repository, and
  `docs/process/AUTONOMY-AND-CONTROLS.md` governs what that is worth.

---

## DEC-017 — `jake` runs after the reviewer sequence, not within it

- **ID:** DEC-017
- **Date:** 2026-08-20
- **Status:** ACTIVE

**Decision**

`jake` is **not a reviewer**. He sorts what the reviewers produced. He therefore runs as a
post-processing step **over the output of** a review sequence, never as a stage inside
one.

Specifically, `/implement-chemistry`'s reviewer sequence stays exactly as it is —
fixtures and invariants, then `canon-conformance-auditor` and `breaker` concurrently,
then one fix pass — and remains closed to extension. `jake` runs after that sequence has
finished, on its combined findings, and before the pull request is opened.

**Rationale**

`/implement-chemistry` says "This sequence is fixed. Do not shorten it and do not extend
it." The agent roster's composition table described the same workflow as running two
further agents inside it. Both statements could not be true, and the roster is not the
authority on what a skill runs.

Resolving it by relaxing the skill would have removed the only guarantee the fixed
sequence provides. Resolving it by dropping `jake` would have lost a distinct and useful
question — whether a finding matters to the person using the product — which no reviewer
asks. Neither was necessary, because `jake` is not a reviewer: he consumes finished
reports and produces an orthogonal label. A step that runs strictly after a sequence, on
its output, does not extend that sequence.

**Consequences**

- `.claude/skills/implement-chemistry/SKILL.md` states that the *reviewer* sequence is
  fixed, and carries `jake` as an explicitly separate post-sequence step.
- `docs/process/AGENT-ROSTER.md`'s composition table matches what the skills actually
  run, rather than describing a composition no skill implements.
- `jake` still changes no severity and closes no finding; `DEC-017` is about ordering,
  and the roster remains the authority on what he may do.
- The placement of this entry in the ledger was directed by the owner. It does not
  resolve `OD-002` (whether the ledger covers process architecture), which stays open.

---

## DEC-018 — `normal-operation-reviewer` is a specialist trigger, not a standing stage

- **ID:** DEC-018
- **Date:** 2026-08-20
- **Status:** ACTIVE

**Decision**

`normal-operation-reviewer` is wired into `/implement` and `/pr-gate` as a **specialist
trigger**, on the same footing as the other specialists there: it is added when the change
materially touches trend, dose, retest or user-visible output behaviour, and a run states
whether it added it and why.

It is **not** added to `/implement-chemistry`'s fixed reviewer sequence by this decision.

**Rationale**

The owner's instruction was to wire it into `/implement` and `/pr-gate`, and that is what
this does. `/implement-chemistry`'s sequence is closed to extension (`DEC-017`), and
`normal-operation-reviewer` — unlike `jake` — *is* a reviewer, so adding it there would be
an extension of exactly the kind the fixed sequence forbids. Adding it anyway, on the
strength of a roster row that has now been corrected, would have been the quiet
extension this repository is built to catch.

Whether chemistry work should also get an ordinary-use review is a real question and a
reasonable one. It is raised as `OD-004` rather than answered here.

**Consequences**

- `/implement` step 5 and `/pr-gate` step 2 both list it, with its trigger.
- Chemistry work reaches it only if the session runs `/implement` rather than
  `/implement-chemistry`, which is the gap `OD-004` names.

---

## DEC-019 — One executable gate; the freeze validator is retired

- **ID:** DEC-019
- **Date:** 2026-08-20
- **Status:** ACTIVE

**Decision**

There is **one executable gate**: the conformance harness
(`tools/conformance/run-conformance.py`, with `run-mutations.py` as its negative-control
set). It owns everything mechanically checkable in this repository.

`docs/implementation/alk-v2/validate-freeze-5.py` is **retired and deleted**. Its unique
coverage was moved into `tools/conformance/harness/package_checks.py` first, and the
retirement happened only after every absorbed check had been demonstrated red under a
mutation in `run-mutations.py`.

`docs/implementation/alk-v2/recompute-goldens.py` is **not** affected. It is a recorder,
not a gate — it exits 0 whatever it finds — and it answers a different question. Nothing
in this decision makes it authoritative.

**Rationale**

The owner took this decision; it is recorded here rather than settled here.

The reason it was put is canon `MASTER RULE 1`: two implementations of one rule that
agree today are a defect, not a coincidence, because one will drift and nothing will
notice. Two gates were checking overlapping properties — the fixture index, reason-code
closure, coverage of ACTIVE rules — and the conformance harness's own rebase report
flagged the overlap and declined to duplicate what it could see the other gate already
doing. Declining is the right instinct and the wrong resting place: it left three
invariants (`INV-I8`, `INV-I9`, `INV-I10`) owned by a gate that nothing else ran, and
left an open question standing where a decision belonged.

**How it was done, because the sequence is the point**

Retiring the validator before absorbing it would have silently dropped canon coverage.
That is the failure this project has hit repeatedly, so the order was fixed and is on
the record in `docs/process/GATE-CHECK-INVENTORY.md`:

1. Inventory both gates and classify every check `DUPLICATE`, `UNIQUE_TO_FREEZE`,
   `UNIQUE_TO_HARNESS` or `SUPERSEDED`, before moving anything.
2. Move every `UNIQUE_TO_FREEZE` check, each arriving with a negative control in the
   mutation set that names the mechanism its failure text must contain.
3. Only then delete, and account for every check that existed before and does not exist
   now.

**Consequences**

- The harness now reads the canon, the open-issues register and the algorithm contract.
  It did not before, and `CHK-INDEX-INTEGRITY`'s docstring saying it does not read the
  canon is now true only of that one check.
- `INV-I8`, `INV-I9` and `INV-I10` are delegated to `CHK-DECISION-COVERAGE`,
  `CHK-CANON-MANIFEST` and `CHK-FIXTURE-ARITHMETIC` and executed in full. The
  `OWNED_BY_PACKAGE_GATE` accounting reason is gone, because nothing is owned by a
  package gate any more.
- Eight of the validator's 437 checks were deliberately not carried across: five were
  duplicates the harness already had and three were weaker than the harness's
  equivalent. Each is named, with what it dropped, in the inventory.
- One absorbed check, `CHK-CANON-CONSTANTS`, has no document mutation. Its subject is
  the canon at a pinned git commit, which no mutation of the working tree can reach. It
  carries an inline negative control instead and `D-13` is recorded `BLOCKED` with its
  unblocking condition, rather than a control being faked for it.
- This decision is about which tool runs. It sets no chemistry behaviour: nothing here
  changes what the engine must do, and no absorbed check is cited by a runtime.

  **A claim made here in the first draft was false and is corrected rather than
  deleted.** It said that "none of the absorbed checks introduces a threshold, rail or
  equation of its own — every value they assert is read at run time from the canon or
  the corpus." `test-engineer` measured roughly twenty transcribed numeric literals in
  `package_checks.py`: `0.50` (the R_down rail), `1.28` (the slope-support k), `1.0`
  (the advisory offset), `30` (the testing-episode window), and `11.2`, `10.8`, `0.0693`
  inside one recomputation. Every one arrived verbatim with the absorbed logic; none was
  introduced by this decision. The claim was still wrong.

  Two classes are worth telling apart, and the first draft flattened them:
  a gate that **asserts** a number canon owns goes stale at every reissue and must be
  hand-edited — that is why the inventory dropped the `76` invariant-count pin. A gate
  that **recomputes** a fixture's stated intermediates from the inputs that same fixture
  declares is doing self-consistency arithmetic, and the constants in it are the
  arithmetic, not an expectation. Most of the twenty are the second kind. That does not
  make them harmless: they will still need editing if canon reissues the rail or the
  window, and they are unmarked.

  Whether "no transcribed number inside a gate" is a rule or a preference — and whether
  `CLAUDE.md`'s chemistry clause reaches a gate assertion at all or only runtime
  behaviour — is **not settled by this entry**. It is raised for the owner as `OD-005`
  and the literals are left as they are, because de-literalising 400 absorbed assertions
  by hand is precisely how coverage gets lost quietly.

---

## DEC-020 — An engine path is not complete until its fixtures execute and its mutations turn them red

- **ID:** DEC-020
- **Date:** 2026-08-21
- **Status:** ACTIVE

> Recorded as `DEC-019` when it was written. `DEC-019` was taken by the gate
> consolidation, which merged first; this entry was renumbered on rebase. The
> decision is unchanged — only its number moved.

**Decision**

A unit of engine work — an engine path, in the sense of the owning module named by
`traceability/alk-v2-traceability.json`'s `owner` column — is **not complete** until:

1. every worked-example fixture attached to that path is executable, meaning the
   conformance harness can build `(eventLedger, configurationHistory, asOf)` from it
   without inventing anything; **and**
2. those fixtures pass against the engine; **and**
3. a deliberate mutation of a rule the path owns turns them red, and the failure text
   names the mechanism the mutation claims to guard.

Conversion of fixtures to the executable form (`fixtures/EXECUTABLE-FIXTURE-FORMAT.md`)
therefore rides along with implementation, one path at a time. It is part of building
the path, not a separate tidying task to be scheduled afterwards.

Clause 3 is not satisfied by a generic control. A numeric-drift or dropped-reason-code
mutation turns almost any fixture red and demonstrates only that the comparator
subtracts. The mutation must attack a rule the path actually owns.

**Rationale**

The corpus holds 204 fixtures and, before this decision, 6 executed. The other 198 were
not wrong — they hold real worked reasoning — but they were written for a human reader
before any engine or interface existed, so no machine could check them.

Two ways to close that gap were available. Convert the corpus in bulk, or attach
conversion to implementation. Bulk conversion would mean writing event ledgers for
engine paths that do not exist, deciding what a fixture meant in order to convert it,
and producing a large body of tests for behaviour nobody has implemented — most of it
unverifiable at the time of writing and some of it wrong.

Attaching conversion to implementation yields the invariant the owner wants: **every
executable path has executable fixtures.** There is never a partially converted mess,
because the unconverted fixtures are exactly the ones whose engine paths do not exist
yet. The backlog stops being a pile and becomes a map.

Clause 3 restates `CORE-CANON-COVERAGE-001` item 9 — no checker is trusted as a gate
until a deliberate mutation of its defect class has been shown to fail it — and applies
it to fixtures rather than only to the harness's own checks. A fixture that has never
been shown to fail has not been proven; it has only been observed not to complain.

**Consequences**

- Every engine brief inherits this rule without anyone remembering to state it. It is
  written into `.claude/skills/implement-chemistry/SKILL.md`, which governs chemistry
  implementation.
- The conformance harness reports conversion coverage **per engine path**, so a
  completed path can be shown complete and the outstanding fixtures are visibly
  attached to paths that do not exist yet. `6 of 204` is a true number that tells the
  owner nothing; per-path coverage tells them where the work is.
- A path whose fixtures cannot be converted is **blocked, not exempt**. Where the
  blocker is a missing input the canon does not state, it is raised as an open owner
  decision and the path does not proceed on a guess. `OD-008` is the first of these and
  currently blocks roughly forty fixtures.
- This decision sets no chemistry. It governs when work is *finished*, not what any
  rule *is*; every threshold, band edge, rail and equation remains the canon's.

**What this does not say**

It does not require the whole corpus to be converted, and it does not make an
unconverted fixture a defect. An unconverted fixture whose path is unbuilt is the
expected state.

---

## DEC-021 — The default assessment instant of a worked golden is its last reading

- **ID:** DEC-021
- **Date:** 2026-08-21
- **Status:** ACTIVE
- **Closes:** `OD-008`

**Decision**

Where an executable fixture states no assessment instant, `asOf` **is the instant of the
last `READING` in its own event ledger**. A fixture that states its own `asOf` continues
to use it; the stated value always wins.

The rule is stated, not observed. It applies because it is written here, not because six
fixtures happened to do it.

Three consequences follow immediately and are part of the decision:

1. The executable fixture format no longer forbids a conversion from supplying `asOf`.
   Supplying it under this rule is not a judgement about what the fixture meant, so it is
   not listed in `conversion.suppliedByConversion` as a decision; it is recorded as the
   rule being applied, under `conversion.asOfSource: "DEC-021"`.
2. The conformance harness derives the instant rather than refusing. A fixture whose
   `asOf` was derived is **named as such** on its own line and in the report, so a derived
   instant never reads as a stated one.
3. The rule needs a *reading* to point at. Where a ledger holds no `READING` carrying an
   absolute instant, there is no "moment of the last reading" and the rule does not apply.
   Such an input was never an event ledger in the first place, and the harness now says so
   (see **Consequences** below).

**Rationale**

The engine is one pure function of `(eventLedger, configurationHistory, asOf)`. A fixture
that supplies two of the three arguments is unsubmittable, and `OD-008` recorded that this
blocked roughly forty reading-series fixtures — the single largest obstacle to the corpus
being machine-checkable.

The convention matches the application's own behaviour, which is the reason to prefer it
over the alternatives: a reading is entered and the assessment is produced immediately.
The assessment instant of a worked example is therefore the instant of its last reading
for the same reason it is in the app — that is when the assessment happens. It also
matches all six fixtures that state an instant, six times out of six, which is corroboration
rather than the argument.

The two alternatives were worse. Requiring every fixture to state its own instant means
forty hand edits, each a small judgement about what that fixture meant — the very thing
`EXECUTABLE-FIXTURE-FORMAT.md` §5 forbids a conversion from making. Leaving it open means
the engine is built against a corpus that cannot check it.

**Consequences**

- `fixtures/EXECUTABLE-FIXTURE-FORMAT.md` §2, §5 and §10 change: `asOf` moves from "a
  conversion may never supply this" to "supplied by this stated rule where the fixture
  omits it".
- `tools/conformance/harness/corpus.py` derives the instant and marks the fixture
  `asOfDerived`. `CONFORMANCE-HARNESS.md`'s `NO_ASOF` class survives but is now reached
  only by a ledger with no absolute-timed reading.
- **An `input.events` array is an event ledger only if its events carry the absolute-time
  fields the format declares.** The six fixtures previously classed `NO_ASOF` write
  `atDay: 0` / `fromDay: 1`, not `measuredAt` / `effectiveAt`; they are scenario
  descriptions in event-shaped clothing and are now classed `ABSTRACT_INPUT`, which is what
  they always were. Without this, applying the default instant would have "converted" six
  fixtures whose events no engine can read — turning a refusal into a silent, wrong pass.
  That is the same hazard `corpus.check_declared_document_type` exists to close, arriving
  through the other door.
- This decision sets no chemistry. It fixes the third argument of a test harness. Every
  threshold, band edge, rail and equation remains the canon's.

**What this does not say**

It does not say that an assessment may only be triggered by a reading, and it does not
constrain the application's `asOf` at runtime — the application passes its own instant
through `ClockPort` as it always did. It is a rule about fixtures.

---

## DEC-022 — The retest decision's output vocabulary is the fixtures'

- **ID:** DEC-022
- **Date:** 2026-08-21
- **Status:** ACTIVE
- **Closes:** `OD-012`

**Decision**

`ALK-V2-DATA-CONTRACT.md`'s `RetestDecision` is extended to declare the vocabulary the
five converted retest fixtures assert. `OD-012`'s option 1. The fixtures are frozen
`ALK_V2_FREEZE_5` content and cannot move; the contract can, and does.

The extension is exhaustive and is listed in the contract itself. Nothing was added that
`AD-RET-001`…`AD-RET-005` do not assert, and no retest behaviour was designed: every
value the new fields carry is produced by `ALK-RETEST-SCHEDULER-001` as already frozen,
stated in the unit the fixtures state it in.

**Rationale**

Converting the five fixtures made an inert disagreement binding. Against an engine
implementing the contract as written, every one of their retest assertions resolves to
*"no field of that name in the engine result"* and all five fail. They passed only because
the echo oracle replays each fixture's own expectations back at it.

Option 2 — restating the fixtures in the contract's names — needs a governed canon reissue
to edit frozen expectations, and buys nothing the extension does not. Option 3 — a declared
mapping — adds a third artefact and a second owner of one inference, which `MASTER RULE 1`
calls a defect.

**Consequences**

- Two field names in the contract had to be *disambiguated*, not merely added, because the
  by-name resolution the harness uses (`compare.compare_by_name`, justified by `INV-B7`)
  breaks when one name carries two values in one result. Both are recorded in the contract
  where they happen and reported in full by the run that made the change.
- This decision sets no chemistry. It says what the engine's retest output is *called*.

**What this does not say**

It does not settle whether a retest interval should be carried in hours or in instants as
the primary form. Both are declared: the instants remain the decision, and the hour-valued
fields are the scheduler's own audit arithmetic, which is what the fixtures check.

---

## DEC-023 — `OD-012`'s answer applies to the rest of the corpus, one field at a time

- **ID:** DEC-023
- **Date:** 2026-08-21
- **Status:** ACTIVE

**Decision**

`OD-012` asked which vocabulary owns the retest decision, the data contract's or the
frozen fixtures'. The owner answered: the contract moves. **The same answer applies
wherever the same collision appears**, under three conditions, all of which must hold:

1. a frozen fixture asserts the name;
2. it names a quantity the engine already computes on a path that is built;
3. it does not contradict a declared name that means something else.

A name failing condition 2 or 3 is **not** bridged. It is recorded as an open question
with the fixtures that assert it, and its fixtures stay unconverted or red. In
particular a name that is a second spelling of a declared quantity is a collision, not
an omission, and adding it would put two names on one meaning — which is what `INV-B7`
forbids and what `compare.compare_by_name` breaks on.

Every field added under this decision is listed in the data contract at the place it was
added, with the fixtures that forced it.

**Rationale**

Building the first engine turned an inert disagreement into a measurable one across the
whole corpus, not just the retest path: the fixtures assert roughly 553 field names and
the contract declares about 40. Most of the gap is fixtures asserting intermediate
working, and much of that working is a quantity the engine genuinely has.

Answering each instance as a fresh question would put the same decision in front of the
owner a dozen times. Answering none of them would leave built paths with no executable
fixtures, which `DEC-020` calls incomplete. The three conditions are the line the owner
already drew in `OD-012`: extend the contract to carry what the fixtures assert, and do
not invent a vocabulary to bridge a gap.

**Consequences**

- Five fields were added under this decision in the run that recorded it —
  `ObservedTrajectory.madDkh`, `ObservedTrajectory.pairwiseSlopesSorted`,
  `DoseRecommendation.towardRangeHoldApplied`,
  `DoseRecommendation.fiftyPercentCapUnlocked` and
  `DoseRecommendation.returnPlanOffer` — each named in the contract with the fixtures
  that forced it.
- `madDkh` arrives carrying a collision it did not create: `MeasurementCluster.madDkh`
  is a different quantity under the same name. Only one is emitted today. The clash is
  recorded rather than resolved, because resolving it means renaming one of them and
  that is a governed reissue.
- This decision sets no chemistry. It says what the engine's outputs are *called*.

**What this does not say**

It does not licence adding a field because a fixture would then pass. Condition 2 is the
guard: the quantity must already exist in the engine for a reason the canon states. A
field invented to satisfy a fixture is the fixture writing the engine, which is the
inversion this repository exists to prevent.

---

## DEC-024 — The application's interface is V1's, and it brings V1's toolchain with it

- **ID:** DEC-024
- **Date:** 2026-08-21
- **Status:** ACTIVE

**Decision**

The V2 interface is replaced by V1's, ported from V1 source rather than
reimplemented. Because V1's interface is React, the repository now carries a
Node toolchain — React, recharts, Vite, Tailwind and PostCSS — and the
application is built rather than served as hand-written ES modules.

`engine/`, `docs/canon/` and `tools/conformance/` are untouched by this and
remain byte-identical. So does V2's storage: the append-only event ledger,
stored assessments with their version stamps, the configuration history and the
import.

**Rationale**

The owner used the V2 interface and rejected it. The instruction was to bring
V1's across, and — the load-bearing part — to bring it across as *code*:

> Previous briefs said "port from V1 source, do not reimplement." Nothing
> checked it ... so the build wrote its own version of everything and the
> result was worse than the thing it replaced.

A port that is checkable line by line is only possible if the ported files stay
comparable to their originals. Translating V1's JSX into V2's vanilla-DOM idiom
would have made every line a difference, which is a reimplementation wearing a
port's name — exactly what failed before.

So the toolchain follows the code. It is a consequence of the decision to port,
not a preference about frameworks.

**What makes it checkable**

`docs/migration/PORT-MANIFEST.md` records, for every file taken from V1, the V1
path and commit, the SHA-256 of the original and of the ported file, and the
complete diff with a reason on every hunk drawn from a fixed vocabulary.
`tools/port/check-port-manifest.mjs` reverse-applies the recorded diff to the
ported file and hashes the result: if it equals the recorded V1 hash, the diff
is the whole truth about the difference. It needs no V1 checkout to run.
`tools/port/mutate-manifest.mjs` proves each arm of that check can fail.

**Consequences**

- `npm install` is required to run or build the application. The lockfile is
  committed; `node_modules/` and `app/dist/` are not.
- Vite's root is the **repository**, not `app/`. `app/src/engine/worker.js`
  resolves the engine's own files three directories above itself; serving the
  repository root is what keeps that true. The alternative was editing the
  engine boundary to suit the build, which is the wrong way round.
- The Python runtime stays an uncommitted, hash-verified artefact
  (`tools/app/vendor-runtime.py`) and is declared external to the build and
  served raw in development. Nothing about the engine boundary changed.
- **The offline shell was lost.** `app/sw.js` precached a hand-written list of
  files that no longer exist. Regenerating it from a hashed bundle is real work
  and is recorded as open in `docs/migration/PORT-OMISSIONS.md`.
- `tools/app/smoke.mjs` and `tools/app/check-moment-timings.py` are superseded
  and say so; the second is superseded by the manifest, which is stronger.
- The bundle is about 233 kB gzip. V1's own note that it "measured 288.5 kB
  gzip against a 180 kB budget, and Recharts is the bulk" still applies, and
  the budget is still not met. Recorded, not resolved.

**One thing the first version of this entry got wrong**

It said the storage layer was untouched. Three files in it changed:
`store/schedule.js` regained V1's `recent` bucket, `assess.js` moved
`describe()` out of the storage try — an engine that could not start was being
reported as a record that could not be read — and gained an injection point so
canon §64's version stamping could be tested. Only `engine/`, `docs/canon/` and
`tools/conformance/` are byte-identical.

**What this does not say**

It does not make the interface authoritative about anything. Canon `X-INV-004`
and `DEC-003` are unchanged: the domain engine owns chemistry, and
`tests/app/test-port.mjs` `PORT-01`…`PORT-04` fail if any interface file names
a V1 classifier, holds a member of the engine's decision vocabulary, or
compares a reading to a band edge.

---

## DEC-025 — The conformance harness carries owner decision 30's silence, and executes the invariants that pin it

- **ID:** DEC-025
- **Date:** 2026-08-21
- **Status:** ACTIVE

**Decision**

Owner decision 30 amends `SHARED-LEGACY-TIME-001` so that a reading lacking a usable instant
is **silently** ineligible for elapsed-time inference. That amendment is chemistry and lives
in `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` Part II §2.3A.1 and §2.3A.2, where the
freeze, the fixture coverage and the reissue path apply to it. **This entry decides nothing
about that behaviour and must not be read as authority for it.** It records the three
technical-architecture consequences in the harness, which are this ledger's scope.

1. **The corpus's "is this an event ledger" test reads the two wire fields the amended data
   contract added.** `corpus._looks_like_event_ledger` required every event to carry one of
   five absolute-time fields. Under `AI-008`'s resolution a `DATE_ONLY` record carries
   `calendarDate` and a `LOCAL_TIME_ZONE_UNKNOWN` record carries `localDateTime`, and
   **neither carries an absolute instant** — that is the point of the resolution. Such a
   ledger is readable and now classifies `EXECUTABLE`.

   `_DECLARED_DAY_FIELDS` is declared **apart from** `_ABSOLUTE_TIME_FIELDS` rather than
   added to it, because two different questions are asked of that tuple and only one answer
   changed. *Is this a ledger an engine can read?* — yes. *Is there an instant here?* — no,
   and `default_as_of` must keep answering no, or `DEC-021` would derive an assessment
   instant from a day nobody stated a time for, which is the fabrication the amendment
   forbids. A fixture whose ledger holds no absolute-timed reading therefore states its own
   `asOf`, and `AD-TIME-002` is the first that does.

2. **`INV-I7` becomes executable.** It says "no retired reason code is emitted" and was
   registered `NO_ENGINE_BEHAVIOUR`. An engine exists, so the reason no longer holds. It
   sweeps **every string in the whole result**, not `reasonCodes[]` alone: a capability
   row's `capabilityReasonCode` is an emitted code too, and reading only the top-level array
   is how a retired `CAPABILITY_` code could return through `capabilities[]` unseen —
   demonstrated by mutation `E-28`.

3. **`INV-H6` is added and is executable.** `INV-H1` pins what is *stored*; `INV-H6` pins
   what is *said*, which is the failure every surface reproduced. Every subject it checks is
   read out of the fixture's own input — the provenance tokens the fixture supplied, the
   days its untimed records state, their event ids — so it transcribes no vocabulary and
   keeps testing the right thing across a vocabulary change.

**Rationale**

`DEC-016` makes the harness a required check and `CLAUDE.md` requires the harness to
transcribe nothing. A silence is harder to test than a statement: the obvious check is a
list of forbidden strings, and a transcribed list drifts the moment the vocabulary moves,
passing while checking nothing. Deriving every subject from the fixture's own input is what
makes the check survive its own catalogue.

The second half of `INV-H6` — that the result must not name the records it *did* use either
— is not padding. A per-record provenance channel names the ineligible records by omission,
so retiring only the two negative codes would have left the surface able to reconstruct
exactly the list the owner asked never to be produced. That is why all four
`TIME_PROVENANCE_*` codes are retired and not just the two.

**Consequences**

- `tools/conformance/harness/corpus.py`, `invariant_checks.py`, `package_checks.py` change.
- `tools/conformance/mutations/engine_mutations.py` gains `E-28` … `E-31`, one per way the
  announcement could come back: the capability degradation, the validation refusal, position
  over-applying the exclusion, and a fabricated midnight instant. All four are caught, each
  via the mechanism it names.
- `ORIGINAL_TARGETS` gains `alk_v2.capability:evaluate` and `alk_v2.ledger:_readings`, so
  those sabotages delegate to the real implementation rather than reimplementing it.
- `reference/echo_oracle.py`'s event sort key stops tie-breaking on the event's position in
  the submitted array and uses a content hash, matching `ledger._content_ordinal`. The array
  index made the oracle's own output depend on the ordering `INV-A1` exists to defeat; it had
  never shown because no fixture until `AD-TIME-002` held two events the key could not
  separate. The control that names `INV-A1` — `M-1` — was itself disabled by the defect,
  since a subject already failing at baseline cannot be turned red by a mutation.
- The gate's absolute verdict is unchanged in kind: `CHK-RC-CATALOGUE`'s `CAPABILITY_`
  coverage line is closed as a side effect of restating a count that had to change anyway,
  and its `SAFETY_` line is a pre-existing defect that stays open and is out of scope here.
