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

## 2 — Choose the reviewers

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

**Add more only where the change materially touches that subject.** State which
you ran and which you considered and skipped — a skip needs a reason, but a
reason is one line.

**Chemistry, controller, dosing or safety-rail changes always get
`canon-conformance-auditor` and `breaker`, both.** That is the floor for work
where a wrong answer reaches a tank.

Reviewers run concurrently in fresh context, each with the same brief and no
knowledge of the others' findings.

## 3 — Adjudicate only if you need to

Invoke `adjudicator` when reviewers disagree, when a serious finding is
contested, or when there are enough findings that deduplication is real work.
With one reviewer and a short list, read the findings yourself and say you did.

Where a finding needs an owner decision, **you** invoke `advisor` to work it up —
agents cannot invoke each other.

Severities: `BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`, `EXPECTED_DEBT`,
`OPTIONAL`. Dispositions: `UNCONFIRMED`, `BLOCKED_BY_OWNER_DECISION`.

Verify a finding before promoting it, and verify an `EXPECTED_DEBT` citation
before accepting it — open the cited passage and check it defers *this* gap.

## 4 — One classification

| Classification | Meaning |
|---|---|
| `PASS` | No `BLOCKER` and no `CORRECTNESS_GAP`. Ready for the owner to consider merging. |
| `PASS_WITH_EXPECTED_DEBT` | Same, with deferred gaps that each cite the roadmap entry or recorded decision deferring them. An uncited gap is not expected debt. |
| `CHANGES_REQUIRED` | One or more `BLOCKER` or `CORRECTNESS_GAP` that existing authorities are sufficient to fix. |
| `BLOCKED_BY_OWNER_DECISION` | Progress requires a decision no current authority provides. Name it; do not make it. |
| `CANON_DEFECT` | The frozen canon is self-contradictory, unimplementable as written, or contradicted by current science. Requires the owner. Never resolved by reinterpretation. |

Where more than one applies, report the most severe and list the others.

## 5 — Report

```
target: (base..head, changed paths, stated intent)
independence: (was this reviewed by a session that did not write it?)
reviewers run: (and which were considered and skipped, with reasons)
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
