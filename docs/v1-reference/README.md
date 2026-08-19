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
