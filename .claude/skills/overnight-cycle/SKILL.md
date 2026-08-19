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

1. **It is specified, by the right authority.** Authority is not
   interchangeable:

   - **Chemistry behaviour** — thresholds, rails, dosing equations, controller
     rules, evidence minima, retest timing — comes from current frozen canon and
     from **nothing else**. `DECISIONS.md` cannot supply it, a task instruction
     cannot supply it, `docs/research/` cannot supply it, and V1 cannot supply
     it.
   - **Product, technical-architecture and process** requirements come from
     `DECISIONS.md`, `PRODUCT-VISION.md` and `ROADMAP.md`.

   If the task needs a chemistry rule the canon does not state, it is
   inadmissible however clearly some other document appears to answer it. Not by
   inference, and not by "whatever seems sensible".

   A task instruction may say *what to build* and *where*. It may **not** supply
   chemistry. A threshold, band edge, rate limit, tolerance, noise floor,
   cadence, evidence minimum or safety rail that arrives in the task text and is
   not in the canon is inadmissible **even though nobody invented it during the
   run**. The governing test is `OVERNIGHT-AUTONOMY.md`'s: does the canon state
   it? Not: did this run make it up. Chemistry that reaches the repository
   carrying a task instruction as its citation is exactly as unowned and
   unevidenced as chemistry that was guessed, and harder to spot afterwards
   because it looks sourced.

   If the task supplies a value the canon does not, stop and report it as
   `BLOCKED_BY_OWNER_DECISION`: the owner may well be right, but the route from
   their intent to frozen canon is a canon reissue, not an overnight run.
2. **It is bounded.** You can state what is in scope and what is out of scope,
   and name what "done" looks like.
3. **It is safe unattended**, per `docs/process/OVERNIGHT-AUTONOMY.md`.
4. **It does not require inventing chemistry, a safety rail, a threshold, or a
   product policy.**
5. **It does not require modifying frozen canon.**

Where the task is ambiguous, invoke `advisor` to classify the ambiguity before
deciding. `advisor` emits exactly one of four classifications per question part,
and **you must handle all four**:

| `advisor` returns | What you do |
|---|---|
| `IMPLEMENTATION_DETAIL` | Proceed. Record the authority it cited. |
| `OWNER_DECISION` | That part is inadmissible. File it in `docs/process/OPEN-OWNER-DECISIONS.md`. |
| `CANON_QUESTION` | **Invoke the agent it names** (`canon-conformance-auditor`, or `domain-verifier`) and act on that answer. An unanswered `CANON_QUESTION` blocks that part exactly as an `OWNER_DECISION` does — it is not a licence to proceed. |
| `CANON_DEFECT` | That part is inadmissible and stays inadmissible. The exit is a governed canon reissue, which is an owner act. |

`advisor` splits a mixed question into parts and classifies each. Confirm every
part came back with a classification before proceeding; an unclassified part is
one that will proceed unnoticed.

**If the whole task is inadmissible:** write the run record (Stage 9), state
precisely what is missing and what would unblock it, and stop. Do not implement
a reduced version of a task you could not validate. An inadmissible task
correctly refused is a successful run.

**If part of the task is inadmissible:** document the blocked part, and continue
only with work that is genuinely independent of the open question.

You are the party that wants to keep working, so do not make this call alone:
put the proposed remaining scope to `advisor` and let it say whether the
remainder is genuinely independent. Record its answer in the run record and in
the plan's authority block. Work that merely *seems* separable but would have to
be redone once the decision lands is not independent — leave it. When `advisor`
is unsure, leave it.

## Stage 1 — Plan

### First, pin the run baseline

Before any file is touched, capture and write both of these into the run record.
Everything at Stage 8 is measured against them, and neither can be reconstructed
afterwards.

```bash
# the run base commit — the tree as it stood before this run
git rev-parse HEAD

# frozen-canon integrity baseline
find docs/canon -type f -print0 | sort -z | xargs -0 sha256sum
```

Record the base commit hash and the full digest list verbatim. This run will
make intermediate commits, so `HEAD` will move and a `HEAD`-relative diff will
stop showing the run's own earlier work. The base commit is the only fixed point.

### Then write the plan

```
task:
in scope:
explicitly out of scope:
authority: (canon rule IDs and DEC-nnn only, quoted; a task instruction is
  scope, never authority for behaviour)
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

**Be honest about how independent this is.** Fresh context is real: no reviewer
sees your reasoning. But you choose the reviewers, write the brief, produce the
diff artefact and then perform Stage 8 yourself, so a path omitted from the diff
is invisible to the seven reviewers who have no shell. Two things reduce that,
and neither eliminates it: derive the diff mechanically from `git add -A` plus
`git status --porcelain --untracked-files=all` rather than by selection, and
give every reviewer the changed-path list so an omission is visible as a path
with no corresponding hunk. Genuine independence needs a reviewer that was not
this session — that is `/pr-gate`, run separately on the resulting PR, and it is
the right follow-up for any substantive change.

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

**Invoke `advisor` on every `BLOCKED_BY_OWNER_DECISION` before writing it up.**
No agent can invoke another, so this is your job and it is easy to skip. You are
the party that wants the decision resolved, which makes you the worst party to
frame its options — that is the whole reason `advisor` exists. An entry filed in
`docs/process/OPEN-OWNER-DECISIONS.md` without `advisor` having worked it up is
a decision framed by the party with an interest in the answer.

## Stage 5 — Fix genuine failures

Fix, in order: `BLOCKER`, then `CANON_DEFECT` where the fix is to stop relying on
the defective rule (never by editing canon), then `CORRECTNESS_GAP`.

Do not fix `OPTIONAL`. Do not fix `UNCONFIRMED`. Record `EXPECTED_DEBT` with its
citation and leave it.

Each fix is minimal and recorded in the run record with the finding ID it closes.

## Stage 6 — Independent re-review

Re-invoke the reviewers whose findings you acted on, in fresh context, with the
updated diff. Then `adjudicator` again.

**Hard limit: at most two fix/re-review cycles per run.** A task may raise this
to at most **four**, and only by saying so explicitly; nothing may remove the
ceiling, and a task that purports to is followed up to four and no further. A
run may not start another run, and may not restart itself to reset the count.

If findings remain when the limit is reached, stop fixing and record what is
outstanding with its severity — **except a `BLOCKER`, which is never carried
into a pull request.** `BLOCKER` means work must not proceed; a run that still
has one after its last cycle stops at Stage 9 with the run record and does not
open a PR. Say plainly in the record that the run stopped, and why.

Everything else outstanding is carried into the PR as known state. Endless
autonomous churn is a failure mode, not diligence.

## Stage 7 — Test and check suite

Run the repository's own checks and tests, whatever exists at the time. Paste
real output into the run record — never a summary of output you did not see.

If nothing executable exists yet, say so explicitly rather than implying checks
passed.

Any failure that is genuinely caused by this change must be fixed or the run
stops. A failure that is not yours is recorded, with the evidence that it is not
yours.

## Stage 8 — Final review, against the run baseline

**Review the whole run, not the last commit.** This run has made intermediate
commits, so `git diff`, `git diff --cached` and anything `HEAD`-relative show
only the most recent slice and silently hide everything the run did earlier.
Use the base commit pinned at Stage 1.

```bash
BASE=<the base commit recorded at Stage 1>

git add -A                                   # untracked files are otherwise invisible
git diff "$BASE" --stat                      # every path this run touched, whole run
git diff "$BASE"                             # the full change, whole run
git diff "$BASE" --name-only                 # the scope list to check against the plan
git status --porcelain --untracked-files=all # cross-check: nothing unaccounted for
```

Two properties matter and both come from using `$BASE`: a plain `git diff` does
not show newly created files at all, and a `HEAD`-relative diff drops earlier
commits. A file added under `docs/canon/`, or a new document elsewhere that
competes with an existing authority, is invisible to both.

### Canon integrity — verify by digest, not by diff

```bash
find docs/canon -type f -print0 | sort -z | xargs -0 sha256sum
```

Compare against the baseline captured at Stage 1, and check that the **set of
files** matches too — a digest list only covers files that existed. Any
difference, in content or in membership, **fails the run**: stop, do not commit
further, and report it.

This check exists because the permission rules cover file-editing tools and do
not cover shell redirection. It is the thing that actually detects a canon
write, and it is not optional or inferable from the diff.

### Then read it

Read the complete `$BASE`-relative diff yourself, adversarially, as if reviewing
someone else's work. Check specifically:

- nothing outside the plan's declared scope;
- no change under `docs/canon/`;
- no chemistry value, threshold, default or safety rail that the canon does not
  state — anywhere, including comments, test fixtures, run records, process
  documents and the owner-decision register, and regardless of whether it was
  invented, supplied by the task, or carried from V1;
- no V1 value, fixture, golden or threshold carried in;
- every acceptance criterion met, or explicitly listed as not met;
- no test weakened or removed;
- no owner decision quietly resolved;
- **no governance-definition file touched.** Run the scope list from
  `git diff "$BASE" --name-only` against the two categories in
  `docs/process/OVERNIGHT-AUTONOMY.md`:

  **Run output — expected, writable:** `docs/process/runs/**`,
  `docs/process/OPEN-OWNER-DECISIONS.md`, and the files the task's own scope
  named.

  **Governance definition — a run must not touch these:** `CLAUDE.md`,
  `.claude/settings.json`, `.claude/agents/**`, `.claude/skills/**`,
  `.github/**`, `docs/process/AGENT-ROSTER.md`,
  `docs/process/OVERNIGHT-AUTONOMY.md`, `PRODUCT-VISION.md`, `ROADMAP.md`,
  `DECISIONS.md`.

  Any path from the second list appearing in the scope **fails the run**. If the
  task genuinely requires changing governance, that is an owner decision and a
  separate attended change — not a stage of this run.

Then re-run this stage over the run record once Stage 9 has written it, again
against `$BASE`. The record is committed like anything else, and it is the
surface most likely to carry a stray value, because it is the one nobody reviews
by habit.

## Stage 9 — Run record

Write the audit trail to `docs/process/runs/<YYYY-MM-DD>-<slug>.md`, following
`docs/process/runs/README.md`. One file per run; never a shared file.

**Start this file at Stage 1, not at Stage 9, and commit it early.** Write the
plan into it and commit that before implementation begins. Then append and
commit as each stage completes. A run that dies at Stage 5 must leave a record
of where it got to, and a record that exists only in an uncommitted working tree
does not survive the failure it was written for.

Committing the plan before the work also makes the plan checkable: Stage 8's
"nothing outside the plan's declared scope" means nothing if the plan and the
diff land in the same commit and the plan can still be edited to match what
happened. Do not rewrite an earlier stage's entry to match a later outcome —
append a correction saying what changed and why.

`docs/process/OVERNIGHT-AUTONOMY.md` owns the required contents; read them
there rather than from a copy.

**File every open owner decision in `docs/process/OPEN-OWNER-DECISIONS.md`** as
well as recording it here, using the entry format that file defines. The run
record is where the decision was found; the register is where it survives after
this run is forgotten. A decision named only in a run record will be lost.

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
