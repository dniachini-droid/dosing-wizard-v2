# V1 REFERENCE — NOT V2 AUTHORITY

Everything in this folder is historical material from the V1 repository, preserved for
context. It describes what V1 did and why. It does not describe what V2 must do.

**Nothing becomes V2 runtime behaviour merely because V1 implemented it.**

## What this area may contain

- journeys — how the product was actually used, and where it created friction;
- decision provenance — why V1 chose what it chose, including choices later regretted;
- failure cases — real situations where V1 produced wrong, unsafe or confusing output;
- selected tests — test *methodology* and scenarios worth rebuilding around V2 concepts;
- historical reasoning — analysis, arguments and open questions worth keeping.

## How to use it

Treat these documents as evidence about the problem, not as specification.

A V1 behaviour, threshold, classifier or data shape found here is a lead. Carrying it
into V2 requires independent justification: **for chemistry, from the frozen canon and
from nothing else** — research under `docs/research/` is evidence *toward* a governed
canon reissue, never a justification for adopting a V1 value; for architecture, from a
decision recorded in `DECISIONS.md`.

V1's recorded outputs are not V2 expectations. The canon intentionally changes some V1
behaviour and fixes some V1 bugs, so a V1/V2 difference is not by itself a V2 defect.

The V1 repository itself is read-only. It is never modified, and nothing is pushed to it.

Authority lives in `docs/canon/`. This folder informs; it does not govern.

## Where the V1 salvage work lives

This folder holds preserved V1 *material*. The **analysis** of V1 lives elsewhere and is
complete:

| Document | Covers |
|---|---|
| `docs/process/V1-AGENT-SALVAGE-AUDIT.md` | The 28 V1 agent definitions and 19 routines |
| `docs/migration/V1-APPLICATION-SALVAGE.md` | Screens, flows, animations, components and reusable tooling |
| `docs/migration/V1-DATA-PROVENANCE.md` | What the owner's historical datasets are, and what may be computed from them |
| `docs/migration/UNMIGRATED-V1-CANON.md` | V1 decisions with substantial reasoning and no V2 owner |
| `docs/migration/V1-OPEN-OWNER-QUESTIONS.md` | Questions V1 raised and never answered |

All five were written from the V1 repository at commit
`9276a2ca254e88d19e0f02dced42a1b896499780`, read-only.

**The V1 salvage reconnaissance report is not in either repository.** The V1 branch named
for it, `claude/v1-salvage-reconnaissance-6rgcl1`, is identical to V1's `main` at that
commit and holds the reconnaissance *brief* rather than its findings. The documents above
carry the findings.

**The V1 canon documents are not copied into V2.** `docs/spec/reef-chemistry.md` and
`docs/spec/wizard-states.md` remain readable in the V1 repository at the pinned commit;
`UNMIGRATED-V1-CANON.md` cites them by section rather than reproducing their figures.
