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
- **Blocks:** nothing today; it is the only hard guarantee behind "Claude never merges"

**The question, in plain language**

Should GitHub itself refuse a direct push to `main`, so that the rule "Claude
never merges" is enforced by the platform rather than by Claude following
instructions?

**Why it is undecided**

`CLAUDE.md` says "Claude **never merges** — merging requires explicit owner
approval. This holds however green the checks are." `.claude/settings.json`
backs that with deny rules.

An adversarial review of those deny rules found three working bypasses —
a fully-qualified refspec (`HEAD:refs/heads/main`), a force refspec (`+HEAD:…`),
and `gh api --method PUT …/merge`. Each of those three spellings is now denied
and each was re-probed. **That is not the same as the surface being closed**, and
nothing in this repository should be read as claiming it is: a pattern list can
be shown incomplete but never shown complete, and this one has been shown
incomplete twice. The reason is structural — these rules match **command
strings**, and there are more ways to spell "push to main" than can be
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

Nothing, in this repository. The deny rules reduce the risk; they do not
guarantee it, and this entry exists because they cannot.

**What must change alongside**

If `main` is protected, `docs/process/AGENT-ROSTER.md` and
`docs/process/OVERNIGHT-AUTONOMY.md` should say so, and should stop describing
the deny rules as the primary control.

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

## Closed

*None yet.*
