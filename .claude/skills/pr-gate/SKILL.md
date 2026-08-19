---
name: pr-gate
description: Fresh-context independent review of an existing pull request or diff - canon conformance, adversarial, test coverage, integration, plus domain, migration or architecture specialists as applicable, ending in one adjudicated classification. Reviews only; never fixes, never merges. Use before a PR is considered ready for the owner.
argument-hint: <PR number, branch name, or diff description>
disable-model-invocation: true
---

# pr-gate

Independent review of work that already exists. The target is: **$ARGUMENTS**

This workflow **reviews**. It does not implement, does not fix, and does not
merge. Its output is a classification and a findings list for the owner.

Run it in a session that did not produce the change. If that is not possible,
say so in the report — a self-review labelled as independent is worse than no
review, because it claims a check that did not happen.

---

## Stage 1 — Establish the target

Determine exactly what is under review and record it:

- the base and head commits;
- the complete list of changed paths;
- the full diff, written to a scratch file outside the repository.

Reviewers do not produce the diff themselves — seven of the nine have no shell,
and the two that do (`breaker`, `test-engineer`) have it to reproduce failures
and run checks, not to write. Pass them the scratch diff path plus the changed
paths. Also give them the stated intent of the change — its PR body,
task or plan — because "does this do what it claims" is part of the review.

If the change is large, chunk the diff by module rather than by line count, and
say how you chunked it.

## Stage 2 — Specialist review, in fresh context

Run these concurrently. Each gets the same brief and no knowledge of the others'
findings.

**Always:**

| Reviewer | Question it answers |
|---|---|
| `canon-conformance-auditor` | Does this match the frozen canon as written, and does every rule it touches trace to one owner and a covering fixture? |
| `breaker` | What input, timing, evidence, intervention, migration or extreme state makes this produce a wrong or unsafe result? |
| `test-engineer` | Would any test actually fail if this were wrong? |
| `integrator` | What does this do to everything else, and does any rule now have two owners? |

**Conditionally — run and say so, or skip and say why:**

| Reviewer | Run it when |
|---|---|
| `domain-verifier` | the change asserts, relies on or implies a scientific or reef-domain claim |
| `migration-auditor` | historical data, provenance, time precision, schema, import/export or migration behaviour is involved |
| `architecture-reviewer` | the change selects, constrains or commits technical architecture |

A conditional reviewer skipped without a stated reason invalidates the gate.

**Documentation-only changes.** `integrator` is the primary reviewer: dead
cross-references, stale statements, competing authority and duplicated
instruction. `canon-conformance-auditor` still runs, because a process document
can misstate or quietly compete with canon. `breaker` still runs, against the
document as a specification — what does it fail to forbid? `test-engineer`
usually has nothing to examine and should say so rather than manufacturing
findings.

## Stage 3 — Adjudicated summary

Invoke `adjudicator` once with every report in full, including each reviewer's
"not examined" section.

The adjudicator deduplicates, independently verifies serious findings, resolves
disagreements only where canon or a recorded decision provides the authority,
and routes everything else to the owner rather than deciding it.

Agents cannot invoke each other. Where the adjudicator returns
`BLOCKED_BY_OWNER_DECISION`, **you** invoke `advisor` to work it up before it is
reported or filed.

Severities: `BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`, `EXPECTED_DEBT`,
`OPTIONAL`; dispositions `UNCONFIRMED` and `BLOCKED_BY_OWNER_DECISION`.

## Stage 4 — Final classification

Exactly one:

| Classification | Meaning |
|---|---|
| `PASS` | No `BLOCKER` and no `CORRECTNESS_GAP`. Ready for the owner to consider merging. |
| `PASS_WITH_EXPECTED_DEBT` | Same, but with deferred gaps that each cite the roadmap entry or recorded decision deferring them. An uncited gap is not expected debt. |
| `CHANGES_REQUIRED` | One or more `BLOCKER` or `CORRECTNESS_GAP` findings that the existing authorities are sufficient to fix. |
| `BLOCKED_BY_OWNER_DECISION` | Progress requires a decision no current authority provides. Name the decision; do not make it. |
| `CANON_DEFECT` | The frozen canon is self-contradictory, unimplementable as written, or contradicted by current science. Requires the owner. Never resolved by reinterpretation. |

Where more than one applies, report the most severe, and list the others.

## Stage 5 — Report

```
target: (base..head, changed paths, stated intent)
independence: (was this reviewed by a session that did not write it?)
reviewers run: (and conditional reviewers skipped, with reasons)
classification: PASS | PASS_WITH_EXPECTED_DEBT | CHANGES_REQUIRED |
                BLOCKED_BY_OWNER_DECISION | CANON_DEFECT
findings, ranked: (id / severity / what / evidence / authority quoted /
                   what would fix it)
expected debt: (each with the citation that defers it)
owner decisions raised: (and file each in docs/process/OPEN-OWNER-DECISIONS.md)
not examined by anyone:
```

## Hard limits

- **Never merge.** Never enable auto-merge. Never push to `main`. Whatever the
  classification, merging requires explicit owner approval.
- Do not fix findings from inside this workflow. Reviewing and repairing in one
  pass destroys the independence the gate exists to provide. Hand the findings
  back.
- Do not modify canon, tests or implementation.
- Do not upgrade a preference into a `BLOCKER`, or downgrade a real defect to let
  a change through.
- Do not report a clean gate without stating what nobody examined.
