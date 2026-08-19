---
name: implement
description: Default implementation workflow - build, pin the behaviour with deterministic tests, one independent review in fresh context, fix material findings, open a PR, stop. Adds specialist reviewers only when the change materially touches their subject. Never merges.
argument-hint: <the task>
disable-model-invocation: true
---

# implement

The default way work gets done here. The task is: **$ARGUMENTS**

Ordinary work does not need six reviewers or an adjudicator. It needs a test
that fails when the code is wrong, and one person who did not write it looking
at it. That is this workflow.

Read `docs/process/AUTONOMY-AND-CONTROLS.md` first. **Never merge.**

---

## 1 — Is this task admissible?

- **Is the behaviour specified, by the right authority?** Chemistry behaviour
  comes from current frozen canon and nothing else. Product and
  technical-architecture requirements come from `DECISIONS.md`,
  `PRODUCT-VISION.md` and `ROADMAP.md`. A task instruction says *what to build*
  and *where*; it is never behavioural authority.
- **If the task supplies a chemistry value the canon does not state**, stop and
  report it. The route from the owner's intent to frozen canon is a canon
  reissue, not an implementation run.
- **Is it bounded?** You can say what is in scope, what is out, and what "done"
  looks like.

If the task is ambiguous about whether something is the owner's call, invoke
`advisor`. It returns exactly one of four classifications per question part:

| `advisor` returns | What you do |
|---|---|
| `IMPLEMENTATION_DETAIL` | Proceed. Record the authority it cited. |
| `OWNER_DECISION` | That part stops. File it in `docs/process/OPEN-OWNER-DECISIONS.md`. |
| `CANON_QUESTION` | Invoke the agent it names and act on the answer. Unanswered, it blocks that part exactly as an `OWNER_DECISION` does. |
| `CANON_DEFECT` | That part stops and stays stopped. The exit is a governed canon reissue, which is an owner act. |

Agents cannot invoke each other. Every "route to `advisor`" anywhere in this
repository means **you** invoke it.

## 2 — Pin the base

```bash
git rev-parse HEAD          # the run base commit; record it
```

Record it in the run record. Intermediate commits move `HEAD`, so a
`HEAD`-relative diff at the end would hide the run's own earlier work.

## 3 — Build

You are the only writer. No subagent edits the repository.

Stay inside the declared scope. Cite the authority at the point of
implementation — the canon rule ID or `DEC-nnn`, not a paraphrase.

## 4 — Pin the behaviour with deterministic tests

**This is the step that replaces review ceremony.** Prefer, in order:

1. **An invariant or property** that must hold for all inputs.
2. **A golden or fixture** derived from canon, with the canon rule ID in the
   test name.
3. **A boundary case** on each threshold the canon states — at it, either side
   of it.
4. Prose review, for what genuinely cannot be pinned.

A test that cannot fail is worse than none, because it reports safety. If a
test needs a threshold the canon does not give, that is a finding, not a number
for you to choose.

Run the suite. Paste real output into the run record — never a summary of
output you did not see.

## 5 — One independent reviewer, in fresh context

**By default, exactly one:** `integrator` for documentation and cross-cutting
changes, `test-engineer` where the risk is that nothing would fail if the code
were wrong, otherwise the specialist whose subject the change is actually in.

Give the reviewer the base-relative diff, the changed paths and the stated
intent. Reviewers do not produce their own diff.

**Add a specialist only when the change materially touches its subject** — and
say which you added and which you considered and did not:

| Add | When |
|---|---|
| `canon-conformance-auditor` | the change implements, restates or relies on a canon rule |
| `breaker` | wrong output would be unsafe, or the change handles evidence, timing, migration or extreme state |
| `domain-verifier` | the change asserts or implies a scientific or reef-domain claim |
| `migration-auditor` | historical data, provenance, schema, import/export, or V1-to-V2 promotion is involved |
| `architecture-reviewer` | the change selects or constrains technical architecture |
| `test-engineer` | as a second opinion where coverage is the risk |

**High-consequence chemistry or controller work uses the fixed sequence in
`/implement-chemistry` instead.** Do not improvise it here.

`adjudicator` is for when reviewers disagree or a finding is contested. Ordinary
work does not need it.

## 6 — One fix pass

Fix `BLOCKER` and `CORRECTNESS_GAP` findings. Record `EXPECTED_DEBT` with the
roadmap entry or recorded decision that defers it — an uncited gap is not
expected debt. Leave `OPTIONAL` alone.

**One fix pass, then re-run the tests.** If material findings remain after it,
stop and report rather than starting another cycle: a change that needs a third
pass needs a conversation, not another loop.

A `BLOCKER` is never carried into a pull request.

## 7 — Read the whole change

```bash
BASE=<the commit recorded at step 2>
git add -A
git diff "$BASE" --stat
git diff "$BASE"
git status --porcelain --untracked-files=all
```

Check: nothing outside the declared scope; no change under `docs/canon/`; no
chemistry value the canon does not state, anywhere except a cited,
`NON-AUTHORITATIVE — UNDER REVIEW` value under `docs/research/`; no V1 value
carried in; no test weakened or removed; no owner decision quietly resolved; no
governance-definition file touched (`AUTONOMY-AND-CONTROLS.md` lists them).

Canon should be unchanged. Confirm it directly against the base commit, which
anyone else can re-run:

```bash
git diff "$BASE" --stat -- docs/canon/
diff <(git show "$BASE":docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md | sha256sum) \
     <(sha256sum < docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md)
```

A difference means stop and report. This is a **process check, not a security
control** — the permission rules do not cover shell writes, so this detects a
canon change rather than preventing one.

## 8 — Run record, then PR, then stop

Write `docs/process/runs/<YYYY-MM-DD>-<slug>.md` per
`docs/process/runs/README.md`. Start it early and commit it as you go; a run
that dies leaves a record of where it got to. Do not rewrite an earlier entry to
match a later outcome — append a correction.

Then: commit on the working branch, push, open a PR into `main` stating what
changed, the authority relied on, what was reviewed and by whom, outstanding
findings, open owner decisions, and what was deliberately not done.

**Then stop.** Never merge, never enable auto-merge. Merging is the owner's.
