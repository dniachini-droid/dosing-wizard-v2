---
name: research-sprint
description: Investigate ONE genuinely unresolved question that is blocking work, using current primary sources, and produce non-authoritative evidence under docs/research/. Use only when the question actually blocks something and no existing authority answers it. Decides nothing; nothing it produces is authority.
argument-hint: <the single blocking question>
disable-model-invocation: true
---

# research-sprint

The question is: **$ARGUMENTS**

## When to use this

Only when **all** of these hold:

- the question is **blocking** real work;
- **no existing authority answers it** — not the canon, not `DECISIONS.md`, not
  `PRODUCT-VISION.md` or `ROADMAP.md`;
- it is **answerable by evidence**, not a choice about what the product should
  do.

If it is a choice, it belongs to the owner: invoke `advisor`, which will classify
it `OWNER_DECISION`, and file it in `docs/process/OPEN-OWNER-DECISIONS.md`. Do
not research a product decision into an answer.

If it is not blocking anything, do not run this. Curiosity is not a sprint.

One question per sprint. A sprint with three questions is three sprints.

## How

1. **State the question precisely**, and state what would change depending on
   the answer. If nothing would change, stop.
2. **Search current primary sources.** Current primary literature; a
   manufacturer's own current documentation for that manufacturer's own product;
   documented, defensible reef-keeping practice. Community forum material is a
   last resort and is labelled as such.
3. **Quote the figure and name the source** — publication or manufacturer,
   document, version or edition, and the date consulted. Manufacturer
   formulations change between versions, so an uncited constant is a latent
   defect.
4. **Say when sources disagree.** Do not average them, do not pick the one
   nearest a convenient value, and do not pick the one nearest anything V1 did.
   Record both positions.
5. **Preserve uncertainty.** Where a value is unknown, say it is unknown. Where
   a range is defensible and a single value is not, record the range. Research
   that reports a clean number it cannot support is worse than research that
   reports an honest gap: the gap can be closed later, the false number will be
   trusted.
6. **Challenge your own conclusion once.** What would make this wrong? What did
   you not look for?

`domain-verifier` is the reviewer for a sprint whose subject is scientific.

## V1's standing

V1 provides source material and questions, not scientific authority. A V1
threshold, classifier or numerical rule is a lead worth investigating and never
a finding in itself. "V1 used this number" does not establish that the number is
correct, and reproducing it without independent support would launder an
unvalidated value into V2.

## Where the output goes, and what it is worth

If the report is committed it goes under `docs/research/` and nowhere else, with
`NON-AUTHORITATIVE — UNDER REVIEW` at the top and a citation on every value.

**Nothing here is authority.** Nothing in `docs/research/` may be referenced by a
runtime, a controller, a test expectation, a recommendation or a calculator
constant, and no value may be copied out of it into `CLAUDE.md`, `DECISIONS.md`,
an owner-decision entry, a run record, an agent definition or a test. Quarantine
is by location.

A chemistry value here becomes behaviour **only through a governed canon
reissue** — a new freeze identifier superseding the old, which is an owner act.
Recording it in `DECISIONS.md` does not do it; that ledger is not chemistry
authority.
