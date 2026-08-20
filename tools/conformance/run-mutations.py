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
from mutations import documents as doc_mutations  # noqa: E402
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

    def describe(self):
        reply = self.assess({"op": "describe"})
        return reply.result or {}


def _run(hooks, name):
    engine = _OracleEngine(echo_oracle.EchoOracle(hooks), name)
    rep = runner.run(engine)
    return rep, results_mod.failing_subject_ids(rep)


def _failure_texts(rep, subjects):
    """The violation/mismatch text behind each newly-failing subject."""
    texts = []
    for f in rep.fixtures:
        if f"fixture:{f.fixture_id}" in subjects:
            texts.extend(f.mismatches)
    for c in rep.checks:
        if f"check:{c.check_id}" in subjects:
            texts.extend(c.violations)
    for i in rep.invariants:
        if f"invariant:{i.inv_id}" in subjects:
            texts.extend(i.violations)
    return texts


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

        rep, mutated = _run(m.hooks, f"echo oracle + {m.mid}")
        new = mutated - baseline
        recovered = baseline - mutated
        texts = _failure_texts(rep, new)

        declared = set(m.expect_red)
        declared_red = declared & new
        mechanism_hit = (not m.expect_mechanism) or any(
            m.expect_mechanism in t for t in texts
        )

        if not new:
            missed.append((m, "the harness stayed green on this"))
            print("    result       : *** NOT CAUGHT *** the harness stayed green")
        elif declared and not declared_red:
            missed.append((m, "went red, but not on any subject it declared"))
            print(
                "    result       : *** NOT CAUGHT BY ITS NAMED SUBJECT *** "
                f"{len(new)} other subject(s) went red"
            )
        elif not mechanism_hit:
            missed.append(
                (m, f"went red without the mechanism it guards ({m.expect_mechanism!r})")
            )
            print(
                "    result       : *** NOT CAUGHT BY ITS NAMED MECHANISM *** "
                f"nothing said {m.expect_mechanism!r}"
            )
        else:
            caught.append(m)
            print(f"    result       : CAUGHT — {len(new)} new failing subject(s)")
            evidence = next((t for t in texts if m.expect_mechanism in t), "")
            if evidence:
                print(f"    via          : {evidence[:150]}")

        for s_id in sorted(new):
            marker = "as expected" if s_id in declared else "additional"
            print(f"      went red: {s_id}  ({marker})")
        for s_id in sorted(declared - new):
            note = "already failing at baseline" if s_id in baseline else "did NOT go red"
            print(f"      expected red but {note}: {s_id}")
        if recovered:
            for s_id in sorted(recovered):
                print(f"      !! baseline failure disappeared under mutation: {s_id}")
        print("")

    # ---- document mutations ------------------------------------------------
    print(RULE)
    print("DOCUMENT MUTATIONS — controls for the checks that read documents")
    print(RULE)
    print("Every mutation above is a hook on the echo oracle, so none of them can")
    print("reach a check whose subject is a document. These do, by corrupting a")
    print("throwaway copy of the alk-v2 package. The repository is never modified.")
    print("")

    for dm in doc_mutations.DOCUMENT_MUTATIONS:
        if args.only and dm.mid not in args.only:
            continue
        print(THIN)
        print(f"{dm.mid}  {dm.title}")
        print(f"    sabotage     : {dm.sabotage}")
        print(f"    guards       : {dm.guards}")
        try:
            outcome = doc_mutations.run_one(dm)
        except Exception as exc:  # noqa: BLE001
            missed.append((dm, f"the mutation could not be applied: {exc}"))
            print(f"    result       : *** ERROR *** {type(exc).__name__}: {exc}")
            print("")
            continue
        if outcome["wentRed"] and outcome["mechanismHit"]:
            caught.append(dm)
            print(f"    result       : CAUGHT — {dm.expect_check} went red")
            print(f"    via          : {outcome['evidence'][:150]}")
        elif outcome["wentRed"]:
            missed.append((dm, "went red without the mechanism it guards"))
            print(
                f"    result       : *** NOT CAUGHT BY ITS NAMED MECHANISM *** "
                f"nothing said {dm.expect_mechanism!r}"
            )
            print(f"    saw          : {outcome['evidence'][:150]}")
        else:
            missed.append((dm, f"{dm.expect_check} stayed green"))
            print(f"    result       : *** NOT CAUGHT *** {dm.expect_check} stayed green")
        print("")

    print(RULE)
    print("MUTATION SUMMARY")
    print(RULE)
    total = len(caught) + len(missed) + len(blocked)
    print(f"mutations defined : {total}")
    print(f"  caught (red)    : {len(caught)}  {', '.join(m.mid for m in caught)}")
    print(f"  NOT caught      : {len(missed)}  {', '.join(m.mid for m, _ in missed)}")
    print(f"  blocked         : {len(blocked)}  {', '.join(m.mid for m in blocked)}")
    print("")
    print("A mutation counts as caught only when the subject it named goes red AND")
    print("the failure text names the mechanism it claims to guard. Anything less")
    print("is a control that passes for the wrong reason, which is how a checker")
    print("that cannot fire gets published as demonstrated.")
    print("")
    if blocked:
        print("BLOCKED MUTATIONS — what must become true")
        for m in blocked:
            print(f"  {m.mid}: {m.unblocks_when}")
        print("")
    if missed:
        print("NOT CAUGHT — each with why")
        for m, why in missed:
            print(f"  {m.mid}: {why}")
        print("")
        print("A mutation the harness did not catch means the harness is not a gate")
        print("for that defect class. Fix the harness, not the mutation.")
    print(f"RESULT: {'RED' if missed else 'GREEN'}")
    print(RULE)
    return 1 if missed else 0


if __name__ == "__main__":
    raise SystemExit(main())
