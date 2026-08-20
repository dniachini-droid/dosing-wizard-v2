#!/usr/bin/env python3
"""Alk V2 conformance harness — the single command.

    python3 tools/conformance/run-conformance.py                    # no engine
    python3 tools/conformance/run-conformance.py --engine './engine'
    python3 tools/conformance/run-conformance.py --json report.json

Exit code is 0 only when every executed fixture passed, every mechanical check
passed, every executable invariant passed, and the harness could account for
every fixture and every invariant. Anything else is non-zero.

With no engine the run still completes and reports; it does not crash. See
`docs/process/CONFORMANCE-HARNESS.md`.
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from harness import engine_adapter, report as report_mod, runner  # noqa: E402


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(
        prog="run-conformance.py",
        description="Run the Alk V2 fixture corpus and invariant set against an engine.",
    )
    ap.add_argument(
        "--engine",
        metavar="COMMAND",
        help="command to launch an engine speaking the JSON line protocol on stdin/stdout",
    )
    ap.add_argument(
        "--engine-callable",
        metavar="MODULE:ATTR",
        help="in-process Python callable f(request)->EngineResult (used by the mutation harness)",
    )
    ap.add_argument("--only", metavar="FIXTURE_ID", action="append", help="run only these fixtures")
    ap.add_argument("--json", metavar="PATH", help="also write the machine-readable report here")
    ap.add_argument("--quiet", action="store_true", help="print only the verdict block")
    ap.add_argument("--verbose", action="store_true", help="do not elide long lists")
    args = ap.parse_args(argv)

    try:
        engine = engine_adapter.build(args.engine, args.engine_callable)
    except Exception as exc:  # noqa: BLE001
        print(f"could not start the engine: {type(exc).__name__}: {exc}", file=sys.stderr)
        return 2

    try:
        rep = runner.run(engine, only=args.only)
    finally:
        engine.close()

    text = report_mod.render_text(rep, verbose=args.verbose)
    if args.quiet:
        text = text.split("VERDICT")[-1]
        print("VERDICT" + text)
    else:
        print(text)

    if args.json:
        with open(args.json, "w", encoding="utf-8") as fh:
            fh.write(report_mod.render_json(rep))
        print(f"\nmachine-readable report written to {args.json}")

    return rep.exit_code()


if __name__ == "__main__":
    raise SystemExit(main())
