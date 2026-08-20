#!/usr/bin/env python3
"""Mutation harness — the negative controls for the conformance harness.

    python3 tools/conformance/run-mutations.py

For each named sabotage in `mutations/__init__.py` it applies the mutation to
the echo oracle, re-runs the whole conformance harness, and confirms the
harness reports failures it did not report on the unmutated baseline.

A mutation is CAUGHT when the mutated run fails subjects the baseline passed.
The comparison is a delta rather than an absolute verdict because the
repository carries pre-existing document defects that keep the absolute verdict
RED whatever the oracle does; a delta cannot be satisfied by those.

Exit code is 0 only when every EXECUTABLE mutation was caught and every BLOCKED
mutation states its unblocking condition.
"""

from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import mutations as mutation_set  # noqa: E402
from harness import engine_adapter, results as results_mod, runner  # noqa: E402
from reference import echo_oracle  # noqa: E402

RULE = "=" * 78
THIN = "-" * 78


class _OracleEngine(engine_adapter.Engine):
    def __init__(self, oracle, name):
        self._oracle = oracle
        self.name = name

    def assess(self, request):
        try:
            return engine_adapter.EngineReply(ok=True, result=self._oracle(request))
        except Exception as exc:  # noqa: BLE001
            return engine_adapter.EngineReply(ok=False, error=f"{type(exc).__name__}: {exc}")


def _run(hooks, name):
    engine = _OracleEngine(echo_oracle.EchoOracle(hooks), name)
    rep = runner.run(engine)
    return rep, results_mod.failing_subject_ids(rep)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="run-mutations.py")
    ap.add_argument("--only", action="append", metavar="M-n", help="run only these mutations")
    ap.add_argument("--verbose", action="store_true")
    args = ap.parse_args(argv)

    print(RULE)
    print("ALK V2 MUTATION HARNESS — negative controls for the conformance harness")
    print(RULE)
    print("Canon CORE-CANON-COVERAGE-001 item 9: a checker is not trusted as a gate")
    print("until a deliberate mutation of its defect class has been shown to fail it.")
    print("")
    print("Target: tools/conformance/reference/echo_oracle.py — a fixture-echoing")
    print("stand-in, NOT an engine. A caught mutation proves the harness detects that")
    print("defect class. It proves nothing about any engine, because none exists.")
    print("")

    baseline_report, baseline = _run({}, "echo oracle (unmutated)")
    print(f"baseline (unmutated oracle): {len(baseline)} failing subject(s)")
    for s in sorted(baseline):
        print(f"   pre-existing: {s}")
    print("  These are repository document defects, not oracle defects. Every")
    print("  mutation below is judged on what it adds to this set.")
    print("")

    caught, missed, blocked = [], [], []

    for m in mutation_set.MUTATIONS:
        if args.only and m.mid not in args.only:
            continue
        print(THIN)
        print(f"{m.mid}  {m.title}")
        print(f"    defect class : {m.defect_class}")
        print(f"    sabotage     : {m.sabotage}")
        print(f"    guards       : {m.guards}")

        if m.status == mutation_set.BLOCKED:
            blocked.append(m)
            print("    result       : BLOCKED — not executable today")
            print(f"    unblocks when: {m.unblocks_when}")
            print("")
            continue

        _, mutated = _run(m.hooks, f"echo oracle + {m.mid}")
        new = mutated - baseline
        recovered = baseline - mutated

        if new:
            caught.append(m)
            print(f"    result       : CAUGHT — {len(new)} new failing subject(s)")
        else:
            missed.append(m)
            print("    result       : *** NOT CAUGHT *** the harness stayed green on this")

        for s in sorted(new):
            marker = "as expected" if s in m.expect_red else "additional"
            print(f"      went red: {s}  ({marker})")
        for s in sorted(set(m.expect_red) - new):
            note = "already failing at baseline" if s in baseline else "did NOT go red"
            print(f"      expected red but {note}: {s}")
        if recovered:
            for s in sorted(recovered):
                print(f"      !! baseline failure disappeared under mutation: {s}")
        print("")

    print(RULE)
    print("MUTATION SUMMARY")
    print(RULE)
    total = len(caught) + len(missed) + len(blocked)
    print(f"mutations defined : {total}")
    print(f"  caught (red)    : {len(caught)}  {', '.join(m.mid for m in caught)}")
    print(f"  NOT caught      : {len(missed)}  {', '.join(m.mid for m in missed)}")
    print(f"  blocked         : {len(blocked)}  {', '.join(m.mid for m in blocked)}")
    print("")
    if blocked:
        print("BLOCKED MUTATIONS — what must become true")
        for m in blocked:
            print(f"  {m.mid}: {m.unblocks_when}")
        print("")
    if missed:
        print("A mutation the harness did not catch means the harness is not a gate")
        print("for that defect class. Fix the harness, not the mutation.")
    print(f"RESULT: {'RED' if missed else 'GREEN'}")
    print(RULE)
    return 1 if missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
