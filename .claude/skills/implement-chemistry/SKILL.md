---
name: implement-chemistry
description: Fixed workflow for high-consequence chemistry, controller, dosing or safety-rail work - build, the conformance harness, canon-conformance-auditor, breaker, one fix pass, jake over the findings, PR, stop. Use whenever a wrong result could mislead a dose or a refusal. Never merges.
argument-hint: <the chemistry or controller task>
disable-model-invocation: true
---

# implement-chemistry

For work where a wrong answer reaches a tank. The task is: **$ARGUMENTS**

Use this whenever the change touches thresholds, band edges, rails, dosing
equations, controller rules, evidence minima, retest timing, refusal conditions
or anything a recommendation is computed from. If unsure whether a change
qualifies, it qualifies.

**The reviewer sequence is fixed. Do not shorten it and do not extend it.** The
reviewers are `canon-conformance-auditor` and `breaker`, and adding a third is
how a fixed sequence stops being fixed. `jake` at step 6 is **not** a reviewer
and is not part of it: he sorts findings the sequence has already produced, and
runs strictly after it (`DEC-017`).

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

## 3 — The conformance harness, and the tests this change needs — before review, not after

**Run the harness. It is a required check (`DEC-016`).**

```bash
python3 tools/conformance/run-conformance.py --engine '<your engine command>'
python3 tools/conformance/run-mutations.py
```

Both must be run and both exit non-zero on failure. Paste the real output into
the run record — the verdict block at minimum, and the full "NOT COVERED"
section whenever the change alters what is executable. A summary of output you
did not read is not a result.

Read the harness's **NOT COVERED** section before believing a green fixture
count. It names every fixture it could not execute and why. A change that
claims to be covered by a fixture in that list is not covered.

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
  Add it to `tools/conformance/mutations/` and show `run-mutations.py` catching
  it. A checker landed without its negative control is an incomplete change
  (`DEC-016`), and an invariant landed without one is a test that cannot fail.

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

## 6 — `jake`, over the output of steps 4 and 5

**Not a reviewer, and not part of the fixed sequence above** (`DEC-017`). He
consumes the two finished reports and sorts every finding into `BUG`,
`EDGE CASE` or `ALREADY COVERED`, by whether the reference system would
plausibly reach the state — not by severity, which he may not touch. A step
that runs strictly after a sequence, on its output, does not extend it.

He runs **before** the fix pass, so his sorting can inform what gets fixed with
the one pass available. That is the same slot `adjudicator` occupies; where
both run, `adjudicator` goes first and `jake` sorts its adjudicated list.

Skip him only when steps 4 and 5 produced no findings, and say so. If the fix
pass at step 7 produces new findings, he sorts those too.

A `BUG` / `EDGE CASE` label never lowers a severity: a `BLOCKER` marked
`EDGE CASE` is still a `BLOCKER` and is still fixed at step 7.

## 7 — One fix pass

Fix every `BLOCKER` and `CORRECTNESS_GAP`, re-run the harness and the fixtures,
and re-run the two reviewers **only on what changed**.

If material findings survive the fix pass, **stop and report**. Chemistry work
that will not converge in one pass is a signal about the canon or the task, not
a reason to iterate.

`adjudicator` is invoked only if the two reviewers contradict each other.

## 8 — Read the whole change, then PR, then stop

As `/implement` step 7: base-relative diff, nothing outside scope, no change
under `docs/canon/`, no chemistry value the canon does not state, no V1 value
carried in, no test weakened.

Write the run record. Open the PR. **Stop.** Merging is the owner's.
