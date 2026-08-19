---
name: research-sprint
description: Answer a hard scientific or technical-architecture question by decomposition, parallel independent research, source-quality review, contradiction analysis, synthesis and adversarial challenge, producing a report that preserves unresolved uncertainty. Use for domain revalidation and for stack/platform architecture research. Produces a report; decides nothing.
argument-hint: <the question to research>
disable-model-invocation: true
---

# research-sprint

The question for this sprint is: **$ARGUMENTS**

This workflow produces evidence and a report. It does not select a stack, freeze
a canon, set a threshold or close an owner decision. Those are owner acts
recorded in `DECISIONS.md` or in a governed canon reissue.

---

## Stage 1 — Question decomposition

Break the question into parts that can be researched independently. For each
part state which kind it is:

- **Scientific** — there is a fact of the matter and sources bear on it.
- **Technical** — current platform, vendor or framework documentation answers it.
- **Product design** — no source answers it because it is a choice. Route these
  to `advisor`; do not research them into an answer.

Most real questions are mixed. Splitting them is the point of this stage, and
getting it wrong is how a design choice ends up wearing the confidence of a
sourced fact.

State explicitly what would count as an answer for each part, before searching.

## Stage 2 — Parallel independent research

Run the sub-questions concurrently, each in fresh context so findings are not
contaminated by each other.

- Scientific sub-questions → `domain-verifier`.
- Technical/architecture sub-questions → `architecture-reviewer`.

Where a sub-question is large or contested, run it more than once with different
framings and compare. Agreement between independently framed searches is
evidence; agreement between one search repeated is not.

**Source standards:**
- Scientific: current primary literature and authoritative technical references.
  A manufacturer's own current documentation is authoritative for that
  manufacturer's own product. Community forum material is last resort and must be
  labelled as such.
- Technical: current primary vendor/platform/framework documentation, with
  document and version or date. Secondary write-ups and blog posts are leads, not
  citations, and platform behaviour changes often enough that an undated claim is
  worthless.
- Every claim carries its evidence class: `measured`, `published`,
  `manufacturer-stated`, `reasoned`, `unsupported`.

## Stage 3 — Source-quality review

Before synthesising, review the sources themselves:

- Is each source primary, or is it repeating another source? Chase the chain.
- Is it current? What is its date or version, and has it been superseded?
- Does it actually say what the finding claims, or is the finding an
  interpretation? Quote the passage.
- Is there a reason this source would be biased on this question?
- Which findings rest on a single source?

Downgrade anything that fails this stage rather than carrying it forward.

## Stage 4 — Contradiction analysis

List every place the sources disagree.

- **Never average conflicting sources.** Never pick the one nearest a convenient
  answer, and never pick the one nearest anything V1 did.
- For each contradiction: what would distinguish the two? Is it a real
  disagreement, a difference of conditions, a difference of definition, or a
  difference of date?
- A contradiction you cannot resolve is a finding, not a failure. Carry it
  forward, stated as a contradiction.

## Stage 5 — Synthesis

Write what the evidence supports, in layers, clearly separated:

1. **Established** — well sourced, sources agree.
2. **Supported** — sourced, but with limits, conditions or a single source.
3. **Reasoned** — your inference from the above, labelled as inference.
4. **Unresolved** — the question was not answered, and why.

Then, where the question calls for it: two or three options, each with what it
commits to, what it forecloses, its cost, and which direction being wrong hurts
more.

## Stage 6 — Adversarial challenge

Invoke `breaker` on the synthesis itself, in fresh context, with this brief:
attack the reasoning, not the writing. Specifically hunt for a conclusion that
outruns its evidence, a source used for something it does not say, a scientific
register applied to a design choice, an unstated assumption doing load-bearing
work, and an option whose stated cost omits its real one.

Where the sprint concerns architecture, also ask `architecture-reviewer` for the
falsifier: what evidence would overturn the recommendation.

Every surviving challenge is recorded in the final report, whether or not it
changed the conclusion.

## Stage 7 — Final report

```
question:
decomposition: (each part, classified scientific / technical / product-design)
established: (with sources: document, version or date, locator, quoted passage)
supported: (with limits and single-source flags)
reasoned: (labelled as inference)
contradictions: (each, unresolved where unresolved)
options: (commitment / foreclosure / cost / asymmetry of harm)
recommendation: (if any)
what would make it wrong:
UNRESOLVED — carried forward: (the open questions, stated as questions)
owner decisions raised:
adversarial challenges and their outcomes:
```

## Where the report may be written

If this sprint's report is committed, it goes under `docs/research/` and nowhere
else. Every sourced value carries its citation, and the document carries the
status line `NON-AUTHORITATIVE — UNDER REVIEW` at the top.

Nothing in `docs/research/` may be referenced by a runtime, a controller, a test
expectation, a recommendation or a calculator constant, and nothing in it is
authority. A value here becomes behaviour only when a governed canon reissue
adopts it — a new freeze identifier superseding the old, which is an owner act.

Do not copy a sourced value out of `docs/research/` into `CLAUDE.md`,
`DECISIONS.md`, an owner-decision entry, a run record or an agent definition.
Quarantine by location is what keeps evidence from silently becoming authority.

**Preserve uncertainty.** The single most valuable output of a research sprint is
an accurate account of what is still not known. Do not round an open question up
to an answer because the report would look better finished, and do not offer a
number where the honest output is "no basis — this needs the owner's judgement".

Nothing in this report is authority until the owner records it as a decision.
