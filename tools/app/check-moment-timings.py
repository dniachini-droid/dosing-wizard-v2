#!/usr/bin/env python3
"""RETIRED BY THE V1 INTERFACE PORT — and superseded by something stronger.

This script used to verify that every moment timing V2 had re-created still
matched V1's source: it read the values out of `app/assets/tokens.css`, where
each carried the V1 file and line it came from, and failed if one had drifted.

It existed because V2's moments were a RE-CREATION of V1's, and the brief that
commissioned them warned that reimplementing from a description "means
retuning them and the work is lost".

There is nothing left to verify, because there is nothing left that was
re-created. The V1 interface port took `ReadingConfirmation.jsx`,
`ReadingContext.jsx`, `TaskCompletion.jsx` and `DoseExpectation.jsx` from V1
source, and `docs/migration/PORT-MANIFEST.md` records every line of them that
differs from V1's original, with a reason, and reverse-applies the recorded
differences to prove the record is complete.

That is a strictly stronger check than this one: this compared a handful of
named constants; the manifest accounts for every line of the file they live in.

    node tools/port/check-port-manifest.mjs

`app/assets/tokens.css` was deleted with the rest of the V2 interface, which is
why this script cannot run at all rather than merely being redundant.
"""

import sys

print(__doc__)
sys.exit(0)
