# Open Owner Decisions

A queue of decisions that only the owner can take, raised by work that hit them.

**This file is not an authority.** Nothing here is decided, and nothing here may
be relied on by any implementation. A decision becomes authority only when the
owner records it in `DECISIONS.md` — or, for chemistry behaviour, only through a
governed canon reissue.

## Why it exists

Autonomous and assisted work regularly reaches a point where continuing requires
a choice nobody has made. The two bad outcomes are the work stopping and the
question evaporating, or the work continuing and the question being answered
quietly by whoever happened to be holding the keyboard.

This file is the third option: the question survives, findable, with enough
worked up around it that answering it is cheap.

## How entries are added

`advisor` works the decision up; the session that hit it files the entry.
Newest first.

```
## OD-nnn — <one-line question>

- **Raised:** <date> · **By:** <run / PR / session> · **Status:** OPEN
- **Blocks:** <what cannot proceed, or "nothing — recorded for later">

**The question, in plain language**

**Why it is undecided** — what the existing authorities do and do not say, quoted.

**Options** — two or three, each with what it commits to, what it forecloses,
what it costs, and how reversible it is.

> **No chemistry in this file.** Where the decision is about a chemistry value,
> state the options *qualitatively* — "more conservative than the canon's
> current rule", "matched to the kit's stated repeatability", "no rule at all
> for this parameter" — and never as numbers. Naming candidate thresholds here
> would put unowned chemistry into the repository in a file no chemistry review
> reads, which is precisely the V1 contamination route recorded in
> `V1-AGENT-SALVAGE-AUDIT.md`. A number in this register is a defect regardless
> of the caption above it. If the decision cannot be stated without numbers, it
> is not ready for this register: it needs a `research-sprint` first, and the
> numbers belong in that report and ultimately in a canon reissue.

**Which direction being wrong hurts more**

**What already covers this** — if anything.

**What must change alongside**

**Recommendation, and what would make it wrong** — or "no basis for a
recommendation; this needs the owner's judgement", which is a complete and
acceptable entry.
```

## How entries are closed

The owner decides. The decision is recorded in `DECISIONS.md` as a new entry.
The entry here is then marked:

```
- **Status:** CLOSED — see DEC-nnn (<date>)
```

Closed entries stay. The record of what was open, and for how long, is worth
more than a tidy file.

---

## Open

## OD-001 — Should `main` be branch-protected on GitHub?

- **Raised:** 2026-08-19 · **By:** workforce founding, adversarial review · **Status:** OPEN
- **Blocks:** **all unattended autonomous work.** It is the only hard guarantee behind "Claude never merges"

**The question, in plain language**

Should GitHub itself refuse a direct push to `main`, so that the rule "Claude
never merges" is enforced by the platform rather than by Claude following
instructions?

**Why it is undecided**

`CLAUDE.md` says "Claude **never merges** — merging requires explicit owner
action. This holds however green the checks are." Nothing enforces it.

This repository previously tried to enforce it with a list of denied command
spellings. Two rounds of adversarial review found working bypasses each time —
a fully-qualified refspec (`HEAD:refs/heads/main`), a force refspec (`+HEAD:…`),
`gh api --method PUT …/merge`, and then `gh api graphql` and plain `curl`, which
no `--method` pattern matches at all. The list also denied legitimate branches
whose names merely contained the substring "main", such as
`claude/domain-verifier-fix`. **That approach has been abandoned.** A pattern
list can be shown incomplete but never shown complete, and any session holding
`Bash` also holds `curl` and therefore the entire GitHub API. The reason is
structural — these rules match **command strings**, and there are more ways to
spell "push to main" than can be
enumerated.

The GitHub merge, approval and repository-write **tools** are separately denied
by name, which is a real control: a denied tool cannot be called. The shell
remains the gap.

`docs/process/V1-AGENT-SALVAGE-AUDIT.md` records that V1's setup guide called
branch protection "the most important step in the whole guide", and dispositions
that guide `REFERENCE_ONLY`. On this specific point that disposition looks wrong:
V1's one hard, non-prompt enforcement mechanism was left behind.

Nothing in this repository can settle this, because branch protection is
configured on GitHub by the repository owner.

**Options**

1. **Protect `main`: require a pull request, forbid direct pushes and
   force-pushes.** Commits to: every change reaching `main` through a PR,
   including the owner's own. Forecloses: quick direct fixes on `main`. Cost:
   a few minutes once. Reversible: immediately, in repository settings.
2. **Leave `main` unprotected and rely on the deny rules plus instruction.**
   Commits to: trusting a pattern list that has now been found incomplete twice.
   Forecloses: nothing. Cost: none today. Reversible: n/a.
3. **Protect `main` and additionally require the `pr-gate` classification to be
   recorded on the PR before merge.** Commits to: a process step on every
   change. Cost: more ceremony than a single-owner project may want.

**Which direction being wrong hurts more**

Badly asymmetric. Option 2 being wrong means unreviewed work lands on `main`
silently and the project's central safety claim was never true. Option 1 being
wrong costs the owner a few seconds of inconvenience on their own commits.

**What already covers this**

Nothing, in this repository, and it no longer pretends otherwise. Tool-name
denies remove the GitHub MCP merge and approval tools from the session surface,
which is real but covers only that surface. Everything else is process
discipline. Pending this decision, **unattended autonomous merge-capable work is
prohibited** and `/overnight-cycle` is withdrawn; attended sessions branch, push
and open PRs, and stop before merge.

**What must change alongside**

If `main` is protected **and that protection is verified** — the owner confirms
Claude's credential cannot merge a PR or dismiss a review — then
`docs/process/AUTONOMY-AND-CONTROLS.md` records it, the prohibition on unattended
work lifts, and `/overnight-cycle` may be reconsidered. All three steps, or none.

**Recommendation, and what would make it wrong**

Option 1. It is cheap, reversible, and it is the only control here that does not
depend on Claude behaving correctly. It would be wrong if the owner routinely
commits to `main` directly and finds a PR for every change intolerable — in
which case option 2 is a deliberate, informed acceptance of the risk rather than
an oversight, which is materially better than where things stand now.

---

## OD-002 — Does the decision ledger cover process and workforce architecture?

- **Raised:** 2026-08-19 · **By:** workforce founding, integration review · **Status:** OPEN
- **Blocks:** nothing; it affects where a future reader looks

**The question, in plain language**

The agent workforce embodies real architectural choices — reviewers are
read-only, the main session is the only writer, nine agents rather than
twenty-eight, no separate triage role. Should those be entries in
`DECISIONS.md`, or is that ledger only for the product and its technical
architecture?

**Why it is undecided**

`DECISIONS.md` states its scope as "product and architecture decisions", and
`CLAUDE.md` says `DECISIONS.md` owns product and architecture. `ROADMAP.md` says
any material change to product direction or architecture should be recorded
there. None of them says whether *process* architecture counts.

The choices are currently recorded with their rationale in
`docs/process/AGENT-ROSTER.md`, which is a reasonable home. But `CLAUDE.md`
tells every session to consult `DECISIONS.md` before deciding anything, and a
session that does so will not find them.

**Options**

1. **Ledger entries for the load-bearing process choices**, with
   `AGENT-ROSTER.md` keeping the detail. Commits to: one place to look.
   Cost: a handful of entries. Reversible: entries are superseded, not deleted.
2. **Keep process architecture in `docs/process/` only**, and add one line to
   `DECISIONS.md` scope saying so. Cost: almost none. Commits to: two places to
   look, clearly signposted.
3. **Leave it implicit.** Cost: none now; a future reader finds nothing and may
   reasonably conclude the choices were never deliberate.

**Which direction being wrong hurts more**

Mildly. The worst case is duplicated rationale that drifts — which is the defect
this workforce is built to catch, so it would be caught.

**What already covers this**

`docs/process/AGENT-ROSTER.md` covers the content. The question is only about
discoverability and ledger scope.

**What must change alongside**

Whichever option is chosen, `DECISIONS.md`'s scope line should state it
explicitly, because the ambiguity is what produced this entry.

**Recommendation, and what would make it wrong**

Option 2 — cheapest, and it keeps the ledger focused on decisions that bind the
product. It would be wrong if process choices turn out to get reopened and
relitigated as often as product ones, in which case they need the ledger's
supersession discipline and option 1 is right.

---

## OD-003 — Which reason codes apply when a canon rule cannot be implemented?

- **Raised:** 2026-08-19 · **By:** workforce founding, integration review · **Status:** OPEN
- **Blocks:** nothing until implementation begins; then it forks immediately

**The question, in plain language**

When a canon rule cannot be implemented as written, two documents in this
repository tell you to classify the problem, and they give different lists.

**Why it is undecided**

`docs/canon/CLAUDE-CODE-ALK-V2-IMPLEMENTATION-HANDOFF.md` requires:
`CANON_DEFECT`, `APP_SCHEMA_REQUIRED`, `OPTIONAL_CAPABILITY_GATED`,
`IMPLEMENTATION_DEFECT`.

The V2 severity vocabulary offers: `BLOCKER`, `CANON_DEFECT`, `CORRECTNESS_GAP`,
`EXPECTED_DEBT`, `OPTIONAL`, plus `BLOCKED_BY_OWNER_DECISION`.

`CLAUDE.md` keeps the handoff live as process guidance "where it is compatible
with the canon", and this is not incompatible — so both stand. The handoff's
middle two codes have no V2 equivalent, and they describe the two most likely
real outcomes once implementation starts: the rule needs a schema field that
does not exist yet, and the rule is gated on an optional capability. Under the
V2 set both collapse into `BLOCKED_BY_OWNER_DECISION` or `EXPECTED_DEBT`, losing
the distinction.

The handoff must not be edited, so this cannot be resolved by changing it.

**Options**

1. **Adopt the two missing codes into the V2 vocabulary** as sub-classifications
   of `EXPECTED_DEBT`. Commits to: a slightly larger vocabulary. Preserves a
   distinction that will matter in Phase 2.
2. **Map them explicitly** — record in `AGENT-ROSTER.md` that
   `APP_SCHEMA_REQUIRED` and `OPTIONAL_CAPABILITY_GATED` both surface as
   `EXPECTED_DEBT` with a stated sub-reason. Cost: one paragraph.
3. **Defer until implementation begins**, when the real frequency of each is
   visible.

**Which direction being wrong hurts more**

Low stakes now, and it is cheap to change later. The risk is only that two
vocabularies coexist unnoticed until someone files the same problem two ways.

**What already covers this**

Nothing. Both lists are live and neither references the other.

**What must change alongside**

`docs/process/AGENT-ROSTER.md`'s severity table, whichever option is chosen.

**Recommendation, and what would make it wrong**

Option 3, with option 2's one-paragraph mapping added now so the fork is
recorded rather than latent. It would be wrong if Phase 1 schema work starts
before this is revisited, in which case option 1 should be settled first.

---

## OD-004 — Should chemistry work also get an ordinary-use review?

- **Raised:** 2026-08-20 · **By:** conformance-harness run, Part 4 wiring · **Status:** OPEN
- **Blocks:** nothing — `/implement-chemistry` runs today exactly as written

**The question, in plain language**

`normal-operation-reviewer` asks whether the product gives a sensible answer on
an ordinary tank with ordinary readings. `/implement-chemistry` is the workflow
for the changes most likely to produce an unreasonable answer. Should that
workflow run it?

**Why it is undecided**

`/implement-chemistry` says "This sequence is fixed. Do not shorten it and do
not extend it." `AGENT-ROSTER.md`'s composition table, as merged from
`claude/dosing-wizard-review-agents-hpnc50`, described the chemistry round as
running `normal-operation-reviewer` and then `jake` inside that sequence. Both
could not be true.

The owner has resolved the `jake` half (`DEC-017`): he is not a reviewer, so a
step that runs strictly after the sequence does not extend it. That reasoning
does not carry across. `normal-operation-reviewer` *is* a reviewer, and adding
a reviewer is the thing the fixed sequence forbids.

So the wiring instruction was followed where it was given — `/implement` and
`/pr-gate` (`DEC-018`) — and the roster's chemistry row was corrected to match
what the skill actually runs. That leaves a real gap: the highest-consequence
workflow is the one that does not ask whether the answer is any good.

**Options**

1. **Leave it as it stands.** Chemistry work gets canon conformance and
   adversarial attack; ordinary-use review reaches it only when a session uses
   `/implement`. Commits to: the fixed sequence staying genuinely fixed. Costs:
   the gap above. Reversible: yes.
2. **Add it to `/implement-chemistry` as a fourth reviewer**, and change the
   skill's "do not extend it" sentence to name the new fixed sequence.
   Commits to: a longer mandatory round on every chemistry change. Forecloses:
   nothing. Cost: one more agent per chemistry run, and the precedent that the
   sequence can be extended when the extension seems worthwhile — which is how
   fixed sequences stop being fixed.
3. **Add it as a post-sequence step alongside `jake`**, on the same argument
   `DEC-017` uses. Commits to: a second exception to a rule that has now had
   one. Cheaper than option 2 and harder to justify, because unlike `jake` this
   agent produces findings rather than sorting them.

**Which direction being wrong hurts more**

Asymmetric toward option 1 being wrong, but not sharply. A chemistry change
that is canon-conformant, survives adversarial attack, and is still unusable in
practice is a real failure mode — it is the one `normal-operation-reviewer`
exists for. Against that, the sequence being extendable by anyone who thinks
the extension is worthwhile is the failure mode "fixed" was written to prevent.

**What already covers this**

Partly. `canon-conformance-auditor` catches behaviour that does not match
canon; `breaker` catches behaviour that fails under attack. Neither asks
whether canon-conformant behaviour is defensible to a keeper — the roster says
so explicitly under `normal-operation-reviewer`'s overlap prevention.

**What must change alongside**

Whichever option is chosen: `AGENT-ROSTER.md`'s composition table, which must
keep matching what the skills actually run. Under option 2 or 3, the skill's
own "do not extend it" sentence needs rewriting rather than quietly reading
around.

**Recommendation, and what would make it wrong**

Option 2, with the sequence re-stated rather than merely extended — if the
owner wants ordinary-use review on chemistry work, the honest form is a new
fixed sequence of four, not an exception. It would be wrong if chemistry
changes are rare enough, and `/implement` common enough, that the gap closes
itself in practice; option 1 is then the cheaper truth.

---

## OD-005 — Should the conformance harness be enforced by CI, and by what?

- **Raised:** 2026-08-20 · **By:** conformance-harness run · **Status:** OPEN
- **Blocks:** nothing — `DEC-016` makes the harness required as process discipline today

**The question, in plain language**

`DEC-016` makes the conformance harness a required check. Nothing on GitHub
enforces that. Should there be a workflow that runs it on every pull request,
and should the check be required to pass before merge?

**Why it is undecided**

`DEC-016` records the decision; it deliberately does not configure enforcement,
because enforcement is a repository setting the owner holds. This is the same
shape as `OD-001` and depends on it: a required status check is configured on
the branch protection rule that `OD-001` is about.

There is a second part that `OD-001` does not cover. The harness is **red
today** and will stay red until an engine exists and the three document defects
it reports are resolved. A required check that cannot pass blocks every merge,
including the merges that would fix it. So enforcement needs either a baseline
the check is measured against, or a start date, or a scope limited to changes
that touch the engine.

**Options**

1. **Add the workflow now, reporting only; make it required when it can pass.**
   Commits to: the output being visible on every PR from today. Cost: near
   zero. Reversible: yes.
2. **Add it and make it required immediately, with the current failures
   recorded as an accepted baseline** the check compares against. Commits to:
   maintaining a baseline file, which is a thing that goes stale. Catches
   regressions from today.
3. **Wait for `OD-001`.** Commits to nothing; the harness stays a command
   someone remembers to run.

**Which direction being wrong hurts more**

Mildly. The harness exists and runs from one command either way; this is about
whether anyone is reminded.

**What already covers this**

Nothing. There is no CI configuration in this repository at all.

**What must change alongside**

`docs/process/AUTONOMY-AND-CONTROLS.md`, which owns what is and is not a
control, and `DEC-016`'s consequences section, which currently says enforcement
is unconfigured.

**Recommendation, and what would make it wrong**

Option 1. It is cheap, it makes the harness's report visible on every change
without blocking anything, and it converts to option 2 by flipping one setting
once an engine exists. It would be wrong if the owner wants regression
protection from today, in which case option 2's baseline is the price of it.

## Closed

## OD-006 — Is the conformance harness a required check?

- **Raised:** 2026-08-20 · **Status:** CLOSED — see `DEC-016` (2026-08-20)

Decided by the owner before the work began, and recorded here so that a reader
of this queue finds it alongside `OD-001`, which it depends on for enforcement.

## OD-007 — Does `jake` run inside the reviewer sequence or after it?

- **Raised:** 2026-08-20 · **Status:** CLOSED — see `DEC-017` (2026-08-20)

Decided by the owner. `/implement-chemistry`'s fixed sequence and the roster's
composition table contradicted each other; the sequence stays fixed and `jake`
is a post-processing step over its output. The residue for
`normal-operation-reviewer` is `OD-004`, which is open.

