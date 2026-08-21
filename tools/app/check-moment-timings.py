#!/usr/bin/env python3
"""Verify that every ported moment timing still matches V1 source.

    python3 tools/app/check-moment-timings.py --v1 /path/to/tank-wizard

The three interaction moments were hand-tuned in V1 and the tuning IS the
value. The brief that commissioned this application put it plainly: "Port the
timing constants, easing curves, delays and progress-driven geometry from V1
source. Do not reimplement from a description — that means retuning them and
the work is lost."

So the values live in `app/assets/tokens.css`, each with the V1 file and line
it came from, and `app/src/moments/moments.js` reads them at run time. This
check closes the loop: it reads the token file and the V1 sources and fails if
any value has drifted from what V1 actually had.

It needs the V1 repository, which is reference-and-salvage material and not a
dependency of this one, so it is NOT part of the committed gate. It is the
thing to run when somebody thinks a moment feels different.

V1 is `dniachini-droid/tank-wizard` at
`9276a2ca254e88d19e0f02dced42a1b896499780`, read-only. Nothing here writes to
it.
"""

from __future__ import annotations

import argparse
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TOKENS = os.path.join(ROOT, "app", "assets", "tokens.css")

V1_COMMIT = "9276a2ca254e88d19e0f02dced42a1b896499780"

# (token, expected value, V1 file, the exact text that must appear in it)
#
# The third and fourth columns are what make this a check rather than a
# restatement: the value has to be in tokens.css AND the V1 source has to still
# contain the construct it was read from.
CHECKS = [
    # --- moment A, the reading arrives ---
    ("ma-chart-in", "460ms", "src/styles/base.css", "chartIn 460ms"),
    ("ma-chart-ease", "cubic-bezier(.2, 1.3, .4, 1)", "src/styles/base.css", "cubic-bezier(.2,1.3,.4,1)"),
    ("ma-scale-in", "340ms", "src/styles/base.css", "bandIn 340ms"),
    ("ma-scale-delay", "300ms", "src/styles/base.css", "animation-delay: 300ms"),
    ("ma-drop-in", "440ms", "src/styles/base.css", "dropIn 440ms"),
    ("ma-drop-delay", "900ms", "src/styles/base.css", "animation-delay: 900ms"),
    ("ma-drop-ease", "cubic-bezier(.3, 1.4, .5, 1)", "src/styles/base.css", "cubic-bezier(.3,1.4,.5,1)"),
    ("ma-pop-dot", "620ms", "src/styles/base.css", "popDot 620ms"),
    ("ma-ring", "1100ms", "src/styles/base.css", "ringOut 1100ms"),
    ("ma-ring2-delay", "260ms", "src/styles/base.css", ".rc-ring2 { animation-delay: 260ms; }"),
    ("ma-band-hit", "900ms", "src/styles/base.css", "bandHit 900ms"),
    ("ma-value-pulse", "700ms", "src/styles/base.css", "valuePulse 700ms"),
    ("ma-sheen", "1100ms", "src/styles/base.css", "shimmerSweep 1100ms"),
    ("ma-rise", "420ms", "src/styles/base.css", "riseIn 420ms"),
    # The single progress value: the fix that stopped the dot running ahead of
    # its own line. These three are the whole of it.
    ("ma-travel-delay", "1340ms", "src/components/ReadingConfirmation.jsx", "DELAY = 1340"),
    ("ma-travel-dur", "4600ms", "src/components/ReadingConfirmation.jsx", "DURATION = 4600"),
    ("ma-travel-exp", "2.4", "src/components/ReadingConfirmation.jsx", "Math.pow(1 - t, 2.4)"),
    ("ma-sheen-clear", "1250ms", "src/components/ReadingConfirmation.jsx", "setSheenDone(true), 1250"),
    ("ma-stagger-1", "260ms", "src/components/ReadingConfirmation.jsx", 'animationDelay: "260ms"'),
    ("ma-stagger-2", "380ms", "src/components/ReadingConfirmation.jsx", 'animationDelay: "380ms"'),
    ("ma-autoclose", "15s", "src/components/ReadingConfirmation.jsx", "AUTO_SECONDS = 15"),
    # Geometry — pure, and the salvage inventory says so, which is why it is
    # portable as-is.
    ("ma-point-fade", "200ms", "src/components/ReadingContext.jsx", 'transition: "opacity 200ms ease-out"'),
    ("ma-axis", "34", "src/components/ReadingContext.jsx", "const AXIS = 34"),
    ("ma-band-pad", "0.22", "src/components/ReadingContext.jsx", "span * 0.22"),
    ("ma-tick-gap", "11", "src/components/ReadingContext.jsx", "y(val)) > 11"),
    ("ma-series-max", "11", "src/components/ReadingContext.jsx", "slice(-11)"),
    # --- moment B, the dose expectation ---
    ("mb-phase-1", "420ms", "src/components/DoseExpectation.jsx", "setPhase(1), 420"),
    ("mb-phase-2", "900ms", "src/components/DoseExpectation.jsx", "setPhase(2), 900"),
    ("mb-autoclose", "14s", "src/components/DoseExpectation.jsx", "AUTO = 14"),
    # --- moment C, task completion ---
    ("mc-star-base", "380ms", "src/components/TaskCompletion.jsx", "380 + i * 110"),
    ("mc-star-step", "110ms", "src/components/TaskCompletion.jsx", "380 + i * 110"),
    ("mc-star-pop", "420ms", "src/styles/base.css", "starPop 420ms"),
    ("mc-star-delay", "40ms", "src/components/TaskCompletion.jsx", "${i * 40}ms"),
    ("mc-star-max", "12", "src/components/TaskCompletion.jsx", "slice(0, 12)"),
    ("mc-autoclose", "10s", "src/components/TaskCompletion.jsx", "AUTO_SECONDS = 10"),
    # --- the ICP arrival, the fourth of the family ---
    ("md-count-dur", "1400ms", "src/components/IcpConfirmation.jsx", "DUR = 1400"),
    ("md-count-delay", "420ms", "src/components/IcpConfirmation.jsx", "DELAY = 420"),
    ("md-count-exp", "2.6", "src/components/IcpConfirmation.jsx", "Math.pow(1 - t, 2.6)"),
    ("md-autoclose", "16s", "src/components/IcpConfirmation.jsx", "AUTO_SECONDS = 16"),
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--v1", default="/home/user/dniachini-droid/tank-wizard")
    args = ap.parse_args()

    if not os.path.isdir(args.v1):
        print(
            f"The V1 reference repository is not at {args.v1}.\n"
            "It is read-only salvage material and not a dependency of this repository, so\n"
            "this check is skipped rather than failed. Clone it and pass --v1 to run it:\n"
            f"  git clone https://github.com/dniachini-droid/tank-wizard  # at {V1_COMMIT}"
        )
        return 0

    tokens = open(TOKENS, encoding="utf-8").read()
    sources: dict[str, str] = {}
    problems = []

    for token, expected, v1_file, must_contain in CHECKS:
        m = re.search(r"--" + re.escape(token) + r":\s*([^;]+);", tokens)
        got = m.group(1).strip() if m else None
        if got != expected:
            problems.append(f"--{token}: tokens.css has {got!r}, V1 had {expected!r}")
            continue
        if v1_file not in sources:
            path = os.path.join(args.v1, v1_file)
            if not os.path.exists(path):
                problems.append(f"--{token}: {v1_file} is not in the V1 tree")
                continue
            sources[v1_file] = open(path, encoding="utf-8").read()
        if must_contain not in sources[v1_file]:
            problems.append(
                f"--{token}: V1's {v1_file} no longer contains {must_contain!r}. "
                "Either the V1 checkout is at a different commit, or this row is wrong."
            )

    print("=" * 74)
    print("PORTED MOMENT TIMINGS — tokens.css against V1 source")
    print("=" * 74)
    print(f"\nV1: {args.v1}")
    print(f"{len(CHECKS)} values checked\n")
    if problems:
        for p in problems:
            print("  " + p)
        print("\nRESULT: RED")
        return 1
    print("  Every ported timing, easing curve, delay and geometric constant matches")
    print("  the V1 source it was transcribed from.")
    print("\nRESULT: GREEN")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
