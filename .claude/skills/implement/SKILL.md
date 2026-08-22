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

**If the change touches the engine or anything under
`docs/implementation/alk-v2/`, run the conformance harness. It is a required
check (`DEC-016`).**

```bash
python3 tools/conformance/run-conformance.py [--engine '<engine command>']
python3 tools/conformance/run-mutations.py
```

Both exit non-zero on failure. Read the harness's **NOT COVERED** section
before believing a green fixture count: it names every fixture it could not
execute and why, and a change claimed to be covered by a fixture in that list
is not covered. If the change adds a checker, add its negative control to
`tools/conformance/mutations/` in the same change and show `run-mutations.py`
catching it.

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

## 5 — First, if the round touched the UI: `unimpressed-reefkeeper`

**If this round changed anything the owner will look at — a screen, a number, a
word, a control — `unimpressed-reefkeeper` runs before any other reviewer.**
Rounds that touched only the engine or the canon skip it and say so.

It drives the running app in a browser and reports what does not make sense. It
reads no code and no canon; do not give it either, do not give it the diff, and
do not give it a specification. Every other reviewer here checks the change
against an authority. This one checks it against a keeper's eyes, and it exists
because authority-checking reviewers have passed, as correct and fully tested,
faults that were obvious within seconds of using the app.

**Two prerequisites. It stops without them, and stopping is correct.**

1. **The app running in a browser it can drive**, at a phone viewport, on this
   round's build. `npm run dev`. Not screenshots, not source.
2. **A written summary of what is in the tank's data** — how many readings of
   each parameter, how many dose changes, how many water changes, how many
   tasks.

Produce the summary yourself, by **counting the records in the data you loaded**,
before you dispatch it. Do not write it from memory, from the fixture's own
declared totals, or from what you expect the tank to contain. **A wrong summary
is worse than none**: the agent measures the whole app against it, so an error
sends it wrong in both directions — real markers called invented, invented
markers accepted as real.

If you cannot drive a browser in this session, **do not dispatch it, and say so
in the run record.** Half a review from this agent is worse than none, because
it will be trusted. Never let it fall back to reading source.

**Its findings are fixed in this round**, in the step 6 fix pass, ahead of the
other findings. The owner is told what was fixed and why; he does not arbitrate
them. Three exceptions are not fixed and go to him instead, in
`docs/process/OPEN-OWNER-DECISIONS.md`:

- anything touching chemistry or the canon
- anything it flags as *"was this decided?"*
- anything where it names two options rather than one answer

It is not a substitute for the reviewer below. It reports what is wrong on
screen; the reviewer below still says whether the change is right.

## 5a — One independent reviewer, in fresh context

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
| `normal-operation-reviewer` | the change touches trend, dose, retest or user-visible output behaviour (`DEC-018`) |

`normal-operation-reviewer` asks the question no other reviewer asks — whether
the product gives a sensible answer on an ordinary tank with ordinary readings.
It runs independently of `breaker`, not after it: they answer different
questions and neither's result should shape the other's. It has no runtime to
execute yet, so it reports in specification mode and says so.

**High-consequence chemistry or controller work uses the fixed sequence in
`/implement-chemistry` instead.** Do not improvise it here.

`adjudicator` is for when reviewers disagree or a finding is contested. Ordinary
work does not need it.

**`jake`, after the reviewers and before the fix pass, and only if they found
something.** He sorts step 5 and step 5a findings alike. He is not a reviewer
and does not extend the review (`DEC-017`); he
sorts finished findings into `BUG`, `EDGE CASE` or `ALREADY COVERED` by whether
the reference system would plausibly reach the state, so that the one fix pass
at step 6 goes to what matters. He changes no severity: a `BLOCKER` marked
`EDGE CASE` is still a `BLOCKER` and is still fixed. A round with no findings
has nothing for him to sort — say so rather than running him by reflex. Where
`adjudicator` also ran, it goes first and `jake` sorts its adjudicated list.

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
governance-definition file touched (`AUTONOMY-AND-CONTROLS.md` lists them); no
checker added without its negative control.

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
