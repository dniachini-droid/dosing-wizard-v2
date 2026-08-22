---
name: pr-gate
description: Risk-based independent review of an existing pull request or diff, in a session that did not write it. One reviewer by default, specialists only where the change materially touches their subject, ending in one classification. Reviews only; never fixes, never merges.
argument-hint: <PR number, branch name, or diff description>
disable-model-invocation: true
---

# pr-gate

Independent review of work that already exists. The target is: **$ARGUMENTS**

This workflow **reviews**. It does not implement, does not fix, and does not
merge. Its output is a classification and a findings list for the owner.

Run it in a session that did not produce the change. If that is not possible,
say so in the report — a self-review labelled as independent is worse than no
review.

**Scale the gate to the risk.** A six-reviewer sweep on a documentation tweak
produces noise that hides the one finding that mattered. Most PRs need one
reviewer.

---

## 1 — Establish the target

Record the base and head commits, the changed paths, and write the full
base-relative diff to a scratch file outside the repository. Reviewers do not
produce the diff themselves — pass them the path, the changed paths and the
stated intent, because "does this do what it claims" is part of the review.

If a canon file appears in the changed paths, say so prominently. Canon should
never be in a PR diff.

**Run the conformance harness against the target. It is a required check
(`DEC-016`), and this gate is where "required" is verified rather than
asserted.**

```bash
python3 tools/conformance/run-conformance.py [--engine '<engine command>']
python3 tools/conformance/run-mutations.py
```

**Read the verdict the way `DEC-016` states it, not as "must be green".** The
harness is red on a clean tree today and will stay red until an engine exists
and the document defects it reports are resolved. "Required" means the gate must
run, its real output must be in the PR, and **the change must not make it
worse**. A rule that no PR could satisfy is a rule that gets waived, which is
the failure `DEC-016`'s own rationale names.

So the test is a comparison against the base commit, not an absolute:

```bash
git stash --include-untracked            # or check out the base in a worktree
python3 tools/conformance/run-conformance.py --json /tmp/base.json
git stash pop
python3 tools/conformance/run-conformance.py --json /tmp/head.json
```

- **Any subject failing at head that passed at base → `CHANGES_REQUIRED`**, on
  that ground alone.
- A subject failing at both is pre-existing. Name it in the report; it is not
  this PR's to fix and not a reason to block.
- `run-mutations.py` must be **GREEN** at head. It compares against its own
  baseline internally, so unlike the conformance run it has no excuse.

Read the harness's **NOT COVERED** section before accepting any coverage claim
in the PR body: it names every fixture that could not be executed and why, and a
claim of coverage by a fixture in that list is not coverage. A fixture reported
`NOT_COVERED / nothing to compare` answered but verified nothing — it is not a
pass.

If the PR adds a checker without adding its negative control, that is a
`CORRECTNESS_GAP` — a checker never shown to fail is not a gate (canon
`CORE-CANON-COVERAGE-001` item 9, and `DEC-016`). Check the control fires for
the **mechanism it names**: `run-mutations.py` reports `NOT CAUGHT BY ITS NAMED
MECHANISM` when a sabotage turns something else red instead, which is how a
checker that cannot fire gets published as demonstrated.

## 2 — First, if the change touches the UI: `unimpressed-reefkeeper`

**If the changed paths include anything the owner will look at — a screen, a
number, a word, a control — `unimpressed-reefkeeper` runs before any other
reviewer.** A change confined to the engine or the canon skips it; say that you
skipped it and why.

It drives the running app in a browser and reports what does not make sense. It
reads no code and no canon, so it is the one reviewer that gets **no diff, no
changed-path list and no stated intent** — give it the running app and nothing
else. Withholding the diff is the point: every other reviewer in the table below
checks the change against an authority, and this gate exists partly because
authority-checking reviewers have passed, as correct and fully tested, faults
that were obvious within seconds of using the app.

**It runs first because a fault it can see in ten seconds should not wait for a
specialist to prove it from a document.**

**Two prerequisites. It stops without them, and stopping is correct.**

1. **The app running in a browser it can drive**, at a phone viewport, built
   from the head commit. `npm run dev`. Not screenshots, not source.
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
under `not examined`.** Half a review from this agent is worse than none,
because it will be trusted. Never let it fall back to reading source.

Its findings enter the round like any other reviewer's: severities and
dispositions as in step 4, `jake` sorts them at the end, and **this workflow
still fixes nothing.** Its three escalations — anything touching chemistry or
the canon, anything it flags as *"was this decided?"*, and anything where it
names two options rather than one answer — are owner decisions, and go in the
report's `owner decisions raised` line and into
`docs/process/OPEN-OWNER-DECISIONS.md`.

It does not count against the "default: one reviewer" rule below, and it is
never the reviewer that rule selects. It answers a different question.

## 3 — Choose the reviewers

**Default: one.** Pick the one whose subject the change actually is:

| Reviewer | Its question |
|---|---|
| `integrator` | What does this do to everything else, and does any rule now have two owners? (default for documentation and cross-cutting changes) |
| `test-engineer` | Would any test actually fail if this were wrong? |
| `canon-conformance-auditor` | Does this match the frozen canon as written? |
| `breaker` | What input, timing, evidence or extreme state makes this produce a wrong or unsafe result? |
| `domain-verifier` | Is the scientific or reef-domain claim it makes or implies actually supported? |
| `migration-auditor` | Is historical truth, provenance or V1-to-V2 promotion at risk? |
| `architecture-reviewer` | Does this technical choice carry the product described in the vision and roadmap? |
| `normal-operation-reviewer` | On an ordinary tank with ordinary readings, does this give a sensible answer? |

**Add more only where the change materially touches that subject.** State which
you ran and which you considered and skipped — a skip needs a reason, but a
reason is one line.

**`normal-operation-reviewer` is triggered by subject, not by risk** (`DEC-018`):
add it whenever the change touches trend, dose, retest or user-visible output
behaviour. It runs independently of `breaker` rather than after it — they answer
different questions, and neither's result should shape the other's. It reports
in specification mode until a runtime exists, and says so.

**Chemistry, controller, dosing or safety-rail changes always get
`canon-conformance-auditor` and `breaker`, both.** That is the floor for work
where a wrong answer reaches a tank.

Reviewers run concurrently in fresh context, each with the same brief and no
knowledge of the others' findings.

## 4 — Adjudicate only if you need to, then `jake`

Invoke `adjudicator` when reviewers disagree, when a serious finding is
contested, or when there are enough findings that deduplication is real work.
With one reviewer and a short list, read the findings yourself and say you did.

Where a finding needs an owner decision, **you** invoke `advisor` to work it up —
agents cannot invoke each other.

Severities: `BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`, `EXPECTED_DEBT`,
`OPTIONAL`. Dispositions: `UNCONFIRMED`, `BLOCKED_BY_OWNER_DECISION`.

Verify a finding before promoting it, and verify an `EXPECTED_DEBT` citation
before accepting it — open the cited passage and check it defers *this* gap.

**Then `jake`, last, over whatever the round produced.** He is not a reviewer
and adding him does not extend the review (`DEC-017`): he sorts finished
findings into `BUG`, `EDGE CASE` or `ALREADY COVERED` by whether the reference
system would plausibly reach the state, and he changes no severity. Run him when
the round produced findings the owner will read; a clean round has nothing for
him to sort and you say so. Where `adjudicator` also ran, it goes first and
`jake` sorts its adjudicated list.

The two labels are read together and neither replaces the other: `BLOCKER` +
`EDGE CASE` is a verified defect nobody will meet, and the report carries both.

## 5 — One classification

| Classification | Meaning |
|---|---|
| `PASS` | No `BLOCKER` and no `CORRECTNESS_GAP`. Ready for the owner to consider merging. |
| `PASS_WITH_EXPECTED_DEBT` | Same, with deferred gaps that each cite the roadmap entry or recorded decision deferring them. An uncited gap is not expected debt. |
| `CHANGES_REQUIRED` | One or more `BLOCKER` or `CORRECTNESS_GAP` that existing authorities are sufficient to fix. |
| `BLOCKED_BY_OWNER_DECISION` | Progress requires a decision no current authority provides. Name it; do not make it. |
| `CANON_DEFECT` | The frozen canon is self-contradictory, unimplementable as written, or contradicted by current science. Requires the owner. Never resolved by reinterpretation. |

Where more than one applies, report the most severe and list the others.

## 6 — Report

```
target: (base..head, changed paths, stated intent)
independence: (was this reviewed by a session that did not write it?)
unimpressed-reefkeeper: (run? if not, why not — engine/canon-only change, or
                         no driveable browser)
reviewers run: (and which were considered and skipped, with reasons)
conformance harness: (base verdict vs head verdict; any subject newly failing;
                     mutation harness green?; what it reported as NOT COVERED)
classification:
findings, ranked: (id / severity / what / evidence / authority quoted / fix)
expected debt: (each with the citation that defers it)
owner decisions raised: (and file each in docs/process/OPEN-OWNER-DECISIONS.md)
not examined:
```

## Hard limits

- **Never merge.** Never enable auto-merge. Never push to `main`. Merging
  requires the owner.
- Do not fix findings from inside this workflow. Reviewing and repairing in one
  pass destroys the independence the gate exists to provide.
- Do not modify canon, tests or implementation.
- Do not upgrade a preference into a `BLOCKER`, or downgrade a real defect to
  let a change through.
- Do not report a clean gate without stating what nobody examined.
