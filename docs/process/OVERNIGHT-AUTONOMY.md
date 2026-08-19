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
| 5 · Fix genuine failures | `BLOCKER` addressed; `CANON_DEFECT` addressed only by ceasing to rely on the defective rule, never by editing canon, and escalated; `CORRECTNESS_GAP` addressed; `OPTIONAL` and `UNCONFIRMED` left alone; `EXPECTED_DEBT` recorded with its citation. |
| 6 · Independent re-review | Re-reviewed in fresh context. **At most two fix/re-review cycles.** |
| 7 · Test and check suite | Real output pasted, or an explicit statement that nothing executable exists yet. |
| 8 · Final diff review | The whole diff read adversarially against the scope and the prohibitions. |
| 9 · Run record | Written to `docs/process/runs/`, one file for this run. |
| 10 · Commit, push, PR | On the working branch. PR into `main`. **Then stop.** |

---

## Bounds

**Two fix/re-review cycles maximum.** A task may raise this to at most four by
saying so explicitly. Nothing removes the ceiling. A run may not start another
run, nor restart itself to reset the count.

When the limit is reached, outstanding findings are recorded with their
severities and carried into the PR as known state — **except a `BLOCKER`, which
is never carried into a pull request.** `BLOCKER` means work must not proceed.
A run still holding one stops with its run record and opens nothing.

Continuing to churn produces a diff nobody can review and an audit trail nobody
can follow.

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
- **Approving a pull request, or submitting any review that could satisfy a
  required-review check.** Claude never approves its own work or anyone else's.
- **Resolving or unresolving a review thread**, which can make outstanding
  feedback appear addressed.
- **Retargeting a pull request's base or head**, or otherwise changing what a
  review is a review *of*.
- **Triggering a GitHub Actions workflow run**, which can reach automation that
  merges.
- **Editing anything under `.github/`** — workflows, actions and repository
  automation are a merge path.
- Pushing to `main`.
- Force-pushing, or rewriting history on a branch someone else may hold.
- Modifying anything under `docs/canon/`.
- Editing `PRODUCT-VISION.md` or `ROADMAP.md` to make a check, test or run pass.
- Weakening, skipping, quarantining or deleting a test to reach green.
- Recording a claim as verified without having run the thing that verifies it.
- Filling a gap in canon, a decision or the evidence with an invented value.
- Treating V1 behaviour, V1 tests, V1 goldens or V1 approvals as authority.

**What is actually enforced, and what is not.**

Enforced by removing the capability — the strongest control here:
every GitHub merge, auto-merge, review-approval, review-thread-resolution,
pull-request-mutation and repository-file-write tool is denied **by name** in
`.claude/settings.json`. A denied tool cannot be called, so autonomous merge and
self-approval are not reachable through the GitHub tool surface at all.

Enforced for file-editing tools only:
path denies under `docs/canon/`, `.github/` and the governance-definition list.
An `Edit(path)` rule covers `Edit`, `Write` and `NotebookEdit`. It does **not**
cover `Bash`.

Not enforced, and it should not be described as though it were:
writes to any path via shell redirection or in-place stream editing; `git
rebase`, `git commit --amend`, `git reset --hard`; and the general problem that
command-string patterns match spellings rather than intent. `main` is **not**
branch-protected on GitHub (`OD-001`, still open), so no platform-level control
stands behind any of this.

Those rest on instruction, on the Stage 8 baseline diff, and on the canon digest
check — not on a permission check. The deny rules are a backstop, not the reason:
a rule obeyed only because it is enforced will be evaded by the first path the
enforcement misses. `integrator` owns re-checking this list against the
prohibitions above whenever either changes.

---

## Two categories of file, and why the distinction matters

An approval prompt is not an unattended control. Unattended, a prompt has nobody
to answer it, so it fails closed — which is the right outcome for something a
run must not do, and exactly the wrong outcome for something a run **must** do.
Putting both kinds of file behind the same prompt breaks the audit trail while
pretending to protect the governance.

So the two are separated:

### A. Run output — a run is expected to write these

- `docs/process/runs/**` — the run record. **Mandatory.** A run that cannot write
  its record has no audit trail, which is worse than the risk the file poses.
- `docs/process/OPEN-OWNER-DECISIONS.md` — the owner-decision register.
  Qualitative entries only; never a chemistry value (see below).
- Whatever the task's own declared scope names.

These carry no approval prompt and no deny rule. They are the run's product.

### B. Governance definition — a run must not write these

- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/agents/**`
- `.claude/skills/**`
- `.github/**` — workflow and CI definitions, which can create a merge path
- `docs/process/AGENT-ROSTER.md`
- `docs/process/OVERNIGHT-AUTONOMY.md` — this document
- `PRODUCT-VISION.md`, `ROADMAP.md`, `DECISIONS.md`

These define what unattended work is permitted to do. A process that can rewrite
its own limits has no limits. Changing any of them is an attended, owner-directed
change, never a stage inside a run — and Stage 8 fails the run if one appears in
the scope list.

`PROJECT-STATE.md` sits between the two: it must be updatable when the active
phase, next major step or blockers genuinely change, but not silently. It is
gated by prompt rather than denied, so an unattended run cannot alter it and an
attended session can.

**The owner-decision register is not a chemistry route.** It records questions
qualitatively. Sourced numbers belong under `docs/research/`, marked
non-authoritative, and reach behaviour only through a governed canon reissue.

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

## When work is blocked by the canon

`CANON_DEFECT` is the one finding no amount of care inside a run can clear, and
the system must not pretend otherwise. Unattended, the run stops. But "stop" is
not the end of the route, and leaving the route undefined turns an honest
refusal into a dead end.

The exit is a **governed canon reissue**, and it is an owner act, not an agent
act. It looks like this:

1. The run records the defect: the exact rule ID, both conflicting passages
   quoted, and what could not be implemented as a result.
2. It files an entry in `docs/process/OPEN-OWNER-DECISIONS.md` — qualitative,
   no candidate chemistry values.
3. Where the defect is scientific rather than internal, a `/research-sprint`
   may be commissioned to assemble evidence. It produces a report, not a rule.
4. The owner decides whether to reopen the canon. If they do, the canon is
   reissued under a **new freeze identifier**, superseding rather than editing
   the old one, and every place naming the current freeze is updated together
   (`docs/process/AGENT-ROSTER.md` lists them).
5. Only then does the blocked work become admissible again.

No agent and no unattended run performs step 4. Nothing in this repository
authorises an agent to edit `docs/canon/`, and a `CANON_DEFECT` is not a licence
to start.

## What "done" means

A run is done when it has produced a pull request, or when it has stopped with a
clearly stated reason and a run record explaining it.

A run is **not** done because the code compiles, because the tests are green,
because the diff looks reasonable, or because a reviewer said `PASS`. Those are
inputs to the judgement the owner will make. The owner makes it.

Claude may open the pull request. Claude never merges it.
