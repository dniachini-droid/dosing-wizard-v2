---
name: overnight-cycle
description: NOT AUTHORISED FOR UNATTENDED USE. The former unattended overnight workflow, retained only as a record of what it required. Do not run it. Use /implement for ordinary work and /implement-chemistry for high-consequence chemistry work.
argument-hint: (do not invoke)
disable-model-invocation: true
---

# overnight-cycle — NOT AUTHORISED FOR UNATTENDED USE

> **Do not run this workflow.**
>
> Unattended autonomous merge-capable work is **prohibited** in this repository
> until GitHub branch protection is configured **and verified**. That is
> `OD-001`, and it is still open.

## Why it is withdrawn

This workflow assumed a Claude-side control system that does not exist. Its
safety argument rested on command-string deny patterns and path denies in
`.claude/settings.json`. Neither is a boundary:

- path denies bind `Edit`, `Write` and `NotebookEdit` — never `Bash`;
- command patterns match spellings, and the list was shown incomplete twice;
- any session holding `Bash` also holds `curl`, and therefore the entire GitHub
  API, which no rule in that file constrains.

Unattended work is exactly the case where nobody notices any of that. Running a
merge-capable loop overnight on those assumptions is not a risk worth the
convenience, and the honest response is to withdraw the workflow rather than add
more patterns to it.

## What replaced it

| Use | Workflow |
|---|---|
| Ordinary implementation | `/implement` |
| Chemistry, controller, dosing, safety-rail work | `/implement-chemistry` |
| Reviewing an existing PR or diff | `/pr-gate` |
| A genuinely unresolved blocking question | `/research-sprint` |

Those run in **attended** sessions — including cloud sessions a person started
and can see. They branch, commit, push and open pull requests, and they stop
before merge.

## What would reauthorise it

The owner, not a run:

1. enables branch protection on `main` — no direct pushes, PR required;
2. confirms Claude's credential cannot merge a PR or dismiss a review;
3. records both in `DECISIONS.md`, superseding `OD-001`.

Until all three are done, this file stays as it is.

See `docs/process/AUTONOMY-AND-CONTROLS.md`.
