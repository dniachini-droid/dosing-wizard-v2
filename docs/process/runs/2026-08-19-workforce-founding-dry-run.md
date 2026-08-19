# 2026-08-19 — Workforce founding, and the `overnight-cycle` dry run

Run type: attended founding work, with a documentation-only dry run of
`/overnight-cycle` performed against the founding change itself.

Branch: `claude/awesome-darwin-9dh9zn` · Base commit: `51b8252`

**Read this first — how this record was produced.** It was written **after** the
work, in one pass, not incrementally as `docs/process/runs/README.md` requires.
The write-as-you-go contract and the Stage 1 baseline capture were both
*introduced by this run*, so neither could have governed it. Nothing here should
be read as evidence that the workflow's audit-trail discipline was followed —
it did not yet exist. It is a retrospective account, and its value depends
entirely on it being accurate about that.

Stage numbering below is used to describe what happened, not to claim the stages
were executed in that order.

**Which tree each review saw.** The reviews were not all run against the same
tree, and this matters when reading their findings:

| Review | Tree it read |
|---|---|
| Challenge to the V1 salvage audit | the audit as first drafted, before the process documents it referenced existed |
| `canon-conformance-auditor` | commit `36b238f` |
| `integrator` | commit `36b238f` |
| `breaker` | `36b238f` plus uncommitted edits made *while it was reading*; it said so itself |
| — | **no review has read the tree as it now stands** |

Findings from the first review that named missing files were already stale when
they arrived, because the files were written between drafting and review. That is
recorded rather than tidied away.

---

## Task

Build the Dosing Wizard V2 Claude Code agent roster and autonomous-review
system. Process and agent infrastructure only.

## Stage 0 — admissibility

Admissible. The task is specified by its own brief, bounded to process
infrastructure, requires no chemistry, no stack selection and no canon change,
and is explicitly safe unattended under every category in
`OVERNIGHT-AUTONOMY.md` ("read-only audits", "documentation", "adversarial
review").

One constraint was checked before starting and held throughout: nothing under
`docs/canon/` may be modified. Verified by SHA-256 at the start of the run and
again at the end. Unchanged.

## Stage 1 — plan

In scope: `.claude/agents/`, `.claude/skills/`, `.claude/settings.json`,
`CLAUDE.md`, `docs/process/`.

Explicitly out of scope: application code, `package.json`, framework selection,
chemistry of any kind, `docs/canon/`, and any edit to `PRODUCT-VISION.md` or
`ROADMAP.md`.

Authority: the task brief for scope; `PRODUCT-VISION.md`, `ROADMAP.md`,
`DECISIONS.md`, `PROJECT-STATE.md` for direction; the frozen canon for anything
behavioural.

## Stage 2 — implementation

Nine agents, three workflows, one settings file, `CLAUDE.md`, five process
documents. The V1 repository was read at commit `9276a2c`, read-only, and never
modified.

## Stage 3 — independent review, fresh context

Three reviewers were invoked as subagents, each with no knowledge of the
authoring session's reasoning. **This was the dry run**: the point was to
establish that the workforce actually functions, and it did.

| Reviewer | Invoked | Result |
|---|---|---|
| `canon-conformance-auditor` | successfully | 6 × `CORRECTNESS_GAP`, no `BLOCKER`, no `CANON_DEFECT` |
| `breaker` | successfully | 5 × `BLOCKER`, 12 × `CORRECTNESS_GAP`, 1 × `OPTIONAL` |
| `integrator` | successfully | 26 findings, no `BLOCKER`, no `CANON_DEFECT` |

Skipped, with reasons: `test-engineer` (no deterministic code and no test suite
exists), `domain-verifier` (the change makes no scientific claim),
`migration-auditor` (no schema, history or migration behaviour),
`architecture-reviewer` (no architecture is selected or constrained).

A fourth reviewer, run earlier against the V1 salvage audit specifically, is
recorded in `V1-AGENT-SALVAGE-AUDIT.md` under "The audit was independently
challenged, and was wrong in nine places".

## Stage 4 — adjudication

Adjudicated by the authoring session rather than by the `adjudicator` subagent,
because the reviewers' findings were largely disjoint rather than conflicting,
and because several findings were *about* the adjudication machinery itself. The
severity vocabulary and the verification discipline were applied as written.
This is a deviation from the workflow and is recorded as one.

## Stage 5 — findings and resolutions

**Reproduced `BLOCKER`s.** Each was fixed. Three of the five were re-probed
directly; the other two are documentation changes with nothing to probe. Where
this table says "re-probed", a command was actually run and its result observed.
Where it does not, no such claim is made.

| # | Finding | Resolution |
|---|---|---|
| F1 | `git push origin HEAD:refs/heads/main` matched no deny rule; the fully-qualified refspec bypassed all three push guards, and the `ask` rule did not intercept it | Deny list rewritten around what a push *contains* rather than how it is spelled. Re-probed: denied. `main` verified still at `51b8252` — the probes were dry-run only |
| F2 | `git push origin +HEAD:…` force refspec matched neither `-f` nor `--force` | Denied via `*+*`. Re-probed: denied |
| F3 | `gh api --method PUT …/merge` was undenied, as were the GitHub MCP write tools (`create_or_update_file`, `push_files`, `delete_file`) which write to the remote without touching `Bash` or `Edit` | All denied. Re-probed: `gh api` denied. The three MCP tools disappeared from the available tool surface when the rule landed, which is direct evidence that tool-name denies bind. The approval, review-thread, PR-mutation and Actions-trigger tools were denied in a later pass and were **not** individually probed |
| F4 | A task instruction could supply a chemistry threshold. Every gate was worded against *invention*, and Stage 1 promoted task text to "authority" | Stage 0 criterion 1 rewritten: the governing test is whether the canon states it, not whether this run made it up. Task instructions are scope, never behavioural authority. `CLAUDE.md`'s "for implementation convenience" qualifier removed. Documentation change; nothing to probe |
| F5 | `OPEN-OWNER-DECISIONS.md`'s template *mandated* options, which for a threshold question are numbers — written after the last review gate, into a file no reviewer reads. The V1 contamination route, reconstructed | Register now forbids chemistry values outright and requires options stated qualitatively; "no basis for a recommendation" made an acceptable complete entry. `advisor` separately barred from generating numeric options. Documentation change; nothing to probe |

**`CORRECTNESS_GAP`s fixed.** Attribution of an ordered five-stage pipeline to
canon that canon does not state (canon owns the narrower `X-INV-004`, §79, §80
claims; `DEC-003` owns the separation). A replay test specified in the direction
opposite to canon §64. `CORE-CANON-COVERAGE-001` compressed in a way that
dropped its enforceable items. `EXPECTED_DEBT` exempt from the only verification
step in the system. `git diff` blindness to created files. Governance files
editable by the run they govern. An unbounded cycle ceiling. `BLOCKER` carried
into a PR. `CANON_DEFECT` a terminal state with no documented exit. Circular
deferral between `advisor` and `domain-verifier`. "Route to `advisor`"
unexecutable, since no agent can invoke another. The run record unable to meet
its own write-as-you-go contract. Duplicated ownership between
`canon-conformance-auditor` and `integrator`. Missing "not examined" fields.
Roster-versus-directory drift owned by nobody.

**Deliberately not fixed.** The duplication of the reviewer set and the severity
vocabulary across the roster, the two workflows and the agent prompts. Prompt
self-sufficiency is worth more here than single-sourcing, because an agent
cannot follow a pointer at runtime. Recorded as accepted, not overlooked.

## Stage 6 — re-review

Not performed. The fixes were applied and verified individually — each
`BLOCKER` by re-running the probe that reproduced it — but the reviewers were
not re-invoked over the amended tree. **This is the run's main outstanding gap.**
`/pr-gate`, run by a session that did not write this, is the correct next step
and is recommended in the pull request.

## Stage 7 — checks

No test suite, no linter and no build exist in this repository. Nothing was
run, and nothing is claimed to have passed.

Mechanical checks that *were* run, on the tree at the time each ran: YAML
frontmatter parses for all 12 definitions (9 agents + 3 skills); agent names
unique and matching filenames; no agent holds `Edit`, `Write` or `NotebookEdit`;
the roster's tool table matches the frontmatter; every cross-referenced path
resolves; no chemistry-unit numeral in the new files; `docs/canon/` SHA-256
unchanged.

Agent discoverability was confirmed empirically: a session started after the
definitions existed listed all 9 agents. Skill availability was probed for
`/overnight-cycle` and `/pr-gate`, which both resolved as user-invocable slash
commands; **`/research-sprint` was not individually probed.** All 3 skills are
present and structurally identical.

## Stage 8 — final diff review

Performed against `HEAD`, **not** against the run base commit — the
base-commit comparison this workflow now mandates was written as a result of
this run and did not exist while it was under way. Re-checked afterwards against
`51b8252`: 22 files changed, no path outside the declared scope, nothing under
`docs/canon/` (confirmed by SHA-256, not by diff), no chemistry value, no V1
value carried in, no test weakened (none exist), no owner decision resolved —
three were filed instead.

## Owner decisions raised

Filed in `docs/process/OPEN-OWNER-DECISIONS.md`:

- **OD-001** — should `main` be branch-protected on GitHub? Raised by the
  breaker's finding that command-pattern deny rules are not a security boundary.
  This is the only control in the system that does not depend on Claude
  behaving correctly, and it is an owner action.
- **OD-002** — does `DECISIONS.md` cover process and workforce architecture?
- **OD-003** — which reason codes apply when a canon rule cannot be
  implemented? The preserved handoff and the V2 vocabulary give different lists.

## What was deliberately not done

No application code, no `package.json`, no stack selection, no chemistry, no
canon edit, no V1 modification, no merge. The V1 salvage audit covers agents and
routines only — V1 application code, journeys, tests and the unmigrated-canon
record remain outside it, as `PROJECT-STATE.md` records.

## Second corrective pass — after the `/pr-gate` review of PR #2

PR #2 received a fresh-context `/pr-gate` review, classified
**`CHANGES_REQUIRED`**, raising material findings M1–M8. A focused corrective
commit followed. In summary: the governance model stopped claiming the
push/merge surface was closed when it cannot be shown closed; the GitHub
approval, review-thread, PR-mutation and Actions-trigger tools were denied by
name and `.github/**` protected; Stage 8 was rewritten to diff against the run
base commit and to verify canon by digest; governance-definition files were
separated from run output so that mandatory audit-trail writes are not behind a
prompt unattended work cannot answer; sourced research values were given an
explicitly non-authoritative home under `docs/research/`; `DECISIONS.md` was
barred from acting as chemistry authority; `advisor`'s classification vocabulary
was closed to four values with every consumer handling all four, and it was
barred from emitting numeric chemistry options; divergent duplicated statements
were reconciled; and this record was corrected.

## Deviations from the workflow, stated plainly

1. **This record was written after the fact**, not incrementally. The
   write-as-you-go rule was introduced by this run.
2. **No Stage 1 baseline was captured** while the run was under way. The base
   commit and canon digests were reconstructed afterwards from `51b8252`. That
   reconstruction is sound here only because the base commit is known and
   unambiguous; in a normal run it would not be.
3. **Stage 4 was adjudicated by the authoring session**, not by the `adjudicator`
   subagent.
4. **Stage 6 re-review was not performed.** Fixes were verified individually.
   This remains true after the corrective pass: no reviewer has read the tree as
   it now stands.
5. **The corrective pass used one focused self-check**, not a fresh multi-agent
   review, as instructed.

## Stopping point

The workflow stopped at the pull request, as designed. It did not merge, and
`main` remains at `51b8252`.

The outstanding gap is unchanged and is the reason this record exists: **no
independent review has read the current tree.** A `/pr-gate` run from a session
that did not write this is the correct next step.
