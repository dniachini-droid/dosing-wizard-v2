# 2026-08-19 — Workforce founding, and the `overnight-cycle` dry run

Run type: attended founding work, with a documentation-only dry run of
`/overnight-cycle` performed against the founding change itself.

Branch: `claude/awesome-darwin-9dh9zn`

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

**Reproduced `BLOCKER`s — all fixed and the fix verified by re-running the probe.**

| # | Finding | Resolution |
|---|---|---|
| F1 | `git push origin HEAD:refs/heads/main` matched no deny rule; the fully-qualified refspec bypassed all three push guards, and the `ask` rule did not intercept it | Deny list rewritten around what a push *contains* rather than how it is spelled. Re-probed: denied. `main` verified still at `51b8252` — the probes were dry-run only |
| F2 | `git push origin +HEAD:…` force refspec matched neither `-f` nor `--force` | Denied via `*+*`. Re-probed: denied |
| F3 | `gh api --method PUT …/merge` was undenied, as were the GitHub MCP write tools (`create_or_update_file`, `push_files`, `delete_file`) which write to the remote without touching `Bash` or `Edit` | All denied. Re-probed: `gh api` denied; the three MCP tools were removed from availability immediately, confirming the rules bind |
| F4 | A task instruction could supply a chemistry threshold. Every gate was worded against *invention*, and Stage 1 promoted task text to "authority" | Stage 0 criterion 1 rewritten: the governing test is whether the canon states it, not whether this run made it up. Task instructions are scope, never behavioural authority. `CLAUDE.md`'s "for implementation convenience" qualifier removed |
| F5 | `OPEN-OWNER-DECISIONS.md`'s template *mandated* options, which for a threshold question are numbers — written after the last review gate, into a file no reviewer reads. The V1 contamination route, reconstructed | Register now forbids chemistry values outright and requires options stated qualitatively; "no basis for a recommendation" made an acceptable complete entry |

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

Mechanical checks that *were* run: YAML frontmatter parses for all twelve
definitions; agent names unique and matching filenames; no agent holds `Edit`,
`Write` or `NotebookEdit`; the roster's tool table matches the frontmatter
exactly; every cross-referenced path resolves; no chemistry-unit numeral appears
anywhere in the new files; `docs/canon/` SHA-256 unchanged.

Agent discoverability was confirmed empirically: a session started after the
definitions existed listed all nine, and both skills resolved as user-invocable
slash commands.

## Stage 8 — final diff review

Performed. 20 files, no path outside the declared scope, nothing under
`docs/canon/`, no chemistry value, no V1 value carried in, no test weakened
(none exist), no owner decision resolved — three were filed instead.

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

## Stopping point

The workflow stopped at the pull request, as designed. It did not merge, and
`main` remains at `51b8252`.
