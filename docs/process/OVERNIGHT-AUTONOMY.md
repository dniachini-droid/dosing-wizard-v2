# Overnight Autonomy

What Claude may and may not do on Dosing Wizard V2 while the owner is asleep.

This document governs unattended work. `/overnight-cycle` implements it.
`CLAUDE.md` states the rules it rests on. Where this document and a task
instruction disagree, the stricter one wins.

---

## The principle

Unattended work is safe when the answer is already determined and the agent's
job is to carry it out carefully. It is unsafe when the agent would have to
decide something.

Everything below follows from that one distinction.

An unattended run that stops early with a clearly stated open question has
succeeded. A run that guessed, and produced a plausible answer nobody will think
to check, has failed — and will keep failing silently, because the output looks
exactly like success.

---

## Generally SAFE unattended — when explicitly specified

Each of these is safe only when the task states *what* to do specifically enough
that no scope or behavioural judgement is required mid-run.

- **Implementation of frozen or already-decided requirements.** The behaviour is
  in the canon or in `DECISIONS.md`, and the task points at it.
- **Deterministic tests.** Boundary, threshold-straddling, invariant, golden
  derived from canon, replay and long-run tests for behaviour that is already
  specified.
- **Mechanical refactors.** Renames, file moves, extractions and
  de-duplications that provably preserve behaviour, with the proof.
- **Explicit schema and migration work.** Where the target schema and the
  migration semantics are specified, and no field's meaning has to be invented.
- **Read-only audits.** Every reviewer in the roster, on anything.
- **Technical architecture research.** Gathering and sourcing evidence, and
  presenting options with their costs and falsifiers.
- **Documentation.** Recording what exists, what was decided, and what is open.
- **Adversarial review.** Attacking assumptions and implementations to produce
  reproducible failures. This is the highest-value unattended activity available,
  because it produces evidence and changes nothing.

## NOT safe to invent unattended — ever

If a run needs one of these and does not already have it, the run stops.

- **Chemistry thresholds.** Any band edge, rate limit, trigger, tolerance,
  noise floor, cadence or evidence minimum that the canon does not state.
- **New safety rails.** Including "conservative" ones. A rail invented to be
  safe is still an invented rule with no owner and no evidence.
- **Unsupported scientific conclusions.** Including conclusions assembled from
  sources that do not individually support them.
- **Major product-policy decisions.** Scope, pricing, entitlement, data
  retention, what the product commits to a user, what it refuses to do.
- **Destructive migration policy.** Deletion, truncation, lossy transformation,
  or any default that replaces a meaningfully absent value.
- **Changes to frozen canon.** Including "obvious" corrections, typo fixes, and
  updating the stale freeze identifiers in the preserved implementation handoff.
- **Merging pull requests.** Under any circumstances, however green the checks.

There is no "provisional" version of any of these. A provisional threshold is a
real threshold that nobody labelled, and it will be discovered later by a reader
who assumes somebody chose it deliberately.

## The grey area, and how to resolve it

Some tasks look specified and are not. The test:

> Could two competent people, reading only the task and the current
> authorities, implement this differently in a way a user would notice?

If yes, it is not specified. Invoke `advisor` to classify it. If `advisor`
returns `owner-decision` or `canon-defect`, that part of the run stops.

Do not resolve the ambiguity by picking the option that is easier, faster, or
closer to what V1 did.

---

## Normal unattended lifecycle

```
branch
  → bounded work
    → independent review
      → fixes
        → tests
          → PR
            → STOP
```

Expanded, this is `/overnight-cycle`:

| Stage | What must be true to leave it |
|---|---|
| 0 · Task contract validation | The task is specified, bounded, safe unattended, requires no invented chemistry or policy, and needs no canon change. Otherwise: stop, or continue only with genuinely independent work. |
| 1 · Plan | Scope, out-of-scope, authorities quoted, testable acceptance criteria, and how to undo it — all written down before any code. |
| 2 · Primary implementation | Inside scope. Test first where possible. Authority cited at the point of implementation. No test weakened. |
| 3 · Independent review, fresh context | The four always-on reviewers ran; each conditional reviewer either ran or has a stated reason it did not. |
| 4 · Adjudicator synthesis | One classified finding list exists, with what nobody examined stated. |
| 5 · Fix genuine failures | `BLOCKER` and `CORRECTNESS_GAP` addressed; `OPTIONAL` and `UNCONFIRMED` left alone; `EXPECTED_DEBT` recorded with its citation. |
| 6 · Independent re-review | Re-reviewed in fresh context. **At most two fix/re-review cycles.** |
| 7 · Test and check suite | Real output pasted, or an explicit statement that nothing executable exists yet. |
| 8 · Final diff review | The whole diff read adversarially against the scope and the prohibitions. |
| 9 · Run record | Written to `docs/process/runs/`, one file for this run. |
| 10 · Commit, push, PR | On the working branch. PR into `main`. **Then stop.** |

---

## Bounds

**Two fix/re-review cycles maximum**, unless the initiating task explicitly
authorises more. After the second cycle, outstanding findings are recorded with
their severities and carried into the PR as known state. Continuing to churn
produces a diff nobody can review and an audit trail nobody can follow.

**One bounded job per run.** Adjacent improvements, opportunistic refactors and
"while I was in there" changes are out of scope by default. If something clearly
needs doing, record it; do not do it.

**Scope is declared before work starts and does not grow silently.** Leaving the
declared scope requires stopping and recording why, first.

**Blocked work stops; independent work continues.** If an owner decision blocks
part of a run, document it and carry on only with work that would not have to be
redone once the decision lands. Work that merely looks separable is not.

---

## Prohibited at all times

- Merging any pull request, or enabling auto-merge.
- Pushing to `main`.
- Force-pushing, or rewriting history on a branch someone else may hold.
- Modifying anything under `docs/canon/`.
- Editing `PRODUCT-VISION.md` or `ROADMAP.md` to make a check, test or run pass.
- Weakening, skipping, quarantining or deleting a test to reach green.
- Recording a claim as verified without having run the thing that verifies it.
- Filling a gap in canon, a decision or the evidence with an invented value.
- Treating V1 behaviour, V1 tests, V1 goldens or V1 approvals as authority.

The first three are also denied at the tool level in `.claude/settings.json`.
The deny rules are a backstop, not the reason — a rule that is only obeyed
because it is enforced will be evaded by the first path the enforcement misses.

---

## Audit trail

Every unattended run writes one file to `docs/process/runs/`. One run, one file,
never a shared file — concurrent writers to a shared record corrupt it, and the
corruption is not noticed until the record is needed.

A run record must contain:

- the task, and the admissibility decision from Stage 0;
- the plan, including declared out-of-scope;
- what was actually implemented, and any departure from the plan with its reason;
- which reviewers ran, and for each conditional reviewer that did not, why;
- every material finding: severity, what it was, and how it was resolved —
  including findings deliberately not fixed, and why;
- outstanding findings carried into the PR;
- checks run, with real output;
- open owner decisions raised, and where they were filed;
- what was deliberately not done.

Material findings and their resolutions are the point. A run that did good work
and wrote nothing down did nothing, because nobody can tell afterwards whether
it was careful or lucky.

Open owner decisions are additionally filed in
`docs/process/OPEN-OWNER-DECISIONS.md`, which is a queue and not an authority.
A decision becomes authority only when the owner records it in `DECISIONS.md`.

---

## What "done" means

A run is done when it has produced a pull request, or when it has stopped with a
clearly stated reason and a run record explaining it.

A run is **not** done because the code compiles, because the tests are green,
because the diff looks reasonable, or because a reviewer said `PASS`. Those are
inputs to the judgement the owner will make. The owner makes it.

Claude may open the pull request. Claude never merges it.
