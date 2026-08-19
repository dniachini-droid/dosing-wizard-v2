---
name: overnight-cycle
description: Execute one bounded implementation job autonomously while the owner is absent - validate the task contract, plan, implement, review independently in fresh context, adjudicate, fix, re-review, run checks, commit, push and open a PR. Never merges. Use when the owner asks for unattended or overnight work on a specified task.
argument-hint: <task description, or path to a task file>
disable-model-invocation: true
---

# overnight-cycle

One bounded job. Independent review. A pull request. Then stop.

Read `docs/process/OVERNIGHT-AUTONOMY.md` before starting. It defines what is
safe to do unattended and what is not, and it governs this workflow.

The task for this run is: **$ARGUMENTS**

---

## Stage 0 — Task contract validation

Before anything is planned or written, decide whether this task is admissible.

A task is admissible only if all of these hold:

1. **It is specified.** The required behaviour is determined by frozen canon, by
   a recorded decision in `DECISIONS.md`, or by explicit instruction in the task
   itself. Not by inference, and not by "whatever seems sensible".
2. **It is bounded.** You can state what is in scope and what is out of scope,
   and name what "done" looks like.
3. **It is safe unattended**, per `docs/process/OVERNIGHT-AUTONOMY.md`.
4. **It does not require inventing chemistry, a safety rail, a threshold, or a
   product policy.**
5. **It does not require modifying frozen canon.**

Where the task is ambiguous, invoke `advisor` to classify the ambiguity before
deciding. If `advisor` returns `owner-decision` or `canon-defect` for something
the task depends on, that part is inadmissible.

**If the whole task is inadmissible:** write the run record (Stage 9), state
precisely what is missing and what would unblock it, and stop. Do not implement
a reduced version of a task you could not validate. An inadmissible task
correctly refused is a successful run.

**If part of the task is inadmissible:** document the blocked part, and continue
only with work that is genuinely independent of the open question. Work that
merely *seems* separable but would have to be redone once the decision lands is
not independent — leave it.

## Stage 1 — Plan

Write the plan into the run record before writing any code.

```
task:
in scope:
explicitly out of scope:
authority: (canon rule IDs / decisions / task instructions, quoted)
files likely touched:
acceptance criteria: (each testable, each citing its authority)
tests required:
how to undo this:
open owner decisions blocking part of this run: (if any)
```

If you cannot write testable acceptance criteria that cite an authority, return
to Stage 0 — the task was not actually specified.

## Stage 2 — Primary implementation

You are the **only writer**. No subagent edits the repository; reviewers are
read-only. This is deliberate: concurrent writers corrupt the run and neither
notices.

- Stay inside the plan's scope. Going outside it requires stopping and recording
  why, in the run record, before continuing.
- Write the test first where a test is possible, then the smallest change that
  satisfies it.
- Cite the governing authority at the point of implementation — the canon rule
  ID or the decision — so the next reader can check it without archaeology.
- If a rule cannot be implemented as written, stop that thread and record: the
  exact rule ID, the exact conflict, and whether it is `CANON_DEFECT`,
  `BLOCKED_BY_OWNER_DECISION` or an implementation problem. Do not simplify the
  rule to make it fit.
- Never weaken, skip or delete a test to make something pass.

## Stage 3 — Independent review, in fresh context

Invoke reviewers as subagents so each starts with no knowledge of your
reasoning. Give each the same brief: the task, the plan, the changed paths, and
the diff (write it to a scratch file outside the repository and pass the path).
Seven of the nine reviewers have no shell at all, so pass the diff rather than
expecting them to produce it; `breaker` and `test-engineer` have `Bash` only to
reproduce failures and run checks, and must not write into the repository.

**Always:**
- `canon-conformance-auditor`
- `breaker`
- `test-engineer`
- `integrator`

**Conditionally:**
- `domain-verifier` — whenever the change asserts, relies on or implies a
  scientific or reef-domain claim.
- `migration-auditor` — whenever historical data, provenance, time precision,
  schema, import/export or migration behaviour is involved.
- `architecture-reviewer` — whenever the change selects, constrains or commits
  technical architecture.

Record which conditional reviewers you ran and, for each you skipped, the reason.
An unstated skip is itself a finding at the next stage.

Reviewers judge correctness, canon conformance, safety and stated requirements.
They do not adjudicate each other, and they do not gate on cosmetic preference.

## Stage 4 — Adjudicator synthesis

Invoke `adjudicator` once, with every reviewer report in full, including what
each reviewer declined to examine.

The adjudicator produces the single classified list this run acts on, using
`BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`, `EXPECTED_DEBT`, `OPTIONAL`, plus
`UNCONFIRMED` and `BLOCKED_BY_OWNER_DECISION`.

The adjudicator may not invent missing policy to let the run continue. If it
returns `BLOCKED_BY_OWNER_DECISION` or `CANON_DEFECT` on something load-bearing,
that part of the run stops there.

## Stage 5 — Fix genuine failures

Fix, in order: `BLOCKER`, then `CANON_DEFECT` where the fix is to stop relying on
the defective rule (never by editing canon), then `CORRECTNESS_GAP`.

Do not fix `OPTIONAL`. Do not fix `UNCONFIRMED`. Record `EXPECTED_DEBT` with its
citation and leave it.

Each fix is minimal and recorded in the run record with the finding ID it closes.

## Stage 6 — Independent re-review

Re-invoke the reviewers whose findings you acted on, in fresh context, with the
updated diff. Then `adjudicator` again.

**Hard limit: at most two fix/re-review cycles per run**, unless the initiating
task explicitly authorises more. If findings remain after the second cycle, stop
fixing, record what is outstanding with its severity, and carry it into the PR
as known state. Endless autonomous churn is a failure mode, not diligence.

## Stage 7 — Test and check suite

Run the repository's own checks and tests, whatever exists at the time. Paste
real output into the run record — never a summary of output you did not see.

If nothing executable exists yet, say so explicitly rather than implying checks
passed.

Any failure that is genuinely caused by this change must be fixed or the run
stops. A failure that is not yours is recorded, with the evidence that it is not
yours.

## Stage 8 — Final diff review

Read the complete diff yourself, adversarially, as if reviewing someone else's
work. Check specifically:

- nothing outside the plan's declared scope;
- no change under `docs/canon/`;
- no invented chemistry value, threshold, default or safety rail anywhere,
  including in comments, test fixtures and documentation;
- no V1 value, fixture, golden or threshold carried in;
- every acceptance criterion met, or explicitly listed as not met;
- no test weakened or removed;
- no owner decision quietly resolved.

## Stage 9 — Run record

Write the audit trail to `docs/process/runs/<YYYY-MM-DD>-<slug>.md`, following
`docs/process/runs/README.md`. One file per run; never a shared file.

It must contain: the task, the admissibility decision, the plan, what was
implemented, which reviewers ran and which were skipped and why, every material
finding with its severity and resolution, outstanding findings, checks run with
real output, open owner decisions raised, and what was deliberately not done.

Findings and their resolutions are the point. A run that did good work and wrote
nothing down did nothing.

## Stage 10 — Commit, push, PR — then stop

- Commit on the current working branch, never on `main`.
- Push the branch.
- Open a pull request into `main`. The body states: what changed, why, the
  authority relied on, what was reviewed and by whom, outstanding findings with
  severities, open owner decisions, and what was deliberately not done.
- **Stop.**

**Never merge.** Never enable auto-merge. Never push to `main`. However green the
checks are, however trivial the change looks, merging requires explicit owner
approval. This is the human check the whole arrangement rests on.

Report the PR URL and end the run.
