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
- Alk V2 canon is frozen.
- V1 salvage reconnaissance is complete.
- The V1 agent/routine salvage audit is complete and recorded in
  `docs/process/V1-AGENT-SALVAGE-AUDIT.md`.
- A project agent roster and reusable review workflows exist under `.claude/`,
  documented in `docs/process/`.
- An implementation-specification package for the Alk V2 domain exists under
  `docs/implementation/alk-v2/`. It is specification only: no application runtime, no
  framework, no database, no dependencies.
- No V2 application runtime exists.
- No technical stack has been selected.

---

## Frozen authority

The following are authoritative and must not be silently altered:

- `SHARED_V2_FREEZE_2`
- `ALK_V2_FREEZE_4`
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

If the frozen canon source files cannot be accessed from a cloud session, that must be
recorded separately as an explicit blocker rather than worked around.

Current access state: both frozen source documents were readable from the read-only V1
repository and have been copied into `docs/canon/` with verified SHA-256 equality.

---

## Known documentation discrepancies

Recorded rather than silently resolved. Neither the canon nor the handoff has been
edited; both are byte-for-byte copies.

0. **The frozen canon contains 24 recorded defects.**
   The Alk implementation package inventories all 261 normative canon rules and classifies
   every ambiguity found. Twenty-four are genuine canon defects — eleven of them blocking
   a dependent output. They are recorded in
   `docs/implementation/alk-v2/ALK-V2-OPEN-ISSUES.md`, not repaired. Repair belongs to a
   governed Alk Freeze 5 (or a shared freeze where the defect is shared), per the Freeze-4
   reopening rule.

1. **Handoff freeze identifiers are stale relative to canon.**
   `docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` states current freezes
   `SHARED_V2_FREEZE_1` / `ALK_V2_FREEZE_3`. The canon document supersedes both:
   it declares `SHARED_V2_FREEZE_1` historical ("Current authority is
   `SHARED_V2_FREEZE_2`") and `ALK_V2_FREEZE_3` as "superseded by `ALK_V2_FREEZE_4`".
   The canon is the sole behavioural authority, so the operative freezes are
   `SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_4`. The handoff's process guidance remains
   usable; only its freeze identifiers are out of date. Resolution belongs to a governed
   handoff reissue, not to an edit made here.

2. **Phase 0 salvage documents are only partly present.**
   `ROADMAP.md` Phase 0 lists a V1 salvage inventory, a V1 salvage disposition and an
   unmigrated-V1-canon record. The *agent and routine* portion of that work now exists
   as `docs/process/V1-AGENT-SALVAGE-AUDIT.md`, which inventories and dispositions all
   28 V1 agent definitions and all 19 V1 routines against a first-hand read of the V1
   repository. It does **not** cover V1 application code, V1 journeys, V1 tests or the
   unmigrated-V1-canon record; those remain deliberately uncreated, because the final
   reviewed salvage report is to be supplied separately and inventing substitutes would
   fabricate salvage findings. Phase 0 is therefore still not complete.

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
