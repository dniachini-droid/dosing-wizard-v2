# Autonomy and controls

This document states what actually controls this repository, what merely
disciplines it, and what unattended work is permitted. It replaces the former
`OVERNIGHT-AUTONOMY.md`, which described a Claude-side control system stronger
than the one that exists.

---

## The control model, stated honestly

**The hard control is GitHub.** Branch protection on `main`, required reviews
and repository permissions are the only mechanisms here that do not depend on
Claude behaving correctly. They are **not configured** (`OD-001`, open).

**Everything else in this repository is defence in depth and process
discipline.** It is worth having. It is not a security boundary, and no document
here may describe it as one.

| Mechanism | What it really does |
|---|---|
| **Tool-name deny** (`mcp__github__merge_pull_request`, …) | Genuinely removes the tool from the session's surface. The strongest control in the repository, and still only covers the MCP surface. |
| **Path deny** (`Edit(./docs/canon/**)`) | Binds `Edit`, `Write` and `NotebookEdit` for that path. Does **not** bind `Bash`. Anything with a shell writes past it. |
| **Instructions in `CLAUDE.md`, this file and the agent definitions** | Process discipline. Followed because the roles are written to be followed, not because anything enforces them. |

**Not attempted, deliberately.** This repository does not maintain a list of
denied command spellings. That approach was tried, was shown incomplete twice,
and its `git push *main*` rule also blocked legitimate branches whose names
merely contained the substring — `claude/domain-verifier-fix` among them. A
pattern list cannot be shown complete, only incomplete. Any session holding
`Bash` also holds `curl` and therefore the entire GitHub API; no rule in
`.claude/settings.json` changes that, and pretending otherwise is worse than
admitting it.

---

## Unattended work

**Unattended autonomous merge-capable work is prohibited** until GitHub branch
protection is configured **and verified**. `/overnight-cycle` is marked
NOT AUTHORISED and must not be run.

The prohibition lifts when, and only when, the owner has:

1. enabled branch protection on `main` (no direct pushes, PR required);
2. confirmed Claude's credential cannot merge or dismiss reviews;
3. recorded both in `DECISIONS.md`, superseding `OD-001`.

Until then, work happens in **attended sessions** — including cloud sessions a
person started and can see. Those sessions may branch, commit, push and open
pull requests. **They stop before merge, every time.**

---

## Prohibited, in any session

These are process rules. They are followed because they are right, not because
they are enforced — and where a tool-name deny happens to back one, that is
noted.

- **Merging any pull request, or enabling auto-merge.** *(tool-name deny)*
- **Approving a pull request, or submitting any review that could satisfy a
  required-review check.** Claude never approves its own work or anyone else's.
  *(tool-name deny)*
- **Resolving or unresolving a review thread.** *(tool-name deny)*
- **Retargeting a pull request's base or head.** *(not enforced — process rule)*
- **Triggering a GitHub Actions workflow run.** *(tool-name deny)*
- **Editing anything under `.github/`.** *(not enforced — process rule)*
- Pushing to `main`, force-pushing, or rewriting history on a branch someone
  else may hold. *(not enforced — process rule)*
- Modifying anything under `docs/canon/`. *(path deny for file-editing tools;
  not enforced against `Bash`)*
- Editing `PRODUCT-VISION.md`, `ROADMAP.md` or `DECISIONS.md` to make a check,
  test or run pass. *(not enforced — process rule)*
- Weakening, skipping, quarantining or deleting a test to reach green.
- Recording a claim as verified without having run the thing that verifies it.
- Filling a gap in canon, a decision or the evidence with an invented value.
- Treating V1 behaviour, tests, goldens or approvals as authority.

## Files a run should not change on its own initiative

Changing any of these is an owner-directed change, not a step inside ordinary
work: `CLAUDE.md`, `.claude/settings.json`, `.claude/agents/**`,
`.claude/skills/**`, `.github/**`, `docs/process/AGENT-ROSTER.md`, this file,
`PRODUCT-VISION.md`, `ROADMAP.md`, `DECISIONS.md`.

`PROJECT-STATE.md` is updated when the active phase, next major step or blockers
genuinely change.

**Run output is always writable**, and no rule gates it: `docs/process/runs/**`,
`docs/process/OPEN-OWNER-DECISIONS.md`, and whatever the task's own scope names.
A run that cannot write its record has no audit trail.

---

## Chemistry, in one place

Chemistry behaviour comes from current frozen canon and from **nothing else**.
`DECISIONS.md` cannot supply it, a task instruction cannot supply it, an
owner-decision entry cannot supply it, `docs/research/` cannot supply it, and V1
cannot supply it. The governing test is *does the canon state it*, not *did this
run invent it* — a threshold that arrives in the task text carrying a citation is
exactly as unowned as one that was guessed.

Sourced numbers belong under `docs/research/`, marked
`NON-AUTHORITATIVE — UNDER REVIEW` with their citation, and reach behaviour only
through a governed canon reissue. A run whose declared scope includes
`docs/research/` may write such values there, and nowhere else.

**The owner-decision register is not a chemistry route.** It records questions
qualitatively; a number in it is a defect.

---

## Audit trail

Every substantive run writes one file to `docs/process/runs/`. One run, one file.
`docs/process/runs/README.md` owns the required contents.

Open owner decisions are filed in `docs/process/OPEN-OWNER-DECISIONS.md`, which
is a queue and not an authority. A decision becomes authority only when the owner
records it in `DECISIONS.md`.
