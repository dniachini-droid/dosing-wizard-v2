---
name: implement-chemistry
description: Fixed workflow for high-consequence chemistry, controller, dosing or safety-rail work - build, automated fixtures and invariants, canon-conformance-auditor, breaker, one fix pass, PR, stop. Use whenever a wrong result could mislead a dose or a refusal. Never merges.
argument-hint: <the chemistry or controller task>
disable-model-invocation: true
---

# implement-chemistry

For work where a wrong answer reaches a tank. The task is: **$ARGUMENTS**

Use this whenever the change touches thresholds, band edges, rails, dosing
equations, controller rules, evidence minima, retest timing, refusal conditions
or anything a recommendation is computed from. If unsure whether a change
qualifies, it qualifies.

This sequence is fixed. Do not shorten it and do not extend it.

Read `docs/process/AUTONOMY-AND-CONTROLS.md` first. **Never merge.**

---

## 1 — Admissibility, strictly

Every rule this change implements **must be stated in current frozen canon**.
Not in `DECISIONS.md`, not in the task text, not in `docs/research/`, not in V1,
not as a "reasonable interpretation" of a rule the canon does not make.

Quote the canon rule ID and the passage before writing anything. If the rule is
missing, incomplete or self-contradictory, **stop** — report `CANON_DEFECT` or
file an owner decision. A canon gap is never filled by the run that found it.

Pin the base commit: `git rev-parse HEAD`.

## 2 — Build

## 3 — Automated fixtures and invariants — before review, not after

The review stages below are worth little against behaviour that no test pins.
Write, and run:

- **Invariants** the canon states — including that the engine **refuses** rather
  than degrading into an estimate when required context is missing.
- **Fixtures and goldens derived from canon**, each naming its canon rule ID.
  Never a V1 golden, never a V1 fixture.
- **Boundary cases** at every threshold the canon states, and either side of it.
- **Replay determinism** per canon §64: same event ledger, same configuration
  versions, same engine/canon version → same result. Do not assert stability
  across canon versions; a governed reissue is allowed to change outputs.
- A **negative control** for any new checker: show it fails on a deliberate
  mutation before trusting it. A checker never shown to fail is not a gate.

Paste real output into the run record.

## 4 — `canon-conformance-auditor`, in fresh context

Does this match the canon as written? Does every rule it touches trace to one
owner and one covering fixture? Give it the base-relative diff, the changed
paths and the canon rule IDs claimed.

## 5 — `breaker`, in fresh context

What input, timing, evidence, intervention, migration or extreme state makes
this produce a wrong or unsafe result? A finding it cannot reproduce is not a
finding.

Run 4 and 5 concurrently. Neither sees the other's findings.

## 6 — One fix pass

Fix every `BLOCKER` and `CORRECTNESS_GAP`, re-run the fixtures, and re-run the
two reviewers **only on what changed**.

If material findings survive the fix pass, **stop and report**. Chemistry work
that will not converge in one pass is a signal about the canon or the task, not
a reason to iterate.

`adjudicator` is invoked only if the two reviewers contradict each other.

## 7 — Read the whole change, then PR, then stop

As `/implement` step 7: base-relative diff, nothing outside scope, no change
under `docs/canon/`, no chemistry value the canon does not state, no V1 value
carried in, no test weakened.

Write the run record. Open the PR. **Stop.** Merging is the owner's.
