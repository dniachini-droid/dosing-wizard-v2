# V1 Agent and Routine Salvage Audit

Complete verified inventory and disposition of the V1 (`dniachini-droid/tank-wizard`)
agent and routine estate, performed for the founding of the V2 Claude Code
workforce.

V1 was read at commit `9276a2ca254e88d19e0f02dced42a1b896499780`, read-only. No
V1 file was modified.

---

## A deliberate omission

**This document does not reproduce V1 numeric chemistry values.**

The audit found a large quantity of concrete chemistry embedded in V1 agent
prompts and routines: band edges, rails, rate limits, trigger percentages, noise
floors, solution strengths, zone formulas and correction arithmetic. Copying
those figures into a V2 process document to demonstrate that they exist would
recreate exactly the contamination the audit was run to prevent — and a number
sitting in a V2 repository acquires unearned authority no matter what caption
sits above it.

Where contamination matters, this document names **what kind** of value it is and
**where in V1 it lives**, so that a future reader can go and look without a copy
of it living here. Chemistry authority is `docs/canon/REEF-CHEMISTRY-ENGINE-V2-CANON.md`
and nothing else.

---

## Verified counts

The prior salvage reconnaissance reported "approximately 27 agents and 20
routines". Both figures were checked directly and both are slightly off.

| Item | Reported | **Verified** | Note |
|---|---|---|---|
| Agent definitions | ~27 | **28** | `.claude/agents/*.md` |
| Routines | ~20 | **19** | `routines/*.md` |

**Why the agent count was wrong.** V1's own `AGENT-ROSTER.md` is titled "The 27
Agents" and its table lists 27. The `.claude/agents/` directory contains 28
definition files. The undocumented file is `advisor.md` — at 10,450 bytes the
largest definition in the estate, and the second most chemistry-contaminated.
V1's roster document had drifted from V1's actual agent directory, which is
itself a finding: the roster was not a reliable index of the workforce it
described.

**Why the routine count was wrong.** The routine files are numbered `00`–`20`,
which reads as 21, and "about 20" as an estimate. `07` and `08` do not exist.
The actual set is `00`–`06` and `09`–`20`, which is 19 files.

Neither correction changes any disposition. They are recorded because an
inventory that was not checked is not an inventory.

**Supporting process material.** A further 17 orchestration and process
artefacts were audited (house rules at two scopes, roster, onboarding, budgets,
run and backlog contracts, the restructure proposal behind them, the Claude Code
settings file, handover, escalation queue, brief format, CI workflow, npm script
surface). These are inventoried in their own section below.

V1 had **no** `CLAUDE.md`. Instruction-file duty was split across **two**
`AGENTS.md` files at two scopes: the repository-root house rules, and a separate
directory-scoped `legacy/AGENTS.md` with its own gate and its own failure
catalogue. That split is itself worth noting against a V2 that has one
`CLAUDE.md`.

---

## Disposition vocabulary

| Disposition | Meaning |
|---|---|
| `PORT_AS_IS` | Copy into V2 unchanged. |
| `PORT_WITH_CLEANUP` | Copy, with V1-specific references removed. |
| `REBUILD_THE_IDEA` | The responsibility or method is worth having; the artefact is rewritten from scratch for V2. |
| `REFERENCE_ONLY` | Do not bring across now. Worth consulting when V2 reaches the relevant stage. |
| `LEAVE_BEHIND` | The artefact is not reusable, and nothing distinctive is lost: whatever general practice it contains V2 already requires from another source. |

The line between `REBUILD_THE_IDEA` and `LEAVE_BEHIND` is whether the artefact is
the **origin** of something V2 now names and assigns to a specific owner. Almost
every V1 file contains *some* transferable grain; that alone does not promote it.
An earlier draft of this audit drew that line loosely and was corrected by
independent review — see "Findings about the audit itself".

**Nothing was classified `PORT_AS_IS` or `PORT_WITH_CLEANUP`.**

That result deserves stating plainly rather than being buried. Every V1 agent
definition and routine is written against a repository with application code, a
chosen stack (React/JSX, Vite, Tailwind, IndexedDB/localStorage, Vitest,
Playwright, esbuild), a nine-document `docs/spec/` tree, a `legacy/` monolith
with its own protocol specifications, a `.agent/` state tree, npm scripts, and a
chemistry canon that V2 has deliberately replaced. V2 currently has none of those. A file copied across
would either fail on its first reference or, worse, succeed at importing an
assumption V2 has already rejected.

No V1 status, approval or "shipped" claim was treated as V2 authority at any
point in this audit, per `DEC-002` and `DEC-013`.

---

## Analysis A — Complete inventory: the 28 agents

All 28 files share the same shape: YAML frontmatter (`name`, `description`, and
in **26 of 28** also `tools` and `model`) followed by a prose role definition.

**Two** agents declare neither `tools` nor `model` and therefore inherited every
tool: `advisor.md` and `domain-verifier.md`. The second is the more serious. Its
own description reads "Reports only — never edits code, spec or tests", and its
body repeats "You never change anything" — while its frontmatter grants it
`Write` and `Edit`. A chemistry-facing agent that declares itself read-only and
is not is a stronger argument for V2's rule that every agent declares its tools
explicitly than `advisor`'s silent omission, which at least claimed nothing.

Common inputs across the estate: `AGENTS.md`, `docs/spec/reef-chemistry.md`,
`docs/spec/wizard-states.md`, `.agent/findings.md`, `.agent/items/`,
`.agent/needs-dan.md`, `.agent/log/`, `.agent/budgets.json`. Common outputs:
findings appended to `.agent/findings.md` under a severity template, backlog
items as one file per item, and escalations to `.agent/needs-dan.md`.

| # | Agent | Purpose | Tools declared | Output | V1-specific assumptions | Overlaps | Disposition |
|---|---|---|---|---|---|---|---|
| 1 | `a11y-reviewer` | Accessibility and one-handed wet-fingered mobile usability | Read, Write, Edit, Grep, Glob, Bash | Findings + a11y tests | axe-core, rendered UI, en-AU decimal entry, dark mode | `terminology-auditor` on units | `REFERENCE_ONLY` |
| 2 | `adjudicator` | Independently reproduce serious findings; resolve finder disagreements | Read, Grep, Glob, Bash | Confirmed/downgraded counts + evidence | `docs/spec/` as tie-breaker, `.agent/needs-dan.md` | `triage-analyst` (large) | `REBUILD_THE_IDEA` |
| 3 | `advisor` | Owner's conversational interface; explain, clarify, disagree | *none declared* | Conversation | Heavy: named owner, V1 history, five chemistry corrections with figures, V1 canon/journeys/plan structure, golden fingerprint | — | `REBUILD_THE_IDEA` |
| 4 | `band-classifier-auditor` | Single-source band classification, boundary exactness, precision | Read, Grep, Glob, Bash | Boundary matrix + findings | V1's classifier function, band vocabulary, `insufficient-data`/`drifting` states | `dose-parity-checker`, `message-consistency-auditor` | `REBUILD_THE_IDEA` |
| 5 | `breaker` | Adversarial testing; write failing tests, not prose | Read, Write, Edit, Grep, Glob, Bash | Failing tests + findings | `tests/`, browser storage, service worker, V1 chemistry test bounds | `test-engineer` (deliberate handoff) | `REBUILD_THE_IDEA` |
| 6 | `contradiction-hunter` | The full cross-surface fact × surface matrix | Read, Grep, Glob, Bash | Matrix + contradictions | V1's eight named surfaces, spec §17 matrix | `dose-parity-checker`, `message-consistency-auditor` | `REBUILD_THE_IDEA` |
| 7 | `data-migration-auditor` | Tank history across schema versions | Read, Write, Edit, Grep, Glob, Bash | Version matrix + fixtures | Local browser storage, schema fixture layout | `history-truth-auditor`, `pwa-auditor` | `REBUILD_THE_IDEA` |
| 8 | `dataflow-tracer` | Trace every displayed number to a real computation | Read, Grep, Glob, Bash | Trace table + findings | React hook chain, V1 component names, spec rail sections | `static-analyst`, `band-classifier-auditor` | `REBUILD_THE_IDEA` |
| 9 | `docs-scribe` | Keep README, changelog, doc comments honest | Read, Write, Edit, Grep, Glob | Doc edits | V1 doc tree, changelog convention | — | `REBUILD_THE_IDEA` |
| 10 | `domain-verifier` | Chemistry questions; sourced vs design distinction | Read, Grep, Glob, Bash | Two-layer report | Heavy: `legacy/` simulator as oracle, named V1 functions, specific corrected-error figures, owner's private data path | — | `REBUILD_THE_IDEA` |
| 11 | `dose-parity-checker` | Same inputs through every surface → identical output | Read, Write, Edit, Grep, Glob, Bash | Parity matrix + permanent tests | V1's surfaces, band names, fixture set | `contradiction-hunter`, `band-classifier-auditor` | `REBUILD_THE_IDEA` |
| 12 | `fixer` | Small unambiguous fixes; hard-refuses chemistry and schema | Read, Write, Edit, Grep, Glob, Bash | Fixes + ineligible list | `.agent/` gating, line caps, npm scripts | `implementer` | `REBUILD_THE_IDEA` |
| 13 | `history-truth-auditor` | No retroactive recomputation of the log | Read, Write, Edit, Grep, Glob, Bash | Stored-vs-recomputed table | V1 history renderer, settings model, export path | `data-migration-auditor` | `REBUILD_THE_IDEA` |
| 14 | `implementer` | Write code and tests for one planned item | Read, Write, Edit, Grep, Glob, Bash | Diff + verification output | npm scripts, branch convention, `docs/spec/` citation habit, V1 rounding rule | `fixer` | `REBUILD_THE_IDEA` |
| 15 | `integrator` | Final gate; independently re-verify, open the PR, never merge | Read, Grep, Glob, Bash | Gate checklist + verdict | npm lint/typecheck/test/build, budgets file, PR template | `adjudicator` in part | `REBUILD_THE_IDEA` |
| 16 | `manual-dose-auditor` | The override path: rails, recording, contamination | Read, Grep, Glob, Bash | Findings | V1 manual surface, rail-override behaviour, correction arithmetic sections | `wizard-dose-auditor`, `dose-parity-checker` | `REBUILD_THE_IDEA` |
| 17 | `message-consistency-auditor` | Message vs classification contradictions | Read, Grep, Glob, Bash | Message × classification matrix | V1 classification vocabulary and message-part rules | `contradiction-hunter`, `terminology-auditor` | `REBUILD_THE_IDEA` |
| 18 | `perf-watchdog` | Bundle and runtime budgets | Read, Grep, Glob, Bash | Budget table | `npm run build`, budgets file, bundle metrics | — | `REFERENCE_ONLY` |
| 19 | `planner` | Pick and scope the night's work; refuse underspecified items | Read, Grep, Glob | Plan blocks | `.agent/items/`, approval tags, backlog CLI | — | `REBUILD_THE_IDEA` |
| 20 | `pwa-auditor` | Offline, service worker, install, persistence, export | Read, Grep, Glob, Bash | Findings + tests | Service worker, manifest, iOS standalone, storage persistence API | `data-migration-auditor` | `REFERENCE_ONLY` |
| 21 | `reporter` | The single morning brief | Read, Grep, Glob | Fixed-format brief | V1 health metrics, cost cap, product name | — | `REBUILD_THE_IDEA` |
| 22 | `security-auditor` | Dependencies, secrets, stray network calls | Read, Grep, Glob, Bash | Findings | npm audit, lockfile, "no server, no accounts, no network" threat model | — | `REFERENCE_ONLY` |
| 23 | `state-auditor` | Stale closures, races, derived-state-in-state, input drift | Read, Grep, Glob, Bash | Findings with symptoms | React hooks throughout | `dataflow-tracer` | `LEAVE_BEHIND` |
| 24 | `static-analyst` | Dead config, orphaned code, copy-paste defects | Read, Grep, Glob, Bash | Findings by category | V1 module layout, findings file | `dataflow-tracer` | `REFERENCE_ONLY` |
| 25 | `terminology-auditor` | One word per concept; bans safety framing | Read, Grep, Glob, Bash | Term table + framing violations | V1 terminology registry, banned-word list, parameter naming | `message-consistency-auditor` | `REBUILD_THE_IDEA` |
| 26 | `test-engineer` | Regression conversion, coverage, flake hunting | Read, Write, Edit, Grep, Glob, Bash | Tests + coverage report | Coverage config keys, suite runtime budget | `breaker` (deliberate handoff) | `REBUILD_THE_IDEA` |
| 27 | `triage-analyst` | Dedupe to root cause, delete noise, cap the backlog | Read, Write, Edit, Grep, Glob | Backlog items + counts | `.agent/items/`, approval tags, priority ordering | `adjudicator` (large) | `REBUILD_THE_IDEA` |
| 28 | `wizard-dose-auditor` | Every wizard branch and exit; back-navigation staleness | Read, Grep, Glob, Bash | Branch table | V1 wizard state machine, gating branches, precipitation guard | `manual-dose-auditor`, `dose-parity-checker` | `LEAVE_BEHIND` |

**Totals:** `REBUILD_THE_IDEA` 21 · `REFERENCE_ONLY` 5 · `LEAVE_BEHIND` 2 ·
`PORT_AS_IS` 0 · `PORT_WITH_CLEANUP` 0.

Only `state-auditor` and `wizard-dose-auditor` are `LEAVE_BEHIND`. Both are
written entirely against V1's UI framework and V1's wizard state machine, and the
general practices they do contain — state the user-visible symptom rather than
the mechanism; an unreachable branch is itself a finding — V2 already requires of
every reviewer from other sources.

That 21 of 28 are `REBUILD_THE_IDEA` is the audit's substantive result, not
generous grading: V1's value was almost entirely in the *questions its agents
asked*, and almost not at all in the artefacts that asked them.

---

## Analysis A (continued) — Complete inventory: the 19 routines

Routines `01`–`05` share an identical crash-recovery preamble ("STEP ZERO") and
a wave structure. `06` reuses the "STEP ZERO" label for something different —
verifying enforcement claims before trusting them — so the label appears in six
files but the recovery preamble in five. Routines `09`–`20` are one-time phase jobs, increasingly long
(the largest is 677 lines) and increasingly chemistry-specific.

| # | Routine | Purpose | Writes? | Depends on | Chemistry embedded | Disposition |
|---|---|---|---|---|---|---|
| 00 | `00-inventory` | One-time read-only baseline audit of the codebase | No | — | None (points at spec) | `REBUILD_THE_IDEA` |
| 01 | `01-build-cycle` | Nightly build: bounded implementation, then parallel read-only finders, then judge/fix/gate/report | Yes | ~13 agents | None directly (delegates) | `REBUILD_THE_IDEA` |
| 02 | `02-audit-sweep` | Recurring fully read-only sweep, seven parallel auditors | No | 9 agents | None directly | `REBUILD_THE_IDEA` |
| 03 | `03-attack-night` | Adversarial-only run; failing tests, no fixes | Tests only | breaker + 5 | None directly | `REBUILD_THE_IDEA` |
| 04 | `04-weekly-review` | Weekly step-back over 7 days of logs; drift and recurrence | Report | All nightly logs | None | `REFERENCE_ONLY` |
| 05 | `05-consistency-sweep` | Cross-surface consistency in numbers and wording | Parity tests | 11 agents | Architecture rules, not values | `REBUILD_THE_IDEA` |
| 06 | `06-spec-reconciliation` | Reconcile two *base* protocol documents in `legacy/protocol/` against two *secondary* documents in `docs/spec/` and against code, row by row, without resolving | Report | — | Named V1 mechanisms, incl. one confirmed-wrong rule | `REFERENCE_ONLY` |
| 09 | `09-adapter` | Build a re-export-only adapter so the legacy suite runs against modular code | One file | Export list | Four named V1 defect corrections | `LEAVE_BEHIND` |
| 10 | `10-phase3-conformance` | Run the legacy suite against the new tree; classify divergences | Bundle + report | `09` | Same four corrections | `LEAVE_BEHIND` |
| 11 | `11-phase4-gaps` | Resolve/classify 31 named spec gaps against five protocol documents | Report | `06`, `10` | **Dense** — exact formulas and staging percentages | `REFERENCE_ONLY` |
| 12 | `12-five-decisions` | Work up five unresolved conflicts for the owner without deciding them | Report | `11` | **Dense** — live conflicting values at named code sites | `REBUILD_THE_IDEA` |
| 13 | `13-phase5-gate` | Port a 15-checker static-analysis gate; wire one required CI check | Tooling | `10` | Names the constant tables, not their values | `REFERENCE_ONLY` |
| 14 | `14-phase7-durability` | Audit data durability; size and score options | Report + backlog | — | None | `REFERENCE_ONLY` |
| 15 | `15-phase6-bugs` | Fix seven pre-authorised bugs, one PR each, test first | Yes | `13` | **Densest in the estate** — bands, rails, triggers, noise floors, zone formulas | `LEAVE_BEHIND` |
| 16 | `16-durability-remainder` | Build the three durability items `14` sized | Yes | `14` | None | `REFERENCE_ONLY` |
| 17 | `17-failure-replay` | Re-run the scenarios that exposed four documented failures; measure, don't grade | Report | `15` | Excursion figures, floors, fingerprints | `REBUILD_THE_IDEA` |
| 18 | `18-real-history-replay` | Replay the engine against the owner's real tank history; use what happened next as referee | Report | Real fixture | Real-tank values, cadences, nine practice rules | `REBUILD_THE_IDEA` |
| 19 | `19-engine-decision` | Evidence-first, opinion-last: rebuild vs consolidate | Report | `18` | Cadences, corpus dimensions, measured error figures | `REBUILD_THE_IDEA` |
| 20 | `20-phosphate-nitrate` | Remove borrowed alkalinity-shaped reasoning from two nutrient parameters; defer the replacement rules to the owner | Yes | Backlog item | Nutrient bands and unreachable-threshold arithmetic | `LEAVE_BEHIND` |

**Totals:** `REBUILD_THE_IDEA` 9 · `REFERENCE_ONLY` 6 · `LEAVE_BEHIND` 4 ·
`PORT_AS_IS` 0 · `PORT_WITH_CLEANUP` 0.

---

## Analysis A (continued) — Supporting process material

Audited but not counted among the 28 agents and 19 routines.

| Artefact | What it is | Disposition |
|---|---|---|
| `AGENTS.md` | V1's house rules: 13 non-negotiables, definition of done, evidence rule, escalation rule, checkpoint contract, backlog format, PR template | `REBUILD_THE_IDEA` → `CLAUDE.md` + `docs/process/OVERNIGHT-AUTONOMY.md` |
| `AGENT-ROSTER.md` | One-line catalogue of the agents, plus the parallelism safety rule | `REBUILD_THE_IDEA` → `docs/process/AGENT-ROSTER.md` |
| `START-HERE.md` | Owner onboarding map and routine schedule | `REFERENCE_ONLY` |
| `DO-THIS-STEP-BY-STEP.md` | Click-by-click install guide; includes branch protection as its most important step | `REFERENCE_ONLY` |
| `GET-CODE-OUT-OF-CLAUDE.md` | One-time extraction of an app trapped in chat artefacts | `LEAVE_BEHIND` |
| `.agent/budgets.json` | Machine-readable ceilings: bundle, dependencies, coverage, suite runtime, lines per item, items per cycle | `REFERENCE_ONLY` — shape is reusable, every value is V1's |
| `.agent/runs/README.md` | One-file-per-run checkpoint contract; explicitly forbids a shared index | `REBUILD_THE_IDEA` → `docs/process/runs/README.md` |
| `.agent/items/README.md` | Backlog-as-files contract with approval gating | `REBUILD_THE_IDEA` — the approval-gating idea only; V2 has no backlog yet |
| `.agent/items/notes/filing-convention.md` | Superseded stub | `LEAVE_BEHIND` |
| `.agent/HANDOVER-2026-08-13.md` | Day-one session handover, saturated with superseded chemistry | `LEAVE_BEHIND` |
| `.agent/needs-dan.md` | 2,061-line owner escalation queue | `REBUILD_THE_IDEA` → `docs/process/OPEN-OWNER-DECISIONS.md`; V1 content stays behind |
| `.agent/morning-brief.md` | Fixed-format nightly digest | `REBUILD_THE_IDEA` → PR body + run record |
| `.github/workflows/verify.yml` | The single required CI check | `REFERENCE_ONLY` — right philosophy, wired to a stack V2 has not chosen |
| `package.json` scripts | One composite `verify` fanning out to ~15 named checks | `REFERENCE_ONLY` |
| `legacy/AGENTS.md` | A second, directory-scoped instruction file with its own gate and a catalogue titled "the five things that have actually gone wrong" | `REBUILD_THE_IDEA` — see below |
| `.agent/proposals/run-state-restructure.md` | The argument document behind the one-file-per-unit rule; both READMEs apply it, this one reasons it | `REBUILD_THE_IDEA` → the reasoning is restated in `docs/process/runs/README.md` |
| `.claude/settings.local.json` | Claude Code permission allowlist | `LEAVE_BEHIND` — and a contamination finding in its own right, see B1 |
| `CLAUDE.md` | **Did not exist.** Two `AGENTS.md` files at two scopes carried instruction-file duties | n/a — V2's `CLAUDE.md` is new, not a port |

### `legacy/AGENTS.md` — the closest thing to a `PORT_WITH_CLEANUP`

This file is the strongest counterexample to the headline result, and it was
raised by independent review as one. It deserves a direct answer rather than a
row in a table.

Its middle section lists five failure shapes that actually occurred, each with a
one-line generalised rule, and those five rules are genuinely stack-independent —
better process material than most of the estate. Two of them named something V2's
roster did not yet have, and were added during review: *uniform output across
varied inputs is a symptom, not a pass* (now in `test-engineer`), and *ask what
happens when the situation gets worse* (now in `breaker`).

It is nonetheless not `PORT_WITH_CLEANUP`, and the reason is specific: the
section immediately following the five failures states chemistry rules and cites
chemistry constants and observed values directly. Cleaning the file would mean
deleting more of it than survives, and what survives is five sentences. Extracting
five sentences into two existing agents is `REBUILD_THE_IDEA` by this document's
own vocabulary. Porting the file would import chemistry.

The headline result stands, but its correct scope is narrower than first stated:
nothing in the V1 **agent, routine or process estate** transfers as an artefact.

---

## Analysis B — Domain and canon safety

The question this analysis answers: **what, if copied, would silently
reintroduce abandoned V1 chemistry into V2?**

### B1. Embedded chemistry in agent prompts

Concrete chemistry — numeric thresholds, solution strengths, band edges, rate
limits, precision claims, and worked corrections — appears inside the prose of
V1 agent definitions. Two files carry the bulk of it:

- **`advisor.md`** narrates five historical chemistry corrections, each with its
  figures, plus a parameter-by-parameter statement of which are dosed and which
  are watched, plus V1 conformance artefacts treated as ground truth.
- **`domain-verifier.md`** cites V1's simulator as an evidentiary oracle, quotes
  a specific simulated excursion, restates two rules that were later found wrong
  (a precipitation-separation claim and a post-correction silence period), and
  uses a live V1 function and file as its worked example.

Both are therefore uncopyable even loosely. V2's `advisor` and `domain-verifier`
share only their names and their *responsibility*; every line of content is new,
and both are explicitly barred from treating V1 as scientific authority.

A second tier — `band-classifier-auditor`, `wizard-dose-auditor`,
`manual-dose-auditor`, `dose-parity-checker`, `message-consistency-auditor`,
`terminology-auditor` — carries fewer numbers but is contaminated structurally:
each assumes V1's classifier, band vocabulary and surface topology exist. That
is why none of the six survives as an artefact. Four have no V2 successor
agent at all, their responsibilities absorbed or dropped; and two have theirs
explicitly reassigned — `terminology-auditor`'s one-vocabulary rule into
`canon-conformance-auditor`, and `dose-parity-checker`'s "identical inputs must
give identical answers wherever they are asked" into `integrator`'s
one-authoritative-owner rule.

Lower-tier traces are still real and were still removed: an accessibility agent
using a chemistry unit as its running example; an adversarial agent hard-coding
plausible chemistry bounds as attack values; a static-analysis agent whose
worked example pairs two specific parameters.

**One contamination vector was outside the prose entirely, and was missed until
independent review found it.** V1's `.claude/settings.local.json` — the Claude
Code permission allowlist — contains a pre-approved shell command that rewrites a
chemistry constant, with both the old and the new value written out in the rule
itself. A superseded chemistry figure was therefore sitting in a *permissions
configuration file*, where no reviewer of chemistry, canon or documentation would
think to look, and where it would survive any amount of tidying of the documents.

V2 carries no `settings.local.json` from V1, and `.claude/settings.json` contains
only deny rules and no command bodies. The general lesson is recorded here
because it generalises past this instance: **chemistry escapes into whatever file
is not being reviewed as chemistry.**

### B2. Embedded chemistry in routines

Routines `11`, `12`, `15`, `17`, `18`, `19` and `20` contain the densest
chemistry in the estate: exact correction formulas, staging percentages, band
widths, rails, drift-trigger percentages, noise floors, arrival-zone formulas,
cadence constants, measured error figures and real-tank values. Routine `15`
alone rewrites multiple chemistry constants inline as its authorised work.

All seven are classified so that none of their values travels. Where the
*method* is valuable — `17`'s replay design, `18`'s use of what happened next as
referee, `19`'s evidence-before-opinion structure, `12`'s decision write-up
format — the method is rebuilt in a V2 agent or workflow, stripped of every
figure.

### B3. Obsolete state-machine and architecture concepts

Baked into V1 prompts as if permanent: a single named classification function as
the mandated source of truth; a fixed band vocabulary; a wizard step machine
with a specific branch set; a fixed list of user-facing surfaces required to
agree; a notification architecture that computed its own timing; run-state and
findings files as architectural constructs; a backlog ID convention.

V2 rejects the first-match wizard state machine, the scattered classifiers and
the surface-specific chemistry outright (`PRODUCT-VISION.md`). No V2 agent
definition adopts any of these concepts.

One appears as a **prohibition** rather than an assumption, and the distinction
matters: `integrator` is required to flag "a scheduler, notification surface or
calendar that calculates its own timing rather than consuming the canonical
scheduler's output". That wording is anchored in current V2 canon, which makes
the retest scheduler one shared service. It is a rule V2 owns, not a V1 concept
carried across — but it is named here so that a reader checking for
contamination does not find it unexplained and stop trusting the section.

### B4. Old terminology

V1 maintained a terminology registry and banned specific framing words about
readings. The *principle* — one word per concept, one authoritative vocabulary —
is sound and survives, but as a canon-conformance responsibility rather than as
V1's word list. V1's registry decisions were made against V1's spec documents and
have no standing in V2, whose vocabulary is the canon's.

### B5. Old authority assumptions

**Where V1's chemistry authority actually lived matters for anyone mining it
later.** Exactly eight V1 agents open by naming a governing section in
`docs/spec/` — but V1's own reconciliation routine (`06`) treats
`legacy/protocol/` as the *base* documents and `docs/spec/` as *secondary*, with
the explicit rule that where they conflict the base documents are presumed
right. A reader who follows an agent's pointer to `docs/spec/` and stops there
will have read the junior document.

Those eight V1 agents open by naming a governing spec section in `docs/spec/`. Others
treat a V1 golden fingerprint as ground truth, or a V1 conformance run as
grounds to declare a subsystem beyond rebuild, or a V1 simulator as an oracle
for future chemistry decisions.

Every one of those authority relationships is void in V2. V2's authority chain
is: frozen canon for chemistry; `DECISIONS.md` for product and architecture;
`PRODUCT-VISION.md` and `ROADMAP.md` for direction; `PROJECT-STATE.md` for
current state. This is stated in `CLAUDE.md` and in each V2 agent that could be
tempted otherwise. `breaker` originally lacked such a clause, which was a real
gap — V1's `breaker` was the agent that hard-coded plausible chemistry bounds as
attack values — and one was added during review.

The most specific hazard here is the **stale freeze identifier**. The preserved
handoff at `docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` names
`SHARED_V2_FREEZE_1` and `ALK_V2_FREEZE_3`; the current authorities are
`SHARED_V2_FREEZE_2` and `ALK_V2_FREEZE_4`. `canon-conformance-auditor` is
required to treat any reliance on the stale identifiers as a finding, and both
`CLAUDE.md` and the agent definition state that the handoff must not be edited
to "fix" this. The discrepancy is recorded deliberately in `PROJECT-STATE.md`,
and resolving it belongs to a governed handoff reissue.

### B6. V1-specific paths and stack

Every V1 agent and routine references at least one of: `docs/spec/`, `legacy/`,
`.agent/*`, `src/lib/*`, `tests/*`, `private/`, npm scripts, or a React/Vite/
browser-storage assumption. V2 has none of these, and `DEC-012` forbids V1's
storage implementation being carried forward by default.

### B7. The containment mechanism

Contamination is not prevented by good intentions. In V2 it is prevented by:

1. **No V1 agent, routine or process file is copied.** Every V2 agent, workflow
   and process document was written new. The sole deliberate exception at
   repository level is the two frozen canon documents in `docs/canon/`, copied
   from V1 byte-for-byte with verified SHA-256 equality and recorded as such in
   `PROJECT-STATE.md`. That exception is the point of the copy, not a leak.
2. **`canon-conformance-auditor`** is required to flag any behaviour justified by
   V1, and any citation of a stale freeze identifier.
3. **`migration-auditor`** is required to report any path by which V1 material —
   fixture, golden, constant, export or document — could become V2 runtime
   authority.
4. **`domain-verifier`** is explicitly barred from proposing a value because V1
   used it, and must report "no independent basis found" instead.
5. **`test-engineer`** is barred from copying a V1 golden as a V2 expectation
   (`DEC-013`).
6. **This document** names contamination categories and locations without
   reproducing the values.

---

## Analysis C — Process value worth keeping

The genuinely reusable output of V1 is its methodology. Named here, with where
each now lives.

| V1 method | Where it came from | Where it lives in V2 |
|---|---|---|
| Independent re-verification of serious findings before they reach the owner | `adjudicator` | `adjudicator` — verify against the cited authority yourself, downgrade what you cannot confirm |
| Deduplicate to root cause; delete noise; say when a pass was mostly noise | `triage-analyst`, `adjudicator` | `adjudicator` (merged — see Analysis D) |
| Never resolve a contradiction; always work it up | `AGENTS.md` rule 10, `12-five-decisions` | `advisor`'s eight-part decision write-up; `adjudicator`'s `BLOCKED_BY_OWNER_DECISION` |
| Owner-decision escalation queue that is never silently emptied | `.agent/needs-dan.md` | `docs/process/OPEN-OWNER-DECISIONS.md` |
| Sourced vs design question distinction, labelled every time | `domain-verifier` | `domain-verifier` Stage 1; `research-sprint` Stage 1 |
| "A blank is cheap; a confident wrong answer costs a tank" | `domain-verifier` | `advisor`, `domain-verifier`, `adjudicator` |
| Asymmetry-of-harm analysis as the thing that usually settles a decision | `domain-verifier`, `12-five-decisions` | `advisor`, `architecture-reviewer`, `research-sprint` |
| Mandatory falsifier: "what would make this wrong" | `12-five-decisions`, `19-engine-decision` | `advisor`, `architecture-reviewer`, `domain-verifier`, `research-sprint` |
| Evidence/advocacy separation: findings first, opinion last | `19-engine-decision` | `research-sprint` Stages 5–6; `pr-gate` Stages 2–4 |
| Explicit sunk-cost ban in decision reports | `19-engine-decision` | `architecture-reviewer` |
| "A genuine tie is a real outcome" — say what would break it | `19-engine-decision` | `architecture-reviewer`, `research-sprint` |
| Adversarial testing judged by reproducible failures, not volume | `03-attack-night`, `breaker` | `breaker` — reproduce before reporting; report what you did not attack |
| Test-quality audit: would this test fail if the code were wrong? | `test-engineer`, `integrator` | `test-engineer` — the invert-the-logic check |
| Threshold-straddling, adversarial, replay and long-run test design | `test-engineer`, `17`, `19` | `test-engineer` |
| Divergence classification instead of auto-resolving toward the old system | `10-phase3-conformance` | `test-engineer`, per `DEC-013` |
| Report measurements, not pass/fail, when comparing engine versions | `17-failure-replay` | `test-engineer` |
| Simulation results reported "under the simulator's assumptions" | `domain-verifier`, `17` | `test-engineer`, `domain-verifier` |
| Use what happened next as the referee, not the system's own confidence | `18-real-history-replay` | `test-engineer`; bounded by `DEC-010` eligibility rules |
| Bound uncertainty with two runs rather than guessing the true configuration | `18-real-history-replay` | `test-engineer`, `research-sprint` |
| Cross-surface parity: two surfaces disagreeing outranks almost everything | `05`, `dose-parity-checker`, `contradiction-hunter` | `integrator` — one authoritative owner per rule; coincidental agreement is a finding |
| Trace every displayed number back to a real computation | `dataflow-tracer` | `canon-conformance-auditor` (rule → owner → fixture) and `integrator` |
| No retroactive recomputation of history | `history-truth-auditor`, `05` | `migration-auditor` |
| Schema-version matrix; refuse rather than start empty; refuse rather than truncate | `data-migration-auditor` | `migration-auditor` |
| Report only what you verified; mark the rest `UNVERIFIED` | `AGENTS.md` evidence rule | Every V2 reviewer's "not examined" section |
| State what you did **not** examine | `pwa-auditor`, `manual-dose-auditor` | Mandatory in every V2 reviewer's output block and in `adjudicator`'s verdict |
| One file per unit of work; never a shared state file | `.agent/runs/README.md`, `.agent/items/README.md` | `docs/process/runs/` |
| Bounded scope: caps on items, lines and cycles | `.agent/budgets.json`, `01-build-cycle` | `overnight-cycle` Stage 6 two-cycle limit; `OVERNIGHT-AUTONOMY.md` |
| Parallel only for read-only agents; writers run alone | `AGENT-ROSTER.md` | V2 goes further: **only the main session writes at all** |
| Branch → PR → owner merges; never autonomous merge | `AGENTS.md`, `integrator`, branch protection | `CLAUDE.md`, all three workflows, and `.claude/settings.json` deny rules |
| Stopping is a successful outcome; guessing is not | `AGENTS.md` escalation rule | `overnight-cycle` Stage 0; `advisor`; `adjudicator` |
| Never fudge a test to make it pass; revert rather than leave a half-fix | `AGENTS.md`, `fixer` | `overnight-cycle` Stages 2 and 5; `test-engineer` |
| A run that wrote nothing down did nothing | `.agent/log/` convention | `overnight-cycle` Stage 9 |
| Record an open question rather than forcing it closed (`DEC-014`) | `12-five-decisions`, `.agent/needs-dan.md` | `docs/process/OPEN-OWNER-DECISIONS.md`; the `REFERENCE_ONLY` disposition itself |
| Distinguish known fact, supported inference, plausible context and unsupported speculation (`DEC-015`) | `domain-verifier`, `advisor` | `domain-verifier` evidence classes; `breaker`'s `UNREPRODUCED` marker; `adjudicator`'s `UNCONFIRMED` |

One V1 practice is deliberately **not** carried: the plain-language second layer
required on every report. It was a genuine strength, tuned to a specific
non-technical reader. In V2 it is folded into the requirement that `advisor`
states owner decisions in plain language, rather than imposed on every artefact,
where it would double the length of every review for no gain.

---

## Analysis D — Duplication and pruning

V1's 28 agents contained substantial overlap, most of it in the surface-auditor
band: eight agents, of which two (`dose-parity-checker`, `contradiction-hunter`)
existed to reconcile the others. Of the remaining six, only two actually owned a
*surface* — the manual path and the wizard — while four owned cross-cutting
*concerns* (classification, message consistency, terminology, history truth).
V1's own `contradiction-hunter` describes them as "each owning one surface",
which is not what the roster actually contained. That decomposition was a response to V1's architecture — many
surfaces each computing chemistry independently — which V2 has abolished by
design (`DEC-003`: no UI component may recompute chemistry).

**Overlap clusters found, and how V2 collapses them:**

| V1 cluster | Members | V2 |
|---|---|---|
| Per-surface dose auditing | `manual-dose-auditor`, `wizard-dose-auditor`, `dose-parity-checker` | Gone. If one rule has one owner, per-surface parity auditing has nothing to audit. `integrator` enforces the ownership rule that makes the cluster unnecessary. |
| Classification and message consistency | `band-classifier-auditor`, `message-consistency-auditor`, `terminology-auditor`, `contradiction-hunter` | Folded into `canon-conformance-auditor` (does the implementation say what canon says, in canon's vocabulary) and `integrator` (does presentation contradict domain state). |
| Data-flow and static analysis | `dataflow-tracer`, `static-analyst`, `state-auditor` | `canon-conformance-auditor`'s rule → owner → fixture trace, plus `integrator`. `state-auditor` was wholly framework-specific. |
| History and migration | `history-truth-auditor`, `data-migration-auditor` | Single `migration-auditor`. |
| Judgement | `adjudicator`, `triage-analyst` | Single `adjudicator` — see the explicit evaluation below. |
| Write agents | `implementer`, `fixer` | Neither. The main session is the only writer. |
| Platform audits | `pwa-auditor`, `perf-watchdog`, `security-auditor`, `a11y-reviewer` | Deferred. `architecture-reviewer` covers the architectural form of these questions; dedicated auditors are premature with no stack chosen and no code. |

**28 agents → 9.** The reduction is not an efficiency exercise. Nine agents with
explicitly non-overlapping authority can be audited; 28 with silent overlap
produced the failure V1's own `adjudicator` existed to clean up — the same defect
reported three ways at three severities.

### Does `triage-analyst` still have a distinct role?

The brief asked this explicitly. **No — it is not retained.**

V1's `triage-analyst` did five things: deduplicate to root cause, verify severity
independently, delete noise, prioritise, and cap the promoted backlog. In V1 this
was genuinely distinct from `adjudicator`, because V1's `adjudicator` only
handled the top two severities and only handled disagreement, while
`triage-analyst` owned the backlog file and the volume problem.

In V2 the split does not survive contact with the design:

- **Deduplication, severity verification and noise deletion** are the same act as
  adjudication and are now `adjudicator`'s Steps 3, 2 and 5. Splitting them
  across two agents means either two agents verifying the same finding, or one
  trusting the other's verification — the exact failure `adjudicator` exists to
  prevent.
- **Prioritisation** in V2 is the severity vocabulary itself. A finding's
  severity *is* its priority; a second ranking pass would be a second, competing
  authority over the same judgement.
- **Backlog capping** was a response to V1's unbounded nightly finding volume,
  which came from 28 overlapping finders. With nine non-overlapping reviewers and
  a two-cycle limit, the volume problem is addressed at its source.
- **Cross-module consequence analysis**, which V1's triage partly performed when
  clustering by root cause, is now `integrator`'s explicit job.

Retaining it would create circular responsibility between `adjudicator` and
`integrator` with no rule saying which wins — precisely the ambiguity this
roster was built to avoid. The methodology is preserved inside `adjudicator`;
the agent is not.

### No authoritative "AI chemist"

No V2 agent is permitted to produce chemistry. `domain-verifier` verifies claims
against sources and refuses when there is no basis. `canon-conformance-auditor`
checks conformance and never writes a replacement rule. `advisor` works
decisions up and never takes them. `adjudicator` is explicitly barred from
inventing policy to let work continue. This mirrors `DEC-009` at the process
level: the same reason a language model may not be the chemistry engine is the
reason no agent may be the chemist.

---

## Analysis E — Autonomous-work suitability

Which responsibilities are actually useful for unattended work, and which V1
agent each derives from.

| V2 responsibility | Suitable unattended? | V2 owner | Derived from |
|---|---|---|---|
| Planning | Yes, when the task contract validates | main session (`overnight-cycle` Stages 0–1) | `planner`, `01-build-cycle` |
| Implementation | Yes, for frozen/decided requirements only | main session (Stage 2) | `implementer`, `fixer` |
| Canon verification | Yes — read-only, high value | `canon-conformance-auditor` | `band-classifier-auditor`, `dataflow-tracer`, `terminology-auditor`, `06` |
| Scientific verification | Partly — may verify and refuse; may never conclude new chemistry | `domain-verifier` | `domain-verifier` |
| Adversarial / breaker review | Yes — highest-value unattended activity | `breaker` | `breaker`, `03-attack-night` |
| Test review and design | Yes | `test-engineer` | `test-engineer`, `17`, `18` |
| Integration review | Yes | `integrator` | `contradiction-hunter`, `dose-parity-checker`, `05` |
| Architecture review | Yes for research and options; **no** for selection | `architecture-reviewer` | `pwa-auditor`, `perf-watchdog`, `security-auditor`, `14`, `19` |
| Migration review | Yes for audit; **no** for destructive policy | `migration-auditor` | `data-migration-auditor`, `history-truth-auditor`, `18` |
| Final adjudication | Yes, within its authority limits | `adjudicator` | `adjudicator`, `triage-analyst` |
| Owner decisions | **Never.** Surface, work up, stop | `advisor` | `advisor`, `12-five-decisions` |

The boundary that matters: an agent may **verify, refuse and escalate**
unattended. It may not **decide** unattended. Every V2 agent that could plausibly
drift across that line has an explicit hard limit forbidding it.

---

## Findings about the audit itself

Recorded rather than smoothed over.

1. **V1's roster was out of date with V1's own agent directory** — 27 documented,
   28 present, with the undocumented one being the largest and least constrained.
   V2's `docs/process/AGENT-ROSTER.md` must be verified against
   `.claude/agents/` whenever either changes.
2. **The undocumented agent declared no tool restrictions**, so it inherited
   every tool. In V2 every agent declares its tools explicitly, and reviewers are
   read-only.
3. **Chemistry migrated into process files.** V1's chemistry did not stay in
   V1's canon; it spread into agent prompts, routine bodies, escalation queues
   and handovers. This is the mechanism by which a superseded threshold outlives
   its supersession, and it is why this document names locations rather than
   values.
4. **Two V1 chemistry rules are recorded in V1 as having been wrong and
   corrected.** Both are still present in V1 agent prose as narrative. Anyone
   mining V1 for chemistry will encounter both stated fluently. They are
   deliberately not restated here.
5. **Nothing in V1 was `PORT_AS_IS`.** Including the two artefacts an independent
   worker initially proposed for it — the run and backlog contracts. Their
   *contracts* are excellent and are rebuilt; their text assumes a `.agent/` tree
   and a backlog approval workflow that V2 does not have and does not yet need.
6. **Chemistry escaped into a permissions file.** See B1. The categories a
   contamination sweep looks at must include configuration, not only prose.

---

## The audit was independently challenged, and was wrong in nine places

A fresh reviewer, working from the V1 repository rather than from this document,
was asked to falsify it. It did. The findings are recorded here rather than
quietly absorbed, because an audit that reports only its corrected state gives no
one grounds to judge how much to trust it.

Confirmed and corrected:

| # | What the audit got wrong | Correction |
|---|---|---|
| 1 | Claimed `advisor.md` alone declared no `tools`/`model`, 27 of 28 | **Two** did — `advisor.md` and `domain-verifier.md`. 26 of 28. The second also *claims* to be read-only while inheriting `Write`/`Edit`, which is the sharper finding and is now recorded |
| 2 | Called `docs/spec/` "a canon of two documents" | It holds **nine**. "Two" is V1's own stale self-description, repeated here without checking — the same failure this audit faults V1's roster for |
| 3 | "Five of the six are `LEAVE_BEHIND` and the sixth is rebuilt" | Arithmetic wrong and the sentence contradicted the audit's own table. Rewritten |
| 4 | `LEAVE_BEHIND` applied to six agents the audit elsewhere credited with surviving methodology | Internally contradictory. The vocabulary is now defined precisely and six agents reclassified `REBUILD_THE_IDEA`. Totals changed from 15/5/8 to 21/5/2 |
| 5 | `docs-scribe` dismissed as `LEAVE_BEHIND` | Reclassified. The reviewer showed the gap was live, not theoretical: nothing in the roster owned document-to-document consistency, in a repository that contains nothing but documents. `integrator` now owns it explicitly |
| 6 | Three in-scope V1 artefacts never inventoried | `legacy/AGENTS.md`, `.agent/proposals/run-state-restructure.md`, `.claude/settings.local.json`. The last carries a chemistry constant inside a permission rule — a contamination vector the sweep had no category for |
| 7 | "STEP ZERO" attributed to routines `01`–`05` | The label appears in six; `06` uses it for something else. Both facts now stated |
| 8 | "Seven agents each owned one V1 UI surface" | Eight in the group, of which only two owned a surface. The audit was repeating a V1 agent's self-description instead of counting |
| 9 | "No V1 file is copied" stated unqualified | False at repository level: both frozen canon documents were copied byte-for-byte, deliberately. Restated with the exception named |

Two further challenges were examined and **not** accepted:

- That `legacy/AGENTS.md` should be `PORT_WITH_CLEANUP`, falsifying the headline
  result. Its five failure shapes are as good as the reviewer says, and two were
  adopted into V2 agents because of this challenge — but the file's next section
  states chemistry rules and values, so cleaning it removes more than survives.
  `REBUILD_THE_IDEA`, with the headline's scope narrowed to say what it meant.
- That the audit's refusal to reproduce V1 numeric values makes it unverifiable.
  The reviewer ultimately agreed it should be kept, and the read commit is
  recorded, so any claim here can be checked against the source. Its suggestion
  to give line-level locators is noted as a real improvement and is not adopted
  now, because line numbers into a repository under no version control from here
  would rot faster than the file-level pointers.

Findings the reviewer confirmed it could not falsify: both count corrections (28
agents, 19 routines, `07`/`08` absent, `advisor` absent from V1's roster), the
completeness and single-labelling of every disposition, the retirement of
`triage-analyst`, and — the part it reported trying hardest to break — that no V1
chemistry value, threshold, path, stack assumption or severity vocabulary appears
anywhere in the V2 agents, workflows or `CLAUDE.md`.
