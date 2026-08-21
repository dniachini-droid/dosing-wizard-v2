# Dosing Wizard V2 — Project State

This document records the *current* state of the project only.

It is deliberately short. Long-lived product direction belongs in `PRODUCT-VISION.md`,
sequencing belongs in `ROADMAP.md`, and irreversible choices belong in `DECISIONS.md`.

**`PROJECT-STATE.md` must be updated whenever the active phase, the next major step,
or the blockers materially change.** A stale project state is worse than no project
state, because it invites work to begin from assumptions that are no longer true.

---

## Project

Dosing Wizard V2

---

## Current phase

Phase 0 — Preserve and found V2

---

## Current status

- Fresh V2 repository created.
- V1 is a separate read-only reference/salvage source.
- `PRODUCT-VISION.md` exists.
- `ROADMAP.md` exists.
- Shared V2 architecture is frozen.
- Alk V2 canon is frozen, and reissued as `ALK_V2_FREEZE_5`.
- V1 salvage reconnaissance is complete, and **is now carried into V2 as documents**.
- The V1 agent/routine salvage audit is complete and recorded in
  `docs/process/V1-AGENT-SALVAGE-AUDIT.md`.
- The V1 **application** salvage inventory, the dataset-level **data provenance**
  record, the **unmigrated-V1-canon** record and the **open V1 owner questions** now
  exist under `docs/migration/`. Together with the agent/routine audit they complete the
  Phase 0 salvage deliverables. All four were written from the V1 repository at commit
  `9276a2ca254e88d19e0f02dced42a1b896499780`, read-only.
- A project agent roster and reusable review workflows exist under `.claude/`,
  documented in `docs/process/`.
- An implementation-specification package for the Alk V2 domain exists under
  `docs/implementation/alk-v2/`. It is specification only: no application runtime, no
  framework, no database, no dependencies.
- `ALK_V2_FREEZE_5` closed every blocking item in that package's open-issue register.
  Twenty-nine owner decisions have been written into the canon: F5-01 … F5-12, the three
  amendments F5-13 … F5-15 that independent review of the first encoding made necessary,
  then decisions 16 … 19, 20 … 22, 23 … 26 and finally 27 … 29 — each round resolving the
  findings that independent review of the previous encoding escalated, and each
  **superseding the earlier Freeze-5 wording wherever they conflict**. Superseded wording is
  preserved as marked history rather than deleted, and each round's supersession table names
  what it displaced. New stable rule IDs exist and several rules are amended; the package
  now inventories **283** normative rules.
  Decisions 27 … 29 are the final canon pass before implementation: the application does not
  record, ask for, infer or store the test method behind a reading (so method compatibility
  and the contested-episode state are retired outright); measurements of one parameter within
  30 minutes of one another are one observation carrying a `combinedMeasurementCount`; and
  `advisoryConfidenceWarning` is present or absent, with no third value.
  **No Alk output is blocked by an open issue.**
  Eleven non-blocking canon defects remain open and are listed in the Freeze-5
  declaration's *Deliberately left open* section.
- **One executable gate exists, and only one.** The Alk V2 conformance harness
  (`tools/conformance/run-conformance.py`, with `run-mutations.py` as its
  negative-control set) is a required check under `DEC-016`. The alk-v2 package's own
  `validate-freeze-5.py` was a second gate checking overlapping properties; it is
  **retired and deleted** under `DEC-019`, but only after its unique assertions were
  moved into the harness and each was demonstrated red under a mutation (53 mutations
  defined, 50 caught, 3 blocked with their unblocking conditions stated; the
  absorption itself accounted for 47/45/2, and the executable fixture format added
  `M-22`..`M-26` and `D-27`).
  Independent review of the absorption found six defects, three of them introduced by
  it — including an aborted run reporting PASS on checks that had not run. All six are
  fixed and each carries a control; the two false rows this produced in the gate
  inventory are corrected in place rather than quietly edited.
  `docs/process/GATE-CHECK-INVENTORY.md` is the before-and-after record, including the
  eight checks deliberately not carried across and what each dropped.
  `recompute-goldens.py` remains in the package and is unaffected: it is a recorder, not
  a gate.
  The harness is **RED today, and every red is accounted for**. An engine now exists, so
  the `ENGINE_ABSENT` failures are gone; what remains is the five mechanical checks
  reporting pre-existing document defects that predate all of this work
  (`docs/process/CONFORMANCE-HARNESS.md` lists them), the three invariants delegated to
  those checks, and eleven fixtures whose expectations the first engine showed to be
  wrong, unsatisfiable or out of the built scope — each one recorded as an open owner
  decision rather than worked around.
  **The mutation set is GREEN**: 80 mutations defined, 69 caught, 0 missed, 11 blocked
  with their unblocking conditions stated. Twenty-seven of them are new engine mutations
  under `DEC-020` clause 3.
- An **executable fixture format** is defined in
  `docs/implementation/alk-v2/fixtures/EXECUTABLE-FIXTURE-FORMAT.md`. **23 of 204
  fixtures execute** and 12 pass. The eleven conversions the engine work added are
  reading-series fixtures on the trend, uncertainty, support, consumption and maintenance
  paths, each taking its assessment instant from `DEC-021`. The paragraph below records
  the state before that; the counts in it are historical.
  **11 of 204 fixtures executed**, up from 6: `AD-RET-001` … `AD-RET-005` were converted and each is
  demonstrated red under a mutation of the retest-scheduler rule it exercises.
  The harness now reports conversion coverage **per engine path**.
  `DEC-020` makes this a standing rule: an engine path is not complete until its
  fixtures execute and its mutations turn them red.
  The remaining 193 are blocked, and mostly on one thing — **`OD-008`, what the
  assessment instant of a worked golden is.** Only one unconverted fixture states one.
  - Those five execute and pass **against the echo oracle**. They assert a retest
    vocabulary (`selectedApproxHours`, per-candidate `flooredHours` and others) that
    `ALK-V2-DATA-CONTRACT.md` does not declare, so **no contract-conformant engine can
    satisfy them as written** — they pass only because the oracle replays their own
    expectations back. The disagreement is `OD-012` and no session may settle it: the
    fixture side is frozen, the contract side is out of scope. It will surface as five
    red fixtures on the first day of retest implementation.
    **That day came, and the prediction held.** `DEC-022` closed `OD-012` by extending
    the contract; three of the five now pass, and the other two fail for reasons the
    conversion could not have seen — `AD-RET-004` asserts an `outerBoundState` value that
    is in no vocabulary (`OD-015`) and `AD-RET-002` states a partial candidate list
    (`OD-022`).
  - `AD-RET-001` additionally carries an unresolved question about its own input
    (`OD-011`); the harness now names it on the fixture's line and in the coverage table
    rather than showing an unqualified pass.
- **The first engine code in the project exists**, under `engine/`. It is the Alk V2
  domain engine and nothing else: pure functions of
  `(eventLedger, configurationHistory, asOf)`, no I/O below a thin adapter, no clock, no
  framework, no dependency outside the Python standard library. `engine/alk-v2-engine.py`
  speaks the conformance harness's JSON line protocol.
  - **Stage one — the normal path — is built**: readings in, observed trajectory,
    uncertainty, supported trajectory, consumption, maintenance dose, retest date,
    structured output with reason codes, on the **configured** potency.
  - **Stage two — potency learning — is built and remains `CAPABILITY_GATED`** as
    `ALK-POTENCY-CAPABILITY-GATE-001` states. While gated the learner still observes and
    reports what it would conclude; what the gate withholds is the promotion.
  - **Stage three — response classification — is built**: the six deterministic classes,
    the terminal and non-terminal states, the three eligibility gates, and the
    **immutable prediction snapshot captured at the instant of the dose change**. A dose
    change whose pre-change state cannot be recovered is permanently unclassifiable and
    says so, which is the failure this stage exists to stop happening to new data.
  - Safety returns and outer-bound *handling*, correction and return plans, and every
    capability and refusal branch not reachable on these paths are **deliberately
    unbuilt**, and each presents as the canon's stated `NOT_RUN` / `WITHHELD` with its
    reason code rather than as a plausible number.
  - **This is not a stack selection.** The engine sits behind a documented process
    boundary and speaks JSON; `ALK-V2-MODULE-DESIGN.md` still chooses no language, and
    `ROADMAP.md` Phase 1 is still unstarted. What exists is a conformant reference
    implementation of the domain, not the application.
- No V2 application runtime exists — no persistence, no UI, no scheduler, no notifications.
- No technical stack has been selected.

---

## Frozen authority

The following are authoritative and must not be silently altered:

- `SHARED_V2_FREEZE_2`
- `ALK_V2_FREEZE_5`
- `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md` (copied into this repository from the
  read-only V1 reference repository, byte-for-byte)

Behavioural questions are answered by the canon document, not by this file, and not by
recollection of how V1 behaved.

---

## First runtime intent

When application code eventually begins, the intended first runtime scope is:

- full V2 alkalinity domain;
- calcium measurement-only;
- magnesium measurement-only;
- Ca/Mg controllers OFF until their independent canons exist;
- during the Alk-only phase, the Mg safety interface remains `UNKNOWN` as specified by
  the frozen canon.

---

## Product direction

- deterministic chemistry engines;
- whole-tank coordinator;
- comprehensive reef calculator platform;
- tank-management workflow;
- first public target: paid installable PWA/web app;
- offline-capable core operation;
- future accounts/cloud sync;
- optional AI / Ask My Tank layer;
- possible native clients later.

---

## Next major step

Complete the documentation-only founding package, then research and decide the technical
architecture for a paid offline-capable PWA before scaffolding application code.

---

## Blockers

None for founding the repository.

None for architecture research, which is the next major step and does not depend on the
Alk implementation package.

**Eight owner decisions are required before the Alk domain can be implemented in full.**
They are recorded in `docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md` with failure
scenarios and interim refusal behaviour. Each is a chemistry or safety judgement that the
frozen canon does not contain; none may be resolved in code. Implementation may begin
without them — every affected output refuses explicitly rather than defaulting — but the
domain is not complete until they are closed under the Freeze-4 reopening rule.

**`OD-008` and `OD-012` are closed** (`DEC-021`, `DEC-022`), and `DEC-023` extends
`OD-012`'s answer to the same collision on other paths under three stated conditions.
Building the first engine turned a long list of inert disagreements into measured ones,
and nine further owner decisions are now open (`OD-015` … `OD-023`) recording them: a
fixture asserting a state name that is in no vocabulary, two retest fixtures stating a
partial candidate list, six goldens stating values rounded below the tolerance they are
compared at, and the general gap between the ~553 field names the corpus asserts and the
~40 the data contract declares.

The paragraph below is preserved as it stood before `DEC-021` closed it.

**`OD-008` blocked most of the fixture corpus becoming machine-checkable.** The engine
interface is a function of `(eventLedger, configurationHistory, asOf)`; almost no fixture
states an `asOf`, and choosing one decides what the fixture meant. It blocks roughly forty
reading-series fixtures directly and every case-set expansion behind them. It does not
block implementation starting — `DEC-020` attaches conversion to each path as it is
built — but each path will meet it. `OD-009`, `OD-010` and `OD-011` are the smaller
fixture-format questions behind it.

**Eleven V1 owner questions arrive unowned**, recorded in
`docs/migration/V1-OPEN-OWNER-QUESTIONS.md`. None blocks the Alk domain. One — *what is a
task* — blocks any design of the tasks-and-calendar area, which
`docs/migration/V1-APPLICATION-SALVAGE.md` §12 identifies as the largest omission from the
build-one screen set. Five are chemistry and would close through a governed canon reissue
rather than a ledger entry.

If the frozen canon source files cannot be accessed from a cloud session, that must be
recorded separately as an explicit blocker rather than worked around.

Current access state: both frozen source documents were readable from the read-only V1
repository and have been copied into `docs/canon/` with verified SHA-256 equality.

---

## Known documentation discrepancies

Recorded rather than silently resolved. Neither the canon nor the handoff has been
edited; both are byte-for-byte copies.

0. **The canon's recorded defects — twenty-one closed, eleven still open.**
   The Alk implementation package inventories all normative canon rules (283 after
   Freeze 5 and its later decisions) and classifies every ambiguity found. Twenty-four
   were genuine canon defects, eleven of them blocking a dependent output. Review of each
   encoding round opened further items; the owner has decided every one that blocked an
   output (F5-13 … F5-15, then decisions 16 … 29; register sections A2 … A7). Section A8
   records the findings from review of the decisions 27 … 29 encoding, which the owner
   directed to be **recorded and left open** rather than fixed in that pass. None of them
   withholds an output.

   `ALK_V2_FREEZE_5` closed thirteen of the original register — every blocking one, plus
   `OI-RAPIDBASIS-001` and `OI-CONFIDENCE-001` — and the eight review-opened items, through the governed
   reissue path the Freeze-4 reopening rule requires. Eleven non-blocking defects remain, recorded in
   `docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md` and not repaired: `OI-STABLE-001`,
   `OI-DAY4-001`, `OI-EXPOSURE-001`, `OI-NORMUNCERT-001`, `OI-POTENCYSTATE-001`,
   `OI-POTENCYSNAP-001`, `OI-WG024-001`, `OI-ANOMCLUSTER-001`, `OI-OVERSHOOT-001`,
   `OI-PIPELINE-001`, `OI-PLANTARGETEDIT-001`. Repair belongs to a governed Alk Freeze 6
   (or a shared freeze where the defect is shared), per the Freeze-5 reopening rule.

1. **Handoff freeze identifiers are stale relative to canon.**
   `docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` states current freezes
   `SHARED_V2_FREEZE_1` / `ALK_V2_FREEZE_3`. The canon document supersedes both:
   it declares `SHARED_V2_FREEZE_1` historical ("Current authority is
   `SHARED_V2_FREEZE_2`") and `ALK_V2_FREEZE_3` as superseded, ultimately by
   `ALK_V2_FREEZE_5`. The canon is the sole behavioural authority, so the operative
   freezes are `SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_5`. The gap is now two Alk
   reissues wide, which makes the handoff's identifiers more misleading, not less. The handoff's process guidance remains
   usable; only its freeze identifiers are out of date. Resolution belongs to a governed
   handoff reissue, not to an edit made here.

2. **Phase 0 salvage documents are now present, and the salvage report was never a
   repository artefact.**
   `ROADMAP.md` Phase 0 lists a V1 salvage inventory, a V1 salvage disposition and an
   unmigrated-V1-canon record. The *agent and routine* portion exists as
   `docs/process/V1-AGENT-SALVAGE-AUDIT.md`. The *application*, *data-provenance*,
   *unmigrated-canon* and *open-question* portions now exist under `docs/migration/`.

   This entry previously recorded those four as deliberately uncreated, pending a
   "final reviewed salvage report to be supplied separately". **That report was never
   committed to the V1 repository.** The V1 branch named for it,
   `claude/v1-salvage-reconnaissance-6rgcl1`, is identical to V1's `main` at
   `9276a2c` and contains the reconnaissance *brief*, not its findings — the brief
   forbade changing files, so the report was delivered as a document rather than a
   commit. Waiting for it to appear on that branch would have waited indefinitely.

   The four migration documents are written from that report together with a first-hand
   read of the V1 tree at `9276a2c`. Every claim checkable in V1 source was checked
   against V1 source.

   **One correction is carried through them and is load-bearing.** The reconnaissance
   report concluded that most of the owner's historical readings were fabricated seed
   data, inferring this from a V1 source comment. **The owner states they are real
   measurements.** That conclusion is withdrawn wherever it appears; see
   `docs/migration/V1-DATA-PROVENANCE.md` §1.

   **One conflict is recorded and deliberately unresolved.**
   `docs/migration/DATA-PROVENANCE.md` §1 lists historical water-change, ICP and
   lighting records as owner-confirmed genuine; the reconnaissance found all three
   byte-identical to named V1 source constants, and the owner's correction has not been
   extended to them. Recorded at `V1-DATA-PROVENANCE.md` §5 and as question Q9 in
   `docs/migration/V1-OPEN-OWNER-QUESTIONS.md`. Neither document is amended to agree
   with the other.

---

## Working practice

Repository operating rules are in `CLAUDE.md`. The project agent roster, its authority
boundaries and its permissions are documented in `docs/process/AGENT-ROSTER.md`. Rules
for unattended work and the control model are in
`docs/process/AUTONOMY-AND-CONTROLS.md`.

Claude may open pull requests. Claude never merges.

---

## Do not do yet

- no V2 chemistry implementation;
- no Ca/Mg/PO4/NO3 canon invention;
- no stack selection by assumption;
- no V1 runtime port;
- no AI implementation;
- no billing implementation.
