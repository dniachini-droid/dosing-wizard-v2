#!/usr/bin/env python3
"""The Alk V2 engine, speaking the conformance harness's JSON line protocol.

    python3 tools/conformance/run-conformance.py --engine 'python3 engine/alk-v2-engine.py'

One JSON object per line in, one per line out. This file is the only place in
the engine that touches stdin or stdout; `alk_v2.engine` is pure and
`alk_v2.adapter` reads one document at startup and nothing else.
"""

from __future__ import annotations

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from alk_v2 import adapter  # noqa: E402

PROTOCOL = "alk-v2-conformance/1"


def main() -> int:
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as exc:
            _write({"ok": False, "error": f"request is not JSON: {exc}"})
            continue
        try:
            result = adapter.assess(request)
        except Exception as exc:  # noqa: BLE001 - reported, never raised at the wire
            _write({"ok": False, "error": f"{type(exc).__name__}: {exc}"})
            continue
        if request.get("op") == "describe":
            _write({"ok": True, **result})
        else:
            _write({"ok": True, "engineResult": result})
    return 0


def _write(payload: dict) -> None:
    sys.stdout.write(json.dumps(payload, separators=(",", ":"), default=str) + "\n")
    sys.stdout.flush()


if __name__ == "__main__":
    raise SystemExit(main())
